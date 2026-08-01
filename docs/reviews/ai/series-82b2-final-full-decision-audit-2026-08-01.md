# Serie 82b2 – vollständiges KI-Decision-Audit

Datum: 01.08.2026  
Serie: `series_82b2d391315f055b`  
Status: vollständig analysiert; fünf freigabereife Findings

## Ergebnis zuerst

Beide Spiele wurden über die vollständigen gespeicherten KI-Entscheidungen
side-sicher rekonstruiert und einzeln klassifiziert. Der Nenner ist
`267/267`:
`104/104` Runner-Entscheidungen und
`163/163` Corp-Entscheidungen. Es gibt
keine fehlenden, verwaisten, doppelten oder einer falschen StateVersion
zugeordneten Decision-Traces.

Die vier Nutzerfunde sind bestätigt. Das Audit hat genau ein weiteres,
eigenständiges Problem gefunden: Der aktive Broker-Hint bildet den von der
Engine angebotenen Hosted-Credit-Zuwachs um 3 nicht im generischen Poolvertrag
ab. Andere auffällige Entscheidungen waren legal und auf Basis des sichtbaren
Wissens plausibel oder nicht stark genug für eine Activity.

## Match-Metadaten und Denominator

| Match | Modus | KI | Ergebnis | End-State | Coverage |
|---|---|---|---|---:|---:|
| `match_550e1860213fbef4` | `human_corp_vs_runner_ai` | Runner, `runner-ai-v0.9-hard` | Corp gewinnt durch Agenda-Punkte | SV204 / `fnv1a:8b587948` | 104/104 |
| `match_1bad991988b099b8` | `human_runner_vs_corp_ai` | Corp, `corp-ai-v0.9-hard` | Runner gewinnt durch Agenda-Punkte | SV425 / `fnv1a:aec68ab9` | 163/163 |

Quelle war ein ausdrücklich freigegebener, kurzlebiger Read-only-Zugriff auf
die lokale Runtime-SQLite. Für jede Decision wurden PlayerView und LegalActions
der historischen KI-Seite neu erzeugt. Vollständige GameStates, gegnerische
Hidden-Info und rohe Trace-Payloads sind nicht in diesem Review persistiert.

## Freigabereife Findings und Maßnahmen

### F1 – All-Nighter bindet den Bonus-Run, rankt das Ziel aber nicht

- Evidence: Runner D2/SV7 spielt All-Nighter auf R&D; D3–D4 konvertieren den
  Run und trashen Vapor Ops. D5/SV10 wählt danach `Bonus-Run auf Archives`,
  obwohl das bekannte Archives keinen neuen Payoff enthält und R&D frisch ist.
- Ursache: `runner.convert_run_window` bleibt der richtige Owner der
  gebundenen Folgeauswahl, bewertet aber jede Restricted-Run-LegalAction mit
  demselben pauschalen Wert 250.
- Maßnahme: Nur innerhalb dieser bestehenden Continuation serverbezogene,
  side-sichere Run-Value-Signale verwenden; actionId, Executor und
  `PlanExecutionOrigin` bleiben unverändert.
- Activity: `act-2026-08-01-runner-all-nighter-bonus-run-target-ranking`.

### F2 – Broker erreicht 12 Credits, bleibt aber trotz Fundingbedarf ungenutzt

- Evidence: D8/SV13, D33/SV58, D44/SV79 und D49/SV90 laden dieselbe
  Broker-Instanz bis 12. Ab D53 bis D101 werden wiederholt einzelne Credits
  genommen, obwohl `Broker: Credits von Broker nehmen` legal bleibt. Besonders
  deutlich sind D84 und D99–D101: Die KI finanziert einen zweiten Broker oder
  Rigteile, während der erste voll ist.
- Ursache: Der Credit-Bank-Owner hält beim Value-Target weiter, weil der
  Fundingvertrag nur einen zu engen unmittelbaren Run-Funding-Fall als
  Cashoutgrund erkennt. Entwicklungspläne können den legalen Bank-Cashout nicht
  als typisierte Finanzierung anfordern.
- Maßnahme: Den bestehenden `runner.credit_bank`-Owner um einen generischen,
  gebundenen Development-/Plan-Fundingbedarf ergänzen; kein Cashout-Resolver und
  kein paralleler Economy-Chooser.
- Activity: `act-2026-08-01-runner-broker-cashout-after-value-target`.

### F3 – R&D-Schichten werden einzeln statt als gemeinsamer Rezpfad bewertet

- Evidence 1: Corp D54/SV103 rezzt Keeper auf R&D bei 13 Credits; D57/SV113
  lehnt die innere Data Wall bei 9 Credits als threatlos/unknown ab.
- Evidence 2: D77/SV153 legt Fire Wall als weitere R&D-Schicht; D92/SV193
  lehnt Fire Wall bei 11 Credits ab, D93/SV196 rezzt anschließend Data Wall.
