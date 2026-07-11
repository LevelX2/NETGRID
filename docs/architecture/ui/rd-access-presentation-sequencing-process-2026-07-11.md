# R&D-Access-Präsentation und Sequenzierung

## Status

In Umsetzung am 11. Juli 2026.

## Quelle und Vorgabe

Ausgangspunkt ist das aktive Match `match_c92fb9f50400dcb7`. Im ersten Runner-Zug erzeugten drei Engine-Events vier konkurrierende UI-Präsentationen:

- `evt_8`: Run auf R&D;
- `evt_9`: Zugriff auf `Setup!`, öffentliche Reveal-Pflicht und 2 Net Damage;
- `evt_10`: `Setup!` wird getrasht.

Die Oberfläche zeigte dafür getrennte Run-, Damage-, Access- und Trash-Fenster. Während das Damage-Fenster auf Bestätigung wartete, liefen Cue-Timer und lokales KI-Pacing weiter.

## Zielprüfung

Die Vorgabe ist ausreichend präzise. Der Endzustand ist eine einzige kontrollierte Access-Sequenz, die fachlich zusammengehörige Ereignisse in einem Fenster bündelt und bestätigungspflichtige Stufen tatsächlich blockierend präsentiert.

## Gesamtziel

R&D-Zugriffe werden hidden-info-sicher und ohne konkurrierende Fenster präsentiert. Öffentliche Karten, Access-Effekte, Damage sowie Trash- und Steal-Ergebnisse gehören derselben Access-Sequenz. Maximal eine blockierende Ereignispräsentation ist gleichzeitig sichtbar.

## Annahmen

- Die Rules Engine und ihre Eventfolge bleiben Regelautorität.
- Die UI koordiniert ausschließlich Präsentation und lokales KI-Pacing; sie verändert keine LegalActions und keine Engine-Auflösung.
- Ein Access-Event mit öffentlicher Kartenidentität darf Karte und Titel anzeigen. Ein redigierter Zugriff darf keine Kartenidentität rekonstruieren.
- Bei lokalem KI-Gegner darf eine bestätigungspflichtige Damage-Stufe die nächste KI-Aktion bis zur Bestätigung anhalten.
- Bei externen menschlichen Gegnern können Folgeevents bereits eintreffen; die UI puffert und koalesziert sie, ohne den Serverzustand zurückzuhalten.

## Nicht-Ziele

- Keine Änderung der Zugriffs-, Damage-, Trash- oder Stehlregeln.
- Keine neue Rückwärtskompatibilität für historische Replays.
- Kein Redesign aller allgemeinen Action-Cues.
- Keine Offenlegung verdeckter R&D-Karten.

## Controller-Invarianten

1. Genau eine Präsentationsstufe ist sichtbar.
2. Access-bezogener Damage wird im Access-Fenster gezeigt, nicht zusätzlich im allgemeinen Damage-Fenster.
3. Eine offene Damage-Bestätigung sperrt das lokale KI-Pacing.
4. Cue-Auto-Dismiss läuft während einer blockierenden Damage-Stufe nicht weiter.
5. Eine öffentliche Access-Präsentation besitzt nachgelagerte Trash-, Steal- und Decline-Cues derselben Karte.
6. Ein Run-Cue darf verschwinden, sobald die konkretere Access-Präsentation übernimmt.
7. Allgemeiner Damage außerhalb eines Access bleibt im bestehenden Damage-Fenster.
8. Redigierte Access-Events bleiben redigiert.

## Automatische Fehlerbehandlung

- Fehlt eine sichere Zuordnung zwischen Outcome und öffentlichem Access, bleibt der bestehende eigenständige Cue erhalten.
- Fehlt die Karte im Katalog, wird ausschließlich die bereits öffentliche Eventinformation verwendet.
- Kann ein Damage-Cue keinem Access-Event zugeordnet werden, fällt er auf das allgemeine Damage-Fenster zurück.
- Tests oder Typecheck müssen vor dem nächsten Paket grün sein.

## Sicherheitsblocker

- Jede Zuordnung, die eine Kartenidentität aus einer verdeckten Zone erraten müsste, ist verboten.
- Eine Änderung an Engine- oder PlayerView-Visibility-Verträgen erfordert einen separaten Review und liegt außerhalb dieses Prozesses.

## State Machine

```text
idle
  -> generic_access_notice
  -> public_access_damage_blocked
  -> public_access_resolving
  -> public_access_outcome
  -> idle

public_access_damage_blocked --Weiter--> public_access_resolving
public_access_resolving --trash/steal/decline--> public_access_outcome
public_access_outcome --OK--> idle
```

Ein normaler verdeckter Zugriff ohne öffentliche Folge nutzt nur `generic_access_notice`. Mehrfachzugriffe durchlaufen dieselbe Sequenz pro `accessIndex`, ohne Fenster zu stapeln.

## Paketfolge

### Paket 1: Präsentationsvertrag

