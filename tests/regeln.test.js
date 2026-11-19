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
  z.wagen.typen = [...new Set(z.gegner.map((g) => g.typ))];
  z.tuerOffen = z.gegner.length === 0;
  z.angebot = null; // Szenen ohne leuchtendes Symbol, es sei denn, ein Test legt eines hin
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
  assert.deepEqual(typen(e), ['warten', 'hieb', 'treffer', 'tod', 'gelocht']);
  assert.equal(e[4].hell, false, 'ein Tod hinterlässt eine dunkle Lochung');
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
  assert.deepEqual(typen(e), ['tuerStoss', 'aufgebrochen', 'tuerAuf', 'tod', 'gelocht']);
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

// ---------------------------------------------------------------- Präsenz (Etappe 2)

// Spieler auf 2,7 mit zwei Ruhe, ein Pendler hat sein Feld angekündigt: Ausweichen bringt volle Ruhe.
function vorVollerRuhe(weitere = []) {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 2, y: 6, mit: { ansage: [{ x: 2, y: 7 }] } }, ...weitere], ruhe: 2 });
  return spiel;
}

test('Präsenz: Wer volle Ruhe erreicht, vor dem zögert der nächste Gegner einmal, statt anzukündigen', () => {
  const spiel = vorVollerRuhe();
  const z = spiel.zustand;
  let e = spiel.act('rechts'); // aus dem Rot nach 3,7: volle Ruhe
  assert.equal(z.spieler.ruhe, RUHE_VOLL);
  assert.equal(z.spieler.praesenz, true);
  e = spiel.act('warten'); // der Pendler steht schräg und tritt heran
  assert.ok(typen(e).includes('gegnerSchritt'));
  e = spiel.act('warten'); // jetzt würde er ankündigen, aber er zögert
  assert.ok(typen(e).includes('zoegert'), typen(e).join(','));
  assert.equal(istMarkiert(z, 3, 7), false);
  assert.equal(z.spieler.praesenz, false, 'einmal je voller Ruhe');
  e = spiel.act('warten');
  assert.ok(typen(e).includes('ansage'), 'danach kündigt er wieder an');
});

test('Präsenz: Es zögert nur der Gegner, der als Nächster angreifen würde', () => {
  const spiel = vorVollerRuhe([{ typ: 'pendler', x: 4, y: 6 }]);
  spiel.act('rechts'); // nach 3,7, volle Ruhe; der zweite Pendler tritt heran
  let e = spiel.act('warten'); // der zweite würde ankündigen und zögert, der erste tritt heran
  assert.deepEqual(e.filter((x) => x.typ === 'zoegert').map((x) => x.id), [2]);
  assert.deepEqual(e.filter((x) => x.typ === 'ansage').map((x) => x.id), []);
  e = spiel.act('warten'); // die Präsenz ist verbraucht, beide kündigen an
  assert.deepEqual(e.filter((x) => x.typ === 'ansage').map((x) => x.id).sort(), [1, 2]);
});

test('Präsenz: Ein Treffer nimmt sie, erst neue volle Ruhe bringt sie zurück', () => {
  const spiel = vorVollerRuhe();
  const z = spiel.zustand;
  spiel.act('rechts');
  assert.equal(z.spieler.praesenz, true);
  z.gegner[0].ansage = [{ x: 3, y: 7 }];
  spiel.act('warten'); // getroffen
  assert.equal(z.spieler.ruhe, 0);
  assert.equal(z.spieler.praesenz, false);
});

// ---------------------------------------------------------------- Stärken aus Schatten (Etappe 2)

const STILL = { pause: 999 }; // ein Pendler, der nichts tut, für Szenen ohne Störung

test('Stärken: Sie kommen aus früheren Fahrten mit, sonst gibt es keine', () => {
  assert.deepEqual(erzeugeSpiel(1).zustand.staerken, { warten: false, sprint: false, rueckhalt: false });
  assert.deepEqual(erzeugeSpiel(1, { staerken: { sprint: true, unsinn: true } }).zustand.staerken, { warten: false, sprint: true, rueckhalt: false });
});

