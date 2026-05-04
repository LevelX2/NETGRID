# MVP 0.95 Implementation Review

Status: Implementation Review bestanden
Stand: 2026-05-04

## Ergebnis

V0.95 implementiert den engen Resource-/Tag-Slice aus dem Requirements Freeze:

- `resource` ist als additiver Kartentyp verfügbar.
- Runner-Rig führt `resources` als eigene installierte Boardliste.
- Runner kann die lokale/fiktive `v095_safehouse_resource` über `install_card` installieren.
- Installierte Resources sind für Runner und Corp öffentlich sichtbar.
- Corp erhält `trash_resource` nur im Corp-Aktionsfenster, wenn der Runner getaggt ist, die Corp mindestens 1 Klick und 2 Credits hat und eine installierte Runner-Resource existiert.
- `trash_resource` bewegt die Resource in den Runner-Heap und erzeugt ein `public` Event.

`ready_for_hardening: true`

## Geänderte Runtime-Flächen

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/chronicle.ts`
- `apps/web/app/page.tsx`

## Daten- und Doku-Artefakte

- `data/rules/rules-baseline-0.95.json`
- `data/cards/demo-cards-0.95.json`
- `data/decks/demo-decks-0.95.json`
- `data/manifests/card-implementation-manifest-0.95.json`
- `data/rules/mechanics-coverage-0.95.json`
- `data/scenarios/v095-resource-tag.json`
- `data/scenarios/v095-multiplayer-resource-smoke.json`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`

## Review-Befund

- LegalActions bleiben alleinige Quelle für PlayerActions.
- `applyAction` revalidiert `trash_resource` über aktuelle LegalActions sowie im Executor gegen Tagstatus, Kosten und installierte Resource.
- Resource-Install und Resource-Trash sind public Events und keine Hidden-Info-Barrieren.
- Corp PlayerView und AI-Input sehen nur öffentliche Resource-Boarddaten, keine Runner-Grip-/Stack-Titel.
- Replay/StateHash bleiben deterministisch; V0.95 führt keine neue Randomness ein.
- Multiplayer Submit, Idempotency, Reconnect und Undo über Public-Resource-Trash sind abgedeckt.

## Grenzen

Nicht implementiert wurden Trace, Link/Bidding, Jack-out/Breach/Multiaccess, Identity-Abilities, Hidden-Zone-Tools, Hosting, Viren, Purge, Counter-Familien sowie Prevention/Avoid/Interrupt/Replacement.
