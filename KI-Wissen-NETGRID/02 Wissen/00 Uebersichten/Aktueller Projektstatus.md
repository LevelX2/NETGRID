# Aktueller Projektstatus

Stand: 2026-08-19

## Produktstand

NETGRID ist eine private Version-0-Webanwendung für Netrunner mit deterministischer Rules Engine, lokalem/private-LAN-Multiplayer, SQLite-Storage, Deckbibliothek, Kartenkatalog, Replay-/Undo-Grundlage, Human-vs-Human, Human-vs-KI und KI-vs-KI-Analysepfaden.

Die sichtbare Produktversion ist `V0.9`. Daneben wird eine aus Git ermittelte Buildkennung angezeigt. Führend ist `docs/decisions/product-version-and-build-identification-2026-07-17.md`.

Die Engine ist alleinige Regelautorität. UI, Server und KI reichen nur angebotene `LegalActions` ein; die Engine revalidiert Zustand, Kosten, Ziel, Choice und Legalität vor der Ausführung. Hidden-Info-Schutz, Replay, StateHash und seedbasierter Zufall bleiben verbindliche Systemgrenzen.

Beim Matchstart ist eines von drei autoritativ persistierten
Trace-Regelprofilen wählbar: `modern_open` (Default, Basisstärke N, offene
sequenzielle Payments, Runner gewinnt Gleichstand), `classic_blind` (N als
Corp-Bid-Limit, verdeckte Commitments, Runner gewinnt Gleichstand) und
`classic_blind_corp_ties`. Blind-Bids werden gemeinsam aufgedeckt; generische
Payment-Quellen und Post-Reveal-Fenster bleiben erhalten. KI-Varianz läuft nur
innerhalb rationaler legaler Kandidaten über den replaybaren Engine-RNG.
Führend ist
`docs/architecture/card-rules/trace-open-bidding-alignment-plan-2026-05-16.md`.

Innerhalb der privaten Anwendung sind öffentliche Matchlisten, accountgebundene persönliche Historie, Live-Zuschauer und terminale Lern-Replays umgesetzt.

## Kartenbilder und lokale Vorbereitung

Persönliche Kartenbilder werden ausschließlich in einer lokalen
Vorbereitungsphase importiert, normalisiert und persistent gespeichert. Die
Spielruntime verwendet danach nur lokale Varianten; Remote-URLs und lokale
Quellpfade gelangen nicht in Browser-, Match-, Replay- oder StateHash-Daten.

Neben lokalen PNG-, JPEG- und WebP-Quellen existiert ein ausdrücklich zu
aktivierender HTTPS-Import. Er erzwingt öffentliche gepinnte Netzwerkziele,
Redirect-Neuprüfung, feste Zeit-, Byte- und Statusgrenzen, zulässige MIME-Typen,
tatsächliche Bilddekodierung und optionalen SHA-256. Der normale Import bleibt
netzwerkfrei.

Für private Komplettbestände existieren drei lokale Paketprofile:
Originalset mit 374, Proteus mit 154 und Classic mit 54 indexierten Bildern.
Manifest, Mindest-Importer-Version, Katalogfingerabdruck, Pfade und Hashes
werden vor dem atomaren Import geprüft. Quellen und Buildausgaben bleiben in
ignorierten lokalen Verzeichnissen und gehören weder in CI noch in den
Hauptinstaller. Die lokale, authentifizierte Maintenance-Oberfläche unter
`/maintenance/card-images` zeigt den Bestand, erzeugt Vorlagen und steuert
Prüfläufe, Importe sowie private Paket-Builds über eine verwaltete relative
Inbox. Die bestehende Maintenance-Anmeldung, CSRF-/Origin-Prüfung und die
direkte Loopback-Grenze schützen auch mutierende Kartenbildjobs; eine zweite
Passworteingabe ist dafür nicht erforderlich. Führend ist
`docs/architecture/card-images/personal-card-image-import.md`.
Zuordnungen dürfen zusätzlich pro Quelle einen expliziten
`randzuschnittPx`-Wert `links,oben,rechts,unten` enthalten; ohne Wert bleibt das
Bild unverändert. Maintenance-Fortschritt wird dabei pro Verarbeitungsphase in
Karten statt in doppelt gezählten technischen Arbeitsschritten angezeigt.

## Engine und Karten

Originalset, Classic und Proteus sind technisch spielbar. Kartenspezifische Autorenwahrheit wird über die zentrale CardSpec-Architektur geführt.

