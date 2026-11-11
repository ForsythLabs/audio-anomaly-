// graph.js
// A dedicated renderer for audio waveforms with scientific-style grids and adaptive scales.

import { NODE_COLORS } from './constants.js';

export class GraphRenderer {
    constructor(canvas, theme = 'dark') {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.theme = theme;
        this.resize();
        
        // Configuration
        this.colors = {
            bg: theme === 'dark' ? '#111827' : '#FFFFFF',
            grid: theme === 'dark' ? 'rgba(255,255,255,0.1)' : 'rgba(0,0,0,0.1)',
            axis: theme === 'dark' ? '#6B7280' : '#4B5563',
            text: theme === 'dark' ? '#9CA3AF' : '#6B7280',
            line: '#6366F1', // Indigo-500
            zero: theme === 'dark' ? 'rgba(255,255,255,0.3)' : 'rgba(0,0,0,0.3)'
        };
    }

    resize() {
        // Handle High-DPI displays
        const dpr = window.devicePixelRatio || 1;
        const rect = this.canvas.getBoundingClientRect();
        
        // Set actual size in memory (scaled to account for extra pixel density)
        this.canvas.width = rect.width * dpr;
        this.canvas.height = rect.height * dpr;
        
        // Normalize coordinate system to use css pixels
        this.ctx.scale(dpr, dpr);
        
        this.width = rect.width;
        this.height = rect.height;
    }

    render(waveform, duration, panState, zoomState, options = {}) {
        if (!waveform) return;
        
        // Options overrides
        const isLarge = options.isLarge || false;
        const lineColor = options.color || (isLarge ? '#4ADE80' : '#6366F1');
        const bgColor = isLarge ? '#000000' : this.colors.bg;

        // Clear
        this.ctx.fillStyle = bgColor;
        this.ctx.fillRect(0, 0, this.width, this.height);

        // --- MATH & COORDINATE MAPPING ---
        
        // X-Axis (Time)
        // Zoom X = 1.0 means we see a "Base Duration" (e.g. 0.05s on mini, 0.2s on large)
        const baseViewSeconds = isLarge ? 0.2 : 0.05;
        const viewDuration = baseViewSeconds / zoomState.x;
        
        // Pan X is strictly "Start Time in Seconds"
        const startTime = panState.x;
        const endTime = startTime + viewDuration;
        
        // Helper: Time -> Pixel X
        const timeToPx = (t) => ((t - startTime) / viewDuration) * this.width;

        // Y-Axis (Amplitude)
        // Zoom Y = 1.0 means range is approx -0.75 to +0.75 (Total 1.5 units)
        const yRange = 1.5 / zoomState.y;
        const yCenter = 0 + panState.y; // Pan Y acts as vertical offset in units
        // Helper: Amp -> Pixel Y (Inverted because Canvas Y=0 is top)
        const ampToPx = (val) => (this.height / 2) - ((val - yCenter) / yRange) * (this.height);

        // --- DRAWING ---

        this.drawGrid(startTime, endTime, viewDuration, ampToPx, timeToPx, isLarge);
        this.drawWaveform(waveform, duration, startTime, endTime, viewDuration, ampToPx, lineColor);
        
        if (isLarge) {
            this.drawInfoOverlay(startTime, endTime, viewDuration);
        }
    }

