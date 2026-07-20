# AI-Selfplay-Performanceoptimierung ohne Informationsverlust

Status: abgeschlossen

## Quelle und Zielprüfung

Ausgangspunkt ist die technische Laufzeitanalyse vom 20.07.2026. Der aktuelle
AI-Behavior-Baseline-Lauf ist fachlich belastbar, verarbeitet seine 60 Spiele
aber seriell und wiederholt innerhalb einer Entscheidung zustandsinvariante
Ableitungen. Ein deterministischer Net-Damage-Seed benötigte für 120, 240 und
480 Aktionen 12,6, 29,2 und 111,4 Sekunden. Zwei prozessisoliert parallele
240-Aktionsläufe waren mit 30,8 statt hochgerechnet 58,5 Sekunden bitgleich in
ActionSequence und StateHash.

Die Vorgabe ist für automatische Umsetzung präzise genug. Der Endzustand,
Sicherheitsgrenzen, betroffene Module und verifizierbare Akzeptanzkriterien
sind bestimmbar.

## Gesamtziel

Die vollständigen KI-Testspiele und insbesondere AI Behavior Baseline v1
werden deutlich schneller ausgeführt, ohne Seeds, Slots, Aktionslimits,
Entscheidungsinformationen, Trace-Fakten, Replay-, StateHash-, Redaction- oder
Hidden-Info-Prüfungen zu reduzieren. Bestehende kompakte Resultate bleiben
vergleichbar; jede Optimierung besitzt Determinismus- und Paritätsnachweise.

## Annahmen

- Prozessisolation ist der sichere Parallelisierungspfad, solange taktische
  Pläne, PlanPortfolio, StrategicIntent und RunnerRunPlan in modulweiten Maps
  gespeichert werden.
- Entscheidungslokale Ableitungen dürfen nur für dasselbe unveränderte
  `AiDecisionInput` wiederverwendet werden.
- Die vollständige öffentliche Ereignishistorie bleibt verfügbar. Ein echter
  Event-Tail darf nur zusätzlich als jüngste Teilmenge verwendet werden.
- Raw-Traces dürfen anders transportiert oder komprimiert werden, solange sie
  vollständig, redaction-safe und verlustfrei wiederherstellbar bleiben.

## Nicht-Ziele

- Keine Änderung an Engine-Regeln, `LegalActions`, `applyAction`, Replay,
  StateHash oder Randomness.
- Keine Änderung der KI-Entscheidungslogik oder ihrer Scores zur Verbesserung
  von Laufzeit- oder Verhaltensmetriken.
- Keine Reduktion des Standardpanels von sechs Slots, zehn Seeds oder 480
  Aktionen.
- Kein Abschalten von Side-Safety-, Hidden-Info-, Redaction- oder
  Replay-Prüfungen.
- Keine Parallelisierung mehrerer Spiele im selben JavaScript-Isolate, solange
  modulweite Runtime-Memory-Maps bestehen.
- Keine Remote-Integration, kein Push und kein Pull Request.

## Controller-Invarianten

- Genau ein Paket ist aktiv; Pakete werden in der definierten Reihenfolge
  abgeschlossen und einzeln committed.
- Jeder Kandidat muss aus vorhandenen Engine-`LegalActions` stammen und durch
  `applyAction` erneut validiert werden.
- Gleiche Slot-/Seed-/Deck-/Controller-Konfiguration erzeugt dieselbe
  ActionSequence, dieselben finalen StateHashes und dieselben Baseline-Metriken.
- Parallelresultate werden in der angeforderten Slot- und Seed-Reihenfolge
  zusammengeführt, nicht in Fertigstellungsreihenfolge.
- Optimierungscaches sind reine Ableitungscaches; sie besitzen keine
  spielübergreifende fachliche Lebensdauer.
- Fail-closed bleibt verbindlich: Worker-, Parse-, Replay-, Redaction- und
  Schreibfehler dürfen keinen akzeptierten Teilreport erzeugen.

