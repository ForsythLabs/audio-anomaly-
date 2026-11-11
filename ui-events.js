// ui-events.js
// Handles User Inputs with a robust State Machine.

import { state, getNode, addNode, removeNode, addConnection, removeConnection, getComment, removeComment } from './state.js';
import { render, initRenderer, getPinPosition, calculateCurvedPath } from './ui-renderer.js';
import { NODE_CONSTRUCTORS, GetVariableNode, SetVariableNode } from './nodes.js';
import { play, stop, getAudioContext } from './audio-core.js';
import { updateInspectorUI, openMobilePanel, closeMobilePanel } from './ui-inspector.js';
import { BASE_FREQUENCY } from './constants.js';
import { initContextMenu, showContextMenu, hideContextMenu } from './ui-context-menu.js';

let canvas, canvasContainer;

// Input State
let inputMode = 'IDLE'; // IDLE, PANNING, DRAGGING, SELECTING, CONNECTING, RESIZING_COMMENT
let startMouse = { x: 0, y: 0 }; 
let startWorld = { x: 0, y: 0 }; 
let initialSelection = []; // Nodes
let initialComment = null; // Comment state during drag/resize
let nodesInsideComment = []; // IDs of nodes being group-dragged

export function initEvents() {
    const refs = initRenderer();
    canvas = refs.canvas;
    canvasContainer = refs.canvasContainer;

    // Robust Context Menu Blocker (Capture Phase)
    window.addEventListener('contextmenu', (e) => {
        if (e.target.closest('#node-canvas-container') || e.target.closest('#context-menu')) {
            e.preventDefault();
            e.stopPropagation();
            return false;
        }
    }, { capture: true });

    canvasContainer.addEventListener('mousedown', handlePointerDown);
    window.addEventListener('mousemove', handlePointerMove);
    window.addEventListener('mouseup', handlePointerUp);
    
    canvasContainer.addEventListener('touchstart', handlePointerDown, { passive: false });
    window.addEventListener('touchmove', handlePointerMove, { passive: false });
    window.addEventListener('touchend', handlePointerUp);

    canvasContainer.addEventListener('wheel', handleWheel, { passive: false });
    refs.nodesLayer.addEventListener('input', handleParamInput);
    
    setupSidebarEvents();
    setupHeaderEvents(); 
    initContextMenu();
    window.addEventListener('keydown', handleKeyDown);
}

// ... (getWorldPos helper unchanged) ...
function getWorldPos(screenX, screenY) {
    const rect = canvas.getBoundingClientRect();
    const x_canvas = screenX - rect.left;
    const y_canvas = screenY - rect.top;
    return {
        x: (x_canvas - state.panOffset.x) / state.zoom,
        y: (y_canvas - state.panOffset.y) / state.zoom
    };
}

