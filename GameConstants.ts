// GameConstants.ts
// Centralized repository for static, immutable game values.

export const GameConstants = {
    // Initial player resources
    STARTING_CATNIP: 10, // The amount of catnip a new player starts with.
    STARTING_CATNIP_FIELDS: 0, // The number of catnip fields a new player starts with.

    // Catnip field properties
    CATNIP_FIELD_COST: 100, // The cost in catnip to purchase one catnip field.
    BASE_CATNIP_PER_SECOND: 1, // The base amount of catnip generated per second for each player.
    CATNIP_PER_FIELD_PER_SECOND: 5, // The additional catnip generated per second for each purchased catnip field.

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