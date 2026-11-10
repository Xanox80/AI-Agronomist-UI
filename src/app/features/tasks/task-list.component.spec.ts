import { TestBed } from '@angular/core/testing';
import { provideRouter } from '@angular/router';
import { provideTranslateService } from '@ngx-translate/core';
import { TaskDto } from '../../core/api/models';
import { TaskListComponent } from './task-list.component';
import { TasksService } from './tasks.service';

const task = (clientId: string, status: TaskDto['status'], draft: boolean) => ({
  id: clientId, clientId, type: 'treatment', fieldId: 'f1', fieldName: 'North', photoUrls: [], priority: 'normal',
  status, title: `Task ${clientId}`, notes: '', createdAt: '2026-11-10T00:00:00Z', draft,
}) as TaskDto & { draft: boolean };

describe('TaskListComponent', () => {
  const service = {
    list: vi.fn().mockResolvedValue([task('a', 'open', false), task('b', 'done', true)]),
    fields: vi.fn().mockResolvedValue([]),
    assignees: vi.fn().mockResolvedValue([]),
  };

  beforeEach(() => {
    TestBed.configureTestingModule({
      providers: [provideTranslateService(), provideRouter([]), { provide: TasksService, useValue: service }],
    });
  });

  it('shows every task and a sync badge only on drafts', async () => {
    const fixture = TestBed.createComponent(TaskListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    fixture.detectChanges();
    const el: HTMLElement = fixture.nativeElement;
    expect(el.querySelectorAll('app-task-card')).toHaveLength(2);
    expect(el.querySelectorAll('p-tag[icon="pi pi-sync"]')).toHaveLength(1);
  });

  it('groups tasks into one board column per status', async () => {
    const fixture = TestBed.createComponent(TaskListComponent);
    fixture.detectChanges();
    await fixture.whenStable();
    (fixture.componentInstance as unknown as { view: { set(v: string): void } }).view.set('board');
    fixture.detectChanges();
    expect(fixture.nativeElement.querySelectorAll('.column')).toHaveLength(4);
  });
});
