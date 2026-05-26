import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { io, Socket } from 'socket.io-client';

/**
 * Single enum tracks the connection lifecycle:
 * - idle: no connection attempted (pre-login or after explicit disconnect)
 * - connected: socket is active and communicating
 * - reconnecting: transport dropped, Socket.IO is auto-retrying
 */
export type SocketStatus = 'idle' | 'connected' | 'reconnecting';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private ngZone = inject(NgZone);
  private socket: Socket | null = null;

  private status$ = new BehaviorSubject<SocketStatus>('idle');

  get socketStatus$(): Observable<SocketStatus> {
    return this.status$.asObservable();
  }

  connect(token: string): void {
    if (this.socket?.connected) {
      return;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }


    // Create the socket outside Angular's zone so that Socket.IO's internal
    // timers and polling don't trigger unnecessary change detection cycles
    this.socket = this.ngZone.runOutsideAngular(() =>
      io({
        auth: { token },
        transports: ['websocket', 'polling'],
        reconnection: true,
        reconnectionAttempts: Infinity,
        reconnectionDelay: 1000,
        reconnectionDelayMax: 5000,
      })
    );

    this.socket.on('connect', () => {
      this.ngZone.run(() => this.status$.next('connected'));
    });

    this.socket.on('disconnect', () => {
      this.ngZone.run(() => this.status$.next('reconnecting'));
    });

    this.socket.on('reconnect', () => {
      this.ngZone.run(() => this.status$.next('connected'));
    });
  }

  disconnect(): void {
    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
      this.socket = null;
    }
    this.status$.next('idle');
  }

  /**
   * Wraps a Socket.IO event as an Observable. Events are re-entered into
   * Angular's zone so subscribers can safely update component state.
   * The teardown function unregisters the listener to prevent memory leaks.
   */
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
