# AI First-Turn End-Turn Regression Process

Status: completed

## Abschlussstand

Der Runtime-Nachlauf ist bis zum Integrationsstand `c64a14f8f` lokal nach
`main` übernommen. Er umfasst insbesondere den wiederhergestellten harten
EndTurn-Vertrag, Engine-zertifizierte statische und variable Rez-Quotes,
parentgebundene Funding-Routen, residente Mehrzugpläne, getrennte
Unknown-Evidence, ausschließliche ICE-Ownership von `corp.defend_servers`,
HQ-Overflow-Gegenproben und die exakt gebundene
Employee-Empowerment-Choice.

Verifiziert wurden zuletzt:

- vollständiger AI-Typecheck;
- `4.152/4.152` AI-Tests;
- fokussierte Integrationsläufe mit `376/376` Tests;
- drei exakte Integrationsseeds ohne harte Fehler;
- akzeptierte 60-Spiele-Baseline mit `13.309` Entscheidungen ohne harte
  Fehler;
- sauberer lokaler Main-Stand und laufende Server-/Web-Endpunkte.

Das Playtest-Inkrement wurde bewusst vor der abschließenden
Dokumentationspflege nach `main` integriert. Nach Commit und Integration
dieses Abschlussstands werden der saubere Arbeitsworktree und der gemergte
Arbeitsbranch entfernt; sie sind keine fortbestehenden Entwicklungsstränge.

## Quelle und Befund

Der Prozess behebt die vom Nutzer freigegebene Regression aus dem laufenden
Match `match_3aac786cca427bd0`, Corp-Decision 4 bei StateVersion 4. Die Corp
installierte im ersten Zug ein ICE vor R&D und beendete danach den Zug mit
zwei verbliebenen Klicks und fünf Credits.

Die gespeicherte Decision-Evidence weist drei vorgelagerte Dispositionen aus:

- `corp_basic_credit_has_no_finite_reserve_or_parent_funding_need`
- `corp_exact_draw_projection_exceeds_hand_capacity`
- `corp_ice_install_has_no_engine_certified_access_probability_reduction`

Danach materialisierte `corp.complete_turn` die Route
`complete_turn_after_productive_routes_exhausted`.

## Rekonstruierter End-Turn-Vertrag

Die Nutzererinnerung ist durch Code, Tests, Wissenslog und Git-Historie
bestätigt:

- Commit `46f5df39b` führte den Fail-closed-Fehler
  `end_turn_with_usable_capacity` ein.
- `semantic-ai-runtime-cutover-boundaries.test.ts` verlangt, dass die Runtime
  bei verbliebenen Klicks fehlschlägt, statt `end_turn` als Coverage-Fallback
  zu wählen.
- Das Betriebslog hält ausdrücklich fest, dass die KI EndTurn bei sicher
  nutzbarer Action Capacity sperrt.
- Der Plan-first-Cutover leitete die produktive Auswahl am älteren
  Semantic-Fallback-Guard vorbei.
- Commit `4b0c459f6` ergänzte im Scheduler die Ausnahme
  `exhaustedVoluntaryRoutes`. Sie akzeptiert Early EndTurn, sobald alle
  übrigen Action-IDs als `explicitly_nonproductive` markiert sind.
- Derselbe Stand klassifiziert unvollständige Engine-Quotes und fehlende
  Parent-Finanzierung als `explicitly_nonproductive`. Dadurch beweist
  fehlendes Wissen fälschlich die End-Turn-Ausnahme.

Der Fix entfernt nicht den zulässigen, typisierten Sonderfall
`forgo_restricted_capacity` für ausschließlich regelgebundene
Zero-Click-Runner-Kapazität und nicht den regelbewiesenen terminalen
Deckout-Abschluss. Der allgemeine `corp.complete_turn`-Pfad darf den harten
Restklick-Guard dagegen nicht übergehen.

## Gesamtziel

Die spielgleiche Regression wird zuerst auf unverändertem Code als roter
Decision-Checkpoint gesichert. Danach werden der harte End-Turn-Vertrag,
Engine-zertifizierte Variable-Rez-Quotes, parentgebundene
Verteidigungsfinanzierung, die Unknown-Evidence und der enge befristete
P6-Liquiditätsübergang so korrigiert, dass die Corp keine verbleibenden Klicks
aufgrund unvollständiger Fakten verwirft. Dieser Übergang ist kein Bestandteil
der Zielarchitektur; dort handelt Basic Credit nur als Route eines fachlichen
Economy-Plans oder eines exakten Parentbedarfs.

Der abgeschlossene Arbeitsbranch wird lokal nach `main` integriert. Worktree
und Branch werden erst nach erfolgreicher Main-Verifikation entfernt.

