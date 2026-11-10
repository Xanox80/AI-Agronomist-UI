import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { of } from 'rxjs';
import { TaskDto, TasksApi } from '../../core/api';
import { SyncStatusComponent } from '../../core/offline/sync-status.component';
import { AuthService } from '../auth/auth.service';
import { HomeComponent } from './home.component';

@Component({ selector: 'ap-sync-status', template: 'sync-stub' })
class StubSyncStatusComponent {}

describe('HomeComponent', () => {
  async function render(tasks: Partial<TaskDto>[]) {
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: TasksApi, useValue: { list: () => of({ items: tasks, total: tasks.length, page: 1, pageSize: 5 }) } },
        { provide: AuthService, useValue: { user: () => ({ id: 'u1', displayName: 'Olena' }) } },
      ],
    });
    TestBed.overrideComponent(HomeComponent, {
      remove: { imports: [SyncStatusComponent] },
      add: { imports: [StubSyncStatusComponent] },
    });
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('offers a quick new-scouting button linking to the scouting page', async () => {
    const root = await render([]);
    expect(root.querySelector('.home__scout')?.getAttribute('routerlink')).toBe('/scouting');
  });

  it('lists my open tasks', async () => {
    const root = await render([{ id: 't1', title: 'Spray wheat', fieldName: 'North 1' }]);
    expect(root.querySelector('.home__task')?.textContent).toContain('Spray wheat');
  });

  it('shows the empty state without open tasks and the shared sync status', async () => {
    const root = await render([]);
    expect(root.textContent).toContain('home.noOpenTasks');
    expect(root.textContent).toContain('sync-stub');
  });
});