test('Pendler verstehen: Wer dreimal neben ihm wartet, bekommt Ruhe fürs Warten, wirksam ab dem nächsten Zug', () => {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 2, y: 6, mit: STILL }] });
  const z = spiel.zustand;
  spiel.act('warten');
  spiel.act('warten');
  const e = spiel.act('warten');
  const v = e.filter((x) => x.typ === 'verstanden');
  assert.deepEqual(v.map((x) => [x.staerke, x.gegner]), [['warten', 'pendler']]);
  assert.ok(!typen(e).includes('ruhigGewartet'), 'nicht schon im selben Zug');
  assert.equal(z.staerken.warten, true);
  assert.ok(typen(spiel.act('warten')).includes('ruhigGewartet'));
  assert.equal(z.spieler.ruhe, 1);
});

test('Ruhe fürs Warten: nur neben einem Gegner und nur, wenn man nicht getroffen wird', () => {
  const spiel = szene({ spieler: [0, 7], gegner: [{ typ: 'pendler', x: 4, y: 0, mit: STILL }] });
  spiel.zustand.staerken.warten = true;
  assert.ok(!typen(spiel.act('warten')).includes('ruhigGewartet'), 'allein im Wagen');
  const neben = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 2, y: 6, mit: { ansage: [{ x: 2, y: 7 }] } }] });
  neben.zustand.staerken.warten = true;
  const e = neben.act('warten');
  assert.ok(typen(e).includes('treffer'));
  assert.ok(!typen(e).includes('ruhigGewartet'));
});

test('Drängler verstehen: Wer dreimal seiner Linie ausweicht, ohne ihn zu schlagen, bekommt den Sprint', () => {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'draengler', x: 2, y: 0 }] });
  const z = spiel.zustand;
  const linie = (x) => [0, 1, 2, 3, 4, 5, 6, 7].filter((y) => y > 0).map((y) => ({ x, y }));
  let e;
  for (const [x, schritt] of [[2, 'rechts'], [3, 'links'], [2, 'rechts']]) {
    const g = z.gegner[0];
    g.x = x;
    g.y = 0;
    g.erschoepft = 0;
    g.ansage = linie(x);
    e = spiel.act(schritt);
    assert.ok(typen(e).includes('ausgewichen'), typen(e).join(','));
  }
  assert.deepEqual(e.filter((x) => x.typ === 'verstanden').map((x) => x.staerke), ['sprint']);
  assert.equal(z.staerken.sprint, true);
});

test('Drängler verstehen: Ein Schlag gegen ihn beginnt das Zählen von vorn', () => {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'draengler', x: 2, y: 6 }] });
  const z = spiel.zustand;
  z.verstehen.draengler = 2;
  spiel.act('hoch');
  assert.equal(z.verstehen.draengler, 0);
});

test('Reisegruppe verstehen: Wer ihren Wagen mit einem Herz verlässt, bekommt Rückhalt', () => {
  const spiel = szene({ spieler: [2, 0], herzen: 1 });
  spiel.zustand.wagen.mitGruppe = true;
  const e = spiel.act('hoch');
  assert.deepEqual(typen(e), ['wagenwechsel', 'verstanden']);
  assert.equal(e[1].staerke, 'rueckhalt');
  const ohne = szene({ spieler: [2, 0], herzen: 2 });
  ohne.zustand.wagen.mitGruppe = true;
  assert.deepEqual(typen(ohne.act('hoch')), ['wagenwechsel'], 'mit zwei Herzen nicht');
});

test('Rückhalt: Einmal je Fahrt bleibt nach einem tödlichen Treffer ein Herz', () => {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 2, y: 6, mit: { ansage: [{ x: 2, y: 7 }] } }], herzen: 1 });
  const z = spiel.zustand;
  z.staerken.rueckhalt = true;
  let e = spiel.act('warten');
  assert.ok(typen(e).includes('rueckhalt'));
  assert.equal(z.spieler.herzen, 1);
  assert.equal(z.status, 'faehrt');
  z.gegner[0].ansage = [{ x: 2, y: 7 }];
  e = spiel.act('warten');
  assert.ok(typen(e).includes('tod'), 'beim zweiten Mal nicht mehr');
});

