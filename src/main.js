// Einstieg. Stand Etappe 0: noch kein Spiel, nur die Anzeige am leeren Gleis.

import { TEXTE } from './texte.js';

const NACHT = '#0b0d12';
const BERNSTEIN = '#ffb347';
const SCHRIFT = 'ui-monospace, Menlo, Consolas, "DejaVu Sans Mono", monospace';

const bild = document.getElementById('bild');
const stift = bild.getContext('2d');

function zeichne() {
  const breite = window.innerWidth;
  const hoehe = window.innerHeight;
  const dichte = Math.min(window.devicePixelRatio || 1, 3);
  bild.width = Math.round(breite * dichte);
  bild.height = Math.round(hoehe * dichte);
  stift.setTransform(dichte, 0, 0, dichte, 0, 0);

  stift.fillStyle = NACHT;
  stift.fillRect(0, 0, breite, hoehe);

  const tafelBreite = Math.min(breite - 32, 420);
  const tafelHoehe = 96;
  const x = Math.round((breite - tafelBreite) / 2);
  const y = Math.round(hoehe * 0.3);
  stift.fillStyle = '#14100a';
  stift.fillRect(x, y, tafelBreite, tafelHoehe);
  stift.strokeStyle = '#2b2214';
  stift.lineWidth = 1;
  stift.strokeRect(x + 0.5, y + 0.5, tafelBreite - 1, tafelHoehe - 1);

  stift.fillStyle = BERNSTEIN;
  stift.textAlign = 'center';
  stift.textBaseline = 'middle';
  stift.font = `700 22px ${SCHRIFT}`;
  stift.fillText(TEXTE.titel.toUpperCase(), breite / 2, y + 36);
  stift.font = `14px ${SCHRIFT}`;
  stift.fillText(TEXTE.bereitstellung, breite / 2, y + 66);
}

window.addEventListener('resize', zeichne);
zeichne();
