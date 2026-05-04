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

## [2026-05-03] phase-0.2-req | MVP 0.2 Requirements abgeleitet

Nach bestandenem MVP-0.1-Gate wurden die Requirements für MVP 0.2 abgeleitet. Der Scope bleibt private Human-vs-Human-Partie über dieselbe Engine und unveränderte Demo-Decks. Erstellt wurden Spezifikationen für MVP-0.2-Requirements, REST API, WebSocket-Protokoll, Storage, Token-/Session-Security, Reconnect/Undo, Multiplayer-Testmatrix, Requirements Review, Baseline `0.2.0` und vier Multiplayer-Szenarien.

Checks: JSON-Parse aller MVP-0.2-Datenartefakte erfolgreich, alle 24 Must-Requirements mit Testabdeckung, `corepack pnpm typecheck` und `corepack pnpm test` bestanden. Gate-Ergebnis: `ready_for_implementation: true`. MVP 0.2 darf im privaten Multiplayer-Scope implementiert werden; Kartenpool-Erweiterung bleibt gesperrt.

## [2026-05-03] phase-0.2-impl | MVP 0.2 private Multiplayer-Implementierung umgesetzt

Die MVP-0.2-Implementierung wurde innerhalb des freigegebenen privaten Multiplayer-Scopes umgesetzt. Entstanden sind REST-Endpunkte für Match-Erstellung, Join, Reconnect und Bootstrap, ein WebSocket-Protokoll für `join_match`, `submit_action`, Undo und Statusupdates, ein Storage-Port mit In-Memory- und JSON-File-Adapter, Hash-only Tokenpersistenz, MatchVersion/MatchStatus, per-Match-Lock, Idempotency, side-gefilterte Payloads und eine Next.js-UI für Host/Join, Join-Link, Actions, Connection-Banner und Undo.

Checks: `corepack pnpm --filter @netrunner/server test` mit 7 Multiplayer-Tests, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm lint`, `corepack pnpm build`, Health-Smoke auf `http://127.0.0.1:8787/health`, REST/WebSocket-Smoke mit create/join/mandatory action und Runner-Leak-Scan, sowie Next-Web-Smoke auf `http://127.0.0.1:3000`. Gate-Ergebnis: `ready_for_hardening: true`. Nächster Schritt ist MVP-0.2-Validierung und Hardening.

## [2026-05-03] phase-0.2-final | MVP 0.2 validiert und final gehärtet

Die MVP-0.2-Finalphase wurde abgeschlossen. Im Hardening wurden die Snapshot-/Undo-Semantik bereinigt, sodass Action-Snapshots in `stateSnapshots` und echte Undo-Anfragen in `undoSnapshots` liegen. Zusätzlich wurde die WebSocket-Reconnect-Ersetzung gehärtet: Das Close-Event einer ersetzten Verbindung kann die neue Verbindung nicht mehr als offline markieren. REST-Settings übernehmen `agendaPointsToWin` nur noch als Zahl.

Finale Checks: `corepack pnpm --filter @netrunner/server test`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`, Server-Health-Smoke, REST/WebSocket-Smoke und Next-Web-Smoke bestanden. Dokumentiert wurde `docs/derived/MVP_0.2_FINAL_REVIEW.md`. Gate-Ergebnis: `MVP_0.2_done: true`.

## [2026-05-03] planung | Roadmap nach MVP 0.2 und V0.3-Plan konsolidiert

Die Roadmap nach MVP 0.2 wurde aus den vorhandenen Quellen, Derived-Artefakten und Entwicklungserkenntnissen konsolidiert. Ein Quellenkonflikt wurde aufgelöst: V0.3 wird als KI- und Simulationsphase geführt; Kartenpool und Regelbreite wandern in V0.4. Begründung ist, dass KI-vs-KI, Runner-KI, verbesserte Corp-KI und Simulationstests die Regressionsbasis stärken, bevor neue Karten und Mechaniken hinzukommen.

Erstellt wurden `docs/derived/POST_MVP_0.2_ROADMAP.md` und `docs/derived/MVP_0.3_DETAILED_PLAN.md`. Die lokale Wissensbasis wurde um `Roadmap nach MVP 0.2` ergänzt. Nächster empfohlener Gate-Schritt ist `MVP 0.3 Requirements Freeze`; Implementierung bleibt bis zu `ready_for_implementation: true` gesperrt.

## [2026-05-03] planung | V0.4 Kartenpool und Regelbreite detailliert geplant

Die Phase V0.4 wurde als kontrollierte Kartenpool- und Regelbreite-Erweiterung detailliert geplant. V0.4 bleibt durch V0.3 gegatet, damit Runner-KI, Corp-KI v2, KI-vs-KI-Simulation und AI-Visibility vor neuen Karten als Regressionsbasis bereitstehen. Der Plan staffelt V0.4 in Requirements/Baseline, Card-System-Härtung, Safe Card Batch, eingeschränkte Deckvalidierung, Tags als bevorzugte erste neue Regelgruppe und Damage nur als eigenes Teilgate oder V0.4.x.

Erstellt wurde `docs/derived/MVP_0.4_DETAILED_PLAN.md`. Aktualisiert wurden die Post-MVP-Roadmap, das Roadmap-Arbeitsdokument, `CODEX_STATUS.md` und die lokale Wissensbasis.

## [2026-05-03] phase-0.3-final | MVP 0.3 KI und Simulation abgeschlossen

MVP 0.3 wurde requirements-gefroren, implementiert, getestet und final reviewt. Umgesetzt wurden side-neutrale AI-Inputs, Runner-KI, Corp-KI v2, deterministische KI-Entscheidungen mit Reason-Codes, KI-vs-KI-Simulation mit Replay/StateHash, Servermodi für Human-vs-KI in beide Richtungen, eine lokale AI-vs-AI-Simulations-API und eine Web-UI-Moduswahl.

Checks: `corepack pnpm --filter @netrunner/ai test`, `corepack pnpm --filter @netrunner/server test`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm lint` und `corepack pnpm build` bestanden. Gate-Ergebnis: `MVP_0.3_done: true`; `ready_for_MVP_0.4_requirements: true`.

## [2026-05-03] phase-0.4-final | MVP 0.4 Kartenpool und Tags abgeschlossen

MVP 0.4 wurde requirements-gefroren, implementiert, getestet und final reviewt. Umgesetzt wurden versionierte 0.4-Artefakte, ein kleiner interner fiktiver Kartenpool, V0.4-Demo-Decks, kuratierte Deckvalidierung, Hardware mit Memory-Erhöhung, ein einfaches Corp-Upgrade, Tags, `remove_tag`, Tag-Punishment und V0.4-KI-Simulation. Damage wurde bewusst nicht implementiert und bleibt ein späteres Teilgate.

