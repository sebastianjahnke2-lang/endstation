// Jede Regel des Wagens als kleine Szene.

import test from 'node:test';
import assert from 'node:assert/strict';
import { neueFahrt, runde, erzeugeFahrt, lampeInReichweite } from '../src/kern/fahrt.js';
import { falschBelegt } from '../src/kern/licht.js';
import { spiele, lage } from './hilfe.js';

const feld = (x, y) => ({ tipp: 'feld', x, y });
const lampe = (name) => ({ tipp: 'lampe', name });
const typen = (liste) => liste.map((e) => e.typ);
const finde = (liste, typ) => liste.filter((e) => e.typ === typ)[0];
const schatten = (z, von) => z.schatten.filter((s) => s.von === von)[0];

test('Anfang: Tasche am Fenster, beide Lampen auf Fenster, zwei Schatten', () => {
  const z = neueFahrt();
  assert.deepEqual(z.spieler, { x: 1, y: 5, tasche: false, gelocht: false });
  assert.equal(z.tasche, true);
  assert.deepEqual(z.lampen, { A: 'fenster', B: 'fenster' });
  assert.equal(z.schaffner.y, 7);
  // Schatten des Spielers auf dem Fensterplatz unter der Tasche, Schatten des Schlafenden am Fenster
  assert.deepEqual(schatten(z, 'spieler'), { von: 'spieler', lampe: 'A', x: 0, y: 5, wand: false });
  assert.deepEqual(schatten(z, 'schlaefer'), { von: 'schlaefer', lampe: 'B', x: 4, y: 2, wand: false });
  // außerhalb der beiden Lampen gibt es keine Schatten: der wache Fahrgast wirft keinen
  assert.equal(z.schatten.length, 2);
});

test('nur warten: Runde 1 Reihe 6, Runde 2 locht er den Fahrgast, Runde 3 Reihe 5, Runde 4 der Satz', () => {
  const { z, listen } = spiele(['warten', 'warten', 'warten', 'warten']);
  assert.deepEqual(finde(listen[0], 'schaffnerSchritt').nach, { x: 2, y: 6 });
  assert.deepEqual(finde(listen[1], 'locht'), { typ: 'locht', wen: 'wacher', x: 4, y: 6 });
  assert.deepEqual(finde(listen[2], 'schaffnerSchritt').nach, { x: 2, y: 5 });
  const wartet = finde(listen[3], 'wartet');
  assert.equal(wartet.satz, true);
  assert.equal(wartet.neu, true);
  assert.equal(wartet.reihe, 5);
  // die Zange zeigt auf die Tasche, nicht auf den Schatten darunter
  assert.deepEqual(wartet.ziel, { x: 0, y: 5, was: 'tasche' });
  assert.equal(z.schaffner.tat, 'wartet');
  assert.equal(z.spieler.gelocht, false);
});

test('er wartet beliebig lange, sagt den Satz nur einmal und sieht jede Runde gleich aus', () => {
  const { z, listen } = spiele(new Array(40).fill('warten'));
  assert.equal(z.schaffner.y, 5);
  assert.equal(z.schaffner.tat, 'wartet');
  for (const liste of listen.slice(4)) {
    const wartet = finde(liste, 'wartet');
    assert.deepEqual(wartet, { typ: 'wartet', reihe: 5, ziel: { x: 0, y: 5, was: 'tasche' }, neu: false, folgt: false, satz: false });
  }
});

test('in jeder dritten Runde kommt der Schienenstoß', () => {
  const { listen } = spiele(new Array(9).fill('warten'));
  const mitStoss = listen.map((liste) => typen(liste).includes('stoss'));
  assert.deepEqual(mitStoss, [false, false, true, false, false, true, false, false, true]);
});

test('eine unmögliche Eingabe kostet keine Runde und ändert nichts', () => {
  const z = neueFahrt();
  // nach oben und unten stehen Lehnen
  for (const richtung of ['hoch', 'runter']) {
    const ergebnis = runde(z, richtung);
    assert.equal(ergebnis.zustand, z, 'derselbe Zustand');
    assert.deepEqual(typen(ergebnis.ereignisse), ['gehtNicht']);
  }
  assert.equal(runde(z, 'unsinn').ereignisse.length, 0);
  assert.equal(runde(z, { tipp: 'lampe', name: 'C' }).ereignisse.length, 0);
});

