# KI-Kartenhint-Vollbestandsaudit vom 18.07.2026

Status: `review_complete_implementation_pending_user_decision`

## Ergebnis vorweg

Der vollständige Prüflauf ist sinnvoll und hat drei voneinander zu trennende
Problemklassen bestätigt:

1. Bei 17 produktiven Karten liegen konkrete falsche, widersprüchliche oder
   für die KI entscheidungsrelevant unvollständige Hints vor.
2. Weitere 28 produktive Karten besitzen `tacticSignals`, aber keine
   strukturierten `effects`. Diese Signale erreichen den allgemeinen
   Action-Profile-Pfad deshalb nur als Kompatibilitätsmetadaten und nicht als
   verlässlich bewertbare Taktiksignale.
3. 22 aktuell verwendete Taktiksignalarten auf 19 Karten haben weder einen
   produktiven Runtime-Konsumenten noch eine ausdrückliche
   `no-runtime`-Policy. Hinzu kommen zwei derzeit unbenutzte Signaldefinitionen
   mit derselben Vertragslücke.

Daneben bestehen zwei größere Ontologieflächen: 116
`strategySupportPairs`-Zuweisungen auf 110 Karten sind keinem
paarspezifischen Konsumenten zugeordnet, und 374 Runner-`valueHints`-
Zuweisungen auf 282 Karten verwenden Schlüssel ohne schlüsselspezifischen
produktiven Konsumenten. Diese beiden Flächen sind keine Aufforderung, 392
Einzel-Sonderfälle zu bauen. Hier ist zuerst eine Architekturentscheidung über
den Vertrag der Metadaten nötig.

Dieser Review verändert weder Hints noch Runtime. Die Umsetzung folgt erst
nach Rücksprache und sollte dann in einem eigenen Worktree erfolgen.

## Prüfumfang und Methode

Geprüft wurden alle 618 aktiven und kompilierten Hinteinträge:

| Bestand        |  Karten | Qualitätsstatus im aktiven Hintbestand            |
| -------------- | ------: | ------------------------------------------------- |
| Originalset V1 |     374 | 5 `needsHumanReview`, 9 nicht reviewt, 2 `low`    |
| Classic        |      54 | keine offenen Qualitätsmarkierungen               |
| Proteus        |     154 | 8 `needsHumanReview`, 8 nicht reviewt, 8 `low`    |
| Testset        |      36 | 17 `needsHumanReview`, 17 nicht reviewt, 25 `low` |
| **Gesamt**     | **618** | vollständig kompiliert                            |

Für jede Karte wurden verfügbare Regeltexte, aktive und kompilierte Hints,
Derived Facts, Inspector-Signale und der tatsächliche Runtime-Transport
zusammengeführt. Danach wurden insbesondere widersprüchliche Rollen,
Planrollen, Mechanics, Conditions, Effects, Value-/Risk-Metadaten und
Taktiksignale gegen den Kartensinn geprüft. Die Vollbestandsanalyse ist damit
keine bloße Prüfung, ob ein Hint vorhanden ist. Sie prüft auch, ob ein
vergebener Hint im allgemeinen oder in einem spezialisierten Pfad überhaupt
produktiv gelesen wird.

Die bestehenden Gates bestätigen Form, Referenzen und Katalogkonsistenz, aber
nicht automatisch die fachliche Wahrheit jedes Hints:

- `check-ai-hint-quality.mjs`: 618 Hints, keine Fehler, aber 156 Warnungen,
  darunter 95 verdächtige Singleton-Rollen, 52 Singleton-Planrollen und neun
  Synonymgruppen.
- Taktiksignal-Consumer-Gate: 673 Signaldefinitionen, keine harten Gatefehler;
  die unten aufgeführten 24 offenen Signale liegen im Legacy-Backlog und
  werden vom heutigen Hard Gate deshalb nicht rot gestellt.