test('Sprint: zwei Felder geradeaus für eine Ruhe, nur mit der Stärke und mit Ruhe', () => {
  const ohne = szene({ spieler: [2, 7], ruhe: 1, gegner: [{ typ: 'pendler', x: 4, y: 0, mit: STILL }] });
  assert.deepEqual(ohne.act('sprint-hoch'), [], 'ohne Stärke passiert nichts');
  const spiel = szene({ spieler: [2, 7], ruhe: 0, gegner: [{ typ: 'pendler', x: 4, y: 0, mit: STILL }] });
  const z = spiel.zustand;
  z.staerken.sprint = true;
  assert.deepEqual(typen(spiel.act('sprint-hoch')), ['ungueltig'], 'ohne Ruhe nicht');
  z.spieler.ruhe = 2;
  const e = spiel.act('sprint-hoch');
  assert.equal(e[0].typ, 'sprint');
  assert.deepEqual([z.spieler.x, z.spieler.y], [2, 5]);
  assert.equal(z.spieler.ruhe, 1);
  assert.equal(z.zug, 1, 'ein Zug');
});

test('Sprint: Gegner auf dem Weg nehmen Schaden, der Spieler landet dahinter', () => {
  const spiel = szene({ spieler: [2, 7], ruhe: 1, gegner: [{ typ: 'pendler', x: 2, y: 6 }] });
  const z = spiel.zustand;
  z.staerken.sprint = true;
  const e = spiel.act('sprint-hoch');
  assert.deepEqual(e[0].getroffen.map((t) => [t.id, t.hp]), [[1, 1]]);
  assert.deepEqual([z.spieler.x, z.spieler.y], [2, 5]);
  assert.equal(z.gegner[0].hp, 1);
});

test('Sprint: Hindernisse halten ihn auf, steht dahinter ein Gegner, bleibt man davor stehen', () => {
  const plan = ['.....', '.....', '.....', '.....', '.....', '..S..', '.....', '.....'];
  const spiel = szene({ spieler: [2, 7], ruhe: 1, plan, gegner: [{ typ: 'pendler', x: 4, y: 0, mit: STILL }] });
  spiel.zustand.staerken.sprint = true;
  spiel.act('sprint-hoch');
  assert.deepEqual([spiel.zustand.spieler.x, spiel.zustand.spieler.y], [2, 6], 'der Sitz hält ihn nach einem Feld auf');
  const zwei = szene({ spieler: [2, 7], ruhe: 1, gegner: [{ typ: 'pendler', x: 2, y: 5, mit: STILL }] });
  zwei.zustand.staerken.sprint = true;
  const e = zwei.act('sprint-hoch');
  assert.deepEqual([zwei.zustand.spieler.x, zwei.zustand.spieler.y], [2, 6]);
  assert.equal(e[0].getroffen.length, 1);
});

// ---------------------------------------------------------------- Speisewagen (Etappe 2)

test('Speisewagen: Er folgt auf den Mittelwagen, hat keine Gegner, die Tür ist offen, und er heilt zwei Herzen', () => {
  const spiel = erzeugeSpiel(9, { startWagen: 2 });
  const z = spiel.zustand;
  z.gegner = [];
  z.tuerOffen = true;
  z.spieler.x = 2;
  z.spieler.y = 0;
  z.spieler.herzen = 2;
  const e = spiel.act('hoch');
  assert.deepEqual(typen(e), ['wagenwechsel', 'geheilt']);
  assert.equal(z.wagen.art, 'speisewagen');
  assert.equal(z.spieler.herzen, 4);
  assert.equal(e[1].plus, 2);
  assert.equal(z.gegner.length, 0);
  assert.equal(z.tuerOffen, true);
});

