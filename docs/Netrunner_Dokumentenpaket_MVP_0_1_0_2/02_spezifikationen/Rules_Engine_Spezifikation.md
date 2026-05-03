# Netrunner-Webapplikation – Rules-Engine-Spezifikation für MVP 0.1/0.2

**Status:** verbindliche Arbeitsfassung  
**Stand:** 03.05.2026  
**Geltungsbereich:** MVP 0.1 Engine-Basis und MVP 0.2 Multiplayer-Nutzung  
**Regelreferenz:** Null Signal Games Comprehensive Rules v26.03  
**Primäres Ziel:** kleiner, deterministischer, testbarer und erweiterbarer Regelausschnitt

## 1. Zweck

Dieses Dokument spezifiziert den unterstützten Rules-Engine-Umfang. Es legt fest, welche offiziellen Regelbereiche für den MVP relevant sind, welche bewusst vereinfacht werden, welche Engine-APIs verbindlich sind und wie Actions, Timing, Runs, Access, Karten und Invarianten modelliert werden.

Die Engine soll nicht das vollständige Netrunner-Regelwerk implementieren. Sie soll einen engen, stabilen Kern liefern, auf dem UI, KI, Tests und Human-vs-Human-Multiplayer aufbauen können.

## 2. Referenzbereiche der Comprehensive Rules

Für MVP 0.1/0.2 sind insbesondere folgende Regelbereiche relevant:

| Regelbereich | MVP-Relevanz |
|---|---|
| Game Concepts | Grundbegriffe, Rollen, Integer, Golden Rules. |
| Starting/Ending the Game | Initialisierung und Siegbedingungen. |
| Credits, Clicks, Costs | Grundressourcen und bezahlbare Aktionen. |
| Score, Scoring and Stealing | Agenda-Score und Agenda-Steal. |
| Advancing Cards | Advancement-Token für Simple Agenda. |
| Memory | Runner-Programme und MU-Grenze. |
| Card Visibility / Information | Hidden-Info-Schutz. |
| Game Zones | HQ, R&D, Archives, Grip, Stack, Heap, Score Area, Servers. |
| Turns and Actions | Corp Draw/Action/Discard, Runner Action/Discard. |
| Runs | Initiation, Approach, Encounter, Movement, Success, Run Ends. |
| Accessing and Breaching | HQ/R&D/Archives/Remote Access im reduzierten Umfang. |
| Installing Cards | Runner- und Corp-Installationen. |
| Playing Events and Operations | Simple Economy Event, Simple Run Event, Simple Economy Operation. |
| Timing and Priority | Strukturierte TimingPointIds und Pass-Priority. |
| Paid Abilities | Breaker-Pump und Break-Subroutine. |
| Subroutines | Reihenfolge, Break, Resolve, End the Run. |
| Checkpoints | Validierung nach Transitions. |

Nicht jeder dort beschriebene Sonderfall wird implementiert. Abweichungen und Nicht-Ziele müssen im Abweichungsregister dokumentiert werden.

## 3. MVP-Scope

### 3.1 Enthalten in MVP 0.1

- Spielstart mit festen Demo-Decks.
- Human Runner gegen einfache Corp-KI.
- Grundaktionen: Credit nehmen, Karte ziehen, Karte installieren, Event/Operation spielen, Karte advancen, Run starten, Zug beenden.
- Corp verpflichtender Draw-Schritt.
- Runner- und Corp-Action-Phasen.
- Basale Ressourcen: Credits, Clicks, Memory.
- Installation einfacher Programme, ICE, Assets und Agendas.
- Rez von ICE und Asset.
- Einfache Runs auf zentrale und Remote-Server.
- Encounter mit gerezztem ICE.
- Pump- und Break-Fähigkeiten einfacher Icebreaker.
- Subroutinen: `end the run`, Corp erhält Credit, Runner verliert Credits.
- Breach und Access für HQ, R&D, Archives und Remote in MVP-Form.
- Agenda-Steal und Agenda-Score.
- Siegbedingungen über Agenda Points mit konfigurierbarem Zielwert für Demo-Partien.
- EventLog, Replay, Seed, RandomCounter und StateHash.
- PlayerViews und Visibility-Filter.

