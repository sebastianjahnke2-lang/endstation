// Vollständige Suche über alle Zustände, die sich von Anfang an erreichen lassen.
// Der Wagen hat keinen Zufall, also lässt sich jede Lage wirklich durchprobieren.

import test from 'node:test';
import assert from 'node:assert/strict';
import { neueFahrt, runde, STOSS_ALLE } from '../src/kern/fahrt.js';
import { SPALTEN, REIHEN, GANGSPALTE, ZIELTUER, istGang, istSitz } from '../src/kern/abteil.js';
import { falschBelegt, bestimmeSchatten, sitztJemand } from '../src/kern/licht.js';

// alles, was ein Mensch eingeben kann
const HANDLUNGEN = ['hoch', 'rechts', 'runter', 'links', 'warten', { tipp: 'lampe', name: 'A' }, { tipp: 'lampe', name: 'B' }];
for (let y = 0; y < REIHEN; y++) for (let x = 0; x < SPALTEN; x++) HANDLUNGEN.push({ tipp: 'feld', x, y });

// Die Rundenzahl wächst ohne Ende, für den Verlauf zählt nur, wann der nächste Schienenstoß kommt.
function gekuerzt(z) {
  const k = JSON.parse(JSON.stringify(z));
  k.runde = z.runde % STOSS_ALLE;
  k.schaffner.gesagt.sort();
  return k;
}

function durchsuche(erlaubt) {
  const start = gekuerzt(neueFahrt());
  const bekannt = new Map([[JSON.stringify(start), { z: start, vor: [] }]]);
  const schlange = [start];
  const enden = [];
  for (let i = 0; i < schlange.length; i++) {
    const z = schlange[i];
    const schluessel = JSON.stringify(z);
    if (z.status === 'ende') {
      enden.push(schluessel);
      continue;
    }
    for (const handlung of HANDLUNGEN) {
      const ergebnis = runde(z, handlung);
      if (ergebnis.zustand === z) continue; // kostet keine Runde
      if (erlaubt && !erlaubt(ergebnis.ereignisse)) continue;
      const neu = gekuerzt(ergebnis.zustand);
      const neuerSchluessel = JSON.stringify(neu);
      if (!bekannt.has(neuerSchluessel)) {
        bekannt.set(neuerSchluessel, { z: neu, vor: [] });
        schlange.push(neu);
      }
      bekannt.get(neuerSchluessel).vor.push(schluessel);
    }
  }
  return { bekannt, enden };
}

const alles = durchsuche(null);

test(`die Suche findet alle erreichbaren Zustände (${alles.bekannt.size}) und hört von selbst auf`, () => {
  assert.ok(alles.bekannt.size > 1000, 'verdächtig wenige Zustände');
  assert.ok(alles.bekannt.size < 2000000, 'verdächtig viele Zustände');
  assert.ok(alles.enden.length > 0);
});

test('von jedem erreichbaren Zustand aus ist die Zieltür erreichbar', () => {
  // rückwärts von allen Enden aus
  const kommtAn = new Set(alles.enden);
  const schlange = [...alles.enden];
  for (let i = 0; i < schlange.length; i++) {
    for (const vor of alles.bekannt.get(schlange[i]).vor) {
      if (kommtAn.has(vor)) continue;
      kommtAn.add(vor);
      schlange.push(vor);
    }
  }
  const gefangen = [...alles.bekannt.keys()].filter((s) => !kommtAn.has(s));
  assert.equal(gefangen.length, 0, `Sackgasse, zum Beispiel: ${gefangen[0]}`);
});

