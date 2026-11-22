// Zwei Spieler für die Tests. Beide sehen nur, was auf dem Bildschirm steht: gezeigte Farben, wer wo sitzt,
// wer zusammenrückt (und schimmert), wer abrückt, wer auffliegt. Die echte Farbe lesen sie nie.
//   hinseher: merkt sich Zusammen- und Abrücken und schließt daraus, wer ehrlich ist und wer nicht.
//   blind:    setzt nur nach der gezeigten Farbe und achtet nicht aufs Rücken.
//   langsam:  merkt sich nichts. Er sieht nur, was gerade im Saal zu sehen ist: wer neben wem zusammen- oder
//             abgerückt sitzt und wer abgewandt sitzt (die Spur). Alle anderen hält er für ehrlich.
//   langsamVerhoer: derselbe, verhört aber unter Druck einen Verdächtigen (siehe verhoerFuer).
//   langsamOhneSpur: derselbe ohne Spur, nur zum Vergleich: So ging es dem Spieler vor dieser Nachbesserung.
// Beide wählen gleich: jeden möglichen Zug durchdenken und den Saal danach nach ihrem Wissen bewerten.
// Der Unterschied liegt nur im Wissen. Der Blinde hält jeden für ehrlich.

import { erzeugeAbend, zuege, PLAETZE } from '../src/kern/abend.js';

// Wissen über einen Gast: art 'e' ehrlich, 'f' falsch, '?' unbekannt; echt: bekannte echte Farbe oder null
// verdacht: Paare gleich Aussehender, die abgerückt sind: Genau einer von beiden ist falsch.
export function erzeugeWissen(blind) {
  const w = new Map();
  const verdacht = [];
  const hole = (z, id) => {
    if (!w.has(id)) w.set(id, { art: blind ? 'e' : '?', echt: null });
    return w.get(id);
  };
  return { w, hole, blind, verdacht };
}

function finde(z, id) {
  for (const g of z.tuer) if (g.id === id) return g;
  for (const b of z.baenke) for (const g of b) if (g.id === id) return g;
  return null;
}

// bekannte echte Farbe aus dem Wissen
function bekannt(wissen, z, g) {
  const k = wissen.hole(z, g.id);
  if (k.art === 'e') return g.zeigt;
  return k.echt;
}

function setze(wissen, z, g, echt) {
  const k = wissen.hole(z, g.id);
  k.echt = echt;
  k.art = g.zeigt === echt ? 'e' : 'f';
}

// Wertet die Ereignisse eines Zugs aus: Schimmern, ausbleibendes Schimmern, Auffliegen.
export function lerne(wissen, z, ereignisse) {
  if (wissen.blind) return;
  const gesetzt = ereignisse.find((e) => e.typ === 'gesetzt');
  const zusammen = ereignisse.find((e) => e.typ === 'schimmer');
  const ab = ereignisse.find((e) => e.typ === 'abruecken');
  const auf = ereignisse.find((e) => e.typ === 'aufgeflogen');
  if (auf) {
    for (const f of auf.gaeste) wissen.hole(z, f.id).art = 'e'; // zeigt jetzt die echte Farbe
    // wer auf dieser Bank nicht aufgeflogen ist, zeigte dieselbe Farbe und ist ehrlich
    for (const g of z.baenke[auf.bank]) if (!auf.gaeste.some((f) => f.id === g.id)) wissen.hole(z, g.id).art = 'e';
  }
  if (gesetzt && gesetzt.platz > 0) {
    const bank = z.baenke[gesetzt.nach];
    const a = bank[gesetzt.platz - 1];
    const b = bank[gesetzt.platz];
    if (!a || !b || b.id !== gesetzt.id) return;
    const ka = bekannt(wissen, z, a);
    const kb = bekannt(wissen, z, b);
    if (zusammen) {
      if (ka !== null && kb === null) setze(wissen, z, b, ka);
      else if (kb !== null && ka === null) setze(wissen, z, a, kb);
      else if (ka === null && kb === null && a.zeigt === b.zeigt) {
        wissen.hole(z, a.id).art = 'e';
        wissen.hole(z, b.id).art = 'e';
      }
    } else if (ab) {
      if (ka !== null && kb === null && b.zeigt === ka) wissen.hole(z, b.id).art = 'f';
      if (kb !== null && ka === null && a.zeigt === kb) wissen.hole(z, a.id).art = 'f';
      if (ka === null && kb === null && a.zeigt === b.zeigt) wissen.verdacht.push([a.id, b.id]);
    }
  }
  // Verdachtspaare auflösen: Ist einer bekannt, steht auch der andere fest.
  for (let i = wissen.verdacht.length - 1; i >= 0; i--) {
    const [a, b] = wissen.verdacht[i].map((id) => wissen.w.get(id));
    if (!a || !b) continue;
    let fertig = true;
    if (a.art === 'e' && b.art === '?') b.art = 'f';
    else if (b.art === 'e' && a.art === '?') a.art = 'f';
    else if (a.art === 'f' && b.art === '?') b.art = 'e';
    else if (b.art === 'f' && a.art === '?') a.art = 'e';
    else fertig = a.art !== '?' && b.art !== '?';
    if (fertig) wissen.verdacht.splice(i, 1);
  }
}

