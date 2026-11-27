// Browser side of the mosaic converter: loading pictures and writing PNG files with a canvas.
import { CELL_HEIGHT, CELL_WIDTH } from '../core/grid';
import { imageToMosaic, mosaicSize, renderMosaic, type MosaicImage, type RgbaImage } from '../core/image';
import type { PaletteName } from '../core/palette';

function canvas(width: number, height: number): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const element = document.createElement('canvas');
  element.width = width;
  element.height = height;
  const context = element.getContext('2d', { willReadFrequently: true });
  if (!context) throw new Error('Canvas 2D is not available.');
  return [element, context];
}

/** Loads a picture. Pictures from another site need CORS headers, or their pixels cannot be read. */
export async function loadImage(src: string): Promise<HTMLImageElement> {
  const image = new Image();
  image.crossOrigin = 'anonymous';
  image.decoding = 'async';
  image.src = src;
  await image.decode();
  return image;
}

/** Pixels of a picture resized to cols × 8 by rows × 10, one pixel per screen dot. */
export function imagePixels(source: CanvasImageSource, cols: number, rows: number): RgbaImage {
  const [, context] = canvas(cols * CELL_WIDTH, rows * CELL_HEIGHT);
  context.imageSmoothingEnabled = true;
  context.imageSmoothingQuality = 'high';
  context.drawImage(source, 0, 0, cols * CELL_WIDTH, rows * CELL_HEIGHT);
  return context.getImageData(0, 0, cols * CELL_WIDTH, rows * CELL_HEIGHT);
}

export interface ConvertImageOptions {
  readonly cols?: number;
  readonly rows?: number;
  readonly palette?: PaletteName;
  readonly dither?: boolean;
}

/** Loads a picture and converts it; without cols or rows it is 40 columns wide. */
export async function convertImage(src: string, options: ConvertImageOptions = {}): Promise<MosaicImage> {
  const image = await loadImage(src);
  const size = mosaicSize(image.naturalWidth, image.naturalHeight, { cols: options.cols, rows: options.rows });
  return imageToMosaic(imagePixels(image, size.cols, size.rows), { ...size, palette: options.palette, dither: options.dither });
}

/** A PNG file of the mosaic. `scale` is the number of pixels per screen dot (default 2). */
export function mosaicToPng(image: MosaicImage, options: { palette?: PaletteName; scale?: number } = {}): Promise<Blob> {
  const { width, height, data } = renderMosaic(image, { palette: options.palette, scale: options.scale ?? 2 });
  const [element, context] = canvas(width, height);
  context.putImageData(new ImageData(data, width, height), 0, 0);
  return new Promise((resolve, reject) => {
    element.toBlob((blob) => (blob ? resolve(blob) : reject(new Error('PNG export failed.'))), 'image/png');
  });
}
