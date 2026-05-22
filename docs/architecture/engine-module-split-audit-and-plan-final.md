# Finaler Engine Module Split Audit und Plan

Stand: 2026-05-22
Auftrag: ARCH-1-final, Post-CardImplementation Architektur-Audit und Modul-Split-Plan
Scope: keine Produktionscodeänderung, keine Refactorings, keine Kartenmigrationen, keine Tests, keine PublicPayload-/PlayerView-/PublicEvent-Vertragsänderung, keine UI-Änderung

## 1. Kurzfazit

Die Aufteilung lohnt sich fachlich, aber nur als weiterer inkrementeller Schnitt entlang bereits begonnener Game-Grenzen. `packages/engine/src/index.ts` ist nicht mehr reine Spiel-Engine im ursprünglichen Sinn, aber auch noch keine Fassade. Es ist aktuell eine gemischte Engine-Host-Datei: öffentliche API, Action-Dispatcher, große LegalAction-Erzeuger, Run-/Access-/Damage-/Choice-/Trace-Orchestrierung, Host-Primitives für die AbilityEngine und viele State-Mutationshelfer leben weiterhin zusammen.

Die CardImplementation-Phase ist abgeschlossen: 373 ONR-v1-Karten haben registrierte CardImplementation-Dateien, Tycho Extension ist als `no_engine_behavior_required` dokumentiert, und `index.ts`, `public-context.ts` sowie `ability-engine/` sind frei von direkten `onr_v1_`-Resten. Die verbliebenen ONR-v1-IDs liegen bewusst in `compatibility/`, `mechanics/` und inzwischen auch in `game/view/card-view.ts`.

Der Modulsplit sollte fortgesetzt werden, aber nicht als Dateiverschiebung. Die nächsten risikoarmen Schritte sind: Turn/MainActions, RunFlow, AccessFlow, Payment/Revalidation-Reste, Damage, Trace-Orchestrierung, PublicContext-Internals und zuletzt Match. `public-context.ts` ist read-only und ID-frei, aber ein 1.600-Zeilen-Monolith. Die AbilityEngine-Systematik ist grundsätzlich sauber; ihre größte technische Schuld ist der weiterhin sehr breite Host-Vertrag aus `index.ts`.

## 2. Kritische Bewertung: lohnt sich die Aufteilung?

Ja. Der Nutzen ist real, weil die aktuelle Struktur konkrete Reibung erzeugt:

- bessere Orientierung: `index.ts` enthält weiterhin Turn, Run, Access, Payment, Damage, Trace, Choices, PublicEvent-Building und Host-Primitives;
- kleinere Dateien: `index.ts` hat 32.030 LOC, `index.test.ts` 49.652 LOC, `public-context.ts` 1.660 LOC;
- bessere Codex-Prompts: fachliche Prompts können künftig auf `game/run`, `game/access`, `game/payment` oder `game/view` zielen statt auf eine 32k-LOC-Datei;
- schnellere gezielte Reviews: Flow-Änderungen werden nicht mehr mit unrelated Helper-Flächen vermischt;
- bessere Testbarkeit: Game-Fassade und erste Game-Module existieren bereits und können ohne Web/Match getestet werden;
- weniger Risiko durch lokale Änderungen: kleine Module reduzieren Konflikte in `index.ts`;
- klarere Grenze zwischen Game und Match: Server/Match darf User- und Session-Fragen lösen, aber keine Kartentextlogik;
- bessere Replay-/Simulation-/AI-Fähigkeit: deterministische Game-Transitions werden als API-Kante sichtbarer;
- Hidden-Info-Redaktion wird besser prüfbar, wenn `view`/`public-context` read-only bleibt;
- Payment/Revalidation wird besser absicherbar, wenn Quote, Anzeige und Zahlung gemeinsam geschnitten werden.

Der Nutzen kippt in Dateiverschiebung, wenn neue Module nur breite Dependency-Objekte bekommen und weiterhin beliebig State mutieren. Gegenmittel ist pro Schritt ein enger Modulvertrag: klare Entry Points, keine Importzyklen, keine PublicPayload-Feldänderung, keine zweite LegalAction-Quelle neben `applyAction`-Revalidation.

## 3. Ist-Zustand mit Messwerten

Ausgangspunkt:

| Prüfung | Befund |
| --- | --- |
| Worktree zu Beginn | sauber |
| Aktueller Branch | `codex/card-implementation-next-task` |
| Aktueller HEAD | `b8f6d887 Merge branch 'main' into codex/card-implementation-next-task` |
| P3.71 vorhanden | `4f72a106f934b87116af78b5910fc41abb0b0f51` |
| P3.70 vorhanden | `983f3c4c109372a4f5b42ad1c5b653556350841f` |
| P3.69 vorhanden | `1d6215bb34f95ab3bd574d7ed189a8a032717b87` |
| `AGENTS.local.md` | nicht vorhanden |

Gelesene Dokumente:

| Dokument | Befund |
| --- | --- |
| `card-implementation-phase-completion-p3-70.md` | vorhanden |
| `pending-choice-replay-marker-stability-p3-71.md` | vorhanden |
| `card-implementation-runtime-compatibility-p3-69.md` | vorhanden |
| `card-implementation-payload-replay-compatibility-p3-68.md` | vorhanden |
| `card-implementation-index-id-cleanup-p3-67.md` | vorhanden |
| `card-implementation-coverage-universe-reconciliation-p3-63.md` | vorhanden |
| `engine-module-split-audit-and-plan.md` | vorhanden, aber vor finalem CardImplementation-Endstand und mit alten Coverage-Zahlen |
| `trace-payment-boundary-audit-and-plan.md` | zusätzlich relevant, aktueller ARCH-8-Kontext |

LOC:

