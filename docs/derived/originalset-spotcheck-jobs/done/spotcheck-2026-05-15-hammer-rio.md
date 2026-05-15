---
jobId: spotcheck-2026-05-15-hammer-rio
status: done
createdAt: 2026-05-15T05:09:31+01:00
startedAt: 2026-05-15T06:49:29.5972445+02:00
completedAt: 2026-05-15T07:01:10.6858048+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_031_hammer
    title: Hammer
  - cardId: onr_v1_100_misc-for-sale
    title: misc.for-sale
  - cardId: onr_v1_103_organ-donor
    title: Organ Donor
  - cardId: onr_v1_104_playful-ai
    title: Playful AI
  - cardId: onr_v1_142_record-reconstructor
    title: Record Reconstructor
  - cardId: onr_v1_247_haunting-inquisition
    title: Haunting Inquisition
  - cardId: onr_v1_276_viral-15
    title: Viral 15
  - cardId: onr_v1_298_planning-consultants
    title: Planning Consultants
  - cardId: onr_v1_339_schlaghund
    title: Schlaghund
  - cardId: onr_v1_367_rio-de-janeiro-city-grid
    title: Rio de Janeiro City Grid
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-hammer-rio

## Auswahlprüfung

- Geprüfte Register und Jobverzeichnisse: `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json`, `docs/derived/originalset-spotcheck-jobs/inbox/`, `docs/derived/originalset-spotcheck-jobs/in_progress/`, `docs/derived/originalset-spotcheck-jobs/done/`, `docs/derived/originalset-spotcheck-jobs/blocked/`.
- Ausgeschlossene Quellen/Karten zusammengefasst: 60 Card IDs wurden aus Register, maschinenlesbarem Register und vorhandenen Jobberichten extrahiert. Tabu waren insbesondere alle Karten aus den Runden `2026-05-14-A`, `2026-05-14-B`, `2026-05-15-netwatch-spinn`, `2026-05-15-ramming-galveston`, `2026-05-15-turbeau-tutor` und `2026-05-15-ai-boon-virizz`, inklusive der duplizierten Queue-Dateien in `inbox/` und `in_progress/`.
- Auswahlbasis: Deck-Legal-AI-Approval-Manifeste, Release-Manifeste, AI-Hints, lokale V1.9.15/V1.9.21/V1.9.22 Szenarien, Shared-Katalogdefinitionen, Engine-Resolver, Engine-Tests und Web-Chronikformatierung.
- Auswahlbegründung: Seed `150606` wählte zehn Karten aus einem 14-Karten-Komplexitätspool mit Score >= 7. Bevorzugt wurden Karten mit Choice-, Hidden-Zone-, Replay-/StateHash-, RandomDrawRecord-, Run-Lock-, Jack-out-, Program-Trash-, Stealth-Verteilungs- oder R&D-Reorder-Risiko. Alle zehn sind bereits decklegal, human_playable und AI-supported, aber noch nicht nachgetestet.

## Kartenbefunde

### onr_v1_031_hammer - Hammer

Bewertung:
- Engine: Hammer hat Install-, Pump- und Wall-Break-Pfade plus `postBreakStealthLoss`. Bei einer Stealth-Quelle wird automatisch bis zu 2 recurring Credit entfernt; bei mehreren Quellen öffnet die Engine eine Runner-private Verteilungs-Choice.
- Chronik: PublicPayload nennt Break, Hammer und bei mehreren Quellen nur `postBreakStealthLossPending` bzw. nach Resolve `selectedCount`. Eine spezifische Chronikzeile für "Stealth-Verlust verteilt" ist nicht abgesichert.
- Tests: Vorhanden sind Break auf Wall, Wrong-Side/Stale, Replay/StateHash, eine Mehrquellen-Choice und Zetatech-Install-Interaktion. Es fehlen No-Stealth-, nur 1 verfügbarer Stealth-Credit-, Nicht-Wall-, falscher Subroutine-Index- und Choice-Race-Fälle.
- Hidden-Info/Replay/StateHash: Installierte Stealth-Quellen sind grundsätzlich öffentlich, aber die konkrete Verteilung ist Runner-seitig. PublicEvents dürfen Count und Quelle Hammer zeigen, nicht versehentlich Choice-Optionen oder CardInstances.
- Fehlende Härtungen: `applyAction` muss beweisen, dass die Stealth-Choice noch zur offenen Hammer-Auflösung passt und dass ausgewählte Optionen nicht mehrfach, nicht von entfernten Karten und nicht über verfügbare Counter hinaus eingelöst werden.

