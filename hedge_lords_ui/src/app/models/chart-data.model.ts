export interface DataPoints {
  x: number[];
  y: number[];
}

export interface ChartData {
  type: string;
  timestamp: number;
  data: DataPoints;
  selected_contracts: string[];
}