| Datei | LOC |
| --- | ---: |
| `packages/engine/src/index.ts` | 32.030 |
| `packages/engine/src/public-context.ts` | 1.660 |
| `packages/engine/src/index.test.ts` | 49.652 |
| `packages/engine/src/compatibility/runtime-compatibility.ts` | 59 |
| `packages/engine/src/compatibility/payload-compatibility.ts` | 71 |

Größte `ability-engine`-Dateien:

| Datei | LOC |
| --- | ---: |
| `card-implementation-runtime.ts` | 2.125 |
| `definition-types.ts` | 1.679 |
| `effect-interpreter.ts` | 1.591 |
| `card-implementation-effect-adapters.ts` | 353 |
| `active-modifiers.ts` | 311 |
| `card-implementation-modifiers.ts` | 290 |
| `effective-values.ts` | 248 |
| `steal-cost-modifiers.ts` | 239 |
| `printed-subroutine-implementations.ts` | 233 |
| `additional-subroutine-modifiers.ts` | 149 |
| `card-implementation-ability-limits.ts` | 138 |
| `trace-implementations.ts` | 131 |

Größte neue oder vorhandene `game`-Dateien:

| Datei | LOC | `onr_v1_` |
| --- | ---: | ---: |
| `game/view/card-view.ts` | 805 | 14 |
| `game/payment/trace-payment.ts` | 697 | 0 |
| `game/validation.ts` | 529 | 0 |
| `game/payment/corp-rez-cost.ts` | 487 | 0 |
| `game/create-game.ts` | 474 | 0 |
| `game/trace/base-link.ts` | 220 | 0 |
| `game/view/player-view-projection.ts` | 212 | 0 |
| `game/view/choice-view.ts` | 150 | 0 |
| `game/trace/trace-state.ts` | 133 | 0 |

Top 30 größte Funktionen in `index.ts`:

| Rang | Funktion | Zeilen | Bereich | Primäre Zielrichtung |
| ---: | --- | ---: | --- | --- |
| 1 | `performAction` | 1.401 | 7504-8904 | `game/apply-action`, Dispatcher plus Flow-Delegation |
| 2 | `runnerMainActions` | 1.041 | 3432-4472 | `game/turn`, `game/legal-actions` |
| 3 | `corpMainActions` | 851 | 2393-3243 | `game/turn`, `game/legal-actions` |
| 4 | `resolvePendingChoice` | 436 | 22214-22649 | vorerst Host-Primitive, später `game/choices` |
| 5 | `continueRun` | 432 | 11628-12059 | `game/run` |
| 6 | `installCard` | 367 | 10089-10455 | `game/turn/install`, `game/payment` |
| 7 | `resolveEventModificationChoice` | 272 | 18691-18962 | `game/damage` oder `game/events` |
| 8 | `runnerEncounterActions` | 248 | 6120-6367 | `game/run/encounter` |
| 9 | `executeCardImplementationAccessEffectStep` | 213 | 14400-14612 | `game/access` plus Ability adapter |
| 10 | `scoreAgenda` | 202 | 20919-21120 | `game/access`/`game/agenda` |
| 11 | `runnerAccessActions` | 195 | 7139-7333 | `game/access` |
| 12 | `resolveTraceRunnerBid` | 163 | 28774-28936 | `game/trace` plus `game/payment` |
| 13 | `startRun` | 156 | 10564-10719 | `game/run` |
| 14 | `resolveAssetAccessEffect` | 152 | 14882-15033 | `game/access`, legacy fallback |
| 15 | `collectRuntimeDamagePreventionCandidates` | 144 | 18004-18147 | `game/damage` |
| 16 | `specialZoneHarnessActions` | 137 | 5476-5612 | vorerst Host-Primitive, später `game/zones` |
| 17 | `resolveSuccessfulRunInterventionChoice` | 133 | 26788-26920 | `game/run`/`game/access` |
| 18 | `startRun` | 129 | 426-554 | lokales Helper-/Callback-Vorkommen, bei Run-Schnitt prüfen |
| 19 | `applyV181SuccessfulRunCounterTriggers` | 124 | 16073-16196 | `game/run`, `game/access` |
| 20 | `completeTraceAfterPostBidLink` | 123 | 29084-29206 | `game/trace` |
| 21 | `rezCard` | 122 | 11111-11232 | `game/run`/`game/payment` |
| 22 | `movePastCurrentIce` | 120 | 12710-12829 | `game/run` |
| 23 | `successfulRunProgramActions` | 119 | 7019-7137 | `game/run` |
| 24 | `resolveUpgradeAccessEffect` | 115 | 14766-14880 | `game/access` |
| 25 | `applyCorpStartOfTurnEffects` | 109 | 16866-16974 | `game/turn` |
| 26 | `resolveCardImplementationLookTopStackTakeMatchingChoice` | 108 | 24154-24261 | `game/choices`/`game/access` |
| 27 | `collectReplacementCandidates` | 100 | 18463-18562 | `game/damage`/`game/events` |
| 28 | `accessCurrentCard` | 98 | 13998-14095 | `game/access` |
| 29 | `startTraceFromSubroutine` | 97 | 12360-12456 | `game/trace` |
| 30 | `advancementDistributionOptions` | 97 | 20443-20539 | `game/agenda`/`game/turn` |

Funktionsgrößen in `index.ts`:

| Schwelle | Anzahl Funktionen |
| --- | ---: |
| mehr als 100 Zeilen | 26 |
| mehr als 250 Zeilen | 7 |
| mehr als 500 Zeilen | 3 |
| Funktionseinträge gesamt nach AST-Zählung | 1.595 |

Top-Funktionen in `public-context.ts`:

| Funktion | Zeilen | Bereich |
| --- | ---: | --- |
| `publicContextForAction` | 1.600 | 55-1654 |

`public-context.ts` enthält nach einfacher Messung 27 `legalAction.type`-Checks, 739 `legalAction.payload`-Referenzen, 434 `context.*`-Zuweisungen und 21 Whitelist-Schleifen. Das ist read-only, aber strukturell ein Monolith.

