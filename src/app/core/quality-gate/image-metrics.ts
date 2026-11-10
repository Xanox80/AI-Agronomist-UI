import { PixelImage } from './quality-gate.model';

const MAX_CHANNEL = 255;
const LUMA_RED = 0.2126;
const LUMA_GREEN = 0.7152;
const LUMA_BLUE = 0.0722;
const CHANNELS = 4;
const LAPLACIAN_CENTER_WEIGHT = 4;
const EXG_GREEN_WEIGHT = 2;

export interface GreenOptions {
  minExcessGreen: number;
  minChannelSum: number;
}

export interface ExposureStats {
  meanLuminance: number;
  clippedHighlightShare: number;
  clippedShadowShare: number;
}

/** Rec.709 luminance per pixel on a 0..255 scale. */
export function luminanceGrid(image: PixelImage): Float32Array {
  const pixels = image.width * image.height;
  const luma = new Float32Array(pixels);
  for (let i = 0; i < pixels; i++) {
    const o = i * CHANNELS;
    luma[i] = LUMA_RED * image.data[o] + LUMA_GREEN * image.data[o + 1] + LUMA_BLUE * image.data[o + 2];
  }
  return luma;
}

/** Variance of the 4-neighbour Laplacian over interior pixels; low values mean blur. */
export function laplacianVariance(luma: Float32Array, width: number, height: number): number {
  if (width < 3 || height < 3) return 0;
  let sum = 0;
  let sumSquares = 0;
  let count = 0;
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      const i = y * width + x;
      const laplacian = luma[i - 1] + luma[i + 1] + luma[i - width] + luma[i + width] - LAPLACIAN_CENTER_WEIGHT * luma[i];
      sum += laplacian;
      sumSquares += laplacian * laplacian;
      count++;
    }
  }
  const mean = sum / count;
  return sumSquares / count - mean * mean;
}

export function exposureStats(luma: Float32Array, clipLowLevel: number, clipHighLevel: number): ExposureStats {
  let total = 0;
  let highlights = 0;
  let shadows = 0;
  for (const value of luma) {
    const level = value / MAX_CHANNEL;
    total += level;
    if (level >= clipHighLevel) highlights++;
    if (level <= clipLowLevel) shadows++;
  }
  const n = luma.length || 1;
  return { meanLuminance: total / n, clippedHighlightShare: highlights / n, clippedShadowShare: shadows / n };
}

/** 1 where the excess-green index ExG = 2g - r - b (on chromaticity) reaches the threshold. */
export function greenMask(image: PixelImage, options: GreenOptions): Uint8Array {
  const pixels = image.width * image.height;
  const mask = new Uint8Array(pixels);
  for (let i = 0; i < pixels; i++) {
    const o = i * CHANNELS;
    const r = image.data[o];
    const g = image.data[o + 1];
    const b = image.data[o + 2];
    const sum = r + g + b;
    if (sum >= options.minChannelSum && (EXG_GREEN_WEIGHT * g - r - b) / sum >= options.minExcessGreen) mask[i] = 1;
  }
  return mask;
}

export function maskShare(mask: Uint8Array): number {
  if (mask.length === 0) return 0;
  let set = 0;
  for (const value of mask) set += value;
  return set / mask.length;
}

/** Bounding-box area share of the largest 4-connected blob in the mask. */
export function largestBlobBoxShare(mask: Uint8Array, width: number, height: number): number {
  const visited = new Uint8Array(mask.length);
  const stack = new Int32Array(mask.length);
  let bestSize = 0;
  let bestBox = 0;
  for (let start = 0; start < mask.length; start++) {
    if (!mask[start] || visited[start]) continue;
    let top = 0;
    let size = 0;
    let minX = width;
    let maxX = 0;
    let minY = height;
    let maxY = 0;
    stack[top++] = start;
    visited[start] = 1;
    while (top > 0) {
      const i = stack[--top];
      const x = i % width;
      const y = (i - x) / width;
      size++;
      minX = Math.min(minX, x);
      maxX = Math.max(maxX, x);
      minY = Math.min(minY, y);
      maxY = Math.max(maxY, y);
      const neighbours = [
        x > 0 ? i - 1 : -1,
        x < width - 1 ? i + 1 : -1,
        y > 0 ? i - width : -1,
        y < height - 1 ? i + width : -1,
      ];
      for (const n of neighbours) {
        if (n >= 0 && mask[n] && !visited[n]) {
          visited[n] = 1;
          stack[top++] = n;
        }
      }
    }
    if (size > bestSize) {
      bestSize = size;
      bestBox = (maxX - minX + 1) * (maxY - minY + 1);
    }
  }
  return bestBox / (width * height || 1);
}
