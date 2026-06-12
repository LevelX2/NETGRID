# Code Viral Cache Replacement Process - 2026-06-13

## Status

In Umsetzung auf Branch `codex/code-viral-cache-replacement` im Worktree `C:\Projekte\NETGRID_CODE_VIRAL_CACHE_REPLACEMENT`.

## Quelle/Vorgabe

Geprüfte Rückmeldung vom 2026-06-13 zur Card-Function-Abstraction nach dem Quest-for-Cattekin-Slice. Die Rückmeldung bewertet Guard und Quest als abgeschlossen und empfiehlt als nächste kleine Umsetzungsscheibe:

1. Mini-Dokumentationskorrektur zu Completion Note und Quest-Restfund in `mechanics/random-effects.ts`.
2. Code Viral Cache von card-name/card-id-spezifischen Funktionszweigen auf generische Install-Condition und generische Purge-Replacement-Mechanik umstellen.
3. Krumz und Startup Immolator erst danach als eigene Folgeslices schneiden.

## Zielprüfung

Die Vorgabe ist für automatische Umsetzung präzise genug.

- Gesamtziel: Code Viral Cache nicht mehr über card-id-spezifische Runtime-Zweige steuern.
- In Scope: Review-/Guard-Artefakte, Code Viral Cache Install-Condition, Purge-Replacement, Tests und Baseline-Aktualisierung.
- Nicht in Scope: Derived-Guard-Verbesserung, Krumz, Startup Immolator, breiter Ability-Engine-Umbau.
- Abnahmekriterien: bestehendes Verhalten bleibt erhalten, neue Runtime-Mechaniken sind generisch benannt, Guard findet keine neuen card-name funktionalen Tokens, relevante Tests bestehen.

## Gesamtziel

`Code Viral Cache` wird als vertikaler Slice so refaktoriert, dass:

- die Installierbarkeit nach erfolgreichem HQ-Run deklarativ/generisch modelliert ist;
- der Purge-Replacement-Effekt generisch als Virus-Counter-Cleanup-Replacement abgebildet ist;
- Runtime-Code nicht mehr über `definition.id === CODE_VIRAL_CACHE_ID` verzweigt;
- Review-Artefakte den Quest-Abschluss und den neuen Slice-Stand konsistent dokumentieren.

## Annahmen

- Die derzeitige Review-Baseline bleibt führend und wird nur für diesen Slice minimal angepasst.
- Der Quest-Restfund in `packages/engine/src/mechanics/random-effects.ts` ist aktuell ein diagnostischer/helpernaher Rest und kein Engine-Logikblocker.
- Falls ein bestehender Test die alte Kind-Bezeichnung direkt erwartet, wird der Test auf die neue generische Semantik angepasst, nicht die alte Bezeichnung erhalten.

## Nicht-Ziele

- Keine Verbesserung des Derived-Guard-Generators über die aktuelle Methodik hinaus.
- Keine Krumz- oder Startup-Immolator-Implementierung.
- Keine Migration historischer Replays oder lokaler Runtime-Daten.
- Keine UI- oder Serveränderungen, sofern der Engine-Vertrag nicht explizit betroffen ist.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- PlayerActions müssen aus LegalActions ableitbar bleiben.
- Hidden-Info-Daten dürfen nicht in PublicEvents, PlayerViews, KI-Inputs, Logs oder Client-Fehler leaken.
- Replay, StateHash und deterministischer Zufall dürfen durch den Slice nicht aufgeweicht werden.

## Automatische Fehlerbehandlung

- Bei roten Tests wird eng am betroffenen Paket debuggt.
- Bei fachlichem Konflikt zwischen generischem Mechanikvertrag und bestehendem Verhalten wird gestoppt und ein Blocker dokumentiert.
- Bei reinem Guard-Drift wird die Review-Baseline aktualisiert, wenn der Drift durch die geplante Refaktorierung erklärbar ist.

## Sicherheitsblocker

Stop ohne Rückfrage, wenn:

- Purge-Replacement versteckte Karteninformationen öffentlich machen würde;
- Install-Condition nicht mehr aus legalem Runner-Turn-State ableitbar ist;
- eine generische Mechanik mehrere Karten unbeabsichtigt anders behandelt;
- finaler Merge nach `main` Konflikte erzeugt, deren fachliche Intention unklar ist.

## State Machine

1. `process_defined`
2. `mini_docs_done`
3. `code_contract_inspected`
4. `code_viral_cache_refactored`
5. `guard_baseline_updated`
6. `final_verified`
7. `merged_to_main`

## Paketfolge

### P0 - Prozessartefakt

- Ziel: Scope, Reihenfolge und Gates festlegen.
- Arbeit: Dieses Dokument erstellen.
- Checks: `git diff --check`.
- Done-Gate: Artefakt committed.
- Commit: `docs: define code viral cache replacement process`

### P1 - Mini-Dokumentationskorrektur

- Ziel: Quest-Abschluss und Quest-Restfund konsistent in Review-Artefakten einordnen.
- Arbeit: Completion Note ergänzen; `mechanics/random-effects.ts`-Restfund als allowed/diagnostic helper oder deferred minor cleanup klassifizieren.
- Kernartefakte: Review JSON/Markdown.
- Checks: JSON parsebar, `git diff --check`.
- Done-Gate: Keine Engine-Logikänderung in diesem Paket.
- Commit: `docs: record quest slice completion in abstraction review`

### P2 - Code Viral Cache Vertragsinspektion

