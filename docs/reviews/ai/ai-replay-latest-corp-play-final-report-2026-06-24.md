# AI Replay Latest Corp Play Final Report 2026-06-24

Status: ready_for_local_main_merge

## Quelle

Analysiert wurde das letzte abgeschlossene lokale Match `match_7eb5afffa3245650` aus `data/runtime/multiplayer/netgrid.sqlite`.

- Modus: `human_runner_vs_corp_ai`
- Ergebnis: Korp gewinnt per Flatline
- StateVersion: `96`
- AI-Decision-Traces: `41`
- Korp-Profil: `corp-ai-v0.9-hard`

Die spätere Partie `match_ab44ac886c5dbf49` war zum Analysezeitpunkt noch `active` und wurde nicht als abgeschlossenes Spiel verwendet.

## Ergebnis der Replay-Analyse

Die Replay-Fehler lagen nicht in der Rules Engine und nicht in falschen Hints. Die Hints für `Chance Observation`, `Urban Renewal`, `Closed Accounts`, `City Surveillance` und `BBS Whispering Campaign` waren fachlich passend.

Belegte Fehlergruppen:

1. Aktivierte Korp-Card-Economy wie `BBS Whispering Campaign: 2 Credits nehmen` verlor gegen Basic-`gain_credit`.
2. `Chance Observation` wurde als Tag-Enabler mit sichtbarem Payoff-Kontext zu spät genutzt.
3. `City Surveillance` wurde als ungeschütztes persistentes Tag-Asset zu hoch bewertet.

Nicht als konkreter Fehler dieses Matches belegt:

- `trash_resource` war erst im finalen Kill-Fenster legal; dort war `Urban Renewal` besser.
- `Schlaghund` erschien in keinem Korp-Decision-Trace als LegalAction oder Alternative.

## Umgesetzt

In `packages/ai/src/index.ts`:

- `corp_card_action_economy_gain`: generische Korp-Card-Economy-Komponente für side-safe sichtbare Credit-Gain-Aktionen aus Label, Payload oder ResolvedEffects.
- `corp_tag_source_visible_payoff_pressure`: generische Tag-Source-Komponente für sofortige Tag-/Trace-Quellen mit sichtbarem tagabhängigem Payoff.
- `corp_unprotected_tag_asset_setup_penalty`: Abschlag für ungeschützte persistente Remote-Tagquellen, wenn eine sofortige Operation-Tagquelle mit Payoff-Kontext legal ist.

In `packages/ai/src/index.test.ts`:

- Positive Regressionen für BBS, Chance Observation und City Surveillance.
- Gegenproben für opake Card-Abilities ohne Credit-Gain und Tag-Source ohne sichtbaren Payoff-Bonus.

## Verifikation

Grün:

- `tsc -p packages/ai/tsconfig.json --noEmit`
- `vitest run packages/ai/src/index.test.ts --testNamePattern "installed Corp economy payouts|semantic runtime|opaque Corp abilities|immediate trace tag source|visible-payoff tag-source|unprotected persistent tag-asset"`: 8 Tests passed
- `vitest run packages/ai/src/index.test.ts`: 532 Tests passed
- `prettier --check` für geänderte AI- und Review-Artefakte
- `git diff --check`

Breiter Zusatzlauf:

- `vitest run packages/ai/src`: 140 von 141 Testdateien und 1594 von 1595 Tests grün.
- Restfehler: `packages/ai/src/simulation/benchmark-reports.test.ts` meldet im Seed `ai-v143-tuning-001` eine bestehende Runner-Access-/Trash-Invalid-Target-Situation nach unverändertem frühem Spielstart. Die betroffene Sequenz liegt nicht in den geänderten Korp-Scoring-Komponenten und bleibt als separater Benchmark-/Runner-Access-Follow-up zurück.

## Integration

Arbeitsbranch: `codex/ai-replay-latest-corp-play`

Worktree: `C:\Projekte\NETGRID_AI_LATEST_CORP_REPLAY`

Der Branch ist nach diesem Abschlusscommit für den lokalen Merge nach `main` vorgesehen. Der Hauptworkspace enthält weiterhin fremde, nicht zu diesem Paket gehörende Engine-/Run-Änderungen; die Branch-Dateien überschneiden sich damit nicht.
