import * as hz from 'horizon/core';
import { GameConstants, PlayerData } from 'GameConstants'; // Import constants and PlayerData type
import { ServiceLocator_Data } from 'ServiceLocator_Data';
import { IPlayerDataManager } from 'IPlayerDataManager';

// Define NetworkEvents for player data changes.
// These events allow other scripts (especially client-side ones if implemented in future versions)
// to react to player data being loaded or updated, promoting loose coupling.
export const PlayerDataEvents = {
    onPlayerDataLoaded: new hz.NetworkEvent<{ player: hz.Player, playerData: PlayerData }>('onPlayerDataLoaded'),
    onPlayerDataUpdated: new hz.NetworkEvent<{ player: hz.Player, playerData: PlayerData }>('onPlayerDataUpdated'),
};

export class PlayerDataManager extends hz.Component<typeof PlayerDataManager> implements IPlayerDataManager {
    static propsDefinition = {};

    // **Singleton instance**: This static property provides easy access to this manager from other scripts.
    // It's a common pattern in Horizon Worlds for centralized managers [1, 2].
    static s_instance: PlayerDataManager;

    // A Map to hold player data in memory. Key: Player ID, Value: PlayerData.
    // This provides quick access to player data during runtime [3].
    private playerDataMap: Map<number, PlayerData> = new Map<number, PlayerData>();

    /**
     * `preStart()` is guaranteed to run for all components before any component's `start()` method is called [4, 5].
     * It's ideal for connecting to events that need to be active immediately upon world load.
     */
    override preStart() {
        // Assign the singleton instance upon initialization.
        PlayerDataManager.s_instance = this;
        ServiceLocator_Data.playerDataManager = this;

        // Listen for players entering the world to load their saved data.
        // `OnPlayerEnterWorld` is a built-in CodeBlockEvent sent to server-owned entities [3, 6].
        this.connectCodeBlockEvent(
            this.entity,
            hz.CodeBlockEvents.OnPlayerEnterWorld,
            this.handlePlayerEnterWorld.bind(this) // Bind 'this' to maintain context within the callback.
        );

        // Listen for players exiting the world to save their current data persistently.
        // `OnPlayerExitWorld` is also a built-in CodeBlockEvent [7, 8].
        this.connectCodeBlockEvent(
            this.entity,
            hz.CodeBlockEvents.OnPlayerExitWorld,
            this.handlePlayerExitWorld.bind(this)
        );
        console.log("PlayerDataManager Prestart complete.");
    }

    override start() {
        // `start()` is called when the component is fully initialized [4].
        console.log("PlayerDataManager started.");
    }

    /**
     * Handles a player entering the world, attempting to load their saved data.
     * If no data is found, it initializes new player data with default starting values.
     * @param player The player entity that entered the world.
     */
    private async handlePlayerEnterWorld(player: hz.Player) {
        // Retrieve player data from persistent storage using the defined PPV key [9-11].
        let playerData: PlayerData | null =
            await this.world.persistentStorage.getPlayerVariable<PlayerData>(
                player,
                GameConstants.PLAYER_DATA_PPV_KEY
            );

//        if (playerData === null || playerData === undefined) {
        if (!playerData) {
                // If no persistent data exists, initialize a new PlayerData object.
            playerData = {
                catnip: GameConstants.STARTING_CATNIP,
                catnipFields: GameConstants.STARTING_CATNIP_FIELDS,
            };
            // Save this initial data immediately to persistent storage.
            await this.world.persistentStorage.setPlayerVariable(
                player,
                GameConstants.PLAYER_DATA_PPV_KEY,
                playerData
            );
            console.log(`Initialized new player data for ${player.name.get()}:`, playerData);
        } else {
            console.log(`Loaded player data for ${player.name.get()}:`, playerData);
        }

        // Store the retrieved or initialized data in the in-memory map for quick access during gameplay.
        this.playerDataMap.set(player.id, playerData);

        // Broadcast an event that player data has been loaded.
        this.sendNetworkBroadcastEvent(PlayerDataEvents.onPlayerDataLoaded, { player, playerData });
    }

    /**
     * Handles a player exiting the world, saving their current in-memory data to persistent storage.
     * @param player The player entity that exited the world.
     */
    private async handlePlayerExitWorld(player: hz.Player) {
        // Retrieve data from the in-memory map.
        const playerData = this.playerDataMap.get(player.id);
        if (playerData) {
            // Save the data to persistent storage [12-14].
            await this.world.persistentStorage.setPlayerVariable(
                player,
                GameConstants.PLAYER_DATA_PPV_KEY,
                playerData
            );
            console.log(`Saved player data for ${player.name.get()}:`, playerData);
            this.playerDataMap.delete(player.id); // Remove from in-memory map as the player is no longer in the instance.
        } else {
            console.warn(`Attempted to save data for ${player.name.get()}, but no data found in map.`);
        }
    }

    /**
     * Public method to retrieve a player's current data from the in-memory map.
     * @param player The player whose data is requested.
     * @returns The PlayerData object or undefined if not found.
     */
    public getPlayerData(player: hz.Player): PlayerData | undefined {
        return this.playerDataMap.get(player.id);
    }

    /**
     * Public method to update a player's data and save it to persistent storage.
     * Other scripts should call this method to modify player data, ensuring consistency.
     * @param player The player whose data is being updated.
     * @param newPlayerData The updated PlayerData object.
     */
    public async setPlayerData(player: hz.Player, newPlayerData: PlayerData) {
        // Update the in-memory map.
        this.playerDataMap.set(player.id, newPlayerData);

        // Save immediately to persistent storage.
        // For performance-critical scenarios, this could be batched or debounced.
        await this.world.persistentStorage.setPlayerVariable(
            player,
            GameConstants.PLAYER_DATA_PPV_KEY,
            newPlayerData
        );

//        console.log(`Updated player data for ${player.name.get()}:`, newPlayerData);
        // Broadcast an event that player data has been updated.
        this.sendNetworkBroadcastEvent(PlayerDataEvents.onPlayerDataUpdated, { player, playerData: newPlayerData });
    }

    /**
     * Public method to reset a player's data to its initial state (defined in GameConstants).
     * @param player The player whose data should be reset.
     */
    public async resetPlayerData(player: hz.Player) {
        const initialData: PlayerData = {
            catnip: GameConstants.STARTING_CATNIP,
            catnipFields: GameConstants.STARTING_CATNIP_FIELDS,
        };
        await this.setPlayerData(player, initialData);
        console.log(`Reset player data for ${player.name.get()}`);
    }
}

// Register the component so it can be attached to an entity in Horizon Worlds [15, 16].
hz.Component.register(PlayerDataManager);