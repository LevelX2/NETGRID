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
- Die Post-MVP-0.4-Roadmap wurde neu geschnitten: V0.5 Kartenimport/Kartenkatalog, V0.6 Deckeditor- und Match-Setup-Fundament, V0.7 UI-Neugestaltung und Designgestaltung, V0.8 Basisset-/Starterset-Spielbarkeit, V0.9 bessere KI und V0.91 Kartenbild-Asset-Gate nach V0.9.
- Die detaillierten Planungen für V0.5 und V0.6 liegen vor, inklusive Bausteinen, Teststrategien, Härtungen, Optimierungen und Done-Kriterien.
- Für die spätere UI-Neugestaltung liegen explorative Designsets und eine Realismusprüfung unter `docs/ui-designsets/` vor. Vorzugsrichtung: Design C als Hauptstruktur, Design D als Run-/Encounter-Fokus, Design B als Diagnose-Drawer.
- Die detaillierte Planung für V0.7 liegt vor: UI-Neugestaltung und Designgestaltung auf Basis von `docs/ui-designsets/03-design-c-clean-high-contrast/`, mit image-ready CardView, Card Display Modes, Card Preview, Zoom/Focus, Compact-Ansicht und Text-Fallback für spätere Originalkartenabbilder.
- Die detaillierte Planung für V0.8 liegt vor: ein streng kuratierter spielbarer Basisset-/Starterset-Slice nach V0.7, mit harten Eingangsgates, Quellenentscheidung, Kandidaten-Scoring, Per-Card-Deviation, Resolver-Registry, Manifest-, Unit-, Szenario-, Visibility-, Replay/StateHash-, KI-, Multiplayer-, Playability- und Performance-Gates je spielbarer Karte.
- Die detaillierte Planung für V0.9 liegt vor: bessere Runner- und Corp-KI nach V0.8 mit rollenbewussten Heuristiken, Risk Scoring, Difficulty-Stufen, begrenzten sichtbasierten Lookaheads, Reason-Codes, Lern-Erklärungen und Soak-/Regressionstests ohne FullState oder verdeckte gegnerische Informationen.
- Die detaillierte Planung für V0.91 liegt vor: offizieller Kartenbild-Import als separates Asset-Gate nach V0.9, mit Quellen-/Nutzungsentscheidung, lokalem nicht versioniertem Bildcache, Anzeige nur bekannter Karten und harten Visibility-Grenzen.
- MVP 0.5 Requirements wurden eingefroren: Kartenimport-Spezifikation, Katalog-Spezifikation, Statusmodell, Testmatrix, Requirements Review, lokaler Snapshot, Import-Report, Katalogindex und Statusmanifest liegen vor.
- MVP 0.5 Requirements Gate ist bestanden: `ready_for_implementation: true`. Der Snapshot nutzt nur lokale versionierte Demo-/Projektdaten plus fiktive lokale Katalog-Fixtures; Import bleibt strikt getrennt von Spielbarkeit.
- MVP 0.5 Card Import und Card Catalog wurden implementiert: `@netrunner/catalog`, deterministische Snapshot-/Indexlogik, read-only Katalog-API, funktionale Katalogansicht, Visibility-Vertragstest und Browser-Smoke.
- MVP 0.5 Implementierungsgate ist bestanden: `ready_for_hardening: true`.
- MVP 0.5 Validierung, Hardening und Dokumentation sind abgeschlossen. Final Gate: `MVP_0.5_done: true`; `ready_for_MVP_0.6_requirements: true`.
- MVP 0.6 Requirements wurden eingefroren: Deckeditor-Spezifikation, Deckvalidierung v2, Match-Setup-Spezifikation, Deck-Storage-Spezifikation, Testmatrix, Requirements Review, lokales Formatprofil, Decktemplates, vier validierte Deck-Snapshots und Validierungsmanifest liegen vor.
- MVP 0.6 Requirements Gate ist bestanden: `ready_for_implementation: true`.
- MVP 0.6 Deck Editor und Match Setup Foundation wurden implementiert: reines Deck-Paket, lokale Decks, Validierung v2, deterministische Snapshots, Server-Matchstart-Revalidierung, safe Deckmetadaten, Web-Deck-API sowie funktionaler Deckeditor und Match-Setup-Auswahl.
- MVP 0.6 Implementierungsgate ist bestanden: `ready_for_hardening: true`.
- MVP 0.6 Validierung, Hardening und Dokumentation sind abgeschlossen. Final Gate: `MVP_0.6_done: true`.
- MVP 0.7 Requirements/Design Freeze ist abgeschlossen. Die UI-Neugestaltung ist auf Design C als Hauptstruktur, Design D als Run-/Encounter-Fokus und Design B als einklappbare Diagnose-Schicht eingefroren. Gate-Ergebnis: `ready_for_implementation: true`.
- MVP 0.7 UI-Neugestaltung wurde implementiert, validiert und dokumentiert: helle Clean-High-Contrast-Oberfläche, Entry-Preflight, Card Display Settings, image-ready generische CardView, Card Preview, RunTimeline, LegalActionsPanel, UndoPanel, EventLogPanel und Diagnostics Drawer. Final Gate: `MVP_0.7_done: true`; `ready_for_MVP_0.8_requirements: true`.
- MVP 0.8 Requirements wurden eingefroren: lokaler/fiktiver Starterset-Slice mit 14 neuen Karten, expliziten Resolvernamen, Manifestpflicht, Szenarioabdeckung, Visibility-, Replay/StateHash-, KI-Smoke-, Decklegalitäts- und Performance-Gates. Gate-Ergebnis: `ready_for_implementation: true`.
- MVP 0.8 wurde implementiert, validiert und dokumentiert: 14 lokale/fiktive neue Karten, explizite Runner-Event-, Corp-Operation- und Root-Rez-Resolver, V0.8-Katalog-/Deck-Snapshots, Server-Default-Matchsetup auf V0.8, AI-Smokes und vollständige Regression. Final Gate: `MVP_0.8_done: true`; `ready_for_MVP_0.9_requirements: true`.
- MVP 0.9 Requirements wurden eingefroren: stärkere KI mit side-sicherem Input-Vertrag, rollenbewussten Scorern, Difficulty-Profilen, Reason-Code-/Explanation-Safety, ObservedFacts, Soak-Matrix, Holdout-Seeds und Tuning-Change-Control. Gate-Ergebnis: `ready_for_implementation: true`.
- MVP 0.9 wurde implementiert, validiert und dokumentiert: rollenbewusste Runner-/Corp-Scorer, Difficulty-Profile, side-sichere Evidence und Explanations, ObservedFacts, Simulation-Metriken, Soak-Helfer und Server-V0.9-Profile. Final Gate: `MVP_0.9_done: true`.
- MVP 0.91 Requirements wurden eingefroren: Kartenbild-Asset-Gate, Quellen-/Nutzungsprüfung, Bild-Import-Spezifikation, Display-Spezifikation, Testmatrix, Requirements Review sowie strukturierte Source-Registry und Asset-Policy liegen vor. Gate-Ergebnis: `MVP_0.91_requirements_freeze_done: true`; `ready_for_implementation: true` nur für private lokale Kartenscans/lokale Kartenbilder als Anzeige-Artefakte. Öffentliche Distribution, offizielle Logos, standalone Card Frames, Card Backs, externe Kartendatenbank-Abhängigkeiten sowie Engine-/KI-/GameState-/Replay-/StateHash-Nutzung bleiben ausgeschlossen.
- S01 wurde als Sonderphase für Spielende, Ergebnisfenster, Spielziel, private Matchserie und Audio umgesetzt: `GameResultSummary`, Ergebnisfenster mit Perspektivtext, side-sichere Statistik, Spielziel-Auswahl `Regelmatch · 7 Agendapunkte`/`Einzelspiel · Deckziel`/`Private Matchserie · Seitenwechsel`, private Zwei-Spiel-Serie mit Seitenwechsel und opt-in Web-Audio-Effekte.
- V0.92 wurde als Mechanik-Inventar-, Requirements- und Spezifikationsgate abgeschlossen: menschliche und maschinenlesbare Mechanik-Coverage, M1-Requirements, M1-Effect-/Timing-Spezifikation, Testmatrix, Requirements Review und Final Review liegen vor. Gate-Ergebnis: `MVP_0.92_done: true`; `ready_for_MVP_0.93_implementation: true`.
- V0.93 wurde als M1-Engine-Fundament abgeschlossen: additive Shared-/Engine-Typen für Effects, Abilities, Choices und Eventklassifikation, `pendingChoice` in GameState/PlayerView, Choice-Revalidierung, Breaker Pump/Break als Ability-Pilot, side-sichere Server-/WebSocket-/Reconnect-Payloads und AI-LegalActions-Smoke sind umgesetzt. Gate-Ergebnis: `MVP_0.93_done: true`; `M2_requirements_ready: true`.
- Die detaillierte Planung für V0.94 und V0.95 liegt vor. Die Annahmenprüfung bestätigt V0.94 als Damage-/Flatline-Gate mit engem Game-End-Grundvertrag und V0.95 als Resource-/Tag-Interaktionsgate. V0.94 startet keinen vollen M2-Block; V0.95 startet kein Trace/Link/Bidding.
- V0.94 Requirements Freeze ist abgeschlossen. `MVP_0.94_REQUIREMENTS.md`, `DAMAGE_FLATLINE_0.94_SPEC.md`, `MVP_0.94_TEST_MATRIX.md` und `MVP_0.94_REQUIREMENTS_REVIEW.md` geben die Implementierung frei: Net-/Meat-Damage, RandomDrawRecords, Hidden-Info-Barriere, Undo-Block nach Damage und Flatline als enger Game-End-Grundvertrag.
- V0.94 Damage/Flatline ist umgesetzt und final geprüft. Net-/Meat-Damage laufen über freigegebene Engine-Pfade, nutzen RandomDrawRecords, erzeugen `hidden_info_barrier`-Events und blockieren Undo. Flatline ist als side-sicherer Game-End-Grund in Engine, Multiplayer-Result Summary und Web-UI verfügbar. Gate-Ergebnis: `MVP_0.94_done: true`; `ready_for_MVP_0.95_requirements_freeze: true`.
- V0.95 Requirements Freeze ist abgeschlossen. `MVP_0.95_REQUIREMENTS.md`, `RESOURCE_TAG_INTERACTION_0.95_SPEC.md`, `MVP_0.95_TEST_MATRIX.md` und `MVP_0.95_REQUIREMENTS_REVIEW.md` geben die Umsetzung frei: Runner-Resources, sichtbare installierte Resource-Zone und Corp-`trash_resource` bei getaggtem Runner für 1 Klick und 2 Credits. Trace, Link/Bidding, Hosting, Viren, Counter-Familien, Prevention/Avoid/Interrupt/Replacement und V0.96+ bleiben gesperrt.
- V0.95 Resources und Tag-Interaktion sind umgesetzt und final geprüft. Runner-Resources sind public installierte Boardkarten; `v095_safehouse_resource` ist eine lokale/fiktive Resource-Harness-Karte. Die Corp kann bei getaggtem Runner mit `trash_resource` für 1 Klick und 2 Credits eine installierte Resource trashen. Resource-Trash ist public, keine Hidden-Info-Barriere, Undo bleibt darüber möglich, Replay/StateHash bleiben deterministisch. Gate-Ergebnis: `MVP_0.95_done: true`; `ready_for_MVP_0.96_requirements_freeze: true`.
- V0.96 Requirements Freeze ist abgeschlossen. `MVP_0.96_REQUIREMENTS.md`, `TRACE_LINK_BIDDING_0.96_SPEC.md`, `MVP_0.96_TEST_MATRIX.md` und `MVP_0.96_REQUIREMENTS_REVIEW.md` geben die Umsetzung frei: Trace wird als öffentliche Bid-Sequenz modelliert, Corp bietet zuerst, Runner bietet danach, Erfolg ist `traceStrength > runnerStrength`, und der einzige freigegebene Erfolgseffekt ist `add_tag`. Trace-Damage, resource-spezifische Trace-Effekte, Jack-out/Breach/Multiaccess, Identity-Abilities, Hidden-Zone-Tools, Hosting, Viren, Counter-Familien und Prevention bleiben gesperrt. Gate-Ergebnis: `ready_for_MVP_0.96_implementation: true`.
- V0.96 Trace, Link und Bidding sind umgesetzt und final geprüft. `v096_trace_probe_ice` ist eine lokale/fiktive Trace-Harness-Karte. Trace startet aus einer ICE-Subroutine, erzeugt zuerst eine Corp-`bid_amount`-Choice und danach eine Runner-`bid_amount`-Choice. Beide Bids zahlen exakt Credits; Erfolg ist strict greater-than und gibt nur 1 Tag. Trace-Events sind public, keine Hidden-Info-Barriere, Undo bleibt darüber möglich, Replay/StateHash bleiben deterministisch und es gibt keine neue Randomness. Gate-Ergebnis: `MVP_0.96_done: true`; `ready_for_MVP_0.97_requirements_freeze: true`.
- V0.97 Requirements Freeze ist abgeschlossen. `MVP_0.97_REQUIREMENTS.md`, `RUN_BREACH_MULTIACCESS_0.97_SPEC.md`, `MVP_0.97_TEST_MATRIX.md` und `MVP_0.97_REQUIREMENTS_REVIEW.md` geben die Umsetzung frei: Jack-out als Runner-Movement-Fenster nach passiertem ICE, interner Breach-State, Access-Queue, R&D-/HQ-Multiaccess und side-sichere Breach-/Reconnect-/Undo-Verträge. Access-Replacement, Prevention, aktive Identity-Abilities, Hidden-Zone-Tools, Hosting, Viren, Counter-Familien und V0.98+ bleiben gesperrt. Gate-Ergebnis: `ready_for_MVP_0.97_implementation: true`.
- V0.97 Run, Jack-out, Breach und Multiaccess sind umgesetzt und final dokumentiert. V0.97-Baselines erhalten ein Movement-Fenster mit `jack_out`, Successful Runs erzeugen eine interne Breach-Queue, R&D-Multiaccess nutzt Top-N-Reihenfolge und HQ-Multiaccess nutzt Seed/RandomCounter/RandomDrawRecords ohne Replacement. `v097_deep_dive_event` ist eine lokale/fiktive Harness-Karte; `access_card` bleibt Hidden-Info-Barriere und blockiert Undo nach verdeckter Information. Gate-Ergebnis: `MVP_0.97_done: true`; `ready_for_MVP_0.98_requirements_freeze: true`.

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

