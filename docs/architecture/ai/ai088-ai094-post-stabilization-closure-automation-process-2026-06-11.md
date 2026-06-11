# AI088-AI094 Post-Stabilization Closure Automation Process 2026-06-11

## Status

`in_progress`

Arbeitsbranch: `codex/ai088-ai094-post-stabilization-closure`

Arbeits-Worktree: `C:\Projekte\NETGRID_AI088_AI094_POST_STABILIZATION_CLOSURE`

Hauptworkspace: `C:\Projekte\NETGRID`

Primärer Agent: `release-implementation-agent`

## Quelle/Vorgabe

Quelle ist die Nutzer-Vorgabe vom 2026-06-11 mit der Ergebnisanalyse nach AI073-AI080 und dem nachgelagerten Fix `Hide Forged Activation Orders without unrezzed ICE`.

Die Vorgabe nennt als aktuellen Integrationsstand:

```text
ca40ebe075dde3335e734dc0cd8bdfa7fbb7e5ca
Hide Forged Activation Orders without unrezzed ICE
```

Der Prozess folgt dem Skill `paketprozess-worktree-goal`: eigener Worktree, sequenzielle Pakete, dokumentierte Verifikation, Commit je Paket, finaler lokaler Merge nach `main`, kein Push.

## Zielprüfung

Die Vorgabe ist für direkte Umsetzung ausreichend präzise.

Bestimmbar sind:

- Gesamtziel: Den aktuellen `main` nach den post-AI080-Fixes vollständig rebaselinen, Root-Test-Reste schließen und die verbleibenden AI-Metrikziele gezielt verbessern.
- Reihenfolge: AI088, AI089, AI090, AI091, AI092, AI093, AI094, finaler lokaler Merge.
- Scope: primär `packages/ai`, fokussierte Engine-/Server-Testreparaturen nur bei bestätigten Root-Test-Fehlern, Review-Artefakte unter `docs/reviews/**` und dieses Prozessartefakt.
- Nicht-Ziele: keine neue Engine-Regelautorität, keine Hidden-Info-Ausweitung, keine Testlockerung, keine pauschale Detector-Stummschaltung, kein Push.
- Akzeptanz: Current-HEAD-Trace mit aktuellem Git-Stand, grüne Root-/AI-/Engine-/Server-Tests oder konkret isolierte Restfehler, sinkende Zielmetriken oder präzise Restcluster, finaler Full Sweep.

## /Goal

NETGRID-Folgeaufträge AI088 bis AI094 gemäß `paketprozess-worktree-goal` umsetzen: Current-HEAD-Rebaseline, Root-Test-Closure, Action-Limit-, Scoreline- und Runner-Progress-Optimierungen, TargetContext-Coverage, finalen Full Sweep, Commit je Paket, lokalen Merge nach `main` und Worktree-Aufräumung.

## Gesamtziel

Der aktuelle NETGRID-`main` wird nach AI073-AI080 und den nachgelagerten Fixes belastbar abgeschlossen:

1. Der aktuelle HEAD wird vollständig mit Tests und A-D x 5 Trace-Mining neu gemessen.
2. Root-Test-Regressionsreste werden behoben, sofern sie noch auf aktuellem HEAD reproduzierbar sind.
3. Die verbleibenden KI-Qualitätsziele werden eng und belegbar verbessert:
   - `actionLimitReached` unter 11, Ziel höchstens 8.
   - `unsafeScoreChosen` unter 6, Ziel höchstens 3.
   - `repeated_no_progress_run` unter 35, Ziel höchstens 33.
4. ActionSemanticCandidate-TargetContext-Coverage wird read-only erweitert.
5. Der finale Stand ist lokal auf `main` integriert und ohne Worktree-Reste abgeschlossen.

## Bekannte Ausgangslage aus der Analyse

Die AI080-Endanalyse war nicht auf dem aktuellen `main` gelaufen, sondern auf:

```text
e68e8dce
```

Der aktuelle `main` enthält danach:

- `3ed8c0bd` Merge `codex/ai073-ai080-selfplay-stabilization`
- `3a3d8250` Junkyard-BBS-Recovery-Fix
- `ca40ebe0` Forged-Activation-Orders-LegalAction-Fix

