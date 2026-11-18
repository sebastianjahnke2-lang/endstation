# Endstation (Arbeitstitel)

Taktikspiel im Nachtzug für das Handy im Hochformat. Ausgeliefert wird eine einzige `index.html`.

- Vollständige Vision: `docs/VISION.md`
- Technik und Etappen: `docs/FAHRPLAN.md`
- Eigene Detailentscheidungen: `docs/ENTSCHEIDUNGEN.md`
- Ideen außerhalb des Fahrplans: `docs/IDEEN.md`

## Zu Beginn jeder Sitzung
1. Diese Datei und `docs/FAHRPLAN.md` lesen.
2. Beim Etappenstand weitermachen. Gebaut wird nur die aktuelle Etappe.

## Etappenstand
- Etappe 0, Wissen ins Repo: **fertig**.
- Etappe 1, Der Kern muss allein Spaß machen: **als Nächstes**, noch nicht begonnen.
- Etappen 2 bis 5: offen. Sie sind Fahrplan, kein Auftrag.

Bisher gibt es keinen Spielcode. `index.html` zeigt nur eine Anzeige mit „Zug wird bereitgestellt".

## Wie wir arbeiten
- Der Auftraggeber ist kein Entwickler und arbeitet am Handy. Claude baut, er testet und gibt Rückmeldung zum Gefühl. Antworten auf Deutsch, kurz, ohne Fachsprache.
- Immer nur die aktuelle Etappe bauen. Spätere Etappen sind Fahrplan, kein Auftrag.
- Nach jeder Etappe stoppen und kurz sagen: was neu ist, was er antippen muss, um es zu übernehmen und im Browser zu spielen, und worauf er beim Testen achten soll.
- Detailfragen selbst entscheiden und in `docs/ENTSCHEIDUNGEN.md` notieren. Nur fragen, wenn eine Entscheidung den Charakter des Spiels ändert.
- Alle Zahlen sind Startwerte. Texte im Spiel sind Deutsch.

## Nicht tun
- Keine Frameworks, Bibliotheken, Analyse-Skripte oder Netzwerkzugriffe.
- Keine Funktionen, die nicht im Fahrplan stehen. Ideen kommen in `docs/IDEEN.md`.
- Keine Erklärtexte und keine Tutorial-Bildschirme.
- Nichts, was gegen die harten Regeln der Vision verstößt.

## Kernsatz
Ein Taktikspiel, in dem Gegner verschwinden, sobald man sie versteht, und ihre Stärke dalassen.

## Leitsatz
Wo du verstanden hast, wird die Fahrt leichter und schöner. Wo du noch kämpfst, bleibt sie ein Spiel.

## Bauprinzipien
- Erst Handwerk, dann Seele: Der Kern muss ohne jede Symbolik Spaß machen.
- Streichen vor Hinzufügen: Was dem Kernsatz nicht dient, kommt nicht hinein.
- Reibung ist ein Fehler: Jeder Bildschirm, den man wegtippen muss, braucht einen Grund.
- Eine neue Idee ist nur gut, wenn sie mehrere Probleme zugleich löst.
- Lieber eigen als gefällig: Kanten bleiben drin, nichts wird abgefedert.
- Keine Mechanik ohne Test.

## Harte Regeln
- Nie erklären. Im Spiel stehen keine Wörter wie Gesetz, Macht, Dimension, Aufstieg, Karma oder Selbstliebe und keine Begriffe aus Religion oder Esoterik.
- Keine Markennamen, keine Namen oder Zitate echter Künstler und Werke.
- Wahrheit ohne Urteil: Das Spiel zeigt, was ein Verhalten auslöst, und bewertet es nie. Es gibt keine Wörter wie gut, böse oder Energie. Wille ist keine Grausamkeit.
- Beobachtung statt Urteil. Folgen statt Tadel, auch bei Flucht, Schutz und Aufbrechen.
- Persönlich statt allgemein: Jeder Text an den Spieler nennt ein konkretes Detail aus genau seiner Fahrt.
- Im Safe Space passiert nie etwas Schlimmes.
- Echte Angriffe sind immer angekündigt. Verwirrung trifft nie die Steuerung, außer im freiwilligen Ort.
- Keine Bindungstricks: keine täglichen Serien, keine künstliche Verknappung, kein käuflicher Fortschritt.
- Kein endloser Sog: Jede Fahrt hat ein Ende, und das Spiel startet nie von selbst die nächste.
- Alltagskämpfe ja, Krankheit nein. Traum statt Wahnsinn.
- Keine Versprechen über Wirkung im echten Leben. Die Endstation bleibt deutungsoffen.
- Keine Fahrt endet dunkel: Auf jeden schweren Moment folgt ein warmes Bild.

