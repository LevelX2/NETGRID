import { Activity, Clipboard, Image, Keyboard, Moon, Shield, SlidersHorizontal, Sun, Trash2, Volume2, VolumeX, ZoomIn } from "lucide-react";

import type { SessionInfo } from "../../app/session-recovery";
import type { CuePositionPreference, CuePositionPreset } from "../../app/action-board-ui";
import { reconnectUrlForSession } from "../../lib/session-url";
import {
  CARD_SCALE_PERCENT_MAX,
  CARD_SCALE_PERCENT_MIN,
  CARD_SCALE_PERCENT_STEP,
  aiPacingModeHelp,
  normalizeCardScalePercent,
  normalizeCardTooltipHoverDelayMs,
  normalizeCardTooltipMode,
  normalizeCueAutoDismissMs,
  type ActionPanelMode,
  type AiPacingMode,
  type CardDisplayMode,
  type CardTooltipHoverDelayMs,
  type CardTooltipMode,
  type ChronicleDetailMode,
  type ColorScheme,
  type CueAutoDismissMs,
  type ResourceStripMode
} from "./settings-model";

function sideLabel(side: "runner" | "corp"): string {
  return side === "runner" ? "Runner" : "Korp";
}

export function OptionsPanel({
  actionCueAutoDismissMs,
  actionCuesEnabled,
  automaticEffectCuesEnabled,
  autoCorpMandatoryDrawEnabled,
  autoDiscardEnabled,
  autoEndTurnEnabled,
  topbarStickyEnabled,
  resourceStripMode,
  actionPanelMode,
  aiDecisionDebugOverlayEnabled,
  audioEnabled,
  audioVolume,
  cardTooltipHoverDelayMs,
  cardTooltipMode,
  cardTooltipScalePercent,
  cardHandScalePercent,
  cardArchiveScalePercent,
  cardZoneScalePercent,
  cardBoardScalePercent,
  cardRigScalePercent,
  cardDisplayMode,
  preferGermanCardImages,
  showSetBadges,
  chronicleDetailMode,
  colorScheme,
  cuePosition,
  aiPacingMode,
  modal = false,
  session = null,
  onActionCueAutoDismissMs,
  onActionCuesEnabled,
  onAutomaticEffectCuesEnabled,
  onAutoCorpMandatoryDrawEnabled,
  onAutoDiscardEnabled,
  onAutoEndTurnEnabled,
  onTopbarStickyEnabled,
  onResourceStripMode,
  onActionPanelMode,
  onAiDecisionDebugOverlayEnabled,
  onAudioEnabled,
  onAudioVolume,
  onCardTooltipHoverDelayMs,
  onCardTooltipMode,
  onCardTooltipScalePercent,
  onCardHandScalePercent,
  onCardArchiveScalePercent,
  onCardZoneScalePercent,
  onCardBoardScalePercent,
  onCardRigScalePercent,
  onCardDisplayMode,
  onPreferGermanCardImages,
  onShowSetBadges,
  onChronicleDetailMode,
  onColorScheme,
  onCuePosition,
  onAiPacingMode,
  onCopyReconnectLink,
  onDiscardLocalSession
}: {
  actionCueAutoDismissMs: CueAutoDismissMs;
  actionCuesEnabled: boolean;
  automaticEffectCuesEnabled: boolean;
  autoCorpMandatoryDrawEnabled: boolean;
  autoDiscardEnabled: boolean;
  autoEndTurnEnabled: boolean;
  topbarStickyEnabled: boolean;
  resourceStripMode: ResourceStripMode;
  actionPanelMode: ActionPanelMode;
  aiDecisionDebugOverlayEnabled: boolean;
  audioEnabled: boolean;
  audioVolume: number;
  cardTooltipHoverDelayMs: CardTooltipHoverDelayMs;
  cardTooltipMode: CardTooltipMode;
  cardTooltipScalePercent: number;
  cardHandScalePercent: number;
  cardArchiveScalePercent: number;
  cardZoneScalePercent: number;
  cardBoardScalePercent: number;
  cardRigScalePercent: number;
  cardDisplayMode: CardDisplayMode;
  preferGermanCardImages: boolean;
  showSetBadges: boolean;
  chronicleDetailMode: ChronicleDetailMode;
  colorScheme: ColorScheme;
  cuePosition: CuePositionPreference;
  aiPacingMode: AiPacingMode;
  modal?: boolean;
  session?: SessionInfo | null;
  onActionCueAutoDismissMs(value: CueAutoDismissMs): void;
  onActionCuesEnabled(value: boolean): void;
  onAutomaticEffectCuesEnabled(value: boolean): void;
  onAutoCorpMandatoryDrawEnabled(value: boolean): void;
  onAutoDiscardEnabled(value: boolean): void;
  onAutoEndTurnEnabled(value: boolean): void;
  onTopbarStickyEnabled(value: boolean): void;
  onResourceStripMode(value: ResourceStripMode): void;
  onActionPanelMode(value: ActionPanelMode): void;
  onAiDecisionDebugOverlayEnabled(value: boolean): void;
  onAudioEnabled(value: boolean): void;
  onAudioVolume(value: number): void;
  onCardTooltipHoverDelayMs(value: CardTooltipHoverDelayMs): void;
  onCardTooltipMode(value: CardTooltipMode): void;
  onCardTooltipScalePercent(value: number): void;
  onCardHandScalePercent(value: number): void;
  onCardArchiveScalePercent(value: number): void;
  onCardZoneScalePercent(value: number): void;
  onCardBoardScalePercent(value: number): void;
  onCardRigScalePercent(value: number): void;
  onCardDisplayMode(value: CardDisplayMode): void;
  onPreferGermanCardImages(value: boolean): void;
  onShowSetBadges(value: boolean): void;
  onChronicleDetailMode(value: ChronicleDetailMode): void;
  onColorScheme(value: ColorScheme): void;
  onCuePosition(value: CuePositionPreference): void;
  onAiPacingMode(value: AiPacingMode): void;
  onCopyReconnectLink?: (() => void) | undefined;
  onDiscardLocalSession?: (() => void) | undefined;
}) {
  return (
    <section className={`optionsPanel panel${modal ? " inModal" : ""}`}>
      {!modal ? (
        <div className="catalogHeader">
          <div>
            <h2>Optionen</h2>
            <p className="meta">Darstellung, Hinweise und Audio</p>
          </div>
          <SlidersHorizontal size={18} />
        </div>
      ) : null}
      <div className="optionsContent">
        {session ? <SessionAccessSettings session={session} onCopyReconnectLink={onCopyReconnectLink} onDiscardLocalSession={onDiscardLocalSession} /> : null}
        <ColorSchemeSettings scheme={colorScheme} onChange={onColorScheme} />
        <CardDisplaySettings mode={cardDisplayMode} onChange={onCardDisplayMode} />
        <CardImageSkinSettings preferGermanCardImages={preferGermanCardImages} showSetBadges={showSetBadges} onPreferGermanCardImages={onPreferGermanCardImages} onShowSetBadges={onShowSetBadges} />
        <ChronicleDetailSettings mode={chronicleDetailMode} onChange={onChronicleDetailMode} />
        <CardTooltipSettings mode={cardTooltipMode} hoverOpenDelayMs={cardTooltipHoverDelayMs} onMode={onCardTooltipMode} onHoverOpenDelayMs={onCardTooltipHoverDelayMs} />
        <CardSizeSettings
          tooltipPercent={cardTooltipScalePercent}
          handPercent={cardHandScalePercent}
          archivePercent={cardArchiveScalePercent}
          zonePercent={cardZoneScalePercent}
          boardPercent={cardBoardScalePercent}
          rigPercent={cardRigScalePercent}
          onTooltipPercent={onCardTooltipScalePercent}
          onHandPercent={onCardHandScalePercent}
          onArchivePercent={onCardArchiveScalePercent}
          onZonePercent={onCardZoneScalePercent}
          onBoardPercent={onCardBoardScalePercent}
          onRigPercent={onCardRigScalePercent}
        />
        <GameplaySettings
          autoCorpMandatoryDrawEnabled={autoCorpMandatoryDrawEnabled}
          autoDiscardEnabled={autoDiscardEnabled}
          autoEndTurnEnabled={autoEndTurnEnabled}
          topbarStickyEnabled={topbarStickyEnabled}
          resourceStripMode={resourceStripMode}
          actionPanelMode={actionPanelMode}
          aiDecisionDebugOverlayEnabled={aiDecisionDebugOverlayEnabled}
          onAutoCorpMandatoryDrawEnabled={onAutoCorpMandatoryDrawEnabled}
          onAutoDiscardEnabled={onAutoDiscardEnabled}
          onAutoEndTurnEnabled={onAutoEndTurnEnabled}
          onTopbarStickyEnabled={onTopbarStickyEnabled}
          onResourceStripMode={onResourceStripMode}
          onActionPanelMode={onActionPanelMode}
          onAiDecisionDebugOverlayEnabled={onAiDecisionDebugOverlayEnabled}
        />
        <AiPacingSettings mode={aiPacingMode} onMode={onAiPacingMode} />
        <ActionCueSettings
          enabled={actionCuesEnabled}
          automaticEffectsEnabled={automaticEffectCuesEnabled}
          position={cuePosition}
          autoDismissMs={actionCueAutoDismissMs}
          onEnabled={onActionCuesEnabled}
          onAutomaticEffectsEnabled={onAutomaticEffectCuesEnabled}
          onPosition={onCuePosition}
          onAutoDismissMs={onActionCueAutoDismissMs}
        />
        <AudioSettings enabled={audioEnabled} volume={audioVolume} onEnabled={onAudioEnabled} onVolume={onAudioVolume} />
        <SystemStatus />
      </div>
    </section>
  );
}

