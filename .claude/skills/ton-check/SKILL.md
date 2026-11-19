---
name: ton-check
description: Alle Texte und Symbole des Spiels gegen den Ton und die harten Regeln der Vision prüfen. Verwenden, bevor neue Texte, Wagennamen, Durchsagen, Hinweise oder Symbole eingecheckt werden, und am Ende jeder Etappe.
---

# Ton-Check

## Ablauf

1. `npm test` ausführen. `tests/ton.test.js` fängt die verbotenen Wörter, fehlende Zeichen in der Punktmatrix-Schrift und Texte, die bei 360 Pixel nicht auf die Anzeige passen. Das ist nur der Boden, nicht die Prüfung.
2. In `docs/VISION.md` die Abschnitte „Ton" und „Harte Regeln" neu lesen, nicht aus dem Gedächtnis prüfen.
3. Sammeln:
   - alle Zeichenketten in `src/texte.js`
   - Texte, die sich im Code verstecken: in `src/anzeige/` nach `schreibe(` und `schreibeMittig(` mit festem Text suchen und nach `src/texte.js` verschieben. `fillText` darf im Spiel gar nicht vorkommen
   - alle gezeichneten Symbole und Figuren: `src/anzeige/figuren.js`, `kulisse.js` und `karte.js`. Ansehen mit `node werkzeug/schau.mjs`
4. Jeden Text und jedes Symbol einzeln durch die Fragen unten führen.
5. Ändern, was durchfällt. Grenzfälle mit Begründung auflisten.
6. Bericht: was geändert wurde, was grenzwertig bleibt und warum. Ändert ein Grenzfall den Charakter des Spiels, den Auftraggeber fragen.

Braucht ein Wort eine Ausnahme in der Wortliste des Tests, steht der Grund in `docs/ENTSCHEIDUNGEN.md`.

## Fragen an jeden Text

- **Erklärt er?** Regeln, Bedeutung, Moral: streichen. Hinweise haben wenige Worte und erscheinen erst, wenn die Situation eintritt. Prüfungen haben höchstens drei Worte.
- **Urteilt er?** Lob, Tadel, wertende Eigenschaftswörter über den Spieler (mutig, feige, klug, richtig, falsch): ersetzen durch Ort und Handlung. Der Rückblick enthält reine Tatsachen ohne Adjektiv.
- **Benennt er ein Gefühl?** Traurig, einsam, wütend, Angst: streichen und stattdessen im Bild oder in der Haltung zeigen.
- **Passt er auf eine Postkarte?** Klingt er nach Lebensweisheit, gilt er für jeden und immer: streichen.
- **Ist er persönlich?** Jeder Text an den Spieler nennt ein Detail aus genau dieser Fahrt (Wagen, Gegner, Zahl, Handlung). Probe: Könnte der Satz unverändert nach jeder beliebigen Fahrt stehen? Dann ist er zu allgemein.
- **Stimmt die Bahn?** Klingt er nach echter Durchsage, Anzeige oder echtem Schild? Trocken und amtlich, keine Memes, nichts Aktuelles.
- **Marke oder Zitat?** Keine Markennamen, auch keine Bahnunternehmen, Zuggattungen oder Produktnamen. Keine Namen oder Zitate echter Künstler und Werke, auch nicht abgewandelt.
- **Verspricht er etwas fürs echte Leben?** Streichen.
- **Krankheit?** Keine Diagnosen, kein Vokabular aus Therapie oder Medizin. Traum statt Wahnsinn.
- **Bindet er?** Kein „Komm morgen wieder", keine Serien, keine Verknappung, keine Aufforderung zur nächsten Fahrt, die nicht vom Spieler ausgeht.
- **Endet es dunkel?** Auf einen schweren Moment folgt ein warmes Bild.
- **Passt er?** Bei 360 Pixel Breite in der Anzeige lesbar, ohne abgeschnitten zu werden.

## Fragen an jedes Symbol und jede Figur

- Kommt es aus dem Bahnalltag, oder ist es ein erfundenes Zeichen?
- Tut es im Spiel etwas? Ein Symbol, das nur schmückt, fliegt raus.
- Erkennt man es als Umriss, in Feldgröße bei 360×600?
- Gegner haben kein Gesicht. Ein Gesicht bekommen nur verstandene Fahrgäste im Speisewagen (gebaut, vom Auftraggeber am 19.11. bestätigt).
- Keine Tiere.
- Steht das Kleine, Menschliche neben dem Großen, Fremden im selben Bild?

## Wörter, bei denen man stutzen sollte

Der Test sperrt: Gesetz, Macht, Dimension, Aufstieg, Karma, Selbstliebe, Energie, böse, gut, besser, beste, Seele, Schicksal, Gott, heilig, Engel, Teufel, Hölle, Paradies, Sünde, Erlösung, Erleuchtung, Wiedergeburt, spirituell, Aura, Chakra, Mantra.

Nicht gesperrt, aber fast immer falsch: Universum, Achtsamkeit, Heilung, Reise (als Sinnbild), Weg (als Sinnbild), Licht (als Sinnbild), wahres Ich, loslassen als Aufforderung, Stärke, Schwäche, Fehler, Sieg, Niederlage, verdient.
