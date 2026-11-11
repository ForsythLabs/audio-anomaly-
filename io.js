// io.js
// Handles Saving and Loading of the Graph State

import { state, addNode, resetState } from './state.js';
import { NODE_CONSTRUCTORS } from './nodes.js';
import { render } from './ui-renderer.js';
import { updateInspectorUI } from './ui-inspector.js';
import { stop, getAudioContext } from './audio-core.js';

export function initIO() {
    document.getElementById('save-to-file-btn')?.addEventListener('click', saveGraphToFile);
    document.getElementById('load-from-file-input')?.addEventListener('change', handleLoadGraphFromFile);
    document.getElementById('copy-to-clipboard-btn')?.addEventListener('click', saveGraphToClipboard);
    document.getElementById('load-from-clipboard-btn')?.addEventListener('click', handleLoadGraphFromClipboard);
}

// --- SERIALIZATION (SAVE) ---

function getGraphAsJSON() {
    const dataToSave = {
        version: "0.7.07",
        timestamp: Date.now(),
        // FIX: Save Global Settings (Harmonics, Degrees)
        settings: state.settings, 
        nodes: state.nodes.map(node => {
            const plainNode = { ...node };
            
            // Remove runtime objects
            delete plainNode.cachedPreviewBuffer;
            delete plainNode.cachedLargeBuffer; // FIX: Remove large buffer bloat
            delete plainNode.audioGraphNodes;
            delete plainNode.inputs; 
            delete plainNode.outputs; 
            
            const savedInputs = {};
            for (const key in node.inputs) {
                if (node.inputs[key].defaultValue !== undefined) {
                    savedInputs[key] = { defaultValue: node.inputs[key].defaultValue };
                }
            }
            plainNode.savedInputState = savedInputs;
            
            return plainNode;
        }),
        connections: state.connections,
        variables: state.variables,
        panOffset: state.panOffset,
        zoom: state.zoom,
        nextId: state.nextId,
        nextVariableId: state.nextVariableId
    };
    
    return JSON.stringify(dataToSave, null, 2);
}

function saveGraphToFile() {
    const jsonString = getGraphAsJSON();
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `fxaa_graph_${new Date().toISOString().slice(0,10)}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
    
    showMessage("Saved to file!");
}

function saveGraphToClipboard() {
    const jsonString = getGraphAsJSON();
    navigator.clipboard.writeText(jsonString).then(() => {
        showMessage("Copied to clipboard!");
    }, () => {
        showMessage("Failed to copy.", true);
    });
}

// --- DESERIALIZATION (LOAD) ---

function handleLoadGraphFromClipboard() {
    const textarea = document.getElementById('file-json-textarea');
    if (textarea && textarea.value) {
        loadGraphFromJSON(textarea.value);
    } else {
        navigator.clipboard.readText().then(text => {
            if(text) loadGraphFromJSON(text);
            else showMessage("Clipboard empty or permission denied.", true);
        }).catch(err => {
            showMessage("Paste JSON into the text area first.", true);
        });
    }
}

function handleLoadGraphFromFile(event) {
    const file = event.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
        loadGraphFromJSON(e.target.result);
    };
    reader.readAsText(file);
    event.target.value = ''; 
}

function loadGraphFromJSON(jsonString) {
    try {
        const data = JSON.parse(jsonString);
        
        if (!data.nodes || !data.connections) {
            throw new Error("Invalid JSON format. Missing nodes or connections.");
        }

        stop();
        resetState();
        
        // FIX: Restore Settings FIRST so nodes initialize with correct multipliers
        if (data.settings) {
            state.settings = { ...state.settings, ...data.settings };
            
            // Update UI Toggles to match
            const harmBtn = document.getElementById('harmonics-toggle-btn');
            if (harmBtn) {
                harmBtn.textContent = state.settings.useHarmonics ? "Harmonies" : "Frequencies";
                harmBtn.classList.toggle('bg-teal-600', state.settings.useHarmonics);
                harmBtn.classList.toggle('bg-indigo-600', !state.settings.useHarmonics);
            }
            const radBtn = document.getElementById('radians-toggle-btn');
            if (radBtn) {
                radBtn.textContent = state.settings.useDegrees ? "Degrees" : "Radians";
                radBtn.classList.toggle('bg-teal-600', state.settings.useDegrees);
                radBtn.classList.toggle('bg-indigo-600', !state.settings.useDegrees);
            }
        }

        state.variables = data.variables || {};
        state.panOffset = data.panOffset || { x: 0, y: 0 };
        state.zoom = data.zoom || 1;
        state.nextId = data.nextId || 0;
        state.nextVariableId = data.nextVariableId || 0;

        const audioCtx = getAudioContext(); 
        
        data.nodes.forEach(nodeData => {
            const type = nodeData.type === 'sine' ? 'oscillator' : nodeData.type;
            const constructor = NODE_CONSTRUCTORS[type];
            if (!constructor) {
                console.warn(`Unknown node type "${type}" found in JSON. Skipping.`);
                return;
            }
            
            const newNode = constructor(nodeData.x, nodeData.y, nodeData.variableId, nodeData.fromPinKey);
            
            newNode.id = nodeData.id;
            newNode.title = nodeData.title; 
            if (nodeData.notes) newNode.notes = nodeData.notes;
            
            if (nodeData.params) {
                newNode.params = { ...nodeData.params };
            }
            
            if (nodeData.savedInputState) {
                for (const key in nodeData.savedInputState) {
                    if (newNode.inputs[key]) {
                        newNode.inputs[key].defaultValue = nodeData.savedInputState[key].defaultValue;
                    }
                }
            }

            if (audioCtx) {
                newNode.audioGraphNodes = newNode.createAudioNode(audioCtx);
            }
            
            state.nodes.push(newNode);
        });

        state.connections = data.connections;
        
        state.connections.forEach(conn => {
            const toNode = getNode(conn.toNodeId);
            const fromNode = getNode(conn.fromNodeId);
            
            if (toNode && toNode.inputs[conn.toPinKey]) {
                toNode.inputs[conn.toPinKey].connection = { 
                    fromNodeId: conn.fromNodeId, 
                    fromPinKey: conn.fromPinKey 
                };
            }
            
            if (audioCtx && toNode && fromNode) {
                fromNode.connect(toNode, conn.toPinKey, conn.fromPinKey);
            }
        });

        render();
        updateInspectorUI();
        
        document.getElementById('file-modal-container').classList.remove('is-open');
        showMessage("Graph loaded successfully!");

    } catch (error) {
        console.error("Failed to load graph:", error);
        showMessage(`Error: ${error.message}`, true);
    }
}

function getNode(id) {
    return state.nodes.find(n => n.id === id);
}

function showMessage(msg, isError = false) {
    const el = document.getElementById('file-error-message');
    if (el) {
        el.textContent = msg;
        el.style.color = isError ? '#ef4444' : '#10b981'; 
        setTimeout(() => el.textContent = '', 3000);
    }
}