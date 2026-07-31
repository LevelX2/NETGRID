# Zwei aktuelle Corp-Matches – Umsetzungsprozess F1 bis F8

Stand: 2026-07-31  
Status: freigegeben, Umsetzung läuft  
Branch: `codex/ai-analysis-latest-two-20260731`  
Worktree: `C:\Projekte\NETGRID_AI_ANALYSE_LATEST_TWO_20260731`

## /Goal

Die acht Findings aus der vollständigen Analyse der Matches
`match_723d40ac5a001d37` und `match_daed3ad3bead20fb` werden als sechs
sequenzielle, checkpoint-getriebene Pakete bearbeitet. Jeder historische
Befund wird zunächst gegen den aktuellen, mit `main` abgeglichenen Stand
reproduziert. Nur ein weiterhin roter Vertrag erhält eine Verhaltenskorrektur.
Die Korrekturen bleiben in den vorhandenen Plan-Ownern, werden paketweise
verifiziert und committed und anschließend lokal nach `main` integriert.

Führende Evidence:
`docs/reviews/ai/two-latest-corp-ai-full-analysis-2026-07-31.md`.

## Ausgangslage

Die beiden Spiele zeigen gegenüber älteren Ständen deutlich bessere Central-
Verteidigung und legale, replaybare Entscheidungen. Die verbleibenden Fehler
liegen nicht in der Rules Engine oder den abgeleiteten Deck-Doctrines, sondern
in Planbewertung, exakter Fortsetzung und Ressourcenkonkurrenz:

- frühe produktive Defense verliert ohne akute Gegenlinie wiederholt gegen
  ungebundene Grundkredite;
- ein bereits erkannter garantierter Same-Turn-Score wird von normaler
  Defense verdrängt;
- ein Scoreprojekt verliert nach der ersten Aktion seine konkrete
  `new_remote`-Bindung oder bleibt trotz nicht mehr passender Route resident;
- im aktiven Run werden bekannte ICE-Wirkung und konkrete Kosten teilweise als
  `resource_exchange_unknown` behandelt;
- Handentlastung kann zweckgebundene Score-Reserve in ein kurzlebiges, teures
  Boardobjekt umwandeln;
- beim erzwungenen Agenda-Abwurf fehlt eine planseitig gebundene
  Keep-/Discard-Entscheidung;
- beim Department of Truth Enhancement sind zwei Hint-/Consumer-Verträge
  unvollständig.

Die Decision-Nenner sind geschlossen: 39 von 39 beziehungsweise 106 von 106
KI-Entscheidungen wurden einzeln geprüft. F1 bis F8 bezeichnen die Findings
des Evidence-Berichts, nicht acht unabhängige neue Sonderregeln.

## Architektur-Preflight und Ownership

Verbindlich gelesen wurden `packages/ai/AGENTS.md`,
`docs/architecture/ai/README.md`, die relevanten Abschnitte aus
`docs/architecture/ai/ai-plan-layer-target-state-wip.md` sowie
`docs/architecture/ai/ai-plan-first-runtime-cutover-process-2026-07-23.md`.

Die fachliche Ownership bleibt unverändert:

- `corp.defend_servers` besitzt globale ICE-Allokation, ICE-Installation,
  Schutzprojektion, Rez-Entscheidung und quotierte Defense-Reserve;
- `corp.score_agenda` besitzt Agenda-Instanz, Zielremote, Install/Advance/Score
  und die zugübergreifende Scorekampagne;
- `corp.hand_and_agenda_management` besitzt Overflow, Keep/Discard und die
  konkrete planseitige Discard-Disposition;
- `corp.economy` finanziert ausschließlich endliche, typisierte Parent-Bedarfe
  und wählt weder Server noch ICE, Agenda oder Abwurfziel;
- der TurnPlanner vergleicht vollständige, aktuell ausführbare Restzuglinien
  und bleibt die einzige globale Auswahlinstanz;
- Choice-Resolver vervollständigen nur die Payload einer bereits exakt
  gebundenen `LegalAction`. Sie ändern weder `actionId`, Executor, Plan, Step,
  Route noch Ziel.

