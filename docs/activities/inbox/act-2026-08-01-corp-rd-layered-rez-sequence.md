---
activityId: act-2026-08-01-corp-rd-layered-rez-sequence
status: inbox
kind: fix
area: ai
priority: high
primaryAgent: card-enablement-ai-knowledge-agent
requiresImplementation: true
createdAt: 2026-08-01
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Korp-KI: Mehrschichtige R&D-Verteidigung im Run sinnvoll rezzen

## Ziel

Die Korp-KI soll bei einem Run auf mehrschichtig geschütztes R&D jede
bezahlbare ICE-Schicht im Kontext des gesamten Zugriffswegs bewerten. Eine
äußere Schicht darf nicht als angeblich bedrohungsloser, unbekannter
Ressourcentausch abgelehnt werden, wenn sie zusammen mit innerem ICE und dem
sichtbaren Runner-Rig einen produktiven Schutz- oder Tax-Pfad bildet.

## Kontext und Quellen

- Nutzer-Playtest vom 01.08.2026, Spiel 2 der aktuellen Hin-und-Rückspiel-Serie:
  `match_1bad991988b099b8` (`human_runner_vs_corp_ai`).
- Nutzerbeobachtung bis Zug 28: Die Korp hatte zeitweise ausreichend Credits,
  rezzte vor R&D aber keine zweite oder dritte ICE-Schicht; zum
  Beobachtungszeitpunkt war die Liquidität bereits knapper.
- Entscheidung 77 / StateVersion 153 installiert `Fire Wall` als zweite
  Schicht vor R&D.
- Entscheidung 92 / StateVersion 193, Runner-Zug 28: Die exakte legale
  `Fire Wall rezzen`-Action wird unter `corp.defend_servers` mit
  `corp_ice_rez_resource_exchange_unknown` ausgeschlossen. Der Plan meldet
  zugleich `visible_rez_window_decline_without_defense_threat`.
- Entscheidung 93 / StateVersion 196: Am inneren ICE erkennt derselbe Plan
  dagegen eine `engine_certified_ice_rez_exact_resource_exchange` und rezzt
  `Data Wall`.
- Verwandte aktuelle Analysefamilie:
  `docs/reviews/ai/two-followup-corp-ai-full-analysis-2026-08-01.md`, besonders
  F3 und F4 zu zusätzlicher R&D-Verteidigung und unvollständiger Rezquote.
- Verwandte erledigte Activity:
  `docs/activities/done/act-2026-05-17-corp-remote-rez-reserve-plan.md`.

## Scope

- Die Entscheidungen 92 und 93 gemeinsam als aktuellen, mehrschichtigen
  Defense-Checkpoint reproduzieren; nicht als zwei isolierte Einzel-ICE-
  Bewertungen behandeln.
- Belegen, welche Credits, sichtbaren Breaker, Break-/Trace-Kosten,
  Subroutinen, Zugriffsmenge und verbleibende innere Schichten am äußeren
  Rezfenster sichtbar waren.
- `corp.defend_servers` und dessen bestehende Server-Defense-Portfolio-
  Planinstanz als alleinigen Owner der Rezfolge beibehalten.
- Die exakte Rezquote so erweitern, dass sie den marginalen und kombinierten
  Wert einer äußeren Schicht entlang desselben R&D-Pfads bewerten kann.
- Eine endliche Rezreserve berücksichtigen: produktive Schichten dürfen
  gemeinsam finanzierbar sein, aber der Plan muss nicht jedes ICE rezzen und
  darf Score-/Pflichtreserven nicht blind aufbrauchen.
- Positive Regression für die konkrete R&D-Sequenz sowie Gegenproben für
  unfinanzierbare, wirkungslose oder bereits ausreichend verteidigte
  Tiefenstapel ergänzen.

## Nicht im Scope

- Kein allgemeiner Zwang, jedes ICE oder jede zweite/dritte Schicht zu rezzen.
- Keine Fire-Wall-, Data-Wall- oder R&D-Karten-ID-Sonderlogik.
- Keine Änderung an Rezfenstern, Rez-Kosten, ICE-Subroutinen, LegalActions,
  Run-Reihenfolge, Replay oder StateHash.
- Keine neue Defense-, Choice-, Resolver-, Override- oder Fallback-Autorität.
- Keine Nutzung verdeckter Runner-Hand-, Stack- oder Deckinformationen.
- Die separate Frage, wann zweite oder dritte ICE-Schichten installiert
  werden, bleibt außerhalb dieses Pakets, soweit sie nicht für den konkreten
  Rezreserve-Checkpoint nachgewiesen werden muss.

## Akzeptanzkriterien

- [ ] Die Checkpoints 92/93 reproduzieren die unterschiedliche Bewertung von
      äußerer Fire Wall und innerer Data Wall mit vollständiger side-sicherer
      Quote.
- [ ] Eine bezahlbare äußere Schicht gewinnt gegen `decline_rez`, wenn ihr
      exakter eigener oder kombinierter Schutz-/Tax-Wert den Zugriffspfad
      relevant verschlechtert und die verbleibende Reserve ausreicht.
- [ ] Unfinanzierbare oder gegen das sichtbare Rig wirkungslose Schichten
      dürfen weiterhin abgelehnt werden; es gibt keinen pauschalen
      Mehrschicht-Rezzwang.
- [ ] Die Debugspur erklärt Credits, Rez-/Breakkosten, relevanten Serverwert,
      Schichtposition, inneren Folgepfad und Reservewirkung statt
      `resource_exchange_unknown`.
- [ ] Zuständiger Plan, Planinstanz, Step/Route, Executor und exakte
      `rez_ice`-Action bleiben unverändert gebunden.
- [ ] Fokussierte Defense-/Rezfenster-Regressionen, AI-Typecheck sowie
      relevante Replay-, StateHash- und Hidden-Info-Gates sind grün.

## Umsetzungshinweise

- Vor dem ersten KI-Codepatch den verbindlichen KI-Architektur-Preflight aus
  `AGENTS.md` vollständig durchführen.
- Zuerst die Engine-LegalActions und die sichtbare Quote für beide aufeinander
  folgenden Rezfenster sichern. Die Engine bietet die konkreten Actions
  bereits an; die beobachtete Abweichung liegt in der planseitigen Bewertung.
- Den aktuellen Defense-Owner erweitern. Weder ein Choice-Resolver noch die
  Engine-Fortsetzung darf Server-, ICE- oder Reserveentscheidung übernehmen.
- Gegen die aktuellen F3-/F4-Checkpoints aus der Vollanalyse prüfen, damit
  keine zweite parallele Zentralverteidigungsheuristik entsteht.

## Ergebnisnotiz

Noch offen.
