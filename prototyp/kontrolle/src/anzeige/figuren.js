// Fahrgäste des Prototyps "Kontrolle". Platzhalter aus einfachen Formen, ohne Gesicht.
// Der Körper ist nachgebaut nach maleMensch() aus prototyp/freier-platz/src/anzeige/gestalten.js,
// weil er dort nicht exportiert ist und jener Prototyp unangetastet bleibt.
// Der Fahrgast ohne Fahrkarte sieht aus wie alle anderen. Seine Farbe wechselt je Halt (kern/halte.js).

import { rundesRechteck, kreis } from '../../../../src/anzeige/formen.js';

export const FAHRGASTFARBEN = {
  a: { mantel: '#4f9483', kopf: '#b9dbd0', schuh: '#2c5449' },
  b: { mantel: '#9a5a74', kopf: '#dbb9c6', schuh: '#4f2c3c' },
  c: { mantel: '#8a7a4f', kopf: '#ddd2b4', schuh: '#4a412a' },
  d: { mantel: '#5a6fae', kopf: '#c4cde6', schuh: '#2b3658' },
  e: { mantel: '#7d6a9c', kopf: '#d2c8e2', schuh: '#3d3350' },
  f: { mantel: '#a0704f', kopf: '#e2c9b4', schuh: '#523927' },
  g: { mantel: '#5f8a5a', kopf: '#c6dcc2', schuh: '#304a2d' },
};

// Rumpf und Kopf. (cx, fy) ist der Punkt unter der Figur, s die Feldgröße.
// o: farben, steht 0..1 (0 sitzt), neigung, kopfY (Versatz in Feldern)
export function maleFahrgastKoerper(stift, cx, fy, s, o) {
  const steht = o.steht || 0;
  const hoch = s * (0.6 + 0.14 * steht);
  const schulter = s * (0.37 - 0.02 * steht);
  const saum = s * (0.46 - 0.06 * steht);
  const kopf = s * 0.12;
  const schulterY = fy - hoch + kopf * 1.75;
  const schub = (o.neigung || 0) * hoch * 0.16;
  const r = Math.min(schulter * 0.3, hoch * 0.16);
  const f = o.farben;

  if (steht > 0.5) {
    stift.fillStyle = f.schuh;
    rundesRechteck(stift, cx - saum * 0.42, fy - hoch * 0.07, saum * 0.36, hoch * 0.09, hoch * 0.03);
    stift.fill();
    rundesRechteck(stift, cx + saum * 0.06, fy - hoch * 0.07, saum * 0.36, hoch * 0.09, hoch * 0.03);
    stift.fill();
  }
  stift.fillStyle = f.mantel;
  stift.beginPath();
  stift.moveTo(cx - saum / 2, fy - hoch * 0.05);
  stift.lineTo(cx - schulter / 2 + schub, schulterY + r);
  stift.quadraticCurveTo(cx - schulter / 2 + schub, schulterY, cx - schulter / 2 + schub + r, schulterY);
  stift.lineTo(cx + schulter / 2 + schub - r, schulterY);
  stift.quadraticCurveTo(cx + schulter / 2 + schub, schulterY, cx + schulter / 2 + schub, schulterY + r);
  stift.lineTo(cx + saum / 2, fy - hoch * 0.05);
  stift.closePath();
  stift.fill();

  const kopfX = cx + schub * 1.35;
  const kopfY = schulterY - kopf * 0.72 + (o.kopfY || 0) * s;
  stift.fillStyle = f.kopf;
  kreis(stift, kopfX, kopfY, kopf);
  stift.fill();
  return { schulterY, kopfX, kopfY, kopf };
}

// Eine hochgehaltene Fahrkarte: nur Papier, nichts darauf zu lesen.
export function maleHochgehalten(stift, x, y, s, staerke) {
  if (staerke <= 0.01) return;
  stift.save();
  stift.globalAlpha *= staerke;
  stift.fillStyle = '#e9dcc0';
  rundesRechteck(stift, x - s * 0.13, y - s * 0.08, s * 0.26, s * 0.16, s * 0.03);
  stift.fill();
  stift.fillStyle = '#c9bb9a';
  stift.fillRect(x - s * 0.13, y + s * 0.06, s * 0.26, s * 0.02);
  stift.restore();
}

// Wer schon kontrolliert ist, hat eine gelochte Karte vor sich: eine kleine Sichel über dem Kopf.
export function maleGelocht(stift, x, y, s, staerke) {
  if (staerke <= 0.01) return;
  stift.save();
  stift.globalAlpha *= staerke * 0.8;
  stift.strokeStyle = '#e9dcc0';
  stift.lineWidth = Math.max(1.5, s * 0.035);
  stift.lineCap = 'round';
  stift.beginPath();
  stift.arc(x, y, s * 0.06, 0.6, 2.9);
  stift.stroke();
  stift.restore();
}
