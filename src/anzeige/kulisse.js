// Der Wagen von oben, die Tür, die Lichter draußen und die Anzeigen am Rand.

import { BREITE, HOEHE, TUERFELD } from '../kern/feld.js';
import { FARBE, rundesRechteck, kreis } from './formen.js';
import { maleHindernis } from './figuren.js';
import { neuesPunktfeld, schreibe, zeichnePunktfeld, ZEICHENBREITE } from './matrix.js';

function neueLeinwand(breite, hoehe, dichte) {
  const leinwand = document.createElement('canvas');
  leinwand.width = Math.max(1, Math.round(breite * dichte));
  leinwand.height = Math.max(1, Math.round(hoehe * dichte));
  const stift = leinwand.getContext('2d');
  stift.setTransform(dichte, 0, 0, dichte, 0, 0);
  return { leinwand, stift };
}

// Rumpf, Boden, Fenster und Hindernisse eines Wagens als fertiges Bild.
// Der Ursprung des Bilds ist die linke obere Ecke des Rumpfs.
export function maleWagenbild(layout, plan, dichte) {
  const { rumpf, boden, s, wandSeite } = layout;
  const { leinwand, stift } = neueLeinwand(rumpf.b, rumpf.h, dichte);
  const bx = boden.x - rumpf.x;
  const by = boden.y - rumpf.y;

  stift.fillStyle = FARBE.wand;
  rundesRechteck(stift, 0, 0, rumpf.b, rumpf.h, s * 0.2);
  stift.fill();
  stift.fillStyle = FARBE.wandKante;
  rundesRechteck(stift, 0, 0, rumpf.b, s * 0.1, s * 0.2);
  stift.fill();

  // Fenster: je Seite vier, jedes über fast zwei Felder
  for (let k = 0; k < HOEHE / 2; k++) {
    const fy = by + (k * 2 + 0.16) * s;
    const fh = s * 1.68;
    for (const fx of [2, rumpf.b - wandSeite + 2]) {
      stift.fillStyle = FARBE.glas;
      rundesRechteck(stift, fx, fy, wandSeite - 4, fh, 3);
      stift.fill();
      stift.fillStyle = FARBE.glasGlanz;
      stift.fillRect(fx + 1, fy + fh * 0.12, 1.5, fh * 0.3);
    }
  }

  stift.fillStyle = FARBE.boden;
  stift.fillRect(bx, by, boden.b, boden.h);
  for (let y = 0; y < HOEHE; y++) {
    for (let x = 0; x < BREITE; x++) {
      const px = bx + x * s;
      const py = by + y * s;
      stift.fillStyle = FARBE.feld;
      rundesRechteck(stift, px + 1.5, py + 1.5, s - 3, s - 3, s * 0.1);
      stift.fill();
      stift.fillStyle = FARBE.feldKante;
      rundesRechteck(stift, px + 1.5, py + 1.5, s - 3, 2, 1);
      stift.fill();
    }
  }
  for (let y = 0; y < HOEHE; y++) {
    for (let x = 0; x < BREITE; x++) {
      if (plan[y][x] !== '.') maleHindernis(stift, plan[y][x], bx + x * s, by + y * s, s, x, y);
    }
  }

  // die Tür, durch die man gekommen ist: unten, geschlossen
  const tx = bx + TUERFELD.x * s;
  stift.fillStyle = FARBE.wandDunkel;
  stift.fillRect(tx + s * 0.08, by + boden.h, s * 0.84, layout.wandUnten);
  stift.fillStyle = '#232c42';
  stift.fillRect(tx + s * 0.12, by + boden.h + 2, s * 0.37, layout.wandUnten - 4);
  stift.fillRect(tx + s * 0.51, by + boden.h + 2, s * 0.37, layout.wandUnten - 4);
  return leinwand;
}

