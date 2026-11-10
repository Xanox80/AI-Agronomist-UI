import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { SafetyWarningDto } from '../../core/api/models';
import { SafetyWarningsComponent } from './safety-warnings.component';

describe('SafetyWarningsComponent', () => {
  it('renders one row per warning', () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(SafetyWarningsComponent);
    fixture.componentRef.setInput('warnings', [
      { code: 'buffer_zone', severity: 'warning', params: { meters: 50 } },
      { code: 'pollinators', severity: 'critical', params: {} },
    ] as unknown as SafetyWarningDto[]);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('li').length).toBe(2);
  });
});
