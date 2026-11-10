import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { FieldMapComponent } from './field-map.component';

describe('FieldMapComponent', () => {
  it('shows the drawing tools only in drawing mode', async () => {
    TestBed.configureTestingModule({ providers: [provideTranslateService()] });
    const fixture = TestBed.createComponent(FieldMapComponent);
    fixture.componentRef.setInput('drawing', false);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.field-map__tools')).toBeNull();
    fixture.componentRef.setInput('drawing', true);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.field-map__tools')).not.toBeNull();
  });
});
