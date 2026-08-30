# Remote Facility – sofortige Aktion beim Rezzen

Status: aktiv

Quelle/Vorgabe: Playtest-Fund vom 2026-07-17. `Remote Facility` wurde im Korp-Zug für 5 Credits gerezzt. Die Chronik zeigte nur „eine legale Aktion ausgeführt“ und die Korp erhielt die durch die Karte gewährte Extra-Aktion erst im folgenden Zug.

## Zielprüfung

Die Vorgabe ist präzise genug für eine automatische, begrenzte Umsetzung. Kartenregel, betroffene Engine-/Chronikpfade, erwartetes Spielergebnis und Abnahmekriterien sind bestimmt.

## Gesamtziel

Beim Rezzen von `Remote Facility` erhält die Korp im aktuellen eigenen Zug sofort eine zusätzliche Aktion. Zu Beginn jedes späteren eigenen Zuges erhält sie weiterhin eine zusätzliche Aktion. Die Chronik benennt den Rez-Vorgang für Nicht-ICE-Karten verständlich und zeigt die gewonnene Aktion mit ihrer Quelle.

## Regelgrundlage

`docs/source/Netrunner Errata 1.70.md`, Abschnitt „Remote Facility“: Die Aktion wird sofort gewonnen; rezzte die Korp sie nach der dritten Aktion, kann sie eine vierte Aktion ausführen. Der allgemeine Abschnitt „Gaining Actions“ bestätigt ebenfalls, dass beim Rezzen gewonnene Aktionen sofort gelten.

## Annahmen

- Die bestehende Modellierung der wiederkehrenden Aktion zu Beginn des Korp-Zugs bleibt gültig.
- Die neue Sofortwirkung nutzt den bestehenden `on_rez`-Lifecycle und dessen deterministische öffentliche `ResolvedGameEffect`-Darstellung.
- Eine neue Modellierung der historischen Ansagepflicht für ungenutzte quellgebundene Aktionen beim Verlassen des Spiels ist nicht Teil dieses gezielten Playtest-Fixes.

## Nicht-Ziele

- Keine Änderung an anderen Karten mit Extra-Aktionen.
- Keine Änderung des LegalAction-/PlayerAction-Vertrags.
- Kein Redesign der Chronik oder der Aktionsanzeige.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Die Rules Engine bleibt alleinige Regelautorität.
- Die UI leitet Inhalt ausschließlich aus öffentlichen Events und `ResolvedGameEffect`-Daten ab.
- Keine verdeckten Karteninformationen in PublicPayloads oder Chronik.
- Replay, StateHash und LegalAction-Revalidierung bleiben deterministisch.

## Automatische Fehlerbehandlung

Fokussierte Tests werden bei Fehlern eng an Engine beziehungsweise Chronik debuggt. Ein Konflikt mit der Regelgrundlage oder ein Hidden-Info-Leak stoppt den Prozess mit einem dokumentierten Blocker.

## Sicherheitsblocker

- Eine Aktion wird außerhalb des aktiven Korp-Zugs erzeugt.
- Der Rez-Event leakt eine zuvor verdeckte Kartenidentität.
- Replay oder StateHash unterscheiden sich nach identischem Eventlog.
- Ein Fix verändert unbeteiligte Karten mit Extra-Aktionen.

## State Machine

1. `prepared`: Prozessartefakt ist committed.
2. `engine-fixed`: Sofortwirkung und Regressionstest sind grün.
3. `chronicle-fixed`: Rez- und Effektanzeige für Nicht-ICE sind grün.
4. `integrated`: Branch ist nach `main` gemerged, Worktree und Branch sind entfernt und verifiziert.

## Paketfolge

### RF-1 Prozessartefakt

Ziel: Scope, Regelgrundlage, Pakete und Abnahme versionieren.

Kernartefakt:

- `docs/architecture/card-rules/remote-facility-immediate-rez-action-process-2026-07-17.md`

Checks:

- `git diff --check`

Done-Gate:

- Prozessartefakt ist vollständig und committed.

Commit-Message:

- `docs: add remote facility rez action process`

### RF-2 Engine-Sofortwirkung

