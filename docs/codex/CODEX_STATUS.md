# CODEX_STATUS

## Current phase

Die Detailplanung fuer V1.3.1 Card Data Pipeline v2, V1.4.0 Planbasierte Corp-KI und V1.4.1 Planbasierte Runner-KI ist am 2026-05-08 requirements-gefroren. Erzeugt wurden je Release Detailplan, Requirements, Spezifikation, Testmatrix und Requirements Review sowie das gemeinsame Handoff `docs/derived/V1_3_1_TO_V1_4_1_IMPLEMENTATION_HANDOFF.md`. V1.3.1 ist der naechste Umsetzungsschritt nach abgeschlossenem V1.3.0-Gate; V1.4.0 startet erst nach gruenem V1.3.1-Final-Gate, V1.4.1 erst nach gruenem V1.4.0-Final-Gate. Keine Engine-, Server-, Web-, KI- oder Test-Codeimplementierung wurde in diesem Planungsschritt geschrieben.

V1.3.0 Format und Deckbuilding Foundation ist am 2026-05-08 nach abgeschlossenem V1.2.3-Gate umgesetzt, lokal verifiziert und final reviewt. Der Release fuehrt das private lokale Formatprofil `netgrid_private_local_v1` Version `1.3.0`, Format-/Card-Pool-Versionierung, restriktive Side-/Identity-/Faction-/Influence-/Agenda-/Copy-Limit-Deckvalidierung, `needs_revalidation` fuer alte lokale Decks, V1.3.0-Snapshots, serverseitige Matchstart-Revalidierung, decklistenfreie Public Metadata und ein AI-Gate auf `ai_supported` ein. `format_legal` ist getrennt sichtbar und kann nur einschraenken, nicht freigeben. Keine Public-Plattformfunktionen, keine offiziellen Assets, kein Kartentextparser und keine neuen Kartenfreigaben wurden eingefuehrt. Gate-Ergebnis: `V1_3_0_implemented: true`; `V1_3_0_verified: true`; `V1_3_0_done: true`.

V1.2.3 Mechanic Unlock Card Release 1 ist am 2026-05-08 nach abgeschlossenem V1.2.2-Gate umgesetzt, lokal verifiziert und final reviewt. Der Release aktiviert exakt 8 lokale O:NR-v1-Karten als `human_playable` und `deck_legal`: Dwarf, Krash, Snowball, Worm, Custodial Position, Executive Wiretaps, MIT West Tier und Overtime Incentives. Keine Karte ist `ai_supported`; der KI-Deckpool bleibt unverändert. Gate-Ergebnis: `V1_2_3_implemented: true`; `V1_2_3_verified: true`; `V1_2_3_done: true`; `ready_for_V1_3_0_implementation: true`.

V1.2.2 Special Zones, Ownership und Control ist am 2026-05-08 umgesetzt, lokal verifiziert und final reviewt. Der Release ergänzt `set_aside`, `removed_from_game`, explizite Spezialzonen-Sichtbarkeit, immutable Owner, kontrollierte Controller-Änderungen, PlayerView-/PublicEvent-/Reconnect-/Undo-/Replay-/StateHash-/KI-Redaction und eine kleine UI-Härtung gegen stale KI-Takt-Requests. Keine neuen Runtime-Karten, keine KI-Deckfreigabe, keine Format-/Deckbuilding-Regeln, keine offiziellen Assets und keine öffentlichen Plattformfunktionen wurden eingeführt. Gate-Ergebnis: `V1_2_2_implemented: true`; `V1_2_2_verified: true`; `V1_2_2_done: true`; `ready_for_V1_2_3_implementation: true`.

V1.2.0 Event Modification Foundation und V1.2.1 Replacement Effects sind am 2026-05-08 umgesetzt und lokal verifiziert. V1.1.3 wurde davor als Baseline-Preflight ohne Codeänderung geprüft: Statusmodell, Mechanik-Coverage, AI-Level-Audit und Handoff tragen die V1.2.x-Umsetzung. V1.2.0 ergänzt `ImminentEvent`, side-private `would`/`prevent`/`avoid`/enge `interrupt`-Fenster und Damage Prevention als test-only Pilot. V1.2.1 ergänzt danach eine getrennte Replacement-Pipeline mit Originalevent, Replacementevent, einmal-pro-Fenster-Regeln, deterministischer Kandidatenordnung und sichtbaren Konfliktblockern.

Die Detailplanung fuer V1.2.2, V1.2.3 und V1.3.0 ist am 2026-05-08 requirements-gefroren. Alle drei Releases wurden strikt sequenziell umgesetzt und abgeschlossen. Erzeugt wurden je Release Detailplan, Requirements, Spezifikation, Testmatrix und Requirements Review sowie das gemeinsame Handoff `docs/derived/V1_2_2_TO_V1_3_0_IMPLEMENTATION_HANDOFF.md`.

NETGRID ist seit 2026-05-08 der aktive App-/Projektname für Anwendung, technische Konfiguration, Workspace-Pakete, Server-Symbole, Storage-Namen, Browser-Speicherkeys, Startskript und E2E-Harness. Netrunner bleibt als fachliche Spiel-, Regel- und Quellenreferenz erhalten. Alte technische `netrunner`-/`NETRUNNER`-Namen bleiben nur als Legacy-Fallback, Importpfad oder historische Referenz bestehen. Verifikation der Umbenennung: `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build` und `corepack pnpm e2e` bestanden; der erste E2E-Versuch war nur durch einen bereits laufenden lokalen Next-Dev-Server blockiert und wurde nach Beenden dieses Prozesses erfolgreich wiederholt.

V1.1.2K kleines Kartenrelease nach V1.1.2 ist umgesetzt und lokal verifiziert. Es aktiviert genau 20 weitere lokal geprüfte O:NR-v1-Karten: Black Dahlia, Codecracker, Cyfermaster™, Loony Goon, Shaka, Wizard's Book, Laser Wire, Nerve Labyrinth, π in the 'Face, Quandary, Razor Wire, Reinforced Wall, Rock Is Strong, Scramble, Shotgun Wire, Sleeper, Wall of Ice, Wall of Static, Netwatch Credit Voucher und Night Shift. V1.0.5K und V1.0.6K bleiben aktiv; der private lokale Runtime-Katalog gibt damit 52 O:NR-v1-Karten `playable` und `deck_legal`. Keine weiteren Karten, keine neuen Mechanikfamilien, keine Prevention/Avoid/Replacement-Pfade, keine generischen Asset-/Node-/Upgrade-Fähigkeiten und keine offiziellen Assets wurden eingeführt.

V1.1.3 Mechanics-AI-Card Baseline ist am 2026-05-08 formal abgeschlossen. Der Release war ein Planungs- und Normalisierungsrelease ohne Engine-, Server-, Web-, KI- oder Test-Codeimplementierung; `ready_for_implementation: false` und `ready_for_next_release_implementation: true`. V1.1.3 normalisiert Mechanik-Coverage, Kartenstatus und KI-Level; die 52 O:NR-v1-Runtime-Karten bleiben `human_playable`/`deck_legal`, werden aber nicht automatisch `ai_supported`. Das 52-Karten-Mapping ist derzeit dokumentarisch, ein zusätzliches maschinenlesbares Kartenstatus-Artefakt existiert nicht.

V1.1.2 Full Archives Access und Matchstart Entry UX ist umgesetzt und lokal verifiziert. Der Release ergänzt vollständigen Runner-Access auf gemischte faceup/facedown Korp-Archives über die bestehende Breach-/Access-Pipeline, Archives-spezifische Hidden-Info-Klassifikation, side-sichere PlayerViews/Reconnect-Payloads, Reveal nur beim tatsächlichen Access, deterministischen Queue-Fortschritt, Trash aus Archives ohne doppelte Archives-Einträge, Replay-/StateHash-Abdeckung, Multiplayer-/Undo-/Idempotency-Tests und eine klarere NETGRID-Startkonsole mit Spielart-/Format-Kacheln, Join-Link-Beitritt, eingeklappten Sonderoptionen und side-sicherer Startzusammenfassung. Prevention, Avoid, Interrupts, Replacement Effects, Runner-Deckout-Siegbedingung, neue Karten, offizielle Assets und Plattformfeatures bleiben außerhalb des Scopes.

V1.1.1 Discard, Handlimit und Core Damage ist umgesetzt und lokal verifiziert. Der Release ergänzt Engine-Discard-Phasen für Korp und Runner, dynamische Handlimits im GameState und PlayerView, side-private Discard-Choices über `LegalActions`/`PlayerActions`, Korp-Discard facedown nach Archives, Runner-Discard in Heap, Core Damage als spielbaren Damage-Typ, dauerhafte Runner-Handlimit-Reduktion, Flatline bei negativem Runner-Handlimit zu Beginn des Runner-Discard-Steps sowie Multiplayer-/Reconnect-/Undo-/Visibility-/AI-/Web-UI-Abdeckung. Damage Prevention, Avoid, Interrupts, Replacement Effects, Runner-Deckout-Siegbedingung, offizielle Assets und Plattformfeatures bleiben außerhalb des Scopes.

V1.1.0 Setup/Game-End M2 und NETGRID-Statusklarheit ist umgesetzt und lokal verifiziert. Der Release ergänzt explizites Engine-Setup, private Runner-/Korp-Mulligan-Entscheidungen über `LegalActions`/`PlayerActions`, Agenda-Zielstandard 7 mit sichtbarem aktuellem Wert/Zielwert, konsolidierten Game-End-Vertrag für Agenda-Sieg, Korp-Deckout und Flatline, formalisierte Identity-PlayerViews, Archives-facedown-Grundlage ohne Full-Archives-Access, Setup-kompatible Multiplayer-/Reconnect-/KI-Flows und NETGRID-UI-Klarheit mit sichtbarer Schreibweise `Korp`, Lucide-Rollenicons, Agenda-/Tag-Icons und side-sicherer Setup-UI. Runner-Deckout wurde nur vorbereitet, nicht als neue Siegbedingung aktiviert.

V1.1.2 Implementation und Final Review liegen vor: `docs/derived/V1_1_2_IMPLEMENTATION_REVIEW.md` und `docs/derived/V1_1_2_FINAL_REVIEW.md`. Gate-Ergebnis: `V1_1_2_requirements_freeze_done: true`; `V1_1_2_implemented: true`; `V1_1_2_verified: true`; `V1_1_2_done: true`.

V1.1.2K Plan, Manifest, Szenario und Implementation Review liegen vor: `docs/derived/V1_1_2K_CARD_RELEASE_PLAN.md`, `data/manifests/card-implementation-manifest-1.1.2k.json`, `data/scenarios/v112k-card-release-smoke.json` und `docs/derived/V1_1_2K_CARD_RELEASE_IMPLEMENTATION_REVIEW.md`. Gate-Ergebnis: `V1_1_2K_card_release_done: true`.

V1.1.3/V1.2.0/V1.2.1/V1.2.2/V1.2.3/V1.3.0 Planungs-, Requirements-, Implementation- und Final-Artefakte liegen vor: `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_PLAN.md`, `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_REQUIREMENTS.md`, `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_TEST_MATRIX.md`, `docs/derived/V1_1_3_REQUIREMENTS_REVIEW.md`, `docs/derived/V1_1_3_FINAL_REVIEW.md`, `docs/derived/V1_2_0_EVENT_MODIFICATION_DETAILED_PLAN.md`, `docs/derived/V1_2_0_REQUIREMENTS.md`, `docs/derived/EVENT_MODIFICATION_1_2_0_SPEC.md`, `docs/derived/V1_2_0_TEST_MATRIX.md`, `docs/derived/V1_2_0_REQUIREMENTS_REVIEW.md`, `docs/derived/V1_2_0_IMPLEMENTATION_REVIEW.md`, `docs/derived/V1_2_0_FINAL_REVIEW.md`, `docs/derived/V1_2_1_REPLACEMENT_EFFECTS_DETAILED_PLAN.md`, `docs/derived/V1_2_1_REQUIREMENTS.md`, `docs/derived/REPLACEMENT_EFFECTS_1_2_1_SPEC.md`, `docs/derived/V1_2_1_TEST_MATRIX.md`, `docs/derived/V1_2_1_REQUIREMENTS_REVIEW.md`, `docs/derived/V1_2_1_IMPLEMENTATION_REVIEW.md`, `docs/derived/V1_2_1_FINAL_REVIEW.md`, `docs/derived/V1_2_2_SPECIAL_ZONES_OWNERSHIP_CONTROL_DETAILED_PLAN.md`, `docs/derived/V1_2_2_REQUIREMENTS.md`, `docs/derived/SPECIAL_ZONES_OWNERSHIP_CONTROL_1_2_2_SPEC.md`, `docs/derived/V1_2_2_TEST_MATRIX.md`, `docs/derived/V1_2_2_REQUIREMENTS_REVIEW.md`, `docs/derived/V1_2_2_IMPLEMENTATION_REVIEW.md`, `docs/derived/V1_2_2_FINAL_REVIEW.md`, `docs/derived/V1_2_3_IMPLEMENTATION_PREFLIGHT.md`, `docs/derived/V1_2_3_IMPLEMENTATION_REVIEW.md`, `docs/derived/V1_2_3_FINAL_REVIEW.md`, `docs/derived/V1_3_0_IMPLEMENTATION_REVIEW.md`, `docs/derived/V1_3_0_FINAL_REVIEW.md`, `data/manifests/card-implementation-manifest-1.2.3.json`, `data/scenarios/v123-card-release-smoke.json`, `data/decks/deck-format-profiles-1.3.0.json`, `data/manifests/deck-validation-manifest-1.3.0.json`, `data/scenarios/v130-format-deckbuilding-smoke.json`, `docs/derived/V1_1_3_TO_V1_2_1_IMPLEMENTATION_HANDOFF.md` und `docs/derived/V1_2_2_TO_V1_3_0_IMPLEMENTATION_HANDOFF.md`. Mechanik-Coverage ist zusätzlich in `data/rules/mechanics-coverage-1.2.2.json` festgehalten. Gate-Ergebnis: `V1_1_3_preflight_checked: true`; `V1_1_3_done: true`; `V1_2_0_implemented: true`; `V1_2_0_verified: true`; `V1_2_0_done: true`; `V1_2_1_implemented: true`; `V1_2_1_verified: true`; `V1_2_1_done: true`; `V1_2_2_implemented: true`; `V1_2_2_verified: true`; `V1_2_2_done: true`; `V1_2_3_implemented: true`; `V1_2_3_verified: true`; `V1_2_3_done: true`; `V1_3_0_implemented: true`; `V1_3_0_verified: true`; `V1_3_0_done: true`.

Post-V1.1.2 Anschlussplanung vom 2026-05-07: `docs/derived/POST_V1_1_2_MECHANICS_AI_CARD_ROADMAP.md` legt fest, dass V1.1.2 unverändert bleibt und danach eine kombinierte Mechanik-/Karten-/KI-Linie startet. Schwerpunkt ist mehr spielbare Karten durch fehlende Mechaniken; die KI wird nicht als spätes isoliertes V1.7-Feature behandelt, sondern bekommt in jedem Mechanik- und Kartenrelease eine eigene Support-Spur. Empfohlener erster Schritt nach V1.1.2 ist V1.1.3 Mechanics-AI-Card Baseline ohne Codeimplementierung.

Konsolidierte Releaseplanung vom 2026-05-08: `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md` ist ab V1.1.3 die führende Roadmap. Sie übernimmt die neuere Post-V1.1.2-Grundlinie, integriert die ältere V2/V3/V4-Produktvision als spätere Gate-Schicht und schreibt für jeden Release die drei Pflichtspuren Allgemeine Produkt-/Feature-Ziele, Mechaniken/Karten/Effekt-Vervollständigung und KI-Spieler fest.

V1.0.9 Private Internet Hardening ist umgesetzt und lokal verifiziert. Der Release ergänzt getrennte Deployment-Profile `local`/`private_internet`, HTTPS/WSS-Konfigurationsprüfungen für privaten Internetbetrieb, explizite REST-/WebSocket-Origin-Allowlist, deterministische Rate-Limits für sensible Flows, verpflichtenden Internet-Token-Salt, Token-/Hash-/Hidden-Info-Redaction, sichere Health-/Ops-Signale und internetnahe Smokes. Er führt keine öffentlichen Plattformfunktionen, Accounts, Matchmaking, Rankings, Turniere, neuen Karten, neuen Mechaniken, Postgres-, Replay-/StateHash- oder Engine-Autoritätsänderungen ein.

Aktuelle lokale UI-/Ablaufkorrektur vom 2026-05-06/2026-05-07: Die aktive Spieloberfläche hält zentrale Corp-Server unten fest in der Reihenfolge `HQ`, `F&E (R&D)`, `Archive`; Außenserver entstehen darüber. Der eigene Statusbereich sitzt links unter Aktionen/Zurücknehmen, Spielerwert-Flächen sind seitenfarbig hinterlegt und markieren die aktuelle Zugseite mit Rahmen, Aktionen erscheinen als eigene horizontale Leiste, Tags werden nur beim Runner angezeigt, die Kartenvorschau ist vollständig einklappbar, getaktete KI-Zugriffshinweise laufen nach Anzeige automatisch weiter, zentrale HQ-/F&E-Zugriffe werden aus Corp-Sicht in PlayerViews/WebSocket-Payloads redigiert, bestehende Außenserver mit Agenda/Asset im Root bieten keine weitere Agenda-/Asset-Installation in denselben Root mehr an, KI-Erklärtexte werden nicht mehr als normale Chronikbeschreibung angezeigt, Runner-KI-Runs bleiben im getakteten Modus nicht mehr an Hinweis-Timern hängen, Corp-Rezfenster im Human-Corp-vs-Runner-KI-Modus warten wieder explizit auf `Rezzen` oder `Nicht rezzen`, und das Spielziel ist wieder regelhaft auf 7 Agendapunkte festgezogen. Der alte deckabhängige Modus `Einzelspiel · Deckziel` ist keine auswählbare Produktoption mehr; alte `single_game`-Eingaben werden als `rules_match` behandelt.

