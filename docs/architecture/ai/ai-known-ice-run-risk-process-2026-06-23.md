# AI Known ICE Run Risk Process 2026-06-23

## Status

`abgeschlossen`

## Quelle/Vorgabe

Nutzerbefund vom 2026-06-23: Die Runner-KI startete erneut einen Run auf R&D, obwohl das R&D-ICE `Hunter` im vorherigen Runner-Zug bereits gerezzt und sichtbar geworden war. Der vorherige Run löste einen Trace 5 aus, der bei Runner 2 Credits nicht sinnvoll verhinderbar war und einen Tag gab. Im nächsten Runner-Zug bewertete die KI den erneuten R&D-Run trotzdem als beste Semantic Action und überstimmte den fortgeführten Plan `runner.build_credit_base`.

Vorarbeiten:

- `docs/architecture/ai/ai-unproductive-run-path-evaluation-process-2026-06-22.md` verhindert sichtbare Trace-/Run-Lock-Pfade, die keinen sinnvollen Access erwarten lassen.
- `docs/reviews/ai/ai-trace-bid-efficiency-final-report-2026-06-22.md` reduziert aussichtslose Trace-Bids auf den billigsten gleichwertigen Bid.
- Diese Vorarbeiten lösen nicht den aktuellen `Hunter`-Fall, weil `Hunter` keinen End-the-run- oder Run-Lock-Effekt hat: Der Runner kann nach erfolgreichem Trace weiterlaufen und zugreifen, erhält aber erwartbar einen Tag.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung präzise genug.

- Gesamtziel: Runner-KI bewertet bekannte/rezzed sichtbare ICE vor einem Run so, dass erwartbare Kosten und Gefahren wie Tags, Counter, Damage, Programm-/Hardware-Trash, Run-Locks, Jack-out-Locks, Break-Kosten, Trace-Bid-Kosten und Credit-Reserven in RunTargetEvaluation, TacticalPlans und Semantic Runtime sinnvoll wirken.
- Sequenz: Prozess/Preflight, Repro/Analyse, generische sichtbare ICE-Gefahrenprojektion, Bewertungsintegration, Varianten-/Regressionstests, Abschluss und lokaler Merge.
- In Scope: `packages/ai/src/visible-run-analysis.ts`, `packages/ai/src/runner-run-target-evaluation.ts`, `packages/ai/src/index.ts`, `packages/ai/src/tactical-plans.ts` soweit nötig, fokussierte AI-Tests und Review-/Log-Artefakte.
- Nicht-Ziele: keine Engine-Regeländerung, keine neue LegalAction-Erzeugung, keine Hidden-Info-Projektion, kein UI-Redesign, keine karten-ID-spezifische Sonderlogik für `Hunter`.
- Abnahme: Der konkrete bekannte R&D-`Hunter`-Fall bewertet den erneuten R&D-Run nicht mehr als beste Action gegenüber Credit-/Setup-Alternativen; bezahlbare, brechbare oder hochlohnende Runs bleiben möglich; unbekannte/unrezzed ICE werden nicht als harte Gefahr angenommen.

## Gesamtziel

Eine side-sichere, engine-nahe Pre-Run-Gefahrenbewertung für sichtbare ICE-Pfade:

```text
Wenn ein ICE dem Runner bekannt und im PlayerView sichtbar/rezzed ist, darf die KI dessen sichtbare Subroutinen, effektive RunQuote und öffentliche Trace-/Kostenparameter bewerten.
Die Bewertung schätzt erwartbare Zusatzkosten und Gefahren vor dem Run.
Diese Einschätzung beeinflusst RunTargetEvaluation, TacticalPlans und Semantic Runtime konsistent.
Unknown- und Hidden-Info-Fälle bleiben konservativ offen und werden nicht hart geblockt.
```

## Annahmen

- `playerView.servers[].ice[]` und `effectiveRunQuote` sind die führenden side-safe Quellen für sichtbare ICE-Regelinformationen.
- CardDefinition-Fallbacks dürfen nur für sichtbare bekannte/rezzed ICE genutzt werden, wie es `visible-run-analysis.ts` bereits für Pfadkosten tut.
- Ein sichtbarer Trace-Tag-ICE ist vor dem Run als Gefahr bewertbar, wenn Trace-Basis, Runner-Credits, Link-/Trace-Hilfen und Break-Möglichkeiten aus sichtbaren Daten ableitbar sind.
- Der Runner darf nicht automatisch jeden Tag vermeiden; bei hohem Payoff kann ein Tag akzeptabel sein. Der konkrete Fall mit unbekannter R&D-Topkarte, 2 Credits, frisch entferntem Tag und fortgeführtem Creditbase-Plan ist aber kein ausreichender Payoff für einen erwartbaren weiteren Tag.

