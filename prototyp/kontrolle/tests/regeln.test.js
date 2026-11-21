// Jede Regel des Wagens als kleine Szene.

import test from 'node:test';
import assert from 'node:assert/strict';
import { nachbarAufSeite, KONTROLLSTART } from '../src/kern/kontrolle.js';
import { erzeugeKontrolle } from '../src/kern/durchgang.js';
import { HALTE, ZUEGE_BIS_HALT } from '../src/kern/halte.js';

const typen = (e) => e.map((x) => x.typ);
const tipp = (x, y) => ({ tipp: 'feld', x, y });
const schwarz = (z) => z.fahrgaeste.find((f) => f.schwarz);

test('Sitzordnungen: etwa acht Fahrgäste, genau einer ohne Fahrkarte, genau ein Schlafender', () => {
  for (const halt of HALTE) {
    const plan = halt.sitze;
    assert.equal(plan.length, 6);
    const zeichen = plan.join('').replace(/[.|]/g, '');
    // seine Farbe trägt in diesem Halt sonst niemand
    assert.ok(!zeichen.includes(halt.farbe), 'zwei Fahrgäste in seiner Farbe');
    assert.ok(zeichen.length >= 7 && zeichen.length <= 9, `${zeichen.length} Fahrgäste`);
    assert.equal(zeichen.split('S').length - 1, 1);
    assert.equal(zeichen.split('Z').length - 1, 1);
    for (const zeile of plan) assert.equal(zeile[2], '|');
  }
});

test('Am Aussehen ist er nicht zu erkennen: Seine Farbe wechselt und kommt anderswo bei anderen vor', () => {
  const farben = HALTE.map((h) => h.farbe);
  assert.equal(new Set(farben).size, HALTE.length, 'jeder Halt eine andere Farbe');
  for (const farbe of farben) {
    const anderswo = HALTE.some((h) => h.farbe !== farbe && h.sitze.join('').includes(farbe));
    assert.ok(anderswo, `Farbe ${farbe} trägt nur der Fahrgast ohne Fahrkarte`);
  }
});

test('Anfang: unten im Gang, volle Strecke, alle sitzen', () => {
  const { zustand: z } = erzeugeKontrolle();
  assert.equal(z.k.y, KONTROLLSTART);
  assert.equal(z.rest, ZUEGE_BIS_HALT);
  assert.equal(z.status, 'faehrt');
});

test('Gehen nur im Gang, nicht in die Tür, nicht unter den Wagen. Ungültiges kostet nichts', () => {
  const spiel = erzeugeKontrolle();
  assert.deepEqual(spiel.act('runter'), []);
  assert.deepEqual(spiel.act('links'), [], 'in Reihe 7 sitzt niemand');
  assert.deepEqual(spiel.act(tipp(0, 1)), [], 'zu weit weg');
  assert.equal(spiel.zustand.rest, ZUEGE_BIS_HALT);
  for (let i = 0; i < 6; i++) spiel.act('hoch');
  assert.equal(spiel.zustand.k.y, 1);
  assert.equal(spiel.act('hoch').length, 0, 'in Reihe 0 ist die Tür');
});

test('Jeder Zug kürzt die Strecke um eins, auch Warten', () => {
  const spiel = erzeugeKontrolle();
  const e = spiel.act('warten');
  assert.deepEqual(typen(e), ['warten', 'strecke']);
  assert.equal(spiel.zustand.rest, ZUEGE_BIS_HALT - 1);
});

test('Platzwechsler: In der Reihe daneben steht er auf und setzt sich zwei Reihen weiter weg', () => {
  const spiel = erzeugeKontrolle(); // Halt 1: er sitzt in Reihe 5
  const e = spiel.act('hoch'); // Kontrolleur in Reihe 6
  const w = e.find((x) => x.typ === 'wechselt');
  assert.ok(w, typen(e).join(','));
  assert.deepEqual(w.von, { x: 3, y: 5 });
  assert.deepEqual(w.nach, { x: 3, y: 4 });
  assert.equal(w.pfad[0].x, 3);
  assert.equal(w.pfad[1].x, 2, 'über den Gang');
  assert.ok(Math.abs(w.nach.y - spiel.zustand.k.y) >= 2);
  // alle anderen bleiben sitzen
  assert.equal(e.filter((x) => x.typ === 'wechselt').length, 1);
});

test('Das Umsetzen kostet ihn einen Zug: Im nächsten bleibt er sitzen, auch in der Reihe daneben', () => {
  const spiel = erzeugeKontrolle();
  spiel.act('hoch');
  const e = spiel.act('hoch'); // Reihe 5, er sitzt in Reihe 4
  assert.deepEqual(typen(e), ['schritt', 'strecke']);
  assert.deepEqual([schwarz(spiel.zustand).x, schwarz(spiel.zustand).y], [3, 4]);
});

