# PublicContext Field-Family Readiness nach STATUS-7

Stand: 2026-05-28
Auftrag: `ENGINE-STATUS-8-public-context-field-family-readiness-audit`
Ergebnis: Audit, kein Produktionscode-Refactor.

## A. Ausgangspunkt und bestätigte Commits

Der Audit startet nach dem Abschluss der Index-/Runtime-Internal-Restrukturierungsphase.

| Referenz | Commit | Befund |
| --- | --- | --- |
| STATUS-7 | `a15eafad538d422605d79c787cf30896e3572a9d` | `docs(engine): audit runtime internal final status` vorhanden |
| ARCH-112 | `357d4c087e0a637e5c986777cb50a6a6ff870f49` | Runtime Host-/Service-Familien-Split vorhanden |
| ARCH-111 | `cb800919aac55a305244a70be26d6aee2b85f4bd` | Runtime Bootstrap-Phasen-Split vorhanden |
| ARCH-108 | `81c84f90794fa9412558e4f33565220665465e89` | Runtime Public API Facade vorhanden |

Ausgangslage laut Git: Branch `codex/card-implementation-next-task`, Worktree sauber. STATUS-7 bewertet die Index-/Runtime-Restrukturierung als abgeschlossen und empfiehlt ausdrücklich keinen weiteren mechanischen Runtime-Internal-Split als Standardschritt.

## B. Methodik und gelesene Quellen

Gelesene Architekturquellen:

- `docs/architecture/engine-runtime-internal-final-status-post-arch112.md`
- `docs/architecture/engine-runtime-finalization-post-arch108.md`
- `docs/architecture/engine-index-primitive-provider-readiness-post-arch96.md`
- `docs/architecture/engine-index-host-composition-post-perform-action.md`
- `docs/architecture/engine-apply-action-boundary-analysis.md`
- `docs/architecture/ability-engine/pending-choice-replay-marker-stability-p3-71.md`
- `docs/architecture/ability-engine/card-implementation-payload-replay-compatibility-p3-68.md`
- `docs/architecture/ability-engine/card-implementation-runtime-compatibility-p3-69.md`

Gelesene Codequellen:

- `packages/engine/src/public-context.ts`
- `packages/engine/src/game/events/build-event.ts`
- `packages/engine/src/game/view/public-event-view.ts`
- `packages/engine/src/game/view/player-view-projection.ts`
- `packages/engine/src/game/view/hidden-info.test.ts`
- `packages/engine/src/game/view/choice-view.test.ts`
- `packages/engine/src/game/events/build-event.test.ts`
- `packages/engine/src/game/engine-runtime-internal/public-event-runtime-bootstrap.ts`
- `packages/engine/src/game/engine-runtime-internal/public-api.ts`
- `packages/engine/src/compatibility/payload-compatibility.ts`
- `packages/engine/src/compatibility/runtime-compatibility.ts`
- `packages/shared/src/index.ts`
- `apps/web/app/action-board-ui.ts`
- `apps/web/app/chronicle.ts`
- `apps/web/app/action-payload.ts`
- `packages/ai/src/input-dto.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/multiplayer.test.ts`

## C. Messwerte

| Metrik | Wert | Einordnung |
| --- | ---: | --- |
| `public-context.ts` | 1.827 LOC | größte verbliebene PublicPayload-Montagefläche |
| `publicContextForAction` | 1.772 LOC | praktisch die gesamte Datei |
| `context.*`-Zuweisungen | 477 | direkte PublicContext-Feldmontage |
| unterschiedliche `context.*`-Zielnamen | 338 | breit gestreuter Payload-Vertrag |
| `legalAction.payload`-Zugriffe | 806 | Hauptquelle der Feldkopien |
| `privatePayload`-Zugriffe in `public-context.ts` | 0 | keine private Replay-Nutzlast wird gelesen |
| `publicPayload`-Zugriffe in `public-context.ts` | 0 | PublicPayload wird hier erzeugt, nicht gelesen |
| `legalAction.type`-Checks | 32 | action-type-basierte Branchfamilien |
| `hiddenZoneAction`-Treffer | 5 | wenige, aber vertraglich hochsensibel |
| `specialZoneReason`-Treffer | 13 | Special-Zone-/Replay-sensitive Feldfamilie |
| `encounterTaxSource`-Treffer | 2 | Run-/Encounter-Compatibility |
| `randomPurpose`-Treffer | 15 | Replay-/StateHash-nah |
| direkte `onr_v1_` in `public-context.ts` | 0 | ID-frei, aber nicht vertragsfrei |

