"""Audit the frozen nested protocol without evaluating any outer query.

The only scores computed here are inner-validation scores and synthetic
fixtures. Original galleries, cached features and prior runs are read-only.
"""
from __future__ import annotations

import argparse
import copy
import hashlib
import importlib.util
import json
from pathlib import Path
import re
import sys

import numpy as np


ROOT = Path(__file__).resolve().parents[2]
ANIDADA = Path(__file__).resolve().parents[1]


def sha(path):
    return hashlib.sha256(Path(path).read_bytes()).hexdigest()


def canonical(value):
    return json.dumps(value, sort_keys=True, ensure_ascii=False,
                      separators=(',', ':'), allow_nan=False).encode()


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def module(path, name):
    spec = importlib.util.spec_from_file_location(name, path)
    value = importlib.util.module_from_spec(spec)
    sys.modules[name] = value
    spec.loader.exec_module(value)
    return value


def require(condition, message):
    if not condition:
        raise AssertionError(message)


def expect_error(action, message):
    try:
        action()
    except (ValueError, AssertionError):
        return
    raise AssertionError(message)


def check_inputs(data, protocol, driver):
    md = data.metadata
    require(md['npz_sha256'] == protocol['inputs']['npz_sha256'], 'Unfrozen NPZ.')
    require(md['arrays_signature_sha256'] == protocol['inputs']['arrays_signature_sha256'], 'Array inventory changed.')
    require(md['teacher_labels_signature_sha256'] == protocol['inputs']['teacher_labels_signature_sha256'], 'Human label fingerprint changed.')
    require(md['model_sha256'] == protocol['model']['sha256'], 'Encoder changed.')
    require(len(data.queries) == 217, 'Native denominator changed.')
    require(protocol['recipes'] == driver.enumerate_recipes(), 'Recipe list differs from frozen enumeration.')
    require(len(protocol['recipes']) == 29, 'Expected exactly 29 recipes.')
    alias_groups = {}
    for row in data.queries + [r for bank in md['banks'].values() for r in bank['records']]:
        for alias in row.get('alias_ids', [row['id']]):
            key = (row['campus'], alias)
            previous = alias_groups.setdefault(key, driver.group(row))
            require(previous == driver.group(row), 'A source alias crossed union provenance groups.')
    details = {}
    for short, cfg in protocol['campuses'].items():
        campus = cfg['metadata_campus']
        queries = [q for q in data.queries if q['campus'] == campus]
        actual = md['banks'][cfg['actual_bank']]
        anchored = md['banks'][cfg['anchored_bank']]
        require(len(queries) == cfg['native_photos'], 'Native campus denominator changed.')
        require(len({driver.group(q) for q in queries}) == cfg['native_groups'], 'Native group count changed.')
        require(sorted({q['clase'] for q in queries}) == cfg['native_classes'], 'Native class vocabulary changed.')
        require(len(actual['records']) == cfg['actual_reference_rows'], 'Exact baseline size changed.')
        require(len(anchored['records']) == cfg['anchored_reference_photos'], 'Anchored bank size changed.')
        require(anchored['classes'] == cfg['bank_classes'], 'Bank class vocabulary changed.')
        require(len({driver.photo(r) for r in anchored['records']}) == len(anchored['records']), 'Candidate gives repeated RGB photos extra votes.')
        native_by_photo = {driver.photo(q): q for q in queries}
        legacy = {}
        for row in md['baseline_queries'][short]['records']:
            if driver.photo(row) in native_by_photo:
                previous = legacy.setdefault(driver.photo(row), row['clase'])
                require(previous == row['clase'], 'Conflicting deduplicated legacy labels.')
        require(len(legacy) == cfg['legacy_unique_human_photos'], 'Legacy unique denominator changed.')
        anchored_by_photo = {driver.photo(r): (i, r) for i, r in enumerate(anchored['records'])}
        for q in queries:
            require(q['human_confirmed'] and q['class_author'] == 'owner' and q['clase'] == q['native_teacher_class'], 'Native GT changed.')
            _, row = anchored_by_photo[driver.photo(q)]
            require(row['clase'] == q['clase'], 'Candidate bank violates human priority.')
            require(driver.group(row) == driver.group(q), 'A photo crossed train/query groups.')
        for i, row in enumerate(actual['records']):
            j, candidate = anchored_by_photo[driver.photo(row)]
            require(candidate['baseline_flag'], 'A current reference lost baseline protection.')
            require(np.array_equal(data.arrays[actual['refs_array']][i],
                                   data.arrays[anchored['refs_array']][j]), 'Current reference embeddings changed.')
        if short == 'escom':
            require(sum(q['clase'] == 'edificio_5' for q in queries) == 9, 'Human class5 was removed.')
            require(sum(q['clase'] == 'edificio_5' for q in anchored['records']) == 10, 'Class5 was removed from the bank.')
            require(sum(not r.get('human_confirmed') and r.get('baseline_flag') for r in anchored['records']) == 60,
                    'Inherited current references were retired.')
        details[short] = dict(native_photos=len(queries), native_groups=cfg['native_groups'],
                              legacy_unique_photos=len(legacy), actual_rows=len(actual['records']),
                              anchored_photos=len(anchored['records']))
    require(md['historical_guard']['azc'] == dict(n=118, grupos=22, raw_correct=64, tp=38, fp=4, fn=12, tn=64),
            'Historical118 guard changed.')
    require(md['historical_guard']['escom'] == dict(n=96, noche=92, noche_raw_correct=62), 'Historical ESCOM guard changed.')
    return {'campuses': details, 'source_aliases_checked': len(alias_groups)}


