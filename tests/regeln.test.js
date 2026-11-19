// Die Regeln aus Etappe 1, jede als eigene kleine Szene.

import test from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeSpiel, HERZEN_VOLL, RUHE_VOLL } from '../src/kern/spiel.js';
import { neuerGegner } from '../src/kern/gegner.js';
import { WAGENPLAENE, WAGENZAHL } from '../src/kern/wagen.js';
import { istMarkiert } from '../src/kern/lage.js';

const LEER = ['.....', '.....', '.....', '.....', '.....', '.....', '.....', '.....'];

// Baut eine Szene: leerer Wagen (oder eigener Plan), Spieler und Gegner an festen Plätzen.
function szene({ spieler = [2, 7], gegner = [], plan = LEER, herzen, ruhe }) {
  const spiel = erzeugeSpiel(1);
  const z = spiel.zustand;
  z.wagen.plan = plan;
  z.spieler.x = spieler[0];
  z.spieler.y = spieler[1];
  if (herzen !== undefined) z.spieler.herzen = herzen;
  if (ruhe !== undefined) z.spieler.ruhe = ruhe;
  z.gegner = gegner.map((g, i) => {
    const neu = neuerGegner(i + 1, { gruppe: 1, rang: i, ...g });
    Object.assign(neu, g.mit || {});
    return neu;
  });
  z.wagen.mitKontrolleur = z.gegner.some((g) => g.typ === 'kontrolleur');
  z.tuerOffen = z.gegner.length === 0;
  return spiel;
}

const typen = (ereignisse) => ereignisse.map((e) => e.typ);

test('Start: fünf Herzen, keine Ruhe, unten in der Mitte', () => {
  const { zustand: z } = erzeugeSpiel(3);
  assert.deepEqual([z.spieler.x, z.spieler.y, z.spieler.herzen, z.spieler.ruhe], [2, 7, HERZEN_VOLL, 0]);
  assert.equal(z.tuerOffen, false);
});

test('ungültige Eingaben kosten keinen Zug und ändern nichts', () => {
  const spiel = szene({ spieler: [0, 7], gegner: [{ typ: 'pendler', x: 4, y: 0 }], plan: ['.....', '.....', '.....', '.....', '.....', '.....', 'S....', '.....'] });
  const vorher = JSON.stringify(spiel.zustand);
  for (const aktion of ['links', 'runter', 'hoch', 'quer']) {
    const e = spiel.act(aktion);
    if (aktion !== 'quer') assert.deepEqual(typen(e), ['ungueltig'], aktion);
    assert.equal(JSON.stringify(spiel.zustand), vorher, aktion);
  }
});

test('die Tür bleibt zu, solange ein Gegner steht, und geht mit dem letzten auf', () => {
  const spiel = szene({ spieler: [2, 0], gegner: [{ typ: 'pendler', x: 3, y: 0, mit: { hp: 1 } }] });
  assert.equal(typen(spiel.act('hoch'))[0], 'tuerStoss', 'gegen die geschlossene Tür laufen');
  assert.equal(spiel.zustand.tuerOffen, false);
  assert.equal(spiel.zustand.wagenNr, 0);
  spiel.zustand.gegner[0].ansage = null; // der Pendler hat inzwischen angekündigt, das spielt hier keine Rolle
  const e = spiel.act('rechts');
  assert.deepEqual(typen(e), ['schlag', 'tuerAuf']);
  assert.equal(spiel.zustand.tuerOffen, true);
  assert.deepEqual(typen(spiel.act('hoch')), ['wagenwechsel']);
  assert.equal(spiel.zustand.wagenNr, 1);
  assert.deepEqual([spiel.zustand.spieler.x, spiel.zustand.spieler.y], [2, 7]);
});

test('nach dem letzten Wagen ist Halt', () => {
  const spiel = erzeugeSpiel(5, { startWagen: WAGENZAHL - 1 });
  const z = spiel.zustand;
  z.gegner = [];
  z.tuerOffen = true;
  z.spieler.x = 2;
  z.spieler.y = 0;
  assert.deepEqual(typen(spiel.act('hoch')), ['halt']);
  assert.equal(z.status, 'halt');
  assert.deepEqual(spiel.act('hoch'), []);
});