- Einordnung: Die Corp rezzt im Match mehrfach sinnvoll ICE. Das Finding ist
  nicht „rezzt nie“, sondern die fehlende kombinierte Pfadbewertung genau dieser
  gestaffelten Encounter-Sequenzen.
- Maßnahme: `corp.defend_servers` bleibt alleiniger Owner und bewertet den
  sichtbaren Restpfad samt bereits rezzbaren/rezzten Schichten, statt nur den
  isolierten aktuellen ICE-Exchange zu betrachten.
- Activity: `act-2026-08-01-corp-rd-layered-rez-sequence`.

### F4 – Vapor Ops pendelt zwischen zwei widersprüchlichen Planownern

- Evidence: D133 installiert `corp.ambush_and_bluff` Vapor Ops als Decoy für
  Marine Arcology und D134 advanced. D135–D136 übernimmt
  `corp.score_agenda`, rezzt und liquidiert den Counter. D137 advanced der
  Ambush-Owner dieselbe Instanz erneut. Das Advance/Cashout-Pendel wiederholt
  sich bei D142–D146, D149/D151 sowie D156–D161.
- Ursache: Zwei bestehende Owner reservieren dieselbe Karteninstanz ohne
  gemeinsamen Zweck-/Handoffvertrag. Beide lokalen Aktionen sind legal, die
  kombinierte Linie verbrennt jedoch wiederholt Clicks ohne Nettowert.
- Maßnahme: Die Karteninstanz bekommt genau einen aktiven Zweck. Score-/Bank-
  Reservation und Handoff werden am bestehenden Score-/Ambush-Planvertrag
  ausgedrückt; es entsteht kein dritter Owner.
- Activity: `act-2026-08-01-corp-vapor-ops-cross-plan-loop`.

### F5 – Broker-Hint verletzt den Hosted-Credit-Consumervertrag

- Evidence: Der Runner-Deck-Audit meldet für `onr_v1_154_broker`
  `hosted_credit_add_hint_mismatch`: Engine-Mengen `[3]`, aktive
  Hint-Pool-Mengen `[]`.
- Ursache: Der spezielle Economy-Hint beschreibt Bank-Load/Cashout, aber der
  generische Hosted-Credit-Consumer kann die Engine-Aufladung nicht gegen einen
  passenden Hint-Pool abgleichen.
- Maßnahme: Den aktiven Hintvertrag minimal ergänzen und mit Hint-, Economy-
  sowie vollständigem Deck-Consumer-Audit sichern. Das ändert keine
  Verhaltensownership.
- Activity: `act-2026-08-01-runner-broker-hosted-credit-hint-contract`.

## Deck-Hint-/Consumer-Audit

| KI-Deck | Karten | Strategien/Capabilities | Ergebnis |
|---|---:|---|---|
| Runner „Redline Riot“ | 22 Definitionen / 45 Karten | primär `runner.interface_closeout`, `runner.run_event_tempo`, `runner.hq_pressure`; Broker als Banktool; Temple Microcode Outlet als Searchtool | **fehlgeschlagen:** genau F5, keine Warnungen |
| Corp „Fast Advance, Baby“ | 28 Definitionen / 45 Karten | primär `corp.ice_tax_glacier`, `corp.fast_advance`, `corp.overadvance_value`; BBS Whispering Campaign als Bank-/Campaigntool | **grün:** keine Blocker, keine Warnungen |

Beide behavior checkpoints bestanden vor dem Consumer-Audit ohne Drift. Das
bestätigt, dass F5 ein Hint-/Datenvertrag und kein zweiter Verhaltensfehler ist.

## Nicht freigabereife Beobachtungen

- Runner D66/SV125 spielt Private LDL Access auf HQ. Der sichtbare äußere Dog
  Pile war schwach, die innere Caryatid aber noch verdeckt. Der Run war daher
  ein legaler, plausibler Informations-/Facecheck und darf nicht mit späterem
  Hidden-Info-Wissen rückwirkend als Fehler gewertet werden.
- Einzelne Corp-Draws mit späterem Discard sind bei fünf Agenda-Punkten und der
  Suche nach Score-/Defense-Abschluss nicht klar dominiert.
- Späte nicht gerezzte R&D-Schichten fallen teilweise in echte
  Ressourcenknappheit. Daraus folgt keine pauschale „alles rezzen“-Maßnahme.
- Positive Kontrolle: Corp-Scorelinien zu Project Zurich, Project Babylon und
  Marine Arcology sowie die wiederholte BBS-Auszahlung sind kohärent. Das deckt
  sich mit der Nutzerbeobachtung, dass die Corp insgesamt deutlich besser
  spielt.

## Vollständige Decision Coverage – Match 1 (Runner-KI)

