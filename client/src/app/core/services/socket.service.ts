import { Injectable, NgZone, inject } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import type { Socket } from 'socket.io-client';

export type SocketStatus = 'idle' | 'connected' | 'reconnecting';

@Injectable({ providedIn: 'root' })
export class SocketService {
  private ngZone = inject(NgZone);
  private socket: Socket | null = null;

  private status$ = new BehaviorSubject<SocketStatus>('idle');

  get socketStatus$(): Observable<SocketStatus> {
    return this.status$.asObservable();
  }

  async connect(token: string): Promise<void> {
    if (this.socket?.connected) {
      return;
    }

    if (this.socket) {
      this.socket.removeAllListeners();
      this.socket.disconnect();
    }

    // Dynamically import socket.io-client to avoid bundling it with the Angular application
    const { io } = await import('socket.io-client');

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
