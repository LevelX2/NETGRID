---
activityId: act-2026-05-24-proteus-phase-6a-agenda-scoring-steal-baseline
status: done-reference
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-28
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 6a
proReferences:
  - PRO013
blockedBy: []
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-6a-agenda-scoring-steal-baseline.md
  - docs/releases/proteus/README.md
checks:
  - "rg -n \"onr_proteus_003|onr_proteus_004|onr_proteus_005|onr_proteus_008|onr_proteus_010|Corporate Headhunters|Fetal AI|Marked Accounts|Project Zurich|World Domination\" data/cards/proteus-cards.json data/manifests/proteus-card-support.json docs/releases/proteus -S"
  - "rg -n \"scoredAgenda|stolenAgenda|steal|agenda.*point|Fetal|Marked Accounts|overadvance|additional advancement|liberated|agenda_difficulty|steal_cost|accessEffects|accessHooks\" packages/engine/src/card-implementations packages/engine/src/ability-engine packages/engine/src/game packages/engine/src/index.ts -S"
  - "git diff --check"
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

Durch PRO013 erledigt. Die fünf Phase-6a-Zielkarten sind als konkrete CardImplementation-Dateien umgesetzt und im Manifest engine-/human-playable markiert, ohne Decklegalität, Formatlegalität oder AI-Unterstützung.

Ergänzt wurden generische Bausteine für source-bound scored-agenda Meat-Damage mit Handgrößenreduktion bei erfolgreichem Schaden, current-access Self-Steal-Cost, Agenda-Access-Ambush mit R&D-Reveal-Barriere, fixe Score-Agenda-Punktmodifikatoren und overadvance-basierte scored-agenda Start-of-Corp-Turn-Credits.

Diese alte Umbrella-Activity bleibt nur Statusreferenz. Die Zählung erfolgt über die neue Done-Activity `docs/activities/done/act-2026-05-28-proteus-pro013-agenda-steal-overadvance-suite.md`, damit PRO013 nicht doppelt gezählt wird.
