// Records the README GIF and the screenshots from the built demo (npm run record).
// Needs Google Chrome (or CHROME_PATH) and ffmpeg. Writes to docs/media/.
//
// The GIF is filmed in real time with the Chrome screencast, then cut to 12 frames a second
// and reduced to one palette by ffmpeg.
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createServer } from 'node:http';
import { tmpdir } from 'node:os';
import { extname, join, normalize, resolve } from 'node:path';
import puppeteer from 'puppeteer-core';

const root = resolve(import.meta.dirname, '..');
const site = join(root, 'demo-dist');
const media = join(root, 'docs/media');
const chrome = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2', '.woff': 'font/woff' };

const sleep = (ms) => new Promise((done) => setTimeout(done, ms));

/** Serves demo-dist on a free port. */
function serve() {
  const server = createServer((req, res) => {
    const path = normalize(decodeURIComponent(new URL(req.url, 'http://x').pathname)).replace(/^(\.\.[/\\])+/, '');
    try {
      const file = join(site, path === '/' ? 'index.html' : path);
      const body = readFileSync(file);
      res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' }).end(body);
    } catch {
      res.writeHead(404).end();
    }
  });
  return new Promise((done) => server.listen(0, '127.0.0.1', () => done(server)));
}

/** Rectangle of an element in page pixels, rounded to even numbers for the video filters. */
async function box(page, selector) {
  const rect = await page.$eval(selector, (element) => {
    const r = element.getBoundingClientRect();
    return { x: r.x, y: r.y, width: r.width, height: r.height };
  });
  const even = (n) => Math.round(n / 2) * 2;
  return { x: even(rect.x), y: even(rect.y), width: even(rect.width), height: even(rect.height) };
}

/** Waits until the screen inside `selector` has finished its progressive display. */
async function revealed(page, selector) {
  await page.waitForFunction((s) => !document.querySelector(`${s} .vtx-screen`)?.classList.contains('vtx-revealing'), {}, selector);
}

const server = await serve();
const url = `http://127.0.0.1:${server.address().port}/`;
const browser = await puppeteer.launch({ executablePath: chrome, headless: true, args: ['--hide-scrollbars'] });
const work = mkdtempSync(join(tmpdir(), 'videotex-record-'));
mkdirSync(media, { recursive: true });

try {
  const page = await browser.newPage();
  await page.setViewport({ width: 720, height: 800, deviceScaleFactor: 1 });
  await page.emulateMediaFeatures([{ name: 'prefers-reduced-motion', value: 'no-preference' }]);
  await page.goto(url, { waitUntil: 'networkidle0' });
  await page.evaluate(() => document.fonts.ready);

  // Screenshots: the fictional service once drawn, and the converter with its sample picture.
  await revealed(page, '.demo-terminal');
  await (await page.locator('.demo-terminal').waitHandle()).screenshot({ path: join(media, 'service.png') });
  await page.locator('button::-p-text(use a sample)').click();
  await page.waitForSelector('.demo-converter-preview .vtx-mosaic');
  await sleep(300);
  await (await page.locator('.demo-converter').waitHandle()).screenshot({ path: join(media, 'converter.png') });

  // The two-mode section, at the top of the viewport, with a name already typed.
  const section = '.demo-modes';
  await page.$eval(section, (element) => element.scrollIntoView());
  // Only this section in the picture: what follows it would show under the shorter web mode.
  await page.addStyleTag({ content: `${section} ~ * { visibility: hidden !important; }` });
  await page.locator(`${section} input`).fill('Ada');
  await page.locator(`${section} h2`).click();
  await (await page.locator(`${section} .demo-modern-grid`).waitHandle()).screenshot({ path: join(media, 'web-mode.png') });

  // GIF: web mode, the switch, the page drawn at 1,200 baud, then a menu choice.
  const frames = [];
  const cdp = await page.createCDPSession();
  cdp.on('Page.screencastFrame', ({ data, metadata, sessionId }) => {
    frames.push({ data, time: metadata.timestamp });
    void cdp.send('Page.screencastFrameAck', { sessionId });
  });
  await cdp.send('Page.startScreencast', { format: 'png', everyNthFrame: 1 });
  await sleep(1200);
  await page.locator('button::-p-text(Switch to Videotex mode)').click();
  await revealed(page, section);
  await sleep(900);
  await page.locator(`${section} li:nth-child(2) button`).click();
  await sleep(1500);
  await cdp.send('Page.stopScreencast');
  const crop = await box(page, section);
  await (await page.locator(`${section} .vtx-screen`).waitHandle()).screenshot({ path: join(media, 'videotex-mode.png') });

  // Frames to a GIF: each frame lasts until the next one.
  const list = [];
  frames.forEach((frame, i) => {
    const file = join(work, `${String(i).padStart(5, '0')}.png`);
    writeFileSync(file, Buffer.from(frame.data, 'base64'));
    const next = frames[i + 1]?.time ?? frame.time + 0.1;
    list.push(`file '${file}'`, `duration ${(next - frame.time).toFixed(4)}`);
  });
  list.push(list.at(-2));
  writeFileSync(join(work, 'list.txt'), `${list.join('\n')}\n`);
  const seconds = frames.at(-1).time - frames[0].time;
  const filters =
    `crop=${crop.width}:${crop.height}:${crop.x}:${crop.y},fps=12,split[a][b];` +
    '[a]palettegen=max_colors=64:stats_mode=full[p];[b][p]paletteuse=dither=bayer:bayer_scale=5';
  execFileSync('ffmpeg', ['-y', '-loglevel', 'error', '-f', 'concat', '-safe', '0', '-i', join(work, 'list.txt'), '-vf', filters, '-loop', '0', join(media, 'demo.gif')]);
  console.log(`demo.gif: ${frames.length} frames over ${seconds.toFixed(1)} s, crop ${crop.width} × ${crop.height}`);
} finally {
  await browser.close();
  server.close();
  rmSync(work, { recursive: true, force: true });
}
