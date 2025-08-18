// AnalyticsManager.ts
import * as hz from 'horizon/core';
import { Turbo, ITurboSettings, TurboEvents } from 'horizon/analytics'; // Import Turbo Analytics API components [2, 27].

export class AnalyticsManager extends hz.Component<typeof AnalyticsManager> {
    static propsDefinition = {
        // A component property to easily toggle debug logging for analytics in the editor.
        debugAnalytics: { type: hz.PropTypes.Boolean, default: false },
    };

    // **Singleton instance**: This static property allows other scripts to easily access this manager [1, 2].
    static s_instance: AnalyticsManager;

    // Prop value accessed via `this.props.debugAnalytics`.
    debugAnalytics!: boolean;

    /**
     * `preStart()` is ideal for assigning the singleton instance to ensure it's available early.
     */
    override preStart() {
        AnalyticsManager.s_instance = this;
    }

    override start() {
        console.log("AnalyticsManager started.");

        // Configure basic Turbo Analytics settings [1].
        const turboSettings: ITurboSettings = {
            useAFK: false,      // Do not track Away from Keyboard status for this game.
            useFriction: false, // Do not track friction events.
            useHeartBeats: true, // Send periodic heartbeats to track player presence in the world [1].
            // Other settings could be added here for more advanced analytics needs.
        };

        // Register this component with the Turbo Analytics system [1, 27].
        Turbo.register(this, turboSettings);

        // If the `debugAnalytics` prop is enabled, log a message to the console.
        if (this.debugAnalytics) {
            console.log("AnalyticsManager: Debugging Turbo Analytics is ENABLED. Events will be logged to console.");
        }
    }

    /**
     * Public method to send a custom analytics event to Horizon's Turbo Analytics.
     * This provides a unified interface for other scripts to log game-specific events.
     * @param player The player associated with the event.
     * @param eventName A string name for the custom event (e.g., "catnip_field_purchased").
     * @param payload An object containing event-specific data (must be SerializableState).
     */
    public sendCustomAnalyticsEvent(player: hz.Player, eventName: string, payload: Record<string, any>) {
        // Basic check to ensure Turbo Analytics is initialized.
        if (!Turbo) {
            console.error("AnalyticsManager: Turbo Analytics is not initialized. Cannot send event.");
            return;
        }

        // Augment the payload with common player information.
        const fullPayload = {
            playerID: player.id,
            playerName: player.name.get(),
            ...payload // Spread the provided payload data.
        };

        try {
            // Send the event using `Turbo.send()`. `eventName` can be a custom string [27].
            Turbo.send(eventName, fullPayload);
            if (this.debugAnalytics) {
                console.log(`AnalyticsManager: Sent custom event '${eventName}' for ${player.name.get()} with payload:`, fullPayload);
            }
        } catch (error) {
            console.error(`AnalyticsManager: Failed to send event '${eventName}':`, error);
        }
    }

    /**
     * Specific helper method for logging an item purchase event.
     * This provides a clear, type-safe way for `CatnipFieldInteraction` to report purchases.
     * @param player The player who made the purchase.
     * @param itemSKU A string identifier for the purchased item (e.g., "catnip_field").
     * @param price The price paid for the item.
     * @param quantity The quantity of the item purchased.
     */
    public sendItemPurchasedEvent(player: hz.Player, itemSKU: string, price: number, quantity: number) {
        this.sendCustomAnalyticsEvent(player, "item_purchased", {
            item_sku: itemSKU,
            price_paid: price,
            quantity: quantity,
            // Additional context like "game_version", "world_id" could be added here.
        });
    }
}

hz.Component.register(AnalyticsManager);