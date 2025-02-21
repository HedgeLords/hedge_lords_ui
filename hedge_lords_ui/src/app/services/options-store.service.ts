import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';
import { OptionsTicker } from '../models/ticker.model';

@Injectable({
  providedIn: 'root',
})
export class OptionsStoreService {
  // A Map to store the latest options contract data keyed by symbol.
  private optionsStore = new Map<string, OptionsTicker>();

  // BehaviorSubject to hold the current state of the options store.
  private optionsStoreSubject = new BehaviorSubject<Map<string, OptionsTicker>>(
    this.optionsStore
  );

  // Public observable that components can subscribe to.
  public optionsStore$ = this.optionsStoreSubject.asObservable();

  /**
   * Updates the stored data for an option contract.
   * If the symbol exists, it will be updated; otherwise, it will be added.
   *
   * @param ticker The OptionsTicker object representing the option contract data.
   */
  updateTicker(ticker: OptionsTicker): void {
    // Update or insert the ticker using its symbol as the key.
    this.optionsStore.set(ticker.symbol, ticker);
    // Emit the updated store.
    this.optionsStoreSubject.next(this.optionsStore);
  }

  /**
   * Retrieves the current ticker data for a given option symbol.
   *
   * @param symbol The option contract symbol.
   * @returns The OptionsTicker object or undefined if not found.
   */
  getTicker(symbol: string): OptionsTicker | undefined {
    return this.optionsStore.get(symbol);
  }
}