Checks: `corepack pnpm --filter @netrunner/engine test`, `corepack pnpm --filter @netrunner/ai test`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm lint` und `corepack pnpm build` bestanden. Gate-Ergebnis: `MVP_0.4_done: true`; `ready_for_next_scope_decision: true`.

## [2026-05-03] planung | Post-MVP-0.4-Roadmap neu geschnitten

Die Folge-Roadmap wurde nach MVP 0.4 produktnäher neu geordnet. Kartenimport und Kartenkatalog werden V0.5, Deckeditor- und Match-Setup-Fundament V0.6, UI-Neugestaltung und Designgestaltung V0.7, Basisset-/Starterset-Spielbarkeit V0.8 und bessere KI V0.9 zugeordnet. Die UI-Neugestaltung wurde bewusst nach V0.7 gelegt, weil dazu noch Analysen laufen.

Erstellt wurde `docs/derived/POST_MVP_0.4_ROADMAP.md` sowie die Wissensseite `Roadmap nach MVP 0.4`. Nächster Gate-Schritt ist `MVP 0.5 Requirements Freeze: Kartenimport und Kartenkatalog`.

## [2026-05-03] planung | V0.5 und V0.6 detailliert ausgearbeitet

Die Phasen V0.5 und V0.6 wurden detailliert geplant. V0.5 fokussiert Kartenimport, lokale Snapshots, Katalogschema, Statusmodell, Manifest-Abgleich, read-only Katalog-API, funktionale Katalogansicht und harte Trennung zwischen importiert und spielbar. V0.6 fokussiert Deckmodell v2, Deck-Snapshots, Deckvalidierung, funktionalen Deckeditor, Import/Export, Matchstart mit Deckauswahl, Replay/StateHash-Schutz und Hidden-Info-sichere Deck-Metadaten.

Erstellt wurden `docs/derived/MVP_0.5_DETAILED_PLAN.md` und `docs/derived/MVP_0.6_DETAILED_PLAN.md`. Beide Pläne enthalten Teststrategien, kritische Härtungen, Performance-/Optimierungspunkte, Risiken und Done-Kriterien. Nächster Gate-Schritt bleibt `MVP 0.5 Requirements Freeze`.

## [2026-05-03] design | UI-Designsets und Realismusprüfung abgelegt

Für die spätere UI-Neugestaltung wurden vier explorative Designrichtungen mit Einstiegs-, Runner- und Corp-Screens unter `docs/ui-designsets/` abgelegt und bewertet. Die Realismusprüfung empfiehlt Design C als robuste MVP-Hauptstruktur, Design D als Run-/Encounter-Fokus, Design A als dunkle Variante und Design B nur als einklappbare Diagnose-/Playtest-Schicht.

## [2026-05-03] phase-0.5-req | MVP 0.5 Requirements eingefroren

Die V0.5-Requirements für Kartenimport und Kartenkatalog wurden abgeleitet und reviewfähig eingefroren. Erstellt wurden Spezifikationen für Import, Katalog, Statusmodell, Testmatrix und Requirements Review. Die Datenartefakte umfassen Source Registry, lokalen Snapshot, Snapshot-Hash, Import-Report, Katalogindex und Statusmanifest. Als Snapshot-Basis dienen nur lokale versionierte Demo-/Projektdaten plus fiktive lokale Katalog-Fixtures zur ausführbaren Prüfung von `imported` ohne Spielbarkeit und `blocked`.

Checks: `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Gate-Ergebnis: `ready_for_implementation: true`. V0.5-Implementierung darf starten; Import bleibt strikt getrennt von Engine-Spielbarkeit, KI, Deckvalidierung und Matchstart.

## [2026-05-03] planung | V0.7 UI-Neugestaltung detailliert geplant

Die Phase V0.7 wurde detailliert als UI-Neugestaltungs- und Designphase geplant. Primäre Referenz ist `docs/ui-designsets/03-design-c-clean-high-contrast/`; Design C wird als helle, lesbare, side-sichere Hauptstruktur verwendet. Der Plan umfasst Entry, RunnerBoard, CorpBoard, RunTimeline, CardView, LegalActionsPanel, ChoiceRequestPanel, EventLog, Undo/Reconnect, Diagnostics Drawer, Accessibility, Visual QA und Hidden-Info-Härtung.

Der Wunsch nach späteren Originalkartenabbildern wurde als image-ready CardView-Strategie aufgenommen. Echte Kartenabbilder bleiben bis zu einer separaten Quellen-, Nutzungs- und Asset-Freigabe gesperrt; V0.7 nutzt Platzhalter und stabile `5 / 7`-Kartenflächen. Erstellt wurde `docs/derived/MVP_0.7_DETAILED_PLAN.md`.

## [2026-05-03] planung | V0.7 Kartenbild-Zusatzdesigns analysiert

Die zusätzlichen kartenbildfreundlichen Design-C-Bilder unter `docs/ui-designsets/03-design-c-clean-high-contrast/` wurden ausgewertet. Sie bestätigen Design C als Hauptstruktur, schärfen aber die V0.7-Planung: Card Display Modes, Card Preview, Zoom/Focus, Compact-Ansicht, Text-Fallback und Board Preview sind als konkrete Bausteine aufzunehmen.

Der Plan wurde angepasst. Echte Kartenabbilder bleiben weiterhin durch ein separates Asset-Gate gesperrt. Hidden Cards dürfen auch im Bildmodus keine echten Kartenrücken, Bild-URLs, unterscheidbaren Ladezustände oder DOM-Metadaten erhalten. Betroffene Planungsdokumente: `docs/derived/MVP_0.7_DETAILED_PLAN.md` und `docs/ui-designsets/REALISM_REVIEW.md`.

## [2026-05-03] phase-0.5-impl | MVP 0.5 Card Catalog implementiert

Die V0.5-Implementierung wurde umgesetzt. Neu ist das reine TypeScript-Paket `@netrunner/catalog` für Snapshot-Validierung, Hashing, Indexbildung, Suche, Statuszusammenfassung und sichere Katalogpayloads. Die Web-App stellt read-only Endpunkte unter `/api/cards/catalog`, `/api/cards/catalog/:id` und `/api/cards/status-summary` bereit und zeigt auf der Startseite eine funktionale Katalogansicht mit Suche, Side-/Statusfilter, Liste, Detail und Statusbadges.

Checks: `corepack pnpm install`, `corepack pnpm --filter @netrunner/catalog test`, `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. API- und Browser-Smokes auf `http://127.0.0.1:3000` bestanden. Gate-Ergebnis: `ready_for_hardening: true`.

## [2026-05-03] phase-0.5-final | MVP 0.5 final validiert

