# AI-Boon-Run-Stärke: Reparaturprozess

Status: in Umsetzung

## Quelle und Fehlerbild

Das gespeicherte Match `match_95a8416194bb9ac4` blockiert in
`run.encounter_ice` an einem gerezzten `Credit Blocks`. Der Runner hat mit
`AI Boon` beim Runstart eine 5 gewürfelt. Die Engine bietet unmittelbar eine
Break-Aktion an, obwohl AI Boon ohne Grundstärke bei diesem Wurf zunächst nur
Stärke 5 gegen ICE-Stärke 6 hat. `applyAction` lehnt die angebotene Aktion
anschließend ab; der Server reduziert die Ablehnung auf `ai_no_action`.

Das Start-Run-Event enthält den Würfelwurf bereits als `v1921DieRoll` und
`amounts.randomRoll`, die Spielchronik zeigt ihn jedoch nicht an.

## Gesamtziel

AI Boons W6-Ergebnis ist die Grundstärke des Icebreakers für den laufenden
Run. LegalActions, PlayerView und `applyAction` verwenden denselben Wert. Der
Würfelwurf und die daraus entstandene Grundstärke werden öffentlich in der
Spielchronik ausgegeben. Serverdiagnostik bewahrt den sicheren Enginefehler,
falls eine KI-Aktion trotz LegalAction-Vertrag abgelehnt wird.

## Nicht-Ziele

- Keine direkte Änderung oder Reparatur der lokalen SQLite-Datei.
- Keine Recovery-Brücke für den alten fehlerhaften Runzustand; das aktuelle
  Spiel wird durch Zugrücknahme vor den Run zurückgesetzt.
- Keine Karten-Sonderlogik in der KI.
- Keine Erweiterung des Kartenpools.
- Kein Push und kein Pull Request.

## Invarianten

- Die Rules Engine bleibt einzige Regelautorität.
- Eine von `getLegalActions` angebotene unveränderte Aktion muss durch
  `applyAction` ausführbar sein.
- AI Boons Run-Grundstärke liegt ausschließlich im W6-Bereich 1 bis 6.
- Pump-Modifikatoren werden zusätzlich auf die Run-Grundstärke angewendet.
- Würfelwurf und sichtbare Run-Grundstärke sind öffentliche Informationen.
- Keine verdeckten Karteninformationen gelangen in Events, PlayerViews oder
  Serverfehler.

## Paketfolge

### P00 – Preflight und Prozessvertrag

- Worktree und Branch anlegen.
- Fehler-Evidence und Invarianten festhalten.
- Check: `git diff --check`.
- Commit: `docs(ai): define AI Boon run strength repair process`

### P01 – Engine-Regel und LegalAction-Vertrag

- Falsche Grundstärke 2 und den abweichenden Additions-Regeltext entfernen.
- W6-Ergebnis als Run-Grundstärke modellieren.
- LegalActions, PlayerView und Einzel-/Multi-Break-Validierung auf einen
  gemeinsamen effektiven Stärkewert ausrichten.
- Regressionen für Wurf 5 gegen Stärke 6 sowie Pumpen und Brechen ergänzen.
- Commit: `fix(engine): align AI Boon run strength validation`

### P02 – Öffentliche Spielchronik

- Start-Run-Eintrag um AI-Boon-Wurf und Run-Grundstärke erweitern.
- Formulierung: `AI Boon würfelt eine 5 und hat für diesen Run Grundstärke 5.`
- Chroniktests für eigene und gegnerische Perspektive ergänzen.
- Commit: `fix(web): show AI Boon roll in chronicle`

### P03 – Serverdiagnostik

- Engine-Ablehnungen aus dem KI-Schritt sicher klassifizieren.
- Den konkreten redigierten Enginefehler statt eines pauschalen
  `ai_no_action` zurückgeben.
- Servertest für den Ablehnungspfad ergänzen.
- Commit: `fix(server): preserve AI engine rejection diagnostics`

### P04 – Abschluss

- Fokussierte Engine-, Web- und Servertests ausführen.
- Typechecks und `git diff --check` ausführen.
- Evidence-/Final-Review und Wissenslog aktualisieren.
- Arbeitsbranch mit aktuellem `main` abgleichen und lokal integrieren.

## Blocker

- Die Lösung müsste verdeckte Informationen offenlegen.
- Eine angebotene Break-Aktion bleibt nach der Korrektur durch `applyAction`
  abgelehnt.
- Replay oder StateHash wird undeterministisch.
- `main` lässt sich nicht ohne Verlust fremder Änderungen integrieren.

## Abschlusskriterien

- Ein Wurf von 5 setzt AI Boons Grundstärke für den Run auf 5.
- Gegen Credit Blocks Stärke 6 wird vor dem Pumpen keine Break-Aktion
  angeboten.
- Nach einem Pump auf Stärke 6 wird die Break-Aktion angeboten und akzeptiert.
- Die Chronik nennt Wurf 5 und Grundstärke 5.
- Ein abgelehnter KI-Engine-Schritt meldet einen sicheren konkreten Fehler.
- Alle Paketcommits sind lokal nach `main` integriert.
