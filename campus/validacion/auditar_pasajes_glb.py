"""Comprueba pasajes peatonales contra cubos físicos del GLB exportado.

Intersección exacta de segmentos con BoxGeometry, usando la matriz mundial
inversa de cada malla. Las superficies curvas y otras mallas quedan fuera:
este ensayo detecta obstrucciones, no garantiza accesibilidad total.
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
from auditar_estacionamientos import local_matrix


def run(campus, height=1.0, min_cut=.2, width=0.):
    raw=(campus/'UAM_Azcapotzalco.glb').read_bytes()
    assert raw[:4]==b'glTF' and struct.unpack_from('<I',raw,8)[0]==len(raw)
    gltf=json.loads(raw[20:20+struct.unpack_from('<I',raw,12)[0]])
    net=json.loads((campus/'rutas.json').read_text(encoding='utf-8'))
    byid={n['id']:n for n in net['nodos']}
    boxes=[]

    def walk(index,parent,ancestors):
        node=gltf['nodes'][index]
        world=parent@local_matrix(node)
        names=ancestors+[node.get('name','')]
        building=next((s for s in ancestors if s.startswith('Edificio_')),None)
        if 'mesh' in node and building:
            primitive=gltf['meshes'][node['mesh']]['primitives'][0]
            accessor=gltf['accessors'][primitive['attributes']['POSITION']]
            # The shared BoxGeometry(1,1,1), independent of material or name.
            if accessor['count']==24 and np.allclose(accessor['min'],[-.5]*3) and np.allclose(accessor['max'],[.5]*3):
                boxes.append((index,node.get('name'),building,np.linalg.inv(world),world))
        for child in node.get('children',[]):
            walk(child,world,names)

    for root in gltf['scenes'][gltf.get('scene',0)]['nodes']:
        walk(root,np.eye(4),[])
    collisions=[]
    for edge in net['aristas']:
        a,b=byid[edge['de']],byid[edge['a']]
        base_a=np.array([a['x'],height,a['z'],1.]);base_b=np.array([b['x'],height,b['z'],1.])
        length=np.linalg.norm(base_a-base_b)
        perpendicular=np.array([-(base_b[2]-base_a[2]),0.,base_b[0]-base_a[0],0.])/length
        offsets=[0.] if not width else [-width/2,0.,width/2]
        for offset in offsets:
            aw=base_a+perpendicular*offset;bw=base_b+perpendicular*offset
            for index,name,building,inverse,world in boxes:
                p=(inverse@aw)[:3];delta=(inverse@(bw-aw))[:3];low,high=0.,1.
                # Shrink each cube a little to ignore boundary-only contact.
                for axis in range(3):
                    if abs(delta[axis])<1e-12:
                        if not -.49999<=p[axis]<=.49999:
                            low,high=1.,0.;break
                    else:
                        t0,t1=sorted([(-.49999-p[axis])/delta[axis],(.49999-p[axis])/delta[axis]])
                        low=max(low,t0);high=min(high,t1)
                penetration=max(0.,high-low)*length
                if penetration>min_cut:
                    collisions.append(dict(edge=edge['de']+'-'+edge['a'],edge_type=edge['tipo'],name=name,
                                           building=building,penetration_m=round(float(penetration),4),node=index,
                                           probe_offset_m=offset,
                                           edge_world_xz=[[aw[0],aw[2]],[bw[0],bw[2]]],
                                           mesh_world_center=world[:3,3].tolist(),
                                           mesh_world_matrix=world.tolist()))
    return dict(read_only=True,scope='exact_segment_vs_exported_building_BoxGeometry',
                glb_sha256=hashlib.sha256(raw).hexdigest(),height_m=height,min_penetration_m=min_cut,
                probe_width_m=width,
                route_nodes=len(net['nodos']),route_edges=len(net['aristas']),route_destinations=len(net['destinos']),
                building_boxes_tested=len(boxes),collisions=collisions,
                collision_counts_by_building=dict(Counter(x['building'] for x in collisions)),
                limitation='Optional width probes are three parallel segments, not a continuous clearance/accessibility certificate. No curved or non-box meshes; zero collisions is necessary but not sufficient for walkability.')


if __name__=='__main__':
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('campus',type=Path)
    parser.add_argument('--height',type=float,default=1.)
    parser.add_argument('--min-cut',type=float,default=.2)
    parser.add_argument('--width',type=float,default=0.,help='Añade dos segmentos laterales a +/− ancho/2; prueba aproximada')
    parser.add_argument('--output',type=Path)
    parser.add_argument('--strict',action='store_true',help='Código de salida 2 si encuentra algún corte')
    parser.add_argument('--summary',action='store_true',help='Mostrar sólo cuentas; el archivo --output conserva el detalle')
    args=parser.parse_args()
    report=run(args.campus,args.height,args.min_cut,args.width)
    if args.output:
        args.output.parent.mkdir(parents=True,exist_ok=True)
        args.output.write_text(json.dumps(report,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    shown={k:v for k,v in report.items() if k!='collisions'} if args.summary else report
    if args.summary:shown['collision_count']=len(report['collisions'])
    print(json.dumps(shown,ensure_ascii=True))
    sys.exit(2 if args.strict and report['collisions'] else 0)
