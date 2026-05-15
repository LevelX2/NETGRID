---
jobId: spotcheck-2026-05-15-tagged-wall-breaker
status: ready_for_implementation
createdAt: 2026-05-15T20:10:00+01:00
requiresImplementation: true
priority: normal
cards:
  - cardId: onr_v1_014_codecracker
    title: Codecracker
  - cardId: onr_v1_244_filter
    title: Filter
  - cardId: onr_v1_293_netwatch-credit-voucher
    title: Netwatch Credit Voucher
  - cardId: onr_v1_253_laser-wire
    title: Laser Wire
  - cardId: onr_v1_265_rock-is-strong
    title: Rock Is Strong
  - cardId: onr_v1_302_scorched-earth
    title: Scorched Earth
  - cardId: onr_v1_238_data-wall-2-0
    title: Data Wall 2.0
  - cardId: onr_v1_278_wall-of-ice
    title: Wall of Ice
  - cardId: onr_v1_263_reinforced-wall
    title: Reinforced Wall
  - cardId: onr_v1_237_data-wall
    title: Data Wall
---

# Originalset-Spotcheck Job spotcheck-2026-05-15-tagged-wall-breaker

## Auswahlprüfung

Dieser Generatorlauf hat zuerst die Queue-Berichte unter `docs/derived/originalset-spotcheck-jobs/inbox/`, `in_progress/`, `done/` und `blocked/` sowie `docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md` und `data/reports/originalset-card-spotcheck-register.json` gelesen. Eine Karte wurde ausgeschlossen, sobald ihre Card ID in einer dieser Quellen vorkam.

Die Deduplizierung ergab 230 tabuierte Card IDs. Aus den decklegalen, AI-approvten O:NR-v1-Karten blieben 24 noch nicht nachgetestete Kandidaten. Die zehn Karten dieses Jobs wurden daraus gewichtet zufällig gezogen; bevorzugt wurden Resolver mit Timing-, Damage-, Tag-, Breaker-, ICE-, Hidden-Info- oder Replay-Bezug.

Die Auswahl besteht aus einem Runner-Code-Gate-Breaker, zwei Tagged-Operationen, mehreren hidden-until-rez ICE-Karten und drei Walls mit mehreren oder damage-relevanten Subroutinen. Der Umsetzungsjob soll keine neue Kartenfreischaltung vornehmen, sondern die bereits decklegalen Pfade gegen Side/Stale-Revalidation, PublicPayload, Chronik, Hidden-Info und Replay/StateHash nachhärten.

## Kartenbefunde

### onr_v1_014_codecracker - Codecracker

Bewertung: Engine

Codecracker ist als installierbarer Runner-Icebreaker mit `breakCost: 0`, `pumpCost: 1`, Stärke 0 und Code-Gate-Zieltyp modelliert. Der riskante Punkt ist nicht der Basispfad, sondern die Nullkosten-Break-Aktion: `LegalActions` dürfen nur während eines passenden Encounters gegen eine reale, ungebrochene Code-Gate-Subroutine entstehen, und `applyAction` muss denselben Source-, Encounter- und Subroutine-Zustand erneut prüfen.

Bewertung: Chronik

Die Chronik sollte Nullkosten-Breaks nicht als fehlende Zahlung oder No-op verschlucken. Für spätere Debuggability braucht jedes Break-Event SourceDefinition, Ziel-ICE, Subroutine-Index, gezahlte Kosten 0 und den finalen Broken-Status.

Bewertung: Tests

Vorhandene V1.1.2K-Tests decken Installation, Pump und generische Code-Gate-Break-Regeln ab. Es fehlt ein fokussierter Nachtest für Nullkosten-Break ohne Credit-Drift, Wrong-Subtype-Negativfall, Stale-Subroutine-Revalidation und Replay/StateHash nach einer Sequenz aus Pump plus mehreren Breaks.

Bewertung: Hidden-Info/Replay/StateHash

Der Runner darf vor Rez keine ICE-Identität erhalten. Nach Rez sind ICE-Titel und Subroutine-Zahl öffentlich, aber nicht mehr. Replay muss stabil bleiben, wenn mehrere gleichartige Codecracker oder mehrere Code-Gates installiert beziehungsweise encountered werden.

Bewertung: Fehlende Härtungen

Härten: actionId/sourceInstance statt nur Definition, Encounter-Bindung, Subroutine-Index, Kosten 0 als explizit legaler Wert, keine Break-Aktion nach Jack-out oder Run-Ende.

