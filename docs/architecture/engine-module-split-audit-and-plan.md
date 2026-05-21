# Engine Module Split Audit and Plan

Stand: 2026-05-21
Auftrag: ARCH-1, reiner Architektur-Audit und Zielstruktur-Plan
Scope: keine Produktionscodeänderung, keine Refactorings, keine Tests, keine PublicPayload-/PlayerView-/PublicEvent-Vertragsänderung

## 1. Kurzfazit

Die Aufteilung lohnt sich fachlich, aber nur inkrementell und mit einer zuerst definierten Game-Fassade. `packages/engine/src/index.ts` ist nach der CardImplementation-Phase weiterhin der zentrale Regelträger: 31.614 LOC, die größten Funktionen kombinieren LegalAction-Erzeugung, Revalidation, State-Mutation, Run-/Access-/Trace-/Damage-Flows, Karten-Fallbacks, Payload-Building und View-Redaction. Die aktuelle Struktur ist wartbar, solange kleine Kartenpakete isoliert bleiben, aber sie skaliert schlecht für weitere Kartenmigrationen, KI-Simulationen, Replay-Prüfung und Codex-Aufträge.

Das Zielbild "index.ts als Engine-Fassade, Spielsteuerung in `game/*`, Match in eigenem Modul, AbilityEngine ohne konkrete Karten-IDs" ist für NETGRID sinnvoll. Es ist jedoch zu grob, wenn `game/` sofort als großer neuer Ordner mit denselben Abhängigkeiten entsteht. ARCH-2 sollte deshalb zuerst eine schmale Fassade ohne Logikänderung extrahieren und die vorhandenen Host-Primitives sichtbar machen. Danach sollten Turn, Run, Access, Payment/Revalidation, Damage/Trace und View/Redaction in kleinen Schnitten folgen.

Wichtigster Befund: Die CardImplementation-Schicht ist bereits ein guter Zielpfad für Kartenlogik, aber der Host-Vertrag ist sehr breit. `cardImplementationRuntimeDeps` umfasst 56 direkt gezählte Top-Level-Properties plus den Spread aus `cardImplementationEffectAdapters`; das ist die zentrale technische Schuld, weil fast jede fachliche Engine-Primitive indirekt wieder in `index.ts` landet.

## 2. Kritische Bewertung: lohnt sich die Aufteilung?

Ja, unter drei Bedingungen:

- Die erste Grenze ist `Game`, nicht `Match`. Match-Auslagerung vor Game-Grenze würde Session- und Engine-Fragen vermischen.
- Es wird zuerst API-/Wiring-kompatibel verschoben, nicht inhaltlich neu modelliert.
- Hidden-Info-Redaction und Action-Revalidation bleiben zentral testbar und dürfen nicht nebenbei verteilt werden.

Bestätigte Vorteile:

- Bessere Orientierung: `index.ts` enthält aktuell Grundregeln, Kartenreste, Choice-Resolver, Run-Flow, Access, Damage, Trace, Payment und View. Fachmodule würden Suchraum und Codex-Prompt-Scope stark reduzieren.
- Kleinerer `index.ts`: Ziel ist Export-/Wiring-Fassade statt 31k-LOC-Regeldatei.
- Bessere Testbarkeit: Game kann ohne Web/Match getestet werden; einzelne Flow-Familien können eigene Regressionen bekommen.
- Klarere Zuständigkeiten: Match verwaltet Nutzer/Sitzung; Game verwaltet Regelzustand.
- Weniger Risiko bei Kartenmigrationen: Karten-Fallbacks werden sichtbar als Legacy-Reste statt in langen LegalAction-/performAction-Pfaden zu verschwinden.
- Bessere Replay-/Simulation-/AI-Fähigkeit: deterministische Game-Transitions können isoliert und wiederholt ausgeführt werden.
- Bessere Trennung von Spiel, Match, UI und Editor: Web bleibt Konsument von `PlayerView`, `LegalActions`, PublicEvents und Deck-/Catalog-APIs.

Hauptkritik am Zielbild:

- `packages/engine/src/game/` ist als Name gut, aber `GameState` liegt heute in `@netgrid/shared`. Ein Umzug von Typautorität wäre ein eigener, späterer Vertragsschnitt. Für ARCH-2 sollte `game/` zunächst Funktionen kapseln, nicht die Shared-Typen verschieben.
- `game/payment` sollte nicht isoliert nur "Kosten zahlen" bedeuten. In NETGRID muss Payment mit LegalAction-Kostenquote, restricted hosted credits, temporary run credits und stale revalidation zusammenbleiben.
- `game/view` sollte eher `game/public-view` oder `game/view` mit klarer Unterteilung `player-view`, `public-event`, `redaction` heißen. Der heutige Begriff `public-context.ts` beschreibt nur einen Teil.
- `ability-engine/` sollte nicht "keine konkreten Karten-IDs außer Tests/Registry" absolut verstehen. `registry.ts` und einzelne CardImplementation-Dateien sind gerade der Ort für konkrete IDs. Gemeint ist: keine Karten-ID-Verzweigungen in generischer Runtime, Modifiers oder Effect-Interpreter.

## 3. Ist-Zustand mit Messwerten

