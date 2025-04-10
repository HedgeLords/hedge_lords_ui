import { Injectable, OnDestroy } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { PositionSelection } from './position.service';
import { HttpClient } from '@angular/common/http';

// Define the message types for type safety
export interface PayoffMessage {
  type: string;
  timestamp?: number;
  data?: {
    x: number[];
    y: number[];
  };
  selected_contracts?: Record<string, string>;
  price_range_percentage?: number;
}

@Injectable({
  providedIn: 'root',
})
export class PayoffWebsocketService {
  private readonly API_URL = 'http://localhost:8001/stream/get-graph';

  public payoffDataSubject = new BehaviorSubject<{ x: number[]; y: number[] }>({
    x: [],
    y: [],
  });

  public payoffData$ = this.payoffDataSubject.asObservable();

  constructor(private http: HttpClient) {}

  public refreshPayoffData(): void {
    this.http.post<PayoffMessage>(this.API_URL,{}).subscribe({
     next: (response) => {
        if (response.type === 'payoff_update' && response.data) {
          this.payoffDataSubject.next({
            x: response.data.x,
            y: response.data.y,
          });
        } else {
          console.warn('Unexpected response format:', response);
        }
      },
      error: (err) => {
        console.error('Error fetching payoff data:', err);
      },
    });
  }
}