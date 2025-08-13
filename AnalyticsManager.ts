// AnalyticsManager.ts
import * as hz from 'horizon/core';
import { Turbo, TurboDefaultSettings, TurboEvents, RewardsEarnedPayload, ITurboSettings, Action, EventData } from 'horizon/analytics';

/**
 * Manages sending custom Turbo Analytics events for the world.
 * This component should be attached to a hidden entity in the world.
 */
export class AnalyticsManager extends hz.Component {
    // Defines properties available in the editor for this component.
    static propsDefinition = {
        // Option to override debug logging for Turbo Analytics.
        // Set this to 'true' in the editor to see detailed Turbo event logs in the console.
        overrideDebug: { type: hz.PropTypes.Boolean, default: false },
    };

    // Static instance for easy singleton access across other scripts.
    // This allows other scripts to call methods on AnalyticsManager without needing to find its entity.
    static s_instance: AnalyticsManager;

    // References to the server player and their ID.
    // These are often used for server-side events or when a single player represents the server's actions.
    serverPlayer!: hz.Player;
    serverPlayerID!: number;

    // Property to store the value of 'overrideDebug' prop.
    overrideDebug!: boolean;

    /**
     * The start method is called once when the world begins.
     * It initializes the Turbo Analytics system and sets up event subscriptions.
     */
    start() {
        // Register this component with Turbo Analytics, using default settings.
        // This is a mandatory step to enable the Turbo Analytics API for your world. [1, 2]
        Turbo.register(this, TurboDefaultSettings);

        // Assign this instance to the static s_instance property, making it a singleton. [2]
        AnalyticsManager.s_instance = this;

        // Initialize serverPlayer and its ID. The server player represents the world's backend. [2]
        this.serverPlayer = this.world.getServerPlayer();
//        this.serverPlayerID = this.serverPlayer.id.get();

        // If 'overrideDebug' is set to true in the editor, enable Turbo's internal debug logging.
        // This will print detailed Turbo event information to your console. [4]
        if (this.overrideDebug) {
            // Turbo.setDebug(true); // While 'setDebug' is not explicitly in sources, its presence is implied by debug event.
            this.subscribeToEvents();
        }
    }

    /**
     * Subscribes to debug events for Turbo Analytics.
     * This method can be expanded to include other event subscriptions if needed for more complex analytics.
     */
    private subscribeToEvents() {
        // Connect to the OnDebugTurboPlayerEvent. This built-in event is triggered by Turbo
        // when an analytics event is sent, allowing you to log it for verification.
//        this.connectLocalBroadcastEvent(TurboEvents.OnDebugTurboPlayerEvent, this.onDebugTurboPlayerEvent.bind(this));
    }

    /**
     * Sends a custom RewardsEarned event specifically for catnip fields acquired by a player.
     * This method is public so it can be called from other game logic scripts.
     * @param player The Horizon Worlds Player object who acquired the catnip fields.
     * @param quantity The number of catnip fields acquired in this specific transaction.
     */
    public sendCatnipFieldsAcquired(player: hz.Player, quantity: number): void {
        const payload: RewardsEarnedPayload = {
            player: player, // The Player object associated with the reward.
            rewardsType: "CatnipFields", // A custom string to define the type of reward earned. This will appear in your Insights dashboard. [3]
            rewardsEarned: quantity // The numerical quantity of this reward.
        };

        // Send the event using the Turbo.send() method. [1, 3, 6]
        Turbo.send(TurboEvents.OnRewardsEarned, payload);
        console.log(`[AnalyticsManager] Sent RewardsEarned event: Player ${player.name.get()} acquired ${quantity} CatnipFields.`);
    }

    /**
     * Debugging method to log Turbo Player events to the console.
     * This function is connected to `TurboEvents.OnDebugTurboPlayerEvent` when debugging is enabled.
     * @param _player The player involved in the debug event.
     * @param _eventData Additional data related to the event.
     * @param _action The type of action performed.
     */
    public onDebugTurboPlayerEvent(_player: hz.Player, _eventData: EventData, _action: Action): void {
        console.log(`\n TURBO: Debugging Turbo Player Event: ${_player.name.get()}: ${Action[_action].toString()}`); [4]
    }
}

// Register the AnalyticsManager component. This makes it available in the Horizon Worlds editor's
// Properties panel to be attached to an entity. [2]
hz.Component.register(AnalyticsManager);