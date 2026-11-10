import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { SelectModule } from 'primeng/select';
import { GeolocationService } from '../scouting/geolocation.service';
import { AuthSession } from '../../core/auth/auth-session.service';
import { CropDto, FieldDto } from '../../core/api/models';
import { cropName } from './crop-name';
import { toMapFeatures } from './contour-geometry';
import { FieldMapComponent } from './field-map.component';
import { FIELDS_CONFIG } from './fields.config';
import { FieldsService } from './fields.service';

@Component({
  selector: 'app-field-list',
  imports: [FormsModule, RouterLink, TranslatePipe, ButtonModule, InputTextModule, SelectModule, FieldMapComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .toolbar { display: flex; flex-wrap: wrap; gap: 0.5rem; margin-bottom: 1rem; }
    .toolbar input { min-height: var(--ap-touch-min); }
    .field-card {
      display: block; padding: 1rem; min-height: var(--ap-touch-min); margin-top: 0.75rem;
      background: var(--ap-surface); border: 1px solid var(--ap-border); border-radius: var(--ap-radius);
      color: var(--ap-text); text-decoration: none;
    }
    .field-card strong { display: block; font-size: 1.05rem; }
    .field-card span { color: var(--ap-text-sec); font-size: 0.875rem; }
    .state { color: var(--ap-text-sec); margin-top: 1rem; }
    .state.error { color: var(--ap-danger); }
  `,
  template: `
    <section class="scout-page">
      <div class="scout-page-header">
        <h1>{{ 'fields.title' | translate }}</h1>
      </div>
      <div class="toolbar">
        <input pInputText type="search" [style.flex]="'1 1 ' + searchFlexBasisRem + 'rem'" [ngModel]="query()" (ngModelChange)="query.set($event)"
          (keyup.enter)="load()" [placeholder]="'fields.list.searchPlaceholder' | translate" />
        <p-select [options]="cropOptions()" optionLabel="label" optionValue="id" [showClear]="true" appendTo="body"
          [placeholder]="'fields.list.cropFilter' | translate" [ngModel]="cropId()" (ngModelChange)="filterByCrop($event)" />
        <p-button icon="pi pi-search" severity="secondary" [ariaLabel]="'fields.list.search' | translate" (onClick)="load()" />
        <p-button icon="pi pi-map-marker" severity="secondary" [label]="'fields.list.locate' | translate"
          (onClick)="locate()" />
        @if (canEdit()) {
          <p-button icon="pi pi-plus" [label]="'fields.list.add' | translate" (onClick)="create()" />
        }
        @if (canImport()) {
          <p-button icon="pi pi-upload" severity="secondary" [label]="'fields.list.import' | translate"
            (onClick)="openImport()" />
        }
      </div>
      @if (locateState() === 'none') {
        <p class="state">{{ 'fields.list.locateNone' | translate }}</p>
      }
      @for (match of matches(); track match.fieldId) {
        <a class="field-card" [routerLink]="['/fields', match.fieldId]">
          <strong>{{ match.name }}</strong>
        </a>
      }
      <app-field-map [features]="mapFeatures()" (featureSelected)="open($event)" />
      @if (loading()) {
        <p class="state">{{ 'common.loading' | translate }}</p>
      } @else if (failed()) {
        <p class="state error">{{ 'common.error' | translate }}
          <p-button severity="secondary" [label]="'common.retry' | translate" (onClick)="load()" />
        </p>
      } @else if (fields().length === 0) {
        <p class="state">{{ 'fields.list.empty' | translate }}</p>
      }
      @for (field of fields(); track field.id) {
        <a class="field-card" [routerLink]="['/fields', field.id]">
          <strong>{{ field.name }}</strong>
          <span>{{ field.areaHa.toFixed(areaDecimals) }} {{ 'fields.unit.ha' | translate }}
            @if (field.cropId) { · {{ cropLabel(field) }} }
          </span>
        </a>
      }
      @if (hasMore()) {
        <p-button severity="secondary" [label]="'fields.list.loadMore' | translate" (onClick)="loadMore()" />
      }
    </section>
  `,
})
export class FieldListComponent {
  private readonly service = inject(FieldsService);
  private readonly router = inject(Router);
  private readonly session = inject(AuthSession);
  protected readonly translate = inject(TranslateService);

  protected readonly areaDecimals = FIELDS_CONFIG.areaDecimals;
  private readonly geolocation = inject(GeolocationService);
  protected readonly searchFlexBasisRem = FIELDS_CONFIG.searchFlexBasisRem;
  protected readonly query = signal('');
  protected readonly cropId = signal<string | null>(null);
  protected readonly total = signal(0);
  private page = 1;
  protected readonly matches = signal<{ fieldId: string; name: string }[]>([]);
  protected readonly locateState = signal<'idle' | 'none'>('idle');
  protected readonly fields = signal<FieldDto[]>([]);
  protected readonly crops = signal<CropDto[]>([]);
  protected readonly loading = signal(false);
  protected readonly failed = signal(false);
  protected readonly hasMore = computed(() => this.fields().length < this.total());
  protected readonly cropOptions = computed(() =>
    this.crops().map((c) => ({ id: c.id, label: cropName(this.crops(), c.id, this.translate.currentLang) })),
  );
  protected readonly mapFeatures = computed(() => toMapFeatures(this.fields()));
  protected readonly canEdit = computed(() => this.session.hasAnyRole(['scout', 'chief_agronomist']));
  protected readonly canImport = computed(() => this.session.hasAnyRole(['chief_agronomist']));

  constructor() {
    void this.load();
  }

  protected async load(): Promise<void> {
    this.page = 1;
    await this.fetch(false);
  }

  protected async loadMore(): Promise<void> {
    this.page += 1;
    await this.fetch(true);
  }

  protected filterByCrop(cropId: string | null): void {
    this.cropId.set(cropId);
    void this.load();
  }

  /** Picks the field under the device position; falls back to the list when nothing matches. */
  protected async locate(): Promise<void> {
    this.locateState.set('idle');
    const fix = await this.geolocation.locate();
    const found = fix ? await this.service.locate(fix).catch(() => []) : [];
    this.matches.set(found.length > 1 ? found : []);
    if (found.length === 1) this.open(found[0].fieldId);
    else if (found.length === 0) this.locateState.set('none');
  }

  private async fetch(append: boolean): Promise<void> {
    this.loading.set(true);
    this.failed.set(false);
    try {
      const [page, crops] = await Promise.all([
        this.service.list(this.query().trim(), this.cropId() ?? undefined, this.page), this.service.crops(),
      ]);
      this.fields.update((current) => (append ? [...current, ...page.items] : page.items));
      this.total.set(page.total);
      this.crops.set(crops);
    } catch {
      this.failed.set(true);
    } finally {
      this.loading.set(false);
    }
  }

  protected cropLabel(field: FieldDto): string {
    return cropName(this.crops(), field.cropId, this.translate.currentLang);
  }

  protected open(id: string): void {
    void this.router.navigate(['/fields', id]);
  }

  protected create(): void {
    void this.router.navigate(['/fields', 'new']);
  }

  protected openImport(): void {
    void this.router.navigate(['/fields', 'import']);
  }
}
