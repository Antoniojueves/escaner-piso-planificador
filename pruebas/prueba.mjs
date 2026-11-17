// Prueba automática: abre el planificador con el piso de ejemplo y comprueba que todo funciona sin errores.
import { chromium } from 'playwright';
const b = await chromium.launch({ args: ['--use-gl=swiftshader', '--enable-unsafe-swiftshader', '--ignore-gpu-blocklist'] });
let fallos = 0; const ok = (c, m) => { console.log((c ? '✓ ' : '✗ ') + m); if (!c) fallos++; };
for (const [nombre, vp] of [['ordenador', { width: 1280, height: 800 }], ['móvil', { width: 390, height: 844 }]]) {
  const pg = await b.newPage({ viewport: vp }); const errores = [];
  pg.on('pageerror', e => errores.push(String(e)));
  await pg.goto('http://localhost:8000/index.html'); await pg.waitForTimeout(3000);
  await pg.click('#demo2'); await pg.waitForTimeout(4000);
  const r = await pg.evaluate(async () => {
    const P = window.__planner; P.setRoom(0);
    const ps = [...P.products().values()], p = ps.find(x => x.fam === 'sofa' && x.acabados?.length);
    const it = P.addItem(p.id, 0, 1, 1, 0, { acabado: p.acabados[0].id }); P.select(it);
    const usdz = await P.exportarAR();
    return { muebles: P.items().length, catalogo: ps.length, usdz: usdz ? usdz.length : 0 };
  });
  ok(r.catalogo > 1500, `${nombre}: catálogo cargado (${r.catalogo})`);
  ok(r.muebles > 5, `${nombre}: piso de ejemplo construido (${r.muebles} muebles)`);
  ok(r.usdz > 1000, `${nombre}: exportación para realidad aumentada`);
  ok(errores.length === 0, `${nombre}: sin errores${errores.length ? ': ' + errores.join(' | ') : ''}`);
  await pg.close();
}
await b.close(); process.exit(fallos ? 1 : 0);
