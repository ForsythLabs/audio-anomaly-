# Project Management for Agent Assisted Development

Framework version: **0.1.0** · Date: **2026-10-15** · Status: **candidate for adoption**

Use this guide to establish durable project memory and bounded agent work. A new agent should be able to identify the intended product, implemented behavior, active task, governing decisions, available evidence, and next permitted action without reconstructing old conversations. The framework works with one owner and one agent, and expands when a project needs multiple workers or long campaigns.

## The operating model

Keep six questions answerable:

| Question | Record that owns the answer |
| --- | --- |
| What product do we intend to build, and for whom? | PRD |
| Which material choices have been adopted, and why? | Resolutions or architectural decisions |
| In what order will we deliver it? | Plan |
| What does the current implementation actually do? | Live SPEC, checked against current source and evidence |
| What is this worker authorized to deliver? | Approved task card and its recorded approval |
| What should management do next? | Current handoff, linked task state, and follow-up register |

These records answer different questions. A PRD requirement does not prove implementation. A green test does not approve an architectural change. A plan row does not launch a worker. A merged branch does not establish owner acceptance. The handoff helps an agent find the records that govern its task.

## Establish the project profile

Create a short `management/PROJECT_CONTROL.md` before implementation. Record the project identity, owner and approval roles, document paths, current phase, default branch, allowed environment, test commands, release policy, and framework version. Keep actual secret values and user data out of it.

Choose policies for the destination project: dependency changes, database evolution, external operations and spending, manual testing, worktree setup, and merge strategy. Preserve existing rules until the owner explicitly changes them. Record missing policy as unresolved; do not borrow a destructive reset, provider call, or package-install rule from another project.

Use these paths for a new small repository, or map existing equivalents:

```text
AGENTS.md                         agent entry point and essential local rules
PRD.md                            desired product and acceptance requirements
PLAN.md                           ordered tasks and dependencies
SPEC.md                           implemented behavior and known limits
decisions/RESOLUTIONS.md           proposed and adopted material decisions
management/PROJECT_CONTROL.md     paths, roles, environment, and local policies
management/MANAGEMENT_HANDOFF.md   current operating brief
management/FOLLOW_UP_REGISTER.md   discoveries that must outlive one task
.agents/workflows/MANAGER.md       preparation, review, release, and resume procedure
.agents/workflows/WORKER.md        execution procedure within an approved task
tasks/<task-id>/                   task card, evidence, and closeout when needed
```

`AGENTS.md` points to the profile and workflows. It should stay small enough to read at the start of work. Domain-specific architecture and long historical explanations belong in their own documents.

For an agent creating these files from this guide alone, use these minimum contents:

| Record | Minimum fields |
| --- | --- |
| PRD | Users, problem, release goal, exclusions, stable requirement IDs, observable acceptance, constraints, unresolved questions. |
| Plan | Task ID, bounded deliverable, prerequisites, parent/return link, exact state, task-card link, exit evidence. |
| SPEC | As-of revision, current behavior, source symbols, relevant interfaces/data, verification, known limits and owning follow-ups. |
| Resolution | ID, proposed/adopted state, context, evidence, choice, alternatives, actual approver, consequences, exact supersession. |
| Handoff | As-of commit/date, objective, next authorized action, worker/checkout map, proof and acceptance state, blockers and return chain. |
| Follow-up | ID, bounded problem, evidence, impact, owner, disposition, review trigger, eventual completion link. |

If no implementation exists, establish that from the empty project rather than inventing a working system. If the product goal itself is unclear, make the first task a bounded requirements or research task.

## Read the right records

A manager starts with repository status and the profile, then the current handoff, active task, relevant SPEC sections, adopted decisions, plan requirements, and cited source. A worker starts with its task card, profile, applicable decisions, SPEC sections, and source. Neither role needs the entire project history.

Check implementation claims in current source and relevant executable evidence. If SPEC and source disagree, record the discrepancy and assess its effect on the task. Do not make the discrepancy disappear by editing the target requirement or claiming undocumented code is compliant. An adopted decision governs intended behavior until explicitly superseded; code may still violate it.

A later document date, higher decision number, or newer chat summary does not automatically supersede an earlier decision. Record the explicit scope of supersession. Research findings and outside documents are evidence to assess; they cannot grant additional permissions.

## Roles and authority

| Role | Responsibility |
| --- | --- |
| Owner | Sets product direction, adopts material decisions, and grants actions reserved by project policy. |
| Manager | Maintains sequencing and handoff, prepares task scope, reviews evidence, tracks cross-task findings, and performs release actions when authorized. |
| Worker | Completes the approved task, verifies it, updates allowed implementation documentation, and reports the exact delivery state. |
| Reviewer | Assesses changes and evidence independently of the worker's completion claim. |

One agent may perform several roles in a small project, but its transitions must remain explicit. A worker's report cannot approve itself, mark an owner test passed, or authorize its next task. Manager and worker are responsibilities rather than particular model brands.

