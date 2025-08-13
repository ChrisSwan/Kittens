// This script is modified to manage game time and resource production for ALL players.
// It MUST run on the server (Default Execution Mode).

import * as hz from 'horizon/core';
import { PlayerDataManager } from './PlayerDataManager'; // Import the new PlayerDataManager
import {
    TICK_DURATION_SECONDS,
    TICKS_PER_DAY,
    BASE_CATNIP_PRODUCTION_PER_SECOND // Still used for base calculation in PlayerCatnipData
} from './GameConstants'; // Import constants from the shared file

/**
 * The TimeManager class handles the game's internal time system,
 * including ticks and days. It acts as the main orchestrator for the game loop,
 * coordinating with player-specific resource management.
 *
 * This script serves as a central entry point for the game loop in a multiplayer Horizon Worlds environment.
 * It *must* run on the server (Default Execution Mode) to manage all connected players.
 */
export class TimeManager extends hz.Component<typeof TimeManager> {
    static propsDefinition = {}; // This manager itself doesn't need specific configurable properties.

    private _accumulatedTime: number = 0; // Time accumulated towards the next game tick.
    private _currentTick: number = 0; // Current tick within the day.
    private _currentDay: number = 0; // Current game day.

    /**
     * The `start()` method is called once when the world begins [5, 41].
     * It initializes the game's time tracking and sets up the continuous game loop.
     */
    start(): void {
        console.log("TimeManager: Initializing game loop...");

        // Connect to the `World.onUpdate` event, which fires every frame [16, 47, 48].
        // This is the standard way to implement a continuous game loop in Horizon Worlds [16].
        // `deltaTime` provides the time passed in seconds since the last frame [16, 49].
        this.connectLocalBroadcastEvent(
            hz.World.onUpdate,
            (data: { deltaTime: number }) => {
                this.updateTime(data.deltaTime);
            }
        );

        console.log("TimeManager: Game loop is now active.");
    }

    /**
     * This function is called every frame to update the game's time and resource systems.
     * It progresses game ticks and orchestrates the distribution of resources to all active players.
     * @param deltaTime The time passed in seconds since the last frame.
     */
    private updateTime(deltaTime: number): void {
        this._accumulatedTime += deltaTime;

        // Process game ticks when enough real-world time has accumulated.
        while (this._accumulatedTime >= TICK_DURATION_SECONDS) {
            this._accumulatedTime -= TICK_DURATION_SECONDS;
            this._currentTick++;

            // Process game logic (like catnip production) for all active players in the world.
            this.processTickForPlayers();

            // Advance to the next day if the current day's ticks are complete.
            if (this._currentTick >= TICKS_PER_DAY) { // Each day consists of 10 ticks [5]
                this._currentDay++;
                this._currentTick = 0;
//                console.log(`TimeManager: === New Day: Day ${this._currentDay} ===`);
            }

//            console.log(`TimeManager: Tick ${this._currentTick}/${TICKS_PER_DAY} of Day ${this._currentDay}.`);
        }
    }

    /**
     * Iterates through all active human players in the world and processes
     * their individual game logic for the current tick.
     * This includes adding catnip and potentially attempting to buy catnip fields.
     */
    private processTickForPlayers(): void {
        const playerDataManager = PlayerDataManager.getInstance(); // Get the manager for player data.

        // Retrieve all players currently in the world instance [50, 51].
        // It's important to iterate through them to apply per-player logic.
        this.world.getPlayers().forEach(player => {
            // Exclude the server player, as it does not represent a human participant [42, 43].
            if (player === this.world.getServerPlayer()) {
                return;
            }

            // Get the player's specific game data from the PlayerDataManager.
            const playerCatnipData = playerDataManager.getPlayerCatnipData(player.id);

            if (playerCatnipData) {
                // Calculate total catnip production for this player for this tick.
                // This includes base production and production from their owned fields.
                const totalProductionThisTick = playerCatnipData.calculateTotalCatnipProductionPerSecond() * TICK_DURATION_SECONDS;
                playerCatnipData.addCatnip(totalProductionThisTick); // Add catnip to the player's total.

                // Example: Logic for auto-buying catnip fields.
                // This simulates the game progression where players automatically acquire fields.
                // You can adjust the frequency or conditions for auto-buying as needed.
                if (this._currentTick % 2 === 0) { // Attempt to buy a field every 2 ticks for demonstration.
                    playerCatnipData.tryBuyCatnipField();
                }
/*
                // Log the player's current game state for debugging and monitoring.
                console.log(
                    `  Player ${player.name.get()} (ID: ${player.id}): ` +
                    `Catnip: ${playerCatnipData.getCatnip().toFixed(2)}, ` +
                    `Fields: ${playerCatnipData.getCatnipFields()}, ` +
                    `Next Field Price: ${playerCatnipData.getNextCatnipFieldPrice().toFixed(2)}`
                );
*/                
            } else {
                console.warn(`TimeManager: No PlayerCatnipData found for player ${player.name.get()} (ID: ${player.id}).`);
            }
        });
    }
}

// Register the TimeManager component with the Horizon engine.
// This is necessary for the script to be recognized and attachable to an entity in the world.
hz.Component.register(TimeManager);