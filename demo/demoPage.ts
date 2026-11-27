// Home page of a fictional service, used to show what Ecran can draw.
import { bitmapToMasks, COLOR_NAMES, PageBuilder, SIXEL_FULL, type ColorName, type Page } from '../src';

const WIDTH = 80; // 40 cells × 2 sixels

/** Sky rows 6 to 10 with a setting sun, sea rows 11 to 13 with its reflection. */
function drawSunset(b: PageBuilder): void {
  const sky: ColorName[] = ['blue', 'magenta', 'magenta', 'red', 'red'];
  const horizon = sky.length * 3; // sixel row where the sea starts
  const sun = (x: number, y: number) => {
    const dx = (x + 0.5 - WIDTH / 2) / 1.1;
    const dy = y + 0.5 - horizon;
    const inside = dx * dx + dy * dy < 12 * 12;
    const cut = y >= 9 && y % 3 === 0; // stripes across the lower half
    return inside && !cut;
  };
  const skyBitmap = Array.from({ length: horizon }, (_, y) => Array.from({ length: WIDTH }, (_, x) => sun(x, y)));
  bitmapToMasks(skyBitmap).forEach((masks, i) => {
    b.moveTo(6 + i, 0).mosaic(masks, { fg: 'yellow', bg: sky[i] });
  });

  const reflection = (x: number, y: number) => {
    const half = 13 - y * 1.4;
    const dash = (x + y * 3) % 6 < 4;
    return y === 0 || (y % 2 === 0 && Math.abs(x + 0.5 - WIDTH / 2) < half && dash);
  };
  const seaBitmap = Array.from({ length: 9 }, (_, y) => Array.from({ length: WIDTH }, (_, x) => reflection(x, y)));
  bitmapToMasks(seaBitmap).forEach((masks, i) => {
    b.moveTo(11 + i, 0).mosaic(masks, { fg: 'cyan', bg: 'blue' });
  });
}

export function buildDemoPage(): Page {
  const b = new PageBuilder();

  // Service row
  b.moveTo(0, 1).print('VIDEOTEX-UI', { fg: 'cyan' });
  b.moveTo(0, 29).print('0,00 F/min', { fg: 'cyan' });

  // Title band
  b.fill(1, 0, 4, 40, { bg: 'blue' });
  // Capitals without accents: the Minitel accents lowercase letters only (to check in step 1).
  b.moveTo(3, 2).print('VIDEOTEX UI', { fg: 'yellow', bg: 'blue', size: 'double-size' });
  b.moveTo(4, 2).print("Kit d'interface pour le web", { bg: 'blue' });
  b.moveTo(2, 32).print('40x25', { fg: 'cyan', bg: 'blue' });

  drawSunset(b);

  // Menu
  b.moveTo(16, 2).print('SOMMAIRE', { fg: 'cyan', size: 'double-height' });
  const entries = ['Composants', 'Mosaïques', 'Palette 8 couleurs', 'Touches de fonction'];
  entries.forEach((label, i) => {
    b.moveTo(18 + i, 2).print(` ${i + 1} `, { inverse: true }).print(` ${label}`);
  });

  // Palette strip
  b.moveTo(18, 30);
  COLOR_NAMES.forEach((name, i) => {
    if (i === 4) b.moveTo(20, 30);
    b.mosaic([SIXEL_FULL, SIXEL_FULL], { fg: name });
  });
  b.moveTo(19, 30).mosaic(Array(8).fill(0b001111), { fg: 'white', underline: true });

  // Prompt
  b.moveTo(23, 2).print('Votre choix : ');
  b.mosaic(0b110000, { blink: true }).print('.');
  b.print('  puis ').print(' Envoi ', { inverse: true, fg: 'green' });

  b.moveTo(24, 2).print('Service fictif', { fg: 'green', underline: true }).print(' - aucune donnée réelle', { fg: 'green' });

  return b.build();
}
