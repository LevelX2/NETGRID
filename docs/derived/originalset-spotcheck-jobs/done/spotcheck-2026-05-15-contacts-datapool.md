---
startedAt: 2026-05-15T05:50:41.3514653Z
jobId: spotcheck-2026-05-15-contacts-datapool
status: done
completedAt: 2026-05-15T06:00:28.4841108Z
createdAt: 2026-05-15T06:12:07+01:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_097_livewires-contacts
    title: Livewire's Contacts
  - cardId: onr_v1_257_nerve-labyrinth
    title: Nerve Labyrinth
  - cardId: onr_v1_301_punitive-counterstrike
    title: Punitive Counterstrike
  - cardId: onr_v1_290_efficiency-experts
    title: Efficiency Experts
  - cardId: onr_v1_079_bodyweight-synthetic-blood
    title: Bodyweight Synthetic Blood
  - cardId: onr_v1_259_in-the-face
    title: Pi in the 'Face
  - cardId: onr_v1_350_antiquated-interface-routines
    title: Antiquated Interface Routines
  - cardId: onr_v1_239_endless-corridor
    title: Endless Corridor
  - cardId: onr_v1_285_closed-accounts
    title: Closed Accounts
  - cardId: onr_v1_287_datapool-by-zetatech
    title: Datapool by Zetatech
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-contacts-datapool

## Auswahlprüfung

