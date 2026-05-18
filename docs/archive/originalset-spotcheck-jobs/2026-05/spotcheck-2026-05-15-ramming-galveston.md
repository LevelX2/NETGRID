---
jobId: spotcheck-2026-05-15-ramming-galveston
status: done
createdAt: 2026-05-15T01:10:43+01:00
startedAt: 2026-05-15T01:46:24+02:00
completedAt: 2026-05-15T02:10:00+02:00
requiresImplementation: true
priority: normal
checks:
  - command: corepack pnpm --filter @netgrid/engine test
    result: pass
  - command: corepack pnpm --filter @netgrid/web test -- chronicle.test.ts
    result: pass
  - command: corepack pnpm --filter @netgrid/catalog test
    result: pass
  - command: corepack pnpm typecheck
    result: pass
commit: same_commit_as_report
cards:
  - cardId: onr_v1_053_ramming-piston
    title: Ramming Piston
  - cardId: onr_v1_064_skivviss
    title: Skivviss
  - cardId: onr_v1_080_core-command-jettison-ice
    title: "Core Command: Jettison Ice"
  - cardId: onr_v1_118_weather-to-finance-pipe
    title: Weather-to-Finance Pipe
  - cardId: onr_v1_123_bodyweight-data-creche
    title: "Bodyweight™ Data Crèche"
  - cardId: onr_v1_174_rigged-investments
    title: Rigged Investments
  - cardId: onr_v1_177_the-short-circuit
    title: The Short Circuit
  - cardId: onr_v1_236_data-raven
    title: Data Raven
  - cardId: onr_v1_323_experimental-ai
    title: Experimental AI
  - cardId: onr_v1_362_new-galveston-city-grid
    title: New Galveston City Grid
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-ramming-galveston

## Auswahlprüfung

- Geprüfte Register und Jobverzeichnisse: `docs/reviews/originalset-spotchecks/register.md`, `data/reports/originalset-card-spotcheck-register.json`, `docs/derived/originalset-spotcheck-jobs/inbox/`, `docs/derived/originalset-spotcheck-jobs/in_progress/`, `docs/archive/originalset-spotcheck-jobs/2026-05/`, `docs/derived/originalset-spotcheck-jobs/blocked/`.
- Vorhandene Jobberichte: `docs/archive/originalset-spotcheck-jobs/2026-05/spotcheck-2026-05-15-netwatch-spinn.md`.
- Ausgeschlossene Quellen/Karten zusammengefasst: 30 bereits nachgetestete oder reservierte Card IDs aus den Runden `2026-05-14-A`, `2026-05-14-B` und `2026-05-15-netwatch-spinn`, darunter `onr_v1_216_security-purge`, `onr_v1_255_mastiff`, `onr_v1_289_edgerunner-inc-temps`, `onr_v1_117_valu-pak-software-bundle`, `onr_v1_009_butcher-boy`, `onr_v1_020_dupre`, `onr_v1_078_arasaka-owns-you`, `onr_v1_241_fang-2-0`, `onr_v1_207_netwatch-operations-office`, `onr_v1_200_encryption-breakthrough`, `onr_v1_236_data-raven` war in keinem dieser Pflichtquellen-Register als Nachtestkarte enthalten.
- Auswahlbasis: lokale Originalset-Katalog-/Snapshotdaten, Deck-Legal-AI-Approval-Manifeste und Release-Manifeste ergaben 341 nicht tabuierte decklegale Kandidaten; daraus wurde ein komplexerer Pool von 154 Karten mit Timing-, Choice-, Hidden-Zone-, Counter-, Run-, Access-, Trace- oder Replay-Relevanz gebildet.
- Auswahlbegründung: zufällige 10er-Stichprobe aus dem komplexeren Pool. Die Karten decken Breaker/Stealth-Kosten, Virus-/Counter-Start-of-turn, erfolgreiche Run-Folgeeffekte, HQ-Run-Conditionals, Hardware-Deck-Sonderregeln, Hidden-Zone-Suche, Trace-Persistent-Tagging, Access-Ambush-Targeting und servergebundene Region-/Trashkosten-Modifikatoren ab.

## Kartenbefunde

### onr_v1_053_ramming-piston - Ramming Piston

