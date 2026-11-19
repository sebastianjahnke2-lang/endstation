// Alles, was im Wagen 7 zu sehen ist: Menschen, Schaffner, Tasche, Lampen, Schatten, Fahrkarte.
// Einfache Formen, niemand hat ein Gesicht. Schatten gibt es nur als flache, geworfene Schatten
// im Lampenlicht: Deshalb hat hier keine Figur den runden Bodenschatten des Hauptspiels.

import { FARBE, rundesRechteck, kreis } from '../../../../src/anzeige/formen.js';

export const PLATZFARBE = {
  licht: '255, 217, 160',
  schatten: '3, 5, 12',
  schaffner: { mantel: '#3a55a4', kopf: '#d3d8e4', schuh: '#10141f', muetze: '#1f2e5e', band: '#d2553f', schirm: '#0d1322', knopf: '#ffb347', arm: '#2f4688' },
  schlaefer: { mantel: '#6d7f98', kopf: '#bcc6d4', schuh: '#3b4658' },
  wacher: { mantel: '#4f9483', kopf: '#b9dbd0', schuh: '#2c5449', buch: '#e9dcc0' },
  tasche: { leder: '#8a6547', naht: '#5c4331', griff: '#4a3526', schild: '#e9dcc0' },
  zange: '#cfd6e2',
  papier: '#e9dcc0',
  papierKante: '#c9bb9a',
  papierFalz: '#d8caa9',
  lampe: { arm: '#8796ae', kopf: '#fff1d6', schirm: '#5b6680' },
};

function strich(stift, punkte, farbe, dicke) {
  stift.strokeStyle = farbe;
  stift.lineWidth = dicke;
  stift.lineCap = 'round';
  stift.lineJoin = 'round';
  stift.beginPath();
  stift.moveTo(punkte[0][0], punkte[0][1]);
  for (let i = 1; i < punkte.length; i++) stift.lineTo(punkte[i][0], punkte[i][1]);
  stift.stroke();
}

// Rumpf und Kopf. (cx, fy) ist der Punkt unter der Figur, s die Feldgröße.
// o: farben, sitzt, neigung, kopfX und kopfY (Versatz des Kopfs in Feldern), schultern (Heben in Feldern)
function maleMensch(stift, cx, fy, s, o) {
  const sitzt = o.sitzt === true;
  const hoch = s * (sitzt ? 0.6 : 0.74);
  const schulter = s * (sitzt ? 0.37 : 0.35);
  const saum = s * (sitzt ? 0.46 : 0.4);
  const kopf = s * 0.12;
  const heben = (o.schultern || 0) * s;
  const schulterY = fy - hoch + kopf * 1.75 - heben;
  const schub = (o.neigung || 0) * hoch * 0.16;
  const r = Math.min(schulter * 0.3, hoch * 0.16);
  const f = o.farben;

  if (!sitzt) {
    stift.fillStyle = f.schuh;
    rundesRechteck(stift, cx - saum * 0.42, fy - hoch * 0.07, saum * 0.36, hoch * 0.09, hoch * 0.03);
    stift.fill();
    rundesRechteck(stift, cx + saum * 0.06, fy - hoch * 0.07, saum * 0.36, hoch * 0.09, hoch * 0.03);
    stift.fill();
  }

  stift.fillStyle = f.mantel;
  stift.beginPath();
  stift.moveTo(cx - saum / 2, fy - hoch * 0.05);
  stift.lineTo(cx - schulter / 2 + schub, schulterY + r);
  stift.quadraticCurveTo(cx - schulter / 2 + schub, schulterY, cx - schulter / 2 + schub + r, schulterY);
  stift.lineTo(cx + schulter / 2 + schub - r, schulterY);
  stift.quadraticCurveTo(cx + schulter / 2 + schub, schulterY, cx + schulter / 2 + schub, schulterY + r);
  stift.lineTo(cx + saum / 2, fy - hoch * 0.05);
  stift.closePath();
  stift.fill();

  const kopfX = cx + schub * 1.35 + (o.kopfX || 0) * s;
  const kopfY = schulterY - kopf * 0.72 + heben * 0.6 + (o.kopfY || 0) * s;
  stift.fillStyle = f.kopf;
  kreis(stift, kopfX, kopfY, kopf);
  stift.fill();
  return { schulterY, kopfX, kopfY, schub, schulter, kopf, hoch };
}

