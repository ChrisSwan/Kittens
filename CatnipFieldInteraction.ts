// CatnipFieldInteraction.ts
import * as hz from 'horizon/core';
import { GameConstants, PlayerData } from 'GameConstants';
import { PlayerDataEvents } from 'PlayerDataManager';
import { GameEvents } from 'Events';

export class CatnipFieldInteraction extends hz.Component<typeof CatnipFieldInteraction> {
    static propsDefinition = {
        purchasePlatformMesh: { type: hz.PropTypes.Entity },
        catnipPurchaseText: { type: hz.PropTypes.Entity},
        purchaseTriggerBox: { type: hz.PropTypes.Entity },
        playerManagerEntity: { type: hz.PropTypes.Entity },
    }; // This component doesn't require specific properties.

    private _purchasePlatformMesh!: hz.MeshEntity;
    private _purchaseText! : hz.TextGizmo;
    private _purchaseTriggerBox! : hz.TriggerGizmo;
    private _playerManagerEntity!: hz.Entity;   // Used to broadcast events to the Player Manager on server side

    override preStart() {
        // Validates that the 'purchasePlatformMesh' property is set and stores a typed reference to it.
        // If not set, a warning is logged as visual feedback will not function.
        if (this.props.purchasePlatformMesh) {
            this._purchasePlatformMesh = this.props.purchasePlatformMesh.as(hz.MeshEntity);
            this._purchasePlatformMesh.visible.set(true);
        } else {
            console.error("CatnipFieldInteraction: Missing 'purchasePlatformMesh' property. Platform color changes will not work.");
        }
        if (this.props.catnipPurchaseText) {
            this._purchaseText = this.props.catnipPurchaseText.as(hz.TextGizmo);
            this._purchaseText.visible.set(true);
        } else {
            console.error("CatnipFieldInteraction: Missing 'purchaseFieldText' property. Cannot display text needed.");
        }
        if (this.props.purchaseTriggerBox) {
            this._purchaseTriggerBox = this.props.purchaseTriggerBox.as(hz.TriggerGizmo);
        } else {
            console.error("CatnipFieldInteraction: Missing 'purchaseTriggerBox' property. Cannot display text needed.");
        }
        if (this.props.playerManagerEntity) {
            this._playerManagerEntity = this.props.playerManagerEntity;
        } else {
            console.error("CatnipFieldInteraction: Missing 'playerManagerEntity' property. Cannot send purchase requests.");
        }        
        // Connect to the `OnPlayerEnterTrigger` event for the entity this script is attached to.
        // This means the entity needs to have a `Trigger Gizmo` attached and configured.
        this.connectCodeBlockEvent(
            this._purchaseTriggerBox,
            hz.CodeBlockEvents.OnPlayerEnterTrigger,
            this.handlePlayerEnterTrigger.bind(this) // Bind 'this' to maintain context within the callback.
        );

        // Subscribes to the `onPlayerDataUpdated` network event broadcast by `PlayerDataManager`
        // This allows the purchase platform's visual state to update in real-time as a player's catnip or fields change
        this.connectNetworkBroadcastEvent(
            PlayerDataEvents.onPlayerDataUpdated,
            (data: { player: hz.Player, playerData: PlayerData }) => {
                this.updatePurchasePlatformColor(data);
            }
        );
    }

    override start() {
    }

    private async handlePlayerEnterTrigger(player: hz.Player) {

        // Check for ownership so that only the owning player can purchase
        if (player != this.entity.owner.get()) {
            console.log(`Incorrect player (ID: ${player.id}) has stepped on platform owned by player ${this.entity.owner.get().id})`);
            this.world.ui.showPopupForPlayer(player, "You can only purchase from your own plot!", 3000);
            return;
        }
        else {
            console.log(`Correct player (ID: ${player.id}) has stepped on platform owned by player ${this.entity.owner.get().id})`);
        }

        // Send a Network Event to the server-side PlayerManager to request the purchase
        if (this._playerManagerEntity && this._playerManagerEntity.exists()) {
            this.sendNetworkEvent(
                this._playerManagerEntity, // Target the server-owned PlayerManager entity
                GameEvents.OnPurchaseCatnipFieldRequest,
                { player: player, platformEntityId: this.entity.id.toString() } // Send relevant info
            );
            console.log(`CatnipFieldInteraction: Sent purchase request for ${player.name.get()} to PlayerManager.`);
        } else {
            console.error("CatnipFieldInteraction: PlayerManager entity is not available to send purchase request.");
        }

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

        const currentCost = GameConstants.CATNIP_FIELD_COST * (1 + data.playerData.catnipFields * GameConstants.CATNIP_FIELD_PRICE_RATIO);
        const canAfford = data.playerData.catnip >= currentCost;

        this._purchasePlatformMesh.style.tintColor.set(canAfford ? GameConstants.GREEN_COLOR : GameConstants.RED_COLOR);

        const newText = `${currentCost}<br>catnip<br>needed`;
        this._purchaseText.text.set(newText);
//        console.log(`text updated to: ${newText}`);

    }
   
}

hz.Component.register(CatnipFieldInteraction);