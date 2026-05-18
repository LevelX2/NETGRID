---
activityId: act-2026-05-17-card-effect-generic-resolver-analysis
status: done
kind: architecture
area: engine
priority: high
primaryAgent: architecture-review-agent
requiresImplementation: false
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/architecture/card-rules/card-effect-generic-resolver-analysis-2026-05-17.md
  - docs/activities/inbox/act-2026-05-17-generic-economy-action-resolver.md
  - docs/activities/inbox/act-2026-05-17-generic-counter-credit-pool-resolver.md
  - docs/activities/inbox/act-2026-05-17-generic-scored-agenda-action-resolver.md
  - docs/activities/inbox/act-2026-05-17-ability-payload-metadata-consolidation.md
checks:
  - rg -c "definition\\.id ===|definition\\.id !==|sourceDefinition\\.id !==|definitionFor\\(state, .*\\)\\.id !==" packages/engine/src/index.ts
  - rg -n "function resolve.*(Asset|Agenda|Upgrade|Choice|Ability|Counter|Credits)|function .*Counter|function .*Credits|function .*Recurring|function .*Replacement|function .*Trace" packages/engine/src/index.ts
  - rg -n "export const .*_CARD_IDS|export const .*_CARD_ID|Record<.*CardDefinitionId|RUNTIME_.*PROFILES|PROFILES" packages/engine/src/mechanics packages/engine/src/index.ts
  - git diff --check
---

# Kartenlogik auf generische Effektresolver prüfen

## Ziel

Die Kartenimplementierung soll darauf geprüft werden, ob vergleichbare Effekte zu kartenspezifisch umgesetzt sind. Wiederkehrende Effektfamilien sollen perspektivisch über generische Resolver und datengetriebene Karteneigenschaften laufen, damit Erweiterungen und große Kartenpools nicht in hunderten isolierten Einzelroutinen enden.

## Kontext und Quellen

- Nutzerhinweis vom 2026-05-17: Wenn mehrere Karten vergleichbare Effekte haben, sollten sie nicht jeweils eigene Spezialroutinen bekommen. Stattdessen soll die Karte Eigenschaften oder ein kleines Skript liefern, das generische Routinen nutzt.
- Beispielrichtung: Eine Karte produziert über eine Aktion Credits; die eine Karte erzeugt 2, die andere 3 oder 6. Dafür sollte möglichst dieselbe Action-/Economy-Routine genutzt werden, parametrisiert über Kosten, Menge, Quelle und Timing.
- Erweiterungsziel: NETGRID soll mit zusätzlichen Erweiterungen und vielen weiteren Karten wachsen können, ohne dass pro Karte eine manuell verwobene Sonderroutine entsteht.
- Verwandtes Architekturpaket: `act-2026-05-17-engine-domain-extraction-plan` priorisiert bereits die Engine-Extraktion vor weiteren Erweiterungskarten. Dieses Paket ergänzt die fachliche Frage der Resolver-Generalisierung.

## Scope

- Aktuellen Stand analysieren:
  - Welche Karten sind per einzelner `definitionId`/`cardId`-Sonderfall implementiert?
  - Welche Karten nutzen bereits generische Mechanics-/Resolverfamilien?
  - Welche Effektfamilien treten mehrfach auf?
- Wiederkehrende Effektfamilien identifizieren, z. B.:
  - Aktionen gegen Credits.
  - Credits/Counters auf Karten legen oder von Karten nehmen.
  - Start-of-turn-/Recurring-Refresh.
  - Rez-/Install-/Trash-on-access-Standardpfade.
  - Scored-Agenda-Aktionen.
  - Server-/Root-/Upgrade-Modifier.
  - Trace/Tag/Damage/Prevention-/Replacement-Familien.
- Vorschlag für ein Zielmodell erarbeiten:
  - Kartendaten enthalten parametrisierte Ability-/Effect-Definitionen.
  - Generische Resolver interpretieren diese Definitionen.
  - Kartenspezifische Sonderfälle bleiben nur dort erlaubt, wo der Effekt wirklich einzigartig ist.
