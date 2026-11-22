// Fuzz-Test: viele Fahrten mit Zufallseingaben. Nach jeder Eingabe wird geprüft,
// dass der Zustand stimmt und keine Regel verletzt wurde.

import test from 'node:test';
import assert from 'node:assert/strict';
import { BREITE, HOEHE, TUERFELD, RICHTUNG, RICHTUNGSNAMEN, imFeld, feldNr, entfernungen, naechsterSchritt } from '../src/kern/feld.js';
import { istHindernis, istMarkiert, tuerFrei } from '../src/kern/lage.js';
import { erzeugeSpiel, HERZEN_VOLL, RUHE_VOLL } from '../src/kern/spiel.js';
import { GEGNERWERTE } from '../src/kern/gegner.js';
import { WAGENZAHL } from '../src/kern/wagen.js';
import { optionenFuerFahrt, SPEISEWAGEN_NR } from '../src/kern/reise.js';
import { BOTS } from './bots.js';

const AKTIONEN = [...RICHTUNGSNAMEN, 'warten'];

function zufallsquelle(seed) {
  let s = seed >>> 0;
  return () => {
    s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
    return s / 4294967296;
  };
}

function pruefeZustand(z, wo) {
  const s = z.spieler;
  assert.ok(imFeld(s.x, s.y) && !istHindernis(z, s.x, s.y), `${wo}: Spieler steht falsch (${s.x},${s.y})`);
  assert.ok(s.herzen >= 0 && s.herzen <= HERZEN_VOLL, `${wo}: Herzen ${s.herzen}`);
  assert.ok(s.ruhe >= 0 && s.ruhe <= RUHE_VOLL, `${wo}: Ruhe ${s.ruhe}`);
  assert.ok(!s.praesenz || s.ruhe === RUHE_VOLL, `${wo}: Präsenz ohne volle Ruhe`);
  assert.ok(z.gegner.length <= 6, `${wo}: ${z.gegner.length} Gegner gleichzeitig`);
  assert.equal(z.status === 'tot', s.herzen === 0, `${wo}: Status ${z.status} bei ${s.herzen} Herzen`);

  const belegt = new Map([[feldNr(s.x, s.y), 'Spieler']]);
  for (const g of z.gegner) {
    assert.ok(imFeld(g.x, g.y) && !istHindernis(z, g.x, g.y), `${wo}: ${g.typ} steht falsch (${g.x},${g.y})`);
    assert.ok(!belegt.has(feldNr(g.x, g.y)), `${wo}: ${g.typ} überlappt mit ${belegt.get(feldNr(g.x, g.y))} auf ${g.x},${g.y}`);
    belegt.set(feldNr(g.x, g.y), g.typ);
    assert.ok(g.hp >= 1 && g.hp <= GEGNERWERTE[g.typ].hp, `${wo}: ${g.typ} mit ${g.hp} HP`);
    if (g.typ === 'kontrolleur') assert.deepEqual([g.x, g.y], [g.posten.x, g.posten.y], `${wo}: der Kontrolleur hat seinen Platz verlassen`);
    if (g.ansage) {
      assert.ok(g.ansage.length > 0, `${wo}: leere Ansage`);
      for (const f of g.ansage) {
        assert.ok(imFeld(f.x, f.y) && !istHindernis(z, f.x, f.y), `${wo}: Ansage außerhalb (${f.x},${f.y})`);
        // mit einem Schritt verlassbar: ein Nachbarfeld im Wagen gehört nicht zum selben Muster
        const ausweg = RICHTUNGSNAMEN.some((n) => {
          const x = f.x + RICHTUNG[n].x;
          const y = f.y + RICHTUNG[n].y;
          return imFeld(x, y) && !g.ansage.some((m) => m.x === x && m.y === y);
        });
        assert.ok(ausweg, `${wo}: Muster von ${g.typ} lässt sich bei ${f.x},${f.y} nicht verlassen`);
      }
    }
  }

  // Steht der Spieler auf Rot, gibt es für jedes Muster einen Schritt hinaus: ein Nachbarfeld
  // ohne Hindernis, das nicht zum Muster gehört und auf dem nicht der Angreifer selbst steht.
  for (const g of z.gegner) {
    if (!g.ansage || !g.ansage.some((f) => f.x === s.x && f.y === s.y)) continue;
    const ausweg = RICHTUNGSNAMEN.some((n) => {
      const x = s.x + RICHTUNG[n].x;
      const y = s.y + RICHTUNG[n].y;
      return imFeld(x, y) && !istHindernis(z, x, y) && !(g.x === x && g.y === y) && !g.ansage.some((m) => m.x === x && m.y === y);
    });
    assert.ok(ausweg, `${wo}: Aus dem Muster von ${g.typ} führt bei ${s.x},${s.y} kein Schritt hinaus`);
  }

  // Fahrkarte: jede Prüfung höchstens einmal gelocht, je Todesursache höchstens eine dunkle Lochung
  const ids = z.fahrkarte.lochungen.filter((l) => l.art === 'pruefung').map((l) => l.id);
  assert.equal(new Set(ids).size, ids.length, `${wo}: doppelte Lochung`);
  const dunkel = z.fahrkarte.lochungen.filter((l) => l.art === 'tod' && !l.hell).map((l) => l.durch);
  assert.equal(new Set(dunkel).size, dunkel.length, `${wo}: doppelte dunkle Lochung`);
  if (z.angebot) {
    assert.ok(!istHindernis(z, z.angebot.x, z.angebot.y), `${wo}: Angebot im Hindernis`);
    assert.ok(!ids.includes(z.angebot.id), `${wo}: Angebot schon gelocht`);
    assert.ok(!z.wagen.sicher, `${wo}: Angebot im sicheren Wagen`);
  }
  if (z.probe) assert.ok(!z.angebot && !z.pruefung && !z.begleiter && !z.wagen.sicher, `${wo}: Wiederholung mit Angebot, Begleiter oder im sicheren Wagen`);

  // Tür immer erreichbar, alle freien Felder verbunden
  const weit = entfernungen(TUERFELD, (x, y) => !istHindernis(z, x, y));
  for (let y = 0; y < HOEHE; y++) {
    for (let x = 0; x < BREITE; x++) {
      if (!istHindernis(z, x, y)) assert.ok(weit[feldNr(x, y)] >= 0, `${wo}: von ${x},${y} führt kein Weg zur Tür`);
    }
  }
  // Die Tür ist offen, wenn kein Gegner mehr steht (im Wagen des Kontrolleurs: wenn er fort ist)
  // oder wenn sie aufgebrochen wurde. Sonst ist sie zu.
  if (z.status === 'faehrt') assert.equal(z.tuerOffen, tuerFrei(z) || z.aufgebrochen, `${wo}: Tür ${z.tuerOffen ? 'offen' : 'zu'}`);
}