test('Speisewagen: Mehr als volle Herzen gibt es nicht', () => {
  const spiel = erzeugeSpiel(9, { startWagen: 2 });
  const z = spiel.zustand;
  z.gegner = [];
  z.tuerOffen = true;
  z.spieler.x = 2;
  z.spieler.y = 0;
  z.spieler.herzen = 4;
  const e = spiel.act('hoch');
  assert.equal(z.spieler.herzen, HERZEN_VOLL);
  assert.equal(e[1].plus, 1);
});

test('Speisewagen: An den Tischen sitzt, wen der Spieler verstanden hat', () => {
  const ohne = erzeugeSpiel(9, { startWagen: 3 }).zustand;
  assert.deepEqual(ohne.wagen.fahrgaeste, []);
  const mit = erzeugeSpiel(9, { startWagen: 3, staerken: { warten: true, sprint: true } }).zustand;
  assert.deepEqual(mit.wagen.fahrgaeste.map((f) => f.typ).sort(), ['draengler', 'pendler']);
  for (const f of mit.wagen.fahrgaeste) assert.notEqual(mit.wagen.plan[f.y][f.x], '.', 'sie sitzen auf Plätzen, nicht im Gang');
});

// ---------------------------------------------------------------- Gönnen (Etappe 2)

function imSpeisewagen(herzen) {
  const spiel = erzeugeSpiel(9, { startWagen: 3 });
  const z = spiel.zustand;
  z.spieler.herzen = herzen;
  const tisch = z.wagen.plan[2][0] === 'T' ? 0 : 4; // der Wagen kann gespiegelt sein
  z.spieler.x = tisch === 0 ? 1 : 3;
  z.spieler.y = 2;
  return { spiel, z, richtung: tisch === 0 ? 'links' : 'rechts' };
}

test('Gönnen: Wer im Speisewagen gegen einen Tisch läuft, lässt dort ein Herz, einmal je Besuch', () => {
  const { spiel, z, richtung } = imSpeisewagen(3);
  const e = spiel.act(richtung);
  assert.equal(e[0].typ, 'gegoennt');
  assert.equal(z.spieler.herzen, 2);
  assert.ok(z.wagen.gegoennt);
  assert.equal(z.zug, 1, 'es kostet einen Zug');
  assert.deepEqual(typen(spiel.act(richtung)), ['ungueltig'], 'nur einmal je Besuch');
  assert.equal(z.spieler.herzen, 2);
});

test('Gönnen: Das letzte Herz lässt man nicht liegen', () => {
  const { spiel, z, richtung } = imSpeisewagen(1);
  assert.deepEqual(typen(spiel.act(richtung)), ['ungueltig']);
  assert.equal(z.spieler.herzen, 1);
});

test('Gönnen: Meistens kommt nichts zurück, manchmal sitzt später jemand mehr am Tisch', () => {
  let zurueck = 0;
  for (let seed = 1; seed <= 60; seed++) {
    const spiel = erzeugeSpiel(seed, { startWagen: 3 });
    const z = spiel.zustand;
    z.spieler.herzen = 3;
    const tisch = z.wagen.plan[2][0] === 'T' ? 0 : 4;
    z.spieler.x = tisch === 0 ? 1 : 3;
    z.spieler.y = 2;
    const e = spiel.act(tisch === 0 ? 'links' : 'rechts');
    if (e[0].zurueck) zurueck += 1;
    assert.equal(e[0].mehrAmTisch, e[0].zurueck ? 1 : 0);
  }
  assert.ok(zurueck > 5 && zurueck < 35, `${zurueck} von 60`);
  // eine spätere Fahrt: jemand mehr am Tisch, auf einem Platz, nicht im Gang
  const spaeter = erzeugeSpiel(1, { startWagen: 3, mehrAmTisch: 2 }).zustand;
  assert.equal(spaeter.wagen.fahrgaeste.length, 2);
  for (const f of spaeter.wagen.fahrgaeste) assert.notEqual(spaeter.wagen.plan[f.y][f.x], '.');
  assert.equal(erzeugeSpiel(1, { mehrAmTisch: 'viele' }).zustand.mehrAmTisch, 0);
});

