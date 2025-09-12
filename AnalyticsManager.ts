// AnalyticsManager.ts
import * as hz from 'horizon/core';
import { Turbo, ITurboSettings, TurboEvents, CustomActionData, TurboDefaultSettings } from 'horizon/analytics'; // Import Turbo Analytics API components [2, 27].
import { IAnalyticsManager } from 'IAnalyticsManager';
import { ServiceLocator_Data } from 'ServiceLocator_Data';

export class AnalyticsManager extends hz.Component<typeof AnalyticsManager> implements IAnalyticsManager{
    static propsDefinition = {
        // A component property to easily toggle debug logging for analytics in the editor.
        debugAnalytics: { type: hz.PropTypes.Boolean, default: false },
    };

    // Singleton instance: This static property allows other scripts to easily access this manager
    static s_instance: AnalyticsManager;

    // Prop value accessed via `this.props.debugAnalytics`.
    debugAnalytics!: boolean;

    // `preStart()` is ideal for assigning the singleton instance to ensure it's available early.
    override preStart() {
        AnalyticsManager.s_instance = this;
        ServiceLocator_Data.analyticsManager = this;        
    }


    
    override start() {
        console.log("AnalyticsManager started.");

        this.debugAnalytics = true;

        // Configure basic Turbo Analytics settings [1].
        const turboSettings: ITurboSettings = {
            ...TurboDefaultSettings,
            useAFK: false,      // Do not track Away from Keyboard status for this game.
            useFriction: false, // Do not track friction events.
            useHeartbeats: false, // Send periodic heartbeats to track player presence in the world [1].
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
/*    
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
            Turbo.send(TurboEvents.OnCustomAction, fullPayload);
            if (this.debugAnalytics) {
                console.log(`AnalyticsManager: Sent custom event '${eventName}' for ${player.name.get()} with payload:`, fullPayload);
            }
        } catch (error) {
            console.error(`AnalyticsManager: Failed to send event '${eventName}':`, error);
        }
    }
*/
    public sendItemPurchasedEvent(player: hz.Player, itemSKU: string, price: number, quantity: number) {
        const payload = {
            player: player,
            rewardsType: itemSKU,
            rewardsEarned: quantity,
        };
        try {
            // Send the event using `Turbo.send()`. `eventName` can be a custom string [27].
            Turbo.send(TurboEvents.OnRewardsEarned, payload);
            if (this.debugAnalytics) {
                console.log(`AnalyticsManager: Sent custom event OnRewardsEarned for ${player.name.get()} with payload:`, payload);
            }
        } catch (error) {
            console.error(`AnalyticsManager: Failed to send OnRewardsEarned':`, error);
        }
    }
}

hz.Component.register(AnalyticsManager);