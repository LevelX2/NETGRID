# AI Runtime Zero Legacy Prozess 2026-07-05

## Status

`in_progress`

## Quelle/Vorgabe

Nutzerauftrag vom 2026-07-05: Der bisherige Legacy-Fallback-Removal-Schnitt hat stille produktive Rettungspfade entfernt, aber weiterhin Compatibility-Fassaden und Legacy-Bausteine im Runtime-Baum belassen. Dieser Prozess entfernt diese Restkopplung aus der produktiven AI-Runtime vollständig.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung:

- Gesamtziel: `packages/ai/src/runtime/**` darf im Endzustand keine Legacy-Imports, keine Legacy-Provider und keinen produktiven Legacy-Kill-Switch enthalten.
- Reihenfolge: Prozessartefakt, Entrypoint-Abbau, Scoring-/DecisionContext-Ersatz, Practical-Micro-/Public-Flächen-Isolierung, harte Boundary-Gates, finale Integration.
- In-Scope: `packages/ai/src/runtime/**`, `packages/ai/src/ai-runtime-public-entrypoints.ts`, `packages/ai/src/index.ts`, AI-Boundary-/Cutover-/Runtime-Tests, Review-/Statusdokumentation.
- Nicht-Ziele: keine Engine-Regeländerung, keine neue LegalAction-Erzeugung, keine Hidden-Info-Projektion, kein Entfernen von historischen Legacy-Fixtures außerhalb produktiver Runtime, kein Remote-Push.
- Abnahmekriterium: `rg` und Boundary-Tests zeigen null produktive Runtime-Referenzen auf `legacy/**`, `scoreActionsForLegacy`, `createLegacyDecisionContext`, `chooseCorpLegacyBaselineAction`, `chooseRunnerLegacyBaselineAction`, `semanticRuntimeForcedLegacy` und `legacyDecisionProvider`.

## Gesamtziel

Der normale produktive AI-Pfad von `chooseAiAction` bis Semantic Runtime ist legacy-frei:

- `packages/ai/src/runtime/**` importiert nichts aus `../legacy/**`.
- `chooseAiAction`, `chooseCorpAction` und `chooseRunnerAction` haben keinen Legacy-Modus und keine Baseline-Getter.
- `NETGRID_SEMANTIC_AI_RUNTIME=legacy` wirkt nicht mehr auf produktive Runtime-Entrypoints.
- `scoreActionsForLegacy` und `createLegacyDecisionContext` sind nicht mehr im Runtime-Baum erreichbar.
- Legacy bleibt nur unter `packages/ai/src/legacy/**`, `packages/ai/src/simulation/**`, `packages/ai/src/evaluation/**`, Fixtures und Tests als historisches Vergleichsmaterial.

## Annahmen

- `main` ist der lokale Integrationsbranch.
- Version 0 erlaubt Breaking Changes an AI-Public-Exports, wenn sie historische Legacy-Verträge betreffen.
- Wenn Tests bislang Legacy über `chooseAiAction` aktivieren, werden sie auf explizite Legacy-Module oder historische Tests umgestellt.
- Productive Runtime muss lieber sichtbar stoppen oder semantische Coverage-Lücken melden als Legacy zu konsultieren.

## Nicht-Ziele

- Kein Umbau der Engine, LegalActions oder `applyAction`.
- Kein Verstecken von Legacy durch Umbenennung in Runtime-nahen Dateien.
- Kein Erhalt des produktiven Legacy-Kill-Switches.
- Kein neuer stiller `first legal action`-Fallback im Runtime-Pfad.

## Controller-Invarianten

- Rules Engine bleibt einzige Regelautorität.
- AI entscheidet nur aus Engine-`LegalActions`.
- Runtime-Entscheidungen dürfen keine verdeckten Gegnerdaten oder FullState-Daten lesen.
- Legacy darf kein produktives Sicherheitsnetz sein.
- Jede verbleibende Legacy-Nutzung muss außerhalb `runtime/**` liegen oder test-only sein.

## Automatische Fehlerbehandlung

- Bei roten Tests wird zuerst die neu eingeführte Runtime-Legacy-Grenze geprüft.
- Wenn ein Legacy-Import nur für Testdaten gebraucht wird, wird er in einen Test-/Fixture-/Evaluation-Pfad verschoben.
- Wenn ein Runtime-Modul noch Legacy-Scoring braucht, wird ein schmaler semantischer Ersatzmodul gebaut statt die Ausnahme zu erhalten.

## Sicherheitsblocker