def check_group_exclusion(data, protocol, driver):
    count = 0
    for short, cfg in protocol['campuses'].items():
        campus = cfg['metadata_campus']
        groups = sorted({driver.group(q) for q in data.queries if q['campus'] == campus})
        for index, outer in enumerate(groups):
            inner = groups[(index + 1) % len(groups)]
            excluded = {outer, inner}
            for recipe in protocol['recipes']:
                bundle = driver.prepare_training(data, campus, excluded, recipe)
                require(not excluded.intersection(bundle.train_groups), 'Held group in selected references.')
                bank = data.metadata['banks'][recipe['bank'] + '_' + short]
                expected = {r['id'] for r in bank['records'] if r['baseline_flag'] and driver.group(r) not in excluded}
                require(expected <= set(bundle.selected_ids), 'Scope/cap removed eligible baseline references.')
                require(bundle.refs.shape == (len(bundle.records), 3, 960), 'A photo lost or separated its three views.')
                if recipe['addition_scope'] == 'ext':
                    require(all(r['baseline_flag'] or (r['interior_known'] and not r['interior']) for r in bundle.records),
                            'Exterior scope admitted an unknown/interior addition.')
                if recipe['max_adiciones_por_fuente_clase'] == 2:
                    cells = {}
                    for r in bundle.records:
                        if not r['baseline_flag']:
                            cells.setdefault((r['clase'], driver.group(r)), set()).add(driver.photo(r))
                    require(all(len(v) <= 2 for v in cells.values()), 'Addition source/class cap violated.')
                count += 1
    return count


def check_train_only(data, protocol, driver):
    cfg = protocol['campuses']['escom']
    groups = sorted({driver.group(q) for q in data.queries if q['campus'] == cfg['metadata_campus']})
    recipe = next(r for r in protocol['recipes'] if r['transform'] == 'blanqueo_diagonal')
    excluded = groups[:2]
    first = driver.prepare_training(data, cfg['metadata_campus'], excluded, recipe)
    stats1 = driver.fit_transform(first, recipe['transform'], excluded)
    mutated = copy.copy(data)
    mutated.arrays = dict(data.arrays)
    # Every query can be replaced; selected refs and train statistics cannot change.
    for key in (data.metadata['queries']['threeviews_array'], data.metadata['queries']['central_array']):
        mutated.arrays[key] = np.full_like(data.arrays[key], -123.0)
    second = driver.prepare_training(mutated, cfg['metadata_campus'], excluded, recipe)
    stats2 = driver.fit_transform(second, recipe['transform'], excluded)
    require(first.selected_ids == second.selected_ids, 'Queries influenced reference selection.')
    require(np.array_equal(stats1['mean'], stats2['mean']) and np.array_equal(stats1['scale'], stats2['scale']),
            'Query features influenced transformation statistics.')
    require(stats1['fit_role'] == 'train_only' and not set(excluded).intersection(stats1['train_groups']), 'Transform role leaked.')
    photos = {}
    for row, refs in zip(first.records, first.refs):
        photos.setdefault(driver.photo(row), driver.unit(driver.unit(refs).mean(axis=0)))
    train_x = np.stack(list(photos.values()))
    require(np.array_equal(stats1['mean'], train_x.mean(axis=0, dtype=np.float64).astype(np.float32)),
            'Mean is not the train-only equal-photo mean.')
    variance = train_x.var(axis=0, dtype=np.float64)
    expected_scale = (1 / np.sqrt(np.maximum(.5 * variance + .5 * variance.mean(), 1e-4))).astype(np.float32)
    require(np.array_equal(stats1['scale'], expected_scale), 'Whitening differs from the declared train-only shrinkage.')
    expect_error(lambda: driver.fit_transform(first, recipe['transform'], first.train_groups[:1]), 'Transform accepted held training group.')
    return {'query_feature_mutation_invariant': True, 'train_unique_photos': len(photos)}


