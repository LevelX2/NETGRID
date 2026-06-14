# Card Function Artifact Payload Cleanup Process - 2026-06-13

## Status

Abgeschlossen und lokal nach `main` integriert. Der Arbeitsbranch `codex/card-function-artifact-payload-cleanup` wurde gemerged; der zugehörige Arbeits-Worktree wurde entfernt.

## Quelle/Vorgabe

Geprüfte Rückmeldung vom 2026-06-13 zum Card-Function-Abstraction-Stand nach den Krumz- und Startup-Immulator-Slices.

Die Rückmeldung ist im Kern plausibel, aber der lokale Stand zeigt eine wichtige Präzisierung:

- Review-Markdown und Review-JSON standen beim Prozesseinstieg lokal bereits auf der 386er-Baseline; die damalige Zwischenkalibrierung des Generators lag nach zwischenzeitlichen Engine-Strukturänderungen bei 389 Known-Findings. Der Abschlussstand bleibt die unten dokumentierte 387er Baseline.
- `Krumz` und `Startup Immolator` sind in Review-Markdown und JSON bereits `slice_done`.
- Die Completion-Note erwähnt Krumz und Startup Immolator bereits.
- Das vorherige Prozessartefakt `docs/architecture/engine/card-function-krumz-startup-process-2026-06-13.md` stand beim Prozesseinstieg noch auf `In Umsetzung`, obwohl der Prozess integriert war.
- Im öffentlichen Trace-Payment-Payload existierte beim Prozesseinstieg noch das kartenspezifische Feld `krumzBitsSpent`, obwohl die Runtime-Familie bereits generisch als `recurring_trace_credit_pool` modelliert war.

## Zielprüfung

Die Vorgabe ist für automatische Umsetzung präzise genug.

- Gesamtziel: Ergebnisartefakte und Public-Payload-Semantik an den tatsächlichen Krumz-/Startup-Stand angleichen.
- In Scope: Prozessartefaktstatus, Review-/JSON-Guard-Prüfung, neutraler Trace-Payment-Payload-Key für generische Recurring-Trace-Credit-Pools, Tests und Public-Payload-Allowlist.
- Nicht in Scope: neue Kartenrefactors für Siren, Bizarre Encryption Scheme oder Pirate Broadcast; Änderung der Trace-Zahlungslegalität; historische Replay-/Datenmigration; Produkt-/Release-Version.

## Controller-Invarianten

- Rules Engine bleibt einzige Regelautorität.
- UI, Server, Mensch und KI reichen nur `PlayerActions` aus `LegalActions` ein.
- `applyAction` revalidiert Timing, Kosten, Ziel und Ability-Art.
- Keine verdeckten Kartendaten dürfen in PlayerViews, PublicEvents, KI-Inputs, Reconnect, Undo-Previews, Replays, Logs oder Client-Fehlern leaken.
- Replay und StateHash bleiben deterministisch.

## State Machine

1. `process_defined`
2. `artifact_status_checked`
3. `public_payload_neutralized`
4. `guard_and_tests_verified`
5. `merged_to_main`

## Paketfolge

### P0 - Prozessartefakt

- Ziel: Scope, Reihenfolge und Gates für den Folgeauftrag festlegen.
- Arbeit: Dieses Dokument erstellen.
- Checks: `git diff --check`.
- Done-Gate: Artefakt committed.
- Commit: `docs: define card function artifact payload cleanup`

### P1 - Artefaktkonsistenz und Vorprozessstatus

- Ziel: Review-/JSON-Stand prüfen und den abgeschlossenen Krumz-/Startup-Prozessstatus nachziehen.
- Arbeit: Guard ausführen; bei Drift Review-Markdown/JSON regenerieren; altes Prozessartefakt auf abgeschlossen/lokal integriert setzen.
- Kernartefakte: `docs/reviews/engine/card-function-abstraction-2026-06-12.md`, `docs/reviews/engine/card-function-abstraction-2026-06-12.json`, `docs/architecture/engine/card-function-krumz-startup-process-2026-06-13.md`.
- Checks: `corepack pnpm check:card-function-abstraction`, JSON parsebar, `git diff --check`.
- Done-Gate: Krumz und Startup Immolator sind weiter `slice_done`; Vorprozessartefakt steht nicht mehr auf `In Umsetzung`; die neue Known-Finding-Zahl ist durch den aktuellen Generator belegt.
- Commit: `docs: close krumz startup process artifact`

