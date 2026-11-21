// Der Lernhalt erscheint nur einmal je Gerät. Leerer, gesperrter oder kaputter Speicher zeigt ihn wieder.

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
  assert.deepEqual(leererKontrollStand(), { gelernt: false });
  assert.deepEqual(ladeKontrollStand(), { gelernt: false }, 'ganz ohne Fenster');
  mitFenster({ localStorage: speicherMit({}) }, () => assert.equal(ladeKontrollStand().gelernt, false));
});

test('einmal geschafft: beim nächsten Öffnen kein Lernhalt mehr', () => {
  const speicher = speicherMit({});
  mitFenster({ localStorage: speicher }, () => {
    assert.equal(sichereKontrollStand({ gelernt: true }), true);
    assert.equal(ladeKontrollStand().gelernt, true);
    assert.deepEqual([...speicher.daten.keys()], [SCHLUESSEL], 'nur der eigene Schlüssel');
  });
});

test('gesperrter oder kaputter Speicher: der Lernhalt kommt wieder, nichts stürzt ab', () => {
  const gesperrt = { getItem: () => { throw new Error('SecurityError'); }, setItem: () => { throw new Error('QuotaExceededError'); } };
  mitFenster({ localStorage: gesperrt }, () => {
    assert.equal(ladeKontrollStand().gelernt, false);
    assert.equal(sichereKontrollStand({ gelernt: true }), false);
  });
  for (const inhalt of ['', 'kaputt', 'null', '42', '[]', '{"gelernt":"ja"}', '{"gelernt":1}']) {
    mitFenster({ localStorage: speicherMit({ [SCHLUESSEL]: inhalt }) }, () => assert.equal(ladeKontrollStand().gelernt, false, inhalt));
  }
  assert.deepEqual(bereinigeKontrollStand({ gelernt: true, fremd: 1 }), { gelernt: true });
});