Der CardSpec-Migrationsprozess CS00 bis CS13 ist abgeschlossen und integriert:

- `@netgrid/cards` ist die zentrale kartenspezifische Autoren- und Projektionsschicht.
- `@netgrid/cards/engine` liefert die mechanischen CardImplementation-, Runtime- und Source-Ref-Projektionen.
- `packages/engine/src/card-implementations/registry.ts` besitzt keine zweite manuelle Autorenregistry.
- Coverage bezieht Implementierungs-, Runtime- und Source-Informationen aus CardSpec.
- Die Rules Engine bleibt alleinige Autorität für Legalität und Ausführung.

Führend sind:

- `docs/architecture/central-card-specification-and-registry-target-state-2026-08-09.md`
- `docs/architecture/engine/README.md`
- `packages/engine/AGENTS.md`

## KI

Die produktive KI arbeitet Plan-first. Der aktuelle Entscheidungsweg verbindet Engine-/Kartensemantik und ActionSemanticCandidates mit DeckDoctrine, Strategic Intent, residenten Planinstanzen, side-spezifischen Schedulern, TurnPlanner, Commitment/Execution Lease und eng gebundener Choice-Auflösung. Doctrine, Hints, Sensoren und Quotes liefern Information; sie besitzen keine parallele Action-Autorität.

Führend sind:

- `docs/architecture/ai/README.md`
- `docs/architecture/ai/target-architecture.md`
- `docs/architecture/ai/planning-architecture.md`
- `docs/architecture/ai/turn-campaign-planner.md`
- `docs/architecture/ai/change-compass.md`
- `packages/ai/AGENTS.md`

Weitere KI-Arbeit ist überwiegend Play-Strength- und Modulerweiterung. Konkrete Spielbeobachtungen werden als kleine Activities und Regressionstests geführt. Abgeschlossene Matchanalysen, Replay-Evidence und Reviewchroniken sind keine zweite aktuelle Spezifikation.

## Betrieb und Analyse

Aktuelle wiederholbare Betriebspfade liegen unter `docs/runbooks/`:

- `account-alpha-operations.md`
- `maintenance-control-plane.md`
- `netgrid-local-transfer.md`

Für die Analyse laufender Matches dient die read-only Maintenance-Analysis-API. Direkter SQLite-Zugriff bleibt ein bewusstes Wartungs-/Sonderwerkzeug. Der aktuelle Vertrag steht in `docs/runbooks/maintenance-control-plane.md`.

## Planung und laufende Arbeit

Es gibt derzeit keine dauerhaft führende monolithische Release-Roadmap. Historische V0-/V1-/V2-Releasepakete und ihre Audit-/Final-Review-Evidence sind kein Current State.

Aktuelle Arbeit wird über folgende Ebenen gesteuert:

- `docs/activities/inbox/`: offene kleine Findings und Nacharbeiten.
- `docs/activities/in-progress/`: aktuell beanspruchte Pakete.
- `docs/codex/CODEX_STATUS.md`: kompakter technischer Gesamtstand.
- aktuelle Architektur-, Entscheidungs- und Runbook-Verträge.
- bei einem neuen größeren Vorhaben ein ausdrücklich aktueller Scope-/Releaseplan für dessen Laufzeit.

Nach Abschluss wird das dauerhafte Ergebnis in Code, Tests, Architektur, Entscheidung, Status oder Runbook zurückgeführt; historische Prozess-, Release- und Review-Evidence wird anschließend entfernt.

## Zentrale Qualitätsgrenzen

Je nach Änderungsscope sind insbesondere relevant:

- paketnahe Typechecks und Tests;
- `corepack pnpm check:engine-source-structure`;
- `corepack pnpm check:engine-source-structure:selftest` bei Strukturguard-Arbeit;
- `corepack pnpm check:ai` und einschlägige AI-Struktur-/Hint-Gates bei KI-Änderungen;
- Replay-, StateHash-, Hidden-Info- und deterministische Zufallstests bei betroffenen Enginepfaden;
- `git diff --check` vor Abschluss eines Änderungsschnitts.

## Dokumentationsprinzip

Der Arbeitsbaum beschreibt den heutigen Stand. Abgeschlossene Prozesse, Releasepakete, Reviews, Benchmarks, Replay-/Trace-Rohdaten und alte Statuschroniken werden nicht vorsorglich konserviert. Git-Historie übernimmt die historische Nachvollziehbarkeit.

Führend: `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`.
