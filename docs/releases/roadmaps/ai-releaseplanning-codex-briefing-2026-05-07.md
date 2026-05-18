# NETGRID – KI-Gegner: Releaseplanung, Abhängigkeiten und Codex-Arbeitsauftrag

**Stand:** 07.05.2026  
**Zweck:** Ergänzung der bestehenden NETGRID-Releaseplanung um eine stufenweise, testbare und realistische Roadmap für starke KI-Gegner auf Corp- und Runner-Seite.  
**Adressat:** Codex / Entwicklungsagent im Repository.  
**Wichtig:** Dieses Dokument ist kein Auftrag, sofort eine starke KI zu implementieren. Der erste Auftrag ist, die bestehende einfache KI und die vorhandene Releaseplanung abzugleichen und die Planung sauber zu ergänzen.

---

## 0. Kurzauftrag an Codex

Analysiere das bestehende NETGRID-Repository und die vorhandene Releaseplanung. Es gibt bereits eine einfache Corp-KI bzw. eine dafür vorgesehene MVP-0.1-Architektur. Gleiche diese bestehende KI gegen die in diesem Dokument beschriebenen KI-Level, Abhängigkeiten und Release-Gates ab.

Ziel ist, die Releaseplanung so zu erweitern, dass aus der heutigen einfachen KI schrittweise ein starker, fairer und reproduzierbarer KI-Gegner für beide Seiten entstehen kann.

Codex soll dabei:

1. die bestehende KI-Implementierung und KI-Planung im Repository finden,
2. den aktuellen Stand als AI-Level 0/1, teilweise 2 oder anders klassifizieren,
3. vorhandene Prinzipien wie `LegalActions`, `PlayerView`, `EventLog`, `StateHash`, `Replay`, `Timeout`, `Fallback` und Hidden-Info-Schutz beibehalten,
4. die Releaseplanung um eine eigene KI-Roadmap mit Abhängigkeiten, Mechanik-Gates und Akzeptanzkriterien ergänzen,
5. keine starke KI in MVP 0.2 erzwingen,
6. die spätere starke KI an stabile Mechanik-Baselines und AI-supported Kartenpools koppeln,
7. alle neuen Planungstexte so formulieren, dass sie mit der vorhandenen MVP-0.1- und MVP-0.2-Logik kompatibel bleiben.

Codex soll nicht einfach „eine bessere KI“ bauen. Codex soll eine belastbare Planungsgrundlage schaffen, die spätere Implementierung in prüfbare, abhängige Stufen zerlegt.

---

## 1. Ausgangslage, die beim Abgleich zu berücksichtigen ist

Die vorhandene Planung enthält bereits mehrere wichtige Entscheidungen, die nicht verworfen werden dürfen.

### 1.1 MVP 0.1

MVP 0.1 ist als private NETGRID-/NETGRID-Demo mit einem menschlichen Runner gegen eine einfache Corp-KI geplant bzw. angelegt. Die wichtigsten Grundsätze sind:

- Die Rules Engine ist alleinige Regelautorität.
- UI, menschliche Spieler und KI wählen nur aus `LegalActions`.
- Die KI darf keine Regeln selbst auslegen und keine Aktionen erfinden.
- Die KI erhält nur erlaubte Informationen aus `PlayerView`, `PublicEventLog` und `LegalActions`.
- Es gibt feste Demo-Decks und einen kleinen kontrollierten Kartenpool.
- Die einfache Corp-KI muss nicht stark sein; sie muss legal, stabil, deterministisch testbar und nachvollziehbar sein.
- KI-Entscheidungen benötigen Timeout und Fallback.
- Hidden-Info-Leaks in KI-Input, PlayerViews, Events, Fehlern und Replays sind ein Gate.

Diese 0.1-Entscheidung ist weiterhin richtig. Sie ist die Sicherheitsbasis der späteren starken KI.

### 1.2 MVP 0.2

MVP 0.2 ist primär Human-vs-Human über Internet. Es ist ausdrücklich keine starke KI-Stufe. Wichtig für spätere KI ist aber, dass 0.2 die gemeinsame Infrastruktur härtet:

- serverautoritativer Match-Server,
- getrennte PlayerViews,
- WebSocket-Synchronisation ohne Hidden-Info-Leaks,
- Reconnect,
- Undo mit Zustimmung und Informationsschutz,
- EventLog, StateVersion, StateHash und Replaybarkeit,
- Controller-Abstraktion für lokale Menschen, Remote-Menschen, KI und Replay.

Codex soll 0.2 nicht zu einer KI-Version umplanen. 0.2 soll als AI-readiness-Stufe verstanden werden: Sie liefert Controller-, Visibility-, EventLog-, Replay- und Synchronisationsgrundlagen, auf denen spätere KI-Stufen aufbauen.

### 1.3 Bereits vorhandene einfache KI

Codex soll zuerst prüfen, welche KI bereits existiert. Erwartbar ist eine einfache Corp-KI nach folgendem Muster:

- scorebare Agenda scoren,
- Economy spielen oder Credits nehmen, wenn arm,
- HQ/R&D schützen,
- Remote bauen,
- Agenda installieren,
- Agenda advancen,
- bei Fehler/Timeout Fallback-Aktion wählen.

Diese KI soll nicht blind ersetzt werden. Sie soll klassifiziert und gegebenenfalls modular eingebettet werden.

Empfohlene Klassifikation:

```txt
AI-Level 0: Safe Legal Bot
AI-Level 1: einfache regelbasierte Corp-KI
```

Falls einzelne Bewertungsfunktionen bereits existieren, können Teile als AI-Level 2 vorbereitet gelten. Das muss Codex anhand des Codes prüfen.

---

## 2. Nicht verhandelbare KI-Grundsätze

Diese Grundsätze gelten für alle Releases und alle Schwierigkeitsgrade.

### 2.1 Engine bleibt Regelautorität

Die KI ist ein Controller, kein Regelakteur.

```txt
Engine → PlayerView → LegalActions → KI wählt actionId → Engine validiert → applyAction
```

Die KI darf niemals:

```txt
- eigene Aktionen erzeugen,
- Kartentexte frei interpretieren,
- Regeln ausführen,
- Kosten selbst durchsetzen,
- Targets akzeptieren, die nicht in LegalActions enthalten sind,
- Timing-Fenster selbst erfinden,
- den vollständigen GameState lesen.
```

Jede KI-Aktion wird nochmals durch die Engine validiert.

### 2.2 Schwierigkeit ohne Informationsvorteil

Eine stärkere KI darf mehr planen, genauer bewerten und weniger zufällig spielen. Sie darf aber nicht mehr wissen.

```txt
Hard AI darf mehr denken, aber nicht mehr wissen.
```

Höhere Schwierigkeit entsteht durch:

```txt
- bessere Bewertungsfunktionen,
- Planbewertung,
- Gegner-Modell,
- Belief State,
- Simulation,
- weniger Zufall,
- bessere Gewichtung,
- bessere Nutzung von Replays und Benchmarks.
```

Nicht erlaubt:

```txt
- Runner-Hand für Corp sichtbar machen,
- unrezzed ICE oder verdeckte Remote-Karten für Runner sichtbar machen,
- nächste Karten von R&D oder Stack kennen,
- versteckte Debug-Dumps in AIInput verwenden,
- Simulation mit vollständigem echten Hidden State durchführen.
```

### 2.3 KI-Stärke gilt nur für definierte Baselines

Eine KI-Stufe gilt immer nur für eine definierte Kombination aus:

```txt
- RulesBaseline,
- Engine-Schema,
- Kartenpool,
- Mechanik-Support,
- AI-Hints,
- Testszenarien,
- Benchmark-Gegnern.
```

Formulierung für die Planung:

