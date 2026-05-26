import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { Task, TaskStatus, TaskPriority } from '../../models/task.model';
import { User } from '../../models/user.model';
import { TaskService } from '../../core/services/task.service';
import { UserService } from '../../core/services/user.service';

export interface TaskDialogData {
  mode: 'create' | 'edit';
  task?: Task;
}

@Component({
  selector: 'app-task-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDatepickerModule,
    MatButtonModule,
    MatSnackBarModule,
  ],
  template: `
    <h2 mat-dialog-title>{{ data.mode === 'create' ? 'New Task' : 'Edit Task' }}</h2>

    <mat-dialog-content>
      <form [formGroup]="form" class="dialog-form">
        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Title</mat-label>
          <input matInput formControlName="title">
          @if (form.controls.title.hasError('required') && form.controls.title.touched) {
            <mat-error>Title is required</mat-error>
          }
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Description</mat-label>
          <textarea matInput formControlName="description" rows="3"></textarea>
        </mat-form-field>

        <div class="row">
          <mat-form-field appearance="outline">
            <mat-label>Priority</mat-label>
            <mat-select formControlName="priority">
              @for (p of priorities; track p) {
                <mat-option [value]="p">{{ p | titlecase }}</mat-option>
              }
            </mat-select>
          </mat-form-field>

          <mat-form-field appearance="outline">
            <mat-label>Status</mat-label>
            <mat-select formControlName="status">
              @for (s of statuses; track s) {
                <mat-option [value]="s">{{ statusLabel(s) }}</mat-option>
              }
            </mat-select>
          </mat-form-field>
        </div>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Due Date</mat-label>
          <input matInput [matDatepicker]="picker" formControlName="dueDate">
          <mat-datepicker-toggle matSuffix [for]="picker"></mat-datepicker-toggle>
          <mat-datepicker #picker></mat-datepicker>
        </mat-form-field>

        <mat-form-field appearance="outline" class="full-width">
          <mat-label>Assignee</mat-label>
          <mat-select formControlName="assignee">
            <mat-option value="">Unassigned</mat-option>
            @for (user of users; track user._id) {
              <mat-option [value]="user._id">{{ user.displayName }}</mat-option>
            }
          </mat-select>
        </mat-form-field>
      </form>
    </mat-dialog-content>

    <mat-dialog-actions align="end">
      <button mat-button (click)="onCancel()">Cancel</button>
      <button mat-raised-button color="primary" (click)="onSave()" [disabled]="form.invalid || saving">
        {{ saving ? 'Saving...' : (data.mode === 'create' ? 'Create' : 'Save') }}
      </button>
    </mat-dialog-actions>
  `,
  styles: [`
    .dialog-form {
      display: flex;
      flex-direction: column;
      min-width: 400px;
      padding-top: 4px;
    }

    .full-width {
      width: 100%;
    }

    .row {
      display: flex;
      gap: 16px;
    }

    .row mat-form-field {
      flex: 1;
    }

    @media (max-width: 600px) {
      .dialog-form {
        min-width: unset;
      }
      .row {
        flex-direction: column;
        gap: 0;
      }
    }
  `],
})
export class TaskDialogComponent implements OnInit, OnDestroy {
  private fb = inject(FormBuilder);
  private taskService = inject(TaskService);
  private userService = inject(UserService);
  private dialogRef = inject(MatDialogRef<TaskDialogComponent>);
  private snackBar = inject(MatSnackBar);
  data: TaskDialogData = inject(MAT_DIALOG_DATA);

  statuses: TaskStatus[] = ['todo', 'in-progress', 'done'];
  priorities: TaskPriority[] = ['low', 'medium', 'high', 'critical'];
  users: User[] = [];
  saving = false;

  form = this.fb.nonNullable.group({
    title: [this.data.task?.title ?? '', [Validators.required]],
    description: [this.data.task?.description ?? ''],
    priority: [this.data.task?.priority ?? 'medium' as TaskPriority],
    status: [this.data.task?.status ?? 'todo' as TaskStatus],
    dueDate: [this.data.task?.dueDate ? new Date(this.data.task.dueDate) : null as Date | null],
    assignee: [this.data.task?.assignee?._id ?? ''],
  });

  constructor() {
    if (this.data.mode === 'edit' && this.data.task) {
      this.taskService.lockTask(this.data.task._id);
    }
  }

  ngOnInit(): void {
    this.userService.getUsers().subscribe(users => {
      this.users = users;
    });
  }

  statusLabel(s: TaskStatus): string {
    switch (s) {
      case 'todo': return 'To Do';
      case 'in-progress': return 'In Progress';
      case 'done': return 'Done';
    }
  }

  onSave(): void {
    if (this.form.invalid) {
      return;
    }
    this.saving = true;

    const raw = this.form.getRawValue();
    const payload: Record<string, any> = {
      title: raw.title,
      description: raw.description,
      priority: raw.priority,
      status: raw.status,
      dueDate: raw.dueDate?.toISOString(),
    };

    if (raw.assignee) {
      payload['assignee'] = raw.assignee;
    } else {
      payload['assignee'] = null;
    }

    const op = this.data.mode === 'create'
      ? this.taskService.createTask(payload as any)
      : this.taskService.updateTask(this.data.task!._id, payload as any);

    op.subscribe({
      next: () => this.dialogRef.close(true),
      error: (err) => {
        this.saving = false;
        const message = err.error?.error || 'An error occurred';
        this.snackBar.open(message, 'Dismiss', { duration: 4000 });
      },
    });
  }

  onCancel(): void {
    this.dialogRef.close(false);
  }

  ngOnDestroy(): void {
    if (this.data.mode === 'edit' && this.data.task) {
      this.taskService.unlockTask(this.data.task._id);
    }
  }
}
