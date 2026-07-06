# Runner Short Circuit Install Discipline Process 2026-07-07

## Status

In Umsetzung auf Branch `codex/ai-short-circuit-install-discipline` im Worktree `C:\Projekte\NETGRID_AI_SHORT_CIRCUIT_INSTALL_DISCIPLINE`.

## Quelle

Nutzerfund aus dem neuesten beendeten lokalen Match: Die Runner-KI nutzt `The Short Circuit` wiederholt, sucht Programm um Programm, installiert aber kaum etwas und wirft gesuchte Programme danach ab.

## Gesamtziel

Die Runner-KI muss Programm-Suche an einen konkreten sichtbaren Coverage-Bedarf koppeln: Wenn eine Suchkarte ein passendes Programm findet, soll der nächste Plan in Richtung Credits/Installation/Run gehen statt erneut generisch zu suchen.

## Annahmen

- Die Analyse nutzt `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite` read-only über `node:sqlite`.
- Der Nutzer hat das Skill-Freigabegate für diese Umsetzung ausdrücklich vorab freigegeben.
- Die Lösung darf nur PlayerView, LegalActions, AI-Traces und sichtbare Karten-/Serverdaten nutzen.
- Es wird keine kartennamenspezifische Sonderregel für `The Short Circuit` eingeführt; die Änderung greift generisch für Search-Quellen und Such-Choices.

## Nicht-Ziele

- Keine Engine-Regeländerung.
- Keine Decklisten-, Kartenpool- oder AI-Hint-Freischaltung.
- Keine Hidden-Info-basierte Stack-Auswertung außerhalb sichtbarer Pending-Choice-Optionen.
- Keine umfassende Runner-Strategie-Neugewichtung jenseits Search-zu-Install-Disziplin.

## Controller-Invarianten

- AI wählt ausschließlich aus `LegalActions`.
- Keine verdeckten Korp- oder Runner-Daten in Reports, PlayerViews, AI-Inputs oder Debugausgaben.
- Suche darf weiter stark sein, wenn kein sichtbarer konkreter Coverage-Answer in der Hand liegt.
- Sobald eine passende Coverage-Antwort sichtbar in der Hand liegt, muss weitere Coverage-Suche gegenüber Credits, Installation und Run-Planfortschritt zurücktreten.

## Paketfolge

1. `P1` Preflight, Replay-Evidence und Prozessartefakt.
2. `P2` Generische Runtime-/Plan-Kopplung fuer Search-Choice und Coverage-Search-Score.
3. `P3` Regressionstests und AI-Typecheck.
4. `P4` Final-Report, Wissenslog, lokaler Merge nach `main`.

## Paketdetails

### P1 Preflight und Evidence

- Ziel: Match-ID, Failure Pattern, betroffene Entscheidungen und konkrete Ursache dokumentieren.
- Kernartefakte: dieses Prozessdokument und Evidence-Report unter `docs/reviews/ai/`.
- Done-Gate: Evidence nennt Match, StateVersions, gewählte Aktionen, Suchziele, Discards und Score-Ursache.
- Commit: `docs(ai): document runner short circuit install discipline evidence`

### P2 Runtime-/Plan-Kopplung

- Ziel: Such-Choices priorisieren die aktuell fehlende Breaker-Coverage; weitere Search-Aktionen werden blockiert/abgewertet, wenn ein passender Hand-Answer sichtbar ist.
- Kernartefakte: `packages/ai/src/runtime/*`, `packages/ai/src/plans/tactical-plan-coverage-search-fit.ts`.
- Done-Gate: Keine kartenspezifische Sonderregel, Debug-Evidence benennt saturierte Search.
- Commit: `fix(ai): bind runner program search to visible coverage answers`

### P3 Tests

- Ziel: Replay-Failure als fokussierte Regression sichern.
- Kernartefakte: Search-Choice-, Goal-Fit- und Coverage-Search-Fit-Tests.
- Done-Gate: fokussierte Vitests, `@netgrid/ai typecheck`, `git diff --check`.
- Commit: zusammen mit P2, falls Code und Tests untrennbar sind.

### P4 Abschluss

- Ziel: Final-Report und Wissenslog schreiben, Branch lokal nach `main` mergen.
- Kernartefakte: `docs/reviews/ai/*final*`, `KI-Wissen-NETGRID/03 Betrieb/Log 2026-07.md`.
- Done-Gate: Arbeitsbranch sauber, Merge nach `main`, Nachprüfung auf `main`.
- Commit: `docs(ai): record runner short circuit install discipline closeout`

## Sicherheitsblocker

- Wenn der Fix verdeckte Stack-/Corp-Daten außerhalb der Pending-Choice-Optionen bräuchte, stoppen.
- Wenn Tests zeigen, dass generische Suche ohne sichtbaren Hand-Answer beschädigt wird, Änderung enger schneiden.
- Wenn `main` nicht kollisionsfrei integrierbar ist, Merge stoppen und Konfliktbericht schreiben.

## Abschlusskriterien

- Runner-Suche ist planfortschreibend: suchen, passenden Answer wählen, Credits/Installation/Run statt Suchloop.
- Regressionstests decken die früher ungeschützte +1400-Search-Dominanz ab.
- Finale Dokumentation nennt Grenzen und gelaufene Checks.