Die Pakete erweitern vorhandene Planwahl oder planinterne Routen. Bestehende
`PlanExecutionOrigin`, Parentbindung und Continuation werden erhalten und, wo
nötig, um die bereits fachlich gewählte konkrete Instanz ergänzt. Es entsteht
kein paralleler Scheduler, kein globaler Kartenbonus, kein Resolver-Shortcut
und kein generischer Credit-, Draw-, ICE- oder Action-Fallback.

## Annahmen und Nicht-Ziele

- Ein ICE darf auch ohne sofortige Rez-Finanzierung als dosierter Bluff,
  Handentlastung oder vorbereitete nächste Schutzschicht sinnvoll sein. Diese
  Möglichkeit bleibt ausschließlich eine Route von `corp.defend_servers`.
- Eine zusätzliche ICE-Schicht ist nicht allein wegen ihrer Nummer
  produktiv. Wirkung, Run-Kosten, Trace-/Tag-/Damage-Effekt, Install-/Rezquote,
  Runner-Rig, Reserve und alternative Verwendung werden gemeinsam bewertet.
- Ein garantierter Same-Turn-Score ist eine gebundene Score-Fortsetzung und
  verliert nur gegen eine Enginepflicht oder belegte unmittelbare P1-/P2-
  Terminal-/Survival-Gefahr.
- Ein Agenda-Abwurf ist stark zu vermeiden, aber bei echtem Zwang nicht
  absolut verboten. Punkte, Advancementbedarf, aktuelle Scorebarkeit,
  Fähigkeiten, Redundanz, HQ-/Archives-Exposition und aktive Planbindung
  entscheiden planseitig über die konkrete Instanz.
- Keine Runtime-Entscheidung prüft Titel, Deckname oder feste Karten-ID als
  Ersatz für semantische Qualifikation. Konkrete Instanz-IDs bleiben in
  Planbindung und Actionmaterialisierung ausdrücklich erlaubt.
- F8 ist eine isolierte deklarative Datenkorrektur. Sie erzeugt keinen neuen
  Department-of-Truth-Plan und keine kartenspezifische Runtime-Heuristik.
- Keine Legacy-Kompatibilität, Datenmigration oder Änderung der
  Rules-Engine-Autorität.

## Automatische Fehlerbehandlung und Sicherheitsblocker

- Vor jedem Verhaltensfix wird der historische Zustand mit vollständigem
  Warmup als aktueller Decision-Checkpoint erfasst oder durch eine minimale,
  äquivalente Enginefixture reproduziert.
- Ist der fachliche Erwartungsvertrag im aktuellen Stand bereits grün, wird
  das Paket als erledigt dokumentiert und nicht durch zusätzliche Regeln
  komplexer gemacht.
- Ein `assessment_unknown` wird an seiner exakten Quote oder Semantik
  geschlossen. Es wird nicht durch gedruckte Kartenkosten, statische
  Kartenfilter oder freie Action-Scores ersetzt.
- Eine verschwundene oder veraltete Planroute wird blockiert beziehungsweise
  nach echter StateVersion-Änderung neu geplant; sie springt nicht auf einen
  Geschwisterserver, eine andere Agenda oder eine freie Action.
- Tests sichern neben dem Ergebnis auch Owner, Planinstanz, Step, Route,
  `actionId` und `PlanExecutionOrigin`.
- Für Checkpoint-Lesezugriffe auf die laufende SQLite gilt der bekannte
  Read-only-Schnellpfad mit voriger Health-Prüfung und Risikohinweis. Server-
  oder Browsertests aus dem Worktree verwenden niemals die Standardports oder
  die Runtime-Datenbank des Hauptcheckouts.

## Zustandsfolge

```text
historical_evidence
  -> current_checkpoint_capture
  -> exact_contract_red | already_fixed_green
  -> owner_fix_applied
  -> exact_contract_green
  -> focused_package_gates_green
  -> package_committed
  -> next_package
  -> ai_shards_green
  -> main_integrated
  -> worktree_removed
```

## Paketfolge

### P0 – Prozessvertrag und aktueller Main-Abgleich

- Prozess, Owner, Nichtziele, Paketgrenzen und Gates festhalten.
- Aktuellen lokalen `main` in den Arbeitsbranch integrieren, ohne fremde
  Änderungen zu verwerfen.
