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
- `corp.create_score_window` kann vollständige Same-Turn-Scorepfade aus
  Installation, Aktionsgewinn, Advancement-Platzierung, Countertransfer und
  Basic Advances generisch kombinieren. Ungeschützte Agenda-Installationen
  sind nur bei garantiertem Closeout zulässig.
- `PlanPortfolioSnapshot` koordiniert einen Interrupt, einen Vordergrundplan
  und höchstens zwei fortsetzbare Hintergrundprojekte. Broker-/Bank-Zyklen und
  strategieabhängige Corp-Scoring-Remotes besitzen begrenzte Zugkadenz,
  redigierte Mehrplan-Beiträge und deterministische Zielbindung.
- `RemoteDoctrineProfile` leitet aus eigenem Deckstrategieprofil,
  DeckCapabilities und StrategicIntent ab, ob ein Deck keinen,
  opportunistischen, unterstützenden oder primären Remote-Bedarf besitzt.
  Fast-Advance-Decks erhalten dadurch keinen pauschalen Glacier-Auftrag.
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
- `corp-score-conversion-capability-contract.md` und
  `corp-score-conversion-plan-process-2026-07-10.md`: Engine-/Hint-/Planvertrag
  für generische Fast-Advance- und Countertransfer-Scorepfade.
- `ai-planportfolio-remote-doctrine-contract.md` und
  `docs/reviews/ai/ai-planportfolio-remote-doctrine-final-review-2026-07-12.md`:
  aktueller Vertrag für kurze Plansequenzen, wiederkehrende Zyklen,
  Entwicklungsprojekte und strategieabhängigen Remote-Ausbau.
- `proteus-ai-release-reconciliation-plan-2026-07-09.md`,
  `proteus-ai-release-automation-process-2026-07-09.md` und
  `docs/reviews/ai/proteus-ai-release-reconciliation-final-review-2026-07-09.md`:
  abgeschlossener Proteus-Rollout mit 154/154 technisch unterstützten Karten,
  114 Pilotkarten, elf Szenarien und vier qualifizierten Deckpool-Snapshots.

## Aktive Gates

```text
corepack pnpm check:ai
corepack pnpm check:ai:full
corepack pnpm check:proteus-ai-readiness
corepack pnpm check:ai-deck-doctrine-strategy
corepack pnpm --filter @netgrid/ai typecheck
corepack pnpm test:ai:shards
```

Das Realitätsgate aus
`docs/reviews/ai/ai-test-realism-audit-2026-07-12.md` und
`packages/ai/src/evaluation/real-engine-live-runtime.test.ts` verbindet
Engine-erzeugte Inputs mit dem produktiven Chooser. Unit-, synthetische Live-,
Live-Engine- und Full-Simulation-Evidence bleiben getrennt.

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