function eineFahrt(seed, waehle, optionen) {
  const spiel = erzeugeSpiel(seed, optionen);
  const z = spiel.zustand;
  pruefeZustand(z, `Seed ${seed}, Anfang`);
  for (let i = 0; i < 400 && z.status === 'faehrt'; i++) {
    const aktion = waehle(z);
    const wo = `Seed ${seed}, Eingabe ${i} (${aktion}), Wagen ${z.wagenNr + 1}`;
    const vorher = JSON.stringify(z);
    const alt = { herzen: z.spieler.herzen, ruhe: z.spieler.ruhe, x: z.spieler.x, y: z.spieler.y, wagenNr: z.wagenNr, zug: z.zug, rueckhalt: z.rueckhaltGenutzt, warten: z.staerken.warten, probe: z.probe ? JSON.stringify(z.probe.zurueck) : null, folgen: JSON.stringify([z.fahrkarte, z.staerken]) };
    const rotVorher = [];
    for (let y = 0; y < HOEHE; y++) for (let x = 0; x < BREITE; x++) if (!istHindernis(z, x, y) && istMarkiert(z, x, y)) rotVorher.push(feldNr(x, y));

    const ereignisse = spiel.act(aktion);
    const typen = ereignisse.map((e) => e.typ);

    if (!typen.length || typen[0] === 'ungueltig') { // Sprint ohne die Stärke: Es geschieht gar nichts
      assert.equal(JSON.stringify(z), vorher, `${wo}: ungültige Eingabe hat etwas verändert`);
      continue;
    }
    assert.equal(z.zug, alt.zug + 1, `${wo}: Zugzähler`);
    pruefeZustand(z, wo);
    if (typen.includes('wagenwechsel') || typen.includes('halt')) {
      // nur der Speisewagen heilt beim Hineingehen
      const heil = ereignisse.find((e) => e.typ === 'geheilt');
      assert.equal(z.spieler.herzen, heil ? Math.min(HERZEN_VOLL, alt.herzen + z.wagen.heilt) : alt.herzen, `${wo}: Herzen beim Wagenwechsel`);
      assert.equal(!!heil, z.status === 'faehrt' && z.wagen.heilt > 0, `${wo}: Heilen beim Wagenwechsel`);
      continue;
    }
    // Wiederholung beim Begleiter: gefahrlos, folgenlos, und danach ist alles wie vorher
    if (alt.probe) assert.equal(JSON.stringify([z.fahrkarte, z.staerken]), alt.folgen, `${wo}: die Wiederholung hat Folgen`);
    if (typen.includes('probe') || typen.includes('probeEnde')) {
      assert.equal(z.spieler.herzen, alt.herzen, `${wo}: Herzen beim Wechsel in die Wiederholung oder zurück`);
      if (typen.includes('probe')) {
        assert.ok(z.probe && !alt.probe && z.wagenNr !== SPEISEWAGEN_NR && [z.spieler.x, z.spieler.y].join() === '2,7', `${wo}: Wiederholung beginnt falsch`);
      } else {
        const zurueck = JSON.parse(alt.probe);
        assert.ok(!z.probe && z.wagen.sicher, `${wo}: Wiederholung endet falsch`);
        assert.deepEqual(z.spieler, zurueck.spieler, `${wo}: nach der Wiederholung steht der Spieler anders da als vorher`);
        assert.deepEqual([z.wagen, z.zaehler, z.verstehen], [zurueck.wagen, zurueck.zaehler, zurueck.verstehen], `${wo}: nach der Wiederholung ist etwas anders`);
      }
      continue;
    }
    // Im sicheren Wagen passiert nie etwas Schlimmes. Ein Herz geht dort nur, wer es selbst am Tisch lässt.
    const gegoennt = typen.includes('gegoennt') ? 1 : 0;
    if (gegoennt) assert.ok(z.wagen.sicher && alt.herzen > 1, `${wo}: gegönnt außerhalb des Speisewagens oder das letzte Herz`);
    if (z.wagen.sicher) {
      assert.equal(z.gegner.length, 0, `${wo}: Gegner im sicheren Wagen`);
      assert.ok(z.spieler.herzen >= alt.herzen - gegoennt, `${wo}: Herz verloren im sicheren Wagen`);
      assert.ok(z.spieler.herzen > 0, `${wo}: Tod im sicheren Wagen`);
    }

    // kein Angriff ohne Ankündigung, höchstens ein Treffer je Zug. Er kostet ein Herz, beim Kontrolleur
    // zwei. Aufbrechen kostet ein Herz.
    const verlust = alt.herzen - z.spieler.herzen;
    const treffer = ereignisse.filter((e) => e.typ === 'treffer');
    assert.ok(treffer.length <= 1, `${wo}: ${treffer.length} Treffer in einem Zug`);
    const schaden = treffer.length ? GEGNERWERTE[treffer[0].durch].schaden || 1 : 0;
    const aufgebrochen = typen.includes('aufgebrochen') ? 1 : 0;
    if (typen.includes('rueckhalt')) {
      // Rückhalt: Der tödliche Treffer lässt ein Herz übrig, einmal je Fahrt
      assert.ok(alt.herzen <= schaden + aufgebrochen && z.spieler.herzen === 1 && alt.rueckhalt === false, `${wo}: Rückhalt falsch`);
    } else {
      const erwartet = alt.probe ? 0 : Math.min(alt.herzen, schaden + aufgebrochen + gegoennt); // in der Wiederholung gefahrlos
      assert.equal(verlust, erwartet, `${wo}: ${verlust} Herzen verloren`);
    }
    if (aufgebrochen) assert.equal(z.tuerOffen, true, `${wo}: aufgebrochen, Tür zu`);
    const standAufRot = rotVorher.includes(feldNr(z.spieler.x, z.spieler.y));
    if (treffer.length) {
      assert.ok(standAufRot, `${wo}: Treffer auf einem Feld, das nicht angekündigt war`);
      assert.equal(z.spieler.ruhe, 0, `${wo}: Ruhe nach Treffer`);
    } else if (z.status === 'faehrt') {
      const ausgewichen = rotVorher.includes(feldNr(alt.x, alt.y)) && !standAufRot && (alt.x !== z.spieler.x || alt.y !== z.spieler.y);
      assert.equal(typen.includes('ausgewichen'), ausgewichen, `${wo}: Ausweichen falsch erkannt`);
      const ruhigGewartet = typen.includes('ruhigGewartet');
      if (ruhigGewartet) assert.ok(aktion === 'warten' && alt.warten, `${wo}: Ruhe fürs Warten ohne Stärke`);
      const kosten = typen.includes('sprint') && !z.wagen.sicher ? 1 : 0; // ein Sprint kostet eine Ruhe, im sicheren Wagen nichts
      const basis = alt.ruhe - kosten;
      const erwartet = basis + ((ausgewichen || ruhigGewartet) && basis < RUHE_VOLL ? 1 : 0);
      assert.equal(z.spieler.ruhe, erwartet, `${wo}: Ruhe von ${alt.ruhe} auf ${z.spieler.ruhe}`);
    }
    // Ereignisse stehen in der Reihenfolge ihrer Phasen
    const phasen = ereignisse.map((e) => e.phase);
    assert.deepEqual(phasen, [...phasen].sort((a, b) => a - b), `${wo}: Phasen durcheinander`);
  }
  return z;
}

