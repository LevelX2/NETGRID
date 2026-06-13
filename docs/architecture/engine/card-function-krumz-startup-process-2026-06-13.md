# Card Function Krumz Startup Process - 2026-06-13

## Status

In Umsetzung auf Branch `codex/card-function-krumz-startup` im Worktree `C:\Projekte\NETGRID_CARD_FUNCTION_KRUMZ_STARTUP`.

## Quelle/Vorgabe

Geprüfte Rückmeldung vom 2026-06-13 zum Card-Function-Abstraction-Stand nach dem Code-Viral-Cache-Corp-Trash-Slice.

Die Rückmeldung ist plausibel:

- Der Review ist auf 487 Known-Findings kalibriert.
- `payload_key_uses_card_name` ist aus der aktuellen Known-Zählung verschwunden.
- Code Viral Cache steht mit Install-, Purge- und Corp-Trash-Pfad fachlich auf `slice_done`.
- Eine kleine JSON-Unschärfe bleibt: Die `completionNote` erwähnt den abgeschlossenen Corp-Trash-Slice nicht ausdrücklich.
- Die nächsten kleinen technischen Slices sind `Krumz` und `Startup Immolator`.
- `Siren`, `Bizarre Encryption Scheme` und `Pirate Broadcast` bleiben größere separate Prozesse.

## Zielprüfung

Die Vorgabe ist für automatische Umsetzung präzise genug.

- Gesamtziel: Die nächsten kleinen Card-Function-Abstraction-Slices sequenziell umsetzen.
- In Scope: JSON-Completion-Note, Krumz Recurring-Trace-Credit-Pool, Startup Immolator Ability-Use-Ledger.
- Nicht in Scope: Siren, Bizarre Encryption Scheme, Pirate Broadcast, globale Engine-Umbenennung, historische Replay-/Datenmigration.
- Abnahmekriterien: Bestehendes Kartenverhalten bleibt erhalten; funktionale Runtime-Namen werden generischer; Guard und relevante Tests sind grün.

## Gesamtziel

Der Card-Function-Abstraction-Stand wird nach Code Viral Cache sauber fortgeführt:

- Review-JSON und Markdown bleiben konsistent.
- Krumz nutzt eine generische deklarative Recurring-Trace-Credit-Pool-Familie statt Krumz-spezifischer Funktionsnamen.
- Startup Immolator nutzt die generische Ability-Use-Ledger-Struktur für einmalige Source-Nutzung pro Turn.
- Die großen Run-/Access-/Redirect-Kandidaten bleiben als spätere Folgeprozesse unvermischt.

## Annahmen

- Krumz gewährt weiterhin genau 1 wiederkehrenden Bit für Trace-Zahlungen und refreshed zum Start des Corp-Turns nach Nutzung.
- Startup Immolator bleibt nur nach vollständig gebrochenem, passiertem ICE nutzbar.
- Anzeige-Labels dürfen weiterhin Kartentitel aus Definitionen enthalten.
- Test-Fixture-IDs dürfen kartenspezifisch bleiben, solange sie als Tests/Katalogkontext klassifiziert sind.

## Nicht-Ziele

- Keine Umsetzung von `Siren`, `Bizarre Encryption Scheme` oder `Pirate Broadcast`.
- Keine Änderung an nicht betroffenen Kartenmechaniken.
- Keine breite Umbenennung historischer Testdaten.
- Keine Produkt-/Release-Versionserhöhung.

## Controller-Invarianten

- Rules Engine bleibt einzige Regelautorität.
- UI, Server, Mensch und KI reichen nur `PlayerActions` aus `LegalActions` ein.
- `applyAction` revalidiert Timing, Kosten, Ziel und Ability-Art.
- Keine verdeckten Kartendaten dürfen in PlayerViews, PublicEvents, KI-Inputs, Reconnect, Undo-Previews, Replays, Logs oder Client-Fehlern leaken.
- Replay und StateHash bleiben deterministisch.

## Automatische Fehlerbehandlung

- Rote Tests werden im aktuellen Paket eng debuggt.
- Guard-Drift wird nur akzeptiert, wenn sie durch den jeweiligen Slice erklärbar ist.
- Wenn generische Krumz- oder Startup-Semantik bestehendes Verhalten nicht deckungsgleich abbilden kann, wird ein Blocker dokumentiert.

## Sicherheitsblocker

Stop ohne Rückfrage, wenn:

- Krumz-Credits außerhalb von Trace-Zahlungen nutzbar werden;
- Startup Immolator ohne vollständig gebrochenes, passiertes ICE nutzbar wird;
- Hidden-Info-Grenzen durch neue Payloads, Labels oder Events aufgeweicht werden;
- finaler Merge fachlich unklare Konflikte erzeugt.

