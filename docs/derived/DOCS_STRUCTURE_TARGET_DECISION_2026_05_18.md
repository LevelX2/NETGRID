# docs-Zielstruktur-Entscheidung 2026-05-18

Status: accepted-target-structure
Datum: 2026-05-18
Primärer Agent: `architecture-review-agent`

## Zweck

Diese Entscheidung legt die Zielstruktur für `docs/` fest. Sie ersetzt keine bestehenden Gate-, Release-, Review- oder Quellenartefakte und verschiebt selbst keine Dateien. Sie ist die verbindliche Grundlage für die nächsten kleinen Cleanup-Schritte.

## Ausgangslage

`docs/derived/` ist historisch zum Sammelbereich für fast alle dauerhaften Artefakte geworden: Releasepläne, Requirements, Spezifikationen, Testmatrizen, Implementation Reviews, Final Reviews, Spotchecks, Automationsnachweise, Prompt-Dateien, Architekturberichte und Plattformverträge. Das ist nachvollziehbar aus der Projektentwicklung, aber als dauerhafte Struktur zu breit.

Vorarbeiten liegen bereits vor:

- `docs/derived/DOCS_INVENTORY_LIFECYCLE_INDEX_2026_05_17.md`
- `docs/derived/ROOT_SOURCE_DUPLICATES_CLEANUP_REVIEW_2026_05_17.md`
- `docs/releases/backend-ops/backend-0-5/README.md`
- `docs/derived/DOCS_DERIVED_BACKEND_0_5_LINK_AUDIT_MOVE_PLAN.md`
- `docs/reviews/originalset-spotchecks/README.md`
- `docs/activities/README.md`

## Entscheidung

`docs/derived/` bleibt kurzfristig lesbar und linkstabil, wird aber nicht mehr als pauschaler Zielort für neue Dauerartefakte betrachtet. Neue oder migrierte Artefakte sollen schrittweise in fachlich benannte Zielbereiche wandern.

## Zielbereiche

| Zielbereich | Zweck | Git-Status |
| --- | --- | --- |
| `docs/activities/` | Arbeitsboard für offene, laufende und erledigte kleine Pakete. | Versioniert für `in-progress/` und `done/`; `inbox/` darf vor Claim untracked bleiben. |
| `docs/source/` | Unveränderte oder quellennahe Rohquellen, Regelreferenzen, Spoiler und Testdeckquellen. | Versioniert, sofern nicht privat, geheim, groß oder rechtlich ungeklärt. |
| `docs/codex/` | Aktueller Codex-Status, Codex-Runbooks und klar abgegrenzte Codex-Chronik. | Versioniert. |
| `docs/releases/` | Releasefamilien mit Requirements, Specs, Testmatrizen, Reviews, Final Reviews und Release-Rollups. | Zielstruktur für abgeschlossene und neue Releaseartefakte. |
| `docs/architecture/` | Architekturentscheidungen, technische Zielbilder, Ability-/Engine-Konzepte und Schichtgrenzen. | Zielstruktur für Architekturwissen, das releaseübergreifend gilt. |
| `docs/decisions/` | Kleine Projekt-, Produkt-, Asset-, Git- und Dokumentationsentscheidungen, die nicht klar Release oder Architektur sind. | Zielstruktur für dauerhafte Entscheidungen. |
| `docs/runbooks/` | Wiederholbare Betriebs-, Diagnose-, Wartungs- und lokale Arbeitsabläufe. | Zielstruktur für aktive Runbooks. |
| `docs/operations/` | Betriebsnahe Konzepte, Deployment-, Maintenance-, Observability- und Incident-Unterlagen. | Zielstruktur für ops-nahe Dauerartefakte, sofern sie nicht zu einer Releasefamilie gehören. |
| `docs/reviews/` | Querschnittsreviews, Audits, Inventare und strukturierte Nachprüfungen ohne Releasefamilie. | Zielstruktur für Review-Artefakte. |
| `docs/design/` | Kuratierte UI-/Branding-Referenzen, Designentscheidungen und spätere echte Designsystem-Artefakte. | Erst einführen, wenn `docs/ui-designsets/` wirklich migriert wird. |
| `docs/archive/` | Historische, nicht mehr führende Artefakte, die bewusst im Arbeitsbaum bleiben sollen. | Nur nach Rollup, Linkprüfung und ausdrücklicher Archivierungsentscheidung. |
| `docs/derived/` | Übergangs- und Bestandsbereich für bestehende abgeleitete Artefakte. | Bleibt bis zur schrittweisen Migration kanonisch für bestehende Pfade. |

## Migrationsregeln

1. Keine Masselöschung und keine breite Massenverschiebung.
2. Jede Migration erfolgt als kleines Paket mit klarer Pfadfamilie.
3. Vor jedem Move wird ein Linkaudit mit passenden `rg`-Suchmustern durchgeführt.
4. Final Reviews, Implementation Reviews, Gate-Nachweise und Requirements bleiben als Audit-Trail erhalten.
5. Detailpläne, Preflights, alte Prompts und erledigte Jobfiles werden erst nach Rollup und Linkprüfung archiviert oder entfernt.
6. Historische Pfade werden entweder vollständig migriert oder durch bewusst kurze Redirect-Stubs abgesichert; welche Variante gilt, entscheidet das jeweilige Move-Paket.
7. `KI-Wissen-NETGRID/`, `docs/codex/CODEX_STATUS.md` und betroffene Logs werden bei relevanten Strukturentscheidungen nachgezogen.
8. Hidden-Info-, LegalAction-, Replay- und StateHash-Gates werden durch Dokumentationsmoves nicht berührt.

## Erste Umsetzungsschritte

Die nächsten Schritte sollen klein und prüfbar bleiben:

1. Root-/Source-Duplikate nach dem bestehenden Review bereinigen. Status 2026-05-18: erledigt.
2. Backend 0.5 als Pilotfamilie nach `docs/releases/backend-ops/backend-0-5/` migrieren. Status 2026-05-18: erledigt.
3. `docs/abilityEngine/` nach `docs/architecture/ability-engine/` überführen. Status 2026-05-18: erledigt.
4. `docs/activities/done/` für Mai 2026 in einem Rollup verdichten. Status 2026-05-18: erledigt als `docs/activities/done/ROLLUP_2026_05.md`; Einzeldateien bleiben bis zu separater Linkmigration erhalten.
5. Danach erst größere Blöcke schneiden. Status 2026-05-18: S01 ist nach `docs/releases/special/s01/` migriert; die V1.0- bis V1.9.22-Familien sind nach `docs/releases/v1/` migriert; V2.x-Plattformverträge sind nach `docs/releases/v2/` migriert; Originalset-Spotcheck-Evidence liegt unter `docs/reviews/originalset-spotchecks/`, erledigte Jobfiles unter `docs/archive/originalset-spotcheck-jobs/2026-05/`. MVP-Altbestand, Proteus- und AI-Querschnittsartefakte bleiben offen.

## Nicht entschieden

- Ob alte Pfade grundsätzlich Redirect-Stubs behalten oder vollständig umgelinkt werden.
- Ob große historische Bild- und Designserien langfristig im Arbeitsbaum bleiben oder nur über Git-Historie erhalten werden.
- Ob alle existierenden `docs/derived/`-Artefakte irgendwann migriert werden oder ob ein kleiner historischer Rest dort verbleibt.

## Akzeptanz

Diese Entscheidung gilt als Zielstruktur für weitere Cleanup-Pakete. Sie erlaubt noch keine automatischen Moves und keine Löschungen. Jeder Folgeschritt braucht weiterhin einen kleinen, linkgeprüften Schnitt.
