import * as hz from 'horizon/core';
import { PlayerData } from 'GameConstants'; // Ensure PlayerData type is imported

export interface IPlayerDataManager {
    // Methods that other scripts (e.g., PlayerManager, CatnipGenerator) will call
    getPlayerData(player: hz.Player): PlayerData | undefined;
    setPlayerData(player: hz.Player, newPlayerData: PlayerData): Promise<void>;
    resetPlayerData(player: hz.Player): Promise<void>;

    // You might also want to expose the broadcast events if other managers need to subscribe directly
    // onPlayerDataLoaded: hz.NetworkEvent<{ player: hz.Player, playerData: PlayerData }>;
    // onPlayerDataUpdated: hz.NetworkEvent<{ player: hz.Player, playerData: PlayerData }>;
}