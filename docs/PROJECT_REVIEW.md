# Restart review

Reviewed: 2026-11-10. Evidence: local source, supplied architecture report, exploratory sample, and connected Netlify project inventory.

This is a static project review. Browser playback, audible quality, and downloaded WAV correctness were not verified.

## Existing foundation

The app uses vanilla JavaScript modules, Web Audio, inline AudioWorklets, SVG graph editing, and canvas waveform views.

`state.js` stores mutable graph and editor state. `nodes.js` defines nodes and audio factories. `audio-core.js` manages playback and offline rendering.

`io.js` handles JSON save/load. `ui-export.js` selects the first output and requests a duration-based WAV export.

The offline renderer walks upstream from a target node. This is a useful foundation for branch capture, subject to correctness work.

Current exports use one channel at 48 kHz and encode 16-bit PCM WAV. The implementation has no general trigger-pin graph.

No package manifest, automated test suite, backend, graph API, or MCP endpoint appears in this checkout.

## Current node inventory

These are registered implementations, not verified DSP specifications or a proposed final node list.

| Family | Registered type IDs | Source behavior |
| --- | --- | --- |
| Values | `float` | Constant source |
| Generators | `oscillator`, `noise` | Waveform oscillator, white/pink/brown noise |
| Modulation | `mod`, `adsr` | FM modulation source, message-triggered envelope |
| Arithmetic | `add`, `subtract`, `multiply`, `abs` | Signal math |
| Filters | `svf`, `ladder` | Biquad-based filter implementations |
| Effects | `shaper`, `crusher`, `reverb` | Nonlinear shaping, bit/sample reduction, reverb |
| Routing | `set_var`, `get_var` | Variable-based signal routing |
| Destination | `output` | Maps to the audio context destination |

There are 17 registered type IDs. Labels such as SVF and Ladder need behavior comparisons before any equivalence claim.

## Exploratory sample

The owner supplied `sample graph.txt` during this review and identified it as exploratory work outside the final build.

The file parses as JSON with 38 nodes and 28 connections. Node IDs are unique, and all connection endpoints reference existing nodes.

Stored input connections agree with the top-level connection list. These structural checks do not establish audible correctness.

The sample contains eight oscillators, twelve multiplies, five modulation sources, three envelopes, three adds, and several filters/effects.

Ten nodes, including the output, lie on the current output's upstream path. The remaining 28 nodes lie outside that path.

The output path combines a bandpass-filtered pink-noise branch with an oscillator branch, then applies oscillator modulation through multiplication.

Several oscillators have very low harmonic values. This suggests slow evolution as a useful workflow to investigate, not a verified listening result.

The sample has no version or global settings. It stores full input objects rather than the current serializer's `savedInputState` format.

Some `params` values differ from input defaults. For example, oscillator 1 has harmonic 6 in `params` and 1 in its input default.

Compatibility needs an explicit migration rule. The source uses both parameter stores at different points, so the sample's intended sound needs runtime verification.

## Findings that affect product planning

| Finding | Source evidence | Implication |
| --- | --- | --- |
| Import can lose the open graph before complete validation | `io.js` resets state after only basic shape checks | Validate a complete candidate graph before replacement |
| Comments do not survive current JSON save/load | Comments exist in `state.js` but not serialization/restoration | Teaching annotations need round-trip acceptance |
| Live and offline variable routing differ | Live getter resolves the setter in `nodes.js`; offline traversal follows explicit input connections | Shared evaluation rules must include implicit dependencies |
| Offline parameter application can reach live instances | Offline renderer calls `updateParam` with an extra instance argument; several methods use `this.audioGraphNodes` | Verify previews and exports without live playback, and while playback is active |
| Export shares a preview helper that adds a test oscillator | `renderOfflineAudio` injects a 220 Hz source for certain unconnected targets | Export behavior must exclude implicit preview sources |
| Multiple output nodes are audio destinations | `OutputNode` returns `context.destination`; export chooses the first output | Independent captures require distinct routing semantics |
| Separate renders can generate different noise | `NoiseNode.generateBuffer` uses `Math.random()` | Aligned captures need shared performance state or defined deterministic reconstruction |
| Graph contracts are weak | Imports accept unknown types by skipping them; UI connections lack general type/cycle validation | Establish typed pins, units, cycles, ranges, and errors before agent mutation |
| Imported labels reach HTML interpolation | `ui-renderer.js` interpolates node titles into `innerHTML` | Review text handling before expanding graph exchange or agent inputs |

These are source findings and verification targets. No fixes were applied during discovery.

The historical architecture report contains useful context. Its framework-migration recommendations are not adopted decisions.

`.Documents/SDD.md` is empty. The Presets button has no handler found in this checkout. The UI references a full license file that is absent.

## Agent access: feasible paths

**File exchange:** an agent can create JSON for manual import today. A documented schema and compatibility checks make this reliable.

**Active editor access:** shared graph commands can support inspection, edits, undo, and explanations. A remote service also needs a connection to the selected browser session.

**Remote project access:** stored graphs can support asynchronous editing and render jobs. This requires persistence, access control, and a chosen render runtime.

The current audio runtime depends on browser Web Audio APIs. Hosting an MCP endpoint in a function does not make that renderer run there.

Start with a graph contract and shared commands. An MCP adapter can then expose those commands without duplicating editor behavior.

Candidate tools are node discovery, graph inspection, validation, patch application, and render requests. These are proposals, not implemented interfaces.

## Hosting observations

The connected Netlify inventory lists `fxaa` and `fxaa-tester`, each with a ready published deploy. Their source correspondence remains unverified.

The web fetch tool could not retrieve either app. This result does not establish that the sites are unavailable in a browser.

No repository linkage, build settings, hosting settings, or deploys changed during this review.

## External references

- [Epic MetaSounds reference](https://dev.epicgames.com/documentation/en-us/unreal-engine/metasounds-reference-guide-in-unreal-engine): typed pins, triggers, reusable patches, and editor concepts.
- [Netlify custom MCP hosting guide](https://www.netlify.com/knowledge-base/how-to-build-and-deploy-an-mcp-server-on-netlify/): an application MCP endpoint can run in a Netlify Function.

These sources support feasibility and comparison. They do not establish an adopted architecture or compatibility promise.
