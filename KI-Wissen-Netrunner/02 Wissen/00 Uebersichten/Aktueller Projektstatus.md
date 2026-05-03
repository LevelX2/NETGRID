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
- MVP 0.2 private Multiplayer-Implementierung wurde umgesetzt: REST-Start/Join/Reconnect/Bootstrap, WebSocket-Protokoll, JSON-Storage-Port, Hash-only Tokens, per-Match-Lock, Idempotency, Reconnect, Undo-Barrieren, Multiplayer-Tests und Next.js-Host/Join-UI.
- MVP 0.2 Implementierungschecks sind grün: `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm build`, Server-Health-Smoke, REST/WebSocket-Smoke und Next-Web-Smoke.
- MVP 0.2 Implementierungsgate ist bestanden: `ready_for_hardening: true`.
- MVP 0.2 Validierung und Hardening wurden abgeschlossen. Gehärtet wurden Snapshot-/Undo-Semantik, WebSocket-Reconnect-Ersetzung und REST-Settings-Eingaben.
- MVP 0.2 Final Gate ist bestanden: `MVP_0.2_done: true`.
- Die Roadmap nach MVP 0.2 wurde konsolidiert. V0.3 ist als KI- und Simulationsphase eingeordnet; Kartenpool und Regelbreite folgen in V0.4.
- Der detaillierte V0.3-Plan liegt vor: Runner-KI, Corp-KI v2, KI-vs-KI, Controller-Modell, Erklärmodus, Simulationstests und AI-Visibility-Gates.
- Der detaillierte V0.4-Plan liegt vor: kontrollierte Kartenpool- und Regelbreite-Erweiterung mit Safe Card Batch, eingeschränkter Deckvalidierung, Tags als bevorzugter erster Regelgruppe und Damage nur als eigenes Teilgate.
- MVP 0.3 wurde umgesetzt und final geprüft: side-neutrale AI-Inputs, Runner-KI, Corp-KI v2, KI-vs-KI-Simulation, Server-AI-Modi, AI-vs-AI-Simulations-API und Web-UI-Moduswahl.
- MVP 0.3 Final Gate ist bestanden: `MVP_0.3_done: true`; nächster Gate-Schritt ist MVP 0.4 Requirements.
- MVP 0.4 wurde umgesetzt und final geprüft: versionierte 0.4-Artefakte, kleiner interner Kartenpool, V0.4-Demo-Decks, kuratierte Deckvalidierung, Hardware, einfaches Upgrade, Tags, Remove-Tag, Tag-Punishment und V0.4-AI-Simulation.
- MVP 0.4 Final Gate ist bestanden: `MVP_0.4_done: true`; der nächste Schritt braucht eine neue Scope-Entscheidung.
- Die Post-MVP-0.4-Roadmap wurde neu geschnitten: V0.5 Kartenimport/Kartenkatalog, V0.6 Deckeditor- und Match-Setup-Fundament, V0.7 UI-Neugestaltung und Designgestaltung, V0.8 Basisset-/Starterset-Spielbarkeit, V0.9 bessere KI.
- Die detaillierten Planungen für V0.5 und V0.6 liegen vor, inklusive Bausteinen, Teststrategien, Härtungen, Optimierungen und Done-Kriterien.
- Für die spätere UI-Neugestaltung liegen explorative Designsets und eine Realismusprüfung unter `docs/ui-designsets/` vor. Vorzugsrichtung: Design C als Hauptstruktur, Design D als Run-/Encounter-Fokus, Design B als Diagnose-Drawer.
- MVP 0.5 Requirements wurden eingefroren: Kartenimport-Spezifikation, Katalog-Spezifikation, Statusmodell, Testmatrix, Requirements Review, lokaler Snapshot, Import-Report, Katalogindex und Statusmanifest liegen vor.
- MVP 0.5 Requirements Gate ist bestanden: `ready_for_implementation: true`. Der Snapshot nutzt nur lokale versionierte Demo-/Projektdaten plus fiktive lokale Katalog-Fixtures; Import bleibt strikt getrennt von Spielbarkeit.

