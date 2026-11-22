// Einstieg: Bis die erste Bank geräumt ist, kommen nur Ehrliche. Dann ein Falscher allein, in einem Moment, in dem
// genau zwei besetzte Bänke Platz haben: eine mit der Farbe, die er zeigt, eine mit seiner echten. Danach gemischt,
// langsam mehr. Nie zwei unentdeckte Falsche, die dieselbe Farbe zeigen.

import test from 'node:test';
import assert from 'node:assert/strict';
import { istFalsch } from '../src/kern/abend.js';
import { spieleAbend } from './bots.js';
import { erzeugeAbend } from '../src/kern/abend.js';
import { erzeugeWissen, lerne, waehle } from './bots.js';

// spielt einen Abend und hält fest, wer wann an die Tür kam
function verfolge(seed) {
  const abend = erzeugeAbend(seed);
  const z = abend.zustand;
  const wissen = erzeugeWissen(false);
  const merk = {};
  const ankuenfte = [];
  const verletzt = [];
  const einstieg = []; // die Lage im Saal, als der erste Falsche an die Tür kam
  for (const g of z.tuer) ankuenfte.push({ falsch: istFalsch(g), geraeumt: 0, ersterAuf: false });
  for (let i = 0; i < 3000 && z.status === 'laeuft'; i++) {
    const a = waehle(wissen, z, merk);
    const vorher = { geraeumt: z.geraeumt, erster: z.ersterFalscher };
    const e = abend.act(a);
    merk.letzter = a;
    lerne(wissen, z, e);
    for (const x of e) {
      if (x.typ !== 'ankunft' || x.gast.zeigt === x.gast.echt || einstieg.length) continue;
      einstieg.push({ gast: x.gast, tuer: z.tuer.map((g) => g.id), baenke: z.baenke.map((b) => b.map((g) => ({ ...g }))) });
    }
    for (const x of e) if (x.typ === 'ankunft') ankuenfte.push({ falsch: x.gast.zeigt !== x.gast.echt, geraeumt: z.geraeumt, erster: vorher.erster === 'aufgeflogen' || z.ersterFalscher === 'aufgeflogen' });
    const verdeckt = [...z.tuer, ...z.baenke.flat()].filter(istFalsch);
    if (new Set(verdeckt.map((g) => g.zeigt)).size !== verdeckt.length) verletzt.push(i);
  }
  return { ankuenfte, verletzt, z, einstieg: einstieg[0] };
}

test('bis die erste Bank geräumt ist, nur Ehrliche; dann ein Falscher allein, bis er auffliegt', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const { ankuenfte } = verfolge(seed);
    const vorher = ankuenfte.filter((a) => a.geraeumt === 0);
    assert.ok(vorher.every((a) => !a.falsch), `Seed ${seed}: Falscher vor der ersten geräumten Bank`);
    const falsche = ankuenfte.filter((a) => a.falsch);
    if (!falsche.length) continue;
    // der zweite Falsche kommt erst, wenn der erste aufgeflogen ist
    if (falsche.length > 1) assert.ok(falsche[1].erster, `Seed ${seed}: zweiter Falscher, bevor der erste aufflog`);
  }
});

test('danach langsam mehr: in der zweiten Hälfte des Abends sind mehr Falsche als in der ersten', () => {
  let frueh = 0;
  let spaet = 0;
  for (let seed = 1; seed <= 80; seed++) {
    const { ankuenfte } = verfolge(seed);
    const mitte = Math.floor(ankuenfte.length / 2);
    frueh += ankuenfte.slice(0, mitte).filter((a) => a.falsch).length;
    spaet += ankuenfte.slice(mitte).filter((a) => a.falsch).length;
  }
  assert.ok(spaet > frueh * 1.3, `früh ${frueh}, spät ${spaet}`);
});

test('nie zwei unentdeckte Falsche, die dieselbe Farbe zeigen', () => {
  for (let seed = 1; seed <= 60; seed++) assert.deepEqual(verfolge(seed).verletzt, [], `Seed ${seed}`);
});

test('jeder Abend hat ein Ende', () => {
  for (let seed = 1; seed <= 60; seed++) {
    assert.equal(spieleAbend(seed, 'hinseher').z.status, 'ende', `hinseher ${seed}`);
    assert.equal(spieleAbend(seed, 'blind').z.status, 'ende', `blind ${seed}`);
  }
});

test('der erste Falsche kommt, wenn genau zwei besetzte Bänke Platz haben: seine gezeigte und seine echte Farbe', () => {
  let gesehen = 0;
  for (let seed = 1; seed <= 100; seed++) {
    const { einstieg } = verfolge(seed);
    if (!einstieg) continue;
    gesehen += 1;
    const { gast, tuer, baenke } = einstieg;
    assert.deepEqual(tuer, [gast.id], `Seed ${seed}: an der Tür wartet sonst niemand`);
    const offen = baenke.filter((b) => b.length > 0 && b.length < 4);
    assert.equal(offen.length, 2, `Seed ${seed}: genau zwei besetzte Bänke mit freiem Platz`);
    const aussen = offen.map((b) => b[b.length - 1]);
    assert.ok(aussen.every((g) => g.zeigt === g.echt), 'daneben sitzen Ehrliche');
    assert.deepEqual(aussen.map((g) => g.echt).sort(), [gast.zeigt, gast.echt].sort(), `Seed ${seed}: eine zeigt seine Farbe, eine ist seine echte`);
  }
  assert.ok(gesehen >= 95, `nur in ${gesehen} von 100 Abenden kam ein Falscher`);
});