function SessionAccessSettings({
  session,
  onCopyReconnectLink,
  onDiscardLocalSession
}: {
  session: SessionInfo;
  onCopyReconnectLink?: (() => void) | undefined;
  onDiscardLocalSession?: (() => void) | undefined;
}) {
  const reconnectUrl = reconnectUrlForSession(session);
  return (
    <div className="sessionAccessSettings">
      <div>
        <span className="settingsTitle">Sitzung</span>
        <span className="meta">Lokaler Zugang zu diesem Spiel</span>
      </div>
      <div className="sessionAccessLink">
        <label>
          Wiederverbindungslink
          <input value={reconnectUrl} readOnly aria-label="Wiederverbindungslink" />
        </label>
        <button className="button" onClick={onCopyReconnectLink} type="button" disabled={!onCopyReconnectLink || !session.reconnectToken}>
          <Clipboard size={15} />
          Kopieren
        </button>
      </div>
      <p className="settingsHelp">
        Der Link enthält Deinen Reconnect-Token für {sideLabel(session.side)}. Wer ihn hat, kann diese Seite des Matches weiterführen.
      </p>
      <div className="sessionDangerRow">
        <button className="button dangerButton" onClick={onDiscardLocalSession} type="button" disabled={!onDiscardLocalSession}>
          <Trash2 size={15} />
          Lokale Sitzung löschen
        </button>
        <span className="settingsHelp">Löscht nur diesen Browserzugang. Das Spiel wird nicht aufgegeben.</span>
      </div>
    </div>
  );
}

