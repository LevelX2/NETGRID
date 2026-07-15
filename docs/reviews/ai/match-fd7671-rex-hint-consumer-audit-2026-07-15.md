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

`trace.source` darf weiterhin den generischen Trace-Anteil eines
Tag-/Trace-Deckprofils stützen. Entfernt wurde nur die falsche Behauptung,
Rex erzeuge selbst Tags oder müsse einen direkten `tag_pressure`-Plan
ankern.

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
5. `buildCorpIceCardPlacementProfile` verbindet Hintsignale, generierte
   Effekte, sichtbaren Kartentext und strukturierte Subroutinen. Der
   fokussierte Consumer-Test ergibt für Rex `immediateStop: true`,
   `tagTrace: true` ausschließlich wegen des Trace-Fensters, `runLock: true`
   und `damage: false`.
6. Die effektive Verteidigungsbewertung erkennt Rex weiter als bedingten
   Stop-/Tax-Effekt. Deckdoctrine und Strategic Intent erhalten den
   Run-Lock-/ICE-Tax-Beitrag; ein direkter Tag-Planbeitrag aus Rollen oder
   Planrollen entfällt.
7. Installation, Rez und Zielwahl bleiben LegalAction-basiert. Es gibt keine
   Rex-Karten-ID-Sonderregel in Score, Exclusion oder Arbitration.

Da die Corp im Quellmatch menschlich war, wäre ein historischer Corp-KI-
Checkpoint erfunden. Der rote Beleg ist deshalb der vor dem Fix gesicherte
aktive und kompilierte Hint-Vertrag; der grüne Beleg umfasst zusätzlich den
produktiven Placement-Consumer und den Inspector-/Strategieanker.

## Verifikation

- Match-spezifischer Hint- und Consumer-Vertrag: 3 Tests grün.
- Angrenzende Corp-ICE-Placement-Regressionen: 24 Tests grün.
- `corepack pnpm check:ai`: OK; vorhandene Warnungen, keine Fehler.
- `corepack pnpm check:ai-deck-doctrine-strategy`: bestanden.
- `corepack pnpm --filter @netgrid/ai typecheck`: bestanden.
- `git diff --check`: bestanden.
