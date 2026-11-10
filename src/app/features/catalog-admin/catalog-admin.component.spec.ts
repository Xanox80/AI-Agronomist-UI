import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { CatalogAdminService } from './catalog-admin.service';
import { CatalogAdminComponent } from './catalog-admin.component';

describe('CatalogAdminComponent', () => {
  function render(status: object | null) {
    const service = {
      directories: ['diagnoses', 'products'],
      directory: signal('diagnoses'),
      status: signal(status),
      rows: signal([{ id: 'r1', title: 'Rust', detail: 'x', isDemo: true }]),
      pending: signal([{ id: 'pr1', entityType: 'product', operation: 'create', payload: { a: 1 } }]),
      loadStatus: vi.fn(), openDirectory: vi.fn(), loadQueue: vi.fn(), isRowStale: () => true,
      approve: vi.fn(), reject: vi.fn(), verify: vi.fn(), propose: vi.fn(),
    };
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), { provide: CatalogAdminService, useValue: service }],
    });
    const fixture = TestBed.createComponent(CatalogAdminComponent);
    fixture.detectChanges();
    return { fixture, service };
  }

  it('loads the first directory and shows rows with a stale tag', () => {
    const { fixture, service } = render({ stale: true, daysSinceVerified: 400, version: 1, containsDemoData: false });
    expect(service.openDirectory).toHaveBeenCalledWith('diagnoses');
    expect(fixture.nativeElement.textContent).toContain('Rust');
    expect(fixture.nativeElement.querySelector('p-message')).not.toBeNull();
  });

  it('lists pending proposals in the approval queue', () => {
    const { fixture } = render(null);
    expect(fixture.nativeElement.querySelectorAll('app-proposal-queue article').length).toBe(1);
  });
});
