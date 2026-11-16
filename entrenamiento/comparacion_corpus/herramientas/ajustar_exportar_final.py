"""Ajuste final y exportación JSON tras validación anidada congelada.

La selección final repite la regla LOGO interna con todas las consultas
humanas. Sólo comprueba finalización/firma del outer; sus scores o etiquetas
no intervienen en selección, calibración, referencias ni configuración.
No modifica el motor/protocolo congelados, el modelo o la aplicación.
"""
from __future__ import annotations

from collections import Counter, defaultdict
from pathlib import Path
import argparse
import importlib.util
import json
import re
import sys
import uuid

import numpy as np

import optimizar_anidado as engine

ROOT = Path(__file__).resolve().parents[1]
DEFAULT_REPO = Path(__file__).resolve().parents[3]
REJECT_THRESHOLD = 2.0
PARITY_TOLERANCE = 1e-5


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def write_artifact(path,artifact):
    """Compact JSON preserves every numeric value and keeps mobile assets small."""
    path=Path(path)
    path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(artifact,ensure_ascii=False,separators=(',',':'),
                               allow_nan=False)+'\n',encoding='utf-8')


def load_objective(path):
    spec = importlib.util.spec_from_file_location('final_frozen_objective',path)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    return module


def check_completed_outer(path, protocol):
    # Only completion metadata is returned. Predictions never reach the fitter.
    outer = read(path)
    if not outer.get('full_outer_run') or outer['protocol_sha256']!=protocol['protocol_sha256']:
        raise ValueError('Se requiere el outer completo del protocolo congelado.')
    if len(outer.get('predictions',[]))!=217 or len(outer.get('folds',[]))!=39:
        raise ValueError('El outer completo no conserva los denominadores predeclarados.')
    return dict(outer_complete=True,outer_file_sha256=engine.file_sha(path),
                outer_scores_used_for_selection=False)


def confirmed_destinations(repo, campus, classes):
    short=engine.CAMPUS_SHORT[campus]
    route_path=repo/('campus' if short=='azc' else 'campus-escom')/'rutas.json'
    routes=read(route_path)
    ids={r['id'] for r in routes['destinos']}
    gallery_path=repo/'app-kmp/androidApp/src/main/assets/reconocimiento'/(
        campus+'_galeria.json' if short=='azc' else 'escom_galeria.json')
    current=read(gallery_path)
    mapping=current.get('destinos',current.get('destinos_escom',{})).copy()
    mapping.update({cls:cls for cls in classes if cls in ids})
    # Only these two NEW correspondences were explicitly confirmed by root.
    approved={'plaza_roja':'PLAZA_ROJA'} if short=='azc' else {'edificio_5':'5'}
    mapping.update(approved)
    result={cls:mapping[cls] for cls in classes if cls in mapping and mapping[cls] in ids and cls!='otro'}
    if any(value not in ids for value in result.values()):
        raise ValueError('La exportación contiene un destino sin ruta confirmada.')
    return result,dict(route_sha256=engine.file_sha(route_path),current_gallery_sha256=engine.file_sha(gallery_path),
                       approved_new_aliases={k:v for k,v in approved.items() if k in classes})


def policy_configuration(classes, policy):
    thresholds, margins = {},{}
    for cls in classes:
        operation=policy['classes'].get(cls,{})
        threshold=operation.get('threshold')
        thresholds[cls]=REJECT_THRESHOLD if threshold is None or cls=='otro' else float(threshold)
        margins[cls]=0.0 if threshold is None or cls=='otro' else float(operation['margin'])
    return thresholds,margins


