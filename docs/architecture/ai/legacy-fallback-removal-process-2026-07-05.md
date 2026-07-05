# Legacy-Fallback-Removal Prozess 2026-07-05

## Status

`in_progress`

## Quelle/Vorgabe

Nutzer-Handoff vom 2026-07-05: Legacy darf Vergleich, Fixture oder Regression sein, aber nicht still produktiv entscheiden. Wenn der neue KI-Pfad keine aktuelle Engine-`LegalAction` liefern kann, muss der KI-Schritt sichtbar stoppen oder als Review-/Fehlersignal markiert werden. Eine fachlich andere Ersatzaktion darf nicht ausgeführt oder als Preview angezeigt werden.

## Zielprüfung

Die Vorgabe ist für automatische Abarbeitung ausreichend präzise:

- Gesamtziel: produktive Ersatzaktionen und versteckte Legacy-Rettungspfade aus Server-/Preview-Ausführung und normaler Runtime entfernen oder sichtbar als Stopper/Review-Signal absichern.
- Reihenfolge: Prozessartefakt, Server-/Preview-Stopper, Runtime-Entkopplung, Guard-Tests, Abschlussverifikation.
- In-Scope: `apps/server/src/multiplayer.ts`, fokussierte Server-Tests, `packages/ai/src/runtime/**`, `packages/ai/src/decision/module-boundaries.test.ts`, AI-Cutover-/Fallback-Tests, Review-/Statusdokumentation.
- Nicht-Ziele: keine Engine-Regeländerung, keine neue LegalAction-Erzeugung, keine Hidden-Info-Projektion, kein Entfernen historischer Legacy-Fixture-/Benchmark-APIs, kein Remote-Push.
- Verifikation: fokussierte Server- und AI-Tests, Typecheck für betroffene Pakete, `git diff --check`.

## Gesamtziel

Der normale produktive AI-Pfad von `chooseAiAction` bis `MultiplayerService.runAiStep` führt nur noch die exakt von der KI gewählte, aktuell legale Action aus. Ist `decision.actionId` nicht in den aktuellen `LegalActions`, stoppen Preview und Ausführung sichtbar mit Diagnose. Die Semantic Runtime erhält keinen produktiven Legacy-Provider mehr; Legacy bleibt nur als expliziter Notaus, Simulation/Baseline, Fixture oder Benchmark erreichbar. Fallback-Signale wie `fallbackUsed:true`, `fallback.first_legal_action` und `semantic_coverage_fallback` bleiben sichtbar und testbar.

## Annahmen

- Der lokale `main`-Branch ist der Integrationsbranch und enthält zwei lokale, nicht gepushte Commits.
- `packages/ai/AGENTS.md` nennt noch Fallback-Verhalten; in diesem Prozess bedeutet Fallback-Verhalten sichtbarer Stopper, Diagnose oder expliziter Notaus, nicht eine fachlich andere Ersatzaktion.
- Der Stand vom 2026-06-26 hat den normalen Semantic-Livepfad bereits von Legacy-Debugreferenz und No-Candidate-Legacy-Fallback getrennt. Dieser Prozess härtet die verbleibenden Laufzeit- und Boundary-Lücken.

## Nicht-Ziele

- Legacy-Code wird nicht pauschal gelöscht, solange er für explizite Baseline-Exports, Simulationen, Fixture-/Benchmark-Pfade oder den manuell gesetzten Notaus `NETGRID_SEMANTIC_AI_RUNTIME=legacy` gebraucht wird.
- Bestehende öffentliche Baseline-Exports werden nicht entfernt, solange Tests und Simulationen sie als historische Vergleichs-API nutzen.
- Semantic-Coverage-Fallback wird nicht als versteckter Legacy-Fallback behandelt; er darf nur vorhandene Engine-`LegalActions` referenzieren und muss sichtbar als Fallback-/Review-Signal markiert bleiben.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- AI wählt ausschließlich aus `LegalActions`; sie erzeugt keine Legalität.
- `applyAction` validiert `side`, `actionId`, `stateVersion`, Timing, Kosten, Ziele und Choices erneut.
- Preview und Ausführung dürfen keine andere Action verwenden als `decision.actionId`.
- Hidden-Info-Daten dürfen nicht in PlayerViews, DecisionDebug, PublicEvents, Replays, Traces oder Fehlermeldungen leaken.
- Legacy darf Vergleich, Fixture, Benchmark oder expliziter Notaus sein, aber kein stiller produktiver Entscheider.

