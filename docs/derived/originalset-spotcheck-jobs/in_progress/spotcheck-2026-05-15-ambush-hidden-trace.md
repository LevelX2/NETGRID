---
jobId: spotcheck-2026-05-15-ambush-hidden-trace
status: blocked
createdAt: 2026-05-15T06:35:00+01:00
startedAt: 2026-05-15T06:37:09.1548566Z
completedAt: 2026-05-15T06:49:39.7409523Z
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_348_virus-test-site
    title: Virus Test Site
  - cardId: onr_v1_340_setup
    title: Setup!
  - cardId: onr_v1_246_fragmentation-storm
    title: Fragmentation Storm
  - cardId: onr_v1_017_deep-thought
    title: Deep Thought
  - cardId: onr_v1_328_information-laundering
    title: Information Laundering
  - cardId: onr_v1_084_edited-shipping-manifests
    title: Edited Shipping Manifests
  - cardId: onr_v1_059_self-modifying-code
    title: Self-Modifying Code
  - cardId: onr_v1_151_aujourdoui
    title: Aujourd'Oui
  - cardId: onr_v1_169_n-e-t-o
    title: N.E.T.O.
  - cardId: onr_v1_355_crystal-palace-station-grid
    title: Crystal Palace Station Grid
  - cardId: onr_v1_022_emergency-self-construct
    title: Emergency Self-Construct
  - cardId: onr_v1_025_fait-accompli
    title: Fait Accompli
  - cardId: onr_v1_260_pocket-virtual-reality
    title: Pocket Virtual Reality
  - cardId: onr_v1_107_romp-through-hq
    title: Romp through HQ
  - cardId: onr_v1_341_skalderviken-sa-beta-test-site
    title: Skälderviken SA Beta Test Site
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-ambush-hidden-trace

## Auswahlprüfung

