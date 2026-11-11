# Discovery plan

Updated: 2026-11-10. Phase: project restart and product discovery.

## Current state

The source review, node inventory, sample analysis, and initial product brief are complete. Runtime audio acceptance remains unverified.

Git has a local `main` branch and the requested GitHub origin. The setup closeout in the chat records commit and push status.

Existing app source and the exploratory sample remain unchanged. No hosting settings or deployments changed during this review.

## Small backlog

| ID | Task | Status | Completion evidence |
| --- | --- | --- | --- |
| D1 | Review source, sample, and current capabilities | Complete, static review | `docs/PROJECT_REVIEW.md` |
| D2 | Choose representative creation and teaching workflows | Next, proposed | Three short workflows with expected audio results |
| D3 | Draft the node and MetaSounds correspondence matrix | Proposed | Pins, units, timing, defaults, differences, priority, and acceptance example per node |
| D4 | Define capture and export behavior | Proposed | Examples for aligned stems, time windows, tails, and variations |
| D5 | Define graph format and agent-access boundary | Proposed | Versioned schema proposal, edit commands, browser-session model, and render strategy |
| D6 | Assemble and review the full PRD | Proposed | Requirements tied to workflows, node matrix, exclusions, and acceptance criteria |

## Next task: representative workflows

Mode: discovery. Scope: documentation and sample inspection.

Use the product brief and exploratory graph to describe three candidate workflows. Select a small set of nodes necessary for those workflows.

Record decisions that affect timing, signal types, captures, or agent access. Keep unresolved choices explicit.

Completion requires concrete examples that can guide the node matrix. Product implementation, framework migration, and production deployment are outside this task.

## Working conventions

Product direction belongs in `PRD.md`. Source findings belong in `docs/PROJECT_REVIEW.md`. Sequencing and resume state belong here.

The owner decides product scope and release readiness. Future tasks derive their authority from the current user request.

The supplied management framework remains reference material. Additional registers and task forms can wait until coordination requires them.
