// Texte und Aufteilung: Nur zwei Texte gibt es, und alles passt ab 360 x 600.

import test from 'node:test';
import assert from 'node:assert/strict';
import { KONTROLLTEXTE, stationsName } from '../src/texte.js';
import { berechneMasse, FREI_UNTEN } from '../../freier-platz/src/anzeige/masse.js';
import { textBreite, ZEILENHOEHE } from '../../../src/anzeige/matrix.js';

test('nur diese Texte, keine Erklärung, kein Lob, keine Wertung, keine Punktzahl', () => {
  assert.deepEqual(Object.keys(KONTROLLTEXTE), ['warten', 'hinweis', 'station']);
  assert.deepEqual(KONTROLLTEXTE.hinweis, { wischen: 'Wischen', antippen: 'Antippen' });
  const woerter = [KONTROLLTEXTE.warten, ...Object.values(KONTROLLTEXTE.hinweis)];
  for (let i = 0; i < 60; i++) woerter.push(stationsName(i));
  const alle = woerter.join(' ').toLowerCase();
  for (const wort of ['gut', 'super', 'toll', 'punkte', 'geschafft', 'gewonnen', 'verloren', 'leider', 'bravo', 'schwarz', 'rekord']) {
    assert.ok(!new RegExp(`\\b${wort}\\b`).test(alle), wort);
  }
  assert.ok(!/\d/.test(alle), 'keine Zahl');
});

test('Stationsnamen: erfunden, 60 verschiedene, höchstens zehn Zeichen, immer dieselbe Reihenfolge', () => {
  const namen = [];
  for (let i = 0; i < 60; i++) namen.push(stationsName(i));
  assert.equal(new Set(namen).size, 60);
  for (const n of namen) assert.ok([...n].length <= 10, n);
  assert.equal(stationsName(3), stationsName(3));
  assert.equal(stationsName(60), stationsName(0), 'danach beginnt die Linie von vorn');
});

for (const [b, h] of [[360, 600], [375, 548], [390, 664], [390, 844], [430, 739]]) {
  test(`passt auf ${b} x ${h}: Wagen, Anzeige, Knopf, Schlusszeile`, () => {
    const m = berechneMasse(b, h);
    assert.ok(m.tafel.y >= 0 && m.tafel.x + m.tafel.b <= b);
    assert.ok(m.rumpf.x >= 0 && m.rumpf.x + m.rumpf.b <= b, 'der Wagen ist zu breit');
    assert.ok(m.rumpf.y >= m.tafel.y + m.tafel.h, 'der Wagen überdeckt die Anzeige');
    assert.ok(m.rumpf.y + m.rumpf.h <= m.warten.y, 'der Wagen überdeckt den Knopf');
    assert.ok(h - (m.warten.y + m.warten.h) >= FREI_UNTEN, 'nichts zum Antippen am unteren Rand');
    assert.ok(m.s >= 44, `Felder zu klein für den Daumen: ${m.s}`);
    // die Strecke braucht Zug (8 Punkte), Weg und Bahnhof
    assert.ok(m.tafel.spalten >= 40);
    assert.ok(m.tafel.zeilen >= ZEILENHOEHE);
    // die Anzeige neben den drei Haken: Zug, etwas Gleis, Mast und der längste Stationsname passen hinein
    const haken = Math.round(m.tafel.raster * 21);
    const spalten = Math.floor((m.tafel.b - haken - 2 * m.tafel.polster) / m.tafel.raster);
    let laengster = 0;
    for (let i = 0; i < 60; i++) laengster = Math.max(laengster, textBreite(stationsName(i)));
    assert.ok(spalten - laengster - 4 >= 8 + 10, `Anzeige zu schmal: ${spalten} Punkte, Name ${laengster}`);
    assert.ok(haken >= 50, 'drei Haken brauchen Platz');
    assert.ok(m.tafel.x + m.tafel.b <= m.ton.x - m.ton.r + 4, 'Haken und Lautsprecher überlappen');
    // die Schlusszeile mit dem längsten Namen passt in die Breite
    assert.ok((laengster + 8) * m.tafel.raster + 12 <= b - 20);
    // die Linie unten links hat Platz für sechs Stationen
    assert.ok(m.karte.b >= 6 * 14, `Linie zu schmal: ${m.karte.b}`);
    // das längste Hinweisschild passt neben den Gang, ohne aus dem Bild zu ragen
    for (const wort of Object.values(KONTROLLTEXTE.hinweis)) assert.ok(textBreite(wort) * m.tafel.raster + 16 <= b - 8, wort);
  });
}
