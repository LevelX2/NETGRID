---
activityId: act-2026-07-26-corporate-downsizing-choice-outcome-visibility
status: inbox
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-07-26
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Corporate Downsizing im Entscheidungsfenster und in der Chronik konkret auflösen

## Ziel

Die öffentliche Auflösung von `Corporate Downsizing` soll im Aktionsfenster und in der Spielchronik konkret zeigen, ob und welche HQ-Agenden die Korp vorgezeigt hat, wie viele Credits sie dafür erhalten hat und dass die gewählten Karten in R&D gemischt wurden.

## Kontext und Quellen

- Nutzerbeobachtung vom 2026-07-26: Die Korp-KI scorete `Corporate Downsizing`. Danach erschien im Aktionsfenster nur eine kurze generische Meldung, dass die Korp-KI eine Entscheidung getroffen beziehungsweise beantwortet habe; in der Spielchronik erschien keine entsprechende Auflösung.
- Im beobachteten Spiel blieben die Credits offenbar unverändert. Das spricht für eine Auswahl von null Agenden, ist ohne Match-ID oder Eventpayload aber nur eine begründete Rekonstruktion.
- Kartenanker: `onr_v1_194_corporate-downsizing`.
- Regeltext: Beim Scoren darf die Korp eine beliebige Anzahl von in HQ gelagerten Agenden dem Runner zeigen, erhält Credits in Höhe des Doppelten ihrer kombinierten Agendapunkte und mischt diese Karten anschließend in R&D.
- Engine-Anker: `packages/engine/src/game/hidden-zone/corp-zone-choice-handlers.ts` löst den Choice als `hiddenZoneAction: "scored_agenda_hq_agenda_shuffle_credits"` auf und liefert bereits `sourceDefinitionId`, `publicRevealDefinitionIds`, `shownCardDefinitionIds`, `shownCount`, `shuffledIntoRndCount`, `combinedAgendaPoints` und `gainedCredits` im öffentlichen Payload.
- Web-Anker: `apps/web/app/chronicle.ts` besitzt für diesen `hiddenZoneAction` noch keinen spezifischen `resolve_choice`-Formatter. Der generische Fallback `eine Entscheidung beantwortet` wird von `shouldSuppressChronicleEventItem(...)` aus der Chronik entfernt.
- `apps/web/app/action-cues.ts` übernimmt Titel und Beschreibung aus `formatChronicleEvent(...)`; eine konkrete gemeinsame Formatierung kann daher sowohl Aktionsfenster als auch Chronik bedienen.
- Verwandte erledigte Pakete:
  - `docs/activities/done/act-2026-05-17-corporate-negotiating-center-runner-reveal.md`
  - `docs/activities/done/act-2026-05-23-synchronized-attack-hq-chronicle-summary.md`
  - `docs/activities/done/act-2026-05-17-effect-event-chronicle-visibility-audit.md`

## Scope

- Für `resolve_choice` mit `hiddenZoneAction: "scored_agenda_hq_agenda_shuffle_credits"` eine konkrete, gemeinsame Web-Formatierung ergänzen.
- Den Nullauswahl-Fall sichtbar auflösen, sinngemäß:
  - `Die Korp-KI hat mit Corporate Downsizing keine Agenda aus HQ vorgezeigt und 0 Credits erhalten.`
- Den Auswahl-Fall sichtbar auflösen, sinngemäß:
  - `Die Korp-KI hat mit Corporate Downsizing zwei Agenden aus HQ vorgezeigt: <Agenda A> und <Agenda B>. Sie hat dafür <N> Credits erhalten und die Karten in R&D gemischt.`
- Kartenzahl, Singular/Plural, kombinierte Agendapunkte, Creditgewinn und R&D-Shuffle konsistent aus den öffentlichen Payloadfeldern darstellen.
- Bei menschlicher Korp und je nach Betrachterseite dieselbe fachliche Aussage mit der vorhandenen passenden Spielerbezeichnung ausgeben.
- Sicherstellen, dass die spezifische Auflösung nicht mehr als generischer Choice-Fallback aus der Spielchronik unterdrückt wird.
- Fokussierte Web-Regressionstests für Aktionsfenster und Chronik ergänzen:
  - null ausgewählte Agenden und 0 Credits,
  - mindestens zwei ausgewählte Agenden mit Kartentiteln, kombinierten Agendapunkten, Credits und R&D-Shuffle,
  - Korp-KI sowie mindestens eine nicht-KI-/Perspektivvariante.

## Nicht im Scope

- Keine Änderung an der Auswahlentscheidung oder Strategie der Korp-KI.
- Keine Änderung am Kartenresolver, an LegalActions, Choice-Revalidation, Creditberechnung, Shuffle, Zufallsaufzeichnung, Replay oder StateHash.
- Kein allgemeines Redesign des Aktionsfensters, der Chronik oder des Public-Reveal-Systems.
- Keine zusätzliche dauerhafte Review-Anzeige, sofern die vorhandene Aktionshinweisfläche die konkrete Auflösung vollständig und lesbar darstellen kann.
- Keine Offenlegung nicht gewählter HQ-Karten, ihrer Anzahl, Identitäten, Instanz-IDs oder Positionen. Insbesondere darf aus einer Nullauswahl nicht abgeleitet oder angezeigt werden, ob weitere Agenden in HQ vorhanden waren.

## Akzeptanzkriterien

- [ ] Bei null ausgewählten Agenden nennt das Aktionsfenster `Corporate Downsizing`, die Nullauswahl und 0 erhaltene Credits statt nur einer generischen Entscheidungsmeldung.
- [ ] Derselbe Nullauswahl-Fall erscheint als konkrete, nicht unterdrückte Zeile in der Spielchronik.
- [ ] Bei mindestens einer ausgewählten Agenda zeigen Aktionsfenster und Chronik ausschließlich die tatsächlich vorgezeigten Agendatitel, den Creditgewinn und den R&D-Shuffle.
- [ ] Anzahl, Singular/Plural, kombinierte Agendapunkte und Creditgewinn widersprechen einander nicht.
- [ ] Die Darstellung funktioniert für KI- und menschliche Korp mit passender Spielerbezeichnung.
- [ ] Nicht gewählte HQ-Karten und die gesamte Kandidatenmenge bleiben in UI, Chronik und Tests verborgen.
- [ ] Fokussierte Tests für `apps/web/app/chronicle.ts` und `apps/web/app/action-cues.ts` decken Null- und Auswahlfall ab.

## Umsetzungshinweise

- Bevorzugt den spezifischen Formatter in `apps/web/app/chronicle.ts` ergänzen und die bestehende Wiederverwendung durch `deriveOpponentActionCues(...)` erhalten, statt getrennte Texte für Fenster und Chronik einzuführen.
- Für Kartentitel nur `publicRevealDefinitionIds`, `shownCardDefinitionIds` oder die bereits redigierten öffentlichen Titel verwenden. Niemals Choice-Optionen oder private HQ-Daten auswerten.
- Der Nullfall muss anhand von `shownCount: 0` beziehungsweise den leeren Revealfeldern funktionieren und darf `hqAgendaChoiceCount` nicht als öffentliche Aussage verwenden.
- `shouldSuppressChronicleEventItem(...)` sollte die neue spezifische Formatierung automatisch behalten; die Unterdrückungslogik nicht pauschal für alle generischen Choices öffnen.
- Die bestehenden Muster für `Corporate Negotiating Center` und `Synchronized Attack on HQ` als Text-, Reveal- und Hidden-Info-Referenz nutzen.

## Ergebnisnotiz

Noch offen.
