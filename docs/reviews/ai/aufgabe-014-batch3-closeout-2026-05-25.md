# Aufgabe 014 - Batch-3 Closeout / RemoteRole + Future-run ICE

## Kurzfazit

Aufgabe 014 schließt Batch 3 read-only ab. Die bekannten RemoteRole-, FutureRun-, BoardContext-, RunpathContext- und DescriptorContext-Differenzen wurden im Comparator-Pfad normalisiert oder als Kontextinfos eingeordnet.

Ergebnis: Batch 3 bleibt als Gesamtbericht zusammen, wird aber logisch in zwei ready Subbatches gesplittet:

- `remote_upgrades`: `ready_read_only`
- `future_run_ice`: `ready_read_only_with_runpath_context`

Es gibt keine Hard Errors, keine Konflikte, keine echten semantischen Konflikte und keine verbleibenden Differenzen. `data/ai/ai-card-hints-active.json` bleibt unverändert die aktive Runtime-Quelle.

## Ausgangslage

Aufgabe 012 meldete für Batch 3:

- 5 Karten
- 15 bestätigte Generated Facts
- 0 Preview-Adds
- 0 Hard Errors
- 0 Konflikte
- Status `needs_diff_review`

Aufgabe 013 klassifizierte:

- 6 Shape-Differences
- 4 RemoteRole-Differences
- 3 FutureRun-Differences
- 15 BoardContext-Hinweise
- 10 RunpathContext-Hinweise
- 9 DescriptorContext-Hinweise
- echte semantische Konflikte: 0

## Normalisierungen

Umgesetzt im read-only Closeout-Check:

- `remote_role_run_tax_normalization`
- `remote_role_agenda_steal_tax_normalization`
- `future_run_remaining_ice_context_normalization`
- `future_run_program_trash_context_normalization`
- `active_state_context_normalization`
- `effective_run_quote_priority_annotation`

Zusätzlich bleibt Remote-Protection als Overlay-/Strategiekontext sichtbar und wird nicht als generated mechanical fact migriert.

## Remote-Upgrades

Status: `ready_read_only`

Karten:

- `Crystal Palace Station Grid`
- `Red Herrings`

Guardrails:

- Crystal Palace bleibt `run_tax`.
- Crystal Palace wird nicht Economy, Counter oder Agenda-Steal-Tax.
- Red Herrings bleibt `agenda_steal_tax`.
- Red Herrings wird nicht als generischer Remote-Run-Tax behandelt.
- Active/rezzed/server context bleibt Boardstate.
- Remote protection bleibt Overlay-/Strategiekontext.

## Future-run ICE

Status: `ready_read_only_with_runpath_context`

Karten:

- `Tutor`
- `Virizz`
- `Viral 15`

Guardrails:

- Future-run-Facts beschreiben statische Kartenfunktion.
- Sie erzeugen keine aktuelle Run-Legalität, Break-Legalität, Trash-Legalität oder Self-Safety.
- Relevanz hängt an laufendem Run, remaining ICE, späterem Encounter, ungebrochener Subroutine und aktuellem Runpath.
- `effectiveRunQuote` bleibt für konkrete Pfadkosten führend.

## Rollup

- Batch-Karten: 5
- bestätigte Generated Facts: 15
- Preview-Adds: 0
- normalisierte Differenzen: 13
- verbleibende Differenzen: 0
- BoardContext-Infos: 15
- RunpathContext-Infos: 10
- DescriptorContext-Infos: 9
- Hard Errors: 0
- Konflikte: 0
- echte semantische Konflikte: 0

Readiness:

- `ready_read_only`: 2
- `ready_read_only_with_runpath_context`: 3

## Split-Entscheidung

Entscheidung: `split_ready_subbatches`

Batch 3 bleibt als Bericht zusammen, aber die Folgearbeit sollte logisch getrennt bleiben:

- Remote-Upgrades sind stabil genug für direkten nächsten RemoteRole-Longtail.
- Future-run ICE ist ebenfalls read-only ready, aber nur mit strengen Runpath-/`effectiveRunQuote`-Kontextregeln.

## Nächster Batch

Empfehlung: Aufgabe 015 `corp_remote_upgrades_regions_longtail`.

Kandidaten:

- `Tesseract Fort Construction`
- `Namatoki Plaza`
- `Jenny Jett`
- `Olivia Salazar`
- `Rio de Janeiro City Grid`
- `Restrictive Net Zoning`
- `Black Ice Quality Assurance`

Begründung: Batch 3 stabilisiert RemoteRole-/Run-Tax-Normalisierung. Der nächste spielstärkerelevante read-only Pilot kann diesen Pfad mutiger auf Corp Remote/Upgrades/Regions ausweiten, solange Remote-Safety, Reserve-Risk und Strategie als Overlay/Context getrennt bleiben.

Fallback: Breaker-/Icebreaker-Longtail, falls Corp Remote Longtail zu strategie- oder boardstate-lastig wird.

## Bewusst nicht geändert

- Keine Änderung an `data/ai/ai-card-hints-active.json`.
- Keine Änderung an `aiSupportStatus`.
- Keine Engine-, Runtime-, Planner- oder Consumer-Anbindung.
- Keine aktive Hintmigration.
- Keine Profilumschaltung, keine neuen Decks, keine Holdout-Optimierung.