Top-Level-Importe von `public-context.ts`:

- Typimporte aus `@netgrid/shared`: `CardDefinition`, `CardInstanceId`, `CounterType`, `GameState`, `LegalAction`, `ServerId`
- read-only Label-Helper aus `./game/view/server-view`: `publicServerLabel`, `publicServerLabelForCard`, `serverChoiceDisplayLabel`

`PublicContextForActionDependencies` umfasst acht read-only oder quote-artige Abhängigkeiten:

- `agendaPointsForScoredCard`
- `cardCounter`
- `cardStrengthModifier`
- `creditCostForAction`
- `definitionFor`
- `pumpAmountForLegalAction`
- `runnerHqAccessBonus`
- `v1915InstalledAccessBonus`

Callsites:

- Produktiv: `game/events/build-event.ts` ruft `publicContextForAction` über `BuildEventHost`.
- Host-Komposition: `game/events/event-context-hosts.ts` baut `PublicContextForActionDependencies`.
- Tests: `public-context.test.ts`, `index.test.ts`, mehrere `index-tests/**`-Dateien und `game/events/event-context-hosts.test.ts`.

Importgrenzen:

- Produktive `game/* -> index` Imports: 0.
- Produktive tiefe `game/* -> engine-runtime(-internal)` Imports: 0.
- Testimporte aus `game/*` nach `index` existieren weiterhin als Facade-/Regressionstests und sind kein Produktionsgrenzenbruch.

## D. PublicContext-Rolle im neuen Runtime-Endzustand

Nach STATUS-7 sind `index.ts` und `game/engine-runtime.ts` explizite Fassaden. `public-context.ts` ist dagegen keine Fassade, sondern eine read-only PublicPayload-Kontextmontage:

- Es entscheidet keine LegalAction.
- Es mutiert keinen GameState.
- Es importiert nicht aus `index.ts`.
- Es spiegelt bereits erzeugte und revalidierte `LegalAction.payload`-Daten in chronicle-/UI-/AI-freundliche öffentliche Eventfelder.
- Es hält Legacy-Feldnamen stabil, die in ActionBoard, Chronicle, AI-DTO, Replay und historischen Tests gelesen werden.

Der hohe Strukturgewinn eines Splits liegt daher nicht in Engine-Entkopplung, sondern in Vertragsklarheit: Feldfamilien sollen eigene Besitzer bekommen, ohne Feldnamen, Sichtbarkeiten oder Redaction zu verändern.

## E. Field-Family-Karte

