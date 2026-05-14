# V1.9.22 Zetatech Software Installer Overlay Runtime Contract

Stand: 2026-05-14 19:50 CEST
Status: implemented WIP contract, no catalog/AI/release promotion

## Zweck

Dieser Vertrag begrenzt den naechsten nicht-promotenden Runtime-Schnitt fuer `Zetatech Software Installer` (`onr_v1_075_zetatech-software-installer`). Der vorhandene WIP deckt Installkosten 0, MU 1, zwei restricted Recurring Credits fuer Programminstallationen und Runner-Zugstart-Refresh ab. Offen ist nur der Overlay-Zustandswechsel.

## Lokale Fakten

- Runner-Programm, Installkosten 0, MU 1.
- Zwei restricted Recurring Credits aus der Bank fuer Programminstallationen.
- Genutzte Recurring Credits refreshen zu Beginn des naechsten Runner-Zugs ohne Akkumulation.
- Die Karte erlaubt Programminstallation "over itself"; diese Formulierung beschreibt einen State-Transition-Vertrag, nicht zusaetzliche Credits oder eine neue Aktion.

## Enger WIP-Vertrag

1. Overlay wird nur fuer Programme aus der Grip angeboten.
2. Overlay wird nur angeboten, wenn `Zetatech Software Installer` installiert und nicht bereits selbst gehostet ist.
3. Overlay ist eine `install_card`-LegalAction mit `hostOnCardId` auf den installierten Zetatech Software Installer und einem expliziten Payload-Marker `v1922ZetatechOverlayInstall`.
4. Die installierte Overlay-Karte bleibt Runner-Programm in der Rig, referenziert aber `hostedOn` auf den Zetatech Software Installer.
5. Overlay-Programme verbrauchen keine zusaetzliche Runner-MU ueber den vorhandenen Zetatech-MU hinaus.
6. Installkosten koennen die zwei restricted Recurring Credits von Zetatech Software Installer nutzen; restliche Kosten kommen aus Runner-Credits.
7. `applyAction` revalidiert Seite, StateVersion, installierte Quelle, Programmkartentyp, Grip-Zone, Kosten, Recurring-Counter und den Overlay-Marker.
8. PublicPayload nennt nur Quelle, installierte Public-Definition, genutzte Recurring Credits, Runner-Credits danach und `zetatechOverlayInstall: true`.
9. Replay/StateHash muss stabil sein; keine Grip-Liste, nicht ausgewaehlten Grip-Karten oder privaten Payloads duerfen leaken.

## Testpflicht

- Normale Zetatech-Installation bleibt unveraendert.
- Overlay-LegalAction erscheint nur bei installiertem Zetatech und installierbarem Programm in Grip.
- Wrong-Side-/Stale-Revalidation fuer Overlay-`install_card`.
- Overlay-Install nutzt Recurring Credits vor Runner-Credits.
- Overlay-Programm hat `hostedOn` auf Zetatech und erhoeht `memoryUsed` nicht.
- PublicPayload ist side-sicher.
- Replay/StateHash stabil.
- Keine Catalog-, AI-, Webclient- oder Release-Promotion.

## Nicht Teil dieses WIP

- Mehrere gleichzeitige Overlay-Ebenen.
- Verschieben vorhandener gehosteter Karten auf einen neuen Host.
- AI-Hints oder finale Decklegalitaet.
