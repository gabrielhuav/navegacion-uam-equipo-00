"""Motor offline LOGO anidado. Importar o preflight NO evalúa ningún outer.

El banco vigente queda intacto. Cada ajuste utiliza grupos de procedencia
unidos, clases humanas nativas y sólo referencias de train. El objetivo se
inyecta como una función pura de validaciones internas; no recibe el outer.
No requiere TensorFlow ni vuelve a extraer características.
"""
from __future__ import annotations

import os
for _name in ('OMP_NUM_THREADS', 'OPENBLAS_NUM_THREADS', 'MKL_NUM_THREADS'):
    os.environ.setdefault(_name, '2')

from collections import Counter, defaultdict
from dataclasses import asdict, dataclass
from pathlib import Path
from typing import Callable, Mapping, Sequence
import argparse
import hashlib
import importlib.util
import json
import math
import sys
import time

import numpy as np

SCHEMA_VERSION = 1
CAMPUS_SHORT = {'uam_azcapotzalco': 'azc', 'escom': 'escom'}
DEFAULT_ROOT = Path(__file__).resolve().parents[1]


def canonical_bytes(value):
    return json.dumps(value, ensure_ascii=False, sort_keys=True,
                      separators=(',', ':'), allow_nan=False).encode('utf-8')


def signature(value):
    return hashlib.sha256(canonical_bytes(value)).hexdigest()


def file_sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def write_json(path, value):
    path = Path(path)
    path.parent.mkdir(parents=True, exist_ok=True)
    path.write_text(json.dumps(value, ensure_ascii=False, indent=2,
                               allow_nan=False) + '\n', encoding='utf-8')


def group(row):
    """La unión por foto/entrega domina los grupos históricos de la app."""
    return str(row.get('grupo_union') or row['grupo'])


def photo(row):
    return str(row.get('foto_id') or row['id'])


def unit(value):
    x = np.asarray(value, dtype=np.float32)
    norms = np.linalg.norm(x, axis=-1, keepdims=True)
    if not np.isfinite(x).all() or np.any(norms < 1e-8):
        raise ValueError('Vector no finito o de norma nula.')
    return x / norms


@dataclass(frozen=True)
class Recipe:
    recipe_id: str
    bank: str
    pooling: str
    transform: str = 'identidad'
    addition_scope: str = 'all'
    max_adiciones_por_fuente_clase: int | None = None
    query_mode: str = 'central'


def enumerate_recipes() -> list[dict]:
    """Grilla cerrada: 1 vigente + 16 ancladas + 8 transformadas + 4 ensemble."""
    result = [Recipe('actual_fijo', 'actual', 'proto3')]
    for pooling in ('proto3', 'photo1', 'photo2', 'photo3'):
        for scope in ('all', 'ext'):
            for cap in (None, 2):
                result.append(Recipe(f'anclado_{pooling}_{scope}_cap{cap or "none"}',
                                     'anclado', pooling, addition_scope=scope,
                                     max_adiciones_por_fuente_clase=cap))
    for transform in ('centrado', 'blanqueo_diagonal'):
        for pooling in ('photo2', 'photo3'):
            for scope in ('all', 'ext'):
                result.append(Recipe(f'{transform}_{pooling}_{scope}_cap2',
                                     'anclado', pooling, transform, scope, 2))
    for pooling in ('photo2', 'photo3'):
        for scope in ('all', 'ext'):
            result.append(Recipe(f'mean3_{pooling}_{scope}_cap2', 'anclado', pooling,
                                 addition_scope=scope, max_adiciones_por_fuente_clase=2,
                                 query_mode='mean3'))
    records = [asdict(r) for r in result]
    assert len(records) == len({r['recipe_id'] for r in records}) == 29
    assert len({signature({k: v for k, v in r.items() if k != 'recipe_id'})
                for r in records}) == 29
    return records


def enumerate_comparators() -> list[dict]:
    """Comparador predeclarado; queda fuera de la búsqueda de 29 recetas."""
    return [asdict(Recipe('maestro_solo','maestro','proto3'))]


def bank_info(data, bank, campus):
    # El banco maestro es una máscara verificable de humanos del anclado;
    # no se copian, recalculan o alteran sus características ni etiquetas.
    source = 'anclado' if bank == 'maestro' else bank
    return data.metadata['banks'][source+'_'+CAMPUS_SHORT[campus]]


def as_recipe(recipe):
    return recipe if isinstance(recipe, Recipe) else Recipe(**recipe)


