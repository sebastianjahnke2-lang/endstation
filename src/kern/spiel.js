// Der Spielkern. Kennt weder Bildschirm noch Browser.
//
//   const spiel = erzeugeSpiel(seed);
//   const ereignisse = spiel.act('hoch');   // 'hoch' | 'rechts' | 'runter' | 'links' | 'warten'
//                                           // 'sprint-hoch' usw., wer den Drängler verstanden hat
//   erzeugeSpiel(seed, { staerken: { sprint, rueckhalt, warten } })   Stärken aus früheren Fahrten
//
// act() ändert spiel.zustand und gibt zurück, was dabei passiert ist.
// Jedes Ereignis trägt eine Phase: 0 Spieler, 1 Angriffe treffen ein, 2 Gegner bewegen sich.
// Eine ungültige Eingabe ändert nichts und kostet keinen Zug.

import { RICHTUNG, STARTFELD, TUERFELD, imFeld } from './feld.js';
import { istHindernis, gegnerAuf, istMarkiert, tuerFrei } from './lage.js';
import { WAGENZAHL, baueWagen } from './wagen.js';
import { neuerGegner, loeseAnsagenEin, planeGegner, schadenVon } from './gegner.js';

export const HERZEN_VOLL = 5;
export const RUHE_VOLL = 3;
export const SCHADEN_SPIELER = 1;
export const AUFBRECHEN_STOESSE = 3; // so oft gegen die geschlossene Tür laufen, dann gibt sie nach
export const AUFBRECHEN_KOSTET = 1; // Herzen

// Stärken aus Schatten: Wer einen Gegnertyp versteht, bekommt dauerhaft dessen Stärke.
//   Pendler: dreimal neben ihm warten              -> warten: Ruhe fürs Warten neben einem Gegner
//   Drängler: dreimal ausweichen, ohne ihn zu schlagen -> sprint: für 1 Ruhe bis zu 2 Felder geradeaus
//   Reisegruppe: einen Wagen mit ihr mit 1 Herz verlassen -> rueckhalt: einmal je Fahrt einen tödlichen Treffer überstehen
export const STAERKEN = ['warten', 'sprint', 'rueckhalt'];
export const VERSTEHEN_NACH = 3; // so oft neben dem Pendler warten oder dem Drängler ausweichen
export const SPRINT_WEITE = 2;
export const SPRINT_KOSTET = 1; // Ruhe

function richteWagenEin(z) {
  const wagen = baueWagen(z.wagenNr, z);
  z.wagen = { nr: wagen.nr, art: wagen.art, plan: wagen.plan, gespiegelt: wagen.gespiegelt };
  z.gegner = wagen.gegner.map((vorgabe) => neuerGegner(z.naechsteId++, vorgabe));
  z.wagen.mitKontrolleur = z.gegner.some((g) => g.typ === 'kontrolleur');
  z.wagen.mitGruppe = z.gegner.some((g) => g.typ === 'gruppe');
  z.spieler.x = STARTFELD.x;
  z.spieler.y = STARTFELD.y;
  z.tuerOffen = z.gegner.length === 0;
  z.tuerStoesse = 0;
  z.aufgebrochen = false;
  z.zuegeImWagen = 0;
}

function oeffneTuer(z, ereignisse, phase) {
  if (z.tuerOffen || !tuerFrei(z)) return;
  z.tuerOffen = true;
  ereignisse.push({ typ: 'tuerAuf', phase });
}

function stirb(z, ereignisse, phase, durch) {
  z.status = 'tot';
  ereignisse.push({ typ: 'tod', phase, wagenNr: z.wagenNr, durch, uebrig: z.gegner.length });
}

// Eine Stärke kommt hinzu. Gibt das Ereignis zurück oder null, wenn sie schon da war.
function verstehe(z, staerke, gegner, phase) {
  if (z.staerken[staerke]) return null;
  z.staerken[staerke] = true;
  return { typ: 'verstanden', phase, staerke, gegner };
}