## Automatische Fehlerbehandlung

- Ein roter fokussierter Test wird im aktuellen Paket eng auf Ursache und
  betroffenen Vertrag untersucht.
- Bei Paritätsabweichung wird die Optimierung nicht durch aktualisierte
  Snapshots legitimiert; zuerst wird die semantische Abweichung entfernt.
- Workerfehler werden mit Slot, Seed und Exitursache gemeldet. Der Gesamtlauf
  schlägt fehl und schreibt kein akzeptiertes Endresultat.
- Temporäre Fragmente werden nur nach erfolgreicher, validierter Zusammenführung
  als Endartefakt veröffentlicht.
- Weitergelaufene Änderungen auf `main` werden vor dem Abschluss defensiv in
  den Arbeitsbranch integriert und relevante Checks werden wiederholt.

## Sicherheitsblocker

Ein Paket stoppt mit Blocker-Report, wenn eine Beschleunigung nur durch Verlust
von Hidden-Info-Schutz, Redaction, Replay-Evidence, deterministischer
Vergleichbarkeit oder vollständigen Trace-Informationen möglich wäre. Removal
Condition ist ein nachweislich informationsgleiches und fail-closed Design.

## State Machine

`PREPARED -> P1_DERIVED_CONTEXT -> P2_INPUT_SAFETY -> P3_PARALLEL_RUNNER ->
P4_RAW_ARTIFACT -> P5_FINAL_VERIFICATION -> MAIN_INTEGRATION -> CLEANUP -> DONE`

Bei einem fehlgeschlagenen Done-Gate bleibt der Zustand beim aktuellen Paket.

## Paketfolge

### P0 – Prozessvertrag und Messbasis

- Ziel: Scope, Sicherheitsgrenzen, Paketfolge und Ausgangsmessung festhalten.
- Kernartefakt: dieses Prozessdokument.
- Checks: Dokumentprüfung, `git diff --check`.
- Done-Gate: Ziel, Nicht-Ziele, Invarianten, Pakete und Integration sind
  eindeutig beschrieben.
- Commit: `docs(ai): define selfplay performance optimization process`

### P1 – Entscheidungslokaler Derived Context

- Ziel: zustandsinvariante und identische Ableitungen innerhalb einer
  Entscheidung genau einmal berechnen.
- Arbeit: eng typisierte, input-identitätsgebundene Memoization für Board-
  Triage, Belief State, Public-History, Central-Pressure und wiederholte
  Rollenzerlegung; aktionsabhängige Ergebnisse nur mit vollständigem Schlüssel.
- Kernartefakte: `packages/ai/src/runtime/**`, `packages/ai/src/belief-state.ts`,
  fokussierte Paritätstests.
- Checks: fokussierte Vitest-Dateien, AI-Typecheck, `git diff --check`.
- Done-Gate: gleiche Entscheidungen/Debugdaten bei nachweislich nur einmaliger
  zustandsinvarianter Berechnung.
- Commit: `perf(ai): reuse decision-local semantic derivations`

### P2 – Public-History, Event-Tail und Side-Safety

- Ziel: doppelte Vollhistorienkopien und Vollstring-Scans entfernen.
- Arbeit: kanonische vollständige Historie und echter Tail mit geprüften
  Consumergrenzen; strukturelle Side-Safety-Prüfung mit gleichem Marker-
  Vertrag.
- Kernartefakte: AI-Input-DTO, Decision-Input, History-Consumer und
  Side-Safety-Tests.
- Checks: Input-/Hidden-Info-/Simulationstests, AI-Typecheck,
  `git diff --check`.
- Done-Gate: vollständige historische Information bleibt verfügbar; verbotene
  Marker werden mindestens gleich streng erkannt; deterministische
  ActionSequence bleibt gleich.
