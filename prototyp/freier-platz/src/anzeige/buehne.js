// Die Bühne spielt ab, was der Kern meldet. Sie entscheidet nie über Spielregeln.
//
// "bild" ist der Stand, der gerade zu sehen ist. Er läuft dem echten Zustand hinterher, während
// die Ereignisse einer Runde nacheinander ablaufen. Kommt eine neue Eingabe, bevor alles gezeigt
// ist, springt das Bild sofort ans Ende: Niemand wartet auf das Spiel. Danach steht alles still.

import { GANGSPALTE, LAMPEN, LAMPENNAMEN, SCHRITTE, TASCHENPLATZ, SCHLAEFERPLATZ, WACHERPLATZ, ZIELTUER, istSitz } from '../kern/abteil.js';
import { lichtrichtung } from '../kern/licht.js';
import { PLATZTEXTE, tatsachenZeilen } from '../texte.js';
import { FARBE, rundesRechteck, begrenze, sanft, hinUndHer } from '../../../../src/anzeige/formen.js';
import { neuesPunktfeld, schreibe, schreibeMittig, zeichnePunktfeld, textBreite, ZEILENHOEHE } from '../../../../src/anzeige/matrix.js';
import { berechneMasse, feldAn, feldMitte, lampenGelenk, lampenKopf, lampeAn, endeMasse, protokollMasse, imKasten, LAMPENARM, ENDZEILEN } from './masse.js';
import { maleAbteil, malePunkttafel } from './abteilbild.js';
import { maleTasche, maleReisenden, maleSchlaefer, maleWachen, maleSchaffner, maleWurfschatten, maleLichtkeil, maleLampe, maleFahrkarte, maleSchnipsel, maleTonschalter } from './gestalten.js';

const ABFAHRT_PLATZ = 23 * 60 + 41; // wie im Hauptspiel: Jede Runde ist eine Minute
export const ENDE_PAUSE = 450; // so lange nimmt das Endbild noch nichts an

export function platzUhrzeit(runde) {
  const minuten = (ABFAHRT_PLATZ + runde) % (24 * 60);
  return `${String(Math.floor(minuten / 60)).padStart(2, '0')}:${String(minuten % 60).padStart(2, '0')}`;
}

// Wie lange ein Ereignis das nächste aufhält, in Millisekunden.
const DAUER = {
  schritt: 150,
  nimmt: 220,
  lampe: 300,
  schatten: 300,
  weichtAus: 400,
  nickt: 260,
  locht: 520,
  gruesst: 420,
  schaffnerWeg: 260,
  steht: 160,
  anstoss: 260,
  draengt: 300,
  weckt: 1100,
  satz: 200,
  warten: 60,
};
const SATZ_PAUSE = 110; // so lange ist die Blase weg, wenn er den Satz wiederholt

function dauerVon(e, danach) {
  if (e.typ === 'wartet') return e.neu ? 300 : e.folgt ? 420 : 0;
  if (e.typ === 'schaffnerSchritt') return e.gross ? 320 : 200;
  // der Schatten wandert zugleich mit dem, was ihn bewegt
  if ((e.typ === 'schritt' || e.typ === 'lampe') && danach && danach.typ === 'schatten') return 0;
  return DAUER[e.typ] || 0;
}