@dataclass
class BankData:
    metadata: dict
    arrays: dict
    queries: list[dict]
    legacy_by_photo: dict
    input_signatures: dict

    @property
    def groups(self):
        return sorted({group(q) for q in self.queries})

    def query_indices(self, groups=None, campus=None):
        gs = None if groups is None else set(groups)
        return [i for i, q in enumerate(self.queries)
                if (gs is None or group(q) in gs)
                and (campus is None or q['campus'] == campus)]

    def query_record(self, index):
        q = self.queries[index]
        old = self.legacy_by_photo.get((q['campus'], photo(q)))
        return dict(id=q['id'], query_id=q['id'], foto_id=photo(q), campus=q['campus'],
                    grupo=group(q), true_class=q['clase'],
                    legacy_class=None if old is None else old['clase'],
                    legacy_true_class=None if old is None else old['clase'],
                    legacy_subset=old is not None)


def load_banks(metadata_path, npz_path, *, verify=True) -> BankData:
    mp, npz_path = Path(metadata_path), Path(npz_path)
    metadata = json.loads(mp.read_text(encoding='utf-8-sig'))
    if verify and file_sha(npz_path) != metadata['npz_sha256']:
        raise ValueError('El NPZ no coincide con los bancos congelados.')
    with np.load(npz_path, allow_pickle=False) as values:
        arrays = {key: values[key].copy() for key in values.files}
    if set(arrays) != set(metadata['arrays']):
        raise ValueError('Inventario de matrices inconsistente.')
    for key, values in arrays.items():
        spec = metadata['arrays'][key]
        if list(values.shape) != spec['shape'] or str(values.dtype) != spec['dtype']:
            raise ValueError('Dimensiones/tipo alterados: ' + key)
        if not np.isfinite(values).all():
            raise ValueError('Características no finitas.')
        if verify and hashlib.sha256(np.ascontiguousarray(values).tobytes()).hexdigest() != spec['sha256']:
            raise ValueError('Matriz alterada: ' + key)
        values.setflags(write=False)
    queries = metadata['queries']['records']
    if len({(q['campus'], photo(q)) for q in queries}) != len(queries):
        raise ValueError('Las consultas humanas deben ser fotos únicas.')
    if not all(q.get('human_confirmed') and q.get('class_author') == 'owner' and
               q['clase'] == q.get('native_teacher_class') for q in queries):
        raise ValueError('El objetivo requiere verdad humana nativa, sin proyecciones.')
    if not np.array_equal(arrays[metadata['queries']['central_array']],
                          arrays[metadata['queries']['threeviews_array']][:, 0]):
        raise ValueError('La consulta central no coincide con su vista natural cero.')
    labels = {q['id']: (q['campus'], q['clase']) for q in queries}
    if verify and signature(labels) != metadata['teacher_labels_signature_sha256']:
        raise ValueError('Se alteraron las clases humanas.')
    # Un RGB exacto no puede aparecer en dos grupos de procedencia.
    photo_groups = {}
    for rows in [queries] + [v['records'] for v in metadata['banks'].values()]:
        for row in rows:
            key = (row['campus'], photo(row))
            if key in photo_groups and photo_groups[key] != group(row):
                raise ValueError('Foto compartida entre grupos de procedencia.')
            photo_groups[key] = group(row)
    legacy = {}
    for short, value in metadata['baseline_queries'].items():
        for row in value['records']:
            key = (row['campus'], photo(row))
            if key in legacy and legacy[key]['clase'] != row['clase']:
                raise ValueError('Conflicto de clases en regresión legacy.')
            legacy[key] = row
    return BankData(metadata, arrays, queries, legacy,
                    dict(metadata_sha256=file_sha(mp), npz_sha256=file_sha(npz_path),
                         model_sha256=metadata['model_sha256'],
                         arrays_signature_sha256=metadata['arrays_signature_sha256'],
                         teacher_labels_signature_sha256=metadata['teacher_labels_signature_sha256']))


@dataclass
class TrainingBundle:
    records: list[dict]
    refs: np.ndarray
    indices: list[int]
    selected_ids: list[str]
    train_groups: list[str]
    diagnostics: dict


