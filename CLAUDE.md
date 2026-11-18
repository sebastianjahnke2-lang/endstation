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
- Etappe 1, Der Kern muss allein Spaß machen: **gebaut, vom Auftraggeber noch nicht abgenommen.** Seine Antwort auf die vier Prüffragen im Fahrplan steht aus.
- Etappe 2, Fahrkarte, Autorität, Speisewagen: **freigegeben, noch nicht begonnen.** Der Auftraggeber hat am 18.11. „Weitermachen" gesagt. Es gibt dafür noch keinen Code und keinen Entwurf.
- Etappen 3 bis 5: offen. Sie sind Fahrplan, kein Auftrag.
- Prototyp „Der freie Platz" (außerhalb der Etappen, Auftrag vom 18.11.): **gebaut, wartet auf den Spieltest.** Auftrag in `docs/PROTOTYP-freier-platz.md`, Spieltestplan in `docs/SPIELTEST-freier-platz.md`. Offene Widersprüche zu Vision und Fahrplan stehen in `docs/ENTSCHEIDUNGEN.md` unter „Offen" und sind Sache des Auftraggebers.

Stand der Zahlen (500 Fahrten je Bot, `npm run balance`): Der ausgewogene Bot erreicht den Halt in 48 % der Fahrten, wenn jeder zwölfte Zug zufällig ist, und in 78 % ohne Fehler. Wagen 1 und 2 schafft er immer. Der Ausweicher kommt auf 55 %, der Kämpfer auf 0 %.

## Wie wir arbeiten
- Der Auftraggeber ist kein Entwickler und arbeitet am Handy. Claude baut, er testet und gibt Rückmeldung zum Gefühl. Antworten auf Deutsch, kurz, ohne Fachsprache.
- Immer nur die aktuelle Etappe bauen. Spätere Etappen sind Fahrplan, kein Auftrag.
- Nach jeder Etappe stoppen und kurz sagen: was neu ist, was er antippen muss, um es zu übernehmen und im Browser zu spielen, und worauf er beim Testen achten soll.
- Detailfragen selbst entscheiden und in `docs/ENTSCHEIDUNGEN.md` notieren. Nur fragen, wenn eine Entscheidung den Charakter des Spiels ändert.
- Alle Zahlen sind Startwerte. Texte im Spiel sind Deutsch.
- Sparsam mit seinem Nutzungslimit umgehen: Am 18.11. hat eine Entwurfsrunde mit sechs Agenten das Limit aufgebraucht und nichts geliefert. In kleinen Schritten arbeiten, nach jedem Schritt mit grünen Tests committen und pushen. Große Läufe mit mehreren Agenten vorher ankündigen.

## Nicht tun
- Keine Frameworks, Bibliotheken, Analyse-Skripte oder Netzwerkzugriffe.
- Keine Funktionen, die nicht im Fahrplan stehen. Ideen kommen in `docs/IDEEN.md`.
- Keine Erklärtexte und keine Tutorial-Bildschirme.
- Nichts, was gegen die harten Regeln der Vision verstößt.