// Wert eines Saals nach dem, was der Spieler weiß. Gut: Bänke, die von unten her rein eine Farbe sind.
// Schlecht: Gäste darüber, die dort nicht hingehören, Unsichere in einer reinen Reihe, Wartende an der Tür.
function bewerte(baenke, tuer, art) {
  let wert = -tuer * tuer * 6;
  for (const bank of baenke) {
    if (!bank.length) {
      wert += 1.5;
      continue;
    }
    const farbe = bank[0].zeigt;
    let rein = 0;
    while (rein < bank.length && bank[rein].zeigt === farbe && art(bank[rein]) !== 'f') rein++;
    const unsicher = bank.slice(0, rein).filter((g) => art(g) === '?').length;
    const darueber = bank.length - rein;
    if (!darueber) wert += rein * rein * 1.5 - unsicher * 1.2;
    else wert += rein * rein * 0.4 - unsicher - darueber * 2.5 - (art(bank[bank.length - 1]) === 'f' ? 1 : 0);
  }
  return wert;
}

export function waehle(wissen, z, merk) {
  const art = (g) => wissen.hole(z, g.id).art;
  let best = null;
  for (const a of zuege(z)) {
    if (merk.letzter && merk.letzter.von === a.nach && merk.letzter.nach === a.von) continue; // nicht hin und her
    const baenke = z.baenke.map((b) => b.slice());
    const g = a.von === 'tuer' ? z.tuer[0] : baenke[a.von].pop();
    const bank = baenke[a.nach];
    const oben = bank[bank.length - 1];
    let extra = 0;
    if (bank.length === PLAETZE - 1 && bank.every((x) => x.zeigt === g.zeigt)) {
      const dreiEhrliche = bank.every((x) => art(x) === 'e');
      if (dreiEhrliche && art(g) === 'e') {
        baenke[a.nach] = [];
        extra = 40; // räumt
      } else if (dreiEhrliche) {
        bank.push(g);
        extra = art(g) === 'f' ? 12 : 25; // fliegt am Rand auf, oder räumt
      } else {
        bank.push(g);
        extra = -30; // geraten
      }
    } else {
      bank.push(g);
      if (art(g) === '?' && oben && art(oben) === 'e' && oben.zeigt === g.zeigt) extra = 3; // Probe neben einem Ehrlichen
    }
    const wert = bewerte(baenke, z.tuer.length - (a.von === 'tuer' ? 1 : 0), art) + extra;
    if (!best || wert > best.wert) best = { a, wert };
  }
  return best ? best.a : zuege(z)[0];
}

