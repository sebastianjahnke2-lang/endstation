// Aufteilung und Texte: alles passt ab 360 x 600, nichts zum Antippen am unteren Rand,
// der Satz am Ende ist persönlich, trocken und ohne Zahl.

import test from 'node:test';
import assert from 'node:assert/strict';
import { berechneSaal, wasImSaal, SAALRAND_UNTEN } from '../src/anzeige/masse.js';
import { brichUm, satzRaster, rueckVersatz, PAUSE } from '../src/anzeige/buehne.js';
import { GASTFARBEN, aussehen, maleGast } from '../src/anzeige/gaeste.js';
import { SCHLUSSSAETZE, FARBNAMEN, schlussText } from '../src/texte.js';
import { schlussSatz } from '../src/kern/schluss.js';
import { erzeugeAbend } from '../src/kern/abend.js';
import { spieleAbend } from './bots.js';
import { hatZeichen } from '../../../src/anzeige/matrix.js';

for (const [b, h] of [[360, 600], [375, 548], [390, 664], [390, 844], [430, 739], [320, 568]]) {
  test(`passt auf ${b} x ${h}: Fenster, Tür, fünf Bänke, nichts am unteren Rand`, () => {
    const m = berechneSaal(b, h);
    assert.ok(m.s >= 44, `Plätze zu klein für den Daumen: ${m.s}`);
    assert.ok(h - m.unten >= SAALRAND_UNTEN, 'die unterste Bank liegt am Rand');
    assert.ok(m.tuer.zeile.y >= m.wand.h, 'die Tür überdeckt die Fenster');
    for (const f of m.fenster) assert.ok(f.x >= 0 && f.x + f.b <= b && f.y + f.h <= m.wand.h);
    assert.ok(m.tuer.rahmen.x + m.tuer.rahmen.b <= b, 'die Tür ragt hinaus');
    for (const bank of m.baenke) {
      const letzter = bank.plaetze[bank.plaetze.length - 1];
      assert.ok(bank.plaetze[0].x >= 0 && letzter.x + letzter.b <= b);
    }
    // jeder Platz ist dort antippbar, wo er gezeichnet ist
    m.baenke.forEach((bank, i) => bank.plaetze.forEach((p, k) => assert.deepEqual(wasImSaal(m, p.cx, p.fy - 10), { art: 'bank', bank: i, platz: k })));
    assert.deepEqual(wasImSaal(m, m.tuer.plaetze[0].cx, m.tuer.plaetze[0].fy - 10), { art: 'tuer' });
    assert.deepEqual(wasImSaal(m, m.ton.x, m.ton.y), { art: 'ton' });
    assert.ok(m.ton.y - m.ton.h / 2 >= 0 && m.ton.y < h / 4, 'der Lautsprecher sitzt oben');
    // unter den Bänken liegt nichts zum Antippen
    for (let y = m.unten + 1; y < h; y += 4) assert.equal(wasImSaal(m, b / 2, y).art, 'nichts');
  });
}

test('jede Farbe hat ihre eigene Farbe und ihren eigenen Hut, es gibt keinen kräftigeren Ton mehr', () => {
  assert.equal(GASTFARBEN.length, 4);
  assert.equal(new Set(GASTFARBEN.map((f) => f.mantel)).size, 4);
  for (const f of GASTFARBEN) assert.deepEqual(Object.keys(f).sort(), ['hut', 'kopf', 'mantel']);
});

// ein Stift, der jeden Aufruf mitschreibt, statt zu malen
function mitschreiber() {
  const log = [];
  return new Proxy({ log }, {
    get(ziel, name) {
      if (name === 'log') return log;
      if (name === 'createRadialGradient' || name === 'createLinearGradient') return () => ({ addColorStop: () => {} });
      return (...werte) => log.push([name, ...werte]);
    },
    set(ziel, name, wert) {
      log.push(['=', name, wert]);
      return true;
    },
  });
}

test('ein Falscher und ein Ehrlicher derselben gezeigten Farbe werden gleich gezeichnet', () => {
  for (let zeigt = 0; zeigt < 4; zeigt++) {
    const ehrlich = { id: 1, zeigt, echt: zeigt };
    for (let echt = 0; echt < 4; echt++) {
      if (echt === zeigt) continue;
      const falsch = { id: 2, zeigt, echt };
      assert.deepEqual(aussehen(falsch), aussehen(ehrlich));
      for (const sitzt of [0, 1]) {
        const a = mitschreiber();
        const b = mitschreiber();
        maleGast(a, 100, 200, 70, { ...aussehen(ehrlich), sitzt });
        maleGast(b, 100, 200, 70, { ...aussehen(falsch), sitzt });
        assert.deepEqual(b.log, a.log);
      }
    }
  }
});

test('Rücken: gleiche echte Farbe zusammen, gleiche gezeigte bei verschiedener echter ab, sonst gerade', () => {
  const g = (zeigt, echt = zeigt) => ({ zeigt, echt });
  assert.deepEqual(rueckVersatz([g(0), g(0)]), [1, -1], 'zwei Ehrliche gleicher Farbe rücken zusammen');
  assert.deepEqual(rueckVersatz([g(2), g(0, 2)]), [1, -1], 'auch wenn einer eine andere Farbe zeigt');
  assert.deepEqual(rueckVersatz([g(0), g(0, 2)]), [-1, 1], 'gleiche gezeigte, verschiedene echte: ab');
  assert.deepEqual(rueckVersatz([g(0), g(1)]), [0, 0], 'verschieden und verschieden: nichts');
  assert.deepEqual(rueckVersatz([g(0), g(0), g(0, 3)]), [1, -2, 1], 'in der Mitte: zur einen Seite zusammen, von der anderen ab');
});

