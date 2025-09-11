import * as hz from 'horizon/core';
import { PlayerDataEvents } from 'PlayerDataManager'; // Assuming PlayerDataManager is accessible
import { PlayerData, GameConstants } from 'GameConstants'; // For constants like colors if needed, though not directly used in this logic snippet

// --- Constants for Catnip Field Visualization ---
const MAX_DISPLAY_FIELDS = 200; // As requested, a maximum of 200 fields
const GRID_DIMENSION = 20; // For a 20x20 grid
const BLOCK_DIMENSION = 5; // To fill in 5x5 blocks

// Adjust these values to control the spacing of your fields
const FIELD_SPACING_X = 5.0; // Horizontal spacing between field meshes
const FIELD_SPACING_Z = 5.0; // Depth/forward spacing between field meshes

// A position far below the playable area to hide unused meshes
const HIDDEN_POSITION = new hz.Vec3(0, -100, 0);

export class CatnipFieldVisualizer extends hz.Component<typeof CatnipFieldVisualizer> {
    // --- Prop Definitions ---
    // Define properties to attach the catnip field mesh asset and the grid origin entity
    static propsDefinition = {
        catnipFieldMeshAsset: { type: hz.PropTypes.Asset }, // The 3D model asset for a single catnip field
        gridOriginEntity: { type: hz.PropTypes.Entity },    // An empty object in your world to serve as the reference point for the grid
    };

    // --- Private Fields ---
    // An array to store all spawned catnip field meshes
    private _spawnedFieldMeshes: hz.Entity[] = [];
    private _gridOriginPosition: hz.Vec3 = hz.Vec3.zero;
    private _gridOriginRotation: hz.Quaternion = hz.Quaternion.one;

    override preStart() {
        // Subscribe to the network event broadcast by PlayerDataManager when player data updates
        // This ensures the visualizer reacts whenever a player buys a new field.
        this.connectNetworkBroadcastEvent(
            PlayerDataEvents.onPlayerDataUpdated,
            (data: { player: hz.Player, playerData: PlayerData }) => {
                // Ensure the update only applies to the local player to manage client-side visuals
/*                
                if (this.world.getLocalPlayer() && this.world.getLocalPlayer()?.id === data.player.id) {
                    this.updateFieldVisuals(data.playerData.catnipFields);
                }
*/                    
                    this.updateFieldVisuals(data.playerData.catnipFields);
            }
        );
    }

    // start() is called when the component is initialized and active
    override async start() {
        // Validate that essential properties are set
        if (!this.props.catnipFieldMeshAsset) {
            console.error("CatnipFieldVisualizer: Missing 'catnipFieldMeshAsset' property. Cannot spawn fields.");
            return;
        }
        if (!this.props.gridOriginEntity) {
            console.error("CatnipFieldVisualizer: Missing 'gridOriginEntity' property. Cannot calculate grid positions.");
            return;
        }

        // Store the grid's origin position and rotation from the reference entity
        this._gridOriginPosition = this.props.gridOriginEntity.position.get();
        this._gridOriginRotation = this.props.gridOriginEntity.rotation.get();

        // Spawn all 200 field meshes at the hidden position and store them
        for (let i = 0; i < MAX_DISPLAY_FIELDS; i++) {
            try {
                // `world.spawnAsset` spawns an asset into the world
                const spawnedObjects = await this.world.spawnAsset(
                    this.props.catnipFieldMeshAsset,
                    HIDDEN_POSITION,      // Initial position far below the map
                    hz.Quaternion.one,    // Default rotation
                    hz.Vec3.one           // Default scale
                );

                if (spawnedObjects.length > 0) {
                    const fieldMesh = spawnedObjects[0]; // Assuming the asset is a single root entity
                    fieldMesh.visible.set(false); // Hide the mesh initially [35-41]
                    this._spawnedFieldMeshes.push(fieldMesh); // Add to our array for management
                } else {
                    console.warn(`CatnipFieldVisualizer: No entities spawned for field index ${i}.`);
                }
            } catch (error) {
                console.error(`CatnipFieldVisualizer: Error spawning catnip field mesh ${i}:`, error);
            }
        }
        console.log(`CatnipFieldVisualizer: Successfully spawned and hid ${this._spawnedFieldMeshes.length} catnip field meshes.`);

        // An initial update may be needed if player data is already available before `onPlayerDataUpdated` fires.
        // For simplicity, we rely on the `onPlayerDataUpdated` event to trigger the first proper visualization.
    }

