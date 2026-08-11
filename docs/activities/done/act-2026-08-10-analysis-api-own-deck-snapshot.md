---
activityId: act-2026-08-10-analysis-api-own-deck-snapshot
status: done
kind: architecture
area: server
priority: normal
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-08-10
startedAt: 2026-08-11
completedAt: 2026-08-11
branch: codex/runner-cost-effective-breaker-recovery
releaseTarget: ai-observability-hardening
blockedBy: []
resultArtifacts:
  - apps/server/src/maintenance-own-deck-snapshot.ts
  - apps/server/src/storage-sqlite.ts
  - apps/server/src/multiplayer.ts
  - apps/server/src/http-server.ts
  - apps/server/src/multiplayer.test.ts
  - docs/runbooks/maintenance-control-plane.md
  - KI-Wissen-NETGRID/03 Betrieb/Log 2026-08.md
checks:
  - fokussierter Maintenance-Bundle-/Decision-API-Test grün
  - Server-Typecheck grün
  - git diff --check grün
---

# Eigene historische Deckzusammensetzung über die Analyse-API anbieten

## Ziel

Die read-only Maintenance-Analyse-API soll für ein gespeichertes Match die
historisch verwendete eigene Deckzusammensetzung einer analysierten Seite
reihenfolgenneutral und mit eindeutiger Provenance liefern. Dadurch lässt sich
prüfen, welche Kartenrollen grundsätzlich noch im eigenen Stack erreichbar
waren, ohne die Stack-Reihenfolge oder unbekannte gegnerische Deckdaten
offenzulegen.

## Kontext und Quellen

- Playtest-Match `match_17b23313d4697e86`, Analyse der späten Runner-Phase.
- Decision 104 liefert im actor-sicheren Zustand Hand, Rig, Heap,
  `stackOrRdCount: 25` und `deckMetadata` mit Deckname, Kartenpool,
  Formatprofil und Deck-Hash.
- Weder das begrenzte Match-Bundle noch der Decision-Detailendpunkt liefert
  die Definitionen und Multiplikitäten des historisch verwendeten eigenen
  Decks. Damit ist nicht prüfbar, ob noch andere Breaker, Tutoren oder
  Wirtschaftskarten im Stack lagen.
- Die aktuelle Deckdatei im Workspace wäre kein zulässiger Ersatz: Sie kann
  sich seit Matchstart geändert haben und besitzt keine bewiesene Bindung an
  den gespeicherten Matchzustand.
- Die Stack-Reihenfolge ist weiterhin verdeckte Information und wird für
  diese Analyse nicht benötigt.
- Verwandte Activity
  `act-2026-08-09-runner-belief-memory-analysis-api-followup` betrifft
  gegnerisches actor-sicheres Belief Memory und schließt Decklisten dort
  bewusst aus. Dieses Paket behandelt ausschließlich die eigene historische
  Deckzusammensetzung und bleibt getrennt.

## Scope

- Beim Matchstart einen unveränderlichen, reihenfolgenneutralen Snapshot der
  tatsächlich verwendeten Deckdefinition capture-fähig persistieren oder
  revisionssicher über eine unveränderliche gespeicherte Deckrevision binden.
- Mindestens Seite, Identity, Karten-Definition-IDs, Multiplikitäten,
  Gesamtzahl, Kartenpool-/Formatversion und Deck-Hash erfassen.
- Im Match-Bundle eine kompakte optionale eigene Decksektion beziehungsweise
  einen klar benannten Include-Parameter anbieten.
- Im Decision-Analyse-Endpunkt den eigenen Deck-Snapshot oder eine eindeutige
  Referenz plus actor-sichere, reihenfolgenneutrale Zonenbilanz anbieten, mit
  der verbleibende mögliche Rollen/Definition-Counts nachvollzogen werden
  können.
- Provenance strikt unterscheiden:
  - `persisted`: exakt die beim Match verwendete Deckrevision;
  - `reconstructed`: nur aus hash-verifizierter persistierter Match- und
    Deckrevision ableitbar;
  - `unavailable`: keine historische Bindung vorhanden.
- Alte Matches ohne beweisbaren Snapshot als nicht verfügbar kennzeichnen;
  keine aktuelle Deckdatei und keine Datenbankheuristik als Fallback lesen.
- Side- und Berechtigungsmodell des Maintenance-Endpunkts beibehalten. Bei
  `side=runner` nur die für diese Analyse zulässige Runner-Decksicht liefern;
  gegnerische Deckzusammensetzung standardmäßig redigieren.
- Payload begrenzen und Multiplikitäten statt Karteninstanzen oder Reihenfolge
  liefern.
- API-Vertrag, Redaction, Hashbindung und Bundle-/Detailkonsistenz fokussiert
  testen und im Maintenance-Runbook dokumentieren.

