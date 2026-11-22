// Die Bühne des Prototyps "Falsche Farben": malt den Saal und spielt die Ereignisse des Kerns ab.
// Sie entscheidet nie über Regeln. Sie führt nur die Auswahl: Wer gerade angehoben ist, setzt sich beim
// nächsten Tipp auf eine Bank. Standard ist der Gast an der Tür. Wer den äußersten Gast einer Bank antippt
// (oder irgendwen auf einer vollen Bank), hebt ihn an; ein Tipp auf die Bank daneben setzt ihn um.
//
// Die Glocke: Ein Tipp wählt das Verhör an, ein leuchtendes Fenster flackert. Der nächste Tipp auf einen Gast
// verhört ihn, ein Tipp woandershin bricht ab. Ohne leuchtendes Fenster ist die Glocke matt und tut nichts.
// Sie erscheint, sobald das erste Fenster leuchtet, mit kurzem Aufblinken.
//
// Angehalten wird nur beim Auffliegen und beim Räumen, je höchstens PAUSE ms. Alles andere läuft, während
// schon der nächste Tipp angenommen wird.

import { berechneSaal, wasImSaal } from './masse.js';
import { maleSaalGrund, maleSitz, maleLichtFenster, maleGlocke, SAALFARBE } from './saal.js';
import { maleGast, aussehen } from './gaeste.js';
import { maleTonschalter } from '../../../freier-platz/src/anzeige/gestalten.js';
import { hinUndHer, sanft, begrenze } from '../../../../src/anzeige/formen.js';
import { neuesPunktfeld, schreibe, zeichnePunktfeld, textBreite, ZEILENHOEHE } from '../../../../src/anzeige/matrix.js';
import { istFalsch, PLAETZE } from '../kern/abend.js';

export const PAUSE = 150; // so lange hält das Bild beim Auffliegen und beim Räumen an, nie länger
const WEG = 140; // so lange gleitet ein Gast auf seinen neuen Platz
const GLANZ = 520;
const WECHSEL = 420;
const RUCK = 0.14; // so weit rücken Nachbarn zusammen oder ab, in Plätzen
const RUCKZEIT = 90; // Zeitkonstante des Rückens und Abwendens in ms
const AUSZEIT = 450; // so lange erlischt ein Fenster nach dem Verhör
const BLINKEN = 700; // so lange blinkt die Glocke, wenn sie erscheint
const RAEUMEN = 900;
const FENSTERZEIT = 700;
const SCHLUSS_WARTET = 650; // nach dem letzten Zug, bis der Satz steht und ein Tipp neu beginnt

// Zeilen eines Satzes für die Punktschrift, höchstens spalten Punkte breit
// Wie weit jeder Gast einer Bank zur Seite rückt, in Vielfachen von RUCK (negativ: nach innen, links).
// Nachbarn mit gleicher echter Farbe rücken zusammen, auch wenn einer eine andere zeigt. Zeigen beide dieselbe
// Farbe und sind verschieden, rücken sie ab. Sonst bleiben beide, wo sie sind.
export function rueckVersatz(bank) {
  const v = bank.map(() => 0);
  for (let i = 0; i + 1 < bank.length; i++) {
    const a = bank[i];
    const b = bank[i + 1];
    if (a.echt === b.echt) {
      v[i] += 1;
      v[i + 1] -= 1;
    } else if (a.zeigt === b.zeigt) {
      v[i] -= 1;
      v[i + 1] += 1;
    }
  }
  return v;
}

// Punktabstand der Schrift am Ende: so groß wie möglich, aber gut 28 Zeichen je Zeile
export function satzRaster(breite) {
  return Math.max(1.8, Math.min(3, (breite - 24) / 170));
}

// Jeder Satz beginnt auf einer neuen Zeile.
export function brichUm(text, spalten) {
  const zeilen = [];
  const saetze = text.split('. ').map((t, i, alle) => (i < alle.length - 1 ? t + '.' : t));
  for (const satz of saetze) {
    let zeile = '';
    for (const wort of satz.split(' ')) {
      const probe = zeile ? zeile + ' ' + wort : wort;
      if (textBreite(probe) <= spalten || !zeile) zeile = probe;
      else {
        zeilen.push(zeile);
        zeile = wort;
      }
    }
    if (zeile) zeilen.push(zeile);
  }
  return zeilen;
}

