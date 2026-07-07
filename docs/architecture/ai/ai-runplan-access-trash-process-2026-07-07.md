# AI RunPlan Access Trash Process 2026-07-07

## Kontext

- Arbeitsbranch: `codex/ai-runplan-access-trash`
- Worktree: `C:\Projekte\NETGRID_AI_RUNPLAN_ACCESS_TRASH`
- Ausloeser: Live-Playtest `match_13f99872809e6a66`
- Primaerer Befund: RunnerRunPlan uebersteuert eine bessere `trash_accessed_card`-Entscheidung durch `decline_low_value`.

## Pakete

1. Preflight, Prozessartefakt und Evidence-Scaffold.
2. RunPlan Access-Policy und Run-Start-AccessIntent korrigieren.
3. Regressionstests und Debug-Evidence absichern.
4. Fokussierte AI-Checks und Typecheck ausfuehren.
5. Final-Report, Wissenspflege, lokale Integration nach `main`.

## Akzeptanzkriterien

- Eine `decline_low_value`-Policy darf sichtbare, semantisch bessere Trash-Entscheidungen nicht hart blockieren.
- Ein invalidierter RunPlan darf Access-Trash/Steal-Entscheidungen nicht mehr gegen die aktuelle semantische Bewertung erzwingen.
- Generische Central-Runs verwenden bei unbekanntem Trash-Ziel keine pauschale Niedrigwert-Ablehnung.
- Regressionstests decken kostenlosen/relevanten Ambush-Trash und die Gegenfaelle Reserve/Must-Trash ab.
- Trace-Evidence zeigt RunPlan-Access-Policy und Invalid-Fallback lesbar an.

## Nicht-Ziele

- Keine Engine-Regelaenderung.
- Keine kartennamenspezifische `Setup!`-Sonderregel.
- Keine Veraenderung gespeicherter Runtime-/SQLite-Daten.
- Kein Starten, Stoppen oder Neustarten lokaler Multiplayer-Prozesse.