def prepare_training(data: BankData, campus: str, excluded_groups: Sequence[str],
                     recipe: Recipe | dict) -> TrainingBundle:
    """Excluye TODAS las fuentes retenidas antes de seleccionar o ajustar.

    El cap cuenta ADICIONES por (campus, clase, grupo de procedencia). Una fila
    baseline no consume cupo y nunca se retira por scope/cap. El orden de
    desempate es el ID congelado; no hay puntuaciones ni consultas aquí.
    """
    recipe = as_recipe(recipe)
    blocked = set(excluded_groups)
    key = recipe.bank + '_' + CAMPUS_SHORT[campus]
    bank = bank_info(data,recipe.bank,campus)
    allrows = bank['records']
    eligible = [i for i, row in enumerate(allrows) if group(row) not in blocked
                and (recipe.bank!='maestro' or (row.get('human_confirmed') and
                     row.get('class_author')=='owner' and row['clase']==row.get('native_teacher_class')))]
    baseline = [i for i in eligible if allrows[i]['baseline_flag']]
    additions = sorted([i for i in eligible if not allrows[i]['baseline_flag']],
                       key=lambda i: allrows[i]['id'])
    selected = list(baseline)
    cells = defaultdict(set)
    photos = set()
    for i in baseline:
        row = allrows[i]
        photos.add(photo(row))
    reasons = Counter()
    for i in additions:
        row = allrows[i]
        if recipe.addition_scope == 'ext' and (row['interior'] or not row.get('interior_known',row.get('interior_conocido',False))):
            reasons['interior_addition'] += 1
            continue
        if photo(row) in photos:
            reasons['duplicate_photo'] += 1
            continue
        cell = (row['clase'], group(row))
        if recipe.max_adiciones_por_fuente_clase is not None and len(cells[cell]) >= recipe.max_adiciones_por_fuente_clase:
            reasons['max_adiciones_por_fuente_clase'] += 1
            continue
        selected.append(i)
        cells[cell].add(photo(row))
        photos.add(photo(row))
    rows = [allrows[i] for i in selected]
    groups = sorted({group(row) for row in rows})
    assert not blocked.intersection(groups)
    assert set(baseline) <= set(selected)
    diagnostics = dict(bank=key, blocked_groups=sorted(blocked),
                       eligible_baseline=len(baseline), selected_references=len(rows),
                       selected_photos=len(photos), added=len(selected)-len(baseline),
                       discarded=dict(reasons),
                       selected_ids_sha256=signature([allrows[i]['id'] for i in selected]),
                       class_counts=dict(Counter(row['clase'] for row in rows)))
    return TrainingBundle(rows, data.arrays[bank['refs_array']][selected], selected,
                          [r['id'] for r in rows], groups, diagnostics)


def fit_transform(train: TrainingBundle, mode, blocked_groups=()):
    """Un peso por foto. Nunca recibe características de consulta."""
    if set(train.train_groups).intersection(blocked_groups):
        raise ValueError('Transformación invadida por grupos retenidos.')
    dim = train.refs.shape[-1]
    if mode == 'identidad':
        return dict(mode=mode, mean=np.zeros(dim, np.float32),
                    scale=np.ones(dim, np.float32), train_groups=train.train_groups,
                    fit_role='train_only', n_photos=len({photo(r) for r in train.records}))
    if mode not in ('centrado', 'blanqueo_diagonal'):
        raise ValueError('Transformación fuera de la familia congelada.')
    unique = {}
    for row, refs in zip(train.records, train.refs):
        unique.setdefault(photo(row), unit(unit(refs).mean(axis=0)))
    if not unique:
        raise ValueError('No hay fotos train para ajustar la transformación.')
    x = np.stack(list(unique.values()))
    mean = x.mean(axis=0, dtype=np.float64).astype(np.float32)
    scale = np.ones(dim, np.float32)
    if mode == 'blanqueo_diagonal':
        variance = x.var(axis=0, dtype=np.float64)
        regularized = 0.5*variance + 0.5*float(variance.mean())
        scale = (1/np.sqrt(np.maximum(regularized, 1e-4))).astype(np.float32)
    return dict(mode=mode, mean=mean, scale=scale, train_groups=train.train_groups,
                fit_role='train_only', n_photos=len(unique), shrinkage=0.5, epsilon=1e-4)


def transform_vectors(values, fitted):
    if fitted['fit_role'] != 'train_only':
        raise ValueError('Procedencia de transformación inválida.')
    return unit((values-fitted['mean'])*fitted['scale'])


