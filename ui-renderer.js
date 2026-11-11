// ui-renderer.js
// Handles DOM manipulation for the node graph.

import { state } from './state.js';
import { NODE_WIDTH, HEADER_HEIGHT, PIN_HEIGHT } from './constants.js';
import { updateInspectorUI } from './ui-inspector.js';

let elements = {};

export function initRenderer() {
    elements = {
        canvasContainer: document.getElementById('node-canvas-container'),
        canvas: document.getElementById('node-canvas'),
        transformGroup: document.getElementById('canvas-transform-group'),
        nodesLayer: document.getElementById('nodes-layer'),
        connectionsLayer: document.getElementById('connections-layer'),
        variablesContainer: document.getElementById('variables-container'),
        uiLayer: null,
        commentsLayer: null // NEW
    };

    // Ensure Layers exist in correct Z-order
    // Order: Comments -> Connections -> Nodes -> UI (Screen Space)
    
    // Comments Layer (Background)
    if (!elements.commentsLayer) {
        elements.commentsLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        elements.commentsLayer.id = 'comments-layer';
        // Insert at the beginning of transform group to be behind everything
        if (elements.transformGroup.firstChild) {
            elements.transformGroup.insertBefore(elements.commentsLayer, elements.transformGroup.firstChild);
        } else {
            elements.transformGroup.appendChild(elements.commentsLayer);
        }
    }

    if (!elements.uiLayer) {
        elements.uiLayer = document.createElementNS('http://www.w3.org/2000/svg', 'g');
        elements.uiLayer.id = 'ui-layer';
        elements.canvas.appendChild(elements.uiLayer);
    }

    if (elements.canvasContainer) {
        elements.canvasContainer.style.userSelect = 'none';
        elements.canvasContainer.style.webkitUserSelect = 'none';
        elements.canvasContainer.style.outline = 'none';
    }

    return elements;
}

export function render() {
    if (!elements.transformGroup) initRenderer();

    elements.transformGroup.setAttribute('transform', 
        `translate(${state.panOffset.x}, ${state.panOffset.y}) scale(${state.zoom})`);

    // 0. Draw Comments (NEW)
    if (elements.commentsLayer) {
        elements.commentsLayer.innerHTML = '';
        state.comments.forEach(comment => {
            const group = createCommentElement(comment);
            elements.commentsLayer.appendChild(group);
        });
    }

    // 1. Draw Nodes
    elements.nodesLayer.innerHTML = '';
    state.nodes.forEach(node => {
        const nodeGroup = createNodeElement(node);
        elements.nodesLayer.appendChild(nodeGroup);
    });

    // 2. Draw Connections
    elements.connectionsLayer.innerHTML = '';
    state.connections.forEach(conn => {
        const path = createConnectionElement(conn);
        elements.connectionsLayer.appendChild(path);
    });

    // 3. Draw Active Wiring
    if (state.activeConnection && state.activeConnection.element) {
        elements.connectionsLayer.appendChild(state.activeConnection.element);
    }

    // 4. Draw Selection Box
    elements.uiLayer.innerHTML = '';
    if (state.selectionBox) {
        const screenX = (state.selectionBox.x * state.zoom) + state.panOffset.x;
        const screenY = (state.selectionBox.y * state.zoom) + state.panOffset.y;
        const screenW = state.selectionBox.width * state.zoom;
        const screenH = state.selectionBox.height * state.zoom;

        const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
        rect.setAttribute('x', screenX);
        rect.setAttribute('y', screenY);
        rect.setAttribute('width', screenW);
        rect.setAttribute('height', screenH);
        rect.setAttribute('fill', 'rgba(99, 102, 241, 0.2)'); 
        rect.setAttribute('stroke', '#6366F1');
        rect.setAttribute('stroke-width', '1');
        rect.setAttribute('stroke-dasharray', '4');
        rect.setAttribute('pointer-events', 'none'); 
        elements.uiLayer.appendChild(rect);
    }

    renderVariablesPanel();
    updateInspectorUI();
}

