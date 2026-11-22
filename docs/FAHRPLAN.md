# Fahrplan

Gebaut wird immer nur die aktuelle Etappe. Alles danach ist Fahrplan, kein Auftrag.

## Status

| Etappe | Inhalt | Status |
|---|---|---|
| 0 | Wissen ins Repo | fertig |
| 1 | Der Kern muss allein Spaß machen | **gebaut, wartet auf Rückmeldung** |
| 2 | Fahrkarte, Autorität, Speisewagen | **gebaut, wartet auf Rückmeldung** (19.11., vollständig). Abweichungen und Entscheidungen in `docs/ENTSCHEIDUNGEN.md` |
| 3 | Regie und Spiegel | offen |
| 4 | Das Surreale | offen |
| 5 | Veröffentlichen | offen |

Die Abschnitte ab hier sind unverändert aus der Übergabe übernommen. Der Abschnitt „iPhone" kam während Etappe 1 dazu und hat Vorrang vor allem anderen.

## Technik
- Ergebnis ist eine einzige `index.html` mit CSS und JS inline, ohne externe Assets. Alles wird per Canvas gezeichnet. Entwickelt wird in mehreren Dateien mit kleinem Build-Skript.
- Handy im Hochformat, ein Daumen: Wischen bewegt oder greift an, Tippen auf ein Nachbarfeld als Ersatz, Buttons mindestens 48 px, kein Scrollen. Das Spiel muss bei 360×600 noch passen. Am Desktop Pfeiltasten oder WASD, Leertaste wartet.
- Sofort drin: Vom Öffnen bis zum ersten Zug braucht es höchstens einen Tipp und keine drei Sekunden.
- Rundenbasiert: Ohne Eingabe passiert nichts.
- Spielkern als reines Logikmodul ohne DOM: `act(aktion)` gibt eine Ereignisliste zurück, der Renderer spielt sie ab. Zufall mit Seed, damit Fahrten wiederholbar sind.
- Fortschritt und Fahrkarte werden in localStorage gesichert, immer in try/catch. Das Spiel läuft auch ohne.
- Ton ist Zugabe: wenige erzeugte Klänge über Web Audio, keine Dateien. Das Spiel funktioniert vollständig stumm.
- Tests in Node: Fuzz-Test mit Zufallsaktionen (keine Fehler, keine überlappenden Figuren, Tür immer erreichbar) und drei Bots mit Spielstil (Kämpfer, Ausweicher, Ausgewogener).
- Selbstkontrolle: Nach jeder Etappe das Spiel im Browser bei 390×700 und 360×600 öffnen, Screenshots ansehen und Wischen, Tippen und Tastatur durchspielen.

## iPhone (hat Vorrang)
- Zielgerät ist das iPhone mit Safari. Alles muss dort ohne Zusatz laufen.
- Notch und Home-Balken über Safe-Area-Abstände freihalten. Keine Bedienelemente am unteren Rand, und keine Geste muss am Bildschirmrand beginnen.
- Dynamische Viewport-Höhe mit Fallback, damit die Safari-Leisten nichts abschneiden. Kein Zoom bei Doppeltipp, kein Gummiband-Scrollen, keine Textauswahl beim Wischen.
- Ton startet erst nach der ersten Berührung. Nicht auf Vibration verlassen.
- Speicherstand: Safari kann lokale Daten nach einigen Tagen ohne Besuch löschen. Das Spiel muss einen leeren Speicher jederzeit verkraften. In Etappe 5 kommen Icon und Vollbild-Angaben für den Home-Bildschirm dazu, und am Halt erscheint einmalig ein kurzer Hinweis, dass der Fortschritt als Home-Bildschirm-App sicher bleibt.
- Selbstkontrolle zusätzlich mit der WebKit-Engine bei 390×844, falls verfügbar.

