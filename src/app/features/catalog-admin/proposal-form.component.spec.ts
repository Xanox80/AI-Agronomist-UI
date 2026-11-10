import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { CatalogAdminService } from './catalog-admin.service';
import { ProposalFormComponent } from './proposal-form.component';

describe('ProposalFormComponent', () => {
  const service = { directory: () => 'products', propose: vi.fn() };

  function render() {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), { provide: CatalogAdminService, useValue: service }],
    });
    const fixture = TestBed.createComponent(ProposalFormComponent);
    fixture.detectChanges();
    return fixture;
  }

  const submit = (fixture: ReturnType<typeof render>) =>
    (fixture.nativeElement.querySelector('p-button button') as HTMLButtonElement).click();

  it('shows a payload error when the service rejects the data', async () => {
    service.propose.mockResolvedValue(false);
    const fixture = render();
    submit(fixture);
    await fixture.whenStable();
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error')).not.toBeNull();
  });

  it('closes after a successful submit as a create proposal', async () => {
    service.propose.mockResolvedValue(true);
    const fixture = render();
    const closed = vi.fn();
    fixture.componentInstance.closed.subscribe(closed);
    submit(fixture);
    await fixture.whenStable();
    expect(service.propose).toHaveBeenCalledWith(expect.objectContaining({ operation: 'create', directory: 'products' }));
    expect(closed).toHaveBeenCalled();
  });
});
