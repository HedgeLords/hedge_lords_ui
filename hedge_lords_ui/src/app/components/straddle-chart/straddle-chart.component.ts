import {
  Component,
  OnInit,
  OnDestroy,
  NgZone,
  ChangeDetectorRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PayoffWebsocketService } from '../../services/payoff-websocket.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-straddle-chart',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './straddle-chart.component.html',
  styleUrls: ['./straddle-chart.component.scss'],
})
export class StraddleChartComponent implements OnInit, OnDestroy {
  // Data size variables
  public xDataSize: number = 0;
  public yDataSize: number = 0;

  // Connection status
  public isConnected: boolean = false;

  // Subscription management
  private subscriptions: Subscription[] = [];

  constructor(
    private payoffService: PayoffWebsocketService,
    private ngZone: NgZone,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // Subscribe to payoff data
    this.subscriptions.push(
      this.payoffService.getPayoffData().subscribe((data) => {
          this.xDataSize = data.x.length;
          this.yDataSize = data.y.length;
       
      })
    );
  }

  connectWebSocket(): void {
      console.log('Connecting to WebSocket...');
      this.payoffService.connect();
      this.isConnected = true;
      
  }

  refreshData(): void {
      console.log('Requesting new data...');
      this.payoffService.requestNewData();

      // Also update from current value as fallback
      const currentData = this.payoffService.payoffDataSubject.getValue();
      this.xDataSize = currentData.x.length;
      this.yDataSize = currentData.y.length;
     
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscriptions.forEach((sub) => sub.unsubscribe());
    // Disconnect WebSocket
    this.payoffService.disconnect();
  }
}
