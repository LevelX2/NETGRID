# V1.3.1 Final Review

Datum: 2026-05-08

## Gate-Entscheidung

Status: done.

V1.3.1 Card Data Pipeline v2 ist nach abgeschlossenem V1.3.0-Gate vollständig umgesetzt, dokumentiert und lokal verifiziert. Der Release macht Kartendaten, Quellen, Statusübergänge und AI-Hints reviewbar, ohne Spielbarkeit, KI-Support, Mechaniken oder Assets automatisch zu aktivieren.

## Finaler Scope

- Source Registry v2 mit Projekt-, Manual-Review- und privater lokaler Quellklassifikation.
- deterministischer Card Pipeline Snapshot `card-pipeline-snapshot-1.3.1` mit Hash `fnv1a:f2210868`.
- getrennte und validierte Statusketten für Import, Katalog, Engine, human, deck, format und AI.
- reviewpflichtige `requiredMechanics`, `resolverRef`, `abilityRefs` und `aiHintsRef`.
- AI-Hints v2 als eigene validierte Daten, nicht als Freigabeautorität.
- Import-Diff mit reviewpflichtigen und blockierenden Kategorien.
- Rollbackvertrag ohne Match-Snapshot-, Replay-/StateHash- oder private Asset-Migration.
- Status- und Supportreports für blockierte Karten, Resolver-/Mechanik-/Test-/AI-Hint-Lücken.
- Redaction gegen Tokens, lokale private Pfade, Decklisten und Hidden-Info-Felder.
- V1.3.0-Deckvalidierungs- und Matchstart-Regression.

## Gates

- `V1_3_1_implemented: true`
- `V1_3_1_verified: true`
- `V1_3_1_done: true`
- `ready_for_V1_4_0_implementation: true`
- `release_boundary_sequence_respected: true`

## Pflichtchecks

- `git diff --check`: pass
- `corepack pnpm lint`: pass
- `corepack pnpm typecheck`: pass
- `corepack pnpm test`: pass
- `corepack pnpm build`: pass, bekannte nicht-blockierende Turbopack-NFT-Warnung
- `corepack pnpm e2e`: pass, 8/8 Tests

Gezielte Regressionen:

- `corepack pnpm --filter @netgrid/catalog test`: pass, 14 Tests
- `corepack pnpm --filter @netgrid/decks test`: pass, 12 Tests
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`: pass, 59 Tests

## No-Scope-Bestätigung

- kein Kartentextparser,
- keine automatische Spielbarkeit aus Import, Text, Bild oder AI-Hints,
- keine neuen Kartenfreigaben,
- keine neuen Mechaniken,
- keine planbasierte Corp- oder Runner-KI,
- kein Belief State,
- keine FullState-Simulation,
- kein LLM als Live-Regelakteur oder Action-Erzeuger,
- keine offiziellen Assets, Logos, Card Frames oder Card Backs,
- keine Public-Plattformfunktionen, Accounts, Matchmaking, Rankings oder Turniere.

## Grenzen

Die Versioned-Pipeline verwendet keine versionierten privaten lokalen O:NR-Rohdaten. Private lokale Quellen werden nur als logische private Referenz geführt und bleiben redigiert. AI-Hints v2 bereiten V1.4.0/V1.4.1 vor, setzen aber `ai_supported` nicht selbst. V1.4.0 darf nun gemäß Handoff als nächste Phase starten.

