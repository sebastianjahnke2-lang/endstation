// Prototyp "Kontrolle": Du bist der Kontrolleur. Finde die Fahrgäste ohne Fahrkarte, bevor der Zug hält.
// Reine Logik ohne Browser. Ein Halt: setzeHalt(z, ordnung), dann haltZug(z, handlung) -> Ereignisse.
// Die Schicht aus vielen Halten steuert durchgang.js.
//
// Ein Zug: ein Feld im Gang gehen (wischen), einen Fahrgast in der eigenen Reihe kontrollieren (antippen,
// zur Seite wischen trifft den Gangplatz), oder warten. Danach antwortet der Wagen: Die Strecke wird kürzer,
// und jeder Fahrgast ohne Fahrkarte reagiert nach seiner Masche. Es wird nie eine Fahrkarte gelesen.
// Erkennbar sind sie nur am Verhalten. Alle anderen tun nichts.
//
// Die drei Maschen:
//   Platzwechsler: Steht der Kontrolleur in der Reihe daneben, setzt er sich auf den nächsten freien Sitz,
//     der mindestens zwei Reihen vom Kontrolleur entfernt ist, auf der Seite weg vom Kontrolleur. Das kostet
//     ihn einen Zug: Im nächsten bleibt er sitzen. Steht der Kontrolleur in seiner Reihe, ist der Gang
//     versperrt. Findet er keinen Platz oder ist der Gang versperrt, zuckt er hoch und setzt sich wieder.
//   Scheinschläfer: sitzt da wie ein Schlafender. Dreht ihm der Kontrolleur den Rücken zu (er ist höchstens
//     drei Reihen hinter ihm), hebt er kurz den Kopf. Ihn zu kontrollieren kostet einen Zug, den echten
//     Schlafenden zwei.
//   Toilettengänger: Steht der Kontrolleur zwei Reihen unter ihm, geht er zur Toilette am vorderen Wagenende.
//     Er kommt erst zurück, wenn der Kontrolleur vorbei ist: umgedreht, mindestens drei Reihen von der
//     Toilette weg und unterhalb seines Platzes. Sein Platz bleibt so lange frei. Wer vor der Toilettentür
//     steht, wenn er nach vier Zügen herauskommt, erwischt ihn.

import { ZUEGE_BIS_HALT } from './halte.js';

export const KONTROLLGANG = 2;
export const KONTROLLSTART = 7; // Reihe des Kontrolleurs zu Beginn, unten im Gang
export const TOILETTE = { x: 2, y: 0 }; // vorn, wo sonst die Tür ist
export const WC_ZUEGE = 4; // so lange bleibt der Toilettengänger mindestens drin
export const SCHEIN_SICHT = 3; // so viele Reihen hinter dem Kontrolleur hebt der Scheinschläfer den Kopf
const OBERSTE_REIHE = 1; // in Reihe 0 ist die Toilette
const SITZSPALTEN = [0, 1, 3, 4];
const MASCHE_VON = { S: 'platz', P: 'platz', H: 'schein', T: 'wc' };

// belegt: Auch der Platz dessen, der auf der Toilette ist, bleibt belegt.
function sitztAuf(z, x, y) {
  return z.fahrgaeste.find((f) => f.x === x && f.y === y) || null;
}

// wen man in seiner Reihe antreffen und kontrollieren kann
function greifbar(z, x, y) {
  const f = sitztAuf(z, x, y);
  return f && f.ort === 'sitz' && !f.gefangen ? f : null;
}

export function offeneSchwarzfahrer(z) {
  return z.fahrgaeste.filter((f) => f.schwarz && !f.gefangen);
}

// Richtet einen Halt nach einer Sitzordnung ein, siehe halte.js und auslosen.js:
// { sitze, farben: { P, T } (Farbe von Platzwechsler und Toilettengänger), zuege, start }
export function setzeHalt(z, ordnung) {
  z.status = 'faehrt';
  z.rest = ordnung.zuege || ZUEGE_BIS_HALT;
  z.zuegeGesamt = z.rest;
  z.entkommenImHalt = 0;
  z.k = { y: ordnung.start || KONTROLLSTART, blick: 'hoch' };
  z.fahrgaeste = [];
  const farben = ordnung.farben || {};
  ordnung.sitze.forEach((zeile, i) => {
    for (const x of SITZSPALTEN) {
      const c = zeile[x];
      if (c === '.' || c === '|') continue;
      const masche = MASCHE_VON[c] || null;
      let farbe = c;
      if (c === 'Z' || c === 'H') farbe = 'z'; // der Scheinschläfer sieht aus wie ein Schlafender
      else if (masche) farbe = farben[c === 'S' ? 'P' : c] || ordnung.farbe || 'g';
      z.fahrgaeste.push({ nr: z.fahrgaeste.length, x, y: i + 1, farbe, schlaeft: c === 'Z', schwarz: !!masche, masche, ruht: 0, kontrolliert: false, gefangen: false, ort: 'sitz', wc: 0 });
    }
  });
}

