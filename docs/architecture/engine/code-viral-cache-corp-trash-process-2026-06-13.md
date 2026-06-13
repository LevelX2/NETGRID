# Code Viral Cache Corp Trash Process - 2026-06-13

## Status

In Umsetzung auf Branch `codex/code-viral-cache-corp-trash` im Worktree `C:\Projekte\NETGRID_CODE_VIRAL_CACHE_CORP_TRASH`.

## Quelle/Vorgabe

Geprüfte Rückmeldung vom 2026-06-13 zum Card-Function-Abstraction-Stand nach dem Code-Viral-Cache-Install-/Purge-Slice.

Die Rückmeldung ist in der Hauptsache plausibel: Der deklarative Install-/Purge-Teil ist lokal bereits umgesetzt, aber der Corp-Trash-Pfad für Code Viral Cache bleibt kartenspezifisch. Einzelne Zahlen und Formulierungen der Rückmeldung beziehen sich auf einen älteren Remote-/GitHub-Stand; der lokale `main` ist führend:

- Known-Findings: 503.
- Summary: `functional_kind_uses_card_name=32`, `runtime_state_field_uses_card_name=253`, `mechanics_constant_controls_behavior_by_card_id=39`, `payload_key_uses_card_name=2`.
- Code Viral Cache steht als Install-/Purge-Slice auf `slice_done`, aber mit kleinem Corp-Trash-Restpfad.

## Zielprüfung

Die Vorgabe ist für automatische Umsetzung präzise genug.

- Gesamtziel: Code Viral Cache Corp-Trash nicht mehr über einen card-id-spezifischen Runtime-Zweig steuern.
- In Scope: Review-Textpräzisierung, CardImplementation-Vertrag, Corp-LegalAction-Erzeugung, Trigger-Ability-Ausführung, Tests, Guard-Baseline.
- Nicht in Scope: Krumz, Startup Immolator, Pirate Broadcast, Bizarre Encryption Scheme, Siren, breiter CardImplementation-Umbau.
- Abnahmekriterien: Code Viral Cache bleibt für die Corp für 1 Klick und 5 Credits trashbar; `trash_code_viral_cache` und `definition.id === CODE_VIRAL_CACHE_ID` verschwinden aus diesem funktionalen Runtime-Pfad; Guard ist aktualisiert.

## Gesamtziel

Der Code-Viral-Cache-Corp-Trash-Restpfad wird als generische CardImplementation-Ability für installierte Runner-Resources modelliert:

- CardImplementation deklariert eine Corp-trashbare Runner-Resource-Source-Ability.
- Corp-Main-Actions erzeugen die LegalAction aus dieser Deklaration.
- Trigger-Ability-Ausführung revalidiert Side, Zone, Ability-Kind und Kosten generisch.
- Kartentitel dürfen weiter aus der Definition ins Action-Label fließen; funktionale Runtime-Keys bleiben generisch.

## Annahmen

- Die bestehende Action-Kostenlogik bleibt: 1 Corp-Klick und 5 Credits.
- Das UI-/Event-Label darf weiterhin den Kartentitel aus der Definition enthalten.
- Bestehende Kompatibilitätskonstanten dürfen außerhalb des refaktorierten Corp-Trash-Pfads bestehen bleiben, wenn sie von anderen Pfaden benötigt werden.

## Nicht-Ziele

- Keine Krumz- oder Startup-Immolator-Umsetzung.
- Keine vollständige Umbenennung historischer Testfixture-IDs.
- Keine Migration historischer Replays oder lokaler Daten.
- Keine Änderung an Install-/Purge-Replacement-Logik, außer Tests brauchen die neue Ability ergänzend.

## Controller-Invarianten

- Rules Engine bleibt einzige Regelautorität.
- `applyAction` muss Side, Timing, Kosten, Ziel und Ability-Art erneut validieren.
- Keine Hidden-Info-Daten dürfen durch Payloads, PublicEvents, Reconnect oder Logs leaken.
- Replay und StateHash dürfen durch den generischen Vertrag nicht aufgeweicht werden.