### 3.2 Zusätzlich relevant in MVP 0.2

- Zwei menschliche Spieler über Serverautorität.
- Engine muss alle Actions vollständig validieren, da Client nicht vertrauenswürdig ist.
- ChoiceRequests müssen reconnectfähig im State liegen oder deterministisch ableitbar sein.
- PassPriority muss für bestehende Timingpunkte nutzbar sein.
- Hidden-Info-Barrier muss Events markieren, damit Undo sicher bleibt.
- EngineResult muss genug Informationen für seitenspezifische Updates liefern.

### 3.3 Nicht enthalten in MVP 0.1/0.2

- Freier Deckbau.
- Vollständiger Kartenpool.
- Tags als aktive Mechanik, außer als Zukunftsfeld.
- Traces.
- Damage.
- Viren.
- Hosting.
- Prevention, Avoid, Replacement und Interrupts als vollständige Systeme.
- Bypass.
- Forced Encounters.
- Server-Umleitung.
- Multiaccess.
- Zusätzliche Steal-Kosten.
- Komplexe Handgrößen-/Discard-Sonderfälle jenseits einfacher Handlimit-Verarbeitung.
- Vollständige Paid-Ability-Fenster aller offiziellen Timingstrukturen.

## 4. Engine-API

Die Engine stellt wenige öffentliche Funktionen bereit.

```ts
function createGame(config: CreateGameConfig): GameState
function getLegalActions(gameState: GameState, side: Side): LegalAction[]
function applyAction(gameState: GameState, playerAction: PlayerAction): EngineResult
function getPlayerView(gameState: GameState, side: Side): PlayerView
function validateGameState(gameState: GameState): ValidationResult
function checkWinConditions(gameState: GameState): Winner | null
function replayEvents(initialState: GameState, eventLog: GameEvent[]): GameState
function hashState(gameState: GameState): string
```

### 4.1 `createGame`

Erzeugt initialen State mit:

- RulesBaseline,
- Seed,
- randomCounter `0`,
- Demo-Decks,
- initialen Zonen,
- Startressourcen,
- initialem TimingPoint,
- initialem Event oder Systemmarker,
- StateHash.

### 4.2 `getLegalActions`

Berechnet Actions nur aus aktuellem State und Seite. Die Liste ist ein Angebot, keine Garantie. `applyAction` muss jede eingereichte Action erneut validieren.

### 4.3 `applyAction`

Validiert und verarbeitet eine Action. Mindestprüfungen:

- MatchId, falls im Engine-Kontext relevant,
- Seite,
- ActionId,
- StateVersion,
- TimingPoint,
- aktive oder berechtigte Seite,
- Kosten,
- Targets,
- Choices,
- Visibility der Targets,
- Kartenimplementierungsstatus,
- Invarianten nach Transition.

### 4.4 `EngineResult`

```ts
type EngineResult = {
  ok: boolean
  state: GameState
  events: GameEvent[]
  stateVersionBefore: number
  stateVersionAfter: number
  resultingStateHash: string
  validation?: ValidationResult
  error?: EngineError
}
```

Bei Fehlern darf `EngineError` keine privaten Kartendetails enthalten, wenn er an Clients weitergegeben wird. Interne Debugdetails müssen getrennt bleiben.

## 5. Phasenmodell

```ts
type Phase =
  | "corp_turn_start"
  | "corp_draw_phase"
  | "corp_action_phase"
  | "corp_discard_phase"
  | "runner_turn_start"
  | "runner_action_phase"
  | "runner_discard_phase"
```

Mindestverhalten:

- Corp erhält zu Zugbeginn Clicks.
- Corp führt verpflichtenden Draw aus.
- Corp kann in Action Phase legale Aktionen durchführen.
- Runner erhält zu Zugbeginn Clicks.
- Runner hat keine verpflichtende Draw Phase.
- Runner kann in Action Phase legale Aktionen durchführen.
- Zugende setzt Clicks, TimingPoint und aktive Seite korrekt fort.

## 6. TimingPointIds

