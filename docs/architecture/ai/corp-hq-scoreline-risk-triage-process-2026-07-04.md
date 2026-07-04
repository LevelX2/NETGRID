# Corp HQ Scoreline Risk Triage Prozess 2026-07-04

## Status

`complete`

## Quelle/Vorgabe

Nutzerfreigabe vom 2026-07-04 nach Analyse des neuesten Human-vs-KI-Spiels:

- Match: `match_cc21ade0f73dd743`
- Modus: `human_runner_vs_corp_ai`
- Ergebnis: Runner gewinnt 7:2 über wiederholte HQ-Zugriffe.

Freigegebene Fehlergruppen:

1. HQ-Agenda-Druck wird bei sichtbarer Runner-Central-Coverage zu schwach als akute Gefahr behandelt.
2. `contestable_remote` begräbt Scoreline-/Agenda-Evakuierung aus HQ zu absolut.
3. Draw-/Burst-Economy verschärft HQ-Agenda-Gefahr, ohne Schutz oder Scoreline zu lösen.
4. Non-Agenda-Root-Installationen verlieren Tempo, obwohl eine Agenda in das bestehende Scoring-Remote gelegt werden kann.

## Zielprüfung

Die Vorgabe ist für automatische Umsetzung präzise genug.

- Gesamtziel: Korp-KI soll bei agenda-dichtem HQ und sichtbarer Central-Reach nicht passiv weiterbauen, sondern Agenda-Druck konkret über Scoreline, HQ-Schutz oder sinnvolle Funding-Schritte beantworten.
- Scope: Corp Semantic Runtime, Corp Board Triage, Scoring-/Remote-Score-Consumer und fokussierte AI-Tests.
- Nicht-Ziele: keine Engine-, LegalAction-, PlayerView-, Replay-, StateHash-, Kartenpool- oder Hint-Großmigration.
- Abnahme: Tests prüfen, dass richtige Action-Familien gewinnen, nicht nur dass einzelne Penalties existieren.

## Gesamtziel

Die Corp-Decision-Runtime soll HQ-Agenda-Risiko, bestehendes Scoring-Remote und sichtbare Runner-Central-Coverage kohärent verbinden. Passive Economy/Draw und nicht unmittelbar hilfreiche Root-Installationen sollen bei hoher HQ-Gefahr verlieren, während Agenda-Installationen in ein vorhandenes wehrhaftes Remote als relative Risikoreduktion möglich bleiben.

## Annahmen

- `Executive File Clerk`-ähnliche sichtbare HQ-View-/HQ-Pressure-Ressourcen erhöhen die HQ-Gefahr, ohne verdeckte Runner-Hand- oder Stack-Annahmen.
- Ein bestehendes Remote mit wirksamer ICE ist nicht automatisch sicher; es kann aber relativ besser sein als mehrere Agendas im erreichbaren HQ.
- Draw-/Burst-Economy ist gut, wenn sie konkrete Score-, Schutz- oder Funding-Aktionen freischaltet; sonst darf sie HQ-Agenda-Druck verschärfen.
- Non-Agenda-Root in einem Scoring-Remote braucht einen aktuellen Payload-Plan, sonst soll die installierbare Agenda Vorrang haben.

## Nicht-Ziele

- Kein neuer Parallel-Planner.
- Keine LegalAction-Erzeugung außerhalb der Engine.
- Keine Hidden-Info-Annahmen über Runner-Hand, Runner-Stack oder verdeckte Runner-Ressourcen.
- Keine Kartennamen-Sonderregel als Hauptarchitektur.
- Kein Benchmark-Lauf als Paketpflicht; fokussierte Regressionen haben Vorrang.

## Controller-Invarianten

- Die Engine bleibt Regelautorität.
- Die KI bewertet nur bestehende `LegalActions`.
- Debug-/Evidence-Ausgaben bleiben side-safe.
- Existing Triage-, Remote-Score-, Scoring-Window- und ICE-Placement-Logik wird wiederverwendet.
- `contestable_remote` bleibt relevant, darf aber relative HQ-Risikoreduktion nicht blind blockieren.

