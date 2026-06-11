# AI Play-Strength Decision Spine Final Report 2026-06-11

## Status

`final_report_written_pending_final_green`

Branch: `codex/ai-play-strength-decision-spine`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_DECISION_SPINE`

## Ausgangspunkt

Die Ergebnisanalyse hat keinen weiteren reinen Struktur-Schnitt verlangt, sondern den nächsten spielstärkerelevanten Schritt: eine erklärbare, side-sichere Entscheidungsachse zwischen vorhandenen `LegalActions`, TacticalPlans, Board-/Memory-Projektionen und diagnostischen Fehlerklassen.

Der daraus gezogene Schluss war: Die KI braucht nicht mehr Legalitätsmacht, sondern eine bessere interne Übersetzung von Zielen, Gefahren, Chancen und Aktionseignung. Die Rules Engine bleibt alleinige Regelautorität.

## Umsetzung

| Paket | Ergebnis |
| --- | --- |
| `AI-PLAY-0` | Baseline grün bestätigt und Strukturinventar dokumentiert. |
| `AI-PLAY-1` | `SemanticDecisionFrame` und leerer `SemanticDecisionTrace` bilden side-safe, deterministische Entscheidungsframes ohne Auswahlwirkung. |
| `AI-PLAY-2` | `TacticalGoalUtility` normalisiert taktische Ziele in Utility-Familien ohne konkrete ActionId-Forderung. |
| `AI-PLAY-3` | `ActionGoalFit`, ScoreComponents und HardGates bewerten LegalAction-Kandidaten generisch gegen Ziele, Kosten, Timing, Risiko und Planbezug. |
| `AI-PLAY-4` | Threat- und Opportunity-Projektionen bündeln Gefahren und Chancen als diagnostische Entscheidungskomponenten. |
| `AI-PLAY-5` | `SemanticShadowDecision` erzeugt deterministische Rankings, Blocker-Erklärungen und Trace-Evidence ohne default Runtime-Wirkung. |
| `AI-PLAY-6` | Decision-Snapshot-Suite und Mistake-Taxonomie machen typische KI-Fehlerklassen reproduzierbar. |
| `AI-PLAY-7` | Lokaler Basic-/Setup-Pilot ist über `NETGRID_AI_PLAY_STRENGTH_PILOT=basic_setup` opt-in angebunden. |
| `AI-PLAY-8` | DecisionDebug-Formatierung wurde in Richtung `diagnostics/` extrahiert, ohne den Debug-Vertrag zu ändern. |

## Runtime-Wirkung

Default bleibt konservativ: Ohne `NETGRID_AI_PLAY_STRENGTH_PILOT=basic_setup` hat der neue Basic-/Setup-Pilot keine Runtime-Wirkung.

Bei explizitem lokalem Pilot-Flag darf der Spine nur Low-Risk-Entscheidungen übersteuern, wenn die Top-Shadow-Entscheidung legal ist, keine Blocker hat, deutlich besser bewertet ist und zu einer vorhandenen Semantic-Runtime-Choice passt. Erlaubt sind `gain_credit`, `draw_card`, sichere Setup-/Coverage-Installationen, Survival-/Cleanup-`remove_tag` und defensives `end_turn`.

Ausgeschlossen bleiben Run-, Access-, Rez-, Score-, Advance-, Damage-/Punish-, Target-Choice- und Random-/Self-Damage-Actions. Das Ranking erzeugt keine LegalActions und wählt nie eine Action außerhalb `input.legalActions`.

## Nicht geändert

- Keine Änderung an `packages/engine/**`.
- Keine Änderung an LegalAction-Erzeugung oder `applyAction`.
- Keine Änderung an Replay, StateHash oder Randomness.
- Keine neue Kartenfreigabe, keine produktive CardId-Sonderlogik.
- Keine Ausweitung von PlayerViews, AI-Inputs, Reconnect-Payloads, Logs, Debug oder Reports um verdeckte Gegnerinformationen.
- Kein Legacy-Removal; Legacy bleibt Referenz, expliziter Notaus und Fallback.

## Optimierungsschlüsse

- Die nächste Spielstärke-Schicht sollte weiter Shadow-first bleiben: erst Snapshot-/Benchmark-Evidence, dann enges Pilot-Flag, dann erst Scope-Promotion.
- Fehlerklassen wie `unsafe_run`, `missed_safe_access`, `ignored_remote_threat`, `missed_score_window`, `economy_starvation` und `bad_rez_spend` sind jetzt als Diagnoseachsen vorhanden und sollten in künftigen Selfplay-/Replay-Auswertungen gezielt befüllt werden.
- Die große `index.ts`-Fassade bleibt eine strukturelle Restschuld. AI-PLAY-8 hat nur einen sicheren Debug-Teil extrahiert; weitere Extraktionen sollten kleine reine Formatter, Report-Helfer oder Simulationstypen schneiden.
- Scoring und HardGates sind bewusst initiale Heuristiken. Belastbare Gewichtung braucht spätere Holdout-/Selfplay-Vergleiche gegen die neuen Snapshot-Klassen.

## Verifikation bis AI-PLAY-9

Paketbezogen grün:

```text
AI-PLAY-0: @netgrid/ai test, @netgrid/ai typecheck, git diff --check
AI-PLAY-1: semantic-decision-frame.test.ts, action-semantic-candidate.test.ts, @netgrid/ai typecheck, git diff --check
AI-PLAY-2: tactical-goal-utility.test.ts, runner-tactical-goals.test.ts, tactical-plans.test.ts, @netgrid/ai typecheck, git diff --check
AI-PLAY-3: action-goal-fit.test.ts, action-semantic-coverage.test.ts, @netgrid/ai typecheck, git diff --check
AI-PLAY-4: threat-opportunity.test.ts, runner-run-target-evaluation.test.ts, tactical-plans.test.ts, @netgrid/ai typecheck, git diff --check
AI-PLAY-5: semantic-shadow-decision.test.ts, semantic-ai-runtime-cutover.test.ts, @netgrid/ai typecheck, git diff --check
AI-PLAY-6: decision-snapshot-suite.test.ts, semantic-shadow-decision.test.ts, @netgrid/ai typecheck, git diff --check
AI-PLAY-7: semantic-basic-setup-pilot.test.ts, semantic-ai-runtime-cutover.test.ts, index.test.ts, @netgrid/ai typecheck, git diff --check
AI-PLAY-8: diagnostics/decision-debug.test.ts, semantic-ai-runtime-cutover.test.ts, index.test.ts, @netgrid/ai typecheck, git diff --check
```

`FINAL-GREEN` folgt als eigenes Abschlussgate nach diesem Report und muss den vollständigen `@netgrid/ai`-Testlauf, Typecheck, Diffcheck sowie die zentralen Runtime-Contract-Tests erneut bestätigen.

## Offene Grenzen

- Der neue Spine ist Diagnose- und Pilot-Infrastruktur, noch kein vollständiger neuer KI-Spieler.
- Die Snapshot-Suite enthält erste reproduzierbare Klassen, aber noch keinen breiten Matchkorpus.
- Der Basic-/Setup-Pilot ist lokal und default-off; eine breitere Aktivierung braucht eigene Metriken und Review.
- Weitere `index.ts`-Extraktionen bleiben sinnvoll, müssen aber paketweise und contract-getestet erfolgen.
