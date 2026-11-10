import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { TranslatePipe } from '@ngx-translate/core';
import { ToggleSwitchModule } from 'primeng/toggleswitch';
import { ProblemCategory } from '../../core/api/models';
import { AutoApproveService } from './auto-approve.service';

@Component({
  selector: 'app-auto-approve-panel',
  imports: [TranslatePipe, FormsModule, ToggleSwitchModule],
  template: `
    <section class="panel">
      <h2>{{ 'settings.autoApprove.title' | translate }}</h2>
      <p class="hint">{{ 'settings.autoApprove.hint' | translate }}</p>
      @if (service.saveFailed()) {
        <p class="error" role="alert">{{ 'settings.saveFailed' | translate }}</p>
      }
      @for (category of service.categories; track category) {
        <label class="row">
          <span>{{ 'settings.category.' + category | translate }}</span>
          <p-toggleswitch
            [ngModel]="service.enabledCategories().has(category)"
            (onChange)="toggle(category, $event.checked)"
            [ariaLabel]="'settings.category.' + category | translate"
          />
        </label>
      }
    </section>
  `,
  styleUrl: './settings-panel.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AutoApprovePanelComponent implements OnInit {
  protected readonly service = inject(AutoApproveService);

  ngOnInit(): void {
    void this.service.load();
  }

  protected toggle(category: ProblemCategory, enabled: boolean): void {
    void this.service.setEnabled(category, enabled);
  }
}
