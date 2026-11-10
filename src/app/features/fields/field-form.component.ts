import { ChangeDetectionStrategy, ChangeDetectorRef, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import type { Polygon } from 'geojson';
import { ButtonModule } from 'primeng/button';
import { CheckboxModule } from 'primeng/checkbox';
import { DatePickerModule } from 'primeng/datepicker';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { CropDto, FieldContour, FieldSource } from '../../core/api/models';
import { cropName } from './crop-name';
import { MapFeature } from './contour-geometry';
import { EMPTY_FIELD_FORM, FieldFormModel, formFromField, inputFromForm } from './field-form.model';
import { FieldMapComponent } from './field-map.component';
import { FIELDS_CONFIG } from './fields.config';
import { FieldsService } from './fields.service';

/** Create (no id) or edit (id) form; area is typed by hand unless a contour provides it. */
@Component({
  selector: 'app-field-form',
  imports: [
    FormsModule, TranslatePipe, ButtonModule, CheckboxModule, DatePickerModule, InputTextModule, SelectModule,
    FieldMapComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    form { display: grid; gap: 1rem; }
    label.field { display: grid; gap: 0.25rem; color: var(--ap-text-sec); }
    input { min-height: var(--ap-touch-min); width: 100%; }
    .check { display: flex; align-items: center; gap: 0.5rem; min-height: var(--ap-touch-min); }
    .actions { display: flex; gap: 0.5rem; }
    .hint { color: var(--ap-text-sec); font-size: 0.875rem; }
    .error { color: var(--ap-danger); }
  `,
  template: `
    <section class="scout-page">
      <div class="scout-page-header">
        <h1>{{ (id ? 'fields.form.editTitle' : 'fields.form.createTitle') | translate }}</h1>
      </div>
      <form (ngSubmit)="save()" [style.max-width.rem]="formMaxWidthRem">
        <label class="field">{{ 'fields.form.name' | translate }}
          <input pInputText name="name" required [(ngModel)]="model.name" />
        </label>
        <label class="field">{{ 'fields.form.crop' | translate }}
          <p-select name="crop" [options]="cropOptions()" optionLabel="label" optionValue="id"
            [showClear]="true" [(ngModel)]="model.cropId" appendTo="body" />
        </label>
        <label class="field">{{ 'fields.form.variety' | translate }}
          <input pInputText name="variety" [(ngModel)]="model.variety" />
        </label>
        <label class="field">{{ 'fields.form.sowingDate' | translate }}
          <p-datepicker name="sowingDate" dateFormat="dd.mm.yy" [showIcon]="true" appendTo="body"
            [(ngModel)]="model.sowingDate" />
        </label>
        <label class="check"><p-checkbox name="nearWater" [binary]="true" [(ngModel)]="model.nearWater" />
          {{ 'fields.form.nearWater' | translate }}</label>
        <label class="check"><p-checkbox name="nearApiary" [binary]="true" [(ngModel)]="model.nearApiary" />
          {{ 'fields.form.nearApiary' | translate }}</label>
        <label class="check"><p-checkbox name="nearSettlement" [binary]="true" [(ngModel)]="model.nearSettlement" />
          {{ 'fields.form.nearSettlement' | translate }}</label>
        <div>
          <p-button type="button" severity="secondary" icon="pi pi-pencil"
            [label]="'fields.form.drawContour' | translate" (onClick)="drawing.set(!drawing())" />
          <app-field-map [features]="mapFeatures()" [drawing]="drawing()" (contourDrawn)="onContourDrawn($event)" />
        </div>
        <label class="field">{{ 'fields.form.area' | translate }} ({{ 'fields.unit.ha' | translate }})
          <input pInputText type="number" name="areaHa" step="any" [min]="minAreaHa" [disabled]="!!contour()"
            [(ngModel)]="model.areaHa" />
          @if (contour()) { <span class="hint">{{ 'fields.form.areaFromContour' | translate }}</span> }
        </label>
        @if (failed()) { <p class="error">{{ 'fields.form.saveFailed' | translate }}</p> }
        <div class="actions">
          <p-button type="submit" icon="pi pi-check" [label]="'common.save' | translate"
            [disabled]="!model.name.trim() || saving()" />
          <p-button type="button" severity="secondary" [label]="'common.cancel' | translate" (onClick)="cancel()" />
        </div>
      </form>
    </section>
  `,
})
export class FieldFormComponent {
  protected readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') ?? undefined;

  private readonly service = inject(FieldsService);
  private readonly router = inject(Router);
  private readonly changeDetector = inject(ChangeDetectorRef);
  private readonly translate = inject(TranslateService);

  protected readonly formMaxWidthRem = FIELDS_CONFIG.formMaxWidthRem;
  protected readonly minAreaHa = FIELDS_CONFIG.minAreaHa;
  protected model: FieldFormModel = { ...EMPTY_FIELD_FORM };
  protected readonly crops = signal<CropDto[]>([]);
  protected readonly contour = signal<FieldContour | undefined>(undefined);
  protected readonly drawing = signal(false);
  protected readonly saving = signal(false);
  protected readonly failed = signal(false);
  private readonly source = signal<FieldSource>('manual');

  protected readonly mapFeatures = computed<MapFeature[]>(() => {
    const contour = this.contour();
    return contour ? [{ id: '', name: this.model.name, contour }] : [];
  });
  protected readonly cropOptions = computed(() =>
    this.crops().map((c) => ({ id: c.id, label: cropName(this.crops(), c.id, this.translate.currentLang) })),
  );

  constructor() {
    queueMicrotask(() => void this.init());
  }

  protected onContourDrawn(drawn: { contour: Polygon; areaHa: number }): void {
    this.contour.set(drawn.contour);
    this.model.areaHa = Number(drawn.areaHa.toFixed(FIELDS_CONFIG.areaDecimals));
    this.source.set('drawn');
    this.drawing.set(false);
  }

  protected async save(): Promise<void> {
    this.saving.set(true);
    this.failed.set(false);
    try {
      const saved = await this.service.save(this.id, inputFromForm(this.model, this.contour(), this.source()));
      await this.router.navigate(['/fields', saved.id]);
    } catch {
      this.failed.set(true);
    } finally {
      this.saving.set(false);
    }
  }

  protected cancel(): void {
    void this.router.navigate(this.id ? ['/fields', this.id] : ['/fields']);
  }

  private async init(): Promise<void> {
    try {
      this.crops.set(await this.service.crops());
      const id = this.id;
      if (!id) return;
      const field = await this.service.get(id);
      this.model = formFromField(field);
      if (!field.cropId) this.model.cropId = (await this.service.rememberedCrop(id).catch(() => undefined)) ?? null;
      this.changeDetector.markForCheck();
      this.contour.set(field.contour);
      this.source.set(field.source);
    } catch {
      this.failed.set(true);
    }
  }
}
