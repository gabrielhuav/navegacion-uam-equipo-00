"""Ensambla bancos privados desde cachés congeladas, sin inferencias/outer-test.

NPZ: actual_{azc,escom}_refs exactos; anclado_{azc,escom}_refs por foto RGB;
queries_3views y queries_central humanas nativas. Metadata conserva listas
alineadas en banks/queries/baseline_queries, sin rutas ni identidades personales.
"""
from __future__ import annotations
import os
for _name in ('OMP_NUM_THREADS','OPENBLAS_NUM_THREADS','MKL_NUM_THREADS'):
 os.environ.setdefault(_name,'2')
from pathlib import Path
import json,hashlib,collections,re,argparse
import numpy as np

ROOT=Path(__file__).resolve().parents[1]
OLD=None
OUT=ROOT/'privado'
MODEL='d01e31483ac10fc887e5b4e7d47ee0e7a93cc196c56286312329401e219474bd'
CAMPUSES={'azcapotzalco':('azc','uam_azcapotzalco'),'escom':('escom','escom')}

def sha(p):return hashlib.sha256(Path(p).read_bytes()).hexdigest()
def js(p):return json.loads(Path(p).read_text(encoding='utf-8-sig'))
def blob(v):return json.dumps(v,sort_keys=True,ensure_ascii=False,separators=(',',':')).encode()
def op(kind,*values):return kind+'_'+hashlib.sha256('|'.join(map(str,values)).encode()).hexdigest()[:24]
def photo(row):
 assert re.fullmatch('[0-9a-f]{64}',row['sha256_pixeles_raw'])
 return op('rgb',row['sha256_pixeles_raw'])
def unit(v):return v/(np.linalg.norm(v,axis=-1,keepdims=True)+1e-9)
def arr_signature(a):
 a=np.ascontiguousarray(a)
 return dict(shape=list(a.shape),dtype=str(a.dtype),sha256=hashlib.sha256(a.tobytes(order='C')).hexdigest())
