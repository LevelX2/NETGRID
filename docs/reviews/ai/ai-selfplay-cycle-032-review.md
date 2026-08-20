# KI-Selbstspielzyklus 032 – bezahlbare Score-Remotes und langsame Konversion

Stand: 2026-08-20
Status: drei vollständige finale Realpfad-Partien; SP-006 und SP-082 durch
eine unabhängige Paarung verdichtet; kein generischer Fix freigegeben

## Reproduktionsvertrag

- Auswahlseed: `74ad915762a047afb88a98f04267e899`
- Runner: **Purge Window**, 45 Karten,
  `standard_standard_runner_purge_window_1.0.0`, `fnv1a:013046b6`
- Corp: **Mumie**, 45 Karten und 18 Agendapunkte,
  `standard_standard_corp_mph465dv_1.0.0`, `fnv1a:11275aa4`
- Spielseeds: `selfplay-032-501a7f0114a1a9ebb3bfc04a18b650c6`,
  `selfplay-032-49c745061350e2869a4a0e15c96d5176` und
  `selfplay-032-bb3f6de23cd04373e2179cb123c249b2`
- Ausgangsstand: `e065e72e70a9ad4eea840f890224b3620e79b6d3`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Worktree-Port 8911 und den ausdrücklich
gesetzten SQLite-Dateien `netgrid-selfplay-032-036.sqlite` und
`netgrid-accounts-032-036.sqlite`. Standardports, Hauptinstanz und Datenbank
des primären Checkouts blieben unangetastet.

## Ergebnis wie im Programm

| Partie | Endergebnis | Agendapunkte | Ende | Entscheidungen |
| ------ | ----------: | ------------: | ---- | --------------: |
| Seed 1 | Runner **10 – 0** Corp | **6:0** | Corp-Deck leer | 416 |
| Seed 2 | Runner **10 – 0** Corp | **7:0** | Agendapunkte | 72 |
| Seed 3 | Runner **10 – 2** Corp | **7:2** | Agendapunkte | 202 |

Finale Match-IDs und StateHashes:
`match_de98d26640e17048` / `fnv1a:353dacec`,
`match_e381862c39499675` / `fnv1a:d9271992` und
`match_cec0d8b656f9517c` / `fnv1a:40b32107`.

## Vollständiger Decision-Denominator

690/690 Entscheidungen und Traces sind genau einmal vorhanden: 416, 72 und
202, ausschließlich `ai-decision-trace-v2`. Die getrennten Eventpässe
enthalten 417, 73 und 203 Events einschließlich des jeweiligen
Terminalzustands. `FLAGS=0`: keine Lücken, Duplikate, Fallbacks, Timeouts,
Auswahlmismatches, Engine-Rejections oder fehlenden Auditsektionen.

684 Entscheidungen sind unter dem jeweils sichtbaren Zustand plausibel.
Sechs ausgewählte Corp-Fenster sind strategisch prüfbedürftig: Seed 1 D358
und D397 wegen wiederholtem Score-Support ohne rechtzeitige Konversion, Seed
2 D27, D46 und D63 sowie Seed 3 D192 wegen der öffentlich bezahlbaren
Score-Remote. Die dazugehörigen Engine-Fortsetzungen und Runner-Zugriffe sind
regelkonform und werden nicht zusätzlich als verdächtig gezählt.

Insgesamt gab es 34 Runstarts, 23 erfolgreiche Runs, zehn Agenda-Steals und
einen Corp-Score.

## Findings und Clusterkorrelation

### SP-084 – reife Score-Remote trotz öffentlich sofortigem Zugriff

Seed 2 installiert die Corp in D27, D46 und D63 nacheinander drei Agenden in
`remote_1`. Der Scoreplan zertifiziert denselben Server jeweils als
`corp_engine_certified_mature_remote_score_install`. Der Runner startet in
D30, D50 und D67 unmittelbar den Contest und stiehlt in D38, D56 und D72.
Beim ersten Zugriff rezzt die Corp beide **Ball and Chain**. Jede Schicht
erzeugt exakt zwei Credits Begegnungskosten; der Runner erreicht die Agenda
mit zwei Credits Rest. Bei den späteren, bereits vollständig öffentlichen
Serverzuständen reichen drei beziehungsweise drei Runner-Credits ebenfalls
für den unmittelbaren Zugriff.

