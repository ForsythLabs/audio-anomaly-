# Agent Project Management Framework

Version: **0.1.0** · Prepared: **2026-10-15** · Status: **candidate for adoption**

Use this framework to set up a project that agents can understand, execute, review, and resume across conversations. It distills the management practices developed in Agent Z-Score without requiring access to that project or adopting its runtime architecture.

## Choose an entry point

- **Upload one document:** use [PROJECT_MANAGEMENT_PLAYBOOK.md](PROJECT_MANAGEMENT_PLAYBOOK.md). It contains the operating rules, document contracts, setup procedure, and reusable prompts. It stands alone when uploaded to another project or copied into a Page.
- **Set up repository files:** use [BOOTSTRAP_PROMPT.md](BOOTSTRAP_PROMPT.md) with [starter/](starter/). Adapt the files to the destination repository; retain its existing conventions and history.
- **Assign a task:** copy [TASK_PACKET_TEMPLATE.md](TASK_PACKET_TEMPLATE.md), fill the required fields, and approve its mode and boundary before launch.
- **Understand an inserted dependency:** read [WORKED_EXAMPLE.md](WORKED_EXAMPLE.md).
- **Improve the framework:** use [EVOLUTION.md](EVOLUTION.md). Each adopting project pins its version and reviews upgrades.
- **Inspect the checks:** read [VALIDATION.md](VALIDATION.md) for the author checks and remaining pilot.

## Contents of the starter

```text
AGENTS.md
PRD.md
PLAN.md
SPEC.md
decisions/RESOLUTIONS.md
management/PROJECT_CONTROL.md
management/MANAGEMENT_HANDOFF.md
management/FOLLOW_UP_REGISTER.md
.agents/workflows/MANAGER.md
.agents/workflows/WORKER.md
```

Start with `AGENTS.md`, `PROJECT_CONTROL.md`, the PRD, plan, and SPEC. Add the management handoff when work spans sessions or workers; add decision entries when a material choice arises. Use the follow-up register when discoveries cross task boundaries. A small task can keep its card, baseline, and closeout in one file. A large campaign can split them and add a short campaign state. Empty forms are not required paperwork.

## Adoption and distribution

This package is a proposal. Creating it does not replace Agent Z-Score's active workflows, update its management records, approve GR-4, or authorize work in another project. The destination owner adopts the framework after reviewing its project profile and initial task.

A Page can be the human-readable distribution copy. Record its version and canonical source, and give agents the Page content or a working reader. A Page link by itself does not make the material visible to every agent or grant repository, account, publication, or merge access. Keep each project's active rules in that project's repository; the shared Page distributes the framework rather than carrying all project state.

## Validation for this version

Review the standalone guide without opening the source repository. Then use the bootstrap prompt on a small fictional project: the agent should identify its task, required decision, proof, release authority, and next action from the supplied files. Check internal links and placeholders before adopting a populated copy. No product tests are required merely to read these templates.

## Source practices and changes

The source practices are recorded in [EVOLUTION.md](EVOLUTION.md). This version adds explicit handling for stale handoffs, interrupted work, producer/consumer test drift, and returning to a parent task after a dependency. It leaves dependency policy, migration policy, platform testing, merge strategy, and model settings to the destination project.
