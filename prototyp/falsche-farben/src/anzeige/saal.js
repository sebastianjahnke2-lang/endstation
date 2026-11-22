// Der Saal: eine warme, goldene Halle in der Nacht. Hohe Rückwand mit zwei Reihen Fenstern, Dielenboden,
// fünf Holzbänke mit Lehne, rechts oben die Tür. Der Hintergrund wird einmal je Größe vorgemalt.

import { rundesRechteck } from '../../../../src/anzeige/formen.js';

export const SAALFARBE = {
  nacht: '#120c07',
  wand: '#3b2715',
  wandLeiste: '#56391d',
  boden: '#4a2f17',
  diele: '#563719',
  fuge: '#3a240f',
  glas: '#141a2a',
  glasRand: '#6b4a24',
  licht: '#ffd47e',
  lichtHell: '#fff1c8',
  lehne: '#6e4524',
  sitz: '#8a5a2f',
  sitzKante: '#a06c3a',
  tuer: '#2a1a0c',
  tuerRahmen: '#7a5228',
  wahl: '#ffe3a1',
  schrift: '#ffe2a6',
  schriftGrund: '#1c1209',
};

export function maleSaalGrund(m, dichte) {
  const leinwand = document.createElement('canvas');
  leinwand.width = Math.round(m.breite * dichte);
  leinwand.height = Math.round(m.hoehe * dichte);
  const st = leinwand.getContext('2d');
  st.scale(dichte, dichte);

  // Boden: Dielen quer
  st.fillStyle = SAALFARBE.boden;
  st.fillRect(0, 0, m.breite, m.hoehe);
  const diele = Math.max(10, Math.round(m.s * 0.32));
  for (let y = m.wand.h, i = 0; y < m.hoehe; y += diele, i++) {
    st.fillStyle = i % 2 ? SAALFARBE.diele : SAALFARBE.boden;
    st.fillRect(0, y, m.breite, diele - 1);
    st.fillStyle = SAALFARBE.fuge;
    st.fillRect(0, y + diele - 1, m.breite, 1);
    const versatz = (i * 0.37) % 1;
    for (let x = versatz * m.breite * 0.5; x < m.breite; x += m.breite * 0.5) st.fillRect(x, y, 1, diele - 1);
  }
  // warmer Schein von oben
  const schein = st.createLinearGradient(0, m.wand.h, 0, m.hoehe);
  schein.addColorStop(0, 'rgba(255,200,120,0.16)');
  schein.addColorStop(1, 'rgba(0,0,0,0.25)');
  st.fillStyle = schein;
  st.fillRect(0, m.wand.h, m.breite, m.hoehe - m.wand.h);

  // Rückwand mit Leiste
  st.fillStyle = SAALFARBE.wand;
  st.fillRect(0, 0, m.breite, m.wand.h);
  st.fillStyle = SAALFARBE.wandLeiste;
  st.fillRect(0, m.wand.h - 6, m.breite, 6);

  // Fenster, dunkel; die hellen malt die Bühne darüber
  for (const f of m.fenster) {
    st.fillStyle = SAALFARBE.glasRand;
    st.fillRect(f.x - 2, f.y - 2, f.b + 4, f.h + 4);
    st.fillStyle = SAALFARBE.glas;
    st.fillRect(f.x, f.y, f.b, f.h);
    maleSprossen(st, f, SAALFARBE.glasRand);
  }

  // Tür
  const t = m.tuer.rahmen;
  st.fillStyle = SAALFARBE.tuerRahmen;
  rundesRechteck(st, t.x - 3, t.y - 3, t.b + 6, t.h + 3, 4);
  st.fill();
  st.fillStyle = SAALFARBE.tuer;
  st.fillRect(t.x, t.y, t.b, t.h);
  st.fillStyle = 'rgba(255,212,126,0.10)';
  st.fillRect(t.x, t.y + t.h * 0.55, t.b, t.h * 0.45);

  // Bänke: Lehne hinter den Plätzen, Sitzfläche davor
  for (const bank of m.baenke) {
    const h = bank.holz;
    st.fillStyle = SAALFARBE.lehne;
    rundesRechteck(st, h.x, bank.zeile.y + m.reihe * 0.22, h.b, m.reihe * 0.4, m.s * 0.06);
    st.fill();
    for (const p of bank.plaetze) {
      st.fillStyle = 'rgba(0,0,0,0.12)';
      st.fillRect(p.x + p.b - 1, bank.zeile.y + m.reihe * 0.26, 2, m.reihe * 0.32);
    }
  }
  return leinwand;
}

