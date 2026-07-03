# Latest Match 100-Game Benchmark: Triage vs. Signal Consumer

Stand: 2026-07-03

## Setup

- Match-Basis: `match_41020769c9f35150`
- Seeds: `latest-match-baseline-001` bis `latest-match-baseline-100`
- Limit: 480 Actions pro Spiel
- Corp-Deck: `KI Rush Score - Static ICE Mix`
- Runner-Deck: `Inside Forgery Loop`

## Ergebnisse

| Stand | Runner-Siege | Korp-Siege | Action-Limits | Runner-AP Ø | Korp-AP Ø | Actions Ø |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| Post ICE Placement | 69 | 24 | 7 | 5,60 | 3,34 | 254,83 |
| Triage-Fix | 52 | 35 | 13 | 4,12 | 4,38 | 308,64 |
| Triage + Signal-Consumer | 52 | 35 | 13 | 4,12 | 4,38 | 308,64 |

## Seed-Vergleich

Triage-Fix gegen Post-ICE-Placement:

- 45 Seeds blieben Runner-Siege.
- 21 Seeds blieben Korp-Siege.
- 12 Seeds kippten von Runner-Sieg zu Korp-Sieg.
- 12 Seeds kippten von Runner-Sieg zu Action-Limit.
- 3 Seeds kippten von Korp-Sieg zu Runner-Sieg.
- 4 Seeds kippten von Action-Limit zu Runner-Sieg.
- 2 Seeds kippten von Action-Limit zu Korp-Sieg.
- 1 Seed blieb Action-Limit.

Triage-Fix gegen Triage + Signal-Consumer:

- 100/100 Seeds haben denselben Winner, dieselbe Punktzahl, dieselbe Aktionszahl und denselben Limit-Status.
- Die unterschiedlichen JSON-Hashes kommen aus Laufzeit-/Metadatenfeldern, nicht aus Spielverlauf-Unterschieden.

## Interpretation

Der Triage-Fix repariert den untersuchten gekippten Seed und verbessert den 100er-Benchmark gegenüber dem Post-ICE-Placement-Stand deutlich für die Korp: Runner-Siege sinken von 69 auf 52, Korp-Siege steigen von 24 auf 35. Der Preis ist eine höhere Zahl an Action-Limits von 7 auf 13.

Der Signal-Consumer-Fix hat in diesem konkreten Benchmark keinen messbaren Einfluss. Das getestete Korp-Deck enthält 0 Kopien von Karten mit den neu konsumierten Signalen `corp_ice.multi_program_trash`, `run.corp_run_rewind` oder `damage.corp_persistent_damage_counter`; es ist bewusst ein statischer ICE-Mix ohne dynamische Post-Pass-ICE. Für diese Signal-Consumer muss ein separater gezielter Benchmark mit entsprechenden ICE-Karten oder ein angepasstes Corp-Deck verwendet werden.

Restbefund: Der Stand ist besser als der direkte Post-ICE-Placement-Rückschritt, aber noch nicht optimal. Die verbleibenden 52 Runner-Siege und 13 Limits sprechen dafür, als Nächstes die nicht gewonnenen Seeds nach Scoreline-Fortsetzung, Remote-Ausbau nach früher Stabilisierung und Action-Limit-Ursachen zu clustern.
