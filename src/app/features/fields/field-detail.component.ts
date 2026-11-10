import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { ConfirmationService } from 'primeng/api';
import { ConfirmDialogModule } from 'primeng/confirmdialog';
import { TagModule } from 'primeng/tag';
import { AuthSession } from '../../core/auth/auth-session.service';
import { CropDto, FieldDto, ObservationDto } from '../../core/api/models';
import { cropName } from './crop-name';
import { toMapFeatures } from './contour-geometry';
import { FieldMapComponent } from './field-map.component';
import { FIELDS_CONFIG } from './fields.config';
import { FieldsService } from './fields.service';

@Component({
  selector: 'app-field-detail',
  imports: [DatePipe, RouterLink, TranslatePipe, ButtonModule, TagModule, ConfirmDialogModule, FieldMapComponent],
  providers: [ConfirmationService],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .actions, .flags { display: flex; flex-wrap: wrap; gap: 0.5rem; margin: 0.75rem 0; }
    dl { display: grid; grid-template-columns: max-content 1fr; gap: 0.25rem 1rem; margin: 1rem 0; }
    dt { color: var(--ap-text-sec); }
    dd { margin: 0; }
    h2 { font-size: 1.1rem; margin-top: 1.5rem; }
    .history-item {
      display: flex; justify-content: space-between; align-items: center; gap: 0.5rem; flex-wrap: wrap;
      min-height: var(--ap-touch-min); padding: 0.75rem 1rem; margin-top: 0.5rem;
      background: var(--ap-surface); border: 1px solid var(--ap-border); border-radius: var(--ap-radius);
      color: var(--ap-text); text-decoration: none;
    }
    .state { color: var(--ap-text-sec); }
    .state.error { color: var(--ap-danger); }
  `,
  template: `
    <section class="scout-page">
      <p-confirmdialog />
      @if (field(); as f) {
        <div class="scout-page-header">
          <h1>{{ f.name }}</h1>
          <p-button severity="secondary" icon="pi pi-arrow-left" [label]="'common.back' | translate" (onClick)="back()" />
        </div>
        <div class="actions">
          @if (canEdit()) {
            <p-button icon="pi pi-pencil" [label]="'fields.detail.edit' | translate" (onClick)="edit()" />
          }
          @if (canDelete()) {
            <p-button severity="danger" icon="pi pi-trash" [label]="'common.delete' | translate" (onClick)="confirmRemove()" />
          }
        </div>
        <app-field-map [features]="mapFeatures()" />
        <dl>
          <dt>{{ 'fields.form.area' | translate }}</dt>
          <dd>{{ f.areaHa.toFixed(areaDecimals) }} {{ 'fields.unit.ha' | translate }}</dd>
          <dt>{{ 'fields.form.crop' | translate }}</dt>
          <dd>{{ cropLabel() || '—' }}</dd>
          <dt>{{ 'fields.form.variety' | translate }}</dt>
          <dd>{{ f.variety || '—' }}</dd>
          <dt>{{ 'fields.form.sowingDate' | translate }}</dt>
          <dd>{{ f.sowingDate ? (f.sowingDate | date: 'dd.MM.yyyy') : '—' }}</dd>
          <dt>{{ 'fields.detail.source' | translate }}</dt>
          <dd>{{ 'fields.source.' + f.source | translate }}</dd>
        </dl>
        <div class="flags">
          @if (f.nearWater) { <p-tag severity="warn" [value]="'fields.form.nearWater' | translate" /> }
          @if (f.nearApiary) { <p-tag severity="warn" [value]="'fields.form.nearApiary' | translate" /> }
          @if (f.nearSettlement) { <p-tag severity="warn" [value]="'fields.form.nearSettlement' | translate" /> }
        </div>
        <h2>{{ 'fields.history.title' | translate }}</h2>
        @for (o of history(); track o.id) {
          <a class="history-item" [routerLink]="['/diagnosis', o.id]">
            <span>{{ o.capturedAt | date: 'dd.MM.yyyy HH:mm' }}</span>
            <p-tag severity="secondary" [value]="'fields.history.status.' + o.status | translate" />
          </a>
        } @empty {
          <p class="state">{{ 'fields.history.empty' | translate }}</p>
        }
      } @else if (failed()) {
        <p class="state error">{{ 'common.error' | translate }}
          <p-button severity="secondary" [label]="'common.retry' | translate" (onClick)="load()" />
        </p>
      } @else {
        <p class="state">{{ 'common.loading' | translate }}</p>
      }
    </section>
  `,
})
export class FieldDetailComponent {
  private readonly id = inject(ActivatedRoute).snapshot.paramMap.get('id') as string;

  private readonly service = inject(FieldsService);
  private readonly router = inject(Router);
  private readonly session = inject(AuthSession);
  private readonly translate = inject(TranslateService);
  private readonly confirmation = inject(ConfirmationService);

  protected readonly areaDecimals = FIELDS_CONFIG.areaDecimals;
  protected readonly field = signal<FieldDto | null>(null);
  protected readonly history = signal<ObservationDto[]>([]);
  protected readonly crops = signal<CropDto[]>([]);
  protected readonly failed = signal(false);
  protected readonly mapFeatures = computed(() => toMapFeatures(this.field() ? [this.field() as FieldDto] : []));
  protected readonly canEdit = computed(() => this.session.hasAnyRole(['scout', 'chief_agronomist']));
  protected readonly canDelete = computed(() => this.session.hasAnyRole(['chief_agronomist']));

  constructor() {
    queueMicrotask(() => void this.load());
  }

  protected cropLabel(): string {
    return cropName(this.crops(), this.field()?.cropId, this.translate.currentLang);
  }

  protected async load(): Promise<void> {
    this.failed.set(false);
    try {
      const [field, history, crops] = await Promise.all([
        this.service.get(this.id), this.service.history(this.id), this.service.crops(),
      ]);
      this.field.set(field);
      this.history.set(history);
      this.crops.set(crops);
    } catch {
      this.failed.set(true);
    }
  }

  protected confirmRemove(): void {
    this.confirmation.confirm({
      message: this.translate.instant('fields.detail.deleteConfirm'),
      acceptLabel: this.translate.instant('common.delete'),
      rejectLabel: this.translate.instant('common.cancel'),
      accept: () => void this.remove(),
    });
  }

  private async remove(): Promise<void> {
    try {
      await this.service.remove(this.id);
      this.back();
    } catch {
      this.failed.set(true);
    }
  }

  protected edit(): void {
    void this.router.navigate(['/fields', this.id, 'edit']);
  }

  protected back(): void {
    void this.router.navigate(['/fields']);
  }
}