| Feldfamilie | Repräsentative Felder | Quelle | HiddenInfo | Web | Replay/StateHash | AI | Kann read-only in eigenes Modul? | Risiko | Schutz heute |
| --- | --- | --- | --- | --- | --- | --- | --- | --- | --- |
| Action identity / actor / action type | `actor`, `actionType`, `label`, `actionCostClicks`, `turnActionOrdinalStart`, `turnActionOrdinalEnd` | `build-event.ts`, `legalAction` | niedrig | hoch | hoch | hoch | ja, `base-context.ts` | niedrig | `build-event.test.ts`, `index.test.ts` |
| Basic cost / click / credit context | `amount`, `creditCost`, `paidCredits`, `corpCreditsAfter`, `runnerCreditsAfter`, `runnerCreditsSpent` | `legalAction.payload`, deps | niedrig | hoch | mittel | hoch | ja, aber nach Golden-Test | mittel | breite flow-smokes, AI DTO allowlist |
| Card source / target / definition IDs | `cardDefinitionId`, `sourceDefinitionId`, `targetCardDefinitionId`, `hostDefinitionId`, `title`, `sourceTitle` | payload, reveal, `definitionFor` | hoch | hoch | hoch | hoch | ja, `card-context.ts`, aber vorsichtig | mittel | HiddenInfo tests, Chronicle tests |
| Runner/Corp installed target context | `hiddenResourceSlotId`, `hiddenRunnerResourceInstall`, `hiddenRunnerResourceRevealed`, `targetVisibility`, `targetIcePositionLabel` | payload, state view | hoch | hoch | hoch | hoch | später | hoch | `hidden-info.test.ts`, AI hidden-resource tests |
| Run / encounter / ice context | `runPhase`, `serverLabel`, `baseAccessCount`, `effectiveAccessCount`, `encounterContinue`, `encounterWillEndRun`, `targetIceDefinitionId`, `jackOutAdditionalCost` | payload, state.run, deps | mittel | hoch | hoch | hoch | ja, aber nach run/access snapshots | mittel | run/access tests, Chronicle |
| Access / breach / steal / trash context | `accessedCardPositionKey`, `accessedArea`, `accessedIndex`, `ambushDefinitionId`, `accessEffectSourceDefinitionId`, `stealCost`, `trashCostPaid` | payload, state.run | hoch | hoch | hoch | hoch | später | hoch | access tests, hidden-info tests |
| Trace context | `traceId`, `traceStep`, `baseTraceStrength`, `traceBidLimit`, `corpBid`, `runnerBid`, `traceSuccessful`, `traceBaseLinkSourceDefinitionId` | payload | mittel | hoch | hoch | hoch | nach trace golden gate | hoch | trace tests, AI allowlist |
| Damage / prevention / replacement / flatline context | `damageResolved`, `damageType`, `baseDamageAmount`, `preventedAmount`, `finalAmount`, `flatline`, `replacementWindowOpened`, `eventModificationWindowOpened` | payload | hoch | hoch | hoch | hoch | nach damage golden gate | hoch | damage/hidden-info tests |
| Payment / hosted / temporary credits | `temporaryCreditsProvided`, `temporaryCreditsSpent`, `temporaryCreditsRemaining`, `hostedCreditsAfter`, `recurringCreditsLoaded`, `runStartTaxPaid` | payload | niedrig bis mittel | hoch | mittel | hoch | ja, aber needs payment snapshots | mittel | run-duration-payment tests, AI allowlist |
| HiddenZone / search / arrange / nonsearch | `hiddenZoneAction`, `hiddenZoneBarrier`, `searchReveal`, `searchDestination`, `privateLookZone`, `knownHqDefinitionIds`, `shownCardDefinitionIds`, `redactedKind` | payload | sehr hoch | hoch | hoch | hoch | erst nach eigener readiness | hoch | `choice-view.test.ts`, `hidden-info.test.ts` |
| SpecialZone / set-aside / removed-from-game | `specialZone`, `specialZoneVisibility`, `specialZoneReason`, `controlChangeReason`, `newController`, `oldController` | payload, event visibility | sehr hoch | mittel | hoch | mittel | erst nach golden gate | hoch | `hidden-info.test.ts`, special-zone smokes |
| Choice / PendingChoice / selectedChoices | `choiceKind`, `choiceId`, `choiceVisibility`, `discardResolved`, `secretSpendRevealed`, `tooManyDoorsEndRun` | `resolve_choice` payload | hoch | hoch | hoch | hoch | später | hoch | `choice-view.test.ts`, special-window tests |
| CardImplementation / activated ability / legacy ability | `v181RunnerProgramAbility`, `v1917AssetAbility`, `v1919*`, `v1920*`, `v1921*`, `v1922*`, `resourceAbility`, `agendaAbility` | legacy payload fields | mittel bis hoch | hoch | hoch | hoch | nur `legacy-compat-context.ts` nach contract test | hoch | P3.68/P3.69 docs, Chronicle, AI allowlist |
| Runtime compatibility markers | `v19xx`, `p3_`, `sourceDefinitionId`, `specialZoneReason`, `hiddenZoneAction`, `encounterTaxSource` | payload contracts | hoch | hoch | hoch | hoch | nur als Compatibility-Familie | hoch | compatibility docs/tests |
| RNG / random context | `randomPurpose`, `randomCounterAfter`, `randomDrawRecordPurpose`, `v1921DieRoll`, `playfulAiDieRolls`, `vacuumLinkDieRoll` | payload/RNG records | niedrig für hidden info, hoch für replay | mittel | sehr hoch | mittel | ja, `random-context.ts`, nach replay snapshot | mittel | replay tests, random tests |
| Public labels / display labels | `serverLabel`, `zoneLabel`, `selectedServerLabel`, `targetServerLabel`, `targetIcePositionLabel` | view label helpers, payload | mittel | hoch | mittel | hoch | ja, aber label snapshots nötig | mittel | Chronicle, action UI tests |
| Replay compatibility fields | `publicRevealDefinitionId`, `publicRevealDefinitionIds`, `randomCounterAfter`, `specialZoneReason`, `hiddenZoneAction`, legacy `v19xx` | payload | hoch | hoch | sehr hoch | hoch | nicht zuerst | hoch | replay tests, compatibility docs |
| Web ActionBoard / Chronicle display-only | viele der obigen plus `resolvedEffects`, `secretSpend*`, `traceStep`, `damageResolved` | public event payload | mittel bis hoch | sehr hoch | hoch | mittel | nur mit Web contract tests | hoch | Chronicle/action-board tests |
| AI-input-relevant allowed fields | AI allowlist in `input-dto.ts` | public event + legal action DTO | hoch | mittel | mittel | sehr hoch | nur mit AI DTO test | hoch | `packages/ai/src/index.test.ts` |