test('Pendler: läuft heran, markiert das Feld des Spielers, trifft einen Zug später', () => {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 2, y: 4 }] });
  const z = spiel.zustand;
  assert.deepEqual(typen(spiel.act('warten')), ['warten', 'gegnerSchritt']); // 2,5
  assert.deepEqual(typen(spiel.act('warten')), ['warten', 'gegnerSchritt']); // 2,6, jetzt daneben
  assert.equal(istMarkiert(z, 2, 7), false, 'wer herantritt, markiert noch nicht');
  assert.deepEqual(typen(spiel.act('warten')), ['warten', 'ansage']);
  assert.equal(istMarkiert(z, 2, 7), true);
  assert.equal(z.spieler.herzen, HERZEN_VOLL, 'die Ankündigung selbst tut nichts');
  assert.deepEqual(typen(spiel.act('warten')), ['warten', 'hieb', 'treffer']);
  assert.equal(z.spieler.herzen, HERZEN_VOLL - 1);
});

test('Pendler: wer ihn kommen lässt, schlägt zweimal und bleibt heil', () => {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 2, y: 5 }] });
  spiel.act('warten'); // er tritt heran
  assert.deepEqual(typen(spiel.act('hoch')), ['schlag', 'ansage']);
  assert.deepEqual(typen(spiel.act('hoch')), ['schlag', 'tuerAuf']);
  assert.equal(spiel.zustand.spieler.herzen, HERZEN_VOLL);
});

test('der langsame Pendler setzt nach jedem Schritt und jedem Hieb einen Zug aus', () => {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 2, y: 3, langsam: true }] });
  const z = spiel.zustand;
  const hoehen = [];
  for (let i = 0; i < 6; i++) {
    spiel.act('warten');
    hoehen.push(z.gegner[0].y);
  }
  assert.deepEqual(hoehen, [4, 4, 5, 5, 6, 6]);
});

test('Ruhe: plus eins beim Verlassen eines roten Felds, höchstens drei', () => {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 2, y: 6 }], ruhe: 2 });
  const z = spiel.zustand;
  spiel.act('warten'); // Ansage auf 2,7
  const e = spiel.act('links');
  assert.deepEqual(typen(e), ['schritt', 'hieb', 'ausgewichen']);
  assert.equal(z.spieler.ruhe, RUHE_VOLL);
  assert.equal(z.spieler.herzen, HERZEN_VOLL);
});

test('Ruhe: ein Treffer setzt sie auf null', () => {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 2, y: 6 }], ruhe: 3 });
  spiel.act('warten');
  spiel.act('warten');
  assert.equal(spiel.zustand.spieler.ruhe, 0);
});

test('Ruhe: keine für das Wegschlagen des Angreifers und keine für einen Schritt ohne Rot', () => {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 2, y: 6, mit: { hp: 1 } }, { typ: 'pendler', x: 0, y: 0 }] });
  const z = spiel.zustand;
  spiel.act('warten'); // Ansage auf 2,7
  spiel.act('hoch'); // Angreifer besiegt
  assert.equal(z.spieler.ruhe, 0);
  assert.equal(z.spieler.herzen, HERZEN_VOLL, 'sein Angriff ist verfallen');
  spiel.act('links');
  assert.equal(z.spieler.ruhe, 0);
});

test('stirbt ein Gegner, verfällt sein angekündigter Angriff', () => {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'draengler', x: 2, y: 6, mit: { hp: 1 } }] });
  const z = spiel.zustand;
  spiel.act('warten');
  assert.equal(istMarkiert(z, 2, 7), true);
  spiel.act('hoch');
  assert.equal(z.gegner.length, 0);
  assert.equal(istMarkiert(z, 2, 7), false);
  assert.equal(z.spieler.herzen, HERZEN_VOLL);
});

test('höchstens ein Herz je Zug, auch wenn mehrere treffen', () => {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 2, y: 6 }, { typ: 'pendler', x: 1, y: 7 }, { typ: 'pendler', x: 3, y: 7 }] });
  spiel.act('warten');
  const e = spiel.act('warten');
  assert.equal(e.filter((x) => x.typ === 'hieb' && x.trifft).length, 3);
  assert.equal(spiel.zustand.spieler.herzen, HERZEN_VOLL - 1);
});

