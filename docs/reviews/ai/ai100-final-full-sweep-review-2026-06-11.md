# AI100 Final Full Sweep Review

Datum: 2026-06-11

Branch: `codex/ai095-ai100-action-limit-closure`

Finaler Trace: `docs/reviews/ai/ai100-final-a-d-5seed-2026-06-11.json`

## Ergebnis

AI100 schließt den Folgeblock AI095-AI100 technisch grün ab:

- Frozen install grün
- Root-Test grün
- Workspace-Typecheck grün
- Rekursiver Workspace-Test grün
- Explizite Pakettests für AI, Engine, Server und Web grün
- `git diff --check` grün
- finaler A-D/5-Seed-Trace ohne Illegal Actions, Replay-Failures oder Redaction-Fails

Die harte Safety-Lage bleibt stabil. Die Action-Limit-Zielmarke `<= 8` wird weiterhin nicht erreicht; der finale Stand bleibt bei `actionLimitReached = 10`. Dieser Restbefund ist nach AI096-AI099 aber neu qualifiziert: Die früheren Sammelursachen `late_gain_credit_without_funding_need` und `late_run_step_stall` sind im finalen Trace jeweils 0. Die Restfälle sind Runner-Reserve, einzelne Run-Microsteps und gemischte Endfenster.

AI099 hat zusätzlich einen klaren Engine-Fehler geschlossen: The Shell Traders entfernt einen finalen Shell-Counter nur noch, wenn die anschließende kostenlose Installation aktuell legal ist. Der vorher im 10-Seed-Watch gefundene Turnwechsel-Fehler ist damit weg.

## Verifikation

### Dependency-Check

```powershell
corepack pnpm install --frozen-lockfile
```

Ergebnis: grün. Hinweis: pnpm meldete nur die bestehende Warnung zu ignorierten Build-Scripts für `esbuild` und `sharp`.

### Root-Test

```powershell
corepack pnpm test
```

Ergebnis:

- `packages/shared`: 1 Datei, 3 Tests grün
- `packages/catalog`: 2 Dateien, 14 Tests grün
- `packages/engine`: 157 Dateien, 1458 Tests grün
- `packages/decks`: 1 Datei, 15 Tests grün
- `packages/ai`: 63 Dateien, 1107 Tests grün
- `apps/web`: 33 Dateien, 415 Tests grün
- `apps/server`: 6 Dateien, 127 Tests grün
- Root-Specs: 2 Dateien, 5 Tests grün

### Workspace-Typecheck

```powershell
corepack pnpm -r --if-present run typecheck
```

Ergebnis: alle Workspace-Projekte grün.

### Rekursiver Testlauf

```powershell
corepack pnpm -r --if-present run test
```

Ergebnis:

- `packages/shared`: 1 Datei, 3 Tests grün
- `packages/catalog`: 2 Dateien, 14 Tests grün
- `packages/engine`: 157 Dateien, 1458 Tests grün
- `packages/decks`: 1 Datei, 15 Tests grün
- `packages/ai`: 63 Dateien, 1107 Tests grün
- `apps/web`: 33 Dateien, 415 Tests grün
- `apps/server`: 6 Dateien, 127 Tests grün

### Paketchecks

```powershell
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/engine test
corepack pnpm --filter @netgrid/server test
corepack pnpm --filter @netgrid/web test
```

Ergebnis:

- `@netgrid/ai`: 63 Dateien, 1107 Tests grün
- `@netgrid/engine`: 157 Dateien, 1458 Tests grün
- `@netgrid/server`: 6 Dateien, 127 Tests grün
- `@netgrid/web`: 33 Dateien, 415 Tests grün

Ein paralleler Paketcheck-Versuch ließ `@netgrid/web` einmal in `catalog-data.test.ts` nach 5000 ms timeouten. Der vorherige Root-Test, der rekursive Testlauf und der isolierte `@netgrid/web test` waren grün; der Timeout wird deshalb als Lastartefakt des parallelen Verify-Versuchs gewertet.

### Finaler Trace

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai100-final-a-d-5seed-2026-06-11.json --max-actions 160 --max-findings 50
```

Quelle: `docs/reviews/ai/ai100-final-a-d-5seed-2026-06-11.json`

| Metrik | Wert |
| --- | ---: |
| Spiele | 20 |
| Entscheidungen | 2501 |
| Critical Findings | 0 |
| High Findings | 3 |
| Illegal Actions | 0 |
| Replay Failures | 0 |
| Redaction Safe | 1 |
| `actionLimitReached` | 10 |
| `unsafeScoreChosen` | 3 |
| `repeated_no_progress_run` | 33 |
| `scoreWindowMissed` | 0 |
| `passiveActionWithScoreLineAvailable` | 2 |
| `corpAgendaScores` | 12 |
| `runnerAgendaSteals` | 32 |
| `corpFlatlines` | 5 |

Action-Limit-Cluster:

| Cluster | Matches |
| --- | ---: |
| `action_limit_low_value_repeat` | 7 |
| `action_limit_setup_economy_loop` | 1 |
| `action_limit_mixed_or_unknown` | 2 |
| `action_limit_runner_repeated_no_progress_run` | 0 |
| `action_limit_runner_remote_contest_blocked` | 0 |
| `action_limit_corp_scoreline_stall` | 0 |

Action-Limit-Subcluster:

| Subcluster | Matches |
| --- | ---: |
| `late_gain_credit_without_funding_need` | 0 |
| `runner_late_gain_credit_real_reserve` | 5 |
| `corp_late_gain_credit_real_rez_or_protection_reserve` | 0 |
| `corp_late_gain_credit_no_safe_alternative` | 0 |
| `late_run_step_stall` | 0 |
| `run_microstep_required` | 1 |
| `continue_chain_to_access` | 0 |
| `break_pump_required` | 1 |
| `continue_without_progress` | 1 |
| `mixed_unknown` | 2 |

### Diff-Hygiene

```powershell
git diff --check
```

Ergebnis: grün.

## Schlussfolgerung

Der Folgeblock ist integrationsbereit. `actionLimitReached <= 8` bleibt als fachlicher Restpunkt offen, aber nicht als klar isolierter Bug. Der nächste sinnvolle Schnitt sollte keine generische Action-Penalty hinzufügen, sondern die verbliebenen Restklassen einzeln mit neuen Replay-Fixtures untersuchen.

Empfohlene Folgeoptimierungen:

- Runner-Reserve-Credit-Fälle mit Board-/Funding-Outcome über mehrere Züge bewerten.
- `continue_without_progress` als einzelnes Replay-Fixture isolieren, bevor Runtime bestraft wird.
- Gemischte Endfenster stärker nach letzter echter Progress-Aktion und serverseitigem Payoff clustern.
