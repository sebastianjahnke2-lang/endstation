// Ton und harte Regeln für die Texte des Prototyps: dieselbe Wortliste wie im Hauptspiel,
// dieselbe Punktmatrix-Schrift, und im Spiel steht kein Text außer den erlaubten.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync, readdirSync } from 'node:fs';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { PLATZTEXTE, setzeEin, tatsachenZeilen } from '../src/texte.js';
import { hatZeichen } from '../../../src/anzeige/matrix.js';
import { VERBOTEN } from '../../../tests/ton.test.js';

const SRC = join(dirname(fileURLToPath(import.meta.url)), '..', 'src');

function sammle(wert, pfad, liste) {
  if (typeof wert === 'string') liste.push([pfad, wert]);
  else if (wert && typeof wert === 'object') for (const [k, v] of Object.entries(wert)) sammle(v, `${pfad}.${k}`, liste);
  else assert.fail(`${pfad}: In PLATZTEXTE stehen nur Zeichenketten, gefunden: ${typeof wert}`);
  return liste;
}

const alle = sammle(PLATZTEXTE, 'PLATZTEXTE', []);

test('Prototyp: kein Text enthält ein verbotenes Wort', () => {
  for (const [pfad, text] of alle) {
    for (const muster of VERBOTEN) {
      const treffer = text.match(muster);
      assert.equal(treffer, null, `${pfad} = "${text}" enthält "${treffer && treffer[0]}"`);
    }
  }
});

test('Prototyp: jedes Zeichen gibt es in der Punktmatrix-Schrift', () => {
  for (const [pfad, text] of alle) {
    for (const zeichen of text.replace(/\{\w+\}/g, '').replace(/ \/ /g, ' ')) {
      assert.ok(hatZeichen(zeichen), `${pfad}: Zeichen "${zeichen}" fehlt in der Schrift`);
    }
  }
  for (const zeichen of '0123456789:+-.ABhrulTSKWXV') assert.ok(hatZeichen(zeichen));
});

test('Prototyp: im Spiel steht nur der Satz, drei Tatsachen, "Wagen 7", "Warten" und "Neue Fahrt"', () => {
  assert.deepEqual(sammle(PLATZTEXTE.spiel, 'spiel', []).map((e) => e[1]).sort(), [
    'Auf Platz 51 / liegt eine Tasche.',
    'Bitte den Platz / freimachen.',
    'Der Fahrgast in / Reihe 2 ist wach.',
    'Der Schaffner / wartet in Reihe {n}.',
    'Neue Fahrt',
    'Wagen 7',
    'Warten',
  ]);
  // die Zeilen ergeben zusammengesetzt genau die Sätze aus dem Auftrag
  assert.equal(PLATZTEXTE.spiel.satz.split(' / ').join(' '), 'Bitte den Platz freimachen.');
  assert.equal(tatsachenZeilen([{ art: 'wartet', reihe: 5 }]).join(' '), 'Der Schaffner wartet in Reihe 5.');
  assert.equal(tatsachenZeilen([{ art: 'tasche' }]).join(' '), 'Auf Platz 51 liegt eine Tasche.');
  assert.equal(tatsachenZeilen([{ art: 'wach' }]).join(' '), 'Der Fahrgast in Reihe 2 ist wach.');
  assert.equal(setzeEin('Reihe {n} und {fremd}', { n: 2 }), 'Reihe 2 und {fremd}');
});

test('Prototyp: kein Urteil, kein Lob, kein Wort über den Spieler', () => {
  const wertend = /geschafft|gut|richtig|falsch|bravo|super|gewonnen|verloren|punkt|note|fehler|leider|endlich|\bdu\b|\bdein|\bSie\b/i;
  for (const [pfad, text] of sammle(PLATZTEXTE.spiel, 'spiel', [])) {
    assert.equal(text.match(wertend), null, `${pfad} = "${text}" wertet oder spricht den Spieler an`);
  }
});

test('Prototyp: im Quelltext der Anzeige steht kein fester Text, alles kommt aus texte.js', () => {
  const ordner = join(SRC, 'anzeige');
  for (const datei of readdirSync(ordner)) {
    const quelle = readFileSync(join(ordner, datei), 'utf8');
    assert.equal(quelle.match(/schreibe(?:Mittig)?\(\s*\w+\s*,\s*['"`]/), null, `${datei}: fester Text an schreibe()`);
    assert.equal(quelle.match(/fillText|strokeText/), null, `${datei}: Systemschrift`);
  }
});

test('Prototyp: der Kern kennt weder Browser noch Uhr noch Zufall', () => {
  const ordner = join(SRC, 'kern');
  for (const datei of readdirSync(ordner)) {
    const quelle = readFileSync(join(ordner, datei), 'utf8');
    const treffer = quelle.match(/\b(?:window|document|performance|setTimeout|setInterval|Date|Math\.random|requestAnimationFrame)\b/);
    assert.equal(treffer, null, `${datei}: "${treffer && treffer[0]}" hat im Kern nichts zu suchen`);
  }
});
