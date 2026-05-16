---
jobId: spotcheck-2026-05-15-trace-prevention-assets
status: done
createdAt: 2026-05-15T17:12:00+01:00
startedAt: 2026-05-16T11:46:00+02:00
completedAt: 2026-05-16T18:04:00+02:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_023_evil-twin
    title: Evil Twin
  - cardId: onr_v1_086_forged-activation-orders
    title: Forged Activation Orders
  - cardId: onr_v1_137_parraline-5750
    title: Parraline 5750
  - cardId: onr_v1_149_access-to-arasaka
    title: Access to Arasaka
  - cardId: onr_v1_187_wilson-weeflerunner-apprentice
    title: Wilson, Weeflerunner Apprentice
  - cardId: onr_v1_191_black-ice-quality-assurance
    title: Black Ice Quality Assurance
  - cardId: onr_v1_243_fetch-4-0-1
    title: Fetch 4.0.1
  - cardId: onr_v1_264_rex
    title: Rex
  - cardId: onr_v1_309_bbs-whispering-campaign
    title: BBS Whispering Campaign
  - cardId: onr_v1_333_omniscience-foundation
    title: Omniscience Foundation
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-trace-prevention-assets

## Auswahlprüfung

- Deduplizierung erfolgte gegen `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`, `data/reports/originalset-card-spotcheck-register.json` und alle Markdown-Jobberichte unter `docs/derived/originalset-spotcheck-jobs/inbox`, `in_progress`, `done` und `blocked`.
- Gefundene Tabu-Menge: 210 eindeutige `onr_v1_*` Card IDs. Keine der zehn ausgewählten Card IDs kam in Register oder Queue vor.
- Kandidatenbasis: lokale `card-implementation-manifest*.json` mit `releaseStatus: human_playable`, decklegaler Originalset-Status aus der V1.9.10-bis-V1.9.22-Completion-Linie und AI-/Release-Manifestparität. Es blieben 121 nicht-tabue Kandidaten; 55 davon hatten starke Timing-/Choice-/Hidden-Info-/Replay-/PublicPayload-Signale.
- Auswahlart: zufällige 10er-Auswahl aus dem komplexeren Kandidatenpool, fachlich gewichtet auf Trace/Link, Prevention, globalen Modifier, per-card Choices, Hardware-/Asset-Lifecycle und PublicPayload-Redaktion.
- Aktueller Projektstand: Die Karten sind bereits decklegal und AI-supported; dieser Job ist kein Freischaltungsjob, sondern ein Nachtest- und Härtungsauftrag.

## Kartenbefunde

### onr_v1_023_evil-twin - Evil Twin

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen

Evil Twin ist als Runner-Programm/Killer mit Breakerwerten, `damage_prevention`, Turn-Limit und Core-Damage-Bezug im Runtime-Pool. Kritisch ist die Kopplung aus installierter Programmquelle, Icebreaker-Aktionen und Damage-Prevention: LegalActions müssen sauber zwischen Pump/Break und Prevention-Fenster trennen, und `applyAction` darf Prevention nur aus einer tatsächlich installierten, bezahlten, nicht getrashten Quelle zulassen. Die Chronik sollte nicht nur "Schaden reduziert" zeigen, sondern Quelle, Schadensart, verhinderten Betrag und Restschaden. Hidden-Info ist mittelrelevant: Schadenskarten selbst bleiben privat; PublicPayload darf nur Typ, Betrag und Quelle zeigen. Replay/StateHash braucht vor allem Turn-Limit-Reset und Mehrkopien-Stabilität.

Notwendige Umsetzung

- Fokussierte Engine-Regression für Evil Twin ergänzen: Install, MU, Pump/Break gegen Sentry und Prevention in separaten Timingfenstern.
- Turn-Limit pro Karteninstanz prüfen: maximal 2 Net/Core Prevention pro Runner-Zug, Reset zum richtigen Turnstart, keine Meat-Prevention.
- `applyAction` gegen falsche Seite, stale `stateVersion`, getrashte Quelle und nicht installierte Quelle härten.
- Chronik-/PublicPayload-Test ergänzen, der keine Grip-/Damagekarten offenlegt.

