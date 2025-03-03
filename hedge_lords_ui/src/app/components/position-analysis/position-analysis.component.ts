import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { FormsModule } from '@angular/forms';
import { PositionService, LivePosition } from '../../services/position.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-position-analysis',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    MatIconModule,
    FormsModule
  ],
  templateUrl: './position-analysis.component.html',
  styleUrl: './position-analysis.component.scss'
})
export class PositionAnalysisComponent implements OnInit, OnDestroy {
  livePositions: LivePosition[] = [];
  private subscriptions: Subscription[] = [];
  Date = Date; // For the timestamp in the template
  lastUpdateTime: string = 'Never';
  
  constructor(private positionService: PositionService) {}
  
  ngOnInit(): void {
    // Subscribe to the combined stream of positions and live data
    this.subscriptions.push(
      this.positionService.getLivePositions().subscribe(
        positions => {
          this.livePositions = positions;
          // Update the timestamp
          const now = new Date();
          this.lastUpdateTime = `${now.getHours()}:${now.getMinutes()}:${now.getSeconds()}.${now.getMilliseconds()}`;
        },
        error => {
          // Show error in UI instead of console
          this.lastUpdateTime = `Error: ${error.message}`;
        }
      )
    );
  }
  
  onActionChange(position: LivePosition, action: 'buy' | 'sell'): void {
    this.positionService.updatePositionAction(position.id, action);
  }
  
  removePosition(id: string): void {
    this.positionService.removePosition(id);
  }
  
  clearAll(): void {
    this.positionService.clearPositions();
  }
  
  ngOnDestroy(): void {
    // Unsubscribe from all subscriptions
    this.subscriptions.forEach(sub => sub.unsubscribe());
  }
} 