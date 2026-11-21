// Jede Sitzordnung, die gespielt werden kann, ist innerhalb der Züge lösbar und nicht durch
// Durchkontrollieren der Reihe nach zu schaffen: die drei festen und jede ausgeloste.

import test from 'node:test';
import assert from 'node:assert/strict';
import { HALTE, ZUEGE_BIS_HALT } from '../src/kern/halte.js';
import { pruefeOrdnung, ordnungTaugt, haltNach, kuerzesterFang, KUERZESTE_HOECHSTENS } from '../src/kern/pruefung.js';
import { losOrdnungAus, roheOrdnung, FAHRGAESTE_JE_HALT } from '../src/kern/auslosen.js';
import { erzeugeKontrolle, neueOrdnungen } from '../src/kern/durchgang.js';
import { haltZug } from '../src/kern/kontrolle.js';

function pruefeStreng(ordnung, wo) {
  const p = pruefeOrdnung(ordnung);
  assert.ok(p.kuerzeste !== null, `${wo}: nicht lösbar`);
  assert.ok(p.kuerzeste <= KUERZESTE_HOECHSTENS && p.kuerzeste <= ZUEGE_BIS_HALT, `${wo}: kürzester Weg ${p.kuerzeste} Züge`);
  assert.notEqual(p.blindLinks, 'gefangen', `${wo}: der Reihe nach (links zuerst) geschafft`);
  assert.notEqual(p.blindRechts, 'gefangen', `${wo}: der Reihe nach (rechts zuerst) geschafft`);
  assert.equal(p.hinsehen, 'gefangen', `${wo}: wer hinsieht, schafft es nicht`);
  assert.ok(p.alleKosten > ZUEGE_BIS_HALT, `${wo}: alle zu kontrollieren kostet nur ${p.alleKosten}`);
  // der gefundene Weg führt wirklich zum Fang
  const z = haltNach(ordnung);
  for (const h of kuerzesterFang(haltNach(ordnung))) haltZug(z, h);
  assert.equal(z.status, 'gefangen', `${wo}: Weg nachgespielt`);
}

function pruefeForm(ordnung, wo) {
  const zeichen = ordnung.sitze.join('').replace(/[.|]/g, '');
  assert.equal(zeichen.length, FAHRGAESTE_JE_HALT, wo);
  assert.equal(zeichen.split('S').length - 1, 1, `${wo}: genau einer ohne Fahrkarte`);
  assert.equal(zeichen.split('Z').length - 1, 1, `${wo}: genau ein Schlafender`);
  const farben = zeichen.replace(/[SZ]/g, '').split('');
  assert.equal(new Set(farben).size, farben.length, `${wo}: zwei Fahrgäste in derselben Farbe`);
  assert.ok(!farben.includes(ordnung.farbe), `${wo}: seine Farbe trägt noch jemand`);
}

test('die drei festen Sitzordnungen taugen', () => {
  HALTE.forEach((ordnung, i) => {
    pruefeStreng(ordnung, `fester Halt ${i + 1}`);
    assert.ok(ordnungTaugt(ordnung));
  });
});

test('jede ausgeloste Sitzordnung ist lösbar und nicht der Reihe nach zu schaffen (3000 Auslosungen)', () => {
  for (let seed = 1; seed <= 1000; seed++) {
    const z = { zufall: seed };
    for (let halt = 0; halt < 3; halt++) {
      const ordnung = losOrdnungAus(z);
      assert.ok(ordnung, `Seed ${seed}: keine taugliche Ordnung gefunden`);
      pruefeForm(ordnung, `Seed ${seed}, Halt ${halt + 1}`);
      pruefeStreng(ordnung, `Seed ${seed}, Halt ${halt + 1}`);
    }
  }
});

test('die Prüfung verwirft, was nicht taugt', () => {
  const z = { zufall: 99 };
  let verworfen = 0;
  for (let i = 0; i < 300; i++) if (!ordnungTaugt(roheOrdnung(z))) verworfen += 1;
  assert.ok(verworfen > 0, 'die Prüfung lässt alles durch');
  // ein Fahrgast ohne Fahrkarte ganz unten, alle anderen weit weg: blind der Reihe nach sofort gefangen
  assert.equal(ordnungTaugt({ farbe: 'a', sitze: ['bc|de', 'fg|Z.', '..|..', '..|..', '..|..', '..|.S'] }), false);
});

test('beim Neustart: neue Plätze, neuer Schlafender, neue Farben', () => {
  const plaetzeS = new Set();
  const plaetzeZ = new Set();
  const farbenS = new Set();
  for (let seed = 1; seed <= 60; seed++) {
    const spiel = erzeugeKontrolle(seed);
    for (let halt = 0; halt < 3; halt++) {
      for (let i = 0; i < ZUEGE_BIS_HALT; i++) spiel.act('warten');
      spiel.act('weiter');
    }
    spiel.act('weiter'); // Neustart
    const z = spiel.zustand;
    assert.equal(z.durchgang, 1);
    assert.equal(z.status, 'faehrt');
    assert.notDeepEqual(z.ordnungen, HALTE, `Seed ${seed}: dieselben Ordnungen wie beim ersten Mal`);
    for (const o of z.ordnungen) {
      const zeilen = o.sitze;
      zeilen.forEach((zeile, i) => {
        for (const x of [0, 1, 3, 4]) {
          if (zeile[x] === 'S') plaetzeS.add(`${x},${i + 1}`);
          if (zeile[x] === 'Z') plaetzeZ.add(`${x},${i + 1}`);
        }
      });
      farbenS.add(o.farbe);
    }
  }
  assert.ok(plaetzeS.size >= 12, `nur ${plaetzeS.size} verschiedene Plätze für ihn`);
  assert.ok(plaetzeZ.size >= 12, `nur ${plaetzeZ.size} verschiedene Plätze für den Schlafenden`);
  assert.equal(farbenS.size, 7, 'jede Farbe kann ihn treffen');
});

test('zwei Neustarts mit demselben Zufallsstand ergeben dieselben Ordnungen, ein anderer Seed andere', () => {
  assert.deepEqual(neueOrdnungen({ zufall: 5 }), neueOrdnungen({ zufall: 5 }));
  assert.notDeepEqual(neueOrdnungen({ zufall: 5 }), neueOrdnungen({ zufall: 6 }));
});
