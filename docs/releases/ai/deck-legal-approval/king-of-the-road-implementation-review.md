# King of the Road AI Approval Implementation Review

Datum: 2026-05-08

## Ergebnis

Der Slice macht das lokale Runner-Deck `King of the Road` als explizit auswählbares Runner-KI-Deck KI-sicher und KI-abgenommen.

Freigegeben ist ausschließlich der Runner-Snapshot `king_of_the_road_runner_ai_snapshot_v1` aus dem lokalen Datei-Deck `local_runner_adb10896`. Das Deck wird nicht in den seeded-random-KI-Deckpool aufgenommen. Ein lokales Korp-Deck wurde nicht freigegeben; die Human-Korp-vs-Runner-KI-Paarung nutzt weiterhin den Standard-Korp-KI-Snapshot `demo_corp_008_snapshot_v0_8`.

## Snapshot

Quelle war die lokale Datei-Deckbibliothek unter `%APPDATA%\NetGrid\Decks\local_runner_adb10896.json`.

Versionierter Snapshot:

- Datei: `data/decks/deck-snapshots-0.8.json`
- Snapshot-ID: `king_of_the_road_runner_ai_snapshot_v1`
- Source-Deck-ID: `local_runner_adb10896`
- Deckname: `King of the Road`
- Seite: `runner`
- Formatprofil: `netgrid_private_local_v1` Version `1.3.0`
- Card-Pool-Version: `private-local-onr-v1`
- Rules-Baseline: `rules-baseline-mvp-0.94`
- Unique Cards: 14
- Gesamtmenge: 19
- Deck-Hash: `fnv1a:23f11fed`

Die Public-Metadaten bleiben decklistenfrei.

## KI-Freigabe

Die KI-Freigabe ist absichtlich eng verdrahtet:

- `packages/catalog/src/index.ts` exportiert `KING_OF_THE_ROAD_AI_APPROVED_CARD_IDS`.
- Nur diese 14 Karten erhalten im Runtime-Katalog `ai_supported: true`.
- Alle anderen lokalen O:NR-Runtime-Karten bleiben ohne eigene Gate-Freigabe nicht `ai_supported`.
- Die historischen V1.3.1-Pipeline-Artefakte bleiben unverändert; der Slice nutzt eigene Folgeartefakte statt den V1.3.1-Hash nachtraeglich zu mutieren.

AI-Hints:

- Datei: `data/ai/ai-card-hints-king-of-the-road-ai-approval.json`
- Hints-ID: `ai-card-hints-king-of-the-road-ai-approval`
- Scope: `king_of_the_road_runner_ai_approval`
- Alle 14 eindeutigen Deckkarten haben `aiSupportStatus: "ai_supported"` und mindestens eine `scenarioRef`.

Manifest:

- Datei: `data/manifests/king-of-the-road-ai-approval-manifest.json`
- Manifest-ID: `king-of-the-road-ai-approval-manifest`
- Alle 14 Karten stehen mit `status: "ai_supported"`, Hint-Referenz und Szenario-Referenz im Manifest.

## Karten

Freigegeben wurden genau diese 14 eindeutigen Runner-Karten:

- `onr_v1_006_black-dahlia`
- `onr_v1_016_cyfermaster`
- `onr_v1_040_loony-goon`
- `onr_v1_052_raffles`
- `onr_v1_054_raptor`
- `onr_v1_060_shaka`
- `onr_v1_070_tinweasel`
- `onr_v1_072_wild-card`
- `onr_v1_073_wizards-book`
- `onr_v1_079_bodyweight-synthetic-blood`
- `onr_v1_095_jack-n-joe`
- `onr_v1_097_livewires-contacts`
- `onr_v1_108_score`
- `onr_v1_145_wutech-mem-chip`

## Runner-KI-Szenarien

Neue Szenario-Datei:

- `data/scenarios/ai-kotr-runner-approval-smokes.json`

Abgedeckte Szenariospuren:

- Rig-Aufbau: Breaker, MU und Programminstallation bevorzugen spielbare Boardentwicklung.
- Economy/Draw: Economy- und Draw-Karten werden vor schwachen Runs priorisiert, wenn die sichtbare Lage das verlangt.
- Run-Pressure: Die Runner-KI kann mit dem Deck legale Druckplaene auf zentrale Server erzeugen.
- Negativlauf: Sichtbar schlechte Runs in Stopper werden vermieden bzw. in sichere Alternativen umgelenkt.
- Hidden-Info-Safety: Szenario- und DecisionDebug-Pruefungen duerfen keine verdeckten Karteninstanzen, Decklisten, Token, lokale Pfade oder private Payload-Felder enthalten.

## Matchstart

Der Server-Matchstart wurde fuer `human_corp_vs_runner_ai` mit explizit ausgewähltem Runner-KI-Snapshot abgesichert:

- Runner-KI: `king_of_the_road_runner_ai_snapshot_v1`
- Korp-Seite: menschlich
- Korp-KI-/Standard-Pairing-Snapshot: `demo_corp_008_snapshot_v0_8`
- Public Match-Deck-Metadaten bleiben ohne Deckliste und ohne private Kartendaten.

## Tests

Gezielte Regressionen:

- `corepack pnpm --filter @netgrid/catalog test`
- `corepack pnpm --filter @netgrid/decks test`
- `corepack pnpm --filter @netgrid/ai test`
- `corepack pnpm --filter @netgrid/server test -- multiplayer.test.ts`
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`

Pflicht-Gates:

- `corepack pnpm lint`
- `corepack pnpm typecheck`
- `corepack pnpm test`
- `corepack pnpm build`

Alle vier Pflicht-Gates bestanden am 2026-05-08. Der Build meldete nur die bekannte nicht-blockierende Turbopack-NFT-Warnung aus der bestehenden Kartenkatalog-Route.

## Bewusste Grenzen

Nicht Teil des Slice:

- kein lokales Korp-Deck freigeben
- keine pauschale O:NR-KI-Freigabe
- keine neuen Mechaniken
- kein Kartentextparser
- kein Belief State
- keine FullState-Simulation
- keine offiziellen Assets
- keine Public-Plattformfunktionen
- keine Aufnahme in seeded-random-KI-Deckpools

## Bekannte Grenzen

`King of the Road` ist abgenommen als explizit auswählbarer Runner-KI-Snapshot. Die Freigabe ist kein allgemeiner Beweis, dass beliebige lokale Runner-Decks oder alle O:NR-Karten KI-sicher sind. Weitere lokale Decks brauchen eigene Snapshots, AI-Hints, Szenarien, Manifest-Gates und Hidden-Info-Regressionen.
