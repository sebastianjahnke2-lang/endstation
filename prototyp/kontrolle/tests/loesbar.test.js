// Jeder ausgeloste Halt ist lösbar, und jede Masche ist allein durch Beobachten von den Unschuldigen
// zu unterscheiden. Geprüft über viele Schichten und Halte.

import test from 'node:test';
import assert from 'node:assert/strict';
import { losHaltAus, FAHRGAESTE_JE_HALT } from '../src/kern/auslosen.js';
import { pruefeHalt, haltNach, kuerzesterFang, VERRAETERISCH } from '../src/kern/pruefung.js';
import { haltZug, kopiereKontrolle } from '../src/kern/kontrolle.js';

const SCHICHTEN = 120;
const HALTE = 16;
const alle = [];
for (let seed = 1; seed <= SCHICHTEN; seed++) {
  const z = { zufall: seed };
  for (let h = 0; h < HALTE; h++) alle.push({ wo: `Seed ${seed}, Halt ${h + 1}`, h, ordnung: losHaltAus(z, h) });
}

test(`jeder ausgeloste Halt ist lösbar (${SCHICHTEN * HALTE} Halte)`, () => {
  for (const { wo, ordnung } of alle) {
    assert.ok(ordnung, `${wo}: kein Halt gefunden`);
    const p = pruefeHalt(ordnung);
    assert.ok(p.kuerzeste !== null && p.kuerzeste < ordnung.zuege, `${wo}: nötig ${p.kuerzeste}, Zeit ${ordnung.zuege}`);
    assert.notEqual(p.blindLinks, 'gefangen', `${wo}: der Reihe nach (links zuerst) geschafft`);
    assert.notEqual(p.blindRechts, 'gefangen', `${wo}: der Reihe nach (rechts zuerst) geschafft`);
    // der gefundene Weg führt wirklich zum Ziel
    const z = haltNach(ordnung);
    for (const h of kuerzesterFang(haltNach(ordnung))) haltZug(z, h);
    assert.equal(z.status, 'gefangen', wo);
  }
});

test('jede Masche ist allein durch Beobachten erkennbar: Wer nur dem folgt, der sich verrät, schafft jeden Halt', () => {
  for (const { wo, ordnung } of alle) assert.equal(pruefeHalt(ordnung).hinsehen, 'gefangen', wo);
});

test('Unschuldige verraten sich nie: Jedes auffällige Verhalten kommt von einem ohne Fahrkarte', () => {
  let auffaellig = 0;
  alle.slice(0, 400).forEach(({ wo, ordnung }, i) => {
    let wurf = i + 1;
    const z = haltNach(ordnung);
    for (let n = 0; n < 40 && z.status === 'faehrt'; n++) {
      wurf = (Math.imul(wurf, 1664525) + 1013904223) >>> 0;
      const wahl = ['hoch', 'hoch', 'runter', 'warten', 'links', 'rechts'][wurf % 6];
      for (const e of haltZug(z, wahl)) {
        if (!VERRAETERISCH.includes(e.typ)) continue;
        auffaellig += 1;
        assert.ok(z.fahrgaeste[e.nr].schwarz, `${wo}: ${e.typ} von einem mit Fahrkarte`);
      }
    }
  });
  assert.ok(auffaellig > 200);
});

test('am Aussehen ist niemand zu erkennen', () => {
  let zweiSchlafendeOhneSchein = 0;
  for (const { wo, ordnung } of alle) {
    const z = haltNach(ordnung);
    assert.equal(z.fahrgaeste.length, FAHRGAESTE_JE_HALT, wo);
    const farben = z.fahrgaeste.filter((f) => f.farbe !== 'z').map((f) => f.farbe);
    assert.equal(new Set(farben).size, farben.length, `${wo}: zwei in derselben Farbe`);
    for (const f of z.fahrgaeste) if (f.masche === 'schein') assert.equal(f.farbe, 'z', `${wo}: Scheinschläfer sieht anders aus`);
    const schlafend = z.fahrgaeste.filter((f) => f.farbe === 'z').length;
    if (!z.fahrgaeste.some((f) => f.masche === 'schein') && schlafend === 2) zweiSchlafendeOhneSchein += 1;
    if (z.fahrgaeste.some((f) => f.masche === 'schein')) assert.ok(z.fahrgaeste.some((f) => f.schlaeft), `${wo}: Scheinschläfer ohne echten Schlafenden`);
  }
  assert.ok(zweiSchlafendeOhneSchein > 50, 'zwei Schlafende dürfen nicht verraten, dass einer nur so tut');
});

test('die Farbe der Fahrgäste ohne Fahrkarte wechselt von Halt zu Halt', () => {
  const farben = new Set();
  for (const { ordnung } of alle) for (const k of Object.keys(ordnung.farben)) farben.add(ordnung.farben[k]);
  assert.equal(farben.size, 7);
  const z = kopiereKontrolle(haltNach(alle[0].ordnung));
  assert.ok(z.fahrgaeste.length > 0);
});