Direkte `onr_v1_`-Treffer:

| Bereich | Treffer | Unique | Einordnung |
| --- | ---: | ---: | --- |
| `packages/engine/src/index.ts` | 0 | 0 | P3.69/P3.70-Ziel erreicht |
| `packages/engine/src/public-context.ts` | 0 | 0 | ID-frei |
| `packages/engine/src/ability-engine/` | 0 | 0 | generische Runtime bleibt ID-frei |
| `packages/engine/src/mechanics/` | 101 | 99 | bewusst verbliebene Mechanik-Kataloge |
| `packages/engine/src/compatibility/` | 42 | 42 | bewusst gekapselte Compatibility-Konstanten |
| `packages/engine/src/game/` | 14 | 14 | neue View-Reste in `game/view/card-view.ts` |

Weitere Marker in `index.ts`:

| Marker | Treffer |
| --- | ---: |
| `v19` | 483 |
| `p3_` | 149 |
| `publicPayload` | 88 |
| `trace` | 351 |
| `access` | 303 |
| `damage` | 278 |
| `run` | 2.785 |

Host-Flächen:

| Objekt | Befund |
| --- | --- |
| `cardImplementationRuntimeDeps` | 66 Properties, 647 LOC Objektliteral; wichtigste technische Schuld |
| `cardImplementationEffectAdapters` | 16 Properties; sinnvoll gekapselt, aber immer noch Host-breit |
| `publicContextDeps` | 8 Properties, gut begrenzte read-only Injection |
| `effectiveAgendaDifficultyDeps` | 3 Properties, guter kleiner Schnitt |

Teststruktur:

| Messwert | Ergebnis |
| --- | ---: |
| `index.test.ts` LOC | 49.652 |
| Tests (`it`/`test`) | 639 |
| `describe`-Blöcke | 84 |
| `game/index.test.ts` LOC | 168 |

## 4. CardImplementation-Endstand und Compatibility-Reste

Der P3.70/P3.71-Endstand ist fachlich abgeschlossen:

| Status | Anzahl |
| --- | ---: |
| `implemented` | 373 |
| `no_engine_behavior_required` | 1 |
| `pending_implementation` | 0 |
| `partial_implementation` | 0 |
| `legacy_engine_special_case` | 0 |
| `outside_current_release_scope` | 55 |

CardImplementation-Dateien:

| Bereich | Anzahl |
| --- | ---: |
| `packages/engine/src/card-implementations/onr-v1/**/*.ts` | 373 |
| Registry-Einträge nach P3.70 | 373 |
| Tycho Extension | bewusst keine Runtime-Datei, `no_engine_behavior_required` |

Compatibility-Reste sind keine offenen Kartenimplementierungen. Sie sichern Replay, PendingChoices, RNG-Purpose, PublicPayload-Felder, ActionID-Bestandteile und alte Runtime-Attribution. Die 42 `onr_v1_`-Treffer in `compatibility/` und die `v19xx`-/`p3_`-Marker dürfen erst nach eigenem Replay-/Payload-/Web-Migrationsgate umbenannt oder entfernt werden.

Wichtig: Durch spätere Game-View-Extraktionen liegen jetzt 14 direkte ONR-v1-IDs in `game/view/card-view.ts`. Sie sind keine `index.ts`-Reste, aber für das Zielbild "Game/View möglichst ID-frei außer Compatibility/Registry/CardImplementation" relevant und sollten in einem späteren View-/Mechanik-Schnitt gekapselt werden.

## 5. Zielbild Game / Match / Index / AbilityEngine / PublicView

Bewertung des vorgeschlagenen Zielbilds: sinnvoll, aber im aktuellen Worktree schon teilweise begonnen. `game/` existiert bereits mit Fassade, Setup, Validation, View, Payment und Trace-Untermodulen. Noch nicht sauber geschnitten sind Turn, Run, Access, Damage, Choices, Zones und die großen Mutationsprimitives.

Empfohlenes Zielbild:

```text
packages/engine/src/index.ts
  öffentliche Engine-Fassade
  Exports und Compatibility-Wiring
  minimale Adapter für alte Importpfade
  keine konkrete Spiellogik
  keine konkreten Karten-Sonderfälle
  kein großer Action-/Run-/Damage-/Trace-Monolith

packages/engine/src/game/
  createGame
  applyGameAction
  legalActionsFor
  playerViewFor
  validateGameState
  hash/replay Adapter
  deterministische Spielregelmaschine

packages/engine/src/game/turn/
  Corp-/Runner-Turnflow
  StartTurn, EndTurn, ActionBudget
  action debt / forgo actions
  start-/end-of-turn cleanup

packages/engine/src/game/run/
  StartRun, ApproachIce, EncounterIce, PassIce, JackOut, RunEnd
  SuccessfulRun, run modifiers, encounter windows

packages/engine/src/game/access/
  AccessFlow, AccessQueue/Breach
  Steal, Trash, Reveal
  Access replacements
  hidden-info-safe access payloads

packages/engine/src/game/payment/
  CostQuote
  Payment execution
  restricted hosted credits
  temporary credits
  stale revalidation

packages/engine/src/game/damage/
  Damage
  Prevention/Avoid
  Flatline replacement
  damage redaction inputs

packages/engine/src/game/trace/
  Trace flow
  Corp/Runner bids
  Base link
  Link pumps
  Trace result

packages/engine/src/game/view/
  PlayerView
  PublicEvent redaction
  PublicPayload projection
  PublicContext nach Action-Familien

packages/engine/src/match/
  erst nach stabiler Game-Grenze
  seats, user mapping, reconnect, command log, snapshots, status, spectators
  keine Kartentextlogik

packages/engine/src/ability-engine/
  CardImplementation runtime
  effect adapters
  modifier queries
  printed subroutines
  icebreaker abilities
  effective values
  keine direkten index.ts-Imports
  konkrete IDs nur in Registry/Coverage/CardImplementation/Tests oder bewusstem Compatibility-Modul
```