## Automatische Fehlerbehandlung

- Rote Tests werden im aktuellen Paket eng debuggt.
- Wenn generische Ability und bestehender Kartentext nicht deckungsgleich abbildbar sind, wird gestoppt und ein Blocker dokumentiert.
- Guard-Drift wird nur akzeptiert, wenn er durch den geplanten Restpfad erklärbar ist.

## Sicherheitsblocker

Stop ohne Rückfrage, wenn:

- die Corp eine nicht deklarierte Runner-Resource trashen kann;
- Kosten nicht revalidiert werden;
- eine verdeckte Runner-Resource ohne zulässigen öffentlichen Kontext identifizierbar wird;
- finaler Merge fachlich unklare Konflikte erzeugt.

## State Machine

1. `process_defined`
2. `review_text_precise`
3. `generic_contract_inspected`
4. `corp_trash_refactored`
5. `guard_baseline_updated`
6. `final_verified`
7. `merged_to_main`

## Paketfolge

### P0 - Prozessartefakt

- Ziel: Scope, Reihenfolge und Gates festlegen.
- Arbeit: Dieses Dokument erstellen.
- Checks: `git diff --check`.
- Done-Gate: Artefakt committed.
- Commit: `docs: define code viral cache corp trash process`

### P1 - Review-Text präzisieren

- Ziel: Review-Text auf lokalen Ist-Stand nachziehen.
- Arbeit: Abschnitt `Nächste Umsetzung` präzisieren: CVC Install/Purge erledigt; offen ist CVC-Corp-Trash-Restpfad; nächste kleine Slices sind Krumz, Startup Immolator und CVC-Corp-Trash.
- Kernartefakte: `docs/reviews/engine/card-function-abstraction-2026-06-12.md`, ggf. Generator.
- Checks: `git diff --check`, Guard falls Generator betroffen.
- Done-Gate: Keine Engine-Logikänderung.
- Commit: `docs: clarify code viral cache remaining slice`

### P2 - Vertrag und Codepfade inspizieren

- Ziel: Bestehende Corp-Trash-Pfade und Tests vollständig verstehen.
- Arbeit: `corp-main-actions.ts`, `trigger-ability-execution.ts`, CVC-CardImplementation und Tests lesen; minimalen generischen Vertrag dokumentieren.
- Kernartefakte: Dieses Prozessdokument.
- Checks: `git diff --check`.
- Done-Gate: Implementierungsvertrag ist dokumentiert.
- Commit: `docs: specify generic corp trash source contract`

Inspektionsergebnis:

- `packages/engine/src/game/turn/corp-main-actions.ts` erzeugt die Corp-Trigger-Aktion aktuell über `definitionFor(state, id).id === CODE_VIRAL_CACHE_ID`.
- Die Payload nutzt `corpAbility: "trash_code_viral_cache"`, `sourceDefinitionId: CODE_VIRAL_CACHE_ID`, `trashCostPaid: 5` und das TargetRequirement `id: "codeViralCache"`.
- `packages/engine/src/game/abilities/trigger-ability-execution.ts` führt denselben Pfad über `legalAction.payload?.corpAbility === "trash_code_viral_cache"` aus, prüft die Card-ID erneut gegen `CODE_VIRAL_CACHE_ID`, zahlt 1 Klick und 5 Credits und trasht die Runner-Resource.
- Die relevanten Tests liegen in `trigger-ability-execution.test.ts`, `corp-main-actions.test.ts` und im integrierten Damage-/Replacement-Smoke.

P3-Vertrag:

- `CardImplementationDefinition` erhält ein deklaratives Feld `corpTrashInstalledRunnerSource`.
- Der erste konkrete Kind lautet `corp_trash_installed_runner_resource` mit `timing: "corp_main"`, `cost: { clicks: 1, credits: 5 }`, `target: "source"` und `visibility: "public"`.
- Code Viral Cache deklariert diese Ability zusätzlich zu Install-Capability und Purge-Replacement.
- `corp-main-actions.ts` sucht installierte Runner-Resources mit dieser Ability, prüft die Kosten und erzeugt eine generische TriggerAction:
  - `corpAbility: "trash_installed_runner_resource_source"`
  - `abilityKind: "corp_trash_installed_runner_resource"`
  - `sourceDefinitionId: definition.id`
  - `trashCostPaid: 5`
  - TargetRequirement-ID generisch, z. B. `runnerResourceSource`.
- `trigger-ability-execution.ts` revalidiert Side, Zone, deklarierte Ability-Kind, Kosten und Ziel generisch und setzt `trashedCardDefinitionId` aus der Definition des Ziel-CardInstance.
- Die Action-Label darf weiter den Kartentitel aus der Definition verwenden, weil das Anzeige-Text und kein funktionaler Branch ist.

### P3 - Generischer Corp-Trash-Restpfad

- Ziel: Card-ID-Zweig für CVC Corp-Trash entfernen.
- Arbeit: CardImplementation-Feld ergänzen; LegalAction-Erzeugung und Trigger-Ausführung generisch machen; Tests anpassen.
- Kernartefakte: Ability-Types, CVC-CardImplementation, Corp-Main-Actions, Trigger-Ability-Execution, Tests.
- Checks: relevante Tests, Engine-Typecheck, `git diff --check`.
- Done-Gate: CVC bleibt trashbar; kein `trash_code_viral_cache` im funktionalen Runtime-Pfad; keine direkte `definition.id === CODE_VIRAL_CACHE_ID`-Prüfung für diesen Pfad.
- Commit: `engine: generalize corp trash installed runner resource`

### P4 - Guard und Review-Baseline

- Ziel: Review-/Guard-Stand auf den neuen Slice kalibrieren.
- Arbeit: Guard ausführen, Report ggf. regenerieren und Generatorstatus anpassen.
- Kernartefakte: `scripts/check-card-name-leakage-in-runtime.mjs`, Review JSON/Markdown.
- Checks: `corepack pnpm check:card-function-abstraction`, JSON parsebar, `git diff --check`.
- Done-Gate: Guard grün; CVC-Corp-Trash ist nicht mehr als nächster kleiner Restpfad offen.
- Commit: `docs: calibrate abstraction guard after code viral cache corp trash`

### P5 - Finale Integration

- Ziel: Branch final prüfen und lokal nach `main` integrieren.
- Arbeit: Finale Checks, `main` integrieren falls nötig, Fast-Forward-Merge, Worktree entfernen.
- Checks: `git status --short`, `git diff --check`, Guard, Engine-Typecheck, fokussierte Tests.
- Done-Gate: `main` enthält alle Paketcommits und ist sauber.

## Verifikationsregeln

- Nach jedem Paket: `git diff --check`.
- Engine-Code: relevanter Vitest-Slice und `corepack pnpm --filter @netgrid/engine typecheck`.
- Guard-Artefakte: `corepack pnpm check:card-function-abstraction`.
- Nicht ausgeführte Checks werden im Abschluss benannt.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/code-viral-cache-corp-trash`.
- Arbeits-Worktree: `C:\Projekte\NETGRID_CODE_VIRAL_CACHE_CORP_TRASH`.
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für finalen Merge genutzt.
- Jedes Paket wird separat committed.
- Kein Push ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite den Code-Viral-Cache-Corp-Trash-Prozess vollständig und sequenziell von P0 bis P5 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CODE_VIRAL_CACHE_CORP_TRASH auf Branch codex/code-viral-cache-corp-trash. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus und committe jedes abgeschlossene Paket. Bei Sicherheitsblocker stoppe mit Blocker-Report. Nach Abschluss final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen und Goal erst dann als complete markieren.`

## Abschlusskriterien

- P0 bis P4 sind committed.
- P5 hat final verifiziert und lokal nach `main` integriert.
- Arbeits-Worktree ist entfernt.
- Krumz und Startup Immolator sind als Folgeaufträge sichtbar, aber nicht vermischt.
