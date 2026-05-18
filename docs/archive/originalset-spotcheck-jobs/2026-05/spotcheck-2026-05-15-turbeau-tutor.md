---
jobId: spotcheck-2026-05-15-turbeau-tutor
status: done
createdAt: 2026-05-15T02:14:00+01:00
startedAt: 2026-05-15T04:49:00+02:00
completedAt: 2026-05-15T05:10:00+02:00
requiresImplementation: true
priority: normal
commitHint: "Implement Originalset spotcheck job spotcheck-2026-05-15-turbeau-tutor"
cards:
  - cardId: onr_v1_372_turbeau-delacroix
    title: Turbeau Delacroix
  - cardId: onr_v1_357_dieter-esslin
    title: Dieter Esslin
  - cardId: onr_v1_314_corporate-negotiating-center
    title: Corporate Negotiating Center
  - cardId: onr_v1_330_krumz
    title: Krumz
  - cardId: onr_v1_327_i-got-a-rock
    title: I Got a Rock
  - cardId: onr_v1_356_dedicated-response-team
    title: Dedicated Response Team
  - cardId: onr_v1_304_systematic-layoffs
    title: Systematic Layoffs
  - cardId: onr_v1_336_rescheduler
    title: Rescheduler
  - cardId: onr_v1_274_tutor
    title: Tutor
  - cardId: onr_v1_204_ice-transmutation
    title: Ice Transmutation
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-turbeau-tutor

## Umsetzung 2026-05-15

Status: umgesetzt, getestet und nach `done` verschoben.

Geänderte Hauptdateien:

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `data/ai/ai-card-hints-deck-legal-v1917.json`
- `data/ai/ai-card-hints-deck-legal-v1918.json`
- `data/ai/ai-card-hints-deck-legal-v1919.json`
- `data/ai/ai-card-hints-deck-legal-v1920.json`
- `data/ai/ai-card-hints-deck-legal-v1920-draft.json`
- `data/manifests/card-implementation-manifest-1.9.17.json`
- `data/manifests/card-implementation-manifest-1.9.18.json`
- `data/manifests/card-implementation-manifest-1.9.19.json`
- `data/manifests/card-implementation-manifest-1.9.20.json`
- `data/rules/mechanics-coverage-1.9.17.json`
- `data/rules/mechanics-coverage-1.9.18.json`
- `data/rules/mechanics-coverage-1.9.19.json`
- `data/rules/mechanics-coverage-1.9.20.json`
- `docs/reviews/originalset-spotchecks/reports/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_TURBEAU_TUTOR_IMPLEMENTATION.md`
- `docs/reviews/originalset-spotchecks/register.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`

Umsetzungsstand:

- Turbeau Delacroix: Trace 4 beim Access, einmal pro Run pro Fort, aus Run-Tax-Familie entfernt, PublicPayload mit Trace-Stärke und Verbrauchsmarke.
- Dieter Esslin: 1 Net Damage als Access-Ambush ohne künstlichen Hidden-Zone-Vertrag.
- Corporate Negotiating Center: Corp-Start-of-turn-HQ-Agenda-Reveal, Corp-private Choice, öffentliche ausgewählte Agenda-Definitionen und Creditgewinn.
- Krumz: Bit-Counter beim Rezzen, Trace-Bid-Zahlungsquelle, Verbrauch/Refresh und PublicPayload ergänzt.
- I Got a Rock: Rezzed Corp-Aktion mit doppelt-getaggtem Runner, 3 Agenda-Punkte Kosten und 15 Meat Damage.
- Dedicated Response Team: 3 Meat Damage nur gegen bereits getaggten Runner, kein Tag-Gain, No-op-Payload für ungetaggten Runner.
- Systematic Layoffs: explizite Corp-Choice bei mehreren gescorten Corp-Agenden, Removed-from-game-/Credit-Payload gehärtet.
- Rescheduler: HQ verdeckt in R&D mischen und gleiche Kartenanzahl ziehen, RandomDrawRecord/Hidden-Info-Barriere ergänzt.
- Tutor: bestehender V1.9.22-Resolver unverändert; Spotcheck ergab keine nötige Codeänderung.
- Ice Transmutation: Score-Choice auf rezzed ICE, +1 Stärke und Wiederholung printed Subroutinen in Encounter-Subroutinen.

