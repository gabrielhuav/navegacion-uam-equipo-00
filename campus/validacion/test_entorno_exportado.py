"""Regresiones analíticas del lector GLB y del corredor físico continuo."""
import json
import math
from pathlib import Path
import struct
import tempfile
import unittest

import numpy as np

from auditar_entorno_corpus import ENVIRONMENT, run, segment_triangle_distance


class EnvironmentExportTests(unittest.TestCase):
    def fixture(self, directory, triangles, extras=None, transform=None, indexed=True):
        positions = np.asarray(triangles, dtype='<f4').reshape(-1, 3)
        binary = positions.tobytes()
        views = [dict(buffer=0, byteOffset=0, byteLength=len(binary))]
        accessors = [dict(bufferView=0, componentType=5126, count=len(positions), type='VEC3')]
        primitive = dict(attributes={'POSITION': 0})
        if indexed:
            indices = np.arange(len(positions), dtype='<u4').tobytes()
            views.append(dict(buffer=0, byteOffset=len(binary), byteLength=len(indices)))
            binary += indices
            accessors.append(dict(bufferView=1, componentType=5125, count=len(positions), type='SCALAR'))
            primitive['indices'] = 1
        role = dict(corpusEnvironment=ENVIRONMENT, pedestrianObstacle=True)
        role.update(extras or {})
        nodes = [dict(children=[1], **(transform or {})), dict(mesh=0, name='fixture', extras=role)]
        document = dict(asset={'version': '2.0'}, buffers=[dict(byteLength=len(binary))],
                        bufferViews=views, accessors=accessors, meshes=[dict(primitives=[primitive])],
                        scenes=[dict(nodes=[0])], scene=0, nodes=nodes)
        encoded = json.dumps(document).encode()
        encoded += b' ' * (-len(encoded) % 4)
        binary += b'\0' * (-len(binary) % 4)
        glb = (b'glTF' + struct.pack('<II', 2, 28 + len(encoded) + len(binary)) +
               struct.pack('<II', len(encoded), 0x4E4F534A) + encoded +
               struct.pack('<II', len(binary), 0x004E4942) + binary)
        (directory / 'UAM_Azcapotzalco.glb').write_bytes(glb)
        routes = dict(nodos=[dict(id='a', x=0, z=0), dict(id='b', x=2, z=0)],
                      aristas=[dict(de='a', a='b')])
        (directory / 'rutas.json').write_text(json.dumps(routes), encoding='utf-8')

    def test_triangle_does_not_fill_its_overlapping_bounding_box(self):
        # La caja incluye parte del corredor; el triángulo real queda fuera.
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            self.fixture(directory, [[[1.8, 0, 2], [4, 0, .7], [4, 0, 2]]])
            self.assertTrue(run(directory)['passed'])

    def test_preserved_footprint_is_not_an_exemption(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            self.fixture(directory, [[[.4, 0, -.2], [1, 0, -.2], [.4, 0, .2]]],
                         extras={'existingFootprintPreserved': True})
            result = run(directory)
            self.assertFalse(result['passed'])
            self.assertEqual(result['preserved_footprint_collision_count'], 1)
            self.assertEqual(result['new_footprint_collision_count'], 0)

    def test_ground_surface_inside_route_is_excluded(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            self.fixture(directory, [[[.4, 0, -.2], [1, 0, -.2], [.4, 0, .2]]],
                         extras={'pedestrianObstacle': False})
            # Un exportado que sólo contiene suelo no puede pasar como auditado.
            with self.assertRaisesRegex(ValueError, 'no contiene obstáculos'):
                run(directory)

    def test_hierarchy_translation_rotation_and_scale_are_applied(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            triangle = [[[0, 0, 0], [.2, 0, 0], [0, 0, .2]]]
            transform = dict(translation=[1, 0, 2], rotation=[0, math.sin(.2), 0, math.cos(.2)],
                             scale=[1.4, 1, .8])
            self.fixture(directory, triangle, transform=transform)
            self.assertTrue(run(directory)['passed'])
            transform['translation'] = [1, 0, 0]
            self.fixture(directory, triangle, transform=transform, indexed=False)
            self.assertFalse(run(directory)['passed'])

    def test_round_end_cap_catches_triangle_outside_rectangle(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            self.fixture(directory, [[[2.4, 0, .1], [2.5, 0, .1], [2.4, 0, .2]]])
            result = run(directory)
            self.assertFalse(result['passed'])
            self.assertEqual(result['collisions'][0]['maximum_single_projected_triangle_rectangle_overlap'], 0)
            self.assertLess(result['collisions'][0]['minimum_distance_to_route_axis'], .9)

    def test_segment_crosses_triangle_without_contained_endpoints(self):
        triangle = np.array([[.8, -.5], [1.2, -.5], [1, .5]])
        self.assertEqual(segment_triangle_distance(np.array([0., 0]), np.array([2., 0]), triangle), 0)

    def test_matrix_transform_and_missing_roles(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            matrix = np.eye(4)
            matrix[2, 3] = 3
            self.fixture(directory, [[[0, 0, 0], [.2, 0, 0], [0, 0, .2]]],
                         transform={'matrix': matrix.T.ravel().tolist()})
            self.assertTrue(run(directory)['passed'])
            self.fixture(directory, [[[0, 0, 0], [.2, 0, 0], [0, 0, .2]]],
                         extras={'pedestrianObstacle': None})
            with self.assertRaisesRegex(ValueError, 'clasificación física explícita'):
                run(directory)

    def test_invalid_route_and_geometry_cannot_silently_pass(self):
        with tempfile.TemporaryDirectory() as temporary:
            directory = Path(temporary)
            triangle = [[[0, 0, 0], [.2, 0, 0], [0, 0, .2]]]
            self.fixture(directory, triangle, transform={'translation': [math.nan, 0, 0]})
            with self.assertRaisesRegex(ValueError, 'coordenadas no finitas'):
                run(directory)
            self.fixture(directory, triangle)
            (directory / 'rutas.json').write_text('{"nodos": [], "aristas": []}', encoding='utf-8')
            with self.assertRaisesRegex(ValueError, 'aristas y coordenadas finitas'):
                run(directory)


if __name__ == '__main__':
    unittest.main()
