import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  { path: '', redirectTo: 'tasks', pathMatch: 'full' },
  {
    path: 'login',
    loadComponent: () =>
      import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'tasks',
    loadComponent: () =>
      import('./features/tasks/task-list.component').then(m => m.TaskListComponent),
    canActivate: [authGuard],
  },
  { path: '**', redirectTo: 'tasks' },
];
