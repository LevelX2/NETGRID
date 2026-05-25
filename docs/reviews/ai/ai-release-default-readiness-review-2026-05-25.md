# AI Release Default Readiness Review 2026-05-25

Status: konsolidierter Review
Scope: Entscheidungsgrundlage, keine Strategie-, Engine-, Hintdaten- oder Profiländerung
Workspace: `C:\Projekte\NETGRID-ai-optimization-diagnosis`
Branch: `codex/ai-legal-action-diagnosis`

## Kurzfazit

`current_candidate` ist safety-stabil und als Code-/Infrastrukturstand klar mergewürdig. Die aktuellen KI-Slices haben die Corp deutlich disziplinierter gemacht: Cheap-Remote-Safety bleibt bei `0/0`, Remote-Proliferation und HQ-Flood-Dilution sind stark reduziert, Scored-Agenda-Actions werden besser genutzt, Corp Scores steigen und Runner Steals sinken.

Als neuer Default/Baseline ist `current_candidate` noch nicht automatisch freizugeben. Der aktuelle 8-Slot-Lauf ist insgesamt besser bei ActionLimit-Summe (`2.890 -> 2.777`) und Stagnationswiederholungen (`547 -> 489`), aber die terminale Gesamtzahl Score+Steal ist praktisch unverändert leicht niedriger (`181 -> 180`), Snapshot Pressure verschlechtert ActionLimit leicht, und Local Pair 2 bleibt ein klares Holdout-Warnsignal (`0.000 -> 0.222`) trotz echter Tag/Punish-Konversion.

Empfehlung: **Option 2: Code mergen, Default-Profil vorerst bei `belief_ai_v1_4_2` lassen.** `current_candidate` sollte profile-gated/experimentell bleiben, bis ein finaler Default-Gate-Lauf die Holdout-Warnsignale und den kleinen Score+Steal-Rückgang akzeptiert oder behebt.

## Methodik

Aktueller Lauf:

- Funktion: `runMatchProgressionBenchmarkSuite`
- Baseline: `belief_ai_v1_4_2`
- Candidate: `current_candidate`
- Seeds: 9 (`ai-v143-tuning-001` bis `006`, `ai-v143-holdout-001` bis `003`)
- Max Actions: 160
- Runnable Slots: 8
- Real-Scene- und Local-Slots bleiben `holdout_only`; keine Optimierung darauf.
- Temporärer Vitest-Harness wurde nach dem Lauf gelöscht.

Zusätzlich genutzt wurden die vorhandenen Slice-Reviews in `docs/reviews/ai/`, insbesondere die Hint-/Ontology-, RemoteRole-, Breaker-, Tag/Punish- und früheren Consolidation-Reviews.

## Commit-/Slice-Bilanz

