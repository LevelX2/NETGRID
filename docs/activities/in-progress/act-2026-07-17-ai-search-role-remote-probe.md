---
activityId: act-2026-07-17-ai-search-role-remote-probe
status: in_progress
kind: implementation
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-17
startedAt: 2026-07-17
completedAt:
branch: codex/ai-search-role-remote-probe
releaseTarget: main
blockedBy: []
resultArtifacts: []
checks: []
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

1. Spielgleiche Checkpoints für Schematics, Library Search und den
   unterfinanzierten Score-Threat-Remote sichern.
2. Die Fehlklassifikation aus Kartentiteln entfernen und positive
   Search-/Tutor-Semantik erhalten.
3. Den Score-Threat-Remote mit `gain_credits_first` zunächst finanzieren,
   ohne allgemeine Prüfruns zu verbieten.
4. Rote und grüne Regressionstests, Gegenproben, Typecheck und AI-Gates.

## Nicht im Scope

- Änderungen an Engine-LegalActions oder am Timing des Jack-out.
- Neubewertung von Eurocorpse; die Karte kam in diesem Match nicht vor.
- Pauschale Sperre von Prüfruns gegen unbekanntes ICE.

## Paketfolge

1. Checkpoints und rote Evidenz für beide Fehlergruppen erzeugen und committen.
2. Source-Role-Consumer korrigieren, Gegenprobe prüfen und committen.
3. Remote-Contest-Planstep korrigieren, Gegenprobe prüfen und committen.
4. Breite Gates, Main-Merge und bereinigter Worktree.

## Akzeptanzkriterien

- [ ] Titel allein erzeugt weder `search` noch `draw` als Source-Role.
- [ ] Explizite Rollen, Mechaniken und Regeltext bleiben als Source-Role gültig.
- [ ] Schematics und Library Search tragen in ihren historischen Checkpoints
  keinen Coverage-/Setup-Search-Score mehr, bleiben aber produktiv spielbar.
- [ ] Ein Score-Threat-Probe mit `gain_credits_first` und Vorbereitungsklick
  wählt Funding; eine sonst identische nicht-bedrohliche Probe bleibt zulässig.
- [ ] Checkpoints, fokussierte Tests, Typecheck und Diff-Check sind grün.

## Ergebnisnotiz

In Arbeit.
