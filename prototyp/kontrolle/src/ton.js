// Geräusche des Prototyps "Kontrolle": Schritt, Knipsen, Türzischen am Halt, und ein eigener Ton beim Fang.
// Alles erzeugt über Web Audio, keine Dateien. Erst nach der ersten Berührung. Ohne Ton fehlt nichts:
// Jedes Geräusch hat ein sichtbares Gegenstück.

export function erzeugeKontrollTon() {
  let ac = null;
  let haupt = null;
  let rauschen = null;
  let an = true;

  function wecke() {
    if (!an) return;
    try {
      if (!ac) {
        const Klasse = window.AudioContext || window.webkitAudioContext;
        if (!Klasse) return;
        ac = new Klasse();
        haupt = ac.createGain();
        haupt.gain.value = 0.22;
        haupt.connect(ac.destination);
        rauschen = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const daten = rauschen.getChannelData(0);
        let wert = 4711;
        for (let i = 0; i < daten.length; i++) {
          wert = (Math.imul(wert, 1664525) + 1013904223) >>> 0;
          daten[i] = wert / 2147483648 - 1;
        }
      }
      if (ac.state !== 'running') {
        const versuch = ac.resume();
        if (versuch && versuch.catch) versuch.catch(() => {});
      }
    } catch (fehler) {
      ac = null;
    }
  }

  function klang(von, bis, dauer, laut, form, spaeter) {
    if (!ac || !an) return;
    try {
      const t = ac.currentTime + (spaeter || 0);
      const o = ac.createOscillator();
      const g = ac.createGain();
      o.type = form || 'sine';
      o.frequency.setValueAtTime(von, t);
      o.frequency.exponentialRampToValueAtTime(Math.max(20, bis), t + dauer);
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(laut, t + 0.01);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
      o.connect(g);
      g.connect(haupt);
      o.start(t);
      o.stop(t + dauer + 0.02);
    } catch (fehler) {
      // still weiter
    }
  }

  function hauch(hoehe, dauer, laut, spaeter, guete) {
    if (!ac || !an) return;
    try {
      const t = ac.currentTime + (spaeter || 0);
      const q = ac.createBufferSource();
      const f = ac.createBiquadFilter();
      const g = ac.createGain();
      q.buffer = rauschen;
      f.type = 'bandpass';
      f.frequency.value = hoehe;
      f.Q.value = guete || 0.9;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(laut, t + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
      q.connect(f);
      f.connect(g);
      g.connect(haupt);
      q.start(t, 0, dauer + 0.05);
    } catch (fehler) {
      // still weiter
    }
  }

  const KONTROLLKLAENGE = {
    schritt: () => hauch(1100, 0.05, 0.22),
    knips: () => {
      klang(2300, 900, 0.035, 0.45, 'square');
      hauch(3200, 0.04, 0.4);
    },
    // Fang: die Zange schnappt, dann ein tiefer, ruhiger Doppelton
    fang: () => {
      klang(2300, 900, 0.035, 0.5, 'square');
      hauch(3200, 0.05, 0.45);
      klang(330, 330, 0.5, 0.25, 'triangle', 0.06);
      klang(494, 494, 0.7, 0.2, 'triangle', 0.22);
    },
    // Türzischen am Halt
    zischen: () => hauch(2600, 0.75, 0.35, 0, 0.5),
  };

  return {
    wecke,
    spiele(name) {
      if (KONTROLLKLAENGE[name]) KONTROLLKLAENGE[name]();
    },
    setze(wert) {
      an = wert;
    },
  };
}