test('die Welt antwortet in fester Reihenfolge: Schatten, Schaffner, Schienenstoß, Abschluss', () => {
  const z = lage((l) => {
    l.tasche = false;
    l.spieler.tasche = true;
    l.schaffner.y = 5;
    l.schaffner.tat = 'wartet';
    l.schaffner.ziel = { x: 0, y: 5, was: 'schatten' };
    l.schaffner.gesagt = [5];
    l.runde = 2;
  });
  const { ereignisse } = runde(z, lampe('A'));
  assert.deepEqual(typen(ereignisse), ['lampe', 'schatten', 'weichtAus', 'nickt', 'locht', 'stoss']);
});

test('Tasche: antippen oder dagegenwischen nimmt sie, sie bleibt beim Spieler', () => {
  for (const handlung of [feld(0, 5), 'links']) {
    const { z, letzte } = spiele([handlung]);
    assert.equal(typen(letzte)[0], 'nimmt');
    assert.equal(z.tasche, false);
    assert.equal(z.spieler.tasche, true);
    assert.equal(z.runde, 1);
  }
  // Zurücklegen geht nicht: Der leere Fensterplatz ist nur noch ein Platz zum Hinrutschen.
  const { z } = spiele([feld(0, 5), feld(0, 5)]);
  assert.deepEqual([z.spieler.x, z.spieler.y], [0, 5]);
  assert.equal(z.spieler.tasche, true);
  assert.equal(z.tasche, false);
});

test('Tasche: schräg über die Lehne reicht der Arm, zwei Felder weit nicht', () => {
  const schraeg = lage((l) => {
    l.spieler.x = 1;
    l.spieler.y = 4;
  });
  assert.equal(spiele([feld(0, 5)], schraeg).z.spieler.tasche, true);
  const imGang = lage((l) => {
    l.spieler.x = 2;
    l.spieler.y = 5;
  });
  const ergebnis = runde(imGang, feld(0, 5));
  assert.equal(ergebnis.zustand, imGang);
  assert.deepEqual(ergebnis.ereignisse, [{ typ: 'zuWeit', zu: { x: 0, y: 5 } }]);
});

test('Zeiger: erst die Tasche, ist sie weg, bleibt die Zange oben und wandert zum Schatten', () => {
  const { listen, z } = spiele(['warten', 'warten', 'warten', 'warten', feld(0, 5), 'warten']);
  const nachTasche = finde(listen[4], 'wartet');
  assert.deepEqual(nachTasche.ziel, { x: 0, y: 5, was: 'schatten' });
  assert.equal(nachTasche.folgt, true);
  assert.equal(nachTasche.neu, false);
  assert.equal(nachTasche.satz, false, 'der Satz fällt in dieser Reihe nur einmal');
  assert.equal(typen(listen[4]).includes('nickt'), false, 'er ist nicht zufrieden');
  // danach steht er wieder still
  assert.equal(finde(listen[5], 'wartet').folgt, false);
  assert.equal(z.schaffner.tat, 'wartet');
});

test('Lampe A schwenken: Der Schatten gleitet in den Gang, der Schaffner nickt und locht', () => {
  const { listen, z } = spiele(['warten', 'warten', 'warten', 'warten', feld(0, 5), lampe('A')]);
  const liste = listen[5];
  assert.deepEqual(finde(liste, 'lampe'), { typ: 'lampe', name: 'A', stellung: 'gang' });
  const wandert = finde(liste, 'schatten');
  assert.deepEqual([wandert.alt.x, wandert.neu.x, wandert.neu.wand], [0, 2, false]);
  // der Schatten fällt auf das Feld des Schaffners: Er weicht kurz aus
  assert.ok(typen(liste).includes('weichtAus'));
  assert.ok(typen(liste).indexOf('nickt') < typen(liste).indexOf('locht'));
  assert.deepEqual(finde(liste, 'locht'), { typ: 'locht', wen: 'spieler', x: 1, y: 5 });
  assert.equal(z.spieler.gelocht, true);
  // beim Weitergehen macht er einen großen Schritt über den Schatten
  const weiter = spiele(['warten'], z);
  assert.equal(finde(weiter.letzte, 'schaffnerSchritt').gross, true);
  assert.equal(weiter.z.schaffner.y, 4);
});

