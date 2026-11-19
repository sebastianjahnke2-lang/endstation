// Die Endkarte: ein warmes Bild vom Bahnsteig, darunter eine wahre Zeile.
// Nach oben wegwischen beginnt die nächste Fahrt.
// Arten: 'tod'; 'fehlt' (Halt, aber dem Schaffner fehlen helle Lochungen);
// 'halt' (ausgestiegen: erst der Rückblick, dann die Knöpfe „Aussteigen" und „Noch eine Fahrt").

import { FARBE, rundesRechteck, kreis, sanft } from './formen.js';
import { maleFigur, maleSymbol } from './figuren.js';
import { PRUEFUNGEN } from '../kern/fahrkarte.js';
import { maleHerzen, maleUhr } from './kulisse.js';
import { neuesPunktfeld, schreibeMittig, zeichnePunktfeld, ZEILENHOEHE } from './matrix.js';

// Maße der Karte. Sie ist nur so hoch wie ihr Inhalt.
export function kartenMasse(layout, art) {
  const b = Math.min(layout.breite - 32, 420);
  const x = Math.round((layout.breite - b) / 2);
  const polster = 6;
  const raster = b >= 380 ? 3 : 2.2;
  const spalten = Math.floor((b - 20 - 2 * polster) / raster);
  const zeilen = 2 * ZEILENHOEHE + 4;
  const bildH = Math.max(150, Math.min(250, Math.round(layout.hoehe * 0.34)));
  const tafelH = Math.ceil(zeilen * raster + 2 * polster);
  const herzenH = art === 'halt' ? 40 : 0;
  const fahrkarteH = 62;
  const knoepfeH = art === 'halt' ? 58 : 0; // zwei Knöpfe übereinander statt der Winkel
  const h = 10 + bildH + 10 + tafelH + herzenH + fahrkarteH + 66 + knoepfeH;
  const y = Math.round((layout.hoehe - h) / 2) - 4;
  const knopfB = b - 36;
  const unten = y + h - 10;
  return {
    x,
    y,
    b,
    h,
    bild: { x: x + 10, y: y + 10, b: b - 20, h: bildH },
    tafel: { x: x + 10, y: y + 20 + bildH, b: b - 20, h: tafelH, raster, spalten, zeilen, polster },
    herzenY: y + 20 + bildH + tafelH + 22,
    fahrkarte: { x: x + 18, y: y + 20 + bildH + tafelH + herzenH + 10, b: b - 36, h: fahrkarteH - 14 },
    weiter: art === 'halt' ? { x: x + 18, y: unten - 52, b: knopfB, h: 52 } : { x: layout.breite / 2 - 70, y: y + h - 66, b: 140, h: 66 },
    aussteigen: art === 'halt' ? { x: x + 18, y: unten - 52 - 58, b: knopfB, h: 52 } : null,
  };
}

