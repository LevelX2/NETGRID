# Evidence: Match 23D6 Runner-Remediation 2026-07-17

Status: Analyse und Consumer-Audit abgeschlossen, Umsetzung freigegeben, Red-Evidence folgt

## Match und Datenbasis

- Match: `match_23d6dc3849db2566`
- Modus: `human_corp_vs_runner_ai`
- Runner-KI: schwer, Profil `runner-ai-v0.9-hard`
- Seed: `match-mrp4zypa-1c01ea2`
- Zeitraum: 2026-07-17 18:27 bis 20:44 Uhr Europe/Berlin
- Endstand: StateVersion 359, MatchVersion 367, StateHash `fnv1a:5cbc3485`
- Ergebnis: Korp gewinnt durch 7 Agendapunkte
- Runtime-SQLite: `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Datenumfang: 360 Events, 360 StateSnapshots, 1 GameState und 199 AI-Decision-Traces
- Coverage: 199 erwartete Runner-KI-Entscheidungen, 199 passende Traces, keine fehlenden, verwaisten, doppelten oder typabweichenden Zuordnungen

Die SQLite-Datei wurde ausschließlich read-only geöffnet. Historische Bewertungen verwenden nur den damaligen Runner-PlayerView-, LegalAction-, Memory-, Plan- und DecisionDebug-Kontext. Spätere öffentliche Ereignisse dienen ausschließlich als Folgebeobachtung.

## Ergebnis vorweg

- 187 Decisions sind plausibel, regelbedingt oder ohne belegbaren Fehler.
- Zwölf Decision-Anker gehören zu vier KI-/Hint-Fehlergruppen und einer Engine-LegalAction-Lücke.
- D152, D169 und D190 sind keine freiwilligen Fehl-Runs: Viacox-Wurf 3 ließ jeweils nur den R&D-Run zu.
- Krash wurde bei D37 durch das falsche Viral-15-Break-Ziel verloren.
- Codecracker wurde bei D136 unmittelbar nach dem Ziehen installiert.
- Aujourd'Oui wurde bei D163 gezogen, aber erst D195 installiert; D196/D197 suchen danach korrekt Dwarf und Loony Goon.
- Broker-Implementation und Hint werden erkannt; D130 bis D132 verlieren erst in der finalen Plan-Arbitration.

## Decksnapshot und verpflichtender Hint-/Consumer-Audit

Der Snapshot „Unused Proteus Runner Remainder Lab“ enthält 45 Karten und 27 eindeutige Definitionen. Es gibt genau je eine Kopie von Krash, Codecracker, Dwarf, Loony Goon, Aujourd'Oui und Broker. Diese geringe Redundanz verstärkt den Verlust von Krash und die verspätete Suche, erklärt aber nicht die falsche Arbitration.

Der feste Deck-Audit erfasste 27/27 eindeutige Karten ohne Ausschlüsse. Tatsächliche Consumer:

- Search-Tools: ausschließlich `onr_v1_151_aujourdoui`;
- Remote-Contest-Tools: keine;
- primäre Strategien: `runner.rnd_pressure` 100, `runner.run_event_tempo` 100, `runner.rig_first` 65;
- sekundäre Strategie: `runner.interface_closeout` 60;
- Auditstatus: `failed`, ein Blocker, null Warnungen;
- Blocker: Skullcap kompiliert einen generischen Damage-Prevention-Effekt zusätzlich zu einem Brain-/Net-spezifischen Effekt.

Für Broker, alle vier Breaker und Aujourd'Oui stimmen Rollen und strukturierte Funktionen. Viacox ist dagegen überbreit: `setup.search` wird aus einem Zufallsdraw abgeleitet; `risk.random_action` und `risk.mandatory_action` erscheinen als Function-Signale, erreichen aber den Installationsscore nicht.

## Vollständige Decision-Coverage

| Decision |  SV | Turn | Auswahl                                                 | beste sichtbare Alternative          | Status          | Klassifikation                                                                                                   |
| -------: | --: | ---: | ------------------------------------------------------- | ------------------------------------ | --------------- | ---------------------------------------------------------------------------------------------------------------- |
|     D001 |   0 |    1 | Runner-Starthand                                        | -                                    | plausibel       | Choice-Inhalt, zulässige Optionen und Folgefenster geprüft; kein weiterer belegter Fehler.                       |
|     D002 |   7 |    2 | Run auf R&D                                             | Krash installieren                   | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D003 |   9 |    2 | Run fortsetzen                                          | Jack-out                             | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D004 |  10 |    2 | Karte accessen                                          | -                                    | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D005 |  11 |    2 | Krash installieren                                      | Runner Sensei installieren           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D006 |  12 |    2 | Run auf HQ                                              | Runner Sensei installieren           | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D007 |  13 |    2 | Karte accessen                                          | -                                    | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D008 |  14 |    2 | Runner Sensei installieren                              | Karte ziehen                         | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D009 |  15 |    2 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D010 |  21 |    4 | Run auf R&D                                             | 1 Credit nehmen                      | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D011 |  23 |    4 | Run fortsetzen                                          | Jack-out                             | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D012 |  25 |    4 | Subroutinen auslösen (Run endet)                        | -                                    | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D013 |  26 |    4 | 1 Credit nehmen                                         | Karte ziehen                         | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D014 |  27 |    4 | 1 Credit nehmen                                         | Karte ziehen                         | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D015 |  28 |    4 | 1 Credit nehmen                                         | Karte ziehen                         | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D016 |  29 |    4 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D017 |  36 |    6 | 1 Credit nehmen                                         | Karte ziehen                         | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D018 |  37 |    6 | 1 Credit nehmen                                         | Karte ziehen                         | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D019 |  38 |    6 | Karte ziehen                                            | Get Ready to Rumble installieren     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D020 |  39 |    6 | Ice and Data Special Report spielen                     | Karte ziehen                         | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D021 |  40 |    6 | Ein Data Fort zum Exposen wählen                        | -                                    | plausibel       | Choice-Inhalt, zulässige Optionen und Folgefenster geprüft; kein weiterer belegter Fehler.                       |
|     D022 |  41 |    6 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D023 |  47 |    8 | Run auf HQ                                              | Karte ziehen                         | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D024 |  48 |    8 | Karte accessen                                          | -                                    | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D025 |  49 |    8 | Nicht trashen                                           | Corporate Negotiating Center trashen | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D026 |  50 |    8 | 1 Credit nehmen                                         | Karte ziehen                         | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D027 |  51 |    8 | Get Ready to Rumble installieren                        | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D028 |  52 |    8 | Karte ziehen                                            | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D029 |  53 |    8 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D030 |  59 |   10 | 1 Credit nehmen                                         | Karte ziehen                         | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D031 |  60 |   10 | Karte ziehen                                            | Run auf Remote 1                     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D032 |  61 |   10 | Score! spielen                                          | Run auf Remote 1                     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D033 |  62 |   10 | Run auf Remote 1                                        | Karte ziehen                         | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D034 |  64 |   10 | Krash: Stärke +1                                        | Subroutinen auslösen                 | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D035 |  65 |   10 | Krash: Stärke +1                                        | Subroutinen auslösen                 | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D036 |  66 |   10 | Krash: Stärke +1                                        | Subroutinen auslösen                 | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D037 |  67 |   10 | Krash: Subroutine 1 brechen                             | Subroutinen auslösen                 | Finding F1      | Viral 15: falsches Break-Ziel; Krash geht verloren.                                                              |
|     D038 |  68 |   10 | Subroutinen auslösen                                    | -                                    | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D039 |  69 |   10 | Run fortsetzen                                          | Jack-out                             | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D040 |  70 |   10 | Viral 15: installiertes Programm trashen.               | -                                    | plausibel       | Choice-Inhalt, zulässige Optionen und Folgefenster geprüft; kein weiterer belegter Fehler.                       |
|     D041 |  71 |   10 | Run fortsetzen                                          | Jack-out                             | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D042 |  72 |   10 | Karte accessen                                          | -                                    | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D043 |  73 |   10 | Corporate War stehlen                                   | -                                    | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D044 |  74 |   10 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D045 |  80 |   12 | Karte ziehen                                            | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D046 |  81 |   12 | Karte ziehen                                            | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D047 |  82 |   12 | Karte ziehen                                            | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D048 |  83 |   12 | 1 Credit nehmen                                         | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D049 |  84 |   12 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D050 |  85 |   12 | Runner-Discard wählen                                   | -                                    | plausibel       | Choice-Inhalt, zulässige Optionen und Folgefenster geprüft; kein weiterer belegter Fehler.                       |
|     D051 |  93 |   14 | 1 Credit nehmen                                         | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D052 |  94 |   14 | 1 Credit nehmen                                         | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D053 |  95 |   14 | 1 Credit nehmen                                         | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D054 |  96 |   14 | Score! spielen                                          | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D055 |  97 |   14 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D056 | 102 |   16 | Karte ziehen                                            | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D057 | 103 |   16 | Karte ziehen                                            | Bargain with Viacox installieren     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D058 | 104 |   16 | Bargain with Viacox installieren                        | Run auf HQ                           | Schwachpunkt F4 | Viacox-Install erhält Setup-/Economybonus ohne Pflichtaktionsrisiko.                                             |
|     D059 | 105 |   16 | Karte ziehen                                            | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D060 | 106 |   16 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D061 | 107 |   16 | Runner-Discard wählen                                   | -                                    | plausibel       | Choice-Inhalt, zulässige Optionen und Folgefenster geprüft; kein weiterer belegter Fehler.                       |
|     D062 | 113 |   18 | Karte ziehen                                            | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D063 | 114 |   18 | Ice and Data Special Report spielen                     | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D064 | 115 |   18 | Ein Data Fort zum Exposen wählen                        | -                                    | plausibel       | Choice-Inhalt, zulässige Optionen und Folgefenster geprüft; kein weiterer belegter Fehler.                       |
|     D065 | 116 |   18 | Karte ziehen                                            | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D066 | 117 |   18 | Run auf HQ                                              | 1 Credit nehmen                      | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D067 | 118 |   18 | Karte accessen                                          | -                                    | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D068 | 119 |   18 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D069 | 120 |   18 | Runner-Discard wählen                                   | -                                    | plausibel       | Choice-Inhalt, zulässige Optionen und Folgefenster geprüft; kein weiterer belegter Fehler.                       |
|     D070 | 129 |   20 | start_run                                               | -                                    | Finding F5      | Viacox-Wurf 5 bietet nur Remote 1 statt einer Remote-Auswahl.                                                    |
|     D071 | 130 |   20 | Subroutinen auslösen                                    | -                                    | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D072 | 131 |   20 | Run fortsetzen                                          | Jack-out (1 Credit)                  | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D073 | 132 |   20 | Run auf HQ                                              | 1 Credit nehmen                      | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D074 | 133 |   20 | Karte accessen                                          | -                                    | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D075 | 134 |   20 | Nicht trashen                                           | Rescheduler trashen                  | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D076 | 135 |   20 | Karte ziehen                                            | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D077 | 136 |   20 | 1 Credit nehmen                                         | Run auf Remote 2                     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D078 | 137 |   20 | Mercenary Subcontract installieren                      | Run auf Remote 2                     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D079 | 138 |   20 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D080 | 143 |   22 | Skullcap installieren                                   | -                                    | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D081 | 144 |   22 | Karte ziehen                                            | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D082 | 145 |   22 | Karte ziehen                                            | Drone for a Day spielen              | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D083 | 146 |   22 | Run auf HQ                                              | Drone for a Day spielen              | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D084 | 147 |   22 | Karte accessen                                          | -                                    | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D085 | 148 |   22 | Nicht trashen                                           | Rescheduler trashen                  | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D086 | 149 |   22 | Drone for a Day spielen                                 | Prearranged Drop spielen             | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D087 | 150 |   22 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D088 | 156 |   24 | Tag entfernen                                           | Run auf Remote 2                     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D089 | 157 |   24 | Tag entfernen                                           | Run auf Remote 2                     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D090 | 158 |   24 | Tag entfernen                                           | Run auf Remote 2                     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D091 | 159 |   24 | 1 Credit nehmen                                         | Prearranged Drop spielen             | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D092 | 160 |   24 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D093 | 166 |   26 | Prearranged Drop spielen                                | Run auf Remote 3                     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D094 | 167 |   26 | Run auf Remote 3                                        | Karte ziehen                         | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D095 | 169 |   26 | Run fortsetzen                                          | Jack-out                             | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D096 | 170 |   26 | Karte accessen                                          | -                                    | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D097 | 171 |   26 | Mercenary Subcontract: aktuelle Karte kostenlos trashen | Nicht trashen                        | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D098 | 172 |   26 | Karte ziehen                                            | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D099 | 173 |   26 | Karte ziehen                                            | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D100 | 174 |   26 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D101 | 175 |   26 | Runner-Discard wählen                                   | -                                    | plausibel       | Choice-Inhalt, zulässige Optionen und Folgefenster geprüft; kein weiterer belegter Fehler.                       |
|     D102 | 180 |   28 | Karte ziehen                                            | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D103 | 181 |   28 | Karte ziehen                                            | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D104 | 182 |   28 | Karte ziehen                                            | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D105 | 183 |   28 | Karte ziehen                                            | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D106 | 184 |   28 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D107 | 185 |   28 | Runner-Discard wählen                                   | -                                    | plausibel       | Choice-Inhalt, zulässige Optionen und Folgefenster geprüft; kein weiterer belegter Fehler.                       |
|     D108 | 192 |   30 | Karte ziehen                                            | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D109 | 193 |   30 | 1 Credit nehmen                                         | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D110 | 194 |   30 | 1 Credit nehmen                                         | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D111 | 195 |   30 | 1 Credit nehmen                                         | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D112 | 196 |   30 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D113 | 197 |   30 | Runner-Discard wählen                                   | -                                    | plausibel       | Choice-Inhalt, zulässige Optionen und Folgefenster geprüft; kein weiterer belegter Fehler.                       |
|     D114 | 205 |   32 | 1 Credit nehmen                                         | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D115 | 206 |   32 | Drone for a Day spielen                                 | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D116 | 207 |   32 | Tag entfernen                                           | Run auf Remote 2                     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D117 | 208 |   32 | Run auf Remote 2                                        | Karte ziehen                         | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D118 | 209 |   32 | Subroutinen auslösen                                    | -                                    | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D119 | 210 |   32 | Run fortsetzen                                          | Jack-out                             | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D120 | 211 |   32 | Karte accessen                                          | -                                    | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D121 | 212 |   32 | Remote Facility trashen                                 | Nicht trashen                        | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D122 | 213 |   32 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D123 | 218 |   34 | Karte ziehen                                            | Broker installieren                  | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D124 | 219 |   34 | Karte ziehen                                            | Broker installieren                  | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D125 | 220 |   34 | 1 Credit nehmen                                         | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D126 | 221 |   34 | 1 Credit nehmen                                         | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D127 | 222 |   34 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D128 | 223 |   34 | Runner-Discard wählen                                   | -                                    | plausibel       | Choice-Inhalt, zulässige Optionen und Folgefenster geprüft; kein weiterer belegter Fehler.                       |
|     D129 | 228 |   36 | Broker installieren                                     | Run auf HQ                           | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D130 | 229 |   36 | 1 Credit nehmen                                         | Broker: 3 Credits auf Broker legen   | Finding F2      | Lucidrine-Funding blockiert den klar besseren Broker-Load.                                                       |
|     D131 | 230 |   36 | 1 Credit nehmen                                         | Broker: 3 Credits auf Broker legen   | Finding F2      | Fundingplan blockiert Broker erneut ohne Same-turn-Konversion.                                                   |
|     D132 | 231 |   36 | 1 Credit nehmen                                         | Broker: 3 Credits auf Broker legen   | Finding F2      | Letzter Basiscredit erreicht 8 Credits erst ohne Installationsclick.                                             |
|     D133 | 232 |   36 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D134 | 240 |   38 | Karte ziehen                                            | Broker: 3 Credits auf Broker legen   | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D135 | 241 |   38 | Karte ziehen                                            | Bargain with Viacox installieren     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D136 | 242 |   38 | Codecracker installieren                                | Bargain with Viacox installieren     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D137 | 243 |   38 | 1 Credit nehmen                                         | Broker: 3 Credits auf Broker legen   | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D138 | 244 |   38 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D139 | 251 |   40 | 1 Credit nehmen                                         | Run auf Remote 2                     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D140 | 252 |   40 | Run auf Remote 2                                        | Bargain with Viacox installieren     | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D141 | 254 |   40 | Subroutinen auslösen                                    | -                                    | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D142 | 255 |   40 | Jack-out (1 Credit)                                     | Run fortsetzen                       | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D143 | 256 |   40 | 1 Credit nehmen                                         | Bargain with Viacox installieren     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D144 | 257 |   40 | Karte ziehen                                            | Broker: 3 Credits auf Broker legen   | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D145 | 258 |   40 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D146 | 259 |   40 | Runner-Discard wählen                                   | -                                    | plausibel       | Choice-Inhalt, zulässige Optionen und Folgefenster geprüft; kein weiterer belegter Fehler.                       |
|     D147 | 266 |   42 | Karte ziehen                                            | Bargain with Viacox installieren     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D148 | 267 |   42 | Bargain with Viacox installieren                        | Broker: 3 Credits auf Broker legen   | Schwachpunkt F4 | Zweites Viacox ignoriert den sichtbar gefährlichen Pflicht-Run-Kontext.                                          |
|     D149 | 268 |   42 | 1 Credit nehmen                                         | Broker: 3 Credits auf Broker legen   | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D150 | 269 |   42 | 1 Credit nehmen                                         | Broker: 3 Credits auf Broker legen   | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D151 | 270 |   42 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D152 | 277 |   44 | start_run                                               | -                                    | regelbedingt    | Viacox-Wurf 3: R&D-Run war die einzige LegalAction.                                                              |
|     D153 | 280 |   44 | Subroutinen auslösen                                    | -                                    | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D154 | 282 |   44 | Run fortsetzen                                          | Jack-out                             | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D155 | 284 |   44 | Codecracker: Stärke +1                                  | Subroutinen auslösen (Run endet)     | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D156 | 285 |   44 | Codecracker: Stärke +1                                  | Subroutinen auslösen (Run endet)     | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D157 | 286 |   44 | Codecracker: Stärke +1                                  | Subroutinen auslösen (Run endet)     | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D158 | 287 |   44 | Codecracker: Stärke +1                                  | Subroutinen auslösen (Run endet)     | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D159 | 288 |   44 | Codecracker: Stärke +1                                  | Subroutinen auslösen (Run endet)     | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D160 | 289 |   44 | Codecracker: Stärke +1                                  | Subroutinen auslösen (Run endet)     | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D161 | 290 |   44 | Codecracker: Subroutine 1 brechen                       | Codecracker: Subroutine 2 brechen    | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D162 | 291 |   44 | Subroutinen auslösen (Run endet)                        | -                                    | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D163 | 292 |   44 | Karte ziehen                                            | Broker: 3 Credits auf Broker legen   | Finding F2/F3   | Lucidrine-Plan blockiert Broker und zieht bei bereits vollem Setup-Fokus.                                        |
|     D164 | 293 |   44 | 1 Credit nehmen                                         | Broker: 3 Credits auf Broker legen   | Finding F2/F3   | Basiscredit verdrängt das kostenlose Aujourd'Oui bei akuter Coverage-Lücke.                                      |
|     D165 | 294 |   44 | 1 Credit nehmen                                         | Broker: 3 Credits auf Broker legen   | Finding F2/F3   | Fundingfortsetzung verdrängt erneut Broker und Aujourd'Oui.                                                      |
|     D166 | 295 |   44 | 1 Credit nehmen                                         | Broker: 3 Credits auf Broker legen   | Finding F2/F3   | Dritter Basiscredit verdrängt erneut Broker und Aujourd'Oui.                                                     |
|     D167 | 296 |   44 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D168 | 297 |   44 | Runner-Discard wählen                                   | -                                    | plausibel       | Choice-Inhalt, zulässige Optionen und Folgefenster geprüft; kein weiterer belegter Fehler.                       |
|     D169 | 303 |   46 | start_run                                               | -                                    | regelbedingt    | Viacox-Wurf 3: R&D-Run war die einzige LegalAction.                                                              |
|     D170 | 305 |   46 | Subroutinen auslösen                                    | -                                    | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D171 | 307 |   46 | Run fortsetzen                                          | Jack-out                             | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D172 | 309 |   46 | Subroutinen auslösen (Run endet)                        | -                                    | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D173 | 310 |   46 | 1 Credit nehmen                                         | Broker: 3 Credits auf Broker legen   | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D174 | 311 |   46 | 1 Credit nehmen                                         | Broker: 3 Credits auf Broker legen   | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D175 | 312 |   46 | Broker: 3 Credits auf Broker legen                      | Aujourd'Oui installieren             | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D176 | 313 |   46 | 1 Credit nehmen                                         | Aujourd'Oui installieren             | Schwachpunkt F3 | Credit-Base-Plan hält Aujourd'Oui trotz konkreter Coverage-Lücke zurück.                                         |
|     D177 | 314 |   46 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D178 | 321 |   48 | 1 Credit nehmen                                         | -                                    | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D179 | 322 |   48 | Broker: 3 Credits auf Broker legen                      | Aujourd'Oui installieren             | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D180 | 323 |   48 | Run auf Remote 3                                        | Run auf Remote 4                     | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D181 | 325 |   48 | Run fortsetzen                                          | Jack-out                             | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D182 | 326 |   48 | Karte accessen                                          | -                                    | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D183 | 327 |   48 | Corporate Negotiating Center trashen                    | Nicht trashen                        | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D184 | 328 |   48 | Run auf Remote 4                                        | Run auf Remote 5                     | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D185 | 330 |   48 | Run fortsetzen                                          | Jack-out                             | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D186 | 331 |   48 | Karte accessen                                          | -                                    | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D187 | 332 |   48 | Rescheduler trashen                                     | Nicht trashen                        | plausibel       | Access-/Trash-/Steal-Fenster und sichtbare Alternativen geprüft.                                                 |
|     D188 | 333 |   48 | 1 Credit nehmen                                         | Run auf Remote 5                     | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D189 | 334 |   48 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |
|     D190 | 342 |   50 | start_run                                               | -                                    | regelbedingt    | Viacox-Wurf 3: R&D-Run war die einzige LegalAction.                                                              |
|     D191 | 344 |   50 | Subroutinen auslösen                                    | -                                    | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D192 | 346 |   50 | Run fortsetzen                                          | Jack-out                             | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D193 | 348 |   50 | Subroutinen auslösen (Run endet)                        | -                                    | plausibel       | Run-Elternaktion, sichtbarer Pfad und Encounter-Folge geprüft; kein weiterer belegter Fehler.                    |
|     D194 | 349 |   50 | Broker: Credits von Broker nehmen                       | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D195 | 350 |   50 | Aujourd'Oui installieren                                | Mercenary Subcontract installieren   | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D196 | 351 |   50 | Aujourd'Oui: Top 5 nach Programmen prüfen               | Karte ziehen                         | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D197 | 352 |   50 | Stack-Spitze ansehen und Karten nehmen                  | -                                    | plausibel       | Choice-Inhalt, zulässige Optionen und Folgefenster geprüft; kein weiterer belegter Fehler.                       |
|     D198 | 353 |   50 | Mercenary Subcontract installieren                      | 1 Credit nehmen                      | plausibel       | Plan, Rohscore-Alternativen, sichtbare Ressourcen und unmittelbare Folge geprüft; kein weiterer belegter Fehler. |
|     D199 | 354 |   50 | Zug beenden                                             | -                                    | plausibel       | Keine offene klar bessere konvertierbare Aktion im damaligen Fenster.                                            |

## F1 – Encounter-Zieldaten gehen im AI-Input verloren

Bei D37/StateVersion 67 besitzt der Runner nach drei Krash-Pumps noch 3 Credits. Beide Viral-15-Subroutinen sind legal brechbar und kosten je 2. Subroutine 1 erhöht nur Jack-out-Kosten; Subroutine 2 erzwingt nach dem Passieren den Trash eines installierten Programms. Die KI bricht Subroutine 1, löst Subroutine 2 aus und trasht in D40 Krash.

Die Engine-LegalAction enthält `subroutineIndex`, `breakerId` und `iceId`. `buildAiDecisionInput` sanitisiert Payloads über eine positive Allowlist, die `subroutineIndex` und `subroutineIndexes` nicht enthält. Deshalb liefern `breakSubroutineIndexesForAction`, der Encounter-Break-Score und die RunPlan-Sequenz keine Zieldifferenz. Die isolierten Unit-Tests umgehen den Fehler, weil sie rohe LegalActions direkt bauen. Auf aktuellem Code wählt die zustandslose Einzelgegenprüfung sogar „Subroutinen auslösen“; der Fehler ist weiterhin vorhanden.

Bessere Folge: Subroutine 2 brechen, Viral 15 passieren, Krash behalten und den bekannten Access fortsetzen. Bei geplanter sofortiger Jack-out-Linie kann dagegen der Jack-out-Aufpreis relevant sein; bei genügend Credits dürfen beide Breaks gewählt werden.

## F2 – Handkarten-Funding verdrängt Broker ohne Same-turn-Konversion

Broker wird bei D129 korrekt installiert. D130 bis D132 wählen anschließend dreimal den Basiscredit für Lucidrine Drip Feed. Broker ist jeweils Raw-Sieger: 1312, 1312 und 2362 gegenüber 554, 579 und 604. Der Plancontroller blockiert Broker mit `absolute_plan_control`. Nach dem dritten Credit sind 8 Credits, aber null Klicks vorhanden; Lucidrine kann nicht installiert werden.

Der Fundingplan modelliert den Creditgap, aber nicht die für den nachgelagerten Installationsschritt verbleibenden Klicks. Broker ist korrekt als Background-Bank erkannt und wird später bei D175/D179 geladen sowie D194 ausgezahlt. Fehlerquelle ist die Arbitration, nicht Karte oder Engine.

## F3 – Konkrete Breaker-Suche unterliegt allgemeinen Economy-Plänen

Aujourd'Oui wird bei D163 gezogen. D164 bis D166 wählen trotz akuter Wall-/Sentry-Lücke Basiscredits für Lucidrine; D176 schützt nochmals einen Credit-Base-Schritt. Der Install-Rohscore von Aujourd'Oui beträgt 504 und der Search-Consumer erkennt die Karte korrekt. Erst D195 installiert sie; D196 aktiviert die Suche, D197 nimmt Dwarf und Loony Goon.

Die Semantik geht nicht im Hint oder Search-Consumer verloren, sondern in Planpriorität und Override-Grenze. Eine konkrete kostenlose Suchlinie bei fehlender Coverage braucht einen engen Interrupt; ohne Coverage-Lücke darf sie Economy nicht pauschal verdrängen.

## F4 – Viacox-Hint und Installationsconsumer preisen Pflichtaktionsrisiko nicht ein

Viacox wird bei D58 und D148 mit Rawscore 1577 installiert. Der Score enthält 900 Setup-Punkte für „primären Breaker finden/installieren“ und 500 Economy-Punkte, aber keine Risiko-Komponente. Der aktive Hint beschreibt einen Zufallsdraw fälschlich als Search-Effekt. Pflicht- und Zufallsaktionssignale werden zwar kompiliert, aber nicht vom persistenten Installationsconsumer bewertet.

Nach der zweiten Installation ist R&D bereits sichtbar blockiert/unbezahlbar. Trotzdem löst Viacox in D152, D169 und D190 drei Würfe 3 aus. Diese drei Run-Entscheidungen selbst sind korrekt erzwungen; die begründete Schwäche liegt in der risikolosen Installationsbewertung.

## F5 – Viacox-Wurf 5 entfernt eine regelkonforme Remote-Auswahl

Bei D70/StateVersion 129 existieren Remote 1 und Remote 2. Wurf 5 verlangt einen Run auf „einen“ subsidiary Data Fort. Die Engine sortiert Remotes lexikografisch, speichert Remote 1 im ExtraActionGrant und erzeugt nur diese Start-Run-LegalAction. Dadurch muss die KI gegen das bekannte Viral 15 laufen, obwohl Remote 2 eine andere sichtbare Lage besitzt.

Die Korrektur gehört in die Rules Engine: Die Pflichtaktionsfamilie bleibt `start_run`, aber bei Wurf 5 muss der Runner unter allen legalen Remotes wählen. Wurf 3 und 4 behalten ihre festen Zentralziele.

## F6 – Skullcap-Compiler-Overlap

Der 27-Karten-Audit meldet für `onr_proteus_096_skullcap` einen generischen Damage-Prevention-Effekt und einen überlappenden Brain-/Net-spezifischen Effekt mit gleichem Timing, Scope und Resource. Der Fund war im Match nicht entscheidungskausal, blockiert aber die deckweite Hint-/Consumer-Freigabe.

## Herkunft und Regressionseinordnung

- Die AI-Input-Allowlist existiert seit 17.05.2026; `subroutineIndex` wurde nie aufgenommen. F1 ist eine alte Integrationslücke, die Viral 15 sichtbar macht.
- Die feste Remote-1-Auswahl für Viacox-Wurf 5 existiert seit 29.05.2026. F5 ist kartenspezifische Engine-Schuld, kein neuer RunTarget-Fehler.
- Runner-Handkarten-Funding und absolute Plan-Dominanz wurden Anfang Juli eingeführt und danach verstärkt. F2/F3 sind aktuelle generische Arbitration-Lücken; die Broker-Verbesserungen vom 17.07. decken diesen Foreground-Konflikt nicht ab.
- Das ungewöhnlich dünne Breaker-Paket und Viacox haben bestehende Lücken offengelegt; sie erklären nicht allein das Fehlverhalten.

## Akzeptanzkriterien vor Produktionsänderung

- D37, D130, D164 und D148 werden mit unveränderten fachlichen Erwartungen strikt capturt, soweit das historische Warmup spielgleich bleibt.
- Warmup-, Engine- oder Fixture-Drift wird nicht als `behavior_regression` ausgegeben.
- D70 erhält einen roten Engine-LegalAction-Vertrag statt eines künstlichen KI-Checkpoints.
- Viacox- und Skullcap-Hints erhalten rote Compiler-/Consumer-Verträge vor Datenänderungen.
- Jede Korrektur besitzt eine Gegenprobe, in der die neue Priorität bewusst nicht greift.
- Checkpoint-Erwartungen werden nach dem Red-Evidence-Commit nicht abgeschwächt.
- Keine zukünftige Root-, HQ-, Hand- oder Stack-Information gelangt in Fixture, Test oder produktiven Consumer.

## Red-Evidence und Fixture-Kompatibilität

Der Strict-Capture für D37 replayt alle 36 vorherigen KI-Entscheidungen ohne
Drift. Der sichere Viacox-Kontrollfall D58 besitzt ebenfalls 57 kompatible
Warmup-Entscheidungen und null Drifts. Der aktuelle Code verletzt bei D37 die
unveränderte Erwartung als `behavior_regression`: Er bricht weiterhin Viral
15 Subroutine 1 statt der programmtrashenden Subroutine 2.

Der erste Strict-Versuch für D130 stoppt regelkonform bei D73: historisch
„Run auf HQ“, aktuell „Karte ziehen“. Deshalb wurden D130, D148, D164 und D176
nicht als strict spielgleich ausgegeben, sondern über die ausdrücklich
dokumentierte Fixture-Migration `rebase` capturt. Alle vier Migrationen weisen
dieselben frühen Drifts D73, D76, D81 und D82 auf. Danach bleiben die
historischen Suffixe kompatibel:

- D130: 47 kompatible Entscheidungen;
- D148: 65 kompatible Entscheidungen;
- D164: 81 kompatible Entscheidungen;
- D176: 93 kompatible Entscheidungen.

Die Runtime enthält in allen Fällen TacticalPlan, PlanPortfolio und
StrategicIntent. D37 enthält zusätzlich den relevanten RunnerRunPlan; die
späteren Action-Phase-Fälle benötigen keinen aktiven RunPlan. Auf aktuellem
Code sind D130, D164, D176 und D148 jeweils `behavior_regression`; D58 bleibt
als sichere Viacox-Gegenprobe grün.

Vor Produktionsänderung sind außerdem folgende Schichtverträge rot:

- DTO: `subroutineIndex` und `subroutineIndexes` fehlen nach positiver
  LegalAction-Sanitization, während ein unbekannter privater Probe-Key korrekt
  entfernt wird;
- Engine: Viacox-Wurf 5 erzeugt bei Remote 1 und Remote 2 ausschließlich die
  Start-Run-LegalAction für Remote 1;
- Hint: Viacox besitzt keine `mandatory_action`-/`random_outcome`-RiskTags und
  erzeugt weiterhin das falsche Signal `setup.search`;
- Compiler: Skullcap kompiliert zwei generische Damage-Prevention-Effekte für
  dasselbe Timing, denselben Scope und dieselbe Resource;
- Deck-Audit: 27/27 eindeutige Karten und 45/45 Karten erfasst, Status
  `failed`, genau ein Skullcap-Blocker und null Warnungen.

Damit sind die fünf KI-Verhaltensänderungen ausschließlich durch
`behavior_regression` autorisiert; Engine-, DTO- und Hint-Änderungen besitzen
je einen eigenen roten Vertrag. Die Erwartungen werden ab diesem Commit nicht
abgeschwächt.

## P5-Verifikation: Viacox bis zum produktiven Consumer

Die Korrektur bestätigt zwei getrennte Ursachen. Erstens behandelte die
Source-Role-Erkennung das in den Rohmechaniken vorkommende Teilresultat
`draw_card` als verlässliche Draw-/Breaker-Setup-Antwort, obwohl der aktive
Hint bereits strukturierte, zufällige Pflichtwirkungen besitzt. Strukturierte
Hints sind nun für diese Klassifikation autoritativ. Zweitens fehlte den
`mandatory_action`-/`random_outcome`-RiskTags der Pfad in den
Installationsscore und die Plan-Arbitration.

Nach der Korrektur fällt D148 von 1577 auf 177 Rohscore und der bereits
installierte Broker gewinnt mit 1312. D58 bleibt trotz derselben
Hint-Korrektur als positive Kontrollprobe bei Viacox: Dort existiert noch kein
Bankzug, der den Handkartenplan produktiv überstimmt. Die Entscheidung wird
damit nicht kartenspezifisch verboten, sondern kontextabhängig bewertet.

Wurf 5 verwendet nun die eingeschränkte Aktionsfamilie `start_run_remote`.
Alle vorhandenen Remote-`start_run`-LegalActions bleiben auswählbar und werden
von `applyAction` erneut validiert. Tests decken zwei, einen und keinen Remote,
die festen Zentralziele von Wurf 3/4, Replay/StateHash sowie den Chronicle-
Konsumenten ab.

Verifizierte Consumer-Kette:

- aktiver und kompilierter Hint: Risiko-Tags vorhanden, kein
  `search/setup.draw`;
- Inspector: `risk.mandatory_action` und `risk.random_action`, kein
  `setup.search`;
- Action-Semantik: beide Risikoobjekte werden auf die Installationsaktion
  projiziert;
- Runtime-Score/Arbitration: negative Pflichtzufalls-Komponente und enger
  Yield zu einem materiell stärkeren Bankzug;
- Decision-Checkpoints: D37, D130, D164, D176, D148 und D58 sowie beide
  synthetischen Gegenproben grün.

## P6-Verifikation: Skullcap und vollständiger Deck-Audit

Skullcap verwendet jetzt denselben eng freigegebenen Compiler-
Normalisierungspfad wie die bereits geprüften Karten mit kompatiblen aktiven
und generierten Effekten. Der generische Effekt für Timing
`prevention_window`, Scope `runner` und Resource `damage` wird genau einmal
kompiliert und enthält `damageTypes: [brain, net]`; die getrennten typisierten
Funktionssignale bleiben erhalten.

Der feste Audit auf dem unveränderten Match-Decksnapshot bestätigt danach:

- 27/27 eindeutige Karten und 45/45 Karten geprüft, keine Ausschlüsse;
- Search-Tools weiterhin ausschließlich Aujourd'Oui;
- Viacox ohne `setup.search`, mit Pflicht-/Zufallsaktionssignalen;
- primäre Strategien weiterhin R&D Pressure 100, Run Event Tempo 100 und
  Rig First 65; Interface Closeout 60 bleibt sekundär;
- Auditstatus `ok`, null Blocker, null Warnungen.

Damit sind aktiver Hint, Compiler, Inspector, Action-Projektion,
Installationsscore, Plan-Arbitration, DeckCapability und DeckStrategy für die
betroffenen Karten gemeinsam verifiziert.

## P7-Abschlussverifikation und breite Regression

Der erste vollständige AI-Shardlauf deckte neben den 23D6-Fällen auch eine
9FEF-Kontrollregression auf: Eine zunächst zu breite Source-Hint-Autorität
unterdrückte bei Junkyard BBS die gewöhnliche Draw-Rohmechanik. Die Autorität
ist deshalb auf explizit strukturierte `delayed_penalty`-Effekte mit Ziel
`risk.random_action` begrenzt. Viacox bleibt korrekt als zufällige
Pflichtaktion klassifiziert, während gewöhnliche Draw-Karten ihre bisherige
Rolle behalten. Der 9FEF-Kontrollcheckpoint, der Source-Role-Vertrag und alle
23D6-Checkpoints sind danach grün.

Abschlussstand der Verifikation:

- AI-Shards auf dem finalen Dateistand: 125 Dateien/797 Tests, 125
  Dateien/987 Tests und 124 Dateien/796 Tests; zusammen 374 Dateien und 2.580
  Tests grün;
- Engine: 188 Dateien und 1.717 Tests grün, einschließlich Viacox-
  LegalActions, `applyAction`, Replay und StateHash;
- Web: 48 Dateien und 626 Tests grün, einschließlich Chronicle-Konsument;
- Workspace-Typecheck: Shared, Catalog, Engine, Decks, AI, Server und Web
  grün;
- AI-Gates: Compiler, Derived Facts, Compiled Index, Manual Overlays,
  Action-Signal-Katalog, Source-Struktur und Hint-Inspector-Index grün;
- Deck-Audit: 27/27 eindeutige und 45/45 Karten, null Blocker, null Warnungen;
- Formatprüfung und `git diff --check` grün.

Der generierte Action-Signal-Katalog sinkt fachlich korrekt von 89 auf 88
Target-Profile-Gaps: Viacox verliert die falschen `setup.draw`-/
`setup.search`-Signale, während 601 aktive Karten weiterhin durch
Action-Signale gedeckt sind. Die von den AI-Gates ausgegebenen allgemeinen
Compiler-/Derived-Facts-Warnungen entsprechen der bestehenden Inventar-
Baseline; kein Gate meldet einen neuen Fehler.