Stop ohne automatische Fortsetzung, wenn:

- ein Ersatz Hidden-Info in AI-Input, Debug, Trace oder Replay schreiben müsste;
- ein Runtime-Fall nur durch eine nicht vorhandene Engine-`LegalAction` lösbar wäre;
- ein Test verlangt, dass produktive Runtime Legacy ausführt;
- eine Entfernung denselben öffentlichen Vertrag fachlich widersprüchlich definiert und nicht testseitig isolierbar ist.

## State Machine

```text
preflight -> process_artifact -> entrypoint_cut -> runtime_compositions -> public_isolation -> hard_gates -> final_verify -> merge_main -> complete
preflight -> blocker
entrypoint_cut -> blocker
runtime_compositions -> blocker
public_isolation -> blocker
hard_gates -> blocker
```

## Paketfolge

1. `ZLG-0 Prozessartefakt und Inventar`
2. `ZLG-1 Runtime-Entrypoint ohne Legacy-Baseline und Kill-Switch`
3. `ZLG-2 Runtime-Kompositionen ohne Legacy-Scoring und Legacy-DecisionContext`
4. `ZLG-3 Practical Micro, Public Facade und Tests legacy-isolieren`
5. `ZLG-4 Harte Zero-Legacy-Gates, Wissensrückführung und Integration`

## Paketdetails

### ZLG-0 Prozessartefakt und Inventar

- Ziel: verbindlichen Zero-Legacy-Umsetzungsprozess und Restinventar festhalten.
- Eingangsvoraussetzungen: sauberer Hauptworkspace, eigener Worktree, gelesene Projekt- und Agentenvorgaben.
- Konkrete Arbeit: dieses Artefakt anlegen; aktuelle Legacy-Referenzen im Runtime-Baum erfassen.
- Kernartefakte: `docs/architecture/ai/ai-runtime-zero-legacy-process-2026-07-05.md`.
- Tests/Checks: `git diff --check`.
- Done-Gate: Prozess nennt harte Endkriterien ohne Runtime-Ausnahmen.
- Commit: `docs(ai): define runtime zero legacy process`.

### ZLG-1 Runtime-Entrypoint ohne Legacy-Baseline und Kill-Switch

- Ziel: `runtime/ai-action-entrypoints.ts` kennt keine Legacy-Baseline, keinen `semanticRuntimeForcedLegacy` und keinen Legacy-Provider mehr.
- Eingangsvoraussetzungen: ZLG-0 committed.
- Konkrete Arbeit: Entrypoint-Typen vereinfachen; `chooseCorpBaselineAction`/`chooseRunnerBaselineAction` aus Runtime entfernen; Tests, die Baseline über Runtime holen, auf explizite Legacy-/Testpfade umstellen; Runtime-Entrypoint-Tests auf null Legacy-Provider aktualisieren.
- Kernartefakte: `packages/ai/src/runtime/ai-action-entrypoints.ts`, `packages/ai/src/runtime/ai-action-entrypoints.test.ts`, betroffene Public-/Index-Tests.
- Tests/Checks: fokussierte AI-Tests, `@netgrid/ai typecheck`, `git diff --check`.
- Done-Gate: `runtime/ai-action-entrypoints.ts` enthält keine `legacy`-Referenz und keinen Baseline-Export.
- Commit: `refactor(ai): remove legacy baseline from runtime entrypoints`.

### ZLG-2 Runtime-Kompositionen ohne Legacy-Scoring und Legacy-DecisionContext

- Ziel: `scoreActionsForLegacy`, `createLegacyActionScoringComposition` und `createLegacyDecisionContext` verschwinden aus `runtime/**`.
- Eingangsvoraussetzungen: ZLG-1 committed.
- Konkrete Arbeit: semantischen Ersatz für die wenigen Runtime-Consumer bauen; Runner-Self-Damage-/Action-Exclusion-Pfade mit vorhandenen Semantic-Choice-/Runtime-Assessment-Daten versorgen; `selectedChoicesForDecision` aus Legacy-Kontext lösen oder in Runtime-Kontext neu kapseln.
- Kernartefakte: `runtime/ai-action-entrypoints-composition.ts`, `runtime/semantic-runtime-action-exclusion-composition.ts`, `runtime/runner-baseline-support-composition.ts`, neue fokussierte Runtime-Helper falls nötig.
- Tests/Checks: Runtime-/Boundary-/Cutover-Tests, `@netgrid/ai typecheck`, `git diff --check`.
- Done-Gate: `rg "legacy|scoreActionsForLegacy|createLegacyDecisionContext" packages/ai/src/runtime -g "*.ts"` zeigt keine produktive Runtime-Treffer außer Testnamen/Text in `*.test.ts`.
- Commit: `refactor(ai): replace legacy runtime composition dependencies`.

