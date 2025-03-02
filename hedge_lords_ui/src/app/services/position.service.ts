import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, combineLatest } from 'rxjs';
import { map } from 'rxjs/operators';
import { OptionsDataService } from './options-data.service';

export interface PositionSelection {
  id: string;
  type: 'call' | 'put';
  strikePrice: number;
  symbol: string;
  action: 'buy' | 'sell';
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
  
  constructor(private optionsDataService: OptionsDataService) {}

  getSelectedPositions(): Observable<PositionSelection[]> {
    return this.selectedPositions.asObservable();
  }
  
  // This is the key method that combines user selections with live data
  getLivePositions(): Observable<LivePosition[]> {
    console.log('getLivePositions called');
    return combineLatest([
      this.selectedPositions.asObservable(),
      this.optionsDataService.getOptionsData()
    ]).pipe(
      map(([selections, optionsData]) => {
        console.log(`Combining ${selections.length} selections with options data`);
        
        const result = selections.map(selection => {
          const option = this.findOptionInData(selection.type, selection.strikePrice, optionsData);
          
          const livePosition = {
            ...selection,
            bestBid: option ? option.best_bid : null,
            bestAsk: option ? option.best_ask : null
          };
          
          console.log(`Live position: ${selection.type} ${selection.strikePrice} - Bid: ${livePosition.bestBid}, Ask: ${livePosition.bestAsk}`);
          return livePosition;
        });
        
        return result;
      })
    );
  }
  
  private findOptionInData(type: 'call' | 'put', strikePrice: number, optionsData: any[]): any {
    if (!optionsData || optionsData.length === 0) {
      console.log('No options data available for lookup');
      return null;
    }
    
    const row = optionsData.find(opt => 
      (type === 'call' && opt.call?.strike_price === strikePrice) || 
      (type === 'put' && opt.put?.strike_price === strikePrice)
    );
    
    const result = type === 'call' ? row?.call : row?.put;
    console.log(`Finding ${type} option with strike ${strikePrice} in data: ${result ? 'Found' : 'Not found'}`);
    return result;
  }

  addPosition(type: 'call' | 'put', strikePrice: number, symbol: string): void {
    console.log(`Adding position: ${type} ${strikePrice}`);
    const currentPositions = this.selectedPositions.getValue();
    
    // Check if position already exists
    const exists = currentPositions.some(
      p => p.type === type && p.strikePrice === strikePrice && p.symbol === symbol
    );
    
    if (exists) {
      console.log('Position already exists, not adding duplicate');
      return;
    }
    
    const newPosition: PositionSelection = {
      id: `${type}-${strikePrice}-${Date.now()}`,
      type,
      strikePrice,
      symbol,
      action: 'buy', // Default action
    };
    
    console.log('Adding new position to selected positions');
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
    const updatedPositions = currentPositions.filter(position => position.id !== id);
    this.selectedPositions.next(updatedPositions);
  }

  clearPositions(): void {
    this.selectedPositions.next([]);
  }
} 