// Die Tür oben. offen läuft von 0 (zu) bis 1 (auf). (ox, oy) verschiebt den ganzen Wagen.
export function maleTuer(stift, layout, offen, t, ox, oy) {
  const { boden, rumpf, s, wandOben } = layout;
  const x = boden.x + TUERFELD.x * s + ox;
  const y = rumpf.y + oy;
  stift.fillStyle = FARBE.wandDunkel;
  stift.fillRect(x + s * 0.06, y + 2, s * 0.88, wandOben - 2);
  if (offen > 0.01) {
    const licht = stift.createLinearGradient(0, y, 0, y + wandOben);
    licht.addColorStop(0, '#fff1d6');
    licht.addColorStop(1, FARBE.warm);
    stift.fillStyle = licht;
    stift.globalAlpha = offen;
    stift.fillRect(x + s * 0.1, y + 3, s * 0.8, wandOben - 3);
    stift.globalAlpha = 1;
  }
  const fluegel = s * 0.4;
  const auf = offen * (fluegel - s * 0.07);
  stift.fillStyle = '#35415f';
  stift.fillRect(x + s * 0.1 - auf, y + 3, fluegel, wandOben - 3);
  stift.fillRect(x + s * 0.5 + auf, y + 3, fluegel, wandOben - 3);
  stift.fillStyle = FARBE.glas;
  stift.fillRect(x + s * 0.18 - auf, y + 6, fluegel * 0.6, wandOben * 0.42);
  stift.fillRect(x + s * 0.58 + auf, y + 6, fluegel * 0.6, wandOben * 0.42);
  // die Wand deckt die aufgeschobenen Flügel wieder zu
  stift.fillStyle = FARBE.wand;
  stift.fillRect(x - s * 0.34, y + 2, s * 0.4, wandOben - 2);
  stift.fillRect(x + s * 0.94, y + 2, s * 0.4, wandOben - 2);
  // Lampe neben der Tür: aus, solange zu, grün, wenn frei
  const lx = x + s * 1.14;
  const ly = y + wandOben * 0.55;
  if (offen > 0.5) {
    const schein = stift.createRadialGradient(lx, ly, 0, lx, ly, s * 0.3);
    schein.addColorStop(0, 'rgba(111, 220, 143, 0.55)');
    schein.addColorStop(1, 'rgba(111, 220, 143, 0)');
    stift.fillStyle = schein;
    kreis(stift, lx, ly, s * 0.3);
    stift.fill();
  }
  stift.fillStyle = offen > 0.5 ? FARBE.gruen : '#4b5672';
  kreis(stift, lx, ly, s * 0.065);
  stift.fill();
}

// Warmes Licht fällt durch die offene Tür auf den Boden, zwei Winkel zeigen nach oben.
export function maleTuerlicht(stift, layout, offen, t, ruhig) {
  if (offen < 0.01) return;
  const { boden, s } = layout;
  const cx = boden.x + (TUERFELD.x + 0.5) * s;
  const schein = stift.createRadialGradient(cx, boden.y, 0, cx, boden.y, s * 1.7);
  schein.addColorStop(0, `rgba(255, 217, 160, ${0.34 * offen})`);
  schein.addColorStop(1, 'rgba(255, 217, 160, 0)');
  stift.fillStyle = schein;
  stift.fillRect(boden.x, boden.y, boden.b, s * 1.8);
  const wandern = ruhig ? 0 : ((t * 0.9) % 1) * s * 0.12;
  stift.strokeStyle = FARBE.bernstein;
  stift.lineWidth = Math.max(2, s * 0.05);
  stift.lineCap = 'round';
  stift.lineJoin = 'round';
  for (let i = 0; i < 2; i++) {
    const y = boden.y + s * (0.34 + i * 0.2) - wandern;
    stift.globalAlpha = offen * (i === 0 ? 0.9 : 0.5);
    stift.beginPath();
    stift.moveTo(cx - s * 0.14, y + s * 0.09);
    stift.lineTo(cx, y);
    stift.lineTo(cx + s * 0.14, y + s * 0.09);
    stift.stroke();
  }
  stift.globalAlpha = 1;
}

// Lichter, die draußen vorbeiziehen: Laternen, ein beleuchtetes Fenster, ein Bahnübergang.
export function maleLichter(stift, layout, lichter, klar) {
  const { rumpf, breite } = layout;
  stift.save();
  stift.globalCompositeOperation = 'lighter';
  for (const l of lichter) {
    const frei = l.seite < 0 ? rumpf.x : breite - (rumpf.x + rumpf.b);
    const x = l.seite < 0 ? rumpf.x - frei * l.ort : rumpf.x + rumpf.b + frei * l.ort;
    const r = l.groesse * (1 + klar * 0.25);
    const schein = stift.createRadialGradient(x, l.y, 0, x, l.y, r);
    schein.addColorStop(0, `rgba(${l.farbe}, ${0.5 * l.hell})`);
    schein.addColorStop(0.35, `rgba(${l.farbe}, ${0.16 * l.hell})`);
    schein.addColorStop(1, `rgba(${l.farbe}, 0)`);
    stift.fillStyle = schein;
    stift.beginPath();
    stift.ellipse(x, l.y, r * 0.8, r * (1 + l.zug), 0, 0, Math.PI * 2);
    stift.fill();
  }
  stift.restore();
}

