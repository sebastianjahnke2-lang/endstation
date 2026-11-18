// Wo auf dem Bildschirm was liegt. Alles in CSS-Pixeln, passt ab 360 x 600.
// Reine Rechnung ohne Browser, damit Tests sie prüfen können.
//
// Von oben nach unten: Zuganzeige mit Lautsprecher, der Wagen, darunter die Daumenzone
// mit Fahrkarte (links) und dem Knopf "Warten" (rechts). Unter der Daumenzone bleibt derselbe
// Abstand frei wie im Hauptspiel unter dem untersten Feld: Dort sitzen beim iPhone die Leiste
// von Safari und der Home-Balken. Breite und Höhe sind die des Canvas, also schon ohne Notch und Balken.

import { SPALTEN, REIHEN, LAMPEN } from '../kern/abteil.js';
import { lichtrichtung } from '../kern/licht.js';
import { ZEILENHOEHE, ZEICHENBREITE, textBreite } from '../../../../src/anzeige/matrix.js';
import { PLATZTEXTE } from '../texte.js';

export const FREI_UNTEN = 26; // so viel bleibt unter der Daumenzone frei
export const WARTEKNOPF = 64; // kleinste Höhe und Breite des Knopfs "Warten"
export const TIPPFLAECHE = 48; // kleinste Trefferfläche für alles andere
export const LAMPENARM = 0.88; // Länge des Lampenarms in Feldern

export function berechneMasse(breite, hoehe) {
  const rand = 10;
  const nutzbar = Math.min(breite, 520);
  const links = Math.round((breite - nutzbar) / 2);
  const raster = nutzbar >= 380 ? 3 : 2.5;
  const polster = 6;
  const tonBreite = 44; // Platz für den Lautsprecher rechts neben der Anzeige
  const spalten = Math.floor((nutzbar - 2 * rand - tonBreite - 2 * polster) / raster);
  const zeilen = ZEILENHOEHE + 2;
  const tafel = {
    x: links + rand,
    y: rand,
    b: spalten * raster + 2 * polster,
    h: Math.ceil(zeilen * raster + 2 * polster),
    raster,
    spalten,
    zeilen,
    polster,
  };
  const ton = { x: Math.round(links + nutzbar - rand - tonBreite / 2 + 4), y: Math.round(tafel.y + tafel.h / 2), r: TIPPFLAECHE / 2 };
  const oben = tafel.y + tafel.h + 8;

  // Daumenzone
  const zoneH = Math.max(WARTEKNOPF, Math.min(84, Math.round(hoehe * 0.11)));
  const zoneY = hoehe - FREI_UNTEN - zoneH;

  // der Wagen dazwischen, so groß wie möglich
  const platz = zoneY - 8 - oben;
  const s = Math.max(12, Math.floor(Math.min((nutzbar - 16) / (SPALTEN + 0.4), platz / (REIHEN + 0.2))));
  const wandSeite = Math.round(s * 0.2);
  const kante = Math.round(s * 0.1);
  const bodenB = s * SPALTEN;
  const bodenH = s * REIHEN;
  const luft = Math.max(0, platz - (bodenH + 2 * kante));
  const bodenX = Math.round((breite - bodenB) / 2);
  const bodenY = Math.round(oben + kante + luft * 0.6); // auf hohen Bildschirmen näher am Daumen

  const knopfB = Math.max(WARTEKNOPF, Math.ceil(textBreite(PLATZTEXTE.spiel.warten) * raster + 28));
  const warten = { x: links + nutzbar - rand - knopfB, y: zoneY, b: knopfB, h: zoneH, raster };
  const karte = { x: links + rand, y: zoneY, b: Math.min(170, warten.x - (links + rand) - 14), h: zoneH };

  return {
    breite,
    hoehe,
    s,
    tafel,
    ton,
    boden: { x: bodenX, y: bodenY, b: bodenB, h: bodenH },
    rumpf: { x: bodenX - wandSeite, y: bodenY - kante, b: bodenB + 2 * wandSeite, h: bodenH + 2 * kante },
    wandSeite,
    kante,
    zone: { x: links + rand, y: zoneY, b: nutzbar - 2 * rand, h: zoneH },
    karte,
    warten,
  };
}

