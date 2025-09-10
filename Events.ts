import * as hz from 'horizon/core';

export const CatnipGameEvents = {
    // This event will be sent from a client (CatnipFieldInteraction) to the server (PlayerManager)
    OnPurchaseCatnipFieldRequest: new hz.NetworkEvent<{ player: hz.Player, platformEntityId: string }>('OnPurchaseCatnipFieldRequest'),
    // Add other game-specific events here as needed
};