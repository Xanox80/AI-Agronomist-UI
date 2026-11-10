import { Routes } from '@angular/router';
import { CaseDetailComponent } from './case-detail.component';
import { ExpertComponent } from './expert.component';

export const EXPERT_ROUTES: Routes = [
  { path: '', component: ExpertComponent },
  { path: ':id', component: CaseDetailComponent },
];
