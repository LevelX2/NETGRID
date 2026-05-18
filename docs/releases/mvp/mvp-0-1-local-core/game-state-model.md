# Game State Model MVP 0.1

Status: Phase 1 freeze candidate  
Stand: 2026-05-03

## Kernmodell

```ts
type GameState = {
  matchId: string
  baseline: RulesBaseline
  stateVersion: number
  seed: string
  randomCounter: number
  randomDrawRecords: RandomDrawRecord[]
  activeSide: Side
  phase: Phase
  timingPoint: TimingPointId
  turn: TurnState
  corp: CorpState
  runner: RunnerState
  cardInstances: Record<CardInstanceId, CardInstance>
  run?: RunState
  pendingChoice?: ChoiceRequest
  eventLog: GameEvent[]
  winner: Winner | null
  agendaPointsToWin: number
}
```

## Baseline

```ts
type RulesBaseline = {
  rulesVersion: "26.03"
  cardTextSource: "manual"
  cardTextSnapshotId: "mvp-0.1-demo"
  engineSchemaVersion: "0.1.0"
  cardImplementationVersion: "0.1.0"
  deviationRegistryVersion: "0.1.0"
}
```

## Seitenzustand

```ts
type CorpState = {
  identity: CardInstanceRef
  credits: number
  clicks: number
  badPublicity: number
  hq: CardInstanceRef[]
  rd: CardInstanceRef[]
  archives: CardInstanceRef[]
  scoreArea: CardInstanceRef[]
  servers: CorpServer[]
}

type RunnerState = {
  identity: CardInstanceRef
  credits: number
  clicks: number
  tags: number
  memoryUsed: number
  memoryLimit: number
  grip: CardInstanceRef[]
  stack: CardInstanceRef[]
  heap: CardInstanceRef[]
  scoreArea: CardInstanceRef[]
  rig: RunnerRig
}
```

## Server

```ts
type CorpServer = {
  id: ServerId
  kind: "hq" | "rd" | "archives" | "remote"
  label: string
  ice: CardInstanceRef[] // innermost first / installation order
  root: CardInstanceRef[]
}
```

MVP 0.1 braucht zentrale Server `hq`, `rd`, `archives` und dynamische Remotes. Leere Remotes ohne ICE und ohne Root werden nach einer Transition entfernt, wenn kein Run auf ihnen läuft.

## CardInstance

```ts
type CardInstance = {
  instanceId: CardInstanceId
  definitionId: CardDefinitionId
  owner: Side
  controller: Side
  zone: ZoneRef
  faceup: boolean
  rezzed: boolean
  exhausted: boolean
  advancementCounters: number
  strengthModifier: number
  brokenSubroutines: number[]
}
```

`definitionId` verweist auf `data/cards/demo-cards.json`. CardDefinition-Daten werden nicht in jeder Zone dupliziert.

## Zonen

| Zone | Besitzer | Sichtbarkeit Runner | Sichtbarkeit Corp | MVP-Regel |
|---|---|---|---|---|
| `corp:hq` | Corp | Anzahl; Titel nur bei konkretem Access | Titel sichtbar | Keine vollständige Offenlegung an Runner. |
| `corp:rd` | Corp | Anzahl; oberste Karte nur bei Access | Titel/Reihenfolge sichtbar | R&D-Top ist verdeckt bis Access. |
| `corp:archives` | Corp | Offene Archives-Karten sichtbar, facedown nur beim relevanten Access | Sichtbar | MVP darf Archives einfach halten. |
| `corp:scoreArea` | Corp | Sichtbar | Sichtbar | Gescorete Agendas öffentlich. |
| `corp:server:*:ice` | Corp | Unrezzed nur als verdeckte Karte; rezzed sichtbar | Sichtbar | ICE-Reihenfolge ist innermost first / Installationsreihenfolge; der Runner encountered von außen nach innen, also vom letzten ICE-Index rückwärts. |
| `corp:server:*:root` | Corp | Unrezzed nur als verdeckte Karte bis Access/Rez | Sichtbar | Agendas bleiben unrezzed/facedown bis Score oder Access. |
| `runner:grip` | Runner | Titel sichtbar | Anzahl | Corp sieht keine Grip-Titel. |
| `runner:stack` | Runner | Anzahl; Reihenfolge engine-intern | Anzahl | Keine Stack-Titel in CorpView. |
| `runner:heap` | Runner | Sichtbar | Sichtbar | Trash/Events offen. |
| `runner:scoreArea` | Runner | Sichtbar | Sichtbar | Gestohlene Agendas öffentlich. |
| `runner:rig` | Runner | Sichtbar | Sichtbar | Installierte Programme offen. |

## PlayerView

```ts
type PlayerView = {
  side: Side
  stateVersion: number
  timingPoint: TimingPointId
  activeSide: Side
  phase: Phase
  own: VisibleSideState
  opponent: OpponentPublicState
  servers: VisibleServer[]
  run?: VisibleRunState
  pendingChoice?: VisibleChoiceRequest
  publicEvents: PublicGameEvent[]
  legalActions: LegalAction[]
  winner: Winner | null
}
```

PlayerViews enthalten keine Full-State-Struktur und keine privaten Gegnerzonen. Opaque CardInstanceRefs dürfen nur verwendet werden, wenn die referenzierte Karte der Sichtregel entsprechend sichtbar ist oder als verdeckte Karte ohne Titel dargestellt wird.

## Invarianten

| ID | Invariante | Requirement | Test |
|---|---|---|---|
| INV-001 | Jede CardInstance ist genau einmal platziert. | REQ-004 | T-STATE-001 |
| INV-002 | ZoneRefs stimmen mit den Zone-Arrays der Seiten überein. | REQ-004 | T-STATE-001 |
| INV-003 | Credits, Clicks, Memory, Tags und Counter sind nicht negativ. | REQ-005 | T-STATE-003 |
| INV-004 | Runner memoryUsed überschreitet memoryLimit in MVP 0.1 nie nach abgeschlossener Transition. | REQ-016 | T-CARD-RUN-003 |
| INV-005 | ICE-Reihenfolge ist eindeutig; RunPosition referenziert existierendes ICE oder Server. | REQ-020 | T-RUN-002 |
| INV-006 | PendingChoice gehört genau einer Seite und ist side-sicher serialisierbar. | REQ-012 | T-VIS-004 |
| INV-007 | LegalActions sind für aktuelle StateVersion, TimingPoint und Seite gültig. | REQ-007 | T-ACTION-001 |
| INV-008 | Jedes Event referenziert StateVersionBefore, StateVersionAfter und StateHashAfter. | REQ-033 | T-EVENT-001 |