- Ziel: Bestehende Codepfade, Tests und Datenverträge für Install-Condition und Purge-Replacement verstehen.
- Arbeit: Betroffene Dateien lesen, minimalen generischen Vertrag festlegen.
- Kernartefakte: Prozessnotiz oder Review-Notiz.
- Checks: `git diff --check`.
- Done-Gate: Konkreter Implementierungsvertrag ist dokumentiert.
- Commit: `docs: specify code viral cache generic contract`

Inspektionsergebnis:

- `CardConditionImplementation` kennt bereits `runner_made_successful_run_on_server_this_turn` mit `server: "hq" | "rd" | "any_data_fort"`.
- `createCardImplementationRuntimeDeps` wertet diese Bedingung bereits gegen `runnerTurnFlags.successfulHqRunThisTurn`, `successfulRdRunThisTurn` und `successfulRunThisTurn` aus.
- `CardImplementationDefinition` besitzt bereits `installCapabilities`; diese Vokabularstelle ist der richtige Ort für eine deklarative Runner-Install-Voraussetzung.
- Code Viral Cache hängt derzeit zusätzlich an:
  - `packages/engine/src/game/turn/runner-main-actions.ts` für LegalAction-Generierung;
  - `packages/engine/src/game/install/install-card.ts` für Revalidation;
  - `packages/engine/src/game/engine-runtime-internal/state-runtime-resolvers.ts` für Purge-Replacement-Choice;
  - `packages/engine/src/game/choices/pending-choice-resolution.ts` für Pending-Choice-Routing;
  - `packages/engine/src/game/turn/corp-main-actions.ts` und `trigger-ability-execution.ts` für Corp-Trash-Aktion.

P3-Vertrag:

- `CardInstallCapabilityImplementation` wird um `runner_made_successful_run_on_server_this_turn` mit `server: "hq"` erweitert.
- Code Viral Cache deklariert diese Install-Capability selbst.
- LegalAction-Generierung und Install-Revalidation prüfen generisch alle Install-Capability-Bedingungen.
- Das Purge-Replacement wird über `hiddenReplacementLongtail.kind === "purge_replacement_with_runner_virus_counter_cleanup"` gefunden.
- Pending-Choice-Source und Payload-Felder werden neutral benannt, sodass kein neuer Code-Viral-Cache-Payload-Key nötig ist.
- Die Corp-Trash-Aktion bleibt in diesem Slice semantisch unverändert; falls sie noch card-id-spezifisch bleibt, wird sie in P4 als separates Restthema klassifiziert, weil der Auftrag auf Install-Condition und Purge-Replacement zielt.

### P3 - Code Viral Cache Refaktor

- Ziel: Card-ID-Zweige aus Runtime-Code entfernen.
- Arbeit: Generische Install-Condition `runner_made_successful_run_on_server_this_turn` mit Ziel `hq` und generisches Replacement `purge_replacement_with_runner_virus_counter_cleanup` umsetzen; Tests anpassen/ergänzen.
- Kernartefakte: Engine Types, Card Implementation, Runtime Resolver, Tests.
- Checks: relevante Engine-Tests, `pnpm typecheck` soweit praktikabel, `git diff --check`.
- Done-Gate: Verhalten bleibt für Code Viral Cache erhalten; keine `definition.id === CODE_VIRAL_CACHE_ID` Runtime-Verzweigung.
- Commit: `engine: generalize code viral cache purge replacement`

### P4 - Guard und Review-Baseline

- Ziel: Card-Function-Abstraction-Review auf neuen Stand bringen.
- Arbeit: Guard ausführen, JSON/Markdown aktualisieren, Counts und nächste Umsetzung kalibrieren.
- Kernartefakte: `docs/reviews/engine/card-function-abstraction-2026-06-12.*`.
- Checks: Guard erfolgreich, JSON parsebar, `git diff --check`.
- Done-Gate: Code Viral Cache ist als erledigter Slice dokumentiert, keine neuen card-name funktionalen Tokens.
- Commit: `docs: calibrate abstraction guard after code viral cache`

### P5 - Finale Integration

- Ziel: Branch final prüfen und lokal nach `main` integrieren.
- Arbeit: Finale Checks, `main` integrieren, Fast-Forward-Merge in Hauptworkspace, Worktree entfernen.
- Checks: `git status --short`, `git diff --check`, relevante Tests.
- Done-Gate: `main` enthält alle Paketcommits und ist sauber.

## Verifikationsregeln

- Nach jedem Paket: `git diff --check`.
- JSON-Artefakte müssen mit Node parsebar sein.
- Für Engine-Code: relevante Vitest-Dateien zuerst, danach breiterer Typecheck/Test je Aufwand und Risiko.
- Nicht ausgeführte Checks werden im Abschluss benannt.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/code-viral-cache-replacement`.
- Arbeits-Worktree: `C:\Projekte\NETGRID_CODE_VIRAL_CACHE_REPLACEMENT`.
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen Merge nach `main` genutzt.
- Jedes Paket wird separat committed.
- Kein Push ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite den Code-Viral-Cache-Replacement-Prozess vollständig und sequenziell von P0 bis P5 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CODE_VIRAL_CACHE_REPLACEMENT auf Branch codex/code-viral-cache-replacement. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus und committe jedes abgeschlossene Paket. Bei Sicherheitsblocker stoppe mit Blocker-Report. Nach Abschluss final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen und Goal erst dann als complete markieren.`

## Abschlusskriterien

- P0 bis P4 sind committed.
- P5 hat final verifiziert und lokal nach `main` integriert.
- Arbeits-Worktree ist entfernt.
- Krumz und Startup Immolator sind als Folgeaufträge benannt, aber nicht vermischt.
