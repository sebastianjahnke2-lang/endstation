# Auftrag: Prototyp „Kontrolle"

Wortlaut des Auftraggebers vom 21.11. Unverändert.

---

NEUER AUFTRAG: Prototyp „Kontrolle"

Vergiss die offene Frage zur Musik. Endstation und „Der freie Platz" bleiben unangetastet. Speichere diesen Auftrag wörtlich unter docs/auftraege/kontrolle.md und halte docs/STAND.md aktuell.

ZIEL
Ein einziger spielbarer Wagen, der eine Frage beantwortet: Startet man von selbst noch einmal? Platzhalter-Grafik reicht. Kein Menü, keine Geschichte, kein Fortschritt.

DAS SPIEL IN EINEM SATZ
Du bist der Kontrolleur im Nachtzug: Finde den Fahrgast ohne Fahrkarte, bevor der Zug hält.

REGELN
- Eigener Ordner prototyp/kontrolle/, gleiche Bauweise wie prototyp/freier-platz/: Regeln ohne Browser, eigene Tests, eigene Seite. Raster, Sitzreihen, Schaffner-Figur, Zange, Anzeige und Eingabe von dort leihen.
- iPhone hochkant, ein Daumen, rundenbasiert, kein Zufall innerhalb eines Halts.
- Der Spieler ist der Kontrolleur und startet unten im Gang. Ein Zug ist: ein Feld gehen, den Fahrgast neben sich kontrollieren, oder warten.
- Im Wagen sitzen etwa acht Fahrgäste. Genau einer hat keine Fahrkarte.
- Es wird nie eine Fahrkarte gelesen oder verglichen. Den Schwarzfahrer erkennt man nur an seinem Verhalten. Das ist der Kern des Spiels.
- Bis zum Halt bleiben wenige Züge (Startwert 12). Die Anzeige zeigt sie als Strecke, die kürzer wird, nicht als Zahl.
- Gewonnen: den Richtigen kontrolliert. Die Zange schnappt zu, das Bild hält kurz an, eigener Ton.
- Verloren: Der Zug hält, der Schwarzfahrer steht auf und steigt sichtbar aus.
- Die eine Masche dieses Wagens: der Platzwechsler. Kommt der Kontrolleur in seine Reihe oder die daneben, steht er auf und setzt sich weiter weg. Das kostet ihn einen Zug und ist zu sehen. Alle anderen bleiben sitzen.
- Preis: Jede Kontrolle kostet einen Zug. Ein Fahrgast schläft; ihn zu kontrollieren kostet zwei.
- Drei Halte hintereinander mit je neuer Sitzordnung. Danach eine Zeile wie „2 von 3 erwischt". Ein Tipp startet sofort neu.
- Kein weiterer Text, kein Tutorial. Geräusche: Schritt, Knipsen, Türzischen am Halt. Ohne Ton fehlt nichts.

LEITSÄTZE, an denen du jede Entscheidung misst
1. Risiko und Gewinn liegen nah beieinander. Abwarten hat einen Preis.
2. Gelernt wird im Spiel. Das Wichtige ist nicht zu verfehlen.
3. Ein neuer Gedanke je Wagen.
4. Die Lage ist in fünf Sekunden lesbar, ohne Sprache.
5. An entscheidenden Stellen hält das Spiel kurz an.
6. Etwas wächst Zug für Zug, und der Spieler kann es abbauen.
7. Nie ein Punktestand, nie ein Bindungstrick.

TESTS
- Jede der drei Sitzordnungen ist innerhalb der Züge lösbar, und zwar nicht durch blindes Durchkontrollieren aller Fahrgäste.
- Gleiche Eingaben ergeben gleichen Verlauf. Passt auf 360×600.

ABGABE
Pull Request, Adresse zum Testen am iPhone, fünf Zeilen Bericht. Danach nichts Neues, bis ich mich melde.

---

Nachtrag vom 21.11., wörtlich (Antwort auf die offene Frage zu festen Sitzordnungen):

Zu Punkt 5: Ja. Beim Neustart neue Sitzordnungen auslosen, innerhalb eines Halts bleibt es ohne Zufall. Jede ausgeloste Ordnung muss lösbar sein und darf nicht durch Durchkontrollieren der Reihe nach zu schaffen sein, das prüft ein Test. Auch der schlafende Fahrgast und die Farben werden neu verteilt. Danach Pull Request und kurzer Bericht.