Notwendige Umsetzung

Ergänze einen fokussierten Engine-Testblock für Codecracker mit einem rezzed Code Gate und einem rezzed Nicht-Code-Gate. Prüfe LegalAction-Filter, applyAction-Revalidation, Nullkosten-Break, Pump-Kosten, Chronikpayload und Replay/StateHash.

Akzeptanzkriterien

- Codecracker erzeugt Break-LegalActions nur gegen Code-Gate-Subroutinen im aktiven Encounter.
- `applyAction` scheitert bei falscher Seite, stale `stateVersion`, falscher SourceInstance und falschem ICE-Subtype.
- Nullkosten-Break ändert keine Credits und wird in PublicEvents/Chronik eindeutig als bezahlte 0-Kosten-Aktion sichtbar.
- Replay und StateHash bleiben nach Pump-plus-Break-Sequenz stabil.

### onr_v1_244_filter - Filter

Bewertung: Engine

Filter ist ein rez-kostenfreies Code Gate mit genau einer End-the-run-Subroutine. Die scheinbar einfache Karte ist ein guter Guard gegen generische ICE-Resolver-Drift: Rez für 0 Credits, Encounter-Timing, Breakbarkeit durch Codecracker und End-the-run dürfen nicht über Wall- oder Sentry-Spezialfälle laufen.

Bewertung: Chronik

Die Chronik muss zwischen Rez für 0, Encounter-Fortsetzung, gebrochener ETR und ungelöster ETR unterscheiden. Ein 0-Credit-Rez darf nicht als kostenloser automatischer Reveal vor dem Runner-View erscheinen.

Bewertung: Tests

Legacy-Smokes decken einfache ICE-Verteidigung ab. Es fehlt ein fokussierter Test, dass Filter als Code Gate von Codecracker gebrochen wird, aber nicht von Wall-only-Breakern; ebenso fehlt ein expliziter 0-Rez-Cost-Payloadtest.

Bewertung: Hidden-Info/Replay/StateHash

Vor Rez darf der Runner Filter weder über Titel noch Subtype erkennen. Nach Rez darf der PublicPayload nur öffentliche ICE-Daten, Rez-Kosten und Subroutine-Status enthalten. Replay darf durch 0-Credit-Rez keinen Kostenpfad überspringen.

Bewertung: Fehlende Härtungen

Härten: Hidden-until-rez, 0-Rez-Kosten, Code-Gate-Subtype, Subroutine-Status und Run-End-Cleanup.

Notwendige Umsetzung

Ergänze Filter-spezifische Tests für Hidden-Info vor Rez, 0-Credit-Rez, Codecracker-Break und ungebrochene ETR-Auflösung.

Akzeptanzkriterien

- Runner-View enthält vor Rez weder `Filter` noch Code-Gate-Subtype aus verdeckter ICE-Identität.
- Rez für 0 Credits erzeugt PublicEvent mit Quelle, verändert Credits nicht negativ und deckt Filter erst danach auf.
- Codecracker kann die ETR-Subroutine brechen; ein Wall-only-Breaker darf keine LegalAction erhalten.
- Ungebrochene ETR beendet den Run mit sauberem Run-Cleanup und stabilem Replay/StateHash.

### onr_v1_293_netwatch-credit-voucher - Netwatch Credit Voucher

Bewertung: Engine

Die lokale Snapshot-Quelle beschreibt "Give Runner a tag, and gain 4", während die aktuelle Shared-/Engine-Definition im Workspace "gain 1 credit" auflöst. Dieser Spotcheck darf den Regelwert nicht still ändern, muss den Konflikt aber als Umsetzungsprüfpunkt markieren: vor Codeänderung ist zu klären, ob eine lokale Text-/Manifest-Drift vorliegt oder ob die Engine absichtlich mit dem alten 1-Credit-Vertrag läuft.

Bewertung: Chronik

Die Operation ist tagged-only und erzeugt sowohl Runner-Tag-Änderung als auch Korp-Credit-Änderung. Die Chronik muss Bedingungsprüfung, gespielte Operation, Tag-Zuwachs und Credit-Zuwachs ohne Handkarteninhalt abbilden.

Bewertung: Tests

Vorhandene Corp-Tag-Slice-Tests decken "nur bei Tag" und den bestehenden Credit-Zuwachs ab. Es fehlt ein Drift-Test gegen die lokale Snapshot-Erwartung beziehungsweise eine dokumentierte Entscheidung, welcher Wert führend ist.

