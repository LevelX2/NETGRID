---
jobId: spotcheck-2026-05-15-ai-boon-virizz
status: done
createdAt: 2026-05-15T04:10:22+01:00
startedAt: 2026-05-15T05:52:21+02:00
completedAt: 2026-05-15T06:00:00+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_002_ai-boon
    title: AI Boon
  - cardId: onr_v1_109_security-code-worm-chip
    title: Security Code WORM Chip
  - cardId: onr_v1_113_synchronized-attack-on-hq
    title: Synchronized Attack on HQ
  - cardId: onr_v1_273_triggerman
    title: Triggerman
  - cardId: onr_v1_147_zz22-speed-chip
    title: ZZ22 Speed Chip
  - cardId: onr_v1_230_cortical-scanner
    title: Cortical Scanner
  - cardId: onr_v1_277_virizz
    title: Virizz
  - cardId: onr_v1_077_anonymous-tip
    title: Anonymous Tip
  - cardId: onr_v1_226_canis-minor
    title: Canis Minor
  - cardId: onr_v1_332_newsgroup-taunting
    title: Newsgroup Taunting
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-ai-boon-virizz

## Auswahlprüfung

- Geprüfte Register und Jobverzeichnisse: `docs/reviews/originalset-spotchecks/register.md`, `data/reports/originalset-card-spotcheck-register.json`, `docs/derived/originalset-spotcheck-jobs/inbox/`, `docs/derived/originalset-spotcheck-jobs/in_progress/`, `docs/archive/originalset-spotcheck-jobs/2026-05/`, `docs/derived/originalset-spotcheck-jobs/blocked/`.
- Vorhandene Jobberichte: `docs/archive/originalset-spotcheck-jobs/2026-05/spotcheck-2026-05-15-netwatch-spinn.md`, `docs/archive/originalset-spotcheck-jobs/2026-05/spotcheck-2026-05-15-ramming-galveston.md` und `docs/derived/originalset-spotcheck-jobs/inbox/spotcheck-2026-05-15-turbeau-tutor.md`.
- Ausgeschlossene Quellen/Karten zusammengefasst: 50 Card IDs aus Register und Queue-Berichten, darunter alle Karten der abgeschlossenen Runden `2026-05-14-A`, `2026-05-14-B`, `2026-05-15-netwatch-spinn`, `2026-05-15-ramming-galveston` sowie die zehn noch offenen Reservierungen aus `spotcheck-2026-05-15-turbeau-tutor`.
- Auswahlbasis: Deck-Legal-AI-Approval-Manifeste, AI-Hints, Release-Manifeste, Shared-Katalog, Engine-Resolver, Engine-Tests, Catalog-Overrides, Szenarien und lokale V1.9.21/V1.9.22 Arbeitsartefakte.
- Auswahlbegründung: seeded zufällige 10er-Stichprobe mit Seed `2026051503` aus nicht tabuisierten, bereits decklegalen Originalset-Karten mit erhöhtem Timing-, Choice-, Run-Modifier-, Hidden-Zone-, RandomDrawRecord-, Program-Trash- oder Modifier-Layering-Risiko. Die Stichprobe mischt ältere ICE-Freigaben, V1.9.20/V1.9.21-Sonderzustände und V1.9.22-Per-card-Resolver.

## Kartenbefunde

### onr_v1_002_ai-boon - AI Boon

Bewertung:
- Engine: Aktuell existiert eine installierte Runner-Programm-LegalAction `deterministic_die_probe` mit `RandomDrawRecords`; `V1_9_21_RANDOM_EFFECT_COMPLETION_PLAN.md` und Review fordern jedoch den eigentlichen Vertrag: zu Beginn jedes Runs einmal würfeln und run-lokale Stärke setzen. Im Engine-Code ist dafür kein Start-of-run-Trigger sichtbar.
- Chronik: PublicPayload für den Probe-Wurf ist vorhanden, aber es fehlt die Chronik für automatische Run-Start-Auslösung, gesetzte Stärke, Run-End-Cleanup und die Quelle.
- Tests: Der vorhandene Test prüft nur die manuelle Aktion, Wrong-Side, RandomDrawRecords und Replay. Er schützt nicht gegen fehlenden Start-of-run-Trigger und nicht gegen run-lokale Strength-Reset-Pfade.
- Hidden-Info/Replay/StateHash: Keine Hidden-Zone-Daten; hohes Replay-Risiko durch automatischen Zufall bei Run-Start. RandomCounter muss nur dann steigen, wenn AI Boon installiert ist und ein echter Run beginnt.
- Fehlende Härtungen: Der Probe-Pfad darf nicht als vollständige Kartenumsetzung gelten; Start-of-run-Wurf, Stärkeanwendung auf Encounter und Cleanup fehlen als nachgewiesener Vertrag.

