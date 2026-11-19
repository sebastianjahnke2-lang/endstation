# Arbeitsauftrag: Prototyp „Der freie Platz"

Wortlaut des Auftrags vom 18.11., unverändert abgelegt, damit spätere Sitzungen ihn kennen.
Gebaut ist er in `prototyp/freier-platz/`. Abweichungen und offene Widersprüche stehen in `docs/ENTSCHEIDUNGEN.md`.

---

ARBEITSAUFTRAG – Prototyp „Der freie Platz" (Spiel „Endstation")

Ich bin kein Entwickler und teste am iPhone. Schreib mir kurz und auf Deutsch.

## 0. ZUERST: PROJEKTSTAND PRÜFEN
- Lies, was im Repository liegt (CLAUDE.md, docs/, index.html, Tests, Ordner). Schreib mir in höchstens zehn Zeilen, was vorhanden ist und welche Technik und Muster benutzt werden. Erfinde nichts; wenn das Repo fast leer ist, sag das.
- Danach baust du ohne Rückfrage den Prototyp. Halte nur an, wenn er vorhandenen Code beschädigen würde.
- Vorhandene Technik, Dateistruktur, Farben und Schrift haben Vorrang vor meinen Technikvorschlägen in Abschnitt 11. Kein Neubau und keine Änderung des Hauptspiels, seiner Regeln oder von docs/VISION.md.
- Widersprüche zwischen diesem Auftrag und vorhandenen Dokumenten trägst du in docs/ENTSCHEIDUNGEN.md unter „Offen" ein (Datei anlegen, falls sie fehlt). Entscheide sie nicht selbst.

## 1. KURZBESCHREIBUNG UND ZIEL
„Endstation" ist ein rundenbasiertes Rätselspiel in einem Nachtzug. Jeder Wagen enthält eine Regel, die man durchschauen oder brechen kann. Der Prototyp ist ein einzelner Wagen, getrennt vom Hauptspiel.
Szene: Der Spieler sitzt am Gangplatz, seine Tasche liegt auf dem Fensterplatz daneben. Der Schaffner kommt und sagt: „Bitte den Platz freimachen." Ist die Tasche weg, wartet er weiter: Auf dem Fensterplatz liegt noch der Schatten des Spielers, den die Leselampe dorthin wirft. Für diesen Schaffner belegt auch ein Schatten einen Platz. Das ist die einzige unwirkliche Regel im Wagen. Später steht derselbe Schaffner bei einem Schlafenden fest, dessen Schatten auf dem Nebensitz liegt.
Der Prototyp soll eine Frage beantworten: Erschließen Spieler diese Regel allein aus dem, was sie sehen – ohne Erklärung, ohne Zeitdruck, mit einem Daumen – und ist das trocken-komisch statt mühsam?

## 2. VERBINDLICHE VORGABEN (vom Auftraggeber)
- iPhone, Hochformat, mit einem Daumen spielbar. Läuft offline im Browser.
- Einfache 2D-Grafik aus Formen, kein 3D. Figuren haben keine Gesichter.
- Rundenbasiert. Keine Reaktionsgeschwindigkeit, kein Zeitlimit.
- Das Spiel spiegelt, wie man spielt, nicht wie gut. Keine Benotung, kein Punktestand, kein Moralwert, kein Persönlichkeitstest, kein Lob, kein „Geschafft".
- Das Spiel erklärt nichts: kein Tutorial, keine Hinweistexte, keine Pfeile, keine leuchtenden Markierungen. Folgen von Handlungen müssen trotzdem sichtbar und nachvollziehbar sein.
- Erkenntnisse hinterlassen Lochungen auf einer Fahrkarte.
- Ton: gewöhnliche Zugfahrt, trocken, komisch, leicht melancholisch, nie kitschig. Im ganzen Wagen genau eine unwirkliche Regel. Keine Esoterik-Begriffe, Marken, Memes. Keine Figur erklärt eine Botschaft.
- Eigenständig: keine Figuren, Dialoge oder Szenen aus Filmen oder Büchern. Insbesondere keine Landschaft vor den Fenstern und keine durchscheinenden Schattenwesen. Schatten gibt es nur als flache, geworfene Schatten von Figuren im Lampenlicht.

