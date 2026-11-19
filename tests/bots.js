// Drei Bots mit Spielstil. Sie sehen nur, was ein Spieler auch sieht:
// Figuren, Herzen, rote Felder, Hindernisse. Kein Blick in die Zukunft.
//
//   kaempfer      geht auf jeden zu und schlägt, auch auf rotem Feld
//   ausweicher    weicht immer aus, lässt alle kommen, schlägt nur ohne Risiko
//   ausgewogener  weicht aus, bringt aber Angeschlagene zu Ende und nutzt Gelegenheiten
//
// Am Kontrolleur: Der Kämpfer schlägt ihn wie jeden. Ausweicher und Ausgewogener lassen ihn
// in Ruhe, kümmern sich erst um die anderen und stellen sich dann ruhig in seine Nähe.
//
// Jeder Bot ist eine Funktion (zustand, merk) -> aktion. "merk" ist sein Gedächtnis für eine Fahrt.

import { RICHTUNG, RICHTUNGSNAMEN, TUERFELD, imFeld, feldNr, abstand, entfernungen, naechsterSchritt } from '../src/kern/feld.js';
import { istHindernis, gegnerAuf, istMarkiert, istVorderster } from '../src/kern/lage.js';
import { richtungVon, inSeinerNaehe } from '../src/kern/gegner.js';
import { erzeugeSpiel } from '../src/kern/spiel.js';
import { WAGENZAHL } from '../src/kern/wagen.js';

function offen(z, x, y) {
  return imFeld(x, y) && !istHindernis(z, x, y);
}

function umgebung(z, von = z.spieler) {
  return RICHTUNGSNAMEN.map((name) => {
    const x = von.x + RICHTUNG[name].x;
    const y = von.y + RICHTUNG[name].y;
    const drin = offen(z, x, y);
    const gegner = drin ? gegnerAuf(z, x, y) : null;
    return { name, x, y, drin, gegner, frei: drin && !gegner, rot: drin && istMarkiert(z, x, y) };
  });
}

function kontrolleurIn(z) {
  return z.gegner.find((g) => g.typ === 'kontrolleur') || null;
}

// Alle Gegner außer dem Kontrolleur: nur sie sind für Ausweicher und Ausgewogenen Ziele.
function ohneKontrolleur(z) {
  return { ...z, gegner: z.gegner.filter((g) => g.typ !== 'kontrolleur') };
}

// Nur noch der Kontrolleur steht zwischen Spieler und Tür: ruhig in seine Nähe stellen.
// Hinein nur von außen, denn wer sich in seiner Nähe bewegt, wird geprüft.
function amKontrolleur(z, k) {
  const s = z.spieler;
  const um = umgebung(z);
  if (istMarkiert(z, s.x, s.y)) {
    const frei = um.filter((n) => n.frei && !n.rot);
    const draussen = frei.filter((n) => !inSeinerNaehe(k, n));
    if (draussen.length) return draussen[0].name;
    return frei.length ? frei[0].name : 'warten';
  }
  if (inSeinerNaehe(k, s)) return 'warten';
  const hinein = um.find((n) => n.frei && inSeinerNaehe(k, n));
  if (hinein) return hinein.name;
  // zum nächsten Feld außerhalb seiner Nähe, von dem ein Schritt hineinführt
  const begehbar = (x, y) => !istHindernis(z, x, y) && !gegnerAuf(z, x, y) && !inSeinerNaehe(k, { x, y });
  const weit = entfernungen(s, begehbar);
  let ziel = null;
  let nah = Infinity;
  for (let y = 0; y < z.wagen.plan.length; y++) {
    for (let x = 0; x < z.wagen.plan[y].length; x++) {
      const d = weit[feldNr(x, y)];
      if (d <= 0 || d >= nah) continue;
      if (umgebung(z, { x, y }).some((n) => n.frei && inSeinerNaehe(k, n))) {
        nah = d;
        ziel = { x, y };
      }
    }
  }
  if (!ziel) return 'warten';
  const schritt = naechsterSchritt(s, entfernungen(ziel, begehbar), ziel);
  return schritt ? schritt.richtung : 'warten';
}

function zurTuer(z) {
  const s = z.spieler;
  if (s.x === TUERFELD.x && s.y === TUERFELD.y) return 'hoch';
  const weit = entfernungen(TUERFELD, (x, y) => !istHindernis(z, x, y));
  return naechsterSchritt(s, weit, TUERFELD).richtung;
}

