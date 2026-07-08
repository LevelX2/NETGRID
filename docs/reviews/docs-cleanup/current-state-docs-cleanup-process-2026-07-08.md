# Current-State-Docs-Cleanup 2026-07-08

Status: `ready_for_final_merge`
Datum: 2026-07-08
Primärer Agent: `release-implementation-agent`
Branch: `codex/docs-cleanup-current-state`
Worktree: `C:\Projekte\NETGRID_DOCS_CLEANUP_CURRENT_STATE`

## Quelle/Vorgabe

Der Nutzer hat entschieden, alte Update-, Prozess- und Zwischenstands-Dokumentation nicht mehr als dauerhaften Arbeitskontext zu behalten, wenn sie nur historische Einzelstände dokumentiert. Gewünscht ist eine saubere Analyse und Dokumentation des aktuellen Ist-Standes, danach die Entfernung nicht mehr benötigter Update- und Evidence-Artefakte. Das Projekt ist eine private Version-0-/Vor-Produktionsumgebung; Legacy-Erhalt, Migrationspfade und historische Artefakte sind nur relevant, wenn sie aktuell noch als Entscheidungs-, Regel-, Gate- oder Review-Evidence gebraucht werden.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung.

- Gesamtziel: aktuelle führende Dokumentation herstellen und entbehrliche Altartefakte entfernen.
- Reihenfolge: erst Prozess und Retention-Regel, dann Rollup, Inventar, Referenzprüfung, Löschung, Abschluss.
- In Scope: `docs/reviews/`, besonders `docs/reviews/ai/`, betroffene README-/Status-/Log-/Wissensreferenzen und maschinenlesbares Cleanup-Inventar.
- Nicht-Ziele: keine Engine-, KI-, Server-, Web- oder Produktlogikänderung; keine Remote-Integration; keine Entfernung aktiver Release-, Requirements-, Spec-, Testmatrix-, Final-Review-, Runbook-, Source- oder Data-Artefakte.
- Abnahmekriterien: Linkprüfung ohne bekannte kaputte Referenzen durch entfernte Dateien, `git diff --check`, nachvollziehbare Paketcommits, finaler lokaler Merge nach `main`.

## Gesamtziel

`/Goal` Arbeite den Prozess `Current-State-Docs-Cleanup 2026-07-08` vollständig und sequenziell von Paket DOC-CLEAN-00 bis DOC-CLEAN-04 ab und merge den abgeschlossenen Arbeitsbranch lokal nach `main`.

