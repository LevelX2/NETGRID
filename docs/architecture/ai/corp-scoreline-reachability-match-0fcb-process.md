# Corp-Scoreline- und Reachability-Prozess fuer Match 0fcb

Status: abgeschlossen

## Quelle

- Gespeichertes Match `match_0fcb17642297a8a2`
- Modus `human_runner_vs_corp_ai`, Corp-KI `hard`
- 108 historische KI-Entscheidungstraces und 285 State-Snapshots
- Nutzerfreigabe aller sechs Analysepunkte am 2026-07-10

## Gesamtziel

Die Corp-KI darf eine mehrzuegige Scoreline nur beginnen oder fortsetzen, wenn
der sichtbare und side-safe projizierte Runner-Zugriff beherrschbar ist. Dabei
muessen oeffentlich beobachtete Remote-Erfolge, sichtbare Aktionsoekonomie,
Scoreline-Unterstuetzung und endliche Corp-Oekonomie in einer konsistenten
Plansteuerung zusammenlaufen. Entscheidungstraces muessen echte Zugnummern
statt StateVersions speichern.

## Annahmen und Nicht-Ziele

- Es werden keine verborgenen Runner-Handkarten oder Decklisten verwendet.
- Fehlende Breaker-Abdeckung ist bei mehrzuegigen Plaenen keine dauerhafte
  Sicherheit, sondern ein Unsicherheitsfaktor.
- Red Herrings erhaelt keine kartennamensbasierte Sonderprioritaet. Schutz-
  Upgrades werden ueber sichtbare Steal-Kosten- und Remote-Schutzsemantik
  bewertet.
- BBS Whispering Campaign wird nicht immer erzwungen. Ein aktiver Plan muss
  aber entweder die Aktion steuern oder mit einem konkreten Blocker als
  aufgeschoben erklaert werden.
- Engine-Regeln und LegalActions bleiben unveraendert, sofern die Umsetzung
  keine nachgewiesene Engine-Luecke findet.

## Controller-Invarianten

1. `force_scoreline_clock` hebt ein belegtes unsicheres Scorefenster nicht auf.
2. Ein spielentscheidender Agenda-Steal wird bei unsicherem oder empirisch
   erreichbarem Remote fail-closed behandelt.
3. Erfolgreicher Zugriff auf ein Remote bleibt Reachability-Evidence, bis eine
   relevante Pfadaenderung die Beobachtung invalidiert.
4. Agenda-Ziel, Advancement-Speicher und Remote-Schutz sind getrennte Rollen.
5. Aktive Plaene duerfen nicht still durch ein ungebundenes Action-Ranking
   verschwinden.
6. Alle neuen Fakten stammen aus PlayerView, PublicEvents oder LegalActions.

## Paketfolge

### P1 - Prozess und Match-Evidence

- Prozessartefakt und reproduzierbare historische Anker dokumentieren.
- Done-Gate: Dokument vorhanden, `git diff --check` gruen.
- Commit: `docs(ai): define match 0fcb corp fix process`

### P2 - Scoreline-Sicherheitsgate und Remote-Prognose

- Unsichere mehrzuegige Scorelines auch unter `force_scoreline_clock` sperren.
- Sichtbare Aktionsoekonomie in den Expositionshorizont einrechnen.
- Erfolgreiche oeffentliche Remote-Zugriffe als empirische Reachability nutzen.
- Reale Match-Snapshots bzw. realistische Engine-/PlayerView-Zustaende testen.
- Done-Gate: fokussierte Runtime- und Scoring-Window-Tests gruen.
- Commit: `fix(ai): enforce corp scoreline reachability`

### P3 - Scoreline-Support und Plancontroller

- Scoreline-Ziel von Advancement-Support trennen.
- Remote-Schutz-Upgrades als konkrete Schutzschritte zulassen.
- Finite-Economy-Plan aktiv steuern oder nachvollziehbar blockieren.
- Done-Gate: Plan-, Mapping- und Semantic-Runtime-Tests gruen.
- Commit: `fix(ai): align corp support plans with action control`

### P4 - Trace-Zugnummer

- Tatsachliche Chronicle-Zugnummer side-safe beim Trace speichern.
- Mehrere Entscheidungen desselben Zuges erhalten dieselbe Zugnummer.
- Done-Gate: Server-Storage-/Multiplayer-Regression gruen.
- Commit: `fix(server): persist real ai trace turn numbers`

### P5 - Abschluss und Wissenspflege

- Evidence- und Final-Report schreiben.
- Fokussierte Tests, AI-Typecheck, angrenzende Tests und `git diff --check`.
- Dauerhaften Vertrag im Monatslog dokumentieren.
- Done-Gate: Arbeitsbranch sauber und alle Checks dokumentiert.
- Commit: `docs(ai): close match 0fcb corp analysis`

### P6 - Lokale Integration

- Aktuelles `main` in den Arbeitsbranch integrieren.
- Relevante Checks erneut ausfuehren.
- Arbeitsbranch lokal nach `main` mergen und Main-Status pruefen.

## Ergebnis

- P1: `d169c1fa8` - Prozess und Invarianten festgelegt.
- P2: `7ccc8d919` - Scoreline-Reachability und sichtbare Runner-Oekonomie
  gehaertet.
- P3: `614d4601f` - Supportrollen, BBS-Plan und Plancontroller angeglichen.
- P4: `703399238` - echte Chronicle-Zugnummern in KI-Traces gespeichert.
- P5: Evidence-, Abschlussbericht und Monatslog aktualisiert.
- Die fokussierten AI- und Server-Regressionen sowie beide Typechecks sind
  gruen; der breite Abschlusslauf ist im Final-Report protokolliert.

## Automatische Fehlerbehandlung

- Rote Tests werden innerhalb des aktiven Pakets bis zur Ursache verfolgt.
- Fremde Aenderungen auf `main` werden nicht zurueckgesetzt.
- Konflikte werden inhaltlich geloest; inkompatible Vertragsaenderungen sind
  ein Sicherheitsblocker.
- Hidden-Info-, Replay- oder Engine-Korrektheitsregressionen stoppen den
  Prozess ohne Workaround.

## /Goal

Arbeite diesen Prozess vollstaendig und sequenziell von P1 bis P6 im Worktree
`C:\Projekte\NETGRID_AI_MATCH_0FCB_CORP_SCORELINE` auf Branch
`codex/ai-match-0fcb-corp-scoreline` ab. Committe jedes abgeschlossene Paket,
verifiziere die direkt betroffenen Schichten und merge den fertigen Branch
lokal nach `main`. Nutze den Hauptworkspace nur fuer den finalen Merge und
veraendere keine fremden uncommitteten Dateien.