// Bildschirmpunkt -> Feld im Wagen, oder null
export function feldAn(masse, px, py) {
  const x = Math.floor((px - masse.boden.x) / masse.s);
  const y = Math.floor((py - masse.boden.y) / masse.s);
  if (x < 0 || x >= SPALTEN || y < 0 || y >= REIHEN) return null;
  return { x, y };
}

// Mitte eines Feldes auf dem Bildschirm
export function feldMitte(masse, x, y) {
  return { x: masse.boden.x + (x + 0.5) * masse.s, y: masse.boden.y + (y + 0.5) * masse.s };
}

// Die Lampe sitzt auf der Lehne zwischen den beiden Sitzen ihres Paares. Ihr Arm schwenkt
// zur einen oder anderen Seite. Der Kopf sitzt auf der Seite, von der das Licht kommt.
export function lampenGelenk(masse, name) {
  const lampe = LAMPEN[name];
  return {
    x: masse.boden.x + (Math.min(lampe.gangplatz, lampe.fensterplatz) + 1) * masse.s,
    y: masse.boden.y + lampe.reihe * masse.s + masse.s * 0.09,
  };
}

export function lampenKopf(masse, name, stellung) {
  const gelenk = lampenGelenk(masse, name);
  return { x: gelenk.x - lichtrichtung(name, stellung) * LAMPENARM * masse.s, y: gelenk.y };
}

export function lampenRadius(masse) {
  return Math.max(TIPPFLAECHE / 2, masse.s * 0.44);
}

// Welche Lampe liegt unter dem Finger? stellungen: { A: 'fenster' | 'gang', B: ... }
export function lampeAn(masse, stellungen, px, py) {
  const r = lampenRadius(masse);
  for (const name of Object.keys(LAMPEN)) {
    const kopf = lampenKopf(masse, name, stellungen[name]);
    if (Math.hypot(px - kopf.x, py - kopf.y) <= r) return name;
  }
  return null;
}

// Die Anzeige nach der Tür: Tafel mit bis zu vier Zeilen, darunter die Karte und der Knopf "Neue Fahrt".
export const ENDZEILEN = 4;

export function endeMasse(masse) {
  const b = Math.min(masse.breite - 32, 400);
  const x = Math.round((masse.breite - b) / 2);
  const raster = b >= 360 ? 3 : 2.5;
  const polster = 6;
  const spalten = Math.floor((b - 16 - 2 * polster) / raster);
  const zeilen = ENDZEILEN * ZEILENHOEHE + (ENDZEILEN - 1) * 2;
  const tafelH = Math.ceil(zeilen * raster + 2 * polster);
  const karteH = 96;
  const karteB = Math.min(210, b - 60);
  const knopfB = Math.ceil(textBreite(PLATZTEXTE.spiel.neueFahrt) * raster + 32);
  const h = 8 + tafelH + 16 + karteH + 18 + WARTEKNOPF + 12;
  const y = Math.max(6, Math.round((masse.hoehe - FREI_UNTEN - h) / 2));
  return {
    x,
    y,
    b,
    h,
    tafel: { x: x + 8, y: y + 8, b: b - 16, h: tafelH, raster, spalten, zeilen, polster },
    karte: { x: Math.round(masse.breite / 2 - karteB / 2), y: y + 8 + tafelH + 16, b: karteB, h: karteH },
    knopf: { x: Math.round(masse.breite / 2 - knopfB / 2), y: y + 8 + tafelH + 16 + karteH + 18, b: knopfB, h: WARTEKNOPF, raster },
  };
}

// Das Testprotokoll: eine dunkle Tafel über dem Bild, kleine Schrift.
export function protokollMasse(masse) {
  const raster = 2;
  const b = Math.min(masse.breite - 24, 420);
  const zeichen = Math.floor((b - 24) / raster / ZEICHENBREITE);
  return { x: Math.round((masse.breite - b) / 2), y: 12, b, raster, zeichen, zeilenhoehe: (ZEILENHOEHE + 2) * raster, polster: 12 };
}

export function imKasten(kasten, px, py) {
  return px >= kasten.x && px <= kasten.x + kasten.b && py >= kasten.y && py <= kasten.y + kasten.h;
}