def make_artifact(data, recipe, policy, campus, variant, repo):
    recipe=engine.as_recipe(recipe)
    train=engine.prepare_training(data,campus,[],recipe)
    fitted=engine.fit_transform(train,recipe.transform,[])
    if recipe.transform!='identidad':
        refs=engine.transform_vectors(train.refs,fitted)
    elif recipe.pooling=='proto3':
        # Exact historical prototypes: no additional reference normalization.
        refs=train.refs.copy()
    else:
        refs=engine.unit(train.refs)
    classes=sorted({r['clase'] for r in train.records})
    prototypes={cls:[] for cls in classes}
    photo_ids={cls:[] for cls in classes}
    local_photos={}
    for row,views in zip(train.records,refs):
        local_photos.setdefault(engine.photo(row),'f_'+uuid.uuid4().hex)
        for vector in views:
            prototypes[row['clase']].append(vector.tolist())
            photo_ids[row['clase']].append(local_photos[engine.photo(row)])
    thresholds,margins=policy_configuration(classes,policy)
    destinations,routes_audit=confirmed_destinations(repo,campus,classes)
    cfg=dict(pooling='prototipos' if recipe.pooling=='proto3' else 'fotos',
             k=3 if recipe.pooling=='proto3' else int(recipe.pooling.removeprefix('photo')),
             vistas_query=3 if recipe.query_mode=='mean3' else 1,
             transformacion=dict(media=fitted['mean'].tolist(),escala=fitted['scale'].tolist()),
             umbral=.8,margen=0.0,umbrales=thresholds,margenes=margins)
    artifact=dict(version=3,estado='experimental',corpus=variant,campus=campus,
                  modelo='escom_embeddings.tflite',sha256_modelo=data.metadata['model_sha256'],
                  dimension=960,entrada=[1,224,224,3],umbral_no_se=.8,
                  clases=classes,prototipos=prototypes,identificadores_foto=photo_ids,
                  destinos=destinations,configuracion=cfg,
                  privacidad='Inferencia local; sin fotografías, personas, GPS, rutas privadas o correspondencias del corpus.')
    validate_artifact(artifact)
    disabled=[c for c in classes if thresholds[c]>1]
    no_destination=[c for c in classes if c not in destinations]
    receipt=dict(variant=variant,campus=campus,selected_recipe=engine.asdict(recipe),
                 photos=len(local_photos),reference_rows=len(train.records),
                 prototypes=sum(len(v) for v in prototypes.values()),classes=len(classes),
                 configuration=cfg,policy=policy,
                 calibration_disabled_classes=disabled,
                 classes_without_destination=no_destination,
                 calibrated_without_destination=[c for c in no_destination if thresholds[c]<=1],
                 enabled_with_destination=[c for c in classes if c in destinations and thresholds[c]<=1],
                 destinations_count=len(destinations),routes_audit=routes_audit,
                 selected_reference_ids_sha256=train.diagnostics['selected_ids_sha256'],
                 final_fit_is_not_an_outer_accuracy_estimate=True)
    return artifact,receipt,train,fitted


def validate_artifact(artifact):
    if artifact['dimension']!=960 or not artifact['clases']:
        raise ValueError('Dimensión o clases inválidas.')
    cfg=artifact['configuracion']
    if set(cfg['umbrales'])!=set(artifact['clases']) or set(cfg['margenes'])!=set(artifact['clases']):
        raise ValueError('Cada clase debe tener una operación explícita, también sin soporte.')
    for cls in artifact['clases']:
        vectors=np.asarray(artifact['prototipos'][cls],dtype=np.float32)
        ids=artifact['identificadores_foto'][cls]
        if vectors.ndim!=2 or vectors.shape[1]!=960 or len(vectors)!=len(ids) or not np.isfinite(vectors).all():
            raise ValueError('Prototipos/identificadores incompatibles.')
        if not all(re.fullmatch(r'f_[0-9a-f]{32}',identifier) for identifier in ids):
            raise ValueError('Identificador de foto no opaco.')
    for name in ('media','escala'):
        x=np.asarray(cfg['transformacion'][name],dtype=np.float32)
        if x.shape!=(960,) or not np.isfinite(x).all():
            raise ValueError('Estadísticos incompatibles.')
    if np.any(np.asarray(cfg['transformacion']['escala'])<=0):
        raise ValueError('La escala debe ser positiva.')
    forbidden=('query','grupo','autor','source','alias_ids','raw_sha','foto_id','GPS')
    if any(key in artifact for key in forbidden):
        raise ValueError('Campo privado inesperado en la galería.')