Bewertung: Hidden-Info/Replay/StateHash

Der Payload darf keine Korp-HQ-Information außer der gespielten offenen Operation leaken. Replay muss stabil bleiben, wenn der Runner zwischen LegalAction-Erzeugung und applyAction den Tag verliert oder die Karte nicht mehr in HQ liegt.

Bewertung: Fehlende Härtungen

Härten: Text-/Engine-Wertkonflikt, Tagged-Revalidation, SourceInstance aus HQ, Side/Stale, Tag-Drift und PublicPayload.

Notwendige Umsetzung

Vor einer Verhaltensänderung die führende lokale Quelle prüfen. Danach entweder Engine/Shared/AI-Hints auf `gain 4` korrigieren oder den Snapshot-/Manifest-Konflikt dokumentiert auflösen. In beiden Fällen fokussierte Tests für No-tag, Tag-drift, Source-drift, Credit-Payload und Replay ergänzen.

Akzeptanzkriterien

- Der Umsetzungsbericht benennt die Entscheidung zum Credit-Wert und verweist auf die geprüfte Quelle.
- Die Operation ist ohne Runner-Tag weder in LegalActions sichtbar noch per stale applyAction spielbar.
- Beim gültigen Play werden genau ein Tag und der entschiedene Creditwert angewendet.
- PublicEvents nennen gespielte Operation, Tag-Zuwachs und Credit-Zuwachs, aber keine anderen HQ-Karten.

### onr_v1_253_laser-wire - Laser Wire

Bewertung: Engine

Laser Wire kombiniert Net Damage und ETR auf einer Wall. Entscheidend ist, dass die beiden Subroutinen getrennt indexiert, getrennt brechbar und in korrekter Reihenfolge auflösbar bleiben. Der Damage-Resolver darf den folgenden ETR-Resolver nicht überspringen und umgekehrt.

Bewertung: Chronik

Die Chronik sollte beide Subroutinen einzeln ausweisen: zuerst 1 Net Damage mit redigierter Trash-Zusammenfassung, danach ETR oder gebrochener ETR-Status.

Bewertung: Tests

Vorhandene V1.1.2K-Tests prüfen einfache Damage-ICE-Pressure. Es fehlt ein Teilbreak-Test: nur Damage brechen, nur ETR brechen, keine Subroutine brechen. Außerdem sollte kurzer Grip/Flatline als Laser-Wire-spezifische Variante geprüft werden.

Bewertung: Hidden-Info/Replay/StateHash

Net Damage muss zufällig/deterministisch aus der Grip trashes, ohne Kartentitel in PublicPayload, gegnerischem PlayerView oder Reconnect-Payload offenzulegen. RandomCounter und DamageSummary müssen replay-stabil sein.

Bewertung: Fehlende Härtungen

Härten: Subroutine-Index, Teilbreak-Reihenfolge, Damage-Redaction, Flatline-Grenze, Run-Ende nach ETR und Replay.

Notwendige Umsetzung

Ergänze Laser-Wire-Tests für alle drei Teilbreak-Kombinationen, inklusive kurzer Grip. Prüfe PublicPayload auf redigierte DamageSummary und StateHash-Stabilität.

Akzeptanzkriterien

- Damage- und ETR-Subroutine bleiben separat adressierbar und separat brechbar.
- Ungebrochener Damage trashes genau eine zufällige/private Grip-Karte redigiert.
- Ungebrochene ETR beendet den Run auch nach vorherigem Damage sauber.
- Replay/StateHash ist bei identischem Seed und gleicher Break-Sequenz identisch.

### onr_v1_265_rock-is-strong - Rock Is Strong

Bewertung: Engine

Rock Is Strong ist eine hohe Wall mit einfacher ETR-Subroutine. Als Nachtest ist sie wichtig, weil sie teure Rez-Kosten, hohe Stärke und generische Wall-Breaker-Pfade gegen Kosten-/Subtype-Drift absichert.

Bewertung: Chronik

Die Chronik muss Rez-Kosten 6, Stärke 5 und ETR-Auflösung sauber ausweisen, ohne die Karte vor Rez zu verraten.

Bewertung: Tests

Vorhandene Smokes prüfen einfache ICE-Verteidigung. Es fehlt ein fokussierter Test für nicht ausreichende Korp-Credits beim Rez, erfolgreiche Rez-Kostenzahlung, Wall-Breaker-Interaktion und Replay.

Bewertung: Hidden-Info/Replay/StateHash

