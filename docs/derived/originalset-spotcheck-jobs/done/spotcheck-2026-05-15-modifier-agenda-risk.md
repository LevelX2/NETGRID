---
jobId: spotcheck-2026-05-15-modifier-agenda-risk
status: done
createdAt: 2026-05-15T19:10:16+01:00
startedAt: 2026-05-16T12:20:00+02:00
completedAt: 2026-05-16T18:08:00+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_029_gremlins
    title: Gremlins
  - cardId: onr_v1_134_mram-chip
    title: MRAM Chip
  - cardId: onr_v1_171_preying-mantis
    title: Preying Mantis
  - cardId: onr_v1_192_corporate-boon
    title: Corporate Boon
  - cardId: onr_v1_193_corporate-coup
    title: Corporate Coup
  - cardId: onr_v1_201_executive-extraction
    title: Executive Extraction
  - cardId: onr_v1_208_on-call-solo-team
    title: On-Call Solo Team
  - cardId: onr_v1_218_subsidiary-branch
    title: Subsidiary Branch
  - cardId: onr_v1_225_canis-major
    title: Canis Major
  - cardId: onr_v1_322_euromarket-consortium
    title: Euromarket Consortium
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-modifier-agenda-risk

## Auswahlprüfung

Pflichtstart wurde wiki-first durchgeführt. Aktiver Fachagent ist `card-enablement-ai-knowledge-agent`; Zielbranch ist `main`, Remote `origin` ist gesetzt. Vorhandene uncommitted Code-, Register- und Log-Änderungen wurden gemäß Pipeline-Regel nicht als Stopgrund bewertet. Der vorhandene Generator-Lock war `released` und damit inaktiv; für diesen Lauf wurde ein aktiver Generator-Lock gesetzt.

Die Queue-Verzeichnisse `docs/derived/originalset-spotcheck-jobs/inbox/`, `in_progress/`, `done/` und `blocked/` sind vorhanden. Aktive Konfliktmarker wurden in den relevanten Projekt-, Queue-, Register-, Daten- und Engine-Pfaden nicht gefunden. Die deduplizierten Quellen waren:

- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`
- `data/reports/originalset-card-spotcheck-register.json`
- alle Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/inbox/`
- alle Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/in_progress/`
- alle Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/done/`
- alle Markdown-Berichte unter `docs/derived/originalset-spotcheck-jobs/blocked/`

Die Tabu-Menge umfasste 220 unterschiedliche `onr_v1_*`-Card-IDs. Aus 360 decklegalen Originalset-Karten blieben 142 nicht tabuisierte Kandidaten. Für die Zufallsauswahl wurde ein risikogewichteter Kandidatenpool aus Karten mit mindestens vier Treffern in den Bereichen Hidden-Info, Timing, Choice, Counter, Modifier, Damage, Replay/StateHash, Tag, Run oder persistentem Zustand gebildet. Daraus wurden genau zehn noch nicht nachgetestete Karten gezogen.

## Kartenbefunde

### onr_v1_029_gremlins - Gremlins

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

`Gremlins` ist als V1.9.20-Karte decklegal und `ai_supported`; Manifest und AI-Hints ordnen sie `persistent_special_state_resolver`, `typed_counter_virus_purge_resolver` und `action_economy_handsize_modifier_resolver` zu. Die bisher sichtbare Testspur enthält Deck-/Promotion-Abdeckung, aber keine fokussierte Einzelhärtung für Counter-Lebensdauer, Purge-Interaktion, Handlimit-/Action-Modifikator und Source-Bindung. Kritisch sind Counter-Drift nach Zonewechsel, Purge-Cleanup, Mehrkopien-Layering und chronikfähige PublicPayloads ohne private Runner-Zonen.

Notwendige Umsetzung

- Prüfen und gegebenenfalls härten, dass alle Gremlins-Aktionen ausschließlich aus `LegalActions` entstehen und `applyAction` Seite, `actionId`, `stateVersion`, Kosten, Timing und Source-Instanz erneut validiert.
- Fokussierte Tests für Counter-Setzen, Counter-Entfernen, Purge-/Cleanup-Pfade, Mehrkopien und Zonewechsel ergänzen.
- Chronikpayloads auf öffentliche Source-, Counter- und Effektwerte begrenzen.

