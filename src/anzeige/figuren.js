// Figuren und Hindernisse. Niemand hat ein Gesicht, nur verstandene Fahrgäste im Speisewagen.
// Jede Figur ist am Umriss erkennbar:
// der Spieler am Schal, der Pendler an der Aktentasche, die Reisegruppe am Rucksack
// und ihr Vorderster am Wimpel, der Drängler an den breiten Schultern, der Kontrolleur
// an Mütze und Lochzange.

import { FARBE, rundesRechteck, kreis } from './formen.js';

// Rumpf und Kopf. (cx, fy) ist der Punkt zwischen den Füßen.
function maleKoerper(stift, cx, fy, masse, farben, neigung) {
  const { hoch, schulter, saum, kopf } = masse;
  const schulterY = fy - hoch + kopf * 1.75;
  const schub = neigung * hoch * 0.16;
  const r = Math.min(schulter * 0.3, hoch * 0.16);

  stift.fillStyle = farben.schuh;
  rundesRechteck(stift, cx - saum * 0.42, fy - hoch * 0.07, saum * 0.36, hoch * 0.09, hoch * 0.03);
  stift.fill();
  rundesRechteck(stift, cx + saum * 0.06, fy - hoch * 0.07, saum * 0.36, hoch * 0.09, hoch * 0.03);
  stift.fill();

  stift.fillStyle = farben.mantel;
  stift.beginPath();
  stift.moveTo(cx - saum / 2, fy - hoch * 0.05);
  stift.lineTo(cx - schulter / 2 + schub, schulterY + r);
  stift.quadraticCurveTo(cx - schulter / 2 + schub, schulterY, cx - schulter / 2 + schub + r, schulterY);
  stift.lineTo(cx + schulter / 2 + schub - r, schulterY);
  stift.quadraticCurveTo(cx + schulter / 2 + schub, schulterY, cx + schulter / 2 + schub, schulterY + r);
  stift.lineTo(cx + saum / 2, fy - hoch * 0.05);
  stift.closePath();
  stift.fill();

  const kopfX = cx + schub * 1.35;
  const kopfY = schulterY - kopf * 0.72 + (masse.kopfTief || 0);
  stift.fillStyle = farben.kopf;
  kreis(stift, kopfX, kopfY, kopf);
  stift.fill();
  return { schulterY, kopfX, kopfY, schub };
}

function maleSchatten(stift, cx, fy, breite) {
  stift.fillStyle = 'rgba(0, 0, 0, 0.34)';
  stift.beginPath();
  stift.ellipse(cx, fy, breite, breite * 0.3, 0, 0, Math.PI * 2);
  stift.fill();
}

function linie(stift, punkte, farbe, dicke) {
  stift.strokeStyle = farbe;
  stift.lineWidth = dicke;
  stift.lineCap = 'round';
  stift.lineJoin = 'round';
  stift.beginPath();
  stift.moveTo(punkte[0][0], punkte[0][1]);
  for (let i = 1; i < punkte.length; i++) stift.lineTo(punkte[i][0], punkte[i][1]);
  stift.stroke();
}

function maleSpieler(stift, cx, fy, s, o) {
  const atem = o.ruhig ? 0 : Math.sin(o.t * 1.7) * 0.012;
  const masse = { hoch: s * 0.72 * (1 + atem), schulter: s * 0.34, saum: s * 0.42, kopf: s * 0.125 };
  const f = FARBE.spieler;
  const k = maleKoerper(stift, cx, fy, masse, f, o.neigung || 0);
  // Schal: ein Band um den Hals und ein Ende, das herabhängt
  const flattern = o.ruhig ? 0 : Math.sin(o.t * (o.fluss ? 3.1 : 1.3)) * s * (o.fluss ? 0.03 : 0.012);
  stift.fillStyle = f.schal;
  rundesRechteck(stift, cx - masse.schulter * 0.42 + k.schub, k.schulterY - s * 0.025, masse.schulter * 0.84, s * 0.085, s * 0.04);
  stift.fill();
  stift.beginPath();
  stift.moveTo(cx + masse.schulter * 0.1 + k.schub, k.schulterY + s * 0.03);
  stift.lineTo(cx + masse.schulter * 0.34 + k.schub, k.schulterY + s * 0.03);
  stift.lineTo(cx + masse.schulter * 0.36 + k.schub + flattern, k.schulterY + s * 0.26);
  stift.lineTo(cx + masse.schulter * 0.12 + k.schub + flattern, k.schulterY + s * 0.24);
  stift.closePath();
  stift.fill();
  return k;
}

