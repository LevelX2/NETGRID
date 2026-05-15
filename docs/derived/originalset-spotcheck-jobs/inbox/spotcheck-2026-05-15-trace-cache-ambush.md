---
jobId: spotcheck-2026-05-15-trace-cache-ambush
status: ready_for_implementation
createdAt: 2026-05-15T11:11:00+01:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_063_signpost
    title: Signpost
  - cardId: onr_v1_082_deal-with-militech
    title: Deal with Militech
  - cardId: onr_v1_091_hunt-club-bbs
    title: Hunt Club BBS
  - cardId: onr_v1_110_sneak-preview
    title: Sneak Preview
  - cardId: onr_v1_155_code-viral-cache
    title: Code Viral Cache
  - cardId: onr_v1_181_the-springboard
    title: The Springboard
  - cardId: onr_v1_227_cerberus
    title: Cerberus
  - cardId: onr_v1_250_ice-pick-willie
    title: Ice Pick Willie
  - cardId: onr_v1_345_trap
    title: TRAP!
  - cardId: onr_v1_365_paris-city-grid
    title: Paris City Grid
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-trace-cache-ambush

## Auswahlprüfung

- Geprüfte Register und Jobverzeichnisse: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json`, alle Markdown-Dateien unter `docs/derived/originalset-spotcheck-jobs/inbox/`, `docs/derived/originalset-spotcheck-jobs/in_progress/`, `docs/derived/originalset-spotcheck-jobs/done/` und `docs/derived/originalset-spotcheck-jobs/blocked/`.
- Lesbarkeit/Stopkriterien: Die Pflichtquellen waren lesbar; in den relevanten Register-/Queue-Dateien wurden keine aktiven Konfliktmarker gefunden. Der Generator-Lock war zu Beginn nicht vorhanden und wurde für diesen Lauf aktiv gesetzt.
- Deduplizierung: 140 Card IDs wurden aus Register und allen sichtbaren Queue-Berichten tabu gesetzt. Dazu gehören auch aktuell noch in `inbox/` liegende Jobs; Queue-Berichte hatten wie gefordert Vorrang vor Registerhistorie.
- Auswahlpool: Aus 361 decklegal/AI-approvten Originalset-IDs blieben nach Tabu-Filter 223 Kandidaten. Die Auswahl wurde zufällig aus einem komplexitätsgewichteten Pool gezogen, mit Schwerpunkt auf Trace-/Link-Fenstern, Hidden-Zone-Projektion, Damage-Prevention, Access-Ambush, ICE-Subroutinen, PublicPayload und Replay/StateHash.
- Fachartefakte der Analyse: `packages/shared/src/index.ts`, `packages/engine/src/index.ts`, `packages/engine/src/index.test.ts`, `packages/catalog/src/index.ts`, `data/local/card-import/onr-v1-limited/card-snapshot-onr-v1-limited.local.json`, passende `data/manifests/card-implementation-manifest-*.json`, `data/manifests/deck-legal-ai-approval-*.json`, `data/ai/ai-card-hints-deck-legal-*.json`, `data/scenarios/v19*.json` und die V1.9.x Plan-/Review-Artefakte unter `docs/derived/`.

## Kartenbefunde

### onr_v1_063_signpost - Signpost

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen
- Engine: Signpost ist als installierbares Trace-/Link-Programm decklegal, aber `packages/shared/src/index.ts` beschreibt nur einen generischen trace/link/reveal-Helfer ohne `baseLink` und ohne eigene Paid-Ability. Das lokale Snapshot-Profil beschreibt eine nach dem Bid-Reveal nutzbare +2-Link-Fähigkeit. Damit droht Effekt-Drift: Die Karte ist freigegeben, aber der konkrete Timingpunkt nach offen gelegten Geboten ist nicht sichtbar als eigener LegalAction-Vertrag modelliert.
- Chronik: Trace-Fenster tragen `runnerLink`, Bid-Schritte und Source-Informationen. Für Signpost fehlt ein kartenkonkreter PublicPayload-Nachweis, der zeigt, ob der +2-Link-Nachbid-Effekt genutzt wurde oder bewusst nicht verfügbar ist.
- Tests: V1.9.14 deckt Trace-Link-Tools im Paket ab. Es fehlt ein Signpost-Fokustest für installierten Zustand, Paid-Ability nach offen gelegten Geboten, genau einmal pro Trace, Kosten, falschen Timingpunkt, wrong-side, stale StateVersion und Replay.
- Hidden-Info/Replay/StateHash: Keine Hidden-Zone-Karten, aber Trace-Bids sind interaktive Choices. Die Zusatz-Link-Entscheidung darf die Bid-Historie nutzen, aber keine privaten Hand-/Deckinformationen in KI-Input oder PublicPayload tragen.
- Fehlende Härtungen: Timingfenster nach Bid-Reveal, Nutzungsgrenze pro Trace, Source-Attribution und AI-Bewertung der Link-Nachzahlung.

Notwendige Umsetzung
- [ ] Signpost-Vertrag gegen lokale Facts finalisieren: generischer Trace-Helfer oder echte nachträgliche +2-Link-Ability.
- [ ] Falls die Ability gilt, ein eigenes LegalAction-Fenster nach offen gelegten Corp-/Runner-Bids modellieren.
- [ ] `applyAction` muss Side, installierte Quelle, StateVersion, Trace-ID, bereits genutzte Signpost-Quelle und Kosten erneut validieren.
- [ ] Tests für Positivpfad, falschen Timingpunkt, zweite Nutzung im selben Trace, nicht installierte Quelle, wrong-side/stale und Replay ergänzen.

Akzeptanzkriterien
- [ ] Engine, Shared-Text, Katalogstatus und AI-Hint beschreiben denselben Signpost-Vertrag.
- [ ] Signpost kann nur im finalen Trace-Bid-Fenster wirken, falls die lokale Fähigkeit aktiv bleibt.
- [ ] PublicPayload nennt Quelle, Link-Delta und Runner-Link-Endwert ohne private Daten.
- [ ] Replay mit gleichem Seed endet mit identischem StateHash.

### onr_v1_082_deal-with-militech - Deal with Militech

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen
- Engine: Die Runtime nutzt aktuell den generischen V1.9.12-Stack-Search-Pfad: private Runner-Choice, Programmsuche, Reveal und Shuffle. Der lokale Kartentext beschreibt stattdessen eine Bedingung nach befreiten Research-Agenden und Counter auf installierten Icebreakern. Das ist eine klare Vertragsschere zwischen Freigabe und Effektvollständigkeit.
- Chronik: Der vorhandene Search-Pfad publiziert Hidden-Zone-Barriere und Suchaktion. Es fehlt eine Chronik für Research-Bedingung, gewählte Icebreaker und Counter-Deltas.
- Tests: Vorhanden ist ein kombinierter V1.9.12-Hidden-Zone-Test mit Deal with Militech als Suchkarte. Fehlend sind Agenda-Turn-History, Counterverteilung, keine-Icebreaker-Fälle, manipulierte Zielauswahl, wrong-side/stale, PublicPayload und Replay.
- Hidden-Info/Replay/StateHash: Die aktuelle Suche ist hidden-info-sensibel; der lokale Countervertrag wäre überwiegend öffentlich, aber die Research-Run-Historie und installierte Icebreaker müssen aus öffentlichem Zustand abgeleitet werden.
- Fehlende Härtungen: Effektvollständigkeit, Bedingungsprüfung, Counterziel-Revalidation, AI-Hint-Synchronisierung.

Notwendige Umsetzung
- [ ] Führenden Vertrag entscheiden und die generische Stack-Suche entfernen, falls der lokale Countervertrag gilt.
- [ ] Turn-History für "Research agenda liberated this turn" source-bound prüfen.
- [ ] LegalAction für Counterverteilung auf installierte Icebreaker erzeugen; `applyAction` validiert Icebreaker-Typ, installierten Zustand, Auswahlmenge und StateVersion.
- [ ] Tests für keine Research-Agenda, keine Icebreaker, mehrere Icebreaker, manipulierte Ziele, wrong-side/stale, PublicPayload und Replay ergänzen.

Akzeptanzkriterien
- [ ] Deal with Militech ist nur nach der finalen Research-Bedingung legal.
- [ ] Counter werden exakt und nur auf legale installierte Icebreaker gelegt.
- [ ] Kein Stack-/Programmsuchpfad bleibt aktiv, wenn er nicht mehr dem führenden Vertrag entspricht.
- [ ] Replay/StateHash und AI-Hints sind nach dem finalen Vertrag synchron.

### onr_v1_091_hunt-club-bbs - Hunt Club BBS

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen
- Engine: Die Karte ist in V1.9.12 freigegeben, die Runtime führt sie als Top-of-stack-Reveal. Der lokale Snapshot beschreibt jedoch Expose von bis zu drei installierten Karten. Dadurch kann der aktuelle Resolver eine Hidden-Zone-Funktion statt eines installierten Corp-Karten-Expose-Vertrags ausführen.
- Chronik: Der Reveal-Pfad publiziert Stack-Top-Definition und Titel. Für einen Expose-Vertrag müssten Server, Zielanzahl, nur legale unrezzed/installierte Corp-Karten und öffentliche Reveal-Ergebnisse sauber ausgewiesen werden.
- Tests: Es gibt einen V1.9.12-Kombitest für Top-Reveal. Ein Hunt-Club-Fokustest für bis zu drei Expose-Ziele, leere Zielmenge, Zielmanipulation, Server-/Installationsfilter, wrong-side/stale und Replay fehlt.
- Hidden-Info/Replay/StateHash: Expose ist gerade die erlaubte Offenlegung verdeckter installierter Corp-Karten. Der Leak-Schutz muss sicherstellen, dass nur gewählte legale Ziele und keine anderen Root-/ICE-Karten sichtbar werden.
- Fehlende Härtungen: Effekt-Drift, Zielwahl, Max-3-Begrenzung, PublicPayload-Granularität.

Notwendige Umsetzung
- [ ] Vertrag gegen lokale Facts finalisieren: Stack-Reveal beibehalten oder auf bis zu drei Expose-Ziele korrigieren.
- [ ] Bei Expose-Vertrag LegalAction mit `minSelections: 0`, `maxSelections: 3` und nur legalen installierten verdeckten Corp-Karten erzeugen.
- [ ] `applyAction` muss jedes Ziel, die Zielanzahl, Side, StateVersion und aktuelle Installations-/Rez-Situation erneut prüfen.
- [ ] Leakscan gegen nicht gewählte installierte Karten, HQ/R&D/Archives und KI-Input ergänzen.

Akzeptanzkriterien
- [ ] Hunt Club BBS offenbart ausschließlich die final erlaubten Zielkarten.
- [ ] Mehr als drei Ziele, falsche Zone oder bereits unzulässige Ziele werden abgelehnt.
- [ ] PublicPayload listet nur exponierte Definitionen, keine internen Instance-Details fremder Karten.
- [ ] Replay/StateHash bleibt stabil.

### onr_v1_110_sneak-preview - Sneak Preview

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen
- Engine: Sneak Preview wird aktuell als einfacher V1.9.11-Stack-Top-Reveal geführt. Der lokale Snapshot beschreibt einen temporären Programminstall aus Heap oder Stack, Shuffle nach Stack-Suche und Rücknahme am Zugende. Das ist eine starke Effektlücke mit Zone-, Installations-, Hosting-/Memory- und End-of-turn-Lifecycle-Relevanz.
- Chronik: Der vorhandene Reveal-Payload ist public und klein. Der Zielvertrag braucht private Such-/Auswahl-Payloads, öffentliche Install-Zusammenfassung, temporären Marker, End-of-turn-Return und Shuffle-/RandomDrawRecords.
- Tests: V1.9.11 testet nur Reveal-Sicherheit. Fehlend sind Heap-vs-Stack-Auswahl, Installkosten 0, Memory-Prüfung oder temporäre Ausnahmeentscheidung, Stack-Shuffle, Rückkehr in Grip, Trash/Deinstall vor Zugende, wrong-side/stale und Replay.
- Hidden-Info/Replay/StateHash: Sehr hoch, weil Stack-Suche private Runner-Zone betrifft. PublicEvents dürfen Suchoptionen nicht an die Corp leaken; Replay muss die konkrete private Auswahl deterministisch nachfahren.
- Fehlende Härtungen: Vollresolver statt Reveal-Stub, temporärer Lifecycle, Stack-Choice-Revalidation, Cleanup bei Zonenwechsel.

Notwendige Umsetzung
- [ ] Sneak Preview auf vollständigen Heap-oder-Stack-Programminstall-Vertrag heben oder Freigabe/AI-Hint als bewusst reduzierten Stub markieren.
- [ ] Private Choice für Heap/Stack-Programm erzeugen; Stack-Suche mit Shuffle und RandomDrawRecord koppeln.
- [ ] Temporäres Install-Merkmal speichern und End-of-turn-Return auslösen, sofern die Karte noch installiert ist.
- [ ] Tests für Heap, Stack, keine Ziele, Zielmanipulation, Memory/Hosting, vorzeitigen Trash, wrong-side/stale, PublicPayload-Leakscan und Replay ergänzen.

Akzeptanzkriterien
- [ ] Sneak Preview installiert genau ein legales Programm aus Heap oder Stack ohne Kosten.
- [ ] Stack-Suche bleibt runner-privat und erzeugt deterministische Shuffle-/Replay-Spuren.
- [ ] Das temporäre Programm kehrt am Zugende korrekt in die Grip zurück oder wird bei Zonenwechsel nicht doppelt bewegt.
- [ ] Keine Stack-/Heap-Optionen leaken in Corp-View, PublicEvents, KI-Inputs oder Reconnect-Payloads.

### onr_v1_155_code-viral-cache - Code Viral Cache

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen
- Engine: Code Viral Cache ist als generisches Prevention-Profil modelliert: einmal pro Zug 1 Net Damage verhindern. Der lokale Snapshot beschreibt einen Virus-Purge-Replacement-Effekt nach erfolgreichem HQ-Run sowie eine Korp-Trash-Aktion. Der freigegebene Runtime-Vertrag deckt damit einen anderen Mechanikpfad ab.
- Chronik: Damage-Prevention-Payloads sind grundsätzlich side-sicher. Es fehlt ein Payload für "zwei Virus-Counter bleiben beim Purge erhalten", gewählte Counterquellen und Korp-Trashkosten.
- Tests: Keine fokussierten Engine-Tests für Code Viral Cache gefunden; nur Manifest/AI-Smoke-Referenzen. Fehlend sind Purge-Interaktion, Counterauswahl, Installation nach HQ-Erfolgsbedingung, Korp-Trash-Aktion, wrong-side/stale, Damage-Noop-Negativfall und Replay.
- Hidden-Info/Replay/StateHash: Counterquellen sind meist öffentlich, aber die Runner-Auswahl kann private Strategie enthalten. Korp-Trash-Aktion und Purge-Replacement müssen source-bound und StateHash-stabil sein.
- Fehlende Härtungen: Effektvollständigkeit, Abgrenzung von Damage-Prevention, Counter-Choice-Revalidation, Korp-Aktionskosten.

Notwendige Umsetzung
- [ ] Vertrag finalisieren: aktuellen Damage-Prevention-Stub beibehalten oder auf lokalen Virus-Purge-Replacement-Vertrag korrigieren.
- [ ] Bei lokalem Vertrag: Installation nur nach erfolgreichem HQ-Run legal machen und Purge-Replacement-Fenster mit Runner-Choice für bis zu zwei Counterquellen erzeugen.
- [ ] Korp-Aktion zum Trash von Code Viral Cache mit Kosten und source-bound Revalidation ergänzen.
- [ ] Tests für Purge mit 0/1/2+ Counterquellen, manipulierte Counterziele, Korp-Trash, wrong-side/stale, PublicPayload und Replay ergänzen.

Akzeptanzkriterien
- [ ] Code Viral Cache verhindert genau den final vereinbarten Effekt, nicht zusätzlich einen fremden Damage-Pfad.
- [ ] Purge-Replacement erhält nur legale Counter und nur in der erlaubten Menge.
- [ ] Korp-Trash-Aktion ist kosten-, side- und stateVersion-validiert.
- [ ] Replay/StateHash bleibt für Purge, Trash und Noop stabil.

### onr_v1_181_the-springboard - The Springboard

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen
- Engine: The Springboard ist als installierte Resource mit `baseLink: 1` und generischem Trace-/Reveal-Support modelliert. Der lokale Snapshot beschreibt wie Signpost eine nach Bid-Reveal nutzbare +1-Link-Fähigkeit mit Einmal-pro-Trace-Grenze, nicht einen dauerhaft additiven Base-Link.
- Chronik: Trace-Payload kann Link-Endwerte zeigen, aber nicht die spezifische Nutzung oder Nichtnutzung von The Springboard.
- Tests: V1.9.14 prüft Trace-/Link-Tools im Paket. Es fehlt ein Springboard-Fokustest mit Resource-Installation, Paid-Ability-Timing, tagged Resource-Trash-Grenzen, Einmal-pro-Trace, wrong-side/stale und Replay.
- Hidden-Info/Replay/StateHash: Trace-Bids und die Nachbid-Entscheidung sind Timing- und Choice-sensibel. Als Resource kommt zusätzlich die Tag-trash-Interaktion hinzu: Nach Tag-State-Änderungen darf eine veraltete Springboard-Aktion nicht mehr ausführbar sein, wenn die Karte nicht mehr installiert ist.
- Fehlende Härtungen: Base-Link-vs-Paid-Ability-Drift, Sourcebindung, Tag-trash-Race, AI-Bid-Policy.

Notwendige Umsetzung
- [ ] The-Springboard-Vertrag gegen lokale Facts finalisieren und nicht gleichzeitig als statischen Base-Link und nachträgliche Paid-Ability behandeln.
- [ ] Falls Paid-Ability gilt, Trace-Subfenster mit Source-Auswahl, Kosten und Nutzungslimit modellieren.
- [ ] Tests für mehrere Linkquellen, getaggte Resource-Trash-Drift, falschen Timingpunkt, zweite Nutzung, wrong-side/stale und Replay ergänzen.
- [ ] AI-Hint auf den finalen Link-Wert und das Timing aktualisieren.

Akzeptanzkriterien
- [ ] The Springboard wirkt exakt im final festgelegten Trace-Vertrag.
- [ ] Die Karte muss installiert und aktuell kontrolliert sein, wenn die Link-Ability auflöst.
- [ ] PublicPayload nennt Linkquelle und Link-Delta, ohne private Strategieinformationen offenzulegen.
- [ ] Replay-StateHash ist für Nutzung und Nichtnutzung stabil.

### onr_v1_227_cerberus - Cerberus

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen
- Engine: Cerberus ist als ICE mit Trace 5, Tag, 1 Net Damage und End-the-run modelliert. Der lokale Snapshot beschreibt stärkere Net-Damage- und Cerberus-Counter-Folgen zu Run-Start plus Runner-Removal-Aktion. Die bestehende Runtime deckt den Trace/Damage/ETR-Kern, aber nicht den persistenten Counter-Loop.
- Chronik: Trace- und Damage-Payloads sind vorhanden; ein Counter-Add/Run-Start-Damage/Removal-Payload fehlt.
- Tests: V1.9.15 prüft ICE-Overlap, Trace und Damagefenster side-safe. Fehlend sind Cerberus-Counter bei erfolgreichem Trace, Start-of-run-Damage pro Counter, Runner-Entfernungsaktion, mehrere Counter, wrong-side/stale, Prevention-Interaktion und Replay über mehrere Runs.
- Hidden-Info/Replay/StateHash: Damage kann private Gripkarten treffen. Counter sind öffentlich; Removal-Aktionen müssen legalAction-only sein. Start-of-run-Trigger darf keine private Handinformation leaken.
- Fehlende Härtungen: Persistenter Counterstatus, Start-of-run-Trigger, Runner-Removal-Kosten, Damage-Amount-Drift.

Notwendige Umsetzung
- [ ] Lokalen Cerberus-Vertrag finalisieren: aktueller reduzierter Trace/Damage/ETR-Kern oder vollständiger Counter-Folgeeffekt.
- [ ] Bei vollständigem Vertrag: Trace-Erfolg legt source-bound Counter auf Runner/Identity; Start jedes Runs löst Counter-Damage aus.
- [ ] Runner-Aktion zum Entfernen eines Counters mit Kosten und Revalidation ergänzen.
- [ ] Tests für Trace-Erfolg/-Misserfolg, Counter-Damage, Removal, Prevention, wrong-side/stale, PublicPayload-Leakscan und Replay über mindestens zwei Runs ergänzen.

Akzeptanzkriterien
- [ ] Cerberus erzeugt nur nach erfolgreichem Trace den final vorgesehenen Folgezustand.
- [ ] Start-of-run-Damage skaliert exakt mit legalem Counterzustand.
- [ ] Getroffene Gripkarten bleiben in öffentlichen Payloads, PlayerViews, KI-Inputs und Replay-Vorschauen redigiert.
- [ ] Replay/StateHash bleibt über Trace, Counter, Damage und Removal stabil.

### onr_v1_250_ice-pick-willie - Ice Pick Willie

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen
- Engine: Die Runtime löst Ice Pick Willie als subroutinegebundenes öffentliches R&D-Top-Reveal aus. Der lokale Snapshot beschreibt hingegen Programm-Trash plus End-the-run. Es gibt damit eine hohe Wahrscheinlichkeit, dass ein alter Hidden-Zone-Stub die eigentliche ICE-Subroutine überdeckt.
- Chronik: Aktuell ist der Reveal-Payload hidden-zone-sicher. Für Programm-Trash braucht es sichtbare oder runner-private Zielwahl, Trash-Zusammenfassung und Subroutine-Index.
- Tests: V1.9.11 testet öffentliches R&D-Top-Reveal und Replay. Fehlend sind Program-Trash-Auswahl, No-program-Noop oder Pflichtauswahl, ETR-Sequenz, gebrochene Subroutine, wrong-side/stale, Zielmanipulation und Replay.
- Hidden-Info/Replay/StateHash: Installierte Runner-Programme sind öffentlich sichtbar; verdeckte R&D wäre nur im aktuellen Stub betroffen. Bei Korrektur muss der R&D-Reveal verschwinden, sofern nicht final beabsichtigt.
- Fehlende Härtungen: Effekt-Drift, Subroutine-Reihenfolge, Break-Revalidation, PublicPayload.

Notwendige Umsetzung
- [ ] Ice-Pick-Willie-Vertrag gegen lokale Facts finalisieren und falschen Reveal-Pfad entfernen, falls Programm-Trash/ETR führend ist.
- [ ] Subroutinen als Program-Trash und End-the-run modellieren, mit Zielwahl nur für installierte Runner-Programme.
- [ ] `applyAction` muss Subroutine-Index, Break-Status, Zielzone, Side und StateVersion prüfen.
- [ ] Tests für gebrochene/ungebrochene Subroutinen, keine Programme, mehrere Programme, Zielmanipulation, wrong-side/stale und Replay ergänzen.

Akzeptanzkriterien
- [ ] Ice Pick Willie führt exakt den finalen Subroutinevertrag aus.
- [ ] Es gibt keinen R&D-Top-Reveal-Leak, falls dieser nicht mehr zum Vertrag gehört.
- [ ] Program-Trash nennt Quelle und Zieldefinition öffentlich, ohne interne Instance-Details unnötig zu leaken.
- [ ] Replay-StateHash bleibt für Trash und ETR stabil.

### onr_v1_345_trap - TRAP!

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen
- Engine: TRAP! ist als Access-Ambush umgesetzt, triggert aus legalem Access-Fenster, fügt Tag hinzu und verursacht Net Damage. Der lokale Snapshot beschreibt zusätzliche Kosten-/Zonenbedingungen: Korp zahlt 0, nicht aus Archives, bei R&D-Access muss Runner die Karte zeigen. Der bestehende Test prüft nur den allgemeinen Remote-Access-Ambush.
- Chronik: Access-Ambush-Payload enthält Definition, Damage-Typ, Amount, Tag-Zusatz und Hidden-Zone-Barriere. Es fehlt ein Nachweis für R&D-Reveal, Archives-Noop, optionale Korp-Kostenentscheidung und "nicht installiert"-Access.
- Tests: V1.9.17 prüft Setup/TRAP remote, Hidden-Payload-Leak und Replay. Fehlend sind R&D-Access, Archives-Access, HQ/Remote-uninstalled-Konstellation, Korp-Entscheidung, wrong-side/stale, Prevention-Interaktion und PublicPayload-Leakscan für Zugriff aus verdeckten Zonen.
- Hidden-Info/Replay/StateHash: Sehr hoch, weil R&D/HQ-Access verdeckte Korpkarten betrifft. TRAP! darf nur nach tatsächlich legalem Access identifiziert werden; vor Access darf kein Action-/Payload-Hinweis die Karte verraten.
- Fehlende Härtungen: Zone-spezifische Ambush-Regeln, R&D-Reveal-Payload, Archives-Noop, Korp-Choice-Revalidation.

Notwendige Umsetzung
- [ ] TRAP!-Resolver auf alle erlaubten Access-Zonen prüfen: Remote/HQ/R&D aktiv, Archives gemäß lokalem Vertrag inaktiv.
- [ ] Korp-Entscheidung/Kostenfenster modellieren, falls die lokale "pay 0"-Formulierung als echte Choice gilt.
- [ ] R&D-Access muss die Karte erst im Access-Fenster offenlegen und dann Ambush-Payload redigiert publizieren.
- [ ] Tests für Remote, R&D, Archives, nicht installierte Access-Situation, Noop/Decline, wrong-side/stale, Damage-Prevention und Replay ergänzen.

Akzeptanzkriterien
- [ ] TRAP! triggert nur aus legalem Access und nur in den final erlaubten Zonen.
- [ ] Vor dem Access gibt es keinen Identitätsleak in LegalActions, PlayerViews, KI-Inputs oder Reconnect-Payloads.
- [ ] Damage, Tag und optionale Kosten sind source-bound und revalidiert.
- [ ] Replay-StateHash bleibt für Trigger-, Noop- und Prevention-Branches stabil.

### onr_v1_365_paris-city-grid - Paris City Grid

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen
- Engine: Paris City Grid ist als rezzed City-Grid-Upgrade mit Trace-2-Tag-Aktion implementiert. Der lokale Snapshot beschreibt einen Trace-Credit-Pool für Traces während Runs auf diesem Fort, inklusive Refresh zu Beginn des nächsten Korp-Zugs. Der Runtime-Pfad ist damit eher ein generischer Tag-Trace als der lokale servergebundene Kreditpool.
- Chronik: Trace-Payload zeigt baseTraceStrength und Source. Es fehlt Payload für Pool-Bestand, Verbrauch, Serverbindung und Refresh.
- Tests: V1.9.18 prüft eine Paris-Trace-Aktion, Region-Replacement und Replay. Fehlend sind Run-gebundene Tracekosten aus Pool, andere Server, mehrere Traces im selben Fort, Pool-Verbrauch/Refresh, Rez/Install-Region-Regel, wrong-side/stale und AI-Bid-Policy.
- Hidden-Info/Replay/StateHash: Kein Hidden-Zone-Kern, aber Trace-Bids und servergebundene Quelle müssen öffentlich nachvollziehbar sein. Poolverbrauch muss StateHash-stabil und nicht mit allgemeinen Korp-Credits vermischt sein.
- Fehlende Härtungen: Effekt-Drift, Counter/Pool-State, Serverbindung, Turnstart-Refresh, Kostenquellen-Priorität.

Notwendige Umsetzung
- [ ] Finalen Vertrag entscheiden: aktuelle Trace-2-Tag-Aktion oder lokaler Trace-Pool während Runs auf diesem Fort.
- [ ] Bei lokalem Vertrag: Pool-Counter bei Rez setzen, nur für Tracekosten während Runs auf diesem Fort ausgeben und zu Beginn des nächsten Korp-Zugs refreshen.
- [ ] LegalAction-/Payment-Modell muss Poolquelle, allgemeine Credits, Serverbindung und Trace-ID erneut validieren.
- [ ] Tests für Poolverbrauch, Refresh, falschen Server, mehrere Traces, leeren Pool, wrong-side/stale, PublicPayload und Replay ergänzen.

Akzeptanzkriterien
- [ ] Paris City Grid wirkt nur im finalen servergebundenen Trace-Vertrag.
- [ ] Poolverbrauch und Refresh sind source-bound, öffentlich nachvollziehbar und StateHash-stabil.
- [ ] Falscher Server oder veraltete Trace-ID kann keine Poolcredits ausgeben.
- [ ] AI-Hint bewertet die Karte nach dem tatsächlichen Vertrag.

## Gesamtplan

1. Vertragsscheren zuerst klären: Deal with Militech, Hunt Club BBS, Sneak Preview, Code Viral Cache, Ice Pick Willie und Paris City Grid zeigen besonders starke Drift zwischen generischem Runtime-Pfad und lokalem Snapshot/Funktionsmatrix-Vertrag.
2. Trace-/Link-Fenster härten: Signpost und The Springboard brauchen eine Entscheidung zwischen statischem Linkwert und nach Bid-Reveal nutzbarer Paid-Ability. Danach LegalAction/applyAction, PublicPayload und AI-Hints synchronisieren.
3. Hidden-Info-Pfade einzeln absichern: Stack-/R&D-/Access-Zonen bei Deal with Militech, Hunt Club BBS, Sneak Preview, Ice Pick Willie und TRAP! mit PlayerView-, PublicEvent-, Reconnect-, Replay- und KI-Input-Leakscans prüfen.
4. Persistente Zustände ergänzen: Code Viral Cache, Cerberus und Paris City Grid benötigen Counter-/Pool-/Turnstart-Zustände mit klarer Sourcebindung, Kostenvalidierung und StateHash-Replay.
5. Danach Manifest-/Mechanics-/AI-Artefakte nur für tatsächlich geänderte Verträge nachziehen. Keine neue Karte promoten; alle zehn Karten sind bereits decklegal und ai-supported.

## Empfohlene Checks

- corepack pnpm --filter @netgrid/engine test
- corepack pnpm --filter @netgrid/ai test
- corepack pnpm --filter @netgrid/catalog test
- corepack pnpm typecheck