Offene AI080-Zielwerte:

| Metrik | AI080-Wert | Ziel |
| --- | ---: | ---: |
| `actionLimitReached` | 11 | <= 8 |
| `repeated_no_progress_run` | 35 | <= 33 |
| `unsafeScoreChosen` | 6 | <= 3 |

Bekannte rote Root-Test-Cluster aus der Analyse:

- Proteus-Manifest-Drift.
- Hidden/R&D/Archives-Smokes mit fehlender LegalAction.
- Corolla Speed Chip recurring credit.
- PlayerView remote root order.

Diese Cluster werden nur bearbeitet, wenn sie auf dem aktuellen Arbeitsstand reproduzierbar bleiben.

## Nicht-Ziele

- Keine Änderung an der Autorität der Rules Engine.
- Keine direkte LegalAction-Erzeugung in der KI.
- Keine Abschwächung von `applyAction`, StateVersion-, Timing-, Kosten-, Ziel- oder Choice-Validierung.
- Keine Hidden-Info-Ausweitung in PlayerViews, PublicEvents, KI-Inputs, WebSocket-, Reconnect-, Undo-, Replay-, Log- oder Client-Fehlerpfaden.
- Keine Änderung an Replay-Determinismus, StateHash, Seed, RandomCounter oder RandomDrawRecords.
- Keine offizielle Artwork-, Card-Frame-, Logo-, Card-Back- oder externe Kartendatenbank-Integration.
- Kein kartenspezifisches oder seed-spezifisches Tuning.
- Kein `skip`, `only`, Testlöschen oder pauschales Assertion-Lockern.
- Kein Push und keine PR.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Jedes Paket endet mit einem eigenen Commit.
- Nach jedem Paket läuft `git diff --check`.
- Codepakete führen die betroffenen Typechecks und Tests aus.
- Runtime- oder Detector-Änderungen werden mit A-D x 5 Trace-Mining oder einem dokumentierten lokalen Blocker belegt.
- AI-Änderungen priorisieren ausschließlich bestehende `LegalActions`.
- Debug-, Report- und Trace-Ausgaben bleiben redigiert und side-safe.
- Metriken begründen Verhalten; sie ersetzen keine Legalitätsprüfung.
- Root-Test-Reparaturen erhalten den Testgegenstand und schließen nur klar reproduzierbare Ursachen.

## Automatische Fehlerbehandlung

- Rote Checks werden im aktiven Paket eingegrenzt und eng behoben.
- Wenn ein Root-Test-Fehler auf aktuellem HEAD nicht reproduzierbar ist, wird er im Review als geschlossen/nicht reproduzierbar dokumentiert statt künstlich repariert.
- Wenn eine AI-Optimierung Safety-Werte verschlechtert, wird sie enger gegatet oder verworfen.
- Wenn eine Zielmetrik nicht erreicht wird, muss der Restcluster konkret benannt werden.
- Detector-Änderungen brauchen reproduzierbare False-Classification-Evidence.
- Mergekonflikte werden defensiv gelöst, ohne fremde fachliche Änderungen zu entfernen.

## Sicherheitsblocker

Der Prozess stoppt ohne Merge nach `main`, wenn einer dieser Punkte bestätigt ist:

- Eine KI wählt eine nicht legale oder nicht in `input.legalActions` enthaltene Action.
- Eine Änderung nutzt oder leakt verdeckte gegnerische Kartendaten.
- Engine-Regelvalidierung, LegalAction-Erzeugung oder `applyAction` müsste für KI-Komfort geschwächt werden.
- Replay-Determinismus oder StateHash würden durch KI-Diagnostik beeinflusst.
- Ein Detector müsste ohne reproduzierbare Fehlklassifikation abgeschwächt werden.
- Tests lassen sich nur durch `skip`, `only`, Testlöschung oder Assertion-Lockerung grün bekommen.
- Der finale Merge nach `main` würde fremde uncommitted Änderungen überschreiben.

Removal Condition: Der Blocker ist entfernt, wenn der betroffene Vertrag ohne Scope-Erweiterung erhalten und mit fokussierten Checks belegt ist.

## State Machine

