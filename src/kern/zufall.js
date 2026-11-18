// Zufall mit Seed. Der Stand liegt im Spielzustand, damit jede Fahrt
// mit demselben Seed und denselben Eingaben gleich verläuft.

export function naechsteZufallszahl(z) {
  z.zufall = (z.zufall + 0x6d2b79f5) >>> 0;
  let t = z.zufall;
  t = Math.imul(t ^ (t >>> 15), t | 1);
  t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}

// ganze Zahl von 0 bis n - 1
export function wuerfle(z, n) {
  return Math.floor(naechsteZufallszahl(z) * n);
}