export function erzeugeBuehne(leinwand) {
  const stift = leinwand.getContext('2d');
  const ruhig = typeof matchMedia === 'function' && matchMedia('(prefers-reduced-motion: reduce)').matches;

  let masse = null;
  let dichte = 1;
  let z = null; // der echte Zustand, nur zum Lesen
  let abteil = null;
  let tafelbild = null;
  let knopfbild = null;
  let tonAn = false;

  const bild = {
    spieler: { x: 0, y: 0, px: 0, py: 0, sx: 0, sy: 0, arm: null, traegt: false },
    tasche: { liegt: true, px: 0, py: 0, gross: 1 },
    lampen: { A: { w: 0 }, B: { w: 0 } }, // 0 steht auf Fenster, 1 auf Gang
    schatten: { spieler: { da: 0, d: -1, wand: 0 }, schlaefer: { da: 0, d: 1, wand: 0 } },
    schaffner: { da: 1, py: 0, sx: 0, sy: 0, hupf: 0, blick: 'hoch', nick: 0, gruss: 0, zeigt: null, streck: 0, offen: 1, tipp: 0, zettel: 0 },
    schlaefer: { wach: 0, kopfX: 0, kopfY: 0, schultern: 0 },
    karte: { loch: 0 },
  };
  let wartend = []; // Ereignisse, die noch dran sind: { zeit, e }
  let laeufer = []; // laufende Bewegungen: { start, dauer, schritt, bleibt }
  let schnipsel = [];
  let blase = null; // der Satz des Schaffners
  let ende = null; // das Bild nach der Tür
  let protokoll = null; // Zeilen des Testprotokolls, solange es offen ist
  let schaffnerKopf = null; // wo sein Kopf zuletzt gemalt wurde, für Tipps und die Sprechblase
  let spielerKopf = null;
  const wirkung = { stoss: -1e9, warten: -1e9, karte: -1e9, neueFahrt: -1e9 };
  const melder = { klang: null };

  // ---------------------------------------------------------------- Aufbau

  function passeAn() {
    // Maß ist der Canvas selbst: Er folgt der dynamischen Höhe und lässt Notch und Home-Balken frei.
    const breite = Math.max(200, leinwand.clientWidth || window.innerWidth);
    const hoehe = Math.max(240, leinwand.clientHeight || window.innerHeight);
    dichte = Math.min(window.devicePixelRatio || 1, 2.5);
    leinwand.width = Math.round(breite * dichte);
    leinwand.height = Math.round(hoehe * dichte);
    masse = berechneMasse(breite, hoehe);
    abteil = maleAbteil(masse, dichte);
    tafelbild = malePunkttafel(masse.tafel, [{ text: PLATZTEXTE.spiel.anzeige, spalte: 2, zeile: 1 }], dichte, true);
    knopfbild = null;
    if (ende) ende.tafelbild = null;
    // Die Zange zielt auf Bildpunkte: Nach einer Größenänderung neu ausrichten, wenn gerade nichts abläuft.
    if (z && !wartend.length) gleicheAb();
  }

  function lampenwert(name) {
    return z.lampen[name] === 'gang' ? 1 : 0;
  }

  // Worauf die Zange zielt, als Bildpunkt: die Tasche oder der Schatten auf dem Sitz.
  function zielpunkt(ziel) {
    const mitte = feldMitte(masse, ziel.x, ziel.y);
    return { x: mitte.x, y: mitte.y + masse.s * (ziel.was === 'tasche' ? 0.0 : 0.08) };
  }

  // Bild und Zustand in Deckung bringen
  function gleicheAb() {
    const s = bild.spieler;
    s.x = s.px = z.spieler.x;
    s.y = s.py = z.spieler.y;
    s.sx = s.sy = 0;
    s.arm = null;
    s.traegt = z.spieler.tasche;
    bild.tasche.liegt = z.tasche;
    bild.tasche.px = TASCHENPLATZ.x;
    bild.tasche.py = TASCHENPLATZ.y;
    bild.tasche.gross = 1;
    for (const name of LAMPENNAMEN) bild.lampen[name].w = lampenwert(name);
    for (const von of ['spieler', 'schlaefer']) {
      const eintrag = z.schatten.filter((e) => e.von === von)[0];
      const b = bild.schatten[von];
      b.da = eintrag ? 1 : 0;
      if (eintrag) {
        b.d = lichtrichtung(eintrag.lampe, z.lampen[eintrag.lampe]);
        b.wand = eintrag.wand ? 1 : 0;
      }
    }
    const k = bild.schaffner;
    const echt = z.schaffner;
    k.da = echt.weg ? 0 : 1;
    k.py = echt.y;
    k.sx = k.sy = k.hupf = k.nick = k.gruss = k.tipp = k.zettel = 0;
    k.offen = 1;
    k.zeigt = echt.tat === 'wartet' ? zielpunkt(echt.ziel) : null;
    k.streck = k.zeigt ? 1 : 0;
    k.blick = echt.blick || (k.zeigt ? (echt.ziel.x < GANGSPALTE ? 'links' : 'rechts') : 'hoch');
    bild.schlaefer.wach = z.schlaefer.wach ? 1 : 0;
    bild.schlaefer.kopfX = bild.schlaefer.kopfY = bild.schlaefer.schultern = 0;
    bild.karte.loch = z.spieler.gelocht ? 1 : 0;
    if (z.status === 'ende' && !ende) zeigeEnde(z.tatsachen, z.spieler.gelocht, z.runde, -1e9);
  }

  // Eine Bewegung über die Zeit. schritt(p) bekommt 0..1. "bleibt" läuft auch weiter, wenn eine Eingabe alles abkürzt.
  function bewege(start, dauer, schritt, bleibt) {
    laeufer.push({ start, dauer, schritt, bleibt: bleibt === true });
  }

  function klinge(name) {
    if (melder.klang) melder.klang(name);
  }

  // ---------------------------------------------------------------- Ereignisse

  function zeigeBlase() {
    blase = { zeilen: PLATZTEXTE.spiel.satz.split(' / ') };
  }

  function zeigeEnde(tatsachen, lochung, runde, jetzt) {
    blase = null; // hinter dem Abschlussbild bleibt nichts stehen
    const zeilen = tatsachenZeilen(tatsachen);
    ende = { zeilen: zeilen.length ? zeilen : [platzUhrzeit(runde)], lochung, start: jetzt, tafelbild: null, knopfbild: null };
  }

  function lasseSchnipselFallen(x, y, jetzt) {
    const teil = { x, y, fall: 0, staerke: 1 };
    schnipsel.push(teil);
    bewege(jetzt, 480, (p) => {
      teil.fall = p * p;
      teil.staerke = 1 - p * p;
      if (p >= 1) schnipsel = schnipsel.filter((t) => t !== teil);
    }, true);
  }

  // Zeigt ein Ereignis. sofort: ohne Bewegung, weil eine Eingabe das Abspielen abgekürzt hat.
  // Was dann zu sehen sein muss, stellt gleicheAb() aus dem Zustand her. Nur der Satz bliebe sonst ungesehen.
  function wendeAn(e, jetzt, sofort) {
    if (sofort) {
      if ((e.typ === 'satz' || (e.typ === 'wartet' && e.satz)) && !ende) zeigeBlase();
      return;
    }
    const s = bild.spieler;
    const k = bild.schaffner;
    const groesse = masse.s;

    if (e.typ === 'schritt') {
      s.x = e.nach.x;
      s.y = e.nach.y;
      klinge('schritt');
      bewege(jetzt, DAUER.schritt, (p) => {
        const q = sanft(p);
        s.px = e.von.x + (e.nach.x - e.von.x) * q;
        s.py = e.von.y + (e.nach.y - e.von.y) * q;
      });
    } else if (e.typ === 'gehtNicht' || e.typ === 'zuWeit' || e.typ === 'nichts') {
      // kurz zeigen, dass es nicht geht: hinlehnen und zurück. Zu weit: Der Arm streckt sich und reicht nicht.
      let ziel = e.zu ? feldMitte(masse, e.zu.x, e.zu.y) : null;
      if (e.lampe) ziel = lampenkopfJetzt(e.lampe);
      const hier = feldMitte(masse, s.x, s.y);
      const dx = ziel ? ziel.x - hier.x : 0;
      const dy = ziel ? ziel.y - hier.y : 0;
      const weit = Math.hypot(dx, dy);
      if (weit < 1) {
        bewege(jetzt, 140, (p) => {
          s.sy = -hinUndHer(p) * 0.05;
        });
        return;
      }
      const hub = e.typ === 'zuWeit' ? 0.1 : 0.13;
      bewege(jetzt, e.typ === 'zuWeit' ? 260 : 110, (p) => {
        const q = hinUndHer(p);
        s.sx = (dx / weit) * q * hub;
        s.sy = (dy / weit) * q * hub;
        s.arm = e.typ === 'zuWeit' && p < 1 ? { x: (dx / weit) * q * 0.3, y: (dy / weit) * q * 0.3 } : null;
      });
    } else if (e.typ === 'nimmt') {
      const t = bild.tasche;
      klinge('nimmt');
      bewege(jetzt, DAUER.nimmt, (p) => {
        const q = sanft(p);
        t.px = e.von.x + (s.px - e.von.x) * q;
        t.py = e.von.y + (s.py - e.von.y) * q;
        t.gross = 1 - 0.34 * q;
        if (p >= 1) {
          t.liegt = false;
          s.traegt = true;
        }
      });
    } else if (e.typ === 'lampe') {
      const l = bild.lampen[e.name];
      const von = l.w;
      const nach = e.stellung === 'gang' ? 1 : 0;
      klinge('klick');
      bewege(jetzt, DAUER.lampe, (p) => {
        l.w = von + (nach - von) * sanft(p);
      });
    } else if (e.typ === 'schatten') {
      const b = bild.schatten[e.von];
      const vonDa = b.da;
      const vonD = b.d;
      const vonWand = b.wand;
      const nachDa = e.neu ? 1 : 0;
      const nachD = e.neu ? lichtrichtung(e.neu.lampe, z.lampen[e.neu.lampe]) : vonD;
      const nachWand = e.neu ? (e.neu.wand ? 1 : 0) : vonWand;
      const taucht = vonDa < 0.01; // er entsteht: gleich an der richtigen Stelle
      bewege(jetzt, DAUER.schatten, (p) => {
        const q = sanft(p);
        b.da = vonDa + (nachDa - vonDa) * q;
        b.d = taucht ? nachD : vonD + (nachD - vonD) * q;
        b.wand = taucht ? nachWand : vonWand + (nachWand - vonWand) * q;
      });
    } else if (e.typ === 'weichtAus') {
      // ein kleiner Schritt zurück, weg vom Schatten, und wieder hin
      bewege(jetzt, DAUER.weichtAus, (p) => {
        k.sy = Math.sin(Math.min(1, p * 1.25) * Math.PI) * 0.26;
        k.hupf = hinUndHer(Math.min(1, p * 2.5)) * 0.05;
      });
    } else if (e.typ === 'nickt') {
      const vorher = k.zeigt;
      bewege(jetzt, DAUER.nickt, (p) => {
        k.nick = hinUndHer(p);
        if (k.zeigt !== vorher) return; // inzwischen zeigt die Zange schon auf etwas Neues
        // zufrieden: Die Zange sinkt
        k.streck = Math.min(k.streck, 1 - sanft(p));
        if (p >= 1) k.zeigt = null;
      });
    } else if (e.typ === 'wartet') {
      const ziel = zielpunkt(e.ziel);
      k.blick = e.ziel.x < GANGSPALTE ? 'links' : 'rechts';
      if (e.neu) {
        k.zeigt = ziel;
        bewege(jetzt, 240, (p) => {
          k.streck = sanft(p);
        });
        // auf einen Schatten tippt die Zange einmal
        if (e.ziel.was === 'schatten') tippeMitZange(jetzt + 240);
      } else if (e.folgt) {
        // die Zange bleibt oben, wandert zum neuen Ding und tippt einmal darauf
        const von = k.zeigt || ziel;
        k.zeigt = { x: von.x, y: von.y };
        k.streck = 1;
        bewege(jetzt, 200, (p) => {
          const q = sanft(p);
          k.zeigt.x = von.x + (ziel.x - von.x) * q;
          k.zeigt.y = von.y + (ziel.y - von.y) * q;
        });
        tippeMitZange(jetzt + 200);
      }
      if (e.satz) zeigeBlase();
    } else if (e.typ === 'satz') {
      // Er wiederholt den Satz: Die Blase geht kurz weg und neu auf, sonst sähe der Tipp aus wie nichts.
      blase = null;
      bewege(jetzt + SATZ_PAUSE, 0, () => {
        if (!ende) zeigeBlase();
      });
    } else if (e.typ === 'locht') {
      // Die Zange geht zum Fahrschein, schließt, ein Schnipsel fällt.
      const gast = feldMitte(masse, e.x, e.y);
      const seite = e.x < GANGSPALTE ? -1 : 1;
      k.blick = seite < 0 ? 'links' : 'rechts';
      const cx = masse.boden.x + (GANGSPALTE + 0.5) * groesse;
      const schein = { x: cx + seite * Math.min(Math.abs(gast.x - cx) - groesse * 0.36, groesse * 1.0), y: gast.y + groesse * 0.02 };
      k.zeigt = schein;
      const istSpieler = e.wen === 'spieler';
      let geknipst = false;
      bewege(jetzt, DAUER.locht, (p) => {
        if (k.zeigt !== schein) return;
        k.streck = p < 0.34 ? sanft(p / 0.34) : p > 0.7 ? 1 - sanft((p - 0.7) / 0.3) : 1;
        k.offen = p < 0.34 ? 1 : p < 0.62 ? 0 : sanft((p - 0.62) / 0.38);
        k.zettel = p < 0.2 ? p / 0.2 : p > 0.7 ? Math.max(0, 1 - (p - 0.7) / 0.2) : 1;
        if (p >= 0.34 && !geknipst) {
          geknipst = true;
          klinge('knips');
          lasseSchnipselFallen(schein.x, schein.y, jetzt + DAUER.locht * 0.34);
          if (istSpieler) {
            // die Lochung entsteht auf der Fahrkarte
            bewege(jetzt + DAUER.locht * 0.34, 160, (q) => {
              bild.karte.loch = Math.max(bild.karte.loch, sanft(q));
            }, true);
            lasseSchnipselFallen(masse.karte.x + masse.karte.b * 0.66, masse.karte.y + masse.karte.h * 0.6, jetzt + DAUER.locht * 0.34);
          }
        }
        if (p >= 1) {
          k.zeigt = null;
          k.zettel = 0;
          k.blick = 'hoch';
        }
      });
    } else if (e.typ === 'gruesst') {
      k.blick = e.x < GANGSPALTE ? 'links' : 'rechts';
      bewege(jetzt, DAUER.gruesst, (p) => {
        k.gruss = Math.sin(Math.min(1, p * 1.15) * Math.PI);
        if (p >= 1) k.blick = 'hoch';
      });
    } else if (e.typ === 'schaffnerSchritt') {
      k.blick = 'hoch';
      klinge('schritt');
      bewege(jetzt, e.gross ? 320 : 200, (p) => {
        k.py = e.von.y + (e.nach.y - e.von.y) * sanft(p);
        // über einen Schatten im Gang macht er einen sichtbar großen Schritt
        k.hupf = e.gross ? hinUndHer(p) * 0.2 : 0;
      });
    } else if (e.typ === 'schaffnerWeg') {
      k.blick = 'hoch';
      bewege(jetzt, DAUER.schaffnerWeg, (p) => {
        k.py = e.von.y - 0.55 * sanft(p);
        k.da = 1 - p;
      });
    } else if (e.typ === 'steht') {
      // er will weiter, vor ihm steht der Spieler
      bewege(jetzt, DAUER.steht, (p) => {
        k.sy = -hinUndHer(p) * 0.07;
      });
    } else if (e.typ === 'anstoss') {
      const r = SCHRITTE[e.richtung];
      bewege(jetzt, 200, (p) => {
        s.sx = r.x * hinUndHer(p) * 0.2;
        s.sy = r.y * hinUndHer(p) * 0.2;
      });
      // er dreht die Mütze zum Spieler, sonst nichts. Zeigt der Schirm schon dorthin, sieht man ihn
      // trotzdem: Er wendet sich kurz zum Spieler hin.
      const zu = SCHRITTE[e.blick];
      bewege(jetzt + 90, 10, () => {
        k.blick = e.blick;
      });
      bewege(jetzt + 60, 240, (p) => {
        k.sx = zu.x * hinUndHer(p) * 0.06;
        k.sy = zu.y * hinUndHer(p) * 0.05;
      });
    } else if (e.typ === 'draengt') {
      const vonK = k.py;
      const quer = e.von.x === e.nach.x ? 1 : 0; // im Gang aneinander vorbei
      s.x = e.nach.x;
      s.y = e.nach.y;
      k.zeigt = null;
      k.streck = 0;
      k.blick = 'hoch';
      klinge('schritt');
      bewege(jetzt, DAUER.draengt, (p) => {
        const q = sanft(p);
        s.px = e.von.x + (e.nach.x - e.von.x) * q;
        s.py = e.von.y + (e.nach.y - e.von.y) * q;
        s.sx = quer * hinUndHer(p) * 0.2;
        k.py = vonK + (e.schaffnerNach.y - vonK) * q;
        k.sx = -quer * hinUndHer(p) * 0.2;
      });
    } else if (e.typ === 'warten') {
      wirkung.warten = jetzt;
    } else if (e.typ === 'weckt') {
      // Er wacht auf, sieht zum Schaffner, dann zum Nebensitz, hebt die Schultern, bleibt sitzen.
      const f = bild.schlaefer;
      let bx = -0.8;
      let by = 0.6;
      if (e.schaffner) {
        const dy = e.schaffner.y - SCHLAEFERPLATZ.y;
        const weit = Math.hypot(1, dy);
        bx = -1 / weit;
        by = dy / weit;
      }
      const zumFenster = Math.sign(LAMPEN.B.fensterplatz - LAMPEN.B.gangplatz);
      bewege(jetzt, DAUER.weckt, (p) => {
        const t = p * 4.4; // vier Abschnitte und ein Ausklang
        f.wach = Math.min(1, sanft(Math.min(1, t)));
        const zuIhm = t < 1 ? 0 : t < 2 ? sanft(t - 1) : t < 2.4 ? 1 - sanft((t - 2) / 0.4) : 0;
        const zumSitz = t < 2.2 ? 0 : t < 3 ? sanft((t - 2.2) / 0.8) : t < 3.4 ? 1 - sanft((t - 3) / 0.4) : 0;
        f.kopfX = bx * 0.05 * zuIhm + zumFenster * 0.055 * zumSitz;
        f.kopfY = by * 0.035 * zuIhm + 0.01 * zumSitz;
        f.schultern = t < 3.3 ? 0 : hinUndHer(Math.min(1, (t - 3.3) / 1.0)) * 0.05;
      });
    } else if (e.typ === 'stoss') {
      // Schienenstoß: Das Bild ruckt, beide Lampen schwingen, ihre Schatten zucken. Ta-tack.
      wirkung.stoss = jetzt;
      wirkung.stossZange = e.zange;
      klinge('tatack');
    } else if (e.typ === 'ende') {
      zeigeEnde(e.tatsachen, e.lochung, e.runde, jetzt + 300);
    }
  }

  function tippeMitZange(start) {
    const k = bild.schaffner;
    bewege(start, 180, (p) => {
      k.tipp = hinUndHer(p);
    });
  }

  // Nimmt die Ereignisse einer Runde entgegen und verteilt sie auf die nächsten Augenblicke.
  function spiele(ereignisse, zustand, jetzt) {
    z = zustand;
    let zeit = jetzt;
    // Rückt der Spieler dem Schaffner nach, bewegen sich beide zugleich.
    let zugleich = ereignisse.length > 0 && ereignisse[0].typ === 'schritt' && ereignisse[0].rueckt;
    for (let i = 0; i < ereignisse.length; i++) {
      const e = ereignisse[i];
      wartend.push({ zeit, e });
      if (zugleich) {
        if (e.typ === 'schaffnerSchritt' || e.typ === 'schaffnerWeg') {
          zugleich = false;
          zeit += dauerVon(e, null);
        }
        continue;
      }
      zeit += dauerVon(e, ereignisse[i + 1]);
    }
    wartend.push({ zeit, e: null });
    arbeiteAb(jetzt);
  }

  function arbeiteAb(jetzt) {
    while (wartend.length && wartend[0].zeit <= jetzt) {
      const dran = wartend[0];
      if (dran.e) {
        wartend.shift();
        wendeAn(dran.e, jetzt, false);
        continue;
      }
      // der Abgleich am Ende wartet, bis keine Bewegung mehr läuft
      if (laeufer.some((l) => !l.bleibt)) break;
      wartend.shift();
      gleicheAb();
    }
  }

  // Alles, was noch läuft, sofort zu Ende bringen. Der Satz verschwindet mit der nächsten Eingabe.
  function beschleunige(jetzt) {
    blase = null;
    for (const dran of wartend) if (dran.e) wendeAn(dran.e, jetzt, true);
    wartend = [];
    for (const l of laeufer) if (!l.bleibt) l.schritt(1);
    laeufer = laeufer.filter((l) => l.bleibt);
    if (z) gleicheAb();
  }

  function neueFahrt(zustand) {
    z = zustand;
    wartend = [];
    laeufer = [];
    schnipsel = [];
    blase = null;
    ende = null;
    wirkung.stoss = -1e9;
    gleicheAb();
  }

  // ---------------------------------------------------------------- Zeichnen

  function lampenwinkel(name, w, schwung) {
    // Der Kopf sitzt auf der Seite, von der das Licht kommt. Beim Schwenken geht der Arm oben herum.
    const rechtsBeiFenster = lichtrichtung(name, 'fenster') < 0;
    return (rechtsBeiFenster ? -Math.PI * w : -Math.PI * (1 - w)) + schwung;
  }

  function lampenkopfJetzt(name) {
    const gelenk = lampenGelenk(masse, name);
    const winkel = lampenwinkel(name, bild.lampen[name].w, 0);
    return { x: gelenk.x + Math.cos(winkel) * LAMPENARM * masse.s, y: gelenk.y + Math.sin(winkel) * LAMPENARM * masse.s };
  }

  // Schienenstoß: zwei kurze Ausschläge kurz nacheinander, 0..1 und wieder 0
  function stossAusschlag(jetzt) {
    const seit = jetzt - wirkung.stoss;
    if (seit < 0 || seit > 520) return 0;
    const erster = seit < 150 ? Math.sin((seit / 150) * Math.PI) : 0;
    const zweiter = seit > 190 && seit < 340 ? Math.sin(((seit - 190) / 150) * Math.PI) * 0.7 : 0;
    return erster + zweiter;
  }

  function maleLicht(jetzt) {
    const { boden, rumpf, s } = masse;
    const seit = jetzt - wirkung.stoss;
    const schwung = seit >= 0 && seit < 900 ? Math.sin(seit / 55) * 0.11 * (1 - seit / 900) : 0;
    for (const name of LAMPENNAMEN) {
      const gelenk = lampenGelenk(masse, name);
      const winkel = lampenwinkel(name, bild.lampen[name].w, 0);
      const kopf = { x: gelenk.x + Math.cos(winkel) * LAMPENARM * s, y: gelenk.y + Math.sin(winkel) * LAMPENARM * s };
      const richtung = Math.cos(winkel) > 0 ? -1 : 1; // das Licht fällt vom Kopf weg über das Paar
      const staerke = Math.pow(Math.abs(Math.cos(winkel)), 1.5);
      const zumFenster = Math.sign(LAMPEN[name].fensterplatz - LAMPEN[name].gangplatz);
      // bis an die Wand oder bis über das Gangfeld
      const fern = richtung === zumFenster ? (zumFenster < 0 ? rumpf.x + 2 : rumpf.x + rumpf.b - 2) : boden.x + (GANGSPALTE + (zumFenster < 0 ? 1 : 0)) * s;
      const oben = boden.y + LAMPEN[name].reihe * s + s * 0.03;
      maleLichtkeil(stift, kopf, richtung, Math.abs(fern - kopf.x), oben, oben + s * 0.94, s, staerke * (1 + schwung * 0.8));
    }
  }

  function maleSchattenAlle(jetzt) {
    const { boden, rumpf, s, wandSeite } = masse;
    const zucken = stossAusschlag(jetzt) * Math.max(3, s * 0.07);
    stift.save();
    stift.beginPath();
    stift.rect(rumpf.x + 1, rumpf.y, rumpf.b - 2, rumpf.h);
    stift.clip();
    for (const von of ['spieler', 'schlaefer']) {
      const b = bild.schatten[von];
      if (b.da < 0.01 || Math.abs(b.d) < 0.02) continue;
      const besitzerX = von === 'spieler' ? bild.spieler.px + bild.spieler.sx : SCHLAEFERPLATZ.x;
      const besitzerY = von === 'spieler' ? bild.spieler.py : SCHLAEFERPLATZ.y;
      const richtung = b.d < 0 ? -1 : 1;
      const lang = (s * 0.84 * (1 - b.wand) + (wandSeite - 2) * b.wand) * Math.abs(b.d);
      const fussX = boden.x + (besitzerX + 0.5 + richtung * 0.52) * s + richtung * zucken;
      const fussY = boden.y + (besitzerY + 0.6) * s;
      maleWurfschatten(stift, fussX, fussY, richtung, lang, s * 0.5, b.da);
    }
    stift.restore();
  }

  function maleLampen(jetzt) {
    const s = masse.s;
    const seit = jetzt - wirkung.stoss;
    const schwung = seit >= 0 && seit < 900 ? Math.sin(seit / 55) * 0.11 * (1 - seit / 900) : 0;
    for (const name of LAMPENNAMEN) {
      maleLampe(stift, lampenGelenk(masse, name), lampenwinkel(name, bild.lampen[name].w, schwung), s, LAMPENARM * s);
    }
  }

  function maleBlase(anker) {
    const raster = 2;
    const breit = Math.max(textBreite(blase.zeilen[0]), textBreite(blase.zeilen[1] || ''));
    const b = breit * raster + 18;
    const h = blase.zeilen.length * (ZEILENHOEHE + 1) * raster + 12;
    const x = begrenze(Math.round(anker.x - b / 2), 6, masse.breite - b - 6);
    const oben = masse.tafel.y + masse.tafel.h + 4;
    let y = Math.max(oben, Math.round(anker.y - h - 12));
    let fuss = anker.x; // wo die Spitze an der Blase ansetzt
    let spitze = { x: anker.x, y: y + h + 8 };
    // Steht die eigene Figur direkt über ihm im Gang, geht die Blase über sie hinweg,
    // und die Spitze reicht neben ihr herunter bis zu seinem Kopf.
    const p = bild.spieler;
    if (spielerKopf && Math.round(p.px) === GANGSPALTE && Math.round(p.py) === Math.round(bild.schaffner.py) - 1) {
      const seite = bild.schaffner.zeigt && bild.schaffner.zeigt.x > anker.x ? -1 : 1; // weg von der Zange
      y = Math.max(oben, Math.round(spielerKopf.y - h - 8));
      fuss = begrenze(anker.x + seite * masse.s * 0.38, x + 12, x + b - 12);
      spitze = { x: anker.x + seite * masse.s * 0.12, y: anker.y - masse.s * 0.1 };
    }
    stift.fillStyle = 'rgba(13, 17, 25, 0.96)';
    rundesRechteck(stift, x, y, b, h, 8);
    stift.fill();
    // die Spitze zeigt auf den, der spricht
    stift.beginPath();
    stift.moveTo(fuss - 7, y + h - 1);
    stift.lineTo(spitze.x, spitze.y);
    stift.lineTo(fuss + 7, y + h - 1);
    stift.closePath();
    stift.fill();
    stift.strokeStyle = FARBE.tafelRand;
    stift.lineWidth = 1;
    rundesRechteck(stift, x + 0.5, y + 0.5, b - 1, h - 1, 8);
    stift.stroke();
    const feld = neuesPunktfeld(breit, blase.zeilen.length * (ZEILENHOEHE + 1));
    blase.zeilen.forEach((zeile, i) => schreibeMittig(feld, zeile, i * (ZEILENHOEHE + 1)));
    zeichnePunktfeld(stift, feld, x + 9, y + 7, raster, FARBE.bernstein, null);
  }

  function maleWelt(t, jetzt) {
    const { boden, rumpf, s } = masse;
    stift.drawImage(abteil, rumpf.x, rumpf.y, rumpf.b, rumpf.h);
    maleLicht(jetzt);
    maleSchattenAlle(jetzt);
    if (bild.tasche.liegt) {
      maleTasche(stift, boden.x + (bild.tasche.px + 0.5) * s, boden.y + (bild.tasche.py + 0.62) * s, s, bild.tasche.gross);
    }
    maleLampen(jetzt);

    // Figuren von hinten nach vorn, der Schaffner mit seinem Arm zuletzt in seiner Reihe
    const p = bild.spieler;
    const k = bild.schaffner;
    const reihe = [
      { y: SCHLAEFERPLATZ.y, wer: 'schlaefer' },
      { y: WACHERPLATZ.y, wer: 'wacher' },
      { y: p.py + p.sy + 0.001, wer: 'spieler' },
    ];
    if (k.da > 0.01) reihe.push({ y: k.py + k.sy + 0.002, wer: 'schaffner' });
    reihe.sort((a, b) => a.y - b.y);
    let anker = null;
    schaffnerKopf = null;
    for (const eintrag of reihe) {
      if (eintrag.wer === 'schlaefer') {
        const atem = ruhig ? 0 : Math.sin(t * 1.1);
        maleSchlaefer(stift, boden.x + (SCHLAEFERPLATZ.x + 0.5) * s, boden.y + (SCHLAEFERPLATZ.y + 0.86) * s, s, {
          wach: bild.schlaefer.wach,
          atem,
          kopfX: bild.schlaefer.kopfX,
          kopfY: bild.schlaefer.kopfY,
          schultern: bild.schlaefer.schultern,
        });
      } else if (eintrag.wer === 'wacher') {
        maleWachen(stift, boden.x + (WACHERPLATZ.x + 0.5) * s, boden.y + (WACHERPLATZ.y + 0.86) * s, s);
      } else if (eintrag.wer === 'spieler') {
        // im Sitzen ist die Figur kleiner; beim Hinsetzen und Aufstehen geht das eine ins andere über
        const sitzt = istSitz(Math.round(p.px), Math.round(p.py));
        const gemalt = maleReisenden(stift, boden.x + (p.px + p.sx + 0.5) * s, boden.y + (p.py + p.sy + (sitzt ? 0.86 : 0.9)) * s, s, { sitzt, traegt: p.traegt, arm: p.arm });
        spielerKopf = { x: gemalt.kopfX, y: gemalt.kopfY - gemalt.kopf };
      } else {
        stift.save();
        stift.globalAlpha = k.da;
        const cx = boden.x + (GANGSPALTE + 0.5 + k.sx) * s;
        const fy = boden.y + (k.py + k.sy + 0.9 - k.hupf) * s;
        let zeigt = null;
        if (k.zeigt) {
          const zucken = wirkung.stossZange ? stossAusschlag(jetzt) * Math.max(3, s * 0.07) : 0;
          zeigt = { x: k.zeigt.x + (k.zeigt.x < cx ? -zucken : zucken), y: k.zeigt.y + k.tipp * s * 0.09 };
        }
        const neigung = zeigt ? (zeigt.x < cx ? -1 : 1) * 0.5 * k.streck : 0;
        const gemalt = maleSchaffner(stift, cx, fy, s, { blick: k.blick, nick: k.nick, gruss: k.gruss, neigung, zeigt, streck: k.streck, offen: k.offen });
        if (k.zettel > 0.01) {
          // der Fahrschein, den er gerade locht
          stift.globalAlpha = k.da * k.zettel;
          stift.fillStyle = '#e9dcc0';
          stift.fillRect(gemalt.spitzeX - s * 0.02, gemalt.spitzeY - s * 0.07, s * 0.17, s * 0.11);
        }
        stift.restore();
        anker = { x: cx, y: gemalt.kopfY };
        if (k.da > 0.5) schaffnerKopf = anker;
      }
    }
    for (const teil of schnipsel) maleSchnipsel(stift, teil.x, teil.y + teil.fall * s * 0.4, s, teil.staerke);
    if (blase && anker) maleBlase(anker);
  }

  function maleKnopf(kasten, text, gedrueckt, bildspeicher) {
    const d = gedrueckt * 2;
    stift.fillStyle = '#0b0e15';
    rundesRechteck(stift, kasten.x, kasten.y + 3, kasten.b, kasten.h - 3, 12);
    stift.fill();
    stift.fillStyle = gedrueckt > 0.01 ? '#2a3550' : '#1c2437';
    rundesRechteck(stift, kasten.x, kasten.y + d, kasten.b, kasten.h - 4, 12);
    stift.fill();
    stift.strokeStyle = '#3a4666';
    stift.lineWidth = 1;
    rundesRechteck(stift, kasten.x + 0.5, kasten.y + d + 0.5, kasten.b - 1, kasten.h - 5, 12);
    stift.stroke();
    const breit = textBreite(text);
    const feld = neuesPunktfeld(breit, ZEILENHOEHE);
    schreibe(feld, text, 0, 0);
    const tx = kasten.x + (kasten.b - breit * kasten.raster) / 2;
    const ty = kasten.y + d + (kasten.h - 4 - 7 * kasten.raster) / 2;
    zeichnePunktfeld(stift, feld, tx, ty, kasten.raster, FARBE.bernstein, null);
    return bildspeicher;
  }

  function maleEnde(jetzt) {
    const ein = begrenze((jetzt - ende.start) / 250, 0, 1);
    if (ein <= 0) return;
    const m = endeMasse(masse);
    stift.save();
    stift.fillStyle = `rgba(5, 7, 12, ${0.8 * ein})`;
    stift.fillRect(0, 0, masse.breite, masse.hoehe);
    stift.globalAlpha = sanft(ein);
    stift.fillStyle = '#10141d';
    rundesRechteck(stift, m.x, m.y, m.b, m.h, 16);
    stift.fill();
    stift.strokeStyle = '#2a3346';
    stift.lineWidth = 1;
    rundesRechteck(stift, m.x + 0.5, m.y + 0.5, m.b - 1, m.h - 1, 16);
    stift.stroke();
    if (!ende.tafelbild) {
      // die Zeilen stehen mittig auf der Tafel, eine Leerzeile trennt zwei Tatsachen
      const hoch = ende.zeilen.length * (ZEILENHOEHE + 2) - 2;
      const erste = Math.max(0, Math.floor((m.tafel.zeilen - hoch) / 2));
      const zeilen = ende.zeilen.slice(0, ENDZEILEN).map((text, i) => ({
        text,
        spalte: Math.round((m.tafel.spalten - textBreite(text)) / 2),
        zeile: erste + i * (ZEILENHOEHE + 2),
      }));
      ende.tafelbild = malePunkttafel(m.tafel, zeilen, dichte, false);
    }
    stift.drawImage(ende.tafelbild, m.tafel.x, m.tafel.y, m.tafel.b, m.tafel.h);
    maleFahrkarte(stift, m.karte.x, m.karte.y, m.karte.b, m.karte.h, ende.lochung ? 1 : 0, 0);
    const druck = begrenze(1 - (jetzt - wirkung.neueFahrt) / 140, 0, 1);
    maleKnopf(m.knopf, PLATZTEXTE.spiel.neueFahrt, druck, null);
    stift.restore();
  }

  function maleProtokoll() {
    const m = protokollMasse(masse);
    const h = protokoll.length * m.zeilenhoehe + 2 * m.polster;
    stift.fillStyle = 'rgba(5, 7, 12, 0.86)';
    stift.fillRect(0, 0, masse.breite, masse.hoehe);
    stift.fillStyle = '#10141d';
    rundesRechteck(stift, m.x, m.y, m.b, h, 10);
    stift.fill();
    stift.strokeStyle = '#2a3346';
    stift.lineWidth = 1;
    rundesRechteck(stift, m.x + 0.5, m.y + 0.5, m.b - 1, h - 1, 10);
    stift.stroke();
    const feld = neuesPunktfeld(m.zeichen * 6, protokoll.length * (ZEILENHOEHE + 2));
    protokoll.forEach((zeile, i) => schreibe(feld, zeile, 0, i * (ZEILENHOEHE + 2)));
    zeichnePunktfeld(stift, feld, m.x + m.polster, m.y + m.polster, m.raster, '#c9d2de', null);
  }

  function zeichne(jetzt) {
    if (!masse || !z) return;
    // Safari ändert die Höhe, wenn seine Leisten kommen und gehen, oft ohne verlässliches Signal.
    if (leinwand.clientWidth && (leinwand.clientWidth !== masse.breite || leinwand.clientHeight !== masse.hoehe)) {
      passeAn();
    }
    const t = jetzt / 1000;

    // erst laufende Bewegungen weiterführen, dann neue Ereignisse beginnen: So überschreibt das Ende
    // einer Bewegung nie, was das nächste Ereignis gerade gesetzt hat
    for (const l of laeufer.slice()) {
      if (jetzt < l.start) continue;
      const p = l.dauer <= 0 ? 1 : (jetzt - l.start) / l.dauer;
      l.schritt(begrenze(p, 0, 1));
      if (p >= 1) laeufer = laeufer.filter((x) => x !== l);
    }
    arbeiteAb(jetzt);

    stift.setTransform(dichte, 0, 0, dichte, 0, 0);
    stift.globalAlpha = 1;
    stift.globalCompositeOperation = 'source-over';
    stift.fillStyle = FARBE.nacht;
    stift.fillRect(0, 0, masse.breite, masse.hoehe);

    stift.save();
    // der Schienenstoß: Das Bild ruckt zwei Pixel
    if (!ruhig) stift.translate(0, Math.round(stossAusschlag(jetzt) * 2));
    maleWelt(t, jetzt);
    stift.restore();

    // Anzeigen am Rand
    const { tafel } = masse;
    if (tafelbild) stift.drawImage(tafelbild, tafel.x, tafel.y, tafel.b, tafel.h);
    maleTonschalter(stift, masse.ton, tonAn);
    const kartendruck = begrenze(1 - (jetzt - wirkung.karte) / 160, 0, 1);
    maleFahrkarte(stift, masse.karte.x, masse.karte.y, masse.karte.b, masse.karte.h, bild.karte.loch, kartendruck);
    const druck = begrenze(1 - (jetzt - wirkung.warten) / 140, 0, 1);
    maleKnopf(masse.warten, PLATZTEXTE.spiel.warten, druck, knopfbild);

    if (ende) maleEnde(jetzt);
    if (protokoll) maleProtokoll();
  }

  // ---------------------------------------------------------------- Auskunft

  // Was liegt an diesem Bildschirmpunkt?
  function wasLiegtBei(px, py) {
    if (protokoll) return { art: 'protokoll' };
    if (ende) {
      if (imKasten(endeMasse(masse).knopf, px, py)) return { art: 'neueFahrt' };
      return { art: 'ende' };
    }
    if (Math.hypot(px - masse.ton.x, py - masse.ton.y) <= masse.ton.r) return { art: 'ton' };
    if (imKasten(masse.tafel, px, py)) return { art: 'anzeige' };
    if (imKasten(masse.warten, px, py)) return { art: 'warten' };
    if (imKasten(masse.karte, px, py)) return { art: 'karte' };
    const lampe = lampeAn(masse, z.lampen, px, py);
    const feld = feldAn(masse, px, py);
    // Steht der Schaffner auf dem Feld unter dem Finger, bekommt die Lampe den Tipp nur,
    // wenn er näher an ihrem Kopf liegt als an seinem.
    if (lampe && feld && schaffnerKopf && !z.schaffner.weg && feld.x === GANGSPALTE && feld.y === z.schaffner.y) {
      const kopf = lampenKopf(masse, lampe, z.lampen[lampe]);
      if (Math.hypot(px - schaffnerKopf.x, py - schaffnerKopf.y) < Math.hypot(px - kopf.x, py - kopf.y)) return { art: 'feld', x: feld.x, y: feld.y };
    }
    if (lampe) return { art: 'lampe', name: lampe };
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
    setzeTon: (an) => {
      tonAn = an;
    },
    stupseKarte: (jetzt) => {
      wirkung.karte = jetzt;
    },
    drueckeNeueFahrt: (jetzt) => {
      wirkung.neueFahrt = jetzt;
    },
    zeigeProtokoll: (zeilen) => {
      protokoll = zeilen;
    },
    zeigtProtokoll: () => protokoll !== null,
    zeigtEnde: () => ende !== null,
    endeBereit: (jetzt) => ende !== null && jetzt >= ende.start + ENDE_PAUSE,
    protokollBreite: () => protokollMasse(masse).zeichen,
    aufAnzeige: (px, py) => imKasten(masse.tafel, px, py),
  };
}