MVP 0.5 wurde final validiert und dokumentiert. Der Final Review bestätigt: importierte Karten werden nicht automatisch spielbar, die Katalog-API gibt keine Match-/Token-/FullState-/Hidden-Info-Daten aus, bestehende Engine-/AI-/Server-/Visibility-/Replay-Gates bleiben grün und V0.7-UI-Redesign wurde nicht begonnen.

Finale Checks: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`, Katalog-API-Smoke, Katalog-Payload-Leak-Scan und Browser-Katalog-Smoke bestanden. Gate-Ergebnis: `MVP_0.5_done: true`; `ready_for_MVP_0.6_requirements: true`.

## [2026-05-03] phase-0.6-req | MVP 0.6 Requirements eingefroren

Die V0.6-Requirements für Deck Editor und Match Setup Foundation wurden abgeleitet und reviewfähig eingefroren. Erstellt wurden Spezifikationen für Deckeditor, Deckvalidierung v2, Match Setup und Deck Storage sowie Testmatrix und Requirements Review. Die Datenartefakte umfassen lokales Formatprofil, Decktemplates, vier immutable Demo-Deck-Snapshots mit deterministischen Hashes und ein Validierungsmanifest.

Checks: `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Gate-Ergebnis: `ready_for_implementation: true`. V0.6 darf implementiert werden; V0.7-UI-Redesign, offizielle Turnierlegalität, nicht implementierte Karten und öffentliche Plattformfunktionen bleiben ausgeschlossen.

## [2026-05-03] planung | V0.8 Basisset-/Starterset-Spielbarkeit detailliert geplant

Die Phase V0.8 wurde als spätere, durch V0.7 gegatete Spielbarkeitsphase detailliert geplant. Der Scope ist ein kleiner, streng kuratierter spielbarer Basisset-/Starterset-Slice aus importiertem und validiertem Kartenbestand. Importierte Karten bleiben Daten, nicht Regelautorität; jede spielbare Karte braucht Manifest, expliziten Resolver, Unit-Test, Szenario, Visibility-Test, Replay/StateHash und KI-Smoke.

Erstellt wurde `docs/derived/MVP_0.8_DETAILED_PLAN.md`. Die Roadmap- und Statusverweise wurden ergänzt. Damage, Resources, Traces, Identitätsfähigkeiten, Multiaccess, Hosting, Viren, Prevention und Replacement bleiben getrennte Teilgates und werden nicht als breite Komplettumsetzung in V0.8 übernommen.

## [2026-05-03] planung | V0.9 bessere KI detailliert geplant

Die Phase V0.9 wurde als spätere, durch V0.8 gegatete KI-Qualitätsphase detailliert geplant. Der Plan verbessert Runner- und Corp-KI über sichtbasierte Heuristiken, Karten- und Deckrollen, Risk Scoring, Difficulty-Stufen, begrenzte Lookaheads, bessere Reason-Codes, Lern-Erklärungen und Simulationen über mehrere Seeds, Decks und Matchups.

Erstellt wurde `docs/derived/MVP_0.9_DETAILED_PLAN.md`. Roadmap, Status und Wissensbasis wurden verlinkt. V0.9 bleibt ausdrücklich keine Kartenpool- oder UI-Hauptphase; KI mit FullState, verdeckten gegnerischen Informationen oder LLM als Regelakteur bleibt ausgeschlossen.

## [2026-05-03] planung | V0.8 Detailplanung nach Review gehärtet

Die V0.8-Detailplanung wurde um zusätzliche Gates und Prüfpunkte ergänzt: harte Eingangsvoraussetzungen nach V0.6/V0.7, Quellen-/Nutzungsentscheidung für Basisset-/Starterset-Scope, Kandidaten-Scoring, Per-Card-Deviation/Approximation, Resolver-Registry als Must, minimale KI-Rollen für V0.9, Playability-/Balance-Smokes, Golden-Hash-Prozess und Performance-Budgets für zentrale Engine-, View- und KI-Smoke-Pfade.

V0.9 wurde passend angeschlossen: Das spätere Rollenmanifest darf minimale V0.8-Rollen-Tags übernehmen, muss sie aber validieren und erweitern. Es bleibt ausgeschlossen, Rollen aus Kartentext zu interpretieren oder als Regelquelle zu nutzen.

Nach Review wurde die V0.9-Planung für einen späteren Requirements-Freeze nachgeschärft: tracebare Must/Should/Could-IDs, messbare KI-Qualitätsmetriken, Hidden-State-Invarianztests, AI-Controller-Lifecycle, ObservedFacts-Modell, Tuning-Change-Control, Holdout-Seeds und Coverage-Heatmaps wurden ergänzt.

## [2026-05-03] phase-0.6-impl | MVP 0.6 Deck Editor und Match Setup implementiert

Die V0.6-Implementierung für Deck Editor und Match Setup Foundation wurde umgesetzt. Entstanden sind `@netrunner/decks` mit editierbaren Decks, Validierung v2, deterministischen Snapshots, Hashes und Import/Export, eine serverseitige Snapshot-Revalidierung beim Matchstart, erlaubte öffentliche Deckmetadaten in PlayerViews, AI-/Server-Unterstützung für Snapshot-Decks, Web-Deck-API sowie eine funktionale UI für lokale Deckkopien, Mengenbearbeitung, Validierung und Match-Deckauswahl.

Checks: `corepack pnpm --filter @netrunner/decks test`, `corepack pnpm --filter @netrunner/server test`, `corepack pnpm --filter @netrunner/ai test`, `corepack pnpm --filter @netrunner/engine test`, `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`, `corepack pnpm --filter @netrunner/server typecheck`, `corepack pnpm --filter @netrunner/web typecheck`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. API-Smokes für Deck-Snapshots, Deckvalidierung und Matchstart sowie Browser-Smoke für lokale Deckkopie, Validierung und Match Setup bestanden. Gate-Ergebnis: `ready_for_hardening: true`. Nächster Schritt ist V0.6 Validierung, Hardening und Dokumentation.

## [2026-05-03] phase-0.6-final | MVP 0.6 final validiert

MVP 0.6 wurde final validiert und dokumentiert. Der Final Review bestätigt: Decks werden editierbar, aber Matches starten nur mit validierten und serverseitig revalidierten Snapshots; importierte oder nicht spielbare Karten blockieren Matchstart; gegnerische Decklisten bleiben privat und nur erlaubte Metadaten werden angezeigt.