function createCommentElement(comment) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${comment.x}, ${comment.y})`);
    group.dataset.commentId = comment.id;
    group.setAttribute('class', 'comment-group cursor-grab');

    const isSelected = state.selectedCommentId === comment.id;

    // Background Rect
    const rect = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    rect.setAttribute('width', comment.width);
    rect.setAttribute('height', comment.height);
    rect.setAttribute('fill', comment.color || 'rgba(255, 255, 255, 0.1)');
    rect.setAttribute('stroke', isSelected ? '#FBBF24' : 'none'); // Amber selection
    rect.setAttribute('stroke-width', isSelected ? '2' : '0');
    rect.setAttribute('rx', '8'); // Rounded corners

    // Header Area (Clickable/Draggable)
    const header = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    header.setAttribute('width', comment.width);
    header.setAttribute('height', 30);
    header.setAttribute('fill', 'rgba(0,0,0,0.3)');
    header.setAttribute('rx', '8');
    
    // Title Text
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', 10);
    text.setAttribute('y', 20);
    text.setAttribute('fill', 'rgba(255,255,255,0.8)');
    text.setAttribute('font-family', 'sans-serif');
    text.setAttribute('font-weight', 'bold');
    text.setAttribute('font-size', '14px');
    text.setAttribute('pointer-events', 'none'); // Let clicks pass through to header rect
    text.textContent = comment.title;

    // Resize Handle (Bottom Right)
    const resizeHandle = document.createElementNS('http://www.w3.org/2000/svg', 'rect');
    resizeHandle.setAttribute('x', comment.width - 15);
    resizeHandle.setAttribute('y', comment.height - 15);
    resizeHandle.setAttribute('width', 15);
    resizeHandle.setAttribute('height', 15);
    resizeHandle.setAttribute('fill', 'rgba(255,255,255,0.1)');
    resizeHandle.setAttribute('cursor', 'nwse-resize');
    resizeHandle.setAttribute('class', 'comment-resize-handle');
    resizeHandle.dataset.commentId = comment.id;

    group.appendChild(rect);
    group.appendChild(header);
    group.appendChild(text);
    group.appendChild(resizeHandle);

    return group;
}

function createNodeElement(node) {
    const group = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    group.setAttribute('transform', `translate(${node.x}, ${node.y})`);
    group.setAttribute('class', 'node-group');
    group.dataset.id = node.id;
    
    const numInputs = Object.keys(node.inputs).length;
    const numOutputs = Object.keys(node.outputs).length;
    node.height = HEADER_HEIGHT + Math.max(numInputs, numOutputs) * PIN_HEIGHT;
    
    const foreignObject = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    foreignObject.setAttribute('width', node.width);
    foreignObject.setAttribute('height', node.height);
    
    const nodeBody = document.createElement('div');
    const isSelected = state.selectedNodeIds.has(node.id);
    
    nodeBody.className = `node rounded-lg w-full h-full flex flex-col text-white ${isSelected ? 'selected' : ''}`;
    
    let titleText = node.title;
    if (node.variableId && state.variables[node.variableId]) {
        titleText += `: ${state.variables[node.variableId].name}`;
    }

    nodeBody.innerHTML = `
        <div class="title ${node.color} p-2 rounded-t-lg font-bold text-sm cursor-grab truncate select-none">
            ${titleText}
        </div>
        <div class="content relative flex-grow p-2 bg-gray-700 rounded-b-lg"></div>
    `;
    
    foreignObject.appendChild(nodeBody);
    group.appendChild(foreignObject);
    
    let inputIndex = 0;
    for (const key in node.inputs) {
        const input = node.inputs[key];
        const yPos = HEADER_HEIGHT + (inputIndex + 0.5) * PIN_HEIGHT;
        
        group.appendChild(createPinElement(node, key, 'input', 0, yPos));
        
        const labelText = getDynamicLabel(node, key, input.name);
        group.appendChild(createPinLabel(labelText, 15, yPos, 'start'));
        
        if (input.isParam && !input.connection) {
            group.appendChild(createInlineParamInput(node, key, inputIndex));
        }
        inputIndex++;
    }
    
    let outputIndex = 0;
    for (const key in node.outputs) {
        const yPos = HEADER_HEIGHT + (outputIndex + 0.5) * PIN_HEIGHT;
        group.appendChild(createPinElement(node, key, 'output', node.width, yPos));
        group.appendChild(createPinLabel(node.outputs[key].name, node.width - 15, yPos, 'end'));
        outputIndex++;
    }
    
    return group;
}

function getDynamicLabel(node, key, defaultName) {
    const useHarmonics = state.settings.useHarmonics;
    const useDegrees = state.settings.useDegrees;

    if (node.type === 'oscillator' && key === 'harmonic') {
        return useHarmonics ? "Harmonic" : "Freq (Hz)";
    }
    if ((node.type === 'svf' || node.type === 'ladder') && key === 'cutoff') {
        return useHarmonics ? "Cutoff" : "Cutoff (Hz)";
    }
    if (node.type === 'mod' && key === 'depth') {
        return useHarmonics ? "Depth" : "Depth (Hz)";
    }
    if (node.type === 'oscillator' && key === 'phase') {
        return useDegrees ? "Phase (Deg)" : "Phase (Rad)";
    }
    
    return defaultName;
}

function createPinElement(node, key, type, x, y) {
    const pinGroup = document.createElementNS('http://www.w3.org/2000/svg', 'g');
    pinGroup.setAttribute('class', 'pin-group');
    
    const visibleCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    visibleCircle.setAttribute('cx', x);
    visibleCircle.setAttribute('cy', y);
    visibleCircle.setAttribute('r', 5);
    visibleCircle.setAttribute('class', 'pin-visible stroke-2 stroke-gray-400 fill-gray-600 pointer-events-none transition-transform duration-100');
    
    const hitboxCircle = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
    hitboxCircle.setAttribute('cx', x);
    hitboxCircle.setAttribute('cy', y);
    hitboxCircle.setAttribute('r', 12);
    hitboxCircle.setAttribute('class', 'pin');
    hitboxCircle.setAttribute('style', 'fill: transparent; cursor: crosshair;');
    
    hitboxCircle.dataset.nodeId = node.id;
    hitboxCircle.dataset.pinKey = key;
    hitboxCircle.dataset.pinType = type;
    
    pinGroup.appendChild(visibleCircle);
    pinGroup.appendChild(hitboxCircle);
    return pinGroup;
}

function createPinLabel(name, x, y, anchor) {
    const text = document.createElementNS('http://www.w3.org/2000/svg', 'text');
    text.setAttribute('x', x);
    text.setAttribute('y', y);
    text.setAttribute('class', 'fill-current text-gray-300 text-xs pointer-events-none select-none');
    text.setAttribute('text-anchor', anchor);
    text.setAttribute('alignment-baseline', 'middle');
    text.textContent = name;
    return text;
}

function createInlineParamInput(node, key, index) {
    const fieldY = 30.5 + (index * PIN_HEIGHT);
    const fieldX = -55; 
    
    const inputFO = document.createElementNS('http://www.w3.org/2000/svg', 'foreignObject');
    inputFO.setAttribute('x', fieldX);
    inputFO.setAttribute('y', fieldY);
    inputFO.setAttribute('width', 50);
    inputFO.setAttribute('height', 20);
    inputFO.id = `param-input-${node.id}-${key}`; 
    
    const inputEl = document.createElement('input');
    inputEl.type = 'number';
    inputEl.className = 'node-param-input bg-gray-900 text-white w-full h-full p-1 rounded text-xs border border-gray-600 focus:border-indigo-500 focus:outline-none';
    inputEl.step = '0.01';
    
    const currentValue = (node.params && typeof node.params[key] !== 'undefined') 
                         ? node.params[key] 
                         : node.inputs[key].defaultValue;
                         
    inputEl.value = currentValue;
    
    inputEl.dataset.inputKey = key;
    inputEl.dataset.nodeId = node.id;
    
    inputEl.addEventListener('mousedown', e => e.stopPropagation());
    
    const inputWrapper = document.createElement('div');
    inputWrapper.setAttribute('xmlns', 'http://www.w3.org/1999/xhtml');
    inputWrapper.appendChild(inputEl);
    inputFO.appendChild(inputWrapper);

    return inputFO;
}

function createConnectionElement(conn) {
    const fromNode = state.nodes.find(n => n.id === conn.fromNodeId);
    const toNode = state.nodes.find(n => n.id === conn.toNodeId);
    
    if (!fromNode || !toNode) return document.createElementNS('http://www.w3.org/2000/svg', 'g');
    
    const fromPinPos = getPinPosition(fromNode, conn.fromPinKey, 'output');
    const toPinPos = getPinPosition(toNode, conn.toPinKey, 'input');
    
    const path = document.createElementNS('http://www.w3.org/2000/svg', 'path');
    const d = calculateCurvedPath(fromPinPos, toPinPos);
    
    path.setAttribute('d', d);
    path.setAttribute('class', 'connection-path stroke-indigo-400 stroke-[3px] fill-none pointer-events-none');
    return path;
}

export function getPinPosition(node, key, type) {
    const keys = Object.keys(type === 'input' ? node.inputs : node.outputs);
    const index = keys.indexOf(key);
    const y = node.y + HEADER_HEIGHT + (index + 0.5) * PIN_HEIGHT;
    const x = node.x + (type === 'input' ? 0 : node.width);
    return { x, y };
}

export function calculateCurvedPath(start, end) {
    const curvature = 50;
    return `M ${start.x} ${start.y} C ${start.x + curvature} ${start.y}, ${end.x - curvature} ${end.y}, ${end.x} ${end.y}`;
}

function renderVariablesPanel() {
    if(!elements.variablesContainer) return;
    elements.variablesContainer.innerHTML = '';
    
    for (const varId in state.variables) {
        const variable = state.variables[varId];
        const button = document.createElement('button');
        button.className = 'add-variable-node-btn bg-rose-500 hover:bg-rose-600 px-3 py-2 rounded-md text-sm font-semibold w-full text-left transition-colors mb-1';
        button.textContent = `Get ${variable.name}`;
        button.dataset.variableId = varId;
        elements.variablesContainer.appendChild(button);
    }
}