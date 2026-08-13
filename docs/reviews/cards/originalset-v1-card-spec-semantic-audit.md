# Originalset-V1-CardSpec-Semantikaudit

Dieses fortlaufende Protokoll dokumentiert geprüfte Nutzerblöcke des
semantischen Originalset-CardSpec-Audits. Lokale Kartenquellen und Errata sind
Regel-Evidence; die CardSpecs bleiben nach der Korrektur die mechanische
Autorität. Der dauerhafte Arbeitszweig ist
`codex/originalset-semantic-audit`.

## Block 001 – Karten 001 bis 020 und generische Folgefunde

Status: umgesetzt und durch fokussierte Gates verifiziert. Der Eintrag wird
durch den Block-Commit mit dem Betreff
`fix(cards): audit originalset semantic block 001` eingeführt; der konkrete
Hash steht damit in der Git-Historie dieses Dokuments. Lokale Integration nach
`main` erfolgt erst nach dem abschließenden sauberen Gate- und Git-Zyklus.

### ONR V1 001 – Afreet

- Nutzerbefund: Der CardSpec-Text bildet die bereits implementierte
  Hostmechanik nur unvollständig ab.
- Evidence: `docs/source/Runnerspoiler 1.0.txt:11-12` nennt sowohl die
  Stärkeverringerung aller in Afreet installierten Icebreaker um 1 als auch
  den Trash aller gehosteten Programme, wenn Afreet das Spiel verlässt. Die
  Daemon-Hinweise beginnen in `docs/source/Netrunner Errata 1.70.md:1451`.
- Bestätigte Ursache und Schicht: reiner kanonischer Textfehler im CardSpec;
  `hostedProgramCapacity.hostLeavesPlayTrashesHosted` und
  `hostedProgramModifiers` waren bereits korrekt.
- Weitere Karten derselben Vertragsform: keine fehlerhafte mechanische
  Vertragsfamilie; deshalb keine Runtime-Änderung.
- Korrektur: ausschließlich die beiden fehlenden Aussagen im kanonischen
  Kartentext ergänzt.
- Regression: positive Textprojektion prüft beide Aussagen; bestehende
  Hosting-, Stärke- und Host-leaves-play-Regressions bleiben unverändert
  grün. Negativ gesichert ist, dass keine zweite Runtime-Autorität entstand.
- Zurückgestellt: nichts.

### ONR V1 002 – AI Boon und ONR V1 008 – Boardwalk

- Nutzerbefund: Beide CardSpecs enthielten unbegründet
  `recurringCredits: 1`.
- Evidence: `docs/source/Runnerspoiler 1.0.txt:15-16` beschreibt für AI Boon
  nur Break, Pump und den Run-Start-Wurf; die Errata ab
  `docs/source/Netrunner Errata 1.70.md:1472` ändert ausschließlich die
  zufällige Stärke. `docs/source/Runnerspoiler 1.0.txt:39-41` beschreibt für
  Boardwalk nur den Corp-Virus-Counter und die zufällige HQ-Schau.
- Bestätigte Ursache und Schicht: fehlerhaftes statisches
  CardSpec-Charakteristikum mit Phantomprojektion in Definition, Installation,
  Counteranzeige und Runner-Turn-Refresh.
- Weitere Karten derselben Vertragsform: die Suche über alle
  `recurringCredits`-CardSpecs ergab keine weitere unbegründete Ausprägung in
  diesem Block.
- Korrektur: `recurringCredits` an beiden CardSpec-Autoritäten entfernt; die
  generischen Installations- und Refreshpfade blieben unverändert.
- Regression: Definition und CardView projizieren keine Recurring-Credits;
  Installation erzeugt keinen `recurring_credit`-Counter; ein vollständiger
  Zugwechsel füllt keinen Counter nach. Die korrekte AI-Boon-Runstärke und
  Boardwalk-Virusmechanik bleiben positive Gegenproben.
- Zurückgestellt: nichts.

### ONR V1 004 – Bakdoor™

- Nutzerbefund: Ein statisches `baseLink: 1` vermischte eine Eigenschaft mit
  der gedruckten aktivierten Base-Link-3-Fähigkeit.
- Evidence: `docs/source/Runnerspoiler 1.0.txt:23-24` lautet „0: Base link 3“
  und „2: +1 link“; `docs/source/Netrunner Errata 1.70.md:1569` verweist auf
  die allgemeinen Base-Link-Regeln.
- Bestätigte Ursache und Schicht: fehlerhaftes statisches
  CardSpec-Charakteristikum; die typisierte aktivierte Fähigkeit
  `use_base_link` mit Wert 3 war bereits korrekt.
- Weitere Karten derselben Vertragsform: die vorhandene Trace-Link-Suite
  prüft sieben Base-Link-Karten über denselben generischen Ability-Vertrag.
- Korrektur: statisches `baseLink` entfernt, aktivierte Base-Link-3-Ability
  und bezahlte `+1 link`-Ability unverändert erhalten.
- Regression: Runtime-Trace erreicht nach der ausgewählten Bakdoor-Ability
  Base Link 3; die öffentliche Kartenprojektion enthält keinen statischen
  Link. Negative Gegenprobe: vor der Ability bleibt `runnerLink` 0.
- Zurückgestellt: nichts.

### Gemeinsamer Corp-Virus-Counter-Pool

Karten des Nutzerbefunds: ONR V1 008 Boardwalk, ONR V1 009 Butcher Boy,
ONR V1 013 Cockroach und ONR V1 017 Deep Thought.

- Nutzerbefund: Counter wurden pro Quellkarte gespeichert oder ausgewertet,
  obwohl die Corp benannte Virus-Counter kontrolliert.
- Evidence: Die Kartentexte in `docs/source/Runnerspoiler 1.0.txt:39-45`,
  `61-62` und `77-79` weisen die benannten Counter ausdrücklich der Corp zu.
  Die Boardwalk-Rulings in
  `docs/source/Netrunner Errata 1.70.md:1597-1614` bestimmen, dass Counter nach
  dem Trash des Virusprogramms im Spiel bleiben und gemeinsam entfernt
  werden; Butcher Boy, Cockroach und Deep Thought verweisen auf diese
  Virusregeln.
- Bestätigte Ursache und Schicht: Der CardSpec-Vertrag beschrieb Ziele mit
  mehrdeutigen Strings; mehrere Turn-Start-, Continuous-, View- und
  KI-Projektionen lasen deshalb Quellkarten-Counter oder hatten
  kartenspezifische Nebenpfade.
- Weitere Karten derselben Vertragsform: Der geschlossene Vertrag wurde für
  sämtliche bisherigen Erfolgsrun-Counter migriert. Zusätzlich zum
  Nutzerblock verwenden ONR V1 010 Cascade, 029 Gremlins, 034 Incubator und
  064 Skivviss den gemeinsamen Corp-Pool. Fait Accompli und Pox verwenden den
  angegriffenen Server, Pattel's Virus das vollständig gebrochene ICE,
  Proteus Viral Pipeline den angegriffenen Zentralserver-Pool; die Proteus-
  Corp-Pools Crumble, Garbage In, Highlighter, Scaldan, Taxman und Vienna 22
  wurden ebenfalls explizit typisiert.
- Korrektur: `addOnSuccessfulRun.counterScope` ist ein geschlossener
  discriminated Vertrag mit `source_card`, `shared_corp_pool`,
  `attacked_server`, `chosen_fully_broken_ice` und
  `attacked_central_server_pool`. Erzeugung, Turn-Start, Continuous Effects,
  Purge, Views, Sanitizer und KI-Hints lesen denselben Scope. Cockroach-
  Sonderprojektionen und lokale Legacy-Aggregation wurden entfernt. Die
  vollständige Countertypenliste besitzt eine gemeinsame Autorität.
- Regression positiv: echte erfolgreiche Runs erhöhen den Corp-Pool;
  Boardwalk und Deep Thought lösen Schwellen aus dem Pool aus; Boardwalk
  bleibt nach Trash der Quelle wirksam; Butcher Boy zahlt nach vier
  Pool-Countern zwei Credits; Cockroach wirkt mit zwei Countern über zwei
  installierte Quellen; Skivviss, Gremlins und Incubator lesen denselben
  Vertrag; Purge leert die Pools und erzeugt die korrekte
  Future-Action-Debt; Replay und StateHash bleiben deterministisch.
- Regression negativ: lokale `virus`-Counter der Quellkarten bleiben 0 und
  werden weder angezeigt noch zu Poolwerten addiert; falsche, fehlende oder
  offene Scopeobjekte scheitern in der CardSpec-Validierung; der
  Incubator-Choice kann keine verschwundenen Poolcounter still ersetzen.
- Zurückgestellt: keine Legacy-Migration lokaler Version-0-Zustände; nach
  Projektvorgabe werden alte Zustandsformate nicht dual gelesen.

### ONR V1 010 – Cascade

- Nutzerbefund: „trash faceup“ wurde als Filter auf bereits offene R&D-Karten
  interpretiert und erzeugte zusätzlich `rezzed: true`.
- Evidence: `docs/source/Runnerspoiler 1.0.txt:48-50` verlangt, Karten offen
  zu trashen; die Errata in
  `docs/source/Netrunner Errata 1.70.md:1644-1647` legt die obersten Karten von
  R&D als Ziele fest.
- Bestätigte Ursache und Schicht: fehlerhafte Semantik und Benennung im
  CardSpec-Start-of-turn-Vertrag sowie im generischen Zonenübergang.
- Weitere Karten derselben Vertragsform: keine weitere Karte verwendet
  diesen exakt typisierten Top-R&D-Trash-Vertrag.
- Korrektur: Der Vertrag heißt
  `trash_top_rd_cards_faceup_per_two_counters`; die Runtime nimmt ohne Choice
  die obersten `N` Karten unabhängig von ihrem bisherigen `faceup`-Wert,
  verschiebt höchstens die vorhandenen Karten offen nach Archives und setzt
  `rezzed: false`.
- Regression positiv: verdeckte Topkarte wird offen und nicht gerezzt
  archiviert; bei vier Countern und nur einer Karte wird genau diese Karte
  bewegt; der Ablauf ist replay- und StateHash-stabil.
