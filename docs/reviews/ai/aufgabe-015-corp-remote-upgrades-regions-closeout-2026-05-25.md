# Aufgabe 015 - Corp Remote/Upgrades/Regions Longtail Closeout

## Kurzfazit

Aufgabe 015 erweitert den read-only Generated-Facts-Pilot um einen größeren Corp-Remote-/Upgrade-/Region-Longtail. Der Batch bleibt rein diagnostisch: `data/ai/ai-card-hints-active.json` bleibt unverändert die Runtime-Quelle, und es gibt keine Engine-, Planner-, Consumer- oder Strategieänderung.

Ergebnis:

- 10 Kandidaten geprüft
- 8 Karten eingeschlossen
- 2 Karten begründet ausgeschlossen
- 27 Generated Facts bestätigt
- 0 Preview-Adds
- 5 Comparator-Differenzen normalisiert
- 0 verbleibende Differenzen
- 0 Descriptor-Follow-ups
- 0 Hard Errors
- 0 echte semantische Konflikte

Readiness: `ready_read_only_split_subbatches`.

## Warum Dieser Batch

Aufgabe 014 hat RemoteRole/Future-run ICE read-only geschlossen und dabei die wichtigsten Kontextgrenzen stabilisiert: RemoteRole ist Boardstate-abhängig, Future-run-Facts brauchen Runpath-Kontext, und `effectiveRunQuote` bleibt für konkrete Pfadkosten führend. Aufgabe 015 nutzt diese Regeln für einen größeren Corp-Remote-/Upgrade-/Region-Longtail.

## Geprüfte Kandidaten

Eingeschlossen:

- `Tesseract Fort Construction`
- `Namatoki Plaza`
- `Jenny Jett`
- `Olivia Salazar`
- `Rio de Janeiro City Grid`
- `Data Masons`
- `Antiquated Interface Routines`
- `Chicago Branch`

Ausgeschlossen:

- `Restrictive Net Zoning`: Runner-Resource mit Corp-ICE-Installtax auf gewähltem Fort; fachlich eher ein späterer Runner-Remote-Contest-/Install-Tax-Batch.
- `Black Ice Quality Assurance`: Corp-Agenda mit globalem Black-ICE-Stärkemodifier; mechanisch sinnvoll, aber außerhalb Remote-Upgrades/Regions und besser in einem Corp-ICE-/Agenda-Modifier-Batch.

## Derived-Facts-Erweiterungen

Der Pilot wurde von 24 auf 32 Karten erweitert. Neu ableitbare mechanische Gruppen:

- `future_encounter_effect`
- `remote_protection`
- `remoteRole:scoring_protection`
- `remoteRole:remote_capacity`
- `remoteRole:ice_modifier`
- `remoteRole:asset_economy`
- `rez_discount`
- `score_acceleration`
- `requires_remote_server`
- `requires_successful_run`
- `requires_during_run`

Diese Facts stammen aus CardImplementation-/Descriptor-Scans und werden nur in den read-only Reports genutzt.

## Dry-Run, Diff Und Normalisierung

Bestätigte Generated Facts: 27.

Preview-Adds: 0. Der aktive Monolith trägt die relevanten mechanischen Felder bereits oder gleichwertige Legacy-Strukturen.

Normalisierte Differenzen:

- `remote_scoring_protection_normalization`: Tesseract-Fort-Shape für zusätzliche Fort-Subroutine.
- `ice_modifier_context_normalization`: Data Masons und Antiquated Interface Routines.
- `score_acceleration_context_normalization`: Chicago Branch.
- `cost_profile_split_normalization`: Chicago Branch mechanische Kosten getrennt von strategischem Reserve-/Opportunity-Kontext.

Board-/Kontextinfos: 21.

## Rollup-Status

Alle 8 eingeschlossenen Karten sind `ready_read_only_with_board_context`.

Subbatches:

- `remote_upgrades`: 3 Karten
- `remote_capacity_or_remote_protection`: 1 Karte
- `regions_city_grids`: 1 Karte
- `global_ice_or_remote_support`: 2 Karten
- `score_acceleration_or_fast_advance_support`: 1 Karte

Es bleiben keine offenen Differenzen, keine Descriptor-Follow-ups und keine echten semantischen Konflikte.

## Kontextregeln

- RemoteRole und `remote_protection` beschreiben statische Kartenfunktion; active/rezzed/server/root context bleibt Boardstate.
- Future-encounter- und run-tax-artige Facts erzeugen keine aktuelle Run-Legalität; `effectiveRunQuote` bleibt für konkrete Pfadkosten maßgeblich.
- Score acceleration beschreibt Advancement-/Counter-Support; Score-Legalität bleibt Engine-/LegalAction-Kontext.
- Successful-run-/Access-window-Facts dürfen keine versteckten HQ-/R&D-Karteninformationen offenlegen.
- Strategische Reserve-, Opportunity- und Remote-Safety-Wertungen bleiben Manual-/Consumer-Kontext.

## Bewusst Nicht Geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Runtime-Nutzung des Compiled Index.
- Keine Runtime-Nutzung modularer Overlays.
- Keine Engine-, Planner- oder Consumer-Anbindung.
- Keine aktive Hintmigration.
- Keine Profilumschaltung, keine neuen Decks, keine Holdout-Optimierung.

## Nächster Batch

Empfehlung: Aufgabe 016 `breaker_icebreaker_longtail`.

Begründung: Batch 2 hat BreakerProfile bereits stabil normalisiert, aktive Consumer existieren, und ein größerer Breaker-/Icebreaker-Longtail ist mechanisch stabiler als ein breiter Corp-ICE-Future-/Trace-/Damage-Batch.

Kandidaten:

- `Worm`
- `Pile Driver`
- `Blink`
- `Dropp`
- `Replicator`
- `Reflector`
- `Codecracker`
- `Cyfermaster`
- `Raffles`
- `Raptor`
- `Shaka`
