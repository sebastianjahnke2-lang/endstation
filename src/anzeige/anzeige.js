// Die Anzeige spielt ab, was der Kern meldet. Sie entscheidet nie über Spielregeln.
//
// "bild" ist der Stand, der gerade zu sehen ist. Er läuft dem echten Zustand ein paar
// Zehntelsekunden hinterher, während die Ereignisse eines Zugs nacheinander ablaufen.
// Kommt eine neue Eingabe, bevor alles gezeigt ist, springt das Bild sofort ans Ende.

import { RICHTUNG, TUERFELD, STARTFELD, feldNr } from '../kern/feld.js';
import { GEGNERWERTE } from '../kern/gegner.js';
import { HERZEN_VOLL, RUHE_VOLL } from '../kern/spiel.js';
import { WAGENZAHL } from '../kern/wagen.js';
import { TEXTE, fuelle } from '../texte.js';
import { FARBE, rundesRechteck, begrenze, sanft, leicht, hinUndHer } from './formen.js';
import { berechneLayout, feldBei, KNOPF } from './layout.js';
import { maleFigur, malePunkte, maleAchtung } from './figuren.js';
import { maleWagenbild, maleTuer, maleTuerlicht, maleLichter, maleLichtschein, maleTafelbild, maleHerzen, maleRuhe, maleUhr, maleTonknopf } from './kulisse.js';
import { maleKarte, kartenMasse } from './karte.js';
import { neuesPunktfeld, schreibe, zeichnePunktfeld, textBreite, ZEILENHOEHE } from './matrix.js';

const ABFAHRT = 23 * 60 + 41; // die Uhr beim Einsteigen, jeder Zug ist eine Minute
const TAKT = 1.3; // Sekunden zwischen zwei Schienenstößen im Flusszustand
const SPALT_JE_STOSS = 0.16; // so weit gibt die geschlossene Tür bei jedem Stoß nach

export function uhrzeit(zug) {
  const minuten = (ABFAHRT + zug) % (24 * 60);
  return `${String(Math.floor(minuten / 60)).padStart(2, '0')}:${String(minuten % 60).padStart(2, '0')}`;
}