## iPhone hat Vorrang
Zielgerät ist das iPhone mit Safari. Der volle Wortlaut steht im Fahrplan. Für jede Änderung gilt:
- Notch und Home-Balken bleiben frei. Das erledigt `src/style.css` mit Safe-Area-Abständen, der Canvas füllt nur den sicheren Bereich.
- Nichts zum Antippen am unteren Rand, keine Geste beginnt am Bildschirmrand. Uhr und Lautsprecher sitzen oben. `tests/layout.test.js` prüft das.
- Höhe mit `100dvh` und `100%` als Fallback, nie `100vh`. Kein Zoom, kein Scrollen, keine Textauswahl.
- Ton erst nach der ersten Berührung, keine Vibration.
- Der Speicher kann jederzeit leer sein. `ladeStand()` liefert immer einen vollständigen Stand. Neues im Speicher braucht einen Anfangswert in `src/speicher.js` und einen Test.
- Nur Sprachmittel, die Safari seit iOS 13 kennt. Keine Schrift außer der eigenen Punktmatrix.

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
index.html          gebautes Spiel, eingecheckt, wird von GitHub Pages ausgeliefert
build.js            hängt src/ zu einer Datei zusammen, ohne Abhängigkeiten
src/
  vorlage.html      Seitengerüst mit den Marken /*__CSS__*/ und /*__JS__*/
  style.css         nur Seitenrahmen, alles Sichtbare zeichnet der Canvas
  texte.js          alle sichtbaren Texte, einzige Quelle
  main.js           Einstieg: verbindet Kern, Anzeige, Eingabe, Ton, Speicher
  eingabe.js        Wischen, Tippen, Tastatur
  speicher.js       localStorage, immer in try/catch, immer ein vollständiger Stand
  ton.js            erzeugte Klänge über Web Audio
  kern/             reine Logik ohne DOM
    feld.js         Raster 5x8, Richtungen, Breitensuche
    zufall.js       Zufall mit Seed, Stand liegt im Zustand
    wagen.js        die fünf Wagen: Plan, Gegner, Bauregel
    lage.js         Fragen an den Zustand (frei, markiert, Vorderster)
    gegner.js       Verhalten von Pendler, Reisegruppe, Drängler
    spiel.js        erzeugeSpiel(seed) -> { zustand, act(aktion) }
  anzeige/          Canvas, spielt Ereignisse ab
    anzeige.js      Ablauf, Bewegungen, Flusszustand, Hinweise
    layout.js       Bildschirmaufteilung ab 360 x 600, nichts am unteren Rand
    kulisse.js      Wagen, Tür, Lichter, Herzen, Ruhe, Uhr
    figuren.js      Figuren und Hindernisse
    karte.js        Endkarte mit Bahnsteig
    matrix.js       Punktmatrix-Schrift
    formen.js       Farben und Zeichenhilfen
tests/
  regeln.test.js    jede Regel aus Etappe 1 als kleine Szene
  fuzz.test.js      Zufallsfahrten, Regelprüfung nach jeder Eingabe
  wagen.test.js     jede Auslosung jedes Wagens
  bots.test.js      Abnahme der Schwierigkeit
  ton.test.js       verbotene Wörter, Schrift, Textlängen
  layout.test.js    passt auf jedes Handy, nichts zum Antippen am unteren Rand
  speicher.test.js  leerer, gesperrter und kaputter Speicher
  build.test.js     index.html aktuell, eine Datei, kein Netz, iPhone-Vorgaben, Build-Regeln
  bots.js           die drei Bots und fahre()
  balance.js        Balance-Bericht
werkzeug/           Selbstkontrolle im Browser, kein Teil des Spiels
prototyp/freier-platz/   ein einzelner Wagen als eigene Seite, getrennt vom Hauptspiel
  index.html        gebauter Prototyp, eingecheckt
  build.js          baut ihn mit buendle() aus dem Build-Skript des Hauptspiels
  src/kern/         Regeln ohne DOM: abteil.js, licht.js, schaffner.js, fahrt.js
  src/anzeige/      masse.js (Aufteilung), gestalten.js, abteilbild.js, buehne.js (Ablauf)
  src/              texte.js, speicher.js, protokoll.js, ton.js, main.js
  tests/            Regeln, Abläufe, vollständige Suche, Aufteilung, Speicher, Texte, Build
  werkzeug/         fotos.mjs, szene.mjs: Selbstkontrolle im Browser
