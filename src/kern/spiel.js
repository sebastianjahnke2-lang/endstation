// Der Spielkern. Kennt weder Bildschirm noch Browser.
//
//   const spiel = erzeugeSpiel(seed);
//   const ereignisse = spiel.act('hoch');   // 'hoch' | 'rechts' | 'runter' | 'links' | 'warten'
//                                           // 'sprint-hoch' usw., wer den Drängler verstanden hat
//   erzeugeSpiel(seed, { staerken: { sprint, rueckhalt, warten } })   Stärken aus früheren Fahrten
//   erzeugeSpiel(seed, { fahrkarte })    die Fahrkarte mit ihren Lochungen, siehe fahrkarte.js
//   erzeugeSpiel(seed, { begleiter })    die Todesursache der vorigen Fahrt: Er sitzt im Speisewagen
//   erzeugeSpiel(seed, { szene })        der Wagen, in dem sie endete: Der Begleiter wiederholt ihn
//   Welche Optionen eine neue Fahrt bekommt, sagt optionenFuerFahrt() in reise.js.
//
// act() ändert spiel.zustand und gibt zurück, was dabei passiert ist.
// Jedes Ereignis trägt eine Phase: 0 Spieler, 1 Angriffe treffen ein, 2 Gegner bewegen sich.
// Eine ungültige Eingabe ändert nichts und kostet keinen Zug.

import { RICHTUNG, STARTFELD, TUERFELD, imFeld } from './feld.js';
import { istHindernis, gegnerAuf, istMarkiert, tuerFrei } from './lage.js';
import { WAGENZAHL, baueWagen } from './wagen.js';
import { wuerfle } from './zufall.js';
import { bereinigeFahrkarte, stelleAngebot, nimmAn, beobachte, werteWagenAus, lochungFuerTod, lochungFuerVerstehen, helleLochungen } from './fahrkarte.js';
import { ANTWORTARTEN, bereinigeSzene, setzeBegleiter, sprichMitBegleiter } from './begleiter.js';
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
export const SPRINT_KOSTET = 1; // Ruhe, im sicheren Wagen nichts: Dort probiert man ihn gefahrlos aus
// Sprint einführen: Wer den Drängler verstanden hat, findet ihn im Speisewagen stehend in der Engstelle.
// Ein Sprint führt an ihm vorbei. Wer stattdessen vor ihm wartet oder ihn anstößt, dem macht er nach
// so vielen Zügen Platz. Danach sitzt er an seinem Tisch.
export const PLATZ_NACH = 2;

// Gönnen: Im Speisewagen kann man an einem Tisch ein Herz lassen. Meistens kommt nichts zurück,
// manchmal sitzt bei einer späteren Fahrt jemand mehr am Tisch.
export const GOENNEN_ZURUECK = 3; // einer von drei Würfen
export const MEHR_AM_TISCH_HOECHSTENS = 5;
const MEHR_TYPEN = ['gruppe', 'pendler', 'draengler'];