test('ans Fenster rutschen: Der Schatten fällt an die Wand, der Schaffner locht', () => {
  const { listen, z } = spiele(['links', 'links', 'warten', 'warten']);
  assert.deepEqual([z.spieler.x, z.spieler.y], [0, 5]);
  assert.deepEqual(schatten(z, 'spieler'), { von: 'spieler', lampe: 'A', x: -1, y: 5, wand: true });
  assert.deepEqual(falschBelegt(z, 5), []);
  assert.deepEqual(finde(listen[3], 'locht'), { typ: 'locht', wen: 'spieler', x: 0, y: 5 });
  assert.equal(z.spieler.gelocht, true);
});

test('am Fenster mit Licht zum Gang: Der Schatten liegt auf dem Gangplatz, die Zange folgt ihm', () => {
  const { z, letzte } = spiele(['links', 'links', lampe('A'), 'warten']);
  assert.deepEqual(schatten(z, 'spieler'), { von: 'spieler', lampe: 'A', x: 1, y: 5, wand: false });
  assert.deepEqual(finde(letzte, 'wartet').ziel, { x: 1, y: 5, was: 'schatten' });
  // zurück auf den Gangplatz: Der Schatten liegt im Gang, kein Sitz ist mehr falsch belegt
  const weiter = spiele(['rechts'], z);
  assert.deepEqual(schatten(weiter.z, 'spieler').x, 2);
  assert.ok(typen(weiter.letzte).includes('locht'));
});

test('die Lochung gibt es höchstens einmal', () => {
  const { z } = spiele(['links', 'links', 'warten', 'warten']);
  assert.equal(z.spieler.gelocht, true);
  const weiter = spiele(['rechts', 'links', 'warten', 'warten'], z);
  const alle = [].concat(...weiter.listen);
  assert.equal(alle.filter((e) => e.typ === 'locht').length, 0);
});

test('auch auf einem anderen Platz locht er, wenn dort nichts Falsches liegt', () => {
  // Tasche nehmen, aufstehen, in Reihe 3 setzen
  const { z, listen } = spiele([feld(0, 5), 'rechts', 'hoch', 'hoch', 'links', 'warten', 'warten', 'warten', 'warten']);
  const alle = [].concat(...listen);
  assert.deepEqual(alle.filter((e) => e.typ === 'locht' && e.wen === 'spieler'), [{ typ: 'locht', wen: 'spieler', x: 1, y: 3 }]);
  assert.equal(z.spieler.gelocht, true);
  assert.equal(alle.filter((e) => e.typ === 'wartet' && e.reihe === 5).length, 0, 'in Reihe 5 liegt nichts mehr');
});

test('Lampe: in Reichweite im Paar und ein Feld um den Gangplatz, sonst zu weit', () => {
  const nah = [[0, 5], [1, 5], [2, 4], [2, 5], [2, 6], [1, 4], [1, 6], [0, 4], [0, 6]];
  const fern = [[2, 3], [2, 7], [3, 5], [1, 3], [3, 4]];
  for (const [x, y] of nah) {
    const z = lage((l) => {
      l.spieler.x = x;
      l.spieler.y = y;
      l.tasche = false;
    });
    assert.equal(lampeInReichweite(z, 'A'), true, `von ${x},${y}`);
  }
  for (const [x, y] of fern) {
    const z = lage((l) => {
      l.spieler.x = x;
      l.spieler.y = y;
    });
    const ergebnis = runde(z, lampe('A'));
    assert.equal(ergebnis.zustand, z, `von ${x},${y} kostet es keine Runde`);
    assert.deepEqual(ergebnis.ereignisse, [{ typ: 'zuWeit', lampe: 'A' }]);
  }
});

