import { CanDeactivateFn, Routes } from '@angular/router';
import { ScoutingComponent } from './scouting.component';

/** Keeps a back gesture or a nav tap from silently dropping photos that are not saved yet. */
export const confirmLeaveScouting: CanDeactivateFn<ScoutingComponent> = (component) => component.canLeave();

export const SCOUTING_ROUTES: Routes = [
  { path: '', component: ScoutingComponent, canDeactivate: [confirmLeaveScouting] },
];
