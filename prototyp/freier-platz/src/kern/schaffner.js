// Der Schaffner. Er geht im Gang von unten nach oben und verlässt den Wagen durch die Zieltür.
// Je Runde tut er genau eines, nach fester Rangfolge. Er wird nie schneller, lauter oder ärgerlich.

import { GANGSPALTE, ZIELTUER, SCHLAEFERPLATZ } from './abteil.js';
import { sitzende, falschBelegt } from './licht.js';

// Was er in dieser Runde tut. Entscheidet nur, ändert nichts.
//   1. warten, wenn in seiner Reihe ein Sitz falsch belegt ist
//   2. lochen, wenn dort jemand Waches sitzt, den er noch nicht gelocht hat (von links nach rechts)
//   3. grüßen, wenn dort der Schlafende sitzt und noch nicht gegrüßt wurde
//   4. gehen
export function schaffnerVorhaben(z) {
  const k = z.schaffner;
  const funde = falschBelegt(z, k.y);
  if (funde.length) return { tat: 'wartet', ziel: funde[0] };
  const gaeste = sitzende(z).filter((f) => f.y === k.y && f.wach && !f.gelocht).sort((a, b) => a.x - b.x);
  if (gaeste.length) return { tat: 'locht', wen: gaeste[0].wer, x: gaeste[0].x, y: gaeste[0].y };
  if (k.y === SCHLAEFERPLATZ.y && !z.schlaefer.wach && !z.schlaefer.gegruesst) return { tat: 'gruesst' };
  return { tat: 'geht' };
}

function liegtSchattenAuf(z, x, y) {
  return z.schatten.some((s) => !s.wand && s.x === x && s.y === y);
}

// Sein Schritt in dieser Runde. Ändert den Zustand und meldet, was zu sehen ist.
export function schaffnerSchritt(z, ereignisse) {
  const k = z.schaffner;
  if (k.weg) return;
  const hatGewartet = k.tat === 'wartet';
  const vorhaben = schaffnerVorhaben(z);

  if (vorhaben.tat === 'wartet') {
    const ziel = vorhaben.ziel;
    const gleichesZiel = hatGewartet && k.ziel && k.ziel.x === ziel.x && k.ziel.y === ziel.y && k.ziel.was === ziel.was;
    const erstesMal = k.gesagt.indexOf(k.y) < 0;
    if (erstesMal) k.gesagt.push(k.y);
    k.tat = 'wartet';
    k.ziel = { x: ziel.x, y: ziel.y, was: ziel.was };
    ereignisse.push({
      typ: 'wartet',
      reihe: k.y,
      ziel: { x: ziel.x, y: ziel.y, was: ziel.was },
      neu: !hatGewartet, // er hebt die Zange
      folgt: hatGewartet && !gleichesZiel, // die Zange bleibt oben und wandert zum neuen Ding
      satz: erstesMal, // "Bitte den Platz freimachen.", nur beim ersten Mal in dieser Reihe
    });
    return;
  }

  // zufrieden: kurzes Nicken, dann geht es mit Regel 2, 3 oder 4 weiter
  if (hatGewartet) ereignisse.push({ typ: 'nickt' });
  k.ziel = null;

  if (vorhaben.tat === 'locht') {
    if (vorhaben.wen === 'spieler') z.spieler.gelocht = true;
    else z[vorhaben.wen].gelocht = true;
    k.tat = 'locht';
    ereignisse.push({ typ: 'locht', wen: vorhaben.wen, x: vorhaben.x, y: vorhaben.y });
    return;
  }
  if (vorhaben.tat === 'gruesst') {
    z.schlaefer.gegruesst = true;
    k.tat = 'gruesst';
    ereignisse.push({ typ: 'gruesst', x: SCHLAEFERPLATZ.x, y: SCHLAEFERPLATZ.y });
    return;
  }

  // gehen: ein Feld nach oben, an der Zieltür hinaus
  if (k.y === ZIELTUER.y) {
    k.weg = true;
    k.tat = 'weg';
    ereignisse.push({ typ: 'schaffnerWeg', von: { x: GANGSPALTE, y: k.y } });
    return;
  }
  const oben = k.y - 1;
  if (z.spieler.x === GANGSPALTE && z.spieler.y === oben) {
    k.tat = 'steht';
    ereignisse.push({ typ: 'steht' });
    return;
  }
  // über einen Schatten im Gang macht er einen sichtbar großen Schritt
  const gross = liegtSchattenAuf(z, GANGSPALTE, k.y) || liegtSchattenAuf(z, GANGSPALTE, oben);
  ereignisse.push({ typ: 'schaffnerSchritt', von: { x: GANGSPALTE, y: k.y }, nach: { x: GANGSPALTE, y: oben }, gross });
  k.y = oben;
  k.tat = 'geht';
}
