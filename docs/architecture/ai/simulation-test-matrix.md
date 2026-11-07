# AI Simulation Test Matrix

Status: active_current
Stand: 2026-11-07

## Evidenzstufen

| Stufe              | Beleg                                                                                | Zulässige Aussage                                                                  |
| ------------------ | ------------------------------------------------------------------------------------ | ---------------------------------------------------------------------------------- |
| L1 Unit/Contract   | Parser, Projektion, Scorekomponente, Redaction oder Zustandsautomat isoliert         | Nur der lokale Vertrag ist belegt.                                                 |
| L2 Live Synthetic  | Öffentlicher Chooser mit handgebautem `AiDecisionInput` und plausiblen Gegenaktionen | Produktives Wiring und Auswahl für genau diese synthetische Situation sind belegt. |
| L3 Live Engine     | Engine-erzeugte `PlayerView` und `LegalActions` durch den öffentlichen Chooser       | Reales Spielverhalten für den annotierten Zustand ist belegt.                      |
| L4 Full Simulation | Engine-Spiel mit `applyAction`, Replay und mehreren Seeds                            | Technische Mehrzug-Integration ist belegt; globale Spielstärke bleibt offen.       |

Ein L1- oder L2-Test darf nicht als Ersatz für L3 ausgegeben werden, wenn die
Behauptung eine echte Spielsituation betrifft. Ein grüner L4-Smoke beweist ohne
Szenarioerwartung keine strategisch richtige Einzelentscheidung.

## Unit Tests

| ID       | Bereich                | Erwartung                                                                  | Requirement |
| -------- | ---------------------- | -------------------------------------------------------------------------- | ----------- |
| T-AI-001 | Contract               | AI-Input ist side-neutral für Runner und Corp.                             | V03-REQ-001 |
| T-AI-002 | Visibility             | AI-Input enthält keinen FullState und keine Hidden-Info-Titel.             | V03-REQ-002 |
| T-AI-003 | Controller             | Controller-Typen erlauben Human, AI und Replay ohne Engine-Regelautorität. | V03-REQ-003 |
| T-AI-004 | Runner AI              | Runner-KI wählt nur LegalActions und kann Access/Steal priorisieren.       | V03-REQ-004 |
| T-AI-005 | Corp AI                | Corp-KI wählt Mandatory/Score/Rez/Economy/Remote-Aufbau priorisiert.       | V03-REQ-005 |
| T-AI-006 | Ausführungsfehler      | Ungültige Entscheidung scheitert sichtbar ohne Ersatzaktion.               | Controller  |
| T-AI-007 | Forbidden Fields       | Serialisierter AI-Input enthält keine verbotenen Felder.                   | V03-REQ-002 |
| T-AI-008 | Determinismus          | Gleicher Input ergibt gleiche Entscheidung.                                | V03-REQ-007 |
| T-AI-011 | Explanation            | Decisions enthalten Reason-Code und Erklärung.                             | V03-REQ-010 |
| T-AI-012 | Explanation Visibility | Erklärungen leaken keine verdeckten Kartentitel.                           | V03-REQ-011 |