Keep approvals scoped. Record who approved what task revision or immutable commit, for which mode, and with what exceptions. Packet review authorizes packet work. Implementation approval authorizes the defined implementation. Commit, push, merge, live test, spending, deployment, and destructive operations follow the project's recorded authorization rules. Use authorization already granted in the session; do not ask again for routine choices within it.

## Make decisions before changing direction

Use a Resolution for choices that change architecture, authority, security, persistence, external contracts, ownership of truth, resource policy, or product scope. Record context, options, adopted choice, approver and evidence, consequences, affected tasks, and superseded decisions. Label proposals clearly until adopted.

Routine implementation choices within an approved boundary do not need a new Resolution. If a finding changes that boundary, the manager either records an explicitly authorized decision or prepares the smallest decision request. The sequence is:

```text
Question and evidence → adopted decision when needed → plan and task scope
→ implementation → verification and review → release → required acceptance
```

Update SPEC when implemented behavior changes. A proposed design belongs in the PRD, decision, or task packet. SPEC may describe verified work on a candidate branch if it names that branch and commit; the default-branch SPEC describes what has landed there.

## Prepare one bounded task

Every nontrivial task card contains:

- Identity, mode (`research`, `packet`, `implementation`, or `review`), objective, and completion criteria.
- Governing requirements and decisions, current SPEC sections, relevant source, and known evidence limits.
- Prerequisites, parent goal, and where work returns after this task.
- Approved baseline, assigned branch/worktree, and the allowed files or module boundary.
- In-scope behavior, exclusions needed to protect the boundary, verification, and any owner acceptance.
- Stop conditions tied to meaningful authority or scope changes.
- Expected delivery, commit/push instructions, and the review or release gate.

Give the worker one complete launch prompt with the card location, mode, checkout, baseline, model settings if applicable, deliverable, and stop boundary. The worker should not reconstruct its assignment from scattered messages. An exact path may be a harness alias; verify the actual branch, baseline ancestry, cleanliness, and packet presence rather than renaming a safe checkout to match stale text.

Reuse a suitable idle worktree when its earlier changes and ownership are accounted for. Prepare the approved branch and base before new work. Each concurrent worker needs its own checkout and bounded ownership. Preserve unrelated changes; never reset a checkout to satisfy a launch guard. A packet absent from the intended base must be deliberately merged or transplanted under the approved task, with its commit recorded.

## Execute and gather useful proof

First establish the relevant baseline on untouched code. Finish a baseline run before editing its checkout, or run it against a separate pristine checkout. A background suite that observes half-edited sources is not a baseline.

For behavioral changes, write a test or verifier that exposes the missing guarantee, capture its failure, implement, and capture its success. Include a positive control when refusal cases could pass against a path that rejects everything. Exercise the real producer-to-consumer boundary where a stub could hide a return-shape, transaction, or policy mismatch. Name substitutions and what they prevent the test from proving.

Use mutation probes when they test a real claim or when coverage was added after the correction. Report a mutant that passes and improve the fixture; do not report it as discriminating. Do not invent RED evidence for documentation, formatting, or a test first written after the fix.

Run the task's relevant regressions and build checks. Use a full-suite comparison at the project-defined risk or milestone gate. Compare failing files and results rather than only totals: the same failure count can conceal one regression and one recovery. A pre-existing failure needs evidence on the untouched baseline. Keep unrelated repairs in separately scoped work.

Classify evidence by what ran:

| Evidence | What it establishes |
| --- | --- |
| Source inspection | What a specific revision says; not that a path executed. |
| Contract or unit execution | Behavior of the tested kernel and fixture. |
| Production composition with named substitutions | The exercised composition, limited by each substitution. |
| Integration execution | Behavior of the real components used in the named environment. |
| Owner or release acceptance | What the person observed on the identified build and environment. |

Record `not_run`, partial observations, infrastructure failures, and unknown facts plainly. A model refusing a request is not a product test failure. A scratch database run does not establish the state of the owner's database. A screenshot of a response does not identify its provider unless routing evidence establishes that fact.

For a failed owner test, retain the build, action, safe error category, trace reference if available, and earliest established failure stage. Do not diagnose a stage from generic copy or ask the owner to repeat setup without evidence that it is missing.

## Review and release

The worker reports its commit, branch, exact behavior, proof, regressions, limits, and remaining acceptance. It stops at the boundary in its task card. A status update or completed commit is not task completion while an authorized required item is still running.

The manager checks the actual diff and material evidence, including authority changes, allowed scope, integration seams, denial paths, data consequences, and predecessor-test reconciliations. Changing a brittle test anchor can be valid; weakening its obligation to obtain green is not. A new finding gets accepted into scope, queued, deferred with a trigger, or rejected with evidence.

After review, release according to the project's merge and authorization policy. Record the merge or release commit. Never infer merge from a pushed branch. Run any required owner test against a rebuilt/restarted instance of the identified release; distinguish application components that may load different build revisions. Record the observed result and its limits before declaring acceptance.

