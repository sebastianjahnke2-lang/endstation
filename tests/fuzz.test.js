// Fuzz-Test: viele Fahrten mit Zufallseingaben. Nach jeder Eingabe wird geprüft,
// dass der Zustand stimmt und keine Regel verletzt wurde.

import test from 'node:test';
import assert from 'node:assert/strict';
import { BREITE, HOEHE, TUERFELD, RICHTUNG, RICHTUNGSNAMEN, imFeld, feldNr, entfernungen } from '../src/kern/feld.js';
import { istHindernis, istMarkiert } from '../src/kern/lage.js';
import { erzeugeSpiel, HERZEN_VOLL, RUHE_VOLL } from '../src/kern/spiel.js';
import { GEGNERWERTE } from '../src/kern/gegner.js';
import { WAGENZAHL } from '../src/kern/wagen.js';
import { BOTS } from './bots.js';

const AKTIONEN = [...RICHTUNGSNAMEN, 'warten'];

function zufallsquelle(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function pruefeZustand(z, wo) {
  const s = z.spieler;
  assert.ok(imFeld(s.x, s.y) && !istHindernis(z, s.x, s.y), `${wo}: Spieler steht falsch (${s.x},${s.y})`);
  assert.ok(s.herzen >= 0 && s.herzen <= HERZEN_VOLL, `${wo}: Herzen ${s.herzen}`);
  assert.ok(s.ruhe >= 0 && s.ruhe <= RUHE_VOLL, `${wo}: Ruhe ${s.ruhe}`);
  assert.ok(z.gegner.length <= 6, `${wo}: ${z.gegner.length} Gegner gleichzeitig`);
  assert.equal(z.status === 'tot', s.herzen === 0, `${wo}: Status ${z.status} bei ${s.herzen} Herzen`);

  const belegt = new Map([[feldNr(s.x, s.y), 'Spieler']]);
  for (const g of z.gegner) {
    assert.ok(imFeld(g.x, g.y) && !istHindernis(z, g.x, g.y), `${wo}: ${g.typ} steht falsch (${g.x},${g.y})`);
    assert.ok(!belegt.has(feldNr(g.x, g.y)), `${wo}: ${g.typ} überlappt mit ${belegt.get(feldNr(g.x, g.y))} auf ${g.x},${g.y}`);
    belegt.set(feldNr(g.x, g.y), g.typ);
    assert.ok(g.hp >= 1 && g.hp <= GEGNERWERTE[g.typ].hp, `${wo}: ${g.typ} mit ${g.hp} HP`);
    if (g.ansage) {
      assert.ok(g.ansage.length > 0, `${wo}: leere Ansage`);
      for (const f of g.ansage) {
        assert.ok(imFeld(f.x, f.y) && !istHindernis(z, f.x, f.y), `${wo}: Ansage außerhalb (${f.x},${f.y})`);
        // mit einem Schritt verlassbar: ein Nachbarfeld im Wagen gehört nicht zum selben Muster
        const ausweg = RICHTUNGSNAMEN.some((n) => {
          const x = f.x + RICHTUNG[n].x;
          const y = f.y + RICHTUNG[n].y;
          return imFeld(x, y) && !g.ansage.some((m) => m.x === x && m.y === y);
        });
        assert.ok(ausweg, `${wo}: Muster von ${g.typ} lässt sich bei ${f.x},${f.y} nicht verlassen`);
      }
    }
  }

  // Steht der Spieler auf Rot, gibt es für jedes Muster einen Schritt hinaus: ein Nachbarfeld
  // ohne Hindernis, das nicht zum Muster gehört und auf dem nicht der Angreifer selbst steht.
  for (const g of z.gegner) {
    if (!g.ansage || !g.ansage.some((f) => f.x === s.x && f.y === s.y)) continue;
    const ausweg = RICHTUNGSNAMEN.some((n) => {
      const x = s.x + RICHTUNG[n].x;
      const y = s.y + RICHTUNG[n].y;
      return imFeld(x, y) && !istHindernis(z, x, y) && !(g.x === x && g.y === y) && !g.ansage.some((m) => m.x === x && m.y === y);
    });
    assert.ok(ausweg, `${wo}: Aus dem Muster von ${g.typ} führt bei ${s.x},${s.y} kein Schritt hinaus`);
  }

  // Tür immer erreichbar, alle freien Felder verbunden
  const weit = entfernungen(TUERFELD, (x, y) => !istHindernis(z, x, y));
  for (let y = 0; y < HOEHE; y++) {
    for (let x = 0; x < BREITE; x++) {
      if (!istHindernis(z, x, y)) assert.ok(weit[feldNr(x, y)] >= 0, `${wo}: von ${x},${y} führt kein Weg zur Tür`);
    }
  }
  assert.equal(z.tuerOffen, z.gegner.length === 0 || z.status === 'halt' ? z.tuerOffen : false, `${wo}: Tür offen trotz Gegnern`);
  if (z.status === 'faehrt' && z.gegner.length === 0) assert.equal(z.tuerOffen, true, `${wo}: Tür zu ohne Gegner`);
}

function eineFahrt(seed, waehle, optionen) {
  const spiel = erzeugeSpiel(seed, optionen);
  const z = spiel.zustand;
  pruefeZustand(z, `Seed ${seed}, Anfang`);
  for (let i = 0; i < 400 && z.status === 'faehrt'; i++) {
    const aktion = waehle(z);
    const wo = `Seed ${seed}, Eingabe ${i} (${aktion}), Wagen ${z.wagenNr + 1}`;
    const vorher = JSON.stringify(z);
    const alt = { herzen: z.spieler.herzen, ruhe: z.spieler.ruhe, x: z.spieler.x, y: z.spieler.y, wagenNr: z.wagenNr, zug: z.zug };
    const rotVorher = [];
    for (let y = 0; y < HOEHE; y++) for (let x = 0; x < BREITE; x++) if (!istHindernis(z, x, y) && istMarkiert(z, x, y)) rotVorher.push(feldNr(x, y));

    const ereignisse = spiel.act(aktion);
    const typen = ereignisse.map((e) => e.typ);

    if (typen[0] === 'ungueltig') {
      assert.equal(JSON.stringify(z), vorher, `${wo}: ungültige Eingabe hat etwas verändert`);
      continue;
    }
    assert.equal(z.zug, alt.zug + 1, `${wo}: Zugzähler`);
    pruefeZustand(z, wo);
    if (typen.includes('wagenwechsel') || typen.includes('halt')) {
      assert.equal(z.spieler.herzen, alt.herzen, `${wo}: Herzen beim Wagenwechsel`);
      continue;
    }

    // kein Angriff ohne Ankündigung, höchstens ein Herz je Zug
    const verlust = alt.herzen - z.spieler.herzen;
    assert.ok(verlust === 0 || verlust === 1, `${wo}: ${verlust} Herzen verloren`);
    const standAufRot = rotVorher.includes(feldNr(z.spieler.x, z.spieler.y));
    if (verlust === 1) {
      assert.ok(standAufRot, `${wo}: Treffer auf einem Feld, das nicht angekündigt war`);
      assert.equal(z.spieler.ruhe, 0, `${wo}: Ruhe nach Treffer`);
      assert.ok(typen.includes('treffer'), `${wo}: Treffer ohne Ereignis`);
    } else {
      assert.ok(!typen.includes('treffer'), `${wo}: Ereignis Treffer ohne Verlust`);
      const gewinn = z.spieler.ruhe - alt.ruhe;
      const ausgewichen = rotVorher.includes(feldNr(alt.x, alt.y)) && !standAufRot && (alt.x !== z.spieler.x || alt.y !== z.spieler.y);
      assert.equal(typen.includes('ausgewichen'), ausgewichen, `${wo}: Ausweichen falsch erkannt`);
      assert.equal(gewinn, ausgewichen && alt.ruhe < RUHE_VOLL ? 1 : 0, `${wo}: Ruhe von ${alt.ruhe} auf ${z.spieler.ruhe}`);
    }
    // Ereignisse stehen in der Reihenfolge ihrer Phasen
    const phasen = ereignisse.map((e) => e.phase);
    assert.deepEqual(phasen, [...phasen].sort((a, b) => a - b), `${wo}: Phasen durcheinander`);
  }
  return z;
}

test('Fuzz: 400 Fahrten mit reinem Zufall', () => {
  for (let seed = 1; seed <= 400; seed++) {
    const zufall = zufallsquelle(seed * 7919);
    eineFahrt(seed, () => AKTIONEN[Math.floor(zufall() * AKTIONEN.length)]);
  }
});

test('Fuzz: jeder Wagen als Start, mit reinem Zufall', () => {
  for (let wagen = 0; wagen < WAGENZAHL; wagen++) {
    for (let seed = 1; seed <= 150; seed++) {
      const zufall = zufallsquelle(seed * 104729 + wagen);
      eineFahrt(seed, () => AKTIONEN[Math.floor(zufall() * AKTIONEN.length)], { startWagen: wagen });
    }
  }
});

test('Fuzz: Bots mit vielen Zufallszügen kommen weit und halten alle Regeln ein', () => {
  const erreicht = new Set();
  for (const name of Object.keys(BOTS)) {
    for (let seed = 1; seed <= 150; seed++) {
      const zufall = zufallsquelle(seed * 31 + name.length);
      const merk = {};
      const z = eineFahrt(seed, (zustand) => (zufall() < 0.3 ? AKTIONEN[Math.floor(zufall() * AKTIONEN.length)] : BOTS[name](zustand, merk)));
      for (let nr = 0; nr <= z.wagenNr; nr++) erreicht.add(nr);
      if (z.status === 'halt') erreicht.add('halt');
    }
  }
  for (let nr = 0; nr < WAGENZAHL; nr++) assert.ok(erreicht.has(nr), `der Fuzz-Test hat Wagen ${nr + 1} nie gesehen`);
  assert.ok(erreicht.has('halt'), 'der Fuzz-Test hat den Halt nie gesehen');
});
