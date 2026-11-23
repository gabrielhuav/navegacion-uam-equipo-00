// Escenas interpretativas para inspección. Cada vista tiene su propio sistema de coordenadas.
// Los detalles proceden de fotografías tomadas dentro del recinto, no de un plano de obra.
function prepararEscena(THREE, nombre) {
 const group = new THREE.Group();
 group.name = nombre;
 const lotes = new Map();

 function caja(color, x, y, z, ancho, alto, fondo) {
  if (!lotes.has(color)) lotes.set(color, []);
  lotes.get(color).push([x, y, z, ancho, alto, fondo]);
 }

 function colocarMallas() {
  const geometria = new THREE.BoxGeometry();
  const matriz = new THREE.Matrix4();
  for (const [color, piezas] of lotes) {
   const material = new THREE.MeshStandardMaterial({color, roughness: .82});
   const malla = new THREE.InstancedMesh(geometria, material, piezas.length);
   for (const [i, [x, y, z, ancho, alto, fondo]] of piezas.entries()) {
    matriz.makeScale(ancho, alto, fondo).setPosition(x, y, z);
    malla.setMatrixAt(i, matriz);
   }
   malla.receiveShadow = true;
   group.add(malla);
  }
 }

 return {group, caja, colocarMallas};
}

function pisoBaldosas(caja, ancho, fondo, color, junta, tamano) {
 caja('#939188', 0, -.20, 0, ancho, .34, fondo);
 caja(color, 0, -.035, 0, ancho, .07, fondo);
 for (let x = -ancho / 2 + tamano; x < ancho / 2; x += tamano) {
  caja(junta, x, .002, 0, .012, .004, fondo);
 }
 for (let z = -fondo / 2 + tamano; z < fondo / 2; z += tamano) {
  caja(junta, 0, .002, z, ancho, .004, .012);
 }
}

function silla(caja, x, z, respaldo, color, patas = '#393030') {
 caja(color, x, .46, z, .45, .08, .43);
 caja(color, x, .72, z + respaldo * .19, .46, .30, .07);
 for (const dx of [-.17, .17]) {
  for (const dz of [-.15, .15]) caja(patas, x + dx, .23, z + dz, .038, .46, .038);
  caja(patas, x + dx, .58, z + respaldo * .17, .032, .25, .033);
 }
}

