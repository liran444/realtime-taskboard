import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { Subscription } from 'rxjs';
import { LayoutComponent } from '../../shared/components/layout/layout.component';
import { TaskCardComponent } from './task-card.component';
import { TaskDialogComponent, TaskDialogData } from './task-dialog.component';
import { DeleteConfirmDialogComponent } from './delete-confirm-dialog.component';
import { TaskService } from '../../core/services/task.service';
import { AuthService } from '../../core/services/auth.service';
import { SocketService } from '../../core/services/socket.service';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';

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
    LayoutComponent,
    TaskCardComponent,
  ],
  template: `
    <app-layout>
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
        </div>
      </div>

      @if (tasks.length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">assignment</mat-icon>
          <p>No tasks found. Create your first task!</p>
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

    .filter-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .task-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
      gap: 16px;
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
  private dialog = inject(MatDialog);

  tasks: Task[] = [];
  currentUserId = '';
  filterStatus = '';
  filterPriority = '';
  private sub!: Subscription;

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?._id ?? '';

    const token = this.authService.getToken();
    if (token && !this.socketService.isConnected) {
      this.socketService.connect(token);
    }

    this.sub = this.taskService.getTasks().subscribe(tasks => {
      this.tasks = tasks;
    });

    this.taskService.loadTasks();
    this.taskService.listenToSocketEvents();
  }

  onFilter(): void {
    const filters: { status?: TaskStatus; priority?: TaskPriority } = {};
    if (this.filterStatus) filters.status = this.filterStatus as TaskStatus;
    if (this.filterPriority) filters.priority = this.filterPriority as TaskPriority;
    this.taskService.loadTasks(filters);
  }

  onAddTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '520px',
      data: { mode: 'create' } as TaskDialogData,
    });

    dialogRef.afterClosed().subscribe();
  }

  onEditTask(task: Task): void {
    this.dialog.open(TaskDialogComponent, {
      width: '520px',
      data: { mode: 'edit', task } as TaskDialogData,
    });
  }

  onDeleteTask(task: Task): void {
    const dialogRef = this.dialog.open(DeleteConfirmDialogComponent, {
      width: '400px',
      data: { title: task.title },
    });

    dialogRef.afterClosed().subscribe(confirmed => {
      if (confirmed) {
        this.taskService.deleteTask(task._id).subscribe();
      }
    });
  }

  onToggleStatus(task: Task): void {
    const newStatus: TaskStatus = task.status === 'done' ? 'todo' : 'done';
    this.taskService.updateStatus(task._id, newStatus).subscribe();
  }

  ngOnDestroy(): void {
    this.sub?.unsubscribe();
    this.taskService.disposeSocketListeners();
  }
}
