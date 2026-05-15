# AI Deck Doctrine Implementation Review

Stand: 2026-05-15  
Status: Corp-MVP und Runner-Plananbindung umgesetzt

## Umgesetzter Scope

- Neue deterministische Deck-Doktrin-Projektion aus eigenem Decksnapshot, Runtime-Karten, Rollenmanifest und AI-Hints.
- Gemeinsamer Shared-Typ `AiDeckDoctrineProfile` und optionaler `ownDeckDoctrine`-Input für KI-Entscheidungen.
- Corp-Archetypen: `rush`, `glacier`, `tag_pressure`, `asset_remote`, `operation_economy`, `central_defense`.
- Runner-Profilgenerator erzeugt planbezogene Gewichte für `pressure_rnd`, `pressure_hq`, `contest_remote`, `build_rig`, `recover_economy`, `draw_for_answers`, `trash_asset` und `safe_probe_run`.
- Runner-Planbewertung nutzt Doktrin-Gewichte als bounded Bonus, skaliert mit Profil-Confidence.
- Sichtbare Run-Blocker, Kosten- und Unreachable-Remote-Guards bleiben stärker als aggressive Runner-Doktrin.
- Runner-Zentraldruck auf HQ/R&D wird bei leerem Rig, niedriger Creditreserve, sichtbarem zentralem ICE oder sehr frischer Wiederholung gegen Economy-, Draw- und Rig-Aufbau abgewogen.
- Corp-Planbewertung nutzt Doktrin-Gewichte als bounded Bonus.
- Bestehende Agenda-Schutzlogik bleibt stärker als die neue Rush-Doktrin.
- Corp-Setup-Mulligan bewertet Start-Hände nach ICE, Economy, Agenda-Last, Remote-Plan und Doktrin-Passung.
- Simulationsreports zählen nun konkrete Doctrine-Fehlerklassen: nackte Agenda-Installs, Agenda-Flood-Exposure, verpasste Score-Fenster, Remote-Overbuild, Economy-Stalls, wiederholte Low-Value-Central-Runs, Rig-Stalls und Asset-Trash-Neglect.
- Economy-Stall zählt neue Planstarts bei niedriger Creditreserve, nimmt laufende Runner-Run-Folgeaktionen aber aus, damit Pump, Break, Continue, Access und Steal nicht als neue Planungsfehler erscheinen.
- Ein Doctrine-Quality-Benchmark vergleicht Baseline und aktuellen Kandidaten auf denselben Seeds und liefert Doctrine- sowie Safety-Deltas.
- Der Simulationspfad speist eigene Decksnapshots nur für den aktuellen Kandidaten in die KI ein; historische Benchmark-Profile bleiben ohne diese neue Doctrine-Information.
- Ein erster Benchmark-Report liegt unter `docs/derived/AI_DECK_DOCTRINE_QUALITY_BENCHMARK_REPORT_2026_05_15.md`.
- Eine redaktionssichere Fallanalyse für Doctrine-Metriken liegt unter `docs/derived/AI_DECK_DOCTRINE_QUALITY_CASE_ANALYSIS_2026_05_15.md`.
- Multiplayer-Server übergibt beim KI-Zug nur den privaten Snapshot der aktiven KI-Seite an `buildAiDecisionInput`.
- `DecisionDebug` enthält nur aggregierte Doktrin-Tags, Confidence, Risk Flags und Evidenz, keine Deckliste oder Deckreihenfolge.

## Geänderte Hauptartefakte

- `packages/ai/src/deck-doctrine.ts`: Profilgenerator und Corp-Mulligan-Bewertung.
- `packages/ai/src/index.ts`: Doctrine-Erzeugung im KI-Input, Setup-Mulligan-Auswahl, Debug-Zusammenfassung, Doctrine-Metriken und Exports.
- `packages/ai/src/corp-plans.ts`: planbezogener Doctrine-Bonus und redigierte Plan-Debugdaten.
- `packages/ai/src/runner-plans.ts`: planbezogener Runner-Doctrine-Bonus, Guards gegen unvorbereiteten zentralen Druck und redigierte Plan-Debugdaten.
- `packages/shared/src/index.ts`: gemeinsamer Doctrine-Typ und optionaler KI-Input.
- `apps/server/src/multiplayer.ts`: Snapshot-Übergabe für die aktive KI-Seite.
- `docs/derived/AI_DECK_DOCTRINE_QUALITY_BENCHMARK_REPORT_2026_05_15.md`: erster reproduzierbarer Doctrine-Quality-Report.
- `docs/derived/AI_DECK_DOCTRINE_QUALITY_CASE_ANALYSIS_2026_05_15.md`: Beispiele pro Doctrine-Fehlerklasse.
- `packages/ai/src/index.test.ts`: Regressionen für Profilgenerator, Corp-/Runner-Plan-Gewichtung, Agenda-Schutz, Runner-Blocker-Schutz, Mulligan, Doctrine-Qualitätsmetriken und Benchmark-Deltas.

## Verifikation

Grün:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai test -- --runInBand`
- `corepack pnpm --filter @netgrid/server typecheck`
- `corepack pnpm typecheck`
- `corepack pnpm lint`

Teilweise grün:

- `corepack pnpm test`: alle Workspace-Pakettests sind grün (`shared`, `catalog`, `engine`, `decks`, `ai`, `server`, `web`). Der nachgelagerte Spezifikationstest `tests/specs/visibility-contract.test.ts` fällt weiterhin auf die bestehende Web-Text-Erwartung `Meine Decks` in `apps/web/app/page.tsx`; dieser Fehler liegt außerhalb des KI-Doctrine-Slices.

## Offene Punkte

- Doctrine-Fehlerklassen sind gegen eine Baseline auswertbar; eine dauerhaft eingefrorene Tuning-/Holdout-Schwelle ist noch nicht festgelegt.
- Nackte Agenda-Installationen in `new_remote` werden nicht mehr als `score_next_turn`/`build_scoring_remote`-Schritt aufgenommen, wenn kein geschützter Zielserver besteht.
- Nach der Economy-Stall-Trennung bleiben neue `contest_remote`-Starts bei niedriger Creditreserve als nächster Tuning-Kandidat.
- Doctrine-Gewichte sind heuristisch und sollten erst nach Replay-/Selfplay-Auswertung weiter optimiert werden.
- Runner-Mulligan und archetypspezifische Early-Turn-Planung sind noch nicht umgesetzt.
