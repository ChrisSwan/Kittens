// DebugUtilities.ts
import * as hz from 'horizon/core';
import { PlayerDataManager } from 'PlayerDataManager'; // Import PlayerDataManager to access player data reset functionality.

export class DebugUtilities extends hz.Component<typeof DebugUtilities> {
    static propsDefinition = {}; // This component doesn't need custom properties for its basic function.

    override preStart() {
        // Connect to the `OnPlayerEnterTrigger` event. This script should be attached to a Trigger Gizmo.
        // When a player enters this trigger, their progress will be reset [23, 24].
        this.connectCodeBlockEvent(
            this.entity,
            hz.CodeBlockEvents.OnPlayerEnterTrigger,
            this.handleDebugTriggerEnter.bind(this) // Bind 'this' to the callback.
        );
    }

    override start() {
        console.log("DebugUtilities started. Players can interact with this object (e.g., by walking into its trigger zone) to reset their game progress.");
        // Consider making the entity this script is attached to invisible or out of the way in a published world.
    }

    /**
     * Handles a player entering the debug trigger zone.
     * @param player The player entity that triggered the event.
     */
    private async handleDebugTriggerEnter(player: hz.Player) {
        // Ensure the PlayerDataManager singleton instance is available.
        if (!PlayerDataManager.s_instance) {
            console.warn("DebugUtilities: PlayerDataManager instance not available. Cannot reset player progress.");
            return;
        }

        console.log(`DebugUtilities: Player ${player.name.get()} has entered the debug zone. Initiating progress reset.`);
        // Call the `resetPlayerData` method on the PlayerDataManager singleton [Outline].
        await PlayerDataManager.s_instance.resetPlayerData(player);

        // Provide immediate feedback to the player.
        this.world.ui.showPopupForPlayer(player, "Your game progress has been reset!", 3000);
        console.log(`DebugUtilities: Player progress reset successfully for ${player.name.get()}.`);
    }
}

hz.Component.register(DebugUtilities);