## 3. VORSCHLÄGE
Alles in den Abschnitten 4 bis 12 sind Vorschläge aus der Konzeptprüfung, nicht vom Auftraggeber beschlossen. Setz sie so um; wo sie vorhandenen Projektentscheidungen widersprechen, gilt Abschnitt 0.

## 4. BILDSCHIRM UND BEDIENUNG (Hochformat)
- Oben: schmale Zuganzeige in Punktmatrix-Optik, zeigt „Wagen 7".
- Mitte: der Wagen als Raster, 5 Spalten × 8 Reihen, so groß wie möglich.
- Unten, Daumenzone: links die Fahrkarte, rechts der Knopf „Warten" (mindestens 64 px). Sonst nur ein kleiner Schalter für Ton an/aus.
- Wischen (irgendwo): ein Feld gehen. Antippen eines freien Nachbarfelds: ebenfalls gehen.
- Antippen eines Dings oder einer Figur in Reichweite: benutzen. Reichweite = höchstens ein Feld entfernt, auch diagonal. Trefferfläche mindestens 48 px. Außer Reichweite: kurze sichtbare Reaktion „zu weit", keine Runde.
- Muss ohne Scrollen auf 360 × 600 px passen; sichere Bereiche beachten; kein Zoom, kein Gummiband-Scrollen.
- Ton ist beim Start aus.

## 5. EINE RUNDE
- Der Spieler macht genau eine Handlung: gehen, benutzen, anstoßen oder warten.
- Danach antwortet die Welt in fester Reihenfolge: (1) Schatten neu bestimmen, (2) ein Schritt des Schaffners, (3) in jeder dritten Runde der Schienenstoß, (4) Abschluss prüfen.
- Dann steht alles still bis zur nächsten Eingabe. Nichts hängt von Sekunden ab. Kein Zufall.
- Eine unmögliche Eingabe (gegen die Wand) kostet keine Runde, zeigt aber kurz, dass es nicht geht.

## 6. WAGEN, DINGE, ZUSTÄNDE
Raster (Reihe 0 ist oben):

```
          Spalte  0  1  2  3  4
   Reihe 0        #  #  Z  #  #     Z = Zieltür, # = Wand
   Reihe 1        s  s  .  s  s     s = leerer Sitz, . = Gang
   Reihe 2        s  s  .  F  s     F = schlafender Fahrgast, Lampe B leuchtet
   Reihe 3        s  s  .  s  s
   Reihe 4        s  s  .  s  s
   Reihe 5        T  S  .  s  s     S = Spieler, T = Tasche, Lampe A leuchtet
   Reihe 6        s  s  .  s  P     P = wacher Fahrgast
   Reihe 7        #  #  K  #  #     K = Schaffner (Start)
```

- Sitze: Spalten 0–1 und 3–4 bilden je Reihe ein Paar; Fensterplätze sind 0 und 4. Zwischen den Reihen stehen Lehnen: von Sitz zu Sitz nur seitwärts, in eine Reihe nur vom Gang aus, zum Fensterplatz nur über den freien Gangplatz.
- Lampen: Nur an zwei Paaren brennt eine Leselampe – A (Reihe 5 links) und B (Reihe 2 rechts). Jede hat zwei Stellungen: FENSTER (Licht fällt vom Gang zum Fenster) und GANG (Licht fällt vom Fenster zum Gang). Start: beide FENSTER. Ausschalten kann man sie nicht. Der Lampenkopf sitzt auf der Seite, von der das Licht kommt; ein blasser Lichtkeil zeigt die Richtung.
- Schatten: Sitzt eine Figur in einem beleuchteten Paar, liegt ihr Schatten ein Feld weiter in Lichtrichtung: auf dem Nachbarsitz, auf dem Gangfeld oder – am Fensterplatz bei Stellung FENSTER – an der Wand (dann auf keinem Feld). Der Schatten hat den Umriss der Figur. Außerhalb der beiden Lampen gibt es keine Schatten.
  Start also: Schatten des Spielers auf dem Fensterplatz (0,5) unter der Tasche, deutlich größer als die Tasche und von Anfang an sichtbar; Schatten des Schlafenden auf (4,2).
