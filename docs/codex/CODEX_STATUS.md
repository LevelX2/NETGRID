# CODEX_STATUS

Stand: 2026-08-21

## Einstieg

Für den aktuellen Projektstand gelten in dieser Reihenfolge:

1. `docs/architecture/README.md`
2. `docs/architecture/engine/README.md`
3. `docs/architecture/ai/README.md`
4. passende `docs/runbooks/` und `docs/activities/`
5. paketlokale `AGENTS.md`, Code, Tests und ausführbare Gates

Historische Statuschroniken, abgeschlossene Releasepakete, Prozesse und Reviews werden nicht als zweite Steuerungsschicht im Arbeitsbaum gepflegt. Dafür reicht die Git-Historie.

## Produktstand und Version

NETGRID ist eine private Version-0-Webanwendung mit deterministischer Rules Engine, lokalem/private-LAN-Multiplayer, SQLite-Storage, Deckbibliothek, Kartenkatalog, Replay-/Undo-Grundlage, Human-vs-Human, Human-vs-KI und KI-vs-KI-Analysepfaden.

Die sichtbare Produktreife ist `V0.9`; die technische Buildkennung wird aus Git ermittelt. Führend ist `docs/decisions/product-version-and-build-identification-2026-07-17.md`.

Es gibt derzeit keine dauerhaft führende monolithische Release-Roadmap. Aktuelle Arbeit wird über `docs/activities/inbox/`, `docs/activities/in-progress/`, den Current-State-Status und bei Bedarf einen explizit aktuellen Scope-/Releaseplan gesteuert. Nach Abschluss wird die historische Release-Evidence entfernt.

Die Engine ist alleinige Regelautorität. UI, Server und KI reichen nur angebotene `LegalActions` ein; die Engine revalidiert Zustand, Kosten, Ziel, Choice und Legalität vor der Ausführung. Hidden-Info-Schutz, Replay, StateHash und seedbasierter Zufall bleiben verbindliche Grenzen.

## Engine und Karten

Originalset, Classic und Proteus sind technisch spielbar. Kartenspezifische Autorenwahrheit wird über die zentrale CardSpec-Architektur konsolidiert.

Das interne `testset` ist im normalen Laufzeitprofil deaktiviert. Es wird in
Katalog, Deckdaten und Matchaufbau nur mit
`NETGRID_ENABLE_TEST_CARDS=true` angeboten; auch der nicht verlinkte
`/tutorial`-Prototyp ist daran gebunden. Generische technische Identitäten
liegen im separaten aktiven Systemset. Produktive Engine-, Server- und KI-Defaults
verwenden echte Originalset-Decks, während die synthetischen Demo-Decks nur
noch als explizite Mechanik-Fixtures in internen Tests bestehen.

Der CardSpec-Migrationsprozess CS00 bis CS13 ist abgeschlossen und integriert. Aktuell gilt:

- `@netgrid/cards` ist die zentrale kartenspezifische Autoren- und Projektionsschicht;
- `@netgrid/cards/engine` liefert der Engine mechanische CardImplementation-, Runtime- und Source-Ref-Projektionen;
- `packages/engine/src/card-implementations/registry.ts` besitzt keine zweite manuelle Autorenregistry;
- Coverage ist Metadaten-/Auditlogik und bezieht Implementierungs-, Runtime- und Source-Informationen aus CardSpec;
- die Rules Engine bleibt alleinige Autorität für Legalität und Ausführung.

Führend:

- `docs/architecture/central-card-specification-and-registry-target-state-2026-08-09.md`
- `docs/architecture/engine/README.md`
- `packages/engine/AGENTS.md`

## KI

Die produktive KI ist Plan-first. Residente Planinstanzen, side-spezifische Scheduler, TurnPlanner, Commitment/Execution Lease, Kampagnenfortsetzung und eng gebundene Choice-Auflösung bilden den aktuellen Entscheidungsweg. Doctrine, Hints, Sensoren und Quotes liefern Information; sie besitzen keine parallele Action-Autorität.

Führend:

- `docs/architecture/ai/README.md`
- `docs/architecture/ai/target-architecture.md`
- `docs/architecture/ai/planning-architecture.md`
- `docs/architecture/ai/turn-campaign-planner.md`
- `docs/architecture/ai/change-compass.md`
- `packages/ai/AGENTS.md`

