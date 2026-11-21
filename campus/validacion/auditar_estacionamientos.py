"""Inspección geométrica de estacionamientos exportados; nunca escribe el campus.

Uso: python auditar_estacionamientos.py <campus> [--output informe.json]
No valida el levantamiento topográfico: detecta solapamientos del modelo local.
"""
from __future__ import annotations
import argparse
from collections import Counter
import hashlib
import itertools
import json
import math
from pathlib import Path
import struct
import sys

import numpy as np


def local_matrix(node):
    if 'matrix' in node:
        return np.asarray(node['matrix'], dtype=float).reshape(4, 4).T
    x, y, z, w = node.get('rotation', [0, 0, 0, 1])
    result = np.eye(4)
    result[:3, :3] = [[1-2*(y*y+z*z), 2*(x*y-z*w), 2*(x*z+y*w)],
                      [2*(x*y+z*w), 1-2*(x*x+z*z), 2*(y*z-x*w)],
                      [2*(x*z-y*w), 2*(y*z+x*w), 1-2*(x*x+y*y)]]
    result[:3, :3] *= np.asarray(node.get('scale', [1, 1, 1]))[None, :]
    result[:3, 3] = node.get('translation', [0, 0, 0])
    return result


def mesh_bounds(gltf, node, world):
    if 'mesh' not in node:
        return None
    points = []
    for primitive in gltf['meshes'][node['mesh']]['primitives']:
        accessor = gltf['accessors'][primitive['attributes']['POSITION']]
        for point in itertools.product(*zip(accessor['min'], accessor['max'])):
            points.append((world @ np.array([*point, 1.0]))[:3])
    return np.min(points, axis=0), np.max(points, axis=0)


def overlap(a, b):
    return max(0., min(a[2], b[2])-max(a[0], b[0])) * max(0., min(a[3], b[3])-max(a[1], b[1]))


def accessor_values(gltf, binary, index):
    accessor=gltf['accessors'][index]
    view=gltf['bufferViews'][accessor['bufferView']]
    dtype={5126:'<f4',5125:'<u4',5123:'<u2',5121:'u1'}[accessor['componentType']]
    columns={'SCALAR':1,'VEC2':2,'VEC3':3,'VEC4':4}[accessor['type']]
    offset=view.get('byteOffset',0)+accessor.get('byteOffset',0)
    item=np.dtype(dtype).itemsize
    stride=view.get('byteStride',columns*item)
    values=np.ndarray((accessor['count'],columns),dtype=dtype,buffer=binary,offset=offset,strides=(stride,item))
    return values.copy()


def top_triangles(gltf,binary,node,world,top_y):
    result=[]
    for primitive in gltf['meshes'][node['mesh']]['primitives']:
        if primitive.get('mode',4)!=4:continue
        vertices=accessor_values(gltf,binary,primitive['attributes']['POSITION'])
        positions=(world@np.column_stack([vertices,np.ones(len(vertices))]).T).T[:,:3]
        indices=(accessor_values(gltf,binary,primitive['indices']).ravel()
                 if 'indices' in primitive else np.arange(len(positions)))
        for tri in positions[indices.reshape(-1,3)]:
            if np.max(np.abs(tri[:,1]-top_y))<1e-4:
                p=tri[:,[0,2]]
                if abs(np.cross(p[1]-p[0],p[2]-p[0]))>1e-10:result.append(p)
    return result


def triangle_rect_area(triangle,rect):
    points=[list(p) for p in triangle]
    for axis,bound,positive in [(0,rect[0],True),(0,rect[2],False),(1,rect[1],True),(1,rect[3],False)]:
        if not points:return 0.
        previous=points[-1];previous_in=previous[axis]>=bound if positive else previous[axis]<=bound
        clipped=[]
        for point in points:
            inside=point[axis]>=bound if positive else point[axis]<=bound
            if inside!=previous_in:
                t=(bound-previous[axis])/(point[axis]-previous[axis])
                clipped.append([previous[i]+t*(point[i]-previous[i]) for i in range(2)])
            if inside:clipped.append(point)
            previous,previous_in=point,inside
        points=clipped
    if len(points)<3:return 0.
    return abs(sum(points[i][0]*points[(i+1)%len(points)][1]-points[(i+1)%len(points)][0]*points[i][1] for i in range(len(points))))/2


def triangle_polygon_area(triangle,polygon):
    """Área exacta de un triángulo recortado por una huella convexa."""
    points=[list(p) for p in triangle]
    polygon=[list(p) for p in polygon]
    signed=sum(polygon[i][0]*polygon[(i+1)%len(polygon)][1]-polygon[(i+1)%len(polygon)][0]*polygon[i][1] for i in range(len(polygon)))
    if signed<0:polygon.reverse()
    for i,a in enumerate(polygon):
        if not points:return 0.
        b=polygon[(i+1)%len(polygon)]
        distance=lambda p:(b[0]-a[0])*(p[1]-a[1])-(b[1]-a[1])*(p[0]-a[0])
        previous=points[-1];dp=distance(previous);clipped=[]
        for point in points:
            dq=distance(point)
            if (dp>=0)!=(dq>=0):
                t=dp/(dp-dq)
                clipped.append([previous[j]+t*(point[j]-previous[j]) for j in range(2)])
            if dq>=0:clipped.append(point)
            previous,dp=point,dq
        points=clipped
    if len(points)<3:return 0.
    return abs(sum(points[i][0]*points[(i+1)%len(points)][1]-points[(i+1)%len(points)][0]*points[i][1] for i in range(len(points))))/2


