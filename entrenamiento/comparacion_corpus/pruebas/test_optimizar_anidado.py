"""Pruebas sintéticas: ningún outer del corpus real se ejecuta aquí."""
from pathlib import Path
import copy
import json
import sys
import tempfile
import unittest

import numpy as np

sys.path.insert(0, str(Path(__file__).resolve().parents[1]/'herramientas'))
import optimizar_anidado as driver
import scorers_offline as scorers


def fixture():
    rng = np.random.default_rng(20261116)
    queries, anchor, actual, vectors = [], [], [], []
    for g in range(4):
        for cls, axis in [('A', 0), ('B', 1)]:
            row = dict(id=f'q{g}{cls}', foto_id=f'p{g}{cls}',
                       campus='uam_azcapotzalco', clase=cls, grupo=f'g{g}',
                       interior=(g == 3), interior_known=True, baseline_flag=g < 2,
                       human_confirmed=True, class_author='owner', native_teacher_class=cls)
            v = np.eye(4, dtype=np.float32)[axis] + .1*rng.normal(size=(3, 4))
            v = driver.unit(v).astype(np.float32)
            anchor.append(dict(row))
            if row['baseline_flag']:
                actual.append(dict(row, grupo='historico'+str(g), grupo_union=f'g{g}'))
            queries.append(dict(row))
            vectors.append(v)
    vectors = np.stack(vectors)
    # Una adición comparte grupo/clase con una baseline: cap nunca la retira.
    add = dict(anchor[0], id='addition', foto_id='addition_photo', baseline_flag=False, interior=False,
               human_confirmed=False,class_author='Codex')
    anchor.append(add)
    metadata = dict(queries=dict(records=queries, central_array='qc', threeviews_array='q3'),
                    banks={
                        'actual_azc': dict(records=actual, refs_array='ar'),
                        'anclado_azc': dict(records=anchor, refs_array='rr'),
                        'actual_escom': dict(records=[], refs_array='empty'),
                        'anclado_escom': dict(records=[], refs_array='empty')})
    arrays = dict(qc=vectors[:, 0].copy(), q3=vectors.copy(), ar=vectors[:4].copy(),
                  rr=np.concatenate([vectors, vectors[:1]], axis=0),
                  empty=np.empty((0, 3, 4), np.float32))
    legacy = {(q['campus'], q['foto_id']): q for q in queries}
    return driver.BankData(metadata, arrays, queries, legacy, dict(synthetic='only'))


