---
activityId: act-2026-07-26-corp-ice-rez-resource-exchange-value
status: done
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-07-26
startedAt: 2026-07-27
completedAt: 2026-07-27
branch: codex/activities-worktree-20260727-001
releaseTarget:
blockedBy: []
resultArtifacts:
  - packages/shared/src/index.ts
  - packages/engine/src/game/view/visible-rez-resource-exchange-quote.ts
  - packages/ai/src/runtime/corp-exact-ice-rez-route.ts
  - packages/ai/src/runtime/plan-first-live-runtime.ts
  - packages/ai/src/runtime/corp-exact-ice-rez-route.test.ts
  - packages/engine/src/game/view/visible-rez-resource-exchange-quote.test.ts
checks:
  - corepack pnpm --filter @netgrid/ai exec vitest run src/runtime/corp-exact-ice-rez-route.test.ts src/runtime/corp-score-protection-assessment.test.ts src/runtime/plan-first-live-runtime.test.ts
  - corepack pnpm --filter @netgrid/ai typecheck
  - corepack pnpm --filter @netgrid/engine exec vitest run src/game/view/visible-rez-resource-exchange-quote.test.ts
  - corepack pnpm --filter @netgrid/engine typecheck
---

# Corp-ICE-Rezentscheidung um exakten Ressourcenabtausch erweitern

## Ziel

Der globale Verteidigungsplan `corp.defend_servers` soll ein legales ICE-Rezzen
nicht nur dann als produktive Route anerkennen, wenn es die unmittelbare
Zugriffswahrscheinlichkeit nachweislich senkt. Er soll zusätzlich einen
Engine-belegten positiven Ressourcenabtausch des aktuellen Runs bewerten
können, insbesondere Runner-Zahlungen sowie den sicheren Verbrauch oder
Selbst-Trash einer eingesetzten Breaker-Ressource.

Die Lösung muss generisch für entsprechende ICE-/Breaker-Interaktionen gelten.
Sie darf weder `Filter` noch `Rent-I-Con` über Titel oder Definition-ID
sonderbehandeln.

## Kontext und Quellen

Playtest-Fund vom 26.07.2026:

- Lokales Match `match_efa2150596c7b527`, Runner-Zug 28, Remote 1.
- Auf Remote 1 lag das unrezzte ICE `Filter`.
- `Filter` konnte für 0 Credits legal gerezzt werden und besitzt eine
  Run-beendende Subroutine.
- Der Runner hatte `Rent-I-Con` installiert. Die Subroutine konnte für
  1 Credit gebrochen werden; nach einer Benutzung wird `Rent-I-Con` am Ende
  dieses Runs getrasht.
- Die Corp wählte dennoch `corp.decline_rez`. Der Runner setzte den Run fort,
  griff auf `Chicago Branch` zu und trashte die Karte.
- Die Rez-Alternative wurde mit
  `corp_ice_rez_missing_exact_engine_certified_access_reduction` als
  unproduktiv ausgeschlossen.

Die bereits extrahierte Decision-Evidence zeigt damit keinen
Finanzierungsfehler: Die exakte Rez-Quote war vorhanden und betrug 0 Credits.
Die Ursache liegt im aktuellen Wirkungsvertrag:

- `packages/ai/src/runtime/corp-exact-ice-rez-route.ts` akzeptiert
  `projectExactCorpIceRezRoute` nur, wenn die exakte
  `runnerAccessSuccessProbability` nach dem Rezzen niedriger ist als davor.
- `packages/ai/src/runtime/plan-first-live-runtime.ts` materialisiert jede
  ICE-Rezroute ohne diesen Nachweis als `nonproductive`.
- `packages/ai/src/runtime/corp-score-protection-assessment.ts` modelliert
  unmittelbaren Zugriffsschutz, aber noch keinen eigenständigen
  Ressourcenabtausch des aktuellen Runs.
- Die aktive Kartenhinweisbasis kennt bei `Rent-I-Con` bereits
  `trashes_self_at_end_of_run_after_break_use`. Dieser Hinweis darf die
  fachliche Suche unterstützen, ist aber keine Regelautorität. Behauptete
  Kosten und Wirkungen müssen aus Engine-zertifizierten, für die Corp
  sichtbaren Fakten oder einer exakten Engine-Projektion stammen.

