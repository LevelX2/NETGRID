# AI Match Deck Paired Baseline match_abd9fc8312854db1

Status: complete
Generated: 2026-07-11T14:30:08.419Z
Git head: 81dff2df2

## Source

- Match: `match_abd9fc8312854db1`
- SQLite: `../NETGRID/data/runtime/multiplayer/netgrid.sqlite`
- Runner deck: `Krashkurs: Clown-Kreditmaschine` (fnv1a:776713cf)
- Corp deck: `Fast Advance, Baby` (fnv1a:f9ad60d8)
- Games per leg: 25
- Max actions: 480

## Legs

| Leg | Status | Runner | Corp | Runner wins | Corp wins | Limits | Runner AP | Corp AP | Corp scores | Runner steals | Corp flatlines |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| current_vs_current | complete | current_candidate | current_candidate | 12 | 13 | 0 | 4.64 | 5.88 | 72 | 60 | 1 |
| random_runner_vs_current_corp | complete | random_legal_bot | current_candidate | 0 | 25 | 0 | 0.92 | 6.72 | 81 | 12 | 5 |
| current_runner_vs_random_corp | complete | current_candidate | random_legal_bot | 22 | 2 | 1 | 7.16 | 0.08 | 1 | 89 | 2 |
| random_vs_random | complete | random_legal_bot | random_legal_bot | 17 | 6 | 2 | 5.88 | 1.64 | 22 | 70 | 5 |

## Interpretation

- `random_runner_vs_current_corp` isolates current Corp behavior against an explicit Random-Legal control.
- `current_runner_vs_random_corp` isolates current Runner behavior against an explicit Random-Legal control.
- `current_vs_current` alone is not sufficient, because both sides can move at once.
