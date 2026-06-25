# Korp-KI Tagged Meat-Damage Payoff Prozess

## Status

Arbeitsprozess für `act-2026-06-24-corp-ai-prioritize-tagged-meat-damage-payoffs`.

## Quelle/Vorgabe

Nutzerbeobachtung vom 2026-06-24 und Activity-Paket `docs/activities/inbox/act-2026-06-24-corp-ai-prioritize-tagged-meat-damage-payoffs.md`.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung. Gesamtziel, Startbefund, relevante Karten, Nicht-Ziele, Sicherheitsgrenzen und Akzeptanzkriterien sind im Activity-Paket benannt.

Kleine Annahmen:

- Die Umsetzung bleibt auf KI-Projektion, KI-Scoring, Debug-Evidence und Regressionen begrenzt.
- Falls `Schlaghund` intern bereits korrekt legal ausgeführt wird, aber falsch semantisch angezeigt wird, wird die Anzeige nur soweit korrigiert, wie sie aus denselben side-safe Kandidatendaten folgt.
- Stärkere mehrzügige Killplanung bleibt Follow-up; dieses Paket darf eine konservative Ein-Zug-/Mehraktions-Heuristik verwenden.

## Gesamtziel

Die Korp-KI priorisiert legale, side-safe erkennbare Tag-/Meat-Damage-Payoffs wie `Schlaghund` gegen stark getaggte Runner gegenüber generischer Economy oder Setup-Installation, sofern sichtbare Prävention den Payoff nicht vollständig neutralisiert. Die KI-Debug-Ausgabe zeigt nachvollziehbar, warum die Damage-Linie gewählt oder wegen Prävention/Kosten verworfen wurde.

## Nicht-Ziele

- Keine Änderung an Kartentexten, Engine-Regeln, LegalAction-Erzeugung oder `applyAction`.
- Keine Erweiterung von PlayerViews, PublicEvents, WebSocket-, Reconnect-, Replay-, Log- oder KI-Payloads um verdeckte Informationen.
- Keine pauschale Hochgewichtung aller Damage-Aktionen.
- Kein produktiver Serverstart außerhalb des Projekt-Startskripts.

## Controller-Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- Die KI reicht nur `LegalActions` ein.
- Hidden-Info-, Replay-, StateHash- und Randomness-Verträge bleiben unverändert.
- Genau ein Activity-Paket wird bearbeitet.
- Fremde Änderungen im Hauptworkspace bleiben unberührt.

## Automatische Fehlerbehandlung

- Bei rotem fokussiertem Test wird eng im betroffenen KI-Pfad debuggt.
- Bei Engine- oder Kartenimplementierungsfehler außerhalb des Activity-Scopes wird ein Folgepaket dokumentiert statt stiller Scope-Ausweitung.
- Bei fachlichem Sicherheitsblocker bleibt die Activity in `in-progress` mit Removal Condition.

## State Machine

`preflight` -> `process_artifact_committed` -> `activity_claimed` -> `implementation` -> `verification` -> `activity_done` -> `branch_integrated` -> `worktree_removed` -> `goal_complete`

## Paketfolge

### TAGDMG-0 Prozess-Preflight

Ziel: Worktree, Branch und Prozessartefakt vorbereiten.

Kernartefakte:

- `docs/architecture/ai/corp-ai-tagged-meat-damage-payoff-process-2026-06-24.md`

Checks:

- `git status --short`
- `git diff --check`

Done-Gate:

- Prozessartefakt committed.

Commit-Message:

- `Add tagged meat damage payoff process`

### TAGDMG-1 Activity Claim und Analyse

Ziel: Activity nach `in-progress` verschieben, Befund reproduktionsnah verstehen und betroffene KI-Pfade identifizieren.

Kernartefakte:

- Activity-Move nach `docs/activities/in-progress/`
- Code-/Testanalyse in `packages/ai/src/**`

Checks:

- Keine Tests zwingend; Analyse muss konkrete Implementierungspfade benennen.

Done-Gate:

- Activity ist geclaimed und Analyse führt zu einem engen Implementierungspfad.

Commit-Message:

- `Claim tagged meat damage payoff activity`

### TAGDMG-2 KI-Projektion und Scoring

Ziel: `Schlaghund`-/Damage-Payoff-Actions side-safe als Tag-/Meat-Damage-Payoff erkennen, differenziert gegen sichtbare Prävention bewerten und Debug-Evidence ausgeben.

Kernartefakte:

- `packages/ai/src/**`
- relevante fokussierte Tests in `packages/ai/src/**`

Checks:

- Fokussierter Vitest für den neuen Repro-Fall.
- Gegenprobe ohne Tags oder mit vollständig neutralisierender sichtbarer Prävention.

Done-Gate:

- Akzeptanzkriterien der Activity sind technisch erfüllt.

Commit-Message:

- `Prioritize tagged meat damage payoffs`

### TAGDMG-3 Activity-Abschluss und Integration

Ziel: Activity nach `done` verschieben, Ergebnisnotiz und Checks eintragen, Arbeitsbranch lokal nach `main` mergen.

Kernartefakte:

- `docs/activities/done/act-2026-06-24-corp-ai-prioritize-tagged-meat-damage-payoffs.md`

Checks:

- Paketbezogene Tests.
- `git diff --check`.
- `git status --short --branch`.

Done-Gate:

- Activity abgeschlossen, Branch sauber, lokal nach `main` integriert, Worktree entfernt.

Commit-Message:

- `Complete tagged meat damage payoff activity`

## Verifikationsregeln

- Mindestens die fokussierten KI-Regressionen laufen grün.
- Typecheck wird versucht, sofern paketbezogen sinnvoll; bekannte unrelated Fehler werden dokumentiert statt kaschiert.
- `git diff --check` muss für paketbezogene Änderungen grün sein.

## Worktree-, Git- und Integrationsregeln

- Arbeitsworktree: `C:\Projekte\NETGRID_activity_tagged_meat_damage_payoffs`
- Arbeitsbranch: `codex/activity-tagged-meat-damage-payoffs`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Main-Integration lokal, kein Push ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Korp-KI Tagged Meat-Damage Payoff Prozess vollständig und sequenziell von TAGDMG-0 bis TAGDMG-3 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_activity_tagged_meat_damage_payoffs auf Branch codex/activity-tagged-meat-damage-payoffs.
Nutze den Hauptworkspace nur für den finalen Merge.
Arbeite immer nur am aktuellen Paket.
Führe Paketchecks aus.
Committe jeden abgeschlossenen Paketstand.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Der gemeldete `Schlaghund`-/Tagged-Meat-Damage-Fall ist durch fokussierte KI-Tests abgedeckt.
- Korp-KI bewertet plausible legale Damage-Payoffs bei stark getaggtem Runner höher als generisches Setup/Economy, solange sichtbare Prävention den Payoff nicht vollständig neutralisiert.
- Activity liegt in `done`.
- Arbeitsbranch ist lokal nach `main` integriert.
- Worktree ist entfernt.
