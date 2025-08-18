// CatnipGenerator.ts
import * as hz from 'horizon/core';
import { GameConstants, PlayerData } from 'GameConstants';
import { PlayerDataManager } from 'PlayerDataManager'; // Import PlayerDataManager for interaction

export class CatnipGenerator extends hz.Component<typeof CatnipGenerator> {
    static propsDefinition = {};

    private generationIntervalId: number = -1;
    private readonly generationFrequencySeconds: number = 1; // Controls how often catnip is generated (every 1 second) [Outline].

    override start() {
        console.log("CatnipGenerator started.");

        // Start a periodic interval to generate catnip for all players.
        // `async.setInterval` is used for recurring time-based operations [17, 18].
        this.generationIntervalId = this.async.setInterval(
            this.generateCatnipForAllPlayers.bind(this),
            this.generationFrequencySeconds * 1000 // Convert seconds to milliseconds for setInterval.
        );
    }

    override dispose() {
        // Clean up the interval when the component is disposed to prevent memory leaks [19, 20].
        if (this.generationIntervalId !== -1) {
            this.async.clearInterval(this.generationIntervalId);
            this.generationIntervalId = -1;
            console.log("CatnipGenerator interval cleared.");
        }
    }

    /**
     * Calculates and applies catnip generation for all active players in the world.
     */
    private async generateCatnipForAllPlayers() {
        // Ensure the singleton instance of PlayerDataManager is available before proceeding.
        if (!PlayerDataManager.s_instance) {
            console.warn("CatnipGenerator: PlayerDataManager instance not available. Cannot generate catnip.");
            return;
        }

        const players = this.world.getPlayers(); // Get all players currently in the world instance [21].
        for (const player of players) {
            // Skip server player and players in build mode as they are not "game" players [22].
            if (player.id === this.world.getServerPlayer().id || player.isInBuildMode.get()) {
                continue;
            }

            let playerData = PlayerDataManager.s_instance.getPlayerData(player);

            if (playerData) {
                // Calculate total catnip generated based on base rate and owned catnip fields [Outline].
                const catnipGenerated =
                    GameConstants.BASE_CATNIP_PER_SECOND +
                    (GameConstants.CATNIP_PER_FIELD_PER_SECOND * playerData.catnipFields);

                // Update the player's catnip amount.
                const newCatnip = playerData.catnip + catnipGenerated;
                playerData.catnip = newCatnip;

                // Save the updated player data back through the PlayerDataManager.
                await PlayerDataManager.s_instance.setPlayerData(player, playerData);
                // console.log(`${player.name.get()} gained ${catnipGenerated} catnip. Total: ${newCatnip}`); // Uncomment for detailed logging during development.
            } else {
                console.warn(`CatnipGenerator: Player data not found for ${player.name.get()}. Skipping catnip generation.`);
            }
        }
    }
}

hz.Component.register(CatnipGenerator);