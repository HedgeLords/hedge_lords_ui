import { ChartData, DataPoints } from './../../models/chart-data.model';
import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HighchartsChartModule } from 'highcharts-angular';
import * as Highcharts from 'highcharts';
import { Subscription } from 'rxjs';
import { ChartDataService } from '../../services/chart-data.service';

@Component({
  selector: 'app-price-chart',
  standalone: true,
  imports: [CommonModule, HighchartsChartModule],
  template: `
    <div class="chart-container">
      <highcharts-chart
        [Highcharts]="Highcharts"
        [options]="chartOptions"
        [callbackFunction]="chartCallback"
        [(update)]="updateFlag"
        [oneToOne]="true"
        style="width: 100%; height: 100%;"
      ></highcharts-chart>
    </div>
  `,
  styles: [
    `
      .chart-container {
        width: 100%;
        height: 100%;
      }
    `,
  ],
})
export class PriceChartComponent implements OnInit, OnDestroy {
  Highcharts: typeof Highcharts = Highcharts;
  chartOptions: Highcharts.Options = {};
  updateFlag = false;
  chart: Highcharts.Chart | null = null;

  private subscriptions: Subscription[] = [];
  private priceData: number[][] = [];

  constructor(private chartDataService: ChartDataService) {}

  chartCallback: Highcharts.ChartCallbackFunction = (chart) => {
    this.chart = chart;
  };

  ngOnInit(): void {
    // Initialize with some dummy data
    const currentTime = Date.now();

    for (let i = 0; i < 50; i++) {
      this.priceData.push([
        currentTime - (50 - i) * 15000,
        30000 + Math.random() * 2000,
      ]);
    }

    this.initChart();

    // Subscribe to futures data for live updates
    this.subscriptions.push(
      this.chartDataService.chartData.subscribe((chartData: ChartData) => {
        if (chartData) {
          this.updateChart(chartData.data);
        }
      })
    );
  }

  private initChart(): void {
    this.chartOptions = {
      chart: {
        type: 'line',
        animation: true,
        zooming: {
          type: 'x',
        },
        backgroundColor: '#ffffff',
        style: {
          fontFamily: 'Arial, sans-serif',
        },
      },
      time: {
        timezone: 'local',
      },
      title: {
        text: 'Strategy Payoff',
      },
      credits: {
        enabled: false,
      },
      xAxis: {
        title: {
          text: 'Stock Price',
        },
      },
      yAxis: {
        title: {
          text: 'Profit/Loss',
        },
      },
      legend: {
        enabled: false,
      },
      tooltip: {
        headerFormat: '<b>{series.name}</b><br/>',
        pointFormat: '{point.x:%Y-%m-%d %H:%M:%S}<br/>{point.y:.2f}',
      },
      plotOptions: {
        line: {
          marker: {
            enabled: false,
          },
        },
      },
      series: [
        {
          type: 'line',
          name: 'Price',
          color: '#2962FF',
          data: [],
        },
      ],
    };
  }

  private updateChart(payoffData: DataPoints): void {
    if (!this.chart || !payoffData) return;

    const series = this.chart.series[0];
    if (!series) return;

    this.chartOptions.series![0].mapData = payoffData.x.map((px, index) => [
      px,
      payoffData.y[index],
    ]);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
  }
}