// szene: nur für die Wiederholung, { nr, zufall }. Dann entsteht der Wagen aus dem gemerkten Zufall,
// ohne Angebot und ohne Begleiter, und der Zufall der Fahrt bleibt unberührt.
function richteWagenEin(z, szene) {
  const quelle = szene ? { zufall: szene.zufall } : z;
  const anfang = quelle.zufall; // damit sich der Wagen nach einem Tod genau so wiederholen lässt
  const wagen = baueWagen(z.wagenNr, quelle);
  z.wagen = { nr: wagen.nr, art: wagen.art, plan: wagen.plan, gespiegelt: wagen.gespiegelt, anfang };
  z.gegner = wagen.gegner.map((vorgabe) => neuerGegner(z.naechsteId++, vorgabe));
  z.wagen.mitKontrolleur = z.gegner.some((g) => g.typ === 'kontrolleur');
  z.wagen.mitGruppe = z.gegner.some((g) => g.typ === 'gruppe');
  z.wagen.sicher = wagen.sicher;
  z.wagen.heilt = wagen.heilt;
  // an den Tischen sitzt, wen der Spieler verstanden hat
  z.wagen.fahrgaeste = wagen.fahrgaeste.filter((f) => z.staerken[f.staerke]).map((f) => ({ typ: f.typ, x: f.x, y: f.y }));
  const mehr = Math.min(z.mehrAmTisch, wagen.mehrPlaetze.length);
  for (let i = 0; i < mehr; i++) z.wagen.fahrgaeste.push({ typ: MEHR_TYPEN[i % MEHR_TYPEN.length], x: wagen.mehrPlaetze[i].x, y: wagen.mehrPlaetze[i].y });
  z.wagen.gegoennt = null;
  z.wagen.imWeg = null;
  if (!szene && wagen.engstelle) {
    const f = z.wagen.fahrgaeste.find((x) => x.typ === 'draengler');
    if (f) {
      f.sitz = { x: f.x, y: f.y };
      f.x = wagen.engstelle.x;
      f.y = wagen.engstelle.y;
      z.wagen.imWeg = { x: f.x, y: f.y, geduld: 0 };
    }
  }
  z.wagen.typen = [...new Set(z.gegner.map((g) => g.typ))]; // für das Aufhellen dunkler Lochungen
  z.getroffenVon = [];
  if (szene) {
    z.angebot = null;
    z.pruefung = null;
    z.begleiter = null;
  } else {
    stelleAngebot(z);
    setzeBegleiter(z, wagen.begleiterPlatz);
  }
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
  z.todDurch = durch;
  z.todSzene = { nr: z.wagenNr, zufall: z.wagen.anfang };
  ereignisse.push({ typ: 'tod', phase, wagenNr: z.wagenNr, durch, uebrig: z.gegner.length });
  lochungFuerTod(z, durch, ereignisse, phase);
}

// Eine Stärke kommt hinzu. Gibt das Ereignis zurück oder null, wenn sie schon da war.
// In der Wiederholung zählt nichts für die Reise.
function verstehe(z, staerke, gegner, phase) {
  if (z.probe || z.staerken[staerke]) return null;
  z.staerken[staerke] = true;
  return { typ: 'verstanden', phase, staerke, gegner };
}

// Der stehende Drängler in der Engstelle des Speisewagens
function imWegAuf(z, x, y) {
  const w = z.wagen.imWeg;
  return w && w.x === x && w.y === y ? w : null;
}

function nebenImWeg(z) {
  const w = z.wagen.imWeg;
  return !!w && Math.abs(w.x - z.spieler.x) + Math.abs(w.y - z.spieler.y) === 1;
}

// Er geht an seinen Tisch und setzt sich.
function machtPlatz(z, ereignisse, phase, wie) {
  const w = z.wagen.imWeg;
  const f = z.wagen.fahrgaeste.find((x) => x.typ === 'draengler' && x.sitz);
  z.wagen.imWeg = null;
  if (!f) return;
  const von = { x: f.x, y: f.y };
  f.x = f.sitz.x;
  f.y = f.sitz.y;
  delete f.sitz;
  ereignisse.push({ typ: 'platzGemacht', phase, wie, von, nach: { x: f.x, y: f.y }, geduld: w ? w.geduld : 0 });
}

function nebenGegner(z, typ) {
  const s = z.spieler;
  return z.gegner.some((g) => (!typ || g.typ === typ) && Math.abs(g.x - s.x) + Math.abs(g.y - s.y) === 1);
}