def check_teacher_comparator(data, protocol, driver, objective):
    config = protocol['fixed_teacher_comparator']
    recipe = config['recipe']
    require(not config['selected_by_inner'] and not config['included_in_recipe_search'], 'Teacher comparator became a tuned recipe.')
    require(recipe not in protocol['recipes'] and len(protocol['recipes']) == 29, 'Teacher comparator changed the recipe search.')
    details = {}
    for short, cfg in protocol['campuses'].items():
        campus = cfg['metadata_campus']
        anchored = data.metadata['banks'][cfg['anchored_bank']]
        expected_rows = [r for r in anchored['records'] if r['human_confirmed']]
        require(len(expected_rows) == cfg['native_photos'], 'Teacher comparator source is not the complete human set.')
        require(all(r['class_author'] == 'owner' and r['native_teacher_class'] == r['clase'] for r in expected_rows),
                'Teacher comparator includes inherited or web labels.')
        teacher_photos = {driver.photo(r) for r in expected_rows}
        require(teacher_photos == {driver.photo(q) for q in data.queries if q['campus'] == campus},
                'Teacher-only bank is not the identical immutable native human photo set.')
        full = driver.prepare_training(data, campus, [], recipe)
        require({driver.photo(r) for r in full.records} == teacher_photos, 'Teacher bank omitted humans or included non-humans.')
        by_id = {r['id']: i for i, r in enumerate(anchored['records'])}
        for row, refs in zip(full.records, full.refs):
            require(np.array_equal(refs, data.arrays[anchored['refs_array']][by_id[row['id']]]), 'Teacher embeddings or three views changed.')
        groups = sorted({driver.group(r) for r in expected_rows})
        for i, outer in enumerate(groups):
            excluded = {outer, groups[(i + 1) % len(groups)]}
            train = driver.prepare_training(data, campus, excluded, recipe)
            expected = {r['id'] for r in expected_rows if driver.group(r) not in excluded}
            require(set(train.selected_ids) == expected and not excluded.intersection(train.train_groups),
                    'Teacher-only comparator leaked a held union group or altered teacher identity.')
        policy = objective.teacher_policy(protocol, short)
        require(policy['role'] == 'fixed_teacher_only_comparator' and 'otro' not in policy['classes'],
                'Teacher-only policy changed its fixed reject semantics.')
        if short == 'escom':
            require(policy['classes']['edificio_5']['threshold'] == .8 and
                    policy['classes']['laboratorios']['threshold'] == .71, 'Teacher class5 or inherited thresholds changed.')
        details[short] = {'human_reference_photos': len(full.records), 'excluded_group_pairs_checked': len(groups),
                          'native_labels_and_vectors_identical': True}
    return details


