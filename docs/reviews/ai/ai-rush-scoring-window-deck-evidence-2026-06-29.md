# AI Rush Scoring Window und Deck Evidence 2026-06-29

## Analysiertes Spiel

- Match: `match_41020769c9f35150`
- Modus: `human_runner_vs_corp_ai`
- Ende: Runner gewinnt 7:0
- Corp-Deck: `KI Rush Score - Static ICE Mix`
- Runner-Deck: `Inside Forgery Loop`
- SQLite-Evidence: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Trace-Umfang: 102 AI-Decision-Traces, 229 Events, End-StateVersion 228

## Fehlergruppen

### 1. Delayed Scoreline wird zu optimistisch bewertet

Beispiele:

- StateVersion 53: `Hostile Takeover` wird in Remote 1 installiert, aber nicht vor dem Runner-Zug geschlossen. Der Runner stiehlt sie nach `Inside Job`.
- StateVersion 64 bis 66: zweite `Hostile Takeover` wird installiert und auf zwei Counter gebracht, bleibt aber über den Runner-Zug exponiert und wird gestohlen.

Bessere generische Behandlung:

- Eine Agenda-Install-/Advance-Linie ist nur dann wirklich positiv, wenn der Score vor der nächsten Runner-Zugriffschance geschlossen werden kann oder die Remote gegen sichtbare Runner-Credits, installierte Coverage und Aktionslage ausreichend verteuert ist.

### 2. Single-ICE-Temporary-Safe ist zu weich

Beispiel:

- Remote 1 mit einem `Banpei` wurde als ausreichend angesehen, obwohl der Runner reich war und eine volle Zugriffschance bekam.

Bessere generische Behandlung:

- Ein einzelnes ICE ohne sichtbare installierte Runner-Coverage darf weiterhin ein Fenster erzeugen, aber nur mit Abschlag, wenn die Agenda nicht immediate scorebar ist und der Runner genügend sichtbare Credits/Aktionen für Aufbau oder Contest hat.

### 3. Archives wird nach initialem Schutz überpriorisiert

Beispiele:

- Nach einer nachvollziehbaren Anfangsphase wurde Archives bis auf sieben ICE ausgebaut.
- Spätere Entscheidungen kippten knapp zu Archives-ICE, obwohl HQ Agenda-Druck hatte und R&D am Ende spielentscheidend offen wurde.

Bessere generische Behandlung:

- Archives-ICE bleibt wertvoll bei sichtbarer Agenda in Archives oder aktueller Archives-Run-Geschichte, wird aber nach ausreichendem Schutz gedeckelt. HQ/R&D-Schutz muss bei Agenda-Druck, sichtbarer Runner-Coverage, Multiaccess oder erfolgreichen Central-Runs höher priorisiert werden.

### 4. Das Deck passte nicht sauber zur Runtime

Beobachtung:

- Das Deck enthielt zu viele Agendas, die über Runner-Züge exponiert wurden, und stützte sich auf Advancement-Operationen, deren Nutzung die KI nicht zuverlässig in eine LegalAction-Closeout-Sequenz übersetzte.

Aktueller Engine-Stand:

- `Project Consultants` ist auf aktuellem `main` als CardImplementation mit einer öffentlichen Choice für vier Advancement-Counter registriert und durch Engine-Tests abgesichert.

Bessere generische Behandlung:

- Neues Deck stärker auf bezahlbare statische ETR-ICE, frühe Economy/Draw und robuste in-turn Advancement-Bursts ausrichten; riskantere 3-Advance-/2-Punkt-Agendas reduzieren.

## Umsetzungsgrenzen

- Keine Annahmen über Runner-Hand oder verdeckte Runner-Ressourcen.
- Keine Kartennamen-Sonderregel für die konkrete Match-Sequenz.
- Kein neuer Planner neben der bestehenden Semantic Runtime.

