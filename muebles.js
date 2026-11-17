// Biblioteca de modelos de muebles por estilo, a partir de las fichas de IKEA.
// Convención: unidades en metros, origen en el centro de la base, frente hacia +Z y respaldo hacia -Z.
import * as THREE from 'three';
import { RoundedBoxGeometry } from './redondeado.js';

// ---------- colores a partir del nombre del acabado ----------
const PALETA = [['transparente', '#dfe9ee'], ['cromado', '#c9ccd0'], ['latón', '#b08d4f'], ['mármol', '#5e5e5e'], ['vidrio', '#cfe0e6'], ['turquesa', '#5f7d7e'],
  ['azul oscuro', '#2f3f5c'], ['azul', '#5f7a95'], ['naranja', '#c8703a'], ['ocre', '#a8782f'], ['rosa', '#c49a8f'], ['rojo', '#9a3b2a'], ['beis', '#cfc5b3'], ['hueso', '#e6e0d2'], ['verde oscuro', '#3d4a3a'], ['verde', '#7d8f6e'], ['mostaza', '#b8902f'], ['amarillo', '#c9a43c'], ['rojizo', '#8b4f3c'], ['antracita', '#46474a'], ['gris oscuro', '#4d4e50'],
  ['negro', '#2b2724'], ['nogal', '#6e4f35'], ['acacia', '#9a6b45'], ['marrón oscuro', '#4e3a2b'], ['roble tinte blanco', '#dccfb8'], ['roble', '#c49a66'], ['pino', '#d8bb8e'],
  ['abedul', '#dcc39c'], ['ratán', '#c9a874'], ['junco', '#c9a874'], ['bambú', '#cdb894'], ['fresno', '#d8c3a0'], ['haya', '#a8734a'], ['hueso', '#e6e0d2'], ['marrón', '#7a5a3c'], ['beige', '#d6c9b1'], ['natural', '#cdb894'], ['gris', '#9b9b97'], ['blanco', '#f2f1ec']];
export function colorDe(nombre, defecto = '#b8b2a6') { const n = (nombre || '').toLowerCase(); for (const [k, c] of PALETA) if (n.includes(k)) return c; return defecto; }
const esMadera = c => { const k = new THREE.Color(c), h = {}; k.getHSL(h); return h.h > .04 && h.h < .14 && h.s > .18 && h.l > .2 && h.l < .78; };

// ---------- materiales ----------
let VETA = null; export function setVeta(t) { VETA = t; }
const cache = new Map();
function M(color, o = {}) {
  const key = color + '|' + JSON.stringify(o); if (cache.has(key)) return cache.get(key);
  const p = { color, roughness: .8, ...o }; delete p.madera; delete p.tela;
  if (!o.tela && (o.madera ?? esMadera(color))) { p.map = VETA; p.roughness = .55; }
  if (o.tela) p.roughness = .97;
  const m = new THREE.MeshStandardMaterial(p); cache.set(key, m); return m;
}
const METAL = c => M(c, { metalness: .6, roughness: .35, madera: false });
const VIDRIO = () => M('#d6e6ec', { transparent: true, opacity: .35, roughness: .05, metalness: .1, madera: false });

// ---------- primitivas ----------
const sombra = o => { o.castShadow = o.receiveShadow = true; return o; };
function caja(g, w, h, d, m, x = 0, y = 0, z = 0) { const o = sombra(new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m)); o.position.set(x, y + h / 2, z); g.add(o); return o; }
function rcaja(g, w, h, d, r, m, x = 0, y = 0, z = 0, seg = 3) {
  r = Math.max(.002, Math.min(r, w / 2 - .001, h / 2 - .001, d / 2 - .001));
  const o = sombra(new THREE.Mesh(new RoundedBoxGeometry(w, h, d, seg, r), m)); o.position.set(x, y + h / 2, z); g.add(o); return o;
}
function cil(g, rt, rb, h, m, x = 0, y = 0, z = 0, seg = 20) { const o = sombra(new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, h, seg), m)); o.position.set(x, y + h / 2, z); g.add(o); return o; }
function tubo(g, pts, r, m) { const c = new THREE.CatmullRomCurve3(pts.map(p => new THREE.Vector3(...p))); const o = sombra(new THREE.Mesh(new THREE.TubeGeometry(c, 48, r, 10, false), m)); g.add(o); return o; }
function barra(g, a, b, r, m) { // cilindro entre dos puntos
  const A = new THREE.Vector3(...a), B = new THREE.Vector3(...b), L = A.distanceTo(B), o = sombra(new THREE.Mesh(new THREE.CylinderGeometry(r, r, L, 10), m));
  o.position.copy(A).add(B).multiplyScalar(.5); o.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), B.clone().sub(A).normalize()); g.add(o); return o;
}
function patas(g, W, D, H, m, tipo = 'taco', ins = .05) {
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (W / 2 - ins), z = sz * (D / 2 - ins);
    if (tipo === 'conica') { cil(g, .018, .028, H, m, x, 0, z, 12); }
    else if (tipo === 'inclinada') barra(g, [x + sx * .04, 0, z + sz * .03], [x - sx * .02, H, z - sz * .015], .02, m);
    else if (tipo === 'metal') cil(g, .011, .011, H, m, x, 0, z, 10);
    else if (tipo === 'cuadrada') caja(g, .045, H, .045, m, x, 0, z);
    else rcaja(g, .05, H, .05, .008, m, x, 0, z);
  }
}
function tirador(g, tipo, x, y, z, m, w = .12) {
  if (tipo === 'pomo') { const o = sombra(new THREE.Mesh(new THREE.SphereGeometry(.016, 12, 8), m)); o.position.set(x, y, z + .012); g.add(o); }
  else if (tipo === 'barra') { caja(g, w, .012, .02, m, x, y - .006, z + .01); }
  else if (tipo === 'ranura') caja(g, w, .012, .004, M('#1d1b19', { madera: false }), x, y - .006, z + .001);
}

// ---------- SOFÁS ----------
function sofa(g, W, D, H, c, o) {
  // sofás en esquina (L) y en U: un tramo atrás de todo el ancho y alas laterales que vienen hacia delante
  if (o.forma === 'esquina' || o.forma === 'u') {
    const fd = Math.min(o.fondo ?? .97, D * .6), z0 = -D / 2, ala = D - fd, u = o.forma === 'u';
    const izq = o.esquinaDer ? false : true;     // por defecto, el ala a la izquierda
    sofa(g, W, fd, H, c, { ...o, forma: null, sinIzq: u || izq, sinDer: u || !izq, chaise: false, _desplZ: z0 + fd / 2 });
    for (const lado of u ? [-1, 1] : [izq ? -1 : 1]) {
      const sub = new THREE.Group(); sofa(sub, ala, fd, H, c, { ...o, forma: null, sinDer: lado < 0, sinIzq: lado > 0, chaise: false, plazas: Math.max(1, Math.round(ala / .62)) });
      sub.rotation.y = lado < 0 ? Math.PI / 2 : -Math.PI / 2; sub.position.set(lado * (W / 2 - fd / 2), 0, z0 + fd + ala / 2); g.add(sub);
    }
    return;
  }
  if (o._desplZ != null) { const sub = new THREE.Group(); sub.position.z = o._desplZ; g.add(sub); return sofa(sub, W, D, H, c, { ...o, _desplZ: null }); }
  const tela = M(c, { tela: true }), tela2 = M(new THREE.Color(c).multiplyScalar(.9).getStyle(), { tela: true });
  const pataM = o.patas === 'metal' ? METAL('#2a2a2a') : M(o.colorPatas || '#8a6a4a');
  const legH = o.legH ?? .08, seatH = o.seatH ?? .45, sofaD = Math.min(D, o.fondo ?? .97), z0 = -D / 2, armW = o.brazoW ?? (W > 1.2 ? .16 : .14);
  const armH = o.brazoH ?? (seatH + .18), backT = o.respaldoT ?? .22, seats = o.plazas ?? Math.max(1, Math.round((W - 2 * armW) / .62));
  const sinBrazos = o.brazos === 'no', aw = sinBrazos ? 0 : armW, aL = o.sinIzq ? 0 : aw, aR = o.sinDer ? 0 : aw, innerW = W - aL - aR, xc = (aL - aR) / 2;
  // base
  if (o.patas !== 'oculta') { const pg = new THREE.Group(); pg.position.z = z0 + sofaD / 2; g.add(pg); patas(pg, W - .06, sofaD - .06, legH, pataM, o.patas === 'metal' ? 'metal' : o.patas === 'conica' ? 'conica' : 'taco', .04); }
  const baseY = o.patas === 'oculta' ? 0 : legH, baseH = Math.max(.12, seatH - baseY - .14);
  rcaja(g, W, baseH, sofaD, .03, tela2, 0, baseY, z0 + sofaD / 2);
  // asientos
  const hayCh = o.chaise !== false && D > sofaD + .2, chW0 = hayCh ? Math.min(.95, innerW / 2 + .1) : 0, seatW = innerW - chW0, nS = hayCh ? Math.max(1, seats - 1) : seats;
  const seatD = sofaD - backT, cw = innerW / seats, sw = seatW / nS;
  for (let i = 0; i < nS; i++) rcaja(g, sw - .01, seatH - baseY - baseH + .02, seatD - .02, o.recto ? .02 : .05, tela, xc - innerW / 2 + sw * (i + .5), baseY + baseH - .02, z0 + backT + seatD / 2);
  // respaldo
  if (o.respaldo === 'fijo') rcaja(g, innerW, H - seatH + .1, backT, .05, tela, xc, seatH - .1, z0 + backT / 2);
  else if (o.respaldo === 'bloque') rcaja(g, W, H - baseY - baseH, backT, .04, tela, 0, baseY + baseH, z0 + backT / 2);
  else {
    rcaja(g, innerW, Math.max(.2, (H - seatH) * .55), .12, .03, tela2, xc, seatH - .05, z0 + .06);
    for (let i = 0; i < seats; i++) { const cu = rcaja(g, cw - .015, H - seatH + .02, .2, .07, tela, xc - innerW / 2 + cw * (i + .5), seatH - .04, z0 + .15); cu.rotation.x = -.12; }
  }
  // brazos
  if (!sinBrazos) for (const s of [-1, 1]) {
    if ((s < 0 && o.sinIzq) || (s > 0 && o.sinDer)) continue;
    const x = s * (W / 2 - armW / 2);
    if (o.brazos === 'redondo') { const b = rcaja(g, armW, armH - baseY, sofaD, armW / 2.2, tela, x, baseY, z0 + sofaD / 2, 5); }
    else if (o.brazos === 'fino') rcaja(g, armW, armH - baseY, sofaD, .02, tela, x, baseY, z0 + sofaD / 2);
    else rcaja(g, armW, armH - baseY, sofaD, .045, tela, x, baseY, z0 + sofaD / 2);
  }
  // chaiselongue (a la derecha, hacia delante)
  if (hayCh) {
    const chW = Math.min(.95, innerW / 2 + .1), x = W / 2 - aw - chW / 2, d2 = D - sofaD;
    rcaja(g, chW + aw, baseH, d2 + .02, .03, tela2, x + aw / 2, baseY, z0 + sofaD + d2 / 2 - .01);
    rcaja(g, chW - .01, seatH - baseY - baseH + .02, d2 + seatD - .03, .05, tela, x, baseY + baseH - .02, z0 + backT + (d2 + seatD) / 2);
    if (!sinBrazos) rcaja(g, armW, armH - baseY, d2, .045, tela, W / 2 - armW / 2, baseY, z0 + sofaD + d2 / 2);
    for (const sx of [-1, 1]) for (const sz of [0, 1]) if (o.patas !== 'oculta') rcaja(g, .05, legH, .05, .008, pataM, x + sx * (chW / 2 - .05), 0, z0 + sofaD + sz * (d2 - .06));
  }
  if (o.cojines) for (let i = 0; i < o.cojines; i++) { const k = rcaja(g, .42, .4, .12, .06, M(o.colorCojin || new THREE.Color(c).offsetHSL(0, 0, -.12).getStyle(), { tela: true }), -innerW / 2 + .3 + i * (innerW - .6) / Math.max(1, o.cojines - 1), seatH, z0 + backT + .1); k.rotation.x = -.25; }
}