function malePendler(stift, cx, fy, s, o) {
  const atem = o.ruhig ? 0 : Math.sin(o.t * 1.3 + o.takt) * 0.01;
  const masse = { hoch: s * 0.72 * (1 + atem), schulter: s * 0.36, saum: s * 0.38, kopf: s * 0.12 };
  const f = FARBE.pendler;
  // kleine Geste: ab und zu hebt er den Arm und sieht auf die Uhr; wer pausiert, tut es durchgehend
  const kreisen = (o.t * 0.16 + o.takt * 0.37) % 1;
  const blick = o.pausiert ? 1 : o.ruhig ? 0 : kreisen > 0.78 ? Math.sin(((kreisen - 0.78) / 0.22) * Math.PI) : 0;
  masse.kopfTief = blick * s * 0.02;
  // Aktentasche in der rechten Hand
  const tx = cx + masse.saum * 0.5;
  const ty = fy - s * 0.3;
  stift.fillStyle = f.tasche;
  rundesRechteck(stift, tx - s * 0.02, ty, s * 0.2, s * 0.15, s * 0.025);
  stift.fill();
  linie(stift, [[tx + s * 0.04, ty], [tx + s * 0.04, ty - s * 0.035], [tx + s * 0.12, ty - s * 0.035], [tx + s * 0.12, ty]], f.tasche, s * 0.022);
  const k = maleKoerper(stift, cx, fy, masse, f, o.neigung || 0);
  // Krawatte
  stift.fillStyle = f.schuh;
  stift.beginPath();
  stift.moveTo(cx - s * 0.022, k.schulterY + s * 0.02);
  stift.lineTo(cx + s * 0.022, k.schulterY + s * 0.02);
  stift.lineTo(cx + s * 0.03, k.schulterY + s * 0.19);
  stift.lineTo(cx, k.schulterY + s * 0.23);
  stift.lineTo(cx - s * 0.03, k.schulterY + s * 0.19);
  stift.closePath();
  stift.fill();
  if (blick > 0.02) {
    const sx = cx - masse.schulter * 0.44;
    const sy = k.schulterY + s * 0.07;
    linie(stift, [[sx, sy], [sx - s * 0.05, sy + s * 0.14 - blick * s * 0.03], [sx + s * 0.08 * blick, sy + s * 0.14 - blick * s * 0.13]], f.arm, s * 0.07);
    stift.fillStyle = f.kopf;
    kreis(stift, sx + s * 0.08 * blick, sy + s * 0.14 - blick * s * 0.13, s * 0.035);
    stift.fill();
  }
  return k;
}

