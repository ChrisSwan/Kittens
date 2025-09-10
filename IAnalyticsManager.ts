import * as hz from 'horizon/core';

export interface  IAnalyticsManager {
  sendItemPurchasedEvent(player: hz.Player, itemSKU: string, price: number, quantity: number): void;
}