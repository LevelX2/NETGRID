# Index

## Einstieg

- [[Projektueberblick]]: Zielbild, Scope und Architekturgrundsätze.
- [[Aktueller Projektstatus]]: verdichteter Ist-Stand, aktive Strukturarbeit
  und offene Risiken.
- [[Quellenlage und Aktualitaet]]: vorhandene und fehlende Quellen.
- [[../Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen]]:
  wiki-first Workflow und Rückführung belastbarer Erkenntnisse.
- `docs/codex/CODEX_STATUS.md`: detaillierter Release-, Gate- und
  Implementierungsstand.

## Führende Planung

- `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`:
  konsolidierte Release- und Produktroadmap.
- `docs/releases/roadmaps/long-term-product-vision-and-roadmap.md`:
  langfristige private, Internet-, Public- und Endprodukt-Gates.
- `docs/activities/`: operatives Board für kleine Findings, Fixes und
  Nacharbeiten (`inbox`, `in-progress`, `done`).
- `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`:
  verbindliche Current-State-Retention für die Version-0-Phase.

## Architektur

- Engine-Grundsätze: `packages/engine/AGENTS.md` und
  `docs/architecture/ability-engine/README.md`.
- AI-Current-State: `docs/architecture/ai/README.md`.
- Card-Rule-Text und Symbole:
  `docs/architecture/card-rules/card-rule-text-formatting-spec.md`.
- Lokale Deckbibliothek:
  `docs/architecture/deck-library/local-file-deck-library-2026-05-07.md`.
- Wiederverwendbare Funktionsnamen:
  [[../Architektur/Abstrakte Funktionsnamen und Wiederverwendung]].
- Projektweiter Cleanup:
  `docs/architecture/current-state-project-cleanup-process-2026-07-10.md`.

## Karten und Mechaniken

- Aktive Kartendaten: `data/cards/`.
- Aktive Supportmanifeste: `data/manifests/`.
- Aktive Szenarien: `data/scenarios/`.
- Classic-Endstand: `docs/releases/classic/final-review.md` – 52/52 Karten
  engine-/human-playable und technisch AI-supported.
- Proteus-Endstand: 154/154 Karten engine-/human-playable. Die
  AI-Reconciliation qualifiziert alle 114 Karten der vier Pilotdecks über elf
  Familien-Szenarien; vier Snapshots sind im AI-Deckpool 1.1.0 für Fixed- und
  Seeded-Random-Auswahl freigegeben. Führend sind
  `data/ai/card-set-ai-readiness-v1.json` und
  `docs/reviews/ai/proteus-ai-release-reconciliation-final-review-2026-07-09.md`.
- Originalset-/Releasehistorie liegt unter `docs/releases/v1/`; sie ist keine
  zweite aktuelle Runtimequelle.

## KI

- Die Semantic Runtime ist der einzige Live-Entscheidungsweg.
- Live-API: `@netgrid/ai`; Simulation: `@netgrid/ai/simulation`.
- Current-State-Cleanup:
  - `docs/architecture/ai/ai-current-state-cleanup-process-2026-07-09.md`
  - `docs/reviews/ai/ai-current-state-cleanup-final-review-2026-07-09.md`
- Historischer AI020-bis-AI212-Erkenntniswert:
  `docs/reviews/ai/ai-historical-process-rollup-2026-07-10.md`.
- Proteus-Reconciliation:
  - `docs/architecture/ai/proteus-ai-release-reconciliation-plan-2026-07-09.md`
  - `docs/architecture/ai/proteus-ai-release-automation-process-2026-07-09.md`
  - `docs/reviews/ai/proteus-ai-release-reconciliation-final-review-2026-07-09.md`
- Aktive Gates:
  - `corepack pnpm check:ai`
  - `corepack pnpm check:ai:full`
  - `corepack pnpm check:ai-deck-doctrine-strategy`
  - `corepack pnpm check:proteus-ai-readiness`

## Betrieb und Qualität

- Lokaler Start: `scripts/start-netgrid.ps1`.
- Lokaler Transfer: `docs/runbooks/netgrid-local-transfer.md` sowie
  `scripts/export-local-transfer.ps1` und `scripts/import-local-transfer.ps1`.
- SQLite-Wartung: private `/maintenance`-Oberfläche sowie
  `storage:inspect`, `storage:backup` und `storage:restore`.
- Browser-E2E: `scripts/run-e2e.mjs` und `tests/e2e/`.
- Monatslogs: [[../../../03 Betrieb/Log]].

## Dokumentationsregel

- Aktueller Status, aktuelle Architektur und aktuelle Gates stehen in den oben
  genannten führenden Artefakten.
- Abgeschlossene Prozessketten werden verdichtet; Git-Historie ersetzt
  versionierte Rohreport-Sammlungen.
- Umfangreiche Benchmarks, Traces und lokale Daten gehören nach `data/local/`.
- Historische Release-Reviews belegen einen damaligen Abschluss, dürfen aber
  aktuelle Runtime-, Kartenpool- oder KI-Freigaben nicht überschreiben.
