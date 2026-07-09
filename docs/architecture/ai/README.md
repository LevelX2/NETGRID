# AI-Architektur

## Current State

- `@netgrid/ai` ist die produktive Live-Fassade.
- Match-Simulation, Selfplay und Benchmarks werden ausschließlich über
  `@netgrid/ai/simulation` importiert.
- Die KI konsumiert nur side-sichere `PlayerView`, erlaubte `PublicEvents`,
  vorhandene `LegalActions` und ausdrücklich erlaubte Metadaten.
- Die Engine bleibt alleinige Regelautorität. Die KI erzeugt keine
  LegalActions und führt keine Ersatzaction außerhalb der gewählten Action-ID
  aus.
- Der Live-Modulgraph ist frei von alten Planern, Baseline-Controllern,
  Shadow-/META-Runtime und Kill-Switches.
- Der Semantic-Coverage-Restpfad ist fail-closed. Nur ausdrücklich sichere,
  nebenwirkungsarme Engine-Fortsetzungen sind erlaubt.
- Ausführbare Benchmarkprofile sind `random_legal_bot` und
  `current_candidate`.
- Technisches `ai_supported`, semantische Coverage, Szenario-Evidence,
  Play Strength und Default-/Random-Pool-Promotion sind getrennte Gates.

## Führende Artefakte

- `ai-controller-spec.md`: öffentlicher Controller- und LegalAction-Vertrag.
- `ai-decision-trace-contract-2026-05-22.md`: lokaler Trace-, Redaction- und
  Debugvertrag.
- `ai-simulation-test-matrix.md`: aktuelle Sicherheits- und
  Simulationsgrenzen.
- `ai-hints-structure-decision-2026-05-15.md`: Struktur der aktiven AI-Hints.
- `taktiksignale-strategieanker-guide-2026-06-02-v3.md`: aktuelle Begriffe für
  Taktiksignale, Strategieanker, TargetProfiles, Conditions und Constraints.
- `ai-play-strength-development-placement-guide-2026-06-13.md`: zulässige
  Modulbereiche für neue AI-Fixes.
- `ai-access-intelligence-placement-guide-2026-06-21.md`: Modulgrenzen für
  Access-Projektion und Access-Memory.
- `action-semantic-signal-invariant-classes-2026-06-27.md`: Invarianten für
  aktuelle Action-Signale.
- `hq-hand-memory-contract-matrix-2026-06-07.md`: side-sicherer Vertrag für
  Runner-HQ-Wissen.
- `runner-hand-development-creditbase-contract-2026-06-07.md`: aktueller
  Handentwicklungs-/Creditbase-Vertrag.
- `coaching-boundary-spec-2026-05-17.md`: Grenze für späteres side-sicheres
  Coaching.
- `ai-current-state-cleanup-process-2026-07-09.md`: abgeschlossener
  Runtime-/Legacy-Cleanup.
- `proteus-ai-release-reconciliation-plan-2026-07-09.md` und
  `proteus-ai-release-automation-process-2026-07-09.md`: paralleler
  Proteus-Rollout; erst nach Main-Integration führend.

## Aktive Gates

```text
corepack pnpm check:ai
corepack pnpm check:ai:full
corepack pnpm check:ai-deck-doctrine-strategy
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm --filter @netgrid/ai test
```

Die aktuelle vollständige Derived-Facts-Prüfung umfasst 616 aktive Hints, 527
CardImplementations, 390 generierte Facts und 137 noch über kompilierte Hints
abgedeckte Karten. Warnungen sind Qualitätsschuld, keine versteckten
Runtime-Fallbacks.

## Historie und Retention

Nummerierte AI020-bis-AI212-Einzelprozesse, Shadow-/META-Zwischenstände,
Cutover-Dry-Runs und Roh-Scorecards sind kein aktueller Vertrag. Ihr
verbleibender Erkenntniswert ist verdichtet in:

- `docs/reviews/ai/ai-historical-process-rollup-2026-07-10.md`
- `docs/reviews/ai/ai-current-state-cleanup-final-review-2026-07-09.md`

Neue Reports werden nur versioniert, wenn sie ein aktuelles Gate, eine
reproduzierbare Regression, eine Architekturentscheidung oder eine konkrete
Removal Condition tragen. Umfangreiche Rohläufe gehören nach `data/local/`.

## Verbotene Rückfälle

- kein FullGameState oder gegnerische Hidden-Zone-Daten im AI-Input;
- keine Action-Erzeugung außerhalb der Engine;
- kein alphabetischer oder beliebiger Catch-all für ungedeckte Aktionen;
- keine historisch benannten Controllerprofile, die auf den aktuellen Chooser
  zeigen;
- keine Shadow-/Legacy-Runtime als stiller Fallback;
- keine Behauptung von Play-Strength-Readiness allein aus `ai_supported`.
