import { CommonModule } from '@angular/common';
import { AfterViewInit, Component, ViewChild } from '@angular/core';
import { MatTableDataSource, MatTableModule } from '@angular/material/table';
import { Sort, MatSortModule, MatSort } from '@angular/material/sort';
import { SimpleTicker } from '../../models/ticker.model';

@Component({
  selector: 'app-options-chain',
  imports: [CommonModule, MatTableModule, MatSortModule],
  templateUrl: './options-chain.component.html',
  styleUrl: './options-chain.component.scss',
})
export class OptionsChainComponent implements AfterViewInit {
  @ViewChild(MatSort) sort!: MatSort;
  dataSource = new MatTableDataSource<SimpleTicker>();

  displayedColumns: string[] = [
    'putBid',
    'putAsk',
    'strike',
    'callBid',
    'callAsk',
  ];

  constructor() {
    // Group puts and calls by strike price
    this.organizeOptionsChain();
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  private organizeOptionsChain() {
    // Assuming you have an array of SimpleTicker objects
    const tickers: SimpleTicker[] = []; // Your data here

    // Group by strike price
    const strikeMap = new Map<number, SimpleTicker>();

    tickers.forEach((ticker) => {
      const existing = strikeMap.get(ticker.strike_price);
      if (!existing) {
        strikeMap.set(ticker.strike_price, ticker);
      }
    });

    // Sort by strike price
    const sortedTickers = Array.from(strikeMap.values()).sort(
      (a, b) => a.strike_price - b.strike_price
    );

    this.dataSource.data = sortedTickers;
  }
}