// Der Schein der Lichter wandert durch den Wagen über den Boden.
export function maleLichtschein(stift, layout, lichter, klar) {
  const { boden, s } = layout;
  stift.save();
  stift.beginPath();
  stift.rect(boden.x, boden.y, boden.b, boden.h);
  stift.clip();
  stift.globalCompositeOperation = 'lighter';
  for (const l of lichter) {
    if (l.fern) continue;
    const x = l.seite < 0 ? boden.x - s * 0.3 : boden.x + boden.b + s * 0.3;
    const r = s * (2.4 + klar * 0.8);
    const staerke = (0.09 + klar * 0.07) * l.hell;
    const schein = stift.createRadialGradient(x, l.y, 0, x, l.y, r);
    schein.addColorStop(0, `rgba(${l.farbe}, ${staerke})`);
    schein.addColorStop(1, `rgba(${l.farbe}, 0)`);
    stift.fillStyle = schein;
    stift.fillRect(boden.x, l.y - r, boden.b, r * 2);
  }
  stift.restore();
}

// Die Zuganzeige als fertiges Bild: Wagennummer links, Wagenname daneben.
export function maleTafelbild(layout, nummer, name, dichte) {
  const { tafel } = layout;
  const { leinwand, stift } = neueLeinwand(tafel.b, tafel.h, dichte);
  stift.fillStyle = FARBE.tafel;
  rundesRechteck(stift, 0, 0, tafel.b, tafel.h, 5);
  stift.fill();
  stift.strokeStyle = FARBE.tafelRand;
  stift.lineWidth = 1;
  rundesRechteck(stift, 0.5, 0.5, tafel.b - 1, tafel.h - 1, 5);
  stift.stroke();
  const feld = neuesPunktfeld(tafel.spalten, tafel.zeilen);
  schreibe(feld, nummer, 2, 1);
  schreibe(feld, name, 2 + ([...nummer].length + 1) * ZEICHENBREITE + 2, 1);
  // ein senkrechter Strich trennt Nummer und Name
  const strich = 2 + [...nummer].length * ZEICHENBREITE + 2;
  for (let y = 1; y < 8; y++) feld.an[y * feld.spalten + strich] = 1;
  zeichnePunktfeld(stift, feld, tafel.polster, tafel.polster, tafel.raster, FARBE.bernstein, FARBE.bernsteinAus);
  return leinwand;
}

function herzPfad(stift, cx, cy, g) {
  stift.beginPath();
  stift.moveTo(cx, cy + g * 0.46);
  stift.bezierCurveTo(cx - g * 0.72, cy + g * 0.02, cx - g * 0.52, cy - g * 0.56, cx, cy - g * 0.18);
  stift.bezierCurveTo(cx + g * 0.52, cy - g * 0.56, cx + g * 0.72, cy + g * 0.02, cx, cy + g * 0.46);
  stift.closePath();
}

// Herzen links. verlust: 0..1, lässt das zuletzt verlorene Herz aufblitzen und verschwinden.
export function maleHerzen(stift, x, y, herzen, voll, verlust, groesse) {
  const g = groesse || 17;
  for (let i = 0; i < voll; i++) {
    const cx = x + g * 0.6 + i * (g + 6);
    herzPfad(stift, cx, y, g);
    if (i < herzen) {
      stift.fillStyle = FARBE.herz;
      stift.fill();
    } else {
      stift.strokeStyle = FARBE.leer;
      stift.lineWidth = 1.5;
      stift.stroke();
      if (i === herzen && verlust > 0.01) {
        herzPfad(stift, cx, y, g * (1 + verlust * 0.5));
        stift.fillStyle = `rgba(255, 255, 255, ${verlust})`;
        stift.fill();
      }
    }
  }
}

