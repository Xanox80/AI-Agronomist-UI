import { HttpErrorResponse } from '@angular/common/http';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { CatalogApi, ObservationsApi, RecognitionApi } from '../../core/api';
import { ConnectivityService } from '../../core/offline/connectivity.service';
import { DiagnosisService } from './diagnosis.service';

describe('DiagnosisService', () => {
  const result = { id: 'r1' };
  let online: boolean;
  let observation: Record<string, unknown>;
  let catalog: { diagnoses: ReturnType<typeof vi.fn>; crops: ReturnType<typeof vi.fn> };
  let recognition: { getDiagnosis: ReturnType<typeof vi.fn>; diagnose: ReturnType<typeof vi.fn>; answerQuestions: ReturnType<typeof vi.fn> };
  let observations: { get: ReturnType<typeof vi.fn>; confirm: ReturnType<typeof vi.fn> };

  function service(): DiagnosisService {
    TestBed.configureTestingModule({
      providers: [
        { provide: ConnectivityService, useValue: { online: () => online } },
        { provide: ObservationsApi, useValue: observations },
        { provide: RecognitionApi, useValue: recognition },
        { provide: CatalogApi, useValue: catalog },
      ],
    });
    return TestBed.inject(DiagnosisService);
  }

  beforeEach(() => {
    online = true;
    observation = { id: 'o1', status: 'synced' };
    catalog = { diagnoses: vi.fn(() => of([])), crops: vi.fn(() => of([])) };
    observations = { get: vi.fn(() => of(observation)), confirm: vi.fn(() => of(observation)) };
    recognition = {
      getDiagnosis: vi.fn(() => of(result)),
      diagnose: vi.fn(() => of(result)),
      answerQuestions: vi.fn(() => of(result)),
    };
  });

  it('returns no diagnosis for an observation still awaiting the server', async () => {
    observation = { id: 'o1', status: 'pending_sync' };
    vi.useFakeTimers();
    const pending = service().load('o1');
    await vi.runAllTimersAsync();
    const snapshot = await pending;
    vi.useRealTimers();
    expect(snapshot.diagnosis).toBeUndefined();
    expect(recognition.getDiagnosis).not.toHaveBeenCalled();
  });

  it('retries while the server has no observation yet', async () => {
    observations.get
      .mockReturnValueOnce(throwError(() => new HttpErrorResponse({ status: 404 })))
      .mockReturnValue(of(observation));
    vi.useFakeTimers();
    const loading = service().load('o1');
    await vi.runAllTimersAsync();
    const snapshot = await loading;
    vi.useRealTimers();
    expect(snapshot.diagnosis).toBe(result);
  });

  it('uses the diagnosis embedded in the observation', async () => {
    observation = { id: 'o1', status: 'diagnosed', diagnosis: result };
    expect((await service().load('o1')).diagnosis).toBe(result);
    expect(recognition.getDiagnosis).not.toHaveBeenCalled();
  });

  it('runs diagnosis when none exists yet', async () => {
    recognition.getDiagnosis.mockReturnValue(throwError(() => new Error('404')));
    expect((await service().load('o1')).diagnosis).toBe(result);
    expect(recognition.diagnose).toHaveBeenCalledWith('o1');
  });

  it('reports a pending snapshot when the observation cannot be read offline', async () => {
    online = false;
    observations.get.mockReturnValue(throwError(() => new Error('offline')));
    expect(await service().load('o1')).toEqual({});
  });

  it('rethrows an observation read failure while online', async () => {
    observations.get.mockReturnValue(throwError(() => new Error('500')));
    await expect(service().load('o1')).rejects.toThrow('500');
  });

  it('posts all answers for re-ranking', async () => {
    await service().answer('r1', { q1: 'yes' });
    expect(recognition.answerQuestions).toHaveBeenCalledWith('r1', { answers: { q1: 'yes' } });
  });

  it('confirms with the correction flag', async () => {
    await service().confirm('o1', 'd1', true);
    expect(observations.confirm).toHaveBeenCalledWith('o1', { diagnosisId: 'd1', correctedFromModel: true });
  });

  it('falls back to empty reference data when the catalogue fails', async () => {
    catalog.diagnoses.mockReturnValue(throwError(() => new Error('x')));
    catalog.crops.mockReturnValue(of([{ id: 'c' }]));
    expect(await service().referenceData('c')).toEqual({ catalogue: [], crops: [{ id: 'c' }] });
  });
});
