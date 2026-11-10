import { provideHttpClient } from '@angular/common/http';
import { HttpTestingController, provideHttpClientTesting } from '@angular/common/http/testing';
import { TestBed } from '@angular/core/testing';
import { AuthImageComponent } from './auth-image.component';

describe('AuthImageComponent', () => {
  it('fetches the protected image through HttpClient and renders an object URL', async () => {
    TestBed.configureTestingModule({ providers: [provideHttpClient(), provideHttpClientTesting()] });
    URL.createObjectURL = () => 'blob:test';
    URL.revokeObjectURL = () => undefined;
    const fixture = TestBed.createComponent(AuthImageComponent);
    fixture.componentRef.setInput('src', '/api/v1/photos/1/file');
    fixture.detectChanges();
    TestBed.inject(HttpTestingController).expectOne('/api/v1/photos/1/file').flush(new Blob(['x']));
    await fixture.whenStable();
    fixture.detectChanges();
    expect((fixture.nativeElement as HTMLElement).querySelector('img')?.getAttribute('src')).toBe('blob:test');
  });
});
