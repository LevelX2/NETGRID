---
activityId: act-2026-07-14-trace-tag-prevention-avoidance-hardening
status: done
kind: fix
area: engine
priority: hotfix
primaryAgent: release-implementation-agent
requiresImplementation: true
createdAt: 2026-07-14
startedAt: 2026-07-14
completedAt: 2026-07-14
branch: codex/act-2026-07-14-trace-tag-prevention
releaseTarget: Current private playtest
blockedBy: []
resultArtifacts:
  - packages/engine/src/game/damage/damage-core.ts
  - packages/engine/src/game/trace/trace-orchestration.ts
  - packages/engine/src/game/run/encounter-printed-effects.ts
  - packages/engine/src/game/run/encounter-printed-nontrace-effects.ts
  - packages/engine/src/index-tests/originalset/trace-prevention-assets.test.ts
  - apps/web/app/run-layering.test.ts
  - docs/reviews/engine/trace-tag-prevention-avoidance-hardening-2026-07-14.md
  - docs/activities/inbox/act-2026-07-14-nontrace-tag-prevention-continuations.md
checks:
  - corepack pnpm --filter @netgrid/engine test (184 Dateien, 1656 Tests)
  - corepack pnpm --filter @netgrid/engine typecheck
  - corepack pnpm --filter @netgrid/web exec vitest run app/run-layering.test.ts (11 Tests)
  - corepack pnpm --filter @netgrid/web typecheck
  - corepack pnpm check:package-boundaries
  - corepack pnpm format:changed
  - git diff --check
---

# Trace-Tags und Avoid-Tag-Quellen systemisch härten

## Ziel

Vermeidbare Tags aus erfolgreichen Trace-Effekten dürfen nicht direkt auf den
Runner geschrieben werden. Sie müssen das gemeinsame, runner-private
Tag-Vermeidungsfenster durchlaufen, damit alle freigegebenen Avoid-Tag-Quellen
mit ihren echten Kosten funktionieren. Mehrere Tags und mehrere Quellen müssen
sequenziell und replay-stabil auflösbar sein.

## Kontext und Quellen

- Playtest-Befund vom 2026-07-14: Ein erfolgreicher `Fetch 4.0.1`-Trace gab
  sofort einen Tag, obwohl ein installierter `Fall Guy` legal hätte getrasht
  werden können, um den Tag zu vermeiden.
- `packages/engine/src/game/run/encounter-printed-effects.ts` und
  `packages/engine/src/game/trace/trace-orchestration.ts` addieren
  Trace-Erfolgstags derzeit direkt und umgehen
  `addRunnerTagsWithPrevention`.
- Das generische Tag-Fenster in
  `packages/engine/src/game/damage/damage-core.ts` kennt die Kostenmodelle
  `credit`, `trash_source`, `credit_and_trash_source`,
  `credit_and_tap_source` und `credit_and_forgo_next_action`, löst nach einer
  angewendeten Quelle bei mehreren Tags aber noch nicht mit weiteren Quellen
  weiter auf.
- Aktive Avoid-Tag-Quellen:
  - `onr_v1_135_nasuko-cycle`
  - `onr_v1_161_fall-guy`
  - `onr_v1_167_leland-corporate-bodyguard`
  - `onr_v1_170_nomad-allies`
  - `onr_v1_187_wilson-weeflerunner-apprentice`
  - `onr_proteus_140_expendable-family-member`
  - `onr_classic_051_vintage-camaro`
- Historische Vorarbeiten:
  - `docs/activities/done/act-2026-05-16-trace-open-bidding-alignment.md`
  - `docs/activities/done/act-2026-05-23-runner-prevention-tag-protection-spoiler-alignment.md`
  - `docs/activities/done/act-2026-05-24-proteus-phase-6c-corp-operation-trace-tag-economy.md`

## Scope

- Alle aktiven Trace-Erfolgseffekte, die dem Runner einen oder mehrere
  vermeidbare Tags geben, auf das gemeinsame Imminent-Event-/Prevention-Modell
  führen:
  - ICE-Trace im Run und Trace ohne Run,
  - feste Tagmenge,
  - Tag plus Counter,
  - Tagmenge nach Trace-Marge,
  - Resource-Trash plus Tag,
  - zusätzliche Tags aus Trace-Auto-Erfolg, sofern der Kartentext sie nicht
    ausdrücklich unvermeidbar macht.
- Reihenfolge erhalten: Trace-Erfolg berechnen, vorhandenes
  Trace-Erfolg-Cancel-Fenster auflösen, danach erst Tag-Vermeidung, anschließend
  den Run beziehungsweise den aufrufenden Effekt korrekt fortsetzen.
- Mehrere Tags mit mehreren legalen Avoid-Tag-Quellen sequenziell behandeln;
  jede Quelle darf nur nach erneuter Kosten- und Source-Revalidierung genutzt
  werden. Ein bewusster Pass lässt die noch nicht vermiedenen Tags zu.
- Alle sieben aktiven Avoid-Tag-Quellen gegen Kartentext, Kosten, installierte
  Source, Hidden-Resource-Reveal, Tap-/Trash-/Credit-/Action-Debt-Verhalten und
  LegalAction-Sichtbarkeit auditieren und nötige Korrekturen im selben
  Mechanikpaket vornehmen.
