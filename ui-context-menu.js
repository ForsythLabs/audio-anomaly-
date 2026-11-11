// ui-context-menu.js
// Manages the Right-Click Context Menu for adding nodes.

import { state, addNode, addComment } from './state.js'; // Added addComment
import { render } from './ui-renderer.js';
import { getAudioContext } from './audio-core.js';
import { NODE_CONSTRUCTORS, GetVariableNode } from './nodes.js';
import { NODE_COLORS } from './constants.js';

let contextMenu;
let spawnPosition = { x: 0, y: 0 }; 

const MENU_STRUCTURE = [
    {
        category: "Inputs",
        color: "text-gray-400",
        items: [
            { label: "Float", type: "float", color: "bg-gray-500" }
        ]
    },
    // ... (Existing categories) ...
    {
        category: "Generators",
        color: "text-blue-400",
        items: [
            { label: "Sine Wave", type: "oscillator", color: "bg-blue-500" },
            { label: "FM Modulation", type: "mod", color: "bg-teal-500" },
            { label: "Noise", type: "noise", color: "bg-pink-500" },
            { label: "ADSR Envelope", type: "adsr", color: "bg-fuchsia-500" }
        ]
    },
    {
        category: "Operators",
        color: "text-green-400",
        items: [
            { label: "Add (+)", type: "add", color: "bg-green-500" },
            { label: "Subtract (-)", type: "subtract", color: "bg-yellow-500" },
            { label: "Multiply (*)", type: "multiply", color: "bg-purple-500" },
            { label: "Absolute", type: "abs", color: "bg-orange-500" }
        ]
    },
    {
        category: "Filters & Effects",
        color: "text-cyan-400",
        items: [
            { label: "Filter (SVF)", type: "svf", color: "bg-cyan-500" },
            { label: "Ladder Filter", type: "ladder", color: "bg-amber-500" },
            { label: "Wave Shaper", type: "shaper", color: "bg-red-500" },
            { label: "Bit Crusher", type: "crusher", color: "bg-lime-500" },
            { label: "Reverb", type: "reverb", color: "bg-sky-500" }
        ]
    },
    // NEW: Utility Category for Comments
    {
        category: "Utility",
        color: "text-white",
        items: [
            { label: "Add Comment", type: "comment", color: "bg-gray-600" }
        ]
    }
];

export function initContextMenu() {
    contextMenu = document.createElement('div');
    contextMenu.id = 'context-menu';
    contextMenu.className = 'fixed z-50 hidden bg-gray-800 border border-gray-600 rounded-lg shadow-xl w-48 overflow-hidden font-sans text-sm select-none';
    document.body.appendChild(contextMenu);

    // Global Click to Close
    // Note: We handle contextmenu blocking in ui-events.js
    window.addEventListener('click', () => hideContextMenu());
    window.addEventListener('wheel', () => hideContextMenu());
}

export function showContextMenu(screenX, screenY, worldX, worldY) {
    spawnPosition = { x: worldX, y: worldY };

    contextMenu.innerHTML = '';
    
    MENU_STRUCTURE.forEach(cat => {
        const header = document.createElement('div');
        header.className = `px-3 py-1 text-xs font-bold uppercase tracking-wider bg-gray-900 ${cat.color} border-b border-gray-700 mt-1 first:mt-0`;
        header.textContent = cat.category;
        contextMenu.appendChild(header);

        cat.items.forEach(item => {
            const btn = document.createElement('button');
            btn.className = 'w-full text-left px-3 py-2 text-gray-200 hover:bg-gray-700 flex items-center space-x-2 transition-colors';
            
            const dot = document.createElement('div');
            dot.className = `w-2 h-2 rounded-full ${item.color}`;
            const text = document.createElement('span');
            text.textContent = item.label;

            btn.appendChild(dot);
            btn.appendChild(text);
            
            btn.onclick = () => {
                if (item.type === 'comment') {
                    spawnComment();
                } else {
                    spawnNode(item.type);
                }
                hideContextMenu();
            };
            
            contextMenu.appendChild(btn);
        });
    });

    const varKeys = Object.keys(state.variables);
    if (varKeys.length > 0) {
        const header = document.createElement('div');
        header.className = `px-3 py-1 text-xs font-bold uppercase tracking-wider bg-gray-900 text-rose-400 border-b border-gray-700 mt-1`;
        header.textContent = "Variables";
        contextMenu.appendChild(header);

        varKeys.forEach(varId => {
            const v = state.variables[varId];
            const btn = document.createElement('button');
            btn.className = 'w-full text-left px-3 py-2 text-gray-200 hover:bg-gray-700 flex items-center space-x-2 transition-colors';
            
            const dot = document.createElement('div');
            dot.className = `w-2 h-2 rounded-full bg-rose-500`;
            const text = document.createElement('span');
            text.textContent = `Get ${v.name}`;

            btn.appendChild(dot);
            btn.appendChild(text);

            btn.onclick = () => {
                spawnVariableNode(varId);
                hideContextMenu();
            };
            contextMenu.appendChild(btn);
        });
    }

    contextMenu.style.left = `${screenX}px`;
    contextMenu.style.top = `${screenY}px`;
    contextMenu.classList.remove('hidden');
    
    const rect = contextMenu.getBoundingClientRect();
    if (rect.right > window.innerWidth) contextMenu.style.left = `${window.innerWidth - rect.width}px`;
    if (rect.bottom > window.innerHeight) contextMenu.style.top = `${window.innerHeight - rect.height}px`;
}

export function hideContextMenu() {
    if (contextMenu) contextMenu.classList.add('hidden');
}

function spawnNode(type) {
    const constructor = NODE_CONSTRUCTORS[type];
    if (constructor) {
        const node = constructor(spawnPosition.x, spawnPosition.y);
        const added = addNode(node);
        
        const ctx = getAudioContext();
        if (ctx) {
            added.audioGraphNodes = added.createAudioNode(ctx);
        }
        
        state.selectedNodeId = added.id;
        state.selectedNodeIds.clear();
        state.selectedNodeIds.add(added.id);
        render();
    }
}

function spawnVariableNode(varId) {
    const node = new GetVariableNode(spawnPosition.x, spawnPosition.y, varId);
    const added = addNode(node);
    
    const ctx = getAudioContext();
    if (ctx) {
        added.audioGraphNodes = added.createAudioNode(ctx);
    }
    
    state.selectedNodeId = added.id;
    state.selectedNodeIds.clear();
    state.selectedNodeIds.add(added.id);
    render();
}

// NEW: Spawn Comment
function spawnComment() {
    const comment = addComment(spawnPosition.x, spawnPosition.y);
    state.selectedCommentId = comment.id;
    state.selectedNodeId = null;
    state.selectedNodeIds.clear();
    render();
}