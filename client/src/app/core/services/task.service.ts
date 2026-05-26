import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { BehaviorSubject, Observable, Subscription, tap } from 'rxjs';
import { Task, CreateTaskRequest, UpdateTaskRequest, TaskStatus, TaskPriority } from '../../models/task.model';
import { ApiResponse } from '../../models/user.model';
import { SocketService } from './socket.service';

@Injectable({ providedIn: 'root' })
export class TaskService {
  private http = inject(HttpClient);
  private socketService = inject(SocketService);

  private tasks$ = new BehaviorSubject<Task[]>([]);
  private loading$ = new BehaviorSubject<boolean>(false);
  private socketSubs: Subscription[] = [];

  getLoading(): Observable<boolean> {
    return this.loading$.asObservable();
  }

  loadTasks(filters?: { status?: TaskStatus; priority?: TaskPriority; assignee?: string }): void {
    this.loading$.next(true);

    let params = new HttpParams();
    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.priority) {
      params = params.set('priority', filters.priority);
    }
    if (filters?.assignee) {
      params = params.set('assignee', filters.assignee);
    }

    this.http.get<ApiResponse<Task[]>>('/api/tasks', { params }).subscribe({
      next: res => {
        this.tasks$.next(res.data);
        this.loading$.next(false);
      },
      error: () => {
        this.loading$.next(false);
      },
    });
  }

  getTasks(): Observable<Task[]> {
    return this.tasks$.asObservable();
  }

  createTask(data: CreateTaskRequest) {
    return this.http.post<ApiResponse<Task>>('/api/tasks', data);
  }

  updateTask(id: string, data: UpdateTaskRequest) {
    return this.http.put<ApiResponse<Task>>(`/api/tasks/${id}`, data);
  }

  deleteTask(id: string) {
    return this.http.delete<ApiResponse<{ message: string }>>(`/api/tasks/${id}`);
  }

  updateStatus(id: string, status: TaskStatus) {
    return this.http.patch<ApiResponse<Task>>(`/api/tasks/${id}/status`, { status });
  }

  lockTask(taskId: string): void {
    this.socketService.emit('task:lock', taskId);
  }

  unlockTask(taskId: string): void {
    this.socketService.emit('task:unlock', taskId);
  }

  listenToSocketEvents(): void {
    this.disposeSocketListeners();

    this.socketSubs.push(
      this.socketService.on<Task>('task:created').subscribe(task => {
        const current = this.tasks$.value;
        this.tasks$.next([...current, task]);
      }),

      this.socketService.on<Task>('task:updated').subscribe(task => {
        const current = this.tasks$.value.map(t => t._id === task._id ? task : t);
        this.tasks$.next(current);
      }),

      this.socketService.on<{ taskId: string }>('task:deleted').subscribe(({ taskId }) => {
        const current = this.tasks$.value.filter(t => t._id !== taskId);
        this.tasks$.next(current);
      }),

      this.socketService.on<{ taskId: string; lockedBy: any }>('task:locked').subscribe(({ taskId, lockedBy }) => {
        const current = this.tasks$.value.map(t =>
          t._id === taskId ? { ...t, lockedBy } : t
        );
        this.tasks$.next(current);
      }),

      this.socketService.on<{ taskId: string }>('task:unlocked').subscribe(({ taskId }) => {
        const current = this.tasks$.value.map(t =>
          t._id === taskId ? { ...t, lockedBy: undefined, lockedAt: undefined } : t
        );
        this.tasks$.next(current);
      })
    );
  }

  disposeSocketListeners(): void {
    this.socketSubs.forEach(sub => sub.unsubscribe());
    this.socketSubs = [];
  }
}
