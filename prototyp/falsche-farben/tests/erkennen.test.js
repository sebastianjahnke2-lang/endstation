// Jeder Falsche ist durch Umsetzen und Schimmern eindeutig zu erkennen, ohne zu raten.
// Wer blind setzt, verliert den Abend. Die beiden Spieler aus bots.js sehen nur, was auf dem Bildschirm steht.

import test from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeAbend, istFalsch } from '../src/kern/abend.js';
import { spieleAbend, erzeugeWissen, lerne, waehle } from './bots.js';

const ABENDE = 200;

test('die Probe ist eindeutig: neben einem Ehrlichen seiner gezeigten Farbe schimmert nur, wer ehrlich ist', () => {
  // in echten Abenden: für jeden Gast, der an die Tür kommt, beide Proben an einer Kopie des Saals
  let falsche = 0;
  for (let seed = 1; seed <= 40; seed++) {
    const abend = erzeugeAbend(seed);
    const z = abend.zustand;
    const wissen = erzeugeWissen(false);
    const merk = {};
    while (z.status === 'laeuft') {
      const g = z.tuer[0];
      if (g) {
        for (let farbe = 0; farbe < 4; farbe++) {
          const probe = erzeugeAbend(seed);
          probe.zustand.tuer = [{ ...g }];
          probe.zustand.baenke = [[{ id: -1, zeigt: farbe, echt: farbe }], [], [], [], []];
          probe.zustand.zug = 1; // es kommt niemand nach
          const e = probe.act({ von: 'tuer', nach: 0 });
          assert.equal(e.some((x) => x.typ === 'schimmer'), g.echt === farbe);
        }
        if (istFalsch(g)) falsche += 1;
      }
      const a = waehle(wissen, z, merk);
      lerne(wissen, z, abend.act(a));
      merk.letzter = a;
    }
  }
  assert.ok(falsche > 100, `zu wenige Falsche geprüft: ${falsche}`);
});

test('wer hinsieht, erkennt die Falschen, bevor sie auffliegen, und muss fast nie raten', () => {
  let erkannt = 0;
  let geraten = 0;
  for (let seed = 1; seed <= ABENDE; seed++) {
    const r = spieleAbend(seed, 'hinseher');
    erkannt += r.erkannt;
    geraten += r.geraten;
  }
  assert.ok(erkannt > ABENDE * 2, `erkannt ${erkannt}`);
  assert.ok(geraten <= erkannt * 0.01, `geraten ${geraten} bei ${erkannt} erkannten`);
});

test('wer hinsieht, erhellt die meisten Abende; wer blind setzt, verliert fast jeden', () => {
  let hell = 0;
  let blindHell = 0;
  for (let seed = 1; seed <= ABENDE; seed++) {
    if (spieleAbend(seed, 'hinseher').z.ende === 'hell') hell += 1;
    if (spieleAbend(seed, 'blind').z.ende === 'hell') blindHell += 1;
  }
  assert.ok(hell >= ABENDE * 0.8, `hinsehend hell: ${hell} von ${ABENDE}`);
  assert.ok(blindHell <= ABENDE * 0.15, `blind hell: ${blindHell} von ${ABENDE}`);
});