Bewertung:
- Engine: Der lokale Kartentext beschreibt einen Wall-Breaker mit `[2]: Break wall subroutine`, `[1]: +1 strength` und verpflichtendem Verlust von insgesamt `[2]` aus Stealth-Karten nach jedem gebrochenen Wall-Subroutine. Die Runtime-Definition in `packages/shared/src/index.ts` ist dagegen nur ein generischer Trace-/Link-/Bid-Support-Programmstub mit Stärke 5 und ohne Wall-Break-, Pump-, Noisy- oder Stealth-Kostenpfad. In `packages/engine/src/index.test.ts` erscheint die Karte nur in Release-/Decklisten, nicht als spezifischer Encounter-Test.
- Chronik: Es gibt keine erkennbare PublicPayload-Spur für Ramming-Piston-Pump, Wall-Break oder Stealth-Zahlungsverteilung.
- Tests: Fehlend sind fokussierte Engine-Tests für Install, Pump, Wall-only-Break, Pflichtkosten aus Stealth-Quellen, Wrong-Side/Stale-Revalidation und Replay/StateHash.
- Hidden-Info/Replay/StateHash: Die Karte selbst betrifft offene Rig-/ICE-Informationen; Risiko liegt in inkorrekter Zielprojektion und in nicht deterministisch dokumentierter Verteilung der Stealth-Kosten.
- Fehlende Härtungen: `LegalActions` dürfen Break nur im Encounter gegen Wall-Subroutines anbieten; `applyAction` muss ICE-Subtype, Subroutine-State, Kosten, Side, StateVersion und verfügbare Stealth-Ressourcen erneut prüfen.

Notwendige Umsetzung:
- [ ] Runtime-Definition auf echten Wall-Icebreaker-Vertrag korrigieren: Installkosten, MU, Pump `[1]`, Break-Wall `[2]`, Noisy/Stealth-Folgekosten nach jedem erfolgreichen Break.
- [ ] Stealth-Zahlung als explizite Choice modellieren, wenn mehrere Stealth-Quellen verfügbar sind; bei eindeutiger Quelle deterministisch automatisch abbuchen.
- [ ] Break-LegalAction nur aus sichtbarem Encounter-State ableiten und in `applyAction` gegen Wall-Subtype, ungebrochene Subroutine, Runner-Credits, Stealth-Ressourcen und StateVersion revalidieren.
- [ ] PublicPayload für Pump, Break und Stealth-Zahlung ergänzen: Quelle, Ziel-ICE, Subroutine-ID, gezahlte Credits, gezahlte Stealth-Beträge, verbleibende Counter ohne private Zonen.
- [ ] AI-Hint von Trace/Link-Rolle auf Wall-Breaker mit Stealth-Kostenrisiko korrigieren.

Akzeptanzkriterien:
- [ ] Ramming Piston kann Wall-Subroutines brechen und Nicht-Wall-Subroutines nicht.
- [ ] Nach jedem Wall-Break werden exakt 2 Stealth-Credits/Counter aus legalen Stealth-Quellen entfernt oder der Break ist nicht legal.
- [ ] Wrong-Side-, Stale-, Illegal-Target- und Insufficient-Cost-Pfade liefern kontrollierte Fehler.
- [ ] ReplayEvents rekonstruiert Pump, Break und Stealth-Zahlung bytegleich im StateHash.
- [ ] PublicEvents und PlayerViews enthalten keine HQ/R&D/Hand-/Stackdetails.

### onr_v1_064_skivviss - Skivviss

Bewertung:
- Engine: Der lokale Kartentext sagt: erfolgreicher Run auf R&D gibt der Korp einen Skivviss-Counter; jeder Counter zwingt die Korp am Zugstart zu einem zusätzlichen Draw; Virus-Purge bleibt Korp-Aktionsverzicht. Die Runtime-Definition modelliert dagegen beim Installieren 1 Virus-Counter und 1 recurring credit für Run-Kosten. Der V1.9.12-Test prüft Recurring-Credit-Refresh, nicht den R&D-Erfolgsrun, Corp-Counter oder zusätzlichen Draw.
- Chronik: Keine spezifische Chronik für Skivviss-Counter beim erfolgreichen R&D-Run und keine Start-of-turn-Draw-Payload je Counter.
- Tests: Fehlend sind R&D-Success-Trigger, Nicht-R&D-Negativfall, mehrere Counter, Corp-Start-of-turn-Extra-Draw, Purge-Entfernung und Replay/StateHash.
- Hidden-Info/Replay/StateHash: Extra-Draw betrifft verdeckte R&D-Karten; PublicPayload darf nur Draw-Anzahl und Counterstand zeigen, nicht Card IDs oder Titel.
- Fehlende Härtungen: Trigger muss aus erfolgreichem R&D-Run kommen, nicht aus Install. Purge darf Skivviss-Counter als Virus-Counter entfernen, darf aber keine Recurring-Pools erzeugen.