## Etappe 1: Der Kern muss allein Spaß machen
**Regeln**
- Raster 5×8, Start unten in der Mitte, Tür oben in der Mitte. Sie öffnet sich, wenn alle Gegner besiegt sind.
- Der Spieler hat 5 Herzen und macht 1 Schaden. Aktionen: bewegen, angreifen (in einen Gegner laufen), warten. Ungültige Aktionen kosten keinen Zug.
- Ablauf: erst der Spieler, dann die Gegner. Jeder Gegnerangriff wird einen Zug vorher als rote Felder angekündigt. Kein Angriff ohne Ankündigung, jedes Muster ist mit einem Schritt verlassbar.
- Stirbt ein Gegner, verfällt sein angekündigter Angriff. Gegner blockieren einander und treffen sich nicht gegenseitig.
- Ruhe (0 bis 3): +1, wenn man ein rotes Feld verlässt, bevor der Angriff trifft. Ein Treffer setzt sie auf 0.
- Drei Gegner: Pendler (2 HP, läuft heran, markiert dein Feld), Reisegruppe (je 1 HP, 2 Felder pro Zug, tritt im Pulk auf und folgt dem Vordersten), Drängler (3 HP, markiert eine ganze Linie, stürmt hindurch, ist danach 1 Zug erschöpft).
- Fünf Wagen mit eigenen Hindernissen, zufällig gespiegelt, alle freien Felder erreichbar. Ein Wagen dauert 30 bis 90 Sekunden. Die Schwierigkeit steigt, höchstens sechs Gegner gleichzeitig. Tod beendet die Fahrt.

**Fluss**
- Wagenwechsel ohne Unterbrechung: Man wischt nach oben durch die Tür, und der nächste Wagen schiebt sich herein. Kein Ladebild, kein Zwischenbildschirm.
- Volle Ruhe ist der Flusszustand: Das Bild wird klarer, die Lichter am Fenster ziehen im Takt der Schienen, und Bewegungen wirken leichter. Er hält, bis man getroffen wird.
- Neustart mit einem Wisch: Nach dem Tod steht eine Endkarte, die man sofort nach oben wegwischen kann. Sie zeigt eine wahre Zeile, was gefehlt hat, etwa „Noch zwei Wagen bis zum Halt".
- Nichts hält auf: keine Bestätigungsfragen, keine Animation über 150 ms, alles Überspringbare ist überspringbar.

**Einstieg ohne Erklärung**
- Wagen 1 ist die Erklärung: ein einzelner langsamer Pendler. Dazu höchstens drei Hinweise aus wenigen Worten, jeweils erst, wenn die Situation eintritt.

**Anzeige und Gefühl**
- Dunkler Nachtzug, Figuren ohne Gesicht mit kleinen menschlichen Gesten im Stand, Lichter ziehen am Fenster vorbei.
- Kopfzeile als bernsteinfarbene Punktmatrix-Zuganzeige mit Wagennummer und Wagenname. Darunter Herzen und Ruhe.
- Rote Felder pulsieren. Über der Figur steht ein Ausrufezeichen, wenn ihr Feld markiert ist. Über Gegnern stehen ihre HP als Punkte.
- Bewegungen dauern 100 bis 150 ms, Eingaben werden gepuffert, Treffer lassen das Bild kurz wackeln. Bei reduzierter Bewegung entfällt das Wackeln.

**Abnahme**
- Fuzz-Test grün, der ausgewogene Bot schafft etwa die Hälfte der Fahrten, Wagen 1 und 2 fast immer.
- Ich prüfe: Versteht man es ohne Erklärung? Ist jeder Tod nachvollziehbar? Komme ich in einen Fluss? Will ich noch eine Fahrt?