- Inspector: 601 von 618 Karten mit Function Signals, 32 zurückgestellte
  Reviewfälle, 88 Target-Profile-Gaps und 113 Karten mit mindestens einer
  Warnkategorie.

Die AI Behavior Baseline wurde für diesen statischen Audit nicht neu
ausgeführt. Ein Selfplay-Lauf kann schlechte Entscheidungen sichtbar machen,
ersetzt aber weder Kartentextvergleich noch Consumer-Nachweis.

## A. Konkrete produktive Kartenkorrekturen

Die folgenden 17 Karten sind die erste, fachlich weitgehend entscheidungsreife
Maßnahmenliste. Die Kategorien überlappen nicht mit einer Aussage, dass alle
anderen Karten semantisch endgültig zertifiziert seien; sie markieren die im
Vollbestand klar belegten Korrekturen.

| Karte                                                                 | Befund                                                                                                                                                                     | Erforderliche Korrektur                                                                                                                 |
| --------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `onr_v1_221_asp` – Asp                                                | Erfolgreiche Trace beendet und sperrt Runs, vergibt aber keinen Tag. Aktuell sind `tag`, `tag_pressure` und `add_tag` hinterlegt.                                          | Falsche Tag-Rolle, Planrolle und Mechanik entfernen; Trace-, ETR- und Run-Lock-Semantik behalten.                                       |
| `onr_v1_241_fang-2-0` – Fang 2.0                                      | Derselbe Fehlertyp wie bei Asp: Trace und Run-Lock, aber kein Tag.                                                                                                         | `tag`, `tag_pressure` und `add_tag` entfernen.                                                                                          |
| `onr_v1_255_mastiff` – Mastiff                                        | Trace erzeugt einen Mastiff-Counter mit späterem Brain Damage, keinen Tag. `tag_pressure` ist sachfremd.                                                                   | Tag-Planrolle entfernen; Damage-, Counter-, Trace-, ETR- und ICE-Tax-Semantik beibehalten.                                              |
| `onr_v1_364_omni-kismet-ph-d` – Omni Kismet, Ph.D.                    | Die Karte tauscht unrezztes Fort-ICE gegen HQ-ICE. Aktuell behaupten Rollen, Mechanics, Value und Risk zusätzlich Tag und Economy.                                         | `tag`, `economy`, `tag_condition`, `gain_credit`, Economy-Value und `tag_risk` entfernen; ICE-Swap und Run-/Remote-Kontext präzisieren. |
| `onr_v1_246_fragmentation-storm` – Fragmentation Storm                | Trace führt zu ETR, Programmtrash und Run-Lock. `net_damage` und `damage_window` sind falsch.                                                                              | Damage-Rolle, Damage-Mechanik und Damage-Risk entfernen.                                                                                |
| `onr_v1_083_desperate-competitor` – Desperate Competitor              | Voraussetzung ist eine in diesem Zug befreite Gray-Ops-Agenda. `requires_scored_agenda` beschreibt die falsche Seite und den falschen Vorgang.                             | Condition auf Runner-Agenda-Liberation im aktuellen Zug plus Subtyp Gray Ops modellieren; `scored_agenda_action` präzisieren.           |
| `onr_v1_090_hot-tip-for-wns` – Hot Tip for WNS                        | Voraussetzung ist eine in diesem Zug befreite Black-Ops-Agenda, nicht eine gescorte Agenda.                                                                                | Condition auf Runner-Agenda-Liberation im aktuellen Zug plus Subtyp Black Ops modellieren; Effect präzisieren.                          |
| `onr_proteus_101_all-hands` – All-Hands                               | Erzwingt einen HQ-Run mit HQ-Multiaccess, trägt aber `pressure_rnd`.                                                                                                       | Planrolle auf HQ-Druck korrigieren.                                                                                                     |
| `onr_proteus_102_blackmail` – Blackmail                               | Erzwingt einen HQ-Run mit Agenda-Punkt statt Zugriff, trägt aber `pressure_rnd`.                                                                                           | Planrolle auf HQ-Druck korrigieren.                                                                                                     |
| `onr_v1_084_edited-shipping-manifests` – Edited Shipping Manifests    | Der Effekt ist vollständig HQ-gebunden; `contest_remote` ist sachfremd.                                                                                                    | `contest_remote` entfernen und HQ-/Access-Replacement-/Economy-/Self-Tag-Semantik behalten.                                             |
| `onr_proteus_082_bulldozer` – Bulldozer                               | Deckt regulär nur Walls. Die Rolle `breaker_killer` kann fälschlich als Sentry-Coverage gelesen werden; der kostenlose Sentry-Break ist nur ein konditionaler Folgeeffekt. | Killer-Rolle entfernen; konditionalen nächsten Sentry-Subroutine-Break als Folgeeffekt statt als Coverage modellieren.                  |
| `onr_proteus_136_credit-subversion` – Credit Subversion               | HQ-Erfolg lässt die Corp drei Credits verlieren. Der zusätzliche Effect `tag_punish_payoff` besitzt keinen Tag-Bezug.                                                      | Falschen Tag-Punish-Effect entfernen; HQ-Economy-Denial als maßgeblichen Payoff behalten.                                               |
| `onr_proteus_141_get-ready-to-rumble` – Get Ready to Rumble           | Reagiert auf erfolgreich verursachten Meat Damage mit zufälligem HQ-Discard. `tag_punish_payoff` ist sachfremd.                                                            | Falschen Tag-Punish-Effect entfernen; vorhandene Damage-Retaliation-/HQ-Disruption-Semantik zum führenden Vertrag machen.               |
| `onr_proteus_113_live-news-feed` – Live News Feed                     | Freie Serverwahl, zwei Self-Tags und Bad-Publicity-/Siegdruck werden im strukturierten Effect nicht vollständig transportiert; `pressure_rnd` ist willkürlich.             | Self-Tag, regelabhängigen Bad-Publicity-Payoff und freie Serverwahl präzise modellieren; R&D-spezifische Planrolle entfernen.           |
| `onr_proteus_142_hq-mole` – HQ Mole                                   | Zugriff auf zwei zusätzliche HQ-Karten ist als `access_replacement` statt als Multiaccess transportiert.                                                                   | Strukturierten HQ-`multiaccess`-Effect ergänzen; Hidden-Resource-Vertrag beibehalten.                                                   |
| `onr_proteus_147_r-and-d-mole` – R&D Mole                             | Zugriff auf zwei zusätzliche R&D-Karten ist ebenfalls nur als `access_replacement` transportiert.                                                                          | Strukturierten R&D-`multiaccess`-Effect ergänzen.                                                                                       |
| `onr_proteus_045_washed-up-solo-construct` – Washed-Up Solo Construct | Programmtrash oder Runner-Zahlung ist nur als Taktiksignal vorhanden; der strukturierte Effect enthält nur die Rez-Economy.                                                | Programmtrash-/Pay-or-Trash-Effect ergänzen und mit Encounter-/Subroutine-Conditions verbinden.                                         |