// Die Tasche: liegt auf dem Fensterplatz oder ist beim Spieler. gross: 1 auf dem Sitz, kleiner in der Hand.
export function maleTasche(stift, cx, cy, s, gross) {
  const f = PLATZFARBE.tasche;
  const b = s * 0.46 * gross;
  const h = s * 0.3 * gross;
  const x = cx - b / 2;
  const y = cy - h / 2;
  strich(stift, [[x + b * 0.3, y + 1], [x + b * 0.34, y - h * 0.34], [x + b * 0.66, y - h * 0.34], [x + b * 0.7, y + 1]], f.griff, Math.max(1.5, s * 0.04 * gross));
  stift.fillStyle = f.leder;
  rundesRechteck(stift, x, y, b, h, s * 0.07 * gross);
  stift.fill();
  stift.fillStyle = f.naht;
  stift.fillRect(x + b * 0.08, y + h * 0.3, b * 0.84, Math.max(1, h * 0.09));
  stift.fillStyle = f.schild;
  stift.fillRect(x + b * 0.42, y + h * 0.5, b * 0.16, h * 0.24);
}

// Der Spieler: heller Mantel, bernsteinfarbener Schal, wie im Hauptspiel.
// o: sitzt, neigung, traegt (hat die Tasche), sx (Seite der Tasche im Stehen)
export function maleReisenden(stift, cx, fy, s, o) {
  const f = FARBE.spieler;
  if (o.traegt && !o.sitzt) maleTasche(stift, cx + s * 0.27, fy - s * 0.2, s, 0.62);
  const k = maleMensch(stift, cx, fy, s, { farben: f, sitzt: o.sitzt, neigung: o.neigung || 0 });
  stift.fillStyle = f.schal;
  rundesRechteck(stift, cx - k.schulter * 0.42 + k.schub, k.schulterY - s * 0.025, k.schulter * 0.84, s * 0.085, s * 0.04);
  stift.fill();
  stift.beginPath();
  stift.moveTo(cx + k.schulter * 0.1 + k.schub, k.schulterY + s * 0.03);
  stift.lineTo(cx + k.schulter * 0.34 + k.schub, k.schulterY + s * 0.03);
  stift.lineTo(cx + k.schulter * 0.36 + k.schub, k.schulterY + s * 0.24);
  stift.lineTo(cx + k.schulter * 0.12 + k.schub, k.schulterY + s * 0.22);
  stift.closePath();
  stift.fill();
  // im Sitzen liegt die Tasche auf dem Schoß
  if (o.traegt && o.sitzt) maleTasche(stift, cx - s * 0.02, fy - s * 0.13, s, 0.66);
  // ein Arm, der sich nach etwas streckt und es nicht erreicht
  if (o.arm) {
    const sx = cx + Math.sign(o.arm.x || 0.001) * k.schulter * 0.4 + k.schub;
    const sy = k.schulterY + s * 0.09;
    strich(stift, [[sx, sy], [sx + o.arm.x * s, sy + o.arm.y * s]], '#d6caae', s * 0.075);
    stift.fillStyle = f.kopf;
    kreis(stift, sx + o.arm.x * s, sy + o.arm.y * s, s * 0.04);
    stift.fill();
  }
  return k;
}