test('Fuzz: 400 Fahrten mit reinem Zufall', () => {
  for (let seed = 1; seed <= 400; seed++) {
    const zufall = zufallsquelle(seed * 7919);
    eineFahrt(seed, () => AKTIONEN[Math.floor(zufall() * AKTIONEN.length)]);
  }
});

test('Fuzz: jeder Wagen als Start, mit reinem Zufall', () => {
  for (let wagen = 0; wagen < WAGENZAHL; wagen++) {
    for (let seed = 1; seed <= 150; seed++) {
      const zufall = zufallsquelle(seed * 104729 + wagen);
      eineFahrt(seed, () => AKTIONEN[Math.floor(zufall() * AKTIONEN.length)], { startWagen: wagen });
    }
  }
});

test('Fuzz: mit allen Stärken und Sprints, reiner Zufall', () => {
  const MIT_SPRINT = [...AKTIONEN, ...RICHTUNGSNAMEN.map((r) => `sprint-${r}`)];
  const staerken = { warten: true, sprint: true, rueckhalt: true };
  for (let wagen = 0; wagen < WAGENZAHL; wagen++) {
    for (let seed = 1; seed <= 120; seed++) {
      const zufall = zufallsquelle(seed * 7177 + wagen * 13);
      eineFahrt(seed, () => MIT_SPRINT[Math.floor(zufall() * MIT_SPRINT.length)], { startWagen: wagen, staerken });
    }
  }
});