test('Lampe: zwei Stellungen, ausschalten kann man sie nicht', () => {
  const { z } = spiele([lampe('A'), lampe('A'), lampe('A')]);
  assert.equal(z.lampen.A, 'gang');
  assert.equal(spiele([lampe('A')], z).z.lampen.A, 'fenster');
});

test('Lehnen: von Sitz zu Sitz nur seitwärts, in eine Reihe nur vom Gang, ans Fenster nur über den Gangplatz', () => {
  const imGang = lage((l) => {
    l.spieler.x = 2;
    l.spieler.y = 4;
  });
  assert.deepEqual([spiele(['links'], imGang).z.spieler.x, spiele(['rechts'], imGang).z.spieler.x], [1, 3]);
  // schräg oder zwei Felder weit geht nicht
  for (const ziel of [feld(1, 3), feld(0, 4), feld(2, 2)]) assert.equal(runde(imGang, ziel).zustand, imGang);
  const amGangplatz = spiele(['links'], imGang).z;
  for (const richtung of ['hoch', 'runter']) assert.equal(runde(amGangplatz, richtung).zustand, amGangplatz);
  const amFenster = spiele(['links'], amGangplatz).z;
  assert.deepEqual([amFenster.spieler.x, amFenster.spieler.y], [0, 4]);
  assert.equal(runde(amFenster, 'links').zustand, amFenster, 'dahinter ist die Wand');
});

test('besetzte Plätze: neben den Fahrgast in Reihe 6 kann man sich setzen, auf ihn nicht', () => {
  const z = lage((l) => {
    l.spieler.x = 2;
    l.spieler.y = 6;
    l.schaffner.y = 3;
  });
  const daneben = spiele(['rechts'], z).z;
  assert.deepEqual([daneben.spieler.x, daneben.spieler.y], [3, 6]);
  assert.equal(runde(daneben, 'rechts').zustand, daneben);
  // der Fensterplatz neben dem Schlafenden ist nicht erreichbar
  const oben = lage((l) => {
    l.spieler.x = 2;
    l.spieler.y = 2;
    l.schaffner.y = 6;
  });
  assert.equal(runde(oben, 'rechts').zustand, oben);
  assert.equal(runde(oben, feld(4, 2)).zustand, oben);
});

test('der wache Fahrgast lässt sich antippen, es geschieht nichts', () => {
  const z = lage((l) => {
    l.spieler.x = 3;
    l.spieler.y = 6;
    l.schaffner.y = 3;
  });
  assert.deepEqual(runde(z, feld(4, 6)).ereignisse, [{ typ: 'nichts', zu: { x: 4, y: 6 } }]);
  assert.deepEqual(runde(neueFahrt(), feld(4, 6)).ereignisse, [{ typ: 'zuWeit', zu: { x: 4, y: 6 } }]);
  assert.deepEqual(runde(z, feld(3, 6)).ereignisse, [{ typ: 'nichts', zu: { x: 3, y: 6 } }], 'das eigene Feld');
});

test('Schaffner antippen: Wartet er, wiederholt er den Satz und es kostet eine Runde, sonst nichts', () => {
  const wartend = spiele(['warten', 'warten', 'warten', 'warten']).z;
  const ergebnis = runde(wartend, feld(2, 5));
  assert.equal(ergebnis.ereignisse[0].typ, 'satz');
  assert.equal(ergebnis.zustand.runde, 5);
  // geht er gerade, geschieht nichts
  const gehend = spiele(['rechts', 'warten']).z; // Spieler im Gang (2,5), Schaffner in Reihe 6
  assert.equal(gehend.schaffner.y, 6);
  const nichts = runde(gehend, feld(2, 6));
  assert.equal(nichts.zustand, gehend);
  assert.deepEqual(typen(nichts.ereignisse), ['nichts']);
  // außer Reichweite: zu weit
  assert.deepEqual(typen(runde(neueFahrt(), feld(2, 7)).ereignisse), ['zuWeit']);
});