// Der Schlafende: zur Seite gesunken, Kopf auf der Brust. Wach sitzt er gerade.
// o: wach 0..1, atem (-1..1), kopfX, kopfY, schultern
export function maleSchlaefer(stift, cx, fy, s, o) {
  const schlaf = 1 - o.wach;
  const k = maleMensch(stift, cx, fy + (o.atem || 0) * schlaf * s * 0.008, s, {
    farben: PLATZFARBE.schlaefer,
    sitzt: true,
    neigung: 0.55 * schlaf,
    kopfX: 0.05 * schlaf + (o.kopfX || 0),
    kopfY: 0.075 * schlaf + (o.kopfY || 0),
    schultern: o.schultern || 0,
  });
  // Krawatte, lose
  stift.fillStyle = PLATZFARBE.schlaefer.schuh;
  stift.beginPath();
  stift.moveTo(cx - s * 0.022 + k.schub, k.schulterY + s * 0.02);
  stift.lineTo(cx + s * 0.022 + k.schub, k.schulterY + s * 0.02);
  stift.lineTo(cx + s * 0.03 + k.schub * 0.5, k.schulterY + s * 0.18);
  stift.lineTo(cx + k.schub * 0.5, k.schulterY + s * 0.22);
  stift.lineTo(cx - s * 0.03 + k.schub * 0.5, k.schulterY + s * 0.18);
  stift.closePath();
  stift.fill();
  return k;
}

// Der wache Fahrgast: liest.
export function maleWachen(stift, cx, fy, s) {
  const f = PLATZFARBE.wacher;
  const k = maleMensch(stift, cx, fy, s, { farben: f, sitzt: true, kopfY: 0.012 });
  stift.fillStyle = f.buch;
  stift.fillRect(cx - s * 0.13, fy - s * 0.3, s * 0.12, s * 0.15);
  stift.fillRect(cx + s * 0.01, fy - s * 0.3, s * 0.12, s * 0.15);
  stift.fillStyle = f.schuh;
  stift.fillRect(cx - s * 0.008, fy - s * 0.3, s * 0.016, s * 0.15);
  return k;
}

// Die Lochzange. (hx, hy) ist die Hand, (dx, dy) die Richtung, offen 0..1.
function maleZange(stift, hx, hy, dx, dy, s, offen) {
  const lang = s * 0.24;
  const gx = hx + dx * lang * 0.42; // Gelenk
  const gy = hy + dy * lang * 0.42;
  const qx = -dy;
  const qy = dx;
  const weit = 0.07 + 0.2 * offen;
  const farbe = PLATZFARBE.zange;
  const dicke = Math.max(1.6, s * 0.04);
  // Griffe hinter dem Gelenk
  strich(stift, [[hx - dx * s * 0.03 + qx * s * 0.045, hy - dy * s * 0.03 + qy * s * 0.045], [gx, gy]], farbe, dicke);
  strich(stift, [[hx - dx * s * 0.03 - qx * s * 0.045, hy - dy * s * 0.03 - qy * s * 0.045], [gx, gy]], farbe, dicke);
  // Backen davor
  const rest = lang * 0.58;
  for (const seite of [-1, 1]) {
    const c = Math.cos(weit * seite);
    const sn = Math.sin(weit * seite);
    strich(stift, [[gx, gy], [gx + (dx * c - dy * sn) * rest, gy + (dx * sn + dy * c) * rest]], farbe, dicke);
  }
}

export const ZANGENLAENGE = 0.24; // in Feldern, von der Hand bis zur Spitze

