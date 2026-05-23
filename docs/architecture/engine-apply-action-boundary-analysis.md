# ENGINE-ARCH-1: ApplyAction Game Boundary Analysis

Stand: 2026-05-23

Scope: enger Architektur-Vorbereitungsschnitt für Game-Fassade und ApplyAction-Grenze. Keine Gameplay-Änderung, keine Kartenmigration, keine PublicPayload-/PlayerView-/PublicEvent-Vertragsänderung, keine Marker-/ActionID-/PendingChoice-Änderung und kein Big-Bang-Umzug von `performAction`.

## 1. Ist-Zustand

Der aktuelle Worktree hat bereits eine sichtbare `game/`-Fassade, aber die fachliche ApplyAction-Grenze liegt weiterhin in `packages/engine/src/index.ts`.

| Datei | LOC | Rolle |
| --- | ---: | --- |
| `packages/engine/src/index.ts` | 32.110 | öffentliche API, LegalActions, `applyAction`, `performAction`, Replay, Event-Building und Host-Primitives |
| `packages/engine/src/game/apply-game-action.ts` | 9 | Wrapper von `applyGameAction` auf `applyAction` aus `../index` |
| `packages/engine/src/game/legal-actions.ts` | 9 | Wrapper von `legalActionsFor` auf `getLegalActions` aus `../index` |
| `packages/engine/src/game/player-view.ts` | 10 | Wrapper von `playerViewFor` auf `getPlayerView` aus `../index`; re-exportiert `buildPlayerViewProjection` |
| `packages/engine/src/game/replay.ts` | 9 | Wrapper von `replayGameEvents` auf `replayEvents` aus `../index` |
| `packages/engine/src/game/index.ts` | 27 | Game-Fassade und Re-Export-Kante |
| `packages/engine/src/game/create-game.ts` | 474 | echte Game-Setup-Grenze |
| `packages/engine/src/game/validation.ts` | 529 | echte Validation-Grenze |
| `packages/engine/src/game/hash.ts` | 12 | echte Hash-Grenze |
| `packages/engine/src/game/index.test.ts` | 236 | Fassade- und Helper-Smokes |
| `packages/engine/src/index.test.ts` | 45.696 | großer Engine-Regressionsbestand nach Teststruktur-Splits |

Aktuelle Definitionen:

| Symbol | Aktueller Ort | Befund |
| --- | --- | --- |
| `getLegalActions` | `index.ts:2005` | zentrale LegalAction-Quelle mit Turn-, Run-, Access- und Choice-Routing |
| `legalActionsFor` | `index.ts:2054` und `game/legal-actions.ts` | kompatibler Game-Name, aber weiter Delegation zu `index.ts` |
| `applyAction` | `index.ts:2058` | eigentliche öffentliche Action-Grenze |
| `applyGameAction` | `index.ts:2148` und `game/apply-game-action.ts` | kompatibler Game-Name, aber keine eigene Game-Transition |
| `getPlayerView` | `index.ts:2156` | nutzt bereits `game/view/player-view-projection.ts`, ruft aber LegalActions aus `index.ts` |
| `playerViewFor` | `index.ts:2160` und `game/player-view.ts` | kompatibler Game-Name |
| `replayEvents` | `index.ts:2260` | Replay läuft über `applyAction` und Compatibility-Action-Payloads |
| `replayGameEvents` | `index.ts:2298` und `game/replay.ts` | kompatibler Game-Name |
| `performAction` | `index.ts:7505` | zentrale Mutation, ca. 1.400 LOC, switcht alle Fachaktionen |

Produktive `game/*`-Dateien, die noch aus `../index` importieren:

| Datei | Import | Einordnung |
| --- | --- | --- |
| `game/apply-game-action.ts` | `applyAction` | bewusst dünner Wrapper, bis `performAction` entkoppelt ist |
| `game/legal-actions.ts` | `getLegalActions` | bewusst dünner Wrapper, bis Turn-/Run-/Access-LegalActions geschnitten sind |
| `game/player-view.ts` | `getPlayerView` | bewusst dünner Wrapper, weil `getPlayerView` aktuell LegalActions aus `index.ts` einzieht |
| `game/replay.ts` | `replayEvents` | bewusst dünner Wrapper, weil Replay aktuell über `applyAction` aus `index.ts` laufen muss |

`index.ts` importiert aktuell nicht aus `./game/index`. Das vermeidet einen direkten Zyklus `index.ts -> game/index.ts -> index.ts`. Stattdessen importiert `index.ts` einzelne echte Module direkt, unter anderem `game/create-game`, `game/hash`, `game/validation`, `game/payment/*`, `game/trace/*` und `game/view/*`.

## 2. Warum applyAction/performAction noch nicht sicher verschoben werden kann

Ein vollständiger Move von `applyAction` in eine index-freie `game/apply-action`-Datei wäre derzeit nur möglich, wenn große Teile von `index.ts` mitgezogen oder als breite Host-Dependency-Objekte exportiert würden. Beides wäre in diesem Schritt riskanter als nützlich.