def check_objective(protocol, objective):
    rows = []
    for i in range(8):
        rows.append(dict(id=f'synthetic_{i}', foto_id=f'synthetic_rgb_{i}', grupo=f'synthetic_group_{i % 3}',
                         true_class='edificio_5' if i < 5 else 'edificio_4',
                         legacy_true_class=None if i < 5 else 'edificio_4',
                         best_class='edificio_5' if i < 5 else 'edificio_4', best_score=.95, second_score=.1,
                         fold_role='inner_validation', train_groups=['synthetic_train']))
    policy = objective.calibrate_inner(rows, protocol, 'escom')
    require(policy['classes']['edificio_5']['threshold'] is not None, 'Supported class5 cannot be calibrated.')
    require(policy['classes']['edificio_3']['threshold'] is None, 'Unsupported class was accepted.')
    value = objective.metrics(rows, policy, protocol, 'escom')
    require('edificio_3' in value['native']['raw']['per_class'] and
            value['native']['raw']['per_class']['edificio_3']['f1'] == 0, 'Unsupported class hidden in macro F1.')
    invalid = copy.deepcopy(rows)
    invalid[0]['fold_role'] = 'outer_final'
    expect_error(lambda: objective.calibrate_inner(invalid, protocol, 'escom'), 'Outer row reached calibration.')
    expect_error(lambda: objective.select_inner([{'recipe': {'id': 'baseline'}, 'records': invalid}], protocol, 'escom'),
                 'Outer row reached selection.')
    invalid = copy.deepcopy(rows)
    invalid[0]['train_groups'].append(invalid[0]['grupo'])
    expect_error(lambda: objective.calibrate_inner(invalid, protocol, 'escom'), 'Leaked group reached calibration.')
    duplicate = rows + [copy.deepcopy(rows[0])]
    expect_error(lambda: objective.calibrate_inner(duplicate, protocol, 'escom'), 'Duplicated RGB photo counted as new query.')
    # Application to an outer observation only reads its already frozen score.
    a = dict(rows[0], fold_role='outer_final')
    b = dict(a, true_class='changed_outer_gt', legacy_true_class='changed_outer_legacy_gt')
    require(objective.apply_calibration([a], policy, protocol, 'escom')[0]['accepted_class'] ==
            objective.apply_calibration([b], policy, protocol, 'escom')[0]['accepted_class'], 'Outer label changed acceptance.')
    tie_rows = [dict(r, true_class='edificio_4', best_class='edificio_1', legacy_true_class='edificio_4') for r in rows]
    fallback = objective.select_inner([{'recipe': {'id': 'baseline'}, 'records': tie_rows},
                                       {'recipe': {'id': 'synthetic_tie'}, 'records': tie_rows}], protocol, 'escom')
    require(fallback['recipe']['id'] == 'baseline', 'A rank tie or low-precision baseline lost the declared fallback.')
    # A new native-class mistake outside the legacy42 set must still disqualify
    # an ESCOM candidate, even if the legacy regression totals were unchanged.
    protected = {'legacy': {'raw': {'correct': 1}, 'accepted_correct': 1, 'wrong_accepted': 0},
                 'native': {'accepted_correct': 1, 'wrong_accepted': 0}}
    native_regression = copy.deepcopy(protected)
    native_regression['native']['wrong_accepted'] = 1
    require(not objective._admissible(native_regression, protected, 'escom'),
            'Native accepted-error regression escaped the ESCOM protection.')
    return {'outer_rows_rejected_for_selection': True, 'unsupported_visible': True,
            'duplicate_photo_rejected': True, 'class5_supported_fixture_preserved': True}


def _check_one_inner_mutation(data, protocol, driver, objective, short):
    """Build all29 INNER candidates twice, never call run_nested or score outer."""
    cfg = protocol['campuses'][short]
    outer = sorted({driver.group(q) for q in data.queries if q['campus'] == cfg['metadata_campus']})[0]
    observed_roles = []
    original_score = driver.ScoreCache.score

    def score_inner_only(self, campus, excluded_groups, recipe, query_indices, *, fold_role):
        require(fold_role == 'inner_validation', 'Verifier attempted an outer score.')
        require(all(driver.group(self.data.queries[i]) != outer for i in query_indices), 'Outer query reached inner scorer.')
        observed_roles.append(fold_role)
        return original_score(self, campus, excluded_groups, recipe, query_indices, fold_role=fold_role)

    driver.ScoreCache.score = score_inner_only
    try:
        candidates = driver.build_inner_candidates(data, protocol, short, outer)
        selected = objective.select_inner(candidates, protocol, short)
        changed = copy.copy(data)
        changed.queries = copy.deepcopy(data.queries)
        changed.metadata = copy.deepcopy(data.metadata)
        changed.metadata['queries']['records'] = changed.queries
        changed.arrays = dict(data.arrays)
        index = [i for i, q in enumerate(changed.queries) if driver.group(q) == outer]
        for i in index:
            changed.queries[i]['clase'] = 'synthetic_mutated_outer_label'
            changed.queries[i]['native_teacher_class'] = 'synthetic_mutated_outer_label'
        for key in (data.metadata['queries']['threeviews_array'], data.metadata['queries']['central_array']):
            changed.arrays[key] = data.arrays[key].copy()
            changed.arrays[key][index] = 0.123
        mutated_candidates = driver.build_inner_candidates(changed, protocol, short, outer)
        changed_selected = objective.select_inner(mutated_candidates, protocol, short)
        require(canonical(candidates) == canonical(mutated_candidates), 'Outer labels/features altered an inner candidate.')
        require(canonical(selected) == canonical(changed_selected), 'Outer labels/features altered recipe or calibration.')
        inner = sorted({driver.group(q) for q in data.queries if q['campus'] == cfg['metadata_campus']} - {outer})[0]
        qi = data.query_indices([inner], cfg['metadata_campus'])
        teacher_recipe = protocol['fixed_teacher_comparator']['recipe']
        first_teacher = driver.ScoreCache(data).score(cfg['metadata_campus'], [outer, inner], teacher_recipe, qi,
                                                       fold_role='inner_validation')
        changed_teacher = driver.ScoreCache(changed).score(cfg['metadata_campus'], [outer, inner], teacher_recipe, qi,
                                                            fold_role='inner_validation')
        require(canonical(first_teacher) == canonical(changed_teacher), 'Outer mutation altered teacher-only inner scores.')
    finally:
        driver.ScoreCache.score = original_score
    return {'all_recipes': 29, 'inner_score_calls': len(observed_roles),
            'outer_label_feature_mutation_invariant': True, 'teacher_comparator_mutation_invariant': True,
            'outer_queries_evaluated': 0}