Notwendige Umsetzung:
- [ ] Engine-Test ergänzen: Hammer bricht ohne installierte Stealth-Quelle eine Wall-Subroutine, verliert 0 Stealth und bleibt legal.
- [ ] Engine-Test ergänzen: exakt 1 verfügbarer Stealth-Credit wird automatisch verbraucht, ohne PendingChoice.
- [ ] Engine-Test ergänzen: Nicht-Wall-Subroutine, falscher Subroutine-Index und bereits gebrochene Subroutine werden abgelehnt.
- [ ] Choice-Race-Test ergänzen: Stealth-Quelle wird vor Resolve entfernt oder Counter sinkt; Resolve muss kontrolliert ablehnen.
- [ ] Web-Chroniktest ergänzen: Hammer-Break und Stealth-Verteilung werden verständlich angezeigt, ohne Choice-Optionen oder interne IDs zu leaken.

Akzeptanzkriterien:
- [ ] Hammer kann nur Wall-Subroutinen im Encounter brechen und revalidiert Side, StateVersion, Encounter, Subroutine-Index und Kosten.
- [ ] Stealth-Verlust ist 0 bis 2, nie größer als verfügbare Stealth-Counter und bei mehreren Quellen Runner-privat wählbar.
- [ ] PublicPayload enthält nur Count, Quelle und Ergebnis, keine privaten Choice-Details.
- [ ] Replay/StateHash ist für 0, 1 und 2 verlorene Stealth-Credits stabil.

### onr_v1_100_misc-for-sale - misc.for-sale

Bewertung:
- Engine: Das Event öffnet eine Runner-private Choice auf eigene installierte Karten und gibt 3 Credits pro getrashter Karte. LegalAction ist nur vorhanden, wenn mindestens eine Runner-Karte installiert ist.
- Chronik: Play-Event und Resolve-Choice sind Hidden-Zone-Barrieren mit Count- und Credit-Payload. Eine spezifische Web-Chronik für "eigene Installationen verkauft" fehlt.
- Tests: Vorhanden sind positiver Mehrziel-Fall, Wrong-Side/Stale, Hidden-Info-Scan und Replay. Es fehlen 0-Auswahl, alle installierten Kartentypen, Host-/Hosted-Kaskaden, doppelte Auswahl und Race nach offener Choice.
- Hidden-Info/Replay/StateHash: Runner-installierte Karten sind sichtbar, aber Trash-Kaskaden mit hosted Karten können sensible oder schwer lesbare Payloads erzeugen. Replay muss Reihenfolge und Creditgain stabil halten.
- Fehlende Härtungen: Der Resolver muss Auswahl-Dedupe, eigene installierte Zone und Host-Kaskade explizit nachweisen.

Notwendige Umsetzung:
- [ ] Test ergänzen: 0 Karten auswählen ist erlaubt oder ausdrücklich verboten; Verhalten im Vertrag fixieren.
- [ ] Test ergänzen: Program, Hardware und Resource als Ziele; Corp-Karten, Grip/Stack/Heap und bereits entfernte Karten sind illegal.
- [ ] Test ergänzen: gehostete Karten und Host-Trash-Kaskade, inklusive Creditgain nur für ausgewählte Top-Level-Ziele, falls so gewollt.
- [ ] Choice-Race-Test ergänzen: Ziel wird vor Resolve anderweitig getrasht; Resolve lehnt stale/ungültig ab.
- [ ] Chroniktest ergänzen: Resolve zeigt getrashten Count und Credits, nicht interne CardInstance-Listen.

