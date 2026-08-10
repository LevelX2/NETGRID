---
activityId: act-2026-08-10-runner-cost-effective-breaker-recovery
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-10
startedAt:
completedAt:
branch:
releaseTarget: ai-plan-layer-hardening
blockedBy: []
resultArtifacts: []
checks: []
---

# Unwirtschaftliche Breaker-Abdeckung als offenen Entwicklungsbedarf behandeln

## Ziel

Ein formal kompatibler installierter Icebreaker darf einen strategischen
Coverage-Bedarf nicht automatisch schließen, wenn der sichtbare Zielpfad nur
zu unverhältnismäßigen Kosten erreichbar ist. Der Runner soll dann einen
gebundenen Recovery-/Entwicklungsplan für günstigere sichtbare Coverage,
Suche, Draw oder bewusstes Funding bilden.

Dieses Paket ist ein Follow-up zu der erledigten Activity
`act-2026-05-17-runner-ai-breaker-acquisition-strategy`.

## Kontext und Quellen

- Playtest-Match `match_17b23313d4697e86`, späte Runner-Phase.
- `Krash` war als universeller Breaker installiert und konnte die bekannten
  ICE formal brechen, kostete für `Cortical Scrub` plus `Keeper` aber etwa
  20 Credits.
- Der Runner hielt drei `R&D Interface` und verfolgte strategisch
  `runner.rnd_pressure`, entwickelte aber weder einen kostengünstigeren
  Breakerpfad noch einen Draw-/Search-Plan.
- Normales Ziehen wurde wiederholt als
  `runner_optional_draw_has_no_current_plan_purpose` verworfen.
- Ein zuvor gespieltes `Temple Microcode Outlet` lag bereits im Heap. Die
  aktuelle Analyse-API liefert jedoch keinen historischen eigenen
  Deck-Snapshot; deshalb ist für dieses Match nicht belegt, welche weiteren
  Breaker oder Tutoren noch im Stack lagen.
- Die erledigte Vorgänger-Activity schloss Coverage-Ziele bei passendem
  sichtbarem Breaker. Der neue Befund betrifft den Unterschied zwischen
  technischer und wirtschaftlich tragfähiger Coverage.
- Verwandte Activity
  `act-2026-08-10-analysis-api-own-deck-snapshot` schließt die fehlende
  Diagnoseevidence, ist aber keine Voraussetzung für den generischen
  Fixture-basierten Ursachen-Fix.

## Scope

- Für einen strategisch relevanten Zielserver die günstigste bekannte
  vollständige Route mit aktuell installierter Coverage bewerten.
- Einen offenen Coverage-Effizienzbedarf erzeugen, wenn mindestens eine
  begründete Schwelle verletzt ist, etwa:
  - der Funding Gap macht den Zielhorizont unrealistisch;
  - die Route verbraucht nahezu alle Credits ohne angemessene Reserve;
  - wiederkehrende ICE-Kosten übersteigen den erwarteten Access-Payoff;
  - ein sichtbarer günstigerer Breaker-, Bypass- oder Mitigation-Pfad ist
    verfügbar.
- Der strategische Run-Parent bestimmt Ziel und benötigte Coverage. Der
  vorhandene Breaker-Acquisition-/Board-Development-Plan darf als gebundene
  Support-Route mindestens wählen zwischen:
  - günstigere sichtbare Karte aus der Grip installieren;
  - verfügbare strukturierte Tutor-/Search-Aktion verwenden;
  - zielgerichtet ziehen, wenn ein passender Kartenrollenbedarf aus eigener
    DeckDoctrine oder side-sicherer eigener Deckkomposition begründet ist;
  - für den vorhandenen teuren Pfad sparen, wenn keine bessere sichtbare oder
    doctrine-begründete Route existiert.
- Keine konkrete unbekannte Karte im Stack voraussetzen. Draw oder Suche
  verfolgen eine Kartenrolle beziehungsweise einen Coverage-Bedarf.