Ausgangspunkt:

- Worktree vor Analyse sauber: ja.
- Branch: `codex/card-implementation-next-task`.
- Letzte CardImplementation-nahe Commits vorhanden: ja, unter anderem `2011cd4c refactor(engine): migrate runner sabotage prep cards`, `e4f4302c refactor(engine): migrate remaining ice longtail subroutines`, `22d1eda8 refactor(engine): migrate fort region longtail cards`, `39a47144 refactor(engine): migrate delayed fort run windows`.
- Keine offenen Codeänderungen vor Dokumenterstellung: ja.

LOC:

| Datei | LOC |
| --- | ---: |
| `packages/engine/src/index.ts` | 31.614 |
| `packages/engine/src/public-context.ts` | 1.654 |
| `packages/engine/src/index.test.ts` | 47.317 |

Top 20 größte Funktionen in `index.ts`:

| Rang | Funktion | Zeilen | Bereich | Künftige Primärzuständigkeit |
| ---: | --- | ---: | --- | --- |
| 1 | `performAction` | 1.309 | 8181-9489 | `game/apply-action` plus Delegation in Flow-Module |
| 2 | `runnerMainActions` | 930 | 4314-5243 | `game/turn` und `game/legal-actions/runner-main` |
| 3 | `corpMainActions` | 820 | 3337-4156 | `game/turn` und `game/legal-actions/corp-main` |
| 4 | `continueRun` | 432 | 11760-12191 | `game/run` |
| 5 | `resolvePendingChoice` | 406 | 21859-22264 | vorerst Host-Primitive, später `game/choices` |
| 6 | `validateGameState` | 392 | 2693-3084 | `game/validation` |
| 7 | `installCard` | 382 | 10418-10799 | `game/turn/install` plus `game/payment` |
| 8 | `resolveEventModificationChoice` | 272 | 18383-18654 | `game/damage` oder `game/events` |
| 9 | `scoreAgenda` | 269 | 20622-20890 | `game/access`/`game/agenda` |
| 10 | `runnerEncounterActions` | 248 | 6825-7072 | `game/run/encounter` und `game/legal-actions` |
| 11 | `runnerAccessActions` | 195 | 7816-8010 | `game/access` |
| 12 | `executeCardImplementationAccessEffectStep` | 181 | 14451-14631 | `game/access` plus ability adapter |
| 13 | `getPlayerView` | 175 | 2517-2691 | `game/view` |
| 14 | `resolveTraceCorpBid` | 173 | 27571-27743 | `game/trace` |
| 15 | `resolveTraceRunnerBid` | 169 | 27994-28162 | `game/trace` |
| 16 | `startRun` | 156 | 10908-11063 | `game/run` |
| 17 | `resolveAssetAccessEffect` | 152 | 14901-15052 | `game/access` legacy fallback |
| 18 | `collectRuntimeDamagePreventionCandidates` | 144 | 17696-17839 | `game/damage` |
| 19 | `specialZoneHarnessActions` | 137 | 6290-6426 | vorerst Host-Primitive/Test-Harness, später `game/zones` |
| 20 | `resolveSuccessfulRunInterventionChoice` | 133 | 26385-26517 | `game/run` und `game/access` |

Host-Dependency-Objekte und Host-Flächen:

| Objekt/Fläche | Befund |
| --- | --- |
| `cardImplementationRuntimeDeps` | 647 LOC Objektliteral, 56 gezählte Top-Level-Properties plus `...cardImplementationEffectAdapters`; sehr breiter Host-Vertrag für AbilityRuntime. |
| `cardImplementationEffectAdapters` | 17 Host-Primitives für Draw, Damage, Counter, Credits, Trash und Mutation; sinnvoll, aber Teil derselben Host-Breite. |
| `publicContextDeps` | 9 Dependencies für read-only PublicContext, passend injiziert zur Importzyklusvermeidung. |
| `effectiveAgendaDifficultyDeps` | 4 Dependencies; guter kleiner Schnitt für read-only Effective Values. |
| `runnerCardImplementationAbilityLimitHost` | kleiner Host für per-turn Ability-Limits; passend geschnitten. |

Direkte `onr_v1_`-Referenzen:

| Bereich | Vorkommen | Unique IDs | Bewertung |
| --- | ---: | ---: | --- |
| `packages/engine/src/index.ts` | 88 | 73 | Zu viel für langfristige Fassade; mehrere echte Legacy-Sonderfälle bleiben. |
| `packages/engine/src/ability-engine/*` | 1 | 1 | Fast sauber; der eine Treffer ist zu prüfen, aber kein breites Muster. |
| `packages/engine/src/mechanics/*` | 129 | 127 | Ausgelagerte Monolithstücke/ID-Konstanten nach Mechanikfamilien; teilweise nützlich, aber noch Kartenlisten statt deklarativer Runtime. |
| `packages/engine/src/card-implementations/*` | 655 | 343 | Erwartet und gewünscht: konkrete Karten gehören hierhin, wenn deklarativ und registriert. |

CardImplementation-Coverage, aus `packages/engine/src/card-implementations/coverage.ts` und Registry abgeleitet:

