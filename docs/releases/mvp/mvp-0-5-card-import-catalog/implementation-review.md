# MVP 0.5 Implementation Review

Status: pass  
Stand: 2026-05-03

## Ergebnis

`ready_for_hardening: true`

V0.5 Card Import und Card Catalog sind implementiert. Die Implementierung bleibt getrennt von Engine, KI, Deckvalidierung und Matchstart.

## Implementierter Scope

- Neues reines TypeScript-Paket `@netgrid/catalog`.
- Deterministische Snapshot-Validierung und Snapshot-Hash-Prüfung.
- Katalogindex-Erzeugung, Suche, Filter und Statuszusammenfassung.
- Statusinvarianten für `imported`, `validated`, `catalog_ready`, `implemented`, `playable`, `deck_legal` und `blocked`.
- Read-only Next.js API:
  - `GET /api/cards/catalog`
  - `GET /api/cards/catalog/:id`
  - `GET /api/cards/status-summary`
- Funktionale Katalogansicht auf der Startseite mit Suche, Side-/Statusfilter, Liste, Detail und Statusbadges.
- Visibility-Vertragstest für Katalogpayloads ohne Match-, Token-, FullState- oder Hidden-Info-Daten.

## Geänderte Hauptdateien

- `packages/catalog/`
- `apps/web/app/api/cards/catalog-data.ts`
- `apps/web/app/api/cards/catalog/route.ts`
- `apps/web/app/api/cards/catalog/[id]/route.ts`
- `apps/web/app/api/cards/status-summary/route.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/package.json`
- `tests/specs/visibility-contract.test.ts`
- `data/card-import/*`
- `data/manifests/card-catalog-status-0.5.json`

## Checks

- `corepack pnpm install`: pass.
- `corepack pnpm --filter @netgrid/catalog test`: pass, 5 Catalog tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`: pass, 12 root spec tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 47 package tests plus 12 root spec tests.
- `corepack pnpm build`: pass.

## Lokaler Smoke

- API-Smoke: `GET /api/cards/catalog?status=blocked` liefert nur `Catalog Preview Resource`, Snapshot-Hash und Katalogfilter.
- API-Smoke: `GET /api/cards/catalog/catalog_preview_operation_001` liefert Detaildaten ohne Engine-Spielbarkeit.
- Web-Smoke: `http://127.0.0.1:3000` öffnet die Katalogfläche.
- Browser-Smoke: Suche nach `Catalog Preview Resource` zeigt die nicht decklegale, blockierte Katalogkarte mit deutschem Fixture-Text.

## Gate-Prüfung

| Gate | Ergebnis | Notiz |
|---|---|---|
| Kein Auto-Playable | pass | Import-only Fixtures haben `engineCardId: null`, `playable: false`, `deck_legal: false`. |
| Hidden-Info/API-Schutz | pass | Katalogpayloads enthalten keine `cardInstances`, `privatePayload`, Tokens oder Snapshot-/Undo-State. |
| Replay/StateHash-Risiko | pass | Engine-StateHash bleibt unberührt; Katalog-Snapshot-Hash ist getrennt. |
| Legacy-Regression | pass | Engine-, AI-, Server-, Visibility- und Build-Checks bleiben grün. |
| V0.7 außerhalb Scope | pass | UI ist funktionale Ergänzung der Startansicht, kein Board- oder Design-Redesign. |

## Annahmen und Risiken

- Der aktuell laufende lokale Next-Dev-Server auf Port `3000` war bereits aktiv und hat die Änderungen per Hot Reload aufgenommen.
- Externe Kartenquellen bleiben bis zu einer expliziten Quellenfreigabe ausgeschlossen.
- V0.6 muss `deck_legal` in Formatprofile übersetzen und darf die V0.5-Katalogstatuswerte nicht als vollständige Turnierlegalität behandeln.

## Nächster Schritt

Phase 3: V0.5 Validierung, Hardening und Dokumentation. Fokus: API-/Payload-Audit, Scope-Audit, Datenartefakt-Härtung, README/Statuspflege und Final Review.
