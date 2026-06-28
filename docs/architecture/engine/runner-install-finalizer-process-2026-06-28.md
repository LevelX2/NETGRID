# Runner-Install-Finalizer-Prozess

Status: verifiziert vor lokaler Integration
Quelle/Vorgabe: Nutzerfreigabe vom 2026-06-28 nach Architekturreview zur redundanten Runner-Programminstallation, insbesondere `The Shell Traders` plus `Pattel's Virus`.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Umsetzung.

- Gesamtziel: Duplizierte Runner-Rig-Install-Finalisierungen so konsolidieren, dass gleichartige Installationsfolgen nur einmal gepflegt werden.
- Endzustand: Normale Runner-Installationen, `The Shell Traders`, Hidden-Zone-/Search-Installationen, temporäre Programminstallationen und relevante Hosting-/Temporary-Credit-Pfade nutzen gemeinsame Abschlusslogik oder ein eng begründetes gemeinsames Predicate.
- In Scope: Engine-Code unter `packages/engine/src/game/install`, `packages/engine/src/game/abilities`, `packages/engine/src/game/engine-runtime-internal` sowie zugehörige Engine-Tests.
- Nicht-Ziele: UI-Redesign, neue Kartenfreigaben, KI-Entscheidungslogik, Server/WebSocket-Verträge, Remote-Push oder Pull Request.
- Verifikation: Paketnahe Vitest-Läufe, `pnpm --filter @netgrid/engine typecheck`, `git diff --check`; final möglichst `pnpm --filter @netgrid/engine test`.

## Gesamtziel

Der Prozess führt einen gemeinsamen Runner-Rig-Install-Abschlussbaustein ein und stellt alle relevanten Spezialpfade darauf um. Der konkrete Screenshot-Bug muss danach unmöglich sein: `Pattel's Virus` darf beim Installieren über `The Shell Traders` keinen generischen `virus`-Counter auf sich selbst erhalten. Gleichzeitig müssen echte Install-Virus-Karten wie `v099_virus_program` ihren Install-Counter behalten.

## Ergebnisstand

- RIF-00: Prozessartefakt angelegt und committed mit `1295ea6d docs(engine): plan runner install finalizer process`.
- RIF-01/RIF-02: Regression für `The Shell Traders` plus `Pattel's Virus`, gemeinsames Predicate `shouldAddGenericInstallVirusCounter`, gemeinsamer Finalizer `completeRunnerProgramRigInstall` und Normalinstall-Umstellung committed mit `2c3ec142 refactor(engine): centralize runner program install finalization`.
- RIF-03: Hidden-Zone-Search-, Hidden-Zone-Nonsearch-, Hosting- und Temporary-Credit-Programminstallpfade auf den gemeinsamen Finalizer umgestellt und SMC/Pattel-Regression ergänzt mit `e0811a16 refactor(engine): reuse runner install finalizer in hidden paths`.
- Lifecycle-Grenze: Der neue Helper finalisiert Runner-Programm-State in der Rig inklusive MU, CardInstance-Zone, Recurring Credits und generischem Install-Virus-Counter. `on_install`-Lifecycle-Aufrufe bleiben in den Pfaden, die sie vorher bereits explizit ausgeführt haben; `The Shell Traders` erhält in diesem Paket keine neue Lifecycle-/Timing-Erweiterung.
- Abschlusschecks vor diesem RIF-04-Dokumentationscommit: `corepack pnpm --filter @netgrid/engine typecheck`, `corepack pnpm --filter @netgrid/engine test -- runner-special-trigger-execution`, `corepack pnpm --filter @netgrid/engine test -- hidden-zone-identity`, `corepack pnpm --filter @netgrid/engine test -- install-card`, `corepack pnpm format:changed`, `git diff --check`.

## Annahmen

- `main` bleibt lokaler Integrationsbranch.
- Arbeitsbranch: `codex/runner-install-finalizer`.
- Worktree: `C:\Projekte\NETGRID_RUNNER_INSTALL_FINALIZER`.
- Bestehende Tests dürfen angepasst werden, wenn sie die bisherige Duplikation oder falsche Semantik abgesichert haben.
- Gehostete Programminstallationen behalten zunächst die bestehende MU-Semantik, sofern Tests keinen anderen aktuellen Regelvertrag nachweisen.

## Nicht-Ziele