- Regression negativ: leeres R&D erzeugt weder Zielwahl noch Fehler; es wird
  keine bereits offene Zielkarte vorausgesetzt und keine Karte gerezzt.
- Zurückgestellt: nichts.

### ONR V1 020 – Dupré

- Nutzerbefund: Fortwechsel wurde nur beim Brechen geprüft, obwohl jede
  Benutzung Duprés auf einem anderen Fort die vorhandenen Stärkecounter
  entfernt; nur ein tatsächlicher Break darf den Run-End-Counter markieren.
- Evidence: `docs/source/Runnerspoiler 1.0.txt:90-91` trennt ausdrücklich
  „used to break a subroutine“ vom allgemeineren „use Dupré on a fort other
  than the one you last used it on“.
- Bestätigte Ursache und Schicht: der frühere Breaker-Sonderfall verband
  Ability-Nutzung, erfolgreichen Break und Run-End-Auszeichnung in einem
  Effekt.
- Weitere Karten derselben Vertragsform: keine weitere aktuelle CardSpec
  verwendet die neuen Effekte; die Lösung liegt dennoch im generischen
  Icebreaker-Ability-Vertrag und enthält keine Karten-ID-Prüfung.
- Korrektur: `onUse` trägt
  `reset_source_counter_on_fort_change`; `onSuccessfulBreak` trägt
  `mark_run_end_source_counter_award`. Pump und Break binden die konkrete
  Instanz an das Fort; nur der erfolgreiche Break setzt die deduplizierte
  Run-End-Markierung. `runner.convert_run_window` bleibt KI-Planowner; die
  sichtbare Runpfadprojektion erkennt nur den neuen CardSpec-Effekt.
- Regression positiv: Pump auf einem anderen Fort setzt Counter sofort auf 0
  und bindet das Fort; Break auf demselben Fort gibt am Run-Ende genau einen
  Counter; mehrere Breaks deduplizieren; zwei Dupré-Instanzen erhalten je
  einen Counter.
- Regression negativ: Pump-only vergibt keinen Run-End-Counter; Fortwechsel
  wartet nicht auf einen Break; die KI-Anpassung ändert weder Plan, Step,
  Executor noch `actionId`.
- Zurückgestellt: nichts.

## Block 002 – Karten 021 bis 040 und generische Folgefunde

Status: umgesetzt und durch fokussierte Gates verifiziert. Der Eintrag wird
durch den Block-Commit mit dem Betreff
`fix(cards): audit originalset semantic block 002` eingeführt.

### ONR V1 022 – Emergency Self-Construct

- Nutzerbefund: Die permanente Meat-Damage-Prevention wurde nach der
  Flatline-Replacement-Auflösung als optionaler Prevention-Kandidat mit
  „Nicht verhindern“ angeboten.
- Evidence: `docs/source/Runnerspoiler 1.0.txt:98-101` bestimmt automatische
  Prevention allen Meat Damages. Die Errata ab
  `docs/source/Netrunner Errata 1.70.md:1831` grenzt nur unpreventable Damage
  aus.
- Ursache und Korrektur: Der permanente Zustand war im generischen optionalen
  Event-Modification-Fenster registriert. Er wird jetzt nach vollständigen
  Replacements und vor optionaler Prevention automatisch auf null angewandt;
  unpreventable Damage bleibt im direkten Finalresolver außerhalb dieses
  Pfads. Es entsteht keine Choice.
- KI-Semantik: Die sachfremde Rolle `remote_upgrade_modifier` wurde entfernt;
  Survival-Strategie, Emergency-Tool und Line-Support bleiben die führenden
  Annotationen.
- Regression: Der bestehende reale Flatline-Zeuge prüft zusätzlich, dass
  späterer Meat Damage weder Gripverlust noch Pending Choice erzeugt.

### ONR V1 023 – Evil Twin und ONR V1 028 – Force Shield

- Nutzerbefund: „up to 2“ war im CardSpec nicht als wählbare Menge
  ausgedrückt.
- Evidence: `docs/source/Runnerspoiler 1.0.txt:104-107` und `118-120` nennen
  jeweils ausdrücklich bis zu zwei Net und/oder Core Damage.
- Weitere Karte derselben Vertragsform: Der Sweep über kanonische
  „up to“-Texte fand ONR V1 061 Shield mit derselben fehlenden
  Mengenwahlsemantik. Andere Treffer verwenden bereits eigene typisierte
  Mechaniken.
- Korrektur: Alle drei Damage-Prevention-Quellen tragen
  `amountMode: "up_to"`. Der vorhandene generische Prevention-Resolver erzeugt
  daraus die Teilmengenoptionen und führt weiterhin das gemeinsame
  Per-Turn-Limit.
- Regression: CardImplementation-Vertragszeugen sichern Betrag, Modus,
  Damage-Typen und Turn-Limit für alle drei Karten; die bestehende generische
  Up-to-Runtime bleibt die einzige Ausführungsautorität.

### ONR V1 026 – False Echo

- Nutzerbefund: Die Runtime lief vom innersten zum äußersten ICE und setzte
  Rez-Zustand sowie Credits direkt, außerhalb des kanonischen Rez-Lebenszyklus.
- Evidence: `docs/source/Runnerspoiler 1.0.txt:112-114` verlangt äußerstes ICE
  zuerst und danach nach innen. Die Errata ab
  `docs/source/Netrunner Errata 1.70.md:1888` bestätigt die fortlaufende
  Bezahlbarkeitsprüfung einschließlich verborgener Kosten.
- Korrektur: Die Serverreihenfolge wird von außen nach innen traversiert. Für
  jedes bezahlbare ICE wird die aktuelle kanonische Rez-Action samt Quote,
  variabler Rez-Ausprägung und zusätzlichen Kosten erzeugt und durch
  `rezCard` ausgeführt. Nur die normale Encounter-Continuation wird für diese
  bereits erfolgreiche Run-Fortsetzung unterdrückt; On-Rez-Lifecycle,
  Counter, Rewards und Quotes bleiben vollständig aktiv.
- Ownership: `runner.convert_run_window` und die bestehende
  Successful-Run-Continuation bleiben Plan und Executor. Es gibt keinen
  zweiten Choice- oder Rez-Owner.
- Regression: Ein Unit-Zeuge prüft die Reihenfolge außen nach innen und die
  Delegation; ein realer Engine-Zeuge prüft Quotezahlung, beide Rez-Zustände,
  On-Rez-Runner-Rewards, Replay und StateHash.

### ONR V1 029 – Gremlins und ONR V1 034 – Incubator

- Nutzerbefund: Beide Karten wurden als mögliche quellengebundene
  Viruscounter gemeldet.
- Ergebnis: Der mechanische Befund war beim Eingang von Block 002 bereits
  durch Block 001 und Commit `baba8eee8` erledigt. Beide CardSpecs tragen
  `counterScope: { kind: "shared_corp_pool" }`; Erzeugung, Verbrauch, Purge,
  Anzeige und Tests lesen diesen Vertrag. Es wurde kein zweiter Fixpfad
  angelegt.
- KI-Semantik: Gremlins' sachfremde Rolle `remote_upgrade_modifier` wurde
  durch die vorhandene generische Rolle `pressure_hq` ersetzt. Incubator
  benötigte keine weitere Änderung.

### ONR V1 032 – I Spy

- Nutzerbefund: Der CardSpec-Kindname ließ Kosten, Timing, Counterort,
  Persistenz, Expose-Ziel und Corp-Entfernungskosten unbestimmt; die Runtime
  enthielt feste Werte.
- Evidence: `docs/source/Runnerspoiler 1.0.txt:129-132` nennt Trash der Quelle,
  den angegriffenen Data Fort, alle Karten innen und darauf sowie Corp-Aktion
  plus vier Credits. Die Errata ab
  `docs/source/Netrunner Errata 1.70.md:1952` bestätigt Installation,
  unmittelbares Erfolgsrun-Timing, Counterverlust beim Fortkollaps und
  Wirkungsdauer.
- Korrektur: Der CardSpec-Vertrag parametrisiert Timing, Trash-Kosten,
  Countertyp, -menge, -ort und -persistenz, Expose-Ziel und -dauer sowie
  Corp-Klick-, Credit- und Entfernungsmengen. Platzierung, Corp-LegalAction
  und Resolver lesen denselben Vertrag; kollabierende Remotes entfernen ihre
  Spy-Counter.
- Regression: Echte Platzierung, Sichtprojektion, parametrisierte Entfernung
  und erneute Verdeckung bleiben grün; ein Zonenzeuge sichert den
  Fortkollaps ab.

### ONR V1 036 – Jackhammer

- Nutzerbefund: Bei mehreren bezahlbaren Stealth-Karten wählte die Runtime
  still die erste Quelle.
- Evidence: `docs/source/Runnerspoiler 1.0.txt:146-149` verlangt den Verlust
  von einer Stealth-Karte, falls möglich; die Auswahl ist damit bei mehreren
  Quellen spielerbestimmt. Die Errata ab
  `docs/source/Netrunner Errata 1.70.md:1998` ordnet den Verlust als Folge,
  nicht als Break-Kosten ein.
- Korrektur: Der generische Post-Break-Stealth-Vertrag öffnet bei mehreren
  geeigneten Einzelquellen eine exakt gebundene Engine-Choice. Der bestehende
  Mehrquellenmodus von Hammer nutzt dieselbe Continuation weiterhin als
  Verteilung; der Einzelquellenmodus kann nicht über Karten mischen.
- Weitere Karten derselben Vertragsform: Proteus Fubar und Wrecking Ball
  verwenden denselben `single_stealth_card`-Vertrag und erhalten damit
  ebenfalls die Quellenauswahl ohne kartenspezifischen Pfad.
- Ownership: Die Choice vervollständigt nur die Payload des bereits gewählten
  Breaks und ändert weder Action, Plan noch Executor.
- Regression: Zwei geeignete Stealth-Karten erzeugen genau eine Auswahl; nur
  die gewählte Karte verliert den Credit. Hammers Zwei-Credit-Verteilung,
  private Choice-Sichtbarkeit und Replay bleiben unverändert grün.

