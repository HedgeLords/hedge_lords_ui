import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { OptionsDataService } from './options-data.service';
import { PayoffWebsocketService } from './payoff-websocket.service';

export interface PositionSelection {
  id: string;
  type: 'call' | 'put';
  strikePrice: number;
  symbol: string;
  action: 'buy' | 'sell';
  expirationDate: string;
  underlying: string;
}

export interface LivePosition extends PositionSelection {
  bestBid: number | null;
  bestAsk: number | null;
}

@Injectable({
  providedIn: 'root'
})
export class PositionService {
  private selectedPositions = new BehaviorSubject<PositionSelection[]>([]);
  
  constructor(
    private optionsDataService: OptionsDataService,
    private payoffService: PayoffWebsocketService
  ) {}

  getSelectedPositions(): Observable<PositionSelection[]> {
    return this.selectedPositions.asObservable();
  }
  
  // This is the key method that combines user selections with live data
  getLivePositions(): Observable<LivePosition[]> {
    return combineLatest([
      this.selectedPositions.asObservable(),
      this.optionsDataService.getOptionsData()
    ]).pipe(
      map(([selections, optionsData]) => {
        return selections.map(selection => {
          const option = this.findOptionInData(selection.type, selection.strikePrice, optionsData);
          
          return {
            ...selection,
            bestBid: option ? option.best_bid : null,
            bestAsk: option ? option.best_ask : null
          };
        });
      })
    );
  }
  
  private findOptionInData(type: 'call' | 'put', strikePrice: number, optionsData: any[]): any {
    if (!optionsData || optionsData.length === 0) {
      return null;
    }
    
    const row = optionsData.find(opt => 
      (type === 'call' && opt.call?.strike_price === strikePrice) || 
      (type === 'put' && opt.put?.strike_price === strikePrice)
    );
    
    return type === 'call' ? row?.call : row?.put;
  }

  addPosition(type: 'call' | 'put', strikePrice: number, symbol: string, expiryDate: string): void {
    const currentPositions = this.selectedPositions.getValue();
    
    // Check if position already exists
    const exists = currentPositions.some(
      p => p.type === type && p.strikePrice === strikePrice && p.symbol === symbol
    );
    
    if (exists) {
      return;
    }
    
    // Extract underlying asset (first 3 letters of symbol)
    const underlying = symbol.substring(0, 3);
    
    const newPosition: PositionSelection = {
      id: `${type}-${strikePrice}-${Date.now()}`,
      type,
      strikePrice,
      symbol,
      action: 'buy', // Default action
      expirationDate: expiryDate,
      underlying
    };
    
    // Send WebSocket message immediately with default 'buy' action
    this.payoffService.selectContract(newPosition, 'buy');
    // Add to selected positions
    this.selectedPositions.next([...currentPositions, newPosition]);
  }

  updatePositionAction(id: string, action: 'buy' | 'sell'): void {
    const currentPositions = this.selectedPositions.getValue();
    const updatedPositions = currentPositions.map(position => 
      position.id === id ? { ...position, action } : position
    );
    this.selectedPositions.next(updatedPositions);
  }

  removePosition(id: string): void {
    const currentPositions = this.selectedPositions.getValue();
    const positionToRemove = currentPositions.find(p => p.id === id);
    
    if (positionToRemove) {
      // Send deselect message before removing
      this.payoffService.deselectContract(positionToRemove);
      console.log("removing")
      
      // Remove from selected positions
      const updatedPositions = currentPositions.filter(position => position.id !== id);
      this.selectedPositions.next(updatedPositions);
    }
  }

  clearPositions(): void {
    const currentPositions = this.selectedPositions.getValue();
    
    // Send deselect messages for all positions
    currentPositions.forEach(position => {
      this.payoffService.deselectContract(position);
    });
    
    // Clear all positions
    this.selectedPositions.next([]);
  }
} 