// Pages of a fictional Videotex service, and how the function keys move between them.
import {
  bitmapToMasks,
  COLOR_NAMES,
  DEFAULT_SHORTCUTS,
  FUNCTION_KEY_LABELS,
  FUNCTION_KEYS,
  PageBuilder,
  SIXEL_FULL,
  type ColorName,
  type FunctionKeyName,
  type Page,
} from '../src';

/** Pages reached with Next and Back. The home page lists the other four, numbered 1 to 4. */
export const SEQUENCE = ['home', 'components', 'mosaics', 'palette', 'keys'] as const;
export type PageName = (typeof SEQUENCE)[number] | 'guide';

export interface DemoState {
  readonly page: PageName;
  /** Page to return to when leaving the guide. */
  readonly from: PageName;
  /** Number typed on the home page. */
  readonly choice: string;
  /** Short message on the service row. */
  readonly message: string;
  /** Bumped by Repeat to draw the page again. */
  readonly replay: number;
}

export type DemoAction = { readonly type: 'key'; readonly key: FunctionKeyName } | { readonly type: 'digit'; readonly digit: string };

export const INITIAL_STATE: DemoState = { page: 'home', from: 'home', choice: '', message: '', replay: 0 };

export function reduce(state: DemoState, action: DemoAction): DemoState {
  const go = (page: PageName): DemoState => ({
    ...state,
    page,
    from: page === 'guide' ? state.page : state.from,
    choice: '',
    message: '',
  });
  const say = (message: string): DemoState => ({ ...state, message });

  if (action.type === 'digit') {
    return state.page === 'home' ? { ...state, choice: action.digit, message: '' } : state;
  }
  const position = SEQUENCE.indexOf(state.page as (typeof SEQUENCE)[number]);
  switch (action.key) {
    case 'index':
      return go('home');
    case 'guide':
      return state.page === 'guide' ? state : go('guide');
    case 'next':
      if (state.page === 'guide') return say('Press Back');
      return position < SEQUENCE.length - 1 ? go(SEQUENCE[position + 1]!) : say('Last page');
    case 'back':
      if (state.page === 'guide') return go(state.from);
      return position > 0 ? go(SEQUENCE[position - 1]!) : say('First page');
    case 'repeat':
      return { ...state, message: '', replay: state.replay + 1 };
    case 'cancel':
      return { ...state, choice: '', message: '' };
    case 'correction':
      return { ...state, choice: state.choice.slice(0, -1), message: '' };
    case 'send': {
      if (state.page !== 'home') return say('Nothing to send');
      const target = SEQUENCE[Number(state.choice)];
      return state.choice !== '' && target && target !== 'home' ? go(target) : say('Type 1 to 4');
    }
  }
}

export function buildPage(state: DemoState): Page {
  switch (state.page) {
    case 'home':
      return homePage(state);
    case 'components':
      return componentsPage(state);
    case 'mosaics':
      return mosaicsPage(state);
    case 'palette':
      return palettePage(state);
    case 'keys':
      return keysPage(state);
    case 'guide':
      return guidePage(state);
  }
}

// Shared parts

function serviceRow(b: PageBuilder, message: string, right: string): void {
  b.moveTo(0, 1).print('VIDEOTEX-UI', { fg: 'cyan' });
  if (message) b.moveTo(0, 14).print(message, { fg: 'yellow' });
  b.moveTo(0, 39 - right.length).print(right, { fg: 'cyan' });
}

function contentPage(title: string, state: DemoState): PageBuilder {
  const b = new PageBuilder();
  const position = SEQUENCE.indexOf(state.page as (typeof SEQUENCE)[number]);
  serviceRow(b, state.message, position > 0 ? `${position}/${SEQUENCE.length - 1}` : '');
  b.fill(1, 0, 3, 40, { bg: 'blue' });
  b.moveTo(3, 2).print(title, { fg: 'yellow', bg: 'blue', size: 'double-height' });
  b.moveTo(22, 0).mosaic(Array(40).fill(0b001100), { fg: 'blue' });
  b.moveTo(23, 2).print(' Next ', { inverse: true }).print(' next page  ', { fg: 'cyan' });
  b.print(' Back ', { inverse: true }).print(' previous', { fg: 'cyan' });
  b.moveTo(24, 2).print(' Index ', { inverse: true }).print(' main menu  ', { fg: 'cyan' });
  b.print(' Guide ', { inverse: true }).print(' help', { fg: 'cyan' });
  return b;
}

// Home

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