Zu grob am Zielbild:

- `game/` darf kein neuer Sammelmonolith werden. Turn, Run, Access, Payment, Damage, Trace, View, Choices, Zones und Random brauchen klare Untergrenzen.
- `Match` sollte nicht zu früh in `packages/engine/src/match` wandern. Server-Persistenz, HTTP/WebSocket, Tokens und SQLite bleiben servernah.
- `payment` muss immer Payment plus Revalidation plus Quote bedeuten, nicht nur `spendCredits`.
- `view` muss PublicPayload und PlayerView getrennt halten, aber beide zentral hidden-info-sicher testen.

Was fehlt:

- `game/choices` für PendingChoice-Erzeugung und Resolution, später;
- `game/zones` für Card Movement, SpecialZones, Hosted Cleanup, Ownership/Control;
- `game/random` für Seed, RandomCounter und RandomDrawRecords;
- `game/agenda` oder klare Turn/Access-Zuordnung für Score-/Overadvance-/Agenda-Difficulty-Pfade;
- ein explizites Importzyklus-Gate für jeden neuen Schnitt.

Bereits gut passend:

- `game/create-game.ts`: echte Setup-/CreateGame-Extraktion, keine Run-/Access-/Payment-Logik;
- `game/validation.ts`: read-only Invariant-Prüfung, guter Schnitt;
- `game/payment/*`: CostQuote-/Rez-/TracePayment-Helfer ohne `index.ts`-Import;
- `game/trace/trace-state.ts` und `base-link.ts`: enger Trace-Teilschnitt;
- `game/view/player-view-projection.ts` und `public-event-view.ts`: read-only View-Projection;
- `ability-engine/definition-types.ts`, `card-implementation-runtime.ts`, `effect-interpreter.ts`: fachlich klare Systematik.

Ausgelagerte Monolithstücke:

- `game/view/card-view.ts`: 805 LOC, 14 direkte ONR-v1-IDs, viele sichtbarkeits- und effective-value-nahe Entscheidungen;
- `public-context.ts`: read-only, aber 1.600 LOC in einer Funktion;
- `mechanics/*`: klein, aber oft ID-Kataloge statt eigenständige Regelmodule;
- `cardImplementationRuntimeDeps` in `index.ts`: breiter Host-Monolith, obwohl die AbilityEngine selbst sauber bleibt.

## 6. Match-vs-Game-Grenze

Game verantwortet:

- Regellogik;
- `LegalActions`;
- `applyGameAction`/`applyAction` mit Revalidation von Seite, `actionId`, `stateVersion`, Timingpunkt, Kosten, Zielen und Choices;
- Turn/Run/Access/Damage/Trace/Payment;
- `GameState`-Transition;
- PublicEvents aus Spielereignissen;
- `PlayerView`;
- Replay, deterministische RNG und StateHash.

Match verantwortet:

- Spielerplätze;
- User-to-side mapping;
- Reconnect;
- Command log und ActionReceipt;
- Snapshots, Undo-Snapshots und Cursor;
- Match status, Lobby, Forfeit, Lifecycle;
- Spectators;
- Authorization: darf dieser User diese Aktion für diese Seite senden?
- Persistenz- und Session-Rahmen.

Match soll nicht verantworten:

- ob eine Kartenaktion legal ist;
- ob der Runner eine Subroutine brechen darf;
- ob ein Access-Replacement greift;
- ob Hidden Info gezeigt wird;
- ob Damage verhindert wird;
- ob Kosten oder Choices noch valide sind.

Interface-Ziele:

```ts
createGame(config)
legalActionsFor(state, side)
applyGameAction(state, action)
playerViewFor(state, side)

createMatch(config)
submitMatchAction(match, userId, action)
reconnectToMatch(match, userId)
matchViewFor(match, userId)
```

Aktueller Befund: `apps/server/src/multiplayer.ts` ist faktisch Match-Orchestrierung und nutzt `createGame`, `applyAction`, `getLegalActions`, `getPlayerView`, `hashState` und `replayEvents`. Diese Schicht sollte langfristig gegen die Game-Fassade sprechen. Persistenz, Tokens, HTTP/WebSocket und SQLite sollten nicht in die Engine wandern.

## 7. Editor-/Options-Grenze

Card Editor, Deck Builder und Options bleiben außerhalb laufender Game-Regellogik:

- Editor/Deck Builder arbeiten mit `CardDefinition`, Decklisten, Validierung, Katalogdaten und Implementation-Status.
- Sie enthalten keine laufende Regelentscheidung darüber, ob eine konkrete `PlayerAction` jetzt legal ist.
- `RulesetConfig` und `MatchConfig` sind Eingaben für Setup/Matchstart, keine frei mutierenden GameState-Pfade.
- Katalogdaten und Runtime-Regeln bleiben getrennt.
- Implementation-Status ist Katalog-/Planungsinformation, nicht Runtime-Autorität.

Aktueller Befund:

- `packages/shared/src/index.ts` bleibt die große Typ- und CardDefinition-Fläche mit 10.182 LOC.
- `packages/shared/src/api-contracts.ts` trennt API-/Match-Payloads von Engine-Funktionen.
- `apps/web/app/page.tsx` ist mit 13.652 LOC sehr groß, konsumiert aber `PlayerView`, `LegalActions`, `PublicGameEvent`, Deck- und Matchstartdaten statt selbst Regelautorität zu sein.
- `apps/web/app/api/game/route.ts` und `apps/web/app/tutorial.ts` importieren noch die öffentliche Engine-Fassade. Das ist akzeptabel, sollte langfristig über Game-Facade-Namen möglich bleiben.

## 8. Zuständigkeitsklassifikation großer `index.ts`-Funktionsgruppen