### Im ersten Durchlauf unveränderte Karten dieses Blocks

Für Dwarf, Expert Schedule Analyzer, Fait Accompli, Flak, Grubb, Hammer, Imp,
Invisibility, Japanese Water Torture, Joan of Arc, Krash und Loony Goon ergab
der Nutzerblock keinen neuen Korrekturbefund. Ihre angrenzenden Verträge wurden
nur dort als positive Gegenprobe verwendet, wo sie dieselbe generische
Ausführung teilen.

## Block 003 – Karten 041 bis 060 und generische Folgefunde

Status: umgesetzt und durch fokussierte Gates verifiziert. Der Eintrag wird
durch den Block-Commit mit dem Betreff
`fix(cards): audit originalset semantic block 003` eingeführt.

### ONR V1 043 – Mystery Box

- Nutzerbefund und Evidence: `docs/source/Runnerspoiler 1.0.txt:190-192`
  erlaubt die Fähigkeit nur während eines Runs und nur einmal je Run. Der
  CardSpec enthielt zwar Ablauf und Timing, aber kein deklaratives Limit.
- Korrektur: Die Capability trägt jetzt
  `once_per_run_per_source`. Initiierung und Wiederholungsverbot verwenden
  den vorhandenen generischen Run-Limit-Zustand; der redundante verdeckte
  Mystery-Box-Sonderzustand wurde entfernt. Die Choice-Continuation verbraucht
  das Limit nicht ein zweites Mal.
- Regression: CardSpec-Vertrag, erste Aktivierung, anschließende Sperre und
  Fortsetzung der bereits gestarteten Stack-Auswahl sind fokussiert gesichert.

### ONR V1 046 – Pattel's Virus

- Nutzerbefund und Evidence: `docs/source/Runnerspoiler 1.0.txt:202-204`
  benennt ausdrücklich Pattel-Counter auf vollständig gebrochenem ICE und
  Stärke minus 1 je Pattel-Counter; die Virus-Purge-Zugehörigkeit folgt aus
  demselben Text und den Virus-Hinweisen ab
  `docs/source/Netrunner Errata 1.70.md:2168`.
- Ursache und Korrektur: Die Spec-Identität `pattel` kollabierte in Run-End-
  Runtime, Anzeige und Stärkeberechnung zu `virus`. Erzeugung, verbleibende
  Choice-Menge, View und beide Stärkepfade erhalten jetzt `pattel`. Die
  gemeinsame Liste purgebarer Virus-Counter enthält `virus` und `pattel`;
  Purge-Replacement und Wiederherstellung bewahren die konkrete Identität.
- Regression: Einzel- und Mehrzielplatzierung, Stärke, Anzeige, normaler
  Purge sowie Code-Viral-Cache-Erhaltung sind mit Pattel-Identität gesichert.

### ONR V1 055 – Reflector

- Nutzerbefund und Evidence: `docs/source/Runnerspoiler 1.0.txt:241-243`
  enthält genau eine `[0]`-Fähigkeit mit drei alternativen
  Subroutinenklassen.
- Korrektur: Die drei künstlich getrennten Capabilities wurden zu einer
  stabilen Capability mit dem generischen Matcher
  `subroutine_tag_any_of` zusammengeführt. Engine und KI-Hint-Compiler lesen
  dieselbe Tagliste; der kanonische Text bewahrt `[0]`.
- Ownership: Der bestehende Break-Plan bleibt alleiniger Owner. Der Matcher
  erweitert nur die legalen Ziele derselben Ability und erzeugt weder Route
  noch Resolverautorität.
- Generischer Sweep: Unter den bestehenden `subroutine_tag`-CardSpecs war
  Reflector der einzige gesplittete Any-of-Fall; es wurde kein weiterer
  Capability-Split gefunden.

### ONR V1 059 – Self-Modifying Code

- Nutzerbefund und Evidence: `docs/source/Runnerspoiler 1.0.txt:257-260`
  kennzeichnet das Trashing mit `[T]` als Aktivierungskosten. Die Errata ab
  `docs/source/Netrunner Errata 1.70.md:2330` ändert das Nutzungsfenster und
  bestätigt die Installationskosten, nicht die Kostenart des Quell-Trashs.
- Korrektur: `trash_source` liegt jetzt in `costs` und nicht mehr in
  `effects`; der kanonische Text verwendet `[T]:`. Der vorhandene generische
  Kostenpfad trasht und revalidiert die Quelle vor der Stack-Auswahl. Der
  KI-Hint-Compiler projiziert Self-Trash-Semantik nun auch aus typisierten
  Ability-Kosten, ohne einen zweiten Ausführungsweg einzuführen.
- Regression: Die LegalAction weist Trash-Kosten statt Trash-Effekt aus; bei
  Beginn der Fähigkeit liegt die Quelle bereits im Heap, bevor die gebundene
  Such-Choice fortgesetzt wird.

### Unveränderte Karten dieses Blocks

Für Microtech AI Interface, Mouse, Netspace Inverter, Newsgroup Filter, Pile
Driver, Poltergeist, Pox, R&D-Protocol Files, Rabbit, Raffles, Ramming Piston,
Raptor, Replicator, Scatter Shot, SeeYa und Shaka ergab der Nutzerblock keinen
neuen Korrekturbefund. Rabbit bleibt insbesondere auf der Senkung des Trace
Limits und nicht einer Basis-Trace-Stärke modelliert.

## Block 004 – Karten 061 bis 080 und generische Folgefunde

Status: umgesetzt und durch fokussierte Gates verifiziert. Der Eintrag wird
durch den Block-Commit mit dem Betreff
`fix(cards): audit originalset semantic block 004` eingeführt.

### ONR V1 061 – Shield

- Nutzerbefund und Evidence: `docs/source/Runnerspoiler 1.0.txt:266-268`
  verlangt mit „up to 2“ eine wählbare Präventionsmenge.
- Ergebnis: Der Befund war beim Eingang von Block 004 bereits durch den
  generischen Folgefund aus Block 002 erledigt. Shield trägt
  `amountMode: "up_to"`; der vorhandene Prevention-Resolver bietet die
  Teilmengen an und wahrt das gemeinsame Per-Turn-Limit. Es wurde kein
  zweiter Fixpfad angelegt.

### ONR V1 062 – Shredder Uplink Protocol

- Nutzerbefund und Evidence: `docs/source/Runnerspoiler 1.0.txt:270-272`
  trennt den physischen Run auf Archives vom HQ-Zugriff und von der Wertung
  als erfolgreicher HQ-Run.
- Korrektur: `successfulRunServerOverride` ist neben angegriffenem Server und
  `accessServerOverride` ein eigener CardSpec-, Engine- und Run-State-Vertrag.
  Der physische Laufweg und das ICE bleiben Archives, der Breach erfolgt auf
  HQ, und Successful-Run-Trigger, Viren, Turn-Flags sowie
  `lastSuccessfulRunServerId` verwenden HQ.
- Ownership: `runner.pressure_central` bleibt Plan-Owner; die Änderung
  projiziert nur eine weitere Engine-Tatsache der bereits gebundenen
  Run-Action. Es entsteht weder ein neuer Resolver noch eine zweite
  Serverwahl.
- Regression: Ein realer Shredder-Run sichert Archives-Laufweg, HQ-Breach,
  HQ-Erfolgsflags, Replay und die Freischaltung von Core Command: Jettison
  Ice. Ein Run-End-Zeuge sichert zusätzlich den HQ-Virusscope.

### ONR V1 068 – Startup Immolator

- Nutzerbefund und Evidence: `docs/source/Runnerspoiler 1.0.txt:294-296`
  kennzeichnet `[T]` als Aktivierungskosten und enthält kein
  Once-per-Turn-Limit.
- Korrektur: Der CardSpec-Vertrag führt Quell-Trash und die dynamischen
  Rez-Kosten des gerade vollständig gebrochenen ICE gemeinsam als Kosten.
  Der Runtimepfad revalidiert beide Kosten, bezahlt Credits und trasht die
  Quelle vor dem Ziel-Effekt. `trashSourceOnResolve`, das künstliche
  Turn-Limit und dessen Nutzungszustand sind entfernt; der kanonische Text
  bewahrt `[T]:`.
- Regression: Vertrags-, Unit- und realer Integrationszeuge sichern die
  kombinierte Kostenform, die fortbestehende LegalAction trotz eines alten
  Limit-Flags, Quell- und Ziel-Trash sowie Replay und StateHash.

### Unveränderte Karten dieses Blocks

Für Signpost, Skivviss, Smarteye, Snowball, Speed Trap, Succubus, Tinweasel,
Vewy Vewy Quiet, Wild Card, Wizard's Book, Worm, Zetatech Software Installer,
All-Nighter, Anonymous Tip, Arasaka Owns You, Bodyweight Synthetic Blood und
Core Command: Jettison Ice ergab der Nutzerblock keinen eigenen
Korrekturbefund. Core Command war nur von Shredders bisher falscher
Successful-Run-Identität betroffen. Signposts offene Post-Bid-Trace-Logik
bleibt die dokumentierte NETGRID-Entscheidung.

## Block 005 – Karten 081 bis 100 und generische Folgefunde

Status: umgesetzt und durch fokussierte Gates verifiziert. Der Eintrag wird
durch den Block-Commit mit dem Betreff
`fix(cards): audit originalset semantic block 005` eingeführt.

### ONR V1 082 – Deal with Militech

- Nutzerbefund und Evidence: `docs/source/Runnerspoiler 1.0.txt:356-359`
  bestimmt neben der Counterverteilung ausdrücklich Stärke plus 1 je
  Militech-Counter auf dem jeweiligen Icebreaker.
- Ursache und Korrektur: Die Countererzeugung war deklarativ, ihre Wirkung
  wurde aber über den Namen `militech` in mehreren Stärkepfaden geschaltet.
  Der erzeugende CardSpec-Effekt trägt jetzt einen typisierten
  `icebreaker_strength_modifier_per_counter` mit Wert +1. Alle Break-, View-
  und Eventkontexte lesen diese deklarative Wirkung.