function SystemStatus() {
  return (
    <div className="systemStatus">
      <span>
        <Shield size={15} />
        Hidden-Info geschützt
      </span>
      <span>
        <Activity size={15} />
        Replay bereit
      </span>
    </div>
  );
}

function ColorSchemeSettings({ scheme, onChange }: { scheme: ColorScheme; onChange(value: ColorScheme): void }) {
  return (
    <div className="colorSchemeSettings">
      <div>
        <span className="settingsTitle">Farbschema</span>
        <span className="meta">Lokale Anzeigeoption, kein Match-State</span>
      </div>
      <div className="segmented themeToggle" role="group" aria-label="Farbschema">
        <button className={scheme === "black" ? "active" : ""} onClick={() => onChange("black")} type="button" title="Schwarzes Farbschema" aria-label="Schwarzes Farbschema">
          <Moon size={15} />
          Schwarz
        </button>
        <button className={scheme === "white" ? "active" : ""} onClick={() => onChange("white")} type="button" title="Weißes Farbschema" aria-label="Weißes Farbschema">
          <Sun size={15} />
          Weiß
        </button>
      </div>
    </div>
  );
}

function CardDisplaySettings({ mode, onChange, compact = false }: { mode: CardDisplayMode; onChange(value: CardDisplayMode): void; compact?: boolean }) {
  return (
    <div className={`cardDisplaySettings ${compact ? "compact" : ""}`}>
      <div>
        <span className="settingsTitle">Kartenanzeige</span>
        {!compact ? <span className="meta">Lokale Anzeigeoption, kein Match-State</span> : null}
      </div>
      <CardDisplayModeSelector mode={mode} onChange={onChange} iconOnly={compact} />
    </div>
  );
}