test('In seiner Reihe ist der Gang versperrt: Er zuckt und bleibt. Dann gefangen', () => {
  const spiel = erzeugeKontrolle();
  spiel.act('hoch');
  spiel.act('hoch');
  const e = spiel.act('hoch'); // Reihe 4
  assert.ok(typen(e).includes('zuckt'));
  const f = nachbarAufSeite(spiel.zustand, 'rechts');
  assert.ok(f.schwarz);
  const g = spiel.act('rechts');
  assert.deepEqual(typen(g), ['gefangen'], 'gefangen: keine weitere Bewegung im Wagen');
  assert.equal(spiel.zustand.status, 'gefangen');
  assert.deepEqual(spiel.zustand.ergebnisse, [true]);
});

test('Ohne Platz weiter weg zuckt er schon in der Reihe daneben', () => {
  const spiel = erzeugeKontrolle();
  for (let i = 0; i < 2; i++) {
    spiel.zustand.status = 'gefangen';
    spiel.act('weiter');
  }
  // Halt 3: er sitzt vorn rechts am Fenster
  assert.equal(spiel.zustand.halt, 2);
  let e = [];
  for (let i = 0; i < 5; i++) e = spiel.act('hoch'); // Reihe 2
  assert.ok(typen(e).includes('zuckt'));
});

test('Eine Kontrolle kostet einen Zug, den Schlafenden zu kontrollieren zwei. Er wacht auf', () => {
  const spiel = erzeugeKontrolle();
  const z = spiel.zustand;
  spiel.act('hoch');
  spiel.act('hoch');
  spiel.act('hoch');
  spiel.act('hoch'); // Reihe 3: links b am Fenster, rechts der Schlafende
  const vorher = z.rest;
  const e = spiel.act('rechts');
  assert.equal(e.filter((x) => x.typ === 'strecke').length, 2);
  assert.equal(z.rest, vorher - 2);
  const k = e.find((x) => x.typ === 'kontrolle');
  assert.equal(k.schlief, true);
  assert.equal(spiel.act('rechts').filter((x) => x.typ === 'strecke').length, 1, 'wach kostet er einen');
  const b = spiel.act('links');
  assert.equal(b.find((x) => x.typ === 'kontrolle').x, 0, 'links ist der Gangplatz frei: der am Fenster');
});

test('Hält der Zug, steigt er aus. Das Ergebnis wird gemerkt, danach der nächste Halt', () => {
  const spiel = erzeugeKontrolle();
  let e = [];
  for (let i = 0; i < ZUEGE_BIS_HALT; i++) e = spiel.act('warten');
  assert.equal(spiel.zustand.status, 'entkommen');
  const h = e.find((x) => x.typ === 'halt');
  assert.ok(h);
  assert.equal(h.tuer.x, 2);
  assert.deepEqual(spiel.act('warten').map((x) => x.typ), ['neuerHalt']);
  assert.equal(spiel.zustand.halt, 1);
  assert.deepEqual(spiel.zustand.ergebnisse, [false]);
});

test('Nach drei Halten: wie viele erwischt. Eine Eingabe beginnt sofort neu', () => {
  const spiel = erzeugeKontrolle();
  for (let halt = 0; halt < 3; halt++) {
    for (let i = 0; i < ZUEGE_BIS_HALT; i++) spiel.act('warten');
    const e = spiel.act('weiter');
    if (halt < 2) assert.equal(e[0].typ, 'neuerHalt');
    else assert.deepEqual(e, [{ typ: 'aus', erwischt: 0, von: 3 }]);
  }
  assert.equal(spiel.zustand.status, 'aus');
  assert.deepEqual(spiel.act('hoch'), [{ typ: 'neuerHalt', halt: 0 }]);
  assert.equal(spiel.zustand.durchgang, 1);
  assert.equal(spiel.zustand.rest, ZUEGE_BIS_HALT);
  assert.deepEqual(spiel.zustand.ergebnisse, []);
});

test('Gleiche Eingaben ergeben gleichen Verlauf', () => {
  const folge = ['hoch', 'warten', 'links', 'rechts', 'hoch', tipp(2, 4), 'runter', 'hoch', 'hoch', 'rechts', 'hoch', 'hoch', 'weiter', 'hoch', 'hoch', 'links'];
  for (const seed of [0, 7, 123456]) {
    const a = erzeugeKontrolle(seed);
    const b = erzeugeKontrolle(seed);
    for (const h of folge) assert.deepEqual(a.act(h), b.act(h));
    // auch über den Neustart mit ausgelosten Ordnungen hinweg
    for (let i = 0; i < 40; i++) assert.deepEqual(a.act('warten'), b.act('warten'));
    assert.ok(a.zustand.durchgang >= 1);
    assert.deepEqual(a.zustand, b.zustand);
  }
});
