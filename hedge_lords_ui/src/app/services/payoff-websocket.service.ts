import { Injectable, OnDestroy } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Observable, map } from 'rxjs';
import { PositionSelection } from './position.service';

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
  // WebSocket connection with proper initialization
  private socket$: WebSocketSubject<any> | null = null;

  // Connection status
  private isConnected = false;

  // Private BehaviorSubjects
  public payoffDataSubject = new BehaviorSubject<{ x: number[]; y: number[] }>({
    x: [],
    y: [],
  });
  private payoffX$ = new BehaviorSubject<any[]>([]);
  private payoffY$ = new BehaviorSubject<any[]>([]);

  public payoffData$ = this.payoffDataSubject.asObservable();

  // Selected contracts tracking
  private selectedContracts: Set<string> = new Set();

  // WebSocket URL
  private readonly WEBSOCKET_URL = 'ws://localhost:8001/stream/trading';

  constructor() {
    // Don't establish connection in constructor
    // Observables dont work in constructor
  }

  /**
   * Connect to the WebSocket server
   * This function can be called from the component
   */
  public connect(): void {
    if (this.isConnected) {
      console.log('WebSocket already connected');
      return;
    }

    console.log('Establishing WebSocket connection...');
    this.socket$ = webSocket(this.WEBSOCKET_URL);
    this.isConnected = true;

    // Subscribe to WebSocket messages
    this.socket$.subscribe({
      next: (msg: PayoffMessage) => {
        console.log('WebSocket message received:', msg);
        // Process message based on type
        switch (msg.type) {
          case 'payoff_update':
            if (msg.data) {
              // Create new objects to ensure emission
              const newData = {
                x: [...msg.data.x],
                y: [...msg.data.y],
              };
              this.payoffDataSubject.next(newData);
              this.payoffX$.next(msg.data.x);
              this.payoffY$.next(msg.data.y);
              // console.log('Updated data:', this.payoffDataSubject.value);
            }
            break;

          case 'confirmation':
            console.log('Received confirmation:', {
              selected_contracts: msg.selected_contracts,
              price_range_percentage: msg.price_range_percentage,
            });
            break;

          default:
            console.warn('Received unexpected message type:', msg.type);
        }
      },
      error: (err: any) => {
        console.error('WebSocket error:', err);
        this.isConnected = false;
      },
      complete: () => {
        console.warn('WebSocket connection closed.');
        this.isConnected = false;
      },
    });
  }

  /**
   * Returns payoff data as an Observable
   */
  public getPayoffData(): Observable<{ x: number[]; y: number[] }> {
    return this.payoffDataSubject.asObservable();
  }

  getPayoffX(): Observable<number[]> {
    return this.payoffData$.pipe(map((data) => data.x));
  }

  getPayoffY(): Observable<number[]> {
    return this.payoffData$.pipe(map((data) => data.y));
  }

  /**
   * Format expiry date from YYYY-MM-DD to DDMMYY
   */
  private formatExpiryDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}${month}${year.slice(-2)}`;
  }

  /**
   * Select a contract for payoff calculation
   */
  public selectContract(
    position: PositionSelection,
    action: 'buy' | 'sell'
  ): void {
    const optionType = position.type === 'call' ? 'C' : 'P';
    const formattedExpiry = this.formatExpiryDate(position.expirationDate);
    const formattedSymbol = `${optionType}-${position.underlying}-${position.strikePrice}-${formattedExpiry}`;

    const message = {
      type: 'select_contract',
      symbol: formattedSymbol,
      position: action,
    };

    this.sendMessage(message);
    this.selectedContracts.add(formattedSymbol);
  }

  /**
   * Deselect a contract from payoff calculation
   */
  public deselectContract(position: PositionSelection): void {
    const optionType = position.type === 'call' ? 'C' : 'P';
    const formattedExpiry = this.formatExpiryDate(position.expirationDate);
    const formattedSymbol = `${optionType}-${position.underlying}-${position.strikePrice}-${formattedExpiry}`;

    const message = {
      type: 'deselect_contract',
      symbol: formattedSymbol,
    };

    this.sendMessage(message);
    this.selectedContracts.delete(formattedSymbol);
  }

  /**
   * Request new payoff data from the server
   */
  public requestNewData(): void {
    if (!this.isConnected) {
      console.warn('WebSocket not connected. Cannot request data.');
      return;
    }

    const message = {
      type: 'request_update',
      timestamp: Date.now(),
    };

    this.sendMessage(message);
    console.log('New data requested from server');
  }

  /**
   * Send a message to the WebSocket server
   */
  private sendMessage(message: any): void {
    if (this.socket$ && this.isConnected) {
      this.socket$.next(message);
    } else {
      console.error('WebSocket not connected. Cannot send message.');
    }
  }

  /**
   * Disconnect from the WebSocket server
   */
  public disconnect(): void {
    if (this.socket$ && this.isConnected) {
      this.socket$.complete();
      this.socket$ = null;
      this.isConnected = false;
      console.log('WebSocket connection closed.');
    }
  }
}
