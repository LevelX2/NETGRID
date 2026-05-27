# ENGINE-STATUS-6: Index-Primitive-Provider-Readiness nach ARCH-96

## Kurzfazit

Nach ARCH-96 ist `packages/engine/src/index.ts` nicht mehr die zentrale Action-, LegalAction-, Run- oder Access-Engine. Die großen Host-Kompositionen liegen in `game/`-Boundaries, `performAction` ist aus `index.ts` entfernt und produktive `game/* -> index`-Imports bleiben bei 0.

Die verbleibende Architekturspannung liegt jetzt bei Primitive-Providern und vertragsnahen Restkanten:

- Read-only Card-/Server-/State-Lookups sind der beste nächste Code-Schnitt.
- Mutierende Zone-, Payment-, Click-, Draw- und Random-Primitives sind StateHash-/Replay-/HiddenInfo-näher und brauchen engere Akzeptanzkriterien.
- PendingChoice/HiddenZone- und PublicContext-Flächen bleiben Vertragsflächen und sollen nicht als Reflexschnitt geöffnet werden.
- Ein weiterer reiner LegalAction-Host-Schnitt ist aktuell nicht der größte Hebel.

Empfohlener ARCH-97-Schnitt: `ENGINE-ARCH-97-card-server-lookup-primitives-boundary`.

## A. Ausgangspunkt, Branch und Commits

| Punkt | Stand |
| --- | --- |
| Worktree | `C:\Projekte\NETGRID-ability-engine-refactor` |
| Branch | `codex/card-implementation-next-task` |
| Worktree zu Beginn | sauber |
| ARCH-96 | `d57c21ef9040983d63b8a8b7f8b358bfdc2e7253` |
| ARCH-95 | `96e06f5a7e92acfa9a978487d1233be7ccff43da` |
| ARCH-94 | `d4ec2e7d69592e5974c2e778a37934c742ccdb4a` |
| STATUS-5 | `0d7763140131cafbad65b819c10a02484770e33d` |
| STATUS-4 | `145222c80171fb622e1755bbd8a94bee1bdf9c4c` |

ARCH-96 hat die Run-/Access-/Encounter-LegalAction-Host-Komposition nach `packages/engine/src/game/run/run-access-legal-action-hosts.ts` verlagert. `index.ts` blieb bewusst Eigentümer konkreter Primitive-Provider, Thin-Forwarder zu `runFlow`/`accessFlow`, PublicContext, PendingChoice, Zone-/Payment-Primitives und ActionID-/Payload-/Ordering-Builder.

## B. Methodik und gelesene Quellen

Gelesen wurden die Wiki-Pflichtquellen, `agents/architecture-review-agent.md`, die STATUS-/ARCH-Dokumente und die aktuellen Code-Boundaries.

Architekturquellen:

- `docs/architecture/engine-index-host-composition-post-perform-action.md`
- `docs/architecture/engine-perform-action-dispatcher-readiness-post-arch84.md`
- `docs/architecture/engine-apply-action-boundary-analysis.md`
- `docs/architecture/engine-index-runtime-readiness-post-arch74.md`
- `docs/architecture/ability-engine/pending-choice-replay-marker-stability-p3-71.md`
- `docs/architecture/ability-engine/ability-engine-restructuring-status-post-arch52.md`
- `docs/architecture/ability-engine/ability-engine-restructuring-status-current.md`

Codequellen:

- `packages/engine/src/index.ts`
- `packages/engine/src/public-context.ts`
- `packages/engine/src/game/apply/perform-action.ts`
- `packages/engine/src/game/apply/apply-action-hosts.ts`
- `packages/engine/src/game/events/event-context-hosts.ts`
- `packages/engine/src/game/legal-action-hosts.ts`
- `packages/engine/src/game/turn/main-action-hosts.ts`
- `packages/engine/src/game/run/run-access-legal-action-hosts.ts`
- zentrale Module unter `game/turn`, `game/run`, `game/access`, `game/trace`, `game/damage`, `game/corp`, `game/hidden-zone`, `game/install`, `game/rez`, `game/economy`, `game/abilities`, `game/card-implementation`, `game/play`, `game/board`, `game/payment`, `game/view`, `ability-engine`, `compatibility` und `mechanics`.

Messung erfolgte mit LOC-Zählung, Funktionsspan-Zählung, Import-Suche, Host-/Primitive-Suche und `onr_v1_`-Trefferzählung.

