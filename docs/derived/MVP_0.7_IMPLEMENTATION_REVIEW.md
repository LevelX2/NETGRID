# MVP 0.7 Implementation Review

Status: bestanden
Stand: 2026-05-03

## Ergebnis

`ready_for_hardening: true`

V0.7 wurde als UI-Neugestaltung innerhalb des eingefrorenen Scopes umgesetzt. Die Weboberfläche nutzt weiterhin nur side-sichere Clientdaten und importiert keine Rules Engine.

## Umgesetzt

- helle Clean-High-Contrast-Design-C-Schicht in `apps/web/app/globals.css`,
- V0.7-Entry mit Preflight-Status, privatem Matchflow, Katalog, Decks und Card Display Settings,
- `CardDisplaySettings`, `BoardPreview`, `CardView`, `CardPreviewPanel` und generische image-ready Platzhalter,
- `BoardHeader`, `RunTimeline`, `LegalActionsPanel`, `UndoPanel`, `EventLogPanel` und `DiagnosticsDrawer`,
- RunnerBoard und CorpBoard mit side-sicherer Datenbindung aus `PlayerView`, `LegalActions`, EventTail und lokalen UI-Preferences,
- Diagnostics als Drawer ohne Klartexttokens und ohne FullState,
- Visual-Smokes für Entry, RunnerBoard und CorpBoard über lokalen Headless-Browser.

## Geänderte Hauptdateien

- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `tests/specs/visibility-contract.test.ts`
- `tests/specs/ui-redesign-0.7-acceptance-tests.todo.md`
- `README.md`

## Safety Review

| Gate | Ergebnis |
|---|---|
| Browser importiert keine Engine | pass |
| Browser rendert keinen `GameState` | pass |
| CardView lädt keine echten oder externen Kartenbilder | pass |
| Hidden Cards zeigen keine Titel, `definitionId`, Bild-URL oder Asset-ID | pass |
| LegalActionsPanel erzeugt keine eigenen Actions | pass |
| Diagnostics zeigt keine Tokens oder FullState-Felder | pass |
| Katalog und Deckeditor bleiben erreichbar | pass |

## Checks

- `corepack pnpm --filter @netrunner/web typecheck`: pass.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass.
- `corepack pnpm --filter @netrunner/web build`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.

## Lokale UI-Smokes

- Entry/Katalog/Deck-Smoke auf `http://127.0.0.1:3007`: pass.
- RunnerBoard-Smoke mit lokal erzeugtem Runner-vs-Corp-KI-Match: pass.
- CorpBoard-Smoke mit lokal erzeugtem Corp-vs-Runner-KI-Match: pass.

Screenshots liegen nur als lokale temporäre Prüfartefakte unter `tmp/` und werden nicht versioniert.

## Annahmen und Grenzen

- V0.7 nutzt generische Projektplatzhalter, keine offiziellen Assets.
- Der bestehende Server- und Engine-Vertrag bleibt unverändert.
- Mobile bleibt kein Hauptgate; schmalere Browser werden aber ohne offensichtlichen Textüberlauf unterstützt.
- Design D ist als RunTimeline/Encounter-Fokus adaptiert, nicht als vollständiges eigenes Theme.
