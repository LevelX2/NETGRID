# CODEX_STATUS

Stand: 2026-08-12

## Einstieg

Für den aktuellen Projektstand gelten in dieser Reihenfolge:

1. `KI-Wissen-NETGRID/02 Wissen/00 Uebersichten/Aktueller Projektstatus.md`
2. `docs/releases/roadmaps/netgrid-consolidated-release-roadmap.md`
3. `docs/architecture/README.md`
4. `docs/architecture/engine/README.md`
5. `docs/architecture/ai/README.md`
6. paketlokale `AGENTS.md`, Code, Tests und ausführbare Gates

Historische Statuschroniken, abgeschlossene Prozesse und alte Goal-Verläufe werden nicht mehr als zweite Steuerungsschicht im Arbeitsbaum gepflegt. Dafür reicht die Git-Historie.

## Produktstand

NETGRID ist eine private Version-0-Webanwendung mit deterministischer Rules Engine, lokalem/private-LAN-Multiplayer, SQLite-Storage, Deckbibliothek, Kartenkatalog, Replay-/Undo-Grundlage, Human-vs-Human, Human-vs-KI und KI-vs-KI-Analysepfaden.

Die Engine ist alleinige Regelautorität. UI, Server und KI reichen nur angebotene `LegalActions` ein; die Engine revalidiert Zustand, Kosten, Ziel, Choice und Legalität vor der Ausführung. Hidden-Info-Schutz, Replay, StateHash und seedbasierter Zufall bleiben verbindliche Nicht-Scope-Grenzen für fachfremde Änderungen.

## Engine und Karten

Originalset, Classic und Proteus sind technisch spielbar. Kartenspezifische Autorenwahrheit wird über die zentrale CardSpec-Architektur konsolidiert.

Der CardSpec-Migrationsprozess CS00 bis CS13 ist abgeschlossen und integriert. Aktuell gilt:

- `@netgrid/cards` ist die zentrale kartenspezifische Autoren- und Projektionsschicht;
- `@netgrid/cards/engine` liefert der Engine die mechanischen CardImplementation-, Runtime- und Source-Ref-Projektionen;
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

Weitere KI-Arbeit ist überwiegend Play-Strength- und Modulerweiterung. Konkrete neue Beobachtungen werden als kleine Activities und Regressionstests geführt, nicht als neue globale Heuristikschicht.

## Plattform und Betrieb

Aktuelle Betriebs- und Wartungsverträge liegen unter `docs/runbooks/`:

- `account-alpha-operations.md`
- `maintenance-control-plane.md`
- `netgrid-local-transfer.md`

Öffentliche Matchlisten, accountgebundene persönliche Historie, Live-Zuschauer und terminale Lern-Replays sind umgesetzt. Aktuelle Produkt- und Plattformplanung liegt in der konsolidierten Roadmap; abgeschlossene Einzelprozesse sind keine zweite aktuelle Spezifikation.

## Aktuelle Arbeit

- `docs/activities/inbox/`: offene kleine Findings und Nacharbeiten.
- `docs/activities/in-progress/`: aktuell beanspruchte Pakete.
- `docs/activities/done/`: nur kurzlebiger Abschluss-Slot; abgeschlossene Einzelpakete werden nach Rückführung des Ergebnisses entfernt.
- Die CardSpec-Umstellung ist technisch abgeschlossen; aktuelle Karten-/KI-Arbeit baut auf diesem Vertrag auf.
- Die Dokumentationsbereinigung folgt dem Current-State-Prinzip und entfernt historische Prozess-, Review- und Release-Evidence, sobald kein aktueller Vertrags- oder Gate-Nutzen mehr besteht.

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

Führende Dokumente beschreiben den **heutigen** Architektur-, Produkt-, Gate- oder Betriebszustand. Abgeschlossene Implementierungsprozesse, Zwischenstände, Benchmarks, Replay-/Trace-Rohdaten und alte Statuschroniken werden nicht vorsorglich konserviert. Git-Historie übernimmt die historische Nachvollziehbarkeit.

Retention: `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`.
