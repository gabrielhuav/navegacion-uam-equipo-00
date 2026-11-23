"""Independent numerical audit and aggregate-only publication of nested results.

Reads private records locally. Public JSON contains no query/photo/group IDs,
source paths, source URLs, photo hashes, photographs or feature vectors.
This is reporting only: it never scores an image or selects a hyperparameter.
"""
from __future__ import annotations

import argparse
from collections import Counter, defaultdict
import json
import math
from pathlib import Path
import re
import statistics


ROOT = Path(__file__).resolve().parents[1]
REJECT = '__reject__'
SHORT = {'uam_azcapotzalco': 'azc', 'escom': 'escom'}


def read(path):
    return json.loads(Path(path).read_text(encoding='utf-8-sig'))


def require(condition, message):
    if not condition:
        raise ValueError(message)


def group(row):
    return row.get('grupo_union') or row['grupo']


def ratio(numerator, denominator):
    return numerator / denominator if denominator else None


def project(label, cfg):
    if label is None or label == REJECT:
        return REJECT
    label = cfg['legacy_aliases'].get(label, label)
    return cfg['legacy_unknown_to'] if cfg['legacy_unknown_to'] and label not in cfg['legacy_classes'] else label


def classification(truth, predictions, classes):
    """Fixed vocabulary including zero-support/unsupported classes."""
    per_class = {}
    for label in classes:
        true_positive = sum(y == label and p == label for y, p in zip(truth, predictions))
        false_positive = sum(y != label and p == label for y, p in zip(truth, predictions))
        false_negative = sum(y == label and p != label for y, p in zip(truth, predictions))
        denominator = 2 * true_positive + false_positive + false_negative
        per_class[label] = {'support': truth.count(label), 'tp': true_positive,
                            'fp': false_positive, 'fn': false_negative,
                            'f1': 2 * true_positive / denominator if denominator else 0.0}
    correct = sum(y == p for y, p in zip(truth, predictions))
    return {'correct': correct, 'accuracy': ratio(correct, len(truth)),
            'macro_f1': sum(r['f1'] for r in per_class.values()) / len(classes), 'per_class': per_class}


def summarize_cohort(rows, cfg, *, legacy=False, destination_classes=None):
    if legacy:
        rows = [r for r in rows if r.get('legacy_true_class') is not None]
    truth = [r['legacy_true_class'] if legacy else r['true_class'] for r in rows]
    raw = [project(r['best_class'], cfg) if legacy else (r['best_class'] or REJECT) for r in rows]
    accepted = [project(r.get('accepted_class'), cfg) if legacy else (r.get('accepted_class') or REJECT) for r in rows]
    classes = cfg['legacy_classes'] if legacy else cfg['native_classes']
    raw_metrics = classification(truth, raw, classes)
    accepted_metrics = classification(truth, accepted, classes)
    accepted_n = sum(p != REJECT for p in accepted)
    correct_accepted = sum(y == p and p != REJECT for y, p in zip(truth, accepted))
    wrong_accepted = sum(y != p and p != REJECT for y, p in zip(truth, accepted))
    negatives = sum(y == 'otro' for y in truth)
    result = {'photos': len(rows), 'raw': raw_metrics, 'accepted': accepted_metrics,
              'accepted_count': accepted_n, 'accepted_correct': correct_accepted,
              'wrong_accepted': wrong_accepted, 'rejected_count': len(rows) - accepted_n,
              'coverage': ratio(accepted_n, len(rows)),
              'accepted_precision': ratio(correct_accepted, accepted_n),
              'negative_photos': negatives,
              'negative_rejected': sum(y == 'otro' and p == REJECT for y, p in zip(truth, accepted)),
              'positive_rejected': sum(y != 'otro' and p == REJECT for y, p in zip(truth, accepted))}
    if destination_classes is not None:
        navigable = [p if r.get('accepted_class') in destination_classes else REJECT for r, p in zip(rows, accepted)]
        navigation_n = sum(p != REJECT for p in navigable)
        navigation_correct = sum(y == p and p != REJECT for y, p in zip(truth, navigable))
        navigation_wrong = sum(y != p and p != REJECT for y, p in zip(truth, navigable))
        result['mapped_destination_gate'] = {
            'navigable_accepted_count': navigation_n, 'navigable_correct_label': navigation_correct,
            'navigable_wrong_label': navigation_wrong,
            'navigable_precision_by_cohort_label': ratio(navigation_correct, navigation_n),
            'navigable_coverage': ratio(navigation_n, len(rows)),
            'accepted_without_mapped_destination': accepted_n - navigation_n,
            'rejected_after_destination_gate': len(rows) - navigation_n,
            'classification': classification(truth, navigable, classes),
            'route_execution_or_navigation_accuracy_measured': False}
    if cfg.get('protected_target'):
        label = cfg['protected_target']
        tp = sum(y == label and p == label for y, p in zip(truth, accepted))
        fp = sum(y != label and p == label for y, p in zip(truth, accepted))
        fn = sum(y == label and p != label for y, p in zip(truth, accepted))
        tn = sum(y != label and p != label for y, p in zip(truth, accepted))
        result['target_T_accepted'] = {'tp': tp, 'fp': fp, 'fn': fn, 'tn': tn,
                                       'precision': ratio(tp, tp + fp), 'recall': ratio(tp, tp + fn),
                                       'f1': ratio(2 * tp, 2 * tp + fp + fn)}
    require(correct_accepted + wrong_accepted == accepted_n, 'Accepted totals do not add up.')
    require(accepted_n + result['rejected_count'] == len(rows), 'Cohort denominator changed.')
    return result