## F. PublicPayload-/Web-/AI-Contract-Audit

| Consumer | Nutzung | Relevante Felder | Befund |
| --- | --- | --- | --- |
| `game/events/build-event.ts` | baut finalen `publicPayload` aus Actor, Label, ActionUse, PublicContext, AbilitySchema und Reveal | alle PublicContext-Felder | `public-context.ts` ist Teil der finalen Eventmontage, aber nicht alleiniger Eigentümer des Payloads |
| `game/view/public-event-view.ts` | projiziert und redigiert PublicEvents pro Seite | `cardDefinitionId`, `title`, `serverId`, `serverLabel`, `hiddenZoneAction`, private LegalAction für private look | R&D-Access-Redaction und side-private private-look-Projektion sind direkte Contract-Gates |
| `game/view/player-view-projection.ts` | liefert `publicEvents` in PlayerView | gesamtes `PublicGameEvent` | Jede PublicPayload-Änderung erreicht PlayerView |
| `apps/web/app/action-board-ui.ts` | LegalAction-Kontext, Access-Reveal, Choice-Spezialdarstellung | `v1911HiddenZoneAbility`, `v1917AssetAbility`, `v1920AssetAbility`, `targetCardDefinitionId`, `hiddenZoneAction`, `publicReveal*` | ActionBoard liest sowohl LegalAction.payload als auch PublicEvent.publicPayload; Contract-Tests vor Split sinnvoll |
| `apps/web/app/chronicle.ts` | umfangreiche öffentliche Chronik | `sourceDefinitionId`, `hiddenZoneAction`, `v1919*`, `v1922*`, `traceStep`, `secretSpend*`, `damage*`, `resolvedEffects` | stärkster Web-Consumer; viele Feldnamen sind UI-Vertrag |
| `apps/web/app/action-payload.ts` | Payload-Ability-Erkennung | Legacy ability fields, `hiddenZoneAction`, `agendaAbility`, random roll fields | Legacy-Feldnamen bleiben kompatibilitätskritisch |
| `packages/ai/src/input-dto.ts` | positive Allowlist für LegalActions und PublicEvents | `PUBLIC_PAYLOAD_PRIMITIVE_KEYS`, String-Arrays, `amounts`, `targets`, `visibility` | Neue oder verschobene Felder erreichen die KI nur nach expliziter Allowlist |
| `packages/ai/src/index.test.ts` | Side-safety, DTO-Sanitizer, versteckte Ressourcen | public event tail, legal actions, player view | Starke Safety-Tests, aber keine vollständigen PublicPayload-Golden-Snapshots |
| `apps/server/src/multiplayer.ts` | SidePayload, Replay/Timeline, AI, Undo/Forfeit | `publicPayload`, `privatePayload`, `traceStarted`, `damageResolved`, `specialZone`, `controlChange`, `serverLabel`, `randomDrawRecords` | Server hängt an Familienklassifikation und Replay-Projektion |
| `apps/server/src/event-projection.ts` | lokale/private vs public Eventprojektion | `publicPayload`, `privatePayloadLocalOnly` | Redaction darf nicht durch Feldsplit verwässert werden |
| `packages/shared/src/index.ts` | Typbasis, Guard-Regexe, PublicGameEvent | `publicPayload: Record<string, unknown>` | PublicPayload ist absichtlich offen, daher müssen Tests die Verträge sichern |

