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
