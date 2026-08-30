# KI-Selbstspielzyklus 033 – funktionierender Punish-Pfad, offener Score-Stau

Stand: 2026-08-20
Status: drei vollständige finale Realpfad-Partien; erfolgreiche
Flatline-Gegenprobe; SP-082 mit einer vierten Deckpaarung verdichtet

## Reproduktionsvertrag

- Auswahlseed: `f791555e70da4867b3687d3313ec5dcc`
- Runner: **Inside Forgery Loop**, 45 Karten,
  `standard_standard_runner_inside_forgery_loop_1.0.0`, `fnv1a:402af487`
- Corp: **Neon Guillotine**, 45 Karten und 14 Agendapunkte,
  `standard_standard_corp_neon_guillotine_1.0.0`, `fnv1a:4231f37d`
- Spielseeds: `selfplay-033-45b4cd2e75b99a398ccae6a9ace0ee92`,
  `selfplay-033-cb2edf3105e511b64ba23bedfaadd4a2` und
  `selfplay-033-b022492d5b9c5bc99057e2f8e83fd6a9`
- Ausgangsstand: `6906fc3fe3a1e6ff86c2a654c25988c30d887a17`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Worktree-Port 8911 und der für den
Fünferblock gesetzten isolierten SQLite-Serie. Standardports und Datenbanken
des primären Checkouts blieben unangetastet.

## Ergebnis wie im Programm

| Partie |            Endergebnis | Agendapunkte | Ende           | Entscheidungen |
| ------ | ---------------------: | -----------: | -------------- | -------------: |
| Seed 1 | Runner **10 – 0** Corp |      **5:0** | Corp-Deck leer |            361 |
| Seed 2 | Corp **10 – 5** Runner |      **0:5** | Flatline       |            165 |
| Seed 3 | Runner **10 – 0** Corp |      **9:0** | Agendapunkte   |            259 |

Finale Match-IDs und StateHashes:
`match_f9651a5892f72b0c` / `fnv1a:e3ee1573`,
`match_f43149ba017677ce` / `fnv1a:67aecb20` und
`match_949a4bdd16c62e8f` / `fnv1a:513edfee`.

## Vollständiger Decision-Denominator

785/785 Entscheidungen und Traces sind genau einmal vorhanden: 361, 165 und
259, ausschließlich `ai-decision-trace-v2`. Die getrennten Eventpässe
enthalten 362, 166 und 260 Events einschließlich Terminalzustand.
`FLAGS=0`: keine Lücken, Duplikate, Fallbacks, Timeouts,
Auswahlmismatches, Engine-Rejections oder fehlenden Auditsektionen.

767 Entscheidungen sind unter dem sichtbaren Zustand plausibel. 18
Corp-Basiscredits sind als zusammenhängende Score-Stau-Fenster
prüfbedürftig: Seed 1 D319–D321, D331–D333, D343–D345 und D355–D357 sowie
Seed 3 D195–D197 und D216–D218. Die Entscheidungen sind legal und korrekt
owned; prüfbedürftig ist die kumulierte Mehrzugwahl, nicht ein einzelner
Credit.

Die Serie enthält 45 Runstarts, 38 erfolgreiche Runs, neun Agenda-Steals,
keinen Corp-Score und eine Flatline.

## Findings und Clusterkorrelation

### Funktionsfähige Flatline-Gegenprobe

Seed 2 zeigt den Punish-Pfad ohne Ownership- oder Quote-Lücke. Nach einem
Runzug des Runners mit nur drei Handkarten und fünf Agendapunkten zieht und
installiert die Corp zunächst Defense. In D162 spielt
`corp.execute_punish_sequence` **Chance Observation** als P1-Route. Die
Engine-Choice erzeugt den Tag; D165 spielt unter demselben Owner den
gebundenen Schadensschritt und beendet die Partie durch Flatline.

