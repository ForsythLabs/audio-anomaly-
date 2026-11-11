// ui-export.js
// Handles the Audio Export Modal and file download logic.

import { state, getNode } from './state.js';
import { exportAudio } from './audio-core.js';

let exportModal;
let filenameInput;
let durationInput;
let confirmBtn;
let cancelBtn;

export function initExportUI() {
    exportModal = document.getElementById('export-modal-container');
    filenameInput = document.getElementById('export-filename');
    durationInput = document.getElementById('export-duration');
    confirmBtn = document.getElementById('export-confirm-btn');
    cancelBtn = document.getElementById('export-cancel-btn');

    if (!exportModal) return;

    // Bind Events
    confirmBtn.addEventListener('click', handleExportConfirm);
    cancelBtn.addEventListener('click', closeExportModal);
    
    // Close on backdrop click
    document.getElementById('export-modal-backdrop')?.addEventListener('click', closeExportModal);
}

export function openExportModal() {
    // Find output node
    const outputNode = state.nodes.find(n => n.type === 'output');
    
    if (!outputNode) {
        alert("No Master Output node found in the graph.");
        return;
    }
    
    // Set defaults
    filenameInput.value = `fxaa_export_${new Date().toISOString().slice(0,10)}`;
    durationInput.value = "10.0";
    
    exportModal.classList.add('is-open');
}

function closeExportModal() {
    exportModal.classList.remove('is-open');
}

async function handleExportConfirm() {
    const filename = filenameInput.value || "fxaa_export";
    const duration = parseFloat(durationInput.value);
    
    if (isNaN(duration) || duration <= 0) {
        alert("Please enter a valid duration (seconds).");
        return;
    }
    
    const outputNode = state.nodes.find(n => n.type === 'output');
    if (!outputNode) return;

    // Show loading state
    const originalText = confirmBtn.textContent;
    confirmBtn.textContent = "Rendering...";
    confirmBtn.disabled = true;

    try {
        // Generate Blob
        const wavBlob = await exportAudio(outputNode, duration);
        
        // Trigger Download
        triggerDownload(wavBlob, `${filename}.wav`);
        
        closeExportModal();
    } catch (e) {
        console.error("Export failed:", e);
        alert("Export failed. See console for details.");
    } finally {
        confirmBtn.textContent = originalText;
        confirmBtn.disabled = false;
    }
}

function triggerDownload(blob, filename) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
}