function maleBahnsteig(stift, r, karte, t) {
  const halt = karte.art === 'halt' || karte.art === 'fehlt';
  stift.save();
  rundesRechteck(stift, r.x, r.y, r.b, r.h, 10);
  stift.clip();

  const himmel = stift.createLinearGradient(0, r.y, 0, r.y + r.h);
  himmel.addColorStop(0, '#0a101c');
  himmel.addColorStop(0.7, halt ? '#33293a' : '#18223a');
  himmel.addColorStop(1, halt ? '#5a4038' : '#1f2a44');
  stift.fillStyle = himmel;
  stift.fillRect(r.x, r.y, r.b, r.h);

  const boden = r.y + r.h * 0.76;
  // ferne Lichter am Horizont
  for (let i = 0; i < 9; i++) {
    const fx = r.x + ((i * 97 + 31) % 100) / 100 * r.b;
    const fy = boden - r.h * (0.05 + ((i * 37) % 10) / 100);
    stift.fillStyle = i % 3 === 0 ? 'rgba(255, 217, 160, 0.55)' : 'rgba(190, 210, 255, 0.35)';
    kreis(stift, fx, fy, 1.2);
    stift.fill();
  }

  if (halt) {
    // der Zug steht am Bahnsteig, die Fenster sind hell, die Tür ist offen
    const zx = r.x + r.b * 0.5;
    const zy = boden - r.h * 0.46;
    const zh = r.h * 0.43;
    stift.fillStyle = '#26314b';
    rundesRechteck(stift, zx, zy, r.b, zh, 10);
    stift.fill();
    stift.fillStyle = '#1a2236';
    stift.fillRect(zx, zy + zh - 8, r.b, 8);
    stift.fillStyle = FARBE.warm;
    for (let i = 0; i < 3; i++) {
      rundesRechteck(stift, zx + r.b * (0.2 + i * 0.13), zy + zh * 0.2, r.b * 0.09, zh * 0.3, 3);
      stift.fill();
    }
    const tuer = stift.createLinearGradient(0, zy, 0, zy + zh);
    tuer.addColorStop(0, '#fff1d6');
    tuer.addColorStop(1, FARBE.warm);
    stift.fillStyle = tuer;
    stift.fillRect(zx + r.b * 0.05, zy + zh * 0.16, r.b * 0.1, zh * 0.78);
    const schein = stift.createRadialGradient(zx + r.b * 0.1, boden, 0, zx + r.b * 0.1, boden, r.b * 0.3);
    schein.addColorStop(0, 'rgba(255, 217, 160, 0.4)');
    schein.addColorStop(1, 'rgba(255, 217, 160, 0)');
    stift.fillStyle = schein;
    stift.fillRect(r.x, boden - r.h * 0.3, r.b, r.h * 0.5);
  } else {
    // der Zug ist weitergefahren: zwei Schlusslichter in der Ferne
    stift.fillStyle = 'rgba(255, 122, 99, 0.8)';
    kreis(stift, r.x + r.b * 0.86, boden - 5, 1.5);
    stift.fill();
    kreis(stift, r.x + r.b * 0.88, boden - 5, 1.5);
    stift.fill();
  }

  // Bahnsteig mit weißer Linie
  stift.fillStyle = '#242b3b';
  stift.fillRect(r.x, boden, r.b, r.h);
  stift.fillStyle = '#343d52';
  stift.fillRect(r.x, boden, r.b, 3);
  stift.fillStyle = 'rgba(240, 236, 224, 0.75)';
  stift.fillRect(r.x, boden + r.h * 0.12, r.b, 2.5);

  // Laterne mit warmem Kegel
  const lx = r.x + r.b * 0.27;
  const kopf = r.y + r.h * 0.2;
  const flackern = karte.ruhig ? 1 : 0.96 + Math.sin(t * 0.7) * 0.04;
  stift.globalCompositeOperation = 'lighter';
  const kegel = stift.createLinearGradient(0, kopf, 0, boden);
  kegel.addColorStop(0, `rgba(255, 217, 160, ${0.42 * flackern})`);
  kegel.addColorStop(1, `rgba(255, 217, 160, ${0.06 * flackern})`);
  stift.fillStyle = kegel;
  stift.beginPath();
  stift.moveTo(lx + 6, kopf + 3);
  stift.lineTo(lx + 22, kopf + 3);
  stift.lineTo(lx + r.b * 0.36, boden + 4);
  stift.lineTo(lx - r.b * 0.16, boden + 4);
  stift.closePath();
  stift.fill();
  const fleck = stift.createRadialGradient(lx + r.b * 0.1, boden + 6, 0, lx + r.b * 0.1, boden + 6, r.b * 0.3);
  fleck.addColorStop(0, `rgba(255, 217, 160, ${0.3 * flackern})`);
  fleck.addColorStop(1, 'rgba(255, 217, 160, 0)');
  stift.fillStyle = fleck;
  stift.fillRect(r.x, boden, r.b, r.h * 0.24);
  stift.globalCompositeOperation = 'source-over';
  stift.strokeStyle = '#0d1119';
  stift.lineWidth = 3;
  stift.lineCap = 'round';
  stift.beginPath();
  stift.moveTo(lx, boden);
  stift.lineTo(lx, kopf);
  stift.lineTo(lx + 22, kopf);
  stift.stroke();
  stift.fillStyle = '#fff1d6';
  rundesRechteck(stift, lx + 6, kopf + 1, 16, 4, 2);
  stift.fill();

  // Bank, darauf ein Becher
  const bx = lx + r.b * 0.07;
  const bb = r.b * 0.2;
  stift.strokeStyle = '#0d1119';
  stift.lineWidth = 3;
  stift.beginPath();
  stift.moveTo(bx, boden - 13);
  stift.lineTo(bx + bb, boden - 13);
  stift.moveTo(bx + 4, boden - 13);
  stift.lineTo(bx + 4, boden);
  stift.moveTo(bx + bb - 4, boden - 13);
  stift.lineTo(bx + bb - 4, boden);
  stift.moveTo(bx, boden - 26);
  stift.lineTo(bx + bb, boden - 26);
  stift.stroke();
  stift.fillStyle = '#e9dcc0';
  stift.fillRect(bx + bb * 0.2, boden - 21, 5, 7);

  maleFigur(stift, 'spieler', lx + r.b * (halt ? 0.2 : 0.2) + bb * 0.42, boden + 3, 62, { t, takt: 0, ruhig: karte.ruhig, fluss: false });
  // am Halt steht der Schaffner am Zug: der Begleiter, jetzt mit Mütze
  if (halt) maleFigur(stift, 'kontrolleur', lx + r.b * 0.2 + bb * 0.42 + 46, boden + 3, 62, { t, takt: 3, ruhig: karte.ruhig, zeigt: { x: -1, y: 0 }, heben: karte.art === 'fehlt' ? 0.8 : 0 });

  if (halt) {
    // die Uhr am Bahnsteig zeigt die Ankunft
    stift.strokeStyle = '#0d1119';
    stift.lineWidth = 3;
    stift.beginPath();
    stift.moveTo(r.x + r.b * 0.12, boden);
    stift.lineTo(r.x + r.b * 0.12, r.y + r.h * 0.34);
    stift.stroke();
    maleUhr(stift, { x: r.x + r.b * 0.12, y: r.y + r.h * 0.26, r: 15 }, karte.minuten, 0);
  }
  stift.restore();
}

