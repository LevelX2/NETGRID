# Timing and Run Model MVP 0.1

Status: Phase 1 freeze candidate  
Stand: 2026-05-03

## Offizielle Referenz

Die Comprehensive Rules v26.03 werden referenziert, aber nicht als Scope-Erweiterung verwendet:

- 5.6 und 11.2: Corp-Zug.
- 5.7 und 11.3: Runner-Zug.
- 6.1 bis 6.9 und 11.4: Run-Struktur.
- 7.1 bis 7.5 und 11.5/11.6: Access und Breach.
- 1.17 und 1.18: Scoring, Stealing, Advancing.
- 8.1: Rezzed/Unrezzed und Faceup/Facedown.

## Phasen

```ts
type Phase =
  | "corp_draw_phase"
  | "corp_action_phase"
  | "runner_action_phase"
  | "run"
  | "game_over"
```

MVP 0.1 hält Discard/Handlimit als Abweichung zurück, weil die Demo-Karten keine Handlimit-Entscheidungen erzwingen.

## TimingPointIds

| TimingPointId | Seite mit Actions | Zweck | Requirement |
|---|---|---|---|
| `corp_draw.mandatory_draw` | engine | Corp-Pflichtdraw am Zugbeginn. | REQ-013 |
| `corp_action.main` | corp | Corp-Click-Actions, Install, Operation, Advance, Score, End Turn. | REQ-013, REQ-015 |
| `runner_action.main` | runner | Runner-Click-Actions, Install, Event, Run, End Turn. | REQ-014, REQ-015 |
| `run.initiation` | runner | Serverwahl und Run-Start. | REQ-019 |
| `run.approach_ice` | corp | Rez/Decline des approached ICE. | REQ-021 |
| `run.encounter_ice` | runner | Pump/Break und Fortsetzen. | REQ-022 |
| `run.resolve_subroutines` | engine | Ungebrochene Subroutinen in Reihenfolge. | REQ-023, REQ-024 |
| `run.movement` | runner | Weiterlaufen; Jack-out ist in MVP 0.1 optional nicht angeboten. | REQ-020 |
| `run.success` | engine | Erfolgreichen Run deklarieren und Breach starten. | REQ-025 |
| `breach.choose_candidate` | runner | Access-Kandidat wählen, soweit Auswahl im MVP nötig ist. | REQ-025 |
| `access.resolve_card` | runner | Agenda stehlen, Asset trashen/liegen lassen. | REQ-028, REQ-030 |
| `run.ends` | engine | Run aufräumen, zurück zur auslösenden Phase. | REQ-020 |
| `game.checkpoint` | engine | Siegbedingungen und Trigger-freier Checkpoint. | REQ-032 |

## Turn Flow

Corp:

1. Engine wechselt zu `corp_draw.mandatory_draw`.
2. Corp erhält 3 Clicks.
3. Corp zieht 1 Karte aus R&D. Wenn R&D leer ist, ist der Runner-Sieg nach `game.checkpoint` möglich.
4. Engine wechselt zu `corp_action.main`.
5. Corp-KI wählt LegalActions bis `end_turn` oder bis keine sinnvolle Action möglich ist.
6. Engine wechselt zu Runner Action Phase.

Runner:

1. Runner erhält 4 Clicks.
2. Engine wechselt zu `runner_action.main`.
3. Runner wählt LegalActions.
4. `end_turn` wechselt zur Corp Draw Phase.

## Run Flow

RunState:

```ts
type RunState = {
  runId: string
  attackedServerId: ServerId
  originalServerId: ServerId
  phase: "initiation" | "approach_ice" | "encounter_ice" | "movement" | "success" | "breach" | "access" | "run_ends"
  position: { kind: "ice"; serverId: ServerId; iceIndex: number } | { kind: "server"; serverId: ServerId } | null
  approachedIceId?: CardInstanceId
  encounteredIceId?: CardInstanceId
  unbrokenSubroutines: SubroutineRef[]
  successful: boolean
  breach?: BreachState
  access?: AccessState
  sourceActionId: string
  pendingSuccessBonus?: "simple_run_event_2_credits"
}
```

Ablauf:

1. Runner startet Run auf einen legalen Server.
2. Engine setzt Position auf äußerstes ICE oder Server.
3. Bei ICE: Corp erhält `rez_ice` oder `decline_rez`.
4. Rezzed ICE führt zu Encounter; unrezzed ICE wird passiert.
5. Runner darf passende Breaker pumpen und Subroutinen brechen.
6. Engine resolved ungebrochene Subroutinen in Reihenfolge.
7. Falls kein `End the run` wirkte, bewegt sich der Runner weiter.
8. Nach letztem ICE wird der Run erfolgreich und der Server gebreacht.
9. Nach Access endet der Run und die Engine kehrt zur Runner Action Phase zurück.
10. Simple Run Event gewährt 2 Credits nur, wenn der dadurch gestartete Run erfolgreich war.

## Access/Breach MVP

| Server | MVP-Verhalten | Visibility-Pflicht |
|---|---|---|
| HQ | 1 zufällige Karte über Seed/RandomCounter. | PublicEvent nennt nur Access-Typ; Titel nur wenn Karte tatsächlich accessed/gestohlen/getrasht sichtbar wird. |
| R&D | Oberste Karte. | Keine weiteren R&D-Titel oder Reihenfolge im RunnerView/PublicEvent. |
| Archives | Alle offenen Archives-Karten; facedown-Verhalten wird vereinfacht dokumentiert. | Keine nicht relevanten verdeckten Daten. |
| Remote | Root-Karten im angegriffenen Remote. | Unrezzed Karten bleiben verdeckt bis Access; Agenda/Asset beim Access sichtbar. |

## Subroutinen MVP

| Subroutine | Effekt | Karten |
|---|---|---|
| `end_the_run` | Setzt Run auf unsuccessful und wechselt zu `run_ends`. | Simple Barrier ICE, Simple Code Gate ICE, Simple Sentry ICE |
| `corp_gain_credit` | Corp erhält 1 Credit. | Simple Code Gate ICE |
| `runner_lose_credits` | Runner verliert bis zu 2 Credits, Minimum 0. | Simple Sentry ICE |