Hidden-until-rez ist die wichtigste Sichtbarkeitsgrenze. Vor Rez darf der Runner aus Kosten-/Stärkefeldern keine Identität ableiten. Replay muss mit identischer Rez-/Break-Sequenz stabil bleiben.

Bewertung: Fehlende Härtungen

Härten: Rez-Kosten-Revalidation, Wall-Subtype, Breaker-Subtype, PublicPayload nach Rez, insufficient-credit-Negativfall.

Notwendige Umsetzung

Ergänze Rock-Is-Strong-Tests mit 5 Credits und 6 Credits, einem passenden Wall-Breaker und einem falschen Breaker-Subtype.

Akzeptanzkriterien

- Rez scheitert unter 6 Credits und verändert weder Credits noch Sichtbarkeit.
- Rez mit 6 Credits zieht genau 6 ab und veröffentlicht nur erlaubte ICE-Daten.
- Nur passende Wall-Breaker erhalten Break-LegalActions.
- ETR-Auflösung und Replay/StateHash sind stabil.

### onr_v1_302_scorched-earth - Scorched Earth

Bewertung: Engine

Scorched Earth ist tagged-only Meat Damage 4 mit Flatline-Relevanz. Der Resolver nutzt den generischen Damage-Operation-Pfad. Kritisch sind Tagged-Revalidation, Damage-Prevention-/Replacement-Fenster, Flatline-Auslösung und redigierte Grip-Trash-Auswahl.

Bewertung: Chronik

Die Chronik muss den Play der Operation, Bedingungsprüfung, Damage-Art, Damage-Menge, Prevention-Ergebnis und Flatline-Status trennen. PublicPayload darf keine getrashten Kartentitel enthalten.

Bewertung: Tests

Vorhandene Tests decken Tagged-Meat-Damage und einzelne Prevention-Pfade ab. Es fehlt ein enger Scorched-Earth-Nachtest mit Tag-Verlust zwischen LegalAction und applyAction, kurzer Grip, Flatline, Prevention-Cancel und Replay/StateHash.

Bewertung: Hidden-Info/Replay/StateHash

Meat Damage trashes private Grip-Karten. PublicEvents, Reconnect-Payloads und Replay dürfen nur Counts/Summaries enthalten. RandomDrawRecords müssen den Damage deterministisch machen, ohne Kartennamen öffentlich zu machen.

Bewertung: Fehlende Härtungen

Härten: Tag-drift, HQ-source-drift, Prevention-Fenster, Short-Grip-Flatline, redigierte DamageSummary, StateHash.

Notwendige Umsetzung

Ergänze Scorched-Earth-Tests für No-tag, Tag-drift stale action, gültiges 4-Meat-Damage, Prevention/Replacement und Flatline bei kurzer Grip. Prüfe PublicPayload-Leakscan und Replay.

Akzeptanzkriterien

- Ohne Tag gibt es keine LegalAction; stale applyAction nach Tag-Verlust scheitert.
- Gültiger Play verursacht exakt 4 Meat Damage vor Prevention/Replacement-Auswertung.
- Flatline wird bei unzureichender Grip korrekt ausgelöst.
- PublicPayload enthält Counts und Damage-Art, aber keine privaten Grip-Kartentitel.

### onr_v1_238_data-wall-2-0 - Data Wall 2.0

Bewertung: Engine

Data Wall 2.0 ist wegen historisch entschiedener Attributkorrektur relevant: Rez-Kosten 2, Stärke 1, Wall, ETR. Der Nachtest soll sicherstellen, dass die Korrektur in Shared, Catalog, Decklegalität, AI und Engine-Smokes nicht driftet.

Bewertung: Chronik

Rez-Event, Stärke, Subtype und ETR-Status müssen nach Rez öffentlich und konsistent sein. Vor Rez darf die korrigierte Identität nicht aus Payloads hervorgehen.

Bewertung: Tests

V1.0.5K hatte Tests für Korrektur, Sichtbarkeit und Replay. Es fehlt ein aktueller Regressionstest, der die Konfliktentscheidung von 2026-05-13 direkt gegen Runtime-Definition und PublicPayload spiegelt.

Bewertung: Hidden-Info/Replay/StateHash

Wie bei allen ICE-Karten gilt hidden-until-rez. Replay muss stabil bleiben, wenn Data Wall und Data Wall 2.0 parallel in Decks/Servern vorkommen und nicht durch ähnliche IDs verwechselt werden.