// Die Fahrkarte: oben die sechs Prüfungen, darunter Platz für Sonder-Lochungen.
// Eine helle Lochung ist ein Loch, durch das warmes Licht fällt, eine dunkle bleibt dunkel.
export function maleFahrkarteBild(stift, r, fahrkarte) {
  stift.fillStyle = '#e8dcc2';
  rundesRechteck(stift, r.x, r.y, r.b, r.h, 4);
  stift.fill();
  stift.fillStyle = '#d6c7a8';
  stift.fillRect(r.x + r.b * 0.82, r.y, 1.5, r.h);
  const breit = (r.b * 0.8) / PRUEFUNGEN.length;
  const g = Math.min(breit * 0.62, r.h * 0.5);
  PRUEFUNGEN.forEach((id, i) => {
    const cx = r.x + breit * (i + 0.5) + 2;
    const cy = r.y + r.h * 0.5;
    const gelocht = fahrkarte.lochungen.some((l) => l.art === 'pruefung' && l.id === id);
    maleSymbol(stift, id, cx, cy, g, gelocht ? '#8a7a5c' : '#b9a986');
    if (gelocht) maleLoch(stift, cx + g * 0.45, cy - g * 0.45, g * 0.22, true);
  });
  // Sonder-Lochungen rechts vom Strich, untereinander in zwei Spalten
  const sonder = fahrkarte.lochungen.filter((l) => l.art !== 'pruefung');
  sonder.forEach((l, i) => {
    const sx = r.x + r.b * 0.86 + (i % 2) * r.b * 0.07;
    const sy = r.y + r.h * (0.25 + Math.floor(i / 2) * 0.25);
    maleLoch(stift, sx + r.b * 0.02, sy, Math.min(r.h * 0.1, 5), l.hell);
  });
}

function maleKartenknopf(stift, k, text) {
  stift.fillStyle = '#1c2437';
  rundesRechteck(stift, k.x, k.y, k.b, k.h, 12);
  stift.fill();
  stift.strokeStyle = '#2f3a52';
  stift.lineWidth = 1;
  rundesRechteck(stift, k.x + 0.5, k.y + 0.5, k.b - 1, k.h - 1, 12);
  stift.stroke();
  const breit = Math.ceil(k.b / 2) - 4;
  const feld = neuesPunktfeld(breit, ZEILENHOEHE);
  schreibeMittig(feld, text, 0);
  zeichnePunktfeld(stift, feld, k.x + (k.b - breit * 2) / 2, k.y + (k.h - ZEILENHOEHE * 2) / 2, 2, FARBE.bernstein, null);
}

