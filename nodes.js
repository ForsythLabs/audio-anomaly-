// nodes.js
// Defines the Logic and Data structure for every node type.

import { BASE_FREQUENCY, NODE_WIDTH, NODE_COLORS } from './constants.js';
import { state, getNode } from './state.js'; 

export class Node {
    constructor(type, x, y, title) {
        this.id = -1;
        this.type = type;
        this.x = x;
        this.y = y;
        this.title = title;
        this.color = NODE_COLORS[type] || 'bg-gray-500';
        
        this.inputs = {};
        this.outputs = {};
        this.params = {}; 
        
        this.width = NODE_WIDTH;
        this.height = 0;
        this.notes = "";
        
        this.isDirty = true;
        this.cachedPreviewBuffer = null;
        this.cachedLargeBuffer = null; 
        
        this.audioGraphNodes = null; 
    }

    addInput(key, name, accepts = ['wave', 'mod', 'number'], isParam = false, defaultValue = 0) { 
        this.inputs[key] = { name, connection: null, accepts, isParam, defaultValue };
        if (isParam) {
            this.params[key] = defaultValue;
        }
    }
    
    addOutput(key, name, type = 'wave') { 
        this.outputs[key] = { name, type }; 
    }

    getAudioNodeForOutput(pinKey) {
        if (!this.audioGraphNodes) return null;
        return this.audioGraphNodes[pinKey] || this.audioGraphNodes.main;
    }

    // Safely disconnect external connections without breaking internal node wiring
    disconnectOutputs() {
        if (!this.audioGraphNodes) return;

        // Iterate over all defined output pins and disconnect them.
        // This avoids disconnecting .main if it acts as an internal input hub (e.g., SVF).
        const outputKeys = Object.keys(this.outputs);
        
        if (outputKeys.length > 0) {
            outputKeys.forEach(key => {
                const node = this.getAudioNodeForOutput(key);
                if (node) {
                    try { node.disconnect(); } catch(e) {}
                }
            });
        }
    }

    getAudioParam(pinKey) {
        if (!this.audioGraphNodes) return null;
        
        const target = this.audioGraphNodes[pinKey];
        if (target) {
            if (target instanceof AudioParam || target instanceof AudioNode) {
                return target;
            }
            if (target.setValueAtTime) { 
                return target; 
            }
        }

        if (pinKey === 'input' || pinKey === 'inputA') {
            return this.audioGraphNodes.main;
        }
        return null;
    }

    connect(destinationNode, toPinKey, fromPinKey = 'output') { 
        const sourceNode = this.getAudioNodeForOutput(fromPinKey);
        const destParam = destinationNode ? destinationNode.getAudioParam(toPinKey) : null;
        
        if (sourceNode && destParam) {
            try {
                sourceNode.connect(destParam);
            } catch (e) {
                console.error(`Failed to connect ${this.title} to ${destinationNode?.title}`, e);
            }
        }
    }
    
    disconnect(destinationNode, toPinKey, fromPinKey = 'output') {
        const sourceNode = this.getAudioNodeForOutput(fromPinKey);
        if (!sourceNode) return;
        try {
            const destParam = destinationNode ? destinationNode.getAudioParam(toPinKey) : null;
            if (destParam) {
                sourceNode.disconnect(destParam);
            }
        } catch(e) {}
    }

    createAudioNode(context) { 
        return { main: null };
    }

    updateParam(key, value) { 
    }
    
    destroy() {
        if(this.audioGraphNodes) {
            Object.values(this.audioGraphNodes).flat().forEach(node => {
                try { if(node.disconnect) node.disconnect(); } catch(e) {}
                try { if(node.stop) node.stop(); } catch(e) {}
            });
        }
    }
}

// --- Generator Nodes ---