def aggregate_scores(similarities, rows, pooling):
    """sim: [consulta, vista_query, referencia, vista_ref]."""
    classes = sorted({r['clase'] for r in rows})
    if not classes:
        return [], np.empty((similarities.shape[0], 0), np.float32)
    result = []
    for cls in classes:
        ids = [i for i, row in enumerate(rows) if row['clase'] == cls]
        if pooling == 'proto3':
            values = similarities[:, :, ids, :].reshape(similarities.shape[0], similarities.shape[1], -1)
            k = min(3, values.shape[-1])
            scores = np.partition(values, values.shape[-1]-k, axis=-1)[..., -k:].mean(axis=-1)
        else:
            k = int(pooling.removeprefix('photo'))
            photos = defaultdict(list)
            for i in ids:
                photos[photo(rows[i])].append(i)
            values = np.stack([similarities[:, :, indices, :].max(axis=(-1, -2))
                               for indices in photos.values()], axis=-1)
            k = min(k, values.shape[-1])
            scores = np.partition(values, values.shape[-1]-k, axis=-1)[..., -k:].mean(axis=-1)
        # Ensembles promedian puntuaciones por clase, sin fingir 3 capturas.
        result.append(scores.mean(axis=1))
    return classes, np.stack(result, axis=1).astype(np.float32)


class ScoreCache:
    """Caché por grupos bloqueados/campus/receta y firma de inputs.

    Sólo se leen/puntúan las consultas explícitamente solicitadas. Los grupos de otros campus
    no alteran los estadísticos y se excluyen de la clave efectiva, pero la
    procedencia devuelta conserva TODOS los grupos solicitados.
    """
    def __init__(self, data: BankData, cache_dir=None):
        self.data = data
        self.cache_dir = None if cache_dir is None else Path(cache_dir)
        self.entries = {}
        self.base_similarities = {}
        self.transformed_similarities = {}
        self.transform_cache = {}
        self.hits = 0
        self.misses = 0

    def _identity_similarity(self, campus, bank, query_mode, pooling, query_indices, train_indices):
        # Sólo train entra en los productos: ni siquiera se puntúan referencias retenidas.
        normalized_refs = pooling != 'proto3'
        key = (campus, bank, query_mode, normalized_refs, tuple(query_indices),tuple(train_indices))
        if key not in self.base_similarities:
            info = bank_info(self.data,bank,campus)
            refs = self.data.arrays[info['refs_array']][list(train_indices)]
            if normalized_refs:
                refs = unit(refs)
            q = self.data.arrays[self.data.metadata['queries']['threeviews_array']][list(query_indices)]
            if query_mode == 'central':
                q = q[:, :1]
            q = unit(q)
            self.base_similarities[key] = np.einsum('qvd,rwd->qvrw', q, refs, optimize=True)
        return self.base_similarities[key]

    def score(self, campus, excluded_groups, recipe, query_indices, *, fold_role):
        recipe = as_recipe(recipe)
        requested = sorted(set(excluded_groups))
        if fold_role not in ('inner_validation', 'outer_final', 'baseline_outer','comparator_outer'):
            raise ValueError('Rol de fold desconocido.')
        indices = list(query_indices)
        if any(self.data.queries[i]['campus'] != campus or
               group(self.data.queries[i]) not in requested for i in indices):
            raise ValueError('Sólo se puntúan consultas del campus y grupos retenidos.')
        bankinfo = bank_info(self.data,recipe.bank,campus)
        local_groups = {group(r) for r in bankinfo['records']}
        local_groups |= {group(q) for q in self.data.queries if q['campus'] == campus}
        effective = sorted(set(requested).intersection(local_groups))
        cache_spec = dict(schema=SCHEMA_VERSION, inputs=self.data.input_signatures,
                          campus=campus, blocked_groups=effective, recipe=asdict(recipe),
                          query_indices=indices)
        key = signature(cache_spec)
        if key not in self.entries:
            path = None if self.cache_dir is None else self.cache_dir/(key+'.npz')
            if path is not None and path.exists():
                with np.load(path, allow_pickle=False) as saved:
                    if str(saved['cache_signature'].item()) != key:
                        raise ValueError('Firma de caché inconsistente.')
                    entry = json.loads(str(saved['metadata'].item()))
                    entry['scores'] = saved['scores'].copy()
                self.entries[key] = entry
                self.hits += 1
            else:
                train_key = (campus, tuple(effective), recipe.bank, recipe.addition_scope, recipe.max_adiciones_por_fuente_clase)
                train = prepare_training(self.data, campus, effective, recipe)
                qi = indices
                fit_key = (train_key, recipe.transform)
                if fit_key not in self.transform_cache:
                    self.transform_cache[fit_key] = fit_transform(train, recipe.transform, effective)
                fitted = self.transform_cache[fit_key]
                if recipe.transform == 'identidad':
                    sims = self._identity_similarity(campus, recipe.bank, recipe.query_mode,
                                                     recipe.pooling, qi,train.indices)
                else:
                    sim_key = (fit_key,recipe.query_mode,tuple(qi))
                    if sim_key not in self.transformed_similarities:
                        q = self.data.arrays[self.data.metadata['queries']['threeviews_array']][qi]
                        if recipe.query_mode == 'central':
                            q = q[:, :1]
                        q = transform_vectors(q, fitted)
                        refs = transform_vectors(train.refs, fitted)
                        self.transformed_similarities[sim_key] = np.einsum('qvd,rwd->qvrw', q, refs, optimize=True)
                    sims = self.transformed_similarities[sim_key]
                classes, scores = aggregate_scores(sims, train.records, recipe.pooling)
                entry = dict(query_indices=qi, classes=classes, scores=scores,
                             train_groups=train.train_groups,
                             diagnostics=train.diagnostics,
                             transform=dict(mode=fitted['mode'], fit_role=fitted['fit_role'],
                                            n_photos=fitted['n_photos'],
                                            stats_sha256=hashlib.sha256(fitted['mean'].tobytes()+fitted['scale'].tobytes()).hexdigest()))
                self.entries[key] = entry
                self.misses += 1
                if path is not None:
                    path.parent.mkdir(parents=True, exist_ok=True)
                    meta = {k: v for k, v in entry.items() if k != 'scores'}
                    np.savez_compressed(path, scores=scores,
                                        metadata=np.array(json.dumps(meta, sort_keys=True)),
                                        cache_signature=np.array(key))
        else:
            self.hits += 1
        entry = self.entries[key]
        if set(entry['train_groups']).intersection(requested):
            raise ValueError('Caché contiene un grupo retenido.')
        lookup = {qi: j for j, qi in enumerate(entry['query_indices'])}
        result = []
        for qi in indices:
            scores = entry['scores'][lookup[qi]]
            classes = entry['classes']
            order = sorted(range(len(classes)), key=lambda j: (-float(scores[j]), classes[j]))
            best = None if not order else classes[order[0]]
            best_score = -1.0 if not order else float(scores[order[0]])
            second = -1.0 if len(order) < 2 else float(scores[order[1]])
            result.append(dict(**self.data.query_record(qi), recipe_id=recipe.recipe_id,
                               fold_role=fold_role, blocked_groups=requested,
                               train_groups=entry['train_groups'], best_class=best,
                               best_score=best_score, second_score=second,
                               class_scores={c: float(s) for c, s in zip(classes, scores)},
                               score_cache_key=key,
                               training_audit=entry['diagnostics'],
                               transform_audit=entry['transform']))
        return result


