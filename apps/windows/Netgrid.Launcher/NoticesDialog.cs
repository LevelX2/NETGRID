using Netgrid.Windows;

namespace Netgrid.Launcher;

internal sealed class NoticesDialog : Form
{
    private readonly RichTextBox _content;

    private NoticesDialog(string path)
    {
        Text = UiText.Get("launcher.notices.title");
        Icon = Icon.ExtractAssociatedIcon(Application.ExecutablePath) ?? SystemIcons.Application;
        StartPosition = FormStartPosition.CenterScreen;
        MinimumSize = new Size(620, 440);
        ClientSize = new Size(800, 620);
        AutoScaleMode = AutoScaleMode.Dpi;

        _content = new RichTextBox
        {
            Dock = DockStyle.Fill,
            ReadOnly = true,
            DetectUrls = false,
            WordWrap = false,
            ScrollBars = RichTextBoxScrollBars.Both,
            Text = ReadContent(path),
            AccessibleName = UiText.Get("launcher.notices.content"),
            BackColor = SystemColors.Window,
        };
        var close = new Button
        {
            Text = UiText.Get("common.close"),
            AutoSize = true,
            Padding = new Padding(18, 6, 18, 6),
            DialogResult = DialogResult.OK,
        };
        var actions = new FlowLayoutPanel
        {
            Dock = DockStyle.Bottom,
            AutoSize = true,
            FlowDirection = FlowDirection.RightToLeft,
            Padding = new Padding(12),
        };
        actions.Controls.Add(close);
        Controls.Add(_content);
        Controls.Add(actions);
        AcceptButton = close;
        CancelButton = close;
    }

    internal static string ReadContent(string path)
    {
        var fullPath = Path.GetFullPath(path);
        if (!File.Exists(fullPath)) throw new FileNotFoundException("notices_missing", fullPath);
        return File.ReadAllText(fullPath);
    }

    internal static void Show(string path)
    {
        using var dialog = new NoticesDialog(path);
        dialog.ShowDialog();
    }
}
