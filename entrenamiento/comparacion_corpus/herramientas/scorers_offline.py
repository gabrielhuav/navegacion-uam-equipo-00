"""Funciones puras para comparar galerías offline; no leen archivos ni evalúan un test.

Filas: id, campus, clase, grupo, sha256; opcionales raw_sha256/foto_id para
agrupar una toma y fuente/source_group para limitar su procedencia. Features:
dict[id] con refs[3,D]; query no se consulta al seleccionar ni ajustar estadísticos.
Las particiones y la autorización de adiciones pertenecen al llamador.
"""
from __future__ import annotations

from collections import Counter, defaultdict
import math
from typing import Iterable, Mapping, Sequence

import numpy as np


def _foto(row):
    return str(row.get('foto_id') or row.get('raw_sha256') or row['sha256'])


def _fuente(row):
    return str(row.get('fuente') or row.get('source_group') or row['grupo'])


def _rows(rows):
    result=list(rows)
    seen=set()
    for row in result:
        if any(k not in row for k in ('id','campus','clase','grupo','sha256')):
            raise ValueError('Faltan campos de referencia.')
        if row['id'] in seen:raise ValueError('ID repetido en referencias.')
        seen.add(row['id'])
        if not row['clase'] or not row['grupo']:raise ValueError('Clase o grupo vacío.')
    return result


def _unit(x):
    values=np.asarray(x,dtype=np.float32)
    if not np.isfinite(values).all():raise ValueError('Vector no finito.')
    norms=np.linalg.norm(values,axis=-1,keepdims=True)
    if np.any(norms<1e-8):raise ValueError('Vector nulo; no admite puntuación coseno.')
    return values/norms


def seleccionar_referencias(rows:Sequence[dict],baseline_ids:Iterable[str],addition_ids:Iterable[str],
                            blocked_groups:Iterable[str]=(),*,max_fotos_por_fuente_clase:int|None=None,
                            max_fotos_por_clase:int|None=None,quality_by_id:Mapping[str,float]|None=None):
    """Conserva todos los baseline autorizados y añade sólo IDs curados del train.

    Los límites nunca retiran una referencia baseline; si ésta ya excede un
    límite, no se admite más material en esa celda. Una adición que repite foto
    existente no añade otro voto. No utiliza consultas ni etiquetas del test.
    Devuelve (filas seleccionadas, diagnóstico agregado y motivos por ID).
    """
    rows=_rows(rows)
    byid={r['id']:r for r in rows}
    baseline=set(baseline_ids);additions=set(addition_ids)
    blocked=set(blocked_groups)
    if not (baseline|additions)<=set(byid):raise ValueError('Se solicitaron IDs inexistentes.')
    for limit in (max_fotos_por_fuente_clase,max_fotos_por_clase):
        if limit is not None and (not isinstance(limit,int) or isinstance(limit,bool) or limit<1):
            raise ValueError('Los límites deben ser enteros positivos o None.')
    if any(byid[i]['grupo'] in blocked for i in baseline):
        raise ValueError('Una referencia baseline invade un grupo retenido.')
    qualities=dict(quality_by_id or {})
    if any(not math.isfinite(float(v)) for v in qualities.values()):raise ValueError('Calidad no finita.')
    selected=[];reasons={};photo_labels={};class_units=defaultdict(set);source_units=defaultdict(set)

    def add(row):
        photo=(row['campus'],_foto(row))
        if photo in photo_labels and photo_labels[photo]!=row['clase']:
            raise ValueError('La misma toma tiene clases incompatibles; resolver antes de seleccionar.')
        photo_labels[photo]=row['clase']
        selected.append(row)
        class_units[(row['campus'],row['clase'])].add(_foto(row))
        source_units[(row['campus'],row['clase'],_fuente(row))].add(_foto(row))

    for row in rows:
        if row['id'] in baseline:add(row)
    for identifier in sorted(additions-baseline,key=lambda i:(-float(qualities.get(i,0)),i)):
        row=byid[identifier];cls=(row['campus'],row['clase']);src=cls+(_fuente(row),)
        if row['grupo'] in blocked:reasons[identifier]='grupo_retenido';continue
        photo=(row['campus'],_foto(row))
        if photo in photo_labels:
            if photo_labels[photo]!=row['clase']:raise ValueError('Adición con etiqueta incompatible para una toma existente.')
            reasons[identifier]='misma_toma';continue
        if max_fotos_por_clase is not None and len(class_units[cls])>=max_fotos_por_clase:
            reasons[identifier]='limite_clase';continue
        if max_fotos_por_fuente_clase is not None and len(source_units[src])>=max_fotos_por_fuente_clase:
            reasons[identifier]='limite_fuente_clase';continue
        add(row)
    return selected,dict(baseline_conservadas=len(baseline),adiciones_aceptadas=len(selected)-len(baseline),
                         fotos_independientes=len(photo_labels),motivos_por_id=reasons,
                         descartes_por_motivo=dict(Counter(reasons.values())))


