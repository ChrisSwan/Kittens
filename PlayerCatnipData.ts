// This class encapsulates a single player's game state for catnip and fields.

import * as hz from 'horizon/core';
import {
    IPlayerCatnipData,
    BASE_CATNIP_FIELD_PRICE,
    CATNIP_FIELD_PRICE_MULTIPLIER,
    CATNIP_STORAGE_CAP,
    BASE_CATNIP_PRODUCTION_PER_SECOND
} from './GameConstants';

/**
 * Manages a single player's catnip resource quantity, catnip fields,
 * and related economic logic.
 * This class encapsulates the per-player game state for catnip and fields,
 * effectively replacing the global singleton CatnipManager and CatnipFieldManager for multiplayer.
 */
export class PlayerCatnipData {
    private _catnip: number;
    private _catnipFields: number;
    private _nextCatnipFieldPrice: number; // Price for the *next* field

    /**
     * Constructs a new PlayerCatnipData instance.
     * Initializes with provided data (from persistence) or default values for a new player.
     * @param initialData Optional. Data loaded from Player Persistent Variables.
     */
    constructor(initialData?: IPlayerCatnipData) {
        // If initial data is provided and matches the expected kind/version, load it.
        if (initialData && initialData.kind === "PlayerCatnipData" && initialData.version === 1) {
            this._catnip = initialData.catnip;
            this._catnipFields = initialData.catnipFields;
            this._nextCatnipFieldPrice = initialData.nextCatnipFieldPrice;
        } else {
            // Default initial state for a new player or if data is missing/old version.
            this._catnip = 0;
            this._catnipFields = 0;
            this._nextCatnipFieldPrice = BASE_CATNIP_FIELD_PRICE; // First field price [1]
        }
    }

    /**
     * Updates the catnip quantity for this player.
     * Ensures the quantity respects the catnip storage cap and doesn't go below zero.
     * @param amount The amount of catnip to add (can be positive or negative).
     */
    public addCatnip(amount: number): void {
        this._catnip += amount;
        // Apply storage cap, as in the original Kittens Game [2, 34]
        if (this._catnip > CATNIP_STORAGE_CAP) {
            this._catnip = CATNIP_STORAGE_CAP;
        }
        // Prevent negative catnip amounts
        if (this._catnip < 0) {
            this._catnip = 0;
        }
    }

    /**
     * Gets the current amount of catnip for this player.
     * @returns The current catnip quantity.
     */
    public getCatnip(): number {
        return this._catnip;
    }

    /**
     * Gets the current number of catnip fields for this player.
     * @returns The current catnip fields count.
     */
    public getCatnipFields(): number {
        return this._catnipFields;
    }

    /**
     * Gets the price for the next catnip field.
     * @returns The price of the next catnip field.
     */
    public getNextCatnipFieldPrice(): number {
        return this._nextCatnipFieldPrice;
    }

    /**
     * Calculates the total catnip production per second for this player.
     * This includes the base production (as requested by the user) and production from acquired fields.
     * @returns The total catnip produced per second.
     */
    public calculateTotalCatnipProductionPerSecond(): number {
        // Assuming each catnip field produces 1 catnip per second (a common incremental game convention).
        const fieldProduction = this._catnipFields * 1;
        // Include the base catnip production not tied to fields, as requested by user [5].
        return fieldProduction + BASE_CATNIP_PRODUCTION_PER_SECOND;
    }

    /**
     * Attempts to buy a new catnip field for this player.
     * Checks if the player has enough catnip, deducts the cost,
     * increments field count, and updates the price for the next field.
     * @returns True if the field was successfully bought, false otherwise.
     */
    public tryBuyCatnipField(): boolean {
        // Check if player has enough catnip to buy the next field.
        if (this._catnip >= this._nextCatnipFieldPrice) {
            this._catnip -= this._nextCatnipFieldPrice; // Deduct cost.
            this._catnipFields += 1; // Increment field count.

            // Update the price for the next field based on a common incremental game multiplier [1].
            this._nextCatnipFieldPrice = Math.round(this._nextCatnipFieldPrice * CATNIP_FIELD_PRICE_MULTIPLIER);

            console.log(`PlayerCatnipData: Successfully bought catnip field. Fields: ${this._catnipFields}, Catnip: ${this._catnip.toFixed(2)}.`);
            return true;
        } else {
//            console.log(`PlayerCatnipData: Not enough catnip to buy field. Need ${this._nextCatnipFieldPrice}, Have ${this._catnip.toFixed(2)}.`);
            return false;
        }
    }

    /**
     * Resets this player's catnip and field data to its initial state.
     * Useful for debugging or starting a new game session.
     */
    public resetData(): void {
        this._catnip = 0;
        this._catnipFields = 0;
        this._nextCatnipFieldPrice = BASE_CATNIP_FIELD_PRICE;
        console.log("PlayerCatnipData: Data reset.");
    }

    /**
     * Prepares the current state of this player's data for persistence.
     * This method ensures the data structure is suitable for saving as a Player Persistent Variable.
     * It includes 'kind' and 'version' properties for robust data management [30-32].
     * @returns An object conforming to IPlayerCatnipData, ready for persistence.
     */
    public toPersistableData(): IPlayerCatnipData {
        return {
            kind: "PlayerCatnipData",
            version: 1, // Current version of this data structure
            catnip: this._catnip,
            catnipFields: this._catnipFields,
            nextCatnipFieldPrice: this._nextCatnipFieldPrice,
        };
    }
}