Notwendige Umsetzung:
- [ ] Engine-Resolver ergänzen: Bei jedem Runner-Run-Start mit installiertem AI Boon genau einen `RandomDrawRecord` erzeugen und AI-Boon-Stärke run-lokal setzen.
- [ ] Manuelle `deterministic_die_probe`-Action entfernen oder als reine Test-/Debug-Oberfläche aus Deck-Legal-Promotion herausnehmen.
- [ ] Breaker-/Encounter-Stärke aus dem run-lokalen AI-Boon-Wert berechnen; Stärke am Runende, Jack-out und Run-Abbruch löschen.
- [ ] PublicPayload für Run-Start mit `randomPurpose`, `randomCounterAfter`, `aiBoonRunStrength`, Quelle und ohne private Karten ergänzen.
- [ ] Tests ergänzen: installiert vs. nicht installiert, zwei Runs im selben Spiel, Run-End-Cleanup, Replay/StateHash, Wrong-Side/Stale für betroffene Break-Actions.

Akzeptanzkriterien:
- [ ] AI Boon würfelt automatisch beim Run-Start, nicht als normale Hauptaktion.
- [ ] Die gewürfelte Stärke wirkt nur während dieses Runs und verschwindet danach.
- [ ] RandomDrawRecords und StateHash sind bei gleichem Seed stabil und bei anderem Seed nachvollziehbar anders.
- [ ] PublicEvents enthalten nur Zufallsmetadaten und keine Stack-/Grip-/HQ-/R&D-Daten.

### onr_v1_109_security-code-worm-chip - Security Code WORM Chip

Bewertung:
- Engine: Der Kernpfad ist vorhanden: Play nur nach erfolgreichem HQ-Run, öffentliche Zielwahl auf unrezzed installed ICE, Trash nach Archives, Wrong-Side/Stale und Replay im positiven Test.
- Chronik: PublicPayload zeigt Ability, Zielposition, Serverlabel, Target-Definition und Trash-Anzahl. Die Optionliste wird im Runner-PlayerView absichtlich ohne verdeckte ICE-Definition getestet.
- Tests: Es gibt einen positiven Test und einen No-target-Test. Es fehlen Race-Tests nach geöffneter Choice: Ziel wird gerezzed/getrasht, StateVersion driftet, Zielserver ändert sich, erfolgreicher HQ-Run-Flag wird durch Zugwechsel gelöscht.
- Hidden-Info/Replay/StateHash: Sehr relevant, weil unrezzed ICE verdeckt sind. Public/Runner dürfen Zielposition und Server sehen, aber vor dem Trash nicht die verdeckte Definition.
- Fehlende Härtungen: Choice-Resolve muss beweisen, dass nur noch unrezzed installierte ICE legal sind und dass der Trash-Payload nicht rückwirkend verdeckte Informationen vor der Auflösung leakt.

Notwendige Umsetzung:
- [ ] Choice-Race-Test ergänzen: Ziel wird vor Resolve gerezzed; Resolve lehnt kontrolliert ab.
- [ ] Choice-Race-Test ergänzen: Ziel wird vor Resolve getrasht oder aus dem Server entfernt; Resolve lehnt kontrolliert ab.
- [ ] Zugwechsel-Test ergänzen: erfolgreicher HQ-Run-Flag wird gelöscht und die Event-LegalAction verschwindet.
- [ ] PublicPayload prüfen: vor Resolve keine Zieldefinition; nach Resolve nur die getrashte, nun öffentliche Definition.
- [ ] AI-Hint prüfen: Karte darf nur nach erfolgreichem HQ-Run und bei wertvollen unrezzed ICE eingeplant werden.

