# AI Replay Latest Corp Play Process 2026-06-24

Status: ready_for_local_main_merge

## Quelle/Vorgabe

Nutzerauftrag: Das letzte abgeschlossene NETGRID-Spiel mit `$netgrid-ai-spielanalyse-worktree` analysieren, KI-Spielfehler Schritt für Schritt suchen, die gefundenen Probleme in einem eigenen Worktree beheben und den fertigen Arbeitsbranch lokal nach `main` mergen.

Ausgewähltes Spiel:

- Match-ID: `match_7eb5afffa3245650`
- Quelle: lokale Runtime-SQLite-Datenbank `data/runtime/multiplayer/netgrid.sqlite` im Hauptworkspace
- Modus: `human_runner_vs_corp_ai`
- Status: `finished`
- Erstellt: `2026-06-24T20:04:03.851Z`
- Aktualisiert: `2026-06-24T20:18:37.157Z`
- StateVersion: `96`
- Events: `97`
- AI-Decision-Traces: `41`

Die danach aktualisierte Partie `match_ab44ac886c5dbf49` ist noch `active` und wird deshalb nicht als abgeschlossenes Spiel verwendet.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung:

- Gesamtziel: konkrete Replay-Analyse mit anschließenden generischen KI-Verbesserungen.
- In Scope: side-safe Replay-/Trace-Auswertung, Fehlergruppen, Hint-/Semantikprüfung, AI-Code- oder Datenkorrekturen, Tests, Dokumentation und lokaler Merge.
- Nicht-Ziele: keine Hidden-Info-Auswertung als Entscheidungsgrundlage, keine Engine-Umgehung, kein Push/PR, keine Bearbeitung aktiver Matches.
- Branch/Worktree: `codex/ai-replay-latest-corp-play` in `C:\Projekte\NETGRID_AI_LATEST_CORP_REPLAY`.
- Sicherheitsblocker: fehlende LegalActions, notwendige Hidden-Info, Engine-/PlayerView-Lücke außerhalb des Paketumfangs, nicht mergebarer `main`.

## Gesamtziel

