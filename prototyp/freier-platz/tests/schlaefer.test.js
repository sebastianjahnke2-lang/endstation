// Zweiter Schritt: der Schlafende in Reihe 2, dessen Schatten auf dem Nebensitz liegt.

import test from 'node:test';
import assert from 'node:assert/strict';
import { runde } from '../src/kern/fahrt.js';
import { falschBelegt } from '../src/kern/licht.js';
import { spiele, lage } from './hilfe.js';

const feld = (x, y) => ({ tipp: 'feld', x, y });
const lampe = (name) => ({ tipp: 'lampe', name });
const typen = (liste) => liste.map((e) => e.typ);
const finde = (liste, typ) => liste.filter((e) => e.typ === typ)[0];

// Der Spieler steht im Gang in Reihe 3, der Schaffner kommt gerade in Reihe 2 an.
function vorReiheZwei(aenderung) {
  return lage((l) => {
    l.tasche = false;
    l.spieler.x = 2;
    l.spieler.y = 3;
    l.spieler.tasche = true;
    l.schaffner.y = 2;
    l.schaffner.tat = 'geht';
    l.wacher.gelocht = true;
    if (aenderung) aenderung(l);
  });
}

test('Reihe 2: Der Schatten des Schlafenden belegt den Fensterplatz, der Schaffner wartet und sagt den Satz', () => {
  const { z, letzte } = spiele(['warten'], vorReiheZwei());
  assert.deepEqual(falschBelegt(z, 2), [{ x: 4, y: 2, was: 'schatten' }]);
  assert.deepEqual(finde(letzte, 'wartet'), { typ: 'wartet', reihe: 2, ziel: { x: 4, y: 2, was: 'schatten' }, neu: true, folgt: false, satz: true });
  // er weckt niemanden und grüßt nicht, solange der Platz belegt ist
  assert.equal(z.schlaefer.wach, false);
  assert.equal(z.schlaefer.gegruesst, false);
});

test('Lampe B schwenken: Der Schatten fällt in den Gang, er nickt, grüßt und geht', () => {
  const wartend = spiele(['warten'], vorReiheZwei()).z;
  const { z, listen } = spiele([lampe('B'), 'warten', 'warten', 'warten'], wartend);
  assert.deepEqual(typen(listen[0]).filter((t) => t !== 'stoss'), ['lampe', 'schatten', 'weichtAus', 'nickt', 'gruesst']);
  assert.equal(finde(listen[0], 'schatten').neu.x, 2, 'der Schatten liegt jetzt im Gang, auf den Schuhen des Schaffners');
  // gegrüßt wird nur einmal, danach geht er mit einem großen Schritt über den Schatten
  assert.deepEqual(finde(listen[1], 'schaffnerSchritt'), { typ: 'schaffnerSchritt', von: { x: 2, y: 2 }, nach: { x: 2, y: 1 }, gross: true });
  assert.equal(finde(listen[2], 'schaffnerSchritt').nach.y, 0);
  assert.ok(typen(listen[3]).includes('schaffnerWeg'));
  assert.equal(z.schaffner.weg, true);
  assert.equal(z.schlaefer.wach, false, 'der Schlafende schläft weiter');
});

test('die Lampe des Schlafenden reicht man vom Gang aus in Reihe 1, 2 und 3', () => {
  for (const y of [1, 2, 3]) {
    const z = lage((l) => {
      l.spieler.x = 2;
      l.spieler.y = y;
      l.schaffner.y = 6;
    });
    assert.equal(spiele([lampe('B')], z).z.lampen.B, 'gang', `aus Reihe ${y}`);
  }
  const fern = lage((l) => {
    l.spieler.x = 2;
    l.spieler.y = 4;
    l.schaffner.y = 6;
  });
  assert.equal(runde(fern, lampe('B')).zustand, fern);
});