Ziel: `Remote Facility` erzeugt beim Rezzen im Korp-Zug sofort eine Aktion und behält die Zugstart-Wirkung.

Kernartefakte:

- `packages/engine/src/card-implementations/onr-v1/corp/assets/remote-facility.ts`
- `packages/engine/src/index-tests/originalset/hidden-access-run-regressions.test.ts`

Checks:

- fokussierter Vitest für den Remote-Facility-Regressionsfall
- `corepack pnpm --filter @netgrid/engine typecheck`
- `git diff --check`

Done-Gate:

- Ein Rez für 5 Credits erhöht die verbleibenden Korp-Aktionen sofort um 1.
- Der öffentliche Effekt nennt `Remote Facility` und ist replay-/hash-stabil.
- Die vorhandene Zugstart-Aktion bleibt unverändert abgedeckt.

Commit-Message:

- `fix(engine): grant remote facility action on rez`

### RF-3 Chronik für gerezzte Nicht-ICE

Ziel: Ein `rez_card`-Event wird als konkreter Rez-Vorgang dargestellt und die sofort gewonnene Aktion wird nicht mit einem generischen LegalAction-Fallback verwechselt.

Kernartefakte:

- `apps/web/app/chronicle.ts`
- `apps/web/app/chronicle.test.ts`

Checks:

- fokussierter Vitest für die Chronikfälle
- `corepack pnpm --filter @netgrid/web typecheck`
- `git diff --check`

Done-Gate:

- Die Chronik nennt `Remote Facility`, Rez und die gezahlten 5 Credits.
- Der unmittelbare `gain_actions`-Effekt nennt seine Kartenquelle.
- Die ICE-Rez-Darstellung bleibt erhalten.

Commit-Message:

- `fix(web): describe non-ice rez events`

### RF-4 Finale Integration

Ziel: Alle Paketchecks wiederholen, Branch lokal nach `main` integrieren und den Arbeitsbereich sauber entfernen.

Checks:

- fokussierte Engine- und Web-Tests
- Engine- und Web-Typecheck
- `git diff --check`
- `git status --short`

Done-Gate:

- Der Arbeitsbranch ist sauber und vollständig nach `main` integriert.
- Der Worktree ist aus Git und Dateisystem entfernt.
- Der gemergte Arbeitsbranch ist gelöscht.

## Verifikationsregeln

Fokussierte Regel- und Anzeige-Tests haben Vorrang. Die Typechecks ergänzen sie wegen der Engine-/Web-Vertragsgrenze. Vor Integration werden alle paketbezogenen Checks wiederholt.

## Worktree-, Git- und Integrationsregeln

Arbeitsbranch: `codex/remote-facility-rez-action`

Worktree: `C:\Projekte\NETGRID_REMOTE_FACILITY_REZ_ACTION`

Die Umsetzung läuft ausschließlich im Arbeits-Worktree. Der Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen Merge verwendet. Jedes Paket erhält einen separaten Commit. Nach erfolgreichem Merge werden Worktree und Branch defensiv entfernt und doppelt verifiziert.

## Controller-Prompt-Kern

/Goal Arbeite Remote-Facility-Immediate-Rez-Action vollständig und sequenziell von RF-1 bis RF-4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, relevante Bereichs-AGENTS und dieses Prozessartefakt. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_REMOTE_FACILITY_REZ_ACTION` auf Branch `codex/remote-facility-rez-action`. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus und committe jedes abgeschlossene Paket. Bei einem Sicherheitsblocker stoppe mit Blocker-Report und Removal Condition. Nach Abschluss: final verifizieren, lokal nach `main` mergen, `main` prüfen, Worktree und Branch entfernen und deren Entfernung verifizieren.

## Abschlusskriterien

- `Remote Facility` gibt beim Rezzen im eigenen Korp-Zug sofort 1 Aktion.
- Die spätere Zugstart-Wirkung bleibt erhalten.
- Die Chronik beschreibt den Rez-Vorgang von `Remote Facility` statt eines generischen Fallbacks.
- Alle Paketchecks sind grün.
- Branch, Worktree und lokales `main` sind nach Integration sauber.
