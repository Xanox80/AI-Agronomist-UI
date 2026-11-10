import { PixelImage } from '../quality-gate.model';

export type Rgb = readonly [number, number, number];

export const LEAF_DARK: Rgb = [30, 140, 30];
export const LEAF_LIGHT: Rgb = [70, 200, 60];
export const GRAY_DARK: Rgb = [70, 70, 70];
export const GRAY_LIGHT: Rgb = [190, 190, 190];
export const SIZE = 64;

export function fromPixels(width: number, height: number, colorAt: (x: number, y: number) => Rgb): PixelImage {
  const data = new Uint8ClampedArray(width * height * 4);
  for (let y = 0; y < height; y++) {
    for (let x = 0; x < width; x++) {
      data.set([...colorAt(x, y), 255], (y * width + x) * 4);
    }
  }
  return { data, width, height };
}

export const solid = (color: Rgb, size = SIZE): PixelImage => fromPixels(size, size, () => color);

export const checkerboard = (a: Rgb, b: Rgb, size = SIZE): PixelImage =>
  fromPixels(size, size, (x, y) => ((x + y) % 2 === 0 ? a : b));

export function boxBlur(image: PixelImage, radius: number, passes: number): PixelImage {
  let current = image;
  for (let pass = 0; pass < passes; pass++) {
    const source = current;
    current = fromPixels(image.width, image.height, (x, y) => {
      const sum = [0, 0, 0];
      let count = 0;
      for (let dy = -radius; dy <= radius; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = Math.min(image.width - 1, Math.max(0, x + dx));
          const ny = Math.min(image.height - 1, Math.max(0, y + dy));
          const o = (ny * image.width + nx) * 4;
          for (let c = 0; c < 3; c++) sum[c] += source.data[o + c];
          count++;
        }
      }
      return [sum[0] / count, sum[1] / count, sum[2] / count];
    });
  }
  return current;
}
