# AI-Replay F4C099 Verbesserungsprozess 2026-07-09

## Status

In Umsetzung auf Branch `codex/ai-replay-f4c099` im Worktree `C:\Projekte\NETGRID_AI_REPLAY_F4C099`.

## Quelle und Vorgabe

Freigegebene Analyse des abgeschlossenen Matches `match_f4c099f8b5edb26d` aus der lokalen read-only SQLite-Runtime. Die Runner-KI spielte auf Schwierigkeit `hard`; die Korp gewann 7:2. Führende Evidence sind 198 öffentliche beziehungsweise side-gefilterte Events, 198 Snapshots und 119 detaillierte AI-Decision-Traces.

## Gesamtziel

Die drei freigegebenen Fehlergruppen werden generisch und side-safe behoben:

1. Ein Remote-Contest-Plan darf mit `gain_credits_first` nicht den letzten verbleibenden Run-Klick verbrauchen, wenn eine akute avancierte Scorebedrohung bereits erreichbar ist.
2. Die Vorabquote eines bekannten Mehrfach-ICE-Pfads muss Breaker-Nebeneffekte wie `postBreakStealthLoss` über den restlichen Pfad fortschreiben; ein danach nicht mehr bezahlbarer Pfad darf nicht als `run_now` gelten. Identische No-Access-Runs müssen der bestehenden Wiederholungslogik als fehlender Fortschritt sichtbar sein.
3. Eigene Karten dürfen durch eigene Reveal-, Search- oder Install-Ereignisse nicht als `revealed_opponent_card` in Belief-/Debug-Facts eingeordnet werden.

## Annahmen

- Der bestehende Fix `16febfa69` für bereits passierte ICE bleibt unverändert. Er deckt einen anderen aktiven HQ-Run-Fall im selben Match ab.
- `Pile Driver` entfernt nach seinem Break drei Credits von Stealth-Karten, bevor ein späterer non-noisy Breaker diese Credits verwenden könnte.
- Die Umsetzung bleibt AI-intern und nutzt ausschließlich PlayerView, side-gefilterte Events, LegalActions und explizit öffentliche Karten-/Action-Metadaten.
- Die fremden ungetrackten Analyseberichte im Hauptworkspace werden nicht verändert oder übernommen.

## Nicht-Ziele

- Keine Änderung an Engine-Regeln, LegalAction-Erzeugung, `applyAction`, Replay, StateHash oder Randomness.
- Keine kartennamensbasierte Sonderregel für `Pile Driver`, `Cloak`, `Codecracker`, `Fire Wall` oder `Keeper`.
- Keine Nutzung verdeckter Korp-Karten oder späterer Matchinformationen als damalige Entscheidungsgrundlage.
- Kein Push und kein Pull Request.

## Controller-Invarianten

- Engine-Korrektheit zuerst; die Engine bleibt einzige Regelautorität.
- Die KI wählt ausschließlich aus `LegalActions`.
- Jede neue Pfad- oder Memory-Evidence bleibt side-safe und redigiert.
- Genau ein Paket ist aktiv; kein Paket wird übersprungen.
- Jedes Paket erhält fokussierte Checks, `git diff --check` und einen eigenen Commit.

## Automatische Fehlerbehandlung

- Rote Tests werden eng am aktiven Paket analysiert und behoben.
- Keine Testlöschung, kein `test.skip`, kein `test.only` und keine pauschale Assertion-Lockerung.
- Eine erforderliche Engine-/PlayerView-/LegalAction-Erweiterung wird als Blocker dokumentiert und nicht im AI-Code umgangen.
- Hidden-Info-, LegalAction-, Replay- oder Engine-Korrektheitsregressionen stoppen den Prozess.

## State Machine

`preflight -> evidence_regressions -> ai_behavior -> belief_facts -> final_review -> integration_preflight -> merged`

## Paketfolge

### Paket 1: Preflight und Prozessartefakt

- Ziel: Worktree, Branch, Scope, Sicherheitsgrenzen und Paketfolge festhalten.
- Kernartefakt: dieses Dokument.
- Checks: `git status --short --branch`, `git diff --check`.
- Done-Gate: sauberer eigener Commit auf dem Arbeitsbranch.
- Commit: `docs(ai): plan replay f4c099 improvements`.

### Paket 2: Match-Evidence und Regressionen