## State Machine

1. `process_defined`
2. `completion_note_fixed`
3. `krumz_refactored`
4. `startup_immolator_refactored`
5. `guard_baseline_updated`
6. `final_verified`
7. `merged_to_main`

## Paketfolge

### P0 - Prozessartefakt

- Ziel: Scope, Reihenfolge und Gates festlegen.
- Arbeit: Dieses Dokument erstellen.
- Checks: `git diff --check`.
- Done-Gate: Artefakt committed.
- Commit: `docs: define krumz startup card function process`

### P1 - Completion-Note korrigieren

- Ziel: JSON-Completion-Note und generierten Review-Text auf CVC Install/Purge/Corp-Trash angleichen.
- Arbeit: Generator/Review-Artefakte minimal korrigieren; keine Engine-Logik.
- Kernartefakte: `scripts/check-card-name-leakage-in-runtime.mjs`, Review JSON/Markdown.
- Checks: `corepack pnpm check:card-function-abstraction`, JSON parsebar, `git diff --check`.
- Done-Gate: CVC wird in der Completion-Note vollständig als Install-/Purge-/Corp-Trash-Slice benannt.
- Commit: `docs: mention code viral cache corp trash completion`

### P2 - Krumz Recurring-Trace-Credit-Pool

- Ziel: Krumz auf generische Recurring-Trace-Credit-Pool-Semantik ziehen.
- Arbeit: CardImplementation-Vertrag ergänzen oder vorhandene Familie nutzen; Krumz deklarieren; Trace-Payment und Refresh generisch anbinden; Tests anpassen.
- Kernartefakte: Ability-/CardImplementation-Typen, Krumz-Implementation, Trace-Orchestration, Turn-/Start-of-Turn-Refresh, Tests.
- Checks: relevante Engine-Tests, Engine-Typecheck, `git diff --check`.
- Done-Gate: Krumz bleibt nur für Trace-Zahlungen nutzbar und refreshed unverändert; funktionale Runtime-Namen sind generisch oder klarer Übergangsadapter.
- Commit: `engine: generalize krumz recurring trace credits`

### P3 - Startup Immolator Ability-Use-Ledger

- Ziel: Startup Immolator auf generische Post-pass-/fully-broken-ICE-Semantik mit `abilityUsedSourceIdsByLimitKey` ziehen.
- Arbeit: Krumz-Änderungen unangetastet lassen; Startup-spezifischen Usage-State entfernen oder auf generischen Ledger migrieren; Resolver-/Tests aktualisieren.
- Kernartefakte: Ability-Types, Startup-Implementation, Run-/Fort-Trigger-Ausführung, Turn-Flags, Tests.
- Checks: relevante Engine-Tests, Engine-Typecheck, `git diff --check`.
- Done-Gate: Startup Immolator bleibt nur im korrekten Triggerfenster nutzbar; keine `startupImmolatorUsedSourceIdsThisTurn`-Runtime-Spezialspur.
- Commit: `engine: use generic ledger for startup immolator`

### P4 - Guard und Review-Baseline

- Ziel: Review-/Guard-Stand nach Krumz und Startup kalibrieren.
- Arbeit: Guard ausführen, Report regenerieren, Abstraktionsplan/Nächste Umsetzung aktualisieren.
- Kernartefakte: Guard-Skript, Review JSON/Markdown.
- Checks: `corepack pnpm check:card-function-abstraction`, JSON parsebar, `git diff --check`.
- Done-Gate: Guard grün; Krumz und Startup Immolator sind nicht mehr als nächste kleine Slices offen.
- Commit: `docs: calibrate abstraction guard after krumz startup`

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

- Arbeitsbranch: `codex/card-function-krumz-startup`.
- Arbeits-Worktree: `C:\Projekte\NETGRID_CARD_FUNCTION_KRUMZ_STARTUP`.
- Hauptworkspace `C:\Projekte\NETGRID` wird nur für finalen Merge genutzt.
- Jedes Paket wird separat committed.
- Kein Push ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite den Card-Function-Krumz-Startup-Prozess vollständig und sequenziell von P0 bis P5 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_CARD_FUNCTION_KRUMZ_STARTUP auf Branch codex/card-function-krumz-startup. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus und committe jedes abgeschlossene Paket. Bei Sicherheitsblocker stoppe mit Blocker-Report. Nach Abschluss final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen und Goal erst dann als complete markieren.`

## Abschlusskriterien

- P0 bis P4 sind committed.
- P5 hat final verifiziert und lokal nach `main` integriert.
- Arbeits-Worktree ist entfernt.
- Siren, Bizarre Encryption Scheme und Pirate Broadcast bleiben als spätere Folgeprozesse sichtbar, aber nicht vermischt.