// ---------------------------------------------------------------- Fahrkarte (Etappe 2)

// Ein leerer Wagen mit einem stillen Pendler weit weg und einem Angebot auf 2,5.
function mitAngebot(id, weitere = {}) {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 4, y: 0, mit: STILL }], ...weitere });
  spiel.zustand.angebot = { id, x: 2, y: 5 };
  return spiel;
}

function verlasse(spiel) {
  const z = spiel.zustand;
  z.tuerOffen = true;
  z.spieler.x = 2;
  z.spieler.y = 0;
  return spiel.act('hoch');
}

test('Fahrkarte: In jedem Wagen außer dem Speisewagen liegt ein Angebot auf einem freien Feld', () => {
  for (let nr = 0; nr < WAGENZAHL; nr++) {
    for (let seed = 1; seed <= 20; seed++) {
      const z = erzeugeSpiel(seed, { startWagen: nr }).zustand;
      if (z.wagen.sicher) {
        assert.equal(z.angebot, null);
        continue;
      }
      const a = z.angebot;
      assert.ok(a, `Wagen ${nr + 1}`);
      assert.equal(z.wagen.plan[a.y][a.x], '.');
      assert.ok(!z.gegner.some((g) => g.x === a.x && g.y === a.y));
    }
  }
});

test('Fahrkarte: Angeboten wird nur, was noch nicht gelocht ist', () => {
  const alle = ['aufregen', 'aussteigen', 'rempeln', 'draengeln', 'puenktlich'];
  const z = erzeugeSpiel(4, { fahrkarte: { lochungen: alle.map((id) => ({ art: 'pruefung', id })) } }).zustand;
  assert.equal(z.angebot.id, 'ruhe');
  const voll = erzeugeSpiel(4, { fahrkarte: { lochungen: [...alle, 'ruhe'].map((id) => ({ art: 'pruefung', id })) } }).zustand;
  assert.equal(voll.angebot, null);
});

test('Fahrkarte: Drauftreten nimmt an, vorbeigehen kostet nichts', () => {
  const spiel = mitAngebot('rempeln');
  const z = spiel.zustand;
  spiel.act('hoch');
  const e = spiel.act('hoch');
  assert.ok(typen(e).includes('angenommen'));
  assert.equal(z.angebot, null);
  assert.equal(z.pruefung.id, 'rempeln');
  const vorbei = mitAngebot('rempeln');
  vorbei.act('links');
  const v = verlasse(vorbei);
  assert.ok(!typen(v).includes('gelocht'));
  assert.equal(vorbei.zustand.fahrkarte.lochungen.length, 0);
});

test('Fahrkarte: Ohne Rempeln und Pünktlich ergeben eine helle Lochung beim Verlassen des Wagens', () => {
  for (const id of ['rempeln', 'puenktlich', 'aufregen', 'draengeln']) {
    const spiel = mitAngebot(id);
    spiel.act('hoch');
    spiel.act('hoch');
    const e = verlasse(spiel);
    const l = e.find((x) => x.typ === 'gelocht');
    assert.ok(l && l.hell && l.id === id, id);
    assert.deepEqual(spiel.zustand.fahrkarte.lochungen, [{ art: 'pruefung', id, hell: true }]);
  }
});

test('Fahrkarte: Nicht aufregen gilt nicht mehr nach einem Schlag, Ohne Rempeln nicht nach einem Treffer', () => {
  const schlag = mitAngebot('aufregen');
  schlag.act('hoch');
  schlag.act('hoch');
  schlag.zustand.gegner[0].x = 2;
  schlag.zustand.gegner[0].y = 4;
  schlag.act('hoch'); // ein Schlag
  assert.ok(!typen(verlasse(schlag)).includes('gelocht'));
  const treffer = mitAngebot('rempeln');
  treffer.act('hoch');
  treffer.act('hoch');
  treffer.zustand.gegner[0].ansage = [{ x: 2, y: 5 }];
  treffer.act('warten'); // getroffen
  assert.ok(!typen(verlasse(treffer)).includes('gelocht'));
});

