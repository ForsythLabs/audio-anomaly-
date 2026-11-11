# {{PROJECT_NAME}} Delivery Plan

Current objective: `{{objective}}` · Plan owner: `{{manager}}` · Reconciled at: `{{commit and date}}`

## Task meaning

- `[ ]`: planned, without implementation authorization implied.
- `[/]`: active, blocked, in review, or merged with required acceptance still pending; name the exact state.
- `[x]`: accepted under the task's completion criteria, with linked evidence.

## Sequence and dependencies

| Marker | Task and deliverable | Requires | Returns to | State / packet | Exit evidence |
| --- | --- | --- | --- | --- | --- |
| `[ ]` | `T-001 {{bounded result}}` | `{{requirements and prerequisites}}` | `{{parent task or none}}` | `planned; {{packet when prepared}}` | `{{review, release, acceptance}}` |

## Active return chain

{{Example shape: T-010 blocked by T-010A; T-010A returns to T-010; accepted T-010 returns to the original release objective. For every inserted dependency, record why it is needed and the evidence that releases its parent.}}

## Milestone acceptance

{{State what must work, which owner checks are required, and which deferred issues prevent closeout. A pushed or merged branch alone does not satisfy this section.}}

## Deferred work

Link cross-task discoveries to the follow-up register with their trigger or sequencing constraint. Preserve explicitly deferred requirements rather than dropping them from the roadmap.
