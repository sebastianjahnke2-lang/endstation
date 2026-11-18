// Eine Fahrt durch Wagen 7. Kennt weder Bildschirm noch Browser.
//
//   const fahrt = erzeugeFahrt();
//   const ereignisse = fahrt.act('links');
//
// Handlungen: 'hoch' | 'rechts' | 'runter' | 'links' | 'warten'
//             { tipp: 'feld', x, y }      ein Feld antippen: gehen oder benutzen
//             { tipp: 'lampe', name }     eine Leselampe antippen, name ist 'A' oder 'B'
//
// runde(zustand, handlung) ist eine reine Funktion: Sie gibt den neuen Zustand und die Liste
// der Ereignisse zurück und lässt den alten Zustand unberührt. Eine Eingabe, die nichts
// bewirkt, kostet keine Runde: Der Zustand bleibt derselbe, gemeldet wird nur die Reaktion.
//
// So läuft eine Runde:
//   Der Spieler macht genau eine Handlung: gehen, benutzen, anstoßen oder warten.
//   Danach antwortet die Welt in fester Reihenfolge:
//     1. Schatten neu bestimmen
//     2. ein Schritt des Schaffners
//     3. in jeder dritten Runde der Schienenstoß
//     4. Abschluss prüfen

import { GANGSPALTE, ZIELTUER, SCHAFFNERSTART, SPIELERPLATZ, TASCHENPLATZ, SCHLAEFERPLATZ, WACHERPLATZ, SCHRITTE, GEGENUEBER, LAMPEN, istGang, istSitz, reichweite } from './abteil.js';
import { sitztJemand, liegtTasche, bestimmeSchatten, falschBelegt } from './licht.js';
import { schaffnerVorhaben, schaffnerSchritt } from './schaffner.js';

export const STOSS_ALLE = 3; // in jeder dritten Runde ruckt der Zug

export function neueFahrt() {
  const z = {
    status: 'faehrt', // 'faehrt' | 'ende'
    runde: 0,
    spieler: { x: SPIELERPLATZ.x, y: SPIELERPLATZ.y, tasche: false, gelocht: false },
    tasche: true, // liegt auf dem Fensterplatz neben dem Spieler
    lampen: { A: 'fenster', B: 'fenster' },
    schlaefer: { wach: false, gelocht: false, gegruesst: false },
    wacher: { gelocht: false },
    // tat: was er zuletzt getan hat: 'kommt' | 'geht' | 'wartet' | 'locht' | 'gruesst' | 'steht' | 'geschoben' | 'weg'
    // ziel: worauf die Zange zeigt, solange er wartet. gesagt: Reihen, in denen der Satz schon fiel.
    // blick: wohin die Mütze nach einem Anstoßen zeigt
    schaffner: { y: SCHAFFNERSTART.y, weg: false, tat: 'kommt', ziel: null, gesagt: [], blick: null },
    angestossen: false, // die letzte Handlung war ein Anstoßen
    schatten: [],
    tatsachen: null, // steht nach der Tür fest
  };
  z.schatten = bestimmeSchatten(z);
  return z;
}

function kopie(z) {
  return JSON.parse(JSON.stringify(z));
}

function stehtSchaffner(z, x, y) {
  return !z.schaffner.weg && x === GANGSPALTE && y === z.schaffner.y;
}

// Zwischen den Reihen stehen Lehnen: von Sitz zu Sitz nur seitwärts, in eine Reihe nur vom Gang aus,
// zum Fensterplatz nur über den freien Gangplatz. Im Gang geht es hoch und runter.
function darfGehen(z, von, nach) {
  if (istGang(von.x, von.y) && istGang(nach.x, nach.y)) return Math.abs(von.y - nach.y) === 1;
  if (von.y !== nach.y || Math.abs(von.x - nach.x) !== 1) return false;
  if (!istGang(von.x, von.y) && !istSitz(von.x, von.y)) return false;
  if (!istGang(nach.x, nach.y) && !istSitz(nach.x, nach.y)) return false;
  if (istSitz(nach.x, nach.y) && (sitztJemand(z, nach.x, nach.y) || liegtTasche(z, nach.x, nach.y))) return false;
  return true;
}

function richtungZu(von, nach) {
  for (const name of Object.keys(SCHRITTE)) {
    if (von.x + SCHRITTE[name].x === nach.x && von.y + SCHRITTE[name].y === nach.y) return name;
  }
  return null;
}

function gehe(z, nach, richtung, ereignisse, rueckt) {
  const von = { x: z.spieler.x, y: z.spieler.y };
  z.spieler.x = nach.x;
  z.spieler.y = nach.y;
  ereignisse.push({ typ: 'schritt', von, nach: { x: nach.x, y: nach.y }, richtung, rueckt: rueckt === true });
  return true;
}

function nimmTasche(z, ereignisse) {
  z.tasche = false;
  z.spieler.tasche = true;
  ereignisse.push({ typ: 'nimmt', von: { x: TASCHENPLATZ.x, y: TASCHENPLATZ.y } });
  return true;
}

