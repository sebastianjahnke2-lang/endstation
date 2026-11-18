---
name: neue-szene
description: Einen Wagen, eine Autorität oder eine Szene ins Spiel bringen. Führt durch Bedingungen, zwei Wege und Tests. Verwenden, sobald etwas Neues in den Zug kommt, das der Spieler betreten oder dem er begegnen kann.
---

# Neue Szene

Gilt für jeden neuen Wagen (Kampfwagen, Autoritätswagen, Speisewagen, leerer Wagen, Spiegelwagen, Kraftprobe), jede neue Autorität und jeden neuen Gegnertyp.

Stand Etappe 0: Die genannten Ordner und Tests entstehen erst in Etappe 1. Am Ende von Etappe 1 wird dieser Skill an die echten Dateinamen angepasst.

## 1. Darf sie hinein?

- Steht sie in der **aktuellen** Etappe von `docs/FAHRPLAN.md`? Wenn nicht: ein Satz in `docs/IDEEN.md`, nichts bauen, fertig.
- Dient sie dem Kernsatz, und löst sie mehr als ein Problem zugleich? Wenn nicht: streichen.

## 2. Steckbrief vor dem Code

Als Kommentar am Kopf der Szenendatei:

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
- Höchstens sechs Gegner gleichzeitig.
- Ein Wagen dauert 30 bis 90 Sekunden.
- Im Speisewagen und jedem anderen sicheren Ort passiert nie etwas Schlimmes.
- Verwirrung trifft nie die Steuerung, außer im freiwilligen Ort (Etappe 4).

## 5. Bauen

- Regeln nur in `src/kern/`, ohne `window` und `document`. Die Szene meldet Ereignisse, `src/anzeige/` spielt sie ab.
- Zufall nur aus dem Seed-Generator.
- Texte nur in `src/texte.js`. Hinweise haben höchstens drei Worte und erscheinen erst, wenn die Situation eintritt.
- Figuren: Gegner ohne Gesicht, mit einer kleinen menschlichen Geste im Stand, als Umriss erkennbar. Keine Tiere.
- Keine Animation über 150 ms, alles Überspringbare ist überspringbar, kein Zwischenbildschirm.

## 6. Tests

Keine Mechanik ohne Test. Für jede neue Szene:

- **Fuzz:** Die Szene ist im Fuzz-Test enthalten. Keine Fehler, keine überlappenden Figuren, Tür immer erreichbar.
- **Je Weg ein Test:** Ein festes Skript oder ein Bot geht den Kampfweg und kommt durch. Ein zweiter geht den Weg des Verstehens und kommt durch.
- **Ankündigung:** Kein Schaden ohne rotes Feld im Zug davor. Von jedem markierten Feld gibt es einen sicheren Schritt.
- **Bots:** Kämpfer, Ausweicher und Ausgewogener können die Szene bestehen.
- **Regie** (ab Etappe 3): Über viele Seeds kommt die Szene weder nie noch ständig.

## 7. Abschluss

1. Skill `ton-check` über neue Texte und Symbole.
2. Skill `balance-pruefen`.
3. Im Browser bei 390×700 und 360×600 beide Wege selbst durchspielen.
4. Steckbrief-Entscheidungen in `docs/ENTSCHEIDUNGEN.md`, neue Dateien in `CLAUDE.md` unter Architektur.
