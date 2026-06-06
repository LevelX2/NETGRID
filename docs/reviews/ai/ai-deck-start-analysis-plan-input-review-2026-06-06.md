# AI Deck Start Analysis Plan Input Review 2026-06-06

Lean Local Mode. Diese Analyse ändert keine Runtime, keine Engine-Regeln, keine LegalAction-Erzeugung und keine Kartensemantikdaten.

## Kurzfazit

Der Livepfad hat eigenes Deckwissen, aber nicht in der Form, die die neue TacticalPlan-Ebene braucht. Beim KI-Entscheid wird aus dem eigenen privaten Decksnapshot ein `AiDeckDoctrineProfile` gebaut, jedoch nur als grobes Rollen-/Archetypen-/PlanWeight-Profil. `runner.obtain_breaker_coverage`, `runner.build_credit_bank`, `runner.cash_out_credit_bank`, `corp.create_score_window`, `corp.build_credit_bank` und `corp.rez_defense` lesen aktuell sichtbaren Boardstate, LegalActions und Labels; sie konsumieren kein Deckstart-Inventar mit Breakern, Suche, Draw, Bankkarten, MU, Kosten oder Corp-Score-/Rez-Reserve-Werkzeugen.

Es gibt bereits bessere diagnostische Datenquellen: `buildDeckStrategyProfile` und `buildAiDeckOntologySummary` aggregieren unter anderem Breaker-Coverage, Suche/Draw, Economy und Corp-Remote-/Scoreprofile. Diese Pfade sind aber ausdrücklich `diagnostic_only` beziehungsweise nicht Teil von `AiDecisionInput` oder `TacticalPlanBuildContext`.

## Ist-Zustand

### Matchstart und AI-Input

- Matchrecords speichern private Decksnapshots unter `record.privateDeckSnapshots`. Der Multiplayer-AI-Pfad reicht für die aktive KI-Seite den eigenen Snapshot an `buildAiDecisionInput` weiter (`apps/server/src/multiplayer.ts:1643`, `apps/server/src/multiplayer.ts:2618`).
- `buildAiDecisionInput` erzeugt `ownDeckDoctrine` pro Entscheidung aus `ownDeckSnapshot`, falls kein fertiges `ownDeckDoctrine` übergeben wurde (`packages/ai/src/index.ts:3130`, `packages/ai/src/index.ts:3144`). Das Profil wird nicht als separate Matchstart-Analyse persistiert.
- `buildAiDecisionInputDto` übernimmt nur `ownDeckDoctrine` in den DTO, nicht den Decksnapshot oder die Deckliste (`packages/ai/src/input-dto.ts:309`, `packages/ai/src/input-dto.ts:765`). Das ist side-safe, lässt aber keine decklistenbasierte TacticalPlan-Auswertung im Livepfad zu.
- Der Shared-Typ `AiDeckDoctrineProfile` enthält `archetypeTags`, `roleCounts`, `roleDensity`, `planWeights`, `mulliganWeights`, `riskFlags` und Evidence (`packages/shared/src/index.ts:757`). Er enthält kein Breaker-Inventar, keine Suchmatrix, keine Economy-Bank-Werkzeuge, keine Zone-Erreichbarkeit und keine install-/MU-/Credit-Fähigkeit.

### AiDeckDoctrineProfile heute

`buildDeckDoctrineProfile` zählt Rollen aus `CARD_ROLES_BY_CARD`, aktiven AI-Hints und einfachen Runtime-Inferenzen (`packages/ai/src/deck-doctrine.ts:60`, `packages/ai/src/deck-doctrine.ts:186`, `packages/ai/src/deck-doctrine.ts:195`). Daraus entstehen grobe Archetypen und alte PlanWeights (`packages/ai/src/deck-doctrine.ts:236`, `packages/ai/src/deck-doctrine.ts:248`).

Das Profil kann erkennen:

- Rollen wie `breaker_decoder`, `breaker_fracter`, `breaker_killer`, `memory`, `economy`, `draw`, `remote_contest` und Corp-Rollen, soweit sie in Hints/Rollen/Runtime-Inferenzen vorhanden sind.
- Grobe Runner-Archetypen wie `rig_builder`, `rnd_pressure`, `hq_pressure`, `remote_contest`, `economy_dense`.
- Grobe Corp-Archetypen wie `rush`, `glacier`, `tag_pressure`, `asset_remote`, `operation_economy`, `central_defense`.
- Alte PlanWeights wie `build_rig`, `recover_economy`, `draw_for_answers`, `score_now`, `score_next_turn`, `build_scoring_remote`.

Das Profil kann nicht erkennen:

- konkrete Breaker je Karte mit `cardId`, Titel, Coverage, Installkosten, MU, Stärke, Pump-/Break-Kosten und Drawbacks als Inventar;
- Deck-Coverage-Matrix nach `code_gate`, `sentry`, `wall`, `ap`, `trace`, `universal`, `subtype_limited`;
- ob fehlende Coverage im Deck, in Hand, installiert, im Heap/Archives, suchbar oder nicht erreichbar ist;
- ob ein Deck Suchkarten für genau Programme/Icebreaker hat und ob die aktuelle Suchkarte die gesuchte Coverage erreichen kann;
- ob ein Breaker im Deck vorhanden, aber aktuell wegen Credits oder MU nicht installierbar ist;
- ob Broker-/Bankkarten als mehrzügige Economy-Werkzeuge im Deck vorhanden sind.

## TacticalPlan-Livepfad

`evaluateTacticalPlans` erhält `AiDecisionInput` und optional `ActionSemanticCandidate[]` (`packages/ai/src/tactical-plans.ts:203`). Die aktuellen TacticalPlan-Builder lesen `input.ownDeckDoctrine` nicht.

Runner-Pläne:

- `buildRunnerTacticalPlans` baut Remote-/Central-Contest- und Breaker-Coverage-Pläne aus aktuellen LegalActions und sichtbarer Boardlage (`packages/ai/src/tactical-plans.ts:561`).
- `runNeedsBreakerCoverage` bewertet nur sichtbare gerezzte ICE gegen sichtbare eigene Rigkarten (`packages/ai/src/tactical-plans.ts:1130`).
- `missingBreakerCoverageKind` leitet `breaker_wall`, `breaker_code_gate`, `breaker_sentry`, `breaker_ap`, `breaker_trace` oder `breaker_universal` aus sichtbarem ICE-Text/Subtypes ab (`packages/ai/src/tactical-plans.ts:1106`).
- `runnerBreakerCoverageStep` entscheidet nacheinander: sichtbaren passenden Breaker installieren, bei passendem Hand-Breaker Credits nehmen, sonst irgendeine Trigger-/Ability-/Event-Action als `search_for_answer`, sonst ziehen, sonst Credits nehmen (`packages/ai/src/tactical-plans.ts:1000`).

Das beantwortet die Kernfrage: Wenn `runner.obtain_breaker_coverage` aktiv wird, weiß die KI im TacticalPlan-Builder nur von sichtbaren installierbaren/Hand-Breakern und aktuellen Actions. Sie weiß nicht deckweit, welche passenden Breaker existieren.

Bank-Pläne:

- `runner.build_credit_bank` entsteht nur, wenn eine aktuelle LegalAction labelseitig wie Bank-/Broker-Aufbau aussieht, die Runner-Credits stabil genug sind und kein akuter Funding Need besteht (`packages/ai/src/tactical-plans.ts:839`, `packages/ai/src/tactical-plans.ts:1232`).
- `runner.cash_out_credit_bank` entsteht nur, wenn eine aktuelle LegalAction labelseitig wie Bank-/Broker-Auszahlung aussieht und Credits niedrig oder ein Funding Need vorhanden ist (`packages/ai/src/tactical-plans.ts:869`, `packages/ai/src/tactical-plans.ts:1241`).
- Es gibt keine vorgelagerte Deckfrage "hat dieses Deck Broker/Short-Term Contract/Bank-Tools?" und keinen Plan "Bankkarte finden/installieren".

