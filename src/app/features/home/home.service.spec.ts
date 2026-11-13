import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TaskDto, TasksApi, UserDto } from '../../core/api';
import { AuthSession } from '../../core/auth/auth-session.service';
import { AuthService } from '../auth/auth.service';
import { HOME_PRIMARY_ACTIONS, OPEN_TASKS_LIMIT } from './home.config';
import { HomeService } from './home.service';

const task = { id: 't1', title: 'Spray' } as TaskDto;
const tokenFor = (role: string) => `h.${btoa(JSON.stringify({ role }))}.s`;

describe('HomeService', () => {
  let list: ReturnType<typeof vi.fn>;
  const user = signal<UserDto | null>(null);

  function create(role = 'scout'): HomeService {
    localStorage.clear();
    user.set(null);
    list = vi.fn().mockReturnValue(of({ items: [task], total: 1, page: 1, pageSize: OPEN_TASKS_LIMIT }));
    TestBed.configureTestingModule({
      providers: [
        HomeService,
        { provide: TasksApi, useValue: { list } },
        { provide: AuthService, useValue: { user } },
      ],
    });
    TestBed.inject(AuthSession).start({ accessToken: tokenFor(role) });
    return TestBed.inject(HomeService);
  }

  it('does not load tasks until the user is known, then loads only my open tasks', () => {
    const service = create();
    TestBed.tick();
    expect(list).not.toHaveBeenCalled();
    user.set({ id: 'u1' } as UserDto);
    TestBed.tick();
    expect(list).toHaveBeenCalledWith({ status: 'open', assigneeId: 'u1', pageSize: OPEN_TASKS_LIMIT });
    expect(service.openTasks()).toEqual([task]);
    expect(service.tasksLoading()).toBe(false);
  });

  it('flags a task loading failure and clears it on a successful retry', () => {
    const service = create();
    list.mockReturnValue(throwError(() => new Error('down')));
    user.set({ id: 'u1' } as UserDto);
    TestBed.tick();
    expect(service.tasksFailed()).toBe(true);
    expect(service.tasksLoading()).toBe(false);

    list.mockReturnValue(of({ items: [task], total: 1, page: 1, pageSize: OPEN_TASKS_LIMIT }));
    service.reloadTasks();
    expect(service.tasksFailed()).toBe(false);
    expect(service.openTasks()).toEqual([task]);
  });

  it('offers new scouting as the primary action to roles that scout', () => {
    expect(create('mechanic').primaryAction()).toBe(HOME_PRIMARY_ACTIONS.mechanic);
    TestBed.resetTestingModule();
    expect(create('scout').primaryAction()?.path).toBe('/scouting');
  });

  it('offers the expert queue instead of scouting to an expert', () => {
    expect(create('expert').primaryAction()?.path).toBe('/expert');
  });
});
