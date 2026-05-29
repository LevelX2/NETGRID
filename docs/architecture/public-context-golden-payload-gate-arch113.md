# ENGINE-ARCH-113 PublicContext Golden Payload Gate

Stand: 2026-05-28

## Kurzfazit

ARCH-113 ergänzt ein Test-Gate vor dem ersten `public-context.ts`-Code-Split. Es wurde kein Produktionscode geändert und keine PublicPayload-, PublicEvent-, PlayerView-, Replay-, StateHash-, PendingChoice-, ActionID- oder RNG-Semantik migriert.

Neuer Gate-Test:

- `packages/engine/src/game/events/public-context-golden.test.ts`

Der Test pinnt direkte `publicContextForAction`-Ausgaben und einen finalen `buildEventWithHost`-PublicPayload-Fall mit expliziten Keysets. Dadurch können spätere Feldfamilien-Splits erkennen, ob Felder verschwinden, umbenannt, verschachtelt oder privat unsicher erweitert werden.

## Abgedeckte Feldfamilien

| Familie | Golden-Abdeckung |
| --- | --- |
| Base / Action Identity | finaler `buildEventWithHost`-Payload mit `actor`, `actionType`, `label`, Click-Kosten und Turn-Ordinalen |
| Card Source / Target / Definition | `sourceDefinitionId`, `cardDefinitionId`, `targetCardDefinitionId`, `targetIceDefinitionId`, Reveal-Felder |
| Run / Encounter / Ice | `runPhase`, `serverLabel`, Access-Counts, `targetIceDefinitionId` |
| Access / Breach / Steal / Trash | Root-Position, `ambushDefinitionId`, `stealCost`, `publicRevealKind` |
| Trace | `traceId`, `traceStep`, Trace-Basis, Bids, Base-Link und Trace-success-Followup-Felder |
| Damage / Prevention / Replacement / Flatline | Damage-Typ/-Beträge, Prevention, Replacement- und EventModification-Windows |
| Payment / Hosted / Temporary Credits | temporäre Credits, hosted Credits, recurring load und Credit-Endstände |
| HiddenZone / Search / Arrange / NonSearch | `hiddenZoneAction`, `hiddenZoneBarrier`, Search-/Private-Look-/Shown-Felder |
| SpecialZone / SetAside / RemovedFromGame | `specialZone`, Visibility, Reason |
| Choice / PendingChoice | `choiceKind`, `choiceId`, Public-Choice-Visibility, Secret-Spend und Too-Many-Doors-Ausgang |
| CardImplementation / Legacy Ability | `cardImplementationAbility`, `v1917*`, `v1919*`, `v1920*`, `v1921*`, `v1922*`, `resourceAbility`, `agendaAbility` |
| RNG / Random | `randomPurpose`, `randomCounterAfter`, `randomDrawRecordPurpose`, `v1921DieRoll` |

## HiddenInfo- und Private-Feld-Gate

Jeder Golden-Vergleich läuft durch `expectPublicPayloadIsSideSafe(...)`. Der Helper verbietet unter anderem:

- `privatePayload`
- `cardInstances`
- `fullGameState`
- verdeckte Deck-/Hand-/HQ-/R&D-/Stack-Containerkeys
- Session-/Reconnect-/Join-Tokenfelder

Das Gate prüft bewusst keine vollständigen GameStates und keine `privatePayload`-Snapshots.

## Web-/AI-Vertrag

Der Test enthält eine dokumentierte Contract-Feldliste für Felder, die laut STATUS-8 von Chronicle, ActionBoard oder AI DTOs genutzt werden. Es gibt keine Cross-Package-Imports aus Web oder AI in den Engine-Test; stattdessen werden repräsentative Felder im Golden-Set gepinnt:

- `sourceDefinitionId`
- `targetCardDefinitionId`
- `serverLabel`
- `hiddenZoneAction`
- `temporaryCreditsProvided`
- `temporaryCreditsSpent`
- `temporaryCreditsRemaining`
- `damageResolved`
- `damageType`
- `traceId`
- `randomPurpose`

## Weiterhin nicht code-split-ready

ARCH-113 macht spätere kleine Splits sicherer, ersetzt aber kein eigenes Readiness-Gate für hochsensible Familien:

- HiddenZone-Redaction und private Look
- Trace- und Damage-Detailmigration
- SpecialZone-Visibility
- Legacy-`v19xx`-/`p3_`-Feldmigration
- PublicPayload-Typisierung
- Web-/AI-Consumer-Migration

## Nächster sinnvoller Schritt

Der nächste Code-Schnitt kann klein und geschützt sein:

```text
ENGINE-ARCH-114-public-context-base-card-context-boundary
```

Scope dafür: Base-, Action-Identity- und einfache Card-/Target-/Label-Kontexte. Nicht mitschneiden: HiddenZone, Trace, Damage, SpecialZone, Legacy-Felder, PendingChoice, RNG oder PublicPayload-Consumer.