| Status | O:NR-v1-Subset |
| --- | ---: |
| `implemented` | 341 |
| `legacy_engine_special_case` | 2 |
| `partial_implementation` | 0 |
| `pending_implementation` | 62 |

Verbleibende dokumentierte Legacy-Sonderfälle:

- `onr_v1_068_startup-immolator`: Runner installed-program ability, passed ICE rez cost, Trash nach fully broken pass-ice timing; noch nicht CardImplementationDefinition.
- `onr_v1_173_restrictive-net-zoning`: servergebundener Install-Cost-Modifier und selected-server state leben noch in Legacy-Engine-Pfaden.

Weitere konkrete ID-Sonderfälle in `index.ts`, die als Migrationsreste oder fachliche Host-Primitives auffallen:

- Agenda-/Score-Fallbacks: `onr_v1_203_hostile-takeover`, `onr_v1_212_priority-requisition`, `onr_v1_214_project-babylon`, `onr_v1_215_security-net-optimization`, `onr_v1_219_superior-net-barriers`.
- Install-/Resource-Fallbacks: `onr_v1_156_corporate-ally`, `onr_v1_159_databroker`, `onr_v1_173_restrictive-net-zoning`, `onr_v1_180_smiths-pawnshop`.
- Run-/Encounter-Fallbacks: `onr_v1_222_ball-and-chain`, `onr_v1_242_fatal-attractor`, `onr_v1_371_tokyo-chiba-infighting`.
- Payment-/Kosten-Fallbacks: `onr_v1_147_zz22-speed-chip`, `onr_v1_308_acme-savings-and-loan`.
- Hidden-Zone-/Counter-/Longtail-Fallbacks aus Releasefamilien V1.9.11 bis V1.9.22, oft über Payload-Flags wie `v1911HiddenZoneAbility`, `v1922RunnerProgramAbility`, `v1918UpgradeAbility`.

Teststruktur:

- `packages/engine/src/index.test.ts` hat 47.317 LOC, 83 `describe`-Blöcke und 612 `it`/`test`-Fälle.
- Die Tests sind historisch nach MVP-/V1.x-/Spotcheck-/Mechanikpaket-Schnitten gewachsen. Das ist als Gate-Historie wertvoll, aber für Modulgrenzen zu groß und schwer gezielt zu nutzen.
- Eine spätere Teststruktur sollte nicht sofort alles verschieben. Zuerst pro extrahiertem Modul neue oder verschobene Tests ergänzen, dann historische Blöcke graduell nach Mechanikfamilie ordnen.

Bereits passend geschnittene Module:

- `packages/engine/src/public-context.ts`: read-only, importiert nicht aus `index.ts`, darf Payloads formatieren/redigieren, aber nicht mutieren. Das ist nahe am Ziel.
- `packages/engine/src/ability-engine/effect-interpreter.ts`: generische Effect-Vokabel, Host-Callbacks für Mutation; grundsätzlich richtig.
- `packages/engine/src/ability-engine/card-implementation-runtime.ts`: Runtime orchestriert declarative CardImplementation-Ausführung ohne `index.ts`-Import; richtiges Zielmuster, aber Host-Vertrag zu breit.
- `packages/engine/src/ability-engine/effective-values.ts`: read-only effective value helpers mit injizierten Legacy-Abhängigkeiten; guter kleiner Schnitt.
- `packages/engine/src/card-implementations/registry.ts`: reine Registry, importiert konkrete Karten und baut Lookup; richtiger Ort für konkrete Karten-IDs.
- `packages/engine/src/card-implementations/coverage.ts`: Coverage-/Status-Schicht, keine Runtime-Autorität; passend.

Nur ausgelagerte Monolithstücke:

- `packages/engine/src/mechanics/*`: viele Dateien sind ID-Konstanten und familienbezogene Listen (`run-access`, `hidden-zone`, `longtail-card-effects`, `global-modifiers`, `asset-node-effects`, `damage-prevention`). Sie reduzieren `index.ts`-Länge, bilden aber oft noch keine eigenständigen Regelmodule mit klaren Eingaben/Ausgaben.
- Teile der Ability-Host-Adapter sind fachlich eigentlich `game/run`, `game/access`, `game/damage`, `game/payment` und nicht "AbilityEngine". Die Runtime delegiert nur zurück an `index.ts`.

## 4. Zielbild Game / Match / Index / AbilityEngine / PublicView

Empfohlenes Zielbild:

