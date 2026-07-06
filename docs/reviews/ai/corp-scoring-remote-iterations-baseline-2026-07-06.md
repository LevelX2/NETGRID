# Corp-Scoring-/Remote-Iteration Baseline 2026-07-06

Status: verbindliche Startbaseline fuer `codex/corp-scoring-remote-iterations`.

## Baseline

Quelle:

- `docs/reviews/ai/corp-ai-optimizer-paired-latest-baseline-30-game-ending-gift-gate-v1-480-actions-2026-07-05.json`
- `docs/reviews/ai/corp-ai-optimizer-paired-latest-baseline-100-game-ending-gift-gate-v1-480-actions-2026-07-05.json`

Current-vs-current 100er, 480 Actions:

- Runner-Siege: 20
- Corp-Siege: 64
- Action-Limits: 16
- Runner-Agenda-Punkte im Schnitt: 3.69
- Corp-Agenda-Punkte im Schnitt: 1.02
- Corp-Agenda-Scores: 57
- Runner-Agenda-Steals: 210
- Corp-Flatlines: 57
- Passive Aktionen bei vorhandener Scoreline: 1210
- Unsafe-Score-Entscheidungen: 3
- Spiele mit Errors: 1

Current-vs-current 30er, 480 Actions:

- Runner-Siege: 11
- Corp-Siege: 15
- Action-Limits: 4
- Runner-Agenda-Punkte im Schnitt: 4.233
- Corp-Agenda-Punkte im Schnitt: 1.633
- Corp-Agenda-Scores: 28
- Runner-Agenda-Steals: 73
- Corp-Flatlines: 12
- Passive Aktionen bei vorhandener Scoreline: 454
- Unsafe-Score-Entscheidungen: 1

## Seed-Auswahl

Primaere Scoring-/Remote-Seeds:

- `latest-match-baseline-005`: Action-Limit nach 480 Actions, Runner 0 AP / Corp 6 AP. Reproduzierbarer Scoring-Stall; fruehere Einzelkandidaten konnten den Seed lokal verbessern, haben aber den 100er nicht verbessert.
- `latest-match-baseline-022`: Action-Limit nach 480 Actions, Runner 6 AP / Corp 6 AP. Hoeherer Druck auf beide Seiten; geeignet, um zu pruefen, ob Scoring-Forcing Runner-Steals erzeugt.
- `latest-match-baseline-028`: Action-Limit nach 480 Actions, Runner 6 AP / Corp 0 AP. Negativkontrolle fuer Remote-/Central-Abwaegung unter Runner-Druck.

Beobachtungsseed:

- `latest-match-baseline-024`: Action-Limit bei 345 Actions, Runner 2 AP / Corp 4 AP, mit `ERR_INVALID_TARGET`. Dieser Seed ist fuer Error-Watch relevant, aber nicht als alleinige Scoring-Optimierungsbasis geeignet.

## Annahmen

- Die aktuelle Hauptverbesserung der Korp kommt aus Tag-/Damage-/Flatline-Spiel, nicht aus konsequentem Agenda-Scoring.
- Ziel dieses Strangs ist nicht, diese Gewinnrate gegen Scoring-Aesthetik einzutauschen.
- Ein gueltiger Kandidat muss Scoreline-Stall oder Remote-Ausbau belegbar verbessern, ohne die 30er-/100er-Resultate gegen die Korp zu verschieben.

## Verwerfungsregeln

Ein Kandidat wird nicht uebernommen, wenn eine dieser Bedingungen eintritt:

- Er verbessert nur einen Einzelseed, verschlechtert aber den 30er oder 100er current-vs-current.
- Er erhoeht Runner-Siege oder Runner-Steals im 100er ohne kompensierenden Corp-Sieg- oder Action-Limit-Gewinn.
- Er senkt Corp-Siege gegenueber der 100er-Baseline von 64.
- Er erhoeht `unsafeScoreChosen` oder `gamesWithErrors`.
- Er reduziert Flatline-Wins deutlich, ohne dass Agenda-Wins oder Action-Limit-Reduktion dies ausgleichen.
- Er implementiert eine Karten-Sonderregel statt eines generischen Entscheidungsfehlers.

## Promotionsregel

Ein Kandidat darf erst nach main, wenn:

- fokussierte Seed-Replays das adressierte Fehlmuster sichtbar verbessern,
- der 30er current-vs-current nicht schlechter wird,
- der 100er current-vs-current mindestens neutral bei Corp-Siegen ist und eine der Zielmetriken verbessert: weniger Action-Limits, mehr Corp-Agenda-Scores, weniger passive Scoreline-Aktionen oder weniger konkrete Scoring-Stalls.
