# Match 5F6D: Runner-Decision Final Review (2026-07-16)

## Ergebnis

Der vollständige Runner-Audit von `match_5f6d027aecbe34e2` klassifiziert
101 von 101 KI-Entscheidungen mit 101 von 101 verknüpften Decision-Traces.
Die drei freigegebenen Fehlergruppen sind mit unveränderten historischen
Expectations und engen Gegenproben generisch geschlossen:

- Decision 58 vermeidet den Hunter-Tag nicht mehr um den Preis eines danach
  unbezahlbaren bekannten Restpfads. Decision 60 war nur die lokal korrekte
  Folge des zuvor verbrauchten Budgets.
- Decisions 62, 74, 75, 83 und 84 bevorzugen die gleichzeitig legale
  Newsgroup-Aktion mit zwei Netto-Credits gegenüber der Basic-Aktion mit einem
  Credit.
- Decision 72 trennt bei der Top-5-Suche die unmittelbar in den Grip genommene
  Karte von der anschließenden Reihenfolge der übrigen Karten.

Das Match endete 9:3 für die Korp. Das Ergebnis selbst ist kein
Qualitätsbeleg; führend sind die zuggenauen PlayerViews, LegalActions,
Replay-/AI-Traces und die daraus gewonnenen Decision-Checkpoints.

## Umgesetzte Verträge

### Trace-Bid bewahrt einen tragfähigen Restpfad

Die Runner-KI darf einen einzelnen sichtbaren Tag aus einem Trace bewusst
akzeptieren, wenn der kleinste sichere Gewinn-Bid den vollständig bekannten
Restpfad unfinanzierbar macht, der niedrigste Verlust-Bid dagegen Restpfad,
Reserve und Basic-Tag-Cleanup erhält. Der Vertrag greift nur bei einem
einzelnen `add_tag`, einem wertvollen Run-Ziel und vollständig bekanntem,
gerezztem Restpfad. Sichtbare aktive oder gescorte Tag-Bestrafung sperrt die
Abkürzung; Archives-Discard wird nicht als Runner-sichtbare aktive Bestrafung
fehlinterpretiert.

### Credit-Bedarf vergleicht projizierten Nettoertrag

Low-Credit- und Handkarten-Funding-Wert gelten nicht nur für die Basic-
Credit-Aktion, sondern auch für legal erkennbare Credit-Aktionen mit strikt
mehr als einem Netto-Credit pro Click. Credit-Kosten werden abgezogen;
Zwei-Click-zwei-Credit-, Netto-eins- und nicht mehr vorhandene Ability-
Gegenproben bleiben unverändert. Eine ausdrücklich modellierte Auszahlung
gehosteter Credits erhält den allgemeinen Bedarfsbonus nicht zusätzlich zu
ihrem dedizierten Bankvertrag. Dadurch bleibt eine akut nötige Run-Lock-
Freigabe vor einer Bankauszahlung führend.

### Stack-Suche trennt Entnahme und Restreihenfolge

`runner_stack_top5_choose_one_arrange_rest` bewertet zuerst genau eine Karte
für den Grip. Der erste Pick berücksichtigt aktuelle Credits, freie MU und das
side-safe strategische Ziel. Danach wird dieser Pick in den Grip-Kontext
projiziert und nur der Rest mit aktualisierter Duplikatwertung sortiert. Im
historischen Zustand ist Executive Wiretaps sofort nutzbar und HQ-planpassend;
im finanzierten Zustand mit freier MU bleibt Cloak korrekt der erste Pick.

## Dauerhafte Evidence

- Acht strikte Fixtures liegen unter
  `data/scenarios/ai-decision-checkpoints/cp-5f6d-*.json`.
- Der Checkpointvertrag liegt in
  `packages/ai/src/evaluation/decision-checkpoints/match-5f6d-runner-decision-checkpoints.test.ts`.
- Der Choice-Vertrag unterstützt für geordnete Mehrfachauswahlen zusätzlich
  `choice.selectedOptionIdsPrefix`.
- Vor Produktionsänderungen waren sieben historische Zielverträge
  ausschließlich als `behavior_regression` rot. Ungewinnbarer Trace,
  sichtbare Tag-Bestrafung, fehlende Newsgroup und finanzierte Cloak-
  Gegenprobe waren grün.
- Die Red-Evidence ist separat in
  `docs/reviews/ai/ai-match-5f6d-runner-decision-red-evidence-2026-07-16.md`
  festgehalten.

## Commits vor Integration

- `3e64adf6f` – Prozess, Scope und `/Goal`
- `cade31dbd` – spielgleiche rote Checkpoints und Gegenproben
- `46c2dfadb` – Trace- und Restpfad-Budgetierung
- `db5bc9fbe` – Nettoertrag für Credit-Aktionsdominanz
- `66bdf0ef8` – zweistufige Stack-Suche
- `6448cb52b` – Broad-Regression-Härtung für Credit-Bank-Cashouts

## Verifikation vor lokaler Integration

| Check                                          | Ergebnis                                             |
| ---------------------------------------------- | ---------------------------------------------------- |
| Match-5F6D-Checkpointdatei                     | 11/11 grün                                           |
| Search- und Choice-Regressionen                | 26/26 grün                                           |
| Credit-, FD7671-, 9D15- und 5F6D-Fokuslauf     | 32/32 grün                                           |
| angrenzende Trace-Bid-Tests                    | 19/19 grün                                           |
| Runner-Restpfad-Quote                          | 11/11 grün                                           |
| `corepack pnpm --filter @netgrid/ai typecheck` | grün                                                 |
| `corepack pnpm check:ai`                       | grün; keine Fehler, bekannte Warnungen               |
| AI-Shard 1                                     | 114 Dateien und 726 Tests grün; 2 bekannte Altfehler |
| AI-Shard 2                                     | 113 Dateien und 855 Tests grün; 3 bekannte Altfehler |
| AI-Shard 3                                     | 113 Dateien und 787 Tests grün; 5 bekannte Altfehler |
| `git diff --check`                             | grün                                                 |

Die zehn breiten Fehler wurden auf dem aktuellen `main` in denselben sieben
Dateien und mit denselben Expectations reproduziert. Sie betreffen einen
DFE6-Archives-/R&D-Vertrag, einen F450-Streetware-Vertrag, sieben Broker-
Verträge und einen MRGSG-R&D-Vertrag. Der erste Kandidatenlauf enthielt
zusätzlich einen FD7671-Run-Lock-Rückfall; nach der Cashout-Härtung ist dieser
Vertrag wieder grün und der finale Branch-Fehlersatz entspricht exakt der
`main`-Kontrollmessung.

## Grenzen

- Keine Engine-, LegalAction-, PlayerView-, Replay-, StateHash-, Randomness-
  oder Kartentextänderung.
- Keine Karten-ID-, Match-ID-, Seed- oder Instanz-Sonderregel.
- Keine Hidden-Info-Erweiterung: Trace-Bestrafung wird nur aus Runner-
  PlayerView und öffentlichen Zuständen abgeleitet.
- Kein neues Selfplay; die Aufgabe repariert und sichert gespeicherte
  Entscheidungen.
- Push und Pull Request sind nicht Teil des Auftrags.

## Integrationsstatus

P5 ist abgeschlossen. Der lokale Main-Abgleich, die Verifikation auf dem
integrierten Stand und das verifizierte Entfernen von Worktree und Branch
erfolgen als P6 dieses Prozesses. Dieser Abschnitt wird nach dem tatsächlichen
Cleanup auf `main` aktualisiert.
