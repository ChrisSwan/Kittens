// GameConstants.ts
// Centralizd repository for static, immutable game values.
import * as hz from 'horizon/core';

export const GameConstants = {
    // The duration of one game "tick" in milliseconds.
    TICK_DURATION_MS: 200,
    // The number of game "ticks" that constitute one game "day".
    TICKS_PER_DAY: 10,
    SECONDS_PER_DAY: 2,
    
    // Initial player resources
    STARTING_CATNIP: 0, // The amount of catnip a new player starts with.
    STARTING_CATNIP_FIELDS: 0, // The number of catnip fields a new player starts with.

    // Catnip field properties
    CATNIP_FIELD_COST: 10, // The cost in catnip to purchase one catnip field.
    CATNIP_FIELD_PRICE_RATIO: 0.12, // The amount that a field increases in price per purchase
    BASE_CATNIP_PER_SECOND: 1, // The base amount of catnip generated per second for each player.
    CATNIP_PER_FIELD_PER_SECOND: 0.125, // The additional catnip generated per second for each purchased catnip field.

    GREEN_COLOR: new hz.Color(0, 0.5, 0), // Example green color for affordable
    RED_COLOR: new hz.Color(0.5, 0, 0),       // Example red color for unaffordable

    // Persistence variable key
    PLAYER_DATA_PPV_KEY: "KittensGame:playerData", // Unique key for the Player Persistent Variable (PPV) storing player progress.
};

/**
 * @typedef {Object} PlayerData
 * @property {number} catnip - The current amount of catnip the player has.
 * @property {number} catnipFields - The number of catnip fields the player owns.
 */
export type PlayerData = {
    catnip: number;
    catnipFields: number;
};