- Generischer Folgefund: Pattel Antibody verwendet denselben Erzeugervertrag
  mit Wert -1. Dadurch ist auch dort der Name `pattel` kein verdeckter
  Icebreaker-Stärkeschalter mehr. Der unabhängige ältere
  `breaker_strength_penalty`-Basiscounter bleibt unverändert.
- Regression: CardSpec-Vertrag und direkter effektiver Stärkewert sichern die
  Kombination aus drei Militech- und zwei Pattel-Countern als netto +1.

### ONR V1 086 – Forged Activation Orders

- Nutzerbefund und Evidence: `docs/source/Runnerspoiler 1.0.txt:374-376`
  erlaubt jedes installierte ICE als Ziel und überlässt der Corp Rez oder
  Trash, ohne das Ziel auf unrezztes ICE zu beschränken.
- Korrektur: Legalität und Ziel-Choice verwenden jedes installierte ICE.
  Bereits gerezztes oder aktuell nicht bezahlbares ICE bietet nur Trash;
  andernfalls entstehen Rez-Optionen aus dem bestehenden kanonischen
  Rez-Action-Builder. Der Rez-Zweig nutzt anschließend den normalen
  Zahlungs-, Status-, Turn-Flag- und On-Rez-Lifecycle ohne Run-Fortsetzung.
- Regression: Rezzte und unrezzte Ziele, unbezahlbarer Nur-Trash-Fall,
  Positionsredaktion, Rez-Lifecycle-Flag, Revalidierung, Replay und StateHash
  sind durch die fokussierten Integrationszeugen abgedeckt.

### ONR V1 096 – Kilroy Was Here

- Nutzerbefund und Evidence: `docs/source/Runnerspoiler 1.0.txt:414-416`
  erlaubt während des R&D-Runs das kostenlose Trashing jeder accesseten
  Karte, ausdrücklich auch normalerweise nicht trashbarer Karten.
- Korrektur: Der generische Free-Access-Trash-Pfad erzeugt jetzt auch für
  Agendas eine Trash-Action, ohne fälschlich einen Virus-Counter-Vertrag zu
  verlangen. Virusquellen behalten ihre zusätzlichen Counter-Payloads.
- Generischer Folgefund: Romp through HQ verwendet denselben
  `freeTrashAccessZones`-Vertrag und ist damit für den Agenda-Fall desselben
  Pfades mitkorrigiert; es entstand kein kartenspezifischer Kilroy-Zweig.
- Regression: Ein realer Kilroy-R&D-Zugriff bietet bei einer Agenda sowohl
  Steal als auch kostenlosen Trash, bezahlt keine Credits, legt die Agenda in
  Archives und nimmt sie nicht in die Runner-Score-Area auf.

### AI-Semantikbereinigung

- Edited Shipping Manifests behält `strategic_exchange: self_tag`, liefert
  aber keine rückwärts gerichtete Unterstützung für
  `corp.tag_trace_punish` mehr.
- Forgotten Backup Chip bleibt Support der bestehenden
  `runner.search.breaker`-Linie, ist als generische Program-Recovery jedoch
  kein eigener Strategieanker.
- Lucidrine Booster Drug behält `strategic_exchange: self_damage`, erzeugt
  aber kein Runner-Damage-Payoff-Signal mehr.
- Mantis, Fixer-at-Large verwendet für `any_card` die generische
  `generic_stack_search`-Zielpräferenz statt `program_search`.
- Ownership: Die Änderungen betreffen nur deklarative Hints der bestehenden
  Pläne. Action-ID, Plan, Step, Route, Executor und Choice-Owner bleiben
  unverändert; es entsteht keine zweite Entscheidungsautorität.

### Unveränderte Karten dieses Blocks

Für Custodial Position, Desperate Competitor, Edited Shipping Manifests,
Executive Wiretaps, Forgotten Backup Chip, Fortress Respecification, Gideon's
Pawnshop, Hot Tip for WNS, Hunt Club BBS, Ice and Data's Guide to the Net, If
You Want It Done Right..., Inside Job, Jack 'n' Joe, Livewire's Contacts,
Lucidrine Booster Drug, Mantis, Fixer-at-Large und misc.for-sale ergab der
Nutzerblock keinen weiteren mechanischen Korrekturbefund. Die genannten
AI-Bereinigungen ändern daran nichts.

## Block 006 – Karten 101 bis 120 und generische Folgefunde

Status: umgesetzt und durch fokussierte Gates verifiziert. Der Eintrag wird
durch den Block-Commit mit dem Betreff
`fix(cards): audit originalset semantic block 006` eingeführt.

### ONR V1 104 – Playful AI

- Nutzerbefund und Evidence: `docs/source/Runnerspoiler 1.0.txt:448-450`
  beschreibt für Würfe 1 bis 3 eine beliebige ganzzahlige Aufteilung des
  Wurfwerts zwischen Runner-Credits und neu beiseitegelegten Würfeln; alle
  beiseitegelegten Würfel werden nach derselben Regel weitergewürfelt.
- Korrektur: `random_dice_loop` deklariert jetzt neben Würfelgröße und
  Choice-Würfen ausdrücklich den Splitvertrag, den Credit-Empfänger und die
  rekursive Auflösung jedes beiseitegelegten Würfels. Der bestehende
  deterministische Runtime-Pfad validiert und verwendet diesen Vertrag,
  statt die CardSpec nur auf den groben Longtail-Kindwert zu reduzieren.
- Generischer Befund: Planungsrelevante Zufalls-Outcomes, Choices und
  Fortsetzungen gehören in die kanonische CardSpec. Ein mechanisch korrekter
  Spezialinterpreter allein ist keine vollständige Spezifikation.
- Regression: CardSpec-Vertrag und bestehende Würfel-Integrationszeugen
  sichern alle Splits von 0 bis X Credits, die rekursive Fortsetzung,
  öffentliche Choices und deterministische RandomDrawRecords.

### ONR V1 106 – Private LDL Access

- Nutzerbefund und Evidence: `docs/source/Runnerspoiler 1.0.txt:457-460`
  lässt den physischen HQ-Run bei Erfolg als erfolgreichen R&D-Run gelten.
- Korrektur: Der Run behält HQ als angegriffenen Server und R&D als
  Access-Override, trägt nun aber zusätzlich R&D als semantischen
  Successful-Run-Server. Run-End-Trigger, Viren, Turn-Flags und
  `lastSuccessfulRunServerId` verwenden damit die gedruckte Identität.
- Regression: Der reale Lauf greift weiterhin HQ an, greift auf R&D zu und
  setzt nach Abschluss ausschließlich den R&D-Erfolgsstatus.

### ONR V1 107 – Romp through HQ

- Nutzerbefund und Evidence: `docs/source/Runnerspoiler 1.0.txt:462-464`
  erlaubt kostenlosen Trash auch für normalerweise nicht trashbare Karten.
- Korrekturstand: Der generische Agenda-Pfad wurde bereits durch Block 005
  ursachenorientiert korrigiert. Es entstand kein zusätzlicher
  kartenspezifischer Runtime-Zweig.
- Regression: Ein echter Romp-HQ-Zugriff auf eine Agenda bietet Steal und
  kostenlosen Trash getrennt an; Trash kostet keine Credits, legt die Agenda
  in Archives und punktet sie nicht für den Runner.

### ONR V1 116 – Total Genetic Retrofit

- Nutzerbefund und Evidence: `docs/source/Runnerspoiler 1.0.txt:502-504`
  enthält keine Voraussetzung, dass der Runner bereits getaggt sein muss.
- Korrektur: Die künstliche `runner_is_tagged`-Bedingung ist entfernt.
  `remove_tags` mit Modus `all` bleibt bei null Tags wirkungslos, während
  `avoid_next_tag` trotzdem erzeugt wird.
- Regression: Neben dem bestehenden Tag-Entfernungs- und
  Tag-Vermeidungszeugen sichert ein eigener Null-Tag-Fall die Legalität und
  den erzeugten Vermeidungscredit.

### AI-Semantikbereinigung

- Synchronized Attack on HQ ist nun HQ-Pressure-Payoff statt Anker von
  `runner.run_event_tempo`; die Karte erzeugt selbst keinen Run.
- Temple Microcode Outlet bleibt Programmsuche und Support der bestehenden
  Breaker-Suchlinie, trägt aber weder `draw_for_answers` noch `draw.card`.
- Terrorist Reprisal bleibt konditionale HQ-Pressure und trägt weder
  `contest_remote` noch `runner.run_event_tempo`.
- Weather-to-Finance Pipe bleibt HQ-Pressure/Credit-Denial und trägt weder
  `recover_economy` noch einen positiven Runner-Economy-Wert.
- Ownership: Die Bereinigung ändert nur deklarative Hints bestehender
  Kartenpfade. Plan, Step, Route, Action-ID, Executor und Choice-Owner bleiben
  unverändert; es entsteht keine zweite Entscheidungsautorität.

### Unveränderte Karten dieses Blocks

Für MIT West Tier, Open-Ended Mileage Program, Organ Donor, Priority Wreck,
Score!, Security Code WORM Chip, Sneak Preview, Social Engineering, Stumble
through Wilderspace, Synchronized Attack on HQ, Temple Microcode Outlet,
Terrorist Reprisal, Valu-Pak Software Bundle, Weather-to-Finance Pipe,
Arasaka Portable Prototype und “Armadillo” Armored Road Home ergab der
Nutzerblock keinen weiteren mechanischen Korrekturbefund. Die bei vier dieser
Karten genannten AI-Bereinigungen ändern daran nichts. Die Zuordnung 119/120
folgt der Repo-Collector-Nummerierung.

### Nachprüfung zu Block 006

Eine zweite, engere Quellen- und Runtime-Prüfung hat die zuvor als unverändert
geführten Karten 102, 105, 110, 111, 113, 119 und 120 korrigiert:

- Open-Ended Mileage Program deklariert die optionale Rücknahme jetzt als
  Entscheidung beim Spielen mit einem zusätzlichen Credit. Die LegalActions
  bieten getrennt „normal spielen“ und „spielen und zurücknehmen“ an; die
  Zusatzkosten werden vor der Auflösung bezahlt, das Event liegt während
  seiner Effekte im Heap und kehrt erst danach in die Grip zurück. Die alte
  nachgelagerte Bezahl-Choice ist für diese Karte entfallen.
