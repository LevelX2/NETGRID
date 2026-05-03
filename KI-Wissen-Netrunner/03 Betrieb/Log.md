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