test('Fahrkarte: Erst aussteigen lassen braucht drei Züge Stillstand hintereinander', () => {
  const spiel = mitAngebot('aussteigen');
  spiel.act('hoch');
  spiel.act('hoch');
  spiel.act('warten');
  spiel.act('warten');
  spiel.act('links');
  spiel.act('warten');
  assert.ok(!typen(verlasse(spiel)).includes('gelocht'), 'zweimal, dann eine Bewegung, reicht nicht');
  const ruhig = mitAngebot('aussteigen');
  ruhig.act('hoch');
  ruhig.act('hoch');
  for (let i = 0; i < 3; i++) ruhig.act('warten');
  assert.ok(typen(verlasse(ruhig)).includes('gelocht'));
});

test('Fahrkarte: Pünktlich heißt höchstens zwölf Züge nach dem Annehmen, Ruhe bewahren heißt volle Ruhe', () => {
  const spaet = mitAngebot('puenktlich');
  spaet.act('hoch');
  spaet.act('hoch');
  for (let i = 0; i < 13; i++) spaet.act('warten');
  assert.ok(!typen(verlasse(spaet)).includes('gelocht'));
  const ruhe = mitAngebot('ruhe');
  ruhe.act('hoch');
  ruhe.act('hoch');
  assert.ok(!typen(verlasse(ruhe)).includes('gelocht'), 'ohne volle Ruhe nicht');
  const voll = mitAngebot('ruhe', { ruhe: 3 });
  voll.act('hoch');
  voll.act('hoch');
  assert.ok(typen(verlasse(voll)).includes('gelocht'));
});

test('Fahrkarte: Ein Tod hinterlässt eine dunkle Lochung, je Ursache nur eine', () => {
  const karte = { lochungen: [] };
  for (let i = 0; i < 2; i++) {
    const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 2, y: 6, mit: { ansage: [{ x: 2, y: 7 }] } }], herzen: 1 });
    spiel.zustand.fahrkarte = karte;
    spiel.act('warten');
  }
  assert.deepEqual(karte.lochungen, [{ art: 'tod', durch: 'pendler', hell: false }]);
});

test('Fahrkarte: Die dunkle Lochung wird hell, wenn man einen Wagen mit dieser Ursache ohne ihren Treffer verlässt', () => {
  const spiel = szene({ spieler: [2, 7], gegner: [{ typ: 'pendler', x: 4, y: 0, mit: STILL }] });
  const z = spiel.zustand;
  z.fahrkarte = { lochungen: [{ art: 'tod', durch: 'pendler', hell: false }, { art: 'tod', durch: 'draengler', hell: false }] };
  const e = verlasse(spiel);
  assert.deepEqual(e.filter((x) => x.typ === 'aufgehellt').map((x) => x.durch), ['pendler']);
  assert.deepEqual(z.fahrkarte.lochungen.map((l) => l.hell), [true, false], 'ohne Drängler im Wagen bleibt seine dunkel');
});

test('Fahrkarte: Sie kommt aus früheren Fahrten mit, Unsinn fällt weg', () => {
  const z = erzeugeSpiel(1, { fahrkarte: { lochungen: [{ art: 'pruefung', id: 'rempeln' }, { art: 'pruefung', id: 'rempeln' }, { art: 'tod', durch: 'pendler' }, { art: 'tod', durch: 'drache' }, 7, null] } }).zustand;
  assert.deepEqual(z.fahrkarte.lochungen, [{ art: 'pruefung', id: 'rempeln', hell: true }, { art: 'tod', durch: 'pendler', hell: false }]);
  assert.deepEqual(erzeugeSpiel(1, { fahrkarte: 'alt' }).zustand.fahrkarte, { lochungen: [] });
});

// ---------------------------------------------------------------- Begleiter und Reise (Etappe 2)

import { optionenFuerFahrt, SPEISEWAGEN_NR } from '../src/kern/reise.js';