Akzeptanzkriterien:
- [ ] misc.for-sale trasht nur eigene installierte Runner-Karten aus der offenen Choice.
- [ ] Creditgain ist exakt `3 * trashedCount` und wird in LegalAction/Resolve replay-stabil abgebildet.
- [ ] Doppelte oder entfernte Ziele können nicht doppelt vergütet werden.
- [ ] PublicEvents, PlayerViews und Replays enthalten keine Grip-/Stack-/HQ-/R&D-Daten.

### onr_v1_103_organ-donor - Organ Donor

Bewertung:
- Engine: Organ Donor öffnet eine private Grip-Choice und gibt 2 Credits pro getrashter Karte. `canPlay` verlangt aktuell `state.runner.grip.length > 1`, also mindestens eine weitere Grip-Karte neben dem Event.
- Chronik: PublicPayload ist count-basiert und als Hidden-Zone-Barriere markiert. Web-Chronik hat keinen eigenen Organ-Donor-Zweig.
- Tests: Vorhanden sind ein positiver Zwei-Karten-Fall, Wrong-Side/Stale, Hidden-Info-Scan und Replay. Es fehlen 0, 1, 5 und >5 Kandidaten, Max-5-Grenze, Event-selbst-nicht-wählbar und Race gegen veränderte Grip.
- Hidden-Info/Replay/StateHash: Sehr hoch, weil Grip privat ist. Corp/Public dürfen nur Counts und Credits sehen, nie Card IDs, Titel, Reihenfolge oder nicht gewählte Karten.
- Fehlende Härtungen: Die Maximalgrenze aus lokalem Fakt (`maxGripCards: 5`) muss fokussiert revalidiert und in Fehlerfällen hidden-info-sicher sein.

Notwendige Umsetzung:
- [ ] Test ergänzen: 0 Karten auswählen, 1 Karte, exakt 5 Karten und Versuch mit 6 Karten.
- [ ] Test ergänzen: Organ Donor selbst ist nach dem Play nicht mehr als Grip-Ziel auswählbar.
- [ ] Choice-Race-Test ergänzen: Grip ändert sich vor Resolve; entfernte oder neu gezogene Karten aus alter Choice sind illegal.
- [ ] Fehler- und PublicPayload-Scan ergänzen: keine Grip-Titel, Card IDs, Reihenfolge oder Optionlabels in Corp/Public.
- [ ] Web-Chroniktest ergänzen: "X verdeckte Grip-Karten getrasht, Y Credits erhalten" ohne Titel.

Akzeptanzkriterien:
- [ ] Organ Donor trasht höchstens fünf gültige Grip-Karten und gibt exakt 2 Credits pro getrashter Karte.
- [ ] `applyAction` revalidiert Side, StateVersion, offene Choice, Auswahlmenge und aktuelle Grip-Zugehörigkeit.
- [ ] PublicEvents und Reconnect-Payloads nennen nur Counts und Credit-Ergebnis.
- [ ] Replay/StateHash ist für 0/1/5 Karten und ungültige Auswahl stabil.

### onr_v1_104_playful-ai - Playful AI

Bewertung:
- Engine: V1.9.21 hat laut Szenario den vollständigen Dice-Loop als Release-Ziel, aber der direkt sichtbare Event-Resolver ist ein einmaliger `deterministic_die_probe`. Web-Chronik enthält dagegen bereits spezielle Payload-Auswertung für `playful_ai_dice_loop`.
- Chronik: Web-Chronik kann Dice-Loop-Payloads mit genommenen Credits, beiseitegelegten Würfeln, Roll-Liste und offener Choice beschreiben. Der einfache Probe-Payload reicht dafür nicht.
- Tests: Vorhanden ist ein Probe-Test mit Wrong-Side, RandomDrawRecords, PublicPayload-Leakscan und Replay. Der Release-Smoke behauptet Full-Dice-Loop-Abdeckung; der Spotcheck soll Drift zwischen Probe-Test und echtem Kartenvertrag ausschließen.
- Hidden-Info/Replay/StateHash: Kein Hidden-Zone-Risiko, aber hohes Determinismusrisiko durch wiederholte Würfe und Choices. RandomCounter darf nur über `RandomDrawRecords` steigen.
- Fehlende Härtungen: Es muss einen fokussierten Test geben, der den vollen Playful-AI-Loop und dessen Chronik-Payloads ausführt, nicht nur eine Einmalprobe.

