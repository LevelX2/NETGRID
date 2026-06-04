# META 2 Semantic Decision Core + Quality Calibration

Stand: 2026-06-04
Status: complete

## Ziel

META 2 baut aus META-1-Doctrine, TacticalGoalState und ActionSemanticCandidate-nahen Fixtures einen erklärbaren Semantic Decision Core. Der Core bleibt Shadow-/diagnostic-only und hat keine produktive Action-Ausführung.

## Ergebnis

Ergänzt wurden:

- Consumer-Gruppen: `economy`, `draw`, `setup_coverage`, `run_access`, `remote_contest`, `survival`, `corp_scoreline`, `ice_portfolio`, `tag_punish`, `damage_kill`, `target_selection`, `risk_management`.
- `SemanticDecisionScore` mit getrennten Komponenten für GoalFit, DoctrineFit, BoardUrgency, Reachability, CostFit, TimingFit, TargetFit, RiskPenalty und OpportunityValue.
- Bewertungsreihenfolge: Engine LegalAction membership vor HiddenInfo, Reachability, Cost/Timing, Target/Ability/Card, Board urgency, TacticalGoal, DeckDoctrine, Risk/Opportunity und WhyNot.
- `WhyNotEntry` für blockierte oder unterlegene Kandidaten.
- 14 Archetyp-Fixtures und 6 Boardstate-Override-Fixtures.
- Human-Review-Kategorien inklusive `unsafe_divergence`, `bad_goal_priority`, `missing_tactic_signal`, `missing_card_semantics` und `missing_action_context`.

## Quality Gates

| Gate | Ergebnis |
| --- | --- |
| SemanticDecisionScore v0 existiert | pass |
| Consumer-Gruppen existieren | pass |
| GoalFit/DoctrineFit/BoardUrgency getrennt | pass |
| Boardstate kann Doctrine überstimmen | pass |
| WhyNot-Erklärungen vorhanden | pass |
| Archetyp-Fixtures vorhanden | pass |
| Boardstate-Override-Fixtures vorhanden | pass |
| `unsafeDivergenceCount` | 0 |
| `illegalSemanticDecisionCount` | 0 |
| `hiddenInfoViolationCount` | 0 |
| `unreachablePreferredActionCount` | 0 |
| `scoreWithoutExplanationCount` | 0 |
| `actualDecision` | Legacy |

## Verifikation

```text
node scripts/check-meta2-semantic-decision-core-quality-calibration.mjs
corepack pnpm --filter @netgrid/ai test -- semantic-ai-core-meta.test.ts
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

## Nächster Schritt

META 3 darf Cutover technisch entwerfen, aber nicht ausführen. Die Semantic-Auswahl bleibt an Engine-`LegalActions`, harte Gates, Rollback und default-off Flags gebunden.