- Commit: `perf(ai): normalize public history and side-safe validation`

### P3 – Prozessisolierter Baseline-Runner

- Ziel: Slot-/Seed-Spiele auf einen begrenzten Prozesspool verteilen.
- Arbeit: Worker-CLI, deterministische Task-/Merge-Reihenfolge, konfigurierbare
  Workerzahl, fail-closed Fehler- und Cleanup-Verträge.
- Kernartefakte: `scripts/run-ai-behavior-baseline.ts`, enges Worker-Modul und
  Runner-Tests.
- Checks: seriell/parallel bitgleicher Vergleich, Workerfehler-Test,
  Baseline-Kompatibilität, Typecheck, `git diff --check`.
- Done-Gate: zwei oder mehr Prozesse liefern dasselbe Ergebnis wie ein Worker
  und reduzieren die gemessene Wallclock auf dem festen Testfall.
- Commit: `perf(ai): parallelize behavior baseline in isolated workers`

### P4 – Verlustfreie Raw-Trace-Erzeugung

- Ziel: Peak-RAM und I/O der vollständigen Raw-Evidence reduzieren.
- Arbeit: spieleweise Fragmente oder Streaming, atomare Zusammenführung und
  optionale verlustfreie Kompression; kompakte Baseline bleibt unverändert.
- Kernartefakte: Baseline-Runner, Raw-Artifact-Reader/-Tests und Prozessdoku.
- Checks: Roundtrip-Gleichheit, Redaction, abgebrochener Schreibvorgang,
  Typecheck, `git diff --check`.
- Done-Gate: jede bisherige Raw-Information ist wiederherstellbar und ein
  Fehler hinterlässt kein gültig wirkendes Endartefakt.
- Commit: `perf(ai): stream lossless baseline trace artifacts`

### P5 – Abschlussverifikation und Review

- Ziel: fachliche Parität, technische Gates und reale Beschleunigung belegen.
- Arbeit: feste Seed-Skalierung, seriell/parallel Vergleich, relevanter langer
  Server-KI-Smoke, AI-Gates und Review-/Wissenspflege.
- Kernartefakte: Final Review, aktueller Prozessstatus und Monatslog.
- Checks: fokussierte Tests, AI-Typecheck, `check:ai`, relevante AI-Suite,
  Baseline-Parität, `git diff --check`.
- Done-Gate: alle Hard-Gate-Klassen bleiben grün beziehungsweise unverändert
  zum fachlichen Ausgangsstand; Messwerte und Restrisiken sind dokumentiert.
- Commit: `docs(ai): close selfplay performance optimization`

## Paketfortschritt

### P1 – abgeschlossen am 20. Juli 2026

- Abgeleitete semantische Entscheidungsdaten werden ausschließlich innerhalb
  eines synchronen AI-Entscheidungszyklus wiederverwendet. Zwischen Zügen,
  States oder Spielen besteht kein Cache.
- Wiederverwendet werden insbesondere Belief State, zusammengeführte Public
  History, Central-Pressure-Auswertungen, Scoring-Window und Corp Board Triage.
  Rein textuelle Rollenzerlegung nutzt zusätzlich kleine begrenzte Caches.
- Der feste 240-Aktionen-Fall
  `strategy_panel_net_damage_black_ice` / `ai-behavior-baseline-v1-07` sank
  auf derselben Maschine von 29,228 s auf 24,866 s, also um 14,9 Prozent.
- Die vollständige Summary, Findings, Aggregate, ActionSequence und der finale
  StateHash (`fnv1a:2c327d92`) waren bitgleich zum Ausgangslauf.
- Verifikation: 83 fokussierte Tests grün, `@netgrid/ai`-Typecheck grün und
  `git diff --check` ohne Befund.

### P2 – abgeschlossen am 20. Juli 2026