// ---------- SILLONES ----------
function sillon(g, W, D, H, c, o) {
  const tela = M(c, { tela: true }), mad = M(o.colorMadera || '#c9a77c', { madera: true });
  switch (o.t) {
    case 'poang': {
      // estructura de madera laminada curvada (dos laterales) y cojín
      for (const s of [-1, 1]) {
        const x = s * (W / 2 - .03);
        tubo(g, [[x, .02, D / 2 - .05], [x, .02, -D / 2 + .1], [x, .3, -D / 2 + .05], [x, .45, D / 2 - .12], [x, .58, D / 2 - .08]], .022, mad);
      }
      barra(g, [-W / 2 + .03, .02, D / 2 - .05], [W / 2 - .03, .02, D / 2 - .05], .018, mad);
      barra(g, [-W / 2 + .03, .02, -D / 2 + .1], [W / 2 - .03, .02, -D / 2 + .1], .018, mad);
      const seat = rcaja(g, W - .1, .1, .52, .04, tela, 0, .32, .05); seat.rotation.x = -.2;
      const back = rcaja(g, W - .1, .62, .1, .04, tela, 0, .36, -D / 2 + .16); back.rotation.x = -.45;
      break;
    }
    case 'orejero': { // STRANDMON
      patas(g, W - .08, D - .1, .14, M('#5b4430', { madera: true }), 'conica', .04);
      rcaja(g, W - .2, .22, D - .1, .04, tela, 0, .14, .02);
      rcaja(g, W - .22, .14, D - .25, .05, tela, 0, .34, .08);
      rcaja(g, W - .1, H - .14, .16, .05, tela, 0, .14, -D / 2 + .08);
      for (const s of [-1, 1]) {
        rcaja(g, .1, .5, D - .1, .05, tela, s * (W / 2 - .05), .14, .02, 4);              // brazo enrollado
        rcaja(g, .1, H - .55, .34, .05, tela, s * (W / 2 - .07), .62, -D / 2 + .2);        // oreja
      }
      break;
    }
    case 'brazosMadera': { // EKENÄSET
      for (const s of [-1, 1]) { barra(g, [s * (W / 2 - .03), 0, D / 2 - .05], [s * (W / 2 - .03), .58, D / 2 - .08], .02, mad); barra(g, [s * (W / 2 - .03), 0, -D / 2 + .05], [s * (W / 2 - .03), .58, -D / 2 + .02], .02, mad); rcaja(g, .06, .03, D - .02, .012, mad, s * (W / 2 - .03), .58, 0); }
      rcaja(g, W - .1, .12, D - .2, .04, tela, 0, .32, .06); const b = rcaja(g, W - .1, .42, .12, .05, tela, 0, .4, -D / 2 + .12); b.rotation.x = -.18; break;
    }
    case 'giratorio': { // DYVLINGE: butaca acolchada (respaldo envolvente y asiento grueso) sobre pie de estrella
      for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; barra(g, [0, .05, 0], [Math.cos(a) * W * .4, .02, Math.sin(a) * D * .4], .015, METAL('#c9ccd0')); }
      cil(g, .03, .03, .3, METAL('#c9ccd0'), 0, .04, 0);
      const t2 = M(new THREE.Color(c).multiplyScalar(.94).getStyle(), { tela: true });
      rcaja(g, W * .86, .2, D * .78, .09, tela, 0, .3, .03, 5);
      const re = rcaja(g, W * .9, H - .42, .24, .11, tela, 0, .44, -D / 2 + .16, 5); re.rotation.x = -.16;
      for (const sx of [-1, 1]) { const b = rcaja(g, .17, .26, D * .62, .08, t2, sx * (W * .45 - .085), .44, -.02, 5); b.rotation.z = sx * .08; }
      for (let i = 0; i < 3; i++) for (let j = 0; j < 2; j++) esfera(g, .012, t2, (i - 1) * W * .22, .62 + j * .2, -D / 2 + .29 - j * .03);
      break;
    }
    case 'concha': { // HERRÅKRA: carcasa tapizada en una pieza sobre cuatro patas finas
      for (const sx of [-1, 1]) for (const sz of [-1, 1]) barra(g, [sx * W * .32, 0, sz * D * .3], [sx * W * .22, .38, sz * D * .18], .014, METAL(o.colorPatas || '#2a2a2a'));
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(.5, .42, 1, 36, 1, true, Math.PI * .15, Math.PI * 1.7), M(c, { tela: true })); sombra(sh);
      sh.material = sh.material.clone(); sh.material.side = THREE.DoubleSide; sh.scale.set(W * .98, H - .4, D * .95); sh.position.set(0, .38 + (H - .4) / 2, 0); g.add(sh);
      const as = cil(g, .5, .5, .1, tela, 0, .38, .02, 32); as.scale.set(W * .86, 1, D * .82);
      break;
    }
    case 'redondo': { // LILLESÄTER, STOCKHOLM: butaca baja, mullida y redondeada, con respaldo envolvente grueso
      const h = Math.min(H, .82), y0 = o.patas === 'oculta' ? 0 : .07;
      if (o.patas !== 'oculta') patas(g, W - .22, D - .22, y0, M(o.colorPatas || '#b08a5c', { madera: true }), 'conica', .04);
      rcaja(g, W * .96, .4 - y0, D * .9, .16, tela, 0, y0, .02, 6);
      const n = 18, rx = W * .4, rz = D * .38, hb = h - .3;   // respaldo curvo: segmentos mullidos a lo largo de un arco
      for (let i = 0; i < n; i++) { const a = Math.PI * (-.1 + 1.2 * i / (n - 1)), x = Math.cos(a) * rx, z = -Math.sin(a) * rz;
        const k = rcaja(g, .2, hb * (1 - Math.abs(Math.cos(a)) * .12), .22, .1, tela, x, .3, z, 4); k.rotation.y = a - Math.PI / 2; }
      break;
    }
    case 'relax': { // MUREN, EKOLSUND
      rcaja(g, W, .32, D - .05, .06, tela, 0, 0, .02); rcaja(g, W - .24, .16, D - .25, .06, tela, 0, .3, .08);
      const b = rcaja(g, W - .2, H - .3, .28, .08, tela, 0, .3, -D / 2 + .15); b.rotation.x = -.1;
      for (const s of [-1, 1]) rcaja(g, .14, .3, D - .1, .06, tela, s * (W / 2 - .07), .3, .02);
      break;
    }
    case 'butaca': default: { // TULLSTA, ÅRSUNDA, HERRÅKRA, EKTORP: tapizada con brazos curvos
      if (o.patas !== 'oculta') patas(g, W - .1, D - .1, .1, M(o.colorPatas || '#7a5a3c', { madera: true }), 'conica', .04);
      const y0 = o.patas === 'oculta' ? 0 : .1;
      rcaja(g, W, .3 - y0 + .1, D - .04, .06, tela, 0, y0, .02);
      rcaja(g, W - .26, .12, D - .26, .05, tela, 0, .38, .08);
      rcaja(g, W - .04, H - y0, .2, .09, tela, 0, y0, -D / 2 + .1, 5);
      for (const s of [-1, 1]) rcaja(g, .14, (o.brazoH ?? .62) - y0, D - .05, .07, tela, s * (W / 2 - .07), y0, .02, 5);
    }
  }
}

