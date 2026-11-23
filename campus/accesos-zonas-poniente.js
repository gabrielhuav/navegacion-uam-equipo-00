// Acabados verificados de los accesos del poniente. Las posiciones son esquemáticas.
function grupoDeDetalle(THREE, padre, nombre, referencia) {
  const grupo = new THREE.Group();
  grupo.name = nombre;
  grupo.userData = {approximate:true, reference:referencia};
  padre.add(grupo);
  return grupo;
}

function ventanillasPuerta2({THREE, world, box, material}) {
  const acceso = world.getObjectByName('Detalles_Puerta_2');
  const marcos = acceso?.children.filter(pieza => pieza.name === 'Ventanilla_baja_torre_Puerta_2') || [];
  for (const marco of marcos) {
    const {x, y, z} = marco.position;
    const soporte = grupoDeDetalle(THREE, acceso, 'Ventanilla_remetida_Puerta_2', 'Street View de la Puerta 2, enero 2025');
    soporte.position.set(x-.034, y, z);
    soporte.rotation.y = marco.rotation.y;
    marco.material = material('#858780');
    box(soporte,'Vidrio_oscuro_de_torre',-.006,0,0,.018,.370,.165,'#32403e');
    for (const lateral of [-.101,.101]) {
      box(soporte,'Jamba_aluminio_de_ventanilla',-.020,0,lateral,.024,.440,.031,'#b8bab0');
    }
    box(soporte,'Divisor_ventanilla_de_torre',-.024,.028,0,.028,.027,.195,'#aeb1a9');
    box(soporte,'Repisa_inferior_ventanilla_de_torre',-.045,-.235,0,.115,.052,.278,'#bbbdb1');
  }
}

function ondularTapialCICTE({THREE, buildingGroups, box}) {
  const edificio = buildingGroups.get('A');
  if (!edificio) return;
  const paño = edificio.children.find(m => m.name === 'Cerca de obra');
  if (!paño) return;
  const detalle = grupoDeDetalle(THREE, edificio, 'Tapial_A_lamina_acanalada',
    'Corpus AZC 0050/0051, fase de obra. Tapial provisional representado en el volumen existente');
  const {x,y,z} = paño.position;
  const {x:ancho,y:alto,z:espesor} = paño.scale;
  const cara = z-espesor/2;
  for (let nivel=0; nivel<15; nivel++) {
    const perfil = y-alto/2+(nivel+.5)*alto/15;
    box(detalle,'A_canal_horizontal_de_lamina',x,perfil,cara-.009,
      ancho-.04,.025,.027,nivel%2===0?'#a3a9a3':'#adb2ab');
  }
  for (let xPoste=x-ancho/2+.33; xPoste<x+ancho/2; xPoste+=2.66) {
    box(detalle,'A_union_de_panales_del_tapial',xPoste,y,cara-.025,.027,alto,.029,'#90978f');
  }
  box(detalle,'A_perfil_superior_tapial',x,y+alto/2+.018,cara,.97*ancho,.058,.072,'#b0b4ae');
}

