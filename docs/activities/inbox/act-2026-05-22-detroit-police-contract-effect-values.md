---
activityId: act-2026-05-22-detroit-police-contract-effect-values
status: inbox
kind: fix
area: cards
priority: hotfix
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-05-22
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Detroit Police Contract Effektwerte korrigieren

## Ziel

`Detroit Police Contract` muss beim Scoren 12 Credits/Bits auf die Agenda legen und am Beginn jedes Korp-Zugs bis zu 2 Credits/Bits von dieser Agenda nehmen. Difficulty 4 und Agenda Points 1 dürfen nicht als Effektwerte verwendet werden.

## Kontext und Quellen

- Nutzerprüfliste vom 2026-05-22: Im Spiel liegen offenbar nur 4 Credits/Bits auf der Karte und pro Korp-Turn wird nur 1 Credit/Bit genommen.
- Solltext laut Nutzer: `Put [12] from the bank on Detroit Police Contract when you score it. Take [2] from Detroit Police Contract, if it has any bits, at the start of each of your turns.`
- Lokaler Befund: `packages/engine/src/card-implementations/onr-v1/corp/agendas/detroit-police-contract.ts` beschreibt und implementiert bereits 12/2.
- Lokaler Befund: `data/cards/originalset-v1-cards.json` und `packages/shared/src/index.ts` enthalten bei der Karte noch den alten/falschen 4/1-Power-Counter-Text.
- Frühere Counter-Anzeige-Arbeit: `docs/activities/done/act-2026-05-21-counter-display-stored-credits-and-agenda-pools.md`.

## Scope

- Prüfen, ob der beobachtete Ist-Zustand aus veralteten Kartendaten, Shared-Definition, einem alten Resolverpfad, Testfixture, gespeicherten Matchdaten oder UI-Projektion stammt.
- Kartentext, Katalogdaten und Runtime-Vertrag für `onr_v1_198_detroit-police-contract` auf 12/2 synchronisieren.
- Sicherstellen, dass gehostete Credits/Bits als Stored-Credits angezeigt und beim Turnstart korrekt reduziert werden.
- Regression für Scoring, Start-of-Corp-Turn, Anzeige/PlayerView und Chronik ergänzen oder aktualisieren.

## Nicht im Scope

- Keine generische Agenda-Engine neu bauen.
- Keine Änderung an Difficulty 4 oder Agenda Points 1.
- Keine Änderung an anderen scored-Agenda-Pools außer zur Regression, falls ein gemeinsamer Pfad betroffen ist.
- Keine Hidden-Info-Aufweichung in PlayerViews, Reconnect, Replay oder Logs.

## Akzeptanzkriterien

- [ ] Beim Scoren von `Detroit Police Contract` werden 12 öffentliche Credits/Bits auf die gescorte Agenda gelegt.
- [ ] Am Beginn jedes Korp-Zugs nimmt die Korp 2 Credits/Bits, solange mindestens 2 vorhanden sind, und bei Restmenge nur den verbleibenden Betrag.
- [ ] Difficulty 4 und Agenda Points 1 bleiben reine Kartennumerik und werden nicht als Effektwerte genutzt.
- [ ] Angezeigter Kartentext, Katalogdaten und Engine-Kommentar/Vertrag stimmen mit dem Solltext überein.
- [ ] Chronik und CounterDisplay zeigen Scoring und Turnstart-Entnahmen mit konkreten Beträgen.
- [ ] Fokussierte Tests decken Scoring, Turnstart und Anzeige/Projection ab.

## Umsetzungshinweise

- Nicht nur die aktuelle CardImplementation ansehen; auch Import-/Shared-Katalog, `data/cards/originalset-v1-cards.json`, alte Testfixtures und gespeicherte Demo-/Deckdaten prüfen.
- Wenn die Runtime bereits korrekt ist, das Paket als Daten-/Anzeige-Drift schließen und mit einem Repro-Test gegen den beobachteten 4/1-Fall absichern.

## Ergebnisnotiz

Noch offen.
