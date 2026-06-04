# Semantic AI Runtime Cutover 2026-06-04

## Entscheidung

Die Semantic Runtime ist im AI-Livepfad default aktiv. `chooseRunnerAction` und `chooseCorpAction` berechnen die bisherige Plan-/Baseline-Entscheidung nur noch als Legacy-Referenz und reichen danach an die Semantic Runtime weiter.

Der bisherige scope-by-scope Schutz aus META 13 bis META 18 ist fuer die private Version-0-Instanz nicht mehr der Default. Legacy bleibt nur noch als expliziter Notaus ueber `NETGRID_SEMANTIC_AI_RUNTIME=legacy` und als No-Candidate-Fallback verfuegbar.

## Laufzeitvertrag

- Semantic Runtime waehlt ausschliesslich aus vorhandenen `LegalActions`.
- `applyAction` bleibt die Regelautoritaet fuer Seite, `actionId`, `stateVersion`, Timing, Kosten, Ziele und Choices.
- Der Semantic-Livepfad schreibt keine Action-Labels, keine Action-ID-Liste und keine Kartenlabels in Evidence oder Erklaerung.
- Legacy-Evidence wird im Notaus-Pfad nicht neu scrubbed, damit bestehende Legacy-Regressionsnachweise stabil bleiben.
- Bestehende Legacy-Regressionstests setzen den Notaus explizit; neue Cutover-Tests pruefen den default-aktiven Semantic-Pfad.

## Verifikation

- `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/ai test`
- `git diff --check`

Ergebnis: `@netgrid/ai` besteht mit 40 Testdateien und 795 Tests.

## Begleitaktualisierungen

Die AI-Gate-Reports wurden auf den aktuellen deterministischen Stand gebracht:

- `ai-derived-basic-facts-gate-2026-05-25.json`
- `ai-generated-fact-migration-priority-report-2026-05-25.json`
- `ai-hint-consumer-contract-inventory-2026-05-25.json`
- `ai-hint-quality-gate-report-2026-05-25.json`
- `aufgabe-007-batch1-generated-facts-rollup-report-2026-05-25.json`
- `aufgabe-011-batch2-generated-facts-rollup-report-2026-05-25.json`