- Den Bedarf beenden oder neu quotieren, sobald der Zielserver irrelevant,
  die Route bezahlbar, eine Alternative installiert oder der Suchhorizont
  fachlich ausgeschöpft ist.
- Diagnose für aktuelle Route, Gesamtkosten, Funding Gap, Coverage-Qualität,
  sichtbare Alternativen, gewählte Support-Route und Abbruchbedingung liefern.

## Nicht im Scope

- Keine Annahme über weitere Breaker im konkreten Match ohne API-Evidence.
- Keine Einsicht in die Reihenfolge des eigenen Stacks oder die verdeckte
  gegnerische Deckliste.
- Kein pauschales Ziehen, sobald irgendein Run teuer ist.
- Keine Karten-ID- oder Namenslogik für Krash, Keeper oder Cortical Scrub.
- Keine Änderung der Engine-Regeln für Breaker, Suche, Draw oder Run.
- Keine vollständige Deckbau- oder Mulliganstrategie.
- Keine zweite Strategieentscheidung im Search-Choice-Resolver; dieser
  vervollständigt nur die vom Parent gebundene aktuelle LegalAction.
- Keine Abschwächung von LegalAction-, Hidden-Info-, Replay-, StateHash- oder
  Determinismusverträgen.

## Akzeptanzkriterien

- [ ] Ein kompatibler, aber extrem teurer installierter Breaker schließt den
      Coverage-Bedarf nicht automatisch als vollständig gelöst.
- [ ] Bei einem sichtbaren günstigeren Breaker in der Grip verfolgt die KI
      dessen gebundene Finanzierung und Installation vor einer endlosen
      allgemeinen Credit-Schleife.
- [ ] Bei einer legalen Tutor-/Search-Aktion bindet der zuständige Plan die
      benötigte Breakerrolle; der Choice-Resolver ändert weder Zielserver noch
      Strategie oder Action-ID.
- [ ] Ohne sichtbare Karte darf ein Draw-Bedarf nur aus eigener side-sicherer
      DeckDoctrine beziehungsweise eigener reihenfolgenneutraler
      Deckkomposition entstehen, niemals aus unbekannter Stack-Reihenfolge.
- [ ] Wenn keine bessere Route begründet ist, darf die KI bewusst für den
      vorhandenen Breakerpfad sparen; Funding-Ziel und Abschlussgrenze sind
      quantifiziert.
- [ ] Ein unwichtiger oder payoffloser Server löst keine umfangreiche
      Breaker-Suche aus.
- [ ] Fixtures sichern: günstiger Breaker in Grip, Tutor verfügbar, nur
      Rollenwissen im Stack, keine bessere Alternative und irrelevant
      gewordener Zielserver.
- [ ] Die Regression referenziert die erledigte Vorgänger-Activity und
      sichert, dass deren einfache Fälle mit wirklich ausreichender Coverage
      nicht verschlechtert werden.
- [ ] Ownership-Tests sichern Run-Parent, Coverage-Bedarf, Support-Plan,
      exakte LegalAction und Executor.
- [ ] Hidden-Info-Schutz, Replay, StateHash und Determinismus bleiben erhalten.
- [ ] Fokussierte AI-Tests, erforderlicher AI-Typecheck und
      `git diff --check` sind grün.

## Umsetzungshinweise

- Vor jedem KI-Patch den verbindlichen AI-Architektur-Preflight aus
  `AGENTS.md` vollständig ausführen.
- Den bestehenden Coverage-Plan der erledigten Vorgänger-Activity erweitern,
  nicht daneben einen zweiten Breaker-Strategiepfad anlegen.
- Kosten und Rollen aus strukturierten Engine-/Kartensemantik-/Doctrine-
  Feldern beziehen; keine Label- oder ActionId-Heuristik verwenden.
- Das konkrete Match erst nach verfügbarer eigener Deck-Snapshot-Evidence
  für Aussagen zu tatsächlich verbleibenden Breakern heranziehen.

## Ergebnisnotiz

Noch offen. Follow-up zur bereits umgesetzten Breaker-Acquisition-Strategie.
