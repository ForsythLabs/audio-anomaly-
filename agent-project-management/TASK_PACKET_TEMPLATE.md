# {{TASK_ID}} {{Task title}}

Template instructions: copy into a task file or folder and fill the card before launch. Keep small tasks in one document. Split scope, baseline, and closeout only when their size warrants it. Delete instructional placeholders from a populated packet; retain honest unresolved facts.

## Task contract

- Mode: `research | packet | implementation | review`
- State: `planned | ready | active | blocked | awaiting_review | changes_requested | merged | accepted`
- Goal and user-visible result: `{{one bounded objective}}`
- Completion criteria: `{{artifacts, behavior, proof, review, and required acceptance}}`
- Approval: `{{actual approver, date/reference, approved card revision or commit, mode and exceptions}}`
- Parent goal / returns_to: `{{IDs or none}}`
- Prerequisites and release condition: `{{dependencies and evidence that satisfies them}}`

## Governing material

| Role | Exact source |
| --- | --- |
| Requirements | `{{PRD IDs and sections}}` |
| Adopted decisions | `{{decision IDs; pending decisions block only dependent work}}` |
| Current implementation | `{{SPEC sections and source symbols}}` |
| Existing evidence | `{{tests, closeouts, owner result; with limits}}` |

## Checkout and environment

- Approved baseline and packet commit: `{{SHAs; ensure the packet exists in the worker checkout}}`
- Actual worktree / branch / owner: `{{record harness-assigned values}}`
- Dirty-file preservation: `{{known exceptions or clean}}`
- Available tools and dependency state: `{{installed and verified; no guessed provisioning}}`
- External effects/data/cost allowed: `{{none or exact scope and authority}}`

## Scope

- Allowed paths or exact module boundary: `{{source, tests, docs, fixtures}}`
- Behavior to change: `{{bounded changes}}`
- Boundaries that must hold: `{{security, persistence, compatibility, effects, ownership}}`
- Exclusions needed to keep the task coherent: `{{specific non-goals}}`
- Routine file additions allowed within the boundary: `{{yes with named constraints, or exact paths only}}`

## Design and proof

{{Describe the source of authority, producer/consumer contract, success/failure lifecycle, restart or concurrency implications where relevant, and expected data consequences. Keep proposals distinct from existing behavior.}}

| Case | Real path exercised | Decisive assertion | Substitutions and proof limit |
| --- | --- | --- | --- |
| Positive control | `{{path}}` | `{{useful success}}` | `{{limits}}` |
| Defect or denial | `{{path}}` | `{{behavior and durable/effect assertions}}` | `{{limits}}` |
| Failure boundary | `{{relevant throw/race/restart}}` | `{{honest outcome}}` | `{{limits}}` |

Required commands: `{{focused checks, adjacent regressions, build checks, diff check}}`.
Full-suite trigger: `{{required for this risk/milestone, or reason not required}}`.
Owner acceptance: `{{procedure and build prerequisites, or not required with reason}}`.

## Stop and report

Name task-specific stops: `{{missing authority, conflicting source, prohibited data change, necessary external action, or material boundary expansion}}`. Continue independent work within the approved scope while presenting the smallest blocked decision. Do not turn an optional improvement into a mandatory stop.

## Delivery and launch

- Artifacts: `{{exact outputs}}`
- Commit / push: `{{authorization and expected checkpoints}}`
- Review / merge / release: `{{roles and recorded policy}}`
- Stop boundary: `{{where the worker stops; next campaign item is separate}}`

Launch prompt:

> Work on {{TASK_ID}} in {{mode}} mode using {{card path and revision}}, the project's profile, and its worker workflow. Use {{checkout rule}} from {{baseline}} with {{packet commit}} present. Deliver {{goal}} and its required proof, documentation, and authorized commit/push. {{Model/harness settings when applicable}}. Stop at {{review boundary}}; report material blockers with source evidence. Preserve unrelated work and collect pending results before reporting completion.

## Baseline record

Worker fills this before behavioral edits. For documentation-only work, record the actual applicable checks instead of creating a fictitious product baseline.

- Source revision / environment: `{{SHA and tool context}}`
- Start/end and checkout: `{{show it was untouched for the run}}`
- Commands and per-file results: `{{safe evidence path}}`
- Inherited failures and reproduction: `{{exact set and scores; or none observed}}`
- Required checks unavailable: `{{reason and consequence}}`

## Worker closeout

- Delivered commit and branch / push state: `{{verified facts}}`
- Exact behavior or document change: `{{outcome}}`
- RED/GREEN or other applicable evidence: `{{results and controls}}`
- Regression comparison: `{{new failures, recoveries, inherited failures, per-file comparison}}`
- Deviations and predecessor reconciliations: `{{what changed and whether approval was needed}}`
- Proof ceiling / not-run checks: `{{limits}}`
- Data/build/owner-test consequences: `{{instructions and pending gate}}`
- New cross-task findings for manager triage: `{{bounded issues with source and proposed disposition}}`
- Return action: `{{parent task to revalidate after acceptance}}`

## Management disposition

Management records review, corrections, merge/release revision, acceptance result, follow-up IDs, and the next authorized action. Worker completion does not populate an approval on management's behalf.

## Optional campaign state

For a multi-goal campaign, use a separate `CAMPAIGN_STATE.md` of fewer than about 60 lines. Keep current state rather than a second diary:

```text
Campaign and governing card:
Active approved goal / mode / completion boundary:
Source-of-truth links:
Actual branch / worktree / baseline / packet revision:
Last completed checkpoint and proof:
Uncommitted changes and pending commands:
Open risks / hard stops:
Blocked parent / returns_to / release evidence:
Next action:
```
