// Auslieferung des Prototyps "Falsche Farben": eine aktuelle index.html, die nichts nachlädt
// und die iPhone-Vorgaben des Hauptspiels erfüllt.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { baueFarben, FARBENZIEL } from '../build.js';
import { baue } from '../../../build.js';
import { bauePlatz } from '../../freier-platz/build.js';
import { baueKontrolle } from '../../kontrolle/build.js';

const gebaut = baueFarben();
const skript = gebaut.slice(gebaut.indexOf('<script>'));

test('Falsche Farben: index.html entspricht dem Stand der Quellen', () => {
  assert.ok(readFileSync(FARBENZIEL, 'utf8') === gebaut, 'prototyp/falsche-farben/index.html ist veraltet: npm run build');
});

test('Falsche Farben: lädt nichts nach, spricht mit keinem Netz, merkt sich nichts', () => {
  const verboten = [
    [/https?:\/\//i, 'Adresse mit http'],
    [/\b(?:src|href)\s*=\s*["'](?!data:|#)/i, 'Verweis auf eine andere Datei'],
    [/@import|url\(/i, 'CSS lädt etwas nach'],
    [/\bfetch\s*\(|XMLHttpRequest|WebSocket|EventSource|sendBeacon|\bimport\s*\(/, 'Netzwerkzugriff'],
    [/serviceWorker/, 'Service Worker'],
  ];
  for (const [muster, was] of verboten) {
    const treffer = gebaut.match(muster);
    assert.equal(treffer, null, `${was}: "${treffer && treffer[0]}"`);
  }
  assert.equal(gebaut.match(/localStorage/), null, 'merkt sich nichts');
});

test('Falsche Farben: Schrift nur als Punktmatrix, iPhone-Vorgaben, Ton erst nach einer Eingabe', () => {
  assert.equal(gebaut.match(/\b(?:fillText|strokeText)\s*\(/), null);
  assert.match(gebaut, /<meta name="viewport"[^>]*viewport-fit=cover/);
  for (const seite of ['top', 'right', 'bottom', 'left']) assert.ok(gebaut.includes(`env(safe-area-inset-${seite}`));
  assert.ok(!/height:\s*100vh/.test(gebaut));
  for (const regel of ['touch-action: none', 'overscroll-behavior: none', '-webkit-user-select: none']) assert.ok(gebaut.includes(regel), regel);
  assert.equal(gebaut.match(/\bvibrate\b/), null);
  assert.equal(skript.match(/new Klasse\(\)/g).length, 1);
});

test('Falsche Farben: nur Sprachmittel, die Safari seit iOS 13 kennt, Zufall nur für den Neustart', () => {
  const zuNeu = [/\(\?<[=!]/, /\?\.[A-Za-z_(\[]/, /\?\?/, /\bstructuredClone\b/, /\.replaceAll\(/, /\.at\(/, /\bObject\.hasOwn\b/];
  for (const muster of zuNeu) assert.equal(skript.match(muster), null, String(muster));
  assert.equal(skript.match(/Math\.random|Date\.now|new Date/), null);
  // der einzige Zufall von außen: ein Seed beim Öffnen, er wählt die Abende
  assert.equal(skript.match(/getRandomValues/g).length, 1);
});

test('Falsche Farben: Hauptspiel und die anderen Prototypen bleiben unberührt', () => {
  for (const html of [baue(), bauePlatz(), baueKontrolle()]) assert.ok(!html.includes('SCHLUSSSAETZE'));
});