def check_inner_mutation(data, protocol, driver, objective):
    return {short: _check_one_inner_mutation(data, protocol, driver, objective, short)
            for short in protocol['campuses']}


def sanitized(value):
    blob = json.dumps(value, ensure_ascii=False)
    require(not re.search(r'[A-Za-z]:[\\/]|https?://|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', blob), 'Report contains a path, URL or email.')
    return True


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--protocol', type=Path, default=ANIDADA / 'protocolo_anidado.json')
    parser.add_argument('--driver', type=Path, default=ROOT / 'herramientas/optimizar_anidado.py')
    parser.add_argument('--report', type=Path, default=ANIDADA / 'verificacion_preouter.json')
    parser.add_argument('--skip-inner-mutation', action='store_true', help='Partial preflight only; cannot produce technical approval.')
    args = parser.parse_args(argv)
    watched = {'protocol': args.protocol, 'driver': args.driver,
               'objective': Path(__file__).with_name('objetivo_anidado.py'), 'verifier': Path(__file__),
               'metadata': ROOT / 'privado/bancos_ajuste_metadata.json', 'npz': ROOT / 'privado/bancos_ajuste.npz'}
    start_signatures = {name: sha(path) for name, path in watched.items()}
    driver = module(args.driver, 'audited_nested_driver')
    objective_path = Path(__file__).with_name('objetivo_anidado.py')
    objective = module(objective_path, 'audited_nested_objective')
    protocol = read(args.protocol)
    data = driver.load_banks(ROOT / 'privado/bancos_ajuste_metadata.json', ROOT / 'privado/bancos_ajuste.npz')
    results = {}
    checks = [('inputs', lambda: check_inputs(data, protocol, driver)),
              ('group_exclusion', lambda: {'bundles_checked': check_group_exclusion(data, protocol, driver)}),
              ('train_only', lambda: check_train_only(data, protocol, driver)),
              ('teacher_only_comparator', lambda: check_teacher_comparator(data, protocol, driver, objective)),
              ('objective', lambda: check_objective(protocol, objective))]
    if not args.skip_inner_mutation:
        checks.append(('inner_outer_mutation', lambda: check_inner_mutation(data, protocol, driver, objective)))
    failures = []
    for name, action in checks:
        try:
            results[name] = action()
        except Exception as error:
            # Use fixed assertion messages; never include arbitrary metadata.
            failures.append({'check': name, 'error_type': type(error).__name__, 'message': str(error)})
    end_signatures = {name: sha(path) for name, path in watched.items()}
    if start_signatures != end_signatures:
        failures.append({'check': 'stable_bytes', 'error_type': 'AssertionError',
                         'message': 'Code, protocol or inputs changed during verification; repeat before freezing.'})
    report = {'schema_version': 1, 'technical_approval': not failures and not args.skip_inner_mutation,
              'candidate_outer_evaluation_run': False, 'outer_queries_evaluated': 0,
              'context': 'retrospective_nested_internal_validation_not_external_blind_test',
              'partial_preflight': args.skip_inner_mutation, 'checks': results, 'failures': failures,
              'stable_bytes_during_verification': start_signatures == end_signatures,
              'runtime': {'python': sys.version.split()[0], 'numpy': np.__version__},
              'sha256': end_signatures}
    sanitized(report)
    args.report.parent.mkdir(parents=True, exist_ok=True)
    args.report.write_text(json.dumps(report, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    print(json.dumps(report, ensure_ascii=False, indent=2))
    return 0 if report['technical_approval'] else 1


if __name__ == '__main__':
    raise SystemExit(main())