// Gehweg vom Spieler zu jedem Gegner, um andere Gegner herum.
function wege(z) {
  const s = z.spieler;
  const weit = entfernungen(s, (x, y) => !istHindernis(z, x, y) && !gegnerAuf(z, x, y));
  return z.gegner
    .map((g) => {
      let d = Infinity;
      for (const n of umgebung(z, g)) {
        const w = n.drin ? weit[feldNr(n.x, n.y)] : -1;
        if (w >= 0 && w + 1 < d) d = w + 1;
      }
      return { g, d };
    })
    .sort((a, b) => a.d - b.d || a.g.id - b.g.id);
}

function schrittZu(z, g) {
  const weit = entfernungen(g, (x, y) => !istHindernis(z, x, y) && !gegnerAuf(z, x, y));
  return naechsterSchritt(z.spieler, weit, g);
}

function ansagerAufMir(z) {
  const s = z.spieler;
  return z.gegner.filter((g) => g.ansage && g.ansage.some((f) => f.x === s.x && f.y === s.y));
}

function schwaechster(nebenan) {
  return [...nebenan].sort((a, b) => a.gegner.hp - b.gegner.hp || a.gegner.id - b.gegner.id)[0];
}

// Wo der Drängler nach seinem Sturm steht, wenn der Spieler die Linie verlässt.
function landeplatz(z, g) {
  let ende = { x: g.x, y: g.y };
  for (const f of g.ansage) {
    if (gegnerAuf(z, f.x, f.y)) break;
    ende = f;
  }
  return ende;
}

function beweglichkeit(z, feld) {
  return umgebung(z, feld).filter((n) => n.frei).length;
}

function naechsterGegnerAbstand(z, feld) {
  let d = Infinity;
  for (const g of z.gegner) d = Math.min(d, abstand(g, feld));
  return d;
}

function bester(liste, wertung) {
  let wahl = liste[0];
  let hoch = -Infinity;
  for (const eintrag of liste) {
    const w = wertung(eintrag);
    if (w > hoch) {
      hoch = w;
      wahl = eintrag;
    }
  }
  return wahl;
}

// Eine Ecke ist ein Feld mit Wand oder Hindernis an zwei Seiten über Eck und zwei offenen Seiten.
// Wer dort steht, hat jede Linie des Drängler an sich enden: Er landet direkt daneben.
function istEcke(z, x, y) {
  if (!offen(z, x, y)) return false;
  const zu = (dx, dy) => !offen(z, x + dx, y + dy);
  const waagerecht = zu(-1, 0) !== zu(1, 0);
  const senkrecht = zu(0, -1) !== zu(0, 1);
  return waagerecht && senkrecht;
}

// Schritt zur nächsten Ecke, oder 'warten', wenn man schon in einer steht.
function zurEcke(z) {
  const s = z.spieler;
  if (istEcke(z, s.x, s.y)) return 'warten';
  const weit = entfernungen(s, (x, y) => !istHindernis(z, x, y) && !gegnerAuf(z, x, y));
  let ziel = null;
  let nah = Infinity;
  for (let y = 0; y < z.wagen.plan.length; y++) {
    for (let x = 0; x < z.wagen.plan[y].length; x++) {
      const d = weit[feldNr(x, y)];
      if (d > 0 && d < nah && istEcke(z, x, y) && !gegnerAuf(z, x, y)) {
        nah = d;
        ziel = { x, y };
      }
    }
  }
  if (!ziel) return null;
  const zurueck = entfernungen(ziel, (x, y) => !istHindernis(z, x, y) && !gegnerAuf(z, x, y));
  const schritt = naechsterSchritt(s, zurueck, ziel);
  return schritt && !istMarkiert(z, schritt.x, schritt.y) ? schritt.richtung : null;
}

function wacherDraengler(g) {
  return g.typ === 'draengler' && g.erschoepft === 0;
}

// ---------------------------------------------------------------- Kämpfer

export function kaempfer(z) {
  if (z.tuerOffen) return zurTuer(z);
  const um = umgebung(z);
  const nebenan = um.filter((n) => n.gegner);
  if (nebenan.length) return schwaechster(nebenan).name;
  for (const { g, d } of wege(z)) {
    if (d === Infinity) break;
    const schritt = schrittZu(z, g);
    if (schritt) return schritt.richtung;
  }
  return 'warten';
}

// ---------------------------------------------------------------- Ausweicher