export function maleSprossen(st, f, farbe) {
  st.fillStyle = farbe;
  st.fillRect(f.x + f.b / 2 - 1, f.y, 2, f.h);
  st.fillRect(f.x, f.y + f.h * 0.45, f.b, 2);
}

// Sitzfläche, über den sitzenden Figuren gemalt, damit sie auf der Bank sitzen
export function maleSitz(st, m, bank) {
  const h = bank.holz;
  st.fillStyle = SAALFARBE.sitz;
  rundesRechteck(st, h.x, bank.zeile.y + m.reihe * 0.8, h.b, m.reihe * 0.13, m.s * 0.04);
  st.fill();
  st.fillStyle = SAALFARBE.sitzKante;
  st.fillRect(h.x + 2, bank.zeile.y + m.reihe * 0.8, h.b - 4, 2);
  st.fillStyle = SAALFARBE.lehne;
  st.fillRect(h.x + m.s * 0.1, bank.zeile.y + m.reihe * 0.93, m.s * 0.08, m.reihe * 0.07);
  st.fillRect(h.x + h.b - m.s * 0.18, bank.zeile.y + m.reihe * 0.93, m.s * 0.08, m.reihe * 0.07);
}

// ein leuchtendes Fenster, staerke 0..1
export function maleLichtFenster(st, f, staerke) {
  if (staerke <= 0.01) return;
  st.save();
  st.globalAlpha = 0.22 * staerke;
  st.fillStyle = SAALFARBE.licht;
  st.fillRect(f.x - 5, f.y - 5, f.b + 10, f.h + 10);
  st.globalAlpha = 0.12 * staerke;
  st.fillRect(f.x - 10, f.y - 9, f.b + 20, f.h + 18);
  st.globalAlpha = staerke;
  const g = st.createLinearGradient(0, f.y, 0, f.y + f.h);
  g.addColorStop(0, SAALFARBE.lichtHell);
  g.addColorStop(1, SAALFARBE.licht);
  st.fillStyle = g;
  st.fillRect(f.x, f.y, f.b, f.h);
  maleSprossen(st, f, SAALFARBE.glasRand);
  st.restore();
}

// Die Glocke am Rand des Saals, an einem Haken. o: { matt, an (Verhör angewählt), blink 0..1, zeit }
// Matt: dunkles, stumpfes Metall. Angewählt: sie schwingt leicht und glänzt.
export function maleGlocke(st, g, s, o) {
  const r = Math.min(g.b * 0.36, s * 0.28);
  const x = g.cx;
  const oben = g.cy - r * 1.25;
  const winkel = o.an ? Math.sin(o.zeit / 110) * 0.18 : 0;
  st.save();
  // Haken an der Wand
  st.fillStyle = SAALFARBE.tuerRahmen;
  st.fillRect(x - r * 0.7, oben - r * 0.45, r * 1.4, r * 0.18);
  st.fillRect(x - 1, oben - r * 0.3, 2, r * 0.32);
  st.translate(x, oben);
  st.rotate(winkel);
  if (o.an || o.blink > 0.01) {
    const schein = st.createRadialGradient(0, r, 0, 0, r, r * 2.2);
    const a = Math.max(o.an ? 0.45 : 0, o.blink * 0.8);
    schein.addColorStop(0, 'rgba(255,226,150,' + a + ')');
    schein.addColorStop(1, 'rgba(255,226,150,0)');
    st.fillStyle = schein;
    st.beginPath();
    st.arc(0, r, r * 2.2, 0, Math.PI * 2);
    st.fill();
  }
  // Glockenkörper: schmal oben, weit unten, mit Rand
  st.fillStyle = o.matt ? '#5e5140' : '#d4a548';
  st.beginPath();
  st.moveTo(-r * 0.35, 0);
  st.quadraticCurveTo(-r * 0.55, r * 0.2, -r * 0.62, r * 1.2);
  st.quadraticCurveTo(-r * 0.7, r * 1.6, -r * 1.0, r * 1.8);
  st.lineTo(r * 1.0, r * 1.8);
  st.quadraticCurveTo(r * 0.7, r * 1.6, r * 0.62, r * 1.2);
  st.quadraticCurveTo(r * 0.55, r * 0.2, r * 0.35, 0);
  st.closePath();
  st.fill();
  if (!o.matt) {
    st.fillStyle = 'rgba(255,240,200,0.45)';
    st.fillRect(-r * 0.4, r * 0.3, r * 0.14, r * 1.1);
  }
  // Klöppel
  st.fillStyle = o.matt ? '#3f3628' : '#8a6a2c';
  st.beginPath();
  st.arc(Math.sin(-winkel) * r * 0.4, r * 1.95, r * 0.2, 0, Math.PI * 2);
  st.fill();
  st.restore();
}