Die Alternative ist bei plausiblen Zeilen die erste sichtbare nicht gewählte
LegalAction, nicht die Behauptung, dass sie stärker gewesen wäre.

| Decision | State | Turn | Timing | gewählt | beste sichtbare Alternative | Status | Begründung |
|---:|---:|---:|---|---|---|---|---|
| D1 | SV0 | T1 | setup.mulligan.runner | Runner-Starthand | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D2 | SV7 | T2 | runner_action.main | All-Nighter auf R&D | 1 Credit nehmen | plausibel | Plausibler Pressure-, Informations- oder Contest-Run aus side-sicherem Wissen. |
| D3 | SV8 | T2 | access.resolve_card | Karte accessen | keine eigenständige sichtbare Alternative | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D4 | SV9 | T2 | access.resolve_card | Vapor Ops trashen | Nicht trashen | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D5 | SV10 | T2 | runner_action.main | Bonus-Run auf Archives | Bonus-Run auf R&D | Finding F1 | Alle gebundenen Bonus-Runs erhalten pauschal Wert 250; Archives gewinnt ohne bekannten neuen Payoff gegen das frische R&D. |
| D6 | SV11 | T2 | runner_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D7 | SV12 | T2 | runner_action.main | Broker installieren | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D8 | SV13 | T2 | runner_action.main | Broker: 3 Credits auf Broker legen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D9 | SV14 | T2 | runner_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D10 | SV20 | T4 | runner_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D11 | SV21 | T4 | runner_action.main | Run auf Remote 1 | 1 Credit nehmen | plausibel | Plausibler Pressure-, Informations- oder Contest-Run aus side-sicherem Wissen. |
| D12 | SV23 | T4 | run.encounter_ice | Subroutinen auslösen (Run endet) | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D13 | SV24 | T4 | runner_action.main | Run auf R&D | 1 Credit nehmen | plausibel | Plausibler Pressure-, Informations- oder Contest-Run aus side-sicherem Wissen. |
| D14 | SV25 | T4 | access.resolve_card | Karte accessen | keine eigenständige sichtbare Alternative | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D15 | SV26 | T4 | access.resolve_card | Nicht trashen | keine eigenständige sichtbare Alternative | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D16 | SV27 | T4 | runner_action.main | Run auf HQ | 1 Credit nehmen | plausibel | Plausibler Pressure-, Informations- oder Contest-Run aus side-sicherem Wissen. |
| D17 | SV29 | T4 | run.encounter_ice | Subroutinen auslösen (Run endet) | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D18 | SV30 | T4 | runner_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D19 | SV37 | T6 | runner_action.main | Run auf R&D | 1 Credit nehmen | plausibel | Plausibler Pressure-, Informations- oder Contest-Run aus side-sicherem Wissen. |
| D20 | SV38 | T6 | access.resolve_card | Karte accessen | keine eigenständige sichtbare Alternative | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D21 | SV39 | T6 | access.resolve_card | Project Babylon stehlen | keine eigenständige sichtbare Alternative | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D22 | SV40 | T6 | runner_action.main | Run auf R&D | 1 Credit nehmen | plausibel | Plausibler Pressure-, Informations- oder Contest-Run aus side-sicherem Wissen. |
| D23 | SV41 | T6 | access.resolve_card | Karte accessen | keine eigenständige sichtbare Alternative | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D24 | SV42 | T6 | access.resolve_card | Setup! trashen | Nicht trashen | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D25 | SV43 | T6 | runner_action.main | Bodyweight™ Synthetic Blood spielen | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D26 | SV44 | T6 | runner_action.main | Run auf R&D | 1 Credit nehmen | plausibel | Plausibler Pressure-, Informations- oder Contest-Run aus side-sicherem Wissen. |
| D27 | SV45 | T6 | access.resolve_card | Karte accessen | keine eigenständige sichtbare Alternative | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D28 | SV46 | T6 | runner_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D29 | SV52 | T7 | corp_action.main | Security Purge: die aufgedeckten R&D-Karten ansehen. | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D30 | SV55 | T8 | runner_action.main | Krash installieren | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D31 | SV56 | T8 | runner_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D32 | SV57 | T8 | runner_action.main | Bodyweight™ Synthetic Blood spielen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D33 | SV58 | T8 | runner_action.main | Broker: 3 Credits auf Broker legen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D34 | SV59 | T8 | runner_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D35 | SV60 | T8 | runner_discard.select_cards | Runner-Discard wählen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D36 | SV66 | T10 | runner_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D37 | SV67 | T10 | runner_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D38 | SV68 | T10 | runner_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D39 | SV69 | T10 | runner_action.main | MIT West Tier spielen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D40 | SV70 | T10 | runner_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D41 | SV76 | T12 | runner_action.main | Livewire's Contacts spielen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D42 | SV77 | T12 | runner_action.main | Bodyweight™ Synthetic Blood spielen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D43 | SV78 | T12 | runner_action.main | Livewire's Contacts spielen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D44 | SV79 | T12 | runner_action.main | Broker: 3 Credits auf Broker legen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D45 | SV80 | T12 | runner_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D46 | SV81 | T12 | runner_discard.select_cards | Runner-Discard wählen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D47 | SV88 | T14 | runner_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D48 | SV89 | T14 | runner_action.main | WuTech Mem Chip installieren | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D49 | SV90 | T14 | runner_action.main | Broker: 3 Credits auf Broker legen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D50 | SV91 | T14 | runner_action.main | Temple Microcode Outlet spielen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D51 | SV92 | T14 | runner_action.main | Stack durchsuchen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D52 | SV93 | T14 | runner_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D53 | SV99 | T16 | runner_action.main | 1 Credit nehmen | Broker: Credits von Broker nehmen | Finding F2 | Der Broker steht bei 12 Credits, bleibt legal auszahlbar und wird dennoch zugunsten einzelner Funding-Credits gehalten. |
| D54 | SV100 | T16 | runner_action.main | Karte ziehen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D55 | SV101 | T16 | runner_action.main | Inside Job auf R&D | 1 Credit nehmen | plausibel | Plausibler Pressure-, Informations- oder Contest-Run aus side-sicherem Wissen. |
| D56 | SV103 | T16 | run.jack_out_window | Run fortsetzen | Jack-out | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D57 | SV105 | T16 | access.resolve_card | Karte accessen | keine eigenständige sichtbare Alternative | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D58 | SV106 | T16 | access.resolve_card | Project Venice stehlen | keine eigenständige sichtbare Alternative | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D59 | SV107 | T16 | runner_action.main | 1 Credit nehmen | Broker: Credits von Broker nehmen | Finding F2 | Der Broker steht bei 12 Credits, bleibt legal auszahlbar und wird dennoch zugunsten einzelner Funding-Credits gehalten. |
| D60 | SV108 | T16 | runner_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D61 | SV114 | T18 | runner_action.main | 1 Credit nehmen | Broker: Credits von Broker nehmen | Finding F2 | Der Broker steht bei 12 Credits, bleibt legal auszahlbar und wird dennoch zugunsten einzelner Funding-Credits gehalten. |
| D62 | SV115 | T18 | runner_action.main | Karte ziehen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D63 | SV116 | T18 | runner_action.main | 1 Credit nehmen | Broker: Credits von Broker nehmen | Finding F2 | Der Broker steht bei 12 Credits, bleibt legal auszahlbar und wird dennoch zugunsten einzelner Funding-Credits gehalten. |
| D64 | SV117 | T18 | runner_action.main | Score! spielen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D65 | SV118 | T18 | runner_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D66 | SV125 | T20 | runner_action.main | Private LDL Access auf HQ | 1 Credit nehmen | plausibel | Plausibler Pressure-, Informations- oder Contest-Run aus side-sicherem Wissen. |
| D67 | SV128 | T20 | run.encounter_ice | Subroutinen auslösen (Run endet) | Krash: Stärke +1 | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D68 | SV129 | T20 | runner_action.main | Cyfermaster™ installieren | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D69 | SV130 | T20 | runner_action.main | Karte ziehen | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D70 | SV131 | T20 | runner_action.main | Run auf R&D | 1 Credit nehmen | plausibel | Plausibler Pressure-, Informations- oder Contest-Run aus side-sicherem Wissen. |
| D71 | SV133 | T20 | run.encounter_ice | Cyfermaster™: Subroutine brechen | Krash: Stärke +1 | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D72 | SV134 | T20 | run.encounter_ice | ICE passieren | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D73 | SV135 | T20 | run.jack_out_window | Run fortsetzen | Jack-out | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D74 | SV137 | T20 | access.resolve_card | Karte accessen | keine eigenständige sichtbare Alternative | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D75 | SV138 | T20 | access.resolve_card | Nicht trashen | keine eigenständige sichtbare Alternative | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D76 | SV139 | T20 | runner_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D77 | SV146 | T22 | runner_action.main | 1 Credit nehmen | Broker: Credits von Broker nehmen | Finding F2 | Der Broker steht bei 12 Credits, bleibt legal auszahlbar und wird dennoch zugunsten einzelner Funding-Credits gehalten. |
| D78 | SV147 | T22 | runner_action.main | MIT West Tier spielen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D79 | SV148 | T22 | runner_action.main | 1 Credit nehmen | Broker: Credits von Broker nehmen | Finding F2 | Der Broker steht bei 12 Credits, bleibt legal auszahlbar und wird dennoch zugunsten einzelner Funding-Credits gehalten. |
| D80 | SV149 | T22 | runner_action.main | Inside Job auf R&D | 1 Credit nehmen | plausibel | Plausibler Pressure-, Informations- oder Contest-Run aus side-sicherem Wissen. |
| D81 | SV151 | T22 | run.jack_out_window | Run fortsetzen | Jack-out | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D82 | SV153 | T22 | access.resolve_card | Karte accessen | keine eigenständige sichtbare Alternative | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D83 | SV154 | T22 | runner_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D84 | SV160 | T24 | runner_action.main | 1 Credit nehmen | Broker: Credits von Broker nehmen | Finding F2 | Der Broker steht bei 12 Credits, bleibt legal auszahlbar und wird dennoch zugunsten einzelner Funding-Credits gehalten. |
| D85 | SV161 | T24 | runner_action.main | Karte ziehen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D86 | SV162 | T24 | runner_action.main | 1 Credit nehmen | Broker: Credits von Broker nehmen | Finding F2 | Der Broker steht bei 12 Credits, bleibt legal auszahlbar und wird dennoch zugunsten einzelner Funding-Credits gehalten. |
| D87 | SV163 | T24 | runner_action.main | 1 Credit nehmen | Broker: Credits von Broker nehmen | Finding F2 | Der Broker steht bei 12 Credits, bleibt legal auszahlbar und wird dennoch zugunsten einzelner Funding-Credits gehalten. |
| D88 | SV164 | T24 | runner_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D89 | SV170 | T26 | runner_action.main | 1 Credit nehmen | Broker: Credits von Broker nehmen | Finding F2 | Der Broker steht bei 12 Credits, bleibt legal auszahlbar und wird dennoch zugunsten einzelner Funding-Credits gehalten. |
| D90 | SV171 | T26 | runner_action.main | Inside Job auf R&D | 1 Credit nehmen | plausibel | Plausibler Pressure-, Informations- oder Contest-Run aus side-sicherem Wissen. |
| D91 | SV174 | T26 | run.jack_out_window | Run fortsetzen | Jack-out | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D92 | SV177 | T26 | run.encounter_ice | Cyfermaster™: Subroutine brechen | Krash: Stärke +1 | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D93 | SV178 | T26 | run.encounter_ice | ICE passieren | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D94 | SV179 | T26 | run.jack_out_window | Run fortsetzen | Jack-out | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D95 | SV181 | T26 | access.resolve_card | Karte accessen | keine eigenständige sichtbare Alternative | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D96 | SV182 | T26 | runner_action.main | 1 Credit nehmen | Broker: Credits von Broker nehmen | Finding F2 | Der Broker steht bei 12 Credits, bleibt legal auszahlbar und wird dennoch zugunsten einzelner Funding-Credits gehalten. |
| D97 | SV183 | T26 | runner_action.main | Karte ziehen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D98 | SV184 | T26 | runner_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D99 | SV191 | T28 | runner_action.main | 1 Credit nehmen | Broker: Credits von Broker nehmen | Finding F2 | Der Broker steht bei 12 Credits, bleibt legal auszahlbar und wird dennoch zugunsten einzelner Funding-Credits gehalten. |
| D100 | SV192 | T28 | runner_action.main | 1 Credit nehmen | Broker: Credits von Broker nehmen | Finding F2 | Der Broker steht bei 12 Credits, bleibt legal auszahlbar und wird dennoch zugunsten einzelner Funding-Credits gehalten. |
| D101 | SV193 | T28 | runner_action.main | 1 Credit nehmen | Broker: Credits von Broker nehmen | Finding F2 | Der Broker steht bei 12 Credits, bleibt legal auszahlbar und wird dennoch zugunsten einzelner Funding-Credits gehalten. |
| D102 | SV194 | T28 | runner_action.main | Run auf Archives | 1 Credit nehmen | plausibel | Plausibler Pressure-, Informations- oder Contest-Run aus side-sicherem Wissen. |
| D103 | SV195 | T28 | run.jack_out_window | Run fortsetzen | Jack-out | plausibel | Gebundene Run-/Access-Fortsetzung mit sichtbarem aktuellem Runzustand. |
| D104 | SV197 | T28 | runner_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |

