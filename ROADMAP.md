# Roadmap

Each step has its own issue with the task list. The step number is also the issue number.

## MVP — 14-day test

What the validation test needs: 8 components, demo page, GIF, launch on day 8, measurement on day 14.

| Step | Issue | Done when |
| --- | --- | --- |
| 1 | [Cross-check the specs against the STUM](https://github.com/Gleaming0427/videotex-ui/issues/1) | Every value in `docs/SPECS.md` cites the STUM or two matching sources. |
| 2 | [Repository setup](https://github.com/Gleaming0427/videotex-ui/issues/2) | `npm ci`, `npm run typecheck`, `npm test` and `npm run build` pass locally and in CI. |
| 3 | [Videotex core in plain TypeScript](https://github.com/Gleaming0427/videotex-ui/issues/3) | Tests pass and the API is described in the README. |
| 4 | [Screen component](https://github.com/Gleaming0427/videotex-ui/issues/4) | The demo shows a full, sharp page in color and in grey. |
| 5 | [FunctionKeys](https://github.com/Gleaming0427/videotex-ui/issues/5) | The demo moves between several pages with Next, Back and Index. |
| 6 | [Form and navigation components](https://github.com/Gleaming0427/videotex-ui/issues/6) | 8 components in total (with `Screen`, `FunctionKeys` and `Mosaic`) used in the demo. |
| 7 | [Mosaic: image converter](https://github.com/Gleaming0427/videotex-ui/issues/7) | A photo dropped into the demo shows as a mosaic and can be exported. |
| 8 | [npm package and shadcn registry](https://github.com/Gleaming0427/videotex-ui/issues/8) | The shadcn install command adds `Screen` to a fresh project. |
| 9 | [Legal checks](https://github.com/Gleaming0427/videotex-ui/issues/9) | Each point is checked and recorded in `docs/LEGAL.md`. |
| 10 | [Demo site and GIF](https://github.com/Gleaming0427/videotex-ui/issues/10) | The demo is online and the GIF lasts under 10 seconds. |
| 11 | [Launch and day-14 measurement](https://github.com/Gleaming0427/videotex-ui/issues/11) | A written decision to continue or stop. |

## v1

Full fidelity after the test: custom font, Canvas renderer, Videotex streams.

| Step | Issue | Done when |
| --- | --- | --- |
| 12 | [8 × 10 pixel font](https://github.com/Gleaming0427/videotex-ui/issues/12) | The demo no longer uses VT323. |
| 13 | [Pixel-exact Canvas renderer](https://github.com/Gleaming0427/videotex-ui/issues/13) | DOM and Canvas renders of the same page look identical. |
| 14 | [Videotex streams (.vdt)](https://github.com/Gleaming0427/videotex-ui/issues/14) | An exported page reads back identically in miedit. |

## Suggested order

1. Steps 2 to 4: setup, core and `Screen`, which everything else builds on.
2. Step 1 in parallel: the verified values correct the core constants.
3. Steps 5 to 7: the other components.
4. Steps 8 to 10: package, legal checks, demo.
5. Step 11: launch (on a Saturday, for r/webdev).