Notwendige Umsetzung:
- [ ] Skivviss-Definition von Recurring-Credit-Stub auf Virus-Programm mit erfolgreichem-R&D-Run-Trigger umstellen.
- [ ] Beim erfolgreichen R&D-Run einen öffentlichen Skivviss-/Virus-Counter auf der installierten Quelle oder einem eindeutig referenzierten Corp-Persistent-State erzeugen.
- [ ] Corp-Start-of-turn-Draw um Counteranzahl erhöhen und den Effekt deterministisch vor/nach normalem Draw nach bestehender Timing-Konvention festlegen.
- [ ] Purge entfernt die Skivviss-Counter; keine Runner-Recurring-Credits für Skivviss anlegen oder refreshen.
- [ ] AI-Hints von Economy/Recurring auf R&D-pressure/Virus-Persistence korrigieren.

Akzeptanzkriterien:
- [ ] Erfolgreicher R&D-Run mit installierter Skivviss erzeugt exakt einen Counter; HQ/Archives/Remote-Erfolge tun es nicht.
- [ ] Corp zieht am Start ihres Zuges normal plus Counteranzahl zusätzliche Karten; PublicPayload nennt nur Anzahl und Counterstand.
- [ ] Purge entfernt Skivviss-Counter und ist Wrong-Side/Stale-sicher.
- [ ] Replay/StateHash ist mit mehreren Countern stabil.
- [ ] Bestehende V1.9.12-Counter-/Purge-Tests bleiben grün, aber Skivviss wird nicht mehr als Run-Cost-Recurring-Quelle gezählt.

### onr_v1_080_core-command-jettison-ice - Core Command: Jettison Ice

Bewertung:
- Engine: Der Kernpfad ist weitgehend vorhanden: erfolgreiche-HQ-Run-Flag, nur danach LegalAction, öffentliche Target-Choice auf bezahlbare gerezzte ICE, Zahlung der Rez-Kosten und Trash nach Archives. Wrong-Side/Stale, PublicPayload und Replay/StateHash sind in einem fokussierten Test abgedeckt.
- Chronik: PublicPayload benennt Ability, Rez-Kosten, Zieldefinition, Serverlabel und Trash-Anzahl. Das ist grundsätzlich gut.
- Tests: Fehlend sind Negativ-/Race-Pfade nach geöffneter Choice: Ziel wird derezzed/getrasht, Runner-Credits sinken unter Rez-Kosten, Ziel ist nicht mehr installiert, neuer StateVersion-Konflikt sowie Auswahl nicht bezahlbarer gerezzter ICE.
- Hidden-Info/Replay/StateHash: Ziele sind gerezzte installierte ICE und damit öffentlich; Serverlabel ist zulässig. Hidden-Info-Risiko ist niedrig, solange unrezzed ICE nicht als Option auftaucht.
- Fehlende Härtungen: Choice-Resolver prüft rezzed/installiert und Credits erneut; zusätzlich sollte ein Test beweisen, dass die Optionliste nur bezahlbare öffentliche rezzed ICE enthält und nach State-Drift nicht stale akzeptiert wird.

Notwendige Umsetzung:
- [ ] Ergänze Tests für unbezahlbare gerezzte ICE: keine Option und keine LegalAction, wenn kein bezahlbares Ziel existiert.
- [ ] Ergänze Choice-Race-Tests: Ziel vor Resolve derezzed/getrasht oder Runner-Credits reduziert; `applyAction`/Choice-Resolve muss kontrolliert ablehnen.
- [ ] Ergänze PublicPayload-Erwartung für `rezCostPaid` und `runnerCreditsAfter`, nicht nur Ziel/Trash.
- [ ] Prüfe, ob der erfolgreiche-HQ-Run-Flag am Zugende und nach Stale-Replay sicher gelöscht bleibt.

Akzeptanzkriterien:
- [ ] Nach erfolgreichem HQ-Run kann Core Command genau eine bezahlbare gerezzte installierte ICE wählen und trasht sie gegen Rez-Kosten.
- [ ] Vor erfolgreichem HQ-Run, nach Zugwechsel, bei zu wenig Credits oder bei nicht mehr gerezztem Ziel gibt es keine erfolgreiche Auflösung.
- [ ] PublicPayload bleibt ohne private CardInstances, HQ- oder R&D-Inhalte.
- [ ] Replay/StateHash bleibt für Erfolg und abgelehnte Race-Pfade stabil.

### onr_v1_118_weather-to-finance-pipe - Weather-to-Finance Pipe