```text
process_prepared
  -> ai088_current_head_full_sweep_and_trace_rebaseline
  -> ai089_engine_server_root_test_closure
  -> ai090_action_limit_low_value_repeat_subcluster_v2
  -> ai091_unsafe_scoreline_alternative_preference
  -> ai092_runner_no_progress_access_progress_v2
  -> ai093_action_semantic_candidate_targetcontext_expansion
  -> ai094_full_test_sweep_and_final_review
  -> integration_preflight
  -> merged_to_main
  -> worktree_removed
  -> complete
```

Blocker-Pfad:

```text
current_step -> blocked
```

## Paketfolge

| Paket | Titel | Done-Gate | Commit |
| --- | --- | --- | --- |
| Prozess | Prozessdefinition | Artefakt existiert, `git diff --check` grün | `docs(ai): define AI088-AI094 closure process` |
| AI088 | Current-HEAD Full Sweep and Trace Rebaseline | Root-/Typecheck-/Package-Testlage dokumentiert, Current-HEAD-Trace mit Git-Stand vorhanden, Vergleich zu AI080 dokumentiert | `test(ai): rebaseline current head after post AI080 fixes` |
| AI089 | Engine/Server Root-Test Closure | Aktuelle Root-Test-Fehler behoben oder nicht reproduzierbar belegt; Root, Engine, Server, AI grün oder Restfehler isoliert | `fix(engine): close root test regressions after AI stabilization` |
| AI090 | Action-Limit Low-Value Repeat Subcluster v2 | `actionLimitReached` sinkt unter 11 oder Restcluster präzise belegt; Safety nicht schlechter | `fix(ai): reduce late low-value action-limit repeats` |
| AI091 | Unsafe Scoreline Alternative Preference | `unsafeScoreChosen` sinkt unter 6 oder Restcluster präzise belegt; Corp wird nicht passiv | `fix(ai): prefer safe scoreline alternatives before unsafe score` |
| AI092 | Runner No-Progress Access Progress v2 | `repeated_no_progress_run` sinkt unter 35 oder Restcluster präzise belegt; Runner-Steals fallen nicht materiell | `fix(ai): gate repeated no-progress central pressure` |
| AI093 | ActionSemanticCandidate TargetContext Expansion | Read-only TargetContext-Coverage dokumentiert; keine Runtime-Wirkung | `docs(ai): expand action semantic target context coverage` |
| AI094 | Full Test Sweep and Final Review | Finale Checks und A-D x 5 Trace dokumentiert; Ziele erreicht oder Restcluster konkret | `test(ai): complete post stabilization full sweep` |

## Paketdetails

### AI088: Current-HEAD Full Sweep and Trace Rebaseline

Kernartefakte:

- `docs/reviews/ai/ai088-current-head-full-sweep-and-trace-rebaseline-2026-06-11.md`
- `docs/reviews/ai/ai088-current-head-a-d-5seed-2026-06-11.json`

Checks:

```powershell
corepack pnpm test
corepack pnpm -r --if-present run typecheck
corepack pnpm -r --if-present run test
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/engine test
corepack pnpm --filter @netgrid/server test
git diff --check
```

