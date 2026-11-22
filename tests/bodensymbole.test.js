// Bodensymbole: Jedes kommt in einer Fahrt zuerst an seiner Einführungsstelle vor,
// und was man betritt, antwortet im selben Zug.
//   Angebot (Prüfungssymbol)   zuerst in Wagen 1 auf dem Feld vor der Tür, mit "Erst aussteigen lassen"
//   rotes Feld (Ankündigung)   zuerst in Wagen 1, beim langsamen Pendler, mit dem Hinweis "Ausweichen"
//   Antworten und "Noch mal"   nur im Speisewagen, beim Begleiter

import test from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeSpiel } from '../src/kern/spiel.js';
import { EINFUEHRUNG, istEinfuehrung, stelleAngebot } from '../src/kern/fahrkarte.js';
import { TUERFELD } from '../src/kern/feld.js';
import { istMarkiert } from '../src/kern/lage.js';
import { BOTS } from './bots.js';

function beobachteFahrt(seed, bot, optionen = {}) {
  const spiel = erzeugeSpiel(seed, optionen);
  const z = spiel.zustand;
  const merk = {};
  const erst = {};
  const sieh = () => {
    if (z.angebot && !erst.angebot) erst.angebot = { nr: z.wagenNr, x: z.angebot.x, y: z.angebot.y, id: z.angebot.id };
    if (z.gegner.some((g) => g.ansage && g.ansage.length) && erst.rot === undefined) erst.rot = z.wagenNr;
    if (z.begleiter && (z.begleiter.antworten || z.begleiter.wiederholen)) assert.ok(z.wagen.sicher, 'Antwort außerhalb des Speisewagens');
  };
  sieh();
  for (let i = 0; i < 1500 && z.status === 'faehrt'; i++) {
    let e = spiel.act(bot(z, merk));
    if (e.length === 1 && e[0].typ === 'ungueltig') e = spiel.act('warten');
    sieh();
  }
  return erst;
}

test('Bodensymbole: In einer ersten Fahrt liegt das erste Angebot in Wagen 1 vor der Tür', () => {
  for (const bot of Object.values(BOTS)) {
    for (let seed = 1; seed <= 60; seed++) {
      const erst = beobachteFahrt(seed, bot);
      assert.deepEqual(erst.angebot, { nr: 0, x: TUERFELD.x, y: TUERFELD.y, id: EINFUEHRUNG }, `Seed ${seed}`);
    }
  }
});

test('Bodensymbole: Das erste rote Feld einer Fahrt liegt in Wagen 1', () => {
  for (const bot of Object.values(BOTS)) {
    for (let seed = 1; seed <= 60; seed++) assert.equal(beobachteFahrt(seed, bot).rot, 0, `Seed ${seed}`);
  }
});

test('Bodensymbole: Antworten und „Noch mal" liegen nur im Speisewagen', () => {
  // nach einem Tod beginnt die nächste Fahrt im Speisewagen, mit Begleiter
  for (let seed = 1; seed <= 40; seed++) {
    beobachteFahrt(seed, BOTS.ausgewogener, { startWagen: 3, begleiter: 'gruppe' });
  }
});

test('Bodensymbole: Die Einführung gibt es nur, solange keine Prüfung gelocht ist', () => {
  const mit = erzeugeSpiel(7, { fahrkarte: { lochungen: [{ art: 'pruefung', id: 'ruhe' }] } }).zustand;
  assert.equal(istEinfuehrung(mit), false);
  assert.ok(!(mit.angebot.x === TUERFELD.x && mit.angebot.y === TUERFELD.y));
  const tod = erzeugeSpiel(7, { fahrkarte: { lochungen: [{ art: 'tod', durch: 'pendler' }] } }).zustand;
  assert.equal(tod.angebot.id, EINFUEHRUNG); // eine dunkle Lochung zählt nicht
});

test('Bodensymbole: Die Einführung würfelt wie sonst, die späteren Angebote bleiben dieselben', () => {
  for (let seed = 1; seed <= 30; seed++) {
    const z = erzeugeSpiel(seed).zustand;
    const stand = (nr) => {
      z.kartenzufall = { zufall: (seed ^ 0x9e3779b9) >>> 0 };
      z.wagenNr = nr;
      stelleAngebot(z);
      return z.kartenzufall.zufall;
    };
    assert.equal(stand(0), stand(5), `Seed ${seed}`);
  }
});

test('Bodensymbole: Wer die Einführung betritt, nimmt im selben Zug an; dreimal stehen locht', () => {
  const spiel = erzeugeSpiel(3);
  const z = spiel.zustand;
  z.gegner = [];
  z.tuerOffen = true;
  z.spieler.x = TUERFELD.x;
  z.spieler.y = TUERFELD.y + 1;
  const e = spiel.act('hoch');
  assert.ok(e.some((x) => x.typ === 'angenommen' && x.id === EINFUEHRUNG));
  for (let i = 0; i < 3; i++) spiel.act('warten');
  const raus = spiel.act('hoch');
  assert.ok(raus.some((x) => x.typ === 'gelocht' && x.id === EINFUEHRUNG && x.hell));
});

test('Bodensymbole: Ein Schritt auf ein rotes Feld meldet sich im selben Zug', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const spiel = erzeugeSpiel(seed);
    const z = spiel.zustand;
    const merk = {};
    for (let i = 0; i < 400 && z.status === 'faehrt'; i++) {
      const vorher = z.gegner.map((g) => g.ansage);
      const e = spiel.act(BOTS.ausgewogener(z, merk));
      const schritt = e.find((x) => x.typ === 'schritt');
      if (!schritt) continue;
      assert.equal(typeof schritt.rot, 'boolean');
      if (schritt.rot) assert.ok(vorher.some((a) => a && a.some((f) => f.x === schritt.nach.x && f.y === schritt.nach.y)));
    }
  }
});
