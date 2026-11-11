// ui-inspector.js
// Manages Inspector and Preview Modals (Mini & Large)

import { state, getNode, addNode, addConnection, removeNode, getComment, removeComment } from './state.js'; // Added comment helpers
import { render } from './ui-renderer.js';
import { play, stop, exportAudio, generatePreviewWaveform, getAudioContext } from './audio-core.js';
import { SetVariableNode } from './nodes.js';
import { PREVIEW_DURATION, LARGE_PREVIEW_DURATION, BASE_FREQUENCY } from './constants.js';
import { GraphRenderer } from './graph.js'; 
import { openExportModal } from './ui-export.js'; 

let inspectorDesktop, mobilePanelContent, mobilePanelContainer;
let previewModal, largeCanvas;
let miniGraph = null;
let largeGraph = null;

export function initInspector() {
    inspectorDesktop = document.getElementById('inspector-desktop');
    mobilePanelContent = document.getElementById('mobile-panel-content');
    mobilePanelContainer = document.getElementById('mobile-panel-container');
    
    previewModal = document.getElementById('preview-modal-container');
    largeCanvas = document.getElementById('large-preview-canvas');
    
    const closeBtn = document.getElementById('preview-modal-close-btn');
    const backdrop = document.getElementById('preview-modal-backdrop');
    if(closeBtn) closeBtn.addEventListener('click', closeLargePreview);
    if(backdrop) backdrop.addEventListener('click', closeLargePreview);

    if(largeCanvas) {
        largeGraph = new GraphRenderer(largeCanvas, 'dark');
        setupLargePreviewInteractions(largeCanvas);
        window.addEventListener('resize', () => {
            if(state.isLargePreviewOpen && largeGraph) {
                largeGraph.resize();
                const node = getNode(state.selectedNodeId);
                if(node && node.cachedLargeBuffer) {
                    largeGraph.render(node.cachedLargeBuffer, LARGE_PREVIEW_DURATION, state.largePreviewPan, state.largePreviewZoom, { isLarge: true });
                }
            }
        });
    }

    [inspectorDesktop, mobilePanelContent].forEach(panel => {
        if (panel) bindPanelEvents(panel);
    });
}