def calibration_grid(inner_records, *, quantiles=(0, .1, .2, .3, .4, .5, .6, .7, .8, .9, 1)):
    """Los valores se derivan EXCLUSIVAMENTE de puntuaciones inner.

    Incluye los tres umbrales heredados; la regla de cuantiles se congela
    antes del outer. Los cosenos centrados pueden ser negativos.
    """
    records = list(inner_records)
    if any(r.get('fold_role') != 'inner_validation' or
           r['grupo'] in set(r['train_groups']) for r in records):
        raise ValueError('La calibración sólo admite validaciones internas separadas.')
    values = np.array([r['best_score'] for r in records if r['best_class'] is not None], np.float64)
    thresholds = [.8, .74, .71]
    if len(values):
        thresholds += [float(v) for v in np.quantile(values, quantiles)]
    return dict(thresholds=sorted(set(thresholds)), margins=[0.0, .01, .03, .05],
                threshold_rule='quantiles_inner_best_score_plus_inherited', quantiles=list(quantiles),
                derived_from='inner_validation_only', n_inner=len(records))


def preflight_summary(data):
    legacy_counts = Counter(q['campus'] for i, q in enumerate(data.queries)
                            if data.query_record(i)['legacy_subset'])
    teacher_counts = {}
    for campus,short in CAMPUS_SHORT.items():
        train=prepare_training(data,campus,[],enumerate_comparators()[0])
        expected={(photo(q),q['clase']) for q in data.queries if q['campus']==campus}
        if {(photo(r),r['clase']) for r in train.records}!=expected or len(train.records)!=len(expected):
            raise ValueError('El maestro solo no corresponde exactamente a las consultas humanas únicas.')
        teacher_counts[short]=len(train.records)
    return dict(queries=len(data.queries), query_groups=len(data.groups),
                queries_by_campus=dict(Counter(q['campus'] for q in data.queries)),
                legacy_unique_by_campus=dict(legacy_counts),
                teacher_comparator_photos=teacher_counts,
                native_classes_by_campus={campus: sorted({q['clase'] for q in data.queries if q['campus']==campus})
                                          for campus in CAMPUS_SHORT},
                inner_exclusion='outer_g_and_inner_h_all_sources_union_groups',
                transform_fit='selected_train_photos_only',
                candidate_outer_evaluation_run=False)