- Tasche: liegt auf (0,5) oder ist beim Spieler. Zurücklegen geht nicht.
- Schlafender: schläft oder ist wach; bleibt immer auf (3,2).
- „Falsch belegt" ist ein Sitz, auf dem niemand sitzt, auf dem aber eine Tasche oder ein Schatten liegt.

## 7. EINGABE → WIRKUNG
- Gehen auf ein freies Gang- oder Sitzfeld: Der Spieler rückt dorthin.
- Tasche (antippen oder dagegenwischen): Der Spieler nimmt sie; sie bleibt bei ihm.
- Lampe (antippen; in Reichweite, wenn der Spieler im Paar sitzt oder höchstens ein Feld vom Gangplatz des Paares entfernt steht): Die Stellung wechselt, der Schatten gleitet sichtbar auf sein neues Feld.
- Schlafender (antippen): wacht auf, sieht zum Schaffner, dann zum Nebensitz, hebt die Schultern, bleibt sitzen. Löst nichts.
- Schaffner antippen: Wartet er gerade, wiederholt er seinen Satz; kostet eine Runde. Sonst nichts.
- Gegen den Schaffner wischen: Würde er in dieser Runde ohnehin weitergehen, rückt der Spieler einfach nach. Bleibt er stehen, ist es „Anstoßen": Er dreht die Mütze zum Spieler, sonst nichts; danach wird keine Eingabe vorgemerkt. Direkt noch einmal dagegenwischen ist „Vorbeidrängen": Der Spieler nimmt sein Feld, der Schaffner weicht auf das Feld aus, von dem der Spieler kam, wenn es ein Gangfeld ist, sonst ein Gangfeld nach unten.
- Warten: nichts, die Welt macht ihren Schritt.

## 8. DER SCHAFFNER
Er geht im Gang von Reihe 7 nach oben und verlässt den Wagen durch die Zieltür. Pro Runde tut er genau eines, nach dieser Rangfolge:
(1) WARTEN – wenn in seiner Reihe ein Sitz falsch belegt ist. Er zeigt mit der Lochzange genau auf das störende Ding (Tasche vor Schatten) und sagt beim ersten Mal in dieser Reihe: „Bitte den Platz freimachen."
(2) LOCHEN – sonst, wenn in seiner Reihe jemand Waches sitzt, den er noch nicht gelocht hat (auch der Spieler). Beim Spieler entsteht die Lochung auf der Fahrkarte.
(3) GRÜSSEN – sonst, wenn dort der Schlafende sitzt und noch nicht gegrüßt wurde: Er tippt an die Mütze. Er weckt niemanden.
(4) GEHEN – sonst ein Feld nach oben. Steht dort der Spieler, bleibt er stehen (Zustand STEHEN).
Er wird nie schneller, lauter oder ärgerlich und steht beliebig lange.
Erwarteter Verlauf, wenn der Spieler zunächst nur wartet: Runde 1 Reihe 6, Runde 2 locht er P, Runde 3 Reihe 5, Runde 4 der Satz.

## 9. RÜCKMELDUNGEN UND HINWEISE (nur diese)
- Zeiger: Die Lochzange zielt immer genau auf das störende Ding und folgt ihm. Ist die Tasche weg, bleibt die Zange oben und tippt einmal auf den Schatten.
- Schienenstoß (jede dritte Runde): Das Bild ruckt 2 px, beide Lampen schwingen, ihre Schatten zucken ein paar Pixel in Lichtrichtung und zurück; wartet der Schaffner wegen eines Schattens, zuckt die Zange mit. Ton dazu: „Ta-tack".
- Fällt ein Schatten auf das Feld des Schaffners, weicht er mit einem kleinen Schritt aus und kommt zurück; beim Weitergehen macht er einen sichtbar großen Schritt darüber.
- Zufrieden: kurzes Nicken, dann Regel (2), (3) oder (4).
- Lochen: Die Zange schließt, ein Schnipsel fällt. Ton: „Knips".
- Der Satz erscheint als kleine Sprechblase und verschwindet mit der nächsten Eingabe.
- Jedes Geräusch hat ein sichtbares Gegenstück. Ohne Ton darf keine Information fehlen.
- Keine weiteren Texte, Symbole oder Hervorhebungen. Keine Fehlertöne.

