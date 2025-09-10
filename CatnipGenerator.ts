import * as hz from 'horizon/core';
import { GameConstants } from 'GameConstants';
import { PlayerDataManager } from 'PlayerDataManager';
import { ServiceLocator_Data } from 'ServiceLocator_Data'; // Essential for accessing the globally registered TimeManager.
import { ITimeManager } from 'ITimeManager'; // Used for type safety when referencing the TimeManager.


export class CatnipGenerator extends hz.Component<typeof CatnipGenerator> {
    static propsDefinition = {};
    private timeManager!: ITimeManager; // A reference to the TimeManager instance, obtained via ServiceLocator_Data.

    override preStart(): void {
        // Retrieves the TimeManager instance from the Service Locator. This is safe to do in preStart
        // because TimeManager registers itself at the same phase.
        this.timeManager = ServiceLocator_Data.timeManager;
    }

    override start() {
        console.log("CatnipGenerator started.");
        // Connects to the TimeManager's `onDayEvent`. This replaces the previous `setInterval` logic,
        // ensuring catnip generation occurs precisely once per game day [2].
        this.connectLocalBroadcastEvent(this.timeManager.onDayEvent, this.handleDayEvent.bind(this));
    }

    private handleDayEvent(data: { dayNumber: number }): void {
//        console.log(`CatnipGenerator: Processing day ${data.dayNumber} for catnip generation.`);
        this.generateCatnipForAllPlayers();
    }

    private async generateCatnipForAllPlayers(): Promise<void> {
        const players = this.world.getPlayers();
        for (const player of players) {
            const playerData = PlayerDataManager.s_instance.getPlayerData(player);

            if (!playerData) {
                console.warn(`CatnipGenerator: Player data not found for ${player.name.get()}. Skipping catnip generation.`);
                continue;
            }

            // Calculate the total catnip generated for one game day.
            // This includes the constant base rate per second and the rate per field per second,
            // both multiplied by the number of real-world seconds in a game day.
            const baseCatnipProduction = GameConstants.BASE_CATNIP_PER_SECOND * GameConstants.SECONDS_PER_DAY;
            const fieldsCatnipProduction = GameConstants.CATNIP_PER_FIELD_PER_SECOND * playerData.catnipFields * GameConstants.SECONDS_PER_DAY;

            const totalCatnipGenerated = baseCatnipProduction + fieldsCatnipProduction;

            playerData.catnip += totalCatnipGenerated;
            // Updates the player's data persistently through the PlayerDataManager.
            await PlayerDataManager.s_instance.setPlayerData(player, playerData);

            // Optional: Uncomment for debugging output of each player's catnip total.
//            console.log(`CatnipGenerator: ${player.name.get()} now has ${playerData.catnip.toFixed(2)} catnip.`);
        }
    }
}

hz.Component.register(CatnipGenerator);