Corp-Pläne:

- `corp.create_score_window` entsteht aus aktuellen `score_agenda`- oder `advance_card`-LegalActions (`packages/ai/src/tactical-plans.ts:895`).
- `corp.rez_defense` entsteht aus aktuellen `rez_ice`-LegalActions.
- `corp.build_credit_bank` entsteht aus aktuellen bankartigen LegalActions und ausreichend Credits.
- Kein TacticalPlan-Builder nutzt eine deckstartbasierte Agenda-Struktur, Score-Plan-Dichte, Rez-Reserve-Tools, ICE-Tax-Werkzeuge, Remote-Scoring-Werkzeuge oder Corp-Bankkarten.

## Vorhandene bessere, aber nicht live konsumierte Deckdaten

`buildDeckStrategyProfile` aggregiert genauere Runner-/Corp-Profile aus Strategy-Taxonomie, compiled Hints und AI-Hint-Inspector (`packages/ai/src/deck-doctrine-strategy.ts:277`). Der Output trägt `source.mode: "diagnostic_only"` und `plannerEffect: "none"` (`packages/ai/src/deck-doctrine-strategy.ts:337`). Relevante Felder:

- Runner: `coverageProfile` mit `wall`, `code_gate`, `sentry`, `universal`, `special`; `setupProfile.search/draw/recovery/installSupport/memoryHandSize`; `economyProfile.generic/burst/recurring/finite/actionBased`; `pressureProfile.rnd/hq/remote`.
- Corp: `iceProfile`, `scoreProfile`, `economyProfile`, `remoteProfile`, `punishProfile`.

`buildAiDeckOntologySummary` aggregiert aktive Hint-Ontology-Felder inklusive `breakerCoverage.breakerCards`, `remoteRoles`, `scoredAgendaActions`, `tagPunish`, Effekt- und Condition-Counts (`packages/ai/src/hint-ontology-doctrine.ts:133`). Auch dieser Summary wird nicht in `AiDecisionInput` oder TacticalPlans eingespeist.

Außerdem gibt es strukturierte Breaker-Consumer wie `getStructuredBreakerProfileForCard`, `classifyBreakerCoverageFromOntology` und `estimateBreakerCostProfileFromOntology` (`packages/ai/src/breaker-ontology-consumer.ts:34`, `packages/ai/src/breaker-ontology-consumer.ts:59`, `packages/ai/src/breaker-ontology-consumer.ts:65`). Diese helfen in anderen Scoring-/Diagnosepfaden, ersetzen aber kein Deckstart-Inventar für TacticalPlans.

## Verfügbare Deckinformationen heute