## Etappe 2: Fahrkarte, Autorität, Speisewagen
- Fahrkarte: zeigt sechs Prüfungs-Symbole aus dem Bahnalltag, dazu Platz für Sonder-Lochungen. Eine Lochung ist hell oder dunkel.
- Angebote: Im Wagen leuchtet ein Symbol auf einem Feld. Drauftreten heißt Prüfung annehmen. Prüfungen sind Alltagsvorsätze, als Symbol mit höchstens drei Worten: „Nicht aufregen" (kein Angriff), „Erst aussteigen lassen" (drei Züge stillstehen), „Ohne Rempeln" (ohne Treffer). Erfüllt ergibt eine helle Lochung. Vorbeigehen kostet nichts.
- Dunkle Lochungen entstehen durch einen Tod, ab Etappe 3 auch durch ein starkes Muster. Sie werden hell, wenn man es einmal anders macht.
- Jede Tür lässt sich aufbrechen: dreimal dagegenlaufen, kostet 1 Herz.
- Autoritätswagen: Der Kontrolleur blockiert die Tür und sagt „Fahrkarte, bitte." Brechen: ihn bekämpfen (5 HP, 2 Schaden) oder die Tür aufbrechen. Durchschauen: Er prüft nur, wer sich bewegt. Wer drei Züge ruhig vor ihm steht, wird durchgewinkt.
- Stärken aus Schatten: Wer einen Gegnertyp versteht, bekommt dauerhaft dessen Stärke. Drängler (dreimal ausweichen, ohne ihn zu schlagen) gibt Sprint: für 1 Ruhe bis zu 2 Felder in gerader Linie, Gegner auf dem Weg nehmen Schaden. Reisegruppe (einen Wagen mit 1 Herz überstehen) gibt Rückhalt: einmal pro Fahrt übersteht man einen tödlichen Treffer. Pendler (dreimal neben ihm warten) gibt Ruhe fürs Warten.
- Präsenz: Bei voller Ruhe zögert der nächste Gegner einen Zug.
- Speisewagen: der Safe Space nach dem Autoritätswagen. Warmes Licht, Blick nach draußen, heilt 2 Herzen, nie Gefahr. Verstandene Gegner sitzen dort als Fahrgäste und haben ein Gesicht.
- Gönnen: Im Speisewagen kann man ein Herz abgeben. Meistens kommt nichts zurück, manchmal sitzt später jemand mehr am Tisch.
- Begleiter: Nach einem Tod beginnt die nächste Fahrt im Speisewagen, und er sitzt dort. Wer neben ihn tritt, spricht mit ihm. Wer durchgeht, spielt sofort weiter. Im Gespräch nennt er zuerst, was neu gelungen ist, und fragt dann „Woran lag es?" mit drei Antworten. Das Spiel kennt den Grund, die ehrliche Antwort gibt eine helle Lochung. Auf Wunsch wiederholt er die letzte Szene gefahrlos.
- Halt am Ende: Derselbe Begleiter verlangt als Schaffner drei helle Lochungen, egal welche. Ein bis zwei davon passieren fast von allein. **Geändert am 22.11. durch den Auftraggeber: Halt ohne Sperre. Wer den letzten Wagen schafft, steigt aus, egal wie viele Lochungen er hat. Der Schaffner locht oder nickt. Lochungen bestimmen nur den Rückblick. Verstehen locht: Kontrolleur durchschaut oder Stärke verdient gibt eine helle Lochung.** Danach zeigt die Fahrkarte als Rückblick, wie man gespielt hat: reine Tatsachen mit Ort und Handlung, ohne Adjektiv. Er lässt sich mit einem Tipp überspringen. Warmes Schlussbild mit den Knöpfen „Aussteigen" und „Noch eine Fahrt".
- Ich prüfe: Findet man ohne Hinweis heraus, dass der Kontrolleur Ruhige durchlässt? Fühlt sich der Speisewagen sicher an? Wirkt der Begleiter aufbauend statt belehrend?

