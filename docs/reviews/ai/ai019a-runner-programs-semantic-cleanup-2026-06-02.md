# AI019a Runner Programs Semantic Cleanup

## Kurzfazit

AI019a schließt die kleine Nacharbeitsrunde aus dem AI019-Review. Die Korrektur bleibt vollständig read-only: keine neuen Taktiksignale, keine neue Strategy-ID, keine Planner-, ActionScore-, PlanWeight-, Targeting-KI-, Engine-, Legalitäts-, Profil-/Default- oder UI-Derivationswirkung.

## Änderungen

- Viral Pipeline erhält jetzt `virus.counter_engine` zusätzlich zu `virus.trigger_multi_central`, `virus.purge_tax` und `corp.action_denial`.
- Skivviss verliert das zu breite `setup.draw`; `corp.draw_pressure` bleibt erhalten.
- Emergency Self-Construct verliert das positive Setup-Signal `setup.hand_size`; `setup.hand_size_penalty` bleibt erhalten.
- R&D-Protocol Files wird von `runner.interface_closeout`/`payoff_anchor` auf `runner.rnd_pressure` mit Rolle `enabler` abgeschwächt.
- Microtech AI Interface bleibt unverändert: `runner.interface_closeout` ist dort als weicher Topdeck-Manipulationsfall weiterhin vertretbar.

## Ableitungsgrenzen

`setup.draw` ist nach AI019a nur Runner-scope Draw/Shuffle-Draw. `setup.hand_size` beschreibt nur positive Runner-Handgrößenunterstützung; negative Handgröße bleibt `setup.hand_size_penalty`. Multi-Central-Virus-Counter-Effekte zählen als `virus.counter_engine`, ohne einen generischen `runner.virus`-Strategieanker einzuführen.

## Verifikation

Die maschinenlesbare Verifikation steht im JSON-Report. Ausgeführt und grün: compiled Hints, Strategy Taxonomy, Inspector-Index, Compiled-Index, Derived Facts, Full-Derived-Facts, AI-Test-Suite, Manual Overlays, Hint Quality, Approval Consistency, DeckDoctrine Strategy, AI/Web-Typechecks und ein fokussierter AI019a-Invariantencheck. `git diff --check` wird als letzter Whitespace-Check nach README-Aktualisierung ausgeführt.
