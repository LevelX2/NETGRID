# Aktueller Projektstatus

Stand: 2026-07-18

## Führender Produktstand

- NETGRID ist eine private Version-0-Webanwendung mit deterministischer Rules
  Engine, lokalem/private-LAN-Multiplayer, SQLite-Storage, Deckbibliothek,
  Kartenkatalog, Replay-/Undo-Grundlage, Human-vs-Human, Human-vs-KI und einem
  beobachtbaren KI-vs-KI-Matchmodus.
- Die Engine ist alleinige Regelautorität. UI, Server und KI reichen nur
  vorhandene `LegalActions` ein; `applyAction` revalidiert den vollständigen
  Vertrag.
- Hidden-Info-Schutz, Replay, StateHash und seedbasierte Zufallsnachweise sind
  verbindliche Gates.
- Der detaillierte Release-/Phasenstand liegt in `docs/codex/CODEX_STATUS.md`;
  die konsolidierte Folgeplanung liegt unter
  `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`.

## Engine und Karten

- Originalset, Classic und Proteus besitzen versionierte Kartendaten,
  Supportmanifeste und Engine-Implementierungen.
- Classic ist mit 54/54 Karten technisch abgeschlossen und als optionales
  Zusatzset verfügbar.
- Proteus ist mit 154/154 Karten engine-/human-playable. Technisches
  `ai_supported` ist von Play-Strength-Readiness und Default-/Random-Pool-
  Promotion getrennt.
- Kartenimplementierungen, PlayerViews, PublicEvents, Replay und StateHash
  werden durch paketnahe Engine- und Visibilitytests abgesichert.
- Allgemeine Asset-/Upgrade-Rezfenster während Runs gelten über alle
  Corp-Server. ICE-Rez und fortgebundene Sonderfenster bleiben am Runziel;
  Encounter und laufende Trace-Versuche öffnen kein zusätzliches normales
  Rezfenster. Der konkrete Hacker-Tracker-Fall rezzt die Karte in Remote 2
  während eines Runs auf Remote 1 und führt sie anschließend regelkonform in
  den Trace. Führend ist
  `docs/reviews/engine/global-run-rez-windows-final-review-2026-07-16.md`.
- Installierte Corp-Assets mit semantischem Zugriffseffekt wirken
  standardmäßig nur gerezzt. Der aktive Pool umfasst zehn Access-Nodes unter
  56 Corp-Assets: sieben folgen dem Rez-Default, `Virus Test Site` ist die
  einzige belegte installierte Unrezzed-Ausnahme und macht dann genau 1 Net
  Damage; Bel-Digmo und Stereogram wirken nur aus R&D beziehungsweise
  Archives. Führend ist
  `docs/reviews/engine/node-access-rez-contract-final-review-2026-07-15.md`.
- City Surveillance löst Runner-Mehrfachziehen als fortsetzbare Sequenz auf:
  Vor jeder tatsächlich gezogenen Karte kann die Korp eine installierte,
  bezahlbare Draw-Tax-Quelle rezzen; danach wählt der Runner pro gerezzter
  Quelle einzeln 1 Credit oder 1 Tag. `Jack 'n' Joe`, Fünf-Karten-Draws,
  mehrere Quellen und Crash Everetts Zusatzdraw sind abgedeckt. Effekte ohne
  das Wort „draw“, insbesondere `Arasaka Owns You` mit „refresh your hand“,
  verwenden keinen Draw-Tax-Pfad. Führend ist
  `docs/reviews/engine/city-surveillance-draw-sequence-final-review-2026-07-14.md`.

## KI

- Die Semantic Runtime ist der einzige produktive Entscheidungsweg.
- `@netgrid/ai` exportiert nur Live-Verträge; Simulation, Selfplay und
  Benchmarks liegen unter `@netgrid/ai/simulation`.
- Alte Corp-/Runner-Planer, Baseline-Selectoren, Shadow-/META-/Readiness-
  Runtime, Kill-Switches und der frühere AI-Monolithtest sind entfernt.
- Der Coverage-Restpfad ist fail-closed und darf nur ausdrücklich sichere
  Engine-Fortsetzungen auswählen.
- Der produktive Auswahlweg ist über `AiDecisionDebug.decisionChain`
  verhaltensneutral beobachtbar: LegalActions, semantische Ausschlüsse,
  Rohscore-Sieger, Plan-Mapping, Plan-vs.-Score-Arbitration, feste
  Sonderprioritäten, nachgelagerte Anpassung und Choice-Auflösung werden
  side-sicher getrennt ausgewiesen. Spielgleiche Decision-Checkpoints können
  diese Auswahlroute zusätzlich zur finalen Action prüfen.
