// Der Abend im Saal: fünf Bänke zu je vier Plätzen, Gäste in vier Farben, einige zeigen eine falsche.
// Reine Logik ohne Browser. Jede Eingabe ist ein Zug, act() gibt eine Ereignisliste zurück.
//
//   const abend = erzeugeAbend(seed);
//   abend.act({ von: 'tuer', nach: 2 });   // den wartenden Gast an der Tür auf Bank 2 setzen
//   abend.act({ von: 0, nach: 3 });        // den äußersten Gast von Bank 0 auf Bank 3 umsetzen
//
// Ein Gast: { id, zeigt, echt }. Ehrlich ist, wer zeigt, was er ist. Ein Falscher zeigt eine andere Farbe.
// Fliegt er auf, zeigt er seine echte Farbe und behält sie; von da an gilt er wie ein Ehrlicher.
// Eine Bank ist eine Liste vom inneren zum äußeren Platz. Umgesetzt wird nur der äußerste Gast.
//
// Regeln:
//   Schimmern: Wer gesetzt wird, kommt neben den bisher äußersten Gast. Haben beide dieselbe echte Farbe,
//     schimmern beide. Ein Falscher schimmert also nicht neben der Farbe, die er zeigt, sondern neben seiner echten.
//   Räumen: Zeigen vier auf einer Bank dieselbe Farbe und sind alle ehrlich, gehen sie, die Bank wird frei,
//     ein Fenster leuchtet auf. Ist ein Falscher darunter, räumt die Bank nicht: Er fliegt auf.
//   Tür: Nach jedem zweiten Zug kommt ein Gast an die Tür. Kommt ein vierter zu dreien, endet der Abend.
//     Ist nichts mehr zu tun (kein Zug möglich, Tür leer), kommt der nächste Gast sofort.
//   Es kommen immer weitere Gäste, mit der Zeit mehr Falsche. Der Abend endet, wenn an der Tür ein vierter
//     dazukäme, wenn kein Zug mehr möglich ist oder wenn alle Fenster des Saals leuchten. So hat jeder
//     Abend ein Ende.
//   Einstieg: Bis die erste Bank geräumt ist, kommen nur Ehrliche. Dann ein Falscher allein, und erst wenn
//     er aufgeflogen ist, weitere, langsam mehr.

import { wuerfleFarben, naechsteFarbzahl } from './zufall.js';

export const FARBEN = 4;
export const BAENKE = 5;
export const PLAETZE = 4;
export const TUER_HOECHSTENS = 3;
export const ANKUNFT_ALLE = 2; // Züge
export const FALSCH_ANFANG = 0.3; // Anteil der Falschen nach dem ersten, steigt je geräumter Bank
export const FALSCH_STEIGT = 0.03;
export const FALSCH_HOECHSTENS = 0.6;
export const VERDECKT_ANFANG = 1; // so viele unaufgeflogene Falsche zugleich, eine mehr alle VERDECKT_ALLE Bänke
export const VERDECKT_ALLE = 4;
export const VERDECKT_HOECHSTENS = 3;
export const FENSTER = 14; // so viele Fenster hat der Saal, für jede geräumte Bank leuchtet eines

export function istFalsch(g) {
  return g.zeigt !== g.echt;
}

export function erzeugeAbend(seed) {
  const z = {
    seed: seed >>> 0,
    zufall: seed >>> 0,
    status: 'laeuft', // 'laeuft' | 'ende'
    ende: null, // 'tuer' | 'fest' | 'hell'
    baenke: [],
    tuer: [],
    zug: 0,
    gekommen: 0,
    naechsteId: 1,
    geraeumt: 0,
    beutel: [],
    ersterFalscher: null, // 'unterwegs' | 'aufgeflogen'
    // für den Satz am Ende, was der Spieler mit Falschen getan hat:
    //   aufgeflogen: in Reihenfolge { id, zeigte, echt, wie }; wie 'geglaubt': flog unter anderen auf, es saß
    //     schon jemand auf ihm; 'zuletzt': flog als äußerster auf, als vierter zu drei Gleichen
    //   umgesetzt: ids der Falschen, die umgesetzt wurden, bevor sie aufflogen
    verlauf: { aufgeflogen: [], umgesetzt: [] },
  };
  for (let b = 0; b < BAENKE; b++) z.baenke.push([]);
  kommt(z, []);
  return { zustand: z, act: (aktion) => fuehreAus(z, aktion) };
}

// echte Farben aus einem Beutel mit je zwei jeder Farbe: Über den Abend gleicht es sich aus
function echteFarbe(z) {
  if (!z.beutel.length) {
    for (let f = 0; f < FARBEN; f++) z.beutel.push(f, f);
    wuerfleFarben(z, z.beutel);
  }
  return z.beutel.pop();
}

function alleImSaal(z) {
  const alle = z.tuer.slice();
  for (const bank of z.baenke) alle.push(...bank);
  return alle;
}

// Soll der nächste Gast falsch sein? Nach dem Einstieg zuerst genau einer, dann langsam mehr.
function wirdFalsch(z) {
  if (z.geraeumt < 1) return false;
  if (z.ersterFalscher === null) return true;
  if (z.ersterFalscher === 'unterwegs') return false;
  const anteil = Math.min(FALSCH_HOECHSTENS, FALSCH_ANFANG + FALSCH_STEIGT * (z.geraeumt - 1));
  return naechsteFarbzahl(z) < anteil;
}