def load_fit_summary(export_root, protocol):
    receipt = read(export_root / 'recibo_exportaciones_finales.json')
    require(receipt['protocol_sha256'] == protocol['protocol_sha256'] and receipt['final_fit_not_outer_estimate'],
            'Final export receipt uses a different protocol or misstates its accuracy context.')
    summaries = {}
    destination_classes = {'actual': {}, 'maestro': {}, 'combinada': {}}
    for variant, public_variant in (('maestro', 'maestro'), ('combinado', 'combinada')):
        summaries[public_variant] = {}
        for short, cfg in protocol['campuses'].items():
            item = receipt['exports'][variant][short]
            artifact = read(export_root / variant / (cfg['metadata_campus'] + '.json'))
            require(item['final_fit_is_not_an_outer_accuracy_estimate'], 'Final fitting was represented as an outer estimate.')
            require(artifact['dimension'] == 960 and artifact['sha256_modelo'] == protocol['model']['sha256'], 'Export changed the encoder.')
            require(artifact['clases'] == sorted(artifact['prototipos']) == sorted(artifact['identificadores_foto']),
                    'Export class inventories disagree.')
            enabled = []
            operations = {}
            for cls in artifact['clases']:
                op = artifact['configuracion']
                threshold, margin = op['umbrales'][cls], op['margenes'][cls]
                operations[cls] = {'threshold': threshold if threshold <= 1 else None, 'margin': margin,
                                    'policy_enabled': threshold <= 1, 'has_mapped_destination': cls in artifact['destinos']}
                if threshold <= 1:
                    enabled.append(cls)
            require(item['prototypes'] == sum(len(v) for v in artifact['prototipos'].values()), 'Export vector count disagrees with its receipt.')
            require(item['classes_without_destination'] == [c for c in artifact['clases'] if c not in artifact['destinos']],
                    'Unmapped classes were hidden in the export receipt.')
            require(item['parity']['passed'], 'Export numerical parity did not pass.')
            summaries[public_variant][short] = {
                'selected_recipe': item['selected_recipe'], 'reference_photos': item['photos'],
                'reference_views': item['prototypes'], 'classes': artifact['clases'],
                'fixed_or_inner_fitted_policy': operations,
                'policy_enabled_classes': enabled,
                'classes_without_destination': item['classes_without_destination'],
                'policy_enabled_without_destination': item['calibrated_without_destination'],
                'enabled_with_destination': item['enabled_with_destination'],
                'configuration': {'pooling': artifact['configuracion']['pooling'],
                                  'k': artifact['configuracion']['k'],
                                  'natural_query_views': artifact['configuracion']['vistas_query'],
                                  'transform': item['selected_recipe']['transform']},
                'full_fit_is_not_an_outer_accuracy_estimate': True,
                'reported_numeric_parity': {k: item['parity'][k] for k in
                                          ('checked_queries', 'maximum_absolute_class_score_error', 'tolerance', 'passed')}}
            destination_classes[public_variant][short] = set(artifact['destinos'])
    # The teacher export preserves the current mappings and adds only aliases
    # for new classes. Intersecting the frozen current vocabulary recovers the
    # original current class gate without promoting a new class into baseline.
    for short, cfg in protocol['campuses'].items():
        destination_classes['actual'][short] = destination_classes['maestro'][short].intersection(cfg['baseline_acceptance'])
        require(destination_classes['actual'][short] == set(cfg['baseline_acceptance']), 'A current destination mapping disappeared.')
    return summaries, destination_classes


