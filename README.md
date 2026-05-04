# Netrunner

Private Netrunner-Webapplikation für regelgeführtes, deterministisches Spiel, lokale Tests und spätere private Stabilisierung.

## Aktueller Stand

Der versionierte Projektstand ist bis **V1.0 Deck- und Match-Setup-Stabilisierung** umgesetzt und lokal grün geprüft.

Umgesetzt sind:

- Human Runner gegen Corp-KI, Human Corp gegen Runner-KI, KI-vs-KI-Simulation und privater Human-vs-Human-Multiplayer.
- Serverautoritative Rules Engine mit `LegalActions`/`PlayerActions`, `applyAction`-Revalidierung, PlayerViews, PublicEvents, Replay und StateHash.
- Lokaler Kartenkatalog, lokaler Deckeditor, validierte Deck-Snapshots und Match Setup.
- V0.94 bis V0.99 als enge Mechanik-Gates: Damage/Flatline, Resources, Trace/Link/Bidding, Jack-out/Breach/Multiaccess, Identity/Modifier, Hidden-Zone-Tools, Hosting, Viren, Purge, Recurring Credits und Bad Publicity.
- S01: Ergebnisfenster, Spielziel-Auswahl, private Zwei-Spiel-Serie mit Seitenwechsel und opt-in Audio.
- V1.0: explizite Deckslots für Teilnehmer A/B mit Runner-/Corp-Deckpaaren, stabile Serien-Deckzuordnung über Seitenwechsel, KI-Deckpolitik `fixed`/`selected`/`seeded_random` und validierte Matchstart-Deckauswahl.
- Eine lokale, nicht versionierte O:NR-v1-Testumgebung ist für privaten Gebrauch in den erlaubten lokalen Datenpool aufgenommen. Sie nutzt ignorierte Daten unter `data/local/` und `data/local-assets/`, bleibt privat/lokal und ist kein öffentlicher oder versionierter Kartenpool.

Die aktuelle Bestandsaufnahme liegt unter `docs/derived/BESTANDSAUFNAHME_2026-05-04.md`.
Der V1.0-Plan und Final Review liegen unter `docs/derived/V1_0_DECK_MATCH_STABILIZATION_PLAN.md` und `docs/derived/V1_0_DECK_MATCH_STABILIZATION_FINAL_REVIEW.md`.

## Wichtige Grenzen

- Die Engine bleibt die einzige Regelautorität.
- UI, Server, KI und menschliche Spieler reichen nur Actions aus `LegalActions` ein.
- Hidden Info darf nicht in PlayerViews, PublicEvents, KI-Input, WebSocket, Reconnect, Undo, Replay, Logs oder Clientfehler leaken.
- Bilder, lokale Scans und Bildmetadaten sind reine Anzeige-Artefakte. Sie dürfen Engine, KI, Decklegalität, Replay, StateHash oder Match-State nicht beeinflussen.
- Keine öffentliche Plattform: kein Matchmaking, keine Rankings, keine Accounts, keine Turniere.
- Nicht allgemein umgesetzt sind unter anderem Mulligan, vollständiges Setup-/Deckout-/Archives-Modell, Prevention, Avoid, Interrupt, Replacement, Set Aside, Remove from Game, Ownership-/Control-Wechsel und vollständige offizielle Deckbuilding-/Formatregeln.

## Einstieg

Für Codex-Arbeit gelten zuerst:

1. `AGENTS.md`
2. `KI-Wissen-Netrunner/00 Projektstart.md`
3. `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
4. `docs/codex/CODEX_STATUS.md`
5. `docs/derived/BESTANDSAUFNAHME_2026-05-04.md`

Die verbindlichen Quellen liegen unter `docs/source/`. Ergänzende und abgeleitete Spezifikationen liegen unter `docs/derived/`.

## Stack

- Node 24 LTS
- pnpm Workspaces
- TypeScript strict
- Vitest
- Next.js/React für die Web-UI
- Reines TypeScript-Engine-Paket ohne UI-, Netzwerk-, Datenbank- oder KI-Abhängigkeiten
- JSON-Storage im aktuellen privaten Stand; SQLite bleibt ein späterer Härtungskandidat

## Lokaler Start

```powershell
corepack pnpm install
corepack pnpm -F @netrunner/server dev
corepack pnpm -F @netrunner/web dev
```

Der Multiplayer-Server läuft standardmäßig unter `http://127.0.0.1:8787`. Die Weboberfläche läuft standardmäßig unter `http://127.0.0.1:3000` und nutzt `NEXT_PUBLIC_NETRUNNER_SERVER_URL`, falls der Server nicht auf dem Default-Port läuft.

Für ein privates Match im lokalen Netz:

- Host öffnet `http://127.0.0.1:3000`, erstellt ein Match und kopiert den Join-Link.
- Zweites Browserfenster oder zweiter lokaler Client öffnet den Join-Link.
- KI-Partien können in der Startansicht als Runner vs Corp-KI, Corp vs Runner-KI oder KI vs KI gestartet werden.
- Außerhalb von localhost HTTPS/WSS verwenden und Tokens wie Passwörter behandeln.
- Runtime-Storage liegt unter `data/runtime/` und ist nicht versioniert; bei längerer Nutzung regelmäßig sichern.

## Checks

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
```

Zuletzt geprüft am 2026-05-04:

- `corepack pnpm lint`: bestanden.
- `corepack pnpm typecheck`: bestanden.
- `corepack pnpm test`: bestanden, 175 Tests inklusive Web-Chronicle-Test, V1.0-Deckserien-/KI-Policy-Smokes, O:NR-AI-/Multiplayer-Smokes, Pakettests und Root-Specs.
- `corepack pnpm build`: bestanden. Die frühere Turbopack-NFT-Warnung zur `card-images`-Route ist durch feste repo-relative Datenpfade behoben.

## Nächste Entscheidungen

V1.0 ist abgeschlossen. Vor neuer Karten- oder Mechanikbreite sollte der nächste Scope wieder als eigenes Gate festgelegt werden:

- Weitere Karten oder offizielle Mechaniken nur mit eigenem Resolver-, Manifest-, Visibility-, Replay/StateHash-, AI- und Multiplayer-Gate.
- Vollständige offizielle Deckbuilding-/Formatregeln, Accounts, Cloud-Decks, öffentliche Decklisten, Matchmaking, Rankings und Turnierlegalität bleiben außerhalb von V1.0.
