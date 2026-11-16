"""Small reporting counterexamples; these do not evaluate the corpus."""
from pathlib import Path
import sys
import unittest

sys.path.insert(0, str(Path(__file__).resolve().parents[1] / 'herramientas'))
import resumir_publico as report


class PublicSummaryTests(unittest.TestCase):
    def test_rejection_and_wrong_acceptance_are_not_hidden(self):
        cfg = dict(native_classes=['T', 'I', 'otro'], legacy_classes=['T', 'I', 'otro'],
                   legacy_aliases={}, legacy_unknown_to='otro', protected_target='T')
        rows = [dict(true_class='T', best_class='T', accepted_class='T'),
                dict(true_class='T', best_class='I', accepted_class=None),
                dict(true_class='I', best_class='T', accepted_class='T'),
                dict(true_class='otro', best_class='otro', accepted_class=None)]
        value = report.summarize_cohort(rows, cfg, destination_classes={'T'})
        self.assertEqual((1, 1, 2), (value['accepted_correct'], value['wrong_accepted'], value['rejected_count']))
        self.assertAlmostEqual(.5, value['raw']['macro_f1'])
        self.assertAlmostEqual(1 / 6, value['accepted']['macro_f1'])
        self.assertEqual(1, value['negative_rejected'])
        self.assertEqual({'tp': 1, 'fp': 1, 'fn': 1, 'tn': 1, 'precision': .5, 'recall': .5, 'f1': .5},
                         value['target_T_accepted'])

    def test_unmapped_accepted_class_does_not_claim_navigation_precision(self):
        cfg = dict(native_classes=['edificio_5', 'web_unmapped'], legacy_classes=['edificio_4'],
                   legacy_aliases={}, legacy_unknown_to=None, protected_target=None)
        rows = [dict(true_class='edificio_5', best_class='edificio_5', accepted_class='edificio_5'),
                dict(true_class='web_unmapped', best_class='web_unmapped', accepted_class='web_unmapped')]
        value = report.summarize_cohort(rows, cfg, destination_classes={'edificio_5'})
        self.assertEqual(2, value['accepted_correct'])
        gate = value['mapped_destination_gate']
        self.assertEqual((1, 1, 0, 1), (gate['navigable_accepted_count'], gate['navigable_correct_label'],
                                       gate['navigable_wrong_label'], gate['accepted_without_mapped_destination']))
        self.assertFalse(gate['route_execution_or_navigation_accuracy_measured'])

    def test_unsupported_true_class_stays_in_macro_denominator(self):
        value = report.classification(['edificio_4'], ['edificio_4'], ['edificio_4', 'edificio_5'])
        self.assertAlmostEqual(.5, value['macro_f1'])
        self.assertEqual(0, value['per_class']['edificio_5']['f1'])

    def test_private_fields_and_locators_cannot_be_published(self):
        for value in ({'query_id': 'hidden'}, {'x': r'C:\private\image.jpg'},
                      {'x': 'foto_123abcdef'}, {'query_vectors': [[.1, .2]]},
                      {'x': 'a' * 64}, {'x': 'owner@example.com'}):
            with self.subTest(value=value), self.assertRaises(ValueError):
                report.check_public_privacy(value, allowed_classes=[], allowed_recipes=[])


if __name__ == '__main__':
    unittest.main()
