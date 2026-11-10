import { ChangeDetectionStrategy, Component, computed, inject, input, model, OnInit, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { DatePickerModule } from 'primeng/datepicker';
import { DialogModule } from 'primeng/dialog';
import { InputNumberModule } from 'primeng/inputnumber';
import { SelectModule } from 'primeng/select';
import { ProductDto, TreatmentInput } from '../../core/api/models';
import { TASKS_CONFIG } from './tasks.config';
import { TasksService } from './tasks.service';
import { emptyTreatmentForm, toTreatmentInput, TreatmentFormValue } from './treatment-form.model';

/** Records the treatment log entry (product, dose, date, area) when a treatment task is completed. */
@Component({
  selector: 'app-task-complete-dialog',
  imports: [FormsModule, TranslatePipe, ButtonModule, DatePickerModule, DialogModule, InputNumberModule, SelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    .row { display: grid; gap: 0.25rem; margin-bottom: 0.75rem; }
    .row > * { width: 100%; }
    .pair { display: grid; grid-template-columns: 2fr 1fr; gap: 0.5rem; }
    .actions { display: flex; justify-content: flex-end; gap: 0.5rem; }
  `,
  template: `
    <p-dialog [visible]="visible()" (visibleChange)="visible.set($event)" [modal]="true" [closable]="true"
      [header]="'tasks.complete.title' | translate" [style]="{ width: '30rem', maxWidth: '95vw' }">
      <div class="row">
        <label for="cd-product">{{ 'tasks.complete.product' | translate }}</label>
        <p-select inputId="cd-product" [options]="products()" optionLabel="name" optionValue="id" [filter]="true"
          [ngModel]="form().productId" (ngModelChange)="patch({ productId: $event })" />
      </div>
      <div class="pair row">
        <div class="row">
          <label for="cd-dose">{{ 'tasks.complete.dose' | translate }}</label>
          <p-inputnumber inputId="cd-dose" [min]="0" [minFractionDigits]="0" [maxFractionDigits]="3"
            [ngModel]="form().doseValue" (ngModelChange)="patch({ doseValue: $event })" />
        </div>
        <div class="row">
          <label for="cd-unit">{{ 'tasks.complete.unit' | translate }}</label>
          <p-select inputId="cd-unit" [options]="doseUnits" [ngModel]="form().doseUnit"
            (ngModelChange)="patch({ doseUnit: $event })" />
        </div>
      </div>
      <div class="row">
        <label for="cd-area">{{ 'tasks.complete.area' | translate }}</label>
        <p-inputnumber inputId="cd-area" [min]="0" [maxFractionDigits]="areaDecimals"
          [ngModel]="form().treatedAreaHa" (ngModelChange)="patch({ treatedAreaHa: $event })" />
      </div>
      <div class="row">
        <label for="cd-date">{{ 'tasks.complete.date' | translate }}</label>
        <p-datepicker inputId="cd-date" [ngModel]="form().appliedAt" [maxDate]="today"
          (ngModelChange)="patch({ appliedAt: $event ?? today })" [showIcon]="true" />
      </div>
      <ng-template #footer>
        <div class="actions">
          <p-button severity="secondary" [label]="'common.cancel' | translate" (onClick)="visible.set(false)" />
          <p-button icon="pi pi-check" [label]="'tasks.complete.submit' | translate" [disabled]="!valid()"
            (onClick)="submit()" />
        </div>
      </ng-template>
    </p-dialog>
  `,
})
export class TaskCompleteDialogComponent implements OnInit {
  private readonly service = inject(TasksService);

  readonly fieldAreaHa = input<number>();
  readonly visible = model(false);
  readonly completed = output<TreatmentInput>();

  protected readonly today = new Date();
  protected readonly doseUnits = [...TASKS_CONFIG.doseUnits];
  protected readonly areaDecimals = TASKS_CONFIG.areaDecimals;
  protected readonly products = signal<ProductDto[]>([]);
  protected readonly form = signal<TreatmentFormValue>(emptyTreatmentForm(undefined, this.today));
  protected readonly valid = computed(() => toTreatmentInput(this.form()) !== null);

  ngOnInit(): void {
    this.form.set(emptyTreatmentForm(this.fieldAreaHa(), this.today));
    this.service.products().then((items) => this.products.set(items), () => this.products.set([]));
  }

  protected patch(change: Partial<TreatmentFormValue>): void {
    this.form.update((current) => ({ ...current, ...change }));
  }

  protected submit(): void {
    const treatment = toTreatmentInput(this.form());
    if (treatment) this.completed.emit(treatment);
  }
}
