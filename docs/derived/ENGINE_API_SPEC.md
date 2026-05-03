# Engine API Spec MVP 0.1

Status: Phase 1 freeze candidate  
Stand: 2026-05-03

## Prinzip

Die Engine ist eine reine TypeScript-Library ohne React-, Netzwerk-, Datenbank-, Dateisystem- oder KI-Abhängigkeit. Externe Schichten behandeln sie als Regelautorität und reichen nur PlayerActions ein.

## Öffentliche Funktionen

| ID | Signatur | Ergebnis | Anforderungen |
|---|---|---|---|
| API-001 | `createGame(config: CreateGameConfig): GameState` | Erzeugt deterministischen initialen GameState. | REQ-001, REQ-002, REQ-003 |
| API-002 | `getLegalActions(state: GameState, side: Side): LegalAction[]` | Liefert aktuelle legale Aktionen für eine Seite. | REQ-007, REQ-008 |
| API-003 | `applyAction(state: GameState, action: PlayerAction): EngineResult` | Validiert und verarbeitet genau eine PlayerAction. | REQ-010, REQ-011, REQ-033 |
| API-004 | `getPlayerView(state: GameState, side: Side): PlayerView` | Liefert side-gefilterte Sicht. | REQ-035, REQ-036 |
| API-005 | `validateGameState(state: GameState): ValidationResult` | Prüft Invarianten. | REQ-004, REQ-005, REQ-033 |
| API-006 | `checkWinConditions(state: GameState): Winner | null` | Prüft Agenda-Siegbedingungen. | REQ-032 |
| API-007 | `replayEvents(initialState: GameState, eventLog: GameEvent[]): ReplayResult` | Reproduziert Spielzustand und StateHashes. | REQ-039 |
| API-008 | `hashState(state: GameState): StateHash` | Erzeugt kanonischen Hash ohne transiente UI-Daten. | REQ-033, REQ-039 |

## CreateGameConfig

```ts
type CreateGameConfig = {
  matchId: string
  seed: string
  baseline: RulesBaseline
  runnerDeckId: "demo_runner_001"
  corpDeckId: "demo_corp_001"
  agendaPointsToWin: 6
  controllers: {
    runner: PlayerController
    corp: PlayerController
  }
}
```

MVP-Annahme: `agendaPointsToWin` ist für Demo-Partien auf `6` gesetzt, weil das Corp-Demo-Deck drei Agendas zu je 2 Punkten enthält. Das ist in `DEV-010` dokumentiert.

## LegalAction

```ts
type LegalAction = {
  actionId: string
  side: Side
  type: ActionType
  label: string
  source: CardInstanceRef | "basic_action" | "game_rule"
  timingPoint: TimingPointId
  costs: Cost[]
  targetRequirements: TargetRequirement[]
  choices?: ChoiceSchema
  visibility: "public" | "private_to_actor"
  expiresAtStateVersion: number
}
```

Pflichten:

- `actionId` ist nur innerhalb der aktuellen StateVersion stabil.
- `expiresAtStateVersion` muss der aktuellen `stateVersion` entsprechen.
- LegalActions dürfen keine privaten gegnerischen Targets offenlegen.
- Eine vorher angebotene LegalAction berechtigt nicht zur späteren Ausführung.

## PlayerAction

```ts
type PlayerAction = {
  matchId: string
  side: Side
  actionId: string
  clientKnownStateVersion: number
  selectedTargets?: Record<string, string>
  selectedChoices?: Record<string, unknown>
  idempotencyKey?: string
}
```

Validierung in `applyAction`:

1. `matchId` passt zum State.
2. `side` ist aktive oder choice-berechtigte Seite.
3. `clientKnownStateVersion` entspricht `state.stateVersion`.
4. `actionId` ist in frisch berechneten LegalActions enthalten.
5. TimingPoint, Kosten, Targets und Choices passen.
6. Kosten sind bezahlbar und werden atomar gezahlt.
7. Nach Transition bestehen Invarianten.

## EngineResult

```ts
type EngineResult =
  | {
      ok: true
      state: GameState
      event: GameEvent
      publicEvents: PublicGameEvent[]
      stateHash: StateHash
    }
  | {
      ok: false
      error: EngineError
      state: GameState
    }
```

`EngineError.message` ist UI-tauglich und side-sicher. Debug-Details dürfen nur interne Codes enthalten, keine verdeckten Kartenidentitäten.

## ActionType MVP 0.1

| ActionType | Seite | Kurzbeschreibung | Requirement |
|---|---|---|---|
| `gain_credit` | beide | 1 Click: 1 Credit nehmen. | REQ-015 |
| `draw_card` | beide | 1 Click: 1 Karte ziehen. Corp-Pflichtdraw wird durch Turn-Flow abgewickelt. | REQ-013, REQ-015 |
| `install_card` | beide | Runner installiert Programm; Corp installiert ICE, Agenda oder Asset. | REQ-016, REQ-017 |
| `play_event` | runner | Runner spielt Demo-Event. | REQ-018 |
| `play_operation` | corp | Corp spielt Demo-Operation. | REQ-018 |
| `advance_card` | corp | Corp legt Advancement auf advancebare Remote-Agenda. | REQ-031 |
| `score_agenda` | corp | Corp scored installierte Agenda mit genug Advancements. | REQ-031 |
| `start_run` | runner | Runner startet Run auf gewählten Server. | REQ-019 |
| `rez_ice` | corp | Corp rezzt aktuell approached ICE. | REQ-021 |
| `decline_rez` | corp | Corp lässt aktuell approached ICE unrezzed. | REQ-021 |
| `pump_breaker` | runner | Runner pumpt passende Icebreaker-Stärke. | REQ-022 |
| `break_subroutine` | runner | Runner bricht passende Subroutine. | REQ-022 |
| `continue_run` | runner | Runner geht nach offenem Run-Schritt weiter. | REQ-020 |
| `trash_accessed_card` | runner | Runner trasht zugegriffenes Asset gegen Trash Cost. | REQ-028 |
| `decline_trash` | runner | Runner trasht zugegriffenes Asset nicht. | REQ-028 |
| `end_turn` | beide | Aktive Seite beendet Zug. | REQ-015 |

## Fehlercodes

| Code | Bedeutung | Leak-Regel |
|---|---|---|
| `ERR_STALE_STATE` | ClientKnownStateVersion ist veraltet. | Darf aktuelle StateVersion nennen, aber keine privaten Daten. |
| `ERR_WRONG_SIDE` | Falsche Seite für Action. | Keine Details über private gegnerische Choices. |
| `ERR_UNKNOWN_ACTION` | ActionId ist nicht aktuell legal. | Keine LegalAction-Liste der Gegenseite anhängen. |
| `ERR_INVALID_TARGET` | Target passt nicht. | Target nur als opaque Ref oder generische Zone benennen. |
| `ERR_CANNOT_PAY_COST` | Credits/Clicks reichen nicht. | Eigene Kosten ok, fremde verdeckte Karten nie. |
| `ERR_INVALID_CHOICE` | Choice passt nicht zum Schema. | Keine verborgenen Alternativen nennen. |
| `ERR_INVARIANT_FAILED` | State-Validierung schlägt fehl. | Nur interner Code und StateVersion öffentlich. |