function maleGruppe(stift, cx, fy, s, o) {
  const wippen = o.ruhig ? 0 : Math.sin(o.t * 2.1 + o.takt * 1.9) * s * 0.012;
  const masse = { hoch: s * 0.6, schulter: s * 0.3, saum: s * 0.34, kopf: s * 0.105 };
  const f = FARBE.gruppe;
  const y = fy + wippen;
  // Rucksack schaut links hinter dem Rücken hervor
  stift.fillStyle = f.rucksack;
  rundesRechteck(stift, cx - masse.schulter * 0.78, y - masse.hoch * 0.66, masse.schulter * 0.6, masse.hoch * 0.42, s * 0.05);
  stift.fill();
  const k = maleKoerper(stift, cx, y, masse, f, o.neigung || 0);
  // Schirmmütze
  stift.fillStyle = f.rucksack;
  stift.beginPath();
  stift.arc(k.kopfX, k.kopfY - masse.kopf * 0.15, masse.kopf * 1.02, Math.PI, 0);
  stift.closePath();
  stift.fill();
  rundesRechteck(stift, k.kopfX - masse.kopf * 0.2, k.kopfY - masse.kopf * 0.3, masse.kopf * 1.5, masse.kopf * 0.24, masse.kopf * 0.1);
  stift.fill();
  if (o.vorderster) {
    // der Wimpel, dem alle folgen
    const wx = cx + masse.schulter * 0.62;
    const oben = y - masse.hoch - s * 0.2;
    linie(stift, [[wx, y - masse.hoch * 0.42], [wx, oben]], '#d9d2bf', s * 0.028);
    const wehen = o.ruhig ? 0 : Math.sin(o.t * 4 + o.takt) * s * 0.02;
    stift.fillStyle = f.wimpel;
    stift.beginPath();
    stift.moveTo(wx, oben);
    stift.lineTo(wx + s * 0.2, oben + s * 0.06 + wehen);
    stift.lineTo(wx, oben + s * 0.13);
    stift.closePath();
    stift.fill();
  }
  return k;
}

function maleDraengler(stift, cx, fy, s, o) {
  const f = FARBE.draengler;
  const schnaufen = o.erschoepft && !o.ruhig ? Math.sin(o.t * 6) * 0.03 : 0;
  const wippen = !o.erschoepft && !o.ansagend && !o.ruhig ? Math.sin(o.t * 5 + o.takt) * 0.07 : 0;
  const gebeugt = o.erschoepft ? 0.74 + schnaufen : o.ansagend ? 0.9 : 1;
  const masse = { hoch: s * 0.8 * gebeugt, schulter: s * 0.52, saum: s * 0.36, kopf: s * 0.125 };
  if (o.erschoepft) masse.kopfTief = s * 0.1;
  const neigung = (o.neigung || 0) + wippen;
  const k = maleKoerper(stift, cx, fy, masse, f, neigung);
  // Ellbogen stehen ab, im Erschöpften hängen die Arme auf die Knie
  const ay = k.schulterY + s * 0.1;
  for (const seite of [-1, 1]) {
    const sx = cx + seite * masse.schulter * 0.47 + k.schub;
    if (o.erschoepft) {
      linie(stift, [[sx, ay], [sx + seite * s * 0.02, ay + s * 0.2], [cx + seite * s * 0.1, fy - s * 0.2]], f.arm, s * 0.085);
    } else {
      linie(stift, [[sx, ay], [sx + seite * s * 0.11, ay + s * 0.1], [sx + seite * s * 0.03, ay + s * 0.21]], f.arm, s * 0.085);
    }
  }
  return k;
}