Finale Checks: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`, Deck-API-Smoke, Deckvalidierungs-Smoke, Matchstart-Smoke mit V0.6-Snapshots und Browser-Smoke für Deckeditor/Match Setup bestanden. Gate-Ergebnis: `MVP_0.6_done: true`. Nächster empfohlener Scope ist V0.7 Requirements/Design Freeze; V0.7 wurde nicht implementiert.

## [2026-05-03] qa | V0.6 Kartenlesbarkeit und EventLog gehärtet

Im V0.6-QA-Lauf wurde die Spieloberfläche für bekannte Karten und öffentliche Kartenevents lesbarer gemacht. `VisibleCard` enthält für bekannte Karten display-only Kartentext und öffentliche Werte. Die Weboberfläche zeigt bekannte Kartendetails über Kartenansicht, Hover/Fokus und die spätere Chronicle-/Eventansicht.

Hidden-Info-Grenze bleibt bestehen: verdeckte Corp-Installationen bleiben anonym und unbekannte Karten erhalten keinen Kartentext oder Tooltip. Checks: `corepack pnpm install --frozen-lockfile`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`, Server-Health-Smoke und Next-Web-Smoke bestanden.

## [2026-05-03] phase-0.7-req | MVP 0.7 Requirements und Design Freeze

Der V0.7 Requirements/Design Freeze wurde aus der V0.7-Detailplanung, den UI-Designsets und der Realismusprüfung abgeleitet. Eingefroren wurden Design C als Hauptstruktur, Design D als Run-/Encounter-Fokus und Design B als einklappbare Diagnose-/Playtest-Schicht. Echte Kartenabbilder, offizielle Logos, Card Frames und Card Backs bleiben bis zu einer separaten Asset-Freigabe gesperrt.

Erstellt wurden `docs/derived/MVP_0.7_REQUIREMENTS.md`, `docs/derived/UI_REDESIGN_0.7_SPEC.md`, `docs/derived/RUN_ENCOUNTER_UI_0.7_SPEC.md`, `docs/derived/CARD_VIEW_0.7_SPEC.md`, `docs/derived/ACCESSIBILITY_0.7_SPEC.md`, `docs/derived/MVP_0.7_TEST_MATRIX.md`, `docs/derived/MVP_0.7_REQUIREMENTS_REVIEW.md` und `tests/specs/ui-redesign-0.7-acceptance-tests.todo.md`. Checks: `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Gate-Ergebnis: `ready_for_implementation: true`.

## [2026-05-03] phase-0.7-final | MVP 0.7 UI-Neugestaltung abgeschlossen

MVP 0.7 wurde implementiert, validiert und final dokumentiert. Die Weboberfläche nutzt jetzt eine helle Clean-High-Contrast-Struktur mit Entry-Preflight, Card Display Settings, generischer image-ready CardView, Card Preview, RunTimeline, LegalActionsPanel, UndoPanel, EventLogPanel und Diagnostics Drawer. Der Browser bleibt weiterhin ohne Engine-Import und ohne FullState.

Checks: `corepack pnpm --filter @netrunner/web typecheck`, Visibility Contract, Web-Build, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Lokale Headless-Smokes für Entry, RunnerBoard und CorpBoard bestanden. Gate-Ergebnis: `MVP_0.7_done: true`; `ready_for_MVP_0.8_requirements: true`.

## [2026-05-03] planung | V0.91 Kartenbild-Asset-Gate nach V0.9 eingeordnet

Die gewünschte Bild-Import-Funktion wurde als eigene spätere Phase V0.91 nach V0.9 eingeordnet. Begründung: V0.8 soll zuerst den spielbaren Karten-/Deck-Slice stabilisieren, V0.9 danach die KI-Qualität auf dieser Basis härten; offizielle Kartenbilder würden vorher unnötig Lizenz-, Asset- und Hidden-Info-Risiken in laufende Karten-, UI- und KI-Gates mischen.

Erstellt wurde `docs/derived/MVP_0.91_DETAILED_PLAN.md`. Aktualisiert wurden Roadmap, Status und Wissensindex. V0.91 bleibt ein separates Asset-Gate: Kartenbilder sind lokale Anzeige-Artefakte, kein Engine-, KI-, Deck-, Replay-, StateHash- oder Match-State-Input. Heruntergeladene Bilder werden nicht versioniert und Hidden Cards dürfen keine Bild-URLs, Alt-Texte, Asset-IDs oder unterscheidbaren Ladezustände erhalten.

## [2026-05-03] phase-0.8-req | MVP 0.8 Requirements eingefroren

Die V0.8-Requirements für den spielbaren Base-/Starterset-Slice wurden abgeleitet und reviewfähig eingefroren. Der gewählte Pfad ist ein lokaler/fiktiver Starterset-Slice mit 14 neuen spielbaren Karten. Damage, Resources, Traces, Identitätsfähigkeiten, Multiaccess, Hosting, Viren, Prevention und Replacement bleiben außerhalb des Hauptslice.

Erstellt wurden `docs/derived/MVP_0.8_REQUIREMENTS.md`, `docs/derived/PLAYABLE_CARD_SLICE_0.8_SPEC.md`, `docs/derived/RULE_MECHANICS_0.8_SPEC.md`, `docs/derived/CARD_IMPLEMENTATION_0.8_SPEC.md`, `docs/derived/MVP_0.8_TEST_MATRIX.md`, `docs/derived/MVP_0.8_REQUIREMENTS_REVIEW.md`, V0.8-Karten-/Deck-/Manifest-Artefakte und vier V0.8-Szenario-Fixtures. Checks: `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Gate-Ergebnis: `ready_for_implementation: true`.

## [2026-05-03] phase-0.8-final | MVP 0.8 spielbarer Starterset-Slice abgeschlossen

MVP 0.8 wurde implementiert, validiert und final dokumentiert. Umgesetzt wurden 14 lokale/fiktive neue Karten mit expliziten Resolvern, V0.8-Katalog- und Deck-Snapshots, V0.8-Rule-Baseline, Server-Default-Matchsetup auf die V0.8-Snapshots, Katalog-/Deck-API-Anbindung und AI-Smokes über die neuen Starterdecks. Der Slice nutzt keine offiziellen Assets, externen APIs oder Kartentextauswertung als Regelquelle.

Checks: Engine-, Server-, AI-, Decks- und Catalog-Pakettests, Phase-1-Artefakte, Visibility Contract, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Lokaler V0.8-Matchstart-/Deck-/Katalog-/AI-Smoke sowie Performance-Smoke bestanden. Gate-Ergebnis: `MVP_0.8_done: true`; `ready_for_MVP_0.9_requirements: true`.

## [2026-05-03] phase-0.9-req | MVP 0.9 Requirements eingefroren

Die V0.9-Requirements für stärkere KI wurden abgeleitet und reviewfähig eingefroren. Der Scope bleibt eine KI-Qualitätsphase auf dem bestandenen V0.8-Starterset-Slice: rollenbewusste Scorer, Difficulty-Profile, Reason-Code- und Explanation-Safety, ObservedFacts, Soak-Matrix, Holdout-Seeds und Tuning-Change-Control. Neue Karten, neue Mechaniken, FullState-KI, LLM als Regelakteur und öffentliche Plattformfunktionen bleiben ausgeschlossen.