test('Fuzz: Bots mit vielen Zufallszügen kommen weit und halten alle Regeln ein', () => {
  const erreicht = new Set();
  for (const name of Object.keys(BOTS)) {
    for (let seed = 1; seed <= 150; seed++) {
      const zufall = zufallsquelle(seed * 31 + name.length);
      const merk = {};
      const z = eineFahrt(seed, (zustand) => (zufall() < 0.3 ? AKTIONEN[Math.floor(zufall() * AKTIONEN.length)] : BOTS[name](zustand, merk)));
      for (let nr = 0; nr <= z.wagenNr; nr++) erreicht.add(nr);
      if (z.status === 'halt') erreicht.add('halt');
    }
  }
  for (let nr = 0; nr < WAGENZAHL; nr++) assert.ok(erreicht.has(nr), `der Fuzz-Test hat Wagen ${nr + 1} nie gesehen`);
  assert.ok(erreicht.has('halt'), 'der Fuzz-Test hat den Halt nie gesehen');
});

// Ein Weg zum Ziel, Schritt für Schritt, für das Gespräch mit dem Begleiter.
function gehZu(z, ziel) {
  const weit = entfernungen(ziel, (x, y) => !istHindernis(z, x, y));
  const schritt = naechsterSchritt(z.spieler, weit, ziel);
  return schritt ? schritt.richtung : 'warten';
}

test('Fuzz: Wiederholung beim Begleiter, darin und danach reiner Zufall', () => {
  const MIT_SPRINT = [...AKTIONEN, ...RICHTUNGSNAMEN.map((r) => `sprint-${r}`)];
  let wiederholt = 0;
  for (let seed = 1; seed <= 120; seed++) {
    // erst eine echte Fahrt bis zum Tod, mit Fehlern, damit er in vielen Wagen kommt
    const zufall = zufallsquelle(seed * 6007);
    const vorige = eineFahrt(seed, (zustand) => (zufall() < 0.25 ? AKTIONEN[Math.floor(zufall() * AKTIONEN.length)] : BOTS.ausgewogener(zustand, {})));
    if (vorige.status !== 'tot') continue;
    const staerken = seed % 2 ? { warten: true, sprint: true, rueckhalt: true } : {};
    const optionen = { ...optionenFuerFahrt({ staerken, mehrAmTisch: seed % 4, fahrkarte: vorige.fahrkarte }, vorige), startWagen: SPEISEWAGEN_NR };
    let drin = false;
    eineFahrt(seed + 1000, (z) => {
      if (z.probe) drin = true;
      const b = z.begleiter;
      if (!drin && b && b.wiederholen) return gehZu(z, b.wiederholen);
      if (!drin && b && b.antworten) return gehZu(z, b.antworten[seed % 3]);
      if (!drin && b && !b.gesprochen) return gehZu(z, { x: b.x === 4 ? 3 : 1, y: b.y });
      return MIT_SPRINT[Math.floor(zufall() * MIT_SPRINT.length)];
    }, optionen);
    if (drin) wiederholt += 1;
  }
  assert.ok(wiederholt >= 40, `nur ${wiederholt} Wiederholungen gesehen`);
});
