# AI Structural Play-Strength Consolidation Process 2026-06-12

## Status

final_report_ready

## Quelle/Vorgabe

Quelle ist die Ergebnisprüfung vom 2026-06-12 zur lokal abgeschlossenen AI-Play-Strength-Activation-Serie. GitHub zeigt diesen lokalen Endstand nicht, weil `main` lokal nicht gepusht wurde. Der nächste Prozess muss deshalb lokal auditieren, den Decision-Spine strukturell konsolidieren, Pilot-Scopes sauber registrieren, Real-Engine-Evaluation verbreitern und DeckDoctrine v2 diagnostisch an den DecisionFrame anbinden.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung:

- Gesamtziel: strukturelle Konsolidierung des Play-Strength-Spines ohne neue Engine- oder LegalAction-Autorität.
- Sequenz: `AI-CONS-0` bis `AI-CONS-11`, danach `FINAL-GREEN`.
- In-Scope: AI-Paket, AI-Diagnostik, AI-Evaluation, Review-/Architekturartefakte.
- Out-of-Scope: Engine-Regeländerungen, `applyAction`, Replay, StateHash, Randomness, Hidden-Info-Ausweitung, Legacy-Removal, produktiver Big-Bang-Cutover.
- Checks: paketbezogene Vitest-Läufe, `@netgrid/ai` Test/Typecheck, `git diff --check`.
- Branch/Worktree: `codex/ai-structural-play-strength-consolidation` in `C:\Projekte\NETGRID_AI_STRUCTURAL_PLAY_STRENGTH_CONSOLIDATION`.

## Gesamtziel

Arbeite die Paketserie `AI-CONS-0` bis `AI-CONS-11` vollständig und sequenziell ab, führe `FINAL-GREEN` aus und merge den abgeschlossenen Arbeitsbranch lokal nach `main`, sofern der Hauptworkspace durch fremde Änderungen nicht blockiert.

## Annahmen

- Der lokale `main`-HEAD `db6c8afb824b30a00be032f66fc8c6275b477c03` ist die fachliche Basis.
- Im Hauptworkspace existieren vor Prozessstart fremde offene AI022-Änderungen in `data/ai/*`, `docs/reviews/ai/ai022-*` und `scripts/*ai022*`; diese werden nicht gestasht, nicht committed und nicht reverted.
- Die Umsetzung läuft ausschließlich im Arbeits-Worktree.
- Neue Pilot-Scopes bleiben opt-in und dürfen Default-Runtime-Verhalten nicht still ändern.
- Wenn einzelne gewünschte Engine-Real-Fälle in der vorhandenen Testinfrastruktur nicht mit vertretbarem Scope erzeugbar sind, wird ein enger Korpus-/Testfall mit vorhandenen LegalAction-Fixtures genutzt und als Coverage-Grenze dokumentiert.

## Nicht-Ziele

- Keine Engine-Änderung.
- Keine Änderung an `applyAction`.
- Keine Replay-, StateHash- oder Randomness-Änderung.
- Keine Hidden-Info-Allowlist-Erweiterung ohne belegte Side-Safety.
- Keine produktive Übernahme von `TargetChoiceShadow` in `selectedChoices`.
- Kein Entfernen von Legacy-Fallbacks oder No-Candidate-Fallbacks.
- Kein Push, kein Pull Request.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- KI, UI, Server und menschliche Spieler reichen nur Actions ein, die aus `LegalActions` abgeleitet sind.
- AI-Module erzeugen keine Legalität.
- Public-, Debug-, Trace- und Reportdaten bleiben side-safe redigiert.
- Evaluation und Diagnostik dürfen keine Runtime-Auswahl treffen.
- `decision/*` bleibt runtime-nutzbare Entscheidungslogik, aber nicht Evaluations- oder Debug-Sammelbecken.
- Paketcommits stagen ausschließlich paketzugehörige Pfade.

## Automatische Fehlerbehandlung

