import { Component } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import { MatFormFieldModule } from '@angular/material/form-field';
import { KeyValuePipe } from '@angular/common';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { provideNativeDateAdapter } from '@angular/material/core';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatExpansionModule } from '@angular/material/expansion';

@Component({
  selector: 'app-settings',
  imports: [
    MatFormFieldModule,
    MatSelectModule,
    MatDatepickerModule,
    MatInputModule,
    MatButtonModule,
    MatIconModule,
    MatExpansionModule,
    FormsModule,
    KeyValuePipe,
  ],
  templateUrl: './settings.component.html',
  styleUrl: './settings.component.scss',
  providers: [provideNativeDateAdapter()],
})
export class SettingsComponent {
  exchanges: { [exchangeName: string]: string[] } = {
    Binance: [
      'SOLUSDT',
      'BTCUSDT',
      'ETHUSDT',
      'BNBUSDT',
      'XRPUSDT',
      'DOGEUSDT',
    ],
    'Delta Exchange': ['BTCUSD', 'ETHUSD'],
  };
  availableCoins: string[] = ['BTCUSD', 'ETHUSD'];

  selectedExchange: string = 'Delta Exchange';
  selectedCoin: string = 'BTCUSD';
  selectedExpiryDate: Date | null = new Date();
  selectedLotSize: number = 0.0001;

  constructor() {}

  onExchangeChange() {
    this.availableCoins = this.exchanges[this.selectedExchange];
  }
}
