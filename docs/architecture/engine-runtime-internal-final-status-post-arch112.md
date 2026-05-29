# ENGINE-STATUS-7: Runtime-Internal-Finalstatus nach ARCH-112

Stand: 2026-05-28
Auftrag: `ENGINE-STATUS-7-runtime-internal-final-audit`
Worktree: `C:\Projekte\NETGRID-ability-engine-refactor`
Branch: `codex/card-implementation-next-task`
Audit-HEAD: `40057ffe13abcac4b8b68ff4135b092db91d8417`

## A. Ausgangspunkt und bestätigte Commits

Die ursprüngliche Architektur-Schuld war `packages/engine/src/index.ts` als 32k-LOC Public-API-, Engine-, Runtime-Host- und Primitive-Monolith. Nach ARCH-108 bis ARCH-112 ist diese Rolle nicht mehr in `index.ts`, sondern in eine explizite Public-Fassade, eine explizite Runtime-Fassade und private Runtime-Internal-Familien zerlegt.

Bestätigte Meilensteine:

| Meilenstein | Commit | Befund |
| --- | --- | --- |
| ARCH-108 Runtime Public API Facade | `81c84f90794fa9412558e4f33565220665465e89` | vorhanden |
| ARCH-109 Choice/HiddenZone Runtime Bridges | `75121b0e38d495e3fd2dfba3fcefa9a4722b53ba` | vorhanden |
| ARCH-110 Card Runtime Hosts und Delegates | `bfd3f5fcf96e20d501d65de51f9a961531798dbd` | vorhanden |
| ARCH-111 Runtime Bootstrap Phasen | `cb800919aac55a305244a70be26d6aee2b85f4bd` | vorhanden |
| ARCH-112 Runtime Host/Service Families | `357d4c087e0a637e5c986777cb50a6a6ff870f49` | vorhanden |

Der Worktree war beim Auditbeginn sauber. Es wurden nur Dokumentationsänderungen vorgenommen.

## B. Methodik und gelesene Quellen

Gelesene Wissens- und Architekturquellen:

- `KI-Wissen-NETGRID/00 Projektstart.md`
- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-NETGRID/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md`
- `KI-Wissen-NETGRID/00 Steuerung/Regeldatei KI-Wissenspflege.md`
- `docs/architecture/engine-runtime-finalization-post-arch108.md`
- `docs/architecture/engine-index-primitive-provider-readiness-post-arch96.md`
- `docs/architecture/engine-index-host-composition-post-perform-action.md`
- `docs/architecture/engine-apply-action-boundary-analysis.md`
- `docs/architecture/ability-engine/ability-engine-restructuring-status-post-arch52.md`
- `docs/architecture/ability-engine/ability-engine-restructuring-status-current.md`
- `docs/architecture/ability-engine/pending-choice-replay-marker-stability-p3-71.md`

Gelesene Code- und Gatequellen:

- `packages/engine/src/index.ts`
- `packages/engine/src/game/engine-runtime.ts`
- `packages/engine/src/game/engine-runtime-internal/*`
- `packages/engine/src/game/engine-runtime-internal/runtime-module-size.test.ts`
- `packages/engine/src/game/engine-runtime-internal/runtime-domains.test.ts`
- `packages/engine/src/game/engine-runtime-internal/README.md`
- `packages/engine/src/public-context.ts`
- `packages/engine/src/ability-engine/card-implementation-runtime.ts`
- `packages/engine/src/ability-engine/effect-interpreter.ts`
- `packages/engine/src/ability-engine/definition-types.ts`
- `packages/engine/src/index.test.ts`
- `packages/engine/src/game/index.test.ts`

Messung erfolgte per LOC-Zählung, Import-Suche, Export-Suche, Direct-ID-Suche und Gate-Review. Es wurde kein Produktivcode verändert.

## C. Kernmesswerte

| Artefakt | LOC | Bewertung |
| --- | ---: | --- |
| `packages/engine/src/index.ts` | 79 | explizite Package-Public-Fassade |
| `packages/engine/src/game/engine-runtime.ts` | 79 | explizite Runtime-Public-Fassade |
| `packages/engine/src/game/engine-runtime-internal` produktiv | 42.085 | 54 private Runtime-Internal-Module |
| größtes Runtime-Internal-Modul | 2.392 | `turn-runtime-resolvers.ts`, unter 3.200-LOC-Ceiling |
| `packages/engine/src/public-context.ts` | 1.827 | großer read-only PublicPayload-Vertragsknoten |
| `packages/engine/src/ability-engine/card-implementation-runtime.ts` | 2.341 | großer generischer Runtime-Orchestrator |
| `packages/engine/src/ability-engine/effect-interpreter.ts` | 1.812 | mutierender Effect-Interpreter |
| `packages/engine/src/ability-engine/definition-types.ts` | 1.878 | breite DSL-/Typfläche |
| `packages/engine/src/index.test.ts` | 3.525 | stark reduziert, bleibt Integrationsschutz |
| `packages/engine/src/game/index.test.ts` | 217 | Game-Fassade-Smokes |
| Produktive `game/* -> index` Imports | 0 | Gate hält |
| Produktive tiefe `game/* -> engine-runtime(-internal)` Imports | 0 | Gate hält |

Vergleich mit frühen Statuspunkten:

| Stand | `index.ts` LOC | Einordnung |
| --- | ---: | --- |
| STATUS-1 | 32.111 | zentraler Engine-/Host-Monolith |
| STATUS-6 nach ARCH-96 | 13.655 | Primitive-/Provider-Fläche |
| ARCH-108 | 79 | explizite Public-Fassade |
| ARCH-112 / aktueller HEAD | 79 | Fassade hält |

## D. Fortschritt seit STATUS-1, ARCH-90, ARCH-108 und ARCH-112

STATUS-1 beschrieb `index.ts` als zentrale Rules-Engine-Fläche: ApplyAction, PerformAction, LegalActions, Run, Access, Damage, Trace, Payment, PendingChoices, PublicEvent-Building und CardImplementation-Host-Primitives lagen in oder nahe dieser Datei.

ARCH-90 entfernte `performAction` aus `index.ts`. ARCH-91 bis ARCH-107 entfernten anschließend die großen Host- und Primitive-Provider-Flächen. ARCH-108 machte daraus eine explizite Public-Fassade. ARCH-109 bis ARCH-112 haben dann verhindert, dass der neue Runtime-Internal-Bereich selbst wieder aus wenigen Großdateien besteht.

Der wichtigste Architekturfortschritt ist deshalb nicht nur die LOC-Reduktion von `index.ts`, sondern die Kombination aus:

- Public-Fassade ohne Gameplay-Implementierung.
- Runtime-Fassade ohne private Bootstrap-/Hostlogik.
- Private Runtime-Internal-Module mit Domainfamilien.
- Import-Gates gegen Rückimporte und tiefe Runtime-Kopplung.
- LOC-Gates gegen neue Runtime-Internal-Monolithen.

## E. Aktuelle Public-Fassade

`packages/engine/src/index.ts` exportiert explizit aus `./game/engine-runtime`. `packages/engine/src/game/engine-runtime.ts` exportiert explizit aus `./engine-runtime-internal/public-api`. `public-api.ts` importiert `./runtime-bootstrap` wegen der einmaligen Runtime-Konfiguration und exportiert danach gezielt aus den Besitzer-Modulen.

Öffentliche Werte:

| Export | Quelle in `public-api.ts` | Risiko | Bemerkung |
| --- | --- | --- | --- |
| `getLegalActions`, `legalActionsFor` | `../legal-actions` | niedrig | öffentliche LegalAction-Fassade bleibt stabil |
| `eventVisibilityForAction`, `isHiddenInfoBarrierEvent` | `../events/build-event` | mittel | PublicEvent-/HiddenInfo-Vertrag |
| `checkWinConditions` | `../win-conditions` | niedrig | Game-End-Check |
| `quoteCorpRezCost` | `../payment` | mittel | Payment-/Rez-Vertrag |
| `createGame`, `createGameAfterSetup` | `../create-game` | niedrig | Setup-Fassade |
| `applyAction` | `../apply-action` | hoch | zentrale Action-Revalidation, aber nicht mehr in `index.ts` |
| `applyGameAction` | `../apply-game-action` | niedrig | kompatible Game-Fassade |
| `getPlayerView`, `playerViewFor` | `../player-view` | hoch | HiddenInfo-/PlayerView-Vertrag |
| `replayEvents`, `replayGameEvents` | `../replay` | hoch | Replay-/StateHash-Vertrag |
| `redactPublicEventForSide` | `../view/public-event-view` | hoch | Redaction-Vertrag |
| `hashGameState`, `hashState` | `../hash` | hoch | StateHash-Vertrag |
| `validateGameState`, `validateGameStateForDebug` | `../validation` | mittel | Debug-/Validation-Vertrag |
| `validateDeckDefinition`, `applyEffectCommands` | `./runtime-bootstrap` | mittel | Runtime-bootstrapabhängige öffentliche Helfer |
| `DEMO_CARDS`, `DEMO_CARDS_BY_ID`, `DEMO_DECKS`, `CURRENT_RULES_BASELINE` | `@netgrid/shared` | niedrig | Shared-Daten |

Öffentliche Typen werden weiterhin explizit aus `@netgrid/shared` re-exportiert: `ActionType`, `ChoiceRequest`, `CardDefinition`, `CardInstance`, `GameState`, `LegalAction`, `PlayerAction`, `PlayerView`, `PublicGameEvent`, `ReplayResult`, `StateHash` und die übrigen bisherigen Vertragsnamen. Es gibt keinen blinden `export *` aus der Runtime-Internal-Fläche.

## F. Runtime-Internal-Modulkarte

Alle produktiven Module unter `engine-runtime-internal` bleiben unter dem globalen 3.200-LOC-Gate. Die Aggregatoren sind klein; die größten Dateien sind Resolver- oder Hostfamilien, nicht Public-Fassaden.

| Datei | LOC | Rolle | Kategorie | Direkte interne Abhängigkeit | Gate | Bewertung |
| --- | ---: | --- | --- | --- | --- | --- |
| `public-api.ts` | 72 | internes Public-API-Barrel | Aggregator | `runtime-bootstrap.ts` | explizite Exports | gesund |
| `runtime-bootstrap.ts` | 21 | Bootstrap-Orchestrator | Bootstrapphase | `*-runtime-bootstrap.ts` | <=700 | gesund |
| `runtime-bootstrap-support.ts` | 1.006 | Bootstrap-Hilfen | Bootstrapphase | `runtime-delegates.ts` | <=1500 | gesund |
| `action-runtime-bootstrap.ts` | 1.003 | Action-Bootstrap | Bootstrapphase | Support, PublicEvent, Delegates | <=1500 | gesund |
| `card-runtime-bootstrap.ts` | 934 | Card-Bootstrap | Bootstrapphase | Support, Delegates | <=1500 | gesund |
| `flow-runtime-bootstrap.ts` | 1.020 | Flow-Bootstrap | Bootstrapphase | Support, Delegates | <=1500 | gesund |
| `public-event-runtime-bootstrap.ts` | 1.269 | PublicEvent-/Deck-Bootstrap | Bootstrapphase | Support, Delegates | <=1500 | beobachten |
| `state-runtime-bootstrap.ts` | 1.370 | State-Bootstrap | Bootstrapphase | Support, PublicEvent, Delegates | <=1500 | beobachten, nah am Limit |
| `runtime-delegates.ts` | 48 | Delegate-Initializer | Delegatefamilie | Delegate-/Host-/Resolvermodule | <=600 | gesund |
| `runtime-delegate-store.ts` | 1 | Delegate-Store | Delegatefamilie | keine | global <=3200 | gesund |
| `action-runtime-delegates.ts` | 548 | Action-Delegate-Bindings | Delegatefamilie | Delegate-Store | <=1200 | gesund |
| `card-runtime-delegates.ts` | 280 | Card-Delegate-Bindings | Delegatefamilie | Delegate-Store | <=1200 | gesund |
| `choice-runtime-delegates.ts` | 516 | Choice-Delegate-Bindings | Delegatefamilie | Delegate-Store | <=1200 | gesund |
| `flow-runtime-delegates.ts` | 305 | Flow-Delegate-Bindings | Delegatefamilie | Delegate-Store | <=1200 | gesund |
| `state-runtime-delegates.ts` | 680 | State-Delegate-Bindings | Delegatefamilie | Delegate-Store | <=1200 | gesund |
| `choice-hidden-zone-runtime.ts` | 21 | Choice-/HiddenZone-Aggregator | Domainbridge | Choice-/HiddenZone-Unterfamilien | <=1000 | gesund |
| `pending-choice-runtime-hosts.ts` | 589 | PendingChoice-Hostbrücke | Hostfamilie | `runtime-shared.ts` | <=1500 | gesund |
| `hidden-zone-search-runtime.ts` | 746 | Search-Hostbrücke | Hostfamilie | `runtime-shared.ts` | <=1500 | gesund |
| `hidden-zone-arrange-runtime.ts` | 302 | Arrange-Hostbrücke | Hostfamilie | `runtime-shared.ts` | <=1500 | gesund |
| `hidden-zone-nonsearch-runtime.ts` | 1.199 | NonSearch-Hostbrücke | Hostfamilie | `runtime-shared.ts` | <=1500 | beobachten |
| `hidden-zone-nonsearch-playful-ai-runtime.ts` | 309 | Playful-AI NonSearch-Brücke | Hostfamilie | `runtime-shared.ts` | <=1500 | gesund |
| `corp-zone-runtime-hosts.ts` | 778 | Corp-Zone-Choice-Brücke | Hostfamilie | `runtime-shared.ts` | <=1500 | gesund |
| `card-runtime-hosts.ts` | 17 | Card-Host-Aggregator | Aggregator | Card-Host-Unterfamilien | <=900 | gesund |
| `card-runtime-deps-hosts.ts` | 1.304 | RuntimeDeps-Hostbrücke | Hostfamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1500 | beobachten |
| `activated-card-runtime-hosts.ts` | 834 | Activated-Ability-Hostbrücke | Hostfamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1500 | gesund |
| `trigger-ability-runtime-hosts.ts` | 937 | Trigger-Ability-Hostbrücke | Hostfamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1500 | gesund |
| `card-lifecycle-runtime-hosts.ts` | 1.323 | Install/Rez/Lifecycle-Hostbrücke | Hostfamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1500 | beobachten, nah am Limit |
| `action-runtime-hosts.ts` | 17 | Action-Host-Aggregator | Aggregator | Apply, Legal, PlayBoard, ScoredEconomy | <=600 | gesund |
| `apply-action-runtime-hosts.ts` | 880 | ApplyAction-Hostbrücke | Hostfamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1400 | gesund |
| `legal-action-runtime-hosts.ts` | 969 | LegalAction-Hostbrücke | Hostfamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1400 | gesund |
| `play-board-runtime-hosts.ts` | 937 | Play-/Board-Hostbrücke | Hostfamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1400 | gesund |
| `scored-economy-runtime-hosts.ts` | 1.070 | Scored-/Economy-Hostbrücke | Hostfamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1400 | beobachten |
| `flow-runtime-hosts.ts` | 19 | Flow-Host-Aggregator | Aggregator | Run, Access, DamageTrace, InstallRez, EncounterMovement | <=700 | gesund |
| `run-flow-runtime-hosts.ts` | 900 | RunFlow-Hostbrücke | Hostfamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1400 | gesund |
| `access-flow-runtime-hosts.ts` | 748 | AccessFlow-Hostbrücke | Hostfamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1400 | gesund |
| `damage-trace-runtime-hosts.ts` | 984 | Damage-/Trace-Hostbrücke | Hostfamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1400 | gesund |
| `install-rez-runtime-hosts.ts` | 810 | Install-/Rez-Hostbrücke | Hostfamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1400 | gesund |
| `encounter-movement-runtime-hosts.ts` | 1.065 | Encounter-/Movement-Hostbrücke | Hostfamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1400 | beobachten |
| `state-runtime-services.ts` | 19 | State-Service-Aggregator | Aggregator | Lookup, Zone, Economy, CounterTurn, StrengthCost | <=700 | gesund |
| `lookup-runtime-services.ts` | 1.114 | Lookup-Servicebrücke | Servicefamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1400 | beobachten |
| `zone-runtime-services.ts` | 831 | Zone-Servicebrücke | Servicefamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1400 | gesund |
| `economy-runtime-services.ts` | 914 | Economy-Servicebrücke | Servicefamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1400 | gesund |
| `counter-turn-runtime-services.ts` | 800 | Counter-/Turn-Servicebrücke | Servicefamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1400 | gesund |
| `card-strength-cost-runtime-services.ts` | 850 | Strength-/Cost-Servicebrücke | Servicefamilie | Choice, Lifecycle, RuntimeShared, TurnCorp | <=1400 | gesund |
| `lifecycle-runtime.ts` | 541 | Lifecycle-Primitives-Brücke | Domainbridge | `runtime-shared.ts` | global <=3200 | gesund |
| `turn-corp-runtime.ts` | 542 | Turn-/Corp-Primitives-Brücke | Domainbridge | `runtime-shared.ts` | global <=3200 | gesund |
| `runtime-shared.ts` | 30 | geteilte Runtime-Typen/Hilfen | Shared | keine | global <=3200 | gesund |
| `card-runtime-resolvers.ts` | 1.541 | Card-nahe Runtime-Resolver | Resolverfamilie | Action, Card, Choice, Flow, State, Lifecycle | global <=3200 | beobachten |
| `choice-hidden-zone-resolvers.ts` | 1.411 | Choice-/HiddenZone-Resolver | Resolverfamilie | Action, Card, Choice, Flow, State, Lifecycle | global <=3200 | beobachten |
| `corp-runtime-resolvers.ts` | 1.972 | Corp-nahe Runtime-Resolver | Resolverfamilie | Action, Card, Choice, Flow, State, Lifecycle | global <=3200 | später splitten |
| `state-corp-runtime-resolvers.ts` | 1.275 | State-/Corp-Resolverbrücke | Resolverfamilie | viele Resolverfamilien | global <=3200 | beobachten |
| `state-runtime-resolvers.ts` | 2.021 | State-nahe Runtime-Resolver | Resolverfamilie | Action, Card, Choice, Flow, State, Lifecycle | global <=3200 | später splitten |
| `turn-runtime-resolvers.ts` | 2.392 | Turn-nahe Runtime-Resolver | Resolverfamilie | Action, Card, Choice, Flow, State, Lifecycle | global <=3200 | später splitten |
| `index.ts` | 1 | internes Barrel | Aggregator | `public-api.ts` | global <=3200 | gesund |

Die aktuelle Struktur ist akzeptabel. Die Resolverfamilien `turn-runtime-resolvers.ts`, `state-runtime-resolvers.ts` und `corp-runtime-resolvers.ts` sind die größten internen Kandidaten, aber sie liegen unter dem Gate und sind kein Anlass für einen weiteren mechanischen Sofortsplit.

## G. LOC- und Import-Gates

Existierende Gates in `runtime-module-size.test.ts`:

- `packages/engine/src/index.ts <= 150 LOC`
- `packages/engine/src/game/engine-runtime.ts <= 150 LOC`
- optional wiederauftauchendes `runtime-implementation.ts <= 200 LOC`
- `choice-hidden-zone-runtime.ts <= 1000 LOC`
- Choice-/HiddenZone-Unterfamilien jeweils `<= 1500 LOC`
- `runtime-bootstrap.ts <= 700 LOC`
- Bootstrap-Phasen jeweils `<= 1500 LOC`
- `runtime-delegates.ts <= 600 LOC`
- `card-runtime-hosts.ts <= 900 LOC`
- `action-runtime-hosts.ts <= 600 LOC`
- `flow-runtime-hosts.ts <= 700 LOC`
- `state-runtime-services.ts <= 700 LOC`
- Host-/Service-Unterfamilien überwiegend `<= 1400 LOC`
- Card-Host-Unterfamilien `<= 1500 LOC`
- Delegate-Unterfamilien `<= 1200 LOC`
- global: jedes produktive `engine-runtime-internal/*.ts` Modul `<= 3200 LOC`
- keine blinden Public-Facade-Reexports
- keine produktiven Imports aus Public- oder Runtime-Fassaden in tiefe Fachmodule

Import-Gates:

- Produktive `game/* -> index` Imports: 0.
- Produktive tiefe `game/* -> engine-runtime.ts` Imports: 0.
- Produktive tiefe `game/* -> engine-runtime-internal/*` Imports: 0.
- Runtime-Internal-Module importieren nicht aus `index.ts` oder `../engine-runtime`.
- Public-Fassaden importieren nur in erlaubter Richtung.

Export-Gates:

- `index.ts` enthält explizite Value- und Type-Exportlisten.
- `game/engine-runtime.ts` enthält explizite Value- und Type-Exportlisten.
- `public-api.ts` enthält explizite Exporte aus Besitzer-Modulen.
- Kein `export * from "./game/engine-runtime"`.
- Kein `export * from "./engine-runtime-internal"`.
- Kein `export * from "./runtime-implementation"`.

Fehlende oder mögliche Folge-Gates:

| Potenzielles Gate | Empfehlung | Grund |
| --- | --- | --- |
| spezifisches Resolver-Gate für `turn-runtime-resolvers.ts`, `state-runtime-resolvers.ts`, `corp-runtime-resolvers.ts` | später prüfen | diese Dateien sind unter 3.200, aber deutlich größer als Hostaggregatoren |
| `public-context.ts` LOC-Gate | ja, vor PublicContext-Phase | 1.827 LOC und PublicPayload-Vertragsrisiko |
| `ability-engine/card-implementation-runtime.ts` LOC-Gate | ja, vor AbilityEngine-Phase | 2.341 LOC und breite RuntimeDeps |
| `ability-engine/effect-interpreter.ts` LOC-Gate | ja, vor Effect-Interpreter-Phase | 1.812 LOC mutierende DSL-Ausführung |
| `definition-types.ts` Typflächen-Gate | nur mit Vorsicht | LOC allein ist bei Typvokabular weniger aussagekräftig |
| PublicPayload-Feld-Snapshot-Gate | ja, vor PublicContext-Split | schützt Web/Chronik/Replay |

## H. Public API Audit

Die Public API blieb kompatibel: öffentliche Namen werden weiter aus `@netgrid/engine` exponiert, aber die Implementierung liegt nicht mehr im Package-Root.

| Exportgruppe | Öffentlich? | Quelle | In `index.ts` exponiert? | Risiko | Bemerkung |
| --- | --- | --- | --- | --- | --- |
| Game-Erzeugung | ja | `game/create-game` via `public-api.ts` | ja | niedrig | `createGame`, `createGameAfterSetup` |
| Action-Ausführung | ja | `game/apply-action` | ja | hoch | `applyAction` bleibt zentrale Revalidation |
| LegalActions | ja | `game/legal-actions` | ja | hoch | ActionID-/Ordering-Vertrag |
| PlayerView | ja | `game/player-view` | ja | hoch | HiddenInfo-Vertrag |
| PublicEvent-Redaction | ja | `game/view/public-event-view` | ja | hoch | Redaction-Vertrag |
| Replay | ja | `game/replay` | ja | hoch | Replay-/StateHash-Vertrag |
| StateHash | ja | `game/hash` | ja | hoch | deterministische Hashes |
| Validation | ja | `game/validation` | ja | mittel | Debug und Runtimevalidierung |
| Payment Quote | ja | `game/payment` | ja | mittel | `quoteCorpRezCost` |
| Runtime Commands | ja | Runtime-Bootstrap | ja | mittel | `applyEffectCommands`, `validateDeckDefinition` |
| Shared-Daten | ja | `@netgrid/shared` | ja | niedrig | Demos und RulesBaseline |
| Shared-Typen | ja | `@netgrid/shared` | ja | mittel | Type-only Public Contract |

Es wurden keine versehentlichen Exportentfernungen gefunden. Die Fassaden sind explizit, nicht blind.

## I. Importgrenzen

Aktueller Befund:

| Grenze | Befund | Bewertung |
| --- | --- | --- |
| produktive `game/* -> index` Imports | 0 | erfüllt |
| produktive tiefe `game/* -> engine-runtime.ts` Imports | 0 | erfüllt |
| produktive tiefe `game/* -> engine-runtime-internal/*` Imports | 0 | erfüllt |
| `engine-runtime-internal/* -> index` Imports | 0 | erfüllt |
| Testimports aus `game/*` zur Runtime-Fassade | vorhanden | akzeptabel für Fassade- und Integrationssmokes |

Diese Importgrenzen sind inzwischen wichtiger als weitere LOC-Reduktion. Sie verhindern, dass die Public-Fassade wieder zur Runtime-Abhängigkeit von Fachmodulen wird.

## J. Direct-ID- / `onr_v1_`-Restkarte

| Bereich | Treffer | Einordnung |
| --- | ---: | --- |
| `packages/engine/src/index.ts` | 0 | sauber |
| `packages/engine/src/game/engine-runtime.ts` | 0 | sauber |
| `packages/engine/src/game/engine-runtime-internal` | 0 | sauber |
| `packages/engine/src/public-context.ts` | 0 | sauber |
| `packages/engine/src/game` gesamt | 204 | davon 32 produktiv, Rest Tests |
| `packages/engine/src/game` produktiv ohne Runtime-Internal | 32 | `view/card-view.ts`, `corp/scored-agenda-abilities.ts`, `corp/trace-damage-abilities.ts` |
| `packages/engine/src/mechanics` | 98 | bewusst verbliebene Mechanics-Kataloge |
| `packages/engine/src/compatibility` | 50 | Runtime-/Payload-Kompatibilität |
| `packages/engine/src/ability-engine` | 42 | nur `printed-subroutine-implementations.test.ts`; produktiv 0 |

Bewertung: Die Public-Fassade, Runtime-Fassade, Runtime-Internal-Fläche, PublicContext und produktive AbilityEngine bleiben frei von direkten ONR-v1-IDs. Die verbleibenden produktiven IDs liegen in Fach-/View-/Compatibility-/Mechanics-Schichten und brauchen eigene Folge-Gates, nicht einen Runtime-Internal-Split.

## K. Verbleibende technische Schulden

| Kandidat | LOC | Risiko | Strukturgewinn | Vertragsrisiko | Empfohlene Phase | Nächstes Ticket |
| --- | ---: | --- | --- | --- | --- | --- |
| `public-context.ts` | 1.827 | hoch | hoch | sehr hoch: PublicPayload, PlayerView, PublicEvent, Replay, Web | später, gezielt | PublicContext read-only Field-Family Audit |
| `ability-engine/card-implementation-runtime.ts` | 2.341 | hoch | hoch | hoch: RuntimeDeps, Ability-Limits, Payload-Merge | später, gezielt | AbilityEngine Runtime Decomposition Audit |
| `ability-engine/effect-interpreter.ts` | 1.812 | hoch | hoch | hoch: mutierende Effektsemantik | später, gezielt | Effect Interpreter Vocabulary/Execution Split Audit |
| `ability-engine/definition-types.ts` | 1.878 | mittel | mittel | mittel: Typvertragsfläche | später | Ability DSL Type Surface Audit |
| `game/damage/damage-core.ts` | 2.313 | hoch | hoch | hoch: Damage prevention, flatline, hidden info | später | DamageCore internal split audit |
| `game/access/access-effect-handlers.ts` | 1.444 | mittel/hoch | mittel | hoch: AccessEffect, Ambush, Payment, HiddenInfo | später | AccessEffect family split audit |
| große `game/run/*` Module | bis 1.247 | mittel | mittel | mittel/hoch: Run/Access/Trace/Payment-Folgefenster | später | Run domain module size audit |
| große `game/hidden-zone/*` Module | bis 921 | hoch | mittel | hoch: PendingChoice, HiddenInfo, Replay | später | HiddenZone choice family audit |
| große `game/turn/*` Module | bis 1.224 | mittel | mittel | mittel: LegalAction ordering, ActionIDs | später | Turn action generation audit |
| `index.test.ts` | 3.525 | niedrig/mittel | mittel | niedrig, wenn test-only | später | Engine integration test split |
| Mechanics-ID-Kataloge | 98 IDs | mittel | mittel | niedrig/mittel | später | Mechanics ID catalog audit |
| Compatibility-Marker | 50 IDs | mittel | niedrig/mittel | hoch bei Umbenennung | nicht ohne Migration | Compatibility marker migration readiness |
| `game/view/card-view.ts` | 1.067, 14 produktive IDs | mittel | mittel | hoch: PlayerView/Web | später | CardView direct-ID audit |
| `apps/web/app/page.tsx` | nicht in diesem Audit gemessen | mittel/hoch | hoch | hoch: UI-Vertrag | separate Web-Phase | Web app shell decomposition audit |

## L. Bewertung: Ist die Index-/Runtime-Restrukturierungsphase abgeschlossen?

Ja. Die Index-/Runtime-Restrukturierungsphase ist abgeschlossen.

Begründung:

- `index.ts` ist keine Engine-/Host-/Primitive-Fläche mehr.
- `game/engine-runtime.ts` ist eine explizite Runtime-Fassade.
- `runtime-implementation.ts` ist gelöscht.
- Die vorher breiten Runtime-Internal-Fassaden wurden in Choice/HiddenZone, Card, Bootstrap, Delegate, Action, Flow und State-Service-Familien zerlegt.
- Import-Gates verhindern Rückkopplung aus Fachmodulen zur Public-Fassade oder Runtime-Internal-Fläche.
- LOC-Gates verhindern neue 3k+-Runtime-Internal-Monolithen.
- Es gibt 0 produktive `game/* -> index` Imports.
- Es gibt 0 produktive tiefe `game/* -> engine-runtime(-internal)` Imports.

## M. Warum weitere mechanische Runtime-Splits aktuell nicht priorisiert sind

Ein weiterer mechanischer Runtime-Internal-Split würde aktuell vor allem Modulgrenzen verfeinern, aber nicht die nächste fachliche Schuld adressieren. Die größten verbleibenden Risiken liegen nicht in der Public- oder Runtime-Fassade, sondern in vertragsnahen Domainflächen:

- PublicPayload-/PlayerView-/PublicEvent-Aufbau in `public-context.ts`.
- AbilityEngine Runtime und Effect Interpreter.
- DamageCore.
- AccessEffect-Handler.
- große Run-/HiddenZone-/Turn-Fachmodule.
- Test- und View-Struktur.

Mechanisch weitere Runtime-Internal-Dateien zu halbieren wäre deshalb wahrscheinlich ein geringer Qualitätsgewinn mit hohem Review-Rauschen. Die nächste Phase sollte eine fachlich begründete Boundary mit eigenem Akzeptanzkatalog wählen.

## N. Nächste mögliche Phasen mit Bewertung

| Phase | Nutzen | Risiko | Empfehlung |
| --- | --- | --- | --- |
| A. PublicContext read-only Field-Family Audit/Split | hoch, PublicPayload-Verständlichkeit | sehr hoch | zuerst als Audit, Code erst mit Snapshot-/HiddenInfo-Gates |
| B. AbilityEngine Runtime/Effektinterpreter-Decomposition | hoch, CardImplementation-Wartbarkeit | hoch | guter nächster Architekturpfad nach Audit |
| C. DamageCore/Internal AccessEffect Split | mittel/hoch | hoch | sinnvoll, aber mit Damage-/Access-Regressionen |
| D. Teststruktur/Index-Test-Monolith-Split | mittel | niedrig/mittel | guter Wartbarkeitshebel ohne Gameplay-Risiko |
| E. Mechanics/Compatibility ID-Katalog-Audit | mittel | mittel | sinnvoll vor ID-Migration, nicht als Nebenprodukt |
| F. weiterer Runtime-Internal-Split | niedrig/mittel | niedrig/mittel | aktuell nicht priorisieren |

## O. Empfohlene nächste Phase und konkreter nächster Auftrag

Empfohlene nächste Phase: `PublicContext read-only Field-Family Audit`.

Begründung:

- `public-context.ts` ist mit 1.827 LOC der größte vertragsnahe read-only Monolith.
- Die Datei enthält 0 direkte ONR-v1-IDs und ist read-only, also prinzipiell besser kontrollierbar als Payment, Zone, RNG oder Damage.
- Gleichzeitig ist sie PublicPayload-/PublicEvent-/PlayerView-/Replay-/Web-nah. Deshalb sollte zuerst ein Audit mit Snapshot- und Akzeptanzkriterien entstehen, nicht sofort ein Code-Split.

Konkreter nächster Auftrag:

```text
ENGINE-STATUS-8-public-context-field-family-readiness

Ziel:
Audit von public-context.ts als read-only PublicPayload-Vertragsfläche.

Nicht ändern:
PublicPayload-Felder, PublicEvent, PlayerView, ActionIDs, PendingChoice-Werte, Replay, StateHash, Web-ActionBoard/Chronik.

Liefern:
Feldfamilienkarte, HiddenInfo-Risiko, Web-/Replay-Verbraucherkarte, Snapshot-/Regression-Gates, Entscheidung ob und wie ein späterer Field-Family-Split sicher ist.
```

Alternative, wenn die nächste Phase code-näher sein soll: `ENGINE-STATUS-8-ability-engine-runtime-decomposition-readiness` für `card-implementation-runtime.ts` und `effect-interpreter.ts`.

## P. Nicht als nächstes tun

- Kein weiterer mechanischer Runtime-Internal-Split auf Verdacht.
- Kein neues Sammelmodul `state-primitives`, `runtime-primitives` oder `engine-services`.
- Keine PublicPayload-Feldmigration.
- Keine PendingChoice-/ActionID-/RNG-Purpose-Umbenennung.
- Keine Zone-, Payment-, Draw-/Shuffle- oder RNG-Migration im selben Schritt.
- Keine Damage-/Trace-/Access-Neuarchitektur als Nebenprodukt.
- Keine Web-/Chronik-Anpassung ohne PublicPayload-Vertrag.
- Keine Compatibility-Marker-Löschung ohne Replay-/PendingChoice-Migration.

## Q. Akzeptanzkriterien für künftige interne Domain-Splits

- Der Split folgt einer fachlichen Familie, nicht nur einer LOC-Halbierung.
- Neues Modul importiert nicht aus `index.ts`, `game/engine-runtime.ts` oder fremden Runtime-Internal-Fassaden.
- PublicPayload, PublicEvent, PlayerView, ActionID, PendingChoice, RNG, Replay und StateHash bleiben unverändert.
- Bestehende Host-Interfaces werden kleiner oder klarer, nicht breiter.
- Keine zweite Engine für Payment, Damage, Trace, Access, Run, HiddenZone oder AbilityRuntime.
- Modulnahe Tests sichern mindestens Delegation, Revalidation und repräsentative Verhaltensfälle.
- LOC-Gates werden ergänzt, wenn neue Familien nahe an bestehenden Limits starten.

## R. Akzeptanzkriterien für PublicContext-Splits

- Vorher PublicPayload-Feldinventar mit Feldfamilien.
- Vorher Verbraucherkarte für Web-ActionBoard, Chronik, PlayerView, PublicEvent und Replay.
- Keine Feldnamenänderung und keine Formänderung.
- Keine Änderung an `hiddenZoneAction`, `specialZoneReason`, `encounterTaxSource`, `randomPurpose`, Legacy-`v19xx`-/`p3_`-Feldern.
- Snapshot- oder gezielte Assertions für repräsentative Actionfamilien.
- HiddenInfo-Regressionen für HQ, R&D, Archives, Hidden Resources, PendingChoices und Redaction.
- Web- und Server-Typechecks grün.
- Split entlang read-only Feldfamilien, nicht in ein neues 1.800-LOC-Sammelmodul.

## S. Akzeptanzkriterien für AbilityEngine-Splits

- Keine Änderung an CardImplementation-DSL-Semantik.
- Keine Änderung an RuntimeDeps-Key-Namen ohne eigenes Migrationsgate.
- Keine Karten-ID-Sonderfälle in generischen AbilityEngine-Modulen.
- Effect-Ausführung bleibt geordnet und nutzt bestehende Host-Callbacks für Damage, Draw, Payment, Trash, Trace, Run und HiddenZone.
- Ability-Limits, Lifecycle-Hooks und Payload-Merging bleiben stabil.
- Tests müssen `card-implementation-runtime`, `effect-interpreter`, CardImplementation-Coverage und repräsentative Engine-Flows abdecken.

## T. Akzeptanzkriterien für Teststruktur-Splits

- Keine Produktionscodeänderung im selben Commit.
- Assertion-Inhalte bleiben unverändert.
- Cross-Flow-Integrationsschutz bleibt erhalten.
- Verschobene Tests landen in fachlich auffindbaren Suites.
- `index.test.ts` darf kleiner werden, aber nicht als Schutzwall entfernt werden.
- Betroffene Suites und `src/index.test.ts` laufen grün.

## U. Risiken

| Risiko | Bewertung | Gegenmaßnahme |
| --- | --- | --- |
| Runtime-Internal-Resolver wachsen trotz Gates weiter | mittel | spezifische Resolver-Gates bei nächster Änderung prüfen |
| PublicContext-Split leakt HiddenInfo oder ändert Payloadfelder | hoch | erst Audit, dann Snapshot-/HiddenInfo-Gates |
| AbilityEngine-Split dupliziert Effect-Ausführung | hoch | Host-Callback-Prinzip beibehalten, keine zweite Runtime |
| Compatibility-Marker werden aus Cleanup-Motivation geändert | hoch | P3.71-Stabilität bleibt bindend |
| Teststruktur-Split verliert Cross-Flow-Schutz | mittel | große Integrationsfälle nicht blind zerlegen |
| View-/Mechanics-ID-Reste werden als Runtime-Problem missverstanden | mittel | eigene ID-Katalog-/View-Audits |

## V. Checkliste für künftige Agents

- Vor jeder Architekturarbeit Wiki-Pflichtseiten und aktuellen Architekturstatus lesen.
- Vor Code-Splits prüfen, ob die Zielschuld fachlich oder nur mechanisch ist.
- `index.ts` und `game/engine-runtime.ts` bleiben reine explizite Fassaden.
- Keine produktiven `game/* -> index` Imports einführen.
- Keine tiefen produktiven Imports aus `game/*` nach `engine-runtime` oder `engine-runtime-internal`.
- PublicPayload, PlayerView, PublicEvent, PendingChoice, ActionIDs, Replay und StateHash als Verträge behandeln.
- Runtime-Internal-Änderungen an `runtime-module-size.test.ts` und `runtime-domains.test.ts` messen.
- Neue LOC-Gates ergänzen, wenn ein Split neue große Familien erzeugt.
- ONR-v1-IDs nicht pauschal entfernen; erst zwischen Mechanics, Compatibility, View und Tests klassifizieren.
- Bei PublicContext und AbilityEngine zuerst Audit/Readiness liefern, dann Code-Schnitt.
