# AI Deck Doctrine Implementation Review

Stand: 2026-05-15  
Status: Corp-MVP, Runner-Plananbindung, Runner-Setup-Mulligan, Early-Turn-Doctrine, Corp-Scoring-Progress und Draw-for-Scoring umgesetzt

## Umgesetzter Scope

- Neue deterministische Deck-Doktrin-Projektion aus eigenem Decksnapshot, Runtime-Karten, Rollenmanifest und AI-Hints.
- Gemeinsamer Shared-Typ `AiDeckDoctrineProfile` und optionaler `ownDeckDoctrine`-Input für KI-Entscheidungen.
- Corp-Archetypen: `rush`, `glacier`, `tag_pressure`, `asset_remote`, `operation_economy`, `central_defense`.
- Runner-Profilgenerator erzeugt planbezogene Gewichte für `pressure_rnd`, `pressure_hq`, `contest_remote`, `build_rig`, `recover_economy`, `draw_for_answers`, `trash_asset` und `safe_probe_run`.
- Runner-Planbewertung nutzt Doktrin-Gewichte als bounded Bonus, skaliert mit Profil-Confidence.
- Sichtbare Run-Blocker, Kosten- und Unreachable-Remote-Guards bleiben stärker als aggressive Runner-Doktrin.
- Runner-Zentraldruck auf HQ/R&D wird bei leerem Rig, niedriger Creditreserve, sichtbarem zentralem ICE oder sehr frischer Wiederholung gegen Economy-, Draw- und Rig-Aufbau abgewogen.
- Runner-Remote-Contest wird bei niedriger Creditreserve und schwacher sichtbarer Remote-Drohung gedrosselt; sehr frischer Contest desselben Remotes wird zusätzlich abgewertet.
- Runner-Early-Turn-Planung nutzt die Deck-Doktrin als bounded Zusatzscore: `rig_builder` bevorzugt frühes Rig-Setup, `economy_dense` stabilisiert die frühe Creditreserve, Druckarchetypen bekommen frühe Druckboni nur bei sichtbarer Bereitschaft.
- Runner-Access-Fenster für `decline_trash` werden als bewusste Access-Entscheidung gewertet statt als Fallback.
- Corp-Zentral-ICE-Protection wird bei sehr niedriger Creditreserve gegen Economy-Erholung abgewogen, wenn der Zielserver bereits geschützt ist oder kein unmittelbarer Schutzdruck besteht.
- Corp-Scoring-Progress gewichtet echte Score-Fenster und geschützte Agenda-Installationen stärker, wenn die Corp nach der frühen Phase noch keine Agenda-Punkte hat; redundante Zentralverteidigung wird dann gedämpft, sobald HQ und R&D bereits geschützt sind.
- Corp-Recovery priorisiert bei stabiler Creditreserve, geschützten Centrals und fehlender Agenda in HQ gezieltes Ziehen vor weiterem Credit-Klicken.
- Corp-Planbewertung nutzt Doktrin-Gewichte als bounded Bonus.
- Bestehende Agenda-Schutzlogik bleibt stärker als die neue Rush-Doktrin.
- Corp-Setup-Mulligan bewertet Start-Hände nach ICE, Economy, Agenda-Last, Remote-Plan und Doktrin-Passung.
- Runner-Setup-Mulligan bewertet Start-Hände nach Breaker-Zugang, Economy, Setup-Dichte, Druckoptionen, Handbalance und Doktrin-Passung.
- Simulationsreports zählen nun konkrete Doctrine-Fehlerklassen: nackte Agenda-Installs, Agenda-Flood-Exposure, verpasste Score-Fenster, Remote-Overbuild, Economy-Stalls, wiederholte Low-Value-Central-Runs, Rig-Stalls und Asset-Trash-Neglect.
- Economy-Stall zählt neue Planstarts bei niedriger Creditreserve, nimmt laufende Runner-Run-Folgeaktionen aber aus, damit Pump, Break, Continue, Access und Steal nicht als neue Planungsfehler erscheinen.
- Ein Doctrine-Quality-Benchmark vergleicht Baseline und aktuellen Kandidaten auf denselben Seeds und liefert Doctrine- sowie Safety-Deltas.
- Der Simulationspfad speist eigene Decksnapshots nur für den aktuellen Kandidaten in die KI ein; historische Benchmark-Profile bleiben ohne diese neue Doctrine-Information.
- Ein erster Benchmark-Report liegt unter `docs/releases/ai/deck-doctrine/quality-benchmark-report-2026-05-15.md`.
- Ein Holdout-Benchmark-Report liegt unter `docs/releases/ai/deck-doctrine/holdout-benchmark-report-2026-05-15.md`.
- Ein längerer Selfplay-/Soak-Report liegt unter `docs/releases/ai/deck-doctrine/selfplay-soak-report-2026-05-15.md`.
- Eine redaktionssichere Fallanalyse für Doctrine-Metriken liegt unter `docs/releases/ai/deck-doctrine/quality-case-analysis-2026-05-15.md`.
- Multiplayer-Server übergibt beim KI-Zug nur den privaten Snapshot der aktiven KI-Seite an `buildAiDecisionInput`.
- `DecisionDebug` enthält nur aggregierte Doktrin-Tags, Confidence, Risk Flags und Evidenz, keine Deckliste oder Deckreihenfolge.

