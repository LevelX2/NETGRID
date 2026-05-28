---
activityId: act-2026-05-24-proteus-phase-2f-replacement-choice-bp
status: resolved-by-done-activity
kind: implementation
area: cards
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-24
startedAt: 2026-05-24
completedAt: 2026-05-28
branch: codex/proteus-card-implementation
releaseTarget: Proteus Phase 2f
proReferences:
  - PRO015
blockedBy: []
resultArtifacts:
  - docs/activities/in-progress/act-2026-05-24-proteus-phase-2f-replacement-choice-bp.md
  - docs/activities/done/act-2026-05-28-proteus-pro015-bad-publicity-run-replacement-suite.md
checks:
  - Lokale Quellenprüfung `data/cards/proteus-cards.json` für `Identity Donor` und `Senatorial Field Trip`
  - Codebestandprüfung `packages/shared/src/index.ts`, `packages/engine/src/index.ts`, `packages/engine/src/game/damage`, `packages/engine/src/card-implementations/onr-v1`
---

# Proteus Phase 2f: Replacement-/Choice BP

## Ziel

Bad-Publicity-Karten mit Replacement- und Korp-Choice-Fenstern umsetzen.

## Zielkarten

- `onr_proteus_112_identity-donor` Identity Donor
- `onr_proteus_123_senatorial-field-trip` Senatorial Field Trip

## Scope

- Eigene CardImplementation-Dateien.
- Damage-Prevention-Replacement außerhalb normaler Runner-Aktionen.
- Last-/Rezzed-Black-ICE-Turn-Memory.
- Korp-Choice Derez oder Bad Publicity.
- Bad-Publicity-Effekt aus Phase 2a.

## Nicht im Scope

- Keine Phase-4-Hidden-Resource-Karten.
- Keine Decklegalität, Formatlegalität oder AI-Hints.

## Akzeptanzkriterien

- [ ] Jede Zielkarte hat eine eigene CardImplementation-Datei.
- [ ] Replacement-/Choice-Fenster werden über LegalActions/Choices revalidiert.
- [ ] BP-Erhöhung nutzt den generischen Baustein.
- [ ] PublicPayload, Replay und StateHash sind stabil.

## Ergebnisnotiz

Erledigt durch PRO015 am 2026-05-28. Die Zielkarten `Identity Donor` und `Senatorial Field Trip` sind in der Done-Activity `act-2026-05-28-proteus-pro015-bad-publicity-run-replacement-suite` umgesetzt. Diese alte Umbrella-Activity bleibt nur Statusreferenz; daraus entsteht keine zweite Implementierungszählung.

Blockiert am 2026-05-24 vor Codeänderungen.

`Identity Donor` und `Senatorial Field Trip` hängen beide an generischen Fenstern, die im aktuellen Engine-/CardImplementation-Vertrag noch nicht ausreichend modelliert sind:

- `Identity Donor` darf nicht als normale Runner-Action gespielt werden. Die Karte wird aus der Hand während des Korp-Zugs gespielt, wenn der Runner Meat Damage erleiden würde, verhindert diesen Damage vollständig und gibt der Korp 2 Bad Publicity. Die vorhandenen CardImplementation-Damage-Prevention-Bausteine modellieren installierte Runner-Quellen mit Prävention/Replacement-Fenstern. Für eine Event-Karte aus der Grip fehlt ein generischer LegalAction-/Choice-Vertrag: Kartenquelle in der Grip, Timing während des Korp-Zugs, Damage-Event-Bindung, Kosten/Source-Move nach Heap, `applyAction`-Revalidierung gegen das konkrete Damage-Event, PublicPayload-Redaction und Replay/StateHash.
- `Senatorial Field Trip` verlangt: "Play only if the Corp rezzed a piece of Black Ice this turn. The Corp either derezzes that piece of ice or receives 2 Bad Publicity points." Der aktuelle Turn-Flag-Vertrag enthält `corpRezzedIceThisTurn` nur als Zähler. Es fehlt die konkrete, noch revalidierbare zuletzt gerezzte Black-ICE-Instanz dieses Zuges. Ohne diese Instanz kann die Korp-Choice "derez that piece of ice" nicht side-sicher und stale-sicher umgesetzt werden. Außerdem fehlt ein generischer Korp-Choice-Baustein für "derez dieses konkrete ICE oder add_bad_publicity".

Eine Umsetzung ohne diese Grundlagen müsste entweder Proteus-spezifische Sonderzweige in Damage-, Rez- oder Choice-Pfade einbauen oder nicht ausreichend revalidierte Payload-Daten akzeptieren. Beides verletzt die Designvorgabe, dass Karten über generische CardImplementation-/Engine-Bausteine laufen und `applyAction` Timing, Kosten, Ziele und Choices erneut validiert.

Entblockung:

- Generischen Grip-Event-Damage-Prevention-Baustein definieren: Eventquelle aus der Grip, gebunden an ein imminentes Damage-Event, nur passendes Damage-Type-Fenster, Source-Move nach Heap, öffentliche und private Payload-Grenzen, Replay/StateHash.
- Generischen Last-Rezzed-Black-ICE-Turn-Flag ergänzen: konkrete CardInstanceId plus DefinitionId/Serverposition, Reset zum passenden Turnwechsel, Prüfung ob die Instanz weiterhin installiert und rezzed ist.
- Generischen Korp-Choice-Baustein für "derez target or add_bad_publicity" ergänzen, inklusive Wrong-Side-, stale-, Ziel- und Choice-Tests.
- Danach beide Zielkarten als eigene CardImplementation-Dateien auf diese Bausteine setzen.
