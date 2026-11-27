# Specifications used by the code

Every technical value used by the core (`src/core`) and the components, with its source. Checked on 2026-11-27 for [step 1](https://github.com/Gleaming0427/videotex-ui/issues/1).

## Sources

- **[STUM]** *Spécifications techniques d'utilisation du Minitel 1B*, Direction générale des Télécommunications, approved on 21 November 1986. Copy on the Internet Archive: [item page](https://archive.org/details/specifications-techniques-utilisation-minitel-1b), [OCR text](https://archive.org/stream/minitel-stum1b/minitel-stum1b_djvu.txt). References below are "part, chapter, section" of that document. Tables and figures that are images (G1 table, keyboard photos) cannot be read in the OCR text.
- **[STUM web]** [STUM1B online transcription](https://jbellue.github.io/stum1b/) by jbellue. Derived from the STUM, used to cross-read it, not as an independent source.
- **[Wikipédia]** [« Minitel »](https://fr.wikipedia.org/wiki/Minitel), French Wikipedia.
- **[Minitel1B_Hard]** [eserandour/Minitel1B_Hard](https://github.com/eserandour/Minitel1B_Hard), an Arduino library that drives real Minitel 1B terminals (`graphic()` function).

Status: **verified** = stated in the STUM (plus another source when there is one); **our choice** = not in the sources, chosen by us; **simplified** = the STUM rule is known but the code does something simpler.

## Screen

| Topic | Value in the code | Where | Source | Status |
| --- | --- | --- | --- | --- |
| Grid | 40 columns × 25 rows (00 to 24) | `grid.ts` | STUM 1-3 §2.2.1; Wikipédia | Verified |
| Row 0 | Service row for network messages: columns 1–36 for messages, 37–40 for the terminal status | `grid.ts`, `StatusRow` | STUM 1-3 §2.2.1, §2.4.4 | Verified. `StatusRow` writes its right-hand text in that status zone |
| Row 0 overflow | Every character after the 40th is shown in column 40 | `builder.ts` | STUM 2-2 §1.2.5.3 | Verified (fixed on 2026-11-27: was dropped) |
| Cell | 8 × 10 dots in 40-column mode; a glyph is usually 5 × 7 dots | `grid.ts` | STUM 1-3 §2.2.2 | Verified. The screen size of 320 × 250 dots follows from it |
| Line wrap | The 41st character of a row goes to the first column of the next row | `builder.ts` | STUM 2-2 §1.2.5.3 | Verified |
| Past row 24 | In page mode (the default), moving down from row 24 goes to row 01, same column; scroll mode moves the screen up instead | `builder.ts` | STUM, cursor movement and §2.4.7 (page and scroll modes) | Our choice: `PageBuilder` drops the text instead, so it never overwrites the top of the page |

## Mosaics (G1)

| Topic | Value in the code | Where | Source | Status |
| --- | --- | --- | --- | --- |
| Cell division | 6 blocks, 2 columns × 3 rows | `mosaic.ts` | STUM 1-3 §2.3.2 (6 blocks; 2 × 3 follows from the disjoint bars); Wikipédia (2 × 3) | Verified |
| Block heights | 3, 4 and 3 dots | `mosaic.ts` | Not in the STUM text | Our choice |
| Switching sets | SO selects G1 for the codes of columns 2 to 7, SI returns to G0 | (step 14) | STUM 2-2 §1.2.3.3 | Verified |
| Bit of each block | Bits 0 to 4 then bit 6, in reading order (top-left first) | `mosaic.ts` | STUM table p. 101 is an image; Minitel1B_Hard `graphic()` uses the same arithmetic | Partly verified: one implementation, block names not stated |
| Full block | `maskToG1Code(63)` gives 0x7F | `mosaic.ts` | Minitel1B_Hard sends 0x5F instead, as 0x7F is DEL | To settle with the G1 table before step 14 (streams) |
| Disjoint mode | Selected by the underline (lignage) attribute on mosaic characters; shows 2 vertical and 3 horizontal bars of background | `builder.ts`, `mosaicStyle.ts` | STUM 1-3 §2.3.2; 2-2 §1.2.4.1 | Verified. Bar width of 1 dot: our choice |

## Colors

| Topic | Value in the code | Where | Source | Status |
| --- | --- | --- | --- | --- |
| Codes | 0 black, 1 red, 2 green, 3 yellow, 4 blue, 5 magenta, 6 cyan, 7 white | `palette.ts` | STUM 2-2 §1.2.4.1 (ESC 4/0–4/7 foreground, 5/0–5/7 background); Wikipédia | Verified |
| Grey levels | Black 0 %, blue 40 %, red 50 %, magenta 60 %, green 70 %, cyan 80 %, yellow 90 %, white 100 % | `palette.ts`, `videotex.css` | STUM 1-3 §2.4.3 ("given as an indication"); Wikipédia (same order) | Verified (fixed on 2026-11-27: was 8 evenly spaced levels) |
| Color values | Pure RGB primaries and mixes | `palette.ts` | Not in the STUM 1B (a monochrome terminal) | Our choice |

## Attributes

| Topic | Value in the code | Where | Source | Status |
| --- | --- | --- | --- | --- |
| Character attributes | Foreground color, blinking, height, width, inverse; on mosaics also background color and disjoint | `cell.ts` | STUM 2-2 §1.1.3 | Verified |
| Zone attributes | Background color (text), masking, underline (text), set by delimiters | `cell.ts` | STUM 2-2 §1.1.3 | Simplified: every cell carries its own attributes (see below) |
| On mosaics | No size, no inverse; blinking applies; underline means disjoint | `builder.ts` | STUM 2-2 §1.2.4.1 | Verified |
| Double height | The character is drawn from the bottom: it sits on the cursor row and covers the row above | `builder.ts` | STUM 2-2 §1.2.4.2 | Verified |
| Rows 0 and 1 | Double height and double size are ignored there; double width is not | `builder.ts` | STUM 2-2 §1.2.4.2 | Verified (fixed on 2026-11-27: double size became double width) |
| Column 40 | Double width is drawn at normal width | `builder.ts` | STUM 2-2 §1.2.5.3 | Verified (fixed on 2026-11-27: the character wrapped) |
| Blinking | About 0.5 Hz | `videotex.css` | STUM 2-2 §1.1.2 | Verified (fixed on 2026-11-27: was 1 Hz) |
| Masking | Hides zones until revealed | — | STUM 2-2 §1.2.4.4 | Not implemented |

## Characters

| Topic | Value in the code | Where | Source | Status |
| --- | --- | --- | --- | --- |
| Accents | 15 lowercase accented letters: à è ù é â ê î ô û ä ë ï ö ü ç; no accented capitals in the usual set; œ and Œ through SS2 | (not checked by `PageBuilder`) | STUM 2-2 §1.2.3.2; 1-3 §2.3.1 | Verified. The demo writes capitals without accents |
| Accent coding | SS2 (1/9), accent from G2 column 4, then the letter: é = 1/9 4/2 6/5 | (step 14) | STUM 2-2 §1.2.3.2 | Verified |

## Function keys

| Topic | Value in the code | Where | Source | Status |
| --- | --- | --- | --- | --- |
| Keys | Envoi, Retour, Répétition, Guide, Annulation, Sommaire, Correction, Suite (plus Connexion/Fin, for the modem) | `keys.ts` | STUM 2-3 §6 | Verified |
| Codes | SEP (0x13) then 0x41 Envoi, 0x42 Retour, 0x43 Répétition, 0x44 Guide, 0x45 Annulation, 0x46 Sommaire, 0x47 Correction, 0x48 Suite | `keys.ts` | STUM 2-3 §6 | Verified |
| Look | Function keys differ in shape and color; Envoi is green | `videotex.css` | STUM 1-4 §2.4 | Verified (our Send key is green) |
| Layout | Two columns of four | `keys.ts` | The STUM shows the keyboard in photos only | Our choice, not verified |
| Keyboard shortcuts | Enter for Envoi, Escape for Annulation… | `keys.ts` | — | Our choice |

## Line

| Topic | Value in the code | Where | Source | Status |
| --- | --- | --- | --- | --- |
| Speed | 1,200 baud to the Minitel, 75 baud back | `reveal.ts` | STUM 2-1 §3.1; Wikipédia | Verified |
| Character format | Start bit, 7 data bits, even parity, stop bit: 10 bits, so 120 characters per second at 1,200 baud | `reveal.ts` | STUM 2-1 §2.1; STUM web ("120 caractères par seconde") | Verified |

## Known simplifications

- **Parallel attributes**: each cell carries its own colors and attributes. A Minitel uses zone attributes for the background, underline and masking, which change on a delimiter. The strict faithful mode comes with the stream decoder ([step 14](https://github.com/Gleaming0427/videotex-ui/issues/14)).
- **Overlapping double sizes**: writing over part of a double-size character does not clear its other parts.
- **Font**: VT323 (Google Fonts) stretched horizontally until the custom font is ready ([step 12](https://github.com/Gleaming0427/videotex-ui/issues/12)). The STUM's 5 × 7 glyph in an 8 × 10 cell is the target for that font.

## Still open

- **G1 table** (STUM p. 101, an image): confirm which bit is which block, and whether the full block is 0x7F or 0x5F.
- **Keyboard layout** (STUM photos): confirm the arrangement of the 8 function keys.
- **Block heights**: the STUM gives none; 3, 4, 3 could be checked against a photo or an emulator.