function nebenGegner(z, typ) {
  const s = z.spieler;
  return z.gegner.some((g) => (!typ || g.typ === typ) && Math.abs(g.x - s.x) + Math.abs(g.y - s.y) === 1);
}

function wechsleWagen(z) {
  z.zug += 1;
  z.zaehler.schritte += 1;
  z.zaehler.wagen += 1;
  // die Reisegruppe versteht, wer ihren Wagen mit einem Herz verlässt
  const gruppe = z.wagen.mitGruppe && z.spieler.herzen === 1 ? verstehe(z, 'rueckhalt', 'gruppe', 0) : null;
  const ereignisse = [];
  if (z.wagenNr + 1 >= WAGENZAHL) {
    z.status = 'halt';
    ereignisse.push({ typ: 'halt', phase: 0 });
  } else {
    z.wagenNr += 1;
    richteWagenEin(z);
    ereignisse.push({ typ: 'wagenwechsel', phase: 0, nr: z.wagenNr });
  }
  if (gruppe) ereignisse.push(gruppe);
  return ereignisse;
}

// Sprint: bis zu zwei Felder geradeaus. Gegner auf dem Weg nehmen Schaden, der Spieler landet auf
// dem weitesten freien Feld des Wegs. Gibt null zurück, wenn es nicht geht.
function sprinte(z, richtung, ereignisse) {
  const s = z.spieler;
  const r = RICHTUNG[richtung];
  const weg = [];
  for (let i = 1; i <= SPRINT_WEITE; i++) {
    const x = s.x + r.x * i;
    const y = s.y + r.y * i;
    if (!imFeld(x, y) || istHindernis(z, x, y)) break;
    weg.push({ x, y });
  }
  if (!weg.length) return null;
  const getroffen = [];
  for (const f of weg) {
    const g = gegnerAuf(z, f.x, f.y);
    if (!g) continue;
    g.hp -= SCHADEN_SPIELER;
    const besiegt = g.hp <= 0;
    getroffen.push({ id: g.id, gegner: g.typ, x: f.x, y: f.y, hp: Math.max(0, g.hp), besiegt });
    z.zaehler.schlaege += 1;
    if (besiegt) {
      z.gegner.splice(z.gegner.indexOf(g), 1);
      z.zaehler.besiegt += 1;
    }
  }
  let nach = null;
  for (const f of weg) if (!gegnerAuf(z, f.x, f.y)) nach = f;
  const von = { x: s.x, y: s.y };
  s.ruhe -= SPRINT_KOSTET;
  s.praesenz = false;
  ereignisse.push({ typ: 'sprint', phase: 0, richtung, von, nach, getroffen, ruhe: s.ruhe });
  if (nach) {
    s.x = nach.x;
    s.y = nach.y;
    z.zaehler.schritte += 1;
  }
  oeffneTuer(z, ereignisse, 0);
  const kontrolleur = getroffen.find((t) => t.gegner === 'kontrolleur');
  const tat = kontrolleur ? { art: 'schlag', id: kontrolleur.id } : nach ? { art: 'schritt', von } : { art: 'stoss' };
  return { bewegt: nach !== null, tat };
}