- Geprüfte Register und Jobverzeichnisse: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json`, `docs/derived/originalset-spotcheck-jobs/inbox/`, `docs/derived/originalset-spotcheck-jobs/in_progress/`, `docs/derived/originalset-spotcheck-jobs/done/`, `docs/derived/originalset-spotcheck-jobs/blocked/`.
- Ausgeschlossene Quellen/Karten: 80 Card IDs aus Register, JSON-Register und vorhandenen Jobberichten, einschließlich des aktuellen Inbox-Jobs `spotcheck-2026-05-15-contacts-datapool.md`, wurden als tabu behandelt.
- Auswahlbegründung: Die 15 Karten wurden zufällig gewichtet aus 102 nicht tabu gesetzten komplexeren decklegalen Originalset-Kandidaten gezogen. Bevorzugt wurden Access-Ambush, Hidden-Zone, Trace, Counter, Run-Replacement, globale Modifier und StateHash-relevante Pfade.
- Fachliche Analysequellen: `packages/shared/src/index.ts`, `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`, `packages/catalog/src/index.ts`, `packages/catalog/src/index.test.ts`, `data/manifests/deck-legal-ai-approval-*.json`, `data/scenarios/v19*.json`, `data/scenarios/ai-deck-legal-*.json`, lokale Text-/Review-Artefakte unter `data/local/card-import/onr-v1-limited/` und die V1.9.x-Reviews unter `docs/derived/`.

## Kartenbefunde

### onr_v1_348_virus-test-site - Virus Test Site

Bewertung:
- Engine: Aktueller Access-Pfad `resolveV1919AssetOnAccess` verursacht pauschal 2 Net Damage. Lokale Textbasis verlangt 2 Net Damage pro Advancement Counter, aber 1 Net Damage ohne Counter; außerdem darf der Ambush aus Archives ignoriert werden.
- Chronik: `hiddenZoneAction: "v1919_access_ambush_damage"` ist vorhanden, aber Payload muss `advancementCounterCount`, effektive Schadenshöhe, Archives-No-op und R&D-Show-Fall klar unterscheiden.
- Tests: Es gibt einen Remote-Access-Test ohne Counter; Counter-Skalierung, null Counter, R&D-Zugriff und Archives-Ausnahme fehlen.
- Hidden-Info/Replay/StateHash: Hidden-Zone-Barriere ist gesetzt; R&D-Reveal darf nur `publicRevealDefinitionId`/Definition und keine Stack-/Queue-Details exponieren. Variable Damage muss replay-stabil aus State-Countern kommen.
- Fehlende Härtungen: Advancement-Counter-Skalierung, Archives-Skip, R&D-Show-Payload, Stale/Wrong-Side-Negativfall.

Notwendige Umsetzung:
- [ ] In `resolveV1919AssetOnAccess` für `onr_v1_348_virus-test-site` Damage als `max(1, advancementCounters * 2)` berechnen.
- [ ] Zugriff aus Archives als No-op mit öffentlichem, redigiertem Payload dokumentieren.
- [ ] Bei R&D-Zugriff `publicRevealKind: "reveal"` und `publicRevealDefinitionId` setzen, ohne verdeckte Nachbarkarten zu leaken.
- [ ] Fokussierte Tests für 0/1/3 Counter, R&D, Archives, Replay/StateHash und Payload-Redaction ergänzen.

Akzeptanzkriterien:
- [ ] Ohne Counter verursacht Virus Test Site 1 Net Damage, mit drei Countern 6 Net Damage.
- [ ] Archives-Zugriff verursacht keinen Schaden und hinterlässt einen chronikfähigen No-op.
- [ ] R&D-Zugriff zeigt genau diese Karte öffentlich und keine weiteren Hidden-Zone-Daten.
- [ ] Replay endet mit identischem StateHash.

### onr_v1_340_setup - Setup!

Bewertung:
- Engine: Der aktuelle V1.9.17-Ambush-Pfad verursacht 1 Net Damage; lokale Textbasis verlangt 2 Net Damage. Archives-Ausnahme und R&D-Show-Regel sind nicht als eigene Fälle abgesichert.
- Chronik: `v1917_access_ambush` ist vorhanden, aber Damage Amount, Archives-Skip und R&D-Reveal brauchen spezifischere Payloads.
- Tests: Bestehender Test koppelt Setup! und TRAP! mit `damageAmount: 1`; das hält die falsche Setup!-Höhe fest.
- Hidden-Info/Replay/StateHash: Access-Fenster und Payload-Redaction sind vorhanden; R&D-Reveal muss öffentlich, aber eng bleiben.
- Fehlende Härtungen: Setup!-spezifischer Damage, Archives-No-op, R&D-Show, getrennte Tests statt Sammeltest mit TRAP!.

Notwendige Umsetzung:
- [ ] `resolveV1917AmbushOnAccess` für Setup! von TRAP! trennen: Setup! = 2 Net Damage, TRAP! bleibt eigener Pfad.
- [ ] Zugriff aus Archives ignorieren und mit `ambushSkippedReason: "archives"` publizieren.
- [ ] R&D-Zugriff mit öffentlichem Reveal-Payload härten.
- [ ] Tests korrigieren und Setup!/TRAP! getrennt auf Damage, Tags, Redaction und Replay prüfen.

Akzeptanzkriterien:
- [ ] Setup! verursacht bei Remote-/HQ-/R&D-Zugriff 2 Net Damage.
- [ ] Setup! aus Archives verursacht keinen Schaden.
- [ ] TRAP!-Regression bleibt unverändert abgedeckt.
- [ ] PublicPayload enthält keine `hq`, `rd`, `cardInstances` oder `privatePayload`-Daten.

### onr_v1_246_fragmentation-storm - Fragmentation Storm

Bewertung:
- Engine: Trace 4 ohne Tag-Effekt, Program-Trash und Net Damage sind auf Trace-Erfolg gegated. Erfolg und Misserfolg haben Replay-/StateHash-Tests.
- Chronik: Trace-Ergebnis ist sichtbar; der anschließende Program-Trash-Pfad sollte den öffentlich bekannten Zieltyp und die Definition des getrashten installierten Programms payloadfähig dokumentieren.
- Tests: Erfolg/Misserfolg und hosted lifecycle sind abgedeckt. Fehlend sind präzise Wrong-Side/Stale-Revalidierung rund um die Continue-Run-Folgeaktion nach Trace-Auflösung.
- Hidden-Info/Replay/StateHash: Installierte Runner-Programme sind visible, daher darf die getrashte Definition öffentlich sein; keine Grip-/Stack-Daten aufnehmen.
- Fehlende Härtungen: PublicPayload für getrashte installierte Programme und explizite Revalidation-Fälle nach Trace.

Notwendige Umsetzung:
- [ ] Beim erfolgreichen Fragmentation-Storm-Folge-`continue_run` `trashedCardDefinitionId`, `trashedCardType: "program"` und Damage-Zusammenfassung in den PublicPayload aufnehmen.
- [ ] Negative Tests für falsche Seite, stale `stateVersion` und fehlendes Encounter-ICE ergänzen.
- [ ] Replay-Test beibehalten und auf neue Payload-Felder erweitern.

Akzeptanzkriterien:
- [ ] Trace-Misserfolg trasht nichts und verursacht keinen Net Damage.
- [ ] Trace-Erfolg trasht genau ein installiertes Runner-Programm und verursacht 1 Net Damage.
- [ ] PublicPayload bleibt ohne Hidden-Zone-Daten und Replay-StateHash bleibt identisch.

### onr_v1_017_deep-thought - Deep Thought

Bewertung:
- Engine: Karte ist als Virus/Recurring-Programm implementiert: Install legt Counter/Recurring-Pfad über V1.9.12-Familie nahe. Die lokale Review-Basis ist OCR-vorläufig; daher ist die Text-/Regelbasis selbst ein Prüfrisiko.
- Chronik: Recurring-/Counter-/Purge-Pfade brauchen eine fokussierte Chronikprüfung, nicht nur Releasepool-Abdeckung.
- Tests: Karte steht in V1.9.12-Smokes und AI-Smokes; ein enger Deep-Thought-Einzeltest mit Counter-Refresh und Purge-Auswirkung ist nicht erkennbar.
- Hidden-Info/Replay/StateHash: Keine Hidden-Zone-Ziele, aber Purge und Recurring-Refresh müssen deterministisch und payloadfähig bleiben.
- Fehlende Härtungen: Einzeltest für Installation, Counter, Recurring-Verbrauch, Turn-Refresh und Purge.

Notwendige Umsetzung:
- [ ] Lokalen finalen Text gegen die bestätigte Quelle prüfen; falls der aktuelle vereinfachte Resolver nur Platzhalter ist, Runtime-Text und Resolver nachziehen.
- [ ] Fokus-Test für Install-Counter, recurring credit use, Runner-Turn-Refresh und Corp-Purge ergänzen.
- [ ] Chronikpayload für Counter/Recurring/Purge auf Definition, Countertyp und Restwerte prüfen.

Akzeptanzkriterien:
- [ ] Deep Thought bleibt decklegal/ai_supported nur mit bestätigtem Regelvertrag.
- [ ] Recurring und Purge verändern StateHash replay-stabil.
- [ ] PublicPayload enthält Countertyp und Mengen, aber keine verdeckten Zonen.

### onr_v1_328_information-laundering - Information Laundering

Bewertung:
- Engine: Aktueller rezzed Asset-Economy-Pfad gewährt pauschal 2 Credits. Lokale Textbasis verlangt `Gain 4` pro Advancement Counter und Trash von Information Laundering als Kosten.
- Chronik: Aktuelle Payload dokumentiert `gainedCredits`, aber nicht Trash-on-use oder Advancement-Skalierung.
- Tests: V1.9.19 deckt eine Economy-Aktion ab; variable Counter-Skalierung, Null-Counter, Trash-Kosten und Access-Trash-Interaktion fehlen.
- Hidden-Info/Replay/StateHash: Rezzed Asset und Advancement-Counter sind öffentlich; keine Hidden-Info nötig. Trash-on-use muss Zonenwechsel replay-stabil machen.
- Fehlende Härtungen: Reale Kosten-/Skalierungslogik, Source-Revalidation und Chronik.

Notwendige Umsetzung:
- [ ] LegalAction nur für rezzed installierte Information Laundering anbieten.
- [ ] Aktion als `[A], trash: gain 4 * advancementCounters` umsetzen; bei 0 Countern entweder legaler 0-Gain mit Trash oder nach lokalem Regelentscheid blocken.
- [ ] PublicPayload um `advancementCounterCount`, `gainedCredits`, `selfTrashed` und `corpCreditsAfter` erweitern.
- [ ] Tests für 0/2/4 Counter, falsche Karte, unrezzed Quelle, stale Action und Replay ergänzen.

Akzeptanzkriterien:
- [ ] Zwei Counter geben 8 Credits und trashen die Quelle.
- [ ] Unrezzed oder bereits getrashte Quelle kann die Aktion nicht ausführen.
- [ ] Chronik ist verständlich und StateHash replay-stabil.

### onr_v1_084_edited-shipping-manifests - Edited Shipping Manifests

Bewertung:
- Engine: Event startet HQ-Run mit Access-Replacement: Corp verliert 1 Credit, Runner erhält 1 Tag, Corp zieht 1 Karte. Der V1.7.1-Test prüft den Effekt, aber nicht den vollständigen Run-/Access-Timing-Vertrag.
- Chronik: Payload setzt `accessReplacement` und `hiddenZoneBarrier`; es fehlen spezifische Nachweise, dass kein HQ-Zugriff stattfindet und der Corp-Draw als Hidden-Zone-Barriere nicht leakt.
- Tests: Bestehender Test prüft Credits/Tag/Draw, aber nicht Wrong-Side/Stale, Access-Queue-Abbruch und PublicPayload-Qualität.
- Hidden-Info/Replay/StateHash: Corp zieht aus R&D; PublicPayload darf nur gezogene Anzahl und keine Definition enthalten.
- Fehlende Härtungen: Kein-Access-Nachweis, Draw-Redaction, Replay-Test.

Notwendige Umsetzung:
- [ ] Test ergänzen, dass nach erfolgreichem HQ-Run keine HQ-Karte accessed wird und keine Access-Queue offen bleibt.
- [ ] PublicPayload um `corpDrawnCount: 1` oder vergleichbares redigiertes Feld ergänzen.
- [ ] Replay/StateHash und stale/wrong-side negative Tests für den Eventpfad ergänzen.

Akzeptanzkriterien:
- [ ] Erfolgreicher Lauf ersetzt Zugriff vollständig.
- [ ] Corp-Draw verändert Hidden-Zone-State ohne Definition-Leak.
- [ ] Replay-StateHash ist stabil.

### onr_v1_059_self-modifying-code - Self-Modifying Code

Bewertung:
- Engine: Hidden-Zone-Search ist vorhanden. Projektnachtrag dokumentiert bereits Errata: Trash-Kosten, Nutzung während ICE-Encounter, Installkosten des gefundenen Programms, MU-Druck mit Folge-Choice.
- Chronik: `v1911_search_stack`/Search-Payload ist redigiert; installierende Folgeauflösung muss Search, Reveal, Shuffle, Install und mögliche MU-Trash-Choice chronikfähig zusammenhalten.
- Tests: Es gibt generische Search-Tests; wegen Errata braucht Self-Modifying Code einen fokussierten Encounter-/Installtest.
- Hidden-Info/Replay/StateHash: Stack-Choice ist Runner-privat; öffentliche Chronik darf nur Reveal der gewählten Definition und Shuffle/Install-Fakten zeigen.
- Fehlende Härtungen: Source-Trash-Kosten, Encounter-Timing, Installkosten, MU-Folgechoice, Stale/Revalidation.

Notwendige Umsetzung:
- [ ] Prüfen, ob aktuelle Runtime den Errata-Nachtrag vollständig erfüllt; falls nicht, Resolver in einen Self-Modifying-Code-spezifischen Pfad splitten.
- [ ] Test während ICE-Encounter: Quelle trashen, Programm aus Stack wählen, revealn, Kosten bezahlen, installieren, Stack mischen.
- [ ] MU-Druck-Test mit legaler Trash-Folgechoice und Replay ergänzen.

Akzeptanzkriterien:
- [ ] Corp sieht keine Stack-Optionen.
- [ ] Gewählte Programmdefinition wird öffentlich revealed, aber keine übrigen Stack-Karten.
- [ ] Nicht bezahlbare oder nicht installierbare Wahl bleibt regelkonform und replay-stabil.

### onr_v1_151_aujourdoui - Aujourd'Oui

Bewertung:
- Engine: Installierter Hidden-Zone-Helfer darf Stack nach Programmen durchsuchen und Stack-Spitze revealn. Das ist stärker als der generische Search-Pfad und braucht klare Source-Bindung.
- Chronik: Search und Reveal laufen über `v1911HiddenZoneAbility`; der Reveal-Pfad muss Definition öffentlich zeigen, Search-Pfad nur Count/Destination/Shuffle.
- Tests: V1.9.11 deckt Hidden-Zone-Familie ab; für Aujourd'Oui fehlen getrennte Search-vs-Reveal- und Wrong-Source-Tests.
- Hidden-Info/Replay/StateHash: Runner-private Optionen dürfen nicht in Corp-View oder AI-Input erscheinen.
- Fehlende Härtungen: Ability-Matrix, falsche Ability auf falscher Quelle, Replay pro Ability.

Notwendige Umsetzung:
- [ ] Fokussierten Test für Search-Ability mit privater Programmauswahl, Reveal und Shuffle ergänzen.
- [ ] Fokussierten Test für Reveal-Stack-Top mit genau einem `publicRevealDefinitionId` ergänzen.
- [ ] Negative Tests: N.E.T.O. darf nicht revealn; Aujourd'Oui muss installiert sein.

Akzeptanzkriterien:
- [ ] Corp-PlayerView sieht keine Search-Optionen.
- [ ] Reveal zeigt genau die Stack-Spitze.
- [ ] Beide Pfade replayen zum identischen StateHash.

### onr_v1_169_n-e-t-o - N.E.T.O.

Bewertung:
- Engine: N.E.T.O. ist im erlaubten Search-Set, aber nicht im Reveal-Set. Das ist korrekt, muss aber durch Tests gesichert werden.
- Chronik: Search-Payload entspricht Hidden-Zone-Barriere; keine sichtbare Abgrenzung, dass nur Programmsuche erlaubt ist.
- Tests: Familienabdeckung vorhanden; N.E.T.O.-spezifische Revalidation fehlt.
- Hidden-Info/Replay/StateHash: Gleiche Stack-Search-Risiken wie bei Aujourd'Oui, aber weniger erlaubte Abilities.
- Fehlende Härtungen: Source-/Ability-Revalidation und AI-Input-Leaktest.

Notwendige Umsetzung:
- [ ] Test ergänzen, dass N.E.T.O. nur `search_stack_program_to_grip` erhält.
- [ ] Manipulierte PlayerAction mit `reveal_stack_top` gegen N.E.T.O. muss in `applyAction` scheitern.
- [ ] AI-Input/DecisionDebug darf keine Stack-Optionen enthalten.

Akzeptanzkriterien:
- [ ] N.E.T.O. erzeugt private Search-Choice nur für Runner.
- [ ] Falsche Ability scheitert in `applyAction`.
- [ ] PublicPayload bleibt count-/destination-basiert.

### onr_v1_355_crystal-palace-station-grid - Crystal Palace Station Grid

Bewertung:
- Engine: Region-Replacement und rezzed Power-Counter-LegalAction sind abgedeckt. Die eigentliche servergebundene Wirkung der Counter bleibt im Test eher oberflächlich.
- Chronik: Counterladung hat Payload; Region-Replacement und Zonenwechsel sind sichtbar. Serverbindung und Counterwirkung sollten klarer payloadfähig werden.
- Tests: Region-Replacement und Counter-Aktion sind vorhanden; fehlend sind Wirkung der Counter auf den relevanten Server, Wrong-Server-Abgrenzung und Reconnect/PublicView.
- Hidden-Info/Replay/StateHash: Rezzed Upgrade und Counter sind öffentlich; kein Hidden-Leak erwartet.
- Fehlende Härtungen: Counter-Effekt-Kontrakt, Serverbindung, StateHash nach mehrfachen Countern.

Notwendige Umsetzung:
- [ ] Lokalen Regelvertrag finalisieren: wofür Power-Counter auf Crystal Palace Station Grid gelten und wann sie verbraucht/gezählt werden.
- [ ] Engine-Test ergänzen, dass Counter nur im eigenen Server wirken und andere Server nicht beeinflussen.
- [ ] PublicPayload/Chronik um servergebundene Quelle und `remainingCounters` prüfen.

Akzeptanzkriterien:
- [ ] Zweite Region ersetzt die erste weiterhin korrekt.
- [ ] Counterwirkung ist servergebunden, öffentlich nachvollziehbar und replay-stabil.
- [ ] Wrong-Side/Stale-Aktionen scheitern.

### onr_v1_022_emergency-self-construct - Emergency Self-Construct

Bewertung:
- Engine: Karte liegt in V1.9.20 Global-Modifier/Sonderzustandslinie; lokale Review-Basis nennt Prevention/Avoid/Replacement, Core/Brain Damage, Handgröße und persistente Zustände. Konkreter enger Runtime-Pfad ist im geprüften Code nicht als eigener Resolver sichtbar.
- Chronik: Ohne enges Effektpayload droht die Karte nur als installierbare Oberfläche mit zu grobem Handoff zu bleiben.
- Tests: Szenario- und AI-Smokes listen die Karte, aber ein fokussierter Effektvollständigkeitstest ist zu verifizieren bzw. zu ergänzen.
- Hidden-Info/Replay/StateHash: Damage-/Replacement-Fenster sind hochsensibel; keine verdeckten Grip-Inhalte in PublicPayload.
- Fehlende Härtungen: Vollständiger Kartenvertrag und explizite Replacement-/Damage-Tests.

Notwendige Umsetzung:
- [ ] Prüfen, ob aktuelle Engine nur Install/Status oder echte Emergency-Self-Construct-Effekte abbildet.
- [ ] Falls nur Oberfläche: lokalen Text finalisieren und Resolver für Damage-/Replacement-/Handsize-Vertrag planen.
- [ ] Tests für Replacement-Fenster, Core-Damage-/Flatline-Interaktion, PublicPayload-Redaction und Replay ergänzen.

Akzeptanzkriterien:
- [ ] Karte ist nicht nur decklegal, sondern ihr spezifischer Effekt ist nachweisbar.
- [ ] Damage-/Replacement-Fenster bleiben side-sicher und LegalAction-basiert.
- [ ] Hidden-Info wird in Chronik, Replay und AI-Input nicht offengelegt.

### onr_v1_025_fait-accompli - Fait Accompli

Bewertung:
- Engine: Aktueller Runner-Programm-Pfad lädt 1 Power-Counter, wenn der Runner eine Agenda hat. Lokale Review-Basis nennt Virus-/Counter-/Advancement-Bezug; der aktuell enge Pfad wirkt möglicherweise untervollständig.
- Chronik: Payload dokumentiert Counterladung, aber nicht den Agenda-Bezug oder eventuelle spätere Auswirkung der Counter.
- Tests: Ein Test prüft Counterladung bei Runner-Agenda; keine Tests für keine Agenda, Purge/Countertyp, Folgewirkung oder Manipulation.
- Hidden-Info/Replay/StateHash: Runner-ScoreArea ist öffentlich; Counter sind öffentlich. Keine Hidden-Zone, aber StateHash muss Counter-Folgen stabil halten.
- Fehlende Härtungen: Effektvollständigkeit gegen finalen Text, negative Fälle und Folgeeffekt.

Notwendige Umsetzung:
- [ ] Finalen lokalen Regeltext für Fait Accompli gegen aktuelle Runtime prüfen.
- [ ] Falls Counter späteren Effekt haben, Resolver und Tests ergänzen; falls nicht, Katalog-/AI-Text so begrenzen, dass kein nicht implementierter Effekt suggeriert wird.
- [ ] Tests für keine Runner-Agenda, falsche Quelle, stale Action und Replay ergänzen.

Akzeptanzkriterien:
- [ ] Ohne Runner-Agenda gibt es keine legale Counter-Aktion.
- [ ] Mit Runner-Agenda wird genau ein Power-Counter geladen.
- [ ] PublicPayload erklärt den Agenda-Bezug ohne private Daten.

### onr_v1_260_pocket-virtual-reality - Pocket Virtual Reality

Bewertung:
- Engine: Karte nutzt V1.9.14 Trace-ICE-Familie mit Base Trace 6. Familien-Test prüft Bid-Fenster, aber nicht kartenspezifische Counter-/Tag-Folgen.
- Chronik: Trace-Payload ist sichtbar; falls Pocket Virtual Reality Counter oder andere Folgezustände setzt, müssen diese im Payload auftauchen.
- Tests: Trace-ICE-Familie deckt alle V1.9.14-Trace-ICE ab; fokussierter Pocket-Virtual-Reality-Test mit Erfolg/Misserfolg und Folgezustand fehlt.
- Hidden-Info/Replay/StateHash: Trace-Bids sind side-sicher; keine verdeckten Karten. Determinismus betrifft Bid-Abfolge und eventuelle Counter.
- Fehlende Härtungen: Erfolgs-/Misserfolg-Folge, PublicPayload mit Counter/Tags, StateHash nach beiden Branches.

Notwendige Umsetzung:
- [ ] Lokalen Kartentext gegen implementierte Subroutinen prüfen.
- [ ] Tests für Trace-Erfolg und Trace-Misserfolg mit genau erwarteter Folgewirkung ergänzen.
- [ ] Wrong-Side/Stale für Bid-Choices und Continue-Run nach Trace ergänzen.

Akzeptanzkriterien:
- [ ] Trace 6 startet mit korrektem Corp-/Runner-Bid-Fenster.
- [ ] Erfolg und Misserfolg haben getrennte, replay-stabile Ergebnisse.
- [ ] Chronik nennt Trace-Stärke, Bids und Folgewirkung ohne Hidden-Info.

### onr_v1_107_romp-through-hq - Romp through HQ

Bewertung:
- Engine: Event startet HQ-Run mit Free-Trash-HQ-Zonenregel. Release-Test und AI-Approval existieren.
- Chronik: Start-Run/Access-Trash-Payload muss klar machen, dass der freie Trash nur für HQ-Access aus dieser Event-Run gilt.
- Tests: Kosten/AI und Release-Smoke vorhanden; fehlend sind Kostenfreiheit beim Trash, Beschränkung auf HQ, Ende des Effekts nach Run und Replay.
- Hidden-Info/Replay/StateHash: HQ-Zufallsauswahl muss über RandomDrawRecords/StateHash stabil bleiben; PublicPayload darf nur accessed/revealed Karte zeigen.
- Fehlende Härtungen: Run-scoped Free-Trash, zusätzliche HQ-Access-Boni, Nicht-HQ-Negativfall.

Notwendige Umsetzung:
- [ ] Test: Romp through HQ erzeugt HQ-Run, accessed eine zufällige HQ-Karte deterministisch und erlaubt genau dort freien Trash.
- [ ] Test: Nach Run-Ende ist kein free-trash Flag mehr aktiv.
- [ ] Replay/StateHash mit HQ-Random-Auswahl und PublicPayload-Redaction ergänzen.

Akzeptanzkriterien:
- [ ] Freier Trash gilt nur für Karten, die in diesem HQ-Run accessed werden.
- [ ] Andere Server oder spätere Zugriffe nutzen normale Trashkosten.
- [ ] HQ-Zufall ist replay-stabil.

### onr_v1_341_skalderviken-sa-beta-test-site - Skälderviken SA Beta Test Site

Bewertung:
- Engine: Rezzed Root reduziert Rez-Kosten für Black ICE um 2 über `iceRezCostReductionFor`. Release- und AI-Smokes existieren.
- Chronik: Rez-Aktion zeigt Kosten, aber nicht zwingend Quelle und Höhe des Modifiers. Für Nachvollziehbarkeit sollte der Payload die Kostenreduktion und Quelle ausweisen.
- Tests: Es gibt Release-Smoke und Katalogtest; fokussierter Test für Black-ICE-only, mehrere Quellen und Nicht-Black-ICE fehlt.
- Hidden-Info/Replay/StateHash: Modifier betrifft nur sichtbare/rezzed Quelle und ICE-Rez-Kosten; keine Hidden-Info, solange unrezzed ICE-Definition nicht vor legalem Rez offengelegt wird.
- Fehlende Härtungen: Nicht-Black-ICE-Negativfall, Source-Payload, Reconnect/PlayerView-Kostenprojektion.

Notwendige Umsetzung:
- [ ] Test für Black ICE: Rez-Kosten werden um 2 reduziert und nie unter 0.
- [ ] Test für Nicht-Black-ICE: keine Reduktion.
- [ ] PublicPayload/LegalAction-Kostenprojektion um `rezCostReductionSourceDefinitionIds` oder äquivalent ergänzen.

Akzeptanzkriterien:
- [ ] Runner erfährt vor Rez keine verdeckte ICE-Definition über Kostenprojektion.
- [ ] Nach Rez ist die reduzierte Zahlung in Chronik nachvollziehbar.
- [ ] Replay-StateHash bleibt stabil.

## Gesamtplan

1. Zuerst Ambush-Korrekturen umsetzen: `Setup!` und `Virus Test Site`, weil hier konkrete Schadenshöhe/Archives/R&D-Abweichungen sichtbar sind.
2. Danach aktive Asset-/Programm-Fähigkeiten härten: `Information Laundering`, `Fait Accompli`, `Crystal Palace Station Grid`, `Emergency Self-Construct`.
3. Hidden-Zone-Helfer fokussiert testen: `Self-Modifying Code`, `Aujourd'Oui`, `N.E.T.O.` mit privaten Choices, PublicReveal und AI-Input-Redaction.
4. Run-/Trace-Pfade absichern: `Edited Shipping Manifests`, `Romp through HQ`, `Fragmentation Storm`, `Pocket Virtual Reality`.
5. Globalen Modifier prüfen: `Skälderviken SA Beta Test Site` mit Kostenprojektion, Quelle und No-Leak-Grenze.
6. Zum Schluss alle 15 Karten gegen Katalogstatus, Manifest, AI-Hints, Szenarien, Chronik und Replay/StateHash abgleichen.