test('nur Schlusssätze, keine Zahl, kein Lob, keine Wertung, nur Zeichen der Punktschrift', () => {
  const saetze = [];
  for (const art of ['geglaubt', 'zuletzt', 'ferngehalten', 'unentdeckt']) {
    for (let a = 0; a < 4; a++) for (let b = 0; b < 4; b++) if (a !== b) saetze.push(schlussText({ art, zeigte: a, echt: b }));
  }
  for (let n = 1; n <= 5; n++) saetze.push(schlussText({ art: 'verteilt', zeigte: 2, echt: 2, n }));
  const alle = saetze.join(' ').toLowerCase();
  for (const wort of ['gut', 'super', 'toll', 'punkte', 'geschafft', 'gewonnen', 'verloren', 'leider', 'bravo', 'rekord', 'richtig', 'falsch', 'böse', 'lüge', 'gelogen']) {
    assert.ok(!new RegExp(`(^|[^a-zäöüß])${wort}([^a-zäöüß]|$)`).test(alle), wort);
  }
  assert.ok(!/\d/.test(alle), 'keine Zahl');
  for (const s of saetze) {
    assert.ok(!/\{/.test(s), `Platzhalter übrig: ${s}`);
    for (const z of s) assert.ok(hatZeichen(z), `Zeichen fehlt in der Punktschrift: ${z}`);
  }
  assert.equal(schlussText({ art: 'verteilt', zeigte: 0, echt: 0, n: 1 }), 'Die Roten saßen am Ende beisammen.');
  assert.equal(schlussText({ art: 'geglaubt', zeigte: 0, echt: 1 }), 'Dem Roten hast du zu schnell geglaubt. Er war blau.');
  assert.equal(Object.keys(FARBNAMEN).length, 4);
  assert.ok(Object.keys(SCHLUSSSAETZE).length <= 6);
});

test('der Satz passt bei 360 Pixeln in höchstens drei Zeilen, jeder Satz auf eigener Zeile', () => {
  const spalten = Math.floor((360 - 24) / satzRaster(360));
  for (const art of ['geglaubt', 'zuletzt', 'ferngehalten', 'unentdeckt']) {
    const zeilen = brichUm(schlussText({ art, zeigte: 3, echt: 1 }), spalten);
    assert.ok(zeilen.length <= 3, art);
    assert.ok(zeilen[zeilen.length - 1].startsWith('Er war'), 'der zweite Satz beginnt auf einer eigenen Zeile');
  }
});

test('der Satz beschreibt, wie entschieden wurde: wer blind setzt, hört, wem er zu schnell geglaubt hat', () => {
  const arten = {};
  for (let seed = 1; seed <= 40; seed++) {
    for (const wie of ['hinseher', 'blind']) {
      const r = spieleAbend(seed, wie);
      const e = schlussSatz(r.z);
      arten[wie + ' ' + e.art] = (arten[wie + ' ' + e.art] || 0) + 1;
      const satz = schlussText(e);
      assert.ok(satz.includes(FARBNAMEN[e.zeigte].wer), 'nennt den Gast');
    }
  }
  assert.ok((arten['blind geglaubt'] || 0) >= 30, JSON.stringify(arten));
  assert.ok(!arten['hinseher geglaubt'] || arten['hinseher geglaubt'] <= 4, JSON.stringify(arten));
});

test('Schlusssatz: jede Art an einer gebauten Szene', () => {
  const abend = erzeugeAbend(3);
  const z = abend.zustand;
  z.status = 'ende';
  z.ende = 'fest';
  z.tuer = [];
  z.baenke = [[{ id: 1, zeigt: 0, echt: 0 }], [{ id: 2, zeigt: 0, echt: 0 }], [], [], []];
  assert.deepEqual(schlussSatz(z), { art: 'verteilt', zeigte: 0, echt: 0, n: 2 });
  z.baenke[2] = [{ id: 3, zeigt: 1, echt: 2 }, { id: 4, zeigt: 1, echt: 1 }];
  assert.equal(schlussSatz(z).art, 'unentdeckt');
  z.baenke[3] = [{ id: 5, zeigt: 2, echt: 3 }];
  z.verlauf.umgesetzt = [5];
  assert.deepEqual(schlussSatz(z), { art: 'ferngehalten', zeigte: 2, echt: 3 });
  z.verlauf.aufgeflogen = [{ id: 9, zeigte: 3, echt: 0, wie: 'geglaubt' }];
  assert.deepEqual(schlussSatz(z), { art: 'geglaubt', zeigte: 3, echt: 0 });
  z.ende = 'hell';
  assert.equal(schlussSatz(z).art, 'ferngehalten', 'bei hellem Saal zählt zuerst, wen er ferngehalten hat');
  z.verlauf.umgesetzt = [];
  z.verlauf.aufgeflogen.push({ id: 10, zeigte: 1, echt: 2, wie: 'zuletzt' });
  assert.deepEqual(schlussSatz(z), { art: 'zuletzt', zeigte: 1, echt: 2 });
});

test('angehalten wird höchstens 150 ms', () => {
  assert.ok(PAUSE <= 150);
});