def canonical_footprint(building,rect,scale):
    """Respeta el rombo de pabellones, que no ocupa las esquinas de su caja."""
    factor=math.sqrt(.5) if building.get('diamond') else 1.
    width=(rect[2]-rect[0])*scale*factor;depth=(rect[3]-rect[1])*scale*factor
    cx=((rect[0]+rect[2])/2-895)*scale+building.get('offsetX',0)
    cz=((rect[1]+rect[3])/2-390)*scale+building.get('offsetZ',0)
    yaw=building.get('facadeYaw',math.pi/4) if building.get('diamond') else 0.
    c,s=math.cos(yaw),math.sin(yaw)
    return [[cx+x*c+z*s,cz-x*s+z*c] for x,z in [(-width/2,-depth/2),(width/2,-depth/2),(width/2,depth/2),(-width/2,depth/2)]]


def run(campus):
    data = json.loads((campus/'campus_editado.json').read_text(encoding='utf-8'))
    raw = (campus/'UAM_Azcapotzalco.glb').read_bytes()
    assert raw[:4] == b'glTF' and struct.unpack_from('<I', raw, 8)[0] == len(raw)
    gltf = json.loads(raw[20:20+struct.unpack_from('<I', raw, 12)[0]])
    next_chunk=20+struct.unpack_from('<I',raw,12)[0]
    binary=raw[next_chunk+8:next_chunk+8+struct.unpack_from('<I',raw,next_chunk)[0]]
    s = data['metersPerPixel']
    buildings = []
    for building in data['buildings']:
        for rect in building['rects']:
            polygon=canonical_footprint(building,rect,s)
            xs,zs=zip(*polygon)
            buildings.append((building['id'],[min(xs),min(zs),max(xs),max(zs)],polygon))
    observed = []
    edit_ids = []

    def walk(index, parent, ancestors):
        node = gltf['nodes'][index]
        name = node.get('name', '')
        world = parent @ local_matrix(node)
        bounds = mesh_bounds(gltf, node, world)
        editable = node.get('extras', {}).get('editableId')
        if editable:
            edit_ids.append(editable)
        if bounds:
            lo, hi = bounds
            observed.append(dict(index=index, name=name, ancestors=ancestors,
                                 rect=[lo[0], lo[2], hi[0], hi[2]],
                                 bottom=lo[1], top=hi[1], world_center=world[:3, 3].tolist(),
                                 top_triangles=top_triangles(gltf,binary,node,world,hi[1])))
        for child in node.get('children', []):
            walk(child, world, ancestors + [name])

    for node in gltf['scenes'][gltf.get('scene', 0)]['nodes']:
        walk(node, np.eye(4), [])
    names = {'Cajón', 'Tope_cajon', 'Linea_cabecera_bateria', 'Camellon_estacionamiento',
             'Area_verde_camellon', 'Carril_circulacion_interna', 'Linea_carril_vial',
             'Guarnicion_estacionamiento', 'Cajon_accesible_azul', 'Carril_vial_conexion'}
    details = [x for x in observed if x['name'] in names]
    collisions = []
    for item in details:
        for building, rect, polygon in buildings:
            if overlap(item['rect'],rect)<=.05:continue
            area=sum(triangle_polygon_area(triangle,polygon) for triangle in item['top_triangles'])
            if area > .05:
                collisions.append(dict(name=item['name'], index=item['index'], building=building,
                                       area_m2=round(area, 4),
                                       parking=next((a for a in item['ancestors'] if a.startswith('Estacionamiento_editable_')), None),
                                       center=item['world_center']))
    # AABB inspection only: curved pavilion envelope includes empty corner regions.
    by_pair = Counter((c['parking'], c['name'], c['building']) for c in collisions)
    layers = {}
    for item in details:
        layers.setdefault(item['name'], set()).add((round(item['bottom'], 5), round(item['top'], 5)))
    return dict(read_only=True, campus_scale=s, storey_height=data['storeyHeight'],
                glb_sha256=hashlib.sha256(raw).hexdigest(), nodes=len(gltf['nodes']),
                named_detail_counts=dict(Counter(x['name'] for x in details)),
                editable_ids_unique=len(edit_ids)==len(set(edit_ids)),
                expected_parking_ids_present=all('parking_'+str(i) in edit_ids for i in range(len(data['parking']))),
                plan_dimensions=list(struct.unpack('>II', (campus/'plano_2d.png').read_bytes()[16:24])),
                layer_y_bounds={k:sorted(v) for k,v in layers.items()},
                building_envelope_intersections=dict(total=len(collisions),
                    by_parking_name_building=[dict(parking=p, name=n, building=b, count=c) for (p,n,b),c in sorted(by_pair.items(),key=str)],
                    items=collisions),
                limitation='Actual top-face triangles clipped against canonical footprint polygons with diamond yaw/scale/offset, so clipped fragments and pavilion empty corners do not create AABB false positives. Curved/open pavilion outlines use their rotated canonical envelopes; this is not a topographic measurement.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('campus', type=Path)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--strict',action='store_true',help='Código de salida 2 si encuentra alguna intersección con edificios')
    args = parser.parse_args()
    report = run(args.campus)
    if args.output:
        args.output.parent.mkdir(parents=True, exist_ok=True)
        args.output.write_text(json.dumps(report, ensure_ascii=False, indent=2)+'\n', encoding='utf-8')
    print(json.dumps({k:v for k,v in report.items() if k!='building_envelope_intersections'}, ensure_ascii=True))
    print(json.dumps(report['building_envelope_intersections']['by_parking_name_building'],ensure_ascii=True))
    sys.exit(2 if args.strict and report['building_envelope_intersections']['total'] else 0)