- Der bestehende SQLite-KI-Trace ist die einzige dauerhafte Diagnoseablage für
  diese Kette: `summary` speichert sie kompakt, `detailed` vollständig im
  gleichen `ai_decision_traces.trace_json`; ein zweiter Speicherpfad entsteht
  nicht.
- Der bestehende Plan `corp.create_score_window` erkennt vollständige
  Same-Turn-Konversionspfade aus Aktionsgewinn, Advancement-Platzierung,
  Countertransfer und Basic Advances. Vapor Ops und andere Werkzeuge werden
  funktionsbasiert erkannt; ungeschützte Agenda-Installationen bleiben ohne
  garantierten Abschluss gesperrt.
- Die spielgleiche Runner-Endgame-Remediation aus Match 424A trennt vorhandene
  Breaker-Coverage von fehlender Gesamtbezahlbarkeit, bewertet Run-Events über
  ihren wirklichen Zielpfad, schützt finanzierte neue Entwicklung und lässt
  negative Backup- oder Hintergrund-Bankpläne bei akut besserer sichtbarer
  Konvertierung weichen. Fall Guy wird im konkreten legalen
  Tag-Vermeidungsfenster statt `pass` genutzt. Führend ist
  `docs/reviews/ai/ai-match-424a-runner-endgame-remediation-final-2026-07-15.md`.
- Die ECFE3CE-Remediation führt sichtbare Trace-Vermeidung und spätere
  ICE-Kosten durch einen gemeinsamen Credit-Pool und revalidiert Run-Sperren
  quellenunabhängig im tiefsten `startRun`-Pfad. Fang, All-Nighter, Private LDL
  Access, Bodyweight Synthetic Blood und TKO 2.0 sind von der Hintquelle bis
  zu ihren produktiven Consumern korrigiert. Die getrennte Broker-Analyse
  bestätigt Optimierungsbedarf bei letztem Lade-Klick, Mehrkopien-
  Amortisation, Quellenwahl und einem frühen Cashout; Broker-Code wurde dafür
  noch nicht geändert. Führend ist
  `docs/reviews/ai/match-ecfe3ce-engine-hints-remediation-final-2026-07-16.md`.
- Die zwei zuletzt abgeschlossenen Corp-KI-Spiele vom 17.07.2026 sind mit
  192/192 Decisions analysiert und behoben. Geschützte Scorelines können
  spekulative Punish-Pläne konvertieren, Score-Remote-Roots bleiben für
  Agenden frei, contestable Agenda-Risiken berücksichtigen den Punktwert und
  ausreichend geschützte Matchpoint-Linien werden nicht pauschal blockiert.
  Nicht-ICE-Rezzes verwenden durchgängig `rez_card`; beide Match-Deck-Audits
  melden null Hint-Blocker und null Warnungen. Führend ist
  `docs/reviews/ai/latest-two-corp-match-remediation-final-review-2026-07-17.md`.
- Die Planebene besitzt zusätzlich ein begrenztes Planportfolio: kurzfristige
  Score- und Gefahrenpläne bleiben Vordergrund beziehungsweise Interrupt,
  während Broker-/Bank-Zyklen und langfristige Corp-Scoring-Remotes mit
  höchstens einer Hintergrundaktion pro Zug fortgesetzt werden können.
  `RemoteDoctrineProfile` leitet den Remote-Bedarf aus der eigenen Deckstrategie
  ab; Fast Advance erzeugt keinen pauschalen Glacier-Ausbau. Zielremotes werden
  über Züge gebunden und anhand sichtbarer Pfadkosten sowie Runner-Erholung
  statt nur ICE-Anzahl bewertet.
- Aktuelle Benchmarks vergleichen `random_legal_bot` mit
  `current_candidate`; historische Profilnamen sind keine Runtimeoption mehr.
- AI Behavior Baseline v1 ergänzt diese Profilvergleiche um einen festen
  deckübergreifenden `current_candidate`-Selfplay-Lauf mit sechs Slots, zehn
  Seeds je Slot, 480 Aktionen und normalisierten Verhaltensraten. Der erste
  Lauf umfasst 60 Spiele und 11.144 Entscheidungen; alle Safety-Gates außer
  zwei Aktionslimits im Hybrid-Score/Punish-Slot sind grün. Führend sind
  `docs/architecture/ai/ai-behavior-baseline-v1-process-2026-07-12.md` und
  `docs/reviews/ai/ai-behavior-baseline-v1-initial-run-review-2026-07-12.md`.