Akzeptanzkriterien

- Evil Twin kann als Killer pumpen/brechen und verhindert getrennt davon nur erlaubten Net/Core Damage.
- Mehrere Kopien haben instanzsichere Prevention-Zähler ohne Action-ID-Kollision.
- PublicEvents enthalten Quelle und Zahlen, aber keine privaten Karteninhalte.
- Replay mit gleicher Seed-/Actionfolge produziert identischen StateHash.

### onr_v1_086_forged-activation-orders - Forged Activation Orders

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen

Forged Activation Orders hat bereits einen engen V1.9.22-Resolver: Runner wählt öffentlich eine unrezzte ICE, danach entscheidet die Korp öffentlich zwischen Rez gegen Kosten und Trash. Der historische WIP-Vermerk nennt bereits eine gefixte interne-ID-Redaktion; genau diese Grenze ist weiter kritisch. Die Nachhärtung sollte Mehrziel-/Kosten-Drift abdecken: ICE kann zwischen Runner-Choice und Korp-Choice gerezzt, getrasht, verschoben oder kostenmodifiziert werden. Die Chronik muss für beide Ergebniszweige eindeutig sein, ohne interne CardInstance-IDs in sichtbaren Choice-Optionen.

Notwendige Umsetzung

- Bestehenden Resolver um fokussierte Multi-ICE-Regression erweitern: gleiche Serverpositionen, mehrere unrezzte ICE und servergebundene PublicLabels.
- Korp-Choice erneut validieren: Ziel noch unrezzed, installiert und ICE; Rez-Kosten aktuell berechnen; bei zu wenig Credits nur Trash oder sauberer Fehler.
- PublicPayload-Leakscan für `choice.options.value`, `publicLabel`, Reconnect-Payload und Replay-Ereignisse ergänzen.
- Branch-Tests für Rez und Trash mit StateHash-Vergleich ergänzen.

Akzeptanzkriterien

- Runner kann nur legale unrezzte ICE-Ziele wählen; Korp kann keine stale oder verschobene ICE auflösen.
- Rez-Zweig bezahlt aktuelle Kosten und rezzed die Ziel-ICE; Trash-Zweig bewegt sie korrekt nach Archives.
- Sichtbare Payloads zeigen nur öffentliche Positions-/Serverlabels.
- Beide Branches sind replay-/StateHash-stabil.

### onr_v1_137_parraline-5750 - Parraline 5750

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen

Parraline 5750 ist als Runner-Hardware-Deck mit Install-LegalAction, Installkosten 0 und Memory/MU-Oberfläche im V1.9.22-Pool. Der aktuelle Text markiert per-card Effekte als LegalAction-gated; der Spotcheck sollte deshalb prüfen, ob die Karte wirklich nur den bestätigten Deck-/Memory-Vertrag abbildet und keine unbestätigten Zusatzfähigkeiten stillschweigend simuliert. Chronik und PublicPayload sind bei Hardware meist schlicht, aber MU-Änderungen und Deck-Einzigartigkeit müssen für Replay und Deckvalidierung stabil bleiben.

Notwendige Umsetzung

- Exakten Parraline-Vertrag gegen lokale Faktenbasis festziehen: Installkosten, Deck-Subtype, MU-/Memory-Wert, Deck-Einzigartigkeit und keine erfundene Zusatzfähigkeit.
- Install-LegalAction um fokussierten Test für falsche Seite, stale Version, Doppelinstallation/Deck-Konflikt und MU-Auswirkung ergänzen.
- Katalog-/AI-Hint-Kontrakt prüfen: AI darf die Karte nur nach sichtbarer MU-/Deck-Funktion bewerten.
- PublicPayload-/Reconnect-Test ergänzen, dass keine verdeckten Hand-/Stackdaten durch Install oder Deck-Konflikt sichtbar werden.

Akzeptanzkriterien

- Parraline installiert legal mit exakt bestätigtem Kosten-/MU-/Deck-Verhalten.
- Ein zweites Deck-Hardware-Konfliktszenario wird deterministisch abgelehnt oder nach bestehendem Deck-Unique-Vertrag ersetzt.
- AI-Hints und Katalogstatus beschreiben keine nicht implementierte Fähigkeit.
- Replay/StateHash bleibt über Install, Ablehnung und Reconnect stabil.