// Der Schaffner. Er sieht in jeder Warterunde gleich aus.
// o: blick ('hoch' | 'links' | 'rechts' | 'runter'), nick 0..1, gruss 0..1, neigung,
//    zeigt { x, y } (Bildpunkt, auf den die Zange zielt) oder null, streck 0..1, offen 0..1 (Zange)
export function maleSchaffner(stift, cx, fy, s, o) {
  const f = PLATZFARBE.schaffner;
  const k = maleMensch(stift, cx, fy, s, { farben: f, sitzt: false, neigung: o.neigung || 0, kopfY: (o.nick || 0) * 0.04 });
  // zwei Knöpfe
  stift.fillStyle = f.knopf;
  kreis(stift, cx + k.schub * 0.8, k.schulterY + s * 0.12, s * 0.022);
  stift.fill();
  kreis(stift, cx + k.schub * 0.5, k.schulterY + s * 0.24, s * 0.022);
  stift.fill();

  // Mütze: Kuppe, rotes Band, Schirm in Blickrichtung
  const gruss = o.gruss || 0;
  const my = k.kopfY - k.kopf * 0.22 - gruss * s * 0.09;
  stift.fillStyle = f.muetze;
  stift.beginPath();
  stift.arc(k.kopfX, my, k.kopf * 1.08, Math.PI, 0);
  stift.closePath();
  stift.fill();
  stift.fillStyle = f.band;
  rundesRechteck(stift, k.kopfX - k.kopf * 1.1, my - k.kopf * 0.12, k.kopf * 2.2, k.kopf * 0.34, k.kopf * 0.1);
  stift.fill();
  stift.fillStyle = f.schirm;
  if (o.blick === 'links' || o.blick === 'rechts') {
    const r = o.blick === 'links' ? -1 : 1;
    rundesRechteck(stift, k.kopfX + (r > 0 ? k.kopf * 0.55 : -k.kopf * 1.75), my + k.kopf * 0.12, k.kopf * 1.2, k.kopf * 0.28, k.kopf * 0.12);
    stift.fill();
  } else if (o.blick === 'runter') {
    rundesRechteck(stift, k.kopfX - k.kopf * 0.8, my + k.kopf * 0.16, k.kopf * 1.6, k.kopf * 0.3, k.kopf * 0.14);
    stift.fill();
  }

  // der freie Arm tippt beim Grüßen an die Mütze
  if (gruss > 0.02) {
    const sx = cx - k.schulter * 0.44 + k.schub;
    const sy = k.schulterY + s * 0.08;
    const hx = k.kopfX - k.kopf * 1.05;
    const hy = my + k.kopf * 0.1 + (1 - gruss) * s * 0.3;
    strich(stift, [[sx, sy], [sx - s * 0.1, sy + s * 0.1 * (1 - gruss)], [hx, hy]], f.arm, s * 0.075);
    stift.fillStyle = f.kopf;
    kreis(stift, hx, hy, s * 0.038);
    stift.fill();
  }

  // der Arm mit der Zange: hängt an der Seite oder zeigt genau auf das störende Ding
  const streck = o.zeigt ? o.streck || 0 : 0;
  const seite = o.zeigt ? (o.zeigt.x < cx ? -1 : 1) : 1;
  const sx = cx + seite * k.schulter * 0.42 + k.schub;
  const sy = k.schulterY + s * 0.09;
  const ruheX = cx + k.schulter * 0.5 + s * 0.03;
  const ruheY = k.schulterY + s * 0.3;
  let hx = ruheX;
  let hy = ruheY;
  let dx = 0.25;
  let dy = 0.97;
  if (streck > 0.001) {
    const zx = o.zeigt.x - sx;
    const zy = o.zeigt.y - sy;
    const weit = Math.max(1, Math.hypot(zx, zy));
    const armlang = Math.max(s * 0.12, weit - s * ZANGENLAENGE);
    const zielX = sx + (zx / weit) * armlang;
    const zielY = sy + (zy / weit) * armlang;
    hx = ruheX + (zielX - ruheX) * streck;
    hy = ruheY + (zielY - ruheY) * streck;
    const rx = dx + (zx / weit - dx) * streck;
    const ry = dy + (zy / weit - dy) * streck;
    const rl = Math.max(0.001, Math.hypot(rx, ry));
    dx = rx / rl;
    dy = ry / rl;
  }
  const schulterX = streck > 0.001 ? sx + (cx + k.schulter * 0.42 + k.schub - sx) * (1 - streck) : cx + k.schulter * 0.42 + k.schub;
  strich(stift, [[schulterX, sy], [hx, hy]], f.arm, s * 0.08);
  stift.fillStyle = f.kopf;
  kreis(stift, hx, hy, s * 0.04);
  stift.fill();
  maleZange(stift, hx, hy, dx, dy, s, o.offen === undefined ? 1 : o.offen);
  return { spitzeX: hx + dx * s * ZANGENLAENGE, spitzeY: hy + dy * s * ZANGENLAENGE, kopfX: k.kopfX, kopfY: my - k.kopf * 1.08 };
}

