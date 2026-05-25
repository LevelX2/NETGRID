---
activityId: act-2026-05-24-proteus-phase-8b-corp-antibody-access
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
releaseTarget: Proteus Phase 8b
blockedBy:
  - act-2026-05-24-proteus-phase-8a-counter-taxonomy-purge-foundation
resultArtifacts: []
checks: []
---

# Proteus Phase 8b: Corp Antibody/Access

## Ziel

Die Corp-Antibody-Assets mit Access- und Counter-Effekten nach der 8a-Counter-Taxonomie umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `8b Corp Antibody/Access`.
- `docs/releases/proteus/virus-antibody-counter-contract.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.

## Zielkarten

- `onr_proteus_054_bel-digmo-antibody` Bel-Digmo Antibody
- `onr_proteus_057_doppelganger-antibody` Doppelganger Antibody
- `onr_proteus_068_pattel-antibody` Pattel Antibody
- `onr_proteus_075_stereogram-antibody` Stereogram Antibody

## Scope

- Access- und scored/installed Counter-Effekte.
- Antibody-Counter und öffentliche Counter-Displays.
- Purge-Unberührbarkeit von Antibody-Countern.

## Nicht im Scope

- Keine Runner-Virus-Programme aus 8d bis 8f.
- Keine Agenda-Karte aus 8c.
- Keine Random-Longtails.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Access-/Counter-Fenster sind LegalAction-basiert und in `applyAction` revalidiert.
- [ ] Antibody-Counter sind public-safe sichtbar und nicht purgefähig.
- [ ] Hidden-Info-, stale-action-, Choice-, Replay-/StateHash- und Manifest-/Coverage-Nachweise sind vorhanden.

## Ergebnisnotiz

Noch offen.
