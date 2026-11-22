// Jede Regel des Abends als kleine Szene. Der Saal wird dafür von Hand gefüllt.

import test from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeAbend, gueltig, FENSTER, PLAETZE } from '../src/kern/abend.js';

let naechste = 1000;
const gast = (zeigt, echt = zeigt) => ({ id: naechste++, zeigt, echt });

// ein Abend mit leerem Saal und genau diesen Gästen an der Tür
function saal(tuer = [], baenke = [[], [], [], [], []]) {
  const abend = erzeugeAbend(1);
  const z = abend.zustand;
  z.tuer = tuer;
  z.baenke = baenke;
  z.geraeumt = 2; // nach dem Einstieg
  z.ersterFalscher = 'aufgeflogen';
  return abend;
}

test('setzen: der vordere Gast von der Tür auf eine Bank, an den äußersten Platz', () => {
  const a = gast(0);
  const b = gast(1);
  const abend = saal([a, b], [[gast(2)], [], [], [], []]);
  const e = abend.act({ von: 'tuer', nach: 0 });
  assert.equal(e[0].typ, 'gesetzt');
  assert.deepEqual(abend.zustand.baenke[0].map((g) => g.id).slice(-1), [a.id]);
  assert.deepEqual(abend.zustand.tuer, [b]);
});

test('umsetzen: nur der äußerste Gast einer Bank, nie auf eine volle Bank, nie auf die eigene', () => {
  const innen = gast(0);
  const aussen = gast(1);
  const abend = saal([gast(2)], [[innen, aussen], [gast(3), gast(3), gast(2), gast(1)], [], [], []]);
  const z = abend.zustand;
  assert.equal(gueltig(z, { von: 0, nach: 1 }), false, 'volle Bank');
  assert.equal(gueltig(z, { von: 0, nach: 0 }), false, 'eigene Bank');
  assert.equal(gueltig(z, { von: 2, nach: 3 }), false, 'leere Bank hat niemanden');
  assert.deepEqual(abend.act({ von: 0, nach: 1 }), [], 'Ungültiges ändert nichts');
  abend.act({ von: 0, nach: 2 });
  assert.deepEqual(z.baenke[0], [innen]);
  assert.deepEqual(z.baenke[2], [aussen]);
});

test('Schimmern: zwei Ehrliche gleicher Farbe nebeneinander, verschiedene nicht', () => {
  const abend = saal([gast(1), gast(1), gast(2)], [[gast(1)], [], [], [], []]);
  const e = abend.act({ von: 'tuer', nach: 0 });
  assert.ok(e.some((x) => x.typ === 'schimmer'));
  const f = abend.act({ von: 'tuer', nach: 1 });
  assert.ok(!f.some((x) => x.typ === 'schimmer'), 'neben niemandem');
  const g = abend.act({ von: 'tuer', nach: 0 });
  assert.ok(!g.some((x) => x.typ === 'schimmer'), 'neben einer anderen Farbe');
});

test('ein Falscher schimmert nicht neben der Farbe, die er zeigt, sondern neben seiner echten', () => {
  const falsch = gast(0, 2); // zeigt rot, ist grün
  const abend = saal([falsch], [[gast(0)], [gast(2)], [], [], []]);
  const e = abend.act({ von: 'tuer', nach: 0 });
  assert.ok(!e.some((x) => x.typ === 'schimmer'), 'neben einem echten Roten: nichts');
  const f = abend.act({ von: 0, nach: 1 });
  assert.ok(f.some((x) => x.typ === 'schimmer' && x.ids.includes(falsch.id)), 'neben einem echten Grünen: Schimmern');
});

test('Räumen: vier Ehrliche derselben Farbe gehen, die Bank wird frei, ein Fenster leuchtet', () => {
  const abend = saal([gast(3), gast(1)], [[gast(3), gast(3), gast(3)], [], [], [], []]);
  const z = abend.zustand;
  const e = abend.act({ von: 'tuer', nach: 0 });
  const r = e.find((x) => x.typ === 'geraeumt');
  assert.ok(r);
  assert.equal(r.fenster, 3);
  assert.deepEqual(z.baenke[0], []);
  assert.equal(z.geraeumt, 3);
});