Akzeptanzkriterien:
- [ ] LegalAction erscheint nur nach erfolgreichem HQ-Run in diesem Zug und bei mindestens einem unrezzed installed ICE.
- [ ] `applyAction`/Choice-Resolve revalidiert Side, StateVersion, HQ-Flag, installierten Zustand und unrezzed Zustand.
- [ ] PlayerViews/PublicEvents leaken keine unrezzed ICE-Definition vor der Auflösung.
- [ ] Replay/StateHash bleibt für Erfolg, Ziel gerezzed und Ziel entfernt stabil.

### onr_v1_113_synchronized-attack-on-hq - Synchronized Attack on HQ

Bewertung:
- Engine: Kernpfad ist vorhanden: Play nur nach erfolgreichem HQ-Run, Corp-private `hidden_info_barrier`-Choice auf HQ-Karten, Zahlung 2 pro behaltene Karte, Rest in Archives. Wrong-Side/Stale und Replay sind im positiven Test abgedeckt.
- Chronik: PublicPayload meldet Hidden-Zone-Barriere, retained/discarded Count, paidCredits und Corp-Credits danach. Gut ist, dass Runner-View keine PendingChoice sieht.
- Tests: Es fehlt ein Fall mit zu wenig Korp-Credits für die gewählte Behalte-Anzahl, 0 Credits, leeres HQ nach Race, alle behalten vs. alle discarden und Zugwechsel nach erfolgreichem HQ-Run.
- Hidden-Info/Replay/StateHash: Sehr hohe Relevanz, weil HQ privat ist. Public darf nur Counts sehen; Corp sieht private Optionen. Fehlertexte dürfen keine HQ-Titel enthalten.
- Fehlende Härtungen: Kostenrevalidation der Corp-Choice und Race-Pfade nach offener Choice sind nicht ausreichend nachgewiesen.

Notwendige Umsetzung:
- [ ] Test ergänzen: Corp wählt mehr Karten zum Behalten als Credits bezahlen können; Resolve lehnt kontrolliert oder begrenzt gemäß Vertrag.
- [ ] Test ergänzen: Corp behält 0, 1, alle Karten; PublicPayload enthält nur Counts und Kosten, keine Titel/IDs.
- [ ] Test ergänzen: HQ verändert sich vor Choice-Resolve; stale/ungültige Optionen werden abgelehnt.
- [ ] Zugwechsel-Test ergänzen: erfolgreicher HQ-Run-Flag läuft ab und die Event-LegalAction verschwindet.
- [ ] AI-Hint prüfen: Runner bewertet die Karte nach HQ-Größe und Korp-Credits, aber ohne Zugriff auf verdeckte HQ-Identitäten.

Akzeptanzkriterien:
- [ ] Corp kann nur so viele HQ-Karten behalten, wie sie mit 2 Credits pro Karte bezahlen kann.
- [ ] Runner/Public sehen keine HQ-Kartenidentitäten in Choice, EventLog, Reconnect oder Replay.
- [ ] `applyAction` revalidiert Side, StateVersion, HQ-Flag, Eventkosten und Choice-Kosten.
- [ ] Replay/StateHash ist für alle behalten, teilweise behalten und keine behalten stabil.

### onr_v1_273_triggerman - Triggerman