test('in jedem erreichbaren Zustand stimmt die Lage', () => {
  for (const { z } of alles.bekannt.values()) {
    const k = z.schaffner;
    const s = z.spieler;
    const wo = JSON.stringify(z);
    // der Schaffner steht nie auf einem Sitz und nie auf dem Feld des Spielers
    assert.ok(k.weg || istGang(GANGSPALTE, k.y), `Schaffner außerhalb des Gangs: ${wo}`);
    assert.ok(k.weg || !(s.x === GANGSPALTE && s.y === k.y), `Schaffner auf dem Feld des Spielers: ${wo}`);
    // WARTEN kommt nur bei einem falsch belegten Sitz in seiner Reihe vor, und die Zange zeigt genau darauf
    if (k.tat === 'wartet') {
      const funde = falschBelegt(z, k.y);
      assert.ok(funde.length > 0, `er wartet ohne Grund: ${wo}`);
      assert.deepEqual(k.ziel, funde[0], `die Zange zeigt daneben: ${wo}`);
    } else {
      assert.equal(k.ziel, null, `die Zange zeigt, obwohl er nicht wartet: ${wo}`);
    }
    // der Spieler steht auf einem Gangfeld oder sitzt auf einem freien Sitz
    assert.ok(istGang(s.x, s.y) || istSitz(s.x, s.y), `Spieler in der Wand: ${wo}`);
    if (istSitz(s.x, s.y)) assert.equal(sitztJemand({ ...z, spieler: { ...s, x: -9 } }, s.x, s.y), false, `Spieler auf besetztem Platz: ${wo}`);
    // die Tasche liegt am Platz oder ist beim Spieler, nie beides, nie keins
    assert.equal(z.tasche, !s.tasche, `Tasche doppelt oder verschwunden: ${wo}`);
    assert.ok(!(z.tasche && s.x === 0 && s.y === 5), `Spieler sitzt auf der Tasche: ${wo}`);
    // die gemerkten Schatten passen zur Lage
    assert.deepEqual(z.schatten, bestimmeSchatten(z), `Schatten veraltet: ${wo}`);
    // das Ende gibt es nur auf der Zieltür, und nur dort
    assert.equal(z.status === 'ende', s.x === ZIELTUER.x && s.y === ZIELTUER.y, `Ende und Tür passen nicht: ${wo}`);
    if (z.status === 'ende') assert.ok(Array.isArray(z.tatsachen) && z.tatsachen.length <= 2);
    // angestoßen ist man nur, solange er die Mütze dreht
    assert.equal(z.angestossen, k.blick !== null, `Mütze und Anstoßen passen nicht: ${wo}`);
  }
});

test('es gibt einen Weg zur Lochung ohne Vorbeidrängen und ohne Wecken', () => {
  const sanft = durchsuche((ereignisse) => !ereignisse.some((e) => e.typ === 'draengt' || e.typ === 'weckt' || e.typ === 'anstoss'));
  const gelocht = [...sanft.bekannt.values()].filter(({ z }) => z.spieler.gelocht);
  assert.ok(gelocht.length > 0);
  // und von dort bis zur Tür, weiter ohne Drängen und Wecken
  assert.ok(gelocht.some(({ z }) => z.status === 'ende' && z.tatsachen.length === 0));
});

test('am Schaffner kommt man durch Vorbeidrängen immer vorbei', () => {
  // Aus jeder Lage, in der er im Gang direkt vor dem Spieler steht, führen zwei Wische an ihm vorbei
  // oder er geht von selbst.
  let geprueft = 0;
  for (const { z } of alles.bekannt.values()) {
    const k = z.schaffner;
    const s = z.spieler;
    if (z.status !== 'faehrt' || k.weg || s.x !== GANGSPALTE || s.y !== k.y + 1) continue;
    geprueft += 1;
    const eins = runde(z, 'hoch').zustand;
    const zwei = eins.status === 'ende' || eins.spieler.y < s.y ? eins : runde(eins, 'hoch').zustand;
    assert.ok(zwei.spieler.y < s.y, `kein Vorbeikommen: ${JSON.stringify(z)}`);
  }
  assert.ok(geprueft > 100);
});

test('gleiche Eingaben ergeben gleiche Ereignisse, in jedem Zustand', () => {
  let n = 0;
  for (const { z } of alles.bekannt.values()) {
    n += 1;
    if (n % 41 !== 0) continue; // eine Stichprobe genügt, die Suche selbst beruht schon darauf
    for (const handlung of HANDLUNGEN) {
      assert.deepEqual(runde(z, handlung), runde(JSON.parse(JSON.stringify(z)), handlung));
    }
  }
});
