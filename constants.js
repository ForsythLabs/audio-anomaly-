// constants.js
// Holds all shared values to prevent magic numbers and circular dependencies.

export const BASE_FREQUENCY = 120;

// Preview Settings
export const PREVIEW_DURATION = 2.0;       // Seconds for Inspector
export const LARGE_PREVIEW_DURATION = 10.0; // Seconds for Fullscreen Modal
export const PREVIEW_SAMPLE_RATE = 48000;

// Visual Configuration
export const PIN_RADIUS_VISIBLE = 5;
export const PIN_RADIUS_HITBOX = 12;
export const NODE_WIDTH = 180;
export const HEADER_HEIGHT = 40;
export const PIN_HEIGHT = 25;

// Node Colors
export const NODE_COLORS = {
    float: 'bg-gray-500',
    oscillator: 'bg-blue-500',
    mod: 'bg-teal-500',
    noise: 'bg-pink-500',
    adsr: 'bg-fuchsia-500',
    add: 'bg-green-500',
    subtract: 'bg-yellow-500',
    multiply: 'bg-purple-500',
    abs: 'bg-orange-500',
    svf: 'bg-cyan-500',
    ladder: 'bg-amber-500',
    shaper: 'bg-red-500',
    crusher: 'bg-lime-500',
    reverb: 'bg-sky-500',
    output: 'bg-indigo-600',
    set_var: 'bg-rose-600',
    get_var: 'bg-rose-500'
};