```text
packages/engine/src/index.ts
  Export-Fassade, Kompatibilitäts-Wiring, sehr dünne Host-Bindings.

packages/engine/src/game/
  createGame
  applyGameAction
  legalActionsFor
  playerViewFor
  replay/hash/validation adapters
  deterministische Spielregelmaschine

packages/engine/src/game/turn/
  Corp-/Runner-Turnflow
  StartTurn, EndTurn, ActionBudget
  start-of-turn/end-of-turn cleanup
  action debt / forgo actions

packages/engine/src/game/run/
  StartRun, ApproachIce, EncounterIce
  PassIce, JackOut, RunEnd, SuccessfulRun
  Run modifiers

packages/engine/src/game/access/
  AccessFlow, AccessQueue, Breach
  Steal, Trash, Reveal
  Access replacement
  Hidden-info-safe access payloads

packages/engine/src/game/payment/
  CostQuote
  payment execution
  restricted hosted credits
  temporary credits
  stale cost revalidation

packages/engine/src/game/damage/
  Damage
  Prevention/Avoid
  Flatline replacement
  Damage redaction payloads

packages/engine/src/game/trace/
  Trace flow
  Corp/Runner bids
  Base link
  Link pumps
  Trace result

packages/engine/src/game/view/
  PlayerView
  PublicEvent redaction
  PublicPayload/PublicContext read-only projection

packages/engine/src/match/
  Nur wenn oder sobald Match aus servernahen Schichten in ein Paket wandern soll:
  MatchSession, seats, user-to-side mapping, submitAction wrapper,
  reconnect payload, command log, snapshots, match status.
```

Was anders benannt werden sollte:

- `GameCommand` ist klarer als `GameAction`, weil `PlayerAction` bereits existiert. `GameCommand` kann später Server-/AI-/Replay-Kommandos normalisieren.
- `applyGameAction` sollte intern auf `applyAction` aufbauen und anfangs exakt kompatibel bleiben.
- `public-view` oder `view` ist besser als nur `public-context`, weil `PlayerView`, `PublicEvent` und PublicPayload-Redaction getrennte Projektionen sind.
- `payment` sollte `payment-revalidation` oder in Dokumenten ausdrücklich "CostQuote + Payment + Revalidation" heißen.

Was fehlt:

- `game/choices`: PendingChoice-Erzeugung und Choice-Resolution sind heute ein großer Mischbereich. Nicht zuerst auslagern, aber als späterer eigener Schnitt nötig.
- `game/validation`: `validateGameState`, invariant checks und StateHash-nahe Stabilität sollten nicht in `turn` oder `run` verschwinden.
- `game/zones`: Card movement, special zones, ownership/control und hosted cleanup sind Querschnittsprimitives; nicht zu früh fragmentieren.
- `game/random`: Seed, RandomCounter und RandomDrawRecords brauchen einen kleinen deterministischen Adapter, bevor Random-Mechaniken weiter verteilt werden.

## 5. Match-vs-Game-Grenze

Game verantwortet:

- Regellogik.
- LegalActions.
- `applyAction`/`applyGameAction` inklusive Revalidation von Seite, actionId, stateVersion, Timingpunkt, Kosten, Zielen und Choices.
- Turn/Run/Access/Damage/Trace/Payment.
- `GameState`-Transition.
- PublicEvents aus Spielereignissen.
- PlayerView.
- Replay/deterministic RNG/StateHash.

Match verantwortet:

- Spielerplätze.
- User-to-side mapping.
- Reconnect.
- Command log / ActionReceipt / Idempotency.
- Snapshots und Undo-Snapshots.
- Match status, Lobby, Forfeit, Lifecycle.
- Spectators, wenn eingeführt.
- Authorization: darf dieser User diese Aktion für diese Seite senden?
- Persistenz-/Session-Rahmen.

Match soll ausdrücklich nicht verantworten:

- ob Scorched Earth legal ist.
- ob der Runner eine Subroutine brechen darf.
- ob ein Access-Replacement greift.
- ob Hidden Info in PlayerView/PublicEvent gezeigt wird.
- ob Kosten, Timingpunkt oder Choice im Game noch valide sind.

Aktueller Befund:

- `apps/server/src/multiplayer.ts` ist schon faktisch Match-Orchestrierung: `MatchRecord`, `SessionRecord`, `TokenRecord`, `StateSnapshot`, `ActionReceipt`, `UndoSnapshot`, Storage und `MultiplayerService`.
- Diese Schicht importiert Engine-Funktionen (`createGame`, `applyAction`, `getLegalActions`, `getPlayerView`, `hashState`, `replayEvents`) und sollte langfristig gegen eine Game-Fassade sprechen.
- Match-Auslagerung in `packages/engine/src/match` ist nur sinnvoll, wenn damit serverunabhängige Match-Konzepte gemeint sind. Persistenz, Tokens, HTTP/WebSocket und SQLite bleiben servernah.

## 6. Editor-/Options-Grenze

Card Editor, Deck Builder und Options sollten nicht in Game-Regellogik hineinwachsen.

Empfohlene Grenze:

- Card Editor / Card Catalog arbeiten mit `CardDefinition`, Catalog-Daten, Implementation-Status, Supportdaten und optionalen AI-Hints.
- Deck Builder arbeitet mit `EditableDeck`, Decklisten, Formatprofilen, Validierung und Snapshots.
- Matchstart erzeugt immutable Deck-Snapshots und eine `MatchConfig`/`CreateGameConfig`.
- `RulesetConfig`/`MatchConfig` bleiben Eingabeparameter. Sie mutieren nicht laufenden `GameState` außerhalb definierter Game-Transitions.
- Web-Options wie Anzeigegröße, Audio, Chronikdetail, Kartenbildmodus, KI-Pacing und Session Recovery bleiben UI-/Server-Orchestrierung, nicht Engine.

Aktueller Befund:

- `apps/web/app/api/decks/deck-data.ts` validiert Decks über `@netgrid/decks` und erzeugt Snapshots. Das ist richtig außerhalb der Engine.
- `apps/web/app/page.tsx` ist sehr groß und konsumiert `PlayerView`, `LegalActions`, `PublicGameEvent`, Matchstart- und Deckdaten. Es sollte keine Regelautorität bekommen.
- `packages/shared/src/api-contracts.ts` trennt Match-/API-Payloads bereits von Engine-Kernzustand. Diese Verträge müssen bei ARCH-2 bis ARCH-9 unverändert bleiben.

## 7. Zuständigkeitsklassifikation großer `index.ts`-Funktionsgruppen

| Funktionsgruppe | Heute | Künftig |
| --- | --- | --- |
| `createGame`, `createGameAfterSetup`, Deck-Expansion, Initialshuffle, Setup-Mulligan | `index.ts` | `game/create-game`; Typen bleiben vorerst Shared |
| `getLegalActions` Dispatcher | `index.ts` | `game/legal-actions` als Dispatcher, delegiert in `turn`, `run`, `access` |
| `applyAction`, `performAction`, `buildEvent` | `index.ts` | `game/apply-action`; `performAction` nur Dispatcher, Logik in Fachmodulen |
| `corpMainActions`, `runnerMainActions` | `index.ts` | `game/turn` und `game/legal-actions/*`; Kartenreste bleiben markiert |
| Click-/Action-Budget, EndTurn, StartTurn, turn flags, action debt | verstreut | `game/turn` |
| `startRun`, `corpApproachActions`, `runnerEncounterActions`, `continueRun`, `movePastCurrentIce`, `finishRun` | `index.ts` | `game/run` |
| ICE breaker pump/break, encounter subroutine resolution | `index.ts` mit AbilityEngine-Abfragen | `game/run/encounter`; AbilityEngine liefert Definitionen/Queries |
| `runnerAccessActions`, `accessCurrentCard`, breach queue, steal/trash/decline access | `index.ts` | `game/access` |
| Access ambush/effects (`resolveCardImplementationAccessEffects`, legacy asset/upgrade access effects) | `index.ts` | `game/access` plus CardImplementation adapter |
| CostQuote, `creditCostForAction`, `spendRunnerRunCredits`, hosted/temporary/restricted credits | `index.ts` | `game/payment`; nicht getrennt von revalidation |
| `doDamage`, imminent damage, prevention, replacement, flatline | `index.ts` | `game/damage` |
| `startTraceFromOperation`, `resolveTraceCorpBid`, `resolveTraceRunnerBid`, link pumps | `index.ts` | `game/trace` |
| `getPlayerView`, visible card helpers, event redaction | `index.ts` und `public-context.ts` | `game/view` oder `game/public-view`; read-only |
| `publicContextForAction` | `public-context.ts` | bleibt passend, später unter `game/view/public-context` |
| `cardImplementationRuntimeDeps`, effect adapters | `index.ts` | vorerst Host-Primitive; danach kleinere Module bauen eigene Adapter |
| `validateGameState` | `index.ts` | `game/validation` |
| `hashState`, `replayEvents` | `index.ts` | `game/replay` oder `game/determinism`; erst nach Game-Fassade |
| `resolvePendingChoice` und viele `start*Choice` Helfer | `index.ts` | später `game/choices`; nicht zuerst, weil stark mit allen Flows gekoppelt |
| SpecialZoneHarness/Test-Harness | `index.ts` | vorerst Host-Primitive; später `game/zones` nach Stabilisierung |
| Deck validation helper `validateDeckDefinition` | `index.ts` | prüfen: langfristig eher `@netgrid/decks` oder `game/create-game` boundary |

## 8. Risiken

Hoch:

- Verteilter Monolith: Wenn `performAction`, LegalAction-Erzeugung und Host-Deps nur dateiweises Kopieren werden, wird `index.ts` kleiner, aber die Architektur schlechter.
- Hidden-Info-Leaks: Access, PublicPayload, PublicContext und PlayerView dürfen nicht auseinanderlaufen. View/Redaction muss read-only und zentral testbar bleiben.
- Doppelte Source of Truth: LegalActions und `applyAction`-Revalidation müssen dieselbe Kosten-/Ziel-/Timinglogik teilen oder bewusst denselben Quote-Helper verwenden.
- State-Mutation verteilt sich zu stark: Module brauchen klare Mutationsrechte und dürfen nicht nebenbei PublicPayload-Entscheidungen treffen.

Mittel:

- Importzyklen: Heute vermeiden `public-context.ts` und AbilityEngine direkte `index.ts`-Imports. Neue `game/*`-Module müssen Typen und Host-Primitives so schneiden, dass keine Zyklen entstehen.
- Zu breite Dependency-Objekte: `cardImplementationRuntimeDeps` zeigt bereits, wie schnell ein Modul durch Host-Deps wieder alles kennt.
- Zu frühe Match-Auslagerung: Ohne Game-Fassade wird Match nur ein weiterer Wrapper um `index.ts`.
- Testchaos: `index.test.ts` darf nicht in einem großen Move umsortiert werden; sonst gehen Gate-Historie und Reviewbarkeit verloren.
- Codex-Kontextverlust: schlecht benannte Module wie `helpers.ts`, `utils.ts`, `core.ts` oder `misc.ts` würden spätere Prompts verschlechtern.