def score_json(artifact, query_views):
    """Motor JSON independiente: reproduce el contrato móvil, sin verdad humana."""
    cfg=artifact['configuracion']
    q=np.asarray(query_views,dtype=np.float32)
    if q.ndim==1:
        q=q[None,:]
    q=q[:cfg['vistas_query']]
    if q.shape!=(cfg['vistas_query'],960):
        raise ValueError('Faltan vistas de consulta.')
    q=engine.unit(q)
    q=engine.unit((q-np.asarray(cfg['transformacion']['media'],np.float32))*
                  np.asarray(cfg['transformacion']['escala'],np.float32))
    scores={}
    for cls in artifact['clases']:
        refs=np.asarray(artifact['prototipos'][cls],np.float32)
        similarities=q@refs.T
        if cfg['pooling']=='fotos':
            groups=defaultdict(list)
            for i,identifier in enumerate(artifact['identificadores_foto'][cls]):
                groups[identifier].append(i)
            values=np.stack([similarities[:,indices].max(axis=1) for indices in groups.values()],axis=1)
        else:
            values=similarities
        k=min(cfg['k'],values.shape[1])
        values=np.partition(values,values.shape[1]-k,axis=1)[:,-k:]
        scores[cls]=float(values.mean(axis=1).mean())
    order=sorted(scores,key=lambda c:(-scores[c],c))
    best=order[0]
    second=scores[order[1]] if len(order)>1 else -1.0
    accepted=(scores[best]>=cfg['umbrales'][best] and
              scores[best]-second>=cfg['margenes'][best])
    accepted_class=best if accepted else None
    destination=artifact['destinos'].get(accepted_class)
    return dict(class_scores=scores,best_class=best,best_score=scores[best],second_score=second,
                accepted_class=accepted_class,destination_id=destination,
                navigation_class=accepted_class if destination is not None else None)


def parity_check(data,artifact,recipe,train,fitted,campus,*,n_queries=7):
    recipe=engine.as_recipe(recipe)
    indices=data.query_indices(campus=campus)[:n_queries]
    q=data.arrays[data.metadata['queries']['threeviews_array']][indices]
    q_for_engine=q if recipe.query_mode=='mean3' else q[:,:1]
    if recipe.transform=='identidad':
        query=engine.unit(q_for_engine)
        refs=train.refs if recipe.pooling=='proto3' else engine.unit(train.refs)
    else:
        query=engine.transform_vectors(q_for_engine,fitted)
        refs=engine.transform_vectors(train.refs,fitted)
    similarities=np.einsum('qvd,rwd->qvrw',query,refs,optimize=True)
    classes,expected=engine.aggregate_scores(similarities,train.records,recipe.pooling)
    maximum=0.0
    fixtures=[]
    for j,views in enumerate(q):
        observed=score_json(artifact,views)
        errors=[abs(observed['class_scores'][c]-float(s)) for c,s in zip(classes,expected[j])]
        maximum=max(maximum,max(errors,default=0))
        expected_order=sorted(range(len(classes)),key=lambda i:(-float(expected[j,i]),classes[i]))
        if observed['best_class']!=classes[expected_order[0]]:
            raise ValueError('El JSON cambió la clase ganadora del motor congelado.')
        fixtures.append(dict(query_views=views.tolist(),expected=observed))
    if maximum>PARITY_TOLERANCE:
        raise ValueError('El motor JSON supera la tolerancia de paridad numérica.')
    return dict(checked_queries=len(indices),maximum_absolute_class_score_error=maximum,
                tolerance=PARITY_TOLERANCE,passed=True,
                purpose='numerical_equivalence_only_not_accuracy'),fixtures[:1]