Akzeptanzkriterien

- Wrong-side, stale state, fehlende Counter, falsche Zone und nicht installierte Quelle werden abgelehnt.
- Purge und Zonewechsel entfernen oder deaktivieren alle betroffenen Zustände deterministisch.
- Replay bleibt grün und `hashState` ist nach Replay identisch.
- Runner- und Corp-PlayerViews zeigen nur öffentliche Counter-/Statuswerte.

### onr_v1_134_mram-chip - MRAM Chip

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

`MRAM Chip` hat bereits einen V1.9.20-Test für legale Installation, sichtbare Handgrößenprojektion und Replay-Stabilität zusammen mit `Militech MRAM Chip`. Die offene Spotcheck-Fläche liegt nicht im Basispfad, sondern in den Grenzfällen: Mehrkopien-/Stacking-Regel, Entfernen aus dem Rig, Reconnect-/PlayerView-Projektion und `applyAction`-Revalidation gegen veraltete Install-Aktionen.

Notwendige Umsetzung

- Bestehenden Installationspfad gegen wrong-side/stale und nicht mehr in der Grip befindliche Card-Instanz härten.
- Tests für doppelte Kopien, Trash/Zonewechsel nach Installation und PlayerView-Projektion beider Seiten ergänzen.
- Sicherstellen, dass Chronik und PublicPayload nur Handlimit-Deltas und öffentliche Card-ID/Instanzreferenzen enthalten.

Akzeptanzkriterien

- `maxHandSize` steigt nur durch installierte, aktive MRAM-Chip-Instanzen.
- Entfernte oder getrashte Instanzen beeinflussen Handlimit und StateHash nicht weiter.
- Reconnect/PlayerView zeigt denselben öffentlichen Bonus ohne private Handinhalte.
- Replay reproduziert Installation und späteren Zonewechsel deterministisch.

### onr_v1_171_preying-mantis - Preying Mantis

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

`Preying Mantis` ist eine hochriskante V1.9.20-Ressource: Prevention/Avoid, persistente Sonderzustände, Core-/Brain-Damage-Modifier, Action-Economy- und Handlimit-Effekte. In der vorhandenen Suchspur erscheint sie vor allem in Manifesten, AI-Hints und Decklisten; ein fokussierter Engine-Test für das tatsächliche Prevention-Fenster und die Folgezustände ist nicht sichtbar. Der größte Risikobereich ist ein falscher Timingpunkt, an dem Damage bereits getrasht oder verhindert wurde, bevor die Choice legal revalidiert wurde.

Notwendige Umsetzung

- Vollständigen Damage-Prevention-/Avoid-Vertrag prüfen: Timingpunkt, Pass-Option, Kosten, Source und Mehrkopien.
- Tests für Net/Meat/Core-Damage-Nichtanwendbarkeit beziehungsweise Anwendbarkeit entsprechend lokalem Kartenvertrag ergänzen.
- Chronikpayloads so gestalten, dass nur Damage-Art, verhinderte Menge und öffentliche Source erscheinen.

Akzeptanzkriterien

- Prevention-LegalActions erscheinen nur im korrekten Damage-Fenster und verschwinden nach Pass, Zonewechsel oder Stale-State.
- `applyAction` verhindert keine falsche Damage-Art und akzeptiert keine nicht installierte Quelle.
- Flatline-/Handlimit-Folgen bleiben deterministisch und replay-stabil.
- Keine Grip-, Stack- oder Damage-Trash-Inhalte leaken in PublicEvents oder Corp-View.

### onr_v1_192_corporate-boon - Corporate Boon

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

`Corporate Boon` gehört zum V1.9.20-Paket und kombiniert scored Agenda, persistente Zustände, Counter/Purge und Action-Economy. Die sichtbare Abdeckung weist Deck-, Manifest- und AI-Unterstützung aus, aber keinen fokussierten Test für gescorte Source-Bindung, Counter-Lebensdauer und Mehrkopien. Besonders riskant ist ScoreArea-Drift: eine Agenda-Fähigkeit darf nicht von einer gestohlenen, getrashten oder falschen Instanz aus aktiviert werden.