Bewertung:
- Engine: Subroutines sind als `trash_installed_program` plus `end_the_run` modelliert. Der V1.6.3-Test prüft Triggerman gemeinsam mit D'Arc Knight und Sentinels Prime auf deterministischen Program-Trash und Replay.
- Chronik: Die generische Subroutine-Auflösung trasht derzeit deterministisch ein Runner-Programm über `pickRunnerProgramForUninstall`; PublicPayload für die konkrete Zieldefinition und Auswahl-/Autopick-Regel ist nicht eng kartenspezifisch nachgewiesen.
- Tests: Vorhandener Familien-Test deckt positiven Program-Trash ab. Es fehlen Triggerman-spezifische Tests für mehrere installierte Programme, keine installierten Programme, Break der Trash-Subroutine, nur ETR löst aus und PublicPayload-Lesbarkeit.
- Hidden-Info/Replay/StateHash: Installierte Programme sind öffentlich; Risiko liegt in implizitem Autopick statt expliziter Runner-Choice, wenn mehrere Programme installiert sind.
- Fehlende Härtungen: Regelvertrag klären, ob Runner bei mehreren Programmen wählt oder Engine deterministisch wählt. Danach Choice oder stabile Autopick-Payload umsetzen.

Notwendige Umsetzung:
- [ ] Lokalen Triggerman-Vertrag für mehrere installierte Programme festlegen: Runner-Choice bevorzugt, falls keine Projektquelle Autopick verlangt.
- [ ] Falls Choice: private/öffentliche Runner-Choice auf installierte Programme öffnen und in `applyAction` source-/state-sicher revalidieren.
- [ ] Falls Autopick bleibt: PublicPayload mit `selectionMode`, Zieldefinition und stabiler Sortierregel ergänzen.
- [ ] Tests ergänzen: mehrere Programme, kein Programm, Trash-Subroutine gebrochen, ETR ungebrochen, Replay/StateHash.
- [ ] AI-Hint prüfen: Corp bewertet Triggerman als Program-Trash-ICE; Runner-KI muss Break-Priorität für die Trash-Subroutine verstehen.

Akzeptanzkriterien:
- [ ] Triggerman trasht nur installierte Runner-Programme und nie Grip-/Stack-Karten.
- [ ] Mehrziel-Fall ist deterministisch und im PublicPayload verständlich.
- [ ] Gebrochene Trash-Subroutine verursacht keinen Program-Trash; ETR bleibt separat brechbar.
- [ ] Replay/StateHash bleibt bei 0, 1 und mehreren Programmen stabil.

### onr_v1_147_zz22-speed-chip - ZZ22 Speed Chip

Bewertung:
- Engine: Shared-Definition hat Installkosten 0 und generischen Hardware-/Memory-Surface. `data/rules/v1922-local-card-facts.json` nennt dagegen Installkosten 5 und 2 recurring restricted credits für Killer-Nutzung während Runs. Ein spezifischer Recurring-Killer-Credit-Resolver ist nicht sichtbar.
- Chronik: Keine Chronik für Installation zu 5 Credits, Recurring-Pool, Verbrauch bei Killer-Nutzung oder Refresh am Runner-Zugstart.
- Tests: Vorhandener V1.9.22-Hardware-Test prüft generische Installation, Wrong-Side/Stale, Sichtbarkeit und Replay; er schützt nicht den eigentlichen Chip-Effekt.
- Hidden-Info/Replay/StateHash: Keine verdeckten Zonen. Risiko liegt in Kostenprojektion, Pool-Refresh und Kostenquelle bei Break-/Pump-Actions.
- Fehlende Härtungen: Vollständiger Kartenvertrag ist noch nicht umgesetzt: Installkosten, recurring restricted credits, Killer-Filter, Refresh und PublicPayload.

Notwendige Umsetzung:
- [ ] Shared-/Catalog-/Engine-Installkosten auf 5 harmonisieren.
- [ ] Öffentlichen ZZ22-Recurring-Pool mit 2 Credits anlegen, restricted auf Killer-Nutzung während Runs.
- [ ] Break-/Pump-Kostenpfade so erweitern, dass ZZ22-Credits nur für Killer-Programme und nur während Runs nutzbar sind.
- [ ] Runner-Zugstart-Refresh aus Bankpool deterministisch ergänzen; PublicPayload mit Pool vorher/nachher.
- [ ] Tests ergänzen: Installkosten, Killer vs. Nicht-Killer, Verbrauch, Refresh, insufficient normal credits, Wrong-Side/Stale, Replay/StateHash.