function fuehreAus(z, aktion) {
  if (z.status !== 'faehrt') return [];
  const s = z.spieler;
  const ereignisse = [];
  const startRot = istMarkiert(z, s.x, s.y);
  let zielRot = false;
  let bewegt = false;
  let tat = { art: 'warten' }; // was der Spieler getan hat, für den Kontrolleur
  const neben = nebenGegner(z); // für die Ruhe fürs Warten
  const draenglerRot = z.gegner.some((g) => g.typ === 'draengler' && g.ansage && g.ansage.some((f) => f.x === s.x && f.y === s.y));
  const spaeter = []; // Stärken, die in diesem Zug verstanden werden: [staerke, gegner]

  // Phase 0: der Spieler
  if (typeof aktion === 'string' && aktion.startsWith('sprint-')) {
    const richtung = aktion.slice(7);
    if (!RICHTUNG[richtung] || !z.staerken.sprint) return [];
    if (s.ruhe < SPRINT_KOSTET) return [{ typ: 'ungueltig', phase: 0, richtung, tuer: false }];
    const ergebnis = sprinte(z, richtung, ereignisse);
    if (!ergebnis) return [{ typ: 'ungueltig', phase: 0, richtung, tuer: false }];
    bewegt = ergebnis.bewegt;
    tat = ergebnis.tat;
    zielRot = bewegt && istMarkiert(z, s.x, s.y);
  } else if (aktion === 'warten') {
    ereignisse.push({ typ: 'warten', phase: 0 });
    z.zaehler.gewartet += 1;
    // den Pendler versteht, wer dreimal neben ihm wartet
    if (nebenGegner(z, 'pendler')) {
      z.verstehen.pendler += 1;
      if (z.verstehen.pendler >= VERSTEHEN_NACH) spaeter.push(['warten', 'pendler']);
    }
  } else {
    const r = RICHTUNG[aktion];
    if (!r) return [];
    const x = s.x + r.x;
    const y = s.y + r.y;
    const anDerTuer = aktion === 'hoch' && s.x === TUERFELD.x && s.y === TUERFELD.y;
    if (anDerTuer && z.tuerOffen) return wechsleWagen(z);
    if (!anDerTuer && (!imFeld(x, y) || istHindernis(z, x, y))) return [{ typ: 'ungueltig', phase: 0, richtung: aktion, tuer: false }];
    const g = anDerTuer ? null : gegnerAuf(z, x, y);
    if (anDerTuer) {
      // Aufbrechen: Jede Tür gibt nach dreimal Dagegenlaufen nach und kostet ein Herz.
      tat = { art: 'stoss' };
      z.tuerStoesse += 1;
      ereignisse.push({ typ: 'tuerStoss', phase: 0, n: z.tuerStoesse });
      if (z.tuerStoesse >= AUFBRECHEN_STOESSE) {
        z.tuerOffen = true;
        z.aufgebrochen = true;
        s.herzen = Math.max(0, s.herzen - AUFBRECHEN_KOSTET);
        z.zaehler.aufgebrochen += 1;
        ereignisse.push({ typ: 'aufgebrochen', phase: 0, herzen: s.herzen });
        ereignisse.push({ typ: 'tuerAuf', phase: 0 });
        if (s.herzen <= 0) {
          z.zug += 1;
          z.zuegeImWagen += 1;
          stirb(z, ereignisse, 0, 'tuer');
          return ereignisse;
        }
      }
    } else if (g) {
      tat = { art: 'schlag', id: g.id };
      if (g.typ === 'draengler') z.verstehen.draengler = 0; // verstehen heißt: ausweichen, ohne ihn zu schlagen
      g.hp -= SCHADEN_SPIELER;
      const besiegt = g.hp <= 0;
      ereignisse.push({ typ: 'schlag', phase: 0, id: g.id, gegner: g.typ, richtung: aktion, x, y, hp: Math.max(0, g.hp), besiegt });
      z.zaehler.schlaege += 1;
      if (besiegt) {
        z.gegner.splice(z.gegner.indexOf(g), 1); // seine Ansage verfällt mit ihm
        z.zaehler.besiegt += 1;
        oeffneTuer(z, ereignisse, 0);
      }
    } else {
      tat = { art: 'schritt', von: { x: s.x, y: s.y } };
      zielRot = istMarkiert(z, x, y);
      ereignisse.push({ typ: 'schritt', phase: 0, richtung: aktion, von: { x: s.x, y: s.y }, nach: { x, y } });
      s.x = x;
      s.y = y;
      bewegt = true;
      z.zaehler.schritte += 1;
    }
  }
  z.zug += 1;
  z.zuegeImWagen += 1;

  // Phase 1: angekündigte Angriffe treffen ein
  const { treffer, dran } = loeseAnsagenEin(z, ereignisse);
  if (treffer) {
    // höchstens ein Treffer je Zug, egal wie viele treffen. Er kostet ein Herz, beim Kontrolleur zwei.
    const schaden = schadenVon(treffer);
    s.herzen = Math.max(0, s.herzen - schaden);
    // Rückhalt: einmal je Fahrt bleibt nach einem tödlichen Treffer ein Herz
    const haelt = s.herzen <= 0 && z.staerken.rueckhalt && !z.rueckhaltGenutzt;
    if (haelt) {
      s.herzen = 1;
      z.rueckhaltGenutzt = true;
    }
    s.ruhe = 0;
    z.zaehler.treffer += 1;
    s.praesenz = false;
    ereignisse.push({ typ: 'treffer', phase: 1, herzen: s.herzen, durch: treffer.typ, schaden });
    if (haelt) ereignisse.push({ typ: 'rueckhalt', phase: 1, herzen: s.herzen });
    if (s.herzen <= 0) {
      stirb(z, ereignisse, 1, treffer.typ);
      return ereignisse;
    }
  } else if (startRot && bewegt && !zielRot) {
    z.zaehler.ausgewichen += 1;
    erhoeheRuhe(s);
    ereignisse.push({ typ: 'ausgewichen', phase: 1, ruhe: s.ruhe });
    // den Drängler versteht, wer dreimal seiner Linie ausweicht, ohne ihn zu schlagen
    if (draenglerRot) {
      z.verstehen.draengler += 1;
      if (z.verstehen.draengler >= VERSTEHEN_NACH) spaeter.push(['sprint', 'draengler']);
    }
  } else if (aktion === 'warten' && neben && z.staerken.warten) {
    // Ruhe fürs Warten: wer neben einem Gegner wartet und nicht getroffen wird
    erhoeheRuhe(s);
    ereignisse.push({ typ: 'ruhigGewartet', phase: 1, ruhe: s.ruhe });
  }

  // Phase 2: Gegner bewegen sich oder kündigen an
  planeGegner(z, dran, ereignisse, tat);
  oeffneTuer(z, ereignisse, 2); // der Kontrolleur kann gegangen sein
  // neue Stärken gelten ab dem nächsten Zug
  for (const [staerke, gegner] of spaeter) {
    const e = verstehe(z, staerke, gegner, 2);
    if (e) ereignisse.push(e);
  }
  return ereignisse;
}