- `playerView.publicEvents` bleibt die kanonische vollständige Historie;
  `eventTail` ist standardmäßig ein echter Suffix der letzten 80 Ereignisse.
  Historienverbraucher mit Vollverlaufsvertrag lesen weiterhin die
  zusammengeführte vollständige Historie.
- DTO-Sanitizing verarbeitet öffentliche Events nur einmal und teilt die
  bereinigten Eventobjekte zwischen Vollhistorie und Tail. Der Side-Safety-Check
  traversiert die DTO-Struktur direkt, erkennt verbotene Marker mindestens so
  streng wie zuvor und verarbeitet geteilte Referenzen nur einmal.
- Der feste 240-Aktionen-Fall sank gegenüber P1 von 24,866 s auf 22,854 s
  (weitere 8,1 Prozent) und gegenüber der ursprünglichen Messung von 29,228 s
  um insgesamt 21,8 Prozent.
- Vollständige Summary, Findings, Aggregate, ActionSequence und finaler
  StateHash (`fnv1a:2c327d92`) blieben bitgleich.
- Verifikation: fokussierter 23-Test-Runtime-Lauf sowie 29 Input-, Hidden-Info-
  und Redaction-Tests grün, `@netgrid/ai`-Typecheck grün und
  `git diff --check` ohne Befund.

### P3 – abgeschlossen am 20. Juli 2026

- Baseline-Slots können über einen begrenzten Pool isolierter Node-Prozesse
  laufen. Die Ergebniszusammenführung folgt unabhängig von der tatsächlichen
  Fertigstellungsreihenfolge strikt der angeforderten Slot-Reihenfolge.
- Ein effektiver Worker läuft ohne Prozessstart lokal. Die Automatik aktiviert
  Parallelität erst ab vier Slots; `--workers 1..32` erlaubt eine bewusste
  Abweichung. Damit vermeiden kleine Läufe den nachgewiesenen Cold-Start- und
  Cache-Nachteil mehrerer Prozesse.
- Der Sechs-Slot-Mix mit Seed `ai-behavior-baseline-v1-07` und 120 Aktionen
  sank von 35,506 s mit einem Worker auf 32,844 s mit vier Workern, also um
  7,5 Prozent. Raw-Slots, normalisierte Baseline und alle sechs StateHashes
  waren identisch.
- Gegenprobe: zwei identische 240-Aktionen-Slots waren seriell mit 35,384 s
  schneller als zwei kalte Prozesse mit 38,943 s. Dieser Fall begründet die
  konservative Automatik statt einer pauschalen Parallelisierung.
- Der einzelne feste 240-Aktionen-Fall blieb nach der Runner-Auslagerung
  vollständig bitgleich zu P2. Workerfehler stoppen neue Tasks, laufende Tasks
  werden abgewartet und temporäre Worker-Verzeichnisse werden auch bei Fehlern
  fail-closed entfernt.
- Verifikation: drei Pool-/Fehlerpfadtests grün, `check:ai` grün,
  seriell/parallel identische Raw-Evidence und `git diff --check` ohne Befund.

### P4 – abgeschlossen am 20. Juli 2026

- Der Parent-Prozess hält nicht mehr alle Raw-Traces gleichzeitig als
  deserialisierte Objekte. Er streamt die Worker-Fragmente direkt in ein
  kompaktes JSON-Endartefakt.
- Geschrieben wird zunächst in eine eindeutige Nachbardatei; erst nach
  vollständigem Erfolg wird atomar auf den Zielpfad umbenannt. Bei Fehlern
  bleibt ein vorhandenes Endartefakt unverändert und die temporäre Datei wird
  entfernt.
- Endet `--raw-out` auf `.gz`, wird derselbe JSON-Datenstrom verlustfrei mit
  Gzip komprimiert. Ein Reader unterstützt beide Formate; Schema und kompakte
  Baseline-Ausgaben bleiben unverändert.
