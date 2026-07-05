# Corp Scoreline Remote Discipline Prozess 2026-07-05

## Status

`in_progress`

## Quelle/Vorgabe

Nutzerfreigabe vom 2026-07-05 nach Analyse des zuletzt abgeschlossenen Human-vs-KI-Spiels:

- Match: `match_a7da2e5a06516b81`
- Mode: `human_runner_vs_corp_ai`
- Corp-KI: `corp-ai-v0.9-hard`
- Sieger: Runner
- Abschluss: Runner stiehlt die zweite `Tycho Extension` aus R&D und erreicht die Siegbedingung.

Freigegebene Fehlergruppen:

1. Aktive Agenda braucht einen Scoreline-Lock.
2. Remote-Sprawl statt ein klares Scoring-Remote.
3. Negative Install-Entscheidungen werden trotzdem gewählt.
4. Zentrale Server werden überverteidigt, obwohl das Scoring fehlt.
5. Scoreline-Kredite werden nicht reserviert.
6. Agenda-Ausgang wird zu spät gesucht.

## Zielprüfung

Die Vorgabe ist für automatische Umsetzung präzise genug.

- Gesamtziel: Die Corp-KI verfolgt einen konkreten Agenda-Scoreline-Ausgang konsequent und deeskaliert generisches Remote-/Central-Building, sobald es die Scoreline blockiert.
- Scope: `packages/ai/src/runtime`, fokussierte AI-Runtime-Tests, Prozess-/Evidence-/Final-Review-Artefakte.
- Nicht-Ziele: keine Engine-, LegalAction-, PlayerView-, Replay-, StateHash-, Randomness- oder Kartenpool-Änderung.
- Abnahme: Unit-Regressionen zeigen, dass Advance/Funding/Score-Remote-Schutz gegenüber Neben-Remote-Setup, Central-Overicing und negativen Install-Aktionen gewinnen, ohne echte game-ending Central-Gefahr zu ignorieren.

## Gesamtziel

Die Corp Semantic Runtime soll bei installierter oder naheliegender Agenda-Scoreline einen stabilen Entscheidungsanker bilden:

- aktive Agenda im Remote priorisiert Advance, Score, Funding und gezielten Score-Remote-Schutz;
- vorhandene leere Score-Remote-Pipeline verhindert unnötige neue Remotes;
- Central-ICE und Neben-Root-Installs verlieren bei fehlendem konkretem Payoff;
- Credits werden für aktive Score-Remote-Advance-/Rez-Pfade reserviert;
- Agenda-Installationen werden früher gesucht, wenn ein vorhandenes Remote ausreichend vorbereitet oder finanzierbar ist.

## Annahmen

- Eine eigene sichtbare Agenda im Remote ist ein stärkerer Handlungsanker als generischer Central-Aufbau.
- Ein vorhandenes leeres, geschütztes Remote ist normalerweise die Scoreline-Pipeline und kein Anlass für zusätzliche leere Remotes.
- Eine negative Install-Bewertung ist ein echtes Defer-Signal, solange keine kritische Triage oder aktive Scoreline exakt diese Aktion verlangt.
- Central-Schutz bleibt erlaubt, wenn ein direkter zentraler Zugriff sichtbar game-ending oder ähnlich kritisch ist.
- Die Bewertung darf nur side-safe Daten der Corp-KI verwenden: Corp PlayerView, side-gefilterte PublicEvents, LegalActions und explizit erlaubte Metadaten.

## Nicht-Ziele

- Keine Kartennamen-Sonderregeln für `Tycho Extension`.
- Kein neuer Parallel-Planner.
- Keine Nutzung von Runner-Hand, Runner-Stack oder anderen verdeckten Runner-Zonen.
- Kein Umbau der Engine-Action-Erzeugung.
- Kein Rückbau des Corp-ICE-Placement-Evaluators; stattdessen engere Kopplung an Scoreline-/Reserve-Signale.
- Kein automatischer Push oder Pull Request.

## Controller-Invarianten