## Automatische Fehlerbehandlung

- Testfehler werden im aktiven Paket eng debuggt.
- Bei erwartbaren lokalen Testkosten werden zuerst fokussierte Tests ausgeführt; volle Workspace-Checks folgen final, wenn der Scope sie rechtfertigt.
- Bei Konflikten mit parallel fortgeschriebenem `main` wird defensiv gemerged und beide fachlichen Intentionen werden erhalten, sofern kompatibel.

## Sicherheitsblocker

Stop ohne automatische Fortsetzung, wenn:

- eine neue produktive Action ohne Engine-`LegalAction` erzeugt werden müsste;
- ein Fix Hidden-Info in Debug, Trace, Event, Replay oder Fehlerpayload schreiben würde;
- ein Merge-Konflikt denselben Runtime-Vertrag fachlich widersprüchlich definiert;
- fokussierte Illegal-Action- oder Hidden-Info-Gates nach enger Fehlersuche nicht grün werden.

## State Machine

```text
preflight -> process_artifact -> server_stop -> runtime_detach -> guards -> final_verify -> merge_main -> complete
preflight -> blocker
server_stop -> blocker
runtime_detach -> blocker
guards -> blocker
final_verify -> blocker
```

## Paketfolge

1. `LFR-0 Prozessartefakt und Inventar`
2. `LFR-1 Server- und Preview-Stopper`
3. `LFR-2 Runtime ohne produktiven Legacy-Provider`
4. `LFR-3 Guard-Tests und Wissensrückführung`
5. `LFR-FINAL Integration und Abschluss`

## Paketdetails

### LFR-0 Prozessartefakt und Inventar

- Ziel: Prozess, Annahmen, Nicht-Ziele und aktuelle Legacy-/Fallback-Stellen festhalten.
- Eingangsvoraussetzungen: sauberer Hauptworkspace, eigener Worktree, gelesene Projekt- und Agentenvorgaben.
- Konkrete Arbeit: dieses Artefakt anlegen; bestehende Inventarseite referenzieren und Delta für diesen Prozess ergänzen.
- Kernartefakte: `docs/architecture/ai/legacy-fallback-removal-process-2026-07-05.md`.
- Tests/Checks: `git diff --check`.
- Done-Gate: Artefakt existiert, Ziel-/Scope-Grenzen sind eindeutig.
- Commit: `docs(ai): define legacy fallback removal process`.

### LFR-1 Server- und Preview-Stopper

- Ziel: `previewAi` und `runAiStep` dürfen keine sortierte erste LegalAction mehr als Ersatz verwenden.
- Eingangsvoraussetzungen: LFR-0 committed.
- Konkrete Arbeit: gemeinsame Diagnose-/Validierungslogik für AI-Decisions gegen aktuelle LegalActions ergänzen; Preview und Ausführung stoppen sichtbar, wenn `decision.actionId` fehlt oder unbekannt ist; Tests für Preview und `advanceAi` ergänzen.
- Kernartefakte: `apps/server/src/multiplayer.ts`, `apps/server/src/multiplayer.test.ts`.
- Tests/Checks: fokussierte Server-Tests für AI Preview/Step; `corepack pnpm --filter @netgrid/server typecheck`; `git diff --check`.
- Done-Gate: kein Serverpfad kann bei unbekannter KI-Action eine Ersatzaction ausführen oder anzeigen.
- Commit: `fix(server): stop ai steps on unknown decision action`.

### LFR-2 Runtime ohne produktiven Legacy-Provider

