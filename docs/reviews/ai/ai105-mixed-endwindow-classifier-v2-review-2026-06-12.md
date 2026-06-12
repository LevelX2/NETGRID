# AI105 Mixed-Endwindow Classifier v2

Datum: 2026-06-12

## Ziel

AI105 klaert die verbliebenen `mixed_unknown`-Action-Limit-Endfenster. Nach AI103 waren zwei Faelle gemischt:

- C / `ai-v143-tuning-004`
- D / `ai-v143-tuning-004`

## Analyse

Die Ursache war kein fehlender Detektor, sondern ein Gleichstand im letzten 40-Action-Fenster. Der v1-Classifier gab bei gleicher Trefferzahl pauschal `mixed_unknown` zurueck.

Die Detailzerlegung zeigte:

- C004: Gleichstand zwischen Runner-Reserve-Credits, spaeten Draws ohne Coverage-/Handziel und Continue-ohne-Fortschritt-Signalen. Das terminale Signal im Fenster ist spaetes Drawen ohne Coverage-/Handziel.
- D004: Gleichstand zwischen Runner-Reserve-Credits und Corp-Gain-Credits ohne sichere Score-/Install-Alternative. Das terminale Signal im Fenster ist Corp-Credit ohne sichere Alternative.

## Umsetzung

Der Subcluster-Classifier speichert jetzt neben der Trefferzahl auch den letzten Index jedes Subclusters im Endfenster. Bei gleicher Trefferzahl entscheidet das zuletzt auftretende Signal. Das ist fuer Action-Limit-Endfenster aussagekraeftiger als ein reiner Gleichstand, weil der terminale Zustand naeher an der Blockade liegt.

Neue Regression:

- `breaks mixed subcluster ties by the latest end-window evidence`

## Nachlauf

Nachweis: `docs/reviews/ai/ai105-mixed-endwindow-classifier-v2-a-d-5seed-2026-06-12.json`

Kernmetriken:

- Spiele: 20
- Entscheidungen: 2498
- Illegale Actions: 0
- Replay-Fehler: 0
- Redaction safe: ja
- `actionLimitReached`: 9
- `mixed_unknown`: 0
- `runner_late_gain_credit_real_reserve`: 4
- `corp_late_gain_credit_no_safe_alternative`: 1
- `late_draw_without_coverage_or_hand_goal`: 1
- `continue_without_progress`: 0

## Schlussfolgerung

Die Mischfaelle sind diagnostisch aufgeloest. AI106 kann den Zielwert nicht mehr mit unbekannten Endfenstern begruenden, sondern muss gegen diese erklaerten Restcluster entscheiden: echte Runner-Reserve/Coverage, ein Corp-Reserve-Fall, ein Corp-No-Alternative-Fall, ein spaeter Draw-Fall, ein Run-Microstep-Fall und ein Break-/Pump-Pflichtfall.