`applyAction` selbst ist relativ kompakt, hängt aber unmittelbar an diesen lokalen `index.ts`-Primitives:

| Dependency | Ort | Rolle | Kann jetzt verschoben werden? | Risiko |
| --- | --- | --- | --- | --- |
| `getLegalActions` | `index.ts:2005` | einzige LegalAction-Quelle und Revalidation | nein | zieht `corpMainActions`, `runnerMainActions`, Run-, Access-, Trace- und Choice-Action-Builder mit |
| `validateChoiceAction` | `index.ts:21868` | PendingChoice-Revalidation | später | PendingChoice-ID- und Hidden-Info-Vertrag darf nicht beiläufig geändert werden |
| `cloneGameStateForAction` | `index.ts:32105` | Action-State-Kopie | ja, aber allein wertarm | ohne `applyAction`-Move keine Boundary-Wirkung |
| `performAction` | `index.ts:7505` | zentrale GameState-Mutation | nein | ca. 1.400 LOC mit allen Fachflows und vielen privaten Helpern |
| `checkWinConditions` | `index.ts:2227` | Game-End-Checkpoint | später | abhängig von Agenda-/Flatline-/Bad-Publicity-Kontext |
| `validateGameState` | `game/validation.ts` | bereits modular | ja | stabiler Import, kein Problem |
| `hashState` | `game/hash.ts` | bereits modular | ja | stabiler Import, kein Problem |
| `buildEvent` | `index.ts:29625` | PublicEvent-/PrivatePayload-Building | nein | PublicPayload, Hidden-Info-Redaktion, Compatibility- und Replay-Felder |
| `toPublicEvent` | `game/view/public-event-view.ts` | bereits modular | ja | stabiler Import, kein Problem |
| `isReplayCompatibilityActionPayload` | `compatibility/runtime-compatibility.ts` | Replay-Vertrag | ja | Werte dürfen nicht geändert werden |

`performAction` ist der harte Blocker. Es ist kein reiner Dispatcher, sondern enthält und triggert:

- Mandatory Draw, Klick-/Credit-Aktionen und Turn-Transitions.
- Aktivierte CardImplementation-Fähigkeiten über `cardImplementationRuntimeDeps`.
- Play-/Install-/Rez-/Trash-/Score-/Steal-Aktionen.
- Run-, Encounter-, Jack-out-, Breach- und Access-Flows.
- Trace-Bidding, Post-Bid-Link und Trace-Ergebnisauflösung.
- Damage-, Prevention-, Replacement- und Flatline-Pfade.
- PendingChoice-Auflösung und zahlreiche Legacy-/Compatibility-Payload-Felder.

Ein Move ohne vorherige Fachflow-Schnitte würde entweder fast die halbe Datei verschieben oder eine zweite große Host-Schnittstelle erzeugen. Das würde die Grenze formal verschieben, aber die Kopplung nicht reduzieren.

## 3. Dependency-Gruppen

| Gruppe | Beispiele | Aktueller Zustand | Bewertung |
| --- | --- | --- | --- |
| A. Public API / Facade | `createGame`, `applyAction`, `getLegalActions`, `getPlayerView`, `replayEvents`, Validation, Hash | `index.ts` exportiert kompatibel; `game/index.ts` bietet Game-Namen | sinnvoll als Übergang, noch keine echte Apply-Grenze |
| B. Core State Mutation | `performAction`, `resolvePendingChoice`, `installCard`, `rezCard`, `continueRun`, `accessCurrentCard`, Damage-/Trace-Resolver | überwiegend in `index.ts` | zu gekoppelt für diesen Schritt |
| C. View / Payload | `getPlayerView`, `buildEvent`, `publicContextForAction`, `toPublicEvent` | View-Projection teils in `game/view`, Event-Building in `index.ts`, PublicContext read-only separat | PublicPayload-Risiko hoch; nicht nebenbei bewegen |
| D. AbilityEngine Host | `cardImplementationRuntimeDeps`, Effect-Adapter, Modifier, Lifecycle Dispatch | AbilityEngine selbst importiert nicht aus `index.ts`; Host-Objekt bleibt breit | Host-Vertrag ist zentrale technische Schuld |
| E. Compatibility | `runtime-compatibility`, `payload-compatibility`, Replay-Action-Payloads | gekapselt, aber von `replayEvents`/Event-Building abhängig | Werte und Marker bleiben Vertragsfläche |
| F. Bereits modular | `game/payment/*`, `game/trace/*`, `game/view/*`, `game/create-game`, `game/validation`, `game/hash` | echte Module ohne `index.ts`-Importe, außer Fassade/Testimports | gute Grundlage für spätere Schnitte |
| G. Noch zu gekoppelt | `corpMainActions`, `runnerMainActions`, Run/Access/Damage/Trace-Orchestrierung, PendingChoice-Auflösung, `buildEvent` | private Helper-Netz in `index.ts` | zuerst fachlich schneiden, dann `applyAction` bewegen |