export class FloatNode extends Node {
    constructor(x, y) {
        super('float', x, y, 'Float');
        this.params = { value: 1.0 };
        this.addOutput('output', 'Value', 'number');
    }
    createAudioNode(context) {
        const constantSource = context.createConstantSource();
        constantSource.offset.value = this.params.value;
        constantSource.start();
        return { main: constantSource };
    }
    updateParam(key, value) {
        if (key === 'value' && this.audioGraphNodes?.main) {
            this.audioGraphNodes.main.offset.value = value;
        }
    }
}

export class OscillatorNode extends Node {
    constructor(x, y) {
        super('oscillator', x, y, 'Sine Wave');
        this.params.type = 'sine'; 
        this.addInput('harmonic', 'Harmonic', ['number'], true, 1.0);
        this.addInput('phase', 'Phase', ['number'], true, 0.0);
        this.addInput('mod', 'Modulation', ['mod']);
        this.addOutput('output', 'Output', 'wave');
    }

    createAudioNode(context) {
        let oscillator;
        try {
            oscillator = new AudioWorkletNode(context, 'oscillator-processor');
        } catch(e) {
            console.error("Failed to create Oscillator Worklet", e);
            oscillator = context.createOscillator(); 
        }

        const typeMap = { 'sine': 0, 'square': 1, 'sawtooth': 2, 'triangle': 3 };
        const waveType = typeMap[this.params.type] || 0;
        
        const waveParam = oscillator.parameters.get('waveform');
        if(waveParam) waveParam.setValueAtTime(waveType, 0);

        const freqParam = oscillator.parameters.get('frequency');
        if(freqParam) freqParam.setValueAtTime(0, 0);

        const frequencyScaler = context.createGain();
        const multiplier = state.settings.useHarmonics ? BASE_FREQUENCY : 1;
        frequencyScaler.gain.value = multiplier;
        
        if(freqParam) frequencyScaler.connect(freqParam);

        const harmonicInput = context.createConstantSource();
        harmonicInput.offset.value = this.inputs.harmonic.defaultValue;
        harmonicInput.connect(frequencyScaler);
        harmonicInput.start();
        
        const phaseParam = oscillator.parameters.get('phaseOffset');
        const phaseInput = context.createConstantSource();
        const phaseVal = this.inputs.phase.defaultValue;
        const phaseRad = state.settings.useDegrees ? (phaseVal * Math.PI / 180) : phaseVal;
        
        phaseInput.offset.value = phaseRad;
        if(phaseParam) phaseInput.connect(phaseParam);
        phaseInput.start();

        return { 
            main: oscillator, 
            harmonic: harmonicInput.offset, 
            phase: phaseInput.offset, 
            mod: frequencyScaler, 
            multiplier: frequencyScaler.gain,
            waveform: waveParam 
        };
    }

    updateParam(key, value) {
        if (!this.audioGraphNodes) return;
        
        if (key === 'harmonic') {
            this.audioGraphNodes.harmonic.value = value;
        } 
        else if (key === 'phase') {
            const phaseRad = state.settings.useDegrees ? (value * Math.PI / 180) : value;
            this.audioGraphNodes.phase.value = phaseRad;
        }
        else if (key === 'type') {
            const typeMap = { 'sine': 0, 'square': 1, 'sawtooth': 2, 'triangle': 3 };
            const waveType = typeMap[value] || 0;
            if (this.audioGraphNodes.waveform) {
                this.audioGraphNodes.waveform.setValueAtTime(waveType, 0);
            }
        }
    }
}