- Priority Wreck berichtet `corpLostCredits` aus der tatsächlichen
  Vorher-/Nachher-Differenz der Corp-Credits. Zahlt der Runner mehr als die
  Corp besitzt, bleibt `runnerPaidAmount` höher, während der ausgewiesene
  Corp-Verlust korrekt bei null Credits gedeckelt ist.
- Sneak Preview deklariert „Shuffle your stack afterwards“ unabhängig davon,
  ob das installierte Programm aus Stack oder Heap stammt. Auch der Heap-Pfad
  mischt deshalb deterministisch den Stack. Die Karte bleibt Support der
  Breaker-Suchlinie, ist aber kein eigener Strategieanker.
- Social Engineering überspringt das gewählte ICE nicht mehr in der
  Approach-Phase. Die Corp erhält ihr reguläres Rez-Fenster, ein gerezztes
  Ziel wird tatsächlich encountered, und erst im Encounter wird der
  automatische Pass genau einmal verbraucht. Ein unrezztes, nicht
  encountered ICE verbraucht den Marker nicht. Evidence:
  `docs/source/Netrunner Errata 1.70.md:2398-2408`.
- Synchronized Attack on HQ verwendet als kanonischen Klarstellungstext nun
  die Einzelkartenentscheidung „für jede Karte [2] zahlen oder diese Karte
  abwerfen“. Die bestehende private Corp-Choice wählt konkrete behaltene
  Karten und bezahlt weiterhin [2] je Karte. Die Quelle ist ausdrücklich als
  in der Errata-Sammlung dokumentierte inoffizielle Klarstellung referenziert.
- Arasaka Portable Prototype und “Armadillo” Armored Road Home enthalten die
  offizielle Errata-Ergänzung `from the bank` im Wiederauffülltext samt
  Quellenreferenz. Die bereits korrekte Runtime ändert sich dadurch nicht.

Zusätzlich ist Private LDL Access kein eigener R&D-Strategieanker mehr,
sondern bleibt Enabler und Support der bestehenden R&D-Pressure-Linie. Für
Weather-to-Finance Pipe wurde kein neuer freier Credit-Denial-String erfunden:
die geschlossene CardSpec-Taktikontologie besitzt derzeit keinen passenden
verbrauchbaren Runner-Credit-Denial-Wert; `pressure_hq` bleibt daher die
belastbare Annotation. Total Genetic Retrofit ist nun zusätzlich mit zwei
nacheinander gespielten Kopien bei null Tags belegt; beide
Tag-Vermeidungscredits bleiben kumulativ erhalten.

## Block 007 – Karten 121 bis 140 und generische Folgefunde

Status: umgesetzt und durch fokussierte Gates verifiziert. Der Eintrag wird
durch den Block-Commit mit dem Betreff
`fix(cards): audit originalset semantic block 007` eingeführt.

### Kanonische Errata und Projektion

- Artemis 2020, Corolla Speed Chip, “Drifter” Mobile Environment, Pandora’s
  Deck und PK-6089a nennen beim Wiederauffüllen nun ausdrücklich die Bank.
  Dermatech Bodyplating und “Green Knight” Surge Buffers verwenden die
  optionale Formulierung „up to“; Raven Microcyb Eagle enthält beide
  Errata-Korrekturen.
- Alle acht CardSpecs referenzieren die zugehörigen Abschnitte aus
  `docs/source/Netrunner Errata 1.70.md`.
- Raven führt den gedruckten MU-Bonus zusätzlich zum aktiven Modifier als
  `memoryLimitBonus: 1`. CardDefinition, öffentliche Kartenprojektion und
  effektiver Spielwert stimmen damit überein.

### Lifesaver Nanosurgeons

- Die turn-lokale Click-Näherung wurde durch eine fortlaufende
  Runner-Aktionsnummer ersetzt. Eine gestartete Action bindet diese Nummer an
  ihren Run und an erzeugte Damage-Events; vollständig verhinderter Schaden
  erzeugt weiterhin keinen Historieneintrag.
- Ein Bodyweight-Bonusrun besitzt keine solche Aktionsbindung. Schaden in
  diesem Run oder zwischen Actions wird deshalb keiner vorherigen Action
  zugerechnet. Die letzten drei Actions bleiben über Runner-Zuggrenzen hinweg
  erhalten.

### Microtech Backup Drive

- Der alte automatische Sonderfall für Kinder eines getrashten Hosts ist
  entfernt. Der gemeinsame Trash-Event enthält nun alle gleichzeitig
  bedrohten installierten Programme; der Runner kann für Backup Drive eine
  beliebige Teilmenge in einer expliziten Reihenfolge wählen.
- Gesicherte Programme verlassen Rig und installierte Zone, verlieren ihren
  Installationszustand und liegen faceup in einer öffentlichen
  Out-of-play-Zone auf der Hardware. Nur die tatsächlich oberste Karte kann
  per Action in die Grip zurückkehren.
- Verlässt Backup Drive das Spiel, werden alle verbliebenen gesicherten
  Programme in den Heap gelegt. Die Planning-Annotation bezeichnet den Pfad
  nicht mehr fälschlich als Trash Prevention.

### Microtech ’Trode Set und R&D Interface

- ’Trode Set besitzt keinen Phantom-Base-Link und keine
  `trace_bid_support`-Rolle mehr. Normale AP-Subroutinen werden vor
  LegalAction-Erzeugung und Auflösung als ignoriert klassifiziert: Sie sind
  weder Breakziele noch aufgelöste Subroutinen. AP-Traces und AP-Net-Damage
  bleiben ausgenommen; letzterer wird weiterhin auf 1 reduziert.
- Der installierte Access-Bonus wird beim Runstart auf den effektiven
  Access-Server angewendet. Private LDL Access erhält dadurch mit einem oder
  zwei R&D Interfaces zwei beziehungsweise drei gespeicherte R&D-Karten,
  obwohl der physische Run auf HQ führt.

### Unveränderte Karten dieses Blocks

Für Armored Fridge, Bodyweight Data Crèche, Full Body Conversion, HQ
Interface, Militech MRAM Chip, MRAM Chip, Nasuko Cycle und Parraline 5750
ergab der Nutzerblock keinen weiteren Korrekturbedarf.

## Block 008 – Karten 141 bis 160 und generische Folgefunde

Status: umgesetzt und durch fokussierte Gates verifiziert. Der Eintrag wird
durch den Block-Commit mit dem Betreff
`fix(cards): audit originalset semantic block 008` eingeführt.

### Kanonische Errata und strukturierte Projektion

- Raven Microcyb Owl verwendet `[3]`, nennt beim Wiederauffüllen ausdrücklich
  die Bank und führt den gedruckten MU-Bonus zusätzlich zum aktiven Modifier
  als `memoryLimitBonus: 1`.
- Techtronica™ Utility Suit enthält alle drei offiziellen
  Errata-Präzisierungen. `memoryLimitBonus: 1` und `recurringCredits: 5`
  vervollständigen die öffentliche CardDefinition-/Kartenprojektion.
- WuTech Mem Chip führt `memoryLimitBonus: 1`; ZZ22 Speed Chip nennt beim
  Wiederauffüllen die Bank. Die Errata-Änderungen referenzieren die jeweiligen
  Abschnitte aus `docs/source/Netrunner Errata 1.70.md`.
- Access through Alpha, Access to Arasaka, Access to Kiribati, Back Door to
  Hilliard und Back Door to Orbital Air besitzen keine statische
  `baseLink`-Characteristic mehr. Ihr Base Link entsteht ausschließlich durch
  die bezahlte beziehungsweise aktivierte `use_base_link`-Ability.

### Code Viral Cache

- Der Purge-Replacement-Vertrag bindet nun alle installierten Quellen in
  stabil sortierter Reihenfolge. Seine Auswahlkapazität beträgt zwei Counter
  je weiterhin installierter Quelle; zwei Caches können daher gemeinsam bis
  zu vier Counter erhalten.
- Quelle, Quellanzahl und Auswahlobergrenze bleiben im Pending-Choice- und
  Eventvertrag deterministisch gebunden. Ein Replay-Zeuge bestätigt den
  identischen Endzustand. Nach dem Trash einer Kopie sinkt die Kapazität beim
  nächsten Purge wieder auf zwei.

### Planning-Semantik

- Corporate Ally ist Agenda-Pressure gegen das Corp-Scoring und kein
  Corp-Remote-Schutz. Der falsche `scoring_tool`-Anker, die Remote-Contest-
  Linienbindung und der nicht vorhandene Board-/Hand-Sacrifice wurden
  entfernt; der tatsächliche Agenda-Punkt-Exchange bleibt erhalten. Der
  kanonische Text enthält außerdem den vollständigen Unique-Reminder.
- Danshi’s Second ID verwendet die bestehende Runner-Rolle `avoid_tags` statt
  `recover_economy`. Diese Änderungen bleiben deklarative Hint-Korrekturen;
  Plan-, Action-, Choice- und Executor-Ownership ändern sich nicht.

### Unveränderte Karten dieses Blocks

Für Record Reconstructor, Tycho Mem Chip, Zetatech Mem Chip, Aujourd’Oui,
Broker, Crash Everett, Inventive Fixer, Databroker und Diplomatic Immunity
ergab der Nutzerblock keinen weiteren Korrekturbedarf.

## Block 009 – Karten 161 bis 180 und generische Folgefunde

Status: umgesetzt und durch fokussierte Gates verifiziert. Der Eintrag wird
durch den Block-Commit mit dem Betreff
`fix(cards): audit originalset semantic block 009` eingeführt.

### Runner-Start und verzögerte Auflösung

- Gleichzeitig fällige, installierte Runner-Start-of-Turn-Quellen werden nun
  vom Runner in stabil gebundener Reihenfolge aufgelöst. Jede Quelle wird vor
  ihrer Auflösung erneut gegen den aktuellen State geprüft. Wenn Smith’s
  Pawnshop beispielsweise Quest for Cattekin zuerst trasht, erzeugt Quest
  anschließend weder Würfelwurf noch Schaden oder Action.