| Information | Live in `AiDecisionInput` | Live in TacticalPlan | Diagnose vorhanden |
|---|---:|---:|---:|
| Eigene grobe Deck-Doctrine | Ja, als `ownDeckDoctrine` | Nein, nicht konsumiert | Ja |
| Eigene Kartenliste aus Snapshot | Nein | Nein | Ja, wenn Diagnosebuilder direkt aufgerufen wird |
| Icebreaker im Deck | Nur als grobe Rollen-Counts | Nein | Teilweise ja |
| Coverage `code_gate`/`sentry`/`wall` | Nur indirekt Rollen/Signale | Nur sichtbare Hand/Rig/ICE-Heuristik | Ja, in StrategyProfile; teils in OntologySummary |
| Coverage `ap`/`trace`/universal/special | Nicht belastbar im Liveprofil | Nur sichtbare ICE-/Card-Regex | Teilweise ja |
| Installkosten/MU/Stärke/Pump/Break | Nein | Nur bei sichtbaren Karten/LegalAction-Kosten | Teilweise ja in Hints/Kartendaten |
| Suchkarten für Programme/Icebreaker | Nein, nur Rollen können existieren | Nur aktuelle Action-Typen grob | Ja, über `setup.search`/Effects/LineSupport |
| Draw-/Tutoring-/Install-Hilfen | Nein als strukturierte Matrix | Nur aktuelle `draw_card` oder beliebige Trigger/Event-Actions | Ja |
| Economy-/Bank-Karten im Deck | Nur grobe Economy-Rollen | Nur sichtbare bankartige LegalActions | Ja über Signale wie `economy.temporary_resource_bank` |
| Memory-/MU-Unterstützung | Nur grobe Rollen | Nur sichtbare `memoryUsed/memoryLimit` und install legality | Teilweise ja |
| HQ/R&D/Remote-Angriffsplan | Nur alte PlanWeights/Archetypen | Aus aktuellen Run-LegalActions/Board | Ja im StrategyProfile |
| Corp Score-/Rez-/Remote-Plan | Nur alte PlanWeights/Archetypen | Aus aktuellen Actions/Board | Ja im StrategyProfile |

## Fehlende Informationen für TacticalPlans

Für die neue Kette `Deck/Doctrine/Boardstate -> TacticalPlan -> PlanStep -> ActionSemanticCandidate -> LegalAction` fehlt eine live verfügbare, side-safe Zwischenschicht:

- `DeckStartAnalysis` oder `DeckCapabilityProfile` mit stabiler Schema-Version.
- `breakerInventory`: alle eigenen Breaker aus eigenem Decksnapshot, mit Coverage, Kosten, MU, Stärke, Pump/Break, SideEffects, Restrictions, Quantity und Confidence.
- `breakerCoverageMatrix`: pro Coverage-Typ `installed`, `inHand`, `inDiscard`, `inDeckKnownFromSnapshot`, `searchableNow`, `drawOnly`, `missing`.
- `searchAccess`: Suchkarten/-aktionen nach Zieltyp, Timing, Reichweite, Zone, Reveal-Risiko und aktueller LegalAction-Verfügbarkeit.
- `economyBankTools`: Bank-/Counter-/finite-pool-Karten mit `inDeck`, `installed`, `buildActionLegal`, `cashOutActionLegal`, Poolstand und Einsatzgrund.
- `planRelevantDeckFacts`: reduzierte, debugfähige Facts, die TacticalPlans direkt zitieren können.
- `missingCapabilities`: explizite Lücken wie `missing_wall_coverage`, `no_program_search`, `breaker_present_but_unaffordable`, `breaker_present_but_mu_blocked`, `bank_tool_present_not_installed`.

## Beispiel: Remote Contest mit Codecracker, Black Dahlia, Dwarf, Self-Modifying Code

Vorhandene lokale Facts:

- `Codecracker` (`onr_v1_014_codecracker`) hat aktive Hint-Ontology für `code_gate`, Installkosten 2, MU 1, Stärke 0, Pump 1, Break 0.
- `Black Dahlia` (`onr_v1_006_black-dahlia`) hat aktive Hint-Ontology für `sentry`, Installkosten 10, MU 1, Stärke 5, Pump 2, Break 2.
- `Dwarf` (`onr_v1_021_dwarf`) ist eine Wall-/Worm-Breakerkarte mit Installkosten 6, MU 1, Stärke 3; der Inspector leitet `breaker.wall` ab, aktive Hint-Ontology ist hier aber nicht so vollständig wie bei Codecracker/Black Dahlia.
- `Self-Modifying Code` (`onr_v1_059_self-modifying-code`) hat Search-/Install-Facts für Programme während eines Runs und `lineSupport: runner.search.breaker`.

Aktuelles Verhalten:

- Wenn der sichtbare Remote-Path wegen Wall-Coverage blockiert ist, erzeugt TacticalPlan `runner.obtain_breaker_coverage:<serverId>` mit `requiredCapabilities.kind = breaker_wall`.
- Ist `Dwarf` in der Hand und aktuell installierbar, wird `install_breaker` gewählt.
- Ist `Dwarf` in der Hand, aber nicht installierbar und `gain_credit` legal, wird `gain_credits` gewählt.
- Ist kein passender Hand-Breaker sichtbar, aber irgendeine Trigger-/Ability-/Event-Action legal, wird pauschal `search_for_answer` gewählt. Der Plan weiß dabei nicht, ob diese Action Self-Modifying Code ist oder ob Dwarf im Stack liegt.
- Ist keine solche Action legal, aber Ziehen legal, wird `draw_for_answer` gewählt.

Was die KI eigentlich ableiten müsste:

1. `missing breaker_wall installed` aus Boardstate.
2. `Dwarf provides wall coverage` aus eigenem Decksnapshot/DeckCapabilityProfile.
3. `Self-Modifying Code can search/install program during run` nur, wenn dessen konkrete Karte/Action aktuell erreichbar ist.
4. Wenn SMC verfügbar und Kosten/MU reichen: `search_for_answer(Self-Modifying Code)` -> `install_breaker(Dwarf)` -> `run_target(remote)`.
5. Wenn SMC fehlt, aber Dwarf im Deck ist: `draw_for_answer` oder anderes echtes Search-Tool.
6. Wenn Dwarf in Hand ist, aber Credits/MU fehlen: `gain_credits` oder `free_mu` statt blindem Draw/Search.
7. Wenn Dwarf nicht im Deck ist: `missingCapabilities: missing_wall_coverage` und Plan niedriger priorisieren oder anders pivotieren.

## Beispiel: Broker-artige Bankkarte

Vorhandene lokale Facts:

- `Broker` (`onr_v1_154_broker`) ist eine Runner-Resource mit installCost 3 und Signalen wie `economy.action`, `economy.counter`, `economy.finite_pool`, `economy.temporary_resource_bank`.
- `Short-Term Contract` hat ähnliche finite-pool-/temporary-bank-Signale, aber andere Auszahlung.

Aktuelles Verhalten:

- `runner.build_credit_bank` entsteht nur, wenn die Broker-/Bank-Aufbauaction bereits legal sichtbar ist, der Runner mindestens 4 Credits hat und kein konkreter Funding Need besteht.
- `runner.cash_out_credit_bank` entsteht nur, wenn die Auszahlung bereits legal sichtbar ist und Credits niedrig sind oder ein aktiver Plan Finanzierung braucht.
- Die KI erkennt daraus nicht, dass das Deck Broker-artige Karten enthält, solange keine passende LegalAction sichtbar ist.

Gewünschte Ableitung:

- `build_credit_bank`, wenn eine Bankkarte im Deck/Hand/Rig bekannt ist, die aktuelle Lage stabil ist, keine Remote-/Run-Action akut finanziert werden muss und Aufbau den erwarteten nächsten Plan verbessert.
- `cash_out_credit_bank`, wenn ein aktiver Plan wegen Credits blockiert ist, die Auszahlung legal ist und der Payout die Finanzierungsschwelle erreicht.
- Kein Cash-out direkt nach stabilem Bankaufbau, solange kein konkreter Plan finanziert werden muss.

## Side-Safety

Der aktuelle Livepfad ist side-safe:

- Die eigene KI erhält nur den eigenen privaten Decksnapshot als Option und daraus nur das sanitisierte `ownDeckDoctrine`.
- Der Gegner bekommt private Decksnapshots nicht in PlayerViews, API-Payloads oder Debug-Exports.
- TacticalPlans nutzen sichtbare `PlayerView`, `LegalActions` und side-gefilterte Events.

Eigenes Deckwissen aus dem eigenen Snapshot wäre ebenfalls side-safe, solange es nicht in öffentliche Payloads, Gegneransichten, Logs oder unsanitized Debugdaten gelangt. Ein `DeckCapabilityProfile` muss deshalb AI-intern bleiben und in Debug nur als reduzierte `planRelevantDeckFacts`/`missingCapabilities` erscheinen.

