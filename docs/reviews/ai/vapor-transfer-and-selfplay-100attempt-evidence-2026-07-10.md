# Vapor-Transfer und Selfplay-Guardrails: 100-Versuche-Evidence

## Testvertrag

- Corp: `Universal Fast Advance`
- Runner: Blink Pressure, Classic Prep Economy, Proteus HQ Virus & Derez und
  Proteus R&D Virus & Bad Publicity
- Seeds: `universal-fast-advance-01` bis `-25` je Matchup
- Versuche: 100 bei maximal 240 Aktionen
- Controller: Corp und Runner jeweils `current_candidate`

## Gesamtergebnis

- 35 Corp-Siege, 27 Runner-Siege
- 33 reguläre Action-Limits
- 2 frühe IllegalAction-Abbrüche
- 3 harte Access-Invariantenabbrüche
- 189 Corp-Scores, 168 Runner-Steals
- 0 Replay-, Redaction- oder Fallbackfehler

## Finding 1 – Countertransfer bleibt ungenutzt

- Vapor Ops wurde in 47 Spielen installiert sichtbar.
- 73 Installationen und 68 Advances wurden gewählt.
- 24 Credit-Cashouts wurden gewählt.
- 231 legale Move-Fenster mit 256 Kandidaten wurden beobachtet.
- Kein Countertransfer wurde gewählt.
- Neun Move-Fenster hatten eine installierte Remote-Agenda als möglichen
  Zielkontext.

Konkrete Folgen:

1. Blink Seed 07: zwei Scores mit je drei Basic Advances, obwohl Vapor
   mindestens fünf Counter hatte. Der Transfer hätte Klicks und Credits
   gespart.
2. Classic Seed 04: zwei Vapor-Counter wurden bei installierter Agenda als
   Credits ausgegeben; der Scoreplan blockierte.
3. Classic Seed 22: mit dem letzten Klick wurde Basic Advance statt legalem
   `Move all` gewählt; der Runner stahl die Agenda im Folgeturn.

Die Move-Alternative erschien als `corp.semantic.basic_install`, erhielt je
nach Kontext Score 62 bis -5.538 und wurde als `plan_mismatch`,
`excluded_by_current_plan` oder `semantic_score_below_selected` abgewählt.

Hint- und Engine-Evidence sind bereits korrekt:

- Hints: `advance.corp_counter_bank`, `advance.corp_counter_transfer`,
  `advance.score_window_support`, `corp.fast_advance` / `scoring_tool`.
- LegalAction-Payload: `scoreConversionCapability: move_advancement`, Quelle
  `source_card`, Ziel `chosen_installed_advanceable_card`, Maximum `all`.

Die Lücke liegt damit zwischen Capability, Action-Projektion und target-aware
Plan-Mapping, nicht in fehlender Karten-ID-Logik.

## Finding 2 – Secret-Spend-Guess ist fälschlich legal

- Blink Seed 06, StateVersion 44
- Blink Seed 11, StateVersion 149
- Gewählt wurde `runner.play_event` aus den aktuellen LegalActions.
- `applyAction` antwortete mit `ERR_INVALID_TARGET`: Die
  Secret-Spend-Guess-Fähigkeit benötigt mindestens zwei Credits.

Damit widersprechen sich LegalAction-Erzeugung und Revalidierung.

## Finding 3 – Access-Waiver ohne Trash-Intent

- Proteus R&D Seeds 06, 18 und 21
- Invariante:
  `free_trash_requires_trash_intent, trash_cost_waiver_requires_trash_intent`
- Der Fehler entsteht in `projectAccessDecision` und bricht fail-closed ab.

## Nicht freigabereif

Chicago Branch hatte 55 legale Ability-Fenster und keine Aktivierung. Die
gespeicherte Evidence trennt diese Fenster nicht sicher nach Agenda-Ziel und
sonstigem advancebaren Ziel. Daraus wird in diesem Prozess kein zusätzlicher
Fix abgeleitet.

## Lokale Rohdaten

Die umfangreichen Rohdaten bleiben unversioniert im Hauptworkspace unter:

- `data/local/universal-fast-advance-vapor-ops-first3-75games-2026-07-10.json`
- `data/local/universal-fast-advance-vapor-ops-rnd-25attempts-2026-07-10.json`
- `data/local/universal-fast-advance-vapor-ops-100attempt-analysis-2026-07-10.md`
