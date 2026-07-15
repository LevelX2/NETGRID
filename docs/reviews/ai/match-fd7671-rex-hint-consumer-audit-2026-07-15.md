# Match FD7671: Rex-Hint- und Consumer-Audit (2026-07-15)

## Befund

`onr_v1_264_rex` besitzt genau eine Trace-3-Subroutine. Bei erfolgreichem
Trace endet der Run und der Runner erhält einen Run-Lock, den er mit einer
Aktion und zwei Credits lösen kann. Weder Kartentext noch
`rexImplementation` vergeben einen Tag.

Der aktive Hint enthielt trotzdem `roles: tag`, `planRoles: tag_pressure` und
`requiredMechanics: add_tag`. Damit konnte die Legacy-/PlanRole-Schicht Rex
direkt als Beitrag zu `corp.tag_trace_punish` klassifizieren, obwohl die
mechanischen Fakten bereits korrekt `trace`, bedingtes End-the-run und
`run_lock` auswiesen.

## Korrigierter Vertrag

- Rollen: `ice`, `trace`
- Planrolle: `defend_server`
- Mechaniken: `install_ice`, `rez_ice`, `trace`, `end_the_run`
- Taktiksignale bleiben:
  `corp_ice.conditional_end_run`, `corp_ice.run_lock`,
  `corp_ice.trace_source`, `trace.source`
- Kartenbezogener Strategiebeitrag bleibt ausschließlich
  `corp.ice_tax_glacier` / `tax_tool` / `run_lock_ice`.

`trace.source` darf im Hint weiterhin den generischen Trace-Anteil
beschreiben. Produktive Action- und Strategieprojektionen müssen jedoch die
Scope-Gates aus `function-signal-derivation-v1.json` erfüllen. Rex' kompiliertes
`trace`-Effect hat `scope: corp`; deshalb darf es weder Installation noch Rez
als ausführbare Trace-Aktion oder direkten Tag-/Trace-Punish-Anker markieren.

## Consumer-Kette

1. `data/ai/ai-card-hints-active.json` ist die manuelle Quelle.
2. `build-ai-compiled-hints.mjs` übernimmt die korrigierten Rollen und
   Mechaniken und ergänzt aus der strukturierten Kartenimplementation die
   Effekte `trace`, `etr`, `remote_protection` und `run_lock` sowie die
   Bedingungen `requires_encounter`, `requires_trace_success` und
   `requires_unbroken_subroutine`.
3. `build-ai-hint-inspector-index.mjs` entfernt dadurch die falschen
   Klassifikationen `tag` und `tag_pressure -> corp.tag_trace_punish`.
   Der geprüfte Kartenanker `corp.ice_tax_glacier` bleibt erhalten.
4. `createAiHintsByCard` liefert das kompilierte Artefakt an die produktive
   Runtime.
5. `action-card-semantic-profiles` projiziert Effect-Signale nur innerhalb der
   vorhandenen Function-Signal-Gates. Rex-Install und Rex-Rez enthalten damit
   kein produktives `trace.source`, keinen `corp.tag_trace_punish`-Support und
   gelten für `corpPunishCandidates` nicht als erfolgreiche Trace-Aktion.
6. `tag-punish-ontology-consumer` verlangt für eine Tag-Quelle einen echten
   `tag`- oder `tag_source`-Effect. Eine Trace-Tag-Quelle benötigt zusätzlich
   einen Trace und `tag_source` mit Timing `trace_success`. Rex-Rez ist damit
   keine Tag-Quelle; Fetch-Rez bleibt der positive Gegenanker.
7. `buildCorpIceCardPlacementProfile` verbindet Hintsignale, generierte
   Effekte, sichtbaren Kartentext und strukturierte Subroutinen. Der
   fokussierte Consumer-Test ergibt für Rex `immediateStop: true`,
   `tagTrace: true` ausschließlich wegen des Trace-Fensters, `runLock: true`
   und `damage: false`.
8. Die effektive Verteidigungsbewertung erkennt Rex weiter als bedingten
   Stop-/Tax-Effekt. Deckdoctrine und Strategic Intent erhalten den
   Run-Lock-/ICE-Tax-Beitrag; ein direkter Tag-Planbeitrag aus Rollen oder
   Planrollen entfällt.
9. Der Corp-Trace-Bid erkennt den sichtbaren Encounter-ICE-Quellbezug aus der
   PlayerView beziehungsweise aus dem jüngsten öffentlichen Trace-Event. Ein
   durch strukturierte Hints belegter eigener Trace-Erfolgseffekt wie Rex'
   End-the-run plus Run-Lock erlaubt den kleinsten garantierenden Bid, aber nur
   bis zu einem begrenzten Payoff-Budget und unter Erhalt einer Creditreserve.
   Ein teurer All-in-Bid bleibt ausgeschlossen.
10. Installation, Rez, Trace-Bid und Zielwahl bleiben LegalAction- und
    PlayerView-basiert. Es gibt keine Rex-Karten-ID-Sonderregel in Score,
    Exclusion oder Arbitration.

Da die Corp im Quellmatch menschlich war, wäre ein historischer Corp-KI-
Checkpoint erfunden. Der rote Beleg besteht deshalb aus dem vor dem Fix
gesicherten aktiven und kompilierten Hint-Vertrag sowie drei produktiven
Consumer-Verträgen: Rex-Install/Rez als falsche Punish-Aktion, Rex-Rez als
falsche Tag-Quelle und Rex-Trace mit stets null Bid. Die Gegenproben sichern
Fetch als echte Trace-Tag-Quelle und einen nicht vertretbaren Rex-All-in-Bid.

## Verifikation

- Match-spezifischer Hint-, Action-, Ontologie- und Bid-Consumer-Vertrag:
  vollständig grün.
- Angrenzende Corp-ICE-Placement-Regressionen: 24 Tests grün.
- `corepack pnpm check:ai`: OK; vorhandene Warnungen, keine Fehler.
- `corepack pnpm check:ai-deck-doctrine-strategy`: bestanden.
- `corepack pnpm --filter @netgrid/ai typecheck`: bestanden.
- `git diff --check`: bestanden.
