// Lector de nubes de puntos .ply (binario o ASCII)
function parsePLY(buffer) {
  const bytes = new Uint8Array(buffer);
  const headEnd = (() => {
    const needle = 'end_header';
    const max = Math.min(bytes.length, 65536);
    let s = '';
    for (let i = 0; i < max; i++) s += String.fromCharCode(bytes[i]);
    const k = s.indexOf(needle);
    if (k < 0) throw new Error('No es un archivo PLY válido');
    let e = k + needle.length;
    if (s[e] === '\r') e++;
    if (s[e] === '\n') e++;
    return { text: s.slice(0, k), offset: e };
  })();
  const lines = headEnd.text.split(/\r?\n/).map(l => l.trim()).filter(Boolean);
  const fmt = (lines.find(l => l.startsWith('format')) || '').split(/\s+/)[1];
  let count = 0, props = [], inVertex = false;
  const sizes = { char: 1, uchar: 1, int8: 1, uint8: 1, short: 2, ushort: 2, int16: 2, uint16: 2,
    int: 4, uint: 4, int32: 4, uint32: 4, float: 4, float32: 4, double: 8, float64: 8 };
  for (const l of lines) {
    const p = l.split(/\s+/);
    if (p[0] === 'element') { inVertex = p[1] === 'vertex'; if (inVertex) count = parseInt(p[2], 10); }
    else if (p[0] === 'property' && inVertex) {
      if (p[1] === 'list') throw new Error('PLY con listas en vértices no soportado');
      props.push({ type: p[1], name: p[2] });
    }
  }
  const pos = new Float32Array(count * 3);
  const col = new Uint8Array(count * 3).fill(180);
  const idx = n => props.findIndex(p => p.name === n);
  const ix = idx('x'), iy = idx('y'), iz = idx('z');
  const ir = Math.max(idx('red'), idx('r')), ig = Math.max(idx('green'), idx('g')), ib = Math.max(idx('blue'), idx('b'));
  if (ix < 0 || iy < 0 || iz < 0) throw new Error('El PLY no tiene coordenadas x, y, z');

  if (fmt === 'ascii') {
    const body = new TextDecoder().decode(bytes.subarray(headEnd.offset)).split(/\r?\n/);
    for (let i = 0, v = 0; i < body.length && v < count; i++) {
      const t = body[i].trim(); if (!t) continue;
      const a = t.split(/\s+/).map(Number);
      pos[v * 3] = a[ix]; pos[v * 3 + 1] = a[iy]; pos[v * 3 + 2] = a[iz];
      if (ir >= 0) { col[v * 3] = a[ir]; col[v * 3 + 1] = a[ig]; col[v * 3 + 2] = a[ib]; }
      v++;
    }
    return { pos, col, n: count };
  }
  if (fmt !== 'binary_little_endian') throw new Error('Formato PLY no soportado: ' + fmt);
  const offs = []; let stride = 0;
  for (const p of props) { offs.push(stride); stride += sizes[p.type]; }
  const dv = new DataView(buffer, headEnd.offset);
  const read = (o, t) => {
    switch (t) {
      case 'float': case 'float32': return dv.getFloat32(o, true);
      case 'double': case 'float64': return dv.getFloat64(o, true);
      case 'uchar': case 'uint8': return dv.getUint8(o);
      case 'char': case 'int8': return dv.getInt8(o);
      case 'ushort': case 'uint16': return dv.getUint16(o, true);
      case 'short': case 'int16': return dv.getInt16(o, true);
      case 'uint': case 'uint32': return dv.getUint32(o, true);
      default: return dv.getInt32(o, true);
    }
  };
  const n = Math.min(count, Math.floor(dv.byteLength / stride));
  for (let v = 0; v < n; v++) {
    const b = v * stride;
    pos[v * 3] = read(b + offs[ix], props[ix].type);
    pos[v * 3 + 1] = read(b + offs[iy], props[iy].type);
    pos[v * 3 + 2] = read(b + offs[iz], props[iz].type);
    if (ir >= 0) {
      col[v * 3] = read(b + offs[ir], props[ir].type);
      col[v * 3 + 1] = read(b + offs[ig], props[ig].type);
      col[v * 3 + 2] = read(b + offs[ib], props[ib].type);
    }
  }
  return { pos: pos.subarray(0, n * 3), col: col.subarray(0, n * 3), n };
}
