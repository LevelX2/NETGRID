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

## [2026-05-03] phase-0.8-req | MVP 0.8 Requirements eingefroren

Die V0.8-Requirements für den spielbaren Base-/Starterset-Slice wurden abgeleitet und reviewfähig eingefroren. Der gewählte Pfad ist ein lokaler/fiktiver Starterset-Slice mit 14 neuen spielbaren Karten. Damage, Resources, Traces, Identitätsfähigkeiten, Multiaccess, Hosting, Viren, Prevention und Replacement bleiben außerhalb des Hauptslice.

Erstellt wurden `docs/derived/MVP_0.8_REQUIREMENTS.md`, `docs/derived/PLAYABLE_CARD_SLICE_0.8_SPEC.md`, `docs/derived/RULE_MECHANICS_0.8_SPEC.md`, `docs/derived/CARD_IMPLEMENTATION_0.8_SPEC.md`, `docs/derived/MVP_0.8_TEST_MATRIX.md`, `docs/derived/MVP_0.8_REQUIREMENTS_REVIEW.md`, V0.8-Karten-/Deck-/Manifest-Artefakte und vier V0.8-Szenario-Fixtures. Checks: `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Gate-Ergebnis: `ready_for_implementation: true`.

## [2026-05-03] phase-0.8-final | MVP 0.8 spielbarer Starterset-Slice abgeschlossen

MVP 0.8 wurde implementiert, validiert und final dokumentiert. Umgesetzt wurden 14 lokale/fiktive neue Karten mit expliziten Resolvern, V0.8-Katalog- und Deck-Snapshots, V0.8-Rule-Baseline, Server-Default-Matchsetup auf die V0.8-Snapshots, Katalog-/Deck-API-Anbindung und AI-Smokes über die neuen Starterdecks. Der Slice nutzt keine offiziellen Assets, externen APIs oder Kartentextauswertung als Regelquelle.

Checks: Engine-, Server-, AI-, Decks- und Catalog-Pakettests, Phase-1-Artefakte, Visibility Contract, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Lokaler V0.8-Matchstart-/Deck-/Katalog-/AI-Smoke sowie Performance-Smoke bestanden. Gate-Ergebnis: `MVP_0.8_done: true`; `ready_for_MVP_0.9_requirements: true`.

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

## [2026-05-03] phase-0.7-req | MVP 0.7 Requirements und Design Freeze

Der V0.7 Requirements/Design Freeze wurde aus der V0.7-Detailplanung, den UI-Designsets und der Realismusprüfung abgeleitet. Eingefroren wurden Design C als Hauptstruktur, Design D als Run-/Encounter-Fokus und Design B als einklappbare Diagnose-/Playtest-Schicht. Echte Kartenabbilder, offizielle Logos, Card Frames und Card Backs bleiben bis zu einer separaten Asset-Freigabe gesperrt.

Erstellt wurden `docs/derived/MVP_0.7_REQUIREMENTS.md`, `docs/derived/UI_REDESIGN_0.7_SPEC.md`, `docs/derived/RUN_ENCOUNTER_UI_0.7_SPEC.md`, `docs/derived/CARD_VIEW_0.7_SPEC.md`, `docs/derived/ACCESSIBILITY_0.7_SPEC.md`, `docs/derived/MVP_0.7_TEST_MATRIX.md`, `docs/derived/MVP_0.7_REQUIREMENTS_REVIEW.md` und `tests/specs/ui-redesign-0.7-acceptance-tests.todo.md`. Checks: `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Gate-Ergebnis: `ready_for_implementation: true`.

## [2026-05-03] phase-0.7-final | MVP 0.7 UI-Neugestaltung abgeschlossen

MVP 0.7 wurde implementiert, validiert und final dokumentiert. Die Weboberfläche nutzt jetzt eine helle Clean-High-Contrast-Struktur mit Entry-Preflight, Card Display Settings, generischer image-ready CardView, Card Preview, RunTimeline, LegalActionsPanel, UndoPanel, EventLogPanel und Diagnostics Drawer. Der Browser bleibt weiterhin ohne Engine-Import und ohne FullState.

Checks: `corepack pnpm --filter @netrunner/web typecheck`, Visibility Contract, Web-Build, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test` und `corepack pnpm build` bestanden. Lokale Headless-Smokes für Entry, RunnerBoard und CorpBoard bestanden. Gate-Ergebnis: `MVP_0.7_done: true`; `ready_for_MVP_0.8_requirements: true`.
