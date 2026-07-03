# AI 100-Game Comparison after Corp ICE Placement/Hints

Status: complete
Generated: 2026-07-03

## Setup

- Match snapshot: `match_41020769c9f35150`
- Runner deck: `Inside Forgery Loop` (`fnv1a:14c9bd9a`)
- Corp deck: `KI Rush Score - Static ICE Mix` (`fnv1a:a1182048`)
- Controller modes: `current_candidate` vs `current_candidate`
- Games: 100
- Batch size: 5
- Max actions per game: 480
- Seed prefix: `latest-match-baseline`

## Compared Runs

| Run | Git head | Result file |
| --- | --- | --- |
| Previous 480-action anchor | `b70355e44` | `docs/reviews/ai/latest-match-100-game-triage-one-five-480-actions-2026-06-30.json` |
| Current post ICE placement/hints | `26926f7b7` | `docs/reviews/ai/latest-match-100-game-post-ice-placement-480-actions-2026-07-03.json` |

## Result Delta

| Metric | Previous | Current | Delta |
| --- | ---: | ---: | ---: |
| Runner wins | 27 | 69 | +42 |
| Corp wins | 72 | 24 | -48 |
| Action-limit games | 1 | 7 | +6 |
| Average Runner agenda points | 2.76 | 5.60 | +2.84 |
| Average Corp agenda points | 6.50 | 3.34 | -3.16 |
| Median Runner agenda points | 2 | 7 | +5 |
| Median Corp agenda points | 7 | 2 | -5 |
| Average actions | 263.85 | 254.83 | -9.02 |
| Average turns | 41.15 | 28.28 | -12.87 |
| Replay failures | 0 | 0 | 0 |
| Games with errors | 0 | 0 | 0 |

## Progression Signals

| Signal | Previous | Current | Delta |
| --- | ---: | ---: | ---: |
| Corp score actions | 372 | 188 | -184 |
| Runner steal actions | 157 | 330 | +173 |
| Missed score windows | 27 | 15 | -12 |
| Passive actions with scoreline available | 2302 | 1482 | -820 |
| Unsafe score chosen | 0 | 0 | 0 |
| Illegal actions | 0 | 0 | 0 |

## Same-Seed Winner Transitions

| Previous -> Current | Games |
| --- | ---: |
| Corp -> Corp | 16 |
| Corp -> Runner | 50 |
| Corp -> Action limit | 6 |
| Runner -> Runner | 18 |
| Runner -> Corp | 8 |
| Runner -> Action limit | 1 |
| Action limit -> Runner | 1 |

## Interpretation

The current state is a clear regression against the last comparable 480-action baseline. The drop is not explained by runtime failures: replay failures, illegal actions and games with errors are all zero. The dominant signal is strategic: the Corp scores far less often and the Runner steals far more often on the same seed set.

The lower missed-score-window count does not indicate improvement by itself here. It is paired with fewer Corp score actions, many more Runner steals and much shorter games, so the current behavior appears to create fewer viable Corp scoring trajectories rather than converting the old windows better.

Recommended next diagnostic step: analyze a small set of flipped seeds where the previous run was a Corp win and the current run is a fast Runner win, especially `latest-match-baseline-014`, `017`, `038`, `051` and `055`, then inspect whether the new ICE placement/hint strategy over-protects the wrong server, under-protects score remotes, or exposes agendas earlier.
