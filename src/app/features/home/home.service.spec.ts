import { signal } from '@angular/core';
import { TestBed } from '@angular/core/testing';
import { of, throwError } from 'rxjs';
import { TaskDto, TasksApi, UserDto } from '../../core/api';
import { AuthService } from '../auth/auth.service';
import { OPEN_TASKS_LIMIT } from './home.config';
import { HomeService } from './home.service';

const task = { id: 't1', title: 'Spray' } as TaskDto;

describe('HomeService', () => {
  let list: ReturnType<typeof vi.fn>;
  const user = signal<UserDto | null>(null);

  function create(): HomeService {
    user.set(null);
    list = vi.fn().mockReturnValue(of({ items: [task], total: 1, page: 1, pageSize: OPEN_TASKS_LIMIT }));
    TestBed.configureTestingModule({
      providers: [
        HomeService,
        { provide: TasksApi, useValue: { list } },
        { provide: AuthService, useValue: { user } },
      ],
    });
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
  });

  it('flags a task loading failure', () => {
    const service = create();
    list.mockReturnValue(throwError(() => new Error('down')));
    user.set({ id: 'u1' } as UserDto);
    TestBed.tick();
    expect(service.tasksFailed()).toBe(true);
  });
});