Bewertung:
- Engine: Der implementierte Kernpfad startet einen HQ-Run und ersetzt bei Erfolg den HQ-Access durch Korp-Creditverlust 4. Ein Test prüft den erfolgreichen Sofortpfad und dass der Run danach beendet ist. Die Runtime-Payload setzt `hiddenZoneBarrier: true`, obwohl die Karte gerade keinen Access ausführt; das ist als Schutz erklärbar, sollte aber chronikseitig eindeutig als Access-Replacement lesbar sein.
- Chronik: Bisher wird nur grob `actionType: play_event` erwartet. Für Umsetzung/Replay-Diagnose fehlt eine feste Erwartung auf Server, Access-Replacement und Creditverlust.
- Tests: Fehlend sind Wrong-Side/Stale, HQ-only-Serverwahl, nicht erfolgreicher Run, kein HQ-Access/keine Access-Queue und kein Leak von HQ-Karten.
- Hidden-Info/Replay/StateHash: Hohe Relevanz, weil die Karte explizit HQ-Access ersetzt. Kein Card-ID-/Titel-Leak aus HQ darf in PublicPayload, PlayerView, Replay oder Chronik entstehen.
- Fehlende Härtungen: `applyAction` muss serverId HQ, StateVersion, Timing und Eventkosten erneut prüfen; der Access-Replacement-State muss bei Runende sauber entfernt werden.

Notwendige Umsetzung:
- [ ] Fokussierten Test für HQ-only LegalAction und `applyAction`-Revalidation ergänzen.
- [ ] Teste einen misslungenen HQ-Run: kein Creditverlust, kein HQ-Access, Replacement-State wird bereinigt.
- [ ] PublicPayload auf `serverId: hq`, `accessReplacement: corp_lose_credits`, `creditLoss: 4`, Credits danach und `hiddenZoneBarrier` prüfen.
- [ ] Sicherstellen, dass keine HQ-Karten-IDs oder -Titel in PublicEvents, PlayerViews, Replays oder Fehlertexten erscheinen.

Akzeptanzkriterien:
- [ ] Erfolgreicher HQ-Run über Weather-to-Finance Pipe verursacht exakt 4 Creditverlust und keinen HQ-Access.
- [ ] Andere Server sind nicht wählbar; falsche Seite und stale State werden abgelehnt.
- [ ] Misslungener Run verursacht keinen Creditverlust und lässt keinen hängenden Replacement-State zurück.
- [ ] Replay/StateHash bleibt stabil; PublicPayload ist chronikfähig und hidden-info-sicher.

### onr_v1_123_bodyweight-data-creche - Bodyweight™ Data Crèche

Bewertung:
- Engine: Die lokale Faktenbasis nennt Installkosten 3, +1 MU, Deck-Einzigartigkeit und einmal pro Zug unmittelbar nach erfolgreichem Run einen zusätzlichen Run ohne Aktion. Die Runtime-Definition ist nur ein Hardware-/Memory-/Per-card-Longtail-Install-Stub mit Installkosten 0; der Test deckt Installation, Wrong-Side/Stale, Sichtbarkeit und Replay ab, aber nicht Deck-Einzigartigkeit oder den Extra-Run-Trigger.
- Chronik: Keine spezifische Chronik für Deck-Replacement, erfolgreichen Run als Trigger oder kostenlosen Extra-Run.
- Tests: Fehlend sind Installkosten 3, MU-Bonus, nur ein Deck in play, älteres Deck trashen, einmal pro Zug Extra-Run-Choice direkt nach erfolgreichem Run, kein Trigger bei erfolglosem Run und kein Actionverbrauch.
- Hidden-Info/Replay/StateHash: Extra-Run selbst ist öffentlich; Risiko entsteht bei erfolgreichen Runs auf verdeckte Server, wenn der Trigger Card IDs aus Access-Kontext mitschleppt. PublicPayload darf nur Triggerquelle und gewählten Server nennen.
- Fehlende Härtungen: Timingfenster "right after successful run" muss ablaufen, wenn der Runner ablehnt oder einen anderen Timingpunkt erreicht; `applyAction` muss Once-per-turn und StateVersion revalidieren.

