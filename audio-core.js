// audio-core.js
// The Engine Room. Manages the AudioContexts (Live & Offline) and Worklet Processors.

import { state } from './state.js';
import { BASE_FREQUENCY, PREVIEW_SAMPLE_RATE } from './constants.js';

let audioCtx = null;
let workletModulesLoaded = new Set();

// --- PROCESSOR CODE STRINGS ---
const oscillatorProcessorCode = `class OscillatorProcessor extends AudioWorkletProcessor { static get parameterDescriptors() { return [{ name: 'frequency', defaultValue: 440 }, { name: 'phaseOffset', defaultValue: 0 }, { name: 'waveform', defaultValue: 0 }]; } constructor() { super(); this.phase = 0; } process(inputs, outputs, parameters) { const output = outputs[0]; const outputChannel = output[0]; if (!outputChannel) return true; const freqParams = parameters.frequency; const phaseParams = parameters.phaseOffset; const waveParams = parameters.waveform; for (let i = 0; i < outputChannel.length; i++) { const frequency = freqParams.length > 1 ? freqParams[i] : freqParams[0]; const phaseOffset = phaseParams.length > 1 ? phaseParams[i] : phaseParams[0]; const waveType = waveParams.length > 1 ? waveParams[i] : waveParams[0]; this.phase += (frequency * 6.28318530718) / sampleRate; if (this.phase > 6.28318530718) { this.phase -= 6.28318530718; } const totalPhase = this.phase + phaseOffset; if (waveType < 0.5) { outputChannel[i] = Math.sin(totalPhase); } else if (waveType < 1.5) { outputChannel[i] = Math.sin(totalPhase) >= 0 ? 1 : -1; } else if (waveType < 2.5) { let p = totalPhase % 6.28318530718; if (p < 0) p += 6.28318530718; outputChannel[i] = (p / 3.14159265359) - 1; } else { outputChannel[i] = (2 / 3.14159265359) * Math.asin(Math.sin(totalPhase)); } } return true; } } registerProcessor('oscillator-processor', OscillatorProcessor);`;
const absProcessorCode = `class AbsProcessor extends AudioWorkletProcessor { process(inputs, outputs) { const input = inputs[0]; const output = outputs[0]; for (let channel = 0; channel < input.length; ++channel) { const inputChannel = input[channel]; const outputChannel = output[channel]; for (let i = 0; i < inputChannel.length; ++i) { outputChannel[i] = Math.abs(inputChannel[i]); } } return true; } } registerProcessor('abs-processor', AbsProcessor);`;
const bitCrusherProcessorCode = `class BitCrusherProcessor extends AudioWorkletProcessor { static get parameterDescriptors() { return [{ name: 'bitDepth', defaultValue: 16, minValue: 1, maxValue: 16 }, { name: 'sampleRate', defaultValue: 48000, minValue: 1, maxValue: 48000 }]; } constructor() { super(); this._lastSample = 0; this._sampleCounter = 0; } process(inputs, outputs, parameters) { const input = inputs[0]; const output = outputs[0]; if (!input || !input.length) return true; for (let channel = 0; channel < input.length; ++channel) { const inputChannel = input[channel]; const outputChannel = output[channel]; const bitDepthParam = parameters.bitDepth; const sampleRateParam = parameters.sampleRate; for (let i = 0; i < inputChannel.length; ++i) { const bitDepth = bitDepthParam.length > 1 ? bitDepthParam[i] : bitDepthParam[0]; const crushRate = sampleRateParam.length > 1 ? sampleRateParam[i] : sampleRateParam[0]; const rate = Math.max(1, Math.floor(sampleRate / crushRate)); if (this._sampleCounter % rate === 0) { const steps = Math.pow(2, bitDepth); const sample = inputChannel[i]; this._lastSample = Math.round(sample * (steps / 2)) / (steps / 2); } outputChannel[i] = this._lastSample; this._sampleCounter++; } } return true; } } registerProcessor('bitcrusher-processor', BitCrusherProcessor);`;
const adsrProcessorCode = `class ADSRProcessor extends AudioWorkletProcessor { static get parameterDescriptors() { return [{ name: 'attack', defaultValue: 0.01, minValue: 0 }, { name: 'decay', defaultValue: 0.1, minValue: 0 }, { name: 'sustain', defaultValue: 0.5, minValue: 0, maxValue: 1 }, { name: 'release', defaultValue: 0.5, minValue: 0 }, { name: 'attackCurve', defaultValue: 1.0, minValue: 0.01 }, { name: 'decayCurve', defaultValue: 1.0, minValue: 0.01 }, { name: 'releaseCurve', defaultValue: 1.0, minValue: 0.01 }, { name: 'retriggerTime', defaultValue: 0.0, minValue: 0 }]; } constructor() { super(); this._state = 'idle'; this._timer = 0; this._envelopeValue = 0; this._releaseStartValue = 0; this._loopTimer = 0; this._isLooping = false; this.port.onmessage = (event) => { if (event.data.type === 'trigger') { this._isLooping = true; this._state = 'attack'; this._timer = 0; this._loopTimer = 0; } else if (event.data.type === 'stop') { this._isLooping = false; if (this._state !== 'idle') { this._state = 'release'; this._releaseStartValue = this._envelopeValue; this._timer = 0; } } }; } _getParam(param, index) { return param.length > 1 ? param[index] : param[0]; } process(inputs, outputs, parameters) { const outputChannel = outputs[0][0]; if (!outputChannel) return true; for (let i = 0; i < outputChannel.length; i++) { const attackTime = this._getParam(parameters.attack, i); const decayTime = this._getParam(parameters.decay, i); const sustainLevel = this._getParam(parameters.sustain, i); const releaseTime = this._getParam(parameters.release, i); const attackCurveVal = this._getParam(parameters.attackCurve, i); const decayCurveVal = this._getParam(parameters.decayCurve, i); const releaseCurveVal = this._getParam(parameters.releaseCurve, i); const retriggerTime = this._getParam(parameters.retriggerTime, i); if (this._isLooping && retriggerTime > 0) { const retriggerSamples = retriggerTime * sampleRate; if (this._loopTimer >= retriggerSamples) { this._state = 'attack'; this._timer = 0; this._loopTimer = 0; } } switch (this._state) { case 'idle': this._envelopeValue = 0; break; case 'attack': const attackSamples = Math.max(1, attackTime * sampleRate); this._envelopeValue = Math.pow(Math.max(0, this._timer / attackSamples), attackCurveVal); if (this._timer >= attackSamples) { this._envelopeValue = 1.0; this._state = 'decay'; this._timer = 0; } break; case 'decay': const decaySamples = Math.max(1, decayTime * sampleRate); this._envelopeValue = sustainLevel + (1.0 - sustainLevel) * Math.pow(Math.max(0, 1.0 - (this._timer / decaySamples)), decayCurveVal); if (this._timer >= decaySamples) { this._envelopeValue = sustainLevel; this._state = 'sustain'; this._timer = 0; } break; case 'sustain': this._envelopeValue = sustainLevel; if (this._isLooping && retriggerTime > 0) { const releaseSamples = releaseTime * sampleRate; const retriggerSamples = retriggerTime * sampleRate; if (this._loopTimer >= retriggerSamples - releaseSamples) { this._state = 'release'; this._releaseStartValue = this._envelopeValue; this._timer = 0; } } break; case 'release': const releaseSamples = Math.max(1, releaseTime * sampleRate); this._envelopeValue = this._releaseStartValue * Math.pow(Math.max(0, 1.0 - (this._timer / releaseSamples)), releaseCurveVal); if (this._timer >= releaseSamples) { this._envelopeValue = 0; this._state = 'idle'; this._timer = 0; } break; } outputChannel[i] = Math.max(0, this._envelopeValue); this._timer++; if(this._isLooping && retriggerTime > 0) { this._loopTimer++; } } return true; } } registerProcessor('adsr-processor', ADSRProcessor);`;
const reverbProcessorCode = `class ReverbProcessor extends AudioWorkletProcessor { static get parameterDescriptors() { return [{ name: 'dryLevel', defaultValue: 1.0 }, { name: 'wetLevel', defaultValue: 0.5 }, { name: 'decay', defaultValue: 0.5 }, { name: 'dampening', defaultValue: 0.5 }, { name: 'preDelay', defaultValue: 0.02 }, { name: 'diffusion', defaultValue: 0.7 }]; } constructor() { super(); const sampleRate = 48000; const DELAY_TIMES = [1557, 2137, 1617, 2053]; this.delays = DELAY_TIMES.map(t => new Float32Array(Math.floor(t * (sampleRate/48000)))); this.delayPtrs = [0,0,0,0]; this.lp = [0,0,0,0]; this.ap1 = 0; this.ap2 = 0; this.preDelayBuffer = new Float32Array(sampleRate); this.preDelayPtr = 0; } process(inputs, outputs, parameters) { const input = inputs[0]; const output = outputs[0]; if (!input || !input.length) return true; const channelData = input[0]; const outData = output[0]; const dryLevel = parameters.dryLevel[0]; const wetLevel = parameters.wetLevel[0]; const decay = parameters.decay[0]; const dampening = parameters.dampening[0]; const preDelayTime = parameters.preDelay[0]; const diffusion = parameters.diffusion[0]; const decayAmount = 0.7 + (1.0 - decay) * 0.299; const dampeningAmount = dampening * 0.8; const preDelaySamples = Math.floor(preDelayTime * sampleRate); for (let i = 0; i < channelData.length; ++i) { const inp = channelData[i]; this.preDelayBuffer[this.preDelayPtr] = inp; const readPtr = (this.preDelayPtr - preDelaySamples + this.preDelayBuffer.length) % this.preDelayBuffer.length; const preDelayedSample = this.preDelayBuffer[readPtr]; this.preDelayPtr = (this.preDelayPtr + 1) % this.preDelayBuffer.length; const ap_coeff = 0.2 + diffusion * 0.5; const ap1_in = preDelayedSample - ap_coeff * this.ap1; const diffused1 = this.ap1 + ap_coeff * ap1_in; this.ap1 = ap1_in; const ap2_in = diffused1 - ap_coeff * this.ap2; const finalDiffused = this.ap2 + ap_coeff * ap2_in; this.ap2 = ap2_in; let feedback = 0; for(let j=0; j<4; j++) feedback += this.delays[j][this.delayPtrs[j]]; for(let j=0; j<4; j++) { const inputMix = finalDiffused + feedback * decayAmount * 0.25; this.lp[j] = this.lp[j] + dampeningAmount * (inputMix - this.lp[j]); this.delays[j][this.delayPtrs[j]] = this.lp[j]; this.delayPtrs[j] = (this.delayPtrs[j] + 1) % this.delays[j].length; } const wetSample = (this.delays[0][this.delayPtrs[0]] + this.delays[1][this.delayPtrs[1]] - this.delays[2][this.delayPtrs[2]] - this.delays[3][this.delayPtrs[3]]) * 0.25; outData[i] = (inp * dryLevel) + (wetSample * wetLevel); } return true; } } registerProcessor('reverb-processor', ReverbProcessor);`;