Für T-AI-006 gilt der [Fail-closed-Vertrag](controller-contract.md#fail-closed-und-coverage).

## Scenario/Integration

| ID         | Szenario                  | Erwartung                                                        | Datei                                              |
| ---------- | ------------------------- | ---------------------------------------------------------------- | -------------------------------------------------- |
| SCN-AI-001 | Runner stiehlt R&D-Agenda | Runner-KI wählt Access und Steal legal.                          | `data/scenarios/ai-runner-steals-rd-agenda.json`   |
| SCN-AI-002 | Corp scored Remote Agenda | Corp-KI kann Install/Advance/Score-Pfad wählen.                  | `data/scenarios/ai-corp-scores-remote-agenda.json` |
| SCN-AI-003 | KI-vs-KI Smoke Replay     | Simulation endet reproduzierbar mit StateHash und Replay-Erfolg. | `data/scenarios/ai-vs-ai-smoke-replay.json`        |

Die Corp-Scoring-Liveness wird zusätzlich durch drei Engine-nahe
Decision-Checkpoint-Familien für D39, D60 und D78 aus
`match_9f8cecdd78b35d0e` geschützt. Der D60-Mehrzugtest hält Agenda,
Zielremote und Schutzmeilenstein konstant und verbietet ein mit den aktuellen
Credits wanderndes Economy-Ziel. D39 prüft die fachliche globale
Defense-Allokation samt R&D-Breach-Historie; D78 verlangt für einen legalen
Remote-Schutzkandidaten eine konkrete Providerbewertung oder einen
zustandsbezogenen Ablehnungsgrund. Keiner dieser Tests schreibt eine konkrete
Karte oder einen bestimmten Zielserver als Produktregel fest.

## Aktuelles Live-Engine-Gate

- `packages/ai/src/evaluation/real-engine-decision-corpus.test.ts` verlangt
  echte erwartete oder riskante Engine-Actions plus plausible Gegenaktion.
- `packages/ai/src/evaluation/real-engine-live-runtime.test.ts` leitet alle 20
  annotierten Verhaltensszenarien durch `chooseAiAction` und prüft Legalität,
  Determinismus sowie erwartete und verbotene Aktionstypen.
- Die Mutation Witness mit einer kontextblinden Auswahl muss dieses Gate
  nachweislich verletzen.
- Der Korpus umfasst 53 nicht redundante Engine-Szenarien; reine Engine- oder
  Shadow-Diagnostikszenarien zählen nicht automatisch als Live-Verhaltensbeleg.
- `packages/ai/src/evaluation/real-engine-default-runtime.test.ts` führt alle
  53 Eingaben zusätzlich durch den öffentlichen Chooser ohne Modusoverride.
  Es prüft die aktuelle LegalAction und StateVersion, Root und Executor,
  Route, zertifizierten Head, rematerialisiertes Commitment und angebotene
  Choice-Optionen. Planentscheidungen benötigen `cutover` und
  `turn_plan_commitment`; das einzelne zwingende Engine-Fenster benötigt
  seine eigene `engine_window`-Bindung. Das ist Wiring- und Vertragsnachweis,
  keine zusätzliche strategische Annotation aller 53 Szenarien.
- Gegenproben dieses Gates müssen den expliziten Vergleichsmodus trotz
  legaler Action sowie beschädigte Owner-, Action-, Ziel-, Versions- und
  Choice-Bindungen erkennen. Die kontextblinde Gegenprobe des
  Verhaltensgates bleibt zusätzlich erforderlich.
- `packages/ai/src/simulation/simulation-harness.test.ts` prüft zusätzlich zum
  Golden Seed drei verschiedene deterministische Live-Verläufe.

## Vergleichsevidenz und Standardmodus

Verhaltensfälle im expliziten `legacy_compare` tragen `[legacy_compare]` im Namen.
Prüfungen beider Modi sind als `[mode comparison]` benannt. Das gilt auch,
wenn der Override in einem gemeinsamen Testhelfer sitzt. Andere Tests
derselben Datei behalten ihre eigene Evidenzstufe. Ein Dateiname mit
`live`, `cutover` oder `real-engine` allein beweist keinen Standardmodus.
Negative Modus-Gegenproben des Default-Gates sind als solche benannt.

| Vergleichsfamilie | Belegte Eigenschaft | Ergänzender Standardnachweis |
| --- | --- | --- |
| Runner-Sicherheit, wiederholte Central-Runs, Strategie- und Debugfixtures | Scheduler-Vergleich für die ausdrücklich benannte Situation | Default-Engine-Gate und dessen 20 strategisch annotierte Szenarien |
| Corp-Rez-, Encounter-, Punish- und Ambush-Verträge | Exakte Route, Quote oder Owner-Bindung im Vergleichsmodus | Default-Engine-Gate; spezialisierte Default-Tests bleiben für Kartenbehauptungen nötig |
| Fetal AI, Pirate Broadcast und Shadow-Baseline-Simulation | Vergleichsverlauf oder gebundener technischer Kartenpfad | Kein pauschaler Default- oder Spielstärkennachweis |

Der Run-Evaluator-Grenztest löst mit dem TypeScript-Symbolgraphen den
tatsächlichen Produzenten auf. In-memory-Gegenproben prüfen Importalias,
Namespacezugriff und Reexport; ein Kommentar mit dem Symbolnamen darf
keinen Verstoß erzeugen. Die Funding-Strukturprüfung folgt der aktuellen
Funding-Funktion und ihrem AST statt einer bestimmten Schreibweise von
Optional Chaining oder Zeilenumbrüchen.

## Server/UI

| ID           | Bereich                 | Erwartung                                                                       |
| ------------ | ----------------------- | ------------------------------------------------------------------------------- |
| T-SRV-AI-001 | Human Runner vs Corp-KI | Match startet aktiv und Corp-KI handelt automatisch bis Runner dran ist.        |
| T-SRV-AI-002 | Human Corp vs Runner-KI | Runner-KI handelt automatisch nach Corp-Zug.                                    |
| T-SRV-AI-003 | KI-vs-KI API            | Simulation liefert side-sichere Summary ohne FullState.                         |
| T-WEB-AI-001 | UI                      | Moduswahl und Simulationsergebnis sind ohne Engine-Import im Browser verfügbar. |

## Gates

- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm test:ai:shards`
- `corepack pnpm check:ai`
- `corepack pnpm check:ai-deck-doctrine-strategy`
- `corepack pnpm check:proteus-ai-readiness`
- `corepack pnpm --filter @netgrid/server test`
- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

Der normale vollständige AI-Abschlusslauf ist
`corepack pnpm test:ai:shards`: drei feste Shards laufen parallel, jeder davon
mit genau einem Vitest-Worker. `corepack pnpm --filter @netgrid/ai test` bleibt
als serieller paketnaher Diagnosepfad erhalten. Nur bei nachgewiesenem
Speicherdruck oder Instabilität wird auf
`corepack pnpm test:ai:shards:serial` zurückgefallen.

Auf Rechnern mit 16 GB RAM laufen der vollständige AI-Typecheck und die
drei AI-Testshards nacheinander. Der Typecheck kann allein rund 7,5 GB RAM
belegen; parallele Ausführung mit den Shards führte lokal zu weniger als
0,5 GB freiem RAM und stark verlängerten Laufzeiten. Die drei Testshards
bleiben untereinander parallel; weitere speicherintensive Gates warten
auf ihren Abschluss.
Das konfigurierte Heaplimit des Paket-Typechecks steht im Skript
`typecheck` in [packages/ai/package.json](../../../packages/ai/package.json).
Erreicht der Check dieses Limit, lässt sich derselbe strikte Check zur
Diagnose mit einem höheren Heaplimit allein für seinen Prozess ausführen.
Das ändert weder den Prüfgegenstand noch behebt es einen Typfehler.

## Aktuelle offene AI-Gate-Abweichungen

Der vollständige Lauf vom 2026-11-07 umfasst 8.834 Tests in drei festen
Shards: 8.557 bestehen, 277 scheitern in 134 Dateien. Alle 277 Fälle wurden
einzeln am unveränderten Ausgangscommit `e4fb1eacf` mit denselben
Fehlersignaturen reproduziert. Die zuvor roten Strukturprüfungen zur
Run-Evaluator-Zuständigkeit und zur aktuellen Defense-Funding-Bindung
bestehen. Das vollständige AI-Gate bleibt wegen der vorhandenen 277
Abweichungen **rot**.

Die fokussierte Abnahme der Owner-, Quote- und Faktenpfade umfasst 101
bestandene Tests. Paketgrenzen, KI-Struktur, Hint-Verträge, generische
Karten-ID-Grenzen und Test-Discovery bestehen. Der Typecheck des gesamten
Produktivpfads und der neuen beziehungsweise strukturell geänderten Tests
besteht; das ist keine Behauptung über einen vollständigen Paket-Typecheck
aller übrigen Testdateien.

Auch die Zusammenführung mit den offenen lokalen Main-Änderungen besteht
diese 101 Prüfungen, den betreffenden Typecheck sowie Paket- und KI-Gates.
In 53 Engine-Szenarien bleiben Action, Ziele, Choices, Root, Executor und
Route gegenüber dem jeweiligen Ausgangsstand unverändert. Das belegt den
Strukturumbau und seine konkrete Verdrahtung, keine globale Spielstärke.
