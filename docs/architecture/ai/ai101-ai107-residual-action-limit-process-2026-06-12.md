# AI101-AI107 Residual Action-Limit Prozess

Status: `in_progress`

Quelle/Vorgabe: GitHub-Ergebnisanalyse vom 2026-06-12 zu AI095-AI100 und die darin enthaltenen Folgepakete AI101 bis AI107.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für direkte automatische Abarbeitung. Die Nutzerformulierung verlangt ausdrücklich Umsetzung, daher entfällt die sonst vorgeschaltete Skill-Rückfrage.

Wichtige Korrektur zur Quelle: Die Ergebnisanalyse bezieht sich auf den remote sichtbaren Merge `a380fb774d90be0b07c07398b8e0d8b5b5b7c5ae`. Beim Prozessstart am 2026-06-12 steht lokaler und remote `main` bereits bei `f8ea7535`. AI101 muss deshalb den aktuellen Integrationsstand `f8ea7535` rebaselinen und zugleich die ältere Beobachtung dokumentieren, dass der AI100-Trace auf einem Branch-HEAD vor dem finalen Merge erzeugt wurde.

## Gesamtziel

AI101 bis AI107 sequenziell abarbeiten: finalen aktuellen `main`-HEAD mit A-D-x5 neu vermessen, lokale Worktree-Reste klassifizieren, nicht-triviale AI-/Engine-Guards knapp kommentieren, verbleibende Action-Limit-Restklassen analysieren, den Zielwert `actionLimitReached <= 8` fachlich entscheiden, den Gesamtstand vollständig verifizieren, jeden Schritt committen und den abgeschlossenen Arbeitsbranch lokal nach `main` integrieren.

## /Goal

`/Goal Arbeite AI101-AI107 vollständig und sequenziell im Worktree C:\Projekte\NETGRID_AI101_AI107_RESIDUAL_ACTION_LIMIT auf Branch codex/ai101-ai107-residual-action-limit ab. Lies AGENTS.md, AGENTS.local.md, agents/release-implementation-agent.md und dieses Prozessartefakt. Arbeite immer nur am aktuellen Paket. Erstelle oder aktualisiere Paketartefakte, führe die Paketchecks aus, committe jedes abgeschlossene Paket und wechsle erst danach zum nächsten Paket. Keine Zwischenfragen, solange die konservativen Fortsetzungsregeln greifen. Nach AI107: aktuelles main in den Arbeitsbranch integrieren, final verifizieren, lokal nach main mergen, main prüfen, Worktree entfernen und Goal erst dann als complete markieren. Kein Push ohne ausdrücklichen Nutzerauftrag.`

## Annahmen

- Lokaler Integrationsbranch ist `main`.
- Arbeitsbranch: `codex/ai101-ai107-residual-action-limit`.
- Arbeits-Worktree: `C:\Projekte\NETGRID_AI101_AI107_RESIDUAL_ACTION_LIMIT`.
- Hauptworkspace wird erst für den finalen Merge verwendet.
- Vorhandene uncommitted Änderungen im Hauptworkspace sind fremd und werden nicht verändert.
- Dateinamen verwenden das aktuelle Erstellungsdatum `2026-06-12`.

## Nicht-Ziele

- Keine neue LegalAction-Erzeugung.
- Keine `applyAction`-, Replay-, StateHash- oder Randomness-Änderung ohne echten Engine-Bug.
- Keine Hidden-Info-Ausweitung.
- Keine generische Action-Penalty nur zur Metrikverbesserung.
- Keine Testlöschung oder Gate-Abschwächung.
- Kein Push oder Pull Request.

## Controller-Invarianten

- Rules Engine bleibt einzige Regelautorität.
- UI, Server, menschliche Spieler und KI reichen nur aus `LegalActions` abgeleitete `PlayerActions` ein.
- `applyAction` validiert weiter Seite, `actionId`, `stateVersion`, Timing, Kosten, Ziele und Choices.
- Verdeckte Kartendaten dürfen nicht in PlayerViews, PublicEvents, KI-Inputs, WebSocket-Payloads, Reconnect-Payloads, Undo-Previews, öffentliche Replays, Logs oder Client-Fehler gelangen.
- Deterministisches Replay und StateHash bleiben Pflicht.
- Randomness läuft ausschließlich über Seed, RandomCounter und RandomDrawRecords.

## Automatische Fehlerbehandlung

- Rote Tests werden eng am auslösenden Paket analysiert und, wenn die Ursache klar ist, im Paket behoben.
- Unklare oder fachlich widersprüchliche Befunde werden als Blocker-Report dokumentiert.
- Runtime-Fixes werden nur übernommen, wenn sie reproduzierbar, eng begrenzt und safety-neutral sind.
- Wenn ein Versuch `unsafeScoreChosen > 3` oder `repeated_no_progress_run > 33` erzeugt, wird er nicht übernommen.