// ---------- MESAS ----------
function mesa(g, W, D, H, c, o) {
  const top = o.vidrio ? VIDRIO() : M(c), patM = o.colorPatas ? (o.patas === 'metal' || o.patas === 'u' || o.patas === 'aro' ? METAL(o.colorPatas) : M(o.colorPatas)) : M(new THREE.Color(c).multiplyScalar(.85).getStyle());
  const t = o.grosor ?? .035, forma = o.forma || 'rect';
  const tablero = (y, mm = top, tt = t) => {
    if (forma === 'redonda' || forma === 'oval') { const k = cil(g, .5, .5, tt, mm, 0, y, 0, 48); k.scale.set(W, 1, D); return k; }
    return rcaja(g, W, tt, D, Math.min(.01, tt / 3), mm, 0, y, 0);
  };
  tablero(H - t);
  const L = H - t;
  switch (o.patas) {
    case 'pie': { cil(g, .04, .05, L, patM, 0, 0, 0); const b = cil(g, .5, .5, .03, patM, 0, 0, 0, 40); b.scale.set(Math.min(W, D) * .55, 1, Math.min(W, D) * .55); break; }
    case 'tulipa': { const pts = [new THREE.Vector2(.26, 0), new THREE.Vector2(.2, .03), new THREE.Vector2(.06, .2), new THREE.Vector2(.045, L - .12), new THREE.Vector2(.12, L)]; const o2 = sombra(new THREE.Mesh(new THREE.LatheGeometry(pts, 40), patM)); g.add(o2); break; }
    case 'u': for (const s of [-1, 1]) { const x = s * (W / 2 - .12); barra(g, [x, 0, -D / 2 + .1], [x, 0, D / 2 - .1], .015, patM); barra(g, [x, 0, -D / 2 + .1], [x, L, -D / 2 + .1], .015, patM); barra(g, [x, 0, D / 2 - .1], [x, L, D / 2 - .1], .015, patM); barra(g, [x, L, -D / 2 + .1], [x, L, D / 2 - .1], .015, patM); } break;
    case 'aro': { for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2 + Math.PI / 4; barra(g, [Math.cos(a) * W * .42, 0, Math.sin(a) * D * .42], [Math.cos(a) * W * .4, L, Math.sin(a) * D * .4], .012, patM); } break; }
    case 'inclinada': patas(g, W - .1, D - .1, L, patM, 'inclinada', .08); break;
    case 'metal': patas(g, W, D, L, patM, 'metal', forma === 'rect' ? .06 : Math.min(W, D) * .16); break;
    case 'conica': patas(g, W, D, L, patM, 'conica', forma === 'rect' ? .07 : Math.min(W, D) * .16); break;
    case 'caballete': for (const s of [-1, 1]) { const x = s * (W / 2 - .2); barra(g, [x, 0, -D / 2 + .08], [x, L, -D / 2 + .15], .025, patM); barra(g, [x, 0, D / 2 - .08], [x, L, D / 2 - .15], .025, patM); barra(g, [x, 0, -D / 2 + .08], [x, 0, D / 2 - .08], .02, patM); } break;
    case 'panel': for (const s of [-1, 1]) caja(g, .04, L, D - .06, patM, s * (W / 2 - .05), 0, 0); break;
    case 'cuadrada': default: patas(g, W, D, L, patM, 'cuadrada', forma === 'rect' ? .05 : Math.min(W, D) * .16);
  }
  if (o.balda) { if (forma === 'redonda') { const k = cil(g, .5, .5, .02, o.vidrio ? M(c) : top, 0, .12, 0, 40); k.scale.set(W * .85, 1, D * .85); } else rcaja(g, W - .12, .02, D - .12, .005, o.vidrio ? M(c) : top, 0, .12, 0); }
  if (o.cajon) { rcaja(g, W * .5, .1, D - .1, .005, top, 0, H - t - .1, 0); tirador(g, 'barra', 0, H - t - .05, D / 2 - .05, M('#222', { madera: false })); }
  if (o.ruedas) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = cil(g, .025, .025, .02, M('#222', { madera: false }), sx * (W / 2 - .05), 0, sz * (D / 2 - .05)); w.rotation.z = Math.PI / 2; w.position.y = .025; }
  if (o.bandeja) { const k = cil(g, .5, .5, .015, top, 0, H - .05, 0, 40); k.scale.set(W * .98, 1, D * .98); const r = new THREE.Mesh(new THREE.TorusGeometry(.5, .012, 8, 48), top); r.rotation.x = Math.PI / 2; r.scale.set(W * .98, D * .98, 1); r.position.y = H - .03; g.add(r); }
}
function mesaCaja(g, W, D, H, c, o) { // HOL: listones de acacia; ÖSTAVALL: elevable con hueco
  const m = M(c);
  if (o.t === 'listones') { caja(g, W, .025, D, m, 0, H - .025, 0); caja(g, W, .02, D, m, 0, .02, 0); for (let i = 0; i < 9; i++) for (const s of [-1, 1]) caja(g, W / 9 - .015, H - .07, .015, m, -W / 2 + (i + .5) * W / 9, .045, s * (D / 2 - .01)); for (const s of [-1, 1]) caja(g, .015, H - .07, D, m, s * (W / 2 - .01), .045, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(g, .04, .02, .04, m, sx * (W / 2 - .03), 0, sz * (D / 2 - .03)); }
  else { rcaja(g, W, H * .55, D, .02, m, 0, 0, 0); rcaja(g, W, .03, D, .01, m, 0, H - .03, 0); caja(g, W - .06, H * .45 - .03, D - .06, M('#30302e', { madera: false }), 0, H * .55, 0); }
}

// ---------- SILLAS ----------
function silla(g, W, D, H, c, o) {
  const m = M(c), sec = o.color2 ? (o.patas === 'metal' || o.patas === 'trineo' || o.patas === 'S' ? METAL(o.color2) : M(o.color2)) : m;
  const seatY = o.respaldo === 'ninguno' ? H : Math.min(.47, H * .55), tela = M(o.colorTela || c, { tela: true });
  switch (o.patas) {
    case 'metal': patas(g, W - .02, D - .02, seatY - .02, sec, 'metal', o.asiento === 'redondo' ? W * .2 : .04); break;
    case 'trineo': for (const s of [-1, 1]) { const x = s * (W / 2 - .04); barra(g, [x, 0, D / 2 - .03], [x, 0, -D / 2 + .05], .01, sec); barra(g, [x, 0, D / 2 - .03], [x, seatY, D / 2 - .06], .01, sec); barra(g, [x, 0, -D / 2 + .05], [x, seatY, -D / 2 + .06], .01, sec); } break;
    case 'estrella': { const mm = METAL('#2b2b2b'); for (let i = 0; i < 5; i++) { const a = i * Math.PI * 2 / 5; barra(g, [0, .06, 0], [Math.cos(a) * W * .45, .04, Math.sin(a) * D * .45], .015, mm); } cil(g, .025, .025, seatY - .1, mm, 0, .05, 0); break; }
    case 'S': for (const s of [-1, 1]) tubo(g, [[s * (W / 2 - .05), 0, D / 2 - .05], [s * (W / 2 - .05), .02, -D / 2 + .08], [s * (W / 2 - .05), seatY - .05, D / 2 - .1], [s * (W / 2 - .05), seatY, -D / 2 + .05]], .012, sec); break;
    default: patas(g, W - .02, D - .02, seatY - .03, sec, o.patas === 'conica' ? 'conica' : 'cuadrada', o.asiento === 'redondo' ? W * .2 : .035);
  }
  const seatM = o.asiento === 'tapizado' ? tela : (o.asiento === 'plastico' ? M(c, { madera: false, roughness: .4 }) : m);
  if (o.asiento === 'redondo') { const k = cil(g, .5, .5, .05, tela, 0, seatY - .05, .02, 36); k.scale.set(W * .95, 1, D * .9); }
  else rcaja(g, W, o.asiento === 'tapizado' ? .07 : .035, D - .02, o.asiento === 'plastico' ? .02 : .012, seatM, 0, seatY - .04, .01);
  const bz = -D / 2 + .03, bh = H - seatY;
  if (o.respaldo === 'ninguno' && H > .6) { const y = H * .38; for (const [a, b] of [[[-1, -1], [1, -1]], [[1, -1], [1, 1]], [[1, 1], [-1, 1]], [[-1, 1], [-1, -1]]]) barra(g, [a[0] * (W / 2 - .06), y, a[1] * (D / 2 - .06)], [b[0] * (W / 2 - .06), y, b[1] * (D / 2 - .06)], .009, sec); }
  switch (o.respaldo) {
    case 'escalera': for (const s of [-1, 1]) caja(g, .035, bh, .035, sec, s * (W / 2 - .035), seatY - .03, bz); for (let i = 0; i < 3; i++) caja(g, W - .07, .045, .02, m, 0, seatY + .12 + i * (bh - .2) / 2, bz); break;
    case 'listones': for (const s of [-1, 1]) caja(g, .035, bh, .035, sec, s * (W / 2 - .035), seatY - .03, bz); caja(g, W - .07, .06, .025, m, 0, H - .07, bz); for (let i = 0; i < 4; i++) caja(g, .025, bh - .12, .015, m, -W / 4 + i * W / 6, seatY + .02, bz); break;
    case 'tapizado': { const b = rcaja(g, W - .02, bh + .02, .07, .03, tela, 0, seatY - .02, bz + .02); b.rotation.x = -.08; break; }
    case 'carcasa': { // carcasa de plástico curva (BALTSAR, TEODORES…)
      const sh = new THREE.Mesh(new THREE.CylinderGeometry(W * .52, W * .46, bh, 32, 1, true, Math.PI * .62, Math.PI * .76), seatM); sombra(sh); sh.material = sh.material.clone(); sh.material.side = THREE.DoubleSide; sh.position.set(0, seatY + bh / 2 - .03, bz + W * .44); sh.rotation.x = -.1; g.add(sh); break; }
    case 'curvo': { const sh = new THREE.Mesh(new THREE.CylinderGeometry(W * .55, W * .55, bh * .55, 32, 1, true, Math.PI * .7, Math.PI * .6), m); sombra(sh); sh.material.side = THREE.DoubleSide; sh.position.set(0, seatY + bh * .45, bz + W * .42); g.add(sh); for (const s of [-1, 1]) cil(g, .016, .016, bh * .55, sec, s * (W / 2 - .05), seatY - .02, bz + .05, 10); break; }
    case 'ninguno': break;
    case 'aro': default: for (const s of [-1, 1]) caja(g, .035, bh, .035, sec, s * (W / 2 - .035), seatY - .03, bz); rcaja(g, W - .04, .14, .03, .01, m, 0, H - .16, bz);
  }
}

// ---------- CAMAS ----------
function cama(g, W, D, H, c, o) {
  const m = o.t === 'tapizada' ? M(c, { tela: true }) : (o.t === 'metal' ? METAL(c) : M(c)), z0 = -D / 2;
  const railH = o.t === 'metal' ? .3 : (o.base ?? .32), mattW = W - (o.t === 'metal' ? .04 : .12), mattD = D - (o.cabeceroT ?? .1) - (o.t === 'metal' ? .05 : .08);
  if (o.t === 'metal') {
    const r = .015, mm = m;
    for (const zz of [z0 + .02, D / 2 - .02]) { const hh = zz < 0 ? H : .6; for (const s of [-1, 1]) barra(g, [s * (W / 2 - .02), 0, zz], [s * (W / 2 - .02), hh, zz], r * 1.4, mm); barra(g, [-W / 2 + .02, hh, zz], [W / 2 - .02, hh, zz], r * 1.3, mm); for (let i = 1; i < 8; i++) barra(g, [-W / 2 + i * W / 8, railH, zz], [-W / 2 + i * W / 8, hh, zz], r * .7, mm); }
    for (const s of [-1, 1]) barra(g, [s * (W / 2 - .02), railH, z0 + .02], [s * (W / 2 - .02), railH, D / 2 - .02], r, mm);
  } else {
    if (o.patas) patas(g, W - .02, D - .02, o.patas, M(o.colorPatas || '#7a5a3c'), 'conica', .05);
    const y0 = o.patas || 0;
    rcaja(g, W, railH - y0, D - (o.cabeceroT ?? .1) + .02, o.t === 'tapizada' ? .04 : .006, m, 0, y0, z0 + (D + (o.cabeceroT ?? .1)) / 2 - .01);
    rcaja(g, W, H, o.cabeceroT ?? .1, o.t === 'tapizada' ? .05 : .006, m, 0, 0, z0 + (o.cabeceroT ?? .1) / 2);
    if (o.t === 'tapizada' && o.capiton) for (let i = 0; i < 5; i++) for (let j = 0; j < 2; j++) { const b = new THREE.Mesh(new THREE.SphereGeometry(.012, 8, 6), M(new THREE.Color(c).multiplyScalar(.7).getStyle())); b.position.set(-W * .4 + i * W * .2, railH + .25 + j * .25, z0 + (o.cabeceroT ?? .1) + .002); g.add(b); }
    if (o.t === 'pino') { for (const s of [-1, 1]) { caja(g, .07, H, .07, m, s * (W / 2 - .035), 0, z0 + .035); caja(g, .07, .55, .07, m, s * (W / 2 - .035), 0, D / 2 - .035); } caja(g, W, .25, .03, m, 0, .3, D / 2 - .03); }
    if (o.pie) rcaja(g, W, o.pie, .04, .006, m, 0, 0, D / 2 - .02);
    if (o.cajones) { const n = o.cajones / 2; for (const s of [-1, 1]) for (let i = 0; i < n; i++) { const zc = z0 + (o.cabeceroT ?? .1) + (i + .5) * (D - .2) / n; caja(g, .004, (railH - y0) * .6, (D - .3) / n, M(new THREE.Color(c).multiplyScalar(.85).getStyle()), s * (W / 2 + .002), y0 + .04, zc); } }
  }
  // colchón, edredón y almohadas
  const my = railH - .02;
  rcaja(g, mattW, .2, mattD, .06, M('#f5f4f0', { tela: true }), 0, my, z0 + (o.cabeceroT ?? .1) + mattD / 2 + .01);
  rcaja(g, mattW + .04, .06, mattD * .62, .03, M(o.colorEdredon || '#e2ddd3', { tela: true }), 0, my + .17, z0 + (o.cabeceroT ?? .1) + mattD * .38 + .02);
  for (const s of [-1, 1]) rcaja(g, mattW * .42, .12, .36, .05, M('#ecebe7', { tela: true }), s * mattW * .23, my + .2, z0 + (o.cabeceroT ?? .1) + .24);
}

// ---------- ALMACENAJE ----------
function comoda(g, W, D, H, c, o) {
  const m = M(c), dark = M(new THREE.Color(c).multiplyScalar(.82).getStyle()), metal = METAL(o.colorTirador || '#3a3a3a');
  const baseH = o.patas ? o.patas : (o.zocalo ?? .05);
  if (o.patas) patas(g, W - .04, D - .04, o.patas, o.colorPatas ? M(o.colorPatas) : m, o.tipoPatas || 'cuadrada', .04);
  else caja(g, W - .04, baseH, D - .04, dark, 0, 0, -.01);
  const bodyH = H - baseH - (o.tapa ? .03 : 0);
  rcaja(g, W, bodyH, D - .02, .004, m, 0, baseH, -.01);
  if (o.tapa) rcaja(g, W + .03, .03, D + .01, .006, o.colorTapa ? M(o.colorTapa) : m, 0, H - .03, 0);
  const filas = o.filas ?? 3, gap = .006, dh = (bodyH - .03) / filas;
  for (let r = 0; r < filas; r++) { const cols = (o.arriba && r === filas - 1) ? o.arriba : (o.cols ?? 1); for (let k = 0; k < cols; k++) {
    const cw = (W - .03) / cols, x = -W / 2 + .015 + (k + .5) * cw, y = baseH + .015 + r * dh;
    rcaja(g, cw - gap, dh - gap, .02, .003, m, x, y, D / 2 - .02);
    if (o.tirador !== 'ninguno' && o.tirador !== 'pomo2') tirador(g, o.tirador || 'barra', x + (o.tirador === 'pomo' && cols === 1 ? 0 : 0), y + dh / 2, D / 2, metal, Math.min(.18, cw * .4));
    if (o.tirador === 'pomo2') { tirador(g, 'pomo', x - cw * .25, y + dh / 2, D / 2, metal); tirador(g, 'pomo', x + cw * .25, y + dh / 2, D / 2, metal); }
  } }
}
function libreria(g, W, D, H, c, o) {
  if (o.abierta) { // estantería abierta: cuatro postes y baldas
    const m = M(c), pm = o.metal ? METAL(colorDe(o.metal)) : m, n = Math.max(2, Math.round(H / .38));
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(g, .025, H, .025, pm, sx * (W / 2 - .0125), 0, sz * (D / 2 - .0125));
    for (let i = 0; i <= n; i++) caja(g, W, .018, D, m, 0, .03 + i * (H - .05) / n, 0);
    if (o.ruedas) for (const sx of [-1, 1]) for (const sz of [-1, 1]) { const w = cil(g, .025, .025, .02, M('#222', { madera: false }), sx * (W / 2 - .03), 0, sz * (D / 2 - .03)); w.rotation.z = Math.PI / 2; w.position.y = .025; }
    return;
  }
  const m = M(c), t = o.grosor ?? .018, back = M(new THREE.Color(c).multiplyScalar(.9).getStyle());
  caja(g, W, H, .006, back, 0, 0, -D / 2 + .003);
  for (const s of [-1, 1]) caja(g, t, H, D, m, s * (W / 2 - t / 2), 0, 0);
  if (o.t === 'kallax') {
    const T = .038, n = Math.round(W / .37), mv = Math.round(H / .37);
    for (let i = 0; i <= mv; i++) caja(g, W, T, D, m, 0, i * (H - T) / mv, 0);
    for (let i = 0; i <= n; i++) caja(g, T, H, D, m, -W / 2 + T / 2 + i * (W - T) / n, 0, 0);
    if (o.puertas) for (let i = 0; i < Math.min(2, mv); i++) caja(g, W / n - .045, H / mv - .045, .015, M('#f4f3ef', { madera: false }), -W / 2 + (W / n) / 2 + i * 0, .02 + i * (H - T) / mv, D / 2 - .01);
    return;
  }
  const z = o.zocalo ?? .06; caja(g, W - .02, z, D - .02, m, 0, 0, 0); caja(g, W, t, D, m, 0, H - t, 0);
  const n = Math.max(1, Math.round((H - z) / .36)); for (let i = 0; i < n; i++) caja(g, W - 2 * t, t, D - .02, m, 0, z + i * (H - z - t) / n, .01);
  if (o.libros) for (let i = 0; i < n; i++) for (let k = 0; k < 8; k++) { const bh = .2 + ((k * 37 + i * 13) % 7) * .015; caja(g, .03, bh, D * .7, M(['#8b4f3c', '#3d5a6c', '#d8cdb8', '#6b6a34', '#2b2b2b'][(k + i) % 5], { madera: false }), -W / 2 + .05 + k * .04, z + t + i * (H - z - t) / n, 0); }
}
// combinaciones (BILLY/OXBERG, PAX, BESTÅ…): secciones del ancho base de la serie, abiertas o con puertas
function combinacion(g, W, D, H, c, o) {
  const m = M(c), t = .02, n = Math.max(1, Math.round(W / ((o.base || 60) / 100))), sw = W / n;
  const altas = o.mesa ? Math.max(1, Math.ceil(n / 2)) : n;            // con mesa plegable: la mitad izquierda es baja
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + (i + .5) * sw, alta = i >= n - altas, h = alta ? H : Math.min(H, 1.06);
    const s = new THREE.Group(); s.position.x = x; g.add(s);
    caja(s, sw - .004, h, .006, M(new THREE.Color(c).multiplyScalar(.92).getStyle()), 0, 0, -D / 2 + .003);
    for (const sx of [-1, 1]) caja(s, t, h, D, m, sx * (sw / 2 - t / 2 - .002), 0, 0);
    caja(s, sw - .004, .06, D - .02, m, 0, 0, 0); caja(s, sw - .004, t, D, m, 0, h - t, 0);
    const nb = Math.max(1, Math.round((h - .08) / .36)); for (let k = 1; k < nb; k++) caja(s, sw - 2 * t, t, D - .02, m, 0, .06 + k * (h - .08) / nb, .01);
    // puertas: arriba en las altas (como OXBERG de 97 cm) o enteras si el armario es tipo PAX
    if (o.puertas && alta) { const ent = o.enteras || (o.base || 60) >= 100, ph = ent ? h - .08 : Math.min(h * .47, .97), y0 = ent ? .07 : h - ph - .01;
      for (const sx of sw > .6 ? [-1, 1] : [0]) { const pw = sw > .6 ? sw / 2 - .006 : sw - .008, px = sx * sw / 4;
        caja(s, pw, ph, .02, m, px, y0, D / 2 - .01);
        if (o.vidrio) caja(s, pw - .08, ph - .1, .004, VIDRIO(), px, y0 + .05, D / 2 + .001);
        else { caja(s, pw - .1, ph - .1, .004, M(new THREE.Color(c).multiplyScalar(.95).getStyle()), px, y0 + .05, D / 2 + .001); }
        tirador(s, 'pomo', px + (sx || 1) * -(pw / 2 - .04), y0 + ph * .5, D / 2, METAL('#bdbdbd')); } }
    if (o.libros && !(o.puertas && alta && (o.enteras || (o.base || 60) >= 100))) for (let k = 0; k < Math.min(nb, alta && o.puertas ? Math.floor(nb / 2) : nb); k++) for (let b = 0; b < 6; b++) caja(s, .03, .2 + ((b * 37 + k * 13) % 7) * .015, D * .7, M(['#8b4f3c', '#3d5a6c', '#d8cdb8', '#6b6a34', '#2b2b2b'][(b + k) % 5], { madera: false }), -sw / 2 + .06 + b * .045, .06 + t + k * (h - .08) / nb, 0);
  }
  if (o.mesa) { const lw = W - altas * sw; caja(g, lw, .03, D + .45, m, -W / 2 + lw / 2, .74, .2); for (const sx of [-1, 1]) caja(g, .02, .72, .4, m, -W / 2 + lw / 2 + sx * (lw / 2 - .01), 0, D / 2 + .22); }
}
// lámina abstracta para marcos vacíos: colores y formas que dependen del nombre (siempre la misma para el mismo producto)
function laminaGenerada(semilla, aspecto) {
  let h = 2166136261; for (const ch of semilla) h = Math.imul(h ^ ch.charCodeAt(0), 16777619); const rnd = () => ((h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0) / 4294967296);
  const PAL = [['#e9e1d3', '#c8553d', '#2d4a53', '#d9a441'], ['#f2ede4', '#3b5249', '#a8c3b0', '#e3b04b'], ['#efe8df', '#1f2a44', '#c97b63', '#9aa5b1'], ['#f4efe6', '#b5654a', '#e8c9a0', '#4d5b4c'], ['#ece6dc', '#2e2e2e', '#d4a373', '#7a9e9f']][Math.floor(rnd() * 5)];
  const cv = document.createElement('canvas'), Wc = 256, Hc = Math.round(256 / Math.max(.3, Math.min(3, aspecto))); cv.width = Wc; cv.height = Hc; const x = cv.getContext('2d');
  x.fillStyle = PAL[0]; x.fillRect(0, 0, Wc, Hc);
  const tipo = Math.floor(rnd() * 3);
  if (tipo === 0) for (let i = 0; i < 5; i++) { x.fillStyle = PAL[1 + i % 3]; x.beginPath(); x.arc(rnd() * Wc, rnd() * Hc, 20 + rnd() * Wc * .35, 0, Math.PI * 2); x.globalAlpha = .85; x.fill(); }
  else if (tipo === 1) { for (let i = 0; i < 4; i++) { x.fillStyle = PAL[1 + i % 3]; x.globalAlpha = .9; x.fillRect(rnd() * Wc * .6, rnd() * Hc * .6, Wc * (.2 + rnd() * .4), Hc * (.15 + rnd() * .4)); } }
  else { x.globalAlpha = 1; const hz = Hc * (.45 + rnd() * .2); x.fillStyle = PAL[2]; x.fillRect(0, hz, Wc, Hc - hz); x.fillStyle = PAL[1]; x.beginPath(); x.arc(Wc * (.3 + rnd() * .4), hz - 10, Wc * .14, 0, Math.PI * 2); x.fill(); x.fillStyle = PAL[3]; x.beginPath(); x.moveTo(0, hz); x.lineTo(Wc * .35, hz - Hc * .25); x.lineTo(Wc * .7, hz); x.fill(); }
  x.globalAlpha = 1; return cv;
}
// ---------- PLANTAS ----------
// hojas con forma real (lanceolada, ancha, de palmera…), curvadas, en vez de bolas
const hojaGeoCache = new Map();
function hojaGeo(tipo) {
  if (hojaGeoCache.has(tipo)) return hojaGeoCache.get(tipo);
  const s = new THREE.Shape(), anch = { ancha: .42, normal: .26, fina: .08, cinta: .05 }[tipo] ?? .26;
  s.moveTo(0, 0); s.bezierCurveTo(anch, .15, anch, .65, 0, 1); s.bezierCurveTo(-anch, .65, -anch, .15, 0, 0);
  const geo = new THREE.ShapeGeometry(s, 10), p = geo.attributes.position;
  for (let i = 0; i < p.count; i++) { const y = p.getY(i), x = p.getX(i); p.setZ(i, -y * y * .35 + Math.abs(x) * .25); }   // curvatura: cae hacia la punta y nervio central hundido
  geo.rotateX(-Math.PI / 2); geo.computeVertexNormals(); hojaGeoCache.set(tipo, geo); return geo;
}
function hojaR(g, mat, x, y, z, largo, ancho, rumbo, inclin, tipo = 'normal', giro = 0) {
  const m = new THREE.Mesh(hojaGeo(tipo), mat); m.scale.set(ancho / ({ ancha: .84, normal: .52, fina: .16, cinta: .1 }[tipo] ?? .52) * .5 * 2, largo, largo);
  m.position.set(x, y, z); m.rotation.set(inclin, -rumbo - Math.PI / 2, giro, 'YXZ'); m.castShadow = true; g.add(m); return m;
}
function planta(g, W, D, H, c, o) {
  const R = Math.min(W, D) / 2;
  let h = 5381; for (const ch of o.semilla || 'x') h = (h * 33 ^ ch.charCodeAt(0)) >>> 0; const rnd = () => ((h = (h * 1103515245 + 12345) >>> 0) / 4294967296);
  const base = new THREE.Color(o.verde || '#4f7a45'), hojaM = k => { const cc = base.clone().offsetHSL((k % 3 - 1) * .012, 0, (k % 4) * .035 - .04); return new THREE.MeshStandardMaterial({ color: cc, roughness: .55, side: THREE.DoubleSide }); };
  const mats = [0, 1, 2, 3, 4, 5].map(hojaM), mh = () => mats[Math.floor(rnd() * mats.length)], tallo = M('#5d6b3a', { madera: false });
  const potR = Math.min(R * .8, .06 + R * .35), potH = o.t === 'colgante' ? potR * 1.1 : Math.min(H * .28, potR * 1.6), macetaM = M(o.maceta || '#e9e5dc', { madera: false, roughness: .45 });
  const maceta = y => { const pts = [new THREE.Vector2(.001, 0), new THREE.Vector2(potR * .72, 0), new THREE.Vector2(potR * .95, potH * .9), new THREE.Vector2(potR, potH), new THREE.Vector2(potR * .9, potH), new THREE.Vector2(potR * .86, potH * .92)];
    const p = sombra(new THREE.Mesh(new THREE.LatheGeometry(pts, 32), macetaM)); p.position.y = y; g.add(p); const t = cil(g, potR * .86, potR * .86, .008, M('#3e3127', { madera: false, roughness: 1 }), 0, y + potH * .86, 0, 24); };
  const y0 = potH * .9, top = H;
  if (o.t !== 'colgante') maceta(0);
  switch (o.t) {
    case 'arbol': {
      if (o.palmera) { // tallos finos y frondas arqueadas con foliolos
        for (let f = 0; f < 11; f++) { const a = f * 2.4 + rnd(), el = .35 + rnd() * .55, L = (top - y0) * (.45 + rnd() * .3), sx = Math.cos(a), sz = Math.sin(a), hb = y0 + (top - y0) * (.15 + rnd() * .35);
          barra(g, [rnd() * .03, y0, rnd() * .03], [sx * .05, hb, sz * .05], .006, tallo);
          for (let k = 0; k < 14; k++) { const t = k / 14, px = sx * (.05 + L * t * Math.cos(el)), py = hb + L * t * Math.sin(el) - L * t * t * .5, pz = sz * (.05 + L * t * Math.cos(el));
            for (const lado of [-1, 1]) hojaR(g, mh(), px, py, pz, L * .32 * (1 - t * .5), L * .03, a + lado * 1.15 - Math.PI / 2 + Math.PI / 2, .6 - t * .4, 'cinta'); } }
      } else { // tronco y copa de hojas pequeñas (ficus, árbol)
        const tr = M('#7a6550', { madera: false, roughness: .9 }), alto = y0 + (top - y0) * .45; barra(g, [0, y0, 0], [0, alto, 0], Math.max(.008, R * .05), tr);
        for (let b = 0; b < 4; b++) { const a = b * 1.6 + rnd(); barra(g, [0, alto * .9, 0], [Math.cos(a) * R * .35, alto + (top - alto) * .3, Math.sin(a) * R * .35], Math.max(.005, R * .025), tr); }
        const n = Math.round(90 + R * 120); for (let i = 0; i < n; i++) { const a = rnd() * 6.28, rr = Math.sqrt(rnd()) * R * .85, y = alto + (top - alto) * (.08 + rnd() * .9);
          const fy = 1 - Math.pow((y - alto) / (top - alto) * 2 - 1, 2); hojaR(g, mh(), Math.cos(a) * rr * (.4 + fy * .6), y, Math.sin(a) * rr * (.4 + fy * .6), .07 + R * .06, .035 + R * .03, a + (rnd() - .5), .2 + rnd() * .6); }
      }
      break; }
    case 'grandes': { // monstera, filodendro…: tallos largos que salen de la maceta y hojas anchas
      const n = 7 + Math.floor(rnd() * 5);
      for (let i = 0; i < n; i++) { const a = i * 2.4 + rnd() * .5, sale = .25 + rnd() * .55, L = (top - y0) * (.55 + rnd() * .45), hx = Math.cos(a) * L * sale, hz = Math.sin(a) * L * sale, hy = y0 + L * Math.sqrt(1 - sale * sale) * .95;
        tubo(g, [[0, y0, 0], [hx * .35, y0 + (hy - y0) * .6, hz * .35], [hx, hy, hz]], .0045, tallo);
        const lh = Math.min(R * .95, (top - y0) * .55) * (.75 + rnd() * .5); hojaR(g, mh(), hx, hy, hz, lh, lh * .8, a, .15 + rnd() * .5, 'ancha', (rnd() - .5) * .5); }
      break; }
    case 'vertical': {
      if (o.cactus) { const n = 1 + Math.floor(rnd() * 3); for (let i = 0; i < n; i++) { const a = rnd() * 6.28, r = rnd() * potR * .45, hh = (top - y0) * (.55 + rnd() * .45), k = cil(g, potR * .32, potR * .38, hh, mats[i], Math.cos(a) * r, y0, Math.sin(a) * r, 10); const sp = new THREE.Mesh(new THREE.SphereGeometry(potR * .32, 10, 6, 0, 6.3, 0, 1.6), mats[i]); sp.position.set(Math.cos(a) * r, y0 + hh, Math.sin(a) * r); g.add(sp); } }
      else for (let i = 0; i < 9; i++) { const a = rnd() * 6.28, r = rnd() * potR * .45; hojaR(g, mh(), Math.cos(a) * r, y0, Math.sin(a) * r, (top - y0) * (.55 + rnd() * .45), potR * .28, a, Math.PI / 2 - .08 - rnd() * .2, 'fina', rnd() * .6); }
      break; }
    case 'colgante': { const yp = H - potH - .22; maceta(yp);
      for (let i = 0; i < 3; i++) barra(g, [0, H, 0], [Math.cos(i * 2.09) * potR * .95, yp + potH, Math.sin(i * 2.09) * potR * .95], .0018, M('#cbbfa5', { madera: false }));
      for (let s = 0; s < 11; s++) { const a = s * .57 + rnd() * .3, x0 = Math.cos(a) * potR * .9, z0 = Math.sin(a) * potR * .9, len = Math.min(yp + potH - .05, (H - potH) * (.4 + rnd() * .6)), nh = 8 + Math.floor(len * 18);
        for (let k = 0; k < nh; k++) { const t = k / nh, out = 1 + t * .25; hojaR(g, mh(), x0 * out, yp + potH - t * len, z0 * out, .045, .03, a + k * 1.3, .4, 'normal', rnd()); } }
      break; }
    case 'suculenta': for (let i = 0; i < 22; i++) { const a = i * 2.4, r = potR * .55 * Math.sqrt(i / 22); hojaR(g, mats[i % 6], Math.cos(a) * r * .4, y0 + .01 + (22 - i) * .0015, Math.sin(a) * r * .4, potR * (.35 + i / 50), potR * .2, a, .9 - i * .035, 'normal'); } break;
    case 'flor': {
      for (let i = 0; i < 10; i++) { const a = i * 2.4; hojaR(g, mh(), Math.cos(a) * potR * .2, y0 + .01, Math.sin(a) * potR * .2, potR * (.9 + rnd() * .4), potR * .5, a, .35 + rnd() * .4, 'normal'); }
      const pet = new THREE.MeshStandardMaterial({ color: o.flor || '#e7a3b8', roughness: .5, side: THREE.DoubleSide });
      for (let i = 0; i < 5; i++) { const a = rnd() * 6.28, r = rnd() * potR * .55, y = y0 + (top - y0) * (.65 + rnd() * .35), fx = Math.cos(a) * r, fz = Math.sin(a) * r; tubo(g, [[0, y0, 0], [fx * .5, (y0 + y) / 2, fz * .5], [fx, y, fz]], .003, tallo);
        for (let k = 0; k < 6; k++) hojaR(g, pet, fx, y, fz, potR * .35, potR * .3, k * 1.047, -.2, 'ancha'); const cen = new THREE.Mesh(new THREE.SphereGeometry(potR * .06, 8, 6), M('#e9c23a', { madera: false })); cen.position.set(fx, y + .005, fz); g.add(cen); }
      break; }
    case 'hierba': for (let i = 0; i < 36; i++) { const a = rnd() * 6.28, r = rnd() * potR * .6; hojaR(g, mh(), Math.cos(a) * r, y0, Math.sin(a) * r, (top - y0) * (.6 + rnd() * .4), .012, a, Math.PI / 2 - .15 - rnd() * .45, 'cinta'); } break;
    default: { const n = Math.round(45 + R * 60); for (let i = 0; i < n; i++) { const a = rnd() * 6.28, el = rnd(), rr = R * .85 * Math.sin(el * 1.4), y = y0 + (top - y0) * (.1 + .9 * Math.cos(el * 1.2) * rnd() * .3 + .6 * (1 - el));
        tubo(g, [[0, y0, 0], [Math.cos(a) * rr * .5, (y0 + y) / 2, Math.sin(a) * rr * .5], [Math.cos(a) * rr, y, Math.sin(a) * rr]], .0025, tallo); hojaR(g, mh(), Math.cos(a) * rr, y, Math.sin(a) * rr, .06 + R * .12, .04 + R * .07, a, .2 + rnd() * .5); } }
  }
}
// cristal de espejo: degradado frío con dos reflejos en diagonal (sugiere lo que refleja sin calcularlo)
let _esp = null;
function vidrioEspejo() {
  if (_esp) return _esp; const cv = document.createElement('canvas'); cv.width = cv.height = 256; const x = cv.getContext('2d');
  const gr = x.createLinearGradient(0, 0, 256, 256); gr.addColorStop(0, '#e9eff2'); gr.addColorStop(.5, '#b9c6cc'); gr.addColorStop(1, '#d5dee2'); x.fillStyle = gr; x.fillRect(0, 0, 256, 256);
  x.globalAlpha = .55; x.fillStyle = '#ffffff'; for (const [a, w] of [[60, 34], [120, 14]]) { x.beginPath(); x.moveTo(a, 0); x.lineTo(a + w, 0); x.lineTo(a + w - 256, 256); x.lineTo(a - 256, 256); x.fill(); }
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  _esp = new THREE.MeshStandardMaterial({ map: tx, metalness: .2, roughness: .06 }); return _esp;
}
// imágenes guardadas en base64: se decodifican con createImageBitmap, que no pasa por <img> (algunos visores, como los artefactos de Claude, bloquean las imágenes data:)
const texCache = new Map();
function texturaB64(b64, listo) {
  if (texCache.has(b64)) { const t = texCache.get(b64); if (t.image) listo(t); else t.userData.esperan.push(listo); return; }
  const t = new THREE.Texture(); t.userData.esperan = [listo]; texCache.set(b64, t);
  const bin = Uint8Array.from(atob(b64), c => c.charCodeAt(0));
  createImageBitmap(new Blob([bin], { type: 'image/jpeg' }), { imageOrientation: 'flipY' }).then(img => {
    t.image = img; t.flipY = false; t.needsUpdate = true; t.userData.esperan.forEach(f => f(t)); t.userData.esperan = [];
  }).catch(() => {});
}
function armario(g, W, D, H, c, o) {
  const m = M(c), puertaM = o.colorPuerta ? M(o.colorPuerta) : m, metal = METAL('#9a9a9a');
  caja(g, W, H, D - .02, m, 0, 0, -.01);
  const n = o.puertas ?? Math.max(1, Math.round(W / .5)), pw = W / n;
  for (let i = 0; i < n; i++) {
    const x = -W / 2 + (i + .5) * pw;
    if (o.vitrina) { const dh = H * .62; caja(g, pw - .01, H - dh - .1, .02, puertaM, x, .08, D / 2 - .02); tirador(g, 'pomo', x, .08 + (H - dh - .1) / 2, D / 2, metal); rcaja(g, pw - .01, dh - .02, .02, .004, puertaM, x, H - dh, D / 2 - .02); caja(g, pw - .09, dh - .1, .006, VIDRIO(), x, H - dh + .04, D / 2 - .005); }
    else { caja(g, pw - .006, H - .02, .02, puertaM, x, .01, D / 2 - .02); tirador(g, o.tirador || 'barra', x + (i % 2 ? -1 : 1) * (pw / 2 - .05), H * .5, D / 2, metal, .3); }
  }
}
function muebleTV(g, W, D, H, c, o) {
  const m = M(c), dark = M(new THREE.Color(c).multiplyScalar(.82).getStyle()), metal = METAL('#555');
  switch (o.t) {
    case 'besta': { // banco bajo + muebles de pared y baldas
      const bh = H > 1 ? Math.min(.48, H * .32) : H - .02; caja(g, W, bh, D, m, 0, .02, 0); caja(g, W - .04, .02, D - .04, dark, 0, 0, 0);
      const n = Math.round(W / .6); for (let i = 0; i < n; i++) caja(g, W / n - .006, bh - .01, .018, m, -W / 2 + (i + .5) * W / n, .025, D / 2 - .009);
      const wh = Math.min(.64, H - bh - .55); if (wh > .2) for (const s of [-1, 1]) caja(g, .6, wh, D * .9, m, s * (W / 2 - .3), H - wh, -.02);
      if (o.baldas) for (let i = 0; i < 2; i++) caja(g, W * .4, .03, .2, m, 0, bh + .5 + i * .35, -D / 2 + .1);
      break;
    }
    case 'patas': { patas(g, W - .02, D - .02, .12, M(o.colorPatas || c), 'cuadrada', .06); caja(g, W, H - .12, D, m, 0, .12, 0); const n = 3; for (let i = 0; i < n; i++) { const x = -W / 2 + (i + .5) * W / n; caja(g, W / n - .01, H - .14, .018, i === 1 ? dark : m, x, .13, D / 2 - .009); if (i !== 1) tirador(g, 'barra', x, H * .6, D / 2, metal, .1); } break; }
    case 'abierto': { caja(g, W, .03, D, m, 0, H - .03, 0); caja(g, W, .02, D, m, 0, .04, 0); for (const s of [-1, 1, 0]) caja(g, .02, H - .04, D, m, s * (W / 2 - .01), .04, 0); for (const sx of [-1, 1]) for (const sz of [-1, 1]) caja(g, .03, .04, .03, m, sx * (W / 2 - .03), 0, sz * (D / 2 - .03)); break; }
    case 'brimnes': default: {
      caja(g, W, H - .02, D, m, 0, .02, 0); caja(g, W - .04, .02, D - .04, dark, 0, 0, 0);
      const n = 3, cw = W / n;
      for (let i = 0; i < n; i++) { const x = -W / 2 + (i + .5) * cw; if (i === 1) { caja(g, cw - .03, (H - .06) / 2, D - .03, dark, x, .04, .02); caja(g, cw - .03, .015, D - .04, m, x, .04 + (H - .06) / 2, .01); } else { caja(g, cw - .01, H - .05, .018, m, x, .03, D / 2 - .009); tirador(g, 'pomo', x + (i ? -1 : 1) * (cw / 2 - .05), H * .55, D / 2, M('#cfcfcf', { madera: false })); } }
    }
  }
}
function escritorio(g, W, D, H, c, o) {
  const m = M(c), metal = METAL('#9a9a9a');
  rcaja(g, W, .03, D, .006, m, 0, H - .03, 0);
  if (o.t === 'tocador') { caja(g, W - .02, .14, D - .02, m, 0, H - .17, 0); tirador(g, 'ranura', 0, H - .1, D / 2, m, W * .3); patas(g, W, D, H - .17, m, 'cuadrada', .025); return; }
  // MICKE: cajonera a la derecha, panel lateral a la izquierda y pasacables
  caja(g, .02, H - .03, D, m, -W / 2 + .01, 0, 0); caja(g, .35, H - .03, D - .02, m, W / 2 - .175, 0, 0);
  for (let i = 0; i < 2; i++) { caja(g, .33, (H - .06) / 2 - .01, .015, m, W / 2 - .175, .02 + i * (H - .05) / 2, D / 2 - .007); tirador(g, 'ranura', W / 2 - .175, .02 + (i + .7) * (H - .05) / 2, D / 2, m, .14); }
  caja(g, W - .37, .25, .015, m, -.17, H - .3, -D / 2 + .05);
  cil(g, .025, .025, .005, M('#2a2a2a', { madera: false }), -W / 2 + .15, H, -D / 2 + .08);
}

