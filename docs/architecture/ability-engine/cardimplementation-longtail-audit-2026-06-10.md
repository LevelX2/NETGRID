# CardImplementation Longtail Audit 2026-06-10

Status: Paket-1-Audit
Arbeitsbranch: `codex/cardimplementation-optimization`

## Kontext

Der Review verarbeitet die Optimierungsblöcke aus der CardImplementation-Qualitätsanalyse. Ziel ist bessere Wartbarkeit und konsistentere Semantik-Auswertbarkeit, ohne Engine-Regeln, LegalActions, `applyAction`, Replay, StateHash, Randomness oder Hidden-Info-Verträge zu ändern.

## Inventar

- `packages/engine/src/card-implementations/**` enthält 532 TypeScript-Dateien.
- Davon liegen 373 Dateien unter `onr-v1/` und 154 Dateien unter `proteus/`.
- Es gibt 42 Runner-Program-Dateien mit `icebreakerAbilities`.
- Es gibt 78 Corp-ICE-Dateien mit `printedSubroutines`.
- Es gibt 36 Dateien mit Hosted-/Restricted-Credit-Mustern (`restrictedHostedCreditSource`, `add_hosted_credits` oder `take_hosted_credits`).
- Die CardImplementation-Dateien sind überwiegend kleine deklarative Definitionen. Das Risiko liegt deshalb weniger in duplizierten imperativen Resolvern und stärker in wiederholten Objektliteral-Strukturen und kartenbenannten Longtail-`kind`s.

## Bereits gute Strukturen

### Deklarative Effektvokabel

`packages/engine/src/ability-engine/definition-types.ts` definiert die engine-lokale CardImplementation-Vokabel und hält fest, dass diese Schicht keine Effekte ausführt, keinen `GameState` liest und keine konkreten Card IDs enthalten soll. Das ist die richtige Architekturgrenze.

### Generische Runtime-Pfade

Viele Effekte laufen bereits über generische Definitionen:

- `gain_credits`
- `draw_cards`
- `add_tags`
- `remove_tags`
- `damage`
- `trace`
- `make_run`
- `search_*`
- `add_hosted_credits`
- `take_hosted_credits`
- `prevent_installed_card_trash`

Damit sind die meisten Wiederholungen Definition-Duplikation, nicht Regelduplikation.

### Parametrisierte Beispiele

Diese Muster sind gute Vorbilder für weitere Helper:

- `RestrictedHostedCreditSourceImplementation` trennt Kapazität, Zweckbindung und Refresh.
- `CardVariableRezImplementation` parametrisiert `x_strength`, `paid_end_the_run_subroutines` und `alternate_subtype`.
- `CardTrashPreventionSourceImplementation` parametrisiert Kartentypfilter, Modus, Kosten, Priorität und Sichtbarkeit.

## Optimierungsblöcke

### A. Basic Icebreaker Factory

Bewertung: Code-Scope in diesem Prozess.

Aktueller Befund:

- Viele Basis-Icebreaker wiederholen dieselbe Struktur: `break_subroutine` plus `increase_strength`.
- Beispiele: `Codecracker`, `Loony Goon`, `Shaka`, `Raffles`, `Worm`, `Wild Card`, `Wizard's Book`, `Krash` und mehrere Proteus-Icebreaker.
- Ausnahmen wie `Blink`, `AI Boon`, `Bartmoss Memorial Icebreaker`, `Snowball`, `Dupré`, `Pile Driver`, `Hammer`, `Jackhammer`, `Ramming Piston`, `Morphing Tool` und andere Karten mit Randomness, Side Effects, Mehrfachbreaks oder ausgewähltem Subtype bleiben individuell.

Empfehlung:

- Kleiner Helper `basicIcebreakerAbilities({ breakCost, match, pumpCost, pumpAmount, pumpDuration })`.
- Kein neuer Runtime-Kind.
- Keine Card-Level-Factory, damit Kartendateien lesbar bleiben.

