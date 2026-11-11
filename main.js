// main.js
// The Entry Point. 
// Initializes all subsystems and sets up the default application state.

import { state, addNode, getNextId } from './state.js';
import { initRenderer, render } from './ui-renderer.js';
import { initEvents } from './ui-events.js';
import { initInspector, updateInspectorUI } from './ui-inspector.js';
import { initAudio, stop, exportAudio } from './audio-core.js'; 
import { initIO } from './io.js'; 
import { OutputNode } from './nodes.js';
import { initExportUI } from './ui-export.js'; // Added Import

document.addEventListener('DOMContentLoaded', () => {
    console.log("FXAA: Initializing...");

    // 1. Initialize Subsystems
    initRenderer();
    initEvents();
    initInspector();
    initIO(); 
    initExportUI(); // Initialize Export Modal Logic
    
    // 2. Setup Global UI Event Listeners (Modals, etc.)
    setupGlobalUI();

    // 3. Create Default Graph
    createDefaultGraph();

    // 4. Initial Render
    render();
    
    // 5. Open Welcome Modal
    const welcomeModal = document.getElementById('welcome-modal-container');
    if (welcomeModal) welcomeModal.classList.add('is-open');

    console.log("FXAA: Ready.");
});

function createDefaultGraph() {
    // Add the Master Output node to start
    const outputNode = new OutputNode(500, 200);
    addNode(outputNode);
    state.selectedNodeId = outputNode.id;
    updateInspectorUI();
}

function setupGlobalUI() {
    // Modal Close Buttons
    const modals = [
        'welcome-modal', 'license-modal', 'help-modal', 'file-modal', 'export-modal'
    ];

    modals.forEach(id => {
        const container = document.getElementById(`${id}-container`);
        const closeBtn = document.getElementById(`${id}-close-btn`);
        const backdrop = document.getElementById(`${id}-backdrop`);
        
        if (container && closeBtn) {
            closeBtn.addEventListener('click', () => container.classList.remove('is-open'));
        }
        if (container && backdrop) {
            backdrop.addEventListener('click', () => container.classList.remove('is-open'));
        }
    });

    // Header Buttons
    document.getElementById('restart-btn')?.addEventListener('click', () => {
        stop();
        location.reload(); 
    });

    document.getElementById('help-btn')?.addEventListener('click', () => {
        document.getElementById('help-modal-container').classList.add('is-open');
    });

    document.getElementById('file-btn')?.addEventListener('click', () => {
        document.getElementById('file-modal-container').classList.add('is-open');
    });
    
    document.getElementById('view-license-btn')?.addEventListener('click', (e) => {
        e.preventDefault();
        document.getElementById('license-modal-container').classList.add('is-open');
    });
}