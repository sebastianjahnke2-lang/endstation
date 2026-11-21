// Musik als Echo: welche Ereignisse wie klingen. Geprüft wird die Partitur, nicht der Lautsprecher.

import test from 'node:test';
import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { notenZu, mitlaufNoten, TONLEITER, MOTIV, gehton, AUSKLANG, STILLE, ABSCHLUSS_NACH } from '../src/musik.js';
import { neueFahrt, runde } from '../src/kern/fahrt.js';

const ORDNER = dirname(fileURLToPath(import.meta.url));
const feld = (x, y) => ({ tipp: 'feld', x, y });
const lampe = (name) => ({ tipp: 'lampe', name });

// Spielt eine Folge und sammelt je Runde die Noten, so wie main.js und die Bühne sie auslösen.
function hoere(handlungen) {
  let z = neueFahrt();
  const runden = [];
  for (const h of handlungen) {
    const vorher = z.runde;
    const { zustand, ereignisse } = runde(z, h);
    z = zustand;
    const noten = [];
    for (const e of ereignisse) for (const n of notenZu(e)) noten.push({ ...n, von: e.typ });
    for (const n of mitlaufNoten(ereignisse, z, vorher)) noten.push({ ...n, von: 'mitlauf' });
    runden.push({ ereignisse, noten });
  }
  return { z, runden };
}

const HAUPTWEG = [
  feld(0, 5), lampe('A'), 'warten', 'warten',
  'warten', 'warten', 'warten',
  'rechts', 'hoch', 'hoch',
  lampe('B'), 'warten', 'warten', 'warten',
  'hoch', 'hoch', 'hoch',
];

test('jeder Ton liegt auf der Tonleiter, nichts klingt schief', () => {
  const erlaubt = new Set();
  for (const hz of TONLEITER) for (const f of [0.5, 1]) erlaubt.add((hz * f).toFixed(3));
  for (const folge of [HAUPTWEG, ['links', 'links', 'warten', 'warten', 'warten', 'warten', 'warten'], ['rechts', 'hoch', 'hoch', 'hoch', 'hoch', 'hoch']]) {
    for (const { noten } of hoere(folge).runden) {
      for (const n of noten) {
        if (n.art === 'aus') continue;
        assert.ok(erlaubt.has(n.hz.toFixed(3)), `${n.von}: ${n.hz} Hz liegt nicht auf der Tonleiter`);
        if (n.bis) assert.ok(erlaubt.has(n.bis.toFixed(3)), `${n.von}: Gleiten nach ${n.bis} Hz`);
      }
    }
  }
  // a-Moll pentatonisch: keine zwei Töne liegen einen Halbton auseinander
  for (let i = 1; i < TONLEITER.length; i++) assert.ok(TONLEITER[i] / TONLEITER[i - 1] > Math.pow(2, 1.5 / 12));
});

test('Gehen, Benutzen und Warten haben je einen Ton, Unmögliches bleibt stumm', () => {
  assert.equal(notenZu({ typ: 'schritt', von: { x: 1, y: 5 }, nach: { x: 2, y: 5 } }).length, 1);
  assert.equal(notenZu({ typ: 'nimmt' }).length, 1);
  assert.equal(notenZu({ typ: 'warten' }).length, 1);
  assert.equal(notenZu({ typ: 'weckt' }).length, 1);
  for (const typ of ['gehtNicht', 'zuWeit', 'nichts', 'anstoss', 'satz', 'nickt', 'schaffnerSchritt', 'steht', 'schatten']) {
    assert.deepEqual(notenZu({ typ }), [], `${typ} müsste still sein`);
  }
  // eine Eingabe gegen die Wand: keine Note, auch kein Mitlaufen
  const { runden } = hoere(['runter', 'runter', 'runter']);
  for (const r of runden) if (r.ereignisse.every((e) => ['gehtNicht', 'zuWeit', 'nichts'].includes(e.typ))) assert.deepEqual(r.noten, []);
  // keine Note ist laut
  for (const r of hoere(HAUPTWEG).runden) for (const n of r.noten) if (n.laut) assert.ok(n.laut <= 0.2, `${n.von} ist zu laut`);
});

test('Gehen klingt höher, je näher die Tür', () => {
  for (let y = 7; y > 0; y--) assert.ok(gehton(y - 1) > gehton(y));
});

test('die Lampe gleitet zwischen zwei Tönen, hin hinauf, zurück hinunter', () => {
  const hin = notenZu({ typ: 'lampe', name: 'A', stellung: 'gang' })[0];
  const zurueck = notenZu({ typ: 'lampe', name: 'A', stellung: 'fenster' })[0];
  assert.equal(hin.art, 'gleiten');
  assert.ok(hin.bis > hin.hz);
  assert.equal(zurueck.hz, hin.bis);
  assert.equal(zurueck.bis, hin.hz);
});

