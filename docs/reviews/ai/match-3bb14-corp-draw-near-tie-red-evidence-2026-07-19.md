# Match 3bb14 Corp-Draw/Near-Tie Red-Evidence (2026-07-19)

## Quelle und Capture

- Match: `match_3bb14a8fd2102c9a`
- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
  (read-only)
- Modus: `human_runner_vs_corp_ai`, Corp `hard`
- Match-Seed: `match-mrqqtpqg-u6mu6t`
- Decision-Coverage: 42/42, keine fehlenden, verwaisten oder doppelten Traces
- Zielentscheidungen: D9/SV13, D10/SV14 und D11/SV15

Alle drei Captures liefen mit `warmup-policy strict`. D9 besitzt acht, D10
neun und D11 zehn Warmup-Decisions; `warmupDriftCount` ist jeweils null. Die
Fixtures enthalten den damaligen GameState, das öffentliche Eventpräfix,
Corp-PlayerView/LegalActions sowie TacticalPlan, PlanPortfolio und
StrategicIntent. RunnerRunPlan ist für die Corp-Entscheidungen nicht relevant.

## Roter Verhaltensnachweis

| Checkpoint | Historische Lage | Erwartung | Ausgangscode |
| --- | --- | --- | --- |
| `cp-3bb14-03-defensive-draw-d9` | 4/5 HQ, 38 R&D, ungeschütztes R&D, nur Shock.r als ungeeignete erste ICE-Lage | `draw_card`; `gain_credit` verboten | `behavior_regression`, gewählt `corp.gain_credit` |
| `cp-3bb14-04-defensive-draw-d10` | gleiche Hand- und Schutzlage nach erstem Credit | `draw_card`; `gain_credit` verboten | `behavior_regression`, gewählt `corp.gain_credit` |
| `cp-3bb14-05-defensive-draw-d11` | gleiche Hand- und Schutzlage nach zweitem Credit | `draw_card`; `gain_credit` verboten | `behavior_regression`, gewählt `corp.gain_credit` |

An D9 beträgt der Rohscore `-1681` für Credit und `-1682` für Draw. Beide
Aktionen erhalten dieselben fachlichen Komponenten; die Auswahl kippt allein
durch den historischen Action-Typ-Tiebreaker `54` gegenüber `53`. D10 und D11
zeigen denselben Einpunktvertrag.

## Grüne Gegenproben vor dem Fix

- Bei auf vier reduzierter maximaler Handgröße ist 4/4 voll: Basic Credit
  bleibt gewählt und optionaler Draw bleibt verboten.
- Wird die einzige sichtbare HQ-ICE-Karte kontrolliert in ein konkretes
  Blocking-ICE umgewandelt, bleibt eine ICE-Installation vor spekulativem Draw.

Der fokussierte Ausgangslauf endet damit erwartungsgemäß bei drei
`behavior_regression`-Fehlern und zwei grünen Gegenproben. Fixture-, Engine-,
Runtime- oder Redaction-Drift liegt nicht vor.

## Abgrenzung

Der Befund autorisiert einen generischen Draw-/Near-Tie-Vertrag. Er
autorisiert keine Match-, Karten- oder Seed-Sonderregel. Der deckweite
`compiled_effect_overlap`-Audit aus Punkt 4 der ursprünglichen Analyse bleibt
außerhalb dieses Prozesses.