| Block                                                     | Commits                                        | Art                              | Nutzen                                                                                                                  | Risiko                                                                                                            | Checks / Benchmark                                                                                                                          | Empfehlung                         |
| --------------------------------------------------------- | ---------------------------------------------- | -------------------------------- | ----------------------------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| AI-Hint Consumer Contract / Semantic Audit / Gates        | `f9da93da`, `ae7057d5`, `982ce8b8`             | Hint/Ontology, Metrik, Review    | Klärt Verbraucherpfade, korrigiert drei belegte Hints, etabliert `check:ai-hint-quality`.                               | Rollenwildwuchs bleibt, viele Singleton-Warnings.                                                                 | Hint-Quality-Gate grün mit 410 Hints, 0 Errors, 150 Warnings.                                                                               | keep                               |
| Hint Ontology Phase 1/2/3a                                | `88f93ee7`, `b823ed8a`, `2328986f`, `33e26fae` | Hint/Ontology, Diagnose          | Read-only Schema, Validation, Benchmarkkarten-Pilot, Deck-Ontology-Summary.                                             | Teilmigration: viele Benchmarkkarten bleiben `needsHumanReview`; strukturierte Felder können driftgefährdet sein. | AI-Tests, Typecheck, Quality-Gates; keine Planerwirkung bis 3a.                                                                             | keep, monitor quality gaps         |
| Scored-Agenda Ontology Consumer                           | `8a44e53b`                                     | Strategie, Hint/Ontology         | LegalAction-gebundene Zusatzklassifikation für Score-Area-Agenda-Actions; Political-Overthrow-Fehlerklasse abgesichert. | Falsche Ontology kann nur Fallback/Bestätigung liefern, Payload/Text gewinnt.                                     | `basicCreditTakenWhileBetterAgendaEconomyAvailable = 0`, `politicalOverthrowSkippedForBasicCredit = 0`, scoredAgendaActionTaken `17 -> 24`. | release-ready                      |
| Breaker Ontology Consumer + Metrics                       | `570923c6`, `e79e67e4`                         | Strategie, Metrik, Hint/Ontology | Structured Breaker-/CostProfile als konservativer Fallback; First-Class-Metriken.                                       | Suite hängt aktuell kaum am Fallback; Nutzen stärker diagnose-/fixturebezogen.                                    | Safety stabil; aktueller Lauf: Fallback-Metriken global `0`, keine Quote-Konflikte sichtbar.                                                | keep but monitor                   |
| RemoteRole Consumer                                       | `8ca1ea74`                                     | Strategie, Metrik, Hint/Ontology | Remote-Safety/Portfolio versteht `remoteRole`, `run_tax`, `agenda_steal_tax`; Board/effectiveRunQuote bleiben führend.  | Kann Protection konservativer machen; `corpProtectionRepeatedWithoutScoreConversion` steigt aktuell `0 -> 15`.    | Safety stabil; RemoteRole Safety sichtbar, Cheap-Remote-Safety bleibt `0/0`.                                                                | keep but monitor                   |
| Tag/Punish Ontology Consumer                              | `9e57d2c3`                                     | Strategie, Metrik, Hint/Ontology | LegalAction-/Tag-State-gebundene Trennung von Tagquelle und Payoff; echte Punish-Fenster besser erklärt.                | Mehr Opportunities und Skips; Local Pair 2 bleibt Stagnationssignal.                                              | `corpPunishOpportunities 26 -> 36`, `Taken 20 -> 24`, `Skipped 6 -> 12`.                                                                    | keep but monitor                   |
| Corp Cheap-Remote Safety                                  | mehrere frühere Slices                         | Safety, Strategie                | Verhindert Agenda-Install/Advance in billig contestbaren Remotes.                                                       | Kann Scores verzögern, wenn Safety zu konservativ ist.                                                            | Aktuell `corpAgendaInstalledInCheaplyContestableRemote = 0`, `corpAdvanceInCheaplyContestableRemote = 0`.                                   | release-ready                      |
| Corp Remote Portfolio / HQ Density                        | `b890d273` und Folge-Diagnose                  | Strategie, Metrik                | Weniger planlose Remotes, weniger HQ-Flood-Dilution-Draw.                                                               | Möglicher Tradeoff: weniger Terminaldruck in Tag/Punish-Slots.                                                    | Aktuell `corpRemotePortfolioOverExpanded 4 -> 0`, `corpEmptyRemoteStayedUnusedTurns 113 -> 34`, `corpHqAgendaFloodRisk 76 -> 23`.           | release-ready, monitor LP2         |
| Scored Agenda Ability Valuation                           | frühere Fix-Slices                             | Strategie, Safety                | Score-Area-`activated_card_ability` generisch besser klassifiziert.                                                     | Keine neue Legalität; Fehlklassifikation möglich, aber testsicher.                                                | `basicCreditTakenWhileBetterAgendaEconomyAvailable = 0`, `politicalOverthrowSkippedForBasicCredit = 0`.                                     | release-ready                      |
| Runner Memory/Freshness                                   | frühere R&D-/Memory-Slices                     | Strategie, Metrik                | Weniger stale Central/No-Fresh-Wiederholungen, bessere Interpretierbarkeit.                                             | Closeout bleibt nicht automatisch besser.                                                                         | Gesamtwiederholungen `547 -> 489`.                                                                                                          | keep                               |
| Runner Breaker/Tutor Coverage                             | frühere Runner- und Ontology-Slices            | Strategie, Hint/Ontology         | Bessere installierbare/suchbare Coverage, weniger schlechte Setup-Entscheidungen.                                       | Im aktuellen 8-Slot-Lauf keine First-Class-Fallback-Nutzung.                                                      | AI-Tests grün; Breaker metrics größtenteils 0 im Full-Suite-Lauf.                                                                           | keep but monitor                   |
| Runner Trash Budget / Access Reserve / Future-Effect Pump | frühere Runner-Slices                          | Strategie, Safety                | Verhindert Reserve-Zerstörung und sinnlose Pump-/Trash-Entscheidungen.                                                  | Reserve kann Tempo kosten; `runsStartedAgainstKnownUnaffordablePath` steigt im aktuellen Lauf `5 -> 10`.          | `pumpActionsThatCouldNotLeadToBreak = 0`, `pumpActionsThatDestroyedAccessReserve = 0`, `remoteTrashDroppedBelowReserve 3 -> 3`.             | keep, diagnose affordability delta |
| Real-Scene Deck Suite Expansion                           | frühere Deckbasis-Slices                       | Deckbasis, Diagnose              | Zwei externe Reality-Check-Holdouts als Regressionsschutz.                                                              | Nicht darauf optimieren; kleine Samples.                                                                          | Real Scene 1/2 im aktuellen Lauf stabil bis besser bei ActionLimit.                                                                         | keep                               |

