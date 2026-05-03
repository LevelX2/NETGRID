# Aktueller Projektstatus

## Umgesetzt

- Projektordner unter `C:\Projekte\Netrunner` vorhanden.
- Repository-Setup-Struktur und Codex-Führungsdateien angelegt.
- Lokale KI-Wissensbasis `KI-Wissen-Netrunner/` angelegt.
- Monorepo-Hülle mit pnpm Workspace, Root-`package.json`, TypeScript-Basiskonfiguration und Vitest-Basiskonfiguration angelegt.
- Erwartete Ordner für `docs/source`, `docs/codex`, `docs/derived`, `data`, `packages`, `apps`, `tests` und `scripts` angelegt.
- Root- und bereichsspezifische `AGENTS.md`-Dateien angelegt.
- Git-Modell festgelegt: lokales Git ohne Remote, Integrationsbranch `main`.

## Teilweise umgesetzt

- Primäre Quellen wurden nach `docs/source/` kopiert, soweit vorhanden.
- Ergänzende Dokumente liegen weiterhin unter `docs/` und sind als zusätzliche Arbeitsgrundlagen bekannt.
- Paketmanifeste sind bewusst minimal und enthalten noch keine Framework-Abhängigkeiten für Web, Server oder Engine-Implementierung.
- Lokaler Werkzeugcheck ergab Node `v24.15.0` statt Zielversion Node 22; `pnpm` war nicht im PATH, `corepack` war vorhanden.

## Offen

- `docs/source/Erstes Testdeck.txt` fehlt als separate Quelle.
- MVP 0.1 Requirements, Datenartefakte, Szenarien und Testmatrix sind noch nicht abgeleitet.
- Engine, UI, Server, KI und Tests sind noch nicht implementiert.
- Abhängigkeiten wurden noch nicht installiert.
- Vor der nächsten technischen Phase Node 22 aktivieren und pnpm über Corepack oder eine bewusst gewählte lokale Installation verfügbar machen.

## Wichtige Grenzen

- In der Setup-Phase darf kein Spielcode geschrieben werden.
- MVP 0.2 darf nicht vor bestandenem oder ausdrücklich dokumentiertem MVP-0.1-Gate begonnen werden.
- `data/` ist hier nicht pauschal ignoriert, weil es versionierte Regeln, Karten, Decks, Manifeste, Abweichungen und Szenarien aufnehmen soll.
