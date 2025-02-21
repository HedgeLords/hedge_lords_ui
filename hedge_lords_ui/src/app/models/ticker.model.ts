import { Greeks } from './greeks.model';
import { PriceBand } from './price-band.model';
import { Quotes } from './quotes.model';

export interface Ticker {
  oi_value_usd: string;
  turnover_symbol: string;
  tick_size: string;
  size: number;
  initial_margin: string;
  symbol: string;
  timestamp: number;
  volume: number;
  open: number;
  close: number;
  type: string;
  spot_price: string;
  high: number;
  turnover: number;
  oi_contracts: string;
  low: number;
  quotes: Quotes | null;
  description: string;
  turnover_usd: number;
  tags: string[];
  contract_type: string;
  mark_change_24h: string;
  price_band: PriceBand;
  mark_price: string;
  oi_value_symbol: string;
  product_id: number;
  oi: string;
  underlying_asset_symbol: string;
  oi_value: string;
  oi_change_usd_6h: string;
}

interface OptionsTicker extends Ticker {
  strike_price: string;
  greeks: Greeks | null;
  quotes: Quotes | null;
  contract_type: 'put_options' | 'call_options';
}

interface FuturesTicker extends Ticker {
  mark_basis: string;
  funding_rate: string;
  quotes: Quotes | null;
  greeks: null;
  contract_type: 'perpetual_futures';
}
