# Prompt zur umfassenden Dokumentation der aktuellen NETGRID-KI-Logik

Status: Prompt-Artefakt
Aktiver Agent: card-enablement-ai-knowledge-agent
Stand: 2026-05-22
Ziel: Einen entsprechend starken KI-Assistenten dazu bringen, die aktuell bestehende NETGRID-KI-Logik vollständig, exakt, quellengebunden und prüfbar zu dokumentieren, ohne Code zu ändern.

## Verwendung

Kopiere den folgenden Prompt in einen neuen KI-Assistenzlauf mit Zugriff auf das Repository `C:\Projekte\NETGRID`.

```text
Du arbeitest im lokalen Repository `C:\Projekte\NETGRID`.

Aufgabe:
Erstelle eine umfassende, genaue und quellengebundene Dokumentation der aktuell bestehenden NETGRID-KI-Logik. Ziel ist nicht, die KI umzubauen, sondern ihren Ist-Zustand so vollständig zu dokumentieren, dass ein fachlich starker KI-/Architekturprüfer anschließend nachvollziehen kann:

- aus welchen Bestandteilen die KI besteht;
- wie die Bestandteile technisch und fachlich aufgeteilt sind;
- welche Eingaben die KI erhält und welche Daten sie ausdrücklich nicht erhalten darf;
- wie Corp- und Runner-Entscheidungen entstehen;
- wie Baseline-Heuristik, Planlogik, Belief State, Deck Doctrine, AI-Hints, Simulation, DecisionDebug und KI-Trace zusammenspielen;
- welche Sicherheits-, Hidden-Info-, Replay-, StateHash- und Redaction-Grenzen gelten;
- welche Test- und Evidence-Artefakte den aktuellen Stand absichern;
- welche bekannten Grenzen, Schwächen und offenen Prüffragen aus der Dokumentation erkennbar sind.

Arbeite wiki-first und repository-first. Nutze keine Webquellen.

Strikte Arbeitsgrenzen:

- Keine Codeänderungen.
- Keine Datenänderungen.
- Keine Kartenfreigabe, keine AI-Hint-Änderung, keine Gewichtsanpassung.
- Keine neue Architekturentscheidung als Fakt ausgeben.
- Keine verdeckten Informationen voraussetzen, simulieren oder aus FullState ableiten.
- Keine Bewertung auf Basis hypothetischer gewünschter Zielzustände, bevor der Ist-Zustand dokumentiert ist.
- Verbesserungsvorschläge dürfen erst nach der Ist-Dokumentation kommen und müssen klar als Vorschläge markiert sein.

Pflicht-Einstieg:

1. `AGENTS.md`
2. `AGENTS.local.md`, falls vorhanden
3. `KI-Wissen-NETGRID/00 Projektstart.md`
4. `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
5. `KI-Wissen-NETGRID/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md`
6. `KI-Wissen-NETGRID/00 Steuerung/Regeldatei KI-Wissenspflege.md`
7. `agents/card-enablement-ai-knowledge-agent.md`
8. `docs/codex/CODEX_STATUS.md`

Primäre Architektur- und Reviewquellen:

- `docs/architecture/ai/README.md`
- `docs/architecture/ai/ai-controller-spec.md`
- `docs/architecture/ai/ai-hints-structure-decision-2026-05-15.md`
- `docs/architecture/ai/ai-decision-trace-contract-2026-05-22.md`
- `docs/architecture/ai/ai-simulation-test-matrix.md`
- `docs/architecture/ai/coaching-boundary-spec-2026-05-17.md`
- `docs/reviews/ai/capability-deep-analysis-2026-05-17.md`
- `docs/reviews/ai/live-doctrine-input-path-audit-2026-05-17.md`
- `docs/reviews/ai/ai-hints-role-gap-report-2026-05-17.md`
- `docs/reviews/ai/match-progression-benchmark-2026-05-17.md`
- `docs/reviews/ai/discard-regression-review-2026-05-18.md`

Primäre Implementierungsquellen:

