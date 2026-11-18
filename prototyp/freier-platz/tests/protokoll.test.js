// Das Testprotokoll für den Auftraggeber: Was in der letzten Fahrt wann geschah.

import test from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeFahrt } from '../src/kern/fahrt.js';
import { leeresProtokoll, schreibeMit, protokollZeilen, bereinigeProtokoll } from '../src/protokoll.js';

const feld = (x, y) => ({ tipp: 'feld', x, y });
const lampe = (name) => ({ tipp: 'lampe', name });

function fahre(handlungen) {
  const fahrt = erzeugeFahrt();
  const p = leeresProtokoll();
  for (const h of handlungen) schreibeMit(p, fahrt.act(h), fahrt.zustand);
  return { p, z: fahrt.zustand };
}

test('der Hauptweg: Runden bis Tasche weg, Lochung, Reihe 2 frei und Tür', () => {
  const { p, z } = fahre([
    feld(0, 5), lampe('A'), 'warten', 'warten', 'warten', 'warten', 'warten',
    'rechts', 'hoch', 'hoch', lampe('B'), 'warten', 'warten', 'warten', 'hoch', 'hoch', 'hoch',
  ]);
  assert.equal(z.status, 'ende');
  assert.deepEqual(p, {
    runden: 17,
    tascheWeg: 1,
    lochung: 4,
    reiheZweiFrei: 11,
    tuer: 17,
    lampe: 2,
    warten: 8,
    anstossen: 0,
    draengen: 0,
    wecken: 0,
    folge: 'TAWWWWWrhhBWWWhhh',
  });
});

test('Anstoßen, Vorbeidrängen, Wecken und Eingaben ohne Wirkung stehen in der Folge', () => {
  const { p } = fahre([
    'warten', 'warten', 'warten', 'warten',
    'hoch', // gegen die Lehne: keine Runde
    feld(2, 5), // Schaffner antippen: Er wiederholt den Satz
    'rechts', // Anstoßen
    'rechts', // Vorbeidrängen
    'hoch', 'hoch', 'hoch',
    feld(3, 2), // wecken
    lampe('A'), // zu weit
  ]);
  assert.equal(p.folge, 'WWWW.KXVhhhS.');
  assert.deepEqual([p.anstossen, p.draengen, p.wecken, p.warten, p.lampe], [1, 1, 1, 4, 0]);
  assert.equal(p.runden, 11);
  assert.equal(p.tascheWeg, null);
  assert.equal(p.reiheZweiFrei, null, 'wecken macht Reihe 2 nicht frei');
});

test('die Zeilen fürs Auge: was nie geschah, steht als Strich da', () => {
  const zeilen = protokollZeilen(fahre(['warten', feld(0, 5)]).p, [{ lochung: true }, { lochung: false }], 26);
  assert.equal(zeilen[0], 'Letzte Fahrt');
  assert.ok(zeilen.includes('Tasche weg               2'));
  assert.ok(zeilen.includes('Lochung                  -'));
  assert.ok(zeilen.includes('WT'));
  assert.deepEqual(zeilen.slice(-2), ['Karten:', '+-']);
  assert.deepEqual(protokollZeilen(null, [], 26), ['Noch keine Fahrt']);
});

test('eine lange Folge wird umbrochen, höchstens fünf Zeilen, das Ende zählt', () => {
  const p = leeresProtokoll();
  p.folge = 'h'.repeat(100) + 'W'.repeat(60);
  const zeilen = protokollZeilen(p, [], 26);
  const folge = zeilen.slice(zeilen.indexOf('Folge:') + 1, zeilen.indexOf('Karten:'));
  assert.equal(folge.length, 5);
  assert.ok(folge[folge.length - 1].endsWith('W'));
});

test('Unsinn im gespeicherten Protokoll wird bereinigt', () => {
  assert.equal(bereinigeProtokoll(null), null);
  assert.equal(bereinigeProtokoll('text'), null);
  assert.deepEqual(bereinigeProtokoll({}), leeresProtokoll());
  const p = bereinigeProtokoll({ runden: 3.7, tuer: -1, lampe: NaN, folge: 12 });
  assert.deepEqual([p.runden, p.tuer, p.lampe, p.folge], [3, null, 0, '']);
});
