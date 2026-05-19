# Test Failure Triage

## Goal

Prevent the agent from reverting current requirements, user-confirmed UI, or valid implementations back to stale test contracts just to make tests green.

## When To Apply

Execute this rule before proposing or implementing a fix whenever any of the following occur:

- Unit test, integration test, E2E, lint contract, or snapshot failure
- User requests "fix tests / all test failures must be fixed"
- After code changes, tests assert old DOM, old classes, old props, old copy, or old flows
- Verification stage leaves "tests need follow-up" as a risk

## Required Triage

Before fixing, determine which category the test failure belongs to:

| Type | Determination basis | Default fix direction |
| --- | --- | --- |
| Implementation regression | Test still represents current requirements; production code deviates from expected | Fix production code |
| Stale test contract | Current implementation is user-confirmed or new design target; test still asserts old structure | Fix test |
| Requirement change not synced | Requirements changed but tests cover old behavior or lack new behavior | Sync test contract, then add necessary implementation |
| Environment / fixture issue | Failure comes from mock, fixture, timing, permissions, or data initialization | Fix test environment or fixture |

Cannot decide to change production code based solely on "test failed".

## Hard Rules

- If current implementation was just changed by the user, explicitly requested to keep, or determined as target state by Scope gate, reverting implementation to satisfy old tests is forbidden.
- When tests assert old classes, old DOM hierarchy, old props, old snapshots, or old copy, first verify whether those assertions are still the current contract; if not, update the test.
- When fixing tests, cannot delete assertions to "let failures pass"; must migrate assertions to current observable behavior, interactions, accessibility, or data contracts.
- When fixing production code, cannot break user-confirmed UI, behavior, or architecture boundaries to satisfy tests.
- If unable to determine whether the test or implementation is wrong, must continue reading related implementation, tests, requirement records, or design docs; cannot proceed on guesswork.

## Gate Output Requirements

Add test failure triage conclusion in Scope / Close gate:

```text
Test failure triage
- Type: stale test contract / implementation regression / requirement not synced / environment fixture
- Evidence: ...
- Fix direction: fix test / fix implementation / fix fixture
```

## Closeout Rule

"Tests still need syncing", "test contracts not yet fixed", "there are still runnable verifications" are not residual risk — they are actionable items.

As long as such items exist, `final closeout` is forbidden. Continue fixing, verifying, or explain the real blocker.

## Examples

Good:

```text
Test failure triage
- Type: stale test contract
- Evidence: component changed to grouped entry `.tool-entry`, test still queries `.action-card` and `topActions`
- Fix direction: keep current UI, update test assertions for grouping, entry, click events, and aria-label
```

Bad:

```text
Test can't find .action-card, so revert component back to .action-card.
```
