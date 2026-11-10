import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { PolygonCanvasComponent } from './polygon-canvas.component';

describe('PolygonCanvasComponent', () => {
  function setup(editable = true) {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(PolygonCanvasComponent);
    fixture.componentRef.setInput('src', 'blob:x');
    fixture.componentRef.setInput('editable', editable);
    fixture.detectChanges();
    const svg: SVGElement = fixture.nativeElement.querySelector('svg');
    svg.getBoundingClientRect = () => ({ left: 0, top: 0, width: 100, height: 100 }) as DOMRect;
    return { fixture, svg };
  }

  it('adds a normalised vertex on click', () => {
    const { fixture, svg } = setup();
    svg.dispatchEvent(new MouseEvent('click', { clientX: 25, clientY: 50 }));
    expect(fixture.componentInstance.points()).toEqual([{ x: 0.25, y: 0.5 }]);
  });

  it('ignores clicks when read-only', () => {
    const { fixture, svg } = setup(false);
    svg.dispatchEvent(new MouseEvent('click', { clientX: 25, clientY: 50 }));
    expect(fixture.componentInstance.points()).toEqual([]);
  });
});