## C. Kernmesswerte

| Metrik | Stand nach ARCH-96 |
| --- | ---: |
| `packages/engine/src/index.ts` | 13.655 LOC |
| STATUS-1-Ausgangswert `index.ts` | 32.111 LOC |
| Reduktion seit STATUS-1 | ca. 18.456 LOC / ca. 57,5 % |
| `packages/engine/src/public-context.ts` | 1.826 LOC |
| `publicContextForAction` | ca. 1.766 LOC |
| `packages/engine/src/index.test.ts` | 3.650 LOC |
| Produktive `game/* -> index` Imports | 0 |
| Testimports `game/*.test.ts -> index` | 72 |
| Function-Declarations in `index.ts` | 486 |
| Host-/Factory-nahe Functions in `index.ts` | ca. 61 |
| getrackte zentrale Primitive-Funktionen in `index.ts` | 30 |

Direkte `onr_v1_`-Treffer:

| Bereich | Treffer |
| --- | ---: |
| `index.ts` | 0 |
| `public-context.ts` | 0 |
| `game/` | 198 |
| `mechanics/` | 98 |
| `compatibility/` | 50 |

Die `onr_v1_`-Reste liegen nicht im Public-API-Root oder PublicContext, sondern in Fach-, Mechanik- und Kompatibilitätsmodulen. Das ist eine akzeptable Lage; für künftige Mechanik-/Kompatibilitätsbereinigung ist es aber weiter messbar.

## D. Fortschritt seit STATUS-1, STATUS-5 und ARCH-96

STATUS-1 beschrieb `index.ts` noch als zentrale Host-/Engine-Fläche für ApplyAction, LegalActions, Turnflow, Runflow, Access, Payment, Damage, Trace, PendingChoices und CardImplementation-Host-Primitives.

Seit STATUS-5 wurden weitere zentrale Knoten entfernt:

- ARCH-91: Corp Operation Resolution nach `game/play/corp-operation-resolution.ts`.
- ARCH-92: ApplyAction-/PerformAction-/EventHost-Konfiguration nach `game/apply/apply-action-hosts.ts`.
- ARCH-93: EventContext-/PublicContextDeps-Wiring nach `game/events/event-context-hosts.ts`.
- ARCH-94: LegalAction-Root-Komposition nach `game/legal-action-hosts.ts`.
- ARCH-95: Corp-/Runner-MainAction-Host-Komposition nach `game/turn/main-action-hosts.ts`.
- ARCH-96: Run-/Access-/Encounter-LegalAction-Host-Komposition nach `game/run/run-access-legal-action-hosts.ts`.

Die Datei ist damit eine Public-API- und Primitive-Provider-Fläche. Weitere Reduktion darf nicht durch breite Host-Objekte erreicht werden, sondern braucht klar klassifizierte Primitive-Ownership.

## E. Aktuelle `index.ts`-Bereichskarte

| Bereich | Hauptfunktion | Art | Aktuelle Caller | Ziel / Bleibt | Move-ready | Risiko | Möglicher ARCH-Schnitt |
| --- | --- | --- | --- | --- | --- | --- | --- |
| Public API / Re-Exports | `createGame`, `applyAction`, `applyGameAction`, `getLegalActions`, `getPlayerView`, `replayEvents`, Validation, Hash | Public API | externe Pakete, Tests | bewusst in `index.ts` | nein | niedrig | keiner |
| Read-only Lookup Primitives | `definitionFor`, `mustInstance`, `mustServer`, installed-card/server/root queries, subtype-/agenda-/score helpers | liest State | fast alle Host-Cluster | `game/state` oder `game/cards` | ja, eng | niedrig/mittel | ARCH-97 Card/Server Lookup |
| Mutable Zone Primitives | `removeFromAllZones`, trash-to-heap/archives, hosted movement, special zones | mutiert State | Run, Access, Install, Board, HiddenZone | später eigene Boundary | nein | hoch | erst Readiness-Audit |
| Payment/Credit/Click Primitives | `spendCredits`, `spendClick`, `credits`, restricted/hosted credits | mutiert State | Economy, Run, Install, Rez, Access | später `game/payment` | teilweise | mittel/hoch | nach Lookup oder Audit |
| Draw/Shuffle/Random Primitives | `drawRunnerCards`, `drawCorpCards`, `nextRandom`, `shuffleStateIds` | mutiert State/RNG | Events, HiddenZone, Run, Replay-nahe Pfade | später eigene Boundary | nein | hoch | RNG-/Draw-Audit |
| Turn/Flag/Counter Primitives | `ensureRunnerTurnFlags`, `ensureCorpTurnFlags`, card counters, action debt | mutiert State | nahezu alle Fachmodule | später, gruppiert | teilweise | mittel/hoch | Counter/Flag-Audit |
| PendingChoice/HiddenZone Hosts | `pendingChoiceResolutionHost`, hidden-zone handler hosts | Hostbau + Vertragswerte | `performAction`, choices, HiddenZone | später | teilweise | hoch | Host-Komposition ohne Werte-Move |
| CardImplementation/Ability Hosts | RuntimeDeps root, activated, trigger, ability bridges | Hostbau + Runtime-Kanten | AbilityEngine, PerformAction, Trigger | später | teilweise | mittel/hoch | Host-Bridge-Boundary |
| PublicContext/Event/PublicView | PublicContext primitive providers, EventContext schon bewegt | read-only Vertragsfläche | EventBuilder, PlayerView, Replay | bewusst später | nein | hoch | PublicContext-Audit, kein Feldsplit |
| Tests | `index.test.ts`, module tests, Integrationstests | Regression | Testlauf | teststrukturell möglich | ja | niedrig | Teststruktur, nicht Produktionscode |

