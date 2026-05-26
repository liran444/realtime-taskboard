import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { User, ApiResponse } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private users$?: Observable<User[]>;

  /**
   * Lazily fetches the user list and caches the result via shareReplay(1).
   * The user list rarely changes within a session, so a single HTTP call
   * is shared across all components that need it (task dialog, filters, etc.).
   */
  getUsers(): Observable<User[]> {
    if (!this.users$) {
      this.users$ = this.http.get<ApiResponse<User[]>>('/api/users').pipe(
        map(res => res.data),
        shareReplay(1),
      );
    }
    return this.users$;
  }

  clearCache(): void {
    this.users$ = undefined;
  }
}
