// Der Speicher darf jederzeit fehlen, leer sein oder Unsinn enthalten.
// Safari löscht lokale Daten nach einigen Tagen ohne Besuch, im privaten Modus fehlt er ganz.

import test from 'node:test';
import assert from 'node:assert/strict';
import { ladeStand, sichereStand, bereinigeStand, leererStand } from '../src/speicher.js';

function mitFenster(fenster, pruefung) {
  const vorher = Object.getOwnPropertyDescriptor(globalThis, 'window');
  Object.defineProperty(globalThis, 'window', { value: fenster, configurable: true, writable: true });
  try {
    pruefung();
  } finally {
    if (vorher) Object.defineProperty(globalThis, 'window', vorher);
    else delete globalThis.window;
  }
}

function speicherMit(inhalt) {
  const daten = new Map(Object.entries(inhalt));
  return {
    getItem: (k) => (daten.has(k) ? daten.get(k) : null),
    setItem: (k, v) => daten.set(k, String(v)),
    daten,
  };
}

test('ganz ohne Fenster und Speicher gibt es einen vollständigen leeren Stand', () => {
  assert.deepEqual(ladeStand(), leererStand());
  assert.equal(sichereStand(leererStand()), false);
});

test('leerer Speicher: alles steht auf Anfang', () => {
  mitFenster({ localStorage: speicherMit({}) }, () => {
    assert.deepEqual(ladeStand(), { gelernt: { wischen: false, ausweichen: false, anrempeln: false }, ton: true });
  });
});

test('gesperrter Speicher: Lesen und Schreiben scheitern still', () => {
  const gesperrt = {
    getItem: () => {
      throw new Error('SecurityError');
    },
    setItem: () => {
      throw new Error('QuotaExceededError');
    },
  };
  mitFenster({ localStorage: gesperrt }, () => {
    assert.deepEqual(ladeStand(), leererStand());
    assert.equal(sichereStand(leererStand()), false);
  });
  mitFenster({ get localStorage() { throw new Error('SecurityError'); } }, () => {
    assert.deepEqual(ladeStand(), leererStand());
    assert.equal(sichereStand(leererStand()), false);
  });
});

test('Unsinn im Speicher wird zu einem gültigen Stand', () => {
  const faelle = ['', 'kein json', 'null', '42', '"text"', '[]', '{"gelernt":"ja","ton":"laut"}', '{"gelernt":null}', '{"gelernt":{"wischen":1,"fremd":true},"ton":0}'];
  for (const inhalt of faelle) {
    mitFenster({ localStorage: speicherMit({ 'endstation.1': inhalt }) }, () => {
      assert.deepEqual(ladeStand(), leererStand(), `Inhalt: ${inhalt}`);
    });
  }
});

test('ein gesicherter Stand kommt genauso zurück', () => {
  const speicher = speicherMit({});
  mitFenster({ localStorage: speicher }, () => {
    const stand = { gelernt: { wischen: true, ausweichen: false, anrempeln: true }, ton: false };
    assert.equal(sichereStand(stand), true);
    assert.deepEqual(ladeStand(), stand);
  });
});

test('bereinigeStand übernimmt nur Bekanntes', () => {
  const stand = bereinigeStand({ gelernt: { wischen: true, ausweichen: 'ja', hacken: true }, ton: false, lochungen: 99 });
  assert.deepEqual(stand, { gelernt: { wischen: true, ausweichen: false, anrempeln: false }, ton: false });
});
