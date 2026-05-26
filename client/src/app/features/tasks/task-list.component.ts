import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Subscription } from 'rxjs';
import { pairwise } from 'rxjs/operators';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { TaskCardComponent } from './task-card.component';
import { TaskDialogComponent, TaskDialogData } from './task-dialog.component';
import { DeleteConfirmDialogComponent } from './delete-confirm-dialog.component';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService, SocketStatus } from '../../core/services/socket.service';
import { UserService } from '../../core/services/user.service';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';
import { User } from '../../models/user.model';

@Component({
  selector: 'app-task-list',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatDialogModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatSelectModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    LayoutComponent,
    TaskCardComponent,
  ],
  template: `
    <app-layout>
      @if (socketStatus === 'reconnecting') {
        <div class="connection-banner">
          <mat-icon>cloud_off</mat-icon>
          <span>Connection lost, reconnecting...</span>
        </div>
      }

      <div class="toolbar-row">
        <button mat-raised-button color="primary" (click)="onAddTask()">
          <mat-icon>add</mat-icon> Add Task
        </button>

        <div class="filters">
          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Status</mat-label>
            <mat-select [(ngModel)]="filterStatus" (selectionChange)="onFilter()">
              <mat-option value="">All</mat-option>
              <mat-option value="todo">To Do</mat-option>
              <mat-option value="in-progress">In Progress</mat-option>
              <mat-option value="done">Done</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field">
            <mat-label>Priority</mat-label>
            <mat-select [(ngModel)]="filterPriority" (selectionChange)="onFilter()">
              <mat-option value="">All</mat-option>
              <mat-option value="low">Low</mat-option>
              <mat-option value="medium">Medium</mat-option>
              <mat-option value="high">High</mat-option>
              <mat-option value="critical">Critical</mat-option>
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline" class="filter-field filter-assignee">
            <mat-label>Assignee</mat-label>
            <mat-select [(ngModel)]="filterAssignee" (selectionChange)="onFilter()">
              <mat-option value="">All</mat-option>
              @for (user of users; track user._id) {
                <mat-option [value]="user._id">{{ user.displayName }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>
      </div>

      @if (loading) {
        <div class="loading-state">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (tasks.length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">assignment</mat-icon>
          <p>No tasks yet. Create your first task!</p>
        </div>
      } @else {
        <div class="task-grid">
          @for (task of tasks; track task._id) {
            <app-task-card
              [task]="task"
              [currentUserId]="currentUserId"
              (edit)="onEditTask($event)"
              (delete)="onDeleteTask($event)"
              (toggleStatus)="onToggleStatus($event)" />
          }
        </div>
      }
    </app-layout>
  `,
  styles: [`
    .connection-banner {
      display: flex;
      align-items: center;
      gap: 8px;
      background: #fff3e0;
      color: #e65100;
      padding: 10px 16px;
      border-radius: 8px;
      margin-bottom: 16px;
      font-size: 14px;
      font-weight: 500;
    }

    .toolbar-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      flex-wrap: wrap;
      gap: 16px;
      margin-bottom: 24px;
    }

    .filters {
      display: flex;
      gap: 12px;
    }

    .filter-field {
      width: 140px;
    }

    .filter-assignee {
      width: 160px;
    }

    .filter-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .task-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
    }

    .loading-state {
      display: flex;
      justify-content: center;
      padding: 64px 0;
    }

    .empty-state {
      text-align: center;
      padding: 64px 16px;
      color: #999;
    }

    .empty-icon {
      font-size: 64px;
      width: 64px;
      height: 64px;
      margin-bottom: 16px;
    }

    .empty-state p {
      font-size: 16px;
    }

    @media (max-width: 600px) {
      .toolbar-row {
        flex-direction: column;
        align-items: stretch;
      }
      .filters {
        flex-direction: column;
      }
      .filter-field {
        width: 100%;
      }
      .task-grid {
        grid-template-columns: 1fr;
      }
    }
  `],
})
export class TaskListComponent implements OnInit, OnDestroy {
  private taskService = inject(TaskService);
  private authService = inject(AuthService);
  private socketService = inject(SocketService);
  private userService = inject(UserService);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  tasks: Task[] = [];
  users: User[] = [];
  currentUserId = '';
  filterStatus = '';
  filterPriority = '';
  filterAssignee = '';
  loading = false;
  socketStatus: SocketStatus = 'idle';
  private subs: Subscription[] = [];

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?._id ?? '';

    const token = this.authService.getToken();
    if (token && !this.socketService.isConnected) {
      this.socketService.connect(token);
    }

    this.subs.push(
      this.taskService.getTasks().subscribe(tasks => {
        this.tasks = tasks;
      }),
      this.taskService.getLoading().subscribe(loading => {
        this.loading = loading;
      }),
      this.socketService.socketStatus$.subscribe(status => {
        this.socketStatus = status;
        if (status === 'reconnecting') {
          this.snackBar.open('Connection lost, reconnecting...', 'Dismiss', { duration: 5000 });
        }
      }),
      this.socketService.socketStatus$.pipe(pairwise()).subscribe(([prev, curr]) => {
        if (prev === 'reconnecting' && curr === 'connected') {
          this.snackBar.open('Connection restored', 'Dismiss', { duration: 3000 });
          this.taskService.loadTasks(this.currentFilters);
        }
      }),
    );

    this.userService.getUsers().subscribe(users => {
      this.users = users;
    });

    this.taskService.loadTasks();
    this.taskService.listenToSocketEvents();
  }

  private get currentFilters(): { status?: TaskStatus; priority?: TaskPriority; assignee?: string } {
    const filters: { status?: TaskStatus; priority?: TaskPriority; assignee?: string } = {};
    if (this.filterStatus) {
      filters.status = this.filterStatus as TaskStatus;
    }
    if (this.filterPriority) {
      filters.priority = this.filterPriority as TaskPriority;
    }
    if (this.filterAssignee) {
      filters.assignee = this.filterAssignee;
    }
    return filters;
  }

  onFilter(): void {
    this.taskService.loadTasks(this.currentFilters);
  }

  onAddTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '520px',
      data: { mode: 'create' } as TaskDialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Task created', 'Dismiss', { duration: 3000 });
      }
    });
  }

  onEditTask(task: Task): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '520px',
      data: { mode: 'edit', task } as TaskDialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Task updated', 'Dismiss', { duration: 3000 });
      }
    });
  }

  onDeleteTask(task: Task): void {
    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      width: '400px',
      data: { title: task.title },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.taskService.deleteTask(task._id).subscribe({
          next: () => {
            this.snackBar.open('Task deleted', 'Dismiss', { duration: 3000 });
          },
          error: () => {
            this.snackBar.open('Failed to delete task', 'Dismiss', { duration: 4000 });
          },
        });
      }
    });
  }

  onToggleStatus(task: Task): void {
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    this.taskService.updateStatus(task._id, newStatus).subscribe({
      error: () => {
        this.snackBar.open('Failed to update status', 'Dismiss', { duration: 4000 });
      },
    });
  }

  ngOnDestroy(): void {
    this.subs.forEach(sub => sub.unsubscribe());
    this.taskService.disposeSocketListeners();
  }
}