// Der Kontrolleur. o.zeigt: Richtung zum Spieler (x, y) oder null. o.heben: wie weit er die Zange
// hinhält (0 bis 1), sie sinkt, je länger man ruhig steht. o.winkt: Hand an der Mütze beim Durchwinken.
// Kleine Geste im Stand: Ab und zu klickt er mit der Zange.
function maleKontrolleur(stift, cx, fy, s, o) {
  const f = FARBE.kontrolleur;
  const atem = o.ruhig ? 0 : Math.sin(o.t * 1.1 + o.takt) * 0.008;
  const masse = { hoch: s * 0.76 * (1 + atem), schulter: s * 0.37, saum: s * 0.4, kopf: s * 0.12 };
  const zeigt = o.zeigt && (o.heben || 0) > 0.01 ? o.zeigt : null;
  const seite = zeigt ? (zeigt.x < 0 ? -1 : zeigt.x > 0 ? 1 : 0) : 0;
  const k = maleKoerper(stift, cx, fy, masse, f, seite * 0.25 * (o.heben || 0));
  // Mütze: Kuppe, rotes Band, Schirm zur Seite, auf die er sieht
  const winkt = o.winkt || 0;
  const my = k.kopfY - masse.kopf * 0.22 - winkt * s * 0.06;
  stift.fillStyle = f.muetze;
  stift.beginPath();
  stift.arc(k.kopfX, my, masse.kopf * 1.08, Math.PI, 0);
  stift.closePath();
  stift.fill();
  stift.fillStyle = f.band;
  rundesRechteck(stift, k.kopfX - masse.kopf * 1.1, my - masse.kopf * 0.12, masse.kopf * 2.2, masse.kopf * 0.32, masse.kopf * 0.1);
  stift.fill();
  stift.fillStyle = f.muetze;
  const schirm = seite || 1;
  rundesRechteck(stift, k.kopfX + (schirm > 0 ? masse.kopf * 0.55 : -masse.kopf * 1.75), my + masse.kopf * 0.12, masse.kopf * 1.2, masse.kopf * 0.26, masse.kopf * 0.1);
  stift.fill();

  // der Arm mit der Lochzange
  const sx = cx + (seite || 1) * masse.schulter * 0.44 + k.schub;
  const sy = k.schulterY + s * 0.07;
  let hx;
  let hy;
  if (winkt > 0.01) {
    // durchwinken: die Hand geht an die Mütze
    hx = k.kopfX + masse.kopf * 0.9;
    hy = my + s * 0.02 + (1 - winkt) * s * 0.2;
  } else if (zeigt) {
    const weit = Math.hypot(zeigt.x, zeigt.y) || 1;
    const h = o.heben;
    hx = sx + (zeigt.x / weit) * s * 0.3 * h;
    hy = sy + s * 0.2 * (1 - h) + (zeigt.y / weit) * s * 0.22 * h;
  } else {
    hx = sx + s * 0.04;
    hy = sy + s * 0.22;
  }
  linie(stift, [[sx, sy], [hx, hy]], f.arm, s * 0.07);
  stift.fillStyle = f.kopf;
  kreis(stift, hx, hy, s * 0.033);
  stift.fill();
  if (winkt <= 0.01) {
    // die Zange: zwei Schenkel, im Stand klickt sie ab und zu
    const klick = o.ruhig ? 0 : (o.t * 0.23 + o.takt * 0.31) % 1 > 0.92 ? 1 : 0;
    const offen = 0.35 - klick * 0.3;
    const r = zeigt ? Math.atan2(zeigt.y, zeigt.x) : Math.PI / 2;
    for (const w of [-offen, offen]) {
      const ex = hx + Math.cos(r + w) * s * 0.11;
      const ey = hy + Math.sin(r + w) * s * 0.11;
      linie(stift, [[hx, hy], [ex, ey]], f.zange, s * 0.022);
    }
  }
  return k;
}

const MALER = { spieler: maleSpieler, pendler: malePendler, gruppe: maleGruppe, draengler: maleDraengler, kontrolleur: maleKontrolleur };

// Zeichnet eine Figur. (cx, fy) ist der Punkt zwischen den Füßen, s die Feldgröße.
// o: t (Sekunden), takt (eigener Versatz), neigung, alpha, blitz, ruhig und was die Figur gerade tut.
export function maleFigur(stift, art, cx, fy, s, o) {
  const alpha = o.alpha === undefined ? 1 : o.alpha;
  if (alpha <= 0.01) return null;
  stift.save();
  stift.globalAlpha *= alpha;
  maleSchatten(stift, cx, fy, s * (art === 'draengler' ? 0.27 : art === 'gruppe' ? 0.19 : 0.22));
  const k = MALER[art](stift, cx, fy, s, o);
  if (o.gesicht && k) maleGesicht(stift, k.kopfX, k.kopfY, s * 0.115);
  if (o.blitz > 0.01) {
    // kurzes Aufleuchten bei einem Treffer
    stift.globalCompositeOperation = 'lighter';
    const schein = stift.createRadialGradient(cx, fy - s * 0.38, 0, cx, fy - s * 0.38, s * 0.46);
    schein.addColorStop(0, `rgba(255, 244, 224, ${0.85 * Math.min(1, o.blitz)})`);
    schein.addColorStop(0.5, `rgba(255, 244, 224, ${0.3 * Math.min(1, o.blitz)})`);
    schein.addColorStop(1, 'rgba(255, 244, 224, 0)');
    stift.fillStyle = schein;
    kreis(stift, cx, fy - s * 0.38, s * 0.46);
    stift.fill();
  }
  stift.restore();
  return k;
}

