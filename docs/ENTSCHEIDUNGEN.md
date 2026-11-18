# Entscheidungen

Detailfragen, die Claude selbst entschieden hat. Neueste Etappe oben. Jede Zeile: was, und warum.

## Offen

Widersprüche zwischen dem Auftrag für den Prototyp „Der freie Platz" (`docs/PROTOTYP-freier-platz.md`) und den vorhandenen Dokumenten. Sie sind **nicht entschieden**. Der Auftraggeber entscheidet. Bei jedem Punkt steht, was der Prototyp vorläufig tut, weil er irgendetwas tun muss.

### Betrifft den Prototyp unmittelbar

- **Daumenzone unten oder Knöpfe oben.** Auftrag, Abschnitt 4: unten links die Fahrkarte, unten rechts der Knopf „Warten". Vorhanden (`CLAUDE.md`, „iPhone hat Vorrang"): „Nichts zum Antippen am unteren Rand", Uhr und Lautsprecher sitzen oben. Vorläufig gebaut: Die Daumenzone liegt unten, hält aber denselben Abstand zum Rand, den das Hauptspiel unter seinem untersten Feld freilässt (26 Pixel, dazu der Home-Balken). Der Lautsprecher sitzt wie im Hauptspiel oben rechts. Zu klären am Gerät: Kommt die Leiste von Safari dem Knopf in die Quere?
- **Abspielen der Ereignisse.** Auftrag, Abschnitt 11: Ereignisse nacheinander, je 150 bis 350 ms, dabei höchstens eine Eingabe vormerken. Vorhanden (Fahrplan, Etappe 1): keine Bewegung über 150 ms, Eingaben schneiden Bewegungen ab, niemand wartet auf das Spiel. Vorläufig gebaut: Die Ereignisse laufen nacheinander mit den Zeiten des Auftrags, aber jede neue Eingabe springt sofort ans Ende, wie im Hauptspiel. Nur nach dem Anstoßen verfallen Eingaben für 0,3 Sekunden, damit ein doppelter Wisch nicht versehentlich drängt. Preis: Wer schnell tippt, sieht Übergänge nicht, nur ihr Ergebnis.
- **Ton beim Start.** Auftrag: aus. Hauptspiel (eigene Entscheidung aus Etappe 1): an, aber leise. Vorläufig: Im Prototyp ist er aus, im Hauptspiel unverändert an. Offen ist, was später für das ganze Spiel gilt.
- **Testprotokoll.** Auftrag, Abschnitt 12: Das Spiel schreibt mit, was in der letzten Fahrt geschah. Vorhanden (`CLAUDE.md`, „Nicht tun"): keine Analyse-Skripte, in Etappe 0 gedeutet als „Skripte, die im Spiel Nutzungsdaten sammeln". Vorläufig gebaut, weil der Spieltest es braucht: Das Protokoll liegt nur auf dem Gerät, wird nirgends hingeschickt und ist nur mit langem Druck auf die Zuganzeige zu sehen.
- **Neustart.** Auftrag: Knopf „Neue Fahrt". Fahrplan, Etappe 1: Endkarte nach oben wegwischen. Etappe 2: Knöpfe „Aussteigen" und „Noch eine Fahrt". Vorläufig: nur der Knopf.
- **Zuganzeige.** Auftrag: „Wagen 7". Hauptspiel: Wagennummer und Wagenname („1 | Sitzwagen"). Vorläufig: wie im Auftrag.
- **Kein Hinweis, kein Pfeil, keine leuchtende Markierung.** Auftrag, Abschnitt 2 (verbindlich). Vorhanden im Hauptspiel: drei Hinweiswörter, pulsierende rote Felder, Ausrufezeichen, Winkel an der offenen Tür, grünes Licht neben der Tür. Fahrplan Etappe 2 und 3: leuchtende Symbole auf Feldern, Option „deutliche Hinweise". Der Prototyp hat nichts davon. Offen ist, was das für das Hauptspiel heißt.
- **Nichts vor den Fenstern.** Auftrag, Abschnitt 2 (verbindlich): keine Landschaft vor den Fenstern. Vorhanden: vorbeiziehende Lichter im Hauptspiel, Bahnsteigbild auf der Endkarte, in der Vision „Regen an der Scheibe" und im Speisewagen „Blick nach draußen". Im Prototyp sind die Fenster dunkel.
- **Schatten.** Auftrag: Schatten gibt es nur als flache, geworfene Schatten im Lampenlicht. Vorhanden: Jede Figur des Hauptspiels hat einen runden Bodenschatten, und der Fahrplan nennt „Stärken aus Schatten". Im Prototyp haben Figuren keinen Bodenschatten.

