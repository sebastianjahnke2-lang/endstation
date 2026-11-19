# Stand (19.11., abends)

Zu Beginn jedes Chats zuerst lesen. Nicht von vorn anfangen, nichts doppelt bauen.

## Aktueller Auftrag
- Etappe 2 aus `docs/FAHRPLAN.md`. Freigaben und Antworten wörtlich: `docs/auftraege/etappe-2-anweisungen.md`. Entscheidungen: `docs/ENTSCHEIDUNGEN.md` („Entschieden am 19.11.", „Etappe 2").
- Etappe 2 ist vollständig gebaut: Kontrolleur (Mittelwagen), Aufbrechen jeder Tür, Präsenz, Stärken aus Schatten, Speisewagen mit Gönnen und Gesichtern, Fahrkarte mit Angeboten und Lochungen, Begleiter, Halt mit Rückblick und Schlussbild, und zuletzt die Wiederholung beim Begleiter („Noch mal").
- Pull Request #2 ist in `main` übernommen (alles außer der Wiederholung). Die Wiederholung liegt im Zweig `claude/exciting-brahmagupta-8qmtsg` und braucht einen neuen Pull Request. Den lege ich nur an, wenn der Auftraggeber es sagt.
- Wartet auf den Auftraggeber: Abnahme Etappe 1 (vier Prüffragen im Fahrplan), Rückmeldung Etappe 2, Spieltest des Prototyps.
- Prototyp „Der freie Platz": fertig. Auftrag `docs/auftraege/freier-platz.md`, Spieltest `docs/SPIELTEST-freier-platz.md`.
- Dauerhafte Arbeitsweise: `docs/auftraege/sichern-und-weiterarbeiten.md`.

## Was gebaut ist (Hauptspiel in `src/`, gebaut nach `index.html`)
- `kern/spiel.js`: Zugablauf, Aufbrechen, Stärken, Sprint, Rückhalt, Gönnen, Halt, Wiederholung (`beginneProbe`, `endeProbe`)
- `kern/gegner.js`: Pendler, Reisegruppe, Drängler, Kontrolleur, Präsenz
- `kern/wagen.js`: sieben Wagen, Wagen 3 Mittelwagen, Wagen 4 Speisewagen
- `kern/fahrkarte.js`: sechs Prüfungen, Angebote, helle und dunkle Lochungen
- `kern/begleiter.js`: Gespräch „Woran lag es?" im Speisewagen nach einem Tod, danach „Noch mal"
- `kern/reise.js`: was eine neue Fahrt mitnimmt (auch den Wagen des Todes), genutzt von `main.js` und den Werkzeugen
- `anzeige/`: Zeichnen; `karte.js` Endkarte mit Fahrkarte und Halt-Karte; `figuren.js` Figuren und Symbole
- `speicher.js`: gelernt, ton, staerken, mehrAmTisch, fahrkarte (je mit Anfangswert und Test)
- `werkzeug/begleiter.mjs`: Tod, Gespräch, Wiederholung und Rückkehr im Browser, mit Bildern
- Prototyp: `prototyp/freier-platz/`, eigene Seite und eigene Tests

## Tests
- `npm run build`, dann `npm test`: 250 Tests, alle grün, keiner schlägt fehl.
- `npm run balance`: ausgewogen mit Fehlern 55 %, ohne Fehler 86 %, mit allen Stärken 73 %, Ausweicher 60 %, Kämpfer 0 %.
- Browser: `node werkzeug/bedienung.mjs` bei den sechs Größen aus `CLAUDE.md` und `node werkzeug/begleiter.mjs` bei 390x844 und 360x600: 0 Mängel. Nur Chromium mit iPhone-Profil, kein WebKit, kein echtes iPhone.

## Nächster Schritt
Nichts bauen. Auf die Rückmeldung des Auftraggebers warten. Sagt er „PR anlegen", einen Pull Request vom Zweig nach `main` anlegen (Inhalt: die Wiederholung beim Begleiter). Etappe 3 erst, wenn er sie freigibt.

## Abweichungen vom Auftrag (Gründe in `docs/ENTSCHEIDUNGEN.md`)
- Tod vor dem Speisewagen: Die nächste Fahrt beginnt vorn, nicht im Speisewagen. Sonst würden Wagen übersprungen, die man nie geschafft hat.
- Halt mit weniger als drei hellen Lochungen: weiter ab dem Speisewagen, gleiche Karte. Der Fahrplan sagt dazu nichts.
- Drei der sechs Prüfungen sind von Claude: „Nicht drängeln", „Pünktlich", „Ruhe bewahren". Der Fahrplan nennt nur drei.
- Ein Treffer des Kontrolleurs kostet 2 Herzen, wie im Fahrplan, gegen die eigene Regel „Rot ist ein Herz".
- Die Antworten an den Begleiter sind Figuren statt Wörter, weil drei Schilder bei 360 Pixeln nicht nebeneinander passen.
- Sprint mit einem Tipp zwei Felder weit, nicht per Wischen.
- Wiederholung: In ihr zählt nichts für die Reise (keine Lochung, keine Stärke). Hinaus auch mit einem Schritt nach unten vom Startfeld. Einmal je Tod.
- Prototyp: Abweichungen in `docs/ENTSCHEIDUNGEN.md` unter „Offen" (Daumenzone unten, Abspielen, Testprotokoll).

## Offene Fragen an den Auftraggeber
- Etappe 1: Versteht man es ohne Erklärung? Ist jeder Tod nachvollziehbar? Kommt man in einen Fluss? Will man noch eine Fahrt?
- Etappe 2: Findet man heraus, dass der Kontrolleur Ruhige durchlässt? Fühlt sich der Speisewagen sicher an? Wirkt der Begleiter aufbauend? Erkennt man das Angebot als Prüfung? Hilft „Noch mal", den Tod zu verstehen?
- Ist der Schaffner aus dem Prototyp dieselbe Figur wie Kontrolleur und Begleiter?
- Ergebnis des Spieltests zum Prototyp.

## Am iPhone testen
- Hauptspiel: https://sebastianjahnke2-lang.github.io/endstation/ zeigt `main`, also Etappe 2 ohne die Wiederholung. Die Wiederholung ist erst spielbar, wenn ein neuer Pull Request übernommen ist.
- Prototyp: https://sebastianjahnke2-lang.github.io/endstation/prototyp/freier-platz/
- GitHub Pages ist laut Auftraggeber aktiv. Von hier aus lässt sich die Adresse nicht prüfen.