### P2 - Krumz-Public-Payload neutralisieren

- Ziel: Das öffentliche Trace-Payment-Payload-Feld für generische Recurring-Trace-Credit-Pool-Ausgaben neutral benennen.
- Arbeit: `krumzBitsSpent` durch `recurringTraceCreditPoolSpent` ersetzen; Public-Context-Allowlist und Tests aktualisieren; keine Trace-Zahlungslogik ändern.
- Kernartefakte: `packages/engine/src/game/payment/trace-payment.ts`, `packages/engine/src/game/payment/trace-payment.test.ts`, `packages/engine/src/public-context.ts`, betroffene Mechaniktests.
- Checks: fokussierte Engine-Tests, Engine-Typecheck, `git diff --check`.
- Done-Gate: Krumz-Bits bleiben nur Trace-Zahlungen; öffentliches Payload-Feld ist generisch.
- Commit: `engine: neutralize recurring trace pool payload`

### P3 - Guard, Abschluss und Integration

- Ziel: Folgeprozess final verifizieren und lokal nach `main` integrieren.
- Arbeit: Guard nach Payload-Änderung ausführen; Review-Artefakte bei erwarteter Guard-Drift nachziehen; final prüfen; Arbeitsbranch nach `main` mergen; Worktree entfernen.
- Checks: `corepack pnpm check:card-function-abstraction`, Engine-Typecheck, relevante Engine-Tests, `git diff --check`, `git status --short`.
- Done-Gate: `main` enthält alle Paketcommits, ist sauber, und der Arbeits-Worktree ist entfernt.

## Sicherheitsblocker

Stop ohne Rückfrage, wenn:

- Krumz-Credits außerhalb von Trace-Zahlungen nutzbar werden;
- der neutrale Payload-Key Hidden-Info oder private Zielinformationen offenlegt;
- Guard-Drift nicht durch die bewusste Payload-Umbenennung erklärbar ist;
- finaler Merge fachlich unklare Konflikte erzeugt.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/card-function-artifact-payload-cleanup`.
- Arbeits-Worktree: `C:\Projekte\NETGRID_CARD_FUNCTION_ARTIFACT_PAYLOAD_CLEANUP`.
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen Merge genutzt.
- Jedes Paket wird separat committed.
- Kein Push ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite den Card-Function-Artifact-Payload-Cleanup-Prozess vollständig und sequenziell von P0 bis P3 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CARD_FUNCTION_ARTIFACT_PAYLOAD_CLEANUP auf Branch codex/card-function-artifact-payload-cleanup. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus und committe jedes abgeschlossene Paket. Bei Sicherheitsblocker stoppe mit Blocker-Report. Nach Abschluss final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen und Goal erst dann als complete markieren.`

## Abschlusskriterien

- P0 bis P2 sind committed.
- P3 hat final verifiziert und lokal nach `main` integriert.
- Arbeits-Worktree ist entfernt.
- Siren, Bizarre Encryption Scheme und Pirate Broadcast bleiben spätere separate Folgeprozesse.

## Abschlussstand im Arbeitsbranch 2026-06-13

- Der abgeschlossene Krumz-/Startup-Prozess ist im Prozessartefakt nicht mehr als `In Umsetzung`, sondern als abgeschlossen und lokal integriert dokumentiert.
- Der Card-Function-Abstraction-Guard ist auf die aktuelle 387er Baseline kalibriert.
- Die zwei ehemaligen Krumz-Payload-Funde sind durch `recurringTraceCreditPoolSpent` entfallen.
- `Krumz` und `Startup Immolator` bleiben im Review-Artefakt `slice_done`.
- Verifikation im Arbeitsbranch: `corepack pnpm check:card-function-abstraction`, JSON-Parse, `corepack pnpm --filter @netgrid/engine exec vitest run src/game/payment/trace-payment.test.ts`, `corepack pnpm --filter @netgrid/engine exec vitest run index-tests/mechanics/assets-nodes-upgrades.test.ts -t "Krumz"`, `corepack pnpm --filter @netgrid/engine typecheck`, `git diff --check`.
