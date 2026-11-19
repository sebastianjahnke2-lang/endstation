// Licht und Schatten. Die eine unwirkliche Regel des Wagens steckt in falschBelegt():
// Für den Schaffner belegt auch ein Schatten einen Platz.

import { LAMPEN, LAMPENNAMEN, SPALTEN, SCHLAEFERPLATZ, WACHERPLATZ, TASCHENPLATZ, istSitz } from './abteil.js';

// Alle, die gerade sitzen, von links nach rechts ist egal. Der Spieler nur, wenn er auf einem Sitz ist.
export function sitzende(z) {
  const liste = [];
  if (istSitz(z.spieler.x, z.spieler.y)) {
    liste.push({ wer: 'spieler', x: z.spieler.x, y: z.spieler.y, wach: true, gelocht: z.spieler.gelocht });
  }
  liste.push({ wer: 'schlaefer', x: SCHLAEFERPLATZ.x, y: SCHLAEFERPLATZ.y, wach: z.schlaefer.wach, gelocht: z.schlaefer.gelocht });
  liste.push({ wer: 'wacher', x: WACHERPLATZ.x, y: WACHERPLATZ.y, wach: true, gelocht: z.wacher.gelocht });
  return liste;
}

export function sitztJemand(z, x, y) {
  return sitzende(z).some((f) => f.x === x && f.y === y);
}

export function liegtTasche(z, x, y) {
  return z.tasche && x === TASCHENPLATZ.x && y === TASCHENPLATZ.y;
}

// In welche Richtung das Licht einer Lampe fällt: -1 nach links, +1 nach rechts
export function lichtrichtung(name, stellung) {
  const zumFenster = Math.sign(LAMPEN[name].fensterplatz - LAMPEN[name].gangplatz);
  return stellung === 'fenster' ? zumFenster : -zumFenster;
}

// Wer in einem beleuchteten Paar sitzt, wirft seinen Schatten ein Feld weiter in Lichtrichtung:
// auf den Nachbarsitz, auf das Gangfeld oder an die Wand (dann liegt er auf keinem Feld).
export function bestimmeSchatten(z) {
  const liste = [];
  for (const name of LAMPENNAMEN) {
    const lampe = LAMPEN[name];
    const richtung = lichtrichtung(name, z.lampen[name]);
    for (const figur of sitzende(z)) {
      if (figur.y !== lampe.reihe || (figur.x !== lampe.gangplatz && figur.x !== lampe.fensterplatz)) continue;
      const x = figur.x + richtung;
      liste.push({ von: figur.wer, lampe: name, x, y: lampe.reihe, wand: x < 0 || x >= SPALTEN });
    }
  }
  return liste;
}

// Sitze einer Reihe, auf denen niemand sitzt, auf denen aber eine Tasche oder ein Schatten liegt.
// Die Tasche steht vor dem Schatten: Auf sie zeigt der Schaffner zuerst.
export function falschBelegt(z, reihe) {
  const funde = [];
  if (z.tasche && TASCHENPLATZ.y === reihe && !sitztJemand(z, TASCHENPLATZ.x, TASCHENPLATZ.y)) {
    funde.push({ x: TASCHENPLATZ.x, y: TASCHENPLATZ.y, was: 'tasche' });
  }
  for (const s of z.schatten) {
    if (s.wand || s.y !== reihe || !istSitz(s.x, s.y) || sitztJemand(z, s.x, s.y)) continue;
    funde.push({ x: s.x, y: s.y, was: 'schatten' });
  }
  return funde;
}
