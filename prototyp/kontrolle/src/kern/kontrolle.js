// Prototyp "Kontrolle": Du bist der Kontrolleur. Finde den Fahrgast ohne Fahrkarte, bevor der Zug hält.
// Reine Logik ohne Browser. erzeugeKontrolle() -> { zustand, act(handlung) }, act gibt Ereignisse zurück.
//
// Ein Zug: ein Feld im Gang gehen, einen Fahrgast in der eigenen Reihe kontrollieren, oder warten.
// Danach antwortet der Wagen: Die Strecke wird kürzer, und der Fahrgast ohne Fahrkarte reagiert.
// Es wird nie eine Fahrkarte gelesen. Erkennbar ist er nur an seinem Verhalten:
//   - Steht der Kontrolleur in der Reihe daneben, steht er auf und setzt sich weiter weg: auf den
//     nächsten freien Sitz, der mindestens zwei Reihen vom Kontrolleur entfernt ist, auf der Seite,
//     die vom Kontrolleur wegführt. Am Kontrolleur kommt er im Gang nicht vorbei.
//   - Das Umsetzen kostet ihn einen Zug: Im nächsten Zug bleibt er sitzen, was immer geschieht.
//   - Steht der Kontrolleur in seiner Reihe, ist der Gang versperrt. Findet er keinen Platz,
//     will er trotzdem aufstehen: Er zuckt hoch und setzt sich wieder.
// Alle anderen bleiben sitzen. Jede Kontrolle kostet einen Zug, den Schlafenden zu kontrollieren zwei.

import { ZUEGE_BIS_HALT } from './halte.js';

export const KONTROLLGANG = 2;
export const KONTROLLSTART = 7; // Reihe des Kontrolleurs zu Beginn, unten im Gang
const OBERSTE_REIHE = 1; // in Reihe 0 ist die Tür
const SITZSPALTEN = [0, 1, 3, 4];

function sitztAuf(z, x, y) {
  return z.fahrgaeste.find((f) => f.x === x && f.y === y) || null;
}

// Richtet einen Halt nach einer Sitzordnung ein ({ farbe, sitze }, siehe halte.js).
export function setzeHalt(z, ordnung) {
  z.status = 'faehrt';
  z.rest = ZUEGE_BIS_HALT;
  z.k = { y: KONTROLLSTART, blick: 'hoch' };
  z.fahrgaeste = [];
  ordnung.sitze.forEach((zeile, i) => {
    for (const x of SITZSPALTEN) {
      const c = zeile[x];
      if (c === '.' || c === '|') continue;
      z.fahrgaeste.push({ nr: z.fahrgaeste.length, x, y: i + 1, farbe: c === 'S' ? ordnung.farbe : c === 'Z' ? 'z' : c, schlaeft: c === 'Z', schwarz: c === 'S', ruht: 0, kontrolliert: false });
    }
  });
}

// Wen eine Wischbewegung zur Seite kontrolliert: den Fahrgast am Gang, sonst den am Fenster.
export function nachbarAufSeite(z, seite) {
  const reihe = z.k.y;
  const gang = seite === 'links' ? 1 : 3;
  const fenster = seite === 'links' ? 0 : 4;
  return sitztAuf(z, gang, reihe) || sitztAuf(z, fenster, reihe);
}

// Der Fahrgast ohne Fahrkarte nach dem Zug des Kontrolleurs.
function schwarzfahrerZieht(z, ereignisse) {
  const s = z.fahrgaeste.find((f) => f.schwarz);
  if (s.ruht > 0) {
    s.ruht -= 1;
    return;
  }
  const abstand = Math.abs(s.y - z.k.y);
  if (abstand > 1) return;
  if (abstand === 0) {
    ereignisse.push({ typ: 'zuckt', nr: s.nr }); // der Gang ist versperrt
    return;
  }
  const weg = Math.sign(s.y - z.k.y); // vom Kontrolleur weg
  let ziel = null;
  for (let y = OBERSTE_REIHE; y <= 6; y++) {
    if (Math.sign(y - z.k.y) !== weg || Math.abs(y - z.k.y) < 2) continue;
    for (const x of SITZSPALTEN) {
      if (sitztAuf(z, x, y)) continue;
      const besser = !ziel || Math.abs(y - s.y) < Math.abs(ziel.y - s.y) || (Math.abs(y - s.y) === Math.abs(ziel.y - s.y) && Math.abs(x - s.x) < Math.abs(ziel.x - s.x));
      if (besser) ziel = { x, y };
    }
  }
  if (!ziel) {
    ereignisse.push({ typ: 'zuckt', nr: s.nr });
    return;
  }
  const von = { x: s.x, y: s.y };
  // sein Weg: in den Gang, den Gang entlang, auf den neuen Sitz
  const pfad = [von, { x: KONTROLLGANG, y: s.y }];
  for (let y = s.y + weg; y !== ziel.y + weg; y += weg) pfad.push({ x: KONTROLLGANG, y });
  pfad.push(ziel);
  s.x = ziel.x;
  s.y = ziel.y;
  s.ruht = 1;
  ereignisse.push({ typ: 'wechselt', nr: s.nr, von, nach: ziel, pfad });
}

