# Specifications used by the code

Values used in the core (`src/core`). Until [step 1](https://github.com/Gleaming0427/videotex-ui/issues/1) is done, none of them has been cross-checked against the STUM (the official Minitel technical specification).

Status: **single source** = one source cited in the project sheet; **to check** = working value, no verified source.

| Topic | Value in the code | Where | Status |
| --- | --- | --- | --- |
| Grid | 40 columns × 25 rows | `grid.ts` | Single source (Wikipedia) |
| Row 0 | Service row: no wrapping, normal size only | `grid.ts`, `builder.ts` | To check |
| Cell | 8 × 10 dots (320 × 250-dot screen) | `grid.ts` | To check |
| Mosaics | 2 × 3 sixels; 4-dot columns; rows of 3, 4 and 3 dots | `mosaic.ts` | To check |
| G1 codes | 0x20 to 0x3F, then 0x60 to 0x7F; bit 6 of the code = bottom-right sixel | `mosaic.ts` | To check |
| Disjoint mosaic | Underline attribute in mosaic mode; each sixel loses 1 dot on the right and at the bottom | `mosaicStyle.ts` | To check |
| Colors | Black, red, green, yellow, blue, magenta, cyan, white (codes 0 to 7) | `palette.ts` | To check |
| Grey levels | Luminance order: black, blue, red, magenta, green, cyan, yellow, white; 8 evenly spaced levels | `palette.ts` | Order to check, spacing assumed |
| Double height | The character covers the cursor row and the row above; refused on rows 0 and 1 | `builder.ts` | To check |
| Double width | The character covers the cursor column and the next one | `builder.ts` | To check |
| Attributes on mosaics | No size, no inverse; blinking applies | `builder.ts` | To check |
| Accents | No accented capitals | (demo) | To check |
| Speed | 1,200 baud, 10 bits per character, so 120 characters per second | `reveal.ts` | To check |
| Function keys | Répétition, Suite, Sommaire, Guide, Annulation, Retour, Correction, Envoi | `keys.ts` | Single source (1986 DGT brochure) |
| Key layout | Two columns of four: Sommaire / Guide, Annulation / Correction, Retour / Suite, Répétition / Envoi | `keys.ts` | To check |
| Keyboard shortcuts | Our own choice (Enter for Envoi, Escape for Annulation…), not a Minitel standard | `keys.ts` | Design choice |

## Known simplifications

- **Parallel attributes**: each cell carries its own colors and attributes. A real Minitel uses serial attributes (the background changes on a delimiter). The strict faithful mode comes with the stream decoder ([step 14](https://github.com/Gleaming0427/videotex-ui/issues/14)).
- **Overlapping double sizes**: writing over part of a double-size character does not clear its other parts.
- **Font**: VT323 (Google Fonts) stretched horizontally until the custom font is ready ([step 12](https://github.com/Gleaming0427/videotex-ui/issues/12)).
