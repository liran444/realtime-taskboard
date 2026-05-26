import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Task, TaskPriority } from '../../models/task.model';

@Component({
  selector: 'app-task-card',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatChipsModule,
    MatIconModule,
    MatButtonModule,
    MatTooltipModule,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-card class="task-card" [class.overdue]="isOverdue" [class.done]="task.status === 'done'">
      @if (isLockedByOther) {
        <div class="lock-banner">
          <mat-icon class="lock-icon">lock</mat-icon>
          <span>Editing by {{ task.lockedBy?.displayName || 'another user' }}</span>
        </div>
      }

      <mat-card-header>
        <mat-card-title class="task-title">{{ task.title | slice:0:40 }}{{ task.title.length > 40 ? '...' : '' }}</mat-card-title>
      </mat-card-header>

      <mat-card-content>
        <div class="task-description-container">
          @if (task.description) {
            <span class="task-description">{{ task.description | slice:0:50 }}{{ task.description.length > 50 ? '...' : '' }}</span>
          } @else {
            <span class="task-description">-- No description --</span>
          }
        </div>

        <div class="chips-row">
          <span class="priority-chip" [class]="'priority-' + task.priority">
            {{ task.priority }}
          </span>
          <span class="status-chip" [class]="'status-' + task.status">
            {{ statusLabel }}
          </span>
        </div>

        <div class="meta-row">
          @if (task.dueDate) {
            <div class="meta-item" [class.overdue-text]="isOverdue">
              <mat-icon class="meta-icon">calendar_today</mat-icon>
              <span>{{ task.dueDate | date:'mediumDate' }}</span>
            </div>
          } @else {
            <div class="meta-item">
              <mat-icon class="meta-icon">calendar_today</mat-icon>
              <span>No due date</span>
            </div>
          }
          @if (task.assignee) {
            <div class="meta-item">
              <mat-icon class="meta-icon">person</mat-icon>
              <span>{{ task.assignee.displayName }}</span>
            </div>
          } @else {
            <div class="meta-item">
              <mat-icon class="meta-icon">person</mat-icon>
              <span>Unassigned</span>
            </div>
          }
        </div>
      </mat-card-content>

      <mat-card-actions align="end">
        <button mat-icon-button
                [matTooltip]="task.status === 'done' ? 'Mark as todo' : 'Mark as done'"
                [attr.aria-label]="task.status === 'done' ? 'Mark as todo' : 'Mark as done'"
                (click)="toggleStatus.emit(task)"
                [disabled]="isLockedByOther">
          <mat-icon>{{ task.status === 'done' ? 'undo' : 'check_circle' }}</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Edit" aria-label="Edit task"
                (click)="edit.emit(task)"
                [disabled]="isLockedByOther">
          <mat-icon>edit</mat-icon>
        </button>
        <button mat-icon-button matTooltip="Delete" aria-label="Delete task" color="warn"
                (click)="delete.emit(task)"
                [disabled]="isLockedByOther">
          <mat-icon>delete</mat-icon>
        </button>
      </mat-card-actions>
    </mat-card>
  `,
  styles: [`
    .task-card {
      border-radius: 12px;
      transition: box-shadow 0.2s;
    }

    .task-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
    }

    .task-card.overdue {
      border-left: 4px solid #f44336;
    }

    .task-card.done {
      opacity: 0.7;
    }

    .lock-banner {
      display: flex;
      align-items: center;
      gap: 6px;
      background: #fff3e0;
      color: #e65100;
      padding: 6px 12px;
      border-radius: 4px;
      font-size: 12px;
      margin-bottom: 8px;
    }

    .lock-icon {
      font-size: 16px;
      width: 16px;
      height: 16px;
    }

    .task-title {
      font-size: 16px !important;
      line-height: 1.4;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .task-description {
      color: #666;
      font-size: 13px;
      line-height: 1.5;
      margin: 8px 0;
      word-break: break-word;
      overflow-wrap: break-word;
    }

    .task-description-container {
      min-height: 20px;
      padding-top: 6px;
    }

    .chips-row {
      display: flex;
      gap: 8px;
      margin: 12px 0;
      flex-wrap: wrap;
    }

    .priority-chip,
    .status-chip {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 12px;
      font-size: 12px;
      font-weight: 500;
      text-transform: capitalize;
    }

    .priority-critical { background: #ffebee; color: #c62828; }
    .priority-high { background: #fff3e0; color: #e65100; }
    .priority-medium { background: #fffde7; color: #f9a825; }
    .priority-low { background: #f5f5f5; color: #757575; }

    .status-todo { background: #e3f2fd; color: #1565c0; }
    .status-in-progress { background: #e8f5e9; color: #2e7d32; }
    .status-done { background: #f5f5f5; color: #757575; }

    .meta-row {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
      margin-top: 8px;
      min-height: 20px;
    }

    .meta-item {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 12px;
      color: #888;
    }

    .meta-icon {
      font-size: 14px;
      width: 14px;
      height: 14px;
    }

    .overdue-text {
      color: #f44336;
    }
  `],
})
export class TaskCardComponent {
  @Input({ required: true }) task!: Task;
  @Input() currentUserId = '';

  @Output() edit = new EventEmitter<Task>();
  @Output() delete = new EventEmitter<Task>();
  @Output() toggleStatus = new EventEmitter<Task>();

  get isOverdue(): boolean {
    if (!this.task.dueDate || this.task.status === 'done') { 
      return false;
    }
    return new Date(this.task.dueDate) < new Date();
  }

  get isLockedByOther(): boolean {
    return !!this.task.lockedBy && this.task.lockedBy._id !== this.currentUserId;
  }

  get statusLabel(): string {
    switch (this.task.status) {
      case 'todo': return 'To Do';
      case 'in-progress': return 'In Progress';
      case 'done': return 'Done';
    }
  }
}