- `packages/ai/src/index.ts`
- `packages/ai/src/input-dto.ts`
- `packages/ai/src/corp-plans.ts`
- `packages/ai/src/runner-plans.ts`
- `packages/ai/src/belief-state.ts`
- `packages/ai/src/deck-doctrine.ts`
- `packages/ai/src/ai-hints.ts`
- `packages/ai/src/visible-run-analysis.ts`
- `packages/ai/src/index.test.ts`
- `packages/shared/src/index.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/storage-sqlite.ts`
- `apps/web/app/maintenance.ts`
- `apps/web/app/maintenance/page.tsx`
- `apps/web/app/maintenance/ai-traces/page.tsx`

Primäre Datenquellen:

- `data/ai/ai-card-hints-active.json`
- `data/ai/card-role-manifest-0.9.json`
- `data/ai/ai-profiles-0.9.json`
- `data/ai/corp-plan-profiles-1.4.0.json`
- `data/ai/runner-plan-profiles-1.4.1.json`
- `data/ai/deck-role-profiles-0.9.json`
- `data/ai/ai-benchmark-profiles-1.4.3.json`
- `data/ai/ai-soak-seeds-1.4.3.json`
- `data/ai/ai-selfplay-exploit-league-2026-05-17.json`
- `data/scenarios/ai-v143-exploit-regression-fixtures.json`
- `data/scenarios/ai-v09-soak-matrix.json`
- `data/scenarios/ai-deck-legal-*.json`, soweit vorhanden und relevant

Trace-/Wartungsquellen vom 2026-05-22:

- `docs/activities/done/act-2026-05-22-ai-decision-trace-contract.md`
- `docs/activities/done/act-2026-05-22-ai-decision-trace-schema-top-alternatives.md`
- `docs/activities/done/act-2026-05-22-ai-decision-trace-sqlite-api.md`
- `docs/activities/done/act-2026-05-22-ai-trace-action-level-alternatives.md`
- `docs/activities/done/act-2026-05-22-maintenance-ai-decision-viewer.md`
- `docs/activities/done/act-2026-05-22-maintenance-ai-trace-action-detail-view.md`
- `docs/activities/done/act-2026-05-22-ai-decision-live-follow-export-redaction.md`

Vorgehen:

1. Lies die Pflichtquellen und kläre daraus den verbindlichen Projekt- und Sicherheitsrahmen.
2. Erstelle eine Quellenmatrix: Quelle, Zweck, verwendete Aussagen, Aktualität, mögliche Konflikte.
3. Dokumentiere zuerst den Ist-Zustand. Trenne Fakten aus Code, Fakten aus Dokumentation, Annahmen, Lücken und offene Prüfpunkte.
4. Prüfe die wichtigsten Codepfade direkt, statt nur alte Reviews zu paraphrasieren.
5. Vergleiche den Stand von `docs/reviews/ai/capability-deep-analysis-2026-05-17.md` mit den seitdem erledigten Trace-/Wartungs- und AI-Fix-Artefakten vom 2026-05-18 bis 2026-05-22.
6. Belege jede wichtige Aussage mit Dateipfaden und, soweit möglich, Funktions-, Typ- oder Artefaktnamen.
7. Erstelle keine überlange Codeabschrift. Beschreibe Verhalten, Datenflüsse und Verträge präzise in eigenen Worten.

Pflichtstruktur der Dokumentation:

1. Kurzfassung
   - Was die NETGRID-KI aktuell ist.
   - Was sie ausdrücklich nicht ist.
   - Wichtigste Sicherheitsgarantien.
   - Wichtigste bekannte Grenzen.

2. Geltungsbereich und Quellenstand
   - Repository-Stand und Datum.
   - Gelesene Pflichtquellen.
   - Gelesene Code-, Daten-, Test- und Reviewquellen.
   - Konflikte oder Aktualitätslücken.

3. Architekturüberblick
   - Gesamtbild der KI-Schichten.
   - Beziehung zwischen Engine, LegalActions, PlayerView, PublicEvents, AIInput, AiDecision, applyAction, Replay und Server-Orchestrierung.
   - Klare Aussage: Die Rules Engine bleibt einzige Regelautorität.

