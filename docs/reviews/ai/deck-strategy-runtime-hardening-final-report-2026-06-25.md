# Deck Strategy Runtime Hardening Final Report 2026-06-25

Status: `DSR-H09_done`

Quelle: `docs/architecture/ai/deck-strategy-runtime-hardening-process-2026-06-25.md`

## Ergebnis

Der Hardening-Lauf DSR-H00 bis DSR-H09 ist im Arbeitsbranch abgeschlossen. Die Deck-Strategy-Runtime bleibt eine einzige, AI-interne Semantic-Runtime-Steuerungsebene und ist nun strenger gegen report-only/produktive Vermischung, ankerlose Capabilities, Strategieflattern, unpräzisen Action-Fit und missverständliche Debugscores abgegrenzt.

## Gehärteter Vertrag

- Produktiv wirken `AiDeckStrategyProfile`, `StrategicIntentState`, Runner-/Corp-StrategicIntent, TacticalGoals, TacticalPlans und `semantic_strategic_action_fit`.
- `DeckDoctrineV2Diagnostic` bleibt report-only und no-effect. `SemanticDecisionFrame` akzeptiert Doctrine-Diagnostics nur mit `productiveUseAllowed: false`, report-only Source und vollständig falschen `noEffectFlags`.
- Rollenstatus, Zielvektor und Reservebedarf entstehen im Defaultpfad aus `PlayerView`, `LegalActions`, StrategyProfile und Capabilities.
- StrategicIntent nutzt Mindestbindung, Switch-Margin, Abandon-Transition und isoliertes Memory.
- Action-Fit unterscheidet exakte Targets, generische Kind-Fits und Nicht-Fits; Funding-/Recovery-Phasen blockieren strategischen Druckaufbau.
- DecisionDebug trennt strategische Runtime, produktive Rohscores, display-only Scores, Plan-Mapping-Boni und Auswahlbegründung.
- Produktive Regressionen laufen über `GameState -> buildAiDecisionInput -> chooseCorpAction/chooseRunnerAction` ohne manuelle StrategyProfile- oder TargetVector-Injektion.

## Integration

Der lokale `main`-Stand wurde vor der Abschlussvalidierung konfliktfrei in den Arbeitsbranch gemergt: `e3da5b39 Merge branch 'main' into codex/deck-strategy-runtime-hardening`.

## Verifikation im Arbeitsbranch

- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- `corepack pnpm --filter @netgrid/ai test`: grün, 148 Testdateien und 1643 Tests.
- `git diff --check -- packages/ai docs KI-Wissen-NETGRID`: grün.

## Safety

Keine Engine-Regel, LegalAction-Erzeugung, `applyAction`-Validierung, Replay-, StateHash-, Randomness-, PlayerView-, PublicEvent-, WebSocket-, Reconnect-, Undo-, Log- oder Client-Fehler-Grenze wurde erweitert. Die Runtime wählt weiterhin ausschließlich vorhandene Engine-`LegalActions`.

## Restpunkte

Keine Blocker. Legacy-Baseline und Doctrine-v1-PlanWeights bleiben nur als begründete Opening-/Mulligan-/Discard-/Legacy-Fallback-Pfade erhalten.
