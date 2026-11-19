// Prüft das Auslieferungsformat des Prototyps: eine aktuelle index.html, die nichts nachlädt
// und alle iPhone-Vorgaben des Hauptspiels erfüllt.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { bauePlatz, PLATZZIEL } from '../build.js';
import { baue } from '../../../build.js';

const gebaut = bauePlatz();

test('Prototyp: index.html entspricht dem Stand der Quellen', () => {
  const vorhanden = readFileSync(PLATZZIEL, 'utf8');
  assert.ok(vorhanden === gebaut, 'prototyp/freier-platz/index.html ist veraltet: npm run build');
});

test('Prototyp: lädt nichts nach und spricht mit keinem Netz', () => {
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
});

test('Prototyp: alles Geschriebene läuft über die Punktmatrix-Schrift', () => {
  assert.equal(gebaut.match(/\b(?:fillText|strokeText)\s*\(/), null);
});

test('Prototyp: iPhone-Vorgaben wie im Hauptspiel', () => {
  assert.match(gebaut, /<meta name="viewport"[^>]*viewport-fit=cover/, 'viewport-fit=cover fehlt');
  for (const seite of ['top', 'right', 'bottom', 'left']) {
    assert.ok(gebaut.includes(`env(safe-area-inset-${seite}`), `Abstand für safe-area-inset-${seite} fehlt`);
  }
  const fest = gebaut.indexOf('height: 100%;');
  const dynamisch = gebaut.indexOf('height: 100dvh');
  assert.ok(fest >= 0 && dynamisch > fest, 'dynamische Höhe braucht einen Fallback davor');
  assert.ok(!/height:\s*100vh/.test(gebaut), '100vh schneidet in Safari unten ab');
  for (const regel of ['touch-action: none', 'overscroll-behavior: none', '-webkit-user-select: none', '-webkit-touch-callout: none']) {
    assert.ok(gebaut.includes(regel), `${regel} fehlt`);
  }
  for (const sperre of ["'touchmove'", "'gesturestart'", "'dblclick'"]) assert.ok(gebaut.includes(sperre), `Sperre für ${sperre} fehlt`);
  assert.equal(gebaut.match(/\bvibrate\b/), null, 'auf Vibration darf sich nichts verlassen');
  // der Tonkontext entsteht nur in wecke(), und wecke() hängt nur an Eingaben
  assert.equal(gebaut.match(/new Klasse\(\)/g).length, 1);
  assert.equal(gebaut.match(/\bautoplay\b/), null);
});

test('Prototyp: nur Sprachmittel, die Safari seit iOS 13 kennt', () => {
  const skript = gebaut.slice(gebaut.indexOf('<script>'));
  const zuNeu = [
    [/\?\.[A-Za-z_(\[]/, 'optionale Verkettung ?.'],
    [/\?\?/, 'Nullish-Operator ??'],
    [/\bstructuredClone\b/, 'structuredClone'],
    [/\.replaceAll\(/, 'replaceAll'],
    [/\.at\(/, 'Array.at'],
    [/\bObject\.hasOwn\b/, 'Object.hasOwn'],
  ];
  for (const [muster, was] of zuNeu) {
    const treffer = skript.match(muster);
    assert.equal(treffer, null, `${was}: "${treffer && treffer[0]}"`);
  }
});

test('Prototyp: kein Zufall, und nichts hängt von der Uhrzeit ab', () => {
  const skript = gebaut.slice(gebaut.indexOf('<script>'));
  assert.equal(skript.match(/Math\.random|Date\.now|new Date/), null);
});

test('Prototyp: das Hauptspiel bleibt unberührt', () => {
  const haupt = baue();
  assert.ok(!haupt.includes('PLATZTEXTE') && !haupt.includes('freier-platz'), 'der Prototyp steckt im Hauptspiel');
  // eigener Schlüssel im Speicher
  assert.ok(gebaut.includes("'endstation.freier-platz.1'"));
  assert.ok(!gebaut.includes("'endstation.1'"));
});
