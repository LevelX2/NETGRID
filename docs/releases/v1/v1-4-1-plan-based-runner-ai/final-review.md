# V1.4.1 Final Review - Planbasierte Runner-KI

Stand: 2026-05-08
Status: passed

## Gate-Ergebnis

V1.4.1 ist implementiert, lokal geprüft und final reviewt. Die Runner-KI nutzt nun eine planbasierte AI-Level-2-Bewertung für Run-, Rig-, Economy-, Remote-Contest-, Asset-Trash- und Safe-Probe-Entscheidungen. Alle Aktionen bleiben LegalAction-basiert und werden weiter durch `applyAction` revalidiert.

Gate: `V1_4_1_implemented: true`; `V1_4_1_verified: true`; `V1_4_1_done: true`.

## Abdeckung

| Bereich | Ergebnis |
| --- | --- |
| RunnerPlanGenerator/RunnerPlanEvaluator | pass |
| Planarten `pressure_rnd`, `pressure_hq`, `contest_remote`, `build_rig`, `recover_economy`, `draw_for_answers`, `trash_asset`, `safe_probe_run` | pass |
| Evaluatoren RunnerRig, RunCost, ServerAccessValue, RemoteThreat, CorpScoringThreat | pass |
| Jack-out-, Access-, Trash- und Creditreserve-Bewertung | pass |
| DecisionDebug mit Unsicherheit statt Hidden-Info-Behauptung | pass |
| Legaler Fallback und Zeitbudget | pass |
| Hidden-State-Invariance | pass |
| Runner gegen Basic Corp und planbasierte Corp | pass |
| V1.4.0-Corp-Plan-KI-Regression | pass |
| No-Scope-Regression | pass |

## Pflichtchecks

- `git diff --check`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.
- `corepack pnpm e2e`: pass.

## Bekannte Grenzen

- V1.4.1 hat keinen Belief State. Unbekannte Korp-Karten bleiben unbekannt und werden im Debug als Unsicherheit geführt.
- Runner-Planung nutzt keine FullState-Simulation und keine verdeckten HQ-/R&D-/Remote-Titel.
- Reaktive Spezialfenster bleiben bewusst eng auf der bestehenden Heuristik.
- AI-Hints und Card-Roles bleiben Bewertungsdaten. Sie erzeugen keine Spielbarkeit und keine neue `ai_supported`-Freigabe.

## Freigabe

V1.4.1 ist grün. Das Gesamtziel V1.3.1 bis V1.4.1 ist fachlich vollständig umgesetzt, sofern der abschließende Arbeitsbaum- und Restpunktcheck keine offenen relevanten Änderungen zeigt.