4. Datenfluss pro KI-Entscheidung
   - Aufbau von `AiDecisionInput`.
   - Rolle von `buildAiDecisionInput` und `buildAiDecisionInputDto`.
   - Sanitizing und positive Allowlist für PlayerView, LegalActions, PublicEvents, Payloads und eigene Deck Doctrine.
   - Auswahl über `chooseAiAction`, `chooseCorpAction`, `chooseRunnerAction`.
   - Übergabe zurück an Server/Simulation.
   - Revalidierung durch `applyAction`.

5. Eingabe- und Sichtbarkeitsmodell
   - Erlaubte Daten.
   - Verbotene Daten.
   - Eigene private Informationen je Seite.
   - Gegnerische Hidden Info.
   - PublicEvent-Tail.
   - LegalAction-Payload-Grenzen.
   - Deck-Metadaten und private Decksnapshots.

6. Baseline-Heuristik
   - Ort im Code.
   - Runner-Baseline: wichtige Bewertungsfamilien.
   - Corp-Baseline: wichtige Bewertungsfamilien.
   - Rolle als Fallback und als reaktiver Entscheider.
   - Bekannte Grenzen der Einzelaktionsbewertung.

7. Planbasierte Corp-KI
   - Planarten.
   - Candidate-Erzeugung.
   - Scoring-Komponenten.
   - Remote-/Scoring-/HQ-/R&D-/Economy-Logik.
   - Runner-Contest-Capacity und side-sichere Schätzungen.
   - Fallback- und Timeout-Verhalten.
   - Aktuelle Grenzen.

8. Planbasierte Runner-KI
   - Planarten.
   - Candidate-Erzeugung.
   - Scoring-Komponenten.
   - Run-Zielbewertung, Remote Contest, Central Pressure, Rig-Aufbau, Economy, Trash, Jack-out, Continue, Break/Pump.
   - Sichtbare Run-Kosten und ICE-Breaker-Bewertung.
   - Aktuelle Grenzen.

9. Belief State und Opponent Model
   - Was rekonstruiert wird.
   - Was nicht persistiert wird.
   - Public Fact, own private fact, revealed opponent fact, hypothesis, unknown.
   - R&D-Top-Freshness, bekannte HQ-Handdaten, bekannte Positionen, Remote-Hypothesen, Runner-/Corp-Opponent-Modelle.
   - Invalidation-Logik.
   - Hidden-Info-Grenze.

10. Deck Doctrine
    - Deck-Snapshot-Eingang.
    - Rollenstatistiken, Archetype-Tags, Risk Flags, PlanWeights und MulliganWeights.
    - Live-Server-Pfad mit privaten Snapshots der aktiven KI-Seite.
    - Redaction: keine Deckliste, keine gegnerischen privaten Snapshots, keine Deckreihenfolge.
    - Aktuelle Grenzen.

11. AI-Hints und Kartenrollen
    - Aktive Runtime-Quelle `data/ai/ai-card-hints-active.json`.
    - `card-role-manifest-0.9.json`.
    - Beziehung zu Runtime-Karten, `ai_supported`, Decklegalität und Szenario-Smokes.
    - Warum alte Release-/Batch-Hintdateien nicht mehr primäre Runtime-Quelle sind.

12. Simulation, Selfplay, Benchmarks und Exploit-Regressionen
    - `simulateAiGame`, `simulateAiSoak`, V1.4.3 League, Doctrine-Quality-Benchmark, Match-Progression-Benchmark.
    - Random Legal Bot/Baseline/Plan-Kontrollmodi.
    - Metriken: illegale Aktionen, Fallbackrate, Timeoutrate, Replay-Failures, Progression, Doctrine-Qualität.
    - Was diese Benchmarks beweisen und was nicht.

13. DecisionDebug
    - Shared-Typen und Schema-Version.
    - Ranked Alternatives, Action Alternatives, Score Breakdown, Detail Sections, Warnings, Long-Term Plan, Opponent Model, own Deck Doctrine.
    - Sanitizer und verbotene Key-/Value-Muster.
    - Replay-Felder und Redaction-Grenzen.
    - Unterschied zwischen Debug-Daten und normaler Spieleransicht.

