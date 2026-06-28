---
activityId: act-2026-06-28-skivviss-corp-start-draw-chronicle-followup
status: done
kind: fix
area: cards
priority: critical
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-06-28
startedAt: 2026-06-28
completedAt: 2026-06-28
branch: codex/skivviss-draw-chronicle-followup
releaseTarget:
blockedBy: []
resultArtifacts:
  - apps/web/app/chronicle.ts
  - apps/web/app/chronicle.test.ts
  - packages/engine/src/index-tests/originalset/per-card-followups.test.ts
checks:
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index-tests/originalset/per-card-followups.test.ts -t "adds Skivviss counters on successful R&D runs and converts them into Corp start-turn draws"
  - corepack pnpm --filter @netgrid/web exec vitest run app/chronicle.test.ts -t "names Skivviss as the reason for automatic Corp extra draws"
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web typecheck (fehlgeschlagen wegen bestehender, paketfremder strategy-profile-Typfehler)
  - git diff --check
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

- [x] Das Paket dokumentiert nach Reproduktion, ob der aktuelle Fehler ein Engine-Draw-Problem, ein PublicEvent-/Chronik-Problem oder nur ein Anzeige-/Erwartungsproblem ist.
- [x] Bei mindestens einem Skivviss-Counter zieht die Korp zu Beginn ihres Zuges automatisch die normale Pflichtkarte plus eine Zusatzkarte pro Skivviss-Counter, ohne dafür einen Korp-Action-Slot auszugeben.
- [x] Die Spielchronik zeigt einen klaren Eintrag wie sinngemäß `Skivviss: Korp zieht 1 zusätzliche Karte` und nennt bei mehreren Countern die Anzahl.
- [x] Der sichtbare Chronikeintrag enthält keine Namen oder IDs verdeckter gezogener Karten.
- [x] Bestehende Skivviss-Counter-Ownership-/Anzeige-Tests bleiben grün oder werden gezielt an den aktuellen UI-Vertrag angepasst.
- [x] Replay, StateHash und Hidden-Info-Gates bleiben unverändert stabil.
- [x] Checks: fokussierter Engine-Test für Skivviss-Startdraw, fokussierter Web-Chronik-Test, relevante Typechecks oder begründete Eingrenzung.

## Umsetzungshinweise

- Zuerst das erledigte Paket und die dort genannten Tests lesen, insbesondere den Engine-Test `adds Skivviss counters on successful R&D runs and converts them into Corp start-turn draws` und den Web-Test `names Skivviss as the reason for automatic Corp extra draws`.
- Wenn Tests noch grün sind, aber der Live-Flow nicht, gezielt die Brücke zwischen Engine-EventLog, Multiplayer-/Server-Projection und Web-Chronik prüfen.
- Besonders auf KI-Korp-Züge achten: automatische Effekte können korrekt im Engine-State landen, aber im Gegneraktions-/Chronik-Cue nicht sichtbar werden.

## Ergebnisnotiz

Abgeschlossen am 2026-06-28. Die Reproduktion ergab kein Engine-Draw-Problem: Der Skivviss-Zusatzdraw wird beim Wechsel in den Korp-Zug automatisch ausgeführt, als `resolvedEffects` am Runner-`end_turn`-Event veröffentlicht und die normale Korp-Pflichtkarte folgt anschließend separat ohne Verbrauch eines Korp-Action-Slots. Die sichtbare Lücke lag im Web-Chronik-Gruppierungsmarker: Der Skivviss-Sondereintrag hatte keinen `Automatisch`-Chip und blieb dadurch beim Runner-Zugende statt im Korp-Zugstart-Kontext hängen. Der Chroniktext lautet jetzt klar `Skivviss: Die Korp zieht zu Beginn ihres Zugs ... zusätzliche Karte(n).`, enthält `Automatisch` und `Korp-Zugstart` als Chips und leakt keine gezogenen Karten. Fokussierte Engine- und Web-Tests sowie Engine-Typecheck und `git diff --check` sind grün; der Web-Typecheck bleibt wegen bereits vorhandener, paketfremder `strategy-profile`-Typfehler rot.