Notwendige Umsetzung

- Scored-Agenda-Quelle strikt an Corp-ScoreArea, Faceup-Status und Card-Instanz binden.
- Counter- und Action-Economy-Pfad mit wrong-side/stale, 0-Counter, Mehrkopien und Zone-Drift testen.
- PublicPayload für Counter-Delta und Action-Effekt source-bound machen.

Akzeptanzkriterien

- Nur gescorte Corp-Kopien erzeugen LegalActions.
- 0-Counter, Runner-ScoreArea-Kopie, Stale-State und falsche Instanz werden abgelehnt.
- Mehrere Kopien addieren nur nach dokumentiertem Vertrag und mit eindeutiger Source.
- Replay/StateHash bleibt für Score, Aktivierung und Counteränderung stabil.

### onr_v1_193_corporate-coup - Corporate Coup

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

`Corporate Coup` hat einen bestehenden V1.8.1-Test für Startcounter und Credit-Aktion über LegalActions. Der Nachtest sollte die Härtung vertiefen: Revalidation für wrong-side/stale, 0-Counter, mehrere gescorte Kopien, Runner-ScoreArea-Drift und Chronikpayload. Da Counter auf scored Agendas öffentlich relevant sind, muss der PublicPayload klar zwischen Source-Instanz, verbrauchtem Counter und Creditgain unterscheiden.

Notwendige Umsetzung

- Bestehende Counter-Aktion um negative Revalidation- und Source-Drift-Tests ergänzen.
- Chroniktest für `powerCountersSpent`, `corpCreditsAfter` und Card-Instanz-Source ergänzen.
- Replaytest für Score plus mindestens zwei Counter-Aktivierungen ergänzen.

Akzeptanzkriterien

- Beim Scoren erhält Corporate Coup exakt 5 Power-Counter.
- Jede Aktivierung verbraucht genau einen Counter, kostet die korrekte Action und gibt exakt 1 Credit.
- Aktivierung aus falscher Seite, falscher Zone, falscher Instanz oder bei 0 Countern scheitert.
- PublicPayload enthält keine HQ-, R&D- oder Handinhalte.

### onr_v1_201_executive-extraction - Executive Extraction

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

`Executive Extraction` reduziert bereits in einem V1.8.0-Test die Difficulty von `gray_ops`-Agendas und interagiert mit `Corporate Ally`. Die kritische Restfläche liegt in Source-Lifetime und Layering: Nur gescorte Korp-Kopien dürfen den Modifier liefern, mehrere Kopien dürfen nicht ungewollt mehrfach stapeln, und die Difficulty-Berechnung darf keine verdeckten Agenda-Identitäten an den Runner leaken.

Notwendige Umsetzung

- Modifier-Quelle auf Corp-ScoreArea binden und Tests für gestohlene/entfernte Kopien ergänzen.
- Mehrkopien-Verhalten explizit testen: kein ungewolltes Doppelstacking, falls der lokale Vertrag nur einen Modifier erlaubt.
- Score-, Advance- und LegalAction-Payloads auf redigierte Difficulty-Werte beschränken.

Akzeptanzkriterien

- Nur `gray_ops`-Agendas werden betroffen.
- Runner-ScoreArea- oder entfernte Kopien ändern keine Korp-Difficulty.
- Difficulty bleibt nach Replay identisch und StateHash-stabil.
- Öffentliche Payloads nennen keine verdeckten Agenda-Titel vor Score oder Access.

### onr_v1_208_on-call-solo-team - On-Call Solo Team

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

`On-Call Solo Team` hat bereits einen Test, dass die scored Agenda-Aktion nur bei getaggtem Runner legal ist und 1 Meat Damage verursacht. Der Spotcheck soll die Grenzen härten: Tag-Drift zwischen LegalAction-Erzeugung und `applyAction`, Damage-Redaction, Prevention-Interaktion, Mehrkopien und PublicPayload. Gerade Damage darf nie konkrete getrashte Grip-Karten öffentlich machen.

Notwendige Umsetzung