Notwendige Umsetzung:
- [ ] Runtime-Definition auf Installkosten 3, +1 MU und Deck-Subtype/-Einzigartigkeit korrigieren.
- [ ] Beim Installieren ältere Runner-Deck-Hardware deterministisch trashen; PublicPayload nennt alte/neue Definitionen, keine privaten Zonen.
- [ ] Nach erfolgreichem Run eine Runner-Choice für kostenlosen Extra-Run öffnen; keine Aktion verbrauchen, einmal pro Runner-Zug.
- [ ] Choice beim Ablehnen, nach Nutzung und am Zugende löschen.
- [ ] AI-Hint um Extra-Run-Tempo und Deck-Einzigartigkeit ergänzen.

Akzeptanzkriterien:
- [ ] Installation kostet 3, erhöht MU um 1 und hält maximal ein Deck im Rig.
- [ ] Erfolgreicher Run öffnet genau einmal pro Zug eine side-sichere Extra-Run-Choice; erfolgloser Run nicht.
- [ ] Extra-Run verbraucht keine Runner-Aktion, wählt nur legale Server und wird in `applyAction` revalidiert.
- [ ] PublicPayload enthält keine accessed Card IDs/Titel; Replay/StateHash bleibt stabil.

### onr_v1_174_rigged-investments - Rigged Investments

Bewertung:
- Engine: Der lokale Kartentext beschreibt 6 Bits auf der Ressource, am Start jedes Runner-Zugs 1 Bit nehmen, nach Entfernen aller Bits trashen. Die Runtime modelliert stattdessen 2 recurring credits für Run-Kosten mit Refresh am Runner-Zugstart. Der V1.9.12-Test prüft genau diesen Recurring-Pool und damit den falschen Vertrag.
- Chronik: Keine Chronik für Bank-Bits, Start-of-turn-Transfer, Depletion und Auto-Trash.
- Tests: Fehlend sind Install-Counter 6, automatischer Start-of-turn-Gain 1, kein Refresh/keine Akkumulation über 6 hinaus, Auto-Trash nach letztem Bit, Purge-Nichtinteraktion und Replay/StateHash.
- Hidden-Info/Replay/StateHash: Keine verdeckten Zonen; deterministische Start-of-turn-Reihenfolge und PublicPayload sind wichtig.
- Fehlende Härtungen: Bestehende Recurring-Credit-Helfer dürfen Rigged Investments nicht mehr als Run-Kostenquelle erfassen.

Notwendige Umsetzung:
- [ ] Runtime-Definition von `recurringCredits: 2` auf `power`/`credit`-Counter-Depot mit 6 Start-Countern umstellen.
- [ ] Runner-Start-of-turn-Trigger: 1 Counter entfernen, Runner +1 Credit, bei 0 Countern Ressource trashen.
- [ ] Purge und Recurring-Credit-Refresh dürfen Rigged Investments nicht beeinflussen.
- [ ] PublicPayload für Start-of-turn-Transfer und Auto-Trash ergänzen.
- [ ] AI-Hint von Recurring-Run-Kosten auf langsame Economy-Resource korrigieren.

Akzeptanzkriterien:
- [ ] Beim Installieren liegen exakt 6 Bits/Counter auf Rigged Investments.
- [ ] Jeder Runner-Zugstart transferiert genau 1 Credit an den Runner und reduziert den Counterstand.
- [ ] Bei 0 Countern wird Rigged Investments deterministisch getrasht.
- [ ] Die Karte taucht nicht in Recurring-Credit-Summen für Run-Kosten auf.
- [ ] PublicPayload und Replay/StateHash sind stabil.

### onr_v1_177_the-short-circuit - The Short Circuit

Bewertung:
- Engine: Der lokale Kartentext ist `[A], [T]: Search your stack for a program. Show that program to the Corp, and then bring it into your hand. Reshuffle your stack afterwards.` Die Runtime-Definition ist nur ein installierter Hidden-Zone-Helfer "reveal the top card of your stack"; der V1.9.11-Test deckt generische Hidden-Zone-Mechaniken, aber keinen Short-Circuit-spezifischen Search/Trash-Pfad.
- Chronik: Keine spezifische PublicPayload für Suchauslösung, offengelegtes Programm, Shuffle und Trash der Ressource.
- Tests: Fehlend sind installierte Ressourcenaktion mit Aktionskosten, Trash-Kosten `[T]`, private Stack-Programmauswahl, Corp sieht nur die offengelegte Karte, deterministischer Shuffle, leerer/programmfreier Stack und Wrong-Side/Stale.
- Hidden-Info/Replay/StateHash: Sehr hohe Relevanz: Runner-Choice darf private Stack-Inhalte nur dem Runner zeigen; Corp/Public dürfen erst nach Auswahl genau das gezeigte Programm erfahren.
- Fehlende Härtungen: `applyAction` muss installierte Quelle, ungetrashten Zustand, Runner-Aktion, Stack-Inhalt, Choice-StateVersion und gewählte Program-Card-ID prüfen.

