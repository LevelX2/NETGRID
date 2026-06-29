# AI B8AF Deckout Flood Prozess 2026-06-29

Status: in Arbeit

## Anlass

Das Replay `match_b8af9ab4ec83fb6c` zeigte nach den Corp-Scoreline-Fixes weiter ein spätes Corp-Fehlmuster: Die Corp hatte mehrere Agendas in HQ, nur noch wenige Karten in R&D und verlor schließlich durch `corp_deck_empty`. Statt den sicheren Deckout-Clock gegen eine konkrete Scoreline abzuwägen, wählte die KI weiter Credits, Draw-Operationen, Setup- oder Archivschutz-Aktionen.

Wichtig: Das Spiel endete um `2026-06-29T20:02:58.050Z`; der relevante Fix-Commit `93f1e9daa fix(ai): harden corp scoreline replay regressions` entstand erst danach. Alte Triage-Werte aus diesem Replay werden deshalb nicht erneut als offene Regression behandelt.

## Gesamtziel

Die Corp-KI soll bei niedrigem R&D-Restdeck und sichtbarem Agenda-Flood in HQ einen verbindlichen Notfall-Fokus setzen: freiwilliges Draw und passive Economy/Setup-Linien dürfen eine konkrete Scoreline nicht weiter verdrängen, wenn Warten selbst zum Deckout oder Agenda-Abwurf führt.

## Nicht-Ziele

- Keine Engine- oder Regeländerung.
- Keine Nutzung verdeckter Runner-Hand oder Runner-Stack-Daten.
- Keine pauschale Aufwertung unsicherer Remotes in normalen Spielphasen.
- Keine neue Karten-Sonderregel-Liste.
- Keine Änderung der bestehenden AI-Trace-Persistenz, solange der vorhandene `aiTraceMode`-Pfad arbeitet.

## Paketfolge

1. Replay-Evidence und Prozess festhalten.
2. Zentrale Corp-Board-Triage um eine Deckout-/Agenda-Flood-Lage erweitern.
3. Action-Alignment so anbinden, dass Scoreline-/Remote-Schutz-Linien passen und freiwilliges Draw, Archiv-ICE, off-target Setup und passive Economy bei hoher Gefahr verlieren.
4. Regressionstests für Low-R&D/HQ-Flood, Draw-Operationen, Desperation-Scoreline und Nicht-Regression normaler unsicherer Scorelines ergänzen.
5. Fokussierte Tests, Typecheck, finaler Review, lokale Commits und Merge nach `main`.

## Verifikation

- Fokussierte Vitest-Tests für `semantic-runtime-corp-score`.
- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Worktree

- Branch: `codex/ai-b8af-deckout-fixes`
- Worktree: `C:\Projekte\NETGRID_AI_B8AF_DECKOUT_FIXES`
- Integration: nach Abschluss lokal nach `main`, kein Push.