class NestedEngineTests(unittest.TestCase):
    def test_closed_grid_29(self):
        recipes = driver.enumerate_recipes()
        self.assertEqual(29, len(recipes))
        self.assertEqual(1, sum(r['bank']=='actual' for r in recipes))
        self.assertEqual(8, sum(r['transform']!='identidad' for r in recipes))
        self.assertEqual(4, sum(r['query_mode']=='mean3' for r in recipes))

    def test_union_exclusion_and_baseline_protection(self):
        data = fixture()
        baseline = driver.enumerate_recipes()[0]
        train = driver.prepare_training(data, 'uam_azcapotzalco', ['g0','g3'], baseline)
        self.assertEqual({'g1'}, set(train.train_groups))
        recipe = driver.Recipe('custom','anclado','photo2', addition_scope='ext', max_adiciones_por_fuente_clase=1)
        train = driver.prepare_training(data, 'uam_azcapotzalco', ['g2'], recipe)
        self.assertTrue({r['id'] for r in data.metadata['banks']['actual_azc']['records']} <= set(train.selected_ids))
        self.assertIn('addition', train.selected_ids)
        self.assertNotIn('q3A', train.selected_ids)

    def test_photo_scores_match_pure_scorer_and_train_only_transform(self):
        data = fixture()
        recipe = driver.Recipe('custom','anclado','photo2',transform='blanqueo_diagonal')
        blocked = ['g0','g1']
        train = driver.prepare_training(data, 'uam_azcapotzalco', blocked, recipe)
        fitted = driver.fit_transform(train, recipe.transform, blocked)
        features = {r['id']: dict(refs=v) for r,v in zip(train.records,train.refs)}
        pure_rows = [dict(r, sha256=r['foto_id']) for r in train.records]
        expected_fit = scorers.ajustar_transformacion_train(pure_rows, features,
                                                           modo=recipe.transform, blocked_groups=blocked)
        np.testing.assert_allclose(expected_fit['mean'], fitted['mean'], atol=1e-7)
        np.testing.assert_allclose(expected_fit['scale'], fitted['scale'], atol=1e-7)
        scores = driver.ScoreCache(data).score('uam_azcapotzalco', blocked, recipe, [0],
                                                fold_role='inner_validation')[0]
        expected = scorers.puntuar_por_foto(data.arrays['qc'][0], pure_rows, features, k=2,
                                            transform=expected_fit)
        for cls, value in expected.items():
            self.assertAlmostEqual(value, scores['class_scores'][cls], places=6)
        data.arrays['q3'][:] = -data.arrays['q3']
        data.arrays['qc'][:] = -data.arrays['qc']
        fitted2 = driver.fit_transform(driver.prepare_training(data, 'uam_azcapotzalco', blocked, recipe),
                                       recipe.transform, blocked)
        np.testing.assert_array_equal(fitted['mean'], fitted2['mean'])
        np.testing.assert_array_equal(fitted['scale'], fitted2['scale'])

    def test_outer_query_mutation_does_not_change_inner_scores(self):
        first, second = fixture(), fixture()
        recipes = [r for r in driver.enumerate_recipes() if r['pooling']=='photo2']
        protocol = dict(recipes=recipes)
        before = driver.build_inner_candidates(first, protocol, 'azc', 'g0')
        second.arrays['qc'][:2] *= -1
        second.arrays['q3'][:2] *= -1
        for q in second.queries[:2]:
            q['clase'] = 'MUTATED_OUTER_LABEL'
        after = driver.build_inner_candidates(second, protocol, 'azc', 'g0')
        self.assertEqual(before, after)
        for candidate in after:
            for row in candidate['records']:
                self.assertNotEqual('g0', row['grupo'])
                self.assertTrue({'g0',row['grupo']}.isdisjoint(row['train_groups']))

    def test_cache_reuse_and_calibration_rejects_outer(self):
        data = fixture()
        with tempfile.TemporaryDirectory() as out:
            cache = driver.ScoreCache(data, out)
            recipe = driver.enumerate_recipes()[0]
            a = cache.score('uam_azcapotzalco',['g0','g1'],recipe,[0],fold_role='inner_validation')
            b = cache.score('uam_azcapotzalco',['g1','g0'],recipe,[2],fold_role='inner_validation')
            self.assertEqual(2, cache.misses)
            self.assertEqual(0, cache.hits)
            reread = driver.ScoreCache(data, out).score('uam_azcapotzalco',['g0','g1'],recipe,[0],
                                                       fold_role='inner_validation')
            self.assertEqual(a, reread)
            self.assertEqual('inner_validation_only', driver.calibration_grid(a+b)['derived_from'])
            a[0]['fold_role'] = 'outer_final'
            with self.assertRaises(ValueError):
                driver.calibration_grid(a)

    def test_synthetic_nested_end_to_end_scores_outer_after_selection(self):
        data = fixture()
        observed = []
        def selector(candidates, protocol, campus):
            outer_groups = {r['outer_excluded_group'] for c in candidates for r in c['records']}
            self.assertEqual(1,len(outer_groups))
            outer = next(iter(outer_groups))
            self.assertTrue(all(r['grupo']!=outer and r['fold_role']=='inner_validation'
                                for c in candidates for r in c['records']))
            observed.append(outer)
            return dict(recipe=candidates[0]['recipe'],policy={'synthetic':'fixed'},
                        reason='synthetic_dryrun_only')
        def apply(rows, policy, protocol, campus):
            self.assertTrue(observed)
            self.assertTrue(all(r['grupo']==observed[-1] for r in rows))
            return [dict(r,accepted_class=r['best_class']) for r in rows]
        with tempfile.TemporaryDirectory() as out:
            p = Path(out)/'source_protocol.json'
            p.write_text(json.dumps(dict(synthetic_only=True)),encoding='utf-8')
            protocol = driver.freeze_protocol(out,data,protocol_path=p,
                                               objective_source_path=__file__,verifier_source_path=__file__)
            result = driver.run_nested(data,protocol,selector,apply,out,objective_source_path=__file__)
            self.assertTrue(result['full_outer_run'])
            self.assertEqual(4,len(result['folds']))
            self.assertEqual(8,len(result['predictions']))
            self.assertEqual(8,len(result['comparator_predictions']['maestro_solo']))
            self.assertEqual(set(data.groups),set(observed))


if __name__ == '__main__':
    unittest.main()