export class ModNode extends Node {
    constructor(x, y) {
        super('mod', x, y, 'FM Modulation');
        this.addInput('rate', 'Rate', ['number'], true, 1.0);
        this.addInput('depth', 'Depth', ['number'], true, 20.0);
        this.addOutput('output', 'Output', 'mod');
    }
    createAudioNode(context) {
        let lfo;
        try {
            lfo = new AudioWorkletNode(context, 'oscillator-processor');
        } catch(e) {
            lfo = context.createOscillator();
        }
        
        const waveParam = lfo.parameters.get('waveform');
        if(waveParam) waveParam.setValueAtTime(0, 0);

        const freqParam = lfo.parameters.get('frequency');
        if(freqParam) freqParam.setValueAtTime(0, 0);
        
        if(freqParam) {
             freqParam.setValueAtTime(this.inputs.rate.defaultValue, 0);
        }

        const depthGain = context.createGain();
        depthGain.gain.value = this.inputs.depth.defaultValue;

        lfo.connect(depthGain);

        return {
            main: depthGain,
            rate: freqParam || lfo.frequency,
            depth: depthGain.gain
        };
    }
    updateParam(key, value) {
        if (!this.audioGraphNodes) return;
        if (key === 'rate') {
            const target = this.audioGraphNodes.rate;
            if(target.setValueAtTime) target.setValueAtTime(value, 0);
            else target.value = value;
        } else if (key === 'depth') {
            this.audioGraphNodes.depth.value = value;
        }
    }
}

export class NoiseNode extends Node {
    constructor(x, y) {
        super('noise', x, y, 'Noise');
        this.params.type = 'white';
        this.addInput('amp', 'Amp', ['number'], true, 1.0);
        this.addOutput('output', 'Output', 'wave');
    }
    createAudioNode(context) {
        const bufferSource = context.createBufferSource();
        bufferSource.loop = true;
        
        const gainNode = context.createGain();
        bufferSource.connect(gainNode);

        this.generateBuffer(context, this.params.type, bufferSource);
        gainNode.gain.value = this.inputs.amp.defaultValue;
        
        bufferSource.start();

        return { main: gainNode, bufferSource: bufferSource, amp: gainNode.gain };
    }
    
    generateBuffer(context, type, bufferSourceNode) {
         const bufferSize = 2 * context.sampleRate;
        const buffer = context.createBuffer(1, bufferSize, context.sampleRate);
        const data = buffer.getChannelData(0);
        if (type === 'white') {
            for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1;
        } else if (type === 'pink') {
             let b0=0,b1=0,b2=0,b3=0,b4=0,b5=0,b6=0;
             for (let i = 0; i < bufferSize; i++) {
                 const white = Math.random() * 2 - 1;
                 b0 = 0.99886 * b0 + white * 0.0555179; b1 = 0.99332 * b1 + white * 0.0750759;
                 b2 = 0.96900 * b2 + white * 0.1538520; b3 = 0.86650 * b3 + white * 0.3104856;
                 b4 = 0.55000 * b4 + white * 0.5329522; b5 = -0.7616 * b5 - white * 0.0168980;
                 data[i] = (b0 + b1 + b2 + b3 + b4 + b5 + b6 + white * 0.5362) * 0.11;
                 b6 = white * 0.115926;
             }
        } else if (type === 'brownian') {
            let lastOut = 0;
            for (let i = 0; i < bufferSize; i++) {
                const white = Math.random() * 2 - 1;
                data[i] = (lastOut + (0.02 * white)) / 1.02;
                lastOut = data[i];
                data[i] *= 3.5;
            }
        }
        bufferSourceNode.buffer = buffer;
    }

    updateParam(key, value) {
        if (!this.audioGraphNodes) return;
        
        if (key === 'type') {
            const context = this.audioGraphNodes.main.context;
            const oldSource = this.audioGraphNodes.bufferSource;
        
            if (oldSource) {
                try { oldSource.disconnect(); oldSource.stop(); } catch(e) {}
            }
        
            const newSource = context.createBufferSource();
            newSource.loop = true;
            this.generateBuffer(context, value, newSource);
            newSource.connect(this.audioGraphNodes.main);
            newSource.start();
            this.audioGraphNodes.bufferSource = newSource;
        } else if (key === 'amp') {
            this.audioGraphNodes.main.gain.value = value;
        }
    }
}

