// Bildschirmaufteilung: passt auf jedes Handy, nichts zum Antippen am unteren Rand.

import test from 'node:test';
import assert from 'node:assert/strict';
import { berechneLayout, feldBei, RAND_UNTEN, KNOPF } from '../src/anzeige/layout.js';
import { kartenMasse } from '../src/anzeige/karte.js';

// Sichtbare Fläche in Safari bei eingeblendeten Leisten, dazu die Maße aus dem Fahrplan.
const GROESSEN = [
  ['kleinstes Maß aus dem Fahrplan', 360, 600],
  ['Prüfmaß aus dem Fahrplan', 390, 700],
  ['iPhone SE in Safari', 375, 548],
  ['iPhone 14 in Safari', 390, 664],
  ['iPhone 14 ohne Leisten', 390, 844],
  ['iPhone 15 Pro Max in Safari', 430, 739],
  ['schmales altes Handy', 320, 568],
  ['Tablet', 768, 1024],
  ['Rechner quer', 1280, 720],
];

const kasten = (x, y, b, h) => ({ x, y, b, h });
const ueberlappt = (p, q) => p.x < q.x + q.b && q.x < p.x + p.b && p.y < q.y + q.h && q.y < p.y + p.h;
const umKreis = (k, r) => kasten(k.x - r, k.y - r, 2 * r, 2 * r);

for (const [name, breite, hoehe] of GROESSEN) {
  test(`${name} (${breite}×${hoehe}): alles passt, nichts überlappt`, () => {
    const l = berechneLayout(breite, hoehe);
    const teile = {
      tafel: kasten(l.tafel.x, l.tafel.y, l.tafel.b, l.tafel.h),
      ton: umKreis(l.ton, KNOPF / 2),
      uhr: umKreis(l.uhr, KNOPF / 2),
      herzen: kasten(l.status.x, l.status.y + l.status.h / 2 - 12, 5 * 23, 24),
      ruhe: kasten(l.status.x + l.status.b - 66, l.status.y + l.status.h / 2 - 12, 66, 24),
      wagen: kasten(l.rumpf.x, l.rumpf.y, l.rumpf.b, l.rumpf.h),
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
  });

  test(`${name} (${breite}×${hoehe}): nichts zum Antippen am unteren Rand`, () => {
    const l = berechneLayout(breite, hoehe);
    // Knöpfe sitzen oben, über dem Wagen
    assert.ok(l.uhr.y + KNOPF / 2 <= l.rumpf.y, 'die Uhr liegt nicht über dem Wagen');
    assert.ok(l.ton.y + KNOPF / 2 <= l.rumpf.y, 'der Lautsprecher liegt nicht über dem Wagen');
    assert.ok(l.uhr.r * 2 >= KNOPF && l.ton.r * 2 >= KNOPF, 'Knopf kleiner als 48 Pixel');
    // unter dem Wagen bleibt Abstand, das unterste Feld endet noch weiter oben
    assert.ok(hoehe - (l.rumpf.y + l.rumpf.h) >= RAND_UNTEN, 'der Wagen reicht zu weit nach unten');
    assert.ok(hoehe - (l.boden.y + l.boden.h) >= RAND_UNTEN + 4, 'das unterste Feld liegt am Rand');
    // die Endkarte und ihr Winkel zum Wegwischen ebenso
    for (const art of ['tod', 'halt']) {
      const m = kartenMasse(l, art);
      assert.ok(m.y >= 0 && m.y + m.h <= hoehe, `Karte (${art}) passt nicht ins Bild`);
      assert.ok(hoehe - (m.weiter.y + m.weiter.h) >= RAND_UNTEN, `Winkel der Karte (${art}) liegt am unteren Rand`);
      assert.ok(m.weiter.b >= KNOPF && m.weiter.h >= KNOPF);
    }
  });
}

test('auf dem Handy sind die Felder groß genug für einen Daumen', () => {
  for (const [breite, hoehe, mindestens] of [[360, 600, 48], [375, 548, 44], [390, 664, 56], [390, 844, 60]]) {
    const l = berechneLayout(breite, hoehe);
    assert.ok(l.s >= mindestens, `${breite}×${hoehe}: Feld nur ${l.s} Pixel`);
  }
});

test('feldBei findet jedes Feld und den Streifen der Tür', () => {
  const l = berechneLayout(390, 664);
  for (let y = 0; y < 8; y++) {
    for (let x = 0; x < 5; x++) {
      assert.deepEqual(feldBei(l, l.boden.x + (x + 0.5) * l.s, l.boden.y + (y + 0.5) * l.s), { x, y });
    }
  }
  assert.deepEqual(feldBei(l, l.boden.x + 2.5 * l.s, l.boden.y - 4), { x: 2, y: -1 });
  assert.equal(feldBei(l, 2, l.boden.y + 10), null);
  assert.equal(feldBei(l, l.boden.x + 10, l.hoehe - 2), null);
});
