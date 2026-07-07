# Corp-Scoring-/Remote-Iteration: verworfener Credit-Loop-Guard

Status: verworfen, nicht in Runtime uebernommen.

## Kandidat

Der Kandidat sollte bei `protect_score_remote`, `fund_score_remote` oder `force_scoreline_clock` einfache `gain_credit`-Aktionen staerker als `draw_card` bestrafen, wenn die Korp bereits deutlich ueber dem relevanten Rez-Floor liegt. Ziel war, bekannte High-Credit-Loops in blockierten Scoreline-Lagen zu vermeiden.

## Ergebnis

Der Ansatz verbessert einzelne Stall-Seeds, kippt aber belegbar andere Spiele gegen die Korp:

- Seed `latest-match-baseline-009` ohne Kandidat nach `main`-Sync: Korp gewinnt per Flatline nach 147 Aktionen, Runner/Korp AP `4/0`.
- Derselbe Seed mit Low-Risk-Credit-Guard: Runner gewinnt nach 375 Aktionen, Runner/Korp AP `8/0`.
- Breiter 30er-Kandidatenlauf `corp-scoring-remote-iterations-credit-loop-guard-30-2026-07-07`: Korp-Siege fallen von 21 auf 19, Runner-Siege steigen von 9 auf 11.

Relevante lokale Evidence:

- `docs/reviews/ai/corp-scoring-remote-iterations-seed-009-post-main-sync-no-credit-loop-candidate-2026-07-07.json`
- `docs/reviews/ai/corp-scoring-remote-iterations-seed-009-credit-loop-low-risk-guard-after-main-sync-2026-07-07.json`
- `docs/reviews/ai/corp-scoring-remote-iterations-credit-loop-guard-30-2026-07-07.md`

## Befund

Der Fehler ist nicht sauber durch eine pauschale `gain_credit`-Abwertung loesbar. Die Regressionsdiagnose zeigt stattdessen eine groebere Entscheidungsinkonsistenz: In spaeteren Fenstern existiert eine vorbereitete Remote und Agenda-Druck in HQ, aber Scoreline-Installationen werden wegen `protect_score_remote`, `corp_game_ending_scoreline_exposure_penalty` und `corp_contestable_remote_score_penalty` so stark abgestraft, dass Economy- oder Setup-Aktionen weiterhin gewinnen.

Folgearbeit sollte deshalb nicht beim Credit-vs-Draw-Tie ansetzen, sondern die konkrete Frage klaeren, wann eine vorhandene Remote fuer Agenda-Installation wirklich contestable ist und wann die Scoreline trotz Near-Win-Risiko verfolgt werden darf. Bis dahin bleibt der Credit-Loop-Guard aus dem Code entfernt.
