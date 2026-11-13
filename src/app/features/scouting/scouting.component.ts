import { ChangeDetectionStrategy, Component, computed, inject, OnInit } from '@angular/core';
import { RouterLink } from '@angular/router';
import { TranslatePipe, TranslateService } from '@ngx-translate/core';
import { Button } from 'primeng/button';
import { ScoutingWizard } from './scouting-wizard.service';
import { StepFieldComponent } from './step-field.component';
import { StepNoteComponent } from './step-note.component';
import { StepObjectComponent } from './step-object.component';
import { StepPhotosComponent } from './step-photos.component';

@Component({
  selector: 'app-scouting',
  imports: [Button, RouterLink, StepFieldComponent, StepObjectComponent, StepPhotosComponent, StepNoteComponent, TranslatePipe],
  providers: [ScoutingWizard],
  template: `
    <section class="scout-page">
      <header class="scout-page-header">
        <h1>{{ (wizard.isQuickCapture() ? 'scouting.quickTitle' : 'scouting.title') | translate }}</h1>
        @if (wizard.stepCount() > 1 && !wizard.savedOutcome()) {
          <span class="progress" aria-live="polite">
            {{ 'scouting.progress' | translate: { step: wizard.step() + 1, total: wizard.stepCount() } }}
          </span>
        }
      </header>

      @if (wizard.savedOutcome(); as outcome) {
        <section class="saved" role="status">
          <i class="pi pi-check-circle saved-icon" aria-hidden="true"></i>
          <h2>{{ 'scouting.saved.' + outcome + '.title' | translate }}</h2>
          <p>{{ 'scouting.saved.' + outcome + '.text' | translate }}</p>
          <p-button
            [label]="'scouting.saved.again' | translate" icon="pi pi-camera" size="large" fluid
            (onClick)="wizard.scoutAgain()"
          />
          <a class="home-link" routerLink="/home">{{ 'scouting.saved.home' | translate }}</a>
        </section>
      } @else {
        @if (wizard.stepCount() > 1) {
          <ol class="stepper">
            @for (name of wizard.steps(); track name; let index = $index) {
              <li
                [class.done]="index < wizard.step()" [class.current]="index === wizard.step()"
                [attr.aria-current]="index === wizard.step() ? 'step' : null"
              >
                <span class="stepper-bar" aria-hidden="true"></span>
                <span class="stepper-label">{{ 'scouting.steps.' + name | translate }}</span>
              </li>
            }
          </ol>
        }

        @switch (wizard.currentStep()) {
          @case ('field') { <app-scouting-step-field /> }
          @case ('object') { <app-scouting-step-object /> }
          @case ('photos') { <app-scouting-step-photos /> }
          @case ('note') { <app-scouting-step-note /> }
        }

        @if (wizard.blockedHintKey(); as hintKey) {
          <p class="blocked-hint" role="status">
            <i class="pi pi-info-circle" aria-hidden="true"></i> {{ hintKey | translate }}
          </p>
        }
        <footer class="nav">
          @if (wizard.step() > 0) {
            <p-button
              [label]="'common.back' | translate" icon="pi pi-arrow-left" severity="secondary" size="large"
              (onClick)="wizard.back()"
            />
          }
          @if (wizard.isLastStep()) {
            <p-button
              class="nav-primary" [label]="submitLabelKey() | translate" icon="pi pi-check" size="large" fluid
              [loading]="wizard.submitting()" [disabled]="!wizard.canAdvance()" (onClick)="wizard.submit()"
            />
          } @else {
            <p-button
              class="nav-primary" [label]="'common.next' | translate" icon="pi pi-arrow-right" iconPos="right"
              size="large" fluid [disabled]="!wizard.canAdvance()" (onClick)="wizard.next()"
            />
          }
        </footer>
      }
    </section>
  `,
  styles: `
    .progress { color: var(--ap-text-muted); }
    .stepper { display: flex; gap: 0.375rem; margin: 0 0 1.25rem; padding: 0; list-style: none; }
    .stepper li { flex: 1; display: grid; gap: 0.25rem; min-width: 0; }
    .stepper-bar { display: block; height: 0.375rem; border-radius: var(--ap-radius-sm); background: var(--ap-border); }
    .stepper li.done .stepper-bar, .stepper li.current .stepper-bar { background: var(--ap-accent); }
    .stepper-label {
      font-size: 0.8rem; color: var(--ap-text-muted); overflow: hidden; text-overflow: ellipsis; white-space: nowrap;
    }
    .stepper li.current .stepper-label { color: var(--ap-text); font-weight: 600; }
    .blocked-hint { display: flex; gap: 0.5rem; align-items: center; margin: 1rem 0 0; color: var(--ap-text-sec); }
    .nav { display: flex; gap: 1rem; margin-top: 1rem; }
    .nav-primary { flex: 1; }
    .saved { display: grid; gap: 1rem; justify-items: center; text-align: center; }
    .saved h2, .saved p { margin: 0; }
    .saved-icon { font-size: 3rem; color: var(--ap-accent); }
    .home-link {
      display: inline-flex; align-items: center; min-height: var(--ap-touch-min);
      color: var(--ap-accent); font-weight: 600;
    }
  `,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class ScoutingComponent implements OnInit {
  protected readonly wizard = inject(ScoutingWizard);
  private readonly translate = inject(TranslateService);
  protected readonly submitLabelKey = computed(() => {
    if (this.wizard.extendedObservationId()) return 'scouting.addPhotos';
    if (this.wizard.isQuickCapture()) return 'scouting.saveQuick';
    return this.wizard.online() ? 'scouting.submit' : 'scouting.saveOffline';
  });

  ngOnInit(): void {
    void this.wizard.start();
  }

  /** Asked by the route guard: photos live only in memory until submit, so leaving needs the scout's consent. */
  canLeave(): boolean {
    return !this.wizard.hasUnsavedWork() || window.confirm(this.translate.instant('scouting.leaveConfirm'));
  }
}