function erhoeheRuhe(s) {
  if (s.ruhe >= RUHE_VOLL) return;
  s.ruhe += 1;
  if (s.ruhe === RUHE_VOLL) s.praesenz = true; // Präsenz: einmal je voller Ruhe
}

export function erzeugeSpiel(seed, optionen = {}) {
  const z = {
    seed: seed >>> 0,
    zufall: seed >>> 0,
    status: 'faehrt', // 'faehrt' | 'tot' | 'halt'
    wagenNr: optionen.startWagen || 0,
    wagen: null,
    spieler: { x: STARTFELD.x, y: STARTFELD.y, herzen: HERZEN_VOLL, ruhe: 0, praesenz: false },
    gegner: [],
    tuerOffen: false,
    zug: 0,
    zuegeImWagen: 0,
    naechsteId: 1,
    zaehler: { schritte: 0, schlaege: 0, gewartet: 0, ausgewichen: 0, treffer: 0, besiegt: 0, wagen: 0, aufgebrochen: 0 },
    staerken: {},
    verstehen: { pendler: 0, draengler: 0 }, // Zähler dieser Fahrt
    rueckhaltGenutzt: false,
  };
  for (const name of STAERKEN) z.staerken[name] = !!(optionen.staerken && optionen.staerken[name] === true);
  richteWagenEin(z);
  return { zustand: z, act: (aktion) => fuehreAus(z, aktion) };
}