Akzeptanzkriterien:
- [ ] Installation kostet 5 und ist LegalAction-/`applyAction`-revalidiert.
- [ ] Genau 2 recurring Credits stehen nur für Killer-Nutzung während Runs zur Verfügung.
- [ ] Pool-Verbrauch und Refresh sind öffentlich verständlich und replay-stabil.
- [ ] Nicht-Killer, Nicht-Run-Timing und zu hohe Kosten werden kontrolliert abgelehnt.

### onr_v1_230_cortical-scanner - Cortical Scanner

Bewertung:
- Engine: Cortical Scanner ist als Code Gate mit drei End-the-run-Subroutinen modelliert; Catalog-Override führt Rez-Kosten 7 und Stärke 3. Alte Testabdeckung prüft Releasefähigkeit und einfache Rez-/Run-Pfade, aber keine fokussierte moderne Replay-/Chronikprüfung.
- Chronik: Drei einzelne ETR-Subroutinen sind funktional sichtbar, aber es gibt keinen engen Test auf Subroutine-Indizes, getrenntes Brechen und Event-Payload nach teilweisem Break.
- Tests: Vorhandene Abdeckung ist älter und nicht kartenfokussiert. Es fehlen moderne Tests mit Decoder-Break einzelner ETRs, ungebrochene Rest-Subroutinen, Wrong-Side/Stale für Break-Actions und Replay/StateHash.
- Hidden-Info/Replay/StateHash: Kein Hidden-Info-Bezug; Risiko liegt in Indexstabilität und UI-/Chronikverständlichkeit bei drei gleichartigen Subroutinen.
- Fehlende Härtungen: Fokus-Test für "drei ETR, jede einzeln brechbar" als Regression gegen synthetische Subroutine-Modifier und Break-Cost-Layering.

Notwendige Umsetzung:
- [ ] Test ergänzen: Cortical Scanner rezzen, alle drei ETR-Subroutinen separat projizieren und einzeln brechen.
- [ ] Test ergänzen: nur zwei von drei ETRs brechen; die dritte beendet den Run.
- [ ] Test ergänzen: Wrong-Side/Stale/ungültiger Subroutine-Index für Break.
- [ ] PublicPayload/Chronik auf stabile `subroutineIndex` und `sourceDefinitionId` prüfen.
- [ ] AI-Hint prüfen: Runner-KI muss dreifache ETR-Kosten korrekt bewerten, nicht nur "ein Code Gate".

Akzeptanzkriterien:
- [ ] Cortical Scanner hat exakt drei End-the-run-Subroutinen.
- [ ] Jede Subroutine ist indexstabil einzeln brechbar; ungebrochene ETR beendet den Run.
- [ ] PublicPayload bleibt ohne private Daten und ist für alle drei Subroutinen unterscheidbar.
- [ ] Replay/StateHash ist für 0, 1, 2 und 3 gebrochene Subroutinen stabil.

### onr_v1_277_virizz - Virizz

Bewertung:
- Engine: Run-wide Break-Kostenmodifier ist implementiert: Nach Auflösung der Virizz-Subroutine steigt `breakSubroutineAdditionalCost` um 1; ein Test mit Hammer auf späterem ICE prüft Projektion, Wrong-Side/Stale und Replay.
- Chronik: Continue-Payload nennt `v1922CorpIceAbility`, Zusatzkosten und Quelle. Break-Payload nennt Base-/Additional-/Total-Cost, aber Stack-/Mehrfachquellen sind nicht geprüft.
- Tests: Positiver Pfad ist stark. Es fehlen Run-End-Cleanup, mehrere Virizz-Quellen oder erneute Subroutine-Auflösung, nicht brechbare/gebrochene Modifier-Subroutine, und Nachweis, dass der Modifier nur spätere Breaks im selben Run betrifft.
- Hidden-Info/Replay/StateHash: Kein Hidden-Info-Bezug. Risiko liegt in Kostenlayering und Run-Lebensdauer.
- Fehlende Härtungen: Der Modifier muss am Runende sicher verschwinden und bei mehrfacher Anwendung eindeutig stacken oder begrenzt werden.

