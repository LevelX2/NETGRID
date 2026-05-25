---
activityId: act-2026-05-24-proteus-phase-6a-agenda-scoring-steal-baseline
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
releaseTarget: Proteus Phase 6a
blockedBy: []
resultArtifacts: []
checks: []
---

# Proteus Phase 6a: Agenda Scoring/Steal Baseline

## Ziel

Die Proteus-Agenda-Scoring-, Steal- und Access-Ambush-Basis über generische Agenda- und Access-Effect-Familien umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `6a Agenda Scoring/Steal Baseline`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.
- Bestehende `scoredAgenda`-, Access-Effect-, Steal-Cost-, Agenda-Difficulty- und PublicPayload-Muster.

## Zielkarten

- `onr_proteus_003_corporate-headhunters` Corporate Headhunters
- `onr_proteus_004_fetal-ai` Fetal AI
- `onr_proteus_005_marked-accounts` Marked Accounts
- `onr_proteus_008_project-zurich` Project Zurich
- `onr_proteus_010_world-domination` World Domination

## Scope

- Pro Zielkarte eine eigene CardImplementation-Datei.
- `scoredAgenda`-/`stolenAgenda`-Effekte, Access-Ambush, Overadvance-/Agenda-Point-Modifikatoren, Siegpriorität und PublicPayload.
- LegalAction- und `applyAction`-Revalidierung für Kosten, Access-Origin, aktuelle Access-Karte und Agenda-Punkt-Effekte.

## Nicht im Scope

- Keine Runner-Agenda-/Overadvance-Events aus Phase 6e.
- Keine Corp-ICE-, Operation- oder Asset-/Upgrade-Resolver aus Phase 6b bis 6d.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Access-/Ambush-Effekte offenbaren nur die aktuell legal bekannte Karte.
- [ ] Agenda-Punkt-, Steal- und Overadvance-Logik ist StateHash-stabil.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Ergebnisnotiz

Noch offen.