// Ruhe rechts: drei Lichter. Bei voller Ruhe leuchten sie mit Hof.
export function maleRuhe(stift, xRechts, y, ruhe, voll, zuwachs) {
  for (let i = 0; i < voll; i++) {
    const cx = xRechts - 8 - (voll - 1 - i) * 21;
    const an = i < ruhe;
    if (an && ruhe >= voll) {
      const hof = stift.createRadialGradient(cx, y, 0, cx, y, 15);
      hof.addColorStop(0, 'rgba(191, 227, 255, 0.5)');
      hof.addColorStop(1, 'rgba(191, 227, 255, 0)');
      stift.fillStyle = hof;
      kreis(stift, cx, y, 15);
      stift.fill();
    }
    kreis(stift, cx, y, 6.5);
    if (an) {
      stift.fillStyle = FARBE.ruhe;
      stift.fill();
    } else {
      stift.strokeStyle = FARBE.leer;
      stift.lineWidth = 1.5;
      stift.stroke();
    }
    if (i === ruhe - 1 && zuwachs > 0.01) {
      stift.strokeStyle = `rgba(191, 227, 255, ${zuwachs})`;
      stift.lineWidth = 2;
      kreis(stift, cx, y, 6.5 + (1 - zuwachs) * 12);
      stift.stroke();
    }
  }
}

// Die Bahnhofsuhr ist der Knopf zum Warten. Jeder Zug rückt den Minutenzeiger weiter.
export function maleUhr(stift, uhr, minuten, druck) {
  const r = uhr.r * (1 - druck * 0.07);
  stift.fillStyle = '#0d1119';
  kreis(stift, uhr.x, uhr.y, r + 3);
  stift.fill();
  stift.fillStyle = druck > 0.01 ? '#f6f0e0' : '#d9d3c2';
  kreis(stift, uhr.x, uhr.y, r);
  stift.fill();
  stift.strokeStyle = '#1b1f2a';
  stift.lineCap = 'butt';
  for (let i = 0; i < 12; i++) {
    const w = (i / 12) * Math.PI * 2;
    const lang = i % 3 === 0 ? 0.24 : 0.14;
    stift.lineWidth = i % 3 === 0 ? 2.6 : 1.6;
    stift.beginPath();
    stift.moveTo(uhr.x + Math.sin(w) * r * (0.9 - lang), uhr.y - Math.cos(w) * r * (0.9 - lang));
    stift.lineTo(uhr.x + Math.sin(w) * r * 0.9, uhr.y - Math.cos(w) * r * 0.9);
    stift.stroke();
  }
  const stunde = (((minuten / 60) % 12) / 12) * Math.PI * 2;
  const minute = ((minuten % 60) / 60) * Math.PI * 2;
  stift.lineCap = 'round';
  stift.lineWidth = 3.4;
  stift.beginPath();
  stift.moveTo(uhr.x - Math.sin(stunde) * r * 0.12, uhr.y + Math.cos(stunde) * r * 0.12);
  stift.lineTo(uhr.x + Math.sin(stunde) * r * 0.5, uhr.y - Math.cos(stunde) * r * 0.5);
  stift.stroke();
  stift.lineWidth = 2.4;
  stift.beginPath();
  stift.moveTo(uhr.x - Math.sin(minute) * r * 0.14, uhr.y + Math.cos(minute) * r * 0.14);
  stift.lineTo(uhr.x + Math.sin(minute) * r * 0.74, uhr.y - Math.cos(minute) * r * 0.74);
  stift.stroke();
}

// Lautsprecher: an oder durchgestrichen
export function maleTonknopf(stift, ton, an) {
  const { x, y } = ton;
  stift.fillStyle = '#5b6680';
  stift.strokeStyle = '#5b6680';
  stift.lineWidth = 2;
  stift.lineCap = 'round';
  stift.beginPath();
  stift.moveTo(x - 9, y - 3.5);
  stift.lineTo(x - 4, y - 3.5);
  stift.lineTo(x + 1, y - 8);
  stift.lineTo(x + 1, y + 8);
  stift.lineTo(x - 4, y + 3.5);
  stift.lineTo(x - 9, y + 3.5);
  stift.closePath();
  stift.fill();
  if (an) {
    stift.beginPath();
    stift.arc(x + 2, y, 5, -0.9, 0.9);
    stift.stroke();
    stift.beginPath();
    stift.arc(x + 2, y, 9, -0.9, 0.9);
    stift.stroke();
  } else {
    stift.beginPath();
    stift.moveTo(x + 5, y - 4);
    stift.lineTo(x + 12, y + 4);
    stift.moveTo(x + 12, y - 4);
    stift.lineTo(x + 5, y + 4);
    stift.stroke();
  }
}
