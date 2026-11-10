import { downloadBlob } from './file-download';

describe('downloadBlob', () => {
  it('clicks a temporary link carrying the file name and releases the object url', () => {
    URL.createObjectURL = vi.fn(() => 'blob:x');
    URL.revokeObjectURL = vi.fn();
    const click = vi.spyOn(HTMLAnchorElement.prototype, 'click').mockImplementation(() => undefined);
    downloadBlob(new Blob(['a']), 'data.csv');
    expect(click).toHaveBeenCalledTimes(1);
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:x');
  });
});
