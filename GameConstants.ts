// GameConstants.ts
// This file centralizes game-wide constants and data structures for consistency.

import * as hz from 'horizon/core';

// PPV Configuration: Defines the variable group and key for player-specific data.
export const PLAYER_DATA_VARIABLE_GROUP = "KittensGameData";
export const PLAYER_CATNIP_DATA_KEY = "playerProgress";

// Interface for Player Persistent Variable data.
// It includes 'kind' and 'version' for future data migration and type safety, as recommended [30-32].
export interface IPlayerCatnipData {
    kind: "PlayerCatnipData";
    version: 1;
    catnip: number;
    catnipFields: number;
    nextCatnipFieldPrice: number;
    // Add the string index signature:
    [key: string]: any; // NFI why I need this, as it doesn't seem to be in any of the examples. If I use the line below I get even more errors :-(
//    [key: string]: number | string | boolean | bigint | null | undefined; // Or more specific if all properties are covered
}

// Game Balance Constants (derived from original user queries/sources):
// From source [1]: "The user requested the first field to be bought when 10 catnip is accumulated [user query]."
export const BASE_CATNIP_FIELD_PRICE = 10;
// From source [1]: "This multiplier is a common convention in incremental games for scaling building prices [user query]."
export const CATNIP_FIELD_PRICE_MULTIPLIER = 1.15; // A common incremental game multiplier (common knowledge, not in sources)

// From source [5]: "Base catnip production not tied to fields, as requested by user.
// This is a fixed rate gained regardless of fields, provided by the TimeManager."
export const BASE_CATNIP_PRODUCTION_PER_SECOND = 1; // 1 catnip per real-world second [user query]
// From source [5]: "Each day consists of 10 ticks [33]."
export const TICKS_PER_DAY = 10;
// From source [5]: TICK_DURATION_SECONDS is 0.2
export const TICK_DURATION_SECONDS = 0.2;

// From source [2]: "The original Kittens Game has a catnip storage cap of 5000 [34]."
export const CATNIP_STORAGE_CAP = 5000;