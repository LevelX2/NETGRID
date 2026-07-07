# Existing Remote Funding Floor

## Befund

Hybrid Seed `ai-v143-tuning-004` blieb nach dem Scoreline-Central-Gate bei einem Folgekonflikt:

- Triage/Scoreline wollten `protect_score_remote` fuer `remote_1`.
- Konkrete Remote-ICE-Installationen auf `remote_1` waren aber nach Installkosten nicht rezbar.
- Trotzdem fiel die Lage nach Erreichen des Scoring-Window-Floors von 6 Credits wieder auf `protect_score_remote`, und eine HQ-ICE-Installation gewann ueber die normale ICE-/Plan-Wertung.

Der fehlende Teil war der Same-Target-Protection-Floor: Wenn `build_remote_ice` empfohlen wird, reicht der reine bestehende Remote-Full-Path-Floor nicht aus. Die Korp muss auch die guenstigste konkrete ICE-Installation auf demselben Remote plus Rez-Kosten finanzieren koennen.

## Änderung

`fund_score_remote` verwendet fuer bestehende Score-Remotes nun den hoeheren Wert aus:

- Scoring-Window-Rez-Floor;
- guenstigster gleicher Zielserver-ICE-Install-plus-Rez-Floor.

Die Funding-Erkennung bleibt eng:

- nur bestehende Remote-Scoreline;
- nur wenn `build_remote_ice` bzw. ein Full-Path-Floor-Defizit vorliegt;
- nur wenn der Runner laut Sichtdaten nicht bereits vor dem Score realistisch contesten/reachen kann.

## Seed-Evidence

Hybrid Seed `ai-v143-tuning-004`, 480 Actions:

Nach Scoreline-Central-Gate, vor diesem Kandidaten:

- State 155: `corp.install_card.hq` gewinnt trotz `protect_score_remote`.
- `corpExtraCentralIceChosenOverReadyRemoteBuild`: 1
- `corpInstalledCentralIceWithoutRezReserve`: 2
- Spielausgang: Corp 7:6 nach 198 Actions.

Nach diesem Kandidaten:

- State 154-156: `gain_credit` finanziert bis zum Remote-Protection-Floor 8.
- State 155/156: keine HQ-ICE-Installation mehr.
- `corpExtraCentralIceChosenOverReadyRemoteBuild`: 0
- `corpInstalledCentralIceWithoutRezReserve`: 0
- Spielausgang: Corp 7:6 nach 200 Actions.

## Hybrid 5-Seed Vergleich

Slot `strategy_panel_hybrid_score_punish_cheap_bag`, Seeds `ai-v143-tuning-001` bis `ai-v143-tuning-005`, 480 Actions.

| Metrik | Vorher | Nachher | Delta |
| --- | ---: | ---: | ---: |
| Action-Limit-Rate | 0 | 0 | 0 |
| Average Actions | 247.6 | 250.0 | +2.4 |
| Runner Agenda Points | 20 | 20 | 0 |
| Corp Agenda Points | 37 | 37 | 0 |
| Runner Steals | 8 | 8 | 0 |
| Corp Scores | 13 | 13 | 0 |
| Remote Build -> Advance/Protect/Score | 33 | 32 | -1 |
| Advance -> Score/Protected Window | 41 | 42 | +1 |
| Extra Central over Ready Remote Build | 1 | 0 | -1 |
| Extra Central over Agenda Install | 0 | 0 | 0 |
| Central ICE without Rez Reserve | 7 | 4 | -3 |
| Central over-iced without pressure | 189 | 190 | +1 |
| Economy suspicious: Credits already enough | 72 | 77 | +5 |
| Economy suspicious: Delayed terminal action | 57 | 62 | +5 |
| Economy suspicious: Remote still safe | 71 | 76 | +5 |

## Bewertung

Der Kandidat ist kein allgemeiner Spielstaerkegewinn im 5-Seed-Smoke, aber er beseitigt den konkret untersuchten Central-over-Remote-Funding-Fehler ohne Agenda-Punkt-Regression. Das Rest-Risiko ist eine diagnostische bzw. echte Economy-Drift: Die Korp nimmt zusaetzliche Credits, und die bestehenden Suspicious-Economy-Metriken zaehlen diese weiterhin als verdachtig. Das muss in der naechsten Iteration gegen reale Score-Fortsetzung geprueft werden.
