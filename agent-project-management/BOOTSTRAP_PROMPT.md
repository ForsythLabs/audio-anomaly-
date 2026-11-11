# Bootstrap Prompt

Use this prompt with the standalone playbook and, when available, the `starter/` folder. The destination agent fills facts from the destination project. It does not need to inspect Agent Z-Score.

```text
Set up a repeatable management structure for this project using Agent Project Management Framework 0.1.0 and the supplied playbook.

Goal: leave a small, accurate set of records that a new manager or worker can use to find the product target, implemented truth, adopted decisions, active task, proof requirements, and next permitted action.

1. Inspect the destination's AGENTS instructions, existing document conventions, repository status and branch, product brief/PRD, plan, implementation notes, test commands, and the source needed to establish the immediate objective. Preserve unrelated and owner-local work.
2. Reuse existing records where they serve the same purpose. Prepare a path map in management/PROJECT_CONTROL.md rather than creating duplicate PRDs, plans, or specs. If the project is empty, adapt the supplied starter files. Record the framework version and source.
3. Separate target requirements, adopted decisions, planned delivery, verified implementation, and operational state. Mark an unresolved or uninspected fact honestly. Do not claim an architecture is adopted because you recommend it.
4. Fill the local profile: owner/reviewer/worker roles, current phase, release authority, default branch, test/build commands and limitations, worktree policy, dependency policy, data/migration policy, external actions/spend, and manual acceptance. Preserve existing rules. Collect only missing choices that materially block the first task; do not ask the owner to fill every optional field.
5. Draft a bounded first task in research, packet, implementation, or review mode as authorized by the owner's actual request. Include requirements, decisions, allowed paths, baseline, meaningful proof, release gate, and any owner acceptance. Add parent and returns_to links when it is an inserted dependency. A proposed first task is not implementation approval.
6. Check links, contradictory ownership, placeholder facts, and whether the next agent can resume without the old conversation. Do not run a full product test suite for a documentation-only setup unless a project rule requires it.

Allowed work: the management setup and task proposal. Do not edit product code, adopt a new architectural decision on the owner's behalf, install dependencies, migrate/reset data, access secrets, call live providers, publish, or merge. Commit/push only if the destination's instructions or owner authorize them.

Deliver the file/path map, decisions genuinely needed, the first task, and the exact setup state. Keep the report short. Stop at setup review.
```

After owner adoption, place a short pointer in the destination's `AGENTS.md`. For agents without repository access, upload `PROJECT_MANAGEMENT_PLAYBOOK.md` and provide the active task plus current project profile. A shared Page must contain the guide itself or expose it through an accessible tool; a title or inaccessible link is insufficient.
