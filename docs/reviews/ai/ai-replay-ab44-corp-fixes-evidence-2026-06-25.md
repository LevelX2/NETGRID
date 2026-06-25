# AI Replay AB44 Corp Fixes Evidence 2026-06-25

Status: evidence_recorded

## Analysiertes Spiel

- Match-ID: `match_ab44ac886c5dbf49`
- Speicherort: `data/runtime/multiplayer/netgrid.sqlite`
- Auswahlregel: letztes abgeschlossenes Match nach `matches.updated_at DESC`
- Modus: `human_runner_vs_corp_ai`
- KI-Seite: Corp
- Ergebnis: Runner gewann durch Agenda-Punkte
- Umfang: 512 Events, 512 Snapshots, 213 AI-Decision-Traces
- Finale Ursache: Drei gestohlene `Corporate War` im Runner-ScoreArea

Die Analyse nutzte SQLite nur lesend. Relevant waren insbesondere die Tabellen `matches`, `events`, `game_states`, `state_snapshots` und `ai_decision_traces`. Entscheidungsbewertungen wurden nur aus side-safe sichtbaren `PlayerView`-, `LegalActions`-, PublicEvent- und redigierten AI-Trace-Daten abgeleitet.

## Zugriffsmuster

Für spätere Replays kann der aktuelle lokale Speicher so geprüft werden:

```text
data/runtime/multiplayer/netgrid.sqlite
```

Relevante Match-Auswahl:

```sql
select match_id, status, mode, state_version, created_at, updated_at
from matches
where status = 'finished'
order by updated_at desc
limit 10;
```

AI-Trace- und Event-Umfang:

```sql
select count(*) from events where match_id = ?;
select count(*) from state_snapshots where match_id = ?;
select count(*) from ai_decision_traces where match_id = ?;
```

## Freigegebene Fehlergruppen

### 1. Zentrale HQ-Sicherheit wurde überschätzt

Replay-Evidence:

- D9/sv15: Corp installierte `Vacuum Link` vor HQ, hatte danach nur geringe Credits.
- D19/sv35: Beim HQ-Run war nur `decline_rez` sichtbar beziehungsweise keine `rez_ice`-Alternative für das äußere HQ-ICE legal.
- Runner passierte das unrezzte äußere HQ-ICE, brach `Banpei` mit `Loony Goon` und stahl `Corporate War` aus HQ.

Bewertung:

Die einzelne `decline_rez`-Entscheidung war nicht der eigentliche Fehler, weil kein besserer LegalAction-Pfad sichtbar war. Der vorgelagerte Fehler war, ein zentrales ICE als Schutz zu behandeln, obwohl die Corp es im relevanten Fenster nicht rezzen konnte und eine Agenda im HQ lag.

Geplante Anpassung:

Eine side-safe zentrale Rez-Reserve und Agenda-Exposure-Strafe. Zentrale Schutz-ICE sollen bei Agenda im HQ/R&D und steigendem Zentraldruck nur dann hoch zählen, wenn Credits nach der Aktion die realistische Rez-Kante halten.

### 2. Unsichere Score-Windows in contestable Remote

Replay-Evidence:

- D75/sv165: Corp installierte `Corporate War` in Remote 1 hinter nur einer rezzten `Wall of Static`.
- D76/sv166: Corp advancete nur einmal und konnte die Agenda nicht in derselben Runde scoren.
- Runner nahm Credits, lief Remote 1, brach `Wall of Static` und stahl `Corporate War`.
- D210-D212/sv499-sv501: Dasselbe Muster im Endspiel; Runner hatte hohen Remote-Druck, sichtbare Breaker und genug Credits. Die Agenda blieb nach Corp-Ende nur teiladvanced und wurde sofort gestohlen.

Bewertung:

Die KI behandelte “Remote hat ICE” als ausreichend geschützt. Das war bei sichtbarer Runner-Rig-/Creditlage falsch. Score-Windows müssen die Überlebensfähigkeit bis zum nächsten Runner-Zug berücksichtigen.

Geplante Anpassung:

Ein generischer contestable-Remote-Score-Guard für `install_card` und `advance_card`: sichtbare Breaker, Runner-Credits, rezzte ICE, Remote-Druck und Scorebarkeit werden berücksichtigt. Nicht scorebare Agenden hinter sichtbar contestable Remote werden hart oder stark negativ bewertet.

