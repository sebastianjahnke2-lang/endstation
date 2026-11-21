# Auftrag: Leitsätze und die ersten zehn Minuten

Wortlaut des Auftraggebers vom 21.11., in drei Teilen übergeben. Unverändert.

---

TEIL 1 VON 3 – noch nicht anfangen, erst nach „fertig" in Teil 3

AUFTRAG: Leitsätze und die ersten zehn Minuten

Speichere alle drei Teile wörtlich unter docs/auftraege/leitsaetze.md. Lege den folgenden Text wörtlich als docs/PRINZIPIEN.md ab und trage in CLAUDE.md unter „Zu Beginn jeder Sitzung" ein: „docs/PRINZIPIEN.md lesen. Jede Änderung nennt den Leitsatz, dem sie dient."

# Leitsätze
Aus Aussagen japanischer Entwickler (Sakurai, Miyamoto, Tezuka, Nakago, Hayashida, Aonuma, Iwata, Sakamoto, Hino) und aus Forschung zu Motivation und Lernen. Rang: harte Regeln der Vision, dann Spieltest, dann diese Leitsätze. Widerspricht ein Leitsatz der Vision, kommt das unter „Offen" in docs/ENTSCHEIDUNGEN.md, und der Auftraggeber entscheidet.

1. Der Spieler löst die Spannung selbst. Jede Lage hat ein Risiko, einen Gewinn und einen Preis fürs Abwarten.
2. Gelernt wird im Spiel, nie davor. Das Wichtige ist nicht zu verfehlen.
3. Der Einstieg wird zuletzt gebaut und nach jeder Etappe neu geprüft.
4. Ein neuer Gedanke je Wagen, in vier Schritten: zeigen, ausbauen, drehen, abschließen.
5. Die Lage eines Wagens ist in fünf Sekunden lesbar, ohne Sprache.
6. Hilfe zeigt die Richtung, nie die Lösung. Festhängen ist erlaubt, ein Ausweg bleibt immer.
7. Der Moment des Verstehens ist der Höhepunkt. Die Welt erkennt ihn an, nie ein Lobtext.
8. Jede Belohnung hat sofort eine Verwendung.
9. Wiederspielen zeigt Neues durch Wissen, nicht durch Menge.
10. Gebaut für die Bahnfahrt: kurze Abschnitte, jederzeit unterbrechbar, nach der Pause weiß man sofort, wo man ist.
11. Vor dem Hinzufügen spielen. Streichen, was sich nicht richtig anfühlt, auch wenn es gut gemacht ist.
12. Selbstbestimmung, Können, Verbundenheit. Nie ein Bindungstrick, nie ein Punktestand.

Vor jedem neuen Wagen (auch in .claude/skills/neue-szene eintragen): auf Papier vorspielen. Was will der Spieler als Nächstes tun, und was passiert, wenn er etwas anderes tut?

---

TEIL 2 VON 3 – noch nicht anfangen

ZUERST PRÜFEN (Bericht in höchstens 15 Zeilen, dann ohne Rückfrage Schritt 1 bis 3)
- Lies docs/STAND.md, FAHRPLAN, VISION, ENTSCHEIDUNGEN. Nenne, welche vorhandenen Mechaniken die Schritte unten berühren.
- Prüfe jeden Schritt gegen Vision und Leitsätze. Widersprüche unter „Offen" eintragen, nicht selbst entscheiden.
- Ziel ist ein kleiner spielbarer Ausschnitt: die ersten zehn Minuten eines Erstspielers, von Wagen 1 bis zum Halt. Kein Neubau, keine neuen Systeme, Kernregeln bleiben.

SCHRITTE, in dieser Reihenfolge
1. Leitsätze ablegen wie in Teil 1.
2. docs/WAGEN-PRUEFUNG.md: für jeden der sieben Wagen eine Zeile: Was wird gezeigt, ausgebaut, gedreht, abgeschlossen? Wie viele Dinge sind für einen Erstspieler dort neu? Nur Befund und Vorschlag, kein Umbau.
3. Fahrt fortsetzen: Seed und Eingaben sichern, beim Öffnen nachspielen. Man steht im selben Wagen in derselben Lage. Jeder Fehler beim Laden beginnt still eine neue Fahrt.
Nach Schritt 3 anhalten: Pull Request, fünf Zeilen Bericht.