test('steht der Spieler im Gang vor ihm, bleibt der Schaffner stehen', () => {
  // Tasche mitnehmen, in den Gang treten, dort warten
  const { z, letzte } = spiele([feld(0, 5), 'rechts', 'warten', 'warten']);
  assert.deepEqual([z.spieler.x, z.spieler.y], [2, 5]);
  assert.equal(z.schaffner.y, 6);
  assert.equal(z.schaffner.tat, 'steht');
  assert.ok(typen(letzte).includes('steht'));
});

test('gegen den Schaffner wischen: Geht er ohnehin weiter, rückt der Spieler einfach nach', () => {
  // Schaffner in Reihe 4 unterwegs nach oben, Spieler direkt hinter ihm
  const z = lage((l) => {
    l.tasche = false;
    l.spieler.x = 2;
    l.spieler.y = 5;
    l.schaffner.y = 4;
    l.schaffner.tat = 'geht';
    l.wacher.gelocht = true;
  });
  const { z: danach, letzte } = spiele(['hoch'], z);
  assert.equal(finde(letzte, 'schritt').rueckt, true);
  assert.deepEqual([danach.spieler.y, danach.schaffner.y], [4, 3]);
  assert.equal(typen(letzte).includes('anstoss'), false);
});

test('aufstehen neben dem wartenden Schaffner: Ist der Platz danach frei, geht er weiter', () => {
  // Tasche weg, der Schaffner wartet wegen des Schattens neben dem Spieler
  const { z } = spiele(['warten', 'warten', 'warten', 'warten', feld(0, 5)]);
  assert.equal(z.schaffner.ziel.was, 'schatten');
  const { z: danach, letzte } = spiele(['rechts'], z);
  assert.deepEqual(typen(letzte), ['schritt', 'schatten', 'nickt', 'schaffnerSchritt', 'stoss']);
  assert.deepEqual([danach.spieler.x, danach.spieler.y, danach.schaffner.y], [2, 5, 4]);
  assert.equal(danach.spieler.gelocht, false);
  assert.equal(danach.schatten.filter((s) => s.von === 'spieler').length, 0, 'im Gang wirft niemand einen Schatten');
});

test('Anstoßen: Bleibt er stehen, dreht er die Mütze zum Spieler, sonst nichts', () => {
  // die Tasche liegt noch: Auch wenn der Spieler aufsteht, wartet er weiter
  const wartend = spiele(['warten', 'warten', 'warten', 'warten']).z;
  const { z, letzte } = spiele(['rechts'], wartend);
  assert.deepEqual(typen(letzte), ['anstoss', 'wartet']);
  assert.equal(z.schaffner.blick, 'links', 'die Mütze zeigt zum Spieler');
  assert.equal(z.angestossen, true);
  assert.deepEqual([z.spieler.x, z.spieler.y, z.schaffner.y], [1, 5, 5]);
  assert.equal(z.runde, 5, 'Anstoßen ist eine Handlung');
  // jede andere Handlung dazwischen hebt es auf
  const dazwischen = spiele(['warten', 'rechts'], z);
  assert.deepEqual(typen(dazwischen.letzte), ['anstoss', 'wartet']);
  assert.equal(spiele(['warten'], z).z.schaffner.blick, null);
});

test('Vorbeidrängen von der Seite: Der Spieler nimmt sein Feld, er weicht ein Gangfeld nach unten aus', () => {
  const wartend = spiele(['warten', 'warten', 'warten', 'warten']).z;
  const { z, letzte } = spiele(['rechts', 'rechts'], wartend);
  const draengt = finde(letzte, 'draengt');
  assert.deepEqual(draengt.nach, { x: 2, y: 5 });
  assert.deepEqual(draengt.schaffnerNach, { x: 2, y: 6 });
  assert.deepEqual([z.spieler.x, z.spieler.y, z.schaffner.y], [2, 5, 6]);
  // er will wieder nach oben, dort steht der Spieler
  assert.equal(z.schaffner.tat, 'steht');
  assert.equal(typen(letzte).includes('nickt'), false, 'weggeschoben ist nicht zufrieden');
  // der Spieler geht weiter, er kommt nach und wartet wieder bei der Tasche, ohne den Satz zu wiederholen
  const weiter = spiele(['hoch', 'hoch'], z);
  assert.equal(weiter.z.schaffner.y, 5);
  assert.equal(weiter.z.schaffner.tat, 'wartet');
  assert.equal(finde(weiter.letzte, 'wartet').satz, false);
});

