// Der Lernhalt erscheint nur einmal je Gerät, die weiteste Station bleibt gemerkt.
// Leerer, gesperrter oder kaputter Speicher zeigt den Lernhalt wieder und markiert keine Station.

import test from 'node:test';
import assert from 'node:assert/strict';
import { ladeKontrollStand, sichereKontrollStand, leererKontrollStand, bereinigeKontrollStand } from '../src/speicher.js';

const SCHLUESSEL = 'endstation.kontrolle.1';
function speicherMit(werte) {
  const daten = new Map(Object.entries(werte));
  return { getItem: (k) => (daten.has(k) ? daten.get(k) : null), setItem: (k, v) => daten.set(k, String(v)), daten };
}
function mitFenster(fenster, tu) {
  const vorher = globalThis.window;
  globalThis.window = fenster;
  try {
    tu();
  } finally {
    if (vorher === undefined) delete globalThis.window;
    else globalThis.window = vorher;
  }
}

test('leerer Speicher: der Lernhalt kommt', () => {
  assert.deepEqual(leererKontrollStand(), { gelernt: false, weiteste: -1 });
  assert.deepEqual(ladeKontrollStand(), { gelernt: false, weiteste: -1 }, 'ganz ohne Fenster');
  mitFenster({ localStorage: speicherMit({}) }, () => assert.equal(ladeKontrollStand().gelernt, false));
});

test('einmal geschafft: beim nächsten Öffnen kein Lernhalt mehr', () => {
  const speicher = speicherMit({});
  mitFenster({ localStorage: speicher }, () => {
    assert.equal(sichereKontrollStand({ gelernt: true, weiteste: 7 }), true);
    assert.deepEqual(ladeKontrollStand(), { gelernt: true, weiteste: 7 });
    assert.deepEqual([...speicher.daten.keys()], [SCHLUESSEL], 'nur der eigene Schlüssel');
  });
});

test('gesperrter oder kaputter Speicher: der Lernhalt kommt wieder, nichts stürzt ab', () => {
  const gesperrt = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('QuotaExceededError'); } };
  mitFenster({ localStorage: gesperrt }, () => {
    assert.equal(ladeKontrollStand().gelernt, false);
    assert.equal(sichereKontrollStand({ gelernt: true }), false);
  });
  for (const inhalt of ['', 'kaputt', 'null', '42', '[]', '{"gelernt":"ja"}', '{"gelernt":1}', '{"weiteste":"weit"}', '{"weiteste":-5}', '{"weiteste":2.5}']) {
    mitFenster({ localStorage: speicherMit({ [SCHLUESSEL]: inhalt }) }, () => assert.deepEqual(ladeKontrollStand(), { gelernt: false, weiteste: -1 }, inhalt));
  }
  assert.deepEqual(bereinigeKontrollStand({ gelernt: true, weiteste: 3, fremd: 1 }), { gelernt: true, weiteste: 3 });
});
