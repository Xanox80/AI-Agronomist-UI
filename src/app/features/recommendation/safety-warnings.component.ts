import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { TagModule } from 'primeng/tag';
import { SafetyWarningDto } from '../../core/api/models';
import { warningSeverity } from './recommendation-display';

@Component({
  selector: 'app-recommendation-safety-warnings',
  imports: [TranslatePipe, TagModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  styles: `
    ul { list-style: none; margin: 0; padding: 0; }
    li { display: flex; gap: 0.5rem; align-items: center; min-height: var(--ap-touch-min); color: var(--ap-text); }
  `,
  template: `
    <ul>
      @for (warning of warnings(); track $index) {
        <li>
          <p-tag [severity]="severityOf(warning.severity)" [value]="'recommendation.safety.severity.' + warning.severity | translate" />
          <span>{{ 'recommendation.safety.' + warning.code | translate: warning.params }}</span>
        </li>
      }
    </ul>
  `,
})
export class SafetyWarningsComponent {
  readonly warnings = input.required<readonly SafetyWarningDto[]>();
  protected readonly severityOf = warningSeverity;
}
