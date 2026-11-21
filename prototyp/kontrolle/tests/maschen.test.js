// Die zwei neuen Maschen: Scheinschläfer und Toilettengänger. Jede verrät sich nur durch ihr Verhalten.

import test from 'node:test';
import assert from 'node:assert/strict';
import { haltZug, WC_ZUEGE, TOILETTE } from '../src/kern/kontrolle.js';
import { haltNach } from '../src/kern/pruefung.js';

const typen = (e) => e.map((x) => x.typ);
const tipp = (x, y) => ({ tipp: 'feld', x, y });
function halt(sitze, zuege) {
  const z = haltNach({ farben: { P: 'g', T: 'b' }, zuege: zuege || 14, sitze });
  return { z, act: (h) => haltZug(z, h) };
}

test('Scheinschläfer: sieht aus wie ein Schlafender, hebt den Kopf, sobald ihm der Kontrolleur den Rücken zudreht', () => {
  const { z, act } = halt(['a.|..', '..|..', 'Z.|.c', '..|..', '.H|..', '..|d.']);
  const schein = z.fahrgaeste.find((f) => f.masche === 'schein');
  const echt = z.fahrgaeste.find((f) => f.schlaeft);
  assert.equal(schein.farbe, 'z', 'dieselbe Gestalt wie der Schlafende');
  assert.equal(schein.farbe, echt.farbe);
  assert.ok(!typen(act('hoch')).includes('kopfHoch'), 'Reihe 6: er sitzt vor dem Kontrolleur');
  assert.ok(!typen(act('hoch')).includes('kopfHoch'), 'Reihe 5: neben ihm');
  const e = act('hoch'); // Reihe 4: er ist hinter dem Kontrolleur
  assert.deepEqual(e.filter((x) => x.typ === 'kopfHoch').map((x) => x.nr), [schein.nr], 'nur er, nie der echte Schlafende');
  // umgedreht: Er ist wieder vor dem Kontrolleur und schläft scheinbar
  assert.ok(!typen(act('runter')).includes('kopfHoch'));
  // ihn zu kontrollieren kostet einen Zug, und er ist erwischt
  assert.deepEqual(typen(act(tipp(1, 5))), ['gefangen']);
});

test('Scheinschläfer: weiter als drei Reihen hinter dem Kontrolleur hebt er den Kopf nicht', () => {
  const { act } = halt(['..|..', '..|..', 'Z.|.c', '..|..', '..|..', 'H.|d.']);
  const kopf = [];
  for (let i = 0; i < 6; i++) kopf.push(typen(act('hoch')).includes('kopfHoch'));
  assert.deepEqual(kopf, [false, true, true, true, false, false]);
});

test('Toilettengänger: zwei Reihen unter ihm steht er auf und geht zur Toilette, sein Platz bleibt frei', () => {
  const { z, act } = halt(['a.|..', '..|..', 'T.|.c', '..|..', '.Z|..', '..|d.']);
  const t = z.fahrgaeste.find((f) => f.masche === 'wc');
  assert.ok(!typen(act('hoch')).includes('toilette'), 'Reihe 6: drei Reihen weg');
  const e = act('hoch'); // Reihe 5: zwei Reihen unter ihm
  const w = e.find((x) => x.typ === 'toilette');
  assert.ok(w);
  assert.deepEqual(w.pfad[w.pfad.length - 1], TOILETTE);
  assert.equal(t.ort, 'wc');
  assert.deepEqual([t.x, t.y], [0, 3], 'sein Platz bleibt seiner');
  act('hoch');
  act('hoch'); // Reihe 3: sein Platz ist leer, antippen geht nicht
  assert.deepEqual(act(tipp(0, 3)), []);
});

test('Toilettengänger: Wer vor der Tür wartet, erwischt ihn, wenn er herauskommt, und bezahlt mit Zügen', () => {
  // er sitzt weit vorn: Der Kontrolleur ist schnell an der Tür und muss dort warten
  const { z, act } = halt(['T.|..', 'a.|..', '..|.c', '..|..', '.Z|..', '..|d.'], 16);
  for (let i = 0; i < 4; i++) act('hoch'); // Reihe 3: zwei unter ihm, er geht
  const t = z.fahrgaeste.find((f) => f.masche === 'wc');
  assert.equal(t.ort, 'wc');
  const seit = z.rest;
  act('hoch');
  act('hoch'); // Reihe 1, vor der Tür
  assert.equal(z.k.y, 1);
  let gefangen = null;
  let gewartet = 0;
  while (z.status === 'faehrt' && gewartet < 10) {
    gefangen = act('warten').find((x) => x.typ === 'gefangen') || gefangen;
    gewartet += 1;
  }
  assert.ok(gefangen && gefangen.tuer, 'erwischt an der Tür');
  assert.ok(gewartet >= 1, 'man muss warten');
  assert.equal(seit - z.rest, WC_ZUEGE, 'er kommt nach genau so vielen Zügen heraus');
  assert.equal(z.status, 'gefangen');
});

test('Toilettengänger: Er kommt erst zurück, wenn der Kontrolleur vorbei ist', () => {
  const { z, act } = halt(['a.|..', '..|..', 'T.|.c', '..|..', '.Z|..', '..|d.'], 20);
  act('hoch');
  act('hoch'); // er geht, Kontrolleur in Reihe 5
  const t = z.fahrgaeste.find((f) => f.masche === 'wc');
  // der Kontrolleur geht nach vorn bis Reihe 2: Er bleibt drin
  for (let i = 0; i < 3; i++) assert.ok(!typen(act('hoch')).includes('zurueck'));
  assert.equal(t.ort, 'wc');
  // umdrehen und nach hinten gehen: Erst wenn der Kontrolleur unter seinem Platz ist, kommt er zurück
  const e1 = act('runter'); // Reihe 3: auf Höhe seines Platzes
  assert.ok(!typen(e1).includes('zurueck'));
  const e2 = act('runter'); // Reihe 4: vorbei
  assert.ok(typen(e2).includes('zurueck'), typen(e2).join(','));
  assert.equal(t.ort, 'sitz');
});
