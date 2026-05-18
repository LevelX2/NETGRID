# MVP 0.6 Implementation Review

Stand: 2026-05-03

## Ergebnis

MVP 0.6 Deck Editor und Match Setup Foundation sind implementiert und lokal gezielt geprüft.

`ready_for_hardening: true`

## Implementierter Scope

- Neues reines TypeScript-Paket `@netgrid/decks` für editierbare Decks, Templates, Validierung v2, deterministische Snapshots, Deckhashes, Import/Export und Engine-Deck-Übergabe.
- Server-seitige Matchstart-Revalidierung validierter, unveränderlicher Deck-Snapshots für Human-vs-Human, Human-vs-KI und KI-vs-KI-Pfade.
- Engine-Unterstützung für allgemeine Deckdefinitionen jenseits von `DemoDeckId` sowie erlaubte öffentliche Deckmetadaten in `PlayerView`.
- AI-Simulation kann validierte Snapshot-Decks übergeben bekommen, ohne FullState oder gegnerische Hidden Info zu erhalten.
- Web-API für Deck-Templates, Deck-Snapshots und lokale Deckvalidierung.
- Funktionale Web-Oberfläche für Match-Deckauswahl, lokale Deckkopien, Mengenbearbeitung, Validierung, Snapshot-Erzeugung, Import/Export und Nutzung eines validierten lokalen Snapshots im Match Setup.

## Gate-Prüfung

- Importierte, aber nicht spielbare Karten werden in spielbaren Decks blockiert.
- Matchstart nutzt nur validierte immutable Snapshots; der Server revalidiert Hash, Side, Identity, Kartenstatus, Mengen, Agenda Points und Formatprofil.
- Gegnerische Decklisten bleiben aus Match-, Bootstrap- und WebSocket-Payloads heraus. Erlaubt bleiben nur Side, Identity, Deckname, Kartenpool-/Formatprofil und Deckhash.
- Deck-Snapshots sind unveränderliche Objekte; spätere Änderungen am editierbaren Deckentwurf ändern bereits erzeugte Snapshots nicht.
- V0.7 UI-Neugestaltung wurde nicht umgesetzt.

## Tests

- `corepack pnpm --filter @netgrid/decks test`: pass.
- `corepack pnpm --filter @netgrid/server test`: pass.
- `corepack pnpm --filter @netgrid/ai test`: pass.
- `corepack pnpm --filter @netgrid/engine test`: pass.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`: pass.
- `corepack pnpm --filter @netgrid/server typecheck`: pass.
- `corepack pnpm --filter @netgrid/web typecheck`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.
- Deck API smoke on `http://127.0.0.1:3002/api/decks/snapshots`: pass, 4 snapshots, V0.6 hashes valid.
- Deck validation smoke on `http://127.0.0.1:3002/api/decks/validate`: pass, local Runner snapshot hash generated.
- Matchstart API smoke on `http://127.0.0.1:8797/api/matches`: pass, V0.6 snapshot match used baseline `0.4.0`, public deck hashes and no Corp decklist leak.
- Browser smoke on `http://127.0.0.1:3002`: pass, local deck copy created, validated, set for match and used in Match Setup.

## Annahmen

- Lokale Deckdaten werden für V0.6 im Browser `localStorage` gespeichert; Session-Tokens bleiben weiterhin ausschließlich in `sessionStorage`.
- Die versionierten Demo-Snapshots bleiben die reproduzierbare Basis. Lokale Decks müssen vor Matchstart zu Snapshots validiert werden.
- Vollständige Turnierlegalität, Rotation, Banlisten und Influence bleiben außerhalb von V0.6.

## Risiken und Nachlauf

- Vor dem V0.6-Finalgate sind noch volle Workspace-Checks, Browser-Smoke für Deckeditor und Matchstart sowie Final Review erforderlich.
- Private lokale Deckdaten sind bewusst nicht versioniert und nicht cloud-synchronisiert.
