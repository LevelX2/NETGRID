# AI-PLAN-2 Plan Memory and Capability Selection Review

Datum: 2026-06-05

## Ergebnis

AI-PLAN-2 stabilisiert die in AI-PLAN-1 eingeführte TacticalPlan-Ebene mit einem kleinen AI-internen, side-safe PlanMemory-Snapshot. Der Snapshot merkt pro Profil und Side nur Plan-ID, Plan-Typ, Ziel, Step-Kind, gewählte Action-ID, Status, TTL und Progressionsbegründung. Hidden-Zone- oder vollständige GameState-Daten werden nicht gespeichert.

## Umgesetzt

- `TacticalPlanMemorySnapshot` mit `active`, `blocked`, `progressing`, `satisfied` und `abandoned`.
- Memory-Fortschreibung in `chooseSemanticRuntimeAction` über `getTacticalPlanMemorySnapshot` und `rememberTacticalPlanRuntime`.
- Debug-Ausgabe für `previousPlan`, `selectedPlan`, `selectedStep`, `planProgressionReason` und `whyPlanAbandoned`.
- Broker-/Bank-Stabilisierung: Cashout wird nach stabilem Bankaufbau nicht direkt wieder gewählt; Cashout bleibt bei niedrigen Credits oder erkennbarem Finanzierungsbedarf möglich.
- Breaker-Coverage wird anhand sichtbarer rezzter ICE in `breaker_wall`, `breaker_code_gate`, `breaker_sentry`, `breaker_ap`, `breaker_trace` oder `breaker_universal` differenziert.
- Opportunistic-Central-Run hat eine ein-Entscheidungs-TTL; danach kehrt die Planebene bei weiter bestehendem Blocker zum Coverage-/Remote-Plan zurück.

## Safety

- Finale Auswahl bleibt auf bestehende Engine-`LegalActions` beschränkt.
- Keine Änderung an `applyAction`, LegalAction-Generierung, Shared-Schema oder Engine-Regeln.
- PlanMemory ist side-safe und enthält keine privaten gegnerischen Kartenlisten.
- Broker-Cashout-Defer ist eine enge Semantic-Runtime-Exclusion nur nach `runner.build_credit_bank` bei stabilem Creditstand.

## Verifikation

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai exec vitest run src/tactical-plans.test.ts src/semantic-ai-runtime-cutover.test.ts`
- `git diff --check`

## Grenzen

- PlanMemory ist lokal im AI-Prozess und nicht serverpersistent.
- Broker-Erkennung nutzt weiterhin vorhandene LegalAction-Labels plus Semantiksignale.
- Breaker-Coverage ist bewusst konservativ und basiert nur auf sichtbarer rezzter ICE und sichtbaren Runner-Optionen.
