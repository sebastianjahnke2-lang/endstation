// Jede Sitzordnung ist innerhalb der Züge lösbar, und zwar nicht durch blindes Durchkontrollieren.
// Vollständige Suche über alle Zustände eines Halts. Wer hinsieht, schafft jeden Halt.

import test from 'node:test';
import assert from 'node:assert/strict';
import { neueKontrolle, kontrollZug } from '../src/kern/kontrolle.js';
import { HALTE, ZUEGE_BIS_HALT } from '../src/kern/halte.js';

function haltNr(nr) {
  const z = neueKontrolle();
  for (let i = 0; i < nr; i++) {
    z.status = 'gefangen';
    kontrollZug(z, 'weiter');
  }
  return z;
}
const kopie = (z) => JSON.parse(JSON.stringify(z));

// Alle Handlungen, die in diesem Zustand etwas bewirken können
function handlungen(z) {
  const liste = ['hoch', 'runter', 'warten'];
  for (const f of z.fahrgaeste) if (f.y === z.k.y) liste.push({ tipp: 'feld', x: f.x, y: f.y });
  return liste;
}

// Breitensuche: kürzester Weg zum Fang, in Zügen
function kuerzesterFang(start) {
  const schluessel = (z) => JSON.stringify([z.k.y, z.rest, z.fahrgaeste.map((f) => [f.x, f.y, f.ruht, f.schlaeft])]);
  let schicht = [{ z: start, weg: [] }];
  const gesehen = new Set([schluessel(start)]);
  while (schicht.length) {
    const naechste = [];
    for (const { z, weg } of schicht) {
      for (const h of handlungen(z)) {
        const neu = kopie(z);
        if (!kontrollZug(neu, h).length) continue;
        if (neu.status === 'gefangen') return [...weg, h];
        if (neu.status !== 'faehrt') continue;
        const k = schluessel(neu);
        if (gesehen.has(k)) continue;
        gesehen.add(k);
        naechste.push({ z: neu, weg: [...weg, h] });
      }
    }
    schicht = naechste;
  }
  return null;
}

// Blind: von unten nach oben durch den Wagen, jeden Fahrgast der Reihe nach kontrollieren.
function blindDurch(z) {
  for (let schritt = 0; schritt < 100 && z.status === 'faehrt'; schritt++) {
    const offen = z.fahrgaeste.filter((f) => f.y === z.k.y && !f.kontrolliert).sort((a, b) => a.x - b.x)[0];
    kontrollZug(z, offen ? { tipp: 'feld', x: offen.x, y: offen.y } : 'hoch');
  }
  return z.status;
}

// Wer hinsieht: geht nach vorn, merkt sich, wer aufsteht oder zuckt, und folgt ihm.
function hinsehen(z) {
  let verdacht = null;
  for (let schritt = 0; schritt < 100 && z.status === 'faehrt'; schritt++) {
    let h = 'hoch';
    if (verdacht !== null) {
      const f = z.fahrgaeste[verdacht];
      if (f.y === z.k.y) h = { tipp: 'feld', x: f.x, y: f.y };
      else h = f.y < z.k.y ? 'hoch' : 'runter';
    }
    for (const e of kontrollZug(z, h)) if (e.typ === 'wechselt' || e.typ === 'zuckt') verdacht = e.nr;
  }
  return z.status;
}

test('jede Sitzordnung ist innerhalb der Züge lösbar', () => {
  for (let nr = 0; nr < HALTE.length; nr++) {
    const weg = kuerzesterFang(haltNr(nr));
    assert.ok(weg, `Halt ${nr + 1} ist nicht lösbar`);
    assert.ok(weg.length <= ZUEGE_BIS_HALT, `Halt ${nr + 1}: ${weg.length} Züge`);
    // Spielraum: Ein Fehler darf drin sein, Trödeln nicht unbegrenzt
    assert.ok(weg.length >= 4 && weg.length <= ZUEGE_BIS_HALT - 2, `Halt ${nr + 1}: kürzester Weg ${weg.length} Züge`);
  }
});

test('wer hinsieht und dem folgt, der aufsteht oder zuckt, schafft jeden Halt', () => {
  for (let nr = 0; nr < HALTE.length; nr++) assert.equal(hinsehen(haltNr(nr)), 'gefangen', `Halt ${nr + 1}`);
});

test('blindes Durchkontrollieren aller Fahrgäste reicht nicht', () => {
  for (let nr = 0; nr < HALTE.length; nr++) {
    assert.equal(blindDurch(haltNr(nr)), 'entkommen', `Halt ${nr + 1}: blind von unten nach oben geschafft`);
    // alle zu kontrollieren kostet mehr Züge, als bis zum Halt bleiben: jeder einen, der Schlafende zwei,
    // dazu der Weg von Reihe 7 bis zur vordersten besetzten Reihe
    const z = haltNr(nr);
    const vorderste = Math.min(...z.fahrgaeste.map((f) => f.y));
    const kosten = z.fahrgaeste.length - 1 + 2 + (7 - vorderste);
    assert.ok(kosten > ZUEGE_BIS_HALT, `Halt ${nr + 1}: alle kontrollieren kostet nur ${kosten}`);
  }
});