### onr_v1_149_access-to-arasaka - Access to Arasaka

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen

Access to Arasaka ist eine Runner-Resource mit `baseLink: 1` und Trace-/Link-Mechanik. Das Risiko liegt nicht im Install selbst, sondern in Trace-Fenstern: Base-Link darf pro Trace exakt einmal aus der installierten, aktiven Quelle einfließen, muss nach Trash/Tag-Resource-Entfernung sofort verschwinden und darf im PublicPayload nicht als geheime Runner-Planungsinformation überzeichnet werden. Nach früheren Trace-Link-Spotchecks ist die Einmaligkeit der Base-Link-Quelle ein besonders relevantes Regressionsthema.

Notwendige Umsetzung

- Trace-Regression mit Access to Arasaka als einziger Base-Link-Quelle ergänzen.
- Mehrere Link-Resources und Entfernen/Trashen vor dem Bid-Fenster testen; Base-Link darf nicht doppelt und nicht stale zählen.
- LegalAction/applyAction für Trace-Bids prüfen: side, `stateVersion`, Bid-Limit und sichtbarer Linkwert.
- Chronik muss Base-Link-Beitrag und Trace-Ergebnis erklären, ohne Runner-Hand/Stackdaten zu leaken.

Akzeptanzkriterien

- Installiertes Access to Arasaka erhöht die Trace-Link-Basis genau um 1.
- Entfernte oder nicht installierte Kopien beeinflussen keine Trace-Bids.
- Corp- und Runner-Bids bleiben aus LegalActions abgeleitet und werden in `applyAction` erneut validiert.
- Trace-Replay inklusive Erfolg/Misserfolg produziert stabile Events und StateHash.

### onr_v1_187_wilson-weeflerunner-apprentice - Wilson, Weeflerunner Apprentice

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen

Wilson ist eine einzigartige Runner-Resource zur Meat-Damage-Prevention, einmal pro Turn. Kritisch sind das Timing des Prevention-Fensters, Unique-Install, Getaggt-/Resource-Trash-Interaktionen und der Flatline-Randfall: Die Karte darf genau 1 Meat Damage verhindern, aber keine Net/Core-Schäden und keine bereits abgeschlossene Flatline rückwirkend reparieren. PublicPayload darf die Anzahl getrashter Gripkarten nicht aus Einzelkarten ableiten.

Notwendige Umsetzung

- Fokussierte Tests für 1 Meat Damage Prevention, Mehrschaden mit Restschaden, Turn-Reset und Nicht-Meat-Negativfälle ergänzen.
- Unique-Resource-Install und Resource-Trash vor offenem Prevention-Fenster revalidieren.
- Optionalität/Pass-Fallback im Prevention-Fenster prüfen, damit Runner nicht zu einem illegalen oder schlechten Prevention-Choice gezwungen wird.
- Chronik-/Payload-Test für Flatline-nahen Schaden ergänzen.

Akzeptanzkriterien

- Wilson verhindert höchstens 1 Meat Damage pro Turn und nur aus installierter Quelle.
- Nach Resource-Trash, falscher Seite oder stale `stateVersion` wird Prevention abgelehnt.
- Schadenstrash bleibt privat; öffentliche Events enthalten nur Beträge, Schadensart und Quelle.
- Flatline-/Nicht-Flatline-Ergebnis ist deterministisch und replay-stabil.

### onr_v1_191_black-ice-quality-assurance - Black Ice Quality Assurance

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen

Black Ice Quality Assurance ist eine Research-Agenda mit globalem Black-ICE-Modifier, persistentem Sonderzustand und Hidden-Zone-Support-Oberfläche. Das ist eine der risikoreicheren Karten dieser Auswahl, weil Score-/Steal-Zonen, öffentliche Modifierquellen, Black-ICE-Filter und mögliche Reveal-/Known-Position-Daten zusammenkommen. Die Nachhärtung sollte beweisen, dass nur gültige öffentliche Modifier wirken und dass keine verdeckten R&D-/HQ-/Archives-Informationen über PlayerViews, KI-Input oder Replay preisgegeben werden.

