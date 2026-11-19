// Ton ist Zugabe: wenige erzeugte Klänge, keine Dateien. Beim Start ist er aus.
// Jedes Geräusch hat ein sichtbares Gegenstück, ohne Ton fehlt keine Information.
// Fehlertöne gibt es nicht. Wie im Hauptspiel entsteht der Klang erst nach der ersten Berührung.

export function erzeugePlatzTon() {
  let ac = null;
  let haupt = null;
  let rauschen = null;
  let an = false;

  // Darf erst nach einer Eingabe aufgerufen werden, sonst sperrt der Browser den Ton.
  function wecke() {
    if (!an) return;
    try {
      if (!ac) {
        const Klasse = window.AudioContext || window.webkitAudioContext;
        if (!Klasse) return;
        ac = new Klasse();
        haupt = ac.createGain();
        haupt.gain.value = 0.2;
        haupt.connect(ac.destination);
        rauschen = ac.createBuffer(1, ac.sampleRate, ac.sampleRate);
        const daten = rauschen.getChannelData(0);
        let wert = 12345;
        for (let i = 0; i < daten.length; i++) {
          wert = (Math.imul(wert, 1664525) + 1013904223) >>> 0;
          daten[i] = wert / 2147483648 - 1;
        }
      }
      // "suspended" vor der ersten Berührung, "interrupted" nach einem Anruf oder App-Wechsel am iPhone
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
      g.gain.exponentialRampToValueAtTime(laut, t + 0.008);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
      o.connect(g);
      g.connect(haupt);
      o.start(t);
      o.stop(t + dauer + 0.02);
    } catch (fehler) {
      // still weiter
    }
  }

  function hauch(hoehe, dauer, laut, spaeter) {
    if (!ac || !an) return;
    try {
      const t = ac.currentTime + (spaeter || 0);
      const q = ac.createBufferSource();
      const f = ac.createBiquadFilter();
      const g = ac.createGain();
      q.buffer = rauschen;
      f.type = 'bandpass';
      f.frequency.value = hoehe;
      f.Q.value = 0.9;
      g.gain.setValueAtTime(0.0001, t);
      g.gain.exponentialRampToValueAtTime(laut, t + 0.006);
      g.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
      q.connect(f);
      f.connect(g);
      g.connect(haupt);
      q.start(t, (t * 7) % 0.5, dauer + 0.05);
    } catch (fehler) {
      // still weiter
    }
  }

  const PLATZKLAENGE = {
    schritt: () => hauch(1100, 0.05, 0.2),
    nimmt: () => hauch(700, 0.09, 0.22),
    klick: () => klang(1500, 1100, 0.03, 0.12, 'square'),
    // Knips: die Zange schließt
    knips: () => {
      klang(2300, 900, 0.035, 0.45, 'square');
      hauch(3200, 0.04, 0.4);
    },
    // Ta-tack: der Schienenstoß
    tatack: () => {
      hauch(170, 0.07, 0.5);
      klang(72, 50, 0.08, 0.5, 'sine');
      hauch(190, 0.06, 0.38, 0.19);
      klang(80, 55, 0.07, 0.38, 'sine', 0.19);
    },
  };

  return {
    wecke,
    spiele(name) {
      if (PLATZKLAENGE[name]) PLATZKLAENGE[name]();
    },
    setze(wert) {
      an = wert;
    },
  };
}
