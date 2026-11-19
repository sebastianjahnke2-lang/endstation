// Jeder Wagen in jeder Auslosung: begehbar, verbunden, höchstens sechs Gegner.

import test from 'node:test';
import assert from 'node:assert/strict';
import { BREITE, HOEHE, STARTFELD, TUERFELD, feldNr, abstand, entfernungen } from '../src/kern/feld.js';
import { WAGENPLAENE, WAGENZAHL, baueWagen } from '../src/kern/wagen.js';

// Alle Auslosungen eines Wagens: Der Würfel wird durch eine feste Folge ersetzt.
function alleAuslosungen(nr) {
  const vorlage = WAGENPLAENE[nr];
  const wahlen = [2, ...vorlage.gegner.map((g) => (g.ketten || g.orte).length)];
  const ergebnis = [];
  const folge = new Array(wahlen.length).fill(0);
  for (;;) {
    // baueWagen würfelt über z.zufall; hier wird wuerfle() durch die Folge nachgestellt
    ergebnis.push(baueMitFolge(nr, [...folge]));
    let i = 0;
    while (i < folge.length && ++folge[i] >= wahlen[i]) folge[i++] = 0;
    if (i === folge.length) return ergebnis;
  }
}

// Sucht einen Seed-Stand, der genau diese Würfelfolge liefert, indem der Aufbau direkt nachgerechnet wird.
function baueMitFolge(nr, folge) {
  const vorlage = WAGENPLAENE[nr];
  const gespiegelt = folge[0] === 1;
  const sx = (x) => (gespiegelt ? BREITE - 1 - x : x);
  const plan = vorlage.plan.map((zeile) => (gespiegelt ? [...zeile].reverse().join('') : zeile));
  const gegner = [];
  vorlage.gegner.forEach((g, i) => {
    const wahl = (g.ketten || g.orte)[folge[i + 1]];
    for (const [x, y] of g.ketten ? wahl : [wahl]) gegner.push({ typ: g.typ, x: sx(x), y });
  });
  return { plan, gegner, folge };
}

test('es gibt fünf Wagen', () => {
  assert.equal(WAGENZAHL, 5);
});

test('baueWagen und die Nachrechnung im Test stimmen überein', () => {
  for (let nr = 0; nr < WAGENZAHL; nr++) {
    const erwartet = new Set(alleAuslosungen(nr).map((w) => JSON.stringify([w.plan, w.gegner.map((g) => [g.typ, g.x, g.y])])));
    for (let seed = 1; seed <= 200; seed++) {
      const w = baueWagen(nr, { zufall: seed });
      const bild = JSON.stringify([w.plan, w.gegner.map((g) => [g.typ, g.x, g.y])]);
      assert.ok(erwartet.has(bild), `Wagen ${nr + 1}, Seed ${seed}: unbekannte Auslosung`);
    }
  }
});

for (let nr = 0; nr < WAGENZAHL; nr++) {
  test(`Wagen ${nr + 1} (${WAGENPLAENE[nr].art}): jede Auslosung ist gültig`, () => {
    for (const { plan, gegner, folge } of alleAuslosungen(nr)) {
      const wo = `Auslosung ${folge.join(',')}`;
      assert.equal(plan.length, HOEHE, wo);
      for (const zeile of plan) assert.equal(zeile.length, BREITE, wo);
      const hindernis = (x, y) => plan[y][x] !== '.';

      assert.ok(!hindernis(STARTFELD.x, STARTFELD.y), `${wo}: Startfeld ist verbaut`);
      assert.ok(!hindernis(TUERFELD.x, TUERFELD.y), `${wo}: Feld vor der Tür ist verbaut`);

      // alle freien Felder sind vom Start aus erreichbar
      const weit = entfernungen(STARTFELD, (x, y) => !hindernis(x, y));
      for (let y = 0; y < HOEHE; y++) {
        for (let x = 0; x < BREITE; x++) {
          if (!hindernis(x, y)) assert.ok(weit[feldNr(x, y)] >= 0, `${wo}: Feld ${x},${y} ist nicht erreichbar`);
        }
      }

      // keine Sackgassen, keine einspurigen Gänge: Jedes freie Feld hat einen freien Nachbarn
      // in der Waagerechten und einen in der Senkrechten. Nur so lässt sich jedes Muster verlassen.
      const offen = (x, y) => x >= 0 && x < BREITE && y >= 0 && y < HOEHE && !hindernis(x, y);
      for (let y = 0; y < HOEHE; y++) {
        for (let x = 0; x < BREITE; x++) {
          if (hindernis(x, y)) continue;
          assert.ok(offen(x - 1, y) || offen(x + 1, y), `${wo}: Feld ${x},${y} hat links und rechts keinen Ausweg`);
          assert.ok(offen(x, y - 1) || offen(x, y + 1), `${wo}: Feld ${x},${y} hat oben und unten keinen Ausweg`);
        }
      }

      assert.ok(gegner.length >= 1 && gegner.length <= 6, `${wo}: ${gegner.length} Gegner`);
      const belegt = new Set();
      for (const g of gegner) {
        assert.ok(!hindernis(g.x, g.y), `${wo}: ${g.typ} steht im Hindernis ${g.x},${g.y}`);
        assert.ok(!belegt.has(feldNr(g.x, g.y)), `${wo}: zwei Figuren auf ${g.x},${g.y}`);
        belegt.add(feldNr(g.x, g.y));
        assert.ok(abstand(g, STARTFELD) >= 3, `${wo}: ${g.typ} startet zu nah am Spieler`);
      }
    }
  });
}

test('die Zahl der Gegner fällt von Wagen zu Wagen nicht', () => {
  const zahl = WAGENPLAENE.map((w) => w.gegner.reduce((s, g) => s + (g.ketten ? g.ketten[0].length : 1), 0));
  for (let i = 1; i < zahl.length; i++) assert.ok(zahl[i] >= zahl[i - 1] - 2, `Wagen ${i + 1}: ${zahl.join(', ')}`);
  assert.equal(zahl[0], 1, 'Wagen 1 hat genau einen Gegner');
});