`/Goal` Arbeite die Analyse und Verbesserung für `match_7eb5afffa3245650` vollständig und sequenziell von Paket `RCP-1` bis `RCP-5` ab und merge den abgeschlossenen Arbeitsbranch lokal nach `main`.

Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_AI_LATEST_CORP_REPLAY` auf Branch `codex/ai-replay-latest-corp-play`. Nutze den Hauptworkspace nur für read-only Runtime-Evidence und den finalen lokalen Merge. Stelle keine Zwischenfragen, solange konservative automatische Fortsetzung möglich ist. Committe jedes abgeschlossene Paket separat. Bei Sicherheitsblocker: stoppe ohne Workaround, schreibe Blocker-Report mit Removal Condition.

## Annahmen

- `finished` ist der führende terminale Status für abgeschlossene moderne Matches; `forfeited` ist nachrangig, wenn neuere `finished`-Matches existieren.
- Runtime-Daten bleiben lokal und unversioniert; versioniert werden nur redigierte Reports, Prozessartefakte, Tests und Code-/Datenänderungen.
- Der Hauptworkspace enthält vor Prozessstart fremde uncommitted Engine-/Run-Änderungen. Diese werden nicht verändert. Der finale Merge ist nur zulässig, wenn keine Überschneidung mit den Prozessdateien entsteht.

## Nicht-Ziele

- Kein FullState- oder Hidden-Info-Zugriff als damalige KI-Entscheidungsgrundlage.
- Keine Kartennamen-Sonderregel, wenn eine generische Semantik- oder Bewertungsanpassung möglich ist.
- Keine Änderung an Rules Engine, `applyAction`, Replay-StateHash oder PlayerView-Verträgen ohne expliziten, belegten Engine-Bedarf.
- Kein Push und keine PR-Erstellung.

## Controller-Invarianten

- Die KI darf nur `PlayerView`, side-filtered PublicEvents, LegalActions, eigene erlaubte Metadaten und vorhandene side-safe AI-Traces nutzen.
- Jede umgesetzte Verhaltensänderung bleibt LegalActions-only und side-safe.
- Regressionsschutz muss sowohl positive Fehlerfälle als auch negative Gegenproben enthalten, wenn neue Prioritäten entstehen.
- Reports müssen zwischen damaliger sichtbarer Entscheidungsgrundlage und späterer Analyse unterscheiden.

## Automatische Fehlerbehandlung

- Wenn ein Replay-Trace fehlt, wird aus Eventlog, Snapshots und LegalActions rekonstruiert und die Evidenzqualität markiert.
- Wenn eine bessere Aktion nicht als LegalAction vorhanden ist, wird ein Engine-/LegalAction-Follow-up dokumentiert statt AI-Code zu umgehen.
- Wenn Tests rot sind, wird innerhalb des aktiven Pakets debuggt; das nächste Paket startet erst nach erfülltem Done-Gate oder dokumentiertem Blocker.
- Wenn `main` beim finalen Merge weitergelaufen oder dirty ist, werden Überschneidungen geprüft; bei fachlichen Konflikten wird gestoppt.

## State Machine

1. `preflight`
2. `evidence_analysis`
3. `semantic_audit`
4. `implementation`
5. `verification_and_integration`
6. `done` oder `blocked`

## Paketfolge

### RCP-1: Preflight und Prozessartefakt

Ziel: Worktree, Branch, Spielauswahl, Sicherheitsgrenzen und Paketfolge festhalten.

Kernartefakte:

- `docs/architecture/ai/ai-replay-latest-corp-play-process-2026-06-24.md`

Checks:

- `git status --short --branch`
- `git diff --check`

Done-Gate: Prozessartefakt ist versioniert und der Worktree ist bereit für Evidence-Arbeit.

Commit: `docs(ai): define latest corp replay analysis process`

### RCP-2: Spiel-Evidence und Fehlergruppen

Ziel: `match_7eb5afffa3245650` aus Replay, Events, Snapshots und AI-Traces zugweise analysieren und Fehlergruppen dokumentieren.

Kernartefakte:

- `docs/reviews/ai/ai-replay-latest-corp-play-evidence-2026-06-24.md`

Checks:

- read-only SQLite-Queries gegen das lokale Match
- `git diff --check`

Done-Gate: Schlechte oder fragliche KI-Entscheidungen sind mit StateVersion, sichtbarer Alternative, Fehlergruppe und erwarteter künftiger Behandlung erfasst.

Commit: `docs(ai): analyze latest corp replay mistakes`

### RCP-3: Hint-/Semantik-Audit

Ziel: Ermitteln, ob die Fehler aus Hintdaten, Ontologie, Plananker, Semantic Runtime, Target Binding oder Bewertung stammen.

Kernartefakte:

- Updates am Evidence-Report oder ergänzender Audit-Abschnitt
- betroffene AI-Hint-/Semantikdaten nur bei nachweislicher Abweichung

Checks:

- relevante AI-Hint-/Semantik-Gates, falls Daten geändert werden
- `git diff --check`

Done-Gate: Jede Fehlergruppe hat eine Schichtzuordnung und ein umsetzbares Akzeptanzkriterium.

Commit: `docs(ai): map replay mistakes to ai layers`

### RCP-4: Generische KI-Anpassungen

Ziel: KI-Verhalten generisch verbessern, so dass die gefundenen Fehlersituationen künftig besser behandelt werden.

Kernartefakte:

- `packages/ai/src/**`
- bei Bedarf `data/ai/**` und generierte AI-Artefakte
- fokussierte Regressionstests

Checks:

- fokussierte Vitest-Regressionen
- `corepack pnpm --filter @netgrid/ai typecheck`
- relevante Gates bei Datenänderungen
- `git diff --check`

Done-Gate: Die neue Bewertung bevorzugt die belegte bessere Aktion im positiven Fall und greift in Gegenproben nicht blind.

Commit: `fix(ai): improve corp replay decision handling`

### RCP-5: Abschluss, Wissenspflege und lokale Integration

Ziel: Final-Report, Wissensrückführung, vollständige Checks, lokaler Merge nach `main` und Worktree-Cleanup.

Kernartefakte:

- `docs/reviews/ai/ai-replay-latest-corp-play-final-report-2026-06-24.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md`, falls ein dauerhafter Vertrag entsteht

Checks:

- relevante fokussierte Tests erneut
- wenn realistisch `corepack pnpm --filter @netgrid/ai test`
- `git diff --check`
- nach Merge relevante Checks im Hauptworkspace

Done-Gate: Arbeitsbranch ist sauber, lokal in `main` integriert, Hauptworkspace geprüft und der Worktree entfernt.

Commit: `docs(ai): close latest corp replay process`

## Worktree-, Git- und Integrationsregeln

- Arbeitsbranch: `codex/ai-replay-latest-corp-play`
- Worktree: `C:\Projekte\NETGRID_AI_LATEST_CORP_REPLAY`
- Hauptworkspace: `C:\Projekte\NETGRID`
- Kein Revert fremder Änderungen im Hauptworkspace.
- Commit pro Paket.
- Finaler Merge bevorzugt fast-forward nach `main`; Merge-Commit nur mit Begründung.
- Kein Push ohne ausdrücklichen Nutzerauftrag.

## Abschlusskriterien

- Matchanalyse und Fehlergruppen sind belegt.
- Umgesetzte KI-Anpassungen sind generisch, side-safe und LegalActions-only.
- Fokussierte Tests und relevante Checks sind dokumentiert.
- Der Arbeitsbranch ist lokal nach `main` gemerged oder ein Blocker-Report erklärt die Entfernungsvoraussetzung.
