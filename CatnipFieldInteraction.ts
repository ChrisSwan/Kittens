// CatnipFieldInteraction.ts
import * as hz from 'horizon/core';
import { GameConstants, PlayerData } from 'GameConstants';
import { PlayerDataManager, PlayerDataEvents } from 'PlayerDataManager';
import { AnalyticsManager } from 'AnalyticsManager'; // Import AnalyticsManager for logging purchase events.

export class CatnipFieldInteraction extends hz.Component<typeof CatnipFieldInteraction> {
    static propsDefinition = {
        purchasePlatformMesh: { type: hz.PropTypes.Entity },
        catnipPurchaseText: { type: hz.PropTypes.Entity},
    }; // This component doesn't require specific properties.

    private purchasePlatform!: hz.MeshEntity; // A typed reference to the actual MeshEntity for direct manipulation.
    private purchaseText! : hz.TextGizmo;

    override preStart() {
        // Validates that the 'purchasePlatformMesh' property is set and stores a typed reference to it.
        // If not set, a warning is logged as visual feedback will not function.
        if (this.props.purchasePlatformMesh) {
            this.purchasePlatform = this.props.purchasePlatformMesh.as(hz.MeshEntity);
        } else {
            console.error("CatnipFieldInteraction: Missing 'purchasePlatformMesh' property. Platform color changes will not work.");
        }
        if (this.props.catnipPurchaseText) {
            this.purchaseText = this.props.catnipPurchaseText.as(hz.TextGizmo);
        } else {
            console.error("CatnipFieldInteraction: Missing 'purchaseFieldText' property. Cannot display text needed.");
        }
        // Connect to the `OnPlayerEnterTrigger` event for the entity this script is attached to.
        // This means the entity needs to have a `Trigger Gizmo` attached and configured.
        this.connectCodeBlockEvent(
            this.entity,
            hz.CodeBlockEvents.OnPlayerEnterTrigger,
            this.handlePlayerEnterTrigger.bind(this) // Bind 'this' to maintain context within the callback.
        );

        // Subscribes to the `onPlayerDataUpdated` network event broadcast by `PlayerDataManager` [19].
        // This allows the purchase platform's visual state to update in real-time as a player's catnip or fields change [20].
        this.connectNetworkBroadcastEvent(
            PlayerDataEvents.onPlayerDataUpdated,
            (data: { player: hz.Player, playerData: PlayerData }) => {
//                this.updatePurchasePlatformColor(data.player, data.playerData);
                this.updatePurchasePlatformColor(data);
            }
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

        // Check if the player has enough catnip to afford a catnip field. the cost is increased by PRICE_RATIO % for each field already owned
        let currentFieldCost = GameConstants.CATNIP_FIELD_COST * (1 + (playerData.catnipFields * GameConstants.CATNIP_FIELD_PRICE_RATIO))
        if (playerData.catnip >= currentFieldCost) {
            // Deduct the cost from the player's catnip.
            playerData.catnip -= currentFieldCost;
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
            else {
                console.log("ERROR: Analytics instance not found!");
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
            this.world.ui.showPopupForPlayer(player, `Need ${currentFieldCost.toPrecision(2)} Catnip to buy! You have ${playerData.catnip.toPrecision(2)}.`, 3000);
        }
        // Always update color after interaction, even if purchase fails.
//        this.updatePurchasePlatformColor({ player, playerData });    
    }

    private updatePurchasePlatformColor(data: { player: hz.Player, playerData: PlayerData }) {
        if (!this.props.purchasePlatformMesh || !this.props.purchasePlatformMesh.exists()) {
            console.warn("CatnipFieldInteraction: purchasePlatformMesh prop is not set or does not exist.");
            return;
        }

        /* This code fails, but tbf we don't need this check, as we're fine for the colour to be visible to all players
        const localPlayer = this.world.getLocalPlayer();
        if (!localPlayer || localPlayer.id !== data.player.id) {
            // If the local player isn't the one whose data updated, skip.
            // In a live environment, this event is broadcast, so we should filter.
            return;
        }
        */

//        const meshEntity = this.props.purchasePlatformMesh.as(hz.MeshEntity);
//        if (!meshEntity) return;

        const currentCost = GameConstants.CATNIP_FIELD_COST * (1 + data.playerData.catnipFields * GameConstants.CATNIP_FIELD_PRICE_RATIO);
        const canAfford = data.playerData.catnip >= currentCost;

//        meshEntity.style.tintColor.set(canAfford ? GameConstants.GREEN_COLOR : GameConstants.RED_COLOR);
        this.purchasePlatform.style.tintColor.set(canAfford ? GameConstants.GREEN_COLOR : GameConstants.RED_COLOR);

        const newText = `${currentCost}<br>catnip<br>needed`;
        this.purchaseText.text.set(newText);

    }
   
}

hz.Component.register(CatnipFieldInteraction);