## B. Produktive Karten mit Taktiksignal-Transportlücke

Bei diesen 28 produktiven Karten existieren zwar `tacticSignals`, aber keine
strukturierten `effects`. Der allgemeine Action-Card-Semantic-Profile-Pfad
nimmt rohe Taktiksignale nur als `compatibilitySignals` auf. Einzelne
Spezialkonsumenten können Teilaspekte trotzdem verwenden; ein durchgängiger
produktiver Vertrag besteht aber nicht.

### Originalset V1 – 4 Karten

- `onr_v1_214_project-babylon` – Project Babylon
- `onr_v1_220_tycho-extension` – Tycho Extension
- `onr_v1_272_too-many-doors` – Too Many Doors
- `onr_v1_275_vacuum-link` – Vacuum Link

### Proteus – 24 Karten

- Agenden: `onr_proteus_001_ai-board-member` – AI Board Member;
  `onr_proteus_002_charity-takeover` – Charity Takeover;
  `onr_proteus_003_corporate-headhunters` – Corporate Headhunters;
  `onr_proteus_006_please-dont-choke-anyone` – Please Don't Choke Anyone;
  `onr_proteus_007_project-venice` – Project Venice;
  `onr_proteus_008_project-zurich` – Project Zurich;
  `onr_proteus_009_viral-breeding-ground` – Viral Breeding Ground;
  `onr_proteus_010_world-domination` – World Domination.
