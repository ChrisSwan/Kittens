// TimeManager.ts
// Handles the game's timer and tick system, broadcasting events for ticks and days.

import * as hz from 'horizon/core';
import { GameConstants } from 'GameConstants'; // Imports game constants for tick duration and ticks per day.
import { ServiceLocator_Data } from 'ServiceLocator_Data'; // Imports ServiceLocator_Data for early registration.
import { ITimeManager } from 'ITimeManager'; // Imports the ITimeManager interface for type safety and contract adherence.


export class TimeManager extends hz.Component<typeof TimeManager> implements ITimeManager {
    static propsDefinition = {}; // This manager component does not require any specific properties in the editor.

    // Public Local Events that TimeManager broadcasts.
    // Other components will subscribe to these events to perform actions synchronized with game time.
    public onTickEvent = new hz.LocalEvent<{ tickNumber: number }>('onTickEvent');
    public onDayEvent = new hz.LocalEvent<{ dayNumber: number }>('onDayEvent');

    private currentTick: number = 0; // Tracks the current game tick number.
    private currentDay: number = 0;  // Tracks the current game day number.
    private timerIntervalId: number = -1; // Stores the interval ID to manage starting and stopping the timer.

    /**
     * The `preStart()` method is guaranteed to run for all components before any `start()` methods are called.
     * This ensures the `TimeManager` is registered and available for other components that might need it early.
     */
    override preStart(): void {
        // Registers this instance with the global ServiceLocator_Data for easy access by other scripts.
        ServiceLocator_Data.timeManager = this as ITimeManager;
        console.log("TimeManager preStart: Registered with ServiceLocator_Data.");
    }

    override start(): void {
        console.log("TimeManager started.");
        // Automatically starts the game timer when the world begins running its scripts.
        this.startTimer();
    }

    override dispose(): void {
        // Cleans up the interval timer when the component is disposed to prevent memory leaks.
        this.stopTimer();
    }

    /**
     * Starts the internal game timer, which periodically increments the tick count
     * and broadcasts `onTickEvent` and `onDayEvent` at the defined intervals.
     */
    public startTimer(): void {
        if (this.timerIntervalId !== -1) {
            console.warn("TimeManager: Timer is already running.");
            return;
        }

        console.log("TimeManager: Starting timer.");
        // `async.setInterval` is used for recurring time-based operations in Horizon Worlds.
        this.timerIntervalId = this.async.setInterval(() => {
            this.currentTick++;

            // Broadcast the current tick number for any subscribed components.
            this.sendLocalBroadcastEvent(this.onTickEvent, {tickNumber: this.currentTick});

            // Checks if a new game day has commenced based on `TICKS_PER_DAY`.
            if (this.currentTick % GameConstants.TICKS_PER_DAY === 0) {
                this.currentDay++;
//                console.log(`TimeManager: Day ${this.currentDay} started.`);
                // Broadcast the current day number for any subscribed components.
                this.sendLocalBroadcastEvent(this.onDayEvent, {dayNumber: this.currentDay});
            }

            // Optional: Uncomment for granular tick-by-tick debugging messages.
            // console.log(`TimeManager: Tick ${this.currentTick}`);

        }, GameConstants.TICK_DURATION_MS); // The interval duration is set by `TICK_DURATION_MS` from `GameConstants`.
    }

    /**
     * Stops the internal game timer if it is currently running, clearing the interval.
     */
    public stopTimer(): void {
        if (this.timerIntervalId !== -1) {
            this.async.clearInterval(this.timerIntervalId);
            this.timerIntervalId = -1;
            console.log("TimeManager: Timer stopped.");
        }
    }
}

// Registers the component with the Horizon Worlds engine, making it available to attach to an entity.
hz.Component.register(TimeManager);