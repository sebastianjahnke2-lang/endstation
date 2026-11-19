// Farben und kleine Zeichenhilfen für die ganze Anzeige.

export const FARBE = {
  nacht: '#080a10',
  wand: '#2b3550',
  wandKante: '#3a4666',
  wandDunkel: '#171d2c',
  boden: '#151c2b',
  feld: '#212c44',
  feldKante: '#2a3858',
  glas: '#0c1626',
  glasGlanz: '#1c2d48',
  tafel: '#120e08',
  tafelRand: '#2c2416',
  bernstein: '#ffb347',
  bernsteinAus: '#33260f',
  rot: '#e8402f',
  rotHell: '#ff7a63',
  herz: '#f08a7a',
  ruhe: '#bfe3ff',
  leer: '#39435c',
  gruen: '#6fdc8f',
  warm: '#ffd9a0',
  spieler: { mantel: '#eadfc6', kopf: '#f7eedb', schuh: '#8d7b5e', schal: '#ffb347' },
  pendler: { mantel: '#6d7f98', kopf: '#bcc6d4', schuh: '#3b4658', tasche: '#4a392b', arm: '#56667d' },
  gruppe: { mantel: '#4f9483', kopf: '#b9dbd0', schuh: '#2c5449', rucksack: '#2f6155', wimpel: '#f2d264' },
  draengler: { mantel: '#9a5a74', kopf: '#dbb9c6', schuh: '#4f2c3c', arm: '#7c455c' },
};

export function rundesRechteck(stift, x, y, b, h, r) {
  const k = Math.min(r, b / 2, h / 2);
  stift.beginPath();
  stift.moveTo(x + k, y);
  stift.lineTo(x + b - k, y);
  stift.quadraticCurveTo(x + b, y, x + b, y + k);
  stift.lineTo(x + b, y + h - k);
  stift.quadraticCurveTo(x + b, y + h, x + b - k, y + h);
  stift.lineTo(x + k, y + h);
  stift.quadraticCurveTo(x, y + h, x, y + h - k);
  stift.lineTo(x, y + k);
  stift.quadraticCurveTo(x, y, x + k, y);
  stift.closePath();
}

export function kreis(stift, x, y, r) {
  stift.beginPath();
  stift.arc(x, y, Math.max(0, r), 0, Math.PI * 2);
}

export function begrenze(wert, von, bis) {
  return wert < von ? von : wert > bis ? bis : wert;
}

// weiches Auslaufen
export function sanft(p) {
  return 1 - (1 - p) * (1 - p) * (1 - p);
}

// Auslaufen mit kleinem Überschwingen, für den Flusszustand
export function leicht(p) {
  const c = 1.9;
  return 1 + (c + 1) * Math.pow(p - 1, 3) + c * Math.pow(p - 1, 2);
}

// hin und zurück: 0 -> 1 -> 0
export function hinUndHer(p) {
  return Math.sin(p * Math.PI);
}