export function erzeugeAnzeige(leinwand) {
  const stift = leinwand.getContext('2d');
  const ruhig = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  let layout = null;
  let dichte = 1;
  let z = null; // der echte Zustand, nur zum Lesen
  let wagenbild = null;
  let altesWagenbild = null;
  let tafelbild = null;
  let schleier = null;

  const bild = {
    wagenNr: -1,
    spieler: { x: 0, y: 0, px: 0, py: 0, sx: 0, sy: 0, hupf: 0, blitz: 0 },
    gegner: [],
    herzen: HERZEN_VOLL,
    ruhe: 0,
    zug: 0,
    tuer: 0,
    spalt: 0, // wie weit die geschlossene Tür nach Stößen schon nachgegeben hat
    schwenk: 0,
  };
  let rede = null; // der Satz des Kontrolleurs, bis zur nächsten Eingabe: { x, y }
  let wartend = []; // Ereignisse, die noch dran sind: { zeit, liste }
  let laeufer = []; // laufende Bewegungen: { start, dauer, schritt, bleibt }
  let geister = []; // Besiegte, die verblassen
  let blitze = []; // Felder, auf denen gerade ein Angriff eintrifft
  let lichter = [];
  let klar = 0;
  let letzteZeit = 0;
  let lichtIn = 0.4;
  let fernIn = 0.2;
  let taktUhr = 0;
  let karte = null;
  let hinweis = null;
  let tonAn = true;
  const wirkung = { wackeln: -1e9, treffer: -1e9, zuwachs: -1e9, uhr: -1e9, tuerZu: -1e9 };
  const melder = { takt: null };

  // ---------------------------------------------------------------- Aufbau

  function passeAn() {
    // Maß ist der Canvas selbst: Er folgt der dynamischen Höhe und lässt Notch und Home-Balken frei.
    const breite = Math.max(200, leinwand.clientWidth || window.innerWidth);
    const hoehe = Math.max(240, leinwand.clientHeight || window.innerHeight);
    dichte = Math.min(window.devicePixelRatio || 1, 2.5);
    leinwand.width = Math.round(breite * dichte);
    leinwand.height = Math.round(hoehe * dichte);
    layout = berechneLayout(breite, hoehe);
    baueSchleier();
    bild.wagenNr = -1;
    if (z) gleicheAb();
  }

  // Dunkle Ränder, die sich im Flusszustand lichten. Einmal gemalt, dann nur noch aufgelegt.
  function baueSchleier() {
    schleier = document.createElement('canvas');
    const b = Math.round(layout.breite / 2);
    const h = Math.round(layout.hoehe / 2);
    schleier.width = b;
    schleier.height = h;
    const s2 = schleier.getContext('2d');
    const rand = s2.createRadialGradient(b / 2, h * 0.52, h * 0.28, b / 2, h * 0.52, h * 0.82);
    rand.addColorStop(0, 'rgba(4, 6, 12, 0)');
    rand.addColorStop(1, 'rgba(4, 6, 12, 1)');
    s2.fillStyle = rand;
    s2.fillRect(0, 0, b, h);
  }

  function baueBilder() {
    wagenbild = maleWagenbild(layout, z.wagen.plan, dichte);
    tafelbild = maleTafelbild(layout, String(z.wagenNr + 1), TEXTE.wagen[z.wagen.art] || '', dichte);
    bild.wagenNr = z.wagenNr;
  }

  // Bild und Zustand in Deckung bringen
  function gleicheAb() {
    if (bild.wagenNr !== z.wagenNr) baueBilder();
    const s = bild.spieler;
    s.x = s.px = z.spieler.x;
    s.y = s.py = z.spieler.y;
    s.sx = s.sy = s.hupf = 0;
    bild.herzen = z.spieler.herzen;
    bild.ruhe = z.spieler.ruhe;
    bild.zug = z.zug;
    bild.tuer = z.tuerOffen ? 1 : 0;
    bild.spalt = z.tuerOffen ? 0 : (z.tuerStoesse || 0) * SPALT_JE_STOSS;
    bild.schwenk = 0;
    const alt = new Map(bild.gegner.map((g) => [g.id, g]));
    bild.gegner = z.gegner.map((g) => {
      const b = alt.get(g.id) || { id: g.id, typ: g.typ, sx: 0, sy: 0, blitz: 0 };
      b.x = b.px = g.x;
      b.y = b.py = g.y;
      b.hp = g.hp;
      b.ansage = g.ansage ? g.ansage.map((f) => ({ x: f.x, y: f.y })) : null;
      b.zeigen = 1;
      b.erschoepft = g.erschoepft > 0;
      b.pausiert = g.pause > 0;
      b.gruppe = g.gruppe;
      b.rang = g.rang;
      b.ruhig = g.ruhig || 0;
      return b;
    });
  }

  function bewege(start, dauer, schritt, bleibt) {
    const l = { start, dauer, schritt, bleibt: bleibt === true };
    laeufer.push(l);
    schritt(0);
    return l;
  }

  function findeGegner(id) {
    for (const g of bild.gegner) if (g.id === id) return g;
    return null;
  }

  function laufeWeg(g, von, weg, jetzt, dauer) {
    const punkte = [von, ...weg];
    if (punkte.length < 2) return;
    const ziel = punkte[punkte.length - 1];
    g.x = ziel.x;
    g.y = ziel.y;
    bewege(jetzt, dauer, (p) => {
      const q = sanft(p) * (punkte.length - 1);
      const i = Math.min(punkte.length - 2, Math.floor(q));
      const rest = q - i;
      g.px = punkte[i].x + (punkte[i + 1].x - punkte[i].x) * rest;
      g.py = punkte[i].y + (punkte[i + 1].y - punkte[i].y) * rest;
    });
  }

  function lasseAufblitzen(felder, jetzt) {
    const b = { felder, staerke: 1 };
    blitze.push(b);
    bewege(jetzt, 150, (p) => {
      b.staerke = 1 - p;
      if (p >= 1) blitze = blitze.filter((x) => x !== b);
    }, true);
  }

  // ---------------------------------------------------------------- Ereignisse

  function zeigeKarte(art, zeilen, jetzt, pause) {
    karte = {
      art,
      zeilen,
      herzen: z.spieler.herzen,
      herzenVoll: HERZEN_VOLL,
      minuten: ABFAHRT + z.zug,
      start: jetzt + pause,
      einblenden: 0,
      weg: 0,
      geht: 0,
      ruhig,
    };
  }

  function wendeAn(e, jetzt) {
    const s = bild.spieler;
    if (e.typ === 'schritt') {
      const fluss = bild.ruhe >= RUHE_VOLL;
      s.x = e.nach.x;
      s.y = e.nach.y;
      bild.zug += 1;
      bewege(jetzt, fluss ? 100 : 125, (p) => {
        const q = fluss ? leicht(p) : sanft(p);
        s.px = e.von.x + (e.nach.x - e.von.x) * q;
        s.py = e.von.y + (e.nach.y - e.von.y) * q;
        s.hupf = fluss ? hinUndHer(p) * 0.07 : 0;
      });
    } else if (e.typ === 'warten') {
      bild.zug += 1;
      wirkung.uhr = jetzt;
    } else if (e.typ === 'ungueltig') {
      const r = RICHTUNG[e.richtung];
      if (e.tuer) wirkung.tuerZu = jetzt;
      bewege(jetzt, 100, (p) => {
        s.sx = r.x * hinUndHer(p) * 0.13;
        s.sy = r.y * hinUndHer(p) * 0.13;
      });
    } else if (e.typ === 'schlag') {
      const r = RICHTUNG[e.richtung];
      bild.zug += 1;
      bewege(jetzt, 115, (p) => {
        s.sx = r.x * hinUndHer(p) * 0.34;
        s.sy = r.y * hinUndHer(p) * 0.34;
      });
      const g = findeGegner(e.id);
      if (g) {
        g.hp = e.hp;
        if (e.besiegt) {
          bild.gegner = bild.gegner.filter((x) => x !== g);
          const geist = { g, alpha: 1 };
          geister.push(geist);
          bewege(jetzt, 140, (p) => {
            geist.alpha = 1 - p;
            g.sx = r.x * p * 0.3;
            g.sy = r.y * p * 0.3;
            g.blitz = 1 - p;
            if (p >= 1) geister = geister.filter((x) => x !== geist);
          }, true);
        } else {
          bewege(jetzt, 140, (p) => {
            g.blitz = 1 - p;
            g.sx = r.x * hinUndHer(p) * 0.14;
            g.sy = r.y * hinUndHer(p) * 0.14;
          }, true);
        }
      }
    } else if (e.typ === 'tuerAuf') {
      const l = bewege(jetzt, 150, (p) => {
        bild.tuer = Math.max(0.001, sanft(p));
      });
      l.tuer = true;
    } else if (e.typ === 'wagenwechsel') {
      altesWagenbild = wagenbild;
      baueBilder();
      gleicheAb();
      geister = [];
      blitze = [];
      if (!ruhig) {
        bewege(jetzt, 150, (p) => {
          const q = sanft(p);
          bild.schwenk = 1 - q;
          s.py = STARTFELD.y * q;
          if (p >= 1) altesWagenbild = null;
        });
      } else {
        altesWagenbild = null;
      }
    } else if (e.typ === 'halt') {
      bild.zug += 1;
      zeigeKarte('halt', fuelle(TEXTE.ende.halt, { zeit: uhrzeit(z.zug) }).split(' / '), jetzt, 120);
    } else if (e.typ === 'hieb') {
      const g = findeGegner(e.id);
      if (g) {
        const f = e.felder[0];
        const dx = Math.sign(f.x - g.x);
        const dy = Math.sign(f.y - g.y);
        g.ansage = null;
        bewege(jetzt, 120, (p) => {
          g.sx = dx * hinUndHer(p) * 0.3;
          g.sy = dy * hinUndHer(p) * 0.3;
        });
      }
      lasseAufblitzen(e.felder, jetzt);
    } else if (e.typ === 'vorstoss') {
      const g = findeGegner(e.id);
      if (g) {
        g.ansage = null;
        if (g.typ === 'draengler') g.erschoepft = true;
        laufeWeg(g, e.von, e.weg, jetzt, 135);
      }
      lasseAufblitzen(e.felder, jetzt);
    } else if (e.typ === 'folgen') {
      const g = findeGegner(e.id);
      if (g) laufeWeg(g, e.von, e.weg, jetzt, 135);
    } else if (e.typ === 'gegnerSchritt') {
      const g = findeGegner(e.id);
      if (g) laufeWeg(g, e.von, [e.nach], jetzt, 120);
    } else if (e.typ === 'ansage') {
      const g = findeGegner(e.id);
      if (g) {
        g.ansage = e.felder;
        g.erschoepft = false;
        bewege(jetzt, 110, (p) => {
          g.zeigen = p;
        });
      }
    } else if (e.typ === 'treffer') {
      bild.herzen = e.herzen;
      bild.ruhe = 0;
      wirkung.treffer = jetzt;
      if (!ruhig) wirkung.wackeln = jetzt;
      bewege(jetzt, 150, (p) => {
        s.blitz = 1 - p;
      }, true);
    } else if (e.typ === 'ausgewichen') {
      bild.ruhe = e.ruhe;
      wirkung.zuwachs = jetzt;
    } else if (e.typ === 'tuerStoss') {
      // gegen die geschlossene Tür: Sie zuckt und gibt ein Stück nach
      wirkung.tuerZu = jetzt;
      bild.zug += 1;
      const von = bild.spalt;
      const nach = Math.min(1, e.n * SPALT_JE_STOSS);
      bewege(jetzt, 110, (p) => {
        s.sy = -hinUndHer(p) * 0.16;
        bild.spalt = von + (nach - von) * sanft(p);
      });
    } else if (e.typ === 'aufgebrochen') {
      bild.herzen = e.herzen;
      wirkung.treffer = jetzt;
      if (!ruhig) wirkung.wackeln = jetzt;
    } else if (e.typ === 'zoegert') {
      // Präsenz: Er wollte angreifen und weicht kurz vor dem Spieler zurück
      const g = findeGegner(e.id);
      if (g) {
        const p = bild.spieler;
        const dx = Math.sign(g.x - p.x);
        const dy = Math.sign(g.y - p.y);
        bewege(jetzt, 150, (q) => {
          g.sx = dx * hinUndHer(q) * 0.14;
          g.sy = dy * hinUndHer(q) * 0.14;
        });
      }
    } else if (e.typ === 'kontrolle') {
      const g = findeGegner(e.id);
      if (g) rede = { x: g.x, y: g.y };
    } else if (e.typ === 'ruhig') {
      const g = findeGegner(e.id);
      if (g) {
        const von = g.ruhig || 0;
        bewege(jetzt, 140, (p) => {
          g.ruhig = von + (e.ruhig - von) * sanft(p);
        });
      }
    } else if (e.typ === 'durchgewinkt') {
      // Er greift an die Mütze und geht durch die Tür.
      const g = findeGegner(e.id);
      if (g) {
        bild.gegner = bild.gegner.filter((x) => x !== g);
        const geist = { g, alpha: 1 };
        geister.push(geist);
        bewege(jetzt, 420, (p) => {
          g.winkt = Math.min(1, p * 2.5);
          geist.alpha = p < 0.5 ? 1 : 1 - (p - 0.5) * 2;
          g.sy = p < 0.5 ? 0 : -(p - 0.5) * 0.8;
          if (p >= 1) geister = geister.filter((x) => x !== geist);
        }, true);
      }
      rede = null;
    } else if (e.typ === 'tod') {
      const uebrig = WAGENZAHL - e.wagenNr;
      const text = uebrig === 1 ? TEXTE.ende.einWagen : fuelle(TEXTE.ende.mehrereWagen, { n: TEXTE.zahlwort[uebrig] });
      zeigeKarte('tod', text.split(' / '), jetzt, 280);
    }
  }

  // Nimmt die Ereignisse eines Zugs entgegen und verteilt sie auf die nächsten Augenblicke.
  function spiele(ereignisse, jetzt) {
    rede = null; // der Satz des Kontrolleurs verschwindet mit der nächsten Eingabe
    const phasen = [[], [], []];
    for (const e of ereignisse) phasen[e.phase].push(e);
    let zeit = jetzt;
    for (let p = 0; p < 3; p++) {
      if (!phasen[p].length) continue;
      wartend.push({ zeit, liste: phasen[p] });
      const nurWarten = p === 0 && phasen[p].every((e) => e.typ === 'warten' || e.typ === 'ungueltig');
      zeit += nurWarten ? 30 : p === 0 ? 100 : p === 1 ? 125 : 115;
    }
    wartend.push({ zeit, liste: null });
    arbeiteAb(jetzt);
  }

  function arbeiteAb(jetzt) {
    while (wartend.length && wartend[0].zeit <= jetzt) {
      const dran = wartend[0];
      if (dran.liste) {
        wartend.shift();
        for (const e of dran.liste) wendeAn(e, jetzt);
        continue;
      }
      // der Abgleich am Ende wartet, bis keine Bewegung mehr läuft
      if (laeufer.some((l) => !l.bleibt)) break;
      wartend.shift();
      gleicheAb();
    }
  }

  // Alles, was noch läuft, sofort zu Ende bringen. Treffer und Aufblitzen laufen weiter.
  function beschleunige(jetzt) {
    for (const dran of wartend) if (dran.liste) for (const e of dran.liste) wendeAn(e, jetzt);
    wartend = [];
    for (const l of laeufer) if (!l.bleibt) l.schritt(1);
    laeufer = laeufer.filter((l) => l.bleibt);
    if (z) gleicheAb();
  }

  function neueFahrt(zustand, jetzt) {
    z = zustand;
    wartend = [];
    laeufer = laeufer.filter((l) => l.bleibt);
    geister = [];
    blitze = [];
    bild.gegner = [];
    bild.tuer = 0;
    bild.spalt = 0;
    rede = null;
    altesWagenbild = null;
    bild.wagenNr = -1;
    gleicheAb();
    if (karte) karte.geht = jetzt;
  }

  // ---------------------------------------------------------------- Lichter draußen

  function neuesLicht(seite, fern, fest) {
    const warm = fest || Math.random() < 0.78;
    lichter.push({
      seite,
      fern,
      ort: fern ? 0.55 + Math.random() * 0.45 : 0.3 + Math.random() * 0.5,
      y: -60,
      tempo: fern ? 34 + Math.random() * 30 : fest ? 340 : 250 + Math.random() * 130,
      groesse: fern ? 3 + Math.random() * 3 : fest ? 30 : 16 + Math.random() * 20,
      hell: fern ? 0.5 + Math.random() * 0.4 : fest ? 1 : 0.55 + Math.random() * 0.45,
      farbe: warm ? '255, 205, 140' : '175, 205, 255',
      zug: fern ? 0 : 0.7,
    });
  }

  function bewegeLichter(dt) {
    const fluss = bild.ruhe >= RUHE_VOLL && !karte;
    const bremse = ruhig ? 0.2 : 1;
    for (const l of lichter) l.y += l.tempo * dt * bremse;
    lichter = lichter.filter((l) => l.y < layout.hoehe + 80);
    fernIn -= dt * bremse;
    if (fernIn <= 0) {
      neuesLicht(Math.random() < 0.5 ? -1 : 1, true, false);
      fernIn = 0.7 + Math.random() * 1.4;
    }
    if (fluss && !ruhig) {
      // im Takt der Schienen: links, kurz darauf rechts, dann Pause
      const vorher = taktUhr;
      taktUhr = (taktUhr + dt) % TAKT;
      if (taktUhr < vorher) {
        neuesLicht(-1, false, true);
        if (melder.takt) melder.takt(0);
      }
      if (vorher < 0.2 && taktUhr >= 0.2) {
        neuesLicht(1, false, true);
        if (melder.takt) melder.takt(1);
      }
    } else {
      taktUhr = TAKT - 0.05;
      lichtIn -= dt * bremse;
      if (lichtIn <= 0) {
        neuesLicht(Math.random() < 0.5 ? -1 : 1, false, false);
        lichtIn = 0.5 + Math.random() * 1.7;
      }
    }
  }

  // ---------------------------------------------------------------- Zeichnen

  function maleRot(t) {
    const { boden, s } = layout;
    const puls = ruhig ? 0.5 : (Math.sin((t * Math.PI * 2) / 1.15) + 1) / 2;
    const gemalt = new Map();
    for (const g of bild.gegner) {
      if (!g.ansage) continue;
      g.ansage.forEach((f, i) => {
        const nr = feldNr(f.x, f.y);
        const vor = i === 0 ? g : g.ansage[i - 1];
        const eintrag = { f, zeigen: g.zeigen, dx: Math.sign(f.x - vor.x), dy: Math.sign(f.y - vor.y), pfeil: g.typ !== 'pendler' };
        if (!gemalt.has(nr) || gemalt.get(nr).zeigen < eintrag.zeigen) gemalt.set(nr, eintrag);
      });
    }
    for (const { f, zeigen, dx, dy, pfeil } of gemalt.values()) {
      const x = boden.x + f.x * s;
      const y = boden.y + f.y * s;
      stift.fillStyle = `rgba(232, 64, 47, ${(0.24 + 0.2 * puls) * zeigen})`;
      rundesRechteck(stift, x + 2, y + 2, s - 4, s - 4, s * 0.1);
      stift.fill();
      stift.strokeStyle = `rgba(255, 122, 99, ${(0.6 + 0.35 * puls) * zeigen})`;
      stift.lineWidth = 2;
      rundesRechteck(stift, x + 3, y + 3, s - 6, s - 6, s * 0.09);
      stift.stroke();
      if (pfeil && (dx || dy)) {
        // kleiner Winkel: aus dieser Richtung kommt er
        const cx = x + s / 2;
        const cy = y + s / 2;
        const a = s * 0.1;
        stift.strokeStyle = `rgba(255, 190, 170, ${0.55 * zeigen})`;
        stift.lineWidth = Math.max(1.5, s * 0.035);
        stift.lineCap = 'round';
        stift.lineJoin = 'round';
        stift.beginPath();
        stift.moveTo(cx - dx * a - dy * a, cy - dy * a - dx * a);
        stift.lineTo(cx + dx * a, cy + dy * a);
        stift.lineTo(cx - dx * a + dy * a, cy - dy * a + dx * a);
        stift.stroke();
      }
    }
    for (const b of blitze) {
      for (const f of b.felder) {
        stift.fillStyle = `rgba(255, 214, 200, ${0.6 * b.staerke})`;
        rundesRechteck(stift, boden.x + f.x * s + 2, boden.y + f.y * s + 2, s - 4, s - 4, s * 0.1);
        stift.fill();
      }
    }
  }

  function istVorn(g) {
    if (g.typ !== 'gruppe') return false;
    return !bild.gegner.some((a) => a.typ === 'gruppe' && a.gruppe === g.gruppe && a.rang < g.rang);
  }

  function maleGegner(g, t, alpha, oy) {
    const { boden, s } = layout;
    const cx = boden.x + (g.px + g.sx + 0.5) * s;
    const fy = boden.y + (g.py + g.sy + 0.86) * s + oy;
    let neigung = 0;
    if (g.typ === 'draengler' && g.ansage && g.ansage.length) neigung = Math.sign(g.ansage[0].x - g.x) * 0.55;
    // Der Kontrolleur hält dem, der in seiner Nähe ist, die Zange hin. Sie sinkt, je länger man ruhig steht.
    let zeigt = null;
    let heben = 0;
    if (g.typ === 'kontrolleur') {
      const p = bild.spieler;
      const nah = Math.max(Math.abs(p.x - g.x), Math.abs(p.y - g.y)) === 1;
      const ziel = g.ansage && g.ansage.length ? g.ansage[0] : nah ? p : null;
      if (ziel) zeigt = { x: ziel.x - g.x, y: ziel.y - g.y };
      heben = g.ansage ? 1 : nah ? 1 - ((g.ruhig || 0) / GEGNERWERTE.kontrolleur.geduld) * 0.85 : 0;
    }
    maleFigur(stift, g.typ, cx, fy, s, {
      zeigt,
      heben,
      winkt: g.winkt || 0,
      t,
      takt: g.id * 1.7,
      alpha,
      blitz: g.blitz,
      ruhig,
      neigung,
      pausiert: g.pausiert && !g.ansage,
      vorderster: istVorn(g),
      erschoepft: g.erschoepft,
      ansagend: !!g.ansage,
    });
    if (alpha > 0.5) {
      const kopf = g.typ === 'gruppe' ? 0.74 : g.typ === 'draengler' ? (g.erschoepft ? 0.74 : 0.94) : g.typ === 'kontrolleur' ? 0.94 : 0.86;
      malePunkte(stift, cx, fy - s * kopf, s, g.hp, GEGNERWERTE[g.typ].hp);
    }
  }

  function maleSchild(text, cx, cy) {
    const raster = 2;
    const b = textBreite(text) * raster + 14;
    const h = ZEILENHOEHE * raster + 10;
    const x = begrenze(Math.round(cx - b / 2), 6, layout.breite - b - 6);
    const y = Math.round(cy - h / 2);
    stift.fillStyle = 'rgba(13, 17, 25, 0.94)';
    rundesRechteck(stift, x, y, b, h, 6);
    stift.fill();
    stift.strokeStyle = FARBE.tafelRand;
    stift.lineWidth = 1;
    rundesRechteck(stift, x + 0.5, y + 0.5, b - 1, h - 1, 6);
    stift.stroke();
    const feld = neuesPunktfeld(textBreite(text), ZEILENHOEHE);
    schreibe(feld, text, 0, 0);
    zeichnePunktfeld(stift, feld, x + 7, y + 6, raster, FARBE.bernstein, null);
  }

  function figurAuf(x, y) {
    const p = bild.spieler;
    return (p.x === x && p.y === y) || bild.gegner.some((g) => g.x === x && g.y === y);
  }

  // Das Schild steht über dem Feld. Steht dort schon jemand, weicht es nach unten aus.
  function schildAn(feld, hoch) {
    const { boden, s } = layout;
    const cx = boden.x + (feld.x + 0.5) * s;
    const obenFrei = feld.y > 0 && !figurAuf(feld.x, feld.y - 1);
    const untenFrei = feld.y < 7 && !figurAuf(feld.x, feld.y + 1);
    if (obenFrei || !untenFrei) return { cx, cy: boden.y + feld.y * s - s * hoch };
    return { cx, cy: boden.y + (feld.y + 1) * s + s * 0.32 };
  }

  // Höchstens ein Hinweis, und nur in dem Augenblick, in dem die Lage zu sehen ist.
  function maleHinweis() {
    if (!hinweis || karte || bild.schwenk > 0.01) return;
    const p = bild.spieler;
    const markiert = bild.gegner.some((g) => g.ansage && g.ansage.some((f) => f.x === p.x && f.y === p.y));
    // den Kontrolleur schlägt das Spiel nicht vor
    const nachbar = bild.gegner.find((a) => a.typ !== 'kontrolleur' && Math.abs(a.x - p.x) + Math.abs(a.y - p.y) === 1);
    if (hinweis.wischen && bild.zug === 0) {
      const ort = schildAn(p, 0.42);
      maleSchild(TEXTE.hinweis[hinweis.wischen], ort.cx, ort.cy);
    } else if (hinweis.ausweichen && markiert) {
      const ort = schildAn(p, 0.6);
      maleSchild(TEXTE.hinweis.ausweichen, ort.cx, ort.cy);
    } else if (hinweis.anrempeln && nachbar && !markiert) {
      const ort = schildAn(nachbar, 0.4);
      maleSchild(TEXTE.hinweis.anrempeln, ort.cx, ort.cy);
    }
  }

  function maleWelt(t, jetzt) {
    const { boden, rumpf, s, wagenlaenge } = layout;
    const oy = -bild.schwenk * wagenlaenge;
    if (altesWagenbild && bild.schwenk > 0) {
      const alt = (1 - bild.schwenk) * wagenlaenge;
      stift.drawImage(altesWagenbild, rumpf.x, rumpf.y + alt, rumpf.b, rumpf.h);
      maleTuer(stift, layout, 1, t, 0, alt);
    }
    if (wagenbild) stift.drawImage(wagenbild, rumpf.x, rumpf.y + oy, rumpf.b, rumpf.h);
    let zucken = 0;
    const seit = jetzt - wirkung.tuerZu;
    if (seit < 160 && !ruhig) zucken = Math.sin(seit / 12) * 1.5 * (1 - seit / 160);
    maleTuer(stift, layout, bild.tuer, t, zucken, oy, bild.spalt);

    const imWechsel = bild.schwenk > 0.01;
    if (!imWechsel) {
      maleLichtschein(stift, layout, lichter, klar);
      maleRot(t);
      maleTuerlicht(stift, layout, bild.tuer, t, ruhig);
    }

    // Figuren von hinten nach vorn
    const p = bild.spieler;
    const reihe = [];
    for (const g of bild.gegner) reihe.push({ y: g.py + g.sy, g, alpha: 1 });
    for (const geist of geister) reihe.push({ y: geist.g.py + geist.g.sy, g: geist.g, alpha: geist.alpha });
    reihe.push({ y: p.py + p.sy + 0.001, spieler: true });
    reihe.sort((a, b) => a.y - b.y);
    for (const eintrag of reihe) {
      if (!eintrag.spieler) {
        maleGegner(eintrag.g, t, eintrag.alpha, oy);
        continue;
      }
      const cx = boden.x + (p.px + p.sx + 0.5) * s;
      const fy = boden.y + (p.py + p.sy + 0.86 - p.hupf) * s;
      if (klar > 0.02) {
        const hof = stift.createRadialGradient(cx, fy, 0, cx, fy, s * 0.62);
        hof.addColorStop(0, `rgba(255, 217, 160, ${0.26 * klar})`);
        hof.addColorStop(1, 'rgba(255, 217, 160, 0)');
        stift.fillStyle = hof;
        stift.fillRect(cx - s * 0.7, fy - s * 0.4, s * 1.4, s * 0.8);
      }
      const tot = karte && karte.art === 'tod';
      maleFigur(stift, 'spieler', cx, fy, s, { t, takt: 0, ruhig, blitz: p.blitz, fluss: klar > 0.5, alpha: tot ? 0.45 : 1 });
      const markiert = bild.gegner.some((g) => g.ansage && g.ansage.some((f) => f.x === p.x && f.y === p.y));
      if (markiert && !imWechsel && !karte) {
        const wippen = ruhig ? 0 : Math.sin(t * 7) * s * 0.025;
        maleAchtung(stift, cx, fy - s * 0.84 + wippen, s);
      }
    }
    if (rede && !karte && !imWechsel) maleRede(TEXTE.kontrolleur.satz, rede, oy);
    maleHinweis();
  }

  // Ein Schild über dem Kopf dessen, der spricht, mit einer Spitze zu ihm hin.
  function maleRede(text, feld, oy) {
    const { boden, s } = layout;
    const cx = boden.x + (feld.x + 0.5) * s;
    const h = ZEILENHOEHE * 2 + 10;
    const cy = boden.y + feld.y * s - s * 0.04 - h / 2 + oy;
    maleSchild(text, cx, cy);
    stift.fillStyle = 'rgba(13, 17, 25, 0.94)';
    stift.beginPath();
    stift.moveTo(cx - 6, cy + h / 2 - 1);
    stift.lineTo(cx, cy + h / 2 + 7);
    stift.lineTo(cx + 6, cy + h / 2 - 1);
    stift.closePath();
    stift.fill();
  }

  function zeichne(jetzt) {
    if (!layout || !z) return;
    // Safari ändert die Höhe, wenn seine Leisten kommen und gehen, oft ohne verlässliches Signal.
    if (leinwand.clientWidth && (leinwand.clientWidth !== layout.breite || leinwand.clientHeight !== layout.hoehe)) passeAn();
    const dt = Math.min(0.05, Math.max(0, (jetzt - letzteZeit) / 1000));
    letzteZeit = jetzt;
    const t = jetzt / 1000;

    arbeiteAb(jetzt);
    for (const l of [...laeufer]) {
      const p = l.dauer <= 0 ? 1 : (jetzt - l.start) / l.dauer;
      l.schritt(begrenze(p, 0, 1));
      if (p >= 1) laeufer = laeufer.filter((x) => x !== l);
    }
    const zielKlar = bild.ruhe >= RUHE_VOLL ? 1 : 0;
    klar += (zielKlar - klar) * Math.min(1, dt * 5);
    bewegeLichter(dt);

    stift.setTransform(dichte, 0, 0, dichte, 0, 0);
    stift.globalAlpha = 1;
    stift.globalCompositeOperation = 'source-over';
    stift.fillStyle = FARBE.nacht;
    stift.fillRect(0, 0, layout.breite, layout.hoehe);

    stift.save();
    const seitWackeln = jetzt - wirkung.wackeln;
    if (seitWackeln < 150) {
      const rest = 1 - seitWackeln / 150;
      stift.translate(Math.sin(seitWackeln / 9) * 5 * rest, Math.cos(seitWackeln / 7) * 3 * rest);
    }
    maleLichter(stift, layout, lichter, klar);
    // der Wagen bleibt unter den Anzeigen, auch während er beim Wechsel durchs Bild schiebt
    stift.beginPath();
    stift.rect(-20, layout.status.y + layout.status.h + 3, layout.breite + 40, layout.hoehe);
    stift.clip();
    maleWelt(t, jetzt);
    stift.restore();

    // Dunst und dunkle Ränder; bei voller Ruhe wird das Bild klar
    stift.fillStyle = `rgba(16, 22, 40, ${0.15 * (1 - klar)})`;
    stift.fillRect(0, 0, layout.breite, layout.hoehe);
    stift.globalAlpha = 0.62 - 0.4 * klar;
    stift.drawImage(schleier, 0, 0, layout.breite, layout.hoehe);
    stift.globalAlpha = 1;
    const seitTreffer = jetzt - wirkung.treffer;
    if (seitTreffer < 150 && !ruhig) {
      stift.fillStyle = `rgba(232, 64, 47, ${0.2 * (1 - seitTreffer / 150)})`;
      stift.fillRect(0, 0, layout.breite, layout.hoehe);
    }

    // Anzeigen am Rand
    const { tafel, status } = layout;
    if (tafelbild) stift.drawImage(tafelbild, tafel.x, tafel.y, tafel.b, tafel.h);
    const verlust = begrenze(1 - seitTreffer / 320, 0, 1);
    maleHerzen(stift, status.x, status.y + status.h / 2, bild.herzen, HERZEN_VOLL, verlust);
    const zuwachs = begrenze(1 - (jetzt - wirkung.zuwachs) / 380, 0, 1);
    maleRuhe(stift, status.x + status.b, status.y + status.h / 2, bild.ruhe, RUHE_VOLL, zuwachs);
    const druck = begrenze(1 - (jetzt - wirkung.uhr) / 140, 0, 1);
    maleUhr(stift, layout.uhr, ABFAHRT + bild.zug, druck);
    maleTonknopf(stift, layout.ton, tonAn);

    if (karte) {
      karte.einblenden = begrenze((jetzt - karte.start) / 150, 0, 1);
      if (karte.geht) {
        karte.weg = begrenze((jetzt - karte.geht) / 150, 0, 1);
        if (ruhig) karte.weg = 1;
      }
      if (karte.weg >= 1) karte = null;
      else if (jetzt >= karte.start) maleKarte(stift, layout, karte, t);
    }
  }

  // ---------------------------------------------------------------- Auskunft

  // Was liegt an diesem Bildschirmpunkt?
  function wasLiegtBei(px, py) {
    if (karte && !karte.geht) {
      const w = kartenMasse(layout, karte.art).weiter;
      if (px >= w.x && px <= w.x + w.b && py >= w.y && py <= w.y + w.h) return { art: 'weiter' };
      return { art: 'karte' };
    }
    const nah = (ort, r) => Math.hypot(px - ort.x, py - ort.y) <= r;
    if (nah(layout.uhr, Math.max(KNOPF / 2 + 2, layout.uhr.r + 2))) return { art: 'uhr' };
    if (nah(layout.ton, KNOPF / 2)) return { art: 'ton' };
    const feld = feldBei(layout, px, py);
    if (feld) return { art: 'feld', x: feld.x, y: feld.y };
    return null;
  }

  return {
    passeAn,
    neueFahrt,
    spiele,
    beschleunige,
    zeichne,
    wasLiegtBei,
    melder,
    setzeHinweis: (name) => {
      hinweis = name;
    },
    setzeTon: (an) => {
      tonAn = an;
    },
    zeigtKarte: () => karte !== null && !karte.geht,
    karteBereit: (jetzt) => karte !== null && !karte.geht && jetzt >= karte.start + 120,
    tuerfeld: () => TUERFELD,
  };
}