Die Engine verwendet stabile IDs, auch wenn viele Fenster im MVP leer sind.

```ts
type TimingPointId =
  | "corp_draw_gain_clicks"
  | "corp_draw_paid_window"
  | "corp_draw_mandatory_draw"
  | "corp_action_paid_window"
  | "corp_action_take_action"
  | "runner_action_gain_clicks"
  | "runner_action_paid_window_before_turn_begin"
  | "runner_action_paid_window_before_action"
  | "runner_action_take_action"
  | "run_initiation_begin"
  | "run_initiation_paid_window"
  | "run_approach_ice_paid_window"
  | "run_encounter_ice_paid_window"
  | "run_movement_jack_out_choice"
  | "run_success_breach_server"
  | "breach_choose_candidate"
  | "access_mid_access_window"
  | "access_steal_agenda"
  | "access_trash_or_continue"
  | "run_ends_cleanup"
```

TimingPointIds werden in Events, Tests und Replays verwendet. Sie dürfen nicht ohne Migration geändert werden.

## 7. Actions

### 7.1 Unterstützte ActionTypes

| ActionType | Seite | MVP-Verhalten |
|---|---|---|
| `gain_credit` | beide | 1 Click zahlen, 1 Credit erhalten. |
| `draw_card` | beide | 1 Click zahlen, oberste Karte ziehen; Corp-Pflichtdraw separat. |
| `install_card` | beide | Karte aus Hand/HQ/Grip installieren, Kosten prüfen. |
| `play_operation` | Corp | Operation spielen, Kosten zahlen, Effekt ausführen, nach Archives. |
| `play_event` | Runner | Event spielen, Kosten zahlen, Effekt ausführen, nach Heap. |
| `advance_card` | Corp | 1 Click und 1 Credit zahlen, Advancement-Token auf installierbare Karte. |
| `score_agenda` | Corp | Agenda mit ausreichenden Advancement-Token scoren. |
| `run_server` | Runner | RunState auf Zielserver erstellen. |
| `rez_card` | Corp | ICE/Asset rezzen, Rez-Kosten zahlen, ggf. On-Rez-Effekt. |
| `pump_icebreaker` | Runner | Breaker-Stärke temporär erhöhen. |
| `break_subroutine` | Runner | passende Subroutine eines encountered ICE brechen. |
| `pass_priority` | beide | Aktuelles Fenster passen. |
| `access_card` | Runner | Access-Schritt fortsetzen oder Karte wählen, falls mehrere Kandidaten. |
| `steal_agenda` | Runner | Accessed Agenda stehlen, falls erlaubt. |
| `trash_accessed_card` | Runner | Trash-Kosten zahlen und accessed trashbare Karte trashen. |
| `continue_without_trash` | Runner | Access fortsetzen ohne Trash. |
| `end_turn` | beide | Zug beenden, falls erlaubt. |

### 7.2 Nicht früh implementierte ActionTypes

Strukturell möglich, aber nicht MVP-Pflicht:

- `trash_resource`,
- `remove_tag`,
- `purge_virus_counters`,
- `trigger_ability` als generisches Freiformmodell,
- `prevent_damage`,
- `avoid_tag`,
- `trace_boost`,
- `bypass_ice`.

## 8. Resolver-Pipeline

Mindestpipeline:

1. LegalActions aus GameState, TimingPoint und Seite berechnen.
2. PlayerAction gegen aktuellen State validieren.
3. Kosten prüfen und zahlen.
4. Targets auf Existenz, Zone, Sichtbarkeit und Legalität prüfen.
5. Einzelne Instruction ausführen.
6. Checkpoint ausführen.
7. PendingEffects oder PendingChoices erzeugen.
8. Nächsten TimingPoint bestimmen.
9. Siegbedingungen prüfen.
10. GameState validieren.
11. GameEvent schreiben.
12. StateVersion erhöhen.
13. StateHash erzeugen.
14. PlayerViews nachgelagert neu berechnen.

Die Pipeline darf spätere Systeme wie `cannot`, `if able`, Prevention, Replacement und Interrupts nicht unmöglich machen. Diese Systeme müssen aber nicht vollständig in MVP 0.1/0.2 umgesetzt sein.