Aktuelle lokale Ergebnis- und Symbolkorrektur vom 2026-05-07: Die private Zwei-Spiel-Serie nutzt bei gleicher Spielgewinnzahl jetzt die Summe der Agenda-Punkte als Tiebreaker; nur gleiche Siege und gleiche Agenda-Punkte ergeben ein Serien-Unentschieden. `GameResultSummary.series` liefert dafür `viewerSeriesOutcome` und `seriesDecision`. Das Ergebnisfenster trennt Zahlen und Einheiten lesbarer, Agenda nutzt ein Auszeichnungs-/Score-Icon statt eines Dokument-Icons, Tags nutzen ein Zielscheiben-Icon, und Credits/Kostenchips sind wieder goldfarben, damit Geld klar von Agenda-Blau getrennt ist.

Aktuelle lokale Deckbibliothekskorrektur vom 2026-05-07, aktualisiert mit der NETGRID-Umbenennung am 2026-05-08: Persönliche bearbeitbare Decks werden über eine lokale Datei-Deckbibliothek gespeichert statt nur im Browser-`localStorage`. Standardpfad ist `%APPDATA%\NetGrid\Decks`, überschreibbar per `NETGRID_DECK_LIBRARY_PATH`; `NETRUNNER_DECK_LIBRARY_PATH` bleibt als Legacy-Fallback lesbar. Alte Browser-Decks unter `netrunner-v0-6-local-decks` werden beim ersten leeren Datei-Start in den neuen `netgrid-v0-6-local-decks`-Kompatibilitätspfad und danach in die Datei-Deckbibliothek übernommen. Match-Snapshots bleiben weiterhin getrennt in der Multiplayer-Persistenz.

V1.0.8 Storage/Backup-Härtung ist umgesetzt und lokal verifiziert. SQLite ist jetzt der private lokale Standard-Storage für Multiplayer-Matches; JSON bleibt Legacy-/Test-/Migrationseingang. Der Release ergänzt kontrollierten Legacy-Import aus `data/runtime/multiplayer/matches.json`, `storage_meta` mit Schema-Versionierung, Backup/Restore mit Manifest und Prüfsummen, Recovery-Verhalten, redaktionierte Health-/Diagnoseflächen und V1.0.7-E2E-Isolation über temporäre SQLite-Datenbanken.

V1.0.6K kleines Karten-Nachrelease nach V1.0.6 ist umgesetzt und lokal verifiziert. Es aktiviert 20 weitere lokal geprüfte O:NR-v1-Karten: Bodyweight™ Synthetic Blood, Jack 'n' Joe, Livewire's Contacts, Score!, Wild Card, WuTech Mem Chip, Tycho Extension, Accounts Receivable, Annual Reviews, Closed Accounts, Datapool® by Zetatech, Day Shift, Efficiency Experts, Punitive Counterstrike, Scorched Earth, Urban Renewal, Filter, Fire Wall, Keeper und Mazer. Die vorherige V1.0.5K-Freigabe mit 12 Karten bleibt aktiv.

V1.0.5K kleines Karten-Nachrelease nach V1.0.5 ist umgesetzt und lokal verifiziert. Die finale Freigabe umfasst 12 lokal geprüfte O:NR-v1-Karten: Codeslinger, Raffles, Raptor, Tinweasel, Tycho Mem Chip, Zetatech Mem Chip, Hostile Takeover, Cortical Scanner, Crystal Wall, Data Wall, Data Wall 2.0 und Endless Corridor. Dogcatcher, Flak, Reflector, Shield, Corporate War und Political Overthrow bleiben wegen zusätzlicher Mechanikfamilien zurückgestellt.

V1.0.7 Browser-E2E und Visual QA is implemented and locally verified. The release adds a reproducible Playwright browser gate for repeatable two-context browser smokes, viewport checks, screenshots and DOM/Storage/Payload leak scans over the existing V1.x UI. V1.0.8 carries that gate forward on SQLite runtime isolation. Neither release adds cards, mechanics, official assets, Replay/StateHash changes or public platform features.

V1.0.6 Aktionen, Credits und Kartenanzeige ist umgesetzt und lokal verifiziert. V1.0.5K kleines Karten-Nachrelease nach V1.0.5 ist umgesetzt und lokal verifiziert. V1.0.5 Action Board UX und Board-Klarheit ist im Workspace als passende UI-Basis vorhanden, aber ohne eigene formale Finalartefakte dokumentiert. V1.0.4 Private Match Lifecycle und Session Recovery ist umgesetzt und lokal verifiziert. V1.0.3 Matchstart-UX ist umgesetzt und lokal verifiziert. V1.0.2 Gegner-Aktionsdarstellung und Ablauftransparenz ist umgesetzt und lokal verifiziert. V1.0.1 Deckbibliothek und Join-Deck-Handshake ist lokal umgesetzt und verifiziert.

V0.99 Counter/Hosting/Virus/Purge/Recurring-Credits/Bad-Publicity implementation, validation and documentation are complete. S01 result modal, game-goal selection, private two-game side-swap series and opt-in audio are complete. V1.0 stabilizes Deck Editor, Matchstart, personal series deck pairs, KI deck policy and private local O:NR smokes. V1.0.1 makes saved local decks the normal Matchstart/Join flow and adds the Human-vs-Human Join-Deck-Handshake. V1.0.2 adds side-safe live opponent action cues, AI pacing, board highlights and opt-in action audio as a presentation/orchestration release. V1.0.3 separates Matchstart choices and adds the private Human-vs-Human start readiness lobby. V1.0.4 adds terminal private-match lifecycle commands, Session Recovery hardening, Recreate and side-safe opponent names. V1.0.5 Action Board UX and Board-Klarheit has frozen requirements and a suitable implemented UI baseline in the workspace, but no dedicated V1.0.5 implementation/final review artifacts. V1.0.5K is locally verified as a narrow card-release insert. V1.0.6 is implemented as a UI clarity release for action slots, generic credit visuals, cost chips and compact card-display modes, without Engine, card, Replay or StateHash expansion. V1.0.7 is implemented as a Browser-E2E/Visual-QA quality gate. V1.0.8 is implemented as a SQLite-backed private local Storage/Backup hardening gate. The planned V0.94 to V0.99 mechanics sequence is implemented in narrow, gate-oriented slices. M11+ mechanics remain unimplemented until their own gates.

Latest audit artifact: `docs/derived/BESTANDSAUFNAHME_2026-05-04.md`.
Latest deck/match planning artifact: `docs/derived/V1_0_DECK_MATCH_STABILIZATION_PLAN.md`.
Latest V1.0 final review artifact: `docs/derived/V1_0_DECK_MATCH_STABILIZATION_FINAL_REVIEW.md`.
Latest V1.0.1 planning artifact: `docs/derived/V1_0_1_JOIN_DECK_HANDSHAKE_PLAN.md`.
Latest V1.0.2 planning artifact: `docs/derived/V1_0_2_OPPONENT_ACTION_PRESENTATION_PLAN.md`.
Latest V1.0.2 requirements artifact: `docs/derived/V1_0_2_REQUIREMENTS.md`.
Latest V1.0.2 presentation spec artifact: `docs/derived/OPPONENT_ACTION_PRESENTATION_SPEC.md`.
Latest V1.0.2 test matrix artifact: `docs/derived/V1_0_2_TEST_MATRIX.md`.
Latest V1.0.2 requirements review artifact: `docs/derived/V1_0_2_REQUIREMENTS_REVIEW.md`.
Latest V1.0.2 implementation review artifact: `docs/derived/V1_0_2_IMPLEMENTATION_REVIEW.md`.
Latest V1.0.2 final review artifact: `docs/derived/V1_0_2_FINAL_REVIEW.md`.
Latest V1.0.3 planning artifact: `docs/derived/V1_0_3_MATCHSTART_UX_PLAN.md`.
Latest V1.0.3 final review artifact: `docs/derived/V1_0_3_MATCHSTART_UX_FINAL_REVIEW.md`.
Latest V1.0.4 candidate backlog artifact: `docs/derived/V1_0_4_NEXT_RELEASE_CANDIDATES.md`.
Latest historical general release planning artifact: `docs/derived/RELEASE_PLANNING_2026-05-05.md`.
Latest V1.0.4 planning artifact: `docs/derived/V1_0_4_PRIVATE_MATCH_LIFECYCLE_PLAN.md`.
Latest V1.0.4 requirements artifact: `docs/derived/V1_0_4_REQUIREMENTS.md`.
Latest V1.0.4 implementation review artifact: `docs/derived/V1_0_4_IMPLEMENTATION_REVIEW.md`.
Latest V1.0.4 final review artifact: `docs/derived/V1_0_4_FINAL_REVIEW.md`.
Latest V1.0.4 two-tab smoke artifact: `docs/derived/V1_0_4_TWO_TAB_SMOKE.md`.
Latest V1.0.5 planning artifact: `docs/derived/V1_0_5_ACTION_BOARD_UX_PLAN.md`.
Latest V1.0.5 requirements artifact: `docs/derived/V1_0_5_REQUIREMENTS.md`.
Latest V1.0.5 action-board UX spec artifact: `docs/derived/ACTION_BOARD_UX_1_0_5_SPEC.md`.
Latest V1.0.5 board/run UI spec artifact: `docs/derived/BOARD_RUN_UI_1_0_5_SPEC.md`.
Latest V1.0.5 test matrix artifact: `docs/derived/V1_0_5_TEST_MATRIX.md`.
Latest V1.0.5 requirements review artifact: `docs/derived/V1_0_5_REQUIREMENTS_REVIEW.md`.
Latest V1.0.5 browser/playtest smoke artifact: `docs/derived/V1_0_5_BROWSER_PLAYTEST_SMOKE.md`.
Latest V1.0.5K card-release requirements artifact: `docs/derived/V1_0_5K_CARD_RELEASE_REQUIREMENTS.md`.
Latest V1.0.5K card-release implementation review artifact: `docs/derived/V1_0_5K_CARD_RELEASE_IMPLEMENTATION_REVIEW.md`.
Latest V1.0.6 planning artifact: `docs/derived/V1_0_6_UI_RESOURCE_CLARITY_PLAN.md`.
Latest V1.0.6 requirements artifact: `docs/derived/V1_0_6_REQUIREMENTS.md`.
Latest V1.0.6 resource/card-display spec artifact: `docs/derived/RESOURCE_CARD_DISPLAY_1_0_6_SPEC.md`.
Latest V1.0.6 test matrix artifact: `docs/derived/V1_0_6_TEST_MATRIX.md`.
Latest V1.0.6 requirements review artifact: `docs/derived/V1_0_6_REQUIREMENTS_REVIEW.md`.
Latest V1.0.6 browser/playtest smoke artifact: `docs/derived/V1_0_6_BROWSER_PLAYTEST_SMOKE.md`.
Latest V1.0.6 implementation review artifact: `docs/derived/V1_0_6_IMPLEMENTATION_REVIEW.md`.
Latest V1.0.6 final review artifact: `docs/derived/V1_0_6_FINAL_REVIEW.md`.
Latest V1.0.6K card-release requirements artifact: `docs/derived/V1_0_6K_CARD_RELEASE_REQUIREMENTS.md`.
Latest V1.0.6K card-release implementation review artifact: `docs/derived/V1_0_6K_CARD_RELEASE_IMPLEMENTATION_REVIEW.md`.
Latest V1.0.7 planning artifact: `docs/derived/V1_0_7_BROWSER_E2E_VISUAL_QA_PLAN.md`.
Latest V1.0.7 requirements artifact: `docs/derived/V1_0_7_REQUIREMENTS.md`.
Latest V1.0.7 browser E2E/Visual QA spec artifact: `docs/derived/BROWSER_E2E_VISUAL_QA_1_0_7_SPEC.md`.
Latest V1.0.7 test matrix artifact: `docs/derived/V1_0_7_TEST_MATRIX.md`.
Latest V1.0.7 requirements review artifact: `docs/derived/V1_0_7_REQUIREMENTS_REVIEW.md`.
Latest V1.0.7 implementation review artifact: `docs/derived/V1_0_7_IMPLEMENTATION_REVIEW.md`.
Latest V1.0.7 final review artifact: `docs/derived/V1_0_7_FINAL_REVIEW.md`.
Latest V1.0.8 planning artifact: `docs/derived/V1_0_8_STORAGE_BACKUP_HARDENING_PLAN.md`.
Latest V1.0.8 requirements artifact: `docs/derived/V1_0_8_REQUIREMENTS.md`.
Latest V1.0.8 SQLite storage spec artifact: `docs/derived/STORAGE_SQLITE_1_0_8_SPEC.md`.
Latest V1.0.8 backup/recovery spec artifact: `docs/derived/BACKUP_RECOVERY_1_0_8_SPEC.md`.
Latest V1.0.8 test matrix artifact: `docs/derived/V1_0_8_TEST_MATRIX.md`.
Latest V1.0.8 requirements review artifact: `docs/derived/V1_0_8_REQUIREMENTS_REVIEW.md`.
Latest V1.0.8 implementation review artifact: `docs/derived/V1_0_8_IMPLEMENTATION_REVIEW.md`.
Latest V1.0.8 final review artifact: `docs/derived/V1_0_8_FINAL_REVIEW.md`.
Latest V1.0.9 planning artifact: `docs/derived/V1_0_9_PRIVATE_INTERNET_HARDENING_PLAN.md`.
Latest V1.0.9 requirements artifact: `docs/derived/V1_0_9_REQUIREMENTS.md`.
Latest V1.0.9 private internet security spec artifact: `docs/derived/PRIVATE_INTERNET_SECURITY_1_0_9_SPEC.md`.
Latest V1.0.9 private deployment ops spec artifact: `docs/derived/PRIVATE_DEPLOYMENT_OPS_1_0_9_SPEC.md`.
Latest V1.0.9 test matrix artifact: `docs/derived/V1_0_9_TEST_MATRIX.md`.
Latest V1.0.9 requirements review artifact: `docs/derived/V1_0_9_REQUIREMENTS_REVIEW.md`.
Latest V1.0.9 implementation review artifact: `docs/derived/V1_0_9_IMPLEMENTATION_REVIEW.md`.
Latest V1.0.9 final review artifact: `docs/derived/V1_0_9_FINAL_REVIEW.md`.
Latest V1.1.0 Setup/Game-End M2 planning artifact: `docs/derived/V1_1_0_SETUP_GAME_END_M2_DETAILED_PLAN.md`.
Latest V1.1.0 requirements artifact: `docs/derived/V1_1_0_REQUIREMENTS.md`.
Latest V1.1.0 test matrix artifact: `docs/derived/V1_1_0_TEST_MATRIX.md`.
Latest V1.1.0 implementation review artifact: `docs/derived/V1_1_0_IMPLEMENTATION_REVIEW.md`.
Latest V1.1.0 final review artifact: `docs/derived/V1_1_0_FINAL_REVIEW.md`.
Latest V1.1.1 Discard/Handlimit/Core Damage planning artifact: `docs/derived/V1_1_1_DISCARD_HANDLIMIT_CORE_DAMAGE_PLAN.md`.
Latest V1.1.1 requirements artifact: `docs/derived/V1_1_1_REQUIREMENTS.md`.
Latest V1.1.1 mechanics spec artifact: `docs/derived/DISCARD_HANDLIMIT_CORE_DAMAGE_1_1_1_SPEC.md`.
Latest V1.1.1 test matrix artifact: `docs/derived/V1_1_1_TEST_MATRIX.md`.
Latest V1.1.1 requirements review artifact: `docs/derived/V1_1_1_REQUIREMENTS_REVIEW.md`.
Latest V1.1.1 implementation review artifact: `docs/derived/V1_1_1_IMPLEMENTATION_REVIEW.md`.
Latest V1.1.1 final review artifact: `docs/derived/V1_1_1_FINAL_REVIEW.md`.
Latest V1.1.2 integrated planning artifact: `docs/derived/V1_1_2_FULL_ARCHIVES_AND_MATCHSTART_ENTRY_UX_PLAN.md`.
Latest V1.1.2 requirements artifact: `docs/derived/V1_1_2_REQUIREMENTS.md`.
Latest V1.1.2 Full Archives spec artifact: `docs/derived/FULL_ARCHIVES_ACCESS_1_1_2_SPEC.md`.
Latest V1.1.2 Matchstart Entry UX spec artifact: `docs/derived/MATCHSTART_ENTRY_UX_1_1_2_SPEC.md`.
Latest V1.1.2 test matrix artifact: `docs/derived/V1_1_2_TEST_MATRIX.md`.
Latest V1.1.2 requirements review artifact: `docs/derived/V1_1_2_REQUIREMENTS_REVIEW.md`.
Latest V1.1.2 implementation review artifact: `docs/derived/V1_1_2_IMPLEMENTATION_REVIEW.md`.
Latest V1.1.2 final review artifact: `docs/derived/V1_1_2_FINAL_REVIEW.md`.
Latest V1.1.2K card-release plan artifact: `docs/derived/V1_1_2K_CARD_RELEASE_PLAN.md`.
Latest V1.1.2K card-release implementation review artifact: `docs/derived/V1_1_2K_CARD_RELEASE_IMPLEMENTATION_REVIEW.md`.
Latest V1.1.3 baseline plan artifact: `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_PLAN.md`.
Latest V1.1.3 baseline requirements artifact: `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_REQUIREMENTS.md`.
Latest V1.1.3 baseline test matrix artifact: `docs/derived/V1_1_3_MECHANICS_AI_CARD_BASELINE_TEST_MATRIX.md`.
Latest V1.1.3 requirements review artifact: `docs/derived/V1_1_3_REQUIREMENTS_REVIEW.md`.
Latest V1.1.3 final review artifact: `docs/derived/V1_1_3_FINAL_REVIEW.md`.
Latest V1.2.0 event modification plan artifact: `docs/derived/V1_2_0_EVENT_MODIFICATION_DETAILED_PLAN.md`.
Latest V1.2.0 requirements artifact: `docs/derived/V1_2_0_REQUIREMENTS.md`.
Latest V1.2.0 event modification spec artifact: `docs/derived/EVENT_MODIFICATION_1_2_0_SPEC.md`.
Latest V1.2.0 test matrix artifact: `docs/derived/V1_2_0_TEST_MATRIX.md`.
Latest V1.2.0 requirements review artifact: `docs/derived/V1_2_0_REQUIREMENTS_REVIEW.md`.
Latest V1.2.0 implementation review artifact: `docs/derived/V1_2_0_IMPLEMENTATION_REVIEW.md`.
Latest V1.2.0 final review artifact: `docs/derived/V1_2_0_FINAL_REVIEW.md`.
Latest V1.2.1 replacement effects plan artifact: `docs/derived/V1_2_1_REPLACEMENT_EFFECTS_DETAILED_PLAN.md`.
Latest V1.2.1 requirements artifact: `docs/derived/V1_2_1_REQUIREMENTS.md`.
Latest V1.2.1 replacement effects spec artifact: `docs/derived/REPLACEMENT_EFFECTS_1_2_1_SPEC.md`.
Latest V1.2.1 test matrix artifact: `docs/derived/V1_2_1_TEST_MATRIX.md`.
Latest V1.2.1 requirements review artifact: `docs/derived/V1_2_1_REQUIREMENTS_REVIEW.md`.
Latest V1.2.1 implementation review artifact: `docs/derived/V1_2_1_IMPLEMENTATION_REVIEW.md`.
Latest V1.2.1 final review artifact: `docs/derived/V1_2_1_FINAL_REVIEW.md`.
Latest V1.2.3 card-release preflight artifact: `docs/derived/V1_2_3_IMPLEMENTATION_PREFLIGHT.md`.
Latest V1.2.3 card-release implementation review artifact: `docs/derived/V1_2_3_IMPLEMENTATION_REVIEW.md`.
Latest V1.2.3 card-release final review artifact: `docs/derived/V1_2_3_FINAL_REVIEW.md`.
Latest V1.2.3 card-release manifest artifact: `data/manifests/card-implementation-manifest-1.2.3.json`.
Latest V1.2.3 card-release scenario artifact: `data/scenarios/v123-card-release-smoke.json`.
Latest V1.2.2 special zones implementation review artifact: `docs/derived/V1_2_2_IMPLEMENTATION_REVIEW.md`.
Latest V1.2.2 special zones final review artifact: `docs/derived/V1_2_2_FINAL_REVIEW.md`.
Latest V1.2.2 mechanics coverage artifact: `data/rules/mechanics-coverage-1.2.2.json`.
Latest V1.1.3-to-V1.2.1 implementation handoff artifact: `docs/derived/V1_1_3_TO_V1_2_1_IMPLEMENTATION_HANDOFF.md`.
Latest V1.3.1 planning artifacts: `docs/derived/V1_3_1_CARD_DATA_PIPELINE_V2_DETAILED_PLAN.md`, `docs/derived/V1_3_1_REQUIREMENTS.md`, `docs/derived/CARD_DATA_PIPELINE_1_3_1_SPEC.md`, `docs/derived/V1_3_1_TEST_MATRIX.md`, `docs/derived/V1_3_1_REQUIREMENTS_REVIEW.md`.
Latest V1.4.0 planning artifacts: `docs/derived/V1_4_0_PLAN_BASED_CORP_AI_DETAILED_PLAN.md`, `docs/derived/V1_4_0_REQUIREMENTS.md`, `docs/derived/PLAN_BASED_CORP_AI_1_4_0_SPEC.md`, `docs/derived/V1_4_0_TEST_MATRIX.md`, `docs/derived/V1_4_0_REQUIREMENTS_REVIEW.md`.
Latest V1.4.1 planning artifacts: `docs/derived/V1_4_1_PLAN_BASED_RUNNER_AI_DETAILED_PLAN.md`, `docs/derived/V1_4_1_REQUIREMENTS.md`, `docs/derived/PLAN_BASED_RUNNER_AI_1_4_1_SPEC.md`, `docs/derived/V1_4_1_TEST_MATRIX.md`, `docs/derived/V1_4_1_REQUIREMENTS_REVIEW.md`.
Latest V1.3.1-to-V1.4.1 implementation handoff artifact: `docs/derived/V1_3_1_TO_V1_4_1_IMPLEMENTATION_HANDOFF.md`.
Latest post-V1.1.2 mechanics/AI/card roadmap artifact: `docs/derived/POST_V1_1_2_MECHANICS_AI_CARD_ROADMAP.md`.
Latest consolidated release roadmap artifact: `docs/derived/NETGRID_CONSOLIDATED_RELEASE_ROADMAP.md`.
Latest card rule text formatting artifact: `docs/derived/CARD_RULE_TEXT_FORMATTING_SPEC.md`.
Latest long-term product vision artifact: `docs/derived/LONG_TERM_PRODUCT_VISION_AND_ROADMAP.md`.
Latest long-term executive summary artifact: `docs/derived/LONG_TERM_PRODUCT_VISION_EXECUTIVE_SUMMARY.md`.

