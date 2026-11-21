// Ton: alles erzeugt über Web Audio, keine Dateien. Was erklingt, entscheidet musik.js.
// Jedes Geräusch hat ein sichtbares Gegenstück, ohne Ton fehlt keine Information.
// Fehlertöne gibt es nicht. Wie im Hauptspiel entsteht der Klang erst nach der ersten Berührung.
// Der Grundklang beginnt mit der ersten Eingabe einer Fahrt und klingt an der Tür aus.

import { GRUNDKLANG } from './musik.js';

export function erzeugePlatzTon() {
  let ac = null;
  let haupt = null;
  let an = false;
  let grund = null; // der laufende Grundklang: { stimmen, pegel }
  let ausgeklungen = false; // an der Tür verklungen, bis zur nächsten Fahrt

  // Darf erst nach einer Eingabe aufgerufen werden, sonst sperrt der Browser den Ton.
  function wecke() {
    if (!an) return;
    try {
      if (!ac) {
        const Klasse = window.AudioContext || window.webkitAudioContext;
        if (!Klasse) return;
        ac = new Klasse();
        haupt = ac.createGain();
        haupt.gain.value = 0.5;
        haupt.connect(ac.destination);
      }
      // "suspended" vor der ersten Berührung, "interrupted" nach einem Anruf oder App-Wechsel am iPhone
      if (ac.state !== 'running') {
        const versuch = ac.resume();
        if (versuch && versuch.catch) versuch.catch(() => {});
      }
      if (!grund && !ausgeklungen) starteGrund();
    } catch (fehler) {
      ac = null;
    }
  }

  // Ein leiser, tiefer, langer Ton: Dreieck durch einen weichen Filter, darüber leise die Quinte.
  // Er atmet langsam, damit er nicht steht wie ein Brummen.
  function starteGrund() {
    const t = ac.currentTime;
    const pegel = ac.createGain();
    pegel.gain.setValueAtTime(0.0001, t);
    pegel.gain.exponentialRampToValueAtTime(GRUNDKLANG.laut, t + 2.5);
    const filter = ac.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = 520;
    filter.Q.value = 0.4;
    filter.connect(pegel);
    pegel.connect(haupt);

    const tief = ac.createOscillator();
    tief.type = 'triangle';
    tief.frequency.value = GRUNDKLANG.hz;
    tief.connect(filter);

    const quinte = ac.createOscillator();
    quinte.type = 'sine';
    quinte.frequency.value = GRUNDKLANG.quinte;
    const quintenPegel = ac.createGain();
    quintenPegel.gain.value = 0.35;
    quinte.connect(quintenPegel);
    quintenPegel.connect(filter);

    const atem = ac.createOscillator();
    atem.frequency.value = 0.09;
    const atemTiefe = ac.createGain();
    atemTiefe.gain.value = 140;
    atem.connect(atemTiefe);
    atemTiefe.connect(filter.frequency);

    const stimmen = [tief, quinte, atem];
    for (const s of stimmen) s.start(t);
    grund = { stimmen, pegel };
  }

  function beendeGrund(dauer) {
    if (!grund || !ac) return;
    const t = ac.currentTime;
    const { stimmen, pegel } = grund;
    grund = null;
    try {
      pegel.gain.cancelScheduledValues(t);
      pegel.gain.setValueAtTime(Math.max(0.0001, pegel.gain.value), t);
      pegel.gain.exponentialRampToValueAtTime(0.0001, t + dauer);
      for (const s of stimmen) s.stop(t + dauer + 0.05);
    } catch (fehler) {
      // still weiter
    }
  }

  // Ein weicher Ton: langsamer Einsatz, langes Ausklingen. Beim Gleiten wandert die Höhe.
  function spieleTon(n) {
    const t = ac.currentTime + (n.spaeter || 0);
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = 'sine';
    o.frequency.setValueAtTime(n.hz, t);
    if (n.art === 'gleiten') o.frequency.exponentialRampToValueAtTime(n.bis, t + n.dauer * 0.8);
    const einsatz = n.art === 'puls' ? 0.02 : 0.03;
    g.gain.setValueAtTime(0.0001, t);
    g.gain.exponentialRampToValueAtTime(n.laut, t + einsatz);
    g.gain.exponentialRampToValueAtTime(0.0001, t + n.dauer);
    o.connect(g);
    g.connect(haupt);
    o.start(t);
    o.stop(t + n.dauer + 0.05);
    if (n.art === 'puls') {
      // eine leise Oktave darüber, sonst hört man den Schienenstoß am Handy kaum
      const o2 = ac.createOscillator();
      const g2 = ac.createGain();
      o2.frequency.setValueAtTime(n.hz * 2, t);
      o2.frequency.exponentialRampToValueAtTime(n.hz * 1.6, t + n.dauer);
      g2.gain.setValueAtTime(0.0001, t);
      g2.gain.exponentialRampToValueAtTime(n.laut * 0.4, t + einsatz);
      g2.gain.exponentialRampToValueAtTime(0.0001, t + n.dauer * 0.7);
      o2.connect(g2);
      g2.connect(haupt);
      o2.start(t);
      o2.stop(t + n.dauer + 0.05);
    }
  }

  function spiele(noten) {
    if (!ac || !an) return;
    for (const n of noten) {
      try {
        if (n.art === 'aus') {
          ausgeklungen = true;
          beendeGrund(n.dauer);
        } else if (!ausgeklungen) {
          spieleTon(n);
        }
      } catch (fehler) {
        // still weiter
      }
    }
  }

  return {
    wecke,
    spiele,
    // eine neue Fahrt: Der Grundklang beginnt wieder mit der nächsten Eingabe
    neueFahrt() {
      ausgeklungen = false;
      beendeGrund(0.3);
    },
    setze(wert) {
      an = wert;
      if (!an) beendeGrund(0.4);
    },
  };
}