## 10. ABSCHLUSS, FAHRKARTE, LOCHUNG
- Der Wagen endet, sobald der Spieler auf der Zieltür steht – egal, was sonst geschehen ist. Den Weg versperrt höchstens der Schaffner, und an ihm kommt man durch Vorbeidrängen immer vorbei.
- Fahrkarte: schlichtes Papier ohne vorgedruckte Felder und ohne Zahlen. Pro Fahrt eine frische Karte.
- Lochung: höchstens eine, vom Schaffner nach Regel (2), in seiner eigenen Lochform (schmale Sichel). Sie schaltet nichts frei und wird nirgends gezählt.
- Nach der Tür nennt die Zuganzeige höchstens zwei Tatsachen über den Wagen, in dieser Rangfolge, sonst nur die Uhrzeit:
  „Der Schaffner wartet in Reihe N." (wenn er im Zustand WARTEN ist)
  „Auf Platz 51 liegt eine Tasche." (wenn sie dort noch liegt)
  „Der Fahrgast in Reihe 2 ist wach." (wenn er geweckt wurde)
  Darunter die Karte und der Knopf „Neue Fahrt". Kein Urteil, kein Wort über den Spieler.

## 11. TECHNIK (kleiner Vorschlag)
- Folge dem Muster des Projekts. Gibt es keins: ein Ordner prototyp/freier-platz/ mit index.html (Darstellung auf Canvas, Eingabe) und einer Logikdatei ohne Browser-Abhängigkeiten, damit sie in Node testbar ist. Keine Frameworks, keine Bibliotheken, keine externen Dateien oder Schriften. Begründung: Der Prototyp soll das Hauptspiel nicht berühren und per eigener Adresse testbar sein.
- Logik als reine Funktion: Zustand + Handlung → neuer Zustand + Liste von Ereignissen. Die Darstellung spielt die Ereignisse nacheinander ab (je etwa 150–350 ms) und merkt währenddessen höchstens eine Eingabe vor.
- Tests in Node:
  (a) Gleiche Eingaben ergeben gleiche Ereignisse.
  (b) Vollständige Suche über alle erreichbaren Zustände: Von jedem aus ist die Zieltür erreichbar; der Schaffner steht nie auf einem Sitz und nie auf dem Feld des Spielers; der Zustand WARTEN kommt nur bei einem falsch belegten Sitz in seiner Reihe vor.
  (c) Es gibt einen Weg zur Lochung ohne Vorbeidrängen und ohne Wecken.
  (d) Feste Abläufe: Tasche → Lampe A → Lochung → Schaffner wartet in Reihe 2 → Lampe B → er grüßt und geht. Außerdem: „ans Fenster rutschen", „sofort losgehen und Tasche liegen lassen", „Vorbeidrängen".
- Wenn möglich: Bildschirmfotos bei 390 × 844 und 360 × 600 für Start, Satz, Schatten im Gang, Abschluss.
- Baue in zwei Schritten: erst die Szene am eigenen Platz mit Tests, dann den Schlafenden. Wird der zweite Schritt nicht sauber, liefere den ersten und sag es.

## 12. OFFLINE UND SPEICHERUNG
- Nach dem Laden keine Netzwerkzugriffe. Im Flugmodus spielbar, solange die Seite offen ist. Kein Service Worker in diesem Prototyp (Annahme, siehe 15).
- localStorage, immer in try/catch, eigener Schlüssel für diesen Prototyp: die letzten 20 Fahrkarten (Lochung ja/nein, Tatsachenzeilen), Ton an/aus, Testprotokoll. Wird die Seite mitten im Wagen neu geladen, beginnt der Wagen von vorn. Schlägt das Speichern fehl, läuft das Spiel ohne Speichern weiter.
- Testprotokoll (für den Auftraggeber, für Spieler unsichtbar): Langes Drücken auf die Zuganzeige zeigt für die letzte Fahrt die Runden bis Tasche weg, bis zur Lochung, bis Reihe 2 frei, bis zur Tür; wie oft Lampe, Warten, Anstoßen, Vorbeidrängen, Wecken; die Reihenfolge der Handlungen.