## Worktree und Branch

- Worktree:
  `C:\Projekte\NETGRID_AI_FIRST_TURN_END_TURN_REGRESSION`
- Branch:
  `codex/ai-first-turn-end-turn-regression`
- Ausgangsstand:
  `16aa1edff`
- Runtime-Evidence:
  `C:\Projekte\NETGRID\data\runtime\multiplayer\netgrid.sqlite`

Der Hauptworkspace wird bis zur finalen lokalen Integration nicht verändert.
Der historische detached Baseline-Worktree bleibt unangetastet.

## Invarianten

1. Die Engine bleibt einzige Kosten-, Choice- und Regelautorität.
2. Keine gedruckten `rezCost`-Fallbacks oder AI-erfundenen Variable-Rez-Kosten.
3. `unknown` ist weder `productive` noch `explicitly_nonproductive`.
4. `productive_routes_exhausted` darf nur aus vollständig bewerteten
   LegalActions folgen.
5. Unknown blockiert den eigenen unbewiesenen Actionpfad und jeden
   Exhaustion-/EndTurn-Beweis, aber nicht eine unabhängig exakt
   materialisierte produktive Route. Strategische Planfortsetzungen dürfen
   hypothesenbasiert und revalidierbar bleiben; nur der aktuelle
   LegalAction-Step muss vollständig legal, bezahlbar und zielgebunden sein.
6. Ein Standard-`end_turn` darf bei verbliebenen normalen Klicks nicht durch
   fehlende Quote- oder Planabdeckung freigegeben werden.
7. Echte Verteidigungsfinanzierung bleibt Economy-Support des exakten
   Defense-Parents. Der befristete P6-Liquiditätsübergang ist davon getrennt,
   darf keinen Defense-Parent vortäuschen und entfällt nach vollständiger
   fachlicher Plan-/Parentabdeckung. Draw besitzt nie eine neutrale P6-Route.
8. Die KI wählt ausschließlich aus aktuellen `LegalActions`.
9. Checkpoint, Debug und Reports bleiben side-safe.
10. Technische Gates sind kein Ersatz für fachliche Spielbeobachtung. Nach
    der Integration dieses Fixes wird die nächste breite
    KI-Verhaltensänderung erst nach einem menschlichen Playtest-Checkpoint
    auf der wieder spielbaren Main-Fassung begonnen.
11. `productive`, `explicitly_nonproductive` und `assessment_unknown`
    klassifizieren ausschließlich aktuelle Route Heads. Sie dürfen einen
    residenten Parent weder löschen noch seine Priorität ersetzen.
12. Action-Dispositionen bleiben Coverage-/Diagnoseevidence des zuständigen
    Planmoduls. Wiederholt unowned Action-Familien werden durch eine
    generische Planfamilie geschlossen, nicht durch Karten-, Match- oder
    StateVersion-Ausnahmen.

## Nicht-Ziele

- Keine Rückkehr zu Action-over-Plan- oder heuristischen Kostenfallbacks.
- Keine pauschale Sonderregel für einzelne Kartennamen im Chooser.
- Keine Änderung der eigentlichen Variable-Rez-Kartenregeln.
- Keine breite Neugewichtung von HQ gegen R&D außerhalb der für das Finding
  erforderlichen Gegenproben.
- Kein Push oder Pull Request.

## State Machine

`preflight -> red_checkpoint -> engine_quotes -> plan_contract -> gates -> review -> main_integration -> cleanup`

Bei `engine_legality_drift`, `runtime_state_drift`,
`fixture_migration_required`, Redaction-Fehlern oder nicht rekonstruierbarem
End-Turn-Vertrag stoppt der Prozess vor dem Verhaltensfix.

## Paketfolge

### ET00 – Preflight und Vertragsaudit

- Worktree, Branch, Prozess und Goal festhalten.
- Historischen harten End-Turn-Vertrag aus Code, Tests, Dokumenten und Git
  rekonstruieren.
- Variable-Rez-Quote- und Consumer-Kette vollständig bestimmen.

Done-Gate:

- sauberer Worktree;
- belegter Ausgangsstand;
- dokumentierter Vertragsbruch und konkrete Testmatrix.

Commit:

`docs(ai): define first-turn end-turn regression process`

### ET01 – Spielgleiche rote Evidence

- Decision 4 aus `match_3aac786cca427bd0` mit `strict` capturen.
- Erwartung verbietet das vorzeitige Standard-`end_turn` und verlangt die
  fachlich begründete parentgebundene Folgeauswahl.
- Engste Gegenproben für reguläres End-Turn nach Klickverbrauch sowie
  Unknown-vs.-Nonproductive sichern.