Erstellt wurden `docs/derived/MVP_0.9_REQUIREMENTS.md`, `docs/derived/AI_HEURISTICS_0.9_SPEC.md`, `docs/derived/AI_DIFFICULTY_0.9_SPEC.md`, `docs/derived/AI_EXPLANATION_0.9_SPEC.md`, `docs/derived/AI_SOAK_TEST_0.9_SPEC.md`, `docs/derived/MVP_0.9_TEST_MATRIX.md`, `docs/derived/MVP_0.9_REQUIREMENTS_REVIEW.md`, `data/ai/*.json`, vier `data/scenarios/ai-v09-*.json` und `tests/specs/ai-quality-0.9-acceptance-tests.todo.md`. Check: `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts` bestanden. Gate-Ergebnis: `ready_for_implementation: true`.

## [2026-05-03] phase-0.9-final | MVP 0.9 stärkere KI abgeschlossen

MVP 0.9 wurde implementiert, validiert und final dokumentiert. Umgesetzt wurden rollenbewusste Runner- und Corp-Scorer, Difficulty-Profile für Easy/Normal/Hard ohne erweiterten Informationszugriff, side-sichere Evidence und Explanations, ObservedFacts aus side-gefilterten Events, Qualitätsmetriken in Simulationssummaries, ein V0.9-Soak-Helfer sowie Server-V0.9-Profil-IDs.

Checks: `corepack pnpm --filter @netrunner/ai typecheck`, `corepack pnpm --filter @netrunner/ai test`, `corepack pnpm --filter @netrunner/server test`, `corepack pnpm --filter @netrunner/shared typecheck`, `corepack pnpm --filter @netrunner/server typecheck` und Root-Artefakt-/Visibility-Specs bestanden. V0.9-Soak-Smoke: 27 Läufe, 0 IllegalActions, 0 ReplayFailures, FallbackRate 0,02, TimeoutRate 0. Gate-Ergebnis nach finalem Workspace-Lauf: `MVP_0.9_done: true`.

## [2026-05-03] phase-0.91-req | MVP 0.91 Kartenbild-Asset-Gate eingefroren

Der V0.91 Requirements Freeze wurde nach dokumentiertem V0.9-Finalgate abgeleitet. Erstellt wurden Requirements, Asset-Gate-Spezifikation, Bildimport-Spezifikation, Display-Spezifikation, Testmatrix und Requirements Review sowie strukturierte Source-Registry und Asset-Policy unter `data/card-assets/`.

Die aktuellen Primärquellen wurden geprüft: NetrunnerDB liefert technische Bildmetadaten, aber keine eigenständige Bildnutzungsfreigabe; Null Signal Games gibt ein separates Visual-Assets-Pack frei, nicht aber Card Art, Frames oder Card Backs. Ergebnis: `MVP_0.91_requirements_freeze_done: true`, aber `ready_for_implementation: false`. Es wurden keine Bilder heruntergeladen, keine offiziellen Assets genutzt und keine Implementierung geschrieben.

## [2026-05-03] phase-s01-core | S01 Spielende, Ergebnisfenster und Audio umgesetzt

Die Sonderphase S01 wurde für Spielende, Ergebnisfenster, Spielziel und Audio geplant und im sicheren Kern umgesetzt. Erstellt wurden Requirements, Result-Modal-Spezifikation, Audio-Spezifikation, Testmatrix und Requirements Review unter `docs/derived/S01_*.md`.

Technisch ergänzt wurden side-sichere `GameResultSummary`-Payloads im Multiplayer-Service, `match_finished` mit Ergebnisstatistik, eine Startauswahl zwischen Regelmatch mit 7 Agendapunkten und Einzelspiel mit Deckziel, ein Ergebnisfenster mit Perspektivtext und aggregierten Statistiken sowie opt-in Audioeffekte über lokale Web-Audio-Synthese. Mehrspiel-Serien mit automatischem Seitenwechsel bleiben als S01.x-Folgeausbau getrennt, weil sie Session-Seiten, Reconnect-Tokens und WebSocket-Kontexte berühren.