- Der Planportfolio-Rollout wurde zusätzlich gegen einen isolierten
  Hybrid-Control am exakten Ausgangs-Commit geprüft. Control und Kandidat
  besitzen jeweils vier bereits vorhandene Aktionslimit-Partien; alle übrigen
  Safety-Gates sind grün. Plan-Konversion und No-Progress verbesserten sich
  leicht, gestiegene Bank-/Plan-Mismatch-Findings und eine Seed-Verschiebung
  bleiben offenes Review-Risiko. Führend:
  `docs/reviews/ai/ai-planportfolio-remote-doctrine-final-review-2026-07-12.md`.
- Aktive AI-Gates: 618 Hints, 602 durch den Action-Signal-Katalog abgedeckt,
  32 zurückgestellt, 89 Target-Profile-Gaps. Full Derived Facts: 528
  CardImplementations, 391 generierte Facts und 137 aktuell noch nur über
  kompilierte Hints abgedeckte Karten; 0 harte Fehler.
- Führende Artefakte:
  - `docs/architecture/ai/README.md`
  - `docs/architecture/ai/ai-current-state-cleanup-process-2026-07-09.md`
  - `docs/reviews/ai/ai-current-state-cleanup-final-review-2026-07-09.md`
  - `docs/architecture/ai/corp-score-conversion-capability-contract.md`
  - `docs/architecture/ai/corp-score-conversion-plan-process-2026-07-10.md`
- Der Proteus-AI-Rollout ist lokal in `main` integriert: 154/154 Karten sind
  technisch `ai_supported`, alle 114 Pilotdeck-Karten sind an elf
  Familien-Szenarien gebunden und vier qualifizierte Snapshots liegen im
  AI-Deckpool 1.1.0. Play-Strength bleibt ein getrenntes Gate.

## Server, Web und lokaler Betrieb

- Der Spielstart `Simulation` erstellt ein persistiertes `ai_vs_ai`-Regelmatch
  und öffnet das normale side-sichere Spielbrett. Pause, Einzelschritt,
  getaktetes Weiter, schneller Einzelschritt-Takt und aktiver Abbruch sind
  verfügbar; der frühere interaktive Batchlauf mit 120-Aktionen-Limit ist aus
  diesem Startpfad entfernt. Ein deterministischer Regressionslauf endete nach
  183 Aktionen regulär und blieb nach Reconnect, Replay und StateHash grün.
  Führend sind
  `docs/architecture/ai/ai-vs-ai-observer-process-2026-07-13.md` und
  `docs/reviews/ai/ai-vs-ai-observer-implementation-review-2026-07-13.md`.
- SQLite ist der aktuelle Standardstorage. Backup, Restore, Inspect,
  Maintenance, Retention-Schutz und Cleanup arbeiten auf der aktuellen
  SQLite-Datenbank.
- Die geschlossene V2.0-Passwort-Account-Alpha ist umgesetzt. Accounts werden
  nur durch lokalen Admin-Bootstrap oder einmalige Einladung angelegt;
  widerrufbare Account-Sessions laufen über ein `HttpOnly`-Cookie und bleiben
  von Maintenance- und Match-Capabilities getrennt. E-Mail, Passkeys, MFA und
  öffentliche Registrierung sind noch nicht enthalten.
- Ein Account kann bis zu 50 ownergebundene persönliche Server-Decks halten.
  40 kuratierte Standard-Decks sind direkt spielbar oder kopierbar; interne
  KI-, Test- und ausgemusterte Decks sind in der normalen UI unsichtbar.
  Matchstarts erzeugen weiterhin ausschließlich neu validierte immutable
  Snapshots. Führend sind
  `docs/releases/v2/v2-0-auth-privacy-cloud-decks/password-accounts-cloud-decks-final-review-2026-07-18.md`
  und `docs/runbooks/account-alpha-operations.md`.
- Der einmalige JSON-/Alt-SQLite-Import wurde am 2026-05-06 abgeschlossen und
  ist seit dem Current-State-Projekt-Cleanup kein Start-/CLI-/Health-Vertrag
  mehr.
- Der normale lokale Startpfad ist `scripts/start-netgrid.ps1`.
- Der Webclient zeigt die bewusst gesetzte Produktversion `V0.9` getrennt von
  einer fortlaufenden Git-Buildkennung. Die Optionen nennen zusätzlich Commit,
  Quellstand und lokalen Entwicklungsstatus; ein nicht sauberer Arbeitsbaum
  wird als `-dev` gekennzeichnet. Führend ist
  `docs/decisions/product-version-and-build-identification-2026-07-17.md`.
- Storage-, Cleanup-, Recovery- und KI-Trace-Maintenance bilden nach ARC-001
  eine eigenständige Control Plane. Private LAN-Adressen sind kein
  Adminnachweis mehr. Passwort, kurzlebige serverseitige Sitzung, CSRF und
  frische Reauthentifizierung schützen die Wartungsfunktionen; aktiver und
  anderer nicht-terminaler Matchzustand ist vom Cleanup ausgeschlossen.
