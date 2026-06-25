# Deck Strategy Runtime Hardening Cleanup 2026-06-25

Status: `DSR-H08_done`

Quelle: `docs/architecture/ai/deck-strategy-runtime-hardening-process-2026-06-25.md`

## Ergebnis

Der Cleanup bestätigt die aktuelle Zuständigkeit der Deck-Strategy-Runtime nach DSR-H01 bis DSR-H07 und grenzt die verbliebenen Diagnose- und Legacy-Pfade ab.

## Aktueller Vertrag

- Produktive Strategiequelle ist `AiDeckStrategyProfile` mit `source.mode: "ai_internal_strategy_profile"` und `plannerEffect: "strategic_intent_input"`.
- Produktive Runtime-Ziele stammen aus `StrategicIntentState`, `CorpStrategicIntentProfile`, Runner-TacticalGoals, Corp-Boardstate-Zielen und neutralen PlayerView-/LegalAction-Zielen.
- `DeckDoctrineV2Diagnostic` bleibt report-only: `productiveUseAllowed: false`, `source.mode: "report_only"`, `plannerEffect: "none"` und alle `noEffectFlags` bleiben false.
- `SemanticDecisionFrame.doctrineDiagnostic` ist nur noch ein report-only Diagnosekanal für Shadow-/Trace-Reports. Der Frame-Builder blockiert abweichende Doctrine-Diagnostics sofort.
- `chooseSemanticRuntimeAction` übergibt keine Doctrine-v2-Diagnostic an produktive Runtime-Frames. `tactical-goal-merge` verwirft report-only Doctrine-Ziele defensiv auch bei expliziter Übergabe.

## Behaltene Pfade

- `buildDeckDoctrineV2Diagnostic`, `synthesizeDoctrineTacticalGoals`, Doctrine-Goal-Coverage und Doctrine-Goal-Action-Fit bleiben für Reports, Shadow-Traces, Fixture-Auswertungen und Review-Artefakte erhalten.
- `ownDeckDoctrine` und Doctrine-v1-PlanWeights bleiben für Opening-Hand, Mulligan, Discard-/Legacy-Fallbacks, explizite Legacy-Planer und `NETGRID_SEMANTIC_AI_RUNTIME=legacy` erhalten.
- Legacy-Baseline-Entscheidungen bleiben als Referenz, Notaus und No-Candidate-Fallback erhalten.

## Bereinigt

- `SemanticDecisionFrame` dokumentiert den Doctrine-v2-Kanal als report-only und validiert die no-effect Marker.
- `semantic-decision-frame.test.ts` sichert positive report-only Frames und negative produktiv markierte Doctrine-Diagnostics ab.
- Der ältere Consumer-Audit und der ursprüngliche Runtime-Prozess sind mit Hardening-Nachträgen versehen, damit die historische DSR-Ausgangslage nicht mehr als aktueller Runtime-Vertrag gelesen wird.

## Kein Löschkandidat

Es wurde kein eindeutig toter KI-Entscheidungspfad bestätigt, der ohne Folgerisiko gelöscht werden sollte. Die verbliebenen Legacy- und Doctrine-v2-Pfade haben weiterhin begründete Diagnose-, Shadow-, Opening-/Discard- oder Fallback-Rollen.
