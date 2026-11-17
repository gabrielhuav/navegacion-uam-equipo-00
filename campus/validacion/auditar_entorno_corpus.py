"""Audita las huellas reales del mobiliario del corpus en el GLB exportado.

Proyecta cada triángulo físico a XZ y calcula su distancia al segmento de ruta.
El corredor continuo de 1.8 unidades incluye ambos extremos redondeados.
No usa las decisiones de colocación ni las envolventes convexas del generador.
No certifica accesibilidad, altura libre ni el mobiliario antiguo no etiquetado.
"""
from __future__ import annotations

import argparse
from collections import Counter
import hashlib
import json
import math
from pathlib import Path
import struct
import sys

import numpy as np

from auditar_estacionamientos import accessor_values, local_matrix, triangle_polygon_area

ENVIRONMENT = '2026-11-17-entorno'
DISTANCE_EPSILON = 1e-6


def cross(a, b):
    return a[0] * b[1] - a[1] * b[0]


def point_segment_distance(point, a, b):
    direction = b - a
    length_squared = float(direction @ direction)
    if length_squared == 0:
        return float(np.linalg.norm(point - a))
    parameter = max(0., min(1., float((point - a) @ direction) / length_squared))
    return float(np.linalg.norm(point - (a + parameter * direction)))


def segment_triangle_distance(a, b, triangle):
    """Distancia euclídea exacta en 2D; respeta los huecos entre triángulos."""
    for point in (a, b):
        signs = [cross(triangle[(i + 1) % 3] - triangle[i], point - triangle[i])
                 for i in range(3)]
        if min(signs) >= -1e-12 or max(signs) <= 1e-12:
            return 0.
    minimum = math.inf
    for i, p in enumerate(triangle):
        q = triangle[(i + 1) % 3]
        if (cross(b - a, p - a) * cross(b - a, q - a) < 0 and
                cross(q - p, a - p) * cross(q - p, b - p) < 0):
            return 0.
        minimum = min(minimum, point_segment_distance(p, a, b),
                      point_segment_distance(q, a, b), point_segment_distance(a, p, q),
                      point_segment_distance(b, p, q))
    return minimum


def corridor_rectangle(a, b, width):
    delta = b - a
    length = float(np.linalg.norm(delta))
    if length < 1e-8:
        raise ValueError('Una arista canónica tiene longitud cero.')
    offset = np.array([-delta[1], delta[0]]) / length * width / 2
    return [a + offset, b + offset, b - offset, a - offset]


def bounds(points):
    values = np.asarray(points)
    return values.min(axis=0), values.max(axis=0)


def potentially_intersects(a, b):
    return bool(np.all(np.minimum(a[1], b[1]) - np.maximum(a[0], b[0]) > 1e-10))


