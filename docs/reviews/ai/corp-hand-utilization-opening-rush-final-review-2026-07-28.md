# Final Review: Corp-Handverwertung und Opening-Rush

Status: **fachlich abgeschlossen und zur lokalen Integration freigegeben**

Stand: 2026-07-28

## Ergebnis

Die produktive Plan-first-Runtime verwertet bekannte, exakt ausführbare
Corp-HQ-Karten jetzt vor einem vermeidbaren Draw, ohne einen freien
Kartenaktion-Selector einzuführen:

- sofortige, garantierte Economy-Operationen laufen ausschließlich unter
  `corp.economy`;
- ein side-sicheres, autoritätsloses Handinventar weist für jede bekannte
  Pilotkarte Domainclaims oder eine explizite Disposition aus;
- Draw-Admission berücksichtigt den konkreten Parent-Zweck, das endliche
  Versuchsbudget, Net-Handdelta und den projizierten Endturn-Overflow;
- eine produktive gleichklassige Kartenroute darf Draw bis zur nächsten
  vollständigen State-Revalidierung verdrängen;
- BBS Whispering Campaign und Red Herrings besitzen enge, vollständig
  LegalAction-gebundene Domainrouten;
- `corp.score_agenda` kann eine qualifizierte frühe P4-Rush-Gelegenheit
  seed-deterministisch annehmen oder ablehnen.

Die ursprüngliche Beobachtung ist damit konkret geschlossen: Im ersten
Corp-Zug des Matches `match_0c77a1fb8540644a` wird Accounts Receivable bei
fünf Credits vor dem nicht dringlichen Defense-Draw gespielt. Im späteren
Shell-Traders-/Rent-I-Con-Fenster bleibt Corporate Retreat hinter Filter
gesperrt; die Corp verwertet ebenfalls Accounts Receivable statt die
exponierte Agenda zu installieren.

## Architekturprüfung

Die Umsetzung blieb in den vorhandenen Plan-first-Strukturen:

- Jede ausgeführte Aktion stammt aus aktuellen `LegalActions`.
- Planmodule behalten Single Ownership. Das Handinventar wählt weder Plan
  noch Executor.
- Draw-Arbitration verändert keine Prioritätsklasse und materialisiert keine
  fremde Kartenaktion.
- Nach jeder Kartenkonversion werden Planportfolio, Draw-Bedarf und
  LegalActions aus dem neuen State vollständig neu aufgebaut.
- Öffentliche vorbereitete Breaker und installierte Breaker bleiben Teil der
  bestehenden Score-Protection-Projektion. Verdeckte Runner-Hand und Stack
  werden nicht gelesen.
- Opening-Rush-Variation verwendet einen stabilen Policy-Hash aus Seed und
  Opportunity-Key. Sie verändert weder Engine-`RandomCounter` noch
  `RandomDrawRecords` und verwendet kein `Math.random`.

## Historische und kontrollierte Evidence

- Der neue D5-Checkpoint reproduziert den ersten Corp-Zug mit Accounts
  Receivable, Project Venice, Setup!, Efficiency Experts und Ice Wall.
- Der bestehende D9-Checkpoint schützt weiterhin gegen die Agenda-Installation
  hinter Filter, wenn Rent-I-Con öffentlich über Shell Traders erreichbar ist.
- Accounts Receivable ist bei fünf Credits sofort ausführbar; bei vier Credits
  erzeugt `corp.economy` genau eine Basic-Credit-Schwellenaktion und
  revalidiert danach.
- Efficiency Experts und Night Shift verwenden ausschließlich garantierte
  LegalAction-Projektionen; leeres R&D, Projektdrift und fehlende
  Bezahlbarkeit bleiben fail-closed.
- Ein voller HQ-Zustand mit Overtime Incentives konvertiert zuerst die
  produktive Aktionskarte und hält den anschließenden Draw zur Revalidierung
  offen. Die verbotene Annual-Reviews-Route bleibt ausgeschlossen.
- Verschobene Full-Game-Sequenzen belegen Fetal AI weiterhin über die
  Ambush-Domainroute und R&D Mole weiterhin in einem exakten,
  deterministischen Multiaccess-Fenster.
- 40 kontrollierte Opening-Rush-Seeds ergeben 18 Annahmen und 22 Ablehnungen.
  Derselbe Opportunity-Key bleibt über State-Revalidierungen stabil.

## P7-Regressionsabgleich