## Scope

1. Den exakten ICE-Rez-Projektionsvertrag um einen strukturierten
   Ressourcenabtausch des aktuellen Runs erweitern. Mindestens getrennt
   abbilden:
   - Veränderung der unmittelbaren Zugriffswahrscheinlichkeit;
   - exakte Rez-Zahlung der Corp;
   - für den erfolgreichen Restpfad erforderliche Runner-Zahlungen für
     Stärke und Subroutine-Brüche;
   - sicher verbrauchte, getrashte oder nur für diesen Run verfügbare
     Runner-Karten beziehungsweise Fähigkeiten;
   - Knowledge-/Vollständigkeitsstatus und Evidence-Quelle jedes behaupteten
     Effekts.
2. `corp.defend_servers` erlauben, eine ICE-Rezroute bei unveränderter
   unmittelbarer Zugriffswahrscheinlichkeit als produktiven
   Verteidigungsschritt zu führen, wenn ein positiver Ressourcenabtausch
   vollständig und exakt belegt ist.
3. Die Bewertung server- und runbezogen in die vorhandene Planpriorisierung
   einspeisen. Sie bleibt Child-Route des zuständigen
   `corp.defend_servers`-Parents und erzeugt keinen parallelen Rez-Plan.
4. Einen fokussierten Regressionstest für die Playtest-Situation erstellen:
   kostenloses `Filter`, brechbare ETR-Subroutine, ausreichender
   Runner-Credit und ein installiertes `Rent-I-Con`, das nach Benutzung
   sicher am Run-Ende getrasht wird.
5. Gegenproben ergänzen, die eine pauschale Rez-Heuristik verhindern:
   - Ein bloß brechbares ICE ohne exakt belegten relevanten
     Ressourcenverbrauch wird nicht allein wegen `rezCost = 0` produktiv.
   - Ein nicht finanzierbarer Runner-Restpfad bleibt unmittelbarer
     Zugriffsschutz und wird nicht fälschlich nur als Attrition bewertet.
   - Unvollständige Breakkosten, unvollständige Effektbindung oder unbekannter
     Selbst-Trash liefern keinen geschätzten Ressourcenwert.
   - Ein teurer Rez-Quote darf nicht durch frei erfundene zukünftige
     Verteidigungsboni überstimmt werden.
6. Prüfen, ob die neue Projektion auch die weiteren produktiven Consumer der
   exakten Score-Protection-Assessment betrifft. Änderungen außerhalb des
   aktuellen Rezfensters nur als kleine Folge-Activities anlegen, wenn dafür
   ein eigener Vertrag nötig ist.

## Nicht im Scope

- Keine Sonderlogik nach den Kartennamen oder Definition-IDs von `Filter`,
  `Rent-I-Con` oder `Chicago Branch`.
- Keine allgemeine Simulation beliebig vieler zukünftiger Runs oder Züge.
- Keine frei geschätzten numerischen Langzeitboni für „zukünftig besser
  geschützt“.
- Keine gedruckten `rezCost`-, Breakkosten- oder Kartentext-Fallbacks.
- Keine neue parallele Autorität neben `corp.defend_servers`.
- Keine Änderung der Engine-Regelwirkung von Filter, Rent-I-Con, Breaken,
  Run-Ende oder Zugriff.
- Keine Abschwächung von LegalAction-, Hidden-Info-, Replay- oder
  StateHash-Verträgen.
- Keine erneute Live-SQLite-Analyse oder Kopie der Runtime-Datenbank für die
  Fixture. Die Regression wird aus den bereits side-safe extrahierten Fakten
  minimal und deterministisch aufgebaut.

## Akzeptanzkriterien

- [x] Die Corp-Rezentscheidung unterscheidet nachvollziehbar zwischen
      unmittelbarem Zugriffsschutz und exakt belegtem Ressourcenabtausch.
- [x] Im reproduzierten Filter-/Rent-I-Con-Szenario bleibt der Zugriff
      zunächst möglich, die Rezroute wird aber wegen 0 Corp-Credits,
      1 erforderlichem Runner-Credit und sicherem Rent-I-Con-Selbst-Trash als
      produktive Route von `corp.defend_servers` anerkannt.
