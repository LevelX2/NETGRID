# NETGRID

Private NETGRID-Webapplikation für regelgeführtes, deterministisches Spiel auf Basis des Netrunner-Regelspiels, lokale Tests und private Stabilisierung.

## Aktueller Stand

Der versionierte Projektstand ist bis **V1.1.2K kleines Kartenrelease nach V1.1.2** umgesetzt und lokal verifiziert. Die führende Anschlussplanung ab V1.1.3 liegt in `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`.

Umgesetzt sind:

- Human Runner gegen Korp-KI, Human Korp gegen Runner-KI, KI-vs-KI-Simulation und privater Human-vs-Human-Multiplayer.
- Serverautoritative Rules Engine mit `LegalActions`/`PlayerActions`, `applyAction`-Revalidierung, PlayerViews, PublicEvents, Replay und StateHash.
- Lokaler Kartenkatalog, lokale Datei-Deckbibliothek, Deckeditor, validierte Deck-Snapshots und Match Setup.
- SQLite als privater lokaler Standard-Storage mit Backup/Restore und Legacy-Import.
- V0.94 bis V1.1.2 als enge Mechanik-Gates inklusive Damage/Flatline, Resources, Trace/Link/Bidding, Jack-out/Breach/Multiaccess, Identity/Modifier, Hidden-Zone-Tools, Hosting, Viren, Purge, Recurring Credits, Bad Publicity, Setup/Mulligan/Game-End, Discard/Handlimit/Core Damage und Full Archives Access.
- S01: Ergebnisfenster, regelhaftes Spielziel, private Zwei-Spiel-Serie mit Seitenwechsel und opt-in Audio.
- Ein privater, lokaler O:NR-v1-Testpool mit 52 spielbaren und decklegalen Karten über versionierte Release-Gates. Er bleibt lokal/privat und ist kein öffentlicher Kartenpool.

## Grenzen

- NETGRID ist der App- und Projektname. Netrunner bleibt als fachliche Spiel-, Quellen- und Regelreferenz erhalten.
- Die Engine bleibt die einzige Regelautorität.
- UI, Server, KI und menschliche Spieler reichen nur Actions aus `LegalActions` ein.
- Hidden Info darf nicht in PlayerViews, PublicEvents, KI-Input, WebSocket, Reconnect, Undo, Replay, Logs oder Clientfehler leaken.
- Bilder, lokale Scans und Bildmetadaten sind reine Anzeige-Artefakte. Sie dürfen Engine, KI, Decklegalität, Replay, StateHash oder Match-State nicht beeinflussen.
- Keine öffentliche Plattform: kein Matchmaking, keine Rankings, keine Accounts, keine Turniere.

## Einstieg

Für Codex-Arbeit gelten zuerst:

1. `AGENTS.md`
2. `KI-Wissen-Netrunner/00 Projektstart.md`
3. `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
4. `docs/codex/CODEX_STATUS.md`
5. `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`

Die verbindlichen Quellen liegen unter `docs/source/`. Ergänzende und abgeleitete Spezifikationen liegen unter `docs/derived/`.

## Stack

- Node 24 LTS
- pnpm Workspaces
- TypeScript strict
- Vitest
- Next.js/React für die Web-UI
- Reines TypeScript-Engine-Paket ohne UI-, Netzwerk-, Datenbank- oder KI-Abhängigkeiten
- SQLite als privater lokaler Standard-Storage

## Lokaler Start

```powershell
corepack pnpm install
corepack pnpm -F @netgrid/server dev
corepack pnpm -F @netgrid/web dev
```

Der Multiplayer-Server läuft standardmäßig unter `http://127.0.0.1:8787`. Die Weboberfläche läuft standardmäßig unter `http://127.0.0.1:3100` und nutzt `NEXT_PUBLIC_NETGRID_SERVER_URL`, falls der Server nicht auf dem Default-Port läuft. Der alte Name `NEXT_PUBLIC_NETRUNNER_SERVER_URL` bleibt als lokaler Legacy-Fallback lesbar.

Für ein privates Match im lokalen Netz:

- Host öffnet `http://127.0.0.1:3100`, erstellt ein Match und kopiert den Join-Link.
- Zweites Browserfenster oder zweiter lokaler Client öffnet den Join-Link und wählt beim Beitritt eigene gespeicherte Runner-/Korp-Decks.
- KI-Partien können in der Startansicht als Runner vs Korp-KI, Korp vs Runner-KI oder KI vs KI gestartet werden.
- Außerhalb von localhost HTTPS/WSS verwenden und Tokens wie Passwörter behandeln.
- Runtime-Storage liegt unter `data/runtime/` und ist nicht versioniert; Default ist `data/runtime/multiplayer/netgrid.sqlite`. Eine vorhandene `netrunner.sqlite` wird nur als Legacy-Import/Fallback behandelt.

## Checks

```powershell
corepack pnpm lint
corepack pnpm typecheck
corepack pnpm test
corepack pnpm build
corepack pnpm e2e
```
