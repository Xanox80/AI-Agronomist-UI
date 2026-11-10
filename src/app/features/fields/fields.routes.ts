import { Routes } from '@angular/router';
import { roleGuard } from '../../core/auth/role.guard';
import { FieldDetailComponent } from './field-detail.component';
import { FieldFormComponent } from './field-form.component';
import { FieldImportComponent } from './field-import.component';
import { FieldListComponent } from './field-list.component';

export const FIELDS_ROUTES: Routes = [
  { path: '', component: FieldListComponent },
  { path: 'new', canActivate: [roleGuard('scout', 'chief_agronomist')], component: FieldFormComponent },
  { path: 'import', canActivate: [roleGuard('chief_agronomist')], component: FieldImportComponent },
  { path: ':id/edit', canActivate: [roleGuard('scout', 'chief_agronomist')], component: FieldFormComponent },
  { path: ':id', component: FieldDetailComponent },
];