Current selected next scope: V1.3.1 Card Data Pipeline v2 gemäß `docs/derived/V1_3_1_TO_V1_4_1_IMPLEMENTATION_HANDOFF.md`, nach abgeschlossenem V1.3.0-Gate. V1.4.0 Planbasierte Corp-KI und V1.4.1 Planbasierte Runner-KI sind requirements-gefrorene Folge-Releases, duerfen aber erst nach dem jeweils vorherigen gruenen Final-Gate starten. V1.1.3 Baseline-Preflight, V1.2.0 Event Modification Foundation, V1.2.1 Replacement Effects, V1.2.2 Special Zones/Ownership/Control, V1.2.3 Mechanic Unlock Card Release 1 und V1.3.0 Format und Deckbuilding Foundation sind abgeschlossen und lokal verifiziert. V1.1.2K kleines Kartenrelease, V1.1.2 Full Archives Access und Matchstart Entry UX, V1.1.1 Discard/Handlimit/Core Damage, V1.1.0 Setup/Game-End M2, V1.0.9 Private Internet Hardening and V1.0.8 Storage/Backup-Härtung are complete and locally verified. The V1.0.5 formal gate remains historically incomplete because no dedicated V1.0.5 implementation/final review artifacts exist, but the workspace code supplied the required V1.0.5 UI baseline for V1.0.6 and V1.0.7 QA.

## Status

Phase 1, MVP 0.1 executable requirements, is complete and committed.

`ready_for_implementation: true`

Phase 2, MVP 0.1 implementation, is implemented and locally verified.

`ready_for_hardening: true`

Phase 3, MVP 0.1 validation, hardening and documentation, is complete.

`MVP_0.1_done: true`

`ready_for_MVP_0.2_requirements: true`

MVP 0.2 requirements are complete.

`ready_for_implementation: true`

MVP 0.2 private multiplayer implementation is complete and locally verified.

`ready_for_hardening: true`

MVP 0.2 validation, hardening and documentation are complete.

`MVP_0.2_done: true`

Post-MVP 0.2 roadmap and MVP 0.3 detailed planning are complete.

`ready_for_MVP_0.3_requirements: true`

MVP 0.4 detailed planning is complete as a future gated phase.

`MVP_0.4_detailed_plan_available: true`

`ready_for_MVP_0.4_requirements_after_MVP_0.3_done: true`

MVP 0.3 requirements, implementation, validation and documentation are complete.

`MVP_0.3_done: true`

`ready_for_MVP_0.4_requirements: true`

MVP 0.4 requirements, implementation, validation and documentation are complete.

`MVP_0.4_done: true`

`ready_for_next_scope_decision: true`

MVP 0.5 card import and catalog requirements are complete.

`ready_for_implementation: true`

MVP 0.5 card import and catalog implementation is complete and locally verified.

`ready_for_hardening: true`

MVP 0.5 validation, hardening and documentation are complete.

`MVP_0.5_done: true`

`ready_for_MVP_0.6_requirements: true`

MVP 0.6 deck editor and match setup requirements are complete.

`ready_for_implementation: true`

MVP 0.6 deck editor and match setup implementation is complete and locally verified.

`ready_for_hardening: true`

MVP 0.6 validation, hardening and documentation are complete.

`MVP_0.6_done: true`

V0.6 QA hardening for visible card text, known-card tooltips and public event-log card explanations is complete. The later V0.7+ CardView/Chronicle UI keeps that information side-safe.

MVP 0.7 UI requirements and design freeze are complete.

`ready_for_implementation: true`

MVP 0.7 UI redesign implementation is complete and locally verified.

`ready_for_hardening: true`

MVP 0.7 validation, hardening and documentation are complete.

`MVP_0.7_done: true`

`ready_for_MVP_0.8_requirements: true`

MVP 0.8 playable base/starter-set slice requirements are complete.

`ready_for_implementation: true`

MVP 0.8 playable base/starter-set slice implementation is complete and locally verified.

`ready_for_hardening: true`

MVP 0.8 validation, hardening and documentation are complete.

`MVP_0.8_done: true`

`ready_for_MVP_0.9_requirements: true`

MVP 0.8 playable base/starter-set slice detailed planning is complete and the requirements freeze is now complete.

`MVP_0.8_detailed_plan_available: true`

MVP 0.9 stronger AI detailed planning is complete as a future gated phase after V0.8.

`MVP_0.9_detailed_plan_available: true`

MVP 0.9 stronger AI requirements are complete.

`ready_for_implementation: true`

MVP 0.9 stronger AI implementation is complete and locally verified.

`ready_for_hardening: true`

MVP 0.9 validation, hardening and documentation are complete.

`MVP_0.9_done: true`

`ready_for_later_V1_0_or_stabilization_scope_decision: true`

MVP 0.91 card image asset gate detailed planning is complete as a future gated phase after V0.9.

`MVP_0.91_detailed_plan_available: true`

MVP 0.91 card image asset gate requirements freeze is complete and testable.

`MVP_0.91_requirements_freeze_done: true`

`ready_for_implementation: true`

Decision: private local card scans and local card images are allowed for this private local project only. This does not allow public distribution, official logos, standalone card frames, card backs, external card database dependencies, or any Engine/AI/GameState/Replay/StateHash use of images.

MVP 0.92 mechanics inventory, M1 requirements and M1 specification are complete.

`MVP_0.92_done: true`

`ready_for_MVP_0.93_implementation: true`

MVP 0.93 M1 Engine foundation is implemented and M2 Setup/Game-End requirements are complete.

`MVP_0.93_done: true`

`M2_requirements_ready: true`

MVP 0.94 and MVP 0.95 detailed planning is complete.

`MVP_0.94_detailed_plan_available: true`

`MVP_0.95_detailed_plan_available: true`

MVP 0.94 Damage/Flatline requirements freeze is complete.

`MVP_0.94_requirements_freeze_done: true`

`ready_for_MVP_0.94_implementation: true`

MVP 0.94 Damage/Flatline implementation, validation and documentation are complete.

`MVP_0.94_done: true`

`ready_for_MVP_0.95_requirements_freeze: true`

MVP 0.95 Resources and tag-interaction requirements freeze is complete.

`MVP_0.95_requirements_freeze_done: true`

`ready_for_MVP_0.95_implementation: true`

MVP 0.95 Resources and tag-interaction implementation, validation and documentation are complete.

`MVP_0.95_done: true`

`ready_for_MVP_0.96_requirements_freeze: true`

MVP 0.96 Trace, Link and Bidding implementation, validation and documentation are complete.

`MVP_0.96_done: true`

`ready_for_MVP_0.97_requirements_freeze: true`

MVP 0.97 Run, Jack-out, Breach and Multiaccess implementation, validation and documentation are complete.

`MVP_0.97_done: true`

`ready_for_MVP_0.98_requirements_freeze: true`

MVP 0.98 Identity/Modifier and Hidden-Zone-Tools requirements freeze is complete.

`MVP_0.98_requirements_freeze_done: true`

`ready_for_MVP_0.98a_implementation: true`

MVP 0.98 Identity/Modifier and Hidden-Zone-Tools implementation, validation and documentation are complete.

`MVP_0.98_done: true`

`ready_for_MVP_0.99_requirements_freeze: true`

MVP 0.99 Hosting, Viruses, Purge, Counter families, Recurring Credits and Bad Publicity implementation, validation and documentation are complete.

`MVP_0.99_done: true`

`mechanics_completion_V0.94_to_V0.99_done: true`

S01 requirements, result modal, private match series, audio and test matrix are complete.

`S01_requirements_freeze_done: true`

S01 implementation is complete and locally verified for the current scope: side-safe `GameResultSummary`, result modal, game-goal selector, private two-game side-swap series and opt-in synthesized audio.

`S01_implemented: true`

`S01_verified: true`

V1.0 Deck- und Match-Setup-Stabilisierung is complete and locally verified.

`V1_0_deck_match_stabilization_done: true`

V1.0.1 Deckbibliothek und Join-Deck-Handshake is complete and locally verified.

`V1_0_1_deck_library_join_handshake_done: true`

V1.0.2 Gegner-Aktionsdarstellung und Ablauftransparenz detailed planning is complete.

`V1_0_2_opponent_action_presentation_plan_available: true`

V1.0.2 Gegner-Aktionsdarstellung und Ablauftransparenz requirements freeze is complete.

`V1_0_2_requirements_freeze_done: true`

V1.0.2 Gegner-Aktionsdarstellung und Ablauftransparenz implementation is complete and locally verified.

`V1_0_2_implemented: true`

`V1_0_2_verified: true`

`V1_0_2_done: true`

V1.0.3 Matchstart-UX is complete and locally verified.

`V1_0_3_matchstart_ux_done: true`

V1.0.4 Private Match Lifecycle und Session Recovery is complete and locally verified.

`V1_0_4_private_match_lifecycle_done: true`

Release planning 2026-05-05 is integrated after V1.0.3 finalization.

`release_planning_2026_05_05_integrated: true`

`V1_0_4_private_match_lifecycle_plan_available: true`

`V1_0_5_action_board_ux_plan_available: true`

V1.0.5 Action Board UX und Board-Klarheit requirements freeze is complete and amended with contextual card actions, local cue positioning, exact run target highlighting, BoardHeader utility review, RunTimeline orientation evaluation and side-safe rezzed/unrezzed Corp card display.

`V1_0_5_requirements_freeze_done: true`

`ready_for_V1_0_5_implementation: true`

V1.0.6 Aktionen, Credits und Kartenanzeige requirements freeze is complete as a planned post-V1.0.5 UI clarity release. The scope covers visible `Aktionen` terminology and action-slot meters, generic coin-like Credit badges, action/credit cost chips, compact card-display mode controls, clear Bild/Text/Kompakt mode semantics, no duplicate Preview details and safe tooltips/overlays.

`V1_0_6_requirements_freeze_done: true`

`ready_for_implementation_after_V1_0_5: true`

V1.0.5K kleines Karten-Nachrelease ist umgesetzt und lokal verifiziert. Final freigegeben sind 12 Karten, nicht 20; nicht freigegebene private O:NR-Karten bleiben im Runtime-Deckbau gesperrt.

`V1_0_5K_card_release_done: true`

V1.0.5K verification:

- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.

V1.0.6 Aktionen, Credits und Kartenanzeige implementation is complete and locally verified as a UI/presentation release on the existing V1.0.5 workspace baseline.

`V1_0_6_implemented: true`

`V1_0_6_verified: true`

`V1_0_6_done: true`

V1.0.6K kleines Karten-Nachrelease ist umgesetzt und lokal verifiziert. Es fügt 20 weitere lokal geprüfte O:NR-v1-Karten hinzu; zusammen mit V1.0.5K sind im Runtime-Katalog 32 lokale O:NR-v1-Karten `playable` und `deck_legal`.

`V1_0_6K_card_release_done: true`

V1.0.7 Browser-E2E und Visual QA requirements freeze is complete. The scope introduces a reproducible Browser-E2E/Visual-QA gate for existing V1.x UI flows, with Playwright recommended, isolated test runtime data, two browser contexts for Human-vs-Human, Human-vs-KI pacing/cue coverage, lifecycle/reconnect coverage, desktop/tablet/narrow viewports, screenshots/traces and Hidden-Info/Token/DOM/Payload leak scans.

`V1_0_7_requirements_freeze_done: true`

`ready_for_V1_0_7_implementation: true`