Notwendige Umsetzung

- Score-/Steal-Branch prüfen: Modifier nur in der regelkonformen Zone aktiv, mit öffentlicher Quelle und sauberem Entfernen bei Zustandswechsel.
- Black-ICE-Filter gegen Subtype-/Definition-Drift testen; Nicht-Black-ICE darf nicht gebufft werden.
- Hidden-Zone-Teilpfade mit Redaction-Barriere, Known-Position-Invalidierung nach Shuffle/Reorder und Reconnect-Payload testen.
- Chroniktest ergänzen, der Modifierquelle, betroffene ICE und Stärkeänderung payloadfähig macht.

Akzeptanzkriterien

- Der globale Modifier wirkt nur auf legale Black-ICE-Ziele und ist nach Quelle nachvollziehbar.
- Score-/Steal-/Trash-/Zonewechsel entfernen oder aktivieren den Zustand deterministisch.
- Hidden-Zone-Ereignisse geben keine verdeckten Kartenidentitäten preis.
- Replay/StateHash bleibt bei Modifier-Layering und Hidden-Zone-Operationen stabil.

### onr_v1_243_fetch-4-0-1 - Fetch 4.0.1

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen

Fetch 4.0.1 ist ICE mit Trace-3-Subroutine und Tag bei erfolgreichem Trace. Der Release-Stand hat Manifestparität, Runtime und AI-Support; der Nachtest sollte die Klassiker absichern: Subroutine nur bei unbroken Resolution, Bid-Fenster aus LegalActions, Link-/Credit-Limits, Tag nur bei Erfolg, und kein Ergebniswissen im KI-Input vor Abschluss des Trace. Bei RezCost 0 ist zusätzlich wichtig, dass Rez- und Encounter-Timing nicht durch Kostenfreiheit Abkürzungen nehmen.

Notwendige Umsetzung

- Focus-Test für Fetch: RezCost 0, Encounter, unbroken Trace 3, Corp-/Runner-Bids, Erfolg gibt genau 1 Tag.
- Negativfälle ergänzen: gebrochene Subroutine, Trace-Misserfolg, Runner ohne Credits, stale Bid-Aktion.
- PublicPayload/Chronik für Trace-Start, Bids, Ergebnis und Tag prüfen.
- AI-Input vor dem Ergebnis auf fehlendes Trace-Ergebniswissen scannen.

Akzeptanzkriterien

- Fetch taggt nur nach erfolgreichem unbroken Trace.
- Alle Bid-Aktionen stammen aus LegalActions und werden in `applyAction` erneut gegen Seite, Version und Credits geprüft.
- PublicEvents zeigen Trace-Zahlen, aber kein zukünftiges Ergebnis vor der Auflösung.
- Replay mit gleichem Seed und gleicher Actionfolge ist StateHash-stabil.

### onr_v1_264_rex - Rex

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen

Rex ist ein weiteres Trace-3-Tag-ICE, aber mit anderem Rez-/Stärkeprofil und V1.9.14-Trace-Link-Resolver. Der Wert des Nachtests liegt im Vergleich zu Fetch: gleicher Trace-Ausgang, andere ICE-Definition, anderer Release-Slice. Dadurch lassen sich generische Trace-Subroutine-Pfade gegen cardId-spezifische Abweichungen absichern. Kritisch sind Subroutine-ID-Stabilität, Break/Continue-Revalidation und doppelte Kopien.

Notwendige Umsetzung

- Rex-spezifische Regression ergänzen: RezCost 4, Strength 3, Trace 3, Tag bei Erfolg.
- Zwei Rex-Kopien in einem Server oder in verschiedenen Servern testen, damit Subroutine-/Action-IDs nicht kollidieren.
- Gebrochene Subroutine und nicht ausreichende Credits für Rez/Trace-Bid prüfen.
- Chronik muss Rex als Quelle ausweisen, nicht nur generisch "Trace-ICE".

Akzeptanzkriterien

