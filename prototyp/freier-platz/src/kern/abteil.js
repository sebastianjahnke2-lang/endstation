// Wagen 7 als fester Plan: wo Gang, Sitze, Lampen und Fahrgäste sind.
// Kennt weder Bildschirm noch Browser. Nichts hier hängt vom Zufall ab.
//
//        Spalte  0  1  2  3  4
//   Reihe 0      #  #  Z  #  #     Z = Zieltür, # = Wand
//   Reihe 1      s  s  .  s  s     s = Sitz, . = Gang
//   Reihe 2      s  s  .  F  s     F = schlafender Fahrgast, Lampe B
//   Reihe 3      s  s  .  s  s
//   Reihe 4      s  s  .  s  s
//   Reihe 5      T  S  .  s  s     S = Spieler, T = Tasche, Lampe A
//   Reihe 6      s  s  .  s  P     P = wacher Fahrgast
//   Reihe 7      #  #  K  #  #     K = Schaffner am Anfang

export const SPALTEN = 5;
export const REIHEN = 8;
export const GANGSPALTE = 2;

export const ZIELTUER = { x: 2, y: 0 };
export const SCHAFFNERSTART = { x: 2, y: 7 };
export const SPIELERPLATZ = { x: 1, y: 5 };
export const TASCHENPLATZ = { x: 0, y: 5 };
export const SCHLAEFERPLATZ = { x: 3, y: 2 };
export const WACHERPLATZ = { x: 4, y: 6 };

export const SCHRITTE = {
  hoch: { x: 0, y: -1 },
  rechts: { x: 1, y: 0 },
  runter: { x: 0, y: 1 },
  links: { x: -1, y: 0 },
};
export const GEGENUEBER = { hoch: 'runter', rechts: 'links', runter: 'hoch', links: 'rechts' };

// Nur an zwei Sitzpaaren brennt eine Leselampe. Stellung "fenster": Das Licht fällt vom Gang
// zum Fenster. Stellung "gang": Es fällt vom Fenster zum Gang.
export const LAMPEN = {
  A: { reihe: 5, gangplatz: 1, fensterplatz: 0 },
  B: { reihe: 2, gangplatz: 3, fensterplatz: 4 },
};
export const LAMPENNAMEN = ['A', 'B'];

export function istGang(x, y) {
  return x === GANGSPALTE && y >= 0 && y < REIHEN;
}

export function istSitz(x, y) {
  return x >= 0 && x < SPALTEN && x !== GANGSPALTE && y >= 1 && y <= REIHEN - 2;
}

// Abstand für "in Reichweite": ein Feld weit, auch schräg
export function reichweite(a, b) {
  return Math.max(Math.abs(a.x - b.x), Math.abs(a.y - b.y));
}