### Betrifft das Konzept

- **Rätsel oder Taktik.** Auftrag: „rundenbasiertes Rätselspiel", jeder Wagen enthält eine Regel, die man durchschauen oder brechen kann, ohne Herzen und Gegner. Kernsatz der Vision: „Ein Taktikspiel, in dem Gegner verschwinden, sobald man sie versteht". Offen: das Verhältnis dieses Wagentyps zum bisherigen Kern.
- **Prototyp und Fahrplan.** `CLAUDE.md`: Gebaut wird nur die aktuelle Etappe, keine Funktionen außerhalb des Fahrplans. Etappe 2 ist freigegeben und nicht begonnen. Der Prototyp steht in keiner Etappe. Offen: ob er Etappe 2 ersetzt, ihr vorausgeht oder daneben steht.
- **Fahrkarte.** Auftrag: schlichtes Papier ohne vorgedruckte Felder und ohne Zahlen, höchstens eine Lochung, sie schaltet nichts frei und wird nirgends gezählt. Fahrplan Etappe 2: sechs Prüfungs-Symbole auf der Karte, helle und dunkle Lochungen, am Halt werden drei helle Lochungen verlangt. Nicht umgesetzt, nur vermerkt.
- **Mitgezählter Spielstil.** Auftrag: kein Punktestand, kein Moralwert, kein Persönlichkeitstest. Fahrplan Etappe 3: Spielstil mitzählen, Wärme und Kälte, Haltung der Figur nach Spielstil. Etappe 5: Bestwerte gegen sich selbst. Nicht umgesetzt, nur vermerkt.
- **Kein Lob.** Auftrag: kein Lob, kein „Geschafft". Fahrplan Etappe 2: Der Begleiter „nennt zuerst, was neu gelungen ist".
- **Gesichter.** Auftrag: Figuren haben keine Gesichter. Fahrplan Etappe 2: Verstandene Gegner sitzen im Speisewagen „und haben ein Gesicht". Vision: Am Ende sieht man „zum ersten Mal das eigene Gesicht".
- **Schaffner, Kontrolleur, Begleiter.** Im Fahrplan gibt es den Kontrolleur („Fahrkarte, bitte.") und den Begleiter, der am Halt als Schaffner auftritt. Offen: ob der Schaffner aus Wagen 7 eine dieser Figuren ist.
- **Ist „Schatten" als Motiv zu deutlich?** Offen laut Auftrag. Der Spieltest soll es zeigen.

## Prototyp „Der freie Platz"

Eigene Detailentscheidungen beim Bau. Was der Auftrag offenlässt, steht hier. Was ihm oder den Dokumenten widerspricht, steht oben unter „Offen".

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
- **Am Rechner** gehen Pfeiltasten oder WASD, die Leertaste wartet, nach der Tür beginnt die Eingabetaste eine neue Fahrt.
- **Reduzierte Bewegung:** Das Bild ruckt beim Schienenstoß nicht, der Schlafende atmet nicht sichtbar. Lampen und Schatten bewegen sich weiter, weil sie die Auskunft tragen.
- **Töne:** Schritt, Tasche, Klick der Lampe, Knips, Ta-tack. Kein Ton bei Eingaben, die nicht gehen.
- **Der Satz bleibt stehen, wenn eine schnelle Eingabe sein Erscheinen abgekürzt hat,** und verschwindet erst mit der Eingabe danach. Sonst sähe ihn nie, wer schnell tippt.

### Speicher und Protokoll

- **Eigener Schlüssel `endstation.freier-platz.1`.** Der Stand des Hauptspiels wird weder gelesen noch geschrieben.
- **Das Protokoll wird nach jeder Eingabe gesichert,** nicht erst an der Tür. Warum: Gibt eine Testperson auf, bleibt die abgebrochene Fahrt lesbar.
- **Eingaben ohne Wirkung stehen als Punkt in der Folge.** Warum: Der Spieltest fragt, ob jemand „wahllos überall" tippt.
- **Die aufgehobenen Karten sind nur im Protokoll zu sehen,** als Zeile aus `+` und `-`. Im Spiel gibt es keine Sammlung.
- **`#probe` an der Adresse** macht den Zustand von außen lesbar. Das braucht das Prüfwerkzeug.

### Nicht geprüft

- Kein echtes iPhone und keine WebKit-Engine, nur Chromium mit iPhone-Profil.
- Der Ton wurde nicht angehört.
- Ob jemand die Regel errät und ob es komisch ist, zeigt nur der Spieltest.

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