test('Drängler: markiert die ganze Linie, stürmt hindurch, ist danach einen Zug erschöpft', () => {
  const spiel = szene({ spieler: [1, 4], gegner: [{ typ: 'draengler', x: 1, y: 0 }] });
  const z = spiel.zustand;
  const d = z.gegner[0];
  spiel.act('warten');
  assert.deepEqual(d.ansage, [1, 2, 3, 4, 5, 6, 7].map((y) => ({ x: 1, y })), 'Linie bis zur Wand');
  const e = spiel.act('rechts'); // ausweichen
  assert.deepEqual(typen(e), ['schritt', 'vorstoss', 'ausgewichen']);
  assert.deepEqual([d.x, d.y], [1, 7], 'er läuft bis ans Ende der Linie');
  assert.equal(d.erschoepft, 1);
  assert.deepEqual(typen(spiel.act('warten')), ['warten'], 'erschöpft: er tut nichts');
  assert.equal(d.erschoepft, 0);
  assert.equal(typen(spiel.act('warten')).length, 2, 'danach handelt er wieder');
});

test('Drängler: trifft den Spieler in der Linie und bleibt vor ihm stehen', () => {
  const spiel = szene({ spieler: [1, 4], gegner: [{ typ: 'draengler', x: 1, y: 0 }] });
  const z = spiel.zustand;
  spiel.act('warten');
  const e = spiel.act('runter'); // bleibt in der Linie
  assert.deepEqual(typen(e), ['schritt', 'vorstoss', 'treffer']);
  assert.deepEqual([z.gegner[0].x, z.gegner[0].y], [1, 4]);
  assert.equal(z.spieler.herzen, HERZEN_VOLL - 1);
});

test('Drängler: die Linie endet am Hindernis, und ohne freie Sicht kündigt er nicht an', () => {
  const plan = ['.....', '.....', '.....', '.....', '.....', '.S...', '.....', '.....'];
  const spiel = szene({ spieler: [1, 3], gegner: [{ typ: 'draengler', x: 1, y: 0 }], plan });
  spiel.act('warten');
  assert.deepEqual(spiel.zustand.gegner[0].ansage, [1, 2, 3, 4].map((y) => ({ x: 1, y })));

  const verdeckt = szene({ spieler: [1, 7], gegner: [{ typ: 'draengler', x: 1, y: 0 }], plan });
  verdeckt.act('warten');
  assert.equal(verdeckt.zustand.gegner[0].ansage, null);
});

test('Gegner blockieren einander und treffen sich nicht', () => {
  const spiel = szene({ spieler: [1, 6], gegner: [{ typ: 'draengler', x: 1, y: 0 }, { typ: 'pendler', x: 4, y: 3, mit: { pause: 99 } }] });
  const z = spiel.zustand;
  spiel.act('warten'); // Linie in Spalte 1
  z.gegner[1].x = 1; // der Pendler steht plötzlich im Weg
  z.gegner[1].y = 3;
  spiel.act('rechts');
  assert.deepEqual([z.gegner[0].x, z.gegner[0].y], [1, 2], 'der Drängler bleibt vor dem Pendler stehen');
  assert.equal(z.gegner[1].hp, 2, 'der Pendler bleibt heil');
});

test('Reisegruppe: der Vorderste kündigt zwei Felder an und läuft sie, die anderen rücken auf', () => {
  const spiel = szene({
    spieler: [2, 7],
    gegner: [{ typ: 'gruppe', x: 2, y: 2 }, { typ: 'gruppe', x: 2, y: 1 }, { typ: 'gruppe', x: 2, y: 0 }],
  });
  const z = spiel.zustand;
  const [a, b, c] = z.gegner;
  spiel.act('warten');
  assert.deepEqual(a.ansage, [{ x: 2, y: 3 }, { x: 2, y: 4 }]);
  assert.equal(b.ansage, null, 'nur der Vorderste kündigt an');
  spiel.act('warten');
  assert.deepEqual([a.y, b.y, c.y], [4, 3, 2], 'zwei Felder je Zug, die Kette bleibt zusammen');
  assert.deepEqual(a.ansage, [{ x: 2, y: 5 }, { x: 2, y: 6 }]);
  spiel.act('warten');
  assert.deepEqual(a.ansage, [{ x: 2, y: 7 }], 'jetzt liegt das Feld des Spielers auf seinem Weg');
  assert.equal(z.spieler.herzen, HERZEN_VOLL);
});

test('Reisegruppe: fällt der Vorderste, übernimmt der Nächste und kündigt erst an', () => {
  const spiel = szene({
    spieler: [2, 7],
    gegner: [{ typ: 'gruppe', x: 2, y: 6 }, { typ: 'gruppe', x: 2, y: 5 }, { typ: 'gruppe', x: 2, y: 4 }],
  });
  const z = spiel.zustand;
  spiel.act('warten'); // Ansage auf 2,7
  const e = spiel.act('hoch'); // Vordersten besiegen
  assert.equal(z.spieler.herzen, HERZEN_VOLL, 'sein Angriff ist verfallen');
  assert.equal(z.gegner.length, 2);
  assert.deepEqual(z.gegner[0].ansage, [{ x: 2, y: 6 }, { x: 2, y: 7 }], 'der Neue kündigt an, läuft aber noch nicht');
  assert.deepEqual([z.gegner[0].y, z.gegner[1].y], [5, 4]);
  assert.ok(typen(e).includes('ansage'));
});