- ICE: `onr_proteus_012_bug-zapper` – Bug Zapper;
  `onr_proteus_013_caryatid` – Caryatid;
  `onr_proteus_017_credit-blocks` – Credit Blocks;
  `onr_proteus_020_digiconda` – Digiconda;
  `onr_proteus_021_dog-pile` – Dog Pile;
  `onr_proteus_022_food-fight` – Food Fight;
  `onr_proteus_023_galatea` – Galatea;
  `onr_proteus_024_gatekeeper` – Gatekeeper;
  `onr_proteus_025_homing-missile` – Homing Missile;
  `onr_proteus_026_hunting-pack` – Hunting Pack;
  `onr_proteus_028_lesser-arcana` – Lesser Arcana;
  `onr_proteus_030_mastermind` – Mastermind;
  `onr_proteus_034_riddler` – Riddler;
  `onr_proteus_036_sandstorm` – Sandstorm;
  `onr_proteus_039_sphinx-2006` – Sphinx 2006;
  `onr_proteus_040_sumo-2008` – Sumo 2008.

Priorität innerhalb dieses Blocks haben Karten, deren rohe Signale Damage,
Tag, Trace, ETR, Run-Lock oder Programmtrash ausdrücken. Reine Vanilla-Agenda-
und Moduswahl-Signale können danach folgen.

## C. Vergebene Taktiksignale ohne Consumer oder ausdrückliche Policy

Das Kataloggate weist 24 Signalarten mit
`consumer_or_explicit_policy_required` und ohne Consumer-Modus aus. Davon sind
22 auf 19 aktiven Karten in insgesamt 33 Card-Signal-Zuweisungen vorhanden.
Zwei weitere Definitionen sind gegenwärtig auf keiner aktiven Karte abgeleitet,
haben aber ebenfalls keinen geklärten Vertrag.