- Gate: `git diff --check`, eigener Dokumentationscommit.
- Commit: `docs(ai): plan latest Corp match remediation`.

### P1 – F1: frühe Defense gegen ungebundene Grundkredite

- Die Entscheidungen 1, 3 und 5 des kurzen Matches mit vollständigem Warmup
  gegen den aktuellen Stand prüfen.
- Innerhalb von `corp.defend_servers` eine konkrete frühe ICE-Route mit ihrem
  Vorher-/Nachher-Schutz, Kosten-/Reservevertrag, Bluff-/Handnutzen und
  Opportunity Cost bewerten.
- Ein neutraler Basic Credit darf eine ausführbare produktive Defense-Linie
  nicht allein aufgrund fehlender akuter P2-Klassifikation verdrängen.
- Negative Kontrollen: unpassendes oder finanziell schädliches ICE, echte
  Score-/Terminalchance, dosierte unrezzte zweite/dritte Schicht und spätes
  sinnloses Überstapeln.
- Commit: `fix(ai): value productive early defense routes`.

### P2 – F2: garantierte Same-Turn-Score-Fortsetzung

- Entscheidung 34 des kurzen Matches aktuell reproduzieren.
- Die bereits erkannte, vollständig bezahlbare Folge
  `Agenda installieren -> Project-Consultants-Route -> score` als eine
  ausführbare Scorelinie mit exakter Agenda-, Server- und Actionbindung
  vergleichen.
- Normale HQ-/R&D-Defense oder Reserve darf diese gebundene Konversion nicht
  künstlich auf P2 aufblasen. Reale P1-/P2-Evidence bleibt präemptiv.
- Falls der inzwischen integrierte Geschwisterrouten-Fix den Checkpoint schon
  erfüllt, kein weiterer Scheduler-Sonderfall.
- Commit: `fix(ai): preserve guaranteed same-turn score lines` oder ein reiner
  Evidenzcommit bei bereits grünem Stand.

### P3 – F3 und F4: Scorekampagne, Remote-Bindung und Revalidierung

- Die relevanten Zustände 19/20/22 sowie 88/89/94/95/97 des langen Matches
  aktuell prüfen.
- `corp.score_agenda` bindet Agenda-Instanz und konkretes Zielremote; ein
  angefordertes neues Remote wird nach seiner Erzeugung auf dessen neue
  Server-ID fortgeschrieben.
- Nach jeder Aktion werden Scorebarkeit, Zielnutzbarkeit, verbleibende
  Aktionen, Advancement, Credits, Schutzbedarf und konkurrierende
  Geschwisterrouten erneut validiert.
- Ein nicht mehr ausführbares Projekt bleibt sichtbar blockiert oder wird mit
  klassifiziertem Grund invalidiert; es erzeugt keine falschen Draw-/Credit-
  oder ICE-Supportaktionen.
- Negative Kontrollen: mehrere echte Zielservervarianten bleiben vor der
  Commitmentwahl getrennte Alternativen; legitime mehrzügige Scorekampagnen
  bleiben resident.
- Commit: `fix(ai): keep score campaigns bound and executable`.

Umgesetzt und fokussiert verifiziert:

- Eine wirkungsvolle erste ICE-Schicht darf den konkreten Scoring-Remote auch
  dann eröffnen, wenn ihre Rez-Kosten nicht bereits neben der gesamten
  Agendareserve innerhalb eines Folgezugs finanzierbar sind. Weitere
  bedingte Schichten brauchen weiterhin eine endliche Finanzierung oder eine
  bereits etablierte gleichartige ICE-Rolle.
- Vorhandene Zielremotes gehen bei sonst vergleichbarem Risiko einem neuen
  Remote vor; danach entscheidet die Agenda-Ausbeute vor technischer ID.
- Ein typkompatibler Breaker entwertet Trace-, Damage-, Trash- oder andere
  Encounter-Wirkung nicht pauschal. Die vorhandene Effektsemantik bleibt Teil
  der begrenzten Staging-Bewertung.