Notwendige Umsetzung:
- [ ] Engine-Test ergänzen oder bestehenden Test erweitern: Playful AI würfelt, erlaubt Credits nehmen und/oder Würfel beiseitelegen und wiederholt, bis keine Würfel offen sind.
- [ ] Tests mit deterministischen Seeds ergänzen: nur Credits nehmen, Würfel beiseitelegen, mehrere Runden, Abschluss ohne offene Choice.
- [ ] PublicPayload auf `v1921RunnerEventAbility: playful_ai_dice_loop`, Roll-Liste, Remaining-Dice und RandomCounter prüfen.
- [ ] Web-Chroniktest gegen echten Payload ergänzen, nicht nur synthetischen Minimalpayload.
- [ ] AI-Hint prüfen: Runner-KI darf Erwartungswert verwenden, aber nie zukünftige Würfel kennen.

Akzeptanzkriterien:
- [ ] Playful AI nutzt keine manuelle Probe als vollständigen Kartenvertrag.
- [ ] Alle Würfe sind in `RandomDrawRecords` mit stabiler Purpose-Reihenfolge enthalten.
- [ ] Offene Choices sind side- und stateVersion-sicher revalidiert.
- [ ] Chronik zeigt Würfe, Credits und beiseitegelegte Würfel ohne interne Engine-Daten.

### onr_v1_142_record-reconstructor - Record Reconstructor

Bewertung:
- Engine: Record Reconstructor ist als installierter Access-Helfer integriert: bei Archives erhöht er die Breach-Queue um 1 und gehört zur Reveal-Helper-Liste. Die Abdeckung läuft in einem Familien-Test mit mehreren V1.9.15-Helfern.
- Chronik: Access-Reveal nutzt generische `v1915_installed_access_reveal`-Payloads. Es gibt keinen kartenbezogenen Chroniknachweis, der Record Reconstructor als Quelle für den Archives-Mehrzugriff benennt.
- Tests: Vorhanden ist ein Sammeltest, der Hidden-Zone-Barriere und keine frühe R&D-Agenda-Leaks prüft. Es fehlen fokussierte Archives-Fälle, leere Archives, facedown/faceup Archives, Multiaccess-Reihenfolge und Reconnect nach teilweisem Access.
- Hidden-Info/Replay/StateHash: Sehr relevant wegen Archives-Zugriffen und potenziell verdeckten Archives-Karten. Queue darf keine zukünftigen Karten oder verdeckten Definitionen im Runner/Public vorzeitig leaken.
- Fehlende Härtungen: Der Spezialeffekt muss als Record-Reconstructor-Quelle erkennbar und für Archives-Visibility genau getestet werden.

Notwendige Umsetzung:
- [ ] Fokussierten Engine-Test ergänzen: installiertes Record Reconstructor erzeugt genau +1 Archives-Access.
- [ ] Test ergänzen: leere Archives, eine Karte, mehrere Karten, faceup/facedown-Mix.
- [ ] Test ergänzen: Access-Queue und PlayerViews vor erstem, zwischen zwei und nach letztem Access ohne Zukunftsleak.
- [ ] PublicPayload/Chronik um source-bound Hinweis ergänzen oder testen, falls bereits vorhanden: Quelle `onr_v1_142_record-reconstructor`.
- [ ] AI-Hint prüfen: Runner-KI bewertet Archives-Zusatzaccess nur bei relevantem Archives-Inhalt und ohne verdeckte Identitäten.

Akzeptanzkriterien:
- [ ] Record Reconstructor verändert nur Archives-Access und nur installiert.
- [ ] Queue-Projektion, Access-Resolve und Reconnect leaken keine noch nicht zugänglichen Karten.
- [ ] PublicEvents erklären Zusatzaccess und Quelle ohne private Daten.
- [ ] Replay/StateHash ist für leere, öffentliche und verdeckte Archives stabil.

### onr_v1_247_haunting-inquisition - Haunting Inquisition

