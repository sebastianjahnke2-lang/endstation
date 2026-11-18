// Zeigt eine Bot-Fahrt Zug für Zug als Textbild. Hilft, wenn eine Zahl im Balance-Bericht überrascht.
//
//   node werkzeug/spur.mjs <bot> <seed> [abZug] [bisZug]
//
// @ Spieler, P Pendler (p pausiert), V Vorderster, g Gruppe, D Drängler (d erschöpft), # Hindernis, [ ] rot

import { BOTS } from '../tests/bots.js';
import { erzeugeSpiel } from '../src/kern/spiel.js';
import { istVorderster, istMarkiert } from '../src/kern/lage.js';

const [bot = 'ausgewogener', seed = 1, ab = 0, bis = 400] = process.argv.slice(2);
const spiel = erzeugeSpiel(Number(seed));
const z = spiel.zustand;
const merk = {};

function bild() {
  const zeilen = [];
  for (let y = 0; y < 8; y++) {
    let zeile = '';
    for (let x = 0; x < 5; x++) {
      const g = z.gegner.find((e) => e.x === x && e.y === y);
      let c = z.wagen.plan[y][x] === '.' ? '.' : '#';
      if (g) c = g.typ === 'pendler' ? (g.pause ? 'p' : 'P') : g.typ === 'draengler' ? (g.erschoepft ? 'd' : 'D') : istVorderster(z, g) ? 'V' : 'g';
      if (z.spieler.x === x && z.spieler.y === y) c = '@';
      zeile += istMarkiert(z, x, y) ? `[${c}]` : ` ${c} `;
    }
    zeilen.push(zeile);
  }
  return zeilen.join('\n');
}

for (let i = 0; i < Number(bis) && z.status === 'faehrt'; i++) {
  const aktion = BOTS[bot](z, merk);
  if (i >= Number(ab)) {
    console.log(`--- Zug ${i}, Wagen ${z.wagenNr + 1}, Herzen ${z.spieler.herzen}, Ruhe ${z.spieler.ruhe}, HP ${z.gegner.map((g) => g.hp).join('')} -> ${aktion}\n${bild()}`);
  }
  const ereignisse = spiel.act(aktion);
  if (ereignisse.length === 1 && ereignisse[0].typ === 'ungueltig') spiel.act('warten');
}
console.log(`Ende: ${z.status}, Wagen ${z.wagenNr + 1}, Zug ${z.zug}`);
