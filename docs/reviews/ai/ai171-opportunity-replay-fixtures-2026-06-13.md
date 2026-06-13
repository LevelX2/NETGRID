# AI171 Opportunity Replay Fixtures

Datum: 2026-06-13

Branch: `codex/ai170-ai180-opportunity-snapshots`

## Ziel

AI171 baut aus AI170 drei reproduzierbare, redigierte Opportunity-Fixtures. Die Fixtures enthalten keine Full-State- oder Hidden-Zone-Daten, sondern nur side-safe Referenzen, LegalAction-Kandidaten, semantische Kandidatenfelder und erwartete Shadow-Klassifikation.

## Ergebnis

| Metrik | Wert |
| --- | ---: |
| Fixtures | 3 |
| TargetContext-missing-Fälle abgedeckt | 2 |
| Fixtures mit Progress-Alternative | 2 |
| Redaction safe | 1 |

## Fixtures

| Fixture | StateVersion | LegalAction-Kandidaten | Progress-Alternativen | Erwartung |
| --- | ---: | ---: | ---: | --- |
| `A-ai-v143-tuning-009:preceding_same_side_decision:100` | 100 | 1 | 0 | `opportunity_fixture_no_progress_alternative` |
| `B-ai-v143-tuning-001:preceding_same_side_decision:100` | 100 | 4 | 1 | `opportunity_fixture_with_progress_alternative` |
| `C-ai-v143-tuning-008:first_progress_action:100` | 100 | 6 | 4 | `opportunity_fixture_with_progress_alternative` |

## Schluss

Die Fixtures machen die AI170-Snapshots für spätere Solver und Candidate-Gates reproduzierbar. Sie sind bewusst read-only und shadow-only: Es gibt keinen Runtime-Eingriff und keine Erweiterung der Legalität.

## Verifikation

- `corepack pnpm --filter @netgrid/server exec tsx ../../scripts/build-ai171-opportunity-replay-fixtures.ts`
- `git diff --check`
