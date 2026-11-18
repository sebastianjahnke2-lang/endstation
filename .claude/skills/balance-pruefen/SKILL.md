---
name: balance-pruefen
description: Die drei Bots (Kämpfer, Ausweicher, Ausgewogener) über viele Fahrten laufen lassen und berichten, ob die Schwierigkeit zum Fahrplan passt. Verwenden nach jeder Änderung an Zahlen, Gegnern oder Wagen und am Ende jeder Etappe.
---

# Balance prüfen

Stand Etappe 0: Bots und der Befehl `npm run balance` entstehen in Etappe 1. Bis dahin gibt es nichts auszuführen. Am Ende von Etappe 1 wird dieser Skill an den echten Befehl und seine Ausgabe angepasst.

## Ablauf

1. `npm test` muss grün sein. Ein roter Fuzz-Test wird zuerst behoben, vorher sind Balance-Zahlen wertlos.
2. `npm run balance` ausführen. Der Lauf nutzt feste Seeds (Fahrt 1 bis 500 je Bot), damit zwei Läufe vergleichbar sind.
3. Die Zahlen mit den Zielen unten vergleichen.
4. Weicht etwas ab: **eine** Zahl ändern, neu laufen lassen, vergleichen. Nie mehrere Stellschrauben auf einmal.
5. Jede Änderung in `docs/ENTSCHEIDUNGEN.md` notieren: vorher, nachher, warum.
6. Dem Auftraggeber in drei bis fünf Sätzen berichten, ohne Tabelle und ohne Fachsprache.

## Was der Lauf ausgeben soll

Je Bot:
- Anteil der Fahrten, die den Halt erreichen
- Anteil je Wagen, der ihn übersteht
- mittlere Züge je Wagen
- mittlere Herzen am Wagenende
- häufigste Todesursachen (Gegnertyp und Wagen)
- Anteil der Züge mit voller Ruhe
- größte Zahl gleichzeitiger Gegner

## Ziele

Die festen Ziele stehen im Fahrplan. Die Zahlen in Klammern sind unsere Auslegung und Startwerte.

| Maß | Ziel |
|---|---|
| Ausgewogener erreicht den Halt | etwa die Hälfte (40 bis 60 %) |
| Ausgewogener übersteht Wagen 1 und 2 | fast immer (mindestens 95 %) |
| Kämpfer und Ausweicher | jeder kann den Halt erreichen (jeweils mindestens 15 %) |
| Abstand zwischen den drei Stilen | kein Stil läuft den anderen davon (höchstens 25 Punkte) |
| Dauer je Wagen | 30 bis 90 Sekunden (25 bis 75 Züge bei etwa 1,2 Sekunden je Zug) |
| Gegner gleichzeitig | nie mehr als sechs |
| Anstieg | Die Quote sinkt von Wagen zu Wagen, ohne Klippe (kein Wagen kostet allein mehr als 20 Punkte) |

## Grenzen

- Die Balance wird nie durch einen Verstoß gegen die Regeln des Fahrplans repariert: keine unangekündigten Angriffe, keine Muster ohne Ausweg, nicht mehr als sechs Gegner.
- Bots messen die Richtung, der Auftraggeber misst das Gefühl. Widerspricht seine Rückmeldung den Zahlen, zählt die Rückmeldung. Dann zuerst prüfen, ob der Bot wie ein Mensch spielt, und erst danach das Spiel ändern.
- Ein Bot darf nichts wissen, was ein Spieler nicht sehen kann.