// Der geworfene Schatten: der Umriss einer sitzenden Figur, flach hingelegt.
// (bx, by) ist sein Fuß, richtung -1 oder +1, laenge und dicke in Pixeln.
export function maleWurfschatten(stift, bx, by, richtung, laenge, dicke, staerke) {
  if (laenge < 1 || staerke <= 0.01) return;
  const u = (t) => bx + richtung * t * laenge;
  const kr = Math.min(dicke * 0.3, laenge * 0.19);
  stift.fillStyle = `rgba(${PLATZFARBE.schatten}, ${0.62 * staerke})`;
  stift.beginPath();
  // Rumpf: am Saum breit, an den Schultern schmaler und rund
  stift.moveTo(u(0), by - dicke * 0.5);
  stift.lineTo(u(0.5), by - dicke * 0.41);
  stift.quadraticCurveTo(u(0.61), by - dicke * 0.41, u(0.61), by - dicke * 0.27);
  stift.lineTo(u(0.61), by + dicke * 0.27);
  stift.quadraticCurveTo(u(0.61), by + dicke * 0.41, u(0.5), by + dicke * 0.41);
  stift.lineTo(u(0), by + dicke * 0.5);
  stift.closePath();
  // Kopf, im selben Drehsinn, damit sich beide Flächen vereinen
  const kx = u(0.61) + richtung * kr * 0.8;
  stift.moveTo(kx + kr, by);
  stift.arc(kx, by, kr, 0, Math.PI * 2, richtung < 0);
  stift.fill();
}

// Der blasse Lichtkeil zeigt, wohin das Licht fällt.
// kopf: Lampenkopf, richtung -1 oder +1, weit: Reichweite in Pixeln, oben und unten: Rand der Reihe
export function maleLichtkeil(stift, kopf, richtung, weit, oben, unten, s, staerke) {
  if (staerke <= 0.01 || weit < 2) return;
  const fern = kopf.x + richtung * weit;
  const verlauf = stift.createLinearGradient(kopf.x, 0, fern, 0);
  verlauf.addColorStop(0, `rgba(${PLATZFARBE.licht}, ${0.34 * staerke})`);
  verlauf.addColorStop(0.5, `rgba(${PLATZFARBE.licht}, ${0.17 * staerke})`);
  verlauf.addColorStop(1, `rgba(${PLATZFARBE.licht}, ${0.05 * staerke})`);
  stift.save();
  stift.globalCompositeOperation = 'lighter';
  stift.fillStyle = verlauf;
  const auf = Math.min(weit, s * 0.5);
  stift.beginPath();
  stift.moveTo(kopf.x, kopf.y - s * 0.02);
  stift.lineTo(kopf.x + richtung * auf, oben);
  stift.lineTo(fern, oben);
  stift.lineTo(fern, unten);
  stift.lineTo(kopf.x + richtung * auf, unten);
  stift.lineTo(kopf.x, kopf.y + s * 0.1);
  stift.closePath();
  stift.fill();
  stift.restore();
}

// Die Leselampe: Gelenk auf der Lehne, Arm, Kopf. winkel 0 zeigt nach rechts, Pi nach links.
export function maleLampe(stift, gelenk, winkel, s, armlaenge) {
  const f = PLATZFARBE.lampe;
  const kx = gelenk.x + Math.cos(winkel) * armlaenge;
  const ky = gelenk.y + Math.sin(winkel) * armlaenge;
  strich(stift, [[gelenk.x, gelenk.y], [kx, ky]], f.arm, Math.max(1.5, s * 0.035));
  stift.fillStyle = f.schirm;
  kreis(stift, gelenk.x, gelenk.y, s * 0.05);
  stift.fill();
  const hof = stift.createRadialGradient(kx, ky, 0, kx, ky, s * 0.3);
  hof.addColorStop(0, `rgba(${PLATZFARBE.licht}, 0.5)`);
  hof.addColorStop(1, `rgba(${PLATZFARBE.licht}, 0)`);
  stift.save();
  stift.globalCompositeOperation = 'lighter';
  stift.fillStyle = hof;
  kreis(stift, kx, ky, s * 0.3);
  stift.fill();
  stift.restore();
  // Schirm auf der abgewandten Seite, die helle Öffnung zeigt in Lichtrichtung
  stift.fillStyle = f.schirm;
  kreis(stift, kx, ky, s * 0.105);
  stift.fill();
  stift.fillStyle = f.kopf;
  kreis(stift, kx - Math.cos(winkel) * s * 0.03, ky - Math.sin(winkel) * s * 0.03, s * 0.075);
  stift.fill();
  return { x: kx, y: ky };
}

