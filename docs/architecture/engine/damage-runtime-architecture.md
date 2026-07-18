# Damage Runtime Architecture

Status: Current State seit E11 des Engine Architecture Refresh 2026-07-18

## Zweck

Die Damage-Domäne trennt unmittelbare Zustandsmutation von den vorgelagerten
Replacement- und Prevention-Fenstern. Diese Trennung ist fachlich relevant:
Zufall für Damage darf erst gezogen werden, nachdem alle anwendbaren Fenster
abgeschlossen sind. Die Modulaufteilung ändert keine Spielregel.

## Module

| Modul                        | Verantwortung                                                                                |
| ---------------------------- | -------------------------------------------------------------------------------------------- |
| `damage-core.ts`             | Kleine öffentliche Fassade und Orchestrierung der Fensterreihenfolge                         |
| `damage-runtime-context.ts`  | Typisierter Hostvertrag, Zustandszugriffe und gemeinsame Payload-/Sortierhilfen              |
| `damage-event-resolution.ts` | Finale Damage-, Tag- und Trash-Auflösung einschließlich RandomDrawRecords und PDCA-Folgepfad |
| `prevention-sources.ts`      | Ermittlung, Zahlungsprüfung, Revalidierung und Kosten von Prevention-/Boost-Quellen          |
| `prevention-window.ts`       | Persistierte Event-Modification-Zustandsmaschine und Choice-Auflösung                        |
| `damage-replacement.ts`      | Replacement-Kandidaten, Fenster und Replacement-Ausgänge                                     |

## Abhängigkeitsrichtung

```text
damage-runtime-context
        |
        v
damage-event-resolution
        |             \
        v              v
prevention-sources   damage-replacement
        |
        v
prevention-window
        \             /
         v           v
          damage-core
```

Die Richtung ist azyklisch. Produktive Aufrufer importieren weiterhin nur die
Fassade `damage-core.ts`; die Unterdomänen verwenden ihre jeweils tieferen
Verträge direkt.

## Nicht offensichtliche Verträge

- `openDamageResolutionWindow` prüft vollständige Replacements vor
  Event-Modification/Prevention und PDCA zuletzt. Die Reihenfolge darf nicht
  beiläufig umgestellt werden.
- `doDamage` ist ein Finalresolver. Sein erster Zufallszug darf erst nach allen
  Fenstern stattfinden; dadurch bleiben Seed, `RandomCounter`,
  `RandomDrawRecords`, Replay und StateHash deterministisch.
- Kandidaten werden vor dem Öffnen eines Fensters stabil sortiert und im
  Fensterzustand gespeichert. Choice-Auflösung revalidiert Quelle und Kosten,
  leitet aber die Reihenfolge nicht aus veränderlicher Registry-Iteration neu
  ab.
- Direkte Tag-Erhöhungen bleiben ausschließlich in den finalen Tag- und
  Replacement-Resolvern. Der ausführbare Boundary-Test schützt diese Autorität.
- Hidden Runner Resources werden erst über den gemeinsamen Reveal-Payload
  veröffentlicht, wenn ihre Kosten tatsächlich bezahlt werden.

## Ausführbare Strukturgrenzen

`scripts/check-engine-source-structure.mjs` verlangt alle sechs Module und
setzt pro Verantwortung ein Zeilenlimit. Dadurch kann die Fassade nicht erneut
zum Damage-Monolithen anwachsen; neue Regeln müssen dem fachlich passenden
Modul zugeordnet werden.