- Der feste 40-Aktionen-Roundtrip war nach dem Einlesen feldgleich. Die
  Raw-Größe sank von 336.576 Byte als JSON auf 27.131 Byte als Gzip, also um
  91,9 Prozent.
- Verifikation: drei Roundtrip-, Kompressions- und Abbruchtests grün, realer
  JSON/Gzip-Simulationsvergleich bitgleich und `git diff --check` ohne Befund.

### P5 – abgeschlossen am 20. Juli 2026

- Die vollständige `@netgrid/ai`-Suite ist mit 415 Testdateien und 2.845 Tests
  in 412,75 s grün; AI- und Server-Typecheck sind grün.
- Der beobachtbare Server-AI-vs-AI-Langtest endet nach mehr als 120 Aktionen
  regulär, besitzt für jede Aktion Event- und Decision-Trace-Evidence und
  replayt mit korrektem finalem StateHash. Seine Wallclock beträgt 46,559 s
  und bleibt damit innerhalb des festen 60-Sekunden-Testbudgets.
- `check:ai` meldet null Laufzeit- und Typzyklen sowie null harte
  Hint-Metadatenfehler. Die sechs neuen Pool-, Roundtrip-, Kompressions- und
  Abbruchtests sind grün.
- Ausführungsrunbook, aktueller Projektstatus und Monatslog dokumentieren den
  neuen Vertrag. Der Abschlussreview liegt unter
  `docs/reviews/ai/ai-selfplay-performance-optimization-final-review-2026-07-20.md`.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Seed-,
  Randomness-, Kartenpool- oder Hidden-Info-Vertragsänderung.

## Verifikationsregeln

- Parität wird über ActionSequence, finalen StateHash, Replaystatus,
  Fehlerzähler, Findings und kompakte Baseline-Metriken geprüft.
- Zeitmessungen sind Diagnoseevidence, keine fragile CI-Millisekundengrenze.
- Performancebehauptungen nennen Hardware, Konfiguration und Vergleichsbasis.
- Kein Paket darf Golden-/Snapshot-Erwartungen allein wegen einer
  Optimierungsabweichung aktualisieren.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_SELFPLAY_PERFORMANCE`.
- Arbeitsbranch: `codex/selfplay-performance`.
- Basis- und Integrationsbranch: lokales `main`.
- Hauptworkspace wird bis zum finalen Merge nicht verändert.
- Nach jedem Paket: Checks, Ergebnisdokumentation, `git diff --check`, selektiv
  stagen und eigener Commit.
- Vor dem Merge wird aktuelles `main` in den Arbeitsbranch integriert.
- Nach erfolgreichem lokalen Merge werden Worktree und gemergter Branch ohne
  Force entfernt und in Git sowie Dateisystem verifiziert.

## Controller-Prompt-Kern

`/Goal Arbeite die AI-Selfplay-Performanceoptimierung vollständig und
sequenziell von P0 bis P5 im Worktree
C:\Projekte\NETGRID_SELFPLAY_PERFORMANCE auf Branch
codex/selfplay-performance ab. Erhalte alle fachlichen Informationen,
Determinismus-, Replay-, Redaction- und Hidden-Info-Gates. Committe jedes
abgeschlossene Paket. Integriere danach aktuelles main, verifiziere final,
merge lokal nach main und entferne Worktree sowie Branch erst nach sauber
nachgewiesenem Abschluss.`

## Abschlusskriterien

- P0 bis P5 sind mit eigenen Commits abgeschlossen.
- Der Standardvertrag der AI Behavior Baseline bleibt vergleichbar und
  vollständig.
- Mindestens ein seriell/parallel identischer Vergleich und eine feste
  Langspielmessung belegen die Optimierung.
- Der Arbeitsbranch ist lokal nach `main` gemergt.
- `main` ist geprüft, der Arbeits-Worktree existiert weder in
  `git worktree list` noch im Dateisystem, und der gemergte Arbeitsbranch ist
  gelöscht.
