# Stand (21.11.)

Zu Beginn jedes Chats zuerst lesen. Nicht von vorn anfangen, nichts doppelt bauen.

## Aktueller Auftrag
- **Prototyp „Kontrolle"** (21.11.), wörtlich in `docs/auftraege/kontrolle.md`: gebaut in `prototyp/kontrolle/`, wartet auf den Test am iPhone. Danach nichts Neues, bis der Auftraggeber sich meldet. Entscheidungen und offene Punkte in `docs/ENTSCHEIDUNGEN.md` („Prototyp Kontrolle"). Die Frage zur Musik im freien Platz ist laut Auftraggeber erledigt.

Davor:
- „Leitsätze und die ersten zehn Minuten", wörtlich in `docs/auftraege/leitsaetze.md`. Leitsätze in `docs/PRINZIPIEN.md`.
- Schritt 1 bis 3 sind gebaut: Leitsätze abgelegt (auch in CLAUDE.md und im Skill `neue-szene`), `docs/WAGEN-PRUEFUNG.md`, Fahrt fortsetzen (`src/kern/fortsetzen.js`). Alles liegt in Pull Request #4, zusammen mit der Musik im Prototyp (nur ein Arbeitszweig).
- Dazu eingetragen: offene Punkte in `docs/ENTSCHEIDUNGEN.md` („Leitsätze und die ersten zehn Minuten"), zwei Ideen in `docs/IDEEN.md`, Spieltestplan `docs/SPIELTEST-hauptspiel.md`.
- Vorher am 21.11.: Prototyp „Der freie Platz" mit Musik, ebenfalls in Pull Request #4.

## Nächster Schritt
Nichts bauen, bis der Auftraggeber sich zum Prototyp „Kontrolle" und zu Schritt 1 bis 3 der Leitsätze meldet. Danach Schritt 4 bis 7 in dieser Reihenfolge:
4. Halt ohne Sperre, Verstehen locht (Entscheidung vom 19.11. ändern, in ENTSCHEIDUNGEN und FAHRPLAN eintragen).
5. Augenblick des Verstehens (Stillstand unter 150 ms, Reaktion der Figur, eigener Ton, kein Text).
6. Leerlauf vor der Tür, zwei umschaltbare Varianten, nur im gefahrlosen Wagen.
7. Wagen 1 zuletzt neu fassen (Befund in `docs/WAGEN-PRUEFUNG.md`).
Vorher und nachher `npm run balance`, Zahlen in den Bericht.

## Was gebaut ist (Hauptspiel in `src/`, gebaut nach `index.html`)
- `kern/spiel.js`: Zugablauf, Aufbrechen, Stärken, Sprint, Rückhalt, Gönnen, Halt, Wiederholung
- `kern/gegner.js`: Pendler, Reisegruppe, Drängler, Kontrolleur, Präsenz
- `kern/wagen.js`: sieben Wagen, Wagen 3 Mittelwagen, Wagen 4 Speisewagen
- `kern/fahrkarte.js`: sechs Prüfungen, Angebote, helle und dunkle Lochungen, am Halt drei helle verlangt (noch, bis Schritt 4)
- `kern/begleiter.js`: Gespräch im Speisewagen nach einem Tod, danach „Noch mal"
- `kern/reise.js`: was eine neue Fahrt mitnimmt
- `kern/fortsetzen.js`: Aufzeichnung und Nachspielen der laufenden Fahrt
- `speicher.js`: gelernt, ton, staerken, mehrAmTisch, fahrkarte, fahrt (je mit Anfangswert und Test)
- Prototyp: `prototyp/freier-platz/`, eigene Seite und eigene Tests, mit Musik

## Tests
- `npm run build`, dann `npm test`: 293 Tests, alle grün (davon Prototyp Kontrolle: Regeln, Lösbarkeit, Anzeige, Build).
- `npm run balance` vorher und nachher gleich: ausgewogen mit Fehlern 55 %, ohne Fehler 86 %, mit allen Stärken 73 %, Ausweicher 60 %, Kämpfer 0 %.
- Kontrolle im Browser: `prototyp/kontrolle/werkzeug/fotos.mjs` bei 390x844, 360x600 und 375x548 ohne Mängel.
- Browser (nur Chromium mit iPhone-Profil): `bedienung.mjs` bei sechs Größen 0 Mängel, `begleiter.mjs` 0 Mängel, `fortsetzen.mjs` bei 390x844 und 360x600 0 Mängel.

## Abweichungen vom Auftrag (Gründe in `docs/ENTSCHEIDUNGEN.md`)
- Tod vor dem Speisewagen: Die nächste Fahrt beginnt vorn, nicht im Speisewagen.
- Halt mit weniger als drei hellen Lochungen: weiter ab dem Speisewagen (fällt mit Schritt 4 weg).
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
- Hauptspiel: https://sebastianjahnke2-lang.github.io/endstation/ zeigt `main`. Fortsetzen erst nach Übernahme von Pull Request #4.
- Prototyp: https://sebastianjahnke2-lang.github.io/endstation/prototyp/freier-platz/ (Musik nach Übernahme von Pull Request #4).
- Kontrolle: https://sebastianjahnke2-lang.github.io/endstation/prototyp/kontrolle/ (nach Übernahme von Pull Request #4).
