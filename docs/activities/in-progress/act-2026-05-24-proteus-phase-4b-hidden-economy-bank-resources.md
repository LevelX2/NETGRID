---
activityId: act-2026-05-24-proteus-phase-4b-hidden-economy-bank-resources
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
releaseTarget: Proteus Phase 4b
proReferences:
  - PRO011
blockedBy:
  - missing-hidden-resource-cost-penalty-support-window
  - slice-scope-mismatch-airport-locker-and-time-to-collect
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-4b-hidden-economy-bank-resources.md
  - docs/releases/proteus/README.md
checks:
  - rg -n "Airport Locker|Chiba Bank Account|Liberated Savings Account|Swiss Bank Account|Time to Collect" data/cards/proteus-cards.json docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md
---

# Proteus Phase 4b: Hidden Economy and Bank Resources

## Ziel

Die verdeckten Proteus-Economy- und Bank-Resources als eigene CardImplementation-Dateien auf der 4a-Aktivierungsgrundlage umsetzen.

## Kontext und Quellen

- `docs/releases/proteus/detailed-phase-slice-plan-2026-05-24.md`, Slice `4b Hidden Economy/Bank Resources`.
- `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md`.
- `docs/releases/proteus/mechanics-coverage-analysis.md`.

## Zielkarten

- `onr_proteus_128_airport-locker` Airport Locker
- `onr_proteus_133_chiba-bank-account` Chiba Bank Account
- `onr_proteus_143_liberated-savings-account` Liberated Savings Account
- `onr_proteus_152_swiss-bank-account` Swiss Bank Account
- `onr_proteus_153_time-to-collect` Time to Collect

## Scope

- Hidden reveal economy, hosted/stored credits und Runner-Choice-Windows generisch über CardImplementation deklarieren.
- Aktivierungsergebnis öffentlich machen, ohne vor validiertem Reveal die konkrete verdeckte Quelle zu leaken.
- Kosten-, Choice- und Timing-Revalidierung für jede Zielkarte testen.

## Nicht im Scope

- Keine Hidden-Access-, Prevention-, Damage-, Tag- oder Sabotage-Familien.
- Keine Decklegalität und keine AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte besitzt eine eigene CardImplementation-Datei.
- [ ] Economy-/Bank-Effekte nutzen generische Hidden-Resource-Aktivierungsbausteine.
- [ ] Runner-Choices und gespeicherte Credits sind deterministic replay- und StateHash-stabil.
- [ ] Korp-Views und PublicEvents leaken nicht gewählte oder nicht aktivierte Quellen nicht.
- [ ] Wrong-Side-, stale-action-, Kosten-, Choice-, Hidden-Info- und Coverage-Tests sind vorhanden.

## Ergebnisnotiz

Blockiert am 2026-05-24.

Die Activity kann nach 4a noch nicht vollständig umgesetzt werden, ohne neue, ungeschnittene Runtime-Fenster in den Kosten- und Access-/Encounter-Pfaden zu erzwingen.

Blocker 1: `Chiba Bank Account`, `Liberated Savings Account` und `Swiss Bank Account` verlangen laut lokalem Kartentext Aktivierung "whenever you pay any cost or penalty". Der Vertrag `docs/releases/proteus/hidden-runner-resources-contract-2026-05-17.md` beschreibt dafür ein noch fehlendes Cost-/Penalty-Support-Fenster:

- zuerst wird die ursprüngliche Zahlung angekündigt,
- dann darf nur der zahlende Runner verfügbare verdeckte Bank-Resources side-sicher revealen und trashen,
- die Credit-Gain-Auflösung muss vor der finalen Revalidierung der ursprünglichen Zahlung passieren,
- rekursive oder unbegrenzte Support-Ketten brauchen eine eindeutige Engine-Grenze.

Die in 4a umgesetzte Grundlage liefert Reveal-and-trash-Metadaten für Event-Modification- und aktivierte CardImplementation-Kostenpfade, aber noch kein generisches Cost-/Penalty-Interventionsfenster, das in alle Runner-Zahlungen eingehängt und anschließend die ursprüngliche Zahlung erneut validiert. Eine Promotion der drei Bankkarten als normale Runner-Main-Aktionen wäre regeltechnisch falsch.

Blocker 2: Der Zielkartenzuschnitt dieser Activity mischt unterschiedliche Timingfamilien:

- `Airport Locker` ist laut Text ein Encounter-Fenster mit Stack-Suche und Programm-Installation: "[5], [T]: Search your stack for a program, and install that program, if you can. You may use this ability during an encounter with a piece of ice." Das gehört nicht zur Bank-/Cost-Penalty-Familie und braucht ein Hidden-Resource-Encounter-Search-Install-Fenster.
- `Time to Collect` verhindert laut Text das Trashen anderer installierter Resources während des Corp-Turns. Der Vertrag markiert dieses Prevention-Fenster selbst als späteren eigenen Vertragsschnitt; im Detailplan ist eine passendere Hidden-Prevention-Familie in 4d vorgesehen.

Entblockung:

- Zuerst ein generisches Hidden-Resource-Cost-/Penalty-Support-Fenster schneiden und testen.
- `Airport Locker` in einen Encounter/Search-Install-Slice verschieben oder einen eigenen 4b-Folge-Slice dafür anlegen.
- `Time to Collect` aus 4b herausnehmen und mit der Prevention-Familie aus 4d oder einem eigenen Trash-Prevention-Slice umsetzen.
- Danach 4b erneut claimen und nur die fachlich homogenen Bankkarten mit eigenen CardImplementation-Dateien promoten.