- Unveränderten aktuellen Code ausführen.

Done-Gate:

- Zielcheckpoint liefert ausschließlich `behavior_regression`;
- Gegenproben sind grün;
- Fixture-Redaction und Runtime-Bindung sind gültig.

Commit:

`test(ai): capture premature first-turn completion regression`

### ET02 – Engine-zertifizierte Variable-Rez-Quotes

- Bestehende Engine-Quote-Union für Variable-Rez-Choices wiederverwenden oder
  minimal erweitern.
- Post-Install-Projektion bindet Karte, Server, StateVersion, Basiszahlung,
  optionale/variable Choice-Zweige und zusätzliche Kosten vollständig.
- Unsupported/unknown bleibt explizit unknown.

Done-Gate:

- Engine-Vertragstests für statische und variable Rez-Familien grün;
- keine AI-Abhängigkeit und kein gedruckter Kostenfallback;
- Engine-Typecheck grün.

Commit:

`feat(engine): certify variable post-install rez quotes`

### ET03 – Parent-Funding und harter End-Turn-Vertrag

- Variable Quote-Union in exakte Defense-Projektionen übernehmen.
- Einen nachweisbaren Funding-Gap als Economy-Child des exakten
  `corp.defend_servers`-Parents materialisieren.
- Draw niemals als neutralen P6-Ersatzplan materialisieren. Draw konkurriert
  nur als Teilschritt eines residenten Parents mit exakter Parent-ID, exaktem
  `parentNeedId` und aktueller LegalAction.
- Basic Credit nur als fachlich gebundene Economy-/Parent-Route oder innerhalb
  des engen, pro Zug endlichen und befristeten P6-Sicherheitsübergangs
  materialisieren. Dessen Removal Condition ist die vollständige fachliche
  Abdeckung der verbleibenden normalen Zugkapazität; er ist keine
  Zielarchitektur und darf keine fehlende Planabdeckung kaschieren.
- Blockierte Mehrzugpläne resident halten. Fehlende aktuelle Ausführbarkeit
  des Endziels löscht weder den Parent noch seinen belegten Finanzierungs-,
  Material- oder Setup-Bedarf.
- Score-Material-Draw, Score-Setup, Defense-Funding und weitere
  Supportaktionen ausschließlich über den jeweils exakten Parent-Bedarf
  führen. Generische `draw-for-corp-plan`-, `develop-corp-hand-options`- und
  autonome `develop:<card>`-Wurzeln sind kein zulässiger Ersatz.
- Unknown-Aktionen getrennt von bewiesen unproduktiven Aktionen führen.
- Unknown darf eine andere exakt materialisierte produktive Route nicht
  global blockieren; es darf ausschließlich TurnCompletion und die eigene
  unbewiesene Route sperren.
- `corp.complete_turn` nur bei erfülltem harten End-Turn-Vertrag zulassen.
- Evidence für unknown und bewiesene Wirkungslosigkeit trennen.

Done-Gate:

- unveränderter Match-Checkpoint grün;
- erwartete Folgeauswahl ist ein einmaliger Score-Material-Draw als
  `flexible_support`-Child von `plan:corp.score_agenda:general` mit dem
  exakten Bedarf `score-material:general`;
- getrennte Funding-Gap-Gegenproben bleiben exakt parentgebunden;
- Score-Setup erbt die Parent-Priorität ausschließlich über den Scheduler;
- ungebundene Draw-/Card-Setup-Catch-alls erzeugen keine autonomen
  Planinstanzen;
- Gegenproben erlauben legales End-Turn nur im richtigen Zustand;
- fokussierte AI-Tests und AI-Typecheck grün.

Commit:

`fix(ai): prevent premature plan-first turn completion`

### ET03a – Persistente Ambush- und Punish-Kampagnen

- Eine konkrete Ambush-Kampagne als stabilen Root resident halten, auch wenn
  Funding oder die aktuelle Setup-Route fehlt.
- Ambush-Funding und -Setup als getrennte Children mit exakter Parent-ID und
  exaktem Bedarf führen.
- Eine Punish-/Damage-Kampagne nicht pro aktuell legaler Einzelkarte, sondern
  als eine zusammenhängende Route modellieren.
- Tag-/Trace-Trigger, mehrere Damage-Schritte, Gesamtcredits, Gesamtklicks,
  sichtbare Damage-Prävention und Runner-Handzahl gemeinsam bewerten.
- Die Route nicht auf eine feste Kartenfolge zuschneiden. Aus den aktuell
  sichtbaren Komponenten wird die kürzeste ausreichend starke Route gewählt;
  unnötige Damage-Schritte werden weder reserviert noch ausgeführt.
