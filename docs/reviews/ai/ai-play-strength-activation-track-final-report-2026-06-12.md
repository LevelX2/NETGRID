# AI Play-Strength Activation Track Final Report 2026-06-12

## Status

`implemented_pending_final_green`

Arbeitsbranch: `codex/ai-play-strength-activation-track`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI_PLAY_STRENGTH_ACTIVATION_TRACK`

## Ergebnis

Die Paketserie aktiviert den AI Play-Strength Decision Spine kontrolliert weiter: Redaction ist zentralisiert, neutrale Ziele verhindern leere Shadow-Rankings, RunTargets werden auf konkrete `start_run`-LegalActions ausgerichtet, echte Engine-Szenarien speisen eine Shadow-League, und Kalibrierung sowie zwei lokale Pilot-Scopes bleiben explizit opt-in.

Der Vertrag bleibt erhalten: Engine, LegalAction-Erzeugung, `applyAction`, Replay, StateHash, Randomness und Hidden-Info-Grenzen wurden nicht erweitert. Die neuen Piloten erzeugen keine LegalActions und wählen nur aus vorhandenen `input.legalActions`. Default-Runtime bleibt unverändert; zusätzliche Runtime-Wirkung entsteht nur lokal per `NETGRID_AI_PLAY_STRENGTH_PILOT`.

## Paketabschlüsse

| Paket | Commit | Ergebnis |
| --- | --- | --- |
| Prozess | `ab7ee951` | Prozessartefakt für die Activation-Track-Serie erstellt. |
| `AI-ACT-0` | `ecd2f665` | Vorherige Follow-up-Dokumentation auf lokalen `main`-Abschluss synchronisiert. |
| `AI-ACT-1` | `f3d6d80a` | Gemeinsame Semantic-Redaction-Utilities prüfen Keys und String-Werte case-insensitive. |
| `AI-ACT-2` | `8253d99b` | No-goal Frames erhalten side-sichere Neutralziele und ranken LegalActions. |
| `AI-ACT-3` | `4602f445` | Run-Opportunity-/Threat-Boni binden an passende Run-Ziel-LegalActions. |
| `AI-ACT-4` | `688ff635` | Real-Engine-Decision-Corpus mit zwölf Runner-/Corp-Szenarien aus echten LegalActions. |
| `AI-ACT-5` | `67c7d1df` | Report-only Semantic Shadow League aggregiert Agreement, Mistakes, Scores und Blocker. |
| `AI-ACT-6` | `84503d1b` | `baseline_v1` reproduziert Default-Scores; `shadow_calibrated_v1` bleibt shadow-only. |
| `AI-ACT-7` | `652e36ec` | Lokaler `runner_safe_access`-Pilot erlaubt nur gegatete sichere HQ/R&D-Runs. |
| `AI-ACT-8` | `8c25f28b` | Lokaler `corp_score_window`-Pilot erlaubt nur legales `score_agenda`, kein Advance/Rez. |
| `AI-ACT-9` | `8e500889` | TargetChoice-Shadow rankt legale Optionen diagnostisch ohne `selectedChoices`. |
| `AI-ACT-10` | `a6a65ba1` | Reine Debug-Format-Helfer aus `index.ts` extrahiert. |

## Neue lokale Pilot-Scopes

- `NETGRID_AI_PLAY_STRENGTH_PILOT=basic_setup`: bestehender Basic-/Setup-Pilot.
- `NETGRID_AI_PLAY_STRENGTH_PILOT=runner_safe_access`: nur Runner-`start_run`, nur HQ/R&D, nur `run_now`, `reachable`, ohne ScoreThreat, mit passendem RunTarget.
- `NETGRID_AI_PLAY_STRENGTH_PILOT=corp_score_window`: nur Corp-`score_agenda` bei `corp_scoreline`-Top-Trace.

## Grenzen

- Keine produktive Übernahme von `shadow_calibrated_v1`.
- Keine TargetChoice-Auswahl; das neue Ranking ist report-only.
- Keine Remote-Contest-Übernahme im Runner-Pilot.
- Kein Corp-Advance-, Install- oder Rez-Cutover im Corp-Pilot.
- Keine Engine-, Kartenpool-, LegalAction-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.

## Paketverifikation

Während der Paketarbeit wurden jeweils fokussierte Vitest-Läufe, Typecheck und `git diff --check` ausgeführt. Besonders relevante Gates:

- Real-Engine-Corpus, DecisionSnapshotSuite und ActionSemanticCoverage grün.
- Semantic Shadow League, Calibration, Runtime-Cutover und Pilot-Tests grün.
- TargetChoice-Shadow und ActionSemanticCandidate/Coverage grün.
- Diagnostics-Cut plus Runtime-Debug-Nachbarschaft grün.

## FINAL-GREEN

Noch ausstehend in diesem Bericht:

- vollständiger `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`
- lokale Integration nach `main`
- Hauptworkspace-Verifikation
- Entfernung des Arbeits-Worktrees

Der Status darf erst danach auf `complete` wechseln.
