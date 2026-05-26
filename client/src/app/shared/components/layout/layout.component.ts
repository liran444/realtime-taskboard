import { Component, inject } from '@angular/core';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-layout',
  standalone: true,
  imports: [MatToolbarModule, MatButtonModule, MatIconModule],
  template: `
    <mat-toolbar color="primary" class="app-toolbar">
      <span class="app-title">Taskboard</span>
      <span class="spacer"></span>
      @if (user) {
        <span class="user-name">{{ user.displayName }}</span>
      }
      <button mat-icon-button (click)="onLogout()" aria-label="Logout">
        <mat-icon>logout</mat-icon>
      </button>
    </mat-toolbar>
    <main class="main-content">
      <ng-content></ng-content>
    </main>
  `,
  styles: [`
    .app-toolbar {
      position: sticky;
      top: 0;
      z-index: 100;
    }

    .app-title {
      font-size: 20px;
      font-weight: 500;
    }

    .spacer {
      flex: 1;
    }

    .user-name {
      margin-right: 8px;
      font-size: 14px;
      opacity: 0.9;
    }

    .main-content {
      padding: 24px;
      max-width: 1200px;
      margin: 0 auto;
    }
  `],
})
export class LayoutComponent {
  private authService = inject(AuthService);

  get user() {
    return this.authService.getCurrentUser();
  }

  onLogout(): void {
    this.authService.logout();
  }
}
