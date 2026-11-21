// Alle Texte, die im Prototyp "Kontrolle" zu lesen sind. Mehr gibt es nicht, kein Tutorial.
// Die zwei Hinweiswörter erscheinen nur im Lernhalt.

export const KONTROLLTEXTE = {
  warten: 'Warten',
  schluss: '{n} von {m} erwischt', // nach dem dritten Halt
  // nur im Lernhalt, je erst im passenden Moment
  hinweis: {
    wischen: 'Wischen', // am Anfang, bis zum ersten Zug
    antippen: 'Antippen', // wenn man in seiner Reihe steht
  },
};

export function setzeKontrollText(text, werte) {
  return text.replace(/\{(\w+)\}/g, (ganz, name) => (werte[name] !== undefined ? String(werte[name]) : ganz));
}
