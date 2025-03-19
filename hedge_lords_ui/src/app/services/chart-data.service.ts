import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { ChartData } from '../models/chart-data.model';

@Injectable({
  providedIn: 'root',
})
export class ChartDataService {
  private socket$: WebSocketSubject<any>;
  private chartData$ = new BehaviorSubject<ChartData>({
    type: '',
    timestamp: 0,
    data: { x: [], y: [] },
    selected_contracts: [],
  });

  constructor() {
    this.socket$ = webSocket('ws://localhost:8001/stream/trading');

    this.socket$.subscribe({
      next: (message: ChartData) => {
        if (message.type === 'payoff_update') {
          this.chartData$.next(message);
        }
      },
      error: (err: any) => console.error('WebSocket error:', err),
      complete: () => console.warn('WebSocket connection closed.'),
    });
  }

  public get chartData(): Observable<ChartData> {
    return this.chartData$.asObservable();
  }

  public selectContract(symbol: string, position: 'buy' | 'sell'): void {
    this.socket$.next({
      type: 'select_contract',
      symbol: symbol,
      position: position,
    });
  }

  public deselectContract(symbol: string): void {
    this.socket$.next({
      type: 'deselect_contract',
      symbol: symbol,
    });
  }

  public setPriceRange(rangePercentage: number): void {
    this.socket$.next({
      type: 'set_price_range',
      percentage: rangePercentage,
    });
  }

  public setLotSize(lotSize: number): void {
    this.socket$.next({ type: 'set_lot_size', lot_size: lotSize });
  }

  public clearSelection(): void {
    this.socket$.next({ type: 'clear_selection' });
  }
}
