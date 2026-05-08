# V1.4.0 Final Review - Planbasierte Corp-KI

Stand: 2026-05-08
Status: passed

## Gate-Ergebnis

V1.4.0 ist implementiert, lokal geprüft und final reviewt. Die Corp nutzt nun eine planbasierte AI-Level-2-Bewertung für strategische Aktionsphasen. Alle Aktionen bleiben LegalAction-basiert und werden weiter durch `applyAction` revalidiert.

Gate: `V1_4_0_implemented: true`; `V1_4_0_verified: true`; `V1_4_0_done: true`; `ready_for_V1_4_1_implementation: true`.

## Abdeckung

| Bereich | Ergebnis |
| --- | --- |
| PlanGenerator/PlanEvaluator | pass |
| Planarten `score_now`, `score_next_turn`, `build_scoring_remote`, `protect_hq`, `protect_rnd`, `recover_economy`, `bait_runner` | pass |
| Evaluatoren AgendaRisk, ServerThreat, EconomyReserve, IceRez, ScoringWindow, RemoteIntentMemory | pass |
| DecisionDebug Side-Safety | pass |
| Legaler Fallback und Zeitbudget | pass |
| Benchmark gegen alte Corp-Heuristik | pass |
| Human-vs-Corp-KI-Smoke | pass |
| KI-vs-KI-Smoke | pass |
| Runner-KI bleibt nicht planbasiert | pass |
| No-Scope-Regression | pass |

## Pflichtchecks

- `git diff --check`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.
- `corepack pnpm e2e`: pass.

## Bekannte Grenzen

- V1.4.0 plant ausschließlich die Corp. Runner-Planung ist V1.4.1 vorbehalten.
- Reaktive Corp-Fenster wie Choice, Trace, Mandatory Draw, Rez, Resource-Trash und Purge bleiben absichtlich auf der bestehenden Heuristik.
- AI-Hints und Card-Roles bleiben Bewertungsdaten. Sie erzeugen keine Spielbarkeit und keine neue `ai_supported`-Freigabe.
- Es gibt keinen Belief State und keine FullState-Simulation.

## Freigabe

V1.4.0 ist grün. V1.4.1 Planbasierte Runner-KI darf als nächste Phase starten.

