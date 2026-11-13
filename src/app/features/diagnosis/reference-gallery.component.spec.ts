import { provideHttpClient } from '@angular/common/http';
import { provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { ReferenceImageDto } from '../../core/api/models';
import { ReferenceGalleryComponent } from './reference-gallery.component';

describe('ReferenceGalleryComponent', () => {
  const photo = (id: string, attribution = 'Field photo'): ReferenceImageDto =>
    ({ id, url: `/r/${id}`, caption: `cap ${id}`, attribution, diagnosisCode: 'rust' });

  function render(references: ReferenceImageDto[]) {
    TestBed.configureTestingModule({ providers: [provideTranslateService(), provideHttpClient(), provideHttpClientTesting()] });
    const fixture = TestBed.createComponent(ReferenceGalleryComponent);
    fixture.componentRef.setInput('references', references);
    fixture.detectChanges();
    return fixture;
  }

  function simulateLoad(root: HTMLElement, id: string): void {
    const img = document.createElement('img');
    root.querySelector(`[data-ref-id="${id}"]`)!.appendChild(img);
    img.dispatchEvent(new Event('load'));
  }

  it('keeps the block hidden until a reference photo has loaded', () => {
    const root = render([photo('a')]).nativeElement as HTMLElement;
    expect(root.querySelector<HTMLElement>('[data-testid=references]')!.hidden).toBe(true);
  });

  it('shows only the tiles whose image loaded', () => {
    const fixture = render([photo('a'), photo('b')]);
    const root = fixture.nativeElement as HTMLElement;
    simulateLoad(root, 'b');
    fixture.detectChanges();
    expect(root.querySelector<HTMLElement>('[data-testid=references]')!.hidden).toBe(false);
    expect(root.querySelectorAll('.refs__tile--ready')).toHaveLength(1);
    expect(root.querySelector('.refs__tile--ready')?.getAttribute('data-ref-id')).toBe('b');
  });

  it('replaces generated placeholders with a note instead of blank tiles', () => {
    const root = render([photo('a', 'Placeholder - replace with a licensed field photo')]).nativeElement as HTMLElement;
    expect(root.querySelector('figure')).toBeNull();
    expect(root.querySelector('[data-testid=references-pending]')).not.toBeNull();
  });

  it('renders nothing without references', () => {
    expect((render([]).nativeElement as HTMLElement).children).toHaveLength(0);
  });

  it('shows the caption with a small attribution line under a real photo', () => {
    const root = render([photo('a', 'Kaggle: wheat-plant-diseases (CC0)')]).nativeElement as HTMLElement;
    expect(root.querySelector('figcaption')?.textContent).toContain('cap a');
    expect(root.querySelector('[data-testid=reference-attribution]')?.textContent).toContain('Kaggle: wheat-plant-diseases (CC0)');
  });

  it('opens a tapped photo larger next to the scout photo', () => {
    const fixture = render([photo('a')]);
    fixture.componentRef.setInput('comparePhotoUrl', '/photos/p1/file');
    fixture.detectChanges();
    (fixture.nativeElement as HTMLElement).querySelector<HTMLButtonElement>('[data-testid=reference-open]')!.click();
    fixture.detectChanges();
    const dialog = document.querySelector('[data-testid=reference-dialog]');
    expect(dialog?.querySelectorAll('app-auth-image')).toHaveLength(2);
    expect(dialog?.textContent).toContain('diagnosis.yourPhoto');
  });
});