| Karte                                                                 | Nicht geklärte Signale                                                                                                                               |
| --------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `onr_classic_030_psychic-friend` – Psychic Friend                     | `breaker.scaling_strength`                                                                                                                           |
| `onr_classic_031_rent-i-con` – Rent-I-Con                             | `breaker.emergency_coverage`                                                                                                                         |
| `onr_proteus_079_big-frackin-gun` – Big Frackin' Gun                  | `breaker.multi_subroutine_break`                                                                                                                     |
| `onr_proteus_080_black-widow` – Black Widow                           | `breaker.strength_bonus_vs_chosen_ice`, `breaker.targeted_ice_bonus`                                                                                 |
| `onr_proteus_088_fubar` – Fubar                                       | `breaker.configurable_coverage`, `breaker.one_time_mode_choice`                                                                                      |
| `onr_proteus_092_morphing-tool` – Morphing Tool                       | `breaker.configurable_coverage`, `breaker.reconfigurable_type`                                                                                       |
| `onr_proteus_093_redecorator` – Redecorator                           | `breaker.multi_subroutine_break`                                                                                                                     |
| `onr_proteus_128_airport-locker` – Airport Locker                     | `breaker.emergency_search`, `breaker.search_during_encounter`, `setup.install_support`                                                               |
| `onr_proteus_139_eurocorpse-tm-spin-chip` – Eurocorpse (TM) Spin Chip | `setup.program_host`                                                                                                                                 |
| `onr_v1_001_afreet` – Afreet                                          | `breaker.hosted_strength_penalty`, `setup.program_host`                                                                                              |
| `onr_v1_019_dropp` – Dropp™                                           | `breaker.break_any_subroutine`, `breaker.multi_subroutine_break`, `defense.encounter_threat_mitigation`, `encounter.emergency_subroutine_prevention` |
| `onr_v1_020_dupre` – Dupré                                            | `breaker.scaling_strength`                                                                                                                           |
| `onr_v1_033_imp` – Imp                                                | `breaker.hosted_strength_penalty`, `setup.program_host`                                                                                              |
| `onr_v1_047_pile-driver` – Pile Driver                                | `breaker.multi_subroutine_break`                                                                                                                     |
| `onr_v1_059_self-modifying-code` – Self-Modifying Code                | `setup.install_support`                                                                                                                              |
| `onr_v1_066_snowball` – Snowball                                      | `breaker.scaling_strength`                                                                                                                           |
| `onr_v1_069_succubus` – Succubus                                      | `setup.program_host`                                                                                                                                 |
| `onr_v1_131_microtech-backup-drive` – Microtech Backup Drive          | `setup.program_backup`, `setup.program_trash_replacement`, `setup.stored_program_reclaim`                                                            |
| `onr_v1_142_record-reconstructor` – Record Reconstructor              | `access.rnd_topdeck_setup`, `corp.archives_to_rnd_pressure`, `run.archives_replacement_access`                                                       |

Die zwei derzeit nicht auf aktiven Karten vorkommenden offenen Definitionen
sind `breaker.subroutine_prevention` und `ice.recovery`.

Für jede der 24 Signalarten muss genau eine Entscheidung fallen:

- produktiver Consumer mit belegbarer Entscheidungswirkung,
- bewusste Ableitung in einen bereits konsumierten strukturierten Effect,
- oder ausdrückliche `no-runtime`-/Evidence-only-Policy.

Ein bloßer Katalogeintrag ohne einen dieser Verträge reicht nicht.

## D. Systematische Ontologie- und Consumer-Lücken

### D1. `strategySupportPairs`

Von 241 aktuellen Pair-Zuweisungen besitzen 125 einen belegten direkten
paarspezifischen Pfad. 116 Zuweisungen auf 110 Karten besitzen keinen solchen
Consumer. Die größten Gruppen sind:

| Pair                                    | Zuweisungen ohne direkten Pair-Consumer |
| --------------------------------------- | --------------------------------------: |
| `corp.ice_tax_glacier:tax_tool`         |                                      54 |
| `corp.ambush_bluff:punish_payoff`       |                                      13 |
| `corp.asset_economy:engine_anchor`      |                                       8 |
| `corp.remote_scoring:defensive_tool`    |                                       6 |
| `corp.central_stabilize:defensive_tool` |                                       4 |
| `corp.ice_tax_glacier:enabler`          |                                       4 |
| `corp.draw_engine:engine_anchor`        |                                       3 |
| `corp.ice_tax_glacier:payoff_anchor`    |                                       3 |
| fünf Gruppen mit jeweils 2 Zuweisungen  |                                      10 |
| elf Gruppen mit jeweils 1 Zuweisung     |                                      11 |
| **Gesamt**                              |                                 **116** |

Die Karten können über `lineSupport`, `effects` oder spezialisierte Heuristiken
trotzdem sinnvoll behandelt werden. Der Befund lautet deshalb nicht „110
defekte Karten“, sondern „116 Pair-Metadaten ohne klaren eigenen Vertrag“.
Vor Einzeländerungen ist zu entscheiden, ob Pairs allgemeine Doctrine-/Plan-
Gewichtung erhalten oder als redundante Evidence entfernt beziehungsweise
ausdrücklich nicht-runtimewirksam markiert werden.

