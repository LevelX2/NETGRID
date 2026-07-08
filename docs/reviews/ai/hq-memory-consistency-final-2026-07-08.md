# HQ-Memory-Konsistenz Final 2026-07-08

Match: `match_427831dbf32a303c`

Branch: `codex/hq-memory-consistency`

Worktree: `C:\Projekte\NETGRID_AI_HQ_MEMORY_CONSISTENCY`

## Ergebnis

Die Runner-KI pflegt side-safe HQ-Wissen jetzt konservativer und diagnostizierbarer:

- `trash_accessed_card` aus HQ entfernt bekannte HQ-Karten auch dann, wenn das PublicEvent nur `serverLabel: "HQ"` statt `serverId: "hq"` enthält.
- Ein späterer HQ-Access, der einem zuvor vollständigen HQ-Ledger widerspricht, invalidiert dieses Ledger konservativ und erzeugt `belief_warning:hq_all_known_contradiction`.
- Die Warnung erscheint in der Memory-Diagnostik als `uncertainty:belief_warning:hq_all_known_contradiction`.
- RunTarget-Payoff lässt einen bestätigten `known_no_current_payoff` nicht mehr durch installierte Multiaccess-/Access-Boni zu `access_bonus` hochstufen.

## Grenzen

- Label-only R&D bleibt absichtlich unverändert, damit R&D-Top-Freshness nicht aus unsicherem Textlabel rekonstruiert wird.
- Der frühe Credit-vor-R&D-Fall aus dem analysierten Match wurde nicht neu umgesetzt, weil der aktuelle `main` bereits Credit als Support-/Sub-Aktion gehärtet hat.
- Der alte Post-ICE-Jack-out-Fall war schon vorher behoben und wurde nicht erneut bearbeitet.

## Verifikation

- `corepack pnpm exec vitest run packages/ai/src/belief-state.test.ts packages/ai/src/known-central-access-payoff.test.ts packages/ai/src/runner-run-target-evaluation.test.ts packages/ai/src/diagnostics/semantic-runtime-memory-debug.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Alle genannten Checks waren im Worktree grün.