export function erzeugeSaalBuehne(leinwand) {
  const stift = leinwand.getContext('2d');
  let m = null;
  let dichte = 1;
  let grund = null;
  let z = null;
  let tonAn = true;
  let auswahl = null; // 'tuer' | Banknummer | null
  let stups = { wo: null, t: -1e9 }; // ein Tipp ohne Wirkung: die Stelle zuckt kurz
  let pauseBis = 0;
  let schluss = null; // { t, satz, zeilen }
  let angetippt = false;
  const lage = new Map(); // id -> { x, y, vonX, vonY, t }
  const gezeigt = new Map(); // id -> Farbe, wie sie gerade gemalt wird
  const wechsel = new Map(); // id -> { alt, t, nach }
  const ruck = new Map(); // id -> wie weit er gerade zur Seite gerückt ist, in Pixeln
  let letzteZeit = 0;
  const glanz = new Map(); // id -> t
  let gehen = []; // geräumte Gäste auf dem Weg hinaus: { farbe, x, y, t }
  let fenster = []; // je Fenster { an, t }: seit wann es angeht oder ausgeht
  let verhoer = false; // die Glocke ist angetippt, der nächste Tipp auf einen Gast verhört ihn
  let glockeSeit = null; // seit wann die Glocke zu sehen ist
  const dreh = new Map(); // id -> wie weit er gerade abgewandt sitzt, -1..1
  const melder = { klang: null, schicht: null };

  function klinge(name) {
    if (melder.klang) melder.klang(name);
  }

  function passeAn() {
    const breite = Math.max(200, leinwand.clientWidth || window.innerWidth);
    const hoehe = Math.max(240, leinwand.clientHeight || window.innerHeight);
    dichte = Math.min(window.devicePixelRatio || 1, 2.5);
    leinwand.width = Math.round(breite * dichte);
    leinwand.height = Math.round(hoehe * dichte);
    m = berechneSaal(breite, hoehe);
    grund = maleSaalGrund(m, dichte);
    lage.clear(); // nach einer Größenänderung stehen alle sofort auf ihrem Platz
    if (schluss) schluss.zeilen = null;
  }

  function grundAuswahl() {
    auswahl = z && z.tuer.length ? 'tuer' : null;
  }

  function neu(zustand) {
    z = zustand;
    lage.clear();
    gezeigt.clear();
    wechsel.clear();
    glanz.clear();
    gehen = [];
    fenster = [];
    verhoer = false;
    glockeSeit = zustand.licht >= 1 || zustand.geraeumt >= 1 ? 0 : null;
    dreh.clear();
    schluss = null;
    pauseBis = 0;
    grundAuswahl();
  }

  // wo ein Gast hingehört
  function ort(g) {
    const i = z.tuer.indexOf(g);
    if (i >= 0) {
      const p = m.tuer.plaetze[i];
      return { x: p.cx, y: p.fy, sitzt: 0 };
    }
    for (let b = 0; b < z.baenke.length; b++) {
      const k = z.baenke[b].indexOf(g);
      if (k >= 0) {
        const p = m.baenke[b].plaetze[k];
        return { x: p.cx, y: p.fy, sitzt: 1 };
      }
    }
    return null;
  }

  function finde(id) {
    for (const g of z.tuer) if (g.id === id) return g;
    for (const b of z.baenke) for (const g of b) if (g.id === id) return g;
    return null;
  }

  function spiele(ereignisse, jetzt) {
    for (const e of ereignisse) {
      if (e.typ === 'gesetzt') klinge('setzen');
      else if (e.typ === 'ankunft') {
        const t = m.tuer.rahmen;
        lage.set(e.gast.id, { x: t.x + t.b / 2, y: t.y + t.h * 0.9, vonX: t.x + t.b / 2, vonY: t.y + t.h * 0.9, t: -1e9 });
        klinge('ankunft');
      } else if (e.typ === 'schimmer') {
        for (const id of e.ids) glanz.set(id, jetzt);
        klinge('schimmer');
      } else if (e.typ === 'abruecken') {
        klinge('abruecken');
      } else if (e.typ === 'aufgeflogen') {
        pauseBis = Math.max(pauseBis, jetzt + PAUSE);
        for (const f of e.gaeste) wechsel.set(f.id, { alt: gezeigt.get(f.id), t: jetzt + PAUSE });
        klinge('aufgeflogen');
      } else if (e.typ === 'geraeumt') {
        pauseBis = Math.max(pauseBis, jetzt + PAUSE);
        e.ids.forEach((id, k) => {
          const p = m.baenke[e.bank].plaetze[k];
          const l = lage.get(id);
          gehen.push({ farbe: e.farbe, x: l ? l.x : p.cx, y: l ? l.y : p.fy, t: jetzt });
          lage.delete(id);
        });
        fenster[e.fenster - 1] = { an: true, t: jetzt + PAUSE };
        if (glockeSeit === null) glockeSeit = jetzt + PAUSE;
        klinge('raeumen');
        if (melder.schicht) melder.schicht(e.fenster);
      } else if (e.typ === 'verhoer') {
        wechsel.set(e.id, { alt: e.zeigte, t: jetzt });
        fenster[e.fenster] = { an: false, t: jetzt };
        verhoer = false;
        klinge('verhoer');
        if (melder.schicht) melder.schicht(e.fenster);
      } else if (e.typ === 'ende') {
        schluss = { t: Math.max(jetzt, pauseBis) + SCHLUSS_WARTET, satz: e.satz, zeilen: null };
        klinge('ende');
        // der Saal, wie er ist: Wer noch eine falsche Farbe zeigt, zeigt am Ende seine echte
        const spaeter = Math.max(jetzt, pauseBis) + 250;
        for (const g of [...z.tuer, ...z.baenke.flat()]) if (istFalsch(g)) wechsel.set(g.id, { alt: g.zeigt, t: spaeter, nach: g.echt });
      }
    }
    grundAuswahl();
  }

  // Ein Tipp: gibt eine Aktion für den Kern zurück oder null. Ändert sonst nur die Auswahl.
  function tippe(x, y, jetzt) {
    angetippt = true;
    const ziel = wasImSaal(m, x, y);
    if (ziel.art === 'ton') return { ton: true };
    if (schluss) return jetzt >= schluss.t ? { neu: true } : null;
    if (ziel.art === 'glocke' && glockeSeit !== null) {
      // matt: kein Ton, keine Wirkung
      if (z.licht < 1) return null;
      verhoer = !verhoer;
      if (verhoer) klinge('glocke');
      return null;
    }
    if (verhoer) {
      // jetzt zählt nur ein Gast; alles andere bricht ab und kostet nichts
      verhoer = false;
      const g = gastBei(ziel);
      return g ? { verhoer: g.id } : null;
    }
    if (ziel.art === 'tuer') {
      if (z.tuer.length) auswahl = 'tuer';
      else stups = { wo: 'tuer', t: jetzt };
      return null;
    }
    if (ziel.art !== 'bank') return null;
    const b = ziel.bank;
    const bank = z.baenke[b];
    const voll = bank.length >= PLAETZE;
    const aufAeusserstem = bank.length && ziel.platz === bank.length - 1;
    if (auswahl === b) {
      // die eigene Bank: wieder absetzen
      grundAuswahl();
      return null;
    }
    if (voll || aufAeusserstem || auswahl === null) {
      if (bank.length) auswahl = b;
      else stups = { wo: b, t: jetzt };
      return null;
    }
    return { von: auswahl, nach: b };
  }

  // der Gast unter dem Finger, oder null
  function gastBei(ziel) {
    if (ziel.art === 'tuer') return z.tuer[ziel.platz] || null;
    if (ziel.art === 'bank') return z.baenke[ziel.bank][ziel.platz] || null;
    return null;
  }

  function gast(g, jetzt, o) {
    const soll = ort(g);
    if (!soll) return;
    let l = lage.get(g.id);
    if (!l) {
      l = { x: soll.x, y: soll.y, vonX: soll.x, vonY: soll.y, t: -1e9 };
      lage.set(g.id, l);
    }
    if (l.x !== soll.x || l.y !== soll.y) {
      const p = begrenze((jetzt - l.t) / WEG, 0, 1);
      l.vonX = l.vonX + (l.x - l.vonX) * sanft(p);
      l.vonY = l.vonY + (l.y - l.vonY) * sanft(p);
      l.x = soll.x;
      l.y = soll.y;
      l.t = jetzt;
    }
    const p = begrenze((jetzt - l.t) / WEG, 0, 1);
    const x = l.vonX + (l.x - l.vonX) * sanft(p) + (ruck.get(g.id) || 0);
    const y = l.vonY + (l.y - l.vonY) * sanft(p);

    let farbe = aussehen(g).farbe;
    let alt = null;
    let w = 1;
    const wx = wechsel.get(g.id);
    if (wx) {
      const q = begrenze((jetzt - wx.t) / WECHSEL, 0, 1);
      if (wx.nach !== undefined) farbe = q > 0 ? wx.nach : g.zeigt;
      alt = wx.alt;
      w = q > 0 ? sanft(q) : 0;
      if (q <= 0) {
        farbe = wx.alt;
        w = 1;
        alt = null;
      }
    }
    gezeigt.set(g.id, g.zeigt);
    const gt = glanz.get(g.id);
    const gl = gt === undefined ? 0 : jetzt - gt < GLANZ ? hinUndHer((jetzt - gt) / GLANZ) : 0;
    const hebe = o.hebe ? m.s * 0.12 : 0;
    if (o.hebe) {
      stift.save();
      stift.globalAlpha = 0.35;
      stift.fillStyle = SAALFARBE.wahl;
      stift.beginPath();
      stift.ellipse(x, y + 1, m.s * 0.34, m.s * 0.08, 0, 0, Math.PI * 2);
      stift.fill();
      stift.restore();
    }
    maleGast(stift, x, y - hebe, m.s, { farbe, alt, wechsel: w, dreh: dreh.get(g.id) || 0, sitzt: soll.sitzt * (o.hebe ? 0.6 : 1), glanz: gl });
  }

  function zeichne(jetzt) {
    if (!m || !z) return;
    stift.setTransform(dichte, 0, 0, dichte, 0, 0);
    stift.drawImage(grund, 0, 0, m.breite, m.hoehe);
    // Rücken: jeder Gast gleitet zu seinem Versatz neben seinen Nachbarn; an der Tür und angehoben steht er gerade
    const schritt = Math.min(1, Math.max(0, jetzt - letzteZeit) / RUCKZEIT);
    letzteZeit = jetzt;
    const ziel = new Map();
    z.baenke.forEach((bank, b) => {
      const v = rueckVersatz(bank);
      bank.forEach((g, k) => ziel.set(g.id, auswahl === b && k === bank.length - 1 ? 0 : v[k] * RUCK * m.s));
    });
    for (const g of z.tuer) ziel.set(g.id, 0);
    for (const [id, soll] of ziel) {
      const ist = ruck.get(id) || 0;
      ruck.set(id, ist + (soll - ist) * schritt);
    }
    // Spur: wer abgerückt ist, sitzt abgewandt, bis er neben seiner echten Farbe zusammenrückt
    for (const g of [...z.tuer, ...z.baenke.flat()]) {
      const ist = dreh.get(g.id) || 0;
      dreh.set(g.id, ist + (g.abgewandt - ist) * schritt);
    }
    m.fenster.forEach((f, i) => {
      const fe = fenster[i];
      if (!fe) return;
      let hell = fe.an ? begrenze((jetzt - fe.t) / FENSTERZEIT, 0, 1) : 1 - begrenze((jetzt - fe.t) / AUSZEIT, 0, 1);
      // der Preis des Verhörs: das letzte leuchtende Fenster flackert
      if (verhoer && fe.an && i === z.licht - 1) hell *= 0.55 + 0.45 * Math.abs(Math.sin(jetzt / 70) * Math.sin(jetzt / 163));
      maleLichtFenster(stift, f, hell);
    });
    if (glockeSeit !== null && jetzt >= glockeSeit) {
      const b = (jetzt - glockeSeit) / BLINKEN;
      const blink = b < 1 ? Math.abs(Math.sin(b * Math.PI * 3)) * (1 - b) : 0;
      maleGlocke(stift, m.glocke, m.s, { matt: z.licht < 1, an: verhoer, blink, zeit: jetzt });
    }
    maleTonschalter(stift, m.ton, tonAn);

    // Stups: eine Stelle, an der ein Tipp nichts bewirkt hat, zuckt kurz
    const st = (jetzt - stups.t) / 220;
    const zuck = st >= 0 && st < 1 ? Math.sin(st * Math.PI * 3) * (1 - st) * 3 : 0;

    // die Wartenden an der Tür, vorn der, der als Nächster gesetzt wird
    const vorn = !angetippt && auswahl === 'tuer' ? 0.5 + 0.5 * Math.sin(jetzt / 260) : 0;
    z.tuer.forEach((g, i) => {
      stift.save();
      if (stups.wo === 'tuer') stift.translate(zuck, 0);
      gast(g, jetzt, { hebe: auswahl === 'tuer' && i === 0 && !schluss });
      stift.restore();
      if (i === 0 && vorn > 0.01 && !schluss) {
        // vor dem ersten Tipp atmet der vordere Gast leise, damit man weiß, wer dran ist
        const p = m.tuer.plaetze[0];
        stift.save();
        stift.globalAlpha = 0.25 * vorn;
        stift.strokeStyle = SAALFARBE.wahl;
        stift.lineWidth = 2;
        stift.beginPath();
        stift.ellipse(p.cx, p.fy, m.s * 0.4, m.s * 0.1, 0, 0, Math.PI * 2);
        stift.stroke();
        stift.restore();
      }
    });

    z.baenke.forEach((bank, b) => {
      stift.save();
      if (stups.wo === b) stift.translate(zuck, 0);
      bank.forEach((g, k) => gast(g, jetzt, { hebe: auswahl === b && k === bank.length - 1 && !schluss }));
      maleSitz(stift, m, m.baenke[b]);
      stift.restore();
    });

    // die Geräumten leuchten auf und gehen zur Tür
    gehen = gehen.filter((g) => jetzt - g.t < RAEUMEN + PAUSE);
    for (const g of gehen) {
      const p = begrenze((jetzt - g.t - PAUSE) / RAEUMEN, 0, 1);
      const t = m.tuer.rahmen;
      const x = g.x + (t.x + t.b / 2 - g.x) * sanft(p);
      const y = g.y + (t.y + t.h * 0.9 - g.y) * sanft(p);
      stift.save();
      stift.globalAlpha = 1 - p;
      maleGast(stift, x, y, m.s, { farbe: g.farbe, sitzt: 1 - p, licht: 1 - p * 0.5 });
      stift.restore();
    }

    if (schluss && jetzt >= schluss.t) zeichneSatz(jetzt);
  }

  function zeichneSatz(jetzt) {
    const raster = satzRaster(m.breite);
    const spalten = Math.floor((m.breite - 24) / raster);
    if (!schluss.zeilen) schluss.zeilen = brichUm(schluss.satz, spalten);
    const n = schluss.zeilen.length;
    const hoch = (n * ZEILENHOEHE + (n - 1) * 3) * raster;
    const breit = Math.max(...schluss.zeilen.map(textBreite)) * raster;
    const feld = neuesPunktfeld(Math.ceil(breit / raster) + 1, n * (ZEILENHOEHE + 3));
    schluss.zeilen.forEach((zeile, i) => schreibe(feld, zeile, Math.round((feld.spalten - textBreite(zeile)) / 2), i * (ZEILENHOEHE + 3)));
    const x = Math.round((m.breite - feld.spalten * raster) / 2);
    const y = Math.round(m.satz.y + (m.satz.h - hoch) / 2);
    const a = begrenze((jetzt - schluss.t) / 300, 0, 1);
    stift.save();
    stift.globalAlpha = 0.82 * a;
    stift.fillStyle = SAALFARBE.schriftGrund;
    stift.fillRect(0, y - raster * 5, m.breite, hoch + raster * 9);
    stift.globalAlpha = a;
    zeichnePunktfeld(stift, feld, x, y, raster, SAALFARBE.schrift, null);
    stift.restore();
  }

  return {
    melder,
    passeAn,
    neu,
    spiele,
    tippe,
    zeichne,
    bereit: (jetzt) => jetzt >= pauseBis,
    pauseBis: () => pauseBis,
    setzeTon(an) {
      tonAn = an;
    },
    masse: () => m,
    auswahl: () => auswahl,
    verhoerAn: () => verhoer,
    schlussSteht: (jetzt) => !!schluss && jetzt >= schluss.t,
  };
}