def fixed_policy(protocol, short, teacher=False):
    if not teacher:
        return {c: {'threshold': t, 'margin': 0.0} for c, t in protocol['campuses'][short]['baseline_acceptance'].items()}
    cfg = protocol['fixed_teacher_comparator']
    return {c: {'threshold': cfg['threshold_overrides'].get(c, cfg['general_threshold']), 'margin': cfg['margin']}
            for c in protocol['campuses'][short]['native_classes'] if c not in cfg['never_accept_classes']}


def audit_predictions(result, protocol, metadata):
    require(result.get('full_outer_run') is True and result.get('external_new_test') is False,
            'Only a complete declared internal outer run may be summarized.')
    require(result['protocol_sha256'] == protocol['protocol_sha256'], 'Result uses a different protocol.')
    queries = metadata['queries']['records']
    expected = {q['id']: q for q in queries}
    require(len(expected) == 217 and len({(q['campus'], q['foto_id']) for q in queries}) == 217,
            'Native human identity or unique-photo denominator changed.')
    legacy = {}
    for value in metadata['baseline_queries'].values():
        for row in value['records']:
            key = (row['campus'], row['foto_id'])
            if key in legacy:
                require(legacy[key] == row['clase'], 'Conflicting original legacy label.')
            legacy[key] = row['clase']
    folds = {f['outer_group']: f for f in result['folds']}
    require(len(folds) == len(result['folds']) == len({group(q) for q in queries}), 'Outer folds are incomplete or duplicated.')
    procedures = {'actual': result['baseline_predictions'],
                  'maestro': result['comparator_predictions']['maestro_solo'],
                  'combinada': result['predictions']}
    checks = Counter()
    for procedure, rows in procedures.items():
        require(len(rows) == 217 and {r['query_id'] for r in rows} == set(expected),
                'A procedure changed or duplicated query identities.')
        for row in rows:
            native = expected[row['query_id']]
            require(row['true_class'] == native['clase'] == native['native_teacher_class'] and native['human_confirmed'],
                    'A procedure changed immutable native truth.')
            require(row['campus'] == native['campus'] and row['foto_id'] == native['foto_id'] and row['grupo'] == group(native),
                    'A procedure changed query identity, campus or provenance.')
            require(row.get('legacy_true_class') == legacy.get((native['campus'], native['foto_id'])),
                    'A procedure changed the separate legacy projection.')
            require(row['grupo'] not in row['train_groups'] and row['grupo'] in row['blocked_groups'],
                    'An outer observation leaked into references or transform training.')
            short = SHORT[row['campus']]
            scores = row['class_scores']
            require(scores and all(math.isfinite(v) for v in scores.values()), 'Invalid raw class scores.')
            ranked = sorted(scores, key=lambda c: (-scores[c], c))
            require(row['best_class'] == ranked[0] and math.isclose(row['best_score'], scores[ranked[0]], abs_tol=1e-7),
                    'Raw winning class or score is inconsistent.')
            second = scores[ranked[1]] if len(ranked) > 1 else -1.0
            require(math.isclose(row['second_score'], second, abs_tol=1e-7), 'Runner-up score is inconsistent.')
            if procedure == 'actual':
                policy = fixed_policy(protocol, short)
                require(row['recipe_id'] == 'actual_fijo', 'Current baseline was tuned or replaced.')
            elif procedure == 'maestro':
                policy = fixed_policy(protocol, short, teacher=True)
                require(row['recipe_id'] == 'maestro_solo', 'Teacher comparator became a selected recipe.')
            else:
                selection = folds[row['grupo']]['selections'][short]
                require(selection['selection_role'] == 'inner_validation_only', 'Combined selection did not remain inner-only.')
                require(row['recipe_id'] == selection['recipe']['recipe_id'], 'Outer result used a different selected recipe.')
                policy = selection['policy']['classes']
            operation = policy.get(row['best_class'])
            accepted = (operation is not None and operation.get('threshold') is not None and
                        row['best_score'] >= operation['threshold'] and
                        row['best_score'] - row['second_score'] >= operation['margin'])
            expected_accepted = row['best_class'] if accepted else None
            require(row.get('accepted_class') == expected_accepted, 'Reported acceptance disagrees with the frozen threshold/margin.')
            checks[procedure] += 1
    return procedures, dict(checks)