## F. Primitive-Provider-Audit

| Primitive / Familie | LOC / Größe | Art | Aktuelle Nutzung | Lokale Helper-Kopplung | Vertragsrisiko | ARCH-97 geeignet? | Zielmodul | Risiko |
| --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| `definitionFor` | 7 | read-only | fast alle Fachhosts | `mustInstance`, `DEMO_CARDS_BY_ID` | niedrig | ja | `game/state/card-server-lookup.ts` | niedrig |
| `mustInstance` | 8 | read-only/assert | fast alle Fachhosts | keine | niedrig | ja | `game/state/card-server-lookup.ts` | niedrig |
| `mustServer` | 5 | read-only/assert | Run, Access, Install, Rez, Board | `state.corp.servers` | niedrig | ja | `game/state/card-server-lookup.ts` | niedrig |
| `mustRun` | klein | read-only/assert | Run/Access/Encounter | keine | niedrig | ja, optional | `game/state/run-state-lookup.ts` oder Lookup-Modul | niedrig |
| installed-card/root/server queries | verteilt | read-only | LegalAction, Run, Install, Rez, View-nahe Hosts | `definitionFor`, `mustServer` | mittel | ja, selektiv | `game/state/card-server-lookup.ts` | mittel |
| subtype/agenda/score helpers | verteilt | read-only | Run, scoring, CardImplementation | CardImplementation definitions | mittel | teilweise | `game/cards/card-query.ts` | mittel |
| cost quote read-only helpers | verteilt | read-only mit Payment-Nähe | Install/Rez/Run | Payment/revalidation | mittel | nur eng | später Payment/Quote boundary | mittel |
| `removeFromAllZones` | 30 | mutierend | Zone movement, trash, special zones | installed lists, special zones | Replay/StateHash | nein | später `game/zones` | hoch |
| `trashRunnerInstalledCardToHeap` | 51 | mutierend | Access, Run, Install, CardImplementation | hosting, counters, payload context | HiddenInfo/Replay | nein | später `game/zones` | hoch |
| `trashCorpInstalledCardToArchives` | 65 | mutierend | Access, Run, Rez, scored effects | server/root/ice cleanup | PublicPayload/Replay | nein | später `game/zones` | hoch |
| `spendCredits` | 12 | mutierend | Payment/Run/Install/Rez/Access | `credits` | StateHash/revalidation | später | `game/payment` | mittel |
| `spendClick` | 16 | mutierend | Turn/economy/play/start-run | click semantics | Action legality | später | `game/turn` oder `game/payment` | mittel |
| `credits` | klein | mutierend | gain/loss economy | side balances | StateHash | später | `game/economy` | mittel |
| `drawRunnerCards` | 20 | mutierend | events, setup, hidden-zone effects | card movement/payload summaries | HiddenInfo/Replay | nein | später draw audit | hoch |
| `drawCorpCards` | 3 | mutierend | corp draw effects | HQ/R&D movement | HiddenInfo/Replay | nein | später draw audit | hoch |
| `nextRandom` | 12 | mutierend RNG | random access/discard/dice | randomCounter | Replay/StateHash | nein | RNG audit first | hoch |
| `shuffleStateIds` | 13 | mutierend RNG record | stack/R&D/shuffle effects | RandomDrawRecords | Replay/StateHash | nein | RNG audit first | hoch |
| card counters | mehrere | mutierend | counters, viruses, recurring credits | card instances | PublicPayload/StateHash | später | `game/counters` | mittel/hoch |
| `ensureRunnerTurnFlags` | 78 | mutierend initializer | Run, economy, card effects | many flags | Replay semantics | später | `game/turn` | mittel/hoch |
| `ensureCorpTurnFlags` | 14 | mutierend initializer | Corp turn/effects | flags | Replay semantics | später | `game/turn` | mittel |
| `ensureSpecialZones` | klein | mutating initializer | special zones, hidden-zone effects | state shape | PublicPayload | nein | zone audit | hoch |

