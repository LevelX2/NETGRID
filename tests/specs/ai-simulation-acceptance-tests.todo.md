# AI Simulation Acceptance Tests

Status: executable-tracking  
Stand: 2026-05-03

## MVP 0.3 Must Coverage

| Requirement | Automated Test |
|---|---|
| V03-REQ-001 | `packages/ai/src/index.test.ts` side-neutral input test |
| V03-REQ-002 | `packages/ai/src/index.test.ts` forbidden-field visibility test |
| V03-REQ-003 | shared typecheck and server AI mode tests |
| V03-REQ-004 | Runner AI access/steal and break/run tests |
| V03-REQ-005 | Corp AI score/rez/economy tests |
| V03-REQ-006 | AI fallback test |
| V03-REQ-007 | deterministic decision and simulation tests |
| V03-REQ-008 | AI-vs-AI simulation smoke |
| V03-REQ-009 | simulation replay StateHash test |
| V03-REQ-010 | decision explanation test |
| V03-REQ-011 | explanation visibility test |
| V03-REQ-012 | server human-runner-vs-corp-ai test |
| V03-REQ-013 | server human-corp-vs-runner-ai test |
| V03-REQ-014 | server simulation API test |
| V03-REQ-015 | web typecheck and UI contract |
| V03-REQ-016 | full workspace checks |

## Manual Smoke

1. Start web and server locally.
2. Create Runner-vs-Corp-KI match.
3. Verify the Corp AI advances automatically until the Runner can act.
4. Create Corp-vs-Runner-KI match.
5. End Corp turn and verify Runner AI acts automatically.
6. Run KI-vs-KI simulation from the UI and verify Winner/Limit plus StateHash are shown.