## 4. Minimaler sicherer nächster Produktionsschnitt

Der nächste Produktionsschnitt sollte nicht `applyAction` selbst verschieben. Die sichere Reihenfolge ist:

1. `game/turn/legal-actions` vorbereiten: `corpMainActions` und `runnerMainActions` fachlich kleiner machen, aber noch mit klarer Revalidation über `getLegalActions`.
2. Danach Run-LegalActions und Run-Transitionen schneiden: `startRun`, `continueRun`, `movePastCurrentIce`, Encounter-Aktionen.
3. Danach Access-Flow schneiden: `runnerAccessActions`, `accessCurrentCard`, Breach-Queue, Steal-/Trash-Kosten.
4. Danach Payment-Revalidation-Reste schneiden: vorhandene `game/payment/*`-Module als Ziel nutzen, keine zweite Kostenquelle erzeugen.
5. Danach Damage/Prevention/Replacement schneiden: Event-Modification und Flatline nur mit eigener Regression.
6. Danach Trace-Orchestrierung schneiden: `game/trace/*` ist vorbereitet, aber die Action-Sequenz hängt noch in `index.ts`.
7. Erst wenn diese Fachflows hinter kleinen Entry Points liegen, `performAction` aus `index.ts` herausziehen.

Der erste sinnvolle Code-Schnitt nach diesem Analysepaket ist deshalb ein Turn-/LegalActions-Schnitt, nicht ein ApplyAction-Move.

## 5. Reihenfolge der späteren Moves

| Schritt | Ziel | Warum zuerst/später |
| --- | --- | --- |
| 1. Turn LegalActions | `corpMainActions`, `runnerMainActions`, einfache Action-Builder gruppieren | größte LegalAction-Fläche; reduziert `getLegalActions`-Kopplung ohne Replay-Payloads anzufassen |
| 2. Run Flow | `startRun`, Movement, Jack-out, Encounter-Kanten | Run-Zustand ist zentrale Schnittstelle für Access, Trace und Payment |
| 3. Access Flow | Breach-Queue, AccessCurrentCard, Steal/Trash-Entscheidungen | hohe Hidden-Info- und PublicPayload-Relevanz, braucht Tests vorher |
| 4. Payment | Install/Rez/Trash/Steal/Revalidation | vorhandene Module sind gute Grundlage, aber Kostenrevalidation darf nicht doppelt werden |
| 5. Damage | Damage, Prevention, Replacement, Flatline | hohes Replay-/Hidden-Info-Risiko, daher nach Teststruktur und Flow-Abgrenzung |
| 6. Trace | Trace-Sequenz und Post-Bid-Link | Helper sind modular, Orchestrierung hängt aber an Run/Encounter |
| 7. `performAction` | Dispatcher nach `game/apply-action` bewegen | erst sinnvoll, wenn Cases überwiegend delegieren |

## 6. Akzeptanzkriterien für späteren ApplyAction-Move

Ein späterer Move von `applyAction`/`performAction` ist akzeptabel, wenn:

- `game/apply-action.ts` keine Importe aus `../index` braucht.
- `index.ts` nur noch kompatibel re-exportiert oder delegiert.
- `performAction` überwiegend Fachmodule aufruft und nicht mehr selbst lange Fachlogik enthält.
- `getLegalActions` und `performAction` weiterhin dieselbe Revalidation-Quelle nutzen.
- Replay läuft unverändert über dieselbe `PlayerAction`-Payload und denselben StateHash.
- `buildEvent`/PublicPayload-Assembly bleibt während des Moves unverändert oder wird separat mit PublicPayload-Vertragstest migriert.
- Es gibt keine Importzyklen `index.ts -> game/index.ts -> index.ts`.
- `game/*`-Produktionsmodule importieren nicht aus `../index`, ausgenommen dokumentierte Übergangswrapper, die im Zielcommit entfernt werden.
- `src/index.test.ts`, `src/game/index.test.ts` und die modulnahen Flow-/View-/Compatibility-Tests bleiben grün.

## 7. Entscheidung für ENGINE-ARCH-1

Für diesen Schritt wurde kein Produktionscode geändert. Ein neuer Wrapper, der intern nur `index.applyAction` aufruft, wäre kein echter Fortschritt, weil diese Wrapper bereits existieren. Ein echter index-freier `applyGameAction` würde aktuell große, unklassifizierte Teile von `index.ts` mitziehen.

Der verhaltenssichere Abschluss für ENGINE-ARCH-1 ist deshalb diese Boundary-Dokumentation. Sie bestätigt den aktuellen Zustand, verhindert eine Scheinmigration und benennt den nächsten konkreten Produktionsschnitt: Turn-/LegalActions-Entkopplung vor `performAction`-Move.