- Kein gate-basierter MVP-0.1- bis MVP-0.9-Arbeitsschritt ist offen.
- Der nächste empfohlene Scope ist V0.98 Requirements Freeze/Umsetzung für Identity-Fähigkeiten und Hidden-Zone-Tools auf Basis der bestehenden Planungsartefakte. M2 kann später aus `docs/derived/SETUP_GAME_END_0.93_SPEC.md` starten. Identity-Abilities, Hidden-Zone-Tools, Hosting, Viren, Counter-Familien und Prevention sind weiterhin nicht spielbar, bis das jeweilige Gate umgesetzt ist.
- Core-Damage, Damage-Prevention, Avoid, Interrupt und Replacement bleiben zurückgestellt und sind nicht Teil des V0.94-Scopes.
- V0.2.1-Härtung bleibt ein optionaler Nachlaufstrang für Storage-/SQLite-Entscheidung, screenshotbasierte UI-Smokes und privaten Betrieb.
- UI-Neugestaltung und Designgestaltung sind bewusst V0.7 zugeordnet. Requirements, UI-Spezifikationen, Testmatrix und Requirements Review sind eingefroren.
- V0.5 darf keine Karte automatisch spielbar machen; V0.6 darf keinen Matchstart ohne validierte Deck-Snapshots erlauben.
- V0.7 darf echte Kartenabbilder nur nach separater Quellen-, Nutzungs- und Asset-Freigabe anzeigen; bis dahin bleiben generische Platzhalterkarten Standard. Hidden Cards dürfen auch im Bildmodus keine echten Kartenrücken, Bild-URLs, unterscheidbaren Ladezustände oder DOM-Metadaten erhalten.
- V0.8 ist abgeschlossen. Weitere Karten oder Mechanikgruppen dürfen nicht durch Importstatus, Katalogdaten oder Deckeditor-Freigaben spielbar werden, sondern brauchen weiterhin eigenes Resolver-, Manifest-, Test-, Visibility-, Replay/StateHash- und KI-Smoke-Gate.
- V0.9 ist abgeschlossen. Weitere KI-Arbeit darf den LegalActions-/PlayerView-/side-gefilterten-Event-Vertrag nicht aufweichen und keine FullState-, verdeckte Gegnerdaten- oder LLM-Regelakteur-Pfade einführen.
- V0.91 Requirements sind eingefroren und private lokale Scan-/Asset-Nutzung ist als Projektentscheidung dokumentiert. NetrunnerDB ist nur technische Kandidatenquelle für Bildmetadaten; Null-Signal-Primärquellen geben Card Art, Frames und Card Backs nicht pauschal frei. Bilder dürfen ausschließlich als private lokale Anzeige-Artefakte genutzt werden und dürfen keine Engine-, KI-, Deck-, Replay-, StateHash- oder Match-State-Daten beeinflussen.
- V0.92, V0.93, V0.94, V0.95, V0.96 und V0.97 sind abgeschlossen. Damage/Flatline, Resources, Trace/Link/Bidding und Run/Jack-out/Breach/Multiaccess sind nur in ihren engen Gates spielbar. Mulligan, Identity-Abilities, Hidden-Zone-Tools, Hosting, Viren, Counter-Familien und Prevention bleiben weiterhin nicht spielbar, bis das jeweilige Gate umgesetzt ist.
- S01-Mehrspiel-Serien sind als private Zwei-Spiel-Hülle umgesetzt. Der Seitenwechsel erfolgt über ein neues Einzelspiel mit neuem privaten Session-/Join-Kontext; öffentliche Turnier-, Ranking- und Matchmaking-Funktionen bleiben ausgeschlossen.
- V0.5-Importdaten dürfen keine Engine-, KI-, Deckvalidierungs- oder Matchstart-Freigabe auslösen. `deck_legal` setzt `playable` voraus.
- Vor weiteren technischen Schritten Node 24 LTS verwenden und bei Bedarf `corepack pnpm ...` statt direktem `pnpm` nutzen.

## Wichtige Grenzen

- MVP 0.1 und MVP 0.2 sind abgeschlossen; spätere Änderungen dürfen deren Gates nicht durch Scope-Ausweitung aufweichen.
- MVP 0.2 bleibt auf privaten Multiplayer begrenzt; öffentliche Plattformfunktionen brauchen eine spätere explizite Scope-Entscheidung.
- MVP 0.3 erweitert keine Karten und keine offiziellen Mechaniken; KI darf nur aus `LegalActions`, PlayerViews und side-gefilterten Events entscheiden.
- MVP 0.4 darf Karten und Mechaniken nur kontrolliert erweitern: interne fiktive Karten, Manifestpflicht, Testpflicht, Visibility-Gates und keine offiziellen Assets oder externen Kartendatenbanken. Damage bleibt vorerst außerhalb des Hauptscopes.
- `data/` ist hier nicht pauschal ignoriert, weil es versionierte Regeln, Karten, Decks, Manifeste, Abweichungen und Szenarien aufnehmen soll.