def run(root,repo,output_dir):
    protocol=read(root/'anidada/protocolo_congelado.json')
    data=engine.load_banks(root/'privado/bancos_ajuste_metadata.json',root/'privado/bancos_ajuste.npz')
    objective_path=root/'anidada/herramientas/objetivo_anidado.py'
    engine.validate_protocol(protocol,data,objective_source_path=objective_path)
    objective=load_objective(objective_path)
    outer_guard=check_completed_outer(root/'anidada/resultado_anidado_privado.json',protocol)
    output_dir=Path(output_dir)
    receipt_path=output_dir/'recibo_exportaciones_finales.json'
    if receipt_path.exists():
        raise ValueError('Las exportaciones finales ya existen; no se sobrescriben pseudónimos ni recibos.')
    cache=engine.ScoreCache(data,output_dir/'cache_fit_scores_privado')
    selections={}
    exports={}
    fixtures={}
    for short,cfg in protocol['campuses'].items():
        campus=cfg['metadata_campus']
        candidates=engine.build_inner_candidates(data,protocol,short,'__final_fit_no_outer__',cache=cache)
        selection=objective.select_inner(candidates,protocol,short)
        selections[short]=selection
        for variant,recipe,policy in (
            ('maestro',engine.enumerate_comparators()[0],objective.teacher_policy(protocol,short)),
            ('combinado',{k:v for k,v in selection['recipe'].items() if k!='id'},selection['policy'])):
            artifact,info,train,fitted=make_artifact(data,recipe,policy,campus,variant,repo)
            # Round-trip the exact public JSON before the independent motor check.
            artifact=json.loads(json.dumps(artifact,ensure_ascii=False,allow_nan=False))
            parity,fixture=parity_check(data,artifact,recipe,train,fitted,campus)
            info['parity']=parity
            path=output_dir/variant/(campus+'.json')
            write_artifact(path,artifact)
            info['artifact_sha256']=engine.file_sha(path)
            info['artifact_bytes']=path.stat().st_size
            exports.setdefault(variant,{})[short]=info
            fixtures.setdefault(variant,{})[short]=fixture
        print(json.dumps(dict(final_fit_campus=short,selected_recipe=selection['recipe']['recipe_id'],
                              numerical_parity_passed=True)),flush=True)
    engine.write_json(output_dir/'seleccion_final_privada.json',dict(
        protocol_sha256=protocol['protocol_sha256'],selection_role='full_data_inner_LOGO_only',
        outer_scores_used_for_selection=False,selections=selections))
    engine.write_json(output_dir/'fixtures_paridad_privadas.json',dict(
        purpose='numerical_equivalence_only_no_ground_truth_or_corpus_identifiers',fixtures=fixtures))
    receipt=dict(schema_version=1,protocol_sha256=protocol['protocol_sha256'],
                 model_sha256=data.metadata['model_sha256'],exporter_sha256=engine.file_sha(__file__),
                 original_model_modified=False,frozen_sources_modified=False,app_modified=False,
                 outer_guard=outer_guard,selection_rule='same_predeclared_inner_LOGO_29_recipes_per_campus',
                 final_fit_not_outer_estimate=True,exports=exports,
                 query_geometry_limitation='Android bilinear sampling may differ from Pillow cache pixels; numerical fixtures start at embeddings.',
                 privacy='No photographs, names, GPS, corpus IDs, source URLs, private paths or ID correspondences in exported galleries.')
    engine.write_json(receipt_path,receipt)
    return receipt


def main(argv=None):
    parser=argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root',type=Path,default=ROOT)
    parser.add_argument('--repo',type=Path,default=DEFAULT_REPO)
    parser.add_argument('--output',type=Path)
    args=parser.parse_args(argv)
    output=args.output or args.root/'privado/exportaciones_finales'
    receipt=run(args.root,args.repo,output)
    print(json.dumps(dict(exported_variants=list(receipt['exports']),
                          protocol_sha256=receipt['protocol_sha256'],all_parity_checks_passed=True),indent=2))


if __name__=='__main__':
    main()
