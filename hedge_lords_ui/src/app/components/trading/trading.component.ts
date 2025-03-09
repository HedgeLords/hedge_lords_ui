import { Component, OnDestroy } from '@angular/core';
import { RestClientService } from '../../services/rest-client.service';
import { Subscription } from 'rxjs';
import { SettingsService } from '../../services/settings.service';
import { OptionsChainComponent } from '../options-chain/options-chain.component';
import { PositionAnalysisComponent } from '../position-analysis/position-analysis.component';
import { PriceChartComponent } from '../price-chart/price-chart.component';
import { HighchartsChartModule } from 'highcharts-angular';

@Component({
  selector: 'app-trading',
  standalone: true,
  imports: [
    OptionsChainComponent, 
    PositionAnalysisComponent,
    PriceChartComponent,
    HighchartsChartModule
  ],
  templateUrl: './trading.component.html',
  styleUrl: './trading.component.scss',
  providers: [SettingsService, RestClientService],
})
export class TradingComponent implements OnDestroy {
  private subscriptions: Subscription = new Subscription();

  constructor() {}

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
