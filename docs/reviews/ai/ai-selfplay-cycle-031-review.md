# KI-Selbstspielzyklus 031 – letzte Zentralzugriffe vor terminaler Remote

Stand: 2026-08-20
Status: drei vollständige finale Realpfad-Partien; SP-083 behoben und
verifiziert; SP-082 durch eine unabhängige Paarung verdichtet

## Reproduktionsvertrag

- Auswahlseed: `ae974e645b2b4662bcccb4ab72368914`
- Runner: **Purge Window**, 45 Karten,
  `standard_standard_runner_purge_window_1.0.0`, `fnv1a:013046b6`
- Corp: **Rent to Own War Engine**, 47 Karten und 22 Agendapunkte,
  `standard_standard_corp_rent_to_own_war_engine_1.0.0`,
  `fnv1a:2b45c878`
- Spielseeds: `selfplay-031-9bd36a72bfd5e3f63b3fdf5dc8f7d119`,
  `selfplay-031-71a45dd0e153213729b0fb6522d306bf` und
  `selfplay-031-4eb772a1142fb37b2e2926c9481d439d`
- Ausgangsstand: `89613717dde9aeb304515593a891986aa4519fa3`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Worktree-Port 8911 und einer neuen,
explizit gesetzten SQLite-Serie unter
`data/runtime/selfplay-email-each/`. Die Standardports und die Datenbank des
primären Checkouts blieben unangetastet.

## Ergebnis wie im Programm

| Partie |            Endergebnis | Agendapunkte | Ende           | Entscheidungen |
| ------ | ---------------------: | -----------: | -------------- | -------------: |
| Seed 1 | Corp **10 – 6** Runner |      **8:6** | Agendapunkte   |            337 |
| Seed 2 | Corp **10 – 4** Runner |      **7:4** | Agendapunkte   |            184 |
| Seed 3 | Runner **10 – 1** Corp |      **5:1** | Corp-Deck leer |            453 |

Finale Match-IDs und StateHashes:
`match_37e62db46c8d6d1a` / `fnv1a:5fe48e00`,
`match_6d18bcda2c994806` / `fnv1a:1e9d8550` und
`match_8af7e760518678b4` / `fnv1a:e99b356a`.

## Vollständiger Decision-Denominator

Der Ausgangslauf klassifizierte 945/945 Entscheidungen und 948 Events. Nach
dem Ursachenfix wurden dieselben drei Seeds erneut vollständig gespielt. Im
finalen Lauf sind 974/974 Entscheidungen und Traces genau einmal vorhanden:
337, 184 und 453, ausschließlich `ai-decision-trace-v2`. Die getrennten
Eventpässe enthalten 338, 185 und 454 Events einschließlich des jeweiligen
Terminalzustands. `FLAGS=0`: keine Lücken, Duplikate, Fallbacks, Timeouts,
Auswahlmismatches, Engine-Rejections oder fehlenden Auditsektionen.

Im finalen Lauf gab es 43 Runstarts, 26 erfolgreiche Runs, acht Agenda-Steals
und acht Corp-Scores. Die zusätzliche Laufzeit gegenüber dem Ausgangslauf
entsteht ausschließlich in Seed 1 durch die beiden nun ausgeführten
letzten Zentralzugriffe.

## Findings und exakter Replay

### SP-083 – P6-Liquidität verdrängte die einzige letzte Zugriffschance

Im ursprünglichen `match_4d8f89d26613204e` lag der Runner bei 6 Punkten,
die Corp bei 5. In `remote_1` lag eine verdeckte Karte mit zwei sichtbaren
Advancement-Countern hinter einem aktuell unbezahlbaren Pfad. HQ und R&D
waren dagegen als aktuelle `start_run`-LegalActions erreichbar. Ihre normalen
Informationsquoten lagen mit `gain_credits_first` bei −60 und −55. D301 bis
D304 wählten deshalb vier Basis-Credits; unmittelbar danach avancete und
scorete die Corp die Remote-Agenda zum Sieg.

Der bestehende Owner `runner.pressure_central` erkennt nun genau diesen
side-sicheren P2-Fall: Runner-Matchpoint, öffentlich terminal verdächtige
Remote, jede aktuelle Route zu dieser Remote unerreichbar sowie eine
aktuelle, nicht negativ finanzierte HQ- oder R&D-Runquote. Weder
`runner.contest_remote` noch ein Resolver wählen dabei den Zentralserver.
Der Pressure-Plan bindet weiterhin die aktuelle LegalAction, Root, Step und
Executor; ohne terminale Remote bleibt eine negative Zentralquote gesperrt.