## Nicht-Ziele

- Keine vollständige Run-Simulation mit `applyAction`.
- Keine Prognose verdeckter ICE, verdeckter Root-Karten, HQ-Handinhalte, R&D-Topkartenidentitäten oder privaten Corp-Entscheidungen.
- Keine Änderung am Trace-Bid-Fenster selbst.
- Keine Kartenpool- oder Manifestfreigabe.
- Kein globales Verbot von R&D-, HQ-, Archives- oder Remote-Runs.
- Kein pauschaler Plan-Hardlock: TacticalPlans bleiben weich, aber sichtbare Gefahren müssen in den Semantic Score eingehen.

## Controller-Invarianten

- Engine bleibt einzige Regelautorität.
- AI wählt ausschließlich vorhandene `LegalActions`.
- AI erzeugt keine LegalActions und verändert keine Engine-Regeln.
- Hidden Info bleibt geschützt; aktuelle PlayerView-Daten schlagen Memory.
- Debug-/Evidence-Marker enthalten nur side-safe Kategorien, öffentliche Stärken/Kosten und sichtbare Kartentitel, keine privaten Zonen oder FullState-Daten.
- Der Fix ist generisch über sichtbare Subroutine-/Trace-/Kostenprofile, nicht über `Hunter`-Sonderlogik.

## Automatische Fehlerbehandlung

- Wenn eine ICE-Gefahr sichtbar, aber nicht exakt bepreisbar ist, wird sie als Risiko statt kostenlos behandelt.
- Wenn eine Gefahr durch sichtbare LegalActions oder sichtbare Breaker bezahlbar vermeidbar ist, werden die Kosten statt ein harter Blocker genutzt.
- Wenn eine Gefahr nur aus unrezzed oder unbekannten Karten folgen könnte, bleibt sie Unknown und blockiert nicht.
- Wenn ein High-Payoff-Fall sichtbar genug ist, darf die KI den Run trotz Risiko wählen, aber Diagnostics müssen den Risiko-Payoff-Tradeoff zeigen.
- Rote Tests werden im aktiven Paket eingegrenzt; kein `test.skip`, `test.only` oder pauschales Lockern von Assertions.

## Sicherheitsblocker

Sofort stoppen und Blocker-Report schreiben, wenn:

- der Fix Zugriff auf Full GameState, verdeckte Karten oder nicht redigierte Payloads verlangt;
- eine AI-Action nicht aus `input.legalActions` stammt;
- Engine-Verträge, `applyAction`, Replay, StateHash oder Randomness geändert werden müssten;
- Debug-/Trace-Ausgaben verdeckte Gegnerinformationen enthalten würden;
- der Fall nur über eine `Hunter`-Sonderregel lösbar wäre.

Removal Condition: Der Blocker ist entfernt, wenn die Bewertung über sichtbare PlayerView-/LegalAction-/PublicEvent-Daten generisch und testbar bleibt.

## State Machine

```text
process_prepared
  -> AIRISK-0_process_preflight
  -> AIRISK-1_repro_and_gap_analysis
  -> AIRISK-2_visible_ice_hazard_projection
  -> AIRISK-3_decision_integration
  -> AIRISK-4_variant_regressions_and_diagnostics
  -> AIRISK-5_review_and_final_green
  -> merge_to_main
  -> complete
```

## Paketfolge

| Paket | Titel | Done-Gate | Commit |
| --- | --- | --- | --- |
| `AIRISK-0` | Prozessartefakt und Preflight | Artefakt existiert, Worktree/Branch sauber, `git diff --check` grün | `docs(ai): define known ice run risk process` |
| `AIRISK-1` | Analyse und Reproduktion | Repro-Test oder enger Testanker zeigt bekannten R&D-`Hunter`-Run als fehlerhaften Top-Run oder fehlendes Tag-Risiko | `test(ai): reproduce known trace tag run risk` |
| `AIRISK-2` | Sichtbare ICE-Gefahrenprojektion | Generische Projektion erkennt sichtbare Tag-/Trace-/Damage-/Trash-/Lock-Gefahren mit Kosten/Risikoklassen | `feat(ai): project visible ice run hazards` |
| `AIRISK-3` | Bewertungsintegration | RunTargetEvaluation, TacticalPlans und Semantic Runtime nutzen die Gefahrenbewertung; R&D-`Hunter` verliert gegen Credit-/Setup-Alternativen | `fix(ai): defer known trace tag runs` |
| `AIRISK-4` | Varianten, Randfälle und Diagnostics | Bezahlbare/brechbare/High-Payoff/Unknown-Gegenfälle sind getestet; Evidence bleibt side-safe | `test(ai): cover known ice hazard variants` |
| `AIRISK-5` | Review, Wissenspflege und Final Green | Final Review dokumentiert Scope, Checks und Grenzen; fokussierte AI-Checks, Typecheck und `git diff --check` bestehen | `docs(ai): review known ice run risk fix` |

