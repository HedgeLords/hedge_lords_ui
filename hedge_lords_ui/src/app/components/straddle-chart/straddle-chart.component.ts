import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts';
import { PayoffWebsocketService } from '../../services/payoff-websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-straddle-chart',
  standalone: true,
  imports: [CommonModule, HighchartsChartModule],
  template: `
    <div class="chart-wrapper">
      <button class="refresh-button" (click)="refreshChart()">
        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
          <path d="M21 2v6h-6"></path>
          <path d="M3 12a9 9 0 0 1 15-6.7L21 8"></path>
          <path d="M3 22v-6h6"></path>
          <path d="M21 12a9 9 0 0 1-15 6.7L3 16"></path>
        </svg>
        Refresh
      </button>
      <div class="chart-container">
        <highcharts-chart
          [Highcharts]="Highcharts"
          [options]="chartOptions"
          [callbackFunction]="chartCallback"
          style="width: 100%; height: 100%; display: block;"
        ></highcharts-chart>
      </div>
    </div>
  `,
  styles: [
    `
      .chart-wrapper {
        position: relative;
        width: 100%;
      }
      .chart-container {
        width: 100%;
        height: 400px;
        min-height: 400px;
      }
      .refresh-button {
        position: absolute;
        top: 10px;
        right: 10px;
        z-index: 1000;
        display: flex;
        align-items: center;
        gap: 4px;
        padding: 6px 12px;
        background-color: rgba(255, 255, 255, 0.1);
        border: 1px solid rgba(255, 255, 255, 0.2);
        border-radius: 4px;
        color: #ffffff;
        cursor: pointer;
        transition: all 0.2s ease;
      }
      .refresh-button:hover {
        background-color: rgba(255, 255, 255, 0.2);
      }
      .refresh-button svg {
        width: 14px;
        height: 14px;
      }
    `,
  ],
})
export class StraddleChartComponent implements OnInit, OnDestroy {
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {
    chart: {
      type: 'line',
      backgroundColor: 'transparent',
      height: 400,
    },
    title: {
      text: 'Straddle Payoff Diagram',
      style: {
        color: '#ffffff',
      },
    },
    xAxis: {
      title: {
        text: 'Price',
        style: {
          color: '#ffffff',
        },
      },
      labels: {
        style: {
          color: '#ffffff',
        },
        formatter: function () {
          const value = Number(this.value);
          if (value >= 1000) {
            return (value / 1000).toFixed(1) + 'K';
          }
          return value.toFixed(0);
        },
      },
      gridLineColor: '#2a2a2a',
    },
    yAxis: {
      title: {
        text: 'Profit/Loss',
        style: {
          color: '#ffffff',
        },
      },
      labels: {
        style: {
          color: '#ffffff',
        },
      },
      gridLineColor: '#2a2a2a',
    },
    legend: {
      enabled: false,
    },
    tooltip: {
      formatter: function () {
        const x = this.x ?? 0;
        const y = this.y ?? 0;
        return `Price: ${x.toFixed(0)}<br>P/L: ${y.toFixed(2)}`;
      },
    },
    plotOptions: {
      line: {
        color: '#00ff00',
        marker: {
          enabled: false,
        },
        turboThreshold: 0,
      },
    },
    series: [
      {
        type: 'line',
        name: 'Payoff',
        data: [],
      },
    ],
  };

  private chart: Highcharts.Chart | null = null;
  private subscriptions: Subscription[] = [];
  private pendingData: { x: number[]; y: number[] } | null = null;

  constructor(private payoffService: PayoffWebsocketService) {
    console.log('StraddleChartComponent initialized');
  }

  ngOnInit(): void {
    console.log('ngOnInit called');
    this.subscriptions.push(
      this.payoffService.payoffData$.subscribe({
        next: (data) => {
          console.log('Received payoff data:', data);
          if (
            !data ||
            !data.x ||
            !data.y ||
            data.x.length === 0 ||
            data.y.length === 0
          ) {
            console.log(
              'Received empty data arrays, initializing with dummy data'
            );
            // Generate dummy data only if needed
            this.pendingData = this.generateDummyData();
          } else {
            console.log('chart data recieved ', data);
            // Store the valid data
            this.pendingData = data;
          }

          // Update the chart only if it's ready and we have data pending
          if (this.chart && this.pendingData) {
            this.updateChart(this.pendingData);
          }
        },
        error: (error) => {
          console.error('Error receiving payoff data:', error);
        },
      })
    );
  }

  chartCallback: Highcharts.ChartCallbackFunction = (chart) => {
    console.log('Chart callback called');
    this.chart = chart;
    if (this.pendingData) {
      this.updateChart(this.pendingData);
    }
  };

  private generateDummyData(): { x: number[]; y: number[] } {
    const centerPrice = 50000;
    const priceRange = 10000;
    const numPoints = 100;
    const data: number[][] = [];

    for (let i = 0; i <= numPoints; i++) {
      const x = centerPrice - priceRange + (2 * priceRange * i) / numPoints;
      const y = Math.abs(x - centerPrice) - 1000; // V-shaped payoff
      data.push([x, y]);
    }

    return {
      x: data.map((point) => point[0]),
      y: data.map((point) => point[1]),
    };
  }

  private updateChart(data: { x: number[]; y: number[] }): void {
        if (!this.chart || !data) return;

    
    console.log('Updating chart with data points:', data.x.length);

    const seriesData = data.x.map((x, i) => [x, data.y[i]]);

    // Create a new chartOptions object to trigger change detection
    this.chartOptions = {
      ...this.chartOptions, // Spread existing options
      series: [ // Replace the series array
        {
          type: 'line',
          name: 'Payoff',
          data: seriesData, // Use the new data
        },
      ],
    };
    // Optional: Force Highcharts redraw if needed, though updating options should suffice
    // if (this.chart) {
    //   this.chart.redraw();
    // }
  }

  refreshChart(): void {
    console.log('Refreshing chart with latest data...');
    
    // Request new data from the service
    this.payoffService.requestNewData();
    
    // Also force update with existing data if available
    if (this.pendingData) {
      this.updateChart(this.pendingData);
    } else {
      console.log('No existing data available to refresh');
    }
  }

  ngOnDestroy(): void {
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