// Wen eine Wischbewegung zur Seite kontrolliert: nur den Fahrgast am Gang. Antippen trifft jeden in der Reihe.
export function nachbarAufSeite(z, seite) {
  return greifbar(z, seite === 'links' ? 1 : 3, z.k.y);
}

function gangweg(vonY, nachY) {
  const weg = [];
  const schritt = nachY < vonY ? -1 : 1;
  for (let y = vonY; y !== nachY + schritt; y += schritt) weg.push({ x: KONTROLLGANG, y });
  return weg;
}

function platzwechslerZieht(z, s, ereignisse) {
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
  const pfad = [von].concat(gangweg(s.y, ziel.y), [ziel]);
  s.x = ziel.x;
  s.y = ziel.y;
  s.ruht = 1;
  ereignisse.push({ typ: 'wechselt', nr: s.nr, von, nach: ziel, pfad });
}

function scheinschlaeferZieht(z, s, ereignisse) {
  const hinten = z.k.blick === 'hoch' ? s.y - z.k.y : z.k.y - s.y;
  if (hinten > 0 && hinten <= SCHEIN_SICHT) ereignisse.push({ typ: 'kopfHoch', nr: s.nr });
}

function toilettengaengerZieht(z, s, ereignisse) {
  if (s.ort === 'sitz') {
    // zwei Reihen unter ihm: Der Weg nach vorn zur Toilette ist frei
    if (z.k.y - s.y !== 2) return;
    s.ort = 'wc';
    s.wc = 0;
    ereignisse.push({ typ: 'toilette', nr: s.nr, pfad: [{ x: s.x, y: s.y }].concat(gangweg(s.y, TOILETTE.y)) });
    return;
  }
  s.wc += 1;
  if (s.wc >= WC_ZUEGE && z.k.y === TOILETTE.y + 1) {
    // er kommt heraus, und der Kontrolleur steht vor der Tür
    s.gefangen = true;
    ereignisse.push({ typ: 'gefangen', nr: s.nr, x: TOILETTE.x, y: TOILETTE.y, tuer: true });
    return;
  }
  const vorbei = z.k.blick === 'runter' && z.k.y - TOILETTE.y >= 3 && z.k.y > s.y;
  if (!vorbei) return;
  s.ort = 'sitz';
  s.wc = 0;
  ereignisse.push({ typ: 'zurueck', nr: s.nr, pfad: gangweg(TOILETTE.y, s.y).concat([{ x: s.x, y: s.y }]) });
}

// Ein Zug des Wagens: Die Strecke wird kürzer, jeder Fahrgast ohne Fahrkarte reagiert, vielleicht hält der Zug.
function wagenZieht(z, ereignisse) {
  z.rest -= 1;
  ereignisse.push({ typ: 'strecke', rest: z.rest });
  for (const s of offeneSchwarzfahrer(z)) {
    if (s.masche === 'platz') platzwechslerZieht(z, s, ereignisse);
    else if (s.masche === 'schein') scheinschlaeferZieht(z, s, ereignisse);
    else toilettengaengerZieht(z, s, ereignisse);
  }
  if (!offeneSchwarzfahrer(z).length) {
    z.status = 'gefangen'; // der letzte kam vor der Toilettentür heraus
    return;
  }
  if (z.rest <= 0) {
    // der Zug hält: Wer noch da ist, steigt aus, durch die Tür, die vom Kontrolleur weg liegt
    for (const s of offeneSchwarzfahrer(z)) {
      const tuer = s.ort === 'wc' || s.y <= z.k.y ? { x: KONTROLLGANG, y: 0 } : { x: KONTROLLGANG, y: 7 };
      const von = s.ort === 'wc' ? { x: TOILETTE.x, y: TOILETTE.y } : { x: s.x, y: s.y };
      const pfad = s.ort === 'wc' ? [von] : [von].concat(gangweg(s.y, tuer.y));
      ereignisse.push({ typ: 'halt', nr: s.nr, von, tuer, pfad, ausWc: s.ort === 'wc' });
      z.entkommenImHalt += 1;
    }
    z.status = 'entkommen';
  }
}

function kontrolliere(z, f, ereignisse) {
  if (f.schwarz) {
    f.gefangen = true;
    ereignisse.push({ typ: 'gefangen', nr: f.nr, x: f.x, y: f.y });
    if (!offeneSchwarzfahrer(z).length) {
      z.status = 'gefangen';
      return 0;
    }
    return 1; // ein zweiter ist noch im Wagen: Der Zug läuft weiter
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
      const f = greifbar(z, x, y);
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
// Danach: status 'gefangen' (alle erwischt), 'entkommen' (der Zug hielt), sonst 'faehrt'.
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
  const kopie = Object.assign({}, z);
  kopie.k = { y: z.k.y, blick: z.k.blick };
  kopie.fahrgaeste = z.fahrgaeste.map((f) => Object.assign({}, f));
  return kopie;
}
