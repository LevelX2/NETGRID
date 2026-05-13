# V1.9.19 Requirements Review

Status: accepted for implementation
Stand: 2026-05-13

## Entscheidung

Die V1.9.19-Requirements sind umsetzbar. Der erste Schnitt beginnt mit Runtime-/Catalog-WIP und No-Promotion-Guard. Danach folgen Agenda-/Overadvance-Kernpfade und erst anschließend finale Manifest-/AI-/Web-Promotion.

## Risiken

- Agenda-Punkt- und Difficulty-Drift kann Siegbedingungen verfälschen.
- Hidden-Zone- und Ambush-Randpfade dürfen keine privaten Karteninformationen in AI-Inputs, PublicEvents oder Reconnect-Payloads schreiben.
- AI darf keine noch nicht legalen Score-/Forfeit-/Overadvance-Aktionen erfinden.

## Removal Conditions

Ein V1.9.19-Blocker ist erst erreicht, wenn keine lokale Regelkern-Aussage für eine Zielkarte vorliegt oder ein Engine-Pfad trotz isolierter Revalidierung nicht side-sicher modellierbar ist.