const WORKLETS = [
    { name: 'oscillator-processor', code: oscillatorProcessorCode },
    { name: 'abs-processor', code: absProcessorCode },
    { name: 'adsr-processor', code: adsrProcessorCode },
    { name: 'bitcrusher-processor', code: bitCrusherProcessorCode },
    { name: 'reverb-processor', code: reverbProcessorCode },
];

// --- INITIALIZATION ---

export async function initAudio() {
    if (!audioCtx) {
        audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    }
    await loadWorklets(audioCtx);
    return audioCtx;
}

export function getAudioContext() {
    return audioCtx;
}

async function loadWorklets(context) {
    if (!context.workletModulesLoaded) context.workletModulesLoaded = new Set();
    
    for (const worklet of WORKLETS) {
        if (!context.workletModulesLoaded.has(worklet.name)) {
            try {
                const blob = new Blob([worklet.code], { type: 'application/javascript' });
                const url = URL.createObjectURL(blob);
                await context.audioWorklet.addModule(url);
                context.workletModulesLoaded.add(worklet.name);
                URL.revokeObjectURL(url);
            } catch (e) {
                console.error(`Failed to load worklet ${worklet.name}:`, e);
            }
        }
    }
}

// --- PLAYBACK CONTROL ---

export async function play() {
    if (!audioCtx) await initAudio();
    if (audioCtx.state === 'suspended') await audioCtx.resume();
    
    state.nodes.forEach(node => {
        if (!node.audioGraphNodes || node.audioGraphNodes.main.context !== audioCtx) {
            node.audioGraphNodes = node.createAudioNode(audioCtx);
        }
    });

    rebuildAudioGraph();
    state.nodes.forEach(n => { if (n.trigger) n.trigger(); });
    state.isPlaying = true;
}

