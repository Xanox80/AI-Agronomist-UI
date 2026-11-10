import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideTranslateService } from '@ngx-translate/core';
import { CatalogAdminService } from './catalog-admin.service';
import { ProposalQueueComponent } from './proposal-queue.component';

describe('ProposalQueueComponent', () => {
  const service = {
    pending: signal([{ id: 'pr1', entityType: 'product', operation: 'create', payload: {} }]),
    loadQueue: vi.fn(), approve: vi.fn(), reject: vi.fn(),
  };

  function render() {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), { provide: CatalogAdminService, useValue: service }],
    });
    const fixture = TestBed.createComponent(ProposalQueueComponent);
    fixture.detectChanges();
    return fixture;
  }

  const click = (fixture: ReturnType<typeof render>, icon: string) =>
    (fixture.nativeElement.querySelector(`p-button .${icon}`) as HTMLElement).closest('button')!.click();

  beforeEach(() => {
    service.approve.mockReset();
    service.reject.mockReset();
  });

  it('refuses to reject without a comment and shows why', () => {
    const fixture = render();
    click(fixture, 'pi-times');
    fixture.detectChanges();
    expect(service.reject).not.toHaveBeenCalled();
    expect(fixture.nativeElement.querySelector('[role="alert"]')).not.toBeNull();
  });

  it('rejects with the trimmed comment', () => {
    const fixture = render();
    const input = fixture.nativeElement.querySelector('input') as HTMLInputElement;
    input.value = '  wrong dose ';
    click(fixture, 'pi-times');
    expect(service.reject).toHaveBeenCalledWith('pr1', 'wrong dose');
  });

  it('approves without a comment when the field is empty', () => {
    const fixture = render();
    click(fixture, 'pi-check');
    expect(service.approve).toHaveBeenCalledWith('pr1', undefined);
  });
});
