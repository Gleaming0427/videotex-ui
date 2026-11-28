import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
// VT323 served with the demo: no request to Google's servers (see docs/LEGAL.md).
import '@fontsource/vt323';
import '../src/styles/videotex.css';
import './demo.css';
import { NotFound } from './NotFound';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <NotFound />
  </StrictMode>,
);
