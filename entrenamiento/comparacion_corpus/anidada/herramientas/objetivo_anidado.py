"""Frozen inner-only calibration and conservative model selection.

No file I/O, outer observations or neural inference are used by this module.
The driver supplies one native human row per exact RGB photo. A legacy label,
when available, is an additional evaluation projection, never replacement GT.
"""
from __future__ import annotations

from collections import Counter
import math
import numpy as np


REJECT = '__reject__'


def _campus(protocol, campus):
    return protocol['campuses'][campus]


def _checked(records):
    rows = list(records)
    seen = set()
    for row in rows:
        if row.get('fold_role') != 'inner_validation':
            raise ValueError('Selection accepts inner_validation only.')
        group = row.get('grupo_union', row.get('grupo'))
        if not group or group in set(row.get('train_groups', ())):
            raise ValueError('Inner validation group leaked into training.')
        outer = row.get('outer_excluded_group')
        if outer and (group == outer or outer in set(row.get('train_groups', ()))):
            raise ValueError('Outer held group reached inner observations or training.')
        photo = row.get('foto_id', row['id'])
        if photo in seen:
            raise ValueError('Native inner rows must be unique exact-RGB photos.')
        seen.add(photo)
        if not all(math.isfinite(float(row[x])) for x in ('best_score', 'second_score')):
            raise ValueError('Non-finite score.')
    return rows


def baseline_policy(protocol, campus):
    config = _campus(protocol, campus)['baseline_acceptance']
    return {'role': 'fixed_baseline', 'classes': {
        cls: {'threshold': float(threshold), 'margin': 0.0, 'status': 'fixed_baseline'}
        for cls, threshold in config.items()
    }}


def teacher_policy(protocol, campus):
    """Untuned teacher-only comparator: general .8 with frozen overrides."""
    cfg = protocol['fixed_teacher_comparator']
    return {'role': 'fixed_teacher_only_comparator', 'classes': {
        cls: {'threshold': float(cfg['threshold_overrides'].get(cls, cfg['general_threshold'])),
              'margin': 0.0, 'status': 'fixed_teacher_only_comparator'}
        for cls in _campus(protocol, campus)['native_classes']
        if cls not in cfg['never_accept_classes']
    }}


def calibrate_inner(records, protocol, campus):
    rows = _checked(records)
    cfg = protocol['calibration']
    classes = _campus(protocol, campus)['bank_classes']
    result = {}
    for cls in classes:
        positives = [r for r in rows if r['true_class'] == cls]
        predicted = [r for r in rows if r['best_class'] == cls]
        positive_groups = {r.get('grupo_union', r['grupo']) for r in positives}
        negative_n = sum(r['true_class'] != cls for r in rows)
        support = {'positive_photos': len(positives), 'positive_groups': len(positive_groups),
                   'negative_photos': negative_n}
        choices = []
        if (cls not in cfg['never_accept_classes'] and predicted and negative_n and
                len(positive_groups) >= cfg['min_positive_groups']):
            thresholds = set(float(x) for x in cfg['fixed_thresholds'])
            thresholds.update(float(x) for x in np.quantile(
                [r['best_score'] for r in predicted], cfg['quantiles'], method='linear'))
            for threshold in sorted(thresholds):
                for margin in cfg['margins']:
                    accepted = [r for r in predicted if r['best_score'] >= threshold and
                                r['best_score'] - r['second_score'] >= margin]
                    groups = {r.get('grupo_union', r['grupo']) for r in accepted}
                    tp = sum(r['true_class'] == cls for r in accepted)
                    fp = len(accepted) - tp
                    if (len(accepted) < cfg['min_accepted_photos'] or
                            len(groups) < cfg['min_accepted_groups'] or
                            tp < cfg['min_precision'] * len(accepted)):
                        continue
                    # Fixed lexicographic choice: recall, precision, stricter
                    # threshold, stricter margin. No outer label is available.
                    precision = tp / len(accepted)
                    choices.append(((tp / len(positives), precision, threshold, margin),
                                    threshold, margin, tp, fp, len(groups)))
        if choices:
            _, threshold, margin, tp, fp, groups = max(choices)
            result[cls] = dict(status='calibrated_inner', threshold=threshold, margin=margin,
                               tp=tp, fp=fp, accepted_groups=groups, **support)
        else:
            result[cls] = dict(status='unsupported_or_no_admissible_operation',
                               threshold=None, margin=None, **support)
    return {'role': 'inner_validation_only', 'classes': result}


def accept(row, policy):
    operation = policy['classes'].get(row['best_class'])
    if not operation or operation.get('threshold') is None:
        return REJECT
    if (row['best_score'] >= operation['threshold'] and
            row['best_score'] - row['second_score'] >= operation['margin']):
        return row['best_class']
    return REJECT


def apply_calibration(records, policy, protocol, campus):
    """Apply a previously fixed policy to any role without reading true labels."""
    policy = baseline_policy(protocol, campus) if policy is None else policy
    return [dict(row, accepted_class=None if accept(row, policy) == REJECT else accept(row, policy))
            for row in records]


def project_legacy(label, protocol, campus):
    cfg = _campus(protocol, campus)
    label = cfg['legacy_aliases'].get(label, label)
    if cfg['legacy_unknown_to'] and label not in cfg['legacy_classes']:
        return cfg['legacy_unknown_to']
    return label


