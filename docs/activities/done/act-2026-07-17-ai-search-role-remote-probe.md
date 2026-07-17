---
activityId: act-2026-07-17-ai-search-role-remote-probe
status: done
kind: implementation
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-17
startedAt: 2026-07-17
completedAt: 2026-07-17
branch: codex/ai-search-role-remote-probe
releaseTarget: main
blockedBy: []
resultArtifacts:
  - data/scenarios/ai-decision-checkpoints/cp-802f-01-schematics-no-title-search-d17.json
  - data/scenarios/ai-decision-checkpoints/cp-802f-03-remote-fund-before-score-threat-probe-d13.json
  - docs/reviews/ai/match-802f-search-role-remote-probe-final-2026-07-17.md
checks:
  - targeted decision checkpoints and plan tests passed
  - match-9fef runner decision checkpoints passed
  - '@netgrid/ai typecheck passed'
  - check:ai-source-structure passed
---

# KI: Search-Rollen und Remote-Prüfrun kalibrieren

## Ziel

Die KI darf Karten mit `Search` nur bei einer expliziten Suchsemantik als
Suchwerkzeug bewerten. Ein Remote-Contest mit der konkreten Empfehlung
`gain_credits_first` soll bei einem Score-Threat nicht durch die Ausnahme für
reine Prüfruns vorzeitig starten.

## Kontext und Quellen

- Match `match_802f73f6ccd2d6fe`, Runner-Entscheidungen 13, 17, 89 und 113.
- [Spielanalyse-Skill](C:/Users/Lui/.codex/skills/netgrid-ai-spielanalyse-worktree/SKILL.md).
- `packages/ai/src/runtime/runner-source-card-answer-role.ts`.
- `packages/ai/src/plans/tactical-plan-runner-run-targets.ts`.

## Scope

1. Spielgleiche Checkpoints für Schematics und den unterfinanzierten
   Score-Threat-Remote gesichert.
2. Die Fehlklassifikation aus Kartentiteln entfernt und positive
   Search-/Tutor-Semantik erhalten.
3. Den kostenfreien Score-Threat-Probe mit `gain_credits_first` zunächst
   finanzieren, ohne allgemeine oder bezahlbare Prüfruns zu verbieten.
4. Rote und grüne Regressionstests sowie gezielte Nachbargates ausgeführt.

## Nicht im Scope

- Änderungen an Engine-LegalActions oder am Timing des Jack-out.
- Neubewertung von Eurocorpse; die Karte kam in diesem Match nicht vor.
- Pauschale Sperre von Prüfruns gegen unbekanntes ICE.

## Ergebnisnotiz

Erledigt. Kartentitel, Typen und Subtypen erzeugen keine Source-Role mehr;
nur explizite Rollen, Mechaniken und Regeltext bleiben maßgeblich. Ein
`probe_only`-Remote wird nur dann zum Funding-Schritt, wenn er zugleich ein
Score-Threat ohne sichtbare Pfadkosten ist und die konkrete Evaluation
`gain_credits_first` verlangt. Die Gegenproben für gewöhnliche und bezahlbare
Prüfruns bleiben grün.