test('Wecken: Er wacht auf und bleibt sitzen. Es löst nichts.', () => {
  const wartend = spiele(['warten'], vorReiheZwei()).z;
  const { z, listen } = spiele([feld(3, 2), 'warten'], wartend);
  assert.deepEqual(listen[0][0], { typ: 'weckt', schaffner: { x: 2, y: 2 } });
  assert.equal(z.schlaefer.wach, true);
  assert.equal(z.schaffner.tat, 'wartet', 'der Schatten liegt noch auf dem Nebensitz');
  assert.deepEqual(z.schaffner.ziel, { x: 4, y: 2, was: 'schatten' });
  assert.equal(listen[0].filter((e) => e.typ === 'nickt' || e.typ === 'locht').length, 0);
  // noch einmal antippen: nichts, keine Runde
  const nochmal = runde(z, feld(3, 2));
  assert.equal(nochmal.zustand, z);
  assert.deepEqual(typen(nochmal.ereignisse), ['nichts']);
});

test('ist der Geweckte wach und der Platz frei, wird er gelocht statt gegrüßt', () => {
  const wartend = spiele(['warten'], vorReiheZwei()).z;
  const { z, listen } = spiele([feld(3, 2), lampe('B'), 'warten'], wartend);
  assert.deepEqual(finde(listen[1], 'locht'), { typ: 'locht', wen: 'schlaefer', x: 3, y: 2 });
  assert.equal(z.schlaefer.gegruesst, false);
  assert.equal(z.schaffner.y, 1);
});

test('wecken geht nur in Reichweite, gegen den Schlafenden wischen weckt nicht', () => {
  const fern = lage((l) => {
    l.spieler.x = 2;
    l.spieler.y = 4;
    l.schaffner.y = 6;
  });
  assert.deepEqual(runde(fern, feld(3, 2)).ereignisse, [{ typ: 'zuWeit', zu: { x: 3, y: 2 } }]);
  const daneben = lage((l) => {
    l.spieler.x = 2;
    l.spieler.y = 2;
    l.schaffner.y = 6;
  });
  const wisch = runde(daneben, 'rechts');
  assert.equal(wisch.zustand, daneben);
  assert.deepEqual(typen(wisch.ereignisse), ['gehtNicht']);
});

test('war die Lampe schon geschwenkt, bevor er kommt, grüßt er gleich und wartet nie', () => {
  const frueh = vorReiheZwei((l) => {
    l.lampen.B = 'gang';
    l.schaffner.y = 3;
    l.spieler.y = 4;
  });
  const { listen } = spiele(['warten', 'warten', 'warten'], frueh);
  // er betritt das Feld mit dem Schatten mit einem großen Schritt
  assert.equal(finde(listen[0], 'schaffnerSchritt').gross, true);
  assert.ok(typen(listen[1]).includes('gruesst'));
  assert.equal([].concat(...listen).filter((e) => e.typ === 'wartet').length, 0);
});

test('Schienenstoß: Wartet er wegen eines Schattens, zuckt die Zange mit, bei der Tasche nicht', () => {
  const beimSchatten = spiele(['warten'], vorReiheZwei((l) => {
    l.runde = 2;
  }));
  assert.deepEqual(finde(beimSchatten.letzte, 'stoss'), { typ: 'stoss', zange: true });
  const beiDerTasche = spiele(['warten', 'warten', 'warten', 'warten', 'warten', 'warten']);
  assert.deepEqual(finde(beiDerTasche.letzte, 'stoss'), { typ: 'stoss', zange: false });
});

test('Tatsachen nach der Tür: höchstens zwei, in fester Rangfolge', () => {
  // der Schaffner wartet in Reihe 2, die Tasche liegt noch, der Fahrgast ist wach: nur die ersten zwei
  const alles = lage((l) => {
    l.spieler.x = 2;
    l.spieler.y = 1;
    l.schaffner.y = 2;
    l.schaffner.tat = 'wartet';
    l.schaffner.ziel = { x: 4, y: 2, was: 'schatten' };
    l.schaffner.gesagt = [2];
    l.schlaefer.wach = true;
  });
  assert.deepEqual(finde(spiele(['hoch'], alles).letzte, 'ende').tatsachen, [{ art: 'wartet', reihe: 2 }, { art: 'tasche' }]);
  // nur geweckt
  const geweckt = lage((l) => {
    l.tasche = false;
    l.spieler.x = 2;
    l.spieler.y = 1;
    l.schaffner.weg = true;
    l.schaffner.tat = 'weg';
    l.schlaefer.wach = true;
  });
  assert.deepEqual(finde(spiele(['hoch'], geweckt).letzte, 'ende').tatsachen, [{ art: 'wach' }]);
});