def ajustar_transformacion_train(rows:Sequence[dict],features:Mapping[str,dict],*,modo:str='identidad',
                                 blocked_groups:Iterable[str]=(),shrinkage:float=0.5,epsilon:float=1e-4):
    """Estadísticos de train solamente; una observación de igual peso por toma.

    Familias limitadas: identidad, centrado y blanqueo_diagonal regularizado.
    Las tres vistas se promedian y normalizan primero para que una foto no
    pese tres veces. blocked_groups debe incluir validación/prueba del fold.
    No usa features['query'] ni etiquetas para estimar media/varianza.
    """
    rows=_rows(rows)
    if modo not in ('identidad','centrado','blanqueo_diagonal'):raise ValueError('Transformación fuera de la familia limitada.')
    if not 0<=shrinkage<=1 or epsilon<=0:raise ValueError('Regularización inválida.')
    blocked=set(blocked_groups)
    if any(r['grupo'] in blocked for r in rows):raise ValueError('Ajuste de transformación con grupo retenido.')
    photos={}
    for row in rows:
        key=(row['campus'],_foto(row))
        refs=np.asarray(features[row['id']]['refs'],dtype=np.float32)
        if refs.ndim!=2 or refs.shape[0]!=3:raise ValueError('Se requieren tres vistas por referencia.')
        photos.setdefault(key,_unit(_unit(refs).mean(axis=0)))
    if not photos:raise ValueError('No hay tomas de train para ajustar.')
    x=np.stack(list(photos.values()))
    dim=x.shape[1]
    mean=np.zeros(dim,dtype=np.float32) if modo=='identidad' else x.mean(axis=0,dtype=np.float64).astype(np.float32)
    scale=np.ones(dim,dtype=np.float32)
    if modo=='blanqueo_diagonal':
        variance=x.var(axis=0,dtype=np.float64)
        average=float(variance.mean())
        regularized=(1-shrinkage)*variance+shrinkage*average
        scale=(1/np.sqrt(np.maximum(regularized,epsilon))).astype(np.float32)
    return dict(modo=modo,mean=mean,scale=scale,dimension=dim,n_fotos_train=len(photos),
                train_groups=tuple(sorted({r['grupo'] for r in rows})),shrinkage=shrinkage,epsilon=epsilon,
                fit_role='train_only')


def aplicar_transformacion(vectors,transform=None):
    values=np.asarray(vectors,dtype=np.float32)
    if transform is not None:
        if transform.get('fit_role')!='train_only':raise ValueError('Transformación sin procedencia train-only.')
        if values.shape[-1]!=transform['dimension']:raise ValueError('Dimensión incompatible con la transformación.')
        values=(values-transform['mean'])*transform['scale']
    return _unit(values)