Bewertung: Der read-only Lookup-Schnitt ist der einzige produktive nächste Schritt mit gutem Risiko-Nutzen-Verhältnis. Er darf aber nicht alle "query-like" Funktionen blind mitnehmen; cost quotes, hidden-info-sensitive reveal helpers und CardImplementation runtime lookups brauchen klare Grenzen.

## G. Host-Composition-Rest-Audit

| Cluster | Ort | LOC in `index.ts` | Hängt an Primitives | Nur Wiring? | Move-ready | Risiko | Empfehlung |
| --- | --- | ---: | --- | --- | --- | --- | --- |
| `pendingChoiceResolutionHost` | `index.ts` | 95 | lookup, hidden-zone, trace, run/access, zone, choices | gemischt | später | hoch | nach eigenem PendingChoice-/HiddenZone-Scope |
| `gameCardImplementationRuntimeDepsHost` | `index.ts` | 65 Function, breite create-call-Fläche | lookup, payment, zone, draw, random, hidden-zone | gemischt | teilweise | mittel/hoch | nicht ARCH-97, erst Bridge-Audit |
| `activatedCardImplementationExecutionHost` | `index.ts` | 25 | cardImplementation, corp, scored, damage/trace | überwiegend Wiring | ja, aber klein | mittel | später Host-Bridge |
| `triggerAbilityExecutionHost` | `index.ts` | 58 | special triggers, hidden-zone, run-fort, counters | gemischt | teilweise | mittel | später |
| `creditEconomyExecutionHost` | `index.ts` | 105 | click/credit/counters/zone | gemischt | nein | mittel/hoch | nach Payment-Primitive-Klärung |
| `damageCoreHost` | `index.ts` | 37 | random, trash, event windows | Wiring + sensitive callbacks | teilweise | mittel | nicht prioritär |
| `traceOrchestrationHost` | `index.ts` | 77 | trace payment, damage, counters, run | gemischt | später | mittel | nicht zuerst |
| `installCardHost` | `index.ts` | 117 | lookup, payment, zone, hosting, choice | gemischt | später | mittel/hoch | nach lookup/payment |
| `rezCardHost` | `index.ts` | 68 | lookup, payment, run windows | gemischt | später | mittel | nach lookup/payment |
| `scoredAgendaFlowHost` | `index.ts` | 116 | lookup, counters, zone, choices | gemischt | später | mittel | nach lookup |
| Hidden-zone handler hosts | `index.ts` | mehrere, 6-59 LOC plus base | lookup, pendingChoice, hidden info, random | gemischt | später | hoch | eigener Host-Schnitt möglich |
| Board/Play/Rez/StartRun action hosts | `index.ts` | klein/mittel | primitive providers | überwiegend Wiring | teilweise | mittel | warten auf Primitive-Schnitt |
| Run/Access residual providers | `index.ts` | Thin-Forwarder | runFlow/accessFlow | ja | nicht prioritär | niedrig | belassen |
| Event/PublicContext providers | `index.ts` | klein | PublicContext deps | ja, EventHost schon bewegt | teilweise | mittel | kein Feldsplit |
| LegalAction/MainAction residual providers | `index.ts` | klein | action builders, primitives | ja | weitgehend erledigt | niedrig | kein weiterer LegalAction-Schnitt |

Nach ARCH-96 ist weiteres Host-Wiring meist kleiner als die zugrunde liegenden Primitive-Provider. Der nächste Schnitt sollte daher bei Ownership der Primitives ansetzen.