V1.0.7 Browser-E2E und Visual QA implementation is complete and locally verified. The gate command is `corepack pnpm e2e` or `corepack pnpm test:e2e`. V1.0.8 now runs the same gate on isolated temporary SQLite runtime data. It starts Web and Server on dynamic local ports, runs Playwright Chromium against Desktop 1280x720, Tablet 1024x768 and Schmal 390x844, and covers Human-vs-KI, Human-vs-Human, Lifecycle/Reconnect, active Board/Run/Card Display views and DOM/Storage/Payload leak scans.

`V1_0_7_implemented: true`

`V1_0_7_verified: true`

`V1_0_7_done: true`

V1.0.8 Storage/Backup-Härtung detailed planning is complete as the next post-V1.0.7 quality release. The plan selects SQLite as the preferred private local storage path and scopes the release to storage migration, backup/restore, recovery behavior and storage leak safety.

`V1_0_8_storage_backup_hardening_plan_available: true`

`ready_for_V1_0_8_requirements_freeze: true`

V1.0.8 Storage/Backup-Härtung requirements freeze is complete. The release is implementable as a SQLite-backed private local storage hardening step with controlled JSON legacy import, schema versioning, backup/restore, recovery behavior, redaction and E2E runtime isolation.

`V1_0_8_requirements_freeze_done: true`

`ready_for_V1_0_8_implementation: true`

V1.0.8 Storage/Backup-Härtung implementation is complete and locally verified. SQLite is the private local standard storage; JSON remains a Legacy/Test/Migration input. Implemented scope includes `node:sqlite` storage, `storage_meta`, validated legacy import with pre-migration backup, Backup/Restore helpers with manifest and checksums, side-safe Health and diagnostics, E2E log redaction and SQLite runtime isolation.

`V1_0_8_implemented: true`

`V1_0_8_verified: true`

`V1_0_8_done: true`

V1.0.9 Private Internet Hardening detailed planning and requirements freeze are complete. The release is cut into six packages: transport/deployment profile, REST/WS origin allowlist, deterministic rate limits, secrets/tokens/redaction, safe health/monitoring/ops signals and internet smoke coverage. The Requirements Review confirms the function, security aspects, test stability and future design are sufficiently to very well covered for implementation.

`V1_0_9_private_internet_hardening_plan_available: true`

`V1_0_9_requirements_freeze_done: true`

`ready_for_V1_0_9_implementation: true`

V1.0.9 Private Internet Hardening implementation is complete and locally verified. Implemented scope includes Deployment profile validation, REST CORS allowlist, WebSocket Origin validation before match join, deterministic in-memory rate limits, internet Token-Salt enforcement, redacted Health/Ops/error/log surfaces and internet-like E2E configuration.

`V1_0_9_implemented: true`

`V1_0_9_verified: true`

`V1_0_9_done: true`

V1.0.9 verification:

- `corepack pnpm --filter @netrunner/server test`: pass, 49 tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 13 tests.
- `corepack pnpm e2e`: pass, 7/7 Playwright tests with explicit local Origin, redacted Join-URLs and temporary SQLite runtime storage.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, workspace tests plus root specs.
- `corepack pnpm build`: pass with known Turbopack NFT warning in `apps/web/next.config.ts`.
- `git diff --check`: pass with Windows working-copy CRLF warnings only.

V1.0.8 verification:

- `corepack pnpm --filter @netrunner/server test`: pass, 42 tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 13 tests.
- `corepack pnpm e2e`: pass, 7/7 Playwright tests with temporary SQLite runtime storage.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 191 workspace tests plus 41 root spec tests.
- `corepack pnpm build`: pass with the known Turbopack NFT warning.
- `git diff --check`: pass with the existing CRLF warning for `scripts/run-e2e.mjs`.

V1.0.7 verification:

- `corepack pnpm e2e`: pass, 7/7 Playwright tests.
- `corepack pnpm --filter @netrunner/web test`: pass, 27 tests.
- `corepack pnpm --filter @netrunner/server test`: pass, 34 tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 13 tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass, known Turbopack NFT warning remains.
- `git diff --check`: pass, CRLF working-copy warnings only.

`long_term_product_vision_2026_05_05_available: true`

Bestandsaufnahme 2026-05-04 is complete.

`bestandsaufnahme_2026_05_04_done: true`

Deck/match stabilization inventory 2026-05-04 is complete.

`deck_match_stabilization_inventory_2026_05_04_done: true`

Current verification after V1.0.2 implementation:

- Implemented: side-safe opponent action cues, cue queue, board highlights, Human-vs-KI AI pacing, `advance_ai` authorization and opt-in action audio.
- Requirements/spec/test/review coverage: pass, V1.0.2 Must requirements are covered by Web cue tests, Server multiplayer tests, visibility regression and build/type gates.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm test`: pass, 182 tests.
- `corepack pnpm build`: pass.
- Local smoke: Web `http://127.0.0.1:3000` HTTP 200; Server `http://127.0.0.1:8787/health` HTTP 200.
- V1.0.2 gate: `V1_0_2_done: true`.

Current verification after V1.0.3 implementation:

- Implemented: separated Matchstart play-mode/side/goal choices, server-side Human-vs-KI random side derivation, German Match erstellen/Beitreten labels, local display-name persistence, side-safe Human-vs-Human start readiness lobby, ready flags, countdown 3/5/10 seconds, countdown cancel, reconnect-to-lobby payloads, private lobbychat, and server-side `single_game` deck-target finalization after Joiner deck handshake.
- Regression constraints: no new Engine rules, cards, official assets, accounts, matchmaking, rankings, Replay changes, StateHash changes, AI-input changes or PublicGameEvent chat payloads.
- `corepack pnpm --filter @netrunner/web test`: pass, 14 tests.
- `corepack pnpm --filter @netrunner/server test`: pass, 28 tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 11 tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 186 package tests plus 39 root spec tests.
- `corepack pnpm build`: pass.
- V1.0.3 gate: `V1_0_3_matchstart_ux_done: true`.

Current verification after V1.0.4 implementation:

- Implemented: REST lifecycle commands for Cancel, Leave, Forfeit and Recreate; terminal `cancelled`, `abandoned` and `forfeited` payloads; Human-vs-KI Forfeit stop behavior; Recreate token/link/seed rotation; Recent-Session sanitizing; explicit Fortsetzen/Reconnect/Verwerfen UI; side-safe opponent names.
- Regression constraints: no new Engine rules, cards, official assets, accounts, matchmaking, rankings, Replay stream expansion, AI hidden-info input expansion or public platform features.
- `corepack pnpm --filter @netrunner/web test`: pass, 14 tests.
- `corepack pnpm --filter @netrunner/server test`: pass, 34 tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 11 tests.
- Full final gate commands are recorded in `docs/derived/V1_0_4_FINAL_REVIEW.md`.
- V1.0.4 gate: `V1_0_4_private_match_lifecycle_done: true`.

Last code verification baseline from V1.0.1 Deckbibliothek und Join-Deck-Handshake:

- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 176 tests including V1.0.1 Join-Deck-Handshake, V1.0 deck-series/KI-policy smokes, Web Chronicle test discovery and O:NR AI/multiplayer smokes.
- `corepack pnpm build`: pass, previous Turbopack NFT warning for the `card-images` route trace is resolved by fixed repo-relative data paths.
- Browser smoke: pass for V1.0.1. Verified deck-from-template creation, editing, explicit save, reload persistence, saved-deck Matchstart, Human-vs-KI start, Human-vs-Human pending lobby creation, Joiner saved-deck selection and active match start after Join-Deck-Handshake.

Audit findings:

- README was stale and has been updated from V0.7/V0.8 planning to V0.99/S01 current state.
- `vitest.config.ts` now includes `app/**/*.test.ts`, so `apps/web/app/chronicle.test.ts` runs in the normal Web package test command.
- `docs/derived/MECHANICS_COMPLETION_PLAN.md` is now historical for M0 to M10; V0.94 to V0.99 are complete.
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md` was the current V0.99 matrix at this audit point and is now normalized through V1.1.3 with V1.2.0/V1.2.1 foundation updates; the current machine-readable companion is `data/rules/mechanics-coverage-1.2.1.json`.
- Local private O:NR-v1 data under ignored `data/local/` and `data/local-assets/` is present on this machine. It remains private/local and not versioned.
- O:NR-v1 playable test access is accepted for private local use. Engine harness, Web overlay, server deck revalidation, AI/multiplayer smokes and manifest/review checks are covered for the private local scope.
- Deck Editor and Match Setup are functional for versioned V0.8 snapshots and private local O:NR runtime cards. V1.0 adds player-owned Runner/Corp deck pairs for private series and explicit KI deck policy.
- V1.0.1 adds explicit local deck saving, direct saved-deck selection in Matchstart, folded templates, server-side revalidation from saved decks and a pending Human-vs-Human lobby that starts only after the Joiner submits valid Runner/Corp deck snapshots.
- `data/ai/ai-deck-pool-1.0.1.json` documents the versioned KI `seeded_random` pool and excludes private local O:NR snapshots from random selection.
- V1.0.2 implements opponent action cues, side-safe highlight rules, KI pacing modes, `advance_ai` authorization, reconnect/audio behavior and local smokes without expanding cards, mechanics, Engine authority, Replay or StateHash.

## Goal

Active thread goal: Netrunner gated MVP delivery.

Gate flow:

1. MVP 0.1 executable requirements: pass.
2. MVP 0.1 implementation: pass.
3. MVP 0.1 validation, hardening and documentation: pass.
4. MVP 0.2 requirements: pass.
5. MVP 0.2 implementation: pass.
6. MVP 0.2 validation, hardening and documentation: pass.
7. Post-MVP 0.2 roadmap planning: pass.
8. MVP 0.3 requirements: pass.
9. MVP 0.3 implementation and validation: pass.
10. MVP 0.4 requirements: pass.
11. MVP 0.4 implementation and validation: pass.
12. MVP 0.5 executable requirements: pass.
13. MVP 0.5 implementation: pass.
14. MVP 0.5 validation, hardening and documentation: pass.
15. MVP 0.6 executable requirements: pass.
16. MVP 0.6 implementation: pass.
17. MVP 0.6 validation, hardening and documentation: pass.
18. MVP 0.7 requirements/design freeze: pass.
19. MVP 0.7 implementation: pass.
20. MVP 0.7 validation, hardening and documentation: pass.
21. MVP 0.8 requirements/playable starter-slice freeze: pass.
22. MVP 0.8 implementation/playable starter-slice: pass.
23. MVP 0.8 validation, hardening and documentation: pass.
24. MVP 0.9 requirements/stronger AI freeze: pass.
25. MVP 0.9 implementation/stronger AI: pass.
26. MVP 0.9 validation, hardening and documentation: pass.
27. MVP 0.91 requirements/card image asset gate freeze: pass for private local scans/assets only.
28. MVP 0.92 mechanics inventory and M1 requirements/specification gate: pass.
29. MVP 0.93 M1 Engine foundation and M2 requirements: pass.
30. MVP 0.94/V0.95 detailed planning: pass.
31. MVP 0.94 Damage/Flatline requirements freeze: pass.
32. MVP 0.94 Damage/Flatline implementation, validation and final review: pass.
33. MVP 0.95 Resources/tag-interaction requirements freeze: pass.
34. MVP 0.95 Resources/tag-interaction implementation, validation and final review: pass.

## Phase 1 files created or updated

Derived docs:

- `docs/derived/MVP_0.1_REQUIREMENTS.md`
- `docs/derived/ENGINE_API_SPEC.md`
- `docs/derived/GAME_STATE_MODEL.md`
- `docs/derived/TIMING_AND_RUN_MODEL.md`
- `docs/derived/DEVIATION_REGISTRY.md`
- `docs/derived/ACCEPTANCE_CRITERIA.md`
- `docs/derived/TEST_MATRIX.md`
- `docs/derived/OPEN_QUESTIONS.md`
- `docs/derived/CONFLICT_MATRIX.md`
- `docs/derived/REQUIREMENTS_REVIEW.md`

Data artifacts:

- `data/rules/rules-baseline.json`
- `data/cards/demo-cards.json`
- `data/decks/demo-decks.json`
- `data/manifests/card-implementation-manifest.json`
- `data/deviations/rule-deviations.json`
- `data/scenarios/runner-steals-rd-agenda.json`
- `data/scenarios/runner-breaks-ice-and-accesses-rd.json`
- `data/scenarios/runner-fails-on-end-the-run.json`
- `data/scenarios/corp-scores-remote-agenda.json`
- `data/scenarios/visibility-runner-view-no-corp-leak.json`
- `data/scenarios/replay-full-demo-game-statehash.json`

Test spec:

- `tests/specs/acceptance-tests.todo.md`

## Phase 1 checks

- JSON parse check: pass for 11 JSON artifacts.
- Must requirement coverage check: pass, 42 Must requirements, 0 missing coverage IDs.
- Card manifest coverage check: pass, 13 `playable_mvp` cards, 0 missing unit/scenario coverage entries.

## Phase 2 files created or updated

Implementation:

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/ai/src/index.ts`
- `apps/server/src/index.ts`
- `apps/web/app/layout.tsx`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/next.config.ts`

Tests and toolchain:

- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.test.ts`
- `tests/specs/phase1-artifacts.test.ts`
- package scripts and TypeScript configs across workspace packages
- `pnpm-lock.yaml`

Docs:

- `README.md`

## Phase 2 checks

- `corepack pnpm install`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 16 tests.
- `corepack pnpm build`: pass, including Next.js production build.
- Local web smoke: pass, `http://127.0.0.1:3000` answered with HTTP 200.

## Phase 3 files created or updated

- `docs/derived/MVP_0.1_FINAL_REVIEW.md`
- `docs/derived/MVP_0.2_READINESS_REVIEW.md`
- `apps/web/app/api/game/route.ts`
- `apps/web/app/page.tsx`
- `tests/specs/visibility-contract.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `README.md`
- `KI-Wissen-Netrunner/`

## Phase 3 checks

- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 18 tests.
- `corepack pnpm build`: pass.
- Web API visibility smoke: pass. `/api/game` returned HTTP 200 and did not contain `cardInstances`, hidden `Simple Agenda`, or hidden unrezzed `Simple Barrier ICE`.

## Phase 3 hardening result

High-severity finding fixed: browser UI no longer imports the Engine or stores full GameState. Full GameState is held server-side in `apps/web/app/api/game/route.ts`; the client receives only Runner PlayerView, LegalActions, PublicEvents and `canRunCorp`.

## MVP 0.2 Requirements files created or updated

- `docs/derived/MVP_0.2_REQUIREMENTS.md`
- `docs/derived/MULTIPLAYER_API_SPEC.md`
- `docs/derived/WEBSOCKET_PROTOCOL_SPEC.md`
- `docs/derived/STORAGE_SCHEMA.md`
- `docs/derived/TOKEN_AND_SESSION_SECURITY.md`
- `docs/derived/RECONNECT_AND_UNDO_SPEC.md`
- `docs/derived/MULTIPLAYER_TEST_MATRIX.md`
- `docs/derived/MVP_0.2_REQUIREMENTS_REVIEW.md`
- `data/rules/rules-baseline-0.2.json`
- `data/scenarios/multiplayer-create-join-action.json`
- `data/scenarios/multiplayer-reconnect-during-run.json`
- `data/scenarios/multiplayer-undo-before-hidden-info.json`
- `data/scenarios/multiplayer-undo-after-hidden-info-blocked.json`
- `tests/specs/multiplayer-acceptance-tests.todo.md`

## MVP 0.2 Requirements checks

- JSON parse check: pass for 5 MVP-0.2 JSON artifacts.
- Must requirement coverage check: pass, 24 Must requirements, 0 missing coverage IDs.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 19 tests.

## MVP 0.2 Requirements gate

`ready_for_implementation: true`

Implementation has started and remains constrained to the private multiplayer scope only.

## MVP 0.2 Implementation files created or updated

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/index.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/server/package.json`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `tests/specs/visibility-contract.test.ts`
- `tests/specs/multiplayer-acceptance-tests.todo.md`
- `docs/derived/MVP_0.2_IMPLEMENTATION_REVIEW.md`
- `README.md`
- `.gitignore`
- `pnpm-lock.yaml`

## MVP 0.2 Implementation checks

- `corepack pnpm --filter @netrunner/server test`: pass, 7 Multiplayer tests.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm build`: pass.
- Multiplayer server health smoke: pass on `http://127.0.0.1:8787/health`.
- REST/WebSocket smoke: pass for create, join, host WebSocket, runner WebSocket, Corp mandatory action, and Runner hidden-info leak scan.
- Next web smoke: pass on `http://127.0.0.1:3000`.

## MVP 0.2 Implementation gate

`ready_for_hardening: true`

Phase 3 has validated and hardened MVP 0.2.

## MVP 0.2 Final Review files created or updated

- `docs/derived/MVP_0.2_FINAL_REVIEW.md`
- `apps/server/src/http-server.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/multiplayer.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/`

## MVP 0.2 Final checks

- `corepack pnpm --filter @netrunner/server test`: pass, 7 Multiplayer tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.
- Multiplayer server health smoke: pass on `http://127.0.0.1:8787/health`.
- REST/WebSocket smoke: pass for create, join, host WebSocket, runner WebSocket, Corp mandatory action, and Runner hidden-info leak scan.
- Next web smoke: pass on `http://127.0.0.1:3000`.

## MVP 0.2 Final gate

`MVP_0.2_done: true`

## Post-MVP 0.2 roadmap planning files created or updated

- `docs/derived/POST_MVP_0.2_ROADMAP.md`
- `docs/derived/MVP_0.3_DETAILED_PLAN.md`
- `docs/derived/MVP_0.4_DETAILED_PLAN.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Roadmap nach MVP 0.2.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Projektueberblick.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`
- `docs/codex/CODEX_STATUS.md`

