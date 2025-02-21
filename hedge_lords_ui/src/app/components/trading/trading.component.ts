import { Component, OnDestroy, OnInit } from '@angular/core';
import { MatGridListModule } from '@angular/material/grid-list';
import { RestClientService } from '../../services/rest-client.service';
import { Subscription } from 'rxjs';
import { SettingsService } from '../../services/settings.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-trading',
  imports: [MatGridListModule],
  templateUrl: './trading.component.html',
  styleUrl: './trading.component.scss',
  providers: [SettingsService, RestClientService],
})
export class TradingComponent implements OnInit, OnDestroy {
  private subscriptions: Subscription = new Subscription();

  constructor() {}

  ngOnInit(): void {
    throw new Error('Method not implemented.');
  }

  ngOnDestroy(): void {
    this.subscriptions.unsubscribe();
  }
}