Lies zuerst `AGENTS.md`, `AGENTS.local.md`, die NETGRID-Wissensbasis-Einstiegsseiten und dieses Prozessartefakt. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_DOCS_CLEANUP_CURRENT_STATE` auf Branch `codex/docs-cleanup-current-state`. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket. Führe Paketchecks aus, committe jedes abgeschlossene Paket und stoppe bei Sicherheitsblockern mit Blocker-Report und Removal Condition.

## Annahmen

- `main` ist der lokale Integrationsbranch.
- Die aktuelle Version-0-Regel erlaubt Entfernung historischer Einzelartefakte, sofern ihr aktueller Nutzen vorher geprüft wurde.
- Git-Historie reicht für verworfene historische Rohartefakte aus, wenn ihr aktueller Inhalt verdichtet dokumentiert wurde.
- Große JSON-Traces und generierte Benchmark-Dumps sind keine dauerhafte Projektdokumentation, wenn sie nicht von Skripten, Tests, Statusseiten oder aktuellen Reviews referenziert werden.

## Nicht-Ziele

- Keine großflächige Verschiebung der `docs/`-Zielstruktur.
- Keine Neuschreibung der gesamten Projektwissensbasis.
- Keine Löschung von Rohquellen unter `docs/source/`.
- Keine Bereinigung lokaler Runtime-Daten, SQLite-Daten, Build-Artefakte oder Ignored Files.
- Keine Pushes, Pull Requests oder Remote-Merges.

## Controller-Invarianten

- Engine-Korrektheit, LegalActions-only, Hidden-Info-Schutz, Replay und StateHash bleiben unberührt.
- Aktuelle Status-, Roadmap-, Gate- und Release-Artefakte bleiben führend.
- Jedes gelöschte Artefakt muss entweder unreferenziert sein oder auf ein neues Rollup beziehungsweise eine aktuelle führende Quelle umgelinkt werden.
- Große Rohartefakte werden bevorzugt entfernt, nicht archiviert, wenn sie keinen aktuellen Nutzwert haben.
- Bei fachlicher Unsicherheit wird `needs-review` statt `delete` klassifiziert.

## Automatische Fehlerbehandlung

- Link- oder Script-Referenz auf eine geplante Löschung: Datei nicht löschen oder Referenz zuerst auf Rollup/aktuelle Quelle aktualisieren.
- Unklarer Gate-/Release-Wert: Datei behalten und im Inventar als `needs-review` markieren.
- Rote Checks mit Bezug zum Paket: Fehler eng beheben oder Blocker dokumentieren.
- Unrelated Änderungen in Hauptworkspace oder anderen Worktrees: nicht anfassen.

## Sicherheitsblocker

- Löschkandidat ist aktive Quelle für Script, Test, Package-Command oder Release-Gate.
- Löschkandidat enthält den einzigen bekannten aktuellen Entscheidungsstand.
- Linkprüfung kann nicht zuverlässig ausgeführt werden.
- `main` ändert während der Arbeit denselben Retention-/Rollup-Vertrag inkompatibel.

## State Machine

1. `process_prepared`
2. `retention_and_rollup_written`
3. `inventory_built`
4. `safe_artifacts_removed`
5. `verified`
6. `merged_to_main`

## Paketfolge

### DOC-CLEAN-00 - Prozess und Worktree

Ziel: Prozessartefakt erstellen und Worktree/Branch sichern.

Kernartefakte:

- `docs/reviews/docs-cleanup/current-state-docs-cleanup-process-2026-07-08.md`

Checks:

- `git status --short`
- `git diff --check`

Done-Gate:

- Prozessartefakt ist versioniert.

Commit:

- `docs(cleanup): plan current-state docs cleanup`

### DOC-CLEAN-01 - Retention-Regel und Ist-Stand-Rollup

Ziel: Führende Cleanup-Regel und aktuellen Dokumentations-/AI-Review-Ist-Stand verdichtet dokumentieren.

Kernartefakte:

- `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`
- `docs/reviews/docs-cleanup/current-state-docs-rollup-2026-07-08.md`
- aktualisierte `docs/reviews/README.md`
- aktualisierte `docs/reviews/ai/README.md`

Checks:

- `git diff --check`
- Linkprüfung für neu gesetzte Referenzen.

Done-Gate:

- Alte Review-Evidence-Regel ist durch eine Version-0-kompatible Retention-Regel präzisiert.
- Aktueller Ist-Stand ist ohne Rückgriff auf Hunderte Einzelartefakte auffindbar.

Commit:

- `docs(cleanup): define current-state retention policy`

### DOC-CLEAN-02 - Inventar und Löschliste

Ziel: Maschinenlesbares Cleanup-Inventar mit Klassen `keep`, `rollup`, `delete`, `needs-review` erzeugen.

Kernartefakte:

- `docs/reviews/docs-cleanup/current-state-docs-cleanup-inventory-2026-07-08.json`
- optionaler Markdown-Review für die erste Löschwelle.

Checks:

- Dateiexistenzprüfung.
- Referenzscan über relevante Projektdateien.

Done-Gate:

- Jede entfernbare Datei der ersten Welle ist begründet und referenzgeprüft.

Commit:

- `docs(cleanup): inventory obsolete review artifacts`

### DOC-CLEAN-03 - Sichere Altartefakte entfernen und Referenzen nachziehen

Ziel: Erste konservative Löschwelle ausführen.

Kernartefakte:

- Entfernte unreferenzierte `docs/reviews/ai/*.json`-Rohartefakte ohne aktuellen Gate-/Script-Wert.
- Nachgezogene README-/Status-/Wissensreferenzen, falls nötig.

Checks:

- `rg` gegen entfernte Pfade.
- `git diff --check`

Done-Gate:

- Keine bekannte Referenz zeigt auf entfernte Dateien.
- Aktuelle Rollup-/Retention-Dokumente erklären den neuen Zustand.

Commit:

- `docs(cleanup): remove obsolete ai review evidence`

### DOC-CLEAN-04 - Abschluss, Merge und Aufräumen

Ziel: Branch verifizieren, lokal nach `main` integrieren und Worktree entfernen.

Checks:

- `git status --short`
- `git diff --check`
- gezielte Link-/Referenzprüfung

Done-Gate:

- Arbeitsbranch ist sauber.
- `main` enthält die Paketcommits.
- Worktree ist entfernt.

Commit:

- kein eigener Commit, wenn keine Änderungen mehr entstehen.

## Verifikationsregeln

- Für reine Dokumentationsänderungen sind keine `pnpm`-Builds erforderlich.
- `git diff --check` ist in jedem Paket Pflicht.
- Vor Löschungen ist ein Referenzscan Pflicht.
- Nach Löschungen ist ein Referenzscan gegen alle entfernten Basenames und relativen Pfade Pflicht.

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/docs-cleanup-current-state`
- Arbeits-Worktree: `C:\Projekte\NETGRID_DOCS_CLEANUP_CURRENT_STATE`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Commit je abgeschlossenem Paket.
- Finaler Merge lokal nach `main`; kein Push.

## Abschlusskriterien

- Neue Retention-Regel und aktueller Rollup sind vorhanden.
- Erste sichere Altartefakt-Welle ist entfernt oder begründet blockiert.
- Keine bekannten kaputten Referenzen auf entfernte Dateien.
- Arbeitsbranch ist lokal in `main` integriert.
