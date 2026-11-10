import { ChangeDetectionStrategy, Component, inject, OnInit } from '@angular/core';
import { TranslatePipe } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { ScoutingWizard } from './scouting-wizard.service';
import { SCOUTING_CONFIG } from './scouting.config';
import { StepFieldComponent } from './step-field.component';
import { StepNoteComponent } from './step-note.component';
import { StepObjectComponent } from './step-object.component';
import { StepPhotosComponent } from './step-photos.component';

@Component({
  selector: 'app-scouting',
  imports: [Button, StepFieldComponent, StepObjectComponent, StepPhotosComponent, StepNoteComponent, TranslatePipe],
  providers: [ScoutingWizard],
  template: `
    <section class="scout-page">
      <header class="scout-page-header">
        <h1>{{ (wizard.isQuickCapture() ? 'scouting.quickTitle' : 'scouting.title') | translate }}</h1>
        <span class="progress">
          {{ 'scouting.progress' | translate: { step: wizard.step() + 1, total: stepCount } }}
        </span>
      </header>

      @switch (wizard.currentStep()) {
        @case ('field') { <app-scouting-step-field /> }
        @case ('object') { <app-scouting-step-object /> }
        @case ('photos') { <app-scouting-step-photos /> }
        @case ('note') { <app-scouting-step-note /> }
      }

      <footer class="nav">
        <p-button
          [label]="'common.back' | translate" icon="pi pi-arrow-left" severity="secondary" size="large"
          [disabled]="wizard.step() === 0" (onClick)="wizard.back()"
        />
        @if (wizard.isLastStep()) {
          <p-button
            [label]="(wizard.isQuickCapture() ? 'scouting.saveQuick' : 'scouting.submit') | translate"
            icon="pi pi-check" size="large" [loading]="wizard.submitting()" (onClick)="wizard.submit()"
          />
        } @else {
          <p-button
            [label]="'common.next' | translate" icon="pi pi-arrow-right" iconPos="right" size="large"
            [disabled]="!wizard.canAdvance()" (onClick)="wizard.next()"
          />
        }
      </footer>
    </section>
  `,
  styles: `
    .progress { color: var(--ap-text-muted); }
    .nav { display: flex; justify-content: space-between; gap: 1rem; margin-top: 1.5rem; }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoutingComponent implements OnInit {
  protected readonly wizard = inject(ScoutingWizard);
  protected readonly stepCount = SCOUTING_CONFIG.stepCount;

  ngOnInit(): void {
    void this.wizard.start();
  }
}