- Preying Mantis erzeugt am Zugende ein eigenes, unverhinderbares
  Core-Damage-Ereignis je aktivierter Quelle. Mehrere Kopien kollabieren nicht
  mehr zu einem gemeinsamen Damage-Event; die öffentliche Zusammenfassung
  darf den Gesamtbetrag weiterhin aggregieren.
- Karl de Veres’ Corporate Stooge zahlt seinen Credit erst beim tatsächlichen
  Ende eines erfolgreichen Runs und nicht bereits beim Übergang in den
  Access. Damit bleiben Access-Fenster und Run-Ende regeltechnisch getrennt.

### The Shell Traders

- Das Entfernen eines Shell-Counters ist als bezahlte Fähigkeit sowohl in der
  Runner-Action-Phase als auch in den vorhandenen Runner-Special-Effect-
  Fenstern eines Runs verfügbar. Die Aktion ergänzt die normalen Run-Aktionen,
  statt Encounter- oder Jack-out-Logik zu ersetzen.
- Beim letzten Counter wird der normale Install-Creditpreis erlassen;
  zusätzliche Installkosten bleiben zahlbar. Sind solche Zusatzkosten nicht
  bezahlbar, wird die gebundene Karte aus dem Spiel entfernt. Verlässt Shell
  vorher das Spiel, bleibt die face-up beiseitegelegte Karte wie gedruckt im
  Limbo.
- Die Regressionsevidence umfasst bezahlbare und unbezahlbare Agenda-Punkt-
  Zusatzkosten, MU-Auswahl sowie ein reales Jack-out-Fenster.

### CardSpec-, Text- und Planning-Semantik

- Hells Run und Rigged Investments nennen die Bank; Ronin Around beschränkt
  Expose auf installierte Karten; The Shell Traders führt `face up`; Smith’s
  Pawnshop enthält den vollständigen Unique-Reminder. Die belegten
  Präzisierungen besitzen Projekt-Rulings beziehungsweise Quellverweise.
- Field Reporter for ICE and Data, Junkyard BBS, Restrictive Net Zoning,
  Ronin Around und Silicon Saloon Franchise tragen keine fachfremden
  Informations-, Run-, Remote- oder Target-Preference-Hints mehr.
  Restrictive Net Zoning beschreibt gezielt die Erhöhung künftiger
  Corp-ICE-Installkosten. Mantis und Quest projizieren ihre tatsächliche
  Action-Kapazität samt Damage-Risiko; Quests nicht gedruckter Recurring-
  Credit wurde entfernt.
- Die Hint-Korrekturen ändern keine Plan-, Action-, Choice- oder
  Executor-Ownership. Das generierte Artefakt und das versionierte
  Originalset-Review-Golden sind semantisch synchron.

### Unveränderte Karten dieses Blocks

Für Fall Guy, Floating Runner BBS, Leland, Corporate Bodyguard, N.E.T.O.,
Nomad Allies, The Short Circuit und Short-Term Contract ergab der Nutzerblock
keinen weiteren Korrekturbedarf.

## Block 010 – Karten 181 bis 200 und generische Folgefunde

Status: umgesetzt und durch fokussierte Gates verifiziert. Der Eintrag wird
durch den Block-Commit mit dem Betreff
`fix(cards): audit originalset semantic block 010` eingeführt.

### Prävention, Trash-Kosten und Damage

- Bezahlte oder Counter-basierte Damage-Prävention kann dieselbe Quelle nach
  einer erfolgreichen Teilprävention erneut anbieten, solange Damage
  verbleibt und die Quelle ihre Kosten noch bezahlen kann. Trauma Team kann
  dadurch beide Counter in demselben Damage-Ereignis verwenden. Synthetische
  Testkandidaten werden nicht künstlich wiederholt.
- Umbrella bietet bei `one_card` alle gleichzeitig bedrohten legalen Karten
  zur Auswahl an, begrenzt die Auswahl aber auf genau eine. Der getrennte
  Vertrag `one_or_more` bleibt eine Mehrfachauswahl.
- Lockjaw bezahlt seinen Quell-Trash als verhinderbare Aktivierungskosten.
  Wird der Trash verhindert, bleibt Lockjaw installiert und der
  Stärkeeffekt löst nicht auf; erst ein tatsächlich bezahlter Trash setzt die
  gebundene Fortsetzung frei.
- Bioweapons Engineering addiert den auf jeder gewerteten Kopie deklarierten
  Meat-Damage-Bonus. Mehrere Kopien werden weder auf einen pauschalen Punkt
  reduziert noch verlieren sie ihre jeweilige Betragsemantik.

### Zugstart, Run-Ende und Agenda-Credits

- Gleichzeitig fällige Corp-Startquellen werden vom Corp-Spieler in stabil
  gebundener Reihenfolge aufgelöst und vor ihrer Auflösung erneut validiert.
  Das umfasst insbesondere Detroit Police Contract und Employee
  Empowerment; eine zuerst abgewickelte Quelle erzwingt keine versteckte
  automatische Reihenfolge für die übrigen Quellen.
- Wilson, Weeflerunner Apprentice stellt eine Run-only-Action bereit. Eine
  fällige Action-Schuld verbraucht diese zweckgebundene Action vor den
  normalen Clicks, statt Wilsons Kapazität zu ignorieren.
- Submarine Uplink beendet den Run nach dem aktuellen Encounter. Der
  sichtbare Vertrag und die AI-Projektion klassifizieren dieses Ende nicht
  mehr als Jack-out; der nicht gedruckte statische Base Link ist entfernt.
- Data Fort Reclamation bezahlt bei jeder Sequenzinstallation die normalen,
  serverabhängigen ICE-Installkosten. Seine temporären Credits dürfen
  Installation und Rez bezahlen und werden durch normale Corp-Credits
  ergänzt. Jede erfolgreiche Installation invalidiert Corporate Retreat
  sofort über denselben zentralen Vertrag wie reguläre Installationen.

### Planning-Semantik

- Black ICE Quality Assurance und Encryption Breakthrough verwenden die
  gezielte Taktik `corp.ice_tax` statt Remote-Schutz. Encryption Breakthrough
  beschreibt zusätzlich den Informationspreis des Reveals und bevorzugt
  bereits öffentliche oder weniger wertvolle Code Gates, ohne dafür einen
  neuen Plan oder Choice-Resolver einzuführen.
- Top Runners' Conference, Wilson und AI Chief Financial Officer verlieren
  fachfremde Run- beziehungsweise Economy-Anker. Artificial Security
  Directors besitzt keine erfundene Zielpräferenz, Employee Empowerment
  keine Economy-Wertinterpretation und Data Fort Reclamation nur den
  tatsächlich gültigen Install-and-rez-Creditvertrag.
- Die Hint-Korrekturen bleiben deklarativ. Plan-, Step-, Route-, Action-,
  Choice- und Executor-Ownership ändern sich nicht.

### Unveränderte Karten dieses Blocks

Für The Springboard, Technician Lover, Corporate Boon, Corporate Coup,
Corporate Downsizing und Corporate War ergab der Nutzerblock keinen weiteren
Korrekturbedarf. Detroit Police Contract benötigt keinen eigenen CardSpec-Fix,
ist aber durch den generischen Corp-Startvertrag abgedeckt.

## Block 011 – Karten 201 bis 220 und gemeinsamer Effect-driven-Install-/Rez-Vertrag

Status: umgesetzt und durch fokussierte Gates verifiziert. Der Eintrag wird
durch den Block-Commit mit dem Betreff
`fix(cards): audit originalset semantic block 011` eingeführt.

### Ice Transmutation

- Der Vertrag vervielfacht pro Mark nicht nur gedruckte, sondern alle vom
  Ziel-ICE selbst bereitgestellten Subroutinen. Dazu zählen später erzeugte
  eigene Trace-, ETR- und Encounter-Subroutinen; von anderen Karten oder ICE
  hinzugefügte Subroutinen bleiben einfach.
- Marks bleiben beim Derezzen erhalten, werden aber beim Verlassen der
  installierten Corp-Zone gelöscht. Ein deinstalliertes und erneut
  installiertes ICE übernimmt deshalb keine alte Transmutation.
- Die öffentliche Resolution beschreibt den dauerhaften
  Self-provided-Vertrag und behauptet keine nur beim Score bekannte Anzahl
  duplizierter Subroutinen.

### Gemeinsamer Effect-driven-Install-/Rez-Vertrag

- Priority Requisition verwendet den kanonischen Rezpfad. Nur die gedruckten
  Rez-Credits werden erlassen; variable „above rez cost“-Credits,
  Agenda-Punkt-Zusatzkosten, Legality und On-Rez-Lifecycle bleiben erhalten.
- Security Purge bindet für jedes installierbare ICE eine konkrete
  Server-/Rez-Variante. Normale serverabhängige Install- und gedruckte
  Rez-Credits werden erlassen, externe Installtaxes sowie variable und
  Agenda-Punkt-Rezkosten bleiben zahlbar. Die gesamte gewählte Reihenfolge
  wird vor der ersten Mutation auf einem Zustandsklon revalidiert und danach
  durch dieselben kanonischen Install-/Rez-Finalizer ausgeführt. ICE ohne
  legalen bezahlbaren Pfad bleiben in R&D; nur die übrigen aufgedeckten Karten
  gehen offen in die Archives.
- Data Fort Reclamation schließt sich für bereits bezahlte ICE- und Root-
  Installationen demselben Install-Finalizer an. Der bestehende temporäre
  Credit- und optionale Rezvertrag bleibt erhalten, während Unique-, Server-,
  Region-, On-Install-, Fort- und Install-Trigger-Regeln zentral laufen.

### CardSpec- und Planning-Semantik

- Executive Extraction und Genetics-Visionary Acquisition besitzen keine
  Phantom-Ziele mehr. Ice Transmutation wählt keine einzelne Subroutine und
  trägt keine Remote-Beschränkung.
