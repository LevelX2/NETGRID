---
activityId: act-2026-05-21-counter-display-shared-engine-projection-foundation
status: inbox
kind: fix
area: engine
priority: high
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy:
  - act-2026-05-21-counter-display-public-view-contract
resultArtifacts: []
checks: []
---

# CounterDisplay-Projection-Grundlage einführen

## Ziel

Shared-Typen und Engine-Projection sollen eine additive `counterDisplays`-Grundlage liefern, damit Web-UI und spätere Folgepakete Counter-Anzeige-Semantik aus `PlayerView` statt aus rohen `counters` ableiten können.

## Kontext und Quellen

- Führender Vertrag: `act-2026-05-21-counter-display-public-view-contract`.
- `packages/shared/src/index.ts` definiert aktuell `CounterType`, `CardInstance.counters` und `VisibleCard.counters`.
- `packages/engine/src/index.ts` baut `VisibleCard` über `visibleOwnCard`, `visibleCorpCard` und `visibleSpecialZoneCard`.
- `packages/engine/src/state-hash.ts` hasht den `GameState`; reine Displaydaten dürfen dort nicht gespeichert werden.

## Scope

- `CounterDisplay` als Shared-Typ ergänzen.
- `VisibleCard.counterDisplays?: CounterDisplay[]` additiv ergänzen.
- Einen Engine-Projektor für CounterDisplays einführen und aus `visibleOwnCard` anbinden.
- Advancement-Counter als erste Referenzfamilie abbilden:
  - bekannte Karten: fachliche Entwicklung/Advancement-Anzeige.
  - verdeckte Root-Karten: nur öffentliche Advancement-Counter ohne Kartenidentität.
- Stabile `id`s und stabile Sortierung definieren.
- Bestehende `counters` kompatibel weiterreichen, aber nicht als neue Anzeigequelle ausbauen.

## Nicht im Scope

- Keine Migration aller gespeicherten Credits.
- Keine Recurring-/Spezialcounter-Migration.
- Kein Entfernen alter Web-Helfer.
- Keine Änderung an `GameState`, Replay, `hashState`, LegalAction-Erzeugung oder Regelvalidierung.

## Akzeptanzkriterien

- [ ] `CounterDisplay` und `VisibleCard.counterDisplays` sind additiv typisiert.
- [ ] `getPlayerView` liefert für sichtbare Advancement-Counter passende `counterDisplays`.
- [ ] Verdeckte Korp-Root-Karten erhalten nur erlaubte öffentliche Advancement-Displays und keine Definition-/Label-Leaks.
- [ ] `counterDisplays` werden nicht im `GameState` gespeichert und beeinflussen `hashState` nicht.
- [ ] CounterDisplays haben stabile IDs und eine dokumentierte Sortierung.
- [ ] Checks: passende Shared-/Engine-Typechecks und fokussierte Engine-Tests.

## Umsetzungshinweise

- Den Projektor als reine, deterministische Projection schreiben.
- Keine UI-Legalitätsentscheidungen aus den Displaydaten ableiten.
- Das Paket darf Typen und Engine-Projektion ändern, aber Web-Rendering nur minimal kompatibel halten.

## Ergebnisnotiz

Noch offen.
