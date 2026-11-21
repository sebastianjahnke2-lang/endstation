---
name: neue-szene
description: Einen Wagen, eine Autorität oder eine Szene ins Spiel bringen. Führt durch Bedingungen, zwei Wege und Tests. Verwenden, sobald etwas Neues in den Zug kommt, das der Spieler betreten oder dem er begegnen kann.
---

# Neue Szene

Gilt für jeden neuen Wagen (Kampfwagen, Autoritätswagen, Speisewagen, leerer Wagen, Spiegelwagen, Kraftprobe), jede neue Autorität und jeden neuen Gegnertyp.

Stand 19.11.: Es gibt fünf Kampfwagen, den Mittelwagen als Autoritätswagen, den Speisewagen als sicheren Ort und vier Gegnertypen (Pendler, Reisegruppe, Drängler, Kontrolleur). Vorbild für alles Neue sind `src/kern/wagen.js` und `src/kern/gegner.js`.

## 1. Darf sie hinein?

- Steht sie in der **aktuellen** Etappe von `docs/FAHRPLAN.md`? Wenn nicht: ein Satz in `docs/IDEEN.md`, nichts bauen, fertig.
- Dient sie dem Kernsatz, und löst sie mehr als ein Problem zugleich? Wenn nicht: streichen.

## 1a. Auf Papier vorspielen (Leitsätze, `docs/PRINZIPIEN.md`)

Vor jedem neuen Wagen, bevor Code entsteht: den Wagen auf Papier Zug für Zug vorspielen. Zwei Fragen schriftlich beantworten:
- Was will der Spieler als Nächstes tun?
- Was passiert, wenn er etwas anderes tut?

Dazu: ein neuer Gedanke je Wagen (zeigen, ausbauen, drehen, abschließen) und die Lage in fünf Sekunden lesbar, ohne Sprache.

## 2. Steckbrief vor dem Code

Als Kommentar über dem Eintrag in `src/kern/wagen.js` oder über dem Verhalten in `src/kern/gegner.js`:

- **Name** für die Zuganzeige, aus dem Bahnalltag, kein Markenname.
- **Typ**: einer der sechs Szenentypen.
- **Facette**: wofür die Figur steht. Nur für uns, dieses Wort erscheint nie im Spiel.
- **Bedingungen**: wann sie kommen darf (Wagennummer, Herzen, Muster des Spielers, Szene davor).
- **Pause** bis zur Wiederholung und **Vorrang** gegenüber anderen Szenen (ab Etappe 3 wählt die Regie, davor ist die Reihenfolge fest).
- **Auslöser**: Was der Spieler tut und was darauf folgt. Auslöser reagieren immer gleich, damit man sie durchschauen kann.

Fest bleiben immer: Einstieg, Autoritätswagen in der Mitte, Speisewagen danach, der Halt am Ende.

## 3. Zwei Wege

Jede Szene lässt sich auf mindestens zwei gleichwertige Arten lösen. Aufschreiben, bevor gebaut wird:

- **Kämpfen (brechen):** Womit, wie viele Züge etwa, was kostet es?
- **Verstehen (durchschauen):** die Regel in einem Satz. Sie muss allein durch Hinsehen erkennbar sein, immer gleich reagieren und steht nirgends als Text.
- **Aufbrechen** (ab Etappe 2): Jede Tür gibt nach dreimal Dagegenlaufen nach und kostet 1 Herz. Die Szene darf das nicht verhindern.

Für Autoritäten zusätzlich:
- genau eine Taktik aus: Optionen kontrollieren, abhängig machen, provozieren, spiegeln. In eigenen Worten der Figur, im Spiel nie benannt.
- Der Spieler wird nie fürs Manipulieren belohnt.

Kein Weg wird gelobt oder getadelt. Jeder hat Folgen, keiner eine Strafe.

## 4. Fairness, gilt ausnahmslos

