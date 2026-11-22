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
    assert.deepEqual(ladeStand(), { gelernt: { wischen: false, ausweichen: false, anrempeln: false }, ton: true, staerken: { warten: false, sprint: false, rueckhalt: false }, mehrAmTisch: 0, fahrkarte: { lochungen: [] }, fahrt: null, leerlauf: 'tuer' });
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
    const stand = { gelernt: { wischen: true, ausweichen: false, anrempeln: true }, ton: false, staerken: { warten: true, sprint: false, rueckhalt: true }, mehrAmTisch: 2, fahrkarte: { lochungen: [{ art: 'pruefung', id: 'ruhe', hell: true }, { art: 'tod', durch: 'pendler', hell: false }] }, fahrt: { seed: 7, optionen: { staerken: { warten: true } }, eingaben: 'hhwlR', pruefsumme: '1a2b3c' }, leerlauf: 'halten' };
    assert.equal(sichereStand(stand), true);
    assert.deepEqual(ladeStand(), stand);
  });
});

test('bereinigeStand übernimmt nur Bekanntes', () => {
  const stand = bereinigeStand({ gelernt: { wischen: true, ausweichen: 'ja', hacken: true }, ton: false, lochungen: 99 });
  assert.deepEqual(stand, { gelernt: { wischen: true, ausweichen: false, anrempeln: false }, ton: false, staerken: { warten: false, sprint: false, rueckhalt: false }, mehrAmTisch: 0, fahrkarte: { lochungen: [] }, fahrt: null, leerlauf: 'tuer' });
});

test('Fahrkarte: Anfangswert leer, Unsinn fällt weg, Bekanntes bleibt', () => {
  assert.deepEqual(leererStand().fahrkarte, { lochungen: [] });
  assert.deepEqual(bereinigeStand({ fahrkarte: 'voll' }).fahrkarte, { lochungen: [] });
  assert.deepEqual(bereinigeStand({ fahrkarte: { lochungen: [{ art: 'pruefung', id: 'rempeln' }, { art: 'pruefung', id: 'zaubern' }] } }).fahrkarte, { lochungen: [{ art: 'pruefung', id: 'rempeln', hell: true }] });
});

test('Gönnen: Anfangswert null, Unsinn wird zu null, höchstens fünf', () => {
  assert.equal(leererStand().mehrAmTisch, 0);
  for (const roh of [-1, 2.5, '3', null, true]) assert.equal(bereinigeStand({ mehrAmTisch: roh }).mehrAmTisch, 0, String(roh));
  assert.equal(bereinigeStand({ mehrAmTisch: 3 }).mehrAmTisch, 3);
  assert.equal(bereinigeStand({ mehrAmTisch: 99 }).mehrAmTisch, 5);
});

test('Stärken: Anfangswert ist keine, Unsinn wird zu keiner, Bekanntes bleibt', () => {
  assert.deepEqual(leererStand().staerken, { warten: false, sprint: false, rueckhalt: false });
  assert.deepEqual(bereinigeStand({ staerken: 'alle' }).staerken, { warten: false, sprint: false, rueckhalt: false });
  assert.deepEqual(bereinigeStand({ staerken: { sprint: true, warten: 1, fliegen: true } }).staerken, { warten: false, sprint: true, rueckhalt: false });
  // ein alter Stand aus Etappe 1 ohne Stärken
  assert.deepEqual(bereinigeStand({ gelernt: { wischen: true }, ton: true }).staerken, { warten: false, sprint: false, rueckhalt: false });
});

test('Leerlauf: Anfangswert ist der Tipp auf die Tür, nur bekannte Varianten werden übernommen', () => {
  assert.equal(leererStand().leerlauf, 'tuer');
  assert.equal(bereinigeStand({ leerlauf: 'halten' }).leerlauf, 'halten');
  assert.equal(bereinigeStand({ leerlauf: 'fliegen' }).leerlauf, 'tuer');
  assert.equal(bereinigeStand({ leerlauf: 3 }).leerlauf, 'tuer');
});
