// Musik als Echo: Was im Wagen geschieht, klingt nach. Reine Logik ohne Browser, in Node testbar.
// Aus einem Ereignis des Kerns wird eine Liste von Noten. Gespielt werden sie in ton.js.
//
// Eine Note: { art, hz, bis, laut, dauer, spaeter }
//   art 'ton'     ein weicher Ton
//   art 'gleiten' ein Ton, der von hz nach bis gleitet
//   art 'puls'    ein tiefer, weicher Anschlag: der Schienenstoß
//   art 'aus'     der Grundklang und alles andere klingen aus (dauer in Sekunden)
//
// Alle Töne stammen aus einer Tonleiter ohne Halbtöne (a-Moll pentatonisch), darin klingt nichts schief.
// Unmögliche Eingaben bleiben stumm, Fehlertöne und Jubel gibt es nicht.

import { SCHLAEFERPLATZ } from './kern/abteil.js';

const MUSIK_A2 = 110;
const halbtonUeber = (hz, n) => hz * Math.pow(2, n / 12);

// a c d e g, über zwei Oktaven ab MUSIK_A2
const PENTA_STUFEN = [0, 3, 5, 7, 10];
export const TONLEITER = [];
for (let oktave = 0; oktave < 3; oktave++) for (const s of PENTA_STUFEN) TONLEITER.push(halbtonUeber(MUSIK_A2, 12 * oktave + s));

// TONLEITER[5] = A3, [7] = D4, [8] = E4, [9] = G4, [10] = A4, [12] = D5
const stufe = (i) => TONLEITER[i];

// Grundklang: MUSIK_A2 mit leiser Quinte darüber. Ein iPhone-Lautsprecher gibt tiefer kaum etwas wieder.
export const GRUNDKLANG = { hz: MUSIK_A2, quinte: halbtonUeber(MUSIK_A2, 7), laut: 0.05 };

// Das Motiv des Schaffners: e – g – a – d. Der erste Ton ist sein Warten.
export const MOTIV = [stufe(8), stufe(9), stufe(10), stufe(12)];
const MOTIV_ABSTAND = 0.24; // Sekunden zwischen den Tönen des ganzen Motivs

export const AUSKLANG = 1.4; // so lange klingt an der Tür alles aus, in Sekunden
export const STILLE = 2.0; // danach so lange nichts, dann der Abschluss
export const ABSCHLUSS_NACH = AUSKLANG + STILLE;

const MUSIK_LAUT = { gehen: 0.09, benutzen: 0.09, warten: 0.07, lampe: 0.08, motiv: 0.1, mitlauf: 0.035, stoss: 0.2 };
const SCHLAEFER_TIEFER = 0.5; // beim Schlafenden eine Oktave tiefer
const SCHLAEFER_LEISER = 0.6; // und leiser

// Gehen: Je näher die Tür, desto höher der Ton. Reihe 7 ganz unten, Reihe 0 an der Tür.
export function gehton(reihe) {
  return stufe(5 + Math.max(0, Math.min(7, 7 - reihe)));
}

// Das Motiv als Noten. tief: beim Schlafenden. leise: das Mitlaufen in jeder Runde.
export function motivNoten(tief, leise, spaeter) {
  const faktor = tief ? SCHLAEFER_TIEFER : 1;
  const laut = (leise ? MUSIK_LAUT.mitlauf : MUSIK_LAUT.motiv) * (tief ? SCHLAEFER_LEISER : 1);
  return MOTIV.map((hz, i) => ({ art: 'ton', hz: hz * faktor, laut, dauer: 0.9, spaeter: (spaeter || 0) + i * MOTIV_ABSTAND }));
}

function musikTon(hz, laut, dauer) {
  return { art: 'ton', hz, laut, dauer: dauer || 0.6, spaeter: 0 };
}

// Was ein einzelnes Ereignis zum Klingen bringt.
export function notenZu(e) {
  switch (e.typ) {
    case 'schritt':
    case 'draengt':
      return [musikTon(gehton(e.nach.y), MUSIK_LAUT.gehen)];
    case 'nimmt':
      return [musikTon(stufe(9), MUSIK_LAUT.benutzen, 0.7)];
    case 'weckt':
      return [musikTon(stufe(7), MUSIK_LAUT.benutzen, 0.7)];
    case 'warten':
      return [musikTon(stufe(5), MUSIK_LAUT.warten, 0.8)];
    case 'lampe': {
      // ein kurzes Gleiten zwischen zwei Tönen, zum Gang hinauf, zum Fenster hinunter
      const [unten, oben] = e.name === 'B' ? [stufe(7), stufe(9)] : [stufe(8), stufe(10)];
      const hin = e.stellung === 'gang';
      return [{ art: 'gleiten', hz: hin ? unten : oben, bis: hin ? oben : unten, laut: MUSIK_LAUT.lampe, dauer: 0.32, spaeter: 0 }];
    }
    case 'wartet': {
      // solange er wartet, nur der erste Ton des Motivs, immer wieder
      const tief = e.reihe === SCHLAEFERPLATZ.y;
      return [musikTon(MOTIV[0] * (tief ? SCHLAEFER_TIEFER : 1), MUSIK_LAUT.motiv * (tief ? SCHLAEFER_LEISER : 1), 1.0)];
    }
    case 'locht':
      return motivNoten(e.wen === 'schlaefer', false, 0);
    case 'gruesst':
      return motivNoten(true, false, 0);
    case 'stoss':
      // ta-tack, weich und tief, kein Schlagzeug
      return [
        { art: 'puls', hz: MUSIK_A2, laut: MUSIK_LAUT.stoss, dauer: 0.35, spaeter: 0 },
        { art: 'puls', hz: MUSIK_A2, laut: MUSIK_LAUT.stoss * 0.75, dauer: 0.3, spaeter: 0.19 },
      ];
    case 'ende':
      return [{ art: 'aus', dauer: AUSKLANG, spaeter: 0 }];
    default:
      // gegen die Wand, zu weit, ins Leere, Anstoßen, Satz, Nicken, Schritte des Schaffners: still
      return [];
  }
}

// Nach dem ersten Lochen läuft das Motiv in jeder Runde leise mit, beim Schlafenden tiefer und leiser.
// Nur in Runden, die wirklich vergangen sind, und nicht in der Runde, in der das Motiv ganz erklingt.
export function mitlaufNoten(ereignisse, z, rundeVorher) {
  if (z.runde === rundeVorher || z.status !== 'faehrt') return [];
  const noten = [];
  const ganz = (wen) => ereignisse.some((e) => (e.typ === 'locht' && e.wen === wen) || (wen === 'schlaefer' && e.typ === 'gruesst'));
  if (z.spieler.gelocht && !ganz('spieler')) noten.push(...motivNoten(false, true, 0.45));
  if ((z.schlaefer.gegruesst || z.schlaefer.gelocht) && !ganz('schlaefer')) noten.push(...motivNoten(true, true, 0.57));
  return noten;
}