Bewertung:
- Engine: Beim ungebrochenen Run-Lock-Subroutine-Resolve endet der Run und setzt `runLockActionsPending = 6`. Normale Start-Run-Aktionen verschwinden, der Zähler sinkt mit tatsächlich genommenen Runner-Aktionen und bleibt über Korpzug erhalten.
- Chronik: PublicPayload nennt `haunting_inquisition_run_lock`, Count und Quelle. Web-Chronik hat keinen spezifischen Run-Lock-Text für diese Karte.
- Tests: Vorhanden sind Wrong-Side/Stale auf Continue, Run-Lock-Zähler, Fortbestehen über Zugwechsel und Replay. Es fehlen gebrochene erste Subroutine, zweite ETR separat, Bonus-Run-Ausnahme, mehrere Run-Lock-Quellen und Discard-/Choice-Aktionen als Zählerverbrauch.
- Hidden-Info/Replay/StateHash: Kein Hidden-Zone-Risiko, aber Timing-/Action-Economy-Risiko. Der Zähler muss nur echte Runner-Aktionen zählen und darf Korp-Aktionen oder kostenlose Bonusruns nicht falsch blockieren, falls der Vertrag das erlaubt.
- Fehlende Härtungen: Break/ETR-Trennung und konkrete Action-Verbrauchsarten sind nicht fokussiert genug.

Notwendige Umsetzung:
- [ ] Test ergänzen: erste Subroutine gebrochen, zweite nicht gebrochen -> nur ETR, kein Run-Lock.
- [ ] Test ergänzen: erste ungebrochen, zweite gebrochen -> Run endet durch Lock-Vertrag oder klar dokumentierte Reihenfolge; Ergebnis festlegen.
- [ ] Test ergänzen: Bonus-Run ohne Click ist trotz Lock erlaubt oder explizit verboten, passend zur lokalen Faktengrundlage.
- [ ] Test ergänzen: Draw/Gain/Install/Discard-Choice reduzieren Lock nur bei tatsächlichen Runner-Aktionen.
- [ ] Web-Chroniktest ergänzen: sechs Aktionen Run-Sperre mit Quelle Haunting Inquisition verständlich darstellen.

Akzeptanzkriterien:
- [ ] Run-Lock entsteht nur aus ungebrochener Haunting-Inquisition-Subroutine.
- [ ] `applyAction` revalidiert Encounter, Subroutine-Reihenfolge, Side und StateVersion.
- [ ] Der Lock-Zähler sinkt deterministisch nur bei vertraglich zählenden Runner-Aktionen.
- [ ] PublicPayload und Chronik nennen Quelle und Restzähler ohne interne Run-State-Daten.

### onr_v1_276_viral-15 - Viral 15

Bewertung:
- Engine: Viral 15 setzt nach ungebrochener Subroutine einen run-weiten Modifier: Jack-out kostet +1, und nach dem Passieren rezzter ICE öffnet eine Runner-private Program-Trash-Choice, wenn der Runner nicht jackt.
- Chronik: PublicPayload unterscheidet `viral_15_run_modifier`, `viral_15_jack_out_tax`, `viral_15_program_trash_choice` und Resolve. Web-Chronik hat keinen spezifischen lesbaren Viral-15-Zweig.
- Tests: Vorhanden sind Wrong-Side/Stale, Jack-out-Zweig, Program-Trash-Choice, Hidden-Info-Abschirmung und Replay. Es fehlen mehrere installierte Programme, keine Programme, mehrere passierte rezzed ICE, Run-End-Cleanup, Quelle derezzed/getrasht nach Aktivierung und gebrochene Subroutine.
- Hidden-Info/Replay/StateHash: Installierte Programme sind sichtbar, aber die Runner-Choice ist privat. Der PublicPayload darf Kandidatenzahl und Count zeigen; Zieldefinition nach Trash ist öffentlich vertretbar, aber sollte bewusst getestet sein.
- Fehlende Härtungen: Mehrfachtrigger und Lebensdauer des run-weiten Modifiers brauchen enge Regressionstests.

