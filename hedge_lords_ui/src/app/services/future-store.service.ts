import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { FuturesTicker } from '../models/ticker.model';

@Injectable({
  providedIn: 'root',
})
export class FutureStoreService {
  // BehaviorSubject to hold the latest FuturesTicker (index price data).
  // Initialized to null until the first update arrives.
  private futureTickerSubject = new BehaviorSubject<FuturesTicker | null>(null);

  // Public observable that components can subscribe to.
  public futureTicker$ = this.futureTickerSubject.asObservable();

  /**
   * Updates the stored FuturesTicker data.
   *
   * @param ticker The latest FuturesTicker object.
   */
  updateFutureTicker(ticker: FuturesTicker): void {
    this.futureTickerSubject.next(ticker);
  }

  /**
   * Retrieves the current FuturesTicker data.
   *
   * @returns The current FuturesTicker or null if not set.
   */
  getFutureTicker(): FuturesTicker | null {
    return this.futureTickerSubject.getValue();
  }
}