Contract-Befund: Die Typen schützen Feldnamen kaum, weil `PublicGameEvent.publicPayload` ein offenes `Record<string, unknown>` ist. Der reale Vertrag liegt in Tests, Chronicle/ActionBoard-Code und historischen Replay-/Compatibility-Erwartungen.

## G. HiddenInfo-/Replay-/StateHash-Abgrenzung

`public-context.ts` selbst liest keine `privatePayload` und erzeugt keinen StateHash. Trotzdem ist es indirekt hochsensibel:

- HiddenInfo: Felder wie `redactedKind`, `hiddenZoneAction`, `hiddenResourceSlotId`, `publicRevealDefinitionId`, `knownHqDefinitionIds` und `specialZoneVisibility` steuern, was Seiten und UI sehen.
- Replay: `publicPayload` ist Teil der Eventlog-Projektion und wird von Replay-/Chronicle-/Serverpfaden gelesen. Feldnamen wie `v19xx`, `p3_`, `randomPurpose` und `specialZoneReason` sind Compatibility-Eingaben.
- StateHash: PublicContext erzeugt keinen Hash, aber Replay prüft StateHash nach Event-Replay. Eine Payload-Änderung kann alte Replays, Debugging und Consumer brechen, auch wenn der GameState gleich bleibt.
- AI: Die KI sieht PublicEvents über die positive DTO-Allowlist. Neue oder entfernte Felder ändern KI-Inputs auch ohne Engine-Semantikänderung.

## H. Zielarchitektur für public-context-Familien

Die vorgeschlagene Zielstruktur ist fachlich sinnvoll, aber nicht in einem Schritt:

```text
packages/engine/src/game/events/public-context/index.ts
packages/engine/src/game/events/public-context/types.ts
packages/engine/src/game/events/public-context/base-context.ts
packages/engine/src/game/events/public-context/card-context.ts
packages/engine/src/game/events/public-context/run-context.ts
packages/engine/src/game/events/public-context/access-context.ts
packages/engine/src/game/events/public-context/trace-context.ts
packages/engine/src/game/events/public-context/damage-context.ts
packages/engine/src/game/events/public-context/payment-context.ts
packages/engine/src/game/events/public-context/hidden-zone-context.ts
packages/engine/src/game/events/public-context/special-zone-context.ts
packages/engine/src/game/events/public-context/choice-context.ts
packages/engine/src/game/events/public-context/card-implementation-context.ts
packages/engine/src/game/events/public-context/random-context.ts
packages/engine/src/game/events/public-context/legacy-compat-context.ts
```

Sofort sinnvoll als erste Code-Schnittkandidaten:

- `base-context.ts`: ActionUse-nahe und label-nahe Felder mit geringem HiddenInfo-Risiko.
- `card-context.ts`: nur wenn zunächst source/target/reveal-Felder snapshot-geschützt werden.
- `random-context.ts`: klein und read-only, aber Replay-Purpose-sensitive.

Zusammenbleiben sollten zunächst:

- HiddenZone + Choice, weil `hiddenZoneAction`, `choiceVisibility`, `redactedKind`, private choice projection und side-safe PlayerView eng gekoppelt sind.
- Trace + Damage nicht zusammen, aber beide brauchen vor Split eigene Golden-/Contract-Tests.
- Legacy `v19xx`/`p3_`-Felder als eigene Compatibility-Familie, nicht verteilt auf Domainmodule.

Zu riskant für den ersten Split:

- HiddenZone/Search/Arrange/Nonsearch.
- SpecialZone/ControlChange.
- Damage/Prevention/Replacement/Flatline.
- Trace bid/result/base-link.
- Access/Breach/Steal/Trash mit hidden access identities.

## I. Kandidaten für nächste ARCH-Phase

