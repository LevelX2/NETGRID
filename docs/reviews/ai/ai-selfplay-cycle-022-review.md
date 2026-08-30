# KI-Selbstspielzyklus 022 – exakte Run-End-Fähigkeit bleibt ownerlos

Stand: 2026-08-20
Status: generische Engine-Semantik und bestehende Defense-Ownership behoben und im Drei-Seed-Realpfad verifiziert

## Reproduktionsvertrag

- Auswahlseed: `cf17a3e07b384bcc9046f6998bf1a179`
- Runner: **Purge Window**, 45 Karten,
  `standard_standard_runner_purge_window_1.0.0`, `fnv1a:013046b6`
- Corp: **Classic Corp - Remote Lab Deflection**, 45 Karten,
  `standard_standard_classic_corp_remote_lab_deflection_2026_07_01_1.0.0`,
  `fnv1a:6e4ddcbf`
- Spielseeds:
  - `selfplay-022-cb14e06e2601d5a91b446b2d8b2e88fd`
  - `selfplay-022-01313b3bb102ddac98be8b0fd657886a`
  - `selfplay-022-0b369846ffd6e1d8f3df7186697bccc0`
- Ausgangsstand: `0bb5720915e02f1fd40a6b944d27ba4d65af9fff`
- Auswahl: SHA-256 über `seed:side` modulo 24 Runner- beziehungsweise
  23 Corp-Kandidaten
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Port 8912 und derselben fortgeschriebenen
SQLite-Evidence des parallelen Worktrees. Es wurde keine Datenbank gelöscht.

## Ergebnis wie im Programm

| Partie | Standarddecks                                                   |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | --------------------------------------------------------------- | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | **Purge Window** gegen **Classic Corp - Remote Lab Deflection** | Runner **10 – 0** Corp |      **8:0** | Agendapunkte |            163 |
| Seed 2 | **Purge Window** gegen **Classic Corp - Remote Lab Deflection** | Runner **10 – 3** Corp |      **7:3** | Agendapunkte |            188 |
| Seed 3 | **Purge Window** gegen **Classic Corp - Remote Lab Deflection** | Runner **10 – 1** Corp |      **8:1** | Agendapunkte |            226 |

Die finalen Match-IDs lauten `match_b011b722fc6bb947`,
`match_746a33e063e6fc1a` und `match_b153b34d263aeb09`.

## Vollständiger Decision-Denominator

Alle 577 finalen Entscheidungen wurden vollständig geladen und genau einmal
klassifiziert:

- Seed 1: Indizes 1 bis 163;
- Seed 2: Indizes 1 bis 188;
- Seed 3: Indizes 1 bis 226;
- ausschließlich `ai-decision-trace-v2`;
- LegalActions, Engine-Evidence, actor-private Analysesnapshots und
  Checkpoint-Capture 577/577 persistiert;
- keine Lücke, kein Duplikat, Fallback, Timeout, Auswahlmismatch,
  Engine-Rejection oder fehlende Auditsektion;
- 42 Runstarts, 38 erfolgreiche Runs, elf gestohlene und drei von der Corp
  gescorte Agenden.

Der Ausgangslauf enthält 507 Entscheidungen beziehungsweise Fehlversuche.
Seed 3 endet in D156 fail-closed; der private
`ai-decision-failure-attempt-v1` benennt die produktive Data-Fort-Remapping-
Action als ownerlos. Die finalen 577 Entscheidungen sind plausibel. Die acht
Unknown-Tags in Seed 2 sind vier verschachtelte Evidence-Formen desselben
konservativen Remote-Subset-Assessments. Der Scoreowner avanciert und scoret
seine belegten Linien dennoch; es ist kein zweiter besserer Pfad belegt.

## SP-060 – Engine-exakte Run-End-Fähigkeit fehlt im Defense-Owner

Im Ausgangsspiel `match_103f7ed6b71e9afa` scoret die Corp Data Fort
Remapping, der Runner greift anschließend Remote 1 an und die Engine
veröffentlicht in D156 die exakte, kostenlose Fähigkeit zum Ausgeben eines
Remap-Counters und Beenden des Runs. Die LegalAction war produktiv, vollständig
gebunden und besaß keine Ziele oder Choices. Die AI-Semantik sah jedoch nur
eine ungelöste generische Kartenfähigkeit; der Turn-Planning-Cutover konnte
sie keinem Modul zuordnen und brach mit `missing_plan_module_coverage` ab.