- Voller HQ-Handdruck darf einen bereits begrenzt geschützten Remote in einen
  Score-Start überführen, wenn kein weiteres ICE aus HQ legal installiert
  werden kann. Dadurch wird kein zusätzlicher Draw erzeugt, der den
  Agenda-Overflow selbst verschärft.
- D88/D89 ist als echte zweistufige Continuation gesichert: Der Defense-Step
  bleibt Kind derselben Tycho-/`remote_1`-Planinstanz; der Folgecheckpoint
  erhält deren Resident-Portfolio statt eines künstlichen Neustarts ohne
  Planbindung.
- Grün: sieben Match-Checkpoints sowie 190 fokussierte Runtime-,
  Continuity- und Allocation-Tests.

### P4 – F5: aktionsgebundene ICE-Rez-Projektion

- Die Rezfenster 78 und 84 des langen Matches aktuell reproduzieren.
- `corp.defend_servers` bewertet jede konkrete Rez-`LegalAction` anhand ihrer
  aktuellen Enginequote und des marginalen Run-Effekts: Stop, exakte
  Break-/Boostkosten, Trace-/Tag-/Damage-Semantik, Accesswert, Corp-/Runner-
  Liquidität und verbleibende Route.
- Reguläres und rabattiertes Rezzen derselben ICE-Instanz bleiben getrennte
  Actions. Unvollständige Quotes bleiben fail-closed statt auf `rezCost` oder
  Karten-ID-Regeln zurückzufallen.
- Negative Kontrollen: wirkungsloses Rezzen, unbezahlbare Folge-Reserve,
  echte Unsicherheit und sinnvoller Bluff bleiben zulässige Decline-Fälle.
- Commit: `fix(ai): quote current ice rez actions exactly`.

Umgesetzt und fokussiert verifiziert:

- Die vollständige Engine-Quote der aktuell angebotenen Rez-`LegalAction`
  darf eine exakte lokale Ressourcenroute belegen, auch wenn die umfassendere
  Serverprojektion wegen weiterer, noch nicht modellierter Effekte unbekannt
  bleibt. Nur `exact_resource_exchange` erhält diese eng begrenzte Form;
  Access-Reduction, qualitative Wirkung und andere Rez-Routen bleiben an die
  bekannte Gesamtprojektion gebunden.
- Ein positiver Runneraufwand ist materiell, wenn er die Rez-Kosten übersteigt
  oder bei Kostengleichstand sämtliche aktuellen Runner-Credits bindet. Ein
  Gleichstand mit verbleibender Runnerliquidität wird nicht aufgewertet.
- Quote, Karteninstanz, Zielserver, StateVersion, Breakerinstanz, Pump-/Break-
  Kosten, Zahlungsquelle und verbrauchte Ressourcen werden weiterhin exakt
  validiert; Rabatt- und Standard-Rez-Actions bleiben getrennte Routen.
- D78 rezzt Haunting Inquisition für 8 gegen exakt 11 Runner-Credits; D84
  rezzt Data Wall für 1 gegen den letzten Runner-Credit.
- Grün: beide Match-Checkpoints und 223 fokussierte Rez-, Plan- und
  Nachbarverträge.

### P5 – F6 und F7: Overflow, Reserve und plangebundener Discard

- Zustand 52 und Discardentscheidung 97 des langen Matches aktuell prüfen.
- Der Restzugvergleich bewertet teure Handentlastung einschließlich
  konkretem Endboard, Lebensdauer, verdrängter Score-Reserve und sicherem
  Cleanup. Handdruck bleibt Nutzen, aber keine isolierte Rechtfertigung.
- `corp.hand_and_agenda_management` ermittelt vor dem Choice-Fenster die
  konkrete Keep-/Discard-Disposition. Ein aktiver Scoreplan kann die exakte
  Agenda-Instanz als `campaign_hold` binden.
- Der Discard-Resolver führt ausschließlich diese gebundene Wahl aus;
  `actionId`, Executor, Owner, Step und Origin bleiben gleich.
- Negative Kontrollen: zwingender Agenda-Abwurf bleibt möglich; echte
  Duplikate, schlecht scorebare Karten und hoher HQ-Druck können die
  Reihenfolge generisch verändern.
- Commit: `fix(ai): bind overflow and discard decisions to hand plans`.

