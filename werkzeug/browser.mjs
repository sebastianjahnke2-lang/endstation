// Öffnet einen Browser, der sich wie ein iPhone verhält.
// Nimmt die WebKit-Engine (wie Safari), wenn sie installiert ist, sonst Chromium mit iPhone-Profil.
// Braucht Playwright. In der Cloud-Umgebung ist es vorinstalliert, ins Repo gehört es nicht.

import { createRequire } from 'node:module';
import { mkdirSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const playwright = createRequire(import.meta.url)('playwright');

export const SPIELDATEI = join(dirname(fileURLToPath(import.meta.url)), '..', 'index.html');

export function bilderOrdner() {
  const ordner = process.env.BILDER || join(tmpdir(), 'endstation-bilder');
  mkdirSync(ordner, { recursive: true });
  return ordner;
}

// optionen: dichte, ruhig (reduzierte Bewegung), sicher { top, bottom, left, right } für Notch und Home-Balken
export async function oeffne(breite, hoehe, optionen = {}) {
  let motor = 'webkit';
  let browser;
  try {
    browser = await playwright.webkit.launch();
  } catch (fehler) {
    motor = 'chromium';
    browser = await playwright.chromium.launch();
  }
  const kontext = await browser.newContext({
    viewport: { width: breite, height: hoehe },
    deviceScaleFactor: optionen.dichte || 2,
    hasTouch: true,
    isMobile: true,
    userAgent: playwright.devices['iPhone 14'].userAgent,
    reducedMotion: optionen.ruhig ? 'reduce' : 'no-preference',
  });
  const seite = await kontext.newPage();
  const meldungen = [];
  seite.on('console', (m) => {
    if (m.type() === 'error' || m.type() === 'warning') meldungen.push(`${m.type()}: ${m.text()}`);
  });
  seite.on('pageerror', (e) => meldungen.push(`FEHLER: ${e.message}`));

  const cdp = motor === 'chromium' ? await kontext.newCDPSession(seite) : null;
  let sicherGesetzt = false;
  if (optionen.sicher && cdp) {
    try {
      await cdp.send('Emulation.setSafeAreaInsetsOverride', { insets: optionen.sicher });
      sicherGesetzt = true;
    } catch (fehler) {
      sicherGesetzt = false;
    }
  }

  // Ein Wisch mit dem Finger. In Chromium als echte Berührung, sonst als nachgestellte Zeigerereignisse.
  async function wische(vonX, vonY, dx, dy, schritte = 4) {
    if (cdp) {
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x: vonX, y: vonY }] });
      for (let i = 1; i <= schritte; i++) {
        await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: vonX + (dx * i) / schritte, y: vonY + (dy * i) / schritte }] });
      }
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
      return;
    }
    await seite.evaluate(([x, y, wegX, wegY, n]) => {
      const flaeche = document.getElementById('bild');
      const sende = (typ, px, py) => flaeche.dispatchEvent(new PointerEvent(typ, { pointerId: 7, pointerType: 'touch', isPrimary: true, clientX: px, clientY: py, bubbles: true, cancelable: true }));
      sende('pointerdown', x, y);
      for (let i = 1; i <= n; i++) sende('pointermove', x + (wegX * i) / n, y + (wegY * i) / n);
      sende('pointerup', x + wegX, y + wegY);
    }, [vonX, vonY, dx, dy, schritte]);
  }

  // Lage und Größe des Canvas auf der Seite
  const canvas = () => seite.evaluate(() => {
    const k = document.getElementById('bild').getBoundingClientRect();
    return { x: k.left, y: k.top, b: k.width, h: k.height };
  });

  return { browser, kontext, seite, motor, meldungen, wische, canvas, sicherGesetzt };
}
