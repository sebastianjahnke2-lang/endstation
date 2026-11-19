// Bildschirmaufteilung des Prototyps: passt ab 360 x 600, alles ist groß genug für einen Daumen,
// unter der Daumenzone bleibt der Rand frei.

import test from 'node:test';
import assert from 'node:assert/strict';
import { berechneMasse, feldAn, feldMitte, lampenKopf, lampenRadius, lampeAn, endeMasse, protokollMasse, FREI_UNTEN, WARTEKNOPF, TIPPFLAECHE } from '../src/anzeige/masse.js';
import { SPALTEN, REIHEN, LAMPENNAMEN } from '../src/kern/abteil.js';
import { neueFahrt } from '../src/kern/fahrt.js';
import { PLATZTEXTE, tatsachenZeilen } from '../src/texte.js';
import { leeresProtokoll, protokollZeilen } from '../src/protokoll.js';
import { textBreite } from '../../../src/anzeige/matrix.js';

// dieselben Größen wie im Hauptspiel: sichtbare Fläche in Safari, dazu die Maße aus dem Auftrag
const GROESSEN = [
  ['kleinstes Maß aus dem Auftrag', 360, 600],
  ['Prüfmaß aus dem Fahrplan', 390, 700],
  ['iPhone SE in Safari', 375, 548],
  ['iPhone 14 in Safari', 390, 664],
  ['iPhone 14 ohne Leisten', 390, 844],
  ['iPhone 14 mit Notch und Home-Balken', 390, 763],
  ['iPhone 15 Pro Max in Safari', 430, 739],
  ['schmales altes Handy', 320, 568],
  ['Tablet', 768, 1024],
  ['Rechner quer', 1280, 720],
];

const ueberlappt = (p, q) => p.x < q.x + q.b && q.x < p.x + p.b && p.y < q.y + q.h && q.y < p.y + p.h;
const umKreis = (k, r) => ({ x: k.x - r, y: k.y - r, b: 2 * r, h: 2 * r });

for (const [name, breite, hoehe] of GROESSEN) {
  test(`${name} (${breite}×${hoehe}): alles passt, nichts überlappt`, () => {
    const m = berechneMasse(breite, hoehe);
    const teile = {
      anzeige: m.tafel,
      ton: umKreis(m.ton, TIPPFLAECHE / 2),
      wagen: m.rumpf,
      karte: m.karte,
      warten: m.warten,
    };
    for (const [teil, k] of Object.entries(teile)) {
      assert.ok(k.x >= 0 && k.y >= 0 && k.x + k.b <= breite && k.y + k.h <= hoehe, `${teil} ragt aus dem Bild: ${JSON.stringify(k)}`);
    }
    const namen = Object.keys(teile);
    for (let i = 0; i < namen.length; i++) {
      for (let j = i + 1; j < namen.length; j++) {
        assert.ok(!ueberlappt(teile[namen[i]], teile[namen[j]]), `${namen[i]} und ${namen[j]} überlappen`);
      }
    }
    // von oben nach unten: Anzeige, Wagen, Daumenzone
    assert.ok(m.tafel.y + m.tafel.h <= m.rumpf.y);
    assert.ok(m.rumpf.y + m.rumpf.h <= m.zone.y);
  });

  test(`${name} (${breite}×${hoehe}): Daumenzone unten, darunter bleibt der Rand frei`, () => {
    const m = berechneMasse(breite, hoehe);
    assert.ok(m.warten.h >= WARTEKNOPF && m.warten.b >= WARTEKNOPF, `Knopf "Warten" zu klein: ${JSON.stringify(m.warten)}`);
    assert.ok(m.karte.b >= TIPPFLAECHE && m.karte.h >= TIPPFLAECHE);
    assert.ok(m.ton.r * 2 >= TIPPFLAECHE);
    // wie im Hauptspiel: Am unteren Rand sitzen die Leiste von Safari und der Home-Balken
    for (const teil of [m.warten, m.karte, m.rumpf]) {
      assert.ok(hoehe - (teil.y + teil.h) >= FREI_UNTEN, `zu nah am unteren Rand: ${JSON.stringify(teil)}`);
    }
    // links steht die Fahrkarte, rechts der Knopf
    assert.ok(m.karte.x + m.karte.b < m.warten.x);
    // das Endbild mit dem Knopf "Neue Fahrt" ebenso
    const e = endeMasse(m);
    assert.ok(e.y >= 0 && e.x >= 0 && e.x + e.b <= breite, 'Endbild ragt aus dem Bild');
    assert.ok(hoehe - (e.knopf.y + e.knopf.h) >= FREI_UNTEN, 'Knopf "Neue Fahrt" liegt am unteren Rand');
    assert.ok(e.knopf.h >= WARTEKNOPF && e.knopf.b >= WARTEKNOPF);
    assert.ok(e.knopf.x >= e.x && e.knopf.x + e.knopf.b <= e.x + e.b);
    assert.ok(e.karte.x >= e.x && e.karte.x + e.karte.b <= e.x + e.b);
  });
}

test('ab 360 × 600 sind die Felder groß genug für einen Daumen', () => {
  for (const [breite, hoehe, mindestens] of [[360, 600, 48], [390, 664, 56], [390, 700, 60], [390, 844, 64]]) {
    const m = berechneMasse(breite, hoehe);
    assert.ok(m.s >= mindestens, `${breite}×${hoehe}: Feld nur ${m.s} Pixel`);
  }
});