test('jede Ankündigung lässt sich mit einem Schritt verlassen', () => {
  // Form der Muster: einzelnes Feld, zwei Felder am Stück, gerade Linie.
  // Von jedem Feld eines Musters gibt es ein Nachbarfeld im Wagen, das nicht zum selben Muster gehört.
  const faelle = [
    szene({ spieler: [0, 7], gegner: [{ typ: 'pendler', x: 0, y: 6 }] }),
    szene({ spieler: [0, 7], gegner: [{ typ: 'draengler', x: 0, y: 0 }] }),
    szene({ spieler: [4, 0], gegner: [{ typ: 'draengler', x: 0, y: 0 }] }),
    szene({ spieler: [0, 7], gegner: [{ typ: 'gruppe', x: 0, y: 4 }] }),
  ];
  for (const spiel of faelle) {
    spiel.act('warten');
    const muster = spiel.zustand.gegner[0].ansage;
    assert.ok(muster && muster.length > 0);
    for (const f of muster) {
      const nachbarn = [[0, -1], [1, 0], [0, 1], [-1, 0]].map(([dx, dy]) => ({ x: f.x + dx, y: f.y + dy }));
      const ausweg = nachbarn.some((n) => n.x >= 0 && n.x < 5 && n.y >= 0 && n.y < 8 && !muster.some((m) => m.x === n.x && m.y === n.y));
      assert.ok(ausweg, `kein Ausweg von ${f.x},${f.y}`);
    }
  }
});

test('der Tod beendet die Fahrt', () => {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 2, y: 6 }], herzen: 1 });
  spiel.act('warten');
  const e = spiel.act('warten');
  assert.deepEqual(typen(e), ['warten', 'hieb', 'treffer', 'tod']);
  assert.equal(spiel.zustand.status, 'tot');
  assert.deepEqual(spiel.act('links'), [], 'danach nimmt das Spiel nichts mehr an');
});

test('gleicher Seed und gleiche Eingaben ergeben dieselbe Fahrt', () => {
  const eingaben = ['hoch', 'hoch', 'warten', 'links', 'hoch', 'rechts', 'warten', 'hoch', 'hoch', 'runter', 'warten', 'links'];
  const lauf = () => {
    const spiel = erzeugeSpiel(4711);
    const protokoll = [];
    for (let i = 0; i < 60; i++) protokoll.push(spiel.act(eingaben[i % eingaben.length]));
    return JSON.stringify([protokoll, spiel.zustand]);
  };
  assert.equal(lauf(), lauf());
  const anfaenge = new Set();
  for (let seed = 1; seed <= 40; seed++) anfaenge.add(JSON.stringify(erzeugeSpiel(seed, { startWagen: 1 }).zustand.gegner));
  assert.ok(anfaenge.size > 3, 'verschiedene Seeds ergeben verschiedene Aufstellungen');
});

// ---------------------------------------------------------------- Aufbrechen (Etappe 2)

test('Aufbrechen: dreimal gegen die geschlossene Tür, jedes Mal ein Zug, beim dritten Mal geht sie auf und kostet ein Herz', () => {
  const spiel = szene({ spieler: [2, 0], gegner: [{ typ: 'pendler', x: 4, y: 7 }] });
  const z = spiel.zustand;
  for (const n of [1, 2]) {
    const e = spiel.act('hoch');
    assert.equal(e[0].typ, 'tuerStoss');
    assert.equal(e[0].n, n);
    assert.ok(typen(e).includes('gegnerSchritt'), 'die anderen sind dran, es kostet einen Zug');
    assert.equal(z.tuerOffen, false);
    assert.equal(z.zug, n);
  }
  const e = spiel.act('hoch');
  assert.deepEqual(typen(e).slice(0, 3), ['tuerStoss', 'aufgebrochen', 'tuerAuf']);
  assert.equal(z.tuerOffen, true);
  assert.equal(z.spieler.herzen, HERZEN_VOLL - 1);
  assert.equal(z.gegner.length, 1, 'der Pendler bleibt, man geht an ihm vorbei');
  assert.deepEqual(typen(spiel.act('hoch')), ['wagenwechsel']);
});

