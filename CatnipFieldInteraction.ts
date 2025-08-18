// CatnipFieldInteraction.ts
import * as hz from 'horizon/core';
import { GameConstants, PlayerData } from 'GameConstants';
import { PlayerDataManager } from 'PlayerDataManager';
import { AnalyticsManager } from 'AnalyticsManager'; // Import AnalyticsManager for logging purchase events.

export class CatnipFieldInteraction extends hz.Component<typeof CatnipFieldInteraction> {
    static propsDefinition = {}; // This component doesn't require specific properties.

    override preStart() {
        // Connect to the `OnPlayerEnterTrigger` event for the entity this script is attached to [23, 24].
        // This means the entity needs to have a `Trigger Gizmo` attached and configured.
        this.connectCodeBlockEvent(
            this.entity,
            hz.CodeBlockEvents.OnPlayerEnterTrigger,
            this.handlePlayerEnterTrigger.bind(this) // Bind 'this' to maintain context within the callback.
        );
    }

    override start() {
        console.log(`CatnipFieldInteraction started for entity: ${this.entity.name.get()}`);
    }

    /**
     * Handles a player entering the trigger zone of a catnip field.
     * @param player The player entity that entered the trigger.
     */
    private async handlePlayerEnterTrigger(player: hz.Player) {
        // Ensure PlayerDataManager and AnalyticsManager instances are accessible.
        if (!PlayerDataManager.s_instance) {
            console.warn("CatnipFieldInteraction: PlayerDataManager instance not available. Cannot process purchase.");
            return;
        }
        if (!AnalyticsManager.s_instance) {
            console.warn("CatnipFieldInteraction: AnalyticsManager instance not available. Analytics will not be logged.");
            // Continue execution as analytics is secondary to core game logic.
        }

        // Retrieve the player's current data.
        let playerData = PlayerDataManager.s_instance.getPlayerData(player);

        if (!playerData) {
            console.warn(`CatnipFieldInteraction: Player data not found for ${player.name.get()}. Cannot process purchase.`);
            return;
        }

        // Check if the player has enough catnip to afford a catnip field.
        if (playerData.catnip >= GameConstants.CATNIP_FIELD_COST) {
            // Deduct the cost from the player's catnip.
            playerData.catnip -= GameConstants.CATNIP_FIELD_COST;
            // Increment the number of catnip fields owned by the player [Outline].
            playerData.catnipFields += 1;

            // Update the player's data through the PlayerDataManager.
            await PlayerDataManager.s_instance.setPlayerData(player, playerData);
            console.log(`${player.name.get()} purchased a catnip field! New catnip: ${playerData.catnip}, New fields: ${playerData.catnipFields}`);

            // Log the purchase event using the AnalyticsManager.
            if (AnalyticsManager.s_instance) {
                // Send a custom analytics event for the purchase [Outline].
                AnalyticsManager.s_instance.sendItemPurchasedEvent(
                    player,
                    "catnip_field", // SKU or identifier for the purchased item.
                    GameConstants.CATNIP_FIELD_COST,
                    1 // Quantity purchased.
                );
            }

            // Provide visual feedback to the player using a popup message [25, 26].
            this.world.ui.showPopupForPlayer(player, `Purchased Catnip Field! You now have ${playerData.catnipFields}.`, 3000);

            // Optional: If a catnip field is a one-time use object in the world,
            // you might disable its trigger or delete it after purchase.
            // For Kittens Game, catnip fields are likely reusable points for purchasing more production.
            // If `this.entity` is a TriggerGizmo, you could disable it:
            // this.entity.as(hz.TriggerGizmo)?.enabled.set(false);
        } else {
            console.log(`${player.name.get()} tried to buy a catnip field but doesn't have enough catnip (has ${playerData.catnip}, needs ${GameConstants.CATNIP_FIELD_COST}).`);
            // Inform the player they don't have enough catnip.
            this.world.ui.showPopupForPlayer(player, `Need ${GameConstants.CATNIP_FIELD_COST} Catnip to buy! You have ${playerData.catnip}.`, 3000);
        }
    }
}

hz.Component.register(CatnipFieldInteraction);