function homePage(state: DemoState): Page {
  const b = new PageBuilder();
  serviceRow(b, state.message, '0.00 F/min');

  b.fill(1, 0, 4, 40, { bg: 'blue' });
  b.moveTo(3, 2).print('VIDEOTEX UI', { fg: 'yellow', bg: 'blue', size: 'double-size' });
  b.moveTo(4, 2).print('A UI kit for the web', { bg: 'blue' });
  b.moveTo(2, 32).print('40x25', { fg: 'cyan', bg: 'blue' });

  drawSunset(b);

  b.moveTo(16, 2).print('MAIN MENU', { fg: 'cyan', size: 'double-height' });
  ['Components', 'Mosaics', '8-color palette', 'Function keys'].forEach((label, i) => {
    b.moveTo(18 + i, 2).print(` ${i + 1} `, { inverse: true }).print(` ${label}`);
  });

  b.moveTo(18, 30);
  COLOR_NAMES.forEach((name, i) => {
    if (i === 4) b.moveTo(20, 30);
    b.mosaic([SIXEL_FULL, SIXEL_FULL], { fg: name });
  });
  b.moveTo(19, 30).mosaic(Array(8).fill(0b001111), { fg: 'white', underline: true });

  // The input field: an underlined cell, blinking while empty, like the Minitel cursor.
  b.moveTo(23, 2).print('Your choice: ');
  b.print(state.choice || ' ', { underline: true, blink: state.choice === '' });
  b.print('  then ').print(' Send ', { inverse: true, fg: 'green' });

  b.moveTo(24, 2).print(' Guide ', { inverse: true }).print(' help     ', { fg: 'cyan' });
  b.print('Fictional service', { fg: 'green', underline: true });

  return b.build();
}

// Content pages

function componentsPage(state: DemoState): Page {
  const b = contentPage('COMPONENTS', state);
  const items: [string, string, ColorName][] = [
    ['Screen', 'ready', 'green'],
    ['FunctionKeys', 'ready', 'green'],
    ['Mosaic', 'step 7', 'yellow'],
    ['InputField', 'step 6', 'yellow'],
    ['Menu', 'step 6', 'yellow'],
    ['StatusRow', 'step 6', 'yellow'],
    ['Title', 'step 6', 'yellow'],
    ['Frame', 'step 6', 'yellow'],
  ];
  items.forEach(([name, status, color], i) => {
    b.moveTo(6 + i * 2, 3)
      .print(name)
      .print(` ${'.'.repeat(22 - name.length)}`, { fg: 'blue' })
      .print(` ${status}`, { fg: color });
  });
  return b.build();
}

function mosaicsPage(state: DemoState): Page {
  const b = contentPage('MOSAICS', state);
  b.moveTo(5, 2).print('64 characters of 2 x 3 sixels:');
  for (let row = 0; row < 4; row++) {
    b.moveTo(7 + row * 2, 4);
    for (let i = 0; i < 16; i++) b.mosaic(row * 16 + i, { fg: 'cyan' }).print(' ');
  }
  b.moveTo(16, 2).print('Disjoint mode (underline attribute):');
  b.moveTo(18, 4);
  for (let i = 48; i < 64; i++) b.mosaic(i, { fg: 'yellow', underline: true }).print(' ');
  b.moveTo(20, 2).print('Draw them from bitmaps: bitmapToMasks', { fg: 'green' });
  return b.build();
}

function palettePage(state: DemoState): Page {
  const b = contentPage('8-COLOR PALETTE', state);
  COLOR_NAMES.forEach((name, i) => {
    const row = 5 + i * 2;
    b.moveTo(row, 3).mosaic(Array(4).fill(SIXEL_FULL), { fg: name });
    b.moveTo(row, 9).print(name, { fg: name === 'black' ? 'white' : name });
    b.moveTo(row, 20).print(`code ${i}`, { fg: 'cyan' });
  });
  b.moveTo(21, 2).print('Switch the palette for the 8 greys', { fg: 'green' });
  return b.build();
}

const SHORT_KEY_NAMES: Readonly<Record<string, string>> = {
  PageUp: 'PgUp',
  PageDown: 'PgDn',
  Escape: 'Esc',
  Backspace: 'Bksp',
};

function keysPage(state: DemoState): Page {
  const b = contentPage('FUNCTION KEYS', state);
  b.moveTo(5, 2).print('Key', { fg: 'cyan' });
  b.moveTo(5, 14).print('On a Minitel', { fg: 'cyan' });
  b.moveTo(5, 29).print('Keyboard', { fg: 'cyan' });
  FUNCTION_KEYS.forEach((key, i) => {
    const row = 7 + i * 2;
    const shortcut = DEFAULT_SHORTCUTS[key];
    b.moveTo(row, 2).print(FUNCTION_KEY_LABELS.en[key], { fg: 'yellow' });
    b.moveTo(row, 14).print(FUNCTION_KEY_LABELS.fr[key], { fg: 'green' });
    b.moveTo(row, 29).print(SHORT_KEY_NAMES[shortcut] ?? shortcut);
  });
  return b.build();
}

function guidePage(state: DemoState): Page {
  const b = contentPage('GUIDE', state);
  b.moveTo(5, 2).print(
    [
      'This is a fictional Videotex service.',
      '',
      'Main menu: type 1 to 4, then Send.',
      'Next and Back turn the pages.',
      'Index goes back to the main menu.',
      'Repeat draws the page again.',
      'Correction erases the last digit,',
      'Cancel clears the whole entry.',
      '',
      'Press Back to leave this page.',
    ].join('\n'),
  );
  return b.build();
}
