import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { AutoApprovePanelComponent } from './auto-approve-panel.component';
import { AutoApproveService } from './auto-approve.service';

describe('AutoApprovePanelComponent', () => {
  function render(saveFailed: boolean) {
    const service = {
      categories: ['disease', 'pest'], enabledCategories: signal(new Set(['disease'])),
      saveFailed: signal(saveFailed), load: vi.fn(), setEnabled: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), { provide: AutoApproveService, useValue: service }],
    });
    const fixture = TestBed.createComponent(AutoApprovePanelComponent);
    fixture.detectChanges();
    return { fixture, service };
  }

  it('loads the rules and renders one switch per category', () => {
    const { fixture, service } = render(false);
    expect(service.load).toHaveBeenCalled();
    expect(fixture.nativeElement.querySelectorAll('p-toggleswitch').length).toBe(2);
  });

  it('shows an alert when the last save failed', () => {
    const { fixture } = render(true);
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });
});
