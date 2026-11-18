# Entscheidungen

Detailfragen, die Claude selbst entschieden hat. Neueste Etappe oben. Jede Zeile: was, und warum.

## Etappe 1

### Regeln

- **Herantreten oder ankündigen, nie beides in einem Zug.** Ein Gegner, der neben den Spieler tritt, überlässt ihm den ersten Schlag. Warum: Das ist der taktische Kern. Wer wartet und kommen lässt, bleibt heil. Wer selbst hinläuft, wird zuerst markiert.
- **Höchstens ein Herz je Zug.** Treffen mehrere Angriffe im selben Zug, kostet es trotzdem nur ein Herz. Warum: Rot heißt immer genau ein Herz, und fünf Herzen sind fünf Fehler. Das macht jeden Tod nachvollziehbar.
- **Ruhe gibt es nur für den Schritt von Rot auf Nicht-Rot.** Den Angreifer wegzuschlagen, bevor er trifft, lässt seinen Angriff verfallen, bringt aber keine Ruhe. Warum: So steht es im Fahrplan („ein rotes Feld verlässt").
- **Der langsame Pendler in Wagen 1** setzt nach jedem Schritt und jedem Hieb einen Zug aus und sieht dabei auf die Uhr.
- **Die Reisegruppe ist eine Kette.** Nur der Vorderste (mit Wimpel) greift an: Er kündigt die nächsten zwei Felder seines Wegs an und läuft sie im Zug darauf. Die anderen rücken auf. Fällt er, nimmt der Nächste den Wimpel und braucht einen Zug zum Ankündigen. Warum: „folgt dem Vordersten" wird so zu einer Regel, die man sehen und nutzen kann. Daraus entsteht ein Rhythmus aus Ausweichen und Zuschlagen.
- **Der Drängler** kündigt die ganze Linie bis zur Wand an, sobald er freie Sicht hat, und läuft bis an ihr Ende. Vor Figuren bleibt er stehen. Danach ist er einen Zug erschöpft. Wer mit dem Rücken zur Wand steht und zur Seite tritt, hat ihn direkt neben sich.
- **Keine Sackgassen, keine einspurigen Gänge.** Jedes freie Feld hat einen freien Nachbarn links oder rechts und einen oben oder unten. Warum: Die erste Fassung der Wagen hatte Sackgassen. Dort ließ sich ein angekündigter Angriff nicht mehr verlassen, das verstößt gegen den Fahrplan. Aufgefallen ist es an einem Bot, der in einer Ecke drei Herzen verlor. Jetzt prüfen `tests/wagen.test.js` und der Fuzz-Test die Regel.
- **Einkesseln bleibt möglich.** Versperren andere Figuren alle Auswege, gibt es keinen sicheren Schritt. Warum: Eine Garantie auch dagegen würde das Verstecken in Ecken unbesiegbar machen. Wer sich umstellen lässt, hat das kommen sehen.
- **Kein Heilen in Etappe 1.** Fünf Herzen müssen für fünf Wagen reichen. Der Speisewagen kommt in Etappe 2.
- **Fünf Wagen:** Sitzwagen (1 langsamer Pendler), Fahrradabteil (3 Pendler), Großraumwagen (Reisegruppe zu dritt, 2 Pendler), Liegewagen (Drängler, 3 Pendler), Gepäckwagen (Drängler, Reisegruppe zu dritt, 2 Pendler). Jeder Gegner hat zwei bis drei mögliche Startplätze.
- **Halt nach Wagen 5.** Die Karte zeigt „Halt", die Ankunftszeit und die übrigen Herzen. Der richtige Halt mit Schaffner kommt in Etappe 2.

### Schwierigkeit

- **Der ausgewogene Bot macht Fehler.** Für die Abnahme ist jeder zwölfte Zug zufällig. Warum: Fehlerfrei spielt er besser als ein Mensch in den ersten Fahrten. Mit dieser Unachtsamkeit erreicht er den Halt in 48 % der Fahrten, fehlerfrei in 78 %. Wagen 1 und 2 schafft er immer.
- **Kämpfer 0 %, Ausweicher 55 %.** Der Kämpfer läuft auf jeden zu und schlägt auch auf rotem Feld. Das kostet etwa ein Herz je Pendler und reicht ohne Heilung nicht. Der Fahrplan verlangt erst ab Etappe 3, dass alle drei Stile den Halt erreichen.
- **Wagenlänge.** Der Bot braucht 12 bis 30 Züge je Wagen. Wagen 1 und 2 dauern für Geübte vermutlich weniger als 30 Sekunden. Das lasse ich so, bis die Rückmeldung des Auftraggebers da ist.

### Anzeige und Bedienung

- **Eingaben schneiden Bewegungen ab, statt zu warten.** Kommt eine Eingabe, während noch etwas läuft, springt das Bild ans Ende, und der neue Zug beginnt sofort. Warum: Das erfüllt „Eingaben werden gepuffert" besser als eine Warteschlange, weil niemand je auf das Spiel wartet. Treffer, Aufblitzen und Wackeln laufen trotzdem zu Ende.
- **Nachwirkungen dürfen länger als 150 ms dauern,** wenn sie nichts aufhalten: das verlorene Herz (0,3 s) und der Ring um das neue Ruhe-Licht (0,4 s). Jede Bewegung vor der nächsten möglichen Eingabe bleibt bei höchstens 150 ms.
- **Wischen löst nach 18 Pixeln aus,** nicht erst beim Loslassen. Tippen aufs eigene Feld wartet.
- **Die Bahnhofsuhr ist der Knopf zum Warten.** Jeder Zug rückt den Minutenzeiger eine Minute weiter, Abfahrt ist 23:41. Die Karte am Halt nennt die Ankunftszeit. Warum: ein Symbol aus dem Bahnalltag, das etwas tut, und ein Detail aus genau dieser Fahrt.
- **Drei Hinweise:** „Wischen" (am Rechner „Pfeiltasten"), „Ausweichen", „Anrempeln". Jeder erscheint nur in seiner Lage und verschwindet für immer, sobald man es einmal getan hat.
- **Eigene Punktmatrix-Schrift** mit 5 mal 7 Punkten, Groß- und Kleinbuchstaben, Umlauten. Warum: Auf jedem Gerät gleich, keine Schriftdatei. Alles Geschriebene im Spiel nutzt sie.
- **Endkarte:** Bahnsteig mit Laterne, Bank und Becher. Nach einem Tod sieht man in der Ferne die Schlusslichter, am Halt steht der Zug mit offener Tür. Die Karte nimmt den Wisch erst 0,4 Sekunden nach dem Tod an, damit ein Wisch aus dem Spiel sie nicht versehentlich schließt.
- **Flusszustand bei voller Ruhe:** Der Dunst verschwindet, die Ränder werden heller, die Lichter kommen im festen Takt (links, rechts, Pause, alle 1,3 Sekunden) und Schritte sind kürzer mit kleinem Hüpfer. Dazu ein leiser Schienenstoß.
- **Rot hat Winkel.** In den Feldern von Drängler und Reisegruppe zeigt ein kleiner Winkel die Laufrichtung. Das Feld des Pendlers hat keinen.
- **Ton ist an, aber leise.** Unten rechts sitzt ein Lautsprecher zum Abschalten, die Wahl wird gemerkt.
- **Reduzierte Bewegung:** kein Wackeln, kein Schwenk beim Wagenwechsel, kein Pulsieren, keine Gesten, langsame Lichter.
- **Gemerkt wird wenig:** welche Hinweise gelernt sind und ob der Ton an ist. Eine laufende Fahrt wird nicht gesichert.
- **`#seed=Zahl` an der Adresse** stellt eine Fahrt nach. Nur dann lässt sich der Zustand von außen ablesen. Das brauchen die Prüfwerkzeuge.
- **`werkzeug/` im Repo.** Drei kleine Skripte für die Selbstkontrolle im Browser. Sie brauchen Playwright aus der Cloud-Umgebung und sind kein Teil des Spiels.

### Nicht geprüft

- Kein echtes Handy. Geprüft wurde in Chromium mit nachgestellter Berührung bei 390×700 und 360×600. Safari auf dem iPhone ist ungetestet.
- Der Ton wurde nicht angehört. Geprüft ist nur, dass er ohne Fehler läuft.
- Ob es Spaß macht, kann kein Test sagen.

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