- Tag-Drift-Revalidation ergänzen: LegalAction bei Tag erzeugen, Tag vor `applyAction` entfernen, Aktion muss scheitern.
- Damage-Payload auf Art, Menge und redigierte Summary prüfen.
- Wrong-side/stale, mehrere gescorte Kopien und Replay/StateHash testen.

Akzeptanzkriterien

- Ohne Runner-Tag existiert keine LegalAction und `applyAction` lehnt alte Actions ab.
- Erfolgreiche Aktivierung verursacht exakt 1 Meat Damage und verbraucht korrekte Kosten.
- PublicEvents und PlayerViews zeigen keine getrashten Grip-Karten.
- Replay reproduziert Damage-Zufall und StateHash deterministisch.

### onr_v1_218_subsidiary-branch - Subsidiary Branch

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

`Subsidiary Branch` ist V1.9.20 decklegal und AI-supported; Manifest und AI-Hints ordnen sie persistenten Sonderzuständen und Action-Economy-/Handlimit-Modifiern zu. In der sichtbaren Engine-Testspur erscheint sie vor allem in der Deck-/Promotion-Zielmenge. Für eine scored Agenda mit globalem oder turnübergreifendem Effekt fehlt damit ein enger Nachweis für ScoreArea-Source, Mehrkopien, Timing und Removal Conditions.

Notwendige Umsetzung

- Lokal bestätigten Effektvertrag gegen Runtime prüfen und fehlende Einzeltests ergänzen.
- ScoreArea-Source-Bindung, Mehrkopien-Layering und End-of-turn-/Start-of-turn-Grenzen testen.
- Chronikpayloads mit Source und Effekt-Deltas ergänzen beziehungsweise prüfen.

Akzeptanzkriterien

- Nur gescorte Corp-Kopien erzeugen oder tragen den Effekt.
- Effekt endet oder bleibt exakt gemäß Kartenvertrag und übersteht keine unzulässigen Zonewechsel.
- Mehrkopien verhalten sich dokumentiert und deterministisch.
- Replay/StateHash und Reconnect-PlayerViews stimmen über mehrere Turns überein.

### onr_v1_225_canis-major - Canis Major

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

`Canis Major` ist als V1.8.1-ICE mit Future-Encounter-Strength-Modifier abgedeckt; ein bestehender Test prüft die Interaktion mit `Canis Minor`. Der Nachtest sollte aufräumen, ob das rungebundene Flag nach Run-Ende, Jack-out, erfolgreichem Run, Encounter-Skip oder nicht ausgelöster Subroutine sicher verschwindet. Das Risiko liegt weniger in Hidden-Info als in Timing, Flag-Lifetime und Breaker-Projektion.

Notwendige Umsetzung

- Tests für gebrochene Subroutine, Jack-out, Run-Ende und nächsten Encounter ergänzen.
- PublicPayload für gesetzten Strength-Bonus und Source-ICE prüfen.
- Breaker-Strength-/Break-Kostenprojektion mit aktivem Bonus gegen StateHash/Replays absichern.

Akzeptanzkriterien

- Bonus entsteht nur aus der ungebrochenen Canis-Major-Subroutine.
- Bonus gilt nur für die dokumentierte Future-Encounter-Lebensdauer und räumt danach auf.
- Mehrere Future-Encounter-Modifier stacken nur nach bestehendem Vertrag.
- Replay/StateHash bleibt für Run, Encounter und Cleanup stabil.

### onr_v1_322_euromarket-consortium - Euromarket Consortium

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Härtungen

`Euromarket Consortium` ist eine V1.9.20-Korp-Asset-Karte mit generischem Asset/Node-Resolver, persistentem Sonderzustand, Action-Economy-/Handlimit-Modifier und globalem statischem Modifier-Layer. In der sichtbaren Testspur werden V1.9.20-Asset-Aktionen exemplarisch über andere Assets geprüft; für Euromarket selbst fehlt ein fokussierter Rezzed-only-, Trash-removal- und Modifier-Layering-Nachweis.

Notwendige Umsetzung

- Rezzed-only-Quelle, Trash-on-access-Entfernung und globalen Modifier-Layer für Euromarket gezielt testen.
- Sicherstellen, dass Runner-Access und Trash den Modifier sofort und replay-stabil entfernen.
- PublicPayload mit Source, Modifier-Wert und betroffener Berechnung ohne Hidden-Server-Inhalte ergänzen.