Weitere KI-Arbeit ist überwiegend Play-Strength- und Modulerweiterung. Neue Beobachtungen werden als kleine Activities und Regressionstests geführt, nicht als neue globale Heuristikschicht oder dauerhafte Reviewchronik.

Historische Selfplay-Cycle-Reviews, Markdown-Matrix, Reporting-State und
versionierte HTML-Blockberichte wurden nach dem abschließenden idempotenten
Import vom 2026-08-30 entfernt. Führend sind die lokale SQLite-Registry, ihre
Sicherungen und `docs/runbooks/ai-selfplay-evidence-registry.md`.

## Plattform und Betrieb

Aktuelle Betriebs- und Wartungsverträge liegen unter `docs/runbooks/`:

- `account-alpha-operations.md`
- `maintenance-control-plane.md`
- `netgrid-local-transfer.md`

Der persönliche Kartenbildimport besitzt einen persistenten lokalen Store,
lokale und explizite gehärtete HTTPS-Quellen sowie drei private
Verzeichnispaketprofile für Originalset, Proteus und Classic. Runtimepfade
bleiben vollständig netzwerkfrei; private Quellen und Paketausgaben sind aus
Git, CI und Hauptinstaller ausgeschlossen. Die lokale Maintenance-Oberfläche
unter `/maintenance/card-images` stellt Bestandsprüfung, Vorlagen, Prüfläufe,
Importe und Paket-Builds über eine verwaltete relative Inbox bereit. Sie ist
Loopback-only; mutierende Jobs verwenden die bestehende authentifizierte
Maintenance-Sitzung mit CSRF-/Origin-Prüfung ohne zweite Passworteingabe.
Führend ist
`docs/architecture/card-images/personal-card-image-import.md`.

Öffentliche Matchlisten innerhalb der privaten Anwendung, accountgebundene persönliche Historie, Live-Zuschauer und terminale Lern-Replays sind umgesetzt. Neue Plattformarbeit wird als aktueller Scope geführt und nach Integration in Status, Architektur, Entscheidung oder Runbook zurückgeführt.

## Aktuelle Arbeit

- `docs/activities/inbox/`: offene kleine Findings und Nacharbeiten.
- `docs/activities/in-progress/`: aktuell beanspruchte Pakete.
- `docs/activities/done/`: nur kurzlebiger Abschluss-Slot; abgeschlossene Einzelpakete werden nach Rückführung des Ergebnisses entfernt.
- Die CardSpec-Umstellung ist technisch abgeschlossen; aktuelle Karten-/KI-Arbeit baut auf diesem Vertrag auf.
- Die Dokumentationsbereinigung folgt dem Current-State-Prinzip und entfernt historische Prozess-, Review- und Release-Evidence ohne aktuellen Vertrags- oder Gate-Nutzen.

## Zentrale Gates

Je nach Änderungsscope sind insbesondere relevant:

- Engine-Typecheck und paketnahe Engine-Tests;
- `corepack pnpm check:engine-source-structure`;
- `corepack pnpm check:engine-source-structure:selftest` bei Strukturguard-Arbeit;
- `corepack pnpm check:ai` und die einschlägigen AI-Struktur-/Hint-Gates bei KI-Änderungen;
- Replay-, StateHash-, Hidden-Info- und deterministische Zufallstests bei betroffenen Enginepfaden;
- `git diff --check` vor Abschluss eines Änderungsschnitts.

Vollständige Testshards werden nach Wirkung und vereinbartem Integrationscheckpoint eingesetzt; kleine Diagnosefixes beginnen mit dem engsten reproduzierenden Test.

## Dokumentationsregel

Führende Dokumente beschreiben den heutigen Architektur-, Produkt-, Gate- oder Betriebszustand. Abgeschlossene Implementierungsprozesse, Releasepakete, Reviews, Zwischenstände, Benchmarks, Replay-/Trace-Rohdaten und alte Statuschroniken werden nicht vorsorglich konserviert. Git-Historie übernimmt die historische Nachvollziehbarkeit.

Retention: `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`.