test('Aufbrechen: Die Stöße müssen nicht hintereinander kommen, und mit dem letzten Herz ist es der Tod', () => {
  const spiel = szene({ spieler: [2, 0], gegner: [{ typ: 'pendler', x: 4, y: 7, mit: { langsam: true } }], herzen: 1 });
  spiel.act('hoch');
  spiel.act('runter');
  spiel.act('hoch');
  spiel.act('hoch');
  const e = spiel.act('hoch');
  assert.deepEqual(typen(e), ['tuerStoss', 'aufgebrochen', 'tuerAuf', 'tod']);
  assert.equal(e[3].durch, 'tuer');
  assert.equal(spiel.zustand.status, 'tot');
});

test('Aufbrechen: Die Zahl der Stöße beginnt in jedem Wagen neu', () => {
  const spiel = szene({ spieler: [2, 0], gegner: [{ typ: 'pendler', x: 4, y: 7, mit: { hp: 1 } }] });
  spiel.act('hoch');
  spiel.act('hoch');
  spiel.zustand.tuerOffen = true;
  spiel.act('hoch');
  assert.equal(spiel.zustand.wagenNr, 1);
  assert.equal(spiel.zustand.tuerStoesse, 0);
});

// ---------------------------------------------------------------- Kontrolleur (Etappe 2)

const KONTROLLE = { typ: 'kontrolleur', x: 1, y: 0 };

test('Kontrolleur: Der Mittelwagen ist ein Autoritätswagen in der Mitte der Fahrt', () => {
  const nr = WAGENPLAENE.findIndex((w) => w.art === 'mittelwagen');
  assert.equal(nr, 2);
  assert.equal(WAGENPLAENE[nr].autoritaet, true);
  const z = erzeugeSpiel(3, { startWagen: nr }).zustand;
  assert.equal(z.gegner.filter((g) => g.typ === 'kontrolleur').length, 1);
  assert.equal(z.wagen.mitKontrolleur, true);
});

test('Kontrolleur: Wer in seine Nähe tritt, wird angesprochen, aber nicht geprüft', () => {
  const spiel = szene({ spieler: [2, 2], gegner: [KONTROLLE] });
  const e = spiel.act('hoch');
  const k = e.filter((x) => x.typ === 'kontrolle');
  assert.equal(k.length, 1);
  assert.equal(k[0].prueft, false);
  assert.equal(istMarkiert(spiel.zustand, 2, 1), false);
});

test('Kontrolleur: Wer sich in seiner Nähe bewegt, wird geprüft, und der Treffer kostet zwei Herzen', () => {
  const spiel = szene({ spieler: [2, 1], gegner: [KONTROLLE] });
  const e = spiel.act('hoch'); // von 2,1 nach 2,0: beide Felder liegen in seiner Nähe
  assert.ok(e.some((x) => x.typ === 'kontrolle' && x.prueft));
  assert.ok(istMarkiert(spiel.zustand, 2, 0), 'das Feld des Spielers ist angekündigt');
  const treffer = spiel.act('warten').filter((x) => x.typ === 'treffer');
  assert.equal(treffer.length, 1);
  assert.equal(treffer[0].schaden, 2);
  assert.equal(spiel.zustand.spieler.herzen, HERZEN_VOLL - 2);
});

test('Kontrolleur: Seine Prüfung lässt sich mit einem Schritt aus seiner Nähe verlassen', () => {
  const spiel = szene({ spieler: [2, 1], gegner: [KONTROLLE] });
  spiel.act('hoch');
  const e = spiel.act('rechts'); // nach 3,0, außerhalb seiner Nähe
  assert.ok(typen(e).includes('ausgewichen'));
  assert.equal(spiel.zustand.spieler.herzen, HERZEN_VOLL);
  assert.ok(!e.some((x) => x.typ === 'kontrolle'), 'außerhalb seiner Nähe prüft er nicht');
});

