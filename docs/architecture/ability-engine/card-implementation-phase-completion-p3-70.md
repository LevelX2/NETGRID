# P3.70 CardImplementation Phase Completion Audit

Stand: 2026-05-22

## 1. Kurzfazit

Die ONR-v1-CardImplementation-Phase ist nach P3.69 fachlich abgeschlossen. Der aktuelle ONR-v1-Scope umfasst 374 Karten: 373 Karten haben eine registrierte CardImplementation, und Tycho Extension ist die einzige Karte mit `no_engine_behavior_required`, weil sie keine zusätzliche Engine-Laufzeitlogik über normale Agenda-Daten hinaus benötigt.

Es bleiben keine ONR-v1-Karten mit `pending_implementation`, `partial_implementation` oder `legacy_engine_special_case`. `packages/engine/src/index.ts`, `packages/engine/src/public-context.ts` und `packages/engine/src/ability-engine/` sind frei von direkten `onr_v1_`-Resten. Die verbliebenen ID-Reste liegen bewusst in Mechanik-Katalogen und in gekapselten Compatibility-Konstanten.

## 2. Scope und Voraussetzungen

P3.70 ist ein Audit- und Abschlussdokumentationspaket. Es führt keine neue Kartenmechanik, keine Kartenmigration, keinen Modulsplit, keine allgemeine Trigger Registry, keine UI-Änderung und keine PublicPayload-/PlayerView-/PublicEvent-Vertragsänderung ein.

Geprüfte Voraussetzungen:

| Voraussetzung | Befund |
| --- | --- |
| Worktree zu Beginn sauber | Ja |
| Aktueller Branch | `codex/card-implementation-next-task` |
| P3.69 vorhanden | `1d6215bb34f95ab3bd574d7ed189a8a032717b87 refactor(engine): organize runtime compatibility constants` |
| P3.68 vorhanden | `0d6830c7e4072d82bb322b3a80e0381e648b502d refactor(engine): isolate payload replay compatibility markers` |
| P3.63 vorhanden | `c670e4a302b8cff17a53e44d06c3917c024a5f88 chore(engine): reconcile card implementation coverage` |

Gelesene Vorbefunde:

| Artefakt | Befund |
| --- | --- |
| `card-implementation-coverage-universe-reconciliation-p3-63.md` | vorhanden |
| `card-implementation-engine-id-residue-p3-64.md` | vorhanden |
| `card-implementation-trace-run-access-id-cleanup-p3-66.md` | vorhanden |
| `card-implementation-index-id-cleanup-p3-67.md` | vorhanden |
| `card-implementation-payload-replay-compatibility-p3-68.md` | vorhanden |
| `card-implementation-runtime-compatibility-p3-69.md` | vorhanden |

P3.70-Qualitätsstand:

| Check | Ergebnis |
| --- | --- |
| `corepack pnpm --filter @netgrid/engine typecheck` | pass |
| fokussierter `src/index.test.ts`-Vitest-Lauf für Coverage-/Registry-/Statusbegriffe | pass, 56 Tests ausgeführt, 575 übersprungen |
| `corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts` | pass, 631 Tests |
| `corepack pnpm --filter @netgrid/web typecheck` | pass |
| `git diff --check` | pass |
| `git diff --cached --check` | pass |

## 3. Coverage-Endstand

Die Coverage-Zahlen bleiben gegenüber P3.63/P3.69 unverändert.

| Kennzahl | Anzahl | Quelle/Befund |
| --- | ---: | --- |
| Shared CardDefinitions gesamt | 429 | `DEMO_CARDS_BY_ID` / P3.63-Reconciliation |
| ONR-v1 CardDefinitions | 374 | `data/cards/originalset-v1-cards.json`; `onr_v1_\d{3}_`-Scope |
| CardDefinitions außerhalb ONR-v1-Scope | 55 | lokale Demo-/Test-/Proteus-Harness-Karten |
| CardImplementation-Dateien | 373 | `packages/engine/src/card-implementations/onr-v1/` |
| Registry-Einträge | 373 | `packages/engine/src/card-implementations/registry.ts` |
| Coverage-Einträge | 429 | `packages/engine/src/card-implementations/coverage.ts` |

Statusverteilung:

| Coverage-Status | Gesamt | ONR-v1 |
| --- | ---: | ---: |
| `implemented` | 373 | 373 |
| `no_engine_behavior_required` | 1 | 1 |
| `pending_implementation` | 0 | 0 |
| `partial_implementation` | 0 | 0 |
| `legacy_engine_special_case` | 0 | 0 |
| `outside_current_release_scope` | 55 | 0 |

ONR-v1 ist damit vollständig abgedeckt. Die einzige `no_engine_behavior_required`-Karte ist `onr_v1_220_tycho-extension`; für sie gibt es bewusst keine Fake-Runtime-Datei.

## 4. Spoiler-/CardDefinition-Abgleich

Der ONR-v1-Spoiler- und CardDefinition-Abgleich bleibt geschlossen:

| Prüffrage | Befund |
| --- | --- |
| Runner-Spoilerkarten | 187 |
| Corp-Spoilerkarten | 187 |
| ONR-v1 CardDefinitions | 374 |
| Jede Spoilerkarte hat eine CardDefinition | Ja, nach validiertem Inventory |
| Jede ONR-v1 CardDefinition ist im Spoiler | Ja, nach validiertem Inventory |
| Abweichende IDs oder normalisierte Titel | Keine neue Abweichung in P3.70 gefunden; bestehende Normalisierungen sind in Inventory/Audits dokumentiert |
| Tycho/no-runtime-Fall | `onr_v1_220_tycho-extension` ist korrekt als `no_engine_behavior_required` klassifiziert |

Die führenden Abgleichsartefakte bleiben `card-implementation-v1-card-inventory.md`, `card-implementation-v1-master-plan.md`, der P3.63-Reconciliation-Befund und `data/cards/originalset-v1-cards.json`. P3.70 baut keinen neuen Parser; die stichhaltige Abschlussprüfung nutzt die vorhandene validierte Inventory-Linie plus den aktuellen Codezustand.

## 5. Registry-/Datei-Konsistenz

Der Registry-/Dateiabgleich ist konsistent:

| Prüffrage | Befund |
| --- | --- |
| Jede CardImplementation-Datei hat eine `cardDefinitionId` | Ja |
| Jede Datei hat eine eindeutige `cardDefinitionId` | Ja |
| Jede Registry-ID existiert als CardDefinition | Ja |
| Doppelte Registry-ID | Keine |
| Jede `implemented`-ONR-v1-Karte ist registriert | Ja |
| Registrierte Karte mit Coverage pending/partial/outside-scope | Keine |
| CardImplementation-Datei ohne Registry-Export | Keine |
| Registry-Export ohne Datei | Keiner |
| `no_engine_behavior_required` mit Fake-Runtime-Datei | Keine; Tycho Extension ist nicht registriert |

Diese Konsistenz wird zusätzlich durch den bestehenden Test `requires implementation coverage for every demo card` und den P3.63-Test `reconciles CardImplementation coverage against the ONR-v1 release scope` geschützt.

## 6. Direct-ID-Restmessung

Finale `onr_v1_`-Treffer nach Bereich:

| Bereich | Treffer | Einordnung |
| --- | ---: | --- |
| `packages/engine/src/index.ts` | 0 | Zielzustand erreicht |
| `packages/engine/src/public-context.ts` | 0 | bleibt ID-frei |
| `packages/engine/src/ability-engine/` | 0 | bleibt ID-frei |
| `packages/engine/src/mechanics/` | 101 | bewusst verbliebene Mechanik-Kataloge |
| `packages/engine/src/compatibility/` | 42 | bewusst gekapselte Runtime-/Replay-/Payload-Kompatibilitätskonstanten |

Mechanik-Reste liegen aktuell in:

| Datei | Treffer | Klassifikation |
| --- | ---: | --- |
| `mechanics/agenda-operation-effects.ts` | 19 | Agenda-/Operation-/Counter-/Access-Familien |
| `mechanics/asset-node-effects.ts` | 8 | Asset-/Node-Effekte und Access-Ambush-Familien |
| `mechanics/damage-prevention.ts` | 17 | Damage-/Prevention-/Flatline-Familien |
| `mechanics/global-modifiers.ts` | 10 | globale Modifikatoren und Hand-/Tag-/Kostenfamilien |
| `mechanics/hidden-zone.ts` | 17 | Hidden-Zone-/Reveal-/Reorder-/Search-Familien |
| `mechanics/longtail-card-effects.ts` | 30 | Per-card Longtail-, Run-, Install-, Trash- und Score-Familien |

Diese Mechanikdateien sind weiterhin kartenspezifische Kataloge. Ihre Entfernung gehört nicht in den CardImplementation-Abschluss, sondern in spätere gezielte Mechanik- oder Payload-Migrationen.

## 7. Runtime-/Payload-/Replay-Kompatibilitätsreste

Nach P3.69 sind die direkten `index.ts`-Runtime-IDs in `packages/engine/src/compatibility/runtime-compatibility.ts` gekapselt. Die Markerwerte wurden nicht geändert.

Bewusst verbleibende Runtime-Konstantenfamilien:

| Familie | Zweck | Relevanz |
| --- | --- | --- |
| Virus Runtime Constants | Virus-Counter, Purge-/Preserve-Choices, Incubator-Transformation, Counter Stores | Choice-, State- und Replay-relevant |
| Icebreaker Runtime Constants | Run-/Breaker-Kosten, Schäden, Trode-AP, Hosted-Credit-/Speed-Chip-Guards | Revalidation- und RunState-relevant |
| Recurring/Hosted/Restricted Credit Constants | Recurring-Credit-Initialisierung, Hosted-/Restricted-Credit-Auswahl, Shell-Traders-Set-Aside | Payload- und Zahlungsattribution |
| Hidden-Zone/Special-Zone Constants | Hidden-Zone-Choices, temporäre Installs, Delayed Claims, Removed-from-game-Gründe | PublicPayload und Replay |
| Damage/Prevention/Flatline Constants | Damage-Attribution und Replacement-Quellen | Ereignis-/Damage-Kontext |
| Access/Run/Encounter Constants | Encounter-Tax, Run-Fallback-Attribution, Secret-Spend/Run-Folgeeffekte | PublicPayload-/RunState-Kontext |
| Random/Replay Purpose Constants | RNG-Purpose-Stabilität | Replay und StateHash |