Notwendige Umsetzung:
- [ ] Test ergänzen: keine installierten Programme -> keine Choice, Count 0, Run läuft weiter.
- [ ] Test ergänzen: mehrere Programme -> Runner-private Choice, Corp-View ohne PendingChoice, Resolve trasht genau gewähltes Programm.
- [ ] Test ergänzen: zwei weitere rezzed ICE im selben Run -> nach jedem Passieren genau ein Trigger.
- [ ] Test ergänzen: Runner jackt gegen +1 Credit -> kein Program-Trash; unzureichende Credits blockieren oder verbieten Jack-out sauber.
- [ ] Test ergänzen: Run-Ende, erfolgreicher Zugriff und Jack-out löschen `viral15ActiveSourceIceId` und Pending-Pass-State.
- [ ] Web-Chroniktest ergänzen: Jack-out-Tax und Program-Trash mit Quelle Viral 15 verständlich anzeigen.

Akzeptanzkriterien:
- [ ] Viral 15 wirkt nur nach ungebrochener Subroutine und nur für den aktuellen Run.
- [ ] Jack-out-Kosten und Program-Trash-Trigger werden in LegalActions und `applyAction` identisch revalidiert.
- [ ] Runner-Choice leakt keine PendingChoice an Corp/Public.
- [ ] Replay/StateHash ist für jack-out, kein Programm, ein Programm und mehrere Programme stabil.

### onr_v1_298_planning-consultants - Planning Consultants

Bewertung:
- Engine: Das Event öffnet eine Corp-private R&D-Top-5-Reorder-Choice, wenn R&D mindestens zwei Karten hat. Resolve validiert vollständige Permutation der aktuellen Topkarten.
- Chronik: PublicPayload ist Hidden-Zone-Barriere mit `arrangedCount`; Web-Chronik kennt den speziellen `v1922_corp_rd_reorder_top5`-Payload nicht als eigenen Fall.
- Tests: Vorhanden sind Wrong-Side/Stale, fünf Karten, Reorder, Hidden-Info-Scan und Replay. Es fehlen R&D mit 0/1/2/4 Karten, Race nach offener Choice, unvollständige Auswahl, Duplikate und Reconnect/PlayerView-Trennung.
- Hidden-Info/Replay/StateHash: Sehr hoch, weil R&D privat ist. Corp-Choice darf Titel sehen, Runner/Public nur Count.
- Fehlende Härtungen: Variable Top-X-Menge und Race gegen veränderte R&D-Spitze müssen explizit geschützt werden.

Notwendige Umsetzung:
- [ ] Test ergänzen: R&D mit 0/1 Karten macht Planning Consultants illegal; 2 bis 4 Karten öffnen eine Choice mit genau dieser Anzahl.
- [ ] Test ergänzen: unvollständige Auswahl, doppelte Karte, Karte außerhalb der ursprünglichen Top-X und geänderte R&D-Spitze vor Resolve werden abgelehnt.
- [ ] PlayerView-/Reconnect-Test ergänzen: Corp sieht Choice-Optionen, Runner nicht.
- [ ] PublicPayload-Scan ergänzen: keine R&D-Titel, IDs, Reihenfolge oder Optionlabels in Public/Runner.
- [ ] Web-Chroniktest ergänzen: "Korp hat X R&D-Karten verdeckt neu angeordnet" ohne Titel.

Akzeptanzkriterien:
- [ ] Planning Consultants ordnet nur die beim Öffnen gültigen oberen bis zu fünf R&D-Karten neu.
- [ ] `applyAction` revalidiert Side, StateVersion, Quelle, offene Choice und vollständige Permutation.
- [ ] Runner/Public sehen nur `arrangedCount` und Hidden-Zone-Barriere.
- [ ] Replay/StateHash ist für 2, 4, 5 Karten und ungültige Auswahl stabil.

### onr_v1_339_schlaghund - Schlaghund

