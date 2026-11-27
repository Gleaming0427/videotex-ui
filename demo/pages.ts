// Backgrounds of a fictional Videotex service, and how the function keys move between pages.
// Titles, the status row, the menu and the input field are components placed on the screen (see App).
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

export const TITLES: Readonly<Record<PageName, string>> = {
  home: 'VIDEOTEX UI',
  components: 'COMPONENTS',
  mosaics: 'MOSAICS',
  palette: '8-COLOR PALETTE',
  keys: 'FUNCTION KEYS',
  guide: 'GUIDE',
};

export const MENU_ITEMS = ['Components', 'Mosaics', '8-color palette', 'Function keys'];

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

export type DemoAction =
  | { readonly type: 'key'; readonly key: FunctionKeyName }
  | { readonly type: 'input'; readonly value: string }
  | { readonly type: 'open'; readonly index: number };

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

  if (action.type === 'input') {
    return state.page === 'home' ? { ...state, choice: action.value, message: '' } : state;
  }
  if (action.type === 'open') {
    const target = SEQUENCE[action.index + 1];
    return target ? go(target) : state;
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

/** Text on the right of the service row. */
export function statusRight(page: PageName): string {
  const position = SEQUENCE.indexOf(page as (typeof SEQUENCE)[number]);
  if (page === 'home') return '0.00 F/min';
  return position > 0 ? `${position}/${SEQUENCE.length - 1}` : '';
}

export function buildPage(page: PageName): Page {
  switch (page) {
    case 'home':
      return homePage();
    case 'components':
      return componentsPage();
    case 'mosaics':
      return mosaicsPage();
    case 'palette':
      return palettePage();
    case 'keys':
      return keysPage();
    case 'guide':
      return guidePage();
  }
}

// Shared parts

/** Blue title band (rows 1 to 3) and the key hints at the bottom. */
function contentPage(): PageBuilder {
  const b = new PageBuilder();
  b.fill(1, 0, 3, 40, { bg: 'blue' });
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

function homePage(): Page {
  const b = new PageBuilder();
  b.fill(1, 0, 4, 40, { bg: 'blue' });
  b.moveTo(4, 2).print('A UI kit for the web', { bg: 'blue' });
  b.moveTo(2, 32).print('40x25', { fg: 'cyan', bg: 'blue' });

  drawSunset(b);

  b.moveTo(18, 30);
  COLOR_NAMES.forEach((name, i) => {
    if (i === 4) b.moveTo(20, 30);
    b.mosaic([SIXEL_FULL, SIXEL_FULL], { fg: name });
  });
  b.moveTo(19, 30).mosaic(Array(8).fill(0b001111), { fg: 'white', underline: true });

  // The input field itself sits at column 15 (InputField).
  b.moveTo(23, 2).print('Your choice: ');
  b.moveTo(23, 16).print('  then ').print(' Send ', { inverse: true, fg: 'green' });

  b.moveTo(24, 2).print(' Guide ', { inverse: true }).print(' help     ', { fg: 'cyan' });
  b.print('Fictional service', { fg: 'green', underline: true });

  return b.build();
}

// Content pages

function componentsPage(): Page {
  const b = contentPage();
  const items: [string, string, ColorName][] = [
    ['Screen', 'ready', 'green'],
    ['FunctionKeys', 'ready', 'green'],
    ['Title', 'ready', 'green'],
    ['StatusRow', 'ready', 'green'],
    ['Menu', 'ready', 'green'],
    ['InputField', 'ready', 'green'],
    ['Frame', 'ready', 'green'],
    ['Mosaic', 'step 7', 'yellow'],
  ];
  items.forEach(([name, status, color], i) => {
    b.moveTo(6 + i * 2, 3)
      .print(name)
      .print(` ${'.'.repeat(22 - name.length)}`, { fg: 'blue' })
      .print(` ${status}`, { fg: color });
  });
  return b.build();
}

function mosaicsPage(): Page {
  const b = contentPage();
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

function palettePage(): Page {
  const b = contentPage();
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

function keysPage(): Page {
  const b = contentPage();
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

/** The text sits inside a Frame (rows 5 to 18, columns 1 to 38). */
function guidePage(): Page {
  const b = contentPage();
  b.moveTo(7, 3).print(
    [
      'A fictional Videotex service.',
      '',
      'Main menu: type 1 to 4 then Send,',
      'or pick an entry.',
      'Next and Back turn the pages.',
      'Index: back to the main menu.',
      'Repeat draws the page again.',
      'Correction erases a digit,',
      'Cancel clears the entry.',
    ].join('\n'),
  );
  b.moveTo(20, 3).print('Press Back to leave this page.', { fg: 'yellow' });
  return b.build();
}