- Main-Office Relocation, Netwatch Operations Office, On-Call Solo Team,
  Priority Requisition, Private Cybernet Police, Security Net Optimization,
  Security Purge und Strike Force Kali verlieren fachfremde Remote-,
  Central-, Bait- oder Economy-Rollen.
- Security Purges capability-nahe Choice-Semantik bewertet die tatsächliche
  Serverplatzierung der aufgedeckten ICE. Superior Net Barriers bewertet die
  Auswahl der aufzudeckenden Walls einschließlich Informationspreis. Die
  typisierte AI-Projektion erhält dafür `server` beziehungsweise
  `installed_ice` als tatsächliche Zieldimension; Plan-, Route-, Action-,
  Choice- und Executor-Ownership bleiben unverändert.

### Unveränderte Karten dieses Blocks

Für Hostile Takeover, Marine Arcology, Political Coup, Political Overthrow,
Project Babylon und Tycho Extension ergab der Nutzerblock keinen funktionalen
Korrekturbedarf. Polymer Breakthrough und Subsidiary Branch benötigen keinen
Kartensonderpfad und sind durch den in Block 010 eingeführten gemeinsamen
Corp-Startreihenfolgevertrag abgedeckt.

## Block 012 – Karten 221 bis 240 und gemeinsamer Run-Start-Vertrag

Status: umgesetzt und durch fokussierte Gates verifiziert. Der Eintrag wird
durch den Block-Commit mit dem Betreff
`fix(cards): audit originalset semantic block 012` eingeführt.

### Cerberus und Runner-kontrollierter Run-Start

- Jeder Cerberus-Counter erzeugt eine eigene präventierbare Quelle von zwei
  Net-Damage. Die Engine öffnet dafür jeweils den normalen Damage-Imminent-
  und Prevention-Vertrag und setzt einen unterbrochenen Run-Start danach
  deterministisch fort.
- Gleichzeitige eigene Run-Start-Quellen werden nach Erzeugung des Run-State
  durch den Runner geordnet. Das umfasst sowohl CardImplementation-Trigger
  als auch deklarative zufällige Breaker-Stärkeboni. Erst danach folgen
  gegnerische Cerberus-Counter und anschließend das normale Run-Fortschreiten.
- Die Reihenfolge ist als gebundene Continuation im State gespeichert. Jede
  Auswahl wird gegen die noch tatsächlich fälligen Quellen revalidiert; es
  gibt keinen kartenspezifischen Cerberus-/AI-Boon-Resolver.

### Cinderella und Data Raven

- Cinderellas erfolgreiche Trace-Folgen bilden eine sequenzielle
  Continuation: zuerst endet der Run, danach wählt die Corp ein installiertes
  Hardware-Ziel, der normale Runner-Trash-Prevention-Vertrag wird abgewickelt
  und zuletzt entstehen unpräventierbare Meat Damage über die normale
  Damage-Pipeline.
- Dadurch kann Umbrella Policy das gewählte Hardware schützen, während
  gültige Damage-Modifikatoren wie eine gescorte Bioweapons Engineering den
  unpräventierbaren Schaden weiterhin erhöhen. Die gedruckte Basismenge bleibt
  CardSpec-Eingabe und ist nicht im Resolver verdoppelt.
- Data Raven verarbeitet bei erfolgreichem Trace zuerst Tag und
  Tag-Prevention. Der Data-Raven-Counter wird erst nach Abschluss dieses
  Fensters hinzugefügt; eine Unterbrechung bewahrt die Fortsetzung explizit.

### CardSpec- und Planning-Semantik

- Normale Defensive- und Chain-ICE in 221, 223–224, 229–235 und 237–240 sind
  keine eigenen `corp.ice_tax_glacier`-Strategieanker mehr. Ihre bestehenden
  Defense-, Tax-, Damage- und Run-Control-Supportsignale bleiben erhalten.
- Cerberus und Cinderella tragen keinen falschen
  `corp.tag_trace_punish`-Anker mehr: Beide verwenden Trace, erzeugen aber
  keine Tags. Data Raven behält diesen Anker als echte persistente
  Trace-/Tag-Engine; Ball and Chain sowie Canis Major und Canis Minor bleiben
  unverändert.
- `corp.defend_servers` bleibt der fachliche Planowner. Geändert wurden nur
  deklarative Hints und Engine-Fortsetzungen; Choice-Resolver wählen weder
  Server noch Strategie oder Action neu.

### Bewusste Nichtänderungen

Der Name `D’Arc Knight` bleibt bis zu einer belastbaren Canonical-Source-
Entscheidung unverändert; das abweichende Spoiler-Spacing allein reicht nicht
für eine Umbenennung. Für Ball and Chain, Canis Major und Canis Minor ergab
der Nutzerblock weder funktionalen noch deklarativen Korrekturbedarf.

## Block 013 – Karten 241 bis 260 und gemeinsamer Action-Consumption-Vertrag

Status: umgesetzt und fokussiert verifiziert.

### Fatal Attractor und verzögerter Encounter-Schaden

- Fatal Attractors 3 Net Damage nach dem nächsten nicht vollständig
  gebrochenen ICE werden nicht mehr direkt finalisiert. Der verzögerte
  Schaden erzeugt jetzt ein normales Damage-Imminent-Event und öffnet den
  regulären Prevention-/Replacement-Vertrag.
- Der verzögerte Marker wird vor einer möglichen Unterbrechung konsumiert.
  Die anschließende Run-Fortsetzung kann dieselbe Damage-Quelle daher nicht
  ein zweites Mal erzeugen.

### Fragmentation Storm und geordnete Trace-Folgen

- Der erfolgreiche Trace folgt der gedruckten Reihenfolge: zuerst endet der
  Run, danach wählt die Corp ein installiertes Programm über den normalen
  Trash-/Prevention-Pfad, und erst nach diesem Schritt entsteht die Sperre
  gegen weitere Runs bis zur Bezahlung einer Aktion und eines Credits.
- Die Programmwahl bleibt nach dem Run-Ende an Trace, Quellen-ICE und
  Subroutine gebunden. Sie benötigt keinen künstlich fortbestehenden
  Encounter-State und führt keine neue Zielentscheidung außerhalb der
  Engine-Continuation ein.
- Homewrecker verwendet bereits den in Block 012 korrigierten gemeinsamen
  Cinderella-Vertrag. Ein gemeinsamer Kartenzeuge bestätigt Corp-Zielwahl,
  Run-Ende vor der Wahl, normalen Hardware-Trash und modifizierbare,
  unpräventierbare Meat Damage für beide Karten.

### Einheitlicher Verbrauch von Runner-Aktionskapazität

- Einzelne Clicks, mehrere gemeinsam bezahlte Clicks und tatsächlich
  verlorene beziehungsweise später eingezogene Aktionen laufen über einen
  gemeinsamen Action-Consumption-Vertrag.
- Jeder verbrauchte Aktionspunkt erhöht denselben Runner-Aktionsordinal und
  reduziert `runLockActionsPending` um denselben Betrag. Haunting
  Inquisition kann deshalb nicht mehr durch eine Mehrfach-Click-Aktion
  zeitlich falsch verlängert werden; zukünftige Action-Schulden verwenden
  denselben Vertrag.

### Mastiff, Canonical Data und Quellenprüfung

- Der aus Block 012 stammende generische Counter-Run-Start-Vertrag wird auch
  für Mastiff kartenspezifisch abgesichert: Jeder Mastiff-Counter erzeugt
  eine eigene präventierbare 1-Core-/Brain-Damage-Quelle. Prävention einer
  Quelle fasst die übrigen Counter nicht zu einem gemeinsamen Ereignis
  zusammen.
