# Corp Purge/R&D Triage Evidence 2026-06-30

Analysiertes Match: `match_531f83839a16d260`

Lokaler Speicher: `data/runtime/multiplayer/netgrid.sqlite`

Ergebnis: Runner-Sieg durch Agenda-Punkte. Die Korp scorete keine Agenda; der Runner stahl alle vier Agendas aus R&D.

## Replay-Befunde

- R&D blieb über die Partie offen beziehungsweise unzureichend geschützt, obwohl der Runner wiederholt R&D lief und Agendas aus R&D stahl.
- Die Korp wählte 11-mal `purge_runner_virus_counters` und erzeugte dadurch 33 `forgo_action`-Folgeaktionen.
- Kritische Triage-Werte waren im späteren Replay sichtbar, aber `purge_runner_virus_counters` blieb neutral und konnte deshalb gegen Schutz-/Funding-Aktionen gewinnen.
- Remote 1 wurde mit dynamischer ICE (`Bug Zapper`, `Mastermind`) vorbereitet, aber nicht als belastbare Scoring-Basis genutzt.
- Dynamische/positionsabhängige ICE darf nur dann als belastbarer Schutz zählen, wenn ihre Außen-/Rez-/Budgetbedingungen real erfüllt sind.

## Abgeleitete Verträge

- Purge ist bei kritischem `protect_rd`, `protect_hq`, `protect_score_remote`, `fund_score_remote`, `force_scoreline_clock` oder `score_now` kein neutraler Füllzug.
- Kritischer R&D-Druck aus wiederholten Zugriffen und sichtbaren R&D-Virus-/Counter-Payoffs darf Remote-Schutz vorübergehend überstimmen.
- Nicht-kritischer Central-Druck bleibt hinter konkretem Remote-Schutz, damit Scorefenster nicht pauschal blockiert werden.
- Statische ICE, die eine dynamisch schwache Remote konkret verbessert, darf als Score-Remote-Ausbau zählen; reine dynamische ICE-Pakete bleiben nicht durable.

## Grenzen

- Keine Engine-, LegalAction-, `applyAction`-, Replay-, StateHash-, PlayerView- oder Hidden-Info-Änderung.
- Keine Kartennamen-Sonderregel in der Aktionsauswahl.
- Keine Semantikdaten-/Taktiksignal-Großmigration.
