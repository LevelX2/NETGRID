# AI-PLAN-2 TacticalPlan-Fortschreibung und Capability-Auswahl

Status: in Umsetzung

## Ziel

Die in AI-PLAN-1 eingeführte TacticalPlan-Ebene soll über mehrere Entscheidungen nutzbarer werden, ohne Engine-Regeln, LegalAction-Erzeugung oder Kartensemantikdaten zu ändern.

## Scope

- kleine AI-interne, side-safe `previousPlan`-/PlanMemory-Snapshots
- Planfortschreibung für `active`, `blocked`, `progressing`, `satisfied` und `abandoned`
- stabilere Broker-/Bank-Planwahl
- konkretere Breaker-Coverage-Capabilities aus sichtbarem ICE
- TTL für opportunistische Central-Runs
- Debug-Erweiterung um `previousPlan`, `selectedPlan`, `selectedStep`, `planProgressionReason` und `whyPlanAbandoned`

## Nicht-Ziele

- keine neuen Kartensemantikdaten
- keine Engine-/LegalAction-/`applyAction`-Änderung
- keine Hidden-Info-Projektion
- keine dauerhafte Serverpersistenz
- kein großer Gate-Prozess

## Umsetzungspakete

1. `previousPlan`-/PlanMemory-Snapshot und Debug anzeigen.
2. Planfortschreibung und Broker-/Bank-Stabilisierung.
3. Breaker-Coverage-Capability und Central-Run-TTL verfeinern.

## Verifikation

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts`
- `git diff --check`
