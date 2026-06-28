# AI Corp Remote Refinements Evidence 2026-06-28

## Analysiertes Match

- Match: `match_9bede45b44104402`
- SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Modus: `human_runner_vs_corp_ai`
- Ende: 2026-06-28 15:38:34 UTC
- Ergebnis: Runner gewinnt durch Agenda-Punkte
- Endstand: Runner 7 Agenda-Punkte, Korp 0 Agenda-Punkte
- Replayumfang: 84 Events, 84 State-Snapshots, 33 AI-Decision-Traces
- Decks: Runner `Skivviss Mill Pressure`, Korp `Proteus Korp - Variable ICE Gauntlet`

## Kontext zur letzten Umsetzung

Die Scoring-Window-Follow-up-Commits waren im analysierten abgeschlossenen Match noch nicht aktiv. Der lokale Merge `925e4db1` erfolgte am 2026-06-28 18:06:34 CEST; das Match endete am 2026-06-28 17:38:34 CEST. Diese Evidence ist daher als zusätzliche Vorher-Evidence und als Feinjustierung für die bereits gemergte Logik zu behandeln.

## Fehlergruppe 1: Remote-/Central-Run-Memory bleibt auf 0

Beobachtung:

- Ab Decision 13 steigen `runnerAggressionMemory.runEvents`, aber `remoteRuns` und `centralRuns` bleiben in den Corp-Traces bei 0.
- In Decisions 24 bis 32 liegen wiederholte Remote-Runs und Remote-Agenda-Steals sichtbar vor, trotzdem bleibt `remoteContestProbability: 0` und `remotePressure: 0.07`.

Beispiele:

- Decision 24, SV55: `runEvents: 5`, `remoteRuns: 0`, `centralRuns: 0`, obwohl zuvor `Project Venice` aus Remote 1 gestohlen wurde.
- Decision 29, SV70: `runEvents: 7`, `remoteRuns: 0`, `centralRuns: 0`, obwohl Remote 1 mehrfach erfolgreich contestet wurde.

Erwartung:

- Side-safe öffentliche Run-Events müssen nach Serverfamilie klassifiziert werden.
- Wiederholte sichtbare Remote-Runs und Remote-Steals müssen Corp-Remote-Pressure erhöhen.
- Diese Memory darf nur sichtbare PublicEvents und keine verdeckten Runner-Zonen nutzen.

## Fehlergruppe 2: Dog Pile als Solo-Remote-Schutz überschätzt

Beobachtung:

- `Dog Pile` lag als einziges ICE vor Remote 1.
- Als einzelnes Remote-ICE hatte es Stärke 0 und verursachte 0 Net Damage, weil keine weitere rezzed ICE in diesem Fort außerhalb von Dog Pile lag.
- Der Runner hatte sichtbar `Evil Twin` installiert und konnte die ETR-Subroutine wiederholt für 3 Credits brechen.

Beispiele:

- Event 48 bis 53: Runner läuft Remote 1, bricht Dog-Pile-ETR mit `Evil Twin`, accessed und stiehlt `Project Venice`.
- Event 63 bis 68: gleiches Muster gegen `Please Don't Choke Anyone`.
- Event 78 bis 83: gleiches Muster gegen `Project Venice`, Spielende.

Erwartung:

- Position-/outer-ICE-scaling darf ohne tatsächlich wirksame zusätzliche rezzed ICE keine durable-Wertung erzeugen.
- Ein Solo-Schutz mit sichtbarer passender Coverage und bezahlbarer Break-Linie muss Scoreline-Install/Advance deutlich abwerten.

## Fehlergruppe 3: 4-Advancement-Agenda-Horizon falsch eingeschätzt

Beobachtung:

- Die Korp installierte und advancete 4/2-Agendas in Remote 1 mit nur einem oder zwei Advances.
- Vor dem Score entstand jeweils zwingend ein Runner-Zug.
- Die gewählte Linie wurde durch `corp_install_score_line`, `corp_advance_score_line` und `corp_advance_remote_context` deutlich bevorzugt, obwohl Remote 1 contestable war.

Beispiele:

- Decision 15, SV30: `Project Venice` wird in Remote 1 installiert.
- Decision 16, SV31: `Project Venice` wird advanced; Remote-ICE-Härtung liegt als Alternative auf Rang 2/3.
- Decision 25, SV56: `Please Don't Choke Anyone` wird in dieselbe Remote installiert.
- Decision 26, SV57: Agenda wird advanced; Remote-ICE-Härtung liegt wieder hinter Advance.
- Decision 30/31, SV71/SV72: `Project Venice` wird erneut installiert und advanced, bei Runner bereits 5 Agenda-Punkten.

Erwartung:

- Nicht-immediate Scorelines müssen die Runner-Exposure-Window zwischen Korp-Zug und Score bewerten.
- Bei sichtbarer Runner-Coverage und wiederholtem Remote-Erfolg muss Remote-Härtung, Funding oder kein Agenda-Commit vor Install/Advance liegen.

## Fehlergruppe 4: Proteus-ICE-Hints sind zu zentralserverlastig

Beobachtung:

- Alle 19 ICE im Korp-Deck haben in `ai-card-hints-active.json` nur `protect_hq` und `protect_rnd` als `planRoles`.
- Keine dieser ICE hat `protect_remote`, obwohl viele klare ETR-ICE sind und fachlich Remote-Scorelines schützen können.

Betroffene Beispiele:

- `Datacomb`, `Credit Blocks`, `Galatea`, `Gatekeeper`, `Sandstorm`, `Sphinx 2006`, `Toughonium(TM) Wall`, `Walking Wall`, `Dog Pile`, `Bug Zapper`, `Riddler`.

Erwartung:

- Hints sollen Remote-Schutzfähigkeit explizit ausdrücken.
- Scaling- oder bedingte ICE brauchen zusätzliche Risikosignale, damit sie nicht als generisch durable Remote-Schutz missverstanden werden.

## Fehlergruppe 5: Deferred-/Free-Rez-Operationen als Remote-Support zu schwach

Beobachtung:

- `Rent-to-Own Contract` war mehrfach als LegalAction für `Datacomb` und `Dog Pile` verfügbar, wurde aber nur mit sehr niedriger Priorität (`87`, später teils negativ) bewertet.
- Gleichzeitig hatte die Korp mehrfach Rez-Floor-Probleme und versuchte Scorelines mit zu wenig Credits.

Erwartung:

- Deferred-/free-Rez-Actions sollen dann Bonus bekommen, wenn sie eine konkrete Scoring-Remote-Schwäche beheben oder eine relevante ICE sofort wirksam machen.
- Kein pauschaler Operation-Bonus ohne Zielserver- und ICE-Wirksamkeit.

## Nicht-Ziele aus diesem Match

- Engine-Verhalten von `Dog Pile` ändern: Die Replay-Daten passen zum CardImplementation-Vertrag.
- Hidden Runner-Hand/Stack für Breaker-Coverage verwenden.
- Generisches Remote-ICE-Spam-Verhalten erzeugen.
