# Changelog

Notable changes for each version. The format follows [Keep a Changelog](https://keepachangelog.com/en/1.1.0/) and versions follow [Semantic Versioning](https://semver.org/). Until 1.0, a minor version may change the API.

## Unreleased

### Changed

- README: the note saying the package was not published yet is gone, and a new example shows a 404 page.

## 0.1.0 (2026-11-27)

First version.

### Added

- Videotex core in plain TypeScript: 40 × 25 grid, 8 colors and their grey levels, 2 × 3 mosaics with their G1 codes, `PageBuilder`, reveal timing at 1,200 baud, function key codes, picture to mosaic conversion.
- React components: `Screen`, `FunctionKeys`, `Title`, `StatusRow`, `Frame`, `InputField`, `Menu` and `Mosaic`. All except `Screen` and `FunctionKeys` work both on a screen and on their own.
- Stylesheet: `videotex-ui/styles.css`.
- ES modules only, with types for every TypeScript `moduleResolution` (`bundler`, `node16`, `nodenext`), the stylesheet included.
- Support for React Server Components: the components are client components, and the core can run on the server.
- shadcn registry: one item per component, and `videotex-ui` for all of them.
- Technical values checked against the Minitel 1B specifications (STUM), with their sources in `docs/SPECS.md`.
- Legal checks in `docs/LEGAL.md`: trademark notice in the README, and the VT323 font served by the site rather than by Google.
