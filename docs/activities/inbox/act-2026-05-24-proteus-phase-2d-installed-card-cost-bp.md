---
activityId: act-2026-05-24-proteus-phase-2d-installed-card-cost-bp
status: inbox
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt:
completedAt:
branch:
releaseTarget: Proteus Phase 2d
blockedBy:
  - act-2026-05-24-proteus-phase-2a-bad-publicity-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 2d: Installed-Card Cost BP

## Ziel

`Poisoned Water Supply` mit Bedingung auf installierte Connections und Trash eigener installierter Karten als Kosten-/Effektteil umsetzen.

## Zielkarte

- `onr_proteus_117_poisoned-water-supply` Poisoned Water Supply

## Scope

- Eigene CardImplementation-Datei.
- Bedingung auf zwei installierte Runner-Connections.
- Auswahl/Trash eigener installierter Karten side-sicher revalidieren.
- Danach Bad Publicity über Phase-2a-Baustein.

## Nicht im Scope

- Keine Hidden-Resource-Karten.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Karte hat eine eigene CardImplementation-Datei.
- [ ] Connection-Bedingung, Zielwahl und Kosten werden revalidiert.
- [ ] BP-Erhöhung nutzt den generischen Baustein.
- [ ] PublicPayload, Replay und StateHash sind stabil.

## Ergebnisnotiz

Noch offen.