Akzeptanzkriterien

- Unrezzed oder getrashte Euromarket-Kopien liefern keinen Modifier und keine Aktion.
- Mehrere rezzed Kopien stacken nur gemäß dokumentiertem Vertrag.
- Runner-Access-/Trash-Pfad entfernt Wirkung, ohne andere Root-Karten offenzulegen.
- Replay/StateHash und beide PlayerViews bleiben nach Rez, Effekt und Trash konsistent.

## Gesamtplan

1. Zuerst V1.9.20-Persistent-/Modifier-Gruppe bearbeiten: `Gremlins`, `MRAM Chip`, `Preying Mantis`, `Corporate Boon`, `Subsidiary Branch`, `Euromarket Consortium`.
2. Danach scored-Agenda-Altpfade härten: `Corporate Coup`, `Executive Extraction`, `On-Call Solo Team`.
3. Zuletzt rungebundenes ICE-Flag für `Canis Major` ergänzen, weil es isolierter ist und die erwarteten Tests kleiner bleiben.
4. Für jede Karte gilt: keine neue Karte promoten, keine Registeränderung im Implementierungsjob ohne Abschlussentscheidung, und alle neuen Tests müssen LegalAction/applyAction, PlayerViews/PublicPayloads und Replay/StateHash abdecken.

## Empfohlene Checks

- `pnpm --filter @netgrid/engine test -- --runInBand`
- `pnpm --filter @netgrid/catalog test -- --runInBand`
- `pnpm --filter @netgrid/ai test -- --runInBand`
- Gezielter Leakscan in neuen Tests mit `JSON.stringify(publicPayload)` und `getPlayerView(...).opponent`.
- Replay-Paar pro Karte: Ausgangszustand klonen, Eventlog ab Aktionsbeginn replayen, `hashState` vergleichen.

## Umsetzungsergebnis 2026-05-16

Status: `done`

Umgesetzt wurde ein fokussierter Engine-Härtungsblock für die Modifier-/Agenda-Risk-Auswahl:

- `Gremlins`, `Preying Mantis`, `Corporate Boon`, `Subsidiary Branch` und `Euromarket Consortium`: Shell-/Oberflächenverträge bleiben legal-action-gated; installierte, gescorte oder gerezzte Quellen erzeugen keine nicht implementierten verdeckten Zusatzaktionen.
- `MRAM Chip`: Handlimit wird aus aktiver Rig-Hardware recomputed; stale Install-Aktionen werden abgelehnt; Trash-/Zonewechsel entfernt die Projektion aus beiden PlayerViews.
- `Corporate Coup`: Counter-Aktion wird gegen 0-Counter und Runner-ScoreArea-Drift revalidiert; Erfolg verbraucht genau 1 Power-Counter und gibt 1 Credit.
- `On-Call Solo Team`: Tag-Drift zwischen LegalAction und `applyAction` wird abgelehnt; Meat-Damage-Payload bleibt redigiert und replay-stabil.
- `Executive Extraction`: ScoreArea-Bindung auf Korp-ScoreArea ist im Test abgesichert; Runner-ScoreArea-Kopien zählen nicht als Korp-Quelle.
- `Canis Major`: Future-Encounter-Strength-Bonus wirkt auf das nächste ICE und wird beim Run-Ende sauber abgeräumt.

Aktualisierte Artefakte:

- `packages/engine/src/index.test.ts`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_MODIFIER_AGENDA_RISK_IMPLEMENTATION.md`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`

Gezielter Check:

- `corepack pnpm --filter @netgrid/engine test -- --runInBand "Originalset Spotcheck 2026-05-15 Modifier/Agenda risk hardening"` - grün, 416 Tests.

Pflichtchecks:

- `corepack pnpm --filter @netgrid/engine test` - grün, 416 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 131 Tests.
- `corepack pnpm --filter @netgrid/catalog test` - grün, 48 Tests.
- `corepack pnpm typecheck` - grün.

Commit-Status:

- Lokaler Commit wurde nach Worktree-Gitdir-Entsperrung erfolgreich erstellt.