| Kandidat | Ziel | Strukturgewinn | Risiko | Benötigte Tests | Empfehlung |
| --- | --- | --- | --- | --- | --- |
| `ENGINE-ARCH-113-public-context-base-card-context-boundary` | Base- und einfache Card-Felder extrahieren | mittel | mittel | PublicPayload golden + build-event snapshots | später, nach Gate |
| `ENGINE-ARCH-113-public-context-random-context-boundary` | `randomPurpose`, Counter, Die-Rolls bündeln | klein bis mittel | mittel wegen Replay | Replay golden + random purpose snapshots | später, gut als zweiter Code-Schnitt |
| `ENGINE-ARCH-113-public-context-run-access-context-readiness` | Run/Access-Felder kartieren und testen | mittel | hoch | Run/Access PublicPayload snapshots | später als Readiness |
| `ENGINE-ARCH-113-public-context-hidden-zone-context-readiness` | HiddenZone-Felder und Redaction-Verträge auditieren | hoch | hoch | HiddenInfo, Choice, AI DTO, Web contract | später als eigenes Audit |
| `ENGINE-ARCH-113-public-context-damage-trace-context-readiness` | Damage/Trace-Felder auditieren | hoch | hoch | Trace/Damage golden + prevention/replay | später als eigenes Audit |
| `ENGINE-ARCH-113-public-context-golden-payload-test-gate` | Golden-Snapshots für repräsentative PublicPayload-Familien | hoch | niedrig | neue Golden-Testmatrix | sofort |
| `ENGINE-ARCH-113-public-context-web-contract-test-gate` | ActionBoard/Chronicle-Feldnutzung absichern | hoch | niedrig bis mittel | Web unit tests für payload families | sofort oder parallel nach Golden |
| `ENGINE-ARCH-113-ability-engine-runtime-readiness-audit` | Alternative nächste Phase für AbilityEngine | hoch | niedrig, da Audit | eigene Messung | später, wenn PublicContext-Gate steht |
| `ENGINE-ARCH-113-index-test-structure-boundary` | Testmonolith schneiden | mittel | mittel | Test-Gates selbst | später |
| `ENGINE-ARCH-113-public-context-size-gate-only` | nur LOC-/Import-Gate für `public-context.ts` | klein | niedrig | module-size test | nur ergänzend, nicht alleine |

## J. Empfohlener nächster Code- oder Test-Gate-Schnitt

Empfehlung: Als nächster Schritt sollte kein Code-Split von `public-context.ts` erfolgen. Der nächste konkrete Auftrag sollte ein Test-Gate sein:

```text
ENGINE-ARCH-113-public-context-golden-payload-test-gate
```

Ziel:

- Golden-/Snapshot-Fälle für repräsentative PublicPayload-Familien anlegen.
- Mindestens abdecken: Base, Card/Reveal, Run/Access, HiddenZone, SpecialZone, Trace, Damage, Payment, RNG, Legacy `v19xx`/`p3_`.
- Snapshots gegen `publicContextForAction` und gegen finale `buildEvent`-PublicPayload prüfen.
- HiddenInfo-negative Assertions beibehalten: keine private IDs, keine verborgenen Titel, keine `privatePayload`.

Danach ist ein erster kleiner Code-Schnitt vertretbar:

```text
ENGINE-ARCH-114-public-context-base-card-context-boundary
```

Scope dann nur Base + einfache Card-/Label-Kontexte, keine HiddenZone, kein Trace, kein Damage, keine SpecialZone und keine Legacy-Feldmigration.

## K. Was ausdrücklich nicht als nächstes tun

- Kein Big-Bang-Split von `public-context.ts`.
- Keine Umbenennung von `v19xx`, `p3_`, `hiddenZoneAction`, `specialZoneReason`, `encounterTaxSource` oder `randomPurpose`.
- Keine Migration von `PublicPayload` zu einem geschlossenen Typ ohne Consumer-Migrationsplan.
- Keine HiddenZone-, SpecialZone-, Trace- oder Damage-Feldextraktion ohne Golden-/Web-/AI-Contract-Gate.
- Keine Vermischung von PublicContext-Split mit Zone-, Payment-, PendingChoice-, RNG- oder Replay-Migration.
- Keine `public-context`-Module, die State mutieren oder LegalActions erzeugen.

## L. Akzeptanzkriterien für PublicContext-Code-Splits

Ein Code-Split ist akzeptabel, wenn:

- Er nur read-only Kontextmontage verschiebt.
- `PublicContextForActionDependencies` nicht breiter wird.
- Keine neuen produktiven `game/* -> index` Imports entstehen.
- `publicContextForAction` weiterhin dieselben Felder mit denselben Werten erzeugt.
- `buildEvent`-PublicPayload shape unverändert bleibt.
- HiddenInfo-negative Tests grün bleiben.
- Replay- und StateHash-Tests grün bleiben.
- AI DTO Allowlist entweder unverändert bleibt oder bewusst erweitert wird.
- Web ActionBoard/Chronicle relevante Felder weiter lesen kann.
- Golden-Snapshots für die betroffene Familie vor und nach dem Split identisch bleiben.

