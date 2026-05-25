---
activityId: act-2026-05-24-proteus-phase-6a-agenda-scoring-steal-baseline
status: blocked
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt:
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 6a
blockedBy:
  - Corporate Headhunters needs a scored-agenda activated meat-damage ability gated by runner tags plus a source-bound "if this damage succeeds, reduce Runner hand size" effect; current scoredAgenda/special damage families do not model that source-bound successful-damage follow-up.
  - Fetal AI can partially reuse accessEffects for net damage and R&D reveal, but its printed steal cost is on the accessed agenda itself; current steal_cost modifiers model rezzed root sources, not current-access self steal costs from any access zone.
  - Project Zurich needs an overadvance-on-score persistent start-of-corp-turn credit income based on every two excess advancement counters; current overadvance support is agenda-point counters, not recurring scored-agenda economy.
  - World Domination needs fixed additional agenda points on score; current Project Babylon overadvance scoring cannot express a fixed +4 agenda points.
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

Blockiert. Der Slice enthaelt mehrere Agenda-Baseline-Mechaniken, die vor einer regelkonformen Promotion als generische Bausteine ergänzt werden muessen:

- `Corporate Headhunters` braucht eine scored-agenda-Aktivierung mit Meat-Damage gegen getaggten Runner und eine source-bound Folge "wenn genau dieser Schaden erfolgreich ist, reduziere Runner-Handsize um 1". Die vorhandenen Damage-/Handsize-Modifikatoren bilden diesen erfolgreichen Schaden nicht als Quelle ab.
- `Fetal AI` und `Marked Accounts` passen teilweise in die vorhandene `accessEffects`-Familie. `Fetal AI` braucht aber zusätzlich eine Self-Steal-Cost auf der aktuell accesseten Agenda aus installierter Zone, HQ oder R&D; die vorhandene `steal_cost`-Familie ist auf rezzed Root-Modifikatoren am gleichen Server zugeschnitten.
- `Project Zurich` braucht eine beim Scoren berechnete, persistente Start-of-Corp-Turn-Economy aus Overadvance-Countern. Der vorhandene Project-Babylon-Baustein berechnet nur zusätzliche Agenda-Punkte.
- `World Domination` braucht einen festen +4-Agenda-Point-Score-Effekt; auch das ist nicht mit dem bestehenden Overadvance-Agenda-Point-Baustein ausdrückbar.
- `Marked Accounts` ist isoliert als Access-Tag-Ambush voraussichtlich machbar, wird aber nicht einzeln promotet, solange der vollständige 6a-Slice nicht alle Akzeptanzkriterien erfüllt.

Keine CardImplementation wurde fuer 6a angelegt und keine Manifest-/Coverage-Promotion vorgenommen.
