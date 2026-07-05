# AI Match Deck Paired Baseline match_32b46ac7268c2c75

Status: complete
Generated: 2026-07-05T23:56:12.805Z
Git head: 8f2e78600

## Source

- Match: `match_32b46ac7268c2c75`
- SQLite: `../NETGRID/data/runtime/multiplayer/netgrid.sqlite`
- Runner deck: `Stealth Interface Starter` (fnv1a:607d69e7)
- Corp deck: `Shadoe Tag & Bag` (fnv1a:294e9c76)
- Games per leg: 100
- Max actions: 480

## Legs

| Leg | Status | Runner | Corp | Runner wins | Corp wins | Limits | Runner AP | Corp AP | Corp scores | Runner steals | Corp flatlines |
| --- | --- | --- | --- | ---: | ---: | ---: | ---: | ---: | ---: | ---: | ---: |
| current_vs_current | complete | current_candidate | current_candidate | 20 | 64 | 16 | 3.69 | 1.02 | 57 | 210 | 57 |

## Interpretation

- `basic_runner_vs_current_corp` isolates current Corp strength against a fixed/simple Runner.
- `current_runner_vs_basic_corp` isolates whether the current Runner improved or regressed against a fixed/simple Corp.
- `current_vs_current` alone is not sufficient, because both sides can move at once.