def freeze_protocol(output_dir, data, *, protocol_path, objective_source_path, verifier_source_path):
    """Congela antes de outer. Una ejecución posterior exige igualdad exacta."""
    recipes = enumerate_recipes()
    protocol = json.loads(Path(protocol_path).read_text(encoding='utf-8-sig'))
    if 'recipes' in protocol and protocol['recipes'] != recipes:
        raise ValueError('La grilla declarada no coincide con las 29 recetas del motor.')
    if 'comparators' in protocol and protocol['comparators']!=enumerate_comparators():
        raise ValueError('El comparador declarado no coincide con el motor.')
    protocol.update(recipes=recipes, grid_sha256=signature(recipes),
                    comparators=enumerate_comparators(),
                    comparators_sha256=signature(enumerate_comparators()),
                    input_signatures=data.input_signatures,
                    driver_sha256=file_sha(__file__),
                    objective_source_sha256=file_sha(objective_source_path),
                    verifier_source_sha256=file_sha(verifier_source_path),
                    source_protocol_sha256=file_sha(protocol_path),
                    preflight=preflight_summary(data))
    protocol['protocol_sha256'] = signature(protocol)
    out = Path(output_dir)
    path = out/'protocolo_congelado.json'
    if path.exists():
        old = json.loads(path.read_text(encoding='utf-8-sig'))
        if old != protocol:
            raise ValueError('Ya existe otro protocolo congelado; usar una nueva carpeta para otro protocolo.')
    else:
        write_json(path, protocol)
    manifest = dict(schema_version=1, protocol_sha256=protocol['protocol_sha256'],
                    frozen_protocol_file_sha256=file_sha(path),
                    source_protocol_sha256=file_sha(protocol_path),
                    input_signatures=data.input_signatures,
                    driver_sha256=file_sha(__file__),
                    objective_source_sha256=file_sha(objective_source_path),
                    verifier_source_sha256=file_sha(verifier_source_path),
                    outer_evaluation_run=False, write_once=True)
    manifest_path = out/'firmas_preouter.json'
    if manifest_path.exists():
        if json.loads(manifest_path.read_text(encoding='utf-8-sig')) != manifest:
            raise ValueError('Las firmas preouter ya se congelaron con otros bytes.')
    else:
        write_json(manifest_path, manifest)
    return protocol


def validate_protocol(protocol, data, *, objective_source_path=None):
    stated = protocol['protocol_sha256']
    unsigned = {k: v for k, v in protocol.items() if k != 'protocol_sha256'}
    if signature(unsigned) != stated or protocol['grid_sha256'] != signature(enumerate_recipes()):
        raise ValueError('Protocolo/grilla alterados después de congelar.')
    if protocol.get('comparators')!=enumerate_comparators() or protocol.get('comparators_sha256')!=signature(enumerate_comparators()):
        raise ValueError('Los comparadores predeclarados cambiaron después de congelar.')
    if protocol['input_signatures'] != data.input_signatures or protocol['driver_sha256'] != file_sha(__file__):
        raise ValueError('Inputs/motor cambiaron después de congelar.')
    if objective_source_path is not None and protocol['objective_source_sha256'] != file_sha(objective_source_path):
        raise ValueError('El objetivo cambió después de congelar.')


def collect_inner(data, cache, outer_group, recipes):
    """Cada h se puntúa con refs/estadísticos que excluyen {g,h}."""
    by_recipe = {r['recipe_id']: [] for r in recipes}
    for inner_group in data.groups:
        if inner_group == outer_group:
            continue
        for campus in CAMPUS_SHORT:
            qi = data.query_indices([inner_group], campus)
            if not qi:
                continue
            for recipe in recipes:
                records = cache.score(campus, [outer_group, inner_group], recipe, qi,
                                      fold_role='inner_validation')
                for record in records:
                    record['outer_excluded_group'] = outer_group
                    record['inner_validation_group'] = inner_group
                by_recipe[recipe['recipe_id']].extend(records)
    expected = {q['id'] for q in data.queries if group(q) != outer_group}
    for records in by_recipe.values():
        if {r['query_id'] for r in records} != expected or len(records) != len(expected):
            raise ValueError('Validación interna incompleta o duplicada.')
    return by_recipe