- Lokales HTTP ist nur auf Loopback erlaubt. Remote-/Tablet-Maintenance ist im
  `private_internet`-Profil standardmäßig aus und verlangt eine eigene
  HTTPS-Origin sowie explizit benannte Proxy-Adressen. Führend sind
  `docs/architecture/maintenance/maintenance-control-plane-security-process-2026-07-11.md`,
  `docs/runbooks/maintenance-control-plane.md` und das ARC-001-Final-Review.
- Die verwaiste Next-Demo-Route `/api/game` mit globalem V0.8-GameState ist
  entfernt. Produktive Matches laufen über den Multiplayer-Server; das lokale
  Tutorial bleibt ein ausdrücklich isolierter Modus.
- Der Playtest-Fund vom 11. Juli 2026 ist als sequenzieller Paketprozess
  geschlossen: Window- und Access-Darstellung, öffentliche Chronicle-
  Choice-Texte sowie Auto-End bei offenen Runs und Bestätigungen sind
  gehärtet. `Lockjaw`-Tap und das nicht bezahlbare HQ-ICE wurden als
  regelkonforme Nichtfehler belegt. Führend:
  `docs/reviews/current-game-findings-remediation-final-review-2026-07-11.md`.

## Current-State-Struktur

- `docs/architecture/current-state-project-cleanup-process-2026-07-10.md`
  dokumentiert die projektweite Bereinigung und ihre Einzelcommits.
- Historische nummerierte AI-Prozessscripts und ihre Rohreports werden durch
  `docs/reviews/ai/ai-historical-process-rollup-2026-07-10.md` ersetzt.
- Die Kartenregistrierung liegt in `packages/shared/src/card-definitions.ts`;
  produktive Consumer verwenden nur `CARD_DEFINITIONS` und
  `CARD_DEFINITIONS_BY_ID`.
- Teststufen, drei feste AI-Shards und Package-Boundaries sind unter
  `docs/architecture/test-tiers-and-package-boundaries-2026-07-10.md`
  ausführbar festgeschrieben.
- Für lokalisierte Kartenassets werden nur Art-Quellen und Full-PNGs
  versioniert. Die Retention-Regel steht in
  `docs/architecture/card-asset-retention-2026-07-10.md`.

## Aktuelle Risiken und offene Gates

- Für eine erste Benutzerverwaltung im privaten Internetbetrieb liegt seit
  2026-07-18 ein stufenweiser V2.0-Planungsentwurf vor. Er schlägt eine
  geschlossene Passwort-Account-Alpha, accountgebundene SQLite-Decks mit einem
  Defaultlimit von 50, kuratierte Standard-Decks sowie nachgelagerte E-Mail-,
  Passkey- und MFA-Stufen vor. Die vorhandene Account-Session-Foundation ist
  noch nicht an HTTP-Server oder Weboberfläche angebunden. Vor Umsetzung muss
  der Wechsel vom älteren Passkey-first-Vertrag zu Passwort-first ausdrücklich
  freigegeben werden. Führend für diesen Entwurf ist
  `docs/releases/v2/v2-0-auth-privacy-cloud-decks/user-profiles-password-cloud-decks-staged-plan-2026-07-18.md`.
- `apps/web/app/page.tsx`, `apps/web/app/chronicle.ts`,
  `apps/server/src/multiplayer.test.ts` und mehrere Corp-AI-Scoringdateien sind
  verbleibende Komplexitätsschwerpunkte.
- Das Engine-Architektur-Zielgate ist grün. Mark-Counter-Anzeigen werden über
  generische Kartendefinitionsmetadaten statt direkter Karten-ID-Verzweigungen
  projiziert.
- Kompatibilitätsnamen in Ability-Payloads sind noch aktiver Engine-Vertrag;
  sie dürfen erst nach Normalisierung aller aktuellen Producer/Consumer
  entfernt werden.
- Umfangreiche Benchmark-Rohdaten gehören nach `data/local/`; versioniert
  werden nur kleine aktuelle Summaries und reproduzierbare Fixtures.
- Offizielle Artworks, Frames, Logos und externe Kartendatenbankabhängigkeiten
  bleiben ohne eigenes Rechts-/Asset-Gate ausgeschlossen.

## Arbeits- und Abschlussregel

- Neue Arbeit wird gegen diesen Current State und `docs/codex/CODEX_STATUS.md`
  geprüft.
- Historische Aussagen sind keine aktuelle Runtimefreigabe.
- Parallele Worktrees werden vor Main-Integration defensiv abgeglichen.
- Push, Pull Request und Remote-Integration erfolgen nur auf Nutzerwunsch.
