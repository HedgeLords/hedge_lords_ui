import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Sort, MatSortModule, MatSort } from '@angular/material/sort';
import { SimpleTicker } from '../../models/ticker.model';
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
export class OptionsChainComponent implements AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<SimpleTicker>();

  displayedColumns: string[] = [
    'putBid',
    'putAsk',
    'strike',
    'callBid',
    'callAsk',
  ];

  private subscriptions: Subscription[] = [];

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
                const simpleTickers = Array.from(optionsMap.values())
                  .map((ticker) => new SimpleTicker(ticker))
                  .sort((a, b) => a.strike_price - b.strike_price);

                this.dataSource.data = simpleTickers;
              }
            }
          );

          this.subscriptions.push(optionsSubscription);
        }
      });

    this.subscriptions.push(subscription);
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  ngOnDestroy() {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());

    // Disconnect websocket
    this.websocketService.disconnect();
  }
}