Im exakten Replay `match_d5c9b82059f95ae8` und im finalen
`match_37e62db46c8d6d1a` wählt D301
`runner.start_run.rd` unter
`plan:runner.pressure_central:central%3Ard`, P2 und
`pressure_rd_access`. Nach diesem erfolglosen Zugriff nutzt D320 auch die
verbleibende HQ-Chance. Die Corp gewinnt weiterhin regulär: Der Fix stellt
die einzige legale Gewinnchance her, er erfindet keinen Agenda-Treffer.

### SP-082 – zweite Paarung mit fehlender langsamer Scorekonversion

Seed 3 verdichtet den bereits offenen Scoreplan-Verdacht unabhängig. Die Corp
erreicht bis D391 vier Credits, nur einen Agendapunkt und sechs Karten im
R&D; fünf Agenden liegen auf HQ. `remote_1` trägt vier unrezzte ICE, aber keine
Root-Karte. Bis D447 wächst der Server auf fünf ICE, während das R&D leer
wird. Der Scoreplan weist für die vorhandene Remote weiterhin
`corp_score_protection_required`, für neue Remotes hohe Fundinglücken und
keinen zugelassenen Scoreparent aus. Die Corp nimmt weiter P6-Credits und
verliert durch Deckout.

Das ist dieselbe Fähigkeit wie SP-082, aber noch kein klarer Einzelpatch:
Keine frühere konkrete Install-/Schutz-/Advance-Linie ist mit vollständiger
LegalAction-, Kosten-, Contest- und Mehrzugquote als dominant belegt. Die
Removal Condition verengt sich daher auf eine exakte generische Mehrzugquote
oder einen zustandsgenauen dominanten Gegenpfad; ein pauschales Freigeben
langsamer Agenden bleibt unzulässig.

## Gewinner-, Verlierer- und Metaanalyse

**Seed 1:** Die Corp gewinnt 8:6 mit fünf Scores. Der Runner startet nach dem
Fix 16 Runs, davon zehn erfolgreich, und stiehlt zwei Agenden. Die beiden
zusätzlichen letzten Zentralruns treffen keine Agenda; danach scoret die Corp
regulär. Der zuvor veränderbare Fehler war die ausgelassene Chance, nicht der
anschließende Zufallsausgang.

**Seed 2:** Die Corp gewinnt 7:4 mit zwei Scores. Der Runner erzielt elf
erfolgreiche von zwölf Runs und stiehlt drei Agenden. Eine konkrete bessere
letzte LegalAction-Linie ist nicht belegt; Tempo und Agendareihenfolge erklären
die Niederlage hinreichend.

**Seed 3:** Der Runner gewinnt durch Corp-Deckout bei 5:1 Agendapunkten. Der
Runner startet 15 Runs, erreicht fünf Zugriffe und stiehlt drei Agenden. Die
Corp scoret nur einmal und verbringt den langen Schlussabschnitt mit
Defense-Installationen und 73 Credit-Aktionen. Das verdichtet SP-082, trägt
aber mangels vollständiger dominanter Mehrzuglinie keinen weiteren Fix.

Über die Serie gewinnt die Corp 2:1. Die Ergebnisse trennen einen klaren
terminalen Runner-Ownershipfehler von einer weiter offenen strategischen
Corp-Horizontfrage.

## Verifikation

- roter Ownership-/Verhaltenstest für SP-083, danach grün;
- Gegenprobe: eine negative Zentralquote ohne terminale Remote bleibt beim
  Economy-Plan;
- 272/272 Tests in `plan-first-live-runtime.test.ts` und
  `runner-terminal-contest-threat.test.ts` grün;
- exakter Seed-1-Replay mit D301 R&D und D320 HQ;
- finaler Drei-Seed-Replay: 974/974, `FLAGS=0`, vollständige getrennte
  Eventhistorien einschließlich Terminalzustand;
- unveränderte Autorität: `runner.pressure_central` wählt Server und
  LegalAction, `runner.contest_remote` bewertet nur die blockierte Remote,
  Choice-Resolver bleiben unberührt.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