function galeriaEdificioB({THREE, data, buildingGroups, box}) {
  const volumen = buildingGroups.get('B')?.getObjectByName('B_volumen_0');
  const cuerpo = volumen?.getObjectByName('Cuerpo de concreto');
  if (!cuerpo) return;
  const alto = cuerpo.scale.y;
  const ancho = cuerpo.scale.x;
  const fondo = cuerpo.scale.z;
  const piso = data.storeyHeight;
  if (alto<2*piso || ancho<18) return;
  const galeria = grupoDeDetalle(THREE, volumen, 'B_tramo_cubierto_del_piso_1',
    'Edificio B en Maps, foto 4. Vista del corredor con antepecho y puertas rojas. Tramo y posición esquemáticos');
  const inicio = ancho*.22;
  const tramo = ancho/2-inicio;
  const frente = -fondo/2;
  const retiro = Math.min(2.15, fondo*.24);
  const pared = frente+retiro;
  const centro = inicio+tramo/2;
  const tono = '#d3d0bd';
  // Se conserva el volumen de planta baja y de los niveles superiores.
  cuerpo.removeFromParent();
  box(volumen,'B_cuerpo_PB',0,piso/2,0,ancho,piso,fondo,tono);
  if (alto>2*piso) box(volumen,'B_cuerpo_superior',0,(alto+2*piso)/2,0,ancho,alto-2*piso,fondo,tono);
  box(volumen,'B_cuerpo_P1',-tramo/2,1.5*piso,0,ancho-tramo,piso,fondo,tono);
  box(volumen,'B_cuerpo_rehundido_P1',centro,1.5*piso,retiro/2,tramo,piso,fondo-retiro,tono);
  // Se retiran solo los trozos de ventanas falsas superpuestos a la galería.
  for (const malla of [...volumen.children]) {
    if (malla.position.z >= frente+.13 || Math.abs(malla.position.y-(piso+2))>.45) continue;
    if (['Ventana_nivel_1','Sombra_galeria_nivel_1'].includes(malla.name)) {
      const extremo = malla.position.x-malla.scale.x/2;
      malla.position.x = (extremo+inicio)/2;
      malla.scale.x = inicio-extremo;
    } else if (malla.name==='Montante' && malla.position.x>inicio) {
      malla.removeFromParent();
    }
  }
  const antepecho = volumen.children.find(malla => malla.name==='Antepecho_balcon_nivel_1' && malla.position.z<0);
  if (antepecho) {
    const borde = antepecho.position.x-antepecho.scale.x/2;
    antepecho.position.x = (borde+inicio)/2;
    antepecho.scale.x = inicio-borde;
  }
  const canto = frente-.17;
  box(galeria,'B_antepecho_corrido_del_pasillo',centro,piso+.52,canto,tramo,1.04,.22,'#b2b2a7');
  box(galeria,'B_remate_antepecho_del_pasillo',centro,piso+1.065,canto,tramo,.052,.26,'#c5c6ba');
  const zPasillo = frente+retiro*.46;
  box(galeria,'B_piso_continuo_de_galeria',centro,piso+.014,zPasillo,tramo,.028,retiro,'#bfbdb0');
  for (const fraccion of [.20,.52,.81]) {
    const x = inicio+tramo*fraccion;
    box(galeria,'B_jamba_roja_del_pasillo',x,piso+1.13,pared-.045,1.08,2.26,.087,'#6e3732');
    box(galeria,'B_puerta_roja_fotografiada',x,piso+1.04,pared-.094,.944,2.09,.029,'#a2322b');
    box(galeria,'B_tirador_del_pasillo',x+.33,piso+.98,pared-.119,.046,.115,.033,'#c5bdb0');
    box(galeria,'B_luz_del_paso_cubierto',x,2*piso-.028,zPasillo,.14,.035,.79,'#fff3cf');
  }
  for (const x of [inicio+.19, inicio+tramo*.5, ancho/2-.18]) {
    box(galeria,'B_montante_del_hueco_de_galeria',x,1.53*piso,frente+.16,.18,.92*piso,.26,'#c4c3b7');
  }
}

function luminariasPasoG({THREE, buildingGroups, box}) {
  const volumen = buildingGroups.get('G')?.getObjectByName('G_volumen_0');
  if (!volumen) return;
  const puntos = volumen.children.filter(malla => malla.name==='G_luminaria_paso_central');
  if (!puntos.length) return;
  const grupo = grupoDeDetalle(THREE, volumen, 'G_conduccion_y_luz_en_paso',
    'Edificio G, Maps, fotos 1 y 4 de agosto de 2022. Fotografías del corredor, instalación visible');
  const z = puntos[0].position.z;
  const techo = puntos[0].position.y-.02;
  const paso = Math.abs(puntos[puntos.length-1].position.x-puntos[0].position.x);
  for (const dz of [-.76,.76]) {
    box(grupo,'G_canalizacion_continua_bajo_puente',0,techo-.013,z+dz,paso+2.2,.087,.13,'#8f9891');
  }
  for (const punto of puntos) {
    const x = punto.position.x;
    punto.removeFromParent();
    box(grupo,'G_carcasa_luminaria_del_paso',x,techo-.064,z,1.53,.12,.61,'#6e776d');
    for (const dz of [-.17,0,.17]) {
      box(grupo,'G_difusor_lineal_del_paso',x,techo-.143,z+dz,1.44,.038,.085,'#f4f1de');
    }
  }
}

