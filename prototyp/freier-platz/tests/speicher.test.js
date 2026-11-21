// Der Speicher des Prototyps darf jederzeit fehlen, leer sein oder Unsinn enthalten.
// Er hat einen eigenen Schlüssel und berührt den Stand des Hauptspiels nicht.

import test from 'node:test';
import assert from 'node:assert/strict';
import { ladePlatzStand, sicherePlatzStand, bereinigePlatzStand, leererPlatzStand, legeKarteAb, KARTEN_HOECHSTENS } from '../src/speicher.js';
import { leeresProtokoll } from '../src/protokoll.js';

const SCHLUESSEL = 'endstation.freier-platz.1';

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

test('Anfangswerte: Musik an, keine Karten, kein Protokoll', () => {
  assert.deepEqual(leererPlatzStand(), { musik: true, karten: [], protokoll: null });
});

test('das alte Feld "ton" aus der Fassung ohne Musik schaltet die Musik nicht ab', () => {
  mitFenster({ localStorage: speicherMit({ [SCHLUESSEL]: '{"ton":false,"karten":[{"lochung":true,"zeilen":[]}]}' }) }, () => {
    const stand = ladePlatzStand();
    assert.equal(stand.musik, true);
    assert.equal(stand.ton, undefined);
    assert.equal(stand.karten.length, 1, 'die alten Karten bleiben');
  });
});

test('ganz ohne Fenster und Speicher gibt es einen vollständigen leeren Stand', () => {
  assert.deepEqual(ladePlatzStand(), leererPlatzStand());
  assert.equal(sicherePlatzStand(leererPlatzStand()), false);
});

test('leerer Speicher: alles steht auf Anfang', () => {
  mitFenster({ localStorage: speicherMit({}) }, () => {
    assert.deepEqual(ladePlatzStand(), leererPlatzStand());
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
    assert.deepEqual(ladePlatzStand(), leererPlatzStand());
    assert.equal(sicherePlatzStand(leererPlatzStand()), false);
  });
  mitFenster({ get localStorage() { throw new Error('SecurityError'); } }, () => {
    assert.deepEqual(ladePlatzStand(), leererPlatzStand());
    assert.equal(sicherePlatzStand(leererPlatzStand()), false);
  });
});

test('Unsinn im Speicher wird zu einem gültigen Stand', () => {
  const faelle = ['', 'kein json', 'null', '42', '"text"', '[]', '{"musik":"laut","karten":"viele","protokoll":7}', '{"karten":[null,5,"x"]}', '{"protokoll":[]}'];
  for (const inhalt of faelle) {
    mitFenster({ localStorage: speicherMit({ [SCHLUESSEL]: inhalt }) }, () => {
      const stand = ladePlatzStand();
      assert.equal(stand.musik, true, `Inhalt: ${inhalt}`);
      assert.deepEqual(stand.karten, [], `Inhalt: ${inhalt}`);
      assert.ok(stand.protokoll === null || typeof stand.protokoll.folge === 'string', `Inhalt: ${inhalt}`);
    });
  }
});

test('ein gesicherter Stand kommt genauso zurück', () => {
  const speicher = speicherMit({});
  mitFenster({ localStorage: speicher }, () => {
    const stand = leererPlatzStand();
    stand.musik = false;
    legeKarteAb(stand, { lochung: true, zeilen: ['Der Schaffner', 'wartet in Reihe 2.'] });
    legeKarteAb(stand, { lochung: false, zeilen: [] });
    stand.protokoll = leeresProtokoll();
    stand.protokoll.runden = 12;
    stand.protokoll.tascheWeg = 3;
    stand.protokoll.folge = 'WWT.AWr';
    assert.equal(sicherePlatzStand(stand), true);
    assert.deepEqual(ladePlatzStand(), stand);
    assert.deepEqual([...speicher.daten.keys()], [SCHLUESSEL], 'nur der eigene Schlüssel wird beschrieben');
  });
});

test('der Stand des Hauptspiels bleibt unberührt und stört nicht', () => {
  const speicher = speicherMit({ 'endstation.1': '{"gelernt":{"wischen":true},"ton":true}' });
  mitFenster({ localStorage: speicher }, () => {
    assert.deepEqual(ladePlatzStand(), leererPlatzStand());
    sicherePlatzStand(leererPlatzStand());
    assert.equal(speicher.daten.get('endstation.1'), '{"gelernt":{"wischen":true},"ton":true}');
  });
});

test('aufgehoben werden die letzten 20 Karten, die neueste zuerst', () => {
  const stand = leererPlatzStand();
  for (let i = 0; i < 27; i++) legeKarteAb(stand, { lochung: i % 2 === 0, zeilen: [`Fahrt ${i}`] });
  assert.equal(stand.karten.length, KARTEN_HOECHSTENS);
  assert.deepEqual(stand.karten[0], { lochung: true, zeilen: ['Fahrt 26'] });
  assert.deepEqual(stand.karten[19].zeilen, ['Fahrt 7']);
  // auch aus dem Speicher kommen nie mehr zurück
  const zuViele = { karten: new Array(50).fill({ lochung: true, zeilen: ['a', 'b', 'c', 'd', 'e'] }) };
  const sauber = bereinigePlatzStand(zuViele);
  assert.equal(sauber.karten.length, KARTEN_HOECHSTENS);
  assert.equal(sauber.karten[0].zeilen.length, 4);
});

test('bereinigePlatzStand übernimmt nur Bekanntes', () => {
  const stand = bereinigePlatzStand({
    musik: false,
    punkte: 99,
    karten: [{ lochung: 'ja', zeilen: ['x', 7], note: 1 }],
    protokoll: { runden: 5, lampe: -2, warten: 'oft', lochung: 4, folge: 'WW<script>', fremd: true },
  });
  assert.equal(stand.musik, false);
  assert.equal(stand.punkte, undefined);
  assert.deepEqual(stand.karten, [{ lochung: false, zeilen: ['x'] }]);
  assert.deepEqual(stand.protokoll, { ...leeresProtokoll(), runden: 5, lochung: 4, folge: 'WWscript' });
});
