---
activityId: act-2026-11-16-card-installation-sound
status: inbox
kind: concept
area: web
priority: normal
primaryAgent: small-adjustments-agent
requiresImplementation: true
createdAt: 2026-11-16
startedAt:
completedAt:
branch:
releaseTarget:
blockedBy: []
resultArtifacts: []
checks: []
---

# Eigener Sound für Karteninstallationen

## Ziel

Eine erfolgreich installierte Karte erhält einen kurzen, dezenten und
gut erkennbaren Ton. Ein etwas höherer Klang ist eine mögliche Richtung.

## Kontext und Quellen

- Nutzerbeobachtung vom 16.11.2026: Beim Installieren fehlt ein hörbares
  eigenes Signal, etwa für ein Upgrade, eine bezahlte Installation oder ICE.
- Die [Audio-Cue-Soundmatrix](../../architecture/live-match/audio-cue-sound-matrix-2026-05-17.md)
  führt `install_hidden` und `install_known` auf. Der Webclient verwendet
  dafür bereits einfache synthetische Töne und teilt das Mapping mit
  `advance_card`. Die Hörbarkeit im Spiel ist noch zu prüfen.

## Scope

- Eigenes Klangmotiv für bestätigte Karteninstallationen im Match.
- Die vorhandenen Einstellungen für Audio und Lautstärke verwenden.

## Nicht im Scope

- Klanggestaltung für Advance, Rez, das Ausspielen von Events und Operationen
  oder das Bezahlen von Credits als eigenständige Aktion.

## Akzeptanzkriterien

- [ ] Upgrades, ICE und bezahlte Karteninstallationen lösen bei aktiviertem
  Audio jeweils einmal den erkennbaren Installationston aus. Auch bei
  abgeschalteten visuellen Aktionshinweisen ist er hörbar.
- [ ] Abgebrochene oder abgelehnte Installationsversuche bleiben ohne
  Installationston. Lokale Aktion und Serverbestätigung erzeugen zusammen
  höchstens einen Installationston.
- [ ] Verdeckte Corp-Installationen verwenden einen generischen Klang, der
  dem Gegenüber keine verdeckten Kartentypen oder Kartennamen verrät.
- [ ] Lautstärke und Stummschaltung greifen. Eine Hörprobe im Match bestätigt,
  dass der Ton kurz, dezent und von Ziehen, Credits und Rez unterscheidbar ist.

## Umsetzungshinweise

Die Wiedergabe vom bestätigten Installationsereignis ableiten. Dazu die
Zuordnung in `apps/web/app/action-cues.ts`, die Audiowiedergabe in
`apps/web/lib/audio.ts` und den lokalen sowie den bestätigten Audiopfad in
`apps/web/app/page.tsx` und `apps/web/features/actions/local-action-sounds.ts`
prüfen. Falls eine Installation erst nach einer Auswahl abgeschlossen wird,
den Zeitpunkt der bestätigten Installation im Match mitprüfen.

## Ergebnisnotiz

Als Aufgabe erfasst. Produktion und Einbindung des Tons stehen aus.