- Bei roten Tests: Test/Assertion lesen, Ursache eng bestimmen, Einzeltest erneut ausführen, betroffene Datei erneut ausführen, danach Paket-Checks wiederholen.
- Bei Testinfrastruktur-Limit: Limit im Paketartefakt dokumentieren und keine Assertion lockern.
- Bei Merge-Konflikten: beide Intentionen lesen, kompatible Änderungen erhalten, fachliche Vertragskonflikte als Blocker dokumentieren.
- Bei fremden uncommitted Änderungen im Hauptworkspace: nicht stagen, nicht committen, nicht reverten; Merge nur ausführen, wenn Git den Merge ohne Überschreiben dieser Änderungen zulässt.

## Sicherheitsblocker

- Testfix erfordert Engine-Regeländerung nur für AI-Testgrün.
- Hidden-Info-Daten erscheinen in AIInput, Debug, Report, Trace, PublicEvent, Reconnect oder Logs.
- Pilot-Registry erlaubt nicht-legale Actions oder produktive Default-Wirkung ohne Opt-in.
- Calibration-Profilwechsel ändert Default-Runtime-Verhalten.
- TargetChoiceShadow erzeugt produktive `selectedChoices`.
- Finaler Merge würde fremde offene Hauptworkspace-Änderungen überschreiben.

## State Machine

```text
created
  -> worktree_ready
  -> ai_cons_0_audit
  -> ai_cons_1_git_discipline
  -> ai_cons_2_boundaries
  -> ai_cons_3_pilot_registry
  -> ai_cons_4_real_engine_validation
  -> ai_cons_5_shadow_baseline
  -> ai_cons_6_calibration_binding
  -> ai_cons_7_doctrine_goals
  -> ai_cons_8_target_choice_shadow
  -> ai_cons_9_trace_diagnostics
  -> ai_cons_10_index_debt
  -> ai_cons_11_final_report
  -> final_green
  -> main_integration
  -> complete
```

## Paketfolge

1. `AI-CONS-0` Lokaler Audit des nicht gepushten Activation-Tracks.
2. `AI-CONS-1` Pfadbezogene Git- und Paketdisziplin dokumentieren.
3. `AI-CONS-2` Decision-Spine-Modulgrenzen festziehen.
4. `AI-CONS-3` Pilot-Scope-Registry statt wachsender Pilot-Datei.
5. `AI-CONS-4` Pilot-Scopes gegen Real-Engine-Corpus validieren.
6. `AI-CONS-5` Shadow-League-Baseline versionieren.
7. `AI-CONS-6` Calibration Profile an Baseline binden.
8. `AI-CONS-7` DeckDoctrine-v2-Diagnostik an DecisionFrame anbinden.
9. `AI-CONS-8` TargetChoiceShadow mit echten LegalAction-Zielen härten.
10. `AI-CONS-9` DecisionTrace als Debug-Quelle erweitern.
11. `AI-CONS-10` `index.ts` Restschuld inventarisieren.
12. `AI-CONS-11` Abschlussbericht.
13. `FINAL-GREEN` vollständiger AI-Testlauf und lokale Main-Integration.

## Paketdetails

### AI-CONS-0: Lokaler Audit

- Ziel: lokalen Activation-Endstand und nicht gepushte Paketlage prüfen.
- Kernartefakt: `docs/reviews/ai/ai-activation-track-local-audit-2026-06-12.md`.
- Arbeit: Git-Stand, letzte Commits, relevante AI-ACT-Module, Pilot-Scopes, Tests und offene Hauptworkspace-Änderungen dokumentieren.
- Checks: `@netgrid/ai test`, `@netgrid/ai typecheck`, `git diff --check`.
- Commit: `docs(ai): audit local activation track result`.

### AI-CONS-1: Pfadbezogene Git-Disziplin

- Ziel: Prozessregel gegen pauschales Staging festziehen.
- Kernartefakt: dieses Prozessdokument.
- Checks: `git diff --check`.
- Commit: `docs(ai): require path scoped staging for ai package work`.

### AI-CONS-2: Modulgrenzen

- Ziel: Verantwortlichkeiten für `decision/`, `evaluation/` und `diagnostics/` dokumentieren und per Import-Guard schützen.
- Kernartefakte: README-Dateien und `packages/ai/src/decision/module-boundaries.test.ts`.
- Checks: Modulgrenzen-Test, `@netgrid/ai typecheck`, `git diff --check`.
- Commit: `test(ai): guard decision spine module boundaries`.