- Direkte Tag-Zuweisungen in den aktiven Enginepfaden inventarisieren. Jede
  kartengetriebene, regeltechnisch vermeidbare Zuweisung im sicheren Scope
  dieses Pakets ebenfalls auf den gemeinsamen Pfad führen; ausdrücklich
  unvermeidbare oder nicht ohne neue Continuation-Architektur sicher
  migrierbare Pfade im Review mit konkretem Folgepaket benennen.
- Das Choice-Prompt für Tag-Vermeidung passend benennen und die vorhandene
  Darstellung als Choice im Run-Fenster absichern.
- Wiederverwendbare Erkenntnisse in einem fokussierten Review und im
  Juli-Betriebslog festhalten.

## Nicht im Scope

- Keine Änderung der offenen NETGRID-Trace-Bietregel.
- Keine neue Kartenfreischaltung und keine Änderung gedruckter Kartentexte.
- Keine Client- oder KI-Regelautorität; UI und KI konsumieren ausschließlich
  von der Engine erzeugte `LegalActions`.
- Keine pauschale Neufassung von Damage-, Trash- oder
  Trace-Erfolg-Cancel-Prevention.
- Keine stillen Hidden-Info-Ausnahmen und keine Aufgabe von Replay-, StateHash-
  oder stale-action-Gates.

## Akzeptanzkriterien

- [x] Erfolgreicher `Fetch 4.0.1`-Trace mit 0 Runner-Credits und installiertem
      `Fall Guy` öffnet vor dem Tag ein runner-privates Fenster mit Pass und
      Fall-Guy-Option.
- [x] Fall Guy wählen trasht genau diese Source, gibt keinen Tag und setzt den
      Run am korrekten Encounter-Schritt fort; Pass gibt den Tag und lässt Fall
      Guy installiert.
- [x] Trace-Tags funktionieren mit und ohne aktiven Run sowie für alle aktiven
      Trace-Erfolg-Tagvarianten über denselben Prevention-Vertrag.
- [x] Zwei oder mehr Tags können mit mehreren legalen Quellen schrittweise
      vermieden werden; Kosten, entfernte/getappte Sources und Restmenge werden
      vor jeder Choice erneut validiert.
- [x] Nasuko Cycle, Fall Guy, Leland, Nomad Allies, Wilson, Expendable Family
      Member und Vintage Camaro besitzen je einen belastbaren positiven
      Kosten-/Auflösungstest oder eine äquivalente parametrisierte Abdeckung.
- [x] Falsche Seite, stale Choice, nicht mehr installierte Source,
      unzureichende Credits und bereits getappte Source bleiben illegal.
- [x] Runner-PlayerView sieht die konkrete Avoid-Option; Korp-PlayerView erhält
      keine private Choice oder verdeckte Source-Identität.
- [x] Run-Fenster zeigt das Engine-Choice mit verständlichem Tag-Prompt; die UI
      erzeugt keine eigene Kartenaktion.
- [x] Replay und StateHash stimmen nach Vermeiden und Pass sowohl im Run- als
      auch im Nicht-Run-Trace-Pfad.
- [x] Der Audit aller direkten Tag-Zuweisungen ist im Review nachvollziehbar;
      verbleibende Ausnahmen sind fachlich begründet oder als kleine
      Folge-Activities angelegt.
- [x] Fokussierte Engine- und Web-Tests, Engine-Typecheck und `git diff --check`
      sind grün.

## Umsetzungshinweise

- Kein reiner UI-Fix: Ohne Engine-`pendingChoice` kann das vorhandene
  `RunTimelineOverlay` keinen legalen Avoid-Button anzeigen.
- Trace-Kontext und Fortsetzung dürfen nicht verloren gehen, wenn die
  Runner-Bid-Aktion ein Event-Modification-Fenster öffnet.
- Bei kombinierten Erfolgseffekten darf nur der Tag-Anteil vermeidbar werden;
  Counter-, Trash- oder andere nicht gecancelte Teile müssen genau einmal
  auflösen.
- Bei mehreren Tags nicht alle Kandidaten vorab blind verbrauchen. Nach jeder
  Source-Zahlung Restevent und Kandidaten aus dem aktuellen State neu bilden.
- Die bestehende generische Option `Tag nicht vermeiden` und die
  sourcegebundene Option `<Karte>: 1 Tag vermeiden` sind der gewünschte
  LegalAction-Vertrag.

## Ergebnisnotiz

Abgeschlossen. Erfolgreiche Trace-Tags im Run und außerhalb eines Runs sowie
gedruckte Nicht-Trace-Tag-ICE-Subroutinen nutzen jetzt den gemeinsamen
Add-Tag-ImminentEvent-Pfad. Der gemeldete Fetch/Fall-Guy-Fall öffnet bei 0:0
das runner-private Choice `Tag vermeiden`; Vermeiden und Pass setzen den Run
korrekt fort und bleiben replay-/statehash-stabil.

Mehrere Tags werden nach jeder Source mit aktueller Restmenge und erneuter
Kosten-/Source-Prüfung fortgesetzt. Alle sieben aktiven Avoid-Tag-Karten sind
parametrisiert gegen Registry, Kosten und Priorität abgesichert; zusätzliche
Verhaltensregressionen decken Trash-Quellen, Hidden Resource, automatische
Avoid-next-tag-Credits und Vintage Camaros Future-Action-Debt ab.

Der direkte Tag-Schreibstellen-Audit ist im Ergebnisreview dokumentiert.
Weitere automatische Nicht-Trace-Pfade benötigen einen eigenen
suspendierbaren Continuation-Vertrag und liegen als
`act-2026-07-14-nontrace-tag-prevention-continuations` im Inbox-Board.