Das ist positive Gegen-Evidence zu den offenen SP-019-/SP-076-Fragen. Sie
widerlegt deren frühere unvollständige oder zu späte Punish-Zustände nicht,
belegt aber, dass der vorhandene Owner eine vollständig gequotete aktuelle
Tag-Schaden-Linie tatsächlich konvertiert. Es entsteht kein neues Finding.

### SP-082 – Punish-Deck bleibt in zwei Seeds ohne Scorekonversion

Seed 1 hält bei vier verbleibenden R&D-Karten vier Agenden, 19 Credits und
eine leere Root hinter fünf ICE in `remote_1`. Trotzdem bleiben alle
Agenda-Installationen wegen `corp_score_protection_required:remote_1` oder
fehlendem zugelassenen neuen Parent ausgeschlossen. Zwölf der letzten
Credit-Entscheidungen erhöhen die Liquidität auf 31; die Corp verliert 0:5
durch Pflichtzieh-Deckout.

Seed 3 erreicht vor dem ersten Agenda-Steal bereits 29 bis 32 Credits, danach
35 Credits bei einem Runner-Punkt und 37 Credits bei sechs Runner-Punkten.
Die Corp hält weiterhin Agenden, schützt aber Zentralen und die Punish-Remote,
ohne eine Scorelinie zu eröffnen. Der Runner stiehlt insgesamt neun Punkte.

Damit liegt SP-082 nun in vier unterschiedlichen Corp-Decks vor. Ein
generischer Patch ist trotzdem noch nicht freigegeben: Im selben Deck gewinnt
Seed 2 korrekt über den primären Flatline-Plan, und die kritischen Scoretraces
weisen weiterhin konkrete Schutz- oder Parentlücken aus. Die nächste
Verdichtung muss den kumulierten Wert des Wartens gegen eine vollständig
gequotete Install-/Advance-/Contest-Linie und gegen den Punish-Horizont
stellen.

## Gewinner-, Verlierer- und Metaanalyse

**Seed 1:** Der Runner stiehlt früh fünf Punkte und gewinnt nach 15 Runs,
zehn erfolgreichen Zugriffen und drei Steals durch Deckout. Die Corp baut
eine fünflagige Punish-Remote und sammelt 31 Credits, findet aber weder eine
vollständige Tag-Kill- noch Scorelinie. Der veränderbare Verdacht ist der
kumulierte Score-Stau; der einzelne Schutzentscheid bleibt begründet.

**Seed 2:** Die Corp erzielt keinen Agendapunkt, gewinnt aber planmäßig durch
Flatline. Der Runner erreicht bei 17/17 erfolgreichen Runs fünf Punkte und
endet mit drei Handkarten. Die Tag-Schaden-Sequenz in D162–D165 ist legal,
vollständig und ownership-konform.

**Seed 3:** Der Runner gewinnt 9:0 mit elf erfolgreichen von 13 Runs und vier
Steals. Die Corp baut Punish-Infrastruktur und hohe Liquidität auf, erhält
aber keine terminale Punish-Quote; der Runner entfernt den späten Tag und
stiehlt anschließend die letzte Agenda. Auch hier fehlt noch ein belegter
früherer dominanter Einzelpfad.

Über die Serie gewinnt der Runner 2:1. Das Ergebnis trennt einen nachweislich
funktionierenden Primärplan des Corp-Decks von der weiterhin offenen Frage,
wann dasselbe Deck seine Score-Nebenroute früher materialisieren muss.

## Verifikation und Abschlussentscheidung

- 785/785 Entscheidungen und 788 Events vollständig analysiert;
- alle drei Terminalzustände und StateHashes persistiert;
- vollständige P1-Flatline-Sequenz einschließlich Engine-Choice geprüft;
- SP-019 und SP-076 mit positiver Gegen-Evidence neu bewertet;
- SP-082 durch vierte unabhängige Corp-Deckpaarung verdichtet;
- kein Fix: Die aktuelle Evidence belegt noch keine generische Mehrzuggrenze,
  die Scoretempo, Schutzbedarf und primären Punish-Plan korrekt trennt.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