Niedrig bis mittel:

- Naming Drift: `run`, `access`, `breach`, `public-view` und `public-context` müssen konsistent verwendet werden.
- Dokumentationsdrift: Legacy-Reste brauchen eine kleine Inventarliste, bis sie migriert sind.

Was ausdrücklich nicht zu früh ausgelagert werden sollte:

- `resolvePendingChoice` als Ganzes. Choices sind Querschnitt über Damage, Trace, Access, Hidden Zone, Event Modification und Setup.
- `card movement`/`removeFromAllZones`/ownership/control/hosted cleanup ohne vorherige Zone-API.
- PublicPayload-Feldnamen und `public-context.ts`-Kompatibilitätsfelder.
- Match-Persistenz, WebSocket, tokens, reconnect und SQLite in ein Engine-Paket.
- `GameState`-Typen aus `@netgrid/shared`, solange API-/Server-/Web-Verträge daran hängen.
- Tests großflächig umsortieren, bevor Module stabil sind.

## 9. Schrittplan ARCH-2 bis ARCH-10

### ARCH-2: Game-Fassade extrahieren

Ziel:

- Neue schmale `packages/engine/src/game/`-Fassade mit `createGame`, `createGameAfterSetup`, `applyGameAction`, `legalActionsFor`, `playerViewFor`.
- `index.ts` bleibt kompatibler Export-Ort und delegiert.
- Keine Logikänderung, keine Vertragsänderung.

Betroffene Dateien:

- `packages/engine/src/index.ts`
- neue Dateien unter `packages/engine/src/game/`
- bestehende Tests unverändert oder minimal importkompatibel, falls nötig.

Warum zuerst:

- Ohne Game-Fassade gibt es keine stabile Zielkante für Match, AI, Server oder spätere Module.
- Der Schritt kann mechanisch und risikoarm sein.

Risiken:

- Scheinextraktion ohne echte Grenze, wenn die Fassade sofort alle Internals exportiert.
- Importzyklen zwischen `index.ts` und `game`.

Tests:

- `corepack pnpm --filter @netgrid/engine typecheck`
- bestehende Engine-Tests, mindestens `index.test.ts`.

Akzeptanzkriterien:

- Public API bleibt kompatibel.
- `index.ts` enthält sichtbares Delegations-/Export-Wiring.
- Keine PublicPayload-/PlayerView-/PublicEvent-Änderung.

Nicht anfassen:

- Kartenmigrationen.
- `GameState`-Typumzug.
- Match/Server.

### ARCH-3: ApplyAction-Dispatcher und Host-Primitives schneiden

Ziel:

- `performAction` in einen klaren Dispatcher überführen.
- Erste interne Module für `apply-action`, `validation`, `event-build` vorbereiten.
- Host-Primitives inventarisieren, bevor sie aufgeteilt werden.

Betroffene Dateien:

- `packages/engine/src/index.ts`
- `packages/engine/src/game/apply-action.ts`
- `packages/engine/src/game/validation.ts`

Warum jetzt:

- `performAction` ist mit 1.309 LOC der größte Block und der zentrale Verteiler.
- Ein Dispatcher-Schnitt reduziert Risiko für spätere Fachmodule.

Risiken:

- Zu viele Mutationshelper werden public exportiert.
- Revalidation wird von Execution getrennt.

Tests:

- Engine full test oder gezielte `applyAction`-/Replay-/StateHash-Blöcke.

Akzeptanzkriterien:

- `performAction`-Logik ist besser delegiert, aber Verhalten identisch.
- Stale state, wrong side, invalid choice und invariant checks bleiben gleich.

Nicht anfassen:

- Fachlogik in `run`, `access`, `damage`, `trace` noch nicht neu modellieren.

### ARCH-4: TurnFlow und Main LegalActions extrahieren

Ziel:

- `corpMainActions`, `runnerMainActions`, Start-/Endturn, ActionBudget, action debt, forgo actions und cleanup nach `game/turn`.
- Main-action LegalAction-Erzeugung von Run-/Access-Fenstern trennen.

Betroffene Dateien:

- `packages/engine/src/index.ts`
- `packages/engine/src/game/turn/*`
- eventuell `game/legal-actions/*`

Warum nach ARCH-3:

- MainActions sind große Generatoren, aber sie rufen viele Host-Primitives. Der ApplyAction-Dispatcher sollte vorher klar sein.

Risiken:

- Karten-Fallbacks werden in `turn` versteckt statt als Legacy markiert.
- Payment-Revalidation driftet von LegalAction-Kosten weg.

Tests:

- Turn-, install-, draw-, purge-, end-turn-, start-of-turn-Regressionen.
- Hidden-Info-Tests für verdeckte Runner-Resources und Korp-Installationen.

Akzeptanzkriterien:

- `corpMainActions` und `runnerMainActions` sind nicht mehr monolithisch in `index.ts`.
- Legacy-ID-Fallbacks sind in einer Liste/Datei sichtbar.

Nicht anfassen:

- Run-/Encounter-Flow nicht nebenbei extrahieren.

### ARCH-5: RunFlow extrahieren

Ziel:

- `startRun`, approach, encounter, pass ICE, jack out, run end, successful run und run modifiers nach `game/run`.
- Encounter-Subroutine-Auflösung als eigener Unterbereich.

Betroffene Dateien:

- `packages/engine/src/index.ts`
- `packages/engine/src/game/run/*`
- bestehende AbilityEngine query helpers nur über klare Imports.

Warum jetzt:

- Run ist fachlich kompakt, aber groß genug für eigenen Testfokus.
- Access kann danach sauber auf Run/Breach-Zustand aufsetzen.

Risiken:

- ICEbreaker Payment, temporary credits und break-cost modifiers können auseinanderlaufen.
- Run-Payloads können Hidden-Info oder AI-Felder verlieren.

Tests:

- Run/Jack-out/Breach/Multiaccess, Encounter, Break/Pump, ETR, StateHash.

Akzeptanzkriterien:

- Run-Flow ist ohne Match/Web testbar.
- `index.ts` enthält keine Run-State-Mutation außer Delegation.

Nicht anfassen:

- Access-Queue nicht gleichzeitig groß umbauen.

### ARCH-6: AccessFlow extrahieren

Ziel:

- `runnerAccessActions`, `accessCurrentCard`, AccessQueue/Breach, steal/trash/reveal/decline, access replacements nach `game/access`.
- Hidden-info-safe access payloads zentral halten.

Betroffene Dateien:

- `packages/engine/src/index.ts`
- `packages/engine/src/game/access/*`
- `public-context.ts` nur bei Bedarf read-only verschieben, keine Feldänderung.

Warum nach Run:

- Access hängt am aktiven Run und Breach-State. Erst Run-Grenze, dann Access-Grenze.

Risiken:

- PublicPayload/Hidden-Info-Leaks durch falsche Reveal-Verantwortung.
- Steal-/Trash-Cost-Revalidation wird von LegalActions getrennt.

Tests:

- Full Archives Access, HQ/R&D/Archives, Multiaccess, Ambush, steal/trash costs, hidden info barriers.

Akzeptanzkriterien:

- Access mutiert nur über `game/access`.
- Public reveal/redaction bleibt unverändert.

Nicht anfassen:

- Kein neues Access-Regelmodell, nur Extraktion.

### ARCH-7: Payment/Revalidation extrahieren

Ziel:

- CostQuote, Payment execution, restricted hosted credits, temporary credits, stale cost revalidation bündeln.
- LegalAction-Kosten und Execution-Kosten verwenden dieselben Quote-Helper.

Betroffene Dateien:

- `packages/engine/src/index.ts`
- `packages/engine/src/game/payment/*`
- AbilityRuntime-Host-Deps, soweit sie Payment betreffen.

Warum nach Turn/Run/Access:

- Payment ist Querschnitt. Nach den ersten Flow-Grenzen ist sichtbar, welche Quotes wirklich geteilt werden müssen.

Risiken:

- Doppelte Source of Truth zwischen LegalAction und Execution.
- Hosted credits oder temporary run credits werden zu früh generisch und verlieren Kontext.

Tests:

- Rez/install/trash/steal/break/run-start costs, restricted hosted credits, stale action rejection.

Akzeptanzkriterien:

- Stale cost revalidation bleibt hart.
- Keine Änderung an LegalAction cost payloads.

Nicht anfassen:

- Keine neue Kosten-DSL.

### ARCH-8: Damage und Trace extrahieren

Ziel:

- `game/damage`: Damage, prevention, avoid, flatline replacement, damage redaction.
- `game/trace`: trace start, corp/runner bids, base link, link pumps, trace result.

Betroffene Dateien:

- `packages/engine/src/index.ts`
- `packages/engine/src/game/damage/*`
- `packages/engine/src/game/trace/*`

Warum zusammen als Paket oder zwei nahe Pakete:

- Viele Kartenfamilien verbinden Trace, Tags und Damage. Die Module sollten getrennt sein, aber im selben Architekturfenster geplant werden.

Risiken:

- Event Modification/Replacement Choice-Flow ist stark gekoppelt und darf nicht fragmentiert werden.
- Trace-Bidding ist hidden-info-sensibel.

Tests:

- V1.9.13 Damage/Prevention/Replacement.
- V1.9.14 Trace/Tag/Resource.
- MVP 0.96 Trace/Link/Bidding.

Akzeptanzkriterien:

- Damage und Trace haben klare öffentliche entry points.
- Hidden-info-barrier Events bleiben gleich.

Nicht anfassen:

- `resolvePendingChoice` nur so weit bewegen, wie für Damage/Trace nötig; kein globaler Choice-Refactor.

### ARCH-9: PublicView/PublicContext splitten

Ziel:

- `getPlayerView`, `toPublicEvent`, `redactPublicEventForSide`, `publicContextForAction` und VisibleCard-Helfer unter `game/view` oder `game/public-view` ordnen.
- PublicContext bleibt read-only.

Betroffene Dateien:

- `packages/engine/src/index.ts`
- `packages/engine/src/public-context.ts`
- neue `packages/engine/src/game/view/*`

