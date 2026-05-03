# Aktueller Projektstatus

## Umgesetzt

- Projektordner unter `C:\Projekte\Netrunner` vorhanden.
- Repository-Setup-Struktur und Codex-Führungsdateien angelegt.
- Lokale KI-Wissensbasis `KI-Wissen-Netrunner/` angelegt.
- Monorepo-Hülle mit pnpm Workspace, Root-`package.json`, TypeScript-Basiskonfiguration und Vitest-Basiskonfiguration angelegt.
- Erwartete Ordner für `docs/source`, `docs/codex`, `docs/derived`, `data`, `packages`, `apps`, `tests` und `scripts` angelegt.
- Root- und bereichsspezifische `AGENTS.md`-Dateien angelegt.
- Git-Modell festgelegt: lokales Git ohne Remote, Integrationsbranch `main`.
- MVP 0.1 Requirements wurden aus den priorisierten Quellen abgeleitet und als reviewfähige Derived-Artefakte eingefroren.
- Versionierte MVP-0.1-Datenartefakte für RulesBaseline, Demo-Karten, Demo-Decks, Card-Manifest, Abweichungen und sechs Szenarien liegen vor.
- Phase-1-Gate ist bestanden: `ready_for_implementation: true`.
- MVP 0.1 wurde in einer ersten lokalen spielbaren Fassung implementiert: Shared Types, reine Engine, LegalActions/PlayerActions, PlayerViews, EventLog, Replay/StateHash, einfache Corp-KI, minimale Next.js-UI und lokale Server-Kompatibilität.
- Phase-2-Checks sind grün: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`; lokaler Web-Smoke auf `http://127.0.0.1:3000` antwortet.
- Phase 3 Hardening ist abgeschlossen. Ein Full-State-Leak-Risiko in der ersten Browser-UI wurde behoben: Der GameState liegt jetzt serverseitig in der Next-API, der Browser erhält nur Runner-PlayerView-Payloads.
- MVP 0.1 ist final reviewt: `MVP_0.1_done: true`, `ready_for_MVP_0.2_requirements: true`.
- MVP 0.2 Requirements wurden abgeleitet: REST, WebSocket-Protokoll, Storage, Token/Sessions, Reconnect, Undo, Testmatrix, Baseline 0.2 und Multiplayer-Szenarien.
- MVP 0.2 Requirements Gate ist bestanden: `ready_for_implementation: true`.

## Teilweise umgesetzt

- Primäre Quellen wurden nach `docs/source/` kopiert, soweit vorhanden.
- Ergänzende Dokumente liegen weiterhin unter `docs/` und sind als zusätzliche Arbeitsgrundlagen bekannt.
- Paketmanifeste sind bewusst minimal und enthalten noch keine Framework-Abhängigkeiten für Web, Server oder Engine-Implementierung.
- Lokaler Werkzeugcheck ergab Node `v24.15.0`; das passt zur Projektentscheidung für Node 24 LTS. `corepack pnpm --version` liefert `10.33.2`; der direkte `pnpm`-Befehl war in der aktuellen Shell nicht im PATH.
- Das nachgereichte Demo-Deck-Paket wurde einsortiert: `docs/source/Erstes Testdeck.txt`, `docs/source/Erstes Testdeck.md` und `data/decks/demo-decks.json`.
- Die lokale Codex-Goal-Funktion wurde aktiviert und ist für die nächsten mehrphasigen Netrunner-Schritte vorgesehen.
- Netrunner wurde in der lokalen Codex-Konfiguration als vertrauenswürdiges Projekt eingetragen.
- Der vorbereitete Arbeitsbranch für den nächsten Thread ist `codex/mvp-0-1-requirements`.

## Offen

- MVP 0.2 Implementierung steht als nächste Phase aus.
- Vor weiteren technischen Schritten Node 24 LTS verwenden und bei Bedarf `corepack pnpm ...` statt direktem `pnpm` nutzen.
- MVP 0.2 bleibt gesperrt, bis MVP 0.1 implementiert, validiert und gehärtet ist.

## Wichtige Grenzen

- In Phase 2 darf nur MVP-0.1-Scope implementiert werden.
- MVP 0.2 darf nicht vor bestandenem oder ausdrücklich dokumentiertem MVP-0.1-Gate begonnen werden.
- `data/` ist hier nicht pauschal ignoriert, weil es versionierte Regeln, Karten, Decks, Manifeste, Abweichungen und Szenarien aufnehmen soll.