## Post-MVP 0.2 roadmap decision

V0.3 is the AI and simulation phase: Runner AI, improved Corp AI, AI-vs-AI, controller model, explanation mode, simulation tests and AI visibility gates.

Card pool and rules breadth move to V0.4. V0.3 does not expand cards, official mechanics, platform features or deckbuilding.

## MVP 0.4 planning decision

V0.4 is the controlled card pool and rules breadth phase, gated by V0.3. It should start with a safe internal card batch and restricted deck validation, then add Tags as the preferred first new rule family. Damage is planned only as a separate sub-gate or V0.4.x because it touches hidden information, RandomDrawRecords, Undo barriers and AI visibility.

V0.4 remains limited to internal fictional demo cards. Official card pools, external card database dependencies, official art, card frames, card backs, public platform features and free deckbuilding remain out of scope.

## MVP 0.3 Requirements files created or updated

- `docs/derived/MVP_0.3_REQUIREMENTS.md`
- `docs/derived/AI_CONTROLLER_SPEC.md`
- `docs/derived/AI_SIMULATION_TEST_MATRIX.md`
- `docs/derived/MVP_0.3_REQUIREMENTS_REVIEW.md`
- `data/rules/rules-baseline-0.3.json`
- `data/scenarios/ai-runner-steals-rd-agenda.json`
- `data/scenarios/ai-corp-scores-remote-agenda.json`
- `data/scenarios/ai-vs-ai-smoke-replay.json`
- `tests/specs/ai-simulation-acceptance-tests.todo.md`

## MVP 0.3 Implementation files created or updated

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/index.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/api/game/route.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `docs/derived/MVP_0.3_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.3_FINAL_REVIEW.md`

## MVP 0.3 Final checks

- `corepack pnpm --filter @netrunner/ai test`: pass, 8 AI tests.
- `corepack pnpm --filter @netrunner/server test`: pass, 11 tests.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 35 tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm build`: pass.

## MVP 0.3 Final gate

`MVP_0.3_done: true`

`ready_for_MVP_0.4_requirements: true`

## MVP 0.4 Requirements files created or updated

- `docs/derived/MVP_0.4_REQUIREMENTS.md`
- `docs/derived/CARD_POOL_0.4_SPEC.md`
- `docs/derived/RULE_MECHANICS_0.4_SPEC.md`
- `docs/derived/DECK_VALIDATION_0.4_SPEC.md`
- `docs/derived/MVP_0.4_TEST_MATRIX.md`
- `docs/derived/MVP_0.4_REQUIREMENTS_REVIEW.md`
- `data/rules/rules-baseline-0.4.json`
- `data/cards/demo-cards-0.4.json`
- `data/decks/demo-decks-0.4.json`
- `data/manifests/card-implementation-manifest-0.4.json`
- `data/deviations/rule-deviations-0.4.json`
- `data/scenarios/v04-safe-card-batch-smoke.json`
- `data/scenarios/v04-tag-runner-and-remove-tag.json`
- `data/scenarios/v04-tag-punishment-blocked-when-untagged.json`
- `data/scenarios/v04-expanded-deck-ai-vs-ai-smoke.json`
- `tests/specs/card-pool-0.4-acceptance-tests.todo.md`

## MVP 0.4 Implementation files created or updated

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/http-server.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `tests/specs/phase1-artifacts.test.ts`
- `docs/derived/MVP_0.4_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.4_FINAL_REVIEW.md`

## MVP 0.4 Final checks

- `corepack pnpm --filter @netrunner/engine test`: pass, 15 Engine tests.
- `corepack pnpm --filter @netrunner/ai test`: pass, 10 AI tests.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 42 tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm build`: pass.

## MVP 0.4 Final gate

`MVP_0.4_done: true`

`ready_for_next_scope_decision: true`

## MVP 0.5 Requirements files created or updated

- `docs/derived/MVP_0.5_REQUIREMENTS.md`
- `docs/derived/CARD_IMPORT_0.5_SPEC.md`
- `docs/derived/CARD_CATALOG_0.5_SPEC.md`
- `docs/derived/CARD_STATUS_0.5_SPEC.md`
- `docs/derived/MVP_0.5_TEST_MATRIX.md`
- `docs/derived/MVP_0.5_REQUIREMENTS_REVIEW.md`
- `data/card-import/source-registry-0.5.json`
- `data/card-import/card-snapshot-0.5.json`
- `data/card-import/card-snapshot-0.5.hash`
- `data/card-import/import-report-0.5.json`
- `data/card-import/catalog-index-0.5.json`
- `data/manifests/card-catalog-status-0.5.json`
- `tests/specs/card-import-0.5-acceptance-tests.todo.md`
- `tests/specs/phase1-artifacts.test.ts`

## MVP 0.5 Requirements checks

- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 9 artifact tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 42 package tests plus 11 root spec tests.
- `corepack pnpm build`: pass.

## MVP 0.5 Requirements gate

`ready_for_implementation: true`

V0.5 uses only local versioned demo/project data and fiktive local catalog fixtures. Import remains catalog/status-only: no import path can make a card engine-playable, KI-usable, deck-legal or match-startable without the existing manifest, resolver, tests, Visibility, Replay/StateHash and KI-Smoke gates.

## MVP 0.5 Implementation files created or updated

- `packages/catalog/AGENTS.md`
- `packages/catalog/package.json`
- `packages/catalog/tsconfig.json`
- `packages/catalog/src/index.ts`
- `packages/catalog/src/index.test.ts`
- `apps/web/app/api/cards/catalog-data.ts`
- `apps/web/app/api/cards/catalog/route.ts`
- `apps/web/app/api/cards/catalog/[id]/route.ts`
- `apps/web/app/api/cards/status-summary/route.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/web/package.json`
- `tests/specs/visibility-contract.test.ts`
- `docs/derived/MVP_0.5_IMPLEMENTATION_REVIEW.md`
- `pnpm-lock.yaml`
- updated V0.5 snapshot hash and derived catalog artifacts after German UI text cleanup

## MVP 0.5 Implementation checks

- `corepack pnpm install`: pass.
- `corepack pnpm --filter @netrunner/catalog test`: pass, 5 Catalog tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`: pass, 12 root spec tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 47 package tests plus 12 root spec tests.
- `corepack pnpm build`: pass.
- Catalog API smoke on `http://127.0.0.1:3000/api/cards/catalog?status=blocked`: pass.
- Catalog detail smoke on `http://127.0.0.1:3000/api/cards/catalog/catalog_preview_operation_001`: pass.
- Browser catalog smoke on `http://127.0.0.1:3000`: pass.

## MVP 0.5 Implementation gate

`ready_for_hardening: true`

The implementation preserves the V0.5 safety boundary: catalog data is read-only and public-by-design, import-only cards stay non-playable, and no Engine, AI, deck-validation or match-start path consumes imported cards automatically.

## MVP 0.5 Final Review files created or updated

- `docs/derived/MVP_0.5_FINAL_REVIEW.md`
- `docs/derived/MVP_0.5_IMPLEMENTATION_REVIEW.md`
- `README.md`
- `tests/specs/card-import-0.5-acceptance-tests.todo.md`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/`

## MVP 0.5 Final checks

- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 47 package tests plus 12 root spec tests.
- `corepack pnpm build`: pass.
- Catalog API smoke: pass.
- Catalog API hidden-info/token leak scan: pass.
- Browser catalog smoke: pass on `http://127.0.0.1:3000`.

## MVP 0.5 Final gate

`MVP_0.5_done: true`

`ready_for_MVP_0.6_requirements: true`

## MVP 0.6 Requirements files created or updated

- `docs/derived/MVP_0.6_REQUIREMENTS.md`
- `docs/derived/DECK_EDITOR_0.6_SPEC.md`
- `docs/derived/DECK_VALIDATION_0.6_SPEC.md`
- `docs/derived/MATCH_SETUP_0.6_SPEC.md`
- `docs/derived/DECK_STORAGE_0.6_SPEC.md`
- `docs/derived/MVP_0.6_TEST_MATRIX.md`
- `docs/derived/MVP_0.6_REQUIREMENTS_REVIEW.md`
- `data/decks/deck-format-profiles-0.6.json`
- `data/decks/deck-templates-0.6.json`
- `data/decks/deck-snapshots-0.6.json`
- `data/manifests/deck-validation-manifest-0.6.json`
- `tests/specs/deck-editor-0.6-acceptance-tests.todo.md`
- `tests/specs/phase1-artifacts.test.ts`

## MVP 0.6 Requirements checks

- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 12 artifact tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 47 package tests plus 15 root spec tests.
- `corepack pnpm build`: pass.

## MVP 0.6 Requirements gate

`ready_for_implementation: true`

V0.6 starts from V0.5 catalog status and versioned demo decks. The requirements freeze defines a general deck model, local format profile, immutable deck snapshots, deterministic deck hashes, private opponent decklists by default, server-side match-start revalidation and functional deck editor/match setup scope only.

## MVP 0.6 Implementation files created or updated

- `packages/decks/`
- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/ai/src/index.ts`
- `apps/server/src/deck-setup.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/api/decks/`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `tests/specs/visibility-contract.test.ts`
- `tests/specs/deck-editor-0.6-acceptance-tests.todo.md`
- `docs/derived/MVP_0.6_IMPLEMENTATION_REVIEW.md`
- `pnpm-lock.yaml`

## MVP 0.6 Implementation checks

- `corepack pnpm install`: pass.
- `corepack pnpm --filter @netrunner/decks test`: pass.
- `corepack pnpm --filter @netrunner/server test`: pass.
- `corepack pnpm --filter @netrunner/ai test`: pass.
- `corepack pnpm --filter @netrunner/engine test`: pass.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`: pass.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm --filter @netrunner/web typecheck`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.
- Deck API smoke on `http://127.0.0.1:3002/api/decks/snapshots`: pass.
- Deck validation smoke on `http://127.0.0.1:3002/api/decks/validate`: pass.
- Matchstart API smoke on `http://127.0.0.1:8797/api/matches`: pass, V0.6 snapshot match used public deck hashes and no opponent decklist.
- Browser smoke on `http://127.0.0.1:3002`: pass, local deck copy validated and used for Match Setup.

## MVP 0.6 Implementation gate

`ready_for_hardening: true`

V0.6 now supports local deck models, validation v2, deterministic snapshots, server-side match-start revalidation, safe public deck metadata and functional deckeditor/match-setup UI. V0.7 UI redesign, official art/assets, broad legality, public platform features and non-implemented card playability remain excluded.

## MVP 0.6 Final files created or updated

- `docs/derived/MVP_0.6_FINAL_REVIEW.md`
- `docs/derived/MVP_0.6_IMPLEMENTATION_REVIEW.md`
- `tests/specs/deck-editor-0.6-acceptance-tests.todo.md`
- `README.md`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.6 Final checks

- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.
- Deck API smoke: pass.
- Deck validation smoke: pass.
- Matchstart API smoke with V0.6 snapshots: pass.
- Browser smoke for Deck Editor and Match Setup: pass.

## MVP 0.6 Final gate

`MVP_0.6_done: true`

Next gate was V0.7 Requirements/Design Freeze. V0.7 implementation is now unblocked by the current thread goal. Official assets, public platform features, account system, matchmaking and rankings remain out of scope.

## V0.6 QA card readability and event-log hardening

Known visible cards carry display-only rules text and public values in `VisibleCard`. The web UI exposes known-card detail through card views and tooltips; public card events use catalog/public reveal details without exposing hidden Corp installs or unknown cards.

Checks from the original QA pass: `corepack pnpm install --frozen-lockfile`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `corepack pnpm build`, Server-Health-Smoke and Next-Web-Smoke passed.

## MVP 0.7 Requirements files created or updated

- `docs/derived/MVP_0.7_REQUIREMENTS.md`
- `docs/derived/UI_REDESIGN_0.7_SPEC.md`
- `docs/derived/RUN_ENCOUNTER_UI_0.7_SPEC.md`
- `docs/derived/CARD_VIEW_0.7_SPEC.md`
- `docs/derived/ACCESSIBILITY_0.7_SPEC.md`
- `docs/derived/MVP_0.7_TEST_MATRIX.md`
- `docs/derived/MVP_0.7_REQUIREMENTS_REVIEW.md`
- `tests/specs/ui-redesign-0.7-acceptance-tests.todo.md`
- `tests/specs/phase1-artifacts.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.7 Requirements checks

- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 13 artifact tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 48 package tests plus 17 root spec tests.
- `corepack pnpm build`: pass.

## MVP 0.7 Requirements gate

`ready_for_implementation: true`

V0.7 is frozen as a UI redesign/design phase. Design C is the main structure, Design D is limited to run/encounter focus, and Design B is limited to an optional diagnostics drawer. V0.7 must preserve existing V0.1-V0.6 features, may not add gameplay scope, and may not load official or external card assets without a separate asset gate.

## MVP 0.7 Implementation files created or updated

- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `tests/specs/visibility-contract.test.ts`
- `tests/specs/ui-redesign-0.7-acceptance-tests.todo.md`
- `docs/derived/MVP_0.7_IMPLEMENTATION_REVIEW.md`
- `README.md`

## MVP 0.7 Implementation checks

- `corepack pnpm --filter @netrunner/web typecheck`: pass.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 5 tests.
- `corepack pnpm --filter @netrunner/web build`: pass.
- Local Entry UI smoke on `http://127.0.0.1:3007`: pass.
- Local RunnerBoard smoke through generated private Runner-vs-Corp-KI match: pass.
- Local CorpBoard smoke through generated private Corp-vs-Runner-KI match: pass.

## MVP 0.7 Implementation gate

`ready_for_hardening: true`

V0.7 now has a light Design-C-oriented shell, Entry preflight, Card Display settings, image-ready generic CardView, Card Preview, RunTimeline, LegalActionsPanel, UndoPanel, EventLogPanel and Diagnostics Drawer. The implementation keeps the browser off Engine and FullState paths.

## MVP 0.7 Final files created or updated

- `docs/derived/MVP_0.7_FINAL_REVIEW.md`
- `docs/derived/MVP_0.7_IMPLEMENTATION_REVIEW.md`
- `tests/specs/ui-redesign-0.7-acceptance-tests.todo.md`
- `README.md`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.7 Final checks

- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 48 package tests plus 18 root spec tests.
- `corepack pnpm build`: pass.
- Web typecheck: pass.
- Visibility contract: pass.
- Web build: pass.
- Entry, RunnerBoard and CorpBoard UI smokes: pass.

## MVP 0.7 Final gate

`MVP_0.7_done: true`

`ready_for_MVP_0.8_requirements: true`

Next gate: V0.8 Implementation for the frozen local starter slice. V0.8 remains constrained by manifest, resolver, test, visibility, replay/StateHash and AI-smoke gates per playable card. V1.0 and public platform features remain out of scope.

## MVP 0.8 Requirements files created or updated

- `docs/derived/MVP_0.8_REQUIREMENTS.md`
- `docs/derived/PLAYABLE_CARD_SLICE_0.8_SPEC.md`
- `docs/derived/RULE_MECHANICS_0.8_SPEC.md`
- `docs/derived/CARD_IMPLEMENTATION_0.8_SPEC.md`
- `docs/derived/MVP_0.8_TEST_MATRIX.md`
- `docs/derived/MVP_0.8_REQUIREMENTS_REVIEW.md`
- `data/cards/demo-cards-0.8.json`
- `data/decks/demo-decks-0.8.json`
- `data/manifests/card-implementation-manifest-0.8.json`
- `data/scenarios/v08-starter-runner-economy-draw.json`
- `data/scenarios/v08-starter-icebreaker-run.json`
- `data/scenarios/v08-starter-corp-economy-score.json`
- `data/scenarios/v08-starter-tag-tax-smoke.json`
- `tests/specs/playable-card-slice-0.8-acceptance-tests.todo.md`
- `tests/specs/phase1-artifacts.test.ts`

## MVP 0.8 Requirements checks

- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 14 artifact tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 48 package tests plus 19 root spec tests.
- `corepack pnpm build`: pass.

## MVP 0.8 Requirements gate

`ready_for_implementation: true`

V0.8 is frozen as a small local/fictitious playable starter slice. The slice contains 14 local original cards and avoids Damage, Resources, Traces, identities, Multiaccess, Hosting, Viruses, Prevention and Replacement. Every new playable card must remain backed by manifest, explicit resolver, unit test, scenario, visibility test, replay/StateHash and AI smoke. Import-only cards remain data and cannot start matches.

## MVP 0.8 Implementation files created or updated

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `packages/catalog/src/index.test.ts`
- `packages/decks/src/index.test.ts`
- `apps/server/src/deck-setup.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/api/cards/catalog-data.ts`
- `apps/web/app/api/decks/deck-data.ts`
- `apps/web/app/page.tsx`
- `data/card-import/card-snapshot-0.8.json`
- `data/card-import/card-snapshot-0.8.hash`
- `data/decks/deck-format-profiles-0.8.json`
- `data/decks/deck-templates-0.8.json`
- `data/decks/deck-snapshots-0.8.json`
- `data/deviations/rule-deviations-0.8.json`
- `data/manifests/deck-validation-manifest-0.8.json`
- `data/rules/rules-baseline-0.8.json`
- `tests/specs/phase1-artifacts.test.ts`
- `tests/specs/visibility-contract.test.ts`
- `tests/specs/playable-card-slice-0.8-acceptance-tests.todo.md`
- `docs/derived/MVP_0.8_IMPLEMENTATION_REVIEW.md`

