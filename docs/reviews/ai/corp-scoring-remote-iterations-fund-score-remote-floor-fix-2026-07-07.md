# Corp-Scoring-Remote Iteration: Fund-Score-Remote Floor Fix

Status: akzeptiert.

## Problem

In Pair G / Seed `ai-v143-tuning-001` priorisierte die Corp bei Action 50 ein neues Remote-ICE (`Cortical Scanner`) über `gain_credit`, obwohl die Triage bereits `fund_score_remote` meldete und die Corp das ICE nach Installation nicht rezzen konnte.

Die Ursache war, dass `requiredRezFloor` in dieser Lage auf `0` fiel. Damit wurde `gain_credit` zwar leicht positiv bewertet, aber die unfinanzierbare Remote-ICE-Installation blieb nicht als Triage-Widerspruch markiert und konnte durch lokale Install-/Remote-Boni gewinnen.

## Änderung

- `fund_score_remote` übernimmt aus Scoring-Window-Evidence positive Rez-Floors auch dann, wenn `dynamicProtectionReserve` `0` ist.
- Falls ein neues Remote noch keine ICE-Evidence hat, wird der Rez-Floor aus konkreten same-target ICE-Install-Kandidaten abgeleitet.
- Same-target Remote-ICE-Installationen werden bei `fund_score_remote` als Mismatch gewertet, wenn eine Economy-Aktion legal ist und die Corp das installierte ICE anschließend nicht rezzen kann.

## Evidence

- Vorher: Action 50 wählt `install_card` / `Cortical Scanner`, obwohl `rez_affordable:false` und `recommendation:prefer_economy` vorliegen.
- Nachher: Action 50 wählt `gain_credit`; `Cortical Scanner` und `Fire Wall` fallen durch `corp_board_triage_mismatch` deutlich ab.
- Diagnose: `corp-scoring-remote-iterations-pair-g-seed001-fund-remote-floor-fix-r2-2026-07-07.json`.

## Vergleichsläufe

30er Match-Benchmark gegen den vorherigen akzeptierten Stand:

- vorher: Corp 22 / Runner 8, Runner AP 4.067, Corp AP 3.433, Limits 0
- nachher: Corp 22 / Runner 8, Runner AP 4.000, Corp AP 3.433, Limits 0
- geänderter Seed: `latest-match-baseline-005` endet weiter als Corp-Sieg, aber schneller und mit weniger Runner-AP.

Strategie-Panel E-H, 20 Spiele:

- vorher: Runner 12 / Corp 7 / Limit 1, Corp Scores 30, Runner Steals 31
- nachher: Runner 11 / Corp 7 / Limit 2, Corp Scores 29, Runner Steals 27
- Findings sinken von 784 auf 728; `plan_step_action_mismatch` sinkt von 485 auf 456.

## Bewertung

Der Fix ist kein großer Stärkegewinn, beseitigt aber einen konkreten logischen Widerspruch: Eine `fund_score_remote`-Lage darf nicht durch eine neue unfinanzierbare ICE-Installation auf demselben Remote überstimmt werden. Die Panel-Regression ist nicht stark genug, um den Fix zu verwerfen; der zusätzliche Limit-Fall in Pair G bleibt ein separater Folgekandidat.
