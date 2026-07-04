# Corp Scoreline Remote Triage Evidence 2026-07-04

## Datenbasis

SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`

Analysierte Human-vs-KI-Spiele:

| Match | Mode | Ende | Sieger | Endgrund | Events | Snapshots | AI-Traces |
| --- | --- | ---: | --- | --- | ---: | ---: | ---: |
| `match_ca41d980913f277f` | `human_runner_vs_corp_ai` | SV 316 | Runner | `Tycho Extension` aus HQ gestohlen | 317 | 317 | 117 |
| `match_248657ecb512f38f` | `human_runner_vs_corp_ai` | SV 110 | Corp | Runner-Flatline durch eigenen Start-of-Turn-Effekt | 111 | 111 | 58 |

## Befund 1: Scoreline wird nicht konsequent konvertiert

Match `match_ca41d980913f277f`:

- SV 18: `Corporate Downsizing` liegt in Remote 1 hinter rezzed `Quandary`; Corp hat 1 Credit, 3 Klicks, `Vapor Ops`, `Executive Extraction` und `Overtime Incentives` in HQ.
- SV 18 und SV 20: Corp installiert stattdessen neue `Vapor Ops`-Neben-Remotes. Die eigene Triage meldet `protect_score_remote` mit `corp_board_triage_mismatch`.
- SV 29 und SV 46: Corp installiert weitere Remote-ICE, obwohl der ICE-Placement-Evaluator `prefer_economy`/`rez_reserve_too_low` meldet.

Erwartung: Bestehende Agenda-Remote muss zu Schutz, Funding oder Advance/Score führen. Neue Neben-Remotes und unbezahlbare ICE-Schichten dürfen nicht gewinnen.

## Befund 2: Central-Aufbau verdrängt Remote-Scoring zu lange

Match `match_ca41d980913f277f`:

- SV 61: `protect_rd` ist nach R&D-Zugriffen plausibel.
- Später bleibt R&D über lange Strecken kritisch, obwohl R&D bereits mehrere ICE-Layer hat.
- SV 164: Corp installiert weiteres R&D-ICE, obwohl der Placement-Evaluator `raw_server_need:0` zeigt. Remote 1 ist ein bestehender Scoring-Server, wird aber nicht zum Scoring genutzt.

Erwartung: Central-Schutz darf nur bei konkreter, nicht bereits ausreichend beantworteter Gefahr Remote-Scoring überstimmen.

## Befund 3: Asset-Advance verdrängt Agenda-Plan

Match `match_248657ecb512f38f`:

- SV 61 bis SV 92: `Vapor Ops` in Remote 1 wird wiederholt advanced und erreicht 7 Advancement-Counter.
- SV 87/89/91: weitere `advance_card` auf `Vapor Ops`; zwischendurch wird nur ein Counter für 1 Credit genutzt.
- Die Corp gewinnt das Spiel nicht wegen dieser Linie, sondern weil der Runner durch eigenen Start-of-Turn-Schaden flatlined.

Erwartung: Advancebare Assets zählen nicht als Agenda-Scoreline. Wiederholtes Asset-Counter-Advance braucht konkreten aktuellen Payoff.

## Befund 4: Action-Gain ohne Payoff

Match `match_ca41d980913f277f`:

- Events 64-66: `Overtime Incentives` wird gespielt, danach folgen einfache Credit-Aktionen.
- Events 102-106 zeigen ein ähnliches Muster mit zusätzlichen Basic-Credit-Aktionen.

Erwartung: `Overtime Incentives` darf nur positiv sein, wenn die zusätzlichen Aktionen konkret Score, Schutz, Funding oder einen echten Economy-Payoff ermöglichen.

## Befund 5: Triage-Mismatch bleibt zu oft nur Diagnose

Match `match_ca41d980913f277f`:

- SV 18/20/30/31: Aktionen gewinnen trotz `corp_board_triage_mismatch`, weil keine passende Zielaktion oder kein korrekter Funding-Fallback hoch genug bewertet wird.
- Das zeigt keinen Engine-Fehler, aber einen Runtime-Kopplungsfehler zwischen Triage, Funding und Action-Familien.

Erwartung: Wenn das Primärziel nicht legal oder finanzierbar bedient werden kann, muss die Triage auf Funding/Recover/Draw-Setup fallen, nicht auf beliebige Mismatch-Aktionen.

## Nicht bestätigt

`end_turn` als zweite oder dritte Korp-Aktion wurde in diesen zwei Spielen nicht bestätigt. Alle geprüften `end_turn`-Traces hatten `corp.clicks:0`. Auffällig bleibt nur, dass `end_turn` mit stark negativem Score als einzige LegalAction geloggt wird; das ist Diagnose-Rauschen und kein freigegebener Umsetzungsgegenstand.

## Regressionserwartungen

- Aktive Agenda-Remote plus fehlender Rez-Floor: Economy schlägt Advance, neue Neben-Remote und unbezahlbares ICE.
- Aktive Agenda-Remote plus finanzierbarer Schutz: Remote-ICE/Rez oder Advance/Score schlägt generischen Central-Ausbau.
- Bereits gut geschütztes HQ/R&D: weiteres Central-ICE deeskaliert gegenüber Scoreline.
- Akut game-ending HQ/R&D: Central-Schutz bleibt stärker als Remote-Setup.
- `Vapor Ops` mit vorhandenen Countern: blindes weiteres Advancen verliert gegen Agenda-Plan oder echten Payoff.
- `Overtime Incentives` ohne konkrete Zusatzaktionslinie: verliert gegen normale Economy/Setup.
- `Overtime Incentives` mit unmittelbarem Score-Closeout: bleibt erlaubt.
