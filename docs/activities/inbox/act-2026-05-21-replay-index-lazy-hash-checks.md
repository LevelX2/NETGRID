---
activityId: act-2026-05-21-replay-index-lazy-hash-checks
status: inbox
kind: cleanup
area: server
priority: normal
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-05-21
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Replay-Index ohne wiederholtes Voll-Replay laden

## Ziel

Replay-Listen und Indexansichten sollen nicht jedes Match bei jedem Aufruf vollständig nachspielen müssen. Die Replay-Korrektheit bleibt erhalten, aber teure StateHash-Prüfungen werden gecacht oder erst bei Detailansicht berechnet.

## Kontext und Quellen

- `replayIndexEntryFor` berechnet aktuell `replayOk` über `replayStateHashChecks(record)`.
- Bei mehreren langen Matches kann eine reine Listenansicht dadurch CPU-Last erzeugen, obwohl der Nutzer noch kein einzelnes Replay geöffnet hat.
- Relevante Dateien:
  - `apps/server/src/multiplayer.ts`
  - `apps/server/src/storage-sqlite.ts`
  - `packages/shared/src/api-contracts.ts`, falls der Indexvertrag ergänzt werden muss.

## Scope

- Prüfen, welche UI-/API-Verträge `replayOk` im Index wirklich benötigen.
- Einen No-loss-Vertrag festlegen: cached `replayOk`, lazy Detailprüfung oder Status `unchecked`/`cached`, ohne falsche Sicherheit zu vermitteln.
- Cache invalidieren, wenn Match-State, Eventanzahl, finaler StateHash oder Match-Version sich ändern.
- Replay-Detailansicht weiterhin mit vollständiger Prüfung bereitstellen.
- Tests für lange beziehungsweise mehrfach gelistete Replays ergänzen.

## Nicht im Scope

- Keine Änderung am Replay-Eventformat.
- Kein Abschalten von StateHash-Prüfungen in Detailansichten oder Exporten.
- Keine Änderung an Engine-Replay-Determinismus.
- Keine UI-Neugestaltung des Replay-Browsers über notwendige Statusanzeige hinaus.

## Akzeptanzkriterien

- [ ] Replay-Index lädt ohne vollständiges Nachspielen jedes einzelnen Matches pro Aufruf.
- [ ] Replay-Detailansicht und Export führen weiterhin eine vollständige oder nachweislich gültige StateHash-Prüfung aus.
- [ ] Cache-/Lazy-Status wird bei Matchänderungen korrekt invalidiert.
- [ ] Redaction-Tests bestätigen, dass keine privaten Engine-Events über Indexantworten auslaufen.
- [ ] Checks: `corepack pnpm --filter @netgrid/server typecheck`, `corepack pnpm --filter @netgrid/server test`.

## Umsetzungshinweise

- Bevorzugt serverseitig lösen; Web nur anpassen, wenn der API-Vertrag einen sichtbaren `unchecked`-/`cached`-Status braucht.
- Keine Timing-Assertions als harte Tests verwenden; Verhalten über Funktionsaufrufe, Cachezustand oder Zähler abstrahieren.

## Ergebnisnotiz

Noch offen.