export function CardDisplayModeSelector({ mode, onChange, iconOnly = false }: { mode: CardDisplayMode; onChange(value: CardDisplayMode): void; iconOnly?: boolean }) {
  return (
    <div className={`segmented cardDisplaySelector ${iconOnly ? "iconOnlySelector" : ""}`} role="group" aria-label="Kartenanzeige">
      <button className={mode === "placeholder" ? "active" : ""} onClick={() => onChange("placeholder")} type="button" title="Bildmodus: Regeltext für bekannte Karten per Hover oder Fokus" aria-label="Bildmodus" data-testid="card-display-image">
        <Image size={15} />
        {!iconOnly ? "Bild" : <span className="srOnly">Bild</span>}
      </button>
      <button className={mode === "text-card" ? "active" : ""} onClick={() => onChange("text-card")} type="button" title="Textmodus ohne große leere Bildfläche" aria-label="Textmodus" data-testid="card-display-text">
        <Keyboard size={15} />
        {!iconOnly ? "Text" : <span className="srOnly">Text</span>}
      </button>
      <button className={mode === "compact" ? "active" : ""} onClick={() => onChange("compact")} type="button" title="Kompaktmodus mit Regeltext per Tooltip oder Fokus" aria-label="Kompaktmodus" data-testid="card-display-compact">
        <ZoomIn size={15} />
        {!iconOnly ? "Kompakt" : <span className="srOnly">Kompakt</span>}
      </button>
    </div>
  );
}

function CardImageSkinSettings({
  preferGermanCardImages,
  showSetBadges,
  onPreferGermanCardImages,
  onShowSetBadges
}: {
  preferGermanCardImages: boolean;
  showSetBadges: boolean;
  onPreferGermanCardImages(value: boolean): void;
  onShowSetBadges(value: boolean): void;
}) {
  return (
    <div className="cardImageSkinSettings">
      <div>
        <span className="settingsTitle">Kartenbilder</span>
        <span className="meta">Lokale Anzeigeoption, kein Match-State</span>
      </div>
      <label className={`deckBuilderToggle ${preferGermanCardImages ? "checked" : ""}`}>
        <input checked={preferGermanCardImages} onChange={(event) => onPreferGermanCardImages(event.target.checked)} type="checkbox" />
        Deutsche Kartenbilder bevorzugen
      </label>
      <label className={`deckBuilderToggle ${showSetBadges ? "checked" : ""}`}>
        <input checked={showSetBadges} onChange={(event) => onShowSetBadges(event.target.checked)} type="checkbox" />
        Set-Badges anzeigen
      </label>
    </div>
  );
}

function ChronicleDetailSettings({ mode, onChange }: { mode: ChronicleDetailMode; onChange(value: ChronicleDetailMode): void }) {
  return (
    <div className="chronicleDetailSettings">
      <div>
        <span className="settingsTitle">Chronik</span>
        <span className="meta">Lokale Detailtiefe, kein Match-State</span>
      </div>
      <div className="segmented chronicleDetailSelector" role="group" aria-label="Detailgrad der Chronik">
        <button className={mode === "simple" ? "active" : ""} onClick={() => onChange("simple")} type="button" title="Nur Basistext">
          Einfach
        </button>
        <button className={mode === "medium" ? "active" : ""} onClick={() => onChange("medium")} type="button" title="Basistext mit Chips ohne Regeltext">
          Mittel
        </button>
        <button className={mode === "full" ? "active" : ""} onClick={() => onChange("full")} type="button" title="Basistext, Chips und Regeltext">
          Alles
        </button>
      </div>
    </div>
  );
}