## MVP 0.8 Implementation checks

- `corepack pnpm --filter @netrunner/engine typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine test`: pass, 20 tests.
- `corepack pnpm --filter @netrunner/server test`: pass, 12 tests.
- `corepack pnpm --filter @netrunner/ai test`: pass, 11 tests.
- `corepack pnpm --filter @netrunner/decks test`: pass, 7 tests.
- `corepack pnpm --filter @netrunner/catalog test`: pass, 6 tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`: pass, 19 tests.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- V0.8 Matchstart-/Deck-/Katalog-/AI-Smoke: pass.
- V0.8 Performance-Smoke: pass, 500 LegalAction/View-Probes in 3.31 ms and 80 Apply steps in 71.01 ms.

## MVP 0.8 Implementation gate

`ready_for_hardening: true`

V0.8 now provides a playable local/fictitious starter slice with 14 new cards, explicit resolvers, V0.8 deck snapshots, V0.8 catalog/deck artifacts, server default match setup on V0.8 snapshots, and AI smokes over V0.8 decks. The implementation does not add official assets, external APIs, public platform features or the V0.9 stronger-AI scope.

## MVP 0.8 Final files created or updated

- `docs/derived/MVP_0.8_FINAL_REVIEW.md`
- `docs/derived/MVP_0.8_IMPLEMENTATION_REVIEW.md`
- `tests/specs/playable-card-slice-0.8-acceptance-tests.todo.md`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.8 Final checks

- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.
- Engine, Server, AI, Decks and Catalog package tests: pass.
- Phase-1 artifact and Visibility Contract root specs: pass.
- Local V0.8 Matchstart, Deck, Catalog and AI smoke: pass.
- Local V0.8 Performance smoke: pass.

## MVP 0.8 Final gate

`MVP_0.8_done: true`

`ready_for_MVP_0.9_requirements: true`

Next gate: V0.9 Requirements for stronger AI. V0.9 remains constrained to LegalActions, PlayerViews and side-filtered PublicEvents. FullState, hidden opponent information, LLM as rules actor, V1.0 and public platform features remain out of scope.

## MVP 0.8 Detailed Planning files created or updated

- `docs/derived/MVP_0.8_DETAILED_PLAN.md`
- `docs/derived/POST_MVP_0.4_ROADMAP.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Roadmap nach MVP 0.4.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`
- `docs/codex/CODEX_STATUS.md`

V0.8 remains a future gated phase after V0.7. This planning update does not implement cards, engine behavior, UI changes or server behavior. The detailed plan now includes hard entry gates, source/usage decision for base/starter-set scope, candidate scoring, per-card deviation/approximation, resolver registry as a Must artifact, minimal AI role tags for V0.9, playability/balance smokes, Golden Hash review process and performance budgets for core engine/view/AI-smoke paths.

## MVP 0.9 Detailed Planning files created or updated

- `docs/derived/MVP_0.9_DETAILED_PLAN.md`
- `docs/derived/POST_MVP_0.4_ROADMAP.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Roadmap nach MVP 0.4.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`
- `docs/codex/CODEX_STATUS.md`

V0.9 remains a future gated phase after V0.8. This planning update does not implement AI behavior, engine behavior, cards, UI changes or server behavior. The scope is stronger AI through visible-information-only heuristics, role metadata, risk scoring, difficulty profiles, bounded lookaheads, better reason codes and multi-seed soak/regression tests.

The V0.9 detailed plan was later refined for requirements-freeze readiness with traceable Must/Should/Could IDs, measurable AI quality metrics, hidden-state-invariance tests, AI controller lifecycle, ObservedFacts, tuning change-control, holdout seeds and coverage heatmaps.

## MVP 0.9 Requirements files created or updated

- `docs/derived/MVP_0.9_REQUIREMENTS.md`
- `docs/derived/AI_HEURISTICS_0.9_SPEC.md`
- `docs/derived/AI_DIFFICULTY_0.9_SPEC.md`
- `docs/derived/AI_EXPLANATION_0.9_SPEC.md`
- `docs/derived/AI_SOAK_TEST_0.9_SPEC.md`
- `docs/derived/MVP_0.9_TEST_MATRIX.md`
- `docs/derived/MVP_0.9_REQUIREMENTS_REVIEW.md`
- `data/ai/card-role-manifest-0.9.json`
- `data/ai/deck-role-profiles-0.9.json`
- `data/ai/ai-profiles-0.9.json`
- `data/ai/ai-soak-seeds-0.9.json`
- `data/scenarios/ai-v09-runner-setup-run.json`
- `data/scenarios/ai-v09-corp-score-remote.json`
- `data/scenarios/ai-v09-hidden-invariance.json`
- `data/scenarios/ai-v09-soak-matrix.json`
- `tests/specs/ai-quality-0.9-acceptance-tests.todo.md`
- `tests/specs/phase1-artifacts.test.ts`

## MVP 0.9 Requirements checks

- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 15 artifact tests.

## MVP 0.9 Requirements gate

`ready_for_implementation: true`

V0.9 is frozen as a stronger-AI phase on the completed V0.8 starter slice. It may add roles, profiles, scorers, explanations, metrics, lifecycle guards and soaks, but no cards, official assets, FullState AI, LLM rules actor, V1.0 or public platform features.

## MVP 0.9 Implementation files created or updated

- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `packages/shared/src/index.ts`
- `apps/server/src/multiplayer.ts`
- `tests/specs/ai-quality-0.9-acceptance-tests.todo.md`
- `docs/derived/MVP_0.9_IMPLEMENTATION_REVIEW.md`

## MVP 0.9 Implementation checks

- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai test`: pass, 15 tests.
- `corepack pnpm --filter @netrunner/server test`: pass, 12 tests.
- `corepack pnpm --filter @netrunner/shared typecheck`: pass.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts tests/specs/visibility-contract.test.ts`: pass, 20 tests.
- V0.9 Soak smoke: pass, 27 runs, 0 illegal actions, 0 replay failures, fallback rate 0.02, timeout rate 0.

## MVP 0.9 Implementation gate

`ready_for_hardening: true`

V0.9 now has role-aware Runner and Corp scorers, difficulty profiles, side-safe evidence and explanations, ObservedFacts, simulation metrics and a multi-seed soak helper. The AI remains LegalActions-only and does not use FullState, hidden opponent data or an LLM as rules actor.

## MVP 0.9 Final files created or updated

- `docs/derived/MVP_0.9_FINAL_REVIEW.md`
- `docs/derived/MVP_0.9_IMPLEMENTATION_REVIEW.md`
- `tests/specs/ai-quality-0.9-acceptance-tests.todo.md`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.9 Final checks

- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 60 package tests plus 20 root spec tests.
- `corepack pnpm build`: pass.
- V0.9 Soak smoke: pass.

## MVP 0.9 Final gate

`MVP_0.9_done: true`

Next recommended scope: later V1.0/stabilization/operations decision. V1.0, V0.10 and public platform features were not started in this thread.

## MVP 0.91 Detailed Planning files created or updated

- `docs/derived/MVP_0.91_DETAILED_PLAN.md`
- `docs/derived/POST_MVP_0.4_ROADMAP.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Roadmap nach MVP 0.4.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`
- `docs/codex/CODEX_STATUS.md`

V0.91 remains a future gated phase after V0.9. This planning update does not implement image import, image display, cards, engine behavior, AI behavior, UI changes or server behavior. The scope is a separate card image asset gate: source and usage decision, local non-versioned image cache, deterministic image metadata, display only for known cards, fallback to text or placeholders, and hidden-info tests against image URLs, alt text, DOM metadata and distinguishable loading states.

## MVP 0.91 Requirements files created or updated

- `docs/derived/MVP_0.91_REQUIREMENTS.md`
- `docs/derived/CARD_IMAGE_ASSET_GATE_0.91_SPEC.md`
- `docs/derived/CARD_IMAGE_IMPORT_0.91_SPEC.md`
- `docs/derived/CARD_IMAGE_DISPLAY_0.91_SPEC.md`
- `docs/derived/MVP_0.91_TEST_MATRIX.md`
- `docs/derived/MVP_0.91_REQUIREMENTS_REVIEW.md`
- `data/card-assets/card-image-source-registry-0.91.json`
- `data/card-assets/card-image-policy-0.91.json`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Roadmap nach MVP 0.4.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.91 Requirements gate

`MVP_0.91_requirements_freeze_done: true`

`ready_for_implementation: true`

The technical and hidden-info requirements are testable, and every Must requirement has a test trail. Public or general official card image use remains blocked: NetrunnerDB provides technical image metadata, but the reviewed primary sources do not grant explicit public permission for this project to download, cache or display official full card images. For this private local project, the project owner accepts private local use of own scans/local card front images as display-only artifacts. This is not a public license and excludes public distribution, official logos, standalone card frames, card backs, external card database dependencies, and any Engine/AI/GameState/Replay/StateHash use of images.

## MVP 0.92 Requirements and final gate files created or updated

- `docs/derived/MVP_0.92_REQUIREMENTS.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/mechanics-coverage-0.92.json`
- `docs/derived/MECHANIC_M1_EFFECT_TIMING_SPEC.md`
- `docs/derived/MECHANIC_M1_TEST_MATRIX.md`
- `docs/derived/MVP_0.92_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.92_FINAL_REVIEW.md`
- `tests/specs/phase1-artifacts.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.92 Final gate

`MVP_0.92_done: true`

`ready_for_MVP_0.93_implementation: true`

V0.92 normalizes the current mechanics inventory after V0.9/S01, adds a versioned machine-readable coverage artifact under `data/rules`, freezes M1 requirements for Effects, Abilities, Timing, Choices and Event classification, and keeps M2 as requirements-only follow-up scope. V0.92 does not implement runtime behavior, cards, images or V0.94+ mechanics.

## MVP 0.93 Requirements, implementation and final gate files created or updated

- `docs/derived/MVP_0.93_REQUIREMENTS.md`
- `docs/derived/SETUP_GAME_END_0.93_SPEC.md`
- `docs/derived/MVP_0.93_TEST_MATRIX.md`
- `docs/derived/MVP_0.93_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.93_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.93_FINAL_REVIEW.md`
- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/multiplayer.test.ts`
- `tests/specs/phase1-artifacts.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.93 Final gate

`MVP_0.93_done: true`

`M2_requirements_ready: true`

V0.93 adds additive Shared/Engine contracts for Effects, Abilities, Timing, Choices and Event classification. `pendingChoice` is prepared in GameState and side-filtered PlayerViews without enabling Mulligan or Trace. Breaker Pump/Break now carry internal Ability metadata while keeping public Action Types compatible. PublicEvents can carry `visibilityClass`, and server Bootstrap/WebSocket/Reconnect plus AI inputs were checked for side safety. M2 Setup/Game-End, Mulligan, 7-point standard, legacy win values, Deckout/Flatline preparation, Identity Setup and Archives/facedown are requirements only.

Checks:

- `corepack pnpm --filter @netrunner/shared typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine typecheck`: pass.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine test -- --run`: pass, 25 tests.
- `corepack pnpm --filter @netrunner/ai test -- --run`: pass, 16 tests.
- `corepack pnpm --filter @netrunner/server test -- --run`: pass, 14 tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 17 tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 9 tests.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass, known Turbopack NFT warning remains for the existing `card-images` route trace.
- `corepack pnpm lint`: pass after regenerated `.next` type output.
- `corepack pnpm typecheck`: pass after regenerated `.next` type output.

## MVP 0.94/V0.95 Detailed Planning files created or updated

- `docs/derived/MVP_0.94_0.95_ASSUMPTION_REVIEW.md`
- `docs/derived/MVP_0.94_DETAILED_PLAN.md`
- `docs/derived/MVP_0.95_DETAILED_PLAN.md`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.94/V0.95 Planning decision

`MVP_0.94_detailed_plan_available: true`

`MVP_0.95_detailed_plan_available: true`

The assumption review confirms the existing sequence with one sharpening: V0.94 remains the Damage/Flatline gate, but must include a narrow Game-End reason contract for Flatline before any Damage implementation. Full M2 work such as Mulligan, Identity Setup and Archives/Multiaccess remains outside V0.94. V0.95 remains the Runner Resource and tag-interaction gate, but must not introduce Trace, Link or Bidding. Both plans include explicit test matrices for Visibility, Replay/StateHash, Undo, WebSocket/Reconnect, AI and no-scope regression gates.

## MVP 0.94 Requirements Freeze files created or updated

- `docs/derived/MVP_0.94_REQUIREMENTS.md`
- `docs/derived/DAMAGE_FLATLINE_0.94_SPEC.md`
- `docs/derived/MVP_0.94_TEST_MATRIX.md`
- `docs/derived/MVP_0.94_REQUIREMENTS_REVIEW.md`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.94 Requirements Freeze decision

`MVP_0.94_requirements_freeze_done: true`

`ready_for_MVP_0.94_implementation: true`

V0.94 is frozen as a narrow Damage/Flatline gate. Net and Meat Damage are in scope; Core Damage, Damage Prevention, Avoid, Interrupt and Replacement remain out of scope. Flatline is only a side-safe Game-End reason contract, not a full M2 setup implementation. Damage must use Seed, RandomCounter and RandomDrawRecords, classify events as `hidden_info_barrier`, block Undo after Damage and keep all PlayerView, PublicEvent, WebSocket, Reconnect, Undo, Error, Log, AI and UI payloads free of pre-Damage Grip leaks.

## MVP 0.94 Final files created or updated

- `docs/derived/MVP_0.94_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.94_FINAL_REVIEW.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/rules-baseline-0.94.json`
- `data/cards/demo-cards-0.94.json`
- `data/decks/demo-decks-0.94.json`
- `data/manifests/card-implementation-manifest-0.94.json`
- `data/rules/mechanics-coverage-0.94.json`
- `data/scenarios/v094-damage-flatline.json`
- `data/scenarios/v094-multiplayer-damage-smoke.json`
- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/page.tsx`
- `tests/specs/phase1-artifacts.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.94 Final gate

`MVP_0.94_done: true`

`ready_for_MVP_0.95_requirements_freeze: true`

V0.94 implements Net/Meat Damage and Flatline as a narrow, high-safety mechanics gate. Damage can resolve through approved Engine paths only, uses RandomDrawRecords for random Grip trash, emits `hidden_info_barrier` events, blocks Undo across Damage and preserves deterministic Replay/StateHash. `gameEndReason: "flatline"` is side-safe in PlayerViews, Multiplayer Result Summary and Web UI. Core Damage, Prevention/Avoid/Interrupt/Replacement, Resources, Trace, Multiaccess, Identity abilities, Hosting, Viruses, Purge and Counter families remain unimplemented.

Checks:

- `corepack pnpm --filter @netrunner/shared typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine typecheck`: pass.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine test -- --run`: pass, 32 tests.
- `corepack pnpm --filter @netrunner/ai test -- --run`: pass, 17 tests.
- `corepack pnpm --filter @netrunner/server test -- --run`: pass, 16 tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 18 tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 9 tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 78 package tests plus 27 root spec tests.
- `corepack pnpm build`: pass, known Turbopack NFT warning remains for the existing `card-images` route trace.

## MVP 0.95 Requirements Freeze files created or updated

- `docs/derived/MVP_0.95_REQUIREMENTS.md`
- `docs/derived/RESOURCE_TAG_INTERACTION_0.95_SPEC.md`
- `docs/derived/MVP_0.95_TEST_MATRIX.md`
- `docs/derived/MVP_0.95_REQUIREMENTS_REVIEW.md`
- `tests/specs/phase1-artifacts.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.95 Requirements Freeze decision

`MVP_0.95_requirements_freeze_done: true`

`ready_for_MVP_0.95_implementation: true`

V0.95 is frozen as a narrow Runner Resource and tag-interaction gate. It adds a Resource card type, visible installed Runner Resources and the Corp basic action `trash_resource` while the Runner is tagged, paying 1 click and 2 credits. Resource trash is a public board interaction and must not leak Runner Grip/Stack/R&D/HQ/Archives hidden data. Trace, Link, Bidding, Hosting, Viruses, Counter families, Prevention/Avoid/Interrupt/Replacement and V0.96+ mechanics remain out of scope.

## MVP 0.95 Final files created or updated

- `docs/derived/MVP_0.95_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.95_FINAL_REVIEW.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/rules-baseline-0.95.json`
- `data/cards/demo-cards-0.95.json`
- `data/decks/demo-decks-0.95.json`
- `data/manifests/card-implementation-manifest-0.95.json`
- `data/rules/mechanics-coverage-0.95.json`
- `data/scenarios/v095-resource-tag.json`
- `data/scenarios/v095-multiplayer-resource-smoke.json`
- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/chronicle.ts`
- `apps/web/app/page.tsx`
- `tests/specs/phase1-artifacts.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.95 Final gate

`MVP_0.95_done: true`

`ready_for_MVP_0.96_requirements_freeze: true`

V0.95 implements Runner Resources and tag-based Resource trash as a narrow public-board mechanics gate. `v095_safehouse_resource` is a local fictional Resource harness. The Corp basic action `trash_resource` is available only while the Runner is tagged and costs 1 click plus 2 credits. Resource trash is public, not a hidden-info barrier, and preserves deterministic Replay/StateHash. Trace, Link/Bidding, Jack-out/Breach/Multiaccess, Identity-Abilities, Hidden-Zone-Tools, Hosting, Viruses, Purge, Counter families and Prevention remain unimplemented.

Checks:

- `corepack pnpm --filter @netrunner/shared typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine typecheck`: pass.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/web typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine test -- --run`: pass, 36 tests.
- `corepack pnpm --filter @netrunner/ai test -- --run`: pass, 18 tests.
- `corepack pnpm --filter @netrunner/server test -- --run`: pass, 17 tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 20 tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 9 tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass.

