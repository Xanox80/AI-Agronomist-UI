import { Component } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { Observable, of, Subject, throwError } from 'rxjs';
import { Page, TaskDto, TasksApi } from '../../core/api';
import { AuthSession } from '../../core/auth/auth-session.service';
import { SyncStatusComponent } from '../../core/offline/sync-status.component';
import { AuthService } from '../auth/auth.service';
import { HomeComponent } from './home.component';

@Component({ selector: 'ap-sync-status', template: 'sync-stub' })
class StubSyncStatusComponent {}

const tokenFor = (role: string) => `h.${btoa(JSON.stringify({ role }))}.s`;
const pageOf = (tasks: Partial<TaskDto>[]) => of({ items: tasks, total: tasks.length, page: 1, pageSize: 5 });

describe('HomeComponent', () => {
  async function render(tasks$: Observable<unknown>, role = 'scout') {
    localStorage.clear();
    TestBed.configureTestingModule({
      providers: [
        provideRouter([]),
        provideTranslateService(),
        { provide: TasksApi, useValue: { list: () => tasks$ } },
        { provide: AuthService, useValue: { user: () => ({ id: 'u1', displayName: 'Olena' }) } },
      ],
    });
    TestBed.overrideComponent(HomeComponent, {
      remove: { imports: [SyncStatusComponent] },
      add: { imports: [StubSyncStatusComponent] },
    });
    TestBed.inject(AuthSession).start({ accessToken: tokenFor(role) });
    const fixture = TestBed.createComponent(HomeComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    return fixture.nativeElement as HTMLElement;
  }

  it('offers a one-tap new-scouting button to a scout', async () => {
    const root = await render(pageOf([]));
    expect(root.querySelector('.home__primary')?.textContent).toContain('home.newScouting');
  });

  it('offers the expert queue instead of scouting to an expert', async () => {
    const root = await render(pageOf([]), 'expert');
    expect(root.querySelector('.home__primary')?.textContent).toContain('home.openExpertQueue');
  });

  it('lists my open tasks, each linking to its own detail page', async () => {
    const root = await render(pageOf([{ id: 't1', title: 'Spray wheat', fieldName: 'North 1' }]));
    const link = root.querySelector('.home__task');
    expect(link?.textContent).toContain('Spray wheat');
    expect(link?.getAttribute('href')).toBe('/tasks/t1');
  });

  it('shows a loading state instead of the empty state while tasks are loading', async () => {
    const root = await render(new Subject<Page<TaskDto>>());
    expect(root.textContent).toContain('common.loading');
    expect(root.textContent).not.toContain('home.noOpenTasks');
  });

  it('shows an error with a retry button when tasks fail to load', async () => {
    const root = await render(throwError(() => new Error('down')));
    expect(root.querySelector('[role="alert"]')?.textContent).toContain('home.tasksFailed');
    expect(root.querySelector('.home__retry button')).not.toBeNull();
  });

  it('shows the empty state without open tasks and the shared sync status', async () => {
    const root = await render(pageOf([]));
    expect(root.textContent).toContain('home.noOpenTasks');
    expect(root.textContent).toContain('sync-stub');
  });
});
