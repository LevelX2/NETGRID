# Corp Replay Evaluation Fixes Evidence 2026-07-03

Quelle: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`, read-only analysiert.

Match: `match_40a0a49ece59e6e9`

- Modus: `human_runner_vs_corp_ai`
- Seed: `match-mr1wrtfx-yshl73`
- Corp-Deck: `Chrome Rush Bureau`
- Runner-Deck: `Classic Runner - Cybernetics Risk Rig`
- Ende: Runner gewinnt bei StateVersion 114 durch Agenda-Punkte
- Umfang: 115 Events, 115 State-Snapshots, 44 AI-Decision-Traces

## Fehlergruppe 1: Wall-Breaker-Coverage fehlt in Corp-Fenstern

Bei StateVersion 33/34 und 50/51 liegt `Early Worm` sichtbar installiert beim Runner. Die Corp bewertet `Crystal Wall` vor Remote 1 trotzdem als nicht passierbar:

- `remote_access:no_access_reason:missing_breaker_coverage`
- `missing_visible_installed_coverage:true`
- `visible_runner_icebreaker_count:1`

Folge:

- StateVersion 34: Corp advanced `Project Babylon` in Remote 1.
- StateVersion 44/45: Runner bricht `Crystal Wall` mit `Early Worm` und stiehlt `Project Babylon`.
- StateVersion 51: Corp advanced `Tycho Extension` in Remote 1.
- StateVersion 60/61/62: Runner bricht denselben Pfad und stiehlt `Tycho Extension`.

Bewertung: `Early Worm` hat sichtbare Wall-Coverage (`Break wall subroutine`, `+3 strength`). Die Corp-Scoring-Window- und Remote-Access-Bewertung konsumiert diese Coverage nicht zuverlässig.

## Fehlergruppe 2: Scoring-Window unterschätzt Runner-Exposure

Die Scoring-Window-Evidence enthält zwar `runner_exposure_credit_actions:3`, bleibt aber bei `runner_can_reach_access_before_score:false`, weil die Wall-Coverage fehlt. Dadurch erscheinen Next-Turn-Scorelines als haltbar, obwohl der Runner vor dem Corp-Score ein volles Zugfenster und sichtbare Breaker-Coverage hatte.

Relevante Traces:

- StateVersion 34: `advance_card` auf `Project Babylon`
- StateVersion 51: `advance_card` auf `Tycho Extension`

Bewertung: Der Fehler ist nicht "jede Next-Turn-Scoreline ist schlecht", sondern "sichtbare Coverage plus vorigem Runner-Zug muss als realistische Contestability zählen".

## Fehlergruppe 3: ICE-Install und Rez bewerten denselben Schutz widersprüchlich

StateVersion 65:

- Corp installiert `Wall of Static` vor R&D.
- Triage: `protect_rd`, severity `critical`
- ICE-Placement: `recommendation:install_now`, `rez_affordable:true`

StateVersion 68/70 im folgenden R&D-Run:

- Corp declined `Wall of Static` und später `Data Wall`.
- Rez-Defense bewertet beide als `effective_defense_zero_effect:true`.
- `visible_breaker_coverage:true`, `zero_effect_risk:true`

Folge:

- StateVersion 73/74: Runner access auf R&D und stiehlt `Project Babylon`.

Bewertung: ICE-Placement darf ICE nicht als kritischen Schutz pushen, wenn dieselbe sichtbare Lage beim Rez als wirkungslos gilt.

## Fehlergruppe 4: `end_turn` gewinnt bei freien Klicks

StateVersion 66:

- Corp hat 2 Klicks und 3 Credits.
- `end_turn` gewinnt mit `-1365`.
- `gain_credit` verliert mit `-1366`.
- Ursache in Evidence: `protect_rd`-Triage behandelt `gain_credit` als Mismatch, `end_turn` aber nur als neutralen Kontext.

StateVersion 105:

- Corp hat 1 Klick und 3 Credits.
- `end_turn` gewinnt erneut knapp gegen `gain_credit`.

Bewertung: Wenn keine konkrete sinnvolle Schutzaktion legal oder positiv bewertet ist, darf Triage nicht das Zugende als besten Fallback übriglassen.

## Fehlergruppe 5: Scoreline-Support in contestable Remote

StateVersion 15/16:

- Corp installiert `Chicago Branch` in Remote 1.
- `Chicago Branch` ist Advancement-Support, kein Schutz.
- Runner trashte die Karte nach Remote-Run bei StateVersion 26/27.

Bewertung: Scoreline-Support-Assets brauchen dieselbe Remote-Safety-Prüfung wie Agenda-Install/Advance, außer ein unmittelbarer Payoff ist belegbar.

## Akzeptanzkriterien

- Sichtbarer `Early Worm` adressiert Wall-ICE in Corp-Scoring-Window und Effective-Defense-Konsumenten.
- Scoreline-Aktionen verlieren gegen Schutz/Funding, wenn der Runner mit sichtbarer Coverage und Exposure-Fenster realistisch accessen kann.
- ICE-Placement und Rez-Defense nutzen konsistente Zero-Effect-/Breakcoverage-Evidence.
- `end_turn` mit freien Corp-Klicks verliert gegen Economy/Draw-Fallback, wenn keine bessere Zielaktion legal/sinnvoll ist.
- Advancement-Support-Assets werden in contestable Remotes nicht als Scoreline-Fortschritt bevorzugt.
