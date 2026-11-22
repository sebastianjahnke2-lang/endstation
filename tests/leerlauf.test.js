// Leerlauf vor der Tür: Lauf zur Tür und gehaltener Finger, beide nur im gefahrlosen Wagen.

import test from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeSpiel } from '../src/kern/spiel.js';
import { istGefahrlos, schrittZurTuer, darfWeiterHalten, istGlatt } from '../src/kern/leerlauf.js';
import { SPEISEWAGEN_NR } from '../src/kern/reise.js';

// Läuft wie main.js mit dem Tipp auf die Tür: Schritt um Schritt, bis etwas nicht glatt geht.
function laufe(spiel) {
  const schritte = [];
  for (let i = 0; i < 40; i++) {
    const r = schrittZurTuer(spiel.zustand);
    if (!r) return { schritte, ende: 'kein Weg' };
    const e = spiel.act(r);
    schritte.push(r);
    if (!istGlatt(e)) return { schritte, ende: 'nicht glatt', e };
    if (e.some((x) => x.typ === 'wagenwechsel')) return { schritte, ende: 'durch die Tür' };
  }
  return { schritte, ende: 'zu lang' };
}

test('Leerlauf: Im Speisewagen läuft man mit einem Tipp vom Start durch die Tür, in jeder Auslosung', () => {
  for (let seed = 1; seed <= 60; seed++) {
    const spiel = erzeugeSpiel(seed, { startWagen: SPEISEWAGEN_NR });
    assert.ok(istGefahrlos(spiel.zustand));
    const { schritte, ende } = laufe(spiel);
    assert.equal(ende, 'durch die Tür', `Seed ${seed}`);
    assert.equal(schritte.length, 8, `Seed ${seed}: sieben Schritte und die Tür`);
    assert.equal(spiel.zustand.wagenNr, SPEISEWAGEN_NR + 1);
  }
});

test('Leerlauf: Mit Gegnern im Wagen läuft nichts von selbst', () => {
  const spiel = erzeugeSpiel(3);
  assert.equal(istGefahrlos(spiel.zustand), false);
  assert.equal(schrittZurTuer(spiel.zustand), null);
  assert.equal(darfWeiterHalten(spiel.zustand, 'hoch'), false);
});

test('Leerlauf: In einem leer gewordenen Kampfwagen läuft man zur Tür', () => {
  const spiel = erzeugeSpiel(3);
  const z = spiel.zustand;
  z.gegner = [];
  z.tuerOffen = true;
  z.angebot = null;
  assert.equal(laufe(spiel).ende, 'durch die Tür');
});

test('Leerlauf: Vor dem Drängler in der Engstelle hält der Lauf an, der Spieler entscheidet', () => {
  const spiel = erzeugeSpiel(9, { startWagen: SPEISEWAGEN_NR, staerken: { sprint: true } });
  const { ende } = laufe(spiel);
  assert.equal(ende, 'kein Weg');
  assert.deepEqual([spiel.zustand.spieler.x, spiel.zustand.spieler.y], [2, 5], 'direkt vor ihm');
  assert.equal(darfWeiterHalten(spiel.zustand, 'hoch'), false, 'auch der Finger stößt ihn nicht an');
});

test('Leerlauf: Antworten beim Begleiter betritt der Lauf nie, das Gespräch hält ihn an', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const spiel = erzeugeSpiel(seed, { startWagen: SPEISEWAGEN_NR, begleiter: 'pendler', szene: { nr: 1, zufall: 5 } });
    const { ende, e } = laufe(spiel);
    if (ende === 'nicht glatt') assert.ok(e.some((x) => x.typ === 'gespraech'), `Seed ${seed}`);
    else assert.equal(ende, 'durch die Tür', `Seed ${seed}`);
    assert.ok(!spiel.zustand.begleiter || !spiel.zustand.begleiter.gesprochen, `Seed ${seed}: von selbst geantwortet`);
  }
});

test('Leerlauf: Der gehaltene Finger geht nur auf freie Felder und durch die offene Tür', () => {
  const spiel = erzeugeSpiel(9, { startWagen: SPEISEWAGEN_NR });
  const z = spiel.zustand;
  assert.equal(darfWeiterHalten(z, 'hoch'), true);
  assert.equal(darfWeiterHalten(z, 'runter'), false, 'unten ist die Wand');
  z.spieler.x = 2;
  z.spieler.y = 0;
  assert.equal(darfWeiterHalten(z, 'hoch'), true, 'durch die offene Tür');
  assert.equal(istGlatt([{ typ: 'schritt' }]), true);
  assert.equal(istGlatt([{ typ: 'schritt' }, { typ: 'gespraech' }]), false);
  assert.equal(istGlatt([]), false);
});
