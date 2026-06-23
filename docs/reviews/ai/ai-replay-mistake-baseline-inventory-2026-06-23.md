# KI-Replay-Fehleranalyse: Baseline-Inventar

Stand: 2026-06-23  
Paket: `REPLAY-AI-0`  
Arbeitsbranch: `codex/ai-replay-mistake-iteration`  
Worktree: `C:\Projekte\NETGRID_AI_REPLAY_MISTAKE_ITERATION`

## Zweck

Dieses Paket legt die belastbare Ausgangslage fuer die iterative Verbesserung der NETGRID-KI aus lokal gespeicherten Spielen fest. Es entscheidet noch keine KI-Fehler. Es bestimmt nur, welche lokalen Quellen fuer die naechsten Pakete geeignet sind, welche Grenzen wegen Hidden-Info gelten und welche Baseline-Checks vor der Extraktion stabil laufen.

## Datenquellen

Die Laufzeitdaten liegen nicht im Paket-Worktree, sondern im lokalen Runtime-Verzeichnis des Hauptprojekts. Sie wurden read-only ausgewertet.

| Quelle | Status | Umfang | Verwendung |
| --- | ---: | ---: | --- |
| `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite` | vorhanden, zuletzt 2026-06-23 | 655.503.360 Bytes | Primaere lokale Quelle fuer Matches, Events, Snapshots und KI-Decision-Traces |
| `C:\Projekte\NETGRID\data\runtime\multiplayer\netrunner.sqlite` | vorhanden, zuletzt 2026-05-08 | 70.918.144 Bytes | Legacy-/Vergleichsquelle, nicht primaer fuer neue KI-Iteration |
| `C:\Projekte\NETGRID\data\runtime\multiplayer\matches.json` | vorhanden, zuletzt 2026-05-06 | 38.263.894 Bytes, 46 Matches | Legacy-Quelle, nur bei konkretem Repro-Bedarf |
| `C:\Projekte\NETGRID\data\scenarios` | vorhanden | 127 JSON-Szenarien, davon 48 AI-/Replay-/Trace-nahe Dateien | Kontroll- und Regressionsquellen |
| `docs/reviews/ai` | vorhanden | viele historische Selfplay-/Trace-/Scorecard-Reviews | Kontext fuer bekannte Muster, nicht als aktuelle Fehlerentscheidung allein |

## SQLite-Inventar

Relevante Tabellen:

| Tabelle | Zweck fuer Folgepakete |
| --- | --- |
| `matches` | Match-Metadaten und lokales `record_json` |
| `events` | oeffentliche Event-Payloads mit Hidden-Info-Barriere |
| `engine_events` | Engine-Eventfolge fuer Replay-/Hash-Abgleich |
| `state_snapshots` | lokale FullState-Snapshots; nur fuer Forensik, nicht als KI-Wissensquelle |
| `ai_decision_traces` | primaere KI-Entscheidungsspur fuer DecisionCases |
| `game_states` | aktueller lokaler FullState; nur fuer Forensik |

Gesamtzaehlung:

| Kennzahl | Wert |
| --- | ---: |
| Matches | 71 |
| Events | 8.449 |
| Engine-Events | 7.974 |
| State-Snapshots | 8.449 |
| Action-Receipts | 4.088 |
| Private Deck Snapshots | 71 |
| KI-Decision-Traces | 1.494 |
| Matches mit KI-Decision-Traces | 26 |
| Trace-Zeitraum | 2026-05-22 bis 2026-06-23 |

Match-Verteilung:

| Dimension | Wert | Anzahl |
| --- | --- | ---: |
| Status | `finished` | 36 |
| Status | `active` | 30 |
| Status | `forfeited` | 4 |
| Status | `cancelled` | 1 |
| Modus | `human_corp_vs_runner_ai` | 42 |
| Modus | `human_runner_vs_corp_ai` | 24 |
| Modus | `human_vs_human` | 5 |

Trace-Verteilung:

| Dimension | Wert | Anzahl |
| --- | --- | ---: |
| Seite | `runner` | 1.464 |
| Seite | `corp` | 30 |
| Schema | `ai-decision-trace-v1` | 1.494 |

Haeufigste ausgefuehrte Aktionstypen:

| Aktionstyp | Traces |
| --- | ---: |
| `start_run` | 255 |
| `gain_credit` | 210 |
| `continue_run` | 201 |
| `access_card` | 189 |
| `end_turn` | 166 |
| `install_card` | 71 |
| `resolve_choice` | 66 |
| `decline_trash` | 63 |
| `draw_card` | 61 |
| `activated_card_ability` | 42 |

Haeufigste Planarten:

| Planart | Traces |
| --- | ---: |
| `access_trash_steal` | 285 |
| `simple_run_choice` | 210 |
| `runner.build_credit_base` | 181 |
| `end_turn` | 165 |
| `runner.obtain_breaker_coverage` | 149 |
| `runner.opportunistic_central_run` | 92 |
| `runner.contest_remote` | 71 |
| `choice_resolution` | 66 |
| `runner.develop_hand_card` | 55 |
| `encounter_survival` | 44 |

## Datenqualitaet

Die Datenlage ist fuer eine erste Runner-KI-Iteration geeignet:

- Die Traces sind fast vollstaendig Runner-lastig. Die erste umsetzbare Iteration soll deshalb Runner-Fehlercluster priorisieren.
- Corp-KI ist mit nur 30 Traces lokal noch nicht ausreichend breit belegt. Corp-Funde duerfen markiert werden, aber erst nach Repro- oder Zusatzdaten als Fix-Cluster gelten.
- `ai_decision_traces.trace_json` enthaelt die relevanten sichtbarkeitsorientierten Entscheidungsfelder wie `selectedActionType`, `planKind`, `rankedAlternatives`, `scoreBreakdown`, `visibleReasons`, `warnings`, `whyNot`, `facts`, `hypotheses` und `opponentModel`.
- `matches.record_json`, `state_snapshots.game_state_json` und `game_states.game_state_json` enthalten FullState-/private Daten. Sie sind fuer frueheste vermeidbare Ursache, Replay-Anker und LegalAction-Rekonstruktion lokal nutzbar, duerfen aber nicht als KI-Wissensquelle oder versionierter Rohinhalt verwendet werden.

## Discovery-/Holdout-Regel

Die 26 Matches mit KI-Decision-Traces werden deterministisch nach `sha256(matchId)[0] % 10` getrennt:

- Bucket 0 bis 7: Discovery
- Bucket 8 bis 9: Holdout

Ergebnis:

| Split | Matches |
| --- | ---: |
| Discovery | 20 |
| Holdout | 6 |

Holdout-Matches werden in `REPLAY-AI-1` bis `REPLAY-AI-4` nicht zum Auswaehlen oder Justieren eines Fehlerclusters genutzt. Sie sind erst in `REPLAY-AI-5` fuer Regression, Nebenwirkungspruefung und Generalisierung zulaessig.

## Baseline-Checks

Vor dem Paketbericht wurde die neue Worktree-Umgebung mit `corepack pnpm install` eingerichtet. Der Lockfile war unveraendert.

| Check | Ergebnis |
| --- | --- |
| `corepack pnpm --filter @netgrid/ai typecheck` | gruen |
| `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/selfplay-trace-mining.test.ts src/evaluation/selfplay-decision-snapshot-mining.test.ts --maxWorkers=1 --testTimeout=30000` | gruen, 2 Testdateien, 5 Tests |

## Folgerung fuer `REPLAY-AI-1`

Die naechste Stufe extrahiert side-safe DecisionCases aus `ai_decision_traces` und verknuepft sie nur mit oeffentlichen Events, LegalAction-/StateVersion-Ankern und lokal reproduzierbaren Forensikmarkern. Die erste Kandidatensuche soll wegen der Datenlage auf Runner-Entscheidungen beginnen, insbesondere in den Feldern:

- `access_trash_steal`
- `simple_run_choice`
- `runner.build_credit_base`
- `runner.obtain_breaker_coverage`
- `runner.contest_remote`
- `encounter_survival`

Nicht zulaessig fuer Fehlerentscheidungen:

- Matchausgang allein
- Shadow-/Alternativentscheidung allein
- FullState-Wissen, das nicht aus legaler KI-Sicht verfuegbar war
- MatchId-, StateVersion- oder Einzelfall-Sonderlogik
- Engine-, LegalAction- oder Harness-Probleme als KI-Spielstaerke-Fix