function handlePointerDown(e) {
    if (e.target.classList.contains('node-param-input')) return;
    
    hideContextMenu();
    
    startMouse = { x: e.clientX, y: e.clientY };
    startWorld = getWorldPos(e.clientX, e.clientY);
    
    const target = e.target;
    const nodeGroup = target.closest('.node-group');
    const commentGroup = target.closest('.comment-group');
    const resizeHandle = target.classList.contains('comment-resize-handle') ? target : null;
    const pin = target.classList.contains('pin') ? target : null;

    // 1. PANNING (Right Click or Middle Click)
    if (e.button === 2 || e.button === 1) {
        inputMode = 'PANNING';
        return;
    }

    // 2. CONNECTING (Left Click on Pin)
    if (pin && e.button === 0) {
        // ... (Connecting logic unchanged) ...
        const nodeId = parseInt(pin.dataset.nodeId, 10);
        const { pinKey, pinType } = pin.dataset;
        if (pinType === 'output') {
            inputMode = 'CONNECTING';
            const fromNode = getNode(nodeId);
            const startPos = getPinPosition(fromNode, pinKey, 'output');
            const tempPath = document.createElementNS('http://www.w3.org/2000/svg', 'path');
            tempPath.setAttribute('class', 'connection-path stroke-gray-400 stroke-[3px] fill-none pointer-events-none dashed');
            state.activeConnection = { fromNodeId: nodeId, fromPinKey: pinKey, element: tempPath, startPos };
            render();
        } else {
            const node = getNode(nodeId);
            if (node.inputs[pinKey].connection) {
                const oldConn = node.inputs[pinKey].connection;
                const fromNode = getNode(oldConn.fromNodeId);
                if(fromNode) fromNode.disconnect(node, pinKey, oldConn.fromPinKey);
                removeConnection(nodeId, pinKey);
                node.isDirty = true;
                render();
            }
        }
        e.stopPropagation();
        return;
    }

    // 3. NODE INTERACTION (Left Click on Node)
    if (nodeGroup && e.button === 0) {
        // ... (Node selection logic unchanged) ...
        const nodeId = parseInt(nodeGroup.dataset.id, 10);
        if (e.shiftKey) {
            if (state.selectedNodeIds.has(nodeId)) {
                state.selectedNodeIds.delete(nodeId);
                if (state.selectedNodeId === nodeId) state.selectedNodeId = null;
            } else {
                state.selectedNodeIds.add(nodeId);
                state.selectedNodeId = nodeId;
            }
        } else {
            if (!state.selectedNodeIds.has(nodeId)) {
                state.selectedNodeIds.clear();
                state.selectedNodeIds.add(nodeId);
                state.selectedNodeId = nodeId;
            }
            state.selectedNodeId = nodeId; 
        }
        // Deselect comments
        state.selectedCommentId = null;

        inputMode = 'DRAGGING';
        initialSelection = state.nodes.filter(n => state.selectedNodeIds.has(n.id)).map(n => ({ id: n.id, startX: n.x, startY: n.y }));
        render();
        return;
    }

    // 4. COMMENT RESIZING (Bottom Right Handle)
    if (resizeHandle && e.button === 0) {
        inputMode = 'RESIZING_COMMENT';
        const commentId = parseInt(resizeHandle.dataset.commentId, 10);
        const comment = getComment(commentId);
        
        state.selectedCommentId = commentId;
        state.selectedNodeId = null; // Clear node selection for inspector clarity
        state.selectedNodeIds.clear();

        initialComment = { 
            id: commentId, 
            startW: comment.width, 
            startH: comment.height 
        };
        render();
        e.stopPropagation();
        return;
    }

    // 5. COMMENT DRAGGING (Header/Body Click)
    if (commentGroup && e.button === 0) {
        inputMode = 'DRAGGING_COMMENT';
        const commentId = parseInt(commentGroup.dataset.commentId, 10);
        const comment = getComment(commentId);

        state.selectedCommentId = commentId;
        state.selectedNodeId = null;
        state.selectedNodeIds.clear();

        initialComment = { 
            id: commentId, 
            startX: comment.x, 
            startY: comment.y 
        };

        // Identify "Captured" nodes (nodes strictly inside comment rect)
        nodesInsideComment = state.nodes.filter(n => {
            const nRight = n.x + n.width;
            const nBottom = n.y + n.height;
            const cRight = comment.x + comment.width;
            const cBottom = comment.y + comment.height;
            return (n.x >= comment.x && nRight <= cRight && n.y >= comment.y && nBottom <= cBottom);
        }).map(n => ({ id: n.id, startX: n.x, startY: n.y }));

        render();
        return;
    }

    // 6. MARQUEE SELECTION (Left Click on Background)
    if (e.button === 0) {
        inputMode = 'SELECTING';
        if (!e.shiftKey) {
            state.selectedNodeIds.clear();
            state.selectedNodeId = null;
            state.selectedCommentId = null;
        }
        state.selectionBox = { x: startWorld.x, y: startWorld.y, width: 0, height: 0 };
        render();
    }
}