export function stop() {
    if (audioCtx && audioCtx.state === 'running') audioCtx.suspend();
    state.nodes.forEach(n => { if (n.stopTrigger) n.stopTrigger(); });
    state.isPlaying = false;
}

function rebuildAudioGraph() {
    if (!audioCtx) return;
    
    // Disconnect existing connections using the safer disconnectOutputs method
    state.nodes.forEach(node => {
        if (node.audioGraphNodes) {
            try {
                // FIXED: Use disconnectOutputs() instead of hard disconnecting .main
                // This preserves internal connections for nodes like SVF
                if (node.disconnectOutputs) {
                    node.disconnectOutputs();
                } else {
                    // Fallback for safety, though all Nodes should have this now
                    if (node.audioGraphNodes.main) node.audioGraphNodes.main.disconnect(); 
                    if (node.audioGraphNodes.output) node.audioGraphNodes.output.disconnect();
                }
            } catch (e) {
                console.error("Error disconnecting node:", e);
            }
        }
    });

    // Re-establish connections
    state.connections.forEach(conn => {
        const fromNode = state.nodes.find(n => n.id === conn.fromNodeId);
        const toNode = state.nodes.find(n => n.id === conn.toNodeId);
        if (fromNode && toNode) {
            fromNode.connect(toNode, conn.toPinKey, conn.fromPinKey);
        }
    });
}