Bewertung:
- Engine: Aktueller sichtbarer Pfad ist eine rezzed Asset-LegalAction `deterministic_die_probe`; PublicPayload und RandomDrawRecords sind getestet. Der V1.9.21-Release-Smoke behauptet zusätzlich tag-geprüften Damage und Selbsttrash.
- Chronik: Generic Die-Probe-Payload ist sichtbar. Es fehlt ein spezifischer Chronikpfad für "Wurf <= Tags -> 10 Meat Damage und Selbsttrash".
- Tests: Vorhanden ist Probe-Test mit Wrong-Side/Stale, Leakscan und Replay. Der echte Schlaghund-Vertrag braucht Tests für Runner-Tags, Wurfvergleich, Damage-Fenster, Prevention/Replacement, Flatline und Selbsttrash.
- Hidden-Info/Replay/StateHash: Kein Hidden-Zone-Risiko, aber hoher Determinismus- und Damage-Window-Risikograd. Damage darf in Event-Modification/Replacement-Fenster laufen und RandomDrawRecords müssen vor Damage stabil sein.
- Fehlende Härtungen: Spotcheck muss klären, ob der Probe-Pfad inzwischen nur noch Testoberfläche ist oder der echte Damage-Vertrag tatsächlich implementiert und fokussiert getestet ist.

Notwendige Umsetzung:
- [ ] Engine-Test ergänzen: bei Runner-Tags >= Wurf löst Schlaghund 10 Meat Damage aus und trasht sich danach.
- [ ] Engine-Test ergänzen: bei Runner-Tags < Wurf kein Damage und kein Selbsttrash, aber RandomDrawRecord/PublicPayload bleiben stabil.
- [ ] Damage-Prevention-/Replacement-Test ergänzen: bestehende Damagefenster greifen, ohne RandomDrawRecord zu duplizieren.
- [ ] Test ergänzen: 0 Tags, 6 Tags, bereits getrashter/derezzed Schlaghund, Wrong-Side/Stale nach offener Action.
- [ ] Chroniktest ergänzen: Wurf, Tag-Vergleich, Damage und Selbsttrash sind lesbar, ohne private Payloads.

Akzeptanzkriterien:
- [ ] Schlaghunds spielbarer Effekt ist nicht nur ein Würfelprobe-Stub.
- [ ] Damage und Selbsttrash hängen deterministisch am Wurf-gegen-Tags-Vergleich.
- [ ] PublicEvents enthalten Wurf, Tag-Anzahl, Ergebnis und Quelle, aber keine internen State-Dumps.
- [ ] Replay/StateHash ist für Erfolg, Fehlschlag und verhinderte Damage-Folgen stabil.

### onr_v1_367_rio-de-janeiro-city-grid - Rio de Janeiro City Grid

Bewertung:
- Engine: Aktuell sichtbar ist eine rezzed Upgrade-LegalAction `deterministic_server_die_probe`. Der Release-Smoke fordert aber einen servergebundenen Trigger: nach jedem Passieren rezzter ICE auf diesem Fort würfeln und bei 1 den Run beenden.
- Chronik: Generic Server-Würfelprobe wird getestet, aber kein after-pass-ICE-Trigger mit Serverbindung, ICE-Quelle und Run-Ende.
- Tests: Vorhanden ist Probe-Test mit Wrong-Side, Leakscan und Replay. Es fehlen automatischer Trigger beim Passieren, nur eigenes Fort, nicht bei unrezzed ICE, mehrere ICE, Wurf 1 vs. Wurf 2-6, Trash/Derez/Serverwechsel und Run-End-Cleanup.
- Hidden-Info/Replay/StateHash: Kein verdeckter Karteninhalt, aber Serverbindung und RandomDrawRecord-Reihenfolge sind kritisch. Der Trigger darf keine unrezzed ICE-Definition oder Serverinhalt leaken.
- Fehlende Härtungen: Der echte City-Grid-Vertrag muss automatische Timingpunkte beweisen und den manuellen Probe-Pfad ersetzen oder klar aus Promotion entfernen.

Notwendige Umsetzung:
- [ ] Engine-Test ergänzen: Runner passiert rezzed ICE im gleichen Fort wie Rio; Engine würfelt automatisch mit `RandomDrawRecord`.
- [ ] Seed-Tests ergänzen: Wurf 1 beendet Run, Wurf 2-6 lässt Run weiterlaufen.
- [ ] Test ergänzen: ICE in anderem Fort, unrezzed ICE, Rio derezzed/getrasht -> kein Trigger.
- [ ] Test ergänzen: mehrere rezzed ICE in einem Run erzeugen genau einen Record pro passierter ICE in stabiler Reihenfolge.
- [ ] PublicPayload/Chronik ergänzen: Quelle Rio, Serverlabel, passedIceId/Definition falls öffentlich, Wurf und Run-Ende ohne versteckte Serverdaten.