export class SVFNode extends Node {
    constructor(x, y) {
        super('svf', x, y, 'State Variable Filter');
        this.addInput('input', 'Input', ['wave']);
        this.addInput('cutoff', 'Cutoff', ['number'], true, 4.0);
        this.addInput('resonance', 'Resonance', ['number'], true, 0.7);
        this.addOutput('lowpass', 'LP', 'wave');
        this.addOutput('highpass', 'HP', 'wave');
        this.addOutput('bandpass', 'BP', 'wave');
        this.addOutput('notch', 'Notch', 'wave');
    }
     createAudioNode(context) {
        const inputGain = context.createGain(); 
        const lowpassNode = context.createBiquadFilter();
        lowpassNode.type = 'lowpass';
        const highpassNode = context.createBiquadFilter();
        highpassNode.type = 'highpass';
        const bandpassNode = context.createBiquadFilter();
        bandpassNode.type = 'bandpass';
        const notchNode = context.createBiquadFilter();
        notchNode.type = 'notch';

        const filters = [lowpassNode, highpassNode, bandpassNode, notchNode];
        filters.forEach(f => inputGain.connect(f));

        const cutoffScaler = context.createGain();
        const multiplier = state.settings.useHarmonics ? BASE_FREQUENCY : 1;
        cutoffScaler.gain.value = multiplier;
        
        const cutoffInput = context.createConstantSource();
        cutoffInput.offset.value = this.inputs.cutoff.defaultValue;
        cutoffInput.connect(cutoffScaler);
        cutoffInput.start();

        filters.forEach(f => cutoffScaler.connect(f.frequency));

        const resonance = this.inputs.resonance.defaultValue;
        filters.forEach(f => f.Q.value = resonance);
        
        return { 
            main: inputGain, 
            lowpass: lowpassNode, highpass: highpassNode, bandpass: bandpassNode, notch: notchNode,
            cutoff: cutoffInput.offset, 
            multiplier: cutoffScaler.gain,
            resonance: filters.map(f => f.Q)
        };
    }
    updateParam(key, value) {
        if(!this.audioGraphNodes) return;
        if(key === 'cutoff') {
            this.audioGraphNodes.cutoff.value = value;
        } else if (key === 'resonance') {
            this.audioGraphNodes.resonance.forEach(f => f.value = value);
        }
    }
    
    // Override to default to lowpass for preview if no pin specified
    getAudioNodeForOutput(pinKey) {
        if (!this.audioGraphNodes) return null;
        if (!pinKey) return this.audioGraphNodes.lowpass;
        return this.audioGraphNodes[pinKey] || this.audioGraphNodes.main;
    }
}

export class LadderFilterNode extends Node {
    constructor(x, y) {
        super('ladder', x, y, 'Ladder Filter');
        this.addInput('input', 'Input', ['wave']);
        this.addInput('cutoff', 'Cutoff', ['number'], true, 4.0);
        this.addInput('resonance', 'Resonance', ['number'], true, 0.5);
        this.addOutput('output', 'Output', 'wave');
    }
    createAudioNode(context) {
        const filter = context.createBiquadFilter();
        filter.type = 'lowpass';
        
        const cutoffScaler = context.createGain();
        const multiplier = state.settings.useHarmonics ? BASE_FREQUENCY : 1;
        cutoffScaler.gain.value = multiplier;
        
        const cutoffInput = context.createConstantSource();
        cutoffInput.offset.value = this.inputs.cutoff.defaultValue;
        cutoffInput.connect(cutoffScaler);
        cutoffInput.start();
        
        cutoffScaler.connect(filter.frequency);

        filter.Q.value = this.inputs.resonance.defaultValue * 20;
        
        return { 
            main: filter, 
            cutoff: cutoffInput.offset,
            multiplier: cutoffScaler.gain,
            resonance: filter.Q 
        };
    }
    updateParam(key, value) {
        if(!this.audioGraphNodes) return;
        if(key === 'cutoff') {
            this.audioGraphNodes.cutoff.value = value;
        } else if (key === 'resonance') {
            this.audioGraphNodes.resonance.value = value * 20;
        }
    }
}

