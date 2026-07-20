# AI-Selfplay-Performanceoptimierung – Abschlussreview

Status: abgeschlossen

Datum: 20. Juli 2026

Prozess:
`docs/architecture/ai/ai-selfplay-performance-optimization-process-2026-07-20.md`

## Ergebnis

Die technischen Hauptkosten der Testspiele wurden ohne Änderung an
LegalActions, Rules Engine, Replay, StateHash, Seed-/Randomness-Vertrag oder
Hidden-Info-Gates reduziert. Der feste 240-Aktionen-Lauf ist bei vollständig
gleicher Summary, Findings, Aggregate, ActionSequence und finalem StateHash von
29,228 s auf 22,854 s gefallen. Das entspricht 21,8 Prozent weniger
Wallclock.

Der lange beobachtbare Server-AI-vs-AI-Test endet weiterhin regulär nach mehr
als 120 Aktionen, hält vollständige Decision-Traces vor und replayt fehlerfrei.
Seine gemessene Wallclock liegt mit 46,559 s innerhalb des festen
60-Sekunden-Testbudgets.

## Technische Änderungen

1. Abgeleitete semantische Daten wie Belief State, Public History, Central
   Pressure, Corp Board Triage und Scoring Window werden innerhalb genau einer
   synchronen AI-Entscheidung wiederverwendet. Zwischen Zügen, States und
   Spielen gibt es keinen fachlichen Cache.
2. `playerView.publicEvents` bleibt die vollständige öffentliche Historie;
   `eventTail` ist ein echter Suffix der letzten 80 Ereignisse. Sanitizierte
   Eventobjekte werden geteilt und Vollhistorien-Consumer bleiben vollständig.
3. Der Side-Safety-Check traversiert das DTO direkt, behandelt Aliase einmal,
   erkennt Marker in Schlüsseln, Strings und JSON-Serialisierungshooks und
   schlägt bei Zyklen fail-closed fehl.
4. Ab vier Slots kann die Behavior Baseline konservativ über isolierte
   Node-Prozesse laufen. Ergebnis- und Raw-Reihenfolge folgen immer der
   angeforderten Slot-Reihenfolge. Kleine Läufe bleiben standardmäßig seriell;
   `--workers` erlaubt eine bewusste Abweichung.
5. Raw-Traces werden aus Slotfragmenten gestreamt und erst nach vollständigem
   Erfolg atomar veröffentlicht. `.gz` aktiviert verlustfreie Kompression,
   `.json` bleibt kompatibel lesbar.

## Messungen

Messumgebung: lokaler Windows-Rechner, Node.js 24.18.0, 20 von Node gemeldete
logische Parallel-Slots. Zeitwerte sind lokale Diagnoseevidence und keine neue
CI-Millisekundenschwelle.

| Fall                                                           |       Vorher |     Nachher | Ergebnis          |
| -------------------------------------------------------------- | -----------: | ----------: | ----------------- |
| Net-Damage/Black-Ice, Seed `-07`, 240 Aktionen                 |     29,228 s |    22,854 s | −21,8 %           |
| Sechs Baseline-Slots, Seed `-07`, 120 Aktionen, 1 vs. 4 Worker |     35,506 s |    32,844 s | −7,5 %            |
| Zwei identische 240-Aktionen-Slots, 1 vs. 2 Worker             |     35,384 s |    38,943 s | seriell schneller |
| Raw-Trace, 40 Aktionen, JSON vs. Gzip                          | 336.576 Byte | 27.131 Byte | −91,9 %           |

Die Gegenmessung mit zwei identischen Slots ist bewusst Teil des Ergebnisses:
Kalte Prozesse verlieren dort gemeinsame reine Textcaches und Prozessstartzeit.
Deshalb aktiviert die Automatik Parallelität erst beim typischen breiteren
Baseline-Lauf und nicht pauschal für jedes Testspiel.

## Paritäts- und Sicherheitsnachweis

- 240-Aktionen-Referenz: vollständige Summary, Findings, Aggregate und
  ActionSequence bitgleich; finaler StateHash jeweils `fnv1a:2c327d92`.
- Seriell/parallel: sechs Raw-Slots, normalisierte Baseline und sechs finale
  StateHashes identisch und in derselben Reihenfolge.
- JSON/Gzip: nach dem Einlesen feldgleiches
  `ai-behavior-baseline-v1-raw`-Artefakt.
- Abbruchpfad: fehlendes Fragment verändert ein vorhandenes Endartefakt nicht
  und hinterlässt keine temporäre Datei.
- Vollständige AI-Suite: 415 Testdateien und 2.845 Tests grün; Laufzeit
  412,75 s. `@netgrid/ai`-Typecheck und `check:ai` grün.
- Langer Server-Smoke grün: reguläres Ende, vollständige Event-/Decision-Trace-
  Anzahl und erfolgreicher deterministischer Replay.

## Restrisiken und Nutzung

- Parallelgewinn hängt von Slotmix, Spieldauer, CPU-Scheduling und Cold Caches
  ab. `--workers 1` ist der verbindliche serielle Referenzpfad; Performance wird
  gemessen und nicht aus der Workerzahl abgeleitet.
- Gzip reduziert Dateigröße und I/O deutlich, benötigt zum direkten manuellen
  Lesen aber Dekompression. Der bereitgestellte Reader akzeptiert beide
  Formate.
- Es wurde keine fragile Zeitassertion ergänzt. Verhalten, Redaction, Replay
  und deterministische Resultate bleiben die harten Gates.