function mitBegleiter(durch, seed = 9) {
  const spiel = erzeugeSpiel(seed, { startWagen: SPEISEWAGEN_NR, begleiter: durch });
  const z = spiel.zustand;
  const b = z.begleiter;
  // neben ihn: das Gangfeld in seiner Reihe
  const neben = { x: b.x === 4 ? 3 : 1, y: b.y };
  z.spieler.x = neben.x;
  z.spieler.y = neben.y + 1;
  return { spiel, z, b };
}

test('Begleiter: Nach einem Tod sitzt er im Speisewagen, sonst nicht', () => {
  const { z } = mitBegleiter('draengler');
  assert.equal(z.begleiter.durch, 'draengler');
  assert.notEqual(z.wagen.plan[z.begleiter.y][z.begleiter.x], '.', 'er sitzt auf einem Platz');
  assert.equal(erzeugeSpiel(9, { startWagen: SPEISEWAGEN_NR }).zustand.begleiter, null);
});

test('Begleiter: Wer neben ihn tritt, hört die Frage, drei Antworten liegen vor ihm, eine ist die ehrliche', () => {
  const { spiel, z } = mitBegleiter('draengler');
  const e = spiel.act('hoch'); // neben ihn
  const g = e.find((x) => x.typ === 'gespraech');
  assert.ok(g, typen(e).join(','));
  assert.equal(g.antworten.length, 3);
  assert.ok(g.antworten.some((a) => a.id === 'draengler'));
  assert.ok(g.antworten.some((a) => a.id === 'pech'));
  for (const a of g.antworten) assert.equal(z.wagen.plan[a.y][a.x], '.');
});

test('Begleiter: Die ehrliche Antwort gibt eine helle Lochung, eine andere hat keine Folge', () => {
  for (const ehrlich of [true, false]) {
    const { spiel, z } = mitBegleiter('pendler');
    const g = spiel.act('hoch').find((x) => x.typ === 'gespraech');
    const ziel = g.antworten.find((a) => (a.id === 'pendler') === ehrlich);
    z.spieler.x = ziel.x;
    z.spieler.y = ziel.y + (ziel.y < z.spieler.y ? 1 : -1);
    const e = spiel.act(ziel.y < z.spieler.y ? 'hoch' : 'runter');
    const a = e.find((x) => x.typ === 'antwort');
    assert.ok(a, typen(e).join(','));
    assert.equal(a.ehrlich, ehrlich);
    assert.equal(z.fahrkarte.lochungen.some((l) => l.art === 'ehrlich'), ehrlich);
    assert.equal(z.begleiter.gesprochen, true, 'nur einmal');
  }
});

test('Reise: Nach einem Tod hinter dem Speisewagen beginnt die nächste Fahrt dort, davor vorn', () => {
  const stand = { staerken: { warten: true }, mehrAmTisch: 1, fahrkarte: { lochungen: [{ art: 'pruefung', id: 'ruhe', hell: true }] } };
  const hinten = optionenFuerFahrt(stand, { status: 'tot', wagenNr: 5, todDurch: 'gruppe' });
  assert.equal(hinten.startWagen, SPEISEWAGEN_NR);
  assert.equal(hinten.begleiter, 'gruppe');
  assert.equal(hinten.fahrkarte, stand.fahrkarte, 'die Fahrkarte bleibt');
  const vorn = optionenFuerFahrt(stand, { status: 'tot', wagenNr: 1, todDurch: 'pendler' });
  assert.equal(vorn.startWagen, undefined);
  assert.equal(vorn.begleiter, 'pendler');
  const neu = optionenFuerFahrt(stand, { status: 'halt', wagenNr: WAGENZAHL - 1 });
  assert.deepEqual(neu.fahrkarte, { lochungen: [] }, 'nach dem Halt beginnt eine neue Reise');
  assert.equal(neu.begleiter, undefined);
  assert.deepEqual(optionenFuerFahrt(stand, null).staerken, { warten: true });
});