Notwendige Umsetzung:
- [ ] Runtime-Definition auf installierte Resource-Action `[A], trash source` umstellen.
- [ ] Private Runner-PendingChoice mit nur Programmen aus dem Stack öffnen; Corp-View ohne Optionen.
- [ ] Nach Auswahl Programm in Grip legen, genau diese Definition öffentlich revealen, Quelle trashen und Stack deterministisch shufflen.
- [ ] Negativpfad ohne Programme im Stack: keine LegalAction oder kontrolliert abgelehnte Choice.
- [ ] AI-Hint auf installierte Tutor-Resource mit Hidden-Zone-Leak-Grenze korrigieren.

Akzeptanzkriterien:
- [ ] Runner kann The Short Circuit nur installiert und mit verfügbarer Aktion nutzen; Quelle wird danach getrasht.
- [ ] Runner sieht private Programmauswahl; Corp/Public sehen vor Auswahl keine Stackinhalte.
- [ ] Nach Auswahl ist genau das gewählte Programm in der Grip und in PublicPayload/Chronik benannt.
- [ ] Shuffle ist replay-/StateHash-stabil.
- [ ] Wrong-Side, Stale, falsches Ziel und leerer Stack sind getestet.

### onr_v1_236_data-raven - Data Raven

Bewertung:
- Engine: Trace-Subroutine, Tag, Data-Raven-Counter und Start-of-turn-Tag sind in einem fokussierten Test vorhanden. Die Shared-Subroutine beschreibt den Trace-Success nur als `add_tag`; der Counter-/Startturn-Pfad scheint über Sonderlogik zu laufen. Es fehlt der gedruckte Runner-Removal-Pfad: Runner darf einen Data-Raven-Counter durch Aktion und Zahlung von 1 entfernen.
- Chronik: Der vorhandene Test prüft Counter/Tag, aber keine PublicPayload-Erwartung für Trace-Erfolg, Counterplatzierung, Start-of-turn-Tag oder Counter-Removal.
- Tests: Fehlend sind Runner-Removal-LegalAction, Kosten-/Aktionsverbrauch, mehrere Counter, Removal bis 0, Wrong-Side/Stale, zu wenig Credits, Counterquelle nicht mehr rezzed/installiert und Replay/StateHash für Start-of-turn plus Removal.
- Hidden-Info/Replay/StateHash: ICE und Counter sind öffentlich; kein Hidden-Info-Risiko bei korrekter Payload. Timing- und StateHash-Risiko liegt in Start-of-turn-Tags und Counterentfernung.
- Fehlende Härtungen: `applyAction` muss Data-Raven-Ziel, Counterstand, Runner-Aktion, Creditkosten, Side und StateVersion erneut prüfen.

Notwendige Umsetzung:
- [ ] Runner-LegalAction zum Entfernen eines Data-Raven-Counters modellieren: `[A], pay 1`, nur bei sichtbarem Data Raven mit Counter.
- [ ] Choice/Zielpfad für mehrere Data Raven im Board bereitstellen oder bei eindeutigem Ziel direkte Action anbieten.
- [ ] PublicPayload für Trace-Erfolg, Counterstand, Start-of-turn-Tag und Runner-Removal ergänzen.
- [ ] Tests für mehrere Counter und mehrere Data Raven ergänzen.
- [ ] AI-Hints um Removal-/Persistent-Tag-Risiko ergänzen.

Akzeptanzkriterien:
- [ ] Erfolgreicher Trace gibt Tag und legt genau einen Data-Raven-Counter.
- [ ] Jeder Runner-Zugstart gibt Tags entsprechend Counterstand oder nach lokalem Vertrag genau pro Counter; der Vertrag ist im Test festgeschrieben.
- [ ] Runner kann pro Aktion und 1 Credit genau einen Counter entfernen; bei 0 Countern, falscher Seite, stale State oder zu wenig Credits schlägt die Aktion kontrolliert fehl.
- [ ] PublicPayload bleibt ohne private Zonen und Replay/StateHash ist stabil.

### onr_v1_323_experimental-ai - Experimental AI