- Rex verhält sich cardId- und instanzsicher, auch bei mehreren Kopien.
- Break/Continue/Trace-Bid-Aktionen sind side- und stateVersion-sicher.
- Trace-Misserfolg oder gebrochene Subroutine erzeugt keinen Tag.
- PublicPayload und Replay bleiben deckungsgleich mit Fetch, aber mit korrekter Rex-Quelle.

### onr_v1_309_bbs-whispering-campaign - BBS Whispering Campaign

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen

BBS Whispering Campaign ist ein Corp-Asset mit Campaign-/Economy- und Hosting-Signalen aus dem V1.9.17-Slice. Die aktuelle Shared-Definition beschreibt generische Asset-/Node-Behandlung; genau hier liegt das Risiko: Eine decklegale Karte darf nicht nur als install/rez/trash-Schale durchgehen, wenn Economy oder Hosting spielrelevant sind. Der Nachtest soll klären, welche Fähigkeit tatsächlich implementiert ist, ob sie rezzed-only ist und wie Host-/Hosted-Lifecycle beim Trash abgebildet wird.

Notwendige Umsetzung

- Lokalen Vertrag aus V1.9.17-Artefakten gegen Runtime prüfen: rezzed-only Economy, Hosting-Signale, Trash-on-access und Archives-Ziel.
- Falls eine aktive oder Start-of-turn-Economy existiert, LegalAction/applyAction mit Kosten, Seite, `stateVersion`, Quelle und Self-/Host-Trash härten.
- Host-Trash-Kaskade prüfen: gehostete Karten bewegen deterministisch und ohne Hidden-Info-Leak.
- Chronik-/AI-Test ergänzen, damit AI den Asset-Wert nicht aus nicht implementierten Fähigkeiten ableitet.

Akzeptanzkriterien

- BBS Whispering Campaign hat einen explizit getesteten, regelkonformen Runtime-Vertrag oder einen klaren No-op-/Shell-Guard mit Katalog-/AI-Abgleich.
- Rezzed-only und Trash-on-access werden korrekt revalidiert.
- Hosting-/Hosted-Zustände sind public soweit installiert/rezzed sichtbar, aber ohne verdeckte Hand-/R&D-Information.
- StateHash bleibt über Rez, Ability und Trash-Kaskade stabil.

### onr_v1_333_omniscience-foundation - Omniscience Foundation

Bewertung: Engine, Chronik, Tests, Hidden-Info/Replay/StateHash, Fehlende Haertungen

Omniscience Foundation ist ein Corp-Gray-Ops-Asset im generischen Asset-/Node-Resolver. Lokale Errata-Hinweise betonen, dass die Wirkung nur aus dem In-Play-Zustand heraus relevant ist; damit ist die wichtigste Härtung ein strikter Zone-/Rez-/Trash-Guard. Falls die aktuelle Runtime nur Install/Rez/Trash abbildet, muss der Katalog-/AI-Vertrag genau das widerspiegeln. Falls eine aktive Fähigkeit existiert, braucht sie explizite LegalActions und darf nicht aus HQ, R&D, Archives oder getrashtem Zustand feuern.

Notwendige Umsetzung

- Runtime-Vertrag prüfen: Shell-Asset, aktive Fähigkeit oder passiver In-play-Effekt.
- In-play-Guard ergänzen: nur installiert/rezzed, nicht aus HQ/R&D/Archives/Trash, nicht nach Derez/Trash.
- PublicPayload und Chronik für Aktivierung/No-op/Trash-on-access härten.
- AI-Hint gegen tatsächlichen Engine-Vertrag abgleichen; keine Strategie auf nicht implementierter Gray-Ops-Wirkung.

Akzeptanzkriterien

- Omniscience Foundation löst nur aus dem erlaubten In-play-Zustand aus.
- Falsche Zone, stale Aktion, falsche Seite und getrashte Quelle werden in `applyAction` abgelehnt.
- Öffentliche Events verraten keine verdeckten Korp-Karten.
- AI, Katalog und Engine beschreiben denselben Fähigkeitsscope.

## Gesamtplan