Risiko: niedrig.

### B. Printed ICE Subroutine Fragments

Bewertung: Code-Scope in diesem Prozess.

Aktueller Befund:

- Vanilla-ICE wiederholen `end_the_run` und andere gedruckte Subroutinen.
- Beispiele: `Crystal Wall`, `Data Wall`, `Quandary`, `Wall of Static`, `Cortical Scanner`, `Banpei`, `Data Naga`, `Triggerman`, `Sentinels' Prime`.
- Trace-Subroutinen wiederholen besonders oft `trace` + `onSuccess: add_tags`.

Empfehlung:

- Kleine Fragment-Helper wie `endTheRun()`, `endTheRunTimes(n)`, `trashProgram()`, `netDamage(amount)`, `brainDamage(amount)` und `traceTagSubroutine(baseTraceStrength)`.
- Helper erzeugen exakt bestehende `CardPrintedSubroutineImplementation`-Objekte.
- Keine ganze ICE-Factory.

Risiko: niedrig.

### C. Trace -> Tag Helper

Bewertung: Code-Scope in diesem Prozess, aber nur als Definition-Helper.

Aktueller Befund:

- Runtime löst `trace` bereits generisch.
- Wiederholt werden Definition-Blöcke für `onSuccess: [{ kind: "add_tags", recipient: "runner" }]`.
- Beispiele: `Hunter`, `Fetch 4.0.1`, `Data Raven`, `Pocket Virtual Reality`, `Chance Observation`, `Audit of Call Records`, `Blood Cat`, `Private Cybernet Police`, `Netwatch Operations Office`.

Empfehlung:

- `traceTagSubroutine(baseTraceStrength)` für gedruckte ICE-Subroutinen.
- `traceTagEffect(baseTraceStrength)` für `abilities` und `accessEffects`.
- Keine Änderung am Trace-Resolver.

Risiko: niedrig bis mittel, abhängig von betroffener Testabdeckung.

### D. Simple On-Play Economy/Draw Helper

Bewertung: Code-Scope optional, niedrige Priorität.

Aktueller Befund:

- `Livewire's Contacts`, `Score!`, `Accounts Receivable`, `Efficiency Experts`, `Annual Reviews`, `Day Shift`, `Night Shift`, `Jack 'n' Joe` und `Bodyweight Synthetic Blood` wiederholen einfache `on_play`-Effekte.

Empfehlung:

- Nur kleine Helper für `onPlayGainCredits(amount, recipient)` und `onPlayDrawCards(amount, recipient)`, falls der Paketumfang nach Icebreaker/Subroutine-Helpern stabil bleibt.
- Risiko-/Liability-Karten wie `Loan from Chiba`, `Lucidrine Booster Drug`, `Drone for a Day`, `Faked Hit` bleiben individuell.

Risiko: niedrig, Nutzen eher Lesbarkeit.

### E. Recurring/Hosted Credit Helper

Bewertung: vorerst Follow-up, kein Code-Scope in diesem Prozess.

Aktueller Befund:

- 36 Dateien enthalten Hosted-/Restricted-Credit-Muster.
- Der Bestand ist semantisch wichtig, aber differenziert: Runner-Icebreaker-Credits, Noisy-Ausschlüsse, Trace-/Link-Credits, Corp-Campaign-Credits, Agenda-/Asset-Credits, Trash-when-empty und Start-of-turn-Refresh unterscheiden sich.

Empfehlung:

- In einem eigenen Paket nach Basic-Helpern schneiden.
- Nicht in denselben Code-Schnitt aufnehmen, weil die Abnahmematrix breiter wäre.

Removal Condition:

- Hosted-Credit-Helper erst umsetzen, wenn Kapazität, Zweckbindung, Refresh, Cleanup und PublicPayload pro Familie als Fixture-Liste vorliegen.

### F. Credit Bank / Campaign Helper

Bewertung: vorerst Follow-up.

Aktueller Befund:

