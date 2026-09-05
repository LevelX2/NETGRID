namespace Netgrid.SetupHost;

internal static class SetupHelpToolTip
{
    public const TextFormatFlags TextFlags = TextFormatFlags.WordBreak | TextFormatFlags.NoPrefix | TextFormatFlags.NoPadding;

    public static ToolTip Create()
    {
        var tip = new ToolTip
        {
            AutoPopDelay = 20000, InitialDelay = 400, ReshowDelay = 100,
            ShowAlways = true, OwnerDraw = true, IsBalloon = false,
        };
        tip.Popup += (_, e) =>
        {
            var owner = e.AssociatedControl ?? throw new InvalidOperationException("setup_tooltip_owner_missing");
            var content = tip.GetToolTip(owner);
            if (string.IsNullOrWhiteSpace(content)) throw new InvalidOperationException("setup_tooltip_text_missing");
            e.ToolTipSize = Measure(content, owner.Font, owner.DeviceDpi, Screen.FromControl(owner).WorkingArea.Width);
        };
        tip.Draw += (_, e) =>
        {
            var owner = e.AssociatedControl ?? throw new InvalidOperationException("setup_tooltip_owner_missing");
            e.DrawBackground();
            e.DrawBorder();
            var padding = Padding(owner.DeviceDpi);
            TextRenderer.DrawText(e.Graphics, e.ToolTipText, owner.Font,
                Rectangle.Inflate(e.Bounds, -padding, -padding), SystemColors.InfoText, TextFlags);
        };
        return tip;
    }

    public static Size Measure(string content, Font font, int dpi, int workingAreaWidth)
    {
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(dpi);
        ArgumentOutOfRangeException.ThrowIfNegativeOrZero(workingAreaWidth);
        var padding = Padding(dpi);
        var width = Math.Min((int)Math.Ceiling(440 * dpi / 96d), workingAreaWidth - 4 * padding);
        var contentWidth = width - 2 * padding;
        if (contentWidth <= 0) throw new InvalidOperationException("setup_tooltip_screen_too_narrow");
        // Measure and draw with the same font, width, and word-breaking flags.
        // The text and accessible description stay complete; nothing is truncated.
        var measured = TextRenderer.MeasureText(content, font, new Size(contentWidth, int.MaxValue), TextFlags);
        return new Size(width, measured.Height + 2 * padding);
    }

    public static int Padding(int dpi) => (int)Math.Ceiling(8 * dpi / 96d);
}
