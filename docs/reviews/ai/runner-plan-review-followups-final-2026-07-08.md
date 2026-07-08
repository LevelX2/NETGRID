# Runner-Plancontroller Review-Followups Abschluss 2026-07-08

## Ergebnis

Die Review-Followups aus den zwei Nutzerfeedbackdateien wurden sequenziell umgesetzt. Schwerpunkt war, die Runner-Planebene gegen die beobachteten Fehlentscheidungen zu härten, ohne Engine-Legalität oder Hidden-Info-Verträge zu verschieben.

## Umgesetzte Änderungen

- `known-central-access-payoff` leitet R&D-Zugriffstiefe nur noch aus side-safe R&D-Multiaccess-Semantik ab. Reine Info-/Look-/Replacement-Karten wie Expert Schedule Analyzer erzeugen keinen falschen zweiten R&D-Zugriff mehr.
- `RunnerRunPlan` quotet aktuelle Encounter-Sequenzen über konkrete Required-Subroutine-Indizes. Sichtbare Survival-Routinen mit Damage oder Program-Trash müssen gebrochen werden oder führen, falls möglich, zum Abort statt zu zufälligem `continue_run`.
- Access-Reserven werden beim RunPlan-Start mit sichtbaren beziehungsweise aus Evaluation-Evidence projizierten Trash-Kosten befüllt und getrennt in Steal-/Trash-Budgetfeldern geführt.
- Eine neue TacticalPlan-Linie `runner.clear_tags_or_survive` wird bei aktuellen Runner-Tags aktiv und mappt auf `tag.remove`, bevor normale Druck-, Setup- oder Economy-Pläne ausgewählt werden.

## Bewusst offengehaltene Folgepunkte

- Scout-/Probe-Unknown, Convert-Success-Window, Run-Event-Payload-Mapping und ICE-Control/Softening bleiben eigene Folgepakete.
- Steal-Cost-Reserve für noch nicht zugegriffene Agenden bleibt nur dann belastbar, wenn Kosten side-safe in LegalAction/Evidence sichtbar sind.
- Bank-/Broker-Hysterese und spezialisierte Credits sind nicht Teil dieses Pakets.

## Verifikation

- `corepack pnpm exec vitest run packages/ai/src/known-central-access-payoff.test.ts packages/ai/src/runtime/runner-run-plan-path-quote.test.ts packages/ai/src/runtime/runner-run-plan-policy.test.ts packages/ai/src/runtime/runner-run-plan-memory.test.ts packages/ai/src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Vertragsbewertung

Keine Änderung erzeugt neue LegalActions. Die KI mappt weiterhin ausschließlich auf aktuelle Engine-`LegalActions`. Es wurden keine verdeckten Korp-Hand-, R&D-, Remote- oder Stackdaten in PlayerViews, PublicEvents, AI-Inputs, Replays oder Debug-Artefakte aufgenommen.
