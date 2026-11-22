// Spur und Verhör: Die abgewandte Haltung entsteht und endet genau nach Regel 1. Ein Verhör kostet genau ein
// Fenster und nie einen Zug. Abbrechen kostet nichts. Der Abend bleibt ohne Verhör schaffbar.

import test from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeAbend } from '../src/kern/abend.js';
import { spieleAbend } from './bots.js';

let naechste = 5000;
const gast = (zeigt, echt = zeigt) => ({ id: naechste++, zeigt, echt, abgewandt: 0 });

function saal(tuer = [], baenke = [[], [], [], [], []], licht = 2) {
  const abend = erzeugeAbend(1);
  const z = abend.zustand;
  z.tuer = tuer;
  z.baenke = baenke;
  z.geraeumt = 2;
  z.licht = licht;
  z.ersterFalscher = 'aufgeflogen';
  return abend;
}

test('Spur entsteht: wer abrückt, sitzt abgewandt, beide Beteiligten, jeder zu seiner Seite', () => {
  const ehrlich = gast(0);
  const falsch = gast(0, 2);
  const abend = saal([falsch], [[ehrlich], [], [], [], []]);
  abend.act({ von: 'tuer', nach: 0 });
  assert.equal(ehrlich.abgewandt, -1);
  assert.equal(falsch.abgewandt, 1);
});

test('Spur bleibt beim Umsetzen, beim Zudecken und neben einer anderen Farbe', () => {
  const ehrlich = gast(0);
  const falsch = gast(0, 2);
  const abend = saal([falsch, gast(3)], [[ehrlich], [gast(1)], [], [], []]);
  abend.act({ von: 'tuer', nach: 0 });
  abend.act({ von: 0, nach: 1 }); // der Falsche zu einem Blauen: nichts
  assert.equal(falsch.abgewandt, 1);
  assert.equal(ehrlich.abgewandt, -1);
  abend.act({ von: 'tuer', nach: 1 }); // ein Violetter auf ihn: nichts
  assert.equal(falsch.abgewandt, 1);
});

test('Spur endet, sobald er neben seiner echten Farbe zusammenrückt, auch wenn ein anderer auf ihn gesetzt wird', () => {
  const ehrlich = gast(0);
  const falsch = gast(0, 2);
  const abend = saal([falsch, gast(0)], [[ehrlich], [gast(2)], [], [], []]);
  abend.act({ von: 'tuer', nach: 0 });
  abend.act({ von: 0, nach: 1 }); // der Falsche zu einem echten Grünen: zusammen
  assert.equal(falsch.abgewandt, 0);
  assert.equal(ehrlich.abgewandt, -1, 'der Ehrliche bleibt abgewandt, bis er selbst zusammenrückt');
  abend.act({ von: 'tuer', nach: 0 }); // ein Roter auf den Ehrlichen: zusammen
  assert.equal(ehrlich.abgewandt, 0);
});

test('Spur endet beim Auffliegen und beim Verhör', () => {
  const falsch = gast(1, 3);
  const abend = saal([falsch], [[gast(1), gast(1), gast(1)], [], [], [], []]);
  falsch.abgewandt = 1;
  abend.act({ von: 'tuer', nach: 0 });
  assert.equal(falsch.zeigt, 3);
  assert.equal(falsch.abgewandt, 0);
  const zweiter = gast(2, 0);
  zweiter.abgewandt = -1;
  const ab2 = saal([zweiter]);
  ab2.act({ verhoer: zweiter.id });
  assert.equal(zweiter.abgewandt, 0);
});

test('Verhör: kostet genau ein Fenster und keinen Zug, der Gast zeigt seine echte Farbe und behält sie', () => {
  const falsch = gast(1, 3);
  const abend = saal([falsch, gast(2)], [[gast(0)], [], [], [], []], 3);
  const z = abend.zustand;
  z.zug = 5;
  const vorher = { zug: z.zug, tuer: z.tuer.length, geraeumt: z.geraeumt };
  const e = abend.act({ verhoer: falsch.id });
  assert.deepEqual(e.map((x) => x.typ), ['verhoer'], 'kein Zug: niemand kommt an die Tür');
  assert.equal(z.licht, 2);
  assert.equal(z.zug, vorher.zug);
  assert.equal(z.tuer.length, vorher.tuer);
  assert.equal(z.geraeumt, vorher.geraeumt, 'geräumte Bänke bleiben, nur das Licht geht aus');
  assert.equal(falsch.zeigt, 3);
  // er behält sie: neben einem Violetten rückt er zusammen
  z.baenke[1] = [gast(3)];
  abend.act({ von: 'tuer', nach: 1 });
  const f = abend.act({ von: 0, nach: 2 });
  assert.equal(falsch.zeigt, 3);
  assert.ok(f.length);
});

test('Verhör auch bei Ehrlichen: kostet ein Fenster, ändert sonst nichts', () => {
  const ehrlich = gast(2);
  const abend = saal([ehrlich], undefined, 1);
  abend.act({ verhoer: ehrlich.id });
  assert.equal(abend.zustand.licht, 0);
  assert.equal(ehrlich.zeigt, 2);
});

