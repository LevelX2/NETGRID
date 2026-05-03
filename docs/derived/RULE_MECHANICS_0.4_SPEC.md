# Rule Mechanics 0.4 Spec

Status: frozen_for_implementation  
Stand: 2026-05-03

## Safe Batch

- `simple_draw_event`: Runner zieht bis zu 2 Karten vom Stack.
- `simple_setup_hardware`: Runner installiert Hardware und erhöht Memory Limit um 1.
- `efficient_fracter`: Program mit normalem Pump/Break-Modell.
- `simple_draw_operation`: Corp zieht bis zu 2 Karten von R&D.
- `simple_taxing_barrier_ice`: ungebrochene Subroutine lässt Runner 1 Credit verlieren und beendet den Run.
- `simple_upgrade`: Corp-Root-Karte, verdeckt installiert, rezzbar, beim Access trashbar.

## Tags

- `give_runner_tag` ist eine ICE-Subroutine.
- `remove_tag` ist eine Runner-Grundaktion.
- Tags sind öffentliche Runner-Counter in PlayerViews.
- Tag-Erhalt allein ist keine neue Hidden-Info-Barrier.
- `simple_tag_punishment_operation` ist nur legal, wenn `runner.tags > 0`; Effekt: Runner verliert bis zu 2 Credits.

## Deferred Damage

Damage bleibt außerhalb von MVP 0.4. Grund: Hidden-Info, RandomDrawRecords, Undo-Barrieren und AI-Visibility brauchen ein eigenes Teilgate.
