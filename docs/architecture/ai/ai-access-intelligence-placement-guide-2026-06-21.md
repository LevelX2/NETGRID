# AI Access Intelligence Placement Guide

Status: `active_internal_guidance`

Dieses Dokument ordnet neue Access-Intelligence-Änderungen den richtigen AI-Modulgrenzen zu. Es gibt keine Engine-Regeln frei, erzeugt keine `LegalActions` und aktiviert keinen RemoteContest- oder TargetChoice-Cutover.

## Grundsatz

Access-Intelligence ist AI-intern, LegalActions-only und side-safe. Die Engine bleibt Regelautorität; `applyAction` validiert Access, Trash, Steal, Choices, Kosten und Timing erneut. AI-Module dürfen Access nur projizieren, bewerten, erinnern oder diagnostisch vergleichen.

## Platzierung

- Gemeinsame Intent-, Reason- und Target-Typen liegen in `packages/ai/src/access/access-decision-types.ts`.
- Invarianten zu Access-Entscheidungen liegen in `packages/ai/src/access/access-decision-invariants.ts`.
- Pre-Run-/Access-Window-Projektionen laufen über `packages/ai/src/decision/access-decision-projection.ts` und den Access-Window-Adapter `packages/ai/src/access/access-window-choice.ts`.
- Remote-Root-Wert, Trash-Spendability, Reserve-Zitat, Ranking, Fingerprint und Outcome-Memory liegen unter `packages/ai/src/access/`.
- TacticalPlans und RunTargetEvaluation dürfen strukturierte Access-Daten konsumieren, aber keine Evidence-Strings als primäre Entscheidungsquelle parsen.
- Evaluation, Feedback, Real-Engine-Corpus und Loop-Detection bleiben unter `packages/ai/src/evaluation/` und report-only.
- Runtime-Switches in `packages/ai/src/index.ts` dürfen nur schmale Access-Helper verwenden; neue Fachlogik gehört in `access/`, `decision/`, `tactical-plans.ts`, `runner-run-target-evaluation.ts` oder `evaluation/`.

## Verbotene Platzierungen

- Keine Access-Fachlogik direkt in `packages/ai/src/index.ts`, wenn sie als reiner Helper extrahierbar ist.
- Keine Imports aus `runtime/`, `evaluation/` oder `index.ts` in `access/`.
- Keine Public-Exports für Access-Intelligence-Internals ohne expliziten API-Beschluss.
- Keine Speicherung von Hidden-Zone-Karten, vollständigem Engine-State, privaten Payloads oder nicht side-sicheren Definitionen in Access-Memory.
- Keine Dry-Run-Erzeugung von `selectedChoices`, `selectedTargets` oder PlayerActions.

## Review-Fragen

- Nutzt die Änderung ausschließlich Engine-`LegalActions`, `PlayerView` und side-safe Memory?
- Ist Projektion von beobachtetem Outcome getrennt?
- Invalidiert Memory bei Remote-Fingerprint-Wechsel oder verbesserter Economy?
- Bleibt TargetChoice-Dry-Run ohne Runtime-Wirkung?
- Gibt es eine fokussierte Regression und, bei gemeinsamen Typen, einen Boundary-/Public-Export-Guard?