.claude/skills/     neue-szene, balance-pruefen, ton-check
```

So läuft ein Zug (`src/kern/spiel.js`):
1. Phase 0: Der Spieler bewegt sich, schlägt oder wartet. Ungültiges kostet keinen Zug.
2. Phase 1: Alle angekündigten Angriffe treffen ein. Höchstens ein Herz je Zug.
3. Phase 2: Gegner bewegen sich oder kündigen an. Ein Gegner tut je Zug nur eines von beiden: Wer herantritt, überlässt dem Spieler den ersten Schlag.

Feste Regeln der Architektur:
- `src/kern/` kennt weder `window` noch `document`. Tests laden es direkt in Node.
- Der Kern ändert den Zustand nur in `act(aktion)` und gibt eine Ereignisliste zurück. Die Anzeige entscheidet nie über Spielregeln.
- Zufall im Kern kommt nur aus `zufall.js`, nie aus `Math.random()`. Gegner handeln ganz ohne Zufall.
- Jeder sichtbare Text steht in `src/texte.js`, als Zeichenkette mit Platzhaltern wie `{n}`.
- Fachbegriffe im Code heißen wie im Fahrplan (Wagen, Ruhe, Lochung, Pendler).
- Bauregel für Wagen: Jedes freie Feld hat einen freien Nachbarn links oder rechts und einen oben oder unten. Keine Sackgassen, keine einspurigen Gänge. Nur so lässt sich jede Ankündigung mit einem Schritt verlassen.

Regeln des Build-Skripts (Verstöße brechen den Build ab):
- Nur benannte Importe aus relativen Pfaden: `import { a, b } from './x.js';`
- Kein `as`, kein `export default`, kein `export { ... }`.
- Namen auf oberster Ebene sind im ganzen Projekt eindeutig, weil alles in einer Funktion landet.
- Keine Kreisbezüge zwischen Modulen.

## Befehle

```
npm run build                          baut index.html aus src/ und den Prototyp
npm test                               alle Tests, auch die des Prototyps (Node-eigener Testläufer, keine Pakete)
npm run balance                        Bericht: drei Bots, 500 Fahrten je Bot
node werkzeug/spur.mjs <bot> <seed>    eine Bot-Fahrt Zug für Zug als Textbild
node werkzeug/bedienung.mjs 390x844    Wischen, Tippen, Tasten, Endkarte, Speicher im Browser
node werkzeug/bedienung.mjs 390x844 47,34    dasselbe mit Notch und Home-Balken
node werkzeug/schau.mjs <bot> <seed> <breite> <hoehe>    Fahrt im Browser mit Bildern
node prototyp/freier-platz/werkzeug/fotos.mjs 390x844    Prototyp: Hauptweg im Browser mit Bildern
node prototyp/freier-platz/werkzeug/szene.mjs 390x844 "W,W,W,W,T,A"    Prototyp: beliebige Eingabefolge mit Bildern
```

`index.html` nie von Hand ändern. Nach jeder Änderung in `src/` bauen, sonst schlägt `npm test` fehl.
Mit `#seed=Zahl` an der Adresse verläuft eine Fahrt immer gleich.

## Abschluss einer Etappe
1. `npm run build` und `npm test`, alles grün.
2. Selbstkontrolle im Browser: `node werkzeug/bedienung.mjs` bei 390x844 (auch mit `47,34`), 390x664, 375x548, 360x600 und 390x700, dazu `node werkzeug/schau.mjs`, dann die Bilder ansehen. Die Werkzeuge nehmen WebKit, wenn es installiert ist, sonst Chromium mit iPhone-Profil. Welche Engine lief, steht in der Ausgabe und gehört in den Bericht. Playwright ist in der Cloud-Umgebung vorinstalliert und gehört nicht ins Repo.
3. Skill `ton-check` über alle neuen Texte und Symbole, Skill `balance-pruefen` nach jeder Änderung an Zahlen.
4. Etappenstand hier und in `docs/FAHRPLAN.md` aktualisieren, Entscheidungen notieren.
5. Committen und pushen. Pull Request nur, wenn der Auftraggeber es sagt.
6. Dem Auftraggeber melden: was neu ist, was er antippen muss, worauf er achten soll.

## Veröffentlichung
GitHub Pages liefert `index.html` aus dem Zweig `main`, Ordner `/ (root)`. Spielbar ist also immer der Stand, der in `main` übernommen wurde. Der Prototyp liegt dann unter derselben Adresse mit `prototyp/freier-platz/` dahinter. `.nojekyll` sorgt dafür, dass GitHub die Dateien unverändert ausliefert.