test('Vorbeidrängen im Gang: Er weicht auf das Feld aus, von dem der Spieler kam', () => {
  // von unten: Der Schaffner wartet in Reihe 5 bei der Tasche, der Spieler steht in Reihe 6
  const vonUnten = lage((l) => {
    l.spieler.x = 2;
    l.spieler.y = 6;
    l.schaffner.y = 5;
    l.schaffner.tat = 'wartet';
    l.schaffner.ziel = { x: 0, y: 5, was: 'tasche' };
    l.schaffner.gesagt = [5];
    l.wacher.gelocht = true;
  });
  const a = spiele(['hoch', 'hoch'], vonUnten);
  assert.deepEqual(typen(a.listen[0]), ['anstoss', 'wartet']);
  assert.deepEqual([a.z.spieler.y, a.z.schaffner.y], [5, 6]);
  // von oben: Der Spieler kommt ihm entgegen
  const vonOben = lage((l) => {
    l.spieler.x = 2;
    l.spieler.y = 4;
    l.schaffner.y = 5;
    l.schaffner.tat = 'wartet';
    l.schaffner.ziel = { x: 0, y: 5, was: 'tasche' };
    l.schaffner.gesagt = [5];
    l.wacher.gelocht = true;
  });
  const b = spiele(['runter', 'runter'], vonOben);
  assert.deepEqual([b.z.spieler.y, b.z.schaffner.y], [5, 3], 'getauscht, danach geht er eins weiter');
});

test('wer ihm im Gang entgegenkommt, stößt immer an: Er kann nicht durch den Spieler hindurch', () => {
  const z = lage((l) => {
    l.tasche = false;
    l.spieler.x = 2;
    l.spieler.y = 3;
    l.schaffner.y = 4;
    l.schaffner.tat = 'steht';
    l.wacher.gelocht = true;
  });
  const { z: danach, letzte } = spiele(['runter'], z);
  assert.deepEqual(typen(letzte), ['anstoss', 'steht']);
  assert.equal(danach.schaffner.blick, 'hoch');
  assert.deepEqual([danach.spieler.y, danach.schaffner.y], [3, 4]);
});

test('Abschluss: Der Wagen endet, sobald der Spieler auf der Zieltür steht', () => {
  const { z, letzte } = spiele(['rechts', 'hoch', 'hoch', 'hoch', 'hoch', 'hoch']);
  assert.equal(z.status, 'ende');
  const ende = finde(letzte, 'ende');
  assert.equal(ende.lochung, false);
  // sofort losgehen und die Tasche liegen lassen: zwei Tatsachen in fester Rangfolge
  assert.deepEqual(ende.tatsachen, [{ art: 'wartet', reihe: 5 }, { art: 'tasche' }]);
  // danach nimmt der Wagen nichts mehr an
  const danach = runde(z, 'warten');
  assert.equal(danach.zustand, z);
  assert.deepEqual(danach.ereignisse, []);
});

test('an der Zieltür geht der Schaffner hinaus, der Spieler rückt nach', () => {
  const z = lage((l) => {
    l.tasche = false;
    l.spieler.x = 2;
    l.spieler.y = 1;
    l.schaffner.y = 0;
    l.schaffner.tat = 'geht';
    l.wacher.gelocht = true;
    l.lampen.B = 'gang';
    l.schlaefer.gegruesst = true;
  });
  const { z: danach, letzte } = spiele(['hoch'], z);
  assert.deepEqual(typen(letzte), ['schritt', 'schaffnerWeg', 'ende']);
  assert.equal(danach.schaffner.weg, true);
  assert.deepEqual(finde(letzte, 'ende').tatsachen, []);
});