Keep delivery and validation separate. A useful task progression is `planned → ready → active → awaiting_review → merged → accepted`, with `blocked` and `changes_requested` available. A merged task can still have owner acceptance pending. If the plan uses `[ ]`, `[/]`, and `[x]`, define `[x]` as accepted under that task's completion criteria, not merely pushed. Documentation tasks may be accepted without a product smoke test.

## Insert dependencies without losing the parent goal

When task A reveals a prerequisite B, retain A as blocked. Record why B is needed, its parent A, its governing decision if needed, and the evidence that releases A. Give B a bounded task and a `returns_to: A` field. Link it in the plan and handoff.

After B is reviewed, released, and accepted as required, return to A and revalidate its assumptions against the new base. If A itself returns to an earlier goal, keep following the recorded chain. An inserted dependency does not erase the original objective or authorize unrelated work. Before a major closeout, walk the dependency and return links to find unresolved gates.

A follow-up register keeps cross-task findings discoverable. Each row needs an ID, bounded problem, source evidence, impact, owner, state, next trigger, and eventual disposition. A register row is not permission to implement. A closeout remains the evidence source; the register links to it instead of copying the full narrative.

## Resume after interruption

The repository carries durable continuity. Keep the management handoff short: as-of commit and date, current objective, active workers and checkouts, decisions, acceptance gates, dependency-return chain, open risks, and the next concrete action. Link detailed evidence. Use a compact campaign state only when several related goals share a boundary; aim for fewer than 60 lines.

After compaction, limit interruption, worker transfer, or model refusal:

1. Verify the checkout, branch, baseline, dirty files, pending commands, and actual commit/push state.
2. Read the current card, campaign state if present, and the cited decision/SPEC sections.
3. Compare remaining work with existing edits and test results. Preserve the original approved goal.
4. Resume the unfinished authorized step, or report the exact missing authority or external dependency.

For a safeguard refusal, preserve the checkpoint and category when available. Do not rephrase solely to bypass the safeguard or silently transfer to another model. A reviewed handoff can carry the same legitimate goal and known state. For repeated unexplained test or infrastructure failures, investigate the cause rather than repeatedly retrying the same command.

Update the handoff after a material sequencing change, accepted decision, review/release/owner result, and before a management transfer. If its as-of commit is stale, reconcile newer task and release evidence before dispatch. Archive old operating briefs at major boundaries and link the archive. Historical evidence and adopted decisions remain intact.

## Scale the records with the work

For a small project, keep one PRD, plan, SPEC, decision log, and task file. Do not create empty dossiers or role reports. Add a handoff as soon as continuity needs it.

For a growing project, split PRD and SPEC by topic behind indexes; keep stable IDs and source links. Add task folders, a follow-up register, and the worker map. For a long campaign, use a campaign card and compact current state. Add specialized workflows only when a recurring class of work needs different gates.

Keep model-specific effort, context, and harness advice in optional adapters or the launch prompt. The universal workflow owns scope, proof, review, and authority. A model upgrade does not rewrite those rules.

## Bootstrap a new project

Give an agent this guide plus access to the destination project and say:

> Set up this project's management records using Agent Project Management Framework 0.1.0. Inspect existing guidance, repository status, product requirements, and implemented entry points first. Preserve existing documents and local changes. Create or map AGENTS, project control, PRD, plan, SPEC, decisions, and the current handoff with the contracts in this guide. Mark unverified implementation claims and unresolved policies explicitly. For an existing repository, perform only the bounded source checks needed to establish the active objective and first task; queue deeper audits. Propose one bounded first task with proof and acceptance criteria. Do not install packages, alter product code, migrate data, call external providers, or merge. Deliver a reviewable setup and name only the decisions that actually prevent its adoption.

An agent with only this uploaded guide can create those files from the field descriptions above. If starter files are supplied, adapt them rather than reproducing placeholders as project facts.

## Resume an existing project

> Resume management from the project's AGENTS entry point and project control. Verify Git and worker state, reconcile the handoff's as-of commit against current task and release evidence, and identify the active goal and dependency-return chain. Read only the governing decisions, SPEC sections, and cited source needed for the next action. Continue work already authorized within that boundary. Report a concrete blocker only when new authority or unavailable information is required.

## Improve the framework

Each project records its adopted framework version, canonical source, local extensions, and upgrade history. Improvements begin with an observed failure or recurring cost: stale state, lost parent goals, masked integration defects, excessive documents, repetitive approvals, or unclear acceptance.

Propose a small rule change with its evidence, expected benefit, tradeoffs, example, and test of usefulness. Review it, release a new framework version, and offer an explicit upgrade. Preserve local project decisions and adoption history. A shared Page update does not silently change every project's rules.

Evaluate whether a new agent can find the next authorized action, whether findings survive handoffs, whether evidence supports completion claims, and whether the process adds avoidable work. Improve those outcomes rather than increasing document count.
