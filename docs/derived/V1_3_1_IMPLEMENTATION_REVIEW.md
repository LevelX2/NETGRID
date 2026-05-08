# V1.3.1 Implementation Review

Datum: 2026-05-08

## Ergebnis

V1.3.1 Card Data Pipeline v2 ist umgesetzt. Der Release ergänzt eine reviewfähige Datenpipeline für Source Registry v2, deterministische Pipeline-Snapshots, Statusketten, AI-Hints v2, Import-Diff, Rollbackvertrag und Statusreports.

V1.3.1 bleibt ein Daten-, Integritäts- und Review-Gate. Es wurden keine Karten neu freigegeben, keine neuen Mechaniken aktiviert, keine planbasierte KI implementiert, keine offiziellen Assets eingebunden und keine Public-Plattformfunktionen eingeführt.

## Umgesetzte Artefakte

- `data/card-import/source-registry-1.3.1.json`
- `data/card-import/card-pipeline-snapshot-1.3.1.json`
- `data/card-import/card-pipeline-snapshot-1.3.1.hash`
- `data/manifests/card-support-manifest-1.3.1.json`
- `data/ai/ai-card-hints-1.3.1.json`
- `data/ai/ai-card-hints-report-1.3.1.json`
- `data/reports/card-pipeline-report-1.3.1.json`
- `data/reports/card-pipeline-diff-report-1.3.1.json`
- `data/reports/card-pipeline-rollback-report-1.3.1.json`
- `packages/catalog/src/index.ts`
- `packages/catalog/src/index.test.ts`

## Umsetzung

`@netgrid/catalog` enthält jetzt reine TypeScript-Verträge und Prüffunktionen für:

- `SourceRegistryV2` inklusive privater lokaler Quellklassifikation ohne versionierte lokale Pfade.
- `CardPipelineSnapshot` mit stabiler Sortierung, `display_only`-Textpolitik, `resolver_refs_only`-Regelpolitik und Hash `fnv1a:f2210868`.
- getrennte Statusketten für `imported`, `catalog_ready`, `implemented`, `engine_supported`, `human_playable`, `deck_legal`, `format_legal` und `ai_supported`.
- reviewpflichtige `requiredMechanics`, `resolverRef`, `abilityRefs` und `aiHintsRef`.
- `AiCardHintsV2` als eigene validierte Datenstruktur, abgeleitet aus manuellen Rollen, ohne automatische KI-Freigabe.
- Import-Diff-Kategorien für Text, Numeric Fields, Status, Mechaniken, Resolver, AbilityRefs, AI-Hints und Reviewstatus.
- Rollbackreport, der Match-Snapshots, Replay/StateHash und private Assets ausdrücklich unberührt lässt.
- Redaction-Prüfung gegen Tokens, FullState-/CardInstance-Felder, private Payloads, lokale private Pfade und Decklisten.

## Testabdeckung

- Source Registry v2: Schema, Reviewstatus, Nutzungsentscheidung und private lokale Quellen ohne private Pfade.
- Pipeline Snapshot: deterministische Reproduktion, stabiler Hash und committed Hash-Datei.
- Statusketten: Import/Text/Hint erzeugt keine Spielbarkeit; `deck_legal` verlangt `human_playable`; `format_legal` verlangt `deck_legal`.
- Resolver/Mechanik/Ability-Review: Engine-Status verlangt Resolver- und Ability-Vertrag; menschliche Spielbarkeit verlangt geprüfte Mechaniken.
- AI-Hints v2: Side, Kartentyp, Rollen, Planrollen, Wertebereiche, Szenarien und `ai_supported`-Grenze.
- Import-Diff: reviewpflichtige und blockierende Änderungen werden klassifiziert.
- Rollback: Rückkehr zu bekanntem Snapshot ohne Match-/Replay-/Asset-Migration.
- Reports/Redaction: Support-, Pipeline-, Diff-, Rollback- und AI-Hints-Reports bleiben frei von Tokens, privaten Pfaden, Decklisten und Hidden-Info-Feldern.
- V1.3.0-Regression: Deckvalidierung und serverseitige Matchstart-Revalidierung bleiben grün.

## Verifikation

- `corepack pnpm --filter @netgrid/catalog test`: bestanden, 14 Tests.
- `corepack pnpm --filter @netgrid/decks test`: bestanden, 12 Tests.
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`: bestanden, 59 Tests.
- `git diff --check`: bestanden.
- `corepack pnpm lint`: bestanden.
- `corepack pnpm typecheck`: bestanden.
- `corepack pnpm test`: bestanden.
- `corepack pnpm build`: bestanden, bekannte nicht-blockierende Turbopack-NFT-Warnung.
- `corepack pnpm e2e`: bestanden, 8/8 Playwright-Tests.

## Scope-Grenzen

Bestätigt:

- kein Kartentextparser,
- keine automatische Spielbarkeit aus Import, Text, Bild oder AI-Hints,
- keine neuen Kartenfreigaben,
- keine neuen Mechaniken,
- keine planbasierte KI,
- kein Belief State,
- keine FullState-Simulation,
- kein LLM als Live-Regelakteur,
- keine offiziellen Assets, Logos, Card Frames oder Card Backs,
- keine Public-Plattformfunktionen.

