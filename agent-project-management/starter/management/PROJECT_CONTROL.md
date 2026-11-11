# Project Control

Status: `setup_draft` · Framework: **0.1.0** · Last reconciled: `{{date and commit}}`

## Identity and adoption

- Project and immediate product goal: `{{name and goal}}`
- Owner / decision authority: `{{role or person}}`
- Manager / reviewer: `{{roles; may be one agent with explicit role transitions}}`
- Canonical framework source: `{{repository release or accessible Page plus local copy}}`
- Adopted version / approver / approval evidence: `{{version, authority, dated reference; leave unadopted until real}}`
- Local extensions and accepted exceptions: `{{links or none}}`

## Document map

Map existing files when they already serve these roles. Each fact should have one owning record.

| Role | Path | Maintainer |
| --- | --- | --- |
| Agent entry | `AGENTS.md` | Manager and owner |
| Product target | `PRD.md` | Owner and delegated product author |
| Adopted decisions | `decisions/RESOLUTIONS.md` | Authorized decision recorder |
| Delivery sequence | `PLAN.md` | Manager |
| Implemented behavior | `SPEC.md` | Implementer, checked in review |
| Current operating brief | `management/MANAGEMENT_HANDOFF.md` | Manager |
| Cross-task discoveries | `management/FOLLOW_UP_REGISTER.md` | Manager |
| Task scope and evidence | `tasks/<task-id>/` or one task file | Manager owns scope; worker owns evidence |

## Environment and authority

| Policy | Local choice and source |
| --- | --- |
| Default branch and synchronization | `{{branch; how remote state is verified}}` |
| Root checkout / owner-local paths | `{{preservation rules; paths or roles only}}` |
| Worker isolation and provisioning | `{{worktree/harness process and approved installed tools}}` |
| Dependency changes | `{{approval and supply-chain process; unresolved until established}}` |
| Data and schema evolution | `{{migration/backup/retention policy; no reset inferred}}` |
| External actions and cost | `{{permitted environment, limits, and approval authority}}` |
| Manual testing | `{{platform, owner role, setup, and safe test constraints}}` |
| Commit and push | `{{who may commit/push and when}}` |
| Merge and release | `{{who authorizes; merge strategy; deployment policy}}` |

Missing policy is not permission. Continue independent authorized work while identifying the smallest missing choice required for a dependent action.

## Verification profile

| Check | Actual command or procedure | Required when | Known environment limit |
| --- | --- | --- | --- |
| Focused test | `{{verified command}}` | `{{behavior class}}` | `{{limit or none}}` |
| Build / types / lint | `{{verified command}}` | `{{scope}}` | `{{limit or none}}` |
| Broader regressions | `{{verified command}}` | `{{risk or milestone}}` | `{{limit or none}}` |
| Manual acceptance | `{{procedure link}}` | `{{task class}}` | `{{owner-only constraint}}` |

Do not fill commands by guessing. A baseline belongs to the task and exact source revision, rather than a permanent pass/fail count here.

## Version and conflict rules

Target documents, adopted decisions, implementation records, and handoffs answer different questions. Resolve conflicts with current source/evidence and the decision's actual scope; report drift rather than declaring every newer file authoritative. Record framework upgrades with the version, approved changes, local rules retained, and date. A shared-template update does not automatically change this profile.