// Edificio L, fotografías comunitarias de 2024 y 2026. El corte muestra el vacío y las dos galerías visibles.
export function crearInteriorL(THREE) {
 const {group,caja,colocarMallas}=prepararEscena(THREE,'Interior_L_Patio_de_trabajo');
 const gris='#8c908a', techo='#d6cdbf', verde='#287464', ladrillo='#b7714e', crema='#efe8d9';
 const corredor=new THREE.Group();
 corredor.name='L_cancel_esmerilado_y_fluorescentes_360';
 corredor.userData={approximate:true,reference:'https://www.youtube.com/watch?v=rU-4eFuBX2g&t=640s'};
 group.add(corredor);
 const geoCancel=new THREE.BoxGeometry();
 const vidrioAula=new THREE.MeshStandardMaterial({color:'#779793',transparent:true,opacity:.34,roughness:.29,depthWrite:false});
 const esmerilado=new THREE.MeshStandardMaterial({color:'#e0e5de',transparent:true,opacity:.76,roughness:.78,depthWrite:false});
 function panelAula(nombre,material,x,y,z,ancho,alto,fondo){
  const pieza=new THREE.Mesh(geoCancel,material);
  pieza.name=nombre;pieza.position.set(x,y,z);pieza.scale.set(ancho,alto,fondo);
  corredor.add(pieza);
 }
 pisoBaldosas(caja,20,15.8,'#dcd5c9','#aba99f',.82);
 const maderas=['#b38e6f','#bd9878','#b89372','#c39d7c'];
 for(let i=0;i<25;i++){
  const x=-5.76+i*.48;
  for(let j=0;j<5;j++)caja(maderas[(i+2*j+(i%3===0?1:0))%maderas.length],x,.024,-3.32+j*1.64,.477,.032,1.637);
 }
 caja(techo,0,3.0,-7.8,20,6,.18);
 caja(techo,-9.9,3,0,.18,6,15.8);
 caja(gris,0,3.07,-6.61,19.8,.31,2.28);
 caja(gris,-8.5,3.07,1.19,2.72,.31,13.28);
 caja('#857b73',0,5.8,-7.2,19.8,.21,1.17);
 caja('#857b73',-9.4,5.8,0,1.04,.21,15.75);
 for(const y of [1.58,4.65]){
  for(let j=0;j<7;j++){
   const x=-8.6+j*2.65;
   caja(j%3===0?'#8c755b':'#708f8e',x,y,-7.67,2.57,2.56,.08);
   caja('#dbdbd4',x-1.28,y,-7.59,.042,2.63,.06);
   if(j%3!==0)for(let k=0;k<7;k++)caja('#a4b4b1',x,y-.94+k*.17,-7.61,2.50,.026,.03);
  }
  for(let j=0;j<5;j++){
   const z=-6.24+j*2.8;
   const puerta=j===1||j===4;
   if(puerta||y>2) caja(puerta?verde:'#9cb0aa',-9.78,y,z,.08,2.58,2.68);
   else{
    panelAula('L_vidrio_de_aula_frente_a_casilleros',vidrioAula,-9.76,y,z,.035,2.56,2.67);
    for(let franja=0;franja<6;franja++){
     panelAula('L_franja_horizontal_esmerilada',esmerilado,-9.73,.45+franja*.161,z,.009,.108,2.64);
    }
    caja('#c2c5ba',-9.71,1.44,z,.064,.043,2.68);
   }
   caja(crema,-9.71,y,z-1.34,.065,2.62,.046);
  }
 }
 // Bajo la losa se ve una línea longitudinal de luminarias blancas.
 const xLuz=-8.34;
 for(let tramo=0;tramo<6;tramo++){
  const z=-4.37+tramo*2.15;
  caja('#c4c5bc',xLuz,2.887,z,.13,.049,2.15);
  caja('#f5f4e9',xLuz,2.855,z,.102,.019,2.08);
 }
 // La costura de bloques de vidrio distingue el fondo alto de los ventanales bajos.
 for(let x=-3.35;x<3.6;x+=.34){
  for(let y=4.44;y<5.63;y+=.31)caja('#c4d9d1',x,y,-7.53,.305,.276,.046);
 }
 const colores=['#44766f','#974b55','#ba895b','#44668b','#99738b','#5e765f'];
 for(let i=0;i<8;i++){
  const x=-8.38+i*2.39;
  caja(colores[i%colores.length],x,3.78,-5.46,2.38,1.02,.11);
  caja(colores[(i+3)%colores.length],x-.48,3.90,-5.395,1.01,.47,.024);
 }
 for(let i=0;i<6;i++){
  const z=-4.16+i*1.98;
  caja(colores[(i+2)%colores.length],-7.12,3.78,z,.11,1.02,1.96);
 }
 // Dos tramos en línea y un descanso. El parapeto amarillo hace legible su perfil desde el patio.
 const xInicio=7.70,zEsc=-4.18,huella=.38,fondo=1.88,peldaños=10,altura=1.61,descanso=.96;
 function tramo(x,y){
  for(let i=0;i<peldaños;i++){
   const alzado=(i+1)*altura/peldaños;
   caja(i%2===0?'#c7a345':'#d3ad4b',x-(i+.5)*huella,y+alzado/2,zEsc,huella+.003,alzado,fondo);
  }
  const xFin=x-peldaños*huella;
  const perfil=new THREE.Shape();
  perfil.moveTo(x,y-.08);perfil.lineTo(xFin,y+altura-.08);
  perfil.lineTo(xFin,y+altura+.9);perfil.lineTo(x,y+.9);perfil.closePath();
  const malla=new THREE.Mesh(new THREE.ExtrudeGeometry(perfil,{depth:.115,bevelEnabled:false}),new THREE.MeshStandardMaterial({color:'#e2b943',roughness:.73}));
  malla.name='L_Parapeto_amarillo';malla.position.z=zEsc+fondo/2;
  group.add(malla);
  return xFin;
 }
 const xMedio=tramo(xInicio,0);
 caja('#d5ad42',xMedio-descanso/2,altura/2,zEsc,descanso,altura,fondo);
 caja('#e2b943',xMedio-descanso/2,altura+.46,zEsc+fondo/2,descanso,.92,.12);
 const xAlto=tramo(xMedio-descanso,altura);
 caja('#b49755',(xAlto-7.1)/2,3.09,zEsc,xAlto+7.1,.26,fondo);

 function mureteHorizontal(x,z,w){
  caja(ladrillo,x,.60,z,w,1.20,.28);
  caja(crema,x,1.22,z,w,.09,.37);
  for(let y=.19;y<1.14;y+=.16)caja('#995632',x,y,z+.143,w,.012,.011);
  caja('#f1eeea',x,.77,z+.52,w,.075,.62);
  for(let dx=-w/2+.4;dx<w/2;dx+=.82){
   caja('#53534c',x+dx,.35,z+.63,.042,.7,.045);
   caja('#584b43',x+dx,.44,z+1.03,.35,.065,.34);
  }
 }
 mureteHorizontal(-3.17,-3.29,4.8);mureteHorizontal(3.34,-3.29,4.56);
 for(const sign of [-1,1]){
  const x=sign*5.92;
  caja(ladrillo,x,.60,.52,.3,1.20,7.5);
  caja(crema,x,1.22,.52,.39,.09,7.56);
  caja('#f1eeea',x-sign*.51,.77,.5,.65,.075,7.18);
  for(let k=0;k<8;k++){
   const z=-2.70+k*.85;
   caja('#51534a',x-sign*.72,.37,z,.039,.74,.045);
   caja('#584b43',x-sign*1.03,.44,z,.35,.065,.35);
  }
  // Filas verdes de casilleros en la cara exterior, al nivel del andador.
  const xExterior=x+sign*.34;
  caja(verde,xExterior,.75,.52,.55,1.5,7.48);
  for(let k=0;k<13;k++)for(let l=0;l<3;l++){
   const z=-2.91+k*.58,y=.26+l*.493;
   caja((k+l)%4===0?'#3f876e':'#327c67',xExterior+sign*.286,y,z,.034,.47,.545);
   caja('#1f4b42',xExterior+sign*.309,y+.11,z+.186,.027,.066,.029);
  }
 }
 for(const [x,z] of [[-.55,-1.14],[-.14,.32],[.27,1.84]]){
  caja('#a86b43',x,.48,z,2.75,.16,.76);
  for(const dx of [-1.20,1.20])caja('#955637',x+dx,.23,z,.15,.46,.68);
  for(const dz of [-.16,.13])caja('#c58d63',x,.562,z+dz,2.75,.006,.014);
 }
 // Umbral visible en el panorama CyADtv de junio de 2019. Posición didáctica dentro del corte.
 const blanco='#eceae3', zUmbral=7.07, anchoCancel=7.2;
 caja(blanco,0,2.54,zUmbral,anchoCancel,.12,.13);
 caja(blanco,0,4.41,zUmbral,anchoCancel,.13,.13);
 for(const x of [-3.55,-1.46,1.46,3.55]){
  caja(blanco,x,3.47,zUmbral,.085,1.85,.092);
 }
 for(const x of [-2.51,2.51]){
  caja(blanco,x,.075,zUmbral,2.06,.13,.13);
  caja(blanco,x,1.16,zUmbral,2.06,.07,.09);
 }
 const vidrio=new THREE.MeshStandardMaterial({color:'#a6bfba',transparent:true,opacity:.17,depthWrite:false});
 for(const [x,y,w,h] of [[0,3.48,7,1.72],[-2.51,1.32,1.99,2.34],[2.51,1.32,1.99,2.34]]){
  const panel=new THREE.Mesh(new THREE.BoxGeometry(w,h,.034),vidrio);
  panel.name='L_cancel_blanco_del_umbral';
  panel.position.set(x,y,zUmbral);
  group.add(panel);
 }
 const cilindro=new THREE.CylinderGeometry(.27,.27,4.46,16);
 const concreto=new THREE.MeshStandardMaterial({color:'#c6c6bc',roughness:.82});
 for(const x of [-3.62,3.62]){
  const columna=new THREE.Mesh(cilindro,concreto);
  columna.name='L_columna_redonda_del_umbral';
  columna.position.set(x,2.23,zUmbral-.29);
  group.add(columna);
 }
 colocarMallas();
 return {group,target:[0,1.45,-.4],camera:[23,18,25],etiquetas:[
  {texto:'Zona de trabajo',posicion:[.55,.92,1.1]},
  {texto:'Escalera amarilla',posicion:[4.80,2.52,-3.22]},
  {texto:'Galería alta',posicion:[-6.45,4.7,-5.48]},
 ]};
}