def run(campus, width=1.8):
    if not math.isfinite(width) or width <= 0:
        raise ValueError('El ancho del corredor debe ser positivo y finito.')
    raw = (campus / 'UAM_Azcapotzalco.glb').read_bytes()
    if raw[:4] != b'glTF' or struct.unpack_from('<II', raw, 4) != (2, len(raw)):
        raise ValueError('GLB inválido.')
    json_length, json_type = struct.unpack_from('<II', raw, 12)
    if json_type != 0x4E4F534A:
        raise ValueError('El primer bloque GLB no es JSON.')
    gltf = json.loads(raw[20:20 + json_length])
    binary_offset = 20 + json_length
    binary_length, binary_type = struct.unpack_from('<II', raw, binary_offset)
    if binary_type != 0x004E4942 or binary_offset + 8 + binary_length > len(raw):
        raise ValueError('Bloque binario GLB inválido.')
    binary = raw[binary_offset + 8:binary_offset + 8 + binary_length]
    net = json.loads((campus / 'rutas.json').read_text(encoding='utf-8'))
    route_nodes = {n['id']: np.array([n['x'], n['z']], dtype=float) for n in net['nodos']}
    if not net['aristas'] or any(not np.isfinite(p).all() for p in route_nodes.values()):
        raise ValueError('La red debe contener aristas y coordenadas finitas.')
    corridors = []
    for edge in net['aristas']:
        a, b = route_nodes[edge['de']], route_nodes[edge['a']]
        rectangle = corridor_rectangle(a, b, width)
        capsule_bounds = (np.minimum(a, b) - width / 2, np.maximum(a, b) + width / 2)
        corridors.append((edge['de'] + '-' + edge['a'], a, b, rectangle, capsule_bounds))
    obstacles, surfaces, tagged_mesh_count = [], [], 0

    def walk(index, parent):
        nonlocal tagged_mesh_count
        node = gltf['nodes'][index]
        world = parent @ local_matrix(node)
        extras = node.get('extras', {})
        if 'mesh' in node and extras.get('corpusEnvironment') == ENVIRONMENT:
            tagged_mesh_count += 1
            if not isinstance(extras.get('pedestrianObstacle'), bool):
                raise ValueError('Una malla etiquetada carece de clasificación física explícita.')
            record = dict(node=index, name=node.get('name', ''),
                          existing_footprint_preserved=bool(extras.get('existingFootprintPreserved')))
            if extras['pedestrianObstacle']:
                triangles = []
                for primitive in gltf['meshes'][node['mesh']]['primitives']:
                    if primitive.get('mode', 4) != 4:
                        raise ValueError('Un obstáculo usa un tipo de primitiva no soportado.')
                    vertices = accessor_values(gltf, binary, primitive['attributes']['POSITION'])
                    actual = (world @ np.column_stack([vertices, np.ones(len(vertices))]).T).T[:, [0, 2]]
                    if not np.isfinite(actual).all():
                        raise ValueError('Un obstáculo contiene coordenadas no finitas.')
                    indices = (accessor_values(gltf, binary, primitive['indices']).ravel()
                               if 'indices' in primitive else np.arange(len(actual)))
                    for triangle in actual[indices.reshape(-1, 3)]:
                        if abs(cross(triangle[1] - triangle[0], triangle[2] - triangle[0])) > 1e-10:
                            triangles.append(triangle)
                if not triangles:
                    raise ValueError('Un obstáculo no tiene triángulos proyectables sobre el suelo.')
                record.update(triangles=triangles, bounds=bounds(np.concatenate(triangles)))
                obstacles.append(record)
            else:
                surfaces.append(record)
        for child in node.get('children', []):
            walk(child, world)

    for index in gltf['scenes'][gltf.get('scene', 0)]['nodes']:
        walk(index, np.eye(4))
    if not obstacles:
        raise ValueError('La exportación no contiene obstáculos etiquetados del corpus.')
    collisions = []
    for item in obstacles:
        for edge, a, b, rectangle, capsule_bounds in corridors:
            if not potentially_intersects(item['bounds'], capsule_bounds):
                continue
            minimum, maximum_area = math.inf, 0.
            for triangle in item['triangles']:
                if potentially_intersects(bounds(triangle), capsule_bounds):
                    minimum = min(minimum, segment_triangle_distance(a, b, triangle))
                    maximum_area = max(maximum_area, triangle_polygon_area(triangle, rectangle))
            if minimum < width / 2 - DISTANCE_EPSILON:
                collisions.append(dict(node=item['node'], name=item['name'], edge=edge,
                    existing_footprint_preserved=item['existing_footprint_preserved'],
                    minimum_distance_to_route_axis=minimum,
                    maximum_single_projected_triangle_rectangle_overlap=maximum_area))
    existing = [c for c in collisions if c['existing_footprint_preserved']]
    new = [c for c in collisions if not c['existing_footprint_preserved']]
    return dict(read_only=True, glb_sha256=hashlib.sha256(raw).hexdigest(),
        scope='tagged_environment_actual_triangles_vs_continuous_route_capsules',
        route_width_model_units=width, round_end_caps=True, canonical_edges=len(corridors),
        tagged_meshes=tagged_mesh_count, physical_obstacle_meshes=len(obstacles),
        ground_or_non_obstacle_meshes_excluded=len(surfaces),
        physical_mesh_names=dict(Counter(x['name'] for x in obstacles)),
        existing_footprint_meshes=sum(x['existing_footprint_preserved'] for x in obstacles),
        new_footprint_meshes=sum(not x['existing_footprint_preserved'] for x in obstacles),
        collisions=collisions, collision_count=len(collisions),
        new_footprint_collision_count=len(new), preserved_footprint_collision_count=len(existing),
        passed=not collisions,
        limitations=['No es un certificado completo de transitabilidad ni accesibilidad.',
            'Sólo mallas corpusEnvironment=2026-11-17-entorno; se excluye mobiliario antiguo sin etiqueta.',
            'No filtra altura: se compara la proyección física de los triángulos contra el corredor continuo.',
            'El área auxiliar corresponde al mayor triángulo contra el rectángulo, no al área unión del mueble.'])


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('campus', type=Path)
    parser.add_argument('--width', type=float, default=1.8)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--strict', action='store_true')
    args = parser.parse_args()
    result = run(args.campus, args.width)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2) + '\n', encoding='utf-8')
    print(json.dumps({k: v for k, v in result.items() if k not in ['collisions', 'physical_mesh_names']},
                     ensure_ascii=True))
    if result['collisions']:
        print(json.dumps(result['collisions'], ensure_ascii=True))
    sys.exit(2 if args.strict and not result['passed'] else 0)