// Die Symbole der sechs Prüfungen, schlicht wie Piktogramme im Zug. (cx, cy) Mitte, g Größe.
export function maleSymbol(stift, id, cx, cy, g, farbe) {
  stift.save();
  stift.strokeStyle = farbe;
  stift.fillStyle = farbe;
  stift.lineWidth = Math.max(1.5, g * 0.11);
  stift.lineCap = 'round';
  stift.lineJoin = 'round';
  const h = g / 2;
  if (id === 'aufregen') {
    // eine ruhige Linie: ein flacher Puls
    linie(stift, [[cx - h, cy], [cx - h * 0.3, cy], [cx - h * 0.15, cy - h * 0.25], [cx + h * 0.05, cy + h * 0.2], [cx + h * 0.2, cy], [cx + h, cy]], farbe, stift.lineWidth);
  } else if (id === 'aussteigen') {
    // eine Tür, ein Pfeil hinaus
    stift.strokeRect(cx - h * 0.1, cy - h * 0.8, h * 0.9, h * 1.6);
    linie(stift, [[cx + h * 0.3, cy], [cx - h, cy]], farbe, stift.lineWidth);
    linie(stift, [[cx - h * 0.6, cy - h * 0.35], [cx - h, cy], [cx - h * 0.6, cy + h * 0.35]], farbe, stift.lineWidth);
  } else if (id === 'rempeln') {
    // zwei Figuren mit Abstand
    for (const dx of [-0.5, 0.5]) {
      kreis(stift, cx + dx * h, cy - h * 0.45, h * 0.22);
      stift.fill();
      linie(stift, [[cx + dx * h, cy - h * 0.15], [cx + dx * h, cy + h * 0.75]], farbe, stift.lineWidth * 1.4);
    }
  } else if (id === 'draengeln') {
    // eine Schlange, einer hinter dem anderen
    for (const dx of [-0.65, 0, 0.65]) {
      kreis(stift, cx + dx * h, cy - h * 0.4, h * 0.17);
      stift.fill();
      linie(stift, [[cx + dx * h, cy - h * 0.15], [cx + dx * h, cy + h * 0.6]], farbe, stift.lineWidth * 1.2);
    }
  } else if (id === 'puenktlich') {
    // eine Uhr
    kreis(stift, cx, cy, h * 0.85);
    stift.stroke();
    linie(stift, [[cx, cy - h * 0.55], [cx, cy], [cx + h * 0.4, cy + h * 0.15]], farbe, stift.lineWidth);
  } else if (id === 'ruhe') {
    // drei Punkte wie die Ruhe oben
    for (const dx of [-0.6, 0, 0.6]) {
      kreis(stift, cx + dx * h, cy, h * 0.22);
      stift.fill();
    }
  }
  stift.restore();
}