## Paketdetails

### AIRISK-0: Prozessartefakt und Preflight

Ziel: Prozess, Worktree, Branch und Abnahmeregeln versionieren.

Arbeit:

- Hauptworkspace-Status prüfen.
- Worktree `C:\Projekte\NETGRID_AI_KNOWN_ICE_RUN_RISK` auf Branch `codex/ai-known-ice-run-risk` anlegen.
- Dieses Prozessartefakt erstellen.
- Relevante Agenten-, Wissens- und Vorarbeitsartefakte lesen.

Checks:

```bash
git status --short
git diff --check
```

### AIRISK-1: Analyse und Reproduktion

Ziel: Den konkreten Fehler als Testanker fassen.

Arbeit:

- Sichtbare `Hunter`-/Trace-Tag-Daten im PlayerView-/RunQuote-Pfad nachvollziehen.
- Bestehende Tests in `runner-run-target-evaluation.test.ts`, `index.test.ts` und `tactical-plans.test.ts` prüfen.
- Repro bauen:
  - Runner-Seite, R&D mit bekanntem/rezzed `Hunter`.
  - Runner hat zu wenig Credits/Link, um Trace 5 sinnvoll zu vermeiden.
  - Legale Alternativen enthalten mindestens `gain_credit` und `start_run.rd`.
  - Erwartung nach Fix: R&D-Run erhält sichtbaren Tag-Risiko-Penalty oder Recommendation gegen sofortigen Run.

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts --maxWorkers=1 --testTimeout=30000
git diff --check
```

### AIRISK-2: Sichtbare ICE-Gefahrenprojektion

Ziel: `visible-run-analysis.ts` oder ein enger AI-Helfer liefert strukturierte, side-safe Hazard-Daten.

Zu bewertende Varianten:

- `initiate_trace` mit `traceSuccessEffect` `add_tag`, `add_tag_and_counter`, `end_run_and_run_lock`, `trash_runner_resource_and_add_tag`, Damage-/Trash-Folgen.
- Nicht-Trace-Subroutinen mit `do_damage`, Programm-/Hardware-Trash, Jack-out-Lock, Future-End-the-run, Encounter-Tax und Break-Kosten.
- Bezahlbare Break-/Trace-Antworten reduzieren Risiko auf Kosten statt Blocker.
- Unknown/unrezzed ICE bleiben nicht hart bewertet.

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts --maxWorkers=1 --testTimeout=30000
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### AIRISK-3: Bewertungsintegration

Ziel: Die Gefahren wirken in der echten Entscheidung.

Arbeit:

- `RunnerRunTargetEvaluation` um Risk-/Hazard-Felder oder Evidence erweitern.
- `runnerRunTargetSemanticGuidanceValue` und TacticalPlan-Prioritäten so anbinden, dass sichtbare Tag-/Damage-/Trash-Risiken den Run nicht durch reine zentrale Druck-Baseline gewinnen lassen.
- Semantic Runtime-Score-Komponenten zeigen sichtbare Risiko-Penalties im Action Ranking.
- Fortgeführte Creditbase-/Setup-Pläne dürfen bei niedrigem Payoff gegen riskante bekannte ICE-Pfade bestehen.

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts src/runner-run-target-evaluation.test.ts src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### AIRISK-4: Varianten, Randfälle und Diagnostics

Ziel: Keine Überkorrektur.

Mindestens prüfen:

- `Hunter`/Trace-Tag-Risiko mit zu wenig Runner-Credits verliert gegen Credit-/Setup-Alternative.
- Bezahlbarer Trace oder sichtbarer Trace-Breaker reduziert das Risiko.
- Bekannter hoher Payoff kann Risiko bewusst akzeptieren, sofern der Run erreichbar ist.
- Unrezzed/unknown ICE wird nicht wegen vermuteter Tags blockiert.
- Data-Raven-ähnliche Counter-/Tag-Folgen sind als stärkeres Risiko klassifizierbar.
- Diagnostics enthalten klare Evidence wie `visible_ice_hazard:trace_tag`, `hazard_expected_tags:1`, `hazard_unavoidable:true`.

Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts src/index.test.ts --maxWorkers=1 --testTimeout=30000
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
```

### AIRISK-5: Review, Wissenspflege und Final Green

Ziel: Abschluss nachvollziehbar dokumentieren und lokal integrieren.

Arbeit:

