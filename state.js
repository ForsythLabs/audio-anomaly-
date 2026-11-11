// state.js
// The Single Source of Truth.

export const state = {
    nodes: [],
    connections: [],
    comments: [], // NEW: Stores comment blocks
    variables: {}, 
    
    panOffset: { x: 0, y: 0 },
    zoom: 1,
    
    selectedNodeId: null,
    selectedNodeIds: new Set(),
    selectedCommentId: null, // NEW: Track selected comment
    selectionBox: null,
    
    activeConnection: null,
    hoveredParamPin: null,
    
    // Preview States
    previewPan: { x: 0, y: 0 },
    previewZoom: { x: 1, y: 1 },
    largePreviewPan: { x: 0, y: 0 },
    largePreviewZoom: { x: 1, y: 1 },
    isLargePreviewOpen: false,
    
    isPlaying: false,
    
    nextId: 0,
    nextVariableId: 0,
    nextCommentId: 0, // NEW

    settings: {
        useHarmonics: true,
        useDegrees: true
    }
};

export function getNextId() { return state.nextId++; }
export function getNextVariableId() { return state.nextVariableId++; }
export function getNextCommentId() { return state.nextCommentId++; } // NEW

export function getNode(id) { return state.nodes.find(n => n.id === id); }
export function getComment(id) { return state.comments.find(c => c.id === id); } // NEW

export function addNode(node) {
    node.id = getNextId();
    state.nodes.push(node);
    return node;
}

export function addComment(x, y) {
    const comment = {
        id: getNextCommentId(),
        x: x,
        y: y,
        width: 300,
        height: 200,
        title: "Comment",
        color: "rgba(255, 255, 255, 0.1)" // Default translucent gray
    };
    state.comments.push(comment);
    return comment;
}

export function removeNode(id) {
    const node = getNode(id);
    if (!node) return;

    if (node.variableId) {
        if (node.type === 'set_var') {
            const varId = node.variableId;
            if (state.variables[varId]) delete state.variables[varId];
            const nodesToDelete = state.nodes.filter(n => n.type === 'get_var' && n.variableId === varId);
            nodesToDelete.forEach(orphan => removeNode(orphan.id));
        }
    }

    state.connections = state.connections.filter(c => c.fromNodeId !== id && c.toNodeId !== id);
    
    state.nodes.forEach(n => {
        Object.values(n.inputs).forEach(input => {
            if (input.connection && input.connection.fromNodeId === id) {
                input.connection = null;
            }
        });
    });

    state.nodes = state.nodes.filter(n => n.id !== id);
    
    state.selectedNodeIds.delete(id);
    if (state.selectedNodeId === id) state.selectedNodeId = null;
}

export function removeComment(id) {
    state.comments = state.comments.filter(c => c.id !== id);
    if (state.selectedCommentId === id) state.selectedCommentId = null;
}

export function addConnection(connectionData) {
    state.connections.push(connectionData);
    const toNode = getNode(connectionData.toNodeId);
    if (toNode && toNode.inputs[connectionData.toPinKey]) {
        toNode.inputs[connectionData.toPinKey].connection = {
            fromNodeId: connectionData.fromNodeId,
            fromPinKey: connectionData.fromPinKey
        };
    }
}

export function removeConnection(toNodeId, toPinKey) {
    state.connections = state.connections.filter(c => !(c.toNodeId === toNodeId && c.toPinKey === toPinKey));
    const toNode = getNode(toNodeId);
    if (toNode && toNode.inputs[toPinKey]) {
        toNode.inputs[toPinKey].connection = null;
    }
}

export function resetState() {
    state.nodes = [];
    state.connections = [];
    state.comments = []; // Reset comments
    state.variables = {};
    state.selectedNodeId = null;
    state.selectedNodeIds = new Set();
    state.selectedCommentId = null;
    state.nextId = 0;
    state.nextVariableId = 0;
    state.nextCommentId = 0;
    state.panOffset = { x: 0, y: 0 };
    state.zoom = 1;
}