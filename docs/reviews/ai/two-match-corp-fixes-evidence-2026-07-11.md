# Two-Match Corp AI Fix Evidence

Status: Umsetzungs-Evidence

SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`

## Analysierte Spiele

### match_3a9aeae8628e4f0a

- Modus: Human Runner gegen Corp-KI, Schwierigkeitsgrad Hard.
- Corp-Deck: `V1.9.22 Reclamation Grid`.
- Ergebnis: Runner gewinnt durch Agenda-Punkte.
- 243 Events, 243 Snapshots und 97 ausführliche Corp-Decision-Traces.
- 16 explizite Basis-Credit-Aktionen.
- `Corporate Negotiating Center` und `ESA Contract` wurden installiert, aber
  trotz Nullkosten-Rez nicht aktiviert und nicht verwertet.
- `Security Purge` wurde in einem erreichbaren Remote ausgesetzt und sofort
  gestohlen.
- `Political Overthrow` wurde bei vier Runner-Punkten mit neun benötigten
  Advancements in ein erreichbares Remote installiert und beendete das Spiel
  durch den anschließenden Steal.

### match_8d959dc447958cef

- Modus: Human Runner gegen Corp-KI, Schwierigkeitsgrad Hard.
- Corp-Deck: `Syds ICE-Pfandhaus`.
- Ergebnis: Runner gewinnt durch Agenda-Punkte.
- 247 Events, 247 Snapshots und 99 ausführliche Corp-Decision-Traces.
- 15 explizite Basis-Credit-Aktionen und zwei Purges; keine Agenda gescort.
- Remote 1 bestand aus drei nicht stoppenden ICE und blieb für den Runner
  erreichbar, während Agendas im HQ gehalten wurden.
- Der Scoreplan erkannte `weak_remote_protection` und
  `insufficient_etr_ice`, erzeugte aber keine abschließbare Reparaturroute.
- Der zweite Purge verbrauchte drei Aktionen für einen einzelnen Counter, obwohl
  der Scoringweg ungelöst war.

## Präzisierter ICE-Befund

Der bestehende `corp-ice-placement`-Evaluator hat die späten sichtbaren Optionen
plausibel bewertet:

- `Puzzle` vor Remote 1: ETR vorhanden, aber vom sichtbaren Runner-Breaker
  vollständig abgedeckt; `zero_effect_risk:true` und `hold_for_later`.
- `Colonel Failure` vor Remote 1: wirksamer Stop, aber Rez-Kosten 17 bei neun
  Credits; `prefer_economy`.

Der Fehler liegt in der Planintegration. `protect_remote` nimmt derzeit jede
legale ICE-Installation am Zielserver als Action-Kandidat auf. Dadurch kann der
Plan formal `progressing` sein, obwohl der Placement-Evaluator keinen wirksamen
und finanzierbaren Schutz bestätigt. Fehlt eine brauchbare Handoption, existiert
kein gezielter Beschaffungsweg.

## Freigegebene Fehlergruppen

1. Placement-Urteil ist für `protect_remote` nicht verbindlich.
2. Scoreplan erlaubt unsichere und spielentscheidende Agenda-Exposition.
3. Installierte persistente Economy-Assets werden nicht aktiviert.
4. Purge berücksichtigt taktischen Nutzen und Opportunitätskosten unzureichend.

## Nicht als Fehler freigegeben

- Der erste Purge mit zwei Countern kann kontextuell vertretbar sein.
- `Reclamation Project` und die Entscheidung um `Dr. Dreff` sind aus den Traces
  nicht eindeutig falsch.
- Basis-Credit-Aktionen werden nicht pauschal als Fehler klassifiziert.

