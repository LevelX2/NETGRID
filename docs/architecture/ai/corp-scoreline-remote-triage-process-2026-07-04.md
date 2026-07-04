# Corp Scoreline Remote Triage Prozess 2026-07-04

## Status

`in_progress`

## Quelle/Vorgabe

Nutzerfreigabe vom 2026-07-04 nach Analyse der zwei letzten Human-vs-KI-Spiele:

- `match_ca41d980913f277f`: Runner gewinnt durch `Tycho Extension` aus HQ nach 316 StateVersions.
- `match_248657ecb512f38f`: Corp gewinnt durch Runner-Flatline, aber mit nicht optimalem Corp-Spiel.

Freigegebene Fehlergruppen:

1. Scoreline wird nicht konsequent durchgezogen.
2. ICE auf HQ/R&D wird zu stark gegenüber Remote-Scoring bewertet.
3. Funding/Rez-Floor für aktive Score-Remotes wird nicht verbindlich genug.
4. Advancebare Assets wie `Vapor Ops` verdrängen Agenda-Scorelines.
5. Action-Gain-Operationen wie `Overtime Incentives` werden ohne konkreten Payoff gespielt.

## Zielprüfung

Die Vorgabe ist für automatische Umsetzung präzise genug.

- Gesamtziel: Korp-KI verfolgt realistische Agenda-Scorelines konsequenter und deeskaliert Central-Aufbau, wenn Central bereits ausreichend geschützt ist.
- Scope: `packages/ai/src/runtime`, angrenzende AI-Tests und kurze Review-/Wissensartefakte.
- Nicht-Ziele: keine Engine-, LegalAction-, PlayerView-, Replay-, StateHash- oder Kartenpool-Änderung.
- Abnahme: Tests vergleichen Action-Familien, nicht nur einzelne Penalty-Werte.

## Gesamtziel

Die Corp-Decision-Runtime soll eine aktive oder naheliegende Agenda-Scoreline gegenüber generischem Central-Aufbau, Neben-Remotes, Asset-Counter-Spiel und wertlosen Zusatzaktionen stabil priorisieren. Central-Schutz bleibt möglich, aber nur bei konkreter, nicht bereits ausreichend beantworteter Gefahr.

## Annahmen

- Eine Agenda in einem Remote, eine legal scorebare Agenda oder eine Agenda im HQ mit existierender Score-Remote ist ein stärkerer Handlungsanker als generischer Setup-Fortschritt.
- HQ/R&D-Gefahr muss deeskalieren, wenn der Server bereits mehrere wirksame, bezahlbare Layer hat oder der Runner im aktuellen sichtbaren Zustand keinen profitablen Zugriff hat.
- Economy ist passend, wenn sie einen konkreten Rez-Floor, Score-Floor oder Payoff freischaltet.
- Advancebare Assets sind keine Scoreline, außer eine konkrete sichtbare Kartenfunktion rechtfertigt das im aktuellen Zug.
- Action-Gain-Operationen sind nur sinnvoll, wenn die gewonnenen Aktionen konkrete Development- oder Closeout-Aktionen ermöglichen.

## Nicht-Ziele

- Kein neuer Parallel-Planner.
- Keine Karten-Spezialfallliste als Architektur.
- Keine Hidden-Info-Annahmen über Runner-Hand, Runner-Stack oder verdeckte Ressourcen.
- Kein Rückbau des Corp-ICE-Placement-Evaluators.
- Kein Benchmark-Lauf als Teil dieses Pakets, sofern die fokussierten Tests den Fix belegen.

## Controller-Invarianten

- Die Engine bleibt Regelautorität.
- Die KI bewertet nur vorhandene `LegalActions`.
- Debug-/Evidence-Ausgaben bleiben side-safe.
- Scoreline-, Board-Triage-, Scoring-Window-, Effective-Defense- und ICE-Placement-Logik werden wiederverwendet und nur enger gekoppelt.
- Mismatch-Strafen dürfen Schutz/Funding nicht blockieren, wenn Schutz/Funding das aktuelle Scoreline-Problem tatsächlich löst.

## Automatische Fehlerbehandlung

- Bei roten Tests wird im aktuellen Paket debuggt.
- Wenn eine bestehende Testfixture nicht passt, wird eine fokussierte Runtime-Unit-Regression ergänzt.
- Wenn ein Verhalten eine Engine-/LegalAction-Lücke zeigt, wird es als Blocker dokumentiert und nicht in KI-Code umgangen.

## Sicherheitsblocker

- Hidden-Info-Leak in PlayerView, AI-Input, Trace, Evidence oder PublicEvent.
- Neue oder geänderte LegalAction-Erzeugung außerhalb Engine-Autorität.
- Scoreline-Fix, der `score_agenda` oder sicheren `advance_card`-Closeout blockiert.
- Central-Deeskalation, die game-ending Central-Gefahr ignoriert.

## State Machine

`preflight` -> `process_and_evidence` -> `scoreline_remote_runtime` -> `central_deescalation` -> `asset_action_gain_cleanup` -> `tests_review_integration` -> `complete`

## Paketfolge

### Paket 1: Prozess- und Evidence-Artefakte

Ziel: Analyse und Umsetzungsgates versionieren.

