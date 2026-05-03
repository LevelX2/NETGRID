# Log

## [2026-05-03] setup | Projektumgebung initial eingerichtet

Die Projektumgebung für `Netrunner` wurde als lokales Git-Projekt ohne Remote vorbereitet. Angelegt wurden Root- und bereichsspezifische `AGENTS.md`-Dateien, die lokale KI-Wissensbasis `KI-Wissen-Netrunner/`, die erwartete `docs`-/`data`-/`packages`-/`apps`-/`tests`-/`scripts`-Struktur, Monorepo-Metadaten und `docs/codex/CODEX_STATUS.md`.

Bewusste Setup-Entscheidung: `data/` wird nicht pauschal ignoriert, weil Netrunner dort versionierte Regeln, Karten, Decks, Manifeste, Abweichungen und Szenarien erwartet. Ignoriert werden nur lokale Datenbanken, Runtime-Daten und temporäre Artefakte.

Offener Punkt zum Zeitpunkt des Initialsetups: `docs/source/Erstes Testdeck.txt` fehlte als separat benannte Primärquelle. Die konsolidierte MVP-0.1-Fassung enthielt bereits Demo-Deck-Abschnitte.

Lokaler Werkzeughinweis: Beim Setup war Node `v24.15.0` aktiv. Die ursprüngliche Setup-Vorgabe Node 22 wurde nach Prüfung am 2026-05-03 auf Node 24 LTS korrigiert. `pnpm` war nicht im PATH, `corepack` war vorhanden. `.nvmrc` und `.node-version` wurden auf Zielversion `24` umgestellt.

## [2026-05-03] entscheidung | Node-Zielversion auf 24 LTS umgestellt

Die Projektumgebung wurde von Node 22 auf Node 24 LTS umgestellt, weil Node 24 die aktuelle LTS-Linie ist und für das neue Netrunner-Projekt keine Altlasten gegen diese Wahl sprechen. Angepasst wurden `.nvmrc`, `.node-version`, `package.json`, Root- und Codex-Dokumentation sowie die lokalen Wissensseiten. `pnpm` bleibt als Paketmanager vorgesehen; die lokale Bereitstellung soll vor der ersten Dependency-Installation über Corepack oder eine bewusst gewählte lokale Toolchain erfolgen.

## [2026-05-03] quelle | Erstes Demo-Deck-Paket einsortiert

Das nachgereichte Paket `docs/netrunner_erste_demo_decks_v0_1/` wurde in die Projektstruktur überführt. Die Textquelle liegt jetzt als `docs/source/Erstes Testdeck.txt`, die Markdown-Fassung als `docs/source/Erstes Testdeck.md`, und die strukturierte JSON-Fassung als `data/decks/demo-decks.json`. Der alte Sammelordner wurde nach dem Verschieben der Dateien entfernt. Die JSON-Datei ist damit verfügbar, aber noch nicht als geprüfter Derived-Requirements-Stand eingefroren.

## [2026-05-03] toolchain | Lokale Codex-Goal-Funktion aktiviert

Die lokale Codex-Konfiguration wurde um den Feature-Schalter für persistente Goals ergänzt. Für Netrunner ist `/goal` sinnvoll, weil das Projekt im Runbook in klar getrennte, gate-basierte Phasen aufgeteilt ist: Setup, MVP-0.1-Requirements, Review, Implementation, Hardening und später MVP 0.2. Goals ersetzen dabei nicht `AGENTS.md`, `CODEX_STATUS.md` oder die Wissensbasis, sondern halten den mehrstufigen Arbeitsauftrag über längere Codex-Sitzungen stabil.

## [2026-05-03] vorbereitend | Neuer Thread für Requirements-Phase vorbereitet

