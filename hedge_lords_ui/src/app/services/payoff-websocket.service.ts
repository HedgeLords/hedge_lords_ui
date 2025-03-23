import { Injectable, OnDestroy } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject, Subscription } from 'rxjs';
import { PositionSelection } from './position.service';

@Injectable({
  providedIn: 'root',
})
export class PayoffWebsocketService implements OnDestroy {
  // ✅ Updated service name
  private socket$: WebSocketSubject<any> | null = null;
  private payoffData = new BehaviorSubject<{ x: number[]; y: number[] } | null>(
    null
  );
  public payoffData$ = this.payoffData.asObservable();

  private selectedContracts: Set<string> = new Set();
  private subscription: Subscription = new Subscription();

  private readonly WEBSOCKET_URL = 'ws://localhost:8001/stream/trading';

  constructor() {
    this.connect();
  }

  private formatExpiryDate(dateStr: string): string {
    // Convert YYYY-MM-DD to DDMMYY
    const [year, month, day] = dateStr.split('-');
    return `${day}${month}${year.slice(-2)}`; // Take last 2 digits of year
  }

  private connect(): void {
    this.socket$ = webSocket(this.WEBSOCKET_URL);

    this.subscription.add(
      this.socket$.subscribe({
        next: (msg) => {
          if (msg.type === 'payoff_update') {
            this.payoffData.next(msg.data);
          }
        },
        error: (err) => {
          console.error('WebSocket error:', err);
        },
        complete: () => {
          console.warn('WebSocket connection closed.');
        },
      })
    );
  }

  public selectContract(position: PositionSelection, action: 'buy' | 'sell'): void {
    // Format the symbol correctly: [C/P]-[CURRENCY]-[STRIKE]-[EXPIRATION]
    const optionType = position.type === 'call' ? 'C' : 'P';
    const formattedExpiry = this.formatExpiryDate(position.expirationDate);
    const formattedSymbol = `${optionType}-${position.underlying}-${position.strikePrice}-${formattedExpiry}`;
    
    const message = {
      type: 'select_contract',
      symbol: formattedSymbol,
      position: action,
    };
    
    console.log('Sending message to WebSocket:', message);
    
    if (this.socket$) {
      this.socket$.next(message);
      this.selectedContracts.add(formattedSymbol);
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
      console.log('Sending message to WebSocket:', message);
      this.socket$.next(message);
      this.selectedContracts.delete(formattedSymbol);
    }
  }

  ngOnDestroy(): void {
    this.subscription.unsubscribe();
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }
}
