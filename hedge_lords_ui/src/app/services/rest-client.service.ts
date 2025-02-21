import { Injectable } from '@angular/core';
import { HttpClient, HttpParams, HttpHeaders } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface ExchangeProductResponse {
  success: boolean;
  result: Array<{ symbol: string }>;
}

@Injectable({
  providedIn: 'root',
})
export class RestClientService {
  // Base URL for the exchange API.
  private baseUrl = 'https://api.india.delta.exchange';

  constructor(private http: HttpClient) {}

  /**
   * Calls the exchange API to fetch products, then filters the returned symbols.
   *
   * @param coin - The coin used for filtering (e.g. 'BTCUSD'). We check that the product symbol’s second part equals coin.substring(0, 3).
   * @param expiryDate - The expected expiry date. The product symbol is expected to have its date as ddmmyy in the fourth part.
   * @returns An Observable of string arrays (filtered symbols).
   */
  getOptionsContracts(coin: string, expiryDate: Date): Observable<string[]> {
    // Prepare query parameters.
    const params = new HttpParams()
      .set('contract_types', 'call_options,put_options')
      .set('states', 'live');

    const url = `${this.baseUrl}/v2/products`;

    return this.http
      .get<ExchangeProductResponse>(url, { params })
      .pipe(
        map((response) => {
          if (response.success) {
            // Extract the symbol from each product.
            return response.result.map((prod) => prod.symbol);
          } else {
            throw new Error('Exchange API returned unsuccessful response');
          }
        }),
        // Filter the symbols based on the provided coin and expiryDate.
        map((symbols) => {
          return symbols.filter((prodSymbol) => {
            const parts = prodSymbol.split('-');
            // Check that symbol splits into 4 parts.
            if (parts.length !== 4) {
              return false;
            }
            // Check that the second part equals the first three letters of the coin.
            if (parts[1] !== coin.substring(0, 3)) {
              return false;
            }
            // The fourth part is expected to be the date in ddmmyy format.
            const dateStr = parts[3];
            if (dateStr.length !== 6) {
              return false;
            }
            const day = parseInt(dateStr.substring(0, 2), 10);
            const month = parseInt(dateStr.substring(2, 4), 10) - 1; // JavaScript months are 0-based.
            const year = 2000 + parseInt(dateStr.substring(4, 6), 10);
            const productDate = new Date(year, month, day);

            // Compare the product date with the provided expiryDate.
            return (
              productDate.getDate() === expiryDate.getDate() &&
              productDate.getMonth() === expiryDate.getMonth() &&
              productDate.getFullYear() === expiryDate.getFullYear()
            );
          });
        }),
        catchError((err) => {
          console.error('Error fetching options contracts', err);
          return throwError(err);
        })
      );
  }
}