export function ausweicher(z, merk) {
  if (z.tuerOffen) return zurTuer(z);
  const k = kontrolleurIn(z);
  if (k) return mitKontrolleur(z, merk, k, ausweicher);
  const s = z.spieler;
  const um = umgebung(z);
  const nebenan = um.filter((n) => n.gegner);
  const auswege = um.filter((n) => n.frei && !n.rot);

  if (istMarkiert(z, s.x, s.y)) {
    merk.geduld = 0;
    // Ein Schlag ohne Risiko: Er beendet den einzigen Angreifer, sein Angriff verfällt.
    const ansager = ansagerAufMir(z);
    if (ansager.length === 1 && ansager[0].hp <= 1 && abstand(ansager[0], s) === 1) return richtungVon(s, ansager[0]);
    if (auswege.length) {
      return bester(auswege, (n) => naechsterGegnerAbstand(z, n) * 2 + beweglichkeit(z, n)).name;
    }
    if (nebenan.length) return schwaechster(nebenan).name;
    return 'warten';
  }
  // Schlagen nur, wenn danach noch ein Ausweg bleibt oder der Schlag es beendet.
  if (nebenan.length) {
    const ziel = schwaechster(nebenan);
    if (ziel.gegner.hp <= 1 || auswege.length) {
      merk.geduld = 0;
      return ziel.name;
    }
  }
  // Ist der Nächste ein wacher Drängler, in einer Ecke auf ihn warten.
  const liste = wege(z).filter((e) => e.d !== Infinity);
  if (liste.length && wacherDraengler(liste[0].g)) {
    const weg = zurEcke(z);
    if (weg) return weg;
  }
  // Ein erschöpfter Drängler in Reichweite: hingehen.
  const muede = liste.find((e) => e.g.typ === 'draengler' && e.g.erschoepft > 0 && e.d <= 2);
  if (muede) {
    const schritt = schrittZu(z, muede.g);
    if (schritt && !istMarkiert(z, schritt.x, schritt.y)) return schritt.richtung;
  }
  // Kommen lassen. Erst nach langem Warten selbst hingehen.
  merk.geduld = (merk.geduld || 0) + 1;
  if (merk.geduld <= 6) return 'warten';
  for (const { g, d } of wege(z)) {
    if (d === Infinity) break;
    const schritt = schrittZu(z, g);
    if (schritt && !istMarkiert(z, schritt.x, schritt.y)) {
      if (d <= 2) merk.geduld = 0;
      return schritt.richtung;
    }
  }
  return 'warten';
}

// ---------------------------------------------------------------- Ausgewogener

function wertungAusweg(z, n) {
  let w = beweglichkeit(z, n);
  if (w <= 1) w -= 3; // Sackgasse
  for (const g of z.gegner) {
    const nah = abstand(g, n) === 1;
    if (g.typ === 'draengler') {
      if (g.ansage && abstand(landeplatz(z, g), n) === 1) w += 6; // neben seinem Landeplatz
      if (g.erschoepft > 0 && nah) w += 4;
    } else if (g.typ === 'pendler') {
      if (nah && !g.ansage && g.pause === 0) w -= 2; // er würde sofort wieder markieren
    }
  }
  return w;
}

function wertungZiel(z, n) {
  const g = n.gegner;
  let w = -g.hp;
  if (g.hp <= 1) w += 10;
  if (g.typ === 'draengler' && g.erschoepft > 0) w += 6;
  if (g.typ === 'gruppe' && istVorderster(z, g)) w += 4;
  return w;
}

export function ausgewogener(z, merk) {
  if (z.tuerOffen) return zurTuer(z);
  const k = kontrolleurIn(z);
  if (k) return mitKontrolleur(z, merk, k, ausgewogener);
  const s = z.spieler;
  const um = umgebung(z);
  const nebenan = um.filter((n) => n.gegner);

  if (istMarkiert(z, s.x, s.y)) {
    merk.geduld = 0;
    const ansager = ansagerAufMir(z);
    if (ansager.length === 1 && ansager[0].hp <= 1 && abstand(ansager[0], s) === 1) {
      return richtungVon(s, ansager[0]); // zu Ende bringen, sein Angriff verfällt
    }
    const auswege = um.filter((n) => n.frei && !n.rot);
    if (auswege.length) return bester(auswege, (n) => wertungAusweg(z, n)).name;
    if (nebenan.length) return bester(nebenan, (n) => wertungZiel(z, n)).name;
    return 'warten';
  }

  if (nebenan.length) {
    merk.geduld = 0;
    return bester(nebenan, (n) => wertungZiel(z, n)).name;
  }

  const liste = wege(z).filter((e) => e.d !== Infinity);
  if (!liste.length) return 'warten';

  // Ein erschöpfter Drängler ist eine Gelegenheit.
  const muede = liste.find((e) => e.g.typ === 'draengler' && e.g.erschoepft > 0);
  const { g, d } = muede || liste[0];
  const kommtVonSelbst = !muede;
  const geduld = merk.geduld || 0;
  if (wacherDraengler(g)) {
    const weg = zurEcke(z);
    if (weg) return weg;
  }
  if (kommtVonSelbst && d <= 2 && geduld < 3) {
    merk.geduld = geduld + 1;
    return 'warten';
  }
  const schritt = schrittZu(z, g);
  if (!schritt || istMarkiert(z, schritt.x, schritt.y)) {
    merk.geduld = geduld + 1;
    return 'warten';
  }
  merk.geduld = 0;
  return schritt.richtung;
}

