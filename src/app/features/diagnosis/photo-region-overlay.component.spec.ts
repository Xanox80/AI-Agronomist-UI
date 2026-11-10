import { TestBed } from '@angular/core/testing';
import { PhotoRegionOverlayComponent } from './photo-region-overlay.component';

describe('PhotoRegionOverlayComponent', () => {
  function render(region?: { x: number; y: number; w: number; h: number; photoSeq: number }) {
    const fixture = TestBed.createComponent(PhotoRegionOverlayComponent);
    fixture.componentRef.setInput('photoUrl', '/p.jpg');
    fixture.componentRef.setInput('region', region);
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('draws the highlighted box at the normalised position', () => {
    const box = render({ x: 0.1, y: 0.2, w: 0.3, h: 0.4, photoSeq: 1 }).querySelector<HTMLElement>('[data-testid=region-box]');
    expect(box?.style.left).toBe('10%');
    expect(box?.style.height).toBe('40%');
  });

  it('shows only the photo when there is no region', () => {
    expect(render().querySelector('[data-testid=region-box]')).toBeNull();
  });
});