## Full-Suite-Benchmark

Gesamtsummen über 8 Slots:

| Metrik                                              | Baseline | Candidate | Bewertung                                      |
| --------------------------------------------------- | -------: | --------: | ---------------------------------------------- |
| `illegalActions`                                    |        0 |         0 | sauber                                         |
| `replayFailures`                                    |        0 |         0 | sauber                                         |
| `timeoutRate`                                       |        0 |         0 | sauber                                         |
| ActionLimitRate-Summe                               |    2.890 |     2.777 | besser                                         |
| Corp Scores                                         |       54 |        63 | besser für Corp-Terminaldruck                  |
| Runner Steals                                       |      127 |       117 | niedriger; plausibel durch bessere Corp-Safety |
| Score+Steal gesamt                                  |      181 |       180 | minimal niedriger                              |
| Score+Steal pro Match                               |    2.514 |     2.500 | minimal niedriger                              |
| `sameStrategicPlanRepeatedWithoutProgress`          |      547 |       489 | besser                                         |
| Cheap Agenda Installs                               |        0 |         0 | Guardrail hält                                 |
| Cheap Advances                                      |        0 |         0 | Guardrail hält                                 |
| `basicCreditTakenWhileBetterAgendaEconomyAvailable` |        0 |         0 | Guardrail hält                                 |
| `politicalOverthrowSkippedForBasicCredit`           |        0 |         0 | Guardrail hält                                 |
| `scoredAgendaActionTaken`                           |       17 |        24 | besser                                         |
| `corpNewRemoteCreatedWithoutPayloadPlan`            |       13 |        10 | besser                                         |
| `corpRemotePortfolioOverExpanded`                   |        4 |         0 | besser                                         |
| `corpEmptyRemoteStayedUnusedTurns`                  |      113 |        34 | deutlich besser                                |
| `corpHqAgendaFloodRisk`                             |       76 |        23 | deutlich besser                                |
| `corpDrawChosenToDiluteAgendaFlood`                 |       35 |         1 | deutlich niedriger                             |
| `runnerDrawActions`                                 |       91 |        61 | disziplinierter                                |
| `runsStartedAgainstKnownUnaffordablePath`           |        5 |        10 | Warnsignal                                     |
| `pumpActionsThatCouldNotLeadToBreak`                |        0 |         0 | sauber                                         |
| `pumpActionsThatDestroyedAccessReserve`             |        0 |         0 | sauber                                         |
| `remoteTrashDroppedBelowReserve`                    |        3 |         3 | stabil                                         |

Ontology-/Consumer-Signale:

| Metrik                               | Baseline | Candidate | Bewertung                                      |
| ------------------------------------ | -------: | --------: | ---------------------------------------------- |
| `corpRemoteRoleProfilesSeen`         |       60 |        41 | sichtbar, aber Candidate nutzt weniger Fenster |
| `corpRemoteRoleUsedForSafety`        |       53 |        36 | sichtbar, kein Safety-Verlust                  |
| `corpRemoteRoleUsedForPortfolio`     |       67 |        16 | weniger Portfolio-Interventionen nötig         |
| `corpTagPunishOntologyProfilesSeen`  |       84 |        95 | sichtbar                                       |
| `corpTagSourceOntologyUsed`          |       65 |        72 | stärker genutzt                                |
| `corpTagPunishPayoffOntologyUsed`    |       24 |        31 | stärker genutzt                                |
| `corpPunishOpportunities`            |       26 |        36 | mehr echte Fenster                             |
| `corpPunishTaken`                    |       20 |        24 | mehr genommene Punish-Aktionen                 |
| `corpPunishSkipped`                  |        6 |        12 | mehr erklärungsbedürftige Skips                |
| `runnerTaggedAtCorpDecision`         |      183 |       152 | weniger stehende Tags am Corp-Fenster          |
| `runnerTagClearedBeforeCorpDecision` |       56 |        49 | etwas niedriger                                |

Slotübersicht:

| Slot              | Use     |            ALR | Corp Scores | Runner Steals | Score+Steal | Hauptbefund                                                             |
| ----------------- | ------- | -------------: | ----------: | ------------: | ----------: | ----------------------------------------------------------------------- |
| Smoke             | safety  | 0.667 -> 0.667 |     7 -> 10 |      14 -> 13 |    21 -> 23 | stabil, Corp stärker, Runner etwas niedriger                            |
| Snapshot Rig      | tuning  | 0.222 -> 0.222 |    10 -> 11 |      22 -> 20 |    32 -> 31 | stabil, kleiner terminaler Rückgang                                     |
| Snapshot Pressure | tuning  | 0.222 -> 0.333 |    10 -> 13 |      27 -> 22 |    37 -> 35 | Warnsignal: ALR höher, Runner-Steals niedriger                          |
| Snapshot Holdout  | holdout | 0.556 -> 0.556 |      9 -> 8 |      19 -> 18 |    28 -> 26 | stabil bei ALR, terminal leicht niedriger, Punish-Fenster stärker       |
| Local Pair 1      | holdout | 0.111 -> 0.000 |      4 -> 3 |        8 -> 9 |    12 -> 12 | ActionLimit besser, Balance neutral                                     |
| Local Pair 2      | holdout | 0.000 -> 0.222 |      0 -> 3 |      19 -> 15 |    19 -> 18 | wichtigstes Warnsignal; Tag/Punish wird genutzt, aber Stagnation steigt |
| Real Scene 1      | holdout | 0.556 -> 0.444 |      8 -> 9 |      12 -> 14 |    20 -> 23 | Holdout profitiert                                                      |
| Real Scene 2      | holdout | 0.556 -> 0.333 |      6 -> 6 |        6 -> 6 |    12 -> 12 | Holdout stabiler bei gleicher Terminalzahl                              |

## Candidate-vs-Baseline

### A. Safety

Candidate ist in diesem Lauf sauber: keine IllegalActions, ReplayFailures oder Timeouts. Die zentralen AI-Hint-/Ontology-Gates sind grün, und die neuen Consumer bleiben an LegalActions, sichtbaren Boardstate und side-safe Inputs gebunden. Kein aktueller Hinweis auf Hidden-Info-/DTO-Risiko.

### B. Progression

Gesamt-ActionLimit verbessert sich leicht. Verbesserungen: Local Pair 1, Real Scene Pair 1, Real Scene Pair 2. Stabil: Smoke, Snapshot Rig, Snapshot Holdout. Verschlechterungen: Snapshot Pressure und Local Pair 2. Local Pair 2 ist akzeptabel als Holdout-Warnsignal, aber vor Default-Promotion nicht zu ignorieren.

### C. Balance

Corp Scores steigen deutlich (`54 -> 63`), Runner Steals sinken (`127 -> 117`). Das ist fachlich plausibel, weil Remote-/HQ-/Safety-Slices Corp-Leaks schließen. Die terminale Gesamtzahl Score+Steal ist aber minimal niedriger (`181 -> 180`), sodass der Candidate nicht eindeutig "terminaler" ist. Er ist eher sicherer und corp-stärker.

### D. Generalisierung

Die Verbesserungen sitzen nicht nur auf Tuning-Slots: Real Scene 1/2 werden bei ActionLimit besser oder stabil. Snapshot Holdout bleibt AL-stabil. Local Pair 2 bleibt problematisch und ist nicht als Tuning-Ziel zu behandeln, aber als Release-Risiko ernst zu nehmen.