| Funktionsgruppe | Aktuelle Rolle | Zielmodul | Warum | Risiken beim Verschieben | Reihenfolge |
| --- | --- | --- | --- | --- | --- |
| `performAction` | zentraler Action-Dispatcher und Mutator | `game/apply-action` | größte Funktion, Revalidation/Execution-Knoten | Revalidation von Execution trennen | nach Turn/Run/Access-Entry-Points schrittweise ausdünnen |
| `corpMainActions`, `runnerMainActions` | Main LegalAction-Erzeugung | `game/turn`, `game/legal-actions` | Turn/ActionBudget/Install/Play-Aktionen gehören zusammen | Payment-Quotes und Kartenfenster driften | nächster großer Schnitt |
| `installCard`, install costs, memory checks | Install-Mutation und Payment | `game/turn/install`, `game/payment`, später `game/zones` | Installation ist Turn-Aktion plus Movement/Cost | Hosted/temporary/restricted Credits verlieren Kontext | nach MainActions, vor Run/Access-Payment-Resten |
| `startRun`, `continueRun`, `movePastCurrentIce`, `runnerMovementActions` | Run-Orchestrierung | `game/run` | zusammenhängender Flow | Access und Trace-Folgefenster falsch gekoppelt | nach Turn |
| `runnerEncounterActions`, breaker pump/break helpers | Encounter LegalActions | `game/run/encounter`, `game/payment` | ICEbreaker, Subroutinen und Kosten hängen eng zusammen | Payment/Revalidation für Breaker splitten | mit RunFlow |
| `runnerAccessActions`, `accessCurrentCard`, `declineCurrentAccess` | Access/Breach | `game/access` | eigene hidden-info-sensitive Phase | Reveal/Redaction-Leaks | nach RunFlow |
| Access-Effektresolver | Legacy/CardImplementation Access-Folgen | `game/access` plus Ability adapter | Access-Ambush und Replacements bündeln | PublicPayload-Felder ändern | nach Access-Entry-Point |
| `scoreAgenda`, Agenda-Difficulty/Overadvance | Score/Agenda | `game/access` oder `game/agenda` | Score kann aus Access oder Korp-Turn entstehen | Agenda-Punkte/PublicPayload driftet | nach Access, eigener kleiner Schnitt |
| `creditCostForAction`, hosted/restricted/temporary credit helpers | Payment/Revalidation | `game/payment` | Quote und Execution müssen zusammenbleiben | doppelte Source of Truth | als Querschnitt nach Turn/Run/Access-Entry-Points |
| Damage, prevention, event modification | Damage/Replacement | `game/damage` | eigene Mechanikfamilie | Choice-Flow fragmentiert | nach Access/Payment |
| Trace-Flow | Trace-Orchestrierung | `game/trace` | Payment/BaseLink-State existieren teilweise schon | Trace-PendingChoice/PublicPayload brechen | nach Trace-Payment-Teilschnitten fortsetzen |
| `resolvePendingChoice` | Choice-Dispatcher über alle Familien | später `game/choices` | Querschnitt über Damage/Trace/Access/HiddenZone | zu frühe Extraktion erzeugt Monster-Modul | spät, nach Fachflows |
| `getPlayerView`, event redaction, public labels | View/Redaction | `game/view` | bereits teilweise extrahiert | Hidden-Info-Leaks | nach Flow-Stabilisierung weiter splitten |
| `publicContextForAction` | PublicPayload-Projektion | `game/view/public-context/*` | read-only, aber monolithisch | Vertragsfeldänderung | nach View-Familieninventar |
| `validateGameState` | Invariant-Prüfung | `game/validation` | bereits extrahiert | gering | done, nur pflegen |
| `createGame`/Setup | Setup | `game/create-game` | bereits extrahiert | gering | done |
| Random/StateHash/Replay | Determinismus | `game/random`, `game/replay` | Replay/AI braucht klare Kante | RNG-Purpose-Strings brechen | nach Game-Fassade stabil halten |
| SpecialZones/Ownership/Control | Zone-Mutation | `game/zones` | Querschnittsprimitives | State-Mutation verteilt sich | spät, nach Access/Damage |
| Ability Host Deps | Host-Primitives | vorerst in `index.ts`, später pro Modul | schützt AbilityEngine vor `index.ts`-Import | Dependency-Objekt bleibt zu breit | inkrementell reduzieren |

## 9. PublicContext-Bewertung

`public-context.ts` ist richtig als read-only Redaction-/Projection-Schicht geschnitten: Es importiert nicht aus `index.ts`, mutiert keinen State und enthält keine direkten ONR-v1-IDs. Die Dependency-Injection mit 8 Properties ist gut begrenzt.

Trotzdem ist es strukturell ein neuer Monolith:

- eine Funktion mit 1.600 Zeilen;
- 739 Payload-Referenzen;
- viele Legacy-Ability-Felder, `v19xx`-/`p3_`-Marker und Whitelist-Blöcke;
- Action-Familien sind nur durch Reihenfolge im Code getrennt.

Es enthält überwiegend keine Logik, die nach Run/Access/Payment mutieren sollte. Es enthält aber fachliche Payload-Gruppierung für Run, Access, Trace, Payment, Damage, HiddenZone und CardImplementation-Effekte. Diese Gruppierung sollte künftig intern nach Familien aufgeteilt werden, ohne Feldnamen oder Redaction-Verhalten zu ändern.

Empfehlung:

- nicht löschen und nicht neu modellieren;
- unter `game/view/public-context/` oder intern in derselben Datei nach Familien splitten;
- jede Familie read-only halten;
- Legacy-Feldforwarding klar als Compatibility markieren;
- keine direkte ID-Einführung;
- Hidden-Info-Tests und Web-ActionBoard-/Chronik-Tests als Gate nutzen.

## 10. AbilityEngine-Systematik-Bewertung

