// Das Raster eines Wagens und alles, was nur mit Geometrie zu tun hat.

export const BREITE = 5;
export const HOEHE = 8;
export const STARTFELD = { x: 2, y: 7 };
export const TUERFELD = { x: 2, y: 0 }; // das Feld vor der Tür, die Tür liegt darüber

export const RICHTUNG = {
  hoch: { x: 0, y: -1 },
  rechts: { x: 1, y: 0 },
  runter: { x: 0, y: 1 },
  links: { x: -1, y: 0 },
};
export const RICHTUNGSNAMEN = ['hoch', 'rechts', 'runter', 'links'];

export function imFeld(x, y) {
  return x >= 0 && x < BREITE && y >= 0 && y < HOEHE;
}

export function feldNr(x, y) {
  return y * BREITE + x;
}

export function abstand(a, b) {
  return Math.abs(a.x - b.x) + Math.abs(a.y - b.y);
}

// Breitensuche: Entfernung jedes Feldes zum Ziel in Schritten.
// begehbar(x, y) entscheidet, wo man gehen darf. Das Zielfeld zählt immer.
// Unerreichbare Felder behalten -1.
export function entfernungen(ziel, begehbar) {
  const weit = new Array(BREITE * HOEHE).fill(-1);
  const schlange = [{ x: ziel.x, y: ziel.y }];
  weit[feldNr(ziel.x, ziel.y)] = 0;
  for (let i = 0; i < schlange.length; i++) {
    const f = schlange[i];
    const d = weit[feldNr(f.x, f.y)];
    for (const name of RICHTUNGSNAMEN) {
      const x = f.x + RICHTUNG[name].x;
      const y = f.y + RICHTUNG[name].y;
      if (!imFeld(x, y) || weit[feldNr(x, y)] !== -1 || !begehbar(x, y)) continue;
      weit[feldNr(x, y)] = d + 1;
      schlange.push({ x, y });
    }
  }
  return weit;
}

// Der nächste Schritt von "von" in Richtung Ziel, anhand einer Entfernungskarte.
// Bei Gleichstand wird zuerst die größere Lücke geschlossen, danach gilt die
// feste Reihenfolge der Richtungen. So bewegt sich jede Figur immer gleich.
export function naechsterSchritt(von, weit, ziel) {
  const hier = weit[feldNr(von.x, von.y)];
  if (hier <= 0) return null;
  let bester = null;
  let besteLuecke = -1;
  for (const name of RICHTUNGSNAMEN) {
    const x = von.x + RICHTUNG[name].x;
    const y = von.y + RICHTUNG[name].y;
    if (!imFeld(x, y) || weit[feldNr(x, y)] !== hier - 1) continue;
    const luecke = RICHTUNG[name].x !== 0 ? Math.abs(ziel.x - von.x) : Math.abs(ziel.y - von.y);
    if (luecke > besteLuecke) {
      bester = { x, y, richtung: name };
      besteLuecke = luecke;
    }
  }
  return bester;
}