// Gegen den Schaffner wischen.
// Würde er in dieser Runde ohnehin weitergehen, rückt der Spieler einfach nach.
// Bleibt er stehen, ist es Anstoßen. Direkt noch einmal dagegen ist Vorbeidrängen.
function gegenSchaffner(z, richtung, ereignisse, warAngestossen) {
  const k = z.schaffner;
  const s = z.spieler;
  const von = { x: s.x, y: s.y };
  const sein = { x: GANGSPALTE, y: k.y };

  // Probe: Was täte er, wenn der Spieler seinen Platz schon verlassen hätte?
  const probe = kopie(z);
  probe.spieler.x = sein.x;
  probe.spieler.y = sein.y;
  probe.schatten = bestimmeSchatten(probe);
  const kommtEntgegen = von.x === GANGSPALTE && von.y === k.y - 1; // der Spieler steht auf dem Feld, auf das er will
  if (schaffnerVorhaben(probe).tat === 'geht' && !kommtEntgegen) {
    return gehe(z, sein, richtung, ereignisse, true);
  }

  if (warAngestossen) {
    // Vorbeidrängen: Der Spieler nimmt sein Feld. Er weicht auf das Feld aus, von dem der Spieler kam,
    // wenn es ein Gangfeld ist, sonst ein Gangfeld nach unten.
    const ausweich = istGang(von.x, von.y) ? von : { x: GANGSPALTE, y: k.y + 1 };
    ereignisse.push({ typ: 'draengt', richtung, von, nach: sein, schaffnerNach: { x: ausweich.x, y: ausweich.y } });
    s.x = sein.x;
    s.y = sein.y;
    k.y = ausweich.y;
    k.tat = 'geschoben';
    k.ziel = null;
    return true;
  }

  // Anstoßen: Er dreht die Mütze zum Spieler, sonst nichts.
  z.angestossen = true;
  k.blick = GEGENUEBER[richtung];
  ereignisse.push({ typ: 'anstoss', richtung, blick: k.blick });
  return true;
}

function wische(z, richtung, ereignisse, warAngestossen) {
  const s = z.spieler;
  const schritt = SCHRITTE[richtung];
  const von = { x: s.x, y: s.y };
  const nach = { x: s.x + schritt.x, y: s.y + schritt.y };
  if (stehtSchaffner(z, nach.x, nach.y)) return gegenSchaffner(z, richtung, ereignisse, warAngestossen);
  // gegen die Tasche wischen heißt: sie nehmen
  if (liegtTasche(z, nach.x, nach.y) && von.y === nach.y && istSitz(von.x, von.y)) return nimmTasche(z, ereignisse);
  if (darfGehen(z, von, nach)) return gehe(z, nach, richtung, ereignisse, false);
  ereignisse.push({ typ: 'gehtNicht', zu: nach });
  return false;
}

function tippeFeld(z, x, y, ereignisse) {
  const s = z.spieler;
  const ziel = { x, y };
  if (x === s.x && y === s.y) {
    ereignisse.push({ typ: 'nichts', zu: ziel });
    return false;
  }
  const nah = reichweite(s, ziel) <= 1;
  const zuWeit = () => {
    ereignisse.push({ typ: 'zuWeit', zu: ziel });
    return false;
  };
  const nichts = () => {
    ereignisse.push({ typ: 'nichts', zu: ziel });
    return false;
  };

  if (stehtSchaffner(z, x, y)) {
    if (!nah) return zuWeit();
    if (z.schaffner.tat !== 'wartet') return nichts();
    // Wartet er gerade, wiederholt er seinen Satz. Das kostet eine Runde.
    ereignisse.push({ typ: 'satz', reihe: y });
    return true;
  }
  if (liegtTasche(z, x, y)) return nah ? nimmTasche(z, ereignisse) : zuWeit();
  if (x === SCHLAEFERPLATZ.x && y === SCHLAEFERPLATZ.y) {
    if (!nah) return zuWeit();
    if (z.schlaefer.wach) return nichts();
    // Er wacht auf, sieht zum Schaffner, dann zum Nebensitz, hebt die Schultern, bleibt sitzen. Löst nichts.
    z.schlaefer.wach = true;
    ereignisse.push({ typ: 'weckt', schaffner: z.schaffner.weg ? null : { x: GANGSPALTE, y: z.schaffner.y } });
    return true;
  }
  if (x === WACHERPLATZ.x && y === WACHERPLATZ.y) return nah ? nichts() : zuWeit();

  // ein freies Nachbarfeld antippen heißt gehen
  const richtung = richtungZu(s, ziel);
  if (richtung && darfGehen(z, s, ziel)) return gehe(z, ziel, richtung, ereignisse, false);
  if (!nah) return zuWeit();
  ereignisse.push({ typ: 'gehtNicht', zu: ziel });
  return false;
}