export function updateInspectorUI() {
    if (!inspectorDesktop) initInspector();
    
    const isMob = window.innerWidth < 1024;
    let container = isMob ? mobilePanelContent : inspectorDesktop;
    
    if (isMob) {
        if ((state.selectedNodeId !== null || state.selectedCommentId !== null) && !state.isPanelOpen) {
            openMobilePanel();
        } else if (state.selectedNodeId === null && state.selectedCommentId === null && state.isPanelOpen) {
            closeMobilePanel();
            return;
        }
    }

    container.innerHTML = '';
    const template = document.getElementById('inspector-template');
    const content = template.content.cloneNode(true);
    const placeholder = content.querySelector('.inspector-placeholder');
    const properties = content.querySelector('.inspector-properties');

    // 1. Comment Selection
    if (state.selectedCommentId !== null) {
        const comment = getComment(state.selectedCommentId);
        if (comment) {
            placeholder.classList.add('hidden');
            properties.classList.remove('hidden');
            
            content.querySelector('.node-title').textContent = "Comment";
            content.querySelector('.node-id').textContent = `ID: ${comment.id}`;
            
            const paramsContainer = content.querySelector('.node-params');
            
            // Title Input
            const titleGroup = document.createElement('div');
            titleGroup.innerHTML = `
                <label class="block text-sm font-medium text-gray-300">Title</label>
                <input type="text" value="${comment.title}" data-comment-prop="title"
                       class="inspector-input mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white">
            `;
            paramsContainer.appendChild(titleGroup);

            // Color Input
            const colorGroup = document.createElement('div');
            // Use HTML5 color input for simplicity in this version
            // For full RGBA transparency support, we'd need a custom widget or careful hex conversion.
            // For now, let's offer a few presets or a text field for RGBA.
            colorGroup.innerHTML = `
                <label class="block text-sm font-medium text-gray-300">Color (RGBA)</label>
                <input type="text" value="${comment.color}" data-comment-prop="color"
                       class="inspector-input mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white text-xs font-mono">
                <div class="flex gap-2 mt-2">
                    <button class="w-6 h-6 rounded-full bg-red-900 border border-gray-500" onclick="setCommentColor('rgba(239, 68, 68, 0.2)')"></button>
                    <button class="w-6 h-6 rounded-full bg-green-900 border border-gray-500" onclick="setCommentColor('rgba(34, 197, 94, 0.2)')"></button>
                    <button class="w-6 h-6 rounded-full bg-blue-900 border border-gray-500" onclick="setCommentColor('rgba(59, 130, 246, 0.2)')"></button>
                    <button class="w-6 h-6 rounded-full bg-yellow-900 border border-gray-500" onclick="setCommentColor('rgba(234, 179, 8, 0.2)')"></button>
                    <button class="w-6 h-6 rounded-full bg-gray-700 border border-gray-500" onclick="setCommentColor('rgba(255, 255, 255, 0.1)')"></button>
                </div>
            `;
            paramsContainer.appendChild(colorGroup);
            
            // Delete Button
            const deleteBtn = document.createElement('button');
            deleteBtn.className = "w-full mt-6 bg-red-800 hover:bg-red-900 px-3 py-2 rounded-md text-sm font-semibold border border-red-700";
            deleteBtn.textContent = "Delete Comment";
            deleteBtn.onclick = () => {
                removeComment(comment.id);
                render();
            };
            content.querySelector('.inspector-actions').appendChild(deleteBtn);

            // Hide Wave Preview for Comments
            content.querySelector('.wave-preview-canvas').parentElement.parentElement.style.display = 'none';
            content.querySelector('.node-notes').style.display = 'none';

            container.appendChild(content);
            
            // Attach color button listeners manually since onclick string eval is unsafe/messy
            const buttons = container.querySelectorAll('button[onclick^="setCommentColor"]');
            buttons.forEach(btn => {
                const color = btn.getAttribute('onclick').match(/'([^']+)'/)[1];
                btn.removeAttribute('onclick');
                btn.addEventListener('click', () => {
                    comment.color = color;
                    render();
                    updateInspectorUI();
                });
            });

            return;
        }
    }

    // 2. Node Selection (Existing Logic)
    const selectedNode = getNode(state.selectedNodeId);
    
    if (selectedNode) {
        // ... (Existing node rendering logic) ...
        placeholder.classList.add('hidden');
        properties.classList.remove('hidden');
        
        let titleText = selectedNode.title;
        if (selectedNode.variableId && state.variables[selectedNode.variableId]) { 
            titleText += `: ${state.variables[selectedNode.variableId].name}`; 
        }
        content.querySelector('.node-title').textContent = titleText;
        content.querySelector('.node-id').textContent = `ID: ${selectedNode.id}`;
        
        const paramsContainer = content.querySelector('.node-params');
        buildParamsUI(selectedNode, paramsContainer);
        
        const actionsContainer = content.querySelector('.inspector-actions');
        buildActionsUI(selectedNode, actionsContainer);
        
        const notesArea = content.querySelector('.node-notes-textarea');
        notesArea.value = selectedNode.notes || "";
        notesArea.dataset.nodeId = selectedNode.id;

        const expandBtn = content.querySelector('.expand-preview-btn');
        if(expandBtn) {
            expandBtn.addEventListener('click', () => openLargePreview(selectedNode));
        }

        container.appendChild(content);

        const canvas = container.querySelector('.wave-preview-canvas');
        if (canvas) {
            miniGraph = new GraphRenderer(canvas, 'dark');
            if(state.previewZoom.x < 0.1) state.previewZoom.x = 0.1;
            if(state.previewZoom.y < 0.1) state.previewZoom.y = 0.1;
            updateGraph(miniGraph, selectedNode, PREVIEW_DURATION, state.previewPan, state.previewZoom, container.querySelector('#preview-status'), false);
            setupMiniPreviewInteractions(canvas);
        }

    } else {
        placeholder.classList.remove('hidden');
        properties.classList.add('hidden');
        container.appendChild(content);
    }
}

// ... (Existing helper functions: updateGraph, openLargePreview, closeLargePreview, setupInteractions, buildParamsUI, buildActionsUI) ...
// (Retaining functions to save space, assuming they are unchanged unless noted)

async function updateGraph(renderer, node, duration, pan, zoom, statusEl, isLarge) {
    if (!renderer) return;
    renderer.resize();

    let waveform;
    if (isLarge) {
        waveform = node.cachedLargeBuffer;
    } else {
        if (node.isDirty || !node.cachedPreviewBuffer) {
            if (statusEl) statusEl.textContent = 'Rendering...';
            try {
                waveform = await generatePreviewWaveform(node, duration);
                node.cachedPreviewBuffer = waveform;
                node.isDirty = false;
                if (statusEl) statusEl.textContent = '';
                renderer.render(waveform, duration, pan, zoom, { isLarge });
                return;
            } catch (e) {
                console.error("Preview Generation Failed:", e);
                if (statusEl) statusEl.textContent = 'Error';
                return;
            }
        } else {
            waveform = node.cachedPreviewBuffer;
        }
    }

    if (waveform) {
        renderer.render(waveform, duration, pan, zoom, { isLarge });
    }
}

