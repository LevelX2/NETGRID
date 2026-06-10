# AI068-AI072 Selfplay Quality Prozess

Stand: 2026-06-10
Status: Prozessdefinition für sequenzielle Codex-Ausführung; Umsetzung im Arbeitsbranch `codex/ai068-ai072-selfplay-quality`
Primärer Agent: `release-implementation-agent`

## Quelle/Vorgabe

Ausgangspunkt ist die Nutzeranforderung vom 2026-06-10: Die KI-Spielstärke soll nicht durch eine komplett neue KI-Roadmap und nicht durch einen einzelnen Patch für `corp_never_scores_long_game` verbessert werden. Stattdessen wird der messbare Selfplay-Befund aus den Trace-Mining-Läufen A-D in kleine, prüfbare Pakete überführt.

Eingangsstand aus den aktuellen Review-Artefakten:

- 20 Spiele, 2678 Entscheidungen.
- `illegalActions`: 0.
- `replayFailures`: 0.
- `allRedactionSafe`: true.
- `criticalFindings`: 0.
- `highFindings`: 14, alle `corp_never_scores_long_game`.
- `actionLimitReached`: 13.
- Auffällige Diagnosecluster: `plan_step_action_mismatch`, `semantic_override_suspicious`, `recovery_low_value_loop`, `repeated_no_progress_run`, `bank_over_target_without_funding_need`.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für direkte Umsetzung:

- Erst Messbarkeit und Scoreline-Telemetrie herstellen.
- Dann Score-Closeout und passive Endgame-Aktionen für Corp verbessern.
- Danach Runner-Recovery-/No-Progress-Loops reduzieren.
- Danach minimale Action-Semantik-Brücke und Diagnosemarker gezielt erweitern.
- Zuletzt DeckDoctrine-v2 nur dort als Consumer anschließen, wo konkrete Scoreline-, Remote-Contest- und Access-Pressure-Entscheidungen profitieren.

Die Umsetzung bleibt innerhalb der KI-, Simulations-, Diagnose- und Review-Schicht. Engine, LegalAction-Erzeugung, `applyAction`, Replay-Autorität, StateHash und Hidden-Info-Grenzen werden nicht verändert.

## Gesamtziel

NETGRID erhält einen messbar stärkeren Legacy-KI-Pfad für die aktuellen Selfplay-Decks, ohne die Rules-Engine-Autorität oder Hidden-Info-Sicherheit zu schwächen. Die ersten Erfolgskriterien sind:

- `corp_never_scores_long_game` sinkt nach den ersten Scoreline-Paketen von 14 auf höchstens 7.
- `actionLimitReached` sinkt von 13 auf höchstens 8.
- `illegalActions`, `replayFailures` und `criticalFindings` bleiben bei 0.
- `allRedactionSafe` bleibt true.

## Annahmen

- Die A-D-Selfplay-Decks bleiben der primäre Messkorpus für diese Paketfolge.
- Scoreline-Informationen werden ausschließlich aus side-sicheren KI-Eingaben, LegalActions, öffentlichen Informationen und eigener Memory/Evidence abgeleitet.
- Wenn eine Scoreline-Situation nicht sicher bewertbar ist, wird sie als unbekannt oder diagnostisch unsicher behandelt, nicht geraten.
- `plan_step_action_mismatch` und `semantic_override_suspicious` sind zunächst Beobachtungsmetriken und keine primären Erfolgskriterien.
- Jede Verhaltensänderung darf nur bestehende `LegalActions` priorisieren oder abwerten, niemals neue Legalität erzeugen.

## Nicht-Ziele

- Keine Änderung an Engine, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Keine Erweiterung von Hidden-Info-Zugriffen.
- Kein Hardcoding einzelner Karten aus den 14 Findings.
- Keine Optimierung reiner Detector-Zahlen als Selbstzweck.
- Keine Bündelung aller Medium-/Low-Findings in ein großes Paket.
- Kein kompletter neuer AI-Player vor dem ersten Spielstärke-Fix.
- Keine Proteus-KI-Freigabe.
- Kein Push und keine PR in diesem Prozess.