## 9. Kosten und Targets

### 9.1 Kosten

```ts
type Cost =
  | { type: "click"; amount: number }
  | { type: "credit"; amount: number }
  | { type: "trash_self" }
  | { type: "forfeit_agenda"; agendaPoints?: number }
```

MVP-Pflicht sind Click- und Credit-Kosten. Weitere Kostentypen bleiben strukturelle Zukunftsfelder.

Regeln:

- Kosten werden vor Effektauflösung bezahlt, sofern der konkrete Effekt keine andere Reihenfolge verlangt.
- Negative Credits oder Clicks sind unzulässig.
- Kostenzahlung erzeugt Event- oder EventPayload-Informationen, soweit öffentlich zulässig.
- Nicht bezahlbare Actions werden nicht als LegalAction angeboten und von `applyAction` abgelehnt.

### 9.2 Targets

```ts
type TargetRequirement = {
  targetKey: string
  targetType: "card" | "server" | "subroutine" | "choice"
  zoneConstraint?: ZoneConstraint
  sideConstraint?: Side
  visibilityConstraint?: "visible_to_actor" | "may_target_hidden_own_card"
  required: boolean
}
```

Targets werden nicht aus Clientangaben akzeptiert, sondern gegen aktuellen State geprüft.

## 10. Run-State-Machine

```ts
type RunState = {
  runId: string
  attackedServerId: string
  originalServerId: string
  timingPoint: TimingPointId
  phase: "initiation" | "approach_ice" | "encounter_ice" | "movement" | "success" | "run_ends"
  position:
    | { kind: "ice"; serverId: string; iceIndex: number }
    | { kind: "server"; serverId: string }
    | null
  approachedIceId?: string
  encounteredIceId?: string
  unbrokenSubroutines: SubroutineRef[]
  passedIceThisPhase?: string
  successfulDeclared: boolean
  unsuccessfulDeclared: boolean
  jackOutAllowed: boolean
  badPublicityFund: number
  temporaryCredits: TemporaryCredit[]
  breach: BreachState | null
  endRunPending: boolean
}
```

### 10.1 MVP-Run-Ablauf

1. Runner wählt `run_server` und Zielserver.
2. Engine erstellt `RunState`.
3. Falls ICE vorhanden ist, nähert sich der Runner dem äußersten noch nicht passierten ICE.
4. Corp erhält bei unrezzed ICE eine Rez-Choice, falls bezahlbar.
5. Wenn ICE gerezzt ist, encountered der Runner das ICE.
6. Runner kann passende Breaker-Fähigkeiten nutzen.
7. Ungebrochene Subroutinen werden in definierter Reihenfolge aufgelöst.
8. Bei `end the run` wird Run-Ende markiert.
9. Wenn Run nicht beendet wurde, passiert der Runner ICE und bewegt sich weiter.
10. Nach letztem ICE wird der Run erfolgreich.
11. Engine startet Breach des Servers.
12. Access wird nach Serverregel durchgeführt.
13. Run endet und temporäre Run-Ressourcen werden bereinigt.

### 10.2 Jack Out

`jack_out` ist strukturell vorzubereiten, aber in MVP nur anzubieten, wenn die Engine den konkreten Zeitpunkt sauber modelliert. Es darf nicht als pauschaler Abbruchbutton existieren.

## 11. ICE, Icebreaker und Subroutinen

### 11.1 ICE-Modell

```ts
type IceDefinition = CardDefinition & {
  type: "ice"
  rezCost: number
  strength: number
  subtypes: ("barrier" | "code_gate" | "sentry" | string)[]
  subroutines: SubroutineDefinition[]
}
```

### 11.2 Subroutine

```ts
type SubroutineDefinition = {
  subroutineId: string
  text: string
  effect: Effect[]
}
```

MVP-Subroutinen:

- `end_run`,
- `corp_gain_credit`,
- `runner_lose_credit`.

### 11.3 Icebreaker-Fähigkeiten

MVP-Breaker haben zwei Fähigkeitstypen:

- `1 Credit: +1 Strength`,
- `1 Credit: Break 1 <Subtype>-Subroutine`.