// --- PREVIEW & EXPORT ENGINE ---

export async function generatePreviewWaveform(targetNode, duration = 2.0, outputPinKey = null) {
    const buffer = await renderOfflineAudio(targetNode, duration, outputPinKey);
    if(buffer) return buffer.getChannelData(0);
    return new Float32Array(duration * PREVIEW_SAMPLE_RATE).fill(0);
}

export async function exportAudio(targetNode, duration = 10.0) {
    if (!targetNode) throw new Error("Target node not found");
    const renderedBuffer = await renderOfflineAudio(targetNode, duration);
    if (!renderedBuffer) throw new Error("Rendering failed");
    
    const wavBlob = bufferToWave(renderedBuffer, renderedBuffer.length);
    return wavBlob;
}

async function renderOfflineAudio(targetNode, duration, outputPinKey = null) {
    if (!targetNode) return null;

    const offlineCtx = new OfflineAudioContext(1, duration * PREVIEW_SAMPLE_RATE, PREVIEW_SAMPLE_RATE);
    await loadWorklets(offlineCtx);

    const nodesInGraph = new Map();
    const queue = [targetNode];
    const visited = new Set([targetNode.id]);
    nodesInGraph.set(targetNode.id, targetNode);

    // 1. Traverse back to find all connected nodes
    while (queue.length > 0) {
        const currentNode = queue.shift();
        Object.values(currentNode.inputs).forEach(input => {
            if (input.connection) {
                const fromNodeId = input.connection.fromNodeId;
                if (!visited.has(fromNodeId)) {
                    visited.add(fromNodeId);
                    const fromNode = state.nodes.find(n => n.id === fromNodeId);
                    if (fromNode) {
                        nodesInGraph.set(fromNodeId, fromNode);
                        queue.push(fromNode);
                    }
                }
            }
        });
    }

    // 2. Create Offline Instances
    const offlineNodeInstances = new Map();
    for (const node of nodesInGraph.values()) {
        if (node.createAudioNode) {
            const offlineNodes = node.createAudioNode(offlineCtx);
            offlineNodeInstances.set(node.id, offlineNodes);

            if (node.params) {
                for (const paramKey in node.params) {
                    const value = node.params[paramKey];
                    const audioParam = offlineNodes[paramKey];
                    if (audioParam && audioParam instanceof AudioParam) {
                         audioParam.setValueAtTime(value, 0);
                    } 
                    else if (node.updateParam) {
                        node.updateParam(paramKey, value, offlineNodes);
                    }
                }
            }
        }
    }

    // 3. Connect Offline Instances
    for (const toNode of nodesInGraph.values()) {
        const toNodes = offlineNodeInstances.get(toNode.id);
        if (!toNodes) continue;

        Object.entries(toNode.inputs).forEach(([toPinKey, input]) => {
            if (input.connection) {
                const fromNode = nodesInGraph.get(input.connection.fromNodeId);
                const fromNodes = offlineNodeInstances.get(input.connection.fromNodeId);
                
                if (fromNode && fromNodes) {
                    let sourceNode = fromNodes[input.connection.fromPinKey] || fromNodes.main;
                    let destParam = toNodes[toPinKey];
                    // Handle case where input param name matches 'main' input hub
                    if (!destParam && (toPinKey === 'input' || toPinKey === 'inputA')) destParam = toNodes.main;

                    if (sourceNode && destParam) {
                        try { sourceNode.connect(destParam); } catch(e){ console.error("Offline connection failed", e); }
                    }
                }
            }
        });
    }

    // 4. Determine Final Output
    const targetOfflineNodes = offlineNodeInstances.get(targetNode.id);
    let finalAudioNode = targetOfflineNodes[outputPinKey] || targetOfflineNodes.main;
    
    // FIX: If target is SVF and no output pin selected, default to 'lowpass' so preview isn't raw input
    if (targetNode.type === 'svf' && !outputPinKey && targetOfflineNodes.lowpass) {
        finalAudioNode = targetOfflineNodes.lowpass;
    }

    // Handle Generator Defaulting (for testing filters in isolation)
    const hasGenerator = Array.from(nodesInGraph.values()).some(n => ['oscillator', 'noise', 'float'].includes(n.type));
    if (!hasGenerator && finalAudioNode && targetNode.inputs.input && !targetNode.inputs.input.connection) {
         const driver = offlineCtx.createOscillator();
         driver.frequency.value = 220;
         driver.start();
         let destParam = targetOfflineNodes['input'] || targetOfflineNodes.main;
         if(destParam) driver.connect(destParam);
    }

    if (finalAudioNode && !(finalAudioNode instanceof AudioDestinationNode)) {
        finalAudioNode.connect(offlineCtx.destination);
    }

    // Trigger ADSRs if present
    for (const node of nodesInGraph.values()) {
        if (node.type === 'adsr') {
             const adsrInstance = offlineNodeInstances.get(node.id);
             if(adsrInstance?.main?.port) adsrInstance.main.port.postMessage({ type: 'trigger' });
        }
    }

    return await offlineCtx.startRendering();
}

