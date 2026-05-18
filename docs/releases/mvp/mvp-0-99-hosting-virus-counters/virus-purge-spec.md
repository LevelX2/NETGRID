# Virus/Purge 0.99 Specification

Status: Spezifikation für V0.99c
Stand: 2026-05-04

## Regelbasis

- CR 1.9 nennt Virus-Counter als generische Counter.
- CR 5.2.6 enthält die Corp-Basic-Action `click click click: Purge virus counters`.
- CR 10.1.2 entfernt beim Purge alle Virus-Counter, die auf Karten gehostet sind, und gibt sie in den Vorrat zurück.

## V0.99c-Scope

| Mechanik | Umsetzung |
|---|---|
| Virus-Programm | `v099_virus_program` ist ein lokales Runner-Programm mit Virus-Counter-Pilot. |
| Virus-Counter | Beim Installieren erhält die Karte genau 1 Virus-Counter. |
| Purge | Corp-LegalAction `purge_virus_counters` im Corp-Main-Window. |
| Kosten | Genau 3 Corp-Clicks, keine Credits. |
| Effekt | Alle Virus-Counter auf Karten werden entfernt; andere Counter bleiben unverändert. |

## LegalAction/applyAction

- `getLegalActions` bietet Purge nur für die Corp, nur in `corp_action.main`, nur bei mindestens 3 Clicks und mindestens einem Virus-Counter an.
- `applyAction` erzeugt die LegalAction neu und revalidiert dadurch Side, `actionId`, `stateVersion`, Timing, Clickkosten und vorhandene Virus-Counter.
- Falsche Side, stale StateVersion und manuell erfundene Purge-Actions werden abgelehnt.

## Event- und Replay-Vertrag

- Purge ist public.
- PublicEvent darf `purgedVirusCounters` enthalten, aber keine verdeckten Kartentitel.
- Purge erzeugt keine RandomDrawRecords.
- Replay muss denselben StateHash reproduzieren.

## Tests

- V099-T007 Virus Program Counter.
- V099-T008 Purge LegalAction.
- V099-T009 Purge Revalidation.
- V099-T010 Purge Removes Only Virus.
- V099-T011 Purge Replay/StateHash.
- V099-T017 No Scope.
