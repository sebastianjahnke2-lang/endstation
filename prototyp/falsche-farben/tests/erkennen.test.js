// Jeder Falsche ist durch Umsetzen und Schimmern eindeutig zu erkennen, ohne zu raten.
// Wer blind setzt, verliert den Abend. Die beiden Spieler aus bots.js sehen nur, was auf dem Bildschirm steht.

import test from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeAbend } from '../src/kern/abend.js';
import { spieleAbend } from './bots.js';

const ABENDE = 200;

test('allein über Abrücken und Zusammenrücken ist jeder Gast eindeutig: falsch oder nicht, und welche Farbe er ist', () => {
  // Jeder denkbare Gast wird probeweise neben einen Ehrlichen jeder Farbe gesetzt. Die vier Antworten
  // (zusammen, ab, nichts) müssen für jede Kombination aus gezeigter und echter Farbe verschieden sein.
  const antworten = new Map();
  for (let zeigt = 0; zeigt < 4; zeigt++) {
    for (let echt = 0; echt < 4; echt++) {
      const reihe = [];
      for (let farbe = 0; farbe < 4; farbe++) {
        const probe = erzeugeAbend(1);
        probe.zustand.tuer = [{ id: 7, zeigt, echt }];
        probe.zustand.baenke = [[{ id: -1, zeigt: farbe, echt: farbe }], [], [], [], []];
        probe.zustand.zug = 0;
        const e = probe.act({ von: 'tuer', nach: 0 });
        const zusammen = e.some((x) => x.typ === 'schimmer');
        const ab = e.some((x) => x.typ === 'abruecken');
        assert.ok(!(zusammen && ab));
        assert.equal(zusammen, echt === farbe, 'zusammen genau neben der echten Farbe');
        assert.equal(ab, zeigt === farbe && echt !== farbe, 'ab genau neben der gezeigten, wenn sie nicht die echte ist');
        reihe.push(zusammen ? 'z' : ab ? 'a' : '-');
      }
      antworten.set(`${zeigt}/${echt}`, reihe.join(''));
    }
  }
  assert.equal(new Set(antworten.values()).size, 16, JSON.stringify([...antworten]));
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