function neuerGast(z) {
  const echt = echteFarbe(z);
  const gast = { id: z.naechsteId++, zeigt: echt, echt };
  if (wirdFalsch(z)) {
    // Nie zwei unaufgeflogene Falsche, die dieselbe Farbe zeigen. So beweist Schimmern zwischen zwei gleich
    // Aussehenden, dass beide ehrlich sind, und bleibt es aus, ist genau einer von beiden falsch.
    const verdeckt = alleImSaal(z).filter(istFalsch);
    const zugleich = Math.min(VERDECKT_HOECHSTENS, VERDECKT_ANFANG + Math.floor(z.geraeumt / VERDECKT_ALLE));
    const moeglich = [];
    for (let f = 0; f < FARBEN; f++) if (f !== echt && !verdeckt.some((g) => g.zeigt === f)) moeglich.push(f);
    if (moeglich.length && verdeckt.length < zugleich) {
      gast.zeigt = moeglich[Math.floor(naechsteFarbzahl(z) * moeglich.length)];
      if (z.ersterFalscher === null) z.ersterFalscher = 'unterwegs';
    }
  }
  z.gekommen += 1;
  return gast;
}

// Ein Gast kommt an die Tür. Gibt false zurück, wenn es der vierte wäre: Dann endet der Abend.
function kommt(z, ereignisse) {
  if (z.tuer.length >= TUER_HOECHSTENS) {
    beende(z, 'tuer', ereignisse);
    return false;
  }
  const gast = neuerGast(z);
  z.tuer.push(gast);
  ereignisse.push({ typ: 'ankunft', gast: { ...gast } });
  return true;
}

function beende(z, wie, ereignisse) {
  z.status = 'ende';
  z.ende = wie;
  ereignisse.push({ typ: 'ende', wie, geraeumt: z.geraeumt });
}

export function gueltig(z, aktion) {
  if (!aktion || z.status !== 'laeuft') return false;
  const { von, nach } = aktion;
  if (!Number.isInteger(nach) || nach < 0 || nach >= BAENKE) return false;
  if (z.baenke[nach].length >= PLAETZE) return false;
  if (von === 'tuer') return z.tuer.length > 0;
  if (!Number.isInteger(von) || von < 0 || von >= BAENKE || von === nach) return false;
  return z.baenke[von].length > 0;
}

export function zuege(z) {
  const liste = [];
  for (const von of ['tuer', 0, 1, 2, 3, 4]) {
    for (let nach = 0; nach < BAENKE; nach++) if (gueltig(z, { von, nach })) liste.push({ von, nach });
  }
  return liste;
}

function fuehreAus(z, aktion) {
  if (!gueltig(z, aktion)) return [];
  const ereignisse = [];
  const { von, nach } = aktion;
  const gast = von === 'tuer' ? z.tuer.shift() : z.baenke[von].pop();
  if (von !== 'tuer' && istFalsch(gast) && !z.verlauf.umgesetzt.includes(gast.id)) z.verlauf.umgesetzt.push(gast.id);
  const bank = z.baenke[nach];
  const nachbar = bank.length ? bank[bank.length - 1] : null;
  bank.push(gast);
  z.zug += 1;
  ereignisse.push({ typ: 'gesetzt', id: gast.id, von, nach, platz: bank.length - 1 });

  // Schimmern: neben dem bisher äußersten, wenn beide dieselbe echte Farbe haben
  if (nachbar && nachbar.echt === gast.echt) ereignisse.push({ typ: 'schimmer', ids: [nachbar.id, gast.id], bank: nach });

  // vier, die dieselbe Farbe zeigen: räumen oder auffliegen
  if (bank.length === PLAETZE && bank.every((g) => g.zeigt === bank[0].zeigt)) {
    const falsche = bank.filter(istFalsch);
    if (falsche.length) {
      for (const f of falsche) {
        const wie = bank.indexOf(f) === PLAETZE - 1 ? 'zuletzt' : 'geglaubt';
        z.verlauf.aufgeflogen.push({ id: f.id, zeigte: f.zeigt, echt: f.echt, wie });
        f.zeigt = f.echt;
        if (z.ersterFalscher === 'unterwegs') z.ersterFalscher = 'aufgeflogen';
      }
      ereignisse.push({ typ: 'aufgeflogen', bank: nach, gaeste: falsche.map((f) => ({ id: f.id, platz: bank.indexOf(f), echt: f.echt })) });
    } else {
      z.geraeumt += 1;
      ereignisse.push({ typ: 'geraeumt', bank: nach, farbe: bank[0].zeigt, ids: bank.map((g) => g.id), fenster: z.geraeumt });
      z.baenke[nach] = [];
      if (z.geraeumt >= FENSTER) {
        beende(z, 'hell', ereignisse);
        return ereignisse;
      }
    }
  }

  // nach jedem zweiten Zug ein neuer Gast an der Tür
  if (z.zug % ANKUNFT_ALLE === 0 && !kommt(z, ereignisse)) return ereignisse;
  pruefeEnde(z, ereignisse);
  return ereignisse;
}

// Kein Zug möglich: Ist die Tür leer, kommt der nächste Gast sofort, sonst endet der Abend.
function pruefeEnde(z, ereignisse) {
  if (z.status !== 'laeuft' || zuege(z).length) return;
  if (z.tuer.length) return beende(z, 'fest', ereignisse);
  if (kommt(z, ereignisse) && !zuege(z).length) beende(z, 'fest', ereignisse);
}
