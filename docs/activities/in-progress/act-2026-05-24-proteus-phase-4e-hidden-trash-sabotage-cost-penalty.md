---
activityId: act-2026-05-24-proteus-phase-4e-hidden-trash-sabotage-cost-penalty
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
releaseTarget: Proteus Phase 4e
proReferences:
  - PRO012
blockedBy:
  - hidden_successful_run_before_access_window
  - hidden_current_access_trash_window
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-4e-hidden-trash-sabotage-cost-penalty.md
  - docs/releases/proteus/README.md
checks:
  - "rg -n \"Credit Subversion|Death from Above|Mercenary Subcontract|onr_proteus_136|onr_proteus_137|onr_proteus_145\" data/cards/proteus-cards.json docs/releases/proteus data/manifests/proteus-card-support.json -S"
  - "rg -n \"buildSuccessfulRunFollowupActions|CardSuccessfulRunFollowupImplementation|buildRunnerAccessActions|canFreeTrashCurrentAccessCard|accessedCardId\" packages/engine/src -S"
  - "git diff --check"
---

# Proteus Phase 4e: Hidden Trash, Sabotage and Cost Penalty

Statusreferenz 2026-05-27: Die PRO012-Zielkarten dieses alten Phase-4e-Slices sind umgesetzt. Diese Activity bleibt nur als historische Blocker-/Scope-Referenz offen und erzeugt keine zusätzliche Komplettzählung.

## Ziel

Die verdeckten Trash-, Forfeit-, Sabotage- und Cost-Penalty-Resources als CardImplementation-Dateien auf der 4a-Aktivierungsgrundlage umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `4e Hidden Trash/Sabotage/Cost Penalty`.
- `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.

## Zielkarten

- `onr_proteus_136_credit-subversion` Credit Subversion
- `onr_proteus_137_death-from-above` Death from Above
- `onr_proteus_145_mercenary-subcontract` Mercenary Subcontract

## Scope

- Trash-, Forfeit-, Sabotage- und Kostenstrafe-Familien generisch als Hidden-Resource-Aktivierungen modellieren.
- Zielwahl gegen installierte Karten und deterministische Kostenbehandlung absichern.
- Öffentliche Labels und PublicEvents so redigieren, dass nicht aktivierte Hidden Resources verborgen bleiben.

## Nicht im Scope

- Keine Economy-/Bank-, Access- oder Prevention-Familien.
- Keine offiziellen Assets und keine externen Kartendatenbank-Abhängigkeiten.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Trash-/Sabotage-/Cost-Penalty-Effekte nutzen generische Hidden-Resource-Bausteine.
- [ ] Kosten und Ziele werden aus frischen LegalActions in `applyAction` revalidiert.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel-, Choice-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.

## Ergebnisnotiz

Blockiert am 2026-05-24, ohne Kartenpromotion.

`Credit Subversion` und `Death from Above` benötigen ein generisches Hidden-Runner-Resource-Fenster nach festgestelltem erfolgreichem Run, aber vor dem normalen Access-Start. Das vorhandene `successfulRunFollowups`-System ist derzeit auf installierte Runner-Programme ausgelegt und deckt nur offene Followups wie `False Echo`/`Netspace Inverter` ab. Für verdeckte Runner-Resources fehlt ein kartenunabhängiger Ability-Baustein, der `trash_source`, Reveal-Payload, Serverfilter, Kostenrevalidierung, Wrong-Side-/stale-action-Schutz und die Reihenfolge relativ zur Access-Queue gemeinsam garantiert. Der Hidden-Resource-Vertrag nennt für `Credit Subversion` ausdrücklich eine noch offene Reihenfolgenentscheidung relativ zum HQ-Breach.

`Death from Above` braucht zusätzlich eine Remote-vor-Access-Wirkung, die alle im gerade erfolgreich gelaufenen Remote installierten Karten kostenlos trashes, auch wenn sie normalerweise nicht trashbar sind. Dafür fehlt im aktuellen Access-Übergang ein generischer, verdeckt auslösbarer Vor-Access-Trash-Step mit deterministischer Root-Zielmenge und PublicEvent-Redaction.

`Mercenary Subcontract` benötigt ein Access-Entscheidungsfenster für eine oder mehrere aktuell accessete Karten. Die vorhandene Access-Action-Familie arbeitet auf `run.accessedCardId` beziehungsweise einem einzelnen aktuellen Breach-Eintrag und kennt nur normale oder `freeTrashAccessZones`-basierte Trash-Entscheidungen. Ein Hidden-Resource-Baustein, der die aktuelle Access-Kandidatenmenge privat projiziert, Mehrfachauswahl revalidiert und dann `trash_source` plus kostenlose Trash-Ausführung public-safe auflöst, existiert noch nicht.

Keine Teilumsetzung wurde vorgenommen, weil der Slice alle drei Zielkarten gemeinsam fordert und eine isolierte Promotion einzelner Karten die Akzeptanzkriterien zu Timing, Choice-, Ziel-, Hidden-Info- und Replay-Schutz nicht erfüllen würde.
