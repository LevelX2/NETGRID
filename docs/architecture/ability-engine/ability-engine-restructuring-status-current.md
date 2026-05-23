# ENGINE-STATUS-1: Ability-Engine-Restrukturierung Statusaudit

Stand: 2026-05-23

Scope: reiner Status-, Architektur- und Fortschritts-Audit nach Abschluss der CardImplementation-Phase. Keine Produktionscodeänderung, keine Refactorings, keine Kartenmigration, keine Teststruktur-Moves, keine PublicPayload-/PlayerView-/PublicEvent-Vertragsänderung, keine UI-Änderung und keine Match-/Game-/Run-/Index-Modulsplit-Umsetzung.

## 1. Kurzfazit

Die CardImplementation-Migration ist fachlich abgeschlossen. Der aktuelle ONR-v1-Scope umfasst 374 Karten: 373 Karten haben registrierte CardImplementation-Dateien, und `onr_v1_220_tycho-extension` ist korrekt als `no_engine_behavior_required` klassifiziert. Es gibt im ONR-v1-Scope keine `pending_implementation`, keine `partial_implementation` und keine `legacy_engine_special_case`.

Die AbilityEngine-Systematik ist deutlich besser als der alte Zustand: `packages/engine/src/ability-engine/` importiert nicht aus `index.ts`, hat keine direkten `onr_v1_`-IDs und kapselt DSL, Runtime, Effect-Interpreter, Modifier und Effect-Adapter grundsätzlich sinnvoll. Die konkrete Kartenlogik liegt überwiegend in `packages/engine/src/card-implementations/onr-v1/`.

Die Entlastung von `packages/engine/src/index.ts` ist aber nur begrenzt gelungen. `index.ts` ist mit 32.111 LOC weiterhin keine Fassade, sondern der zentrale Host-/Engine-Monolith für `applyAction`, LegalAction-Erzeugung, Turnflow, Runflow, Access, Payment, Damage, Trace, PendingChoices, CardImplementation-Host-Primitives und Legacy-Fallbacks. `index.test.ts` ist mit 49.711 LOC und 639 Tests ebenfalls ein Monolith.

Die neue `game/`-Struktur existiert, aber teils nur als Fassade zurück nach `index.ts`: `game/apply-game-action.ts`, `game/legal-actions.ts`, `game/player-view.ts` und `game/replay.ts` importieren weiterhin aus `../index`. Gute echte Schnitte gibt es schon bei `game/create-game.ts`, `game/validation.ts`, `game/payment/*`, `game/trace/*` und Teilen von `game/view/*`.

Kritisch neu gegenüber P3.70/P3.71: `index.ts`, `public-context.ts` und `ability-engine/` bleiben zwar ID-frei, aber `packages/engine/src/game/view/card-view.ts` enthält inzwischen 14 direkte ONR-v1-IDs. Das ist kein CardImplementation-Rückfall in `index.ts`, aber für das Zielbild "generische View-Schicht ohne konkrete Karten-IDs" eine neue Schuld.

## 2. Ausgangspunkt und Quellen

Ausgangspunkt:

| Prüfung | Befund |
| --- | --- |
| Worktree zu Beginn | sauber |
| Branch zu Beginn | `codex/card-implementation-next-task` |
| HEAD zu Beginn | `5e1d7064 Add collapsible catalog set filter` |
| Offene Änderungen zu Beginn | keine |
| P3.70 Commit | vorhanden: `983f3c4c109372a4f5b42ad1c5b653556350841f docs(engine): finalize card implementation phase` |
| P3.71 Commit | vorhanden: `4f72a106f934b87116af78b5910fc41abb0b0f51 docs(engine): document pending choice replay markers` |
| ARCH-1-final Commit | vorhanden: `d64122fcc2bbb6e7bd3166e4fc65a4c3114d281c docs(architecture): plan final engine module split` |

Gelesene Pflichtdokumente:

- `docs/architecture/ability-engine/card-implementation-phase-completion-p3-70.md`
- `docs/architecture/ability-engine/pending-choice-replay-marker-stability-p3-71.md`
- `docs/architecture/ability-engine/card-implementation-runtime-compatibility-p3-69.md`
- `docs/architecture/ability-engine/card-implementation-payload-replay-compatibility-p3-68.md`
- `docs/architecture/ability-engine/card-implementation-index-id-cleanup-p3-67.md`
- `docs/architecture/ability-engine/card-implementation-trace-run-access-id-cleanup-p3-66.md`
- `docs/architecture/ability-engine/card-implementation-coverage-universe-reconciliation-p3-63.md`
- `docs/architecture/engine-module-split-audit-and-plan-final.md`

Zusätzlich gelesen:

- `docs/architecture/engine-module-split-audit-and-plan.md`
- `docs/architecture/ability-engine/card-implementation-v1-master-plan.md`
- `docs/architecture/ability-engine/card-implementation-v1-card-inventory.md`
- `docs/architecture/ability-engine/card-implementation-v1-pattern-catalog.md`
- `docs/architecture/ability-engine/card-definition-ability-dsl-target-architecture.md`

