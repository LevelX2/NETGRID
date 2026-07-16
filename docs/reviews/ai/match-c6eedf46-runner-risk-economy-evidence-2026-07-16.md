# Evidence: Match C6EEDF46 Runner-Risiko und Ökonomie 2026-07-16

Status: Analyse vollständig, Umsetzung freigegeben, Produktionscode noch
unverändert

## Match und Datenbasis

- Match: `match_c6eedf46e777c169`
- Modus: `human_corp_vs_runner_ai`
- Runner-KI: schwer
- Seed: `match-mrntutsk-jcopas`
- Endstand: StateVersion 22, StateHash `fnv1a:47e450de`
- Ergebnis: Korp gewinnt durch Flatline
- Runtime-SQLite:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`
- Datenumfang: 23 Events, 23 StateSnapshots, 1 GameState und 11
  AI-Decision-Traces
- Coverage: 11 erwartete Runner-KI-Entscheidungen, 11 passende Traces, keine
  fehlenden, verwaisten, doppelten oder typabweichenden Zuordnungen

Die SQLite-Datei wurde ausschließlich read-only geöffnet. Entscheidungsurteile
verwenden den damaligen Runner-PlayerView-, LegalAction-, Memory-, Plan- und
DecisionDebug-Kontext. Spätere öffentliche Ereignisse dienen nur der
Folgenanalyse.

## Öffentlicher Spielablauf

Die Korp installierte und rezzte eine ungeschützte BBS Whispering Campaign in
Remote 1 und nahm zweimal 2 Credits. Auf der Karte verblieben 12 Credits. Der
Runner trashte BBS für 4 Credits, lief anschließend auf das ungeschützte R&D,
griff auf Chicago Branch zu und ließ die Karte für 1 Credit liegen. Danach
spielte er Livewire’s Contacts für 3 Credits und installierte mit dem letzten
Klick Rigged Investments für 4 Credits. Er beendete den Zug mit 0 Credits und
3 Handkarten.

Erst im folgenden Korp-Zug wurden Chance Observation und anschließend Urban
Renewal öffentlich. Chance Observation erzeugte Trace 5; die Runner-KI konnte
mit 0 Credits und 0 Link nur `bid_0` wählen. Der erfolgreiche Trace gab einen
Tag, Urban Renewal verursachte 5 Meat Damage und beendete das Spiel durch
Flatline.

## Vollständige Decision-Coverage

| Decision | SV | Auswahl | Beste sichtbare Alternative | Status | Begründung |
| ---: | ---: | --- | --- | --- | --- |
| 1 | 0 | Mulligan-Hand behalten | Mulligan | plausibel | Ökonomie, Breaker, Multiaccess und kostenlose Trace-Abwehr ergeben eine spielbare Eröffnung. |
| 2 | 8 | Run auf Remote 1 | Rohscore-Sieger R&D-Run | plausibel | Die sichtbare ungeschützte BBS enthielt noch 12 Credits; Contest und anschließender Trash waren den Informations-/Agenda-Run wert. |
| 3 | 9 | BBS accessen | keine | plausibel/erzwungen | Genau eine LegalAction. |
| 4 | 10 | BBS für 4 trashen | Decline | plausibel | 4 Credits vernichten einen sichtbaren verbleibenden Korp-Pool von 12 Credits. |
| 5 | 11 | Run auf R&D | Livewire’s Contacts | plausibel | Freier R&D-Pfad, unbekannter Zugriff und noch zwei Folgeclicks rechtfertigen den Druck trotz 1 Credit. |
| 6 | 12 | Chicago Branch accessen | keine | plausibel/erzwungen | Genau eine LegalAction. |
| 7 | 13 | Chicago Branch nicht trashen | Trash für den letzten Credit | plausibel isoliert | Der Access-Consumer schützt eine Arbeitsreserve. Die Entscheidung wird erst durch D9 widersprüchlich. |
| 8 | 14 | Livewire’s Contacts spielen | Basis-Credit | plausibel | Sofortiger Nettoertrag 3 schlägt den Basis-Credit und ist unabhängig vom fehlerhaften Folgeplan richtig. |
| 9 | 15 | Rigged Investments installieren | Back Door, Draw, Credit, freie Druckaktion | Finding | Kosten 4 auf 0 Credits ohne unmittelbaren Ertrag; die eigene Reserve- und Risk-Control-Diagnose verbietet den Spend, wird aber von funded plan control überstimmt. |
| 10 | 16 | Zug beenden | keine | plausibel/erzwungen | Kein Klick mehr vorhanden; der Fehler liegt in D9. |
| 11 | 20 | Trace-Bid 0 | keine | plausibel/erzwungen | Mit 0 Credits und 0 Link enthält die Choice nur `bid_0`. |

## Finding F1: Verzögerte Ökonomie täuscht akute Liquidität vor

Rigged Investments kostet 4 Credits und zahlt erst zu Beginn späterer
Runner-Züge jeweils 1 Credit aus. Der aktive und kompilierte Hint beschreibt
das korrekt:

- `economy.installment_credit`
- `economy.turn_start_credit`
- Timing `persistent`

Die Action-Projektion erhält dagegen nur generische Signale:

- `effect:economy`
- `effect_timing:persistent`
- `effect_scope:runner`
- `economy.card`

`effect.target` wird nicht als Action-Signal erhalten. Die konkrete
Installationsaction ist `partial_projected` mit niedriger Confidence und null
Card-Context-Signalen. Die Handentwicklung klassifiziert anschließend jede
`economy_engine` beziehungsweise jedes `bank_tool` bei höchstens 2 Credits als
`acute`, ohne zwischen sofortigem Ertrag und späteren Raten zu unterscheiden.

Bei D8/SV14 erzeugt das einen Funding-Plan auf Rigged Investments. Livewire’s
Contacts ist zwar selbst korrekt gewählt, wird aber als Schritt zum Schließen
der reinen Installationskostenlücke interpretiert. Bei D9/SV15 reichen die 4
Credits exakt für die Karte, aber nicht für eine Restreserve.

## Finding F2: Reservevertrag und funded continuation widersprechen sich

Vor D9 meldet die KI:

- aktuelle Credits: 4
- Mindestfloor: 2
- gewünschte Reserve: 6
- unter Reserve: wahr
- Risk-Control-Ziel `maintain_credit_and_hand_buffer`: hohe Dringlichkeit
- `why_spend_allowed_despite_reserve:not_allowed`

Gleichzeitig lautet die Diagnose
`runner_credit_reserve_spending_would_drop:false`. Das Feld wird im aktuellen
Posture-Builder fest auf `false` gesetzt und ist nicht kandidatenbezogen.

Die persistente Installationsbewertung berechnet zwar 0 Credits nach der
Installation und vergibt eine Reserve-Strafe von -900. Generische
Economy-/Setup-Werte gleichen die Strafe aber bis zu `finalInstallFit:50` aus.
Damit bleibt Rigged Investments knapp positiv und erfüllt die aktuellen
Continuation-Gates.

Die relevante Auswahlkette bei D9:

- Rohscore R&D Interface: 2227, Kosten 4
- Rohscore HQ-Run: 1149, Kosten 0
- Rohscore Back Door: 822, Kosten 0
- Rohscore Rigged Investments: 437, Kosten 4
- Rohscore Draw: 228
- Rohscore Credit: 79
- funded hand development priority: 1220
- Arbitration: `semantic_choice_blocked`
- Blockgrund: `funded_development_plan_controller`
- Policy: `absolute_plan_control`
- blockierter Scoreabstand: 1790

R&D Interface darf den Fehler nicht einfach übernehmen: Auch diese Karte
würde alle 4 Credits ausgeben und liefert im selben Zug keine Liquidität.
Die produktive Folgeauswahl muss deshalb aus einer Positivmenge sicherer
Aktionen kommen und nicht nur den Rohscore-Sieger einsetzen.

## D7-D9-Sequenzvertrag

D7 lehnt den Chicago-Branch-Trash bei 1 Credit ab, weil der Access-Consumer
eine Reserve von 4 schützen will. D8 erhöht den Pool korrekt auf 4. D9 gibt
genau diese 4 Credits vollständig aus. Der belegte Fehler ist nicht zwingend
das einzelne Decline bei D7, sondern der fehlende gemeinsame Reservevertrag
zwischen Access, Handentwicklung, Funding-Plan und finaler Arbitration.

Der Fix darf Chicago Branch nicht aufgrund des späteren Korp-Zugs zwingend
trashbar machen. Er muss zunächst verhindern, dass die eben geschützte
Liquidität ohne unmittelbaren Gegenwert wieder verschwindet.

## Hint-Audit

| Karte | Aktiver/kompilierter Hint | Consumer-Ergebnis |
| --- | --- | --- |
| BBS Whispering Campaign | korrekt: endlicher installierter Credit-Pool, 2 Credits je Action | korrekt konsumiert; Run und Trash erkennen 12 verbleibende Credits |
| Livewire’s Contacts | korrekt: Burst-Credit, Nettoertrag 3 | korrekt als Sofortökonomie gewertet; fehlerhaft nur als Bindeglied zum Rigged-Plan |
| Rigged Investments | mechanisch korrekt: Installment und Turn-Start-Credit | Timing-/Target-Semantik geht in Action-Projektion und Need-Klassifikation verloren |
| R&D Interface | korrekt: R&D-Multiaccess | hoher Druckwert korrekt, aber nachgelagerte Reserveprüfung fehlt |
| Back Door to Hilliard | korrekt: Base Link und Trace-Abwehr | fachlich erkannt, aber bei nicht sichtbarer Bedrohung als `need:none` und durch den funded plan verdrängt |
| Chicago Branch | falsch: `remoteRole.kind = asset_economy` | Inspector leitet falsches `remote.asset_economy`/`corp.asset_economy` ab und meldet 0 Warnungen |
| Chance Observation | korrekt: sichtbarer Trace- und Tag-Source-Vertrag | vor D9 nicht sichtbar und deshalb nicht als damalige Evidence zulässig |
| Urban Renewal | korrekt: Tag-Punish und 5 Damage | vor D9 nicht sichtbar und deshalb nicht als damalige Evidence zulässig |

Chicago Branch erzeugt keine Credits. Korrekt sind Advancement-/
Scorebeschleunigung und die Strategieanker `corp.fast_advance` sowie
`corp.remote_scoring`. Der falsche `asset_economy`-Remote-Role-Eintrag darf
nicht als Ersatz für eine fehlende Scorebeschleunigungsrolle stehen bleiben.

## Sichtbarer Damage-/Punish-Vertrag

Das Quellmatch belegt keinen verpassten Damage-Read vor D9. Im damaligen
Runner-Memory waren nur BBS Whispering Campaign und Chicago Branch als
enthüllte Korp-Karten vorhanden. Chance Observation erscheint erst nach ihrer
Ausspielung; Urban Renewal erst im terminalen Folgeevent. Eine historische
Korrektur auf Basis dieser Karten wäre Hidden-Info-Leakage.

Der wiederverwendbare Folgevertrag ist dennoch fachlich freigegeben:

1. Bereits enthüllte Karten mit strukturierten Damage-, Tag-, Trace-,
   Access-Punish- oder Tag-Payoff-Signalen erhöhen eine side-safe
   Damage-/Punish-Vermutung.
2. Ein einzelnes schwaches Signal erzeugt Vorsicht, aber kein pauschales
   Run-Verbot.
3. Mehrere zusammenpassende Signale erhöhen Handpuffer, Trace-/Tag-Abwehrwert
   und Liquiditätsreserve abgestuft.
4. Aktualität und weiterhin plausible Verfügbarkeit dürfen die Intensität
   beeinflussen; zukünftige oder unbekannte Karten niemals.
5. Konkrete sichtbare Score-/Steal-/Contest-Fenster können Vorsicht weiterhin
   überstimmen.

## Vertrag für kontrollierte Varianz

Varianz ist nur bei echten Grenzentscheidungen zulässig. Kandidaten müssen
vor der Variation bereits alle harten Verträge erfüllen:

- legal und side-safe;
- keine unbegründete Reserve- oder Handbufferverletzung;
- kein unmittelbarer Sieg, erzwungenes Überleben oder klare Dominanz eines
  anderen Kandidaten;
- fachlich vergleichbarer Nutzen innerhalb eines engen Score-/Risk-Bands.

Die Auswahl muss replay-stabil aus dem bestehenden deterministischen
Decision-/Seed-Kontext erfolgen. Identische Eingaben ergeben identische
Entscheidungen. Verschiedene erlaubte Seeds oder Decision-Kontexte dürfen
zwischen mehreren sicheren Kandidaten unterschiedliche Entscheidungen
erzeugen. Ein globaler ungebundener Random-Bonus ist ausdrücklich verboten.

D9 ist kein Varianzfall zwischen Rigged Investments und einer sicheren
Alternative: Die Installation verletzt den Mindestfloor ohne unmittelbaren
Ertrag und muss vor der Varianzmenge ausgeschlossen werden.

## Nichtbeteiligte Karten

Fall Guy war weder gezogen noch installiert und besaß im Trace-Fenster keine
LegalAction. Die Nichtnutzung ist in diesem Match kein Fehler. Broker war
ebenfalls nicht auf der Hand, installiert oder als LegalAction vorhanden. Das
Match liefert keine neue Broker-Evidence.

## Replay-/Observability-Nebenfund

Die Korp rezzte BBS Whispering Campaign als Asset. PublicEvent-Typ und
ActionType lauten dennoch `rez_ice`. Sichtbarkeitsbarriere, Kartentitel,
Counter-Aufladung und StateHash waren vorhanden; die Typbezeichnung ist aber
fachlich falsch und kann Replay-/Consumer-Auswertungen fehlleiten. Der Fund
war nicht ursächlich für D9, ist jedoch als freigegebener Engine-/
Observability-Fix im selben Prozess enthalten.

## Akzeptanzkriterien vor Produktionsänderung

- D9/SV15 wird spielgleich auf synchronisiertem aktuellem Code capturt.
- Die unveränderte historische Erwartung scheitert ausschließlich als
  `behavior_regression`.
- Das Fixture enthält keine Chance-Observation-/Urban-Renewal-Evidence vor
  deren öffentlicher Enthüllung.
- Mindestens eine Gegenprobe erlaubt verzögerte Ökonomie bei ausreichender
  Restreserve.
- Mindestens eine Gegenprobe erlaubt kontrollierten Reserveeinsatz für
  unmittelbaren Ertrag oder akutes Payoff.
- Damage-/Punish-Tests unterscheiden sichtbare von unbekannten Karten.
- Varianztests belegen Replay-Stabilität und Ausschluss klar dominierter oder
  unsicherer Kandidaten.

## Spielgleicher roter Checkpoint

Der strikte Capture auf dem mit `main` synchronisierten Stand erzeugte
`cp-c6eedf46-01-delayed-economy-reserve` ohne Warmup-Drift. Der Checkpoint
enthält den öffentlichen Eventpräfix bis D9/SV15 sowie TacticalPlan,
PlanPortfolio und StrategicIntent; der produktive Chooser wählt weiterhin
`runner.install_card...rigged-investments`.

Der fokussierte Lauf vor jeder Produktionsänderung belegt genau den
erwarteten roten Zustand:

- historischer Zieltest: ausschließlich `behavior_regression`, weil Rigged
  Investments sowohl verboten als auch außerhalb der positiven
  Aktionsmenge liegt;
- Gegenprobe mit 10 statt 4 Credits: grün, Rigged Investments bleibt bei
  erhaltener Reserve zulässig;
- bestehender Livewire-Sofortökonomie-Checkpoint: grün;
- Eventpräfix-Gegenprobe: grün, weder Chance Observation noch Urban Renewal
  sind der damaligen KI sichtbar.

Ergebnis des Laufs: ein erwarteter roter Zieltest und drei grüne
Gegenproben. Damit ist die Regression verhaltensbezogen und nicht durch
Engine-Legalität, Runtime-State-Drift, Fixture-Migration oder Hidden-Info-
Leakage verursacht.

## Umgesetzter Reserve- und Liquiditätsvertrag

Die Action-Semantik erhält die strukturierten Effektziele aus den Hints nun
bis zum produktiven Action-Kandidaten. Rigged Investments bleibt damit als
`economy.installment_credit` und `economy.turn_start_credit` erkennbar,
anstatt zu einer generischen Economy-Karte ohne Auszahlungszeitpunkt zu
verflachen.

Handkartenentwicklung und funded continuation unterscheiden jetzt
Sofortliquidität von verzögerter Liquidität. Zusätzlich bewertet die finale
Runtime jede bezahlte Runner-Installation mit konkreten Aktionskosten,
unmittelbarem Credit-Ertrag, Credits nach der Aktion und geschütztem
Mindestfloor. Eine Installation, die ohne Sofortertrag unter zwei Credits
führt, wird vor Plan-Arbitration ausgeschlossen; bezahlte Runs werden davon
nicht pauschal erfasst und echte Survival-Installationen besitzen einen
engen strukturierten Override.

Im historischen D9 werden dadurch sowohl Rigged Investments als auch R&D
Interface aus der zulässigen Auswahl entfernt. Mit 10 Credits bleibt Rigged
Investments erlaubt. Der fokussierte P3-Lauf ist mit 123 Tests sowie dem
AI-Typecheck grün.

## Sichtbare Damage-/Punish-Vermutung und sichere Varianz

Die bestehende Damage-Threat-Bewertung berücksichtigt nun nicht nur bereits
eingetretenen Schaden. Sie sammelt ausschließlich sichtbare Korp-Karten aus
Board, Archives, Score Area und side-safe Event-Memory und klassifiziert ihre
strukturierten Hints als Damage-Quelle, Trace-/Tag-Delivery oder Punish-
Payoff. Eigene Runner-Karten und unbekannte Handkarten zählen nicht als
Gegnersignal.

Die Intensität ist abgestuft:

- eine bekannte Chance Observation erzeugt `suspected`, aber kein Run-Verbot;
- Chance Observation plus Urban Renewal bildet eine sichtbare Delivery-/
  Payoff-Kombination und erzeugt `confirmed`;
- vorhandene Tags, niedrige Hand oder bereits eingetretener Schaden können
  die Lage bis `critical` verschärfen;
- Handfloor, gewünschte Liquidität und der aktionsbezogene Install-Floor
  steigen mit der Stufe.

Die bereits vorhandene Near-Tie-Varianz wurde vom leicht ausrechenbaren
StateVersion-Modulo auf einen FNV-Hash aus Match-Seed, Decision-ID,
ActionNumber, öffentlicher StateVersion und zulässigen Zielservern umgestellt.
Sie gilt nur für kostenlose, unbekannte und erreichbare Zentral-Probes ohne
Score-Threat, ohne nützliche Handentwicklung und ohne Remote-Contestbedarf.
Der stabile Vierer-Bucket führt ohne Signal in drei Fällen zum Probe und in
einem zum Credit-Hold, bei `suspected` zwei zu zwei, bei `confirmed` eins zu
drei und bei `critical` immer zum Hold. Derselbe Kontext bleibt identisch;
ein Warnsignal kann für denselben Bucket die Risikobereitschaft nur senken,
nie erhöhen.

Fokussierte P4-Gegenproben belegen sichtbare versus unbekannte Karten,
abgestufte Reserve, Probe und Hold, identische Wiederholung, unterschiedliche
Kontexte sowie den Ausschluss klarer und nicht naher Entscheidungen. Der
Checkpoint und 35 fokussierte Tests sowie der AI-Typecheck sind grün.