- Die Rules Engine bleibt die einzige Regelautorität.
- Die KI wählt ausschließlich vorhandene `LegalActions`.
- `applyAction` bleibt Guardrail für Seite, `actionId`, `stateVersion`, Timing, Kosten, Ziele und Choices.
- Debug-Labels dürfen nur side-safe Bewertungsgründe enthalten.
- Neue Heuristiken müssen Gegenbeispiele haben, damit Scoreline-Druck nicht blind unsichere Remote-Agendas forciert.

## Automatische Fehlerbehandlung

- Bei roten Tests wird im aktiven Paket debuggt.
- Wenn eine gewünschte bessere Aktion nicht als `LegalAction` existiert, wird das als Blocker dokumentiert und nicht in KI-Code simuliert.
- Wenn eine Änderung echte game-ending Central-Gefahr ignoriert, wird sie zurückgenommen oder enger gegated.
- Wenn der Hauptworkspace beim finalen Merge uncommitted Überschneidungen hat, wird die Integration gestoppt und der Blocker dokumentiert.

## Sicherheitsblocker

- Hidden-Info-Leak in KI-Input, PublicEvent, Debug, Review oder Testfixture.
- Regelumgehung außerhalb von `LegalActions`.
- Scoreline-Fix verdrängt legales sofortiges Scoring.
- Scoreline-Fix ignoriert sichtbare unmittelbare Niederlage über HQ/R&D.
- Finaler Merge würde fremde uncommitted Änderungen überschreiben.

## State Machine

`preflight` -> `process_and_evidence` -> `runtime_scoreline_discipline` -> `focused_regressions` -> `final_review_and_integration` -> `complete`

## Paketfolge

### Paket 1: Prozess- und Evidence-Artefakte

Ziel: Match-Befund und Umsetzungsgates versionieren.

Arbeit:

- Dieses Prozessartefakt anlegen.
- Evidence-Report mit Match-ID, Datenbasis, StateVersion-Befunden und Akzeptanzkriterien anlegen.

Kernartefakte:

- `docs/architecture/ai/corp-scoreline-remote-discipline-process-2026-07-05.md`
- `docs/reviews/ai/corp-scoreline-remote-discipline-evidence-2026-07-05.md`

Checks:

- `git diff --check`

Done-Gate:

- Prozess- und Evidence-Artefakt existieren und sind committed.

Commit:

- `docs(ai): plan corp scoreline remote discipline fixes`

### Paket 2: Runtime-Scoreline-Disziplin

Ziel: Aktive und naheliegende Agenda-Scorelines schlagen Neben-Remote-Setup, Central-Overicing und negative Install-Entscheidungen.

Arbeit:

- Board-Triage so anpassen, dass aktive Remote-Agenda und Scoreline-Clock vor generischem Central-Override greifen.
- Scoreline-Advance und Score-Remote-Funding als Triage-aligned behandeln.
- Remote-Sprawl und Non-Agenda-Root-Installs bei vorhandener Scoreline-Pipeline bestrafen.
- Negative Install-Kandidaten ohne kritische Triage oder Scoreline-Fit gegen Economy/Draw deeskalieren.
- Score-Remote-Reserve gegen nicht benötigte Installs/Rezzes berücksichtigen, soweit in der Runtime side-safe bewertbar.

Kernartefakte:

- `packages/ai/src/runtime/semantic-runtime-corp-board-triage.ts`
- `packages/ai/src/runtime/semantic-runtime-corp-score.ts`
- `packages/ai/src/runtime/corp-scoreline/semantic-runtime-corp-scoreline-assessment.ts`
- angrenzende Runtime-Helper, falls erforderlich

Checks:

- fokussierte Vitests für betroffene Runtime-Dateien
- `git diff --check`

Commit:

- `fix(ai): enforce corp scoreline remote discipline`

### Paket 3: Fokussierte Regressionen und Gegenbeispiele

Ziel: Die sechs freigegebenen Fehlergruppen mit side-safe Unit-Regressionen absichern.

