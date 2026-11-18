// Wo auf dem Bildschirm was liegt. Alles in CSS-Pixeln, passt ab 360 x 600.

import { BREITE, HOEHE } from '../kern/feld.js';
import { ZEILENHOEHE } from './matrix.js';

export function berechneLayout(breite, hoehe) {
  const rand = 10;
  const nutzbar = Math.min(breite, 520);
  const links = Math.round((breite - nutzbar) / 2);
  const raster = nutzbar >= 380 ? 3 : 2.5;
  const polster = 6;
  const spalten = Math.floor((nutzbar - 2 * rand - 2 * polster) / raster);
  const zeilen = ZEILENHOEHE + 2;
  const tafel = {
    x: Math.round(links + (nutzbar - spalten * raster - 2 * polster) / 2),
    y: rand,
    b: spalten * raster + 2 * polster,
    h: Math.ceil(zeilen * raster + 2 * polster),
    raster,
    spalten,
    zeilen,
    polster,
  };
  const status = { x: tafel.x + 4, y: tafel.y + tafel.h + 8, b: tafel.b - 8, h: 20 };
  const leiste = 70; // unterer Streifen mit der Uhr
  const oben = status.y + status.h + 8;

  const s = Math.floor(Math.min((nutzbar - 44) / BREITE, (hoehe - oben - leiste) / (HOEHE + 0.64)));
  const wandOben = Math.round(s * 0.42);
  const wandUnten = Math.round(s * 0.22);
  const wandSeite = Math.max(7, Math.round(s * 0.14));
  const bodenB = s * BREITE;
  const bodenH = s * HOEHE;
  const luft = hoehe - oben - leiste - (wandOben + bodenH + wandUnten);
  const bodenX = Math.round((breite - bodenB) / 2);
  const bodenY = Math.round(oben + wandOben + Math.max(0, luft) / 2);

  return {
    breite,
    hoehe,
    s,
    tafel,
    status,
    boden: { x: bodenX, y: bodenY, b: bodenB, h: bodenH },
    rumpf: { x: bodenX - wandSeite, y: bodenY - wandOben, b: bodenB + 2 * wandSeite, h: wandOben + bodenH + wandUnten },
    wandOben,
    wandUnten,
    wandSeite,
    wagenlaenge: wandOben + bodenH + wandUnten + Math.round(s * 0.16), // Abstand von Wagen zu Wagen
    uhr: { x: Math.round(breite / 2), y: hoehe - 36, r: 27 },
    ton: { x: Math.round(links + nutzbar - 34), y: hoehe - 36, r: 24 },
  };
}

// Bildschirmpunkt -> Feld im Wagen, oder null
export function feldBei(layout, px, py) {
  const x = Math.floor((px - layout.boden.x) / layout.s);
  const y = Math.floor((py - layout.boden.y) / layout.s);
  if (x < 0 || x >= BREITE || y < -1 || y >= HOEHE) return null;
  return { x, y }; // y = -1 ist der Streifen der Tür
}