1. Zuerst die bestehenden Kartenverträge aus Shared-Definition, Manifest, Mechanics-Coverage und AI-Hints je Karte abgleichen.
2. Danach fokussierte Engine-Regressions für die drei Cluster umsetzen: Trace/Link (`Access to Arasaka`, `Fetch 4.0.1`, `Rex`), Prevention/Hardware (`Evil Twin`, `Wilson`, `Parraline 5750`) und Corp-Assets/Agenda (`Black Ice Quality Assurance`, `BBS Whispering Campaign`, `Omniscience Foundation`) plus per-card Event (`Forged Activation Orders`).
3. Für jede Karte LegalAction-Erzeugung und `applyAction`-Revalidation getrennt prüfen: Seite, `actionId`, `stateVersion`, Timingpunkt, Kosten, Quelle, Ziel und Choice-Inhalt.
4. PublicPayload-/PlayerView-/Reconnect-/KI-Input-Leakscan nachziehen, besonders für Forged-Activation-Orders-Choices, Hidden-Zone-Support und Damage-/Trace-Ergebnisfenster.
5. Replay-/StateHash-Smokes mit mindestens einem Positiv- und einem Negativpfad pro Cluster ergänzen.

## Empfohlene Checks

- `pnpm --filter @netgrid/engine test -- --runInBand`
- `pnpm --filter @netgrid/catalog test -- --runInBand`
- `pnpm --filter @netgrid/ai test -- --runInBand`
- `pnpm typecheck`
- Zusatz-Leakscan: PlayerViews/PublicEvents/Reconnect-Payloads für die zehn Card IDs nach internen CardInstance-IDs, verdeckten Zoneinhalten und nicht redigierten Choice-Werten durchsuchen.

## Umsetzungsergebnis 2026-05-16

Status: `done`

Umgesetzt wurden fokussierte Engine-Härtungen und Vertragskorrekturen für das Trace-/Prevention-/Asset-Paket:

- `Parraline 5750`: Shared-Vertrag auf Installkosten 5, +1 MU, 1 recurring Icebreaker-Run-Credit und Deck-Einzigartigkeit korrigiert; AI-Hint und V1.9.22-Contract-Matrix nachgezogen.
- `Black Ice Quality Assurance`: scored-only Black-ICE-Modifier ergänzt; Runner-ScoreArea-Drift aktiviert keinen Korp-Modifier.
- `Evil Twin` und `Wilson, Weeflerunner Apprentice`: Prevention-Pfade gegen Turn-Limit, stale Choices, installierte Quelle und PublicPayload-Redaktion geprüft.
- `Forged Activation Orders`: öffentliche Multi-ICE-Zielwahl, redigierte Choice-Optionen, Trash-Branch und stale Ziel-Drift vor der Korp-Choice abgesichert.
- `Access to Arasaka`, `Fetch 4.0.1` und `Rex`: Trace-/Link-Pfade mit Base-Link-Quelle, Quellentfernung, Rez-Kosten und Tag-Ergebnis abgesichert.
- `BBS Whispering Campaign` und `Omniscience Foundation`: rezzed-only Asset-/Shell-Guards gegen entfernte Quellen und nicht implementierte Hidden-Info-Fähigkeiten abgesichert.

Aktualisierte Artefakte:

- `packages/shared/src/index.ts`
- `packages/engine/src/index.ts`
- `packages/engine/src/index.test.ts`
- `data/ai/ai-card-hints-active.json`
- `data/rules/v1922-resolver-contracts.json`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_2026_05_15_TRACE_PREVENTION_ASSETS_IMPLEMENTATION.md`
- `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`
- `data/reports/originalset-card-spotcheck-register.json`
- `KI-Wissen-NETGRID/03 Betrieb/Log 2026-05.md`

Pflichtchecks:

- `corepack pnpm --filter @netgrid/engine test` - grün, 412 Tests.
- `corepack pnpm --filter @netgrid/web test -- chronicle.test.ts` - grün, 131 Tests.
- `corepack pnpm --filter @netgrid/catalog test` - grün, 48 Tests.
- `corepack pnpm typecheck` - grün.

Commit-Status:

- Lokaler Commit wurde nach Worktree-Gitdir-Schreibtest erfolgreich erstellt.
