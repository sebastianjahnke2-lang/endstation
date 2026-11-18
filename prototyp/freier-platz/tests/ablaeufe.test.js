// Feste Abläufe von Anfang bis zur Tür. Jeder ist eine Art, den Wagen zu durchfahren.

import test from 'node:test';
import assert from 'node:assert/strict';
import { spiele } from './hilfe.js';

const feld = (x, y) => ({ tipp: 'feld', x, y });
const lampe = (name) => ({ tipp: 'lampe', name });
const alle = (listen) => [].concat(...listen);
const folge = (listen, typen) => alle(listen).filter((e) => typen.includes(e.typ)).map((e) => (e.typ === 'wartet' ? `wartet ${e.reihe}` : e.typ === 'locht' ? `locht ${e.wen}` : e.typ === 'lampe' ? `lampe ${e.name}` : e.typ));

test('Tasche, Lampe A, Lochung, Schaffner wartet in Reihe 2, Lampe B, er grüßt und geht', () => {
  const handlungen = [
    feld(0, 5), // Tasche nehmen
    lampe('A'), // Schatten in den Gang
    'warten', 'warten', // er kommt und locht
    'warten', 'warten', 'warten', // er geht bis Reihe 2
    'rechts', 'hoch', 'hoch', // aufstehen, hinterher bis Reihe 3
    lampe('B'), // der Schatten des Schlafenden fällt in den Gang
    'warten', 'warten', 'warten', // er grüßt, geht, verlässt den Wagen
    'hoch', 'hoch', 'hoch',
  ];
  const { z, listen } = spiele(handlungen);
  assert.deepEqual(
    folge(listen, ['nimmt', 'lampe', 'locht', 'wartet', 'nickt', 'gruesst', 'schaffnerWeg', 'ende']).filter((t, i, a) => t !== a[i - 1]),
    ['nimmt', 'lampe A', 'locht wacher', 'locht spieler', 'wartet 2', 'lampe B', 'nickt', 'gruesst', 'schaffnerWeg', 'ende'],
  );
  assert.equal(z.status, 'ende');
  assert.equal(z.spieler.gelocht, true);
  assert.deepEqual(z.tatsachen, []);
  // kein Anstoßen, kein Vorbeidrängen, kein Wecken
  assert.equal(alle(listen).filter((e) => ['anstoss', 'draengt', 'weckt'].includes(e.typ)).length, 0);
});

test('ans Fenster rutschen: Lochung ohne die Lampe', () => {
  const { z, listen } = spiele(['links', 'links', 'warten', 'warten', 'warten']);
  assert.deepEqual(folge(listen, ['nimmt', 'locht', 'wartet', 'lampe']), ['nimmt', 'locht wacher', 'locht spieler']);
  assert.equal(z.spieler.gelocht, true);
  assert.equal(z.schaffner.y, 4);
});

test('sofort losgehen und die Tasche liegen lassen', () => {
  const { z, listen } = spiele(['rechts', 'hoch', 'hoch', 'hoch', 'hoch', 'hoch']);
  assert.equal(z.status, 'ende');
  assert.equal(z.spieler.gelocht, false);
  assert.equal(z.tasche, true);
  assert.deepEqual(z.tatsachen, [{ art: 'wartet', reihe: 5 }, { art: 'tasche' }]);
  // der Satz fällt hinter dem Rücken des Spielers
  assert.equal(alle(listen).filter((e) => e.typ === 'wartet' && e.satz).length, 1);
});

test('Vorbeidrängen: am wartenden Schaffner in Reihe 2 vorbei zur Tür', () => {
  const handlungen = [
    feld(0, 5), lampe('A'), 'warten', 'warten', // Lochung am Platz
    'warten', 'warten', 'warten', 'warten', // er wartet in Reihe 2
    'rechts', 'hoch', 'hoch', // bis hinter ihn
    'hoch', // Anstoßen
    'hoch', // Vorbeidrängen
    'hoch', 'hoch',
  ];
  const { z, listen } = spiele(handlungen);
  assert.deepEqual(listen[11].map((e) => e.typ).slice(0, 1), ['anstoss']);
  assert.equal(listen[12][0].typ, 'draengt');
  assert.deepEqual(listen[12][0].schaffnerNach, { x: 2, y: 3 });
  assert.equal(z.status, 'ende');
  // er steht wieder in Reihe 2 und wartet, das steht auf der Anzeige
  assert.deepEqual(z.tatsachen, [{ art: 'wartet', reihe: 2 }]);
});

test('wecken statt schwenken: Der Fahrgast ist wach, der Schaffner wartet weiter', () => {
  const handlungen = [
    feld(0, 5), 'rechts', 'hoch', 'hoch', 'hoch', // mit Tasche in den Gang, bis Reihe 2
    feld(3, 2), // wecken
    'hoch', 'warten', 'warten', 'warten', 'warten', 'warten',
    'hoch',
  ];
  const { z } = spiele(handlungen);
  assert.equal(z.status, 'ende');
  assert.deepEqual(z.tatsachen, [{ art: 'wartet', reihe: 2 }, { art: 'wach' }]);
});
