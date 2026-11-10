import { ChangeDetectionStrategy, Component, computed, input, model } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { SelectModule } from 'primeng/select';

/** Select over a fixed value list whose labels are the i18n keys `<prefix>.<value>`. */
@Component({
  selector: 'app-enum-select',
  imports: [FormsModule, TranslatePipe, SelectModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `:host { display: block; } p-select { width: 100%; min-height: var(--ap-touch-min); }`,
  template: `
    <p-select [options]="options()" optionValue="value" [ngModel]="value()" (ngModelChange)="value.set($event ?? null)"
      [showClear]="clearable()" [placeholder]="placeholder() | translate" [ariaLabel]="placeholder() | translate">
      <ng-template #selectedItem let-option>{{ prefix() + '.' + option.value | translate }}</ng-template>
      <ng-template #item let-option>{{ prefix() + '.' + option.value | translate }}</ng-template>
    </p-select>
  `,
})
export class EnumSelectComponent<T extends string> {
  readonly values = input.required<readonly T[]>();
  readonly prefix = input.required<string>();
  readonly placeholder = input.required<string>();
  readonly clearable = input(false);
  readonly value = model<T | null>(null);

  protected readonly options = computed(() => this.values().map((value) => ({ value })));
}