// ---------- entrada principal ----------
export function construir(p, acabado) {
  const st = p.estilo || ESTILOS[p.id] || ESTILO_TIPO[p.kind]; if (!st) return null;
  const W = p.w / 100, D = p.d / 100, H = p.h / 100, g = new THREE.Group();
  const nombre = acabado?.name || '';
  let [c1, c2] = nombre.split('/').map(s => colorDe(s.trim(), null));
  // el color real, sacado de la foto del producto, manda sobre el que se deduce del nombre
  const cf = acabado?.colorFoto; if (cf) { c1 = cf; if (c2 && acabado.colorFoto2) c2 = acabado.colorFoto2; }
  const o = { ...st }; if (p.forma) o.forma = p.forma;
  if (/puertas/i.test(nombre)) o.puertas = true;
  let c = st.color || c1 || acabado?.color || '#b8b2a6';
  // tapizados: la tela es el último color del nombre; la madera/metal, el primero
  const segs = nombre.split('/').map(x => colorDe(x.trim(), null)).filter(Boolean), ult = segs[segs.length - 1];
  let cc = null;
  if ((st.f === 'sofa' || st.f === 'sillon' || (st.f === 'cama' && st.t === 'tapizada')) && ult) { cc = ult; if (segs.length > 1 && !o.colorMadera) o.colorMadera = segs[0]; }
  if (st.f === 'silla' && segs.length > 1 && (o.asiento === 'tapizado' || o.colorTela)) o.colorTela = ult;
  if (/\/madera$/i.test(nombre)) { o.patas = 'conica'; o.colorPatas = '#9a6b45'; } else if (/\/metal$/i.test(nombre)) { o.patas = 'metal'; o.colorPatas = '#2b2b2b'; }
  if (cc && !cf) c = cc;
  if (c2 && !o.color2) o.color2 = c2;
  if (c2 && !o.colorPatas && /negro|metal|cromado|blanco/.test(nombre.split('/')[1] || '')) o.colorPatas = c2;
  switch (st.f) {
    case 'sofa': sofa(g, W, D, H, c, o); break;
    case 'sillon': sillon(g, W, D, H, c, o); break;
    case 'mesa': mesa(g, W, D, H, o.colorTablero || c, o); break;
    case 'mesaCaja': mesaCaja(g, W, D, H, c, o); break;
    case 'silla': silla(g, W, D, H, c, o); break;
    case 'cama': cama(g, W, D, H, c, o); break;
    case 'comoda': comoda(g, W, D, H, c, o); break;
    case 'libreria': libreria(g, W, D, H, c, o); break;
    case 'armario': armario(g, W, D, H, c, o); break;
    case 'tv': muebleTV(g, W, D, H, c, o); break;
    case 'escritorio': escritorio(g, W, D, H, c, o); break;
    case 'balda': rcaja(g, W, H, D, .004, M(c), 0, 0, 0); break;
    case 'lampara': lampara(g, W, D, H, c, o); break;
    case 'combi': combinacion(g, W, D, H, c, o); break;
    case 'planta': planta(g, W, D, H, c, { ...o, semilla: p.id }); break;
    case 'cuadro': {
      const marco = M(o.lienzo ? '#efece6' : c, { madera: /roble|abedul|haya|pino|nogal/.test(nombre) }), fw = o.lienzo ? .004 : Math.min(.03, W * .06);
      if (!o.lienzo) rcaja(g, W, H, D, .003, marco, 0, 0, 0); else caja(g, W, H, D, marco, 0, 0, 0);
      const mat = new THREE.MeshStandardMaterial({ color: '#d9d4c8', roughness: .85 }), cara = new THREE.Mesh(new THREE.PlaneGeometry(W - 2 * fw, H - 2 * fw), mat);
      cara.position.set(0, H / 2, D / 2 + .0015); g.add(cara);
      // la obra: miniatura guardada de IKEA (fotos_cuadros.js); si es un marco vacío o no hay foto, una lámina generada
      const idFoto = (acabado?.img || '').split('/').pop().replace(/_s\d\.jpg.*/, ''), b64 = (window.FOTOS_CUADROS || {})[idFoto];
      const usar = tx => { tx.colorSpace = THREE.SRGBColorSpace; mat.map = tx; mat.color.set('#ffffff'); mat.needsUpdate = true; };
      if (b64) texturaB64(b64, usar);
      else usar(new THREE.CanvasTexture(laminaGenerada(nombre + (acabado?.url || ''), W / H)));
      break; }
    case 'perchero': { const m = M(c); cil(g, .17, .19, .03, m, 0, 0, 0, 24); cil(g, .015, .015, H - .03, m, 0, .03, 0, 10); for (let i = 0; i < 4; i++) { const a = i * Math.PI / 2; barra(g, [0, H - .2, 0], [Math.cos(a) * .2, H - .08, Math.sin(a) * .2], .01, m); } break; }
    case 'puf': { const t = M(c, { tela: true }); if (o.redondo) { const k = cil(g, .5, .5, H, t, 0, 0, 0, 36); k.scale.set(W, 1, D); } else rcaja(g, W, H, D, Math.min(.08, H / 3), t, 0, 0, 0, 4); break; }
    case 'alfombra': {
      const idF = (acabado?.img || '').split('/').pop().replace(/_s\d\.jpg.*/, ''), b64 = (window.FOTOS_ALFOMBRAS || {})[idF];
      const mat = b64 ? new THREE.MeshStandardMaterial({ color: '#ffffff', roughness: 1 }) : M(c, { tela: true });
      if (b64) texturaB64(b64, tx => { tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 4; mat.map = tx; mat.needsUpdate = true; });
      if (o.redondo) { const k = cil(g, .5, .5, .012, mat, 0, 0, 0, 48); k.scale.set(W, 1, D); }
      else { caja(g, W, .011, D, M(c, { tela: true }), 0, 0, 0); const k = new THREE.Mesh(new THREE.PlaneGeometry(W, D), mat); k.rotation.x = -Math.PI / 2; k.position.y = .0115; k.receiveShadow = true; g.add(k); }
      if (/pelo largo/.test(nombre + (p.name || ''))) { const fl = M(c, { tela: true }); fl.transparent = true; fl.opacity = .35; const k = caja(g, W - .01, .02, D - .01, fl, 0, .01, 0); }
      break; }
    case 'espejo': if (o.redondo || Math.abs(W - H) < .01 && /redond/.test(nombre)) { const fr = cil(g, .5, .5, .03, M(o.color2 || c), 0, 0, 0, 48); fr.scale.set(W, 1, H); fr.rotation.x = Math.PI / 2; fr.position.set(0, H / 2, -D / 2 + .015); const e = new THREE.Mesh(new THREE.CircleGeometry(.5, 48), vidrioEspejo()); e.scale.set(W - .04, H - .04, 1); e.position.set(0, H / 2, -D / 2 + .031); g.add(e); break; }
    { rcaja(g, W, H, .03, .01, M(o.color2 || c), 0, 0, -D / 2 + .015); const e = new THREE.Mesh(new THREE.PlaneGeometry(W - .06, H - .06), vidrioEspejo()); e.position.set(0, H / 2, -D / 2 + .031); g.add(e); break; }
    case 'cortina': cortina(g, W, D, H, c, o); break;
    case 'estor': estor(g, W, D, H, c, o); break;
    case 'radiador': radiador(g, W, D, H, c, o); break;
    case 'guitarra': guitarra(g, W, D, H, c, o); break;
    default: return null;
  }
  g.userData.size = { W, D, H };
  return g;
}

