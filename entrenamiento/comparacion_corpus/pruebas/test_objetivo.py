"""Protecciones del selector: ejemplos sintéticos, sin fotos ni identidades."""
from pathlib import Path
import copy
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'anidada/herramientas'))
import objetivo_anidado as objective


class ObjectiveTests(unittest.TestCase):
    def test_inferencia_no_depende_de_la_etiqueta_verdadera(self):
        policy = {'classes': {'T': {'threshold': .74, 'margin': .03}}}
        query = dict(best_class='T', best_score=.80, second_score=.76,
                     true_class='T', fold_role='outer_final')
        other = dict(query, true_class='I')
        self.assertEqual(objective.accept(query, policy), 'T')
        self.assertEqual(objective.accept(query, policy), objective.accept(other, policy))
        self.assertEqual(objective.accept(dict(query, second_score=.79), policy), objective.REJECT)

    def test_clase_sin_operacion_no_se_acepta(self):
        policy = {'classes': {'T': {'threshold': None, 'margin': None}}}
        row = dict(best_class='T', best_score=.99, second_score=.10)
        self.assertEqual(objective.accept(row, policy), objective.REJECT)
        self.assertEqual(objective.accept(dict(row, best_class='otro'), policy), objective.REJECT)

    def test_outer_no_entra_en_ajuste(self):
        with self.assertRaisesRegex(ValueError, 'inner_validation'):
            objective._checked([dict(fold_role='outer_final')])

    def test_escom_protege_tanto_legacy_como_nativas(self):
        baseline = {'legacy': {'raw': {'correct': 28}, 'accepted_correct': 17, 'wrong_accepted': 3},
                    'native': {'accepted_correct': 20, 'wrong_accepted': 4}}
        self.assertTrue(objective._admissible(baseline, baseline, 'escom'))
        for cohort in ('legacy', 'native'):
            less_correct = copy.deepcopy(baseline)
            less_correct[cohort]['accepted_correct'] -= 1
            self.assertFalse(objective._admissible(less_correct, baseline, 'escom'))
            more_wrong = copy.deepcopy(baseline)
            more_wrong[cohort]['wrong_accepted'] += 1
            self.assertFalse(objective._admissible(more_wrong, baseline, 'escom'))

    def test_clase_cinco_sin_aciertos_sigue_en_macro_f1(self):
        result = objective._classification(['edificio_4', 'edificio_5'],
                                            ['edificio_4', 'edificio_4'],
                                            ['edificio_4', 'edificio_5'])
        self.assertEqual(result['per_class']['edificio_5']['support'], 1)
        self.assertEqual(result['per_class']['edificio_5']['f1'], 0)
        self.assertAlmostEqual(result['macro_f1'], 1 / 3)


if __name__ == '__main__':
    unittest.main()