## M. Akzeptanzkriterien für PublicPayload-Golden-Tests

Golden-Tests sollten:

- Finale `GameEvent.publicPayload` und direkte `publicContextForAction`-Ausgaben unterscheiden.
- Je Feldfamilie mindestens einen repräsentativen Positivfall und einen HiddenInfo-negativen Fall enthalten.
- Legacy-Felder explizit snapshotten, aber nicht semantisch neu interpretieren.
- `resolvedEffects` nur mit redigierter, öffentlicher Form snapshotten.
- RNG-Felder inklusive `randomPurpose` und `randomCounterAfter` stabil prüfen.
- Replay über `replayEvents` oder `replayGameEvents` als Zusatzassertion verwenden.

## N. Akzeptanzkriterien für Web-/AI-Contract-Tests

Web:

- `chronicle.ts` erhält repräsentative PublicEvents für HiddenZone, Trace, Damage, SecretSpend, Access und Legacy Ability.
- `action-board-ui.ts` behält Access-Reveal- und Choice-Hinweise ohne HiddenInfo-Leak.
- `action-payload.ts` erkennt Legacy-Ability-Felder unverändert.

AI:

- `input-dto.ts` positive Allowlist bleibt explizit.
- Neue PublicPayload-Felder werden nicht automatisch in AI-Inputs übernommen.
- Verbotene Felder wie `privatePayload`, `cardInstances`, `fullGameState`, Tokens und Decklisten bleiben ausgeschlossen.
- Hidden Runner Resource und private Look bleiben side-safe.

Server:

- `event-projection.ts` und `multiplayer.ts` behalten side-filtered PublicEvent-Projektion.
- Replay-Timeline-Familienklassifikation bleibt stabil.
- `privatePayloadLocalOnly` bleibt lokal und wird nicht PublicPayload.

## O. Risiken

- `PublicPayload` ist in `@netgrid/shared` absichtlich offen typisiert. Compile-Zeit schützt Feldnamen kaum.
- Chronicle und ActionBoard sind starke implizite Verträge; Feldentfernung kann UI brechen, ohne Engine-Tests zu brechen.
- AI DTOs nutzen positive Allowlists. Ein Split kann scheinbar harmlos sein, aber AI-Inputs verändern, wenn Felder neu benannt oder verschachtelt werden.
- Legacy-Felder sind nicht nur Altlast, sondern Action-ID-, Replay-, PendingChoice- und Web-Kompatibilität.
- HiddenZone/SpecialZone-Familien enthalten rote Linien für verdeckte Kartenidentitäten.
- `randomPurpose` und `randomCounterAfter` sind replaynah; sie dürfen nicht nebenbei normalisiert werden.

## P. Agent-Checkliste

Vor jedem PublicContext-Code-Split:

1. Worktree sauber und aktueller STATUS-8-Stand vorhanden.
2. Betroffene Feldfamilie in diesem Audit eindeutig markieren.
3. Golden-/Contract-Test für die Familie zuerst ergänzen.
4. `public-context.ts` nur read-only schneiden.
5. Keine neuen Payload-Felder, keine Feldumbenennung, keine Verschachtelung.
6. HiddenInfo-negative Assertions ausführen.
7. Replay-/StateHash-Tests ausführen.
8. Web ActionBoard/Chronicle und AI DTO Tests für die betroffene Familie ausführen.
9. Importgrenzen prüfen: produktiv keine `game/* -> index` Imports.
10. Ergebnisbericht muss explizit sagen, welche PublicPayload-Felder unverändert blieben.

## Audit-Entscheidung

Ein direkter Big-Bang-Code-Split von `public-context.ts` ist nicht sicher. Ein kleiner erster Code-Schnitt ist grundsätzlich möglich, aber erst nach einem PublicPayload-Golden-Test-Gate. Der nächste empfohlene Schritt ist daher `ENGINE-ARCH-113-public-context-golden-payload-test-gate`, nicht `base-context.ts` direkt.