- `Broker`, `Short-Term Contract`, `Rigged Investments` und Corp-Campaigns sind mechanisch ähnlich, aber nicht identisch.

Empfehlung:

- Separater Slice mit Tests für Empty-Trash, Partial-Take, Start-of-turn-Reihenfolge und Debt-/Liability-Nichtberührung.

Removal Condition:

- Erst umsetzen, wenn `add_hosted_credits`/`take_hosted_credits`-Profile pro Karte als Tabelle vorliegen.

### G. Search / Recovery / Install Profile

Bewertung: Follow-up.

Aktueller Befund:

- Runtime kennt bereits Search-/Hidden-Zone-Callbacks.
- Karten wie `Mantis`, `Temple Microcode Outlet`, `Self-Modifying Code`, `Sneak Preview`, `Airport Locker`, `The Short Circuit`, `Aujourd'hui`, `N.E.T.O.`, `Ronin Around` und `Test Spin` unterscheiden sich aber in Filter, Reveal, Shuffle, Installkosten, Timing, Zone und Rückgabe.

Empfehlung:

- Nicht als "Install-Magie" abstrahieren.
- Späteres Profil `searchOrRecoveryProfile` mit expliziten Parametern und Hidden-Info-Tests.

Risiko: mittel bis hoch.

### H. Trash Prevention / Trash Replacement / Hosted Recovery

Bewertung: wichtig, aber kein Code-Scope in diesem Prozess.

Aktueller Befund:

- `prevent_installed_card_trash` ist bereits generisch.
- `Microtech Backup Drive` nutzt dagegen `microtech_backup_drive_program_trash_replacement`.
- Fachlich ist Microtech Replacement plus Hosted-Recovery plus Leave-Play-Cleanup, nicht bloße Prevention.

Empfehlung:

- Eigenes Paket mit neuer generischer Replacement-Struktur, nicht in `prevent_installed_card_trash` quetschen.
- Nötig wären neue Definitionstypen und Runtime-/Choice-/Cleanup-Anbindung.

Removal Condition:

- Erst umsetzen, wenn ein generischer Vertrag für "would trash installed cards -> optional replace by move to hosted-on-source -> retrieval action -> leave-play cleanup" vorliegt.

### I. Move / Uninstall / Shuffle-Draw

Bewertung: Follow-up.

Aktueller Befund:

- `Cowboy Sysop` nutzt `cowboy_sysop_uninstall_corp_card_to_hq`.
- `Rescheduler` nutzt `rescheduler_hq_shuffle_draw`.
- Beide sind kartenbenannt, aber aktuell an eigene Runtime-Pfade gekoppelt.

Empfehlung:

- Später generische Zone-Move-Effekte prüfen: `move_installed_card_to_zone` und `shuffle_zone_into_zone_then_draw_count`.
- Nicht in diesem Prozess umsetzen, weil Zielbinding, Hidden-Info-Payloads und Choice-Auswahl betroffen sind.

### J. Successful-Run-Followups

Bewertung: Follow-up.

Aktueller Befund:

- `hidden_resource_successful_hq_run_corp_lose_credits` und `hidden_resource_successful_remote_run_trash_fort` benennen den Installations-/Sichtbarkeitskontext statt den Mechanismus.

Empfehlung:

- Später `successful_run_before_access_effect` als generisches Modell prüfen.
- Nicht im selben Slice, weil successful-run timing, Access-Replacement und Hidden-Info eng gekoppelt sind.

### K. Agenda-Score-Longtails

Bewertung: nicht vorrangig.

Aktueller Befund:

- `ai_cfo_shuffle_hq_archives_into_rd_draw`, `priority_requisition_rez_ice_at_no_cost`, `ice_transmutation_rezzed_ice_modifier`, `corporate_downsizing_hq_agendas`, `security_purge_top_rd` und `data_fort_reclamation` sind kartenbenannt.
- Agenda-Score-Effekte haben oft komplexe Timing-, Zone- und Hidden-Info-Anteile.

