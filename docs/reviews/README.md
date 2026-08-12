# Reviews

Stand: 2026-08-12

`docs/reviews/` enthält nur Reviews, Audits und strukturierte Evidence, die heute noch eine konkrete Projektfunktion besitzen. Der Ordner ist kein historisches Review-Archiv.

## Aktueller Zweck

Review-Artefakte bleiben versioniert, wenn sie beispielsweise:

- aktuelles Gate- oder Release-Evidence sind;
- eine noch relevante Architektur-, Safety- oder Removal-Condition belegen;
- von aktuellem Status, Tests, Scripts, Package-Commands oder führenden Verträgen referenziert werden;
- einen noch nicht anderweitig verdichteten Befund enthalten.

Historische Spotcheck-Serien, frühere Docs-Cleanup-Inventare, Chronicle-Berichte, Zwischenstände, Benchmark-/Trace-Serien und andere abgeschlossene Ausführungsevidence werden nicht im Arbeitsbaum konserviert. Ihre Historie liegt in Git.

## Retention

Vor einer Löschwelle werden aktive Verweise geprüft und bei Bedarf auf den aktuellen führenden Vertrag, Review oder Status umgestellt. Danach gilt:

- current and referenced → behalten;
- abgeschlossen und fachlich verdichtet → löschen;
- generierte Roh-Evidence ohne aktuelle Consumer → löschen;
- unklare aktuelle Gate-/Contract-Funktion → gesondert prüfen.

Führende Retention-Regel: `docs/decisions/docs-retention-current-state-policy-2026-07-08.md`.