### E. Interpretierbarkeit

Die neuen First-Class-Metriken sind ausreichend, um die früheren Black-Box-Verdachtsmomente besser zu trennen:

- Local Pair 2 hat echte Punish-Fenster (`11`) und nutzt sie (`8`).
- RemoteRole ist dort kein Treiber (`0`).
- BreakerOntology-Fallback ist in der Suite nicht Treiber (`0`).
- HQ-/Remote-Portfolio-Signale sind klar besser.

Nicht vollständig erklärt ist, warum Local Pair 2 trotz genommener Punish-Fenster mehr ActionLimit zeigt.

### F. Komplexität

Die KI ist komplexer geworden, aber die Komplexität ist überwiegend durch Module, Tests und Gates abgesichert:

- `hint-ontology.ts` und Consumer-Hilfen strukturieren statt freie Rollen weiter auszubauen.
- Quality-Gates verhindern unbekannte Rollen und Crystal-Palace-Regression.
- First-Class-Metriken ersetzen fragile Evidence-only-Auswertung.

Risiko bleibt: viele kleine Consumer-Slices erhöhen Interaktionskomplexität; Default-Promotion sollte deshalb gate-basiert und nicht rein nach einem positiven Gesamtdelta erfolgen.

## Merge-/Default-Optionen

### Option 1: `current_candidate` wird neuer Default/Baseline

Nicht empfohlen für einen sofortigen automatischen Switch.

Pro:

- Safety komplett sauber.
- Gesamt-ActionLimit besser.
- Corp Scores steigen, Runner Steals sinken.
- Remote-/HQ-/Draw-/Scored-Agenda-Guardrails deutlich besser.

Contra:

- Score+Steal gesamt minimal niedriger.
- Snapshot Pressure und Local Pair 2 verschlechtern ActionLimit.
- Local Pair 2 bleibt terminaler Stagnationsindikator trotz Punish-Nutzung.
- `runsStartedAgainstKnownUnaffordablePath` steigt `5 -> 10`.

### Option 2: Code mergen, Default-Profil bleibt `belief_ai_v1_4_2`

Empfohlen.

Die Infrastruktur-, Diagnose-, Safety- und Ontology-Arbeiten sind klar wertvoll und testgesichert. `current_candidate` bleibt verfügbar und messbar, aber Default-Promotion wartet auf einen expliziten Gate-Run mit akzeptierten Holdout-Warnungen oder einem weiteren gezielten Fix.

### Option 3: Selektiver Merge / Profile-Gating einzelner Blöcke

Nur nötig, wenn der Integrationszweig hohe Risikotoleranz-Anforderungen hat.

Klar mergewürdig:

- Hint Contract, Semantic Audit, Gates.
- Read-only Ontology Validation/Pilot/Diagnostics.
- Cheap-Remote-Safety.
- Scored-Agenda Ability Valuation und Scored-Agenda Ontology Consumer.
- Metrik-/Review-/Benchmarkdeck-Slices.

Keep but monitor / ggf. profile-gated:

- RemoteRole Consumer wegen möglicher Protection-Konservativität.
- Tag/Punish Consumer wegen mehr Skips und Local-Pair-2-Warnsignal.
- Breaker/CostProfile Consumer wegen aktuell geringer Suite-Wirkung, aber stabiler Safety.
- Runner Reserve/Affordability wegen `runsStartedAgainstKnownUnaffordablePath 5 -> 10`.

## Release-Kriterien