Umgesetzt und fokussiert verifiziert:

- Das Corp-Discard-Fenster ist nicht länger ein automatisches Engine-Fenster.
  `corp.hand_and_agenda_management` erzeugt stattdessen einen exakten
  `discard_window`-Step für die aktuelle `resolve_choice`-LegalAction.
- Der Handplan bewertet die sichtbaren eigenen HQ-Karten, bindet Choice-ID,
  StateVersion, Option-IDs sowie abgelegte und behaltene Karteninstanzen in
  seinem `moduleState`. Der Resolver übernimmt ausschließlich diese Bindung
  und schlägt ohne aktuellen Executor-Handplan fail-closed fehl.
- Der TurnPlanner erhält dasselbe aktuelle Resident-Portfolio bei der
  Variantenbildung. Damit bleiben Action-ID, Plan-Owner, Executor und
  Choice-Payload auch während der Restzugplanung deckungsgleich.
- Agenda-Keep-Werte unterscheiden unter echtem Overflow generisch nach
  Agenda-Punkten, Advancement-Aufwand und redundanten Exemplaren. Außerhalb
  echten Overflows bleibt die bisherige starke Agenda-Schutzwirkung bestehen;
  es gibt keine Karten-ID- oder Titelregel.
- Zustand 52 bleibt grün und verbraucht die Score-Reserve nicht für eine reine
  Washington-Grid-Handentlastung. Entscheidung 97 behält Tycho Extension,
  legt den niedrigeren redundanten AI Chief Financial Officer ab und weist in
  der Debugspur `corp.hand_and_agenda_management / discard_window` aus.
- Grün: elf Match-Checkpoints, 115 fokussierte Choice-/Discard-/Handplan-Tests
  und der AI-Typecheck mit dem dokumentierten 8-GB-Node-Heap.

### P6 – F8: Department-of-Truth-Hintvertrag

- Die deklarativen Hints an die bereits implementierte Engine-Semantik
  angleichen: `hosted_credit_add` mit Betrag 3 und `hosted_credit_take` mit
  Modus `all`.
- Den vollständigen Hint-/Consumer-Audit des betroffenen Decks sowie
  Gegenfälle ausführen.
- Keine Runtime- oder Planpriorität ändern.
- Commit: `fix(ai): align Department of Truth credit hints`.

Umgesetzt und fokussiert verifiziert:

- Der deklarative Load-Effekt beschreibt jetzt exakt drei Credits mit
  `amountKind: fixed` und `economyMode: bank_load`.
- Der Cashout-Effekt beschreibt die vollständige Auszahlung mit
  `amountKind: all_available` und `economyMode: bank_cashout`; die generischen
  Funktionssignale für Action-Economy und temporäre Ressourcenbank sind
  vollständig.
- Weder Engineimplementierung noch Runtime, Planwahl oder Priorität wurden
  geändert. Ein fokussierter Datenvertrag sichert die Übereinstimmung mit
  `hostedCreditAddAbility(amount: 3)` und `hostedCreditTakeAbility(mode: all)`.
- Grün: 123 fokussierte Hinttests, Hint-Metadatenvertrag, Hint-Qualitätsgate
  sowie der vollständige 22-Karten-/45-Kopien-Consumer-Audit des
  Rent-to-Own-Decksnapshots ohne Blocker oder Warnung.

### P7 – Breite Verifikation, Ergebnis und Integration

- Alle neuen Checkpoints und fokussierten Plan-/Choice-/Quote-/Hinttests.
- AI-Typecheck und relevante Architektur-/Source-/Hint-Gates.
- Vollständiger Standardlauf `corepack pnpm test:ai:shards`.
- Prozessartefakt um genaue Änderungen, grüne Nenner und verbleibende
  unklare Probleme ergänzen; keine unbestätigte Restursache als behoben
  ausgeben.
- Aktuellen `main` erneut integrieren, Gates wiederholen, bevorzugt per
  Fast-Forward lokal nach `main` mergen.
- Sauberen Worktree entfernen und vollständig gemergten Arbeitsbranch
  löschen. Kein Push ohne separaten Nutzerauftrag.

Umgesetzt und vor der Main-Synchronisierung verifiziert:

