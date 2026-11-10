import { ChangeDetectionStrategy, Component, computed, inject, input, output, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { MultiSelectModule } from 'primeng/multiselect';
import { SelectModule } from 'primeng/select';
import { SelectButtonModule } from 'primeng/selectbutton';
import { TextareaModule } from 'primeng/textarea';
import {
  AffectedRegion, CatalogDiagnosisDto, CreateLabelRequest, CropDto, LabelAction, NewClassInput,
} from '../../core/api/models';
import { EXPERT_CONFIG } from './expert.config';
import { buildLabelRequest } from './label-request';

const ACTIONS: readonly LabelAction[] = ['confirm', 'change', 'add_new_class', 'reject'];

/** Confirm / change diagnosis / add new class / reject form of the labeling tool. */
@Component({
  selector: 'app-label-form',
  imports: [
    FormsModule, TranslatePipe, ButtonModule, InputTextModule, MultiSelectModule, SelectModule,
    SelectButtonModule, TextareaModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    form { display: grid; gap: 0.75rem; }
    label { display: grid; gap: 0.25rem; color: var(--ap-text-sec); font-size: 0.875rem; }
    .error { color: var(--ap-danger); margin: 0; }
    .hint { color: var(--ap-text-sec); margin: 0; font-size: 0.875rem; }
  `,
  template: `
    <form (ngSubmit)="submit()">
      <p-selectbutton [options]="actionOptions()" optionLabel="label" optionValue="value"
        [ngModel]="action()" (ngModelChange)="action.set($event)" name="action"
        [allowEmpty]="false" [ariaLabel]="'expert.label.action' | translate" />
      @if (action() === 'confirm') {
        <p class="hint">{{ 'expert.label.confirmHint' | translate }}</p>
      }
      @if (action() === 'change') {
        <label>{{ 'expert.label.diagnosis' | translate }}
          <p-select [options]="diagnosisOptions()" optionLabel="label" optionValue="value" [filter]="true"
            [ngModel]="diagnosisId()" (ngModelChange)="diagnosisId.set($event)" name="diagnosis" appendTo="body" />
        </label>
      }
      @if (action() === 'add_new_class') {
        <label>{{ 'expert.label.newClass.code' | translate }}
          <input pInputText name="code" [ngModel]="newClass().code" (ngModelChange)="patchNewClass({ code: $event })" />
        </label>
        <label>{{ 'expert.label.newClass.nameUk' | translate }}
          <input pInputText name="nameUk" [ngModel]="newClass().nameUk" (ngModelChange)="patchNewClass({ nameUk: $event })" />
        </label>
        <label>{{ 'expert.label.newClass.nameEn' | translate }}
          <input pInputText name="nameEn" [ngModel]="newClass().nameEn" (ngModelChange)="patchNewClass({ nameEn: $event })" />
        </label>
        <label>{{ 'expert.label.newClass.category' | translate }}
          <p-select [options]="categoryOptions()" optionLabel="label" optionValue="value" name="category" appendTo="body"
            [ngModel]="newClass().problemCategory" (ngModelChange)="patchNewClass({ problemCategory: $event })" />
        </label>
        <label>{{ 'expert.label.newClass.crops' | translate }}
          <p-multiselect [options]="cropOptions()" optionLabel="label" optionValue="value" name="crops" appendTo="body"
            [ngModel]="newClass().cropIds ?? []" (ngModelChange)="patchNewClass({ cropIds: $event })" />
        </label>
      }
      <label>{{ 'expert.label.comment' | translate }}
        <textarea pTextarea rows="2" name="comment" [ngModel]="comment()" (ngModelChange)="comment.set($event)"></textarea>
      </label>
      <p class="hint">{{ (region() ? 'expert.label.regionSet' : 'expert.label.regionNone') | translate }}</p>
      @if (errorKey(); as key) {
        <p class="error" role="alert">{{ key | translate }}</p>
      }
      <p-button type="submit" icon="pi pi-check" [label]="'expert.label.submit' | translate" [loading]="busy()" />
    </form>
  `,
})
export class LabelFormComponent {
  private readonly translate = inject(TranslateService);

  readonly diagnoses = input.required<readonly CatalogDiagnosisDto[]>();
  readonly crops = input.required<readonly CropDto[]>();
  readonly modelTopDiagnosisId = input<string>();
  readonly region = input<AffectedRegion>();
  readonly busy = input(false);
  readonly submitted = output<CreateLabelRequest>();

  protected readonly action = signal<LabelAction>('confirm');
  protected readonly diagnosisId = signal<string | undefined>(undefined);
  protected readonly newClass = signal<Partial<NewClassInput>>({});
  protected readonly comment = signal('');
  protected readonly errorKey = signal<string | null>(null);

  private readonly isEnglish = () => this.translate.currentLang === 'en';
  protected readonly actionOptions = computed(() =>
    ACTIONS.map((value) => ({ value, label: this.translate.instant(`expert.label.actions.${value}`) })));
  protected readonly diagnosisOptions = computed(() =>
    this.diagnoses().map((d) => ({ value: d.id, label: this.isEnglish() ? d.nameEn : d.nameUk })));
  protected readonly cropOptions = computed(() =>
    this.crops().map((c) => ({ value: c.id, label: this.isEnglish() ? c.nameEn : c.nameUk })));
  protected readonly categoryOptions = computed(() =>
    EXPERT_CONFIG.problemCategories.map((value) => ({ value, label: this.translate.instant(`expert.category.${value}`) })));

  protected patchNewClass(patch: Partial<NewClassInput>): void {
    this.newClass.update((current) => ({ ...current, ...patch }));
  }

  protected submit(): void {
    const result = buildLabelRequest(
      { action: this.action(), diagnosisId: this.diagnosisId(), newClass: this.newClass(), comment: this.comment(), region: this.region() },
      this.modelTopDiagnosisId(),
    );
    if ('errorKey' in result) {
      this.errorKey.set(result.errorKey);
      return;
    }
    this.errorKey.set(null);
    this.submitted.emit(result.request);
  }
}
