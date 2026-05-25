---
activityId: act-2026-05-24-proteus-phase-9b-action-economy-debt
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
releaseTarget: Proteus Phase 9b
blockedBy:
  - act-2026-05-24-proteus-phase-8a-counter-taxonomy-purge-foundation
  - agenda_damage_replacement_counter_contract
  - recurring_restricted_extra_action_contract
  - action_forfeit_penalty_contract
  - forced_random_action_resolution_contract
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-9b-action-economy-debt.md
  - docs/releases/proteus/README.md
  - docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md
checks:
  - rg AI Board Member/Please Don't Choke Anyone/Project Venice/Corporate Guard(R) Temps/Bargain with Viacox/Lucidrine Drip Feed in Proteus cards, errata and engine action-economy paths
  - rg corpActionDebt/forgo_action/gain_actions/CardAbilityCostImplementation/actionGain in engine
  - git diff --check
---

# Proteus Phase 9b: Action Economy/Action Debt

## Ziel

`AI Board Member`, `Please Don't Choke Anyone`, `Project Venice`, `Corporate Guard(R) Temps`, `Bargain with Viacox` und `Lucidrine™ Drip Feed` über generische Aktionsökonomie- und Action-Debt-Bausteine umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `9b Action Economy/Action Debt`.
- `docs/releases/proteus/release-slicing-plan.md`, Phase 9.
- `docs/releases/proteus/purge-action-debt-contract.md`.

## Zielkarten

- `onr_proteus_001_ai-board-member` AI Board Member
- `onr_proteus_006_please-dont-choke-anyone` Please Don't Choke Anyone
- `onr_proteus_007_project-venice` Project Venice
- `onr_proteus_046_corporate-guard-r-temps` Corporate Guard(R) Temps
- `onr_proteus_131_bargain-with-viacox` Bargain with Viacox
- `onr_proteus_144_lucidrinetm-drip-feed` Lucidrine™ Drip Feed

## Scope

- Zusätzliche, entzogene oder künftig zu forgende Aktionen als StateHash-relevante Engine-Fakten.
- LegalAction-Filterung und deterministische Action-Debt-Abzahlung.
- PublicPayloads ohne private Hand-/Deck-/Choice-Leaks.

## Nicht im Scope

- Keine Random-Karten aus 9a.
- Keine Hidden-Zone-Search aus 9c.
- Keine UI-Regelautorität, Decklegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Action-Economy-/Debt-Fakten sind strukturiert, StateHash-relevant und replaystabil.
- [ ] LegalActions werden für Seite, Timing, Kosten, Ziele und verfügbare Aktionen revalidiert.
- [ ] Wrong-Side-, stale-action-, Kosten-, Action-Debt- und Replay-/StateHash-Tests sind vorhanden.
- [ ] Registry-/Coverage-/Manifest-Nachweis ist erbracht.

## Blocker

Der Slice ist ohne neue generische Action-Economy- und Replacement-Verträge nicht vollständig und nicht regelkonform umsetzbar:

- `AI Board Member` braucht am Start jedes Korp-Zugs einen Wurf, der eine optionale zusätzliche Aktion mit genau einem erlaubten Aktionstyp für diesen Zug erzeugt: Install, Gain-1 oder Draw. Vorhandene `gain_actions`-Effekte erhöhen nur Actions allgemein; `corpActionDebt` bildet nur zu forgende Aktionen ab, nicht turngebundene restricted extra actions mit LegalAction-Filterung.
- `Please Don't Choke Anyone` braucht ein Korp-eigenes Preventable-Damage-Replacement-Fenster nach Runner-Prevention, das je erfolgreich verhindertem Korp-Damage einen PDCA-Counter auf einer scored agenda erzeugt. Die vorhandenen Damage-Prevention-Quellen sind Runner-seitig oder sichtbare Hardware-/Programmquellen; ein Korp-Agenda-Replacement nach erfolgreichem Damage fehlt.
- `Project Venice` braucht beim Scoren einen Overadvance-Wert und daraus wiederkehrende zusätzliche Korp-Aktionen in jedem Korp-Zug. Die aktuelle Overadvance-/Agenda-Baseline ist in Phase 6a blockiert und es gibt keinen generischen per-turn extra-action source record für scored agendas.
- `Corporate Guard(R) Temps` braucht ein X-Kostenmodell beim Spielen, danach X künftige Korp-Züge mit zusätzlicher Aktion und zusätzlich ein "forfeit the next X you gain"-Penalty-Modell. Vorhandene install-only Actions aus `Edgerunner, Inc., Temps` sind sofortige restricted actions, nicht mehrere künftige Züge plus Forfeit-Schuld.
- `Bargain with Viacox` braucht ab dem Zug nach Installation zwingende start-of-turn Random-Aktionen mit sechs unterschiedlichen Folgen, darunter erzwungene Runs, zufälliger Grip-Reveal und Play-/Install-Pflicht falls bezahlbar. Diese Kombination verlangt forced-action state, RandomDrawRecords, Hidden-Grip-Redaction und fallback-fähige Play-/Install-Revalidierung.
- `Lucidrine™ Drip Feed` wäre für sich näher an vorhandenen Start-of-turn-Counter-/Unpreventable-Core-Damage-Mustern, aber seine gewonnene Aktion darf laut Errata für Penalties geforgone werden. Eine isolierte Promotion würde den gemeinsamen 9b-Action-Economy-Vertrag nicht erfüllen.

Es wurden bewusst keine Teil-CardImplementations promotet. Nächster unblockender Schritt ist ein enger Vertrag für turngebundene zusätzliche Aktionen, restricted/forced action queues und Action-Forfeit-Penalties, plus ein separater Damage-Replacement-Vertrag für Korp-Agenda-Quellen.

## Ergebnisnotiz

Blockiert dokumentiert. Keine Runtime-Änderung, keine Manifest-Promotion und keine Deck-/AI-Freigabe.