// Ein schlichtes Gesicht: zwei Punkte, ein kurzer Mund. Nur für verstandene Fahrgäste.
function maleGesicht(stift, x, y, r) {
  stift.fillStyle = '#2a2f3a';
  kreis(stift, x - r * 0.36, y + r * 0.04, r * 0.11);
  stift.fill();
  kreis(stift, x + r * 0.36, y + r * 0.04, r * 0.11);
  stift.fill();
  stift.strokeStyle = '#2a2f3a';
  stift.lineWidth = Math.max(1, r * 0.1);
  stift.lineCap = 'round';
  stift.beginPath();
  stift.moveTo(x - r * 0.24, y + r * 0.42);
  stift.quadraticCurveTo(x, y + r * 0.52, x + r * 0.24, y + r * 0.42);
  stift.stroke();
}

// HP als Punkte über dem Kopf
export function malePunkte(stift, cx, y, s, hp, voll) {
  const r = s * 0.042;
  const schritt = s * 0.13;
  const start = cx - ((voll - 1) * schritt) / 2;
  for (let i = 0; i < voll; i++) {
    kreis(stift, start + i * schritt, y, r);
    if (i < hp) {
      stift.fillStyle = '#ffe9c4';
      stift.fill();
    } else {
      stift.strokeStyle = 'rgba(255, 233, 196, 0.3)';
      stift.lineWidth = 1;
      stift.stroke();
    }
  }
}

// Das Ausrufezeichen über der eigenen Figur
export function maleAchtung(stift, cx, y, s) {
  const b = s * 0.085;
  stift.fillStyle = FARBE.nacht;
  rundesRechteck(stift, cx - b * 1.1, y - s * 0.3, b * 2.2, s * 0.36, b);
  stift.fill();
  stift.fillStyle = FARBE.rotHell;
  rundesRechteck(stift, cx - b / 2, y - s * 0.26, b, s * 0.17, b / 2);
  stift.fill();
  kreis(stift, cx, y - s * 0.015, b * 0.6);
  stift.fill();
}

// ---------------------------------------------------------------- Hindernisse

function maleSitz(stift, x, y, s) {
  const p = s * 0.09;
  stift.fillStyle = '#22304c';
  rundesRechteck(stift, x + p, y + p, s - 2 * p, s - 2 * p, s * 0.14);
  stift.fill();
  stift.fillStyle = '#2c3d61';
  rundesRechteck(stift, x + p * 1.9, y + s * 0.34, s - p * 3.8, s * 0.5, s * 0.1);
  stift.fill();
  stift.fillStyle = '#3a4f7b';
  rundesRechteck(stift, x + p * 1.5, y + p * 1.3, s - p * 3, s * 0.24, s * 0.09);
  stift.fill();
  stift.fillStyle = '#4a6193';
  rundesRechteck(stift, x + s * 0.36, y + p * 1.3, s * 0.28, s * 0.09, s * 0.04);
  stift.fill();
}

function maleFahrrad(stift, x, y, s) {
  const hinten = [x + s * 0.27, y + s * 0.64];
  const vorn = [x + s * 0.74, y + s * 0.64];
  const r = s * 0.19;
  stift.lineCap = 'round';
  stift.strokeStyle = '#8796ae';
  stift.lineWidth = s * 0.035;
  for (const rad of [hinten, vorn]) {
    kreis(stift, rad[0], rad[1], r);
    stift.stroke();
  }
  const sattel = [x + s * 0.4, y + s * 0.35];
  const lenker = [x + s * 0.66, y + s * 0.33];
  const tretlager = [x + s * 0.47, y + s * 0.64];
  linie(stift, [hinten, sattel, lenker, tretlager, hinten], '#5fa79b', s * 0.04);
  linie(stift, [tretlager, sattel], '#5fa79b', s * 0.04);
  linie(stift, [lenker, vorn], '#5fa79b', s * 0.04);
  linie(stift, [[sattel[0] - s * 0.07, sattel[1] - s * 0.03], [sattel[0] + s * 0.06, sattel[1] - s * 0.03]], '#c9d2de', s * 0.045);
  linie(stift, [[lenker[0] - s * 0.02, lenker[1] - s * 0.08], [lenker[0] + s * 0.09, lenker[1] - s * 0.08]], '#c9d2de', s * 0.04);
  linie(stift, [lenker, [lenker[0] + s * 0.01, lenker[1] - s * 0.08]], '#5fa79b', s * 0.035);
}

