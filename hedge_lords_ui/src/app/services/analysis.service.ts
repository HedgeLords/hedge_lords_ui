import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class AnalysisService {
  private readonly BASE_URL = 'http://localhost:8001';
  private simulationResult$ = new BehaviorSubject<any>(null);

  constructor(private http: HttpClient) {}

  /**
   * Updates the lot size on the server
   * @param lotSize The new lot size value
   */
  updateLotSize(lotSize: number): Observable<any> {
    return this.http.post(`${this.BASE_URL}/update_lotsize`, { lot_size: lotSize });
  }

  /**
   * Clears the current scenario
   */
  clearScenario(): Observable<any> {
    return this.http.post(`${this.BASE_URL}/clear_scenario`, {});
  }

  /**
   * Runs the Monte Carlo simulation and stores the result
   */
  runSimulation(): Observable<any> {
    return this.http.post(`${this.BASE_URL}/run_simulation`, {}).pipe(
      tap(result => {
        this.simulationResult$.next(result);
      })
    );
  }

  /**
   * Gets the simulation results as an observable
   */
  getSimulationResults(): Observable<any> {
    return this.simulationResult$.asObservable();
  }
}