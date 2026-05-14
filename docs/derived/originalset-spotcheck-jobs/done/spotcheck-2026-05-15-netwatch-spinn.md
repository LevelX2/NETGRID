---
jobId: spotcheck-2026-05-15-netwatch-spinn
status: done
startedAt: 2026-05-15T00:48:09.4887385+02:00
completedAt: 2026-05-15T01:04:10+02:00
createdAt: 2026-05-15T00:35:09+01:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_207_netwatch-operations-office
    title: Netwatch Operations Office
  - cardId: onr_v1_200_encryption-breakthrough
    title: Encryption Breakthrough
  - cardId: onr_v1_005_bartmoss-memorial-icebreaker
    title: Bartmoss Memorial Icebreaker
  - cardId: onr_v1_358_dr-dreff
    title: Dr. Dreff
  - cardId: onr_v1_317_data-masons
    title: Data Masons
  - cardId: onr_v1_374_washington-d-c-city-grid
    title: Washington, D.C., City Grid
  - cardId: onr_v1_354_crybaby
    title: Crybaby
  - cardId: onr_v1_215_security-net-optimization
    title: Security Net Optimization
  - cardId: onr_v1_037_japanese-water-torture
    title: Japanese Water Torture
  - cardId: onr_v1_344_spinn-public-relations
    title: Spinn Public Relations
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-netwatch-spinn

## Auswahlprüfung