## Automatische Fehlerbehandlung

- Bei roten Tests wird im aktiven Paket eng debuggt.
- Wenn eine Fixture fehlt, wird eine fokussierte Runtime-Regression ergänzt.
- Wenn eine korrekte Lösung eine Engine-/LegalAction-Erweiterung braucht, wird ein Blocker dokumentiert statt KI-Code zu umgehen.

## Sicherheitsblocker

- Hidden-Info-Leak in AI-Input, Debug, PlayerView, PublicEvent oder Replay.
- Neue oder geänderte Engine-Legalität außerhalb des Scope.
- Fix, der sichere `score_agenda`-Closeouts oder echte game-ending Central-Gefahr unterdrückt.
- Remote-Evakuierung, die eine offensichtlich frei stehlbare Agenda systematisch bevorzugt.

## State Machine

`preflight` -> `process_and_evidence` -> `hq_agenda_triage` -> `relative_remote_evacuation` -> `economy_draw_and_root_payload` -> `tests_review_integration` -> `complete`

## Paketfolge

### Paket 1: Prozess- und Evidence-Artefakte

Ziel: Analyse, Scope und Paketgates versionieren.

Arbeit:

- Dieses Prozessartefakt erstellen.
- Evidence-Report mit Match-ID, kritischen StateVersions, LegalActions und Findings erstellen.

Checks:

- `git diff --check`

Done-Gate:

- Prozess- und Evidence-Artefakte existieren und sind committed.

Commit:

- `docs(ai): plan corp hq scoreline risk triage`

### Paket 2: HQ-Agenda-Risk-Triage

Ziel: Agenda-dichtes HQ plus sichtbare Runner-Central-Reach wird high/critical und schlägt passive Aktionen.

Arbeit:

- `semantic-runtime-corp-board-triage.ts` und Score-Integration prüfen.
- HQ-/R&D-Gefahr um HQ-Agenda-Dichte, Runner-Coverage, HQ-Viewer und Runner-Credits schärfen.
- Draw/Economy ohne konkrete Lösung bei high/critical HQ-Gefahr als mismatch behandeln.

Checks:

- fokussierte Vitests für Triage-/Score-Komponenten
- `git diff --check`

Commit:

- `fix(ai): escalate hq agenda pressure triage`

### Paket 3: Relative Remote-Evakuierung

Ziel: Agenda-Installationen in ein vorhandenes Scoring-Remote dürfen bei gefährlichem HQ besser sein als passive Aktionen.

Arbeit:

- Contestable-Remote-Scoreline-Penalty relativieren, wenn HQ-Agenda-Risiko höher ist.
- Bestehendes wehrhaftes Remote als Risikoreduktion berücksichtigen, ohne unsafe blind positiv zu machen.
- Gegenbeispiel absichern: frei stehlbares Remote bleibt negativ.

Checks:

- fokussierte Runtime-/Remote-Score-Tests
- `git diff --check`

Commit:

- `fix(ai): allow relative remote agenda evacuation`

### Paket 4: Draw-/Economy-Bremse und Root-Payload-Plan

Ziel: Passive Draw-/Economy und Non-Agenda-Root verdrängen Agenda-Scoreline nicht in HQ-Notlagen.

Arbeit:

- Draw-/Burst-Economy bei agenda-dichtem HQ nur positiv lassen, wenn sie konkrete Score-/Schutz-/Funding-Aktion freischaltet.
- Non-Agenda-Root in Scoring-Remote nur positiv, wenn die Karte unmittelbar Schutz, Advance, Funding oder Scoreline-Payoff bringt.
- Regression für `Night Shift`-/`Annual Reviews`-ähnliche Situationen und `Chicago Branch`-vor-Agenda-Muster ergänzen.

Checks:

- fokussierte Vitests
- `git diff --check`

Commit:

- `fix(ai): gate passive corp setup during hq risk`

### Paket 5: Review, Checks und lokale Integration

Ziel: Verifikation, Review, lokale Integration und Worktree-Abschluss.

Arbeit:

- Relevante fokussierte Tests ausführen.
- `corepack pnpm --filter @netgrid/ai typecheck` ausführen.
- Final-Review schreiben.
- Arbeitsbranch lokal nach `main` mergen, sofern keine Kollisionen mit offenen Hauptworkspace-Änderungen bestehen.
- Worktree nach erfolgreichem Merge entfernen.

Checks:

- fokussierte Vitests
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit:

- `docs(ai): review corp hq scoreline risk triage`

## Verifikationsregeln

- Tests müssen Action-Familien vergleichen: Agenda-Install/Remote-Evakuierung, HQ-Schutz, Economy/Draw und Root-Install.
- Ein HQ-Risk-Test braucht sichtbare Runner-Coverage, darf aber keine verdeckte Runner-Hand/Stack-Info verwenden.
- Ein Remote-Evakuierungs-Test braucht Gegenbeispiel für frei stehlbare Agenda.
- Ein Economy/Draw-Test braucht Gegenbeispiel, in dem Funding wirklich notwendig und daher passend ist.

## Worktree-, Git- und Integrationsregeln

- Arbeits-Worktree: `C:\Projekte\NETGRID_AI_HQ_SCORELINE_TRIAGE`
- Arbeitsbranch: `codex/ai-hq-scoreline-triage`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Hauptworkspace nur für finalen Merge nach `main` nutzen.
- Jeder Paketabschluss erhält einen Commit.
- Kein Push und kein PR ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

`/Goal Arbeite die freigegebenen NETGRID-Corp-KI-Fixpunkte aus match_cc21ade0f73dd743 sequenziell im Worktree C:\Projekte\NETGRID_AI_HQ_SCORELINE_TRIAGE auf Branch codex/ai-hq-scoreline-triage ab. Lege Prozess- und Evidence-Artefakte an, verbessere HQ-Agenda-Risk-Triage, ermögliche relative Remote-Agenda-Evakuierung, bremse passive Draw-/Economy- und Non-Agenda-Root-Aktionen in HQ-Notlagen, ergänze Regressionstests, führe relevante Checks aus, committe jedes Paket und merge den Arbeitsbranch lokal nach main.`

## Abschlusskriterien

- Die vier freigegebenen Fehlergruppen sind umgesetzt oder als echter Blocker dokumentiert.
- Neue Regressionen decken die beobachteten Muster aus `match_cc21ade0f73dd743` ab.
- Relevante Tests und Typecheck sind gelaufen oder begründet blockiert.
- Review ist aktualisiert.
- Arbeitsbranch ist lokal nach `main` integriert oder ein Merge-Blocker ist dokumentiert.

## Abschlussnotiz

Umgesetzt in vier Paket-Commits plus Abschlussreview:

- HQ-Schutz-Triage zählt nicht mehr nur ICE-Layer, sondern erkennt sichtbar abgedeckte oder wirkungsarme Central-ICE als weiterhin gefährlich.
- HQ-Agenda-Flood kann eine relative Agenda-Evakuierung in ein vorhandenes Remote erzwingen, wenn das Remote nicht game-ending frei stehlbar ist, relevante ICE bezahlbar bleibt und keine konkrete Schutzaktion legal ist.
- `contestable_remote` und negativer Remote-Kontext werden nur für diese konkrete HQ-Entlastung abgefedert; bei legaler Remote-ICE-Schutzaktion gewinnt weiterhin Schutz.
- Draw-/Burst-Economy mit Karten ziehen erhält bei HQ-Flood eine explizite Bremse.
- Non-Agenda-Roots verlieren gegen eine legale Agenda-Installation in ein vorbereitetes Scoring-Remote.

Finale Checks siehe `docs/reviews/ai/corp-hq-scoreline-risk-triage-review-2026-07-04.md`.
