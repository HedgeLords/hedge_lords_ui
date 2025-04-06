import { Component, OnInit, OnDestroy } from '@angular/core';
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

  // Subscription management
  private subscription!: Subscription;

  constructor(private payoffService: PayoffWebsocketService) {}

  ngOnInit(): void {
    // Subscribe to payoff data
    this.subscription= this.payoffService.payoffData$.subscribe((data) => {
        console.log('recieved data');
        // Update data size variables
        this.xDataSize = data.x?.length || 0;
        this.yDataSize = data.y?.length || 0;
      })
    
  }

  refreshData(): void {
    // Request new data from the service
    this.xDataSize = this.payoffService.payoffDataSubject.getValue().x.length;
    console.log('peeking', this.payoffService.payoffDataSubject.value);
  }

  ngOnDestroy(): void {
    // Clean up subscriptions
    this.subscription.unsubscribe();
  }
}