## Nicht im Scope

- Keine Ausgabe der eigenen oder gegnerischen Stack-Reihenfolge.
- Keine Offenlegung der unbekannten gegnerischen Deckliste, Hand oder
  verdeckter Karteninstanzen.
- Keine Erweiterung normaler PlayerViews, öffentlicher Replays,
  WebSocket-/Reconnect-Payloads oder Client-Fehler um Decklisten.
- Keine Nutzung aktueller Workspace-Deckdateien als Ersatz für historische
  Matchdaten.
- Keine Legacy-Migration alter Matches ohne beweisbare Deckrevision; NETGRID
  V0 darf diese Daten ausdrücklich als nicht verfügbar melden.
- Keine KI-Strategieänderung, Breaker-Auswahl oder DeckDoctrine-Anpassung in
  diesem Paket.
- Kein direkter Analysezugriff auf SQLite; die Maintenance-API bleibt der
  einzige Spielanalysepfad.

## Akzeptanzkriterien

- [x] Ein neu gespeichertes Match liefert für die analysierte eigene Seite
      Identity, Definition-Counts, Gesamtzahl, Kartenpool-/Formatversion und
      Deck-Hash aus einer historisch gebundenen Quelle.
- [x] Die Darstellung ist reihenfolgenneutral und enthält keine
      Karteninstanz-IDs, Shuffle-Ergebnisse oder Stackpositionen.
- [x] Bundle und Decision-Detail weisen denselben Snapshot beziehungsweise
      dieselbe Signatur und eindeutige Provenance aus.
- [x] Aus Snapshot und actor-sicheren eigenen Zonen kann nachvollzogen
      werden, welche Definitionen beziehungsweise Rollen noch im Stack
      möglich sind, ohne dessen Reihenfolge zu verraten.
- [x] Die aktuelle Deckdatei wird nach einer nachträglichen Änderung nicht
      als historische Wahrheit ausgegeben.
- [x] Bei fehlender historischer Bindung meldet
      `diagnostics.unavailableSections` einen strukturierten Grund wie
      `ownDeckSnapshot`; es gibt keinen stillen Fallback.
- [x] Gegnerische Deckdefinitionen, Handkarten, Karteninstanzen,
      FullGameState, Sessions und Tokens bleiben redigiert.
- [x] Bestehende Filter und Payloadgrenzen des Analyse-Bundles bleiben
      wirksam.
- [x] Maintenance-API-Tests sichern Berechtigung, Side-Bindung, Redaction,
      Hash-/Versionsbindung und konsistente Bundle-/Detailwerte.
- [x] Replay, StateHash und Matchdeterminismus bleiben unverändert; der
      Snapshot ist Analyse-/Provenance-Evidence, keine Regelautorität.
- [x] Fokussierte Server-/Storage-/API-Tests, erforderliche Typechecks,
      Runbook-Prüfung und `git diff --check` sind grün.

## Umsetzungshinweise

- Vor einer neuen Persistenzform prüfen, ob die unveränderliche Deckrevision
  bereits im Match-Startvertrag oder Ergebnis-Snapshot gebunden ist und nur
  side-sicher projiziert werden muss.
- Die Definition-Counts bevorzugt einmalig speichern oder per stabiler
  Content-Adresse referenzieren; keine Karteninstanzliste und keinen
  vollständigen Laufzeitstate duplizieren.
- Die Trennung zur Belief-Memory-Activity erhalten: Eigene Deckkomposition ist
  keine Quelle für erfundenes Gegnerwissen.

## Ergebnisnotiz

Die Maintenance-Analyse projiziert den bereits beim Matchstart serverprivat
persistierten Decksnapshot nun optional im Bundle und automatisch im
Decision-Detail. Der versionierte Vertrag enthält nur sortierte
Definition-Counts, Identity, Gesamtzahl, Kartenpool-/Formatbindung, Deck-Hash
und Signatur. Das Decision-Detail ergänzt aus seinem exakten State-Snapshot
eine actor-sichere Bilanz der bekannten Karten außerhalb von Stack/R&D und
der dort noch möglichen Definitionen.

Side-, Snapshot-, Hash- und Versionsbindung werden fail-closed geprüft.
Fehlende oder widersprüchliche historische Daten melden `ownDeckSnapshot` als
`unavailable`; aktuelle Deckdateien und gegnerische Decksnapshots werden nie
als Ersatz gelesen. Der fokussierte HTTP-/SQLite-Regressionstest deckt
Bundle-/Detailkonsistenz, Zonenbilanz, Redaction, Bindungsmismatch und fehlende
Persistenz ab. Server-Typecheck und `git diff --check` sind grün.
