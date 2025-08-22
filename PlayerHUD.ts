import * as hz from 'horizon/core';
import { UIComponent, View, Text, Binding, ViewStyle, UINode, TextStyle } from 'horizon/ui';
import { PlayerDataManager, PlayerDataEvents } from 'PlayerDataManager';
import { PlayerData } from 'GameConstants'; // Assuming PlayerData type is exported from GameConstants

class PlayerHUD extends UIComponent<typeof PlayerHUD> {
    static propsDefinition: {};

    // A Binding is used to dynamically update the text displayed on the UI.
    // It's initialized with a default string [2-4].
    private catnipAmountBinding = new Binding<string>("Catnip: 0");

    preStart() {
        // This method is called before start() and is ideal for setting up event listeners [5].
        // We subscribe to a network broadcast event that is sent by PlayerDataManager
        // whenever any player's data (including catnip) is updated [6, 7].
        this.connectNetworkBroadcastEvent(
            PlayerDataEvents.onPlayerDataUpdated,
            (data: { player: hz.Player, playerData: PlayerData }) => {
                this.updateCatnipDisplay(data.player, data.playerData);
            }
        );
    }
    
    initializeUI() {
        // `initializeUI()` is an abstract method that you must override to define the UI's structure [8].
        // This check prevents the UI from being rendered for the server player, as UIComponents in Local mode
        // are meant for individual players
/*        
        if (this.world.getLocalPlayer() === this.world.getServerPlayer()) {
            return UINode.empty(); // Returns an empty node if it's the server player.
        }
*/
        // Define the visual style for the catnip display text.
        // The design specifies the text should be clearly readable on mobile and white [1].
//        const catnipTextStyle: ViewStyle = {
        const catnipTextStyle: TextStyle = {
            position: "absolute",
            top: "5%", // Positions the text at 5% from the top of the screen.
            left: "50%", // Centers the text horizontally.
//            transform: "translate(-50%, 0)", // Adjusts the horizontal centering more precisely.
            color: "white", // Sets the text color to white [1].
            fontSize: 28, // Sets a readable font size [1].
            fontWeight: "bold", // Makes the text bold for better readability.
            alignSelf: "center", // Aligns content to the center within its container.
            textAlign: "center", // Centers the text horizontally within its own bounds.
            // fontFamily: "Roboto", // You can uncomment and choose a specific font if available.
        };

        // Returns a View, which acts as a container for other UI elements [2, 11].
        return View({
            children: [
                Text({
                    text: this.catnipAmountBinding, // The text property is bound to our `catnipAmountBinding` [2, 3].
                    style: catnipTextStyle,
                }),
            ],
        });
    }

    /**
     * Updates the catnip display for the owning player.
     * This method is called when player data is updated via the `onPlayerDataUpdated` event [6].
     * @param updatedPlayer The player whose data was updated.
     * @param updatedPlayerData The new player data containing the catnip amount.
     */
    private updateCatnipDisplay(updatedPlayer: hz.Player, updatedPlayerData: PlayerData) {
        const localPlayer = this.world.getLocalPlayer();

        // It is crucial to only update the UI if this specific UI instance is owned
        // by the player whose data was actually updated [10, 12].
        if (localPlayer && localPlayer.id === updatedPlayer.id) {
            // Update the binding with the new catnip value, formatted to a whole number.
            // The `[localPlayer]` argument ensures this update only affects the UI of this specific player [12].
            this.catnipAmountBinding.set(`Catnip: ${updatedPlayerData.catnip.toFixed(0)}`, [localPlayer]);
        }
    }
}

// Registers the component so it can be attached to an entity in Horizon Worlds [13, 14].
UIComponent.register(PlayerHUD);