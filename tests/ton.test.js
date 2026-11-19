// Harte Regeln der Vision als Test: Wörter, die im Spiel nie stehen dürfen.
// Der Test fängt nur das Eindeutige. Alles, was Urteilskraft braucht
// (Kitsch, Belehrung, Marken, Zitate), prüft der Skill "ton-check".

import test from 'node:test';
import assert from 'node:assert/strict';
import { TEXTE } from '../src/texte.js';

export const VERBOTEN = [
  // wörtlich aus den harten Regeln
  /\bGesetz|\bGESETZ/,
  /\bMacht|\bMACHT/,
  /dimension/i,
  /aufstieg/i,
  /karma/i,
  /selbstliebe/i,
  /energie/i,
  /böse/i,
  /\b(?:gut|gute[rnsm]?|besser\w*|beste[rnsm]?)\b/i,
  // Religion und Esoterik
  /seele/i,
  /schicksal/i,
  /\bGott|\bGOTT|göttlich/i,
  /heilig/i,
  /\bEngel|\bENGEL/,
  /teufel/i,
  /\bHölle|\bHÖLLE/,
  /paradies/i,
  /sünde/i,
  /erlösung/i,
  /erleuchtung/i,
  /wiedergeburt/i,
  /spirituell/i,
  /\bAura\b|\bAURA\b/,
  /chakra/i,
  /mantra/i,
];

function sammle(wert, pfad, liste) {
  if (typeof wert === 'string') {
    liste.push([pfad, wert]);
  } else if (wert && typeof wert === 'object') {
    for (const [schluessel, inhalt] of Object.entries(wert)) sammle(inhalt, `${pfad}.${schluessel}`, liste);
  } else {
    assert.fail(`${pfad}: In TEXTE stehen nur Zeichenketten, gefunden: ${typeof wert}`);
  }
  return liste;
}

const alleTexte = sammle(TEXTE, 'TEXTE', []);

test('kein Text enthält ein verbotenes Wort', () => {
  for (const [pfad, text] of alleTexte) {
    for (const muster of VERBOTEN) {
      const treffer = text.match(muster);
      assert.equal(treffer, null, `${pfad} = "${text}" enthält "${treffer && treffer[0]}"`);
    }
  }
});

test('die Wortliste greift wirklich', () => {
  const muss = ['Das ist gut.', 'GUTE FAHRT', 'Machtwort', 'Lebensenergie', 'Seelenruhe', 'Böse', 'besser'];
  const darfNicht = ['Zug wird bereitgestellt', 'Fahrkarte, bitte.', 'Das macht nichts.', 'Platz gesetzt', 'Gutschein', 'Ruhe, bitte'];
  const trifft = (text) => VERBOTEN.some((muster) => muster.test(text));
  for (const text of muss) assert.ok(trifft(text), `"${text}" müsste auffallen`);
  for (const text of darfNicht) assert.ok(!trifft(text), `"${text}" dürfte nicht auffallen`);
});

// Die Zuganzeige kann nur schreiben, wofür sie ein Punktmuster hat.
import { hatZeichen, textBreite } from '../src/anzeige/matrix.js';
import { berechneLayout } from '../src/anzeige/layout.js';
import { kartenMasse } from '../src/anzeige/karte.js';

test('jedes Zeichen in den Texten gibt es in der Punktmatrix-Schrift', () => {
  for (const [pfad, text] of alleTexte) {
    for (const zeichen of text.replace(/\{\w+\}/g, '')) {
      assert.ok(hatZeichen(zeichen), `${pfad}: Zeichen "${zeichen}" fehlt in der Schrift`);
    }
  }
  for (const zeichen of '0123456789:') assert.ok(hatZeichen(zeichen));
});

test('die Texte passen bei 360 Pixel Breite auf die Anzeige', () => {
  const layout = berechneLayout(360, 600);
  const kopf = layout.tafel.spalten - 16 - 2; // Nummer und Strich brauchen 16 Punkte
  const karte = kartenMasse(layout, 'tod').tafel.spalten;
  const schild = Math.floor((360 - 12 - 14) / 2); // Hinweisschild: Punktabstand 2, Rand und Polster
  for (const name of Object.values(TEXTE.wagen)) assert.ok(textBreite(name) <= kopf, `Wagenname zu lang: ${name}`);
  for (const text of Object.values(TEXTE.hinweis)) assert.ok(textBreite(text) <= schild, `Hinweis zu lang: ${text}`);
  // Rückblick am Halt: Handlung und Wagen, je eine Zeile
  for (const text of [...Object.values(TEXTE.pruefung), ...Object.values(TEXTE.wagen)]) assert.ok(textBreite(text) <= karte, `Rückblick zu lang: ${text}`);
  for (const muster of Object.values(TEXTE.rueckblick)) {
    for (const wer of Object.values(TEXTE.wer)) assert.ok(textBreite(muster.replace('{wer}', wer)) <= karte, `Rückblick zu lang: ${muster} ${wer}`);
  }
  for (const text of Object.values(TEXTE.ende)) {
    for (const zahl of TEXTE.zahlwort) {
      for (const zeile of text.replace('{n}', zahl).replace('{zeit}', '00:00').split(' / ')) {
        assert.ok(textBreite(zeile) <= karte, `Zeile zu lang: ${zeile}`);
      }
    }
  }
});

test('Hinweise haben wenige Worte, und es sind höchstens drei Lagen', () => {
  for (const text of Object.values(TEXTE.hinweis)) assert.ok(text.split(' ').length <= 3, text);
  // wischen und tasten sind derselbe Hinweis für zwei Geräte
  assert.ok(Object.keys(TEXTE.hinweis).filter((k) => k !== 'tasten').length <= 3);
});
