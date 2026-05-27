import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
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
    MatTooltipModule,
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

          <div class="sort-controls">
            <mat-form-field appearance="outline" class="filter-field">
              <mat-label>Sort by</mat-label>
              <mat-select [(ngModel)]="sortBy">
                <mat-option value="status">Status</mat-option>
                <mat-option value="priority">Priority</mat-option>
                <mat-option value="assignee">Assignee</mat-option>
                <mat-option value="dueDate">Due Date</mat-option>
                <mat-option value="createdAt">Created</mat-option>
              </mat-select>
            </mat-form-field>
            @if (sortBy) {
              <button mat-icon-button
                      (click)="toggleSortDirection()"
                      [matTooltip]="sortDirection === 'asc' ? 'Ascending' : 'Descending'"
                      [attr.aria-label]="sortDirection === 'asc' ? 'Sort ascending' : 'Sort descending'"
                      class="sort-direction-btn">
                <mat-icon>{{ sortDirection === 'asc' ? 'arrow_upward' : 'arrow_downward' }}</mat-icon>
              </button>
            }
          </div>
        </div>
      </div>

      @if (loading) {
        <div class="loading-state">
          <mat-spinner diameter="48"></mat-spinner>
        </div>
      } @else if (sortedTasks.length === 0) {
        <div class="empty-state">
          <mat-icon class="empty-icon">assignment</mat-icon>
          <p>No tasks yet. Create your first task!</p>
        </div>
      } @else {
        <div class="task-grid">
          @for (task of sortedTasks; track task._id) {
            <app-task-card
              [task]="task"
              [currentUserId]="currentUserId"
              (edit)="onEditTask($event)"
              (delete)="onDeleteTask($event)"
              (toggleStatus)="onToggleStatus($event)" />
          }
        </div>
      }

      @if (totalPages > 1) {
        <div class="pagination-bar">
          <div class="page-size-select">
            <span>Rows per page:</span>
            <mat-form-field appearance="outline" class="page-size-field">
              <mat-select [(ngModel)]="pageSize" (selectionChange)="onPageSizeChange()">
                <mat-option [value]="10">10</mat-option>
                <mat-option [value]="20">20</mat-option>
                <mat-option [value]="50">50</mat-option>
              </mat-select>
            </mat-form-field>
          </div>

          <div class="page-buttons">
            <button mat-icon-button
                    (click)="goToPage(0)"
                    [disabled]="page === 0"
                    aria-label="First page">
              <mat-icon>first_page</mat-icon>
            </button>
            <button mat-icon-button
                    (click)="goToPage(page - 1)"
                    [disabled]="page === 0"
                    aria-label="Previous page">
              <mat-icon>chevron_left</mat-icon>
            </button>

            @for (p of visiblePages; track p) {
              @if (p === -1) {
                <span class="ellipsis">...</span>
              } @else {
                <button mat-mini-fab
                        [color]="p === page ? 'primary' : ''"
                        (click)="goToPage(p)"
                        [attr.aria-label]="'Page ' + (p + 1)"
                        class="page-num-btn">
                  {{ p + 1 }}
                </button>
              }
            }

            <button mat-icon-button
                    (click)="goToPage(page + 1)"
                    [disabled]="page >= totalPages - 1"
                    aria-label="Next page">
              <mat-icon>chevron_right</mat-icon>
            </button>
            <button mat-icon-button
                    (click)="goToPage(totalPages - 1)"
                    [disabled]="page >= totalPages - 1"
                    aria-label="Last page">
              <mat-icon>last_page</mat-icon>
            </button>
          </div>

          <span class="page-range">
            {{ page * pageSize + 1 }}–{{ Math.min((page + 1) * pageSize, totalCount) }} of {{ totalCount }}
          </span>
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

    .sort-controls {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .sort-direction-btn {
      margin-top: -8px;
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

    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 16px;
      margin-top: 24px;
      padding: 12px 16px;
      background: #fafafa;
      border-radius: 8px;
      flex-wrap: wrap;
    }

    .page-size-select {
      display: flex;
      align-items: center;
      gap: 8px;
      font-size: 13px;
      color: #666;
    }

    .page-size-field {
      width: 70px;
    }

    .page-size-field ::ng-deep .mat-mdc-form-field-subscript-wrapper {
      display: none;
    }

    .page-buttons {
      display: flex;
      align-items: center;
      gap: 4px;
    }

    .page-num-btn {
      width: 36px !important;
      height: 36px !important;
      font-size: 13px;
      box-shadow: none !important;
    }

    .ellipsis {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      width: 36px;
      height: 36px;
      font-size: 14px;
      color: #999;
      user-select: none;
    }

    .page-range {
      font-size: 13px;
      color: #666;
      white-space: nowrap;
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
  private route = inject(ActivatedRoute);
  private router = inject(Router);
  private dialog = inject(MatDialog);
  private snackBar = inject(MatSnackBar);

  tasks: Task[] = [];
  users: User[] = [];
  currentUserId = '';
  filterStatus = '';
  filterPriority = '';
  filterAssignee = '';
  sortBy = 'createdAt';
  sortDirection: 'asc' | 'desc' = 'desc';
  page = 0;
  pageSize = 20;
  totalCount = 0;
  Math = Math;
  loading = false;
  socketStatus: SocketStatus = 'idle';
  private subs: Subscription[] = [];

  // Numeric rank maps for sorting — higher numbers = higher severity/progress.
  // Used by sortedTasks to compare items without repeated string comparisons.
  private static readonly PRIORITY_ORDER: Record<string, number> = {
    critical: 4, high: 3, medium: 2, low: 1,
  };

  private static readonly STATUS_ORDER: Record<string, number> = {
    'todo': 1, 'in-progress': 2, 'done': 3,
  };

  ngOnInit(): void {
    const user = this.authService.getCurrentUser();
    this.currentUserId = user?._id ?? '';

    // Restore page from URL query param (1-indexed in URL, 0-indexed internally)
    const pageParam = parseInt(this.route.snapshot.queryParams['page'], 10);
    if (pageParam > 1) {
      this.page = pageParam - 1;
    }

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
      this.taskService.getTotalCount().subscribe(total => {
        this.totalCount = total;
        // Clamp page if the URL had a page beyond the actual last page
        const maxPage = Math.max(0, Math.ceil(total / this.pageSize) - 1);
        if (this.page > maxPage && total > 0) {
          this.page = maxPage;
          this.syncPageToUrl();
          this.taskService.loadTasks(this.currentFilters, this.page + 1, this.pageSize);
        }
      }),
      this.socketService.socketStatus$.subscribe(status => {
        this.socketStatus = status;
        if (status === 'reconnecting') {
          this.snackBar.open('Connection lost, reconnecting...', 'Dismiss', { duration: 5000 });
        }
      }),
      // pairwise() lets us detect the specific transition from reconnecting -> connected,
      // which is when we need to re-fetch tasks (the server may have changed during the outage)
      this.socketService.socketStatus$.pipe(pairwise()).subscribe(([prev, curr]) => {
        if (prev === 'reconnecting' && curr === 'connected') {
          this.snackBar.open('Connection restored', 'Dismiss', { duration: 3000 });
          this.taskService.loadTasks(this.currentFilters, this.page + 1, this.pageSize);
        }
      }),
    );

    this.userService.getUsers().subscribe(users => {
      this.users = users;
    });

    this.taskService.loadTasks(undefined, this.page + 1, this.pageSize);
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

  /**
   * Client-side sort applied on top of the (already server-filtered) task list.
   * Returns a shallow copy to avoid mutating the original array.
   *
   * - priority / status: uses numeric rank maps so "critical" > "high" etc.
   * - assignee: alphabetical by display name; unassigned tasks sort to the top
   * - dueDate: epoch comparison; tasks without a due date sort to the top (0)
   * - createdAt: epoch comparison (always present)
   *
   * `dir` flips the comparison result for ascending vs descending.
   */
  get sortedTasks(): Task[] {
    if (!this.sortBy) {
      return this.tasks;
    }

    const dir = this.sortDirection === 'asc' ? 1 : -1;

    return [...this.tasks].sort((a, b) => {
      switch (this.sortBy) {
        case 'priority':
          return (TaskListComponent.PRIORITY_ORDER[a.priority] - TaskListComponent.PRIORITY_ORDER[b.priority]) * dir;
        case 'status':
          return (TaskListComponent.STATUS_ORDER[a.status] - TaskListComponent.STATUS_ORDER[b.status]) * dir;
        case 'assignee': {
          const nameA = a.assignee?.displayName?.toLowerCase() ?? '';
          const nameB = b.assignee?.displayName?.toLowerCase() ?? '';
          return nameA.localeCompare(nameB) * dir;
        }
        case 'dueDate': {
          const dateA = a.dueDate ? new Date(a.dueDate).getTime() : 0;
          const dateB = b.dueDate ? new Date(b.dueDate).getTime() : 0;
          return (dateA - dateB) * dir;
        }
        case 'createdAt': {
          const createdA = new Date(a.createdAt).getTime();
          const createdB = new Date(b.createdAt).getTime();
          return (createdA - createdB) * dir;
        }
        default:
          return 0;
      }
    });
  }

  toggleSortDirection(): void {
    this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
  }

  get totalPages(): number {
    return Math.ceil(this.totalCount / this.pageSize) || 1;
  }

  /**
   * Builds the array of page indices to render as buttons.
   * Shows up to 5 pages around the current page with ellipsis (-1) for gaps.
   * Example for page 10 of 25: [0, -1, 9, 10, 11, -1, 24]
   */
  get visiblePages(): number[] {
    const total = this.totalPages;
    if (total <= 7) {
      return Array.from({ length: total }, (_, i) => i);
    }

    const pages: number[] = [];
    const current = this.page;

    pages.push(0);
    if (current > 2) {
      pages.push(-1);
    }

    const start = Math.max(1, current - 1);
    const end = Math.min(total - 2, current + 1);
    for (let i = start; i <= end; i++) {
      pages.push(i);
    }

    if (current < total - 3) {
      pages.push(-1);
    }
    pages.push(total - 1);

    return pages;
  }

  goToPage(pageIndex: number): void {
    if (pageIndex < 0 || pageIndex >= this.totalPages || pageIndex === this.page) {
      return;
    }
    this.page = pageIndex;
    this.syncPageToUrl();
    this.taskService.loadTasks(this.currentFilters, this.page + 1, this.pageSize);
  }

  onPageSizeChange(): void {
    this.page = 0;
    this.syncPageToUrl();
    this.taskService.loadTasks(this.currentFilters, 1, this.pageSize);
  }

  onFilter(): void {
    this.page = 0;
    this.syncPageToUrl();
    this.taskService.loadTasks(this.currentFilters, 1, this.pageSize);
  }

  // Keeps the URL in sync with the current page (1-indexed).
  // Page 1 removes the param for a cleaner default URL.
  private syncPageToUrl(): void {
    const page = this.page > 0 ? (this.page + 1).toString() : null;
    this.router.navigate([], {
      relativeTo: this.route,
      queryParams: { page },
      queryParamsHandling: 'merge',
      replaceUrl: true,
    });
  }

  onAddTask(): void {
    const dialogRef = this.dialog.open(TaskDialogComponent, {
      width: '520px',
      data: { mode: 'create' } as TaskDialogData,
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.snackBar.open('Task created', 'Dismiss', { duration: 3000 });
        // Reload tasks after creation to update the UI
        this.taskService.loadTasks(this.currentFilters, this.page + 1, this.pageSize);
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
            // Reload tasks after deletion to update the UI
            this.taskService.loadTasks(this.currentFilters, this.page + 1, this.pageSize);
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