## Sicherheitsblocker

- Hidden-Info-/Redaction-Regressions.
- Illegal Actions oder Replay-Failures im finalen Trace.
- Konflikte, die Engine-Regelautorität oder LegalAction-Vertrag unterschiedlich definieren.
- Unklare Löschung oder Veränderung fremder uncommitted Änderungen.

## State Machine

1. `process_ready`: Prozessartefakt committed.
2. `ai101_rebaseline`: aktueller Merge-HEAD und Worktree-Rest dokumentiert.
3. `ai102_comments`: Guard-Kommentare ergänzt, keine Runtime-Änderung.
4. `ai103_reserve_credit`: Runner-Reserve-Credit-Fälle outcome-bewertet.
5. `ai104_continue`: Continue-without-progress-Fall isoliert.
6. `ai105_mixed`: Mixed-Endwindow-Klassifikation verfeinert oder stabil begründet.
7. `ai106_decision`: Zielwertentscheidung dokumentiert.
8. `ai107_sweep`: Full Sweep und finaler Trace grün.
9. `integrated`: lokal nach `main` gemergt und Worktree entfernt.

## Paketfolge

### AI101 Final-Merge Trace und Worktree-Hygiene

Ziel: Aktuellen `main`-HEAD rebaselinen und lokale Reständerungen klassifizieren.

Konkrete Arbeit:

- `git status -sb` im Hauptworkspace dokumentieren.
- Uncommitted Dateien pro Datei als fremd, Folgepaket, Revert-Kandidat oder bereits committed klassifizieren.
- A-D-x5-Trace auf aktuellem Branch-HEAD erzeugen.
- Keine Runtime-Änderung außer bei hartem Fehler.

Artefakte:

- `docs/reviews/ai/ai101-final-merge-trace-and-worktree-hygiene-2026-06-12.md`
- `docs/reviews/ai/ai101-final-merge-a-d-5seed-2026-06-12.json`

Checks:

- Trace safety-grün.
- `git diff --check`.

Done-Gate:

- Trace `gitHead` entspricht dem aktuellen Prozess-HEAD.
- Worktree-Rest ist dokumentiert.
- Safety bleibt grün.

Commit: `test(ai): rebaseline final merge head and classify worktree`

### AI102 Sourcecode Comment Pass für nicht-triviale Guards

Ziel: Wichtige AI-/Engine-Grenzen knapp kommentieren, ohne Runtime-Verhalten zu ändern.

Scope:

- `packages/engine/src/game/abilities/runner-special-trigger-execution.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/simulation/selfplay-trace-mining.ts`
- optional `packages/ai/src/simulation/benchmark-reports.ts`, falls dort relevante Guard-Logik liegt.

Kommentarregel:

- Kommentare erklären fachliche Invarianten und Grenzen.
- Keine Kommentare für offensichtliche Syntax oder einfache Kontrollflüsse.

Checks:

- `corepack pnpm --filter @netgrid/ai typecheck`
- `corepack pnpm --filter @netgrid/engine typecheck`
- relevante fokussierte Tests, falls Kommentarstellen von Tests begleitet werden.
- `git diff --check`.

Done-Gate:

- Nur Kommentare oder rein redaktionelle Testnamen-/Review-Textkorrekturen.
- Keine Runtime-Änderung.

Commit: `docs(code): annotate AI and Shell Traders safety guards`

### AI103 Runner-Reserve-Credit Outcome Review

Ziel: Die fünf `runner_late_gain_credit_real_reserve`-Fälle prüfen, ohne sie als Fehler vorauszusetzen.

Konkrete Arbeit:

- Für jeden Fall Pair, Seed, StateVersion und Endfenster dokumentieren.
- Prüfen, ob Credit innerhalb der nächsten Aktionen Progress, Reachability oder Survival ermöglicht.
- Outcome-Kategorien verwenden:
  - `reserve_credit_converted_to_progress`
  - `reserve_credit_needed_for_reachability`
  - `reserve_credit_no_conversion`
  - `reserve_credit_unknown_mixed_window`
- Runtime nur bei mehrfach reproduzierbarem `reserve_credit_no_conversion` mit sicherer Alternative.

Artefakt:

- `docs/reviews/ai/ai103-runner-reserve-credit-outcome-review-2026-06-12.md`

Checks:

- Relevante Trace-/Fixture-Auswertung.
- `git diff --check`.

Done-Gate:

- Kein generischer Credit-Malus.
- Mindestens zwei Fälle replay-/trace-nah belegt.
- Safety-Grenzen bleiben dokumentiert.

Commit: `docs(ai): audit runner reserve-credit outcomes`

### AI104 Continue-without-progress Replay Fixture

Ziel: Den einzelnen `continue_without_progress`-Fall aus AI100/AI101 isolieren.

Konkrete Arbeit:

- Reproduzierbares Fixture oder Replay-nahe Trace-Auswertung erstellen.
- Prüfen, ob `continue_run` notwendiger Microstep, echter Stall oder zu strenge Klassifikation war.
- Runtime-Fix nur bei echtem Stall mit sicherer Alternative.

Artefakt:

- `docs/reviews/ai/ai104-continue-without-progress-fixture-2026-06-12.md`

Checks:

- Fokussierte AI-Simulationstests, wenn Code/Fixture ergänzt wird.
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`.

Done-Gate:

- Genau ein Fall verstanden.
- Keine pauschale Run-Abwertung.
- `repeated_no_progress_run <= 33` bleibt Leitplanke.

Commit: `test(ai): isolate continue-without-progress action-limit case`

### AI105 Mixed Endwindow Classifier v2

Ziel: Zwei `mixed_unknown`-Action-Limit-Endfenster weiter auflösen.

Konkrete Arbeit:

- Letzte 50 Aktionen optional analysieren.
- Letzte echte Progress-Aktion markieren.
- Side-Dominanz bestimmen: Runner-driven, Corp-driven, Alternating, unresolved.
- Runtime-Änderung nur bei klarem isoliertem Subcluster.

Artefakte:

- `docs/reviews/ai/ai105-mixed-endwindow-classifier-v2-2026-06-12.md`
- falls Codeänderung: aktualisierte Trace-Matrix.

Checks:

- `corepack pnpm --filter @netgrid/ai exec vitest run src/simulation/benchmark-reports.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Done-Gate:

- `mixed_unknown` sinkt oder wird fachlich stabil erklärt.
- Keine Safety-Regression.

Commit: `fix(ai): refine mixed action-limit endwindow classification`

### AI106 Action-Limit Zielwert-Entscheidung

Ziel: Entscheiden, ob `actionLimitReached <= 8` sicher erreichbar ist oder der Zielwert für diesen Korpus angepasst werden muss.

Konkrete Arbeit:

- AI100/AI101 bis AI105 vergleichen.
- A-D-x5 ausführen, optional A-D-x10.
- Prüfen, ob verbleibende Action-Limits echte KI-Fehler, Fixture-Grenzfälle oder Deck-/Korpus-Effekte sind.
- Zielwert nur mit Begründung anpassen, nicht kosmetisch.

Artefakte:

- `docs/reviews/ai/ai106-action-limit-target-decision-2026-06-12.md`
- optional Trace-JSONs.

Checks:

- Trace safety-grün.
- `git diff --check`.

Done-Gate:

- Klare Entscheidung: enger Fix möglich oder Zielwert nicht ohne Nebenwirkungen erreichbar.

Commit: `docs(ai): decide action-limit target after residual analysis`

### AI107 Vollständiger Testlauf und Fehlerbeseitigung

Ziel: Abschluss des Folgeblocks mit vollständigem Sweep.

Pflichtchecks:

```powershell
corepack pnpm install --frozen-lockfile
corepack pnpm test
corepack pnpm -r --if-present run typecheck
corepack pnpm -r --if-present run test
corepack pnpm --filter @netgrid/ai test
corepack pnpm --filter @netgrid/engine test
corepack pnpm --filter @netgrid/server test
corepack pnpm --filter @netgrid/web test
git diff --check
```

Zusätzlich:

- Finaler A-D-x5-Trace.
- Rote Suiten werden behoben, sofern die Ursache klar und projektbezogen ist.

Artefakte:

- `docs/reviews/ai/ai107-final-full-sweep-review-2026-06-12.md`
- `docs/reviews/ai/ai107-final-a-d-5seed-2026-06-12.json`

Done-Gate:

- Root-Test grün.
- Workspace-Typecheck grün.
- AI/Engine/Server/Web grün.
- Safety-Trace grün.
- Restbefund `actionLimitReached` reduziert oder sauber begründet.

Commit: `test(ai): complete residual action-limit sweep`

## Worktree-, Git- und Integrationsregeln

- Jeder Paketabschluss wird einzeln committed.
- Vor jedem Commit: relevante Checks und `git diff --check`.
- Nur paketzugehörige Änderungen werden gestaged.
- Vor finalem Merge: aktuelles `main` in Arbeitsbranch integrieren, falls `main` weitergelaufen ist.
- Finaler Merge bevorzugt Fast-Forward; Merge-Commit nur bei notwendiger Begründung.
- Hauptworkspace-Fremdänderungen werden nicht verändert.
- Worktree wird erst nach erfolgreichem Merge entfernt.
- Push nur auf ausdrücklichen Nutzerauftrag.

## Abschlusskriterien

- Alle Pakete AI101 bis AI107 sind erledigt und committed.
- Finaler Review und finaler Trace liegen vor.
- Lokaler `main` enthält den Arbeitsbranch.
- Worktree ist entfernt.
- Offene lokale Fremdänderungen sind benannt, nicht verändert.
