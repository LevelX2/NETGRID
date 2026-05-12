# V1.9.10 bis V1.9.22 Automation Watchdog Prompt

Status: aktiver Watchdog-Prompt fuer stündliche Kontrollautomation
Stand: 2026-05-12
Watchdog-Automation: `netgrid-v1-9-originalset-watchdog`
Beaufsichtigte Automation: `netgrid-v1-9-originalset-completion`
Arbeitsbranch: `codex/v1-9-originalset-completion`

## Auftrag

Arbeite im NETGRID-Projekt wiki-first als Kontrollautomation fuer die V1.9.10-bis-V1.9.22-Originalset-Completion. Ziel ist nicht, selbst Release-Implementierung parallel zu erledigen, sondern sicherzustellen, dass die beaufsichtigte stündliche Completion-Automation weiterlaufen kann.

Der Watchdog darf klare Automationsprobleme analysieren und beheben, aber er darf keine spaeteren Releases vorziehen und keinen zweiten konkurrierenden Release-Worker starten, solange die beaufsichtigte Automation aktiv oder ein frischer Worker-Lock vorhanden ist.

## Pflichtstart je Lauf

1. Lies `AGENTS.md`, `AGENTS.local.md` falls vorhanden und `agents/release-planning-agent.md`.
2. Lies danach:
   - `KI-Wissen-NETGRID/00 Projektstart.md`
   - `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Index.md`
   - `KI-Wissen-NETGRID/02 Wissen/Prozesse/Arbeitsworkflow Wissenspflege und Projektanfragen.md`
   - `KI-Wissen-NETGRID/00 Steuerung/Regeldatei KI-Wissenspflege.md`
   - `docs/codex/CODEX_STATUS.md`
   - `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_CONTROLLER_PLAN.md`
   - `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_STATE.md`
   - `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_PROMPT.md`
   - `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_WATCHDOG_PROMPT.md`

## Pruefungen

Fuehre je Lauf diese Pruefungen aus:

- Existiert die beaufsichtigte Automation `netgrid-v1-9-originalset-completion` und ist sie aktiv?
- Existiert der Cursor `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_STATE.md`?
- Ist der Branch `codex/v1-9-originalset-completion` vorhanden und kann er von `origin` aktualisiert werden?
- Gibt es seit dem letzten Watchdog-Lauf Fortschritt durch neue Commits, Cursor-Aenderungen oder Review-/Releaseartefakte?
- Existiert der Worker-Lock `%LOCALAPPDATA%\NETGRID\automation\v1_9_originalset_completion.lock`?
- Ist ein vorhandener Worker-Lock frisch oder eindeutig stale?
- Gibt es uncommitted Aenderungen, die wie ein abgebrochener Worker-Lauf aussehen?
- Ist die letzte Cursor-Phase plausibel fuer den aktuellen Release?

## Erfolgskriterien

Der Watchdog betrachtet die Abarbeitung als gesund, wenn mindestens eines gilt:

- die Completion-Automation ist aktiv und es gibt einen frischen Worker-Lock
- die Completion-Automation ist aktiv und es gab innerhalb der letzten rund zwei Stunden einen Commit oder eine Cursor-/Review-Aktualisierung auf dem Arbeitsbranch
- der Cursor steht bewusst auf `blocked` mit konkreter Removal Condition
- der Cursor steht auf `complete`

In diesen Faellen keine Reparatur versuchen. Schreibe hoechstens einen knappen Watchdog-Befund, wenn sich dadurch ein bestehender Bericht sinnvoll aktualisieren laesst.

## Erlaubte Reparaturen

Der Watchdog darf:

- einen eindeutig stale Worker-Lock unter `%LOCALAPPDATA%\NETGRID\automation\v1_9_originalset_completion.lock` entfernen, wenn er aelter als etwa zwei Stunden ist und kein passender aktiver Prozess erkennbar ist
- die bestehende Completion-Automation wieder auf aktiv setzen, falls sie pausiert ist und keine andere aktive Completion-Automation existiert
- die Completion-Automation mit dem Prompt aus `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_PROMPT.md` neu anlegen, falls sie fehlt und keine gleichwertige aktive Automation existiert
- bei einem abgebrochenen Worker-Lauf eindeutig versionierbare, releasebezogene Aenderungen als Watchdog-Rettungs-WIP committen und pushen
- einen Blockerbericht in `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_WATCHDOG_REPORT.md` schreiben oder aktualisieren
- `docs/derived/V1_9_10_TO_V1_9_22_AUTOMATION_STATE.md` nur fuer Watchdog-Befunde, Blocker und Rettungsstatus aktualisieren

## Verbote

- Kein Push nach `main`.
- Kein Force-Push.
- Kein Merge nach `main`.
- Keine Release-Implementierung parallel zum Completion-Worker beginnen.
- Keine Karten aktivieren.
- Keine Cursor-Spruenge auf den naechsten Release ohne Completion-Gate.
- Keine zweite aktive Completion-Automation erzeugen, wenn die bestehende Automation aktiv ist.
- Keine fremden Nutzeränderungen revertieren.
- Keine lokalen Runtime-Daten, Caches, SQLite-Dateien, Secrets oder Build-Artefakte versionieren.

## Nachfolgejob-Regel

Ein Nachfolgejob darf nur angelegt werden, wenn alle folgenden Bedingungen erfuellt sind:

- die beaufsichtigte Completion-Automation fehlt oder ist eindeutig nicht reparierbar
- es existiert keine andere aktive Completion-Automation fuer denselben Branch und dieselbe V1.9.10-bis-V1.9.22-Kette
- der Cursor ist nicht `complete`
- der Watchdog dokumentiert den Grund im Watchdog-Report
- der neue Job verwendet denselben Cursor, denselben Branch und denselben Controller-Prompt

Wenn kein Automationswerkzeug verfuegbar ist, dokumentiere den Befund und pushe den Bericht, statt eine Workaround-Datei als Ersatzautomation zu erfinden.

## Git-Regeln

- Arbeitsbranch: `codex/v1-9-originalset-completion`.
- Watchdog-Commit-Muster: `WATCHDOG V1.9 completion: <kurzer Befund oder Fix>`.
- Committe nur Watchdog-/Cursor-/Report-/klar gerettete WIP-Aenderungen.
- Pushe nach `origin/codex/v1-9-originalset-completion`, wenn ein Commit erzeugt wurde.

## Abschluss je Lauf

Der sichtbare Abschlussbericht des Watchdog-Laufs muss enthalten:

- Status der Completion-Automation
- aktueller Cursor-Release und Cursor-Phase
- ob ein frischer oder stale Lock gefunden wurde
- letzte Fortschrittsanzeichen
- durchgefuehrte Reparatur oder Grund fuer Nicht-Eingriff
- Commit-Hash und Push-Ergebnis, falls vorhanden
- ob ein Nachfolgejob angelegt, reaktiviert oder bewusst nicht angelegt wurde