// Wiederholung: Der Begleiter spielt den Wagen, in dem die vorige Fahrt endete, noch einmal.
// Gefahrlos: Kein Treffer und kein Aufbrechen kostet ein Herz. Folgenlos: kein Angebot, keine Lochung,
// keine Stärke. Hinaus geht es durch die Tür oder mit einem Schritt nach unten vom Startfeld,
// danach ist alles wie vorher, nur die Uhr ist weitergelaufen.
function beginneProbe(z, ereignisse) {
  const szene = z.begleiter.szene;
  z.probe = {
    zurueck: {
      wagenNr: z.wagenNr,
      wagen: z.wagen,
      gegner: z.gegner,
      tuerOffen: z.tuerOffen,
      tuerStoesse: z.tuerStoesse,
      aufgebrochen: z.aufgebrochen,
      zuegeImWagen: z.zuegeImWagen,
      getroffenVon: z.getroffenVon,
      angebot: z.angebot,
      pruefung: z.pruefung,
      begleiter: z.begleiter,
      spieler: { ...z.spieler },
      verstehen: { ...z.verstehen },
      zaehler: { ...z.zaehler },
    },
  };
  z.wagenNr = szene.nr;
  richteWagenEin(z, szene);
  ereignisse.push({ typ: 'probe', phase: 1, nr: z.wagenNr });
}

function endeProbe(z) {
  const r = z.probe.zurueck;
  z.probe = null;
  for (const name of ['wagenNr', 'wagen', 'gegner', 'tuerOffen', 'tuerStoesse', 'aufgebrochen', 'zuegeImWagen', 'getroffenVon', 'angebot', 'pruefung', 'begleiter', 'verstehen', 'zaehler']) z[name] = r[name];
  Object.assign(z.spieler, r.spieler);
  return [{ typ: 'probeEnde', phase: 0, nr: z.wagenNr }];
}