function estanteriaBiblioteca(caja, x, z, orden, haciaCentro) {
 const tonos = ['#8e343b', '#6d838a', '#c5a675', '#d3c8b8', '#49666a', '#535375', '#a86745'];
 const armazon = '#727779';
 const pieza = (color, a, y, b, ancho, alto, fondo) =>
  caja(color, x + b * haciaCentro, y, z + a, fondo, alto, ancho);
 for (const lado of [-1, 1]) {
  pieza(armazon, lado * .80, 1.03, 0, .04, 2.06, .47);
 }
 for (const [nivel, y] of [.16, .54, .92, 1.30, 1.68, 2.02].entries()) {
  pieza(armazon, 0, y, 0, 1.61, .04, .48);
  pieza('#babcb8', 0, y - .005, .247, 1.56, .023, .023);
  if (nivel === 5) continue;
  for (let tomo = 0; tomo < 10; tomo++) {
   const alto = .20 + .026 * ((tomo + nivel + orden) % 5);
   const color = tonos[(tomo * 3 + nivel + orden) % tonos.length];
   const ancho = .080 + .014 * ((tomo + orden) % 5);
   pieza(color, -.70 + tomo * .150, y + .02 + alto / 2, .045 + .011 * (tomo % 4), ancho, alto, .285);
  }
 }
}