    drawGrid(startTime, endTime, viewDuration, ampToPx, timeToPx, isLarge) {
        const ctx = this.ctx;
        ctx.lineWidth = 1;
        ctx.font = '10px Inter, sans-serif';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'top';

        // 1. Adaptive Time Grid (X-Axis)
        // Calculate nice interval (1s, 0.5s, 0.1s, 0.01s, etc.)
        const targetPixelsPerGrid = 60;
        const rawInterval = viewDuration * (targetPixelsPerGrid / this.width);
        const niceInterval = this.calculateNiceInterval(rawInterval);

        // Find first grid line to draw
        const startGrid = Math.floor(startTime / niceInterval) * niceInterval;
        
        ctx.strokeStyle = this.colors.grid;
        ctx.fillStyle = this.colors.text;

        for (let t = startGrid; t < endTime; t += niceInterval) {
            const x = timeToPx(t);
            if (x < -1 || x > this.width + 1) continue;

            // Draw Line
            ctx.beginPath();
            ctx.moveTo(x, 0); ctx.lineTo(x, this.height);
            ctx.stroke();

            // Draw Label (only if large or sparse)
            if (isLarge || niceInterval >= 0.01) {
                // Precision formatting based on interval size
                const decimals = Math.max(0, -Math.floor(Math.log10(niceInterval)));
                ctx.fillText(t.toFixed(decimals) + 's', x, this.height - 14);
            }
        }

        // 2. Adaptive Amplitude Grid (Y-Axis)
        // Fixed lines at 0, +1, -1 for context
        const zeroY = ampToPx(0);
        const oneY = ampToPx(1.0);
        const negOneY = ampToPx(-1.0);

        // Zero Line (Stronger)
        if (zeroY > -10 && zeroY < this.height + 10) {
            ctx.beginPath();
            ctx.strokeStyle = this.colors.zero;
            ctx.lineWidth = 2; // Thicker zero line
            ctx.moveTo(0, zeroY); ctx.lineTo(this.width, zeroY);
            ctx.stroke();
            ctx.lineWidth = 1; // Reset
            if(isLarge) {
                ctx.textAlign = 'left';
                ctx.fillText("0.0", 5, zeroY + 2);
            }
        }

        // +/- 1.0 Rails
        ctx.strokeStyle = isLarge ? '#333' : 'rgba(255,255,255,0.05)';
        if (oneY > -10 && oneY < this.height + 10) {
            ctx.beginPath(); ctx.moveTo(0, oneY); ctx.lineTo(this.width, oneY); ctx.stroke();
            if(isLarge) ctx.fillText("+1.0", 5, oneY + 2);
        }
        if (negOneY > -10 && negOneY < this.height + 10) {
            ctx.beginPath(); ctx.moveTo(0, negOneY); ctx.lineTo(this.width, negOneY); ctx.stroke();
            if(isLarge) ctx.fillText("-1.0", 5, negOneY + 2);
        }
    }

    drawWaveform(waveform, totalDuration, startTime, endTime, viewDuration, ampToPx, color) {
        const ctx = this.ctx;
        ctx.beginPath();
        ctx.strokeStyle = color;
        ctx.lineWidth = 2;
        ctx.lineJoin = 'round';

        // Optimization: Decimate / Step based on pixel density
        // We iterate pixels (0 -> width) and find the sample at that time
        // This ensures constant drawing cost regardless of zoom level
        
        let started = false;
        
        for (let px = 0; px < this.width; px++) {
            // Map Pixel X -> Time
            const t = startTime + (px / this.width) * viewDuration;
            
            // Map Time -> Sample Index
            const idx = (t / totalDuration) * waveform.length;
            
            // Simple Linear Interpolation for smoothness
            const iLower = Math.floor(idx);
            const iUpper = Math.ceil(idx);
            const frac = idx - iLower;
            
            if (iLower >= 0 && iUpper < waveform.length) {
                const val = waveform[iLower] * (1 - frac) + waveform[iUpper] * frac;
                const y = ampToPx(val);
                
                if (!started) {
                    ctx.moveTo(px, y);
                    started = true;
                } else {
                    ctx.lineTo(px, y);
                }
            }
        }
        ctx.stroke();
    }

    drawInfoOverlay(start, end, duration) {
        const ctx = this.ctx;
        ctx.fillStyle = '#6B7280';
        ctx.font = '12px monospace';
        ctx.textAlign = 'left';
        ctx.textBaseline = 'top';
        ctx.fillText(`Window: ${duration.toFixed(4)}s`, 10, 10);
        ctx.fillText(`Range:  ${start.toFixed(4)}s - ${end.toFixed(4)}s`, 10, 26);
    }

    calculateNiceInterval(raw) {
        const pow10 = Math.pow(10, Math.floor(Math.log10(raw)));
        const head = raw / pow10; // normalized to 1-10 range
        
        let niceHead;
        if (head < 1.5) niceHead = 1;
        else if (head < 3.5) niceHead = 2;
        else if (head < 7.5) niceHead = 5;
        else niceHead = 10;
        
        return niceHead * pow10;
    }
}