Empfehlung:

- Nicht in diesem Prozess umsetzen.
- Nur dort später ersetzen, wo ein klarer generischer Score-Mechanismus mehrfach vorkommt.

## Code-Scope dieses Prozesses

Dieses Prozess-Run setzt maximal diese risikoarmen Blöcke um:

1. Basic-Icebreaker-Helper.
2. Printed-Subroutine-Fragment-Helper.
3. Trace->Tag-Definition-Helper.
4. Optional einfache On-Play Economy/Draw-Helper, wenn Paket 2 stabil bleibt.

Nicht-Code-Scope dieses Prozess-Runs:

- Microtech Backup Drive / Trash Replacement.
- Move-/Uninstall-/Shuffle-Draw.
- Successful-run-before-access-Followups.
- Agenda-Score-Longtails.
- Search-/Install-/Hidden-Zone-Profile.
- Hosted-Credit- und Credit-Bank-Familien.

## Akzeptanzmaßstab

Ein `kind` sollte nicht nach einer Karte heißen, wenn der Effekt als Mechanismus mit Parametern beschreibbar ist. Dieser Prozess ersetzt aber nur solche Strukturen direkt, bei denen die vorhandene Runtime bereits generisch genug ist. Alles andere wird als Folgepaket statt als verdeckte Regeländerung behandelt.

## Umsetzungsergebnis dieses Prozess-Runs

### Paket 2 umgesetzt

- `packages/engine/src/card-implementations/helpers.ts` eingeführt.
- Basic-Icebreaker-Definitionen für elf ONR-v1-Programme und drei Proteus-Programme auf `basicIcebreakerAbilities` migriert.
- Gedruckte ICE-Subroutine-Fragmente für einfache ETR-, Multi-ETR-, Trash-Program+ETR- und Damage+ETR-ICE auf Helper migriert.
- Keine Runtime-Datei, kein LegalAction-Vertrag und kein PublicPayload-Vertrag geändert.

### Paket 3 umgesetzt

- Reine Trace->Tag-Definitionen auf `traceTagEffect` oder `traceTagSubroutine` migriert.
- Migriert wurden:
  - `Audit of Call Records`
  - `Chance Observation`
  - `Blood Cat`
  - `Netwatch Operations Office`
  - `Private Cybernet Police`
  - `Fetch 4.0.1`
  - `Hunter`
  - `Jack Attack`
  - `Pocket Virtual Reality`
- Nicht migriert wurden Trace-Effekte mit Zusatzkosten, Hidden-Info-Access-Limits oder weiteren Success-Effekten, z. B. `Data Raven`, `Schlaghund Pointers`, `Turbeau Delacroix`, `Homewrecker`, `Manhunt` und `Underworld Mole`.

### Verify-Hinweise

Grün:

- `corepack pnpm --filter @netgrid/engine typecheck`
- `corepack pnpm --filter @netgrid/engine exec vitest run src/card-implementations/definition-descriptors.test.ts`
- fokussierte Coverage-Untertests:
  - `migrates P3.44 simple icebreakers`
  - `migrates P3.56 remaining Corp ICE longtail subroutines`
  - `migrates Proteus PRO004 simple icebreakers`
- fokussierte Trace-Regressionen:
  - `gates Chance Observation and Audit of Call Records`
  - `resolves operation traces outside runs`
  - `starts V1.9.3 agenda trace actions`
  - `keeps Blood Cat`
  - `runs each V1.9.14 Trace ICE`
- `git diff --check`

Bekannter unabhängiger Check-Befund:

- Die vollständige `src/card-implementations/coverage.test.ts` läuft bis auf den bestehenden Proteus-Manifest-Drift `manifestAiSupportDrift: 154` grün. Dieser Drift betrifft die `ai_supported`-Manifestparität aller Proteus-Karten und ist nicht durch den Helper-Refaktor verursacht.
