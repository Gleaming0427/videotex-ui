// The 8 Videotex color codes and how each Minitel model shows them.

export const COLOR_NAMES = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'] as const;

export type ColorName = (typeof COLOR_NAMES)[number];
/** Color code, 0 to 7, in the order of {@link COLOR_NAMES}. */
export type VtxColor = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ColorInput = VtxColor | ColorName;

export function toColor(input: ColorInput): VtxColor {
  if (typeof input === 'number') {
    if (Number.isInteger(input) && input >= 0 && input <= 7) return input;
  } else {
    const index = (COLOR_NAMES as readonly string[]).indexOf(input);
    if (index >= 0) return index as VtxColor;
  }
  throw new RangeError(`Invalid Videotex color: ${String(input)}. Expected 0 to 7 or one of: ${COLOR_NAMES.join(', ')}.`);
}

/** Color Minitel: the three primaries and their mixes (pure RGB values: our choice, not in the STUM 1B). */
export const COLOR_RGB: readonly string[] = Object.freeze([
  '#000000',
  '#ff0000',
  '#00ff00',
  '#ffff00',
  '#0000ff',
  '#ff00ff',
  '#00ffff',
  '#ffffff',
]);

/**
 * Monochrome Minitel 1B: brightness of each color code, in percent.
 * STUM 1B, part 1, ch. 3, §2.4.3 (values "given as an indication"): black 0, blue 40, red 50,
 * magenta 60, green 70, cyan 80, yellow 90, white 100.
 */
export const GREY_LEVELS: readonly number[] = Object.freeze([0, 50, 70, 90, 40, 60, 80, 100]);

/** Codes from darkest to brightest on the monochrome Minitel. */
export const LUMINANCE_ORDER: readonly VtxColor[] = Object.freeze([0, 4, 1, 5, 2, 6, 3, 7] as VtxColor[]);

/** Grey for each color code. */
export const GREY_RGB: readonly string[] = Object.freeze(
  GREY_LEVELS.map((percent) => {
    const hex = Math.round((percent * 255) / 100)
      .toString(16)
      .padStart(2, '0');
    return `#${hex}${hex}${hex}`;
  }),
);

export type PaletteName = 'color' | 'monochrome';

export function paletteOf(name: PaletteName): readonly string[] {
  return name === 'color' ? COLOR_RGB : GREY_RGB;
}
