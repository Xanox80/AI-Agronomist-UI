import { buildLabelRequest, LabelDraft } from './label-request';

const draft = (over: Partial<LabelDraft>): LabelDraft => ({ action: 'confirm', newClass: {}, comment: '', ...over });

describe('buildLabelRequest', () => {
  it('confirms the model top diagnosis', () => {
    expect(buildLabelRequest(draft({}), 'd1')).toEqual({
      request: expect.objectContaining({ action: 'confirm', diagnosisId: 'd1' }),
    });
  });

  it('refuses to confirm when the model proposed no catalogue diagnosis', () => {
    expect(buildLabelRequest(draft({}))).toEqual({ errorKey: 'expert.label.errors.noModelDiagnosis' });
  });

  it('requires a diagnosis when changing', () => {
    expect(buildLabelRequest(draft({ action: 'change' }), 'd1')).toEqual({
      errorKey: 'expert.label.errors.diagnosisRequired',
    });
    expect(buildLabelRequest(draft({ action: 'change', diagnosisId: 'd2' }))).toEqual({
      request: expect.objectContaining({ diagnosisId: 'd2' }),
    });
  });

  it('requires code, names and category for a new class', () => {
    expect(buildLabelRequest(draft({ action: 'add_new_class', newClass: { code: 'x' } }))).toEqual({
      errorKey: 'expert.label.errors.newClassIncomplete',
    });
    const full = { code: ' x ', nameUk: 'uk', nameEn: 'en', problemCategory: 'pest' as const };
    expect(buildLabelRequest(draft({ action: 'add_new_class', newClass: full }))).toEqual({
      request: expect.objectContaining({ newClass: { ...full, code: 'x', cropIds: [] } }),
    });
  });

  it('drops an empty comment and keeps the region', () => {
    const region = { type: 'polygon' as const, photoSeq: 1, points: [] };
    const result = buildLabelRequest(draft({ action: 'reject', comment: '  ', region }));
    expect(result).toEqual({ request: { action: 'reject', affectedRegion: region, comment: undefined } });
  });
});