Must-pass:

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm check:ai-hint-quality`
- `corepack pnpm check:ai-approval-consistency`
- Bei Hintdatenänderungen zusätzlich Catalog tests/typecheck.
- 8-Slot-Suite mit:
  - `illegalActions = 0`
  - `replayFailures = 0`
  - `timeoutRate = 0`
  - Cheap-Remote-Safety `0/0`
  - `basicCreditTakenWhileBetterAgendaEconomyAvailable = 0`
  - `politicalOverthrowSkippedForBasicCredit = 0`
  - keine Hidden-Info-/DTO-Verletzung

Default-candidate thresholds:

- Gesamt-ActionLimitRate nicht schlechter als Baseline.
- Score+Steal pro Match nicht niedriger als Baseline oder explizit akzeptierter Tradeoff.
- Keine mehr als eine materiell schlechtere Holdout-Regression.
- Kein einzelner Slot mit katastrophaler Regression.
- `runsStartedAgainstKnownUnaffordablePath` nicht deutlich schlechter.
- `corpProtectionRepeatedWithoutScoreConversion` und `corpProtectionNoSafetyDelta` beobachtet oder begründet.
- Local Pair 2 als Warnsignal dokumentiert und akzeptiert.

## Offene Risiken und nächste Entwicklungsblöcke

| Block                                                | Warum wichtig                                                                      | Jetzt oder später                         | Risiko                                                       | Nächster Schritt                                                                 |
| ---------------------------------------------------- | ---------------------------------------------------------------------------------- | ----------------------------------------- | ------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| Local Pair 2 terminal conversion                     | Bleibt wichtigstes Holdout-Warnsignal trotz Tag/Punish-Nutzung.                    | Jetzt als Diagnose, nicht Tuning.         | Holdout-Überoptimierung.                                     | Repro-Trace zu Punish->Follow-up und Score/Lock-Closeout, keine neue Gewichtung. |
| Release/default gate                                 | Default-Switch braucht klare Akzeptanz statt Bauchgefühl.                          | Jetzt.                                    | Zu strenge Gates können sinnvolle Verbesserungen blockieren. | Option-2-Integration vorbereiten, Default separat entscheiden.                   |
| Future-run/Future-encounter ICE Consumer             | Nächster Ontology-Baustein mit strukturierten Pilotdaten.                          | Später, nach Release-Review-Entscheidung. | Interaktionskomplexität mit `effectiveRunQuote`.             | Read-only Diagnose oder enger Consumer nur mit Quote-Vorrang.                    |
| OpponentSignals / Archetype Model                    | Könnte terminale Linien besser planen.                                             | Später.                                   | Hidden-Info- und Overfitting-Risiko.                         | Erst sichtbare Evidence-Verträge und Gates definieren.                           |
| Corp Doctrine Deepening                              | Candidate ist corp-stärker, aber Terminaldruck/Protection-Conversion bleibt Thema. | Mittel.                                   | Breite Heuristik.                                            | Enger Doctrine-Review, Fokus Protection->Score/Tag-Punish-Closeout.              |
| Runner Doctrine / Phase Model                        | Runner Steals sinken; Phase-Exit und Tempo bleiben relevant.                       | Mittel.                                   | Kann alte Draw-/Reserve-Probleme zurückbringen.              | Diagnose zu Setup-to-pressure nach Reserve/Breaker-Ready.                        |
| Release traceability / AI-decision trace integration | Viele Metriken sind vorhanden; Entscheidungsreplays könnten Review beschleunigen.  | Mittel.                                   | Tooling-Aufwand.                                             | Kompakte trace IDs für dominante Strategic Lines.                                |
| Benchmarkkarten `needsHumanReview`                   | Ontology-Qualität bleibt teiltransparent.                                          | Später batchweise.                        | Hintdaten-Massenänderungen.                                  | Kleine P0/P1-Review-Batches, keine Planerwirkung ohne Gates.                     |
| Remote-Ice-Consolidation metric split                | Frühere Metrik war schwer interpretierbar.                                         | Später.                                   | Metrik statt Spielstärke.                                    | Opportunity/Taken/Suppressed-Aufteilung bei nächstem Remote-Review.              |

## Empfehlung

1. Kurzfristig: **Option 2** dokumentieren und vorbereiten: Code-/Infrastrukturstand ist mergewürdig, Default bleibt vorerst `belief_ai_v1_4_2`.
2. Vor Default-Promotion: einen expliziten Default-Gate-Lauf mit den oben genannten Kriterien durchführen.
3. Danach: entweder Local-Pair-2-Terminal-Conversion als Diagnoseblock oder Future-run/Future-encounter ICE als nächster enger Ontology-Consumer. Aufgrund der aktuellen Komplexität ist zuerst Local-Pair-2-/Release-Gate-Diagnose sauberer als ein weiterer Consumer.

## Checks

Für diesen Review auszuführen:

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai exec tsc -p tsconfig.json --noEmit`
- `corepack pnpm check:ai-hint-quality`
- `corepack pnpm check:ai-approval-consistency`
- Prettier für Markdown
- `git diff --check`
