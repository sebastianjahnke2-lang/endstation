// Prüft das Auslieferungsformat: eine aktuelle index.html, die nichts nachlädt.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { baue, ZIEL } from '../build.js';

const gebaut = baue();

test('index.html entspricht dem Stand von src/', () => {
  const vorhanden = readFileSync(ZIEL, 'utf8');
  assert.ok(vorhanden === gebaut, 'index.html ist veraltet: npm run build');
});

test('index.html lädt nichts nach und spricht mit keinem Netz', () => {
  const verboten = [
    [/https?:\/\//i, 'Adresse mit http'],
    [/\b(?:src|href)\s*=\s*["'](?!data:|#)/i, 'Verweis auf eine andere Datei'],
    [/@import|url\(/i, 'CSS lädt etwas nach'],
    [/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\bimport\s*\(/, 'Netzwerkzugriff'],
  ];
  for (const [muster, was] of verboten) {
    const treffer = gebaut.match(muster);
    assert.equal(treffer, null, `${was}: "${treffer && treffer[0]}"`);
  }
});

// Der Build hängt Module ohne echten Bündler aneinander. Was er nicht kann,
// muss er laut ablehnen, statt still etwas Falsches zu bauen.

import { mkdtempSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { buendle } from '../build.js';

function mitDateien(dateien, pruefung) {
  const ordner = mkdtempSync(join(tmpdir(), 'endstation-build-'));
  try {
    for (const [name, inhalt] of Object.entries(dateien)) writeFileSync(join(ordner, name), inhalt);
    pruefung(join(ordner, 'main.js'));
  } finally {
    rmSync(ordner, { recursive: true, force: true });
  }
}

test('Build: Abhängigkeiten stehen vor dem, der sie braucht', () => {
  mitDateien({
    'main.js': "import { a } from './a.js';\nexport const start = a + 1;\n",
    'a.js': "import { b } from './b.js';\nexport const a = b + 1;\n",
    'b.js': 'export const b = 1;\n',
  }, (einstieg) => {
    const js = buendle(einstieg);
    assert.ok(js.indexOf('const b = 1') < js.indexOf('const a = b + 1'));
    assert.ok(js.indexOf('const a = b + 1') < js.indexOf('const start = a + 1'));
    assert.ok(!/^\s*(?:import|export)\b/m.test(js), 'Importe und Exporte sind entfernt');
  });
});

test('Build: lehnt ab, was er nicht bauen kann', () => {
  const faelle = {
    'doppelter Name': { 'main.js': "import { a } from './a.js';\nconst hilfe = a;\n", 'a.js': 'const hilfe = 1;\nexport const a = hilfe;\n' },
    'umbenannter Import': { 'main.js': "import { a as b } from './a.js';\n", 'a.js': 'export const a = 1;\n' },
    'Standard-Import': { 'main.js': "import a from './a.js';\n", 'a.js': 'export const a = 1;\n' },
    'export default': { 'main.js': 'export default 1;\n' },
    'fehlender Export': { 'main.js': "import { c } from './a.js';\n", 'a.js': 'export const a = 1;\n' },
    'Kreisbezug': { 'main.js': "import { a } from './a.js';\nexport const m = 1;\n", 'a.js': "import { m } from './main.js';\nexport const a = 1;\n" },
    'Syntaxfehler': { 'main.js': 'const x = ;\n' },
  };
  for (const [name, dateien] of Object.entries(faelle)) {
    mitDateien(dateien, (einstieg) => {
      assert.throws(() => buendle(einstieg), undefined, `${name} müsste den Build abbrechen`);
    });
  }
});