function handlePointerMove(e) {
    const currentWorld = getWorldPos(e.clientX, e.clientY);
    const dx_screen = e.clientX - startMouse.x;
    const dy_screen = e.clientY - startMouse.y;
    const dx_world = dx_screen / state.zoom;
    const dy_world = dy_screen / state.zoom;

    if (inputMode === 'PANNING') {
        state.panOffset.x += dx_screen;
        state.panOffset.y += dy_screen;
        startMouse = { x: e.clientX, y: e.clientY }; 
        render();
    } 
    else if (inputMode === 'DRAGGING') {
        initialSelection.forEach(snapshot => {
            const node = getNode(snapshot.id);
            if (node) {
                node.x = snapshot.startX + dx_world;
                node.y = snapshot.startY + dy_world;
            }
        });
        render();
    }
    else if (inputMode === 'DRAGGING_COMMENT') {
        const comment = getComment(initialComment.id);
        if (comment) {
            comment.x = initialComment.startX + dx_world;
            comment.y = initialComment.startY + dy_world;

            // Move captured nodes
            nodesInsideComment.forEach(snapshot => {
                const node = getNode(snapshot.id);
                if (node) {
                    node.x = snapshot.startX + dx_world;
                    node.y = snapshot.startY + dy_world;
                }
            });
        }
        render();
    }
    else if (inputMode === 'RESIZING_COMMENT') {
        const comment = getComment(initialComment.id);
        if (comment) {
            // Ensure width/height don't go negative
            comment.width = Math.max(100, initialComment.startW + dx_world);
            comment.height = Math.max(50, initialComment.startH + dy_world);
        }
        render();
    }
    else if (inputMode === 'SELECTING') {
        const x = Math.min(startWorld.x, currentWorld.x);
        const y = Math.min(startWorld.y, currentWorld.y);
        const w = Math.abs(currentWorld.x - startWorld.x);
        const h = Math.abs(currentWorld.y - startWorld.y);
        state.selectionBox = { x, y, width: w, height: h };
        state.nodes.forEach(node => {
            const nodeRight = node.x + node.width;
            const nodeBottom = node.y + node.height;
            const boxRight = x + w;
            const boxBottom = y + h;
            const intersects = (node.x < boxRight && nodeRight > x && node.y < boxBottom && nodeBottom > y);
            if (intersects) state.selectedNodeIds.add(node.id);
        });
        render();
    }
    else if (inputMode === 'CONNECTING') {
        // ... (Connecting logic unchanged) ...
        if (state.activeConnection) {
            const { startPos, element } = state.activeConnection;
            element.setAttribute('d', calculateCurvedPath(startPos, currentWorld));
            const target = e.target;
            let newHoveredPin = null;
            if (target.classList.contains('pin') && target.dataset.pinType === 'input') {
                newHoveredPin = { nodeId: parseInt(target.dataset.nodeId, 10), pinKey: target.dataset.pinKey };
            }
            if (state.hoveredParamPin && (!newHoveredPin || state.hoveredParamPin.nodeId !== newHoveredPin.nodeId)) {
                const el = document.getElementById(`param-input-${state.hoveredParamPin.nodeId}-${state.hoveredParamPin.pinKey}`);
                if(el) el.style.display = '';
            }
            if (newHoveredPin) {
                const el = document.getElementById(`param-input-${newHoveredPin.nodeId}-${newHoveredPin.pinKey}`);
                if(el) el.style.display = 'none';
            }
            state.hoveredParamPin = newHoveredPin;
        }
    }
}