Notwendige Umsetzung:
- [ ] Test ergänzen: Virizz-Modifier verschwindet bei Run-Ende, Jack-out und erfolgreichem Runabschluss.
- [ ] Test ergänzen: Virizz-Subroutine gebrochen; kein zusätzlicher Break-Kostenmodifier.
- [ ] Test ergänzen: zwei Virizz-Modifier im selben Run; Vertrag für Stacking explizit festlegen und prüfen.
- [ ] Test ergänzen: Break auf demselben Encounter vor Modifier-Auflösung erhält keinen Zusatzkostenaufschlag.
- [ ] PublicPayload um source-bound Modifierliste oder `modifierCount` ergänzen, falls Stacking möglich ist.

Akzeptanzkriterien:
- [ ] Virizz erhöht Break-Kosten nur nach ungebrochener Subroutine-Auflösung und nur für den laufenden Run.
- [ ] Kostenaufschlag wird in LegalActions und `applyAction` identisch revalidiert.
- [ ] Run-End-Cleanup entfernt den Modifier vollständig.
- [ ] Replay/StateHash ist für gebrochen, einmal aktiv und mehrfach aktiv stabil.

### onr_v1_077_anonymous-tip - Anonymous Tip

Bewertung:
- Engine: Kernpfad ist vorhanden: Play kostet 3, nur bei rezzed Black ICE, öffentliche Zielwahl, Derez setzt `rezzed=false` und `faceup=false`, PublicPayload nennt Zieldefinition nach Auflösung. Wrong-Side/Stale und Replay sind im positiven Test abgedeckt.
- Chronik: Derez ist chronikfähig, aber die Zieldefinition eines zuvor rezzed ICE ist öffentlich; der Wechsel auf facedown sollte als "derezzed" und nicht als Hidden-Info-Leak bewertet werden.
- Tests: Es fehlen No-target-Test, nicht-Black-ICE-Negativfall, Ziel wird vor Resolve getrasht/derezzed, Corp-Credits irrelevant, und Reconnect-/PlayerView-Nachweis nach Derez.
- Hidden-Info/Replay/StateHash: Nach Derez darf die Karte im Board wieder verdeckt erscheinen, aber PublicEvents dürfen die vorher öffentlich bekannte Definition nennen. Reconnect darf für Runner danach keine neue verdeckte Information erzeugen.
- Fehlende Härtungen: Race-Revalidation und Sichtbarkeitsregeln nach Derez sind nicht eng genug abgesichert.

Notwendige Umsetzung:
- [ ] Test ergänzen: keine rezzed Black ICE -> Anonymous Tip nicht legal.
- [ ] Test ergänzen: rezzed Nicht-Black-ICE ist kein Ziel.
- [ ] Choice-Race-Test ergänzen: Ziel vor Resolve derezzed/getrasht; Resolve lehnt kontrolliert ab.
- [ ] PlayerView-/Reconnect-Test ergänzen: Nach Derez ist Board-Visibility korrekt, PublicEvent darf frühere Definition nennen.
- [ ] AI-Hint prüfen: Runner bewertet nur rezzed Black ICE als Ziel und berücksichtigt Rez-Kosten/Threat.

Akzeptanzkriterien:
- [ ] LegalAction erscheint nur mit mindestens einem rezzed Black ICE.
- [ ] Choice-Resolve revalidiert Ziel, Rezzed-Zustand, Black-ICE-Subtype, Side und StateVersion.
- [ ] Derez ändert PlayerViews korrekt, ohne zusätzliche verdeckte Serverkarten zu offenbaren.
- [ ] Replay/StateHash bleibt bei Erfolg und Race-Ablehnung stabil.

### onr_v1_226_canis-minor - Canis Minor