### D2. `valueHints`

Produktiv und schlüsselspezifisch gelesen werden derzeit vor allem `damage`,
`economy`, `installCreditGain`, `startOfTurnCreditLoss` und
`leavePlayPayCost`. Auf Runner-Seite existieren daneben 374 Zuweisungen auf
282 Karten mit anderen Schlüsseln und ohne schlüsselspezifischen Consumer.
Die größten Gruppen sind:

| Schlüssel                  | Zuweisungen |
| -------------------------- | ----------: |
| `runPressure`              |          76 |
| `utility`                  |          50 |
| `rigCoverage`              |          41 |
| `perCardLongtailPriority`  |          30 |
| `tempo`                    |          19 |
| `information`              |          17 |
| `survival`                 |          16 |
| `memory`                   |          10 |
| `link`                     |           9 |
| `consistency`              |           8 |
| übrige Long-Tail-Schlüssel |          98 |
| **Gesamt**                 |     **374** |

Zusätzlich nutzt die Corp-Remote-Bewertung an einer Stelle generisch das
Maximum aus `Object.values(valueHints)`. Dadurch können semantisch
unterschiedliche Zahlen unbeabsichtigt denselben Root-/Trashwert beeinflussen.
Empfehlung ist ein typisierter Value-Vertrag oder die Entfernung nicht
konsumierter Werte, nicht ein weiterer generischer Zahlenkonsument.

### D3. Evidence-only-Felder

`requiredMechanics` wird außerhalb der Daten-/Gate-Pfade nur in einem engen
Doctrine-Memory-Fall direkt produktiv gelesen; `scenarioRefs` besitzt keinen
Runtime-Konsumenten. Beide Felder dürfen weiter wertvolle Nachweise sein, müssen
dann aber ausdrücklich als Evidence-only gelten. Sie dürfen nicht den Eindruck
erwecken, ihre bloße Anwesenheit beeinflusse die KI-Entscheidung.

## E. Testset getrennt normalisieren

Das Testset ist absichtlich synthetisch, wird aber im selben kompilierten
Bestand gezählt. Mindestens diese zehn Einträge transportieren eine nicht aus
dem Kartensinn ableitbare Planrolle:

- `corp_identity_001`: leere Testidentität mit `build_scoring_remote`.
- `runner_identity_001`: leere Testidentität mit `build_rig`.
- `simple_run_event`: freie Serverwahl mit `pressure_rnd`.
- `v08_overclock_run_event`: freie Serverwahl mit `pressure_rnd`.
- `simple_setup_hardware`: reine Memory-Erhöhung mit `safe_probe_run`.
- `v08_memory_chip`: reine Memory-Erhöhung mit `safe_probe_run`.
- `simple_draw_operation`: Corp-Draw mit `recover_economy`.
- `v08_archive_planning`: Corp-Draw mit `recover_economy`.
- `simple_tag_punishment_operation`: Runner-Creditverlust bei Tag mit
  `recover_economy`.
- `simple_upgrade`: Upgrade ohne Fähigkeit mit `recover_economy`.

Diese Bereinigung ist nachrangig gegenüber produktiven Karten, aber wichtig,
damit Fixture-Rauschen keine Qualitätsstatistiken und keine neuen Ableitungen
verfälscht.

## Empfohlene Maßnahmenpakete

### Paket 1 – eindeutige Semantikkorrekturen

- Die 17 Karten aus Abschnitt A ändern.
- Für jede Änderung Kartentext, aktiven Hint, kompilierten Hint, Derived Facts
  und den produktiven Consumer gemeinsam testen.
- Kritische Spezialfälle mit Decision-Checkpoints absichern: Trace ohne Tag,
  HQ statt R&D, Breaker-Coverage, Multiaccess und Programmtrash.

### Paket 2 – strukturierter Transport für 28 Karten

