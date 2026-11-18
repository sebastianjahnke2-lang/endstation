// Testprotokoll für den Auftraggeber: Was in der letzten Fahrt wann geschah.
// Für Spieler unsichtbar. Es liegt nur auf dem Gerät und wird nirgends hingeschickt.
// Reine Funktionen, damit sie sich in Node prüfen lassen.

import { reiheFrei } from './kern/fahrt.js';
import { SCHLAEFERPLATZ } from './kern/abteil.js';
import { PLATZTEXTE } from './texte.js';

const FOLGE_HOECHSTENS = 600;
const SCHRITTZEICHEN = { hoch: 'h', rechts: 'r', runter: 'u', links: 'l' };

export function leeresProtokoll() {
  return {
    runden: 0,
    tascheWeg: null, // Runde, in der es geschah, oder null
    lochung: null,
    reiheZweiFrei: null,
    tuer: null,
    lampe: 0, // wie oft
    warten: 0,
    anstossen: 0,
    draengen: 0,
    wecken: 0,
    folge: '', // ein Zeichen je Handlung, siehe docs/SPIELTEST-freier-platz.md
  };
}

function zahlOderNull(wert) {
  return typeof wert === 'number' && isFinite(wert) && wert >= 0 ? Math.floor(wert) : null;
}

export function bereinigeProtokoll(roh) {
  if (!roh || typeof roh !== 'object') return null;
  const p = leeresProtokoll();
  for (const name of ['runden', 'lampe', 'warten', 'anstossen', 'draengen', 'wecken']) p[name] = zahlOderNull(roh[name]) || 0;
  for (const name of ['tascheWeg', 'lochung', 'reiheZweiFrei', 'tuer']) p[name] = zahlOderNull(roh[name]);
  if (typeof roh.folge === 'string') p.folge = roh.folge.replace(/[^A-Za-z.]/g, '').slice(0, FOLGE_HOECHSTENS);
  return p;
}

// Schreibt mit, was eine Eingabe ausgelöst hat. zustand ist der Stand danach.
export function schreibeMit(protokoll, ereignisse, zustand) {
  const p = protokoll;
  if (!ereignisse.length) return p;
  const erstes = ereignisse[0];
  let zeichen = '.'; // eine Eingabe ohne Wirkung
  if (erstes.typ === 'schritt') zeichen = SCHRITTZEICHEN[erstes.richtung];
  else if (erstes.typ === 'nimmt') zeichen = 'T';
  else if (erstes.typ === 'lampe') zeichen = erstes.name;
  else if (erstes.typ === 'weckt') zeichen = 'S';
  else if (erstes.typ === 'satz') zeichen = 'K';
  else if (erstes.typ === 'warten') zeichen = 'W';
  else if (erstes.typ === 'anstoss') zeichen = 'X';
  else if (erstes.typ === 'draengt') zeichen = 'V';
  if (p.folge.length < FOLGE_HOECHSTENS) p.folge += zeichen;

  p.runden = zustand.runde;
  for (const e of ereignisse) {
    if (e.typ === 'lampe') p.lampe += 1;
    if (e.typ === 'warten') p.warten += 1;
    if (e.typ === 'anstoss') p.anstossen += 1;
    if (e.typ === 'draengt') p.draengen += 1;
    if (e.typ === 'weckt') p.wecken += 1;
    if (e.typ === 'nimmt' && p.tascheWeg === null) p.tascheWeg = zustand.runde;
    if (e.typ === 'locht' && e.wen === 'spieler' && p.lochung === null) p.lochung = zustand.runde;
    if (e.typ === 'ende' && p.tuer === null) p.tuer = zustand.runde;
  }
  if (p.reiheZweiFrei === null && zeichen !== '.' && reiheFrei(zustand, SCHLAEFERPLATZ.y)) p.reiheZweiFrei = zustand.runde;
  return p;
}

function zeile(name, wert, breite) {
  const text = wert === null ? PLATZTEXTE.protokoll.nie : String(wert);
  const luecke = Math.max(1, breite - [...name].length - [...text].length);
  return name + ' '.repeat(luecke) + text;
}

// Die Zeilen, die der Auftraggeber sieht. breite ist die Zahl der Zeichen je Zeile.
export function protokollZeilen(protokoll, karten, breite) {
  const t = PLATZTEXTE.protokoll;
  if (!protokoll) return [t.keine];
  const p = protokoll;
  const zeilen = [
    t.titel,
    zeile(t.runden, p.runden, breite),
    zeile(t.tascheWeg, p.tascheWeg, breite),
    zeile(t.lochung, p.lochung, breite),
    zeile(t.reiheZweiFrei, p.reiheZweiFrei, breite),
    zeile(t.tuer, p.tuer, breite),
    zeile(t.lampe, p.lampe, breite),
    zeile(t.warten, p.warten, breite),
    zeile(t.anstossen, p.anstossen, breite),
    zeile(t.draengen, p.draengen, breite),
    zeile(t.wecken, p.wecken, breite),
    t.folge + ':',
  ];
  // die Folge in Zeilen, höchstens fünf, das Ende zählt
  const stuecke = [];
  for (let i = 0; i < p.folge.length; i += breite) stuecke.push(p.folge.slice(i, i + breite));
  for (const stueck of stuecke.slice(-5)) zeilen.push(stueck);
  if (!stuecke.length) zeilen.push(t.nie);
  // die aufgehobenen Karten, die neueste zuerst: + mit Lochung, - ohne
  zeilen.push(t.karten + ':');
  zeilen.push(karten.length ? karten.map((k) => (k.lochung ? '+' : '-')).join('').slice(0, breite) : t.nie);
  return zeilen;
}
