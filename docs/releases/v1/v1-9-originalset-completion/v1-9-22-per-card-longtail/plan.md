# V1.9.22 Detailed Plan - Per-card Resolver Longtail und Originalset Completion Gate

Stand: 2026-05-13
Status: planned

## Ziel

V1.9.22 schliesst die letzte Originalset-Completion-Gruppe fuer genau 47 Longtail-Karten. Der Release darf keine V2.x-Funktion entsperren, bevor alle Karten dieses Slices entweder `human_playable`, `deck_legal` und `ai_supported` sind oder mit konkretem Blocker und Removal Condition dokumentiert wurden.

## Scope

- Runner-Programme: False Echo, Flak, Hammer, Japanese Water Torture, Netspace Inverter, Newsgroup Filter, Poltergeist, Rabbit, Reflector, Scatter Shot, Shield, Speed Trap, Startup Immolator, Zetatech Software Installer.
- Runner-Events: Anonymous Tip, Core Command: Jettison Ice, Forged Activation Orders, If You Want It Done Right..., misc.for-sale, Open-Ended Mileage Program, Organ Donor, Security Code WORM Chip, Synchronized Attack on HQ, Valu-Pak Software Bundle.
- Runner-Hardware: Arasaka Portable Prototype, Artemis 2020, Bodyweight Data Creche, Corolla Speed Chip, Microtech Backup Drive, Pandora's Deck, Parraline 5750, PK-6089a, ZZ22 Speed Chip.
- Corp-Agendas: Corporate Retreat, Corporate War, Data Fort Reclamation, Marine Arcology, Political Overthrow, Security Purge.
- Corp-ICE: Haunting Inquisition, Tutor, Viral 15, Virizz, Zombie.
- Corp-Operations: Edgerunner, Inc., Temps, Off-Site Backups, Planning Consultants.

## Umsetzungsschnitte

1. Catalog-WIP-Zielmenge `ONR_V1_9_22_WIP_CARD_IDS` ergaenzen, ohne Runtime-, Release- oder AI-Promotion.
2. Karten nach vorhandenen Mechanikfamilien clustern: simple install/static hardware, breaker/pump-break, run/ice/rez-manipulation, agenda/economy, operation utility und per-card Sonderfall.
3. Pro Cluster zuerst LegalAction-/applyAction-Pfade und negative Revalidation abdecken, danach Manifest/Coverage/Szenario/AI-Artefakte nachziehen.
4. Erst nach vollstaendiger Engine-, Visibility-, Replay-/StateHash- und AI-Abdeckung finale Catalog-/AI-Promotion, Webclient-Version `V1.9.22` und Final Review setzen.

## No-Scope

- Keine V2.x-Produktfreigabe.
- Keine offiziellen Assets, keine externen Kartendatenbanken, kein Kartentextparser als Autoritaet.
- Keine Freigabe von Karten ausserhalb der 47er-Zielmenge.

## Risiken

- Longtail-Karten koennen scheinbar klein wirken, aber eigene Timing- oder Sichtbarkeitsfenster brauchen. Gegenmassnahme: pro Karte ein expliziter Resolver-/Testnachweis oder Blocker.
- Originalset-Completion-Gate kann V2.x versehentlich freigeben. Gegenmassnahme: Final Review trennt Kartenabschluss und V2.x-Entsperrentscheidung explizit.
