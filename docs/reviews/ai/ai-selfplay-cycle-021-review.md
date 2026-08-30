# KI-Selbstspielzyklus 021 – optionale Stealth-Folge verliert ihre Null-Evidence

Stand: 2026-08-20
Status: generische Engine-Quote behoben und im Drei-Seed-Realpfad verifiziert

## Reproduktionsvertrag

- Auswahlseed: `3b66cd6d2a216631ff6e89c85bfc1190`
- Runner: **Lucidrine Shell Traders**, 45 Karten,
  `standard_standard_runner_lucidrine_shell_traders_1.0.0`,
  `fnv1a:45e17bad`
- Corp: **Tycho Ice Stack**, 45 Karten,
  `standard_standard_corp_tycho_ice_stack_1.0.0`, `fnv1a:32e3f739`
- Spielseeds:
  - `selfplay-021-7ab4690d51eeb59acee0d485406705ac`
  - `selfplay-021-8073c0460a387341913fd169b6bd02e5`
  - `selfplay-021-41b4548af4399c4e10279fcda2309d62`
- Ausgangsstand: `34c59a1b27c18637fc192f9bda047ebe281d1ac2`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die Partien liefen auf dem isolierten Port 8912 mit unverändert persistenter
SQLite-Evidence. Die Standarddeckauswahl verwendete SHA-256 über `seed:side`
modulo 24 Runner- beziehungsweise 23 Corp-Kandidaten.

## Ergebnis wie im Programm

| Partie | Standarddecks                                         |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | ----------------------------------------------------- | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | **Lucidrine Shell Traders** gegen **Tycho Ice Stack** | Runner **10 – 0** Corp |      **8:0** | Agendapunkte |            217 |
| Seed 2 | **Lucidrine Shell Traders** gegen **Tycho Ice Stack** | Runner **0 – 10** Corp |      **0:8** | Agendapunkte |             92 |
| Seed 3 | **Lucidrine Shell Traders** gegen **Tycho Ice Stack** | Runner **10 – 4** Corp |      **8:4** | Agendapunkte |            334 |

Die finalen Match-IDs lauten `match_ab8e254f6364e919`,
`match_be01185bf8398789` und `match_defd9c6cc2d92735`.

## Vollständiger Decision-Denominator

Alle 643 finalen Entscheidungen wurden vollständig geladen und genau einmal
klassifiziert:

- Seed 1: Indizes 1 bis 217;
- Seed 2: Indizes 1 bis 92;
- Seed 3: Indizes 1 bis 334;
- ausschließlich `ai-decision-trace-v2`;
- LegalActions, Engine-Evidence, actor-private Analysesnapshots und
  Checkpoint-Capture 643/643 persistiert;
- keine Lücke, kein Duplikat, Fallback, Timeout, Auswahlmismatch,
  Engine-Rejection oder fehlende Auditsektion;
- 19 Runstarts, zehn erfolgreiche Runs, vier gestohlene und drei von der
  Corp gescorte Agenden.

Die Klassifikation enthält im Ausgangslauf sieben Finding-Entscheidungen
(Seed 1 D66, D185, D188, D199, D207, D227 und D230) und 659 plausible
Entscheidungen. Im finalen Lauf sind alle 643 Entscheidungen plausibel. Die
vier aufgeführten Unknown-Codes in Seed 3 sind verschiedene, verschachtelte
Evidence-Tags desselben konservativen Remote-Subset-Assessments. Sie bleiben
fail-closed; der exakte `corp.score_agenda`-Pfad avanciert und scoret dennoch
in D102–D105. Damit ist weder eine Ownerlücke noch ein besserer legaler Pfad
belegt.

## SP-059 – optionale Stealth-Folge gilt trotz sicherer Null als unbekannt

Im Ausgangsspiel `match_f14abdef714aee29` besitzt der Runner Pile Driver,
aber keine installierte Stealth-Karte und somit exakt null gehostete
Stealth-Credits. Trotzdem setzte die Engine jede bezahlbare Wall-Breakquote
mit `postBreakStealthLoss` auf `visible_runner_break_projection_unknown`.
`corp.defend_servers` lehnte deshalb in D66 und später in der entscheidenden
R&D-Sequenz mehrere legal bezahlbare Rez-Routen ab. Die Corp hielt dort 18
bis 21 Credits; der Runner griff mit R&D Interface bei vier Punkten an und
stahl auf 8:0.