Checks:

- `corepack pnpm --filter @netgrid/engine test`: grün, 334 Tests
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts`: grün, 119 Tests
- `corepack pnpm --filter @netgrid/catalog test`: grün, 44 Tests
- `corepack pnpm typecheck`: grün

Restpunkte: keine für diesen Job. Der nächste Queue-Bericht `spotcheck-2026-05-15-ai-boon-virizz.md` blieb bewusst unbehandelt.

## Auswahlprüfung

- Geprüfte Register und Jobverzeichnisse: `docs/reviews/originalset-spotchecks/register.md`, `data/reports/originalset-card-spotcheck-register.json`, `docs/derived/originalset-spotcheck-jobs/inbox/`, `docs/derived/originalset-spotcheck-jobs/in_progress/`, `docs/archive/originalset-spotcheck-jobs/2026-05/`, `docs/derived/originalset-spotcheck-jobs/blocked/`.
- Vorhandene Jobberichte: `docs/archive/originalset-spotcheck-jobs/2026-05/spotcheck-2026-05-15-netwatch-spinn.md` und `docs/archive/originalset-spotcheck-jobs/2026-05/spotcheck-2026-05-15-ramming-galveston.md`.
- Ausgeschlossene Quellen/Karten zusammengefasst: 40 Card IDs aus Register und erledigten Queue-Berichten, darunter alle Karten aus den Runden `2026-05-14-A`, `2026-05-14-B`, `2026-05-15-netwatch-spinn` und `2026-05-15-ramming-galveston`.
- Auswahlbasis: `packages/catalog/src/index.ts`, `packages/shared/src/index.ts`, Release-/AI-Manifeste, Szenarien, lokale Textreviews und vorhandene Engine-Tests. Der lokale `data/local/card-import/onr-v1-limited/catalog-index-onr-v1-limited.local.json` hat einen JSON-Syntaxbruch um `@@`; fuer die Auswahl wurde deshalb gegen Shared-/Catalog-Runtime-IDs und die Pflicht-Dedupe-Quellen gearbeitet.
- Auswahlbegründung: seeded zufällige 10er-Stichprobe aus 89 komplexeren, nicht tabuisierten, bereits decklegalen Originalset-Karten mit Trace-, Access-Ambush-, Hidden-Zone-, Forfeit-, Damage-, Run-Modifier- oder Persistent-State-Relevanz.

## Kartenbefunde

### onr_v1_372_turbeau-delacroix - Turbeau Delacroix

Bewertung:
- Engine: Access-Trace-Fenster ist vorhanden und side-sicher getestet, aber Shared-Definition und Test nutzen `baseTraceStrength: 10`; die lokal bestätigte Galerie nennt Trace 4. Zusätzlich ist Turbeau in `V1918_RUN_TAX_UPGRADE_IDS`, obwohl der bestätigte Text nur den Access-Trace beschreibt.
- Chronik: PublicPayload zeigt `traceStarted`, `hiddenZoneBarrier` und `ambushDefinitionId`, aber nicht die Einmal-pro-Run-Verbrauchsmarke und nicht die korrekte lokale Trace-Stärke.
- Tests: Es gibt einen positiven Access-Trace-Replaytest. Es fehlen Negativtests für zweiten Access im selben Run, unrezzed/anderer Server, Runner-trash-before-trace und Trace-4-Drift.
- Hidden-Info/Replay/StateHash: Der Access-Pfad ist grundsätzlich ohne Kartendaten-Leak; PendingChoice ist Corp-privat. Risiko liegt in falscher Trace-Stärke und unklarer Run-Tax-Promotion.
- Fehlende Härtungen: Lokale Textbasis auf Trace 4 harmonisieren, Run-Tax-Status prüfen und Access-Trace-Verbrauch source-bound speichern.

Notwendige Umsetzung:
- [ ] `packages/shared/src/index.ts`, Engine-Konstante/Resolver und Test auf Trace 4 korrigieren, falls die bestätigte Galerie führend ist.
- [ ] Turbeau aus Run-Start-Tax-Familien entfernen oder mit einem separaten bestätigten Vertrag belegen.
- [ ] Test ergänzen: Zugriff auf Turbeau startet den Trace nur einmal pro Run auf diesem Fort.
- [ ] Negativtests ergänzen: unrezzed, nicht im accessed Server, zweiter Access im selben Run, stale Choice, falsche Seite.
- [ ] PublicPayload um `oncePerRunConsumed`, `baseTraceStrength: 4` und Quelle/Server ohne verdeckte Karten ergänzen.

Akzeptanzkriterien:
- [ ] Turbeau startet beim legalen Access genau einen Trace 4 und gibt bei Erfolg einen Tag.
- [ ] Keine Run-Tax-LegalActions entstehen aus Turbeau, solange kein eigener Vertrag existiert.
- [ ] Corp-/Runner-Bids bleiben side-sicher; Runner sieht keine Corp-Choice-Optionen.
- [ ] Replay/StateHash ist fuer Trace-Erfolg, Trace-Fehlschlag und abgelehnten zweiten Access stabil.

### onr_v1_357_dieter-esslin - Dieter Esslin

Bewertung:
- Engine: Access-Ambush-Schaden ist implementiert, aber der Test prüft generisch Dieter/Dedicated in einer Schleife und erwartet nur 1 Net Damage. Die Shared-Definition bleibt display-only/generisch und nennt Hidden-Zone-Flächen, obwohl der bestätigte Text schlicht `1 Net damage` beim Access sagt.
- Chronik: Payload enthält `hiddenZoneBarrier` und `hiddenZoneAction`, obwohl kein Hidden-Zone-Inhalt nötig ist. Das kann Chroniklesbarkeit und Leak-Scans verwässern.
- Tests: Positiver Replaytest ist vorhanden. Es fehlen spezifische Tests für Prevention-Fenster, Flatline, unrezzed Zustand, Trash-on-access-Choice-Reihenfolge und Dieter-ohne-Hidden-Zone-Payload.
- Hidden-Info/Replay/StateHash: Damage triggert Random-Grip-Trash; PublicPayload darf keine Grip-Card IDs/Titel enthalten. Bestehender Test prüft keine private Damage-Zusammenfassung fuer Dieter allein.
- Fehlende Härtungen: Kartenspezifische Chronik ohne unnötige Hidden-Zone-Markierung und enger Damage-/Prevention-Vertrag.

Notwendige Umsetzung:
- [ ] Dieter-spezifischen Test aus der generischen V1.9.18-Schleife herausziehen.
- [ ] PublicPayload auf `ambushDefinitionId`, `damageType: net`, `damageAmount: 1`, DamageSummary ohne Grip-Details und ohne künstliche Hidden-Zone-Action prüfen.
- [ ] Prevention-/Avoid-Fenster für 1 Net Damage mit Shield/Joan-of-Arc-ähnlichen Preventern testen.
- [ ] Negativtests: unrezzed Dieter, anderer Server, bereits getrashte Quelle, stale access action.
- [ ] AI-Hint prüfen: Dieter ist ein einfacher Access-Damage-Trap, kein Hidden-Zone-Pressure-Asset.

Akzeptanzkriterien:
- [ ] Dieter verursacht beim legalen Access genau 1 Net Damage.
- [ ] Damage kann durch vorhandene Prevention-Fenster regelkonform abgefangen werden.
- [ ] PublicEvents/Replays enthalten keine Grip-Kartenidentitäten.
- [ ] Replay/StateHash bleibt fuer Damage, Prevention und Flatline stabil.

### onr_v1_314_corporate-negotiating-center - Corporate Negotiating Center

Bewertung:
- Engine: Aktuell als V1.9.17-Hidden-Reveal/Recurring/Economy-Asset modelliert: rezzed LegalAction revealed die oberste R&D-Karte. Die lokale Textreview sagt dagegen: Am Start jedes Korp-Zugs Agenda-Karten aus HQ zeigen und pro gezeigter Agenda 1 Credit erhalten.
- Chronik: Bestehende Chronik zeigt `reveal_rd_top`; das ist für den bestätigten Vertrag falsch. Benötigt wird eine Korp-Start-of-turn-HQ-Reveal-Auswahl mit öffentlicher Anzahl/Titel der gezeigten Agenden.
- Tests: Vorhandener Test prüft R&D-Top-Reveal und Runner-View-Leakschutz. Es fehlen HQ-Agenda-Auswahl, Start-of-turn-Timing, variable Creditmenge, keine Nicht-Agenda-Optionen und Replay.
- Hidden-Info/Replay/StateHash: Hohe Relevanz, weil HQ privat ist. Corp darf private Auswahl sehen; Runner/Public sehen erst die freiwillig gezeigten Agenda-Definitionen, niemals ungezeigte HQ-Karten.
- Fehlende Härtungen: Vollständige Vertragskorrektur von R&D-Reveal zu HQ-Agenda-Reveal.

Notwendige Umsetzung:
- [ ] Runtime-Definition und AI-Hint von R&D-Reveal/Recurring auf Start-of-turn-HQ-Agenda-Reveal umstellen.
- [ ] Corp-private PendingChoice am Korp-Zugstart öffnen, Optionen nur Agenda-Karten aus HQ.
- [ ] Nach Auswahl: gezeigte Agenden öffentlich revealen, Credits in Höhe der Anzahl geben, keine gewählten Karten bewegen.
- [ ] PublicPayload mit `revealedAgendaDefinitionIds`, `revealedCount`, `gainedCredits`, `corpCreditsAfter`; keine ungezeigten HQ-IDs.
- [ ] Alte R&D-Reveal-Tests entfernen/ersetzen und Wrong-Side/Stale/No-Agenda-HQ testen.

Akzeptanzkriterien:
- [ ] Corporate Negotiating Center interagiert nicht mehr mit R&D-Top-Reveal.
- [ ] Nur die Korp sieht ungezeigte HQ-Optionen; Runner sieht nur ausgewählte Reveal-Ergebnisse.
- [ ] Creditgewinn entspricht exakt der Zahl gezeigter Agenda-Karten.
- [ ] Replay/StateHash ist fuer keine Auswahl, eine Auswahl und mehrere Agenden stabil.

### onr_v1_330_krumz - Krumz

Bewertung:
- Engine: Aktuell als generisches Trace-3-Asset modelliert. Die lokale Textbasis sagt dagegen Hosted Trace-Bit mit Wiederauffüllung: bei Rez 1 Bit auf Krumz, nur für Traces nutzbar, bei Nutzung am Start des nächsten Korp-Zugs ersetzen.
- Chronik: Trace-Start wird sichtbar, aber Bit-Quelle, Bit-Verbrauch und Refresh fehlen.
- Tests: Vorhandene V1.9.17-Familienabdeckung prüft Blood Cat/Krumz als Trace-3-Fenster. Es fehlen Rez-Counter, Trace-Bid-Kostenquelle, Start-of-turn-Refresh und Nicht-Trace-Negativfälle.
- Hidden-Info/Replay/StateHash: Counters und Trace-Ausgaben sind öffentlich. Risiko liegt in falscher Creditquelle und nicht deterministischem Refresh-Timing.
- Fehlende Härtungen: Krumz darf keine eigene Trace-Fähigkeit sein, sondern eine trace-spezifische Zahlungsquelle.

Notwendige Umsetzung:
- [ ] Runtime-Vertrag auf `put 1 bit on rez`, `spend only during Corp trace bids`, `replace at Corp turn start if spent` ändern.
- [ ] Trace-Bid-Kostenlogik um source-bound Krumz-Bit ergänzen; normale Credits und Krumz-Bit getrennt payloaden.
- [ ] Tests für Rez, Trace-Bid mit/ohne Bit, Nicht-Trace-Ausgabe verboten, Refresh am nächsten Korp-Zugstart.
- [ ] AI-Hint von aktiver Trace-Asset-Rolle auf Trace-Bid-Economy/Support korrigieren.
- [ ] PublicPayload für `spentKrumzBit`, `krumzCountersAfter`, `refreshedAtCorpStart` ergänzen.

Akzeptanzkriterien:
- [ ] Krumz startet keinen eigenen Trace.
- [ ] Krumz-Bit kann nur für Trace-Bids genutzt werden.
- [ ] Nach Nutzung wird genau 1 Bit am nächsten Korp-Zugstart ersetzt.
- [ ] Wrong-Side/Stale und zu hohe Bid-Kosten werden kontrolliert abgelehnt.

### onr_v1_327_i-got-a-rock - I Got a Rock

Bewertung:
- Engine: Karte ist decklegal/AI-supported gelistet, aber es gibt keinen sichtbaren spezifischen Resolver. Shared-Text ist generisch; lokale Textreview sagt `[A], 3 agenda points: Do 15 meat damage to Runner. Use only if Runner has two or more tags.`
- Chronik: Keine kartenspezifische Chronik für Agenda-Punkt-Kosten, Tag-Bedingung oder 15 Meat Damage.
- Tests: Es gibt Manifest-/Deck-/AI-Abdeckung, aber keinen fokussierten Engine-Test für die aktive Fähigkeit.
- Hidden-Info/Replay/StateHash: 15 Meat Damage kann große Random-Grip-Trash-/Flatline-Pfade auslösen. PublicPayload darf nur Anzahl/Ergebnis nennen, keine Grip-Details.
- Fehlende Härtungen: Vollständiger Resolver fehlt oder ist nicht nachgewiesen.

Notwendige Umsetzung:
- [ ] Rezzed Corp-Asset-LegalAction modellieren: Kosten 1 Click plus 3 Agenda-Punkte, nur wenn Runner mindestens 2 Tags hat.
- [ ] Agenda-Punkt-Kosten source-stabil aus Korp-Score-Area abbuchen oder als explizite Forfeit/Point-Cost-Choice modellieren.
- [ ] 15 Meat Damage über bestehendes Damage-/Prevention-/Flatline-System auflösen.
- [ ] Tests: untagged/one tag blockiert, zwei Tags erlaubt, Agenda-Punktmangel blockiert, Prevention/Flatline, Wrong-Side/Stale.
- [ ] AI-Hint um High-lethality tagged-finisher mit Agenda-Punkt-Kosten aktualisieren.

Akzeptanzkriterien:
- [ ] LegalAction erscheint nur bei rezzed I Got a Rock, mindestens zwei Runner-Tags und bezahlbaren Agenda-Punkt-Kosten.
- [ ] `applyAction` revalidiert Side, StateVersion, Tags, Click, Punktkosten und installierte Quelle.
- [ ] PublicEvents zeigen Kosten und Damage-Ergebnis ohne private Handdaten.
- [ ] Replay/StateHash bleibt auch bei Flatline und Prevention stabil.

### onr_v1_356_dedicated-response-team - Dedicated Response Team

Bewertung:
- Engine: Access-Ambush-Schaden ist vorhanden, aber Test erwartet zusätzlich `expectedTagsAdded: 1`. Der bestätigte Text sagt: 3 Meat Damage nur, wenn Runner bereits tagged ist; die Karte gibt selbst keinen Tag.
- Chronik: Payload zeigt generisch `damageAmount: 1` in der gemeinsamen V1.9.18-Ambush-Schleife; das widerspricht dem bestätigten 3-Meat-Damage-Vertrag.
- Tests: Der positive Test deckt nicht die Tag-Bedingung korrekt ab. Es fehlen untagged-no-effect, tagged-3-meat-damage, Prevention/Flatline und kein Tag-Add.
- Hidden-Info/Replay/StateHash: Meat Damage betrifft Grip; keine Grip-Karten in PublicPayload. Bedingung ist öffentliche Tagzahl.
- Fehlende Härtungen: Damage-Menge und Tag-Bedingung korrigieren; keine Tag-Erzeugung.

Notwendige Umsetzung:
- [ ] Resolver auf `if runner.tags >= 1 then 3 meat damage else no effect` ändern.
- [ ] Entfernen, dass Dedicated Response Team beim Access einen Tag vergibt.
- [ ] PublicPayload mit `tagConditionMet`, `runnerTagsBefore`, `damageAmount: 3` oder `damageSkippedReason: runner_not_tagged`.
- [ ] Tests für untagged, tagged, Prevention, Flatline, Wrong-Side/Stale, getrashte Quelle.
- [ ] AI-Hint als tagged-runner ambush finisher schärfen.

Akzeptanzkriterien:
- [ ] Untagged Runner erleidet beim Access keinen Dedicated-Response-Team-Schaden.
- [ ] Tagged Runner erleidet genau 3 Meat Damage; kein zusätzlicher Tag wird erzeugt.
- [ ] Damage/Prevention/Flatline sind replay-/StateHash-stabil.
- [ ] PublicPayload enthält keine Grip-Kartenidentitäten.

### onr_v1_304_systematic-layoffs - Systematic Layoffs

Bewertung:
- Engine: Es gibt einen Operation-Resolver, der eine gescorte Korp-Agenda forfeitet und Credits in Höhe mindestens 1 der Agenda-Punkte gibt. Test prüft einen einfachen 2-Punkte-Fall über PublicPayload.
- Chronik: PublicPayload enthält Forfeit-Karte, Punktkosten, Credits und Removed-from-game-Zone. Gut, aber Auswahl und Kostenquelle sind nicht hinreichend bei mehreren Agenden belegt.
- Tests: Es fehlen mehrere Score-Area-Ziele, 0/variable Punktwerte, keine gescorte Agenda, Wrong-Side/Stale und Replay/StateHash. Außerdem muss geklärt werden, ob die lokale Textbasis tatsächlich Credits je Agenda-Punkt meint oder einen anderen Counter-/Point-Cost-Effekt.
- Hidden-Info/Replay/StateHash: Score Area und Removed-from-game sind öffentlich; Risiko niedrig, solange keine HQ/R&D-Karten in Fehlern oder Payloads auftauchen.
- Fehlende Härtungen: Explizite Choice statt deterministischer erster Agenda, wenn mehrere gescorte Korp-Agenden vorhanden sind.

Notwendige Umsetzung:
- [ ] Lokalen Systematic-Layoffs-Text aus Galerie/Review gegen Engine-Vertrag abgleichen.
- [ ] Bei mehreren gescorten Korp-Agenden eine Korp-Choice öffnen; nicht still die erste Agenda wählen.
- [ ] `applyAction`/Choice-Resolve gegen Side, StateVersion, Score-Area-Quelle und Agenda-Punktwert revalidieren.
- [ ] Tests für mehrere Agenden, keine Agenda, stale Choice, public Removed-from-game-Payload und Replay/StateHash ergänzen.
- [ ] AI-Hint prüfen: Forfeit-Kosten nur bei positiver Credit-/Tempo-Bilanz.

Akzeptanzkriterien:
- [ ] Systematic Layoffs forfeitet nur eine legal gewählte gescorte Korp-Agenda.
- [ ] PublicPayload nennt nur öffentliche Score-Area-/Removed-from-game-Daten.
- [ ] Mehrere Zielagenden werden deterministisch über Choice, nicht implizit, behandelt.
- [ ] Replay/StateHash bleibt fuer Ziel A vs. Ziel B stabil und unterscheidbar.

### onr_v1_336_rescheduler - Rescheduler

Bewertung:
- Engine: Aktuell als Korp-private R&D-Top-2-Reorder-Choice implementiert und replay-stabil getestet. Lokale Textreview sagt dagegen: `[A]: Note the number of cards stored in HQ. Shuffle those cards into R&D, and then draw that many cards.`
- Chronik: Bestehender Payload `v1917_corp_reorder_rd_top2` ist für den bestätigten Vertrag falsch.
- Tests: Vorhandene Tests prüfen private R&D-Reorder. Es fehlen HQ-count, HQ-in-R&D-Shuffle, Draw-Anzahl, leeres HQ, deterministic shuffle via RandomDrawRecords und Hidden-Info-Barriere.
- Hidden-Info/Replay/StateHash: Sehr hohe Relevanz, weil komplettes HQ in R&D gemischt und anschließend gezogen wird. Public darf Anzahl nennen, aber keine HQ-Karten.
- Fehlende Härtungen: Vollständige Vertragsumstellung auf HQ-Shuffle-Draw mit deterministischem Shuffle.

Notwendige Umsetzung:
- [ ] Runtime-Definition und AI-Hint von R&D-Reorder auf HQ-zu-R&D-Shuffle-und-Draw ändern.
- [ ] Rezzed Asset-LegalAction `[A]` modellieren; `applyAction` revalidiert installierte Quelle, Click, Side und StateVersion.
- [ ] HQ-Kartenanzahl vor dem Shuffle speichern; HQ verdeckt in R&D mischen; danach genau diese Anzahl ziehen.
- [ ] Shuffle über Seed/RandomCounter/RandomDrawRecords abbilden.
- [ ] PublicPayload nur mit `hqCardCount`, `drawnCount`, `hiddenZoneBarrier`, `randomDrawRecordPurpose`; keine Card IDs/Titel.

Akzeptanzkriterien:
- [ ] Rescheduler ordnet R&D nicht mehr top-2 um.
- [ ] HQ wird verdeckt und deterministisch in R&D gemischt, danach zieht die Korp die vorherige HQ-Anzahl.
- [ ] Runner/Public sehen keine HQ- oder gezogenen Kartenidentitäten.
- [ ] Replay/StateHash ist für verschiedene HQ-Größen und Shuffle-Seeds stabil.

### onr_v1_274_tutor - Tutor

Bewertung:
- Engine: Tutor hat einen engen V1.9.22-Resolver: nach erfolgreicher Subroutine bekommen spätere Encounter im selben Run eine zusätzliche breakbare End-the-run-Subroutine. Wrong-Side/Stale, Breakbarkeit und Replay sind positiv getestet.
- Chronik: PublicPayload benennt `v1922CorpIceAbility` und Quelle. Es fehlt ein expliziter Nachweis, dass der Modifier am Runende verschwindet und bei erneutem Encounter derselben Tutor-Instanz später im Run gilt.
- Tests: Positiver Test mit Wall-of-Static und Hammer ist stark. Es fehlen Run-End-Cleanup, mehrere spätere ICE, Jack-out/Run-Ende vor späterem ICE und Doppel-Tutor-Stacking.
- Hidden-Info/Replay/StateHash: Kein Hidden-Zone-Bezug; Replay ist abgedeckt. Risiko liegt in synthetischer Subroutine-Indexierung und Cleanup.
- Fehlende Härtungen: Edge-Case-Tests für Lebensdauer und Mehrfachquellen.

Notwendige Umsetzung:
- [ ] Test ergänzen: Tutor-Modifier ist nach Runende/Jack-out gelöscht.
- [ ] Test ergänzen: zwei spätere ICE erhalten jeweils die synthetische ETR-Subroutine mit stabiler Indexposition am Ende.
- [ ] Test ergänzen: erneuter Encounter desselben Tutor später im Run erhält den Modifier, der ursprüngliche Encounter nicht.
- [ ] Test ergänzen: zwei Tutor-Quellen stacken oder blockieren gemäß dokumentiertem Vertrag eindeutig.
- [ ] PublicPayload für synthetische Subroutine mit `syntheticSourceIceId` und `sourceDefinitionId` prüfen.

Akzeptanzkriterien:
- [ ] Tutor modifiziert nur spätere Encounter im selben Run.
- [ ] Synthetische ETR-Subroutine ist legal brechbar und in `applyAction` indexsicher revalidiert.
- [ ] Modifier wird bei Runende sauber entfernt.
- [ ] Replay/StateHash bleibt bei mehreren betroffenen ICE und Run-End-Cleanup stabil.

### onr_v1_204_ice-transmutation - Ice Transmutation

Bewertung:
- Engine: Karte ist decklegal und in V1.9.20 geführt, aber im Engine-Code ist kein spezifischer Resolver für die lokale bestätigte Score-Fähigkeit sichtbar. Shared-Definition bleibt generisch.
- Chronik: Keine kartenspezifische Chronik für Score-Choice, gewähltes rezzed ICE, +1 Stärke oder Subroutine-Duplikation.
- Tests: Keine fokussierten Engine-Tests; nur Manifest-/Deck-/AI-Abdeckung.
- Hidden-Info/Replay/StateHash: Ziel ist rezzed ICE und öffentlich. Subroutine-Duplikation muss deterministisch und public erklärbar sein.
- Fehlende Härtungen: Vollständiger Score-Trigger-Vertrag für rezzed ICE-Ziel, persistente Quelle und synthetische Subroutinen.

Notwendige Umsetzung:
- [ ] Beim Scoren eine Korp-Choice auf rezzed installed ICE öffnen; keine unrezzed ICE als Optionen.
- [ ] Gewähltes ICE source-bound speichern: +1 Stärke und jede vorhandene Subroutine direkt nach sich selbst wiederholen.
- [ ] Synthetische Subroutinen indexstabil in Encounter, Break- und Continue-Logik einbauen.
- [ ] Negativtests: keine rezzed ICE, Ziel derezzed/getrasht vor Resolve, Runner stiehlt statt Korp scoret, mehrere ICE.
- [ ] PublicPayload/PlayerView mit gewähltem ICE, Stärkeplus und wiederholten Subroutine-Indizes ohne verdeckte Serverkarten.

Akzeptanzkriterien:
- [ ] Ice Transmutation wirkt nur beim Score durch die Korp, nicht beim Steal.
- [ ] Nur rezzed öffentliche ICE sind legale Ziele.
- [ ] +1 Stärke und Subroutine-Duplikation bleiben dauerhaft source-bound und verschwinden bei ICE-Trash.
- [ ] Replay/StateHash ist für unterschiedliche Ziel-ICE und Subroutine-Layouts stabil.

## Gesamtplan

1. Lokale bestätigte Texte gegen Shared-Definitionen und AI-Hints synchronisieren, zuerst die klaren Drifts: Turbeau Trace 4, Dedicated 3 Meat nur tagged, Corporate Negotiating Center HQ-Agenda-Reveal, Krumz Trace-Bit, Rescheduler HQ-Shuffle-Draw, I Got a Rock und Ice Transmutation.
2. Pro Karte feste Resolververträge in Engine modellieren; keine Textparser und keine generischen Familienannahmen als Regelautorität verwenden.
3. LegalActions und `applyAction` je Karte auf Side, StateVersion, Timing, Kosten, Ziele, Choices und Source-Lebensdauer härten.
4. Hidden-Zone-Payloads gezielt nachziehen: HQ/R&D/Grip nur privat, PublicEvents nur Anzahl, Definitionen nach Reveal und source-bound öffentliche IDs.
5. Fokussierte Engine-Tests je Karte ergänzen; vorhandene generische Familien-Smokes nicht als Ersatz für kartenspezifische Regressionsfälle zählen.
6. AI-Hints, Manifest-/Mechanics-Coverage und Szenarioartefakte an den korrigierten Vertrag anpassen.

## Empfohlene Checks

- corepack pnpm --filter @netgrid/engine test
- corepack pnpm --filter @netgrid/web test -- chronicle.test.ts
- corepack pnpm --filter @netgrid/catalog test
- corepack pnpm typecheck
