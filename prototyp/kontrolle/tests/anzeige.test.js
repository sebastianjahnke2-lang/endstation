// Texte und Aufteilung: Nur zwei Texte gibt es, und alles passt ab 360 x 600.

import test from 'node:test';
import assert from 'node:assert/strict';
import { KONTROLLTEXTE, setzeKontrollText } from '../src/texte.js';
import { berechneMasse, FREI_UNTEN } from '../../freier-platz/src/anzeige/masse.js';
import { textBreite, ZEILENHOEHE } from '../../../src/anzeige/matrix.js';

test('nur diese Texte, keine Erklärung, kein Lob, keine Wertung. Zwei Hinweiswörter, je ein Wort', () => {
  assert.deepEqual(Object.keys(KONTROLLTEXTE), ['warten', 'schluss', 'hinweis']);
  assert.deepEqual(KONTROLLTEXTE.hinweis, { wischen: 'Wischen', antippen: 'Antippen' });
  const alle = [KONTROLLTEXTE.warten, KONTROLLTEXTE.schluss, ...Object.values(KONTROLLTEXTE.hinweis)].join(' ').toLowerCase();
  for (const wort of ['gut', 'super', 'toll', 'punkte', 'geschafft', 'gewonnen', 'verloren', 'leider', 'bravo', 'schwarz']) {
    assert.ok(!new RegExp(`\\b${wort}\\b`).test(alle), wort);
  }
  assert.equal(setzeKontrollText(KONTROLLTEXTE.schluss, { n: 2, m: 3 }), '2 von 3 erwischt');
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
    // die längste Schlusszeile passt in die Breite
    const breit = (textBreite(setzeKontrollText(KONTROLLTEXTE.schluss, { n: 3, m: 3 })) + 8) * m.tafel.raster + 12;
    assert.ok(breit <= b - 20, `Schlusszeile ${breit} Pixel`);
    // das längste Hinweisschild passt neben den Gang, ohne aus dem Bild zu ragen
    for (const wort of Object.values(KONTROLLTEXTE.hinweis)) assert.ok(textBreite(wort) * m.tafel.raster + 16 <= b - 8, wort);
  });
}
