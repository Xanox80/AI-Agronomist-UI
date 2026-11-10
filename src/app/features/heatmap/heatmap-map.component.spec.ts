import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { HeatmapMapComponent } from './heatmap-map.component';

describe('HeatmapMapComponent', () => {
  beforeEach(() => {
    HTMLCanvasElement.prototype.getContext = vi.fn(() => ({
      clearRect: vi.fn(), drawImage: vi.fn(), getImageData: vi.fn(() => ({ data: new Uint8ClampedArray(1024) })),
      putImageData: vi.fn(), createLinearGradient: vi.fn(() => ({ addColorStop: vi.fn() })), fillRect: vi.fn(),
      beginPath: vi.fn(), closePath: vi.fn(), translate: vi.fn(), shadowColor: '', arc: vi.fn(), fill: vi.fn(), scale: vi.fn(),
    })) as never;
  });

  it('draws the heat layer from the heatmap points', async () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(HeatmapMapComponent);
    fixture.componentRef.setInput('data', { points: [{ lat: 1, lng: 2, weight: 0.5, diagnosisCode: 'x', observationId: 'o' }], fields: [] });
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('canvas.leaflet-heatmap-layer')).not.toBeNull();
    expect(fixture.nativeElement.querySelector('.heatmap-map__canvas')).not.toBeNull();
  });
});
