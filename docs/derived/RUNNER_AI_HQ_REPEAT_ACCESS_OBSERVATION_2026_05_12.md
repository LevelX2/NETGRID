# Runner-KI HQ Repeat Access Observation

Stand: 2026-05-12
Status: umgesetzt

## Beobachtung

In einem lokalen Human-Korp-vs-Runner-KI-Spiel lief die Runner-KI wiederholt auf HQ, obwohl die Korp nur eine Karte in HQ hatte. Beim ersten Zugriff sah der Runner `Overtime Incentives`; die Karte blieb danach in HQ und war für den Runner in der beobachteten Lage nicht sinnvoll verwertbar. Trotzdem bewertete die Runner-KI weitere HQ-Runs hoch genug, um mehrfach erneut auf HQ zu laufen.

Folgebeobachtung im selben Playtest-Strang: Die Runner-KI startete wiederholt HQ-Runs mit 0 Credits gegen ein sichtbares, gerezztes `π in the 'Face` auf HQ. Ein `Simple Killer` war zwar installiert, konnte aber ohne Credits weder auf Stärke 3 pumpen noch die End-the-run-Subroutine brechen.

## Einordnung

Das ist keine Engine- oder Visibility-Regelverletzung. Der Zugriff auf HQ ist legal, und die Karte wurde nur nach einem tatsächlichen Zugriff sichtbar. Der Fehler liegt in der Runner-KI-Bewertung:

- Die planbasierte Runner-KI hat seit V1.4.1 einen eigenen `pressure_hq`-Plan.
- Der Belief State hat seit V1.4.2 `R&D access freshness` und wertet wiederholte R&D-Runs auf dieselbe bekannte Topkarte ab.
- Die V1.9.8-Positionsmemory kann side-sicher beobachtete Kartenpositionen aus PublicEvents ableiten.
- Im aktuellen Bewertungsmodell wird diese Positionsmemory aber nicht genutzt, um einen wiederholten HQ-Run auf eine bekannte einzelne, unveränderte und wertlose HQ-Karte stark abzuwerten.

Damit bleibt HQ in Ein-Karten-Situationen zu attraktiv, weil `pressure_hq` weiter über allgemeine sichtbare Lage, Handgröße, Serverhistorie und Unsicherheit bewertet wird.

## Umgesetzter Aspekt

Der Härtungspunkt `known HQ hand value` ist umgesetzt. Der Singleton-Fall ist nur der einfachste Spezialfall.

Mindestvertrag:

- Die Runner-KI darf nur side-sichere, vom Runner tatsächlich gesehene HQ-Access-Fakten merken.
- Wenn alle aktuell in HQ befindlichen Karten side-sicher bekannt sind und aus Sicht des Runners keinen Run-Ertrag mehr haben, soll ein weiterer normaler HQ-Run deutlich abgewertet werden.
- Die KI muss die bekannte HQ-Hand als side-sichere Menge oder Multimenge modellieren: Zugriff/Reveals können Karten hinzufügen; Korp-Draw, Rückkehr nach HQ oder unbekannte Hidden-Zone-Bewegungen machen die bekannte Vollständigkeit ganz oder teilweise ungültig.
- Abgänge aus HQ müssen die gemerkte bekannte Hand anpassen, soweit der Abgang side-sicher identifizierbar ist, z. B. durch `play_operation`, `score_agenda`, `discard`, `trash`, `steal` oder öffentlich/Runner-sichtbar aufgelöste Moves. Wenn ein Abgang nicht eindeutig einer bekannten Karte zugeordnet werden kann, muss die KI konservativ invalidieren statt verdeckte Information zu raten.
- Die Abwertung muss aufgehoben werden, sobald HQ plausibel nicht mehr vollständig bekannt ist oder eine bekannte Karte wieder echten Wert hat, z. B. durch neue HQ-Karte, Shuffle, Arrange, Swap, unbekannten Move, relevante Score-/Steal-/Trash-Option oder Karten-Sondernutzen.
- Agenda-, Trash-, Ambush-, Multiaccess- und Karten-Sonderfälle dürfen nicht pauschal entwertet werden. Wenn ein legaler Runner-Effekt wiederholte erfolgreiche HQ-Runs belohnt, muss dieser Nutzen separat bewertet werden.
- DecisionDebug soll den Grund side-sicher benennen, z. B. `known_hq_hand_not_fresh`, `known_hq_hand_low_value` oder im Singleton-Spezialfall `known_hq_singleton_not_fresh`.