Erst nach meiner Rückmeldung:
4. Halt ohne Sperre. Das ändert meine Entscheidung vom 19.11., trag es so in docs/ENTSCHEIDUNGEN.md und im Fahrplan ein. Wer den letzten Wagen schafft, erreicht den Halt und kann aussteigen, egal wie viele Lochungen er hat. Der Schaffner locht oder nickt, er hält niemanden auf. Die Zeilen „Noch n helle Lochungen" entfallen. Lochungen bleiben als Spur: Sie bestimmen nur, was der Rückblick zeigt. Dazu: Verstehen locht. Wer den Kontrolleur durchschaut oder eine Stärke verdient, bekommt eine helle Lochung.
5. Verstehen bekommt einen Augenblick: kurzer Stillstand innerhalb der 150 ms des Fahrplans, sichtbare Reaktion der Figur, eigener Ton, kein Text. Durch jede Eingabe abkürzbar, ohne Stillstand bei reduzierter Bewegung.
6. Leerlauf vor der Tür: zwei Varianten zum Umschalten (Finger liegen lassen; Tipp auf die offene Tür läuft hin), beide nur im gefahrlosen Wagen. Ich wähle am Gerät.
7. Wagen 1 zuletzt neu fassen: höchstens eine neue Sache, das erste Ausweichen unvermeidbar und gefahrlos. Hinweiswörter nur, wenn es ohne nicht geht.

---

TEIL 3 VON 3

TECHNIK
- Vorhandene Bauweise: Regeln in src/kern ohne Browser, Texte nur in src/texte.js, Speicher mit Anfangswert und Test, Safari ab iOS 13, keine Bibliotheken, kein Netz.
- Jede Änderung mit Test. npm run build und npm test grün. npm run balance vorher und nachher, Zahlen in den Bericht.

ABNAHME
- Fortsetzen: Ein Test spielt eine gespeicherte Fahrt nach und erhält denselben Zustand. Kaputter oder leerer Speicher startet ohne Fehler.
- Halt: Ein Test zeigt, dass man mit null hellen Lochungen aussteigen kann. Nichts im Spiel verlangt mehr eine Mindestzahl. Der Rückblick zeigt weiter je Lochung eine Tatsache, ohne Lochung nur die Ankunftszeit.
- Die Schwierigkeit der Bots bleibt etwa gleich. Größere Sprünge meldest du, statt nachzuregeln.
- Kein neuer Text außerhalb von src/texte.js, Ton-Test grün, 360×600 passt.

SPIELTEST (als docs/SPIELTEST-hauptspiel.md)
Drei bis fünf Personen, einziger Satz: „Spiel mal." Beobachten: Sekunden bis zum ersten Ausweichen; wo jemand aufgibt; ob eine zweite Fahrt von selbst beginnt; ob der Halt in drei Fahrten erreicht wird. Danach fragen: „Was wollte der Kontrolleur?", „Was ist passiert, als er ging?", „Hat dich das Spiel bewertet?"

NICHT BAUEN
Etappe 3, neue Systeme, Tagesaufgaben, Serien, Punktestände, Zufallsbelohnungen, Lobtexte, Musik im Hauptspiel. Ideen dazu nur in docs/IDEEN.md: Stärken auffindbar machen; je Wagen ein Detail, das erst mit Wissen Bedeutung bekommt.

OFFEN, nicht selbst entscheiden (unter „Offen" eintragen)
- Kämpfer-Bot erreicht den Halt nie; die Vision nennt drei gleichwertige Wege.
- Etappe 3 zählt den Spielstil; meine Vorgabe lautet: keine Persönlichkeitstests.
- Rätsel oder Taktik: entscheidet der Spieltest des Prototyps.
- docs/VISION.md wird unter der Spieladresse mit ausgeliefert.

fertig