test('der Schaffner: wartend nur der erste Ton, beim Lochen das ganze Motiv, danach leise in jeder Runde', () => {
  assert.ok(MOTIV.length >= 3 && MOTIV.length <= 4);
  const { runden } = hoere(['warten', 'warten', 'warten', 'warten', 'warten', 'warten', feld(0, 5), lampe('A'), 'warten', 'warten']);
  const tonVon = (r, von) => runden[r].noten.filter((n) => n.von === von);
  // Runde 4 bis 6: er wartet an der Tasche, immer nur der erste Ton
  for (const r of [3, 4, 5]) {
    const t = tonVon(r, 'wartet');
    assert.equal(t.length, 1, `Runde ${r + 1}`);
    assert.equal(t[0].hz, MOTIV[0]);
    assert.equal(tonVon(r, 'mitlauf').length, 0, 'vor der Lochung läuft nichts mit');
  }
  // er locht den Spieler: das ganze Motiv
  const lochRunde = runden.findIndex((r) => r.ereignisse.some((e) => e.typ === 'locht' && e.wen === 'spieler'));
  assert.ok(lochRunde > 5);
  assert.deepEqual(tonVon(lochRunde, 'locht').map((n) => n.hz), MOTIV);
  assert.equal(tonVon(lochRunde, 'mitlauf').length, 0, 'in der Runde der Lochung nicht doppelt');
  // danach läuft es in jeder Runde leise mit
  const danach = tonVon(lochRunde + 1, 'mitlauf');
  assert.deepEqual(danach.map((n) => n.hz), MOTIV);
  assert.ok(danach[0].laut < tonVon(lochRunde, 'locht')[0].laut);
});

test('beim Schlafenden dasselbe, tiefer und leiser', () => {
  const { runden } = hoere(HAUPTWEG);
  const alle = [].concat(...runden.map((r) => r.noten));
  const wartetVorn = alle.filter((n) => n.von === 'wartet');
  const amSchlaefer = runden.filter((r) => r.ereignisse.some((e) => e.typ === 'wartet' && e.reihe === 2));
  assert.ok(amSchlaefer.length > 0);
  const tief = amSchlaefer[0].noten.filter((n) => n.von === 'wartet')[0];
  assert.equal(tief.hz, MOTIV[0] / 2);
  assert.ok(tief.laut < notenZu({ typ: 'wartet', reihe: 5 })[0].laut);
  assert.ok(wartetVorn.length > 0);
  // er grüßt: das ganze Motiv, tiefer und leiser
  const gruss = alle.filter((n) => n.von === 'gruesst');
  assert.deepEqual(gruss.map((n) => n.hz), MOTIV.map((hz) => hz / 2));
  const loch = alle.filter((n) => n.von === 'locht');
  assert.ok(gruss[0].laut < loch[0].laut);
  // danach laufen beide Motive leise mit, das des Schlafenden tiefer
  const grussRunde = runden.findIndex((r) => r.ereignisse.some((e) => e.typ === 'gruesst'));
  const mit = runden[grussRunde + 1].noten.filter((n) => n.von === 'mitlauf');
  assert.equal(mit.length, MOTIV.length * 2);
});

test('an der Tür klingt alles aus, dann zwei Sekunden Stille, dann der Abschluss', () => {
  const { z, runden } = hoere(HAUPTWEG);
  assert.equal(z.status, 'ende');
  const letzte = runden[runden.length - 1].noten;
  const aus = letzte.filter((n) => n.art === 'aus');
  assert.equal(aus.length, 1);
  assert.equal(aus[0].dauer, AUSKLANG);
  assert.equal(letzte.filter((n) => n.von === 'mitlauf').length, 0, 'an der Tür läuft nichts mehr mit');
  assert.equal(STILLE, 2);
  assert.equal(ABSCHLUSS_NACH, AUSKLANG + STILLE);
  // die Bühne zeigt den Abschluss erst danach, auch ohne Ton
  const buehne = readFileSync(join(ORDNER, '..', 'src', 'anzeige', 'buehne.js'), 'utf8');
  assert.match(buehne, /zeigeEnde\(e\.tatsachen, e\.lochung, e\.runde, jetzt \+ ABSCHLUSS_NACH \* 1000\)/);
});

test('der Schienenstoß ist ein weicher, tiefer Puls', () => {
  const noten = notenZu({ typ: 'stoss', zange: false });
  assert.equal(noten.length, 2);
  for (const n of noten) {
    assert.equal(n.art, 'puls');
    assert.ok(n.hz <= 120);
  }
});

test('der Ton beginnt erst mit einer Eingabe und hat keine Dateien', () => {
  const ton = readFileSync(join(ORDNER, '..', 'src', 'ton.js'), 'utf8');
  assert.equal(ton.match(/new Klasse\(\)/g).length, 1);
  assert.ok(ton.indexOf('new Klasse()') > ton.indexOf('function wecke()'));
  assert.equal(ton.match(/decodeAudioData|new Audio\b|\.mp3|\.wav|\.ogg/), null);
});
