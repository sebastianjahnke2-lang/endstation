// Gäste im Saal: Mantel, Kopf, Hut. Jede Farbe hat ihren eigenen Hut, damit man sie auch ohne
// Farbsehen unterscheidet: rot ein runder, blau ein hoher, grün ein breiter, violett eine Mütze mit Bommel.
// Ein Falscher trägt Farbe und Hut der Gruppe, die er zeigt, und sieht genauso aus wie ein Ehrlicher dieser Farbe.
// Erkennen kann man ihn nur am Verhalten: Er rückt ab oder zusammen (buehne.js).

import { rundesRechteck, kreis } from '../../../../src/anzeige/formen.js';

export const GASTFARBEN = [
  { mantel: '#b5452f', hut: '#5e2117', kopf: '#ecc9a8' },
  { mantel: '#33609c', hut: '#172c4d', kopf: '#e6c7a6' },
  { mantel: '#3f8350', hut: '#1c3d24', kopf: '#ebcaa9' },
  { mantel: '#76508f', hut: '#382449', kopf: '#e8c8a8' },
];

// Wie ein Gast gezeichnet wird, hängt nur an der Farbe, die er zeigt. Die echte bleibt unsichtbar.
export function aussehen(g) {
  return { farbe: g.zeigt };
}

// Mischt zwei Farben '#rrggbb', p von 0 (a) bis 1 (b)
export function mische(a, b, p) {
  const ka = parseInt(a.slice(1), 16);
  const kb = parseInt(b.slice(1), 16);
  let aus = '#';
  for (const k of [16, 8, 0]) {
    const wert = Math.round(((ka >> k) & 255) * (1 - p) + ((kb >> k) & 255) * p);
    aus += (wert < 16 ? '0' : '') + wert.toString(16);
  }
  return aus;
}

function maleHut(stift, form, x, y, k, farbe) {
  stift.fillStyle = farbe;
  if (form === 0) {
    // runder Hut: Kuppel mit schmaler Krempe
    stift.beginPath();
    stift.arc(x, y - k * 0.35, k * 0.85, Math.PI, 0);
    stift.fill();
    rundesRechteck(stift, x - k * 1.25, y - k * 0.42, k * 2.5, k * 0.36, k * 0.18);
    stift.fill();
  } else if (form === 1) {
    // hoher Hut
    rundesRechteck(stift, x - k * 0.75, y - k * 2.2, k * 1.5, k * 1.95, k * 0.15);
    stift.fill();
    rundesRechteck(stift, x - k * 1.25, y - k * 0.42, k * 2.5, k * 0.36, k * 0.18);
    stift.fill();
  } else if (form === 2) {
    // breiter Hut: flache Kappe, weite Krempe
    rundesRechteck(stift, x - k * 0.75, y - k * 0.95, k * 1.5, k * 0.7, k * 0.3);
    stift.fill();
    rundesRechteck(stift, x - k * 1.9, y - k * 0.42, k * 3.8, k * 0.34, k * 0.17);
    stift.fill();
  } else {
    // Mütze mit Bommel
    stift.beginPath();
    stift.arc(x, y - k * 0.2, k * 1.02, Math.PI, 0);
    stift.fill();
    kreis(stift, x, y - k * 1.45, k * 0.42);
    stift.fill();
  }
}

// (cx, fy): Mitte unter der Figur. s: Größe eines Platzes.
// o: { farbe, alt (vorige Farbe beim Wechsel), wechsel 0..1, sitzt 0..1, glanz 0..1, licht 0..1 }
export function maleGast(stift, cx, fy, s, o) {
  const farbe = GASTFARBEN[o.farbe];
  const alt = o.alt === undefined || o.alt === null ? farbe : GASTFARBEN[o.alt];
  const w = o.wechsel === undefined ? 1 : o.wechsel;
  const sitzt = o.sitzt === undefined ? 1 : o.sitzt;
  const hoch = s * (0.62 + 0.14 * (1 - sitzt));
  const schulter = s * 0.46;
  const saum = s * 0.56;
  const k = s * 0.13;
  const schulterY = fy - hoch + k * 1.9;
  const r = schulter * 0.28;

  const mantel = mische(alt.mantel, farbe.mantel, w);
  const hut = mische(alt.hut, farbe.hut, w);

  if (o.glanz > 0.01) schein(stift, cx, fy - hoch * 0.5, s * 0.55, 'rgba(255,240,190,', 0.75 * o.glanz);

  stift.fillStyle = mantel;
  stift.beginPath();
  stift.moveTo(cx - saum / 2, fy);
  stift.lineTo(cx - schulter / 2, schulterY + r);
  stift.quadraticCurveTo(cx - schulter / 2, schulterY, cx - schulter / 2 + r, schulterY);
  stift.lineTo(cx + schulter / 2 - r, schulterY);
  stift.quadraticCurveTo(cx + schulter / 2, schulterY, cx + schulter / 2, schulterY + r);
  stift.lineTo(cx + saum / 2, fy);
  stift.closePath();
  stift.fill();

  stift.fillStyle = mische(mantel, '#000000', 0.25);
  stift.beginPath();
  stift.moveTo(cx - k * 1.1, schulterY);
  stift.lineTo(cx, schulterY + k * 1.1);
  stift.lineTo(cx + k * 1.1, schulterY);
  stift.closePath();
  stift.fill();

  const kopfY = schulterY - k * 0.85;
  stift.fillStyle = farbe.kopf;
  kreis(stift, cx, kopfY, k);
  stift.fill();

  // Beim Wechsel schrumpft der alte Hut und der neue wächst
  if (w < 1) {
    stift.save();
    stift.globalAlpha *= 1 - w;
    maleHut(stift, o.alt, cx, kopfY - k * 0.55, k * (1 - w * 0.5), hut);
    stift.restore();
  }
  stift.save();
  stift.globalAlpha *= w;
  maleHut(stift, o.farbe, cx, kopfY - k * 0.55, k * (0.5 + w * 0.5), hut);
  stift.restore();

  // Leuchten beim Räumen
  if (o.licht > 0.01) schein(stift, cx, fy - hoch * 0.5, s * 0.7, 'rgba(255,226,150,', 0.8 * o.licht);
}

// weicher, runder Schein, innen hell, nach außen auslaufend
function schein(stift, x, y, r, farbe, staerke) {
  const g = stift.createRadialGradient(x, y, 0, x, y, r);
  g.addColorStop(0, farbe + staerke + ')');
  g.addColorStop(1, farbe + '0)');
  stift.fillStyle = g;
  kreis(stift, x, y, r);
  stift.fill();
}
