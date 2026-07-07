# Corp-Scoring-Remote Iteration: Score-Closeout Unsafe Metric Fix

Status: akzeptiert.

## Problem

Das Strategie-Panel meldete nach dem Funding-Floor-Fix weiter `unsafeScoreChosen: 1`. Die konkrete Stelle war Pair H / Seed `ai-v143-tuning-004`, Action 412: Die Corp scoret `Black Ice Quality Assurance` und erreicht damit 7 Agendapunkte.

Die Action war kein schlechter Corp-Zug. Sie beendet das Spiel sofort als Corp-Sieg. Die Diagnose zählte sie trotzdem als unsicher, weil `corpScoreTerminalWindowRunnerAccessThreatHigh` true war und `corpScoreTerminalWindowProtectedRemoteReady` nicht true war. Für einen finalen Score-Closeout gibt es aber kein nachfolgendes Runner-Exposure-Window mehr.

## Änderung

- `countUnsafeScoreChosen` ignoriert finale `score_agenda`-Actions, wenn die Summary direkt damit als Corp-Sieg endet.
- `run-ai-selfplay-trace-matrix.ts` verwendet dieselbe Logik für `unsafeScoreChosenByReason`.
- Die KI-Wertung und LegalAction-Auswahl bleiben unverändert.

## Evidence

Pair H / Seed `ai-v143-tuning-004`:

- Action 411: `advance_card`, Scoreline-Plan, same-turn closeout vorbereitet.
- Action 412: `score_agenda`, Corp erreicht 7 Punkte, Spiel endet.
- Vorher wurde diese Action als `unsafeScoreChosen` gezählt; nachher nicht mehr.

20er Strategie-Panel E-H:

- vorher: `unsafeScoreChosen: 1`
- nachher: `unsafeScoreChosen: 0`
- unverändert: 20 Spiele, 4223 Entscheidungen, 728 Findings, Corp Scores 29, Runner Steals 27, Action-Limits 0, Replay-Failures 0

## Bewertung

Das ist ein Benchmark-Hygiene-Fix. Er macht die Diagnose näher an der fachlichen Bedeutung: Unsafe Scoring soll nur Score-Entscheidungen zählen, die dem Runner danach noch ein relevantes Contest-/Steal-Fenster lassen.
