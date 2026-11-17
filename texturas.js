// Tomado del configurador de tu hermano (Configurador para amueblar).
// Texturas dibujadas en un <canvas>: veta de madera, parquet, alfombras y telas de cortina.
import * as THREE from 'three';

function lienzo(w, h) { const c = document.createElement('canvas'); c.width = w; c.height = h; return [c, c.getContext('2d')]; }
function azar(semilla) { let s = semilla; return () => ((s = (s * 16807) % 2147483647) - 1) / 2147483646; }
function textura(c, rx = 1, ry = 1) {
  const t = new THREE.CanvasTexture(c);
  t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(rx, ry); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function texturaVeta() {            // casi blanca, con vetas más oscuras: multiplica el color del acabado
  const [c, x] = lienzo(512, 256), r = azar(7);
  x.fillStyle = '#fff'; x.fillRect(0, 0, 512, 256);
  for (let i = 0; i < 150; i++) {
    const y = r() * 256, g = 150 + r() * 80, a = 0.05 + r() * 0.16;
    x.strokeStyle = `rgba(${g * 0.55},${g * 0.42},${g * 0.3},${a})`; x.lineWidth = 0.6 + r() * 2.4;
    x.beginPath(); x.moveTo(0, y);
    const d = (r() - 0.5) * 10;
    x.bezierCurveTo(170, y + d, 340, y - d, 512, y); x.stroke();
  }
  return textura(c);
}

export function texturaParquet() {         // lamas de roble de 42 x 7 cm, a lo largo de la habitación
  const N = 12, M = 3, [c, x] = lienzo(N * 40, M * 240), r = azar(3);
  for (let i = 0; i < N; i++) {
    const des = r() * 240;
    for (let j = -1; j < M + 1; j++) {
      const t = 0.82 + r() * 0.3;
      x.fillStyle = `rgb(${176 * t},${128 * t},${78 * t})`;
      x.fillRect(i * 40, j * 240 + des, 40, 240);
      for (let k = 0; k < 7; k++) { x.strokeStyle = `rgba(90,55,25,${0.05 + r() * 0.1})`; x.beginPath(); const px = i * 40 + r() * 40; x.moveTo(px, j * 240 + des); x.lineTo(px + (r() - 0.5) * 4, j * 240 + des + 240); x.stroke(); }
      x.fillStyle = 'rgba(60,35,15,0.55)'; x.fillRect(i * 40, j * 240 + des, 40, 1.5);
    }
    x.fillStyle = 'rgba(60,35,15,0.5)'; x.fillRect(i * 40, 0, 1.2, M * 240);
  }
  return textura(c, 1 / (N * 0.07), 1 / (M * 0.42));
}

export function texturaAlfombra(o) {       // o.tam = [ancho, largo] en m; o.patron = { tipo, colores }
  const p = o.patron || { tipo: 'lisa', colores: ['#c9bfae'] }, col = p.colores, W = 640, H = Math.round(640 * (o.redonda ? 1 : o.tam[1] / o.tam[0]));
  const [c, x] = lienzo(W, H), r = azar(11);
  x.fillStyle = col[0]; x.fillRect(0, 0, W, H);
  const u = W / o.tam[0];                    // píxeles por metro
  if (p.tipo === 'rayas') {
    const paso = (p.paso || 0.12) * u;
    for (let i = 0, y = 0; y < H; i++, y += paso) { x.fillStyle = col[i % col.length]; x.fillRect(0, y, W, paso); }
  } else if (p.tipo === 'bloques') {         // rectángulos de colores al tresbolillo (tipo BRÖNDEN)
    for (let i = 0; i < 46; i++) {
      x.fillStyle = col[1 + Math.floor(r() * (col.length - 1))];
      const w = (0.18 + r() * 0.5) * u, h = (0.10 + r() * 0.16) * u;
      x.fillRect(r() * W - w / 2, r() * H - h / 2, w, h);
    }
  } else if (p.tipo === 'rombos') {
    const paso = (p.paso || 0.34) * u; x.strokeStyle = col[1]; x.lineWidth = 0.02 * u;
    for (let k = -H; k < W + H; k += paso) { x.beginPath(); x.moveTo(k, 0); x.lineTo(k + H, H); x.stroke(); x.beginPath(); x.moveTo(k + H, 0); x.lineTo(k, H); x.stroke(); }
  } else if (p.tipo === 'cuadros') {
    const paso = (p.paso || 0.25) * u;
    for (let i = 0; i * paso < W; i++) for (let j = 0; j * paso < H; j++) { x.fillStyle = col[(i + j) % col.length]; x.fillRect(i * paso, j * paso, paso, paso); }
  } else if (p.tipo === 'borde') {
    x.strokeStyle = col[1]; x.lineWidth = 0.07 * u; x.strokeRect(0.16 * u, 0.16 * u, W - 0.32 * u, H - 0.32 * u);
    if (col[2]) { x.strokeStyle = col[2]; x.lineWidth = 0.025 * u; x.strokeRect(0.30 * u, 0.30 * u, W - 0.60 * u, H - 0.60 * u); }
  } else if (p.tipo === 'ondas') {
    x.lineWidth = 0.035 * u;
    for (let j = 0, y = 0.1 * u; y < H; j++, y += 0.16 * u) { x.strokeStyle = col[1 + (j % (col.length - 1))]; x.beginPath(); for (let px = 0; px <= W; px += 8) x.lineTo(px, y + Math.sin(px / u * 7 + j) * 0.035 * u); x.stroke(); }
  } else if (p.tipo === 'manchas') {         // formas orgánicas grandes
    for (let i = 0; i < 9; i++) { x.fillStyle = col[1 + (i % (col.length - 1))]; x.beginPath(); x.ellipse(r() * W, r() * H, (0.2 + r() * 0.35) * u, (0.15 + r() * 0.3) * u, r() * 3, 0, 7); x.fill(); }
  }
  const im = x.getImageData(0, 0, W, H), d = im.data;            // trama de tejido
  for (let i = 0; i < d.length; i += 4) { const n = (r() - 0.5) * (p.tipo === 'yute' ? 46 : 18); d[i] += n; d[i + 1] += n; d[i + 2] += n; }
  x.putImageData(im, 0, 0);
  if (p.tipo === 'yute') { x.strokeStyle = 'rgba(90,70,40,0.18)'; for (let y = 0; y < H; y += 5) { x.beginPath(); x.moveTo(0, y); x.lineTo(W, y); x.stroke(); } }
  const t = new THREE.CanvasTexture(c); t.colorSpace = THREE.SRGBColorSpace; t.anisotropy = 8;
  return t;
}

export function texturaCortina(patron, color, color2) {   // 1 m de tela por repetición
  const [c, x] = lienzo(512, 512), r = azar(5);
  x.fillStyle = color; x.fillRect(0, 0, 512, 512);
  if (patron === 'estampado') {               // manchas negras irregulares sobre blanco, como las de ahora
    x.fillStyle = color2 || '#111';
    for (let i = 0; i < 26; i++) {
      const cx = r() * 512, cy = r() * 512, n = 5 + Math.floor(r() * 3), R = 34 + r() * 40;
      x.beginPath();
      for (let k = 0; k < n; k++) { const a = (k / n) * 6.283 + r() * 0.5, rr = R * (0.6 + r() * 0.5); x.lineTo(cx + Math.cos(a) * rr, cy + Math.sin(a) * rr); }
      x.closePath(); x.fill();
    }
  } else if (patron === 'rayas') {
    x.fillStyle = color2 || '#fff';
    for (let px = 0; px < 512; px += 64) x.fillRect(px, 0, 22, 512);
  } else if (patron === 'hojas') {
    x.strokeStyle = color2 || '#fff'; x.lineWidth = 3;
    for (let i = 0; i < 30; i++) { const cx = r() * 512, cy = r() * 512, a = r() * 6.28; x.beginPath(); x.ellipse(cx, cy, 30, 10, a, 0, 6.3); x.stroke(); }
  }
  const im = x.getImageData(0, 0, 512, 512), d = im.data;   // hilos de lino
  for (let y = 0; y < 512; y++) { const fy = (r() - 0.5) * 16; for (let px = 0; px < 512; px++) { const i = 4 * (y * 512 + px), n = fy + (r() - 0.5) * 12; d[i] += n; d[i + 1] += n; d[i + 2] += n; } }
  x.putImageData(im, 0, 0);
  return textura(c, 1, 1);
}

// ===== Suelos a elegir (por habitación) =====
function lamas(base, semilla, anchoCm = 7, largoCm = 42) {
  const N = 12, M = 3, [c, x] = lienzo(N * 40, M * 240), r = azar(semilla);
  for (let i = 0; i < N; i++) {
    const des = r() * 240;
    for (let j = -1; j < M + 1; j++) {
      const t = 0.86 + r() * 0.24; x.fillStyle = `rgb(${base[0] * t},${base[1] * t},${base[2] * t})`; x.fillRect(i * 40, j * 240 + des, 40, 240);
      for (let k = 0; k < 7; k++) { x.strokeStyle = `rgba(${base[0] * .45},${base[1] * .4},${base[2] * .35},${0.05 + r() * 0.1})`; x.beginPath(); const px = i * 40 + r() * 40; x.moveTo(px, j * 240 + des); x.lineTo(px + (r() - 0.5) * 4, j * 240 + des + 240); x.stroke(); }
      x.fillStyle = 'rgba(40,25,10,0.45)'; x.fillRect(i * 40, j * 240 + des, 40, 1.5);
    }
    x.fillStyle = 'rgba(40,25,10,0.4)'; x.fillRect(i * 40, 0, 1.2, M * 240);
  }
  return textura(c, 1 / (N * anchoCm / 100), 1 / (M * largoCm / 100));
}
function espiga(base, semilla) {          // parquet en espiga, piezas de 50 x 10 cm
  const [c, x] = lienzo(512, 512), r = azar(semilla), L = 128, A = 25.6;
  x.fillStyle = `rgb(${base})`; x.fillRect(0, 0, 512, 512);
  for (let fila = -4; fila < 24; fila++) for (let col = -2; col < 6; col++) {
    for (const lado of [0, 1]) {
      const t = 0.85 + r() * 0.25; x.save(); x.translate(col * L * 0.707 * 2 + (lado ? L * 0.707 : 0), fila * A * 1.414 + (lado ? 0 : 0));
      x.rotate(lado ? -Math.PI / 4 : Math.PI / 4); x.fillStyle = `rgb(${base[0] * t},${base[1] * t},${base[2] * t})`; x.fillRect(0, 0, L, A);
      x.strokeStyle = 'rgba(40,25,10,.45)'; x.lineWidth = 1.2; x.strokeRect(0, 0, L, A); x.restore();
    }
  }
  return textura(c, 1 / 1.0, 1 / 1.0);
}
function baldosas(colorA, colorB, ladoCm, junta, semilla, patron = null) {
  const [c, x] = lienzo(512, 512), r = azar(semilla), n = 4, s = 512 / n;
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) {
    const t = 0.94 + r() * 0.1; x.fillStyle = colorA; x.fillRect(i * s, j * s, s, s);
    x.fillStyle = `rgba(0,0,0,${(1 - t) * 0.6})`; x.fillRect(i * s, j * s, s, s);
    for (let k = 0; k < 220; k++) { x.fillStyle = `rgba(${r() < .5 ? '255,255,255' : '0,0,0'},${r() * 0.035})`; x.fillRect(i * s + r() * s, j * s + r() * s, 2 + r() * 6, 2 + r() * 6); }
    if (patron) patron(x, i * s, j * s, s, colorB);
  }
  x.strokeStyle = junta; x.lineWidth = 2.5;
  for (let i = 0; i <= n; i++) { x.beginPath(); x.moveTo(i * s, 0); x.lineTo(i * s, 512); x.stroke(); x.beginPath(); x.moveTo(0, i * s); x.lineTo(512, i * s); x.stroke(); }
  return textura(c, 1 / (n * ladoCm / 100), 1 / (n * ladoCm / 100));
}
function ruido(base, semilla, grano, escalaM) {
  const [c, x] = lienzo(512, 512), r = azar(semilla); x.fillStyle = base; x.fillRect(0, 0, 512, 512);
  for (let k = 0; k < 9000; k++) { const v = r(); x.fillStyle = `rgba(${v < .5 ? '255,255,255' : '0,0,0'},${r() * grano})`; const z = 1 + r() * 3; x.fillRect(r() * 512, r() * 512, z, z); }
  for (let k = 0; k < 40; k++) { const g = x.createRadialGradient(0, 0, 0, 0, 0, 60 + r() * 120); const v = r() < .5 ? '255,255,255' : '0,0,0'; g.addColorStop(0, `rgba(${v},${grano * .9})`); g.addColorStop(1, `rgba(${v},0)`); x.save(); x.translate(r() * 512, r() * 512); x.fillStyle = g; x.fillRect(-200, -200, 400, 400); x.restore(); }
  return textura(c, 1 / escalaM, 1 / escalaM);
}
const hidraulico = (x, x0, y0, s, col) => {
  x.fillStyle = col; const m = s / 2;
  x.beginPath(); x.moveTo(x0 + m, y0 + s * .12); x.lineTo(x0 + s * .88, y0 + m); x.lineTo(x0 + m, y0 + s * .88); x.lineTo(x0 + s * .12, y0 + m); x.closePath(); x.fill();
  x.fillStyle = 'rgba(255,255,255,.85)'; x.beginPath(); x.arc(x0 + m, y0 + m, s * .14, 0, Math.PI * 2); x.fill();
  for (const [a, b] of [[0, 0], [s, 0], [0, s], [s, s]]) { x.fillStyle = col; x.beginPath(); x.arc(x0 + a, y0 + b, s * .16, 0, Math.PI * 2); x.fill(); }
};
export const SUELOS = [
  { id: 'escaneo', nombre: 'El de tu casa', muestra: null },
  { id: 'roble', nombre: 'Roble natural', muestra: '#b98a57', crea: () => ({ map: lamas([176, 128, 78], 3), roughness: .6 }) },
  { id: 'robleclaro', nombre: 'Roble claro', muestra: '#d8bc94', crea: () => ({ map: lamas([214, 186, 146], 5), roughness: .6 }) },
  { id: 'nogal', nombre: 'Nogal', muestra: '#6e4a31', crea: () => ({ map: lamas([118, 80, 54], 9), roughness: .55 }) },
  { id: 'espiga', nombre: 'Espiga roble', muestra: '#c39a68', crea: () => ({ map: espiga([196, 152, 104], 4), roughness: .58 }) },
  { id: 'porcelanico', nombre: 'Porcelánico gris 60×60', muestra: '#b9b6b0', crea: () => ({ map: baldosas('#bdbab4', null, 60, 'rgba(90,88,84,.5)', 6), roughness: .35 }) },
  { id: 'marmol', nombre: 'Mármol blanco', muestra: '#ece9e4', crea: () => ({ map: baldosas('#efece7', null, 80, 'rgba(150,145,140,.35)', 8), roughness: .18 }) },
  { id: 'microcemento', nombre: 'Microcemento', muestra: '#a9a49c', crea: () => ({ map: ruido('#aaa59d', 12, .06, 3), roughness: .5 }) },
  { id: 'hidraulico', nombre: 'Baldosa hidráulica', muestra: '#4d6b78', crea: () => ({ map: baldosas('#eee8dc', '#4d6b78', 20, 'rgba(120,115,105,.45)', 14, hidraulico), roughness: .45 }) },
  { id: 'moqueta', nombre: 'Moqueta beige', muestra: '#cdbfa8', crea: () => ({ map: ruido('#cdbfa8', 21, .09, 1), roughness: 1 }) },
];