def _classification(truth, predicted, classes):
    per_class = {}
    for cls in classes:
        tp = sum(y == cls and p == cls for y, p in zip(truth, predicted))
        fp = sum(y != cls and p == cls for y, p in zip(truth, predicted))
        fn = sum(y == cls and p != cls for y, p in zip(truth, predicted))
        denominator = 2 * tp + fp + fn
        per_class[cls] = {'tp': tp, 'fp': fp, 'fn': fn, 'support': truth.count(cls),
                          'f1': 2 * tp / denominator if denominator else 0.0}
    return {'n': len(truth), 'correct': sum(y == p for y, p in zip(truth, predicted)),
            'macro_f1': sum(x['f1'] for x in per_class.values()) / len(classes),
            'per_class': per_class}


def metrics(records, policy, protocol, campus):
    rows = _checked(records)
    cfg = _campus(protocol, campus)
    native_truth = [r['true_class'] for r in rows]
    raw = [r['best_class'] for r in rows]
    accepted = [accept(r, policy) for r in rows]
    legacy_rows = [(r, p) for r, p in zip(rows, accepted) if r.get('legacy_true_class') is not None]
    legacy_truth = [r['legacy_true_class'] for r, _ in legacy_rows]
    legacy_raw = [project_legacy(r['best_class'], protocol, campus) for r, _ in legacy_rows]
    legacy_accepted = [project_legacy(p, protocol, campus) if p != REJECT else REJECT for _, p in legacy_rows]
    native = {'raw': _classification(native_truth, raw, cfg['native_classes']),
              'accepted': _classification(native_truth, accepted, cfg['native_classes']),
              'accepted_correct': sum(y == p and p != REJECT for y, p in zip(native_truth, accepted)),
              'wrong_accepted': sum(y != p and p != REJECT for y, p in zip(native_truth, accepted)),
              'accepted_n': sum(p != REJECT for p in accepted)}
    legacy = {'raw': _classification(legacy_truth, legacy_raw, cfg['legacy_classes']),
              'accepted': _classification(legacy_truth, legacy_accepted, cfg['legacy_classes']),
              'accepted_correct': sum(y == p and p != REJECT for y, p in zip(legacy_truth, legacy_accepted)),
              'wrong_accepted': sum(y != p and p != REJECT for y, p in zip(legacy_truth, legacy_accepted)),
              'accepted_n': sum(p != REJECT for p in legacy_accepted)}
    target = cfg.get('protected_target')
    target_counts = None
    if target:
        target_counts = {'tp': sum(r['legacy_true_class'] == target and p == target for r, p in legacy_rows),
                         'fp': sum(r['legacy_true_class'] != target and p == target for r, p in legacy_rows)}
    unsupported = [cls for cls in cfg['native_classes']
                   if policy['classes'].get(cls, {}).get('threshold') is None]
    return {'native': native, 'legacy': legacy, 'protected_target': target_counts,
            'unsupported_native_classes': unsupported,
            'inner_photo_count': len(rows), 'inner_group_count': len({r.get('grupo_union', r['grupo']) for r in rows})}


def _admissible(value, baseline, campus):
    if value['legacy']['raw']['correct'] < baseline['legacy']['raw']['correct']:
        return False
    if campus == 'azc':
        a, b = value['protected_target'], baseline['protected_target']
        return a['tp'] >= b['tp'] and a['fp'] <= b['fp']
    return all(value[subset]['accepted_correct'] >= baseline[subset]['accepted_correct'] and
               value[subset]['wrong_accepted'] <= baseline[subset]['wrong_accepted']
               for subset in ('legacy', 'native'))


def _rank(value):
    return (value['native']['raw']['macro_f1'], value['legacy']['accepted']['macro_f1'])


def _strict(value, baseline, campus):
    # The fixed baseline participates in the same lexicographic ranking.
    # A protective improvement cannot compensate for a worse ranked result;
    # exact ranked ties remain baseline even when a protection improved.
    return _rank(value) > _rank(baseline)


def select_inner(candidates, protocol, campus):
    evaluated = []
    baseline = None
    for order, candidate in enumerate(candidates):
        recipe = candidate['recipe']
        is_baseline = recipe['id'] == 'baseline'
        policy = baseline_policy(protocol, campus) if is_baseline else calibrate_inner(candidate['records'], protocol, campus)
        value = metrics(candidate['records'], policy, protocol, campus)
        item = {'recipe': recipe, 'policy': policy, 'metrics': value, 'order': order}
        evaluated.append(item)
        if is_baseline:
            baseline = item
    if baseline is None:
        raise ValueError('Fixed baseline candidate is mandatory.')
    photos = {r.get('foto_id', r['id']) for r in candidates[0]['records']}
    labels = {r.get('foto_id', r['id']): (r['true_class'], r.get('legacy_true_class'),
              r.get('grupo_union', r['grupo'])) for r in candidates[0]['records']}
    for candidate in candidates:
        if {r.get('foto_id', r['id']) for r in candidate['records']} != photos:
            raise ValueError('Candidates must share the identical inner native query set.')
        if {r.get('foto_id', r['id']): (r['true_class'], r.get('legacy_true_class'),
                r.get('grupo_union', r['grupo'])) for r in candidate['records']} != labels:
            raise ValueError('Candidate-specific truth labels or query groups are forbidden.')
    viable = [v for v in evaluated if v is not baseline and
              _admissible(v['metrics'], baseline['metrics'], campus) and
              _strict(v['metrics'], baseline['metrics'], campus)]
    if not viable:
        selected = baseline
        reason = 'fixed_baseline_no_strict_admissible_inner_improvement'
    else:
        selected = max(viable, key=lambda v: (*_rank(v['metrics']), -v['order']))
        reason = 'strict_admissible_inner_improvement'
    return {'recipe': selected['recipe'], 'policy': selected['policy'], 'metrics': selected['metrics'],
            'reason': reason, 'eligible_candidate_count': len(viable),
            'baseline_metrics': baseline['metrics'], 'selection_role': 'inner_validation_only'}