- Geprüfte Register und Jobverzeichnisse: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json`, `docs/derived/originalset-spotcheck-jobs/inbox/`, `docs/derived/originalset-spotcheck-jobs/in_progress/`, `docs/derived/originalset-spotcheck-jobs/done/`, `docs/derived/originalset-spotcheck-jobs/blocked/`.
- Ausgeschlossene Quellen/Karten zusammengefasst: 70 bereits registrierte oder in Jobberichten reservierte Card IDs wurden ausgeschlossen. Die aktuell noch in `inbox` und `in_progress` liegende Dublette `spotcheck-2026-05-15-ai-boon-virizz.md` wurde ebenfalls als Tabu-Quelle behandelt.
- Auswahlbegründung: Die zehn Karten wurden zufällig aus einem vorgefilterten Restpool komplexerer, bereits decklegaler Originalset-Karten gewählt. Priorisiert wurden alte Sammeltest-Karten mit Timing-, Damage-, Tag-, ICE-Subroutine-, Server-Modifier-, Hidden-Info- oder PublicPayload-Relevanz, die noch nicht im Spotcheck-Register oder in vorhandenen Queue-Berichten vorkommen.
- Geprüfte Fachartefakte: Runtime-Resolver und Tests in `packages/engine/src/index.ts` und `packages/engine/src/index.test.ts`, Katalogstatus in `packages/catalog/src/index.ts`, Release-Manifeste `data/manifests/card-implementation-manifest-1.0.5k.json`, `data/manifests/card-implementation-manifest-1.0.6k.json`, `data/manifests/card-implementation-manifest-1.1.2k.json`, `data/manifests/card-implementation-manifest-1.6.3.json`, AI-Hints und Smokes unter `data/ai/` und `data/scenarios/`.

## Kartenbefunde

### onr_v1_097_livewires-contacts - Livewire's Contacts

Bewertung:
- Engine: Resolver `onr_runner_event_gain_credits_3` erhöht Runner-Credits um 3. Katalogkosten stehen auf 0, Play-Event läuft über normale LegalAction- und applyAction-Kostenpfade.
- Chronik: Alter Sammeltest prüft nur Creditstand. Es fehlt ein fokussierter Nachweis, dass das PublicPayload den Event, die Quelle und den Credit-Delta verständlich, aber ohne private Hand-/Stackdaten abbildet.
- Tests: Abgedeckt in V1.0.6K-Sammeltest und AI-King-of-the-Road-Smoke. Nicht abgedeckt sind Wrong-Side, stale `stateVersion`, public event payload und Replay/StateHash für genau diese Karte.
- Hidden-Info/Replay/StateHash: Keine Hidden-Zone-Auswahl. Risiko liegt in generischem Event-Logging: keine gezogenen/verdeckten Karten, aber der öffentliche Creditgewinn soll chronikfähig bleiben.
- Fehlende Härtungen: Einzeltest für Eventkosten, side/stateVersion-Revalidierung, PublicPayload und Replay.

Notwendige Umsetzung:
- [ ] Fokussierten Engine-Test `onr_v1_097_livewires-contacts` ergänzen: LegalAction nur Runner, Kosten 0 plus Click, Creditgewinn exakt +3.
- [ ] Wrong-Side- und stale-`stateVersion`-Versuche gegen dieselbe LegalAction testen.
- [ ] PublicPayload auf `cardDefinitionId`, `actionType`, Credit-Delta oder Runner-Credits-after härten; falls Felder fehlen, Resolver-Payload ergänzen.
- [ ] Replay/StateHash über den Eventzug verifizieren.

Akzeptanzkriterien:
- [ ] Runner erhält exakt 3 Credits und die Karte landet nach `play_event` im Heap.
- [ ] Corp kann den Event nicht einreichen; alte `stateVersion` wird abgelehnt.
- [ ] PublicEvent/Chronik nennen Quelle und Effekt ohne private Karten-IDs.
- [ ] Replay erzeugt denselben StateHash.

### onr_v1_257_nerve-labyrinth - Nerve Labyrinth

Bewertung:
- Engine: Katalog definiert Rez-Kosten 6, Stärke 4, Code-Gate-ICE mit 2 Net Damage und End-the-run. Die generische Subroutine-Auslösung nutzt Damage-ImminentEvent und danach End-the-run.
- Chronik: Hidden-Info-Barriere für Damage ist vorhanden, aber der vorhandene Test ist Teil eines ICE-Sammelpfads. Die konkrete Nerve-Labyrinth-Abfolge Damage plus Run-Ende sollte als Chronikfall lesbar sein.
- Tests: V1.1.2K deckt Sichtbarkeit vor Rez und generische ICE-Auflösung. Ein enger Test für ungebrochene Subroutinen, Net-Damage-Payload und Run-Ende fehlt.
- Hidden-Info/Replay/StateHash: Damage trashiert zufällige Gripkarten deterministisch per Seed/RandomCounter. PublicPayload darf Anzahl und Damage-Typ nennen, nicht die getroffenen Gripkarten.
- Fehlende Härtungen: Fokussierter Test für ungebrochene Nerve-Labyrinth-Subroutinen, Damage-Redaction, RandomDrawRecords/StateHash und Continue-Run-Revalidierung.

Notwendige Umsetzung:
- [ ] Testzustand mit Runner-Grip, Run auf Nerve Labyrinth und ungebrochenem Continue-Run aufbauen.
- [ ] Prüfen, dass 2 Net Damage passieren, der Run endet und `damageResolved` mit `damageType: net` öffentlich erscheint.
- [ ] Prüfen, dass PublicPayload, PlayerViews und Replay keine konkreten Grip-Card-IDs leaken.
- [ ] Stale-/Wrong-Side-Versuche für `continue_run` oder relevante Break-/Continue-LegalAction ergänzen.

Akzeptanzkriterien:
- [ ] Ungebrochene erste Subroutine verursacht exakt 2 Net Damage.
- [ ] Die End-the-run-Subroutine beendet den Run deterministisch.
- [ ] PublicPayload enthält nur Damage-Summary, keine privaten Kartennamen oder Instanz-IDs.
- [ ] Replay/StateHash ist stabil.

### onr_v1_301_punitive-counterstrike - Punitive Counterstrike

Bewertung:
- Engine: Resolver verlangt getaggten Runner und ruft `resolveDamageOperation` mit 2 Meat Damage auf. Damage nutzt deterministischen Zufall und Hidden-Info-Barriere.
- Chronik: Sammeltest prüft DamagePayload und `not.toContain("runner_")`, aber nicht spezifisch LegalAction-Projektion bei ungetaggtem Runner und Event-Modification-Interaktion.
- Tests: V1.0.6K-Sammeltest deckt tagged Runner, Damagehöhe und Payload grob ab. Es fehlen Einzeltests für kein LegalAction-Angebot ohne Tag, stale/wrong-side und mögliche Prevention-/Replacement-Fenster.
- Hidden-Info/Replay/StateHash: Hohe Relevanz durch zufälligen Grip-Trash. PublicPayload darf Damagebetrag und Kartenanzahl nennen, aber keine getroffenen Karten.
- Fehlende Härtungen: Zieltest für Tag-Voraussetzung, Damage-Replacement/Prevention-Fenster, Payload und Replay.

Notwendige Umsetzung:
- [ ] Testen, dass ohne Runner-Tag keine `play_operation`-LegalAction für Punitive Counterstrike angeboten wird.
- [ ] Mit Runner-Tag exakt 2 Meat Damage auslösen und PublicPayload auf Damage-Summary prüfen.
- [ ] Wrong-Side und stale `stateVersion` gegen die ausgewählte Operation ergänzen.
- [ ] Einen Replay/StateHash-Test mit fester Seedbasis und kontrollierter Runner-Grip ergänzen.

Akzeptanzkriterien:
- [ ] Ohne Tag ist die Karte legal nicht spielbar und `applyAction` kann sie nicht durchmogeln.
- [ ] Mit Tag werden genau 2 Meat Damage deterministisch abgewickelt.
- [ ] Keine private Grip-Information erscheint in PublicEvents, PlayerViews oder Replay-Payloads.
- [ ] Damage-Prevention-/Replacement-Fenster bleiben kompatibel.

### onr_v1_290_efficiency-experts - Efficiency Experts

Bewertung:
- Engine: Resolver `onr_corp_operation_gain_credits_3` erhöht Corp-Credits um 3. Katalogkosten stehen auf 0; Ausführung läuft über `play_operation`.
- Chronik: Der Effekt ist simpel, aber alte Sammeltests prüfen nur Endwert. Die Chronik sollte Quelle, Kosten 0 und Creditgewinn eindeutig darstellen.
- Tests: V1.0.6K-Sammeltest und Legacy-AI-Smoke vorhanden. Kein fokussierter side/stale/PublicPayload-Test.
- Hidden-Info/Replay/StateHash: Operation selbst hat keine verdeckten Ziele. Da `play_operation` als Hidden-Info-Barriere klassifiziert wird, muss PublicPayload nur die gespielte Operation und Creditwirkung zeigen, ohne HQ-Kontext.
- Fehlende Härtungen: Einzeltest für Kosten, PublicPayload und Replay.

Notwendige Umsetzung:
- [ ] Fokussierten Test für `onr_v1_290_efficiency-experts` ergänzen: LegalAction-Kosten, Corp-Credit +3, Operation geht aus HQ in Archives.
- [ ] Wrong-Side- und stale-`stateVersion`-Revalidation prüfen.
- [ ] PublicPayload um Credit-Delta oder `corpCreditsAfter` ergänzen, falls im aktuellen Event nicht klar genug.
- [ ] Replay/StateHash für den Operation-Zug verifizieren.

Akzeptanzkriterien:
- [ ] Corp erhält exakt 3 Credits, zahlt 0 Credits und 1 Click.
- [ ] Runner kann die Operation nicht einreichen; stale Action scheitert.
- [ ] Chronik ist ohne HQ-Leak verständlich.
- [ ] Replay bleibt deterministisch.

### onr_v1_079_bodyweight-synthetic-blood - Bodyweight Synthetic Blood

Bewertung:
- Engine: Resolver `onr_runner_event_draw_5` zieht fünf Runner-Karten. Da die Eventkarte beim Spielen die Grip verlässt, sieht der Sammeltest netto +4 Gripkarten.
- Chronik: Draw-Effekte sind hidden-info-sensibel. Der alte Test prüft nur Grip-Länge, nicht PublicPayload oder Corp-View-Redaction.
- Tests: V1.0.6K-Sammeltest und AI-King-of-the-Road-Smoke vorhanden. Kein fokussierter Test für leeren/teilweise leeren Stack, Redaction und Replay.
- Hidden-Info/Replay/StateHash: Ziehen aus dem Stack darf in PublicEvents keine Kartentitel oder Instanz-IDs offenlegen. Bei weniger als fünf Karten muss der Resolver deterministisch und ohne Fehler bis Stack-Ende ziehen.
- Fehlende Härtungen: Focus-Test für Draw-Count, leeren Stack, PlayerViews, PublicEvents und StateHash.

Notwendige Umsetzung:
- [ ] Test mit kontrolliertem Stack ergänzen: fünf Karten ziehen, Event in Heap, netto erwartete Grip-Differenz dokumentieren.
- [ ] Test mit weniger als fünf Stackkarten ergänzen: keine Exception, nur vorhandene Karten ziehen.
- [ ] PublicPayload/PlayerViews prüfen: Corp sieht keine gezogenen Kartennamen oder Instanz-IDs.
- [ ] Replay/StateHash für beide Draw-Pfade prüfen.

Akzeptanzkriterien:
- [ ] Normalfall zieht fünf Karten und verändert Zonen korrekt.
- [ ] Kurzer Stack wird stabil behandelt.
- [ ] Öffentliche Chronik nennt keinen privaten Draw-Inhalt.
- [ ] Replay reproduziert denselben StateHash.

### onr_v1_259_in-the-face - Pi in the 'Face

Bewertung:
- Engine: Katalog definiert Sentry-ICE mit Rez-Kosten 5, Stärke 3 und einer End-the-run-Subroutine. Generischer ICE-Pfad bietet Break-LegalActions gegen passende Killer/Sentry-Breaker und löst ungebrochen End-the-run aus.
- Chronik: Vorhandene Tests decken Break mit Sentry-Breaker ab, aber der ungebrochene Run-Ende-Fall für genau diese Karte sollte chronikfähig sein.
- Tests: V1.1.2K enthält Sichtbarkeits- und generische Breaker-Smokes. Kein enger Test für ungebrochenes Pi-in-the-'Face-Ende, wrong-side/stale Break und PublicPayload.
- Hidden-Info/Replay/StateHash: ICE liegt bis Rez verdeckt; RunnerView darf vor Rez keinen Titel sehen. Nach Rez ist die Quelle öffentlich. Keine hidden targets, aber Run-Ende muss replay-stabil sein.
- Fehlende Härtungen: Fokussierter unbroken-ETR-Test plus Break-Revalidation.

Notwendige Umsetzung:
- [ ] Testen, dass RunnerView vor Rez keinen ICE-Titel leakt und nach Rez Pi in the 'Face korrekt sichtbar wird.
- [ ] Ungebrochene Subroutine auslösen und prüfen, dass der Run endet.
- [ ] Passenden Breaker-Pfad mit wrong-side/stale `break_subroutine` absichern.
- [ ] PublicPayload für Rez, Break oder Continue-Run auf Quelle, Subroutine-Index und fehlende Hidden-Leaks prüfen.

Akzeptanzkriterien:
- [ ] Verdecktes ICE bleibt vor Rez in RunnerView anonym.
- [ ] Ungebrochene Subroutine beendet den Run.
- [ ] Break-Aktion ist nur legal bei passender Seite, StateVersion und Stärke.
- [ ] Replay/StateHash ist stabil.

### onr_v1_350_antiquated-interface-routines - Antiquated Interface Routines

Bewertung:
- Engine: `iceStrengthBonusFor` gibt +1 Stärke für ICE im selben Fort, wenn die Upgrade-Quelle gerezzed ist. Der Pfad ist servergebunden und darf andere Server nicht beeinflussen.
- Chronik: V1.6.3-Test prüft den Modifier im eigenen Fort und einen Nicht-Zielserver. Die Chronik sollte zusätzlich zeigen, welche Quelle den Strength-Bonus verursacht.
- Tests: Vorhanden ist ein funktionaler Test für Stärke. Es fehlen gezielte PublicPayload-/Modifier-Herkunft, Wrong-Side-/Stale-Revalidation beim Rezzen und Replay/StateHash.
- Hidden-Info/Replay/StateHash: Upgrade im Root ist bis Rez hidden-info-sensibel; nach Rez ist der Modifier öffentlich. Bonusberechnung muss deterministisch über rezzed Root Cards und Server-ID laufen.
- Fehlende Härtungen: Modifier-Attribution im PublicPayload oder mindestens fokussierter Chroniktest.

Notwendige Umsetzung:
- [ ] Fokussierten Test für Rez der Upgrade-Quelle mit wrong-side/stale `rez_ice` oder passender Rez-Aktion ergänzen.
- [ ] Encounter im selben Fort und auf anderem Server prüfen: +1 nur im eigenen Fort.
- [ ] PublicPayload/PlayerView so prüfen oder ergänzen, dass der Strength-Wert sichtbar ist und keine unrezzed Root-Information leakt.
- [ ] Replay/StateHash mit gerezztem Upgrade und Encounter verifizieren.

Akzeptanzkriterien:
- [ ] Nur ICE im selben Fort erhält +1 Stärke.
- [ ] Ungerezzte oder fremde Root-Karten beeinflussen keine Stärke.
- [ ] Runner sieht vor Rez keine Upgrade-Identität.
- [ ] Replay reproduziert Stärke und StateHash.

### onr_v1_239_endless-corridor - Endless Corridor

Bewertung:
- Engine: Katalog definiert Code-Gate-ICE mit zwei End-the-run-Subroutinen. Generischer Break-Pfad erzeugt separate `subroutineIndex`-LegalActions.
- Chronik: Der V1.0.5K-Test bricht beide Subroutinen und erreicht Access. Es fehlt ein Test für ungebrochene Subroutinen und klare PublicPayload-Indices.
- Tests: Break beider Subroutinen ist abgedeckt; stale/wrong-side und unbroken-Ende für genau diese Karte fehlen.
- Hidden-Info/Replay/StateHash: ICE ist bis Rez verdeckt. Nach Rez sind zwei Subroutinen öffentlich, der Break-Status muss in Replay und PlayerViews konsistent bleiben.
- Fehlende Härtungen: Indexstabilität der zwei ETR-Subroutinen, Revalidation und Chronik.

Notwendige Umsetzung:
- [ ] Testen, dass genau zwei Break-LegalActions mit `subroutineIndex` 0 und 1 angeboten werden, sobald Stärke und Breaker passen.
- [ ] Stale/wrong-side Break-Aktion für einen Index prüfen.
- [ ] Ungebrochenen Continue-Run-Pfad prüfen: Run endet und beide Subroutinen werden als ausgelöst/resolve-relevant geführt.
- [ ] PublicPayload auf Subroutine-Index, Quelle und fehlende Hidden-Leaks prüfen.

Akzeptanzkriterien:
- [ ] Beide Subroutinen sind einzeln und indexstabil brechbar.
- [ ] Falsche Seite, stale Version oder bereits gebrochener Index scheitern.
- [ ] Ungebrochene Subroutinen beenden den Run.
- [ ] Replay/StateHash ist stabil.

### onr_v1_285_closed-accounts - Closed Accounts

Bewertung:
- Engine: Resolver verlangt getaggten Runner und setzt Runner-Credits auf 0. Katalogkosten stehen auf 1.
- Chronik: Sammeltest prüft nur Endwert. Die Chronik sollte Start-/End-Credits oder zumindest `runnerCreditsAfter: 0` enthalten, ohne private HQ-Information.
- Tests: V1.0.6K-Sammeltest und Legacy-AI-Smoke vorhanden. Fehlend sind kein-LegalAction-ohne-Tag, wrong-side/stale und PublicPayload.
- Hidden-Info/Replay/StateHash: Kein Hidden-Ziel, aber `play_operation` aus HQ ist Hidden-Info-Barriere. Die gespielte Karte ist öffentlich, restliche HQ bleibt geheim.
- Fehlende Härtungen: Tag-Gate und PublicPayload-Fokus.

Notwendige Umsetzung:
- [ ] Ohne Runner-Tag prüfen, dass keine Closed-Accounts-Operation angeboten wird und `applyAction` die Tag-Voraussetzung revalidiert.
- [ ] Mit Runner-Tag und Credits prüfen: Kostenzahlung, Runner-Credits exakt 0, Operation in Archives.
- [ ] Wrong-Side-/stale-Revalidation ergänzen.
- [ ] PublicPayload um `runnerCreditsAfter` oder `creditsLost` ergänzen, falls aktuell nicht vorhanden.

Akzeptanzkriterien:
- [ ] Ungetaggter Runner blockiert LegalAction und applyAction.
- [ ] Getaggter Runner verliert alle Credits, nicht mehr und nicht weniger.
- [ ] PublicPayload leakt keine übrigen HQ-Karten.
- [ ] Replay/StateHash ist stabil.

### onr_v1_287_datapool-by-zetatech - Datapool by Zetatech

Bewertung:
- Engine: Resolver verlangt getaggten Runner und erhöht Runner-Tags um 2. Katalogkosten stehen auf 1.
- Chronik: Sammeltest prüft Tag-Anstieg. PublicPayload sollte Tag-Delta und Endstand zeigen, damit spätere KI-/Replay-Analysen nicht raten müssen.
- Tests: V1.0.6K-Sammeltest, Corp-Tag-AI-Hint und AI-Smoke vorhanden. Es fehlen fokussierte Revalidation- und Payload-Tests.
- Hidden-Info/Replay/StateHash: Kein verdecktes Ziel, aber Operation aus HQ. LegalAction-Projektion darf nur aus vorhandener Handkarte und Tag-Voraussetzung entstehen.
- Fehlende Härtungen: Tag-Gate, stateVersion/side, Payload-Qualität und Replay.

Notwendige Umsetzung:
- [ ] Ohne Runner-Tag prüfen, dass keine Datapool-LegalAction existiert und applyAction die Bedingung erneut validiert.
- [ ] Mit Runner-Tag prüfen: Kostenzahlung, exakt +2 Tags, Operation in Archives.
- [ ] Wrong-Side und stale `stateVersion` ergänzen.
- [ ] PublicPayload um `runnerTagsAfter` und `tagsAdded: 2` ergänzen oder vorhandene Felder absichern.

Akzeptanzkriterien:
- [ ] Datapool ist nur gegen bereits getaggten Runner legal.
- [ ] Tag-Endstand ist korrekt und öffentlich verständlich.
- [ ] Keine HQ-Restinformationen erscheinen in PublicEvents, PlayerViews oder KI-Inputs.
- [ ] Replay/StateHash ist stabil.

## Gesamtplan

1. Einen fokussierten Engine-Testblock für diesen Job anlegen, ohne Kartenstatus oder Release-Manifeste zu ändern.
2. Zuerst die drei Hidden-Info-/Zufallsrisiken härten: Bodyweight Synthetic Blood, Nerve Labyrinth, Punitive Counterstrike.
3. Danach die Tag-Operationen Closed Accounts und Datapool by Zetatech mit LegalAction- und applyAction-Revalidation absichern.
4. Anschließend die ICE-/Modifier-Pfade Pi in the 'Face, Endless Corridor und Antiquated Interface Routines mit Subroutine-/Strength-/Visibility-Checks prüfen.
5. Zuletzt die simpleren Economy-Events Livewire's Contacts und Efficiency Experts auf Chronik, Kosten, side/stale und Replay abrunden.
6. Nur wenn PublicPayload-Felder fehlen, minimal die jeweiligen Resolver-Payloads ergänzen; keine Scope-Erweiterung und keine neue Kartenpromotion.
7. Nach Umsetzung das Spotcheck-Register erst im separaten Abschluss-/Umsetzungsjob aktualisieren.

## Empfohlene Checks

- corepack pnpm --filter @netgrid/engine test
- corepack pnpm --filter @netgrid/web test -- chronicle.test.ts
- corepack pnpm --filter @netgrid/catalog test
- corepack pnpm typecheck

## Umsetzungsergebnis

Status: done.

Geänderte Dateien:

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_CONTACTS_DATAPOOL_IMPLEMENTATION.md`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`

Karten-Nacharbeiten:

- `Livewire's Contacts` und `Efficiency Experts`: öffentliche Credit-Summaries ergänzt und side-/stale-/replay-stabil getestet.
- `Bodyweight Synthetic Blood`: Draw-Count- und Kurzstack-Pfade ohne öffentliche Draw-Content-Leaks getestet.
- `Closed Accounts`, `Datapool by Zetatech` und `Punitive Counterstrike`: Tag-Gate, Side/Stale, Tag-Drift, Payload und Replay/StateHash fokussiert abgesichert.
- `Nerve Labyrinth`, `Pi in the 'Face` und `Endless Corridor`: Continue-/Break-/Unbroken-ETR-Pfade, Damage-Redaction, Subroutine-Indizes und Replay/StateHash ergänzt.
- `Antiquated Interface Routines`: Rez-Revalidation und servergebundener +1-Stärkemodifier nur im eigenen Fort fokussiert abgesichert.

Checks:

- `corepack pnpm --filter @netgrid/engine test` - grün
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün
- `corepack pnpm --filter @netgrid/catalog test` - grün
- `corepack pnpm typecheck` - grün

Restpunkte:

- Keine fachlichen Blocker.
- Queue-Hinweis: Die Dateisystemumgebung verweigerte das Löschen von Queue-Dateien in `inbox`/`in_progress`; die Dubletten dieses Jobs wurden deshalb auf `status: done` gesetzt und sind nicht mehr ready-selektierbar.

Commit-Hinweis:

- Lokaler Abschlusscommit: `Implement Originalset spotcheck job spotcheck-2026-05-15-contacts-datapool`
