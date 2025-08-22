// ITimeManager.ts
// Defines the interface for the TimeManager component.
// This allows other scripts to interact with the TimeManager in a type-safe manner
// through the ServiceLocator, without needing to know its concrete implementation.

import * as hz from 'horizon/core';

export interface ITimeManager {
    // Public Local Events that TimeManager broadcasts
    onTickEvent: hz.LocalEvent<{ tickNumber: number }>;
    onDayEvent: hz.LocalEvent<{ dayNumber: number }>;

    // Public methods for controlling the timer
    startTimer(): void;
    stopTimer(): void;

    // You can add more public methods here if other components need to query the TimeManager's state,
    // for example:
    // getCurrentTickNumber(): number;
    // getCurrentDayNumber(): number;
}