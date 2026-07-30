# Corp-Planarchitektur Source-Cleanup – Final Review

## Status

`complete`

## Ergebnis

Die fachlich korrekte Corp-Planarchitektur ist jetzt auch in der
Source-Verantwortung klarer getrennt. `plan-first-live-runtime.ts` komponiert
die bestehenden Fakten und Provider, statt die umfangreichen Defense-,
Economy-, Continuity- und Action-Disposition-Bewertungen selbst zu tragen.

Neu gekapselt sind:

- Defense-Domain-Signale einschließlich qualitativer ICE-Staging-Bewertung,
  globaler Installationsbewertung und vollständiger aktueller
  Post-Install-Rez-Quote-Prüfung;
- Economy-Domain-Signale einschließlich sichtbarem Liquiditätsziel, exakter
  Basic-Credit-Projektion sowie residenter Cadence und Sättigung;
- Score-/Defense-Ausführungskontinuität als read-only
  Execution-Receipt-Adapter;
- Action-Dispositionen als geordnete ownerbezogene Contributions mit
  unverändertem First-Match-Vertrag.

Die Runtime bindet gemeinsam genutzte Fakten über typisierte read-only
Adapter an. Diese Adapter besitzen keine Aktions-, Plan-, Scheduler- oder
Executor-Autorität.

## Autoritätsprüfung

- ICE-Installation, Serverzuordnung und Rez bleiben vollständig bei
  `corp.defend_servers`.
- Agenda-Installation, Advancement und Scoring bleiben vollständig bei
  `corp.score_agenda`.
- Economy-Aktionen bleiben bei `corp.economy`.
- Der Turn Planner bleibt Dirigent und Informationsgrenzen-Manager.
- Die Rules Engine und aktuelle `LegalActions` bleiben die einzigen
  Regel- und Aktionsquellen.
- Action-Dispositionen bleiben Coverage- und Diagnoseevidence; sie bilden
  keinen negativen Action-Chooser.

Es entstand kein neues Planungs-, Memory-, Zufalls- oder Fallbacksystem.

## Verhaltensparität

Die Standard-Baseline wurde vor dem ersten Source-Change auf `d31a83feb` und
nach CP40 auf `ec8732aa0` mit identischer Konfiguration ausgeführt.

- 6 Slots;
- 10 Seeds pro Slot;
- 60 Spiele;
- 480 maximale Aktionen;
- 4 Worker;
- 12.527 Entscheidungen.

Der eingebaute Vergleich meldet `comparableToBaseline: true`. Darüber hinaus
wurden die vollständigen Raw-Artefakte strukturell verglichen:

- alle sechs Raw-Slots exakt identisch;
- alle 60 Spielzusammenfassungen exakt identisch;
- alle 12.527 `actionSequence`-Einträge exakt identisch;
- identische Final-StateHashes, TerminationKinds, Runtime-Failure-Evidence,
  Debug-Evidence, Replay-Ergebnisse und Metriken.

Nur die erwarteten Laufmetadaten `generatedAt` und `gitHead` unterscheiden
sich.

## Bekannter roter Ausgangsstand

Die Baseline war bereits vor dem Cleanup rot und ist nachher exakt gleich:

- 7 Illegal Actions;
- 7 Runtime Errors, jeweils
  `missing_plan_module_coverage` mit Owner `scheduler`;
- 1 unklassifiziertes Action-Limit-Spiel;
- 0 Replayfehler;
- 0 Fallbacks;
- 0 Timeouts;
- 0 Hidden-Info-Findings;
- 0 `no_legal_action_failure`.

Diese Befunde wurden bewusst nicht korrigiert oder umklassifiziert. Jede
solche Änderung wäre außerhalb des ausschließlich verhaltensneutralen
Auftrags gewesen.

## Verifikation

- AI-Shard 1: 180 Testdateien / 1.738 Tests grün;
- AI-Shard 2: 179 Testdateien / 1.489 Tests grün;
- AI-Shard 3: 179 Testdateien / 1.145 Tests grün;
- Workspace-Typecheck grün;
- AI-Source-Structure: `production=752`, `runtimeCycles=0`,
  `typeCycles=0`;
- Package Boundaries: `files=1990`;
- Engine Source Structure: `production=1012`, `relativeCycles=0`;
- Format- und Diff-Hygiene grün.

## Geänderte Kernartefakte

- `packages/ai/src/plans/corp-score-defense-continuity.ts`
- `packages/ai/src/plans/corp-economy-domain-signals.ts`
- `packages/ai/src/plans/corp-defense-domain-signals.ts`
- `packages/ai/src/plans/corp-action-disposition-contributors.ts`
- `packages/ai/src/runtime/plan-first-live-runtime.ts`
- zugehörige fokussierte Modultests
- `docs/architecture/ai/corp-plan-architecture-source-cleanup-process-2026-07-30.md`

## Restpunkte

Es verbleibt kein offener Architekturpunkt aus diesem Cleanup. Die bekannten
Baseline-Coverage-Lücken sind unabhängige Verhaltensbefunde und benötigen,
falls gewünscht, einen eigenen nicht verhaltensneutralen Arbeitsauftrag.