Trace:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai088-current-head-a-d-5seed-2026-06-11.json
```

Review-Pflicht:

- Git-Stand und Ausgangscommit benennen.
- Root-Test-Status und Paket-Test-Status benennen.
- Aktuelle Trace-Metriken gegen AI080 vergleichen.
- Reproduzierbare Restfehler für AI089-AI092 zuordnen.

### AI089: Engine/Server Root-Test Closure

Kernartefakt:

- `docs/reviews/engine/ai089-root-test-closure-review-2026-06-11.md`

Scope nur bei reproduzierbaren Fehlern:

- Proteus-Manifest-Drift.
- Hidden/R&D/Archives-Missing-Legal-Action-Smokes.
- Corolla Speed Chip recurring credit.
- PlayerView remote root order.
- Forged Activation Orders Regressionen.

Checks:

```powershell
corepack pnpm test
corepack pnpm --filter @netgrid/engine test
corepack pnpm --filter @netgrid/server test
corepack pnpm --filter @netgrid/ai test
git diff --check
```

### AI090: Action-Limit Low-Value Repeat Subcluster v2

Kernartefakt:

- `docs/reviews/ai/ai090-action-limit-low-value-repeat-subclusters-review-2026-06-11.md`

Analysecluster:

- `late_gain_credit_without_funding_need`
- `late_draw_without_coverage_or_hand_goal`
- `late_ability_reuse_low_delta`
- `late_install_low_delta`
- `late_run_step_stall`
- `mixed_unknown`

Runtime-Fix nur für den häufigsten klaren Subcluster. Beispiel: wiederholtes `gain_credit` im Endfenster ohne FundingNeed und mit progressiver LegalAction.

Nicht erlaubt:

- Generische No-Progress-Strafe.
- Pauschales Stummschalten von ActionLimit-Detektoren.

### AI091: Unsafe Scoreline Alternative Preference

Kernartefakt:

- `docs/reviews/ai/ai091-unsafe-scoreline-alternative-preference-review-2026-06-11.md`

Ziel:

- `unsafeScoreChosen` von 6 senken, Ziel höchstens 3.
- Corp-Score-Aktivität erhalten: `corpAgendaScores >= 13`, außer ein Safety-Gewinn rechtfertigt eine Abweichung.
- `corp_never_scores_long_game <= 5`.
- `passiveActionWithScoreLineAvailable` nicht erhöhen.

Bevorzugte Alternativen vor unsafe score:

- Schutz oder ICE-Install auf Scoring-Remote.
- Credits für Rez-Reserve.
- Advance/Protect statt Score bei hohem Runner-Contest.
- Score nur bei Closeout/Win oder niedrigem Contest.

Evidence:

- `unsafe_score_alternative_preferred:true`
- `corp_scoreline_protection_before_score:true`
- `corp_rez_reserve_before_score:true`

### AI092: Runner No-Progress Access Progress v2

Kernartefakt:

- `docs/reviews/ai/ai092-runner-no-progress-access-progress-review-2026-06-11.md`

Split:

- Run erreicht Access.
- Run endet vor Access.
- bekannter Low-Value-Access.
- wiederholte gleiche Central ohne neue Coverage/Economy.
- Doctrine-/Pressure-getrieben.

Runtime-Fix:

- Positive Central-Pressure unterdrücken, wenn seit dem vorherigen gescheiterten Versuch keine neue Boardstate-Verbesserung sichtbar ist.
- Nicht unterdrücken bei Multiaccess, sichtbarer Threat oder Score-Contest.

### AI093: ActionSemanticCandidate TargetContext Expansion

Kernartefakt:

- `docs/reviews/ai/ai093-action-semantic-targetcontext-coverage-review-2026-06-11.md`

Read-only-Coverage:

- selected target present.
- legal options present.
- target kind.
- side-safe policy.
- unknown/hidden blocked.

Fokus:

- Runner recovery target.
- ICE target.
- program install/search target.
- scoreline target.
- access trash/steal target.

Keine Runtime-Wirkung.

### AI094: Full Test Sweep and Final Review

Kernartefakte:

- `docs/reviews/ai/ai088-ai094-final-review-2026-06-11.md`
- `docs/reviews/ai/ai094-final-a-d-5seed-2026-06-11.json`

Checks:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm -r --if-present run typecheck
corepack pnpm -r --if-present run test
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/engine test
corepack pnpm --filter @netgrid/server test
git diff --check
```

Trace:

```powershell
corepack pnpm --filter @netgrid/server exec tsx ../../scripts/run-ai-selfplay-trace-matrix.ts --out docs/reviews/ai/ai094-final-a-d-5seed-2026-06-11.json
```

Finalreview:

- Teststatus.
- Safetystatus.
- Zielmetriken.
- Restcluster mit konkreter Begründung, falls ein Ziel knapp verfehlt wird.
- Lokaler Merge-Status.

## Worktree- und Git-Regeln

- Der Hauptworkspace bleibt bis zum finalen Integrationspunkt unverändert.
- Paketcommits werden im Arbeits-Worktree erstellt.
- Vor dem finalen Merge wird `main` im Hauptworkspace auf sauberen Status geprüft.
- Der Arbeitsbranch wird lokal nach `main` gemerged, wenn keine Sicherheitsblocker und keine relevanten roten Abschlusschecks bestehen.
- Der Worktree wird nach erfolgreichem Merge entfernt.
- Es erfolgt kein Push.