export function modelarAccesosPoniente(contexto) {
  ventanillasPuerta2(contexto);
  ondularTapialCICTE(contexto);
  galeriaEdificioB(contexto);
  luminariasPasoG(contexto);
}

function escenaInterior(THREE, grupo) {
  const geometria = new THREE.BoxGeometry(1,1,1);
  const colores = new Map();
  return function caja(nombre,x,y,z,w,h,d,color,parametros) {
    if (!colores.has(color)) colores.set(color,new THREE.MeshStandardMaterial({color,roughness:.82,...parametros}));
    const malla = new THREE.Mesh(geometria,colores.get(color));
    malla.name = nombre;
    malla.position.set(x,y,z);
    malla.scale.set(w,h,d);
    malla.castShadow = h>.18;
    malla.receiveShadow = true;
    grupo.add(malla);
    return malla;
  };
}

export function detallarVistasPoniente(id, THREE, modelo) {
  if (id==='incalli') {
    const grupo = grupoDeDetalle(THREE,modelo.group,'Incalli_pasillos_y_luz_de_escalones',
      'Galería Maps del Auditorio Incalli, foto 16. Escalones iluminados, corte de reconocimiento');
    const caja = escenaInterior(THREE,grupo);
    const luces = modelo.group.children.filter(malla => malla.name==='Luz_embutida_escalon');
    for (const luz of luces) {
      const {x,y,z} = luz.position;
      luz.removeFromParent();
      caja('Canal_rehundido_Incalli',x,y,z,.44,.076,.037,'#3e3731');
      caja('Luz_lineal_ambar_Incalli',x,y,z-.023,.35,.026,.012,'#e2ad70');
      caja('Arista_de_escalon_Incalli',x,y+.086,z+.002,1.28,.033,.051,'#ada397');
    }
  }
  if (id==='redes') {
    const grupo = grupoDeDetalle(THREE,modelo.group,'G302_estructura_tecnica_vista',
      'Laboratorios de Electrónica UAM, corpus web 000359–000361');
    const caja = escenaInterior(THREE,grupo);
    for (const x of [-3.94,1.92]) {
      caja('Bandeja_tecnica_aula_de_redes',x,3.19,-3.71,.31,.095,2.63,'#71736b');
      for (const z of [-4.84,-4.36,-3.88,-3.40,-2.92,-2.47]) {
        caja('Travesaño_bandeja_aula_de_redes',x,3.23,z,.40,.03,.035,'#8b8d81');
      }
      for (const z of [-4.7,-2.62]) {
        caja('Colgante_bandeja_aula_de_redes',x-.13,3.33,z,.030,.22,.028,'#6e7168');
        caja('Colgante_bandeja_aula_de_redes',x+.13,3.33,z,.030,.22,.028,'#6e7168');
      }
    }
    for (const y of [.34,1.28,2.26]) {
      caja('Cerramiento_perforado_gabinete_redes',4.26,y,-4.09,.61,.028,.025,'#757a72');
    }
    caja('Marco_gabinete_redes_alto',4.61,1.23,-4.106,.043,2.38,.043,'#5f6662');
    caja('Marco_gabinete_redes_alto',3.91,1.23,-4.106,.043,2.38,.043,'#5f6662');
  }
  return modelo;
}

