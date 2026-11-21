// Alle Texte, die im Prototyp "Kontrolle" zu lesen sind. Mehr gibt es nicht: kein Tutorial, keine Hinweise.

export const KONTROLLTEXTE = {
  warten: 'Warten',
  schluss: '{n} von {m} erwischt', // nach dem dritten Halt
};

export function setzeKontrollText(text, werte) {
  return text.replace(/\{(\w+)\}/g, (ganz, name) => (werte[name] !== undefined ? String(werte[name]) : ganz));
}
