import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, map, shareReplay } from 'rxjs';
import { User, ApiResponse } from '../../models/user.model';

@Injectable({ providedIn: 'root' })
export class UserService {
  private http = inject(HttpClient);
  private users$?: Observable<User[]>;

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