Regeln:

- Breaker muss installiert und aktiv sein.
- Breaker muss für Subroutine-Typ passend sein.
- Stärke muss mindestens ICE-Stärke erreichen, bevor Subroutine gebrochen werden kann.
- Pump-Effekte gelten nur für aktuellen Encounter, sofern nicht anders angegeben.
- Gebrochene Subroutinen werden im EncounterState markiert.

## 12. Breach und Access

```ts
type BreachState = {
  serverId: string
  accessLimit: number
  candidates: AccessCandidate[]
  accessed: CardInstanceRef[]
  currentAccess: AccessState | null
}
```

```ts
type AccessState = {
  cardRef: CardInstanceRef
  sourceZone: ZoneRef
  cardVisibleToRunner: boolean
  midAccessUsed: boolean
  stealRequired: boolean
  trashOptionAvailable: boolean
}
```

### 12.1 Serverregeln MVP

| Server | Access-Regel |
|---|---|
| HQ | Zufälliger Zugriff auf eine Karte aus HQ; RandomDrawRecord speichern. |
| R&D | Zugriff auf oberste Karte; Reihenfolge bleibt sonst verdeckt. |
| Archives | Faceup sichtbar; facedown werden im Breach nach MVP-Regel aufgedeckt. |
| Remote | Zugriff auf Root-Karten; Agenda stehlen, Assets gegen Trash Cost trashen. |

### 12.2 Agenda-Steal

- Accessed Agenda darf gestohlen werden, wenn keine zusätzliche Steal-Kostenregel existiert.
- Gestohlene Agenda wandert in Runner Score Area.
- Agenda Points werden neu geprüft.
- Event ist öffentlich, da Score Areas öffentlich sind.

### 12.3 Trash accessed card

- Nur Karten mit Trash Cost und erlaubtem Access können getrasht werden.
- Runner muss Trash Cost bezahlen können.
- Karte wandert nach Archives.
- Event ist öffentlich, wenn Karte durch Access sichtbar war.

## 13. Siegbedingungen

Mindestbedingungen:

- Runner gewinnt bei Agenda Points >= Zielwert.
- Corp gewinnt bei Agenda Points >= Zielwert.
- Optional spätere Bedingungen bleiben unimplementiert, sofern Demo-Karten sie nicht benötigen.

Für Demo-Decks kann `agendaPointTarget` konfigurierbar sein, weil drei Simple Agendas mit je 2 Punkten nur 6 Punkte ergeben. Der Zielwert muss im MatchSettings/EventLog stehen.

## 14. Demo-Karten als Engine-Pflichtumfang

### 14.1 Runner

| Karte | Pflichtmechanik |
|---|---|
| Runner Identity | Spielstart ohne aktive Fähigkeit. |
| Simple Economy Event | Event spielen, 0 Kosten, +4 Credits, Heap. |
| Simple Run Event | Event spielen, Run auf gewählten Server, bei Erfolg +2 Credits. |
| Simple Fracter | Installieren, 1 MU, Pump, Barrier-Subroutine brechen. |
| Simple Decoder | Installieren, 1 MU, Pump, Code-Gate-Subroutine brechen. |
| Simple Killer | Installieren, 1 MU, Pump, Sentry-Subroutine brechen. |

### 14.2 Corp

| Karte | Pflichtmechanik |
|---|---|
| Corp Identity | Spielstart ohne aktive Fähigkeit. |
| Simple Agenda | Installieren, advancen, scoren, stehlen. |
| Simple Economy Operation | Operation spielen, 0 Kosten, +4 Credits, Archives. |
| Simple Economy Asset | Verdeckt installieren, rezzen für 1, On-Rez +3 Credits, Trash Cost 3. |
| Simple Barrier ICE | Rez 3, Strength 3, `End the run`. |
| Simple Code Gate ICE | Rez 2, Strength 2, `Corp gains 1 credit`, `End the run`. |
| Simple Sentry ICE | Rez 4, Strength 3, `Runner loses 2 credits if able`, `End the run`. |

## 15. Invarianten

Nach jeder Engine-Transition prüft `validateGameState()` mindestens:

