import * as hz from 'horizon/core';
import { IPlayerManager } from 'IPlayerManager';

export class PlayerManager extends hz.Component<typeof PlayerManager> implements IPlayerManager {
  static propsDefinition = {
    MainPlayerUI1: { type: hz.PropTypes.Entity },
    MainPlayerUI2: { type: hz.PropTypes.Entity },
    MainPlayerUI3: { type: hz.PropTypes.Entity },
    MainPlayerUI4: { type: hz.PropTypes.Entity },
    Player1WelcomSign: { type: hz.PropTypes.Entity },
    Player2WelcomSign: { type: hz.PropTypes.Entity },
    Player3WelcomSign: { type: hz.PropTypes.Entity },
    Player4WelcomSign: { type: hz.PropTypes.Entity },
  };

  mainPlayerUIs: hz.Entity[] = [];
  playerWelcomeSigns: hz.TextGizmo[] = [];

  preStart(): void {
    // Assign the UIs from the prop types
    if (this.props.MainPlayerUI1 && this.props.MainPlayerUI2 && this.props.MainPlayerUI3 && this.props.MainPlayerUI4) {
      this.mainPlayerUIs = [this.props.MainPlayerUI1, this.props.MainPlayerUI2, this.props.MainPlayerUI3, this.props.MainPlayerUI4];
    }    
    else {
      console.error("Not all 4 UI HUDs have been connected to the PlayerManager")
    }

    if (this.props.Player1WelcomSign && this.props.Player2WelcomSign && this.props.Player3WelcomSign && this.props.Player4WelcomSign) {
      this.playerWelcomeSigns = [this.props.Player1WelcomSign.as(hz.TextGizmo), this.props.Player2WelcomSign.as(hz.TextGizmo), this.props.Player3WelcomSign.as(hz.TextGizmo), this.props.Player4WelcomSign.as(hz.TextGizmo)];
    }
    else {
      console.error("Not all 4 welcome signs have been connected to the PlayerManager")
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
    if (this.playerWelcomeSigns[scriptIndex].owner.get() !== player) {
      this.playerWelcomeSigns[scriptIndex].owner.set(player);
      this.playerWelcomeSigns[scriptIndex].text.set(player.name.get());
      

    }
  }  
}
hz.Component.register(PlayerManager);