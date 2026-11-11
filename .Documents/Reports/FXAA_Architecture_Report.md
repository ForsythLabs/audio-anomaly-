# The FXAA Prototype - Architecture & Specification Report

## 1. Introduction
**The Forsyth eXperimental Audio Anomaly (FXAA)** is a web-based, visual modular synthesizer playground. It simulates an environment similar to Unreal Engine's MetaSounds, allowing users to construct audio graphs using a node-based interface. The application features live audio playback and visual waveform previews.

## 2. Architecture Overview
The application is built using **Vanilla JavaScript (ES6 Modules)** and relies heavily on the **Web Audio API** for sound generation and processing.

### High-Level Modules
1.  **State Management (`state.js`):** The central data store acting as the "Single Source of Truth."
2.  **Node System (`nodes.js`):** Defines the logic, data structure, and audio implementation for each node type.
3.  **Audio Engine (`audio-core.js`):** Manages the `AudioContext`, `AudioWorklet` loading, live playback, and offline rendering.
4.  **UI Renderer (`ui-renderer.js`):** Handles the visual representation of the node graph using SVG.
5.  **Waveform Renderer (`graph.js`):** A specialized Canvas-based renderer for visualizing audio waveforms.
6.  **Entry Point (`main.js`):** Orchestrates initialization and subsystem wiring.

### Data Flow
1.  **User Interaction:** The user interacts with the SVG graph (drag, drop, connect).
2.  **State Update:** Interactions update the `state` object (adding nodes, modifying connections).
3.  **Audio Graph Sync:**
    *   **Live:** Changes trigger updates to the live `AudioContext`. Nodes create/destroy Web Audio nodes, and parameters are updated in real-time.
    *   **Preview:** Selecting a node triggers an offline render. The graph is reconstructed in an `OfflineAudioContext` to generate a buffer.
4.  **Visualization:** The generated buffer is passed to `GraphRenderer` to draw the waveform on a Canvas.

## 3. Key Components Analysis

### 3.1 State Management (`state.js`)
*   **Role:** Stores the application state: `nodes`, `connections`, `comments`, `variables`, and `settings`.
*   **Key Functions:** `addNode`, `removeNode`, `addConnection`, `resetState`.
*   **Pattern:** Global singleton object exported for direct access.

### 3.2 Node System (`nodes.js`)
*   **Base Class (`Node`):** Handles generic properties (x, y, inputs, outputs) and connection logic (`connect`, `disconnect`).
*   **Subclasses:** Specific implementations like `OscillatorNode`, `SVFNode`, `ADSREnvelopeNode`.
*   **Audio Factory (`createAudioNode`):** Each node class knows how to instantiate its corresponding Web Audio nodes (e.g., `OscillatorNode` creates an `AudioWorkletNode` or native `OscillatorNode`).
*   **Parameter Handling (`updateParam`):** Maps UI inputs to `AudioParam` values (e.g., frequency, gain).

### 3.3 Audio Engine (`audio-core.js`)
*   **Worklets:** Defines `AudioWorkletProcessor` code as inline strings (to avoid external file dependency issues) and loads them into the context.
    *   Processors: `oscillator-processor`, `adsr-processor`, `bitcrusher-processor`, `reverb-processor`, `abs-processor`.
*   **Live Playback:** Manages the main `AudioContext`.
*   **Offline Rendering:** The `renderOfflineAudio` function recursively traverses the graph backwards from a target node to build a temporary `OfflineAudioContext` graph. This is used for:
    *   **Waveform Previews:** Generating a short clip to visualize.
    *   **Export:** Rendering the final output to a WAV file.

### 3.4 UI Renderer (`ui-renderer.js`)
*   **Technology:** SVG (Scalable Vector Graphics).
*   **Structure:**
    *   `nodes-layer`: Contains node groups (ForeignObject for HTML body + SVG pins).
    *   `connections-layer`: Bezier curves (`path` elements) connecting pins.
    *   `comments-layer`: Background grouping rects.
*   **Optimization:** Uses `transform` on a group for pan/zoom rather than redrawing coordinates.

### 3.5 Waveform Renderer (`graph.js`)
*   **Technology:** HTML5 Canvas.
*   **Features:**
    *   Adaptive Grid: Automatically adjusts grid lines based on zoom level (Time and Amplitude).
    *   Performance: Decimates samples based on pixel width to ensure constant rendering time regardless of zoom.
    *   Theming: Supports Dark/Light modes.

## 4. Operational Workflows

### 4.1 Initialization
1.  `index.html` loads `main.js`.
2.  `main.js` calls `initRenderer`, `initEvents`, `initInspector`.
3.  `initAudio` initializes the `AudioContext` and loads worklets.
4.  A default graph (Output node) is created.

### 4.2 Adding a Node
1.  User clicks a button (UI).
2.  `addNode` is called in `state.js`.
3.  `ui-renderer.js` detects the change (or is manually triggered) to draw the new node.
4.  If playback is active, the node's `createAudioNode` method is called to instantiate audio modules.

### 4.3 Preview Generation
1.  User selects a node.
2.  Inspector panel calls `generatePreviewWaveform` (`audio-core.js`).
3.  `renderOfflineAudio` traverses the graph dependencies.
4.  An `OfflineAudioContext` renders the audio faster than real-time.
5.  The resulting `AudioBuffer` is sent to `GraphRenderer` (`graph.js`) for drawing.

## 5. Technology Stack
*   **Frontend:** HTML5, CSS (Tailwind via CDN), Vanilla JavaScript.
*   **Audio:** Web Audio API, AudioWorklets.
*   **Visualization:** SVG (Graph), Canvas (Waveforms).
*   **Data:** JSON (for presets/file saving).

## 6. Recommendations for Future Development
*   **Type Safety:** Migrate to TypeScript to ensure strict typing for node parameters and state.
*   **Framework:** Consider React or Vue for the UI layer to manage DOM updates more efficiently than manual manipulation in `ui-renderer.js`.
*   **Module Bundler:** Move away from inline Worklet strings and CDN links to a build process (Vite/Webpack) for better asset management.
*   **State Management:** As complexity grows, a dedicated state manager (Redux/Zustand) might be beneficial over a mutable global object.