// Estilo por defecto según el tipo (muebles propios del usuario)
const ESTILO_TIPO = {
  sofa: { f: 'sofa' }, armchair: { f: 'sillon', t: 'butaca' }, bed: { f: 'cama', t: 'tablero', base: .32 }, table: { f: 'mesa', patas: 'cuadrada' }, desk: { f: 'escritorio' },
  chair: { f: 'silla', respaldo: 'aro' }, shelf: { f: 'libreria' }, wardrobe: { f: 'armario' }, dresser: { f: 'comoda', filas: 3 }, tvunit: { f: 'tv' }, box: { f: 'comoda', filas: 2 }, wallshelf: { f: 'balda' }
};

// Estilo de cada producto según su ficha de IKEA
const ESTILOS = {
  // sofás
  kivik3: { f: 'sofa', brazos: 'bloque', brazoW: .16, brazoH: .6, patas: 'taco', legH: .06, respaldo: 'cojines' },
  kivik3ch: { f: 'sofa', brazos: 'bloque', brazoW: .16, brazoH: .6, patas: 'taco', legH: .06, respaldo: 'cojines', fondo: .95 },
  hyltarp3: { f: 'sofa', brazos: 'redondo', brazoW: .2, brazoH: .66, patas: 'conica', legH: .12, respaldo: 'cojines' },
  valnas3: { f: 'sofa', brazos: 'redondo', brazoW: .22, brazoH: .64, patas: 'conica', colorPatas: '#b08d4f', legH: .12, respaldo: 'fijo', plazas: 3 },
  malmkoping3: { f: 'sofa', brazos: 'redondo', brazoW: .18, brazoH: .6, patas: 'oculta', respaldo: 'cojines', fondo: .95 },
  saltmyran3: { f: 'sofa', brazos: 'redondo', brazoW: .2, brazoH: .62, patas: 'conica', legH: .12, respaldo: 'fijo' },
  glostad3: { f: 'sofa', brazos: 'fino', brazoW: .12, brazoH: .58, patas: 'taco', legH: .05, respaldo: 'fijo', seatH: .42, recto: true },
  glostad2: { f: 'sofa', brazos: 'fino', brazoW: .12, brazoH: .58, patas: 'taco', legH: .05, respaldo: 'fijo', seatH: .42, recto: true, plazas: 2 },
  glostad3ch: { f: 'sofa', brazos: 'fino', brazoW: .12, brazoH: .58, patas: 'taco', legH: .05, respaldo: 'fijo', seatH: .42, recto: true, fondo: .8 },
  mannarp3: { f: 'sofa', brazos: 'fino', brazoW: .12, brazoH: .62, patas: 'metal', legH: .14, respaldo: 'cojines', seatH: .46 },
  gullvalla3: { f: 'sofa', brazos: 'redondo', brazoW: .22, brazoH: .62, patas: 'conica', legH: .1, respaldo: 'fijo' },
  saltsjo3: { f: 'sofa', brazos: 'fino', brazoW: .1, brazoH: .6, patas: 'conica', legH: .17, respaldo: 'cojines' },
  saltsjo3ch: { f: 'sofa', brazos: 'fino', brazoW: .1, brazoH: .6, patas: 'conica', legH: .17, respaldo: 'cojines', fondo: .9 },
  vimle3: { f: 'sofa', brazos: 'bloque', brazoW: .15, brazoH: .63, patas: 'taco', legH: .04, respaldo: 'cojines', fondo: .98 },
  vimle3p: { f: 'sofa', brazos: 'bloque', brazoW: .15, brazoH: .63, patas: 'taco', legH: .04, respaldo: 'cojines', fondo: .98 },
  landskrona3: { f: 'sofa', brazos: 'fino', brazoW: .1, brazoH: .62, patas: 'metal', legH: .16, respaldo: 'cojines', seatH: .45 },
  friheten: { f: 'sofa', brazos: 'no', patas: 'oculta', respaldo: 'cojines', seatH: .44, fondo: .88 },
  alvdalen: { f: 'sofa', brazos: 'bloque', brazoW: .13, brazoH: .58, patas: 'taco', legH: .05, respaldo: 'cojines', recto: true },
  grunnarp: { f: 'sofa', brazos: 'bloque', brazoW: .16, brazoH: .6, patas: 'conica', legH: .1, respaldo: 'cojines' },
  // sillones
  poang: { f: 'sillon', t: 'poang', colorMadera: '#dcc39c' },
  ekenaset: { f: 'sillon', t: 'brazosMadera', colorMadera: '#c49a66' },
  arsunda: { f: 'sillon', t: 'poang' },
  herrakra: { f: 'sillon', t: 'concha' },
  strandmon: { f: 'sillon', t: 'orejero' },
  muren: { f: 'sillon', t: 'relax' }, ekolsund: { f: 'sillon', t: 'relax' },
  ektorpS: { f: 'sillon', t: 'butaca', patas: 'oculta', brazoH: .66 },
  tullsta: { f: 'sillon', t: 'butaca', brazoH: .6 },
  dyvlinge: { f: 'sillon', t: 'giratorio' },
  // mesas de centro y auxiliares
  lackAux: { f: 'mesa', patas: 'cuadrada', grosor: .05, balda: true },
  vittsjo: { f: 'mesa', forma: 'redonda', vidrio: true, patas: 'aro', colorPatas: '#2b2724', balda: true, grosor: .01 },
  ostavall: { f: 'mesaCaja', t: 'elevable' },
  tarseleC: { f: 'mesa', patas: 'metal', colorPatas: '#2b2724', grosor: .03, balda: true },
  hol: { f: 'mesaCaja', t: 'listones' },
  tranered: { f: 'mesa', patas: 'metal', colorPatas: '#2b2724', grosor: .02, balda: true },
  idanas80: { f: 'mesa', patas: 'cuadrada', grosor: .03, cajon: true, balda: true },
  idanas107: { f: 'mesa', patas: 'cuadrada', grosor: .03, cajon: true, balda: true },
  frotorp: { f: 'mesa', forma: 'redonda', patas: 'aro', colorPatas: '#2b2724', grosor: .02 },
  tingby: { f: 'mesa', patas: 'panel', grosor: .02, balda: true, ruedas: true },
  gladom: { f: 'mesa', forma: 'redonda', patas: 'metal', bandeja: true, grosor: .01 },
  // mesas de comedor y escritorio
  lisaboMesa: { f: 'mesa', patas: 'inclinada', grosor: .025 },
  skalstaM: { f: 'mesa', patas: 'u', colorPatas: '#2f3133', grosor: .025 },
  tarseleM: { f: 'mesa', patas: 'metal', colorPatas: '#2b2724', grosor: .03 },
  alhult: { f: 'mesa', patas: 'conica', grosor: .03 },
  tonstadM: { f: 'mesa', patas: 'cuadrada', grosor: .035 },
  gaperhult: { f: 'mesa', forma: 'oval', patas: 'conica', colorPatas: '#f2f1ec', grosor: .03 },
  haugaAb: { f: 'mesa', patas: 'cuadrada', grosor: .025 },
  vihals74: { f: 'mesa', patas: 'metal', colorPatas: '#f2f1ec', grosor: .025 },
  vihals107: { f: 'mesa', forma: 'redonda', patas: 'metal', colorPatas: '#f2f1ec', grosor: .025 },
  norrmjole: { f: 'mesa', forma: 'oval', patas: 'inclinada', colorPatas: '#d6c9b1', grosor: .03 },
  skogsta: { f: 'mesa', patas: 'caballete', colorPatas: '#2b2724', grosor: .05 },
  pinntorpM: { f: 'mesa', patas: 'cuadrada', grosor: .035 },
  sandsbergM: { f: 'mesa', patas: 'metal', colorPatas: '#2b2724', grosor: .02 },
  docksta: { f: 'mesa', forma: 'redonda', patas: 'tulipa', grosor: .025 },
  micke: { f: 'escritorio' }, malmToc: { f: 'escritorio', t: 'tocador' }, brimnesToc: { f: 'escritorio', t: 'tocador' },
  // sillas
  hauga: { f: 'silla', respaldo: 'escalera' },
  pinntorp: { f: 'silla', respaldo: 'listones' },
  sandsberg: { f: 'silla', patas: 'metal', asiento: 'plastico', respaldo: 'carcasa' },
  kattil: { f: 'silla', asiento: 'tapizado', respaldo: 'tapizado', colorTela: '#c9c8c3' },
  bergmund: { f: 'silla', asiento: 'tapizado', respaldo: 'tapizado' },
  tonstadS: { f: 'silla', asiento: 'tapizado', respaldo: 'escalera', colorTela: '#d6c9b1' },
  skalsta: { f: 'silla', patas: 'metal', respaldo: 'carcasa', color2: '#2b2724' },
  teodores: { f: 'silla', patas: 'metal', asiento: 'plastico', respaldo: 'carcasa', color2: '#f2f1ec' },
  tobias: { f: 'silla', patas: 'trineo', asiento: 'plastico', respaldo: 'carcasa', color2: '#c9ccd0' },
  stockholmS: { f: 'silla', patas: 'conica', asiento: 'redondo', respaldo: 'curvo', colorTela: '#b07a55' },
  tossberg: { f: 'silla', patas: 'metal', asiento: 'tapizado', respaldo: 'tapizado', color2: '#2b2724', colorTela: '#2b2724' },
  lisaboSilla: { f: 'silla', respaldo: 'aro', patas: 'conica' },
  // camas
  malm160: { f: 'cama', t: 'tablero', base: .38, cabeceroT: .08 },
  idanasCan: { f: 'cama', t: 'tapizada', base: .42, cabeceroT: .12 },
  mandal: { f: 'cama', t: 'tablero', base: .3, cabeceroT: .2, cajones: 4 },
  nordli: { f: 'cama', t: 'tablero', base: .38, cabeceroT: .08, cajones: 6 },
  tarva: { f: 'cama', t: 'pino', base: .3, cabeceroT: .07, patas: 0 },
  tjalle: { f: 'cama', t: 'tapizada', base: .42, cabeceroT: .12 },
  malmCan: { f: 'cama', t: 'tablero', base: .4, cabeceroT: .08 },
  malm4: { f: 'cama', t: 'tablero', base: .38, cabeceroT: .08, cajones: 4 },
  vihals4: { f: 'cama', t: 'tablero', base: .35, cabeceroT: .08, cajones: 4 },
  vevelstad: { f: 'cama', t: 'metal' }, leirvik: { f: 'cama', t: 'metal' },
  tarnkullen: { f: 'cama', t: 'tapizada', base: .34, cabeceroT: .1, patas: .1, colorPatas: '#c49a66' },
  gladstad: { f: 'cama', t: 'tapizada', base: .36, cabeceroT: .1, capiton: true },
  tonstadB: { f: 'cama', t: 'tablero', base: .3, cabeceroT: .06, patas: .14, colorPatas: '#c49a66' },
  songesand: { f: 'cama', t: 'tablero', base: .36, cabeceroT: .08, pie: .45, cajones: 2 },
  // cómodas y mesitas
  lillberget3: { f: 'comoda', filas: 3, tirador: 'ranura', patas: .08, tipoPatas: 'conica', colorPatas: '#c49a66' },
  ankarudden6: { f: 'comoda', filas: 3, cols: 2, tirador: 'barra', zocalo: .06 },
  hemnes3: { f: 'comoda', filas: 3, tirador: 'pomo2', zocalo: .08, tapa: true },
  hemnes6: { f: 'comoda', filas: 4, arriba: 3, tirador: 'pomo2', zocalo: .08, tapa: true },
  malm2: { f: 'comoda', filas: 2, tirador: 'ninguno', zocalo: .02 },
  hemnes2: { f: 'comoda', filas: 2, tirador: 'pomo', patas: .12, tapa: true },
  nordli2: { f: 'comoda', filas: 2, tirador: 'ranura', zocalo: .03 },
  hemnesMes: { f: 'comoda', filas: 1, tirador: 'pomo', patas: .35, tapa: true, colorTapa: '#c49a66' },
  // librerías, armarios y vitrinas
  kallax147: { f: 'libreria', t: 'kallax' }, kallax77: { f: 'libreria', t: 'kallax' },
  billy202: { f: 'libreria', libros: true }, billy106: { f: 'libreria', libros: true },
  pax150: { f: 'armario', puertas: 3 },
  hemnesVit: { f: 'armario', vitrina: true, puertas: 2 },
  // muebles de TV
  lackTV: { f: 'tv', t: 'abierto' }, brimnesTV: { f: 'tv', t: 'brimnes' }, tonstadTV: { f: 'tv', t: 'patas' },
  bestaLack: { f: 'tv', t: 'besta', baldas: true }, besta180: { f: 'tv', t: 'besta' },
  // baldas
  lackCentro: { f: 'mesa', patas: 'cuadrada', grosor: .05, balda: true },
  jattebo3: { f: 'sofa', brazos: 'bloque', brazoW: .2, brazoH: .55, patas: 'oculta', respaldo: 'bloque', seatH: .44, recto: true },
  lauters: { f: 'lampara', t: 'tripode', colorPie: '#d8c3a0', sh: .3 },
  tagarp: { f: 'lampara', t: 'indirecta', metal: 'negro' },
  rodflikP: { f: 'lampara', t: 'lectura', metal: 'latón' },
  strandad: { f: 'lampara', t: 'papel', metal: 'negro' },
  barlastP: { f: 'lampara', t: 'clasica', metal: 'negro', sh: .3 },
  ringstaP: { f: 'lampara', t: 'clasica', metal: 'latón', sh: .3 },
  okensand: { f: 'lampara', t: 'tripode', colorPie: '#a8734a', sh: .32 },
  flyghojd: { f: 'lampara', t: 'conica', metal: 'latón', pantalla: '#8f9a8a' },
  simrishamnP: { f: 'lampara', t: 'globos', metal: 'cromado', op: .92 },
  skottorp: { f: 'lampara', t: 'arco', metal: 'negro', pantalla: '#d8d6d0' },
  stockholmP: { f: 'lampara', t: 'clasica', metal: 'latón', sh: .34 },
  kinnahult: { f: 'lampara', t: 'clasica', colorPie: '#d8c3a0', sh: .3 },
  arstidP: { f: 'lampara', t: 'clasica', metal: 'latón', sh: .3 },
  vidja: { f: 'lampara', t: 'papel', metal: 'blanco' },
  akterspringP: { f: 'lampara', t: 'globo', metal: 'latón', op: .95 },
  storsegel: { f: 'lampara', t: 'tripode', colorPie: '#d8c3a0', sh: .16 },
  blidvader: { f: 'lampara', t: 'ceramica', colorPie: '#e6e0d2', pantalla: '#d8ccb6' },
  fado: { f: 'lampara', t: 'globo', mesa: true, metal: 'blanco', op: .95 },
  arstidM: { f: 'lampara', t: 'clasica', mesa: true, metal: 'latón', sh: .2 },
  ringstaM: { f: 'lampara', t: 'clasica', mesa: true, metal: 'latón', sh: .18 },
  lampan: { f: 'lampara', t: 'conica', mesa: true, colorPie: '#f2f1ec' },
  navlinge: { f: 'lampara', t: 'trabajo', metal: 'blanco' },
  saxhyttan: { f: 'lampara', t: 'cilindro', metal: 'negro', pantalla: '#d8ccb6' },
  stockholmM: { f: 'lampara', t: 'clasica', mesa: true, metal: 'latón', sh: .24 },
  halgatt: { f: 'lampara', t: 'ceramica', colorPie: '#7a5a3c', pantalla: '#d6c9b1' },
  vindkast: { f: 'lampara', techo: true, t: 'esfera', sh: .5 },
  gullsudare: { f: 'lampara', techo: true, t: 'esfera', sh: .45 },
  skurup: { f: 'lampara', techo: true, t: 'cupula', opaca: true, sh: .22 },
  sinnerlig: { f: 'lampara', techo: true, t: 'bambu', sh: .3 },
  kappeland: { f: 'lampara', techo: true, t: 'ratan', color: '#c9a874', sh: .25 },
  trubbrufse: { f: 'lampara', techo: true, t: 'ratan', sh: .2 },
  nymane: { f: 'lampara', techo: true, t: 'focos', sh: .2 },
  akterspringT: { f: 'lampara', techo: true, t: 'globos3', metal: 'latón', sh: .4, op: .95 },
  hogvind: { f: 'lampara', techo: true, t: 'globos3', metal: 'cromado', sh: .35, op: .8 },
  spegelrocka: { f: 'lampara', techo: true, t: 'tambor', sh: .25 },
  bunkeflo: { f: 'lampara', techo: true, t: 'cupula', opaca: true, tapa: '#dcc39c', sh: .2 },
  lackBalda110: { f: 'balda' }, lackBalda30: { f: 'balda' }, lackBalda190: { f: 'balda' },
};
export const TIENE_ESTILO = id => !!ESTILOS[id];
export const estiloDe = id => ESTILOS[id];