- Jede CardInstance existiert genau einmal.
- Jede Zone enthält nur gültige CardInstanceRefs.
- Jede Karte liegt in genau einer Zone oder ist eindeutig gehostet.
- Credits, Clicks, Tags, Bad Publicity, Memory und Counter sind im erlaubten Bereich.
- Runner-Programme überschreiten Memory-Limit nicht, außer eine Pflichtbereinigung ist offen.
- ICE-Reihenfolge ist eindeutig.
- Remote-Server ohne Root und ohne ICE werden entfernt, sofern kein Effekt etwas anderes verlangt.
- PendingChoices haben genau eine berechtigte Seite.
- PendingChoices leaken keine privaten Optionsdaten.
- LegalActions haben bezahlbare Kosten und gültige Targets.
- Events referenzieren gültige StateVersion-Übergänge.
- StateHash ist reproduzierbar.
- Winner ist konsistent mit Agenda Points.

## 16. Zufall

```ts
type RandomState = {
  seed: string
  counter: number
}
```

Zufällige Entscheidungen:

- Deck-Shuffle,
- HQ-Access,
- spätere zufällige Karteneffekte.

Jede Zufallsentscheidung erzeugt `RandomDrawRecord`. Für Replay muss der gleiche Initialzustand mit den gleichen RandomRecords den gleichen State erzeugen.

## 17. PlayerViews

Die Engine stellt `getPlayerView(gameState, side)` bereit. Der Server darf zusätzlich filtern, aber nicht weniger streng.

Regeln:

- RunnerView sieht keine Corp-HQ-Karten, R&D-Reihenfolge oder unrezzed Kartentitel.
- CorpView sieht keine Runner-Grip-Karten oder Stack-Reihenfolge.
- Access-Ausnahmen sind zeitlich eng an `AccessState` gebunden.
- LegalActions werden seitenspezifisch berechnet.
- Private ChoiceOptions gehen nur an die berechtigte Seite.

## 18. Abweichungsregister

Jede bewusste Regelvereinfachung wird dokumentiert:

```ts
type RuleDeviation = {
  deviationId: string
  title: string
  officialRuleArea: string
  mvpBehavior: string
  reason: string
  risk: "low" | "medium" | "high"
  requiredTests: string[]
  removalCondition?: string
}
```

Pflichtabweichungen für MVP:

| Abweichung | Grund |
|---|---|
| Reduzierter Kartenpool | Scope und Testbarkeit. |
| Konfigurierbarer Agenda-Zielwert | Demo-Deck hat begrenzte Agenda Points. |
| Kein vollständiges Priority-System | Nur für vorhandene Timingpunkte nötig. |
| Keine komplexen Prevention/Replacement/Interrupts | Nicht durch Demo-Karten benötigt. |
| Keine Tags/Trace/Damage/Viren | Nicht im Demo-Kartenpool. |

## 19. Engine-Testpflichten

Jede Engine-Änderung benötigt Tests für:

- LegalActions vs. `applyAction`,
- Kostenprüfung,
- Targetvalidierung,
- StateVersion-Verhalten,
- EventLog und StateHash,
- PlayerView-Filter,
- Run-State-Machine,
- Access und Steal,
- Scoring,
- Demo-Karten,
- Replay,
- Invarianten.

Neue Karten benötigen zusätzlich Karten-Unit-Test, Szenariotest und Visibility-Test.

## 20. Engine-Abnahmekriterien

Die Engine gilt als MVP-0.1/0.2-tauglich, wenn:

- eine vollständige Demo-Partie deterministisch spielbar ist,
- alle Demo-Karten korrekt funktionieren,
- Runner- und Corp-Sieg über Agendas möglich sind,
- Run, Encounter, Break, Subroutine, Breach und Access funktionieren,
- die Engine keine UI-/Netzwerk-/Storage-Abhängigkeit hat,
- `getLegalActions` und `applyAction` konsistent sind,
- Replay den finalen StateHash reproduziert,
- PlayerViews keine Hidden-Info-Leaks enthalten,
- EngineResult genug Daten für Multiplayer-Serverupdates liefert.
