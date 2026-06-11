# Data Fort Reclamation Sequence Boundary Review 2026-06-11

## Status

`review_complete_with_follow_up_boundary`

## Zweck

Dieser Review prüft, ob die aktuelle `Data Fort Reclamation`-Runtime weiterhin als MVP-Grenze tragfähig ist oder ob sofort ein größerer ordered-install/rez-Umbau nötig ist.

## Quellen

- `packages/engine/src/card-implementations/onr-v1/corp/agendas/data-fort-reclamation.ts`
- `packages/engine/src/game/corp/install-rez-sequence-handlers.ts`
- `packages/engine/src/game/corp/install-rez-sequence-handlers.test.ts`
- `packages/engine/src/index-tests/mechanics/per-card-longtail.test.ts`
- `docs/releases/v1/v1-9-originalset-completion/v1-9-22-per-card-longtail/data-fort-reclamation-runtime-contract.md`
- `docs/source/Netrunner Errata 1.70.md`
- `data/cards/originalset-v1-cards.json`

## Kartentext und Errata-Lage

Der lokale CardImplementation-Kommentar hält den relevanten Text fest:

> Gain [10] and choose up to four cards stored in HQ when you score Data Fort Reclamation. Create a new data fort using the cards chosen. Install the cards one at a time; you may rez them when you install them. Then, return to the bank any of the [10] not spent.

Die Errata-Quelle bestätigt zwei Vertragsgrenzen:

- Die Korp darf zusätzlich Credits aus dem eigenen Creditpool zum Installieren/Rezzing verwenden.
- Der Effekt erzeugt keine zusätzlichen Aktionen.

## Aktueller Runtime-Schnitt

Die aktuelle Runtime modelliert den Effekt zweistufig:

1. Korp-private HQ-Choice für bis zu vier installierbare Karten.
2. Prevalidation ohne State-Mutation.
3. Neues Remote nur bei nicht leerer Auswahl.
4. Installation der gewählten Karten in stabiler Choice-Reihenfolge.
5. Danach zweite Korp-private Rez-Choice für neu installierte rezbare Karten.
6. Rez-Kosten werden zuerst aus dem 10-Credit-Effektpool und danach aus Korp-Credits bezahlt.

Dieser Schnitt ist für die vorhandene Smoke-Coverage tragfähig:

- ICE plus eine Root-Karte werden in ein neues Remote installiert.
- Nullauswahl erzeugt kein Remote.
- Ungültige Root-Auswahl mutiert keinen State.
- Wrong-side, stale-state, Hidden-Info, PublicPayload und Replay/StateHash sind getestet.

## Bewertete Grenzfälle

### Reihenfolgeeffekte

Der Kartentext verlangt eine installierte Reihenfolge. Die Runtime bewahrt die Auswahlreihenfolge beim Installieren, bietet das Rezzing aber erst nach Abschluss aller Installationen an.

Für die aktuell getesteten ICE/Root-Fälle ändert das Verhalten den Ergebniszustand nicht: Die Korp kann dieselben rezbaren Karten mit demselben temporären Budget rezzen, Hidden-Info bleibt geschützt und der öffentliche Payload bleibt count-basiert.

### Root-Kapazität

Die Prevalidation simuliert das neue Remote und prüft Root-Installierbarkeit vor der Mutation. Dadurch sind offensichtliche Root-Kapazitätsfehler nicht mehr teilmutierend.

### Regionen und Root-Rez-on-install

Hier liegt die relevante MVP-Grenze.

Mehrere Originalset-Region-Upgrades tragen den Vertrag: Region beim Installieren rezzen, nur installieren, wenn die Korp das Rezzen bezahlen kann, und ältere Regionen im Fort trashen. Der normale `installCard`-Pfad enthält dafür `rootInstallRezzesOnInstall(...)`, `appendRootRezOnInstallEffect(...)` und Region-Replacement-Aufräumung.

Die aktuelle Data-Fort-Reclamation-Sequenz nutzt diesen normalen Root-Install-Pfad nicht. Eine Region aus HQ würde zunächst verdeckt installiert und erst in der nachgelagerten Rez-Choice optional gerezzt. Das ist nicht präzise genug für eine vollständige Region-/Install-on-install-Regeltreue.

## Entscheidung

Kein stiller Runtime-Umbau in diesem Review-Paket.

Der bestehende MVP-Schnitt bleibt für den aktuell getesteten Data-Fort-Reclamation-Hauptpfad akzeptiert:

- ICE plus nicht-regionale Root-Karte.
- Hidden-Info-sichere Auswahl.
- Temporärer Rez-Creditpool.
- Deterministisches Replay.

Regionen und künftige install-on-install/rez-on-install Interaktionen bleiben als fachliche Sequenzgrenze dokumentiert. Eine korrekte Lösung braucht einen neuen ordered-install/rez-Sequenzvertrag statt eines kleinen Handler-Patches.

## Removal Conditions für einen Folgeumbau

Ein späterer Codeumbau ist fällig, wenn Data Fort Reclamation Regionen oder andere install-on-install/rez-on-install Karten vollständig regeltreu unterstützen soll.

Dann muss der neue Vertrag mindestens leisten:

- Explizite geordnete Installationssequenz pro gewählter Karte.
- Nach jeder installierten Karte ein passendes Pflicht- oder Optional-Rez-Fenster.
- Temporären 10-Credit-Pool über alle Install-/Rez-Schritte tragen.
- Korp-Credits als Zusatzquelle nutzen.
- Root-Kapazität, Region-Replacement und `rootInstallRezzesOnInstall(...)` integrieren.
- Hidden-Info-Barrieren für HQ-Auswahl und nicht öffentliche Kartenidentitäten erhalten.
- PublicPayload weiter count-/source-sicher halten.
- Replay/StateHash und stale/wrong-side Revalidation für jeden Sequenzschritt testen.

## Teststand dieses Reviews

Der bestehende Fokuscheck bleibt der passende Regressionstest für den aktuellen MVP-Schnitt:

```powershell
corepack pnpm --filter @netgrid/engine exec vitest run src/game/corp/install-rez-sequence-handlers.test.ts
```
