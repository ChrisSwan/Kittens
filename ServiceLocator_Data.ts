// ServiceLocator_Data.ts
// This file implements the Service Locator pattern, providing a centralized
// point of access for all core manager instances in the Horizon Worlds project.
// Managers register themselves here during their preStart() method.

// Import interfaces for all managers you wish to make globally accessible.
// These examples are drawn from the "Crystal Conveyor Tycoon" source [10, 27].
/*
import { IPlayerManager } from "IPlayerManager";
import { ITemplateManager } from "ITemplateManager";
import { IAudioManager } from "IAudioManager";
import { IButtonManager } from "IButtonManager";
import { IPlotManager } from "IPlotManager";
import { IPvEAreaManager } from "IPvEAreaManager";
import { IQuestsManager } from "IQuestsManager";
import { IPvPAreaManager } from "IPvPAreaManager";
import { IRebirthManager } from "IRebirthManager";
import { IRebirthCUI } from "IRebirthCUI";
import { ITycoonCompletedManager } from "ITycoonCompletedManager";
import { IPvEInfoPanel } from "IPvEInfoPanel";
import { ITycoonSaveManager } from "ITycoonSaveManager";
import { ISpawnManager } from "ISpawnManager"; // Added for completeness based on sources
*/
// --- NEW: Import our TimeManager interface ---
import { ITimeManager } from "ITimeManager"; // Important for our TimeManager

// Declare 'late-initialized' variables for each manager interface.
// The `!` (definite assignment assertion) tells TypeScript that these variables
// will definitely be assigned a concrete instance before they are used at runtime.
// This is a common practice for Service Locator patterns in TypeScript.
/*
let playerManager!: IPlayerManager;
let templateManager!: ITemplateManager;
let audioManager!: IAudioManager;
let buttonManager!: IButtonManager;
let plotManager!: IPlotManager;
let pveAreaManager!: IPvEAreaManager;
let questsManager!: IQuestsManager;
let pvpAreaManager!: IPvPAreaManager;
let rebirthManager!: IRebirthManager;
let rebirthCUI!: IRebirthCUI;
let tycoonCompletedManager!: ITycoonCompletedManager;
let pveInfoPanel!: IPvEInfoPanel;
let tycoonSaveManager!: ITycoonSaveManager;
let spawnManager!: ISpawnManager;
*/

// --- NEW: Declare our TimeManager instance ---
let timeManager!: ITimeManager;

// Export a constant object that provides a single point of access to all manager instances.
// Other scripts will import `ServiceLocator_Data` and access managers like
// `ServiceLocator_Data.timeManager.startTimer();`
export const ServiceLocator_Data = {
/*  
    playerManager,
    templateManager,
    audioManager,
    buttonManager,
    plotManager,
    pveAreaManager,
    questsManager,
    pvpAreaManager,
    rebirthManager,
    rebirthCUI,
    tycoonCompletedManager,
    pveInfoPanel,
    tycoonSaveManager,
    spawnManager,
*/
    // --- NEW: Add our TimeManager to the locator ---
    timeManager,
};
