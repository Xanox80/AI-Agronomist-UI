import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { Router } from '@angular/router';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { FieldImportResult } from '../../core/api/models';
import { toMapFeatures } from './contour-geometry';
import { FieldMapComponent } from './field-map.component';
import { FIELDS_CONFIG } from './fields.config';
import { FieldsService } from './fields.service';

/** Upload KML / GeoJSON / zipped Shapefile, preview what would be imported, then confirm. */
@Component({
  selector: 'app-field-import',
  imports: [TranslatePipe, ButtonModule, FieldMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .picker { display: flex; flex-wrap: wrap; gap: 0.5rem; align-items: center; margin: 1rem 0; }
    input[type='file'] { min-height: var(--ap-touch-min); color: var(--ap-text); }
    .summary { margin: 1rem 0 0.25rem; font-weight: 600; }
    .skipped { color: var(--ap-warn); }
    .error { color: var(--ap-danger); }
  `,
  template: `
    <section class="scout-page">
      <div class="scout-page-header"><h1>{{ 'fields.import.title' | translate }}</h1></div>
      <p>{{ 'fields.import.hint' | translate }}</p>
      <div class="picker">
        <input type="file" [accept]="accept" (change)="onFileChosen($event)" />
      </div>
      @if (preview(); as p) {
        <p class="summary">{{ 'fields.import.found' | translate: { count: p.imported.length } }}</p>
        @for (s of p.skipped; track s.index) {
          <p class="skipped">{{ 'fields.import.skipped' | translate: { index: s.index + 1 } }}: {{ s.reason }}</p>
        }
        <app-field-map [features]="previewFeatures()" />
      }
      @if (failed()) { <p class="error">{{ 'fields.import.failed' | translate }}</p> }
      <div class="picker">
        <p-button icon="pi pi-check" [label]="'fields.import.confirm' | translate"
          [disabled]="!canConfirm()" (onClick)="confirm()" />
        <p-button severity="secondary" [label]="'common.cancel' | translate" (onClick)="cancel()" />
      </div>
    </section>
  `,
})
export class FieldImportComponent {
  private readonly service = inject(FieldsService);
  private readonly router = inject(Router);

  protected readonly accept = FIELDS_CONFIG.importAccept;
  protected readonly preview = signal<FieldImportResult | null>(null);
  protected readonly failed = signal(false);
  protected readonly busy = signal(false);
  private readonly file = signal<File | null>(null);

  protected readonly previewFeatures = computed(() => toMapFeatures(this.preview()?.imported ?? []));
  protected readonly canConfirm = computed(() => (this.preview()?.imported.length ?? 0) > 0 && !this.busy());

  protected async onFileChosen(event: Event): Promise<void> {
    const file = (event.target as HTMLInputElement).files?.[0] ?? null;
    this.file.set(file);
    this.preview.set(null);
    if (file) await this.run(file, true);
  }

  protected async confirm(): Promise<void> {
    const file = this.file();
    if (!file) return;
    if (await this.run(file, false)) await this.router.navigate(['/fields']);
  }

  protected cancel(): void {
    void this.router.navigate(['/fields']);
  }

  private async run(file: File, dryRun: boolean): Promise<boolean> {
    this.busy.set(true);
    this.failed.set(false);
    try {
      const result = await this.service.importFile(file, dryRun);
      if (dryRun) this.preview.set(result);
      return true;
    } catch {
      this.failed.set(true);
      return false;
    } finally {
      this.busy.set(false);
    }
  }
}
