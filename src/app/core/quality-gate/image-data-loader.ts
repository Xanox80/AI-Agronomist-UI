import { Injectable } from '@angular/core';
import { PixelImage } from './quality-gate.model';

interface DecodedPhoto {
  source: CanvasImageSource;
  width: number;
  height: number;
  release(): void;
}

async function decodeWithBitmap(image: Blob): Promise<DecodedPhoto> {
  const bitmap = await createImageBitmap(image);
  return { source: bitmap, width: bitmap.width, height: bitmap.height, release: () => bitmap.close() };
}

async function decodeWithImageElement(image: Blob): Promise<DecodedPhoto> {
  const url = URL.createObjectURL(image);
  const element = new Image();
  element.src = url;
  try {
    await element.decode();
  } catch (error) {
    URL.revokeObjectURL(url);
    throw error;
  }
  return {
    source: element,
    width: element.naturalWidth,
    height: element.naturalHeight,
    release: () => URL.revokeObjectURL(url),
  };
}

function createCanvas(width: number, height: number): OffscreenCanvas | HTMLCanvasElement {
  if (typeof OffscreenCanvas !== 'undefined') return new OffscreenCanvas(width, height);
  return Object.assign(document.createElement('canvas'), { width, height });
}

/** Decodes a photo and downscales it so its longest edge is at most maxEdgePx, to save battery. */
@Injectable({ providedIn: 'root' })
export class ImageDataLoader {
  /** Rejects when the photo cannot be decoded; falls back to <img>/<canvas> where bitmap APIs are missing. */
  async load(image: Blob, maxEdgePx: number): Promise<PixelImage> {
    const photo = await (typeof createImageBitmap === 'function' ? decodeWithBitmap(image) : decodeWithImageElement(image));
    try {
      const scale = Math.min(1, maxEdgePx / Math.max(photo.width, photo.height));
      const width = Math.max(1, Math.round(photo.width * scale));
      const height = Math.max(1, Math.round(photo.height * scale));
      const context = createCanvas(width, height).getContext('2d', { willReadFrequently: true });
      if (!context) throw new Error('2D canvas is not available');
      context.drawImage(photo.source, 0, 0, width, height);
      return context.getImageData(0, 0, width, height);
    } finally {
      photo.release();
    }
  }
}