- Deckstrategie und eigener Decksnapshot beschreiben unterstützte
  Komponentenrollen und langfristige Kampagnenviabilität. Eine fehlende
  Komponente hält den lauernden Root in `watch_window` oder dormant, erzeugt
  aber keinen Targeted-Basic-Draw-Bedarf und keine Draw-Schleife. Aktiver
  Komponentenaufbau ist nur ein ausdrücklich begründeter Sondermodus.
- Funding wird erst zum Child, wenn der Fundingklick und die gesamte
  verbleibende Route noch in dasselbe gültige Opportunity-Fenster passen.
- Die geschützte Punish-Ausführung erst öffnen, wenn eine
  Engine-zertifizierte vollständige Route vorliegt. Unvollständige oder
  veraltete Quotes blockieren nur die betreffende Route; der Kampagnen-Root
  bleibt resident.
- Verdeckte Runnerantworten niemals aus FullState in die Corp-Quote leaken.
  Sie senken den Garantiegrad, ersetzen aber keine fehlenden Regelfakten.

Done-Gate:

- Ambush-Root, Funding-Child und Setup-Child sind über Zustandswechsel
  instanzstabil und exakt parentgebunden;
- ein unbezahlbarer oder temporär nicht ausführbarer Ambush verschwindet nicht
  vor der Discovery;
- genau ein stabiler Punish-Root hält die gesamte ausgewählte Tag-/Damage-Route;
- drei Runner-Handkarten und vier sicher wirksame Damage benötigen keinen
  zusätzlichen Zwei-Damage-Schritt; vier Handkarten werden durch exakt vier
  Damage noch nicht als lethal bewertet;
- fehlende Damage-Komponenten lassen andere Score-, Defense- oder
  Economy-Pläne handeln, ohne einen planlosen oder targeted Draw zu erfinden;
- Teilfinanzierung startet keine nicht vollständig finanzierbare
  Commit-Sequenz;
- nach jedem Tag-/Trace-/Damage-Ergebnis wird die Route aus aktuellem
  Enginezustand neu gequotet;
- Hidden-Twin-, Redaction-, Parent-/Need- und Gesamtketten-Gegenproben sind
  grün.

### ET04 – Breite Verifikation

- Engine- und AI-Typechecks.
- Fokussierte Quote-, Funding-, Defense-, Turn-Completion- und
  Decision-Checkpoint-Tests.
- vollständige Engine- und AI-Suiten beziehungsweise dokumentierte Shards.
- Hidden-Info-, Replay-, authority-/structure- und AI-Gates.
- Deck-Hint-/Consumer-Audit des Checkpoints.
- `git diff --check`.

Done-Gate:

- alle verbindlichen Checks grün;
- keine neue Warning- oder Finding-Klasse aus dem Fix;
- Worktree sauber nach Verifikationscommit.

Commit:

`test(ai): verify first-turn completion safeguards`

### ET05 – Review, Wissen, Integration und Cleanup

- Evidence-/Final-Review und Current-State-Wissen aktualisieren.
- Die integrierte Fassung als bewusst kleines, menschlich prüfbares
  Playtest-Inkrement kennzeichnen; technische Gates nicht als alleinigen
  Nachweis guter Spielstärke darstellen.
- `main` in den Arbeitsbranch integrieren, falls `main` weitergelaufen ist.
- finale relevante Checks wiederholen.
- Arbeitsbranch lokal nach `main` integrieren.
- Main-Status und Ancestor-Beziehung prüfen.
- sauberen Worktree entfernen und doppelt verifizieren.
- gemergten Branch mit `git branch -d` löschen.

Done-Gate:

- Review und Wissen committed;
- `main` enthält alle Paketcommits und ist sauber;
- Worktree-Pfad und Branch sind nachweislich entfernt;
- Goal ist erst danach complete.

Commit:

`docs(ai): close first-turn end-turn regression`

## Verifikationsmatrix

Mindestens:

- Match-Decision-Checkpoint vor Fix rot, nach Fix grün;
- End-Turn-Gegenprobe mit verbrauchten Klicks grün;
- Unknown darf `productive_routes_exhausted` nicht beweisen;
- vollständige und unvollständige Variable-Rez-Quotezweige;
- exakte Parent-ID und Priority-Vererbung der Economy-Unterstützung;
- Engine- und AI-Typecheck;
- angrenzende Defense-/Funding-/Turn-Completion-Tests;
- vollständige Engine- und AI-Testläufe oder projektkonforme Shards;
- Deck-Hint-/Consumer-Audit;
- Hidden-Info-/Redaction-Gates;
- `git diff --check`.