Checks: `corepack pnpm --filter @netrunner/server test`, `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Der Build meldet weiterhin die bekannte Turbopack-NFT-Warnung zur bestehenden `card-images`-Route, kompiliert aber erfolgreich.

## [2026-05-03] phase-0.92-final | Mechanik-Inventar und M1-Spezifikation abgeschlossen

V0.92 wurde als Requirements- und Spezifikationsgate abgeschlossen. Erstellt wurden `MVP_0.92_REQUIREMENTS.md`, `MECHANICS_COVERAGE_MATRIX.md`, das maschinenlesbare Artefakt `data/rules/mechanics-coverage-0.92.json`, `MECHANIC_M1_EFFECT_TIMING_SPEC.md`, `MECHANIC_M1_TEST_MATRIX.md`, Requirements Review und Final Review.

Die V0.91-Assetentscheidung ist nun konsistent eingeordnet: private lokale Kartenscans/lokale Kartenbilder sind fuer dieses private lokale Projekt als reine Anzeige-Artefakte erlaubt. Oeffentliche Distribution, offizielle Logos, standalone Card Frames, Card Backs, externe Kartendatenbank-Abhaengigkeiten sowie Engine-/KI-/GameState-/Replay-/StateHash-Nutzung bleiben ausgeschlossen. Gate-Ergebnis: `MVP_0.92_done: true`; `ready_for_MVP_0.93_implementation: true`.

## [2026-05-03] phase-s01-series | S01 private Matchserie umgesetzt

Die offenen S01-Punkte zur privaten Matchserie wurden umgesetzt. `two_game_side_swap` modelliert eine private Zwei-Spiel-Serie oberhalb der Engine: Spiel 1 endet normal durch Engine-Wincondition, der Server speichert side-sichere Serienmetadaten und `series-next` erzeugt Spiel 2 mit Seitenwechsel, neuem Session-/Join-Kontext und identischen Deck-Snapshots/Settings.

Die UI bietet jetzt `Private Matchserie · Seitenwechsel`, zeigt Serienstand im Ergebnisfenster und kann das nächste Serienspiel starten. Engine, Replay und StateHash bleiben pro Einzelspiel unverändert; öffentliche Turnier-, Ranking- und Matchmaking-Funktionen wurden nicht eingeführt.

## [2026-05-03] phase-0.93-final | M1-Engine-Fundament umgesetzt

V0.93 wurde umgesetzt und final dokumentiert. Die Shared-/Engine-Verträge enthalten jetzt additive Typen für Effects, Ability-Metadaten, Costs, Choices und Eventklassifikation. `pendingChoice` ist in GameState und PlayerView vorbereitet, wird side-sicher gefiltert und in `applyAction` gegen Side, ChoiceId, StateVersion, Optionen und Auswahlanzahl revalidiert.

Breaker Pump/Break bleiben öffentlich `pump_breaker` und `break_subroutine`, tragen intern aber `abilityRef`, `effectRef` und Target-Metadaten. PublicEvents können `visibilityClass` tragen; Server Bootstrap, Reconnect und WebSocket serialisieren offene Choices nur für die zuständige Seite. M2 wurde in `SETUP_GAME_END_0.93_SPEC.md` nur spezifiziert: Mulligan, 7-Punkte-Standard, Legacy-Siegwerte, Deckout-/Flatline-Vorbereitung, Identity Setup und Archives/facedown sind nicht spielbar.

Checks: Shared/Engine/Server/AI-Typechecks bestanden. Engine-Test: 25 Tests bestanden. AI-Test: 16 Tests bestanden. Server-Test: 14 Tests bestanden. Artefakt- und Visibility-Specs bestanden. `corepack pnpm test`, `corepack pnpm build`, `corepack pnpm lint` und `corepack pnpm typecheck` bestanden; beim Build bleibt die bekannte Turbopack-NFT-Warnung zur bestehenden `card-images`-Route. Gate-Ergebnis: `MVP_0.93_done: true`; `M2_requirements_ready: true`.

## [2026-05-03] planung | V0.94 und V0.95 detailliert geplant

Die Annahmen für die nächsten Mechanikgates wurden gegen V0.93, die Mechanik-Coverage, den Mechanik-Komplettierungsplan und die lokale CR-v26.03-Referenz geprüft. Ergebnis: Die Reihenfolge bleibt sinnvoll. V0.94 wird als Damage-/Flatline-Gate geplant, muss aber vor Damage einen engen Game-End-Grundvertrag für Flatline mitnehmen. Der volle M2-Block mit Mulligan, Identity Setup und Archives/Multiaccess bleibt weiterhin getrennt.

V0.95 wird als Resource-/Tag-Interaktionsgate geplant. Es ergänzt Runner-Resources als Kartentyp und Boardbereich sowie tag-basiertes Resource-Trash, ohne Trace, Link/Bidding, Prevention, Hosting oder neue Counterfamilien zu starten. Erstellt wurden `MVP_0.94_0.95_ASSUMPTION_REVIEW.md`, `MVP_0.94_DETAILED_PLAN.md` und `MVP_0.95_DETAILED_PLAN.md`. Beide Pläne enthalten explizite Testmatrizen für Visibility, Replay/StateHash, Undo, WebSocket/Reconnect, AI und No-Scope-Regression.

## [2026-05-04] requirements | V0.94 Damage/Flatline eingefroren

Der Requirements Freeze für V0.94 ist erstellt. Die CR-v26.03-Regelreferenz wurde gezielt für Damage und Flatline abgeglichen: Meat und Net Damage trashen zufällig Karten aus dem Runner-Grip; mehrere Damage-Punkte wählen ohne Replacement und werden fachlich gleichzeitig getrasht; Flatline tritt ein, wenn der Runner mehr Damage nimmt, als Karten im Grip liegen.

Erstellt wurden `MVP_0.94_REQUIREMENTS.md`, `DAMAGE_FLATLINE_0.94_SPEC.md`, `MVP_0.94_TEST_MATRIX.md` und `MVP_0.94_REQUIREMENTS_REVIEW.md`. Die Umsetzung ist freigegeben, bleibt aber eng: kein Core-Damage, keine Prevention/Avoid/Interrupt/Replacement, kein Mulligan, Trace, Resource, Multiaccess, Identity, Hosting, Virus oder Counter-Gate.

## [2026-05-04] phase-0.94-final | Damage und Flatline umgesetzt

V0.94 wurde umgesetzt und final dokumentiert. Neu sind side-sichere `GameEndReason`-Werte, Net-/Meat-Damage über freigegebene Engine-Pfade, RandomDrawRecords für zufälliges Grip-Trashing, `hidden_info_barrier`-Events, Undo-Barrieren nach Damage und Flatline als enger Game-End-Grund. Die lokale fiktive Karte `v094_neural_sentry_ice` dient als manifestierter Damage-Harness und aktiviert keine offiziellen Karten, Assets oder externen Datenquellen.

Erstellt bzw. aktualisiert wurden `MVP_0.94_IMPLEMENTATION_REVIEW.md`, `MVP_0.94_FINAL_REVIEW.md`, `data/rules/rules-baseline-0.94.json`, `data/cards/demo-cards-0.94.json`, `data/decks/demo-decks-0.94.json`, `data/manifests/card-implementation-manifest-0.94.json`, `data/rules/mechanics-coverage-0.94.json` und zwei V0.94-Szenario-Fixtures. Checks: Shared/Engine/Server/AI-Typechecks, Engine-/AI-/Server-Tests, Artefakt- und Visibility-Specs sowie `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden; beim Build bleibt die bekannte Turbopack-NFT-Warnung zur bestehenden `card-images`-Route. Gate-Ergebnis: `MVP_0.94_done: true`; `ready_for_MVP_0.95_requirements_freeze: true`.

## [2026-05-04] requirements | V0.95 Resources und Tag-Interaktion eingefroren

Der Requirements Freeze für V0.95 ist erstellt. Die CR-v26.03-Regelreferenz wurde gezielt für Runner-Resources und die Corp-Basisaktion gegen getaggte Runner abgeglichen: Resources werden vom Runner offen in die Spielzone installiert; wenn der Runner getaggt ist, darf die Corp 1 Klick und 2 Credits zahlen, um eine installierte Resource zu trashen.

Erstellt wurden `MVP_0.95_REQUIREMENTS.md`, `RESOURCE_TAG_INTERACTION_0.95_SPEC.md`, `MVP_0.95_TEST_MATRIX.md` und `MVP_0.95_REQUIREMENTS_REVIEW.md`. Die Umsetzung ist freigegeben, bleibt aber eng: keine Trace-/Link-/Bidding-Mechanik, kein Hosting, keine Viren, keine Counter-Familien, keine Prevention/Avoid/Interrupt/Replacement und keine V0.96+-Mechaniken.

## [2026-05-04] phase-0.95-final | Resources und Tag-Interaktion umgesetzt

V0.95 wurde umgesetzt und final dokumentiert. Neu sind der Kartentyp `resource`, eine Resource-Liste im Runner-Rig, public sichtbare installierte Runner-Resources und die Corp-Basisaktion `trash_resource` gegen getaggte Runner. `trash_resource` ist nur über LegalActions verfügbar, kostet 1 Klick und 2 Credits, bewegt eine installierte Resource in den Runner-Heap und erzeugt ein public Event ohne Hidden-Info-Barriere.

