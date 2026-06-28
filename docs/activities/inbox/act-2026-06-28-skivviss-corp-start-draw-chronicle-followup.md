---
activityId: act-2026-06-28-skivviss-corp-start-draw-chronicle-followup
status: inbox
kind: fix
area: cards
priority: critical
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-28
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Skivviss-Korp-Startdraw in Live-Flow und Chronik nachprüfen

## Ziel

Der Korp-Start-of-turn-Draw durch `Skivviss` soll im aktuellen Human-vs-KI-Flow regeltechnisch sichtbar nachvollziehbar sein: Die Korp gibt dafür keine Aktion aus, zieht durch jeden Skivviss-Counter automatisch eine zusätzliche Karte, und die Spielchronik nennt den Effekt klar.

## Kontext und Quellen

- Nutzerfund vom 2026-06-28 aus einem Human-vs-KI-Spiel: Runner hat im vorherigen Zug einen erfolgreichen Run auf Research & Development gemacht und `Skavis`/`Skivviss` installiert; im folgenden Korp-Zug ist in der Spielchronik nicht erkennbar, ob die Korp eine zusätzliche Karte gezogen hat.
- Regelverständnis aus dem gemeldeten Kartentext: `Each Skivviss counter requires the Corp to draw one extra card at the start of each of its turns.` Das ist kein auszugebender Korp-Action-Slot, sondern ein automatischer Start-of-turn-Effekt zusätzlich zur normalen Pflichtkarte.
- Erledigtes Referenzpaket: `docs/activities/done/act-2026-05-22-skivviss-counter-ownership-and-draw-log.md`.
- Dortiger Abschlussstand: Skivviss-Counter werden öffentlich auf der Korp-Identität projiziert; der automatische Korp-Zusatzdraw soll side-sicher bleiben und in der Chronik `Skivviss`, Counteranzahl und Zusatzkarten nennen.

## Scope

- Aktuellen Live-/KI-Korp-Flow für `Skivviss` reproduzieren: erfolgreicher R&D-Run, Skivviss-Counter, Start des nächsten Korp-Zugs.
- Prüfen, ob die Engine tatsächlich normale Pflichtkarte plus Skivviss-Zusatzkarte(n) zieht.
- Prüfen, ob `PublicGameEvent`/`resolvedEffects` oder ein gleichwertiger side-sicherer Public-Payload den automatischen Zusatzdraw enthält.
- Prüfen, ob die Web-Spielchronik diesen Effekt im aktuellen Client sichtbar rendert, insbesondere für den Fall, dass die Korp von der KI gespielt wird.
- Falls die Engine korrekt ist, aber die Chronik fehlt: Web-/Chronik-Rendering fokussiert reparieren.
- Falls der Zusatzdraw selbst nicht stattfindet: Engine-/CardImplementation-Pfad fokussiert reparieren und Replay-/StateHash-Vertrag prüfen.
- Regressionstest für den aktuellen Fehlerpfad ergänzen oder reaktivieren.

## Nicht im Scope

- Keine generische Neudefinition aller Virus-Counter oder aller Start-of-turn-Effekte.
- Keine Änderung an der Purge-Regel oder an der Counter-Ownership-Grundentscheidung aus dem erledigten Skivviss-Paket.
- Keine KI-Strategieänderung; die KI muss nur mit dem korrekten Startzustand weiterspielen.
- Keine Offenlegung verdeckter R&D- oder HQ-Karten in PlayerViews, PublicEvents, WebSocket-, Reconnect-, Replay- oder Fehlerpayloads.
- Keine Umstellung der allgemeinen Pflichtdraw-Action-Semantik außerhalb des Skivviss-Prüfpfads.

## Akzeptanzkriterien

- [ ] Das Paket dokumentiert nach Reproduktion, ob der aktuelle Fehler ein Engine-Draw-Problem, ein PublicEvent-/Chronik-Problem oder nur ein Anzeige-/Erwartungsproblem ist.
- [ ] Bei mindestens einem Skivviss-Counter zieht die Korp zu Beginn ihres Zuges automatisch die normale Pflichtkarte plus eine Zusatzkarte pro Skivviss-Counter, ohne dafür einen Korp-Action-Slot auszugeben.
- [ ] Die Spielchronik zeigt einen klaren Eintrag wie sinngemäß `Skivviss: Korp zieht 1 zusätzliche Karte` und nennt bei mehreren Countern die Anzahl.
- [ ] Der sichtbare Chronikeintrag enthält keine Namen oder IDs verdeckter gezogener Karten.
- [ ] Bestehende Skivviss-Counter-Ownership-/Anzeige-Tests bleiben grün oder werden gezielt an den aktuellen UI-Vertrag angepasst.
- [ ] Replay, StateHash und Hidden-Info-Gates bleiben unverändert stabil.
- [ ] Checks: fokussierter Engine-Test für Skivviss-Startdraw, fokussierter Web-Chronik-Test, relevante Typechecks oder begründete Eingrenzung.

## Umsetzungshinweise

- Zuerst das erledigte Paket und die dort genannten Tests lesen, insbesondere den Engine-Test `adds Skivviss counters on successful R&D runs and converts them into Corp start-turn draws` und den Web-Test `names Skivviss as the reason for automatic Corp extra draws`.
- Wenn Tests noch grün sind, aber der Live-Flow nicht, gezielt die Brücke zwischen Engine-EventLog, Multiplayer-/Server-Projection und Web-Chronik prüfen.
- Besonders auf KI-Korp-Züge achten: automatische Effekte können korrekt im Engine-State landen, aber im Gegneraktions-/Chronik-Cue nicht sichtbar werden.

## Ergebnisnotiz

Noch offen.