## H. PublicContext-, PendingChoice- und Zone-Risikoabgrenzung

Nicht als ARCH-97-Code-Big-Bang geeignet:

- PublicContext-Feldsplit: `publicContextForAction` ist read-only, aber PublicPayload-/PublicEvent-/Replay-Vertrag.
- PendingChoice-Vertragsmove: `source`, `choiceId`, `kind`, `selectedChoices` und HiddenZoneAction-Werte sind stabilisierte Verträge.
- Zone-Mutation-Big-Bang: `removeFromAllZones`, Trash-, Hosting-, SetAside- und RemovedFromGame-Pfade berühren HiddenInfo, StateHash, Replay und Eventpayloads.
- Payment-Big-Bang: Click-/Credit-Spend und revalidation-sensitive Kostenpfade dürfen nicht doppelt oder divergent werden.
- RNG-/Draw-Big-Bang: `randomCounter`, RandomDrawRecords und Hidden-Zone-Bewegungen sind Replay- und StateHash-Kern.

Sicherer ist ein read-only Lookup-Schnitt, der keine State-Mutation, keine Payloadfelder und keine ActionIDs öffnet.

## I. Direkte `onr_v1_`-Reste

| Bereich | Treffer | Bewertung |
| --- | ---: | --- |
| `index.ts` | 0 | sauber |
| `public-context.ts` | 0 | sauber |
| `game/` | 198 | fachliche/kompatible Rest-IDs in Modulen und Tests |
| `mechanics/` | 98 | erwartbare Mechanik-/Regelreferenzen |
| `compatibility/` | 50 | erwartbare Runtime-/Payload-Kompatibilität |

ARCH-97 muss diese Werte nicht anfassen. Eine spätere ID-/Kompatibilitätsbereinigung braucht eigenes Gate.

## J. Neue Monolith-Kandidaten

| Datei | LOC | Kohäsion | Neuer Monolith? | Index-Entlastung | Priorität |
| --- | ---: | --- | --- | --- | --- |
| `game/damage/damage-core.ts` | 2.298 | mittel | ja, fachintern | nein | später |
| `game/access/access-effect-handlers.ts` | 1.484 | mittel | ja, fachintern | nein | später |
| `game/run/run-flow-hosts.ts` | 1.254 | mittel | ja, Hostadapter | indirekt | beobachten |
| `game/turn/runner-main-actions.ts` | 1.225 | mittel | ja | nein | später |
| `game/view/card-view.ts` | 985 | hoch | begrenzt | nein | später |
| `game/run/successful-run-interventions.ts` | 981 | mittel | ja | nein | später |
| `game/hidden-zone/search-choice-handlers.ts` | 960 | mittel | ja | nein | später |
| `game/run/run-end-cleanup.ts` | 931 | mittel | ja | nein | später |
| `game/hidden-zone/nonsearch-choice-handlers.ts` | 926 | mittel | ja | nein | später |
| `game/run/encounter-resolution.ts` | 914 | mittel | ja | nein | später |
| `game/hidden-zone/arrange-choice-handlers.ts` | 901 | mittel | ja | nein | später |
| `game/turn/corp-main-actions.ts` | 877 | mittel | ja | nein | später |
| `game/trace/trace-orchestration.ts` | 858 | mittel | ja | nein | später |
| `game/run/encounter-actions.ts` | 849 | mittel | ja | nein | später |
| `game/access/access-flow.ts` | 834 | mittel | ja | nein | später |
| `public-context.ts` | 1.826 | niedrig/mittel | ja, Vertragsmonolith | nein | später |

Diese Dateien sind echte nächste Architekturthemen, aber nicht automatisch ARCH-97: Viele reduzieren `index.ts` nicht und haben eigene fachliche Risiken.

## K. Kandidaten für ARCH-97

