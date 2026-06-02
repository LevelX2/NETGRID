# AI022-1 Tactic-Signal-Taxonomie-Cleanup

## Kurzfazit

AI022-1 bereinigt mehrere missverständliche Taktiksignal-Zuordnungen ohne neue Planner-, Engine-, LegalAction-, Targeting-, Profil- oder UI-Wirkung. Der Inspector bleibt technisch geschlossen: 564 Karten, 459 Karten mit abgeleiteten Function-Signalen, 308 verwendete Signale und 0 verwendete, aber nicht katalogisierte Signale. Der Signalkatalog enthält nach dem aktuellen AI023-Stand 387 katalogisierte Signale; davon sind 79 aktuell ungenutzt oder deferred.

## Scope / Out-of-Scope

Scope waren `data/ai/tactic-signals-v1.json`, `data/ai/function-signal-derivation-v1.json`, aktive und kompilierte AI-Hints, der Inspector-Index, ein fokussierter AI022-1-Check sowie dieser Review und der JSON-Report.

Nicht im Scope waren neue Strategy IDs, Planner-/ActionScore-/PlanWeight-Wirkung, Engine-/Legalitätsänderungen, neue Targeting-KI, UI-Änderungen, vollständige Neuvergabe aller Kartensemantiken oder riskante Legacy-Umbenennungen.

## Ausgangslage

Der Nutzerprompt nannte als Eingangslage: 564 Inspector-Karten, 458 Karten mit Taktik-/Function-Signalen, 318 katalogisierte Signale, 306 verwendete Signale, 74 verwendete Signalgruppen, 0 uncataloged used signals und 12 ungenutzte katalogisierte Signale. Im lokalen Repo war kein exakt benannter `docs/reviews/ai/tactic-signal-used-catalog-2026-06-02.md` und kein `docs/ai/netgrid_taktiksignal_strategieanker_guide_v2.md` vorhanden. Führende Quelle war daher der aktuelle Inspector-Index zusammen mit `tactic-signals-v1.json` und `function-signal-derivation-v1.json`.

## Taxonomie-Befund

- `supportOnly=true` bleibt hart: Support-Signale dürfen keine Strategy IDs verursachen.
- Broad-/Legacy-Signale bleiben erhalten, sind aber als `broad_support/not_for_direct_scoring` dokumentiert.
- `corp.*` bei Runner-Signalen bedeutet betroffene Corp-Zone oder betroffener Corp-Zustand, nicht handelnde Corp-Seite.
- Trait-, Subtype- und Visibility-Signale bleiben vorerst kompatibilitätsseitig erhalten, werden aber nicht als direkte DeckDoctrine-Strategieanker behandelt.
- Coverage-Subtype-Signale wie `breaker.subtype.watchdog` bleiben zulässig, weil sie Ziel-/Coverage-Semantik ausdrücken und nicht den Subtyp der eigenen Karte.

## Geänderte Signale

- `economy.action`: Derivation auf `action_economy` mit `resource=credits` verengt. Extra-Aktionen werden nicht mehr als Credit-Economy abgeleitet.
- `economy.trash_credit`: Derivation auf echte Runner-/Remote-Trash-Credit-Unterstützung verengt. Kostenloses Trashen bleibt auf `access.*`.
- `ice.derez_black_ice`: neu als support-only ICE-Control-Signal für Black-Ice-Derez.
- `ice.trash_rezzed`: bestehendes Signal erhält eine zusätzliche Derivation für `target=rezzed_ice`.
- `defense.meat_damage_prevention`: Event-Derivation ergänzt, damit `Identity Donor` korrekt sichtbar wird.
- `access.trash_untrashable`: Event-Derivation und konkrete Card Effects für `Kilroy Was Here` und `Romp through HQ` ergänzt.

## Legacy- und Oberklassensignale

Behalten, aber nicht direkt zu scoren:

- `economy.generic`
- `economy.recurring`
- `defense.damage_prevention`
- `setup.search`
- `setup.recovery`
- `setup.draw`
- `run.make_run`

`run.event_tempo` bleibt als breite, anchorfähige Struktur erhalten. Die spätere Bewertung darf daraus aber nur eine echte Decklinie machen, wenn Run-Erzeugung, Payoff, Risikoabsicherung und Dichte zusammen nachgewiesen sind.

## Kartenkorrekturen

