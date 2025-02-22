import { Component, OnInit, OnDestroy } from '@angular/core';
import { ChartConfiguration, ChartType } from 'chart.js';
import { CommonModule } from '@angular/common';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Sort, MatSortModule, MatSort } from '@angular/material/sort';
import { OptionsTicker, SimpleTicker } from '../../models/ticker.model';
import { SettingsService } from '../../services/settings.service';
import { RestClientService } from '../../services/rest-client.service';
import { WebsocketService } from '../../services/websocket.service';
import { Subscription, combineLatest, switchMap, of } from 'rxjs';
import { ChartData, ChartOptions } from 'chart.js';
import {
  BaseChartDirective,
  provideCharts,
  withDefaultRegisterables,
} from 'ng2-charts';
@Component({
  selector: 'app-straddle-chart',
  imports: [CommonModule, MatTableModule, MatSortModule, BaseChartDirective],
  providers: [
    SettingsService,
    RestClientService,
    WebsocketService,
    provideCharts(withDefaultRegisterables()),
  ],
  templateUrl: './straddle-chart.component.html',
  styleUrls: ['./straddle-chart.component.scss'],
})
export class StraddleChartComponent implements OnInit {
  public chartData: ChartData<'line'> = {
    labels: [],
    datasets: [
      {
        label: 'Straddle Payoff',
        data: [],
        borderColor: 'blue',
        fill: false,
      },
    ],
  };

  public chartOptions: ChartOptions = {
    responsive: true,
    scales: {
      x: {
        title: { display: true, text: 'Underlying Price' },
      },
      y: {
        title: { display: true, text: 'Profit/Loss' },
      },
    },
  };
  private strikePrice = 97000; // Example strike price
  private premiumPaid = 500; // Example total premium paid for both options

  constructor(private websocketService: WebsocketService) {}

  ngOnInit() {
    // Subscribe to coin and expiry selection
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
          // Connect WebSocket with the filtered contracts
          this.websocketService.connect(contracts);

          // Subscribe to WebSocket options data
          const optionsSubscription = this.websocketService.options.subscribe(
            (optionsMap) => {
              if (optionsMap.size > 0) {
                this.updateStraddleData(optionsMap);
              }
            }
          );
          this.subscriptions.push(optionsSubscription);
        }
      });

    this.subscriptions.push(subscription);
  }

  private initializeChart(): void {
    this.chartData = {
      labels: [],
      datasets: [
        {
          label: 'Straddle Payoff',
          data: [],
          borderColor: 'blue',
          fill: false,
        },
      ],
    };

    this.chartOptions = {
      responsive: true,
      scales: {
        x: {
          title: { display: true, text: 'Underlying Price' },
        },
        y: {
          title: { display: true, text: 'Profit/Loss' },
        },
      },
    };
  }

  private updateChart(
    callOption: OptionsTicker,
    putOption: OptionsTicker
  ): void {
    const dataPoints = [];
    const priceRange = 20000; // Example range around the strike price
    const step = 1000; // Step size for underlying price

    for (
      let price = this.strikePrice - priceRange;
      price <= this.strikePrice + priceRange;
      price += step
    ) {
      const callPayoff =
        Math.max(0, price - this.strikePrice) -
        parseFloat(callOption.mark_price);
      const putPayoff =
        Math.max(0, this.strikePrice - price) -
        parseFloat(putOption.mark_price);
      const totalPayoff = callPayoff + putPayoff - this.premiumPaid;
      dataPoints.push({ x: price, y: totalPayoff });
    }

    this.chartData.datasets[0].data = dataPoints;
    this.chartData.labels = dataPoints.map((point) => point.x.toString());
  }
}
