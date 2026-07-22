# Corp-Rez-Payoff-Remediation 2026-07-22

## Status

In Umsetzung auf `codex/ai-rez-payoff` im Worktree
`C:\Projekte\NETGRID_AI_REZ_PAYOFF`.

## Gesamtziel

Die Corp-KI bewertet garantierte, sichtbare Credit-Gewinne beim Rezzen eines
ICE als eigenen Nutzen. Ein durch einen sichtbaren Breaker neutralisierter
Stop-Effekt darf diesen Rez-Payoff nicht als Nullwirkung behandeln.

## Quelle und Evidence

- Match: `match_27195c96204c4515`, StateVersion 62, Corp-Decision 25.
- Die Corp hat 2 Credits, R&D-Druck ist sichtbar hoch, und
  `Misleading Access Menus` ist legal rezzbar.
- Die Runtime wählt `decline_rez`, weil sie bei sichtbarem `Codecracker`
  `effective_defense_zero_effect:true` setzt.
- Der Kartentext enthält zusätzlich den garantierten Rez-Effekt
  „Gain [3] when you rez Misleading Access Menus.“

## Nicht-Ziele

- Keine Kartennamen-Sonderregel.
- Kein Zugriff auf verdeckte Runner-Informationen.
- Keine pauschale Änderung der Credit-gegen-Draw-Gewichtung ohne eigene
  historische Evidence.

## Pakete

### P1 – Historischer Checkpoint und Evidence

Capture des historischen Rez-Fensters mit Erwartung `rez_ice`; rote
Reproduktion auf aktuellem Code und grüne Gegenprobe ohne Rez-Payoff.

### P2 – Generische Rez-Payoff-Semantik

Strukturierten oder sichtbar ableitbaren Rez-Credit-Payoff in die effektive
Corp-Verteidigungsbewertung aufnehmen, Checkpoint und Gegenprobe grün machen,
angrenzende Tests und AI-Gates ausführen.

### P3 – Abschluss

Review, Evidence-/Final-Report, Main-Integration, Worktree- und
Branch-Cleanup.

## Verifikation

- Historischer Checkpoint vor Fix als `behavior_regression` rot.
- Unveränderte Erwartung nach Fix grün.
- Gegenprobe ohne Rez-Payoff grün.
- Relevante Corp-Defense-Tests, AI-Typecheck und `git diff --check`.