Die AbilityEngine-Systematik ist sauberer als `index.ts`:

- `definition-types.ts` beschreibt deklarative Vokabeln und enthält keine konkreten Karten-IDs;
- `card-implementation-runtime.ts` orchestriert generische Ausführung und importiert nicht aus `index.ts`;
- `effect-interpreter.ts` interpretiert generische Effekte über Host-Callbacks;
- Modifier-Dateien sind fachlich kleiner geschnitten;
- `printed-subroutine-implementations.ts`, `trace-implementations.ts`, `icebreaker-abilities.ts` sind nachvollziehbare Spezialauswertungen;
- `compatibility/*` kapselt historische Marker statt sie in generischer Runtime zu verstecken.

Mischrollen:

- `card-implementation-runtime.ts` ist mit 2.125 LOC groß und besitzt viele Abzweige für Lebenszyklen, Ability-Ausführung, Payload-Merging und Revalidation. Das ist noch akzeptabel, sollte aber nicht weiter Host-Logik aufnehmen.
- `definition-types.ts` ist mit 1.679 LOC sehr breit, aber als DSL-Typvokabular erwartbar.
- `cardImplementationRuntimeDeps` ist nicht AbilityEngine-intern, sondern `index.ts`-Host-Schuld. 66 Properties sind zu breit und machen die Runtime indirekt von fast allem abhängig.

Import-/ID-Befund:

- keine `ability-engine`-Datei importiert aus `index.ts`;
- keine direkten `onr_v1_`-Treffer in `ability-engine/`;
- konkrete Karten-IDs liegen erwartbar in CardImplementation-Dateien, Registry/Coverage, Compatibility und Mechanik-Katalogen.

Empfehlung:

- AbilityEngine nicht neu schneiden, solange `index.ts`-Host-Flächen größer sind;
- Host-Deps pro fachlichem Modul reduzieren;
- keine generische Trigger Registry erzwingen;
- CardImplementation-Dateien bleiben der richtige Ort für konkrete Kartendeklaration.

## 11. Teststruktur-Bewertung

`index.test.ts` ist zu groß. 49.652 LOC, 84 `describe`-Blöcke und 639 Tests sind als historische Gate-Historie wertvoll, aber für gezielte Reviews und Modulgrenzen schwer nutzbar.

Sinnvoll auszulagernde Testfamilien:

- Compatibility-/Replay-Marker: `compatibility/*.test.ts`;
- CardImplementation-Coverage-/Registry-Invarianten: `card-implementations/*.test.ts`;
- Game-Fassade und CreateGame/Validation/Hash: `game/*.test.ts`;
- Turn/MainActions/Install/ActionBudget: `game/turn/*.test.ts`;
- Run/Encounter/JackOut/SuccessfulRun: `game/run/*.test.ts`;
- Access/Breach/Steal/Trash/Reveal: `game/access/*.test.ts`;
- Payment/CostQuote/Restricted credits/Stale revalidation: `game/payment/*.test.ts`;
- Damage/Prevention/Flatline/Event modification: `game/damage/*.test.ts`;
- Trace/BaseLink/Bids/PostBidLink/Trace result: `game/trace/*.test.ts`;
- View/PublicContext/HiddenInfo/PlayerView/PublicEvents: `game/view/*.test.ts`;
- CardImplementation-Runtime-Regressions: `ability-engine/*.test.ts` oder `card-implementations/*.test.ts`.

Reihenfolge: Tests nicht zuerst massenhaft verschieben. Erst nach einem Modulschnitt die passenden Tests in dieselbe Familie überführen. Marker-/Coverage-Tests können früher heraus, weil sie schon weitgehend isoliert sind.

## 12. Risiken und Gegenmaßnahmen

| Risiko | Bewertung | Gegenmaßnahme |
| --- | --- | --- |
| Aus `index.ts` wird nur ein verteilter Monolith | hoch | pro Modul enge Entry Points, keine Sammel-`deps`, keine `helpers.ts`-Ablage |
| Importzyklen | hoch | neue Module importieren Typen/kleine Module, nie `index.ts`; Zykluscheck je ARCH-Schritt |
| Zu breite Dependency-Objekte | hoch | `cardImplementationRuntimeDeps` nicht kopieren, pro Flow kleine Dependency-Schnittstellen |
| State-Mutation verteilt sich unkontrolliert | hoch | Mutationsmodule klar benennen, View/PublicContext read-only halten |
| Hidden-Info-Leaks durch falsche View-Schicht | hoch | View-Split spät und testgeführt, keine Feld-/Redaction-Änderung nebenbei |
| Payment/Revalidation wird getrennt | hoch | Quote, PublicPayload-Kosten und Zahlung im selben Modul halten |
| Replay-/PendingChoice-Verträge brechen | hoch | `v19xx`, `p3_`, RNG-Purpose und Choice-Source-Werte nicht umbenennen |
| `public-context.ts` wird neuer Monolith | mittel | intern nach Action-Familien splitten, aber Vertrag stabil halten |
| Tests werden schwerer auffindbar | mittel | neue Teststruktur nach Mechanikfamilien, alte Blöcke nur graduell verschieben |
| Match wird zu früh extrahiert | mittel | Match erst nach stabiler Game-Fassade und Flow-Schnitten |
| Game/View bekommt neue direkte Karten-IDs | mittel | `game/view/card-view.ts`-IDs inventarisieren und in Compatibility/Mechanik/Ability-Queries überführen |
| Mechanikdateien bleiben ID-Kataloge | mittel | nur dann weiter schneiden, wenn sie echte Queries/Capabilities bilden |

## 13. Schrittplan ARCH-2 bis ARCH-n

Der alte ARCH-1-Plan ist teilweise bereits umgesetzt. Deshalb ist der Plan als Zielsequenz mit aktuellem Status zu lesen.

### ARCH-2: Game-Fassade festigen

