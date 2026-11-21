// Die Bühne des Prototyps "Kontrolle": zeichnet den Wagen und spielt die Ereignisse des Kerns ab.
// Geliehen aus "Der freie Platz": Aufteilung (masse.js), Wagenbild (abteilbild.js), Schaffner mit Zange
// und Schlafender (gestalten.js), Punktmatrix. Die Bühne entscheidet nie über Regeln.
//
// Die Zuganzeige zeigt keine Zahl, sondern die Strecke bis zur nächsten Station und ihren Namen: Der Zug
// rückt mit jedem Zug näher. Rechts daneben drei Haken mit Mützen, für jeden Entkommenen verschwindet eine.
// Unten links die Linie: erreichte Stationen, die nächste, und die weiteste je erreichte (gemerkt).
// An zwei Stellen hält das Bild kurz an (Leitsatz 5): beim Fang und wenn der Zug hält. Danach schiebt sich
// der nächste Halt von selbst herein, ohne Eingabe.

import { berechneMasse, feldAn, feldMitte, imKasten } from '../../../freier-platz/src/anzeige/masse.js';
import { maleAbteil, malePunkttafel } from '../../../freier-platz/src/anzeige/abteilbild.js';
import { maleSchaffner, maleSchlaefer, maleTonschalter } from '../../../freier-platz/src/anzeige/gestalten.js';
import { FARBE, rundesRechteck, begrenze, sanft, hinUndHer } from '../../../../src/anzeige/formen.js';
import { neuesPunktfeld, schreibe, zeichnePunktfeld, textBreite, ZEILENHOEHE } from '../../../../src/anzeige/matrix.js';
import { maleFahrgastKoerper, maleHochgehalten, maleGelocht, FAHRGASTFARBEN } from './figuren.js';
import { KONTROLLGANG } from '../kern/kontrolle.js';
import { ZUEGE_BIS_HALT } from '../kern/halte.js';
import { KONTROLLTEXTE, stationsName } from '../texte.js';

export const FANG_PAUSE = 650; // so lange steht das Bild nach dem Fang still und nimmt nichts an
export const HALT_PAUSE = 700; // ebenso, wenn der Zug hält und er ausgestiegen ist
const FELDZEIT = 95; // ein Feld Weg für einen Fahrgast, der den Platz wechselt