test('ohne leuchtendes Fenster kein Verhör, ein Unbekannter auch nicht', () => {
  const g = gast(1, 3);
  const abend = saal([g], undefined, 0);
  const vorher = JSON.stringify(abend.zustand);
  assert.deepEqual(abend.act({ verhoer: g.id }), []);
  const mit = saal([gast(1)], undefined, 2);
  assert.deepEqual(mit.act({ verhoer: 99999 }), []);
  assert.equal(JSON.stringify(abend.zustand), vorher);
});

test('hell erst, wenn alle Fenster leuchten: ein Verhör verlangt eine Bank mehr', () => {
  const abend = saal([gast(0), gast(1)], [[gast(0), gast(0), gast(0)], [], [], [], []], 13);
  abend.zustand.geraeumt = 13;
  abend.act({ verhoer: abend.zustand.tuer[1].id });
  const e = abend.act({ von: 'tuer', nach: 0 });
  assert.ok(e.some((x) => x.typ === 'geraeumt'));
  assert.equal(abend.zustand.status, 'laeuft', '13 Fenster leuchten, nicht 14');
});

test('der Abend bleibt ohne Verhör schaffbar, auch für den langsamen Spieler', () => {
  let hinsehend = 0;
  let langsam = 0;
  for (let seed = 1; seed <= 150; seed++) {
    if (spieleAbend(seed, 'hinseher').z.ende === 'hell') hinsehend += 1;
    const r = spieleAbend(seed, 'langsam');
    assert.equal(r.verhoert, 0);
    if (r.z.ende === 'hell') langsam += 1;
  }
  assert.ok(hinsehend >= 150 * 0.8, `hinsehend ${hinsehend}`);
  assert.ok(langsam >= 150 * 0.55, `langsam ${langsam}`);
});

test('der langsame Spieler mit Verhör verhört wirklich und kommt ans Ende jedes Abends', () => {
  let verhoert = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const r = spieleAbend(seed, 'langsamVerhoer');
    verhoert += r.verhoert;
    assert.equal(r.z.status, 'ende');
  }
  assert.ok(verhoert >= 20, `nur ${verhoert} Verhöre`);
});

// Die Bühne ohne Browser: ein Stift, der nichts malt, und gerade genug Fenster und Dokument.
function attrappe() {
  const stift = new Proxy({}, {
    get: (z, name) => (name === 'createRadialGradient' || name === 'createLinearGradient' ? () => ({ addColorStop: () => {} }) : () => {}),
    set: () => true,
  });
  const leinwand = () => ({ width: 0, height: 0, clientWidth: 390, clientHeight: 844, getContext: () => stift });
  globalThis.window = { devicePixelRatio: 1, innerWidth: 390, innerHeight: 844 };
  globalThis.document = { createElement: leinwand };
  return leinwand();
}

test('Bedienung: Glocke wählt an, ein Tipp auf einen Gast verhört, ein Tipp woandershin bricht ab und kostet nichts', async () => {
  const { erzeugeSaalBuehne } = await import('../src/anzeige/buehne.js');
  const leinwand = attrappe();
  const buehne = erzeugeSaalBuehne(leinwand);
  buehne.passeAn();
  const m = buehne.masse();
  const sitzt = gast(1, 3);
  const abend = saal([gast(0)], [[sitzt], [], [], [], []], 0);
  abend.zustand.geraeumt = 0;
  buehne.neu(abend.zustand);
  const g = m.glocke;
  // vor dem ersten Fenster gibt es keine Glocke
  buehne.tippe(g.cx, g.cy, 0);
  assert.equal(buehne.verhoerAn(), false);
  // das erste Fenster leuchtet: Die Glocke erscheint
  abend.zustand.geraeumt = 1;
  abend.zustand.licht = 1;
  buehne.spiele([{ typ: 'geraeumt', bank: 4, farbe: 0, ids: [], fenster: 1 }], 0);
  const platz = m.baenke[0].plaetze[0];
  const leer = m.baenke[2].plaetze[1];
  // anwählen und abbrechen: kostet nichts
  buehne.tippe(g.cx, g.cy, 1000);
  assert.equal(buehne.verhoerAn(), true);
  const vorher = JSON.stringify(abend.zustand);
  assert.equal(buehne.tippe(leer.cx, leer.fy - 10, 1100), null);
  assert.equal(buehne.verhoerAn(), false);
  assert.equal(JSON.stringify(abend.zustand), vorher);
  // anwählen und einen Gast antippen: verhört ihn
  buehne.tippe(g.cx, g.cy, 1200);
  assert.deepEqual(buehne.tippe(platz.cx, platz.fy - 10, 1300), { verhoer: sitzt.id });
  // der Gast an der Tür lässt sich auch verhören
  buehne.tippe(g.cx, g.cy, 1400);
  const t = m.tuer.plaetze[0];
  assert.deepEqual(buehne.tippe(t.cx, t.fy - 10, 1500), { verhoer: abend.zustand.tuer[0].id });
  // ohne leuchtendes Fenster: matt und stumm, nichts wird angewählt
  abend.zustand.licht = 0;
  buehne.tippe(g.cx, g.cy, 1600);
  assert.equal(buehne.verhoerAn(), false);
  delete globalThis.window;
  delete globalThis.document;
});