function handlePointerUp(e) {
    if (inputMode === 'PANNING') {
        const dist = Math.hypot(e.clientX - startMouse.x, e.clientY - startMouse.y);
        if (dist < 5) {
            const worldPos = getWorldPos(e.clientX, e.clientY);
            showContextMenu(e.clientX, e.clientY, worldPos.x, worldPos.y);
        }
    }

    // ... (Connecting logic) ...
    if (inputMode === 'CONNECTING') {
        const target = e.target;
        if (state.hoveredParamPin) {
             const el = document.getElementById(`param-input-${state.hoveredParamPin.nodeId}-${state.hoveredParamPin.pinKey}`);
             if(el) el.style.display = '';
             state.hoveredParamPin = null;
        }
        if (target.classList.contains('pin') && target.dataset.pinType === 'input') {
            const toNodeId = parseInt(target.dataset.nodeId, 10);
            const toPinKey = target.dataset.pinKey;
            const { fromNodeId, fromPinKey } = state.activeConnection;
            if (fromNodeId !== toNodeId) {
                const toNode = getNode(toNodeId);
                const fromNode = getNode(fromNodeId);
                if (toNode.inputs[toPinKey].connection) {
                    const oldConn = toNode.inputs[toPinKey].connection;
                    const oldFrom = getNode(oldConn.fromNodeId);
                    if(oldFrom) oldFrom.disconnect(toNode, toPinKey, oldConn.fromPinKey);
                    removeConnection(toNodeId, toPinKey);
                }
                addConnection({ fromNodeId, fromPinKey, toNodeId, toPinKey });
                if (getAudioContext()) fromNode.connect(toNode, toPinKey, fromPinKey);
                toNode.isDirty = true;
            }
        }
        state.activeConnection = null;
        render(); 
    }
    
    if (inputMode === 'SELECTING') {
        state.selectionBox = null;
        if (state.selectedNodeIds.size > 0) {
            state.selectedNodeId = Array.from(state.selectedNodeIds).pop();
        } else {
            state.selectedNodeId = null;
        }
        render();
    }

    if (inputMode === 'DRAGGING_COMMENT' || inputMode === 'RESIZING_COMMENT') {
        // Update selection if needed (for inspector)
        if (state.selectedCommentId !== null) updateInspectorUI();
    }

    inputMode = 'IDLE';
    initialSelection = [];
    initialComment = null;
    nodesInsideComment = [];
}

// ... (Rest of file: handleWheel, handleParamInput, handleKeyDown, setupSidebar, setupHeader) ...
// (Retaining these to save space, assume same as before)
function handleWheel(e) {
    e.preventDefault();
    const oldZoom = state.zoom;
    state.zoom *= e.deltaY < 0 ? 1.1 : 0.9;
    state.zoom = Math.max(0.2, Math.min(3, state.zoom));
    const CTM = canvas.getScreenCTM();
    const mousePos = { x: (e.clientX - CTM.e) / CTM.a, y: (e.clientY - CTM.f) / CTM.d };
    state.panOffset.x = mousePos.x - (mousePos.x - state.panOffset.x) * (state.zoom / oldZoom);
    state.panOffset.y = mousePos.y - (mousePos.y - state.panOffset.y) * (state.zoom / oldZoom);
    render();
}

function handleParamInput(e) {
    if (e.target.classList.contains('node-param-input')) {
        const nodeId = parseInt(e.target.dataset.nodeId, 10);
        const inputKey = e.target.dataset.inputKey;
        const rawValue = e.target.value;
        const value = parseFloat(rawValue);
        const node = getNode(nodeId);
        if (node && !isNaN(value) && rawValue !== '') {
            if (!node.params) node.params = {};
            node.params[inputKey] = value;
            node.updateParam(inputKey, value);
            node.isDirty = true;
            if (state.selectedNodeId === nodeId) updateInspectorUI(); 
        }
    }
}

function handleKeyDown(e) {
    if (e.key === 'Delete' || e.key === 'Backspace') {
        if (['INPUT', 'TEXTAREA'].includes(document.activeElement.tagName)) return;
        
        // Delete selected comments
        if (state.selectedCommentId !== null) {
            removeComment(state.selectedCommentId);
            state.selectedCommentId = null;
            render();
            return;
        }

        // Delete selected nodes
        if (state.selectedNodeIds.size > 0) {
            const idsToDelete = Array.from(state.selectedNodeIds);
            idsToDelete.forEach(id => {
                const node = getNode(id);
                if(node && node.type !== 'output') {
                     node.destroy();
                     removeNode(id);
                }
            });
            render();
        }
    }
}