test('Auffliegen: vier scheinbar Gleiche mit einem Falschen räumen nicht, er zeigt seine echte Farbe und behält sie', () => {
  const falsch = gast(1, 3);
  const abend = saal([falsch, gast(0)], [[gast(1), gast(1), gast(1)], [], [], [], []]);
  const z = abend.zustand;
  const e = abend.act({ von: 'tuer', nach: 0 });
  assert.ok(!e.some((x) => x.typ === 'geraeumt'));
  const auf = e.find((x) => x.typ === 'aufgeflogen');
  assert.deepEqual(auf.gaeste.map((g) => [g.id, g.echt, g.platz]), [[falsch.id, 3, 3]]);
  assert.equal(falsch.zeigt, 3);
  assert.equal(z.baenke[0].length, PLAETZE);
  assert.deepEqual(z.verlauf.aufgeflogen.map((a) => a.wie), ['zuletzt']);
  // er bleibt, was er jetzt zeigt: wieder umgesetzt, schimmert er neben seiner Farbe
  z.baenke[1] = [gast(3)];
  const f = abend.act({ von: 0, nach: 1 });
  assert.ok(f.some((x) => x.typ === 'schimmer'));
  assert.equal(falsch.zeigt, 3);
});

test('wer unter anderen auffliegt, dem wurde zu schnell geglaubt', () => {
  const falsch = gast(2, 0);
  const abend = saal([gast(2)], [[gast(2), falsch, gast(2)], [], [], [], []]);
  abend.act({ von: 'tuer', nach: 0 });
  assert.deepEqual(abend.zustand.verlauf.aufgeflogen.map((a) => [a.id, a.wie]), [[falsch.id, 'geglaubt']]);
});

test('Tür: nach jedem zweiten Zug kommt ein Gast; kommt ein vierter zu dreien, endet der Abend', () => {
  const abend = saal([gast(0), gast(1), gast(2)], [[gast(3)], [], [], [], []]);
  const z = abend.zustand;
  const e1 = abend.act({ von: 0, nach: 1 });
  assert.ok(!e1.some((x) => x.typ === 'ankunft'));
  assert.equal(z.zug % 2, 1);
  z.zug = 1;
  const e2 = abend.act({ von: 1, nach: 2 });
  assert.ok(e2.some((x) => x.typ === 'ende' && x.wie === 'tuer'), 'drei warten, ein vierter käme');
  assert.equal(z.status, 'ende');
  assert.deepEqual(abend.act({ von: 'tuer', nach: 0 }), [], 'danach geht nichts mehr');
});

test('Ende, wenn alle Fenster leuchten', () => {
  const abend = saal([gast(0)], [[gast(0), gast(0), gast(0)], [], [], [], []]);
  abend.zustand.geraeumt = FENSTER - 1;
  const e = abend.act({ von: 'tuer', nach: 0 });
  assert.ok(e.some((x) => x.typ === 'ende' && x.wie === 'hell'));
  assert.equal(abend.zustand.status, 'ende');
});

test('Ende, wenn kein Zug mehr geht: alle Bänke voll und jemand wartet', () => {
  const voll = () => [gast(0), gast(1), gast(2), gast(3)];
  const abend = saal([gast(1), gast(2)], [voll(), voll(), voll(), voll(), [gast(0), gast(1), gast(2)]]);
  const e = abend.act({ von: 'tuer', nach: 4 });
  assert.ok(e.some((x) => x.typ === 'ende' && x.wie === 'fest'));
});

test('gleicher Startwert und gleiche Züge ergeben den gleichen Abend, ein anderer einen anderen', () => {
  const spiele = (seed) => {
    const abend = erzeugeAbend(seed);
    const z = abend.zustand;
    const spur = [];
    for (let i = 0; i < 200 && z.status === 'laeuft'; i++) {
      // ein fester, einfacher Spieler: Tür auf die erste freie Bank, sonst den ersten möglichen Zug
      let a = null;
      for (let b = 0; b < 5 && !a; b++) if (gueltig(z, { von: 'tuer', nach: b })) a = { von: 'tuer', nach: b };
      for (let v = 0; v < 5 && !a; v++) for (let b = 0; b < 5 && !a; b++) if (gueltig(z, { von: v, nach: b })) a = { von: v, nach: b };
      spur.push(JSON.stringify(abend.act(a)));
    }
    return JSON.stringify(z) + spur.join();
  };
  assert.equal(spiele(77), spiele(77));
  assert.notEqual(spiele(77), spiele(78));
});
