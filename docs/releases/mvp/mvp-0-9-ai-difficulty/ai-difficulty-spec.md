# AI Difficulty 0.9 Spec

Status: Requirements Freeze
Stand: 2026-05-03

## Grundregel

Difficulty verändert Gewichtung, Risikobereitschaft, Fallback-Schwelle und Erklärdetail. Difficulty verändert niemals den Informationszugriff.

## Profile

| Difficulty | Verhalten | Budget |
|---|---|---|
| `easy` | einfache Gewichtung, mehr Economy/Setup, konservative Runs, höhere Fallback-Akzeptanz. | unter 5 ms pro Entscheidung im lokalen Standard-Smoke |
| `normal` | Rollen- und Risiko-Scoring, bessere Run-/Score-/Rez-/Trash-Entscheidungen. | unter 15 ms |
| `hard` | stärkere Gewichtung, weniger Fallback, kurzer sichtbasierter Nutzenvergleich. | unter 50 ms |

## Pflichtregeln

- Easy, Normal und Hard erhalten denselben `AiDecisionInput`.
- Hard darf keine verdeckten Gegnerkarten, Decklisten, Deckreihenfolgen oder FullState-Daten nutzen.
- Difficulty-Profile sind versioniert in `data/ai/ai-profiles-0.9.json`.
- Tests müssen zeigen, dass Easy und Normal unterscheidbar sind; Hard ist umzusetzen, wenn es innerhalb des gleichen Safety-Vertrags stabil bleibt.

## Tuning

Profiländerungen sind Produktverhalten. Golden-Summaries und Holdout-Seeds werden nur bewusst angepasst und im Review dokumentiert.
