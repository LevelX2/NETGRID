# AI First-Turn End-Turn Regression Process

Status: active

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
Verteidigungsfinanzierung und die Unknown-Evidence so korrigiert, dass die
Corp keine verbleibenden Klicks aufgrund unvollständiger Fakten verwirft.

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
5. Ein Standard-`end_turn` darf bei verbliebenen normalen Klicks nicht durch
   fehlende Quote- oder Planabdeckung freigegeben werden.
6. Finanzierung bleibt Economy-Support des exakten Defense-Parents.
7. Die KI wählt ausschließlich aus aktuellen `LegalActions`.
8. Checkpoint, Debug und Reports bleiben side-safe.

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
- Unknown-Aktionen getrennt von bewiesen unproduktiven Aktionen führen.
- `corp.complete_turn` nur bei erfülltem harten End-Turn-Vertrag zulassen.
- Evidence für unknown und bewiesene Wirkungslosigkeit trennen.

Done-Gate:

- unveränderter Match-Checkpoint grün;
- erwartete Folgeauswahl ist produktiv und parentgebunden;
- Gegenproben erlauben legales End-Turn nur im richtigen Zustand;
- fokussierte AI-Tests und AI-Typecheck grün.

Commit:

`fix(ai): prevent premature plan-first turn completion`

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
