# AI179 Catalog Data Timeout Stabilization

Datum: 2026-06-13

Branch: `codex/ai170-ai180-opportunity-snapshots`

## Ziel

AI179 stabilisiert den wiederholt erwähnten fokussierten `@netgrid/web`-Timeout in `apps/web/app/api/cards/catalog-data.test.ts`, ohne fachliche Assertions abzuschwächen.

## Analyse

Der auffällige Testblock `promotes the Proteus visible baseline for deck legality and AI support` prüft 154 Proteus-Karten per `catalogDetailResponse` und danach zusätzliche Listenfilter. In Root- und isolierten Wiederholungsläufen ist der Test grün, kann aber im fokussierten parallelen Web-Test gegen das Vitest-Default-Timeout von 5 Sekunden laufen.

Die Ursache ist Testlaufzeit durch bewusst breite Coverage, nicht ein fachlicher Fehler in Catalog-Responses.

## Umsetzung

- Nur der lange Proteus-Baseline-Test erhält ein lokales Timeout von 15 Sekunden.
- Alle Assertions bleiben unverändert.
- Kein Catalog-Code, keine API-Logik und keine Datenquelle wurden geändert.

## Ergebnis

Der fokussierte Web-Test bleibt fachlich gleich, hat aber genug Zeit für den 154-Karten-Loop.

## Verifikation

- `corepack pnpm --filter @netgrid/web test -- catalog-data`
- `corepack pnpm --filter @netgrid/web test`
- `git diff --check`