Status: weitgehend umgesetzt durch `game/index.ts`, `create-game.ts`, `apply-game-action.ts`, `legal-actions.ts`, `player-view.ts`, `hash.ts`, `replay.ts`.

Warum: stabile Kante für Server, AI, Tests und spätere Fachmodule.

Dateien: `packages/engine/src/game/*`, `packages/engine/src/index.ts`.

Akzeptanzkriterien: Public API bleibt kompatibel; `index.ts` delegiert; keine PublicPayload-/PlayerView-/PublicEvent-Änderung.

Nicht anfassen: Kartenmigrationen, Match/Server-Persistenz.

### ARCH-3: Replay/Validation/Hash final hinter Game-Fassade

Status: teilweise umgesetzt; `game/validation.ts`, `game/hash.ts`, `game/replay.ts` existieren.

Warum: Invarianten und Determinismus sind Querschnittsgates für jeden weiteren Split.

Dateien: `game/validation.ts`, `game/hash.ts`, `game/replay.ts`, `index.ts`.

Risiken: StateHash- oder Replay-Semantik driftet.

Tests: Engine-Typecheck, Replay/StateHash-Tests, Validation-Tests.

Nicht anfassen: RNG-Purpose-Werte, Replay-PlayerAction-Struktur.

### ARCH-4: Teststruktur entlasten

Status: offen, aber risikoarm für Marker-/Coverage-Gruppen.

Warum jetzt: P3.71-Marker und Coverage-/Registry-Invarianten sind isoliert genug und müssen nicht auf Flow-Splits warten.

Dateien: neue `compatibility/*.test.ts`, `card-implementations/*.test.ts`, optional `game/index.test.ts`; `index.test.ts` nur durch reine Test-Moves.

Risiken: Testfilter laufen nicht mehr vollständig; historische Gate-Kontexte werden schwerer sichtbar.

Tests: voller Engine-Test oder mindestens betroffene Testdateien plus Typecheck.

Akzeptanzkriterien: keine Assertion-Inhalte ändern; `index.test.ts` sinkt messbar; Marker-/Coverage-Tests sind auffindbar.

Nicht anfassen: Produktionscode, PublicPayload, Registry/Coverage-Inhalte.

### ARCH-5: TurnFlow extrahieren

Status: offen.

Warum: `corpMainActions` und `runnerMainActions` sind mit 851 und 1.041 Zeilen die größten LegalAction-Erzeuger nach `performAction`.

Dateien: `index.ts`, neue `game/turn/*`, eventuell `game/legal-actions/*`.

Risiken: Install-/Payment-/ActionDebt-Logik driftet; Kartenfenster werden im Turn-Modul versteckt.

Tests: MainAction-, Install-, EndTurn-, StartTurn-, ActionDebt-, HiddenInfo-Regressionen.

Akzeptanzkriterien: MainActions liegen nicht mehr monolithisch in `index.ts`; Verhalten unverändert; keine neuen Karten-IDs in generischen Turn-Modulen.

Nicht anfassen: Run/Access/Damage/Trace nebenbei.

### ARCH-6: RunFlow extrahieren

Status: offen.

Warum: Run ist fachlich zusammenhängend und bereitet Access sauber vor.

Dateien: `index.ts`, neue `game/run/*`, bestehende `game/trace/*` nur über klare Schnittstellen.

Risiken: Encounter-Payment, temporary credits, trace windows und successful-run hooks laufen auseinander.

Tests: Run, Jack-out, Encounter, Break/Pump, ETR, successful run, StateHash.

Akzeptanzkriterien: Run-State-Mutation liegt im Run-Modul; `index.ts` delegiert; PublicPayload unverändert.

Nicht anfassen: Access-Queue nicht gleichzeitig neu modellieren.

### ARCH-7: AccessFlow extrahieren

Status: offen.

Warum: Access/Breach ist hidden-info-sensibel und sollte nach Run geschnitten werden.

Dateien: `index.ts`, neue `game/access/*`, eventuell read-only View-Helfer nur bei Bedarf.

Risiken: Access-Reveal-Leaks, Steal-/Trash-Revalidation driftet, Multiaccess/Replacements brechen.

Tests: HQ/R&D/Archives, Full Archives Access, Multiaccess, Ambush, steal/trash costs, HiddenInfo.

Akzeptanzkriterien: Access mutiert nur über `game/access`; Redaction und PublicPayload gleich.

Nicht anfassen: keine Feldumbenennung, kein neues Access-Regelmodell.

### ARCH-8: Payment/Revalidation konsolidieren

Status: teilweise umgesetzt durch `game/payment/cost-quote.ts`, `corp-rez-cost.ts`, `trace-payment.ts`.

Warum: Payment ist Querschnitt und muss LegalAction-Anzeige, Quote und Execution koppeln.

Dateien: `game/payment/*`, `index.ts`.

Risiken: doppelte Kostenquelle, restricted hosted credits verlieren Kontext.

Tests: Rez, Install, Trash, Steal, Breaker, Trace-Bid, stale action rejection.

Akzeptanzkriterien: Quote und Zahlung nutzen dieselben Helper; PublicPayload-Kosten bleiben stabil.

Nicht anfassen: keine neue Kosten-DSL, keine PublicPayload-Migration.

### ARCH-9: Damage extrahieren

Status: offen.

Warum: Damage/Prevention/Flatline ist fachlich klar und hidden-info-sensibel.

Dateien: `index.ts`, neue `game/damage/*`.

Risiken: EventModification-/Replacement-Choices fragmentieren; Flatline-Redaction bricht.

Tests: V1.9.13, MVP 0.94, V1.1.1, damage hidden-info barriers.

Akzeptanzkriterien: Damage entry points sind klar; Prevention und Flatline bleiben revalidiert.

Nicht anfassen: globale Choice-Engine nicht gleichzeitig extrahieren.

### ARCH-10: Trace-Orchestrierung extrahieren

