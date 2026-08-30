# KI-Selbstspielzyklus 030 – exakte Choice-Bindung für Rez-Variante und Programmopfer

Stand: 2026-08-20
Status: drei vollständige finale Realpfad-Partien; SP-073 und SP-074 behoben und verifiziert

## Reproduktionsvertrag

- Auswahlseed: `91eb84ecae0a413fbc6b8aba8af976d0`
- Runner: **R&D Interface Dig**, 45 Karten,
  `standard_standard_runner_rnd_interface_dig_1.0.0`, `fnv1a:a19514b7`
- Corp: **Fast Advance, Baby**, 45 Karten,
  `standard_standard_corp_mr96xg94_1.0.0`, `fnv1a:24e3bcd4`
- Spielseeds: `selfplay-030-e725c0a67e3f419eafc147cae2d28bea`,
  `selfplay-030-01ccd55b258744afb833138240cb3a9f` und
  `selfplay-030-5bfcd5a63ccb4df0983e0bbb1fe813b1`
- Ausgangsstand: `b09520e43611969da3834704c3f942d5a36aa45f`
- Auswahl: SHA-256 über `seed:side` modulo 24 Runner- beziehungsweise
  23 Corp-Kandidaten
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf Port 8912 und der fortgeschriebenen isolierten
SQLite-Evidence; keine Datenbank wurde gelöscht.

## Ergebnis wie im Programm

| Partie |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | Corp **10 – 6** Runner |      **7:6** | Agendapunkte |            207 |
| Seed 2 | Corp **10 – 5** Runner |      **8:5** | Agendapunkte |            347 |
| Seed 3 | Runner **10 – 5** Corp |      **7:5** | Agendapunkte |            341 |

Finale Match-IDs und StateHashes:
`match_186684f098822702` / `fnv1a:9def0bf0`,
`match_2c3412b23bf2cdc0` / `fnv1a:2086b3f5` und
`match_3f452dfedbe34ded` / `fnv1a:c99e9850`.

## Vollständiger Decision-Denominator

Alle 895 Entscheidungen wurden genau einmal klassifiziert: 207, 347 und 341
Traces, ausschließlich `ai-decision-trace-v2`. LegalActions,
Engine-Evidence, actor-private Analysesnapshots und Checkpoint-Capture sind
895/895 persistiert. `FLAGS=0`: keine Lücke, Duplikate, Fallbacks, Timeouts,
Auswahlmismatches, Engine-Rejections, Unknown-Assessments oder fehlenden
Auditsektionen. Der getrennte, unscoped Eventpass enthält 208, 348 und 342
Events und jeweils den terminalen Zustand. Insgesamt: 36 Runstarts, 29
erfolgreiche Runs, acht Steals und zehn Corp-Scores.

## Findings und exakte Replays

### SP-073 – Security Purge verlor die planseitig gewählte Rez-Variante

Im ursprünglichen dritten Seed brach `match_3b2c2cff025ac579` an D234 ab. Der
Plan `corp.defend_servers` hatte die Security-Purge-Fortsetzung bereits
gewählt, doch der Choice-Wert enthielt nur Karte und Server. Bei variablen
Rez-Kosten konnte der Resolver deshalb die konkrete Engine-zertifizierte
Rez-Variante nicht mehr eindeutig binden.

Die LegalAction-Choice-Werte tragen nun `cardId`, `serverId` und
`rezVariantId`. Der Planparser und der rein payload-vervollständigende
Choice-Pfad bewahren genau diese Variante; Action-ID, Root und Executor
bleiben beim bestehenden Defense-Owner. Im finalen Seed scoret D232 Security
Purge, D233 löst die Runner-Choice auf und D234 rezzt die exakt gebundene
Variante unter `corp.defend_servers`.

### SP-074 – Install-Choice verlor das gebundene Programmopfer

Nach SP-073 legte derselbe Seed einen zweiten unabhängigen Fehler offen.
`match_7dd4daf50f2c89c9` brach im Programm-Trash-vor-Install-Fenster ab: Der
Rig-Plan hatte die Installation samt Opfer gewählt, der spätere
Choice-Resolver versuchte die Strategie aber erneut zu bestimmen und fand
keine belastbare Window-Herkunft.

Die planseitige Sacrifice-Bewertung bindet nun die exakten installierten
Programm-IDs in `ResidentSelectedActionOrigin`. Der Window-Resolver validiert
unmittelbaren Planstand, Root, Executor, Action und Choice fail-closed; der
Choice-Resolver ordnet ausschließlich die gebundenen Karten auf die konkreten
Options-IDs ab. Im finalen `match_3f452dfedbe34ded` wählt D236 unter
`runner.rig_and_coverage` die Installation, D237 löst dasselbe Planfenster mit
exakt `card_runner_onr_v1_059_self-modifying-code_2` auf, und die Partie endet
regulär mit einem Runner-Sieg.

## Gewinner-, Verlierer- und Metaanalyse

**Seed 1:** Fast Advance gewinnt knapp 7:6. Der Runner absolviert neun von
neun Runs erfolgreich und stiehlt drei Agenden; die Corp schließt dennoch
drei Scorelinien und erreicht in D207 zuerst sieben Punkte. Die Niederlage
ist eine knappe Score-/Zugriffsfolge, kein belegter ausgelassener Pfad.

**Seed 2:** Die Corp gewinnt 8:5 mit vier Scores. Der Runner stiehlt zwei
Agenden bei acht erfolgreichen von zehn Runs. Weder ein einzelner zentraler
Zugriff noch eine konkrete Defense-Alternative dominiert den terminalen Pfad.

**Seed 3:** Der Runner gewinnt 7:5 nach zwölf erfolgreichen von 17 Runs und
drei Steals. Die Corp scoret drei Agenden. Die beiden vormals abbrechenden
Choice-Fenster sind vollständig repariert; anschließend ist keine weitere
ownerlose oder sicher bessere LegalAction belegt.

Über die Serie gewinnt die Corp 2:1. Matchup, Agenda-Reihenfolge und
Zugriffstreffer erklären die Ergebnisstreuung. Veränderbar waren ausschließlich
die verlorenen exakten Bindungen der bereits gewählten Planaktionen; daraus
folgt kein neuer Planner, Resolver-Owner oder strategischer Fallback.

## Verifikation

- SP-073: fokussierte LegalAction-/Plan-/Choice-Regressionsabdeckung und
  exakter Seed-3-Replay;
- SP-074: vier thematische Dateien mit 361/361 grünen Tests, darunter
  Plan-Owner, Window-Origin und Choice-Payload;
- funktionale Commits `a40882265`, `894cd4172` und `48ece95ac`;
- finaler Drei-Seed-Replay: 895/895, `FLAGS=0`, vollständige getrennte
  Eventhistorien einschließlich Terminalzustand;
- Change Compass, AI-README und Planning-Architektur bleiben unverändert:
  die bestehende Ownership wird enger abgesichert, nicht erweitert.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