Die Engine veröffentlicht für eine CardSpec-Fähigkeit nur dann
`cardImplementationEffectKind: end_run`, wenn sie exakt einen `end_run`-
Effekt besitzt. Die AI-Projektion bildet dieses Engine-Fakt auf
`run.end_by_corp` ab. Der bestehende Plan `corp.defend_servers` erkennt damit
die exakt aktuelle LegalAction als produktive Verteidigungsroute. Es entsteht
kein neuer Plan, Resolver, Target- oder Choice-Owner; Root, Leaf, Step,
Executor und Action-ID bleiben beim vorhandenen Defense-Portfolio.

Im finalen Seed 3 ist die Actionfolge bis D155 identisch. D156 rezzed die Corp
Glacier und D157 beendet sie den Remote-Run mit der exakt gebundenen
Remapping-Fähigkeit unter `corp.defend_servers`. Die Partie läuft danach bis
D226 regulär weiter. Seeds 1 und 2 bleiben über 163 beziehungsweise 188
Entscheidungen vollständig action-identisch. Abweichende StateHashes in den
beiden identischen Läufen folgen aus dem zusätzlichen strukturierten
LegalAction-Fakt, nicht aus einer veränderten Actionwahl.

## Gewinneranalyse

**Seed 1:** Der Runner beginnt 14 Runs, 13 davon erfolgreich, und stiehlt vier
Agenden zum 8:0. Die Corp scoret keine Agenda. Die vollständige Actionfolge ist
vorher und nachher identisch; SP-060 ist für diese Niederlage nicht kausal.

**Seed 2:** Der Runner gewinnt 7:3 nach 15 Runs und 13 erfolgreichen Runs. Die
Corp konvertiert zwei eigene Scorelinien, während der Runner drei Agenden
stiehlt und den letzten Punkt über eine gebundene Kartenroute erreicht. Die
acht Unknown-Tags blockieren keine aktuelle Score- oder Defense-Action.

**Seed 3:** Die Corp scoret Data Fort Remapping in D152 und nutzt dessen
Counter in D157 korrekt, kann aber die späteren Zentral- und Remotezugriffe
nicht vollständig stoppen. Der Runner stiehlt vier Agenden und beendet die
Partie in D226 mit 8:1. Der nun ausgeführte Defensepfad widerlegt einen
verbleibenden Ownerfehler in diesem Fenster, garantiert aber keinen Sieg.

## Verliereranalyse und Metaebene

1. Alle drei Corp-Niederlagen entstehen trotz unterschiedlicher eigener
   Scorekonversion: 0, 3 und 1 Agendapunkte. Eine pauschale Score- oder
   Economy-Regel folgt daraus nicht.
2. SP-060 behebt ausschließlich den belegten Laufzeitabbruch. Der bestehende
   Defenseplan erhält ein exaktes Engine-Fakt und entscheidet weiterhin selbst
   über Action und Zeitpunkt.
3. Die Änderung ist fail-closed: Mehrdeutige Mehrfacheffekte erhalten kein
   `end_run`-Zertifikat; Actions mit Ziel- oder Choice-Anforderungen werden
   nicht über die enge direkte Route materialisiert.
4. Zwei vollständig action-identische Gegenläufe und der identische Präfix im
   betroffenen Seed grenzen die Wirkung auf das reproduzierte Fenster ein.

## Verifikation

- Engine-Regression 6/6 grün;
- fokussierter AI-Ownership-Test grün; Action-ID, Root, Leaf, Route und
  `corp.defend_servers` bleiben gebunden, Coverage 100 Prozent;
- Engine-Paket-Typecheck grün;
- AI-Paket-Typecheck erreicht ausschließlich die fünf bekannten
  Baselinefehler: optionales `appliesToRunner` und vier fehlende
  CardSpec-Migrationsreports;
- die breite `plan-first-live-runtime`-Datei erreicht 239/261; die 22 bereits
  vor diesem Fix bekannten, unabhängigen Baselinefehler bleiben getrennt;
- drei finale Realpfad-Partien mit 577/577 auditierten Entscheidungen;
- Seeds 1 und 2 action-identisch, Seed 3 identischer Präfix bis D155 und
  erwartete Fortsetzung mit Remap-Action in D157.

Verdichtete Evidence steht in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
