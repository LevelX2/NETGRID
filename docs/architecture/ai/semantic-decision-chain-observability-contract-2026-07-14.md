# Semantic Decision Chain Observability

Stand: 2026-07-14

## Ziel

Die produktive Semantic Runtime legt für jede Entscheidung offen, welche
Engine-`LegalActions` vorhanden waren, welche Actions semantisch ausgeschlossen
wurden, welche Action den höchsten Rohscore besaß, welchen Pfad TacticalPlan und
PlanPortfolio vorgaben und welche Auswahlregel schließlich die ausgeführte
Action bestimmte.

Die Observability ist verhaltensneutral. Sie verändert keine LegalAction,
Scoringkomponente, Planpriorität, Override-Schwelle, Choice-Auswahl oder
Runtime-Memory.

## Produktiver Entscheidungsweg

Der verbindliche Ablauf lautet:

1. Die Engine liefert `PlayerView`, erlaubte `PublicEvents` und `LegalActions`.
2. Die KI projiziert Action-Semantik, Scope, Kosten, Ziele und Ausschlüsse.
3. Alle LegalActions erhalten ihren bisherigen additiven Semantic Score.
4. TacticalGoals, TacticalPlans und PlanPortfolio werden wie bisher bewertet.
5. `tacticalPlanMappedChoice` entscheidet unverändert zwischen Plan-Mapping und
   einem möglichen Semantic-Score-Override.
6. Die initiale Action wird in dieser festen Reihenfolge gewählt:
   `runner_run_plan`, `inevitable_corp_deckout`, `reactive_choice`,
   `self_damage_immediate_win`, `opponent_matchpoint_contest`,
   `tactical_plan_mapping` beziehungsweise `tactical_plan_override`, danach
   `semantic_score`.
7. Wenn kein Kandidat existiert, greift ausschließlich der bestehende
   fail-closed `semantic_coverage_fallback`.
8. Die bestehende Runner-Run-Only-Anpassung darf die initiale Auswahl
   anschließend korrigieren.
9. `selectedChoicesForDecision` wählt weiterhin getrennt Choice-, Karten- und
   Bid-Optionen.
10. TacticalPlan-, RunnerRunPlan- und StrategicIntent-Memory werden unverändert
    persistiert.

## Debugvertrag

`AiDecisionDebug.decisionChain` verwendet
`ai-decision-chain-debug-v1` und enthält nur side-sichere Daten, die bereits aus
dem aktuellen AI-Input beziehungsweise den aktuellen LegalActions ableitbar
sind:

- Anzahl und IDs vorhandener LegalActions;
- Action-ID und Schlüssel semantischer Ausschlüsse;
- Rohscore-Sieger und dessen Score;
- ausgewählter TacticalPlan und gemappte LegalActions;
- Plan-vs.-Score-Ausgang, Override-Grund, Scoreabstand und Schwelle;
- vorhandene Kandidaten der festen Auswahlreihenfolge;
- initiale Auswahlroute;
- eine mögliche Runner-Run-Only-Anpassung;
- finale Action und side-sichere Choice-Zusammenfassung.

PlanPortfolio-Beiträge werden weiterhin nur diagnostisch berechnet. Der Trace
kennzeichnet dies ausdrücklich als `contributionMode: diagnostic_only`; daraus
darf keine produktive Auswahlwirkung abgeleitet werden.

Der strukturierte Trace wird zusätzlich als Detailsektion
`semantic_decision_chain` ausgegeben. Shared-Sanitizing und Replay-Allowlist
behandeln ihn wie den übrigen `AiDecisionDebug`.

## Persistenz im bestehenden KI-Trace

Die dauerhafte Analyseablage verwendet ausschließlich den bestehenden
SQLite-Pfad `ai_decision_traces.trace_json`. Es gibt keine zweite Tabelle,
Datei oder parallele Logablage für die Entscheidungskette.

- `aiTraceMode: off` erzeugt wie bisher keinen AI-Trace-Datensatz.
- `aiTraceMode: summary` schreibt unter `trace_json.decisionChain` eine
  kompakte Kette mit `traceLevel: summary`. Sie enthält insbesondere
  Rohscore-Sieger, Plan-Mapping und Arbitration, Prioritätskandidaten,
  initiale Auswahlroute, Anpassungen und finale Auswahl. Umfangreiche
  LegalAction-, Ausschluss- und Choice-ID-Listen werden durch Anzahlen ersetzt
  oder ausgelassen.
- `aiTraceMode: detailed` schreibt unter demselben Schlüssel die vollständige
  sanitizierte `AiDecisionChainDebug` mit `traceLevel: detailed`, einschließlich
  LegalAction-IDs, Ausschlüssen, Prioritätskandidaten und ausgewählten
  Choice-Optionen.

Das Root-Feld `traceMode` macht die Persistenzstufe je Datensatz explizit.
Beide Stufen bleiben side-sicher; verbotene Hidden-Info-Felder werden vor der
Serialisierung durch `sanitizeAiDecisionDebug` entfernt oder redigiert.
Bestehende Match- und Trace-Datensätze werden in der Version-0-Umgebung nicht
nachträglich aufgefüllt.

## Verhaltensneutralität

Für identischen Decision-Checkpoint müssen vor und nach einer reinen
Observability- oder Strukturänderung identisch bleiben:

- `actionId` und die referenzierte Engine-LegalAction;
- `selectedChoices`;
- `fallbackUsed`;
- TacticalPlan-, PlanPortfolio-, RunnerRunPlan- und StrategicIntent-Memory;
- bei Anwendung der Action Replay und StateHash.

Zusätzliche Debugfelder und Detailsektionen sind zulässig, sofern sie
deterministisch, side-sicher und ohne Einfluss auf die Auswahl bleiben.

## Testvertrag

Spielgleiche Decision-Checkpoints bleiben das fachliche Regressionsgate.
`expectation.decisionChain` kann optional Auswahlroute, Rohscore-Sieger,
gemappte Planaction, Arbitration-Ausgang und erforderliche Anpassungen prüfen.

Dabei gelten zwei Klassen:

- `correctness`: fachlich akzeptierte Action und Begründung als dauerhafter
  Vertrag; dies ist der Default, wenn `contractKind` fehlt;
- `equivalence-only`: temporärer Nachweis, dass ein Strukturumbau das aktuelle
  Verhalten nicht verschiebt. Diese Klasse macht eine bekannte Fehlentscheidung
  nicht fachlich richtig.

Neue fachliche Fehler werden weiterhin zuerst als roter spielgleicher
Correctness-Checkpoint festgehalten und erst danach behoben.

## Nicht Teil dieses Vertrags

- Änderung oder Neuskalierung von Scores;
- Änderung der festen Auswahlreihenfolge;
- Änderung von Plan-Override-Schwellen oder absoluten Plancontrollern;
- produktive Aktivierung von PlanPortfolio-Beiträgen;
- Neuordnung der Corp- oder Runner-Bewertungsdomänen;
- ein zusätzlicher physischer Trace- oder Log-Speicherpfad;
- neue Engine-, Karten-, UI- oder Deckstrategie-Wirkung.