def aggregate_policies(result, protocol):
    result_policy = {}
    for short in protocol['campuses']:
        recipe_folds = Counter()
        recipe_queries = Counter(r['recipe_id'] for r in result['predictions'] if SHORT[r['campus']] == short)
        operations = defaultdict(list)
        folds = 0
        for fold in result['folds']:
            selection = fold['selections'].get(short)
            if not selection:
                continue
            folds += 1
            recipe_folds[selection['recipe']['recipe_id']] += 1
            for cls, op in selection['policy']['classes'].items():
                operations[cls].append(op)
        per_class = {}
        for cls in protocol['campuses'][short]['bank_classes']:
            enabled = [op for op in operations[cls] if op.get('threshold') is not None]
            thresholds = [op['threshold'] for op in enabled]
            per_class[cls] = {'enabled_folds': len(enabled), 'disabled_or_unsupported_folds': folds - len(enabled),
                              'threshold_min': min(thresholds) if thresholds else None,
                              'threshold_median': statistics.median(thresholds) if thresholds else None,
                              'threshold_max': max(thresholds) if thresholds else None,
                              'margin_counts': dict(sorted(Counter(str(op['margin']) for op in enabled).items()))}
        result_policy[short] = {'fold_count': folds, 'selected_recipe_fold_counts': dict(sorted(recipe_folds.items())),
                                'selected_recipe_query_counts': dict(sorted(recipe_queries.items())),
                                'combined_policy_by_class': per_class,
                                'actual_fixed_policy': fixed_policy(protocol, short),
                                'teacher_fixed_policy': fixed_policy(protocol, short, teacher=True)}
    return result_policy


def check_public_privacy(value, *, allowed_classes, allowed_recipes):
    allowed = set(allowed_classes) | set(allowed_recipes)
    forbidden_keys = {'id', 'ids', 'query_id', 'foto_id', 'grupo', 'grupo_union', 'train_groups',
                      'blocked_groups', 'outer_group', 'sha256', 'photo_hash', 'path', 'paths',
                      'embeddings', 'embedding', 'features', 'vectors', 'query_vectors', 'class_scores'}

    def visit(item):
        if isinstance(item, dict):
            for key, val in item.items():
                require(key not in forbidden_keys, 'Public report contains a forbidden private field.')
                require(not re.search(r'[A-Za-z]:[\\/]|https?://|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', key),
                        'Public report key contains a personal locator.')
                visit(val)
        elif isinstance(item, list):
            for val in item:
                visit(val)
        elif isinstance(item, str):
            require(not re.search(r'[A-Za-z]:[\\/]|https?://|[\w.+-]+@[\w.-]+\.[A-Za-z]{2,}', item),
                    'Public report contains a path, URL or email.')
            require(not re.search(r'\b(?:foto|rgb|evalgrp|grupo)_[A-Za-z0-9]+|\b[0-9a-f]{64}\b', item),
                    'Public report contains an opaque photograph/group identifier or digest.')
        elif isinstance(item, float):
            require(math.isfinite(item), 'Public report contains a non-finite number.')
        else:
            require(item is None or isinstance(item, (int, bool)), 'Public report contains unsupported content.')
    visit(value)
    return True