Bewertung:
- Engine: Der lokale Text erlaubt Advancement vor/nach Rez und triggert beim Access: ein installiertes Programm pro Advancement-Counter trashen. Der vorhandene Test trasht ein installiertes Programm beim Access und prüft PublicPayload, aber er belegt nicht, dass die Anzahl an Advancement-Countern die Anzahl der getrashten Programme steuert. Es ist unklar, ob mehrere Programme, null Counter und Target-Choice korrekt behandelt werden.
- Chronik: PublicPayload benennt AmbushDefinition und ein getrashtes Programm; für mehrere Ziele/Counter fehlt eine stabile Payload-Erwartung mit Count und Zieldefinitionen.
- Tests: Fehlend sind 0/1/2+ Advancement-Counter, mehrere installierte Programme, weniger Programme als Counter, Zielwahl falls nötig, Advance-before-rez/after-rez und Replay/StateHash.
- Hidden-Info/Replay/StateHash: Installierte Runner-Programme sind öffentlich; Zielauswahl darf keine Hand-/Stackinformationen enthalten. Determinismus ist wichtig, wenn mehrere Programme automatisch gewählt oder per Choice gewählt werden.
- Fehlende Härtungen: Access-Ambush muss nur im Access-Fenster auslösen; `applyAction`/Choice muss Counterstand, installierte Programme, Runner-Choice und StateVersion revalidieren.

Notwendige Umsetzung:
- [ ] Advancement-Counter-Anzahl als Trash-Anzahl verwenden; bei 0 Counter kein Programm trashen.
- [ ] Bei mehreren möglichen Programmen private/öffentliche Ziel-Choice nach Projektkonvention festlegen; da installierte Programme öffentlich sind, darf die Choice öffentlich sein, muss aber side-sicher bleiben.
- [ ] Anzahl der getrashten Programme auf verfügbare installierte Programme begrenzen.
- [ ] PublicPayload mit `ambushDefinitionId`, `advancementCounterCount`, `trashedCount` und Zieldefinitionen ergänzen.
- [ ] Tests für Advance vor und nach Rez ergänzen.

Akzeptanzkriterien:
- [ ] Experimental AI kann legal avanciert werden, bevor und nachdem es gerezzed ist.
- [ ] Beim Access werden exakt min(Advancement-Counter, installierte Runner-Programme) Programme getrasht.
- [ ] Bei mehreren Zielprogrammen ist die Zielwahl LegalAction-/Choice-basiert und stale-sicher.
- [ ] PublicPayload enthält nur installierte öffentliche Programmdefinitionen, keine Grip-/Stackdaten.
- [ ] Replay/StateHash ist für 0, 1 und mehrere Counter stabil.

### onr_v1_362_new-galveston-city-grid - New Galveston City Grid

Bewertung:
- Engine: Der lokale Kartentext erhöht die Trashkosten aller Nodes und anderen Upgrades in diesem Fort um 2 und enthält die Region-Regel. Die Runtime-Definition beschreibt dagegen einen hidden-zone reveal surface; der V1.9.18-Test nutzt New Galveston City Grid als R&D-Top-Reveal-Action. Das wirkt wie ein deutlicher Kartenvertragsdrift.
- Chronik: Vorhandene Chronik deckt Hidden-Zone-Reveal ab, aber nicht Trashkosten-Modifikation, Serverbindung oder Region-Einzigartigkeit.
- Tests: Fehlend sind Trashkosten +2 für Nodes/andere Upgrades im gleichen Fort, keine Erhöhung für New Galveston selbst oder andere Server, Runner-Trash-Kosten-Revalidation, Region-Install/Rez-Regel, ältere Region trashen und Replay/StateHash.
- Hidden-Info/Replay/StateHash: Eigentliche Karte braucht keine Hidden-Zone-Reveal-Daten. Die aktuelle Reveal-Funktion hat unnötiges Hidden-Info-Risiko und sollte entweder entfernt oder einer anderen Karte zugeordnet werden.
- Fehlende Härtungen: Trashkostenberechnung muss servergebunden, rezzed-abhängig und in `applyAction` erneut geprüft sein.

Notwendige Umsetzung:
- [ ] Runtime-Definition auf servergebundenen Trashkosten-Modifikator korrigieren: Nodes und andere Upgrades in diesem Fort kosten +2 zu trashen.
- [ ] Hidden-Zone-Reveal-Fähigkeit von New Galveston entfernen oder auf die korrekte Karte verschieben; Tests entsprechend anpassen.
- [ ] Region-Regel implementieren/verifizieren: beim Install/Rez nur eine Region pro Fort; ältere Region wird nach bestehender Konvention getrasht oder Install wird verhindert.
- [ ] Runner-Trash-LegalActions und `applyAction` müssen modifizierte Trashkosten bei StateVersion, Credits, Serverbindung und Rezzed-Status revalidieren.
- [ ] AI-Hint von Hidden-Zone auf Server-Defense/Trash-Tax/Region ändern.