## Debug- und Review-Ausgabe

Aktuell vorhanden:

- `ownDeckDoctrine` im DecisionDebug nur mit `schemaVersion`, `side`, `confidence`, `archetypeTags`, `riskFlags` (`packages/ai/src/index.ts:30846`, `packages/shared/src/index.ts:1829`).
- TacticalPlan-Debugitems mit selected/previous plan, selected step, mapping, blockers, capabilities und Planranking (`packages/ai/src/index.ts:3571`).
- Web-UI rendert daraus eine Planebene, aber keine Deckprofil-Details (`apps/web/app/page.tsx:9800`).

Aktuell nicht vorhanden:

- `DeckProfile summary`
- `breakerInventory`
- `searchAccess`
- `economyBankTools`
- `planRelevantDeckFacts`
- `missingCapabilities`

## Umsetzungsvorschlag in 3 Phasen

### Phase 1: DeckStartAnalysis / DeckCapabilityProfile

Einen AI-internen Builder neben, nicht statt, `AiDeckDoctrineProfile` einführen:

- Input: eigener validierter Decksnapshot, aktive Hints, Inspector-/Strategy-Facts, Runtime-Kartendaten.
- Output: `DeckCapabilityProfile` mit `breakerInventory`, `breakerCoverageMatrix`, `searchAccess`, `economyBankTools`, `runnerAttackPlanProfile`, `corpScorePlanProfile`, `corpRezReserveProfile`, `missingCapabilities`.
- Keine neuen Kartensemantiken erfinden: nur vorhandene `breakerProfile`, `costProfile`, Effects, derivedFunctionSignals, Rollen und Runtime-Facts aggregieren; fehlende Facts als `unknown` oder `missing_*` markieren.
- Dwarf-artige Fälle, bei denen nur Inspector-Signal, aber kein vollständiges `breakerProfile` existiert, explizit als niedrigere Confidence markieren.

### Phase 2: Verbindung zu TacticalPlan requirements

`TacticalPlanBuildContext` um ein optionales `deckCapabilities`-Feld erweitern oder `AiDecisionInput` um eine sanitisierte AI-interne Capability-Projektion ergänzen.

- `runner.obtain_breaker_coverage` nutzt Deck-Coverage und Zone-Erreichbarkeit, nicht nur sichtbare Hand/Rig-Regex.
- `search_for_answer`, `draw_for_answer`, `install_breaker`, `gain_credits` werden aus `missingCapabilities` und `searchAccess` abgeleitet.
- `runner.build_credit_bank`/`cash_out_credit_bank` nutzen `economyBankTools` plus aktuelle LegalActions.
- Corp-Pläne nutzen Score-/Agenda-/Rez-/Remote-/Bank-Facts als Prioritäts- und Blocker-Evidence, ohne LegalActions zu erzeugen.

### Phase 3: Debug und Tests

Schmale Debug- und Regressionsebene:

- DecisionDebug bekommt redigierte, limitierte `planRelevantDeckFacts` und `missingCapabilities`.
- Tests für Codecracker/Black Dahlia/Dwarf/Self-Modifying-Code-Coverage, Search-vs-Draw-Entscheidung, Credits/MU-Blocker und Broker-Bank-Aufbau/Auszahlung.
- Hidden-Info-Tests: keine gegnerische Deckliste, keine private Snapshot-ID/Deckliste in Public Payloads, WebSocket, Replay, Maintenance-Export oder Fehlern.

## Checkliste für diesen Review

- Keine Runtime-Datei geändert.
- Keine Engine-, Legalitäts-, Karten- oder Hintdaten geändert.
- Review-Artefakt erstellt: `docs/reviews/ai/ai-deck-start-analysis-plan-input-review-2026-06-06.md`.