// ---------- LÁMPARAS ----------
// Las pantallas usan un material con emisión que se enciende en modo noche (userData.pantalla).
const pantallas = new Map();
function PANT(color, o = {}) {
  const k = color + JSON.stringify(o); if (pantallas.has(k)) return pantallas.get(k);
  const m = new THREE.MeshStandardMaterial({ color, roughness: .9, emissive: '#ffcf8a', emissiveIntensity: 0, side: THREE.DoubleSide, transparent: !!o.op, opacity: o.op || 1 });
  m.userData.pantalla = true; pantallas.set(k, m); return m;
}
export function encenderLamparas(on) { for (const m of pantallas.values()) m.emissiveIntensity = on ? 1.4 : 0; }
function cono(g, rTop, rBot, h, m, x, y, z, abierto = true, seg = 32) { const o = sombra(new THREE.Mesh(new THREE.CylinderGeometry(rTop, rBot, h, seg, 1, abierto), m)); o.position.set(x, y + h / 2, z); g.add(o); return o; }
function esfera(g, r, m, x, y, z) { const o = sombra(new THREE.Mesh(new THREE.SphereGeometry(r, 28, 18), m)); o.position.set(x, y, z); g.add(o); return o; }
function lampara(g, W, D, H, c, o) {
  const met = o.metal ? METAL(colorDe(o.metal)) : M(o.colorPie || c), pant = PANT(o.pantalla || '#f3efe6', { op: o.op }), R = Math.min(W, D) / 2;
  const luz = (x, y, z) => { const p = new THREE.Object3D(); p.position.set(x, y, z); p.userData.luz = true; g.add(p); };
  if (o.techo) { // colgantes y plafones: el origen sigue en la base del volumen; el techo queda en y = H
    const sh = o.sh ?? .3;
    if (o.t !== 'plafon' && o.t !== 'focos') { cil(g, .045, .045, .025, met, 0, H - .025, 0); cil(g, .003, .003, H - sh - .02, M('#222', { madera: false }), 0, sh, 0, 6); }
    switch (o.t) {
      case 'esfera': esfera(g, R, pant, 0, R, 0); break;
      case 'cupula': { const pts = []; for (let i = 0; i <= 12; i++) { const a = i / 12 * Math.PI / 2; pts.push(new THREE.Vector2(Math.sin(a) * R + .002, Math.cos(a) * sh)); } const d = sombra(new THREE.Mesh(new THREE.LatheGeometry(pts, 36), o.opaca ? M(c, { madera: false, metalness: .3, roughness: .5 }) : pant)); d.material.side = THREE.DoubleSide; g.add(d); if (o.tapa) cil(g, .07, .07, .03, M(o.tapa), 0, sh - .01, 0); break; }
      case 'cono': cono(g, .04, R, sh, o.opaca ? M(c, { madera: false, metalness: .3, roughness: .5 }) : pant, 0, 0, 0); break;
      case 'tambor': cono(g, R, R, sh, pant, 0, 0, 0); break;
      case 'bambu': for (let i = 0; i < 5; i++) cono(g, R * (.5 + i * .1), R * (.6 + i * .1), sh / 6, M(c), 0, i * sh / 6, 0); break;
      case 'ratan': { const k = cono(g, R * .45, R, sh, M(c, { madera: true }), 0, 0, 0); for (let i = 0; i < 5; i++) { const t = new THREE.Mesh(new THREE.TorusGeometry(R * (.5 + i * .12), .005, 6, 40), M(new THREE.Color(c).multiplyScalar(.8).getStyle())); t.rotation.x = Math.PI / 2; t.position.y = sh * (1 - (i + 1) / 6); g.add(t); } break; }
      case 'globos3': for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3, x = Math.cos(a) * R * .6, z = Math.sin(a) * R * .6; barra(g, [0, sh + .05, 0], [x, sh * .55, z], .006, met); esfera(g, Math.min(.09, R * .35), pant, x, sh * .4, z); luz(x, sh * .4, z); } return;
      case 'focos': caja(g, W, .03, .04, met, 0, H - .03, 0); for (let i = 0; i < 4; i++) { const x = -W / 2 + .06 + i * (W - .12) / 3; barra(g, [x, H - .03, 0], [x, H - .08, 0], .006, met); const f = cono(g, .03, .035, .1, met, x, H - .17, 0, false); f.rotation.x = .4; } luz(0, H - .2, 0); return;
      case 'plafon': default: { const k = esfera(g, R, pant, 0, H, 0); k.scale.y = .35; }
    }
    luz(0, sh * .4, 0); return;
  }
  const base = (rb, h = .03) => cil(g, rb, rb, h, met, 0, 0, 0, 32);
  switch (o.t) {
    case 'tripode': { const top = H - (o.sh ?? .3); for (let i = 0; i < 3; i++) { const a = i * Math.PI * 2 / 3; barra(g, [Math.cos(a) * R * .75, 0, Math.sin(a) * R * .75], [0, top, 0], .012, M(o.colorPie || '#d8c3a0', { madera: true })); } cono(g, R * .8, R * .9, o.sh ?? .3, pant, 0, top - .05, 0); luz(0, top + .1, 0); break; }
    case 'indirecta': base(.14, .04); cil(g, .01, .01, H - .12, met, 0, .04, 0, 8); cono(g, R, R * .35, .12, pant, 0, H - .12, 0, false); luz(0, H - .1, 0); break;
    case 'lectura': { base(.13); cil(g, .01, .01, H - .25, met, 0, .03, 0, 8); tubo(g, [[0, H - .22, 0], [0, H - .05, .05], [0, H - .04, D - R - .1], [0, H - .1, D - R - .05]], .01, met); const d = cono(g, .04, .1, .12, M(c, { madera: false, metalness: .3, roughness: .5 }), 0, H - .24, D - R - .05, false); luz(0, H - .26, D - R - .05); g.children.forEach(m => m.position.z -= (D / 2 - R)); break; }
    case 'arco': { const b = rcaja(g, .3, .05, .3, .02, M('#2b2b2b', { madera: false, metalness: .4 }), 0, 0, -D / 2 + .15); tubo(g, [[0, .05, -D / 2 + .15], [0, H * .7, -D / 2 + .2], [0, H, 0], [0, H - .15, D / 2 - .25]], .012, met); cono(g, .12, .22, .2, pant, 0, H - .42, D / 2 - .25); luz(0, H - .4, D / 2 - .25); break; }
    case 'globos': base(.15); cil(g, .012, .012, H - .1, met, 0, .03, 0, 8); for (let i = 0; i < 3; i++) { const y = H * (.55 + i * .15), a = i * 2.1; barra(g, [0, y, 0], [Math.cos(a) * .12, y, Math.sin(a) * .12], .006, met); esfera(g, .08, pant, Math.cos(a) * .14, y - .02, Math.sin(a) * .14); luz(Math.cos(a) * .14, y, Math.sin(a) * .14); } break;
    case 'globo': base(o.mesa ? R * .6 : .13, .03); cil(g, .01, .01, H - 2 * R, met, 0, .03, 0, 8); esfera(g, R, pant, 0, H - R, 0); luz(0, H - R, 0); break;
    case 'papel': base(R * .9, .03); cil(g, R, R, H - .06, pant, 0, .05, 0, 32); luz(0, H / 2, 0); break;
    case 'conica': base(R * .55); cil(g, .01, .01, H - .25, met, 0, .03, 0, 8); cono(g, R * .45, R, .25, pant, 0, H - .25, 0); luz(0, H - .15, 0); break;
    case 'ceramica': { const pts = [new THREE.Vector2(.05, 0), new THREE.Vector2(R * .45, .04), new THREE.Vector2(R * .5, H * .25), new THREE.Vector2(R * .3, H * .48), new THREE.Vector2(.02, H * .5)]; g.add(sombra(new THREE.Mesh(new THREE.LatheGeometry(pts, 32), M(o.colorPie || c, { madera: false, roughness: .4 })))); cil(g, .008, .008, H * .15, METAL('#b08d4f'), 0, H * .5, 0, 8); cono(g, R * .8, R, H * .42, pant, 0, H * .58, 0); luz(0, H * .75, 0); break; }
    case 'cilindro': base(R * .7, .02); cil(g, .006, .006, H * .2, met, 0, .02, 0, 6); cono(g, R, R, H * .8, pant, 0, H * .2, 0); luz(0, H * .6, 0); break;
    case 'trabajo': { base(.07, .02); tubo(g, [[0, .02, 0], [0, H * .7, -.02], [0, H, .08], [0, H - .03, .18]], .008, met); const d = cono(g, .02, .05, .07, M(c, { madera: false, roughness: .4 }), 0, H - .1, .18, false); luz(0, H - .12, .18); break; }
    case 'clasica': default: { const sh = o.sh ?? Math.min(.35, H * .3); base(o.mesa ? R * .55 : .15); cil(g, .01, .01, H - sh * .7, met, 0, .03, 0, 8); cono(g, R * .85, R, sh, pant, 0, H - sh, 0); luz(0, H - sh * .5, 0); }
  }
}


