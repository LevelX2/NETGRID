# Architektur-Dokumentation

Stand: 2026-08-12

`docs/architecture/` enthält releaseübergreifendes Architekturwissen, das den aktuellen Systemzustand, Zielzustand, Schichtgrenzen oder verbindliche technische Verträge beschreibt.

## Bereiche

Zu den aktuellen Fachbereichen gehören unter anderem:

- `ai/`: aktuelle KI-Zielarchitektur und Plan-/Controller-/Trace-Verträge;
- `engine/`: aktuelle Rules-Engine-, Runtime-, Kartenlogik- und Ausführungsverträge;
- `central-card-specification-and-registry-target-state-2026-08-09.md`: führende CardSpec- und Registry-Architektur für die kanonische kartenspezifische Autorenquelle;
- `card-rules/`: Kartenregel-, Timing- und Semantikverträge;
- `card-images/`: Kartenbild- und Anzeigegrenzen;
- `deck-library/`: lokale Deckbibliothek und Storage-Verträge;
- `localization/`: Locale-, Übersetzungs- und Präsentationsverträge der
  normalen Spieleroberfläche;
- `windows/`: installerneutrale Windows-Release- und Produktgrenzen;
- weitere fachlich benannte Bereiche für aktuelle Architekturthemen.

## Current-State-Regel

Ein Architekturartefakt bleibt, wenn es heute einen Architektur- oder Vertragszustand beschreibt, den Code, Agenten oder Folgeentscheidungen tatsächlich benötigen.

Nicht dauerhaft in `docs/architecture/` gehören:

- abgeschlossene Implementierungsprozesse und Worktree-Protokolle;
- Remediation-, Audit- und Migrationsausführungen;
- einzelne historische Karten-/Match-Fixprozesse;
- Zwischenstände, die durch einen aktuelleren Vertrag vollständig ersetzt sind.

Nach Abschluss und Referenzprüfung werden solche Dateien gelöscht statt archiviert. Git-Historie hält den früheren Stand.

Konkrete Releasefreigaben gehören nur dann hierher, wenn sie zugleich einen dauerhaft gültigen Architekturvertrag darstellen; sonst liegen aktuelle Gate-/Releaseartefakte unter `docs/releases/` oder `docs/reviews/`.

Retention: `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`.