- Final Review unter `docs/reviews/ai/ai-known-ice-run-risk-final-report-2026-06-23.md` erstellen.
- Prozessartefakt auf Abschlussstand aktualisieren.
- Wiederverwendbare Erkenntnisse bei Bedarf in Wissensbasis/Log zurückführen.
- Arbeitsbranch mit aktuellem `main` abgleichen und final lokal nach `main` mergen.
- Worktree nach erfolgreichem Merge entfernen.

Finale Checks:

```bash
corepack pnpm --filter @netgrid/ai exec vitest run src/runner-run-target-evaluation.test.ts src/index.test.ts src/tactical-plans.test.ts --maxWorkers=1 --testTimeout=30000
corepack pnpm --filter @netgrid/ai typecheck
git diff --check
git status --short
```

Wenn der vollständige AI-Testlauf zeitlich vertretbar und baseline-grün ist, zusätzlich:

```bash
corepack pnpm --filter @netgrid/ai test
```

## Verifikationsregeln

- Nach jedem Codepaket fokussierte Vitest-Dateien und `git diff --check`.
- Nach Codeänderungen immer `corepack pnpm --filter @netgrid/ai typecheck`.
- Finale Checks müssen mindestens `runner-run-target-evaluation.test.ts`, `index.test.ts`, `tactical-plans.test.ts`, Typecheck und `git diff --check` umfassen.
- Failing Tests werden nicht übersprungen. Nicht paketbezogene Baseline-Probleme werden mit konkreten Testnamen dokumentiert.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai-known-ice-run-risk`.
- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_KNOWN_ICE_RUN_RISK`.
- Hauptworkspace: `C:\Projekte\NETGRID`, nur für finalen Merge nach `main`.
- Jeder Paketabschluss erhält genau einen thematischen Commit, sofern kein Sicherheitsblocker stoppt.
- Kein Push und kein Pull Request.
- Vor finalem Merge aktuelles `main` in den Arbeitsbranch integrieren, falls `main` weitergelaufen ist.
- Fast-forward-Merge nach `main` bevorzugt; Merge-Commit nur mit dokumentierter Begründung.

## Controller-Prompt-Kern

```text
/Goal Arbeite AIRISK-0 bis AIRISK-5 vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md, agents/card-enablement-ai-knowledge-agent.md und docs/architecture/ai/ai-known-ice-run-risk-process-2026-06-23.md.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_KNOWN_ICE_RUN_RISK auf Branch codex/ai-known-ice-run-risk.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe/aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Prozessartefakt ist committed.
- Der `Hunter`-/known-ICE-Trace-Tag-Fall ist reproduziert und behoben.
- Sichtbare ICE-Gefahren werden generisch über sichtbare Subroutine-/RunQuote-/Trace-Daten bewertet.
- RunTargetEvaluation, TacticalPlans und Semantic Runtime nutzen den Befund konsistent.
- Unknown/unrezzed ICE wird nicht als harte Gefahr angenommen.
- Bezahlbare/brechbare/High-Payoff-Gegenfälle bleiben möglich.
- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, Randomness- oder Hidden-Info-Vertragsänderung.
- Paketcommits liegen auf `codex/ai-known-ice-run-risk`.
- Abschlussreport liegt unter `docs/reviews/ai/ai-known-ice-run-risk-final-report-2026-06-23.md`.
- Arbeitsbranch ist lokal nach `main` integriert und der Worktree entfernt.

## Abschlussstand 2026-06-23

AIRISK-0 bis AIRISK-5 wurden umgesetzt. Der konkrete R&D-`Hunter`-Fall wird im Top-Level-Test `packages/ai/src/known-ice-run-risk.test.ts` abgesichert: Die semantische Runner-Entscheidung wählt `gain_credit`, und die R&D-Run-Alternative trägt `runner_run_target_semantic_guidance` mit `recommendation:gain_credits_first`, `visible_ice_hazard:trace_tag` und `visible_trace_tag_hazard_unavoidable:true`.

Grüne Checks:

```bash
corepack pnpm exec vitest run src/known-ice-run-risk.test.ts src/visible-run-analysis.test.ts src/runner-run-target-evaluation.test.ts src/runner-run-target-guidance.test.ts --maxWorkers=1 --testTimeout=30000 --reporter=dot
corepack pnpm exec tsc -p tsconfig.json --noEmit
corepack pnpm --filter @netgrid/shared typecheck
corepack pnpm --filter @netgrid/engine typecheck
git diff --check
```

Eingeordnet: `corepack pnpm --filter @netgrid/ai test` scheitert weiterhin an vier isoliert reproduzierbaren Shell-Traders-Fixture-Tests in `packages/ai/src/index.test.ts`; der erste Fehler scheitert auch isoliert und liegt außerhalb dieses Fixes.
