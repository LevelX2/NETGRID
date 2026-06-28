# AI Scoring Window Follow-up Process 2026-06-28

Status: in Umsetzung

## Quelle und Match-Evidence

Freigabe im Chat nach Analyse des neuesten beendeten Spiels:

- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Match: `match_9bede45b44104402`
- Modus: `human_runner_vs_corp_ai`
- Status: `finished`
- Final: `state_version=83`, `match_version=84`, `state_hash=fnv1a:14d87bcf`
- Gewinner: Runner, `gameEndReason=agenda_points`
- Counts: 84 Events, 84 Engine-Events, 84 State-Snapshots, 33 AI-Decision-Traces
- Corp Score Area: 0 Agendas
- Runner Score Area: 4 Agendas, 7 Punkte

Wesentliche Replay-Befunde:

- Die Adaptive-Scoring-Window-Aenderung war aktiv genug, um Remote-Agenda-Installationen und `advance_card` mit `corp.create_score_window` zu bevorzugen.
- Die Corp installierte und advancete wiederholt Agendas in `Remote 1`, konnte sie aber nicht vor dem naechsten Runner-Zug scoren.
- Der Runner hatte sichtbar `Evil Twin` und `Jackhammer`, konnte vor dem Run Credits nehmen und brach danach den relevanten ETR-Pfad durch das bereits rezzed `Dog Pile`.
- `Remote 1` wurde dadurch bei Events 53, 68 und 83 erfolgreich angegriffen; alle drei Remote-Agendas wurden gestohlen.
- Bei `sv3` installierte die Corp `Brain Wash` als HQ-Schutz, obwohl `Brain Wash` keinen Run beendet. Der Runner stahl danach bei Event 14 eine Agenda aus HQ.
- Die erwarteten `corp_scoring_window:*` Evidence-Marker wurden nicht in den gespeicherten Trace-Oberflaechen gefunden.

## Gesamtziel

Die Corp-KI soll Scorelines nur dann vorantreiben, wenn das Scoring-Fenster bis zum naechsten realistischen Score-Zeitpunkt traegt. Wenn ein Runner vor dem Score sichtbar contesten kann, muss die KI Remote-Haertung, Credits oder Aufgabe der Scoreline hoeher bewerten als blindes Install/Advance. Die Evidence muss diese Entscheidung nachvollziehbar machen.

## Nicht-Ziele

- Keine Engine-Regelaenderung.
- Keine LegalAction-Erzeugung im AI-Code.
- Keine Verwendung von Runner-Hand, Runner-Stack oder anderen verdeckten Runner-Informationen.
- Keine kartennamensspezifische Sonderregel fuer `Project Venice`, `Please Don't Choke Anyone`, `Dog Pile` oder `Brain Wash`.
- Keine Aenderung an UI, Server oder Runtime-Speicher.

## Sicherheitsgrenzen

- AI nutzt nur `PlayerView`, side-gefilterte Events, LegalActions und erlaubte Metadaten.
- Eigene Corp-Karteninformationen duerfen fuer Corp-Entscheidungen genutzt werden, aber nicht in oeffentliche oder gegnerseitige Debug-Kanaele gelangen.
- Debug-Evidence bleibt abstrakt: Window-Art, Horizon, Contestability, sichtbare Coverage, Credits und empfohlener naechster Schritt.

## Paketfolge

### Paket 1: Evidence und Prozess

Ziel: Replay-Befunde und Umsetzungsgrenzen dokumentieren.

Kernartefakte:

- `docs/architecture/ai/ai-scoring-window-followup-process-2026-06-28.md`

Done-Gate:

- Prozessartefakt beschreibt Match, Fehlergruppen, Nicht-Ziele und Paketfolge.
- `git diff --check` gruener Lauf.

Commit-Vorschlag:

- `docs(ai): record scoring window follow-up process`

### Paket 2: Runner-Exposure und Remote-Haertung

Ziel: Scoring-Window-Assessment fuer nicht-immediate Scorelines so erweitern, dass sichtbare Runner-Vorbereitung vor dem naechsten Score bewertet wird.

Arbeit:

- Runner-Contest-Budget um plausible Runner-Credit-Actions bis zur Zugriffschance erweitern.
- `scoreHorizon`/Exposure so gewichten, dass 4-Advance-Agendas nach nur einem Advance nicht als sicher gelten, wenn der Runner vorher laufen kann.
- `build_remote_ice` als gueltigen Schritt innerhalb des Scoreplans zulassen, wenn Remote-Haertung eine konkrete Schwachstelle behebt.
- Passive Scoreline-Strafen nicht gegen diese konkrete Remote-Haertung laufen lassen.

Tests:

- Fokussierte Runtime-Tests fuer nicht-immediate Agenda mit sichtbarem Breakpfad.
- Regression fuer temporary-safe Fenster ohne sichtbare Coverage.
- Regression fuer Remote-ICE als konkrete Verbesserung statt Spam.

Commit-Vorschlag:

- `fix(ai): account for runner exposure before corp score windows`

### Paket 3: Zentralserver-ICE-Wirkung und Evidence

Ziel: Akute Zentralserver-Verteidigung bewertet ICE nach sichtbarer Access-Stopp-Wirkung; Scoring-Window-Evidence erscheint in AI-Traces.

Arbeit:

- Zentrale Schutzbewertung fuer HQ/R&D zwischen ETR-/Tax-Zugriffsstopp und reinem Damage/Punish unterscheiden.
- `corp_scoring_window`-Evidence in die gespeicherte Runtime-Evidence/ScoreBreakdowns durchreichen.
- Run-Pressure-/Memory-Evidence pruefen und, falls im Scope klein behebbar, Remote-/Central-Run-Zaehler korrigieren oder klarer benennen.

Tests:

- HQ mit Agenda-Druck bevorzugt wirksames ETR-ICE gegen reines Damage-ICE.
- Scoring-Window-Evidence enthaelt `window_kind`, `score_horizon`, `runner_can_reach_access_now` und `recommended_next_step`.

Commit-Vorschlag:

- `fix(ai): expose scoring window evidence and central stop value`

### Paket 4: Verifikation und Integration

Ziel: Fokussierte und angrenzende Checks ausfuehren und branch lokal nach `main` integrieren.

Checks:

- Fokussierte Vitest-Dateien fuer neue Regressionen.
- `corepack pnpm --filter @netgrid/ai typecheck`, sofern lokal ohne Install-Blocker moeglich.
- `git diff --check`.
- Hauptworkspace-Status und lokaler Merge nach `main`.

Commit-Vorschlag:

- Kein eigener Codecommit, falls nur Merge/Review noetig ist.

## Abschlusskriterien

- Die freigegebenen Fehlerpunkte sind durch generische KI-Logik und Tests abgedeckt.
- Keine Hidden-Info-Grenze wurde erweitert.
- Arbeitsbranch ist lokal nach `main` integriert.
- Offene Restpunkte sind im Abschlussbericht benannt.
