# AB86 Corp-KI-Fixes Prozess

Status: in Arbeit

Quelle: Replay-Analyse zu `match_ab86e817041818b3` nach Nutzerfreigabe vom 2026-06-29.

## Gesamtziel

Die Corp-KI soll aus dem AB86-Spiel generische Verbesserungen erhalten: spielbare Scorefenster unter HQ-Agenda-Druck nutzen, passive Credit-/Draw-/Support-Root-Aktionen unter konkretem Scoreline-Druck unterdrücken und zentrale ICE-Installationen stärker nach echter Zugriffsstopp-Wirkung unterscheiden.

## Annahmen

- Die Engine bleibt Regelautorität; es werden keine neuen LegalActions erzeugt.
- Die KI nutzt nur side-safe sichtbare PlayerView-, LegalAction-, PublicEvent- und ActionSemanticCandidate-Daten.
- Das Spiel wurde mit einem älteren oder nicht neu gestarteten Runtime-Stand gespielt; das wird dokumentiert, aber nicht als Codefix behandelt.
- Karten wie Ball and Chain, Brain Wash und Dog Pile dienen nur als Regressionen für generische Schutzwirkungslogik.

## Nicht-Ziele

- Keine Änderung an Engine-Regeln, `applyAction`, Hidden-Info-Sichtbarkeit oder Replay-Format.
- Keine neue Karten-Sonderliste.
- Keine Deck- oder Kartenpool-Änderung in diesem Paket.
- Kein Remote-Push.

## Paketfolge

### Paket 1: Prozess und Evidence

Ziel: Match, Fehlergruppen und Umsetzungsgrenzen dokumentieren.

Kernartefakte:

- `docs/architecture/ai/ai-ab86-corp-fixes-process-2026-06-29.md`
- `docs/reviews/ai/ai-ab86-corp-replay-evidence-2026-06-29.md`

Checks:

- `git diff --check`

Commit:

- `docs(ai): record ab86 corp fix process`

### Paket 2: Runtime-Anpassung

Ziel: Bestehende Corp-Board-Triage und Score-Komponenten anpassen.

Konkrete Arbeit:

- `force_scoreline_clock` von reinem Deckout-Fall auf side-safe HQ-Agenda-Flood mit spielbarer bestehender Scoring-Remote erweitern.
- Non-scoreline-Root-/Support-Installationen und passive Economy/Draw unter dieser Lage als Mismatch behandeln.
- Zentral-ICE-Installationen mit fehlendem Access-Stop bei HQ/R&D-Agenda-Druck negativ markieren, ohne reine Tax-/Damage-ICE generell wertlos zu machen.
- Scoreline-Fenster mit affordable relevant ICE und fehlender sichtbarer installierter Runner-Coverage unter HQ-Druck nicht als unspielbares Geschenk behandeln.

Checks:

- fokussierte Runtime-Tests
- `git diff --check`

Commit:

- `fix(ai): tighten corp hq flood scoreline triage`

### Paket 3: Regressionen und Typecheck

Ziel: Tests für die AB86-Muster ergänzen und relevante Gates laufen lassen.

Checks:

- `corepack pnpm --filter @netgrid/ai test -- --run packages/ai/src/runtime/semantic-runtime-corp-score.test.ts packages/ai/src/runtime/semantic-runtime-corp-scoring-window.test.ts packages/ai/src/runtime/semantic-runtime-corp-remote-score.test.ts`
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit:

- `test(ai): cover ab86 corp scoreline regressions`

### Paket 4: Finalisierung und lokale Integration

Ziel: Final-Report und Wissenslog schreiben, Arbeitsbranch lokal nach `main` mergen.

Kernartefakte:

- `docs/reviews/ai/ai-ab86-corp-fixes-final-2026-06-29.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-06.md`

Checks:

- relevante fokussierte Tests
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

Commit:

- `docs(ai): close ab86 corp fixes`

### Paket 5: Post-Merge

Ziel: Hauptworkspace prüfen, Worktree sauber entfernen und Ergebnis melden.

Checks:

- `git status --short --branch`
- `git diff --check`
- bei Risiko fokussierte AI-Tests auf `main`

## Sicherheitsblocker

- Eine Änderung würde verdeckte Runner-Hand-/Stack-Daten voraussetzen.
- Eine bessere Entscheidung wäre nur durch nicht existierende LegalActions möglich.
- Tests zeigen Regressionen in Engine-Legalität, Side-Safety oder Replay-Verträgen.
- `main` ist nicht kollisionsfrei integrierbar.