export function crearInteriorDocenciaD(THREE) {
  const group = new THREE.Group();
  group.name = 'Interior_D_Nucleo_de_docencia';
  group.userData = {
    approximate:true, visualOnly:true,
    reference:'Posgrados CyAD, instalaciones, fotografías ND_1 a ND_3 del núcleo de docencia del primer piso',
  };
  const caja = escenaInterior(THREE,group);
  const claro = '#eeeee6';
  const perfil = '#b4b6ac';
  const gris = '#c4c1b2';
  const marco = '#3b4442';
  caja('Piso_del_corredor_D',0,-.11,0,4.62,.22,11.3,gris);
  caja('Antepecho_del_corredor_D',-2.22,.57,2.1,.18,1.14,6.99,'#aca99c');
  caja('Remate_de_hormigon_D',-2.22,1.175,2.1,.22,.082,6.99,'#c0bcad');
  caja('Muro_frontal_D',2.28,1.42,-.66,.17,2.84,9.8,claro);
  caja('Trasera_del_umbral_D',0,2.73,-1.3,4.51,.52,.18,'#aba599');
  const vidrio = {transparent:true, opacity:.29};
  caja('Vidrio_fijo_entrada_D',-1.47,1.39,-1.30,1.47,2.78,.042,'#a3bbba',vidrio);
  caja('Vidrio_hoja_entrada_D',1.45,1.35,-1.28,1.49,2.70,.045,'#b3c9c5',vidrio);
  for (const x of [-2.23,-.70,.72,2.23]) {
    caja('Montante_entrada_del_nucleo_D',x,1.39,-1.29,.082,2.78,.096,marco);
  }
  caja('Dintel_acristalado_D',0,2.27,-1.32,4.46,.076,.119,marco);
  caja('Sujecion_de_canceleria_D',0,.039,-1.31,4.50,.078,.107,perfil);
  caja('Tirador_del_umbral_D',.95,1.11,-1.20,.034,.237,.036,marco);
  caja('Banda_gris_de_Posgrados_D',0,2.46,-1.25,4.25,.268,.033,'#c1bcae');
  caja('Vitrina_roja_en_la_llegada_D',-1.97,1.40,-.59,.085,.57,.33,'#943632');
  const panel = '#d2d4cb';
  for (const z of [-4.56,-2.83,1.71,3.44]) {
    caja('Canceleria_de_salas_D',2.173,1.53,z,.096,2.42,1.63,perfil);
    caja('Cristal_de_salas_D',2.113,1.49,z,.034,2.26,1.48,'#94a7a0',vidrio);
    caja('Montante_de_sala_D',2.088,1.45,z+.28,.042,2.37,.055,claro);
    caja('Faja_ventilacion_alta_D',2.079,2.60,z,.052,.122,1.465,panel);
    caja('Tirador_de_sala_D',2.055,1.06,z+.24,.050,.153,.036,marco);
  }
  for (const z of [-4.35,-2.56,.1,2.62,4.69]) {
    caja('Fragmento_plafon_del_nucleo_D',.45,2.857,z,2.80,.14,1.11,panel);
    caja('Difusor_rectangular_Posgrados_D',.45,2.77,z,1.39,.064,.50,'#fff5d8');
  }
  for (const z of [.33,.95,2.71,4.35]) {
    caja('Cartel_de_investigacion_D',2.178,1.69,z,.028,.60,.372,'#c2a68b');
  }
  return {group,target:[.05,1.27,-.35], camera:[-7.3,6.1,9.8],etiquetas:[
    {texto:'Núcleo de Docencia · Edificio D, piso 1',posicion:[0,2.67,-1.236]},
    {texto:'Cancelería y corredor hacia las salas',posicion:[1.5,1.96,2.3]},
  ]};
}