export class WaveShaperNode extends Node {
    constructor(x, y) {
        super('shaper', x, y, 'Wave Shaper');
        this.addInput('input', 'Input', ['wave']);
        this.addInput('amount', 'Amount', ['number'], true, 0.0);
        this.addInput('bias', 'Bias', ['number'], true, 0.0);
        this.addInput('outputGain', 'Gain', ['number'], true, 1.0);
        this.addOutput('output', 'Output', 'wave');
    }
    createAudioNode(context) {
        const inputGain = context.createGain(); 
        const biasNode = context.createConstantSource();
        const shaper = context.createWaveShaper();
        const outputGain = context.createGain();

        inputGain.connect(shaper);
        biasNode.connect(shaper);
        shaper.connect(outputGain);
        biasNode.start();
        
        const nodes = { main: inputGain, output: outputGain, shaper, bias: biasNode.offset, gain: outputGain.gain };
        
        this.updateParam('amount', this.inputs.amount.defaultValue, nodes);
        this.updateParam('bias', this.inputs.bias.defaultValue, nodes);
        this.updateParam('outputGain', this.inputs.outputGain.defaultValue, nodes);

        return nodes;
    }
    
    getAudioNodeForOutput(pinKey) { return this.audioGraphNodes?.output; }

    updateParam(key, value, nodes = this.audioGraphNodes) {
        if(!nodes) return;
        switch(key) {
            case 'amount':
                const k = Math.pow(100, value);
                const curve = new Float32Array(256);
                for (let i = 0; i < 256; i++) {
                    const x = (i / 128) - 1;
                    curve[i] = Math.tanh(x * k);
                }
                nodes.shaper.curve = curve;
                break;
            case 'bias':
                nodes.bias.value = value;
                break;
            case 'outputGain':
                nodes.gain.value = value;
                break;
        }
    }
}

export class BitCrusherNode extends Node {
    constructor(x, y) {
        super('crusher', x, y, 'Bit Crusher');
        this.addInput('input', 'Input', ['wave']);
        this.addInput('sampleRate', 'Sample Rate', ['number'], true, 48000);
        this.addInput('bitDepth', 'Bit Depth', ['number'], true, 16);
        this.addOutput('output', 'Output', 'wave');
    }
    createAudioNode(context) {
        try {
            const crusherNode = new AudioWorkletNode(context, 'bitcrusher-processor');
            
            const rateScaler = context.createGain();
            const multiplier = state.settings.useHarmonics ? BASE_FREQUENCY : 1;
            rateScaler.gain.value = multiplier;
            
            const rateInput = context.createConstantSource();
            rateInput.offset.value = this.inputs.sampleRate.defaultValue;
            rateInput.connect(rateScaler);
            rateInput.start();
            
            const sampleRateParam = crusherNode.parameters.get('sampleRate');
            if (sampleRateParam) rateScaler.connect(sampleRateParam);

            const params = {
                bitDepth: crusherNode.parameters.get('bitDepth'),
                sampleRate: rateInput.offset,
                multiplier: rateScaler.gain,
            };
            return { main: crusherNode, ...params };

        } catch (e) {
            console.error("Failed to create BitCrusher AudioWorkletNode:", e);
            return { main: context.createGain() }; 
        }
    }
    updateParam(key, value) {
        const param = this.getAudioParam(key);
        if (param) param.value = value;
    }
}