14. KI-Entscheidungstrace und Wartungsansicht
    - Trace-Aktivierung `off`, `summary`, `detailed`.
    - Persistenz in SQLite.
    - Maintenance-API für Matches, Index, Detail und Enable.
    - Private Wartungsansicht, Timeline, Metaebene, Detailansicht, Action-Level-Alternativen.
    - Live-Follow und NDJSON-Export.
    - Redaction-Grenzen: kein FullState, kein AIInput-Dump, keine Hidden Cards, keine Tokens, keine Decklisten, keine normalen Logs/Public-Replay-Flächen.

15. Server-, Web- und Multiplayer-Orchestrierung
    - Wo KI-Aktionen ausgelöst werden.
    - `advance_ai`, Single-Step vs Until-Human.
    - KI-Pacing im Webclient.
    - AI-Cues und Erklärungstexte.
    - Abgrenzung normaler Matchscreen vs private Wartungsansicht.

16. Determinismus, Replay, StateHash und Zufall
    - Wie Entscheidungen deterministisch bleiben sollen.
    - Rolle von Seed, DecisionId, ActionNumber und Simulation-RNG.
    - Replay- und StateHash-Erwartungen.
    - Grenze zwischen KI-Entscheidung und Engine-Zufall.

17. Test- und Evidence-Landkarte
    - Unit-Tests in `packages/ai/src/index.test.ts`.
    - Server-Tests, Web-Maintenance-Tests, Redaction-Tests.
    - Wichtige Szenario- und Smoke-Dateien.
    - Welche Risiken abgedeckt sind.
    - Welche Risiken nur teilweise oder gar nicht abgedeckt sind.

18. Aktuelle bekannte Schwächen und offene Prüffragen
    - Nur aus dokumentiertem Ist-Zustand ableiten.
    - Keine spekulative Wunschliste.
    - Trenne Engine-Risiken, Hidden-Info-Risiken, KI-Qualitätsrisiken, Trace-/Debug-Risiken, Testlücken und Wartbarkeitsrisiken.

19. Verbesserungskandidaten
    - Erst nach vollständiger Ist-Dokumentation.
    - Je Kandidat: Problem, Beleg, Risiko, Nutzen, grobe Umsetzungsidee, betroffene Dateien, notwendige Tests, Hidden-Info-/Replay-Gate.
    - Keine Umsetzung.
    - Keine pauschalen Vorschläge wie "LLM einbauen", solange sie nicht durch eigene Safety-Gates konkretisiert sind.

20. Prüffragen für einen Folge-Reviewer
    - Konkrete Fragen, die ein nachfolgender KI-/Architekturprüfer beantworten sollte.
    - Fragen müssen auf dokumentierte Stellen verweisen.

Ausgabeformat:

- Schreibe auf Deutsch mit echten Umlauten und `ß`.
- Nutze Markdown.
- Verwende kurze, präzise Abschnitte.
- Füge Dateipfade in Backticks ein.
- Markiere jede Aussage als eine der folgenden Klassen, wenn sie nicht eindeutig Fakt ist:
  - `Fakt aus Code`
  - `Fakt aus Dokumentation`
  - `Ableitung`
  - `Lücke`
  - `Prüffrage`
- Erzeuge am Anfang eine kompakte Mermaid-Übersicht des Datenflusses.
- Erzeuge zusätzlich eine Tabelle `Komponente | Zweck | Eingaben | Ausgaben | Sicherheitsgrenze | wichtigste Dateien`.
- Erzeuge am Ende eine Tabelle `Risiko/Schwäche | Beleg | Schwere | Verbesserungskandidat | Testbedarf`.

Qualitätskriterien:

- Die Dokumentation muss ohne implizites Projektwissen verständlich sein.
- Sie muss bestehende Reviewdokumente nicht nur wiederholen, sondern gegen den aktuellen Code- und Aktivitätsstand abgleichen.
- Sie darf keine Hidden Info offenlegen oder voraussetzen.
- Sie muss klar zwischen KI-Entscheidungslogik, Engine-Regelautorität, Debug/Trace und UI-Darstellung trennen.
- Sie muss den Stand von 2026-05-22 berücksichtigen, insbesondere die neuen KI-Trace-, Action-Level-Alternative-, Wartungsansicht-, Live-Follow- und Export-Artefakte.
```
