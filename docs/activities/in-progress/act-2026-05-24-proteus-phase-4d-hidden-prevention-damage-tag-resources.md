---
activityId: act-2026-05-24-proteus-phase-4d-hidden-prevention-damage-tag-resources
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
releaseTarget: Proteus Phase 4d
proReferences:
  - PRO012
blockedBy:
  - missing-hidden-resource-trace-success-cancel-window
  - missing-hidden-resource-post-damage-reaction-window
  - trace-post-bid-link-window-does-not-support-trash-source-costs
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-4d-hidden-prevention-damage-tag-resources.md
  - docs/releases/proteus/README.md
checks:
  - rg -n "Back Door to Netwatch|Bolt-Hole|Expendable Family Member|Get Ready to Rumble|Wired Switchboard" data/cards/proteus-cards.json docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md
---

# Proteus Phase 4d: Hidden Prevention, Damage and Tag Resources

## Ziel

Die verdeckten Prevention-, Damage-, Trace-/Tag- und Bad-Publicity-Resources als CardImplementation-Dateien auf der 4a-Aktivierungsgrundlage umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `4d Hidden Prevention/Damage/Tag Resources`.
- `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md`.
- `docs/releases/proteus/bad-publicity-contract.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.

## Zielkarten

- `onr_proteus_129_back-door-to-netwatch` Back Door to Netwatch
- `onr_proteus_132_bolt-hole` Bolt-Hole
- `onr_proteus_140_expendable-family-member` Expendable Family Member
- `onr_proteus_141_get-ready-to-rumble` Get Ready to Rumble
- `onr_proteus_154_wired-switchboard` Wired Switchboard

## Scope

- Damage-, Trace-, Tag- und Resource-Trash-Prevention generisch in Timingfenster integrieren.
- Bad-Publicity-Wiederverwendung für `Back Door to Netwatch` ohne ID-Branch nutzen.
- Source-redigierte PublicEvents für nicht vollständig öffentliche Aktivierungskontexte absichern.

## Nicht im Scope

- Keine Economy-/Bank-, Access- oder Sabotage-Familien.
- Keine AI-Support-Promotion und keine UI-Regelautorität.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Prevention-/Replacement-Effekte nutzen generische Hidden-Resource-Bausteine.
- [ ] Trace-, Damage-, Tag- und Bad-Publicity-Änderungen werden in `applyAction` revalidiert.
- [ ] Wrong-Side-, stale-action-, Kosten-, Ziel-, Choice-, Hidden-Info- und Replay-/StateHash-Tests sind vorhanden.

## Ergebnisnotiz

Blockiert am 2026-05-24.

Der Slice enthält zwei Zielkarten, die mit vorhandenen generischen Familien wahrscheinlich direkt umsetzbar wären:

- `Bolt-Hole`: `damagePreventionSources` mit Meat-Damage-Prevention, `trash_source`-Kosten und 4a-Hidden-Reveal-and-trash-Payload.
- `Expendable Family Member`: `tagPreventionSources` mit Tag-Avoid, Credit- und `trash_source`-Kosten sowie 4a-Hidden-Reveal-and-trash-Payload.

Die Activity fordert aber alle fünf Zielkarten und gemeinsame Trace-/Damage-/Tag-/Bad-Publicity-Akzeptanz. Eine isolierte Promotion der zwei einfachen Karten würde den Slice nicht vollständig erfüllen.

Blocker:

- `Back Door to Netwatch` braucht ein Hidden-Resource-Fenster nach erfolgreicher Trace-Berechnung, aber vor Anwendung des Trace-Erfolgseffekts. Dieses Fenster muss den Trace-Erfolg canceln und bedingt 1 Bad Publicity geben, wenn der gecancelte Trace mehr als nur Tags bewirkt hätte. Dafür gibt es aktuell keinen generischen CardImplementation-Resolver und keine Payload-/Revalidierungsstruktur.
- `Get Ready to Rumble` braucht ein Reaktionsfenster nach erfolgreich angewendetem Meat Damage, wenn das Spiel nicht bereits beendet ist. Der Effekt discards zwei zufällige Korp-HQ-Karten und braucht `RandomDrawRecords`, Hidden-HQ-Redaction und saubere PublicPayloads nach Reveal/Trash der Quelle.
- `Wired Switchboard` passt mechanisch in das vorhandene `trace_post_bid_link_window`, aber dieser Pfad unterstützt aktuell nur genau eine nichtnegative Credit-Kostenquelle (`creditCostForTraceAbility`). Die Karte hat stattdessen `[T]`/Hidden-Resource-trash-source-Kosten; eine Promotion ohne Erweiterung dieses generischen Trace-Kostenmodells wäre regelwidrig.

Entblockung:

- Einen generischen Hidden-Resource-Trace-Erfolg-Cancel-Resolver mit Bad-Publicity-Folge und Trace-Erfolgseffekt-Klassifikation schneiden.
- Einen generischen Post-Meat-Damage-Reaktionsresolver für Hidden Resources mit deterministischem Korp-HQ-Random-Discard schneiden.
- Das `trace_post_bid_link_window`-Kostenmodell auf `trash_source`-Kosten erweitern und dabei 4a-Reveal-and-trash-Payloads wiederverwenden.
- Danach den Slice erneut claimen und alle fünf Zielkarten in eigenen CardImplementation-Dateien umsetzen. Alternativ die einfachen Prevention-Karten als kleineren Folge-Slice aus 4d herauslösen.