export function erzeugeKontrollBuehne(leinwand) {
  const stift = leinwand.getContext('2d');
  const ruhig = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;
  let masse = null;
  let dichte = 1;
  let z = null;
  let abteil = null;
  let tonAn = true;
  let laeufer = []; // { start, dauer, schritt }
  let gesperrtBis = 0; // das Bild hält an
  let schluss = null; // { zeilen, bild, start }
  let weiteste = -1; // die weiteste je erreichte Station, aus dem Speicher
  const wirkung = { warten: -1e9, fang: -1e9, halt: -1e9 };
  const melder = { klang: null, station: null };
  const bild = { k: { py: 7, blick: 'hoch', zeigt: null, streck: 0, offen: 1 }, fg: [], strecke: ZUEGE_BIS_HALT, gesamt: ZUEGE_BIS_HALT, station: 0, lernhalt: false, muetzen: [1, 1, 1], wc: 0 };

  function klinge(name) {
    if (melder.klang) melder.klang(name);
  }

  function passeAn() {
    const breite = Math.max(200, leinwand.clientWidth || window.innerWidth);
    const hoehe = Math.max(240, leinwand.clientHeight || window.innerHeight);
    dichte = Math.min(window.devicePixelRatio || 1, 2.5);
    leinwand.width = Math.round(breite * dichte);
    leinwand.height = Math.round(hoehe * dichte);
    masse = berechneMasse(breite, hoehe);
    abteil = maleAbteil(masse, dichte);
    if (schluss) schluss.bild = null;
  }

  // Bild und Zustand in Deckung bringen
  function gleicheAb() {
    bild.k.py = z.k.y;
    bild.k.blick = z.k.blick;
    bild.k.zeigt = null;
    bild.k.streck = 0;
    bild.k.offen = 1;
    bild.strecke = z.rest;
    bild.gesamt = z.zuegeGesamt || ZUEGE_BIS_HALT;
    bild.station = z.halt;
    bild.lernhalt = !!z.lernhalt;
    bild.muetzen = [0, 1, 2].map((i) => (i < 3 - (z.entkommen || 0) ? 1 : 0));
    bild.wc = z.fahrgaeste.some((f) => f.ort === 'wc' && !f.gefangen) ? 1 : 0;
    bild.fg = z.fahrgaeste.map((f) => ({
      farbe: f.farbe,
      kopf: 0,
      px: f.x,
      py: f.y,
      steht: 0,
      zuck: 0,
      karte: 0,
      gelocht: f.kontrolliert ? 1 : 0,
      wach: f.schlaeft ? 0 : 1,
      da: f.ort === 'wc' || (z.status === 'entkommen' && f.schwarz && !f.gefangen) ? 0 : 1,
      gefangen: f.gefangen,
    }));
  }

  function bewege(start, dauer, schritt) {
    laeufer.push({ start, dauer, schritt });
  }

  // Zeigt eine Liste von Ereignissen nacheinander. Gibt zurück, wie lange es dauert.
  function spiele(ereignisse, zustand, jetzt) {
    z = zustand;
    let t = jetzt;
    for (const e of ereignisse) t += zeige(e, t);
  }

  function zeige(e, t) {
    const k = bild.k;
    if (e.typ === 'neuerHalt') {
      // der nächste Halt schiebt sich herein, sobald das Bild nicht mehr anhält
      bewege(Math.max(t, gesperrtBis), 1, () => {
        schluss = null;
        gleicheAb();
      });
      return 0;
    }
    if (e.typ === 'gelernt') return 0;
    if (e.typ === 'station') {
      // Station erreicht. Für jeden Entkommenen verschwindet eine Mütze.
      bewege(t, 1, () => {
        if (melder.station) melder.station(e.nr);
      });
      for (let i = 0; i < 3; i++) {
        if (i < 3 - e.entkommen || bild.muetzen[i] < 1) continue;
        bewege(t, 500, (p) => {
          bild.muetzen[i] = 1 - sanft(p);
        });
      }
      return 0;
    }
    if (e.typ === 'aus') {
      // Ende der Schicht: nur der Name der letzten erreichten Station
      schluss = { zeilen: [stationsName(e.station)], bild: null, start: Math.max(t, gesperrtBis) };
      return 0;
    }
    if (e.typ === 'kopfHoch') {
      const f = bild.fg[e.nr];
      bewege(t, 520, (p) => {
        f.kopf = hinUndHer(p);
      });
      return 120;
    }
    if (e.typ === 'toilette' || e.typ === 'zurueck') {
      const f = bild.fg[e.nr];
      const pfad = e.pfad;
      const weg = (pfad.length - 1) * FELDZEIT;
      const hin = e.typ === 'toilette';
      bewege(t, 1, () => {
        f.da = 1;
        if (!hin) bild.wc = 0;
        f.px = pfad[0].x;
        f.py = pfad[0].y;
      });
      bewege(t, 120, (p) => {
        f.steht = hin ? sanft(p) : 1;
      });
      bewege(t + 120, weg, (p) => {
        const stelle = p * (pfad.length - 1);
        const i = Math.min(pfad.length - 2, Math.floor(stelle));
        const q = stelle - i;
        f.px = pfad[i].x + (pfad[i + 1].x - pfad[i].x) * q;
        f.py = pfad[i].y + (pfad[i + 1].y - pfad[i].y) * q;
      });
      bewege(t + 120 + weg, 160, (p) => {
        if (hin) {
          f.da = 1 - p; // hinter der Tür
          if (p >= 1) bild.wc = 1;
        } else {
          f.steht = 1 - sanft(p);
        }
      });
      return 120 + weg + 160;
    }
    if (e.typ === 'schritt') {
      bewege(t, 140, (p) => {
        k.py = e.von + (e.nach - e.von) * sanft(p);
        if (p > 0) k.blick = e.nach < e.von ? 'hoch' : 'runter';
      });
      bewege(t, 1, () => klinge('schritt'));
      return 140;
    }
    if (e.typ === 'warten') {
      wirkung.warten = t;
      return 60;
    }
    if (e.typ === 'strecke') {
      const von = e.rest + 1;
      bewege(t, 220, (p) => {
        bild.strecke = von - sanft(p);
      });
      return 0;
    }
    if (e.typ === 'kontrolle' || e.typ === 'gefangen') {
      const f = bild.fg[e.nr];
      if (e.tuer) {
        // er kommt aus der Toilette, und der Kontrolleur steht davor
        bewege(t, 1, () => {
          bild.wc = 0;
          f.da = 1;
          f.steht = 1;
          f.px = e.x;
          f.py = e.y + 0.15;
        });
      }
      const ziel = feldMitte(masse, e.x, e.y);
      const zeigt = { x: ziel.x, y: ziel.y - masse.s * 0.12 };
      const gefangen = e.typ === 'gefangen';
      const weck = e.schlief ? 320 : 0;
      if (e.schlief) {
        bewege(t, weck, (p) => {
          f.wach = sanft(p);
        });
      }
      const dauer = gefangen ? 260 : 380;
      bewege(t + weck, dauer, (p) => {
        k.zeigt = zeigt;
        k.blick = e.x < KONTROLLGANG ? 'links' : 'rechts';
        k.streck = p < 0.4 ? sanft(p / 0.4) : gefangen ? 1 : 1 - sanft((p - 0.7) / 0.3) * (p > 0.7 ? 1 : 0);
        k.offen = p < 0.45 ? 1 : gefangen ? 0 : p < 0.65 ? 0 : 1;
        if (!gefangen) f.karte = p < 0.2 ? p / 0.2 : p > 0.75 ? 1 - (p - 0.75) / 0.25 : 1;
        if (!gefangen && p >= 0.55) f.gelocht = 1;
        if (p >= 1 && !gefangen) {
          k.zeigt = null;
          k.streck = 0;
        }
      });
      bewege(t + weck + dauer * 0.45, 1, () => klinge(gefangen ? 'fang' : 'knips'));
      if (gefangen) {
        // die Zange schnappt zu, das Bild hält an
        bewege(t + weck + dauer * 0.45, 1, () => {
          wirkung.fang = t + weck + dauer * 0.45;
          f.gefangen = true;
        });
        gesperrtBis = Math.max(gesperrtBis, t + weck + dauer + FANG_PAUSE);
      }
      return weck + dauer;
    }
    if (e.typ === 'zuckt') {
      const f = bild.fg[e.nr];
      bewege(t, 320, (p) => {
        f.zuck = hinUndHer(p);
      });
      return 160;
    }
    if (e.typ === 'wechselt') {
      const f = bild.fg[e.nr];
      const pfad = e.pfad;
      const weg = (pfad.length - 1) * FELDZEIT;
      bewege(t, 120, (p) => {
        f.steht = sanft(p);
      });
      bewege(t + 120, weg, (p) => {
        const stelle = p * (pfad.length - 1);
        const i = Math.min(pfad.length - 2, Math.floor(stelle));
        const q = stelle - i;
        f.px = pfad[i].x + (pfad[i + 1].x - pfad[i].x) * q;
        f.py = pfad[i].y + (pfad[i + 1].y - pfad[i].y) * q;
      });
      bewege(t + 120 + weg, 120, (p) => {
        f.steht = 1 - sanft(p);
      });
      return 120 + weg + 120;
    }
    if (e.typ === 'halt') {
      // Türzischen, er steht auf und steigt aus, das Bild hält an
      const f = bild.fg[e.nr];
      const pfad = e.pfad.length > 1 ? e.pfad : [e.pfad[0], e.pfad[0]];
      const weg = (pfad.length - 1) * FELDZEIT;
      if (e.ausWc) {
        bewege(t, 1, () => {
          bild.wc = 0;
          f.da = 1;
          f.px = pfad[0].x;
          f.py = pfad[0].y;
        });
      }
      bewege(t, 1, () => {
        wirkung.halt = t;
        klinge('zischen');
      });
      bewege(t + 150, 140, (p) => {
        f.steht = sanft(p);
      });
      bewege(t + 290, weg, (p) => {
        const stelle = p * (pfad.length - 1);
        const i = Math.min(pfad.length - 2, Math.floor(stelle));
        const q = stelle - i;
        f.px = pfad[i].x + (pfad[i + 1].x - pfad[i].x) * q;
        f.py = pfad[i].y + (pfad[i + 1].y - pfad[i].y) * q;
      });
      bewege(t + 290 + weg, 220, (p) => {
        f.da = 1 - p;
      });
      gesperrtBis = Math.max(gesperrtBis, t + 510 + weg + HALT_PAUSE);
      return 510 + weg;
    }
    return 0;
  }

  // Eine Eingabe kürzt alles ab, was noch läuft. Während das Bild anhält, geht das nicht.
  function beschleunige(jetzt) {
    if (jetzt < gesperrtBis) return false;
    for (const l of laeufer) l.schritt(1);
    laeufer = [];
    if (z) gleicheAb();
    if (schluss) schluss.start = Math.min(schluss.start, jetzt);
    return true;
  }

  function neu(zustand) {
    z = zustand;
    laeufer = [];
    schluss = null;
    gleicheAb();
  }

  // ---------------------------------------------------------------- Zeichnen

  // Platz für die drei Haken rechts neben der Anzeige
  function hakenBreite() {
    return Math.round(masse.tafel.raster * 21);
  }

  // Die Strecke in der Zuganzeige: links der Zug, dann die Gleise, die übrig sind, der Mast der Station
  // und ihr Name. Im Lernhalt ohne Namen.
  function maleStrecke() {
    const { tafel } = masse;
    const b = tafel.b - hakenBreite();
    const spalten = Math.floor((b - 2 * tafel.polster) / tafel.raster);
    const feld = neuesPunktfeld(spalten, tafel.zeilen);
    const an = (x, y) => {
      if (x >= 0 && x < feld.spalten && y >= 0 && y < feld.zeilen) feld.an[y * feld.spalten + x] = 1;
    };
    const name = bild.lernhalt ? '' : stationsName(bild.station);
    const nameBreit = name ? textBreite(name) : 0;
    const mast = feld.spalten - nameBreit - (name ? 4 : 3);
    const gleis = feld.zeilen - 3;
    for (let y = 1; y <= gleis; y++) an(mast, y);
    an(mast - 1, 1);
    an(mast + 1, 1);
    if (name) schreibe(feld, name, mast + 3, 1);
    // der Zug rückt vor
    const weit = Math.max(0, mast - 12);
    const vorn = Math.round(1 + 7 + weit * (1 - begrenze(bild.strecke, 0, bild.gesamt) / bild.gesamt));
    for (let x = vorn - 7; x <= vorn; x++) for (let y = gleis - 3; y <= gleis; y++) an(x, y);
    feld.an[(gleis - 2) * feld.spalten + vorn - 5] = 0;
    feld.an[(gleis - 2) * feld.spalten + vorn - 2] = 0;
    for (let x = vorn + 2; x < mast; x += 2) an(x, gleis + 1);
    stift.fillStyle = FARBE.tafel;
    rundesRechteck(stift, tafel.x, tafel.y, b, tafel.h, 5);
    stift.fill();
    stift.strokeStyle = FARBE.tafelRand;
    stift.lineWidth = 1;
    rundesRechteck(stift, tafel.x + 0.5, tafel.y + 0.5, b - 1, tafel.h - 1, 5);
    stift.stroke();
    zeichnePunktfeld(stift, feld, tafel.x + tafel.polster, tafel.y + tafel.polster, tafel.raster, FARBE.bernstein, FARBE.bernsteinAus);
  }

  // Drei Haken neben der Anzeige, an jedem eine Mütze. Für jeden Entkommenen verschwindet eine.
  function maleHaken() {
    const { tafel } = masse;
    const breit = hakenBreite();
    const x0 = tafel.x + tafel.b - breit + 6;
    const abstand = (breit - 8) / 3;
    const oben = tafel.y + 4;
    stift.strokeStyle = '#5b6680';
    stift.lineWidth = 2;
    stift.lineCap = 'round';
    stift.beginPath();
    stift.moveTo(x0, oben);
    stift.lineTo(x0 + abstand * 3 - 4, oben);
    stift.stroke();
    for (let i = 0; i < 3; i++) {
      const cx = x0 + abstand * (i + 0.5) - 2;
      stift.strokeStyle = '#5b6680';
      stift.beginPath();
      stift.moveTo(cx, oben);
      stift.lineTo(cx, oben + 5);
      stift.arc(cx + 2.5, oben + 5, 2.5, Math.PI, 0, true);
      stift.stroke();
      const da = bild.muetzen[i];
      if (da <= 0.01) continue;
      // die Mütze des Kontrolleurs: Kuppe, rotes Band, Schirm
      const r = Math.min(abstand * 0.42, tafel.h * 0.32);
      const my = oben + 8 + r + (1 - da) * 8;
      stift.save();
      stift.globalAlpha = da;
      stift.fillStyle = '#1f2e5e';
      stift.beginPath();
      stift.arc(cx, my, r, Math.PI, 0);
      stift.closePath();
      stift.fill();
      stift.fillStyle = '#d2553f';
      rundesRechteck(stift, cx - r * 1.02, my - r * 0.12, r * 2.04, r * 0.36, r * 0.1);
      stift.fill();
      stift.fillStyle = '#0d1322';
      rundesRechteck(stift, cx - r * 0.85, my + r * 0.22, r * 1.7, r * 0.26, r * 0.12);
      stift.fill();
      stift.restore();
    }
  }

  // Die Linie unten links: Stationen als Punkte, erreichte hell, die nächste als Ring,
  // über der weitesten je erreichten eine kleine Fahne. Liegt sie weiter rechts, steht die Fahne am Ende.
  function maleLinie() {
    if (bild.lernhalt) return;
    const kasten = masse.karte;
    const anzahl = 6;
    const erste = Math.max(0, bild.station - 2);
    const y = kasten.y + kasten.h * 0.62;
    const x0 = kasten.x + 10;
    const abstand = (kasten.b - 20) / (anzahl - 1);
    stift.strokeStyle = FARBE.bernsteinAus;
    stift.lineWidth = 3;
    stift.lineCap = 'round';
    stift.beginPath();
    stift.moveTo(x0, y);
    stift.lineTo(x0 + abstand * (anzahl - 1), y);
    stift.stroke();
    stift.strokeStyle = FARBE.bernstein;
    stift.beginPath();
    stift.moveTo(x0, y);
    stift.lineTo(x0 + abstand * Math.max(0, bild.station - erste), y);
    stift.stroke();
    for (let i = 0; i < anzahl; i++) {
      const nr = erste + i;
      const x = x0 + abstand * i;
      stift.beginPath();
      stift.arc(x, y, nr === bild.station ? 6 : 4.5, 0, Math.PI * 2);
      if (nr < bild.station) {
        stift.fillStyle = FARBE.bernstein;
        stift.fill();
      } else if (nr === bild.station) {
        stift.fillStyle = FARBE.nacht;
        stift.fill();
        stift.strokeStyle = FARBE.bernstein;
        stift.lineWidth = 2.5;
        stift.stroke();
      } else {
        stift.fillStyle = FARBE.bernsteinAus;
        stift.fill();
      }
    }
    if (weiteste < 0) return;
    const fahneNr = Math.min(weiteste, erste + anzahl - 1);
    if (weiteste < erste) return;
    const fx = x0 + abstand * (fahneNr - erste);
    const fy = y - 9;
    stift.strokeStyle = FARBE.bernstein;
    stift.lineWidth = 1.5;
    stift.beginPath();
    stift.moveTo(fx, fy);
    stift.lineTo(fx, fy - 14);
    stift.stroke();
    stift.fillStyle = FARBE.bernstein;
    stift.beginPath();
    stift.moveTo(fx, fy - 14);
    stift.lineTo(fx + (weiteste > fahneNr ? 10 : 8), fy - 10.5);
    stift.lineTo(fx, fy - 7);
    stift.closePath();
    stift.fill();
  }

  function maleKnopf(kasten, text, gedrueckt) {
    const d = gedrueckt * 2;
    stift.fillStyle = '#0b0e15';
    rundesRechteck(stift, kasten.x, kasten.y + 3, kasten.b, kasten.h - 3, 12);
    stift.fill();
    stift.fillStyle = gedrueckt > 0.01 ? '#2a3550' : '#1c2437';
    rundesRechteck(stift, kasten.x, kasten.y + d, kasten.b, kasten.h - 4, 12);
    stift.fill();
    stift.strokeStyle = '#3a4666';
    stift.lineWidth = 1;
    rundesRechteck(stift, kasten.x + 0.5, kasten.y + d + 0.5, kasten.b - 1, kasten.h - 5, 12);
    stift.stroke();
    const breit = textBreite(text);
    const feld = neuesPunktfeld(breit, ZEILENHOEHE);
    schreibe(feld, text, 0, 0);
    zeichnePunktfeld(stift, feld, kasten.x + (kasten.b - breit * kasten.raster) / 2, kasten.y + d + (kasten.h - 4 - 7 * kasten.raster) / 2, kasten.raster, FARBE.bernstein, null);
  }

  // Wo die Schlusszeile steht: eine Tafel in der Mitte des Wagens
  function schlussKasten() {
    const raster = masse.tafel.raster;
    const spalten = Math.max(...schluss.zeilen.map(textBreite)) + 8;
    const zeilen = ZEILENHOEHE + 4;
    const b = spalten * raster + 12;
    const h = zeilen * raster + 12;
    return { x: Math.round((masse.breite - b) / 2), y: Math.round(masse.boden.y + masse.boden.h / 2 - h / 2), b, h, raster, spalten, zeilen, polster: 6 };
  }

  function maleWelt(jetzt) {
    const { s, boden, rumpf } = masse;
    stift.drawImage(abteil, rumpf.x, rumpf.y, rumpf.b, rumpf.h);
    // die Toilette vorn: eine kleine Lampe über der Tür, grün frei, rot besetzt
    stift.fillStyle = bild.wc > 0.5 ? '#e8402f' : '#2f6b45';
    stift.beginPath();
    stift.arc(boden.x + (KONTROLLGANG + 0.82) * s, boden.y + s * 0.16, Math.max(3, s * 0.06), 0, Math.PI * 2);
    stift.fill();
    // Türzischen am Halt: die Türen leuchten kurz auf
    const tuer = begrenze(1 - (jetzt - wirkung.halt) / 900, 0, 1);
    if (tuer > 0) {
      stift.fillStyle = `rgba(255, 217, 160, ${0.28 * tuer})`;
      stift.fillRect(boden.x + KONTROLLGANG * s, boden.y, s, s * 0.35);
      stift.fillRect(boden.x + KONTROLLGANG * s, boden.y + 7.65 * s, s, s * 0.35);
    }
    // von oben nach unten malen, damit Weiter-unten-Sitzende davor stehen
    const figuren = [];
    bild.fg.forEach((f, nr) => figuren.push({ y: f.py + (f.steht > 0.5 ? 0.04 : 0), mal: () => maleFahrgast(nr, f, jetzt) }));
    figuren.push({ y: bild.k.py + 0.05, mal: () => maleKontrolleur() });
    figuren.sort((a, b) => a.y - b.y);
    for (const f of figuren) f.mal();
  }

  function maleFahrgast(nr, f, jetzt) {
    if (f.da <= 0.01 || !z) return;
    const { s, boden } = masse;
    const cx = boden.x + (f.px + 0.5) * s;
    const sitzt = f.steht < 0.5;
    const fy = boden.y + (f.py + (sitzt ? 0.86 : 0.9)) * s - f.zuck * s * 0.12;
    stift.save();
    stift.globalAlpha = f.da;
    if (f.farbe === 'z' && f.steht < 0.5) {
      // Schlafende und Scheinschläfer sehen gleich aus. Nur der Scheinschläfer hebt manchmal den Kopf.
      maleSchlaefer(stift, cx, fy, s, { wach: Math.max(f.wach, f.kopf * 0.8), atem: ruhig ? 0 : Math.sin(jetzt / 900) });
    } else {
      const k = maleFahrgastKoerper(stift, cx, fy, s, { farben: FAHRGASTFARBEN[f.farbe] || FAHRGASTFARBEN.d, steht: Math.max(f.steht, f.zuck * 0.6) });
      maleHochgehalten(stift, cx, k.schulterY + s * 0.16, s, f.karte);
      // gefangen: Er bleibt sitzen, die Zange hält seine Hand
      if (f.gefangen) {
        const glanz = begrenze(1 - (jetzt - wirkung.fang) / 700, 0, 1);
        if (glanz > 0) {
          stift.strokeStyle = `rgba(255, 179, 71, ${glanz})`;
          stift.lineWidth = 2;
          stift.beginPath();
          stift.arc(cx, fy - s * 0.35, s * (0.42 + 0.1 * (1 - glanz)), 0, Math.PI * 2);
          stift.stroke();
        }
      }
    }
    maleGelocht(stift, cx, fy - s * 0.82, s, f.gelocht);
    stift.restore();
  }

  // Im Lernhalt höchstens zwei Hinweiswörter, je im passenden Moment, als Schild unter dem Kontrolleur:
  // "Wischen" vor dem ersten Zug, "Antippen", solange er in der Reihe des Fahrgasts ohne Fahrkarte steht.
  function welcherHinweis() {
    if (!z || !z.lernhalt || z.status !== 'faehrt' || laeufer.length) return null;
    if (z.zug === 0) return KONTROLLTEXTE.hinweis.wischen;
    const s = z.fahrgaeste.find((f) => f.schwarz && !f.gefangen);
    if (s && s.y === z.k.y) return KONTROLLTEXTE.hinweis.antippen;
    return null;
  }

  function maleHinweis() {
    const text = welcherHinweis();
    if (!text) return;
    const { s, boden } = masse;
    const raster = masse.tafel.raster;
    const breit = textBreite(text);
    const b = breit * raster + 16;
    const h = ZEILENHOEHE * raster + 10; // mit Unterlängen, sonst wird aus dem p ein o
    const x = Math.round(Math.max(4, Math.min(masse.breite - b - 4, boden.x + (KONTROLLGANG + 0.5) * s - b / 2)));
    let y = Math.round(boden.y + (bild.k.py + 1.02) * s);
    if (y + h > masse.warten.y - 4) y = Math.round(boden.y + bild.k.py * s - h - 4); // unten kein Platz: darüber
    stift.fillStyle = 'rgba(12, 10, 6, 0.92)';
    rundesRechteck(stift, x, y, b, h, 5);
    stift.fill();
    stift.strokeStyle = FARBE.tafelRand;
    stift.lineWidth = 1;
    rundesRechteck(stift, x + 0.5, y + 0.5, b - 1, h - 1, 5);
    stift.stroke();
    const feld = neuesPunktfeld(breit, ZEILENHOEHE);
    schreibe(feld, text, 0, 0);
    zeichnePunktfeld(stift, feld, x + 8, y + 5, raster, FARBE.bernstein, null);
  }

  function maleKontrolleur() {
    const { s, boden } = masse;
    const k = bild.k;
    maleSchaffner(stift, boden.x + (KONTROLLGANG + 0.5) * s, boden.y + (k.py + 0.9) * s, s, { blick: k.blick, zeigt: k.zeigt, streck: k.streck, offen: k.offen });
  }

  function zeichne(jetzt) {
    if (!masse || !z) return;
    if (leinwand.clientWidth && (leinwand.clientWidth !== masse.breite || leinwand.clientHeight !== masse.hoehe)) passeAn();
    for (const l of laeufer.slice()) {
      if (jetzt < l.start) continue;
      const p = l.dauer <= 0 ? 1 : (jetzt - l.start) / l.dauer;
      l.schritt(begrenze(p, 0, 1));
      if (p >= 1) laeufer = laeufer.filter((x) => x !== l);
    }
    stift.setTransform(dichte, 0, 0, dichte, 0, 0);
    stift.globalAlpha = 1;
    stift.fillStyle = FARBE.nacht;
    stift.fillRect(0, 0, masse.breite, masse.hoehe);
    stift.save();
    // beim Fang ruckt nichts, das Bild steht. Am Halt ruckt der Zug einmal.
    const ruck = begrenze(1 - (jetzt - wirkung.halt) / 260, 0, 1);
    if (!ruhig && ruck > 0) stift.translate(0, Math.round(Math.sin(ruck * Math.PI) * 3));
    maleWelt(jetzt);
    stift.restore();
    maleHinweis();
    maleStrecke();
    maleHaken();
    maleLinie();
    maleTonschalter(stift, masse.ton, tonAn);
    maleKnopf(masse.warten, KONTROLLTEXTE.warten, begrenze(1 - (jetzt - wirkung.warten) / 140, 0, 1));
    if (schluss) {
      const ein = begrenze((jetzt - schluss.start) / 250, 0, 1);
      stift.fillStyle = `rgba(5, 7, 12, ${0.72 * ein})`;
      stift.fillRect(0, 0, masse.breite, masse.hoehe);
      const kasten = schlussKasten();
      if (!schluss.bild) schluss.bild = malePunkttafel(kasten, schluss.zeilen.map((text) => ({ text, spalte: 4, zeile: 2 })), dichte, true);
      stift.globalAlpha = ein;
      stift.drawImage(schluss.bild, kasten.x, kasten.y, kasten.b, kasten.h);
      stift.globalAlpha = 1;
    }
  }

  // Was liegt an diesem Bildschirmpunkt?
  function wasLiegtBei(px, py) {
    if (Math.hypot(px - masse.ton.x, py - masse.ton.y) <= masse.ton.r) return { art: 'ton' };
    if (imKasten(masse.warten, px, py)) return { art: 'warten' };
    const feld = feldAn(masse, px, py);
    if (feld) return { art: 'feld', x: feld.x, y: feld.y };
    return { art: 'leer' };
  }

  return {
    passeAn,
    neu,
    spiele,
    beschleunige,
    zeichne,
    wasLiegtBei,
    melder,
    bereit: (jetzt) => jetzt >= gesperrtBis,
    setzeTon: (an) => {
      tonAn = an;
    },
    masse: () => masse,
    hinweis: () => welcherHinweis(),
    setzeWeiteste: (nr) => {
      weiteste = nr;
    },
  };
}
