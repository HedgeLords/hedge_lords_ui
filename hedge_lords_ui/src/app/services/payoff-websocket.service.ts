import { Injectable, OnDestroy } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Subscription } from 'rxjs';
import { PositionSelection } from './position.service';

interface PayoffMessage {
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
  private socket$: WebSocketSubject<any> | null = null;
  private payoffData = new BehaviorSubject<{ x: number[]; y: number[] }>({ x: [], y: [] });
  public payoffData$ = this.payoffData.asObservable();

  private selectedContracts: Set<string> = new Set();
  private subscription: Subscription = new Subscription();

  private readonly WEBSOCKET_URL = 'ws://localhost:8001/stream/trading';

  constructor() {
    console.log('PayoffWebsocketService initialized');
    this.connect();
  }

  private formatExpiryDate(dateStr: string): string {
    const [year, month, day] = dateStr.split('-');
    return `${day}${month}${year.slice(-2)}`;
  }

  private connect(): void {
    // console.log('Attempting to connect to WebSocket:', this.WEBSOCKET_URL);
    this.socket$ = webSocket(this.WEBSOCKET_URL);

    this.subscription.add(
      this.socket$.subscribe({
        next: (msg: PayoffMessage) => {
          // console.log('WebSocket message received:', msg);
          
          switch (msg.type) {
            case 'payoff_update':
              if (msg.data) {
                // console.log('Processing payoff update:', msg.data);
                this.payoffData.next(msg.data);
              }
              break;
              
            case 'confirmation':
              console.log('Received confirmation:', {
                selected_contracts: msg.selected_contracts,
                price_range_percentage: msg.price_range_percentage
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
          console.warn('WebSocket connection closed. Attempting to reconnect...');
          setTimeout(() => this.connect(), 5000);
        },
      })
    );
  }

  public selectContract(position: PositionSelection, action: 'buy' | 'sell'): void {
    const optionType = position.type === 'call' ? 'C' : 'P';
    const formattedExpiry = this.formatExpiryDate(position.expirationDate);
    const formattedSymbol = `${optionType}-${position.underlying}-${position.strikePrice}-${formattedExpiry}`;
    
    const message = {
      type: 'select_contract',
      symbol: formattedSymbol,
      position: action,
    };
    
    console.log('Sending contract selection to WebSocket:', message);
    
    if (this.socket$) {
      this.socket$.next(message);
      this.selectedContracts.add(formattedSymbol);
    } else {
      console.error('WebSocket not connected. Cannot send message.');
    }
  }

  public deselectContract(position: PositionSelection): void {
    const optionType = position.type === 'call' ? 'C' : 'P';
    const formattedExpiry = this.formatExpiryDate(position.expirationDate);
    const formattedSymbol = `${optionType}-${position.underlying}-${position.strikePrice}-${formattedExpiry}`;
    
    const message = {
      type: 'deselect_contract',
      symbol: formattedSymbol,
    };
    
    if (this.socket$) {
      console.log('Sending contract deselection to WebSocket:', message);
      this.socket$.next(message);
      this.selectedContracts.delete(formattedSymbol);
    } else {
      console.error('WebSocket not connected. Cannot send message.');
    }
  }

  public requestNewData(): void {
    if (this.socket$) {
      const message = {
        type: 'request_update',
        timestamp: Date.now()
      };
      console.log('Requesting new payoff data:', message);
      this.socket$.next(message);
    } else {
      console.error('WebSocket not connected. Cannot request new data.');
    }
  }

  ngOnDestroy(): void {
    console.log('PayoffWebsocketService destroyed');
    this.subscription.unsubscribe();
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }
}
