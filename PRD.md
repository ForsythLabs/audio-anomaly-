# Audio Anomaly: product brief

Status: discovery draft, 2026-11-10. This brief starts the eventual full PRD. Proposed details remain open for review.

## Product direction

A sound designer creates procedural audio in a browser graph, auditions the result, and exports audio media.

The editor carries familiar MetaSounds concepts so users can transfer their skills. Differences support standalone media creation and remain visible in the interface.

Learning is part of the creation workflow: inspect signals, understand connections, hear changes, and receive explanations from an optional agent.

## Primary workflow

1. Create or open a graph.
2. Connect generators, control signals, envelopes, math, and effects.
3. Inspect and audition nodes or branches.
4. Define named capture outputs at useful points.
5. Choose capture timing and export audio.
6. Save the editable graph for later work.

The initial media target is audio. Additional media types require a separate product decision.

## Capture outputs: proposed behavior

A capture output identifies a signal or branch to export. Monitor routing and capture routing have separate responsibilities.

Several capture outputs can describe dry audio, processed audio, layers, or variations within one graph.

The full PRD must distinguish three workflows:

- **Aligned stems:** several outputs capture the same graph performance and share a clock and random state.
- **Time windows:** outputs capture selected intervals, with defined pre-roll and effect tails.
- **Variations:** separate performances use explicit parameter changes or random seeds.

An independent render per output does not guarantee aligned performances. The first release can support a smaller subset after workflow review.

## MetaSounds skill transfer

The PRD will define pin types, units, trigger timing, graph evaluation, parameter modulation, and reusable patches.

Each planned node needs an explicit relationship to its MetaSounds counterpart: equivalent concept, adapted behavior, or platform-specific feature.

Visual similarity alone does not establish equivalent audio behavior. Unreal asset compatibility and graph conversion are not current commitments.

## Agent assistance

Agents can initially produce graph JSON for manual import. Reliable automation first needs a documented graph format and node catalog.

A future shared command layer can support both editor actions and MCP tools. Candidate capabilities include graph inspection, validation, edits, explanations, and render requests.

Remote rendering and editing the graph open in a browser are separate capabilities. Browser-session access requires an explicit session connection.

Agent changes need visible results and recovery through undo or graph revisions. Authentication and project access belong in the remote-access design.

## Candidate first-release outcomes

- A designer builds a useful sound, saves it, reloads it, and exports the intended audio.
- Playback, previews, and exports follow the same documented graph behavior.
- Invalid graph data produces actionable errors without losing the open graph.
- Capture timing, channel layout, and output format are explicit.
- A learner can explain the signal path and identify documented differences from MetaSounds.

Representative examples and measurable limits will turn these outcomes into acceptance criteria in the full PRD.

## Questions for the full PRD

- Which first workflow leads: effects, ambient textures, musical synthesis, or sample processing?
- What capture workflow comes first: aligned stems, time windows, or variations?
- Which trigger and control semantics are essential for skill transfer?
- What audio quality, stereo support, formats, and render limits define the first release?
- What graph persistence and active-session access does an agent need?
- Which nodes belong in the first release, and which follow later?

The next step is a workflow-led node matrix, rather than an exhaustive implementation schedule.
