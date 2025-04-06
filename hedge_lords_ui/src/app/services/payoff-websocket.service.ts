import { Injectable, OnDestroy } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Observable } from 'rxjs';
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
export class PayoffWebsocketService implements OnDestroy {
  // WebSocket connection
  private socket$: WebSocketSubject<any> | null = null;

  // Private BehaviorSubjects
  public payoffDataSubject = new BehaviorSubject<{ x: number[]; y: number[] }>(
    { x: [], y: [] }
  );
  public payoffData$ = this.payoffDataSubject.asObservable();

  // Selected contracts tracking
  private selectedContracts: Set<string> = new Set();

  // WebSocket URL
  private readonly WEBSOCKET_URL = 'ws://localhost:8001/stream/trading';

  constructor() {
    this.connect();
  }

  /**
   * Returns payoff data as an Observable
   */
  public getPayoffData(): Observable<{ x: number[]; y: number[] }> {
    return this.payoffDataSubject.asObservable();
  }

  /**
   * Format expiry date from YYYY-MM-DD to DDMMYY
   */
  private formatExpiryDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}${month}${year.slice(-2)}`;
  }

  /**
   * Connect to the WebSocket server
   */
  private connect(): void {
    // Create WebSocket connection
    this.socket$ = webSocket(this.WEBSOCKET_URL);

    // Subscribe to WebSocket messages
    this.socket$.subscribe({
      next: (msg: PayoffMessage) => {
        // Process message based on type
        switch (msg.type) {
          case 'payoff_update':
            if (msg.data) {
              this.payoffDataSubject.next(msg.data);
            }
            // console.log('updated data', this.payoffDataSubject.value);
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
      error: (err) => {
        console.error('WebSocket error:', err);

        // Attempt to reconnect after a delay
        setTimeout(() => this.connect(), 5000);
      },
      complete: () => {
        console.warn('WebSocket connection closed');

        // Attempt to reconnect after a delay
        setTimeout(() => this.connect(), 5000);
      },
    });
  }

  /**
   * Handle incoming WebSocket messages
   */
  private handleMessage(msg: PayoffMessage): void {}

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
    const message = {
      type: 'request_update',
      timestamp: Date.now(),
    };

    this.sendMessage(message);
  }

  /**
   * Send a message to the WebSocket server
   */
  private sendMessage(message: any): void {
    if (this.socket$) {
      this.socket$.next(message);
    } else {
      console.error('WebSocket not connected. Cannot send message.');
    }
  }

  /**
   * Clean up resources when the service is destroyed
   */
  ngOnDestroy(): void {
    // Close WebSocket connection
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }
}
