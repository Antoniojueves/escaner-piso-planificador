// Sincronización en tiempo real entre el móvil y el ordenador (Firebase Firestore, plan gratuito).
// Cada piso tiene un id aleatorio largo: quien tiene el enlace puede verlo y editarlo; no se pueden listar pisos.
// Estructura:  pisos/{id}                 → nombre, paredes, propios, actualizado, escaneo (partes)
//              pisos/{id}/muebles/{clave} → un documento por mueble (n<uid> nuevos, e<clave> existentes)
//              pisos/{id}/escaneo/{parte} → piso.json y la nube de puntos reducida, en trozos
//              pisos/{id}/presencia/{cliente} → quién está conectado y qué tiene seleccionado
const CFG = {
  apiKey: 'AIzaSyDfSDlS1GD22sNwcWZUo4-JTY1Hb44FMOA', authDomain: 'escaner-piso.firebaseapp.com', projectId: 'escaner-piso',
  storageBucket: 'escaner-piso.firebasestorage.app', messagingSenderId: '629879391074', appId: '1:629879391074:web:3b3dd1604e74316ab8e23b'
};
const SDK = 'https://www.gstatic.com/firebasejs/11.0.2/';
const TROZO = 900000;
let fbPromise = null;

function cargarFirebase() {
  if (!fbPromise) fbPromise = (async () => {
    const [{ initializeApp }, A, F] = await Promise.all([import(SDK + 'firebase-app.js'), import(SDK + 'firebase-auth.js'), import(SDK + 'firebase-firestore.js')]);
    const app = initializeApp(CFG);
    let auth; try { auth = A.initializeAuth(app, { persistence: [A.indexedDBLocalPersistence, A.browserLocalPersistence, A.inMemoryPersistence] }); } catch { auth = A.getAuth(app); }
    await A.signInAnonymously(auth);
    let db; try { db = F.initializeFirestore(app, { experimentalAutoDetectLongPolling: true }); } catch { db = F.getFirestore(app); }
    return { F, db };
  })().catch(e => { fbPromise = null; throw e; });
  return fbPromise;
}

export function nuevoId() {
  const a = 'ABCDEFGHJKLMNPQRSTUVWXYZabcdefghijkmnopqrstuvwxyz23456789', b = crypto.getRandomValues(new Uint8Array(22));
  return Array.from(b, x => a[x % a.length]).join('');
}
export const CLIENTE = nuevoId().slice(0, 8);