- `Anonymous Tip`: kein Expose mehr; neu `ice.derez_black_ice` und TargetProfile `black_ice_derez`.
- `Core Command: Jettison Ice`: `ice.trash_rezzed` wird aus dem vorhandenen `ice_trash`-Effect abgeleitet.
- `Senatorial Field Trip`: zusätzlich `ice.derez_black_ice`, weiter `corp.bad_publicity_pressure`, kein Strategy Anchor.
- `Identity Donor`: zusätzlich `defense.meat_damage_prevention`, weiter Bad-Publicity-Pressure, kein Survival-Anchor.
- `Kilroy Was Here`: `economy.trash_credit` entfernt; `access.free_trash`, `access.trash_untrashable`, `access.rnd_trash_pressure` bleiben.
- `Romp through HQ`: `economy.trash_credit` entfernt; `access.free_trash`, `access.trash_untrashable`, `access.hq_trash_pressure` bleiben.
- `Lucidrine™ Drip Feed`: kein `economy.action` mehr; `action.recurring_extra_action` und `risk.brain_damage_self_inflicted` bleiben.
- `Record Reconstructor`: bleibt `corp.archives_to_rnd_pressure` und Archives/R&D-Manipulation ohne R&D-Pressure-Anchor.

## Präfixkonvention

Die neue Katalog-Policy dokumentiert: `sideScope` beschreibt die Seite der Karte beziehungsweise den Besitzerkontext. Ein Side-Präfix im Signal ist dagegen semantisch. `corp.bad_publicity_pressure` und `corp.archives_to_rnd_pressure` sind Runner-seitige Signale, die Corp-Zustand oder Corp-Zonen betreffen. Sie bedeuten nicht, dass die Corp handelt.

## Trait-, Visibility- und Subtype-Abgrenzung

`resource.connection`, `resource.position`, `resource.unique`, `resource.hidden`, `hidden.runner_resource`, `hidden.reveals_on_use`, `hidden.reveals_on_trash` und verwandte Signale bleiben als Legacy-/Visibility-/Trait-Kontext erhalten. Mittelfristig gehören solche Daten eher in Kartendaten, PublicContext, Constraints oder TargetProfiles. `resource.sabotage` bleibt nur dann funktional belastbar, wenn konkrete Effekt-Signale daneben stehen.

## Strategy-Anker-Spaltenklärung

Der AI022-1-JSON-Report unterscheidet pro Signal:

- `signalMayAnchorStrategy`
- `supportOnly`
- `anchorCausedBySignal`
- `strategyAnchorsDerivedBySignal`
- `cardLevelStrategyAnchorsObserved`

Damit ist klar: Karten mit einem Support-Signal dürfen zusätzlich Strategy Anchors haben, aber das Support-Signal selbst ist nicht automatisch die Ursache.

## Ungenutzte Signale

Der aktuelle Katalog enthält 79 ungenutzte Signale. Das ist höher als die Eingangszahl aus dem Prompt, weil der lokale Stand bereits AI023-Corp-Agenda-Signale enthält. Relevante Beispiele:

- `breaker.watchdog`: bewusst ungenutztes General-Coverage-Signal; Dogcatcher nutzt subtype-limited Signale.
- `defense.ap_damage_mitigation`: retain/deferred; Microtech ’Trode Set nutzt aktuell `defense.ap_subroutine_mitigation`.
- `score.gray_ops_agenda_condition`: retain/deferred; Desperate Competitor nutzt aktuell `score.conditional_agenda_point`.
- `remote.bait`, `economy.advanceable`, `run.lock`: retain/deferred, keine vorschnelle Löschung.

## Deferred Items

- Keine Rename-Welle für `corp.*`; Prefix wurde dokumentiert.
- `run.event_tempo` bleibt späterer Scoring-/Decklinien-Review.
- Trait-/Hidden-Resource-Signale bleiben kompatibel, sollen später aus der Taktiksignal-Ebene herausgelöst werden.
- Record Reconstructor bleibt TargetProfile-Kandidat bis zur LegalAction Semantic Bridge.

## Verifikation

Der JSON-Report liegt unter `docs/reviews/ai/ai022-1-tactic-signal-taxonomy-cleanup-report-2026-06-02.json`. Der neue Check ist `scripts/check-ai022-1-tactic-signal-taxonomy-cleanup.mjs` beziehungsweise `corepack pnpm check:ai022-1-tactic-signal-taxonomy`.

Ausgeführt:

- `corepack pnpm build:ai-compiled-hints`
- `corepack pnpm build:ai-hint-inspector-index`
- `node scripts/check-ai022-1-tactic-signal-taxonomy-cleanup.mjs --write-report`

Weitere Paketchecks werden im Abschlusslauf dokumentiert.

## Risiken / Folgeempfehlungen

Die Bereinigung verbessert die Semantik, aktiviert aber keine neue Entscheidungslogik. Das größte Restthema ist die Trennung von echten Funktionssignalen und Legacy-/Trait-/Visibility-Kontext. Dafür sollte ein späterer, kleiner Migrationsschnitt die betroffenen `resource.*`- und `hidden.*`-Signale in ein eigenes Descriptor- oder PublicContext-Modell überführen.