    private updateFieldVisuals(numFieldsOwned: number) {
        // Determine how many fields should currently be displayed, capping at MAX_DISPLAY_FIELDS
        const fieldsToDisplay = Math.min(numFieldsOwned, MAX_DISPLAY_FIELDS);

        for (let i = 0; i < this._spawnedFieldMeshes.length; i++) {
            const fieldMesh = this._spawnedFieldMeshes[i];

            if (i < fieldsToDisplay) {
                // If the current index is less than fieldsToDisplay, this mesh should be visible
                const targetPosition = this.calculateGridPosition(i);
                fieldMesh.position.set(targetPosition); // Move to its calculated position [39, 42-44]
                fieldMesh.visible.set(true);            // Make it visible
            } else {
                // Otherwise, the mesh should be hidden
                fieldMesh.position.set(HIDDEN_POSITION); // Move back to the hidden position
                fieldMesh.visible.set(false);           // Hide it
            }
        }
    }

    /**
     * Calculates the world position for a given field index within the grid.
     * The grid fills in 5x5 blocks, up to a 20x20 total grid [3].
     * @param index The 0-based index of the catnip field.
     * @returns A Vec3 representing the world position for the field.
     */
    private calculateGridPosition(index: number): hz.Vec3 {
        // Calculate the position within the overall 20x20 grid
        const fieldsPerBlock = BLOCK_DIMENSION * BLOCK_DIMENSION; // 25 fields per 5x5 block
        const blocksPerRowInMainGrid = GRID_DIMENSION / BLOCK_DIMENSION; // 4 blocks per row (20/5)

        // Determine which 5x5 block the field belongs to
        const blockIndexOverall = Math.floor(index / fieldsPerBlock);
        const blockGridX = blockIndexOverall % blocksPerRowInMainGrid;
        const blockGridZ = Math.floor(blockIndexOverall / blocksPerRowInMainGrid); // Assuming Z is the "row" dimension

        // Determine the position within that 5x5 block
        const indexInBlock = index % fieldsPerBlock;
        const fieldInBlockX = indexInBlock % BLOCK_DIMENSION;
        const fieldInBlockZ = Math.floor(indexInBlock / BLOCK_DIMENSION);

        // Calculate local coordinates relative to the grid origin
        // Combine block position with position within the block
        const localX = (blockGridX * BLOCK_DIMENSION * FIELD_SPACING_X) + (fieldInBlockX * FIELD_SPACING_X);
        const localZ = (blockGridZ * BLOCK_DIMENSION * FIELD_SPACING_Z) + (fieldInBlockZ * FIELD_SPACING_Z);

        // Create a local vector for the calculated position (assuming a flat grid on XZ plane)
        const localOffset = new hz.Vec3(localX, 0, localZ);

        // Transform the local offset into world coordinates using the grid origin entity's position and rotation [24, 25]
        const worldPosition = hz.Vec3.add(
            this._gridOriginPosition,
            hz.Quaternion.mulVec3(this._gridOriginRotation, localOffset)
        );

//        console.log(`Spawning field in pos(${worldPosition.x},${worldPosition.y},${worldPosition.z})`);

        return worldPosition;
    }
}

// Register the component so it can be attached to an entity in Horizon Worlds [21, 45]
hz.Component.register(CatnipFieldVisualizer);