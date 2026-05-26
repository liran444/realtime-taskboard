import { Injectable, NgZone, inject } from '@angular/core';
import { Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private ngZone = inject(NgZone);
  private socket: Socket | null = null;

  connect(token: string): void {
    if (this.socket?.connected) { 
      return;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    this.socket = this.ngZone.runOutsideAngular(() =>
      io({
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: 10,
        reconnectionDelay: 1000,
      })
    );
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
  }

  on<T>(event: string): Observable<T> {
    return new Observable<T>(subscriber => {
      if (!this.socket) {
        subscriber.complete();
        return;
      }

      const socket = this.socket;
      const handler = (data: T) => {
        this.ngZone.run(() => subscriber.next(data));
      };
      socket.on(event, handler as any);

      return () => {
        socket.off(event, handler as any);
      };
    });
  }

  emit(event: string, data: any): void {
    this.socket?.emit(event, data);
  }

  get isConnected(): boolean {
    return this.socket?.connected ?? false;
  }
}
