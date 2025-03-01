import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild, OnInit, OnDestroy } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Sort, MatSortModule, MatSort } from '@angular/material/sort';
import { OptionsTicker, SimpleTicker } from '../../models/ticker.model';
import { SettingsService } from '../../services/settings.service';
import { RestClientService } from '../../services/rest-client.service';
import { WebsocketService } from '../../services/websocket.service';
import { Subscription, combineLatest, switchMap, of } from 'rxjs';
import { MatTooltipModule } from '@angular/material/tooltip';
import { WebSocketSubject, webSocket } from 'rxjs/webSocket';

@Component({
  selector: 'app-options-chain',
  imports: [CommonModule, MatTableModule, MatSortModule, MatTooltipModule],
  templateUrl: './options-chain.component.html',
  styleUrl: './options-chain.component.scss',
  providers: [SettingsService, RestClientService, WebsocketService],
})
export class OptionsChainComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription[] = [];
  public optionsData: any[] = [];
  public futuresData: any = null;
  private socket$: WebSocketSubject<any>;

  constructor(
    private settingsService: SettingsService,
    private restClientService: RestClientService,
    private websocketService: WebsocketService
  ) {
    this.socket$ = webSocket('ws://localhost:8001/stream/options');
  }

  ngOnInit() {
    this.socket$.subscribe({
      next: (message) => {
        if (message.purpose === 'prices') {
          this.futuresData = message.options_chain.find(
            (item: any) => item.contract_type === 'perpetual_futures'
          );
          
          const optionsOnly = message.options_chain.filter(
            (item: any) => item.contract_type !== 'perpetual_futures'
          );
          this.optionsData = this.groupAndSortOptions(optionsOnly);
        }
      },
      error: (err) => console.error('WebSocket error:', err),
      complete: () => console.warn('WebSocket connection closed.')
    });
  }

  private groupAndSortOptions(options: any[]): any[] {
    const grouped = options.reduce((acc, option) => {
      const strike = option.strike_price;
      if (!acc[strike]) {
        acc[strike] = { call: null, put: null };
      }
      if (option.contract_type === 'call_options') {
        acc[strike].call = option;
      } else if (option.contract_type === 'put_options') {
        acc[strike].put = option;
      }
      return acc;
    }, {});

    return Object.keys(grouped)
      .sort((a, b) => parseFloat(a) - parseFloat(b))
      .map(strike => grouped[strike]);
  }

  ngOnDestroy() {
    this.socket$.complete();
  }
}