Erstellt bzw. aktualisiert wurden `MVP_0.95_IMPLEMENTATION_REVIEW.md`, `MVP_0.95_FINAL_REVIEW.md`, `data/rules/rules-baseline-0.95.json`, `data/cards/demo-cards-0.95.json`, `data/decks/demo-decks-0.95.json`, `data/manifests/card-implementation-manifest-0.95.json`, `data/rules/mechanics-coverage-0.95.json` und zwei V0.95-Szenario-Fixtures. Checks: Shared/Engine/Server/AI/Web-Typechecks, Engine-/AI-/Server-Tests, Artefakt- und Visibility-Specs sowie `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Gate-Ergebnis: `MVP_0.95_done: true`; `ready_for_MVP_0.96_requirements_freeze: true`.

## [2026-05-04] requirements | V0.96 Trace, Link und Bidding eingefroren

Der Requirements Freeze für V0.96 ist erstellt. Die CR-v26.03-Regelreferenz wurde gezielt für Base Link, Link-Wert und Trace-Sequenz abgeglichen: Die Corp bietet zuerst und erhöht Trace-Strength, danach bietet der Runner und erhöht Runner-Link-Strength; der Trace ist nur erfolgreich, wenn Trace-Strength größer als Runner-Strength ist.

Erstellt wurden `MVP_0.96_REQUIREMENTS.md`, `TRACE_LINK_BIDDING_0.96_SPEC.md`, `MVP_0.96_TEST_MATRIX.md` und `MVP_0.96_REQUIREMENTS_REVIEW.md`. Die Umsetzung ist freigegeben, bleibt aber eng: erste Trace-Harness-Karte, öffentliche Bid-Choices, deterministische Kosten- und Ergebnisrevalidierung, Erfolgseffekt nur `add_tag`. Trace-Damage, resource-spezifische Trace-Effekte, Jack-out/Breach/Multiaccess, Identity-Abilities, Hidden-Zone-Tools, Hosting, Viren, Counter-Familien und Prevention bleiben gesperrt.

## [2026-05-04] phase-0.96-final | Trace, Link und Bidding umgesetzt

V0.96 wurde umgesetzt und final dokumentiert. Neu sind `TraceState`, Runner Base Link 0, `initiate_trace` als lokale/fiktive ICE-Subroutine, echte `bid_amount`-Choices für Corp und Runner, Kostenabbuchung für beide Bids, strict-greater-than-Ergebnislogik und `add_tag` als einziger freigegebener Trace-Erfolgseffekt.

Erstellt bzw. aktualisiert wurden `MVP_0.96_IMPLEMENTATION_REVIEW.md`, `MVP_0.96_FINAL_REVIEW.md`, `data/rules/rules-baseline-0.96.json`, `data/cards/demo-cards-0.96.json`, `data/decks/demo-decks-0.96.json`, `data/manifests/card-implementation-manifest-0.96.json`, `data/rules/mechanics-coverage-0.96.json` und zwei V0.96-Szenario-Fixtures. Checks: Shared/Engine/Server/AI/Web-Typechecks, Engine-/AI-/Server-Tests, Artefakt- und Visibility-Specs sowie `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Beim Build bleibt die bekannte Turbopack-NFT-Warnung zur bestehenden `card-images`-Route. Gate-Ergebnis: `MVP_0.96_done: true`; `ready_for_MVP_0.97_requirements_freeze: true`.

## [2026-05-04] requirements | V0.97 Run, Jack-out, Breach und Multiaccess eingefroren

Der Requirements Freeze für V0.97 ist erstellt. Die CR-v26.03-Regelreferenz wurde gezielt für Movement, Jack-out, erfolgreichen Run, Breach, Kandidaten und HQ/R&D-Random-Access-Limit abgeglichen: Jack-out wird als Runner-Movement-Fenster nach passiertem ICE und vor nächstem ICE oder Server modelliert; erfolgreiche V0.97-Runs erzeugen einen internen Breach-State mit Access-Queue.

Erstellt wurden `MVP_0.97_REQUIREMENTS.md`, `RUN_BREACH_MULTIACCESS_0.97_SPEC.md`, `MVP_0.97_TEST_MATRIX.md` und `MVP_0.97_REQUIREMENTS_REVIEW.md`. Die Umsetzung ist freigegeben, bleibt aber eng: keine Access-Replacement-/Prevention-Mechanik, keine aktiven Identity-Abilities, keine Hidden-Zone-Tools, kein Hosting, keine Viren, keine Counter-Familien und keine V0.98+-Mechaniken.

## [2026-05-04] phase-0.97-final | Run, Jack-out, Breach und Multiaccess umgesetzt

V0.97 wurde umgesetzt und final dokumentiert. Neu sind ein V0.97-baseline-gesteuertes Movement-Fenster mit `jack_out`, ein interner `BreachState`, queue-basierter Access, R&D-Multiaccess in Top-N-Reihenfolge und HQ-Multiaccess ohne Replacement über Seed, RandomCounter und RandomDrawRecords. Die lokale/fiktive Karte `v097_deep_dive_event` dient als manifestierter Multiaccess-Harness.