- Ein Scan der Originalkarte bestätigt Mastiffs `Trace 5`; die vorhandene
  CardSpec bleibt deshalb unverändert. Der Textspoiler hatte an dieser Stelle
  lediglich den Wert ausgelassen. Scanquelle: [Original-Netrunner-Corp-
  Kartenscans, Bild mit Mastiff](https://www.ebay.com/itm/264840548453).
- Die kanonische Identität von Karte 259 lautet wieder
  `π in the 'Face`; die sichtbare Subtypenliste bewahrt `DecKrash`. Der
  technische ASCII-Slug bleibt stabil.

### Planning-Semantik

- Gewöhnliche Defensive-ICE 241, 244–247, 250, 252–254 und 256–258 tragen
  keinen eigenen `corp.ice_tax_glacier`-Strategieanker mehr. Vorhandene
  Defense-, Tax-, Damage- und ICE-Chain-Supportsignale bleiben erhalten.
- Fetch 4.0.1 und Hunter bleiben Trace-/Tag-Support, sind als einzelne
  einfache Tag-ICE aber keine eigenen `corp.tag_trace_punish`-Anker mehr.
  Jack Attack und Pocket Virtual Reality behalten ihre begründeten Anker.
- Laser Wire wird bei nur 1 Net Damage nicht mehr als strategischer
  `damage.payoff` klassifiziert. Die mechanischen Damage- und
  Defense-Signale bleiben erhalten.
- `corp.defend_servers` bleibt der fachliche Planowner. Es wurden weder ein
  paralleler Plan noch neue Server-, Ziel- oder Strategy-Entscheidungen in
  Choice-Resolvern eingeführt.

## Bekannte offene Punkte

- Der Audit ist fortlaufend; weitere Kartenblöcke sind noch nicht geprüft.
- Als nächster regulärer Nutzerblock folgen die Karten 261 bis 280.
- Worktree und Arbeitsbranch bleiben bis zur ausdrücklichen Abschlussanweisung
  bestehen.

## Gate-Hinweise

Die fokussierten Karten-, Engine- und KI-Regressionsläufe, die vier
Paket-Typechecks, Generator-Checks, Strukturprüfungen, Paketgrenzen,
Formatprüfung und `git diff --check` sind für Block 001 grün.

Für Block 002 sind Cards- und Engine-Typecheck, der CardSpec-AI-Hint-Check,
77 direkt angrenzende Unit-/Vertragstests, vier reale Integrationszeugen,
Formatprüfung und `git diff --check` grün. Ein versehentlich breit gestarteter
Engine-Lauf bestätigte zusätzlich 1.881 von 1.884 Tests; sein verbleibender
Draw-Aggregationsfehler ist unabhängig vom Block und betrifft den unveränderten
Classic-Corp-Test `aggregates mandatory, scored-agenda, selected optional and
Skivviss draws before SPG`. Nach der gewünschten Begrenzung auf sinnvolle
Prüfungen wurde dieser Baseline-Drift nicht in den Block gezogen.

Drei breitere Diagnosegates bleiben unabhängig von diesem Block bereits auf
dem unveränderten Ausgangsstand von `main` rot:

- `check:engine-source-structure` scheitert, weil das erwartete Verzeichnis
  `packages/engine/src/card-implementations/subregistries` nicht existiert.
- `check:engine-cardimplementation-architecture-target` meldet drei
  bestehende `Record<string, unknown>`-Escape-Hatches.
- `check:card-function-abstraction` meldet den bereits vorhandenen Drift der
  Baseline-Berichte. Der Block fügt nach Entfernung des zwischenzeitlich
  erkannten Butcher-Boy-Namensleaks weder eine neue Kategorie noch einen neuen
  Befund hinzu; die generierten Baseline-Berichte bleiben unverändert.

Für Block 003 sind die vier betroffenen Paket-Typechecks, CardSpec-AI-Hint-
Generator- und Strukturgates, die fokussierten CardSpec-, Engine-, Runtime-
Integrations- und KI-Golden-Regressionsläufe sowie der gezielte
Purge-Replacement-Zeuge grün. Ein versehentlich breit gestarteter Engine-Lauf
bestätigte 1.884 von 1.885 Tests; sein einziger Draw-Aggregationsfehler ist
derselbe unveränderte Classic-Corp-Baseline-Drift wie in Block 002. Der Lauf
wurde nicht als Block-Gate gewertet und nicht in den Scope gezogen.

Für Block 004 sind Shared-, Cards- und Engine-Typecheck, CardSpec-AI-Hint-
und Import-Index-Check sowie die fokussierten CardSpec-, Post-Pass-,
Run-End-, Successful-Run-, Shredder- und Startup-Regressionsläufe grün. Das
generierte AI-Hint-Artefakt änderte ausschließlich die erwarteten
CardRules-Fingerprints von Shredder Uplink Protocol und Startup Immolator.

Für Block 005 sind Cards-, Engine- und AI-Typecheck, Generator-Check,
CardSpec-Vertrag, 93 direkt angrenzende Engine-Integrationszeugen, der neue
deklarative Counter-Stärkewert sowie Originalset-AI-Golden und
Artefaktvertrag grün. Das generierte AI-Hint-Artefakt ändert ausschließlich
die erwarteten Regel-/Planungsfingerprints und Semantiken von Pattel Antibody,
Deal with Militech, Edited Shipping Manifests, Forgotten Backup Chip,
Lucidrine Booster Drug und Mantis, Fixer-at-Large.

Für Block 006 sind Cards-, Engine- und AI-Typecheck, Generator-Check,
CardSpec-Vertrag, 129 direkt angrenzende Engine-Integrationszeugen sowie
Originalset-AI-Golden und Artefaktvertrag grün. Das generierte
AI-Hint-Artefakt ändert ausschließlich die erwarteten Regel- oder
Planungsfingerprints und Semantiken von Playful AI, Private LDL Access,
Synchronized Attack on HQ, Temple Microcode Outlet, Terrorist Reprisal,
Total Genetic Retrofit und Weather-to-Finance Pipe.

Für die Nachprüfung zu Block 006 sind Cards- und Engine-Typecheck,
CardSpec-AI-Hint-Generator/-Check, 28 fokussierte CardSpec-Vertragstests,
192 fokussierte
Engine-Tests für Play-, Hidden-Zone-, Run-, Encounter- und Originalset-Pfade
sowie 24 AI-Hint-Vertragstests grün. Der bekannte unabhängige
Classic-Corp-Draw-Baselinefehler wurde nicht in den Scope gezogen.

Für Block 007 sind Shared-, Cards-, Engine- und AI-Typecheck, Generator-Check,
acht AI-Artefakt-Vertragstests sowie 172 fokussierte Engine-Tests für
Damage-Historie, Lifecycle, Encounter, Access und Projektion grün. Die Prüfung
umfasst insbesondere Action- und Bonusrun-Damage, zugübergreifende
Lifesaver-Historie, geordnete Backup-Auswahl und Drive-leaves-play, ignorierte
sowie ausgenommene AP-Subroutinen, Private LDL mit einem und zwei R&D
Interfaces und Ravens dreifache MU-Konsistenz. Der bestehende
Originalset-AI-Golden-Test startet unabhängig davon nicht, weil sein bereits
entferntes historisches Migration-Report-JSON weiterhin statisch importiert
wird; der aktuelle generierte Artefaktvertrag ist grün.

Für Block 008 sind Cards-, Engine- und AI-Typecheck, Generator-Check, acht
AI-Artefakt-Vertragstests sowie 147 fokussierte Engine-Tests für
Purge-Replacement, Projektion, Base Link und angrenzende Originalset-Pfade
grün. Die Code-Viral-Cache-Evidence umfasst eine und zwei Quellen, die
Rückkehr auf Kapazität zwei nach Source-Trash sowie deterministisches Replay.
Der bekannte Originalset-AI-Golden-Test bleibt unabhängig davon wegen seines
statischen Imports des entfernten historischen Migration-Report-JSONs nicht
startfähig; das aktuelle erzeugte Artefakt und die Review-Fixture wurden
gezielt synchronisiert.

Für Block 009 sind Cards-, Engine- und AI-Typecheck, CardSpec-AI-Hint-,
Import-Index-, Metadaten- und Karten-Strukturgates sowie 243 fokussierte
Engine-Tests und 37 fokussierte AI-Vertragstests grün. Die Evidence umfasst
insbesondere geordnete Runner-Startquellen, zwei getrennte Mantis-Damage-
Ereignisse, Karls tatsächliches Run-Ende und Shells Runfenster sowie beide
Ausgänge zusätzlicher Installkosten. `check:engine-source-structure` ist
unabhängig vom Block wegen eines bestehenden Checker-Fehlers bei Deklarationen
ohne Initializer nicht ausführbar; `check:card-function-abstraction` findet
weiterhin sein bereits fehlendes historisches Baseline-JSON nicht. Der
Originalset-AI-Golden-Test bleibt aus demselben bekannten statischen Import
des entfernten Migration-Reports nicht startfähig.

Für Block 010 sind Cards- und Engine-Typecheck, CardSpec-AI-Hint-Generator
und -Check sowie 150 fokussierte Engine-Tests für Prävention, Trash-Kosten,
Corp-Startreihenfolge, Wilson, Data Fort und den Run-End-Vertrag grün. Die
fokussierten AI-Vertragstests prüfen die neuen Hint-Typen und die sichtbare
Submarine-Uplink-Semantik. Der breite AI-Typecheck bleibt unabhängig vom
Block wegen seiner statischen Imports der bereits entfernten historischen
Migration-Report-JSONs nicht startfähig; diese fehlenden lokalen Artefakte
wurden nicht als Kompatibilitätsfallback wieder eingeführt.

Für Block 011 sind Cards- und Engine-Typecheck, CardSpec-AI-Hint-Generator
und -Check, der CardSpec-Kompatibilitätsvertrag, 64 fokussierte
AI-Hint-Vertragstests sowie die direkt angrenzenden Unit- und
Integrationszeugen grün. Die Engine-Evidence umfasst insbesondere
Self-provided gegenüber fremden Subroutinen, Counter-Lifetime, Data Fort,
Priority-Rez mit variablen und Agenda-Punkt-Zusatzkosten, Security Purge mit
externem Installtax sowie den nicht installierbaren Reveal-Fall. Ein anfangs
versehentlich paketweit gestarteter Engine-Lauf zeigte 1.895 von 1.910 Tests
grün; zehn der fünfzehn Fehler lagen in bekannten oder fachfremden Fixtures,
die fünf auditnahen Erwartungen wurden auf die neuen gebundenen
Server-/Rez-Varianten aktualisiert und anschließend fokussiert grün geprüft.
Der bekannte Originalset-AI-Golden-Test bleibt unabhängig davon wegen seines
statischen Imports des entfernten historischen Migration-Report-JSONs nicht
startfähig; aktuelles Artefakt, Review-Fixture und die ausführbaren
Hint-Verträge sind synchron.

Für Block 012 sind Shared-, Cards- und Engine-Typecheck, CardSpec-AI-Hint-
Generator und -Check sowie 95 fokussierte Engine-Tests grün. Die Evidence
umfasst insbesondere Cinderellas Corp-Zielwahl, Umbrella-Trash-Prävention und
Bioweapons-Modifikation, getrennte Cerberus-Damage-Quellen, Data Ravens
Tag-vor-Counter-Reihenfolge sowie Runner-Ordering mehrerer eigener
Run-Start-Quellen einschließlich Replay-/StateHash-Stabilität. Der bekannte
Originalset-AI-Golden-Test bleibt unabhängig davon wegen seines statischen
Imports des entfernten historischen Migration-Report-JSONs nicht startfähig;
aktuelles Artefakt und Review-Fixture sind gezielt synchronisiert.

Für Block 013 sind Shared-, Cards- und Engine-Typecheck, CardSpec-AI-Hint-
Generator und -Check sowie 113 fokussierte Engine-, CardSpec-/Registry- und
AI-Artefakttests grün. Die Engine-Evidence umfasst Mehrfach-Click- und
Action-Debt-Verbrauch, Fatal-Attractor-Prevention, Fragmentation Storms
Reihenfolge, Homewrecker über den gemeinsamen Hardware-Wrecker-Vertrag und
getrennte Mastiff-Counter-Damage-Quellen. Ein versehentlich breit gestarteter
Engine-Lauf wurde nicht als Gate gewertet; nach Korrektur des neuen
Mastiff-Zeugen sind alle auditnahen Tests fokussiert grün. Die übrigen dort
sichtbaren Fehler betreffen unveränderte bekannte beziehungsweise
fachfremde Test-Fixtures und wurden entsprechend dem begrenzten Testauftrag
nicht in diesen Block gezogen.
