# AI A7D1 Replay Analysis 2026-06-27

## Status

`in_progress`

## Match

- Match-ID: `match_a7d1feae5a06829c`
- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Modus: `human_runner_vs_corp_ai`
- Ergebnis: Runner-Sieg, StateVersion 109.
- Umfang: 110 Public Events, 110 Engine Events, 110 State Snapshots, 39 AI Decision Traces.

## Aktivitätsbefund

Die letzten Corp-Replay-Fixes waren im Match aktiv. Belege in den AI-Traces:

- `corp_central_rez_floor_credit_reserve`: 18 Treffer.
- `corp_central_rez_floor_penalty`: 18 Treffer.
- `scoreline_install_next_advance_reserve:1`: 8 Treffer.
- `remote_rez_floor_required_after_action`: 9 Treffer.
- `corp_effective_defense_post_rez_budget`: in den Rez-Entscheidungen SV10 und SV48.

Der Fehler ist daher kein alter Runtime-Stand, sondern eine unvollständige Wirkung der neuen Heuristiken.

## Freigegebene Fehlerpunkte

### Punkt 1: Variable-X-Rez ohne Wirkung

- Beispiel: SV48, `Digiconda mit X=0 rezzen`.
- Sichtbare Folge: Corp zahlt 6 Credits, effektive Stärke bleibt 0, der Runner erreicht Remote 1 und stiehlt `Marked Accounts`.
- Debug-Befund: `corp_effective_defense_post_rez_budget` ist aktiv, meldet aber `effective_defense_zero_effect:false`.
- Erwartung: Variable-X-Rez mit `X=0` und ohne sichtbare Stop-/Tax-/Damage-Wirkung darf nicht als wirksame Verteidigung gelten.

### Punkt 2: Contestable Remote-Scorelines bleiben zu attraktiv

- Beispiel SV42: Scoreline-Root in Remote 1 trotz `corp_remote_rez_floor_penalty:-2400`, `remote_rez_floor_required_after_action:7`, `credits_after_action:6` und `scoreline_install_next_advance_reserve:1`.
- Beispiel SV77 bis SV79: Agenda-Install, einmaliges Advance, danach Funding; Runner stiehlt die Agenda im nächsten Run.
- Beispiel SV94 bis SV96: Agenda-Install und zweimaliges Advance statt ausreichend geschützter oder sofort schließbarer Linie; Runner stiehlt die Agenda zum Spielende.
- Debug-Befund: Scoreline-/Plan-Mapping überstimmt in mehreren Fenstern die sichtbaren Risikoindikatoren.
- Erwartung: Nicht sofort schließbare Remote-Scorelines müssen bei sichtbarer Contestability oder unzureichendem Rez-Floor stärker gegen Economy/Schutz abgewogen werden.

## Nicht freigabereif aus diesem Spiel

- Tagged-Payoff: Der Runner hatte nur kurz einen sichtbaren Tag und entfernte ihn vor dem nächsten relevanten Corp-Fenster.
- Score-Closeout-Kandidat: Kein klarer legaler Closeout-Kandidat in den relevanten Traces.