Analysierte Codebereiche:

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/engine/src/public-context.ts`
- `packages/engine/src/game/`
- `packages/engine/src/compatibility/`
- `packages/engine/src/ability-engine/`
- `packages/engine/src/card-implementations/`
- `packages/engine/src/mechanics/`
- `packages/shared/src/index.ts`
- `apps/server/src/`
- `apps/web/app/`

## 3. Messwerte

### A. Codegrößen

| Datei | LOC |
| --- | ---: |
| `packages/engine/src/index.ts` | 32.111 |
| `packages/engine/src/index.test.ts` | 49.711 |
| `packages/engine/src/public-context.ts` | 1.661 |
| `packages/shared/src/index.ts` | 10.203 |
| `apps/web/app/page.tsx` | 13.736 |
| `apps/server/src/multiplayer.ts` | 3.423 |

Größte Dateien unter `packages/engine/src/ability-engine/`:

| Datei | LOC |
| --- | ---: |
| `card-implementation-runtime.ts` | 2.126 |
| `definition-types.ts` | 1.680 |
| `effect-interpreter.ts` | 1.592 |
| `card-implementation-effect-adapters.ts` | 354 |
| `active-modifiers.ts` | 312 |
| `card-implementation-modifiers.ts` | 291 |
| `effective-values.ts` | 249 |
| `steal-cost-modifiers.ts` | 240 |
| `printed-subroutine-implementations.ts` | 234 |
| `additional-subroutine-modifiers.ts` | 150 |
| `card-implementation-ability-limits.ts` | 139 |
| `trace-implementations.ts` | 132 |
| `break-subroutine-cost-modifiers.ts` | 126 |
| `ice-strength-modifiers.ts` | 122 |
| `trash-cost-modifiers.ts` | 109 |
| `icebreaker-abilities.ts` | 101 |
| `access-count-modifiers.ts` | 44 |
| `cost-pipeline.ts` | 25 |

Dateien unter `packages/engine/src/compatibility/`:

| Datei | LOC |
| --- | ---: |
| `payload-compatibility.ts` | 72 |
| `runtime-compatibility.ts` | 60 |

Größte Dateien unter `packages/engine/src/game/`:

| Datei | LOC |
| --- | ---: |
| `game/view/card-view.ts` | 806 |
| `game/payment/trace-payment.ts` | 698 |
| `game/validation.ts` | 530 |
| `game/payment/corp-rez-cost.ts` | 488 |
| `game/create-game.ts` | 475 |
| `game/index.test.ts` | 237 |
| `game/view/choice-view.ts` | 225 |
| `game/trace/base-link.ts` | 221 |
| `game/view/player-view-projection.ts` | 213 |
| `game/trace/trace-state.ts` | 134 |
| `game/trace/trace-result.ts` | 76 |
| `game/view/public-event-view.ts` | 65 |
| `game/payment/index.ts` | 58 |
| `game/payment/cost-quote.ts` | 48 |
| `game/view/server-view.ts` | 32 |
| `game/index.ts` | 28 |
| `game/hash.ts` | 13 |
| `game/apply-game-action.ts` | 10 |
| `game/legal-actions.ts` | 10 |
| `game/player-view.ts` | 11 |
| `game/replay.ts` | 10 |
| `game/trace/index.ts` | 5 |

### B. Funktionsgrößen in `index.ts`

Top 30 größte Funktionen in `packages/engine/src/index.ts`:

| Rang | Funktion | Zeilen | Start-Ende | Zielrichtung |
| ---: | --- | ---: | --- | --- |
| 1 | `performAction` | 1.401 | 7505-8905 | `game/apply-action` |
| 2 | `runnerMainActions` | 1.041 | 3433-4473 | `game/turn` / `game/legal-actions` |
| 3 | `corpMainActions` | 851 | 2394-3244 | `game/turn` / `game/legal-actions` |
| 4 | `resolvePendingChoice` | 436 | 22215-22650 | später `game/choices`, vorerst Host |
| 5 | `continueRun` | 432 | 11629-12060 | `game/run` |
| 6 | `installCard` | 367 | 10090-10456 | `game/turn/install` + `game/payment` |
| 7 | `resolveEventModificationChoice` | 272 | 18692-18963 | `game/damage` / `game/events` |
| 8 | `runnerEncounterActions` | 248 | 6121-6368 | `game/run/encounter` |
| 9 | `executeCardImplementationAccessEffectStep` | 213 | 14401-14613 | `game/access` + Ability adapter |
| 10 | `scoreAgenda` | 202 | 20920-21121 | `game/access` / `game/agenda` |
| 11 | `runnerAccessActions` | 195 | 7140-7334 | `game/access` |
| 12 | `resolveTraceRunnerBid` | 170 | 28845-29014 | `game/trace` |
| 13 | `startRun` | 156 | 10565-10720 | `game/run` |
| 14 | `resolveAssetAccessEffect` | 152 | 14883-15034 | `game/access` legacy fallback |
| 15 | `collectRuntimeDamagePreventionCandidates` | 144 | 18005-18148 | `game/damage` |
| 16 | `specialZoneHarnessActions` | 137 | 5477-5613 | vorerst Host, später `game/zones` |
| 17 | `resolveSuccessfulRunInterventionChoice` | 133 | 26859-26991 | `game/run` / `game/access` |
| 18 | `startRun` (Callback in Runtime-Deps) | 129 | 427-555 | Host-Primitive, später Run-Adapter |
| 19 | `completeTraceAfterPostBidLink` | 125 | 29162-29286 | `game/trace` |
| 20 | `applyV181SuccessfulRunCounterTriggers` | 124 | 16074-16197 | `game/run` / `game/access` |
| 21 | `rezCard` | 122 | 11112-11233 | `game/payment` / `game/run` |
| 22 | `movePastCurrentIce` | 120 | 12711-12830 | `game/run` |
| 23 | `successfulRunProgramActions` | 119 | 7020-7138 | `game/run` |
| 24 | `resolveUpgradeAccessEffect` | 115 | 14767-14881 | `game/access` |
| 25 | `applyCorpStartOfTurnEffects` | 109 | 16867-16975 | `game/turn` |
| 26 | `resolveCardImplementationLookTopStackTakeMatchingChoice` | 108 | 24208-24315 | `game/choices` / hidden zone |
| 27 | `collectReplacementCandidates` | 100 | 18464-18563 | `game/damage` / `game/events` |
| 28 | `accessCurrentCard` | 98 | 13999-14096 | `game/access` |
| 29 | `startTraceFromSubroutine` | 97 | 12361-12457 | `game/trace` |
| 30 | `advancementDistributionOptions` | 97 | 20444-20540 | `game/agenda` / `game/turn` |

Funktionsgrößen:

| Schwelle | Anzahl |
| --- | ---: |
| Funktionen gesamt nach AST-Zählung | 1.595 |
| > 100 Zeilen | 26 |
| > 250 Zeilen | 7 |
| > 500 Zeilen | 3 |

### C. Funktionsgrößen in `public-context.ts`

| Funktion | Zeilen | Start-Ende |
| --- | ---: | --- |
| `publicContextForAction` | 1.600 | 55-1654 |

`public-context.ts` hat genau eine Funktion. Messwerte in dieser Funktion: 739 `legalAction.payload`-Referenzen, 434 `context.*`-Zuweisungen, 27 `legalAction.type`-Checks, 15 `randomPurpose`-Treffer, 13 `specialZoneReason`-Treffer, 5 `hiddenZoneAction`-Treffer und 2 `encounterTaxSource`-Treffer. Das ist read-only, aber klar ein neuer Monolith.

### D. Teststruktur

| Datei | LOC | `describe` | `it`/`test` |
| --- | ---: | ---: | ---: |
| `packages/engine/src/index.test.ts` | 49.711 | 84 | 639 |
| `packages/engine/src/game/index.test.ts` | 237 | 1 | 7 |

Erkennbare Testfamilien in `index.test.ts`:

- P3.71 PendingChoice-/Replay-/Runtime-Compatibility-Marker
- MVP-Foundation, Setup, Mulligan, StateHash und Replay
- Proteus-Harness
- Originalset-Spotchecks 2026-05-15/16
- MVP 0.94 bis 0.99 Mechanikfamilien
- V1.x Kartenrelease- und Mechanikpaket-Blöcke
- CardImplementation-Coverage-/Registry-Invarianten
- CardImplementation-Mechaniktests und Runtime-Regressionsfamilien
- Run-/Access-/Trace-/Damage-/Payment-/PublicView-/HiddenInfo-Familien

Gut auslagerbar: P3.71-Marker, Coverage-/Registry-Invarianten, Game-Fassade/CreateGame/Validation/Hash, PublicView-/HiddenInfo-Tests und klar isolierte Payment-/Trace-Testfamilien. Vorerst besser in `index.test.ts` belassen: große historische Spotcheck-Blöcke mit mehreren Fachflows, CardImplementation-Regressionsketten, die Run/Access/Damage/Payment gemeinsam prüfen, und Tests, die alte Payload-/Replay-Marker zusammen mit Gameplay validieren.

### E. CardImplementation-Zahlen

| Kennzahl | Anzahl |
| --- | ---: |
| Shared CardDefinitions gesamt | 429 |
| ONR-v1 CardDefinitions | 374 |
| CardDefinitions außerhalb aktuellem ONR-v1-Scope | 55 |
| CardImplementation-Dateien unter `onr-v1/` | 373 |
| Registry-Einträge | 373 |
| Coverage `implemented` | 373 |
| Coverage `no_engine_behavior_required` | 1 |
| Coverage `pending_implementation` | 0 |
| Coverage `partial_implementation` | 0 |
| Coverage `legacy_engine_special_case` | 0 |
| Coverage `outside_current_release_scope` | 55 |

Konsistenzbefund:

| Prüfung | Befund |
| --- | --- |
| Doppelte CardImplementation-IDs in Dateien | keine |
| Doppelte Registry-IDs | keine |
| CardImplementation-Dateien ohne Registry | keine |
| Registry-Einträge ohne Datei | keine |
| Dateien mit `cardDefinitionId` | 373 von 373 |
| Registry-IDs eindeutig | 373 |
| Tycho Extension | keine Runtime-Datei, korrekt `no_engine_behavior_required` |

### F. Direkte `onr_v1_`-Reste

| Bereich | Treffer | Unique | Bewertung |
| --- | ---: | ---: | --- |
| `packages/engine/src/index.ts` | 0 | 0 | Zielzustand erreicht |
| `packages/engine/src/public-context.ts` | 0 | 0 | Zielzustand erreicht |
| `packages/engine/src/ability-engine/` | 0 | 0 | Zielzustand erreicht |
| `packages/engine/src/mechanics/` | 101 | 99 | bewusst verbliebene Mechanik-Kataloge, technische Schuld |
| `packages/engine/src/compatibility/` | 42 | 42 | bewusst gekapselte Runtime-/Replay-/Payload-Konstanten |
| `packages/engine/src/game/` | 14 | 14 | neuer View-ID-Rest in `game/view/card-view.ts` |
| Engine-Tests | 3.508 | 480 | erwartbar |
| Registry/Coverage | 329 | 329 | erwartbar |
| CardImplementation-Dateien | 373 | 373 | erwartbar |

Mechanics-Treffer nach Datei:

| Datei | Treffer | Unique |
| --- | ---: | ---: |
| `mechanics/longtail-card-effects.ts` | 30 | 30 |
| `mechanics/agenda-operation-effects.ts` | 19 | 19 |
| `mechanics/damage-prevention.ts` | 17 | 17 |
| `mechanics/hidden-zone.ts` | 17 | 15 |
| `mechanics/global-modifiers.ts` | 10 | 10 |
| `mechanics/asset-node-effects.ts` | 8 | 8 |

`game/view/card-view.ts` enthält direkte IDs an zwei Stellen: Agenda-/Score-Ableitungen bei Zeilen 29-31 und `STORED_CREDIT_COUNTER_DEFINITION_IDS` bei Zeilen 146-158. Das ist runtime- und view-relevant, aber nicht Hidden-Info-leakend per se; trotzdem gehört es mittelfristig hinter CardImplementation-/Mechanics-/Compatibility-Queries.

## 4. CardImplementation-Endstand

Bewertung: vollständig.

Begründung:

- ONR-v1 hat 374 CardDefinitions aus `data/cards/originalset-v1-cards.json`.
- 373 ONR-v1-Karten haben eine registrierte CardImplementation.
- Tycho Extension ist die einzige ONR-v1-Karte ohne Runtime-Datei und korrekt als `no_engine_behavior_required` klassifiziert.
- Es gibt keine ONR-v1-`pending_implementation`, keine `partial_implementation` und keine `legacy_engine_special_case`.
- Registry und Dateibestand sind konsistent.
- Coverage deckt 429 Shared CardDefinitions ab: 374 ONR-v1 und 55 außerhalb des aktuellen Release-Scope.

Tycho Extension ist korrekt behandelt: kein Fake-Runtime-Artefakt, normale Agenda-Daten reichen. Tests in `index.test.ts` bestätigen, dass `cardImplementationForDefinitionId("onr_v1_220_tycho-extension")` nicht existiert und Coverage `no_engine_behavior_required` meldet.

Keine echte ONR-v1-Restkarte bleibt offen. Die verbleibenden `onr_v1_`-Reste sind keine fehlenden CardImplementation-Dateien, sondern Compatibility-/Mechanics-/View-/Test-/Registry-/Coverage-Artefakte.

## 5. AbilityEngine-Systematik

Gute Schnitte:

- `definition-types.ts` ist als DSL-Vokabular fachlich sinnvoll. Mit 1.680 LOC ist es breit, aber überwiegend deklarativ und ohne direkte Karten-IDs.
- `card-implementation-runtime.ts` orchestriert generische Ausführung, Limits, Lifecycle und Payload-Merging. Es importiert nicht aus `index.ts` und enthält keine konkreten Karten-IDs.
- `effect-interpreter.ts` ist ein mutierender Interpreter für generische Effekte über Host-Callbacks. Die Rolle ist klarer als die alten direkten Resolver.
- `card-implementation-effect-adapters.ts` ist eine saubere Host-Brücke für Draw, Damage, Counter, Credits und Trash. Es vermeidet eine zweite Damage-/Draw-Engine.
- Modifier-Dateien wie `effective-values.ts`, `card-implementation-modifiers.ts`, `active-modifiers.ts`, `steal-cost-modifiers.ts`, `trash-cost-modifiers.ts`, `break-subroutine-cost-modifiers.ts`, `ice-strength-modifiers.ts` und `access-count-modifiers.ts` sind überwiegend read-only Query-/Quote-Module.
- Es wurden keine Importzyklen innerhalb `ability-engine/` gefunden.
- `ability-engine/` importiert nicht aus `index.ts`.
- `ability-engine/` kennt keine direkten `onr_v1_`-IDs.

Problematische Punkte:

- `cardImplementationRuntimeDeps` in `index.ts` ist 647 LOC groß und hat 65 gezählte Properties. Es ist die wichtigste technische Schuld: Die AbilityEngine bleibt zwar selbst sauber, aber ihr Host-Vertrag zieht große Teile von `index.ts` indirekt wieder hinein.
- `card-implementation-runtime.ts` ist mit 2.126 LOC groß. Es ist noch akzeptabel, aber sollte nicht weiter wachsen und keine weiteren Host-Fachflows aufnehmen.
- `definition-types.ts` ist breit genug, dass neue Features ohne Disziplin schnell als "alles in eine DSL-Datei" enden könnten.
- Host-Dependency-Objekte sind teilweise zu breit. `cardImplementationEffectAdapters` mit 16 Properties ist noch vertretbar, `cardImplementationRuntimeDeps` nicht.
- Konkrete Kartenlogik liegt überwiegend in CardImplementation-Dateien, aber `mechanics/*`, `compatibility/*` und `game/view/card-view.ts` enthalten weiterhin konkrete ID-Listen.

Bewertung: gut, aber mit breitem Host-Vertrag als zentraler Restschuld.

## 6. `index.ts`-Bewertung

`index.ts` ist heute keine Fassade. Es ist weiterhin ein Host-/Engine-Monolith mit öffentlicher API, Action-Dispatcher, LegalAction-Erzeugung, State-Mutation, Run-/Access-/Damage-/Trace-/Payment-Flows, PendingChoice-Resolution, PublicEvent-Kontext, CardImplementation-Host-Dependencies und Legacy-Fallbacks.

| Funktionsgruppe | Aktuelle Rolle | Problem? | Zielmodul | Risiko beim Verschieben | Empfehlung |
| --- | --- | --- | --- | --- | --- |
| Game orchestration | Exportiert `createGame`, `applyAction`, Views, Replay, Hash und Validation; teils schon delegiert | mittel | `game/` Fassade | Importzyklen, API-Drift | Fassade festigen, aber API-Werte stabil halten |
| `applyAction` / `performAction` | zentraler Dispatcher und Mutator; `performAction` 1.401 LOC | hoch | `game/apply-action` | Revalidation und Ausführung driften | nicht zuerst komplett verschieben; erst Fachflows ausdünnen |
| Turnflow | `corpMainActions`, `runnerMainActions`, Start-/End-Turn, install/play/action-budget | hoch | `game/turn` | Payment/ActionDebt/Install-Kosten brechen | erste produktive Code-Schnittfamilie nach Teststruktur |
| Runflow | Start, Continue, Approach, Encounter, Pass, Jack-out, run-end cleanup | hoch | `game/run` | Access-/Trace-/Payment-Folgefenster brechen | nach Turnflow, mit Run-Smokes |
| Accessflow | AccessQueue, Reveal, Steal, Trash, Ambush, Replacements | hoch | `game/access` | Hidden-Info-Leaks, Multiaccess-Regressions | nach Runflow, stark testgeführt |
| Payment / Revalidation | Install/Rez/Trash/Steal/Breaker/Trace/Temporary/Hosted Credits | hoch | `game/payment` | doppelte Kostenquelle, stale actions | Quote und Zahlung zusammenhalten |
| Damage / Prevention / Flatline | Damage windows, Replacement, Prevention, Flatline | hoch | `game/damage` | PendingChoices und Redaction brechen | nach Access/Payment, eigenes Paket |
| Trace | Trace bids, base link, post-bid link, trace result | mittel-hoch | `game/trace` | PendingChoice-Quellen, RNG/StateHash | bestehende `game/trace/*` fortsetzen, Werte nicht ändern |
| PlayerView / PublicPayload | PlayerView, PublicEvents, PublicContext, Redaction | hoch | `game/view` | Hidden-Info-Leaks, Web-Chronik-Bruch | spät splitten, nicht neben Flow-Änderung |
| CardImplementation wiring | RuntimeDeps, EffectAdapters, AbilityLimits | hoch | `ability-engine` + kleine Host-Adapter | breiter Host wandert nur mit | Host-Deps pro Flow reduzieren |
| Compatibility / Runtime markers | `v19xx`, `p3_`, RNG-/Payload-/Choice-Werte | hoch | `compatibility` | Replay/PendingChoice/Web brechen | Werte stabil halten, nur kapseln |
| Legacy fallback | historische Run-/Access-/Mechanikpfade ohne ID-Reste in `index.ts` | mittel | `mechanics` / Fachmodule | verdeckte Doppeleffekte | nur nach Tests und Inventar verschieben |
| Test/debug helpers | Harness, SpecialZones, Debug/Validation | mittel | `game/test-support` oder `game/zones` spät | Test-Harness und Runtime vermischen | später schneiden, nicht zuerst |

Was zuerst raus sollte:

1. isolierte Compatibility-/Coverage-/Registry-Tests aus `index.test.ts`, ohne Produktionscode.
2. Turn/MainAction-Testfamilien oder kleine Turnflow-Produktionseinheiten.
3. Runflow-Eintrittspunkte und Run-State-Mutation.
4. Accessflow erst nach Runflow.

Was bewusst noch bleiben sollte:

- `resolvePendingChoice`, bis die wichtigsten Fachflows aus `index.ts` heraus sind.
- Compatibility-/Replay-/Payload-Markerwerte.
- PublicContext-Feldnamen und ActionID-Bestandteile.
- Host-Primitives, solange das Zielmodul noch keine enge Dependency-Schnittstelle hat.

## 7. `public-context.ts`-Bewertung

Bewertung: neuer Monolith, aber nicht kritisch.

Gute Punkte:

- Die Datei ist laut Kopfkommentar ausdrücklich read-only.
- Sie importiert nicht aus `index.ts`.
- Sie enthält keine direkten `onr_v1_`-IDs.
- Sie mutiert keinen `GameState`; sie baut nur ein neues `context`-Objekt.
- Sie enthält wichtige Hidden-Info-Redaktion und Legacy-Feldweiterleitung.
- Die Dependency-Injection ist mit 8 Properties klein und gut begrenzt.

Probleme:

- Eine Funktion mit 1.600 Zeilen ist strukturell zu groß.
- 739 Payload-Referenzen und 434 `context.*`-Zuweisungen machen die Datei schwer überprüfbar.
- Action-Familienlogik für Run, Access, Trace, Payment, Damage, HiddenZone und CardImplementation liegt in einer Reihenfolge statt in expliziten Familienmodulen.
- Viele Legacy-Felder (`v19xx`, `p3_`, `hiddenZoneAction`, `specialZoneReason`, `randomPurpose`, `encounterTaxSource`) sind Vertragsfläche, aber nur indirekt gruppiert.

Sollte sie gesplittet werden? Ja, aber später und strikt read-only. Ziel wäre `game/view/public-context/*` mit Familien wie `run-context`, `access-context`, `trace-context`, `damage-context`, `payment-context`, `hidden-zone-context`, `card-implementation-context` und `legacy-context`.

Risiken eines Splits:

- Hidden-Info-Leak durch falsches Weiterreichen von privaten Payloadfeldern.
- Web-/Chronik-/ActionBoard-Bruch durch Feldnamenänderung.
- Replay-Vergleich driftet, wenn PublicPayload-Kontext anders serialisiert wird.

Nötige Tests:

- Engine PublicPayload-/PublicEvent-Regressionen.
- Hidden-Info-PlayerView-Tests.
- Web `action-board-ui.test.ts`, `chronicle.test.ts`, `action-cues.test.ts`.
- Replay-/StateHash-Tests, soweit PublicPayload im Eventstream verglichen wird.

## 8. Compatibility-/Replay-/PendingChoice-Reste

Bewusst verbleibende Markerfamilien:

- Legacy ActionID-/Payload-Felder aus `ACTION_ID_LEGACY_ABILITY_PAYLOAD_FIELDS`, z. B. `v1911HiddenZoneAbility`, `v1921RunnerProgramAbility`, `resourceAbility`, `runnerAbility`, `shellTradersAbility`, `acmeSavingsAndLoanAbility`, `agendaAbility`.
- P3.58 PendingChoice-Quellen für Fortress Respecification, Social Engineering und New Blood.
- Replay-`PlayerAction`-Struktur mit `matchId`, `side`, `actionId`, `clientKnownStateVersion`.
- Runtime-Kompatibilitätskonstanten in `runtime-compatibility.ts`: Virus, Icebreaker, Hosted/Restricted Credits, Hidden-Zone/Special-Zone, Damage/Prevention/Flatline, Access/Run/Encounter, Random/Replay.
- PublicPayload-Felder wie `sourceDefinitionId`, `specialZoneReason`, `hiddenZoneAction`, `encounterTaxSource`, `randomPurpose`, `randomCounterAfter`, temporäre Credits und delayed-/future-Felder.

PublicPayload-Vertrag:

- Feldnamen und Legacy-Ability-Felder.
- `hiddenZoneAction`, `specialZoneReason`, `encounterTaxSource`, `sourceDefinitionId`.
- Web-/Chronik-Interpretation in `apps/web/app/chronicle.ts`, `action-board-ui.ts`, `action-payload.ts` und verwandten Tests.

Replay-Vertrag:

- `PlayerAction`-Payloadstruktur.
- ActionID-Bestandteile.
- RNG-Purpose-Strings und `RandomDrawRecord`-Purpose-Werte.
- RunState-/Damage-Attributionen, wenn sie in Eventlogs landen.

PendingChoice-Vertrag:

- `choiceId`, `source`, `kind`, `options`, `stateVersion`.
- Source-Präfixe wie `p3_33`, `p3_35`, `p3_37`, `p3_38`, `p3_47`, `p3_54`, `p3_56`, `p3_58`, `trace:*`, `trace_base_link:*`, `trace_post_bid_link:*`, `v1911`, `v1912`, `v1913`, `v1921`, `v1922`.

Interne Runtime-Kompatibilität:

- Karten-/Source-Konstanten in `runtime-compatibility.ts`, z. B. `MICROTECH_TRODE_SET_ID`, `SHELL_TRADERS_ID`, `CODE_VIRAL_CACHE_ID`, `MIT_WEST_TIER_REMOVED_FROM_GAME_REASON`, `BALL_AND_CHAIN_ENCOUNTER_TAX_SOURCE`, `FATAL_ATTRACTOR_NEXT_ENCOUNTER_DAMAGE_SOURCE`.

Mittelfristig abbaubar:

- Legacy-Feldnamen und `v19xx`-/`p3_`-Marker nur nach eigenem PublicPayload-/Replay-/Web-Migrationsgate.
- Runtime-Konstanten nur, wenn sie hinter typed Capability-/Effect-/Modifier-Queries verschwinden und alte Replays/Choices weiterhin verstanden werden.

Dauerhaft bleiben sollten:

- ein Compatibility-Layer für historische Replay-/Payload-/ActionID-Werte.
- Pinning-Tests für Marker, solange alte Replays oder laufende PendingChoices relevant sein können.

## 9. Mechanics-Reste

`packages/engine/src/mechanics/` enthält weiterhin direkte ONR-v1-IDs, aber nicht mehr in generischen AbilityEngine-Modulen. Die Dateien sind kleinere Kataloge und Listen nach Mechanikfamilien:

- `longtail-card-effects.ts`: 30 Treffer; per-card Longtail-, Run-, Install-, Trash-, Score- und Hardware-/Program-Familien.
- `agenda-operation-effects.ts`: 19 Treffer; Agenda-/Operation-/Counter-/Access-Familien.
- `damage-prevention.ts`: 17 Treffer; Damage-/Prevention-/Flatline-Familien.
- `hidden-zone.ts`: 17 Treffer; Search, Reveal, Reorder, Stack/HQ/R&D/Archives, Special-Zone-Hilfen.
- `global-modifiers.ts`: 10 Treffer; globale Modifier, Handgröße, Tags, Rez-Kosten, Action Economy.
- `asset-node-effects.ts`: 8 Treffer; Asset-/Node-, Trace-, Hosting-, Ambush- und Counter-Effekte.

Bewertung:

- Bewusst: Die IDs sind dokumentierte Mechanik-Kataloge und keine fehlenden CardImplementation-Dateien.
- Problematisch: Viele Dateien sind noch ID-Listen statt echte typed Capability-/Query-Module. Sie entlasten `index.ts` optisch, aber nicht vollständig fachlich.
- Historisch benannt: mehrere Konstanten tragen Release-/Kartenfamiliennamen statt generischer Capability-Namen.
- Sinnvolle spätere Bereinigung: zuerst Hidden-Zone und Longtail-Familien inventarisieren, danach View-ID-Reste in `card-view.ts` und Mechanics-ID-Listen über CardImplementation-/Modifier-/Effective-Value-Queries ersetzen.

Nicht sinnvoll: Mechanik-ID-Reste pauschal löschen. Sie sind teils Runtime-Katalog, teils Compatibility, teils Übergangsbrücke.

## 10. Teststruktur-Bewertung

`index.test.ts` ist zu groß. 49.711 LOC, 84 `describe`-Blöcke und 639 Tests sind als historische Gate-Historie wertvoll, aber für gezielte Reviews und künftige Modulgrenzen schlecht nutzbar.

Empfohlene Zielordner:

- `packages/engine/src/compatibility/*.test.ts`
- `packages/engine/src/card-implementations/*.test.ts`
- `packages/engine/src/game/*.test.ts`
- `packages/engine/src/game/turn/*.test.ts`
- `packages/engine/src/game/run/*.test.ts`
- `packages/engine/src/game/access/*.test.ts`
- `packages/engine/src/game/payment/*.test.ts`
- `packages/engine/src/game/damage/*.test.ts`
- `packages/engine/src/game/trace/*.test.ts`
- `packages/engine/src/game/view/*.test.ts`
- `packages/engine/src/ability-engine/*.test.ts`

Phase A: Compatibility-/Coverage-/Registry-Tests auslagern.

- Ziel: `compatibility/replay-marker-stability.test.ts`, `card-implementations/coverage.test.ts`, `card-implementations/registry.test.ts`.
- Warum: Diese Tests sind isoliert genug und ändern kein Gameplay.
- Risiko: Testfilter/Imports brechen, aber Verhalten nicht.
- Akzeptanz: keine Assertion-Semantik geändert, `index.test.ts` sinkt messbar, betroffene Tests grün.

Phase B: PublicView-/HiddenInfo-Tests auslagern.

- Ziel: `game/view/player-view.test.ts`, `game/view/public-context.test.ts`, `game/view/hidden-info.test.ts`.
- Warum: Hidden-Info-Schutz muss bei jedem Flow-Schnitt auffindbar bleiben.
- Risiko: Redaction-Feldbrüche, Web-Erwartungen.
- Akzeptanz: PlayerView/PublicEvent/PublicPayload unverändert, Web-Tests bleiben grün.

Phase C: Run-/Access-/Trace-/Damage-/Payment-Familien auslagern.

- Ziel: `game/run/*.test.ts`, `game/access/*.test.ts`, `game/trace/*.test.ts`, `game/damage/*.test.ts`, `game/payment/*.test.ts`.
- Warum: Diese Familien folgen späteren Produktionsmodulschnitten.
- Risiko: historisch gekoppelte Spotchecks werden künstlich getrennt.
- Akzeptanz: nur fachlich klare Blöcke bewegen; große Cross-Flow-Spotchecks vorerst belassen.

Phase D: große CardImplementation-Regressionsfamilien bündeln.

- Ziel: `card-implementations/onr-v1-regressions.test.ts` oder nach Familien `card-implementations/run-access.test.ts`, `card-implementations/damage-prevention.test.ts`, `card-implementations/modifiers.test.ts`.
- Warum: CardImplementation-Tests sind inzwischen die größte Fachhistorie.
- Risiko: zu frühes Splitten verschleiert Releasekontext.
- Akzeptanz: Coverage-/Registry-Schutz separat, Mechanikregressionen gruppiert, keine Testinhalte verändert.

## 11. Match-vs-Game-Grenze

Game:

- Regellogik
- LegalActions
- `applyAction`
- Turn/Run/Access/Damage/Trace/Payment
- `GameState` transition
- PublicEvents
- PlayerView
- Replay, StateHash und deterministische RNG

Match:

- Spielerplätze
- User-to-side mapping
- Reconnect
- CommandLog
- Snapshots
- MatchStatus
- Spectators
- Authorization
- Persistenz-/Session-Rahmen

Aktueller Codebefund:

- `apps/server/src/multiplayer.ts` importiert `applyAction`, `createGame`, `getLegalActions`, `getPlayerView`, `hashState`, `isHiddenInfoBarrierEvent` und `replayEvents` aus `@netgrid/engine`.
- `apps/server/src/multiplayer.ts` ist faktisch Match-Orchestrierung: Lobby, MatchRecord, Series, Tokens, Session, AI, Storage, Reconnect, Undo und Public Payloads.
- `apps/web/app/` konsumiert überwiegend `PlayerView`, `LegalAction`, `PublicGameEvent` und API-Payloads. Es ist keine Regelautorität, interpretiert aber viele Legacy-Felder für ActionBoard und Chronik.

Bewertung:

- Match-Auslagerung sollte nicht sofort kommen.
- Zuerst braucht es eine stabilere Game-Fassade und eine entlastete Teststruktur.
- Ein zu früher Match-Schnitt würde Server-Persistenz, Authorization und Engine-Regeln vermischen oder nur einen dünnen Wrapper um `index.ts` erzeugen.
- SQLite, HTTP/WebSocket, Tokens, Rate Limits und Sessiondaten bleiben servernah; sie gehören nicht in `packages/engine`.

## 12. Was ist gut?

- ONR-v1 CardImplementation ist vollständig.
- Registry, Dateien und Coverage sind konsistent.
- Tycho Extension ist korrekt als no-runtime-Fall behandelt.
- `index.ts`, `public-context.ts` und `ability-engine/` sind frei von direkten ONR-v1-IDs.
- `ability-engine/` importiert nicht aus `index.ts` und hat keine internen Importzyklen.
- `definition-types.ts`, Runtime, Effect-Interpreter und Modifier-Queries bilden eine erkennbare Systematik.
- Compatibility-Marker sind dokumentiert und stabilisiert.
- Replay-/PendingChoice-/PublicPayload-Verträge wurden nicht verdeckt geändert.
- Erste echte `game/`-Module existieren: CreateGame, Validation, Payment, Trace, View-Projektion.
- Server/Web verwenden Engine/Shared-Verträge statt eigene Regelentscheidungen zu treffen.

## 13. Was ist schlecht?

- `index.ts` ist mit 32.111 LOC weiterhin der zentrale Monolith.
- `performAction`, `runnerMainActions` und `corpMainActions` sind extrem groß.
- `index.test.ts` ist mit 49.711 LOC und 639 Tests zu groß.
- `cardImplementationRuntimeDeps` ist mit 647 LOC und 65 Properties viel zu breit.
- `public-context.ts` ist ein neuer 1.600-Zeilen-Monolith.
- `mechanics/*` sind oft ID-Kataloge statt echte Fachmodule.
- `game/apply-game-action.ts`, `game/legal-actions.ts`, `game/player-view.ts` und `game/replay.ts` sind Fassaden zurück zu `index.ts`.
- `game/view/card-view.ts` enthält 14 direkte ONR-v1-IDs.
- Compatibility-/Runtime-Marker bleiben technische Schuld, auch wenn sie bewusst stabilisiert sind.
- Gefahr eines verteilten Monolithen: Wenn Run/Access/Turn nur große Dependency-Objekte bekommen, verschiebt sich das Problem aus `index.ts` in mehrere neue Dateien.

## 14. Was ist unklar?

- Wie lange alte PublicPayload-/Chronik-/ActionBoard-Felder aktiv kompatibel bleiben müssen.
- Ob und wann gespeicherte Replays oder laufende PendingChoices migriert werden dürfen.
- Ob Mechanics-ID-Kataloge vollständig entfernbar sind oder dauerhaft als deklarierte Compatibility-/Mechanics-Schicht bleiben.
- Ob die aktuelle Game-Fassade stabil genug ist, bevor Produktionsflows verschoben werden.
- Wie weit `packages/shared/src/index.ts` langfristig typ- und katalogseitig aufgeteilt werden soll.
- Ob `game/view/card-view.ts`-ID-Reste eher in Mechanics, AbilityEngine Effective Values oder Compatibility gehören.

## 15. Risiken

| Risiko | Bewertung | Beleg | Gegenmaßnahme |
| --- | --- | --- | --- |
| Replay bricht durch Markerumbenennung | hoch | P3.71, `compatibility/*`, RNG-/ActionID-Marker | Werte nicht ändern; eigene Migration |
| PendingChoice-Auflösung bricht | hoch | `resolvePendingChoice` 436 LOC, P3.58/P3.71-Quellen | Choice-Source-Werte pinnen |
| Hidden-Info-Leak bei View-/PublicContext-Split | hoch | `public-context.ts` 1.600 LOC, Web-ActionBoard/Chronik | View-Split spät und testgeführt |
| PublicPayload-Vertragsbruch | hoch | Legacy-Feldweiterleitung in `public-context.ts` | keine Feldumbenennung nebenbei |
| Payment/Revalidation driftet | hoch | Payment über Turn/Run/Access/Trace verteilt | Quote und Zahlung gemeinsam schneiden |
| Verteilter Monolith entsteht | hoch | `cardImplementationRuntimeDeps` 65 Properties | kleine Dependencies pro Fachmodul |
| Importzyklen durch Game-Fassade | mittel-hoch | mehrere `game/*`-Wrapper importieren `../index` | Zyklen pro Schritt prüfen |
| Mechanics-Reste bleiben unklar | mittel | 101 IDs in `mechanics/*` | inventarisieren, nicht pauschal löschen |
| Tests werden unauffindbar | mittel | `index.test.ts` 49.711 LOC | Teststruktur zuerst entlasten |
| Match-Schnitt zu früh | mittel | `apps/server/src/multiplayer.ts` ist servernaher Match-Orchestrator | erst nach Game-Fassade/Flow-Schnitten |

## 16. Empfehlung und Roadmap

Priorität 1: Teststruktur entlasten.

- Warum: Der nächste risikoärmste Schritt ist dokumentarisch/teststrukturell, nicht produktionslogisch. P3.71- und Coverage-/Registry-Tests sind isoliert genug.
- Umfang: P3.71-Marker-Tests nach `packages/engine/src/compatibility/`; Coverage-/Registry-Invarianten nach `packages/engine/src/card-implementations/`.
- Risiko: niedrig bis mittel; keine Assertion-Semantik ändern.
- Akzeptanzkriterien: `index.test.ts` sinkt messbar; keine Produktionscodeänderung; Engine-Typecheck und betroffene Tests grün.

Priorität 2: Game-Fassade / applyAction-Grenze festigen.

- Warum: `game/*` existiert, aber zentrale Wrapper gehen zurück nach `index.ts`.
- Umfang: keine Semantikänderung; Entry Points und Importgrenzen klarer dokumentieren/prüfen.
- Risiko: mittel wegen Importzyklen.
- Akzeptanzkriterien: öffentliche Engine-API kompatibel; keine PublicPayload-/PlayerView-/PublicEvent-Änderung; Zykluscheck.

Priorität 3: TurnFlow.

- Warum: `runnerMainActions` und `corpMainActions` sind die größten LegalAction-Erzeuger nach `performAction`.
- Umfang: Turn/MainActions, Start-/End-Turn, Action Budget, Install/Play nur soweit nötig.
- Risiko: hoch wegen Payment, ActionDebt und Install-Revalidation.
- Akzeptanzkriterien: gleiche LegalActions und stale-action-Rejections; keine neuen Karten-IDs in generischem Turn-Modul.

Priorität 4: RunFlow.

- Warum: Run ist fachlich zusammenhängend und bereitet Access sauber vor.
- Umfang: StartRun, Approach, Encounter, Pass, JackOut, RunEnd, SuccessfulRun.
- Risiko: hoch wegen Trace-/Access-/Payment-Folgefenstern.
- Akzeptanzkriterien: RunState, PublicPayload, Replay und StateHash unverändert.

Priorität 5: AccessFlow.

- Warum: Access/Breach ist hidden-info-sensibel und sollte erst nach Run geschnitten werden.
- Umfang: AccessQueue, Reveal, Steal, Trash, Ambush, Replacements.
- Risiko: sehr hoch für Hidden Info und Multiaccess.
- Akzeptanzkriterien: keine unreached-card-Leaks; Full Archives/HQ/R&D/Remote-Regressionen grün.

Priorität 6: Payment/Revalidation.

- Warum: Payment ist Querschnitt und darf nicht als reine `spendCredits`-Hilfsdatei enden.
- Umfang: CostQuote, payment execution, hosted/restricted/temporary credits, stale revalidation.
- Risiko: hoch.
- Akzeptanzkriterien: Quote und Execution nutzen gemeinsame Helper; PublicPayload-Kosten stabil.

Priorität 7: Damage und Trace.

- Warum: fachlich klare, aber PendingChoice-/Replay-relevante Familien.
- Umfang: Damage/Prevention/Flatline; Trace bids/base-link/post-bid/result.
- Risiko: hoch wegen Choice-Source- und RNG-/Payload-Werten.
- Akzeptanzkriterien: Markerwerte unverändert; Damage-/Trace-Smokes grün.

Priorität 8: PublicContext splitten.

- Warum später: Die Datei ist read-only, aber Vertragsfläche für Hidden Info, Web und Chronik.
- Umfang: interne Familienmodule unter `game/view/public-context/`.
- Risiko: hoch für Hidden Info und Web-Chronik.
- Akzeptanzkriterien: PublicPayload-Feldnamen, Redaction und Web-Tests unverändert.

Priorität 9: Payload-/Replay-Migration.

- Warum: Das ist ein eigenes großes Paket, kein Cleanup-Nebenprodukt.
- Umfang: Legacy-Feld-/Marker-Migration, Replay-Kompatibilität, Web-/Chronik-Anpassung, PendingChoice-Strategie.
- Risiko: sehr hoch.
- Akzeptanzkriterien: alte Replays/Choices kompatibel oder explizit migriert; P3.71-Pinning angepasst.

Ausdrücklich nicht als nächstes machen:

- Keine Markerwerte umbenennen.
- Keine PublicPayload-/PlayerView-/PublicEvent-Felder ändern.
- Kein Match-Modul vor stabiler Game-Fassade.
- Kein großer `index.ts`-Big-Bang-Split.
- Keine Mechanics-ID-Listen pauschal löschen.
- Keine Teststruktur-Moves gleichzeitig mit Produktionsflow-Refactoring.
- Keine neue generische Trigger Registry als Nebenprodukt eines Modulsplits.

## 17. Konkreter nächster Auftrag

Empfohlener nächster Auftrag:

```text
Arbeite im aktuellen NETGRID-Worktree und auf dem aktuellen Branch.

Dies ist ENGINE-TESTSTRUCTURE-1.

Ziel:
Entlaste `packages/engine/src/index.test.ts` ausschließlich durch reine Teststruktur-Moves.

Scope:
- Keine Produktionscodeänderungen.
- Keine Assertion-Semantik ändern.
- Keine Kartenmigrationen.
- Keine PublicPayload-/PlayerView-/PublicEvent-Vertragsänderungen.
- Keine UI-Änderungen.

Umsetzen:
1. Verschiebe die P3.71 PendingChoice-/Replay-/Runtime-Compatibility-Marker-Tests aus `index.test.ts` nach `packages/engine/src/compatibility/replay-marker-stability.test.ts`.
2. Verschiebe CardImplementation-Coverage-/Registry-Invarianten nach `packages/engine/src/card-implementations/coverage.test.ts` und/oder `registry.test.ts`, falls sie isolierbar sind.
3. Lasse große historische Flow-, Spotcheck- und CardImplementation-Regressionsblöcke zunächst in `index.test.ts`.
4. Führe Engine-Typecheck und die betroffenen Tests aus.

Akzeptanz:
- Keine Assertion-Inhalte geändert.
- Marker-/Coverage-Tests sind fachlich auffindbar.
- `index.test.ts` ist kleiner.
- Engine-Typecheck grün.
- Betroffene Tests grün.
```
