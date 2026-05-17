# NETGRID KI Deep Analysis 2026-05-17

Status: Analyseartefakt
Aktiver Agent: card-enablement-ai-knowledge-agent
Scope: Analyse, Bewertung, Verbesserungsvorschläge und Activity-Paketvorschläge. Keine Codeänderung, keine KI-Implementierung, keine Kartenfreigabe.

## Kurzfazit

Die aktuelle NETGRID-KI ist keine frei regelnde oder cheatende KI, sondern eine streng `LegalActions`-gebundene Entscheidungslogik über `PlayerView`, side-sichere `PublicEvents`, eigene private Informationen und daraus rekonstruierte Belief-State-Daten. Die Architektur hat inzwischen mehrere Schichten: Baseline-Heuristik, planbasierte Corp- und Runner-Scorer, rekonstruierten Belief State, Deck Doctrine, AI-Hints, Simulations-/Soak-/Benchmark-Infrastruktur, DecisionDebug und Redaction-Gates.

Die größte Stärke ist die Sicherheitsarchitektur: AI-Inputs werden aus `PlayerView` und `getLegalActions` gebaut, `applyAction` validiert weiterhin als Engine-Gate, Simulationen replayen deterministisch, und Belief State wird nicht als geheimer zweiter Spielzustand persistiert. Die größte strategische Schwäche ist, dass "planbasiert" heute vor allem intent-orientiertes Scoring aktueller legaler Aktionen bedeutet. Es gibt noch keine belastbare mehrzügige Planung für Runner-Rig-Aufbau, Economy-Fenster, Corp-Remote-Aufbau, Rez-Reserve, Agenda-Flood oder Matchabschluss-Dynamik. Die Selbstspielberichte zeigen diese Grenze praktisch: `current_candidate` war sicher, lief aber häufig in Action-Limits statt in klare Spielabschlüsse.

Das Gedächtnis kann rechtmäßig gesehene Informationen über Züge hinweg rekonstruieren, solange sie in der side-sicheren sichtbaren Historie enthalten bleiben und nicht invalidiert werden. Es merkt u. a. R&D-Top-Freshness, bekannte HQ-Handinformationen, bekannte Positionen und generische Remote-/Unrezzed-ICE-Hypothesen. Es ist aber keine persistente Wissensdatenbank, kein vollständiges probabilistisches Opponent Model und keine Erlaubnis, gegnerische Hidden Info oder echte gegnerische Decklisten zu verwenden.

## Quellen und geprüfte Dateien

Pflichtstart und Projektsteuerung:

- `AGENTS.md`: Wiki-first, Rollenrouting, globale Hidden-Info- und Engine-Prinzipien.
- `AGENTS.local.md`: lokale Projekt-/Git-Hinweise.
- `agents/card-enablement-ai-knowledge-agent.md`: Agentengrenze für Karten-, AI- und Wissensarbeit.
- `KI-Wissen-NETGRID/00 Projektstart.md`
- `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-NETGRID/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md`
- `KI-Wissen-NETGRID/00 Steuerung/Regeldatei KI-Wissenspflege.md`
- `docs/codex/CODEX_STATUS.md`
- `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`

Geprüfte AI-Codepfade:

- `packages/ai/src/index.ts`
- `packages/ai/src/corp-plans.ts`
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/belief-state.ts`
- `packages/ai/src/deck-doctrine.ts`
- `packages/ai/src/input-dto.ts`
- `packages/ai/src/visible-run-analysis.ts`
- `packages/ai/src/ai-hints.ts`
- `packages/ai/src/index.test.ts`
- `packages/shared/src/index.ts`
- `packages/catalog/src/index.ts`
- `apps/server/src/multiplayer.ts`

Geprüfte Daten:

- `data/ai/ai-card-hints-active.json`
- `data/ai/ai-card-hints-1.3.1.json`
- `data/ai/ai-benchmark-profiles-1.4.3.json`
- `data/ai/ai-deck-pool-1.0.1.json`
- `data/ai/ai-profiles-0.9.json`
- `data/ai/ai-soak-seeds-0.9.json`
- `data/ai/ai-soak-seeds-1.4.3.json`
- `data/ai/card-role-manifest-0.9.json`
- `data/ai/corp-plan-profiles-1.4.0.json`
- `data/ai/runner-plan-profiles-1.4.1.json`

Relevante abgeleitete Artefakte:

- `docs/derived/PLAN_BASED_CORP_AI_1_4_0_SPEC.md`
- `docs/derived/V1_4_0_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_4_0_FINAL_REVIEW.md`
- `docs/derived/PLAN_BASED_RUNNER_AI_1_4_1_SPEC.md`
- `docs/derived/V1_4_1_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_4_1_FINAL_REVIEW.md`
- `docs/derived/BELIEF_STATE_OPPONENT_MODEL_1_4_2_SPEC.md`
- `docs/derived/V1_4_2_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_4_2_FINAL_REVIEW.md`
- `docs/derived/SIMULATION_SELFPLAY_EXPLOIT_REGRESSION_1_4_3_SPEC.md`
- `docs/derived/V1_4_3_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_4_3_FINAL_REVIEW.md`
- `docs/derived/AI_DECK_DOCTRINE_DETAILED_PLAN_2026_05_15.md`
- `docs/derived/AI_DECK_DOCTRINE_REQUIREMENTS.md`
- `docs/derived/AI_DECK_DOCTRINE_IMPLEMENTATION_REVIEW_2026_05_15.md`
- `docs/derived/AI_DECK_DOCTRINE_QUALITY_BENCHMARK_REPORT_2026_05_15.md`
- `docs/derived/AI_DECK_DOCTRINE_HOLDOUT_BENCHMARK_REPORT_2026_05_15.md`
- `docs/derived/AI_DECK_DOCTRINE_SELFPLAY_SOAK_REPORT_2026_05_15.md`
- `docs/derived/AI_DECK_DOCTRINE_QUALITY_CASE_ANALYSIS_2026_05_15.md`
- `docs/derived/AI_CORP_REMOTE_SCORING_HARDENING_2026_05_15.md`
- `docs/derived/AI_HINTS_STRUCTURE_DECISION_2026_05_15.md`
- `docs/derived/RUNNER_AI_RND_REPEAT_ACCESS_OBSERVATION_2026_05_08.md`
- `docs/derived/RUNNER_AI_HQ_REPEAT_ACCESS_OBSERVATION_2026_05_12.md`
- `docs/derived/RUNNER_AI_ARCHIVES_REPEAT_ACCESS_OBSERVATION_2026_05_13.md`
- `docs/derived/LONG_TERM_PRODUCT_VISION_AND_ROADMAP.md`

Kompakte Belegmatrix:

- AI-Input und LegalAction-Bindung: `packages/ai/src/index.ts::buildAiDecisionInput`, `chooseAiAction`, `simulateAiGame`; `packages/shared/src/index.ts::AiDecisionInput`, `AiDecision`.
- Side-Safety und Redaction: `packages/ai/src/input-dto.ts::buildAiDecisionInputDto`, `sanitizePlayerView`, `sanitizeLegalAction`, `sanitizePublicGameEvent`; `packages/ai/src/index.ts::assertAiInputIsSideSafe`.
- Baseline Runner/Corp: `packages/ai/src/index.ts::scoreRunnerAction`, `scoreCorpAction`, `scoreRunTarget`, `qualityTagsForAction`.
- Plan-Corp: `packages/ai/src/corp-plans.ts::chooseCorpPlanAction`, `generateCorpPlanCandidates`, `evaluateCorpPlan`, `evaluateRunnerContestCapacity`, `remoteRootExposurePenalty`, `remoteRootActionSecurityScore`.
- Plan-Runner: `packages/ai/src/runner-plans.ts::chooseRunnerPlanAction`, `generateRunnerPlanCandidates`, `evaluateRunnerPlan`, `evaluateVisibleBreakerPlan`, `evaluateRemoteThreat`, `assessVisibleBreakerPressure`.
- Belief/Gedächtnis: `packages/ai/src/belief-state.ts::reconstructBeliefState`, `deriveKnownPositionMemory`, `deriveKnownHqHandMemory`, `deriveRunnerOpponentModel`, `deriveCorpOpponentModel`, `deriveRndTopFreshness`.
- Deck Doctrine: `packages/ai/src/deck-doctrine.ts::buildDeckDoctrineProfile`, `evaluateCorpOpeningHand`, `evaluateRunnerOpeningHand`, `rolesForCard`, `planWeightsFor`.
- Runanalyse: `packages/ai/src/visible-run-analysis.ts::assessKnownRezzedIcePath`, `minimumCreditsToBreakEndTheRunSubroutines`, `canBreakerDefinitionBreakIce`.
- Hints/Catalog-Gates: `packages/ai/src/ai-hints.ts::createAiHintsByCard`; `packages/catalog/src/index.ts::activeAiApprovedCardIds`, `aiApprovalByCardId`, `validateSnapshot`, `validateAiCardHintsV2`.
- Live-Deck-Doctrine-Einspeisung: `apps/server/src/multiplayer.ts` AI-Entscheidungspfad mit `record.privateDeckSnapshots?.[side]`.
- Regressionstests: `packages/ai/src/index.test.ts` Blöcke zu MVP 0.3 AI Controller Contract, V1.4.0 Corp Plan AI, V1.4.1 Runner Plan AI, V1.4.2 Belief State, V1.4.3 Simulation/Selfplay/Exploit, MVP 0.9 Stronger AI und Catalog AI Approval.

## Aktuelle KI-Fähigkeit nach Komponenten

### Eingabe- und Aktionsvertrag

Die AI-Entscheidung wird in `packages/ai/src/index.ts` über `buildAiDecisionInput` aufgebaut. Die Funktion zieht `getPlayerView(state, side)`, `getLegalActions(state, side)` und optional eigene Deckinformationen heran. `chooseAiAction` dispatcht danach seitenabhängig auf Corp oder Runner. In Simulationen wird die gewählte Action wieder gegen die aktuellen LegalActions gematcht und durch `applyAction` ausgeführt. Damit bleibt die Rules Engine die einzige Regelautorität.

`packages/shared/src/index.ts` definiert dafür `AiDecisionInput` mit `side`, `playerView`, `eventTail`, `legalActions`, `difficulty`, `seed`, `decisionId`, `actionNumber`, `profileId` und optionaler `ownDeckDoctrine`. `AiDecision` enthält u. a. `actionId`, `selectedChoices`, `reasonCode`, `explanation`, `fallbackUsed`, `confidence`, `evidence` und `decisionDebug`.

Bewertung:

- Stark: AI-Aktionen entstehen nicht frei, sondern wählen aus LegalActions.
- Stark: Simulationen wenden Aktionen wieder über `applyAction` an und replayen Events deterministisch.
- Risiko: `input-dto.ts` sanitisiert AI-Input bewusst über positive Felder, kopiert `LegalAction.payload` aber nur strukturell weiter. Wenn die Engine später versehentlich Hidden Info in LegalAction-Payloads einführt, muss die AI-Schicht das zusätzlich erkennen oder blockieren.

### Baseline-Heuristik

Die Baseline lebt hauptsächlich in `packages/ai/src/index.ts`.

Für Runner bewertet `scoreRunnerAction` u. a.:

- Setup- und Mulligan-Entscheidungen.
- Access-/Steal-/Trash-/Jackout-/Break-/Pump-/Continue-Entscheidungen.
- Ressourcen wie Credits, Memory, Handkarten, Tags.
- Installationen anhand sichtbarer Rollen.
- Runs über `scoreRunTarget`.
- Wiederholungspenalties für stale R&D, stale HQ und stale Archives.

Für Corp bewertet `scoreCorpAction` u. a.:

- Mandatory Draw, Score, Rez, Decline-Rez, Advance.
- Installationen und Operations.
- Purge, Draw, Gain Credit und End Turn.
- Agenda-Risiko und Schutzlogik über unterstützende Features.

Bewertung:

- Stark: Die Baseline deckt viele reaktive Windows ab und ist deshalb wichtig, wenn Planlogik nicht passt oder nicht eingreifen sollte.
- Stark: Sie hat konkrete Schutzmechanismen gegen bekannte schlechte Läufe, stale Zentralserver-Runs und nackte Agenda-Installationen.
- Schwach: Sie ist weiterhin ein einzelaktionsbasierter Scorer. Sie plant nicht robust "jetzt Geld, nächster Zug Breaker, danach Remote contesten" als Sequenz.

### Planbasierte Corp-KI

`packages/ai/src/corp-plans.ts` definiert Corp-Planarten:

- `score_now`
- `score_next_turn`
- `build_scoring_remote`
- `protect_hq`
- `protect_rnd`
- `recover_economy`
- `bait_runner`

`generateCorpPlanCandidates` gruppiert aktuelle LegalActions in Planabsichten. `evaluateCorpPlan` bewertet diese Absichten mit Doctrine-Gewichten, Agenda-Risiko, Server-Bedrohung, Economy-Reserve, ICE-Rez-Signalen, Scoring-Window, Scoring-Fortschritt, Runner-Contest-Capacity, Score-Horizon und Remote-Intent-Memory. Die Umsetzung bleibt aber eine aktuelle LegalAction, keine mehrzügige Aktionssequenz.

Die Remote-Scoring-Härtung aus `AI_CORP_REMOTE_SCORING_HARDENING_2026_05_15.md` ist im Plan-Scoring sichtbar: Neue nackte Agenda-Remotes werden stark bestraft, ungeschützte bestehende Remotes negativ bewertet, geschützte Remotes positiv bewertet, und Runner-Contest-Capacity wird aus sichtbaren Runner-Credits, sichtbaren Breakern und bekannten/rezzed ICE-Pfaden abgeleitet.

Bewertung:

- Stark: Die Corp-KI schützt HQ/R&D/Remote differenzierter als reine Baseline.
- Stark: Nackte Agenda-Installationen sind gezielt gehärtet.
- Stark: Runner-Contest wird side-sicher aus sichtbaren Daten geschätzt.
- Schwach: Es gibt keine explizite mehrzügige Remote-Bauplanung mit Rez-Reserve, Advance-Tempo und Agenda-Flood-Entlastung über mehrere Züge.
- Schwach: `bait_runner` ist als Planart vorhanden, aber der strategische Bluffwert bleibt begrenzt, weil keine langfristige Runner-Reaktionsmodellierung existiert.

### Planbasierte Runner-KI

`packages/ai/src/runner-plans.ts` definiert Runner-Planarten:

- `pressure_rnd`
- `pressure_hq`
- `contest_remote`
- `build_rig`
- `recover_economy`
- `draw_for_answers`
- `trash_asset`
- `safe_probe_run`

`evaluateRunnerPlan` bewertet aktuelle LegalActions anhand von Doctrine, Early-Turn-Doktrin, Rig-Stand, Run-Kosten, Server-Wert, Remote-Threat, Corp-Scoring-Threat, sichtbarer Breaker-Planung und Risiken. `evaluateVisibleBreakerPlan` gibt starken Bonus, wenn ein sichtbarer ICE-Blocker existiert und ein passender Breaker installiert werden kann; wenn kein passender Breaker sichtbar ist, werden Economy oder Draw als Antworten bevorzugt und Runs gegen blockierte Ziele abgewertet.

Bewertung:

- Stark: Die Runner-KI erkennt sichtbar blockierte Server besser als ältere Heuristiken.
- Stark: Sie bevorzugt passende Breaker-Installationen gegen bekannte rezzed ICE und vermeidet wiederholte Low-Value-Runs auf stale R&D/HQ/Archives.
- Stark: Deck Doctrine beeinflusst frühe Rig-, Economy- und Pressure-Entscheidungen.
- Schwach: Es fehlt ein mehrzügiger Plan für "Rig bauen, Credits ansammeln, dann Zielserver contesten".
- Schwach: Unrezzed-ICE-Risiko ist generisch. Die KI kennt keine verdeckten ICE-Identitäten und soll sie auch nicht kennen; sie modelliert aber auch keine stärkeren side-sicheren Wahrscheinlichkeiten aus öffentlichem Spielverlauf.

### Belief State und Gedächtnis

`packages/ai/src/belief-state.ts` rekonstruiert mit `reconstructBeliefState` pro Entscheidung einen side-sicheren Belief State aus `playerView.publicEvents`, `eventTail`, aktueller PlayerView, eigenen privaten Informationen und LegalActions-nahen sichtbaren Fakten. Es ist kein persistenter Engine-State und keine Hidden-Info-Datenbank.

Wichtige Bausteine:

- `ownPrivateEntries`: eigene private Karteninformationen.
- `publicBoardEntries`: öffentliche Boardinformationen.
- `revealedOpponentEntries`: rechtmäßig öffentlich gewordene gegnerische Karten, z. B. durch Access, Reveal, Expose, Rez, Score, Steal oder Trash, soweit im side-sicheren Eventpayload enthalten.
- `unknownEntries`: bekannte unbekannte Zonen/Anzahlen.
- `hypothesisEntries`: generische Hypothesen, z. B. unknown remote roots und unknown unrezzed ICE.
- `deriveKnownPositionMemory`: Runner-Gedächtnis für bekannte Positionen wie R&D-Top, accessed cards und installierte/revealed/exposed/rezzed Karten.
- `deriveKnownHqHandMemory`: Runner-Gedächtnis über rechtmäßig bekannte HQ-Handinformationen.
- `deriveRunnerOpponentModel`: Runner-Sicht auf Corp-Risiken, R&D/HQ-Wert und Remote-Hypothesen.
- `deriveCorpOpponentModel`: Corp-Sicht auf Runner-Druck, sichtbare Breaker und Remote-Contest-Wahrscheinlichkeit.
- `deriveRndTopFreshness`: Status, ob die bekannte R&D-Topinformation frisch, stale oder invalidiert ist.

Bewertung:

- Stark: Das Gedächtnis ist fair rekonstruiert und in Tests gegen Hidden-State-Varianten abgesichert.
- Stark: R&D-Top-, HQ- und Archives-Wiederholungen werden strategisch berücksichtigt.
- Stark: Undo-artige Rollbacks und StateHash-Mutation sind in Tests adressiert.
- Schwach: Es ist nur so haltbar wie die sichtbare Eventhistorie, die PlayerView/EventTail bereitstellt.
- Schwach: Es speichert keine persistente Langzeitstatistik, keine vollständigen Wahrscheinlichkeitsverteilungen und keine gegnerischen Decklisten.

### Deck Doctrine und Archetypen

`packages/ai/src/deck-doctrine.ts` erzeugt mit `buildDeckDoctrineProfile` ein Profil aus dem eigenen Decksnapshot. Es zählt Rollen, Dichten, fehlende Rollen und Unsupported-Risiken, leitet Archetype-Tags ab und übersetzt diese in PlanWeights.

Corp-Archetypen entstehen u. a. aus Rollen wie Rush, Glacier, Tag Pressure, Asset Remote, Operation Economy und Central Defense. Runner-Archetypen entstehen u. a. aus Rig Builder, R&D Pressure, HQ Pressure, Remote Contest, Tag Resilience und Economy Dense.

Die Doctrine wirkt auf:

- Mulligan-/Opening-Hand-Bewertung über `evaluateCorpOpeningHand` und `evaluateRunnerOpeningHand`.
- Corp-Planwahl über Doctrine-Gewichte in `corp-plans.ts`.
- Runner-Planwahl über Doctrine-Gewichte und Early-Turn-Doktrin in `runner-plans.ts`.
- Simulation/Benchmark, wenn eigene Decksnapshots eingespeist werden.

Bewertung:

- Stark: Die KI nutzt eigene Deckstruktur fair, ohne gegnerische Hidden Decklists.
- Stark: Mulligan-Entscheidungen sind nicht mehr rein generisch.
- Schwach: Die Doctrine ist noch ein Profil- und Gewichtungsmodell, kein Sequenzplaner.
- Risiko: `buildDeckDoctrineProfile` kann Rollen auch über inferierte Kartentyp-/Subtype-Signale erkennen. Die Planpfade selbst prüfen `ai_supported`, aber die Profilconfidence und Archetype-Tags sollten weiter darauf geprüft werden, ob nicht unterstützte Karten strategisch zu stark gewichtet werden.

### AI-Hints und `ai_supported`

`packages/ai/src/ai-hints.ts` lädt aktiv `data/ai/ai-card-hints-active.json`. Das Strukturentscheidungsartefakt vom 2026-05-15 hält fest, dass historische Release-/Batch-Splitdateien nicht mehr aktive Runtime-Quelle sind. Die aktive Datei ist konsolidiert und nicht als historische V1.9.x-Schnittdatei zu verstehen.

`data/ai/ai-card-hints-active.json` enthält 410 Karten, davon laut Datei-Metadaten 377 mit `ai_supported` und 33 `hinted_only`. `packages/catalog/src/index.ts` bindet AI-Approval über `CATALOG_AI_APPROVAL_BATCHES` und prüft u. a., dass `ai_supported` nicht ohne `human_playable`, AI-Hint und Szenario-Referenzen vergeben wird.

Bewertung:

- Stark: AI-Hints sind nicht mehr lose Notizen, sondern an Catalog-Gates und Supportstatus gekoppelt.
- Stark: Nicht unterstützte Karten erhalten in Planrollen keine strategische Sonderbehandlung über `rolesForCardId`, wenn sie nicht `ai_supported` sind.
- Schwach: Karten ohne Rollen, schwache Rollen oder nur generische Rollen begrenzen die Qualität der Planwahl deutlich.
- Offene Klärung: CODEX_STATUS spricht von 47 V1.9.22-Zielkarten mit `human_playable`, `deck_legal` und `ai_supported`; die aktive AI-Hint-Datei beschreibt gleichzeitig 377 `ai_supported` und 33 `hinted_only`. Das ist kein direkter Widerspruch, weil die Zahlen unterschiedliche Schnitte meinen, sollte aber in künftigen Reports explizit getrennt werden.

### Simulation, Soaks, Benchmarks und Exploit-Regression

`packages/ai/src/index.ts` enthält:

- `simulateAiGame`
- `simulateAiSoak`
- `createBeliefSimulationWorld`
- `runV143SimulationLeague`
- `runDoctrineQualityBenchmark`
- `evaluateDoctrineQualityGate`

Die Simulation erstellt Spiele, baut AI-Inputs pro Schritt, prüft Side-Safety, wählt LegalActions, wendet sie mit `applyAction` an und replayt Events. `createBeliefSimulationWorld` erzeugt nur redaction-sichere Hypothesen aus dem Belief State, keine echte FullState-Offenlegung.

Die Benchmark-Profile in `data/ai/ai-benchmark-profiles-1.4.3.json` enthalten u. a. `random_legal_bot`, `basic_corp_ai`, `basic_runner_ai`, Planprofile, `belief_ai_v1_4_2` und `current_candidate`. Die Doctrine-Reports vom 2026-05-15 zeigen Safety-Pass und null gemessene Doctrine-Fehler in den geprüften Seeds, aber auch, dass alle `current_candidate`-Selfplay-Games im 80-Action-Soak ans Action-Limit liefen.

Bewertung:

- Stark: Safety-, Replay- und Exploit-Regression sind produktiv nutzbare Infrastruktur.
- Stark: Hidden-State-Zugriffe sind in Simulationen ausdrücklich ausgeschlossen.
- Schwach: Die aktuellen Benchmarks beweisen eher Sicherheit und lokale Fehlerfreiheit als spielerische Stärke oder Matchabschlussfähigkeit.
- Schwach: V0.8-/Demo-Deck- und Seed-Abdeckung ist noch kein belastbarer Beweis für O:NR-weite KI-Kompetenz.

### DecisionDebug und Redaction

`decisionFromChoices` in `packages/ai/src/index.ts` erzeugt `decisionDebug` mit Belief-Summary, betrachteten Choices, Confidence, Evidence und Fallback-Informationen. `assertAiInputIsSideSafe` prüft auf verbotene Feldnamen wie `cardInstances`, `privatePayload`, Tokenfelder oder `fullGameState`. Tests in `packages/ai/src/index.test.ts` prüfen Side-Safety, Debug-Redaction und Hidden-State-Invarianz.

Bewertung:

- Stark: Debug-Ausgaben sind für Analyse und Regression wertvoll und bewusst side-sicher entworfen.
- Risiko: String-basierte Forbidden-Field-Checks sind gut als Guardrail, aber kein vollständiger struktureller Beweis. Für P0 sollte ein Payload-Key-Allowlist- oder Schema-Snapshot-Gate ergänzt werden.

## Fairness-/Hidden-Info-Audit

### Bestätigte No-Cheat-Eigenschaften

- AI-Inputs entstehen über `getPlayerView` und `getLegalActions`, nicht über direkten FullState-Zugriff im Entscheidungsmodell.
- AI-Entscheidungen wählen `actionId`s aus LegalActions.
- `applyAction` bleibt das Ausführungs- und Validierungsgate.
- Belief State wird aus side-sicheren sichtbaren Daten rekonstruiert.
- Simulationen sind nicht berechtigt, reale verdeckte Kartenidentitäten zu kennen.
- Deck Doctrine nutzt eigene Decksnapshots, nicht gegnerische verdeckte Decklisten.
- Planrollen für konkrete Aktionen verwenden nur AI-supported Kartenrollen.
- LLMs sind in Roadmap und Langfristplanung nur für Beratung, Tests, Coaching oder Artefaktanalyse vorgesehen, nicht als Live-Regelakteur.

### Audit-Risiken und Härtungsbedarf

1. `LegalAction.payload`-Sanitization:
   `sanitizeLegalAction` übernimmt Payloads strukturell. Das ist korrekt, solange LegalActions selbst side-sicher sind. Für Defense in Depth sollte die AI-Schicht trotzdem ein Allowlist-/Snapshot-Gate für erlaubte Payloadformen bekommen.

2. Event-Historien-Retention:
   Das Gedächtnis rekonstruiert aus `playerView.publicEvents` und `eventTail`. Wenn Reconnect- oder gekürzte PlayerViews alte öffentliche Access-Fakten nicht mehr enthalten, kann rechtmäßiges Gedächtnis verloren gehen. Das ist kein Cheating-Risiko, aber ein Strategierisiko.

3. DecisionDebug:
   Debug darf `cardDefinitionId`s nur dann zeigen, wenn sie aus side-sicheren Reveals/Accesses/öffentlichen Boardzuständen stammen. Die vorhandenen Tests gehen in diese Richtung; ein schema-basiertes Debug-Redaction-Gate wäre robuster.

4. Runtime-Kartenabdeckung in sichtbarer Runanalyse:
   `visible-run-analysis.ts` nutzt aktuell `DEMO_CARDS_BY_ID` zur Breaker-/ICE-Fähigkeitsprüfung. Falls alle relevanten Runtime-O:NR-Karten dort gespiegelt sind, ist das unproblematisch. Falls nicht, kann die KI sichtbare Breaker-ICE-Paare falsch als unbreakable oder unbekannt einschätzen. Das ist kein Hidden-Info-Leak, aber ein Qualitätsrisiko.

5. Doctrine-Rollen für nicht unterstützte Karten:
   Die konkrete Planrollenverwendung filtert auf `ai_supported`. Das Doctrine-Profil kann aber durch inferierte Typ-/Subtype-Rollen beeinflusst werden. Es sollte geprüft werden, ob Unsupported-Karten nur Diagnose/Risikoflag, aber keine starke Planpräferenz erzeugen.

## Runner-Analyse

### Installation und Laden von Icebreakern

Die Runner-KI installiert Breaker über Baseline- und Planbewertung. In `runner-plans.ts` erkennt `evaluateVisibleBreakerPlan`, ob ein bekannter sichtbarer ICE-Blocker den gewählten Server blockiert. Wenn ein passender Breaker in installierbarer Sichtweite liegt, wird `build_rig` stark bevorzugt. Wenn ein passender Breaker bekannt, aber zu teuer oder aktuell nicht installierbar ist, werden Economy oder Draw bevorzugt.

Konkrete Fähigkeit:

- Passende sichtbare Breaker werden gegen rezzed ETR-ICE höher bewertet.
- Installationen berücksichtigen Rollen und Setup.
- Memory und Credits wirken als Grenzen.

Wahrscheinliches Versagen:

- Die KI erkennt keinen verborgenen gegnerischen ICE-Titel und soll das auch nicht.
- Sie baut keinen vollständigen mehrzügigen Plan wie "diesen Breaker suchen, nächste Runde Economy, dann Server attackieren".
- Sie kann bei komplexeren Breaker-Suiten, mehreren ICE-Typen oder Nicht-ETR-Bedrohungen noch zu grob priorisieren.

### Sichtbare ICE-Bedrohungen und passende Breaker

`visible-run-analysis.ts` bewertet bekannte rezzed ICE-Pfade und minimale Credits zum Brechen von End-the-Run-Subroutinen. `runner-plans.ts` übersetzt das in Run-Penalties oder Rig-Build-Boni.

Konkrete Fähigkeit:

- Runs gegen sichtbar unaffordable oder unbreakable ETR-Pfade werden abgewertet.
- Passende Breaker-Installationen bekommen Vorrang.
- Repeated-Run-Penalties verhindern stumpfes Wiederholen von Low-Value-Läufen.

Wahrscheinliches Versagen:

- Nicht-ETR-Schäden, Tags, Trash-Effekte oder komplexe Subroutinen sind weniger präzise als ETR-Blockaden.
- Unrezzed ICE wird nur als generisches Risiko modelliert.
- Runtime-Kartenabdeckung muss geprüft werden, wenn Karten nicht über die verwendete Definitionstabelle auflösbar sind.

### Credits, Memory, Setup, Draw/Search, Economy und Runs

Die Runner-KI bewertet Credits, MU, installierte Programme, Ressourcen, Events, Tags, Handkarten und Serverzustände. `evaluateRunnerEarlyTurnDoctrine` hilft in frühen Zügen, je nach Deck Doctrine Rig, Economy oder Druck zu priorisieren. `scoreRunTarget` und Runner-Planfunktionen bewerten R&D, HQ, Archives und Remotes nach Zugriffswert, Schutz, bekannten stale Informationen und Bedrohung.

Konkrete Fähigkeit:

- Economy wird gegenüber untervorbereiteten Runs bevorzugt.
- Setup-Karten und Breaker werden stärker gewichtet, wenn sichtbare Hindernisse existieren.
- Tags werden entfernt, wenn sie relevant sind.
- Remote Contest wird stärker, wenn sichtbare Fortgeschrittenheit oder Root-Bedrohung besteht.

Wahrscheinliches Versagen:

- Search-/Tutor-Linien sind nur so gut wie aktuelle LegalActions und Hint-Rollen. Es gibt kein abstraktes "suche nächsten Fracter in zwei Zügen".
- Die KI kennt keine zukünftigen Draws und keine gegnerischen Hidden-Karten.
- Sie optimiert nicht explizit über erwarteten Punktewert pro mehrere Züge.

### Zentralserver- und Remote-Druck

R&D:

- Frische R&D-Access-Fakten erhöhen Wert.
- Wiederholte Läufe auf stale gleiche R&D-Topinformationen werden bestraft.
- Invalidation passiert bei Corp Draw, Shuffle, Arrange, Swap und relevanten R&D-Move-Events.

HQ:

- Bekannte HQ-Handinformationen werden nach Accesses rekonstruiert.
- Wiederholte HQ-Läufe gegen vollständig bekannte Low-Value-Hände werden abgewertet.
- Draws, Installationen, Plays, Discards, Score/Steal/Trash und unbekannte Hidden-Zone-Änderungen invalidieren oder reduzieren Sicherheit konservativ.

Archives:

- Wiederholte Archives-Low-Value-Runs werden bestraft.
- Änderungen an Archives invalidieren die Repeat-Penalty.

Remote:

- Fortgeschrittene Remotes, Root-Bedrohungen, bekannte oder vermutete Agenden und Corp-Scoring-Threat erhöhen Contest-Wert.
- Sichtbar blockierte Remotes mit schlechtem Rig werden abgewertet.

Wahrscheinliches Versagen:

- Die KI hat noch keinen robusten Plan für Druckwechsel über mehrere Züge.
- Sie kann lokale Chancen erkennen, aber nicht zuverlässig ein Match in ein Scoring-/Steal-Race überführen.

### Deck-Doktrin-Nutzung

Runner-Archetypen wie Rig Builder, R&D Pressure, HQ Pressure, Remote Contest, Tag Resilience und Economy Dense beeinflussen PlanWeights, Early-Turn-Entscheidungen und Mulligan.

Bewertung:

- Die Doctrine ist sinnvoll als Bias und Qualitätsverbesserung.
- Sie ersetzt keine konkrete Linie, keine vollständige Board-Evaluation und keine mehrzügige Simulation.

## Corp-Analyse

### Geld, Rez-Entscheidungen und Economy

Die Corp-KI bewertet Economy über Baseline und Planlayer. `recover_economy` wird wichtiger bei niedrigen Credits, während Scoring- und Schutzpläne Economy-Reserve berücksichtigen. Rez-Entscheidungen werden reaktiv bewertet, wenn LegalActions sie anbieten.

Konkrete Fähigkeit:

- Niedrige Credits erhöhen Economy-Priorität.
- Rez kann in relevanten Windows gewählt werden.
- Scoring-Remote-Entscheidungen berücksichtigen sichtbare Runner-Contest-Kapazität und ICE-Schutz.

Wahrscheinliches Versagen:

- Es gibt keine detaillierte Rez-EV-Rechnung über mehrere Züge.
- Die KI reserviert Credits nicht explizit für eine geplante nächste Score- oder Rez-Linie.
- Sie kann bei mehreren potenziellen Rez-Zielen lokal statt strategisch langfristig entscheiden.

### ICE-Installation und Server-Schutz

Corp-Pläne schützen HQ, R&D und Remotes. `evaluateServerThreat`, `evaluateRunnerContestCapacity`, `assessKnownIcePathForRunnerContest` und Remote-Security-Funktionen bewerten sichtbare Runner-Fähigkeiten, bekannte/rezzed ICE-Pfade und Serverexponierung.

Konkrete Fähigkeit:

- HQ/R&D-Schutz reagiert auf Bedrohung.
- Remotes mit Agenda werden nicht mehr leichtfertig nackt gebaut.
- Geschützte bestehende Remotes werden gegenüber neuen nackten Remotes bevorzugt.

Wahrscheinliches Versagen:

- Es gibt keine feste Sequenz "erst ICE, dann Economy, dann Agenda, dann Advance/Score".
- Remote-Aufbau kann stagnieren, wenn aktuelle LegalActions jeweils nur lokal bewertet werden.
- ICE-Qualität wird über Rollen und sichtbare Pfade bewertet, aber nicht als vollständiges Server-Portfolio mit zukünftigen Breaker-Entwicklungen geplant.

### Nackte Agenda-Installationen

Die Remote-Scoring-Härtung vom 2026-05-15 adressiert genau dieses Problem. In Code und Tests gibt es Penalties gegen Agenda-Installationen in neue nackte Remotes, gegen ungeschützte bestehende Remotes und gegen vermeidbare Exposure-Linien.

Bewertung:

- Dieses Problem ist nachweislich bearbeitet.
- Die Härtung ist side-sicher, weil sie sichtbare Runner-Fähigkeit und bekannte/rezzed ICE-Pfade nutzt.
- Restproblem: Härtung verhindert dumme nackte Installs, ersetzt aber keine starke Agenda-Flood- oder Timing-Strategie.

### Runner-Contest-Fähigkeit

Die Corp-KI schätzt Contest-Fähigkeit aus:

- sichtbaren Runner-Credits,
- sichtbaren installierten Breakern,
- bekannten/rezzed Remote-ICE-Pfaden,
- öffentlich sichtbarer Remote-Pressure-Historie,
- bekannten Breakkosten.

Sie verwendet keine Runner-Hand, keinen Stack und keine echte Runner-Deckliste, sofern diese nicht regelhaft bekannt wäre.

Bewertung:

- Fair und nützlich.
- Noch zu wenig mehrzügig: "Runner kann nächste Runde nach Economy/Draw contesten" ist nur grob modelliert.

### Scoring-Remote, Recovery und Bait

Die Corp-KI kann Scoring-Fenster erkennen, geschützte Remotes bevorzugen, Economy recovern und Bait als Planart führen. Sie kann auch in bestimmten Situationen Draw-for-Scoring bevorzugen, wenn Schutzlage und Agenda-Situation passen.

Wahrscheinliches Versagen:

- Baiting bleibt schwach, weil keine robuste Runner-Reaktionsmodellierung existiert.
- Agenda-Flood wird nicht als eigener mehrzügiger Krisenplan geführt.
- Rez-Reserve, Advance-Tempo und Score-Horizon sind Scoring-Faktoren, aber keine echte Linie über mehrere Züge.

## Gedächtnis-/Belief-State-Analyse

### Bleiben rechtmäßig gesehene Karten zugübergreifend erhalten?

Ja, unter Bedingungen. Rechtmäßig gesehene Karten bleiben über Züge rekonstruierbar, wenn:

- das Ereignis in `playerView.publicEvents` oder `eventTail` enthalten ist,
- das Ereignis side-sicher eine `cardDefinitionId` enthalten darf,
- kein invalidierendes Ereignis die Position oder Handinformation unsicher macht.

Das gilt für Access-/Reveal-/Expose-/Rez-/Score-/Steal-/Trash-Fakten und für bekannte Positionen wie R&D Top oder HQ-Handwissen.

Nein, im Sinne einer separaten persistenten AI-Datenbank. Es gibt keine dauerhafte Memory-Store-Datei und keinen AI-State, der neben dem Spielzustand fortgeschrieben wird. Das Gedächtnis wird pro Entscheidung rekonstruiert.

### R&D-Topkarten

R&D-Topwissen wird über `deriveRndTopFreshness` und `deriveKnownPositionMemory` modelliert.

Die KI kann:

- nach einem rechtmäßigen R&D-Access merken, dass dieselbe Topkarte bekannt ist,
- wiederholte R&D-Läufe auf denselben stale Low-Value-Top abwerten,
- das Wissen invalidieren, wenn die Corp zieht, shuffled, arrangiert, tauscht oder R&D-Karten durch Steal/Trash/Remove/Set-aside/Return verändert werden.

Sie kann nicht:

- die verdeckte nächste R&D-Karte kennen,
- mehrkartige R&D-Reihenfolgen vollständig fortschreiben,
- echte Corp-Decklisten oder Hidden-Deckpositionen nutzen.

### HQ-Handwissen

HQ-Wissen wird über `deriveKnownHqHandMemory` modelliert.

Die KI kann:

- rechtmäßig aus HQ gesehene Karten als bekannte Definitionen merken,
- einschätzen, ob alle HQ-Karten bekannt sind, wenn bekannte Definitionen und Handcount zusammenpassen,
- wiederholte HQ-Läufe gegen bekannte Low-Value-Hände abwerten,
- bekannte Karten bei Install/Play/Discard/Score/Steal/Trash aus dem Memory entfernen,
- bei Draws oder unbekannten Hidden-Zone-Änderungen konservativ Unsicherheit erhöhen.

Sie kann nicht:

- unbekannte HQ-Karten identifizieren,
- verdeckte HQ-Reihenfolge oder echte Handliste kennen,
- gegnerische private Payloads nutzen.

### Bekannte Positionen

`deriveKnownPositionMemory` merkt bekannte Positionen aus rechtmäßigen PublicEvents. Für R&D wird eine `rd:top`-Position modelliert, für andere Accesses eher `accessed`, für installierte/revealed/exposed/rezzed Karten `installed`.

Stärke:

- Das genügt für zentrale Anti-Loop-Heuristiken und einfache Positionserinnerung.

Grenze:

- Es ist kein vollständiges Positionsmodell für mehrkartige Server, Archives-Reihenfolgen, R&D-Stacks oder komplexe Move-Historien.

### Remote-Hypothesen

Remote-Hypothesen entstehen für unbekannte Remote-Roots und unrezzed ICE. Sie sind generisch, z. B. `unknown_remote_card`, und tragen Confidence/Risk statt Kartenidentitäten.

Die KI kann:

- eine unknown Remote Root als potenzielle Agenda/Asset/Upgrade-Bedrohung bewerten,
- fortgeschrittene Remotes höher priorisieren,
- unrezzed ICE-Risiko aus Anzahl, Position und Corp-Credits ableiten.

Sie kann nicht:

- verdeckte Remote-Karten identifizieren,
- verdeckte ICE-Titel wissen,
- private Install-Payloads der Corp auslesen.

### Unrezzed-ICE-Risiko

Das Risiko wird als Modell aus sichtbaren unrezzed ICE-Zählungen, Corp-Credits, Rez-Signalen und Serverkontext abgeleitet.

Stärke:

- Fair und nützlich für grobe Risikovermeidung.

Grenze:

- Keine präzise Subroutine-, Strength-, Typ- oder Trash-/Damage-/Tag-Erwartung, solange das ICE nicht bekannt/rezzed ist.

### Invalidierung

Invalidierung passiert u. a. bei:

- Corp Draw für R&D-Top-Freshness.
- Shuffle, Arrange, Swap.
- Move, Trash, Steal, Discard, Score, Remove, Set-aside oder Return von Karten aus relevanten Zonen.
- HQ-Draws und unbekannten Hidden-Zone-Änderungen für Handwissen.
- Archives-Änderungen für wiederholte Archives-Wertungen.

Die Invalidierung ist bewusst konservativ. Das schützt vor Cheating, kann aber rechtmäßig ableitbares Wissen früher verwerfen als ein starker menschlicher Spieler.

### Persistenz, Replay, Reconnect und Undo

Belief State wird nicht persistiert. Er wird aus aktueller side-sicherer Sicht rekonstruiert. Tests in `packages/ai/src/index.test.ts` decken u. a. Hidden-State-Invarianz, R&D-Freshness-Invalidierung, undo-artige Rollbacks und Nicht-Mutation des realen GameState/StateHash ab.

Replay-sicher:

- Ja, solange dieselbe side-sichere Eventprojektion rekonstruiert wird.

Undo-sicher:

- Ja für die getesteten Rollback-Fälle, weil keine separate Memory-Mutation fortgeschrieben wird.

Reconnect-sicher:

- Konzeptionell ja, wenn Reconnect-PlayerViews die relevante side-sichere Historie enthalten. Das sollte explizit mit Server-Reconnect-Fixtures getestet werden.

### Strategisch wichtige fehlende Erinnerungen

- Längerfristige Frequenz und Timing von Runner-Pressure pro Server.
- Mehrzügige Remote-Historie als Planlinie, nicht nur aktueller Threat.
- Genaueres Memory für mehrere bekannte HQ-Kopien und gemischte bekannte/unbekannte Multisets.
- Side-sichere Erwartung über mögliche Runner-Outs aus sichtbarem Board und eigener Deck Doctrine der Corp, ohne gegnerische Deckliste.
- Eigene geplante Linie der AI über mehrere Züge, z. B. reservierte Credits oder geplantes Ziel.
- Matchphasen-Gedächtnis: Wer ist vorne, welches Endgame ist realistisch, wann muss Risiko erhöht werden?

## Deck-/Karten-/Hint-Analyse

### Deckauswertung zu Spielbeginn

Wenn eigene Decksnapshots verfügbar sind, erzeugt `buildDeckDoctrineProfile` Rollenstatistiken, Archetype-Tags, Confidence, Risk Flags und PlanWeights. Im Live-Multiplayer wird in `apps/server/src/multiplayer.ts` der eigene private Decksnapshot in `buildAiDecisionInput` eingespeist. Ältere/simple Endpoints nutzen teils nur Baseline-Input ohne Doctrine-Snapshot.

Die Opening-Hand-Bewertungen:

- Corp: ICE, Economy, Agenda-Last, Remote-Root, Doctrine und Difficulty-Schwellen.
- Runner: Breaker, Economy, Setup, Pressure, Handbalance, Doctrine und Caps bei fehlender Economy/Breaker-Struktur.

Bewertung:

- Gut für faire eigene Deckanpassung.
- Noch nicht stark genug für langfristige Matchlinien.

### Archetypen aus Rollen und Hints

Archetypen entstehen aus:

- manuellem Rollenmanifest,
- aktiven AI-Hints,
- inferierten Typ-/Subtype-Rollen,
- Dichten und Counts im eigenen Deck.

PlanWeights übersetzen Archetypen in Bias für Corp- und Runner-Pläne.

Bewertung:

- Das ist ein pragmatischer und wartbarer Weg.
- Die Qualität hängt direkt an konsistenten Rollen/Hints.
- Fehlende oder falsche Rollen führen nicht zu illegalen Aktionen, aber zu schlechter Priorisierung.

### Einfluss von `buildDeckDoctrineProfile`

Der Einfluss ist relevant, aber begrenzt:

- Mulligan wird spürbar angepasst.
- Early-Turn-Runner-Verhalten wird nach Rig/Economy/Pressure gebiast.
- Corp Scoring/Remote/Protection-Pläne werden gewichtet.
- Simulation/Benchmark kann mit Doctrine-Kandidaten vergleichen.

Der Einfluss ist nicht absolut:

- LegalActions begrenzen alle Entscheidungen.
- Reactive Baseline kann Planentscheidungen überstimmen oder ersetzen.
- Doctrine ist keine Suchmaschine und kein Sequencer.

### Karten ohne Rollen, ohne AI-Hints oder ohne `ai_supported`

Folgen:

- Karten ohne Rollen liefern wenig strategische Signale.
- Karten ohne AI-Hints können menschlich spielbar sein, aber AI-planerisch schwach bewertet werden.
- `ai_supported` ist das wichtige Gate für planbasierte Rollenverwendung konkreter Karten.
- Nicht `ai_supported` Karten können als LegalActions existieren, werden aber nicht über planbasierte Rollenlogik strategisch privilegiert.

Risiko:

- Baseline-Fallback kann solche Karten trotzdem wählen, wenn sie legal sind und die Alternative schwach bewertet wird.
- Doctrine-Inferenz über Typ/Subtype kann Profilgewichte beeinflussen; das sollte auditierbar bleiben.

### Karten-/Rollenlücken, die bessere KI verhindern

- Unpräzise Breaker-/ICE-Rollen begrenzen Run- und Rig-Planung.
- Fehlende Economy-Rollen erschweren Mulligan und Recovery.
- Fehlende Remote-/Scoring-/Bait-Rollen schwächen Corp-Planung.
- Fehlende Asset-/Trash-Prioritäten schwächen Runner-Trash-Entscheidungen.
- Fehlende Risiko-/Punishment-Rollen für bekannte rezzed ICE schwächen Non-ETR-Bedrohungsbewertung.
- Fehlende Szenario-Refs verhindern belastbare `ai_supported`-Promotion.

## Abgleich mit Releaseplanung

### Umgesetzte KI-Stufen

Aus `docs/codex/CODEX_STATUS.md`, den V1.4.x-Reviews und den Doctrine-Berichten ergibt sich:

- V0.9 stärkere AI: umgesetzt mit Rollen, Difficulty, Profiles, ObservedFacts, Simulation Metrics und Soaks.
- V1.4.0 planbasierte Corp-KI: umgesetzt und final reviewed.
- V1.4.1 planbasierte Runner-KI: umgesetzt und final reviewed.
- V1.4.2 Belief State/Opponent Model: umgesetzt und final reviewed.
- V1.4.3 Simulation/Selfplay/Exploit Regression: umgesetzt und final reviewed.
- Deck Doctrine MVP/Runner/Corp-Integrationen vom 2026-05-15: umgesetzt und mit Quality-/Holdout-/Selfplay-Reports geprüft.
- Corp Remote Scoring Hardening vom 2026-05-15: umgesetzt und im Status nachgezogen.
- AI-Hints-Strukturentscheidung vom 2026-05-15: aktive Runtime nutzt konsolidiertes `ai-card-hints-active.json`.

### Historisch überholte Roadmap-Punkte

`NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md` ist Stand 2026-05-10 und nennt an mehreren Stellen V1.9.1 als nächsten Schritt nach V1.9.0. `CODEX_STATUS.md` ist neuer und führt V1.9.22 final promoted. Diese alten Releasezuschnitte sind daher als historische Planung zu lesen, nicht als aktueller Stand.

Die ältere Post-V1.1.2-AI-Levelplanung beschreibt Level 3 bis 6 als offen. Inzwischen sind Belief State und Simulations-/Benchmark-Infrastruktur teilweise umgesetzt. Trotzdem bleibt eine wichtige Differenz:

- "Planbasierte AI" ist umgesetzt als aktuelle-action-basierte Planbewertung.
- "Mehrzügige Planung" im starken Sinn ist nicht umgesetzt.
- "Simulation/Selfplay" ist als faire Test-/Benchmark-Infrastruktur umgesetzt, aber noch kein vollständiger live genutzter Rollout-Planer.

### Weiter offene geplante AI-Themen

- Mehrzügige Runner- und Corp-Linien.
- Matchabschluss- und Scoring-Dynamik.
- Breitere O:NR-Benchmarkabdeckung.
- Exploit-Fixture-Bibliothek für mehr Kartentypen.
- Side-sichere AI-Coaching-Funktionen.
- V4.0-nahe faire Belief-World-Rollouts ohne Hidden-State-Zugriff.
- LLM nur als Beratung, Testfallgenerator oder erklärende Schicht, nicht als Live-Regelautorität.

### Nahe Releases vs. V2/V3/V4

Nahe Releases:

- P0-Härtung der AI-Input-Redaction.
- Reconnect-/Undo-Belief-Contract-Tests.
- Runtime-Kartenabdeckung für sichtbare Runanalyse.
- Matchprogression-Benchmark gegen Action-Limit.
- kleine Runner-/Corp-Planverbesserungen mit klaren No-Cheat-Gates.

V2/V3:

- breitere Produktintegration, bessere Debug/Explainability, mehr Exploit-Regressionsfälle.
- AI-Coaching-Spezifikation und eventuell side-sichere Coach-Prototypen.
- stabilere Deck Doctrine über mehrere Format-/Deckprofile.

V4:

- quasi vollständige faire Spielstärke über Belief-World-Rollouts, Selfplay, Benchmark-Ligen und Coaching.
- keine LLM-Regelautorität, keine Hidden-Info-Vorteile, keine Live-Cheating-KI.

## Größte Schwächen

1. Keine echte mehrzügige Planung:
   Corp und Runner bewerten aktuelle LegalActions unter Planabsichten. Sie verfolgen keine robuste Sequenz über mehrere Züge.

2. Matchprogression schwach:
   Doctrine-Selfplay war sicher, lief aber häufig ins Action-Limit. Das deutet auf fehlende Endgame-, Score- und Steal-Dynamik.

3. Belief State ist konservativ und flach:
   Er ist fair, aber keine tiefe probabilistische Weltmodellierung.

4. Unrezzed-ICE- und Hidden-Remote-Risiko sind generisch:
   Das ist korrekt gegen Cheating, aber strategisch begrenzt.

5. Debug-/Payload-Safety ist gut, aber noch nicht maximal strukturell:
   String-Forbidden-Checks und Payload-Weitergabe sollten durch Allowlists/Snapshots ergänzt werden.

6. Kartenrollen bestimmen Qualität:
   Ohne präzise AI-Hints, Rollen und Szenarien bleiben gute Karten legal, aber für die KI strategisch stumpf.

7. Benchmark-Abdeckung ist noch schmal:
   Aktuelle Reports zeigen Safety und lokale Qualitätsmetriken, aber noch keine breite O:NR-Spielstärke.

## Verbesserungs-Roadmap P0/P1/P2

### P0: AI-Input-Redaction-Allowlist

Nutzen: Reduziert Hidden-Info-Leak-Risiko durch zukünftige LegalAction- oder Eventpayload-Erweiterungen.
Risiko: Zu enge Allowlists können legitime Choices brechen, wenn neue LegalAction-Payloads nicht eingetragen werden.
Betroffene Dateien: `packages/ai/src/input-dto.ts`, `packages/ai/src/index.test.ts`, optional `packages/shared/src/index.ts`.
Scope: Schema-/Allowlist-Gate für `AiDecisionInputDto`, besonders `legalActions.payload`, `publicEvents.publicPayload`, `choiceRequest` und `decisionDebug`.
Akzeptanzkriterien: Tests injizieren verbotene verschachtelte Felder und scheitern oder redigieren deterministisch; erlaubte bekannte Payloadformen bleiben erhalten; keine Änderung an Action-Auswahl.
No-Cheat-Gate: AI-Input darf weiterhin nur `PlayerView`, `LegalActions`, side-sichere PublicEvents und eigene private Infos enthalten.

### P0: Belief Reconnect/Undo Contract

Nutzen: Belegt, dass rechtmäßig gesehenes Wissen über Reconnects erhalten bleibt oder bewusst verloren geht, und dass Undo keine Phantom-Erinnerungen erzeugt.
Risiko: Server-PlayerViews könnten weniger Historie tragen als erwartet; dann muss Verhalten dokumentiert oder Historienfenster erweitert werden.
Betroffene Dateien: `packages/ai/src/belief-state.ts`, `packages/ai/src/index.test.ts`, Server-Reconnect-Testpfade.
Scope: Fixtures für R&D Access, HQ Access, Archives-Änderung, Reconnect-Projektion und Undo-Rollback.
Akzeptanzkriterien: Gleiche side-sichere Projektion erzeugt gleiche Belief-Signature; Rollback entfernt spätere Memories; gekürzte Historie wird dokumentiert.
No-Cheat-Gate: Keine persistente Hidden-Info, keine FullState-Rekonstruktion.

### P0: Runtime-Kartenabdeckung für sichtbare Runanalyse prüfen

Nutzen: Verhindert falsche Breaker-/ICE-Einschätzungen bei O:NR-Karten.
Risiko: Umstellung von Demo- auf Runtime-Definitionen kann bestehende Tests anpassen müssen.
Betroffene Dateien: `packages/ai/src/visible-run-analysis.ts`, `packages/ai/src/index.test.ts`, eventuell Shared-/Catalog-Carddefinitionen.
Scope: Audit, ob alle AI-supported ICE/Breaker in der verwendeten Definitionstabelle auflösbar sind; Tests für repräsentative O:NR-Paare.
Akzeptanzkriterien: Kein AI-supported sichtbares Breaker-/ICE-Paar wird wegen fehlender Definition fälschlich als unbekannt/unbreakable behandelt.
No-Cheat-Gate: Nur sichtbare installierte Breaker und bekannte/rezzed ICE aus PlayerView/PublicEvents verwenden.

### P0: Matchprogression-Benchmark statt nur Safety-Gate

Nutzen: Macht sichtbar, ob die KI Spiele voranbringt statt sicher im Action-Limit zu stagnieren.
Risiko: Zu frühe harte Schwellen können gute Sicherheitsverbesserungen blockieren.
Betroffene Dateien: `packages/ai/src/index.ts`, `packages/ai/src/index.test.ts`, `data/ai/ai-benchmark-profiles-1.4.3.json`, neue Reports unter `docs/derived/`.
Scope: Metriken für Score-Fortschritt, Steals, Remote-Progression, HQ/R&D-Druckwechsel, Action-Limit-Rate.
Akzeptanzkriterien: Baseline-vs-current-Kandidatenvergleich zeigt keine Safety-Regression und dokumentiert Fortschritt/Limit-Rate.
No-Cheat-Gate: Simulation nutzt weiterhin nur LegalActions, PlayerViews, side-sichere Events und beliefbasierte Hypothesen.

### P1: Runner Zwei-Zug-Rig/Economy-Plan

Nutzen: Runner baut gezielter Rig und Credits für einen späteren sinnvollen Run auf.
Risiko: Zu starre Linien können taktische Chancen übersehen.
Betroffene Dateien: `packages/ai/src/runner-plans.ts`, `packages/ai/src/belief-state.ts`, Tests.
Scope: Side-sicherer Intent "target server später contesten", benötigte Credits/Breaker aus sichtbarem Board, keine Hidden-ICE-Titel.
Akzeptanzkriterien: Runner wählt Economy/Breaker-Aufbau vor offensichtlich unprofitablen Runs und wechselt nach Erreichen der Schwelle zum Zielrun.
No-Cheat-Gate: Keine Nutzung verdeckter Corp-Karten oder Decklisten.

### P1: Corp Remote-Rez-Reserve-Plan

Nutzen: Corp baut und scored Remotes kohärenter.
Risiko: Reserve-Logik kann zu passiv werden.
Betroffene Dateien: `packages/ai/src/corp-plans.ts`, `packages/ai/src/index.test.ts`, Benchmark-Reports.
Scope: Planbewertung für ICE -> Economy/Rezreserve -> Agenda/Advance/Score über side-sichere sichtbare Runner-Fähigkeit.
Akzeptanzkriterien: Corp bevorzugt Sequenzen, die in geschützten Score-Fenstern enden, ohne nackte Agenda-Regressionsfälle.
No-Cheat-Gate: Runner-Hand, Stack und Hidden-Deck bleiben unbekannt.

### P1: Agenda-Flood-Management

Nutzen: Corp reagiert besser auf eigene private HQ-Agenda-Last.
Risiko: Kann zu riskantem Installieren führen, wenn Remote-Schutz unterschätzt wird.
Betroffene Dateien: `packages/ai/src/corp-plans.ts`, `packages/ai/src/deck-doctrine.ts`, Tests.
Scope: Eigene private HQ-Information legal nutzen, aber nur über geschützte Remotes, Draw/Discard/Scoring-Linien und risk-aware Kriterien.
Akzeptanzkriterien: Agenda-Flood-Fixtures zeigen weniger Zentralserver-Exposure ohne mehr nackte Agenda-Installs.
No-Cheat-Gate: Nur eigene private Corp-Hand und öffentliche Runner-Sicht.

### P1: AI-Hints Role Gap Report

Nutzen: Kleine Datenlücken können gezielt geschlossen werden, bevor Code komplizierter wird.
Risiko: Rollen können zu breit vergeben werden und schlechte Planung verstärken.
Betroffene Dateien: `data/ai/ai-card-hints-active.json`, `data/ai/card-role-manifest-0.9.json`, `packages/catalog/src/index.ts`, Reports.
Scope: Report für Karten ohne Rollen, `hinted_only`, fehlende SzenarioRefs, schwache Breaker-/ICE-/Economy-/Remote-Rollen.
Akzeptanzkriterien: Liste priorisierter Kartenlücken mit vorgeschlagenem kleinsten nächsten Hint-/Szenario-Paket.
No-Cheat-Gate: Hints beschreiben nur erlaubte Kartennutzung, keine versteckten Gegnerinformationen.

### P1: DecisionDebug Schema und Redaction-Snapshots

Nutzen: Debug bleibt erklärbar, aber sicher.
Risiko: Snapshot-Churn bei legitimen Debug-Erweiterungen.
Betroffene Dateien: `packages/ai/src/index.ts`, `packages/ai/src/index.test.ts`, eventuell `packages/shared/src/index.ts`.
Scope: Versioniertes Debug-Schema, side-spezifische Snapshottests, verbotene Key-/Value-Muster.
Akzeptanzkriterien: Jede Debug-Erweiterung braucht Testupdate; Hidden-Info-Fixtures bleiben redigiert.
No-Cheat-Gate: Keine private Gegenseite in Debug, Logs, Reconnect, Undo oder Public Replay.

### P2: Faire Belief-World-Rollouts

Nutzen: Strategisch stärkere Entscheidungen über mehrere mögliche Welten, ohne reale Hidden Info.
Risiko: Sehr hohes Cheating- und Komplexitätsrisiko, wenn Sample-Welten versehentlich echte Hidden-Karten verwenden.
Betroffene Dateien: `packages/ai/src/belief-state.ts`, `packages/ai/src/index.ts`, neue Simulationsmodule.
Scope: Nur aus Belief-Hypothesen generierte abstrakte Welten, getrennte RNG, keine Live-Regelautorität zunächst.
Akzeptanzkriterien: Hidden-State-Variantentests zeigen identische Entscheidungen bei gleicher sichtbarer Projektion; Rollouts verbessern Benchmarks ohne Safety-Regression.
No-Cheat-Gate: Kein FullState, keine echten verdeckten Kartenidentitäten, keine gegnerischen Decklisten.

### P2: Side-sicheres AI-Coaching

Nutzen: Erklärungen, Lernmodus und Review-Hilfe für Spieler.
Risiko: Coach könnte indirekt Hidden Info oder regelwidrige Empfehlungen leaken.
Betroffene Dateien: zunächst Spezifikation/Docs, später Coach-UI/Server/AI.
Scope: Coach sieht nur dieselbe PlayerView, LegalActions und side-sichere PublicEvents wie die Seite; LLM nur als Erklärungsschicht oder Testfallgenerator.
Akzeptanzkriterien: Coach-Empfehlungen referenzieren nur legale sichtbare Aktionen; rote Hidden-Info-Fixtures bleiben stumm oder allgemein.
No-Cheat-Gate: LLM ist nie Live-Regelakteur und nie Quelle für LegalActions.

### P2: Breitere Selfplay-/Exploit-Liga

Nutzen: Deckt wiederkehrende strategische Schwächen über mehr Seeds, Decks und Kartenrollen auf.
Risiko: Laufzeit und flakiness.
Betroffene Dateien: `data/ai/ai-soak-seeds-*.json`, `data/ai/ai-benchmark-profiles-1.4.3.json`, Test-/Reportpfade.
Scope: O:NR-nahe Decksnapshots, exploit fixtures pro Schwäche, Score-/Steal-/Action-Limit-Metriken.
Akzeptanzkriterien: Stabiler Report mit Safety, Progression und Regressionsklassifikation.
No-Cheat-Gate: Selfplay bleibt PlayerView-/LegalActions-basiert.

## Konkrete Activity-Paketvorschläge

Diese Vorschläge sind bewusst als kleine `docs/activities/inbox/`-Pakete geschnitten. In dieser Analyse wurden keine Activity-Dateien angelegt.

### `act-2026-05-17-ai-input-redaction-allowlist.md`

Priorität: P0
Ziel: AI-Input-DTO gegen verschachtelte Hidden-Info-Payloads härten.
Dateien: `packages/ai/src/input-dto.ts`, `packages/ai/src/index.test.ts`.
Akzeptanz: Verbotene nested Keys werden geblockt oder redigiert; erlaubte LegalAction-Payloads bleiben funktionsfähig; `git diff --check` und AI-Tests grün.
No-Cheat: Kein FullState, keine private Gegenseite, keine Debugdaten als AI-Quelle.

### `act-2026-05-17-ai-belief-reconnect-undo-contract.md`

Priorität: P0
Ziel: Reconnect- und Undo-Semantik des Belief State belegen.
Dateien: `packages/ai/src/belief-state.ts`, `packages/ai/src/index.test.ts`, Server-Reconnect-Fixtures.
Akzeptanz: R&D/HQ/Archives-Memory ist nach gleicher sichtbarer Projektion identisch; Undo entfernt spätere Fakten; truncation-Verhalten dokumentiert.
No-Cheat: Nur side-sichere Eventprojektionen.

### `act-2026-05-17-ai-visible-run-runtime-card-audit.md`

Priorität: P0
Ziel: Prüfen, ob sichtbare Runanalyse alle AI-supported Runtime-ICE/Breaker korrekt auflösen kann.
Dateien: `packages/ai/src/visible-run-analysis.ts`, `packages/ai/src/index.test.ts`, Carddefinitionen.
Akzeptanz: Audit-Report und Tests für repräsentative O:NR-Karten; keine fälschliche unbreakable-Klassifikation durch fehlende Definition.
No-Cheat: Nur sichtbare bekannte/rezzed ICE und sichtbare eigene Breaker.

### `act-2026-05-17-ai-match-progression-benchmark.md`

Priorität: P0/P1
Ziel: Action-Limit-Stagnation messbar machen und Progression-Metriken einführen.
Dateien: `packages/ai/src/index.ts`, `packages/ai/src/index.test.ts`, `data/ai/*`, neuer Report unter `docs/derived/`.
Akzeptanz: Benchmark berichtet Score-Fortschritt, Steals, Action-Limit-Rate und Safety-Deltas.
No-Cheat: Simulation bleibt LegalActions-/PlayerView-basiert.

### `act-2026-05-17-runner-two-turn-rig-plan.md`

Priorität: P1
Ziel: Runner soll sichtbare Zielserver über Economy/Breaker-Aufbau vorbereiten.
Dateien: `packages/ai/src/runner-plans.ts`, `packages/ai/src/index.test.ts`.
Akzeptanz: Fixtures zeigen erst Setup/Economy, dann Run, sobald sichtbare Kosten erfüllbar sind.
No-Cheat: Keine verdeckten Corp-Karten oder Decklisten.

### `act-2026-05-17-corp-remote-rez-reserve-plan.md`

Priorität: P1
Ziel: Corp soll geschützte Scoring-Remote-Linien mit Rezreserve besser verfolgen.
Dateien: `packages/ai/src/corp-plans.ts`, `packages/ai/src/index.test.ts`.
Akzeptanz: Corp baut häufiger sichere Score-Fenster, ohne nackte Agenda-Regressionsfälle.
No-Cheat: Runner-Hand/Stack bleiben unbekannt.

### `act-2026-05-17-ai-hints-role-gap-report.md`

Priorität: P1
Ziel: Rollen-/Hint-Lücken in aktiven AI-Hints priorisieren.
Dateien: `data/ai/ai-card-hints-active.json`, `data/ai/card-role-manifest-0.9.json`, Report unter `docs/derived/`.
Akzeptanz: Priorisierte Liste mit kleinsten sinnvollen Hint-/Szenario-Paketen.
No-Cheat: Hints enthalten keine versteckte Gegnerinformation.

### `act-2026-05-17-ai-debug-redaction-schema.md`

Priorität: P1
Ziel: DecisionDebug als versioniertes side-sicheres Schema absichern.
Dateien: `packages/ai/src/index.ts`, `packages/ai/src/index.test.ts`, `packages/shared/src/index.ts`.
Akzeptanz: Snapshottests für Runner- und Corp-Sicht; verbotene Felder scheitern.
No-Cheat: Debug darf keine private Gegenseite enthalten.

### `act-2026-05-17-belief-world-rollout-spike.md`

Priorität: P2
Ziel: Spike für faire Belief-World-Rollouts ohne FullState.
Dateien: neue Spike-/Simulationsmodule, `packages/ai/src/belief-state.ts`, `packages/ai/src/index.test.ts`.
Akzeptanz: Hidden-State-Variantentests beweisen gleiche Entscheidung bei gleicher sichtbarer Projektion.
No-Cheat: Sample-Welten nur aus Hypothesen, niemals aus echtem Hidden State.

### `act-2026-05-17-ai-coaching-boundary-spec.md`

Priorität: P2
Ziel: Side-sichere Grenzen für AI-Coaching/LLM-Unterstützung spezifizieren.
Dateien: neue Spezifikation unter `docs/derived/`, später UI/Server nur nach Gate.
Akzeptanz: Klare erlaubte/verbotene Inputs, Redaction-Beispiele, Testfälle, kein Live-Controller.
No-Cheat: LLM darf beraten/testen/erklären, aber nie Live-Regelquelle oder Hidden-Info-KI sein.

## Offene Fragen / nicht belegte Annahmen

1. Reconnect-Historie:
   Nicht abschließend belegt ist, ob alle Reconnect-PlayerViews dauerhaft genug side-sichere PublicEvents enthalten, damit rechtmäßig gesehenes R&D-/HQ-Wissen nach langen Spielen identisch rekonstruiert wird.

2. Runtime-Kartenabdeckung:
   Es muss geprüft werden, ob `DEMO_CARDS_BY_ID` in `visible-run-analysis.ts` alle aktuell AI-supported O:NR-ICE/Breaker mit relevanten Abilities enthält oder ob auf Runtime-Definitionen umgestellt werden sollte.

3. Aktive Hint-Zahlen vs. Release-Zielkarten:
   `ai-card-hints-active.json` nennt 377 `ai_supported` und 33 `hinted_only`; `CODEX_STATUS.md` spricht bei V1.9.22 von 47 Zielkarten. Diese Schnitte sind wahrscheinlich unterschiedlich, sollten aber in künftigen Statusberichten ausdrücklich auseinandergehalten werden.

4. Live-Endpunkte ohne Doctrine:
   Multiplayer speist eigene Decksnapshots ein. Einige einfache Web/API-Smoke-Pfade bauen AI-Inputs ohne eigene Deck Doctrine. Ob diese Pfade produktiv relevant sind, sollte geklärt werden.

5. Benchmark-Repräsentativität:
   Die vorhandenen Soaks und Doctrine-Reports belegen Safety und lokale Qualitätsmetriken. Sie belegen noch keine breite O:NR-Spielstärke über viele Matchups.

6. LLM-Coaching:
   Die Roadmap-Grenze ist klar: LLM darf nicht Live-Regelakteur oder Hidden-Info-KI werden. Ein konkretes Produktdesign für side-sicheres Coaching ist noch offen.

## Schlussbewertung

Die NETGRID-KI ist heute fair, regelgebunden und deutlich stärker strukturiert als eine einfache Zufalls- oder Greedy-KI. Sie kann sichtbare Breaker-/ICE-Lagen, stale R&D/HQ/Archives-Informationen, geschützte Remotes, einfache Scoring-Fenster, eigene Deck Doctrine und AI-Hints sinnvoll verwenden. Sie ist aber noch keine starke strategische Mehrzug-KI. Der nächste Qualitätssprung sollte nicht über Hidden Info, LLM-Regelauslegung oder größere freie Aktionsräume kommen, sondern über kleine, testbare, side-sichere Planhorizonte, bessere Runtime-Kartenabdeckung, robustere Redaction-Gates und Benchmarks, die Matchprogression statt nur Safety messen.