Status: teilweise vorbereitet durch `game/trace/trace-state.ts`, `base-link.ts` und `game/payment/trace-payment.ts`.

Warum: Trace-Payment ist bereits geschnitten; als nächstes kann Flow-Orchestrierung folgen.

Dateien: `index.ts`, `game/trace/*`, `game/payment/trace-payment.ts`.

Risiken: PendingChoice-Quellen, post-bid hidden-info barrier, TraceResult und Return-Kontext brechen.

Tests: MVP 0.96, V1.9.14, trace link post-bid, Krumz/Paris/Hell's Run/Pocket-VR.

Akzeptanzkriterien: Trace-Flow hat klare Entry Points; Payment bleibt im Payment-Modul; Markerwerte unverändert.

Nicht anfassen: `TraceState`-Typ nicht ohne API-/Replay-Plan verschieben.

### ARCH-11: PublicContext splitten

Status: offen; View-Projektion ist teilweise umgesetzt.

Warum: `public-context.ts` ist read-only, aber zu groß.

Dateien: `public-context.ts`, `game/view/*`, neue Familienmodule.

Risiken: Hidden-Info-Leaks, Web-Chronik-/ActionBoard-Feldbruch.

Tests: View/Visibility, chronicle, action-board, reconnect, undo, replay.

Akzeptanzkriterien: PublicContext mutiert nicht; keine Feldumbenennung; direkte ID-Freiheit bleibt.

Nicht anfassen: UI-Änderungen, PublicPayload-Vertragsmigration.

### ARCH-12: Choices/Zones/Random schneiden

Status: offen und bewusst spät.

Warum: Choices, Zones und Random sind Querschnittsprimitives über fast alle Fachflows.

Dateien: `index.ts`, neue `game/choices/*`, `game/zones/*`, `game/random/*`.

Risiken: Choice-Source-/RNG-Purpose-/SpecialZone-Verträge brechen.

Tests: P3.71-Marker, HiddenZone, Replay/StateHash, SpecialZones, Ownership/Control.

Akzeptanzkriterien: keine Markerwertänderung; keine verdeckten Daten in Choice/View/Event.

Nicht anfassen: keine breit angelegte Payload-Migration.

### ARCH-13: Match-Modul definieren

Status: warten.

Warum: Match ist erst sinnvoll, wenn Game stabil ist.

Dateien: eventuell `packages/engine/src/match/*`, `apps/server/src/multiplayer.ts` als Konsument.

Risiken: Server-Persistenz wandert in Engine; Match wird Wrapper um `index.ts`.

Tests: Multiplayer, reconnect, spectator, undo, replay.

Akzeptanzkriterien: Match kennt User/Seats/Sessions, aber keine Kartentextlogik.

Nicht anfassen: SQLite/HTTP/WebSocket nicht in Engine-Paket verschieben.

## 14. Akzeptanzkriterien

Messbare Zielkriterien:

- `index.ts` enthält keine konkreten ONR-v1-ID-Reste.
- `index.ts` ist Export-/Wiring-Fassade oder deutlich näher daran; langfristig deutlich unter 5.000 LOC.
- `index.ts` enthält keine großen Run-/Access-/Damage-/Trace-/Payment-Monolithen.
- Game kann ohne Match/Web getestet werden.
- Match kann GameCommand/PlayerAction einreichen und PlayerView/PublicEvents erhalten.
- PublicContext und View-Code mutieren keinen State.
- AbilityEngine importiert nicht aus `index.ts`.
- Keine Importzyklen.
- Hidden-Info-Tests bleiben grün.
- Replay, deterministic RNG und StateHash bleiben stabil.
- Legacy-/Compatibility-Marker sind dokumentiert und pinning-getestet.
- Tests sind nach Mechanikfamilien auffindbar.
- Payment und stale revalidation verwenden gemeinsame Quote-/Validation-Helfer.
- Konkrete Karten-IDs liegen in CardImplementation, Registry/Coverage, Tests oder bewusst dokumentierter Compatibility/Mechanik-Schicht.
- `game/view/card-view.ts`-ID-Reste sind inventarisiert oder gekapselt.

## 15. Empfohlener erster Umsetzungsauftrag

Empfohlener nächster konkreter Prompt:

```text
Arbeite im aktuellen NETGRID-Worktree und auf dem aktuellen Branch.

Dies ist ARCH-4-final-teststruktur.

Ziel:
Entlaste `packages/engine/src/index.test.ts` nur durch reine Teststruktur-Moves.

Scope:
- Keine Produktionscodeänderungen.
- Keine Testassertions inhaltlich ändern.
- Keine Kartenmigrationen.
- Keine PublicPayload-/PlayerView-/PublicEvent-Vertragsänderungen.
- Keine UI-Änderungen.

Umsetzen:
1. Verschiebe die P3.71 PendingChoice-/Replay-/Runtime-Compatibility-Marker-Tests aus `index.test.ts` in eine passende `packages/engine/src/compatibility/*.test.ts`.
2. Verschiebe CardImplementation-Coverage-/Registry-Invarianten, falls klar isolierbar, in `packages/engine/src/card-implementations/*.test.ts`.
3. Lasse historische Flow-/Mechaniktests zunächst in `index.test.ts`.
4. Führe Engine-Typecheck und die betroffenen Engine-Tests aus.

Akzeptanz:
- Keine Assertion-Semantik geändert.
- Marker-/Coverage-Tests sind fachlich auffindbar.
- `index.test.ts` ist kleiner.
- Engine-Typecheck grün.
- Betroffene Tests grün.
```

Wenn zuerst weiter an Produktionsmodulen gearbeitet werden soll, ist stattdessen ARCH-5 TurnFlow der risikoärmste nächste Code-Schnitt. Teststruktur ist aber der sauberere erste Schritt nach P3.71, weil die Marker-Tests bereits isoliert sind und keine Regelbewegung erfordern.