## Umsetzungsschicht

Der AI-Level-2-Härtungsslice liegt in `packages/ai/src/belief-state.ts` und `packages/ai/src/runner-plans.ts`:

- Singleton-Spezialfall explizit als einfache Regression absichern.
- Belief-/Memory-Ableitung für bekannte HQ-Handkarten als side-sichere Menge/Multimenge, inklusive Vollständigkeitsflag gegenüber `opponent.handCount`.
- Anpassungs- und Invalidierungsregeln für HQ-Zugänge und HQ-Abgänge.
- Score-Penalty in `evaluateServerAccessValue` für `pressure_hq` und ggf. `safe_probe_run`.
- Testfixture: eine bekannte einzelne HQ-Operation wie `Overtime Incentives` darf nach unverändertem Zugriff nicht wiederholt bester Plan bleiben.
- Testfixture: mehrere bekannte HQ-Karten, die alle aktuell keinen Run-Ertrag haben, müssen zusammen als niedriger HQ-Wert erkannt werden.
- Positivfixtures: Nach Korp-Draw, unbekanntem Abgang, Rückkehr nach HQ oder sonstiger HQ-Veränderung darf HQ-Druck wieder normal bewertet werden; Runner-HQ-Payoff-Karten bleiben berücksichtigbar.

## Folgehärtung: sichtbare ICE-Brechkosten

Die Runner-KI berücksichtigt jetzt bei sichtbarem, gerezztem End-the-run-ICE auf dem Zielserver, ob installierte passende Breaker die Subroutine mit aktueller Stärke und aktuellen Credits tatsächlich brechen können. Dafür wird side-sicher aus PlayerView-Daten eine sichtbare Mindest-Brechkostenabschätzung über den bekannten gerezzten ICE-Pfad gebildet, nicht nur über das äußerste ICE.

Beispiel: `Simple Killer` gegen `π in the 'Face` kostet bei Stärke 1 gegen Stärke 3 mindestens 3 Credits: zweimal pumpen und einmal brechen. Bei 0 Credits wird ein weiterer HQ-Run als sichtbar blockiert bewertet und gegenüber Economy-Aktionen deutlich abgewertet.

Bei mehreren sichtbaren gerezzten ICE werden die sichtbaren End-the-run-Brechkosten über den Pfad kumuliert. Beispiel: `Simple Killer` mit 3 Credits kann ein einzelnes Stärke-3-Sentry gerade brechen, aber nicht zwei sichtbare Stärke-3-Sentry-Stopper auf demselben HQ-Pfad; der Gesamtpfad wird deshalb blockiert bewertet.

## Verifikation

- HQ-Handwert-Härtung: `corepack pnpm --filter @netgrid/ai test -- src/index.test.ts`, `corepack pnpm --filter @netgrid/ai typecheck`, `corepack pnpm lint`, `corepack pnpm typecheck`, `corepack pnpm test`, `git diff --check`: pass.
- Folgehärtung sichtbare ICE-Brechkosten: `corepack pnpm --filter @netgrid/ai test -- src/index.test.ts`: pass, 87 Tests; `corepack pnpm --filter @netgrid/ai typecheck`: pass.

## Gate-Hinweis

Dieser Punkt darf den Hidden-Info-Vertrag nicht aufweichen. Die KI darf keine verdeckten HQ-Titel ableiten; sie darf nur die Fortdauer einer bereits rechtmäßig gesehenen und nicht invalidierten Information bewerten.