// Die Lampe ist in Reichweite, wenn der Spieler im Paar sitzt oder höchstens ein Feld
// vom Gangplatz des Paares entfernt ist.
export function lampeInReichweite(z, name) {
  const lampe = LAMPEN[name];
  const s = z.spieler;
  const imPaar = s.y === lampe.reihe && (s.x === lampe.gangplatz || s.x === lampe.fensterplatz);
  return imPaar || reichweite(s, { x: lampe.gangplatz, y: lampe.reihe }) <= 1;
}

function tippeLampe(z, name, ereignisse) {
  if (!LAMPEN[name]) return false;
  if (!lampeInReichweite(z, name)) {
    ereignisse.push({ typ: 'zuWeit', lampe: name });
    return false;
  }
  z.lampen[name] = z.lampen[name] === 'fenster' ? 'gang' : 'fenster';
  ereignisse.push({ typ: 'lampe', name, stellung: z.lampen[name] });
  return true;
}

// Die Handlung des Spielers. Gibt zurück, ob sie eine Runde kostet.
function spielerHandelt(z, handlung, ereignisse, warAngestossen) {
  if (handlung === 'warten') {
    ereignisse.push({ typ: 'warten' });
    return true;
  }
  if (typeof handlung === 'string') {
    if (!SCHRITTE[handlung]) return false;
    return wische(z, handlung, ereignisse, warAngestossen);
  }
  if (handlung && handlung.tipp === 'feld') return tippeFeld(z, handlung.x, handlung.y, ereignisse);
  if (handlung && handlung.tipp === 'lampe') return tippeLampe(z, handlung.name, ereignisse);
  return false;
}

// 1. Schatten neu bestimmen. Meldet jeden Schatten, der wandert, entsteht oder vergeht.
function bestimmeSchattenNeu(z, ereignisse) {
  const alt = z.schatten;
  const neu = bestimmeSchatten(z);
  z.schatten = neu;
  for (const von of ['spieler', 'schlaefer']) {
    const a = alt.filter((s) => s.von === von)[0] || null;
    const n = neu.filter((s) => s.von === von)[0] || null;
    if (!a && !n) continue;
    if (a && n && a.x === n.x && a.y === n.y && a.wand === n.wand) continue;
    ereignisse.push({ typ: 'schatten', von, alt: a, neu: n });
    // Fällt ein Schatten auf das Feld des Schaffners, weicht er mit einem kleinen Schritt aus und kommt zurück.
    if (n && !n.wand && stehtSchaffner(z, n.x, n.y)) ereignisse.push({ typ: 'weichtAus', von });
  }
}

// Nach der Tür nennt die Anzeige höchstens zwei Tatsachen über den Wagen, in fester Rangfolge.
export function nenneTatsachen(z) {
  const liste = [];
  if (!z.schaffner.weg && z.schaffner.tat === 'wartet') liste.push({ art: 'wartet', reihe: z.schaffner.y });
  if (z.tasche) liste.push({ art: 'tasche' });
  if (z.schlaefer.wach) liste.push({ art: 'wach' });
  return liste.slice(0, 2);
}

function weltAntwortet(z, ereignisse) {
  bestimmeSchattenNeu(z, ereignisse);
  schaffnerSchritt(z, ereignisse);
  if (z.runde % STOSS_ALLE === 0) {
    const k = z.schaffner;
    // wartet er wegen eines Schattens, zuckt die Zange mit
    ereignisse.push({ typ: 'stoss', zange: !k.weg && k.tat === 'wartet' && k.ziel.was === 'schatten' });
  }
  if (z.spieler.x === ZIELTUER.x && z.spieler.y === ZIELTUER.y) {
    z.status = 'ende';
    z.tatsachen = nenneTatsachen(z);
    ereignisse.push({ typ: 'ende', tatsachen: z.tatsachen, lochung: z.spieler.gelocht, runde: z.runde });
  }
}

export function runde(alt, handlung) {
  if (alt.status !== 'faehrt') return { zustand: alt, ereignisse: [] };
  const z = kopie(alt);
  const ereignisse = [];
  // "Direkt noch einmal" gilt nur für die nächste Handlung, die Mütze dreht sich danach zurück.
  const warAngestossen = z.angestossen;
  z.angestossen = false;
  z.schaffner.blick = null;
  if (!spielerHandelt(z, handlung, ereignisse, warAngestossen)) return { zustand: alt, ereignisse };
  z.runde += 1;
  weltAntwortet(z, ereignisse);
  return { zustand: z, ereignisse };
}

// Wie im Hauptspiel: ein Ding mit zustand und act(). Der Zustand wird bei jeder Runde ersetzt.
export function erzeugeFahrt() {
  const fahrt = {
    zustand: neueFahrt(),
    act(handlung) {
      const ergebnis = runde(fahrt.zustand, handlung);
      fahrt.zustand = ergebnis.zustand;
      return ergebnis.ereignisse;
    },
  };
  return fahrt;
}

// Für Tests und das Testprotokoll: Ist in dieser Reihe gerade kein Sitz falsch belegt?
export function reiheFrei(z, reihe) {
  return falschBelegt(z, reihe).length === 0;
}
