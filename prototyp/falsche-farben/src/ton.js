// Geräusche des Prototyps "Falsche Farben" (Zusammenrücken hell, Abrücken dumpf), erzeugt über Web Audio, keine Dateien, erst nach der ersten
// Berührung. Dazu die Tonschichten: Jede geräumte Bank fügt dem Saal einen leisen, gehaltenen Ton hinzu,
// bis zu einer für jedes Fenster. Ohne Ton fehlt nichts: Jedes Geräusch hat ein sichtbares Gegenstück.

export const SCHICHTTOENE = [146.83, 220, 293.66, 369.99, 440, 329.63, 554.37, 587.33, 659.25, 493.88, 739.99, 880, 196, 987.77];

export function erzeugeSaalTon() {
  let ac = null;
  let haupt = null;
  let rauschen = null;
  let an = true;
  let schichten = []; // { g } je klingender Schicht
  let gewuenscht = 0;

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
        stelleSchichten();
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

  // eine gehaltene Schicht: leiser Ton, der langsam an- und abschwillt
  function neueSchicht(i) {
    const t = ac.currentTime;
    const o = ac.createOscillator();
    const g = ac.createGain();
    const lfo = ac.createOscillator();
    const tiefe = ac.createGain();
    o.type = i % 3 === 0 ? 'triangle' : 'sine';
    o.frequency.value = SCHICHTTOENE[i % SCHICHTTOENE.length];
    const laut = i < 2 ? 0.05 : 0.032;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.linearRampToValueAtTime(laut, t + 2.5);
    lfo.frequency.value = 0.06 + (i % 5) * 0.035;
    tiefe.gain.value = laut * 0.45;
    lfo.connect(tiefe);
    tiefe.connect(g.gain);
    o.connect(g);
    g.connect(haupt);
    o.start(t);
    lfo.start(t);
    return { o, g, lfo };
  }

  function stelleSchichten() {
    if (!ac) return;
    try {
      while (schichten.length < gewuenscht) schichten.push(neueSchicht(schichten.length));
      while (schichten.length > gewuenscht) {
        const s = schichten.pop();
        const t = ac.currentTime;
        s.g.gain.cancelScheduledValues(t);
        s.g.gain.setValueAtTime(s.g.gain.value, t);
        s.g.gain.linearRampToValueAtTime(0, t + 1.2);
        s.o.stop(t + 1.3);
        s.lfo.stop(t + 1.3);
      }
    } catch (fehler) {
      // still weiter
    }
  }

  const SAALKLAENGE = {
    setzen: () => {
      hauch(700, 0.06, 0.25);
      klang(210, 170, 0.08, 0.2, 'triangle');
    },
    ankunft: () => hauch(1500, 0.3, 0.07),
    schimmer: () => {
      klang(1318.5, 1318.5, 0.4, 0.06);
      klang(1760, 1760, 0.45, 0.045, 'sine', 0.06);
    },
    // Abrücken: ein dumpfer, kurzer Ton nach unten
    abruecken: () => {
      klang(150, 105, 0.22, 0.28, 'triangle');
      hauch(260, 0.12, 0.18);
    },
    // eigener Klang beim Auffliegen: zwei tiefe Töne, die sich reiben und absinken
    aufgeflogen: () => {
      klang(311, 292, 0.55, 0.2, 'triangle');
      klang(330, 309, 0.55, 0.14, 'triangle', 0.04);
    },
    raeumen: () => {
      [293.66, 369.99, 440, 587.33].forEach((f, i) => klang(f, f, 0.9, 0.12, 'triangle', i * 0.07));
    },
    ende: () => {
      klang(146.83, 146.83, 1.6, 0.12, 'triangle');
      klang(220, 220, 1.6, 0.08, 'sine', 0.1);
    },
  };

  return {
    wecke,
    spiele(name) {
      if (SAALKLAENGE[name]) SAALKLAENGE[name]();
    },
    schicht(n) {
      gewuenscht = Math.max(0, Math.min(SCHICHTTOENE.length, n));
      stelleSchichten();
    },
    setze(wert) {
      an = wert;
      if (!ac) return;
      try {
        haupt.gain.setValueAtTime(an ? 0.22 : 0, ac.currentTime);
      } catch (fehler) {
        // still weiter
      }
    },
  };
}