Arbeit:

- Regressionen für aktive Agenda im Remote: Advance/Funding/Sicherungsaktion gewinnt gegen ACME-/Neben-Remote-/R&D-ICE-Muster.
- Regressionen für Remote-Sprawl: zweites leeres Remote verliert gegen vorhandene Score-Remote-Pipeline.
- Regressionen für negative Install-Aktionen: Economy/Draw gewinnt, wenn Board-Development keinen positiven Zweck hat.
- Gegenbeispiel: echte game-ending R&D/HQ-Gefahr darf Scoreline-Setup weiterhin schlagen.

Kernartefakte:

- `packages/ai/src/runtime/semantic-runtime-corp-score.test.ts`
- `packages/ai/src/runtime/semantic-runtime-corp-board-triage.test.ts`
- weitere fokussierte Testdateien nur bei Bedarf

Checks:

- fokussierte Vitests
- `git diff --check`

Commit:

- `test(ai): cover corp scoreline remote discipline`

### Paket 4: Final Review, Checks und lokale Integration

Ziel: Verifizieren, dokumentieren und lokal nach `main` integrieren.

Arbeit:

- Final-Report unter `docs/reviews/ai/` schreiben.
- Relevante Wissenspflege prüfen. Der Monatslog im Hauptworkspace war vor Beginn bereits uncommitted geändert; ein Logeintrag wird nur geschrieben, wenn das ohne Überschreiben fremder Änderungen möglich ist.
- Fokussierte Regressionen und AI-Typecheck ausführen.
- `git diff --check` ausführen.
- Arbeitsbranch lokal nach `main` mergen, sofern keine uncommitted Überschneidung besteht.
- Worktree nach erfolgreichem Merge entfernen.

Checks:

- fokussierte Vitests
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit:

- `docs(ai): review corp scoreline remote discipline fixes`

## Verifikationsregeln

- Tests müssen Action-Familien und Debug-Gründe prüfen, nicht nur absolute Scorezahlen.
- Scoreline-Persistenz braucht ein Gegenbeispiel für unsichere oder unfinanzierbare Agenda-Linien.
- Central-Deeskalation braucht ein Gegenbeispiel für sichtbare unmittelbare zentrale Gefahr.
- Remote-Sprawl darf legitime zweite Remote-Nutzung nicht generell verbieten, wenn kein Score-Remote existiert oder die Aktion einen konkreten Payoff hat.
- Negative-Install-Deeskalation darf eine kritische Schutzaktion nicht blockieren.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_scoreline_remote_discipline`
- Arbeitsbranch: `codex/ai-scoreline-remote-discipline`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Hauptworkspace nur für finalen Merge nach `main` nutzen.
- Jeder Paketabschluss erhält einen Commit.
- Fremde Änderungen im Hauptworkspace werden nicht reverted oder überschrieben.
- Kein Push und kein PR ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite die freigegebenen NETGRID-Corp-KI-Fixpunkte zur Scoreline-/Remote-Disziplin sequenziell im Worktree C:\Projekte\NETGRID_AI_scoreline_remote_discipline auf Branch codex/ai-scoreline-remote-discipline ab. Lege Prozess- und Evidence-Artefakte an, verbessere Scoreline-Lock, Remote-Pipeline, negative Install-Deeskalation, Central-Overicing-Gates und Score-Remote-Reserve, ergänze Regressionstests, führe relevante Checks aus, committe jedes Paket und merge den Arbeitsbranch lokal nach main, sofern keine fremden uncommitted Änderungen überschrieben würden.`

## Abschlusskriterien

- Die sechs freigegebenen Fehlergruppen sind umgesetzt oder ein echter Blocker ist dokumentiert.
- Neue Regressionen decken die beobachteten Spielmuster ab.
- Relevante Tests und Typecheck sind gelaufen.
- Evidence- und Final-Review sind aktualisiert.
- Arbeitsbranch ist lokal nach `main` integriert oder der Merge-Blocker ist klar dokumentiert.
