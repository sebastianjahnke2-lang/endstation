# Entscheidungen

Detailfragen, die Claude selbst entschieden hat. Neueste Etappe oben. Jede Zeile: was, und warum.

## Etappe 0

- **Build ohne Werkzeuge von außen.** `build.js` hängt die Dateien aus `src/` in Abhängigkeitsreihenfolge aneinander, entfernt Importe und Exporte und packt alles in eine Funktion. Warum: Der Fahrplan verbietet Bibliotheken, und so laden die Tests in Node genau dieselben Dateien wie das Spiel. Preis: vier Regeln für den Quelltext (siehe `CLAUDE.md`), die der Build selbst prüft.
- **`index.html` ist eingecheckt und wird getestet.** `npm test` schlägt fehl, wenn sie nicht zum Stand von `src/` passt. Warum: GitHub Pages liefert die Datei direkt aus, ein vergessener Build wäre sonst unsichtbar.
- **Test gegen Nachladen und Netz.** Die gebaute Seite darf keine Adresse, keinen Verweis auf andere Dateien und keinen Netzwerkaufruf enthalten. Warum: „eine einzige Datei, ohne externe Assets, keine Netzwerkzugriffe" soll nicht von Aufmerksamkeit abhängen. Für die PWA in Etappe 5 (Manifest, Service Worker) muss der Test gezielt gelockert werden.
- **Alle sichtbaren Texte in `src/texte.js`.** Nur Zeichenketten, veränderliche Stellen als `{n}`. Warum: Der Ton-Test und der Skill `ton-check` sehen so jeden Text, ohne den Code durchsuchen zu müssen.
- **Ton-Test nur für das Eindeutige.** `tests/ton.test.js` sperrt die Wörter aus den harten Regeln und einen kleinen Kern aus Religion und Esoterik. „gut", „besser", „beste" sind in allen Formen gesperrt, auch in Grüßen wie „Gute Fahrt". Warum: lieber einmal umformulieren als eine Wertung durchrutschen lassen. Alles, was Urteilskraft braucht (Kitsch, Belehrung, Marken, Zitate), bleibt beim Skill.
- **„Analyse-Skripte" heißt Tracking.** Gemeint sind Skripte, die im Spiel Nutzungsdaten sammeln. Die Bots und der Balance-Bericht laufen nur in Node, sind Tests und vom Fahrplan verlangt.
- **Fachbegriffe im Code auf Deutsch.** Wagen, Ruhe, Lochung, Pendler heißen im Code wie im Fahrplan. Warum: kein Übersetzen zwischen Vision und Code, weniger Missverständnisse.
- **Tests mit dem Testläufer von Node.** `node --test` ist eingebaut und braucht kein Paket.
- **Platzhalter statt leerer Seite.** `index.html` zeigt eine bernsteinfarbene Anzeige mit „Zug wird bereitgestellt". Warum: So lässt sich prüfen, ob GitHub Pages läuft, bevor es ein Spiel gibt. Es ist kein Spielcode und verschwindet mit Etappe 1. Die Schrift ist noch keine echte Punktmatrix, die kommt mit der Kopfzeile in Etappe 1.
- **GitHub Pages aus `main`, Ordner `/ (root)`.** Warum: Die Arbeitszweige von Claude heißen in jeder Sitzung anders, `main` bleibt gleich. Die Datei `.nojekyll` schaltet die Nachbearbeitung durch GitHub ab.
- **README.** Titel und der Satz „Dieser Zug endet hier." Er ist eine echte Durchsage und verrät nichts.
- **Skills beschreiben den Zielzustand.** `neue-szene` und `balance-pruefen` nennen Dateien und Befehle, die erst in Etappe 1 entstehen. Sie werden am Ende von Etappe 1 an den echten Code angepasst.
