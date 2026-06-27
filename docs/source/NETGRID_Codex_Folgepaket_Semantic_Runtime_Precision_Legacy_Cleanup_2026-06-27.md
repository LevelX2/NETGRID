# NETGRID Codex-Folgepaket: Semantic Runtime Precision & Legacy-Residual-Cleanup

## Direkt nutzbarer Codex-Auftrag

```text
/goal
Arbeite im Repo LevelX2/NETGRID am Folgepaket „Semantic Runtime Precision & Legacy-Residual-Cleanup“, bis die unten beschriebenen Punkte bestmöglich, konsistent, testgrün und ohne bekannte fachliche Restfehler gelöst sind.

Ausgangslage:
Der Semantic-Runtime-Legacy-Cutover ist grundsätzlich abgeschlossen. Der normale Semantic-Runtime-Pfad soll nicht erneut grundlegend umgebaut werden. Er ruft Legacy nicht mehr für Debugreferenzen oder No-Candidate-Fallbacks auf, fehlende Decksnapshots werden explizit neutral modelliert, ActionSemanticCandidates erhalten produktiv Basic-, Source-/Ability-, Target-, Cost-/Timing-, Tag- und Card-Semantik, Corp-Punish ist nicht mehr generisch Operation-/Trigger-basiert, Opening/Mulligan und Discard verwenden produktiv keine Doctrine-v1-PlanWeights mehr.

Dieses Folgepaket ist daher kein neuer Architektur-Cutover, sondern ein Präzisions-, Konsistenz- und Cleanup-Paket. Ziel ist, verbleibende Übergangsstellen sauber zu begrenzen, irreführende Legacy-Reste zu entschärfen und die Qualität der Semantik so zu erhöhen, dass spätere Replay-Kalibrierung nicht durch uneindeutige Signale, zu breite StrategySupport-Ableitungen oder opt-in-Overlay-Altlogik verfälscht wird.

Arbeitsmodus:
NETGRID ist local-first. Arbeite pragmatisch:
1. aktuellen Stand prüfen,
2. betroffene Dateien untersuchen,
3. fokussiert ändern,
4. relevante Tests/Typechecks ausführen,
5. kurzen Review mit echten Auffälligkeiten erstellen,
6. committen.

Keine Enterprise-/SaaS-Gate-Rhetorik. Keine künstlichen Canary-/Rollback-/Readiness-Kaskaden. Harte Stopper sind nur konkrete Projektfehler: KI wählt nicht legale Actions, Engine-/LegalAction-Vertrag wird verletzt, Hidden-Info wird sichtbar oder entscheidungswirksam falsch genutzt, Tests/Typecheck brechen, oder ein Scope verhält sich fachlich offensichtlich falsch.

Übergreifende Leitplanken:
- Die Engine bleibt Regelautorität.
- Die KI erzeugt keine Legalität.
- Die KI wählt ausschließlich vorhandene Engine-LegalActions.
- Taktiksignale sind Funktionsbausteine, keine Aktionen und keine Strategien.
- Strategieanker entstehen nur aus echten Anchor-/Payoff-/Engine-/Enabler-/Schlüssel-/Win-Condition-Karten.
- Support-only-Signale dürfen keine Strategie erzeugen.
- Keine Strategie ohne echten Strategieanker.
- Ankerlose Decks erhalten Neutral-/Unknown-Kontext, keine erfundene Strategie.
- TargetProfiles bewerten nur legale, side-safe Zieloptionen.
- Boardstate, Kosten, Timing, Reachability, Risiko und Hidden-Info-Schutz bleiben harte Gates.
- Legacy darf nur noch expliziter Legacy-/Fixture-/Benchmark-/Opt-in-Vergleichspfad sein, nicht fachliche Wahrheit des Normalpfads.
- Kommentiere neu geschaffene oder umgebaute Dateien so, dass ihre Absicht und Abgrenzung klar bleibt. Keine Kommentarflut, aber relevante Architekturabsicht muss sichtbar sein.

Wichtige aktuelle Hinweise aus der Prüfung:
- `packages/ai/src/runtime/strategic-runtime-context.ts` wählt für Runtime-Rollen, TargetVector und Reserve weiterhin die erste produktive Primary-Strategie. Das ist funktional, aber noch kein echtes Strategieportfolio.
- `packages/ai/src/actions/action-card-semantic-profiles.ts` projiziert weiterhin breite Hint-Felder wie `role:*`, `plan_role:*`, `line_support:*` und erzeugt StrategySupport aus `lineSupport`/`strategicRole` pauschal mit `confidence: "medium"`. Das ist nutzbar, aber semantisch noch zu grob.
- `packages/ai/src/deck-doctrine.ts` enthält weiter Doctrine-v1-PlanWeights, alte MulliganWeights und Kommentare, die nach dem Cutover missverständlich sind. Es darf als expliziter Legacy-/Fixture-/Benchmark-Pfad bleiben, aber nicht wie produktive Opening-/Runtime-Wahrheit wirken.
- `packages/ai/src/runtime/practical-tactic-overlay.ts` kann opt-in weiterhin Entscheidungen überschreiben. Das ist nicht Normalpfad, sollte aber entweder in semantische Scoring-/Goal-Logik absorbiert oder eindeutig als Benchmark/Opt-in-Altmodul begrenzt werden.
- Der aktuelle Strukturledger nennt `tactical-plans.ts` weiterhin als `IN_PROGRESS`; Runner-, Corp-, Mapping- und Debug-Verantwortungen sind dort noch nicht sauber getrennt.

Nicht erneut erledigen:
- Den Legacy-Cutover des Normalpfads nicht neu aufrollen.
- No-Candidate-Fallback nicht wieder auf Legacy zurückstellen.
- Keine neuen Strategy IDs aus Kartenfamilien erfinden.
- Kein Proteus-Flächenausbau in diesem Paket, außer ein Test oder eine vorhandene Semantik unmittelbar betroffen ist.
- Keine große Migration aller Kartendaten ohne Coverage-/Invariant-Sicherung.

Arbeitsreihenfolge:

## P0. Aktuellen Stand verifizieren und Folgeinventar schreiben

Ziel:
Prüfe, ob die unten genannten Punkte im aktuellen `main` tatsächlich noch offen sind. Falls ein Punkt bereits erledigt ist, dokumentiere ihn als erledigt und vermeide Doppelarbeit.

Zu prüfen:
- `packages/ai/src/runtime/strategic-runtime-context.ts`
- `packages/ai/src/strategic-intent-state.ts`
- `packages/ai/src/actions/action-card-semantic-profiles.ts`
- `packages/ai/src/action-semantic-candidate.ts`
- `packages/ai/src/actions/action-card-semantic-join.ts`
- `packages/ai/src/deck-doctrine.ts`
- `packages/ai/src/runtime/practical-tactic-overlay.ts`
- `packages/ai/src/runtime/practical-micro-runtime.ts`
- `packages/ai/src/tactical-plans.ts`
- `packages/ai/src/plans/*`
- relevante Tests und Debug-Builder
- bestehende Doku unter `docs/reviews/ai` und `docs/architecture/ai`

Ergebnis:
Erstelle oder erweitere ein kompaktes Review-Dokument, z. B.:

`docs/reviews/ai/semantic-runtime-precision-followup-YYYY-MM-DD.md`

Inhalt:
- geprüfter Commit,
- was bereits erledigt ist,
- was tatsächlich noch offen ist,
- konkrete betroffene Dateien,
- geplante Reihenfolge,
- Risiken,
- Verifikation.

Abnahme:
- Keine Arbeit an bereits erledigten Punkten.
- Die Folgeinventur unterscheidet klar Normalpfad, explizite Legacy-/Fixture-/Benchmark-Pfade und opt-in-Vergleichspfade.

## P1. Strategy-Portfolio statt „erste produktive Primary gewinnt“

Ziel:
Der Runtime-Kontext soll mehrere erkannte Strategieoptionen als Portfolio kennen. Er darf weiterhin eine committed PrimaryStrategy auswählen, soll aber die übrigen produktiven Primary-/Secondary-Kandidaten nicht verlieren.

Warum:
Das Zielmodell sagt, dass Deckstrategie Gewichtung und Kontext ist, kein Autopilot. Ein Deck kann mehrere Linien tragen; Boardstate, Rollenbereitschaft, Kosten, Reserve, aktuelle Gelegenheit und bisheriges Commitment sollen bestimmen, welche Linie jetzt aktiv ist.

Umsetzung:
- Prüfe `buildDeckStrategyProfile`, `buildStrategicIntentState`, `buildStrategicRuntimeContext` und Debug-Ausgabe.
- Erweitere `StrategicRuntimeContext` oder nutze den vorhandenen `StrategicIntentState`, sodass ein Portfolio aus produktiven Kandidaten sichtbar bleibt.
- Die Auswahl der aktiven Linie soll mindestens diese Faktoren berücksichtigen:
  - Strategy finalScore / anchorScore / confidence,
  - runtimeStatus === "productive",
  - role readiness,
  - konkrete BoardOpportunity / Threat,
  - TargetVector-Verfügbarkeit,
  - Reserve-/Kostenfähigkeit,
  - vorhandenes Commitment / Hysterese.
- Nicht ausgewählte PrimaryStrategies sollen als alternates/secondary candidates im State/Debug sichtbar sein.
- Geblockte Strategien dürfen nicht als produktive Linie erscheinen; sie dürfen nur als blocked candidate mit Blocker/Evidence sichtbar sein.

Abnahme:
- Tests: Zwei produktive PrimaryStrategies bleiben im Portfolio sichtbar.
- Tests: Hysterese hält eine bisherige Strategie, solange kein ausreichender Switch-Grund besteht.
- Tests: Boardstate-Dringlichkeit kann die aktive Linie temporär wechseln oder ein taktisches Ziel über die Deckpräferenz stellen.
- Tests: blocked/non-productive Strategy wird nicht als produktive aktive Linie gewählt.
- Debug zeigt active strategy, candidate strategies, switch reason und blockers.

## P2. CardSemanticProfile-Präzision: Kartenweite Signale und ability-spezifische Signale trennen

Ziel:
ActionSemanticCandidates sollen bei kartenbasierten Actions nicht pauschal alle kartenseitigen Signale jeder Fähigkeit erhalten, wenn eine konkrete Ability gebunden ist. Fähigkeitsspezifische Effekte sollen soweit möglich nur für die tatsächlich ausgeführte Ability wirken.

Warum:
Eine Karte kann mehrere Fähigkeiten oder passive/aktive Effekte haben. Wenn alle Taktiksignale auf jede Aktion projiziert werden, kann eine Economy-Aktion wie ein Punish-Payoff aussehen oder eine Setup-Fähigkeit fälschlich Zugriff-/Damage-Semantik erhalten.

Umsetzung:
- Prüfe `action-card-semantic-profiles.ts`, `action-card-semantic-join.ts`, `action-semantic-candidate.ts` und Ability-Binding.
- Unterscheide:
  - card-level passive/static/context semantics,
  - ability-specific semantics,
  - compatibility/legacy hint signals.
- Wenn `abilityId` vorhanden ist:
  - ability-specific semantics dieser Ability bevorzugen,
  - card-level passive/static semantics nur dann ergänzen, wenn sie wirklich immer gelten,
  - nicht alle card-level effect signals blind auf die Action legen.
- Wenn `abilityId` unklar bleibt:
  - Candidate sauber als `ability_unresolved`/coverage gap markieren,
  - keine falschen starken Strategy-/Punish-/Closeout-Signale raten.
- Entferne oder isoliere `role:*`, `plan_role:*`, `line_support:*`, `strategic_role:*` aus den handlungswirksamen Taktiksignalen, falls sie nur Kompatibilität/Debug sind.
- Falls diese Felder noch gebraucht werden: als `compatibilitySignals` oder Debug/Evidence führen, aber nicht als Primärquelle für Action-Fit, StrategySupport oder Punish-Fit verwenden.

Abnahme:
- Test: Karte mit mehreren Fähigkeiten projiziert bei gebundener Ability nur die passende Ability-Semantik.
- Test: Unresolved Ability erhält keine falschen starken Punish-/Score-/Access-Signale.
- Test: BasicActions bleiben unabhängig von Karten-Hints.
- Test: `role:*`/`plan_role:*`/`line_support:*` sind nicht handlungswirksame Primärsignale im Scoring.
- Debug zeigt, ob Signale card-level, ability-level, compatibility oder unresolved sind.

## P3. StrategySupport-Ableitung härten

Ziel:
`StrategySupportPair`s dürfen nicht pauschal aus `lineSupport` oder losen `strategicRole`-Feldern entstehen. Strategiebezug muss aus echten Strategieankern/Payoff-/Engine-/Enabler-/Win-Condition-Semantik oder explizit qualifizierten StrategySupportPairs kommen.

Warum:
Der Guide verlangt: Support-only ist nicht automatisch Strategie. `lineSupport` kann nützlicher Kontext sein, darf aber keine Strategie tragen. Sonst kehrt die alte „Support erzeugt Strategie“-Logik durch die CardSemanticProfile-Brücke zurück.

Umsetzung:
- Prüfe, wie AI-Hints aktuell `lineSupport`, `strategicRole`, `roles`, `planRoles`, `strategySupport` und Anchor-Signale modellieren.
- Führe eine klare Trennung ein:
  - `primaryAnchorEvidence`,
  - `supportingEvidence`,
  - `compatibilityEvidence`.
- StrategySupportPair nur erzeugen, wenn:
  - Strategie-ID explizit und fachlich zulässig ist,
  - role vorhanden ist,
  - confidence vorhanden ist,
  - evidence vorhanden ist,
  - mayAnchorStrategy/anchor kind oder äquivalente Kennzeichnung erfüllt ist.
- Support-only bleibt Support-only.
- Für generische Economy, Draw, einfache Suche, einfache Recovery, Tag-Clear, normale Damage Prevention, Expose/Scouting: keine produktive StrategySupportPair-Erzeugung.
- Bestehende DeckStrategyProfile-Tests für ankerlose Decks und unvollständige Linien erweitern.

Abnahme:
- Test: Economy/Draw/Search-Support erzeugt keine StrategySupportPair.
- Test: R&D Interface / HQ Interface / klare Multiaccess-Payoffs erzeugen zulässige StrategySupportPairs.
- Test: Tagquelle ohne Payoff ergibt keine vollständige Tag/Punish-Strategie.
- Test: Damage-Payoff ohne erfüllbare Bedingung bleibt partial/blocked.
- Test: `lineSupport` allein kann eine Strategie nicht produktiv machen.

## P4. Signal-Katalog und Invariant-Checks für Semantikpräzision

Ziel:
Breite, beschreibende oder richtungsfalsche Signale sollen durch lokale Checks/Reports sichtbar werden. Nicht alles muss sofort gelöscht werden, aber handlungswirksame Semantik darf nicht auf verbotenen oder zu groben Primärsignalen beruhen.

Warum:
Das Zielmodell verlangt kontrollierte Taktiksignale. Typ, Subtyp, Name oder Thema sind keine Taktiksignale. Breite Oberklassen wie `damage.payoff`, `access.punish`, `economy.generic`, `setup.search` dürfen höchstens Aggregation/Legacy sein, nicht alleinige Primär-Evidenz.

Umsetzung:
- Baue oder erweitere lokale Reports/Checks für:
  - verbotene Subtyp-/Typ-/Name-only-Signale,
  - zu breite Oberklassensignale als alleinige Primärsignale,
  - StrategySupport ohne role/confidence/evidence,
  - Support-only als Strategieanker,
  - falsche Damage-Typen,
  - unpräzise Tag-Rollen,
  - unpräzise Conditions,
  - TargetProfiles mit Hidden-Info-Risiko.
- Verwende die vorhandenen Architektur-/Guide-Dokumente als Norm.
- Keine riesige CI-Infrastruktur; lokale `pnpm`-Checks oder fokussierte Vitest-Reports reichen.
- Reports sollen zwischen „hart falsch“, „legacy/compatibility erlaubt“ und „deferred“ unterscheiden.

Abnahme:
- Tests/Checks schlagen an, wenn z. B. `hardware.chip`, `setup.vehicle`, `operation.black_ops`, `corp.operation`, `damage.payoff` als alleinige Primär-Evidenz oder StrategyAnchor verwendet wird.
- Tests/Checks erlauben generische Signale als Aggregation/compatibility, wenn ein präzises Primärsignal vorhanden ist.
- Dokumentation beschreibt, welche Signalklassen handlungswirksam sein dürfen.

## P5. TargetProfile- und TargetContext-Qualität schärfen

Ziel:
Zielprofile und TargetContext sollen nicht nur formal vorhanden sein, sondern für relevante Zielaktionen genug side-safe Informationen tragen, damit spätere Zielwahl und Action-Fit nicht raten müssen.

Warum:
TargetProfiles wirken nur, wenn konkrete legale Ziele oder Zieloptionen side-safe ankommen. `targetRequirements` allein beschreiben oft nur Form, nicht konkreten Wert. Besonders wichtig sind Hardware-/Resource-/Program-Trash, ICE-Zielwahl, Counter-Placement/Transfer, Search/Install-Ziele und Server-/Remote-Auswahl.

Umsetzung:
- Prüfe `action-target-context.ts`, LegalAction-TargetRequirements und Candidate-Projektion.
- Für Zielaktionen:
  - selected targets,
  - available targets,
  - choice options,
  - visible target metadata,
  - constraints wie `not_cybernetics`,
  - target zone,
  - target side,
  - server identity
  side-safe projizieren, soweit vorhanden.
- Wenn Engine die konkrete Option nicht liefert, kein Raten: `target_context_unavailable`, `available_targets_missing`, `engine_only_target_blocked`.
- Für TargetProfiles:
  - klare HiddenInfoPolicy,
  - klare fallback policy,
  - constraints getrennt von Taktiksignalen.
- Fokus auf Karten/Fälle, die bereits produktiv relevant sind:
  - Power Grid Overload / Hardware-Trash,
  - Corporate Detective Agency / Resource-Trash,
  - ICE-Control-/Sabotage-Preps,
  - Program Search/Install,
  - Advancement-Counter-Ziele,
  - Server-Targeting bei Runs und Redirects.

Abnahme:
- Test: Cybernetics-Hardware wird bei Hardware-Trash korrekt geschützt oder als Constraint erkannt.
- Test: Resource-/Hardware-/Program-Trash erhält konkrete side-safe TargetContext-Daten, wenn Engine sie anbietet.
- Test: Engine-only Targets werden nicht ins Debug geleakt.
- Test: Missing target context erzeugt Coverage-Evidence statt falscher Präferenz.

## P6. Doctrine-v1-Reste bereinigen und klar begrenzen

Ziel:
Doctrine v1 darf weiter existieren, wenn explizite Legacy-/Fixture-/Benchmark-Pfade sie benötigen. Sie darf aber nicht mehr semantisch missverständlich als Opening-/Runtime-Zielmodell erscheinen.

Warum:
Der Cutover hat die produktive Nutzung weitgehend entfernt, aber `deck-doctrine.ts` enthält weiterhin alte PlanWeights, MulliganWeights und Kommentare. Das ist akzeptabel als Legacy, aber riskant als künftiger Anknüpfungspunkt.

Umsetzung:
- Prüfe alle produktiven Imports/Nutzungen von:
  - `buildDeckDoctrineProfile`,
  - `planWeights`,
  - `archetypeTags`,
  - `mulliganWeights`,
  - `evaluateCorpOpeningHand`,
  - `evaluateRunnerOpeningHand`.
- Korrigiere Kommentare in `deck-doctrine.ts`: Opening/Mulligan sollen nicht mehr als Doctrine-v1-produktiv beschrieben werden, wenn die aktuelle Logik semantischen Kontext nutzt.
- Entferne ungenutzte Helper wie alte Doctrine-Evidence-Funktionen, falls tatsächlich unbenutzt.
- Falls möglich, verschiebe oder benenne Doctrine-v1-Dateien/Exports deutlicher als Legacy, ohne Public-API unnötig zu brechen.
- Falls Public-API erhalten bleiben muss: intern als Legacy markieren und in Tests absichern, dass normale Runtime/Opening/Discard keine PlanWeights liest.

Abnahme:
- Suche nach produktiven PlanWeight-/ArchetypeTag-Nutzungen ergibt nur explizite Legacy-/Benchmark-/Fixture-Pfade.
- Tests belegen: Opening/Mulligan und Discard hängen an StrategyProfile/Capabilities/StrategicIntent, nicht an Doctrine-v1-PlanWeights.
- Kommentare und Doku widersprechen dem aktuellen Stand nicht mehr.
- Kein normaler DecisionDebug referenziert Doctrine-v1-PlanWeights.

## P7. PracticalTacticOverlay und PracticalMicro als opt-in Altpfade härten oder absorbieren

Ziel:
Opt-in-Overlays sollen keine zweite, unklare KI-Wahrheit bleiben. Bewährte Regeln sollen, wenn produktiv relevant, in normale Semantic Runtime, Goals, HardGates, ScoreComponents oder FallbackPolicy wandern. Nicht migrierte Regeln bleiben explizit Benchmark/Opt-in.

Warum:
Auch wenn diese Module default off sind, können sie bei Aktivierung nachträglich Entscheidungen überschreiben. Das ist fachlich nur akzeptabel, wenn klar dokumentiert ist, dass es kein Normalpfad ist, oder wenn die Logik in das normale semantische Modell integriert wurde.

Umsetzung:
- Inventar aller Kandidaten in `practical-tactic-overlay.ts` und `practical-micro-runtime.ts`.
- Für jede Regel klassifizieren:
  - bereits durch Semantic Runtime abgedeckt,
  - als Testfall in Semantic Runtime zu überführen,
  - als Benchmark-only beizubehalten,
  - zu löschen.
- Keine Label-/Regex-Heuristik als produktive Default-Wirkung erhalten.
- Falls Regeln migriert werden:
  - neue/erweiterte ScoreComponent oder TacticalGoal,
  - warum/wie im Debug erklären,
  - Tests aus Overlay-Fall auf Standard-Semantic-Runtime umstellen.
- Falls Regeln bleiben:
  - Dateikommentar: opt-in benchmark/comparator only,
  - Tests stellen sicher, dass default off keine Entscheidung ändert.

Abnahme:
- Default-Entscheidungen benötigen PracticalTacticOverlay/PracticalMicro nicht.
- Opt-in-Verhalten ist klar dokumentiert.
- Relevante alte Overlay-Fälle sind entweder semantisch integriert oder bewusst als Benchmark-only markiert.
- Keine versteckte Legacy-Auswertung im Standardpfad.

## P8. TacticalPlans weiter modularisieren, aber nur entlang echter Verantwortungsgrenzen

Ziel:
`tactical-plans.ts` soll weiter in Richtung lesbarer, testbarer Verantwortungsgrenzen zerlegt werden, aber ohne Groß-Rewrite.

Warum:
Der aktuelle Strukturledger markiert die Datei weiter als `IN_PROGRESS`. Eine zu große Datei erschwert Semantikpräzisierung und Debugging. Gleichzeitig läuft sie produktiv; daher nur kompakte, sichere Schnitte.

Umsetzung:
- Keine semantische Großmigration.
- Nur Extraktionen mit klarer Grenze:
  - Runner Plan Builders,
  - Corp Plan Builders,
  - Plan Mapping,
  - Plan Debug/Display,
  - Plan Action Values,
  - Plan Memory/Continuation.
- Jede Extraktion mit fokussierten Tests oder bestehenden Tests absichern.
- Keine Score-/Behavior-Änderung ohne expliziten Test.

Abnahme:
- `tactical-plans.ts` wird weiter reduziert.
- Neue Module haben klare Kommentare zur Verantwortung.
- Bestehende TacticalPlan-Tests bleiben grün.
- Kein Verhalten ändert sich unbeabsichtigt.

## P9. Debug/Reports für neue Präzision ergänzen

Ziel:
Debug und Reports sollen zeigen, ob eine Action ihre Semantik aus BasicAction, card-level, ability-level, target-level, compatibility oder fallback coverage erhält.

Warum:
Die nächste Kalibrierungsphase wird replaygetrieben. Dafür muss sichtbar sein, ob Entscheidungen auf präziser Semantik oder Übergangs-/Compatibility-Signalen beruhen.

Umsetzung:
- Debug-DetailSections erweitern:
  - `action_semantic_projection`,
  - `ability_semantic_binding`,
  - `target_context`,
  - `strategy_portfolio`,
  - `compatibility_signals`,
  - `coverage_gaps`.
- Keine Hidden-Info leaken.
- Keine Action-ID-Listen in öffentlichen Evidenceflächen, wenn bisheriger Redaction-Vertrag dies verhindert.
- Coverage-Fallbacks und unresolved abilities deutlich anzeigen.

Abnahme:
- Tests für Debug-Sections.
- Replay-/Simulation-Debug kann erkennen:
  - ability bound/unresolved,
  - target context present/missing,
  - strategy active/alternate/blocked,
  - exact vs kind target match,
  - compatibility signal used or ignored.

## P10. Tests, Typecheck und Abschlussdoku

Ziel:
Das Folgepaket soll mit fokussierten Tests und einer kurzen Abschlussdokumentation enden.

Verifikation:
- `corepack pnpm --filter @netgrid/ai typecheck`
- fokussierte Vitest-Läufe für geänderte Module
- vollständiger `corepack pnpm --filter @netgrid/ai test`, wenn Änderungen breit genug sind
- `git diff --check`

Abschlussdoku:
- Aktualisiere das Folgeinventar mit:
  - erledigte Punkte,
  - verbliebene bewusste Grenzen,
  - Teststatus,
  - offene Replay-/Kalibrierungsfolgepunkte.
- Projektstatus/Monatslog nur dann aktualisieren, wenn das im Projekt üblich ist und der Stand wirklich relevant ist.

Definition of Done:
- Strategy-Portfolio verliert keine produktiven Kandidaten mehr.
- ActionSemantics trennen card-level und ability-level sauberer.
- StrategySupport entsteht nicht mehr pauschal aus Support-/LineSupport-Feldern.
- Breite/legacy Signale sind als solche sichtbar und nicht Primärgrund für Strategien.
- TargetContext zeigt konkrete side-safe Zielinformationen oder klare Coverage-Gaps.
- Doctrine-v1 ist klar Legacy/Fixture/Benchmark und nicht irreführend dokumentiert.
- Practical-Overlays sind default-off, klar begrenzt oder in Semantic Runtime absorbiert.
- TacticalPlans sind an mindestens einer sinnvollen Grenze weiter modularisiert.
- Debug erklärt Präzision und Coverage-Gaps.
- Tests und Typecheck sind grün.
- Keine Engine-/LegalAction-/Hidden-Info-Vertragsänderung.
- Keine neue LegalAction-Erzeugung.
```

## Kurzbegründung des Folgepakets

Dieses Folgepaket ist absichtlich kleiner als der vorherige Cutover. Der Normalpfad ist bereits semantisch, daher liegt der Nutzen jetzt in Präzision:

1. Strategieportfolio statt „erste produktive Primary“.
2. Ability-spezifische Semantik statt kartenweiter Signale auf jeder Action.
3. Harte Trennung von StrategyAnchor und Support.
4. Sichtbare Signalqualität und Coverage-Gaps.
5. Legacy-v1 und opt-in Overlays sauber begrenzen.
6. TacticalPlans weiter modularisieren, aber nur entlang echter Verantwortungsgrenzen.

Nicht Ziel dieses Pakets ist ein Proteus-Vollausbau oder ein weiterer großer Runtime-Cutover.
