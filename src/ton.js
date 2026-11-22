// Ton ist Zugabe: wenige erzeugte Klänge, keine Dateien. Fehlt Web Audio, bleibt es still.
// Er beginnt erst nach der ersten Berührung. Vibration nutzt das Spiel nicht, das iPhone kennt sie im Browser nicht.

export function erzeugeTon() {
  let ac = null;
  let haupt = null;
  let rauschen = null;
  let an = true;

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

  const KLAENGE = {
    schritt: () => hauch(1100, 0.05, 0.22),
    warten: () => klang(1400, 1300, 0.03, 0.08, 'square'),
    ungueltig: () => klang(130, 110, 0.05, 0.2, 'triangle'),
    schlag: () => {
      klang(170, 70, 0.1, 0.8, 'triangle');
      hauch(500, 0.06, 0.35);
    },
    besiegt: () => klang(392, 262, 0.2, 0.3, 'sine', 0.05),
    treffer: () => {
      klang(120, 45, 0.22, 0.9, 'sawtooth');
      hauch(260, 0.14, 0.5);
    },
    ausgewichen: () => {
      hauch(2200, 0.13, 0.22);
      klang(784, 988, 0.14, 0.14, 'sine', 0.03);
    },
    tuerAuf: () => {
      klang(880, 880, 0.1, 0.25, 'sine');
      klang(1175, 1175, 0.16, 0.25, 'sine', 0.13);
    },
    wagenwechsel: () => hauch(320, 0.24, 0.5),
    // Etappe 2
    tuerStoss: () => {
      klang(90, 60, 0.12, 0.6, 'triangle');
      hauch(180, 0.08, 0.3);
    },
    kontrolle: () => klang(2600, 2400, 0.02, 0.12, 'square'), // die Zange klickt
    sprint: () => hauch(1500, 0.12, 0.35),
    // Sprint einführen: an den in der Engstelle stoßen, und wie er Platz macht
    angestossen: () => klang(150, 130, 0.08, 0.3, 'triangle'),
    platzGemacht: () => klang(392, 523, 0.16, 0.13, 'sine', 0.04),
    geheilt: () => {
      klang(523, 523, 0.3, 0.16, 'sine');
      klang(659, 659, 0.36, 0.14, 'sine', 0.12);
    },
    tod: () => klang(196, 98, 0.5, 0.4, 'sine', 0.1),
    // die Wiederholung beim Begleiter: ein Hauch, der Ton sinkt hinein und steigt wieder heraus
    probe: () => {
      hauch(260, 0.3, 0.35);
      klang(440, 330, 0.3, 0.12, 'sine', 0.04);
    },
    probeEnde: () => {
      hauch(260, 0.3, 0.35);
      klang(330, 440, 0.3, 0.12, 'sine', 0.04);
    },
    // Bodensymbole: Was man betritt, antwortet sofort. Hell und steigend, was nützt; tief, was droht.
    angenommen: () => {
      klang(659, 659, 0.12, 0.16, 'sine');
      klang(880, 880, 0.2, 0.16, 'sine', 0.09);
    },
    gelocht: () => {
      klang(2600, 2400, 0.02, 0.14, 'square');
      klang(988, 988, 0.22, 0.14, 'sine', 0.05);
    },
    antwort: () => klang(587, 784, 0.18, 0.14, 'sine'),
    aufRot: () => {
      klang(220, 208, 0.09, 0.22, 'square');
      klang(220, 208, 0.09, 0.22, 'square', 0.13);
    },
    halt: () => {
      klang(523, 523, 0.3, 0.3, 'sine', 0.1);
      klang(659, 659, 0.3, 0.3, 'sine', 0.38);
      klang(784, 784, 0.5, 0.3, 'sine', 0.66);
    },
  };

  return {
    wecke,
    spiele(ereignisse) {
      const schon = new Set();
      for (const e of ereignisse) {
        const name = e.typ === 'schlag' && e.besiegt ? 'besiegt' : e.typ === 'gelocht' && !e.hell ? '' : e.typ;
        if ((e.typ === 'schritt' || e.typ === 'sprint') && e.rot && !schon.has('aufRot')) {
          KLAENGE.aufRot();
          schon.add('aufRot');
        }
        if (e.typ === 'schlag') KLAENGE.schlag();
        if (KLAENGE[name] && !schon.has(name) && name !== 'schlag') KLAENGE[name]();
        schon.add(name);
      }
    },
    // Schienenstoß im Flusszustand
    takt() {
      hauch(170, 0.07, 0.4);
      klang(72, 50, 0.08, 0.4, 'sine');
    },
    setze(wert) {
      an = wert;
    },
  };
}