// ---------- textiles de ventana, radiadores y guitarras ----------
function telaPliegues(ancho, alto, pliegues, prof, mat) {
  const geo = new THREE.PlaneGeometry(ancho, alto, Math.max(12, pliegues * 6), 1), pos = geo.attributes.position;
  for (let i = 0; i < pos.count; i++) { const x = pos.getX(i); pos.setZ(i, Math.sin((x / ancho + .5) * Math.PI * 2 * pliegues) * prof); }
  geo.computeVertexNormals(); const m = sombra(new THREE.Mesh(geo, mat)); return m;
}
function cortina(g, W, D, H, c, o) {   // barra con remates y uno o dos paños fruncidos (visillo: translúcido)
  const metal = METAL(o.colorBarra || '#e9e7e2'), y = H - .03, z = -D / 2 + .035;
  barra(g, [-W / 2 - .05, y, z], [W / 2 + .05, y, z], .011, metal); esfera(g, .022, metal, -W / 2 - .07, y, z); esfera(g, .022, metal, W / 2 + .07, y, z);
  for (const x of [-W / 2 + .05, W / 2 - .05]) caja(g, .02, .03, .05, metal, x, y - .015, -D / 2 + .01);
  const mat = new THREE.MeshStandardMaterial({ color: c, roughness: .95, side: THREE.DoubleSide, transparent: !!o.visillo, opacity: o.visillo ? .55 : 1, depthWrite: !o.visillo });
  const alto = H - .07, paños = o.panos || 2;
  if (paños === 1) { const m = telaPliegues(W, alto, Math.round(W * 6), .03, mat); m.position.set(0, alto / 2, z + .03); g.add(m); }
  else for (const sg of [-1, 1]) { const pw = W * .3, m = telaPliegues(pw, alto, Math.max(4, Math.round(pw * 9)), .035, mat); m.position.set(sg * (W / 2 - pw / 2), alto / 2, z + .035); g.add(m);
    if (o.alzapanos) { const t = new THREE.Mesh(new THREE.TorusGeometry(pw * .32, .012, 6, 20), M(c, { tela: true })); t.rotation.x = Math.PI / 2; t.scale.set(1, .6, 1); t.position.set(sg * (W / 2 - pw / 2), alto * .38, z + .035); g.add(t); } }
}
function estor(g, W, D, H, c, o) {     // cajón arriba, tela a medio bajar y barra inferior (plisado: en zigzag)
  const caj = M(o.colorCaja || '#f1f0ec', { madera: false }), z = -D / 2 + .03, bajado = o.bajado ?? .62, alto = (H - .06) * bajado;
  rcaja(g, W, .055, .055, .01, caj, 0, H - .055, z);
  const mat = new THREE.MeshStandardMaterial({ color: c, roughness: .95, side: THREE.DoubleSide, transparent: !o.opaco, opacity: o.opaco ? 1 : .8 });
  let tela;
  if (o.plisado) { const geo = new THREE.PlaneGeometry(W - .02, alto, 1, Math.max(8, Math.round(alto / .025))), pos = geo.attributes.position; for (let i = 0; i < pos.count; i++) { const k = Math.round((pos.getY(i) / alto + .5) * alto / .025); pos.setZ(i, k % 2 ? .008 : -.008); } geo.computeVertexNormals(); tela = sombra(new THREE.Mesh(geo, mat)); }
  else if (o.nocheDia) { const cv = document.createElement('canvas'); cv.width = 8; cv.height = 64; const x = cv.getContext('2d'); for (let i = 0; i < 8; i++) { x.fillStyle = i % 2 ? '#ffffff' : 'rgba(255,255,255,.45)'; x.fillRect(0, i * 8, 8, 8); } const tx = new THREE.CanvasTexture(cv); tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(1, alto / .16); mat.map = tx; mat.alphaMap = tx; mat.transparent = true; mat.opacity = 1; tela = sombra(new THREE.Mesh(new THREE.PlaneGeometry(W - .02, alto), mat)); }
  else { tela = sombra(new THREE.Mesh(new THREE.PlaneGeometry(W - .02, alto), mat)); }
  tela.position.set(0, H - .055 - alto / 2, z + .005); g.add(tela);
  caja(g, W - .02, .02, .015, M(o.colorCaja || '#e8e6e0', { madera: false }), 0, H - .055 - alto - .01, z + .005);
  if (!o.plisado) { cil(g, .003, .003, Math.min(.5, alto), M('#cfcac0'), W / 2 - .05, H - .055 - Math.min(.5, alto), z + .03, 6); }
}
function radiador(g, W, D, H, c, o) {  // elementos de aluminio, o toallero de baño (dos tubos y barras)
  const m = M(c || '#f3f3f1', { roughness: .45, metalness: .15, madera: false });
  if (o.toallero) { for (const sx of [-1, 1]) cil(g, .016, .016, H, m, sx * (W / 2 - .02), 0, 0, 12); const n = Math.round(H / .07); for (let i = 1; i < n; i++) { const b = barra(g, [-W / 2 + .02, i * H / n, 0], [W / 2 - .02, i * H / n, 0], .01, m); } return; }
  const n = Math.max(2, o.elementos || Math.round(W / .08)), paso = W / n;
  for (let i = 0; i < n; i++) { const x = -W / 2 + paso * (i + .5); rcaja(g, paso - .008, H, D * .55, .01, m, x, 0, -D * .05); rcaja(g, paso * .5, H - .06, D, .008, m, x, .03, 0); }
  for (const y of [.045, H - .045]) barra(g, [-W / 2 - .02, y, -D * .1], [W / 2 + .02, y, -D * .1], .014, m);
  cil(g, .018, .018, .05, METAL('#c9c9c9'), W / 2 + .045, .01, 0, 12); esfera(g, .02, M('#ffffff', { madera: false }), W / 2 + .045, .07, 0);
}
function guitarra(g, W, D, H, c, o) {  // acústica o eléctrica, en soporte de suelo o colgada de la pared
  const el = o.t === 'electrica', madera = M(o.colorCuerpo || c || (el ? '#8c1d1d' : '#c98a4a'), { madera: !el, roughness: el ? .3 : .5, metalness: el ? .1 : 0 }), mastil = M('#5a3a22', { madera: true }), oscuro = M('#1e1b18', { madera: false });
  const largo = Math.min(H - (o.pared ? .05 : .08), 1.02), base = o.pared ? 0 : .08, cuerpo = largo * (el ? .42 : .48), grosor = el ? .045 : .1, ancho = el ? .33 : .38;
  const sh = new THREE.Shape(), r1 = ancho * .5, r2 = ancho * .38, cy1 = cuerpo * .3, cy2 = cuerpo * .74;
  sh.absellipse(0, cy1, r1, cuerpo * .32, Math.PI * 1.5, Math.PI * 3.5, false); 
  const cuerpoGeo = new THREE.ExtrudeGeometry(sh, { depth: grosor, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 2, curveSegments: 28 });
  const k1 = sombra(new THREE.Mesh(cuerpoGeo, madera)); k1.position.set(0, base, -grosor / 2); g.add(k1);
  const sh2 = new THREE.Shape(); sh2.absellipse(0, cy2, r2, cuerpo * .26, 0, Math.PI * 2, false);
  const k2 = sombra(new THREE.Mesh(new THREE.ExtrudeGeometry(sh2, { depth: grosor, bevelEnabled: true, bevelThickness: .006, bevelSize: .006, bevelSegments: 2, curveSegments: 28 }), madera)); k2.position.set(0, base, -grosor / 2); g.add(k2);
  if (!el) { const boca = new THREE.Mesh(new THREE.CircleGeometry(.045, 28), oscuro); boca.position.set(0, base + cy2 - cuerpo * .04, grosor / 2 + .0065); g.add(boca); caja(g, .1, .015, .012, mastil, 0, base + cuerpo * .2, grosor / 2 + .006); }
  else { caja(g, .06, .02, .01, METAL('#c8c8c8'), 0, base + cuerpo * .45, grosor / 2 + .006); caja(g, .06, .02, .01, METAL('#c8c8c8'), 0, base + cuerpo * .62, grosor / 2 + .006); caja(g, .14, .03, .004, oscuro, -.04, base + cuerpo * .3, grosor / 2 + .006); }
  const ini = base + cuerpo * .95, fin = base + largo - .17; caja(g, .05, fin - ini, .03, mastil, 0, ini, grosor * .2);
  rcaja(g, .085, .17, .022, .01, oscuro, 0, fin, grosor * .15);
  for (let i = 0; i < 6; i++) caja(g, .0012, fin - ini + cuerpo * .55, .001, METAL('#dcdcdc'), -.015 + i * .006, base + cuerpo * .4, grosor * .2 + .017);
  if (o.pared) { caja(g, .07, .04, .05, oscuro, 0, largo - .02, -D / 2 + .025); }
  else { const m = METAL('#262626'); barra(g, [-.18, 0, .12], [0, .45, -.04], .009, m); barra(g, [.18, 0, .12], [0, .45, -.04], .009, m); barra(g, [0, 0, -.2], [0, .45, -.04], .009, m); barra(g, [-.12, .1, .07], [.12, .1, .07], .012, M('#262626', { madera: false })); }
}