Warum spät:

- View/Redaction muss die fachlichen Flow-Grenzen kennen. Zu frühes Verschieben erhöht Leak-Risiko.

Risiken:

- Vertragsänderungen an `PlayerView`, `PublicGameEvent`, PublicPayload.
- Redaction verteilt sich über Flow-Module.

Tests:

- Visibility, reconnect, undo, replay, hidden-zone, action-cues/chronicle consumer tests.

Akzeptanzkriterien:

- Public/View-Code liest und redigiert, mutiert aber keinen State.
- Hidden-Info-Tests bleiben grün.

Nicht anfassen:

- Keine Feldumbenennungen.
- Keine UI-Anpassungen.

### ARCH-10: Tests strukturieren

Ziel:

- `packages/engine/src/index.test.ts` schrittweise nach Mechanikfamilien aufteilen.
- Erst nach stabilen Modulgrenzen.

Betroffene Dateien:

- neue Testdateien unter `packages/engine/src/game/**` oder `packages/engine/src/*.test.ts`.
- bestehender `index.test.ts` bleibt während Übergang lauffähig.

Warum zuletzt:

- Vorherige Moves sollen durch bestehende Regressionen geschützt werden.
- Ein Test-Massenmove ohne Modulgrenze erzeugt Review- und Historienchaos.

Risiken:

- Snapshot-/StateHash-/Hidden-Info-Regressionen werden übersehen, wenn Filter nicht korrekt laufen.

Tests:

- Engine full test.
- Typecheck.

Akzeptanzkriterien:

- `index.test.ts` sinkt messbar.
- Tests sind nach `turn`, `run`, `access`, `payment`, `damage`, `trace`, `view` auffindbar.

Nicht anfassen:

- Keine Assertions inhaltlich ändern, solange es nur Struktur ist.

## 10. Akzeptanzkriterien

Messbare Zielkriterien für das Gesamtziel:

- `index.ts` enthält keine konkreten Karten-Sonderfälle mehr, außer dokumentierte Legacy-Fallbacks.
- `index.ts` ist Export-/Wiring-Fassade oder deutlich näher daran; Zielgröße langfristig deutlich unter 5.000 LOC, kurzfristig nach ARCH-4 unter 25.000 LOC.
- Game kann ohne Match/Web getestet werden.
- Match kann `GameCommand`/`PlayerAction` einreichen und `PlayerView`/PublicEvents erhalten.
- PublicContext/View-Code mutiert keinen State.
- AbilityEngine generische Runtime, Modifiers und Effect-Interpreter importieren nicht aus `index.ts`.
- Konkrete Karten-IDs liegen in CardImplementation-Dateien, Registry/Coverage oder klar dokumentierten Legacy-Fallbacks.
- Keine Importzyklen.
- Hidden-Info-Tests bleiben grün.
- Replay/deterministic RNG/StateHash bleibt stabil.
- Payment und stale revalidation verwenden geteilte Quote-Helper.
- Legacy-Reste sind dokumentiert und einzeln abarbeitbar.

Architekturprinzipien:

- `GameState` ist die einzige Quelle des Spielzustands.
- Game-Logik ist deterministisch.
- Match kennt Spieler/Sitzung, aber keine Kartentexte.
- Game kennt keine WebSocket-/Reconnect-/SQLite-/HTTP-Details.
- CardImplementations sind deklarativ; konkrete Kartenlogik liegt in CardImplementation-Dateien, nicht in generischer Runtime.
- AbilityEngine kennt keine konkreten Karten-IDs außer Registry/Coverage/CardImplementation-Dateien und Tests.
- Public/View-Code darf lesen und redigieren, aber nicht mutieren.
- Payment und Revalidation bleiben gekoppelt.
- Hidden-Info-Redaktion bleibt zentral und testbar.
- `index.ts` wird Fassade, nicht Logikträger.
- Keine neue Source of Truth für LegalActions neben `applyAction`-Revalidation.

## 11. Empfohlener erster Umsetzungsauftrag

Empfohlener nächster Prompt:

```text
Arbeite im aktuellen NETGRID-Worktree und auf dem aktuellen Branch.

Dies ist ARCH-2.

Setze nur die Game-Fassade um, ohne Spielverhalten zu ändern:
- Erzeuge `packages/engine/src/game/` als schmalen Facade-Schnitt.
- Biete `createGame`, `createGameAfterSetup`, `applyGameAction`, `legalActionsFor`, `playerViewFor` an.
- `packages/engine/src/index.ts` bleibt kompatibler öffentlicher Export-Ort.
- Keine Kartenmigrationen.
- Keine PublicPayload-/PlayerView-/PublicEvent-Vertragsänderungen.
- Keine UI-Änderungen.
- Keine Testassertions inhaltlich ändern.

Akzeptanz:
- Engine-Typecheck grün.
- Engine-Tests grün oder mindestens `index.test.ts` grün, falls Laufzeit begründet begrenzt wird.
- Kein Importzyklus.
- `index.ts` ist sichtbar näher an Export-/Wiring-Fassade, aber enthält noch keine riskanten Fach-Extraktionen.
```