### 3. Remote-Root-Assets wurden trotz Runner-Zugriff zu positiv bewertet

Replay-Evidence:

- D45/D46 sv92/93: Corp installierte und rezzte `City Surveillance` in Remote 1.
- Der Runner konnte Remote 1 später contesten und trashte das Asset.
- D79/D80 sv179/180: Corp wiederholte denselben Aufbau trotz sichtbarer Remote-Pressure.

Bewertung:

Die bestehende Strafe für ungeschützte neue Remotes reicht nicht. Eine Remote kann formal ICE haben und trotzdem praktisch contestable sein.

Geplante Anpassung:

Remote-Root-Asset-Risiko wird nicht nur nach `ice.length`, sondern nach sichtbarer Contestability bewertet. Persistent Tag-Assets/Root-Assets in brechbaren Remotes erhalten eine Strafkomponente.

### 4. Tag-Payoffs wurden nach erfolgreichem Tag nicht genutzt

Replay-Evidence:

- D118/D119 sv260/261: Nach erfolgreichem `Chance Observation`-Tag waren `Closed Accounts`, `Power Grid Overload` und `Broker trashen` legal. Die Corp wählte stattdessen `gain_credit`.
- D141/D142 sv326/327: Nach einem weiteren Tag waren erneut `Closed Accounts`, `Power Grid Overload` und `Broker trashen` legal. Die Corp wählte BBS-Economy.
- Runner nutzte anschließend `Broker` und entfernte den Tag.

Bewertung:

Der aktuelle Endgame-/Damage-Punish-Fokus greift für Nicht-Damage-Payoffs zu eng. Bei einem sichtbaren Tag muss der sofortige Payoff gegen Runner-Credits, Hardware oder Ressourcen vor normaler Economy liegen.

Geplante Anpassung:

Eine generische Tagged-Runner-Payoff-Komponente für `economic`, `hardware_trash`, `resource_trash` und hochwertige `trash_resource`-Ziele. Diese Komponente soll Basiscredit/BBS überstimmen, solange ein legaler Payoff sichtbar ist.

### 5. Tag-Source-Folgeplan fehlte

Replay-Evidence:

- D116/sv257 und D139/sv323: Die KI erzeugte Tags über Trace-/Tag-Quellen.
- In den anschließenden Decisions wurden die Folge-Payoffs nicht als Planfortschritt behandelt; Debug-Hinweise wie fehlende eigene Zukunftsmodellierung traten weiter auf.

Bewertung:

Die Tag-Quelle wurde als Einzelaktion bewertet, aber nicht ausreichend als Sequenz “Tag erzeugen -> Payoff nutzen” fortgeführt.

Geplante Anpassung:

Tag-Quellen mit sichtbaren Payoffs erzeugen eine kurzfristige taktische Payoff-Spur. Solange der Runner sichtbar getaggt ist, erhalten passende Payoff-Aktionen zusätzliche Evidence und Priorität.

## Nicht freigabereif aus diesem Spiel

- `Schlaghund` trat in den LegalActions des analysierten Spiels nicht als konkrete Alternative auf.
- `Scorched Earth` trat ebenfalls nicht als LegalAction auf.
- `score_agenda` war in den kritischen Remote-Fenstern nicht legal; der Fehler war das Starten unsicherer Score-Windows, nicht das Nicht-Punkten einer legal scorebaren Agenda.
- Frühe `Chance Observation`-Spuren ohne `corp_tag_source_visible_payoff_pressure` sind aus diesem langen Replay nicht als neuer aktueller Defekt freigabereif, weil spätere Traces denselben Bonus zeigen.

## Akzeptanzkriterien

- Remote-Scoreline-Tests zeigen, dass eine einzelne sichtbare, brechbare Remote-ICE nicht automatisch als sicher zählt.
- Zentrale ICE-Install-Tests zeigen, dass unrezzbare HQ/R&D-Schutz-ICE bei Agenda-Exposure nicht über Economy/Reserve priorisiert werden.
- Tagged-Runner-Tests zeigen, dass `Closed Accounts`, Hardware-Trash und hochwertiger Resource-Trash gegen sichtbare Tags vor Basiscredit/BBS liegen.
- Debug-Evidence enthält neue Gründe, aber keine Hidden-Info-Felder.