function CardTooltipSettings({
  mode,
  hoverOpenDelayMs,
  onMode,
  onHoverOpenDelayMs
}: {
  mode: CardTooltipMode;
  hoverOpenDelayMs: CardTooltipHoverDelayMs;
  onMode(value: CardTooltipMode): void;
  onHoverOpenDelayMs(value: CardTooltipHoverDelayMs): void;
}) {
  return (
    <div className="cardTooltipSettings">
      <div>
        <span className="settingsTitle">Kartentooltip</span>
        <span className="meta">Lokale Anzeigeoption, kein Match-State</span>
      </div>
      <label>
        Modus
        <select value={mode} onChange={(event) => onMode(normalizeCardTooltipMode(event.target.value))}>
          <option value="simple">Einfach</option>
          <option value="enhanced">Verbessert</option>
          <option value="image">Kartenbild</option>
        </select>
      </label>
      <label>
        Hover-Verzögerung
        <select value={hoverOpenDelayMs} onChange={(event) => onHoverOpenDelayMs(normalizeCardTooltipHoverDelayMs(Number(event.target.value)))}>
          <option value={300}>0,3 Sekunden</option>
          <option value={500}>0,5 Sekunden</option>
          <option value={750}>0,75 Sekunden</option>
          <option value={1000}>1,0 Sekunden</option>
          <option value={1250}>1,25 Sekunden</option>
          <option value={1500}>1,5 Sekunden</option>
        </select>
      </label>
    </div>
  );
}

function CardSizeSettings({
  tooltipPercent,
  handPercent,
  archivePercent,
  zonePercent,
  boardPercent,
  rigPercent,
  onTooltipPercent,
  onHandPercent,
  onArchivePercent,
  onZonePercent,
  onBoardPercent,
  onRigPercent
}: {
  tooltipPercent: number;
  handPercent: number;
  archivePercent: number;
  zonePercent: number;
  boardPercent: number;
  rigPercent: number;
  onTooltipPercent(value: number): void;
  onHandPercent(value: number): void;
  onArchivePercent(value: number): void;
  onZonePercent(value: number): void;
  onBoardPercent(value: number): void;
  onRigPercent(value: number): void;
}) {
  return (
    <div className="cardSizeSettings">
      <div>
        <span className="settingsTitle">Kartengrößen</span>
        <span className="meta">Lokale Anzeigeoption, kein Match-State</span>
      </div>
      <CardSizeSliderRow label="Tooltip-Karte" value={tooltipPercent} min={CARD_SCALE_PERCENT_MIN} max={CARD_SCALE_PERCENT_MAX} onChange={onTooltipPercent} />
      <CardSizeSliderRow label="Handkarten" value={handPercent} min={CARD_SCALE_PERCENT_MIN} max={CARD_SCALE_PERCENT_MAX} onChange={onHandPercent} />
      <CardSizeSliderRow label="Archive" value={archivePercent} min={CARD_SCALE_PERCENT_MIN} max={CARD_SCALE_PERCENT_MAX} onChange={onArchivePercent} />
      <CardSizeSliderRow label="Stack/Heap" value={zonePercent} min={CARD_SCALE_PERCENT_MIN} max={CARD_SCALE_PERCENT_MAX} onChange={onZonePercent} />
      <CardSizeSliderRow label="Spielfeld/Remotes" value={boardPercent} min={CARD_SCALE_PERCENT_MIN} max={CARD_SCALE_PERCENT_MAX} onChange={onBoardPercent} />
      <CardSizeSliderRow label="Rig" value={rigPercent} min={CARD_SCALE_PERCENT_MIN} max={CARD_SCALE_PERCENT_MAX} onChange={onRigPercent} />
    </div>
  );
}

function CardSizeSliderRow({
  label,
  value,
  min,
  max,
  onChange
}: {
  label: string;
  value: number;
  min: number;
  max: number;
  onChange(value: number): void;
}) {
  return (
    <label className="cardSizeSliderRow">
      <span>{label}</span>
      <input
        type="range"
        min={min}
        max={max}
        step={CARD_SCALE_PERCENT_STEP}
        value={value}
        onChange={(event) => onChange(normalizeCardScalePercent(event.target.value, min, max))}
      />
      <strong>{value}%</strong>
    </label>
  );
}

