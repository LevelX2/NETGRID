# Log

## [2026-05-03] setup | Projektumgebung initial eingerichtet

Die Projektumgebung für `Netrunner` wurde als lokales Git-Projekt ohne Remote vorbereitet. Angelegt wurden Root- und bereichsspezifische `AGENTS.md`-Dateien, die lokale KI-Wissensbasis `KI-Wissen-Netrunner/`, die erwartete `docs`-/`data`-/`packages`-/`apps`-/`tests`-/`scripts`-Struktur, Monorepo-Metadaten und `docs/codex/CODEX_STATUS.md`.

Bewusste Setup-Entscheidung: `data/` wird nicht pauschal ignoriert, weil Netrunner dort versionierte Regeln, Karten, Decks, Manifeste, Abweichungen und Szenarien erwartet. Ignoriert werden nur lokale Datenbanken, Runtime-Daten und temporäre Artefakte.

Offener Punkt: `docs/source/Erstes Testdeck.txt` fehlt als separat benannte Primärquelle. Die konsolidierte MVP-0.1-Fassung enthält Demo-Deck-Abschnitte, aber die Quellenlücke bleibt vor der Requirements-Ableitung sichtbar.

Lokaler Werkzeughinweis: Beim Setup war Node `v24.15.0` aktiv, obwohl das Projekt Node 22 vorgibt. `pnpm` war nicht im PATH, `corepack` war vorhanden. `.nvmrc` und `.node-version` wurden mit Zielversion `22` angelegt.