Arbeit:

- Dieses Prozessartefakt erstellen.
- Evidence-Report mit Match-IDs, Fehlergruppen und Akzeptanzkriterien erstellen.

Checks:

- `git diff --check`

Done-Gate:

- Prozess- und Evidence-Artefakt existieren und sind committed.

Commit:

- `docs(ai): plan corp scoreline remote triage fixes`

### Paket 2: Scoreline-Persistenz und Remote-Funding

Ziel: Aktive Agenda-Scorelines schlagen Neben-Remote-Setup und unbezahlbare Remote-ICE-Installationen.

Arbeit:

- Scoreline-/Triage-/Remote-Score-Consumer lesen.
- Scoreline-Funding als passenden Triage-Fallback behandeln.
- Neue Neben-Remotes bei aktiver Scoreline stärker unterdrücken.
- Unbezahlbare Remote-ICE-Installationen gegen Funding verlieren lassen.

Kernartefakte:

- `packages/ai/src/runtime/semantic-runtime-corp-score.ts`
- `packages/ai/src/runtime/semantic-runtime-corp-board-triage.ts`
- `packages/ai/src/runtime/semantic-runtime-corp-remote-score.ts`
- angrenzende Tests

Checks:

- fokussierte Vitests
- `git diff --check`

Commit:

- `fix(ai): strengthen corp scoreline persistence`

### Paket 3: Central-Triage-Deeskalation

Ziel: HQ/R&D-Aufbau überstimmt Remote-Scoring nur noch bei konkreter, nicht ausreichend beantworteter Gefahr.

Arbeit:

- Central-Pressure-/Board-Triage-Kriterien gegen vorhandene Schutzqualität abgleichen.
- Extra-Central-ICE bei `raw_server_need:0`, hoher Layerzahl oder bereits bezahlbarer Wirkung deeskalieren.
- Remote-Scoring bei Agenda-Druck wieder zulassen.

Checks:

- fokussierte Triage-/Score-Tests
- `git diff --check`

Commit:

- `fix(ai): deescalate defended central pressure`

### Paket 4: Asset-Advance und Action-Gain-Payoff

Ziel: Advancebare Assets und Action-Gain-Operationen verdrängen Agenda-Scorelines nicht ohne konkreten Payoff.

Arbeit:

- Asset-Advance von Agenda-Scoreline-Wertung trennen.
- Wiederholtes Asset-Counter-Advance ohne aktuellen Payoff deckeln.
- `Overtime Incentives` nur bei projizierbarem Score-, Schutz-, Funding- oder echten Economy-Payoff positiv bewerten.

Checks:

- fokussierte Vitests für `Vapor Ops`-/Asset-Advance und `Overtime Incentives`
- `git diff --check`

Commit:

- `fix(ai): require payoff for corp asset advance and action gain`

### Paket 5: Review, Checks und lokale Integration

Ziel: Verifikation ausführen, Review schreiben, lokal nach `main` integrieren und Worktree entfernen.

Arbeit:

- Fokussierte Regressionen und AI-Typecheck ausführen.
- Relevante AI-Gates ausführen, soweit Daten-/Hint-Änderungen betroffen sind.
- Final-Review und Logeintrag schreiben.
- Arbeitsbranch lokal nach `main` mergen.
- Worktree nach erfolgreichem Merge entfernen.

Checks:

- fokussierte Vitests
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit:

- `docs(ai): review corp scoreline remote triage fixes`

## Verifikationsregeln

- Tests müssen zeigen, welche Action-Familie gewinnt.
- Central-Deeskalation braucht Gegenbeispiel: echte game-ending HQ/R&D-Gefahr bleibt stärker als Remote-Setup.
- Scoreline-Persistenz braucht Gegenbeispiel: unsichere oder unfinanzierbare Scoreline darf nicht blind advanced werden.
- Action-Gain braucht Gegenbeispiel: echter Score-Closeout durch Zusatzaktionen bleibt erlaubt.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_SCORELINE_REMOTE_TRIAGE`
- Arbeitsbranch: `codex/ai-scoreline-remote-triage`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Hauptworkspace nur für finalen Merge nach `main` nutzen.
- Jeder Paketabschluss erhält einen Commit.
- Kein Push und kein PR ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite die freigegebenen NETGRID-Corp-KI-Fixpunkte sequenziell im Worktree C:\Projekte\NETGRID_AI_SCORELINE_REMOTE_TRIAGE auf Branch codex/ai-scoreline-remote-triage ab. Lege Prozess- und Evidence-Artefakte an, verbessere Scoreline-Persistenz und Remote-Funding, deeskaliere Central-Triage, korrigiere Asset-Advance und Action-Gain-Payoff, ergänze Regressionstests, führe relevante Checks aus, committe jedes Paket und merge den Arbeitsbranch lokal nach main.`

## Abschlusskriterien

- Die freigegebenen fünf Fehlergruppen sind umgesetzt oder ein echter Blocker ist dokumentiert.
- Neue Regressionen decken die beobachteten Spielmuster ab.
- Relevante Tests und Typecheck sind gelaufen.
- Review und Log sind aktualisiert.
- Arbeitsbranch ist lokal nach `main` integriert.