// Die Fahrkarte: schlichtes Papier ohne vorgedruckte Felder und ohne Zahlen.
// Die Lochung des Schaffners ist eine schmale Sichel. loch: 0 keine, bis 1 ganz da.
export function maleFahrkarte(stift, x, y, b, h, loch, gedrueckt) {
  const d = gedrueckt * 2;
  stift.save();
  stift.translate(x + b / 2, y + h / 2 + d);
  stift.rotate(-0.035);
  const kx = -b / 2 + 4;
  const ky = -h / 2 + 5;
  const kb = b - 8;
  const kh = h - 10;
  stift.fillStyle = 'rgba(0, 0, 0, 0.35)';
  rundesRechteck(stift, kx + 2, ky + 3, kb, kh, 5);
  stift.fill();
  stift.fillStyle = PLATZFARBE.papier;
  rundesRechteck(stift, kx, ky, kb, kh, 5);
  stift.fill();
  stift.fillStyle = PLATZFARBE.papierKante;
  rundesRechteck(stift, kx, ky + kh - 3, kb, 3, 2);
  stift.fill();
  // eine Abrisskante, sonst nichts
  stift.fillStyle = PLATZFARBE.papierFalz;
  for (let i = 0; i < 9; i++) stift.fillRect(kx + kb * 0.24, ky + 4 + (i * (kh - 8)) / 9, 1.5, (kh - 8) / 18);

  if (loch > 0.01) {
    // schmale Sichel: ein Kreis, aus dem ein zweiter herausgeschnitten ist
    const r = Math.min(kh * 0.27, 17) * (0.6 + 0.4 * loch);
    const lx = kx + kb * 0.66;
    const ly = ky + kh * 0.5;
    stift.save();
    stift.translate(lx, ly);
    stift.rotate(0.9); // schräg gestanzt, wie mit der Hand angesetzt
    stift.beginPath();
    stift.arc(0, 0, r, 0, Math.PI * 2);
    stift.clip();
    stift.fillStyle = FARBE.nacht;
    stift.beginPath();
    stift.rect(-r * 2, -r * 2, r * 4, r * 4);
    stift.arc(r * 0.3, 0, r * 0.99, 0, Math.PI * 2, true);
    stift.fill('evenodd');
    stift.restore();
  }
  stift.restore();
}

// Ein Schnipsel in Sichelform, der nach dem Lochen fällt.
export function maleSchnipsel(stift, x, y, s, staerke) {
  if (staerke <= 0.01) return;
  stift.save();
  stift.globalAlpha *= staerke;
  stift.strokeStyle = PLATZFARBE.papier;
  stift.lineWidth = Math.max(1.5, s * 0.035);
  stift.lineCap = 'round';
  stift.beginPath();
  stift.arc(x, y, s * 0.05, 0.6, 2.9);
  stift.stroke();
  stift.restore();
}

// Lautsprecher: an oder durchgestrichen, wie im Hauptspiel
export function maleTonschalter(stift, ton, an) {
  const x = ton.x;
  const y = ton.y;
  stift.fillStyle = '#5b6680';
  stift.strokeStyle = '#5b6680';
  stift.lineWidth = 2;
  stift.lineCap = 'round';
  stift.beginPath();
  stift.moveTo(x - 9, y - 3.5);
  stift.lineTo(x - 4, y - 3.5);
  stift.lineTo(x + 1, y - 8);
  stift.lineTo(x + 1, y + 8);
  stift.lineTo(x - 4, y + 3.5);
  stift.lineTo(x - 9, y + 3.5);
  stift.closePath();
  stift.fill();
  stift.beginPath();
  if (an) {
    stift.arc(x + 2, y, 5, -0.9, 0.9);
    stift.stroke();
    stift.beginPath();
    stift.arc(x + 2, y, 9, -0.9, 0.9);
  } else {
    stift.moveTo(x + 5, y - 4);
    stift.lineTo(x + 12, y + 4);
    stift.moveTo(x + 12, y - 4);
    stift.lineTo(x + 5, y + 4);
  }
  stift.stroke();
}