function maleKoffer(stift, x, y, s, gross) {
  if (gross) {
    // eine Reisetasche liegt dahinter
    stift.fillStyle = '#3d4d63';
    rundesRechteck(stift, x + s * 0.12, y + s * 0.5, s * 0.5, s * 0.32, s * 0.12);
    stift.fill();
  }
  const kx = x + (gross ? s * 0.34 : s * 0.22);
  const ky = y + s * 0.3;
  const b = s * 0.48;
  const h = s * 0.55;
  linie(stift, [[kx + b * 0.3, ky], [kx + b * 0.3, ky - s * 0.09], [kx + b * 0.7, ky - s * 0.09], [kx + b * 0.7, ky]], '#3a2b20', s * 0.035);
  stift.fillStyle = '#7a5b43';
  rundesRechteck(stift, kx, ky, b, h, s * 0.06);
  stift.fill();
  stift.fillStyle = '#5c4331';
  stift.fillRect(kx + b * 0.2, ky, b * 0.1, h);
  stift.fillRect(kx + b * 0.7, ky, b * 0.1, h);
  stift.fillStyle = '#e9dcc0';
  stift.fillRect(kx + b * 0.42, ky + h * 0.42, b * 0.2, h * 0.14);
}

// Ein Tisch im Speisewagen: Tischtuch, eine Tasse, eine kleine Lampe
function maleTisch(stift, x, y, s) {
  stift.fillStyle = '#5a4636';
  rundesRechteck(stift, x + s * 0.12, y + s * 0.16, s * 0.76, s * 0.68, s * 0.08);
  stift.fill();
  stift.fillStyle = '#efe4cf';
  rundesRechteck(stift, x + s * 0.16, y + s * 0.2, s * 0.68, s * 0.6, s * 0.06);
  stift.fill();
  stift.fillStyle = '#d9cbb0';
  stift.fillRect(x + s * 0.16, y + s * 0.47, s * 0.68, s * 0.05);
  // Tasse mit Untertasse
  stift.fillStyle = '#c9bca4';
  kreis(stift, x + s * 0.36, y + s * 0.62, s * 0.09);
  stift.fill();
  stift.fillStyle = '#ffffff';
  kreis(stift, x + s * 0.36, y + s * 0.62, s * 0.055);
  stift.fill();
  stift.fillStyle = '#6b4a33';
  kreis(stift, x + s * 0.36, y + s * 0.62, s * 0.035);
  stift.fill();
  // Tischlampe
  stift.fillStyle = '#ffd9a0';
  kreis(stift, x + s * 0.64, y + s * 0.34, s * 0.07);
  stift.fill();
}

function maleWand(stift, x, y, s) {
  stift.fillStyle = FARBE.wand;
  stift.fillRect(x, y, s, s);
  stift.fillStyle = FARBE.wandKante;
  stift.fillRect(x, y, s, s * 0.08);
  stift.fillStyle = FARBE.wandDunkel;
  stift.fillRect(x, y + s * 0.86, s, s * 0.14);
  stift.fillStyle = 'rgba(255, 255, 255, 0.04)';
  rundesRechteck(stift, x + s * 0.14, y + s * 0.24, s * 0.72, s * 0.46, s * 0.05);
  stift.fill();
}

// art: Zeichen aus dem Wagenplan
export function maleHindernis(stift, art, x, y, s, feldX, feldY) {
  if (art === 'S') maleSitz(stift, x, y, s);
  else if (art === 'F') maleFahrrad(stift, x, y, s);
  else if (art === 'K') maleKoffer(stift, x, y, s, (feldX + feldY) % 2 === 0);
  else if (art === 'T') maleTisch(stift, x, y, s);
  else maleWand(stift, x, y, s);
}
