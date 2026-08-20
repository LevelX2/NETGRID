# KI-Selbstspielzyklus 017 – Drei-Seed-Folgezyklus Mit Ansage

Stand: 2026-08-20
Status: drei vollständige Realpfad-Partien ohne neue belegte
KI-Entscheidungslücke; ein Ergebnisstatistik-Widerspruch ist reproduzierbar
fortgeschrieben

## Reproduktionsvertrag

- Auswahlseed: `fd484c588bd54371b698f107fbf9d195`
- Auswahlalgorithmus: SHA-256 über `seed:side`, Modulo der aktiven Kandidaten
- Runner: **Mit Ansage: Der perfekte Coup**, 45 Karten,
  `standard_standard_runner_mit_ansage_der_perfekte_coup_2026_07_09_1.0.0`,
  `fnv1a:40d73253`
- Corp: **Original Speed v1.0**, 55 Karten,
  `standard_standard_corp_original_speed_v10_1.0.0`, `fnv1a:45dc454b`
- Spielseeds:
  - `selfplay-017-02d515cff96f483b8aafdc17b1ac0b2c`
  - `selfplay-017-d160b5635b274a68a2130ebf5ef34ee4`
  - `selfplay-017-0c21b4a3aebd402ca6903048fb65ff44`
- Ausgangsstand: `692a28eaa0315da35b2f76489b1072a44e77ce75`
- Regelprofil: Originalset, Classic und Proteus, `modern_open`, harte KI,
  Detailtrace

Die isolierte Instanz lief auf Port 8912 gegen dieselben persistenten,
nicht geleerten SQLite-Dateien wie Paarung 016. Vor dem Neustart wurde der
eigene Prozessbaum vollständig bestimmt und ausschließlich dieser beendet.
Nach dem Main-Abgleich wurde die neue Lockfile-Abhängigkeit lokal installiert;
Standardports und fremde Prozesse blieben unangetastet.

## Ergebnis wie im Programm

| Partie | Standarddecks                           |            Endergebnis | Agendapunkte | Ende         | Entscheidungen |
| ------ | --------------------------------------- | ---------------------: | -----------: | ------------ | -------------: |
| Seed 1 | **Mit Ansage** gegen **Original Speed** | Runner **10 – 3** Corp |      **7:3** | Agendapunkte |            262 |
| Seed 2 | **Mit Ansage** gegen **Original Speed** | Runner **10 – 3** Corp |      **7:3** | Agendapunkte |            254 |
| Seed 3 | **Mit Ansage** gegen **Original Speed** | Runner **10 – 4** Corp |      **8:4** | Agendapunkte |            255 |

Die Match-IDs lauten `match_3b813bf3dade0d63`,
`match_8a446ad66e82710e` und `match_04886d690d3ff917`.

## Vollständiger Decision-Denominator

Alle 771 Entscheidungen wurden seitenweise und genau einmal geladen:

- Seed 1: Indizes 1 bis 262;
- Seed 2: Indizes 1 bis 254;
- Seed 3: Indizes 1 bis 255;
- ausschließlich `ai-decision-trace-v2`;
- historische LegalActions, Engine-Evidence, actor-private Analysesnapshots
  und Checkpoint-Capture 771/771 vollständig;
- keine Lücke, kein Duplikat, Fallback, Timeout, Auswahlmismatch,
  Engine-Rejection, unbekanntes Assessment oder fehlende Auditsektion;
- 35 Runstarts, neun gestohlene und vier von der Corp gescorte Agenden.

Die im Result-Snapshot angezeigten erfolgreichen Runs sind nicht belastbar:
Das Programm meldet 1, 5 und 3. Die vollständigen actor-private
Run-Snapshots enthalten dagegen zehn, elf und acht verschiedene Run-IDs mit
`successful: true` und Accessphase. Dieser Widerspruch ist als SP-047
fortgeschrieben und wird nicht durch einen Berichtsfallback verdeckt.

## Gewinneranalyse

**Seed 1:** Der Runner stiehlt Corporate War aus HQ, Employee Empowerment aus
der auf drei Counter entwickelten Remote und den letzten Punkt aus Archives.
Zehn erfolgreiche Runpfade aus den vollständigen Snapshots zeigen
kontinuierlichen Zentraldruck; die Corp scoret Main-Office Relocation, bleibt
aber wiederholt bei null bis einem Credit und kann die zweite Remote nicht
abschließen.

**Seed 2:** Die Corp scoret Corporate War früh auf drei Punkte. Der Runner
stiehlt später Employee Empowerment aus der Remote und beendet das Spiel mit
einem Mehrfachzugriff auf R&D, der Main-Office Relocation und Hostile Takeover
liefert. Elf erfolgreiche Runpfade und die bewusste Nutzung von Mehrfachzugriff
passen exakt zur Deckstrategie.

**Seed 3:** Die Corp scoret Hostile Takeover und Employee Empowerment auf
vier Punkte. Der Runner erreicht ebenfalls vier Punkte über zwei HQ-Zugriffe
und stiehlt danach die auf drei Counter entwickelte Tycho Extension aus der
Remote. Der finale Zugriff wird regulär durch den bestehenden
`runner.contest_remote`- und Runfensterplan getragen.

## Verliereranalyse und Metaebene

1. Original Speed konvertiert in allen Seeds mindestens ein Projekt und in
   Seed 3 zwei. Ein pauschaler Scoreplan- oder Decksonderfix ist damit nicht
   belegt.
2. In den Schlussfenstern fehlen der Corp regelmäßig Credits für gleichzeitig
   finanzierbare Zentral- und Remotebreite. Seed 2 zeigt einen ausgewiesenen
   Protection-Funding-Gap von sechs bis sieben Credits; Seed 1 und 3
   verlieren entwickelte Remotes. Das verdichtet SP-040, beweist aber keine
   einzelne frühere LegalAction als dominierend.
3. Der Runner gewinnt über verschiedene Angriffsformen: HQ plus Archives,
   Remote plus R&D-Multiaccess und HQ plus Remote. Die 3:0-Serie ist daher
   keine einzelne wiederholte Auswahlkante, sondern konsistente
   Multiaccess-/Contest-Strategie gegen knappe Corp-Liquidität.
4. Sämtliche Entscheidungen sind klassifiziert und angewendet. Ohne exakten
   besseren Vergleichspfad wäre ein KI-Verhaltenspatch spekulativ; Paarung
   017 schließt deshalb bewusst ohne Codeänderung.

## Neue Idee und Restverdacht

SP-047 trennt künftig angezeigte Resultstatistik von auditierter
Run-Telemetrie. Vor einer Korrektur muss geklärt werden, wann der terminale
Result-Snapshot seine Eventbasis bindet und warum die bereits vorhandene
`accessIndex === 0`-Zählung nur 1/5/3 liefert, obwohl persistierte Events und
Run-Snapshots mehr erfolgreiche Runs belegen. Eine Neuberechnung im Bericht
oder ein stiller Ersatzwert wäre kein Ursachenfix.

## Verifikation

- drei finale Realpfad-Partien mit 771/771 vollständigen Entscheidungen;
- keine Codeänderung und deshalb kein zusätzlicher Testlauf;
- Match-, Seed-, Snapshot- und Hashbindung vollständig reproduzierbar;
- Drilldown nur für Score-/Steal-Timeline, letzte Corp-Züge, Run-IDs und den
  abweichenden Resultzähler.

Verdichtete Fälle stehen in der
[KI-Selbstspiel-Indizienmatrix](ai-selfplay-evidence-matrix.md).