Erstellt bzw. aktualisiert wurden `MVP_0.97_IMPLEMENTATION_REVIEW.md`, `MVP_0.97_FINAL_REVIEW.md`, `data/rules/rules-baseline-0.97.json`, `data/cards/demo-cards-0.97.json`, `data/decks/demo-decks-0.97.json`, `data/manifests/card-implementation-manifest-0.97.json`, `data/rules/mechanics-coverage-0.97.json` und zwei V0.97-Szenario-Fixtures. Checks: Shared/Engine/Server/AI/Web-Typechecks, Engine-/AI-/Server-Tests, Artefakt- und Visibility-Specs sowie `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Beim Build bleibt die bekannte Turbopack-NFT-Warnung zur bestehenden `card-images`-Route. Gate-Ergebnis: `MVP_0.97_done: true`; `ready_for_MVP_0.98_requirements_freeze: true`.

## [2026-05-04] requirements | V0.98 Identities, Modifier und Hidden-Zone-Tools eingefroren

Der Requirements Freeze für V0.98 ist erstellt. Die CR-v26.03-Regelreferenz wurde gezielt für Identity-Setup, Static Abilities, Look/Reveal/Expose, Search, Swap und Hidden/Open Information abgeglichen. V0.98 wird intern gestaffelt: V0.98a Identity/Modifier zuerst, V0.98b Hidden-Zone-Tools erst nach grünem V0.98a-Gate.

Erstellt wurden `MVP_0.98_REQUIREMENTS.md`, `IDENTITY_MODIFIERS_0.98_SPEC.md`, `HIDDEN_ZONE_TOOLS_0.98_SPEC.md`, `MVP_0.98_TEST_MATRIX.md` und `MVP_0.98_REQUIREMENTS_REVIEW.md`. Die Umsetzung ist für V0.98a freigegeben, bleibt aber eng: lokale/fiktive Identity-Piloten, Setup-Marker, zentrale Modifier; danach Search/Reveal/Expose/Arrange/Shuffle/Swap als kleine side-sichere Harnesses. Hosting, Viren, Purge, Counter-Familien, Recurring Credits, Bad Publicity, Prevention, Avoid, Interrupt und Replacement bleiben gesperrt.

## [2026-05-04] phase-0.98-final | Identities, Modifier und Hidden-Zone-Tools umgesetzt

V0.98 wurde umgesetzt und final dokumentiert. V0.98a ergänzt lokale/fiktive Runner-/Corp-Identities mit Setup-Credits, deterministischen Usage-Markern, Runner-Link und statischem Memory-Modifier. V0.98b ergänzt enge Harness-Karten für Runner-Stack-Search mit Shuffle, Runner-Stack-Arrange, Public Reveal, Expose unrezzed installierter Corp-Karten und Corp HQ/R&D-Swap.

Search/Arrange laufen über side-private `PendingChoice`-Daten und Hidden-Info-Barrieren; Search-Shuffle nutzt Seed, RandomCounter und RandomDrawRecords; Reveal/Expose sind bewusste PublicEvents; Swap nutzt keine Randomness und leakt keine versteckten HQ-/R&D-Titel. Erstellt bzw. aktualisiert wurden `MVP_0.98_IMPLEMENTATION_REVIEW.md`, `MVP_0.98_FINAL_REVIEW.md`, `data/rules/rules-baseline-0.98.json`, `data/cards/demo-cards-0.98.json`, `data/decks/demo-decks-0.98.json`, `data/manifests/card-implementation-manifest-0.98.json`, `data/rules/mechanics-coverage-0.98.json` und drei V0.98-Szenario-Fixtures. Checks: Shared/Engine/Server/AI/Web-Typechecks, Engine-/AI-/Server-Tests, Artefakt- und Visibility-Specs sowie `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Beim Build bleibt die bekannte Turbopack-NFT-Warnung zur bestehenden `card-images`-Route. Gate-Ergebnis: `MVP_0.98_done: true`; `ready_for_MVP_0.99_requirements_freeze: true`.

## [2026-05-04] requirements | V0.99 Hosting, Viren, Purge und Counter-Familien eingefroren

Der Requirements Freeze für V0.99 ist erstellt. Die CR-v26.03-Regelreferenz wurde gezielt für hosted cards, Virus-Counter, Purge, Recurring Credits und Bad Publicity abgeglichen. V0.99 wird intern gestaffelt: V0.99a Counter, V0.99b Hosting, V0.99c Virus/Purge und V0.99d Recurring Credits/Bad Publicity; V0.99e-Spezialcounter bleibt ohne konkreten Kartenbedarf gesperrt.

Erstellt wurden `MVP_0.99_REQUIREMENTS.md`, `COUNTER_HOSTING_0.99_SPEC.md`, `VIRUS_PURGE_0.99_SPEC.md`, `RECURRING_BAD_PUBLICITY_0.99_SPEC.md`, `MVP_0.99_TEST_MATRIX.md` und `MVP_0.99_REQUIREMENTS_REVIEW.md`. Die Umsetzung bleibt eng: direkte Hosting-Beziehung, side-private Runner-Hosting-Choice, Virus-Counter, Corp-Purge, Recurring Credits nur für Runner-Programminstallkosten und Bad Publicity nur für Runner-Run-Kosten. Prevention, Avoid, Interrupt, Replacement, Set Aside, Remove from Game, Ownership-/Control-Wechsel und vollständige Deckbuilding-/Formatregeln bleiben gesperrt.

## [2026-05-04] phase-0.99-final | Hosting, Viren, Purge und Counter-Familien umgesetzt

V0.99 wurde umgesetzt und final dokumentiert. Neu sind additive `CounterType`-/`CardInstance.counters`-Verträge, direkte `hostedOn`-Beziehungen mit Azyklik-Validation, eine private Runner-Hosting-Choice, Host-Trash-Kaskade, Virus-Counter, die Corp-Basisaktion `purge_virus_counters`, Recurring Credits und Bad Publicity. Die lokalen/fiktiven Karten `v099_host_resource`, `v099_virus_program`, `v099_recurring_chip` und `v099_bad_publicity_operation` dienen als manifestierte Harnesses.

Hosting-Choices laufen über side-private `PendingChoice`-Daten und Hidden-Info-Barrieren; nach erfolgreichem Hosting ist das Programm bewusst offen im Runner-Rig sichtbar. Purge entfernt nur Virus-Counter und kostet 3 Corp-Klicks. Recurring Credits refreshen deterministisch ohne Akkumulation, Bad-Publicity-Credits werden am Run-Start gesnapshott und am Run-Ende gelöscht. Erstellt bzw. aktualisiert wurden `MVP_0.99_IMPLEMENTATION_REVIEW.md`, `MVP_0.99_FINAL_REVIEW.md`, `data/rules/rules-baseline-0.99.json`, `data/cards/demo-cards-0.99.json`, `data/decks/demo-decks-0.99.json`, `data/manifests/card-implementation-manifest-0.99.json`, `data/rules/mechanics-coverage-0.99.json` und drei V0.99-Szenario-Fixtures. Checks: Shared/Engine/Server/AI/Web-Typechecks, Engine-/AI-/Server-Tests, Artefakt- und Visibility-Specs sowie `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Beim Build bleibt die bekannte Turbopack-NFT-Warnung zur bestehenden `card-images`-Route. Gate-Ergebnis: `MVP_0.99_done: true`; `mechanics_completion_V0.94_to_V0.99_done: true`.

## [2026-05-04] bestandsaufnahme | Projektstand nach V0.99/S01 konsolidiert

Eine vollständige Bestandsaufnahme wurde erstellt und in `docs/derived/BESTANDSAUFNAHME_2026-05-04.md` dokumentiert. README, Codex-Status, aktueller Projektstatus, Roadmap und Mechanikplan wurden auf den tatsächlichen Stand V0.99/S01 aktualisiert.

Wichtigster Befund: Der versionierte Stand ist grün, aber der lokale private O:NR-v1-Testzugang war noch nicht sauber eingeordnet. Engine-Harness-Tests und Web-Overlay-Pfade existieren, serverseitiger Matchstart, AI-/Multiplayer-Smokes, versioniertes Manifest und Final Review fehlen dafür noch. Das ist als nächste Scope-Entscheidung dokumentiert.

Testlücke behoben: `vitest.config.ts` enthält jetzt `app/**/*.test.ts`, sodass `apps/web/app/chronicle.test.ts` im normalen Web-Testlauf ausgeführt wird. Checks nach Korrektur: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` mit 170 Tests und `corepack pnpm build` bestanden. Die bekannte Turbopack-NFT-Warnung der `card-images`-Route bleibt als Härtungspunkt.