- Keine generelle Neugestaltung aller Runner-Installationskosten.
- Keine Korp-Install-/Rez-Refaktorierung.
- Keine Bereinigung von Test-Harness-Only-Zonenbewegungen.
- Keine Änderung der sichtbaren Webclient-Version.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- Alle PlayerActions bleiben LegalActions-basiert.
- `applyAction` bleibt finaler Guard für Seite, ActionId, StateVersion, Timing, Kosten, Ziele und Choices.
- Hidden-Info-Grenzen dürfen durch Search-/Choice-/Payload-Anpassungen nicht erweitert werden.
- Replay und StateHash müssen deterministisch bleiben.
- Neue Helper bleiben Engine-intern und ziehen keine UI-, Server-, DB- oder KI-Abhängigkeiten in das Engine-Paket.

## Automatische Fehlerbehandlung

- Bei rotem Paketcheck wird im aktiven Paket eng debuggt; kein Wechsel zum nächsten Paket.
- Wenn ein Spezialpfad fachlich nicht sicher auf den gemeinsamen Helper umstellbar ist, wird er als bewusst nicht migriert dokumentiert und mindestens das gemeinsame Predicate verwendet.
- Wenn ein Konflikt mit `main` entsteht, wird er defensiv gelöst; beide fachlichen Intentionen bleiben erhalten, sofern kompatibel.

## Sicherheitsblocker

- Ein Refactor würde Hidden-Zone-Informationen in PublicEvents, PlayerViews oder Payloads erweitern.
- Ein Refactor würde Installkosten, Klickkosten oder Timingfenster ungewollt ändern.
- Ein Refactor macht Replay/StateHash instabil.
- Ein Refactor macht `applyAction`-Validierung schwächer.

## State Machine

1. `planned`: Prozessartefakt existiert, Worktree und Branch sind angelegt.
2. `regression_guard`: Regressions- und Charakterisierungstests beschreiben erwartete Zielsemantik.
3. `helper_ready`: Gemeinsame Predicate-/Finalizer-Bausteine sind vorhanden und normaler Install nutzt sie.
4. `special_paths_migrated`: Shell-Traders- und Hidden-Zone-Pfade nutzen die gemeinsamen Bausteine.
5. `verified`: Paket- und Abschlusschecks sind grün oder dokumentiert nicht ausführbar.
6. `merged`: Arbeitsbranch wurde lokal nach `main` integriert.

## Paketfolge

### RIF-00 Prozessartefakt und Worktree

Ziel: Prozess dokumentieren und isolierte Arbeitsumgebung herstellen.
Eingangsvoraussetzungen: Hauptworkspace sauber, Branch/Worktree kollisionsfrei.
Konkrete Arbeit: Dieses Artefakt anlegen.
Kernartefakte: `docs/architecture/engine/runner-install-finalizer-process-2026-06-28.md`.
Checks: `git status --short`, `git diff --check`.
Done-Gate: Artefakt committed.
Commit-Message: `docs(engine): plan runner install finalizer process`.

### RIF-01 Regressionen und Charakterisierung

Ziel: Fehlerfall und relevante Sollzustände testbar machen.
Konkrete Arbeit:

- Test für `Pattel's Virus` über `The Shell Traders`: kein generischer Install-`virus`-Counter auf der Programmkarte.
- Test für normalen `v099_virus_program`-Install: Install-`virus`-Counter bleibt.
- Test für Hidden-Zone-/Self-Modifying-Code-Install eines CardImplementation-`virusCounter`-Programms: kein generischer Install-`virus`-Counter.
- Charakterisierung, dass `on_install` bei Spezialpfaden nach Zielarchitektur ausgeführt wird.
  Kernartefakte: Engine-Tests unter `packages/engine/src/...`.
  Checks: paketnahe Vitest-Läufe, `git diff --check`.
  Done-Gate: Neue Tests existieren; erwartete rote Stellen sind entweder vor Refactor sichtbar oder nach engem Zwischenfix grün dokumentiert.
  Commit-Message: `test(engine): cover runner install finalizer edge cases`.

### RIF-02 Gemeinsame Predicate- und Finalizer-Bausteine

Ziel: Die gleichartige Install-Abschlusslogik an einer Stelle bündeln.
Konkrete Arbeit:

- Neuen Engine-internen Helper für Runner-Rig-Install-Finalisierung anlegen.
- `shouldAddGenericInstallVirusCounter(definition)` genau einmal definieren.
- Programminstall-Finalisierung kapseln: Rig-Liste, MU, CardInstance-Zone, Recurring Credits, generischer Virus-Counter, optional `on_install`.
- Normale Runner-Programminstallation auf den Helper umstellen.
  Kernartefakte: `packages/engine/src/game/install/...`.
  Checks: `pnpm --filter @netgrid/engine test -- install-card`, `pnpm --filter @netgrid/engine typecheck`, `git diff --check`.
  Done-Gate: Normaler Install verhält sich unverändert; neue Regressionen für normale Virusprogramme bleiben grün.
  Commit-Message: `refactor(engine): centralize runner program install finalization`.

### RIF-03 Spezialpfade migrieren

Ziel: Shell-Traders-, Hidden-Zone- und relevante temporäre Installpfade nutzen die gemeinsamen Bausteine.
Konkrete Arbeit:

- `The Shell Traders` ruft den gemeinsamen Finalizer für Programm/Hardware-Install auf oder nutzt einen gemeinsamen Hardware-Finalizer.
- `hidden-zone-search-runtime` nutzt den gemeinsamen Programminstall-Finalizer.
- `hidden-zone-nonsearch-runtime` nutzt den gemeinsamen Programminstall-Finalizer für Hosting und temporäre Credit-Installationen, soweit fachlich kompatibel.
- Payload-, Shuffle-, Choice- und Temporary-Return-Spezifika bleiben lokal in den jeweiligen Pfaden.
  Kernartefakte: `runner-special-trigger-execution.ts`, `hidden-zone-search-runtime.ts`, `hidden-zone-nonsearch-runtime.ts`.
  Checks: Shell-Traders-, Hidden-Zone- und Counter/Virus-Testläufe, `git diff --check`.
  Done-Gate: Screenshot-Regression ist grün; bestehende Hidden-Info- und Replay-Smokes bleiben grün.
  Commit-Message: `refactor(engine): reuse runner install finalizer in special paths`.

### RIF-04 Abschlussprüfung und Dokumentation

Ziel: Prozessstand dokumentieren, breite Checks ausführen, lokal nach `main` integrieren.
Konkrete Arbeit:

- Prozessartefakt auf Ergebnisstatus aktualisieren.
- Relevante Tests und Typecheck ausführen.
- Arbeitsbranch sauber committen.
- `main` in Arbeitsbranch integrieren, falls nötig.
- Final nach `main` mergen und Worktree entfernen.
  Kernartefakte: Prozessartefakt, Git-Historie.
  Checks: `pnpm --filter @netgrid/engine typecheck`, relevante Engine-Tests, möglichst `pnpm --filter @netgrid/engine test`, `git diff --check`.
  Done-Gate: Arbeitsbranch ist lokal nach `main` integriert, Hauptworkspace sauber.
  Commit-Message: `docs(engine): record runner install finalizer completion`.

## Verifikationsregeln

- Nach jedem Paket: `git diff --check`.
- Nach Codepaketen: mindestens paketnahe Engine-Tests.
- Vor Merge: `pnpm --filter @netgrid/engine typecheck` und relevante Engine-Testdateien.
- Wenn der komplette Engine-Testlauf zeitlich scheitert, muss der ausgeführte Teil dokumentiert und der Rest als offenes Risiko benannt werden.

## Worktree-, Git- und Integrationsregeln

- Arbeit ausschließlich in `C:\Projekte\NETGRID_RUNNER_INSTALL_FINALIZER`.
- Branch `codex/runner-install-finalizer`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge nach `main`.
- Jeder abgeschlossene Paketstand erhält einen eigenen Commit.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite den Runner-Install-Finalizer-Prozess vollständig und sequenziell von RIF-00 bis RIF-04 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die Pflichtseiten der Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_RUNNER_INSTALL_FINALIZER auf Branch codex/runner-install-finalizer. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Alle Paket-Done-Gates erfüllt.
- Keine redundante generische Programminstall-Virus-Counter-Regel in Shell-Traders-/Hidden-Zone-Pfaden.
- `Pattel's Virus` erhält beim Install über `The Shell Traders` keinen Install-`virus`-Counter.
- Echte generische Install-Viruskarten behalten ihren Install-`virus`-Counter.
- Gemeinsame Install-Finalisierung ist Engine-intern gekapselt und testgedeckt.
- Arbeitsbranch ist lokal nach `main` integriert.