- [x] Die ausgewählte LegalAction ist weiterhin die originale
      Engine-Aktion zum Rezzen genau dieser Filter-Instanz auf genau diesem
      Server und wird beim Apply erneut durch die Engine validiert.
- [x] Kein Test oder produktiver Pfad erkennt die Karten anhand ihres Titels
      oder ihrer Definition-ID.
- [x] Kosten, Breakpfad und Verbrauch/Selbst-Trash stammen vollständig aus
      Engine-zertifizierten und für die Corp zulässigen Fakten. Kartenhinweise
      sind keine Wirkungs- oder Kostenautorität.
- [x] Unknown oder unvollständige Fakten bleiben fail-closed: Es entstehen
      weder ein Ressourcenwert noch ein gedruckter oder heuristischer
      Ersatzwert.
- [x] Ein kostenloses, problemlos und ohne relevanten Verbrauch brechbares
      ICE wird nicht automatisch als produktiv eingestuft.
- [x] Die Änderung erzeugt keinen eigenständigen Rez-/Attrition-Plan und
      verändert nicht die Parent-Priorität des zuständigen
      `corp.defend_servers`-Plans.
- [x] DecisionDebug/`whyNot` unterscheidet mindestens zwischen
      `access_reduction`, `exact_resource_exchange` und
      `resource_exchange_unknown`, ohne verdeckte Runner-Informationen
      offenzulegen.
- [x] Die fokussierten Tests und der AI-Typecheck sind grün.

## Umsetzungshinweise

- Ausgangspunkt ist `projectExactCorpIceRezRoute`. Den bisherigen
  Access-Reduction-Nachweis als weiterhin gültige Wirkungsart erhalten und
  nicht durch eine schwächere Sammelheuristik ersetzen.
- Für den neuen Fall bevorzugt eine typisierte Outcome-Union verwenden,
  beispielsweise `access_reduction` oder `exact_resource_exchange`, statt
  beide Wirkungen in einen einzelnen frei gewichteten Score zu mischen.
- „Zukünftiger Verteidigungswert“ darf in diesem Paket nur durch einen
  bereits im aktuellen Run exakt eintretenden Zustandsverlust belegt werden,
  etwa den sicheren Trash der benutzten Breaker-Instanz. Keine hypothetische
  Zahl künftiger Runs annehmen.
- Die Engine bleibt Regelautorität. Falls der AI-Input den exakten
  Runner-Restpfad oder den sicheren Run-End-Verbrauch noch nicht side-safe
  zertifizieren kann, zunächst den kleinsten positiven Projektionsvertrag an
  der Engine-/Shared-Grenze ergänzen; keine Rekonstruktion aus gedrucktem
  Kartentext.
- Den Playtest als Verhaltenstest und mindestens die Projektionslogik als
  fokussierten Unit-Test sichern. Bei einer Erweiterung des Engine-/Shared-
  Vertrags die entsprechenden Typechecks und fokussierten Engine-Tests zu
  `checks` ergänzen.

## Ergebnisnotiz

Erledigt am 27.07.2026. Die Corp-PlayerView enthält für einen isolierten,
aktuellen Rezpfad eine Engine-zertifizierte, zustandsversionsgebundene
Ressourcen-Projektion. Sie weist getrennt aus, welche Runner-Credits der
Breakpfad benötigt und ob die eingesetzte sichtbare Breaker-Karte sicher am
Run-Ende getrasht wird. Unbekannte, komplexe oder nicht isolierte Pfade bleiben
unvollständig. `corp.defend_servers` akzeptiert bei unveränderter
Zugriffswahrscheinlichkeit ausschließlich einen vollständigen positiven
Ressourcenabtausch; die originale `rez_ice`-LegalAction bleibt erhalten.

Die Diagnose-Evidence trennt `access_reduction`,
`exact_resource_exchange` und `resource_exchange_unknown`. Die Regressionen
decken Filter/Rent-I-Con, einen kostenlosen Break ohne Verbrauch, unvollständige
Evidenz sowie die Corp-seitige Sichtbarkeitsgrenze ab.