Vor dem Start eines neuen Threads wurde der Arbeitsbranch `codex/mvp-0-1-requirements` vorbereitet. Netrunner wurde zusätzlich in der lokalen Codex-Konfiguration als vertrauenswürdiges Projekt eingetragen. Die Paketmanager-Prüfung ergab: `corepack pnpm --version` nutzt `pnpm@10.33.2`, während der direkte `pnpm`-Befehl in der aktuellen Shell noch nicht im PATH verfügbar war. Für den nächsten Thread ist deshalb `corepack pnpm ...` der robuste Einstieg, falls ein späterer Schritt Paketmanager-Befehle benötigt.

## [2026-05-03] phase-1 | MVP 0.1 Requirements abgeleitet

Die Phase `MVP 0.1 executable requirements` wurde auf dem Branch `codex/mvp-0-1-requirements` aus den priorisierten Quellen abgeleitet. Entstanden sind reviewfähige Derived-Dokumente für Requirements, Engine-API, GameState, Timing/Run-Modell, Deviation Registry, Acceptance Criteria, Testmatrix, offene Fragen, Konflikte und Requirements Review. Zusätzlich wurden versionierte JSON-Artefakte für RulesBaseline, Demo-Karten, Demo-Decks, Card-Manifest, Regelabweichungen und sechs Szenario-Fixtures erstellt.

Gate-Ergebnis: `ready_for_implementation: true`. Lokale Checks: JSON-Parse aller neuen Datenartefakte erfolgreich, alle 42 Must-Requirements mit Test-/Szenarioabdeckung, alle 13 `playable_mvp`-Karten mit Unit- und Szenario-/Integrationstest-Zuordnung. MVP 0.2 wurde nur für Zukunftskompatibilität gelesen und bleibt bis zum bestandenen MVP-0.1-Gate gesperrt.

## [2026-05-03] phase-2 | MVP 0.1 lokal implementiert

Die Phase `MVP 0.1 implementation` wurde als erster spielbarer lokaler Stand umgesetzt. Implementiert wurden Shared Types und Demo-Kartenkonstanten, eine reine TypeScript-Engine mit deterministischem Setup, LegalActions, `applyAction`-Revalidierung, GameState-Invarianten, Run/Encounter/Access/Score-Kern, PlayerViews, PublicEvents, Replay und StateHash. Ergänzt wurden eine einfache Corp-KI, eine minimale lokale Server-Adapter-Schicht und eine Next.js-Weboberfläche für Human Runner gegen Corp-KI.

Checks: `corepack pnpm install`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Der Testlauf umfasst Engine-, KI- und Artefakt-/Szenario-Vertragstests. Die lokale Weboberfläche antwortete auf `http://127.0.0.1:3000`. Nächster Schritt ist Phase 3: Validierung, Hardening, Dokumentation und MVP-0.1-Finalreview.

## [2026-05-03] phase-3 | MVP 0.1 validiert und gehärtet

Die Phase `MVP 0.1 validation, hardening and documentation` wurde abgeschlossen. Beim Hardening wurde ein hohes Hidden-Info-Risiko gefunden: Die erste Browser-UI führte die Engine direkt im Client aus und hielt dadurch den vollständigen GameState im Browser. Das wurde behoben, indem der GameState in eine serverseitige Next-API verschoben wurde. Die Browserseite nutzt jetzt nur noch `/api/game` und erhält Runner-PlayerView, LegalActions, PublicEvents und `canRunCorp`.

Checks: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` mit 18 Tests, `corepack pnpm build` und Web-API-Smoke bestanden. Der API-Smoke bestätigte, dass `/api/game` keine `cardInstances`, keine versteckte `Simple Agenda` und kein unrezzed `Simple Barrier ICE` ausliefert. Dokumentiert wurden `docs/derived/MVP_0.1_FINAL_REVIEW.md` und `docs/derived/MVP_0.2_READINESS_REVIEW.md`.

Gate-Ergebnis: `MVP_0.1_done: true`; `ready_for_MVP_0.2_requirements: true`. MVP 0.2 darf als Requirements-Phase beginnen, aber noch nicht implementiert werden.
