import * as hz from 'horizon/core';
import { PlayerData, GameConstants } from 'GameConstants';
import { CatnipGameEvents } from 'Events';
import { IPlayerManager } from 'IPlayerManager';
import { IAnalyticsManager } from 'IAnalyticsManager';
import { IPlayerDataManager } from 'IPlayerDataManager';
import { PlotManager } from 'PlotManager';
import { ServiceLocator_Data } from 'ServiceLocator_Data';

export class PlayerManager extends hz.Component<typeof PlayerManager> implements IPlayerManager {
  static propsDefinition = {
    MainPlayerUI1: { type: hz.PropTypes.Entity },
    MainPlayerUI2: { type: hz.PropTypes.Entity },
    MainPlayerUI3: { type: hz.PropTypes.Entity },
    MainPlayerUI4: { type: hz.PropTypes.Entity },
    Plot1: { type: hz.PropTypes.Entity },
    Plot2: { type: hz.PropTypes.Entity },
    Plot3: { type: hz.PropTypes.Entity },
    Plot4: { type: hz.PropTypes.Entity },
  };

  mainPlayerUIs: hz.Entity[] = [];
  plots: hz.Entity[] = [];

  private playerDataManager: IPlayerDataManager | undefined; 
  private analyticsManager: IAnalyticsManager | undefined;
  private playerPlotOwnership: Map<hz.Player, hz.Entity> = new Map();

  preStart(): void {
    // Assign the UIs from the prop types
    if (this.props.MainPlayerUI1 && this.props.MainPlayerUI2 && this.props.MainPlayerUI3 && this.props.MainPlayerUI4) {
      this.mainPlayerUIs = [this.props.MainPlayerUI1, this.props.MainPlayerUI2, this.props.MainPlayerUI3, this.props.MainPlayerUI4];
    }    
    else {
      console.error("Not all 4 UI HUDs have been connected to the PlayerManager")
    }

    if (this.props.Plot1 && this.props.Plot2 && this.props.Plot3 && this.props.Plot4) {
      this.plots = [this.props.Plot1, this.props.Plot2, this.props.Plot3, this.props.Plot4];
    }
    else {
      console.error("Not all 4 Plots assets have been connected to the PlayerManager")
    }

    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterWorld, (player: hz.Player) => {
      this.handleOnPlayerEnter(player);
    });    
  }

  override start() {
        this.playerDataManager = ServiceLocator_Data.playerDataManager;
        if (!this.playerDataManager) {
            console.error("PlayerManager: PlayerDataManager not registered in ServiceLocator_Data.");
        }
        this.analyticsManager = ServiceLocator_Data.analyticsManager;
        if (!this.analyticsManager) {
            console.error("PlayerManager: AnalyticsManager not registered in ServiceLocator_Data.");
        }        
        this.connectNetworkEvent(
            this.entity,
            CatnipGameEvents.OnPurchaseCatnipFieldRequest,
            (data: { player: hz.Player, platformEntityId: string }) => {
                this.handlePurchaseCatnipFieldRequest(data.player, data.platformEntityId);
            }
        );
        console.log(`PlayerManager started, listening for purchase requests.`);        
  }

  private async handleOnPlayerEnter(player: hz.Player): Promise<void> {
    const playerIndex = player.index.get();

    console.log("PlayerManager: Handle Player Enter method called...");


    // Do I need the below check in some form?
//    if (!this.playerDataMap.has(player)) {
      this.assignMainPlayerUILocalScriptOwner(player, playerIndex);
//    }

      if (playerIndex < this.plots.length) {
        const plotEntity = this.plots[playerIndex];
        const plotComponent = plotEntity.getComponents(PlotManager);
        if (plotComponent) {
          let playerData: PlayerData | undefined;
          if (this.playerDataManager) {
            playerData = await this.playerDataManager.getPlayerData(player);
          }
          else {
            console.error("PlayerManager: PlayerDataManager is not available to retrieve player data.");
            return; // Exit if manager isn't available
          }
          if (playerData) {
            console.log(`${player.name.get()} has existing data. Assigning plot ${playerIndex + 1}.`);
            this.playerPlotOwnership.set(player, plotEntity);            
            await plotComponent[0].spawnPlayerSpecificAssets(player, playerData);
            plotComponent[0].setClaimText(`Owned by:\n${player.name.get()}`);
            console.log(`Plot ${playerIndex + 1} text updated to show owner: ${player.name.get()}`);
          }
        }
        else {
              console.warn(`PlayerManager: Plot component not found on Plot ${playerIndex + 1}. Cannot update plot text.`);
        }
      } 
      else {
          console.warn(`PlayerManager: No plot entity assigned for player index ${playerIndex}.`);
    }          

  }

  private async handlePurchaseCatnipFieldRequest(player: hz.Player, platformEntityId: string) {
    console.log(`PlayerManager: Received purchase request from ${player.name.get()} for platform ${platformEntityId}.`);

    // Check if PlayerDataManager is available on the server
    if (!this.playerDataManager) {
        console.warn("PlayerManager: PlayerDataManager instance not available. Cannot process purchase request.");
        return;
    }

    // AnalyticsManager is optional, so check before using
    if (!this.analyticsManager) {
        console.warn("PlayerManager: AnalyticsManager instance not available. Analytics will not be logged.");
    }

    let playerData = this.playerDataManager.getPlayerData(player);
    if (!playerData) {
        console.warn(`PlayerManager: Player data not found for ${player.name.get()}. Cannot process purchase.`);
        return;
    }

    const currentFieldCost = GameConstants.CATNIP_FIELD_COST * (1 + (playerData.catnipFields * GameConstants.CATNIP_FIELD_PRICE_RATIO));

//    console.log(`player catnip amount = ${playerData.catnip}, catnip field cost = ${currentFieldCost}`);

    if (playerData.catnip >= currentFieldCost) {
      // Perform the purchase logic (deduct catnip, increment fields)
      playerData.catnip -= currentFieldCost;
      playerData.catnipFields += 1;
      await this.playerDataManager.setPlayerData(player, playerData); // This will broadcast PlayerDataEvents.onPlayerDataUpdated

      console.log(`${player.name.get()} purchased a catnip field! New catnip: ${playerData.catnip}, New fields: ${playerData.catnipFields}`);

      // Log analytics for the purchase
      if (this.analyticsManager) {
          this.analyticsManager.sendItemPurchasedEvent(
              player,
              "catnip_field",
              GameConstants.CATNIP_FIELD_COST,
              1
          );
      } else {
          console.log("ERROR: Analytics instance not found for logging!");
      }

      // Provide immediate feedback to the player (popup message)
      this.world.ui.showPopupForPlayer(player, `Purchased Catnip Field! You now have ${playerData.catnipFields}.`, 3000);

    } else {
        console.log(`${player.name.get()} tried to buy a catnip field but doesn't have enough catnip (has ${playerData.catnip}, needs ${currentFieldCost}).`);
        this.world.ui.showPopupForPlayer(player, `Need ${currentFieldCost.toPrecision(2)} Catnip to buy! You have ${playerData.catnip.toPrecision(2)}.`, 3000);
    }
  }


  assignMainPlayerUILocalScriptOwner(player: hz.Player, scriptIndex: number): void {
    if (this.mainPlayerUIs[scriptIndex].owner.get() !== player) {
      this.mainPlayerUIs[scriptIndex].owner.set(player);
    }
  }  
}
hz.Component.register(PlayerManager);