export class ADSREnvelopeNode extends Node {
    constructor(x, y) {
        super('adsr', x, y, 'ADSR Envelope');
        this.params = {
            attack: 0.01, decay: 0.1, sustain: 0.5, release: 0.5,
            attackCurve: 1.0, decayCurve: 1.0, releaseCurve: 1.0,
            retriggerTime: 0.0
        };
        // Note: ADSR uses params from constructor above, no extra work needed
        this.addInput('attack', 'Attack', ['number'], true, this.params.attack);
        this.addInput('decay', 'Decay', ['number'], true, this.params.decay);
        this.addInput('sustain', 'Sustain', ['number'], true, this.params.sustain);
        this.addInput('release', 'Release', ['number'], true, this.params.release);
        this.addInput('attackCurve', 'A. Curve', ['number'], true, this.params.attackCurve);
        this.addInput('decayCurve', 'D. Curve', ['number'], true, this.params.decayCurve);
        this.addInput('releaseCurve', 'R. Curve', ['number'], true, this.params.releaseCurve);
        this.addInput('retriggerTime', 'Retrigger', ['number'], true, this.params.retriggerTime);
        this.addOutput('output', 'Envelope', 'wave');
    }

    createAudioNode(context) {
        try {
            const adsrNode = new AudioWorkletNode(context, 'adsr-processor');
            const params = {};
            for(const param of adsrNode.parameters.keys()) {
                params[param] = adsrNode.parameters.get(param);
            }
            return { main: adsrNode, ...params };
        } catch (e) {
            console.error("Failed to create ADSR AudioWorkletNode:", e);
            return { main: context.createGain() };
        }
    }

    updateParam(key, value) {
        const param = this.getAudioParam(key);
        if (param) param.value = value;
    }
    
    trigger() {
        if (this.audioGraphNodes?.main?.port) {
            this.audioGraphNodes.main.port.postMessage({ type: 'trigger' });
        }
    }
        
    stopTrigger() {
        if (this.audioGraphNodes?.main?.port) {
            this.audioGraphNodes.main.port.postMessage({ type: 'stop' });
        }
    }
}

export class AbsoluteNode extends Node {
    constructor(x, y) {
        super('abs', x, y, 'Absolute');
        this.addInput('input', 'Input', ['wave']);
        this.addOutput('output', 'Output', 'wave');
    }
    createAudioNode(context) {
        try {
            return { main: new AudioWorkletNode(context, 'abs-processor') };
        } catch (e) {
             console.error("Failed to create AbsoluteNode:", e);
             return { main: context.createGain() };
        }
    }
}

export class MathNode extends Node {
    constructor(type, x, y, title) {
        super(type, x, y, title);
        this.addInput('inputA', 'A', ['wave']);
        this.addInput('inputB', 'B', ['wave', 'number'], true, 0.5);
        this.addOutput('output', 'Output', 'wave');
    }
    createAudioNode(context) {
        const gainNode = context.createGain();
        const nodes = { main: gainNode, inputA: gainNode };

        if(this.type === 'subtract') {
            const inverter = context.createGain();
            inverter.gain.value = -1;
            inverter.connect(gainNode);
            nodes.inputB = inverter;
        } else if(this.type === 'multiply') {
            gainNode.gain.value = 0; 
            nodes.inputB = gainNode.gain;
        } else { 
            nodes.inputB = gainNode;
        }
        
        const inputB_Static = context.createConstantSource();
        inputB_Static.offset.value = this.inputs.inputB.defaultValue;
        inputB_Static.connect(nodes.inputB);
        inputB_Static.start();
        
        nodes.staticB = inputB_Static;
        return nodes;
    }

    updateParam(key, value) {
        if(key === 'inputB' && this.audioGraphNodes?.staticB) {
            this.audioGraphNodes.staticB.offset.value = value;
        }
    }
}

export class SetVariableNode extends Node {
    constructor(x, y, variableId, fromPinKey) {
        super('set_var', x, y, 'Set Variable');
        this.variableId = variableId;
        this.fromPinKey = fromPinKey;
        this.addInput('input', 'Input', ['wave']);
        this.addOutput('output', 'Passthrough', 'wave');
    }
    createAudioNode(context) {
        return { main: context.createGain() };
    }
}

