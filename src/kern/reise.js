// Was eine neue Fahrt aus der vorigen und aus dem Gemerkten mitnimmt. Reine Logik, für main.js
// und für die Prüfwerkzeuge, damit beide dieselbe Fahrt beginnen.
//
// Eine Reise geht vom ersten Wagen bis zum Halt. Solange behält die Fahrkarte ihre Lochungen.
// Am Halt verlangt der Schaffner drei helle Lochungen. Fehlen welche, geht es im Speisewagen weiter.
// Nach einem Tod sitzt der Begleiter im Speisewagen. Lag der Tod hinter dem Speisewagen,
// beginnt die nächste Fahrt dort, sonst vorn: Niemand überspringt einen Wagen.

import { WAGENPLAENE } from './wagen.js';
import { neueFahrkarte } from './fahrkarte.js';

export const SPEISEWAGEN_NR = WAGENPLAENE.findIndex((w) => w.sicher);

// stand: { staerken, mehrAmTisch, fahrkarte }, vorige: der Zustand der vorigen Fahrt oder null
export function optionenFuerFahrt(stand, vorige) {
  const optionen = { staerken: { ...stand.staerken }, mehrAmTisch: stand.mehrAmTisch, fahrkarte: stand.fahrkarte };
  if (vorige && vorige.status === 'halt') {
    if (vorige.halt && vorige.halt.genug === false) optionen.startWagen = SPEISEWAGEN_NR;
    else optionen.fahrkarte = neueFahrkarte(); // ausgestiegen: eine neue Reise
  }
  if (vorige && vorige.status === 'tot') {
    optionen.begleiter = vorige.todDurch;
    optionen.szene = vorige.todSzene; // den Wagen kann er auf Wunsch wiederholen
    if (vorige.wagenNr > SPEISEWAGEN_NR) optionen.startWagen = SPEISEWAGEN_NR;
  }
  return optionen;
}