// Was der langsame Spieler in diesem Augenblick weiß, ganz aus dem Bild. Gleiche Form wie erzeugeWissen().
// Sicher ehrlich: wer neben einem Gleichaussehenden zusammengerückt sitzt (zwei unentdeckte Falsche zeigen nie
// dieselbe Farbe). Sicher falsch: wer von einem sicher Ehrlichen abgerückt sitzt. Verdächtig: wer abgerückt
// sitzt oder, mit Spur, abgewandt am Rand oder an der Tür steht, also gerade gesetzt werden könnte.
// Wer abgewandt tief in einer Bank sitzt, zählt nicht: An ihn kommt man ohnehin nicht heran.
export function wissenAusBild(z, mitSpur) {
  const w = new Map();
  const art = (g) => (w.get(g.id) || { art: 'e' }).art;
  const setze = (g, a) => w.set(g.id, { art: a, echt: null });
  const sicher = new Set();
  for (const bank of z.baenke) {
    for (let i = 0; i + 1 < bank.length; i++) {
      const [a, b] = [bank[i], bank[i + 1]];
      if (a.echt === b.echt && a.zeigt === b.zeigt) {
        sicher.add(a.id);
        sicher.add(b.id);
      }
    }
  }
  for (const bank of z.baenke) {
    for (let i = 0; i + 1 < bank.length; i++) {
      const [a, b] = [bank[i], bank[i + 1]];
      if (a.echt === b.echt || a.zeigt !== b.zeigt) continue;
      // sichtbar abgerückt
      if (sicher.has(a.id)) setze(b, 'f');
      else if (sicher.has(b.id)) setze(a, 'f');
      else {
        if (art(a) === 'e') setze(a, '?');
        if (art(b) === 'e') setze(b, '?');
      }
    }
  }
  if (mitSpur) {
    const raender = z.tuer.slice(0, 1);
    for (const bank of z.baenke) if (bank.length) raender.push(bank[bank.length - 1]);
    for (const g of raender) if (g.abgewandt && !sicher.has(g.id) && art(g) === 'e') setze(g, '?');
  }
  return { w, blind: false, verdacht: [], hole: (zz, id) => w.get(id) || { art: 'e', echt: null } };
}

// Wen der langsame Spieler verhört: nur unter Druck (mindestens zwei warten an der Tür) und nur, wenn eine Bank
// gleich räumen könnte: Ein Verdächtiger am Rand oder an der Tür zeigt die Farbe einer Bank mit drei sicher
// Ehrlichen. Dann klärt das Verhör, ob er dazugehört.
function verhoerFuer(z, wissen) {
  if (z.licht < 1) return null;
  const quellen = [];
  if (z.tuer.length) quellen.push(z.tuer[0]);
  for (const b of z.baenke) if (b.length) quellen.push(b[b.length - 1]);
  const reinDrei = (farbe) => z.baenke.some((b) => b.length === PLAETZE - 1 && b.every((x) => x.zeigt === farbe && wissen.hole(z, x.id).art === 'e'));
  if (z.tuer.length < 2) return null;
  const g = quellen.find((x) => wissen.hole(z, x.id).art === '?' && reinDrei(x.zeigt));
  return g ? { verhoer: g.id } : null;
}

// Spielt einen Abend. Gibt den Endzustand und Zählungen zurück.
//   geraten: Ein Falscher flog auf, den der Spieler für ehrlich hielt oder unter anderen begraben hatte.
//     Als vierter am Rand zu drei bekannt Ehrlichen aufzufliegen ist eine Prüfung, kein Raten.
//   erkannt: Falsche, die der Spieler vor dem Auffliegen schon kannte.
export function spieleAbend(seed, wie, hoechstens = 3000) {
  const abend = erzeugeAbend(seed);
  const z = abend.zustand;
  const langsam = wie.startsWith('langsam');
  let wissen = erzeugeWissen(wie === 'blind');
  const merk = {};
  let geraten = 0;
  let erkannt = 0;
  let verhoert = 0;
  for (let i = 0; i < hoechstens && z.status === 'laeuft'; i++) {
    if (langsam) wissen = wissenAusBild(z, wie !== 'langsamOhneSpur');
    if (wie === 'langsamVerhoer') {
      const v = verhoerFuer(z, wissen);
      if (v) {
        abend.act(v);
        verhoert += 1;
        wissen = wissenAusBild(z, true);
      }
    }
    const aktion = waehle(wissen, z, merk);
    if (!aktion) break;
    const vorher = new Map();
    for (const g of z.tuer) vorher.set(g.id, wissen.hole(z, g.id).art);
    for (const b of z.baenke) for (const g of b) vorher.set(g.id, wissen.hole(z, g.id).art);
    const e = abend.act(aktion);
    const auf = e.find((x) => x.typ === 'aufgeflogen');
    if (auf) {
      for (const f of auf.gaeste) {
        const amRand = f.platz === PLAETZE - 1 && auf.gaeste.length === 1;
        if (vorher.get(f.id) === 'f') erkannt += 1;
        else if (vorher.get(f.id) === 'e' || !amRand) geraten += 1;
      }
    }
    merk.letzter = aktion;
    if (!langsam) lerne(wissen, z, e);
  }
  return { z, geraten, erkannt, verhoert };
}
