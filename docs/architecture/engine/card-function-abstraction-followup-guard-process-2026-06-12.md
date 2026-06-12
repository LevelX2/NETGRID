# Engine Card Function Abstraction Follow-up Guard Process 2026-06-12

Status: completed_locally_merged_to_main

## Quelle/Vorgabe

Ausgang ist die Rückmeldung aus `C:\Users\Lui\.codex\attachments\8ae2ed17-9677-460d-afd8-45c893d05884\pasted-text.txt`.

Die Rückmeldung bewertet den vorherigen Card-Function-Abstraction-Stand als plausiblen ersten Vertikalschnitt, aber nicht als vollständige Entkopplung. Der unmittelbare Nacharbeitsbedarf liegt bei zwei Punkten:

- Ergebnisartefakte dürfen den abgeschlossenen lokalen Integrationsstand nicht weiter als `in_progress` oder vollständige Bereinigung darstellen.
- Der Guard darf nicht nur bekannte `watchTokens` aus dem Inventar vergleichen, sondern muss neue kartennamenspezifische funktionale Tokens aus dem Kartenkatalog ableiten können.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für direkte Umsetzung.

- Gesamtziel: Ergebnisstand korrekt dokumentieren und den Guard von einem reinen Known-Token-Inventar zu einem Baseline-Guard mit automatischer New-Leak-Erkennung erweitern.
- Scope: bestehende Prozess-/Review-Artefakte und `scripts/check-card-name-leakage-in-runtime.mjs`.
- Nicht-Ziel: Quest for Cattekin, Code Viral Cache, Krumz oder weitere Kartenslices in diesem Prozess refaktorieren.
- Sicherheitsgrenzen: keine Engine-Regeländerung, keine LegalAction-/Visibility-/Replay-/Randomness-Änderung.

## Paketfolge

### Paket 0: Folgeprozessartefakt

Ziel: diesen Folgeprozess als verbindliche Arbeitsgrundlage festhalten.

Checks:

- `git diff --check`

Commit: `docs: plan card function abstraction follow-up guard`

### Paket 1: Ergebnisartefakte abschließen

Ziel: den tatsächlichen Abschlussstand des ersten Vertikalschnitts korrekt abbilden.

Arbeit:

- Vorheriges Prozessartefakt auf lokal integriert/abgeschlossen setzen.
- Review als `inventory_with_vertical_slice` kennzeichnen.
- Guard-Charakter klar als konservativen Baseline-/Inventory-Guard beschreiben.
- Größere Refactor-Kandidaten sichtbar als offen/deferred behalten.

Checks:

- `git diff --check`

Commit: `docs: close card function abstraction result artifacts`

### Paket 2: Guard-New-Leak-Erkennung

Ziel: neue kartenspezifische funktionale Namen auch dann erkennen, wenn sie noch nicht in der statischen Watchlist stehen.

Arbeit:

- Automatische Kandidaten aus Kartentiteln und `cardDefinitionId`-Slug-/CamelCase-Varianten ableiten.
- Bestehenden Baseline-Vergleich erhalten.
- Zulässige Katalog-, Registry- und Testkontexte weiter erlauben.
- Problemzonen wie `kind`-Literal, Payload-Key, Runtime-State-Feld, Resolvername und verhaltenssteuernde Konstante weiter melden.
- Generierte Treffer als `known_watch_token` oder `derived_catalog_token` ausweisen, damit Reviews die Herkunft nachvollziehen können.

Checks:

- `corepack pnpm check:card-function-abstraction`
- `node scripts/check-card-name-leakage-in-runtime.mjs --self-test-new-leak`
- `git diff --check`

Commit: `chore: detect derived card-name function leaks`

### Paket 3: Finale Verifikation und Integration

Ziel: branchintern final verifizieren und lokal nach `main` integrieren.

Checks:

- `corepack pnpm check:card-function-abstraction`
- `node scripts/check-card-name-leakage-in-runtime.mjs --self-test-new-leak`
- `corepack pnpm format:changed -- main`
- `git diff --check`

Abschluss:

- Arbeitsbranch sauber.
- Hauptworkspace auf `main` sauber.
- Arbeitsbranch lokal nach `main` mergen.
- `git status --short` und `git diff --check` auf `main`.
- Worktree entfernen.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_CARD_FUNCTION_FOLLOWUP`
- Arbeitsbranch: `codex/card-function-followup-guard`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Jedes Paket bekommt einen eigenen Commit.
- Kein Push und kein PR ohne ausdrücklichen Nutzerwunsch.

## Abschlusskriterien

- Vorherige Ergebnisartefakte widersprechen dem Abschlussstand nicht mehr.
- Review und JSON machen sichtbar, dass es sich um Inventar plus ersten Vertikalschnitt handelt.
- Guard beschreibt und prüft automatisch abgeleitete Kartennamenvarianten.
- Neue funktionale Kartennamen-Leaks außerhalb erlaubter Kontexte würden den Guard brechen.
- Paket- und Finalchecks sind ausgeführt.
- Branch ist lokal nach `main` integriert.

## Abschlussnotiz 2026-06-12

Paket 0 bis Paket 2 sind abgeschlossen und committet. Ausgeführt wurden:

- `corepack pnpm check:card-function-abstraction`
- `node scripts/check-card-name-leakage-in-runtime.mjs --self-test-new-leak`
- `node scripts/check-format-changed.mjs -- main`
- `git diff --check`

Der Format-Check lief im Worktree über eine lokale `node_modules`-Junction auf die vorhandene Root-Installation, weil der frische Worktree keine eigene Dependency-Installation enthielt. Die Junction ist nicht versioniert.
