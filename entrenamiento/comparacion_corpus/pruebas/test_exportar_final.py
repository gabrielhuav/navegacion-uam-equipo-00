"""Paridad numérica entre motor congelado y contrato JSON de exportación."""
from pathlib import Path
from unittest import mock
import sys
import unittest

import numpy as np

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'herramientas'))
import ajustar_exportar_final as export
import optimizar_anidado as engine
from test_optimizar_anidado import fixture


def padded_fixture():
    data=fixture()
    for key,array in data.arrays.items():
        padded=np.zeros(array.shape[:-1]+(960,),np.float32)
        padded[...,:4]=array
        data.arrays[key]=padded
    data.metadata['model_sha256']='synthetic_model_only'
    return data


class JsonExportParity(unittest.TestCase):
    def test_original_prototypes_preserved_and_disabled_classes_compete(self):
        data=padded_fixture()
        recipe=engine.Recipe('custom','actual','proto3')
        policy={'classes':{'A':{'threshold':None,'margin':None},'B':{'threshold':.1,'margin':0}}}
        with mock.patch.object(export,'confirmed_destinations',return_value=({'B':'B'},{'synthetic':True})):
            artifact,receipt,train,fitted=export.make_artifact(data,recipe,policy,'uam_azcapotzalco','combinado',Path('.'))
        actual_a=np.asarray(artifact['prototipos']['A'],np.float32)
        original=np.concatenate([v for r,v in zip(train.records,train.refs) if r['clase']=='A'])
        np.testing.assert_array_equal(actual_a,original)
        observed=export.score_json(artifact,data.arrays['q3'][0])
        self.assertEqual('A',observed['best_class'])
        self.assertIsNone(observed['accepted_class'])
        self.assertIn('A',artifact['clases'])
        self.assertEqual(2,artifact['configuracion']['umbrales']['A'])
        parity,_=export.parity_check(data,artifact,recipe,train,fitted,'uam_azcapotzalco')
        self.assertTrue(parity['passed'])

    def test_photo_whitening_and_natural_query_ensemble_parity(self):
        data=padded_fixture()
        policy={'classes':{c:{'threshold':.1,'margin':0} for c in ['A','B']}}
        for transform,query_mode in [('identidad','mean3'),('centrado','central'),('blanqueo_diagonal','central')]:
            recipe=engine.Recipe('custom','anclado','photo2',transform=transform,query_mode=query_mode)
            with mock.patch.object(export,'confirmed_destinations',return_value=({'A':'A'},{'synthetic':True})):
                artifact,receipt,train,fitted=export.make_artifact(data,recipe,policy,'uam_azcapotzalco','combinado',Path('.'))
            parity,fixtures=export.parity_check(data,artifact,recipe,train,fitted,'uam_azcapotzalco')
            self.assertTrue(parity['passed'])
            self.assertLessEqual(parity['maximum_absolute_class_score_error'],1e-5)
            self.assertEqual(1,len(fixtures))
            for cls,ids in artifact['identificadores_foto'].items():
                self.assertEqual(0,len(ids)%3)
                self.assertTrue(all(ids[i]==ids[i+1]==ids[i+2] for i in range(0,len(ids),3)))
            self.assertIn('B',receipt['classes_without_destination'])


if __name__=='__main__':
    unittest.main()
