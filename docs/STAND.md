# Stand (22.11.)

Zu Beginn jedes Chats zuerst lesen. Nicht von vorn anfangen, nichts doppelt bauen.

## Aktueller Auftrag
Arbeitsweise seit 22.11.: `docs/WARTESCHLANGE.md` von oben abarbeiten, Regeln in `docs/auftraege/arbeitsweise.md`.

Abschnitt 2 (ein Pull Request bis zum Spieltest):
1. **Prototyp „Falsche Farben": gebaut.** Eigener Ordner `prototyp/falsche-farben/`, nichts am Hauptspiel geändert. Saal mit fünf Bänken zu vier Plätzen, vier Farben mit eigenen Hüten, Falsche erkennt man am Schimmern. 14 Fenster, dann ist der Abend hell. Entscheidungen in `docs/ENTSCHEIDUNGEN.md` („Prototyp Falsche Farben"). Browser: `node prototyp/falsche-farben/werkzeug/fotos.mjs 390x844 [seed] [blind]`.
2. **SPIELTEST: hier angehalten.** Pull Request für Abschnitt 2 ist offen.

Hinweis: Im Arbeitsordner lag zu Beginn eine nicht eingecheckte Änderung an `src/eingabe.js` aus einer früheren Sitzung, die den Leerlauf wieder entfernt hätte. Sie liegt unangetastet in `git stash` („Reste fruehere Sitzung") und ist nicht eingecheckt.

Abschnitt 1 (Pull Request #8, in `main`): Sprint an der Engstelle, Halt ohne Sperre, Leerlauf vor der Tür. Wartet auf den Spieltest.

Davor:
- **Bodensymbole lesbar machen** (22.11.): in `main` (Pull Request #7), wartet auf den Test am iPhone.
- **Prototyp „Kontrolle": die Schicht** (21.11.): in `main`, wartet auf den Test am iPhone, bleibt liegen.
- „Leitsätze und die ersten zehn Minuten": Schritt 1 bis 3 gebaut. Schritt 4 und 6 stehen jetzt in der Warteschlange, Schritt 5 und 7 noch nicht.

## Nächster Schritt
Warten auf den Spieltest von „Falsche Farben" (und weiter von Abschnitt 1). Danach neue Aufträge unten in `docs/WARTESCHLANGE.md` anhängen.

## Was gebaut ist (Hauptspiel in `src/`, gebaut nach `index.html`)
- `kern/spiel.js`: Zugablauf, Aufbrechen, Stärken, Sprint, Rückhalt, Gönnen, Halt, Wiederholung
- `kern/gegner.js`: Pendler, Reisegruppe, Drängler, Kontrolleur, Präsenz
- `kern/wagen.js`: sieben Wagen, Wagen 3 Mittelwagen, Wagen 4 Speisewagen
- `kern/fahrkarte.js`: sechs Prüfungen, Angebote, helle und dunkle Lochungen, Halt ohne Sperre, Verstehen locht
- `kern/begleiter.js`: Gespräch im Speisewagen nach einem Tod, danach „Noch mal"
- `kern/reise.js`: was eine neue Fahrt mitnimmt
- `kern/fortsetzen.js`: Aufzeichnung und Nachspielen der laufenden Fahrt
- `speicher.js`: gelernt, ton, staerken, mehrAmTisch, fahrkarte, fahrt (je mit Anfangswert und Test)
- Prototyp: `prototyp/freier-platz/`, eigene Seite und eigene Tests, mit Musik

## Tests
- `npm run build`, dann `npm test`: 372 Tests, alle grün (davon 35 für „Falsche Farben": Regeln, Einstieg, Erkennen ohne Raten, blind verliert, Aufteilung, Schlusssatz, Build).
- Falsche Farben im Browser (Chromium mit iPhone-Profil): ganzer Abend hinsehend bei 390x844 und 360x600, blind bei 360x600, jeder Zug gleich mit dem Kern, keine Mängel.
- `npm run balance` vorher und nachher gleich: ausgewogen mit Fehlern 55 %, ohne Fehler 86 %, mit allen Stärken 73 %, Ausweicher 60 %, Kämpfer 0 %.
- Kontrolle im Browser: `prototyp/kontrolle/werkzeug/fotos.mjs` (Lernhalt und eine Schicht) bei 390x844 und 360x600 ohne Mängel.
- Browser (nur Chromium mit iPhone-Profil): `bedienung.mjs` bei sechs Größen 0 Mängel, `begleiter.mjs` 0 Mängel, `fortsetzen.mjs` bei 390x844 und 360x600 0 Mängel.

## Abweichungen vom Auftrag (Gründe in `docs/ENTSCHEIDUNGEN.md`)
- Tod vor dem Speisewagen: Die nächste Fahrt beginnt vorn, nicht im Speisewagen.
- Drei der sechs Prüfungen sind von Claude: „Nicht drängeln", „Pünktlich", „Ruhe bewahren".
- Ein Treffer des Kontrolleurs kostet 2 Herzen, wie im Fahrplan.
- Antworten an den Begleiter sind Figuren statt Wörter.
- Sprint mit einem Tipp zwei Felder weit, nicht per Wischen.
- Wiederholung: zählt nichts für die Reise, einmal je Tod.
- Fortsetzen: Mit `#seed=` wird nicht fortgesetzt. War die Fahrt beim Schließen zu Ende, erscheint ihre Endkarte nicht noch einmal.
- Prototyp: Abweichungen unter „Offen" (Daumenzone unten, Abspielen, Testprotokoll, Stille an der Tür).

## Offene Fragen an den Auftraggeber
- Etappe 1 und 2: die Prüffragen aus dem Fahrplan.
- Offene Punkte aus den Leitsätzen in `docs/ENTSCHEIDUNGEN.md` (Kämpfer, Spielstil, Warten ohne Preis, Belohnungen ohne Verwendung, Bestwerte, VISION.md unter der Spieladresse).
- Spieltest des Prototyps mit Ton.

## Am iPhone testen
- Hauptspiel: https://sebastianjahnke2-lang.github.io/endstation/ zeigt `main`. Mit Fortsetzen (Pull Request #4 ist übernommen).
- Prototyp: https://sebastianjahnke2-lang.github.io/endstation/prototyp/freier-platz/ (Musik nach Übernahme von Pull Request #4).
- Falsche Farben: https://sebastianjahnke2-lang.github.io/endstation/prototyp/falsche-farben/ (nach Übernahme des Pull Requests).
- Kontrolle: https://sebastianjahnke2-lang.github.io/endstation/prototyp/kontrolle/ (erster Stand in `main`, das Auslosen nach Übernahme des neuen Pull Requests).
