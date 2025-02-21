import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { RestClientService } from '../../services/rest-client.service';
import { Subscription } from 'rxjs';
import { SettingsService } from '../../services/settings.service';
import { HttpClient } from '@angular/common/http';
import { OptionsChainComponent } from '../options-chain/options-chain.component';

@Component({
  selector: 'app-trading',
  imports: [MatGridListModule, OptionsChainComponent],
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