## MVP 0.96 Requirements Freeze files created or updated

- `docs/derived/MVP_0.96_REQUIREMENTS.md`
- `docs/derived/TRACE_LINK_BIDDING_0.96_SPEC.md`
- `docs/derived/MVP_0.96_TEST_MATRIX.md`
- `docs/derived/MVP_0.96_REQUIREMENTS_REVIEW.md`
- `tests/specs/phase1-artifacts.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.96 Requirements Freeze decision

`MVP_0.96_requirements_freeze_done: true`

`ready_for_MVP_0.96_implementation: true`

V0.96 is frozen as a narrow Trace/Link/Bidding gate. The CR v26.03 reference check confirms the sequence: Corp bids first to increase Trace-Strength, Runner bids second to increase Link-Strength, and the trace succeeds only when Trace-Strength exceeds Runner-Strength. The first playable success effect is limited to `add_tag`. Trace choices are public bid amounts, but pending choices remain side-filtered in PlayerViews and reconnect payloads. Trace-Damage, Resource-specific trace effects, Jack-out/Breach/Multiaccess, Identity-Abilities, Hidden-Zone-Tools, Hosting, Viruses, Purge, Counter families and Prevention remain unimplemented.

## MVP 0.96 Final files created or updated

- `docs/derived/MVP_0.96_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.96_FINAL_REVIEW.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/rules-baseline-0.96.json`
- `data/cards/demo-cards-0.96.json`
- `data/decks/demo-decks-0.96.json`
- `data/manifests/card-implementation-manifest-0.96.json`
- `data/rules/mechanics-coverage-0.96.json`
- `data/scenarios/v096-trace-link.json`
- `data/scenarios/v096-multiplayer-trace-smoke.json`
- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/multiplayer.test.ts`
- `tests/specs/phase1-artifacts.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.96 Final gate

`MVP_0.96_done: true`

`ready_for_MVP_0.97_requirements_freeze: true`

V0.96 implements Trace/Link/Bidding as a narrow public-choice mechanics gate. `v096_trace_probe_ice` is a local fictional Trace harness. Trace starts from a manifestierter ICE-Subroutine, Corp bids first, Runner bids second, both bids pay exact credits, and success is strict greater-than. The only success effect is `add_tag`. Trace choices and results are public, do not create a Hidden-Info barrier and preserve deterministic Replay/StateHash without new RandomDrawRecords. Jack-out/Breach/Multiaccess, active Identity-Abilities, Hidden-Zone-Tools, Hosting, Viruses, Purge, Counter families, Bad Publicity, Recurring Credits and Prevention remain unimplemented.

Checks:

- `corepack pnpm --filter @netrunner/shared typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm --filter @netrunner/web typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine test -- --run`: pass, 41 tests.
- `corepack pnpm --filter @netrunner/ai test -- --run`: pass, 19 tests.
- `corepack pnpm --filter @netrunner/server test -- --run`: pass, 18 tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 22 tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 9 tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass, known Turbopack NFT warning remains for the existing `card-images` route trace.

## MVP 0.97 Requirements Freeze files created or updated

- `docs/derived/MVP_0.97_REQUIREMENTS.md`
- `docs/derived/RUN_BREACH_MULTIACCESS_0.97_SPEC.md`
- `docs/derived/MVP_0.97_TEST_MATRIX.md`
- `docs/derived/MVP_0.97_REQUIREMENTS_REVIEW.md`
- `tests/specs/phase1-artifacts.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.97 Requirements Freeze decision

`MVP_0.97_requirements_freeze_done: true`

`ready_for_MVP_0.97_implementation: true`

V0.97 is frozen as a narrow Run/Jack-out/Breach/Multiaccess gate. The CR v26.03 reference check confirms the Movement window for jack-out after passing ice and before the server, successful-run breach, candidate/access sequencing, and HQ/R&D random access limit handling. Implementation is limited to V0.97 baselines, an internal Breach/AccessQueue, public `jack_out`, deterministic R&D access, HQ multiaccess via RandomDrawRecords and one local fictional multiaccess harness. Access replacement, prevention, active Identity-Abilities, Hidden-Zone-Tools, Hosting, Viruses, Counter families and V0.98+ mechanics remain unimplemented.

## MVP 0.97 Final files created or updated

- `docs/derived/MVP_0.97_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.97_FINAL_REVIEW.md`
- `data/rules/rules-baseline-0.97.json`
- `data/cards/demo-cards-0.97.json`
- `data/decks/demo-decks-0.97.json`
- `data/manifests/card-implementation-manifest-0.97.json`
- `data/rules/mechanics-coverage-0.97.json`
- `data/scenarios/v097-run-breach-multiaccess.json`
- `data/scenarios/v097-multiplayer-breach-smoke.json`
- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.test.ts`
- `tests/specs/phase1-artifacts.test.ts`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`

## MVP 0.97 Final gate

`MVP_0.97_done: true`

`ready_for_MVP_0.98_requirements_freeze: true`

V0.97 implements Jack-out, Breach and narrow Multiaccess as a baseline-gated slice. `v097_deep_dive_event` is a local fictional multiaccess harness. Successful V0.97 runs create an internal Breach/AccessQueue; PlayerViews and reconnect payloads expose only side-safe summaries. R&D multiaccess uses top-N order; HQ multiaccess uses Seed, RandomCounter and RandomDrawRecords without replacement. `access_card` remains a Hidden-Info barrier and blocks undo after hidden information. Active Identity-Abilities, Hidden-Zone-Tools, Hosting, Viruses, Purge, Counter families, Bad Publicity, Recurring Credits and Prevention remain unimplemented.

Checks:

- `corepack pnpm --filter @netrunner/shared typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm --filter @netrunner/web typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine test -- --run`: pass, 46 tests.
- `corepack pnpm --filter @netrunner/ai test -- --run`: pass, 21 tests.
- `corepack pnpm --filter @netrunner/server test -- --run`: pass, 19 tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 24 tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 9 tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass, known Turbopack NFT warning remains for the existing `card-images` route trace.

## MVP 0.98 Requirements Freeze files created or updated

- `docs/derived/MVP_0.98_REQUIREMENTS.md`
- `docs/derived/IDENTITY_MODIFIERS_0.98_SPEC.md`
- `docs/derived/HIDDEN_ZONE_TOOLS_0.98_SPEC.md`
- `docs/derived/MVP_0.98_TEST_MATRIX.md`
- `docs/derived/MVP_0.98_REQUIREMENTS_REVIEW.md`
- `tests/specs/phase1-artifacts.test.ts`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log.md`

## MVP 0.98 Requirements Freeze decision

`MVP_0.98_requirements_freeze_done: true`

`ready_for_MVP_0.98a_implementation: true`

V0.98 is frozen as a two-step Identity/Hidden-Zone gate. V0.98a may implement local fictional Runner/Corp identity pilots, setup markers and central static modifiers. V0.98b may start only after V0.98a is green and is limited to narrow Search, Reveal, Expose, Arrange, Shuffle and Swap harnesses through the existing Choice, EventVisibility, RandomDrawRecords and Replay contracts. Hosting, Viruses, Purge, Counter families, Recurring Credits, Bad Publicity, Prevention, Avoid, Interrupt and Replacement remain unimplemented.

## MVP 0.98 Final files created or updated

- `docs/derived/MVP_0.98_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.98_FINAL_REVIEW.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/rules-baseline-0.98.json`
- `data/cards/demo-cards-0.98.json`
- `data/decks/demo-decks-0.98.json`
- `data/manifests/card-implementation-manifest-0.98.json`
- `data/rules/mechanics-coverage-0.98.json`
- `data/scenarios/v098-identity-hidden-zone.json`
- `data/scenarios/v098-hidden-zone-tools.json`
- `data/scenarios/v098-multiplayer-hidden-zone-smoke.json`
- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.test.ts`
- `tests/specs/phase1-artifacts.test.ts`

## MVP 0.98 Final gate

`MVP_0.98_done: true`

`ready_for_MVP_0.99_requirements_freeze: true`

V0.98 implements Identity setup/static modifiers and narrow Hidden-Zone-Tools as baseline-gated local harnesses. `v098_runner_identity`, `v098_corp_identity`, `v098_stack_search_event`, `v098_stack_arrange_event`, `v098_reveal_top_event`, `v098_expose_event` and `v098_hq_rd_swap_operation` are local fictional playable cards. Search/Arrange use side-private Choices and Hidden-Info barriers; Search-Shuffle uses RandomDrawRecords; Reveal/Expose are deliberate public events; Swap leaks no HQ/R&D titles and uses no randomness. Hosting, Viruses, Purge, Counter families, Bad Publicity, Recurring Credits and Prevention remain unimplemented.

Checks:

- `corepack pnpm --filter @netrunner/shared typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine test`: pass, 54 tests.
- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai test`: pass, 23 tests.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm --filter @netrunner/server test`: pass, 20 tests.
- `corepack pnpm exec vitest run tests/specs/phase1-artifacts.test.ts`: pass, 26 tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 9 tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass.
- `corepack pnpm build`: pass, known Turbopack NFT warning remains for the existing `card-images` route trace.

## MVP 0.99 Final files created or updated

- `docs/derived/MVP_0.99_REQUIREMENTS.md`
- `docs/derived/COUNTER_HOSTING_0.99_SPEC.md`
- `docs/derived/VIRUS_PURGE_0.99_SPEC.md`
- `docs/derived/RECURRING_BAD_PUBLICITY_0.99_SPEC.md`
- `docs/derived/MVP_0.99_TEST_MATRIX.md`
- `docs/derived/MVP_0.99_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.99_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.99_FINAL_REVIEW.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `data/rules/rules-baseline-0.99.json`
- `data/cards/demo-cards-0.99.json`
- `data/decks/demo-decks-0.99.json`
- `data/manifests/card-implementation-manifest-0.99.json`
- `data/rules/mechanics-coverage-0.99.json`
- `data/scenarios/v099-counter-hosting.json`
- `data/scenarios/v099-virus-recurring-bad-publicity.json`
- `data/scenarios/v099-multiplayer-hosting-smoke.json`
- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/ai/src/index.ts`
- `packages/ai/src/index.test.ts`
- `apps/server/src/multiplayer.test.ts`
- `tests/specs/phase1-artifacts.test.ts`

## MVP 0.99 Final gate

`MVP_0.99_done: true`

`mechanics_completion_V0.94_to_V0.99_done: true`

V0.99 implements Counter, direct Hosting, Virus/Purge, Recurring Credits and Bad Publicity as narrow local harnesses. `v099_host_resource`, `v099_virus_program`, `v099_recurring_chip` and `v099_bad_publicity_operation` are local fictional playable cards. Hosting choices are side-private Hidden-Info barriers; Purge costs 3 Corp clicks and removes only Virus counters; Recurring Credits are limited to Runner program installs; Bad Publicity is limited to Runner run costs and not Trace bids. Prevention, Avoid, Interrupt, Replacement, Set Aside, Remove from Game, Ownership-/Control-Wechsel and full deckbuilding/format rules remain unimplemented.

Checks before final workspace-wide gates:

- `corepack pnpm --filter @netrunner/shared typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine typecheck`: pass.
- `corepack pnpm --filter @netrunner/engine test`: pass, 60 tests.
- `corepack pnpm --filter @netrunner/ai typecheck`: pass.
- `corepack pnpm --filter @netrunner/ai test`: pass, 25 tests.
- `corepack pnpm --filter @netrunner/server typecheck`: pass.
- `corepack pnpm --filter @netrunner/server test`: pass, 21 tests.

## V1.0.2 Requirements Freeze files created or updated

- `docs/derived/V1_0_2_REQUIREMENTS.md`
- `docs/derived/OPPONENT_ACTION_PRESENTATION_SPEC.md`
- `docs/derived/V1_0_2_TEST_MATRIX.md`
- `docs/derived/V1_0_2_REQUIREMENTS_REVIEW.md`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log 2026-05.md`

## V1.0.2 Requirements Freeze decision

`V1_0_2_requirements_freeze_done: true`

`ready_for_implementation: true`

V1.0.2 is frozen as a presentation/orchestration release. Implementation may add side-safe opponent action cues, local cue queue, board highlights, Human-vs-KI pacing, `advance_ai` authorization and opt-in local action audio. The scope does not add cards, official mechanics, Engine rule authority, public platform features, official assets, Replay changes or StateHash changes.

## V1.0.2 Implementation files created or updated

- `apps/web/app/action-cues.ts`
- `apps/web/app/action-cues.test.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/multiplayer.test.ts`
- `tests/specs/visibility-contract.test.ts`
- `docs/derived/V1_0_2_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_0_2_FINAL_REVIEW.md`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log 2026-05.md`

## V1.0.2 Final gate

`V1_0_2_implemented: true`

`V1_0_2_verified: true`

`V1_0_2_done: true`

V1.0.2 implements side-safe opponent action cues, local cue queue, board highlights, Human-vs-KI pacing, `advance_ai` authorization and opt-in local action audio. The scope does not add cards, official mechanics, Engine rule authority, public platform features, official assets, Replay changes or StateHash changes.

Checks:

- `corepack pnpm --filter @netrunner/web test -- action-cues.test.ts`: pass.
- `corepack pnpm --filter @netrunner/server test -- multiplayer.test.ts`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm lint`: pass.
- `corepack pnpm test`: pass, 182 tests.
- `corepack pnpm build`: pass.
- Local Web smoke: pass, `http://127.0.0.1:3000`.
- Local Server smoke: pass, `http://127.0.0.1:8787/health`.

## V1.0.3 Implementation files created or updated

- `apps/web/app/match-start.ts`
- `apps/web/app/match-start.test.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/multiplayer.test.ts`
- `tests/specs/visibility-contract.test.ts`
- `docs/derived/V1_0_3_MATCHSTART_UX_PLAN.md`
- `docs/derived/V1_0_3_MATCHSTART_UX_FINAL_REVIEW.md`
- `docs/codex/CODEX_STATUS.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Index.md`
- `KI-Wissen-Netrunner/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
- `KI-Wissen-Netrunner/03 Betrieb/Log 2026-05.md`

## V1.0.3 Final gate

`V1_0_3_matchstart_ux_done: true`

V1.0.3 implements separated Matchstart choices, server-side Human-vs-KI random side derivation, local display-name persistence, Human-vs-Human start readiness lobby, ready flags, countdown 3/5/10 seconds, countdown cancel, reconnect-to-lobby payloads, private lobbychat and server-side `single_game` deck-target finalization after Joiner deck handshake. The scope does not add cards, official mechanics, Engine rule authority, public platform features, official assets, Replay changes, StateHash changes, AI-input changes or PublicGameEvent chat payloads.

Checks:

- `corepack pnpm --filter @netrunner/web test`: pass, 14 tests.
- `corepack pnpm --filter @netrunner/server test`: pass, 28 tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 11 tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 186 package tests plus 39 root spec tests.
- `corepack pnpm build`: pass.

## S01 Requirements and implementation files created or updated

- `docs/derived/S01_DETAILED_PLAN.md`
- `docs/derived/S01_REQUIREMENTS.md`
- `docs/derived/S01_RESULT_MODAL_SPEC.md`
- `docs/derived/S01_MATCH_SERIES_SPEC.md`
- `docs/derived/S01_AUDIO_SPEC.md`
- `docs/derived/S01_TEST_MATRIX.md`
- `docs/derived/S01_REQUIREMENTS_REVIEW.md`
- `apps/server/src/multiplayer.ts`
- `apps/server/src/http-server.ts`
- `apps/server/src/multiplayer.test.ts`
- `apps/web/app/page.tsx`
- `apps/web/app/globals.css`
- `tests/specs/visibility-contract.test.ts`

## S01 implementation gate

`S01_implemented: true`

`S01_verified: true`

Implemented scope:

- Server-side side-safe `GameResultSummary` for finished games.
- WebSocket `match_finished` payload now carries the result summary.
- Startscreen offers `Regelmatch · 7 Agendapunkte` and `Private Matchserie · Seitenwechsel`; the earlier `Einzelspiel · Deckziel` option has been removed as a rules correction.
- Private `two_game_side_swap` series creates a second game with side swap and side-safe standings.
- Web UI shows a result modal with perspective text, safe statistics, final StateHash and abstract local CSS background graphic.
- Audio effects are opt-in, locally synthesized and not part of Engine, Replay or StateHash.

Checks:

- `corepack pnpm --filter @netrunner/server test`: pass, 13 tests.
- `corepack pnpm exec vitest run tests/specs/visibility-contract.test.ts`: pass, 9 tests.
- `corepack pnpm lint`: pass.
- `corepack pnpm typecheck`: pass.
- `corepack pnpm test`: pass, 68 package tests plus 25 root spec tests.
- `corepack pnpm build`: pass. Known Turbopack NFT warning remains for the pre-existing `card-images` route trace.

## Phase 2 implemented scope

- Deterministic `createGame` with fixed Demo-Decks, seed, RandomCounter and RandomDrawRecords.
- Engine API: `getLegalActions`, `applyAction`, `getPlayerView`, `validateGameState`, `checkWinConditions`, `replayEvents`, `hashState`.
- LegalAction/PlayerAction revalidation for side, StateVersion and current legal action.
- Runner and Corp basic actions, install/play/advance/score/end turn.
- Run, ICE rez, encounter, breaker pump/break, ETR, access, agenda steal, asset trash path.
- Agenda win condition with configurable test harness support; product match setup now uses the rule target `agendaPointsToWin = 7`.
- Side-filtered PlayerViews and PublicEvents.
- Deterministic Corp-KI over LegalActions and Corp PlayerView.
- Minimal local Next.js UI for Human Runner vs Corp-KI.

## Important Phase 1 assumptions

- Current product games use `agendaPointsToWin = 7`; the historical 6-point demo target is no longer a valid product rule.
- Mulligan, Jack-out, Multiaccess, Tags, Trace, Damage, Viren, Hosting, Prevention, Replacement and Interrupts are documented deviations, not MVP-0.1 implementation scope.
- Concrete scenario StateHashes are generated and frozen during Phase 2 after the first green replay implementation.
- MVP 0.2 was read only for future compatibility and did not expand MVP 0.1 scope.

## Blockers

No MVP-0.1 blocker remains.

Remaining known limits:

- SQLite is the private local standard storage since V1.0.8. JSON-File-Storage remains only Legacy/Test/Migration input.
- Localhost operation is the supported private MVP path. HTTPS/WSS are required outside localhost.
- Public platform features, matchmaking, accounts, broad/free deckbuilder, chat and broad card pool remain out of scope. The local V0.6+ deck editor is permitted only as private local deck/snapshot tooling.
- V0.94 Damage/Flatline is implemented; Core Damage, Damage Prevention, Avoid, Interrupt and Replacement remain later gated mechanics.
- V0.91 private local scans/assets are allowed only as display artifacts for private local use. Public distribution, official logos, standalone card frames, card backs, external card database dependencies, and Engine/AI/GameState/Replay/StateHash image use remain excluded.
- Local O:NR-v1 playable test access is allowed for private local use and is covered by V1.0 smokes/reviews for that private scope. It remains excluded from public distribution.

## Local tool notes

- Node target files exist: `.nvmrc` and `.node-version` both specify `24`.
- Root `package.json` declares `pnpm@10.33.2` via `packageManager`.
- Local web dev default is `http://127.0.0.1:3100` so NETGRID does not collide with other local apps on port 3000. The multiplayer server default remains `http://127.0.0.1:8787`.
- If `pnpm` is not directly on PATH, use `corepack pnpm ...`.