test('Kontrolleur: Wer drei Züge ruhig in seiner Nähe steht, wird durchgewinkt, auch wenn andere noch im Wagen sind', () => {
  const spiel = szene({ spieler: [2, 0], gegner: [KONTROLLE, { typ: 'pendler', x: 4, y: 7, mit: { langsam: true } }] });
  const z = spiel.zustand;
  assert.ok(spiel.act('warten').some((x) => x.typ === 'ruhig' && x.ruhig === 1));
  assert.ok(spiel.act('warten').some((x) => x.typ === 'ruhig' && x.ruhig === 2));
  const e = spiel.act('warten');
  assert.ok(typen(e).includes('durchgewinkt'));
  assert.equal(typen(e).indexOf('tuerAuf') > typen(e).indexOf('durchgewinkt'), true);
  assert.equal(z.tuerOffen, true);
  assert.equal(z.gegner.some((g) => g.typ === 'kontrolleur'), false, 'er ist fort');
  assert.equal(z.gegner.length, 1, 'der Pendler bleibt');
  assert.equal(z.spieler.herzen, HERZEN_VOLL);
  assert.deepEqual(typen(spiel.act('hoch')), ['wagenwechsel']);
});

test('Kontrolleur: Wer sich bewegt, fängt beim Stillstehen von vorn an', () => {
  const spiel = szene({ spieler: [2, 0], gegner: [KONTROLLE] });
  spiel.act('warten');
  spiel.act('warten');
  spiel.act('rechts'); // aus seiner Nähe hinaus
  spiel.act('links'); // wieder hinein, von außen
  spiel.act('warten');
  const e = spiel.act('warten');
  assert.ok(e.some((x) => x.typ === 'ruhig' && x.ruhig === 2));
  assert.equal(spiel.zustand.tuerOffen, false);
  assert.ok(typen(spiel.act('warten')).includes('durchgewinkt'));
});

test('Kontrolleur: Gegen die Tür laufen ist kein Stillstehen und keine Bewegung', () => {
  const spiel = szene({ spieler: [2, 0], gegner: [KONTROLLE] });
  spiel.act('warten');
  spiel.act('warten');
  const e = spiel.act('hoch');
  assert.ok(!e.some((x) => x.typ === 'kontrolle'), 'er prüft nicht');
  assert.equal(spiel.zustand.gegner[0].ruhig, 0, 'das Stillstehen beginnt von vorn');
});

test('Kontrolleur: Er geht nie von seinem Platz', () => {
  const spiel = szene({ spieler: [4, 7], gegner: [KONTROLLE] });
  for (const aktion of ['warten', 'hoch', 'hoch', 'links', 'warten', 'hoch', 'hoch', 'hoch', 'links', 'hoch', 'warten']) {
    spiel.act(aktion);
    const g = spiel.zustand.gegner.find((x) => x.typ === 'kontrolleur');
    if (g) assert.deepEqual([g.x, g.y], [1, 0], aktion);
  }
});

test('Kontrolleur: kämpfen. Wer ihn schlägt, wird geprüft. Nach fünf Schlägen ist er fort, und die Tür geht auf', () => {
  const spiel = szene({ spieler: [1, 1], gegner: [KONTROLLE, { typ: 'pendler', x: 4, y: 7, mit: { langsam: true } }] });
  const z = spiel.zustand;
  let e = spiel.act('hoch');
  assert.equal(e[0].typ, 'schlag');
  assert.ok(e.some((x) => x.typ === 'kontrolle' && x.prueft), 'er prüft den, der ihn schlägt');
  assert.ok(istMarkiert(z, 1, 1));
  // ausweichen und wiederkommen, ohne getroffen zu werden
  for (let i = 0; i < 4; i++) {
    spiel.act('runter'); // nach 1,2, außerhalb seiner Nähe
    spiel.act('hoch'); // wieder hinein, von außen: nur angesprochen
    e = spiel.act('hoch');
    assert.equal(e[0].typ, 'schlag');
  }
  assert.ok(e[0].besiegt);
  assert.ok(typen(e).includes('tuerAuf'));
  assert.equal(z.tuerOffen, true);
  assert.equal(z.spieler.herzen, HERZEN_VOLL);
});

test('Kontrolleur: Treffen er und ein Pendler im selben Zug, zählt nur ein Treffer, der schwerere', () => {
  const spiel = szene({ spieler: [2, 1], gegner: [KONTROLLE, { typ: 'pendler', x: 3, y: 0 }] });
  spiel.act('hoch'); // er prüft das Feld 2,0, der Pendler steht daneben und kündigt es ebenfalls an
  const e = spiel.act('warten');
  assert.equal(e.filter((x) => x.typ === 'hieb' && x.trifft).length, 2);
  assert.equal(e.filter((x) => x.typ === 'treffer').length, 1);
  assert.equal(spiel.zustand.spieler.herzen, HERZEN_VOLL - 2);
});