function maleLoch(stift, x, y, r, hell) {
  stift.fillStyle = hell ? FARBE.warm : '#1a1f2b';
  kreis(stift, x, y, r);
  stift.fill();
  stift.strokeStyle = 'rgba(0, 0, 0, 0.25)';
  stift.lineWidth = 1;
  stift.stroke();
}

// karte: { art, zeilen, herzen, herzenVoll, minuten, fahrkarte, einblenden 0..1, weg 0..1, ruhig }
export function maleKarte(stift, layout, karte, t) {
  const m = kartenMasse(layout, karte.art);
  const ein = sanft(karte.einblenden);
  const weg = karte.weg * karte.weg;
  stift.save();
  stift.fillStyle = `rgba(5, 7, 12, ${0.74 * ein * (1 - weg)})`;
  stift.fillRect(0, 0, layout.breite, layout.hoehe);
  stift.globalAlpha = ein;
  stift.translate(0, (1 - ein) * 28 - weg * (m.y + m.h + 20));

  stift.fillStyle = '#10141d';
  rundesRechteck(stift, m.x, m.y, m.b, m.h, 16);
  stift.fill();
  stift.strokeStyle = '#2a3346';
  stift.lineWidth = 1;
  rundesRechteck(stift, m.x + 0.5, m.y + 0.5, m.b - 1, m.h - 1, 16);
  stift.stroke();

  maleBahnsteig(stift, m.bild, karte, t);

  // Anzeige mit zwei Zeilen
  const tf = m.tafel;
  stift.fillStyle = FARBE.tafel;
  rundesRechteck(stift, tf.x, tf.y, tf.b, tf.h, 5);
  stift.fill();
  const feld = neuesPunktfeld(tf.spalten, tf.zeilen);
  // im Rückblick zeigt die Anzeige nacheinander die Tatsachen der Fahrkarte
  const zeilen = karte.rueckblickZeile || karte.zeilen;
  schreibeMittig(feld, zeilen[0] || '', 1);
  schreibeMittig(feld, zeilen[1] || '', ZEILENHOEHE + 3);
  zeichnePunktfeld(stift, feld, tf.x + tf.polster, tf.y + tf.polster, tf.raster, FARBE.bernstein, FARBE.bernsteinAus);

  if (karte.fahrkarte) maleFahrkarteBild(stift, m.fahrkarte, karte.fahrkarte);

  if (karte.art === 'halt') {
    const g = 17;
    const breite = karte.herzenVoll * (g + 6) - 6;
    maleHerzen(stift, layout.breite / 2 - breite / 2 - g * 0.1, m.herzenY, karte.herzen, karte.herzenVoll, 0, g);
  }

  // am Halt nach dem Rückblick: zwei Knöpfe; nach „Aussteigen" bleibt das Bild, wegwischen beginnt neu
  if (karte.art === 'halt' && karte.rueckblickZeile) {
    stift.restore();
    return;
  }
  if (karte.art === 'halt' && !karte.ausgestiegen) {
    maleKartenknopf(stift, m.aussteigen, karte.knopftexte.aussteigen);
    maleKartenknopf(stift, m.weiter, karte.knopftexte.nochEine);
    stift.restore();
    return;
  }
  // zwei Winkel nach oben: wegwischen
  const cx = layout.breite / 2;
  const wandern = karte.ruhig ? 0 : Math.sin(t * 2.2) * 3;
  stift.strokeStyle = FARBE.bernstein;
  stift.lineWidth = 3;
  stift.lineCap = 'round';
  stift.lineJoin = 'round';
  for (let i = 0; i < 2; i++) {
    const y = m.y + m.h - 40 + i * 11 - wandern;
    stift.globalAlpha = ein * (i === 0 ? 0.95 : 0.45);
    stift.beginPath();
    stift.moveTo(cx - 13, y + 8);
    stift.lineTo(cx, y);
    stift.lineTo(cx + 13, y + 8);
    stift.stroke();
  }
  stift.restore();
}