function wechsleWagen(z) {
  z.zug += 1;
  if (z.probe) return endeProbe(z); // durch die Tür der Wiederholung: zurück in den Speisewagen
  z.zaehler.schritte += 1;
  z.zaehler.wagen += 1;
  // die Reisegruppe versteht, wer ihren Wagen mit einem Herz verlässt
  const gruppe = z.wagen.mitGruppe && z.spieler.herzen === 1 ? verstehe(z, 'rueckhalt', 'gruppe', 0) : null;
  const karte = [];
  if (gruppe) {
    karte.push(gruppe);
    lochungFuerVerstehen(z, 'gruppe', karte, 0); // noch im Wagen der Reisegruppe
  }
  werteWagenAus(z, karte, 0); // laufende Prüfung und dunkle Lochungen, solange der alte Wagen noch gilt
  const ereignisse = [];
  if (z.wagenNr + 1 >= WAGENZAHL) {
    // Halt: Jeder steigt aus. Der Schaffner locht, wenn helle Lochungen da sind, sonst nickt er.
    z.status = 'halt';
    z.halt = { hell: helleLochungen(z.fahrkarte) };
    ereignisse.push({ typ: 'halt', phase: 0, ...z.halt });
  } else {
    z.wagenNr += 1;
    richteWagenEin(z);
    ereignisse.push({ typ: 'wagenwechsel', phase: 0, nr: z.wagenNr });
    if (z.wagen.heilt) {
      const vorher = z.spieler.herzen;
      z.spieler.herzen = Math.min(HERZEN_VOLL, vorher + z.wagen.heilt);
      ereignisse.push({ typ: 'geheilt', phase: 0, herzen: z.spieler.herzen, plus: z.spieler.herzen - vorher });
    }
  }
  return ereignisse.concat(karte);
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
  const imWeg = weg.some((f) => imWegAuf(z, f.x, f.y));
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
  for (const f of weg) if (!gegnerAuf(z, f.x, f.y) && !imWegAuf(z, f.x, f.y)) nach = f;
  const von = { x: s.x, y: s.y };
  if (!z.wagen.sicher) s.ruhe -= SPRINT_KOSTET;
  s.praesenz = false;
  ereignisse.push({ typ: 'sprint', phase: 0, richtung, von, nach, getroffen, ruhe: s.ruhe });
  if (nach) {
    s.x = nach.x;
    s.y = nach.y;
    z.zaehler.schritte += 1;
  }
  if (imWeg && nach) machtPlatz(z, ereignisse, 0, 'sprint'); // vorbeigedrängelt, er setzt sich
  oeffneTuer(z, ereignisse, 0);
  const kontrolleur = getroffen.find((t) => t.gegner === 'kontrolleur');
  const tat = kontrolleur ? { art: 'schlag', id: kontrolleur.id } : nach ? { art: 'schritt', von } : { art: 'stoss' };
  tat.sprintTreffer = getroffen.length > 0;
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
  const vorIhm = nebenImWeg(z); // stand schon vor dem in der Engstelle
  let nochmal = false; // auf „Noch mal" getreten: Die Wiederholung beginnt nach diesem Schritt

  // Phase 0: der Spieler
  if (typeof aktion === 'string' && aktion.startsWith('sprint-')) {
    const richtung = aktion.slice(7);
    if (!RICHTUNG[richtung] || !z.staerken.sprint) return [];
    if (s.ruhe < SPRINT_KOSTET && !z.wagen.sicher) return [{ typ: 'ungueltig', phase: 0, richtung, tuer: false }];
    const ergebnis = sprinte(z, richtung, ereignisse);
    if (!ergebnis) return [{ typ: 'ungueltig', phase: 0, richtung, tuer: false }];
    bewegt = ergebnis.bewegt;
    tat = ergebnis.tat;
    zielRot = bewegt && istMarkiert(z, s.x, s.y);
    if (zielRot) ereignisse.find((e) => e.typ === 'sprint').rot = true;
    if (bewegt) {
      nimmAn(z, ereignisse);
      nochmal = sprichMitBegleiter(z, ereignisse);
    }
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
    if (z.probe && aktion === 'runter' && s.x === STARTFELD.x && s.y === STARTFELD.y) {
      z.zug += 1;
      return endeProbe(z); // aus der Wiederholung nach unten hinaus
    }
    const amTisch = z.wagen.sicher && imFeld(x, y) && z.wagen.plan[y][x] === 'T';
    if (amTisch) {
      // einmal je Besuch, und nie das letzte Herz: Im sicheren Ort passiert nichts Schlimmes
      if (z.wagen.gegoennt || s.herzen <= 1) return [{ typ: 'ungueltig', phase: 0, richtung: aktion, tuer: false }];
      s.herzen -= 1;
      z.wagen.gegoennt = { x, y };
      const zurueck = wuerfle(z, GOENNEN_ZURUECK) === 0;
      if (zurueck) z.mehrAmTisch = Math.min(MEHR_AM_TISCH_HOECHSTENS, z.mehrAmTisch + 1);
      ereignisse.push({ typ: 'gegoennt', phase: 0, x, y, herzen: s.herzen, zurueck, mehrAmTisch: z.mehrAmTisch });
      tat = { art: 'stoss' };
    }
    const stehtImWeg = !amTisch && !anDerTuer && imWegAuf(z, x, y);
    if (stehtImWeg) {
      // gegen den, der in der Engstelle steht: Er rührt sich nicht gleich, der Zug ist vertan
      tat = { art: 'stoss' };
      ereignisse.push({ typ: 'angestossen', phase: 0, richtung: aktion, x, y });
    }
    if (!stehtImWeg && !amTisch && !anDerTuer && (!imFeld(x, y) || istHindernis(z, x, y))) return [{ typ: 'ungueltig', phase: 0, richtung: aktion, tuer: false }];
    const g = anDerTuer || amTisch || stehtImWeg ? null : gegnerAuf(z, x, y);
    if (amTisch || stehtImWeg) {
      // schon erledigt
    } else if (anDerTuer) {
      // Aufbrechen: Jede Tür gibt nach dreimal Dagegenlaufen nach und kostet ein Herz.
      tat = { art: 'stoss' };
      z.tuerStoesse += 1;
      ereignisse.push({ typ: 'tuerStoss', phase: 0, n: z.tuerStoesse });
      if (z.tuerStoesse >= AUFBRECHEN_STOESSE) {
        z.tuerOffen = true;
        z.aufgebrochen = true;
        s.herzen = Math.max(0, s.herzen - (z.probe ? 0 : AUFBRECHEN_KOSTET));
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
      ereignisse.push({ typ: 'schritt', phase: 0, richtung: aktion, von: { x: s.x, y: s.y }, nach: { x, y }, rot: zielRot });
      s.x = x;
      s.y = y;
      bewegt = true;
      z.zaehler.schritte += 1;
      nimmAn(z, ereignisse); // auf das leuchtende Symbol treten heißt: die Prüfung annehmen
      nochmal = sprichMitBegleiter(z, ereignisse);
    }
  }
  z.zug += 1;
  z.zuegeImWagen += 1;
  // wer vor ihm wartet oder ihn anstößt, dem macht er nach PLATZ_NACH Zügen Platz
  if (vorIhm && nebenImWeg(z)) {
    z.wagen.imWeg.geduld += 1;
    if (z.wagen.imWeg.geduld >= PLATZ_NACH) machtPlatz(z, ereignisse, 0, 'geduld');
  }
  if (nochmal) {
    beginneProbe(z, ereignisse); // im Speisewagen geschieht in diesem Zug sonst nichts
    return ereignisse;
  }

  // Phase 1: angekündigte Angriffe treffen ein
  const { treffer, dran } = loeseAnsagenEin(z, ereignisse);
  if (treffer) {
    // höchstens ein Treffer je Zug, egal wie viele treffen. Er kostet ein Herz, beim Kontrolleur zwei,
    // in der Wiederholung keines.
    const schaden = z.probe ? 0 : schadenVon(treffer);
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
    if (!z.getroffenVon.includes(treffer.typ)) z.getroffenVon.push(treffer.typ);
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

  beobachte(z, tat, !!treffer, zielRot);

  // Phase 2: Gegner bewegen sich oder kündigen an
  planeGegner(z, dran, ereignisse, tat);
  oeffneTuer(z, ereignisse, 2); // der Kontrolleur kann gegangen sein
  // Verstehen locht: den Kontrolleur durchschaut
  if (ereignisse.some((e) => e.typ === 'durchgewinkt')) lochungFuerVerstehen(z, 'kontrolleur', ereignisse, 2);
  // neue Stärken gelten ab dem nächsten Zug, und jede neue locht
  for (const [staerke, gegner] of spaeter) {
    const e = verstehe(z, staerke, gegner, 2);
    if (e) {
      ereignisse.push(e);
      lochungFuerVerstehen(z, gegner, ereignisse, 2);
    }
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
    mehrAmTisch: Math.max(0, Math.min(MEHR_AM_TISCH_HOECHSTENS, Math.floor(optionen.mehrAmTisch) || 0)),
    verstehen: { pendler: 0, draengler: 0 }, // Zähler dieser Fahrt
    rueckhaltGenutzt: false,
    fahrkarte: bereinigeFahrkarte(optionen.fahrkarte),
    kartenzufall: { zufall: (seed ^ 0x9e3779b9) >>> 0 }, // eigener Zufall für die Angebote
    angebot: null, // { id, x, y }: das leuchtende Symbol im Wagen
    pruefung: null, // die angenommene Prüfung, bis zum Verlassen des Wagens
    begleiterDurch: ANTWORTARTEN.includes(optionen.begleiter) && optionen.begleiter !== 'pech' ? optionen.begleiter : null,
    begleiterSzene: bereinigeSzene(optionen.szene),
    begleiter: null, // { durch, szene, x, y, antworten, gesprochen, wiederholen }, nur im Speisewagen
    probe: null, // die Wiederholung: { zurueck } mit allem, was danach wieder gilt
    todDurch: null,
    todSzene: null, // { nr, zufall }: der Wagen, in dem die Fahrt endete
    halt: null, // { hell } am Ende der Fahrt: so viele helle Lochungen trägt die Karte
  };
  for (const name of STAERKEN) z.staerken[name] = !!(optionen.staerken && optionen.staerken[name] === true);
  richteWagenEin(z);
  return { zustand: z, act: (aktion) => fuehreAus(z, aktion) };
}