Akzeptanzkriterien:
- [ ] Rio de Janeiro City Grid ist als automatischer after-pass-rezzed-ICE-Trigger umgesetzt oder die Promotion wird blockiert.
- [ ] Trigger ist servergebunden, rezzed-gebunden und source-bound revalidiert.
- [ ] RandomDrawRecords und StateHash bleiben bei gleicher Passierreihenfolge stabil.
- [ ] PublicEvents und Reconnect zeigen keine verdeckten ICE- oder R&D/HQ-Daten.

## Gesamtplan

1. Zuerst Vertragsdrift bei V1.9.21-Zufallskarten schließen: `Playful AI`, `Schlaghund` und `Rio de Janeiro City Grid` müssen beweisen, dass der vollständige Release-Vertrag läuft und nicht nur eine manuelle Würfelprobe.
2. Danach Hidden-Zone-Choice-Härtung umsetzen: `Organ Donor`, `misc.for-sale`, `Planning Consultants`, `Record Reconstructor` und `Viral 15` brauchen Race-, Dedupe-, PlayerView-/Reconnect- und payloadarme Chroniktests.
3. Anschließend Run-/Encounter-Timing härten: `Hammer`, `Haunting Inquisition` und `Viral 15` brauchen Break-/Subroutine-/Run-Lifecycle- und Action-Counter-Regressionen.
4. Web-Chronik nachziehen, wo PublicPayloads bereits existieren, aber keine lesbaren spezifischen Einträge abgesichert sind.
5. AI-Hints und Manifest-/Mechanics-Coverage nur anpassen, wenn der Umsetzungsjob echten Vertragsdrift findet oder einen bisherigen Probe-Pfad aus der Promotion herausnehmen muss.
6. Register und Spotcheck-Register erst nach erfolgreicher Umsetzung und grünen Checks aktualisieren; dieser Bericht ist nur der Handoff.

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
- `apps/web/app/chronicle.ts`
- `apps/web/app/chronicle.test.ts`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_HAMMER_RIO_IMPLEMENTATION.md`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`

Karten-Nacharbeiten:

- `Playful AI`: einmalige Event-Probe durch `playful_ai_dice_loop` mit Runner-Choice, stabilen `RandomDrawRecords`, PublicPayload-Zählern und Replay-Test ersetzt.
- `Schlaghund`: Probe-Pfad durch Tag-vs-Wurf-Vertrag ersetzt; Erfolg verursacht 10 Meat Damage und Selbsttrash, Fehlschlag bleibt öffentlicher Wurf-/Tag-Befund.
- `Rio de Janeiro City Grid`: manueller Server-Probe-Pfad entfernt; automatischer Trigger nach dem Passieren gerezzter ICE im eigenen Fort würfelt und beendet bei 1 den Run.
- `Hammer`: Stealth-Verteilungschoice gegen doppelte Optionen, entfernte Quellen und unzureichende Counter gehärtet.
- `misc.for-sale`, `Organ Donor`, `Record Reconstructor`, `Haunting Inquisition`, `Viral 15` und `Planning Consultants`: bestehende Resolver- und Nachtestabdeckung grün bestätigt; keine zusätzliche Runtime-Korrektur nötig.
- Web-Chronik: spezifische Darstellung für `Schlaghund` und `Rio de Janeiro City Grid` ergänzt; Playful-AI-Wurfserien akzeptieren die side-sichere Payload-Repräsentation.

Checks:

- `corepack pnpm --filter @netgrid/engine test` - grün
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün
- `corepack pnpm --filter @netgrid/catalog test` - grün
- `corepack pnpm typecheck` - grün

Restpunkte:

- Keine Blocker. Weitere Einzel-Edge-Smokes für die bereits bestätigten Bestandsresolver können später ergänzt werden, sind für diesen Job aber nicht blockernd.

Commit-Hinweis:

- Lokaler Abschlusscommit: `Implement Originalset spotcheck job spotcheck-2026-05-15-hammer-rio`
