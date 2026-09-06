using System.Drawing.Drawing2D;
using Netgrid.Windows;

namespace Netgrid.FirstRun;

internal sealed class PasswordVisibilityButton : Button
{
    private readonly TextBox _input;
    private readonly string _fieldLabel;

    public PasswordVisibilityButton(TextBox input, string fieldLabel)
    {
        _input = input;
        _fieldLabel = fieldLabel;
        AutoSize = true;
        MinimumSize = new Size(110, 28);
        Padding = new Padding(24, 2, 8, 2);
        TextAlign = ContentAlignment.MiddleRight;
        HidePassword();
    }

    public void HidePassword() => SetMasked(true);

    protected override void OnClick(EventArgs e)
    {
        if (Enabled) SetMasked(!_input.UseSystemPasswordChar);
        base.OnClick(e);
    }

    private void SetMasked(bool masked)
    {
        _input.UseSystemPasswordChar = masked;
        Text = UiText.Get(masked ? "first.password.show" : "first.password.hide");
        AccessibleName = $"{_fieldLabel}: {Text}";
        Invalidate();
    }

    protected override void OnPaint(PaintEventArgs e)
    {
        base.OnPaint(e);
        var scale = DeviceDpi / 96f;
        var eye = new RectangleF(7 * scale, (Height - 10 * scale) / 2, 16 * scale, 10 * scale);
        var color = Enabled ? ForeColor : SystemColors.GrayText;
        using var pen = new Pen(color, 1.4f * scale);
        using var brush = new SolidBrush(color);
        e.Graphics.SmoothingMode = SmoothingMode.AntiAlias;
        e.Graphics.DrawEllipse(pen, eye);
        e.Graphics.FillEllipse(brush, eye.X + 6 * scale, eye.Y + 3 * scale, 4 * scale, 4 * scale);
        if (!_input.UseSystemPasswordChar)
            e.Graphics.DrawLine(pen, eye.Left, eye.Bottom + 2 * scale, eye.Right, eye.Top - 2 * scale);
    }
}
