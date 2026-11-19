// Abnahme der Schwierigkeit: Die Bots fahren über feste Seeds.
// Zahlen dazu zeigt "npm run balance".

import test from 'node:test';
import assert from 'node:assert/strict';
import { werteAus } from './balance.js';
import { WAGENPLAENE } from '../src/kern/wagen.js';

const FAHRTEN = 400;
// Der ausgewogene Bot spielt wie ein aufmerksamer Mensch, dem ab und zu ein Zug verrutscht:
// Jeder zwölfte Zug ist zufällig. Ohne diese Fehler ist er deutlich besser als ein Mensch am Anfang.
const UNACHTSAM = { fehlerquote: 1 / 12 };

test('der ausgewogene Bot schafft etwa die Hälfte der Fahrten', () => {
  const b = werteAus('ausgewogener', FAHRTEN, UNACHTSAM);
  assert.ok(b.halt >= 0.4 && b.halt <= 0.6, `Halt erreicht: ${(b.halt * 100).toFixed(0)} %`);
  assert.equal(b.haengt, 0, 'keine Fahrt bleibt hängen');
});

test('der ausgewogene Bot schafft Wagen 1 und 2 fast immer', () => {
  const b = werteAus('ausgewogener', FAHRTEN, UNACHTSAM);
  assert.ok(b.jeWagen[0].geschafft >= 0.98, `Wagen 1: ${(b.jeWagen[0].geschafft * 100).toFixed(0)} %`);
  assert.ok(b.jeWagen[1].geschafft >= 0.95, `Wagen 2: ${(b.jeWagen[1].geschafft * 100).toFixed(0)} %`);
});

test('ohne Fehler spielt der ausgewogene Bot besser, und kein Zug ist ungültig', () => {
  const sauber = werteAus('ausgewogener', FAHRTEN);
  const unachtsam = werteAus('ausgewogener', FAHRTEN, UNACHTSAM);
  assert.ok(sauber.halt > unachtsam.halt, `${sauber.halt} gegen ${unachtsam.halt}`);
  assert.equal(sauber.ungueltig, 0);
  assert.equal(sauber.haengt, 0);
});

test('es wird von Kampfwagen zu Kampfwagen schwerer', () => {
  const b = werteAus('ausgewogener', FAHRTEN, UNACHTSAM);
  // Autoritätswagen und Speisewagen sind keine Kampfwagen und zählen hier nicht mit.
  const treffer = b.jeWagen.filter((w) => !WAGENPLAENE[w.nr].autoritaet && !WAGENPLAENE[w.nr].sicher).map((w) => w.treffer);
  for (let i = 1; i < treffer.length; i++) {
    assert.ok(treffer[i] >= treffer[i - 1], `Treffer je Wagen: ${treffer.map((t) => t.toFixed(2)).join(', ')}`);
  }
});

test('nie mehr als sechs Gegner, und kein Bot bleibt hängen', () => {
  for (const name of ['kaempfer', 'ausweicher', 'ausgewogener']) {
    const b = werteAus(name, FAHRTEN);
    assert.equal(b.haengt, 0, `${name} hängt`);
    assert.equal(b.ungueltig, 0, `${name} macht ungültige Züge`);
    assert.ok(b.jeWagen.every((w) => w.meisteGegner <= 6), name);
    assert.ok(b.jeWagen[0].geschafft >= 0.98, `${name} scheitert an Wagen 1`);
  }
});
