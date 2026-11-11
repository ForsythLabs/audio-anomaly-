# {{PROJECT_NAME}} Implemented System

Evidence as of: `{{commit or release, date, and relevant environment}}`

This document describes implemented behavior. Desired behavior belongs in the PRD and adopted decisions. For an existing project being onboarded, label uninspected areas as unestablished rather than assuming they are absent or complete.

## Implemented capabilities

| Capability or contract | Current behavior | Source | Verification / evidence | Limits |
| --- | --- | --- | --- | --- |
| `{{capability}}` | `{{implemented result}}` | `{{path and symbol}}` | `{{check at revision}}` | `{{scope and manual gate}}` |

## Interfaces and data

{{Describe the actual schemas, public contracts, state ownership, lifecycle, error semantics, and resource bounds needed by the current work. Link modules instead of duplicating their entire contents.}}

## Known gaps and drift

| Gap | Evidence | User impact | Owning task or follow-up |
| --- | --- | --- | --- |
| `{{implemented limitation or discrepancy}}` | `{{source/result}}` | `{{impact}}` | `{{link}}` |

## Updating this record

Update after the implementation is verified. Identify branch-specific candidate behavior when it has not landed on the default branch. Retain owner acceptance as a separate fact. Keep long test output and history in task evidence; split this SPEC behind an index when its size impedes navigation.