- Dieses Prozessartefakt erstellen.
- Invarianten, State Machine und Fallmatrix festlegen.
- Done-Gate: Dokument vorhanden, `git diff --check` grün, eigener Commit.
- Commit: `docs(ui): define R&D access presentation process`

### Paket 2: Modell und Cue-Koaleszierung

- Reine Helper für Access-Outcome-Zuordnung und Cue-Besitz einführen.
- Öffentliche Trash-/Steal-Folgen nicht als zusätzliche Action-Cues ausgeben.
- Access-Reveal um sicheren Outcome-Status erweitern.
- Done-Gate: fokussierte Unit-Tests, Web-Typecheck und `git diff --check` grün.
- Commit: `feat(ui): coalesce R&D access outcomes`

### Paket 3: Kombiniertes Access-/Damage-Fenster und Pacing

- Access-bezogenen Damage im Access-Fenster darstellen.
- Allgemeines Damage-Fenster für diesen Event unterdrücken.
- KI-Pacing und Cue-Timer während der Damage-Bestätigung sperren.
- Übernommene Run-/Access-Cues aus aktuellem Cue und Queue entfernen.
- Done-Gate: Interaktions- und Pacing-Regressionen sowie Typecheck grün.
- Commit: `feat(ui): sequence blocking access damage presentation`

### Paket 4: Fallmatrix und visuelle Verifikation

- Setup!, normaler verdeckter Zugriff, Trash, Agenda/Steal, Nicht-Access-Damage und Mehrfachzugriff abdecken.
- Desktop- und Mobile-Darstellung im Browser prüfen.
- Abschlussstand und ausgeführte Checks dokumentieren.
- Done-Gate: fokussierte Tests, Typecheck, Browserprüfung und `git diff --check` grün.
- Commit: `test(ui): cover R&D access presentation matrix`

## R&D-Fallmatrix

| Fall | Präsentation |
| --- | --- |
| Verdeckte normale Karte ohne Folge | Ein generischer, nicht blockierender Access-Hinweis ohne Kartenidentität |
| Verdeckte Karte wird getrasht | Ein öffentlicher Outcome-Cue; keine vorzeitige Kartenidentität |
| Öffentliche Reveal-Karte | Ein Access-Fenster mit Karte |
| Reveal-Karte verursacht Damage | Dasselbe Access-Fenster zeigt eine blockierende Damage-Stufe |
| Agenda ohne Zusatzkosten | Ein Access-Fenster mit anschließendem Steal-Ergebnis |
| Agenda mit Stehlkosten | Dasselbe Fenster bleibt über Entscheidung und Ergebnis bestehen |
| Korp-Reaktion oder Bezahlentscheidung | Blockierende Choice innerhalb der Access-Sequenz |
| Mehrfachzugriff | Eine sequenzielle Präsentation pro `accessIndex`, niemals überlagert |
| Zugriff wird ersetzt | Nur die Präsentation des Ersatzeffekts |

## Verifikationsregeln

- `corepack pnpm --filter @netgrid/web typecheck`
- fokussierte Vitest-Läufe für `action-cues`, `access-review-derivation`, `action-board-ui` und Layering
- `git diff --check`
- Playwright-Screenshots für Desktop und Mobile

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_RD_ACCESS_PRESENTATION`
- Branch: `codex/rd-access-presentation`
- Genau ein Paket ist aktiv.
- Jedes Paket erhält einen eigenen Commit.
- Vor dem Abschluss wird aktuelles `main` in den Arbeitsbranch integriert.
- Danach wird der Arbeitsbranch lokal nach `main` gemergt.
- Push und Pull Request sind nicht Teil dieses Prozesses.

## Controller-Prompt-Kern

```text
/Goal Arbeite den Prozess R&D-Access-Präsentation vollständig und sequenziell von Paket 1 bis Paket 4 ab und merge den abgeschlossenen Arbeitsbranch lokal nach main.

Lies zuerst AGENTS.md, AGENTS.local.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_RD_ACCESS_PRESENTATION auf Branch codex/rd-access-presentation. Nutze den Hauptworkspace nur für den finalen Merge. Arbeite immer nur am aktuellen Paket. Führe die Paketchecks aus und committe jedes abgeschlossene Paket. Bewahre Hidden-Info-Grenzen und Engine-Autorität. Bei Sicherheitsblocker stoppe mit Removal Condition. Integriere vor Abschluss aktuelles main, verifiziere erneut, merge lokal nach main und entferne den Worktree. Markiere das Goal erst danach als complete.
```

## Abschlusskriterien

- Setup! erzeugt keine vier konkurrierenden Fenster mehr.
- Access-Damage stoppt das lokale KI-Pacing bis zur Bestätigung.
- Damage, Karte und Outcome bleiben in einer Access-Präsentation.
- Allgemeiner Damage funktioniert unverändert.
- Redigierte R&D-Zugriffe leaken keine Kartenidentität.
- Alle Paketcommits sind lokal nach `main` integriert.
