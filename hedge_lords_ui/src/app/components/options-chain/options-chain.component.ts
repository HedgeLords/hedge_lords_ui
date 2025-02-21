import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Sort, MatSortModule, MatSort } from '@angular/material/sort';
import { OptionsTicker, SimpleTicker } from '../../models/ticker.model';
import { SettingsService } from '../../services/settings.service';
import { RestClientService } from '../../services/rest-client.service';
import { WebsocketService } from '../../services/websocket.service';
import { Subscription, combineLatest, switchMap, of } from 'rxjs';

@Component({
  selector: 'app-options-chain',
  imports: [CommonModule, MatTableModule, MatSortModule],
  templateUrl: './options-chain.component.html',
  styleUrl: './options-chain.component.scss',
  providers: [SettingsService, RestClientService, WebsocketService],
})
export class OptionsChainComponent {
  private subscriptions: Subscription[] = [];
  public optionsData: Map<number, SimpleTicker[]> = new Map();

  constructor(
    private settingsService: SettingsService,
    private restClientService: RestClientService,
    private websocketService: WebsocketService
  ) {}

  ngOnInit() {
    // Combine selected coin and expiry date observables
    const subscription = combineLatest([
      this.settingsService.selectedCoin,
      this.settingsService.selectedExpiryDate,
    ])
      .pipe(
        switchMap(([coin, expiryDate]) => {
          if (!coin || !expiryDate) return of([]);
          return this.restClientService.getFilteredOptions(coin, expiryDate);
        })
      )
      .subscribe((contracts) => {
        if (contracts.length > 0) {
          // Connect websocket with filtered contracts
          this.websocketService.connect(contracts);
          // Subscribe to options updates
          const optionsSubscription = this.websocketService.options.subscribe(
            (optionsMap) => {
              if (optionsMap.size > 0) {
                this.groupOptionsByStrike(optionsMap);
              }
            }
          );
          this.subscriptions.push(optionsSubscription);
        }
      });
    this.subscriptions.push(subscription);
  }

  private groupOptionsByStrike(optionsMap: Map<string, OptionsTicker>) {
    // Create a new Map with sorted strikes
    const sortedStrikes = Array.from(optionsMap.values())
      .map((ticker) => parseInt(ticker.strike_price))
      .filter((value, index, self) => self.indexOf(value) === index) // Get unique strikes
      .sort((a, b) => a - b); // Sort in ascending order

    const newOptionsData = new Map<number, SimpleTicker[]>();

    // Initialize the map with sorted strikes
    sortedStrikes.forEach((strike) => {
      newOptionsData.set(strike, []);
    });

    // Populate the options
    Array.from(optionsMap.values()).forEach((ticker) => {
      const simpleTicker = new SimpleTicker(ticker);
      const strike = simpleTicker.strike_price;
      newOptionsData.get(strike)!.push(simpleTicker);
    });

    // Sort options within each strike price group (calls at 0, puts at 1)
    newOptionsData.forEach((tickers, strike) => {
      tickers.sort((a, b) => (a.contract_type === 'put_options' ? 1 : -1));
    });

    this.optionsData = newOptionsData;
  }

  ngOnDestroy() {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    // Disconnect websocket
    this.websocketService.disconnect();
  }
}
