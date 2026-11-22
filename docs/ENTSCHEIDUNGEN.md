# Entscheidungen

Detailfragen, die Claude selbst entschieden hat. Neueste Etappe oben. Jede Zeile: was, und warum.

## Offen

Widersprüche zwischen dem Auftrag für den Prototyp „Der freie Platz" (`docs/auftraege/freier-platz.md`) und den vorhandenen Dokumenten. Der Auftraggeber entscheidet. Bei jedem Punkt steht, was der Prototyp vorläufig tut, weil er irgendetwas tun muss.

### Entschieden am 19.11.

- **Gesichter: ja.** Verstandene Fahrgäste im Speisewagen haben ein Gesicht, wie im Fahrplan. Gegner und alle anderen Figuren bleiben ohne Gesicht, der Prototyp auch.
- **Lob: nein.** Der Begleiter nennt nicht, was gelungen ist. Die Zeile im Fahrplan („nennt zuerst, was neu gelungen ist") gilt nicht mehr.
- **Prototyp und Hauptspiel** (vom Auftraggeber an Claude übergeben): „Der freie Platz" bleibt ein eigener Versuch, bis der Spieltest gelaufen ist. Nennen mindestens drei von fünf Testpersonen den Schatten, wird er in Etappe 3 eine weitere Form des Autoritätswagens, neben Kontrolleur, Ruhebereich und erster Klasse. Damit ist auch „Rätsel oder Taktik" beantwortet: Das Hauptspiel bleibt ein Taktikspiel, Regelwagen wie dieser sind eine Szene darin. Die verbindlichen Vorgaben aus dem Prototyp-Auftrag gelten nur für den Prototyp. Fürs Hauptspiel entscheidet der Auftraggeber Punkt für Punkt, wie bei Gesichtern und Lob.
- **Fahrkarte: wie im Fahrplan** (auf Nachfrage bestätigt): sechs Prüfungs-Symbole, helle und dunkle Lochungen, am Halt drei helle verlangt.

### Betrifft den Prototyp unmittelbar

- **Daumenzone unten oder Knöpfe oben.** Auftrag, Abschnitt 4: unten links die Fahrkarte, unten rechts der Knopf „Warten". Vorhanden (`CLAUDE.md`, „iPhone hat Vorrang"): „Nichts zum Antippen am unteren Rand", Uhr und Lautsprecher sitzen oben. Vorläufig gebaut: Die Daumenzone liegt unten, hält aber denselben Abstand zum Rand, den das Hauptspiel unter seinem untersten Feld freilässt (26 Pixel, dazu der Home-Balken). Der Lautsprecher sitzt wie im Hauptspiel oben rechts. Zu klären am Gerät: Kommt die Leiste von Safari dem Knopf in die Quere?
- **Abspielen der Ereignisse.** Auftrag, Abschnitt 11: Ereignisse nacheinander, je 150 bis 350 ms, dabei höchstens eine Eingabe vormerken. Vorhanden (Fahrplan, Etappe 1): keine Bewegung über 150 ms, Eingaben schneiden Bewegungen ab, niemand wartet auf das Spiel. Vorläufig gebaut: Die Ereignisse laufen nacheinander mit den Zeiten des Auftrags, aber jede neue Eingabe springt sofort ans Ende, wie im Hauptspiel. Nur nach dem Anstoßen verfallen Eingaben für 0,3 Sekunden, damit ein doppelter Wisch nicht versehentlich drängt. Preis: Wer schnell tippt, sieht Übergänge nicht, nur ihr Ergebnis.
- **Ton beim Start.** Auftrag vom 18.11.: aus. Nachtrag vom 21.11. (Abschnitt 18): für den Test mit Musik an. Hauptspiel (eigene Entscheidung aus Etappe 1): an, aber leise. Im Prototyp jetzt an, im Hauptspiel unverändert an. Offen ist, was später für das ganze Spiel gilt.
- **Zwei Sekunden Stille an der Tür.** Abschnitt 18: An der Tür klingt alles aus, dann zwei Sekunden Stille, dann der Abschluss. Vorhanden (Fahrplan, Etappe 1, und „Reibung ist ein Fehler"): niemand wartet auf das Spiel. Gebaut wie im Nachtrag: Das Abschlussbild kommt 3,4 Sekunden nach dem Schritt durch die Tür (1,4 Ausklang, 2 Stille), auch ohne Ton, damit der Vergleich mit und ohne Ton fair bleibt. Zu klären im Spieltest: Fühlt sich die Pause ruhig an oder wie Warten?
- **Musik und harte Regel „Ohne Ton fehlt keine Information".** Die Musik doppelt nur, was zu sehen ist. Einzige Grenze: Das Motiv läuft nach der Lochung leise mit, sichtbar ist die Lochung auf der Fahrkarte. Kein Widerspruch, nur vermerkt.
- **Testprotokoll.** Auftrag, Abschnitt 12: Das Spiel schreibt mit, was in der letzten Fahrt geschah. Vorhanden (`CLAUDE.md`, „Nicht tun"): keine Analyse-Skripte, in Etappe 0 gedeutet als „Skripte, die im Spiel Nutzungsdaten sammeln". Vorläufig gebaut, weil der Spieltest es braucht: Das Protokoll liegt nur auf dem Gerät, wird nirgends hingeschickt und ist nur mit langem Druck auf die Zuganzeige zu sehen.
- **Neustart.** Auftrag: Knopf „Neue Fahrt". Fahrplan, Etappe 1: Endkarte nach oben wegwischen. Etappe 2: Knöpfe „Aussteigen" und „Noch eine Fahrt". Vorläufig: nur der Knopf.
- **Zuganzeige.** Auftrag: „Wagen 7". Hauptspiel: Wagennummer und Wagenname („1 | Sitzwagen"). Vorläufig: wie im Auftrag.
- **Kein Hinweis, kein Pfeil, keine leuchtende Markierung.** Auftrag, Abschnitt 2 (verbindlich). Vorhanden im Hauptspiel: drei Hinweiswörter, pulsierende rote Felder, Ausrufezeichen, Winkel an der offenen Tür, grünes Licht neben der Tür. Fahrplan Etappe 2 und 3: leuchtende Symbole auf Feldern, Option „deutliche Hinweise". Der Prototyp hat nichts davon. Offen ist, was das für das Hauptspiel heißt.
- **Nichts vor den Fenstern.** Auftrag, Abschnitt 2 (verbindlich): keine Landschaft vor den Fenstern. Vorhanden: vorbeiziehende Lichter im Hauptspiel, Bahnsteigbild auf der Endkarte, in der Vision „Regen an der Scheibe" und im Speisewagen „Blick nach draußen". Im Prototyp sind die Fenster dunkel.
- **Schatten.** Auftrag: Schatten gibt es nur als flache, geworfene Schatten im Lampenlicht. Vorhanden: Jede Figur des Hauptspiels hat einen runden Bodenschatten, und der Fahrplan nennt „Stärken aus Schatten". Im Prototyp haben Figuren keinen Bodenschatten.

### Betrifft das Konzept

- **Rätsel oder Taktik.** Entschieden am 19.11., siehe oben. Ursprünglich: Auftrag: „rundenbasiertes Rätselspiel", jeder Wagen enthält eine Regel, die man durchschauen oder brechen kann, ohne Herzen und Gegner. Kernsatz der Vision: „Ein Taktikspiel, in dem Gegner verschwinden, sobald man sie versteht". Offen: das Verhältnis dieses Wagentyps zum bisherigen Kern.
- **Prototyp und Fahrplan.** Entschieden am 19.11., siehe oben. Ursprünglich: `CLAUDE.md`: Gebaut wird nur die aktuelle Etappe, keine Funktionen außerhalb des Fahrplans. Etappe 2 ist freigegeben und nicht begonnen. Der Prototyp steht in keiner Etappe. Offen: ob er Etappe 2 ersetzt, ihr vorausgeht oder daneben steht.
- **Fahrkarte.** Entschieden am 19.11.: wie im Fahrplan. Ursprünglich: Auftrag: schlichtes Papier ohne vorgedruckte Felder und ohne Zahlen, höchstens eine Lochung, sie schaltet nichts frei und wird nirgends gezählt. Fahrplan Etappe 2: sechs Prüfungs-Symbole auf der Karte, helle und dunkle Lochungen, am Halt werden drei helle Lochungen verlangt. Nicht umgesetzt, nur vermerkt.
- **Mitgezählter Spielstil.** Auftrag: kein Punktestand, kein Moralwert, kein Persönlichkeitstest. Fahrplan Etappe 3: Spielstil mitzählen, Wärme und Kälte, Haltung der Figur nach Spielstil. Etappe 5: Bestwerte gegen sich selbst. Nicht umgesetzt, nur vermerkt.
- **Kein Lob.** Entschieden am 19.11., siehe oben.
- **Gesichter.** Entschieden am 19.11., siehe oben. Offen bleibt nur das eigene Gesicht am Ende (Vision), das gehört zum Halt.
- **Schaffner, Kontrolleur, Begleiter.** Im Fahrplan gibt es den Kontrolleur („Fahrkarte, bitte.") und den Begleiter, der am Halt als Schaffner auftritt. Offen: ob der Schaffner aus Wagen 7 eine dieser Figuren ist.
- **Ist „Schatten" als Motiv zu deutlich?** Offen laut Auftrag. Der Spieltest soll es zeigen.

### Prototyp „Kontrolle" (Auftrag vom 21.11., `docs/auftraege/kontrolle.md`)

- **„2 von 3 erwischt" und Leitsatz 7 („nie ein Punktestand").** Die Zeile steht so im Auftrag und ist gebaut. Sie zählt, gespeichert wird sie nirgends.
- **Immer dieselben drei Sitzordnungen.** Entschieden am 21.11.: Beim Neustart werden neue Sitzordnungen ausgelost, innerhalb eines Halts bleibt es ohne Zufall. Siehe unten bei „Prototyp Kontrolle".
- **Wer spielt den Kontrolleur?** Im Hauptspiel ist der Kontrolleur ein Gegner („innerer Kritiker" in der Vision), hier ist er die Spielfigur. Für den Prototyp ohne Belang, fürs Hauptspiel offen.

### Leitsätze und die ersten zehn Minuten (Auftrag vom 21.11., `docs/auftraege/leitsaetze.md`)

Vom Auftraggeber als offen benannt:
- **Kämpfen als gleichwertiger Weg.** Der Kämpfer-Bot erreicht den Halt nie, er stirbt in jeder Fahrt am Kontrolleur in Wagen 3. Die Vision nennt drei gleichwertige Wege (kämpfen, verstehen, aufbrechen).
- **Spielstil mitzählen.** Fahrplan Etappe 3 zählt Erstschläge, Ausweichen, Warten, Aufbrechen, Fluchten und gibt der Figur danach eine Haltung. Vorgabe des Auftraggebers: keine Persönlichkeitstests. Leitsatz 12: nie ein Punktestand.
- **Rätsel oder Taktik.** Entscheidet der Spieltest des Prototyps (siehe „Entschieden am 19.11.").
- **VISION.md unter der Spieladresse.** GitHub Pages liefert den ganzen Zweig aus, `docs/VISION.md` ist unter der Spieladresse lesbar. Idee dazu in `docs/IDEEN.md` („Nur das Spiel ausliefern").

Von Claude beim Prüfen gefunden:
- **Leitsatz 1 und Warten.** „Jede Lage hat einen Preis fürs Abwarten." Beim Kontrolleur ist Stillstehen die Lösung, beim Pendler gibt Warten neben ihm eine Stärke, die Stärke „Ruhe fürs Warten" belohnt es zusätzlich. Dort kostet Abwarten nichts.
- **Leitsatz 8 und Belohnungen ohne Verwendung.** „Jede Belohnung hat sofort eine Verwendung." Rückhalt wirkt nur bei einem tödlichen Treffer und bleibt oft ungenutzt. Fahrkarte: Nach Schritt 4 (Halt ohne Sperre) sind Lochungen nur noch Spur für den Rückblick, ohne Verwendung in der Fahrt.
- **Leitsatz 12 und Bestwerte.** Fahrplan Etappe 5: „Bestwerte nur gegen sich selbst". Leitsatz 12: nie ein Punktestand.
- **Leitsatz 4 und Angebote.** Jeder Kampfwagen bekommt zusätzlich zu seinem Gedanken ein Angebot. Befund in `docs/WAGEN-PRUEFUNG.md`.
- **Schritt 4 und die Entscheidung vom 19.11.** Der Auftraggeber hat angekündigt, „drei helle Lochungen am Halt" aufzuheben. Eingetragen wird es erst mit Schritt 4, nach seiner Rückmeldung.

## Prototyp „Der freie Platz"

Eigene Detailentscheidungen beim Bau. Was der Auftrag offenlässt, steht hier. Was ihm oder den Dokumenten widerspricht, steht oben unter „Offen".

### Prototyp „Kontrolle": die Schicht (21.11., `docs/auftraege/kontrolle-schicht.md`)

Leitsätze des Kontrolle-Auftrags in Klammern.
- **Schicht** (6, 7): Halte ohne Ende, bis drei Fahrgäste ohne Fahrkarte entkommen sind. Nach dem Fang oder Halt hält das Bild kurz an, dann schiebt sich der nächste Halt von selbst herein. Am Ende steht nur der Name der letzten erreichten Station, ein Tipp beginnt sofort die nächste Schicht. Die drei festen Halte und „n von 3 erwischt" sind gestrichen. Der Lernhalt bleibt davor, zählt nicht mit und wartet nach dem Fang auf eine Eingabe.
- **Zwei im Wagen:** Der erste Fang kostet einen Zug, die Zeit läuft weiter. Hält der Zug, steigt jeder Übrige aus und zählt einzeln.
- **Scheinschläfer** (2, 4): sieht aus wie ein Schlafender. Er hebt den Kopf, wenn er höchstens drei Reihen hinter dem Kontrolleur sitzt, also in jedem Zug, in dem der Kontrolleur ihm den Rücken zudreht. Ihn zu kontrollieren kostet einen Zug. In Halten mit Scheinschläfer sitzt immer auch ein echter Schlafender, in anderen manchmal zwei echte: So verrät die Zahl der Schlafenden nichts.
- **Toilettengänger** (1): Die Toilette ist vorn, wo bisher die Tür gezeichnet war. Über der Tür eine kleine Lampe, grün frei, rot besetzt. Er geht, wenn der Kontrolleur genau zwei Reihen **unter** ihm steht (der Auftrag sagt „zwei Reihen entfernt"; von oben käme er am Kontrolleur nicht vorbei zur Toilette). Er kommt zurück, wenn der Kontrolleur „vorbei" ist: umgedreht, mindestens drei Reihen von der Toilette weg und unterhalb seines Platzes. Nach vier Zügen kommt er auch so heraus. Steht der Kontrolleur dann vor der Tür, ist er erwischt. Sein Platz bleibt so lange frei, niemand setzt sich darauf.
- **Reihenfolge** (3): Halt 1 und 2 ein Platzwechsler, Halt 3 ein Scheinschläfer allein, Halt 4 ein Toilettengänger allein, ab Halt 5 gemischt, ab Halt 6 in etwa jedem dritten Halt zwei verschiedene.
- **Zeit** (1): Plan 14 Züge, alle zwei Halte einer weniger, bis 8. Ein Halt darf einen Zug unter Plan liegen. Nie weniger als der kürzeste Weg plus ein Zug, und immer weniger, als blindes Durchkontrollieren der Reihe nach braucht. Deshalb beginnt die Schicht mit 14 statt mehr Zügen: Mit 16 hätte man die ersten Halte oft auch ohne Hinsehen geschafft. Eine Auslosung mit Prüfung dauert etwa 4 Millisekunden.
- **Strecke** (4): In der Zuganzeige links der Zug, der mit jedem Zug vorrückt, dann Gleis, Mast und der Name der nächsten Station. Die Namen sind aus Anfang und Ende zusammengesetzt (etwa „Nebelbach", „Eulenbrück"), höchstens zehn Zeichen, in jeder Schicht dieselbe Reihenfolge, 60 verschiedene, dann von vorn.
- **Linie** unten links, wo sonst nichts ist: sechs Stationen, erreichte hell, die nächste als Ring, über der weitesten je erreichten eine kleine Fahne. Liegt sie weiter, steht die Fahne am rechten Ende. Gespeichert wird nur ihre Nummer, keine Punktzahl. Der Lernhalt erreicht keine Station.
- **Haken** (4): Die Anzeige ist schmaler, rechts daneben drei Haken mit der Mütze des Kontrolleurs. Für jeden Entkommenen verschwindet eine.

### Prototyp „Kontrolle" (21.11.)

- **Raster, Wagenbild, Schaffner mit Zange, Schlafender, Aufteilung und Eingabe** sind aus „Der freie Platz" und dem Hauptspiel geliehen, nicht kopiert. Nur der Körper der Fahrgäste ist nachgebaut, weil er dort nicht exportiert ist und jener Prototyp unangetastet bleibt.
- **Der Gang ist versperrt** (eigene Ergänzung, Leitsatz 1 und 6): Steht der Kontrolleur in seiner Reihe, kommt der Fahrgast ohne Fahrkarte nicht hinaus. Ohne diese Regel ließe er sich nie stellen. So entsteht die Jagd: Er setzt sich zwei Reihen weg, der Abstand wächst, der Spieler baut ihn ab.
- **„Das kostet ihn einen Zug":** Im Zug nach dem Umsetzen bleibt er sitzen, auch wenn der Kontrolleur in die Reihe daneben tritt. Genau das macht ihn fangbar: hinterher, solange er sitzen bleiben muss (Leitsatz 1: Abwarten kostet, wer trödelt, verpasst den Augenblick).
- **Er setzt sich auf den nächsten freien Sitz,** der mindestens zwei Reihen vom Kontrolleur entfernt ist, auf der Seite weg vom Kontrolleur. Am Kontrolleur vorbei kann er nicht.
- **Er zuckt** (eigene Ergänzung, Leitsatz 2): Findet er keinen Platz oder ist der Gang versperrt, steht er halb auf und setzt sich wieder. Sonst gäbe es in Halt 3 kein Verhalten, an dem man ihn erkennt.
- **Seine Farbe wechselt je Halt** und kommt in anderen Halten bei Fahrgästen mit Fahrkarte vor. Sonst würde man ihn ab dem zweiten Halt am Aussehen erkennen statt am Verhalten.
- **Kontrollieren:** zur Seite wischen kontrolliert den Fahrgast am Gang, sonst den am Fenster. Den am Fenster neben einem besetzten Gangplatz erreicht man durch Antippen. Den Schlafenden zu kontrollieren kostet zwei Züge, danach ist er wach.
- **Wer kontrolliert ist,** hat eine kleine Sichel über dem Kopf, damit die Lage in fünf Sekunden lesbar bleibt (Leitsatz 4). Es wird nie eine Fahrkarte gelesen: Man sieht nur Papier.
- **Die Strecke** steht als Punktmatrix in der Zuganzeige: links der Zug, rechts der Bahnhof, dazwischen die Gleise, die übrig sind. Keine Zahl.
- **Das Bild hält an** (Leitsatz 5): 0,65 Sekunden nach dem Fang, 0,7 Sekunden, nachdem er am Halt ausgestiegen ist. In dieser Zeit wird keine Eingabe angenommen. Sonst kürzt jede Eingabe alles ab, was läuft.
- **Nach einem Halt** beginnt der nächste mit der nächsten Eingabe, nicht von selbst. Nach dem dritten kommt die Zeile, ein Tipp beginnt neu.
- **Kein Speicher, kein Testprotokoll:** Der Auftrag fragt nur, ob man von selbst noch einmal startet. Das sieht man beim Zuschauen.
- **Einstieg** (Nachbesserung vom 21.11., `docs/auftraege/kontrolle-einstieg.md`, Leitsatz 2 des Auftrags: gelernt wird im Spiel, das Wichtige ist nicht zu verfehlen):
  - Antippen kontrolliert jeden Fahrgast in der eigenen Reihe. Zur Seite wischen kontrolliert nur noch den Gangplatz, nicht mehr den am Fenster.
  - Der Lernhalt beginnt mit dem Kontrolleur mitten im Gang (Reihe 4), nicht unten. Grund: Mit den normalen Regeln setzt sich der Fahrgast nur zwei Reihen weg. Von unten aus säße er danach mitten im Wagen, nicht in einer Ecke. So springt er beim ersten Schritt nach vorn in die vorderste Reihe, neben einen anderen Fahrgast, und kommt nicht mehr weg. Die Regeln sind dieselben, nur der Start und die Zeit (20 statt 12 Züge) sind anders.
  - „Wischen" steht vor dem ersten Zug unter dem Kontrolleur, „Antippen", solange er in der Reihe des Fahrgasts ohne Fahrkarte steht. Während etwas abläuft, verschwindet das Schild.
  - Der Lernhalt zählt nicht für „n von 3 erwischt". Gemerkt wird er gleich beim Fang, nicht erst mit der nächsten Eingabe, damit er nach dem Schließen nicht wiederkommt. Speicher unter eigenem Schlüssel `endstation.kontrolle.1`, nur das eine Feld.
  - Läuft die Zeit ab, steigt er aus, und mit der nächsten Eingabe beginnt der Lernhalt neu. „Wischen" erscheint dann nicht noch einmal.
- **Auslosen beim Neustart** (Auftrag vom 21.11., Leitsatz 9 der Leitsätze: Wiederspielen zeigt Neues): Der erste Durchgang spielt immer die drei festen Ordnungen, weil sie nacheinander je einen Gedanken zeigen. Jeder Neustart lost drei neue aus: Plätze, Schlafender und Farben. Eine ausgeloste Ordnung wird nur genommen, wenn sie die Prüfung besteht (`prototyp/kontrolle/src/kern/pruefung.js`): lösbar in höchstens 10 von 12 Zügen und mindestens 3, nicht zu schaffen, wenn man von unten nach oben jede Reihe der Reihe nach kontrolliert (links zuerst oder rechts zuerst), zu schaffen für den, der dem folgt, der aufsteht oder zuckt, und alle zu kontrollieren kostet mehr als 12 Züge. Etwa 7 von 10 Auslosungen bestehen, eine Prüfung dauert 0,3 Millisekunden. Der Test prüft 3000 Auslosungen.
- **Der Seed** kommt beim Öffnen aus dem Zufallsgenerator des Browsers und bestimmt nur die Ordnungen der Neustarts. Mit `#seed=Zahl` an der Adresse sind auch die Neustarts immer gleich (für die Prüfwerkzeuge).
- **Halt 3 der festen Ordnungen umgestellt:** Die strengere Prüfung (auch rechts zuerst) zeigte, dass man ihn dort von rechts nach links sofort erwischt hätte. Er sitzt jetzt am Gang zwischen anderen.
- **Die drei Halte:** 1. Er sitzt nah und weicht beim ersten Schritt eine Reihe aus. 2. Vor ihm ist eine Reihe voll, er springt weiter und wird erst vorn gestellt. 3. Er sitzt schon ganz vorn zwischen anderen und kann nur zucken. Kürzeste Lösung je Halt laut Test: 4, 7 und 7 Züge von 12.

### Fahrt fortsetzen (21.11., Schritt 3 aus `docs/auftraege/leitsaetze.md`, Leitsatz 10)

- Gesichert werden Seed, die Optionen zu Beginn der Fahrt und je Zug ein Zeichen, dazu ein Fingerabdruck des Zustands. Beim Öffnen spielt der Kern alles nach (`src/kern/fortsetzen.js`). Passt der Fingerabdruck nicht, etwa nach einer Regeländerung oder bei verfälschtem Speicher, beginnt still eine neue Fahrt. Warum der Fingerabdruck: Ohne ihn würde eine alte Aufzeichnung nach einer Regeländerung in eine falsche Lage führen, ohne dass jemand es merkt.
- Gesichert wird nach jedem Zug, der etwas bewirkt. Grund: Safari schließt Seiten im Hintergrund ohne Vorwarnung.
- War die letzte Fahrt beim Schließen zu Ende (Tod oder Halt), beginnt beim Öffnen wie bisher sofort eine neue. Sie nimmt mit, was die alte mitgibt: nach einem Tod den Begleiter und die Szene für „Noch mal". Die Endkarte der alten Fahrt erscheint nicht noch einmal. Es beginnt keine Fahrt von selbst, die vorher nicht auch begonnen hätte.
- Mit `#seed=` an der Adresse wird weder fortgesetzt noch aufgezeichnet, damit Nachstellen und Prüfwerkzeuge die Fahrt eines Spielers nicht überschreiben. Mit `#probe` ist der Zustand von außen lesbar, für `werkzeug/fortsetzen.mjs`.
- Ab 4000 Zügen in einer Fahrt wird nicht mehr aufgezeichnet. Kommt im Spiel nicht vor (eine Fahrt hat etwa 150 Züge), schützt nur den Speicher.

### Musik als Echo (Prototyp, 21.11., Abschnitt 18)

- Tonleiter: a-Moll pentatonisch (a c d e g), leicht melancholisch, ohne Halbtöne. Alle Töne weich, nur Sinus.
- Grundklang: A2 (110 Hz) als Dreieck durch einen weichen Filter, leise Quinte darüber, atmet langsam. Tiefer nicht, weil ein iPhone-Lautsprecher darunter kaum etwas wiedergibt. Er beginnt mit der ersten Eingabe einer Fahrt und schwillt über 2,5 Sekunden an.
- Schienenstoß: zwei weiche tiefe Pulse (ta-tack) statt des Rauschens, wie bisher jede dritte Runde.
- Gehen: ein Ton je Schritt, je näher die Tür, desto höher. Vorbeidrängen ist auch Gehen. Benutzen: Tasche nehmen und Wecken je ein eigener Ton. Warten: ein tiefer Ton.
- Stumm: gegen die Wand, zu weit, ins Leere, Anstoßen, den Schaffner antippen (er wiederholt den Satz, sein Warteton folgt ohnehin), seine Schritte, sein Nicken. Das Knipsen der Zange und das Rauschen der Schritte sind weg, das Motiv ersetzt sie.
- Motiv des Schaffners: e – g – a – d. Wartet er, klingt nur das e. Locht er jemanden, klingt das ganze Motiv, auch beim wachen Fahrgast in Reihe 6. So hört man es einmal vollständig, bevor er beim Spieler nur noch das e hat. Leise mitlaufen in jeder Runde erst, wenn der Spieler gelocht ist.
- Schlafender: Wartet der Schaffner in Reihe 2, klingt das e eine Oktave tiefer und leiser. Grüßt er (oder locht den Geweckten), das ganze Motiv tiefer und leiser, danach läuft es tiefer mit.
- Lampe: Gleiten zwischen zwei Tönen, zum Gang hinauf, zum Fenster hinunter. Lampe B liegt einen Ton tiefer als A.
- Die Partitur steht als reine Logik in `prototyp/freier-platz/src/musik.js` und ist in Node getestet, `ton.js` spielt sie nur.
- Gespeichert wird „Musik an/aus" unter einem neuen Feld. Das alte Feld „Ton" (beim Start aus) wird nicht mehr gelesen, sonst bliebe es bei allen, die den Prototyp schon geöffnet hatten, still.

### Aufbau

- **Eigener Ordner `prototyp/freier-platz/` mit eigener Seite.** Warum: Der Prototyp soll das Hauptspiel nicht berühren und eine eigene Adresse haben. Er folgt dem Muster des Projekts: Quelltext in Modulen, Regeln ohne Browser in `src/kern/`, alle Texte in einer Datei, eine gebaute `index.html`, eingecheckt und getestet.
- **Aus dem Hauptspiel geliehen, nicht kopiert:** Punktmatrix-Schrift, Farben und Zeichenhilfen, die Eingabe (Wischen, Tippen, Tasten) und der Seitenrahmen mit allen iPhone-Vorgaben. Das Build-Skript des Hauptspiels baut auch den Prototyp. `npm run build` baut beide Seiten, `npm test` prüft beide.
- **Am Hauptspiel geändert ist nur eine Zeile in `package.json`,** damit ein Befehl beide Seiten baut. `index.html`, `src/` und `tests/` des Hauptspiels sind unverändert.
- **Beide Schritte sind gebaut:** die Szene am eigenen Platz und der Schlafende. Die Regeln des Schlafenden waren im Kern so klein, dass ein getrennter erster Stand nichts gespart hätte. Die Tests sind getrennt (`regeln.test.js`, `schlaefer.test.js`).

### Regeln, wo der Auftrag Spielraum lässt

- **„Würde er ohnehin weitergehen" wird geprüft, als hätte der Spieler seinen Platz schon verlassen.** Wer neben dem wartenden Schaffner aufsteht und dessen Platz damit frei macht (Tasche weg, Schatten weg), tritt einfach in den Gang, und der Schaffner geht weiter. Warum: So zeigt das Spiel ohne Worte, dass es um den Platz geht, nicht um den Spieler. Und der Schaffner ist danach vorn und bleibt beim Schlafenden stehen, wo man der Regel ein zweites Mal begegnet.
- **Wer dem Schaffner im Gang entgegenkommt, stößt immer an.** Er will auf das Feld des Spielers und kann nicht durch ihn hindurch. Nachrücken gibt es nur von hinten oder von der Seite.
- **Weggeschoben nickt er nicht.** Das Nicken gibt es nur, wenn der Platz in seiner Reihe wirklich frei wurde.
- **Wird er von oben weggedrängt, landet er eine Reihe höher und geht von dort weiter.** Er geht nie zurück. Liegt die Tasche noch, bleibt sie liegen, und die Anzeige nennt sie nach der Tür.
- **Lochen von links nach rechts.** Sitzen in seiner Reihe mehrere Wache ohne Lochung, ist der linke zuerst dran. In diesem Wagen heißt das: der Spieler vor dem Fahrgast.
- **Gelocht wird auf jedem Platz.** Wer mit der Tasche in eine dunkle Reihe umzieht und den Schaffner kommen lässt, bekommt die Lochung auch. Die Regel des Auftrags nennt keine Reihe, also gilt sie überall.
- **Gegen den Schlafenden wischen weckt ihn nicht,** nur Antippen. Warum: Der Auftrag nennt „dagegenwischen" nur für die Tasche, und ein verirrter Wisch soll niemanden wecken.
- **Antippen ohne Wirkung kostet keine Runde:** der Schaffner, wenn er nicht wartet, der wache Fahrgast, der schon Geweckte, die eigene Figur. Die Figur lehnt sich kurz hin, mehr nicht.
- **Die Zange tippt auf jeden Schatten einmal,** auch in Reihe 2, wenn sie sich dort zum ersten Mal hebt. Auf die Tasche zeigt sie nur.
- **Betritt der Schaffner ein Gangfeld, auf dem schon ein Schatten liegt, macht er auch dabei den großen Schritt.**
- **Eingaben ohne Wirkung zählen nicht als Handlung.** Wer nach dem Anstoßen gegen eine Lehne wischt oder zu weit tippt und danach wieder gegen den Schaffner wischt, drängt vorbei. Warum: Abschnitt 5 kennt vier Handlungen (gehen, benutzen, anstoßen, warten). Eine unmögliche Eingabe ist keine davon und kostet keine Runde. Ein Test hält es fest.
- **Der geweckte Fahrgast wird gelocht, nicht gegrüßt.** Regel 2 kommt vor Regel 3: Wer wach in der Reihe sitzt, wird gelocht. Gegrüßt wird nur, wer schläft.
- **Reihe 2 gilt im Protokoll als frei,** sobald am Ende einer Runde auf dem Fensterplatz neben dem Schlafenden kein Schatten mehr liegt.

### Anzeige und Bedienung

- **Die Lampe sitzt auf der Lehne zwischen den beiden Sitzen, ihr Arm schwenkt oben herum zur anderen Seite.** Der Kopf sitzt auf der Seite, von der das Licht kommt. Antippen lässt sich der Lampenkopf, mit mindestens 48 Pixeln Trefferfläche. Wer mitten auf ein Feld tippt, trifft immer das Feld, nie die Lampe: Das prüft ein Test für jede Bildschirmgröße.
- **Der Schatten ist der Umriss der sitzenden Figur, flach hingelegt,** der Kopf zeigt vom Licht weg. An der Wand ist er ein schmaler dunkler Streifen.
- **Der Arm des Schaffners reicht bis zum störenden Ding,** auch über den Sitzenden hinweg. Warum: „zielt genau" und „tippt auf den Schatten" gehen nur, wenn die Zange wirklich ankommt. Der lange Arm ist die komischste Lösung, die ohne Pfeil auskommt.
- **Nur die zwei brennenden Lampen sind gezeichnet.** Andere Sitzpaare haben keine, damit niemand versucht, sie einzuschalten.
- **Zwei Zeilen je Tatsache.** Die Sätze des Auftrags sind für die Anzeige bei 360 Pixeln zu lang und werden umbrochen: „Der Schaffner / wartet in Reihe 5."
- **Die Uhrzeit nach der Tür** erscheint nur, wenn es keine Tatsache gibt. Sie folgt dem Hauptspiel: Abfahrt 23:41, jede Runde eine Minute.
- **Die Lochung ist eine schmale, schräg gesetzte Sichel.** Die erste Fassung war breiter und sah aus wie ein Mond.
- **Tippen auf die Fahrkarte** drückt sie kurz ein, sonst nichts. Tippen auf die eigene Figur wartet nicht: Dafür gibt es hier den Knopf.
- **Am Rechner** gehen Pfeiltasten oder WASD, die Leertaste wartet, nach der Tür beginnt die Eingabetaste eine neue Fahrt. Nur sie, nicht Pfeil hoch oder W, und nicht, wenn sie gehalten wird. Warum: Wer Pfeil hoch bis zur Tür gedrückt hielt, saß sonst nach einer Sekunde in der nächsten Fahrt. Das Spiel startet nie von selbst die nächste.
- **Wiederholt der Schaffner den Satz, geht die Blase kurz weg und nach 0,11 Sekunden neu auf.** Warum: Sonst änderte sich beim Tipp auf ihn kein Punkt im Bild, obwohl eine Runde verging. Gerade diesen Tipp erwartet der Spieltest.
- **Steht die eigene Figur direkt über dem Schaffner im Gang, steht die Blase über ihr,** und die Spitze reicht neben ihr herunter bis zu seinem Kopf. Vorher verdeckte die Blase die eigene Figur.
- **Ein Tipp auf das Feld des Schaffners trifft ihn, solange er näher an seinem Kopf liegt als am Kopf der Lampe.** Vorher schwenkte ein Tipp knapp neben seinen Kopf die Lampe und löste das Rätsel aus Versehen.
- **Beim Anstoßen wendet er sich kurz zum Spieler hin,** auch wenn der Schirm seiner Mütze schon dorthin zeigt. Sonst war am Schaffner nichts zu sehen, und das Anstoßen sah aus wie „geht nicht".
- **Nach einer Größenänderung richtet sich die Zange neu aus,** etwa wenn die Leisten von Safari kommen und gehen. Vorher zeigte sie bis zur nächsten Eingabe auf die alte Stelle.
- **Unter 600 Pixeln Höhe werden die Felder kleiner als 48 Pixel** (bei 375×548 sind es 47). Der Auftrag verlangt 360×600, darunter wird nur verkleinert.
- **Reduzierte Bewegung:** Das Bild ruckt beim Schienenstoß nicht, der Schlafende atmet nicht sichtbar. Lampen und Schatten bewegen sich weiter, weil sie die Auskunft tragen.
- **Töne:** Schritt, Tasche, Klick der Lampe, Knips, Ta-tack. Kein Ton bei Eingaben, die nicht gehen.
- **Der Satz bleibt stehen, wenn eine schnelle Eingabe sein Erscheinen abgekürzt hat,** und verschwindet erst mit der Eingabe danach. Sonst sähe ihn nie, wer schnell tippt.

### Speicher und Protokoll

- **Eigener Schlüssel `endstation.freier-platz.1`.** Der Stand des Hauptspiels wird weder gelesen noch geschrieben.
- **Das Protokoll bleibt nach dem langen Druck offen, egal wie lange der Finger noch liegt.** Erst der nächste Tipp oder Wisch schließt es. Vorher verschwand es beim Loslassen, wenn man länger als etwa 1,3 Sekunden gedrückt hatte.
- **Das Protokoll wird nach jeder Eingabe gesichert,** nicht erst an der Tür. Warum: Gibt eine Testperson auf, bleibt die abgebrochene Fahrt lesbar.
- **Eingaben ohne Wirkung stehen als Punkt in der Folge.** Warum: Der Spieltest fragt, ob jemand „wahllos überall" tippt.
- **Die aufgehobenen Karten sind nur im Protokoll zu sehen,** als Zeile aus `+` und `-`. Im Spiel gibt es keine Sammlung.
- **`#probe` an der Adresse** macht den Zustand von außen lesbar. Das braucht das Prüfwerkzeug.

### Nicht geprüft

- Kein echtes iPhone und keine WebKit-Engine, nur Chromium mit iPhone-Profil.
- Der Ton wurde nicht angehört.
- Unabhängige Prüfung am 19.11.: Regeln und Anzeige sind vollständig geprüft. Die Regeln wurden dabei über alle 40.501 erreichbaren Zustände mit einem eigenen Modell verglichen, ohne Abweichung. Die Funde zur Anzeige sind behoben, sechs fehlende Tests sind nachgetragen. Die Prüfer für Speicher, Tests und Ton sind am Nutzungslimit ausgefallen. Speicher und Sprachmittel für Safari ab iOS 13 habe ich danach selbst geprüft, ohne Befund. Ton und Haltung sind nicht noch einmal unabhängig geprüft.
- Ob jemand die Regel errät und ob es komisch ist, zeigt nur der Spieltest.

## Etappe 2

Der Auftraggeber hat am 19.11. zuerst nur den Wagen mit dem Kontrolleur freigegeben, danach „Mach jetzt weiter, danach kümmern wir uns um die Korrektur". Gebaut werden deshalb nur Teile, die seinen Vorgaben aus dem Prototyp-Auftrag nicht widersprechen: Kontrolleur, Aufbrechen, Präsenz, Stärken, Speisewagen ohne Gesichter und ohne Begleiter. Fahrkarte mit Symbolen, helle und dunkle Lochungen, Angebote, Begleiter und Halt mit Schaffner warten auf seine Entscheidung (siehe „Offen").

### Fahrkarte und Prüfungen

- **Sechs Prüfungen.** Drei stehen im Fahrplan: „Nicht aufregen" (kein Schlag), „Erst aussteigen lassen" (drei Züge hintereinander stillstehen), „Ohne Rempeln" (kein Treffer). Der Fahrplan nennt sechs Symbole, deshalb drei eigene im selben Ton: „Nicht drängeln" (nie auf ein rotes Feld treten), „Pünktlich" (den Wagen höchstens zwölf Züge nach dem Annehmen verlassen), „Ruhe bewahren" (volle Ruhe erreichen). Gelten bis zum Verlassen des Wagens, dann wird ausgewertet.
- **Angebot:** In jedem Wagen außer dem Speisewagen leuchtet ein Symbol auf einem freien Feld, mindestens zwei Schritte vom Start. Angeboten wird nur, was noch nicht gelocht ist. Drauftreten nimmt an, die Worte stehen kurz über der Figur, das Symbol bleibt neben der Uhr, bis ausgewertet ist. Vorbeigehen und Nichterfüllen kosten nichts.
- **Die Angebote würfeln mit eigenem Zufall.** Warum: Sonst sähen dieselben Wagen mit derselben Zahl anders aus als vorher, und die Zahlen der Bots sprängen ohne Grund.
- **Dunkle Lochung** nach einem Tod, je Ursache höchstens eine, solange sie dunkel ist. **Sie wird hell, wenn man es einmal anders macht:** einen Wagen, in dem diese Ursache war, verlassen, ohne von ihr getroffen zu werden. Bei der Tür: einen Wagen verlassen, ohne aufzubrechen.
- **Die Fahrkarte gilt für die ganze Reise:** vom ersten Wagen bis zum Halt, über Tode hinweg. Nach dem Halt beginnt eine neue Reise mit frischer Karte. Sie steht im Speicher (`fahrkarte` in `src/speicher.js`).
- **Zu sehen ist die Karte auf der Endkarte:** sechs Symbole, gelochte mit einem hellen Loch, rechts Platz für Sonder-Lochungen, hell oder dunkel.

### Halt

- **Der Schaffner steht am Zug auf dem Bahnsteig:** der Begleiter, jetzt mit Mütze. Er verlangt drei helle Lochungen, egal welche: erfüllte Prüfungen, aufgehellte dunkle, ehrliche Antworten.
- **Reichen sie, zeigt die Anzeige den Rückblick:** je Lochung eine Tatsache, erste Zeile die Handlung, zweite der Wagen, etwa „Ohne Rempeln / Fahrradabteil", „Ende durch Drängler / Liegewagen", „Antwort: Drängler / Speisewagen". Ohne Adjektiv. Alle 1,4 Sekunden die nächste, ein Tipp überspringt alles.
- **Danach das Schlussbild mit „Aussteigen" und „Noch eine Fahrt".** „Aussteigen" lässt das Bild stehen, nichts beginnt von selbst. Wer danach nach oben wischt, beginnt eine neue Reise. „Noch eine Fahrt" beginnt sie sofort. Beides mit frischer Fahrkarte.
- **Reichen sie nicht, steht dort die wahre Zeile, was fehlt** („Noch eine helle Lochung"), und der Schaffner hält die Zange hin. Wer wegwischt, fährt ab dem Speisewagen weiter, mit derselben Karte. Der Fahrplan sagt nicht, was dann geschieht. So bleibt es eine Fahrt mit Ende, und man bekommt eine neue Gelegenheit, ohne von vorn zu beginnen.
- **Zahlen:** Wer die Angebote nicht sucht, kommt im Mittel mit einer hellen Lochung am Halt an (ausgewogener Bot ohne Fehler, 400 Fahrten), nur 5 % haben schon drei. Der Fahrplan sagt: „Ein bis zwei davon passieren fast von allein."
- **Die Anzeige der Karte am Halt ist dichter gesetzt** (Punktabstand 2,2 statt 2,5 bei schmalen Handys), damit „Erst aussteigen lassen" und „Ende durch Reisegruppe" in eine Zeile passen. Der Ton-Test prüft jede Rückblick-Zeile bei 360 Pixeln.

### Begleiter

- **Nach einem Tod sitzt er im Speisewagen,** in derselben Uniform wie der Kontrolleur, die Mütze abgesetzt, ohne Gesicht. Am Halt wird er der Schaffner sein.
- **Lag der Tod hinter dem Speisewagen, beginnt die nächste Fahrt im Speisewagen, sonst vorn.** Abweichung vom Fahrplan („Nach einem Tod beginnt die nächste Fahrt im Speisewagen"): Wer in Wagen 1 bis 3 stirbt, würde sonst Wagen überspringen, die er nie geschafft hat. Er trifft den Begleiter dann, wenn er in den Speisewagen kommt.
- **Wer neben ihn tritt, hört „Woran lag es?".** Darunter liegen drei Antworten auf dem Boden: die ehrliche (die Todesursache), eine andere Ursache und „Pech", in zufälliger Reihenfolge. Die Ursachen sind kleine Figuren, die Tür ist eine Tür, nur „Pech" ist ein Wort. Warum keine Wörter: Drei Schilder nebeneinander passen bei 360 Pixeln nicht. Draufgehen heißt antworten, wie beim Angebot.
- **Die ehrliche Antwort gibt eine helle Lochung,** je Todesursache eine. Eine andere Antwort hat keine Folge. Er nennt nicht, was gelungen ist (Entscheidung vom 19.11.).
- **Wiederholung: Nach der Antwort liegt neben ihm ein Schild „Noch mal".** Egal, welche Antwort es war. Wer draufgeht, steht am Anfang des Wagens, in dem die letzte Fahrt endete: derselbe Plan, dieselben Gegner an denselben Plätzen. Die Gegner handeln ohne Zufall, wer dasselbe tut, sieht dasselbe. Der Wagen blendet über, statt hereinzufahren, und das Licht ist kühler, wie eine Erinnerung.
- **Gefahrlos:** Treffer und Aufbrechen kosten kein Herz. Ein Treffer ist zu sehen und nimmt die Ruhe wie sonst, damit die Wiederholung dasselbe zeigt wie die echte Szene. Die Herzen sind dabei blass.
- **Folgenlos:** Was in der Wiederholung geschieht, zählt nicht für die Reise: kein Angebot, keine Lochung, keine Stärke. Warum: Sonst wäre Sterben ein Weg zu Stärken ohne Gefahr, und der Rückblick am Halt soll nur zeigen, was auf der Fahrt geschah. Nur die Uhr läuft weiter.
- **Zurück durch die Tür oder mit einem Schritt nach unten vom Startfeld.** Aufbrechen kostet hier nichts, man kommt also immer hinaus. Der Schritt nach unten ist für den, der aus Versehen auf das Schild getreten ist. Danach steht man wieder neben dem Begleiter, mit Herzen, Ruhe und allem anderen wie vorher. Das Schild ist fort: eine Wiederholung je Tod.
- **Die Szene steht nicht im Speicher,** so wenig wie der Begleiter selbst. Wer die Seite neu lädt, trifft ihn nicht mehr.
- **Das Schild ist breiter als ein Feld.** Es liegt auf dem Feld neben ihm, schließt an seiner Seite mit dem Feld ab und reicht in den Gang, damit es ihn nicht verdeckt. Der Ton-Test prüft, dass es bei 360 Pixeln höchstens drei Felder breit ist.
- **Ton-Check, Grenzfall:** „Noch mal" nennt kein Detail aus der Fahrt, wie „Pech" und die Knöpfe am Halt. Es ist ein Angebot, keine Aussage über den Spieler. Das Persönliche ist die Szene selbst: Die Zuganzeige nennt dann den Wagen, in dem die Fahrt endete. Der Name des Wagens auf dem Schild wäre persönlicher, passt aber bei 360 Pixeln nicht in den Gang („Großraumwagen") und sagt nicht, was geschieht.
- **Zahlen:** Die Bots treffen den Begleiter nie, ihre Werte bleiben gleich (ausgewogen mit Unachtsamkeit 55 %, mit allen Stärken 73 %).
- **Was eine neue Fahrt mitnimmt, steht an einer Stelle:** `src/kern/reise.js`. Spiel und Prüfwerkzeuge nutzen sie beide, damit sie dieselbe Fahrt nachrechnen.

### Präsenz

- **Bei voller Ruhe zögert der nächste Gegner, der angreifen würde, einen Zug lang.** Er kündigt nicht an und weicht kurz zurück. Das gilt einmal je voller Ruhe: Erst ein Treffer und neue volle Ruhe bringen die Präsenz zurück. Warum: Gälte sie in jedem Zug, griffe bei voller Ruhe niemand mehr an. Die erste Fassung ließ den nächststehenden Gegner zögern. Bei gleichem Abstand traf das oft einen, der gar nicht angreifen wollte, und die Präsenz verpuffte.
- **Zahlen mit Präsenz** (500 Fahrten je Bot): ausgewogen mit Unachtsamkeit 50 %, ohne Fehler 86 %, Ausweicher 58 %, Kämpfer 0 %.

### Speisewagen

- **Vierter von jetzt sieben Wagen, direkt nach dem Mittelwagen,** wie im Fahrplan („der Safe Space nach dem Autoritätswagen").
- **Keine Gegner, die Tür ist von Anfang an offen, nie passiert etwas.** Der Fuzz-Test prüft in jedem Zug, dass dort niemand ist und kein Herz verloren geht.
- **Er heilt zwei Herzen beim Hineingehen,** höchstens bis fünf. Warum beim Hineingehen: Wer durchgehen will, soll nicht warten müssen. Reibung ist ein Fehler.
- **Tische an beiden Wänden, dazwischen ein Gang drei Felder breit.** Mehr erlaubt die Bauregel nicht: Ein Tisch in der Mitte ließe Felder ohne Ausweg zur Seite zurück.
- **Warmes Licht** über den Tischen und auf dem ganzen Boden.
- **Fahrgäste sind die verstandenen Gegnertypen:** Wer die Stärke des Pendlers, der Reisegruppe oder des Dränglers hat, findet eine solche Figur auf einem Sitz. **Sie haben ein Gesicht** (entschieden am 19.11.): zwei Punkte und ein kurzer Mund, schlicht. Auch wer nach dem Gönnen später dazukommt, hat eins.
- **Fenster wie in jedem Wagen,** mit vorbeiziehenden Lichtern. Kein „Blick nach draußen" mit Landschaft, das widerspricht ebenfalls dem Prototyp-Auftrag.
- **Gönnen: Wer gegen einen Tisch läuft, lässt dort ein Herz liegen.** Das geht einmal je Besuch und kostet einen Zug. Das letzte Herz lässt man nicht liegen: Im sicheren Ort passiert nie etwas Schlimmes, auch nicht durch einen selbst. Das Herz bleibt sichtbar auf dem Tisch, bis man weiterfährt.
- **Meistens kommt nichts zurück.** In einem von drei Fällen (aus dem Zufall der Fahrt) sitzt bei späteren Fahrten jemand mehr im Speisewagen, höchstens fünf. Das zeigt sich erst bei der nächsten Fahrt und wird nirgends angekündigt. Gespeichert als `mehrAmTisch` in `src/speicher.js`.
- **Nicht gebaut: der Begleiter.** Er widerspricht dem Prototyp-Auftrag (kein Lob).
- **Zahlen mit Speisewagen** (500 Fahrten je Bot): ausgewogen mit Unachtsamkeit 55 %, ohne Fehler 86 %, Ausweicher 60 %, Kämpfer 0 %, ausgewogen mit Unachtsamkeit und allen Stärken 73 %. Das Heilen hilft wenig, weil die meisten mit fast vollen Herzen ankommen.

### Stärken aus Schatten

- **Pendler verstanden, wer dreimal neben einem Pendler wartet** (waagerecht oder senkrecht daneben, nicht hintereinander nötig). Stärke: **Ruhe fürs Warten.** Wer neben einem Gegner wartet und in diesem Zug nicht getroffen wird, bekommt eine Ruhe.
- **Drängler verstanden, wer dreimal einer Drängler-Linie ausweicht, ohne zwischendurch einen Drängler zu schlagen.** Ein Schlag beginnt das Zählen von vorn. Stärke: **Sprint.**
- **Reisegruppe verstanden, wer einen Wagen, in dem eine Reisegruppe war, mit genau einem Herz verlässt.** Stärke: **Rückhalt.** Einmal je Fahrt lässt ein tödlicher Treffer ein Herz übrig. Fürs Aufbrechen gilt er nicht, das ist kein Treffer.
- **Eine neue Stärke gilt ab dem nächsten Zug.** Die erste Fassung ließ sie schon im selben Zug wirken, das fiel im Fuzz-Test auf.
- **Die Stärken bleiben gespeichert** (`staerken` in `src/speicher.js`). Löscht Safari den Speicher, sind sie fort, wie alles andere auch.
- **Kein Text und kein Symbol zeigt sie an.** Wer eine Stärke bekommt, sieht ein warmes Leuchten um die Figur. Dasselbe Leuchten zeigt, dass der Rückhalt gegriffen hat.
- **Sprint mit einem Tipp auf ein Feld zwei weiter in gerader Linie.** Warum nicht wischen: Ein Wisch löst nach 18 Pixeln aus und ist da schon ein Schritt. Am Rechner gibt es keinen Sprint. Ohne die Stärke geschieht beim Tipp nichts, ohne Ruhe lehnt sich die Figur nur kurz hin. Gegner auf dem Weg nehmen einen Schaden. Man landet auf dem weitesten freien Feld des Wegs, ist keines frei, bleibt man stehen. Wer aus einem roten Feld heraussprintet, ist ausgewichen und bekommt die Ruhe zurück.
- **Zahlen:** Die Bots verdienen die Stärken innerhalb einer Fahrt selten, ihre Werte bleiben gleich. Mit allen Stärken von Anfang an, wie nach einigen Fahrten, erreicht der ausgewogene Bot mit Unachtsamkeit den Halt in 69 % statt 50 % der Fahrten, der Ausweicher in 74 %. Die Bots sprinten nie.
- **Für die Rückmeldung:** Merkt man ohne Hinweis, dass man sprinten kann? Bisher nur durch Ausprobieren.

### Kontrolleur: Regeln

- **Mittelwagen als dritter von jetzt sechs Wagen.** Warum: Der Fahrplan setzt den Autoritätswagen in die Mitte der Fahrt. Darin steht der Kontrolleur neben der Tür, dazu zwei Pendler. Ohne sie wäre Stillstehen nie eine Entscheidung.
- **Seine Nähe sind die acht Felder um ihn herum.** Er geht nie von seinem Platz.
- **„Er prüft nur, wer sich bewegt" heißt: wer sich innerhalb seiner Nähe bewegt.** Wer von außen hereintritt, wird nur angesprochen. Warum: Sonst könnte man nie ruhig neben ihn treten, ohne vorher geprüft zu werden.
- **Prüfen ist ein angekündigter Angriff auf das Feld des Spielers,** wie bei jedem Gegner einen Zug vorher rot. Ein Treffer kostet zwei Herzen, so steht es im Fahrplan („2 Schaden"). Das weicht von der eigenen Regel aus Etappe 1 ab, nach der Rot immer genau ein Herz kostet. Es bleibt bei höchstens einem Treffer je Zug. Treffen mehrere, zählt der schwerere.
- **Wer ihn schlägt, wird ebenso geprüft.** Kämpfen geht: fünf Schläge. Wer nach jedem Schlag aus seiner Nähe ausweicht und von außen wiederkommt, bleibt heil, braucht aber drei Züge je Schlag.
- **Drei Züge ruhig heißt dreimal „Warten" hintereinander in seiner Nähe.** Gegen die Tür laufen und Schlagen zählen nicht als ruhig, Wegtreten beginnt von vorn.
- **Durchgewinkt geht er fort.** Warum: Der Kernsatz sagt, dass Gegner verschwinden, sobald man sie versteht. Seine Tür geht dann auf, auch wenn noch Pendler im Wagen sind, ebenso nach seiner Niederlage. Im Wagen des Kontrolleurs gehört die Tür ihm.
- **Aufbrechen gilt für jede Tür,** wie im Fahrplan: dreimal gegen die geschlossene Tür laufen, jeder Stoß kostet einen Zug, beim dritten geht sie auf und kostet ein Herz. Die Stöße zählen je Wagen und müssen nicht hintereinander kommen. Aufbrechen ist kein Treffer, die Ruhe bleibt. Mit dem letzten Herz ist es der Tod. Warum: dieselbe Regel für alle, Kanten bleiben drin.

### Kontrolleur: Anzeige

- **Er hält dem, der in seiner Nähe ist, die Lochzange hin.** Mit jedem ruhigen Zug sinkt sie ein Stück, beim dritten greift er an die Mütze und geht durch die Tür. So ist ohne Text zu sehen, dass Stillstehen etwas bewirkt.
- **„Fahrkarte, bitte." steht als Schild über ihm,** beim Herantreten und bei jeder Prüfung. Es verschwindet mit der nächsten Eingabe.
- **Der Hinweis „Anrempeln" erscheint nie über ihm.** Das Spiel schlägt keinen der Wege vor.
- **Die geschlossene Tür gibt bei jedem Stoß sichtbar nach:** Ein Spalt mit Licht wird breiter. Das grüne Licht neben der Tür geht erst an, wenn sie offen ist.
- **Er sieht dem Schaffner aus dem Prototyp ähnlich:** Mütze mit rotem Band, Lochzange. Ob es dieselbe Figur ist, bleibt offen.
- **Kein eigener Name auf der Zuganzeige für ihn,** nur der Wagen heißt „Mittelwagen".

### Kontrolleur: Schwierigkeit

- **Die Zahlen bleiben fast gleich** (500 Fahrten je Bot, vor der Präsenz): Mit Unachtsamkeit erreicht der ausgewogene Bot den Halt in 48 % der Fahrten, ohne Fehler in 79 %, der Ausweicher in 56 %, der Kämpfer in 0 %. Der Kämpfer scheitert jetzt meist am Kontrolleur.
- **Ausweicher und Ausgewogener lassen den Kontrolleur in Ruhe,** erledigen die Pendler und stellen sich dann ruhig in seine Nähe. Im Mittelwagen bekommen sie kaum Treffer. Die Bots nutzen das Aufbrechen nicht.
- **Der Test „es wird schwerer" zählt nur Kampfwagen.** Der Autoritätswagen ist bewusst leichter für den, der ihn durchschaut.

### Nicht geprüft

- Kein echtes iPhone und keine WebKit-Engine, nur Chromium mit iPhone-Profil bei allen sechs Pflichtgrößen.
- Ob man ohne Hinweis herausfindet, dass er Ruhige durchlässt, zeigt nur der Test am Gerät.

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

### iPhone

- **Uhr und Lautsprecher sitzen oben.** Die Uhr steht zwischen Herzen und Ruhe, der Lautsprecher rechts neben der Zuganzeige. Unten liegt nichts mehr. Warum: Am unteren Rand sitzen die Leiste von Safari und der Home-Balken. Preis: Die Uhr ist für den Daumen weit weg. Der kurze Weg zum Warten ist das Tippen auf die eigene Figur.
- **Unter dem Wagen bleiben 22 Pixel frei,** dazu kommt der Abstand für den Home-Balken. Das unterste Feld endet also mindestens 26 Pixel über dem Rand des sicheren Bereichs.
- **Der Canvas füllt nur den sicheren Bereich.** Die Abstände für Notch und Home-Balken setzt das Stylesheet am Seitenrahmen. Warum: Das Spiel muss dann nirgends selbst mit Rändern rechnen, und Tippen wird relativ zum Canvas ausgewertet.
- **Höhe:** `100%` für jeden Browser, `100dvh` dort, wo es das gibt. `100vh` kommt nicht vor, weil Safari damit unten abschneidet. Zusätzlich misst das Spiel den Canvas in jedem Bild nach, weil Safari Größenänderungen nicht verlässlich meldet.
- **Kein Zoom, kein Scrollen:** `touch-action: none`, dazu werden `touchmove`, `gesturestart` und `dblclick` unterbunden. Im Viewport steht zusätzlich `user-scalable=no` für ältere Geräte.
- **Ton:** Der Klang wird erst erzeugt, wenn ein Finger den Bildschirm verlässt oder eine Taste gedrückt wird. Nach einem Anruf oder App-Wechsel setzt die nächste Berührung ihn fort. Vibration nutzt das Spiel nicht.
- **Speicher:** `ladeStand()` liefert immer einen vollständigen Stand, aus leerem, gesperrtem oder kaputtem Speicher. Geprüft ist auch, dass das Spiel weiterläuft, wenn der Speicher mitten in der Fahrt gelöscht wird. Verloren gehen dann nur die gelernten Hinweise und die Ton-Wahl.
- **Wischen vom linken Bildschirmrand** blättert in Safari eine Seite zurück. Das lässt sich nicht abschalten. Das Spiel braucht keine Geste am Rand, Wischen wirkt überall.
- **WebKit war nicht verfügbar.** In der Cloud-Umgebung ist nur Chromium installiert. Geprüft wurde deshalb in Chromium mit iPhone-Profil bei 390×844, auch mit nachgestellter Notch (47) und Home-Balken (34). Die Werkzeuge nehmen WebKit von selbst, sobald es da ist.

### Nicht geprüft

- Kein echtes iPhone und keine WebKit-Engine. Was Safari anders macht als Chromium, zeigt erst das Gerät: das Verhalten der Leisten, die Ton-Freigabe, das Wischen vom Rand.
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

## Bodensymbole lesbar machen (22.11., `docs/auftraege/bodensymbole.md`)
Leitsätze 2, 5 und 7. Am Boden liegen vier Arten: Angebot (Prüfungssymbol), rotes Feld (Ankündigung), Antworten beim Begleiter, „Noch mal". Das Herz auf dem Tisch liegt nicht am Boden.
- **Einführung je Art, nicht je Prüfungssymbol.** Alle sechs Prüfungssymbole tun dasselbe: drauftreten, Worte lesen, beim Verlassen gelocht werden. Eingeführt wird diese Art einmal. Jedes Symbol einzeln an der Tür einzuführen hieße: vier Prüfungen erfüllen sich dort von selbst, das verschenkt Lochungen und ändert die Schwierigkeit.
- **Angebot:** Solange die Fahrkarte keine Prüfung trägt, liegt in Wagen 1 „Erst aussteigen lassen" auf dem Feld vor der Tür. Daran kommt niemand vorbei, und der Wagen ist dort schon ruhig. Dreimal stehen genügt, das ist ohne Gefahr zu schaffen. Gewürfelt wird trotzdem, die späteren Angebote bleiben dieselben. Dunkle Lochungen zählen nicht, wer noch keine Prüfung hat, sieht die Einführung wieder.
- **Rotes Feld:** Bisher sah man es meist erst in Wagen 2 bei drei Pendlern (in zwei von drei Fahrten). Jetzt holt der langsame Pendler in Wagen 1 zu Beginn einmal ins Leere aus, auf das Feld vor sich, mindestens zwei Felder vom Spieler entfernt. Man sieht Ankündigung und Hieb, ohne getroffen werden zu können. Merkmal `holtAus` am Pendler in `wagen.js`. Das vorhandene Wort „Ausweichen" bleibt das einzige.
- **Antworten und „Noch mal"** liegen nur im Speisewagen, dem sicheren Ort. Unverändert.
- **Wirkung beim Betreten:** Angebot: Worte, warmer Ring um die Figur, eigener Klang, beim Lochen ein Zangenklick. Rotes Feld: Ausrufezeichen wie bisher, dazu ein tiefer doppelter Ton. Antwort: ein kurzer steigender Ton. „Noch mal" hatte schon einen.
- **Ohne Farbe unterscheidbar:** Gefahr ist eckig und schräg gestreift, Nutzen ist rund mit dünnem Kreis und weichem Schein. Liegt ein Symbol vor der Tür, fehlen die Winkel des Türlichts, damit es lesbar bleibt.
- **Zahlen:** `npm run balance` vorher und nachher gleich (86 / 55 / 73 %, Ausweicher 60 %, Kämpfer 0 %). Wagen 1 ist fast unverändert, nur der Kämpfer bekommt dort jetzt im Schnitt 0,3 Treffer, weil er in das Ausholen hineinläuft.
