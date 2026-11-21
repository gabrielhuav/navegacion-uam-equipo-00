"""Read-only, independent audit of exported galleries, privacy and JSON math.

No neural inference, model selection or accuracy evaluation is performed.
Private query fixtures are used only for numerical equivalence and never copied.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import hashlib
import json
from pathlib import Path
import re

import numpy as np

from resumir_publico import read, require, check_public_privacy


ROOT = Path(__file__).resolve().parents[1]
TOP_KEYS = {'version', 'estado', 'corpus', 'campus', 'modelo', 'sha256_modelo', 'dimension',
            'entrada', 'umbral_no_se', 'clases', 'prototipos', 'identificadores_foto',
            'destinos', 'configuracion', 'privacidad'}


def unit(values):
    values = np.asarray(values, np.float64)
    norms = np.linalg.norm(values, axis=-1, keepdims=True)
    require(np.isfinite(values).all() and (norms > 1e-10).all(), 'Invalid export or fixture vector.')
    return values / norms


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def selected_rows(metadata, arrays, campus_cfg, recipe):
    source = campus_cfg['actual_bank'] if recipe['bank'] == 'actual' else campus_cfg['anchored_bank']
    bank = metadata['banks'][source]
    rows = bank['records']
    eligible = list(range(len(rows)))
    if recipe['bank'] == 'maestro':
        eligible = [i for i in eligible if rows[i]['human_confirmed'] and rows[i]['class_author'] == 'owner'
                    and rows[i]['clase'] == rows[i]['native_teacher_class']]
    selected = [i for i in eligible if rows[i]['baseline_flag']]
    photos = {rows[i]['foto_id'] for i in selected}
    addition_counts = Counter()
    for i in sorted((i for i in eligible if not rows[i]['baseline_flag']), key=lambda i: rows[i]['id']):
        row = rows[i]
        if recipe['addition_scope'] == 'ext' and not (row['interior_known'] and not row['interior']):
            continue
        if row['foto_id'] in photos:
            continue
        cell = (row['clase'], row.get('grupo_union') or row['grupo'])
        cap = recipe['max_adiciones_por_fuente_clase']
        if cap is not None and addition_counts[cell] >= cap:
            continue
        selected.append(i)
        photos.add(row['foto_id'])
        addition_counts[cell] += 1
    return [rows[i] for i in selected], arrays[bank['refs_array']][selected]


def expected_export_vectors(rows, refs, recipe):
    # Recompute the frozen formulas independently in float64.
    dimension = refs.shape[-1]
    mean = np.zeros(dimension)
    scale = np.ones(dimension)
    if recipe['transform'] != 'identidad':
        per_photo = {}
        for row, views in zip(rows, refs):
            per_photo.setdefault(row['foto_id'], unit(unit(views).mean(axis=0)))
        x = np.stack(list(per_photo.values()))
        mean = x.mean(axis=0)
        if recipe['transform'] == 'blanqueo_diagonal':
            variance = x.var(axis=0)
            scale = 1 / np.sqrt(np.maximum(.5 * variance + .5 * variance.mean(), 1e-4))
        transformed = unit((np.asarray(refs, np.float64) - mean) * scale)
    else:
        transformed = refs if recipe['pooling'] == 'proto3' else unit(refs)
    by_class = defaultdict(list)
    for row, views in zip(rows, transformed):
        by_class[row['clase']].extend(views)
    return mean, scale, {cls: np.asarray(v) for cls, v in by_class.items()}


def score_json_independently(artifact, query_views):
    cfg = artifact['configuracion']
    queries = unit(np.asarray(query_views)[:cfg['vistas_query']])
    transform = cfg['transformacion']
    queries = unit((queries - np.asarray(transform['media'])) * np.asarray(transform['escala']))
    scores = {}
    for cls in artifact['clases']:
        similarity = queries @ np.asarray(artifact['prototipos'][cls], np.float64).T
        if cfg['pooling'] == 'fotos':
            photos = defaultdict(list)
            for index, identifier in enumerate(artifact['identificadores_foto'][cls]):
                photos[identifier].append(index)
            similarity = np.stack([similarity[:, indices].max(axis=1) for indices in photos.values()], axis=1)
        values = np.sort(similarity, axis=1)[:, -min(cfg['k'], similarity.shape[1]):]
        scores[cls] = float(values.mean())
    ranked = sorted(scores, key=lambda cls: (-scores[cls], cls))
    winner = ranked[0]
    second = scores[ranked[1]] if len(ranked) > 1 else -1.0
    accepted = (scores[winner] >= cfg['umbrales'][winner] and scores[winner] - second >= cfg['margenes'][winner])
    accepted_class = winner if accepted else None
    destination = artifact['destinos'].get(accepted_class)
    return {'class_scores': scores, 'best_class': winner, 'best_score': scores[winner], 'second_score': second,
            'accepted_class': accepted_class, 'destination_id': destination,
            'navigation_class': accepted_class if destination is not None else None}


def audit_schema(artifact, protocol, metadata):
    require(set(artifact) == TOP_KEYS, 'Unexpected fields in exported gallery schema.')
    require(artifact['dimension'] == 960 and artifact['sha256_modelo'] == protocol['model']['sha256'], 'Encoder identity changed.')
    require(artifact['modelo'] == 'escom_embeddings.tflite', 'Unexpected model locator.')
    short = 'azc' if artifact['campus'] == 'uam_azcapotzalco' else 'escom'
    require(set(artifact['clases']) <= set(protocol['campuses'][short]['bank_classes']), 'Export contains an undeclared class.')
    ids = Counter()
    for cls in artifact['clases']:
        vectors = np.asarray(artifact['prototipos'][cls])
        references = artifact['identificadores_foto'][cls]
        require(vectors.shape == (len(references), 960) and np.isfinite(vectors).all(), 'Invalid reference-view matrix.')
        require(all(re.fullmatch(r'f_[0-9a-f]{32}', value) for value in references), 'Export uses a corpus-linked photo identifier.')
        ids.update(references)
    require(all(count == 3 for count in ids.values()), 'The three views are not grouped as one photo.')
    corpus_ids = {r['id'] for bank in metadata['banks'].values() for r in bank['records']}
    corpus_ids |= {r['foto_id'] for bank in metadata['banks'].values() for r in bank['records']}
    require(not set(ids).intersection(corpus_ids), 'Export leaked corpus identifiers.')
    text_fields = {key: value for key, value in artifact.items() if key not in
                   ('prototipos', 'identificadores_foto', 'configuracion', 'sha256_modelo')}
    text = json.dumps(text_fields)
    require(not re.search(r'[A-Za-z]:[\\/]|https?://|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', text),
            'Export contains a private path, source URL or email.')
    cfg = artifact['configuracion']
    require(set(cfg) == {'pooling', 'k', 'vistas_query', 'transformacion', 'umbral', 'margen', 'umbrales', 'margenes'},
            'Unexpected configuration field could leak private data.')
    require(set(cfg['transformacion']) == {'media', 'escala'}, 'Unexpected transform metadata.')
    require(set(cfg['umbrales']) == set(cfg['margenes']) == set(artifact['clases']), 'Class policies are incomplete.')
    require(set(artifact['destinos']) <= set(artifact['clases']) and 'otro' not in artifact['destinos'], 'Invalid destination gate.')
    return len(ids)


def run(export_root, protocol, metadata, arrays, *, repo=None):
    receipt = read(export_root / 'recibo_exportaciones_finales.json')
    fixtures = read(export_root / 'fixtures_paridad_privadas.json')['fixtures']
    require(receipt['protocol_sha256'] == protocol['protocol_sha256'], 'Export protocol changed.')
    result = {'schema_version': 1, 'technical_approval': True, 'scope': 'read_only_schema_reference_identity_and_numerical_equivalence',
              'new_accuracy_evaluation': False, 'query_vectors_published': False,
              'gallery_contains_reference_feature_vectors': True,
              'gallery_contains_new_random_photo_group_tokens_without_corpus_correspondences': True,
              'review_does_not_claim_mathematical_anonymity_of_feature_vectors': True, 'exports': {}}
    for variant in ('maestro', 'combinado'):
        result['exports'][variant] = {}
        for short, cfg in protocol['campuses'].items():
            path = export_root / variant / (cfg['metadata_campus'] + '.json')
            item = receipt['exports'][variant][short]
            require(sha(path) == item['artifact_sha256'], 'Export bytes differ from the final receipt.')
            artifact = read(path)
            photos = audit_schema(artifact, protocol, metadata)
            rows, refs = selected_rows(metadata, arrays, cfg, item['selected_recipe'])
            mean, scale, expected = expected_export_vectors(rows, refs, item['selected_recipe'])
            mean_error = float(np.max(np.abs(mean - artifact['configuracion']['transformacion']['media'])))
            scale_error = float(np.max(np.abs(scale - artifact['configuracion']['transformacion']['escala'])))
            vector_error = max(float(np.max(np.abs(expected[c] - np.asarray(artifact['prototipos'][c])))) for c in expected)
            require(mean_error <= 1e-6 and scale_error <= 1e-4 and vector_error <= 1e-5, 'Export references or train transform differ from independent recomputation.')
            require(photos == item['photos'] == len({r['foto_id'] for r in rows}), 'Export photo identity/count differs.')
            maximum = 0.0
            for fixture in fixtures[variant][short]:
                observed = score_json_independently(artifact, fixture['query_views'])
                expected_scores = fixture['expected']
                maximum = max(maximum, max(abs(observed['class_scores'][c] - expected_scores['class_scores'][c]) for c in observed['class_scores']))
                for key in ('best_class', 'accepted_class', 'destination_id', 'navigation_class'):
                    require(observed[key] == expected_scores[key], 'Independent JSON scorer changed winner, policy acceptance or destination gate.')
            require(maximum <= 1e-5, 'Independent JSON numerical parity failed.')
            result['exports'][variant][short] = {'reference_photos': photos, 'classes': len(artifact['clases']),
                                                 'reference_vectors_identical_within_tolerance': True,
                                                 'maximum_reference_vector_error': vector_error,
                                                 'maximum_train_mean_error': mean_error,
                                                 'maximum_train_scale_error': scale_error,
                                                 'independent_private_fixture_checks': len(fixtures[variant][short]),
                                                 'maximum_independent_class_score_error': maximum,
                                                 'private_schema_fields_absent': True}
    if repo is not None:
        assets = repo / 'app-kmp/androidApp/src/main/assets/reconocimiento'
        require(sha(assets / 'escom_embeddings.tflite') == protocol['model']['sha256'], 'Physical original encoder changed.')
        for short, filename in (('azc', 'uam_azcapotzalco_galeria.json'), ('escom', 'escom_galeria.json')):
            require(sha(assets / filename) == metadata['sources_sha256']['deployed_' + short], 'Original deployed gallery bytes changed.')
        result['physical_original_encoder_and_current_galleries_unchanged'] = True
    check_public_privacy(result, allowed_classes=[], allowed_recipes=[])
    return result


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--exports', type=Path, default=ROOT / 'privado/exportaciones_finales')
    parser.add_argument('--output', type=Path, default=ROOT / 'publico/auditoria_exportaciones.json')
    parser.add_argument('--repo', type=Path)
    args = parser.parse_args(argv)
    protocol = read(ROOT / 'anidada/protocolo_congelado.json')
    metadata = read(ROOT / 'privado/bancos_ajuste_metadata.json')
    with np.load(ROOT / 'privado/bancos_ajuste.npz', allow_pickle=False) as source:
        arrays = {key: source[key] for key in source.files}
    result = run(args.exports, protocol, metadata, arrays, repo=args.repo)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(result, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    print(json.dumps(result, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