async function openLargePreview(node) {
    if (!node) return;
    state.isLargePreviewOpen = true;
    previewModal.classList.add('is-open');
    document.getElementById('preview-modal-title').textContent = `Analysis: ${node.title}`;
    
    if(largeGraph) largeGraph.resize();

    const ctx = largeCanvas.getContext('2d');
    ctx.fillStyle = '#000';
    ctx.fillRect(0,0,largeCanvas.width,largeCanvas.height);
    ctx.fillStyle = '#666';
    ctx.font = '20px sans-serif';
    ctx.fillText("Calculating 10s High-Res Preview...", 50, 50);

    try {
        const longBuffer = await generatePreviewWaveform(node, LARGE_PREVIEW_DURATION);
        node.cachedLargeBuffer = longBuffer; 
        
        if (largeGraph) {
            largeGraph.render(longBuffer, LARGE_PREVIEW_DURATION, state.largePreviewPan, state.largePreviewZoom, { isLarge: true });
        }
    } catch(e) {
        console.error(e);
    }
}

function closeLargePreview() {
    state.isLargePreviewOpen = false;
    previewModal.classList.remove('is-open');
}

function setupMiniPreviewInteractions(canvas) {
    let isDragging = false;
    let startX, startY;
    let startPan = { ...state.previewPan };

    canvas.onmousedown = (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startPan = { ...state.previewPan };
    };
    
    canvas.onmousemove = (e) => {
        if(!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const baseViewSeconds = 0.05;
        const viewDuration = baseViewSeconds / state.previewZoom.x;
        const secondsPerPixel = viewDuration / canvas.width;
        state.previewPan.x = startPan.x - (dx * secondsPerPixel);
        state.previewPan.y = startPan.y + (dy * 0.01 / state.previewZoom.y); 
        const node = getNode(state.selectedNodeId);
        if(node && miniGraph) updateGraph(miniGraph, node, PREVIEW_DURATION, state.previewPan, state.previewZoom, null, false);
    };
    
    canvas.onmouseup = () => isDragging = false;
    canvas.onmouseleave = () => isDragging = false;
    
    canvas.onwheel = (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const isAmplitudeZone = mouseX < rect.width * 0.25;
        if (isAmplitudeZone || e.shiftKey) {
             if (e.deltaY < 0) state.previewZoom.y *= 1.1;
             else state.previewZoom.y *= 0.9;
        } else {
             if (e.deltaY < 0) state.previewZoom.x *= 1.1;
             else state.previewZoom.x *= 0.9;
        }
        const node = getNode(state.selectedNodeId);
        if(node && miniGraph) updateGraph(miniGraph, node, PREVIEW_DURATION, state.previewPan, state.previewZoom, null, false);
    }
}

function setupLargePreviewInteractions(canvas) {
    let isDragging = false;
    let startX, startY;
    let startPan = { ...state.largePreviewPan };

    canvas.onmousedown = (e) => {
        isDragging = true;
        startX = e.clientX;
        startY = e.clientY;
        startPan = { ...state.largePreviewPan };
    };
    
    canvas.onmousemove = (e) => {
        if(!isDragging) return;
        const dx = e.clientX - startX;
        const dy = e.clientY - startY;
        const baseViewSeconds = 0.2;
        const viewDuration = baseViewSeconds / state.largePreviewZoom.x;
        const secondsPerPixel = viewDuration / canvas.width;
        state.largePreviewPan.x = startPan.x - (dx * secondsPerPixel);
        state.largePreviewPan.y = startPan.y + (dy * 0.005 / state.largePreviewZoom.y);
        const node = getNode(state.selectedNodeId);
        if(node && largeGraph) largeGraph.render(node.cachedLargeBuffer, LARGE_PREVIEW_DURATION, state.largePreviewPan, state.largePreviewZoom, { isLarge: true });
    };
    
    canvas.onmouseup = () => isDragging = false;
    
    canvas.onwheel = (e) => {
        e.preventDefault();
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const isAmplitudeZone = mouseX < rect.width * 0.1; 
        if (isAmplitudeZone || e.shiftKey) {
             if (e.deltaY < 0) state.largePreviewZoom.y *= 1.1;
             else state.largePreviewZoom.y *= 0.9;
        } else {
             if (e.deltaY < 0) state.largePreviewZoom.x *= 1.1;
             else state.largePreviewZoom.x *= 0.9;
        }
        const node = getNode(state.selectedNodeId);
        if(node && largeGraph) largeGraph.render(node.cachedLargeBuffer, LARGE_PREVIEW_DURATION, state.largePreviewPan, state.largePreviewZoom, { isLarge: true });
    }
}

function buildParamsUI(node, container) {
    if (node.type === 'output') return;

    if (node.variableId) {
        const group = document.createElement('div');
        group.innerHTML = `
            <label class="block text-sm font-medium text-gray-300">Variable Name</label>
            <input type="text" value="${state.variables[node.variableId].name}" 
                   class="variable-name-input mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 sm:text-sm"
                   data-variable-id="${node.variableId}">
        `;
        container.appendChild(group);
    }

    if (['oscillator', 'noise'].includes(node.type)) {
        let options = [];
        if (node.type === 'oscillator') options = ['sine', 'square', 'sawtooth', 'triangle'];
        if (node.type === 'noise') options = ['white', 'pink', 'brownian'];
        
        const group = document.createElement('div');
        const optsHtml = options.map(o => `<option value="${o}" ${node.params.type === o ? 'selected' : ''}>${o.charAt(0).toUpperCase() + o.slice(1)}</option>`).join('');
        
        group.innerHTML = `
            <label class="block text-sm font-medium text-gray-300">Type</label>
            <select data-param="type" class="inspector-input mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 sm:text-sm">
                ${optsHtml}
            </select>
        `;
        container.appendChild(group);
    }

    for (const key in node.params) {
        if (key === 'type') continue; 
        
        let label = key.charAt(0).toUpperCase() + key.slice(1).replace(/([A-Z])/g, ' $1');
        let step = 0.01;
        let value = node.params[key];

        if (node.type === 'mod' && key === 'rate') label = 'Rate (Hz)';
        if (node.type === 'reverb' && key === 'decay') label = 'Decay (0=long)';

        if (node.type === 'oscillator' && key === 'harmonic') {
            if (state.settings.useHarmonics) {
                label = 'Harmonic'; step = 0.1;
            } else {
                label = 'Frequency (Hz)'; step = 10;
            }
        }
        if ((node.type === 'svf' || node.type === 'ladder') && key === 'cutoff') {
            if (state.settings.useHarmonics) {
                label = 'Cutoff (Harm)'; step = 0.1;
            } else {
                label = 'Cutoff (Hz)'; step = 10;
            }
        }
        if (node.type === 'mod' && key === 'depth') {
            if (state.settings.useHarmonics) {
                label = 'Depth (Harm)'; step = 0.1;
            } else {
                label = 'Depth (Hz)'; step = 10;
            }
        }
        if (node.type === 'crusher' && key === 'sampleRate') {
            if (state.settings.useHarmonics) {
                label = 'Rate (Harm)'; step = 0.1;
            } else {
                label = 'Rate (Hz)'; step = 100;
            }
        }
        if (node.type === 'oscillator' && key === 'phase') {
            if (state.settings.useDegrees) {
                label = 'Phase (Deg)'; step = 1.0;
            } else {
                label = 'Phase (Rad)'; step = 0.1;
            }
        }

        const group = document.createElement('div');
        group.innerHTML = `
            <label class="block text-sm font-medium text-gray-300">${label}</label>
            <input type="number" step="${step}" value="${value}" data-param="${key}" 
                   class="inspector-input mt-1 block w-full bg-gray-700 border border-gray-600 rounded-md shadow-sm py-2 px-3 text-white focus:outline-none focus:ring-indigo-500 sm:text-sm">
        `;
        container.appendChild(group);
    }
}

function buildActionsUI(node, container) {
    if (node.type === 'output') {
        const btn = document.createElement('button');
        btn.className = `w-full px-3 py-2 rounded-md text-sm font-semibold transition-colors ${state.isPlaying ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'}`;
        btn.textContent = state.isPlaying ? 'Stop Audio' : 'Play Audio';
        btn.onclick = () => { if(state.isPlaying) stop(); else play(); updateInspectorUI(); };
        container.appendChild(btn);
        
        const expBtn = document.createElement('button');
        expBtn.className = "w-full mt-2 bg-indigo-600 hover:bg-indigo-700 px-3 py-2 rounded-md text-sm font-semibold";
        expBtn.textContent = "Export WAV";
        expBtn.onclick = () => {
            const modal = document.getElementById('export-modal-container');
            if(modal) modal.classList.add('is-open');
        };
        container.appendChild(expBtn);
    }

    if (Object.keys(node.outputs).length > 0) {
        for (const pinKey in node.outputs) {
            const btn = document.createElement('button');
            btn.className = "w-full mt-2 bg-rose-600 hover:bg-rose-700 px-3 py-2 rounded-md text-sm font-semibold";
            btn.textContent = `Set ${node.outputs[pinKey].name} as Variable`;
            btn.onclick = () => createVariableFromNode(node, pinKey);
            container.appendChild(btn);
        }
    }

    if (node.type === 'adsr') {
        const btn = document.createElement('button');
        btn.className = "w-full mt-2 bg-blue-600 hover:bg-blue-700 px-3 py-2 rounded-md text-sm font-semibold";
        btn.textContent = "Trigger Envelope";
        btn.onclick = () => { if(node.trigger) node.trigger(); };
        container.appendChild(btn);
    }

    if (node.type !== 'output') {
        const deleteBtn = document.createElement('button');
        deleteBtn.className = "w-full mt-6 bg-red-800 hover:bg-red-900 px-3 py-2 rounded-md text-sm font-semibold border border-red-700";
        deleteBtn.textContent = "Delete Node";
        deleteBtn.onclick = () => {
            if (node.destroy) node.destroy();
            removeNode(node.id);
            render(); 
        };
        container.appendChild(deleteBtn);
    }
}

function bindPanelEvents(panel) {
    panel.addEventListener('input', (e) => {
        const target = e.target;
        
        // Handle Comment Property Changes
        if (state.selectedCommentId !== null) {
            const comment = getComment(state.selectedCommentId);
            if (comment && target.dataset.commentProp) {
                const prop = target.dataset.commentProp;
                comment[prop] = target.value;
                render();
            }
            return;
        }

        const node = getNode(state.selectedNodeId);
        if (!node) return;

        if (target.classList.contains('inspector-input')) {
            const paramKey = target.dataset.param;
            let value = target.value;
            if (target.type === 'number') value = parseFloat(value);
            
            node.params[paramKey] = value;
            if (node.updateParam) node.updateParam(paramKey, value);
            
            node.isDirty = true;
            if(miniGraph) updateGraph(miniGraph, node, PREVIEW_DURATION, state.previewPan, state.previewZoom, null, false);
        }
        
        if (target.classList.contains('variable-name-input')) {
            const varId = target.dataset.variableId;
            if (state.variables[varId]) {
                state.variables[varId].name = target.value;
                const relatedGroups = document.querySelectorAll(`.node-group`);
                relatedGroups.forEach(group => {
                    const id = parseInt(group.dataset.id);
                    const n = getNode(id);
                    if(n && n.variableId === varId) {
                        const titleEl = group.querySelector('.title');
                        if(titleEl) titleEl.textContent = `${n.title}: ${target.value}`;
                    }
                });
                const sidebarContainer = document.getElementById('variables-container');
                if(sidebarContainer) {
                   const btn = sidebarContainer.querySelector(`button[data-variable-id="${varId}"]`);
                   if(btn) btn.textContent = `Get ${target.value}`;
                }
            }
        }
        
        if (target.classList.contains('node-notes-textarea')) {
            node.notes = target.value;
        }
    });
}

function createVariableFromNode(sourceNode, fromPinKey) {
    const varId = `var_${state.nextVariableId++}`;
    state.variables[varId] = { id: varId, name: `New Var ${state.nextVariableId - 1}` };
    const setNode = new SetVariableNode(sourceNode.x + sourceNode.width + 50, sourceNode.y, varId, fromPinKey);
    const added = addNode(setNode);
    const toPinKey = 'input'; 
    addConnection({ fromNodeId: sourceNode.id, fromPinKey, toNodeId: added.id, toPinKey });
    const ctx = getAudioContext();
    if(ctx) {
        added.audioGraphNodes = added.createAudioNode(ctx);
        sourceNode.connect(added, toPinKey, fromPinKey);
    }
    state.selectedNodeId = added.id;
    render();
}

export function openMobilePanel() {
    state.isPanelOpen = true;
    mobilePanelContainer.classList.add('is-open');
}

export function closeMobilePanel() {
    state.isPanelOpen = false;
    mobilePanelContainer.classList.remove('is-open');
}