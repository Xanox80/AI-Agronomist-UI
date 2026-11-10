import { TestBed } from '@angular/core/testing';
import { QualityGateResult } from '../../core/quality-gate/quality-gate.model';
import { QualityGateService } from '../../core/quality-gate/quality-gate.service';
import { PhotoCaptureService } from './photo-capture.service';

const goodResult: QualityGateResult = {
  ok: true,
  checks: [
    { name: 'sharpness', value: 500, passed: true }, { name: 'exposure', value: 0.5, passed: true },
    { name: 'plantCoverage', value: 0.8, passed: true }, { name: 'objectSize', value: 0.5, passed: true },
  ],
};

describe('PhotoCaptureService', () => {
  const check = vi.fn();
  let service: PhotoCaptureService;

  beforeEach(() => {
    URL.createObjectURL = vi.fn(() => 'blob:preview');
    URL.revokeObjectURL = vi.fn();
    TestBed.configureTestingModule({ providers: [{ provide: QualityGateService, useValue: { check } }] });
    service = TestBed.inject(PhotoCaptureService);
  });

  it('keeps the gate report and no issues for a good photo', async () => {
    check.mockResolvedValue(goodResult);
    const photo = await service.capture(new Blob(['x']));
    expect(photo.report).toEqual({ sharpness: 500, exposure: 0.5, plantCoverage: 0.8, objectSize: 0.5, passed: true });
    expect(photo.issues).toEqual([]);
    expect(photo.previewUrl).toBe('blob:preview');
  });

  it('lists what is wrong with a blurry photo', async () => {
    check.mockResolvedValue({
      ok: false,
      checks: [{ name: 'exposure', value: 0.5, passed: false, hintKey: 'qualityGate.hint.clippedShadows' }],
    });
    expect((await service.capture(new Blob(['x']))).issues).toEqual(['qualityGate.hint.clippedShadows']);
  });

  it('marks the photo unassessed when the gate throws', async () => {
    check.mockRejectedValue(new Error('not implemented'));
    const photo = await service.capture(new Blob(['x']));
    expect(photo.issues).toEqual(['scouting.quality.unassessed']);
    expect(photo.report.passed).toBe(false);
  });

  it('revokes the preview url on release', async () => {
    check.mockResolvedValue(goodResult);
    service.release(await service.capture(new Blob(['x'])));
    expect(URL.revokeObjectURL).toHaveBeenCalledWith('blob:preview');
  });
});
