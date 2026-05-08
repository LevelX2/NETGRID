# V1.4.3 Implementation Review - Simulation, Selfplay und Exploit-Regression

Stand: 2026-05-08
Status: implemented

## Scope

V1.4.3 wurde nach grünem V1.4.2-Final-Gate umgesetzt. Der Release ergänzt eine lokale, faire Simulations- und Benchmark-Schicht für KI-Regressionen, ohne Hidden-State-Zugriff in den KI-Entscheidungspfaden.

## Umgesetzt

- Versionierte V1.4.3-Artefakte:
  - `data/ai/ai-benchmark-profiles-1.4.3.json`
  - `data/ai/ai-soak-seeds-1.4.3.json`
  - `data/scenarios/ai-v143-exploit-regression-fixtures.json`
- KI-Simulations- und League-Erweiterung in `packages/ai/src/index.ts`:
  - `SimulationControllerMode`, Benchmark-Profile, Holdout-Seeds, Exploit-Fixture-Typen.
  - `runV143SimulationLeague`, `runV143ExploitRegressionFixtures`, `evaluateV143TuningGate`.
  - deterministische, separat seedbare Simulations-RNG für `random_legal_bot`.
  - side-sichere Inputprüfung im Simulationsloop.
  - deckseitiger Simulations-Mechanikfilter über Runtime-Katalog-/`playable_mvp`-Gate.
  - erweiterte Simulationsmetriken inkl. Winrates, Agenda-Punkte, Replayfehler, Timeouts/Fallbacks.
- Fairness-/Belief-Anbindung:
  - `createBeliefSimulationWorld` erzeugt redaction-sichere Simulationswelten aus V1.4.2-Belief-State.
  - Decision-Pfade bleiben LegalActions-first und PlayerView-basiert.
- Testabdeckung in `packages/ai/src/index.test.ts` erweitert:
  - versionierte Benchmark- und Exploit-Artefakte.
  - Belief-Simulationswelt/Redaction-Safety.
  - Simulationsdeterminismus mit separater Simulations-RNG.
  - State-Isolation des echten Matchstates.
  - lokale League mit Holdout-Trennung.
  - Tuning-Gate-Regression/Improvement.
  - persistente Exploit-Regression-Fixtures.

## Requirements-Abgleich

| Bereich | Ergebnis |
| --- | --- |
| V143-MUST-001 | pass: Start nach grünem V1.4.2-Final-Gate. |
| V143-MUST-002 | pass: KI-Simulationsentscheidungen bleiben PlayerView-/LegalActions-basiert; Belief-Welten sind side-sicher ableitbar. |
| V143-MUST-003 | pass: Simulation nutzt eigene State-Instanzen; Isolationstest ist vorhanden. |
| V143-MUST-004 | pass: LegalActions werden pro Simulationsschritt aus dem aktuellen Simulationsstate neu berechnet. |
| V143-MUST-005 | pass: Simulations-RNG ist deterministisch, seedbar und vom Match-RNG getrennt. |
| V143-MUST-006 | pass: Choice-Pfade nutzen legale deterministische Auflösung/Fallback; kein Hängen im Simulationslauf. |
| V143-MUST-007 | pass: nicht `playable_mvp`-Karten werden im Simulationsdeckpool blockiert. |
| V143-MUST-008 | pass: versionierte Benchmark-Gegnerprofile sind vorhanden. |
| V143-MUST-009 | pass: Tuning- und Holdout-Seeds sind getrennt und im Report auswertbar. |
| V143-MUST-010 | pass: Soak-/League-Metriken enthalten illegale Actions, Timeouts, Fallbacks, Winrates, Agenda-Punkte, Züge und Replayfehler. |
| V143-MUST-011 | pass: Exploit-Fälle sind als persistente Fixture-Datei und Testpfad hinterlegt. |
| V143-MUST-012 | pass: Decision-/Belief-Debug bleibt redaction-sicher ohne Hidden-Info-Felder. |
| V143-MUST-013 | pass: Holdout-basierte Tuning-Gate-Auswertung ist implementiert. |
| V143-MUST-014 | pass: keine Kartenstatus-Freigaben (`playable`/`ai_supported`) im V1.4.3-Scope. |
| V143-MUST-015 | pass: keine Public-Replay-, Spectator-, Account-, Matchmaking-, Ranking- oder Turnierfunktion eingeführt. |

## Benchmark-/Soak-Ergebnis (lokal)

Lokaler Reportlauf mit `demo_runner_008`/`demo_corp_008`:

- Seeds: 6 Tuning + 3 Holdout.
- Profile: 7 (`random_legal_bot`, `basic_corp_ai`, `basic_runner_ai`, `plan_corp_v1_4_0`, `plan_runner_v1_4_1`, `belief_ai_v1_4_2`, `current_candidate`).
- Ergebnis: 0 illegale Actions, 0 Replayfehler, 0 Timeouts in allen Profilen.
- Exploit-Fixtures: `v143-rnd-repeat-access-freshness` und `v143-visible-etr-blocker-no-repeat-run` beide `passed: true`.
- Holdout-Gate (current candidate vs belief baseline): `accepted: true`, Delta in Safety-/Replay-Metriken = 0.

## Verifikation

- `corepack pnpm --filter @netgrid/ai typecheck`: pass.
- `corepack pnpm --filter @netgrid/ai test`: pass (73 Tests).
- `git diff --check`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass (nur bekannte nicht-blockierende Turbopack-NFT-Warnung im bestehenden Web-Katalogpfad).

## No-Scope-Bestätigung

Keine neuen Kartenfreigaben, keine neuen Mechanikfamilien, kein Kartentextparser, keine Public-Replay-/Spectator-/Account-/Matchmaking-/Ranking-/Turnierfunktion, keine offiziellen Assets, kein LLM-Regelakteur und keine Hidden-Info-Leaks in KI-Inputs/Reports.
