import { Injectable } from '@angular/core';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';
import { BehaviorSubject, Observable, Subject, timer } from 'rxjs';
import { retry, takeUntil } from 'rxjs/operators';

export interface TrainingUpdate {
  id: number;
  serviceId: number;
  startTime: string;
  currentParticipants: string[];
  booked: number;
  totalParticipants: number;
}

@Injectable({
  providedIn: 'root'
})
export class WebSocketService {
  private socket$: WebSocketSubject<any> | null = null;
  private destroy$ = new Subject<void>();
  private trainingUpdates$ = new BehaviorSubject<TrainingUpdate[]>([]);
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 5;
  private isConnected$ = new BehaviorSubject<boolean>(false);

  constructor() {
    this.connect();
  }

  private connect() {
    if (!this.socket$ || this.socket$.closed) {
      this.socket$ = webSocket({
        url: 'wss://kstudio-websocket-production.up.railway.app',
        openObserver: {
          next: () => {
            console.log('WebSocket connected');
            this.reconnectAttempts = 0;
            this.isConnected$.next(true);
          }
        },
        closeObserver: {
          next: () => {
            console.log('WebSocket disconnected');
            this.isConnected$.next(false);
            this.reconnect();
          }
        }
      });

      this.socket$.pipe(
        retry({
          delay: (error, retryCount) => {
            if (retryCount < this.maxReconnectAttempts) {
              const backoffTime = Math.min(1000 * Math.pow(2, retryCount), 10000);
              console.log(`Retrying connection in ${backoffTime}ms`);
              return timer(backoffTime);
            }
            throw error;
          }
        }),
        takeUntil(this.destroy$)
      ).subscribe({
        next: (message) => this.handleMessage(message),
        error: (error) => console.error('WebSocket error:', error)
      });
    }
  }

  private handleMessage(message: any) {
    if (message.action === 'newEnrollment') {
      const update: TrainingUpdate = {
        id: message.data.enrollmentId,
        serviceId: message.data.trainingId,
        startTime: message.data.startTime,
        currentParticipants: message.data.currentParticipants || [],
        booked: message.data.booked,
        totalParticipants: message.data.totalParticipants
      };

      const currentUpdates = this.trainingUpdates$.value;
      const updatedTrainings = [...currentUpdates];
      const existingIndex = updatedTrainings.findIndex(t => t.id === update.id);

      if (existingIndex >= 0) {
        updatedTrainings[existingIndex] = update;
      } else {
        updatedTrainings.push(update);
      }

      this.trainingUpdates$.next(updatedTrainings);
    }
  }

  private reconnect() {
    if (this.reconnectAttempts < this.maxReconnectAttempts) {
      this.reconnectAttempts++;
      const backoffTime = Math.min(1000 * Math.pow(2, this.reconnectAttempts), 10000);
      console.log(`Reconnecting in ${backoffTime}ms (attempt ${this.reconnectAttempts})`);
      
      setTimeout(() => this.connect(), backoffTime);
    }
  }

  getTrainingUpdates(): Observable<TrainingUpdate[]> {
    return this.trainingUpdates$.asObservable();
  }

  getConnectionStatus(): Observable<boolean> {
    return this.isConnected$.asObservable();
  }

  sendMessage(action: string, payload: any) {
    if (this.socket$ && this.isConnected$.value) {
      this.socket$.next({ action, ...payload });
    }
  }

  closeConnection() {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }
}