```txt
Die KI wird stufenweise gegen definierte Rules-/Mechanics-Baselines entwickelt. Eine KI-Stufe gilt nur für Karten und Mechaniken als unterstützt, die in dieser Baseline vollständig implementiert, getestet und für AI-Support freigegeben sind.
```

---

## 3. Erste Aufgabe für Codex: Audit der bestehenden KI

Bevor Codex Releaseplanungstexte ändert, soll ein kurzer Audit erfolgen.

### 3.1 Zu suchende Dateien und Konzepte

Codex soll im Repository suchen nach:

```txt
ai
corpAi
CorpAi
runnerAi
RunnerAi
AiController
LegalAction
PlayerView
DecisionDebug
Fallback
Timeout
getLegalActions
applyAction
getPlayerView
PublicEventLog
StateHash
Replay
```

### 3.2 Audit-Tabelle

Codex soll den aktuellen Stand in einer Tabelle dokumentieren:

| Bereich | Gefunden? | Aktueller Stand | Ziel-Level | Lücke | Empfehlung |
|---|---:|---|---|---|---|
| AiController | ja/nein | ... | Level 0 | ... | ... |
| CorpAiController | ja/nein | ... | Level 1 | ... | ... |
| LegalAction-only | ja/nein | ... | Level 0 | ... | ... |
| PlayerView-only | ja/nein | ... | Level 0 | ... | ... |
| Timeout/Fallback | ja/nein | ... | Level 0 | ... | ... |
| Determinismus/Seed | ja/nein | ... | Level 0 | ... | ... |
| DecisionDebug | ja/nein | ... | Level 0/2 | ... | ... |
| Corp-Heuristik | ja/nein | ... | Level 1 | ... | ... |
| Runner-KI | ja/nein | ... | Level 1 später | ... | ... |
| KI-vs-KI Smoke | ja/nein | ... | 0.3 | ... | ... |
| Szenario-Tests | ja/nein | ... | 0.3+ | ... | ... |

### 3.3 Ergebnis des Audits

Codex soll danach entscheiden:

- Bestehende einfache KI beibehalten und modularisieren, wenn sie korrekt ist.
- Keine funktionierende Sicherheitslogik entfernen.
- Keine starke KI direkt in 0.1 oder 0.2 hineinziehen.
- Falls `DecisionDebug`, `AIInput` oder Tests fehlen, diese als Planungs- oder spätere Implementierungsaufgaben markieren.

---

## 4. KI-Fähigkeitslevel

Die Releaseplanung soll eine klare Fähigkeitsleiter enthalten. Diese Level sind technische Entwicklungslevel, nicht zwingend direkt UI-Schwierigkeitsgrade.

### AI-Level 0: Safe Legal Bot

Ziel: Die KI kann legal handeln und niemals das Spiel blockieren.

Fähigkeiten:

```txt
- wählt ausschließlich aus LegalActions,
- verwendet nur PlayerView und erlaubte Events,
- hat deterministischen Fallback,
- hat Timeout,
- verwendet Seed/RNG reproduzierbar,
- erzeugt minimale Debug-Information,
- hängt nicht in Endlosschleifen.
```

Harte Voraussetzungen:

```txt
- GameState,
- PlayerView,
- LegalActions,
- applyAction,
- StateVersion,
- deterministischer RNG/Seed,
- Fallback-Aktion.
```

Nicht erforderlich:

```txt
- vollständiges Run-System,
- starker Kartenpool,
- Planlogik,
- Gegner-Modell,
- Simulation.
```

### AI-Level 1: Regelbasierte Basis-KI

Ziel: Spielbare Basisgegner für den Demo-Kartenpool.

Corp-Fähigkeiten:

```txt
- scorebare Agenda scoren,
- Credits nehmen oder Economy spielen,
- HQ/R&D grob schützen,
- ICE installieren,
- ICE rezzen oder passen,
- Remote bauen,
- Agenda installieren,
- Agenda advancen.
```

Runner-Fähigkeiten:

```txt
- Credits nehmen oder Economy spielen,
- Karten ziehen,
- einfache Breaker installieren,
- offene Server angreifen,
- Remote mit fortgeschrittener Karte contesten,
- klar sinnlose Runs vermeiden.
```

Harte Voraussetzungen Corp:

```txt
- Corp-Zugstruktur,
- Credits,
- Draw,
- Install,
- ICE installieren,
- ICE rezzen,
- Agenda installieren,
- Agenda advancen,
- Agenda scoren,
- Remote-Server,
- HQ/R&D/Archives-Grundmodell.
```

Harte Voraussetzungen Runner:

```txt
- Runner-Zugstruktur,
- Credits,
- Draw,
- Install,
- Run starten,
- Server wählen,
- Encounter-Grundablauf,
- Access,
- Agenda stehlen.
```

### AI-Level 2: Bewertungsbasierte KI

Ziel: Aktionen werden nicht nur nach festen Prioritäten gewählt, sondern bewertet.

Corp bewertet:

```txt
- Agenda-Fortschritt,
- HQ-Risiko,
- R&D-Risiko,
- Archives-Risiko,
- Remote-Sicherheit,
- Credit-Reserve,
- ICE-Rez-Fähigkeit,
- Runner-Druck,
- Scoring Window.
```

Runner bewertet:

```txt
- Access-Wert,
- Run-Kosten,
- Run-Risiko,
- Agenda-Wahrscheinlichkeit,
- Rig-Aufbau,
- Credit-Reserve,
- Remote-Bedrohung,
- Corp-Scoring-Gefahr.
```

Zusätzliche harte Voraussetzungen:

```txt
- ServerValue-Berechnung,
- Agenda-Risiko ermittelbar,
- Run-Erfolg grob abschätzbar,
- ICE-Kosten und ICE-Wirkung maschinenlesbar,
- Rez-Kosten verfügbar,
- Advance-Anforderungen von Agendas verfügbar,
- Trash-Kosten für Assets/Upgrades verfügbar,
- Kartenrollen oder AI-Hints im Kartenmanifest.
```

### AI-Level 3: Planbasierte KI

Ziel: Die KI bewertet nicht nur einzelne Klicks, sondern ganze Pläne und Zugsequenzen.

Corp-Pläne:

```txt
score_now
score_next_turn
build_scoring_remote
protect_hq
protect_rnd
recover_economy
bait_runner
draw_for_options
```

Runner-Pläne:

```txt
pressure_rnd
pressure_hq
contest_remote
build_rig
recover_economy
draw_for_answers
trash_asset
safe_probe_run
```

Zusätzliche harte Voraussetzungen:

```txt
- LegalActions nach jeder Transition zuverlässig neu berechenbar,
- applyAction sequenziell und deterministisch nutzbar,
- ChoiceRequests sauber modelliert,
- Aktionen typisiert genug für Planbildung,
- vollständige Züge für Corp und Runner durchspielbar,
- DecisionDebug vorhanden.
```

Ab Level 3 muss jede Entscheidung erklärbar sein.

### AI-Level 4: Belief State und Gegner-Modell

Ziel: Die KI schätzt gegnerische Möglichkeiten fair aus erlaubten Informationen.

Corp-Modell über Runner:

```txt
- Hat der Runner passende Breaker?
- Hat der Runner genug Credits?
- Greift er aggressiv Remotes an?
- Ignoriert er R&D?
- Ist HQ-Druck wahrscheinlich?
- Kann er den Scoring Remote erreichen?
```

Runner-Modell über Corp:

```txt
- Ist eine Remote-Karte wahrscheinlich Agenda, Asset oder Bait?
- Hält die Corp Geld zum Rezzen offen?
- Welche ICE-Typen sind wahrscheinlich relevant?
- Ist HQ agenda-lastig?
- Ist R&D wegen Agenda-Dichte interessant?
- Bereitet die Corp einen Score vor?
```

Harte Voraussetzungen:

```txt
- vollständiger öffentlicher EventLog,
- seitenspezifisch gefilterte EventLogs,
- Replay-Historie,
- Memory-System pro KI-Seite,
- klare Visibility-Regeln,
- öffentliche und private Informationen sauber getrennt.
```

Belief State darf nie aus dem vollständigen GameState entstehen.

### AI-Level 5: Simulation und Gegenzug-Bewertung

Ziel: Die KI simuliert eigene Pläne und plausible Gegenzüge.

Beispiel Corp:

```txt
Plan A: Agenda installieren und advancen.
Simulation:
- Runner greift Remote an.
- Runner hat wahrscheinlich genug Credits?
- ICE kann rezzed werden?
- Agenda wird wahrscheinlich gestohlen?
Ergebnis: Plan zu riskant oder gut.
```

Beispiel Runner:

```txt
Plan A: Run auf Remote.
Simulation:
- Corp kann erstes ICE rezzen.
- Runner kann es brechen?
- Access-Wert rechtfertigt Kosten?
- Falls Agenda: steal.
- Falls Asset: trash?
Ergebnis: Run lohnt oder nicht.
```

Harte Voraussetzungen:

```txt
- sichere GameState-Kopie,
- applyAction ohne Seiteneffekte,
- deterministische State-Transitions,
- deterministischer RNG,
- vollständiges Replay/StateHash-System,
- LegalActions in simulierten Zuständen,
- Zeitbudget und Fallback,
- keine Hidden-Info-Nutzung in Simulation.
```

Simulation unbekannter Informationen erfolgt über hypothetische Welten aus dem Belief State, nicht über den echten Hidden State.

### AI-Level 6: Selfplay, Tuning und Exploit-Tests

Ziel: Die KI wird anhand vieler Partien gemessen und verbessert.

Voraussetzungen:

```txt
- stabile Corp-KI,
- stabile Runner-KI,
- KI-vs-KI-Harness,
- vollständige Match-Enden,
- Benchmark-Runner,
- Replay-Auswertung,
- DecisionDebug,
- Szenario-Regressionen.
```

Metriken:

```txt
- Winrate,
- Agenda-Punkte,
- durchschnittliche Spielzüge,
- illegale Aktionen,
- Timeouts,
- Abstürze,
- klare Fehlentscheidungen,
- HQ/R&D/Remote-Verlustmuster,
- unnötige Rez-Kosten,
- verschenkte Scoring Windows,
- verpasste Remote-Contests.
```

---

## 5. Release-Roadmap mit KI-Spur

Die vorhandene Releaseplanung sollte um eine eigene KI-Spur ergänzt werden. Die folgende Roadmap ist als Zielstruktur zu verstehen.

### MVP 0.1 – einfache Corp-KI, aber richtige Architektur

KI-Ziel:

```txt
Human Runner vs einfache Corp-KI.
```

Einzuordnen als:

```txt
AI-Level 0 bis AI-Level 1 auf Corp-Seite.
```

Harte Voraussetzungen:

```txt
- LegalActions,
- CorpPlayerView,
- Basic GameState,
- Credits, Draw, Install,
- Agenda install/advance/score,
- einfache Runs,
- ICE installieren und rezzen,
- Access/Steal für Demo-Karten,
- EventLog/StateVersion.
```

Nicht erforderlich:

```txt
- vollständiger Kartenpool,
- Runner-KI,
- Belief State,
- Simulation,
- Tags/Trace/Damage,
- Multiaccess.
```

Planungsvermerk:

```txt
MVP 0.1 CorpAI gilt nur für Demo-Decks und die explizit unterstützte Rules-/MechanicsBaseline. Die einfache KI darf nicht als starke KI verstanden werden, muss aber LegalAction-only, PlayerView-only, deterministisch und fallback-sicher sein.
```

### MVP 0.2 – Human-vs-Human, keine starke KI

KI-Ziel:

```txt
AI-readiness erhalten, aber keine starke KI als Schwerpunkt.
```

Harte Voraussetzungen für spätere KI:

```txt
- Controller-Abstraktion,
- PlayerView-Härtung,
- WebSocket ohne Hidden-Leaks,
- Reconnect über PlayerView/LegalActions,
- EventLog und Replays belastbar,
- serverautoritative Action-Pipeline.
```

Nicht erforderlich:

```txt
- neue KI-Strategie,
- Runner-KI,
- Simulation.
```

Planungsvermerk:

```txt
0.2 ist keine KI-Ausbaustufe, aber eine Voraussetzung für robuste Controller-, Visibility- und Replay-Infrastruktur. KI-Controller sollen kompatibel bleiben, aber nicht Release-Fokus sein.
```

### Release 0.3 – AI Foundation / AI Lab

KI-Ziel:

```txt
Beide KI-Seiten als Controller, DecisionDebug, Szenario-Harness, KI-vs-KI-Smoke-Test.
```

Umfang:

```txt
- gemeinsames AI-Framework,
- CorpAI und RunnerAI als getrennte Controller,
- AI Decision Debug Schema,
- Szenario-Fixtures,
- KI-vs-KI Smoke-Test,
- Benchmark Runner,
- einfache Runner-KI Level 1,
- verbesserte Corp-KI Level 1+.
```

Technische Zielstruktur:

```txt
src/ai/common/
  AiController
  AiInput
  AiDecision
  AiDecisionDebug
  AiMemory
  AiConfig
  AiRng
  LegalActionSelector
  FeatureExtractor

src/ai/corp/
  CorpAiController
  CorpHeuristics
  CorpActionScorer

src/ai/runner/
  RunnerAiController
  RunnerHeuristics
  RunnerActionScorer

src/ai/testing/
  ScenarioFixture
  AiBenchmarkRunner
  AiVsAiHarness
```

0.3-Gates:

```txt
- Corp-KI und Runner-KI können beide eine Seite kontrollieren.
- KI-vs-KI kann mindestens 100 Testpartien oder Testzüge ohne Crash laufen.
- Keine illegale Aktion in KI-vs-KI.
- Keine Hidden-Info-Leaks in AIInput.
- Jeder KI-Zug erzeugt DecisionDebug.
- Basisszenarien für Corp und Runner bestehen.
```

### Release 0.4 – Competent Corp AI

KI-Ziel:

```txt
Planbasierte Corp-KI für den unterstützten Kartenpool.
```

Harte Voraussetzungen:

```txt
- Agenda-Mechanik stabil,
- Remote-Server stabil,
- ICE installieren/rezzen stabil,
- Run/Access/Steal stabil genug für Risikoanalyse,
- ServerThreatEvaluator möglich,
- EconomyReserveEvaluator möglich,
- ScoringWindowEvaluator möglich,
- Corp-DecisionDebug vorhanden.
```

Umfang:

```txt
- AgendaRiskEvaluator,
- ServerThreatEvaluator,
- EconomyReserveEvaluator,
- IceRezEvaluator,
- ScoringWindowEvaluator,
- RemoteIntentMemory,
- CorpPlanGenerator,
- CorpPlanEvaluator.
```

Corp-Pläne:

```txt
score_now
score_next_turn
build_scoring_remote
protect_hq
protect_rnd
recover_economy
install_asset
bait_runner
draw_for_options
```

0.4-Gates:

```txt
- CorpAI Level 3 für Demo-Kartenpool.
- CorpAI schlägt Random Runner deutlich.
- CorpAI schlägt alte 0.1-CorpAI in Benchmark-Szenarien deutlich.
- Alle Corp-Szenario-Tests bestehen.
- Keine Agenda wird in definierten Hochrisiko-Szenarien unnötig verschenkt.
- CorpAI spielt 500 KI-vs-KI-Partien oder ausreichend lange Simulationsläufe ohne Crash, Hang oder illegale Action.
```

### Release 0.5 – Competent Runner AI

KI-Ziel:

```txt
Planbasierte Runner-KI.
```

Harte Voraussetzungen:

```txt
- Run-System stabil,
- ICE/Breaker-Interaktion stabil,
- Jack-out-/Continue-Entscheidungen stabil,
- Access/Steal/Trash stabil,
- Runner-Rig modelliert,
- ServerAccessValueEvaluator möglich,
- RunCostEstimator möglich,
- CorpScoringThreatEvaluator möglich.
```

Umfang:

```txt
- RunnerRigEvaluator,
- RunCostEstimator,
- ServerAccessValueEvaluator,
- RemoteThreatEvaluator,
- CorpScoringThreatEvaluator,
- RunnerEconomyEvaluator,
- RunnerPlanGenerator,
- RunnerPlanEvaluator.
```

Runner-Pläne:

```txt
pressure_rnd
pressure_hq
contest_remote
build_rig
recover_economy
draw_for_answers
trash_asset
probe_unknown_ice
safe_run_for_value
```

0.5-Gates:

```txt
- RunnerAI Level 3 für Demo-Kartenpool.
- RunnerAI schlägt Random Corp deutlich.
- RunnerAI kann gegen Competent CorpAI sinnvoll spielen.
- KI-vs-KI-Partien enden regelmäßig durch Agenda-Sieg, nicht durch Fehler.
- Runner-Szenario-Tests bestehen.
- RunnerAI verschenkt definierte Runs nicht durch falsche Breaker-/Credit-Entscheidungen.
```

### Release 0.6 – Belief State und Gegner-Modell

KI-Ziel:

```txt
Beide Seiten bilden faire Annahmen über gegnerische Möglichkeiten.
```

Harte Voraussetzungen:

```txt
- PublicEventLog vollständig genug,
- SideEventLog/PlayerView gefiltert,
- Replay rekonstruierbar,
- Memory pro KI-Seite,
- Visibility-Tests robust,
- bekannte Informationen eindeutig markiert.
```

Corp-Erweiterungen:

```txt
- RunnerThreatModel,
- RunnerAggressionMemory,
- BreakerAvailabilityEstimate,
- RemoteContestProbability,
- HQPressureEstimate,
- RNDPressureEstimate.
```

Runner-Erweiterungen:

```txt
- CorpPlanEstimate,
- RemoteCardBelief,
- UnrezzedIceRiskModel,
- HQAgendaDensityEstimate,
- RNDValueEstimate,
- CorpCreditReserveInterpretation.
```

0.6-Gates:

```txt
- AIInput enthält weiterhin keine verbotenen Informationen.
- Belief State ist aus Events und PlayerView rekonstruierbar.
- Gleiche Replay-Historie erzeugt gleichen Belief State.
- KIs passen ihre Strategie an beobachtetes Gegnerverhalten an.
- Keine Schwierigkeit nutzt Hidden-Info-Cheating.
```

### Release 0.7 – Simulationsgestützte KI

KI-Ziel:

```txt
Eigene Pläne plus plausible Gegenzüge simulieren und bewerten.
```

Harte Voraussetzungen:

```txt
- applyAction rein/deterministisch,
- GameState sicher kopierbar,
- simulierte LegalActions verfügbar,
- RNG deterministisch,
- ChoiceRequests simulierbar,
- Zeitbudget/Fallback,
- Evaluatoren aus 0.4/0.5 vorhanden,
- Belief State vorhanden oder ersatzweise einfache Hypothesen.
```

0.7-Gates:

```txt
- Simulation verändert echten GameState nie.
- Simulierte Welten respektieren PlayerView-Grenzen.
- Simulation hat Zeitbudget und Fallback.
- KI verbessert sich messbar gegen Level-3-Versionen.
- Keine Endlossuche.
- Keine Action-Explosion durch ungefilterte Vollsuche.
```

### Release 0.8 – Selfplay, Benchmarking und Tuning

KI-Ziel:

```txt
Stärke messen, Regressionen finden, Gewichte verbessern.
```

Harte Voraussetzungen:

```txt
- stabile CorpAI,
- stabile RunnerAI,
- KI-vs-KI-Partien laufen durch,
- Match-Enden korrekt,
- BenchmarkRunner,
- Replay-Auswertung,
- DecisionDebug vollständig,
- Szenario-Regressionen.
```

Benchmark-Gegner:

```txt
- RandomLegalBot,
- BasicCorpAI,
- BasicRunnerAI,
- CompetentCorpAI,
- CompetentRunnerAI,
- PreviousReleaseAI,
- CurrentCandidateAI.
```

0.8-Gates:

```txt
- Neue KI schlägt vorherige KI-Version statistisch signifikant oder zeigt klar definierte Verbesserungen.
- Keine Regression in Pflichtszenarien.
- Mindestens 1.000 KI-vs-KI-Partien ohne Crash oder illegale Aktion.
- Wiederkehrende Exploits werden als Tests fixiert.
- DecisionDebug erklärt alle kritischen Entscheidungen.
```

### Release 0.9 – Kartenpool, AI-Hints und Archetypen

KI-Ziel:

```txt
KI skaliert über Demo-Decks hinaus.
```

Harte Voraussetzungen:

```txt
- Kartenmanifest,
- CardImplementation-Tests,
- AI-Hints pro Karte,
- MechanicSupport-Matrix,
- ArchetypeTags,
- Deck-Archetyp-Erkennung oder Konfiguration.
```

0.9-Gates:

```txt
- Neue Karte darf nur AI-supported werden, wenn AI-Hints vorhanden sind.
- KI darf nicht auf konkrete Demo-Kartennamen angewiesen sein.
- Deck-Archetyp wird erkannt oder konfiguriert.
- Beide Seiten bestehen Kernbenchmarks mit erweitertem Kartenpool.
- KI kann neue Karten wenigstens solide nutzen, auch wenn Spezialstrategie später folgt.
```

### Release 1.0 – Strong AI Opponent

KI-Ziel:

```txt
Starker, fairer, reproduzierbarer Gegner für Corp und Runner.
```

Pflichtumfang:

```txt
- CorpAI Level 5+,
- RunnerAI Level 5+,
- Belief State,
- planbasierte Zugsequenzen,
- Gegenzug-Simulation,
- KI-vs-KI-Benchmarks,
- Replay-Auswertung,
- DecisionDebug,
- Difficulty Profiles,
- keine Hidden-Info-Vorteile.
```

1.0-Gates:

```txt
- Keine illegale KI-Aktion in großer Testserie.
- Keine Hidden-Info-Leaks.
- Beide Seiten bestehen alle Pflichtszenarien.
- Competitive schlägt Advanced messbar.
- Advanced schlägt Normal messbar.
- Normal schlägt Basic messbar.
- KI-vs-KI läuft stabil über mindestens 5.000 Partien oder äquivalente Testläufe.
- Wiederkehrende Exploits sind dokumentiert oder als Tests gefixt.
- Menschliche Testspieler können nicht zuverlässig denselben simplen Exploit wiederholen.
- KI-Entscheidungen sind über Debug-Daten nachvollziehbar.
```

---

## 6. Abhängigkeitsliste: Welche Mechaniken blockieren welche KI-Stufen?

Die KI-Entwicklung ist nicht unabhängig vom Vorhandensein der Mechaniken. Man braucht nicht alle NETGRID-Mechaniken vor der ersten KI, aber jede KI-Stufe hat harte Voraussetzungen.

### 6.1 LegalActions

Blockiert:

```txt
- alle KI-Stufen.
```

Ohne `LegalActions` kann die KI nicht sicher handeln. Sie würde sonst anfangen, Regeln selbst zu erzeugen.

Planungsvermerk:

```txt
AI darf erst aktiviert werden, wenn LegalActions für den aktuellen Timingpunkt vollständig aus der Engine kommen.
```

