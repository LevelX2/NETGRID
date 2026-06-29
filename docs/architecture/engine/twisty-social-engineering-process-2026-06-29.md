# Twisty Social Engineering Paketprozess

Status: geplant
Quelle/Vorgabe: Nutzerfreigabe vom 2026-06-29 nach Analyse des aktuellen SQLite-Spiels `match_c1426609ec05a7d5`.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Umsetzung.

- Gesamtziel: `Social Engineering` darf beim automatischen Passieren einer unrezzed `Twisty Passages` keinen aktiven `Twisty Passages`-Rücknahmeeffekt auslösen. Legal rezzed ausgelöste Rücknahmen müssen in der Spielchronik nachvollziehbar bleiben.
- Endzustand: `Social Engineering` erhält die normale Approach-/Rez-Gelegenheit vor dem automatischen Passieren. Die Rules Engine öffnet `corp_return_passed_ice_to_hq` nur für rezzed passierte ICE, sofern die Kartenfamilie keine ausdrückliche unrezzed-Ausnahme hat. Die Chronik erklärt den legalen Rücknahmefall side-safe.
- In Scope: Run-Movement-/Run-Window-Logik, Proteus-Regressionstests, Chronik-Rendering und Chronik-Tests.
- Nicht-Ziele: Neue Kartenfreischaltungen, KI-Strategieänderungen, DB-Migrationen, Replay-Reparatur historischer Events, UI-Redesign, Remote-Push oder Pull Request.
- Verifikation: Paketnahe Engine- und Web-Tests, Typecheck soweit paketnah nötig, `git diff --check`.

## Gesamtziel

Der Prozess behebt den im aktuellen Spiel beobachteten Rules-Engine-Fehler: Eine unrezzed `Twisty Passages` auf R&D wurde durch `Social Engineering` automatisch passiert und durfte danach trotzdem nach HQ zurückgenommen werden. Nach dem Fix bleibt zuerst das Approach-/Rez-Fenster erhalten. Danach bleibt dieser Trigger gesperrt, solange die ICE unrezzed ist. Wenn die Corp die ICE beim Approach rezzed, darf der automatische Pass weiterhin den legalen Rücknahme-/Zahlungsentscheid auslösen.

## Annahmen

- `main` bleibt lokaler Integrationsbranch.
- Arbeitsbranch: `codex/twisty-social-engineering-fix`.
- Worktree: `C:\Projekte\NETGRID_TWISTY_SOCIAL_ENGINEERING_FIX`.
- `Social Engineering` soll die Rez-Gelegenheit der Corp nicht entfernen.
- `Twisty Passages` hat keine unrezzed-Ausnahme. Karten mit ausdrücklicher unrezzed-Ausnahme bleiben außerhalb dieses Guards.
- Historische SQLite-Spiele werden nicht migriert; die Diagnose erklärt den bereits gespeicherten Fehlzustand.

## Nicht-Ziele

- Keine Änderung am Corp-Handlimit oder am Discard-Phasenvertrag.
- Keine Änderung an der Mandatory-Draw-Logik.
- Keine nachträgliche Mutation bestehender Eventlogs.
- Keine breite Neuarchitektur aller Run-Windows.
- Keine sichtbare Versionsnummer-Erhöhung, sofern kein Release-Schnitt verlangt wird.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- UI, Server, menschliche Spieler und KI reichen nur `LegalActions` abgeleitete `PlayerActions` ein.
- `applyAction` validiert Seite, ActionId, StateVersion, Timing, Kosten, Ziele und Choices erneut.
- Public Payloads, PlayerViews, Chronik und Replay dürfen keine verdeckten Kartendaten leaken.
- Replay und StateHash bleiben deterministisch.
- Engine-Code zieht keine Web-, Server-, DB- oder KI-Abhängigkeiten.

## Automatische Fehlerbehandlung

- Bei roten Paketchecks wird ausschließlich im aktiven Paket debuggt.
- Wenn ein Test die bisherige illegale Semantik absichert, wird er auf den aktuellen Regelvertrag umgestellt.
- Wenn die Chronik für den legalen Fall zusätzliche Payload-Daten braucht, werden diese side-safe und möglichst eng ergänzt.
- Wenn der Chronikteil unerwartet Hidden-Info-Grenzen berührt, wird er als separater Sicherheitsblocker dokumentiert und nicht durch Leaks gelöst.

## Sicherheitsblocker

- Ein Fix würde legitime rezzed `Twisty Passages`-Rücknahmen blockieren.
- Ein Fix würde Karten mit ausdrücklicher unrezzed-Ausnahme blockieren.
- Chronik- oder Payload-Änderungen würden unrezzed Kartennamen oder HQ-Ziele für die falsche Seite sichtbar machen.
- StateHash oder Replay würden nondeterministisch.

## State Machine

1. `planned`: Prozessartefakt existiert und ist committed.
2. `engine_guarded`: Unrezzed post-pass ICE-Rücknahmen sind blockiert und Regressionen sind grün.
3. `chronicle_explained`: Legal rezzed Rücknahmen werden nachvollziehbar und side-safe chronikalisiert.
4. `verified`: Paket- und Abschlusschecks sind grün oder dokumentiert nicht ausführbar.
5. `merged`: Arbeitsbranch wurde lokal nach `main` integriert.

## Paketfolge

### TSE-00 Prozessartefakt und Worktree