Die Engine-Quote liest jetzt die sichtbaren installierten Stealth-Quellen und
zertifiziert die direkte Breakroute nur dann, wenn die Folge ausdrücklich
optional ist, einen strukturierten Stealth-Quellmodus besitzt und die
verfügbaren Stealth-Credits exakt null sind. Sobald mindestens ein Stealth-
Credit vorhanden ist oder die Semantik unvollständig bleibt, gilt weiterhin
fail-closed `unknown`. Das ist eine Faktkorrektur in der Rules Engine; weder
`corp.defend_servers` noch ein Resolver erhalten eine neue Entscheidung.

Im finalen Seed 1 ist die Actionfolge bis D65 identisch. D66 rezzed die Corp
nun Data Wall über denselben `corp.defend_servers`-Root, Leaf und die exakt
gebundene LegalAction. Später rezzed sie auch Keeper und Wall of Static auf
R&D. Die Partie bleibt ein Runner-Sieg, endet aber nach 217 statt 240
Entscheidungen und enthält nur noch einen Rez-Pass statt der fehlerhaften
Serie. Seeds 2 und 3 behalten ihre vollständige Auswahlfolge über 92
beziehungsweise 334 Entscheidungen unverändert.

## Gewinneranalyse

**Seed 1:** Der Runner stiehlt Tycho Extension in D116 aus der vorbereiteten
Remote und in D217 über R&D. Die Corp rezzed nach dem Fix sechs ICE, erzielt
aber keinen Agendapunkt. Der 8:0-Sieg belegt keinen verbleibenden Quote- oder
Planfehler: Die exakten Walls werden nun bewertet und ausgewählt, der
finanzierte Runner kann die konkret sichtbaren Schichten weiterhin brechen.

**Seed 2:** Die Corp schützt ihre frühe Scorelinie mit Data Wall, Filter,
Shock-R und Keeper und scoret Tycho Extension in D41 und D92. Der Runner
beginnt vier Runs, nur einer ist erfolgreich und keiner erreicht eine Agenda.
Das 8:0 ist eine vollständig ausgeführte Defense-/Score-Konversion.

**Seed 3:** Der Runner stiehlt in D75 vier Punkte, die Corp antwortet in D105
mit vier gescorten Punkten. Nach einer langen Economy- und R&D-Druckphase
stiehlt der Runner in D334 die zweite Tycho Extension zum 8:4. Die identische
Vorher-/Nachher-Auswahlfolge schließt SP-059 als Ursache dieser Niederlage
aus.

## Verliereranalyse und Metaebene

1. Die Corp-Niederlagen in Seeds 1 und 3 unterscheiden sich: Seed 1 verliert
   zwei vierwertige Agenden bei 0 Punkten; Seed 3 konvertiert selbst eine
   vollständige Scorelinie und verliert erst den späten zweiten R&D-Steal.
2. SP-059 korrigiert keine Rezschwelle. Die KI erhält nur die zuvor fehlende
   exakte Engine-Evidence. Kosten-, Server- und Actionbewertung bleiben beim
   bestehenden Defense-Owner.
3. Der Nullfall ist monoton und side-safe. Ein positiver Stealth-Pool könnte
   durch die Folgeauswirkung verändert werden und bleibt deshalb bewusst
   unbekannt, bis die vollständige Konsequenz im Quote-Schema repräsentiert
   ist.
4. Das gemischte 2:1-Ergebnis und die unveränderten Seeds 2/3 sprechen gegen
   eine deckweite Sonderregel für Pile Driver, Walls oder Tycho Ice Stack.

## Verifikation

- roter Engine- und AI-Ownership-Test vor dem Fix;
- Engine-Regression 8/8 grün, einschließlich positivem Stealth-Gegenfall;
- AI-Route/Ownership 41/41 grün; Action-ID, Root, Leaf und
  `corp.defend_servers` bleiben gebunden;
- Engine-Paket-Typecheck grün;
- AI-Paket-Typecheck erreicht nach Beseitigung der lokalen Testtypabweichung
  ausschließlich die fünf bereits bekannten Baselinefehler (optionales
  `appliesToRunner` und vier fehlende CardSpec-Migrationsreports);
- drei finale Realpfad-Partien mit 643/643 auditierten Entscheidungen;
- identische Auswahlfolgen in Seeds 2 und 3, in Seed 1 identischer Präfix bis
  D65 und erwartete Divergenz zur Rez-Action in D66.

Verdichtete Evidence steht in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
