# AI Current-State Cleanup – Final Review

Stand: 2026-07-09

## Ergebnis

Der AICSC-0-bis-AICSC-8-Prozess hat die aktive KI auf einen überprüfbaren
Current State reduziert. Live-Chooser und Simulation besitzen getrennte
Package-Fassaden. Der Live-Modulgraph enthält keine Legacy-Implementierung.
Historische Baseline-Planer, Runtime-Fallbacks, Kill-Switches, Shadow-/META-
Einmalcode und ersetzte Monolithtests sind physisch entfernt.

## Verbindliche Verträge

- Die KI nutzt ausschließlich PlayerView, side-sichere PublicEvents,
  LegalActions und freigegebene Metadaten.
- Die Engine bleibt alleinige Regelautorität; die KI erzeugt keine LegalAction.
- `@netgrid/ai` ist live-only, `@netgrid/ai/simulation` ist der explizite
  Simulations-/Benchmarkpfad.
- Technisches `ai_supported`, semantische Coverage, Scenario-Evidence,
  Play Strength und Deckpool-Promotion sind getrennte Aussagen.
- Ungedeckte nichttriviale Aktionen werden nicht alphabetisch oder als
  vermeintlich niedrigstes Risiko gewählt; der Coverage-Pfad stoppt
  fail-closed.

## Bereinigung

- Ausführbare Controllerprofile: `random_legal_bot`, `current_candidate`.
- Gelöscht: `packages/ai/src/legacy/**`, Baseline-Simulationsadapter,
  Baseline-Selectoren, Runtime-Kill-Switches und der alte `index.test.ts`.
- Gelöscht: ersetzte Controlled-Shadow-, META-, Production-Readiness- und
  einmalige Shadow-/Cutover-Checkskripte.
- Erhalten: weiterhin konsumierte Evaluation, Target-Fit-Diagnostik,
  Replay-/Decision-Corpus und aktuelle Qualitätsgates.

## Qualitätsänderungen

- Reifer hoch priorisierter Runner-Zentraldruck dämpft reine Basis-Economy-
  und Draw-Aktionen, wenn die passende Run-Aktion legal ist.
- Corp-Zentral-ICE erhält einen Overice-Guard, wenn eine sichtbare Agenda ein
  unterbautes Remote benötigt; echte HQ-/R&D-Schutztriage bleibt ausgenommen.
- Der Strategy-Smoke blieb bei 0 IllegalActions, ReplayFailures und Timeouts.
  Größere Panel-Läufe überschritten das lokale 60-Sekunden-Fenster und wurden
  ausdrücklich nicht als bestanden gewertet.

## Verifikation

- AI-Typecheck und Server-Typecheck: grün.
- AI-Tests in drei disjunkten Shards: 287 Dateien, 1.813 Tests grün.
- `check:ai` und `check:ai:full`: grün; 616 aktive Hints, 600 mit
  Action-Semantic-Signal, 34 explizit deferred, 90 Target-Profile-Gaps,
  0 harte Fehler.
- `git diff --check`: grün.
