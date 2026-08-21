import {
  Activity,
  Clipboard,
  Image,
  Keyboard,
  Moon,
  Shield,
  SlidersHorizontal,
  Sun,
  Trash2,
  Volume2,
  VolumeX,
  ZoomIn,
} from "lucide-react";
import { useLocale, useTranslations } from "use-intl/react";

import type { SessionInfo } from "../../app/session-recovery";
import { normalizeAppLocale } from "../../i18n/locale";
import { LocaleSelect } from "../../i18n/LocaleSelect";
import type {
  CuePositionPreference,
  CuePositionPreset,
} from "../../app/action-board-ui";
import { NETGRID_BUILD_INFO } from "../../lib/app-build-info";
import { reconnectUrlForSession } from "../../lib/session-url";
import { formatAppDateTime } from "../../i18n/format";
import {
  CARD_SCALE_PERCENT_MAX,
  CARD_SCALE_PERCENT_MIN,
  CARD_SCALE_PERCENT_STEP,
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
  type ResourceStripMode,
} from "./settings-model";

export function OptionsPanel({
  actionCueAutoDismissMs,
  actionCuesEnabled,
  automaticEffectCuesEnabled,
  autoCorpMandatoryDrawEnabled,
  autoDiscardEnabled,
  autoEndTurnEnabled,
  topbarStickyEnabled,
  cyberspaceBackgroundEnabled,
  resourceStripMode,
  actionPanelMode,
  aiDecisionDebugOverlayEnabled,
  exposedCardHighlightEnabled,
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
  cardSpecialZoneScalePercent,
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
  onCyberspaceBackgroundEnabled,
  onResourceStripMode,
  onActionPanelMode,
  onAiDecisionDebugOverlayEnabled,
  onExposedCardHighlightEnabled,
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
  onCardSpecialZoneScalePercent,
  onCardDisplayMode,
  onPreferGermanCardImages,
  onShowSetBadges,
  onChronicleDetailMode,
  onColorScheme,
  onCuePosition,
  onAiPacingMode,
  onCopyReconnectLink,
  onDiscardLocalSession,
}: {
  actionCueAutoDismissMs: CueAutoDismissMs;
  actionCuesEnabled: boolean;
  automaticEffectCuesEnabled: boolean;
  autoCorpMandatoryDrawEnabled: boolean;
  autoDiscardEnabled: boolean;
  autoEndTurnEnabled: boolean;
  topbarStickyEnabled: boolean;
  cyberspaceBackgroundEnabled: boolean;
  resourceStripMode: ResourceStripMode;
  actionPanelMode: ActionPanelMode;
  aiDecisionDebugOverlayEnabled: boolean;
  exposedCardHighlightEnabled: boolean;
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
  cardSpecialZoneScalePercent: number;
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
  onCyberspaceBackgroundEnabled(value: boolean): void;
  onResourceStripMode(value: ResourceStripMode): void;
  onActionPanelMode(value: ActionPanelMode): void;
  onAiDecisionDebugOverlayEnabled(value: boolean): void;
  onExposedCardHighlightEnabled(value: boolean): void;
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
  onCardSpecialZoneScalePercent(value: number): void;
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
  const t = useTranslations("Settings");
  return (
    <section className={`optionsPanel panel${modal ? " inModal" : ""}`}>
      {!modal ? (
        <div className="catalogHeader">
          <div>
            <h2>{t("title")}</h2>
            <p className="meta">{t("subtitle")}</p>
          </div>
          <SlidersHorizontal size={18} />
        </div>
      ) : null}
      <div className="optionsContent">
        {session ? (
          <SessionAccessSettings
            session={session}
            onCopyReconnectLink={onCopyReconnectLink}
            onDiscardLocalSession={onDiscardLocalSession}
          />
        ) : null}
        <LocaleSettings />
        <ColorSchemeSettings scheme={colorScheme} onChange={onColorScheme} />
        <CardDisplaySettings
          mode={cardDisplayMode}
          onChange={onCardDisplayMode}
        />
        <CardImageSkinSettings
          preferGermanCardImages={preferGermanCardImages}
          showSetBadges={showSetBadges}
          onPreferGermanCardImages={onPreferGermanCardImages}
          onShowSetBadges={onShowSetBadges}
        />
        <ChronicleDetailSettings
          mode={chronicleDetailMode}
          onChange={onChronicleDetailMode}
        />
        <CardTooltipSettings
          mode={cardTooltipMode}
          hoverOpenDelayMs={cardTooltipHoverDelayMs}
          onMode={onCardTooltipMode}
          onHoverOpenDelayMs={onCardTooltipHoverDelayMs}
        />
        <CardSizeSettings
          tooltipPercent={cardTooltipScalePercent}
          handPercent={cardHandScalePercent}
          archivePercent={cardArchiveScalePercent}
          zonePercent={cardZoneScalePercent}
          boardPercent={cardBoardScalePercent}
          rigPercent={cardRigScalePercent}
          specialZonePercent={cardSpecialZoneScalePercent}
          onTooltipPercent={onCardTooltipScalePercent}
          onHandPercent={onCardHandScalePercent}
          onArchivePercent={onCardArchiveScalePercent}
          onZonePercent={onCardZoneScalePercent}
          onBoardPercent={onCardBoardScalePercent}
          onRigPercent={onCardRigScalePercent}
          onSpecialZonePercent={onCardSpecialZoneScalePercent}
        />
        <GameplaySettings
          autoCorpMandatoryDrawEnabled={autoCorpMandatoryDrawEnabled}
          autoDiscardEnabled={autoDiscardEnabled}
          autoEndTurnEnabled={autoEndTurnEnabled}
          topbarStickyEnabled={topbarStickyEnabled}
          cyberspaceBackgroundEnabled={cyberspaceBackgroundEnabled}
          resourceStripMode={resourceStripMode}
          actionPanelMode={actionPanelMode}
          aiDecisionDebugOverlayEnabled={aiDecisionDebugOverlayEnabled}
          exposedCardHighlightEnabled={exposedCardHighlightEnabled}
          onAutoCorpMandatoryDrawEnabled={onAutoCorpMandatoryDrawEnabled}
          onAutoDiscardEnabled={onAutoDiscardEnabled}
          onAutoEndTurnEnabled={onAutoEndTurnEnabled}
          onTopbarStickyEnabled={onTopbarStickyEnabled}
          onCyberspaceBackgroundEnabled={onCyberspaceBackgroundEnabled}
          onResourceStripMode={onResourceStripMode}
          onActionPanelMode={onActionPanelMode}
          onAiDecisionDebugOverlayEnabled={onAiDecisionDebugOverlayEnabled}
          onExposedCardHighlightEnabled={onExposedCardHighlightEnabled}
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
        <AudioSettings
          enabled={audioEnabled}
          volume={audioVolume}
          onEnabled={onAudioEnabled}
          onVolume={onAudioVolume}
        />
        <BuildInfoSettings />
        <SystemStatus />
      </div>
    </section>
  );
}

function LocaleSettings() {
  const t = useTranslations("LocaleSettings");

  return (
    <div className="colorSchemeSettings">
      <div>
        <span className="settingsTitle">{t("title")}</span>
        <span className="meta">{t("help")}</span>
      </div>
      <LocaleSelect />
    </div>
  );
}

function BuildInfoSettings() {
  const t = useTranslations("Settings.build");
  const locale = normalizeAppLocale(useLocale());
  const sourceDate = NETGRID_BUILD_INFO.sourceDateIso
    ? formatAppDateTime(NETGRID_BUILD_INFO.sourceDateIso, locale, {
        dateStyle: "medium",
        timeStyle: "short",
      })
    : t("unavailable");
  return (
    <div className="buildInfoSettings">
      <div>
        <span className="settingsTitle">{t("title")}</span>
        <span className="meta">
          {t(NETGRID_BUILD_INFO.dirty ? "developmentDirty" : "development")}
        </span>
      </div>
      <dl className="buildInfoDetails">
        <div>
          <dt>{t("productVersion")}</dt>
          <dd>V{NETGRID_BUILD_INFO.productVersion}</dd>
        </div>
        <div>
          <dt>{t("build")}</dt>
          <dd>{NETGRID_BUILD_INFO.buildNumber}</dd>
        </div>
        <div>
          <dt>{t("commit")}</dt>
          <dd>{NETGRID_BUILD_INFO.commit}</dd>
        </div>
        <div>
          <dt>{t("sourceDate")}</dt>
          <dd>{sourceDate}</dd>
        </div>
      </dl>
    </div>
  );
}

function SessionAccessSettings({
  session,
  onCopyReconnectLink,
  onDiscardLocalSession,
}: {
  session: SessionInfo;
  onCopyReconnectLink?: (() => void) | undefined;
  onDiscardLocalSession?: (() => void) | undefined;
}) {
  const t = useTranslations("Settings.session");
  const reconnectUrl = reconnectUrlForSession(session);
  return (
    <div className="sessionAccessSettings">
      <div>
        <span className="settingsTitle">{t("title")}</span>
        <span className="meta">{t("subtitle")}</span>
      </div>
      <div className="sessionAccessLink">
        <label>
          {t("reconnectLink")}
          <input
            value={reconnectUrl}
            readOnly
            aria-label={t("reconnectLink")}
          />
        </label>
        <button
          className="button"
          onClick={onCopyReconnectLink}
          type="button"
          disabled={!onCopyReconnectLink || !session.reconnectToken}
        >
          <Clipboard size={15} />
          {t("copy")}
        </button>
      </div>
      <p className="settingsHelp">
        {t("help", { side: session.side === "runner" ? "Runner" : t("corp") })}
      </p>
      <div className="sessionDangerRow">
        <button
          className="button dangerButton"
          onClick={onDiscardLocalSession}
          type="button"
          disabled={!onDiscardLocalSession}
        >
          <Trash2 size={15} />
          {t("discard")}
        </button>
        <span className="settingsHelp">{t("discardHelp")}</span>
      </div>
    </div>
  );
}

function SystemStatus() {
  const t = useTranslations("Settings.systemStatus");
  return (
    <div className="systemStatus">
      <span>
        <Shield size={15} />
        {t("hiddenInfo")}
      </span>
      <span>
        <Activity size={15} />
        {t("replayReady")}
      </span>
    </div>
  );
}

function ColorSchemeSettings({
  scheme,
  onChange,
}: {
  scheme: ColorScheme;
  onChange(value: ColorScheme): void;
}) {
  const t = useTranslations("Settings.colorScheme");
  return (
    <div className="colorSchemeSettings">
      <div>
        <span className="settingsTitle">{t("title")}</span>
        <span className="meta">{t("localHelp")}</span>
      </div>
      <div
        className="segmented themeToggle"
        role="group"
        aria-label={t("title")}
      >
        <button
          className={scheme === "black" ? "active" : ""}
          onClick={() => onChange("black")}
          type="button"
          title={t("blackTitle")}
          aria-label={t("blackTitle")}
        >
          <Moon size={15} />
          {t("black")}
        </button>
        <button
          className={scheme === "white" ? "active" : ""}
          onClick={() => onChange("white")}
          type="button"
          title={t("whiteTitle")}
          aria-label={t("whiteTitle")}
        >
          <Sun size={15} />
          {t("white")}
        </button>
      </div>
    </div>
  );
}

function CardDisplaySettings({
  mode,
  onChange,
  compact = false,
}: {
  mode: CardDisplayMode;
  onChange(value: CardDisplayMode): void;
  compact?: boolean;
}) {
  const t = useTranslations("Settings.cardDisplay");
  return (
    <div className={`cardDisplaySettings ${compact ? "compact" : ""}`}>
      <div>
        <span className="settingsTitle">{t("title")}</span>
        {!compact ? <span className="meta">{t("localHelp")}</span> : null}
      </div>
      <CardDisplayModeSelector
        mode={mode}
        onChange={onChange}
        iconOnly={compact}
      />
    </div>
  );
}

export function CardDisplayModeSelector({
  mode,
  onChange,
  iconOnly = false,
}: {
  mode: CardDisplayMode;
  onChange(value: CardDisplayMode): void;
  iconOnly?: boolean;
}) {
  const t = useTranslations("Settings.cardDisplay");
  return (
    <div
      className={`segmented cardDisplaySelector ${iconOnly ? "iconOnlySelector" : ""}`}
      role="group"
      aria-label={t("title")}
    >
      <button
        className={mode === "placeholder" ? "active" : ""}
        onClick={() => onChange("placeholder")}
        type="button"
        title={t("imageTitle")}
        aria-label={t("imageAria")}
        data-testid="card-display-image"
      >
        <Image size={15} />
        {!iconOnly ? t("image") : <span className="srOnly">{t("image")}</span>}
      </button>
      <button
        className={mode === "text-card" ? "active" : ""}
        onClick={() => onChange("text-card")}
        type="button"
        title={t("textTitle")}
        aria-label={t("text")}
        data-testid="card-display-text"
      >
        <Keyboard size={15} />
        {!iconOnly ? t("text") : <span className="srOnly">{t("text")}</span>}
      </button>
      <button
        className={mode === "compact" ? "active" : ""}
        onClick={() => onChange("compact")}
        type="button"
        title={t("compactTitle")}
        aria-label={t("compact")}
        data-testid="card-display-compact"
      >
        <ZoomIn size={15} />
        {!iconOnly ? (
          t("compact")
        ) : (
          <span className="srOnly">{t("compact")}</span>
        )}
      </button>
    </div>
  );
}

function CardImageSkinSettings({
  preferGermanCardImages,
  showSetBadges,
  onPreferGermanCardImages,
  onShowSetBadges,
}: {
  preferGermanCardImages: boolean;
  showSetBadges: boolean;
  onPreferGermanCardImages(value: boolean): void;
  onShowSetBadges(value: boolean): void;
}) {
  const t = useTranslations("Settings.cardImages");
  return (
    <div className="cardImageSkinSettings">
      <div>
        <span className="settingsTitle">{t("title")}</span>
        <span className="meta">{t("localHelp")}</span>
      </div>
      <label
        className={`deckBuilderToggle ${preferGermanCardImages ? "checked" : ""}`}
      >
        <input
          checked={preferGermanCardImages}
          onChange={(event) => onPreferGermanCardImages(event.target.checked)}
          type="checkbox"
        />
        {t("preferGerman")}
      </label>
      <label className={`deckBuilderToggle ${showSetBadges ? "checked" : ""}`}>
        <input
          checked={showSetBadges}
          onChange={(event) => onShowSetBadges(event.target.checked)}
          type="checkbox"
        />
        {t("showSetBadges")}
      </label>
    </div>
  );
}

function ChronicleDetailSettings({
  mode,
  onChange,
}: {
  mode: ChronicleDetailMode;
  onChange(value: ChronicleDetailMode): void;
}) {
  const t = useTranslations("Settings.chronicle");
  return (
    <div className="chronicleDetailSettings">
      <div>
        <span className="settingsTitle">{t("title")}</span>
        <span className="meta">{t("localHelp")}</span>
      </div>
      <div
        className="segmented chronicleDetailSelector"
        role="group"
        aria-label={t("ariaLabel")}
      >
        <button
          className={mode === "simple" ? "active" : ""}
          onClick={() => onChange("simple")}
          type="button"
          title={t("simpleTitle")}
        >
          {t("simple")}
        </button>
        <button
          className={mode === "medium" ? "active" : ""}
          onClick={() => onChange("medium")}
          type="button"
          title={t("mediumTitle")}
        >
          {t("medium")}
        </button>
        <button
          className={mode === "full" ? "active" : ""}
          onClick={() => onChange("full")}
          type="button"
          title={t("fullTitle")}
        >
          {t("full")}
        </button>
      </div>
    </div>
  );
}

function CardTooltipSettings({
  mode,
  hoverOpenDelayMs,
  onMode,
  onHoverOpenDelayMs,
}: {
  mode: CardTooltipMode;
  hoverOpenDelayMs: CardTooltipHoverDelayMs;
  onMode(value: CardTooltipMode): void;
  onHoverOpenDelayMs(value: CardTooltipHoverDelayMs): void;
}) {
  const t = useTranslations("Settings.tooltip");
  return (
    <div className="cardTooltipSettings">
      <div>
        <span className="settingsTitle">{t("title")}</span>
        <span className="meta">{t("localHelp")}</span>
      </div>
      <label>
        {t("mode")}
        <select
          value={mode}
          onChange={(event) =>
            onMode(normalizeCardTooltipMode(event.target.value))
          }
        >
          <option value="simple">{t("simple")}</option>
          <option value="enhanced">{t("enhanced")}</option>
          <option value="image">{t("image")}</option>
        </select>
      </label>
      <label>
        {t("hoverDelay")}
        <select
          value={hoverOpenDelayMs}
          onChange={(event) =>
            onHoverOpenDelayMs(
              normalizeCardTooltipHoverDelayMs(Number(event.target.value)),
            )
          }
        >
          <option value={300}>{t("seconds", { seconds: "0.3" })}</option>
          <option value={500}>{t("seconds", { seconds: "0.5" })}</option>
          <option value={750}>{t("seconds", { seconds: "0.75" })}</option>
          <option value={1000}>{t("seconds", { seconds: "1.0" })}</option>
          <option value={1250}>{t("seconds", { seconds: "1.25" })}</option>
          <option value={1500}>{t("seconds", { seconds: "1.5" })}</option>
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
  specialZonePercent,
  onTooltipPercent,
  onHandPercent,
  onArchivePercent,
  onZonePercent,
  onBoardPercent,
  onRigPercent,
  onSpecialZonePercent,
}: {
  tooltipPercent: number;
  handPercent: number;
  archivePercent: number;
  zonePercent: number;
  boardPercent: number;
  rigPercent: number;
  specialZonePercent: number;
  onTooltipPercent(value: number): void;
  onHandPercent(value: number): void;
  onArchivePercent(value: number): void;
  onZonePercent(value: number): void;
  onBoardPercent(value: number): void;
  onRigPercent(value: number): void;
  onSpecialZonePercent(value: number): void;
}) {
  const t = useTranslations("Settings.cardSizes");
  return (
    <div className="cardSizeSettings">
      <div>
        <span className="settingsTitle">{t("title")}</span>
        <span className="meta">{t("localHelp")}</span>
      </div>
      <CardSizeSliderRow
        label={t("tooltip")}
        value={tooltipPercent}
        min={CARD_SCALE_PERCENT_MIN}
        max={CARD_SCALE_PERCENT_MAX}
        onChange={onTooltipPercent}
      />
      <CardSizeSliderRow
        label={t("hand")}
        value={handPercent}
        min={CARD_SCALE_PERCENT_MIN}
        max={CARD_SCALE_PERCENT_MAX}
        onChange={onHandPercent}
      />
      <CardSizeSliderRow
        label={t("archives")}
        value={archivePercent}
        min={CARD_SCALE_PERCENT_MIN}
        max={CARD_SCALE_PERCENT_MAX}
        onChange={onArchivePercent}
      />
      <CardSizeSliderRow
        label={t("stackHeap")}
        value={zonePercent}
        min={CARD_SCALE_PERCENT_MIN}
        max={CARD_SCALE_PERCENT_MAX}
        onChange={onZonePercent}
      />
      <CardSizeSliderRow
        label={t("boardRemotes")}
        value={boardPercent}
        min={CARD_SCALE_PERCENT_MIN}
        max={CARD_SCALE_PERCENT_MAX}
        onChange={onBoardPercent}
      />
      <CardSizeSliderRow
        label={t("rig")}
        value={rigPercent}
        min={CARD_SCALE_PERCENT_MIN}
        max={CARD_SCALE_PERCENT_MAX}
        onChange={onRigPercent}
      />
      <CardSizeSliderRow
        label={t("specialZones")}
        value={specialZonePercent}
        min={CARD_SCALE_PERCENT_MIN}
        max={CARD_SCALE_PERCENT_MAX}
        onChange={onSpecialZonePercent}
      />
    </div>
  );
}

function CardSizeSliderRow({
  label,
  value,
  min,
  max,
  onChange,
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
        onChange={(event) =>
          onChange(normalizeCardScalePercent(event.target.value, min, max))
        }
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
  cyberspaceBackgroundEnabled,
  resourceStripMode,
  actionPanelMode,
  aiDecisionDebugOverlayEnabled,
  exposedCardHighlightEnabled,
  onAutoCorpMandatoryDrawEnabled,
  onAutoDiscardEnabled,
  onAutoEndTurnEnabled,
  onTopbarStickyEnabled,
  onCyberspaceBackgroundEnabled,
  onResourceStripMode,
  onActionPanelMode,
  onAiDecisionDebugOverlayEnabled,
  onExposedCardHighlightEnabled,
}: {
  autoCorpMandatoryDrawEnabled: boolean;
  autoDiscardEnabled: boolean;
  autoEndTurnEnabled: boolean;
  topbarStickyEnabled: boolean;
  cyberspaceBackgroundEnabled: boolean;
  resourceStripMode: ResourceStripMode;
  actionPanelMode: ActionPanelMode;
  aiDecisionDebugOverlayEnabled: boolean;
  exposedCardHighlightEnabled: boolean;
  onAutoCorpMandatoryDrawEnabled(value: boolean): void;
  onAutoDiscardEnabled(value: boolean): void;
  onAutoEndTurnEnabled(value: boolean): void;
  onTopbarStickyEnabled(value: boolean): void;
  onCyberspaceBackgroundEnabled(value: boolean): void;
  onResourceStripMode(value: ResourceStripMode): void;
  onActionPanelMode(value: ActionPanelMode): void;
  onAiDecisionDebugOverlayEnabled(value: boolean): void;
  onExposedCardHighlightEnabled(value: boolean): void;
}) {
  const t = useTranslations("Settings.gameplay");
  return (
    <div className="gameplaySettings">
      <div className="settingsHeaderLine">
        <div>
          <span className="settingsTitle">{t("title")}</span>
          <span className="meta">{t("localHelp")}</span>
        </div>
        <div className="settingsToggleGroup">
          <label
            className={`settingsToggle ${autoCorpMandatoryDrawEnabled ? "checked" : ""}`}
          >
            <input
              type="checkbox"
              checked={autoCorpMandatoryDrawEnabled}
              onChange={(event) =>
                onAutoCorpMandatoryDrawEnabled(event.target.checked)
              }
            />
            {t("corpDraw")}
          </label>
          <label
            className={`settingsToggle ${autoEndTurnEnabled ? "checked" : ""}`}
          >
            <input
              type="checkbox"
              checked={autoEndTurnEnabled}
              onChange={(event) => onAutoEndTurnEnabled(event.target.checked)}
            />
            {t("autoEndTurn")}
          </label>
          <label
            className={`settingsToggle ${autoDiscardEnabled ? "checked" : ""}`}
          >
            <input
              type="checkbox"
              checked={autoDiscardEnabled}
              onChange={(event) => onAutoDiscardEnabled(event.target.checked)}
            />
            {t("autoDiscard")}
          </label>
          <label
            className={`settingsToggle ${topbarStickyEnabled ? "checked" : ""}`}
          >
            <input
              data-testid="sticky-topbar-toggle"
              type="checkbox"
              checked={topbarStickyEnabled}
              onChange={(event) => onTopbarStickyEnabled(event.target.checked)}
            />
            {t("stickyTopbar")}
          </label>
          <label
            className={`settingsToggle ${cyberspaceBackgroundEnabled ? "checked" : ""}`}
          >
            <input
              data-testid="cyberspace-background-toggle"
              type="checkbox"
              checked={cyberspaceBackgroundEnabled}
              onChange={(event) =>
                onCyberspaceBackgroundEnabled(event.target.checked)
              }
            />
            {t("cyberspaceBackground")}
          </label>
          <label
            className={`settingsToggle ${actionPanelMode === "floating" ? "checked" : ""}`}
          >
            <input
              data-testid="floating-action-panel-toggle"
              type="checkbox"
              checked={actionPanelMode === "floating"}
              onChange={(event) =>
                onActionPanelMode(event.target.checked ? "floating" : "docked")
              }
            />
            {t("floatingActions")}
          </label>
          <label
            className={`settingsToggle ${aiDecisionDebugOverlayEnabled ? "checked" : ""}`}
          >
            <input
              data-testid="ai-decision-debug-overlay-toggle"
              type="checkbox"
              checked={aiDecisionDebugOverlayEnabled}
              onChange={(event) =>
                onAiDecisionDebugOverlayEnabled(event.target.checked)
              }
            />
            {t("aiDebug")}
          </label>
          <label
            className={`settingsToggle ${exposedCardHighlightEnabled ? "checked" : ""}`}
          >
            <input
              data-testid="exposed-card-highlight-toggle"
              type="checkbox"
              checked={exposedCardHighlightEnabled}
              onChange={(event) =>
                onExposedCardHighlightEnabled(event.target.checked)
              }
            />
            {t("highlightExposed")}
          </label>
        </div>
      </div>
      <div className="resourceStripSettings">
        <span className="settingsTitle">{t("resourceStrip")}</span>
        <div
          className="segmented resourceStripModeSelector"
          role="group"
          aria-label={t("resourceStrip")}
        >
          {(["auto", "on", "off"] as const).map((mode) => (
            <button
              className={resourceStripMode === mode ? "active" : ""}
              key={mode}
              onClick={() => onResourceStripMode(mode)}
              type="button"
            >
              {mode === "auto" ? t("auto") : mode === "on" ? t("on") : t("off")}
            </button>
          ))}
        </div>
      </div>
      <p className="settingsHelp">{t("help")}</p>
    </div>
  );
}

function AiPacingSettings({
  mode,
  onMode,
}: {
  mode: AiPacingMode;
  onMode(value: AiPacingMode): void;
}) {
  const t = useTranslations("Settings.aiPacing");
  return (
    <div className="aiPacingSettings">
      <div>
        <span className="settingsTitle">{t("title")}</span>
        <span className="meta">{t("localHelp")}</span>
      </div>
      <div
        className="segmented aiPacingSelector"
        role="group"
        aria-label={t("title")}
      >
        {(["manual", "paced", "fast"] as const).map((value) => (
          <button
            className={mode === value ? "active" : ""}
            key={value}
            onClick={() => onMode(value)}
            type="button"
            title={t(`help.${value}`)}
          >
            {value === "manual"
              ? t("manual")
              : value === "paced"
                ? t("paced")
                : t("fast")}
          </button>
        ))}
      </div>
      <p className="settingsHelp">{t(`help.${mode}`)}</p>
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
  onAutoDismissMs,
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
  const t = useTranslations("Settings.cues");
  const setPreset = (preset: CuePositionPreset) =>
    onPosition({ kind: "preset", preset });
  return (
    <div className="actionCueSettings">
      <div className="settingsHeaderLine">
        <div>
          <span className="settingsTitle">{t("title")}</span>
          <span className="meta">{t("subtitle")}</span>
        </div>
        <label className={`settingsToggle ${enabled ? "checked" : ""}`}>
          <input
            type="checkbox"
            checked={enabled}
            onChange={(event) => onEnabled(event.target.checked)}
          />
          {t("show")}
        </label>
        <label
          className={`settingsToggle ${automaticEffectsEnabled ? "checked" : ""}`}
        >
          <input
            type="checkbox"
            checked={automaticEffectsEnabled}
            onChange={(event) =>
              onAutomaticEffectsEnabled(event.target.checked)
            }
            disabled={!enabled}
          />
          {t("showAutomaticEffects")}
        </label>
      </div>
      <div className="settingsControlGrid">
        <label>
          {t("position")}
          <select
            value={position.kind === "preset" ? position.preset : "custom"}
            onChange={(event) => {
              if (event.target.value === "custom") return;
              setPreset(event.target.value as CuePositionPreset);
            }}
            disabled={!enabled}
          >
            <option value="top-right">{t("topRight")}</option>
            <option value="top-left">{t("topLeft")}</option>
            <option value="bottom-right">{t("bottomRight")}</option>
            <option value="bottom-left">{t("bottomLeft")}</option>
            <option value="center">{t("center")}</option>
            {position.kind === "custom" ? (
              <option value="custom">{t("custom")}</option>
            ) : null}
          </select>
        </label>
        <label>
          {t("autoDismiss")}
          <select
            value={autoDismissMs}
            onChange={(event) =>
              onAutoDismissMs(
                normalizeCueAutoDismissMs(Number(event.target.value)),
              )
            }
            disabled={!enabled}
          >
            <option value={1500}>
              {t("afterSeconds", { seconds: "1.5" })}
            </option>
            <option value={2500}>
              {t("afterSeconds", { seconds: "2.5" })}
            </option>
            <option value={4000}>{t("afterSeconds", { seconds: "4" })}</option>
            <option value={6000}>{t("afterSeconds", { seconds: "6" })}</option>
            <option value={0}>{t("notAutomatic")}</option>
          </select>
        </label>
        <button
          className="button"
          onClick={() => setPreset("top-right")}
          type="button"
          disabled={!enabled}
        >
          {t("reset")}
        </button>
      </div>
    </div>
  );
}

function AudioSettings({
  enabled,
  volume,
  onEnabled,
  onVolume,
}: {
  enabled: boolean;
  volume: number;
  onEnabled(value: boolean): void;
  onVolume(value: number): void;
}) {
  const t = useTranslations("Settings.audio");
  return (
    <div className="audioSettings">
      <button
        className={`button ${enabled ? "primary" : ""}`}
        type="button"
        onClick={() => onEnabled(!enabled)}
        title={enabled ? t("disable") : t("enable")}
      >
        {enabled ? <Volume2 size={15} /> : <VolumeX size={15} />}
        {t("title")}
      </button>
      <label>
        {t("volume")}
        <input
          type="range"
          min={0}
          max={1}
          step={0.05}
          value={volume}
          onChange={(event) => onVolume(Number(event.target.value))}
        />
      </label>
    </div>
  );
}