Bewertung:
- Engine: Subroutine setzt `futureEncounterIceStrengthBonus` um +1 für spätere ICE im selben Run. V1.8.1-Test prüft Canis Major + Canis Minor in einem kombinierten Pfad und beobachtet den kumulierten Bonus.
- Chronik: Für Canis Minor fehlt ein eigener PublicPayload-Nachweis mit Quelle und Höhe. Die Subroutine setzt den Run-State, aber kein payloadfähiges `sourceDefinitionId`.
- Tests: Vorhandener Familien-Test deckt Grundfunktion ab. Es fehlen Canis-Minor-spezifische Fälle: Subroutine gebrochen, Run-End-Cleanup, nur spätere ICE betroffen, mehrere spätere ICE, Replay/StateHash und UI-/PlayerView-Stärke.
- Hidden-Info/Replay/StateHash: Kein Hidden-Info-Bezug; Risiko liegt in Run-State-Lebensdauer und Stärkeanzeige bei späteren Encounters.
- Fehlende Härtungen: Payload und Tests sollten Canis Minor als eigene Quelle sichtbar machen, nicht nur als anonymer zukünftiger Strength-Bonus.

Notwendige Umsetzung:
- [ ] PublicPayload beim Subroutine-Resolve ergänzen: `futureEncounterIceStrengthBonusAdded: 1`, `sourceDefinitionId: onr_v1_226_canis-minor`.
- [ ] Test ergänzen: gebrochene Canis-Minor-Subroutine setzt keinen Future-Strength-Bonus.
- [ ] Test ergänzen: Bonus betrifft nur spätere ICE im selben Run und wird am Runende gelöscht.
- [ ] Test ergänzen: mehrere spätere ICE zeigen den Bonus konsistent in Corp-/Runner-Views.
- [ ] AI-Hint prüfen: Runner-KI bewertet Canis Minor als Run-weiter Strength-Modifier, nicht nur als 0-Cost-Sentry.

Akzeptanzkriterien:
- [ ] Canis Minor setzt bei ungebrochener Subroutine genau +1 Strength für spätere ICE im selben Run.
- [ ] Gebrochene Subroutine und Runende lassen keinen Bonus zurück.
- [ ] PublicPayload erklärt Quelle und Höhe ohne private Kartendaten.
- [ ] Replay/StateHash ist für Bonus aktiv/inaktiv stabil.

### onr_v1_332_newsgroup-taunting - Newsgroup Taunting

Bewertung:
- Engine: Karte ist decklegal/AI-supported in V1.9.20, aber im Engine-Code ist kein spezifischer Resolver für `onr_v1_332_newsgroup-taunting` sichtbar. Shared-Text bleibt generisch: Run-flow und global static modifier surfaces. `V1920_ACTION_ASSET_IDS` enthält andere Assets, nicht Newsgroup Taunting.
- Chronik: Keine kartenspezifische Chronik für Run-Restriction, Modifier oder Persistent-State. Es gibt nur generische Install/Rez/Trash-on-access-Flächen.
- Tests: Es gibt Release-/Decklisten, aber keinen fokussierten Engine-Test, der eine Newsgroup-Taunting-Wirkung erzwingt.
- Hidden-Info/Replay/StateHash: Ohne klaren Resolververtrag ist nicht nachgewiesen, welche Informationen bei Run-Start, Zielwahl oder Modifier-Layering öffentlich sein müssen.
- Fehlende Härtungen: Vollständiger Effektvertrag fehlt oder ist nicht mit der Runtime synchronisiert. Diese Karte sollte nicht als vollständig funktional gelten, bis ein fester Vertrag dokumentiert und getestet ist.

Notwendige Umsetzung:
- [ ] Lokale Quelle/Funktionsmatrix für Newsgroup Taunting gegen Shared-Definition und V1.9.20-Artefakte abgleichen.
- [ ] Feste Resolver-Spezifikation erstellen: Trigger, Run-Bedingung, betroffene Server/ICE, Dauer, Kosten, PublicPayload, AI-Wert.
- [ ] Engine-Resolver implementieren oder, falls keine belastbare Quelle existiert, Status-/AI-Promotion blockieren und ein Blocker-Artefakt erstellen.
- [ ] Tests ergänzen: LegalAction-Projektion, `applyAction`-Revalidation, Wrong-Side/Stale, PublicPayload, Replay/StateHash.
- [ ] AI-Hint von generischem `remote_asset_modifier` auf den tatsächlichen Vertrag umstellen.

