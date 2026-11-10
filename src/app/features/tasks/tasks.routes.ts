import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';
import { TaskDetailComponent } from './task-detail.component';
import { TaskFormComponent } from './task-form.component';
import { TaskListComponent } from './task-list.component';

export const TASKS_ROUTES: Routes = [
  { path: '', component: TaskListComponent },
  { path: 'new', canActivate: [roleGuard('scout', 'chief_agronomist')], component: TaskFormComponent },
  { path: ':id', component: TaskDetailComponent },
  { path: ':id/edit', canActivate: [roleGuard('scout', 'chief_agronomist')], component: TaskFormComponent },
];
