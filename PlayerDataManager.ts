// This component manages loading, saving, and in-memory access of player-specific game data.
// It MUST run on the server (Default Execution Mode) to interact with Player Persistent Variables (PPVs).

import * as hz from 'horizon/core';
import { PlayerCatnipData } from './PlayerCatnipData';
import { PLAYER_DATA_VARIABLE_GROUP, PLAYER_CATNIP_DATA_KEY, IPlayerCatnipData } from './GameConstants';

/**
 * Manages the loading, saving, and in-memory access of player-specific game data.
 * This component handles the interaction with Player Persistent Variables (PPVs),
 * ensuring that each player's progress is loaded when they enter the world and
 * saved when they exit.
 */
export class PlayerDataManager extends hz.Component<typeof PlayerDataManager> {
    static propsDefinition = {}; // No configurable properties are needed for this manager.

    // A Map to store the live PlayerCatnipData instance for each active player,
    // keyed by their unique player ID (number) [35].
    private activePlayerCatnipData: Map<number, PlayerCatnipData> = new Map<number, PlayerCatnipData>();

    // Static instance for easy global access to the manager,
    // similar to the singleton pattern used in original sources [3, 36, 37].
    private static _instance: PlayerDataManager | null = null;

    /**
     * Gets the singleton instance of PlayerDataManager.
     * This allows other scripts to access player data without direct references.
     * @returns The PlayerDataManager instance. Throws an error if not yet initialized.
     */
    public static getInstance(): PlayerDataManager {
        if (!PlayerDataManager._instance) {
            // This error indicates the component needs to be attached to an entity and started in the world.
            throw new Error("PlayerDataManager not initialized. Ensure it is attached to an entity and running.");
        }
        return PlayerDataManager._instance;
    }

    /**
     * `preStart()` is called before any `start()` methods in the world [38, 39].
     * This is an ideal place to set up the static instance.
     */
    preStart(): void {
        PlayerDataManager._instance = this; // Set the static instance for global access.
        console.log("PlayerDataManager: preStart completed. Instance set.");
    }

    /**
     * `start()` is called once when this component is initialized in the world [40, 41].
     * It sets up listeners for players entering and exiting the world instance.
     */
    start(): void {
        console.log("PlayerDataManager: Initializing...");

        // Connect to the OnPlayerEnterWorld event to load or initialize player data.
        // This is a server-broadcast CodeBlockEvent, ideal for managing player states [12].
        this.connectCodeBlockEvent(
            this.entity,
            hz.CodeBlockEvents.OnPlayerEnterWorld,
            (player: hz.Player) => this.handlePlayerEnter(player)
        );

        // Connect to the OnPlayerExitWorld event to save player data.
        // This event is crucial for persisting data when a player leaves the world [13, 14].
        this.connectCodeBlockEvent(
            this.entity,
            hz.CodeBlockEvents.OnPlayerExitWorld,
            (player: hz.Player) => this.handlePlayerExit(player)
        );

        console.log("PlayerDataManager: Ready for player management.");
    }

    /**
     * Handles a player entering the world.
     * Attempts to load their saved persistent data or creates new data if none exists.
     * @param player The Horizon player entity that entered the world.
     */
    private async handlePlayerEnter(player: hz.Player): Promise<void> {
        // Exclude the server player from active player management, as they don't represent a human player [42, 43].
        if (player === this.world.getServerPlayer()) {
            return;
        }

        console.log(`PlayerDataManager: Player ${player.name.get()} (${player.id}) detected entering the world.`);

        // Player Persistent Variables (PPVs) are key for saving player-local data across sessions [4, 7].
        // Access the player's stored data using `getPlayerVariable`.
        let playerData: IPlayerCatnipData | null =
            this.world.persistentStorage.getPlayerVariable<IPlayerCatnipData>(
                player,
                `${PLAYER_DATA_VARIABLE_GROUP}:${PLAYER_CATNIP_DATA_KEY}`
            );

        let playerCatnipData: PlayerCatnipData;
        // Check if loaded data is valid and of the expected version/kind [30-32, 44].
        if (playerData && playerData.kind === "PlayerCatnipData" && playerData.version === 1) {
            // If valid data exists, create a PlayerCatnipData instance from it.
            playerCatnipData = new PlayerCatnipData(playerData);
            console.log(`PlayerDataManager: Loaded persistent data for ${player.name.get()}: Catnip: ${playerCatnipData.getCatnip().toFixed(2)}, Fields: ${playerCatnipData.getCatnipFields()}.`);
        } else {
            // If no valid data or it's an old version, initialize a new PlayerCatnipData.
            playerCatnipData = new PlayerCatnipData();
            console.log(`PlayerDataManager: Initialized new data for first-time player ${player.name.get()}.`);
        }

        // Store the live PlayerCatnipData instance in the map for active players.
        this.activePlayerCatnipData.set(player.id, playerCatnipData);
    }

    /**
     * Handles a player exiting the world.
     * Saves their current `PlayerCatnipData` to persistent storage.
     * @param player The Horizon player entity who exited the world.
     */
    private handlePlayerExit(player: hz.Player): void {
        // Exclude the server player.
        if (player === this.world.getServerPlayer()) {
            return;
        }

        const playerCatnipData = this.activePlayerCatnipData.get(player.id);
        if (playerCatnipData) {
            // Save the player's current game data to Player Persistent Variables [7, 45, 46].
            // The `toPersistableData()` method ensures the data is correctly formatted for saving.
            this.world.persistentStorage.setPlayerVariable(
                player,
                `${PLAYER_DATA_VARIABLE_GROUP}:${PLAYER_CATNIP_DATA_KEY}`,
                playerCatnipData.toPersistableData()
            );
            // Remove the player's data from the active map as they have left the instance.
            this.activePlayerCatnipData.delete(player.id);
            console.log(`PlayerDataManager: Saved and cleared active data for exiting player ${player.name.get()} (${player.id}).`);
        } else {
            console.warn(`PlayerDataManager: No active data found for exiting player ${player.name.get()} (${player.id}). This may indicate an issue if data should have been present.`);
        }
    }

    /**
     * Provides access to a specific player's live game data.
     * This method is used by other game systems (like TimeManager) to get and modify player states.
     * @param playerId The numerical ID of the player.
     * @returns The PlayerCatnipData instance for the given player, or `undefined` if the player is not currently active.
     */
    public getPlayerCatnipData(playerId: number): PlayerCatnipData | undefined {
        return this.activePlayerCatnipData.get(playerId);
    }
}

// Register the PlayerDataManager component with the Horizon engine.
// This allows it to be attached to an entity in the world editor.
hz.Component.register(PlayerDataManager);