Bewertung: Fehlende Härtungen

Härten: Attributentscheidungs-Parität, ID-Verwechslung mit Data Wall, Rez-Kosten 2, Stärke 1, SourceInstance.

Notwendige Umsetzung

Ergänze einen gezielten Paritäts- und Engine-Test für Data Wall 2.0 gegen `onr-v1-card-attribute-conflict-decisions-2026-05-13.json` sowie einen parallelen Serverfall mit Data Wall.

Akzeptanzkriterien

- Runtime-Definition und PublicPayload zeigen nach Rez Rez-Kosten 2 und Stärke 1.
- Data Wall und Data Wall 2.0 bleiben in SourceDefinition, actionId und Replay getrennt.
- ETR-Auflösung beendet den korrekten Run auf dem korrekten Server.
- Vor Rez leakt weder Titel noch korrigierter Attributsatz.

### onr_v1_278_wall-of-ice - Wall of Ice

Bewertung: Engine

Wall of Ice ist in dieser Auswahl die dichteste ICE-Karte: zwei Net-Damage-Subroutinen und zwei ETR-Subroutinen. Die Engine muss vier getrennte Subroutine-Resolver in Reihenfolge, Teilbreak und Damage-Aggregation korrekt behandeln.

Bewertung: Chronik

Die Chronik muss die vier Subroutinen einzeln ausweisen. Damage darf aggregiert angezeigt werden, aber die Quelle und Subroutine-Reihenfolge müssen nachvollziehbar bleiben.

Bewertung: Tests

Vorhandene Tests prüfen generische Damage-ICE-Pressure und Attribute. Es fehlt ein fokussierter Vier-Subroutinen-Test mit Teilbreak-Matrix: beide Damage brechen, beide ETR brechen, nur erste ETR brechen, keine Subroutine brechen, kurzer Grip/Flatline.

Bewertung: Hidden-Info/Replay/StateHash

Zwei Net-Damage-Subroutinen erzeugen mehrere RandomDrawRecords. Deren Reihenfolge muss deterministisch sein und darf keine getrashten Kartentitel in PublicPayload oder Runner-fremde Views leaken.

Bewertung: Fehlende Härtungen

Härten: vier Subroutine-Indizes, Mehrfachdamage-Reihenfolge, DamageSummary-Redaction, Flatline nach erster oder zweiter Damage-Subroutine, ETR-Cleanup.

Notwendige Umsetzung

Ergänze einen Wall-of-Ice-spezifischen Testblock für Mehrfachsubroutinen, Teilbreak und Replay. Nutze Seed-Stabilität, um RandomDrawRecord-Reihenfolge und StateHash zu prüfen.

Akzeptanzkriterien

- Alle vier Subroutinen bleiben einzeln legal adressierbar.
- Zwei ungebrochene Damage-Subroutinen verursachen je exakt 2 Net Damage in deterministischer Reihenfolge.
- ETR-Subroutinen lösen nach Damage weiter aus, sofern der Run nicht bereits durch Flatline endet.
- PublicPayload bleibt redigiert; Replay/StateHash ist identisch bei gleichem Seed.

### onr_v1_263_reinforced-wall - Reinforced Wall

Bewertung: Engine

Reinforced Wall hat zwei ETR-Subroutinen und ist damit ein sauberer Test für doppelte gleichartige Subroutinen auf derselben ICE-Instanz. Die Engine darf nicht nur nach Subroutine-Typ deduplizieren.

Bewertung: Chronik

Die Chronik muss beide ETR-Subroutinen getrennt darstellen, auch wenn die erste ungebrochene ETR den Run beendet und die zweite faktisch nicht mehr relevant wird.

Bewertung: Tests

Vorhandene Smokes prüfen einfache Defense. Es fehlt ein Test, der erste und zweite ETR-Subroutine separat bricht und prüft, dass Index 0 und Index 1 nicht kollidieren.

Bewertung: Hidden-Info/Replay/StateHash

Vor Rez bleibt die Karte verborgen. Nach Rez dürfen beide Subroutinen öffentlich sein. Replay muss stabil bleiben, wenn nur die zweite Subroutine gebrochen ist und die erste den Run beendet.

Bewertung: Fehlende Härtungen

Härten: doppelte ETR-Indexierung, Teilbreak, SourceInstance, Break-Aktion gegen bereits gebrochene Subroutine, Run-End-Cleanup.

Notwendige Umsetzung