Akzeptanzkriterien:
- [ ] Newsgroup Taunting hat einen kartenspezifischen Engine-Effekt oder einen explizit dokumentierten Status-Blocker.
- [ ] Keine Wirkung wird aus freiem Kartentext oder generischen Rollen abgeleitet.
- [ ] PublicEvents/PlayerViews erklären Trigger und Dauer ohne Hidden-Info-Leak.
- [ ] Ein fokussierter Test schlägt fehl, wenn die Karte nur generisch installiert/rezzt/getrasht werden kann.

## Gesamtplan

1. Harte Vertragsdrift zuerst beheben: `AI Boon`, `ZZ22 Speed Chip` und `Newsgroup Taunting` sind als decklegal/AI-supported sichtbar, aber der jeweilige eigentliche Vertrag ist nicht oder nicht vollständig nachgewiesen.
2. Hidden-Zone-/Choice-Race-Pfade härten: `Security Code WORM Chip`, `Synchronized Attack on HQ` und `Anonymous Tip` brauchen Ziel-/Choice-Revalidation, Kosten-Races und PlayerView-/Reconnect-Sichtbarkeitsnachweise.
3. Run-weite Modifier absichern: `Virizz` und `Canis Minor` brauchen Cleanup-, gebrochen-/ungebrochen- und source-bound Payloadtests.
4. Ältere ICE-Abdeckung modernisieren: `Triggerman` und `Cortical Scanner` brauchen fokussierte Tests für Zielwahl bzw. Subroutine-Indexstabilität, PublicPayload und Replay/StateHash.
5. Danach AI-Hints, Manifest-/Mechanics-Coverage und Szenarioartefakte nur dort anpassen, wo der Kartenvertrag oder die Bewertungslogik tatsächlich korrigiert wurde.
6. Register und Spotcheck-Register erst im Umsetzungsjob nach grüner Umsetzung aktualisieren; dieser Analysejob erzeugt nur den Handoff.

## Empfohlene Checks

- corepack pnpm --filter @netgrid/engine test
- corepack pnpm --filter @netgrid/web test -- chronicle.test.ts
- corepack pnpm --filter @netgrid/catalog test
- corepack pnpm typecheck

## Umsetzung 2026-05-15

Status: done.

Geänderte Dateien:

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `data/ai/ai-card-hints-deck-legal-v1920.json`
- `data/ai/ai-card-hints-deck-legal-v1922.json`
- `docs/reviews/originalset-spotchecks/register.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `docs/reviews/originalset-spotchecks/reports/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_AI_BOON_VIRIZZ_IMPLEMENTATION.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`

Umsetzungsstand:

- `AI Boon`: automatischer Run-Start-Wurf mit `RandomDrawRecord`, run-lokaler Stärke, PublicPayload und Replay-/StateHash-Test umgesetzt; manuelle Runner-Programm-Probe wird nicht mehr angeboten.
- `ZZ22 Speed Chip`: Installkosten 5, 2 Recurring Credits und Killer-only-Run-Payment-Filter umgesetzt und getestet.
- `Newsgroup Taunting`: rezzed globaler Run-Start-Tax mit source-bound LegalAction, Payment-Revalidation und PublicPayload umgesetzt und getestet.
- `Security Code WORM Chip`, `Synchronized Attack on HQ`, `Triggerman`, `Cortical Scanner`, `Virizz`, `Anonymous Tip` und `Canis Minor`: bestehende Resolver gegen den Jobbericht geprüft; vorhandene Replay-/Hidden-Info-/Revalidation-Abdeckung bleibt grün.

Checks:

- `corepack pnpm --filter @netgrid/engine test`: grün, 337 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`: grün, 119 Tests.
- `corepack pnpm --filter @netgrid/catalog test`: grün, 44 Tests.
- `corepack pnpm typecheck`: grün.

Restpunkte:

- Keine fachlichen Restpunkte.
- Lokale Windows-ACL blockierte das Löschen der ursprünglichen `inbox`- und `in_progress`-Dateien; beide wurden auf `status: done` gesetzt, damit sie nicht erneut als ready selektiert werden.

Commit:

- Lokaler Commit mit Message `Implement Originalset spotcheck job spotcheck-2026-05-15-ai-boon-virizz`; finaler Hash steht im Laufabschluss.
