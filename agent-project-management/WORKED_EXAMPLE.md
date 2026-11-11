# Worked Example

This fictional desktop notes project demonstrates the framework. Its decisions and test results are illustrative, not approvals or evidence for any real project.

## Initial task

The PRD includes `REQ-004`: the owner can export the currently selected note. SPEC describes a working note reader but no export feature. The plan names `T-010 Export selected note`, with an owner check that the exported file contains the selected note and no other note.

The owner approves implementation of T-010 within the existing local-file policy. Its card names the selected-note resolver, export service, focused tests, file-effect boundary, and owner acceptance. It records `returns_to: M-002 Notes usability milestone`.

## A dependency appears

The worker discovers that the selected-note state is only a frontend cache and can change during the file dialog. Implementing export from that state would violate the adopted rule that the backend confirms the note before reading its body.

The worker records the finding and preserves its partial work. The manager keeps T-010 blocked and opens `T-010A Confirm selected note at export boundary`. The decision record states which component owns selection and how a moved selection refuses. The owner adopts that material contract; the plan and T-010A card then cite it.

| Task | State | Requires | Returns to | Release evidence |
| --- | --- | --- | --- | --- |
| T-010 | Blocked | T-010A | M-002 | Revalidate export assumptions on accepted T-010A |
| T-010A | Ready | DEC-003 | T-010 | Resolver success, moved-selection refusal, reviewed merge |

## Proof and acceptance

T-010A's verifier first shows that changing selection during the dialog exports the wrong note. The correction revalidates the backend selection and refuses the moved case. A stable-selection control succeeds. The verifier uses the real resolver and export composition but substitutes the file writer; its evidence establishes routing to the writer, not a real filesystem write.

The manager reviews and merges T-010A, then returns to T-010 and checks its card against the new base. T-010 adds the actual bounded file operation under the project's approved policy. Automated checks pass, and the change merges. The plan still shows T-010 in progress with `owner acceptance pending`.

After rebuilding and restarting the application, the owner exports one non-sensitive note and inspects the file. The manager records the exact build and observed result. T-010 becomes accepted; management follows its return link to M-002 and checks the remaining requirements before closing that milestone.

## A separate finding remains visible

The owner also observes that the note list refreshes only after reopening its panel. That does not block the correctly scoped export result. Management adds `FU-002 Mounted note-list refresh`, linked to the owner evidence, with a UI milestone as its review trigger. It does not disappear into T-010's closeout or become an automatic extra task for the worker.

## Resume after a context change

A new manager reads the handoff, which names T-010 as accepted at the release commit, M-002 as the current objective, and FU-002 as deferred. It verifies Git state and the linked acceptance record. It can continue the usability milestone without reading the earlier conversations or repeating the export setup.

## Desk check for the framework

| Question | Answer available from the example |
| --- | --- |
| What remains blocked after T-010A passes but before merge? | T-010; its dependency requires reviewed merge. |
| Does a merged T-010 establish owner acceptance? | No; the owner check remains pending. |
| What does the substituted writer prove? | The exercised composition reaches the writer with the correct selection; no actual file-write claim. |
| What happens to the refresh finding? | FU-002 retains its source, owner, and review trigger. |
| Where does work return after acceptance? | T-010A → T-010 → M-002. |

The same pattern applies to a game milestone, a research deliverable, a data tool, or a web application. Each destination supplies its own artifact, test, data, and release policies.
