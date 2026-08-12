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

## Bekannte offene Punkte

- Der Audit ist fortlaufend; weitere Kartenblöcke sind noch nicht geprüft.
- Worktree und Arbeitsbranch bleiben bis zur ausdrücklichen Abschlussanweisung
  bestehen.

## Gate-Hinweise

Die fokussierten Karten-, Engine- und KI-Regressionsläufe, die vier
Paket-Typechecks, Generator-Checks, Strukturprüfungen, Paketgrenzen,
Formatprüfung und `git diff --check` sind für Block 001 grün.

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