def make_summary(result, protocol, metadata, *, export_root=None):
    procedures, checks = audit_predictions(result, protocol, metadata)
    fit_summary, destination_classes = load_fit_summary(export_root, protocol) if export_root else (None, None)
    campuses = {}
    for short, cfg in protocol['campuses'].items():
        campus_procedures = {}
        for name, rows in procedures.items():
            campus_rows = [r for r in rows if r['campus'] == cfg['metadata_campus']]
            mapped = None if destination_classes is None else destination_classes[name][short]
            native = summarize_cohort(campus_rows, cfg, destination_classes=mapped)
            legacy = summarize_cohort(campus_rows, cfg, legacy=True, destination_classes=mapped)
            require(native['photos'] == cfg['native_photos'] and legacy['photos'] == cfg['legacy_unique_human_photos'],
                    'A reported cohort denominator differs from the predeclared count.')
            campus_procedures[name] = {'native_human': native, 'legacy_unique_human_projection': legacy}
        campuses[short] = campus_procedures
    summary = {'schema_version': 1, 'publication_scope': 'aggregate_metrics_and_policies_only',
               'evaluation_context': 'retrospective_nested_internal_validation',
               'external_blind_test': False, 'data_previously_examined': True,
               'comparators': {'actual': 'Frozen current reference bank and inherited fixed thresholds.',
                               'maestro': 'All and only native human references; untuned historical scoring and fixed thresholds.',
                               'combinada': 'The procedure selected independently inside each outer fold from the 29 predeclared recipes.'},
               'interpretation': [
                   'The native and legacy cohorts overlap; they are not independent evidence.',
                   'Native owner labels remain unchanged. Legacy labels are a separate historical projection.',
                   'Accepted correct excludes rejections. Wrong accepted counts every accepted claim with the wrong cohort label.',
                   'Reject is a separate sentinel; negative rejections are reported explicitly.',
                   'Macro F1 uses the fixed predeclared vocabulary; unsupported or zero-denominator classes remain zero.',
                   'An aggregate outer result does not select a new recipe, exception or threshold.',
                   'No comparator is declared superior before inspecting its complete paired numerical results.'
               ],
               'campuses': campuses, 'policy_aggregates': aggregate_policies(result, protocol),
               'checks': {'query_predictions_independently_audited': checks,
                          'immutable_native_truth': True, 'unique_rgb_query_denominators': True,
                          'outer_group_excluded_from_training': True,
                          'accepted_labels_match_frozen_policies': True,
                          'teacher_comparator_not_in_recipe_search': True,
                          'public_report_contains_no_private_identifiers_or_vectors': True}}
    if fit_summary is not None:
        summary['final_fit'] = fit_summary
        summary['interpretation'].extend([
            'Policy acceptance covers all classes; navigable acceptance additionally requires an approved mapped destination.',
            'Destination-gated precision compares cohort labels. It does not measure physical routing, route completion or live video behavior.',
            'Final exported fits use all authorized references. Their numerical parity checks are not new accuracy evaluations.'
        ])
    classes = [c for cfg in protocol['campuses'].values() for c in cfg['bank_classes']]
    recipes = [r['recipe_id'] for r in protocol['recipes']] + ['maestro_solo']
    check_public_privacy(summary, allowed_classes=classes, allowed_recipes=recipes)
    return summary


def main(argv=None):
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--result', type=Path, default=ROOT / 'anidada/resultado_anidado_privado.json')
    parser.add_argument('--protocol', type=Path, default=ROOT / 'anidada/protocolo_congelado.json')
    parser.add_argument('--metadata', type=Path, default=ROOT / 'privado/bancos_ajuste_metadata.json')
    parser.add_argument('--output', type=Path, default=ROOT / 'publico/resumen_anidado.json')
    parser.add_argument('--exports', type=Path, default=ROOT / 'privado/exportaciones_finales')
    args = parser.parse_args(argv)
    summary = make_summary(read(args.result), read(args.protocol), read(args.metadata), export_root=args.exports)
    args.output.parent.mkdir(parents=True, exist_ok=True)
    args.output.write_text(json.dumps(summary, ensure_ascii=False, indent=2, allow_nan=False) + '\n', encoding='utf-8')
    print(json.dumps({'publication_created': True, 'private_identifiers_or_vectors_included': False,
                      'predictions_audited': summary['checks']['query_predictions_independently_audited'],
                      'context': summary['evaluation_context']}, indent=2))
    return 0


if __name__ == '__main__':
    raise SystemExit(main())