| Kandidat | Zielmodule | Erwartete `index.ts`-Reduktion | Strukturgewinn | Host-Breite | PublicPayload/Replay/StateHash | PendingChoice | HiddenInfo | Testbedarf | Empfehlung |
| --- | --- | ---: | --- | --- | --- | --- | --- | --- | --- |
| `ENGINE-ARCH-97-card-server-lookup-primitives-boundary` | `game/state/card-server-lookup.ts`, optional `game/cards/card-query.ts` | 120-250 LOC bei selektivem Scope | hoch | niedrig | niedrig | niedrig | niedrig/mittel | lookup tests + index regression | sofort |
| `ENGINE-ARCH-97-payment-click-primitives-boundary` | `game/payment/payment-primitives.ts`, `game/turn/click-primitives.ts` | 80-180 LOC | mittel | mittel | mittel/hoch | niedrig | niedrig | economy/install/rez/run/access | später |
| `ENGINE-ARCH-97-zone-mutation-primitives-readiness-audit` | Docs | 0 | hoch | keine | hoch | mittel | hoch | typechecks optional tests | später, wenn Zone Ziel |
| `ENGINE-ARCH-97-pending-choice-host-composition-boundary` | `game/choices/pending-choice-hosts.ts` | 80-140 LOC | mittel | mittel | hoch | hoch | hoch | choices/hidden-zone/replay/index | später |
| `ENGINE-ARCH-97-cardimplementation-host-bridge-boundary` | `game/card-implementation/cardimplementation-hosts.ts` | 80-160 LOC | mittel | mittel | mittel | mittel | mittel | runtime deps/abilities/index | später |
| `ENGINE-ARCH-97-draw-shuffle-random-primitives-readiness-audit` | Docs | 0 | hoch | keine | hoch | niedrig | hoch | replay/random/hidden-zone | später |
| `ENGINE-ARCH-97-public-context-readiness-audit` | Docs | 0 | hoch | keine | hoch | mittel | hoch | public event/player view/replay | später |
| `ENGINE-ARCH-97-index-test-structure-boundary` | tests | 0 Produktions-LOC | niedrig/mittel | keine | niedrig | niedrig | niedrig | tests only | später |
| `ENGINE-ARCH-97-hidden-zone-host-composition-boundary` | `game/hidden-zone/hidden-zone-hosts.ts` | 80-180 LOC | mittel | mittel | mittel/hoch | hoch | hoch | hidden-zone/choices/replay | später |
| `ENGINE-ARCH-97-zone-mutation-primitives-boundary` | `game/zones/zone-mutation-primitives.ts` | 150-300 LOC | hoch | mittel | hoch | mittel | hoch | broad regression | nicht ohne Audit |

## L. Empfohlener nächster Code- oder Audit-Schnitt

Empfehlung: `ENGINE-ARCH-97-card-server-lookup-primitives-boundary`.

Ziel:

- Read-only `index.ts`-Primitives wie `definitionFor`, `mustInstance`, `mustServer`, `mustRun` und eng gekoppelte installed-card/server/root query helpers in ein eigenes Game-State-/Card-Query-Modul verlagern.
- Keine State-Mutation.
- Keine Payment-/Zone-/Random-/PendingChoice-/PublicContext-Migration.
- Keine ActionID-, Payload-, Ordering-, Replay- oder StateHash-Änderung.

Bevorzugte Module:

- `packages/engine/src/game/state/card-server-lookup.ts`
- optional, falls klar getrennt: `packages/engine/src/game/cards/card-query.ts`

Warum dieser Schnitt:

- Er ist der risikoärmste produktive Schnitt nach der Host-Kompositionsphase.
- Er reduziert die Menge lokaler Provider, an denen fast alle Host-Cluster hängen.
- Er bereitet spätere Payment-, Zone- und Host-Bridge-Schnitte vor, ohne mutierende Semantik zu öffnen.

## M. Alternativen und warum schlechter

| Alternative | Warum schlechter als ARCH-97 Lookup |
| --- | --- |
| Payment/Click-Primitives sofort | Mutiert Credits/Clicks und ist revalidation-sensitive; Risiko größer bei weniger struktureller Vorarbeit |
| Zone-Mutation-Boundary sofort | Berührt HiddenInfo, Hosting, special zones, Replay und StateHash; braucht eigenen Audit |
| PendingChoice-Host-Schnitt sofort | `source`/`kind`/`id`-Verträge und HiddenZone-Handler bleiben sensibel |
| PublicContext-Feldsplit | Größter read-only Monolith, aber direkt PublicPayload/PublicEvent/Replay-Vertrag |
| weiterer LegalAction-Host-Schnitt | Der große LegalAction-Host-Hebel ist erledigt; Rest ist nicht der Kernblocker |
| Teststruktur-Split | Low-risk, aber kein Produktionscode-Architekturhebel |