def write(p,v):Path(p).write_text(json.dumps(v,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')

def guard(refs,records,queries,qrecords,campus):
 """Únicamente la reproducción histórica exacta; no puntúa bancos anclados."""
 pred=[]
 for i,q in enumerate(qrecords):
  keep=[j for j,r in enumerate(records) if r['grupo']!=q['grupo'] and r['id']!=q['id']]
  v=unit(queries[i]);s=refs[keep].reshape(-1,960)@v
  labels=np.repeat([records[j]['clase'] for j in keep],3)
  scores={c:float(np.sort(s[labels==c])[-3:].mean()) for c in sorted(set(labels))}
  cls=max(scores,key=scores.get)
  pred.append((q['clase'],cls,scores[cls],q.get('eval_subset','')))
 if campus=='azc':
  tp=sum(y=='T' and c=='T' and s>=.74 for y,c,s,_ in pred)
  fp=sum(y!='T' and c=='T' and s>=.74 for y,c,s,_ in pred)
  positives=sum(y=='T' for y,_,_,_ in pred)
  result=dict(n=len(pred),grupos=len({q['grupo'] for q in qrecords}),raw_correct=sum(y==c for y,c,_,_ in pred),tp=tp,fp=fp,fn=positives-tp,tn=len(pred)-positives-fp)
  assert result==dict(n=118,grupos=22,raw_correct=64,tp=38,fp=4,fn=12,tn=64),result
 else:
  night=[x for x in pred if x[3]=='noche']
  result=dict(n=len(pred),noche=len(night),noche_raw_correct=sum(y==c for y,c,_,_ in night))
  assert result==dict(n=96,noche=92,noche_raw_correct=62),result
 return result

def main():
 global ROOT, OLD, OUT
 parser=argparse.ArgumentParser(description=__doc__)
 parser.add_argument('--root',type=Path,default=ROOT,help='Carpeta de trabajo privada')
 parser.add_argument('--evaluacion',type=Path,required=True,help='Entradas privadas de la evaluación reproducida')
 args=parser.parse_args()
 ROOT=args.root.resolve();OLD=args.evaluacion.resolve();OUT=ROOT/'privado'
 OUT.mkdir(parents=True,exist_ok=True)
 files={'evaluation_manifest':OLD/'manifiesto_evaluacion.json','features':OLD/'features_evaluacion.npz',
        'features_metadata':OLD/'features_evaluacion_metadata.json','baselines_config':OLD/'baselines_config_privado.json',
        'retirements_check':OLD/'preflight_retiros_propietario.json'}
 frozen={k:sha(p) for k,p in files.items()}
 allrows=js(files['evaluation_manifest'])['rows'];assert len(allrows)==726
 byid={r['id']:r for r in allrows};assert len(byid)==726
 cfg=js(files['baselines_config']);fm=js(files['features_metadata'])
 assert fm['model_sha256']==MODEL and fm['input_manifest_sha256']==frozen['evaluation_manifest']
 assert fm['npz_sha256']==frozen['features']
 data=np.load(files['features'],allow_pickle=False)
 fi={str(k):i for i,k in enumerate(data['ids'])};assert set(fi)==set(byid)
 train=[r for r in allrows if r['train_allowed']]
 assert len(train)==660
 teachers=[r for r in train if r['human_confirmed']]
 assert len(teachers)==217 and collections.Counter(r['campus'] for r in teachers)=={'uam_azcapotzalco':143,'escom':74}
 immutable_teacher_labels={r['id']:(r['campus'],r['clase']) for r in teachers}
 teacher_by_photo={}
 for r in teachers:
  k=(r['campus'],photo(r))
  assert k not in teacher_by_photo,'Human queries must already be unique by exact RGB'
  teacher_by_photo[k]=r
 block=js(files['retirements_check'])['targets'];assert len(block)==5
 retired_pixels={x['pixel_sha256'] for x in block};retired_sha={x['raw_sha256'] for x in block}
 def blocked(r):return r['sha256_pixeles_raw'] in retired_pixels or r['raw_sha256'] in retired_sha
 assert not any(blocked(r) for r in train)
 query_cache={};cache_files={};cache_errors=[]
 def q3(id):
  meta=fm['features'][id];key=meta['query_cache_key']
  if key not in query_cache:
   p=OLD/'cache_features'/(key+'.npz');assert p.is_file()
   with np.load(p,allow_pickle=False) as z:
    refs=z['refs'].copy();signature=json.loads(str(z['signature'].item()))
    assert refs.shape==(3,960) and refs.dtype==np.float32 and np.isfinite(refs).all()
    assert sha_bytes(refs)==str(z['refs_sha256'].item())
   assert signature['model_sha256']==MODEL and signature['protocol_sha256']==fm['protocol_sha256']
   assert signature['image_sha256']==meta['query_sha256']
   assert hashlib.sha256(blob(signature)).hexdigest()==key
   assert np.allclose(np.linalg.norm(refs,axis=1),1,atol=2e-6,rtol=0)
   query_cache[key]=refs;cache_files[key]=sha(p)
  refs=query_cache[key]
  assert np.array_equal(refs[0],data['query'][fi[id]]),'Query central differs from frozen feature'
  return refs
 def meta_row(r,cls=None,origin=None,baseline=False,teacher=None):
  result=dict(id=r['id'],foto_id=photo(r),campus=r['campus'],clase=cls or r['clase'],
              grupo=r['grupo'],origen=origin or r['origen'],baseline_flag=baseline,
              human_confirmed=bool(teacher is not None),interior=bool(r['interior']),
              interior_known=bool(r.get('interior_conocido',False)),interior_conocido=bool(r.get('interior_conocido',False)),
              is_negative=(cls or r['clase'])=='otro',alias_ids=sorted(set(r.get('alias_ids',[r['id']]))))
  if teacher is not None:
   result['native_teacher_class']=teacher['clase'];result['class_author']='owner'
  else:result['class_author']='Codex' if result['origen']=='web' else 'legacy'
  return result
 arrays={};banks={};baseline_queries={};receipt={};guards={}
 for b in cfg['baselines']:
  short,campus=CAMPUSES[b['campus']]
  gallery_path=Path(b['deployed_gallery_path']);gallery=js(gallery_path)
  assert sha(gallery_path)==b['deployed_gallery_sha256']
  assert gallery['sha256_modelo']==MODEL
  frozen['deployed_'+short]=sha(gallery_path)
  cursor=collections.Counter();actual=[];actual_records=[];base_sources=[]
  for i,br in enumerate(b['reference_rows']):
   r=byid[br['id']];assert r['campus']==campus
   cls=br['clase'];start=cursor[cls];part=gallery['prototipos'][cls][start:start+3];cursor[cls]+=3
   assert len(part)==3
   actual.append(part);base_sources.append((r,br,i))
   teacher=teacher_by_photo.get((campus,photo(r)))
   # El banco exacto conserva las clases/proyecciones legacy. Una foto revisada
   # no hace verdadera una proyección histórica a otro.
   same_teacher=teacher if teacher and teacher['clase']==cls else None
   rec=meta_row(r,cls=cls,origin='alumnos' if same_teacher else 'legacy',baseline=True,teacher=same_teacher)
   rec.update(grupo=br['grupo'],grupo_union=r['grupo'],baseline_index=i,legacy_human_confirmed=bool(br.get('human_confirmed')),retired_by_owner=blocked(r))
   if teacher:rec['native_teacher_class']=teacher['clase']
   actual_records.append(rec)
  assert all(cursor[c]==len(v) for c,v in gallery['prototipos'].items())
  actual=np.asarray(actual,dtype=np.float32)
  assert actual.shape==((118 if short=='azc' else 99),3,960)
  key='actual_'+short;arrays[key+'_refs']=actual
  banks[key]=dict(refs_array=key+'_refs',records=actual_records,classes=list(gallery['clases']),
                  note='Galería vigente exacta; conserva orden, valores, clases y grupos históricos. No normalizar antes del guard.')
  # Agrupar sólo RGB orientado EXACTO. No se consulta ninguna puntuación/test.
  components=collections.OrderedDict()
  for r,br,i in base_sources:
   if blocked(r):continue
   components.setdefault(photo(r),dict(baseline=[],training=[]))['baseline'].append((r,br,i))
  for r in train:
   if r['campus']!=campus:continue
   assert not blocked(r)
   components.setdefault(photo(r),dict(baseline=[],training=[]))['training'].append(r)
  anchor=[];anchor_records=[];native_recoveries=[];unconfirmed=0
  for photoid,comp in components.items():
   olds=comp['baseline'];news=comp['training'];teacher=teacher_by_photo.get((campus,photoid))
   if olds:
    legacy_source,br,i=olds[0];vec=actual[i]
    cls=teacher['clase'] if teacher else br['clase']
    preferred=teacher or legacy_source
    origin='alumnos' if teacher else 'legacy'
    if not teacher:unconfirmed+=1
    if teacher and teacher['clase']!=br['clase']:
     native_recoveries.append(dict(foto_id=photoid,legacy_class=br['clase'],teacher_native_class=teacher['clase']))
   else:
    assert news
    preferred=teacher or sorted(news,key=lambda r:(r['origen']!='web',r['id']))[0]
    cls=preferred['clase'];origin='alumnos' if teacher else 'web'
    vec=np.round(unit(data['refs'][fi[preferred['id']]]),6).astype(np.float32)
   rec=meta_row(preferred,cls=cls,origin=origin,baseline=bool(olds),teacher=teacher)
   sources=[r for r,_,_ in olds]+news
   assert len({r['grupo'] for r in sources})==1,'Exact photo aliases split across groups'
   rec.update(baseline_indices=[i for _,_,i in olds],
              alias_ids=sorted({a for r in sources for a in r.get('alias_ids',[r['id']])}),
              ref_variant='deployed_gallery_exact' if olds else 'new_feature_reference')
   anchor.append(vec);anchor_records.append(rec)
   if teacher:assert rec['clase']==immutable_teacher_labels[teacher['id']][1]
  key='anclado_'+short;arrays[key+'_refs']=np.stack(anchor).astype(np.float32)
  assert len({r['foto_id'] for r in anchor_records})==len(anchor_records)
  banks[key]=dict(refs_array=key+'_refs',records=anchor_records,classes=sorted({r['clase'] for r in anchor_records}),
                  note='Una fila por foto RGB exacta. Conserva referencias vigentes; etiqueta humana nativa prevalece; memoria legacy sin GT humano se identifica como legacy.')
  receipt[short]=dict(actual=len(actual_records),anclado=len(anchor_records),baseline_rgb_aliases_collapsed=len(actual_records)-len({photo(r) for r,_,_ in base_sources}),
                      inherited_unconfirmed_legacy=unconfirmed,human_records=sum(r['human_confirmed'] for r in anchor_records),
                      web_records=sum(r['origen']=='web' for r in anchor_records),teacher_native_recoveries=native_recoveries,
                      retired_current_references=sum(r['retired_by_owner'] for r in actual_records),
                      anchored_class_counts=dict(collections.Counter(r['clase'] for r in anchor_records)))
  # Guard aparte: incluye las118identidades históricas AZC y96ESCOM, no se
  # confunde con las217consultas humanas únicas del ajuste.
  qrecords=[];qvec=[]
  for q in b['query_rows']:
   r=byid[q['id']];rec=meta_row(r,cls=q['clase'],origin='legacy',baseline=True)
   rec.update(grupo=q['grupo'],grupo_union=r['grupo'],eval_subset=q.get('eval_subset',''),legacy_human_confirmed=bool(q.get('human_confirmed')))
   qrecords.append(rec);qvec.append(q3(r['id']))
  qvec=np.stack(qvec).astype(np.float32)
  prefix='actual_'+short+'_queries'
  arrays[prefix+'_3views']=qvec;arrays[prefix+'_central']=qvec[:,0].copy()
  baseline_queries[short]=dict(threeviews_array=prefix+'_3views',central_array=prefix+'_central',records=qrecords,
                              class_aliases=b.get('class_aliases',{}),collapse_unknown_to=b.get('collapse_unknown_to'))
  guards[short]=guard(actual,actual_records,qvec[:,0],qrecords,short)
 # Consultas principales: sólo las217fotos humanas únicas actuales y sus clases
 # NATIVAS; las fuentes legacy nunca se convierten en ground truth.
 teachers=sorted(teachers,key=lambda r:(r['campus'],r['clase'],r['id']))
 qrecords=[meta_row(r,origin='alumnos',teacher=r) for r in teachers]
 qviews=np.stack([q3(r['id']) for r in teachers]).astype(np.float32)
 arrays['queries_3views']=qviews;arrays['queries_central']=qviews[:,0].copy()
 assert len({r['foto_id'] for r in qrecords})==len(qrecords)==217
 assert {r['id']:(r['campus'],r['clase']) for r in teachers}==immutable_teacher_labels
 assert receipt['escom']['inherited_unconfirmed_legacy']==60
 assert len(banks['anclado_azc']['records'])==299 and len(banks['anclado_escom']['records'])==151
 assert not any(blocked(byid[r['id']]) for r in qrecords)
 signatures={k:arr_signature(v) for k,v in arrays.items()}
 signature=hashlib.sha256(blob(signatures)).hexdigest()
 npz_path=OUT/'bancos_ajuste.npz'
 np.savez_compressed(npz_path,**arrays)
 with np.load(npz_path,allow_pickle=False) as saved:
  assert set(saved.files)==set(arrays)
  assert all(np.array_equal(saved[k],v) for k,v in arrays.items())
 metadata=dict(schema_version=1,private=True,model_sha256=MODEL,protocol_sha256=fm['protocol_sha256'],
               arrays=signatures,arrays_signature_sha256=signature,npz_sha256=sha(npz_path),
               banks=banks,queries=dict(threeviews_array='queries_3views',central_array='queries_central',records=qrecords),
               baseline_queries=baseline_queries,counts=receipt,historical_guard=guards,
               sources_sha256=frozen,query_cache_files_verified=len(cache_files),
               teacher_labels_signature_sha256=hashlib.sha256(blob(immutable_teacher_labels)).hexdigest(),
               policies=['No rutas ni nombres en metadata de bancos.','Baseline exacto se reserva separado para reproducir38TP/4FP y62/92 sin normalizar sus prototipos.',
                         'Anclado conserva la memoria vigente; legacy no implica human_confirmed.','Sólo RGB exacto colapsa votos por foto; las tres vistas son una foto, no tres capturas independientes.',
                         'Consultas3vistas naturales se leen de query_cache_key y su central debe ser idéntica a features.query.',
                         'Las217verdades humanas y sus clases nativas no se cambian. Otros campus web se omiten de estos dos bancos de ajuste.',
                         'Las5retiradas se bloquean en anclado y consultas; baseline exacto no se altera para el guard.'],
               inference_run=False,candidate_outer_evaluation_run=False,originals_modified=False)
 def no_paths(v):
  if isinstance(v,dict):
   assert not any(k in {'ruta','raw_ruta','query_ruta','alumno','nombre','entrega_url','source_path'} for k in v)
   for x in v.values():no_paths(x)
  elif isinstance(v,list):
   for x in v:no_paths(x)
  elif isinstance(v,str):assert not re.search(r'[A-Za-z]:[\\/]',v)
 no_paths(metadata)
 write(OUT/'bancos_ajuste_metadata.json',metadata)
 receipt_out=dict(schema_version=1,private=True,arrays_signature_sha256=signature,npz_sha256=sha(npz_path),counts=receipt,
                  queries=dict(total=217,azc=143,escom=74,query0_equal_to_frozen_features=True,views_per_photo=3),historical_guard=guards,
                  query_cache_files_verified=len(cache_files),blocked_retirements=0,candidate_outer_evaluation_run=False)
 write(OUT/'recibo_bancos_ajuste.json',receipt_out)
 assert all(sha(p)==frozen[k] for k,p in files.items())
 for b in cfg['baselines']:
  assert sha(b['deployed_gallery_path'])==frozen['deployed_'+CAMPUSES[b['campus']][0]]
 print(json.dumps(dict(npz=str(npz_path),metadata=str(OUT/'bancos_ajuste_metadata.json'),metadata_sha256=sha(OUT/'bancos_ajuste_metadata.json'),**receipt_out),ensure_ascii=False,indent=2),flush=True)

def sha_bytes(a):return hashlib.sha256(a.tobytes(order='C')).hexdigest()
if __name__=='__main__':main()