// Ein Zug des Wagens: Die Strecke wird kürzer, der Fahrgast ohne Fahrkarte reagiert, vielleicht hält der Zug.
function wagenZieht(z, ereignisse) {
  z.rest -= 1;
  ereignisse.push({ typ: 'strecke', rest: z.rest });
  schwarzfahrerZieht(z, ereignisse);
  if (z.rest <= 0) {
    const s = z.fahrgaeste.find((f) => f.schwarz);
    // er steigt durch die Tür aus, die vom Kontrolleur weg liegt
    const tuer = s.y <= z.k.y ? { x: KONTROLLGANG, y: 0 } : { x: KONTROLLGANG, y: 7 };
    z.status = 'entkommen';
    z.ergebnisse.push(false);
    ereignisse.push({ typ: 'halt', nr: s.nr, von: { x: s.x, y: s.y }, tuer });
  }
}

function kontrolliere(z, f, ereignisse) {
  if (f.schwarz) {
    z.status = 'gefangen';
    z.ergebnisse.push(true);
    ereignisse.push({ typ: 'gefangen', nr: f.nr, x: f.x, y: f.y });
    return 0;
  }
  const schlief = f.schlaeft;
  f.schlaeft = false;
  f.kontrolliert = true;
  ereignisse.push({ typ: 'kontrolle', nr: f.nr, x: f.x, y: f.y, schlief });
  return schlief ? 2 : 1; // den Schlafenden zu kontrollieren kostet zwei Züge
}

function spielerZieht(z, handlung, ereignisse) {
  let ziel = null;
  if (handlung === 'hoch') ziel = z.k.y - 1;
  if (handlung === 'runter') ziel = z.k.y + 1;
  if (handlung && typeof handlung === 'object' && handlung.tipp === 'feld') {
    const { x, y } = handlung;
    if (x === KONTROLLGANG && Math.abs(y - z.k.y) === 1) ziel = y;
    else if (x === KONTROLLGANG && y === z.k.y) handlung = 'warten';
    else {
      const f = sitztAuf(z, x, y);
      return f && y === z.k.y ? kontrolliere(z, f, ereignisse) : -1;
    }
  }
  if (ziel !== null) {
    if (ziel < OBERSTE_REIHE || ziel > KONTROLLSTART) return -1;
    const von = z.k.y;
    z.k.y = ziel;
    z.k.blick = ziel < von ? 'hoch' : 'runter';
    ereignisse.push({ typ: 'schritt', von, nach: ziel });
    return 1;
  }
  if (handlung === 'links' || handlung === 'rechts') {
    const f = nachbarAufSeite(z, handlung);
    return f ? kontrolliere(z, f, ereignisse) : -1;
  }
  if (handlung === 'warten') {
    ereignisse.push({ typ: 'warten' });
    return 1;
  }
  return -1;
}

// Ein Zug im laufenden Halt. Gibt die Ereignisse zurück, leer, wenn die Handlung nichts bewirkt.
export function haltZug(z, handlung) {
  const ereignisse = [];
  if (z.status !== 'faehrt') return ereignisse;
  const zuege = spielerZieht(z, handlung, ereignisse);
  if (zuege < 0) return []; // geht nicht: kostet nichts
  z.zug += 1;
  for (let i = 0; i < zuege && z.status === 'faehrt'; i++) wagenZieht(z, ereignisse);
  return ereignisse;
}

// Schnelle Kopie für die Suche in pruefung.js
export function kopiereKontrolle(z) {
  const kopie = {};
  for (const name of Object.keys(z)) kopie[name] = z[name];
  kopie.k = { y: z.k.y, blick: z.k.blick };
  kopie.fahrgaeste = z.fahrgaeste.map((f) => ({ nr: f.nr, x: f.x, y: f.y, farbe: f.farbe, schlaeft: f.schlaeft, schwarz: f.schwarz, ruht: f.ruht, kontrolliert: f.kontrolliert }));
  kopie.ergebnisse = z.ergebnisse.slice();
  return kopie;
}