export class GetVariableNode extends Node {
    constructor(x, y, variableId) {
        super('get_var', x, y, 'Get Variable');
        this.variableId = variableId;
        this.addOutput('output', 'Output', 'wave');
    }
    createAudioNode(context) {
        return { main: context.createGain() };
    }
    
    connect(destinationNode, toPinKey) {
        if(!destinationNode.audioGraphNodes) return;
        const destParam = destinationNode.getAudioParam(toPinKey);
        if (!destParam) return;

        const setNode = state.nodes.find(n => n.type === 'set_var' && n.variableId === this.variableId);
        if (setNode) {
            const sourceAudioNode = setNode.getAudioNodeForOutput(setNode.fromPinKey);
             if(sourceAudioNode) sourceAudioNode.connect(destParam);
        }
    }
    
    disconnect(destinationNode, toPinKey) {
        if(!destinationNode.audioGraphNodes) return;
        const destParam = destinationNode.getAudioParam(toPinKey);
        if (!destParam) return;

        const setNode = state.nodes.find(n => n.type === 'set_var' && n.variableId === this.variableId);
        if (setNode) {
            const sourceAudioNode = setNode.getAudioNodeForOutput(setNode.fromPinKey);
            if(sourceAudioNode) try { sourceAudioNode.disconnect(destParam); } catch(e) {}
        }
    }
}

export class OutputNode extends Node {
     constructor(x, y) {
        super('output', x, y, 'Master Output');
        this.addInput('input', 'Input', ['wave']);
     }
      createAudioNode(context) {
           return { main: context.destination };
      }
}

export class ReverbNode extends Node {
    constructor(x, y) {
        super('reverb', x, y, 'Reverb');
        this.params = { dryLevel: 1.0, wetLevel: 0.5, decay: 0.5, dampening: 0.5, preDelay: 0.02, diffusion: 0.7 };
        this.addInput('input', 'Input', ['wave']);
        this.addOutput('output', 'Output', 'wave');
    }
    
    createAudioNode(context) {
        try {
            const reverbNode = new AudioWorkletNode(context, 'reverb-processor');
            const params = {};
            for(const param of reverbNode.parameters.keys()) {
                params[param] = reverbNode.parameters.get(param);
            }
            return { main: reverbNode, ...params };
        } catch (e) {
            console.error("Failed to create Reverb AudioWorkletNode:", e);
            return { main: context.createGain() };
        }
    }

    updateParam(key, value) {
        const param = this.getAudioParam(key);
        if (param) param.value = value;
    }
}

export const NODE_CONSTRUCTORS = {
    float: (x,y) => new FloatNode(x,y),
    oscillator: (x, y) => new OscillatorNode(x, y),
    mod: (x, y) => new ModNode(x, y),
    noise: (x, y) => new NoiseNode(x, y),
    svf: (x, y) => new SVFNode(x, y),
    ladder: (x, y) => new LadderFilterNode(x, y),
    shaper: (x, y) => new WaveShaperNode(x, y),
    crusher: (x, y) => new BitCrusherNode(x, y),
    reverb: (x, y) => new ReverbNode(x, y),
    adsr: (x, y) => new ADSREnvelopeNode(x, y),
    output: (x, y) => new OutputNode(x, y),
    abs: (x, y) => new AbsoluteNode(x, y),
    add: (x, y) => new MathNode('add', x, y, 'Add'),
    subtract: (x, y) => new MathNode('subtract', x, y, 'Subtract'),
    multiply: (x, y) => new MathNode('multiply', x, y, 'Multiply'),
    set_var: (x, y, variableId, fromPinKey) => new SetVariableNode(x, y, variableId, fromPinKey),
    get_var: (x, y, variableId) => new GetVariableNode(x, y, variableId),
};