## 13. ABNAHMEKRITERIEN
Funktion
- Alles aus den Abschnitten 5 bis 10 verhält sich wie beschrieben; alle Tests laufen durch.
- Jede Eingabe zeigt innerhalb von 100 ms eine sichtbare Reaktion.
- Passt auf 360 × 600; alle Handlungen sind mit einem Daumen erreichbar.
- Neu laden behält die Karten; kein Absturz ohne Speicher.

Verständlichkeit
- Kein Text außer dem Satz des Schaffners, den drei Tatsachenzeilen, „Wagen 7", „Warten" und „Neue Fahrt".
- Der Zeiger zielt in jedem Zustand auf genau ein Ding. Nach dem Lampenwechsel ist ohne Ton erkennbar, wohin der Schatten gewandert ist.
- Beide Wege am eigenen Platz führen zur Lochung: Lampe schwenken oder ans Fenster rutschen.

Ton
- Der Schaffner sieht in jeder Warterunde gleich aus. Nichts blinkt, nichts jubelt, nichts tadelt.
- Nichts im Bild erinnert an eine bekannte Filmszene (siehe Abschnitt 2).

## 14. SPIELTESTPLAN (zusätzlich als docs/SPIELTEST-freier-platz.md ablegen)
Drei bis fünf Personen, die die Idee nicht kennen; die Hälfte ohne Ton. Einziger Satz vorab: „Spiel mal."
Beobachten:
- Wohin tippen sie, nachdem die Tasche weg ist? Problem: wiederholt auf Schaffner oder Fahrkarte oder wahllos überall – dann ist der Zeiger nicht lesbar.
- Wie viele Handlungen bis zur Lösung? Problem: mehr als etwa 25 oder sichtbarer Ärger.
- In Reihe 2: Greifen sie nach wenigen Handlungen zur Lampe des Schlafenden? Dann ist die Regel verstanden. Problem: erneutes Durchprobieren oder Vorbeidrängen aus Ratlosigkeit.
- Wenn der Schatten auf den Schuhen des Schaffners landet: Schmunzeln oder Stirnrunzeln?
- Erreicht der Daumen die Lampe in Reihe 2 bequem?
Danach zwei Fragen: „Was wollte der Schaffner?" (gut: der Schatten kommt in eigenen Worten vor) und „Hat dich das Spiel bewertet?" (gut: nein).
Faustregel: Nennen weniger als drei von fünf den Schatten, werden zuerst Zeiger und Schienenstoß überarbeitet, bevor etwas Neues gebaut wird.

## 15. OFFENE FRAGEN UND ANNAHMEN
- Annahme: Die Zieltür ist oben. Nutzt das Projekt eine andere Laufrichtung, dreh den Wagen entsprechend.
- Annahme: Dieser Wagen kennt keine Herzen, Gegner oder Gefahrenfelder, auch wenn das Hauptspiel sie hat.
- Annahme: Echte Offline-Installation (Service Worker, Home-Bildschirm) bleibt eine spätere Etappe.
- Offen: Verhältnis dieses Wagentyps zum bisherigen Taktik-Kern.
- Offen: Ältere Konzeptteile (helle und dunkle Lochungen, mitgezählter Spielstil, vorgedruckte Symbole auf der Karte) widersprechen Abschnitt 2. Nicht umsetzen, nur vermerken.
- Offen: Ist „Schatten" als Motiv zu deutlich? Der Test soll es zeigen.
- Offen: Ist der Schaffner dieselbe Figur wie ein vorhandener Kontrolleur?

## 16. NICHT BAUEN
Weitere Wagen, Menüs, Einstellungen, Stärken, Kämpfe, Fortschritt, sichtbare Statistiken, Animationen ohne Aussage.

## 17. ABGABE
Sag mir am Ende: die Adresse, unter der ich den Prototyp am iPhone öffne (falls GitHub Pages noch nicht aktiv ist: die nötigen Schritte einzeln), was gebaut ist, welche Tests laufen, wo du von diesem Auftrag abgewichen bist und warum.
