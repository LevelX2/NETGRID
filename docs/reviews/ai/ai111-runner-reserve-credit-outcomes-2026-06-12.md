# AI111 Runner Reserve Credit Outcomes

Datum: 2026-06-12

## Ziel

AI111 bewertet die harten Runner-Reserve-Credit-Fälle über Folgefenster statt nur über die Einzelaktion. Ein Runtime-Fix ist nur zulässig, wenn ein `reserve_no_conversion`-Fall konkret belegt ist.

## Detailartefakt

- `docs/reviews/ai/ai111-runner-reserve-credit-outcomes-detail-2026-06-12.json`

## Ergebnis

| Pair | Seed | Erster Reserve-Index | Reserve-Entries | Kategorie | Fortschritt im Folgefenster |
| --- | --- | ---: | ---: | --- | --- |
| B | `ai-v143-tuning-003` | 121 | 5 | `reserve_preserved_run_reachability` | Runner-Install, Corp-Install |
| B | `ai-v143-tuning-005` | 100 | 19 | `reserve_no_conversion` | keiner im 20-Action-Folgefenster |
| C | `ai-v143-tuning-001` | 105 | 13 | `reserve_preserved_run_reachability` | Runner-Play-Event, Corp-Install |
| C | `ai-v143-tuning-005` | 100 | 14 | `reserve_preserved_run_reachability` | Runner-Play-Event, Runner-Install |

## Bewertung

Drei der vier Runner-Reserve-Fälle konvertieren oder erhalten sichtbare Run-/Coverage-Reichweite. Diese Fälle sind keine Kandidaten für eine pauschale Credit-Strafe.

Der Fall B / `ai-v143-tuning-005` ist ein echter Restkandidat:

- wiederholte Runner-Credits mit `runnerSetupMissingCoverageTypes: wall`,
- zwischendrin `remove_tag`,
- keine Install-, Play-, Access-, Trash-, Steal-, Break- oder Pump-Aktion im 20-Action-Folgefenster nach dem ersten Reserve-Credit,
- später weitere Credit-Zyklen bis zum Action-Limit.

Trotzdem ist die Ursache noch nicht eng genug für einen sicheren Runtime-Fix. Das Detailartefakt zeigt nicht, welche konkrete alternative LegalAction in diesem Entscheidungsfenster sicher besser war. Eine breite Strafe gegen `build_credit_base` bei Coverage-Lücke könnte legitime spätere Coverage- oder Run-Reichweite beschädigen.

## Entscheidung

Kein Runtime-Fix in AI111.

AI111 liefert aber einen konkreten AI112-Kandidaten:

- B / `ai-v143-tuning-005`
- Muster: Wall-Coverage-Lücke + wiederholte Credits + keine Progress-Konversion im Folgefenster

Ein späterer enger Fix braucht zusätzliche Evidence, etwa:

- sichere Search-/Draw-/Install-LegalAction im selben Fenster,
- Nachweis, dass weitere Credits den Coverage-Zustand nicht verbessern,
- oder ein Trace-Feld, das wiederholte Coverage-Lücke ohne Hand-/Search-Fortschritt direkt markiert.

## Checks

- `corepack pnpm --filter @netgrid/ai typecheck`
- `git diff --check`

## Schlussfolgerung

Runner-Reserve-Credits sind nicht pauschal falsch. Ein einzelner No-Conversion-Fall bleibt als möglicher Folge-Fix sichtbar, ist aber ohne zusätzliche LegalAction-/Outcome-Evidence noch kein sicherer `<= 8`-Fix.
