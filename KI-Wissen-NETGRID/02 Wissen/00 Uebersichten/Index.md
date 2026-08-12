# Index

Stand: 2026-08-12

## Einstieg

- [[Projektueberblick]]: Zielbild, Scope und Architekturgrundsätze.
- [[Aktueller Projektstatus]]: verdichteter aktueller Produkt- und Implementierungsstand.
- `docs/codex/CODEX_STATUS.md`: kompakter technischer Current-State-Einstieg.
- `docs/README.md`: Struktur und Retention der Projektdokumentation.

## Planung und Arbeit

- `docs/activities/inbox/`: offene kleine Findings und Nacharbeiten.
- `docs/activities/in-progress/`: aktuell beanspruchte Pakete.
- `docs/decisions/product-version-and-build-identification-2026-07-17.md`: Produktreife `V0.9` und Git-basierte Buildkennung.
- `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`: verbindliches Current-State-Prinzip.

Es gibt derzeit keine dauerhaft führende monolithische Release-Roadmap. Größere neue Vorhaben erhalten bei Bedarf einen explizit aktuellen Scope-/Releaseplan; nach Abschluss wird historische Release-Evidence entfernt.

## Architektur

- Engine-Grundsätze: `packages/engine/AGENTS.md`.
- Engine-Current-State: `docs/architecture/engine/README.md`.
- Kanonische CardSpec- und Registry-Architektur:
  `docs/architecture/central-card-specification-and-registry-target-state-2026-08-09.md`.
- AI-Current-State: `docs/architecture/ai/README.md`.
- KI-Änderungs-Preflight: [[../Architektur/KI-Aenderungen Architektur-Preflight]].
- Card-Rule-Text und Symbole:
  `docs/architecture/card-rules/card-rule-text-formatting-spec.md`.
- Lokale Deckbibliothek:
  `docs/architecture/deck-library/local-file-deck-library-2026-05-07.md`.
- Wiederverwendbare Funktionsnamen:
  [[../Architektur/Abstrakte Funktionsnamen und Wiederverwendung]].

## Karten und Mechaniken

- Kanonische kartenspezifische Autoren- und Projektionsschicht: `@netgrid/cards`.
- Versionierte Kartendaten und Projektartefakte: `data/cards/`, `data/manifests/`, `data/scenarios/`.
- Engine-Registry und Coverage konsumieren die mechanischen CardSpec-Projektionen über `@netgrid/cards/engine`.
- Originalset, Classic und Proteus sind technisch spielbar; technische Unterstützung ist von qualitativer KI-Spielstärke zu trennen.

## KI

- Die produktive KI ist Plan-first; die Engine bleibt alleinige Regelautorität.
- Führendes allgemeines Zielbild: `docs/architecture/ai/target-architecture.md`.
- Detaillierter Planvertrag: `docs/architecture/ai/planning-architecture.md`.
- Zug- und Kampagnenplaner: `docs/architecture/ai/turn-campaign-planner.md`.
- Verbindlicher Änderungskompass: `docs/architecture/ai/change-compass.md`.
- Live-API: `@netgrid/ai`; Simulation: `@netgrid/ai/simulation`.

Aktive Gates umfassen je nach Scope insbesondere:

- `corepack pnpm check:ai`
- `corepack pnpm check:ai-deck-doctrine-strategy`
- `corepack pnpm check:proteus-ai-readiness`
- `corepack pnpm check:engine-source-structure`

## Betrieb und Qualität

- Lokaler Start: `scripts/start-netgrid.ps1`.
- Lokaler Transfer: `docs/runbooks/netgrid-local-transfer.md`.
- SQLite-Wartung und laufende Matchanalyse: `docs/runbooks/maintenance-control-plane.md`.
- Account-Alpha-Betrieb: `docs/runbooks/account-alpha-operations.md`.
- Browser-E2E: `scripts/run-e2e.mjs` und `tests/e2e/`.
- Monatslogs: [[../../../03 Betrieb/Log]].

## Dokumentationsregel

- Current State steht in aktuellen Architektur-, Status-, Entscheidungs-, Runbook- und laufenden Activity-Artefakten.
- Abgeschlossene Releaseketten, Prozesse, Einzelreviews und Rohreports werden nach Referenzprüfung entfernt; Git-Historie ersetzt ein Dokumentationsarchiv.
- Umfangreiche Benchmarks, Traces und lokale Analyseausgaben gehören nicht dauerhaft nach `docs/`.