export function crearInteriorMicroelectronicaF(THREE) {
  const group = new THREE.Group();
  group.name = 'Interior_F302_Microelectronica';
  group.userData = {
    approximate:true,visualOnly:true,
    reference:'Laboratorios de Electrónica UAM, corpus web 000385–000387; digitalización simplificada',
  };
  const caja = escenaInterior(THREE,group);
  const pared = '#e3e0d5';
  const metal = '#aeb2ad';
  const vidrio = {transparent:true,opacity:.27};
  caja('Piso_F302',0,-.11,0,9.84,.22,8.52,'#b7b7aa');
  caja('Zoclo_frontal_F302',0,.246,-4.22,9.82,.49,.11,'#ada99e');
  caja('Muro_de_fondo_F302',0,1.58,-4.31,9.82,3.16,.114,pared);
  caja('Antepecho_de_ventanal_F302',-4.91,.511,0,.14,1.022,8.52,pared);
  caja('Paño_superior_de_ventanal_F302',-4.91,2.84,0,.14,.46,8.52,pared);
  for (const z of [-2.94,-1.47,0,1.47,2.94]) {
    caja('Cristal_ventanal_F302',-4.89,1.817,z,.038,1.54,1.42,'#abc0b1',vidrio);
    caja('Marco_ventanal_F302',-4.81,1.817,z-.72,.119,1.59,.062,metal);
  }
  for (const x of [-3.93,-2.37,-.79,.79,2.37,3.93]) {
    caja('Cancel_transparente_de_laboratorio_F302',x,2.03,-4.05,1.52,1.64,.055,'#b2caca',vidrio);
    caja('Parteluz_cancel_F302',x+.77,2.03,-4.001,.055,1.67,.107,metal);
    caja('Antepecho_de_cancel_F302',x,.669,-4.06,1.56,1.17,.123,'#cac9bd');
  }
  caja('Riel_del_cancel_F302',0,2.86,-4.06,9.41,.09,.14,metal);
  caja('Riel_del_cancel_F302',0,1.235,-4.06,9.41,.075,.14,metal);
  const mesa = '#81463d', estructura = '#272c2d';
  for (const z of [-2.49,.24,2.54]) {
    // Bancos rojizos modulares con pasillo en medio de la sala.
    for (const x of [-2.61,2.16]) {
      caja('Superficie_rojiza_del_banco_F302',x,.79,z,3.06,.093,1.14,mesa);
      caja('Repisa_instrum_F302',x,1.13,z-.435,2.99,.067,.327,metal);
      for (const dx of [-1.31,1.31]) {
        caja('Pata_banco_F302',x+dx,.37,z,.077,.74,.99,estructura);
      }
      for (const dx of [-.80,.77]) {
        const puesto=x+dx;
        caja('Pantalla_de_instrumentacion_F302',puesto,1.20,z-.11,.43,.36,.108,estructura);
        caja('Cristal_de_instrumentacion_F302',puesto,1.21,z-.044,.358,.283,.027,'#788d88');
        caja('Osciloscopio_F302',puesto+.42,1.285,z-.423,.30,.226,.275,'#d4cbb3');
        caja('Caratula_de_osciloscopio_F302',puesto+.42,1.291,z-.274,.246,.154,.026,'#5c6661');
        caja('Teclado_F302',puesto,.851,z+.26,.36,.028,.16,estructura);
        caja('Bastidor_asiento_laboratorio_F302',puesto,.227,z+.898,.035,.453,.30,estructura);
        caja('Asiento_laboratorio_F302',puesto,.47,z+.898,.46,.088,.395,estructura);
        caja('Respaldo_laboratorio_F302',puesto,.715,z+1.079,.46,.398,.095,estructura);
      }
    }
  }
  for (const x of [-2.7,2.35]) {
    caja('Canalizacion_visible_F302',x,2.99,-1.21,.11,.075,5.32,'#7d8178');
    for (const z of [-2.90,.02]) caja('Luminaria_de_laboratorio_F302',x,2.92,z,1.38,.064,.243,'#fff3d9');
  }
  return {group,target:[0,1.15,-.22],camera:[10.6,8.2,12.4],etiquetas:[
    {texto:'Laboratorio de Microelectrónica · F-302, piso 3',posicion:[0,3.11,-3.9]},
    {texto:'Bancos de instrumentación y cómputo',posicion:[-2.45,1.55,.40]},
  ]};
}
