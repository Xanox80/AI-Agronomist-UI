import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { WeatherWindowComponent } from './weather-window.component';

function render(weather: unknown): HTMLElement {
  TestBed.configureTestingModule({ providers: [provideTranslateService()] });
  const fixture = TestBed.createComponent(WeatherWindowComponent);
  fixture.componentRef.setInput('weather', weather);
  fixture.detectChanges();
  return fixture.nativeElement as HTMLElement;
}

describe('WeatherWindowComponent', () => {
  it('renders nothing and does not throw when weather is null', () => {
    expect(render(null).querySelector('.timeline')).toBeNull();
  });

  it('renders one cell per forecast hour', () => {
    const el = render({
      verdict: 'go', reason: 'r', reasonParams: {},
      forecastSummary: [
        { time: '2026-05-01T08:00:00Z', verdict: 'go', causes: [] },
        { time: '2026-05-01T09:00:00Z', verdict: 'no_go', causes: ['c'] },
      ],
    });
    expect(el.querySelectorAll('.hour').length).toBe(2);
    expect(el.querySelector('.hour.no_go')).not.toBeNull();
  });
});