## Teilweise umgesetzt

- Primäre Quellen wurden nach `docs/source/` kopiert, soweit vorhanden.
- Ergänzende Dokumente liegen weiterhin unter `docs/` und sind als zusätzliche Arbeitsgrundlagen bekannt.
- Die Paketmanifeste, Framework-Abhängigkeiten und Workspace-Skripte sind für den aktuellen MVP-0.2-Stand funktionsfähig.
- Lokaler Werkzeugcheck ergab Node `v24.15.0`; das passt zur Projektentscheidung für Node 24 LTS. `corepack pnpm --version` liefert `10.33.2`; der direkte `pnpm`-Befehl war in der aktuellen Shell nicht im PATH.
- Das nachgereichte Demo-Deck-Paket wurde einsortiert: `docs/source/Erstes Testdeck.txt`, `docs/source/Erstes Testdeck.md` und `data/decks/demo-decks.json`.
- Die lokale Codex-Goal-Funktion wurde aktiviert und ist für die nächsten mehrphasigen Netrunner-Schritte vorgesehen.
- Netrunner wurde in der lokalen Codex-Konfiguration als vertrauenswürdiges Projekt eingetragen.
- Der historisch vorbereitete Arbeitsbranch `codex/mvp-0-1-requirements` enthält inzwischen nicht mehr den nächsten fachlichen Einstieg; aktueller Einstieg ist V0.3 Requirements.

## Offen

- Kein gate-basierter MVP-0.1/0.2/0.3/0.4-Arbeitsschritt ist offen.
- Der nächste gate-basierte Schritt ist MVP 0.5 Implementierung: `packages/catalog`, deterministische Import-/Kataloglogik, read-only Katalog-API und funktionale Katalogansicht.
- Damage bleibt aktuell zurückgestellt und ist nicht Teil des bestandenen MVP-0.4-Scopes.
- V0.2.1-Härtung bleibt ein optionaler Nachlaufstrang für Storage-/SQLite-Entscheidung, screenshotbasierte UI-Smokes und privaten Betrieb.
- UI-Neugestaltung und Designgestaltung sind bewusst V0.7 zugeordnet. Die erste Designanalyse liegt vor, ist aber noch keine verbindliche UI-Spezifikation.
- V0.5 darf keine Karte automatisch spielbar machen; V0.6 darf keinen Matchstart ohne validierte Deck-Snapshots erlauben.
- V0.5-Importdaten dürfen keine Engine-, KI-, Deckvalidierungs- oder Matchstart-Freigabe auslösen. `deck_legal` setzt `playable` voraus.
- Vor weiteren technischen Schritten Node 24 LTS verwenden und bei Bedarf `corepack pnpm ...` statt direktem `pnpm` nutzen.

## Wichtige Grenzen

- MVP 0.1 und MVP 0.2 sind abgeschlossen; spätere Änderungen dürfen deren Gates nicht durch Scope-Ausweitung aufweichen.
- MVP 0.2 bleibt auf privaten Multiplayer begrenzt; öffentliche Plattformfunktionen brauchen eine spätere explizite Scope-Entscheidung.
- MVP 0.3 erweitert keine Karten und keine offiziellen Mechaniken; KI darf nur aus `LegalActions`, PlayerViews und side-gefilterten Events entscheiden.
- MVP 0.4 darf Karten und Mechaniken nur kontrolliert erweitern: interne fiktive Karten, Manifestpflicht, Testpflicht, Visibility-Gates und keine offiziellen Assets oder externen Kartendatenbanken. Damage bleibt vorerst außerhalb des Hauptscopes.
- `data/` ist hier nicht pauschal ignoriert, weil es versionierte Regeln, Karten, Decks, Manifeste, Abweichungen und Szenarien aufnehmen soll.
