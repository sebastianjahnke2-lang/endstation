// Die Schicht: ein Halt nach dem anderen, Steigerung, drei Entkommene beenden sie, ein Tipp beginnt die nächste.

import test from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeKontrolle, ENTKOMMEN_HOECHSTENS } from '../src/kern/durchgang.js';
import { maschenFuer, zielZeit, ZEIT_ANFANG } from '../src/kern/auslosen.js';
import { hinsehen, kuerzesterFang } from '../src/kern/pruefung.js';
import { haltZug } from '../src/kern/kontrolle.js';

const typen = (e) => e.map((x) => x.typ);

// spielt einen Halt so, wie jemand, der hinsieht (gleiche Strategie wie in pruefung.js)
function schaffeHalt(spiel) {
  const weg = kuerzesterFang(JSON.parse(JSON.stringify(spiel.zustand)));
  let e = [];
  for (const h of weg) e = e.concat(spiel.act(h));
  return e;
}

test('nach jedem Halt folgt sofort der nächste, ohne Eingabe dazwischen', () => {
  const spiel = erzeugeKontrolle(11);
  const e = schaffeHalt(spiel);
  assert.deepEqual(typen(e).slice(-3), ['gefangen', 'station', 'neuerHalt']);
  assert.equal(spiel.zustand.halt, 1);
  assert.equal(spiel.zustand.status, 'faehrt');
});

test('drei Entkommene beenden die Schicht. Danach beginnt jede Eingabe sofort die nächste', () => {
  const spiel = erzeugeKontrolle(5);
  let ende = null;
  for (let i = 0; i < 400 && spiel.zustand.status !== 'aus'; i++) {
    const e = spiel.act('warten');
    if (e.some((x) => x.typ === 'aus')) ende = e;
  }
  assert.equal(spiel.zustand.status, 'aus');
  assert.equal(spiel.zustand.entkommen, ENTKOMMEN_HOECHSTENS);
  const aus = ende.find((x) => x.typ === 'aus');
  assert.equal(aus.station, spiel.zustand.halt, 'die letzte erreichte Station');
  // wer nur wartet, lässt bei jedem Halt einen entkommen, außer zwei sitzen im Wagen
  assert.ok(spiel.zustand.halt <= 2);
  const neu = spiel.act('hoch');
  assert.deepEqual(neu, [{ typ: 'neuerHalt', halt: 0 }]);
  assert.equal(spiel.zustand.status, 'faehrt');
  assert.equal(spiel.zustand.entkommen, 0);
  assert.equal(spiel.zustand.schicht, 1);
});

test('jede Station wird gemeldet, mit der Zahl der Entkommenen bis dahin', () => {
  const spiel = erzeugeKontrolle(5);
  const stationen = [];
  for (let i = 0; i < 400 && spiel.zustand.status !== 'aus'; i++) for (const e of spiel.act('warten')) if (e.typ === 'station') stationen.push(e);
  assert.deepEqual(stationen.map((s) => s.nr), stationen.map((s, i) => i));
  assert.equal(stationen[stationen.length - 1].entkommen, 3);
  for (let i = 1; i < stationen.length; i++) assert.ok(stationen[i].entkommen > stationen[i - 1].entkommen);
});

test('Steigerung: erst ein Platzwechsler, dann jede neue Masche allein, danach gemischt, ab Halt 6 manchmal zwei', () => {
  const z = { zufall: 1 };
  assert.deepEqual(maschenFuer(z, 0), ['platz']);
  assert.deepEqual(maschenFuer(z, 1), ['platz']);
  assert.deepEqual(maschenFuer(z, 2), ['schein']);
  assert.deepEqual(maschenFuer(z, 3), ['wc']);
  let zweiVorSechs = 0;
  let zweiAbSechs = 0;
  const gesehen = new Set();
  for (let seed = 1; seed < 300; seed++) {
    const q = { zufall: seed };
    for (let h = 4; h < 14; h++) {
      const m = maschenFuer(q, h);
      m.forEach((x) => gesehen.add(x));
      if (m.length === 2) {
        assert.notEqual(m[0], m[1]);
        if (h < 5) zweiVorSechs += 1;
        else zweiAbSechs += 1;
      }
    }
  }
  assert.equal(zweiVorSechs, 0);
  assert.ok(zweiAbSechs > 100, `nur ${zweiAbSechs} Halte mit zweien`);
  assert.equal(gesehen.size, 3);
});

test('die Zeit wird langsam knapper, aber nie knapper als der kürzeste Weg', () => {
  assert.equal(zielZeit(0), ZEIT_ANFANG);
  for (let h = 1; h < 30; h++) assert.ok(zielZeit(h) <= zielZeit(h - 1));
  const spiel = erzeugeKontrolle(3);
  const zeiten = [];
  for (let h = 0; h < 14; h++) {
    const z = spiel.zustand;
    zeiten.push(z.zuegeGesamt);
    const weg = kuerzesterFang(JSON.parse(JSON.stringify(z)));
    assert.ok(weg && weg.length < z.zuegeGesamt, `Halt ${h + 1}: ${z.zuegeGesamt} Züge, nötig ${weg && weg.length}`);
    schaffeHalt(spiel);
  }
  assert.ok(zeiten[0] > zeiten[13], zeiten.join(' '));
});

test('wer hinsieht, kommt weit: 14 Halte ohne einen Entkommenen', () => {
  const spiel = erzeugeKontrolle(21);
  for (let h = 0; h < 14; h++) {
    assert.equal(hinsehen(JSON.parse(JSON.stringify(spiel.zustand))), 'gefangen', `Halt ${h + 1}`);
    schaffeHalt(spiel);
  }
  assert.equal(spiel.zustand.entkommen, 0);
  assert.equal(spiel.zustand.halt, 14);
});

test('gleicher Seed, gleiche Eingaben, gleicher Verlauf über viele Halte', () => {
  for (const seed of [0, 9, 4711]) {
    const a = erzeugeKontrolle(seed);
    const b = erzeugeKontrolle(seed);
    for (let i = 0; i < 120; i++) {
      const h = ['hoch', 'warten', 'rechts', 'links', 'hoch', 'runter'][i % 6];
      assert.deepEqual(a.act(h), b.act(h));
    }
    assert.deepEqual(a.zustand, b.zustand);
  }
  assert.notDeepEqual(erzeugeKontrolle(1).zustand.fahrgaeste, erzeugeKontrolle(2).zustand.fahrgaeste);
});

test('haltZug allein kennt keine Schicht: Der Halt endet, ohne dass ein neuer beginnt', () => {
  const spiel = erzeugeKontrolle(11);
  const z = JSON.parse(JSON.stringify(spiel.zustand));
  for (let i = 0; i < 30 && z.status === 'faehrt'; i++) haltZug(z, 'warten');
  assert.equal(z.status, 'entkommen');
});
