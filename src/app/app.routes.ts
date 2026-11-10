import { Routes } from '@angular/router';
import { roleGuard } from './core/auth/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadChildren: () => import('./features/auth/auth.routes').then((m) => m.AUTH_ROUTES),
  },
  {
    path: '',
    canActivate: [roleGuard()],
    loadComponent: () => import('./features/shell/shell.component').then((m) => m.ShellComponent),
    children: [
      { path: '', pathMatch: 'full', redirectTo: 'home' },
      { path: 'home', loadChildren: () => import('./features/home/home.routes').then((m) => m.HOME_ROUTES) },
      { path: 'fields', loadChildren: () => import('./features/fields/fields.routes').then((m) => m.FIELDS_ROUTES) },
      {
        path: 'scouting',
        loadChildren: () => import('./features/scouting/scouting.routes').then((m) => m.SCOUTING_ROUTES),
      },
      {
        path: 'diagnosis/:id',
        loadChildren: () => import('./features/diagnosis/diagnosis.routes').then((m) => m.DIAGNOSIS_ROUTES),
      },
      {
        path: 'recommendation/:observationId',
        loadChildren: () =>
          import('./features/recommendation/recommendation.routes').then((m) => m.RECOMMENDATION_ROUTES),
      },
      { path: 'tasks', loadChildren: () => import('./features/tasks/tasks.routes').then((m) => m.TASKS_ROUTES) },
      {
        path: 'heatmap',
        canActivate: [roleGuard('chief_agronomist')],
        loadChildren: () => import('./features/heatmap/heatmap.routes').then((m) => m.HEATMAP_ROUTES),
      },
      {
        path: 'expert',
        canActivate: [roleGuard('expert', 'chief_agronomist')],
        loadChildren: () => import('./features/expert/expert.routes').then((m) => m.EXPERT_ROUTES),
      },
      {
        path: 'settings',
        loadChildren: () => import('./features/settings/settings.routes').then((m) => m.SETTINGS_ROUTES),
      },
      {
        path: 'catalog-admin',
        canActivate: [roleGuard('chief_agronomist')],
        loadChildren: () =>
          import('./features/catalog-admin/catalog-admin.routes').then((m) => m.CATALOG_ADMIN_ROUTES),
      },
    ],
  },
  { path: '**', redirectTo: '' },
];
