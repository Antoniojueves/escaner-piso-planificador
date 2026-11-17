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