## Empfohlene Checks

- corepack pnpm --filter @netgrid/engine test
- corepack pnpm --filter @netgrid/web test -- chronicle.test.ts
- corepack pnpm --filter @netgrid/catalog test
- corepack pnpm typecheck

## Umsetzungsstand 2026-05-15

Finaler Status: `blocked`

BlockerReason:
- Der Bericht enthält neben konkreten Ambush-/Payload-Fixes mehrere größere Kartenverträge, die nicht als kleiner sequenzieller Spotcheck sicher abschließbar waren: `Self-Modifying Code` verlangt echten Stack-Programm-Install während eines Runs mit Trash-Kosten, Kosten-/MU-Prüfung und Folgechoices; `Fait Accompli` verlangt fortgebundene Fait-Counter und Agenda-Difficulty-Modifikation in diesem Fort; `Emergency Self-Construct` verlangt ein Flatline-/Damage-Replacement mit persistenten Rest-of-game-Modifikatoren; `Crystal Palace Station Grid` verlangt einen finalisierten Counter-Wirkungsvertrag. Diese vier Verträge brauchen einen eigenen Resolver-Scope, damit keine Scheinfunktionalität promotet wird.

Umgesetzte grüne Teilfixes:
- `Setup!`: Access-Schaden von 1 auf 2 Net Damage korrigiert, Archives-Zugriff als No-op mit `ambushSkippedReason: "archives"` abgesichert, R&D-Reveal-Payload ergänzt.
- `Virus Test Site`: Schaden auf `max(1, advancementCounters * 2)` umgestellt, Archives-No-op und R&D-Reveal-Payload ergänzt.
- `Information Laundering`: rezzed Asset-Aktion skaliert jetzt mit Advancement-Countern, trasht die Quelle und dokumentiert `advancementCounterCount`, `gainedCredits`, `selfTrashed` und `corpCreditsAfter`.
- `Edited Shipping Manifests`: Access-Replacement-Draw bleibt redigiert und veröffentlicht `corpDrawnCount`.
- `Fragmentation Storm`: erfolgreicher Folge-`continue_run` veröffentlicht installierten Programtrash mit `trashedCardDefinitionId`, `trashedCardType` und `trashedCount`.
- `Skälderviken SA Beta Test Site`: Rez-Kostenprojektion/Chronik zeigt nach legalem Rez die öffentliche Reduktionsquelle und bleibt Black-ICE-only.

Geänderte Dateien:
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/shared/src/index.ts`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_AMBUSH_HIDDEN_TRACE_IMPLEMENTATION.md`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`

Ausgeführte Tests:
- `corepack pnpm --filter @netgrid/engine test` grün, 349 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` grün, 13 Testdateien / 121 Tests.
- `corepack pnpm --filter @netgrid/catalog test` grün, 44 Tests.
- `corepack pnpm typecheck` grün.

AttemptedFixes:
- Konkrete Ambush-, Economy-, Replacement-, Trace- und Rez-Payload-Pfade wurden implementiert und mit fokussierten Engine-Regressionen abgesichert.
- Für die breiten Resolververträge wurde bewusst keine Halbfunktion eingebaut; die bestehenden begrenzten Runtime-Texte für `Self-Modifying Code`, `Fait Accompli` und `Emergency Self-Construct` wurden nicht auf den noch nicht implementierten Volltext erweitert.

Nächste Removal Condition:
- Eigenen Resolver-Scope für `Self-Modifying Code`, `Fait Accompli`, `Emergency Self-Construct` und `Crystal Palace Station Grid` planen und umsetzen; danach diesen Job oder einen Nachfolgejob erneut auf `done` bringen, wenn die vier Vollverträge grün getestet sind.
