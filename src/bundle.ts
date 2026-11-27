// Entry of the library build only: pulls the stylesheet into dist/videotex-ui.css.
// Types are generated from index.ts, so the published .d.ts files never import CSS.
import './styles/videotex.css';

export * from './index';