- Die zunächst zu breite Zulassung unfundierter Score-Remote-Schichten ist
  auf generische, belegbare Fälle begrenzt. Eine erste Schicht darf vor der
  Gesamtfinanzierung liegen, wenn sie selbst für einen terminalen Scorepfad
  aktuell installier- und rezbar ist oder der eng begrenzte mehrzügige
  Aufbauvertrag ohne bessere sofortige Liquiditätskonversion greift.
- Ein sichtbar über einen verzögerten Installationspfad verfügbarer Breaker
  fließt über die gemeinsame Scoring-Window-Zugriffsprojektion in die
  Remote-Risikoprüfung ein. Rein beantwortbares ETR schützt eine hochwertige
  Agenda dadurch nicht fälschlich; echte Tax-, Damage- und
  Encounter-Wirkungen bleiben erhalten.
- Unfinanzierbare tiefe zentrale ICE-Schichten erhalten keine P2-Dringlichkeit
  allein aus einer terminalen Zentralbedrohung. Zweite und dritte Schichten
  bleiben als begrenztes Staging möglich; eine vierte, fünfte oder sechste
  Schicht verdrängt ohne unmittelbare Wirkung keine produktive Economy.
- Die Auswahl konkurrierender Score-Eltern nutzt vorhandene Remote-Bindung,
  Risiko und technische Stabilität, aber keine nachträgliche pauschale
  Agendapunkte-Sortierung. Dadurch bleiben bestehende Planinstanzen und deren
  Support-Owner stabil.
- Die historischen Virus-Purge-Kontrollen prüfen wieder ausschließlich ihren
  eigentlichen Vertrag: kein wirkungsloser Purge und keine Purge-Capability.
  Sie schreiben der KI nicht mehr zusätzlich eine konkrete Basis-Credit-
  Aktion vor, wenn inzwischen ein legitimer Scoreplan verfügbar ist.
- Die alte synthetische Pflicht zu einer unfinanzierbaren sechsten HQ-Schicht
  wurde als Widerspruch zur Schichtfinanzierung korrigiert. Der Gegenfall
  verbietet diese Überstapelung und akzeptiert die bereits planbesessene
  produktive Alternative.
- Grün: 14 zuvor betroffene Regressionsdateien mit 81 Tests; anschließend
  `check:ai`, der AI-Typecheck mit 8-GB-Node-Heap und der vollständige
  Drei-Shard-Lauf mit 182/182, 182/182 und 181/181 Testdateien sowie
  1523/1523, 1789/1789 und 1157/1157 Tests.

## Verifikationsregeln

Nach jedem Paket:

1. roter beziehungsweise bereits grüner exakter Vertrag dokumentieren;
2. fokussierte paketbezogene Tests ausführen;
3. Ownership- und Gegenfalltests ausführen;
4. `git diff --check`;
5. nur paketbezogene Dateien stagen und committen;
6. erst dann das nächste Paket aktivieren.

Der vollständige AI-Lauf ist `corepack pnpm test:ai:shards`. Der serielle
Pfad wird nur bei nachgewiesenem Speicher- oder Stabilitätsproblem verwendet.

## Abschlusskriterien

- Alle F1-bis-F8-Verträge sind im aktuellen Stand entweder reproduziert und
  generisch behoben oder nachweislich bereits vor dem Paket grün.
- Jede KI-Entscheidungsänderung besitzt genau einen fachlichen Plan-Owner und
  eine exakte aktuelle LegalAction-Bindung.
- Same-Turn-Score, mehrzügige Scorekampagne, Defense, Overflow und Discard
  konkurrieren über den vorhandenen TurnPlanner statt über Sonderprioritäten.
- ICE ohne sofortiges Rezzen bleibt als begründete Defense-Route möglich;
  wirkungslose Überstapelung erhält kein pauschales Gewicht.
- F8 bleibt eine deklarative Datenkorrektur ohne kartenspezifische Runtime-
  Logik.
- Fokussierte Gates, AI-Typecheck und drei AI-Shards sind grün oder ein echter
  Blocker ist präzise mit Evidence dokumentiert.
- Arbeitsbranch ist lokal nach `main` integriert; Worktree und Branch sind
  verifiziert entfernt.