test('feldAn findet jedes Feld, daneben liegt keines', () => {
  const m = berechneMasse(390, 664);
  for (let y = 0; y < REIHEN; y++) {
    for (let x = 0; x < SPALTEN; x++) {
      const mitte = feldMitte(m, x, y);
      assert.deepEqual(feldAn(m, mitte.x, mitte.y), { x, y });
    }
  }
  assert.equal(feldAn(m, m.boden.x - 3, m.boden.y + 10), null);
  assert.equal(feldAn(m, m.boden.x + 10, m.boden.y + m.boden.h + 2), null);
  assert.equal(feldAn(m, m.warten.x + 5, m.warten.y + 5), null, 'die Daumenzone liegt nicht im Wagen');
});

test('Lampen: Trefferfläche mindestens 48 Pixel, sie verdeckt keine Feldmitte', () => {
  for (const [, breite, hoehe] of GROESSEN) {
    const m = berechneMasse(breite, hoehe);
    assert.ok(lampenRadius(m) * 2 >= TIPPFLAECHE);
    const z = neueFahrt();
    for (const stellungA of ['fenster', 'gang']) {
      for (const stellungB of ['fenster', 'gang']) {
        const stellungen = { A: stellungA, B: stellungB };
        // der Kopf jeder Lampe trifft sie selbst
        for (const name of LAMPENNAMEN) {
          const kopf = lampenKopf(m, name, stellungen[name]);
          assert.equal(lampeAn(m, stellungen, kopf.x, kopf.y), name);
          assert.ok(kopf.x >= m.rumpf.x && kopf.x <= m.rumpf.x + m.rumpf.b, 'Lampenkopf liegt im Wagen');
        }
        // wer mitten auf ein Feld tippt, meint das Feld: Tasche, Sitze, Schlafender, Schaffner im Gang
        for (let y = 0; y < REIHEN; y++) {
          for (let x = 0; x < SPALTEN; x++) {
            const mitte = feldMitte(m, x, y);
            assert.equal(lampeAn(m, stellungen, mitte.x, mitte.y), null, `${breite}×${hoehe}: Lampe verdeckt Feld ${x},${y}`);
          }
        }
      }
    }
    assert.equal(z.lampen.A, 'fenster');
  }
});

test('die Lampe in Reihe 2 liegt für den Daumen nicht am Rand des Bildschirms', () => {
  const m = berechneMasse(360, 600);
  for (const stellung of ['fenster', 'gang']) {
    const kopf = lampenKopf(m, 'B', stellung);
    assert.ok(kopf.x >= 24 && kopf.x <= 360 - 24, `Lampenkopf bei x=${kopf.x}`);
  }
});

test('alle Texte passen bei 360 Pixel Breite', () => {
  const m = berechneMasse(360, 600);
  const t = PLATZTEXTE.spiel;
  assert.ok(textBreite(t.anzeige) + 4 <= m.tafel.spalten, 'Zuganzeige');
  assert.ok(textBreite(t.warten) * m.warten.raster + 16 <= m.warten.b, 'Knopf "Warten"');
  const e = endeMasse(m);
  assert.ok(textBreite(t.neueFahrt) * e.knopf.raster + 16 <= e.knopf.b, 'Knopf "Neue Fahrt"');
  // die Sprechblase: zwei Zeilen, Punktabstand 2, mit Rand
  for (const zeile of t.satz.split(' / ')) assert.ok(textBreite(zeile) * 2 + 18 <= 360 - 12, `Satz zu breit: ${zeile}`);
  assert.equal(t.satz.split(' / ').length, 2);
  // Tatsachen: jede hat zwei Zeilen, zwei Tatsachen füllen die Tafel genau
  const alle = [{ art: 'wartet', reihe: 5 }, { art: 'tasche' }, { art: 'wach' }];
  for (const eine of alle) {
    const zeilen = tatsachenZeilen([eine]);
    assert.equal(zeilen.length, 2);
    for (const zeile of zeilen) assert.ok(textBreite(zeile) <= e.tafel.spalten, `Zeile zu lang: ${zeile}`);
  }
  assert.equal(tatsachenZeilen(alle.slice(0, 2)).length, 4);
  assert.ok(4 * 9 + 3 * 2 <= e.tafel.zeilen);
});

test('das Testprotokoll passt auf das kleinste Handy', () => {
  const m = berechneMasse(360, 600);
  const p = protokollMasse(m);
  const voll = leeresProtokoll();
  for (const name of Object.keys(voll)) if (name !== 'folge') voll[name] = 999;
  voll.folge = 'W'.repeat(600);
  const karten = new Array(20).fill({ lochung: true, zeilen: [] });
  const zeilen = protokollZeilen(voll, karten, p.zeichen);
  for (const zeile of zeilen) assert.ok([...zeile].length <= p.zeichen, `Zeile zu lang (${[...zeile].length} > ${p.zeichen}): ${zeile}`);
  assert.ok(p.y + zeilen.length * p.zeilenhoehe + 2 * p.polster <= 600, 'das Protokoll ist höher als der Bildschirm');
});