Ergänze Reinforced-Wall-Tests für doppelte ETR-Subroutinen, Index-Drift und gebrochene versus ungebrochene Kombinationen.

Akzeptanzkriterien

- LegalActions unterscheiden beide ETR-Subroutinen über stabile Indizes.
- Eine Break-Aktion gegen Index 1 bricht nicht versehentlich Index 0.
- Ungebrochene erste ETR beendet den Run und räumt spätere Encounter-Aktionen auf.
- Replay/StateHash bleibt bei Teilbreak stabil.

### onr_v1_237_data-wall - Data Wall

Bewertung: Engine

Data Wall ist der Baseline-Wall mit Rez-Kosten 1, Stärke 0 und ETR. Als Nachtest dient sie als Kontrollkarte gegen Data Wall 2.0 und generische Wall-Resolver. Wichtig ist, dass die niedrigen Werte nicht als fehlende Werte interpretiert werden.

Bewertung: Chronik

Rez für 1 Credit, Stärke 0 und ETR-Auflösung müssen nach Rez sichtbar sein. Eine Stärke von 0 darf nicht aus Payloads entfernt oder als `undefined` behandelt werden.

Bewertung: Tests

V1.0.5K deckte Data Wall bereits ab. Es fehlt ein aktueller Paar-Test mit Data Wall 2.0, der ID-, Attribut- und SourceDefinition-Trennung direkt absichert.

Bewertung: Hidden-Info/Replay/StateHash

Hidden-until-rez bleibt kritisch. Nach Rez darf Stärke 0 sichtbar sein; vor Rez darf der Wert nicht leaken. Replay muss Data Wall und Data Wall 2.0 auseinanderhalten.

Bewertung: Fehlende Härtungen

Härten: Stärke 0 als valider Wert, Rez-Kosten 1, Pairing mit Data Wall 2.0, SourceInstance/Server-Bindung.

Notwendige Umsetzung

Ergänze einen Data-Wall-Paartest: beide ICE auf unterschiedlichen Servern, beide rezzen, jeweils laufen, ETR auf dem richtigen Server prüfen und PublicPayload auf korrekte Werte prüfen.

Akzeptanzkriterien

- Data Wall behält Rez-Kosten 1 und Stärke 0 in Runtime und PublicPayload.
- Data Wall 2.0 wird nicht mit Data Wall verwechselt.
- ETR beendet nur den Run auf dem aktuell encountered Server.
- Vor Rez sind Titel und Werte in Runner-View, Reconnect und PublicEvents verborgen.

## Gesamtplan

1. Vor Beginn erneut Queue und Register lesen; falls einer der zehn Card IDs inzwischen irgendwo auftaucht, diesen Job nicht teilweise umsetzen, sondern blockieren oder neu zuschneiden.
2. Für die beiden Operationen zuerst Quell-/Engine-Parität prüfen, insbesondere `Netwatch Credit Voucher` mit lokalem Snapshot-Text `gain 4` versus aktueller Engine-Auflösung `gain 1`.
3. Danach Tests in thematischen Blöcken ergänzen: Codecracker/Code-Gate, Tagged-Operationen, Hidden-ICE-Rez, Single-ETR-Walls, Multi-Subroutine-Damage-Walls.
4. Bei Verhaltensdrift nur eng korrigieren: Rules Engine bleibt Autorität, LegalActions sind nur Vorschläge, `applyAction` revalidiert endgültig.
5. Nach Umsetzung Register und Queue-Status erst im Umsetzungsjob aktualisieren, nicht im Generatorlauf.

## Empfohlene Checks

- `pnpm --filter @netgrid/engine test`
- `pnpm --filter @netgrid/decks test`
- Fokus-Grep vor Registerupdate: `rg "onr_v1_(014_codecracker|244_filter|293_netwatch-credit-voucher|253_laser-wire|265_rock-is-strong|302_scorched-earth|238_data-wall-2-0|278_wall-of-ice|263_reinforced-wall|237_data-wall)" docs/derived/originalset-spotcheck-jobs data/reports docs/derived/ORIGINALSET_CARD_SPOTCHECK_REGISTER.md`
- Hidden-Info-Leakscan in den neuen Tests: Runner-View vor Rez, Korp-HQ bei Operationen, PublicEvents, Reconnect-Payload und Replay-Eventlog.
- Replay-/StateHash-Prüfung für Codecracker-Pump/Break, Laser Wire Damage+ETR, Wall of Ice Mehrfachdamage und Scorched Earth Short-Grip-Flatline.