### ZLG-3 Practical Micro, Public Facade und Tests legacy-isolieren

- Ziel: Legacy bleibt nur in expliziten historischen Flächen, nicht über Runtime oder Default-Public-Entrypoints.
- Eingangsvoraussetzungen: ZLG-2 committed.
- Konkrete Arbeit: `legacyDecisionProvider` aus Semantic-Decision-Context und Practical Micro entfernen oder in Evaluation/Test verschieben; `NETGRID_SEMANTIC_AI_RUNTIME=legacy`-Tests auf explizite Legacy-Entrypoints umstellen; `index.ts` Legacy-Exports unter explizite Legacy-Fassade begrenzen oder brechen.
- Kernartefakte: `runtime/semantic-runtime-decision-context.ts`, `runtime/practical-micro-runtime.ts`, `ai-runtime-public-entrypoints.ts`, `index.ts`, betroffene Tests.
- Tests/Checks: AI-Cutover-/Index-/Boundary-Tests, `@netgrid/ai typecheck`, `git diff --check`.
- Done-Gate: kein produktiver Entrypoint liest `NETGRID_SEMANTIC_AI_RUNTIME=legacy`; kein Runtime-Typ enthält `legacyDecisionProvider`.
- Commit: `refactor(ai): isolate legacy outside public runtime`.

### ZLG-4 Harte Zero-Legacy-Gates, Wissensrückführung und Integration

- Ziel: Zero-Legacy-Endzustand dauerhaft absichern und lokal nach `main` integrieren.
- Eingangsvoraussetzungen: ZLG-3 committed.
- Konkrete Arbeit: Boundary-Test auf null Runtime-Legacy ohne Ausnahmeliste verschärfen; Symbol-Gate für Legacy-Funktionen außerhalb erlaubter Bereiche; Review-/Status-/Log-Update; final verifizieren, main integrieren, Worktree entfernen.
- Kernartefakte: `packages/ai/src/decision/module-boundaries.test.ts`, `docs/reviews/ai/*`, `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`, Monatslog.
- Tests/Checks: `corepack pnpm --filter @netgrid/ai exec vitest run ...`, `@netgrid/ai typecheck`, Server-Smoke falls Entrypoint-Vertrag berührt, `git diff --check`.
- Done-Gate: Runtime-Zero-Legacy-Gate ist grün, `main` enthält alle Paketcommits und Worktree ist entfernt.
- Commit: `test(ai): enforce runtime zero legacy boundary`.

## Verifikationsregeln

- Paketchecks laufen vor jedem Commit.
- `git diff --check` läuft vor jedem Commit und final.
- Mindestens `@netgrid/ai typecheck` läuft nach jedem Codepaket.
- Betroffene fokussierte Tests laufen paketnah; breitere AI-Tests laufen final, soweit zeitlich tragbar.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai-runtime-zero-legacy`.
- Worktree: `C:\Projekte\NETGRID_AI_RUNTIME_ZERO_LEGACY`.
- Hauptworkspace: `C:\Projekte\NETGRID`, nur finaler Merge nach `main`.
- Ein Paket wird erst nach bestandenem Done-Gate committed.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite AI Runtime Zero Legacy vollständig und sequenziell von ZLG-0 bis ZLG-4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissenspflichtseiten, agents/release-implementation-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI_RUNTIME_ZERO_LEGACY auf Branch codex/ai-runtime-zero-legacy.
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

- `packages/ai/src/runtime/**` ist frei von produktiven Legacy-Imports und Legacy-Provider-Typen.
- `chooseAiAction`, `chooseCorpAction`, `chooseRunnerAction` haben keinen Legacy-Kill-Switch und keine Legacy-Baseline-Exports.
- `scoreActionsForLegacy`, `createLegacyDecisionContext`, `chooseCorpLegacyBaselineAction`, `chooseRunnerLegacyBaselineAction`, `semanticRuntimeForcedLegacy` sind außerhalb `legacy/**`, `simulation/**`, `evaluation/**` und Tests nicht mehr verwendbar.
- Boundary-Tests erzwingen den Zustand ohne Ausnahmeliste.
- Der Arbeitsbranch ist lokal nach `main` integriert.
