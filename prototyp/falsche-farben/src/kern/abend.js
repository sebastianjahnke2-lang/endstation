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
//   Nachbarn: Wer gesetzt wird, kommt neben den bisher äußersten Gast. Haben beide dieselbe echte Farbe,
//     schimmern beide und rücken zusammen, auch wenn einer eine andere Farbe zeigt. Zeigen beide dieselbe
//     Farbe und sind verschieden, rücken sie ab. Sonst geschieht nichts. Ein Falscher sieht aus wie jeder andere.
//   Räumen: Zeigen vier auf einer Bank dieselbe Farbe und sind alle ehrlich, gehen sie, die Bank wird frei,
//     ein Fenster leuchtet auf. Ist ein Falscher darunter, räumt die Bank nicht: Er fliegt auf.
//   Tür: Nach jedem zweiten Zug kommt ein Gast an die Tür. Kommt ein vierter zu dreien, endet der Abend.
//     Ist nichts mehr zu tun (kein Zug möglich, Tür leer), kommt der nächste Gast sofort.
//   Es kommen immer weitere Gäste, mit der Zeit mehr Falsche. Der Abend endet, wenn an der Tür ein vierter
//     dazukäme, wenn kein Zug mehr möglich ist oder wenn alle Fenster des Saals leuchten. So hat jeder
//     Abend ein Ende.
//   Spur: Wer abrückt, bleibt abgewandt sitzen, beide Beteiligten (g.abgewandt: -1 nach innen, 1 nach außen).
//     Das endet, sobald er neben seiner echten Farbe zusammenrückt, auffliegt oder verhört wird.
//   Verhör: { verhoer: id } kostet ein leuchtendes Fenster und keinen Zug. Der Gast zeigt danach seine echte
//     Farbe und behält sie. Ohne leuchtendes Fenster geht es nicht. Zum Ende „hell" müssen alle Fenster leuchten.
//   Einstieg: Bis die erste Bank geräumt ist, kommen nur Ehrliche. Dann ein Falscher allein, in einem Moment,
//     in dem genau zwei Bänke Platz haben (einstiegsMoment), und erst wenn er aufgeflogen ist, weitere.

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
    geraeumt: 0, // geräumte Bänke, sie bestimmen, wie viele Falsche kommen
    licht: 0, // leuchtende Fenster: eines je geräumter Bank, eines weniger je Verhör
    beutel: [],
    ersterFalscher: null, // 'unterwegs' | 'aufgeflogen'
    // für den Satz am Ende, was der Spieler mit Falschen getan hat:
    //   aufgeflogen: in Reihenfolge { id, zeigte, echt, wie }; wie 'geglaubt': flog unter anderen auf, es saß
    //     schon jemand auf ihm; 'zuletzt': flog als äußerster auf, als vierter zu drei Gleichen
    //   umgesetzt: ids der Falschen, die umgesetzt wurden, bevor sie aufflogen
    //   verhoert: Falsche, die verhört wurden, { id, zeigte, echt }
    verlauf: { aufgeflogen: [], umgesetzt: [], verhoert: [] },
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

// Einstieg: Der erste Falsche kommt nur in einem Moment, in dem niemand an der Tür wartet und genau zwei Bänke
// einen freien Platz haben, beide mit jemandem darauf, deren Äußerste verschiedene Farben haben. Er zeigt die
// Farbe der einen und ist in Wahrheit die der anderen: Wohin er auch gesetzt wird, er rückt ab oder zusammen.
// Gibt die beiden Farben { zeigt, echt } zurück oder null, wenn der Moment nicht passt.
export function einstiegsMoment(z) {
  if (z.tuer.length) return null;
  const offen = z.baenke.filter((b) => b.length < PLAETZE);
  const besetzt = offen.filter((b) => b.length);
  if (besetzt.length !== 2) return null;
  const [a, b] = besetzt.map((bank) => bank[bank.length - 1]);
  if (a.echt === b.echt || istFalsch(a) || istFalsch(b)) return null;
  return naechsteFarbzahl(z) < 0.5 ? { zeigt: a.echt, echt: b.echt } : { zeigt: b.echt, echt: a.echt };
}

// Soll der nächste Gast falsch sein? Nach dem Einstieg zuerst genau einer, dann langsam mehr.
function wirdFalsch(z) {
  if (z.geraeumt < 1 || z.ersterFalscher !== 'aufgeflogen') return false;
  const anteil = Math.min(FALSCH_HOECHSTENS, FALSCH_ANFANG + FALSCH_STEIGT * (z.geraeumt - 1));
  return naechsteFarbzahl(z) < anteil;
}

