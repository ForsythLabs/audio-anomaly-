# Framework Evolution

Current version: **0.1.0** · Released for review: **2026-10-15** · Adoption: **per project after owner review**

## Version policy

Use a major version for incompatible authority or lifecycle changes, a minor version for compatible workflow or template additions, and a patch version for corrections that preserve meaning. Each project records the version it actually adopted. Local extensions and stricter owner policies remain in force during an upgrade unless explicitly changed.

An upgrade proposal includes a comparison, affected files/roles, changed permissions or acceptance meaning, adaptation steps, and evidence that a new agent can still find the right action. Do not bulk-replace existing project instructions, decision history, or active state.

## Improvement loop

1. Record a recurring failure or avoidable cost with one concrete example.
2. Identify whether it belongs in the universal workflow, local project policy, a model adapter, or a single task.
3. Propose the smallest rule/template change and describe its costs as well as its benefit.
4. Check it against a worked scenario or pilot project. Include an exception case so the rule does not become needless bureaucracy.
5. Review and version the change. Projects choose when to adopt it and record local adaptations.

Useful signals include time to find the next authorized action, stale handoff claims, lost dependency returns, repeated fixture-contract mistakes, unexplained scope expansions, and paperwork added without a decision or evidence benefit. Do not turn these signals into invented numerical targets.

## Proposal register

| ID | Observed problem | Proposed change | Evidence / pilot | State and next step |
| --- | --- | --- | --- | --- |
| IMP-001 | Framework has not yet been piloted in a second real project. | Use the bootstrap prompt on a small destination project and record setup friction. | Worked example provides a desk check only. | Proposed; select a pilot after adoption review. |

## Change log

### 0.1.0

- Distills PRD, adopted Resolution, plan, live SPEC, task packet, handoff, and follow-up ownership.
- Supplies a standalone uploadable guide, starter files, task packet, and bootstrap prompt.
- Preserves parent goals through explicit dependency-return links.
- Separates merge, automated verification, and owner acceptance.
- Adds handoff reconciliation against newer Git/task evidence, honest baseline handling, production-contract tests, and interruption/refusal checkpoints.
- Keeps model settings and domain policies outside the universal workflow.

## Source provenance

This framework was distilled from Agent Z-Score's management practice and repository documents. These are source references for maintainers, not required reading for a destination project:

| Source | Practice retained |
| --- | --- |
| `AGENTS.md` | Implementation truth, design-before-code order, explicit authority and preservation rules. |
| `.plan/PRD/00_Index.md` and `.plan/refactor/refactor_plan_r0_index.md` | Modular product requirements and phased delivery. |
| `Reports/Resolutions/` and `.agents/workflows/resolution-gate.md` | Adopted decisions with reasons and plan consequences. |
| `.agents/workflows/autonomous-goal-campaign-development.md` | Bounded goals, verifier-first delivery, compact campaign state, and review boundary. |
| `.agents/workflows/autonomous-goal-campaign-development-opus5.md` | Complete launch context, explicit model settings, completion and refusal handling. The owner-local revision was inspected as a source; it was not changed or copied wholesale. |
| `.agents/workflows/management-context-handoff.md` and `.plan/guides/Management/THREAD_CONTINUITY_PROTOCOL.md` | Small operating brief, verified checkout state, and resumption without chat replay. |
| `.plan/guides/Management/MANAGEMENT_FOLLOW_UP_REGISTER.md` | Discoverable cross-task work with explicit deferral and sequencing. |
| `.plan/guides/Model-Assisted Research and Coding Workflow/` | Evidence-based triage, bounded implementation, task cards, and proof limits. |
| Engine/local-route owner-test and review history | Producer/consumer fixture fidelity, untouched baselines, build provenance, acceptance limits, and returning from inserted dependencies. |

The extraction started from `main@e9f7b5e3` and the explicitly inspected owner-local workflow revision. It does not declare the source project's full management state reconciled or adopt this framework there.

## Rules deliberately left local

The template does not generalize Arcology's Electron testing restrictions, prototype database-reset policy, current package-install restriction, Floor Pack terms, fixed model effort settings, source paths, historical verifier failures, or merge strategy. Older source workflows also differ on role artifacts and release mechanics. The destination profile records an explicit local policy instead of combining incompatible instructions.