## Controller-Invarianten

- Genau ein Paket ist aktiv.
- Kein Paket wird übersprungen.
- Der Arbeitsbranch bleibt `codex/ai068-ai072-selfplay-quality`.
- Der Arbeitsworktree bleibt `C:\Projekte\NETGRID_AI068_AI072_SELFPLAY_QUALITY`.
- Der Hauptworkspace `C:\Projekte\NETGRID` wird nur für den finalen lokalen Merge genutzt.
- Jede gewählte KI-Aktion muss aus `input.legalActions` stammen.
- Debug-, Report- und Trace-Ausgaben dürfen keine gegnerischen Hidden-Zonen oder verdeckte Kartendaten offenlegen.
- Metriken und Detektoren dürfen Verhalten nicht direkt ersetzen; sie belegen, ob ein Paket wirkt.

## Automatische Fehlerbehandlung

- Rote TypeScript- oder Vitest-Checks werden im aktuellen Paket eingegrenzt und repariert.
- Nicht sicher ableitbare Scoreline-Fälle bleiben `unknown` oder observation-only.
- Wenn eine Verhaltensänderung unerwartet Safety-Metriken verschlechtert, wird sie im selben Paket zurückgeführt oder enger gegatet.
- Wenn ein Selfplay-Lauf wegen lokaler Laufzeitgrenzen nicht vollständig möglich ist, werden fokussierte Tests und ein kleiner deterministischer Trace-Lauf dokumentiert; der volle Lauf bleibt als offener Reviewpunkt im Paketbericht.
- Mergekonflikte werden defensiv gelöst, ohne fremde fachliche Änderungen zu entfernen.

## Sicherheitsblocker

Der Prozess stoppt ohne Merge nach `main`, wenn einer dieser Punkte bestätigt ist:

- Eine KI wählt eine nicht legale oder nicht in `input.legalActions` enthaltene Action.
- Eine Änderung nutzt oder leakt verdeckte gegnerische Kartendaten.
- Öffentliche Payloads, PlayerViews, Reconnect-Daten, Undo-Previews, Replays, Logs oder Client-Fehler enthalten neue Hidden-Info-Leaks.
- Engine-Regelvalidierung, LegalAction-Erzeugung oder `applyAction` müsste geändert werden, um ein Paket zu erfüllen.
- Replay-Determinismus oder StateHash wird durch KI-Diagnostik beeinflusst.
- Fremde Worktree-Änderungen sind nicht klassifizierbar und blockieren sauberes Staging.

Ein Sicherheitsblocker erzeugt einen Blocker-Report unter `docs/reviews/ai/` mit Ursache, betroffenen Dateien, letztem grünen Stand und Removal Condition.

## State Machine

```text
preflight_process
-> ai068_1_benchmark_scoreline_telemetry
-> ai068_2_corp_score_closeout_priority
-> ai068_3_passive_endgame_action_downranking
-> ai069_runner_recovery_no_progress_loops
-> ai070_minimal_action_semantic_bridge
-> ai071_detector_refinement
-> ai072_deck_doctrine_consumers
-> final_verify
-> merge_main
-> complete
```

## Kernmetriken

Nach jedem Codepaket werden diese Metriken geprüft oder im Paketbericht als nicht neu erhoben begründet:

- `illegalActions`.
- `replayFailures`.
- `allRedactionSafe`.
- `criticalFindings`.
- `highFindings`.
- `corp_never_scores_long_game`.
- `actionLimitReached`.
- `averageGameLength`.
- `corpAgendaScores`.
- `runnerAgendaSteals`.
- `corpFlatlines`.
- `scoreWindowMissed`.
- `passiveActionWithScoreLineAvailable`.
- `recovery_low_value_loop`.
- `repeated_no_progress_run`.
- `bank_over_target_without_funding_need`.

Beobachtungsmetriken:

- `plan_step_action_mismatch`.
- `semantic_override_suspicious`.

## Paketfolge

### Prozesspaket: Prozessartefakt und Preflight

Ziel: Paketfolge, Worktree-Regeln, Gates und Sicherheitsgrenzen versionieren.

