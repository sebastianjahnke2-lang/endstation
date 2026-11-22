// Bildschirmaufteilung des Saals, ab 360 x 600. Alles in CSS-Pixeln des sicheren Bereichs.
// Von oben nach unten: die Rückwand mit den Fenstern (dort oben rechts der Lautsprecher), die Tür mit den
// Wartenden und rechts daneben, am Rand des Saals, die Glocke, dann die fünf Bänke. Unten bleibt ein Rand frei, dort liegt nichts zum Antippen.
// Eine Bank ist eine Reihe von vier Plätzen. Innen ist links, der äußerste Platz rechts, zum Gang hin.

import { BAENKE, PLAETZE, TUER_HOECHSTENS, FENSTER } from '../kern/abend.js';

export const SAALRAND_UNTEN = 26; // so viel bleibt unten frei
const SEITE = 12;

export function berechneSaal(breite, hoehe) {
  const wandH = Math.round(Math.min(170, Math.max(96, hoehe * 0.19)));
  const verfuegbar = hoehe - wandH - SAALRAND_UNTEN - 8;
  let reihe = Math.floor(verfuegbar / (BAENKE + 1)); // Tür und fünf Bänke
  // Platz: vier Plätze und rechts ein Stück Gang
  const s = Math.floor(Math.min((breite - 2 * SEITE) / (PLAETZE + 0.7), reihe * 0.98, 96));
  reihe = Math.min(reihe, Math.round(s * 1.22));
  const hoch = reihe * (BAENKE + 1);
  const oben = wandH + Math.max(4, Math.round((verfuegbar - hoch) / 3));
  const x0 = Math.round((breite - s * (PLAETZE + 0.7)) / 2);

  const plaetze = (zeile) => {
    const y = oben + zeile * reihe;
    const liste = [];
    for (let i = 0; i < PLAETZE; i++) liste.push({ x: x0 + i * s, y, b: s, h: reihe, cx: x0 + (i + 0.5) * s, fy: y + reihe * 0.9 });
    return liste;
  };

  const tuer = {
    zeile: { x: 0, y: oben, b: breite, h: reihe },
    plaetze: plaetze(0).slice(0, TUER_HOECHSTENS),
    // die Tür selbst steht rechts neben den Wartenden
    rahmen: { x: x0 + TUER_HOECHSTENS * s + s * 0.15, y: oben + reihe * 0.04, b: s * 1.0, h: reihe * 0.96 },
  };
  // die Glocke: rechts neben der Tür, am Rand des Saals, so breit wie der Platz bis zum Rand
  const tuerRechts = tuer.rahmen.x + tuer.rahmen.b;
  const glocke = { x: tuerRechts + 2, y: oben, b: Math.max(30, breite - tuerRechts - 4), h: reihe };
  glocke.cx = glocke.x + glocke.b / 2;
  glocke.cy = oben + reihe * 0.55;
  const baenke = [];
  for (let b = 0; b < BAENKE; b++) {
    const p = plaetze(b + 1);
    baenke.push({ zeile: { x: 0, y: p[0].y, b: breite, h: reihe }, plaetze: p, holz: { x: x0 - s * 0.08, y: p[0].y + reihe * 0.5, b: s * PLAETZE + s * 0.16, h: reihe * 0.44 } });
  }

  // Fenster: zwei Reihen auf der Rückwand
  const proReihe = Math.ceil(FENSTER / 2);
  const fb = Math.floor((breite - 2 * SEITE) / proReihe);
  const fh = Math.floor((wandH - 22) / 2);
  const fenster = [];
  for (let i = 0; i < FENSTER; i++) {
    const r = Math.floor(i / proReihe);
    const c = i % proReihe;
    fenster.push({ x: SEITE + c * fb + fb * 0.16, y: 12 + r * (fh + 4), b: fb * 0.68, h: fh - 2 });
  }

  return {
    breite,
    hoehe,
    s,
    reihe,
    wand: { x: 0, y: 0, b: breite, h: wandH },
    fenster,
    tuer,
    glocke,
    baenke,
    ton: { x: breite - 26, y: 20, b: 44, h: 40 },
    // der Satz am Ende steht über der Tür, damit man alle Bänke sieht
    satz: { x: SEITE, y: oben - 6, b: breite - 2 * SEITE, h: reihe + 6 },
    unten: baenke[BAENKE - 1].zeile.y + reihe,
  };
}

export function imSaalKasten(k, x, y) {
  return x >= k.x && x <= k.x + k.b && y >= k.y && y <= k.y + k.h;
}

// Was liegt unter dem Finger? { art: 'ton' } | { art: 'glocke' } | { art: 'tuer', platz } | { art: 'bank', bank, platz }
// | { art: 'nichts' }. platz ist der Platz, über dem der Finger liegt: an der Tür 0 bis 3 (3 ist die Tür selbst),
// in der Bank 0 innen bis 3 außen, oder 4 im Gang daneben.
export function wasImSaal(m, x, y) {
  const t = m.ton;
  if (Math.abs(x - t.x) <= t.b / 2 && Math.abs(y - t.y) <= t.h / 2) return { art: 'ton' };
  if (imSaalKasten(m.glocke, x, y)) return { art: 'glocke' };
  if (imSaalKasten(m.tuer.zeile, x, y)) {
    const p = m.tuer.plaetze;
    return { art: 'tuer', platz: Math.max(0, Math.min(3, Math.floor((x - p[0].x) / m.s))) };
  }
  for (let b = 0; b < m.baenke.length; b++) {
    if (!imSaalKasten(m.baenke[b].zeile, x, y)) continue;
    const p = m.baenke[b].plaetze;
    const platz = Math.max(0, Math.min(PLAETZE, Math.floor((x - p[0].x) / m.s)));
    return { art: 'bank', bank: b, platz };
  }
  return { art: 'nichts' };
}