### AI-CONS-3: Pilot-Scope-Registry

- Ziel: Pilot-Scopes zentral registrieren, entscheiden und evidenzieren.
- Kernartefakte: `pilot-scope-registry.ts`, Registry-Tests, Runtime-/Pilot-Fassadenanpassung.
- Checks: Registry-Test, Pilot-Test, Runtime-Cutover-Test, Typecheck, `git diff --check`.
- Commit: `refactor(ai): introduce play strength pilot scope registry`.

### AI-CONS-4: Real-Engine-Pilot-Validation

- Ziel: Pilot-Scopes gegen Engine-nahe Korpusfälle positiv und negativ prüfen.
- Kernartefakte: `real-engine-decision-corpus.ts`, Korpus-Tests, Registry-/Runtime-Tests.
- Checks: Korpus-Test, Runtime-Cutover-Test, Typecheck, `git diff --check`.
- Commit: `test(ai): validate pilot scopes on real engine corpus`.

### AI-CONS-5: Shadow-League-Baseline

- Ziel: versionierte lokale Shadow-League-Baseline mit Scope-Aufschlüsselung erzeugen.
- Kernartefakte: Shadow-League/Benchmark-Code und `docs/reviews/ai/ai-shadow-league-baseline-2026-06-12.md`.
- Checks: Shadow-League-Test, Benchmark-Test, Typecheck, `git diff --check`.
- Commit: `docs(ai): record semantic shadow league baseline`.

### AI-CONS-6: Calibration-Baseline-Bindung

- Ziel: Calibration-Profile an Baseline-Referenz, Version und Evidence binden.
- Kernartefakte: Calibration-Profil und Benchmark-Tests.
- Checks: Calibration-Test, Benchmark-Test, ActionGoalFit-Test, Typecheck, `git diff --check`.
- Commit: `test(ai): bind calibration profiles to benchmark baselines`.

### AI-CONS-7: DoctrineGoalSynthesis diagnostisch

- Ziel: DeckDoctrine-v2-Diagnostik in Neutral-/Setup-Ziele übersetzen, ohne Runtime-Autopilot.
- Kernartefakte: `doctrine-goal-synthesis.ts` und Tests.
- Checks: Doctrine-Test, NeutralGoal-Test, TacticalGoalUtility-Test, Typecheck, `git diff --check`.
- Commit: `feat(ai): synthesize diagnostic doctrine goals`.

### AI-CONS-8: TargetChoiceShadow real targets

- Ziel: TargetChoiceShadow mit echten LegalAction-Ziel-/Choice-Optionen und Side-Safety härten.
- Kernartefakte: TargetChoiceShadow-Test, ActionTargetContext, Real-Engine-Korpus.
- Checks: TargetChoiceShadow-Test, ActionSemanticCandidate-Test, Korpus-Test, Typecheck, `git diff --check`.
- Commit: `test(ai): cover target choice shadow with real legal targets`.

### AI-CONS-9: DecisionTrace Diagnostics

- Ziel: redigierte Shadow-, Pilot-, Calibration-, TargetChoice- und Mistake-Debugdaten sichtbar machen, ohne `index.ts` aufzublähen.
- Kernartefakte: `diagnostics/decision-debug.ts`, Trace-Typen, Shadow-Report, `index.ts`.
- Checks: DecisionDebug-Test, Runtime-Cutover-Test, Index-Test, Typecheck, `git diff --check`.
- Commit: `feat(ai): expose decision trace diagnostics safely`.

### AI-CONS-10: index.ts Restschuldmap

- Ziel: nächsten sicheren Extraktionsschnitt inventarisieren, kein großer Refactor.
- Kernartefakt: `docs/reviews/ai/ai-index-rest-debt-map-2026-06-12.md`.
- Checks: `git diff --check`, bei Source-Berührung Typecheck.
- Commit: `docs(ai): map remaining index implementation debt`.

