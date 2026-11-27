// The 8 Videotex colour codes and how each Minitel model shows them.

export const COLOR_NAMES = ['black', 'red', 'green', 'yellow', 'blue', 'magenta', 'cyan', 'white'] as const;

export type ColorName = (typeof COLOR_NAMES)[number];
/** Colour code, 0 to 7, in the order of {@link COLOR_NAMES}. */
export type VtxColor = 0 | 1 | 2 | 3 | 4 | 5 | 6 | 7;
export type ColorInput = VtxColor | ColorName;

export function toColor(input: ColorInput): VtxColor {
  if (typeof input === 'number') {
    if (Number.isInteger(input) && input >= 0 && input <= 7) return input;
  } else {
    const index = (COLOR_NAMES as readonly string[]).indexOf(input);
    if (index >= 0) return index as VtxColor;
  }
  throw new RangeError(`Invalid Videotex colour: ${String(input)}. Expected 0 to 7 or one of: ${COLOR_NAMES.join(', ')}.`);
}

/** Colour Minitel: the three primaries and their mixes. */
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
 * Monochrome Minitel: each colour code becomes a grey level.
 * Codes from darkest to brightest, following the luminance of each colour (to check against the STUM).
 */
export const LUMINANCE_ORDER: readonly VtxColor[] = Object.freeze([0, 4, 1, 5, 2, 6, 3, 7] as VtxColor[]);

/** Grey for each colour code, 8 evenly spaced levels (spacing to check against the STUM). */
export const GREY_RGB: readonly string[] = Object.freeze(
  COLOR_NAMES.map((_, code) => {
    const level = LUMINANCE_ORDER.indexOf(code as VtxColor);
    const hex = Math.round((level * 255) / 7)
      .toString(16)
      .padStart(2, '0');
    return `#${hex}${hex}${hex}`;
  }),
);

export type PaletteName = 'color' | 'monochrome';

export function paletteOf(name: PaletteName): readonly string[] {
  return name === 'color' ? COLOR_RGB : GREY_RGB;
}
