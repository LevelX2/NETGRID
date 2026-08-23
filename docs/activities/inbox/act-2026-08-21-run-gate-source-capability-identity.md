---
activityId: act-2026-08-21-run-gate-source-capability-identity
status: inbox
kind: cleanup
area: shared
priority: low
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-08-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Quellenidentität des Fort-Run-Gates präzisieren

## Ziel

Den missverständlichen öffentlichen Vertrag bereinigen, in dem
`sourceAbilityId` derzeit einen rohen Capability-Key statt einer kanonischen
Ability-ID enthält.

## Kontext und Quellen

- Regel-Engine-Review Batch 2 vom 2026-08-21, Finding F-04.
- `packages/engine/src/game/run/server-run-start-restrictions.ts`
- Der aktuelle Vertrag verwendet unter anderem `fort_activity_gate` als Wert,
  obwohl der Feldname eine kanonische Ability-ID erwarten lässt.
- Aktivierungsauslöser: nächster fachlicher Ausbau von Run-Start-Gates oder ein
  Consumer, der die Quellenidentität auswerten muss.

## Scope

- Alle Producer und Consumer von `sourceAbilityId` im Run-Gate-Vertrag erfassen.
- Zwischen präzisem `sourceCapabilityKey` und einer kanonischen ID
  `<cardDefinitionId>:<capabilityKey>` entscheiden.
- Den Vertrag und alle Verbraucher atomar auf genau eine aktuelle Semantik
  umstellen.
- Side-sichere PlayerView-/Payload- und fokussierte Vertragstests ergänzen.

## Nicht im Scope

- Änderung der Roving-Submarine-Regel oder der Fort-Aktivitätsmarker.
- Parsing fachlicher Bedeutung aus dem Kennungsstring.
- Legacy-Alias, Dual-Read oder zweiter Identitätsvertrag ohne aktuellen Nutzen.

## Akzeptanzkriterien

- [ ] Feldname, Typ und tatsächlicher Inhalt beschreiben dieselbe Semantik.
- [ ] Producer und Consumer verwenden genau den strukturierten aktuellen
  Vertrag.
- [ ] PlayerViews, öffentliche Payloads und Logs leaken keine verdeckten
  Karteninformationen.
- [ ] Legalität, Replaydeterminismus, StateHash und bestehende Gate-Wirkung
  bleiben unverändert.
- [ ] Fokussierte Run-Gate- und Vertragschecks sind grün.

## Umsetzungshinweise

- NETGRID V0 benötigt keinen Kompatibilitätsadapter; ein sauberer atomarer
  Cutover ist vorzuziehen.
- Eine kanonische ID darf nur gewählt werden, wenn alle dafür notwendigen
  Bestandteile am Producer side-sicher und eindeutig vorhanden sind.

## Ergebnisnotiz

Noch offen.
