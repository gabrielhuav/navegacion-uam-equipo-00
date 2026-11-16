"""Tres casos sintéticos de lógica; no cargan el corpus ni un test exterior."""
from pathlib import Path
import sys
import unittest
import numpy as np

sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'herramientas'))
from scorers_offline import seleccionar_referencias,puntuar_por_foto,ajustar_transformacion_train,calibrar_rechazo_inner


def row(i,c='A',g=None,sha=None,source=None):
    return dict(id=i,campus='uam_azcapotzalco',clase=c,grupo=g or i,sha256=sha or i,fuente=source or g or i)


def refs_with_cosine(c):
    v=np.asarray([c,np.sqrt(1-c*c)],dtype=np.float32)
    return dict(refs=np.stack([v,v,v]))


class ScorersTests(unittest.TestCase):
    def test_tres_recortes_no_son_tres_fotos(self):
        rows=[row('a1'),row('a2'),row('b1','B'),row('b2','B')]
        f={'a1':refs_with_cosine(.9),'a2':refs_with_cosine(.1),'b1':refs_with_cosine(.7),'b2':refs_with_cosine(.7)}
        q=np.asarray([1,0],dtype=np.float32)
        legacy_a=np.sort(np.concatenate([f['a1']['refs']@q,f['a2']['refs']@q]))[-3:].mean()
        legacy_b=np.sort(np.concatenate([f['b1']['refs']@q,f['b2']['refs']@q]))[-3:].mean()
        self.assertGreater(legacy_a,legacy_b)
        scores=puntuar_por_foto(q,rows,f,k=2,min_fotos=2)
        self.assertAlmostEqual(scores['A'],.5,places=6)
        self.assertAlmostEqual(scores['B'],.7,places=6)
        self.assertGreater(scores['B'],scores['A'])

    def test_baseline_protegido_adicion_curada_y_grupo_apartado(self):
        rows=[row('base'),row('copia',sha='base'),row('mejor',g='s'),row('peor',g='s'),row('outer',g='holdout')]
        selected,diag=seleccionar_referencias(rows,['base'],['copia','mejor','peor','outer'],['holdout'],
                                              max_fotos_por_fuente_clase=1,max_fotos_por_clase=2,quality_by_id={'mejor':2,'peor':1})
        self.assertEqual([r['id'] for r in selected],['base','mejor'])
        self.assertEqual(diag['motivos_por_id']['copia'],'misma_toma')
        self.assertEqual(diag['motivos_por_id']['outer'],'grupo_retenido')
        with self.assertRaises(ValueError):seleccionar_referencias(rows,['outer'],[],['holdout'])

    def test_ajuste_solo_train_y_calibracion_solo_inner(self):
        rows=[row('t1'),row('t2')]
        f={'t1':dict(refs=np.asarray([[1,0]]*3,dtype=np.float32)),
           't2':dict(refs=np.asarray([[0,1]]*3,dtype=np.float32))}
        transform=ajustar_transformacion_train(rows,f,modo='centrado',blocked_groups=['outer'])
        np.testing.assert_array_equal(transform['mean'],np.asarray([.5,.5],dtype=np.float32))
        with self.assertRaises(ValueError):ajustar_transformacion_train([row('outer')],{'outer':f['t1']},modo='centrado',blocked_groups=['outer'])
        records=[]
        for i in range(6):
            records.append(dict(fold_role='inner_validation',grupo=f'g{i}',train_groups=['train_ajeno'],true_class='A' if i<3 else 'B',
                                best_class='A',best_score=.9 if i<3 else .79,second_score=.5 if i<3 else .78))
        calibrated=calibrar_rechazo_inner(records,[.75,.85],[0,.1],min_precision=1,min_accepted=3,min_groups=3)
        a=calibrated['por_clase']['A']
        self.assertEqual((a['tp'],a['fp'],a['threshold'],a['margin']),(3,0,.85,.1))
        self.assertFalse(calibrated['outer_final_evaluado'])
        with self.assertRaises(ValueError):calibrar_rechazo_inner([{**records[0],'fold_role':'outer_final'}],[.8],[0],min_accepted=1,min_groups=1)


if __name__=='__main__':unittest.main(verbosity=2)