- Ziel: normale Runtime-Entry-Points übergeben keinen Legacy-Provider mehr in die Semantic Runtime.
- Eingangsvoraussetzungen: LFR-1 committed.
- Konkrete Arbeit: `chooseSemanticRuntimeAction` und Decision Context auf reine Semantic Runtime umstellen; expliziten Legacy-Notaus und Baseline-Exports an der Public-/Legacy-Fassade halten; Practical-Micro-Comparator nur mit expliziter Legacy-Quelle betreiben, wenn opt-in aktiv; Semantic-Coverage-Fallback als sichtbares Review-Signal belassen.
- Kernartefakte: `packages/ai/src/runtime/semantic-runtime.ts`, `packages/ai/src/runtime/semantic-runtime-decision-context.ts`, `packages/ai/src/runtime/ai-action-entrypoints.ts`, Kompositionsmodule, fokussierte Tests.
- Tests/Checks: `corepack pnpm --filter @netgrid/ai exec vitest run src/semantic-ai-runtime-cutover.test.ts src/decision/module-boundaries.test.ts`; `corepack pnpm --filter @netgrid/ai typecheck`; `git diff --check`.
- Done-Gate: `packages/ai/src/runtime/semantic-runtime.ts` und normaler Runtime-Entrypoint brauchen keinen Legacy-Provider; Force-Legacy bleibt explizit.
- Commit: `refactor(ai): detach semantic runtime from legacy provider`.

### LFR-3 Guard-Tests und Wissensrückführung

- Ziel: Regressionen gegen produktive Runtime→Legacy-Importe, unbekannte Decision-Action und Fallback-Signale absichern.
- Eingangsvoraussetzungen: LFR-2 committed.
- Konkrete Arbeit: Boundary-Test für normale Runtime-Importe aus `legacy/**` schärfen, erlaubte Legacy-/Simulation-/Benchmark-Ausnahmen dokumentieren; Fallback-/Review-Signal-Tests aktualisieren; Wissensbasis/Review-Delta ergänzen.
- Kernartefakte: `packages/ai/src/decision/module-boundaries.test.ts`, `docs/reviews/ai/*`, `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`, Monatslog bei relevanter Architekturentscheidung.
- Tests/Checks: fokussierte AI-Tests, `git diff --check`.
- Done-Gate: neue Boundary/Invariant-Tests fallen bei erneuter stiller Runtime→Legacy-Kopplung oder Ersatzaction zurück.
- Commit: `test(ai): guard legacy fallback removal`.

### LFR-FINAL Integration und Abschluss

- Ziel: Arbeitsbranch lokal in `main` integrieren.
- Eingangsvoraussetzungen: alle Pakete committed, Worktree sauber.
- Konkrete Arbeit: finale fokussierte Checks, aktuelles `main` in Arbeitsbranch integrieren, final prüfen, Fast-Forward-Merge nach `main`, Worktree entfernen.
- Checks: `corepack pnpm --filter @netgrid/ai typecheck`, `corepack pnpm --filter @netgrid/server typecheck`, fokussierte Tests, `git diff --check`, `git status --short`.
- Done-Gate: `main` enthält die Paketcommits und ist geprüft; Worktree entfernt.

## Verifikationsregeln

- Paketchecks laufen vor jedem Commit.
- `git diff --check` läuft vor jedem Commit und final auf `main`.
- Fokussierte Tests haben Vorrang; breitere Checks werden final ausgeführt, wenn sie zeitlich tragbar sind.
- Nicht ausgeführte Checks werden im Abschluss klar benannt.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/legacy-fallback-removal`.
- Worktree: `C:\Projekte\NETGRID_LEGACY_FALLBACK_REMOVAL`.
- Hauptworkspace: `C:\Projekte\NETGRID`, nur finaler Merge nach `main`.
- Ein Paket wird erst nach bestandenem Done-Gate committed.
- Kein Push und kein Pull Request ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite Legacy-Fallback-Removal vollständig und sequenziell von LFR-0 bis LFR-FINAL ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissenspflichtseiten, agents/release-implementation-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_LEGACY_FALLBACK_REMOVAL auf Branch codex/legacy-fallback-removal.
Nutze den Hauptworkspace nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Server-/Preview-Ersatzaction-Fallback ist entfernt.
- Normale Semantic Runtime ist nicht mehr an einen Legacy-Provider gekoppelt.
- Explizite Legacy-/Baseline-/Simulation-/Fixture-Pfade sind inventarisiert und begrenzt.
- Guard-Tests schützen die neuen Grenzen.
- Paketcommits liegen auf dem Arbeitsbranch; Branch ist lokal nach `main` integriert.
