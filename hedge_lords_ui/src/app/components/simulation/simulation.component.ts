import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnalysisService } from '../../services/analysis.service';
import { Subscription } from 'rxjs';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar } from '@angular/material/snack-bar';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [CommonModule, MatButtonModule, MatIconModule],
  templateUrl: './simulation.component.html',
  styleUrl: './simulation.component.scss',
})
export class SimulationComponent implements OnInit, OnDestroy {
  simulationResults: any = null;
  private subscription: Subscription = new Subscription();

  constructor(private analysisService: AnalysisService,    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    // Subscribe to the simulation results
    this.subscription.add(
      this.analysisService.getSimulationResults().subscribe((results) => {
        this.simulationResults = results;
      })
    );
  }

  ngOnDestroy(): void {
    // Clean up subscription when component is destroyed
    this.subscription.unsubscribe();
  }

  runSimulation(): void {
    this.analysisService.runSimulation().subscribe({
      next: (response) => {
        console.log('Simulation completed successfully:', response);
        this.showNotification('Simulation completed successfully');
      },
      error: (error) => {
        console.error('Error running simulation:', error);
        this.showNotification('Error running simulation', true);
      },
    });
  }
  /**
   * Display notification to the user
   */
  private showNotification(message: string, isError: boolean = false) {
    this.snackBar.open(message, 'Close', {
      duration: 3000,
      panelClass: isError ? ['error-snackbar'] : ['success-snackbar'],
    });
  }
}
