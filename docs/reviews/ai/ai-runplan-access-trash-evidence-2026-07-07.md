# AI RunPlan Access Trash Evidence 2026-07-07

## Match

- Match: `match_13f99872809e6a66`
- Status bei Analyse: `active`
- Modus: `human_corp_vs_runner_ai`
- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Zugriff: read-only ueber `node:sqlite`

## Beobachteter Fehler

Der Runner griff HQ an, griff auf `Setup!` zu, erlitt den Access-Ambush-Schaden und liess die Karte beim ersten Zugriff liegen. Im naechsten Zug griff der Runner erneut HQ an, griff auf dieselbe `Setup!` zu und trashte sie dann.

Relevante Events:

- `evt_15`, State `14 -> 15`: Runner startet Run auf HQ.
- `evt_16`, State `15 -> 16`: Runner greift auf `Setup!` in HQ zu; Ambush verursacht 2 Net Damage.
- `evt_17`, State `16 -> 17`: Runner waehlt `decline_trash`.
- `evt_24`, State `23 -> 24`: Runner startet erneut Run auf HQ.
- `evt_25`, State `24 -> 25`: Runner greift erneut auf `Setup!` zu; Ambush verursacht 2 Net Damage.
- `evt_26`, State `25 -> 26`: Runner waehlt `trash_accessed_card`.

## Decision-Evidence

Beim ersten Zugriff war `trash_accessed_card` legal und kostenlos. Die semantische Bewertung erkannte die Karte als relevanten Ambush:

- `trash_accessed_card`: Score `-575`
- `decline_trash`: Score `-1745`
- Strafkomponente fuer Nicht-Trash: `runner_decline_relevant_trash`, Grund `ambush`

Die Auswahl fiel trotzdem auf `decline_trash`, weil der RunnerRunPlan die Access-Entscheidung mit `trashPolicy:decline_low_value` vor der Score-Sortierung erzwang.

## Fehlergruppen

### Punkt 1: `decline_low_value` ist zu hart

- Beschreibung Spielfehler: State `16`, Decision `ai_trace_match_13f99872809e6a66_10`, bessere Alternative `trash_accessed_card`.
- Geplante Anpassungsmassnahme: `decline_low_value` nur als Niedrigwert-Voreinstellung behandeln und semantisch bessere Trash-Entscheidungen nicht blockieren.

### Punkt 2: Generischer Central-Run startet mit falscher Trash-Voreinstellung

- Beschreibung Spielfehler: HQ-Run ohne konkretes bekanntes Trash-Ziel erhielt eine Policy, die spaeter sichtbare relevante Trash-Ziele ablehnen konnte.
- Geplante Anpassungsmassnahme: Bei unbekanntem oder generischem Access-Ziel `trash_if_value_positive` statt pauschal `decline_low_value` verwenden.

### Punkt 3: Invalidierte RunPlans koennen Access weiter steuern

- Beschreibung Spielfehler: In lokaler Reproduktion konnte ein `invalid` RunPlan weiter `decline_trash` erzwingen.
- Geplante Anpassungsmassnahme: Bei invalidiertem RunPlan in Access-Trash/Steal-Fenstern auf die aktuelle semantische Sortierung zurueckfallen und dies in Evidence markieren.

### Punkt 4: Debug-Ausgabe verdeckt den Override

- Beschreibung Spielfehler: Die Trace-Erklaerung zeigte RunPlan-Auswahl, aber die Alternativenbegruendung behauptete sinngemaess, Trash sei schlechter, obwohl `rankedAlternatives` Trash vorne sah.
- Geplante Anpassungsmassnahme: Access-Policy-Evidence und Invalid-Fallback im gewaehlten Choice sichtbar machen; optional bleibt eine spaetere WhyNot-Spezialisierung fuer forced choices.
