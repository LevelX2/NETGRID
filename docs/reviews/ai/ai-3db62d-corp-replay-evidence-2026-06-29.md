# AI 3DB62D Corp Replay Evidence 2026-06-29

## Match

- Match: `match_3db62d5216ecde8d`
- Speicher: `data/runtime/multiplayer/netgrid.sqlite`
- Modus: `human_runner_vs_corp_ai`
- Ende: Runner gewinnt mit 7 Punkten
- Corp-Deck: `KI Rush Score - Static ICE Mix`
- Runner-Deck: `Inside Forgery Loop`
- AI-Traces: detailliert vorhanden

## Befunde

### Score-now verliert gegen Overadvance

Bei `sv97` lag `Project Zurich` in `remote_1` mit 3 Advancement-Countern. `score_agenda` war legal, wurde aber nur als Rang 2 bewertet. Die KI wählte `advance_card`, erzeugte den vierten Counter und scorete erst bei `sv98`.

`Project Zurich` gibt nur pro zwei Counter über der Difficulty einen wiederkehrenden Credit. Ein einzelner Counter über Requirement war daher wertlos.

### Game-ending Remote wird zu sicher bewertet

Bei `sv168` installierte die Corp `Marine Arcology` in `remote_1`, obwohl der Runner bereits 5 Punkte hatte und ein Steal das Spiel beendet. Die Remote hatte drei rezzed ICE (`Wall of Static`, `Filter`, `Quandary`), der Runner hatte aber sichtbar `Krash`, `Broker`, 10 Credits und nach Broker-Aktivierung 16 Credits.

Der spätere Run brach alle drei ICE und stahl `Marine Arcology`. Der Trace meldete vorher `window_kind:durable` und `runner_can_reach_access_before_score:false`.

### Triage-Mismatch zu schwach und falsch gebunden

Die Traces zeigen kritische oder mittlere `corp_board_triage_mismatch`-Lagen, aber die normalized values von `-84` oder `-44` wurden von lokalen Scoreline-Boni überstimmt. Mehrfach war `triage_target:new_remote` gesetzt, obwohl die relevante Action `remote_1` betraf.

## Umsetzungskriterien

- Legal scorebare Agendas werden sofort gescored, sofern ein weiteres Advance keinen konkreten Schwellenwert erreicht.
- Sichtbare Hosted-Credits und sichtbare Take-Credit-Aktionen fließen in Runner-Contest-Credits ein.
- Eine Remote bleibt nicht `durable`, wenn der sichtbare Runner den vollständigen Pfad bezahlen kann.
- Kritische Triage-Mismatches unterdrücken widersprüchliche Aktionen ausreichend stark.
- Bestehende LegalAction- und Hidden-Info-Grenzen bleiben unverändert.
