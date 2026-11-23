"""Casos de rampas bajas, volumen interior, cubierta y bastidores laterales."""
import itertools
import math
import unittest

import numpy as np

from auditar_invernadero_glb import analyze, collect_meshes


def box(low, high, name='fixture'):
    return dict(node=0, name=name, building='Edificio_P2',
                low=np.array(low, dtype=float), high=np.array(high, dtype=float))


class GreenhouseExportTests(unittest.TestCase):
    def test_low_ramp_is_not_excluded_by_half_metre_threshold(self):
        result = analyze([box([-1, .05, -2], [1, 2, 2])],
                         [box([.7, .1, -1], [1.3, .35, 1], 'Rampa_baja')])
        self.assertFalse(result['passed'])
        self.assertEqual(result['collisions'][0]['name'], 'Rampa_baja')

    def test_roof_above_greenhouse_and_boundary_contact_are_separate(self):
        own = [box([-1, .05, -2], [1, 2, 2])]
        result = analyze(own, [box([-2, 2.1, -3], [2, 2.3, 3]),
                               box([1, .1, -1], [2, 1, 1])])
        self.assertTrue(result['passed'])

    def test_interior_obstacle_and_frame_outside_body_are_checked(self):
        own = [box([-1, .05, -2], [1, 2, 2]), box([-1.3, .05, -2], [-1.2, 2, 2])]
        result = analyze(own, [box([-.1, .4, -.1], [.1, 1, .1], 'Columna_interior'),
                               box([-1.4, .4, -.1], [-1.25, 1, .1], 'Cuerpo_junto_bastidor')])
        self.assertEqual(result['collision_count'], 2)

    def test_all_three_frames_and_inherited_transforms_are_read(self):
        vertices = np.array(list(itertools.product([-.5, .5], repeat=3)), dtype='<f4')
        node_names = ['P2_invernadero_lateral'] + ['P2_marco_invernadero'] * 3 + ['P2_bastidor_longitudinal_corpus']
        nodes = [dict(name='Edificio_P2', children=list(range(1, 7)), translation=[10, 0, 3],
                      rotation=[0, math.sin(math.pi / 4), 0, math.cos(math.pi / 4)], scale=[2, 1, 3])]
        nodes.extend(dict(name=name, mesh=0, extras={'arquitecturaCorpus': '2026-11-17'}) for name in node_names)
        nodes.append(dict(name='Rampa_baja', mesh=0))
        document = dict(nodes=nodes, scenes=[{'nodes': [0]}], scene=0,
                        meshes=[{'primitives': [{'attributes': {'POSITION': 0}}]}],
                        accessors=[dict(bufferView=0, componentType=5126, count=8, type='VEC3')],
                        bufferViews=[dict(byteOffset=0)])
        own, others, roots = collect_meshes(document, vertices.tobytes())
        self.assertEqual(roots['P2_marco_invernadero'], 3)
        self.assertEqual(len(own), 5)
        self.assertEqual(len(others), 1)
        np.testing.assert_allclose(own[0]['low'], [8.5, -.5, 2], atol=1e-9)
        np.testing.assert_allclose(own[0]['high'], [11.5, .5, 4], atol=1e-9)
        del nodes[0]['children'][3]
        with self.assertRaisesRegex(ValueError, 'tres bastidores'):
            collect_meshes(document, vertices.tobytes())


if __name__ == '__main__':
    unittest.main()