def puntuar_por_foto(query,rows:Sequence[dict],features:Mapping[str,dict],*,k:int=3,
                     pooling_vistas:str='max',min_fotos:int=1,transform=None)->dict[str,float]:
    """Un puntaje por foto; media de las K fotos independientes mejores por clase.

    Cada toma reúne sus tres vistas (y posibles alias). El máximo de vistas
    permite distintas orientaciones, pero nunca consume tres de las K plazas.
    El llamador debe filtrar un campus y todos los grupos retenidos antes.
    """
    rows=_rows(rows)
    if not isinstance(k,int) or k<1 or not isinstance(min_fotos,int) or min_fotos<1:raise ValueError('K y soporte deben ser positivos.')
    if pooling_vistas not in ('max','mean'):raise ValueError('Pooling no permitido.')
    if len({r['campus'] for r in rows})>1:raise ValueError('No mezclar campus en la misma puntuación.')
    q=aplicar_transformacion(query,transform)
    if q.ndim!=1:raise ValueError('Se requiere una consulta central, no múltiples votos simulados.')
    photos=defaultdict(list);photo_labels={}
    for row in rows:
        key=_foto(row)
        if key in photo_labels and photo_labels[key]!=row['clase']:raise ValueError('Toma con etiquetas incompatibles.')
        photo_labels[key]=row['clase']
        refs=np.asarray(features[row['id']]['refs'],dtype=np.float32)
        if refs.shape!=(3,q.shape[0]):raise ValueError('Referencias incompatibles con la consulta.')
        similarities=aplicar_transformacion(refs,transform)@q
        score=float(similarities.max() if pooling_vistas=='max' else similarities.mean())
        photos[key].append(score)
    byclass=defaultdict(list)
    for key,scores in photos.items():byclass[photo_labels[key]].append(max(scores))
    return {c:float(np.mean(sorted(scores,reverse=True)[:k])) for c,scores in sorted(byclass.items()) if len(scores)>=min_fotos}


def calibrar_rechazo_inner(records:Sequence[dict],thresholds:Sequence[float],margins:Sequence[float],*,
                          min_precision:float=0.9,min_accepted:int=5,min_groups:int=2)->dict:
    """Calibra sólo predicciones out-of-fold de validación interna.

    Registro: fold_role='inner_validation', grupo, train_groups, true_class,
    best_class, best_score y second_score. Rechaza roles outer/test y cualquier
    grupo que haya entrenado su propio puntaje. No evalúa un outer final.
    La grilla la fija el llamador antes; ninguna búsqueda se ejecuta al importar.
    """
    records=list(records)
    if not thresholds or not margins:raise ValueError('La grilla interna debe fijarse explícitamente.')
    if not 0<min_precision<=1 or min_accepted<1 or min_groups<1:raise ValueError('Restricciones de calibración inválidas.')
    ts=sorted(set(float(x) for x in thresholds));ms=sorted(set(float(x) for x in margins))
    if any(not math.isfinite(x) or x<0 or x>1 for x in ts+ms):raise ValueError('Umbral o margen fuera de0..1.')
    for r in records:
        if r.get('fold_role')!='inner_validation':raise ValueError('Sólo admite validación interna, nunca outer final.')
        if not r.get('grupo') or 'train_groups' not in r or r['grupo'] in set(r['train_groups']):
            raise ValueError('La consulta interna no está separada de sus grupos de train.')
        if not all(math.isfinite(float(r[k])) for k in ('best_score','second_score')):raise ValueError('Puntajes no finitos.')
    classes=sorted({r['true_class'] for r in records}|{r['best_class'] for r in records})
    result={}
    for cls in classes:
        positives=[r for r in records if r['true_class']==cls]
        positive_groups={r['grupo'] for r in positives}
        negatives=sum(r['true_class']!=cls for r in records)
        candidates=[]
        if len(positive_groups)>=min_groups and negatives:
            for threshold in ts:
                for margin in ms:
                    accepted=[r for r in records if r['best_class']==cls and r['best_score']>=threshold and r['best_score']-r['second_score']>=margin]
                    tp=sum(r['true_class']==cls for r in accepted);fp=len(accepted)-tp
                    if len(accepted)<min_accepted or len({r['grupo'] for r in accepted})<min_groups:continue
                    precision=tp/len(accepted)
                    if precision<min_precision:continue
                    recall=tp/len(positives)
                    candidates.append((recall,tp,threshold,margin,precision,fp,len(accepted)))
        if not candidates:
            result[cls]=dict(status='sin_soporte_o_sin_operacion_admisible',threshold=None,margin=None,
                             positivas_inner=len(positives),grupos_positivos_inner=len(positive_groups),negativas_inner=negatives)
        else:
            recall,tp,threshold,margin,precision,fp,n=max(candidates)
            result[cls]=dict(status='calibrado_inner',threshold=threshold,margin=margin,precision_inner=precision,
                             recall_inner=recall,tp=tp,fp=fp,accepted=n,positivas_inner=len(positives),
                             grupos_positivos_inner=len(positive_groups),negativas_inner=negatives)
    return dict(calibration_role='inner_validation_only',outer_final_evaluado=False,
                grid=dict(thresholds=ts,margins=ms),por_clase=result)