Akzeptanzkriterien:
- [ ] Rezzed New Galveston erhöht Trashkosten fremder Nodes/Upgrades im selben Fort um exakt 2.
- [ ] Karten in anderen Forts und New Galveston selbst erhalten keinen falschen Modifier.
- [ ] Runner kann nur bei ausreichenden Credits trashen; stale/rez-state/server-move-Race wird abgelehnt.
- [ ] Keine PublicPayload für New Galveston enthält R&D-Topkarten oder andere Hidden-Zone-Daten.
- [ ] Replay/StateHash bleibt für Trashkosten- und Region-Fälle stabil.

## Gesamtplan

1. Vertragsdrift zuerst korrigieren: `Ramming Piston`, `Skivviss`, `Bodyweight™ Data Crèche`, `Rigged Investments`, `The Short Circuit` und `New Galveston City Grid` haben aktuell klar abweichende Runtime-Verträge und müssen vor reinen Testhärtungen behandelt werden.
2. Danach vorhandene funktionierende Pfade härten: `Core Command: Jettison Ice` und `Weather-to-Finance Pipe` brauchen vor allem Negativ-, Race-, Chronik- und Hidden-Info-Tests.
3. Persistente Timing-/Counter-Pfade schließen: `Data Raven` braucht Runner-Counter-Removal und bessere PublicPayload-/Replay-Tests; `Experimental AI` braucht Advancement-Counter-basierte Mehrzielauflösung.
4. Manifeste, Mechanics-Coverage, AI-Hints und Szenarien nach jeder Kartenkorrektur synchronisieren, ohne neue Karten zu promoten.
5. Für jede Karte mindestens einen fokussierten Engine-Test mit Wrong-Side/Stale und Replay/StateHash ergänzen; bei Hidden-Zone- oder Access-Bezug zusätzlich PlayerView/PublicEvent-Leakscan.
6. Nach Umsetzung die Spotcheck-Ergebnisse in Register/Implementierungsbericht nachführen, aber erst im Umsetzungsjob, nicht in diesem Analysejob.

## Empfohlene Checks

- corepack pnpm --filter @netgrid/engine test
- corepack pnpm --filter @netgrid/web test -- chronicle.test.ts
- corepack pnpm --filter @netgrid/catalog test
- corepack pnpm typecheck

## Umsetzungsergebnis

Status: umgesetzt und grün geprüft. Der Jobbericht liegt im selben lokalen Commit wie die Umsetzung.

Detailbericht: `docs/reviews/originalset-spotchecks/reports/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_RAMMING_GALVESTON_IMPLEMENTATION.md`

Geänderte Hauptpfade:

- `packages/shared/src/index.ts`: Kartenverträge für Ramming Piston, Skivviss, Bodyweight Data Creche, Rigged Investments, The Short Circuit und New Galveston City Grid korrigiert.
- `packages/engine/src/index.ts`: Resolver für Wall-Break/Stealth-Verlust, Skivviss-Counter/Corp-Draw, Rigged-Bit-Depot, Bodyweight-Deck/Bonus-Run, Short-Circuit-Stacksuche, Data-Raven-Counter-Removal, Experimental-AI-Advancement-Trash, New-Galveston-Trashkosten und Weather-to-Finance-Payload ergänzt.
- `packages/engine/src/index.test.ts`: fokussierte Nachtestabdeckung für die driftenden Karten ergänzt; vorhandene Release-Smokes an die korrigierten Verträge angepasst.
- `data/ai/`, `data/manifests/`, `data/rules/`, `data/scenarios/`: AI-Hints, Manifeste, Contract-/Coverage-Artefakte und Szenarien an die korrigierten Kartenverträge angeglichen.
- `docs/reviews/originalset-spotchecks/register.md`, `data/reports/originalset-card-spotcheck-register.json`: Runde `2026-05-15-ramming-galveston` als abgeschlossen registriert.
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`: kurzer Projektlogeintrag ergänzt.

Tests:

- `corepack pnpm --filter @netgrid/engine test`: pass, 328 Tests
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`: pass, 119 Tests
- `corepack pnpm --filter @netgrid/catalog test`: pass, 44 Tests
- `corepack pnpm typecheck`: pass

Restpunkte:

- Keine fachlichen oder technischen Blocker für diesen Job.
- Historische V1.9.x-Reviewtexte, die bewusst alte Zwischenstände beschreiben, wurden nicht breit umgeschrieben.