Ziel: Prozess dokumentieren und isolierte Arbeitsumgebung herstellen.
Eingangsvoraussetzungen: Hauptworkspace sauber, Branch/Worktree kollisionsfrei.
Konkrete Arbeit: Dieses Artefakt anlegen.
Kernartefakte: `docs/architecture/engine/twisty-social-engineering-process-2026-06-29.md`.
Checks: `git status --short`, `git diff --check`.
Done-Gate: Artefakt committed.
Commit-Message: `docs(engine): plan twisty social engineering fix`.

### TSE-01 Engine-Guard und Regressionen

Ziel: `Social Engineering` wahrt die Corp-Rez-Gelegenheit, und unrezzed passierte ICE darf keinen eigenen post-pass Rücknahmeeffekt öffnen.
Konkrete Arbeit:

- Regression: Nach `Social Engineering` auf eine unrezzed ICE steht die Corp zuerst im Approach-/Rez-Fenster.
- Regression: `Social Engineering` auf unrezzed `Twisty Passages` öffnet keinen `corpPostPassIceReturnToHq`-Choice und erhöht HQ nicht.
- Regression: Rezzed `Twisty Passages` bleibt legal und öffnet nach automatischem Pass weiterhin den Zahlungs-/Rücknahmeentscheid.
- Run-Movement-Änderung: Auto-Pass-Markierungen werden erst nach dem Rez-/Nicht-Rez-Entscheid verbraucht.
- Run-Movement-Guard: `corp_return_passed_ice_to_hq` wird nur für rezzed passierte ICE geprüft.

Kernartefakte: `packages/engine/src/game/run/run-movement.ts`, Proteus-Engine-Tests.
Checks: paketnaher Vitest-Lauf für Proteus variable/post-pass ICE, `pnpm --filter @netgrid/engine typecheck`, `git diff --check`.
Done-Gate: Rez-Gelegenheit und beide Twisty-Regressionen grün; keine Hidden-Info-Erweiterung.
Commit-Message: `fix(engine): require rezzed ice for post-pass return windows`.

### TSE-02 Chronik-Erklärung für legale Rücknahme

Ziel: Die Spielchronik macht legale `Twisty Passages`-Rücknahmen nachvollziehbar, ohne unrezzed Informationen zu leaken.
Konkrete Arbeit:

- Chroniktext für legal sichtbare Rücknahmeentscheidung prüfen und bei Bedarf ergänzen.
- Side-sichere Datenbasis nutzen: Kartennamen nur im legal rezzed/known Fall anzeigen.
- Test für den chronikalisierten Rücknahmefall ergänzen oder aktualisieren.

Kernartefakte: `apps/web/app/chronicle.ts`, zugehörige Web-Tests und gegebenenfalls side-safe PublicEvent-Payload.
Checks: paketnaher Web-Test, `git diff --check`.
Done-Gate: Chronik nennt Ursache und Entscheidung im legalen Fall; unrezzed Identität bleibt verborgen.
Commit-Message: `fix(web): explain legal twisty return in chronicle`.

### TSE-03 Abschlussprüfung und lokale Integration

Ziel: Prozessstand dokumentieren, finale Checks ausführen, Arbeitsbranch lokal nach `main` integrieren.
Konkrete Arbeit:

- Prozessartefakt auf Ergebnisstand aktualisieren.
- Relevante Engine- und Web-Checks erneut ausführen.
- Arbeitsbranch sauber committen.
- Aktuelles `main` in den Arbeitsbranch integrieren, falls nötig.
- Lokal nach `main` mergen und Worktree entfernen.

Kernartefakte: Prozessartefakt, Git-Historie.
Checks: `pnpm --filter @netgrid/engine typecheck`, relevante Engine-/Web-Tests, `git diff --check`, `git status --short`.
Done-Gate: Arbeitsbranch ist lokal nach `main` integriert, Hauptworkspace sauber.
Commit-Message: `docs(engine): record twisty social engineering completion`.

## Verifikationsregeln

- Nach jedem Paket: `git diff --check`.
- Nach Engine-Code: fokussierte Engine-Tests plus Engine-Typecheck.
- Nach Chronik-Code: fokussierte Web-Tests.
- Vor Merge: alle relevanten fokussierten Checks erneut ausführen.
- Nicht ausgeführte breite Checks werden als Restrisiko dokumentiert.

## Worktree-, Git- und Integrationsregeln

- Arbeit ausschließlich in `C:\Projekte\NETGRID_TWISTY_SOCIAL_ENGINEERING_FIX`.
- Branch `codex/twisty-social-engineering-fix`.
- Hauptworkspace `C:\Projekte\NETGRID` nur für finalen lokalen Merge nach `main`.
- Jeder abgeschlossene Paketstand erhält einen eigenen Commit.
- Kein Push und kein Pull Request.

## Controller-Prompt-Kern

`/Goal Arbeite den Twisty-Social-Engineering-Prozess vollständig und sequenziell von TSE-00 bis TSE-03 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main. Lies zuerst AGENTS.md, AGENTS.local.md, die Pflichtseiten der Wissensbasis und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_TWISTY_SOCIAL_ENGINEERING_FIX auf Branch codex/twisty-social-engineering-fix. Nutze den Hauptworkspace nur für den finalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Arbeite immer nur am aktuellen Paket. Führe Paketchecks aus. Committe jedes abgeschlossene Paket. Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition. Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.`

## Abschlusskriterien

- Unrezzed `Twisty Passages` kann nach `Social Engineering` nicht mehr durch ihren eigenen post-pass Text nach HQ zurückgenommen werden.
- Rezzed `Twisty Passages` behält den legalen Rücknahme-/Zahlungsentscheid nach automatischem Pass.
- Die Spielchronik erklärt legale Rücknahmen nachvollziehbar und side-safe.
- Paketchecks sind ausgeführt und dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert.
