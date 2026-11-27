# Legal checks

What was checked before the launch, where it was checked and what the project does about it. Checked on 2026-11-27 for [step 9](https://github.com/Gleaming0427/videotex-ui/issues/9).

This is a record of checks, not legal advice. Before any commercial use, or if a rights holder makes contact, ask an intellectual property lawyer.

## Summary

| Point | Finding | What the project does |
| --- | --- | --- |
| "Minitel" trademark | Two word marks in force in France, owned by Orange, covering software and videotex | Uses the word only to refer to the original terminal, never as a name; trademark notice in the README |
| "Videotex" and the name `videotex-ui` | A generic term; no mark in force in France or the EU | Keeps the name |
| Font | VT323 is under the SIL Open Font License 1.1, with no reserved name | Does not bundle it; the demo now serves it itself instead of loading it from Google |
| Content | No logo, no page from a real service, no 3615 code | Rules below for the demo, the GIF and the launch |
| Sounds | No recording in the project | The demo's sounds are synthesized in code |

## 1. The "Minitel" trademark

**Where**: [TMview](https://www.tmdn.org/tmview/) (EUIPO), which republishes the INPI register (data updated on 2026-11-27), searched for marks containing "minitel": 281 results in 29 offices. The INPI's own search ([data.inpi.fr](https://data.inpi.fr)) refused the requests during the check (HTTP 429); the INPI record of each mark is linked below.

Marks in force that cover this project:

| Mark | Number | Owner | Filed | Renewed | Classes | Relevant goods and services |
| --- | --- | --- | --- | --- | --- | --- |
| MINITEL (word) | [FR 1725215](https://data.inpi.fr/marques/FR1725215) | Orange SA | 1991-05-21 | 2021 (BOPI 2021-21), so until 2031 | 9, 37, 38, 41 | Electronic devices and systems for telematics, computing and telecommunications, and services "in the field of communications, videotex, telematics…" |
| MINITEL (word) | [FR 3351789](https://data.inpi.fr/marques/FR3351789) | Orange SA | 2005-04-08 | 2025 (BOPI 2025-18), so until 2035 | 9, 16, 35, 38, 41, 42, 45 | Software and software packages (class 9), web page creation and website design (class 42) |

Other results:

- **Expired**: FR 1178866 (MINITEL, filed in 1981 by the French State), and the international registrations 559603 and 575509 (France Télécom).
- **No EU trade mark** contains "minitel".
- **Other owners, unrelated goods**: FR 4401063 "minitel" (class 36, financial services) and FR 4633261 "minitel rosé" (wines and bars). Marks abroad (Morocco, India, Mexico, Paraguay…) cover other goods or have other owners.

**Conclusion**: "Minitel" is a trademark of Orange, in force in France for software and videotex, which is exactly this project's field. Using it as the name of the project, of a package, a component, a domain or a logo would infringe it. Whether Orange still uses the mark (a mark unused for 5 years can be revoked, French IP code art. L714-5) does not change this: the project treats it as in force.

## 2. Referring to the Minitel

**Rule**: a trademark owner cannot forbid others from using the mark to refer to the owner's goods, in line with honest practices (French IP code art. L713-6, from Directive (EU) 2015/2436 art. 14). The Court of Justice of the EU sets out what is not honest (*Gillette*, C-228/03, 17 March 2005):
- suggesting a commercial link with the owner;
- taking unfair advantage of the mark, or harming it;
- running it down;
- presenting one's product as an imitation or a replica of the owner's product.

**What the project does**:
- The package, the components and the repository are named after Videotex, the generic name of the technology: `videotex-ui`, `Screen`, `FunctionKeys`…
- "Minitel" only refers to the original terminal: "inspired by the Minitel", "like the Minitel 1B", "the labels printed on the Minitel". The constant `MINITEL_BAUD` names the speed of that terminal in the same way.
- There is no Orange, France Télécom or Minitel logo, and no Orange colors used as branding.
- The README has a **Trademarks** section: Minitel is a trademark of Orange, and the project is independent, not affiliated with Orange, nor sponsored or endorsed by it.
- The package description says "inspired by French Videotex". `minitel` appears once, as a search keyword that describes the inspiration.

**Wording for the launch** ([step 11](https://github.com/Gleaming0427/videotex-ui/issues/11)):
- **GitHub description**: "React UI kit inspired by the Minitel and French Videotex: 40 × 25 grid, mosaic graphics, 8 colors, function keys".
- **GitHub topics**: `react`, `videotex`, `minitel`, `retro`, `ui-kit`, `shadcn`.
- **Avoid**: "Minitel UI", "Minitel for React", "official", "Minitel replica" or "Minitel clone", a domain or a social account containing "minitel", and a logo shaped like the terminal.

## 3. Font

**VT323** by Peter Hull: "Copyright 2011, The VT323 Project Authors", under the [SIL Open Font License 1.1](https://github.com/google/fonts/blob/main/ofl/vt323/OFL.txt). The license declares **no reserved font name**. It allows the font to be used, embedded and redistributed with software, but not sold on its own.

- The package does not include the font. Its stylesheet names "VT323" and falls back to the system's monospace fonts.
- **The demo loaded VT323 from Google's servers**. It now uses [`@fontsource/vt323`](https://www.npmjs.com/package/@fontsource/vt323) 5.3.0 (OFL 1.1), so the font is served with the demo. Loading a font from Google sends each visitor's IP address to Google. The Munich regional court found this breached the GDPR when done without consent (LG München I, 20 January 2022, 3 O 17493/20).
- The README and the message shown by the shadcn CLI recommend serving the font yourself.
- The project's own 8 × 10 font ([step 12](https://github.com/Gleaming0427/videotex-ui/issues/12)) will remove the dependency. Its license is chosen then.

## 4. Content

The whole repository (code, demo, documentation, tests) was searched on 2026-11-27:

- **No image file** of any kind (PNG, JPEG, GIF, SVG, icon), so no logo. The converter's sample picture is drawn by code.
- **The demo service is fictional** (status row "VIDEOTEX-UI", "Fictional service"). No page copies a real service, and no 36xx code appears (3615, 3614, 3617…). The "0.00 F/min" rate shown in the demo is invented.
- **Pages are written from scratch** with `PageBuilder`. No page or `.vdt` file from a real service is used.
- **The terminal's case is not drawn**: the demo shows the screen grid, and the function keys as plain buttons.

Rules for the demo, the GIF ([step 10](https://github.com/Gleaming0427/videotex-ui/issues/10)), the `.vdt` test files ([step 14](https://github.com/Gleaming0427/videotex-ui/issues/14)) and the launch:
- No real service name or code (a 3615 code with a name), and no screenshot or `.vdt` file of a real service: we make our own.
- No Orange, France Télécom or PTT logo.
- No photo or drawing of a Minitel terminal unless we hold the rights to that picture (our own photo).

## 5. Sounds

- No sound file in the repository (searched for wav, mp3 and ogg).
- The demo's sounds, a key beep and the modem connection, are computed in `demo/sound.ts` with the Web Audio API, from the V.23 modem standard (frequencies only). They are off by default.
- **Rule**: any sound is synthesized in code. No recording of a Minitel or a modem, not even one found online: a recording belongs to whoever made it (producer's rights, French IP code art. L213-1).

## 6. Other points checked

- **STUM**: the code uses technical values (facts), each cited by section in [SPECS.md](SPECS.md). The document is © France Télécom. It was read on the Internet Archive and is not redistributed: the scanned PDF was deleted after reading and never committed.
- **Third-party code**: none copied. Minitel1B_Hard and the jbellue transcription are cited as sources for values only.
- **Dependencies**: the package has no runtime dependency (React is a peer dependency). The build and test tools are not distributed.
- **This project's license**: MIT ([LICENSE](../LICENSE)). The shadcn registry copies the source into other projects, and MIT asks that copies keep the copyright notice. The copied files do not carry it yet; a header line in each file would fix that.
- **Privacy**: the components send nothing over the network. The image converter works in the browser, so pictures are never uploaded. The demo has no analytics and sets no cookies; keep it that way for the demo site (step 10).

## Before the launch

- Set the GitHub description and topics with the wording above (step 11).
- If the launch happens months after this check, check the status of the two Orange marks again on TMview or data.inpi.fr.