## Geänderte Hauptartefakte

- `packages/ai/src/deck-doctrine.ts`: Profilgenerator sowie Corp- und Runner-Mulligan-Bewertung.
- `packages/ai/src/index.ts`: Doctrine-Erzeugung im KI-Input, Corp-/Runner-Setup-Mulligan-Auswahl, Debug-Zusammenfassung, Doctrine-Metriken und Exports.
- `packages/ai/src/corp-plans.ts`: planbezogener Doctrine-Bonus und redigierte Plan-Debugdaten.
- `packages/ai/src/corp-plans.ts`: zusätzlich Scoring-Progress-Gewichtung für echte Score-Fenster, geschützte Agenda-Installationen und redundante Zentralverteidigung.
- `packages/ai/src/corp-plans.ts`: zusätzlich Draw-for-Scoring-Priorität innerhalb von `recover_economy`.
- `packages/ai/src/runner-plans.ts`: planbezogener Runner-Doctrine-Bonus, Guards gegen unvorbereiteten zentralen Druck, Remote-Contest-Pacing und redigierte Plan-Debugdaten.
- `packages/ai/src/runner-plans.ts`: zusätzlich Early-Turn-Doctrine-Scoring für Runner-Setup-, Economy- und Druckprioritäten.
- `packages/shared/src/index.ts`: gemeinsamer Doctrine-Typ und optionaler KI-Input.
- `apps/server/src/multiplayer.ts`: Snapshot-Übergabe für die aktive KI-Seite.
- `docs/releases/ai/deck-doctrine/quality-benchmark-report-2026-05-15.md`: erster reproduzierbarer Doctrine-Quality-Report.
- `docs/releases/ai/deck-doctrine/holdout-benchmark-report-2026-05-15.md`: Holdout-Nachweis für Doctrine-Fehlerklassen und Safety-Deltas.
- `docs/releases/ai/deck-doctrine/selfplay-soak-report-2026-05-15.md`: längerer 9-Seed-/80-Action-Selfplay-Nachweis über alle Benchmark-Profile.
- `docs/releases/ai/deck-doctrine/quality-case-analysis-2026-05-15.md`: Beispiele pro Doctrine-Fehlerklasse.
- `packages/ai/src/index.test.ts`: Regressionen für Profilgenerator, Corp-/Runner-Plan-Gewichtung, Agenda-Schutz, Runner-Blocker-Schutz, Corp-/Runner-Mulligan, Doctrine-Qualitätsmetriken und Benchmark-Deltas.

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
- Im engen 6-Seed-/40-Action-Doctrine-Benchmark, im 9-Seed-Holdout-Lauf und im 9-Seed-/80-Action-Selfplay stehen alle Doctrine-Fehlerklassen für `current_candidate` bei 0.
- Alle `current_candidate`-Spiele im 80-Action-Selfplay erreichen das Action-Limit; nächster Ausbaukandidat ist deshalb Spielprogression, nicht weiteres Micro-Tuning auf denselben Seeds.
- Doctrine-Gewichte sind heuristisch und sollten erst nach Replay-/Selfplay-Auswertung weiter optimiert werden.
- Runner-Mulligan, ein erster archetypspezifischer Early-Turn-Slice, ein erster Corp-Scoring-Progress-Slice und Draw-for-Scoring sind umgesetzt; offen bleibt stärkere Matchabschluss-Dynamik über mehrere Score-Zyklen hinweg.
