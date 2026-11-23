"""Reserva 3D del invernadero exportado frente a las mallas de los edificios.

La envolvente completa incluye paredes, faldones, tres bastidores y largueros.
Las cajas se calculan con vértices reales y matrices mundiales del GLB, sin
umbral de altura ni exclusión de rampas, columnas, azoteas o transparencias.
Son cajas conservadoras: un aviso requiere inspección; cero avisos demuestra
separación respecto a esas cajas, no exactitud de la ubicación en el campus.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import struct
import sys

import numpy as np

from auditar_estacionamientos import accessor_values, local_matrix

ROOT_NAMES = {'P2_invernadero_lateral', 'P2_marco_invernadero', 'P2_bastidor_longitudinal_corpus'}
EXPECTED_ROOTS = {'P2_invernadero_lateral': 1, 'P2_marco_invernadero': 3,
                  'P2_bastidor_longitudinal_corpus': 1}
EPSILON = 1e-6


def collect_meshes(document, binary):
    greenhouse, buildings, roots = [], [], Counter()

    def walk(index, parent, ancestors):
        node = document['nodes'][index]
        name = node.get('name', '')
        names = ancestors + [name]
        world = parent @ local_matrix(node)
        building = next((value for value in names if value.startswith('Edificio_')), None)
        own = building == 'Edificio_P2' and any(value in ROOT_NAMES for value in names)
        if building == 'Edificio_P2' and name in ROOT_NAMES:
            if node.get('extras', {}).get('arquitecturaCorpus') != '2026-11-17':
                raise ValueError('Falta la reconstrucción etiquetada del invernadero.')
            roots[name] += 1
        if building and 'mesh' in node:
            positions = []
            for primitive in document['meshes'][node['mesh']]['primitives']:
                vertices = accessor_values(document, binary, primitive['attributes']['POSITION'])
                positions.append((world @ np.column_stack([vertices, np.ones(len(vertices))]).T).T[:, :3])
            points = np.concatenate(positions)
            if not np.isfinite(points).all():
                raise ValueError('Una malla del edificio contiene coordenadas no finitas.')
            item = dict(node=index, name=name, building=building,
                        low=points.min(axis=0), high=points.max(axis=0))
            (greenhouse if own else buildings).append(item)
        for child in node.get('children', []):
            walk(child, world, names)

    for index in document['scenes'][document.get('scene', 0)]['nodes']:
        walk(index, np.eye(4), [])
    if dict(roots) != EXPECTED_ROOTS or not greenhouse or not buildings:
        raise ValueError('Deben existir cuerpo, tres bastidores, largueros y mallas de edificios.')
    return greenhouse, buildings, dict(roots)


def overlaps_interior(low, high, candidate_low, candidate_high):
    for axis in range(3):
        if candidate_high[axis] - candidate_low[axis] <= EPSILON:
            if not low[axis] + EPSILON < candidate_low[axis] < high[axis] - EPSILON:
                return False
        elif min(high[axis], candidate_high[axis]) - max(low[axis], candidate_low[axis]) <= EPSILON:
            return False
    return True


def analyze(greenhouse, buildings):
    low = np.min([item['low'] for item in greenhouse], axis=0)
    high = np.max([item['high'] for item in greenhouse], axis=0)
    collisions, minimum_gap = [], float('inf')
    for item in buildings:
        gaps = np.maximum(0, np.maximum(low - item['high'], item['low'] - high))
        minimum_gap = min(minimum_gap, float(np.linalg.norm(gaps)))
        if overlaps_interior(low, high, item['low'], item['high']):
            collisions.append(dict(node=item['node'], name=item['name'], building=item['building'],
                candidate_low=item['low'].tolist(), candidate_high=item['high'].tolist(),
                overlap_xyz=(np.minimum(high, item['high']) - np.maximum(low, item['low'])).tolist()))
    return dict(greenhouse_world_bounds={'low': low.tolist(), 'high': high.tolist()},
        greenhouse_meshes=len(greenhouse), building_meshes_checked=len(buildings),
        minimum_building_aabb_distance_model_units=minimum_gap,
        collision_count=len(collisions), collisions=collisions, passed=not collisions)


def run(campus):
    raw = (campus / 'UAM_Azcapotzalco.glb').read_bytes()
    if raw[:4] != b'glTF' or struct.unpack_from('<II', raw, 4) != (2, len(raw)):
        raise ValueError('GLB inválido.')
    length, kind = struct.unpack_from('<II', raw, 12)
    if kind != 0x4E4F534A:
        raise ValueError('El primer bloque GLB no es JSON.')
    document = json.loads(raw[20:20 + length])
    offset = 20 + length
    size, kind = struct.unpack_from('<II', raw, offset)
    if kind != 0x004E4942 or offset + 8 + size > len(raw):
        raise ValueError('Bloque binario GLB inválido.')
    binary = raw[offset + 8:offset + 8 + size]
    greenhouse, buildings, roots = collect_meshes(document, binary)
    result = analyze(greenhouse, buildings)
    result.update(read_only=True, glb_sha256=hashlib.sha256(raw).hexdigest(),
        scope='full_greenhouse_world_vertex_AABB_vs_every_other_exported_building_mesh_AABB',
        greenhouse_roots=roots, no_height_or_transparency_filter=True,
        limitations=['Conservative world-axis-aligned boxes can warn about empty corners.',
            'Zero overlap establishes separation against these boxes, not a topographic or accessibility certificate.',
            'Only building meshes are compared; the greenhouse itself is the sole exclusion.'])
    return result


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('campus', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--strict', action='store_true')
    args = parser.parse_args()
    result = run(args.campus)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in result.items() if k != 'collisions'}, ensure_ascii=True))
    if result['collisions']:
        print(json.dumps(result['collisions'], ensure_ascii=True))
    sys.exit(2 if args.strict and not result['passed'] else 0)
