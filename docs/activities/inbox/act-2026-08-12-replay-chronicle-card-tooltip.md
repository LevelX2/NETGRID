---
activityId: act-2026-08-12-replay-chronicle-card-tooltip
status: inbox
kind: fix
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-08-12
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Karten-Tooltip der Spielchronik im Replay vollständig anzeigen

## Ziel

Kartenreferenzen in der Spielchronik eines Replays zeigen beim Hover oder Fokus
dieselbe zur Tooltip-Einstellung passende Kartenansicht wie im laufenden Spiel,
statt lediglich Chronik- oder Regeltext erneut auszugeben.

## Kontext und Quellen

- Nutzerfund vom 2026-08-12: Im aktiven Spiel funktioniert die Kartenanzeige
  aus der Spielchronik; im Replay erscheint beim Überfahren derselben Art von
  Eintrag höchstens wieder Text, aber keine Karte.
- `apps/web/app/replays/page.tsx` stellt Replay-spezifische
  `CardTooltipSettingsContext`-, Bildpräferenz- und Katalog-Präsentationswerte
  bereit.
- `apps/web/features/chronicle/ChronicleCardTrigger.tsx` entscheidet anhand
  dieser Kontexte zwischen Bild- und Text-Tooltip.
- Bestehende Tests decken das Einlesen der Replay-Tooltip-Einstellungen ab,
  jedoch keinen Karten-Trigger der Replay-Spielchronik.

## Scope

- Den tatsächlichen Daten- und Renderpfad einer Kartenreferenz in der
  Replay-Spielchronik gegen den funktionierenden Pfad im aktiven Spiel
  vergleichen.
- Ursache beheben, weshalb im Replay keine zur Einstellung passende
  Kartenansicht erscheint, insbesondere im Bildmodus.
- Sicherstellen, dass einfache und erweiterte Textmodi weiterhin ihre
  beabsichtigte Darstellung liefern.
- Einen fokussierten Regressionstest für eine Replay-Chronik-Kartenreferenz
  ergänzen; er soll die Verbindung von Replay-Kontext, Kartenpräsentation und
  Tooltip-Darstellung abdecken.

## Nicht im Scope

- Redesign der Spielchronik oder der allgemeinen Karten-Tooltip-Einstellungen.
- Änderungen am Replay-Format, an der Rules Engine oder am Eventinhalt ohne
  nachgewiesene Ursache.
- Lockerung von Hidden-Info-Schutz, Replay-Redaktion, deterministischem Replay
  oder StateHash.

## Akzeptanzkriterien

- [ ] Eine im Replay sichtbare Kartenreferenz der Spielchronik öffnet bei
  Hover und Tastaturfokus einen Tooltip.
- [ ] Im Bildmodus enthält der Tooltip die zur Kartenreferenz gehörende
  Kartenansicht, wenn für die Karte eine zulässige Präsentation verfügbar ist;
  er degradiert nicht unbegründet zu erneutem Chroniktext.
- [ ] Im einfachen und erweiterten Modus bleibt die jeweilige Textansicht
  vollständig und konsistent zum aktiven Spiel nutzbar.
- [ ] Nicht sichtbare oder im Replay redigierte Karteninformationen werden
  weiterhin nicht über den Tooltip offengelegt.
- [ ] Ein fokussierter Regressionstest deckt den realen Replay-Pfad ab.

## Umsetzungshinweise

- Primärer Folgeagent: `small-adjustments-agent`.
- Zuerst verifizieren, ob die Replay-Kartenpräsentation, die Bildquelle oder
  die konkrete Chronik-Card-Referenz fehlt; keinen UI-Ersatztext als
  abschließenden Workaround einführen.
- Die bestehenden `CardTooltipSettingsContext`,
  `CardImagePreferenceContext` und `CatalogCardPresentationsProvider` nur an
  der ursächlichen Bindung korrigieren.

## Ergebnisnotiz

Noch offen.