// Fotografías de la sala de lectura, 13 de enero de 2017 (corpus web 000009–000012).
// El mural y la franja elevada se reconocen por color y posición, sin reproducir las obras.
export function crearInteriorBiblioteca(THREE) {
 const {group, caja, colocarMallas} = prepararEscena(THREE, 'Interior_I_Sala_lectura');
 const blanco = '#eeeae1', pilastra = '#f2eee5', tablero = '#8e5543', asiento = '#254c8d';
 pisoBaldosas(caja, 16, 15, '#d9d1c5', '#b6aea3', .80);
 caja(blanco, 0, 3.55, -7.42, 16, 7.10, .16);
 caja(blanco, -7.92, 1.92, 0, .16, 3.84, 15);
 caja(blanco, -7.92, 6.89, 0, .16, .42, 15);

 // La sala conserva el vacío alto entre las dos franjas bajas de acervo.
 caja('#e1dcd0', -6.03, 3.32, -.55, 3.84, .26, 13.90);
 caja('#d5d0c4', -4.08, 3.80, -.55, .17, .78, 13.90);
 caja('#355b8a', -3.98, 3.81, -.55, .036, .60, 13.90);
 for (const y of [3.53, 4.10]) {
  caja('#b8753d', -3.95, y, -.55, .057, .064, 13.90);
 }
 for (const [i, z] of [-6.49, -4.15, -1.80, .55, 2.90, 5.25].entries()) {
  caja(pilastra, -4.11, 1.63, z, .35, 3.26, .38);
  caja(i % 3 === 1 ? '#456f9a' : '#57a2ad', -3.94, 3.83, z, .023, .34, 2.14);
  for (const x of [-7.03, -5.22]) {
   caja('#e7e3d9', x, 3.178, z, .30, .026, 1.01);
   caja('#fff2cc', x, 3.157, z, .245, .016, .935);
  }
 }
 // Corte del borde opuesto: la parte frontal del plafón se omite para abrir la vista.
 caja('#dfdbd2', 6.51, 3.32, -4.90, 2.98, .26, 4.95);
 for (const z of [-6.6, -3.30]) caja(pilastra, 5.12, 1.62, z, .37, 3.24, .43);
 for (let z = -6.5; z < 7.4; z += 2.06) {
  caja('#e0edec', -7.92, 5.47, z, .042, 2.35, 1.98);
  caja('#f7f2e8', -7.86, 5.47, z + 1.01, .12, 2.44, .07);
  caja('#f7f2e8', -7.86, 5.64, z, .12, .064, 2.06);
 }
 caja('#faf6e8', -7.90, 4.25, 0, .20, .085, 15);
 caja('#f6f3e9', -7.90, 6.69, 0, .20, .085, 15);

 caja('#5c483b', 1.55, 3.36, -7.32, 8.9, 6.70, .065);
 caja('#3969a2', 1.55, 3.42, -7.276, 8.65, 6.35, .035);
 caja('#b88e44', 1.55, 5.74, -7.249, 8.14, 1.17, .024);
 caja('#568cba', 1.55, 3.07, -7.236, 4.75, 4.04, .018);
 caja('#305683', 1.55, 1.04, -7.218, 8.14, .95, .016);
 for (const x of [-3.18, 6.26]) caja(pilastra, x, 3.55, -7.20, .32, 7.10, .34);
 for (const x of [-6.28, 7.35]) {
  caja('#745237', x, 2.64, -7.30, 1.16, 5.28, .095);
  for (const dx of [-.39, -.13, .13, .39]) caja('#634631', x + dx, 2.64, -7.246, .015, 5.24, .016);
 }

 for (const [i, z] of [-5.75, -4.04, -2.33, -.62, 1.09, 2.80, 4.51].entries()) {
  estanteriaBiblioteca(caja, -6.85, z, i, 1);
 }
 for (const [i, z] of [-5.75, -4.04, -2.33, -.62, 1.09].entries()) {
  estanteriaBiblioteca(caja, 6.72, z, i + 7, -1);
 }
 const mesasX = [-3.68, 0, 3.68];
 for (const x of mesasX) {
  for (const z of [-4.18, -1.49, 1.20, 3.89]) {
   caja('#603b30', x, .742, z, 1.92, .11, 1.04);
   caja(tablero, x, .793, z, 1.97, .046, 1.09);
   for (const dx of [-.86, .86]) {
    for (const dz of [-.44, .44]) caja('#523930', x + dx, .37, z + dz, .064, .74, .062);
   }
   for (const dx of [-.52, .52]) {
    silla(caja, x + dx, z - .75, -1, asiento);
    silla(caja, x + dx, z + .75, 1, asiento);
   }
  }
 }

 const perfilLampara = [[.19, 0], [.16, .06], [.12, .17], [.08, .20], [.07, .22]]
  .map(([r, y]) => new THREE.Vector2(r, y));
 const pantalla = new THREE.LatheGeometry(perfilLampara, 20);
 const acabado = new THREE.MeshStandardMaterial({color:'#dedfd8', side:THREE.DoubleSide, roughness:.7});
 const difusor = new THREE.CylinderGeometry(.147, .147, .03, 20);
 const luz = new THREE.MeshStandardMaterial({color:'#fff4cf', emissive:'#ffedbe', emissiveIntensity:.22});
 for (const x of [-2.07, 2.07]) {
  for (const z of [-5.18, -1.91, 1.36]) {
   caja('#b2ada4', x, 6.60, z, .025, .84, .025);
   const campana = new THREE.Mesh(pantalla, acabado);
   campana.name = 'I_Pantalla_colgante';
   campana.position.set(x, 5.97, z);
   group.add(campana);
   const lampara = new THREE.Mesh(difusor, luz);
   lampara.position.y = .008;
   campana.add(lampara);
  }
 }
 colocarMallas();

 return {
  group, camera: [18.4, 13.8, 19.2], target: [0, 2.33, -.8],
  etiquetas: [
   {texto:'Sala de lectura', posicion:[0, 1.08, 2.9]},
   {texto:'Acervo abierto', posicion:[-6.52, 2.23, 1.0]},
   {texto:'Paño mural', posicion:[1.55, 5.0, -7.14]},
  ],
 };
}