Der Ton (symbolisch, real, trocken komisch, leise melancholisch, nie kitschig) steht ausführlich in `docs/VISION.md`.

## Architektur

```
index.html        gebautes Spiel, eingecheckt, wird von GitHub Pages ausgeliefert
build.js          hängt src/ zu einer Datei zusammen, ohne Abhängigkeiten
src/
  vorlage.html    Seitengerüst mit den Marken /*__CSS__*/ und /*__JS__*/
  style.css       nur Seitenrahmen, alles Sichtbare zeichnet der Canvas
  texte.js        alle sichtbaren Texte, einzige Quelle
  main.js         Einstieg
tests/
  build.test.js   index.html aktuell, eine Datei, kein Netz, Build-Regeln
  ton.test.js     verbotene Wörter in den Texten
.claude/skills/   neue-szene, balance-pruefen, ton-check
```

Geplant ab Etappe 1 (noch nicht vorhanden, Namen sind Vorschlag):

```
src/kern/         reines Logikmodul ohne DOM: Zustand, act(aktion) -> Ereignisliste, Zufall mit Seed
src/anzeige/      Canvas-Renderer, spielt Ereignislisten ab
src/eingabe.js    Wischen, Tippen, Tastatur, Eingabepuffer
src/speicher.js   localStorage, immer in try/catch
src/ton.js        erzeugte Klänge über Web Audio
tests/            Fuzz-Test, drei Bots (Kämpfer, Ausweicher, Ausgewogener), Balance-Bericht
```

Feste Regeln der Architektur:
- `src/kern/` kennt weder `window` noch `document`. Tests laden es direkt in Node.
- Der Kern ändert den Zustand nur in `act(aktion)` und gibt eine Ereignisliste zurück. Der Renderer entscheidet nie über Spielregeln.
- Zufall kommt nur aus dem Seed-Generator, nie aus `Math.random()`.
- Jeder sichtbare Text steht in `src/texte.js`, als Zeichenkette mit Platzhaltern wie `{n}`.
- Fachbegriffe im Code heißen wie im Fahrplan (Wagen, Ruhe, Lochung, Pendler).

Regeln des Build-Skripts (Verstöße brechen den Build ab):
- Nur benannte Importe aus relativen Pfaden: `import { a, b } from './x.js';`
- Kein `as`, kein `export default`, kein `export { ... }`.
- Namen auf oberster Ebene sind im ganzen Projekt eindeutig, weil alles in einer Funktion landet.
- Keine Kreisbezüge zwischen Modulen.

## Befehle

```
npm run build     baut index.html aus src/
npm test          alle Tests (Node-eigener Testläufer, keine Pakete)
```

`index.html` nie von Hand ändern. Nach jeder Änderung in `src/` bauen, sonst schlägt `npm test` fehl.

## Abschluss einer Etappe
1. `npm run build` und `npm test`, alles grün.
2. Selbstkontrolle im Browser bei 390×700 und 360×600: Screenshots ansehen, Wischen, Tippen und Tastatur durchspielen. Playwright ist in der Cloud-Umgebung vorinstalliert und gehört nicht ins Repo.
3. Skill `ton-check` über alle neuen Texte und Symbole, ab Etappe 1 Skill `balance-pruefen`.
4. Etappenstand hier und in `docs/FAHRPLAN.md` aktualisieren, Entscheidungen notieren.
5. Committen und pushen. Pull Request nur, wenn der Auftraggeber es sagt.
6. Dem Auftraggeber melden: was neu ist, was er antippen muss, worauf er achten soll.

## Veröffentlichung
GitHub Pages liefert `index.html` aus dem Zweig `main`, Ordner `/ (root)`. Spielbar ist also immer der Stand, der in `main` übernommen wurde. `.nojekyll` sorgt dafür, dass GitHub die Dateien unverändert ausliefert.
