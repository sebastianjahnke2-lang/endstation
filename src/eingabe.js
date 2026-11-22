// Eingabe: Wischen, Tippen, Tastatur. Meldet nur, was der Mensch getan hat.
// Ein Wisch löst aus, sobald der Finger weit genug gewandert ist, nicht erst beim Loslassen.

const WISCHWEG = 18; // Pixel bis zum Auslösen
const TIPPWEG = 9; // weniger Bewegung gilt als Tippen

const TASTEN = {
  ArrowUp: 'hoch',
  ArrowRight: 'rechts',
  ArrowDown: 'runter',
  ArrowLeft: 'links',
  KeyW: 'hoch',
  KeyD: 'rechts',
  KeyS: 'runter',
  KeyA: 'links',
  Space: 'warten',
};

function wischrichtung(dx, dy) {
  if (Math.abs(dx) > Math.abs(dy)) return dx > 0 ? 'rechts' : 'links';
  return dy > 0 ? 'runter' : 'hoch';
}

// melde: { aktion(name, quelle), tipp(x, y), losgelassen(), karteOffen(), finger(richtung oder null) }
// finger: Nach einem Wisch, solange der Finger liegt, die Richtung des Wischs; null, sobald er weg ist.
export function verbindeEingabe(flaeche, melde) {
  let finger = null;

  flaeche.addEventListener('pointerdown', (e) => {
    melde.beruehrt();
    if (finger) return;
    finger = { id: e.pointerId, x: e.clientX, y: e.clientY, erledigt: false };
    if (flaeche.setPointerCapture) {
      try {
        flaeche.setPointerCapture(e.pointerId);
      } catch (fehler) {
        // ohne Fang geht es auch
      }
    }
    e.preventDefault();
  });

  flaeche.addEventListener('pointermove', (e) => {
    if (!finger || e.pointerId !== finger.id || finger.erledigt) return;
    const dx = e.clientX - finger.x;
    const dy = e.clientY - finger.y;
    if (Math.max(Math.abs(dx), Math.abs(dy)) < WISCHWEG) return;
    finger.erledigt = true;
    const richtung = wischrichtung(dx, dy);
    melde.aktion(richtung, 'wisch');
    melde.finger(richtung);
  });

  const loslassen = (e) => {
    if (!finger || e.pointerId !== finger.id) return;
    const dx = e.clientX - finger.x;
    const dy = e.clientY - finger.y;
    const fertig = finger.erledigt;
    finger = null;
    melde.finger(null);
    if (e.type === 'pointerup') melde.losgelassen();
    if (fertig || e.type !== 'pointerup') return;
    if (Math.hypot(dx, dy) < TIPPWEG) {
      // Der Canvas beginnt nicht immer in der Ecke: Neben Notch und Home-Balken bleibt ein Rand frei.
      const kasten = flaeche.getBoundingClientRect();
      melde.tipp(e.clientX - kasten.left, e.clientY - kasten.top);
    }
    else melde.aktion(wischrichtung(dx, dy), 'wisch'); // ein kurzer Wisch zählt auch
  };
  flaeche.addEventListener('pointerup', loslassen);
  flaeche.addEventListener('pointercancel', loslassen);
  flaeche.addEventListener('contextmenu', (e) => e.preventDefault());

  // Safari auf dem iPhone: kein Gummiband beim Ziehen, kein Zoom mit zwei Fingern oder Doppeltipp.
  const halt = (e) => e.preventDefault();
  document.addEventListener('touchmove', halt, { passive: false });
  document.addEventListener('gesturestart', halt);
  document.addEventListener('gesturechange', halt);
  document.addEventListener('dblclick', halt);
  // Den Ton gibt Safari erst frei, wenn ein Finger den Bildschirm wieder verlässt.
  document.addEventListener('touchend', () => melde.losgelassen(), { passive: true });
  document.addEventListener('click', () => melde.losgelassen());

  window.addEventListener('keydown', (e) => {
    if (e.ctrlKey || e.metaKey || e.altKey) return;
    const name = TASTEN[e.code] || (e.code === 'Enter' ? 'hoch' : null);
    if (!name) return;
    e.preventDefault();
    melde.beruehrt();
    if (e.code === 'Enter' && !melde.karteOffen()) return;
    melde.aktion(name, 'taste');
  });
}
