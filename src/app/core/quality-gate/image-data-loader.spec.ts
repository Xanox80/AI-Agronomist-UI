import { afterEach, describe, expect, it, vi } from 'vitest';
import { ImageDataLoader } from './image-data-loader';

function stubBrowser(bitmapSize: { width: number; height: number }) {
  const close = vi.fn();
  const drawImage = vi.fn();
  const getImageData = vi.fn((_x: number, _y: number, width: number, height: number) => ({ width, height, data: [] }));
  const dimensions: number[][] = [];
  vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ ...bitmapSize, close }));
  vi.stubGlobal(
    'OffscreenCanvas',
    class {
      constructor(width: number, height: number) {
        dimensions.push([width, height]);
      }
      getContext() {
        return { drawImage, getImageData };
      }
    },
  );
  return { close, dimensions };
}

describe('ImageDataLoader', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('downscales so the longest edge fits maxEdgePx and keeps the aspect ratio', async () => {
    const { dimensions, close } = stubBrowser({ width: 4000, height: 3000 });
    const image = await new ImageDataLoader().load(new Blob(['x']), 400);
    expect(dimensions[0]).toEqual([400, 300]);
    expect([image.width, image.height]).toEqual([400, 300]);
    expect(close).toHaveBeenCalled();
  });

  it('never upscales a small image', async () => {
    const { dimensions } = stubBrowser({ width: 100, height: 50 });
    await new ImageDataLoader().load(new Blob(['x']), 400);
    expect(dimensions[0]).toEqual([100, 50]);
  });
});

describe('ImageDataLoader fallbacks and failures', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('rejects when the photo cannot be decoded', async () => {
    vi.stubGlobal('createImageBitmap', vi.fn().mockRejectedValue(new Error('undecodable')));
    await expect(new ImageDataLoader().load(new Blob(['x']), 400)).rejects.toThrow('undecodable');
  });

  it('rejects and releases the bitmap when no 2D context is available', async () => {
    const close = vi.fn();
    vi.stubGlobal('createImageBitmap', vi.fn().mockResolvedValue({ width: 10, height: 10, close }));
    vi.stubGlobal('OffscreenCanvas', class { getContext() { return null; } });
    await expect(new ImageDataLoader().load(new Blob(['x']), 400)).rejects.toThrow('2D canvas');
    expect(close).toHaveBeenCalled();
  });

  it('falls back to an <img> element and a DOM canvas without createImageBitmap/OffscreenCanvas', async () => {
    vi.stubGlobal('createImageBitmap', undefined);
    vi.stubGlobal('OffscreenCanvas', undefined);
    vi.stubGlobal('URL', { createObjectURL: () => 'blob:x', revokeObjectURL: vi.fn() });
    vi.stubGlobal('Image', class { naturalWidth = 800; naturalHeight = 400; src = ''; decode = () => Promise.resolve(); });
    const drawImage = vi.fn();
    const getImageData = vi.fn((_x: number, _y: number, width: number, height: number) => ({ width, height, data: [] }));
    vi.spyOn(document, 'createElement').mockReturnValue({ getContext: () => ({ drawImage, getImageData }) } as unknown as HTMLElement);
    const image = await new ImageDataLoader().load(new Blob(['x']), 400);
    expect([image.width, image.height]).toEqual([400, 200]);
    vi.restoreAllMocks();
  });
});