function GameplaySettings({
  autoCorpMandatoryDrawEnabled,
  autoDiscardEnabled,
  autoEndTurnEnabled,
  topbarStickyEnabled,
  resourceStripMode,
  actionPanelMode,
  aiDecisionDebugOverlayEnabled,
  onAutoCorpMandatoryDrawEnabled,
  onAutoDiscardEnabled,
  onAutoEndTurnEnabled,
  onTopbarStickyEnabled,
  onResourceStripMode,
  onActionPanelMode,
  onAiDecisionDebugOverlayEnabled
}: {
  autoCorpMandatoryDrawEnabled: boolean;
  autoDiscardEnabled: boolean;
  autoEndTurnEnabled: boolean;
  topbarStickyEnabled: boolean;
  resourceStripMode: ResourceStripMode;
  actionPanelMode: ActionPanelMode;
  aiDecisionDebugOverlayEnabled: boolean;
  onAutoCorpMandatoryDrawEnabled(value: boolean): void;
  onAutoDiscardEnabled(value: boolean): void;
  onAutoEndTurnEnabled(value: boolean): void;
  onTopbarStickyEnabled(value: boolean): void;
  onResourceStripMode(value: ResourceStripMode): void;
  onActionPanelMode(value: ActionPanelMode): void;
  onAiDecisionDebugOverlayEnabled(value: boolean): void;
}) {
  return (
    <div className="gameplaySettings">
      <div className="settingsHeaderLine">
        <div>
          <span className="settingsTitle">Spielablauf</span>
          <span className="meta">Lokale Komfortoption, kein Match-State</span>
        </div>
        <div className="settingsToggleGroup">
          <label className={`settingsToggle ${autoCorpMandatoryDrawEnabled ? "checked" : ""}`}>
            <input type="checkbox" checked={autoCorpMandatoryDrawEnabled} onChange={(event) => onAutoCorpMandatoryDrawEnabled(event.target.checked)} />
            Korp-Startziehen
          </label>
          <label className={`settingsToggle ${autoEndTurnEnabled ? "checked" : ""}`}>
            <input type="checkbox" checked={autoEndTurnEnabled} onChange={(event) => onAutoEndTurnEnabled(event.target.checked)} />
            Auto-Zugende
          </label>
          <label className={`settingsToggle ${autoDiscardEnabled ? "checked" : ""}`}>
            <input type="checkbox" checked={autoDiscardEnabled} onChange={(event) => onAutoDiscardEnabled(event.target.checked)} />
            Auto-Abwerfen
          </label>
          <label className={`settingsToggle ${topbarStickyEnabled ? "checked" : ""}`}>
            <input data-testid="sticky-topbar-toggle" type="checkbox" checked={topbarStickyEnabled} onChange={(event) => onTopbarStickyEnabled(event.target.checked)} />
            Kopfzeile fixieren
          </label>
          <label className={`settingsToggle ${actionPanelMode === "floating" ? "checked" : ""}`}>
            <input data-testid="floating-action-panel-toggle" type="checkbox" checked={actionPanelMode === "floating"} onChange={(event) => onActionPanelMode(event.target.checked ? "floating" : "docked")} />
            Aktionsfenster schwebend
          </label>
          <label className={`settingsToggle ${aiDecisionDebugOverlayEnabled ? "checked" : ""}`}>
            <input data-testid="ai-decision-debug-overlay-toggle" type="checkbox" checked={aiDecisionDebugOverlayEnabled} onChange={(event) => onAiDecisionDebugOverlayEnabled(event.target.checked)} />
            KI-Bewertungsfenster anzeigen
          </label>
        </div>
      </div>
      <div className="resourceStripSettings">
        <span className="settingsTitle">Spielstandsstreifen</span>
        <div className="segmented resourceStripModeSelector" role="group" aria-label="Spielstandsstreifen">
          {(["auto", "on", "off"] as const).map((mode) => (
            <button className={resourceStripMode === mode ? "active" : ""} key={mode} onClick={() => onResourceStripMode(mode)} type="button">
              {mode === "auto" ? "Auto" : mode === "on" ? "Ein" : "Aus"}
            </button>
          ))}
        </div>
      </div>
      <p className="settingsHelp">Korp-Startziehen bestätigt die Pflichtkarte am Zuganfang automatisch, wenn sonst keine Korp-Aktion offen ist. Auto-Zugende beendet Deinen Zug, wenn nur noch Zug beenden offen ist. Auto-Abwerfen bestätigt eine Discard-Auswahl sofort, sobald genau die nötige Anzahl Handkarten gewählt ist. Kopfzeile fixieren hält die aktive Spielkopfzeile beim Scrollen sichtbar. Das schwebende Aktionsfenster zeigt mögliche Nicht-Run-Aktionen lokal verschiebbar an. Das KI-Bewertungsfenster zeigt lokale, redigierte KI-Trace-Daten für laufende KI-Matches. Der Spielstandsstreifen zeigt Credits, Agenda-Punkte und aktuelle Aktionen platzsparend über dem Spielfeld.</p>
    </div>
  );
}