def build_inner_candidates(data, protocol, campus, outer_group, recipes=None, cache=None):
    """API del auditor: campus corto; jamás puntúa las consultas de outer_group."""
    real_campus = {'azc': 'uam_azcapotzalco', 'escom': 'escom'}.get(campus, campus)
    cache = ScoreCache(data) if cache is None else cache
    recipes = protocol['recipes'] if recipes is None else recipes
    candidates = []
    expected = {q['id'] for q in data.queries
                if q['campus'] == real_campus and group(q) != outer_group}
    for recipe in recipes:
        records = []
        for inner_group in data.groups:
            if inner_group == outer_group:
                continue
            qi = data.query_indices([inner_group], real_campus)
            if not qi:
                continue
            part = cache.score(real_campus, [outer_group, inner_group], recipe, qi,
                               fold_role='inner_validation')
            for row in part:
                row['outer_excluded_group'] = outer_group
                row['inner_validation_group'] = inner_group
            records.extend(part)
        if {r['query_id'] for r in records} != expected or len(records) != len(expected):
            raise ValueError('Candidatos internos tienen un denominador inconsistente.')
        with_alias = dict(recipe, id='baseline' if recipe['recipe_id']=='actual_fijo' else recipe['recipe_id'])
        candidates.append(dict(recipe=with_alias, records=records))
    return candidates