Seed 3 liefert zugleich notwendige Gegen-Evidence. Derselbe Serveraufbau hält
eine früh installierte **Political Coup** bis zum Corp-Score in D49. Erst die
späte **Corporate Coup** aus D192 wird bei Runner-Matchpoint und vier Credits
sofort über beide rezzten Schichten erreicht und in D202 gestohlen. Damit ist
das Risiko wiederholt und exakt gequotet, aber nicht jede Nutzung dieses
Servers grundsätzlich falsch.

SP-084 verdichtet daher SP-006, trägt aber noch keinen Einzelpatch. Für eine
generische Freigabe fehlen der vollständige Vergleich zu legalen
Funding-/Defense-/Wartepfaden, der Wert des sofortigen Scoretempos und eine
zustandsgenaue Grenze, die den erfolgreichen Seed-3-Pfad erhält.

### SP-082 – dritte unabhängige Paarung mit langsamer Scorekonversion

Seed 1 erreicht spät fünf Agenden auf HQ, darunter mehrere Vier- bis
Sechs-Advance-Agenden. D358 und D397 installieren weitere Score-Unterstützung
in die vorbereitete `remote_2`; der gebundene Parent für **Political Coup**
bleibt wegen Schutz- und Mehrzugrisiken jedoch nicht scorebereit. Bei leerem
R&D nimmt die Corp in D411 noch einen Basis-Credit und verliert durch
Pflichtziehung.

Das bestätigt die Fähigkeit hinter SP-082 unabhängig mit einem dritten Deck.
Es belegt weiterhin keinen früheren dominanten Pfad: Die Trace-Evidence nennt
für die alternativen Agenden fehlenden Schutz, fehlende Fundingreserve oder
keinen zugelassenen Parent. Die Removal Condition bleibt eine vollständige
Mehrzugquote statt pauschaler Freigabe langsamer Agenden.

## Gewinner-, Verlierer- und Metaanalyse

**Seed 1:** Der Runner gewinnt nach 17 Runs, neun erfolgreichen Zugriffen und
vier Steals durch Corp-Deckout. Bei sechs Agendapunkten nutzt er den sicheren
Pflichtzieh-Horizont; ein riskanterer letzter Run ist nicht nötig. Die Corp
investiert spät in Score-Support, bekommt die fünf HQ-Agenden aber nicht mehr
regel- und risikokonform in eine vollständige Linie.

**Seed 2:** Der Runner gewinnt nach fünf Runs, drei Erfolgen und drei Steals
7:0. Alle drei Agenda-Installationen werden im direkt folgenden Runner-Zug
konvertiert. Das ist die stärkste Evidence für SP-084.

**Seed 3:** Der Runner gewinnt nach zwölf Runs, elf Erfolgen und drei Steals
7:2. Die Corp beweist mit einem regulären Score, dass der Serveraufbau nicht
wertlos ist; die spätere Nutzung bei Runner-Matchpoint ist jedoch öffentlich
sofort erreichbar. Diese Gegen-Evidence verhindert einen überbreiten Fix.

Über die Serie gewinnt der Runner 3:0. Das Matchup zeigt erhebliche
Zugriffseffizienz gegen die wiederholte Score-Remote, trennt aber einen
strategischen Risikoverdacht klar von einem Engine- oder LegalAction-Fehler.

## Verifikation und Abschlussentscheidung

- 690/690 Entscheidungen und 693 Events vollständig analysiert;
- alle drei Terminalzustände und StateHashes persistiert;
- exakte Run-Kosten der kritischen Score-Remotes aus den Engine-Fortsetzungen
  rekonstruiert;
- SP-006 einschließlich erfolgreicher Gegen-Evidence gemeinsam neu bewertet;
- SP-082 durch dritte unabhängige Deckpaarung verdichtet;
- kein Fix: Es fehlt für beide Cluster weiterhin ein belegter generischer,
  ownership-konformer Alternativpfad, der die Gegen-Evidence erhält.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
