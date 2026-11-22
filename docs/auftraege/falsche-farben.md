# Auftrag: Prototyp „Falsche Farben"

Wortlaut des Auftraggebers vom 22.11. Unverändert.

---

NEUER AUFTRAG: Prototyp „Falsche Farben"

Lies docs/STAND.md. Häng diesen Auftrag an die Warteschlange an, danach SPIELTEST. Ändere nichts an Endstation.

Bau einen neuen Prototyp in prototyp/falsche-farben/ mit eigener Seite und eigenen Tests. Übernimm aus den anderen Prototypen, was passt (Figuren, Eingabe, Ton, Tests).

KERN
Ein Saal mit fünf Bänken zu je vier Plätzen. Gäste tragen eine von vier Farben. Sitzen vier Gäste derselben Farbe auf einer Bank, leuchten sie auf und gehen gemeinsam, die Bank wird frei. Einige Gäste zeigen eine falsche Farbe. Wer das ist, erkennt man nur am Verhalten, nie an Text.

ABLAUF
1. Rundenweise, keine Uhr. Ein Zug: den wartenden Gast an der Tür auf eine Bank setzen oder den äußersten Gast einer Bank auf eine andere umsetzen.
2. Nach jedem zweiten Zug kommt ein neuer Gast an die Tür. Warten höchstens drei an der Tür und ein vierter kommt dazu, endet der Abend. Volle Bänke räumen heißt Platz schaffen.
3. Ehrliche Gäste: Sitzen zwei gleicher Farbe nebeneinander, schimmern beide kurz.
4. Gäste mit falscher Farbe: schimmern nicht neben der Farbe, die sie zeigen. Sie schimmern neben ihrer echten Farbe. Sie sehen eine Spur kräftiger und schöner aus als die Ehrlichen.
5. Vier scheinbar gleiche auf einer Bank, darunter ein Falscher: Die Bank räumt nicht. Kurzes Innehalten, eigener Klang, der Falsche zeigt seine echte Farbe und behält sie.
6. Jede geräumte Bank lässt ein Fenster im Saal aufleuchten und fügt eine Tonschicht hinzu. Am Ende sieht man den Saal, wie er ist, keine Zahl. Dazu ein trockener, knapper Satz. Ein Tipp startet sofort neu.

LESBARKEIT
Jede Farbe hat zusätzlich eine eigene Form, zum Beispiel am Hut. Das Spiel muss ohne Farbsehen spielbar sein. Ein Falscher zeigt Farbe und Form der falschen Gruppe.

TON DER WELT
Ein warmer, goldener Saal in der Nacht. Der Ort wird nie benannt. Keine unheimlichen oder religiösen Zeichen, auch nicht in den Dokumenten.

EINSTIEG
Am Anfang kommen nur ehrliche Gäste, bis die erste Bank geräumt ist. Dann ein Falscher allein. Danach gemischt, langsam mehr. Höchstens ein einzelnes Hinweiswort, kein Erklärbildschirm.

GEFÜHL
Jedes Tippen bekommt sofort eine sichtbare Antwort. Ein Zug sperrt die nächste Eingabe nie. Angehalten wird höchstens 150 ms und nur beim Auffliegen und beim Räumen einer Bank.

LEITSÄTZE: 1, 2, 4, 5, 7, 13.

TESTS
Jeder Falsche ist durch Umsetzen und Schimmern eindeutig zu erkennen, ohne zu raten. Wer blind setzt, verliert den Abend. Gleicher Startwert ergibt den gleichen Abend. Passt auf 360×600, nichts Tippbares am unteren Rand.

Danach Pull Request und der Bericht in der üblichen Form.
