---
activityId: act-2026-05-19-current-rules-baseline-single-source
status: done
kind: architecture
area: shared
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: true
createdAt: 2026-05-19
startedAt: 2026-05-19
completedAt: 2026-05-19
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/baselines.ts
  - packages/shared/src/index.ts
  - packages/shared/src/index.test.ts
  - packages/engine/src/card-pool.ts
  - packages/engine/src/index.test.ts
  - apps/server/src/multiplayer.ts
  - apps/server/src/multiplayer.test.ts
  - packages/ai/src/index.test.ts
checks:
  - corepack pnpm --filter @netgrid/shared exec vitest run src/index.test.ts -t "rules baseline registry"
  - corepack pnpm --filter @netgrid/engine exec vitest run src/index.test.ts -t "V0.4 games|V0.8 starter decks|O:NR harness decks|V1.0.5K smoke decks|V1.0.6K smoke decks|V1.1.2K smoke decks|V0.97 games|V0.98 games"
  - corepack pnpm --filter @netgrid/server exec vitest run src/multiplayer.test.ts -t "V0.6 matches|private local O:NR matches|V1.2.3 decks|creates private matches|waits for an explicit Human Corp rez"
  - corepack pnpm --filter @netgrid/ai exec vitest run src/index.test.ts -t "stale legacy Archives"
  - corepack pnpm --filter @netgrid/shared typecheck
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/server typecheck
  - corepack pnpm --filter @netgrid/ai typecheck
  - git diff --check
---

# Current Rules Baseline als einzige aktive Regelbasis einführen

## Ziel

Normale Runtime-, Engine-, Server-, KI- und Testpfade sollen nicht mehr implizit auf historische MVP-Regelbaselines fallen können. Stattdessen gibt es eine zentrale `CURRENT_RULES_BASELINE`, die den aktuell aktiven Regelstand repräsentiert und in aktiven Pfaden als Default gilt.

## Kontext und Quellen

- Nutzerentscheidung vom 2026-05-19: Alte Baselines werden für den privaten Einanwenderbetrieb nicht als Produktwert benötigt.
- `packages/shared/src/baselines.ts` enthält aktuell mehrere historische `MVP_0_x_BASELINE`-Konstanten.
- `packages/engine/src/card-pool.ts` leitet aus Deck-IDs und Kartenpräfixen historische Card-Pool-Versionen und Baselines ab.
- `packages/engine/src/index.ts` nutzt `baselineForCardPoolVersion(cardPoolVersion)` als Default bei `createGame`.
- `apps/server/src/multiplayer.ts` nutzt `baselineForMode` mit historischen Fallbacks.
- Anlass: Ein Runner-KI-Regressionspfad konnte auf einer älteren Baseline reproduziert beziehungsweise verfehlt werden, weil Custom-/O:NR-Decks nicht zwingend mit aktuellem Run-/Breach-Regelstand liefen.

## Scope

- Eine zentrale, eindeutig benannte aktive Baseline einführen, z. B. `CURRENT_RULES_BASELINE`.
- Normale Defaults in Engine und Server auf diese Baseline ziehen.
- Test-Fixtures und neue Regressionspfade so anpassen, dass sie ohne explizite Legacy-Sonderabsicht die aktuelle Baseline verwenden.
- Alte Baseline-Konstanten in diesem Paket nur soweit anfassen, wie es für den neuen Current-Default nötig ist.
- Dokumentieren, welche aktiven Pfade nach dem Paket noch bewusst historische Baseline-Daten referenzieren.

## Nicht im Scope

- Vollständige Entfernung alter Baseline-Typen, Demo-Deck-Versionen oder historischen Card-Pool-Routings.
- Migration oder Löschung alter gespeicherter Matches.
- Änderung von Hidden-Info-, LegalAction-, Replay- oder StateHash-Verträgen.
- Umbenennung fachlicher Release-/Mechanik-Artefakte in `docs/releases/`.

## Akzeptanzkriterien

- [ ] `CURRENT_RULES_BASELINE` existiert als einzige aktive Default-Baseline für neue Spiele und neue normale Tests.
- [ ] `createGame`/`createGameAfterSetup` fallen bei normalen Custom-Decks nicht mehr still auf `MVP_0_1`, `MVP_0_4`, `MVP_0_8` oder `MVP_0_94` zurück.
- [ ] Private lokale O:NR- und aktuelle Demo-/Snapshot-Matches starten mit der aktuellen Baseline.
- [ ] Bestehende Tests, die absichtlich historische Baselines prüfen, sind als Legacy-Kompatibilität oder Folgecleanup markiert.
- [ ] Ein kurzer Umsetzungshinweis benennt die verbleibenden Legacy-Referenzen als Input für `act-2026-05-19-remove-legacy-baseline-runtime`.

## Umsetzungshinweise

- Primär in `packages/shared/src/baselines.ts`, `packages/engine/src/card-pool.ts`, `packages/engine/src/index.ts` und `apps/server/src/multiplayer.ts` prüfen.
- Testseitig zuerst Regressionspfade und aktuelle Runtime-Defaults absichern, nicht sofort das gesamte Legacy-Modell löschen.
- Wenn eine historische Baseline für Replay-Kompatibilität technisch noch benötigt wird, diese ausdrücklich als temporäre Removal Condition dokumentieren.

## Ergebnisnotiz

Erledigt: `CURRENT_RULES_BASELINE` ist zentral in `@netgrid/shared` definiert und wird als aktive Default-Baseline exportiert. Engine-Card-Pool-Deskriptoren behalten ihre historischen Versionen, Snapshot-IDs und Formatprofile, liefern aber für normale `createGame`/`createGameAfterSetup`-Pfade die aktuelle Baseline. Der Multiplayer-Server nutzt für neue Matches und Pending-Deck-Handshakes ebenfalls `CURRENT_RULES_BASELINE` statt mode- oder deckabhängiger historischer Fallbacks.

Tests wurden auf den neuen Default angepasst: V0.4/V0.8/O:NR/V0.95/V0.96/V0.97/V0.98-Deckpfade prüfen nun aktuelle Baseline plus historische Metadaten. Eine absichtliche AI-Legacy-Kompatibilitätsprüfung setzt `MVP_0_94_BASELINE` explizit.

Verbleibende Legacy-Referenzen für `act-2026-05-19-remove-legacy-baseline-runtime`: historische `MVP_0_x_BASELINE`-Konstanten bleiben für explizite Kompatibilitätstests bestehen; Card-Pool-Versionen, Snapshot-IDs, `rulesBaselineId`-Metadaten in Deckdaten und AI-Simulationszusammenfassungen sind noch nicht bereinigt.
