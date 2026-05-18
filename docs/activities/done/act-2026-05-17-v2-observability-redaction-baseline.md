---
activityId: act-2026-05-17-v2-observability-redaction-baseline
status: done
kind: fix
area: server
priority: normal
primaryAgent: test-quality-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget: V2.7
blockedBy: []
resultArtifacts:
  - apps/server/src/internet-hardening.ts
  - apps/server/src/observability-redaction.test.ts
  - docs/releases/v2/v2-7-observability/observability-redaction-baseline.md
checks:
  - corepack pnpm --filter @netgrid/server test -- observability-redaction.test.ts
  - corepack pnpm --filter @netgrid/server typecheck
  - git diff --check
---

# Observability-Redaction-Baseline vorbereiten

## Ziel

Als kleiner V2.7-Vorgriff soll ein Redaction-Baseline-Check für Logs, Diagnoseausgaben und künftige Metriklabels vorbereitet werden, damit spätere Public-/Account-Arbeit nicht versehentlich Tokens, Hidden Cards, Decklisten oder KI-Debugdaten in Betriebsdaten schreibt.

## Kontext und Quellen

- V2.7 Roadmap: Metrics, Traces, Health, Alerting ohne Token-/Hidden-Info-Leaks, privacy-konforme Logs, KI-Latenz/Fallback-Metriken ohne DecisionDebug.
- V1.0.9 Private Internet Hardening und Backend 0.5 liefern bereits private Betriebs- und Wartungsflächen.

## Scope

- Bestehende Log-/Health-/Diagnosepfade sichten.
- Einen kleinen Test oder dokumentierten Check definieren, der verbotene Muster in beispielhaften Betriebsdaten erkennt.
- Verbotene Muster mindestens: Tokens, Sessionwerte, Decklisten, Deckhashes, verdeckte Kartennamen, AIInput, DecisionDebug, FullState.
- Erlaubte technische Labels abgrenzen: RulesBaseline, Cardpool-Version, AI-Version, Formatprofil ohne private Inhalte.

## Nicht im Scope

- Keine neue Observability-Plattform.
- Keine Tracing-/Metrics-Infrastruktur.
- Keine Autoscaling- oder Public-Deployment-Arbeit.
- Keine Änderung am Engine-State oder Replay.

## Akzeptanzkriterien

- [x] Es gibt einen fokussierten Redaction-Check oder ein belastbares Checkkonzept für Betriebsdaten.
- [x] Erlaubte und verbotene Labels/Felder sind dokumentiert.
- [x] KI-Metriken sind von AIInput und DecisionDebug getrennt.
- [x] Bestehende Health-/Maintenance-Flächen werden nicht mit Public-Observability gleichgesetzt.

## Umsetzungshinweise

- Primärer Folgeagent: `test-quality-agent`.
- Wenn die erste Sichtung zeigt, dass ein reiner Doku-Schnitt reicht, Ergebnis entsprechend dokumentieren und Implementierung begründet auslassen.

## Ergebnisnotiz

Abgeschlossen. `findObservabilityRedactionViolations` und `OBSERVABILITY_ALLOWED_TECHNICAL_LABELS` bilden die fokussierte Baseline für Betriebsdaten. `redactSensitiveText` redigiert zusätzliche Account-, Deck-, AI-Debug-, FullState- und lokale Pfad-Muster. Der neue Test prüft Bad-/Safe-Samples und `redactedHealth`; es wurde keine Observability-Plattform oder Public-Infrastruktur eingeführt.
