---
activityId: act-2026-05-17-audio-cue-sound-design-review
status: done
kind: concept
area: web
priority: low
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-05-17
startedAt: 2026-05-17
completedAt: 2026-05-17
branch:
releaseTarget:
blockedBy: []
resultArtifacts:
  - docs/derived/AUDIO_CUE_SOUND_MATRIX_2026_05_17.md
  - apps/web/app/action-cues.ts
  - apps/web/app/action-cues.test.ts
  - apps/web/app/page.tsx
checks:
  - corepack pnpm --filter @netgrid/web test -- action-cues.test.ts -t "sound"
  - corepack pnpm --filter @netgrid/web typecheck
  - git diff --check
---

# Stimmigere UI-Sounds und Cue-Coverage prüfen

## Ziel

Die aktuellen UI-Sounds sollen darauf geprüft werden, ob sie zum NETGRID-Spielgefühl passen und wichtige Spielereignisse ausreichend akustisch abdecken. Ziel ist eine kleine, private Sounddesign-Verbesserung ohne Engine- oder Replay-Bezug.

## Kontext und Quellen

- Nutzerbefund vom 2026-05-17: Die aktuellen Geräusche wirken eher wie einfache Piepsgeräusche und könnten stimmiger sein.
- Es gibt vermutlich Ereignisse, die noch keinen Ton haben, obwohl ein dezenter Hinweis sinnvoll wäre.
- Aktuelle Anker:
  - `apps/web/app/action-cues.ts` ordnet Action-Cues Soundarten zu.
  - `apps/web/app/action-cues.test.ts` prüft u. a. Soundzuordnung und Draw-Wiederholungen.
  - `apps/web/app/page.tsx` enthält lokale Web-Audio-Erzeugung für Action-Cues, Ergebnis-Sounds und Kartenzieh-Snap.
  - `apps/web/app/page.tsx` nutzt `AudioContext`/Oscillator/Noise statt externer Audiodateien.
- Verwandtes, aber getrenntes Paket: `act-2026-05-17-audio-randomness-determinism` behandelt nur deterministische Testbarkeit des Audio-Rauschpfads.

## Kleine Analyse

- Kurzfristig ist wahrscheinlich kein vollwertiges KI-generiertes Sounddesign sinnvoll. Besser ist ein pragmatischer Review: Welche Ereignisse brauchen überhaupt Ton, welche sollen bewusst still bleiben, und welche Tonfamilien wirken weniger piepsig?
- Für private lokale Nutzung könnten entweder bessere synthetische Web-Audio-Klänge gebaut oder kleine lizenzsichere Sounddateien recherchiert/importiert werden.
- Sounds sollten zurückhaltend bleiben, weil NETGRID viele kleine Aktionen erzeugt. Zu viele Töne können die Spielbarkeit verschlechtern.
- Sinnvolle Soundfamilien könnten sein:
  - Karten ziehen: kurzer Papier-/Snap-Sound.
  - Credit nehmen/ausgeben: dezenter Münz-/Chip-Sound.
  - Install/Rez: technischer Klick bzw. Power-up.
  - Run/Encounter/Access: kurze Netzwerk-/Scan-Töne.
  - Damage/Trash/Score/Steal: stärker unterscheidbare Akzente.
  - Game result: klarer Abschluss, aber nicht laut oder verspielt.

## Scope

- Bestehende Soundzuordnung in `action-cues.ts` inventarisieren.
- Prüfen, welche wichtigen `PublicGameEvent`-/Action-Typen aktuell keinen Ton haben.
- Vorschlag für eine kleine Soundmatrix erstellen: Ereignisfamilie, gewünschte Wirkung, Soundart, Priorität.
- Entscheiden, ob synthetische Web-Audio-Sounds ausreichen oder ob lizenzsichere lokale Soundassets gesucht werden sollen.
- Bei Umsetzung: einige häufige Piep-Sounds durch passendere, dezente Soundfamilien ersetzen.
- Lautstärke, Wiederholungen und Opt-in-Verhalten beibehalten.

## Nicht im Scope

- Keine Engine-Regeländerung.
- Keine Änderung an Replay, StateHash, RandomCounter oder PublicEvents.
- Keine offiziellen, fremden oder unklar lizenzierten Assets.
- Keine Pflicht-Audioausgabe; Audio bleibt lokal und optional.
- Keine breite Audio-Engine oder komplexes Sound-Mixing-System.

## Akzeptanzkriterien

- [ ] Eine Soundmatrix dokumentiert, welche Ereignisse Ton haben, keinen Ton haben oder bewusst still bleiben.
- [ ] Häufige bestehende Piepsounds sind auf Stimmigkeit geprüft und bei Bedarf ersetzt oder angepasst.
- [ ] Fehlende sinnvolle Soundereignisse sind identifiziert und priorisiert.
- [ ] Audio bleibt optional und respektiert die bestehende Lautstärkeregelung.
- [ ] Keine verdeckten Informationen werden über Sound verraten; redigierte/hidden Aktionen bleiben akustisch generisch.
- [ ] Falls Soundassets genutzt werden, ist die Lizenz-/Herkunftslage dokumentiert und private lokale Nutzung klar.
- [ ] Fokussierte Tests prüfen Soundzuordnung/Coverage, oder eine Testauslassung ist begründet dokumentiert.

## Umsetzungshinweise

- Zuerst nur Matrix/Inventar erstellen, dann kleine Umsetzung.
- `ActionSoundKind` möglichst klein und semantisch halten, z. B. `draw`, `credit`, `install`, `rez`, `run`, `access`, `score`, `trash`, `damage`, `result`.
- Redigierte Aktionen dürfen keinen spezifischen Sound nutzen, der verdeckte Kartentypen oder Ziele verrät.
- Falls synthetisch: weniger reine Sinus-Pieps, mehr kurze Hüllkurven, Noise-Anteile, Filter und dezente Layer.
- Falls Assets: nur lokal versionierte, lizenzsichere kurze Dateien; keine externen Laufzeitabhängigkeiten.

## Ergebnisnotiz

Erledigt. Eine Soundmatrix dokumentiert Ereignisfamilien, bewusst generische Hidden-Sounds und stille Systempfade. Die Soundzuordnung deckt nun auch Choice, Purge und Game-End ab; verdeckte Installationen bleiben bei `install_hidden`. Einige synthetische Patterns wurden weniger sinus-/piepslastig und leiser/technischer abgestimmt. Es wurden keine externen Assets genutzt; Audio bleibt optional und an die bestehende Lautstaerke gekoppelt.