### AI-CONS-11: Abschlussbericht

- Ziel: vollständigen Umsetzungsstand, Grenzen und Checks dokumentieren.
- Kernartefakt: `docs/reviews/ai/ai-structural-play-strength-consolidation-final-report-2026-06-12.md`.
- Commit: `docs(ai): record structural play strength consolidation`.

### FINAL-GREEN

- Ziel: finaler grüner AI-Lauf und lokale Main-Integration.
- Pflichtchecks: `@netgrid/ai test`, `@netgrid/ai typecheck`, `src/index.test.ts`, `src/semantic-ai-runtime-cutover.test.ts`, `git diff --check`.
- Commit: `docs(ai): record structural play strength final green` oder enger Fix-Commit bei nötiger Regression.

## Verifikationsregeln

- Paketchecks werden vor Paketcommit ausgeführt.
- `git diff --check` ist vor jedem Commit Pflicht.
- `test.skip`, `test.only`, Testlöschung und pauschale Assertion-Lockerung sind verboten.
- Nicht ausgeführte Checks werden im jeweiligen Report mit Grund dokumentiert.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai-structural-play-strength-consolidation`.
- Worktree: `C:\Projekte\NETGRID_AI_STRUCTURAL_PLAY_STRENGTH_CONSOLIDATION`.
- Hauptworkspace: `C:\Projekte\NETGRID`, nur finaler lokaler Merge.
- Kein `git add .`.
- Kein pauschales `git add -A`.
- Kein pauschales Staging im Hauptworkspace.
- Vor jedem Commit: `git status --short`.
- Stage-Kommandos nennen immer konkrete paketzugehörige Pfade.
- Commit nur mit paketzugehörigen Dateien.
- Abschlussberichte nennen die gestagten Paketpfade, wenn fremde Änderungen im Hauptworkspace möglich sind.
- Fremde offene Änderungen werden dokumentiert, nicht gestasht, nicht committed, nicht reverted.
- Push/PR nur auf ausdrücklichen Nutzerwunsch.

## AI-CONS-1 Paketdisziplin

Dieser Prozess startet mit fremden offenen Hauptworkspace-Änderungen in AI022-Daten-, Review- und Scriptdateien. Daraus folgt für alle Pakete:

- `git status --short` wird vor jedem Commit geprüft.
- `git add` wird nur mit expliziten Pfaden verwendet.
- Neue oder geänderte Dateien außerhalb des aktiven Pakets bleiben unstaged.
- Hauptworkspace-Änderungen aus anderen Threads werden nicht normalisiert, formatiert oder als Nebenfund korrigiert.
- Ein finaler Merge nach `main` wird nur durchgeführt, wenn Git die fremden Änderungen nicht überschreibt.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI Structural Play-Strength Consolidation vollständig und sequenziell von AI-CONS-0 bis AI-CONS-11 sowie FINAL-GREEN ab und merge den abgeschlossenen Arbeitsbranch lokal nach main, sofern fremde Hauptworkspace-Änderungen den Merge nicht blockieren.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, den Release-Implementation-Agenten und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_STRUCTURAL_PLAY_STRENGTH_CONSOLIDATION auf Branch codex/ai-structural-play-strength-consolidation.
Nutze den Hauptworkspace nur für den finalen Merge.
Arbeite immer nur am aktuellen Paket.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Führe Paketchecks aus und committe jedes abgeschlossene Paket mit ausschließlich paketzugehörigen Pfaden.
Bei Sicherheitsblocker: stoppe, schreibe Blocker-Report mit Removal Condition und markiere das Goal nicht complete.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Alle Pakete `AI-CONS-0` bis `AI-CONS-11` sind umgesetzt oder mit belastbarer Blocker-Removal-Condition dokumentiert.
- `FINAL-GREEN` ist grün oder ein Sicherheitsblocker verhindert den Abschluss.
- Der Arbeitsbranch ist lokal nach `main` integriert, sofern fremde Änderungen dies nicht blockieren.
- Der Arbeits-Worktree ist entfernt.
- Der Hauptworkspace enthält keine von diesem Prozess uncommitted erzeugten Änderungen.