## Vollständige Decision Coverage – Match 2 (Corp-KI)

| Decision | State | Turn | Timing | gewählt | beste sichtbare Alternative | Status | Begründung |
|---:|---:|---:|---|---|---|---|---|
| D1 | SV1 | T1 | setup.mulligan.corp | Korp-Starthand | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D2 | SV2 | T1 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D3 | SV3 | T1 | corp_action.main | ICE vor R&D installieren | 1 Credit nehmen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D4 | SV4 | T1 | corp_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D5 | SV5 | T1 | corp_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D6 | SV6 | T1 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D7 | SV13 | T3 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D8 | SV14 | T3 | corp_action.main | ICE vor HQ installieren | 1 Credit nehmen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D9 | SV15 | T3 | corp_action.main | Karte ziehen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D10 | SV16 | T3 | corp_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D11 | SV17 | T3 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D12 | SV18 | T3 | corp_discard.select_cards | Korp-Discard wählen | keine eigenständige sichtbare Alternative | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D13 | SV24 | T5 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D14 | SV25 | T5 | corp_action.main | ICE vor R&D installieren | 1 Credit nehmen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D15 | SV26 | T5 | corp_action.main | Karte ziehen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D16 | SV27 | T5 | corp_action.main | Karte in neuem Remote installieren | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D17 | SV28 | T5 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D18 | SV33 | T6 | run.approach_ice | Caryatid als wall rezzen | ICE nicht rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D19 | SV34 | T6 | run.approach_ice | Keine weitere Karte rezzen / Begegnung beginnen | BBS Whispering Campaign in Remote 1 rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D20 | SV37 | T7 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D21 | SV38 | T7 | corp_action.main | Karte in Remote 1 rezzen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D22 | SV39 | T7 | corp_action.main | BBS Whispering Campaign: 2 Credits nehmen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D23 | SV40 | T7 | corp_action.main | BBS Whispering Campaign: 2 Credits nehmen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D24 | SV41 | T7 | corp_action.main | BBS Whispering Campaign: 2 Credits nehmen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D25 | SV42 | T7 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D26 | SV43 | T7 | corp_discard.select_cards | Korp-Discard wählen | keine eigenständige sichtbare Alternative | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D27 | SV50 | T9 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D28 | SV51 | T9 | corp_action.main | ICE vor HQ installieren | 1 Credit nehmen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D29 | SV52 | T9 | corp_action.main | Karte in neuem Remote installieren | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D30 | SV53 | T9 | corp_action.main | Karte ziehen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D31 | SV54 | T9 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D32 | SV57 | T10 | run.approach_ice | Filter rezzen | ICE nicht rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D33 | SV58 | T10 | run.approach_ice | Keine weitere Karte rezzen / Begegnung beginnen | Setup! in Remote 2 rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D34 | SV62 | T10 | run.movement_rez_window | Nichts rezzen / Weiter | Setup! in Remote 2 rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D35 | SV63 | T10 | run.approach_ice | Keine weitere Karte rezzen / Begegnung beginnen | Setup! in Remote 2 rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D36 | SV70 | T11 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D37 | SV71 | T11 | corp_action.main | Accounts Receivable spielen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D38 | SV72 | T11 | corp_action.main | BBS Whispering Campaign: 2 Credits nehmen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D39 | SV73 | T11 | corp_action.main | BBS Whispering Campaign: 2 Credits nehmen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D40 | SV74 | T11 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D41 | SV80 | T13 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D42 | SV81 | T13 | corp_action.main | BBS Whispering Campaign: 2 Credits nehmen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D43 | SV82 | T13 | corp_action.main | BBS Whispering Campaign: 2 Credits nehmen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D44 | SV83 | T13 | corp_action.main | BBS Whispering Campaign: 2 Credits nehmen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D45 | SV84 | T13 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D46 | SV85 | T13 | corp_discard.select_cards | Korp-Discard wählen | keine eigenständige sichtbare Alternative | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D47 | SV91 | T15 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D48 | SV92 | T15 | corp_action.main | ICE vor Remote 2 installieren | 1 Credit nehmen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D49 | SV93 | T15 | corp_action.main | ICE vor HQ installieren | 1 Credit nehmen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D50 | SV94 | T15 | corp_action.main | ICE vor Remote 1 installieren | 1 Credit nehmen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D51 | SV95 | T15 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D52 | SV97 | T16 | run.approach_ice | Keeper rezzen | ICE nicht rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D53 | SV98 | T16 | run.approach_ice | Keine weitere Karte rezzen / Begegnung beginnen | Setup! in Remote 2 rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D54 | SV103 | T16 | run.approach_ice | Keeper rezzen | ICE nicht rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D55 | SV104 | T16 | run.approach_ice | Keine weitere Karte rezzen / Begegnung beginnen | Setup! in Remote 2 rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D56 | SV112 | T16 | run.movement_rez_window | Nichts rezzen / Weiter | Setup! in Remote 2 rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D57 | SV113 | T16 | run.approach_ice | ICE nicht rezzen | Data Wall rezzen | Finding F3 | Der äußere/innere gemeinsame R&D-Verteidigungspfad wird nicht bewertet; die isolierte Schicht gilt fälschlich als ohne Defense-Threat. |
| D58 | SV115 | T16 | run.movement_rez_window | Nichts rezzen / Weiter | Setup! in Remote 2 rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D59 | SV120 | T17 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D60 | SV121 | T17 | corp_action.main | Accounts Receivable spielen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D61 | SV122 | T17 | corp_action.main | Karte in Remote 2 installieren | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D62 | SV123 | T17 | corp_action.main | Project Zurich in Remote 2 advancen | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D63 | SV124 | T17 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D64 | SV130 | T19 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D65 | SV131 | T19 | corp_action.main | Project Zurich in Remote 2 advancen | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D66 | SV132 | T19 | corp_action.main | Karte in Remote 1 installieren | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D67 | SV133 | T19 | corp_action.main | Project Zurich in Remote 2 advancen | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D68 | SV134 | T19 | corp_action.main | Agenda in Remote 2 scoren | Zug beenden | plausibel | Konkreter legaler Score-Fortschritt; kein besserer sichtbarer Abschlussweg. |
| D69 | SV135 | T19 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D70 | SV141 | T21 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D71 | SV142 | T21 | corp_action.main | Project Babylon in Remote 1 advancen | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D72 | SV143 | T21 | corp_action.main | Project Babylon in Remote 1 advancen | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D73 | SV144 | T21 | corp_action.main | Project Babylon in Remote 1 advancen | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D74 | SV145 | T21 | corp_action.main | Agenda in Remote 1 scoren | Zug beenden | plausibel | Konkreter legaler Score-Fortschritt; kein besserer sichtbarer Abschlussweg. |
| D75 | SV146 | T21 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D76 | SV152 | T23 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D77 | SV153 | T23 | corp_action.main | ICE vor R&D installieren | 1 Credit nehmen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D78 | SV154 | T23 | corp_action.main | Night Shift spielen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D79 | SV155 | T23 | corp_action.main | ICE vor Remote 2 installieren | 1 Credit nehmen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D80 | SV156 | T23 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D81 | SV160 | T24 | run.approach_ice | ICE nicht rezzen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D82 | SV174 | T25 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D83 | SV175 | T25 | corp_action.main | Karte ziehen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D84 | SV176 | T25 | corp_action.main | ICE vor Remote 1 installieren | 1 Credit nehmen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D85 | SV177 | T25 | corp_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D86 | SV178 | T25 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D87 | SV184 | T27 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D88 | SV185 | T27 | corp_action.main | Accounts Receivable spielen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D89 | SV186 | T27 | corp_action.main | Karte ziehen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D90 | SV187 | T27 | corp_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D91 | SV188 | T27 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D92 | SV193 | T28 | run.approach_ice | ICE nicht rezzen | Fire Wall rezzen | Finding F3 | Der äußere/innere gemeinsame R&D-Verteidigungspfad wird nicht bewertet; die isolierte Schicht gilt fälschlich als ohne Defense-Threat. |
| D93 | SV196 | T28 | run.approach_ice | Data Wall rezzen | ICE nicht rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D94 | SV203 | T29 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D95 | SV204 | T29 | corp_action.main | ICE vor R&D installieren | 1 Credit nehmen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D96 | SV205 | T29 | corp_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D97 | SV206 | T29 | corp_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D98 | SV207 | T29 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D99 | SV213 | T31 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D100 | SV214 | T31 | corp_action.main | Karte in Remote 1 installieren | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D101 | SV215 | T31 | corp_action.main | Systematic Layoffs spielen | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D102 | SV216 | T31 | corp_action.main | Advancement-Counter legen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D103 | SV217 | T31 | corp_action.main | Marine Arcology in Remote 1 advancen | 1 Credit nehmen | plausibel | Legal, ownergebunden und ohne nachweisbar dominierende sichtbare Alternative. |
| D104 | SV218 | T31 | corp_action.main | Agenda in Remote 1 scoren | Zug beenden | plausibel | Konkreter legaler Score-Fortschritt; kein besserer sichtbarer Abschlussweg. |
| D105 | SV219 | T31 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D106 | SV223 | T32 | run.approach_ice | Quandary rezzen | ICE nicht rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D107 | SV227 | T32 | run.approach_ice | ICE nicht rezzen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D108 | SV239 | T33 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D109 | SV240 | T33 | corp_action.main | Karte ziehen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D110 | SV241 | T33 | corp_action.main | Efficiency Experts spielen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D111 | SV242 | T33 | corp_action.main | ICE vor HQ installieren | 1 Credit nehmen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D112 | SV243 | T33 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D113 | SV250 | T34 | run.approach_ice | ICE nicht rezzen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D114 | SV262 | T35 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D115 | SV263 | T35 | corp_action.main | Karte ziehen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D116 | SV264 | T35 | corp_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D117 | SV265 | T35 | corp_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D118 | SV266 | T35 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D119 | SV273 | T36 | run.approach_ice | ICE nicht rezzen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D120 | SV286 | T37 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D121 | SV287 | T37 | corp_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D122 | SV288 | T37 | corp_action.main | ICE vor R&D installieren | 1 Credit nehmen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D123 | SV289 | T37 | corp_action.main | Karte ziehen | 1 Credit nehmen | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D124 | SV290 | T37 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D125 | SV291 | T37 | corp_discard.select_cards | Korp-Discard wählen | keine eigenständige sichtbare Alternative | plausibel | Plausibler Hand-/Boardentwicklungsschritt; keine klar dominierende sichtbare Route belegt. |
| D126 | SV295 | T38 | run.approach_ice | Filter rezzen | ICE nicht rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D127 | SV299 | T38 | run.approach_ice | ICE nicht rezzen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D128 | SV317 | T39 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D129 | SV318 | T39 | corp_action.main | Marine Arcology: Fähigkeit nutzen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D130 | SV319 | T39 | corp_action.main | 1 Credit nehmen | Karte ziehen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D131 | SV320 | T39 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D132 | SV326 | T41 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D133 | SV327 | T41 | corp_action.main | Karte in Remote 1 installieren | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D134 | SV328 | T41 | corp_action.main | Vapor Ops in Remote 1 advancen | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D135 | SV329 | T41 | corp_action.main | Karte in Remote 1 rezzen | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D136 | SV330 | T41 | corp_action.main | Vapor Ops: Advancement-Counter fuer 1 Credit ausgeben | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D137 | SV331 | T41 | corp_action.main | Vapor Ops in Remote 1 advancen | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D138 | SV332 | T41 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D139 | SV336 | T42 | run.approach_ice | ICE nicht rezzen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D140 | SV341 | T42 | run.approach_ice | ICE nicht rezzen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D141 | SV354 | T43 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D142 | SV355 | T43 | corp_action.main | Vapor Ops: Advancement-Counter fuer 1 Credit ausgeben | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D143 | SV356 | T43 | corp_action.main | Vapor Ops in Remote 1 advancen | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D144 | SV357 | T43 | corp_action.main | Efficiency Experts spielen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D145 | SV358 | T43 | corp_action.main | Vapor Ops: Advancement-Counter fuer 1 Credit ausgeben | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D146 | SV359 | T43 | corp_action.main | Vapor Ops in Remote 1 advancen | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D147 | SV360 | T43 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D148 | SV367 | T45 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D149 | SV368 | T45 | corp_action.main | Vapor Ops: Advancement-Counter fuer 1 Credit ausgeben | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D150 | SV369 | T45 | corp_action.main | Marine Arcology: Fähigkeit nutzen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D151 | SV370 | T45 | corp_action.main | Vapor Ops in Remote 1 advancen | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D152 | SV371 | T45 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D153 | SV375 | T46 | run.approach_ice | Dog Pile rezzen | ICE nicht rezzen | plausibel | Kohärenter Schritt des globalen Defense-Portfolios ohne belegte bessere Alternative. |
| D154 | SV383 | T46 | run.approach_ice | ICE nicht rezzen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D155 | SV396 | T47 | corp_draw.mandatory_draw | Korp Pflichtkarte ziehen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |
| D156 | SV397 | T47 | corp_action.main | Vapor Ops: Advancement-Counter fuer 1 Credit ausgeben | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D157 | SV398 | T47 | corp_action.main | Vapor Ops in Remote 1 advancen | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D158 | SV399 | T47 | corp_action.main | Karte in Remote 2 installieren | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D159 | SV400 | T47 | corp_action.main | Vapor Ops: Advancement-Counter fuer 1 Credit ausgeben | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D160 | SV401 | T47 | corp_action.main | Karte in Remote 2 rezzen | 1 Credit nehmen | plausibel | Konkrete Economy-Konversion oder planmäßiger Bankaufbau; im Zustand produktiv. |
| D161 | SV402 | T47 | corp_action.main | Vapor Ops in Remote 1 advancen | 1 Credit nehmen / kohärenten Ownerpfad beibehalten | Finding F4 | Ambush- und Score-Owner reservieren dieselbe Vapor-Ops-Instanz widersprüchlich; Advancement und Liquidation neutralisieren sich wiederholt. |
| D162 | SV403 | T47 | corp_action.main | Zug beenden | keine eigenständige sichtbare Alternative | plausibel | Clicks oder produktive LegalActions sind erschöpft. |
| D163 | SV415 | T48 | run.approach_ice | ICE nicht rezzen | keine eigenständige sichtbare Alternative | plausibel | Regel-/Engine-Fenster; keine strategische Zweitentscheidung sichtbar. |

## Abschluss der Analysephase

Alle 267 gespeicherten
KI-Entscheidungen sind aufgeführt. Findings F1–F4 benötigen spielgleiche rote
Decision-Checkpoints; F5 benötigt den bereits roten Deck-Consumer-Audit als
Datenvertrag-Evidence. Erst danach beginnt die sequenzielle Implementierung.