Die P3.68-Helper in `packages/engine/src/compatibility/payload-compatibility.ts` bleiben maßgeblich für:

- Legacy-Action-ID-/Payload-Felder wie `v1911HiddenZoneAbility`, `v1921RunnerProgramAbility`, `resourceAbility`, `runnerAbility`, `shellTradersAbility`, `acmeSavingsAndLoanAbility` und `agendaAbility`.
- P3.58-PendingChoice-Quellen für Fortress Respecification, Social Engineering und New Blood.
- Replay-Kompatibilität für gespeicherte `PlayerAction`-Payloads mit `matchId`, `side`, `actionId` und `clientKnownStateVersion`.

PublicPayload-, PlayerView- und PublicEvent-Shapes bleiben unverändert. `public-context.ts` enthält bewusst stabile Feldweiterleitungen wie `sourceDefinitionId`, `specialZoneReason`, `hiddenZoneAction`, `encounterTaxSource`, `randomPurpose` und `randomCounterAfter`, aber keine direkten ONR-v1-IDs.

## 8. Bekannte Risiken

Die verbleibenden Risiken liegen nicht in fehlender ONR-v1-Coverage, sondern in späteren Migrationen:

- `index.test.ts` bleibt sehr groß und bündelt viele historische Engine-, Coverage-, Replay- und CardImplementation-Regressionen.
- Die 101 Mechanik-ID-Reste in `mechanics/` sind bewusst, aber noch keine endgültige Capability-/Query-Abstraktion.
- Die 42 Compatibility-ID-Reste sind absichtlich stabil. Eine Entfernung ohne PublicPayload-/Replay-/PendingChoice-Migrationsplan kann alte Replays, offene Choices, RNG-Purpose-Strings, Chronikdarstellung oder Web-ActionBoard-Auswertung brechen.
- Die vielen `v19xx`- und `p3_`-Marker in `index.ts` sind nicht direkte ONR-v1-IDs, bleiben aber Vertragsoberfläche für ActionIDs, PendingChoices, PublicPayload und Replay.

## 9. Was ausdrücklich nicht mehr offen ist

Für die ONR-v1-CardImplementation-Phase ist nicht mehr offen:

- ONR-v1-Coverage schließen.
- ONR-v1-`pending_implementation` abbauen.
- ONR-v1-`partial_implementation` abbauen.
- ONR-v1-`legacy_engine_special_case` abbauen.
- Tycho Extension mit einer Fake-Runtime-Datei versehen.
- CardImplementation-Dateien in der Registry nachregistrieren.
- Direkte `onr_v1_`-Reste aus `index.ts`, `public-context.ts` oder `ability-engine/` entfernen.
- P3.68-/P3.69-Kompatibilitätsmarker in diesem Abschlussbatch entfernen.

## 10. Spätere Architektur-/Payload-Migrationen

Später, aber ausdrücklich nicht in P3.70, sollten folgende Themen angefasst werden:

- separater Audit für PendingChoice-Source-Präfixe und Hidden-Zone-Action-Namen;
- PublicPayload-/Replay-/Web-Migrationsplan für alte `v19xx`-, `p3_`-, `hiddenZoneAction`-, `specialZoneReason`- und RNG-Purpose-Strings;
- gezielte Mechanikfamilien-Migrationen aus `mechanics/` in typed Capability-/Modifier-/Effect-Queries;
- teststrukturelle Entlastung von `index.test.ts`, ohne Coverage- und Replay-Schutz zu verlieren;
- erst danach mögliche Modulgrenzen für Game-/Run-/Index-nahe Hostlogik.

## 11. Empfehlung für nächsten Schritt

Die Phase ist bereit für den nächsten Architekturabschnitt. Der nächste sinnvolle Schritt ist kein neuer Kartenmechanikbatch und kein breiter Modulsplit, sondern ein enges Compatibility-/Teststruktur-Gate:

1. PendingChoice-/Hidden-Zone-/Replay-Marker inventarisieren und Helper weiter benennen, ohne Werte zu ändern.
2. Danach `index.test.ts` schrittweise nach stabilen fachlichen Testgruppen schneiden, während die bestehenden Coverage-/Registry-/Replay-Invarianten unverändert grün bleiben.
3. Erst mit einem expliziten PublicPayload-/Replay-Migrationsplan dürfen alte Markerwerte entfernt oder umbenannt werden.

P3.70 selbst hat keine Produktionscodeänderung und keine Coverage-Statusänderung vorgenommen.
