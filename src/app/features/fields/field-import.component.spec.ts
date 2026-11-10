import { TestBed } from '@angular/core/testing';
import { Router, provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { FieldImportComponent } from './field-import.component';
import { FieldsService } from './fields.service';

describe('FieldImportComponent', () => {
  const service = { importFile: vi.fn() };
  const file = new File(['{}'], 'fields.geojson');

  function render() {
    TestBed.configureTestingModule({
      providers: [provideRouter([]), provideTranslateService(), { provide: FieldsService, useValue: service }],
    });
    const fixture = TestBed.createComponent(FieldImportComponent);
    fixture.detectChanges();
    return fixture;
  }

  beforeEach(() => vi.resetAllMocks());

  it('runs a dry run on file selection and the real import on confirm', async () => {
    service.importFile.mockResolvedValue({ imported: [{ id: '1', name: 'A' }], skipped: [] });
    const fixture = render();
    const navigate = vi.spyOn(TestBed.inject(Router), 'navigate').mockResolvedValue(true);
    const component = fixture.componentInstance as unknown as {
      onFileChosen(e: Event): Promise<void>;
      confirm(): Promise<void>;
    };
    await component.onFileChosen({ target: { files: [file] } } as unknown as Event);
    expect(service.importFile).toHaveBeenCalledWith(file, true);
    await component.confirm();
    expect(service.importFile).toHaveBeenLastCalledWith(file, false);
    expect(navigate).toHaveBeenCalledWith(['/fields']);
  });

  it('stays on the page and reports a failure when the file is rejected', async () => {
    service.importFile.mockRejectedValue(new Error('bad file'));
    const fixture = render();
    const component = fixture.componentInstance as unknown as { onFileChosen(e: Event): Promise<void> };
    await component.onFileChosen({ target: { files: [file] } } as unknown as Event);
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelector('.error')).not.toBeNull();
  });
});
