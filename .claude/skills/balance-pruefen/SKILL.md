---
name: balance-pruefen
description: Die drei Bots (Kämpfer, Ausweicher, Ausgewogener) über viele Fahrten laufen lassen und berichten, ob die Schwierigkeit zum Fahrplan passt. Verwenden nach jeder Änderung an Zahlen, Gegnern oder Wagen und am Ende jeder Etappe.
---

# Balance prüfen

Die Bots stehen in `tests/bots.js`, der Bericht in `tests/balance.js`, die festen Grenzen in `tests/bots.test.js`.

## Ablauf

1. `npm test` muss grün sein. Ein roter Fuzz-Test wird zuerst behoben, vorher sind Balance-Zahlen wertlos.
2. `npm run balance` ausführen. Der Lauf nutzt feste Seeds (Fahrt 1 bis 500 je Bot), damit zwei Läufe vergleichbar sind. Der ausgewogene Bot läuft zweimal: fehlerfrei und mit Unachtsamkeit (jeder zwölfte Zug zufällig). Für die Abnahme zählt der zweite Lauf.
3. Überrascht eine Zahl, die Fahrt mit `node werkzeug/spur.mjs <bot> <seed>` Zug für Zug ansehen, bevor etwas geändert wird. Oft steckt ein Fehler im Wagen oder im Bot dahinter und keine falsche Zahl.
4. Die Zahlen mit den Zielen unten vergleichen.
5. Weicht etwas ab: **eine** Zahl ändern, neu laufen lassen, vergleichen. Nie mehrere Stellschrauben auf einmal.
6. Jede Änderung in `docs/ENTSCHEIDUNGEN.md` notieren: vorher, nachher, warum.
7. Dem Auftraggeber in drei bis fünf Sätzen berichten, ohne Tabelle und ohne Fachsprache.

## Was der Bericht zeigt

Je Bot eine Kopfzeile (Halt erreicht, hängende Fahrten, ungültige Züge, Anteil der Züge mit voller Ruhe) und je Wagen eine Zeile:

- erreicht und geschafft: Anteil aller Fahrten
- Züge: Mittel und Spanne der geschafften Wagen
- Treffer und ausgewichen: Mittel je Fahrt in diesem Wagen
- Herzen: Mittel am Ende des Wagens
- Gegner: größte Zahl gleichzeitig

Darunter stehen die häufigsten Tode nach Wagen und Gegnertyp.

## Ziele

Die festen Ziele stehen im Fahrplan. Die Zahlen in Klammern sind unsere Auslegung und Startwerte.

| Maß | Ziel |
|---|---|
| Ausgewogener mit Unachtsamkeit erreicht den Halt | etwa die Hälfte (40 bis 60 %) |
| Ausgewogener übersteht Wagen 1 und 2 | fast immer (mindestens 95 %) |
| Kämpfer und Ausweicher | ab Etappe 3: jeder kann den Halt erreichen (jeweils mindestens 15 %). Stand Etappe 1: Kämpfer 0 %, Ausweicher 55 % |
| Abstand zwischen den drei Stilen | ab Etappe 3: kein Stil läuft den anderen davon (höchstens 25 Punkte) |
| Dauer je Wagen | 30 bis 90 Sekunden (25 bis 75 Züge bei etwa 1,2 Sekunden je Zug) |
| Gegner gleichzeitig | nie mehr als sechs |
| Anstieg | Die Treffer je Wagen steigen von Wagen zu Wagen. Die meisten Fahrten enden im letzten Wagen, weil Herzen sich nicht erholen |
| Hänger | keine Fahrt bleibt hängen, kein Bot macht ungültige Züge |

## Grenzen

- Die Balance wird nie durch einen Verstoß gegen die Regeln des Fahrplans repariert: keine unangekündigten Angriffe, keine Muster ohne Ausweg, nicht mehr als sechs Gegner.
- Bots messen die Richtung, der Auftraggeber misst das Gefühl. Widerspricht seine Rückmeldung den Zahlen, zählt die Rückmeldung. Dann zuerst prüfen, ob der Bot wie ein Mensch spielt, und erst danach das Spiel ändern.
- Ein Bot darf nichts wissen, was ein Spieler nicht sehen kann.
