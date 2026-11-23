"""Casos analíticos sin corpus ni archivos del campus."""
import math
import unittest

from auditar_estacionamientos import canonical_footprint, triangle_polygon_area, triangle_rect_area


class GeometryAuditTests(unittest.TestCase):
    def test_top_triangle_area_total_partial_and_disjoint(self):
        triangle=[[0.,0.],[2.,0.],[0.,2.]]
        self.assertAlmostEqual(triangle_rect_area(triangle,[0,0,2,2]),2.)
        self.assertAlmostEqual(triangle_rect_area(triangle,[0,0,1,1]),1.)
        self.assertEqual(triangle_rect_area(triangle,[3,3,4,4]),0.)

    def test_clipped_triangle_does_not_fill_its_bounding_box(self):
        triangle=[[0.,0.],[2.,0.],[0.,2.]]
        self.assertEqual(triangle_rect_area(triangle,[1.1,1.1,2,2]),0.)

    def test_rotated_pavilion_does_not_fill_empty_corners(self):
        polygon=canonical_footprint({'diamond':True,'facadeYaw':math.pi/4},[894,389,896,391],1.)
        self.assertEqual(triangle_polygon_area([[-.9,-.9],[-.6,-.9],[-.9,-.6]],polygon),0.)
        self.assertAlmostEqual(triangle_polygon_area([[0,0],[.5,0],[0,.5]],polygon),.125)

    def test_building_translation_and_polygon_winding_preserve_area(self):
        base=canonical_footprint({},[894,389,896,391],1.)
        moved=canonical_footprint({'offsetX':8,'offsetZ':-4},[894,389,896,391],1.)
        triangle=[[-2,-2],[2,-2],[0,2]]
        shifted=[[x+8,z-4] for x,z in triangle]
        expected=triangle_polygon_area(triangle,base)
        self.assertAlmostEqual(triangle_polygon_area(shifted,moved),expected)
        self.assertAlmostEqual(triangle_polygon_area(shifted,list(reversed(moved))),expected)


if __name__=='__main__':
    unittest.main()
