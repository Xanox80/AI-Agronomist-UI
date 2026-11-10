import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { RecommendationApi } from '../../core/api/recommendation.api';
import { AutoApproveService } from './auto-approve.service';
import { SETTINGS_CONFIG } from './settings.config';

describe('AutoApproveService', () => {
  const save = vi.fn();
  const list = vi.fn();
  let service: AutoApproveService;

  beforeEach(() => {
    save.mockReset();
    list.mockReset();
    TestBed.configureTestingModule({
      providers: [{ provide: RecommendationApi, useValue: { saveAutoApproveSetting: save, autoApproveSettings: list } }],
    });
    service = TestBed.inject(AutoApproveService);
  });

  it('marks only enabled categories after load', async () => {
    list.mockReturnValue(of([
      { id: '1', problemCategory: 'disease', minConfidence: 0.95, enabled: true },
      { id: '2', problemCategory: 'pest', minConfidence: 0.95, enabled: false },
    ]));
    await service.load();
    expect([...service.enabledCategories()]).toEqual(['disease']);
  });

  it('saves a new rule with the configured minimum confidence', async () => {
    save.mockReturnValue(of({ id: '3', problemCategory: 'weed', minConfidence: 0.9, enabled: true }));
    await service.setEnabled('weed', true);
    expect(save).toHaveBeenCalledWith({
      problemCategory: 'weed', minConfidence: SETTINGS_CONFIG.autoApproveMinConfidence, enabled: true,
    });
    expect(service.enabledCategories().has('weed')).toBe(true);
  });

  it('keeps the existing confidence when toggling off', async () => {
    list.mockReturnValue(of([{ id: '1', problemCategory: 'disease', minConfidence: 0.97, enabled: true }]));
    await service.load();
    save.mockReturnValue(of({ id: '1', problemCategory: 'disease', minConfidence: 0.97, enabled: false }));
    await service.setEnabled('disease', false);
    expect(save.mock.calls[0][0].minConfidence).toBe(0.97);
    expect(service.enabledCategories().size).toBe(0);
  });

  it('rolls the switch back and flags the failure when the save fails', async () => {
    save.mockReturnValue(throwError(() => new Error('offline')));
    await service.setEnabled('weed', true);
    expect(service.enabledCategories().has('weed')).toBe(false);
    expect(service.saveFailed()).toBe(true);
  });
});