// Aula G302-A, piso 3. Referencias: galería oficial de Electrónica y corpus web 000359–000362.
export function crearInteriorG302(THREE) {
 const {group, caja, colocarMallas} = prepararEscena(THREE, 'Interior_G302_A_Aula_de_Redes');
 const pared = '#e4e3d9', metal = '#303639', cubierta = '#292e33', patas = '#dddcd1';
 pisoBaldosas(caja, 11.8, 10.4, '#cbc6b8', '#b4afa1', .98);
 caja(pared, 0, 1.71, -5.12, 11.8, 3.42, .16);
 caja(pared, 5.82, .56, 0, .16, 1.12, 10.4);
 caja(pared, 5.82, 3.13, 0, .16, .58, 10.4);
 caja('#bbb9b0', 0, .095, -5.02, 11.80, .19, .06);
 caja('#bbb9b0', 5.72, .095, 0, .06, .19, 10.4);

 // Piezas de bloques claros en el frente y un vano de ventanas al costado.
 for (let y = .24; y < 3.37; y += .26) {
  caja('#d2d0c4', 0, y, -5.035, 11.78, .012, .015);
  for (let x = -5.7 + (Math.round(y / .26) % 2) * .29; x < 5.8; x += .58) {
   caja('#d2d0c4', x, y + .13, -5.035, .012, .25, .015);
  }
 }
 caja('#9d2827', -4.46, 1.14, -4.98, 1.18, 2.28, .105);
 caja('#d0c6b3', -4.46, 2.28, -4.91, 1.28, .072, .065);
 for (const x of [-5.08, -3.84]) caja('#d0c6b3', x, 1.14, -4.91, .062, 2.28, .065);
 caja('#d8d3bd', -4.82, 1.05, -4.90, .112, .033, .045);
 caja('#393d3e', -.28, 1.96, -4.985, 3.58, 1.58, .075);
 caja('#f0eee5', -.28, 1.96, -4.928, 3.46, 1.46, .042);
 for (const [i, z] of [-4.05, -2.43, -.81, .81, 2.43, 4.05].entries()) {
  caja(i % 2 ? '#bacec5' : '#bdd2d0', 5.84, 1.98, z, .048, 1.7, 1.54);
  caja('#727d76', 5.81, 2.66, z, .045, .28, 1.54);
  caja('#eeeeea', 5.78, 1.98, z - .81, .082, 1.82, .075);
 }
 caja('#f3f0e8', 5.78, 1.10, 0, .14, .08, 9.79);
 caja('#f3f0e8', 5.78, 2.86, 0, .14, .08, 9.79);
 caja('#eeeeea', 5.78, 1.98, 4.86, .082, 1.82, .075);
 for (const x of [-3.15, 2.46]) {
  caja('#b7b6ad', x, 3.30, -2.30, .15, .058, 5.70);
  caja('#fff4d8', x, 3.22, -2.55, .19, .09, 2.25);
 }
 caja(metal, -.27, 3.21, -2.50, .08, .26, .08);
 caja(metal, -.27, 3.04, -2.50, .52, .17, .38);
 caja('#a9b7ba', -.38, 3.045, -2.699, .13, .084, .024);

 // Gabinete de redes, bancos centrales y circulación por los laterales.
 caja(metal, 4.26, 1.23, -4.48, .76, 2.46, .62);
 for (let y = .24; y < 2.30; y += .18) {
  caja('#192226', 4.26, y, -4.14, .65, .106, .047);
  caja('#a7ac90', 4.47, y, -4.107, .055, .025, .015);
 }
 caja(cubierta, -1.80, .80, -3.68, 1.65, .075, .66);
 for (const x of [-2.52, -1.08]) caja(patas, x, .39, -3.68, .085, .78, .61);
 for (const [x, puestosPorLado] of [[-3.40, 2], [-.73, 3], [1.94, 3]]) {
  const largo = puestosPorLado * 1.45 + .45;
  caja(cubierta, x, .77, .82, 1.38, .085, largo);
  for (const z of [.82 - largo / 2 + .16, .82, .82 + largo / 2 - .16]) {
   caja(patas, x, .36, z, 1.26, .72, .07);
  }
  for (let i = 0; i < puestosPorLado; i++) {
   const z = .82 + (i - (puestosPorLado - 1) / 2) * 1.45;
   for (const lado of [-1, 1]) {
    const cx = x + lado * .22;
    caja(metal, cx, 1.14, z, .061, .40, .62);
    caja(i % 3 === 1 ? '#546e75' : '#324451', cx + lado * .035, 1.14, z, .012, .335, .54);
    caja(metal, cx, .91, z, .053, .20, .095);
    caja('#45484c', cx + lado * .27, .82, z, .15, .025, .42);
    caja(metal, cx + lado * .07, .956, z - .47, .27, .284, .168);
    caja('#963f46', x + lado * .91, .47, z, .43, .076, .45);
    caja('#963f46', x + lado * 1.10, .73, z, .060, .31, .46);
    for (const dz of [-.17, .17]) {
     caja(metal, x + lado * .91, .22, z + dz, .34, .036, .034);
     caja(metal, x + lado * 1.05, .34, z + dz, .036, .65, .034);
     caja(metal, x + lado * .76, .22, z + dz, .036, .44, .034);
    }
   }
  }
 }
 colocarMallas();

 return {
  group, camera: [-14.5, 10.2, 16.4], target: [.12, 1.4, -.34],
  etiquetas: [
   {texto:'Puestos de cómputo', posicion:[-.73, 1.43, 1.05]},
   {texto:'Gabinete de redes', posicion:[4.26, 1.87, -4.26]},
   {texto:'Área docente', posicion:[-1.62, 3.20, -4.92]},
  ],
 };
}