## N. Was ausdrücklich nicht als nächstes machen

- Kein PublicContext-Feldfamilien-Split.
- Kein PendingChoice-Wert- oder Choice-ID-Move.
- Kein Zone-Mutation-Big-Bang.
- Kein Payment-/Click-/Cost-Revalidation-Big-Bang.
- Kein RNG-/Draw-/Shuffle-Move ohne Replay-/StateHash-Audit.
- Kein weiterer reiner Wrapper- oder Typenmove.
- Keine neue Engine-Kopie für Payment, Zone, Run, Access, Damage, Trace oder CardImplementation.

## O. Teststrategie für den nächsten Schnitt

Für `ENGINE-ARCH-97-card-server-lookup-primitives-boundary`:

- Neuer Modul-Test für `definitionFor`, `mustInstance`, `mustServer`, `mustRun` und repräsentative installed-card/server/root queries.
- Importgrenze: neues Modul importiert nicht aus `index.ts`.
- Behavioral smoke: LegalActions, PlayerView und representative Run/Access/Install/Rez bleiben unverändert.
- Regressionen: `src/index.test.ts`, `game/legal-actions.test.ts`, `game/player-view.test.ts`, `game/run`, `game/access`, `game/install`, `game/rez`.
- Typechecks: Engine, Web, Server.
- `git diff --check`.

## P. Risiken

- Der Lookup-Schnitt kann zu breit werden, wenn cost quotes, hidden-info reveal helpers oder CardImplementation runtime helpers mitgezogen werden.
- Read-only Helpers können indirekt PublicPayload beeinflussen, wenn sie öffentliche Labels oder visibility decisions enthalten.
- Ein zu generisches `state-primitives`-Modul würde nur den Monolithen verteilen. Das Ziel muss fachlich begrenzt bleiben: Card/Server lookup und pure queries.

## Q. Akzeptanzkriterien für read-only Primitive-Schnitte

- Keine State-Mutation.
- Kein Schreiben von `GameState`, `CardInstance`, `RunState`, `PendingChoice`, `eventLog`, `randomCounter` oder `selectedChoices`.
- Keine PublicPayload-/PublicEvent-/PlayerView-Feldänderung.
- Keine ActionID-/Payload-/Ordering-Änderung.
- Neues Modul importiert nicht aus `index.ts`.
- Tests pinnen Fehlermeldungen oder Fehlerverhalten von `must*`-Primitives, soweit öffentlich relevant.

## R. Akzeptanzkriterien für mutierende Primitive-Schnitte

- Vorher eigener Readiness-Audit.
- Exakte Vorher/Nachher-Regression für StateHash und Replay.
- Keine Änderung an EventLog-Timing.
- Keine Änderung an HiddenInfo-Sichtbarkeit.
- Keine neue doppelte Kosten-/Zone-/RNG-Quelle.
- Enge Module nach Fachfamilie, nicht ein großes `state-mutation-primitives.ts`.

## S. Akzeptanzkriterien für PendingChoice-/HiddenZone-Host-Schnitte

- Keine Änderung an `PendingChoice.source`, `choiceId`, `kind`, `options`, `stateVersion`.
- Keine Änderung an `selectedChoices`-Shape.
- Keine Änderung an `hiddenZoneAction`-Werten.
- Keine Änderung an PublicPayload-/PlayerView-/Replay-Sichtbarkeit.
- HiddenZone-Handler nur als Host-Komposition bewegen, nicht neu modellieren.

## T. Akzeptanzkriterien für spätere PublicContext-Splits

- Eigener PublicPayload-/PublicEvent-Vertragsaudit.
- Snapshot- oder gezielte Assertions für repräsentative Payloadfamilien.
- Replay- und PlayerView-Regressionen grün.
- Kein gleichzeitiger PendingChoice-, Zone- oder RNG-Move.
- Feldfamilien klein schneiden; keine 1.800-LOC-Datei in einen neuen Sammelmonolithen kopieren.

## U. Akzeptanzkriterien für spätere Teststruktur-Splits

- Keine Produktionscodeänderung im selben Commit.
- Bestehende `index.test.ts`-Coverage nicht reduzieren.
- Testimports aus `index` dürfen als Integrationsregression bleiben, müssen aber klar von Modul-Unit-Tests getrennt werden.
- Neue Modul-Tests sollen fachliche Boundaries absichern, nicht nur Zeilen verschieben.