function neuerGast(z) {
  if (z.geraeumt >= 1 && z.ersterFalscher === null) {
    const moment = einstiegsMoment(z);
    if (moment) {
      z.ersterFalscher = 'unterwegs';
      z.gekommen += 1;
      return { id: z.naechsteId++, zeigt: moment.zeigt, echt: moment.echt, abgewandt: 0 };
    }
  }
  const echt = echteFarbe(z);
  const gast = { id: z.naechsteId++, zeigt: echt, echt, abgewandt: 0 };
  if (wirdFalsch(z)) {
    // Nie zwei unaufgeflogene Falsche, die dieselbe Farbe zeigen. So beweist Zusammenrücken zwischen zwei gleich
    // Aussehenden, dass beide ehrlich sind, und rücken sie ab, ist genau einer von beiden falsch.
    const verdeckt = alleImSaal(z).filter(istFalsch);
    const zugleich = Math.min(VERDECKT_HOECHSTENS, VERDECKT_ANFANG + Math.floor(z.geraeumt / VERDECKT_ALLE));
    const moeglich = [];
    for (let f = 0; f < FARBEN; f++) if (f !== echt && !verdeckt.some((g) => g.zeigt === f)) moeglich.push(f);
    if (moeglich.length && verdeckt.length < zugleich) gast.zeigt = moeglich[Math.floor(naechsteFarbzahl(z) * moeglich.length)];
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

export function finde(z, id) {
  for (const g of z.tuer) if (g.id === id) return g;
  for (const b of z.baenke) for (const g of b) if (g.id === id) return g;
  return null;
}

export function darfVerhoeren(z, id) {
  return z.status === 'laeuft' && z.licht >= 1 && finde(z, id) !== null;
}

export function gueltig(z, aktion) {
  if (!aktion || z.status !== 'laeuft') return false;
  if (aktion.verhoer !== undefined) return darfVerhoeren(z, aktion.verhoer);
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

// Verhör: kein Zug, niemand kommt an die Tür, ein Fenster geht aus
function verhoere(z, id) {
  const g = finde(z, id);
  const zeigte = g.zeigt;
  if (istFalsch(g)) {
    z.verlauf.verhoert.push({ id: g.id, zeigte, echt: g.echt });
    if (z.ersterFalscher === 'unterwegs') z.ersterFalscher = 'aufgeflogen';
  }
  g.zeigt = g.echt;
  g.abgewandt = 0;
  z.licht -= 1;
  return [{ typ: 'verhoer', id: g.id, zeigte, echt: g.echt, fenster: z.licht }];
}

function fuehreAus(z, aktion) {
  if (!gueltig(z, aktion)) return [];
  if (aktion.verhoer !== undefined) return verhoere(z, aktion.verhoer);
  const ereignisse = [];
  const { von, nach } = aktion;
  const gast = von === 'tuer' ? z.tuer.shift() : z.baenke[von].pop();
  if (von !== 'tuer' && istFalsch(gast) && !z.verlauf.umgesetzt.includes(gast.id)) z.verlauf.umgesetzt.push(gast.id);
  const bank = z.baenke[nach];
  const nachbar = bank.length ? bank[bank.length - 1] : null;
  bank.push(gast);
  z.zug += 1;
  ereignisse.push({ typ: 'gesetzt', id: gast.id, von, nach, platz: bank.length - 1 });

  // Schimmern und Zusammenrücken: neben dem bisher äußersten, wenn beide dieselbe echte Farbe haben
  // Wer neben seiner echten Farbe zusammenrückt, wendet sich nicht mehr ab.
  if (nachbar && nachbar.echt === gast.echt) {
    nachbar.abgewandt = 0;
    gast.abgewandt = 0;
    ereignisse.push({ typ: 'schimmer', ids: [nachbar.id, gast.id], bank: nach });
  } else if (nachbar && nachbar.zeigt === gast.zeigt) {
    // Abrücken: beide zeigen dieselbe Farbe, sind aber verschieden. Beide bleiben abgewandt sitzen.
    nachbar.abgewandt = -1;
    gast.abgewandt = 1;
    ereignisse.push({ typ: 'abruecken', ids: [nachbar.id, gast.id], bank: nach });
  }

  // vier, die dieselbe Farbe zeigen: räumen oder auffliegen
  if (bank.length === PLAETZE && bank.every((g) => g.zeigt === bank[0].zeigt)) {
    const falsche = bank.filter(istFalsch);
    if (falsche.length) {
      for (const f of falsche) {
        const wie = bank.indexOf(f) === PLAETZE - 1 ? 'zuletzt' : 'geglaubt';
        z.verlauf.aufgeflogen.push({ id: f.id, zeigte: f.zeigt, echt: f.echt, wie });
        f.zeigt = f.echt;
        f.abgewandt = 0;
        if (z.ersterFalscher === 'unterwegs') z.ersterFalscher = 'aufgeflogen';
      }
      ereignisse.push({ typ: 'aufgeflogen', bank: nach, gaeste: falsche.map((f) => ({ id: f.id, platz: bank.indexOf(f), echt: f.echt })) });
    } else {
      z.geraeumt += 1;
      z.licht += 1;
      ereignisse.push({ typ: 'geraeumt', bank: nach, farbe: bank[0].zeigt, ids: bank.map((g) => g.id), fenster: z.licht });
      z.baenke[nach] = [];
      if (z.licht >= FENSTER) {
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
