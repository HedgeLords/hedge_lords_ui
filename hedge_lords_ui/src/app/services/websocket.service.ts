import { Injectable } from '@angular/core';
import { webSocket, WebSocketSubject } from 'rxjs/webSocket';
import { BehaviorSubject } from 'rxjs';
import { OptionsTicker, FuturesTicker } from '../models/ticker.model';
import { RestClientService } from './rest-client.service';

interface SubscribeMessage {
  type: string;
  payload: {
    channels: Array<{
      name: string;
      symbols: string[];
    }>;
  };
}

@Injectable({
  providedIn: 'root',
})
export class WebsocketService {
  // WebSocketSubject instance for the exchange connection.
  private socket$: WebSocketSubject<any> | null = null;

  constructor(private restClient: RestClientService) {}

  /**
   * Helper function to parse an expiry date from a string in the format "22Feb2025"
   * into a JavaScript Date object.
   *
   * @param expiry - The expiry date as a string.
   * @returns A Date object.
   */
  private parseExpiryDate(expiry: string): Date {
    const day = parseInt(expiry.slice(0, 2), 10);
    const monthStr = expiry.slice(2, 5).toLowerCase();
    const monthNames = [
      'jan',
      'feb',
      'mar',
      'apr',
      'may',
      'jun',
      'jul',
      'aug',
      'sep',
      'oct',
      'nov',
      'dec',
    ];
    const month = monthNames.indexOf(monthStr);
    const year = parseInt(expiry.slice(5), 10);
    return new Date(year, month, day);
  }

  /**
   * Connects to the exchange’s WebSocket and subscribes for updates.
   * It first calls the REST client service to retrieve a filtered list of symbols,
   * then sends a subscription message containing that list of symbols.
   *
   * @param exchangeName The name of the exchange (e.g. 'delta'). (Currently not used dynamically.)
   * @param coin The coin symbol (e.g. 'BTCUSD').
   * @param expiryDate The expiry date as a string (e.g. '22Feb2025').
   * @param optionsTickerSubject A BehaviorSubject holding the latest list of options tickers.
   * @param futureTickerSubject A BehaviorSubject holding the latest futures ticker (index price).
   */
  public connect(
    exchangeName: string,
    coin: string,
    expiryDate: string,
    optionsTickerSubject: BehaviorSubject<[]OptionsTicker>,
    futureTickerSubject: BehaviorSubject<FuturesTicker | null>
  ): void {
    // Define the WebSocket URL. Adjust if needed.
    const wsUrl = 'wss://socket.india.delta.exchange';

    // Create the WebSocket connection.
    this.socket$ = webSocket(wsUrl);

    // Convert the expiry date string to a Date object.
    const parsedExpiry = this.parseExpiryDate(expiryDate);

    // Use the REST client to fetch and filter the symbols.
    this.restClient.getOptionsContracts(coin, parsedExpiry).subscribe({
      next: (symbols: string[]) => {
        // Build the subscription message using the list of symbols.
        const subscribeMessage: SubscribeMessage = {
          type: 'subscribe',
          payload: {
            channels: [
              {
                name: 'v2/ticker',
                symbols: symbols, // use the list returned by the REST client
              },
            ],
          },
        };

        // Send the subscription message once the WebSocket is open.
        this.socket$!.next(subscribeMessage);
      },
      error: (err) => {
        console.error('Error fetching symbols from REST client:', err);
      },
    });

    // Listen to incoming messages from the WebSocket.
    this.socket$.subscribe({
      next: (msg: any) => {
        // Process incoming messages and update the provided observables.
        if (msg.updateType === 'options') {
          // Assuming msg.data is an array of OptionsTicker objects.
          optionsTickerSubject.next(msg.data);
        } else if (msg.updateType === 'futures') {
          // Assuming msg.data is a FuturesTicker object.
          futureTickerSubject.next(msg.data);
        } else {
          console.warn('Unrecognized message format:', msg);
        }
      },
      error: (err) => {
        console.error('WebSocket error:', err);
      },
      complete: () => {
        console.warn('WebSocket connection closed.');
      },
    });
  }

  /**
   * Disconnects from the exchange WebSocket.
   */
  public disconnect(): void {
    if (this.socket$) {
      this.socket$.complete();
      this.socket$ = null;
    }
  }
}
