# Audio-Cue-Soundmatrix 2026-05-17

## Entscheidung

NETGRID nutzt vorerst synthetische Web-Audio-Sounds. Es werden keine externen Soundassets importiert, damit Lizenzlage, Offline-Nutzung und Repository-Groesse einfach bleiben. Audio bleibt lokal, optional und an die bestehende Lautstaerkeregelung gebunden.

## Matrix

| Ereignisfamilie | Action-/Event-Typen | Soundart | Wirkung | Prioritaet |
| --- | --- | --- | --- | --- |
| Zugwechsel | `end_turn` | `turn` | kurzer, tiefer Statuswechsel | mittel |
| Kartenziehen | `mandatory_draw`, `draw_card` | `draw` | Papier-/Snap-Anmutung mit kurzem Noise | hoch |
| Credits | `gain_credit` | `credit` | dezenter Chip-/Kassenimpuls | hoch |
| Installation verdeckt | `install_card` redacted | `install_hidden` | gedeckter mechanischer Klick ohne Kartenhinweis | hoch |
| Installation offen / Advance | `install_card`, `advance_card` public | `install_known` | kurzer technischer Klick | mittel |
| Karte spielen | `play_event`, `play_operation` | `play` | zweistufiger Ausspiel-Akzent | mittel |
| Rez | `rez_ice` | `rez` | leises Power-up | hoch |
| Run / Encounter | `start_run`, `continue_run`, `decline_rez`, `pump_breaker`, `break_subroutine` | `run` | kurzer Netzwerk-/Scanimpuls | hoch |
| Zugriff | `access_card` | `access` | einzelner Scan-Ping | hoch |
| Agenda | `score_agenda`, `steal_agenda` | `agenda` | heller, klarer Erfolgshinweis | hoch |
| Trash / Purge | `trash_accessed_card`, `trash_resource`, `purge_virus_counters` | `trash` | kurzer dumpfer Abwurf | mittel |
| Tag / Damage | `remove_tag`, Damage-/Tag-Folgeevents mit expliziter Action | `tag_or_damage` | warnender, dunkler Akzent | mittel |
| Choice | `resolve_choice` | `choice` | dezenter Interface-Klick | niedrig |
| Spielende | `game_end` und Result-Modal | `game_end` / Result-Sound | klarer Abschluss | hoch |

## Bewusst still oder generisch

- Sichtbar redigierte/hidden Aktionen bekommen nur generische Soundfamilien, z. B. `install_hidden`; kein Sound darf verdeckte Kartentypen, Kartennamen oder Zielinhalte verraten.
- Automatische Systemeffekte bleiben standardmaessig still, solange `includeAutomaticEffectCues` nicht aktiv ist.
- Sehr haeufige Kleinstereignisse bleiben leise und kurz, damit KI-gegen-KI oder lange Runs nicht akustisch ueberladen.

## Naechste Kandidaten

- Falls spaeter Audio-Smokes oder reproduzierbare UI-Demos entstehen, sollte der Noise-Anteil im Draw-Snap seedbar gemacht werden.
- Falls lokale Assets gewuenscht sind, nur kurze selbst erzeugte oder eindeutig lizenzsichere Dateien versionieren.
