# AI Match Deck Paired Baseline match_41020769c9f35150

Status: complete
Generated: 2026-07-05T20:50:08.357Z
Git head: 41e3f0e3b

## Source

- Match: `match_41020769c9f35150`
- SQLite: `../NETGRID/data/runtime/multiplayer/netgrid.sqlite`
- Runner deck: `Inside Forgery Loop` (fnv1a:14c9bd9a)
- Corp deck: `KI Rush Score - Static ICE Mix` (fnv1a:a1182048)
- Games per leg: 30
- Max actions: 480

## Legs

| Leg | Status | Runner | Corp | Runner wins | Corp wins | Limits | Runner AP | Corp AP | Corp scores | Runner steals | Corp flatlines |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| current_vs_current | complete | current_candidate | current_candidate | 4 | 25 | 1 | 2.767 | 6.867 | 119 | 48 | 0 |

## Interpretation

- `basic_runner_vs_current_corp` isolates current Corp strength against a fixed/simple Runner.
- `current_runner_vs_basic_corp` isolates whether the current Runner improved or regressed against a fixed/simple Corp.
- `current_vs_current` alone is not sufficient, because both sides can move at once.
