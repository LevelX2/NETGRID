---
activityId: act-2026-08-02-corporate-shuffle-legal-action-rejected
status: inbox
kind: fix
area: engine-web-server
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-08-02
startedAt:
completedAt:
branch:
releaseTarget: current-main
blockedBy: []
resultArtifacts: []
checks: []
---

# Corporate Shuffle: angebotene LegalAction darf beim Einreichen nicht als illegal abgewiesen werden

## Ziel

Eine in der aktuellen Corp-PlayerView angebotene
`Corporate Shuffle spielen`-LegalAction muss aus dem Webclient erfolgreich
eingereicht und von `applyAction` erneut validiert werden. UI und Server
dürfen dieselbe exakte LegalAction nicht gleichzeitig als spielbar anbieten
und als illegal ablehnen.

## Kontext und Quellen

- Manueller Firefox-Playtest vom 02.08.2026 auf lokalem `main` `2b14ee427`,
  Build `6498-dev`, Human Corp gegen Runner-KI.
- Corporate Shuffle lag sichtbar in HQ. Die PlayerView bot bei drei
  verfügbaren Aktionen folgende LegalAction an:
  - Typ `play_operation`;
  - ActionId
    `corp.play_operation.corp_onr_classic_017_corporate-shuffle_1.corp_onr_classic_017_corporate-shuffle_1`;
  - Quelle und Payload-Karte
    `corp_onr_classic_017_corporate-shuffle_1`;
  - Kosten `{ clicks: 2, credits: 0 }`;
  - `expiresAtStateVersion: 51`.
- Der Webclient zeigte `Spielen` mit `Kosten: 2 Aktionen`. Beim Auslösen
  erschien ausschließlich `Diese Aktion ist nicht legal`; Karte, Aktionen
  und StateVersion blieben unverändert.
- Derselbe Fehler trat zuvor bereits bei exakt zwei verfügbaren Aktionen auf.
  Ein vollständiges Neuladen und ein weiterer Zug änderten den Befund nicht.
- Eine gerezzte Strategic Planning Group war aktiv. Der Fehler geschieht vor
  dem Draw und verhindert deshalb den vorgesehenen privaten Sechs-Karten-
  Dialog sowie die nachgelagerte Corporate-Shuffle-HQ-Choice.
- Verwandte automatisierte Evidence:
  - `packages/engine/src/index-tests/mechanics/classic-corp-assets-upgrades.test.ts`;
  - `packages/engine/src/game/play/corp-operation-resolution.test.ts`;
  - `docs/reviews/engine/corp-draw-transactions-final-review-2026-08-02.md`.
- Die beiden fokussierten Engine-Gegenproben für die Zwei-Aktionen-Kosten und
  die Fortsetzung in die sechs Karten umfassende SPG-Auswahl sind auf
  demselben Stand grün. Der offene Befund liegt damit im noch nicht gemeinsam
  abgesicherten PlayerView-/Webclient-/Server-Integrationsfluss.

## Scope

- Den realen Webclient-/Server-Fluss mit Corporate Shuffle bei exakt zwei
  und bei mindestens drei verfügbaren Corp-Aktionen reproduzieren.
- Die angebotene PlayerView-LegalAction, den vom Client eingereichten
  `PlayerAction`-Vertrag und die erneute `applyAction`-Validierung anhand von
  ActionId, Quelle, StateVersion, Timingpunkt, Kosten und Payload vergleichen.
- Die tatsächliche Grenzverletzung im bestehenden Owner beheben. Keine
  UI-seitige Sonderausführung und kein Umgehen der Engine-Validierung.
- Gegenprobe ohne aktive SPG ergänzen und mit aktiver SPG die vollständige
  Fortsetzung bis zur Sechs-Karten-Auswahl, HQ-zu-R&D-Choice und Chronik
  absichern.
- Falls der Fehler nur nach Reconnect auftritt, die wiederhergestellte
  StateVersion-/Action-Bindung gezielt sichern; andernfalls den allgemeineren
  Play-Operation-Vertrag korrigieren.

## Nicht im Scope

- Keine Änderung des Corporate-Shuffle-Kartentexts, der Kosten von zwei
  Aktionen oder des Draw-Counts von fünf Basiskarten.
- Keine Abschwächung von `applyAction`; Seite, ActionId, StateVersion,
  Timingpunkt, Kosten und Payload bleiben erneut verbindlich zu validieren.
- Keine Sonderbehandlung, die Corporate Shuffle außerhalb von LegalActions
  spielt, und keine UI-eigene Regelautorität.
- Keine Änderung an der SPG-Auswahlheuristik der KI oder an verdeckten
  Karteninformationen.

## Akzeptanzkriterien

- [ ] Corporate Shuffle lässt sich bei exakt zwei verfügbaren Corp-Aktionen
      über die angebotene Webclient-Aktion spielen und verbraucht genau zwei
      Aktionen sowie die gedruckten Creditkosten.
- [ ] Derselbe Fluss funktioniert bei mindestens drei verfügbaren Aktionen;
      eine tatsächlich nicht mehr gültige oder veraltete Action wird dagegen
      weiterhin fail-closed abgelehnt.
- [ ] Ein Integrationstest belegt, dass die aus der aktuellen PlayerView
      ausgewählte ActionId mit unveränderter Quelle, StateVersion, Kosten und
      Payload von `applyAction` akzeptiert wird.
- [ ] Ohne SPG werden fünf Karten als eine Draw-Einheit behandelt und danach
      genau eine HQ-zu-R&D-Choice geöffnet.
- [ ] Mit gerezzter SPG werden sechs lesbare Corp-Choice-Karten angeboten;
      nach der Auswahl gehen fünf netto nach HQ und genau eine unter R&D,
      anschließend folgt genau eine HQ-zu-R&D-Choice.
- [ ] Die Chronik enthält getrennte, count-korrekte SPG- und
      Corporate-Shuffle-Meldungen ohne Kartenidentitäts-Leak.
- [ ] Fokussierte Engine-, Web- und Servertests, die betroffenen Typechecks
      und `git diff --check` sind grün.

## Manueller Nachtest

1. Human Corp gegen Runner-KI mit Corporate Shuffle in HQ starten.
2. Bei exakt zwei Aktionen `Spielen · Kosten: 2 Aktionen` auslösen.
3. Ohne SPG den Fünf-Karten-Draw und die HQ-zu-R&D-Choice abschließen.
4. Mit gerezzter SPG denselben Ablauf wiederholen, eine der sechs Karten
   unter R&D legen und danach eine HQ-Karte in R&D mischen.
5. Pflichtzug-/SPG-Choice zusätzlich einmal während der offenen Auswahl neu
   laden; die Corporate-Shuffle-Aktion danach erneut ausführen.
