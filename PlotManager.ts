import * as hz from 'horizon/core';
import { PlayerData } from 'GameConstants';
import { PlayerDataManager } from 'PlayerDataManager';

export class PlotManager extends hz.Component<typeof PlotManager> {
    // Defines properties that can be set in the editor for this component
    static propsDefinition = {
        // Reference to the TextGizmo entity located within this specific plot
        farmOwnerText: { type: hz.PropTypes.Entity },
        // Catnip field assets
        catnipFieldAsset: {type: hz.PropTypes.Asset},
//        plotTriggerProp: { type: hz.PropTypes.Entity },
//        plotPlatformMeshProp: { type: hz.PropTypes.Entity },
    };

    private _farmOwnerText: hz.TextGizmo | undefined;
    private _catnipFieldAsset: hz.Asset | undefined;
    private _spawnedPurchasePlatform: hz.Entity | undefined;
//    private _catnipPurchaseTrigger: hz.TriggerGizmo | undefined;
//    private _catnipPurchasePlatform: hz.MeshEntity | undefined;
    // You might also store references to other internal entities like the trigger or mesh.
    // private _plotTrigger: hz.TriggerGizmo | undefined;
    // private _plotPlatformMesh: hz.MeshEntity | undefined;

    override preStart(): void {
        // Validate that the 'plotText' property is set and store a typed reference to it.
        if (this.props.farmOwnerText) {
            this._farmOwnerText = this.props.farmOwnerText.as(hz.TextGizmo); // Cast to TextGizmo [2, 3]
        } else {
            console.error(`Plot: Missing 'plotText' property on ${this.entity.name.get()}. Cannot display plot text.`);
        }

        if (this.props.catnipFieldAsset) {
            this._catnipFieldAsset = this.props.catnipFieldAsset.as(hz.Asset); // Cast to TextGizmo [2, 3]
        } else {
            console.error(`Plot: Missing 'catnipPurchasePad' property on ${this.entity.name.get()}. Cannot display plot text.`);
        }
        // Initialize other references if you have them, e.g.:
        // if (this.props.plotTrigger) {
        //     this._plotTrigger = this.props.plotTrigger.as(hz.TriggerGizmo);
        //     this.connectCodeBlockEvent(this._plotTrigger, hz.CodeBlockEvents.OnPlayerEnterTrigger, this.onPlotTriggerEnter.bind(this));
        // }
    }

    start() {
    }


    // Public method to set the text displayed on this plot
    public setClaimText(text: string): void {
        if (this._farmOwnerText) {
            this._farmOwnerText.text.set(text); // Use the .set() method to update TextGizmo content [2, 3]
            this._farmOwnerText.visible.set(true);
        }

        // HACK! For now let's spawn in the catnipfield assets in this method

    }

    public async spawnPlayerSpecificAssets(player: hz.Player, initialPlayerData: PlayerData): Promise<void> {
        if (!this.props.catnipFieldAsset) {
            console.error(`Plot ${this.entity.name.get()}: catnipFieldAsset is not set. Cannot spawn purchase platform.`);
            return;
        }
        try {
            // 2. Spawn the Catnip Purchase Platform Asset
            const spawnedObjects = await this.world.spawnAsset(
                this.props.catnipFieldAsset,
                this.entity.position.get(), // Position the platform at the plot's origin
                this.entity.rotation.get(), // Align with the plot's rotation
                hz.Vec3.one // Default scale
            );
            if (spawnedObjects.length > 0) {
                // The root entity of the spawned asset (the one with CatnipFieldInteraction.ts attached)
                this._spawnedPurchasePlatform = spawnedObjects[0];             
                // --- Ownership Handling (see next section) ---
                this._spawnedPurchasePlatform.owner.set(player);
                console.log(`Plot ${this.entity.name.get()}: Spawned Catnip Purchase Platform for ${player.name.get()} and set ownership.`);
                // Configure the Trigger Gizmo within the spawned platform to only allow the owner
                const triggerGizmo = this._spawnedPurchasePlatform.children.get().find(child => child.as(hz.TriggerGizmo))?.as(hz.TriggerGizmo);
                if (triggerGizmo) {
                    triggerGizmo.setWhoCanTrigger([player]); // Only the owner can trigger it
                    triggerGizmo.enabled.set(true);
                    console.log(`Plot ${this.entity.name.get()}: Purchase platform trigger set for owner ${player.name.get()}.`);
                } else {
                    console.warn(`Plot ${this.entity.name.get()}: Spawned Catnip Purchase Platform is missing Trigger Gizmo.`);
                }

                // Update the plot's display text to show ownership
//                this.setClaimText(`Owned by:\n${player.name.get()}`);
//                if (this._farmOwnerText) this._farmOwnerText.visible.set(true);

            } else {
                console.error(`Plot ${this.entity.name.get()}: Failed to spawn Catnip Purchase Platform asset.`);
            }
        } catch (error) {
            console.error(`Plot ${this.entity.name.get()}: Error spawning Catnip Purchase Platform:`, error);
        }
    }

    // Optional: A method to reset the plot's text to its initial "unclaimed" state, as per V0.16 design [4]
    public reset(): void {
        this.setClaimText("Unclaimed Plot");
        // You would also reset visibility of other elements, re-enable triggers, etc. here.
        // e.g., this._plotPlatformMesh?.visible.set(true);
        // this._plotTrigger?.enabled.set(true);
    }

    // Example of an internal trigger handler for the plot (if the plot manages its own trigger)
    // private onPlotTriggerEnter(player: hz.Player): void {
    //     console.log(`${player.name.get()} entered Plot ${this.entity.name.get()}`);
    //     // This would typically broadcast an event or call a method on PlayerManager
    //     // to handle the actual claiming logic.
    // }  
}
hz.Component.register(PlotManager);