## Next step

The post-MVP-0.4 roadmap through V1.0 and current post-V1.0 stabilization path are complete/planned as follows:

- V0.5: card import and card catalog.
- V0.6: deck editor and match setup foundation.
- V0.7: UI redesign and visual design, intentionally delayed because design analyses are still running.
- V0.8: playable base/starter-set slice.
- V0.9: stronger AI.
- V0.91: card image asset gate and private local image import/display after V0.9.
- V0.92: mechanics inventory and M1 requirements/specification gate.
- V0.93: M1 Engine foundation and M2 requirements.
- V0.94: Damage and Flatline, with narrow Game-End reason contract.
- V0.95: Runner Resources and tag-interaction.
- V0.96: Trace, Link and Bidding.
- V0.97: Run, Jack-out, Breach and Multiaccess.
- V0.98: Identity setup/modifiers and Hidden-Zone tools.
- V0.99: Hosting, Viruses, Purge, Counter families, Recurring Credits and Bad Publicity.
- V1.0: Deck- und Match-Setup-Stabilisierung.
- V1.0.1: Deckbibliothek und Join-Deck-Handshake.
- V1.0.2: Gegner-Aktionsdarstellung und Ablauftransparenz, implementation complete and locally verified.
- V1.0.3: Matchstart-UX, implementation complete and locally verified.
- V1.0.4: Private Match Lifecycle und Session Recovery, implementation complete and locally verified.
- V1.0.5: Action Board UX und Board-Klarheit has a suitable implemented UI baseline in the workspace, but no dedicated formal final artifacts.
- V1.0.5K: kleines Karten-Nachrelease, implementation complete and locally verified.
- V1.0.6: Aktionen, Credits und Kartenanzeige, implementation complete and locally verified.
- V1.0.7: Browser-E2E und Visual QA, implementation complete and locally verified.
- V1.0.8: Storage/Backup-Härtung, implementation complete and locally verified.
- V1.0.9: Private Internet Hardening, implementation complete and locally verified.
- V1.1.0: Setup/Game-End M2 und NETGRID-Statusklarheit, implementation complete and locally verified.
- V1.1.1: Discard, Handlimit und Core Damage, implementation complete and locally verified.
- V1.1.2: Full Archives Access plus independent Matchstart Entry UX, implementation complete and locally verified.

Current gate: V1.1.3/V1.2.0/V1.2.1 are complete. V1.1.3 is planning-only and has `ready_for_implementation: false`; `ready_for_next_release_implementation: true` is confirmed by the completed V1.2.0/V1.2.1 follow-up releases. V1.2.0 Event Modification Foundation and V1.2.1 Replacement Effects are implemented and locally verified. V1.1.2K kleines Kartenrelease implementation and final verification are complete. V1.1.2 Full Archives Access und Matchstart Entry UX, V1.1.1 Discard/Handlimit/Core Damage, V1.1.0 Setup/Game-End M2, V1.0.9 Private Internet Hardening, V1.0.8 Storage/Backup-Härtung and V1.0.7 Browser-E2E und Visual QA are complete and locally verified. Damage/Flatline, Resources, Trace/Link/Bidding, Jack-out/Breach/Multiaccess, Identity/Modifier, Hidden-Zone-Tools, Hosting, Viruses, Purge, Counter families, Recurring Credits, Bad Publicity, Core Damage, Event Modification and Replacement are playable only in their narrow gated scopes.

V1.1.0 final review: `docs/derived/V1_1_0_FINAL_REVIEW.md` documents the completed Setup/Game-End M2 scope after V1.0.9. It confirms explicit setup, private mulligan, 7-point agenda normalization, game-end reason contract, Archives-facedown foundation, identity setup, visible spelling `Korp`, Lucide role icons, project/dossier-style agenda icon in agenda blue, tag icon, side-safe Setup UI and Browser-E2E regression.

V1.1.1 final review: `docs/derived/V1_1_1_FINAL_REVIEW.md` documents the completed Discard/Handlimit/Core Damage scope. It confirms Korp-/Runner-Discard-Phases, side-private Discard choices, Engine handlimit values, Runner Core Damage, negative-handlimit Flatline, Hidden-Info safety, Replay/StateHash determinism, Multiplayer/Reconnect/Undo coverage, deterministic AI discard and Web UI status.

V1.1.2 final review: `docs/derived/V1_1_2_FINAL_REVIEW.md` documents the completed Full Archives Access and Matchstart Entry UX scope. It confirms full Runner access over mixed Korp Archives, Archives-specific hidden-card visibility, side-safe PlayerViews/Reconnect payloads, deterministic Archives queue progress, Trash from Archives without duplicate entries, Replay/StateHash determinism, Multiplayer/Reconnect/Undo/Idempotency coverage and the NETGRID start console with play-mode cards, format cards, Join-Link entry, folded advanced options and side-safe start summary.

Next scope decision:

1. Implement V1.3.1 from `docs/derived/V1_3_1_TO_V1_4_1_IMPLEMENTATION_HANDOFF.md`.
2. Treat V1.4.0 and V1.4.1 as planned follow-up releases, but do not start them before the preceding release final gate is green.
3. Keep AI-Hints separate from `ai_supported`; Hints prepare KI support but do not grant it.
4. Keep plan-based KI behind PlayerView, LegalActions, side-filtered PublicEvents, own deck/hint data and explicit public metadata.
5. Treat V1.4.2 Belief State and V1.4.3 Simulation/Selfplay as later gates, not as V1.4.0/V1.4.1 scope.
6. Keep accounts, cloud decks, public decklists, matchmaking, rankings and tournament legality out of scope until explicitly approved.

Card Data Pipeline v2, AI-Hints v2 and planbasierte KI remain planned only until their implementation/final gates. Event Modification, Replacement, Special Zones, Format/Deckbuilding and the current O:NR-v1 card pool remain limited to their completed narrow gates; further cards, broad eventfamilies, Avoid-/Interrupt-Runtime-Pilots and KI-Deckfreigaben still need their own gates.

Detailed planning artifacts available:

- `docs/derived/POST_MVP_0.4_ROADMAP.md`
- `docs/derived/MVP_0.5_DETAILED_PLAN.md`
- `docs/derived/V1_0_DECK_MATCH_STABILIZATION_PLAN.md`
- `docs/derived/V1_0_DECK_MATCH_STABILIZATION_FINAL_REVIEW.md`
- `docs/derived/V1_0_3_MATCHSTART_UX_PLAN.md`
- `docs/derived/V1_0_3_MATCHSTART_UX_FINAL_REVIEW.md`
- `docs/derived/V1_0_2_OPPONENT_ACTION_PRESENTATION_PLAN.md`
- `docs/derived/V1_0_2_REQUIREMENTS.md`
- `docs/derived/OPPONENT_ACTION_PRESENTATION_SPEC.md`
- `docs/derived/V1_0_2_TEST_MATRIX.md`
- `docs/derived/V1_0_2_REQUIREMENTS_REVIEW.md`
- `docs/derived/V1_0_2_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_0_2_FINAL_REVIEW.md`
- `docs/derived/RELEASE_PLANNING_2026-05-05.md`
- `docs/derived/V1_0_4_NEXT_RELEASE_CANDIDATES.md`
- `docs/derived/V1_0_4_PRIVATE_MATCH_LIFECYCLE_PLAN.md`
- `docs/derived/V1_0_4_REQUIREMENTS.md`
- `docs/derived/V1_0_4_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_0_4_FINAL_REVIEW.md`
- `docs/derived/V1_0_4_TWO_TAB_SMOKE.md`
- `docs/derived/V1_0_5_ACTION_BOARD_UX_PLAN.md`
- `docs/derived/V1_0_6_UI_RESOURCE_CLARITY_PLAN.md`
- `docs/derived/V1_0_6_REQUIREMENTS.md`
- `docs/derived/RESOURCE_CARD_DISPLAY_1_0_6_SPEC.md`
- `docs/derived/V1_0_6_TEST_MATRIX.md`
- `docs/derived/V1_0_6_REQUIREMENTS_REVIEW.md`
- `docs/derived/V1_0_6_BROWSER_PLAYTEST_SMOKE.md`
- `docs/derived/V1_0_6_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_0_6_FINAL_REVIEW.md`
- `docs/derived/V1_0_7_BROWSER_E2E_VISUAL_QA_PLAN.md`
- `docs/derived/V1_0_7_REQUIREMENTS.md`
- `docs/derived/BROWSER_E2E_VISUAL_QA_1_0_7_SPEC.md`
- `docs/derived/V1_0_7_TEST_MATRIX.md`
- `docs/derived/V1_0_7_REQUIREMENTS_REVIEW.md`
- `docs/derived/V1_0_7_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_0_7_FINAL_REVIEW.md`
- `docs/derived/V1_0_8_STORAGE_BACKUP_HARDENING_PLAN.md`
- `docs/derived/V1_0_8_REQUIREMENTS.md`
- `docs/derived/STORAGE_SQLITE_1_0_8_SPEC.md`
- `docs/derived/BACKUP_RECOVERY_1_0_8_SPEC.md`
- `docs/derived/V1_0_8_TEST_MATRIX.md`
- `docs/derived/V1_0_8_REQUIREMENTS_REVIEW.md`
- `docs/derived/V1_0_8_IMPLEMENTATION_REVIEW.md`
- `docs/derived/V1_0_8_FINAL_REVIEW.md`
- `docs/derived/V1_0_9_PRIVATE_INTERNET_HARDENING_PLAN.md`
- `docs/derived/V1_0_9_REQUIREMENTS.md`
- `docs/derived/PRIVATE_INTERNET_SECURITY_1_0_9_SPEC.md`
- `docs/derived/PRIVATE_DEPLOYMENT_OPS_1_0_9_SPEC.md`
- `docs/derived/V1_0_9_TEST_MATRIX.md`
- `docs/derived/V1_0_9_REQUIREMENTS_REVIEW.md`
- `docs/derived/V1_1_0_SETUP_GAME_END_M2_DETAILED_PLAN.md`
- `docs/derived/V1_1_2_FULL_ARCHIVES_AND_MATCHSTART_ENTRY_UX_PLAN.md`
- `docs/derived/V1_1_2_REQUIREMENTS.md`
- `docs/derived/FULL_ARCHIVES_ACCESS_1_1_2_SPEC.md`
- `docs/derived/MATCHSTART_ENTRY_UX_1_1_2_SPEC.md`
- `docs/derived/V1_1_2_TEST_MATRIX.md`
- `docs/derived/V1_1_2_REQUIREMENTS_REVIEW.md`
- `docs/derived/LONG_TERM_PRODUCT_VISION_AND_ROADMAP.md`
- `docs/derived/LONG_TERM_PRODUCT_VISION_EXECUTIVE_SUMMARY.md`
- `docs/derived/MVP_0.6_DETAILED_PLAN.md`
- `docs/derived/MVP_0.7_DETAILED_PLAN.md`
- `docs/derived/MVP_0.8_DETAILED_PLAN.md`
- `docs/derived/MVP_0.9_DETAILED_PLAN.md`
- `docs/derived/MVP_0.91_DETAILED_PLAN.md`
- `docs/derived/MVP_0.91_REQUIREMENTS.md`
- `docs/derived/CARD_IMAGE_ASSET_GATE_0.91_SPEC.md`
- `docs/derived/MVP_0.92_REQUIREMENTS.md`
- `docs/derived/MECHANICS_COVERAGE_MATRIX.md`
- `docs/derived/MECHANIC_M1_EFFECT_TIMING_SPEC.md`
- `docs/derived/MECHANIC_M1_TEST_MATRIX.md`
- `docs/derived/MVP_0.92_FINAL_REVIEW.md`
- `docs/derived/MVP_0.93_REQUIREMENTS.md`
- `docs/derived/SETUP_GAME_END_0.93_SPEC.md`
- `docs/derived/MVP_0.93_FINAL_REVIEW.md`
- `docs/derived/MVP_0.94_0.95_ASSUMPTION_REVIEW.md`
- `docs/derived/MVP_0.94_DETAILED_PLAN.md`
- `docs/derived/MVP_0.95_DETAILED_PLAN.md`
- `docs/derived/MVP_0.94_0.99_PLANNING_REVIEW.md`
- `docs/derived/MVP_0.96_DETAILED_PLAN.md`
- `docs/derived/MVP_0.97_DETAILED_PLAN.md`
- `docs/derived/MVP_0.98_DETAILED_PLAN.md`
- `docs/derived/MVP_0.99_DETAILED_PLAN.md`
- `docs/derived/MVP_0.95_REQUIREMENTS.md`
- `docs/derived/RESOURCE_TAG_INTERACTION_0.95_SPEC.md`
- `docs/derived/MVP_0.95_TEST_MATRIX.md`
- `docs/derived/MVP_0.95_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.95_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.95_FINAL_REVIEW.md`
- `data/rules/mechanics-coverage-0.95.json`
- `docs/derived/MVP_0.96_REQUIREMENTS.md`
- `docs/derived/TRACE_LINK_BIDDING_0.96_SPEC.md`
- `docs/derived/MVP_0.96_TEST_MATRIX.md`
- `docs/derived/MVP_0.96_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.96_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.96_FINAL_REVIEW.md`
- `data/rules/mechanics-coverage-0.96.json`
- `docs/derived/MVP_0.97_REQUIREMENTS.md`
- `docs/derived/RUN_BREACH_MULTIACCESS_0.97_SPEC.md`
- `docs/derived/MVP_0.97_TEST_MATRIX.md`
- `docs/derived/MVP_0.97_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.97_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.97_FINAL_REVIEW.md`
- `data/rules/mechanics-coverage-0.97.json`
- `docs/derived/MVP_0.98_REQUIREMENTS.md`
- `docs/derived/IDENTITY_MODIFIERS_0.98_SPEC.md`
- `docs/derived/HIDDEN_ZONE_TOOLS_0.98_SPEC.md`
- `docs/derived/MVP_0.98_TEST_MATRIX.md`
- `docs/derived/MVP_0.98_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.98_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.98_FINAL_REVIEW.md`
- `data/rules/mechanics-coverage-0.98.json`
- `docs/derived/MVP_0.99_REQUIREMENTS.md`
- `docs/derived/COUNTER_HOSTING_0.99_SPEC.md`
- `docs/derived/VIRUS_PURGE_0.99_SPEC.md`
- `docs/derived/RECURRING_BAD_PUBLICITY_0.99_SPEC.md`
- `docs/derived/MVP_0.99_TEST_MATRIX.md`
- `docs/derived/MVP_0.99_REQUIREMENTS_REVIEW.md`
- `docs/derived/MVP_0.99_IMPLEMENTATION_REVIEW.md`
- `docs/derived/MVP_0.99_FINAL_REVIEW.md`
- `data/rules/mechanics-coverage-0.99.json`
- `docs/derived/V1_1_3_FINAL_REVIEW.md`
- `data/rules/mechanics-coverage-1.2.1.json`

UI design exploration artifacts available:

- `docs/ui-designsets/README.md`
- `docs/ui-designsets/REALISM_REVIEW.md`
- `docs/ui-designsets/05-logo-exploration/BRANDING_DECISION.md`: current provisional client name is `NETGRID`; selected clean icon references live under `docs/ui-designsets/05-logo-exploration/selected-netgrid/`.
