// Fahrt fortsetzen (Leitsatz 10): Eine gesicherte Fahrt wird nachgespielt und ergibt denselben Zustand.
// Kaputter oder leerer Speicher ergibt null, und das Spiel beginnt still eine neue Fahrt.

import test from 'node:test';
import assert from 'node:assert/strict';
import { erzeugeSpiel } from '../src/kern/spiel.js';
import { RICHTUNGSNAMEN } from '../src/kern/feld.js';
import { optionenFuerFahrt } from '../src/kern/reise.js';
import { neueFahrkarte } from '../src/kern/fahrkarte.js';
import { neueAufzeichnung, zeichneAuf, spieleNach, bereinigeAufzeichnung, pruefsummeVon, EINGABEN_HOECHSTENS } from '../src/kern/fortsetzen.js';
import { bereinigeStand, leererStand } from '../src/speicher.js';
import { BOTS } from './bots.js';

const AKTIONEN = [...RICHTUNGSNAMEN, 'warten', 'sprint-hoch', 'sprint-links', 'sprint-rechts', 'sprint-runter'];

function zufallsquelle(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

// Beginnt eine Fahrt so wie main.js: Optionen sichern, Spiel erzeugen, Aufzeichnung anlegen.
function beginneFahrt(seed, stand, vorige) {
  const optionen = optionenFuerFahrt(stand, vorige);
  stand.fahrkarte = optionen.fahrkarte;
  const vorher = JSON.parse(JSON.stringify(optionen));
  const spiel = erzeugeSpiel(seed, optionen);
  return { spiel, aufzeichnung: neueAufzeichnung(seed, vorher, spiel.zustand) };
}

// Spielt wie main.js: Nur Züge, die etwas bewirken, werden aufgezeichnet. Danach wie gespeichert und geladen.
function spieleUndSichere(spiel, aufzeichnung, aktion) {
  const ereignisse = spiel.act(aktion);
  if (!ereignisse.length) return { aufzeichnung, ereignisse };
  return { aufzeichnung: zeichneAuf(aufzeichnung, aktion, spiel.zustand), ereignisse };
}
const uebersSpeicher = (aufzeichnung) => bereinigeStand(JSON.parse(JSON.stringify({ fahrt: aufzeichnung }))).fahrt;

test('eine gespeicherte Fahrt wird nachgespielt und ergibt denselben Zustand', () => {
  for (let seed = 1; seed <= 40; seed++) {
    const stand = leererStand();
    const bot = BOTS[['ausgewogener', 'ausweicher', 'kaempfer'][seed % 3]];
    let { spiel, aufzeichnung } = beginneFahrt(seed, stand, null);
    const merk = {};
    const zufall = zufallsquelle(seed);
    for (let i = 0; i < 400 && spiel.zustand.status === 'faehrt'; i++) {
      const aktion = zufall() < 0.15 ? AKTIONEN[Math.floor(zufall() * AKTIONEN.length)] : bot(spiel.zustand, merk);
      ({ aufzeichnung } = spieleUndSichere(spiel, aufzeichnung, aktion));
      if (i % 37 === 0 || spiel.zustand.status !== 'faehrt') {
        const nach = spieleNach(uebersSpeicher(aufzeichnung));
        assert.ok(nach, `Seed ${seed}, Zug ${i}: Nachspielen ist gescheitert`);
        assert.equal(JSON.stringify(nach.zustand), JSON.stringify(spiel.zustand), `Seed ${seed}, Zug ${i}`);
      }
    }
  }
});

test('auch über Tod und Begleiter hinweg, über mehrere Fahrten', () => {
  let mitBegleiter = 0;
  for (let seed = 100; seed < 160; seed++) {
    const stand = leererStand();
    const zufall = zufallsquelle(seed);
    let vorige = null;
    for (let fahrt = 0; fahrt < 3; fahrt++) {
      let { spiel, aufzeichnung } = beginneFahrt(seed * 10 + fahrt, stand, vorige);
      if (spiel.zustand.begleiterDurch) mitBegleiter += 1;
      for (let i = 0; i < 300 && spiel.zustand.status === 'faehrt'; i++) {
        // erst gezielt zum Begleiter, dann zufällig: So kommen Gespräch und Wiederholung vor
        const aktion = zufall() < 0.5 ? 'hoch' : AKTIONEN[Math.floor(zufall() * 5)];
        ({ aufzeichnung } = spieleUndSichere(spiel, aufzeichnung, aktion));
        stand.fahrkarte = JSON.parse(JSON.stringify(spiel.zustand.fahrkarte));
        if (i % 23 === 0) {
          const nach = spieleNach(uebersSpeicher(aufzeichnung));
          assert.ok(nach, `Seed ${seed}, Fahrt ${fahrt}, Zug ${i}`);
          assert.equal(pruefsummeVon(nach.zustand), pruefsummeVon(spiel.zustand));
        }
      }
      const nach = spieleNach(uebersSpeicher(aufzeichnung));
      assert.equal(JSON.stringify(nach.zustand), JSON.stringify(spiel.zustand), `Seed ${seed}, Fahrt ${fahrt}, am Ende`);
      vorige = nach.zustand; // die nächste Fahrt beginnt aus der nachgespielten, wie nach dem Öffnen
    }
  }
  assert.ok(mitBegleiter > 0, 'keine Fahrt mit Begleiter geprüft');
});

test('leerer oder kaputter Speicher ergibt null, ohne Fehler', () => {
  const echt = beginneFahrt(5, leererStand(), null);
  let a = echt.aufzeichnung;
  for (const aktion of ['hoch', 'hoch', 'links', 'warten']) a = spieleUndSichere(echt.spiel, a, aktion).aufzeichnung;
  const gut = JSON.parse(JSON.stringify(a));
  assert.ok(spieleNach(gut));
  const faelle = [
    undefined, null, 0, 'text', [], {},
    { ...gut, seed: -1 }, { ...gut, seed: 1.5 }, { ...gut, seed: 2 ** 33 }, { ...gut, seed: '5' },
    { ...gut, optionen: null }, { ...gut, optionen: [] },
    { ...gut, eingaben: 'hhx' }, { ...gut, eingaben: 7 }, { ...gut, eingaben: 'h'.repeat(EINGABEN_HOECHSTENS + 1) },
    { ...gut, pruefsumme: 'zz' }, { ...gut, pruefsumme: 12 },
    { ...gut, eingaben: gut.eingaben + 'w' }, // verfälscht: passt nicht zur Prüfsumme
    { ...gut, eingaben: gut.eingaben.slice(1) },
    { ...gut, seed: gut.seed + 1 },
    { ...gut, pruefsumme: '0' },
    { ...gut, optionen: { startWagen: 99 } },
    { ...gut, optionen: { ...gut.optionen, staerken: { warten: true, sprint: true, rueckhalt: true } } }, // andere Stärken, anderer Zustand
  ];
  for (const fall of faelle) assert.equal(spieleNach(fall), null, String(JSON.stringify(fall)).slice(0, 80));
  // Unsinn in den Optionen bereinigt der Kern zu Anfangswerten: Passt dann der Zustand, darf es weitergehen
  assert.doesNotThrow(() => spieleNach({ ...gut, optionen: { fahrkarte: 'kaputt', staerken: 3, szene: { nr: -4 } } }));
  // im Speicher: Unsinn wird zu null, der Rest des Standes bleibt
  assert.equal(bereinigeStand({ fahrt: 'kaputt', ton: false }).fahrt, null);
  assert.equal(bereinigeStand({ fahrt: 'kaputt', ton: false }).ton, false);
  assert.equal(leererStand().fahrt, null);
  assert.equal(spieleNach(leererStand().fahrt), null);
});

test('eine Fahrt am Ende wird erkannt, die nächste nimmt mit, was sie mitgibt', () => {
  // eine Fahrt, die mit dem Tod endet: Danach sitzt der Begleiter im Speisewagen
  for (let seed = 1; seed < 200; seed++) {
    const stand = leererStand();
    let { spiel, aufzeichnung } = beginneFahrt(seed, stand, null);
    const merk = {};
    for (let i = 0; i < 600 && spiel.zustand.status === 'faehrt'; i++) ({ aufzeichnung } = spieleUndSichere(spiel, aufzeichnung, BOTS.kaempfer(spiel.zustand, merk)));
    if (spiel.zustand.status !== 'tot') continue;
    const nach = spieleNach(uebersSpeicher(aufzeichnung));
    assert.equal(nach.zustand.status, 'tot');
    const optionen = optionenFuerFahrt(stand, nach.zustand);
    assert.equal(optionen.begleiter, spiel.zustand.todDurch);
    return;
  }
  assert.fail('keine Fahrt endete mit dem Tod');
});

test('wer sehr lange fährt, wird nicht mehr aufgezeichnet, aber nichts geht kaputt', () => {
  const spiel = erzeugeSpiel(3, { fahrkarte: neueFahrkarte() });
  let a = neueAufzeichnung(3, { fahrkarte: neueFahrkarte() }, spiel.zustand);
  a.eingaben = 'w'.repeat(EINGABEN_HOECHSTENS);
  assert.equal(zeichneAuf(a, 'warten', spiel.zustand), null);
  assert.equal(zeichneAuf(null, 'warten', spiel.zustand), null);
  assert.equal(zeichneAuf(neueAufzeichnung(3, {}, spiel.zustand), 'unbekannt', spiel.zustand), null);
  assert.equal(bereinigeAufzeichnung({ seed: 1, optionen: {}, eingaben: '', pruefsumme: 'abc' }).eingaben, '');
});

test('mitten in der Wiederholung beim Begleiter: nachgespielt steht man wieder darin', () => {
  // eine Fahrt, die hinter dem Speisewagen endet: Die nächste beginnt dort, mit Begleiter und gemerkter Szene
  let tod = null;
  for (let seed = 1; seed < 400 && !tod; seed++) {
    const spiel = erzeugeSpiel(seed, {});
    const merk = {};
    const zufall = zufallsquelle(seed);
    for (let i = 0; i < 1500 && spiel.zustand.status === 'faehrt'; i++) {
      const aktion = zufall() < 0.1 ? AKTIONEN[Math.floor(zufall() * 5)] : BOTS.ausgewogener(spiel.zustand, merk);
      if (spiel.act(aktion).length === 0) spiel.act('warten');
    }
    if (spiel.zustand.status === 'tot' && spiel.zustand.wagenNr > 3 && spiel.zustand.todDurch !== 'tuer') tod = spiel.zustand;
  }
  assert.ok(tod, 'keine passende Fahrt gefunden');
  const stand = leererStand();
  let { spiel, aufzeichnung } = beginneFahrt(77, stand, tod);
  const z = spiel.zustand;
  assert.ok(z.begleiter, 'der Begleiter sitzt im Speisewagen');
  const seite = z.begleiter.x === 4 ? 'rechts' : 'links';
  // zu ihm, antworten, auf „Noch mal"
  for (const aktion of ['hoch', seite, 'hoch', 'runter', 'hoch']) ({ aufzeichnung } = spieleUndSichere(spiel, aufzeichnung, aktion));
  assert.ok(z.probe, 'die Wiederholung läuft');
  for (const aktion of ['hoch', 'links', 'warten', 'hoch']) ({ aufzeichnung } = spieleUndSichere(spiel, aufzeichnung, aktion));
  const nach = spieleNach(uebersSpeicher(aufzeichnung));
  assert.ok(nach && nach.zustand.probe);
  assert.equal(JSON.stringify(nach.zustand), JSON.stringify(z));
  // und nach dem Laden geht es gleich weiter: dieselbe Eingabe, dasselbe Ergebnis
  assert.deepEqual(nach.act('warten'), spiel.act('warten'));
});
