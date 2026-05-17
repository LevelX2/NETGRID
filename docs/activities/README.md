# Aktivitäten-Pipeline

Diese Pipeline ist das leichte Arbeitsboard für offene NETGRID-Aktivitäten. Sie ist für Konzepte, kleine Umsetzungspakete, Nacharbeiten, Testlücken, Cleanup-Ideen und vorbereitete Agenten-Jobs gedacht.

## Ordner

- `inbox/`: ungegriffene Pakete. Ein Agent darf daraus ein geeignetes Paket auswählen, wenn der Nutzer sinngemäß sagt: "Such dir ein Paket aus und setze es um."
- `in-progress/`: aktuell beanspruchte Pakete. Beim Start wird die Datei hierher verschoben und das Frontmatter aktualisiert.
- `done/`: erledigte Pakete mit Ergebnisnotiz, Checks und Links auf entstandene Artefakte.
- `templates/`: Vorlagen für neue Aktivitätspakete.

Es gibt bewusst keinen eigenen `locked/`-Ordner. `in-progress/` ist der sichtbare Claim. Wenn ein Paket blockiert, bleibt es dort mit `status: blocked`, `blockerReason` und `nextAction`, bis es abgeschlossen, zurückgeschnitten oder in kleinere Inbox-Pakete aufgeteilt wird.

## Wann hier ablegen?

Nutze `activities/`, wenn etwas noch ein Arbeitspaket ist:

- eine kleine oder mittlere Änderung,
- ein Konzept, das noch nicht als formales Release-Artefakt reif ist,
- ein konkreter Fix- oder Cleanup-Schnitt,
- ein Testlücken- oder Regression-Schutz-Paket,
- eine aus Reviews oder Spotchecks entstandene Nacharbeit.

Nutze stattdessen `docs/derived/`, wenn das Ergebnis ein dauerhaftes Referenzartefakt ist:

- Releaseplan,
- Requirements,
- Spezifikation,
- Testmatrix,
- Implementation Review,
- Final Review,
- größerer Analyse- oder Entscheidungsbericht.

## Statusmodell

- `inbox`: bereit zur Auswahl, noch nicht beansprucht.
- `in_progress`: beansprucht und in Arbeit.
- `blocked`: begonnen, aber durch fachliche oder technische Removal Conditions blockiert.
- `done`: umgesetzt oder bewusst abgeschlossen.
- `superseded`: durch ein anderes Paket ersetzt.

## Prioritäten

- `hotfix`: ausdrücklich priorisierte oder blockierende Korrektur. Diese Pakete werden bei passender Rolle immer vor allen anderen Inbox-Paketen ausgewählt.
- `critical`: sehr dringendes Risiko oder schwere Regression, aber ohne ausdrücklichen Hotfix-Vorrang.
- `high`: wichtiges Paket mit klarem Nutzen oder hohem Folgeeffekt.
- `normal`: reguläre Arbeit ohne besonderen Vorrang.
- `low`: Nebenarbeit, Hygiene oder spätere Optimierung.

## Verschieberegeln

1. Neues Paket aus `templates/activity.md` in `inbox/` anlegen.
2. Beim Start nach `in-progress/` verschieben und `status`, `startedAt`, `primaryAgent` und bei Bedarf `branch` setzen.
3. Bei Blocker `status: blocked`, `blockerReason` und `nextAction` ergänzen. Wenn sinnvoll, kleinere Folgepakete in `inbox/` anlegen.
4. Beim Abschluss nach `done/` verschieben, `completedAt`, `outcome`, `resultArtifacts` und `checks` ergänzen.
5. Dauerhafte Erkenntnisse nach Bedarf zusätzlich in `KI-Wissen-NETGRID/`, `docs/codex/CODEX_STATUS.md` oder formale `docs/derived/`-Artefakte zurückführen.

## Tracking und Retention

`docs/activities/` bleibt ein Arbeitsboard, kein zweites dauerhaftes Dokumentationsarchiv.

- `inbox/` darf bewusst untracked bleiben, solange Pakete noch lose Vorschläge sind. Diese Vereinfachung verhindert Git-Blockaden durch große Mengen vorbereiteter, noch nicht beanspruchter Arbeit.
- Pakete werden spätestens beim Verschieben nach `in-progress/` versioniert. Erledigte Pakete in `done/` werden ebenfalls versioniert, damit Ergebnisnotiz, Checks und erzeugte Artefakte nachvollziehbar bleiben.
- `done/` wird periodisch gesichtet und in Monats- oder Themenrollups verdichtet, sobald viele abgeschlossene Pakete nur noch denselben Prozess-, Release- oder Befundzusammenhang belegen.
- Nach einem Rollup muss ein erledigtes Paket nicht dauerhaft im Board bleiben, wenn sein Ergebnis vollständig im Rollup, in verlinkten Artefakten und in der Git-Historie nachvollziehbar ist.
- Ein erledigtes Paket bleibt im Board, wenn es einen offenen Folgehinweis, eine wichtige Removal Condition, einen noch nicht verdichteten Befund, einen Audit-/Gate-Nachweis oder eine häufig referenzierte Entscheidung enthält.
- Dauerhafte Erkenntnisse gehören nicht in `done/` versteckt. Sie werden nach `KI-Wissen-NETGRID/`, `docs/codex/` oder in formale `docs/derived/`-Artefakte übernommen und aus dem Paket verlinkt.
- Retention-Aufräumarbeiten erfolgen über eigene kleine Cleanup-Activities. Keine Masselöschung oder Massenverschiebung von erledigten Paketen ohne vorheriges Rollup und fokussierten Review.

Für technische Activities bleiben Hidden-Info-, LegalAction-, Replay- und StateHash-Gates harte Nicht-Scope-Grenzen, solange ein Paket sie nicht ausdrücklich und mit passender Rolle adressiert.

Activity-Pakete bleiben klein: Ein Paket soll einen klaren Befund, einen begrenzten Scope, expliziten Nicht-Scope, prüfbare Akzeptanzkriterien und einen primären Folgeagenten enthalten. Wenn ein Rollup neue Arbeit sichtbar macht, entstehen daraus neue kleine Pakete statt eines pauschalen Sammelpakets.

## Auswahlregel für Agenten

Wenn kein konkretes Paket genannt ist, wählt der Agent aus `inbox/` ein Paket mit passender Rolle, hoher Priorität, klaren Akzeptanzkriterien und begrenztem Scope. Bei mehreren gleich geeigneten Paketen gilt: erst `hotfix`, dann `critical`, dann `high`, dann ältere `normal`-Pakete.