Der erste Volltest des Arbeitsstands meldete 65 Fehler in 28 Dateien. Ein
unveränderter Lauf auf `main` meldete 54 Fehler in 21 Dateien. Die elf
zusätzlichen Fehler wurden einzeln geprüft:

- sechs historische Corp-Checkpoints erwarteten noch Draw, obwohl die
  gewünschte, exakt projizierte Accounts-/Efficiency-/Night-Shift- oder
  Overtime-Konversion jetzt bewusst davorliegt;
- zwei Full-Game-Nachweise benötigten wegen der neuen Corp-Aktionsfolge einen
  längeren Horizont beziehungsweise einen neuen stabilen Seed;
- eine Defense-Evidence erwartete noch den alten String ohne
  `reserve_after_action`;
- zwei weitere Erwartungsabweichungen waren Wiederverwendungen derselben
  aktualisierten Checkpoints.

Eine zwischenzeitlich erwogene Verbreiterung der Upgrade-Reserveprüfung auf
LegalAction-Kosten erzeugte vier neue Defense-Routen und wurde deshalb als
Scope-Ausweitung vollständig zurückgenommen.

Der finale serielle Volltest des Arbeitsstands meldet wie `main` exakt
54 Fehler in denselben 21 Dateien. Gleichzeitig steigt die grüne Abdeckung:

| Stand | Testdateien | grün | rot | Tests | grün | rot |
| --- | ---: | ---: | ---: | ---: | ---: | ---: |
| unverändertes `main` | 509 | 488 | 21 | 4.187 | 4.133 | 54 |
| finaler Arbeitsstand | 513 | 492 | 21 | 4.209 | 4.155 | 54 |

Damit entstehen **null neue Vollsuite-Fehler**. Die 54 roten Tests sind
unabhängige bestehende Baselineabweichungen, insbesondere ältere
Score-Kampagnen-Erwartungen, Runner-Debug-Evidence, Known-ICE-Risikoevidence
und zwei Simulationserwartungen.

## Ausgeführte Abschlusschecks

- `corepack pnpm --filter @netgrid/ai typecheck`: grün.
- 44 gezielte P7-Regressionstests: 41 grün; exakt die drei auch auf `main`
  roten Fälle blieben rot.
- `packages/ai/src/runtime/plan-first-live-runtime.test.ts`: 161/161 grün.
- finaler serieller `corepack pnpm --filter @netgrid/ai test`:
  492/513 Dateien und 4.155/4.209 Tests grün; dieselben 54 Baselinefehler wie
  auf `main`.
- `corepack pnpm check:ai`: grün; Hint-Metadatenvertrag ohne Hard Errors und
  `AI_SOURCE_STRUCTURE OK`.
- `corepack pnpm check:package-boundaries`: grün,
  `PACKAGE_BOUNDARIES OK files=1970`.
- `git diff --check`: grün.

Der im Prozess ursprünglich notierte Befehl
`corepack pnpm check:ai:full` existiert im aktuellen Repository nicht.
Der Aufruf wurde ausgeführt und reproduzierbar mit `Command
"check:ai:full" not found` beendet. Die vorhandenen Einzelgates
`check:ai`, Typecheck, Paketgrenzen und der vollständige AI-Testlauf ersetzen
ihn für diesen Abschluss.

Es wurde kein Server und kein Webclient gestartet. Standardports und lokale
Runtime-Datenbanken blieben unberührt.

## Enge Restpunkte

- Lesley Major bleibt bewusst als
  `unsupported_domain_contract`/enger Follow-up sichtbar; es gibt keinen
  generischen Asset-Fallback.
- Die 54 bestehenden AI-Baselinefehler sind nicht Teil dieses Pakets und
  werden durch diesen Abschluss weder kaschiert noch umgedeutet.
- Ein dediziertes Repository-Script `check:ai:full` kann separat ergänzt
  werden, falls der zusammengesetzte Gate-Name wieder verbindlich werden soll.

## Führende Artefakte

- `docs/architecture/ai/corp-hand-utilization-opening-rush-worktree-process-2026-07-28.md`
- `docs/reviews/ai/ai-match-0c77a1fb-corp-hand-utilization-evidence-2026-07-28.md`
- `docs/reviews/ai/corp-asset-node-domain-pilot-review-2026-07-28.md`
- `docs/reviews/ai/corp-opening-rush-variation-review-2026-07-28.md`
- `data/scenarios/ai-decision-checkpoints/cp-0c77a1fb-02-accounts-before-defense-draw-d5.json`