### 6.2 PlayerView und Visibility

Blockiert:

```txt
- faire KI,
- Human-vs-KI,
- Human-vs-Human,
- Belief State,
- Simulation ohne Cheating.
```

Planungsvermerk:

```txt
Jede KI-Stufe hat ein Visibility-Gate. Hard/Competitive AI darf keine zusätzlichen verdeckten Informationen erhalten.
```

### 6.3 EventLog, Replay und StateHash

Blockiert:

```txt
- Debugging,
- KI-vs-KI-Auswertung,
- Belief State,
- Selfplay,
- Regressionstests,
- API-gestützte Analyse.
```

Eine Basis-KI kann ohne vollständiges Replay existieren. Eine starke KI sollte nicht ohne Replay entwickelt werden.

Planungsvermerk:

```txt
Ab AI-Level 3 muss jede KI-Entscheidung mit DecisionDebug und Replay reproduzierbar sein.
```

### 6.4 ChoiceRequests und Timing-Fenster

Blockiert:

```txt
- ICE rezzen,
- paid abilities,
- Runner-Entscheidungen während Runs,
- Jack out,
- Break-Entscheidungen,
- Access-/Trash-Entscheidungen,
- spätere komplexe Karten.
```

Planungsvermerk:

```txt
Kompetente Runner-KI und kompetente Rez-Logik erfordern stabile ChoiceRequests und TimingPointIds.
```

### 6.5 Run-System

Blockiert:

```txt
- kompetente Corp-KI,
- kompetente Runner-KI,
- RunCostEstimator,
- ServerThreatEvaluator,
- RemoteContest-Logik,
- ICE/Breaker-Bewertung.
```

Planungsvermerk:

```txt
Planbasierte Runner-KI darf erst als Kompetenzziel gelten, wenn Runs, Encounter, ICE, Subroutinen, Breach und Access für den unterstützten Kartenpool stabil sind.
```

### 6.6 ICE, Subroutinen und Breaker

Blockiert:

```txt
- Run-Kostenberechnung,
- Rez-Entscheidung,
- Remote-Sicherheit,
- Scoring-Window-Erkennung,
- Runner-Rig-Bewertung.
```

Planungsvermerk:

```txt
Jedes KI-unterstützte ICE braucht maschinenlesbare AI-Hints: Typ, Rez-Kosten, Stopp-/Tax-Wert, Bedrohungswert, relevante Breaker-Beziehung.
```

### 6.7 Agenda install / advance / score

Blockiert:

```txt
- Corp-KI,
- Scoring-Window-Logik,
- AgendaRiskEvaluator,
- Remote-Planung.
```

Planungsvermerk:

```txt
CorpAI Level 2+ erfordert vollständige Agenda-Score- und Advancement-Regeln für den unterstützten Kartenpool.
```

### 6.8 Access, Steal, Trash

Blockiert:

```txt
- Runner-KI,
- Corp-Risikoanalyse,
- ServerValue,
- RemoteContest,
- Asset-Bewertung.
```

Planungsvermerk:

```txt
RunnerAI Level 2+ und CorpAI Remote-Risk benötigen stabile Access-, Steal- und Trash-Mechaniken.
```

### 6.9 Economy

Blockiert:

```txt
- alle kompetenten KI-Stufen.
```

Credits sind in NETGRID nicht nur Ressource, sondern Entscheidungsgrundlage.

Planungsvermerk:

```txt
Ab AI-Level 2 brauchen beide Seiten EconomyEvaluator und CreditReserveEvaluator.
```

### 6.10 Kartenmanifest und AI-Hints

Blockiert:

```txt
- Kartenpool-Erweiterung,
- Archetypen,
- starke KI über Demo-Decks hinaus.
```

Planungsvermerk:

```txt
Keine neue Karte wird für AI-supported Play freigegeben, wenn Mechaniktests und AI-Hints fehlen.
```

### 6.11 Deckbau und Archetypen

Blockiert nicht:

```txt
- erste KI,
- Demo-KI,
- planbasierte KI für feste Decks.
```

Blockiert aber:

```txt
- starke KI für verschiedene Decks,
- Formatunterstützung,
- selbstständige Archetyp-Anpassung.
```

Planungsvermerk:

```txt
Deckbau ist keine Voraussetzung für frühe KI, aber Voraussetzung für archetypfähige starke KI.
```

### 6.12 Tags, Trace, Damage, Viren, Hosting, Prevention, Replacement Effects, Multiaccess

Blockieren nicht:

```txt
- frühe Demo-KI,
- CorpAI Basic,
- RunnerAI Basic,
- planbasierte KI für Kartenpool ohne diese Effekte.
```

Blockieren aber:

```txt
- KI-Unterstützung für Karten, die diese Mechaniken nutzen,
- kompetitive KI für breiteren Kartenpool.
```

Planungsvermerk:

```txt
Spezialmechaniken werden nur dann KI-relevant, wenn AI-supported Karten sie verwenden. Dann sind Mechanik, Tests, AI-Hints und Szenarien Pflicht.
```

---

## 7. MechanicSupport-Matrix

Codex soll eine MechanicSupport-Matrix als Planungsartefakt einführen oder ein vorhandenes Format ergänzen.

Beispiel:

| Mechanik | Engine | Tests | AI-Hints | CorpAI | RunnerAI | Simulation | Status/Notiz |
|---|---|---|---|---|---|---|---|
| Credits | ja | ja | ja | ja | ja | ja | Basis |
| Draw | ja | ja | ja | ja | ja | ja | Basis |
| Install | ja | ja | ja | ja | ja | ja | Basis |
| Agenda score/steal | ja | ja | ja | ja | ja | ja | Basis |
| Basic Run | ja | ja | ja | ja | ja | ja | Basis |
| ICE rez | ja | ja | ja | ja | teilweise | ja | Basis |
| Break subroutines | ja | ja | ja | ja | ja | ja | Basis |
| Trash asset | prüfen | prüfen | prüfen | prüfen | prüfen | prüfen | abhängig vom Demo-Pool |
| Tags | nein/später | nein/später | nein/später | nein/später | nein/später | nein/später | Spezialmechanik |
| Trace | nein/später | nein/später | nein/später | nein/später | nein/später | nein/später | Spezialmechanik |
| Damage | nein/später | nein/später | nein/später | nein/später | nein/später | nein/später | Spezialmechanik |
| Multiaccess | später | später | später | später | später | später | später |
| Prevention/Replacement | später | später | später | später | später | später | später |

Regel:

```txt
AI darf eine Mechanik nur strategisch bewerten, wenn sie in dieser Matrix als AI-supported markiert ist.
```

---

## 8. Kartenfreigabe für KI

Für jede neue Karte soll es vier Freigabestufen geben.

```txt
1. Card listed
   Karte ist bekannt, aber nicht spielbar.

2. Engine-supported
   Karte hat Regelimplementierung und Tests.

3. Human-playable
   Karte funktioniert in menschlichen Partien.

4. AI-supported
   Karte hat AI-Hints, Szenario-Tests und wird von CorpAI/RunnerAI sinnvoll bewertet.
```

Eine Karte darf erst in KI-Decks auftauchen, wenn sie `AI-supported` ist.

### 8.1 AI-Hints-Schema

Empfohlenes Schema:

```ts
type CardAiHints = {
  roles: AiCardRole[]
  economyValue?: number
  agendaValue?: number
  defensiveValue?: number
  runPressureValue?: number
  preferredServers?: ServerKind[]
  rezPriority?: "low" | "medium" | "high"
  trashPriority?: "low" | "medium" | "high"
  bluffProfile?: "none" | "asset" | "agenda_like" | "trap"
  requiredMechanics: MechanicId[]
  archetypeTags?: string[]
}
```

Beispiele für Corp-Rollen:

```txt
agenda
economy_operation
economy_asset
end_the_run_ice
tax_ice
punishing_ice
scoring_remote_card
bait_asset
upgrade_defense
```

Beispiele für Runner-Rollen:

```txt
economy
breaker_fracter
breaker_decoder
breaker_killer
run_event
draw
multiaccess
expose
trash_support
remote_contest
```

Regel:

```txt
Wenn requiredMechanics nicht vollständig AI-supported sind, darf die Karte nicht in AI-supported Decks verwendet werden.
```

---

## 9. Zielarchitektur für spätere KI

Die KI-Architektur soll von Anfang an modular genug geplant werden, auch wenn nicht alle Module sofort implementiert werden.

```txt
src/
  ai/
    common/
      AiController.ts
      AiInput.ts
      AiDecision.ts
      AiDecisionDebug.ts
      AiMemory.ts
      AiConfig.ts
      AiRng.ts
      FeatureExtractor.ts
      Plan.ts
      PlanGenerator.ts
      PlanEvaluator.ts
      Simulation.ts
      BeliefState.ts
      OpponentModel.ts

    corp/
      CorpAiController.ts
      CorpFeatureExtractor.ts
      CorpAgendaEvaluator.ts
      CorpServerEvaluator.ts
      CorpEconomyEvaluator.ts
      CorpIceEvaluator.ts
      CorpRezEvaluator.ts
      CorpScoringWindowEvaluator.ts
      CorpRunnerModel.ts
      CorpPlanGenerator.ts
      CorpPlanEvaluator.ts

    runner/
      RunnerAiController.ts
      RunnerFeatureExtractor.ts
      RunnerRigEvaluator.ts
      RunnerRunCostEstimator.ts
      RunnerServerValueEvaluator.ts
      RunnerCorpModel.ts
      RunnerRemoteThreatEvaluator.ts
      RunnerPlanGenerator.ts
      RunnerPlanEvaluator.ts

    testing/
      AiScenario.ts
      AiScenarioRunner.ts
      AiBenchmarkRunner.ts
      AiLeague.ts
      AiRegressionReport.ts
```

Gemeinsamer Input:

```ts
type AiDecisionInput = {
  side: "corp" | "runner"
  playerView: PlayerView
  legalActions: LegalAction[]
  publicEventLog: PublicGameEvent[]
  sideMemory: AiMemory
  difficulty: AiDifficulty
  seed: string
  timeBudgetMs: number
}
```

Gemeinsame Entscheidung:

```ts
type AiDecision = {
  actionId: string
  selectedTargets?: Record<string, string>
  selectedChoices?: Record<string, unknown>
  confidence: number
  debug: AiDecisionDebug
}
```

Die KI gibt nie eine freie Regelhandlung zurück. Sie gibt eine Auswahl aus vorhandenen LegalActions zurück.

---

## 10. Planbasierte Entscheidungslogik

Die spätere starke KI soll nicht primär aus `if/else`-Regeln bestehen. Sie soll Pläne generieren und bewerten.

Pipeline:

```txt
1. Spielzustand aus erlaubter Sicht lesen.
2. Features extrahieren.
3. Risiken berechnen.
4. Mehrere Pläne erzeugen.
5. Pläne über den Zug simulieren.
6. plausible Gegenzüge bewerten.
7. besten Plan wählen.
8. nächste LegalAction auswählen.
9. nach jeder Transition Plan revalidieren.
```

Nicht:

```txt
if scoreable agenda → score
else if low credits → credit
else if ...
```

Sondern:

```txt
Plan A: Score next turn
Plan B: Protect R&D
Plan C: Recover economy
Plan D: Bait Runner

Bewerte alle.
Wähle besten Plan.
Führe nächsten legalen Schritt aus.
```

---

## 11. Corp-KI: spätere Kompetenzmodule

Die kompetente Corp-KI braucht folgende Module.

### 11.1 AgendaRiskEvaluator

Bewertet:

```txt
- Agendas in HQ,
- Agendas in Remote,
- scorebare Agendas,
- Gefahr durch HQ-Runs,
- Gefahr durch Remote-Contest,
- Wahrscheinlichkeit, dass weiteres Halten riskanter ist als Installieren.
```

### 11.2 ServerThreatEvaluator

Bewertet:

```txt
- HQ-Schutz,
- R&D-Schutz,
- Archives-Relevanz,
- Remote-Sicherheit,
- Runner-Zugriffskosten,
- wiederholten Runner-Druck.
```

### 11.3 EconomyReserveEvaluator

Bewertet:

```txt
- Mindestreserve für ICE-Rez,
- geplante Advance-Kosten,
- Safety Buffer,
- Kosten künftiger Pläne,
- Gefahr von Overcommitment.
```

### 11.4 IceRezEvaluator

Bewertet während Runs:

```txt
- Serverwert,
- ICE-Kosten,
- Wahrscheinlichkeit, dass ICE den Run stoppt,
- Tax-Wert,
- künftiger Scoring-Wert der Credits,
- ob Rez auf niedrigwertigem Server verschwendet wäre.
```

### 11.5 ScoringWindowEvaluator

Bewertet:

```txt
- ob Runner zu arm ist,
- ob passende Breaker fehlen,
- ob Remote ausreichend geschützt ist,
- ob Agenda in einem oder zwei Zügen gescored werden kann,
- ob HQ-Halten riskanter ist als Pushen.
```

### 11.6 RemoteIntentMemory

Merkt für Corp:

```txt
- Remote ist Scoring Remote,
- Remote ist Economy Remote,
- Remote ist Bait,
- Runner reagiert aggressiv oder passiv auf Remote-Installationen.
```

---

## 12. Corp-Szenario-Gates

Diese Szenarien sollen in die Testplanung aufgenommen werden.

```txt
Corp-01:
Agenda ist scorebar.
Erwartung: Corp scored.

Corp-02:
HQ enthält zwei Agendas, HQ ist offen.
Erwartung: Corp priorisiert HQ-Schutz oder reduziert HQ-Risiko.

Corp-03:
R&D ist offen, Runner hat wiederholt R&D angegriffen.
Erwartung: Corp schützt R&D.

Corp-04:
Runner ist arm, Remote ist geschützt, Agenda in HQ.
Erwartung: Corp erkennt Scoring Window.

Corp-05:
Runner ist reich und hat passende Breaker.
Erwartung: Corp installiert Agenda nicht leichtfertig in Remote.

Corp-06:
Runner läuft auf leeres Archives, ICE ist teuer.
Erwartung: Corp rezzed nicht.

Corp-07:
Runner läuft auf Remote mit Agenda, Rez ist bezahlbar.
Erwartung: Corp rezzed schützendes ICE.

Corp-08:
Corp hat wenig Credits.
Erwartung: Corp nimmt Economy statt Board zu überbauen.

Corp-09:
Asset-Economy ist verfügbar.
Erwartung: Corp nutzt Asset, wenn es strategisch sinnvoll ist.

Corp-10:
Runner greift jede Remote an.
Erwartung: Corp nutzt Bait-/Asset-Linien häufiger.
```

---

## 13. Runner-KI: spätere Kompetenzmodule

Die Runner-KI ist stärker von stabilen Run-, ICE- und Breaker-Mechaniken abhängig als die frühe Corp-KI. Sie sollte deshalb nach der kompetenten Corp-KI ausgebaut werden.

### 13.1 RunnerRigEvaluator

Bewertet:

```txt
- installierte Breaker,
- verfügbare Credits,
- Memory,
- Fähigkeit gegen bekannte ICE-Typen,
- fehlende Tools gegen Server.
```

### 13.2 RunCostEstimator

Bewertet:

```txt
- Kosten zum Erreichen eines Servers,
- bekannte ICE,
- unrezzed ICE-Risiko,
- Pump-/Break-Kosten,
- erwartete zukünftige Tax.
```