function bufferToWave(abuffer, len) {
    let numOfChan = abuffer.numberOfChannels,
        length = len * numOfChan * 2 + 44,
        buffer = new ArrayBuffer(length),
        view = new DataView(buffer),
        channels = [], i, sample,
        offset = 0, pos = 0;

    setUint32(0x46464952); setUint32(length - 8); setUint32(0x45564157); 
    setUint32(0x20746d66); setUint32(16); setUint16(1); setUint16(numOfChan);
    setUint32(abuffer.sampleRate); setUint32(abuffer.sampleRate * 2 * numOfChan);
    setUint16(numOfChan * 2); setUint16(16); setUint32(0x61746164);
    setUint32(length - pos - 4);

    for(i = 0; i < abuffer.numberOfChannels; i++) channels.push(abuffer.getChannelData(i));

    while(pos < len) {
        for(i = 0; i < numOfChan; i++) {
            sample = Math.max(-1, Math.min(1, channels[i][pos]));
            sample = (0.5 + sample < 0 ? sample * 32768 : sample * 32767)|0;
            view.setInt16(44 + offset, sample, true); 
            offset += 2;
        }
        pos++;
    }
    return new Blob([buffer], {type: "audio/wav"});
    function setUint16(data) { view.setUint16(pos, data, true); pos += 2; }
    function setUint32(data) { view.setUint32(pos, data, true); pos += 4; }
}