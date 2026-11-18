// Was sich im Wagen nie bewegt, als fertige Bilder: Rumpf, Boden, Sitze, Türen, Zuganzeige.
// Vor den Fenstern ist nichts zu sehen, nur dunkles Glas.

import { SPALTEN, REIHEN, GANGSPALTE, ZIELTUER, SCHAFFNERSTART, istSitz } from '../kern/abteil.js';
import { FARBE, rundesRechteck } from '../../../../src/anzeige/formen.js';
import { neuesPunktfeld, schreibe, zeichnePunktfeld } from '../../../../src/anzeige/matrix.js';

function neueFlaeche(breite, hoehe, dichte) {
  const flaeche = document.createElement('canvas');
  flaeche.width = Math.max(1, Math.round(breite * dichte));
  flaeche.height = Math.max(1, Math.round(hoehe * dichte));
  const stift = flaeche.getContext('2d');
  stift.setTransform(dichte, 0, 0, dichte, 0, 0);
  return { flaeche, stift };
}

// Ein Sitz von oben, die Lehne steht am oberen Rand: Zwischen den Reihen kommt man nicht durch.
function malePlatz(stift, x, y, s) {
  const p = s * 0.09;
  stift.fillStyle = '#22304c';
  rundesRechteck(stift, x + p, y + p, s - 2 * p, s - 2 * p, s * 0.14);
  stift.fill();
  stift.fillStyle = '#2c3d61';
  rundesRechteck(stift, x + p * 1.9, y + s * 0.34, s - p * 3.8, s * 0.5, s * 0.1);
  stift.fill();
  stift.fillStyle = '#3a4f7b';
  rundesRechteck(stift, x + p * 1.5, y + p * 1.3, s - p * 3, s * 0.24, s * 0.09);
  stift.fill();
  stift.fillStyle = '#4a6193';
  rundesRechteck(stift, x + s * 0.36, y + p * 1.3, s * 0.28, s * 0.09, s * 0.04);
  stift.fill();
}

function maleWandfeld(stift, x, y, s) {
  stift.fillStyle = FARBE.wand;
  stift.fillRect(x, y, s, s);
  stift.fillStyle = FARBE.wandKante;
  stift.fillRect(x, y, s, s * 0.08);
  stift.fillStyle = FARBE.wandDunkel;
  stift.fillRect(x, y + s * 0.86, s, s * 0.14);
  stift.fillStyle = 'rgba(255, 255, 255, 0.04)';
  rundesRechteck(stift, x + s * 0.14, y + s * 0.24, s * 0.72, s * 0.46, s * 0.05);
  stift.fill();
}

// Eine Tür mit zwei Flügeln und kleinen Scheiben, quer über ein Gangfeld.
function maleFluegel(stift, x, y, s, hoch) {
  stift.fillStyle = FARBE.wandDunkel;
  stift.fillRect(x + s * 0.05, y, s * 0.9, hoch);
  stift.fillStyle = '#35415f';
  stift.fillRect(x + s * 0.09, y + 1, s * 0.4, hoch - 2);
  stift.fillRect(x + s * 0.51, y + 1, s * 0.4, hoch - 2);
  stift.fillStyle = FARBE.glas;
  stift.fillRect(x + s * 0.16, y + hoch * 0.2, s * 0.26, hoch * 0.45);
  stift.fillRect(x + s * 0.58, y + hoch * 0.2, s * 0.26, hoch * 0.45);
  stift.fillStyle = FARBE.glasGlanz;
  stift.fillRect(x + s * 0.18, y + hoch * 0.26, 1.5, hoch * 0.3);
  stift.fillRect(x + s * 0.6, y + hoch * 0.26, 1.5, hoch * 0.3);
}

// Der Wagen als fertiges Bild. Der Ursprung ist die linke obere Ecke des Rumpfs.
export function maleAbteil(masse, dichte) {
  const { rumpf, boden, s, wandSeite } = masse;
  const { flaeche, stift } = neueFlaeche(rumpf.b, rumpf.h, dichte);
  const bx = boden.x - rumpf.x;
  const by = boden.y - rumpf.y;

  stift.fillStyle = FARBE.wand;
  rundesRechteck(stift, 0, 0, rumpf.b, rumpf.h, s * 0.2);
  stift.fill();
  stift.fillStyle = FARBE.wandKante;
  rundesRechteck(stift, 0, 0, rumpf.b, s * 0.1, s * 0.2);
  stift.fill();

  // Fenster: neben jeder Sitzreihe eines, dahinter nur Nacht
  for (let y = 1; y <= REIHEN - 2; y++) {
    for (const fx of [2, rumpf.b - wandSeite + 2]) {
      stift.fillStyle = FARBE.glas;
      rundesRechteck(stift, fx, by + (y + 0.1) * s, wandSeite - 4, s * 0.8, 3);
      stift.fill();
      stift.fillStyle = FARBE.glasGlanz;
      stift.fillRect(fx + 1.5, by + (y + 0.2) * s, 1.5, s * 0.25);
    }
  }

  stift.fillStyle = FARBE.boden;
  stift.fillRect(bx, by, boden.b, boden.h);
  for (let y = 0; y < REIHEN; y++) {
    for (let x = 0; x < SPALTEN; x++) {
      const px = bx + x * s;
      const py = by + y * s;
      if (x !== GANGSPALTE && !istSitz(x, y)) {
        maleWandfeld(stift, px, py, s);
        continue;
      }
      stift.fillStyle = FARBE.feld;
      rundesRechteck(stift, px + 1.5, py + 1.5, s - 3, s - 3, s * 0.1);
      stift.fill();
      stift.fillStyle = FARBE.feldKante;
      rundesRechteck(stift, px + 1.5, py + 1.5, s - 3, 2, 1);
      stift.fill();
      if (istSitz(x, y)) malePlatz(stift, px, py, s);
    }
  }

  // oben die Zieltür, unten die Tür, durch die der Schaffner kam
  maleFluegel(stift, bx + ZIELTUER.x * s, by + ZIELTUER.y * s, s, s * 0.3);
  maleFluegel(stift, bx + SCHAFFNERSTART.x * s, by + (SCHAFFNERSTART.y + 1) * s - s * 0.2, s, s * 0.2);
  return flaeche;
}

// Eine Tafel in Punktmatrix: dunkler Grund, bernsteinfarbene Punkte.
// zeilen: Liste von { text, spalte, zeile } in Punkten. Gibt ein fertiges Bild zurück.
export function malePunkttafel(tafel, zeilen, dichte, mitRand) {
  const { flaeche, stift } = neueFlaeche(tafel.b, tafel.h, dichte);
  stift.fillStyle = FARBE.tafel;
  rundesRechteck(stift, 0, 0, tafel.b, tafel.h, 5);
  stift.fill();
  if (mitRand) {
    stift.strokeStyle = FARBE.tafelRand;
    stift.lineWidth = 1;
    rundesRechteck(stift, 0.5, 0.5, tafel.b - 1, tafel.h - 1, 5);
    stift.stroke();
  }
  const feld = neuesPunktfeld(tafel.spalten, tafel.zeilen);
  for (const z of zeilen) schreibe(feld, z.text, z.spalte, z.zeile);
  zeichnePunktfeld(stift, feld, tafel.polster, tafel.polster, tafel.raster, FARBE.bernstein, FARBE.bernsteinAus);
  return flaeche;
}