### 13.3 ServerAccessValueEvaluator

Bewertet:

```txt
- R&D-Wert,
- HQ-Wert,
- Remote-Wert,
- Archives-Wert,
- Agenda-Wahrscheinlichkeit,
- Trash-Wert von Assets/Upgrades.
```

### 13.4 RemoteThreatEvaluator

Bewertet:

```txt
- advanced Remote-Karten,
- mögliche Corp-Score-Linie,
- Install-Advance-Advance-Muster,
- Corp-Credit-Reserve,
- Remote-Schutz.
```

### 13.5 CorpScoringThreatEvaluator

Bewertet:

```txt
- Corp-Agenda-Punkte,
- mögliche Agenda im Remote,
- Zahl der Advancement Tokens,
- nächstes Corp-Scoring-Potenzial,
- Dringlichkeit eines Remote-Runs.
```

---

## 14. Runner-Szenario-Gates

Diese Szenarien sollen in die Testplanung aufgenommen werden.

```txt
Runner-01:
R&D ist offen.
Erwartung: Runner läuft R&D, wenn keine bessere Pflicht besteht.

Runner-02:
HQ hat viele Karten, Corp zieht/behält viel.
Erwartung: Runner bewertet HQ-Druck höher.

Runner-03:
Remote hat advanced Karte, Corp könnte nächste Runde scoren.
Erwartung: Runner contestet Remote, wenn realistisch bezahlbar.

Runner-04:
Runner hat passenden Breaker auf Hand und genug Credits.
Erwartung: Runner installiert Breaker vor relevantem Run.

Runner-05:
Runner hat zu wenig Credits gegen bekanntes ICE.
Erwartung: Runner baut Economy statt sinnlos zu laufen.

Runner-06:
Corp installiert Economy Asset offen zugänglich.
Erwartung: Runner trash Asset, wenn Kosten/Nutzen passt.

Runner-07:
Unbekanntes ICE, Runner hat keine Absicherung und wenig Credits.
Erwartung: Runner macht keinen unnötig ruinösen Run.

Runner-08:
Corp ist bei 5 Agenda-Punkten.
Erwartung: Runner erhöht Remote- und R&D-Druck.

Runner-09:
Runner hat starkes Rig und viele Credits.
Erwartung: Runner nutzt Tempo, statt nur weiter aufzubauen.

Runner-10:
Runner kann Agenda sicher stehlen.
Erwartung: Runner nimmt die Agenda-Linie.
```

---

## 15. DecisionDebug

Starke KI ist ohne Debug-Daten kaum entwickelbar. Jede relevante KI-Entscheidung soll eine strukturierte Debug-Ausgabe erzeugen.

Empfohlenes Schema:

```ts
type AiDecisionDebug = {
  aiLevel: number
  selectedPlan?: string
  selectedActionId: string
  confidence: number
  planScores?: Array<{
    plan: string
    score: number
    reasons: string[]
  }>
  actionScores?: Array<{
    actionId: string
    score: number
    reasons: string[]
  }>
  riskSummary?: {
    hqRisk?: number
    rndRisk?: number
    archivesRisk?: number
    remoteRisk?: number
    creditRisk?: number
    runRisk?: number
  }
  visibilitySource: "playerViewOnly"
  usedFallback: boolean
  seed: string
}
```

Debug-Ausgaben dürfen keine verbotenen Informationen enthalten, wenn sie aus Spielerperspektive sichtbar sind. Vollständige interne Debug-Dumps dürfen nur in sicheren Entwicklerkontexten existieren.

---

## 16. Schwierigkeitsgrade

Die UI-Schwierigkeitsgrade sollten später aus den technischen KI-Leveln abgeleitet werden.

```txt
Beginner:
- einfache Heuristik,
- höhere Zufallskomponente,
- weniger Planung,
- keine harte Bestrafung.

Normal:
- bewertungsbasierte KI,
- solide Grundstrategie,
- kaum Simulation.

Advanced:
- planbasierte KI,
- Gegner-Modell,
- gute Risikoabschätzung.

Competitive:
- Simulation,
- Belief State,
- optimierte Gewichte,
- geringer Zufall,
- keine absichtlichen Fehler,
- keine zusätzlichen Hidden Informationen.
```

Wichtig:

```txt
Schwierigkeit verändert nie die Sichtbarkeit. Sie verändert nur Bewertungsqualität, Planungstiefe, Zufall und Zeitbudget.
```

---

## 17. Rolle einer API-KI

Eine API-KI kann eingeplant werden, aber nicht als primärer Spielzug-Controller.

Sinnvolle Rollen:

```txt
- Replay Analyzer,
- Decision Explainer,
- Test Case Generator,
- Balance Report Generator,
- Coach-Modus nach der Partie.
```

Nicht als Kern verwenden für:

```txt
- Live-Entscheidung jedes Klicks,
- Regelprüfung,
- Hidden-State-Interpretation,
- Ersatz für LegalActions,
- direkte Ausführung von Kartentexten.
```

Empfohlener Einbau ab 0.8:

```txt
Replay + DecisionDebug → API-Analyse → Vorschläge für neue Szenario-Tests und Gewichtungsanpassungen.
```

Die lokale KI bleibt der Spielentscheider. Die API-KI ist Analyse- und Entwicklungswerkzeug.

---

## 18. Tests und Release-Gates

### 18.1 Korrektheits-Gates

```txt
- 0 illegale Aktionen,
- 0 Hidden-Info-Leaks,
- 0 nicht deterministische Replay-Abweichungen bei gleichem Seed,
- 0 Endlosschleifen,
- Timeout-Fallback vorhanden,
- applyAction validiert jede KI-Aktion erneut.
```

### 18.2 Kompetenz-Gates

```txt
- alle Corp-Pflichtszenarien bestehen,
- alle Runner-Pflichtszenarien bestehen,
- jede neue Karte bekommt AI-Hints oder bleibt nicht KI-playable,
- jede neue KI-Version schlägt definierte schwächere Baselines oder verbessert definierte Szenario-Metriken.
```

### 18.3 Stabilitäts-Gates

```txt
- 100 KI-Testzüge ab MVP 0.1,
- 100 KI-vs-KI-Smoke-Partien oder äquivalente Läufe ab 0.3,
- 500 KI-vs-KI-Läufe ab 0.4,
- 1.000 KI-vs-KI-Läufe ab 0.8,
- 5.000 KI-vs-KI-Läufe vor Strong-AI-Release,
- keine Hänger in Run-, Encounter-, Access-, Rez- oder Trash-Fenstern,
- DecisionDebug für jede Entscheidung.
```

Die Zahlen können an Laufzeit und Testumgebung angepasst werden, sollten aber als Qualitätsziel erhalten bleiben.

### 18.4 Fairness-Gates

```txt
- Hard/Competitive erhält keine zusätzliche Hidden Information,
- Belief State ist aus Replay/PlayerView rekonstruierbar,
- Simulation nutzt hypothetische Welten, nicht echten unbekannten State.
```

### 18.5 Exploit-Gates

```txt
- bekannte Exploits werden als Szenario-Test fixiert,
- alte Regressionen bleiben im Benchmark,
- menschliche Testspieler dokumentieren wiederholbare Schwächen,
- jede wiederholbare Schwäche wird entweder behoben oder bewusst akzeptiert und markiert.
```

---

## 19. Konkrete Änderung an der vorhandenen Releaseplanung

Codex soll die Planung so einarbeiten, dass bestehende Dokumente nicht widersprüchlich werden.

### 19.1 In MVP 0.1 ergänzen oder prüfen

MVP 0.1 soll weiterhin lauten:

```txt
Human Runner vs einfache Corp-KI.
```

Ergänzung:

```txt
Die MVP-0.1-KI ist AI-Level 0/1. Sie ist bewusst nicht stark. Sie ist der LegalAction-only-, PlayerView-only-, Timeout-, Fallback- und Determinismus-Test für spätere KI-Stufen.
```

Falls noch nicht vorhanden, Planung für:

```txt
- AiDecisionDebug minimal,
- KI-Level-Klassifikation,
- AIInput-Visibility-Test,
- Fallback-Test,
- Seed-/Determinismus-Test.
```

### 19.2 In MVP 0.2 ergänzen oder prüfen

MVP 0.2 soll weiterhin keine starke KI bauen.

Ergänzung:

```txt
MVP 0.2 ist AI-readiness durch Multiplayer-Infrastruktur: Controller-Abstraktion, PlayerView-Härtung, serverautoritative Action-Pipeline, EventLog, StateHash, Reconnect und Replay. Diese Grundlagen sind harte Voraussetzungen für spätere KI-Level 3 bis 6.
```

### 19.3 Nach 0.2 Roadmap differenzieren

Die bisherige grobe Aussage „0.3 beide Seiten gegen KI spielbar“ sollte differenziert werden:

```txt
0.3 AI Foundation / AI Lab
0.4 Competent Corp AI
0.5 Competent Runner AI
0.6 Belief State und Gegner-Modell
0.7 Simulation AI
0.8 Selfplay und Benchmarking
0.9 Kartenpool, AI-Hints und Archetypen
1.0 Strong AI Opponent
```

Falls die Releaseplanung bewusst weniger Versionen nutzen soll, kann Codex diese Punkte als Arbeitspakete innerhalb größerer Versionen gruppieren. Wichtig ist die Reihenfolge und die Abhängigkeitslogik, nicht die exakte Versionsnummer.

---

## 20. Codex-Vorgehensweise

Codex soll strukturiert und konservativ vorgehen.

### Phase A: Audit

```txt
- Bestehende KI-Dateien finden.
- Bestehende Planungstexte finden.
- Bestehende Tests finden.
- Aktuellen KI-Stand gegen AI-Level 0/1/2 klassifizieren.
- Keine KI-Logik ändern, außer wenn ein offensichtlicher Dokumentationsfehler sichtbar wird.
```

### Phase B: Planungsdokument aktualisieren

```txt
- neues oder vorhandenes docs/ai/AI_RELEASE_ROADMAP.md ergänzen,
- MVP-0.1-Plan mit Level-0/1-Einordnung ergänzen,
- MVP-0.2-Plan mit AI-readiness-Hinweis ergänzen,
- spätere Releases mit AI-Leveln, Mechanic-Gates und Akzeptanzkriterien ergänzen,
- MechanicSupport-Matrix als Planungstabelle einführen.
```

### Phase C: Optional minimale Schemas vorbereiten

Nur falls im Repo-Stil passend und nicht zu groß:

```txt
- AiDecisionDebug-Typ ergänzen,
- AiLevel-Konstante oder Dokumentationsenum ergänzen,
- CardAiHints-Schema als Planung oder Typ vorbereiten,
- keine große Implementierung starker KI.
```

### Phase D: Tests nur dort ergänzen, wo sie zur vorhandenen KI passen

Für bestehende einfache KI sinnvoll:

```txt
- selects action from LegalActions,
- does not receive hidden information,
- deterministic fallback,
- scoreable agenda scenario,
- no timeout/hang.
```

Nicht sofort implementieren:

```txt
- volle Runner-KI,
- Belief State,
- Simulation,
- Selfplay-Tuning,
- API-KI.
```

---

## 21. Akzeptanzkriterien für diesen Codex-Auftrag

Dieser Auftrag ist abgeschlossen, wenn:

```txt
1. Die bestehende einfache KI im Repo identifiziert und gegen AI-Level eingeordnet ist.
2. Die Releaseplanung enthält eine klare KI-Roadmap von Level 0 bis Strong AI.
3. MVP 0.1 bleibt einfache Corp-KI und wird nicht zu stark erweitert.
4. MVP 0.2 bleibt Human-vs-Human und wird nur als AI-readiness ergänzt.
5. Spätere KI-Stufen enthalten klare Abhängigkeiten zu Mechaniken, Engine-Funktionen und Tests.
6. Eine MechanicSupport-Matrix oder deren Planungsabschnitt ist vorhanden.
7. Card AI-Hints und AI-supported-Freigabe sind als spätere Pflicht dokumentiert.
8. Corp- und Runner-Szenario-Gates sind dokumentiert.
9. Simulation und Selfplay sind erst nach Engine-/Replay-/Belief-Voraussetzungen eingeordnet.
10. API-KI ist als Analyse-/Coach-/Testgenerator eingeordnet, nicht als primärer Live-Spielentscheider.
```

---

## 22. Kernformulierung für die Releaseplanung

Diese Passage kann nahezu direkt in die Planung übernommen werden:

```txt
Die KI-Entwicklung wird als eigene Release-Spur geführt. Frühe KI-Stufen dienen nicht primär der Spielstärke, sondern der Sicherheit: LegalAction-only, PlayerView-only, deterministischer Fallback, Timeout, Replaybarkeit und Hidden-Info-Schutz. Eine starke KI wird erst nach stabiler Engine-, Run-, Access-, ICE-/Breaker-, EventLog- und Replay-Basis entwickelt.

Die KI-Stärke gilt immer nur für eine definierte Rules-/Mechanics-Baseline und einen AI-supported Kartenpool. Karten mit nicht unterstützten Mechaniken dürfen nicht in KI-unterstützten Decks verwendet werden. Neue Karten benötigen Regeltests, AI-Hints und Szenario-Gates, bevor sie AI-supported sind.

Die spätere starke KI entsteht stufenweise: zuerst einfache Corp-KI, dann AI Foundation, dann planbasierte Corp-KI, danach planbasierte Runner-KI, danach Belief State und Gegner-Modell, danach simulationsgestützte Planbewertung, danach Selfplay, Benchmarking und Exploit-Regressionen. Hard- oder Competitive-KI erhält niemals zusätzliche verdeckte Informationen. Höhere Schwierigkeit entsteht ausschließlich durch bessere Bewertung, Planung, Simulation, Tuning und geringeren Zufallsanteil.
```

---

## 23. Wichtigste Reihenfolge

Die Reihenfolge sollte nicht verändert werden, außer es gibt einen klaren technischen Grund.

```txt
1. LegalAction-/PlayerView-Sicherheit
2. Replay und DecisionDebug
3. einfache Corp-KI
4. Multiplayer- und Controller-Stabilität
5. AI Lab und Szenario-Benchmarks
6. einfache Runner-KI
7. planbasierte Corp-KI
8. planbasierte Runner-KI
9. KI-vs-KI-Testmodus
10. Belief State
11. Gegner-Modell
12. Simulation
13. Selfplay und Tuning
14. Kartenpool- und Archetyp-Ausbau
15. Strong AI Release
```

Begründung:

```txt
Eine intelligente KI ohne Debugging, Replays und Benchmarks ist kaum korrigierbar. Eine simulationsgestützte KI ohne stabile Engine vervielfacht Fehler. Ein Gegner-Modell ohne saubere Event- und PlayerView-Historie kann leicht cheaten. Ein großer Kartenpool ohne AI-Hints führt zu Hardcoding.
```

---

## 24. Abschließende Leitentscheidung

Nicht als einzelnes Feature planen:

```txt
KI stärker machen.
```

Sondern als Pipeline:

```txt
LegalAction-only
PlayerView-only
DecisionDebug
Szenario-Tests
Planbewertung
Belief State
Simulation
KI-vs-KI-Benchmarks
Replay-Analyse
AI-Hints pro Karte
```

Wenn diese Pipeline verpflichtend wird, entsteht der starke KI-Gegner nicht zufällig, sondern als Ergebnis der Releasefolge.