Done-Gate:

- Dieses Prozessartefakt existiert.
- Worktree und Branch sind sauber.
- `git diff --check` ist grün.

Commit-Vorschlag: `docs(ai): define AI068-AI072 selfplay quality process`

### AI068-1: Benchmark- und Scoreline-Telemetrie

Ziel: Selfplay-Trace-Mining zeigt die Kernmetriken und unterscheidet Score-Fenster sauber.

Done-Gate:

- Report und JSON enthalten die Kernmetriken `averageGameLength`, `corpAgendaScores`, `runnerAgendaSteals`, `corpFlatlines`, `scoreWindowMissed` und `passiveActionWithScoreLineAvailable`.
- `scoreWindowMissed` und `unsafeScoreChosen` sind getrennte Befunde.
- Bestehende Safety-Metriken bleiben erhalten.
- Fokussierte Tests für Report-/Aggregationserweiterung sind grün.

Commit-Vorschlag: `feat(ai): add scoreline selfplay telemetry`

### AI068-2: Corp Score-Closeout und Advance-/Score-Priorität

Ziel: Die Corp priorisiert sichere oder konservativ plausible Score-Lines gegenüber langen passiven Spielen.

Done-Gate:

- Score- und Advance-Score-Kandidaten werden stärker priorisiert, wenn LegalActions und side-sichere Boarddaten eine Scoreline nahelegen.
- `corp_never_scores_long_game` sinkt im A-D-Messlauf oder in einem kleineren dokumentierten Zwischenlauf sichtbar.
- Safety-Metriken bleiben grün.

Commit-Vorschlag: `feat(ai): prioritize corp score closeouts`

### AI068-3: Passive Endgame-Aktionen begrenzen

Ziel: Passive Corp-Aktionen werden in scorebaren Endgame-Lagen abgewertet.

Done-Gate:

- `passiveActionWithScoreLineAvailable` wird gezählt.
- Passive Aktionen wie rein defensive Economy-/Install-Muster verlieren nur dann Priorität, wenn eine Scoreline rechtlich verfügbar und konservativ bewertbar ist.
- Kein aggressives Scoring in unsicheren Fällen.

Commit-Vorschlag: `feat(ai): downrank passive corp endgame actions`

### AI069: Runner Recovery-/No-Progress-Loops reduzieren

Ziel: Runner-Loops mit niedriger Wertentwicklung und wiederholten No-Progress-Runs werden reduziert.

Done-Gate:

- `recovery_low_value_loop` und `repeated_no_progress_run` sinken in fokussierten Scenarios oder Selfplay-Zwischenlauf.
- Recovery bleibt erlaubt, wenn Ressourcenlage oder Handentwicklung sie tatsächlich verlangt.
- Safety-Metriken bleiben grün.

Commit-Vorschlag: `feat(ai): reduce runner recovery no-progress loops`

### AI070: Minimale Action-Semantik-Brücke

Ziel: BasicActions sowie Score, Run, Rez und Advance erhalten eine minimale side-sichere Semantik, die Ranking und Diagnostik nutzen können.

Done-Gate:

- Bestehende `ActionSemanticCandidate`-Struktur deckt die genannten Action-Familien ab oder wird minimal erweitert.
- Ranking- und Diagnosecode nutzt die Brücke ohne Legalität zu erzeugen.
- Observation-only-Metriken bleiben interpretierbar.

Commit-Vorschlag: `feat(ai): extend minimal action semantic bridge`

### AI071: Diagnosemarker schärfen

Ziel: `plan_step_action_mismatch` und `semantic_override_suspicious` werden trennschärfer, damit echte Fehlentscheidungen von legitimen Overrides unterscheidbar sind.

Done-Gate:

- Beide Marker erhalten klarere Gründe oder Subkategorien.
- Die Marker zählen nicht mehr einfache Fälle, in denen Legalität, Safety oder Ressourcenknappheit eine Planabweichung legitim erklärt.
- Primäre Erfolgskriterien bleiben Scoreline- und Loop-Metriken.

