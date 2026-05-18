# NETGRID-Dokumentation

Diese Übersicht trennt Rohquellen, Arbeitsplanung und dauerhafte Projektartefakte. Die Zielstruktur für die laufende Aufräumung ist in `docs/decisions/docs-structure-target-decision-2026-05-18.md` festgelegt.

## Ordner

- `source/`: unveränderte oder quellennahe Ausgangsdokumente.
- `activities/`: aktive Arbeits-Pipeline für offene Konzepte, kleine Pakete, Fixes, Nacharbeiten und Cleanup-Aufgaben.
- `releases/`: gebündelte Releasefamilien mit Requirements, Specs, Testmatrizen, Reviews, Final Reviews und historischen Plänen.
- `architecture/`: releaseübergreifende Architekturentscheidungen, technische Zielbilder und Engine-/Schichtgrenzen.
- `reviews/`: Querschnittsreviews, Audits, Inventare und strukturierte Nachprüfungen ohne eigene Releasefamilie.
- `archive/`: historische, nicht mehr führende Artefakte, die bewusst im Arbeitsbaum bleiben.
- `derived/`: bestehender Übergangs- und Bestandsbereich für abgeleitete Artefakte wie Releasepläne, Requirements, Specs, Testmatrizen, Implementation Reviews, Final Reviews und größere Analyseberichte.
- `codex/`: aktueller Codex-Status, Runbooks und Arbeitsnotizen mit Projektsteuerungsbezug.
- `KI-Player/`: KI-bezogene Briefings und Planungsunterlagen.
- `ui-designsets/`: UI-/Branding-Explorationen und zugehörige Designartefakte.

## Zielstruktur

Weitere Strukturpakete führen diese Zielbereiche schrittweise ein, sobald ein kleiner Linkaudit- und Move-Schnitt sie braucht:

- `decisions/`: kleine Projekt-, Produkt-, Asset-, Git- und Dokumentationsentscheidungen.
- `runbooks/`: wiederholbare Betriebs-, Diagnose-, Wartungs- und Arbeitsabläufe.
- `operations/`: ops-nahe Dauerartefakte zu Deployment, Maintenance, Observability und Incidents.
- `design/`: spätere kuratierte Designsystem- und Branding-Struktur, falls `ui-designsets/` migriert wird.

## Grundregel

Neue lose Arbeitspakete starten in `activities/inbox/`. Erst wenn daraus ein formaler Plan, eine Spezifikation, ein Review oder ein dauerhaftes Nachweisdokument entsteht, wird ein passendes Artefakt angelegt. Migrierte Dauerartefakte sollen nach der Zielstruktur einsortiert werden; `derived/` bleibt nur noch als Übergangshinweis bestehen.