def run_nested(data: BankData, protocol: dict, selector: Callable, apply_calibration: Callable,
               output_dir, *, objective_source_path=None, cache_dir=None, outer_groups=None,
               comparator_policy: Callable | None=None):
    """Sólo ejecutar tras aprobación del protocolo. Selector ve únicamente inner.

    selector(candidates, protocol, campus_corto)-> {recipe, policy, ...auditoría}
    apply_calibration(raw_records, policy, protocol, campus_corto)-> list[dict] con
    accepted_class (None=rechazo), sin modificar verdad humana ni scores.
    Una receta se selecciona por outer y campus; el actual fijo se puntúa como
    control pareado, no vuelve a competir después de observar el outer.
    """
    validate_protocol(protocol, data, objective_source_path=objective_source_path)
    selected_groups = (sorted(data.groups, key=lambda g:(
        min(CAMPUS_SHORT[data.queries[i]['campus']] for i in data.query_indices([g])),g))
        if outer_groups is None else list(outer_groups))
    if set(selected_groups) - set(data.groups):
        raise ValueError('Outer desconocido.')
    output_dir = Path(output_dir)
    cache = ScoreCache(data, cache_dir)
    recipes = protocol['recipes']
    byid = {r['recipe_id']: r for r in recipes}
    predictions, baselines, folds = [], [], []
    comparator_predictions = {r['recipe_id']:[] for r in protocol.get('comparators',[])}
    started = time.monotonic()
    for fold_index, outer_group in enumerate(selected_groups):
        raw, control, predicted, control_pred, selections = [], [], [], [], {}
        inner_signatures = {}
        inner_counts = {}
        for campus in CAMPUS_SHORT:
            qi = data.query_indices([outer_group], campus)
            if not qi:
                continue
            short = CAMPUS_SHORT[campus]
            candidates = build_inner_candidates(data, protocol, short, outer_group, cache=cache)
            selection = selector(candidates, protocol, short)
            recipe_id = selection['recipe']['recipe_id']
            if recipe_id not in byid:
                raise ValueError('El selector devolvió una receta fuera de grilla.')
            selections[short] = selection
            inner_signatures[short] = signature(candidates)
            inner_counts[short] = len(candidates[0]['records'])
            # El outer sólo existe DESPUÉS de terminar selección/calibración.
            part = cache.score(campus, [outer_group], byid[recipe_id], qi, fold_role='outer_final')
            base = cache.score(campus, [outer_group], byid['actual_fijo'], qi, fold_role='baseline_outer')
            raw.extend(part)
            control.extend(base)
            predicted.extend(apply_calibration(part, selection['policy'], protocol, short))
            control_pred.extend(apply_calibration(base, None, protocol, short))
            for comparator in protocol.get('comparators',[]):
                comp = cache.score(campus,[outer_group],comparator,qi,fold_role='comparator_outer')
                if comparator_policy is None:
                    if not protocol.get('synthetic_only'):
                        raise ValueError('El comparador requiere una política fija predeclarada.')
                    comp_policy = None
                else:
                    comp_policy = comparator_policy(protocol,short,comparator['recipe_id'])
                accepted = apply_calibration(comp,comp_policy,protocol,short)
                if len(accepted)!=len(comp) or any(a['query_id']!=b['query_id'] or a['true_class']!=b['true_class'] for a,b in zip(comp,accepted)):
                    raise ValueError('El comparador alteró consultas o verdades humanas.')
                comparator_predictions[comparator['recipe_id']].extend(accepted)
        if len(predicted) != len(raw) or len(control_pred) != len(control):
            raise ValueError('Aplicación de umbral alteró el denominador.')
        for before, after in zip(raw+control, predicted+control_pred):
            if any(before[k] != after.get(k) for k in ('query_id','true_class','grupo','best_class','best_score')):
                raise ValueError('Aplicación de umbral alteró identidades, verdades o scores.')
        predictions.extend(predicted)
        baselines.extend(control_pred)
        fold = dict(outer_group=outer_group, selected_recipe_ids={c:s['recipe']['recipe_id'] for c,s in selections.items()},
                    outer_queries=len(raw), selections=selections,
                    inner_queries=inner_counts,
                    inner_groups={short:len({group(q) for q in data.queries
                                           if q['campus']==protocol['campuses'][short]['metadata_campus']
                                           and group(q)!=outer_group})
                                  for short in selections} if 'campuses' in protocol else len(data.groups)-1,
                    inner_records_signature=inner_signatures,
                    outer_evaluated_after_selection=True)
        folds.append(fold)
        write_json(output_dir/'progreso_anidado.json',
                   dict(protocol_sha256=protocol['protocol_sha256'], completed_folds=len(folds),
                        expected_folds=len(selected_groups), elapsed_seconds=round(time.monotonic()-started,2),
                        last_outer_group=outer_group, last_selected_recipes=fold['selected_recipe_ids'],
                        cache_hits=cache.hits, cache_misses=cache.misses))
        print(json.dumps(dict(completed_fold=fold_index+1,total_folds=len(selected_groups),
                              selected_recipes=fold['selected_recipe_ids'], cache_misses=cache.misses)), flush=True)
    expected_ids = {q['id'] for q in data.queries if group(q) in selected_groups}
    if len(predictions) != len(expected_ids) or {r['query_id'] for r in predictions} != expected_ids:
        raise ValueError('El outer final no preservó las consultas únicas.')
    result = dict(schema_version=SCHEMA_VERSION, private=True,
                  protocol_sha256=protocol['protocol_sha256'],
                  context='retrospective_nested_internal_validation', external_new_test=False,
                  full_outer_run=set(selected_groups)==set(data.groups),
                  folds=folds, predictions=predictions, baseline_predictions=baselines,
                  comparator_predictions=comparator_predictions,
                  elapsed_seconds=round(time.monotonic()-started,2),
                  cache=dict(hits=cache.hits,misses=cache.misses))
    write_json(output_dir/'resultado_anidado_privado.json', result)
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--root', type=Path, default=DEFAULT_ROOT)
    parser.add_argument('--output', type=Path)
    parser.add_argument('--objective-module', type=Path,
                        help='Módulo auditado: select_inner, apply_calibration.')
    parser.add_argument('--protocol', type=Path)
    parser.add_argument('--verifier-module', type=Path)
    parser.add_argument('--run-outer', action='store_true',
                        help='Opt-in explícito; por defecto sólo congela preflight.')
    args = parser.parse_args(argv)
    output = args.output or args.root/'anidada'
    args.objective_module = args.objective_module or args.root/'anidada/herramientas/objetivo_anidado.py'
    args.protocol = args.protocol or args.root/'anidada/protocolo_anidado.json'
    args.verifier_module = args.verifier_module or args.root/'anidada/herramientas/verificar_anidada.py'
    data = load_banks(args.root/'privado/bancos_ajuste_metadata.json', args.root/'privado/bancos_ajuste.npz')
    spec = importlib.util.spec_from_file_location('objective_anidado', args.objective_module)
    module = importlib.util.module_from_spec(spec)
    sys.modules[spec.name] = module
    spec.loader.exec_module(module)
    protocol = freeze_protocol(output, data, protocol_path=args.protocol,
                               objective_source_path=args.objective_module,
                               verifier_source_path=args.verifier_module)
    if not args.run_outer:
        print(json.dumps(dict(preflight=protocol['preflight'], recipes=len(protocol['recipes']),
                              protocol_sha256=protocol['protocol_sha256'],
                              candidate_outer_evaluation_run=False), ensure_ascii=False, indent=2))
        return 0
    run_nested(data, protocol, module.select_inner, module.apply_calibration, output,
               objective_source_path=args.objective_module, cache_dir=output/'cache_scores_privado',
               comparator_policy=lambda p,c,r:module.teacher_policy(p,c))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())

