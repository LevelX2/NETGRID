# AI Replay Match 731b Process

Status: Paketfolge abgeschlossen; lokaler Main-Merge offen

Quelle/Vorgabe: Freigegebene Analyse des zuletzt abgeschlossenen Spiels `match_731b436e85fb2484` aus `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`.

## Zielprüfung

Die Vorgabe ist ausreichend präzise für automatische Abarbeitung:

- Gesamtziel: generische Corp-AI-Verbesserungen aus dem Replay ableiten, implementieren, testen und lokal nach `main` integrieren.
- In Scope: Scoreline-Druck, Score-Remote-Disziplin, R&D-Matchpoint-Druck, ICE-/Rez-Bewertung, Analyse-Trace-Guard, Evidence-/Final-Reports und Wissenspflege.
- Nicht-Ziele: Engine-Regeln ändern, LegalActions umgehen, kartennamenspezifische Sonderregeln einbauen, Runtime-SQLite-Dateien versionieren, Remote-Push oder PR.
- Sicherheitsgrenzen: AI nutzt nur PlayerView, side-safe PublicEvents, LegalActions und erlaubte Metadaten; keine Hidden-Info-Nutzung.

## Gesamtziel

/Goal Arbeite die freigegebenen KI-Verbesserungen aus `match_731b436e85fb2484` vollständig und sequenziell ab und merge den abgeschlossenen Arbeitsbranch lokal nach `main`.

Arbeite ausschließlich im Worktree `C:\Projekte\NETGRID_AI_MATCH_731B` auf Branch `codex/ai-replay-match-731b`. Nutze den Hauptworkspace nur für Preflight und finalen lokalen Merge. Arbeite immer nur am aktuellen Paket, führe Paketchecks aus, committe jedes abgeschlossene Paket und stoppe bei Sicherheitsblockern ohne Workaround.

## Annahmen

- Das analysierte Match ist das neueste abgeschlossene Spiel und bleibt die maßgebliche Evidence.
- Fehlende `ai_decision_traces` werden im Report als Evidence-Limit dokumentiert; Post-hoc-Diagnostik mit aktueller AI zählt nicht als historischer Trace.
- Verbesserungen müssen generisch bleiben und dürfen keine verdeckten Karteninformationen voraussetzen.

## Controller-Invarianten

- LegalActions-only bleibt unverändert.
- `applyAction` bleibt die Regel- und Timing-Guardrail.
- Debug-Evidence darf nur side-safe Fakten enthalten.
- Zusätzliche Score-Komponenten müssen mit fokussierten Regressionstests belegbar sein.
- Kein Paketabschluss mit rotem fokussiertem Test oder `git diff --check`-Fehler.

## Sicherheitsblocker

- Lösung benötigt FullState oder Hidden-Info.
- Fehlende LegalAction kann nicht im Scope sauber erzeugt werden.
- Engine-, Replay-, StateHash- oder Side-Safety-Regression.
- Lokaler Merge nach `main` ist fachlich konfliktbehaftet.

## State Machine

1. `P1_PROCESS`: Prozessartefakt anlegen und committen.
2. `P2_EVIDENCE`: Replay-Evidence und Fehlergruppen dokumentieren.
3. `P3_SCORELINE`: Scoreline-/Score-Remote-Druck implementieren und testen.
4. `P4_RND_ICE`: R&D-Matchpoint, ICE-Placement und Rez-Reserve implementieren und testen.
5. `P5_TRACE_FINAL`: Trace-Guard, Final-Report, Wissenspflege, finale Checks und Merge.

## Paketfolge

### P1 Prozessartefakt

Ziel: verbindliche Paket- und Worktree-Regeln dokumentieren.

Kernartefakt: `docs/architecture/ai/ai-replay-match-731b-process-2026-07-05.md`

Checks: `git diff --check`

Commit: `docs(ai): add match 731b replay process`

### P2 Evidence-Report

Ziel: Match-Metadaten, relevante Decision-Fenster, Evidence-Limits und freigegebene Fehlergruppen dokumentieren.

Kernartefakt: `docs/reviews/ai/ai-replay-match-731b-evidence-2026-07-05.md`

Checks: `git diff --check`

Commit: `docs(ai): document match 731b replay evidence`

### P3 Scoreline-/Score-Remote-Druck

Ziel: Corp-AI installiert/entwickelt gewinnrelevante Agenden in vorbereitete Remotes, wenn Scoreline-Druck und zentrale Agenda-Exposition sichtbar sind, statt endlos ICE/Funding zu bevorzugen.

Kernartefakte: `packages/ai/src/runtime/semantic-runtime-corp-board-triage.ts`, `packages/ai/src/runtime/semantic-runtime-corp-score.ts`, passende Tests.

Checks: fokussierte Vitest-Regressionen, angrenzende Corp-Scoreline-Tests, `git diff --check`.

Commit: `fix(ai): strengthen corp scoreline remote pressure`

### P4 R&D-Matchpoint und ICE-/Rez-Bewertung

Ziel: R&D-Multiaccess-Matchpoint und sichtbare Zero-Effect-/Rez-Reserve-Risiken stärker in ICE-Placement und Rez-Entscheidungen einbinden.

Kernartefakte: `packages/ai/src/runtime/semantic-runtime-corp-score.ts`, `packages/ai/src/runtime/corp-ice-placement/corp-ice-placement.ts`, passende Tests.

Checks: fokussierte Vitest-Regressionen, angrenzende ICE-/Rez-Tests, `corepack pnpm --filter @netgrid/ai typecheck`, `git diff --check`.

Commit: `fix(ai): account for rd matchpoint ice pressure`

### P5 Trace-Guard, Finalisierung und Integration

Ziel: Analyse-Trace-Limit dokumentieren/absichern, Final-Report und Wissenslog schreiben, finale Checks ausführen und Branch lokal nach `main` mergen.

Kernartefakte: Final-Report unter `docs/reviews/ai/`, aktueller Monatslog in `KI-Wissen-NETGRID/03 Betrieb/`, optional Analyse-Guard im vorhandenen Tooling.

Checks: fokussierte Tests, `corepack pnpm --filter @netgrid/ai typecheck`, `git diff --check`, nach Merge relevante Checks erneut.

Commit: `docs(ai): finalize match 731b replay fixes`

## Automatische Fehlerbehandlung

- Rote Tests werden im aktuellen Paket eng debuggt.
- Neue Erkenntnisse werden als Paketnotiz oder Follow-up dokumentiert, nicht still in Scope erweitert.
- Nicht belegte Replay-Vermutungen bleiben aus Codeänderungen heraus.

## Abschlusskriterien

- Alle Pakete sind abgeschlossen und einzeln committed.
- Branch `codex/ai-replay-match-731b` ist lokal nach `main` gemerged.
- Worktree ist sauber und entfernt.
- Final-Report nennt Match, Fehlergruppen, Änderungen, Grenzen, Checks und Merge-Status.