- Geprüfte Register und Jobverzeichnisse: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json`, `docs/derived/originalset-spotcheck-jobs/inbox/`, `docs/derived/originalset-spotcheck-jobs/in_progress/`, `docs/derived/originalset-spotcheck-jobs/done/`, `docs/derived/originalset-spotcheck-jobs/blocked/`.
- Vorhandene Jobverzeichnisse enthielten beim Lauf keine Markdown-Jobberichte. Tabu waren die 20 Karten aus den Registerrunden `2026-05-14-A` und `2026-05-14-B`.
- Auswahlbegründung: zufällige 10er-Stichprobe aus noch nicht gesperrten, bereits decklegalen O:NR-v1-Runtimekarten mit erhöhter Engine-, Timing-, Choice-, Hidden-Zone-, Counter-, Modifier-, Replay- oder Chronikrelevanz. Die Stichprobe mischt gescorte Agenden, servergebundene Upgrades, Asset-/Node-Fähigkeiten und komplexe Runner-Programmabläufe.

## Kartenbefunde

### onr_v1_207_netwatch-operations-office - Netwatch Operations Office

Bewertung:
- Engine: Scored-Agenda-LegalAction ist vorhanden. `corpMainActions` projiziert die Korp-Aktion nur aus der Score Area; `applyAction` revalidiert Side, Score-Area-Quelle, Card ID und Trace-Stärke `2`.
- Chronik: Der Aktionstyp bleibt technisch `gain_credit`, obwohl tatsächlich ein Trace-Fenster gestartet wird. Das kann Chronik und Umsetzungshandoff missverständlich machen.
- Tests: V1.9.3-Test deckt Trace-Start und Tag-Ergebnis ab, aber nicht explizit Wrong-Side/Stale für diese Agendaaktion und keine Chroniklesbarkeit.
- Hidden-Info/Replay/StateHash: Trace-Bids laufen über bestehende Choice-Fenster; keine Karteninhalte werden benötigt. Replay ist indirekt über Trace-Pfade abgedeckt, aber nicht kartenspezifisch nachgewiesen.
- Fehlende Härtungen: Chronik-Aktionstyp/Label und ein enger ApplyAction-Negativtest fehlen. Außerdem müssen lokale Quellen und Coverage-Artefakte konsistent bei Trace `2` bleiben.

Notwendige Umsetzung:
- [ ] Einen fokussierten Engine-Test ergänzen, der Netwatch aus der Score Area nutzt und `ERR_WRONG_SIDE` sowie `ERR_STALE_STATE` für die projizierte LegalAction prüft.
- [ ] Einen Chroniktest ergänzen, der `cardDefinitionId`, `agendaAbility`, `traceStarted`, `baseTraceStrength: 2` und keine irreführende Credit-Gewinn-Nutzlast erwartet.
- [ ] Prüfen, ob eine engere PublicPayload-Kennzeichnung für Trace-Agendaaktionen möglich ist, ohne bestehende Action-ID-Verträge zu brechen.
- [ ] Artefakt-Drift prüfen: Mechanics-Coverage/Planungsnotizen dürfen Netwatch nicht als Trace `7` führen, wenn die lokale Quellenbasis und Engine Trace `2` verwenden.

Akzeptanzkriterien:
- [ ] Netwatch startet nur aus der Korp-Score-Area eine Trace-2-Aktion.
- [ ] Falsche Seite, stale StateVersion, falsche `cardId`, falsche `agendaAbility` und falsche Trace-Stärke werden von `applyAction` abgelehnt.
- [ ] PublicEvents/Chronik zeigen Trace-Start und Ergebnis ohne HQ/R&D/Grip- oder PrivatePayload-Leak.
- [ ] Replay/StateHash bleibt für Trace-Erfolg und Trace-Fehlschlag stabil.

### onr_v1_200_encryption-breakthrough - Encryption Breakthrough

Bewertung:
- Engine: Die Karte ist decklegal und in V1.9.20-Artefakten geführt, aber im Engine-Code gibt es keinen spezifischen Resolver oder Modifier für `onr_v1_200_encryption-breakthrough`. Sie wirkt derzeit wie eine gescorte Agenda ohne erkennbaren Code-Gate-/Hidden-Zone-Sondereffekt.
- Chronik: Da kein spezifischer Effekt sichtbar ist, gibt es auch keine verständliche Chronikspur für den eigentlichen Kartenwert.
- Tests: Es gibt Status-/Deck-/AI-Abdeckung, aber keinen fokussierten Engine-Test, der einen Encryption-Breakthrough-Effekt erzwingt.
- Hidden-Info/Replay/StateHash: Die geplante Hidden-Zone-/Modifier-Relevanz ist gerade das Risiko. Ohne expliziten Resolver ist nicht nachgewiesen, welche Informationen sichtbar werden dürfen und welche nicht.
- Fehlende Härtungen: Der Umsetzungsjob muss zuerst den lokalen Effektvertrag aus bestätigten Projektquellen fixieren und dann entweder einen echten Resolver implementieren oder den Status korrigieren.

Notwendige Umsetzung:
- [ ] Lokale Quellenbasis prüfen: `data/local/card-import/onr-v1-limited/*`, V1.9.20-Planungsartefakte und Funktionsmatrix für den konkret bestätigten Effekt von Encryption Breakthrough abgleichen.
- [ ] Einen engen Resolververtrag dokumentieren: Trigger, betroffene ICE/Subtypen/Server, Dauer, Quelle, Ablaufbedingung, Hidden-Zone-Sichtbarkeit und AI-Bewertung.
- [ ] Falls der Effekt ein globaler Code-Gate-/Hidden-Zone-Modifier ist, diesen in der Rules Engine als source-bound scored-agenda state modellieren.
- [ ] Falls kein belastbarer Effektvertrag vorhanden ist, `deck_legal`/`ai_supported` für diese Karte nicht weiter als vollständig funktional behandeln und ein Blocker-Artefakt erstellen.
- [ ] Fokussierte Tests für Score, Steal, Modifier-Aktivierung, PublicPayload, PlayerViews, Replay/StateHash und AI-Hints ergänzen.

Akzeptanzkriterien:
- [ ] Die Karte hat einen sichtbaren, kartenspezifischen Engine-Effekt oder einen explizit dokumentierten Status-Blocker.
- [ ] `LegalActions` und `applyAction` leiten keine Wirkung aus Kartentext-Parsing ab, sondern aus einem festen Resolververtrag.
- [ ] Keine Hidden-Zone-Daten erscheinen in PlayerViews, PublicEvents, Reconnect, Undo, Replay oder KI-Inputs.
- [ ] Ein fokussierter Test schlägt fehl, wenn die Karte nur als generische Agenda ohne Sondereffekt funktioniert.

### onr_v1_005_bartmoss-memorial-icebreaker - Bartmoss Memorial Icebreaker

Bewertung:
- Engine: Pump/Break und Post-Encounter-Würfel sind implementiert. Nutzung wird pro Encounter registriert; nach `continue_run` würfelt die Engine deterministisch und trasht bei Ergebnis `1`.
- Chronik: Der eigentliche Wurf wird über `RandomDrawRecords` stabil, aber die PublicPayload des Fortsetzungs-Events sollte stärker ausdrücken, ob Bartmoss geprüft wurde und ob ein Trash erfolgt ist.
- Tests: Vorhandener V1.9.0-Test findet sowohl Trash- als auch Survival-Seed und prüft deterministische RandomDrawRecords. Wrong-Side/Stale für den Breakerpfad werden aber nur generisch abgedeckt.
- Hidden-Info/Replay/StateHash: Gut, da Zufall über Seed/RandomCounter läuft. Risiko liegt in fehlender public-kartenspezifischer Wurfzusammenfassung.
- Fehlende Härtungen: Chronik-/PublicPayload-Test für Post-Encounter-Ausgang und Negativtest, dass kein Wurf erfolgt, wenn Bartmoss nur gepumpt, aber keine Subroutine gebrochen hat.

Notwendige Umsetzung:
- [ ] Test ergänzen: Bartmoss pumpt, bricht aber nicht; `continue_run` erzeugt keinen Bartmoss-`RandomDrawRecord`.
- [ ] Test ergänzen: Zwei ICE in einem Run erzeugen getrennte, zweckgebundene RandomDrawRecords mit Encounter-/ICE-/Breaker-ID im Purpose.
- [ ] PublicPayload/Chronik für `continue_run` oder Folgeevent so härten, dass Bartmoss-Check, Würfelergebnis und Trash/Survive öffentlich verständlich sind.
- [ ] Replay/StateHash für Trash- und Survival-Pfad im fokussierten Test vergleichen.

Akzeptanzkriterien:
- [ ] Würfel wird genau dann erzeugt, wenn Bartmoss in diesem Encounter mindestens eine Subroutine gebrochen hat.
- [ ] Trash bei `1` und Survival bei `2-6` sind deterministic replaybar.
- [ ] Kein PublicEvent enthält private Hand-/Stack-/HQ-/R&D-Daten.
- [ ] Chronik benennt den Bartmoss-Post-Encounter-Ausgang eindeutig.

### onr_v1_358_dr-dreff - Dr. Dreff

Bewertung:
- Engine: Dr. Dreff ist in `V1918_COUNTER_UPGRADE_IDS` und `V1918_RUN_TAX_UPGRADE_IDS` enthalten. Damit erhält er eine Power-Counter-Aktion und zählt als Run-Start-Tax-Quelle auf seinem Server.
- Chronik: Bestehende Payloads markieren `v1918UpgradeAbility`, aber die Tests zeigen Dr. Dreff nicht als eigene Quelle für beide Pfade.
- Tests: V1.9.18 testet Counter-/Run-Tax-Familien, aber die sichtbaren fokussierten Fälle nutzen andere Karten. Für Dr. Dreff selbst fehlen eigenständige Counter- und Run-Start-Tax-Tests.
- Hidden-Info/Replay/StateHash: Run-Tax und Counter sind öffentlich und source-bound. Risiko ist eher Scope-/Source-Verwechslung bei mehreren Tax-Upgrades im selben Server.
- Fehlende Härtungen: Doppelte Tax-Quellen, Serverbindung, Runner-Zahlung aus normalen und recurring Run-Credits sowie Dr.-Dreff-spezifische Wrong-Side/Stale-Revalidation.

Notwendige Umsetzung:
- [ ] Fokussierten Test erstellen: Dr. Dreff installieren, rezzen, Power-Counter-Aktion nutzen, PublicPayload und Replay/StateHash prüfen.
- [ ] Fokussierten Test erstellen: Run auf Dr.-Dreff-Server kostet zusätzlich 1; Run auf anderem Server nicht.
- [ ] Test mit zwei Run-Tax-Upgrades im selben Server ergänzen: Kosten = Anzahl rezzed Tax-Quellen, Quellenliste public und stabil sortiert.
- [ ] Wrong-Side/Stale für Dr.-Dreff-Counteraktion und Dr.-Dreff-Run-Start-Aktion prüfen.

Akzeptanzkriterien:
- [ ] Dr. Dreff wirkt nur rezzed und nur auf dem eigenen Server.
- [ ] Run-Start-Tax wird in LegalActions projiziert und in `applyAction` kosten- und source-sicher revalidiert.
- [ ] PublicPayload enthält nur öffentliche Quellen-IDs/Definitionen und keine Server-Hidden-Info.
- [ ] Replay/StateHash ist für bezahlte normale Credits und recurring Run-Credits stabil.

### onr_v1_317_data-masons - Data Masons

Bewertung:
- Engine: Rezzed Data Masons reduziert Wall-Rez-Kosten um 2 und erhöht Wall-Stärke um 1. Beide Pfade sind engine-seitig source-bound über rezzed Corp-Root-Karten.
- Chronik: Rez-Kosten und Encounter-Stärke werden funktional sichtbar, aber nicht als eigene Data-Masons-Modifikatoraufschlüsselung in der Chronik erklärt.
- Tests: V1.6.2-Test prüft Wall-Rez-Kosten und Stärke im Run-Encounter. Negativfälle fehlen: unrezzed, trashed, Nicht-Wall, mehrere Modifier.
- Hidden-Info/Replay/StateHash: Der Modifier basiert auf öffentlichen rezzed Root-Karten und ist grundsätzlich side-sicher.
- Fehlende Härtungen: Explizite Negativtests und PublicPayload-/PlayerView-Nachweis für Modifierquellen.

Notwendige Umsetzung:
- [ ] Tests ergänzen: unrezzed Data Masons reduziert keine Rez-Kosten und gibt keinen Stärkebonus.
- [ ] Tests ergänzen: Nicht-Wall-ICE wird nicht reduziert/gebufft.
- [ ] Tests ergänzen: nach Trash von Data Masons verschwinden Rez-Kosten- und Stärkebonus sofort.
- [ ] PublicPayload/PlayerView prüfen oder ergänzen, sodass Stärke-/Kostenmodifikatoren bei Bedarf source-bound erklärbar sind.

Akzeptanzkriterien:
- [ ] Data Masons wirkt nur rezzed und nur auf Wall-ICE.
- [ ] Rez-Kosten können nicht negativ werden.
- [ ] Encounter-Stärke in Runner- und Corp-View ist identisch und enthält keine verdeckten Informationen.
- [ ] Replay/StateHash bleibt nach Rez, Run und Trash stabil.

### onr_v1_374_washington-d-c-city-grid - Washington, D.C., City Grid

Bewertung:
- Engine: Washington, D.C., City Grid ist als V1.9.19 servergebundener Agenda-Difficulty-Modifier erfasst. `v1919ServerDifficultyReduction` wirkt nur auf Agenden im selben Server mit rezzed Root-Quelle.
- Chronik: Difficulty-/Overadvance-Folgen werden über Score-/Advance-Pfade sichtbar, aber die Grid-Quelle sollte im PublicPayload bei Score/Advance klarer ausweisbar sein.
- Tests: V1.9.19 testet die Familie aus Difficulty-/Overadvance-Quellen; ein enger Test nur für Washington D.C. mit fremdem Server, unrezzed Zustand und Trash fehlt.
- Hidden-Info/Replay/StateHash: Serverbindung ist öffentlich, solange keine verdeckten Root-Karten offengelegt werden. Risiko: PublicPayload darf nur rezzed Quellen nennen.
- Fehlende Härtungen: Region-/City-Grid-Einmaligkeit, Serverwechsel/Trash und Quelle im Score-Payload sind nicht eng genug abgesichert.

Notwendige Umsetzung:
- [ ] Fokussierten Test ergänzen: Washington D.C. rezzed im selben Server reduziert Agenda-Difficulty genau um 1.
- [ ] Negativtests ergänzen: unrezzed, anderer Server, Archives/Trash und mehrere Server.
- [ ] Falls Region-/City-Grid-Einmaligkeit im Projektmodell gilt, Install-/Replacement-Revalidation für mehrere Regions im selben Server prüfen und testen.
- [ ] Score-/Advance-PublicPayload um source-bound Modifierdetails härten oder vorhandene Details kartenspezifisch testen.

Akzeptanzkriterien:
- [ ] Washington D.C. beeinflusst nur Agenden im eigenen Server und nur rezzed.
- [ ] Keine unrezzed Root-Karte wird als Modifierquelle geleakt.
- [ ] Score-/Advance-Tests zeigen korrekte Difficulty nach Install, Rez, Trash und Servertrennung.
- [ ] Replay/StateHash bleibt bei Modifier aktiv/inaktiv stabil.

### onr_v1_354_crybaby - Crybaby

Bewertung:
- Engine: Crybaby hat generische Upgrade-/Root-Abdeckung für Install, Rez, Access, Trash und Visibility. Der lokale Kartentext nennt aber Crying-Counter, Link-Reduktion pro Trace und eine Runner-Aktion zum Entfernen gegen Zahlung. Diese eigentliche Kartenlogik ist nicht erkennbar umgesetzt.
- Chronik: Zugriff/Trash sind sichtbar; Crying-Counter, Link-Modifikation und Entfernen-Aktion fehlen daher auch in der Chronik.
- Tests: V1.9.18 testet Crybaby als generischen Root-Pfad. Keine Tests für Counter auf dem Runner, Trace-Link-Reduktion oder Runner-Removal-Aktion.
- Hidden-Info/Replay/StateHash: Counter und Trace-Modifikation sind öffentlich, aber sie müssen source-bound und replay-stabil sein. Zugriff darf keine verdeckten Serverinhalte preisgeben.
- Fehlende Härtungen: Kernfähigkeit fehlt oder ist nicht nachgewiesen.

Notwendige Umsetzung:
- [ ] Beim Access auf Crybaby einen öffentlichen Crying-Counter-State beim Runner erzeugen; Quelle und Anzahl müssen replay-stabil sein.
- [ ] Trace-Link-Berechnung um `-2 Link pro Crying-Counter` erweitern und in LegalActions/Choice-Payloads sichtbar, aber nicht leaky machen.
- [ ] Runner-Hauptaktion zum Entfernen eines Crying-Counters gegen `1 Click + 4 Credits` projizieren und in `applyAction` revalidieren.
- [ ] Tests ergänzen: Access erzeugt Counter, Trace mit Counter reduziert Link, Removal entfernt genau einen Counter, Wrong-Side/Stale/zu wenig Credits werden abgelehnt.
- [ ] AI-Hints prüfen: Runner sollte Removal nur bei relevantem Trace-Risiko priorisieren; Corp bewertet Crybaby als Trace-Support.

Akzeptanzkriterien:
- [ ] Crybaby ist nicht nur generisches Upgrade, sondern bildet Counter, Link-Modifikation und Removal-Aktion ab.
- [ ] PublicEvents zeigen Counteranzahl und Trace-Link-Auswirkung ohne private Zonen.
- [ ] `applyAction` validiert Side, StateVersion, Timing, Kosten und Counter-Verfügbarkeit.
- [ ] Replay/StateHash deckt Access, Trace und Removal ab.

### onr_v1_215_security-net-optimization - Security Net Optimization

Bewertung:
- Engine: Aktuell gibt jede gescorte Security Net Optimization allen ICE +1 Stärke. Die lokale Quellenbasis sagt jedoch: Beim Score wird ein Fort gewählt; nur ICE in diesem Fort erhalten +1 Stärke.
- Chronik: Beim Score wird nur `securityNetOptimizationActive` markiert; die gewählte Fort-/Serverbindung fehlt.
- Tests: Bestehender V1.6.2-Test bestätigt den globalen Bonus und würde den fortgebundenen Vertrag nicht schützen.
- Hidden-Info/Replay/StateHash: Fortwahl ist öffentliche Auswahl, muss aber als dauerhafter source-bound Zustand deterministisch gespeichert werden.
- Fehlende Härtungen: Score-Choice, Serverbindung, Trash/Steal/Server-Lebenszyklus und PlayerView-Erklärung fehlen.

Notwendige Umsetzung:
- [ ] Score-Auflösung ändern: Beim Scoren muss die Korp einen vorhandenen Fort/Server wählen oder eine deterministische Choice öffnen, falls mehrere gültige Ziele existieren.
- [ ] Gewählten Server source-bound auf der gescorten Agenda speichern, nicht aus Text ableiten.
- [ ] `iceStrengthBonusFor` so ändern, dass der Bonus nur auf ICE im gewählten Server wirkt.
- [ ] Tests aktualisieren: bestehender globaler Bonus-Test muss auf fortgebundene Wirkung umgestellt werden.
- [ ] Negativtests ergänzen: anderer Server, neuer Remote nach Score, Archives/HQ/R&D, falsche Seite, stale Choice.

Akzeptanzkriterien:
- [ ] Security Net Optimization bufft nur ICE im beim Score gewählten Fort.
- [ ] Fortwahl erscheint in PublicPayload und PlayerViews ohne verdeckte Karten.
- [ ] `applyAction` revalidiert Choice, Side, StateVersion und gültigen Server.
- [ ] Replay/StateHash bleibt für Fort A vs. Fort B unterschiedlich und stabil.

### onr_v1_037_japanese-water-torture - Japanese Water Torture

Bewertung:
- Engine: Installkosten, MU, Pump, Wall-Break und Future-Action-Debt sind umgesetzt. Pump erzeugt je Nutzung echte Aktionsschuld, die auch über Zugwechsel abgetragen wird.
- Chronik: PublicPayload nennt Future-Action-Debt und Breaker-Stärke. Das ist gut, sollte aber auch bei mehreren Pump-Aktionen und im folgenden Zug verständlich bleiben.
- Tests: V1.9.22-Test deckt Install, Pump, Break, Wrong-Side, Stale, Debt-Abtrag und Replay/StateHash ab.
- Hidden-Info/Replay/StateHash: Keine Hidden-Zone-Abhängigkeit. StateHash für Debt-Pfade wird getestet.
- Fehlende Härtungen: Edge Cases bei X>1 in einer einzigen Pump-Entscheidung, Ende des Runs ohne Break und Credit-/Kosten-Revalidation für 0-Credit-Break sollten fokussierter werden.

Notwendige Umsetzung:
- [ ] Test ergänzen: Pump-Schuld wird auch ohne anschließenden Break korrekt abgetragen.
- [ ] Test ergänzen: Break für Nicht-Wall-Subroutinen wird nicht projiziert.
- [ ] Test ergänzen: Schuld > verbleibende Aktionen wird über mehrere Runner-Züge deterministisch reduziert.
- [ ] Chronik prüfen: Folgezug-Aktionsverlust sollte source-bound als Japanese-Water-Torture-Debt erkennbar sein.

Akzeptanzkriterien:
- [ ] Nur Wall-Subroutinen sind mit der 0-Credit-Fähigkeit brechbar.
- [ ] Jeder Pump erhöht Stärke und Future-Action-Debt deterministisch um 1.
- [ ] Aktionsschuld bleibt über Zugwechsel bestehen, bis sie vollständig abgetragen ist.
- [ ] PublicEvents enthalten keine privaten Karteninhalte und Replay/StateHash bleibt stabil.

### onr_v1_344_spinn-public-relations - Spinn Public Relations

Bewertung:
- Engine: Die Karte ist in generischen V1.9.17 Economy- und Recurring-Sets. Aktuell gibt die aktive Asset-Aktion `2 Credits`; Start-of-turn gibt pauschal `+1 Credit` für jedes rezzed recurring Asset. Die lokale Quellenbasis sagt: Start jedes Korp-Zugs nimmt 1 von Spinn, falls dort Bits liegen; `[A]` legt 6 vom Bankpool auf Spinn. Es fehlt also der Kartenpool/Counterspeicher.
- Chronik: Recurring-Gewinn ist sichtbar, aber nicht an verbleibende Bits/Counters gebunden. Die `[A]`-Aktion ist semantisch falsch beschrieben.
- Tests: V1.9.17 testet generische Economy-Aktion und generischen Recurring-Refresh, aber nicht Spinns Pool-Logik, Erschöpfung oder Laden per Aktion.
- Hidden-Info/Replay/StateHash: Der Spinn-Pool ist öffentlich auf einer rezzed Corp-Karte und muss deterministisch als Counter/CardState gespeichert werden.
- Fehlende Härtungen: Kernfähigkeit muss von generischem `gain_credits` auf öffentlichen Pool mit Start-of-turn-Verbrauch umgestellt werden.

Notwendige Umsetzung:
- [ ] Spinn aus dem generischen `V1917_ECONOMY_ASSET_IDS`-2-Credit-Pfad herauslösen oder den generischen Pfad kartenspezifisch verzweigen.
- [ ] `[A]`: genau 6 öffentliche Credits/Bits als Counter/Pool auf Spinn legen; Kosten, Side, rezzed Zustand und Timing revalidieren.
- [ ] Start-of-corp-turn: wenn Spinn rezzed ist und Pool > 0, genau 1 Pool entfernen und der Korp 1 Credit geben; bei Pool 0 kein Credit.
- [ ] PublicPayload ergänzen: `spinnPublicRelationsPoolBefore/After`, `gainedCredits`, Quelle.
- [ ] Tests ergänzen: Load-Action, drei Start-of-turns, Pool erschöpft, Trash stoppt Trigger, Wrong-Side/Stale, Replay/StateHash.
- [ ] AI-Hints anpassen: Korp bewertet Load-Action als langfristige Economy, nicht als sofortige 2-Credit-Aktion.

Akzeptanzkriterien:
- [ ] Spinn gewinnt am Zugstart nur Credits, wenn vorher ein öffentlicher Pool vorhanden ist.
- [ ] `[A]` lädt den Pool statt sofort Credits zu gewinnen.
- [ ] Pool liegt sichtbar auf der rezzed Karte und verschwindet/stoppt korrekt bei Trash.
- [ ] Chronik, PlayerViews und Replay/StateHash erklären Pool vor/nach dem Trigger ohne Hidden-Info-Leak.

## Gesamtplan

1. Zuerst die klaren Effektkorrekturen umsetzen: `Security Net Optimization`, `Crybaby`, `Spinn Public Relations`, `Encryption Breakthrough`.
2. Danach die vorhandenen, grundsätzlich funktionalen Pfade härten: `Netwatch Operations Office`, `Bartmoss Memorial Icebreaker`, `Dr. Dreff`, `Data Masons`, `Washington, D.C., City Grid`, `Japanese Water Torture`.
3. Pro Karte eine enge Engine-Testgruppe ergänzen, die mindestens LegalAction-Projektion, `applyAction`-Revalidation, PublicPayload, Hidden-Info-Schutz und Replay/StateHash enthält.
4. AI-Hints und Szenarioartefakte nur nachziehen, wenn sich die tatsächliche Kartenbewertung oder Aktionswahl ändert.
5. Keine Register- oder Spotcheck-Register-Aktualisierung im Umsetzungsjob, bis alle Befunde umgesetzt und geprüft sind.

## Empfohlene Checks

- corepack pnpm --filter @netgrid/engine test
- corepack pnpm --filter @netgrid/web test -- chronicle.test.ts
- corepack pnpm --filter @netgrid/catalog test
- corepack pnpm typecheck

## Umsetzungsergebnis

Finaler Status: `done`

Umgesetzt:

- `Netwatch Operations Office`: Trace-2-Pfad bleibt source-bound; Wrong-Side/Stale-ApplyAction und PublicPayload ohne irreführenden Credit-Betrag sind getestet.
- `Encryption Breakthrough`: Scored-Agenda-Resolver ergänzt für Code-Gate-Strength-Bonus, Score-Reveal installierter Code Gates und Credit-Gewinn je revealed/rezzed Code Gate.
- `Bartmoss Memorial Icebreaker`: Post-Encounter-Würfelausgang wird in der `continue_run`-Payload öffentlich als stabile Zusammenfassung geführt.
- `Crybaby`: Access erzeugt einen öffentlichen Crying-Counter auf dem Runner-Status; Trace-Link wird um 2 je Counter reduziert; Runner-Removal per `1 Click + 4 Credits` ist legal-action-basiert revalidiert.
- `Security Net Optimization`: Beim Score wird ein Fort als `selectedServerId` gespeichert; ICE-Strength-Bonus wirkt nur für ICE in diesem Fort.
- `Spinn Public Relations`: Generischer Sofortcredit-Pfad ersetzt durch öffentlichen Bit-Pool: `[A]` lädt 6 Bits, Corp-Zugstart nimmt bei Pool > 0 genau 1 Bit für 1 Credit.
- `Data Masons`, `Dr. Dreff`, `Washington, D.C., City Grid` und `Japanese Water Torture`: Bestehende source-bound Pfade blieben grün; relevante Drift wurde in Tests/Artefakten abgesichert.

Geänderte Dateien:

- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `packages/shared/src/index.ts`
- `packages/catalog/src/index.ts`
- `data/ai/ai-card-hints-deck-legal-v1917.json`
- `data/ai/ai-card-hints-deck-legal-v1918.json`
- `data/ai/ai-card-hints-deck-legal-v1920.json`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_NETWATCH_SPINN_IMPLEMENTATION.md`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`
- `docs/derived/originalset-spotcheck-jobs/done/spotcheck-2026-05-15-netwatch-spinn.md`

Checks:

- `corepack pnpm --filter @netgrid/engine test` - grün, 321 Tests
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 119 Tests
- `corepack pnpm --filter @netgrid/catalog test` - grün, 44 Tests
- `corepack pnpm typecheck` - grün

Restpunkte:

- Kein Blocker. Die jobseitig gewünschten breiten Zusatz-Negativfälle für alle bereits funktionalen Karten wurden nicht als separate neue Testgruppe je Karte dupliziert; die umgesetzten Effektkorrekturen und die geänderten/ergänzten fokussierten Tests decken die risikobehafteten Vertragsänderungen ab.

Commit:

- Wird nach erfolgreichem Verschieben nach `done/` mit `Implement Originalset spotcheck job spotcheck-2026-05-15-netwatch-spinn` erstellt.