// Im Wagen des Kontrolleurs: Sind andere da, spielt der Bot wie immer, sieht den Kontrolleur aber
// nur als Hindernis. Steht der Bot schon ruhig in seiner Nähe und ist nicht markiert, bleibt er stehen.
function mitKontrolleur(z, merk, k, bot) {
  const s = z.spieler;
  const andere = z.gegner.filter((g) => g !== k);
  if (!andere.length) return amKontrolleur(z, k);
  if (inSeinerNaehe(k, s) && !istMarkiert(z, s.x, s.y) && k.ruhig > 0) return 'warten';
  const ohne = ohneKontrolleur(z);
  const aktion = bot(ohne, merk);
  // nicht in ihn hineinlaufen: Das wäre ein Schlag
  if (aktion !== 'warten' && RICHTUNG[aktion] && s.x + RICHTUNG[aktion].x === k.x && s.y + RICHTUNG[aktion].y === k.y) return 'warten';
  // markiert und in seiner Nähe: lieber aus seiner Nähe hinaus ausweichen
  if (istMarkiert(z, s.x, s.y) && inSeinerNaehe(k, s) && RICHTUNG[aktion]) {
    const n = { x: s.x + RICHTUNG[aktion].x, y: s.y + RICHTUNG[aktion].y };
    if (inSeinerNaehe(k, n)) {
      const draussen = umgebung(z).find((m) => m.frei && !m.rot && !inSeinerNaehe(k, m));
      if (draussen) return draussen.name;
    }
  }
  return aktion;
}

export const BOTS = { kaempfer, ausweicher, ausgewogener };

// ---------------------------------------------------------------- eine Fahrt

const HOECHSTENS_ZUEGE = 1500;

// Lässt einen Bot eine Fahrt spielen. "fehlerquote" mischt zufällige Züge unter,
// als grobes Bild eines unaufmerksamen Spielers. Der Zufall dafür ist eigen und fest.
export function fahre(seed, bot, optionen = {}) {
  const spiel = erzeugeSpiel(seed, optionen);
  const z = spiel.zustand;
  const merk = {};
  const fehlerquote = optionen.fehlerquote || 0;
  let wurf = (seed * 2654435761) >>> 0;
  const zufall = () => {
    wurf = (Math.imul(wurf, 1664525) + 1013904223) >>> 0;
    return wurf / 4294967296;
  };
  const wagen = [];
  let aktuell = { nr: z.wagenNr, zuege: 0, treffer: 0, ausgewichen: 0, geschafft: false, meisteGegner: z.gegner.length, ruheVoll: 0 };
  let ungueltig = 0;

  for (let i = 0; i < HOECHSTENS_ZUEGE && z.status === 'faehrt'; i++) {
    let aktion = bot(z, merk);
    if (fehlerquote && zufall() < fehlerquote) aktion = [...RICHTUNGSNAMEN, 'warten'][Math.floor(zufall() * 5)];
    let ereignisse = spiel.act(aktion);
    if (ereignisse.length === 1 && ereignisse[0].typ === 'ungueltig') {
      ungueltig += 1;
      ereignisse = spiel.act('warten');
    }
    aktuell.zuege += 1;
    if (z.spieler.ruhe === 3) aktuell.ruheVoll += 1;
    for (const e of ereignisse) {
      if (e.typ === 'treffer') aktuell.treffer += 1;
      if (e.typ === 'ausgewichen') aktuell.ausgewichen += 1;
      if (e.typ === 'tod') aktuell.todDurch = e.durch;
      if (e.typ === 'wagenwechsel' || e.typ === 'halt') {
        aktuell.geschafft = true;
        aktuell.herzen = z.spieler.herzen;
        wagen.push(aktuell);
        if (e.typ === 'wagenwechsel') {
          aktuell = { nr: z.wagenNr, zuege: 0, treffer: 0, ausgewichen: 0, geschafft: false, meisteGegner: z.gegner.length, ruheVoll: 0 };
        }
      }
    }
  }
  if (z.status !== 'halt') {
    aktuell.herzen = z.spieler.herzen;
    wagen.push(aktuell);
  }
  return {
    seed,
    status: z.status === 'faehrt' ? 'haengt' : z.status,
    wagen,
    geschaffteWagen: wagen.filter((w) => w.geschafft).length,
    zuege: z.zug,
    herzen: z.spieler.herzen,
    ungueltig,
    wagenzahl: WAGENZAHL,
  };
}