- Priorisieren, welche Familien zuerst generalisiert werden sollten, insbesondere vor Erweiterungskarten.
- Konkrete Folgepakete für die wichtigsten Familien vorschlagen.
- Wenn die Analyse ergibt, dass Umbauten nötig oder sinnvoll sind, direkt konkrete Folge-Activities in `docs/activities/inbox/` anlegen, statt nur abstrakte Empfehlungen zu formulieren.
- Folge-Activities bewusst klein, überschaubar und testbar schneiden. Kein Paket nach dem Muster "alles generisch umbauen".

## Nicht im Scope

- Keine sofortige breite Engine-Umsetzung in diesem Analysepaket.
- Keine Änderung an `applyAction`, Replay, StateHash oder Redaction ohne eigenes Folgepaket.
- Keine Kartenpromotion und keine neue Mechanikfreigabe.
- Keine automatische Migration aller bestehenden Karten in einem Schritt.
- Keine generische Skriptsprache mit beliebiger Laufzeitlogik; die Rules Engine bleibt Regelautorität.

## Akzeptanzkriterien

- [x] Eine Analyse listet kartenspezifische Resolver-Hotspots und bereits generische Resolverfamilien.
- [x] Wiederkehrende Effektfamilien sind priorisiert.
- [x] Es gibt eine Empfehlung, welche Effektfamilien vor weiteren Erweiterungskarten generalisiert werden sollten.
- [x] Das Zielmodell trennt klar zwischen parametrisierten generischen Effekten und echten Sonderfällen.
- [x] Hidden-Info-, LegalAction-, Replay- und StateHash-Grenzen sind als harte Anforderungen für generische Resolver benannt.
- [x] Mindestens drei konkrete Folgepakete sind vorgeschlagen, falls die Analyse Umsetzungsbedarf bestätigt.
- [x] Wenn Umsetzungsbedarf bestätigt ist, sind die wichtigsten Folgepakete tatsächlich als kleine, klar begrenzte Activities angelegt und im Ergebnis verlinkt.
- [x] Jedes Folgepaket benennt einen begrenzten Effektbereich, ein kleines Musterziel und klare Stop-Kriterien.

## Umsetzungshinweise

- Startpunkte sind `packages/engine/src/index.ts`, `packages/engine/src/mechanics/`, `data/rules/mechanics-coverage-*.json`, `data/manifests/` und die aktuellen Karten-/AI-Hint-Daten.
- Nicht nach maximaler Abstraktion suchen. Ziel ist eine pragmatische Wiederverwendung für häufige Effekte, nicht eine freie Kartentext-Engine.
- Gute erste Kandidaten sind einfache Economy-/Action-Fähigkeiten und Counter-/Credit-Pools, weil dort Parametrisierung naheliegt und viele Karten profitieren.
- Kartenspezifische Resolver sollten erlaubt bleiben, aber als Ausnahme mit Begründung und Tests.
- Folge-Activities sollen klein und familienbezogen sein, z. B. Economy-Aktionsresolver, Counter-/Credit-Pools oder scored-Agenda-Aktionsfamilien, nicht ein einzelner großer Generalisierungsumbau.
- Ein gutes Folgepaket kann ausdrücklich als Musterpaket formuliert werden: Wenn der kleine Schnitt gut funktioniert, danach weitere ähnliche Folgepakete anlegen.

## Ergebnisnotiz

Abgeschlossen. Die Analyse liegt in `docs/architecture/card-rules/card-effect-generic-resolver-analysis-2026-05-17.md`. Sie bestätigt Umsetzungsbedarf, priorisiert aber kleine, familienbezogene Schnitte statt eines breiten Engine-Umbaus.

Angelegte Folgepakete:

- `act-2026-05-17-generic-economy-action-resolver`
- `act-2026-05-17-generic-counter-credit-pool-resolver`
- `act-2026-05-17-generic-scored-agenda-action-resolver`
- `act-2026-05-17-ability-payload-metadata-consolidation`

Die harte Zielgrenze bleibt: keine freie Skriptsprache, keine Abschwächung von LegalAction-/`applyAction`-Revalidation, Hidden-Info-Redaction, Replay oder StateHash.