function AiPacingSettings({ mode, onMode }: { mode: AiPacingMode; onMode(value: AiPacingMode): void }) {
  return (
    <div className="aiPacingSettings">
      <div>
        <span className="settingsTitle">KI-Steuerung</span>
        <span className="meta">Lokale Ablaufoption, kein Match-State</span>
      </div>
      <div className="segmented aiPacingSelector" role="group" aria-label="KI-Steuerung">
        {(["manual", "paced", "fast"] as const).map((value) => (
          <button className={mode === value ? "active" : ""} key={value} onClick={() => onMode(value)} type="button" title={aiPacingModeHelp(value)}>
            {value === "manual" ? "Einzelschritt" : value === "paced" ? "Getaktet" : "Schnell"}
          </button>
        ))}
      </div>
      <p className="settingsHelp">{aiPacingModeHelp(mode)}</p>
    </div>
  );
}

function ActionCueSettings({
  enabled,
  automaticEffectsEnabled,
  position,
  autoDismissMs,
  onEnabled,
  onAutomaticEffectsEnabled,
  onPosition,
  onAutoDismissMs
}: {
  enabled: boolean;
  automaticEffectsEnabled: boolean;
  position: CuePositionPreference;
  autoDismissMs: CueAutoDismissMs;
  onEnabled(value: boolean): void;
  onAutomaticEffectsEnabled(value: boolean): void;
  onPosition(value: CuePositionPreference): void;
  onAutoDismissMs(value: CueAutoDismissMs): void;
}) {
  const setPreset = (preset: CuePositionPreset) => onPosition({ kind: "preset", preset });
  return (
    <div className="actionCueSettings">
      <div className="settingsHeaderLine">
        <div>
          <span className="settingsTitle">Infofenster</span>
          <span className="meta">Lokale Hinweise zu KI- und Gegenzügen</span>
        </div>
        <label className={`settingsToggle ${enabled ? "checked" : ""}`}>
          <input type="checkbox" checked={enabled} onChange={(event) => onEnabled(event.target.checked)} />
          Anzeigen
        </label>
        <label className={`settingsToggle ${automaticEffectsEnabled ? "checked" : ""}`}>
          <input type="checkbox" checked={automaticEffectsEnabled} onChange={(event) => onAutomaticEffectsEnabled(event.target.checked)} disabled={!enabled} />
          Automatische Effekte anzeigen
        </label>
      </div>
      <div className="settingsControlGrid">
        <label>
          Position
          <select
            value={position.kind === "preset" ? position.preset : "custom"}
            onChange={(event) => {
              if (event.target.value === "custom") return;
              setPreset(event.target.value as CuePositionPreset);
            }}
            disabled={!enabled}
          >
            <option value="top-right">Oben rechts</option>
            <option value="top-left">Oben links</option>
            <option value="bottom-right">Unten rechts</option>
            <option value="bottom-left">Unten links</option>
            <option value="center">Mitte</option>
            {position.kind === "custom" ? <option value="custom">Eigene Position</option> : null}
          </select>
        </label>
        <label>
          Automatisch ausblenden
          <select value={autoDismissMs} onChange={(event) => onAutoDismissMs(normalizeCueAutoDismissMs(Number(event.target.value)))} disabled={!enabled}>
            <option value={1500}>Nach 1,5 Sekunden</option>
            <option value={2500}>Nach 2,5 Sekunden</option>
            <option value={4000}>Nach 4 Sekunden</option>
            <option value={6000}>Nach 6 Sekunden</option>
            <option value={0}>Nicht automatisch</option>
          </select>
        </label>
        <button className="button" onClick={() => setPreset("top-right")} type="button" disabled={!enabled}>
          Zurücksetzen
        </button>
      </div>
    </div>
  );
}

function AudioSettings({
  enabled,
  volume,
  onEnabled,
  onVolume
}: {
  enabled: boolean;
  volume: number;
  onEnabled(value: boolean): void;
  onVolume(value: number): void;
}) {
  return (
    <div className="audioSettings">
      <button className={`button ${enabled ? "primary" : ""}`} type="button" onClick={() => onEnabled(!enabled)} title={enabled ? "Audioeffekte ausschalten" : "Audioeffekte einschalten · Testton"}>
        {enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        Audio
      </button>
      <label>
        Lautstärke
        <input type="range" min={0} max={1} step={0.05} value={volume} onChange={(event) => onVolume(Number(event.target.value))} />
      </label>
    </div>
  );
}