const claveDoc = k => String(k).replace(/[\/.#$\[\]]/g, '_');
const canon = o => JSON.stringify(o, (k, v) => v && typeof v === 'object' && !Array.isArray(v) ? Object.fromEntries(Object.keys(v).sort().map(x => [x, v[x]])) : v);
const limpio = o => JSON.parse(JSON.stringify(o, (k, v) => v === undefined ? null : v));

// Convierte el diseño (serialize) en mapa clave→registro, y al revés
function aMapa(d) {
  const m = new Map();
  for (const n of d.nuevos || []) m.set('n' + claveDoc(n.uid), { tipo: 'n', ...limpio(n) });
  for (const [k, e] of Object.entries(d.existentes || {})) m.set('e' + claveDoc(k), { tipo: 'e', clave: k, ...limpio(e) });
  return m;
}
function deMapa(m, principal) {
  const d = { nuevos: [], existentes: {}, paredes: principal?.paredes || {}, suelos: principal?.suelos || {}, propuestas: principal?.propuestas || {}, propios: principal?.propios || [], extras: principal?.extras || {}, actualizado: principal?.actualizado || null };
  for (const r of m.values()) {
    const { tipo, clave, por, ...resto } = r;
    if (tipo === 'n') d.nuevos.push(resto); else if (tipo === 'e') d.existentes[clave] = resto;
  }
  return d;
}

// Nube de puntos reducida a un PLY binario compacto (x,y,z float + r,g,b) para subirla
function plyCompacto(cloud, max = 350000) {
  const step = Math.max(1, Math.ceil(cloud.n / max)), n = Math.ceil(cloud.n / step);
  const cab = new TextEncoder().encode(`ply\nformat binary_little_endian 1.0\nelement vertex ${n}\nproperty float x\nproperty float y\nproperty float z\nproperty uchar red\nproperty uchar green\nproperty uchar blue\nend_header\n`);
  const buf = new ArrayBuffer(cab.length + n * 15), dv = new DataView(buf); new Uint8Array(buf).set(cab);
  let o = cab.length;
  for (let i = 0; i < cloud.n; i += step) {
    dv.setFloat32(o, cloud.pos[i * 3], true); dv.setFloat32(o + 4, cloud.pos[i * 3 + 1], true); dv.setFloat32(o + 8, cloud.pos[i * 3 + 2], true);
    dv.setUint8(o + 12, cloud.col[i * 3]); dv.setUint8(o + 13, cloud.col[i * 3 + 1]); dv.setUint8(o + 14, cloud.col[i * 3 + 2]); o += 15;
  }
  return new Uint8Array(buf, 0, o);
}

// ¿Existe el piso en la nube? Devuelve su documento principal o null
export async function leerPiso(id) {
  const { F, db } = await cargarFirebase();
  const s = await F.getDoc(F.doc(db, 'pisos', id));
  return s.exists() ? s.data() : null;
}

// Descarga el escaneo (piso.json + nube) y el diseño actual
export async function descargarPiso(id, progreso = () => {}) {
  const { F, db } = await cargarFirebase();
  const p = await F.getDoc(F.doc(db, 'pisos', id)); if (!p.exists()) throw new Error('Ese piso no existe o el enlace no es correcto');
  const pr = p.data(), esc = pr.escaneo || {};
  progreso('Descargando el escaneo…');
  let json = ''; for (let i = 0; i < (esc.trozosPiso || 0); i++) json += (await F.getDoc(F.doc(db, 'pisos', id, 'escaneo', 'piso_' + i))).data().t;
  if (!json) throw new Error('El escaneo de este piso aún no se ha subido desde el móvil');
  let ply = null;
  if (esc.trozosNube) {
    const partes = [];
    for (let i = 0; i < esc.trozosNube; i++) { progreso(`Descargando la nube de puntos (${i + 1}/${esc.trozosNube})…`); partes.push((await F.getDoc(F.doc(db, 'pisos', id, 'escaneo', 'nube_' + i))).data().b.toUint8Array()); }
    const total = partes.reduce((s, a) => s + a.length, 0), u = new Uint8Array(total); let o = 0; for (const a of partes) { u.set(a, o); o += a.length; }
    ply = u.buffer;
  }
  const ms = await F.getDocs(F.collection(db, 'pisos', id, 'muebles')), m = new Map(); ms.forEach(s => m.set(s.id, s.data()));
  return { nombre: pr.nombre || 'Piso', piso: JSON.parse(json), ply, diseno: m.size ? deMapa(m, pr) : null };
}

// Conecta a un piso: envía los cambios locales y recibe los de los demás al instante
export async function conectar(id, { nombre, dispositivo, recibir, presencia, estado = () => {} }) {
  const { F, db } = await cargarFirebase();
  const raiz = F.doc(db, 'pisos', id), col = F.collection(db, 'pisos', id, 'muebles');
  const ultimo = new Map();          // clave → JSON del último estado conocido (enviado o recibido)
  let principal = null, ultimoPrincipal = '', listo = false;
  const remoto = new Map();
  const quitarPor = r => { const { por, ...x } = r; return x; };

  const ini = await F.getDoc(raiz);
  if (!ini.exists()) await F.setDoc(raiz, { nombre, creado: Date.now(), actualizado: null });
  else principal = ini.data();

  const avisar = () => { if (listo) recibir(deMapa(remoto, principal)); };
  const unsubs = [];
  unsubs.push(F.onSnapshot(raiz, s => {
    if (!s.exists()) return; principal = s.data();
    const j = canon([principal.paredes || {}, principal.suelos || {}, principal.propuestas || {}, principal.propios || [], principal.extras || {}]);
    if (s.metadata.hasPendingWrites || j === ultimoPrincipal) return; ultimoPrincipal = j; avisar();
  }, e => estado('error', e)));
  await new Promise(res => {
    unsubs.push(F.onSnapshot(col, s => {
      let cambio = false;
      s.docChanges().forEach(c => {
        if (c.type === 'removed') { remoto.delete(c.doc.id); if (ultimo.has(c.doc.id)) { ultimo.delete(c.doc.id); cambio = true; } return; }
        const r = c.doc.data(); remoto.set(c.doc.id, r);
        const j = canon(quitarPor(r)); if (ultimo.get(c.doc.id) !== j) { ultimo.set(c.doc.id, j); cambio = true; }
      });
      if (!listo) { listo = true; res(); } else if (cambio && !s.metadata.hasPendingWrites) avisar();
      estado(s.metadata.fromCache ? 'sinconexion' : 'envivo');
    }, e => { estado('error', e); res(); }));
  });

  // Presencia
  const yo = F.doc(db, 'pisos', id, 'presencia', CLIENTE);
  let sel = null; const latido = () => F.setDoc(yo, { nombre: dispositivo, sel, t: Date.now() }).catch(() => {});
  latido(); const hb = setInterval(latido, 25000);
  unsubs.push(F.onSnapshot(F.collection(db, 'pisos', id, 'presencia'), s => {
    const ahora = Date.now(), otros = [];
    s.forEach(d => { const v = d.data(); if (d.id !== CLIENTE && ahora - v.t < 70000) otros.push(v); });
    presencia(otros);
  }));
  const salir = () => { try { F.deleteDoc(yo); } catch {} };
  addEventListener('pagehide', salir);

  let cola = null, enviando = false;
  async function vaciar() {
    if (enviando || !cola) return; enviando = true;
    const d = cola; cola = null;
    try {
      const m = aMapa(d), b = F.writeBatch(db); let n = 0;
      for (const [k, r] of m) { const j = canon(r); if (ultimo.get(k) !== j) { ultimo.set(k, j); b.set(F.doc(col, k), { ...r, por: CLIENTE }); n++; } }
      for (const k of [...ultimo.keys()]) if (!m.has(k)) { ultimo.delete(k); b.delete(F.doc(col, k)); n++; }
      const pj = canon([limpio(d.paredes || {}), limpio(d.suelos || {}), limpio(d.propuestas || {}), limpio(d.propios || []), limpio(d.extras || {})]);
      if (pj !== ultimoPrincipal) { ultimoPrincipal = pj; b.set(raiz, { nombre, paredes: limpio(d.paredes || {}), suelos: limpio(d.suelos || {}), propuestas: limpio(d.propuestas || {}), propios: limpio(d.propios || []), extras: limpio(d.extras || {}), actualizado: d.actualizado || new Date().toISOString() }, { mergeFields: ['nombre', 'paredes', 'suelos', 'propuestas', 'propios', 'extras', 'actualizado'] }); n++; }
      else if (n) b.set(raiz, { actualizado: d.actualizado || new Date().toISOString() }, { merge: true });
      if (n) await b.commit();
    } catch (e) { estado('error', e); }
    enviando = false; if (cola) vaciar();
  }

  return {
    id,
    remoto: () => remoto.size ? deMapa(remoto, principal) : null,
    actualizadoRemoto: () => principal?.actualizado || null,
    tieneEscaneo: () => !!principal?.escaneo?.trozosPiso,
    enviar(d) { cola = d; vaciar(); },
    seleccion(s) { if (s !== sel) { sel = s; latido(); } },
    async subirEscaneo(piso, cloud, progreso = () => {}) {
      const json = JSON.stringify(piso), tp = Math.ceil(json.length / TROZO);
      for (let i = 0; i < tp; i++) { progreso(`Subiendo el escaneo (${i + 1}/${tp})…`); await F.setDoc(F.doc(db, 'pisos', id, 'escaneo', 'piso_' + i), { t: json.slice(i * TROZO, (i + 1) * TROZO) }); }
      let tn = 0;
      if (cloud) {
        const u = plyCompacto(cloud); tn = Math.ceil(u.length / TROZO);
        for (let i = 0; i < tn; i++) { progreso(`Subiendo la nube de puntos (${i + 1}/${tn})…`); await F.setDoc(F.doc(db, 'pisos', id, 'escaneo', 'nube_' + i), { b: F.Bytes.fromUint8Array(u.slice(i * TROZO, (i + 1) * TROZO)) }); }
      }
      await F.setDoc(raiz, { escaneo: { trozosPiso: tp, trozosNube: tn, subido: Date.now() } }, { merge: true });
      principal = { ...(principal || {}), escaneo: { trozosPiso: tp, trozosNube: tn } };
    },
    cerrar() { unsubs.forEach(u => u()); clearInterval(hb); salir(); }
  };
}
