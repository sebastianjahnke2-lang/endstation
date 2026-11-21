// Die Grundregeln eines Halts als kleine Szenen: Gehen, Kontrollieren, Platzwechsler, Halt.

import test from 'node:test';
import assert from 'node:assert/strict';
import { haltZug, nachbarAufSeite, KONTROLLSTART } from '../src/kern/kontrolle.js';
import { haltNach } from '../src/kern/pruefung.js';

const typen = (e) => e.map((x) => x.typ);
const tipp = (x, y) => ({ tipp: 'feld', x, y });
// ein Halt wie früher Halt 1: der Platzwechsler sitzt in Reihe 5
const HALT_EINS = { farben: { P: 'g' }, zuege: 12, sitze: ['..|.d', '.c|..', 'b.|Z.', '..|.e', '.f|P.', 'a.|..'] };
function halt(ordnung) {
  const z = haltNach(ordnung || HALT_EINS);
  return { zustand: z, act: (h) => haltZug(z, h) };
}
const schwarz = (z) => z.fahrgaeste.find((f) => f.schwarz);

test('Anfang: unten im Gang, volle Strecke', () => {
  const { zustand: z } = halt();
  assert.equal(z.k.y, KONTROLLSTART);
  assert.equal(z.rest, 12);
  assert.equal(z.status, 'faehrt');
});

test('Gehen nur im Gang, nicht in die Toilette, nicht unter den Wagen. Ungültiges kostet nichts', () => {
  const spiel = halt();
  assert.deepEqual(spiel.act('runter'), []);
  assert.deepEqual(spiel.act('links'), [], 'in Reihe 7 sitzt niemand');
  assert.deepEqual(spiel.act(tipp(0, 1)), [], 'zu weit weg');
  assert.equal(spiel.zustand.rest, 12);
  for (let i = 0; i < 6; i++) spiel.act('hoch');
  assert.equal(spiel.zustand.k.y, 1);
  assert.equal(spiel.act('hoch').length, 0);
});

test('Jeder Zug kürzt die Strecke um eins, auch Warten', () => {
  const spiel = halt();
  assert.deepEqual(typen(spiel.act('warten')), ['warten', 'strecke']);
  assert.equal(spiel.zustand.rest, 11);
});

test('Platzwechsler: In der Reihe daneben setzt er sich zwei Reihen weiter weg, danach bleibt er einen Zug', () => {
  const spiel = halt();
  const w = spiel.act('hoch').find((x) => x.typ === 'wechselt');
  assert.deepEqual([w.von, w.nach], [{ x: 3, y: 5 }, { x: 3, y: 4 }]);
  assert.equal(w.pfad[1].x, 2, 'über den Gang');
  assert.deepEqual(typen(spiel.act('hoch')), ['schritt', 'strecke'], 'er muss sitzen bleiben');
  assert.ok(typen(spiel.act('hoch')).includes('zuckt'), 'in seiner Reihe ist der Gang versperrt');
  assert.deepEqual(typen(spiel.act('rechts')), ['gefangen']);
  assert.equal(spiel.zustand.status, 'gefangen');
});

test('Eine Geste fürs Kontrollieren: Antippen trifft Gang und Fenster, Wischen zur Seite nur den Gang', () => {
  const spiel = halt();
  for (let i = 0; i < 4; i++) spiel.act('hoch'); // Reihe 3: links b am Fenster, rechts der Schlafende am Gang
  assert.equal(nachbarAufSeite(spiel.zustand, 'links'), null);
  assert.deepEqual(spiel.act('links'), []);
  assert.equal(spiel.act(tipp(0, 3)).find((x) => x.typ === 'kontrolle').x, 0);
  assert.deepEqual(spiel.act(tipp(1, 2)), [], 'in einer anderen Reihe: nichts');
});

test('Den Schlafenden zu kontrollieren kostet zwei Züge, danach ist er wach', () => {
  const spiel = halt();
  for (let i = 0; i < 4; i++) spiel.act('hoch');
  const e = spiel.act('rechts');
  assert.equal(e.filter((x) => x.typ === 'strecke').length, 2);
  assert.equal(e.find((x) => x.typ === 'kontrolle').schlief, true);
  assert.equal(spiel.act('rechts').filter((x) => x.typ === 'strecke').length, 1);
});

test('Zwei im Wagen: Nach dem ersten Fang läuft der Zug weiter, erst der zweite beendet den Halt', () => {
  const spiel = halt({ farben: { P: 'g', T: 'b' }, zuege: 12, sitze: ['..|..', '..|..', '..|..', 'a.|.b', '..|.c', 'P.|.T'] });
  spiel.act('hoch'); // Reihe 6: beide neben ihm
  const z = spiel.zustand;
  const t = z.fahrgaeste.find((f) => f.masche === 'wc');
  assert.equal(t.ort, 'sitz');
  const e = spiel.act(tipp(4, 6));
  assert.deepEqual(typen(e).slice(0, 2), ['gefangen', 'strecke'], 'einer erwischt, die Zeit läuft weiter');
  assert.equal(z.status, 'faehrt');
});

test('Hält der Zug, steigt jeder aus, der noch da ist', () => {
  const spiel = halt({ farben: { P: 'g', T: 'b' }, zuege: 3, sitze: ['P.|..', '..|..', '..|..', 'a.|.b', '..|.c', '..|.T'] });
  let e = [];
  for (let i = 0; i < 3; i++) e = spiel.act('warten');
  assert.equal(e.filter((x) => x.typ === 'halt').length, 2);
  assert.equal(spiel.zustand.status, 'entkommen');
  assert.equal(spiel.zustand.entkommenImHalt, 2);
});

test('Gleiche Eingaben ergeben gleichen Verlauf', () => {
  const folge = ['hoch', 'warten', 'links', 'rechts', 'hoch', tipp(2, 4), 'runter', 'hoch', 'hoch', 'rechts', 'hoch'];
  const a = halt();
  const b = halt();
  for (const h of folge) assert.deepEqual(a.act(h), b.act(h));
  assert.deepEqual(a.zustand, b.zustand);
  assert.equal(schwarz(a.zustand).x, schwarz(b.zustand).x);
});
