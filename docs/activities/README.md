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

## Verschieberegeln

1. Neues Paket aus `templates/activity.md` in `inbox/` anlegen.
2. Beim Start nach `in-progress/` verschieben und `status`, `startedAt`, `primaryAgent` und bei Bedarf `branch` setzen.
3. Bei Blocker `status: blocked`, `blockerReason` und `nextAction` ergänzen. Wenn sinnvoll, kleinere Folgepakete in `inbox/` anlegen.
4. Beim Abschluss nach `done/` verschieben, `completedAt`, `outcome`, `resultArtifacts` und `checks` ergänzen.
5. Dauerhafte Erkenntnisse nach Bedarf zusätzlich in `KI-Wissen-NETGRID/`, `docs/codex/CODEX_STATUS.md` oder formale `docs/derived/`-Artefakte zurückführen.

## Auswahlregel für Agenten

Wenn kein konkretes Paket genannt ist, wählt der Agent aus `inbox/` ein Paket mit passender Rolle, hoher Priorität, klaren Akzeptanzkriterien und begrenztem Scope. Bei mehreren gleich geeigneten Paketen gilt: erst `critical`, dann `high`, dann ältere `normal`-Pakete.
