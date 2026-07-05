# AI Match Deck Paired Baseline match_731b436e85fb2484

Status: complete
Generated: 2026-07-05T21:58:24.281Z
Git head: 41e3f0e3b

## Source

- Match: `match_731b436e85fb2484`
- SQLite: `../NETGRID/data/runtime/multiplayer/netgrid.sqlite`
- Runner deck: `Stealth Interface Starter` (fnv1a:607d69e7)
- Corp deck: `Tycho Ice Stack` (fnv1a:c72ff4b7)
- Games per leg: 100
- Max actions: 480

## Legs

| Leg | Status | Runner | Corp | Runner wins | Corp wins | Limits | Runner AP | Corp AP | Corp scores | Runner steals | Corp flatlines |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| current_vs_current | complete | current_candidate | current_candidate | 42 | 19 | 39 | 4.12 | 2.62 | 66 | 103 | 0 |

## Interpretation

- `basic_runner_vs_current_corp` isolates current Corp strength against a fixed/simple Runner.
- `current_runner_vs_basic_corp` isolates whether the current Runner improved or regressed against a fixed/simple Corp.
- `current_vs_current` alone is not sufficient, because both sides can move at once.