Commit-Vorschlag: `fix(ai): refine selfplay diagnostic markers`

### AI072: DeckDoctrine-v2-Consumer gezielt anschließen

Ziel: DeckDoctrine-v2 beeinflusst nur konkrete, messbare Consumer für Scoreline, Remote Contest und Runner Access Pressure.

Done-Gate:

- Doctrine-Daten werden side-sicher und default-konservativ gelesen.
- Es gibt keinen globalen Planner-Umbau.
- Scoreline-, Remote-Contest- oder Access-Pressure-Entscheidungen erhalten nachvollziehbare Evidence.

Commit-Vorschlag: `feat(ai): apply doctrine consumers to selfplay decisions`

## Verifikationsregeln

Je Dokumentationspaket:

- `git diff --check`.
- `git status --short`.

Je Codepaket:

- `corepack pnpm --filter @netgrid/ai typecheck`.
- Fokussierte Vitest-Dateien für geänderte KI-, Simulations- oder Reportmodule.
- `git diff --check`.
- Kleiner deterministischer Trace-Mining-Lauf oder begründete Auslassung, falls lokale Laufzeitgrenzen dagegen sprechen.

Final:

- `corepack pnpm --filter @netgrid/ai typecheck`.
- Relevante fokussierte Vitest-Dateien.
- A-D-Trace-Mining-Lauf, soweit lokal zeitlich vertretbar.
- `git diff --check`.
- `git status --short`.

## Worktree-, Git- und Integrationsregeln

- Worktree: `C:\Projekte\NETGRID_AI068_AI072_SELFPLAY_QUALITY`.
- Branch: `codex/ai068-ai072-selfplay-quality`.
- Integrationsbranch: `main`.
- Paketänderungen werden nur paketbezogen gestaged.
- Jedes abgeschlossene Paket erhält einen Commit.
- Vor dem finalen Merge wird der aktuelle lokale `main` in den Arbeitsbranch integriert, falls `main` weitergelaufen ist.
- Nach erfolgreicher finaler Verifikation wird der Arbeitsbranch lokal nach `main` gemerged.
- Danach wird der Arbeitsworktree entfernt.
- Push und Pull Request erfolgen nicht ohne ausdrücklichen Nutzerwunsch.

## Controller-Prompt-Kern

```text
/Goal Arbeite den NETGRID-KI-Spielstärke-Paketprozess vollständig und sequenziell ab: AI068-1 bis AI072, jeweils mit Checks und Commit, anschließend lokal nach main integrieren.

Lies zuerst AGENTS.md, AGENTS.local.md, die NETGRID-Wissensbasis, agents/release-implementation-agent.md und dieses Prozessartefakt.
Arbeite ausschließlich im Worktree C:\Projekte\NETGRID_AI068_AI072_SELFPLAY_QUALITY auf Branch codex/ai068-ai072-selfplay-quality.
Nutze den Hauptworkspace C:\Projekte\NETGRID nur für den finalen Merge.
Stelle keine Zwischenfragen, solange der Prozess konservative automatische Fortsetzung erlaubt.
Arbeite immer nur am aktuellen Paket.
Schreibe oder aktualisiere Paketartefakte.
Führe Paketchecks aus.
Committe jedes abgeschlossene Paket.
Bei Sicherheitsblocker: stoppe ohne Rückfrage, schreibe Blocker-Report mit Removal Condition.
Nach Abschluss: final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen, Goal erst dann als complete markieren.
```

## Abschlusskriterien

- Der Prozess ist versioniert.
- Paketcommits für AI068-1 bis AI072 liegen auf `codex/ai068-ai072-selfplay-quality`.
- Kernmetriken sind in Selfplay-Reports sichtbar oder pro Paket begründet.
- Scoreline- und Loop-Pakete zeigen messbare Verbesserung oder erzeugen klare Follow-up-Evidence.
- `illegalActions`, `replayFailures` und `criticalFindings` bleiben 0.
- `allRedactionSafe` bleibt true.
- Finale Checks sind grün oder eng begründet.
- Der Branch ist lokal nach `main` gemerged und der Arbeitsworktree entfernt.
