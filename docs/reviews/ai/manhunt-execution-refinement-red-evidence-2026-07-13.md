# Manhunt-Ausführungspräzisierung: rote Checkpoint-Evidence

Stand: 2026-07-13  
Quellmatch: `match_fa11540b1f1e08b6`  
Deck: `Manhunt Pressure Bureau` (`fnv1a:1e1a582e`)

## Zweck

Die freigegebenen Beobachtungen werden vor der Verhaltensänderung als
spielgleiche Decision-Checkpoints festgehalten. Jeder Checkpoint enthält den
vollständigen Engine-Zustand, den bis dahin sichtbaren Event-Präfix, den
side-sicheren Deck-Snapshot und den gespeicherten KI-Runtime-Zustand.

## Reproduzierbare rote Zielzustände

Der Vorher-Lauf

```text
pnpm --filter @netgrid/ai exec vitest run \
  src/evaluation/decision-checkpoints/manhunt-execution-refinement-decision-checkpoints.test.ts \
  --reporter=verbose
```

weist folgende aktuelle Abweichungen nach:

| Checkpoint           |                       Matchzustand | Soll                                                                                                                       | Vorher tatsächlich                 |
| -------------------- | ---------------------------------: | -------------------------------------------------------------------------------------------------------------------------- | ---------------------------------- |
| `CP-MANHUNT-EXEC-01` |   Entscheidung 16, StateVersion 31 | Nach zwei offenen R&D-Zugriffen keinen zweiten Keeper in ein neues Remote legen                                            | Keeper in neues Remote             |
| `CP-MANHUNT-EXEC-03` | Entscheidung 109, StateVersion 234 | Chance Observation ohne verbliebenen unmittelbaren Schaden-Payoff nicht spielen                                            | Chance Observation spielen         |
| `CP-MANHUNT-EXEC-04` | Entscheidung 159, StateVersion 362 | Installierte und bezahlbare City Surveillance vor generischem Credit rezen                                                 | Credit nehmen                      |
| `CP-MANHUNT-EXEC-05` | Entscheidung 160, StateVersion 363 | Bei null verbleibenden stehlbaren Agendapunkten von HQ-Matchpoint-Schutz auf die verbliebene Tag-/Schadenslinie umschalten | Wall of Static auf HQ installieren |
| `CP-MANHUNT-EXEC-06` |    Entscheidung 9, StateVersion 17 | Ohne sichtbaren Punish-Payoff 0 Credits bieten                                                                             | 2 Credits bieten                   |

Die beiden wertabhängigen Trace-Gegenfälle sind vor dem Fix ebenfalls rot,
weil der produktive Trace-Kontext das öffentliche Feld
`baseTraceStrength` noch nicht übernimmt und deshalb immer auf das pauschale
Hard-Gebot 2 zurückfällt:

- sichtbares, bezahlbares Closed Accounts bei Runner 5 Credits und Base 5:
  Soll 1, tatsächlich 2;
- derselbe Payoff bei Runner 4 Credits und Base 5:
  Soll 0, tatsächlich 2.

## Grüne Schutzfälle vor dem Fix

Folgende Fälle bleiben bereits im Vorher-Stand grün und schützen gegen eine
Überkorrektur:

- Im echten Eröffnungszustand mit exponierter Agenda in HQ wird der erste
  Keeper weiterhin auf HQ installiert (`CP-MANHUNT-EXEC-07`).
- Scorched Earth wird im Discard-Zustand 99 bei noch erreichbaren Tag-Quellen
  bereits behalten (`CP-MANHUNT-EXEC-02`). Dafür ist kein zusätzlicher
  Verhaltensfix nötig.
- Chance Observation darf mit einem sichtbaren und bezahlbaren Scorched Earth
  weiterhin gespielt werden.
- Ist City Surveillance nicht bezahlbar, bleibt Credit nehmen zulässig.
- Wird wieder eine eigene Agenda aus dem Scorebereich als stehlbare Agenda in
  HQ hergestellt, darf die KI erneut eine geschützte Score-Remote vorbereiten.

## Capture-Kompatibilität

Die Checkpoints 1, 2, 6 und 7 konnten mit streng identischem Warm-up ohne
Abweichung erzeugt werden. Bei den späten Checkpoints 3 bis 5 weicht der
aktuelle Code bereits bei Entscheidung 88 vom historischen Lauf ab. Sie wurden
deshalb mit dem vorgesehenen Rebase-Verfahren erfasst; der anschließende
kompatible Suffix umfasst 20, 70 beziehungsweise 71 Entscheidungen. Die
Zielzustände selbst stammen weiterhin unverändert aus dem gespeicherten Match.