- Ziel: Die drei Fehlergruppen als side-safe Evidence und zunächst rote beziehungsweise lückenbelegende fokussierte Regressionen festhalten.
- Kernartefakte: Evidence-Report unter `docs/reviews/ai/`; fokussierte AI-Tests für Remote-Klickdeadline, Mehrfach-ICE-Stealth-Verlust, No-Access-Wiederholung und eigene Reveal-Facts.
- Checks: betroffene einzelne Vitest-Dateien; `git diff --check`.
- Done-Gate: Regressionen reproduzieren die freigegebenen Fehler ohne Hidden-Info-Nutzung.
- Commit: `test(ai): reproduce replay f4c099 failures`.

### Paket 3: Generische KI-Verhaltensanpassungen

- Ziel: deadlinebewussten Remote-Contest, konsistente Mehrfach-ICE-Pfadquote und No-Access-Wiederholungsübergabe umsetzen.
- Kernartefakte: Runner-TacticalPlan-, VisibleRunAnalysis-, Run-History- und Semantic-Runtime-Komponenten sowie angrenzende Tests.
- Checks: fokussierte Runner-Plan-/Pfad-/Ranking-Tests; angrenzende Regressionen; `git diff --check`.
- Done-Gate: Remote-Contest läuft im letzten sicheren Fenster, die Stealth-Verlustfolge macht den Pfad bei 4 bis 6 Cash unbezahlt, und ein identischer No-Access-Run wird nicht sofort wiederholt.
- Commit: `fix(ai): harden replay run planning`.

### Paket 4: Side-korrekte Belief-/Debug-Facts

- Ziel: eigene Reveal-/Search-/Installkarten nicht mehr als Gegnerkarten klassifizieren.
- Kernartefakte: Belief-State-Klassifikation und fokussierte Debug-/Belief-Regressionen.
- Checks: fokussierte Belief-/Debug-Tests; `git diff --check`.
- Done-Gate: eigene Karten erzeugen keine `revealed_opponent_card`-Facts; echte bekannte Gegnerkarten bleiben erhalten.
- Commit: `fix(ai): keep revealed opponent facts side correct`.

### Paket 5: Review, breite Verifikation und Integration

- Ziel: Final-Report, Wissenspflege, breite AI-Prüfung und lokale Integration nach `main`.
- Kernartefakte: Final-Report unter `docs/reviews/ai/`, aktueller Monatslog bei dauerhaftem Vertrag.
- Checks: fokussierte Tests, `corepack pnpm --filter @netgrid/ai typecheck`, möglichst vollständiger `@netgrid/ai`-Testlauf, `git diff --check`; nach Merge dieselben relevanten Checks auf `main`.
- Done-Gate: Arbeitsbranch sauber, aktuellem `main` angeglichen, lokal gemerged und Hauptworkspace verifiziert.
- Commit: `docs(ai): close replay f4c099 improvements`.

## /Goal

/Goal Arbeite `AI-Replay F4C099 Verbesserungen` vollständig und sequenziell von Paket 1 bis Paket 5 ab und merge den abgeschlossenen Arbeitsbranch lokal nach `main`.

Lies zuerst `AGENTS.md`, `AGENTS.local.md`, die NETGRID-Wissensbasis, `packages/ai/AGENTS.md`, den Skill `netgrid-ai-spielanalyse-worktree` und dieses Prozessartefakt. Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_AI_REPLAY_F4C099` auf Branch `codex/ai-replay-f4c099`. Nutze den Hauptworkspace nur für den finalen lokalen Merge. Arbeite immer nur am aktuellen Paket, führe dessen Checks aus und committe es vor dem nächsten Paket. Bei einem Sicherheitsblocker stoppe ohne Workaround und dokumentiere die Removal Condition. Nach Paket 5 integriere aktuelles `main`, verifiziere erneut, merge lokal nach `main`, prüfe `main` und entferne den sauberen Worktree. Markiere das Goal erst danach als abgeschlossen.

## Abschlusskriterien

- Alle drei freigegebenen Fehlergruppen sind mit Regressionen behoben.
- Keine Engine-, LegalAction-, Hidden-Info-, Replay- oder StateHash-Grenze wurde erweitert.
- Evidence- und Final-Report nennen Match, Entscheidungen, Änderungen, Grenzen und Checks.
- Alle Paketcommits liegen auf dem Arbeitsbranch.
- Der Arbeitsbranch ist lokal nach `main` integriert; kein Push und kein PR wurden ausgeführt.