- Jeder echte Angriff ist einen Zug vorher als rote Felder angekündigt.
- Jedes Muster lässt sich mit einem Schritt verlassen.
- Stirbt ein Gegner, verfällt sein angekündigter Angriff. Gegner blockieren einander und treffen sich nicht.
- Alle freien Felder sind erreichbar, die Tür immer.
- Bauregel: Jedes freie Feld hat einen freien Nachbarn links oder rechts und einen oben oder unten. Keine Sackgassen, keine einspurigen Gänge.
- Ein Gegner tritt heran oder kündigt an, nie beides im selben Zug. Höchstens ein Treffer je Zug (ein Herz, beim Kontrolleur zwei).
- Höchstens sechs Gegner gleichzeitig.
- Ein Wagen dauert 30 bis 90 Sekunden.
- Im Speisewagen und jedem anderen sicheren Ort passiert nie etwas Schlimmes.
- Verwirrung trifft nie die Steuerung, außer im freiwilligen Ort (Etappe 4).

## 5. Bauen

- **Wagen:** Eintrag in `WAGENPLAENE` in `src/kern/wagen.js` (Plan mit 8 Zeilen zu 5 Zeichen, Gegner mit möglichen Startplätzen). Name für die Anzeige in `TEXTE.wagen` in `src/texte.js`. Ein neues Hindernis braucht ein Zeichen im Plan und ein Bild in `maleHindernis` in `src/anzeige/figuren.js`.
- **Gegner:** Werte in `GEGNERWERTE`, Zustand in `neuerGegner`, Angriff in `loeseAnsagenEin`, Bewegung und Ankündigung in `planeGegner`, alles in `src/kern/gegner.js`. Jede Handlung meldet ein Ereignis mit Phase 1 oder 2. Bild in `MALER` in `src/anzeige/figuren.js`, Abspielen des Ereignisses in `wendeAn` in `src/anzeige/anzeige.js`.
- Regeln nur in `src/kern/`, ohne `window` und `document`. Zufall nur aus `src/kern/zufall.js`, Gegner handeln ganz ohne Zufall.
- Texte nur in `src/texte.js`. Hinweise haben höchstens drei Worte und erscheinen erst, wenn die Situation eintritt.
- Figuren: Gegner ohne Gesicht, mit einer kleinen menschlichen Geste im Stand, als Umriss erkennbar. Keine Tiere.
- Keine Bewegung über 150 ms, alles Überspringbare ist überspringbar, kein Zwischenbildschirm.
- Namen auf oberster Ebene müssen im ganzen Projekt eindeutig sein, sonst bricht der Build ab.

## 6. Tests

Keine Mechanik ohne Test. Für jede neue Szene:

- **Regel als Szene:** In `tests/regeln.test.js` baut `szene({...})` einen leeren Wagen mit Figuren an festen Plätzen. Je Regel ein Test, je Weg ein Test (Kampfweg kommt durch, Weg des Verstehens kommt durch).
- **Wagen:** `tests/wagen.test.js` prüft jede Auslosung von selbst: verbunden, Bauregel, höchstens sechs Gegner, Abstand zum Start.
- **Fuzz:** `tests/fuzz.test.js` sieht den neuen Wagen von selbst. Für einen neuen Gegnertyp die Prüfungen in `pruefeZustand` ergänzen. Kein Schaden ohne Rot im Zug davor, vom Feld des Spielers führt aus jedem Muster ein Schritt hinaus.
- **Bots:** In `tests/bots.js` lernen die drei Bots den Umgang mit dem Neuen. `tests/bots.test.js` muss grün bleiben, kein Bot darf hängen.
- **Regie** (ab Etappe 3): Über viele Seeds kommt die Szene weder nie noch ständig.

## 7. Abschluss

1. Skill `ton-check` über neue Texte und Symbole.
2. Skill `balance-pruefen`.
3. Im Browser prüfen, zuerst in iPhone-Größe: `node werkzeug/bedienung.mjs 390x844` und `node werkzeug/schau.mjs`, Bilder ansehen. Dazu die Größen aus `CLAUDE.md`. Eine überraschende Bot-Fahrt zeigt `node werkzeug/spur.mjs` Zug für Zug.
4. Steckbrief-Entscheidungen in `docs/ENTSCHEIDUNGEN.md`, neue Dateien in `CLAUDE.md` unter Architektur.
