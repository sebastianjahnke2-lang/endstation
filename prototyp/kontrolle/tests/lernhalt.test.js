// Der Lernhalt: nur bei der allerersten Fahrt auf einem Gerät, mit jedem ersten Schritt lösbar,
// zählt nicht mit, beginnt neu, wenn die Zeit abläuft.

import test from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeKontrolle } from '../src/kern/durchgang.js';
import { LERNHALT, ZUEGE_BIS_HALT } from '../src/kern/halte.js';
import { ZEIT_ANFANG } from '../src/kern/auslosen.js';
import { kuerzesterFang, hinsehen, haltNach } from '../src/kern/pruefung.js';
import { haltZug, kopiereKontrolle } from '../src/kern/kontrolle.js';

const typen = (e) => e.map((x) => x.typ);
const schwarz = (z) => z.fahrgaeste.find((f) => f.schwarz);

test('drei Fahrgäste, keiner schläft, viel Zeit', () => {
  const z = haltNach(LERNHALT);
  assert.equal(z.fahrgaeste.length, 3);
  assert.ok(z.fahrgaeste.every((f) => !f.schlaeft));
  assert.ok(LERNHALT.zuege > ZUEGE_BIS_HALT && LERNHALT.zuege > ZEIT_ANFANG);
});

test('beim ersten Schritt steht er auf und setzt sich weg, nicht zu verfehlen', () => {
  const spiel = erzeugeKontrolle(1, { lernhalt: true });
  assert.equal(spiel.zustand.lernhalt, true);
  const e = spiel.act('hoch');
  const w = e.find((x) => x.typ === 'wechselt');
  assert.ok(w, typen(e).join(','));
  assert.ok(w.pfad.length >= 3, 'ein sichtbarer Weg durch den Gang');
});

test('danach sitzt er vorn und kommt nicht mehr weg: Er zuckt, wenn man näher kommt', () => {
  const spiel = erzeugeKontrolle(1, { lernhalt: true });
  spiel.act('hoch');
  assert.equal(schwarz(spiel.zustand).y, 1, 'in der vordersten Reihe');
  // selbst wer erst wartet, bis er wieder kann: Er findet keinen Platz mehr
  spiel.act('warten');
  spiel.act('warten');
  const naeher = spiel.act('hoch'); // Reihe 2, neben ihm
  assert.ok(typen(naeher).includes('zuckt'));
  assert.equal(schwarz(spiel.zustand).y, 1);
  const neben = spiel.act('hoch'); // Reihe 1, in seiner Reihe
  assert.ok(typen(neben).includes('zuckt'));
  const s = schwarz(spiel.zustand);
  assert.deepEqual(typen(spiel.act({ tipp: 'feld', x: s.x, y: s.y })), ['gefangen', 'gelernt']);
});

test('mit jedem ersten Schritt lösbar', () => {
  const start = haltNach(LERNHALT);
  const ersteSchritte = ['hoch', 'runter', 'links', 'rechts', 'warten'];
  for (let y = 0; y < 8; y++) for (let x = 0; x < 5; x++) ersteSchritte.push({ tipp: 'feld', x, y });
  for (const erster of ersteSchritte) {
    const z = kopiereKontrolle(start);
    haltZug(z, erster);
    assert.equal(z.status, 'faehrt', JSON.stringify(erster));
    const weg = kuerzesterFang(z);
    assert.ok(weg, `nach ${JSON.stringify(erster)} nicht mehr lösbar`);
    assert.ok(weg.length <= 6, `nach ${JSON.stringify(erster)}: noch ${weg.length} Züge`);
    assert.equal(hinsehen(z), 'gefangen', `nach ${JSON.stringify(erster)}: wer hinsieht, schafft es nicht`);
  }
});

test('läuft die Zeit ab, steigt er aus, und der Lernhalt beginnt neu. Er zählt nicht mit', () => {
  const spiel = erzeugeKontrolle(1, { lernhalt: true });
  let e = [];
  for (let i = 0; i < LERNHALT.zuege; i++) e = spiel.act('warten');
  assert.ok(typen(e).includes('halt'), 'er steigt aus');
  assert.equal(spiel.zustand.status, 'entkommen');
  assert.equal(spiel.zustand.entkommen, 0, 'zählt nicht als Entkommener');
  assert.deepEqual(spiel.act('hoch'), [{ typ: 'neuerHalt', halt: -1 }]);
  assert.equal(spiel.zustand.lernhalt, true);
  assert.equal(spiel.zustand.rest, LERNHALT.zuege);
  assert.equal(spiel.zustand.fahrgaeste.length, 3);
});

test('geschafft: beim Fang das Ereignis "gelernt", mit der nächsten Eingabe beginnt die Schicht', () => {
  const spiel = erzeugeKontrolle(1, { lernhalt: true });
  spiel.act('hoch');
  spiel.act('hoch');
  spiel.act('hoch');
  const s = schwarz(spiel.zustand);
  assert.deepEqual(typen(spiel.act({ tipp: 'feld', x: s.x, y: s.y })), ['gefangen', 'gelernt']);
  assert.equal(spiel.zustand.status, 'gefangen', 'der Lernhalt wartet auf die nächste Eingabe');
  assert.deepEqual(spiel.act('hoch'), [{ typ: 'neuerHalt', halt: 0 }]);
  assert.equal(spiel.zustand.lernhalt, false);
  assert.equal(spiel.zustand.halt, 0);
  assert.equal(spiel.zustand.entkommen, 0);
  assert.equal(spiel.zustand.k.y, 7, 'in der Schicht wieder unten im Gang');
  assert.equal(spiel.zustand.fahrgaeste.length, 8);
});

test('ohne Lernhalt beginnt sofort die Schicht', () => {
  const spiel = erzeugeKontrolle(1, { lernhalt: false });
  assert.equal(spiel.zustand.lernhalt, false);
  assert.equal(spiel.zustand.k.y, 7);
  assert.ok(spiel.zustand.rest <= ZEIT_ANFANG && spiel.zustand.rest >= 8, 'die Zeit des ersten Halts der Schicht');
  assert.equal(spiel.zustand.fahrgaeste.filter((f) => f.schwarz).length, 1);
});