test('gleiche Eingaben ergeben gleiche Ereignisse', () => {
  const folge = ['warten', feld(0, 5), lampe('A'), 'warten', 'rechts', 'hoch', feld(2, 3), lampe('B'), feld(3, 2), 'hoch', 'hoch', 'runter', 'hoch', 'hoch', 'hoch', 'hoch'];
  const a = spiele(folge);
  const b = spiele(folge);
  assert.deepEqual(a.listen, b.listen);
  assert.deepEqual(a.z, b.z);
  // und über act() dasselbe wie über runde()
  const fahrt = erzeugeFahrt();
  const c = folge.map((h) => fahrt.act(h));
  assert.deepEqual(c, a.listen);
  assert.deepEqual(fahrt.zustand, a.z);
});

test('runde() lässt den alten Zustand unberührt', () => {
  const z = neueFahrt();
  const vorher = JSON.stringify(z);
  runde(z, feld(0, 5));
  runde(z, lampe('A'));
  runde(z, 'rechts');
  assert.equal(JSON.stringify(z), vorher);
});

// Nachgetragen nach der Prüfung vom 19.11.: Regeln, die vorher kein Test festhielt.

test('der Satz fällt in jeder Reihe neu: erst wegen der Tasche in Reihe 5, später beim Schlafenden in Reihe 2', () => {
  const { listen } = spiele(['warten', 'warten', 'warten', 'warten', feld(0, 5), lampe('A'), 'warten', 'warten', 'warten', 'warten']);
  const saetze = listen.flat().filter((e) => e.typ === 'wartet' && e.satz).map((e) => e.reihe);
  assert.deepEqual(saetze, [5, 2]);
});

test('„Der Schaffner wartet" steht nach der Tür nur, wenn er wirklich wartet, nicht wenn er grüßt', () => {
  const { z, letzte } = spiele([feld(0, 5), 'rechts', 'hoch', 'hoch', lampe('B'), 'hoch', 'hoch', 'hoch']);
  assert.equal(z.status, 'ende');
  assert.equal(z.schaffner.weg, false);
  assert.ok(typen(letzte).includes('gruesst'));
  assert.deepEqual(z.tatsachen, []);
});

test('endet der Wagen in einer Runde mit Schienenstoß, kommt erst der Stoß, dann der Abschluss', () => {
  const { z, letzte } = spiele(['rechts', 'hoch', 'hoch', 'hoch', 'hoch', 'hoch']);
  assert.equal(z.runde % 3, 0);
  const t = typen(letzte);
  assert.ok(t.indexOf('stoss') >= 0 && t.indexOf('stoss') < t.indexOf('ende'), t.join(','));
});

test('sitzen zwei Wache in seiner Reihe, locht er von links nach rechts', () => {
  const start = lage((l) => {
    l.tasche = false;
    l.spieler.x = 1;
    l.spieler.y = 2;
    l.spieler.tasche = true;
    l.schlaefer.wach = true;
    l.lampen.B = 'gang';
    l.schaffner.y = 2;
    l.schaffner.tat = 'geht';
    l.wacher.gelocht = true;
  });
  const { listen } = spiele(['warten', 'warten'], start);
  assert.deepEqual(listen.map((l) => finde(l, 'locht').wen), ['spieler', 'schlaefer']);
});

test('neben der unteren Tür ist Wand: Von dort geht es nicht zur Seite', () => {
  const start = lage((l) => {
    l.tasche = false;
    l.spieler.tasche = true;
    l.spieler.x = 2;
    l.spieler.y = 7;
    l.schaffner.y = 3;
    l.schaffner.tat = 'geht';
  });
  for (const richtung of ['links', 'rechts']) {
    const { zustand, ereignisse } = runde(start, richtung);
    assert.equal(zustand, start);
    assert.deepEqual(typen(ereignisse), ['gehtNicht']);
  }
});

test('Eingaben ohne Wirkung zählen nicht als Handlung: Wer danach wieder gegen ihn wischt, drängt vorbei', () => {
  const { listen } = spiele(['warten', 'warten', 'warten', 'warten', 'rechts', 'hoch', feld(1, 5), feld(4, 1), 'rechts']);
  assert.equal(listen[4][0].typ, 'anstoss');
  assert.deepEqual(listen.slice(5, 8).map((l) => typen(l)), [['gehtNicht'], ['nichts'], ['zuWeit']]);
  assert.equal(listen[8][0].typ, 'draengt');
});
