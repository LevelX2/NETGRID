# docs-Retention nach Current-State-Prinzip

Status: `accepted_current`
Ursprüngliche Entscheidung: 2026-07-08
Fortgeschriebener Stand: 2026-08-12
Primärer Agent: `release-implementation-agent`

## Zweck

Diese Entscheidung legt fest, welche Dokumentation in der privaten NETGRID-Version-0-Phase dauerhaft im Arbeitsbaum bleibt. Sie konkretisiert die Strukturentscheidung vom 2026-05-18 und geht deren früheren konservativen Aufbewahrungsregeln vor.

## Grundentscheidung

Der Arbeitsbaum dokumentiert den aktuellen Projektzustand, nicht seine vollständige Entstehungsgeschichte.

1. Git-Historie ist der historische Nachweis.
2. Es gibt keinen Bedarf für einen zusätzlichen `docs/archive/`-Bestand.
3. Historische Prozess-, Implementierungs-, Benchmark-, Trace-, Replay-, Audit-, Remediation-, Cutover- und Zwischenstandsartefakte werden nicht vorsorglich behalten.
4. Erledigte Activities sind kein dauerhaftes Archiv. Nach Ergebnisübertragung und Referenzprüfung dürfen sie gelöscht werden.
5. Reviews bleiben nur solange versioniert, wie sie eine konkrete aktuelle Gate-, Contract-, Decision-, Removal-Condition- oder Statusfunktion besitzen.
6. Große generierte Rohreports bleiben nur im Repository, wenn Code, Tests, Gates oder Scripts sie tatsächlich konsumieren.

## `keep`

Im Arbeitsbaum bleiben insbesondere:

- aktuelle Current-State-, Architektur- und Indexseiten unter `docs/`;
- aktuelle Roadmaps und aktive Release-/Gate-Verträge;
- aktuelle Architektur-, Schnittstellen-, Safety- und Semantikverträge;
- aktive Runbooks und Entscheidungen;
- Rohquellen unter `docs/source/`;
- offene und laufende Activities;
- Review-/Report-Artefakte, die aktuell von Tests, Scripts, Gates, Statusseiten oder führenden Verträgen benötigt werden.

## `delete`

Nach Referenzprüfung werden entfernt:

- abgeschlossene Detailpläne, Preflights und Implementierungsprozesse;
- historische Final-/Implementation-Reviews ohne aktuellen Gate- oder Vertragswert;
- erledigte Activity-Einzelpakete ohne offene Removal Condition;
- alte Selfplay-, Seed-, Candidate-, Snapshot-, Replay-, Benchmark- und Trace-Serien;
- generierte JSON/CSV/Markdown-Reports ohne aktuellen Consumer;
- doppelte, ersetzte oder nur chronologische Zwischenstände;
- historische Designexplorationen und ersetzte Drafts.

Eine Kopie nach `archive/` ist keine Retention-Anforderung.

## `needs-review`

Vor der Löschung wird gesondert geprüft, wenn mindestens eines gilt:

- aktueller Verweis aus `AGENTS.md`, `docs/codex/CODEX_STATUS.md`, `package.json`, Scripts, Packages, Apps oder Data;
- die Datei ist die einzige bekannte aktuelle Decision-, Gate-, Contract- oder Removal-Condition-Evidence;
- ihre Funktion ist aus Name und Kontext nicht belastbar erkennbar.

`final`, `review`, `requirements`, `spec`, `contract` oder `gate` im Dateinamen begründen allein keine Aufbewahrung.

## Löschverfahren

Eine Cleanup-Welle erfolgt als geschlossener, nachvollziehbarer Schnitt:

1. Zielbestand bestimmen.
2. Aktive Verweise auf Zielpfade suchen.
3. Führende aktuelle Verweise im selben Commit anpassen.
4. Historische Artefakte entfernen statt verschieben.
5. Bereichs-READMEs und Current-State-Dokumentation auf die Regel synchronisieren.
6. Diff auf unbeabsichtigte Änderungen und neue Dead Links prüfen.

Historische Logs dürfen weiterhin beschreiben, dass ein inzwischen entfernter Pfad damals existierte. Sie sind Chronik, keine aktive Navigation.

## Verhältnis zur Strukturentscheidung

Die fachlichen Zielbereiche aus `docs-structure-target-decision-2026-05-18.md` bleiben grundsätzlich gültig. Überholt sind dagegen:

- ein permanenter `docs/archive/`-Zielbereich;
- die Pflicht, abgeschlossene Reviews oder Activities allein als Audit-Trail dauerhaft im Arbeitsbaum zu halten;
- Redirect-Stubs für historische Pfade ohne aktuellen Consumer;
- Rollup-Zwang als Voraussetzung für das Entfernen vollständig abgeschlossener Version-0-Artefakte.

## Aktueller Anwendungsstand

Am 2026-08-12 wurde diese Regel auf den ersten großen Safe-Trash-Schnitt angewendet: historische Archive, UI-Explorationen, abgeschlossene Activity-Bestände sowie obsolete Spotcheck-/Docs-Cleanup-/Chronicle-Reviewbereiche werden aus dem Arbeitsbaum entfernt. Weitere Architektur-, Review- und Release-Cleanups folgen separat mit eigener Referenzprüfung.