- Die 28 Karten aus Abschnitt B in kleine Familien schneiden: Agenden,
  Damage-/Tag-/Trace-ICE, ETR-/Modus-ICE und Random-/Run-Rewind-ICE.
- Rohsignale nicht blind in Effects kopieren; Scope, Timing, Target, Condition
  und Beträge aus Kartentext und Engine-Vertrag ableiten.
- Danach prüfen, ob bisherige Spezialkonsumenten noch nötig oder redundant sind.

### Paket 3 – 24 offene Taktiksignalverträge

- Zuerst die 22 aktiv verwendeten Signalarten und 33 Zuweisungen entscheiden.
- Breaker-Coverage, Emergency-Search/Install, Hosting und
  Archives-Replacement priorisieren.
- Für `breaker.subroutine_prevention` und `ice.recovery` entweder eine klare
  zukünftige Policy dokumentieren oder die unbenutzte Definition entfernen.

### Paket 4 – Ontologieentscheidung

- Für `strategySupportPairs` festlegen: allgemeiner Consumer oder
  Evidence-only/Entfernung.
- Für `valueHints` einen geschlossenen Schlüsselvertrag definieren und den
  generischen `Object.values`-Pfad ersetzen.
- `requiredMechanics` und `scenarioRefs` ausdrücklich als Runtime- oder
  Evidence-Felder klassifizieren.

### Paket 5 – Qualitäts- und Target-Restbestand

- Die 32 zurückgestellten Inspector-Fälle und 88 Target-Profile-Gaps
  nachziehen.
- Die 156 Singleton-/Synonymwarnungen familienweise normalisieren, nicht durch
  neue Einzelbegriffe weiter vermehren.
- Testset separat bereinigen und danach Qualitätsmarkierungen neu erzeugen.

## Umsetzungsgates

Die spätere Umsetzung gilt erst als abgeschlossen, wenn mindestens folgende
Nachweise grün sind:

1. aktive Hints, Compiled Hints, Inspector und Derived Facts sind synchron;
2. jede geänderte Semantik besitzt einen nachweisbaren Consumer oder eine
   ausdrückliche Evidence-only-/No-runtime-Policy;
3. fokussierte Karten-, Action-Candidate-, Plan- und Decision-Checkpoint-Tests
   sind grün;
4. Hint-Quality-, Taktiksignal-Consumer-, Semantic-Signal- und vollständige
   AI-Gates sind grün;
5. nach der statischen Korrektur wird die feste AI Behavior Baseline mit exakt
   dokumentierter Konfiguration erneut ausgeführt und gegen den vorherigen
   Kandidaten verglichen.

Der aktuelle vollständige `check:ai`-Lauf erreicht die Hint-/Katalogteile,
scheitert auf `main` jedoch an zwei bereits vorhandenen
Source-Structure-Grenzen in Corp-Scoring-Dateien. Das ist kein Befund dieser
Dokumentationsänderung, muss vor einem späteren Endabschluss aber entweder
behoben oder bewusst als getrennte Baseline behandelt werden.

## Empfohlener nächster Beschluss

Empfohlen ist, Paket 1 bis 3 als ersten Worktree-Prozess freizugeben und Paket
4 davor auf zwei kurze Architekturentscheidungen zu begrenzen:

1. Nicht konsumierte Metadaten werden entweder produktiv gemacht oder
   ausdrücklich Evidence-only; stillschweigend wirkungslose Hints bleiben
   nicht zulässig.
2. Testset-Bereinigung bleibt ein eigenes, nachrangiges Paket und blockiert
   die produktiven Kartensets nicht.

Nach dieser Rücksprache kann der `release-implementation-agent` die
beschlossenen Pakete im Worktree sequenziell umsetzen. Bis dahin bleibt dieser
Review die Maßnahmenliste; es gibt absichtlich keine Hint- oder Runtime-
Änderung.
