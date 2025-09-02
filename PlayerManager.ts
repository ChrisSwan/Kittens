import * as hz from 'horizon/core';
import { IPlayerManager } from 'IPlayerManager';

export class PlayerManager extends hz.Component<typeof PlayerManager> implements IPlayerManager {
  static propsDefinition = {
    MainPlayerUI1: { type: hz.PropTypes.Entity },
    MainPlayerUI2: { type: hz.PropTypes.Entity },
    MainPlayerUI3: { type: hz.PropTypes.Entity },
    MainPlayerUI4: { type: hz.PropTypes.Entity },
  };

  mainPlayerUIs: hz.Entity[] = [];

  preStart(): void {
    // Assign the UIs from the prop types
    if (this.props.MainPlayerUI1 && this.props.MainPlayerUI2 && this.props.MainPlayerUI3 && this.props.MainPlayerUI4) {
      this.mainPlayerUIs = [this.props.MainPlayerUI1, this.props.MainPlayerUI2, this.props.MainPlayerUI3, this.props.MainPlayerUI4];
    }    

    this.connectCodeBlockEvent(this.entity, hz.CodeBlockEvents.OnPlayerEnterWorld, (player: hz.Player) => {
      this.handleOnPlayerEnter(player);
    });    
  }

  start() {

  }

  handleOnPlayerEnter(player: hz.Player): void {
    const playerIndex = player.index.get();
    // Do I need the below check in some form?
//    if (!this.playerDataMap.has(player)) {
      this.assignMainPlayerUILocalScriptOwner(player, playerIndex);
//    }
  }

  assignMainPlayerUILocalScriptOwner(player: hz.Player, scriptIndex: number): void {
    if (this.mainPlayerUIs[scriptIndex].owner.get() !== player) {
      this.mainPlayerUIs[scriptIndex].owner.set(player);
    }
  }  
}
hz.Component.register(PlayerManager);