## Etappe 3: Regie und Spiegel
- Spielstil mitzählen: Erstschläge, Ausweichen, Warten, Aufbrechen, Fluchten.
- Regie: Jede Szene hat Bedingungen, eine Pause bis zur Wiederholung und einen Vorrang. Gewählt wird beim Wagenwechsel. Fest bleiben Einstieg, Autoritätswagen in der Mitte, Speisewagen danach und der Halt. Die Auslöser reagieren immer gleich, damit man sie durchschauen kann.
- Die Regie hält die Forderung knapp über dem Können: Nach fehlerfreien Wagen kommt etwas mehr Druck, nach schweren etwas weniger.
- Sechs Szenentypen:
  - Kampfwagen
  - Autoritätswagen in drei Formen aus dem Bahnalltag: Kontrolleur („Fahrkarte, bitte"), Ruhebereich („Ruhe, bitte": Jeder Angriff weckt einen Schlafenden, wer ohne Angriff durchkommt, hat ihn durchschaut), Erste Klasse („Nur mit passendem Fahrschein": Ein Steward schickt zurück, wer zögert. Wer ohne Halt in gerader Linie durchgeht, wird nicht angesprochen).
  - Speisewagen
  - Leerer Wagen: nur nach hohem Druck, höchstens einmal pro Fahrt.
  - Spiegelwagen: Ein Echo verhält sich wie der Spieler. Es gibt eine Tür durch den Spiegel und eine daran vorbei.
  - Kraftprobe: großer Kampf mit Balken. Der Balken sinkt durch Treffer oder durch das Durchschauen der Regel. Angriffe kommen in Phasen und sind immer angekündigt. Höchstens einmal pro Fahrt, als Höhepunkt oder wenn das Muster zeigt, dass der Spieler Kämpfe sucht.
- Stimmung lesen: Gegner sind wütend, ängstlich oder müde, erkennbar nur an Haltung und Bewegung. Ein Ängstlicher flieht und greift nur an, wenn man ihn in die Ecke treibt. Eine Alltagsszene dazu: Der Laute im Ruhebereich telefoniert wegen einer schlechten Nachricht, und wer erst hinsieht, erkennt es an der Haltung.
- Wärme und Kälte: Als kalt zählt nur, wer Fliehende schlägt oder den Begleiter über den eigenen Tod anlügt. Der erschöpfte Drängler zählt nicht dazu. Folgen bei Kälte: Gegner ducken sich und weichen aus, im Speisewagen sitzen weniger Fahrgäste, sie rücken ab, das Licht wird kühler. Bei Wärme ist es umgekehrt. Es gibt kein Lob und keinen Tadel, und nichts davon ist endgültig.
- Angebote richten sich nach dem Muster. Ignorierte kehren deutlicher wieder: erst Symbol, dann mit Licht, dann spricht der Begleiter es an.
- Die Figur nimmt die Haltung des Spielstils an (drei Varianten). Am Start wählt man einen Gegenstand (Kopfhörer, Buch oder Thermoskanne), der keine Werte hat und in Ruhemomenten auftaucht. Die Wahl kostet einen Tipp und wird gemerkt.
- Schutz: Nach drei Toden an derselben Stelle bietet der Begleiter Schutz an. Der erste Treffer pro Wagen prallt ab, und der Schutz wird mit jedem geschafften Wagen schwächer. Gleichwertige Lochungen gibt es für Hilfe annehmen, Loslassen und Ohne Netz.
- Option „deutliche Hinweise": zeigt das Muster live an, Standard ist aus.
- Tests: Jede Szene kommt weder nie noch ständig, und jeder der drei Bot-Stile kann den Halt erreichen.
- Ich prüfe: Erkenne ich mich im Rückblick wieder? Passen die Angebote zu meinem Spiel? Fühle ich mich angesprochen, aber nicht vorgeführt?

## Etappe 4: Das Surreale
- Fahrtart am Start: „Direktverbindung" ohne Surreales oder „Nachtzug". Die letzte Wahl ist voreingestellt.
- Funkloch (nur Nachtzug, bei starkem Muster, mindestens 2 Herzen, nie kurz hintereinander): In der Ecke der Anzeige stehen Empfangsbalken, die kurz vorher sinken. Bei „Kein Netz" beginnt das Surreale. Bewegungen ziehen Schlieren, das Raster wogt leicht, es erscheinen Trugbilder. Echte Angriffe bleiben immer angekündigt. Wer sein Muster fortsetzt, verlängert den Wagen. Wer das Gegenteil tut, holt ihn zurück.
- Notbremse: In den ersten drei Zügen im Funkloch wirkt sie nicht, danach ist Flucht möglich. Preis: keine Lochung, im nächsten Wagen zeigt die Anzeige Unsinn und Gegner sind erst nur Umrisse, und dasselbe Funkloch kommt wieder.
- Anker: Eine vorhandene Lochung einmal pro Wagen vorzeigen, dann fallen die Trugbilder ab.
- Am Ende des Funklochs steht die falsche Tür. Sie soll neugierig machen, nicht warnen. Dahinter liegt der Ort: Dort kann man nicht sterben, und die Steuerung kippt (Wischen bewegt den Wagen, oder man steuert sein Echo). Er hat eine eigene Lochung.
- Vorhersagende Anzeige: Sie kündigt den nächsten Zug des Spielers an, aber nur bei hoher Trefferwahrscheinlichkeit.
- Unstimmigkeiten: Auf Wagen 4 folgt Wagen 4, der Fahrplan nennt 25:61 Uhr. Wo man zuletzt gestorben ist, sitzt eine Figur ohne Gesicht.
- Durchsagen in trockenem Bahndeutsch, etwa „Nächster Halt: Vergangenheit. Ein Ausstieg ist nicht möglich."
- Verhältnis: etwa achtzig Prozent gewöhnliche Bahnfahrt, zwanzig Prozent Kippen.
- Kein schnelles Flackern, eine Option für weniger Effekte, prefers-reduced-motion beachten.
- Ich prüfe: Macht die falsche Tür neugierig? Ist das Funkloch seltsam, aber fair?

## Etappe 5: Veröffentlichen
- PWA mit Manifest und Service Worker, damit das Spiel installierbar ist und ohne Netz startet.
- Bestwerte nur gegen sich selbst, mit neutralem Vermerk, ob der Schutz aktiv war.
- Aus dem Abschnitt „iPhone": Icon und Vollbild-Angaben für den Home-Bildschirm, und am Halt einmalig ein kurzer Hinweis, dass der Fortschritt als Home-Bildschirm-App sicher bleibt.