function setupSidebarEvents() {
    const leftPanel = document.getElementById('left-panel');
    if (!leftPanel) return;
    leftPanel.addEventListener('click', (e) => {
        const target = e.target.closest('.add-node-btn, .add-variable-node-btn');
        if (!target) return;
        const x = (-state.panOffset.x + 100) / state.zoom;
        const y = (-state.panOffset.y + 100) / state.zoom;
        if (target.classList.contains('add-node-btn')) {
            const type = target.dataset.type;
            const constructor = NODE_CONSTRUCTORS[type];
            if (constructor) {
                const node = constructor(x, y);
                const added = addNode(node);
                const ctx = getAudioContext();
                if (ctx) added.audioGraphNodes = added.createAudioNode(ctx);
            }
        } else if (target.classList.contains('add-variable-node-btn')) {
            const node = new GetVariableNode(x, y, target.dataset.variableId);
            const added = addNode(node);
            const ctx = getAudioContext();
            if(ctx) added.audioGraphNodes = added.createAudioNode(ctx);
        }
        render();
    });
}

function setupHeaderEvents() {
    const harmBtn = document.getElementById('harmonics-toggle-btn');
    if (harmBtn) {
        harmBtn.addEventListener('click', () => {
            state.settings.useHarmonics = !state.settings.useHarmonics;
            harmBtn.textContent = state.settings.useHarmonics ? "Harmonies" : "Frequencies";
            harmBtn.classList.toggle('bg-teal-600', state.settings.useHarmonics);
            harmBtn.classList.toggle('bg-indigo-600', !state.settings.useHarmonics);
            const newMultiplier = state.settings.useHarmonics ? BASE_FREQUENCY : 1;
            state.nodes.forEach(node => {
                let needsParamUpdate = false;
                let paramToUpdate = null;
                if (node.type === 'oscillator' && typeof node.params.harmonic !== 'undefined') {
                    if (node.audioGraphNodes && node.audioGraphNodes.multiplier) { node.audioGraphNodes.multiplier.value = newMultiplier; }
                    paramToUpdate = 'harmonic'; needsParamUpdate = true;
                }
                if ((node.type === 'svf' || node.type === 'ladder') && typeof node.params.cutoff !== 'undefined') {
                    if (node.audioGraphNodes && node.audioGraphNodes.multiplier) { node.audioGraphNodes.multiplier.value = newMultiplier; }
                    paramToUpdate = 'cutoff'; needsParamUpdate = true;
                }
                if (node.type === 'crusher' && typeof node.params.sampleRate !== 'undefined') {
                    if (node.audioGraphNodes && node.audioGraphNodes.multiplier) { node.audioGraphNodes.multiplier.value = newMultiplier; }
                    paramToUpdate = 'sampleRate'; needsParamUpdate = true;
                }
                if (node.type === 'mod' && typeof node.params.depth !== 'undefined') {
                    paramToUpdate = 'depth'; needsParamUpdate = true;
                }
                if (needsParamUpdate && paramToUpdate) {
                    if (state.settings.useHarmonics) { node.params[paramToUpdate] = node.params[paramToUpdate] / BASE_FREQUENCY; } 
                    else { node.params[paramToUpdate] = node.params[paramToUpdate] * BASE_FREQUENCY; }
                    node.updateParam(paramToUpdate, node.params[paramToUpdate]);
                }
            });
            render(); 
            updateInspectorUI(); 
        });
    }

    const radBtn = document.getElementById('radians-toggle-btn');
    if (radBtn) {
        radBtn.addEventListener('click', () => {
            state.settings.useDegrees = !state.settings.useDegrees;
            radBtn.textContent = state.settings.useDegrees ? "Degrees" : "Radians";
            radBtn.classList.toggle('bg-teal-600', state.settings.useDegrees);
            radBtn.classList.toggle('bg-indigo-600', !state.settings.useDegrees);
            state.nodes.forEach(node => {
                if (node.type === 'oscillator' && typeof node.params.phase !== 'undefined') {
                    if (state.settings.useDegrees) {
                        node.params.phase = node.params.phase * (180 / Math.PI);
                    } else {
                        node.params.phase = node.params.phase * (Math.PI / 180);
                    }
                    node.updateParam('phase', node.params.phase);
                }
            });
            render();
            updateInspectorUI();
        });
    }
}